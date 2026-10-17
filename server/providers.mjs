import { readFile } from 'node:fs/promises';
import { lookup } from 'node:dns/promises';
import https from 'node:https';
import { isIP } from 'node:net';
import { haversine, validCoordinates, MAX_PRICE_CENTS, DEFAULT_LOCATION } from '../public/core.mjs';
import { enrichStore, sourceCoverage } from './retailers.mjs';
import { supplementStores } from './local-stores.mjs';
import { shoppingCatalog } from './shopping.mjs';
import {APP_VERSION} from '../public/version.mjs';

const UA = `LaMiaSpesa/${APP_VERSION} (+${process.env.RENDER_EXTERNAL_URL || 'https://github.com/GiuseppeSergioli/La-mia-spesa'})`;
const MAX_BYTES = 4 * 1024 * 1024;
const cache = new Map();
const pending = new Map();
const mapCooldown = new Map();

export async function cached(key, ttl, work) {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return structuredClone(hit.value);
  if (pending.has(key)) return structuredClone(await pending.get(key));
  const job = work().then(value => {
    if (cache.size >= 300) cache.delete(cache.keys().next().value);
    cache.set(key, { expires: Date.now() + ttl, value });
    return value;
  }).finally(() => pending.delete(key));
  pending.set(key, job);
  return structuredClone(await job);
}

export class UpstreamError extends Error {
  constructor(message, status=null) {super(message);this.name='UpstreamError';this.status=status;}
}

async function readJson(response) {
  if (!response.ok) throw new UpstreamError('Servizio esterno temporaneamente non disponibile. Riprova tra poco.',response.status);
  let bytes = 0, chunks = [];
  for await (const chunk of response.body) {
    bytes += chunk.length;
    if (bytes > MAX_BYTES) { await response.body.cancel().catch(() => {}); throw new UpstreamError('Risposta del servizio troppo grande. Riduci il raggio di ricerca.'); }
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new UpstreamError('Il servizio esterno ha restituito dati non validi.'); }
}

export async function geocode(query) {
  return cached(`geo:${query.toLowerCase()}`, 3_600_000, async () => {
    let data;
    try {
      const url = new URL(process.env.PHOTON_SEARCH_URL || 'https://photon.komoot.io/api/');
      if(url.protocol!=='https:' || url.username || url.password) throw new Error('Invalid geocoder endpoint');
      // Do not force a language: the provider returns the local name and public
      // instances can have different supported language sets.
      url.search = new URLSearchParams({q:query,limit:'6',lat:String(DEFAULT_LOCATION.lat),lon:String(DEFAULT_LOCATION.lon)}).toString();
      data = await readJson(await fetch(url, {headers:{'User-Agent':UA},signal:AbortSignal.timeout(12_000)}));
      if(!Array.isArray(data.features)) throw new UpstreamError('Risposta geografica non valida.');
    } catch(error) {
      // Log only a status/type, never the address or the full request URL.
      console.warn('Address lookup unavailable', {status:error.status || null,reason:error.name});
      throw new UpstreamError('La ricerca degli indirizzi non è disponibile. Puoi usare la tua posizione oppure scegliere una delle quattro zone rapide di Cagliari.',error.status || null);
    }
    const seen = new Set(),labels = new Set();
    return (data.features ?? []).flatMap(f => {
      const [lon,lat] = f.geometry?.coordinates ?? [], p = f.properties ?? {};
      if (!validCoordinates(lat,lon) || p.countrycode && p.countrycode.toUpperCase() !== 'IT') return [];
      const street = [p.street,p.housenumber].filter(Boolean).join(' ');
      const parts = [...new Set([street || p.name,p.postcode,p.city || p.town || p.village,p.state].filter(Boolean))];
      const label = parts.join(', '), key = `${lat}:${lon}`,labelKey=label.toLocaleLowerCase('it').replace(/\s+/g,' ').trim();
      if (!label || seen.has(key) || labels.has(labelKey)) return [];
      seen.add(key);labels.add(labelKey); return [{lat,lon,label}];
    });
  });
}

export async function discoverStores(lat, lon, radiusKm) {
  const endpoint=new URL(process.env.OVERPASS_SEARCH_URL || 'https://overpass.private.coffee/api/interpreter');
  if(endpoint.protocol!=='https:' || endpoint.username || endpoint.password) throw new UpstreamError('Endpoint cartografico non valido.');
  // Coordinates rounded to ~10m for reusable cache keys; filtering uses exact location.
  const key = `osm:${endpoint.href}:${lat.toFixed(4)}:${lon.toFixed(4)}:${radiusKm}`;
  return cached(key, 900_000, async () => {
    if((mapCooldown.get(endpoint.host) || 0)>Date.now()) throw new UpstreamError('Ricerca negozi temporaneamente non disponibile.',503);
    const query = `[out:json][timeout:8];nwr["shop"~"^(supermarket|discount|convenience)$"](around:${Math.ceil(radiusKm*1000)},${lat},${lon});out center tags;`;
    let data;
    try {
      let response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','User-Agent':UA},body:new URLSearchParams({data:query}),signal:AbortSignal.timeout(11_000)});
      // An operator/proxy may disable POST. GET is a documented Overpass alternative.
      if(response.status===405 || response.status===501) {
        const getUrl=new URL(endpoint);getUrl.searchParams.set('data',query);
        response=await fetch(getUrl,{headers:{'User-Agent':UA},signal:AbortSignal.timeout(11_000)});
      }
      data=await readJson(response);
      if(data.remark || !Array.isArray(data.elements)) throw new UpstreamError('La ricerca dei negozi non è completa.');
    } catch(error) {
      mapCooldown.set(endpoint.host,Date.now()+30_000);
      console.warn('Store discovery unavailable',{status:error.status || null,reason:error.name});
      throw error;
    }
    const seen = [];
    return (data.elements ?? []).flatMap(e => {
      const pos = e.center ?? e, t = e.tags ?? {}, name = t.name || t.brand || 'Supermercato';
      if(t.disused==='yes' || t.abandoned==='yes') return [];
      if (!validCoordinates(pos.lat,pos.lon)) return [];
      if (seen.some(s => s.name === name && haversine(s,pos) < .04)) return [];
      const store = {id:`osm:${e.type}/${e.id}`,osmId:`${e.type}/${e.id}`,name,chain:t.brand || name,
        address:[t['addr:street'],t['addr:housenumber'],t['addr:city']].filter(Boolean).join(' ') || 'Indirizzo non presente su OpenStreetMap',
        lat:pos.lat,lon:pos.lon,storeType:t.shop,initial:name.slice(0,1).toUpperCase(),color:'#48745e',catalogStatus:'not_connected',offers:{},demo:false};
      seen.push(store); return [store];
    });
  });
}

export function publicIPv4(ip) {
  if (isIP(ip) !== 4) return false;
  const [a,b,c] = ip.split('.').map(Number);
  return !(a===0 || a===10 || a===127 || a>=224 || a===169 && b===254 || a===172 && b>=16 && b<=31 || a===192 && b===168 || a===100 && b>=64 && b<=127 || a===192 && b===0 || a===198 && (b===18 || b===19 || b===51 && c===100) || a===203 && b===0 && c===113);
}

export function validateFeedConfig(config) {
  if (!Array.isArray(config) || config.length > 40) throw new Error('La configurazione deve contenere un array di massimo 40 feed.');
  const seen = new Set();
  for (const f of config) {
    const url = new URL(f.url);
    if (!f.id || typeof f.id !== 'string' || !/^[\w-]{1,80}$/.test(f.id) || seen.has(f.id)) throw new Error('ID feed non valido o duplicato.');
    seen.add(f.id);
    if (url.protocol !== 'https:' || url.username || url.password || url.port && url.port !== '443' || isIP(url.hostname) || !Array.isArray(f.allowedHosts) || !f.allowedHosts.includes(url.hostname)) throw new Error(`Feed ${f.id}: URL HTTPS e allowedHosts obbligatori.`);
    if (!f.store?.name || !f.store.address || !validCoordinates(f.store.lat,f.store.lon)) throw new Error(`Feed ${f.id}: dati del punto vendita incompleti.`);
    if (f.headersEnv && (typeof f.headersEnv !== 'string' || !/^[A-Z][A-Z0-9_]*$/.test(f.headersEnv))) throw new Error(`Feed ${f.id}: nome variabile headers non valido.`);
  }
  return config;
}

export async function loadFeedConfig(path) {
  try { return validateFeedConfig(JSON.parse(await readFile(path,'utf8'))); }
  catch (e) { if (e.code === 'ENOENT') return []; throw e; }
}

async function fetchFeed(config) {
  const url = new URL(config.url);
  const resolved = await lookup(url.hostname,{all:true,family:4});
  if (!resolved.length || resolved.some(x => !publicIPv4(x.address))) throw new UpstreamError('Indirizzo del feed non consentito.');
  const headers = config.headersEnv ? JSON.parse(process.env[config.headersEnv] || '{}') : {};
  if (!headers || Array.isArray(headers) || typeof headers !== 'object' || Object.values(headers).some(x => typeof x !== 'string')) throw new UpstreamError('Credenziali del feed non configurate correttamente.');
  // Pin the resolved public IP to prevent DNS rebinding. Redirects are not followed.
  return new Promise((resolve,reject) => {
    const request = https.request(url, {headers:{...headers,'User-Agent':UA,Accept:'application/json'},lookup:(_host,opts,cb)=>opts.all ? cb(null,[resolved[0]]) : cb(null,resolved[0].address,4)}, response => {
      if (response.statusCode !== 200) { response.resume(); reject(new UpstreamError('Catalogo non disponibile.')); return; }
      const chunks = []; let bytes = 0;
      response.on('data',chunk=> { bytes += chunk.length; if (bytes > MAX_BYTES) { response.destroy(); reject(new UpstreamError('Catalogo troppo grande.')); } else chunks.push(chunk); });
      response.on('error',reject);
      response.on('end',()=> {try {resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));} catch {reject(new UpstreamError('Catalogo JSON non valido.'));}});
    });
    request.setTimeout(12_000,()=>request.destroy(new UpstreamError('Timeout del catalogo.')));
    request.on('error',reject);request.end();
  });
}

const textField = (v,max=150) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
export function safeSourceUrl(value, hosts) {
  try { const u = new URL(value); return u.protocol==='https:' && !u.username && !u.password && (!u.port || u.port==='443') && hosts.includes(u.hostname) ? u.href : null; } catch {return null;}
}

export function validateCatalog(data, config, now = Date.now()) {
  if (data?.schemaVersion !== 1 || data.currency !== 'EUR' || data.storeId !== config.id || !Array.isArray(data.products) || data.products.length > 20_000) throw new UpstreamError('Formato o punto vendita del catalogo non valido.');
  const products=[], offers={}, seen=new Set();
  for (const p of data.products) {
    if (!p || !textField(p.id,100) || !/^[a-zA-Z0-9:_-]+$/.test(p.id) || ['__proto__','constructor','prototype'].includes(p.id) || seen.has(p.id) || !textField(p.name) || !textField(p.brand) || !textField(p.size) || !textField(p.category,60)) throw new UpstreamError('Prodotto non valido o duplicato nel catalogo.');
    if (p.gtin != null && !/^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(p.gtin)) throw new UpstreamError('GTIN non valido.');
    if (!['in_stock','out_of_stock','unknown'].includes(p.availability)) throw new UpstreamError('Disponibilità non valida.');
    if (p.priceCents != null && (!Number.isSafeInteger(p.priceCents) || p.priceCents < 0 || p.priceCents > MAX_PRICE_CENTS)) throw new UpstreamError('Prezzo non valido.');
    if (p.availability==='in_stock' && p.priceCents == null) throw new UpstreamError('Prezzo mancante per un prodotto disponibile.');
    if (p.quantityAvailable != null && (!Number.isInteger(p.quantityAvailable) || p.quantityAvailable < 0)) throw new UpstreamError('Quantità non valida.');
    const observed = Date.parse(p.observedAt);
    if (typeof p.observedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(p.observedAt) || !Number.isFinite(observed) || observed > now+300_000) throw new UpstreamError('Data di rilevazione non valida.');
    const sourceUrl = safeSourceUrl(p.sourceUrl,config.allowedHosts);
    if (!sourceUrl) throw new UpstreamError('Fonte del prezzo non valida.');
    // Conditional loyalty/member prices must be transformed into unconditional prices upstream.
    if (p.conditions && p.conditions !== 'none') continue;
    seen.add(p.id);
    products.push({id:p.id,name:p.name,brand:p.brand,size:p.size,category:p.category,...(p.gtin ? {gtin:p.gtin}: {})});
    const maxAgeMinutes = Number.isFinite(config.maxAgeMinutes) && config.maxAgeMinutes > 0 ? Math.min(config.maxAgeMinutes,1440) : 1440;
    offers[p.id]={priceCents:p.priceCents ?? null,availability:p.availability,observedAt:new Date(observed).toISOString(),maxAgeMinutes,currency:'EUR',sourceLabel:config.sourceLabel || config.store.name,sourceUrl,...(p.quantityAvailable != null ? {quantityAvailable:p.quantityAvailable}: {})};
  }
  return {products,offers};
}

export async function buildLiveCatalog(location, radius, configs) {
  const warnings=[],products=new Map();
  let discovered=[],mapAvailable=true;
  try {discovered=await discoverStores(location.lat,location.lon,radius);}
  catch {mapAvailable=false;}
  const eligible=configs.filter(c=>haversine(location,c.store)<=radius);
  const outcomes=await Promise.allSettled(eligible.map(c=>cached(`feed:${c.id}`,300_000,async()=>validateCatalog(await fetchFeed(c),c))));
  const stores=supplementStores(discovered.filter(s=>haversine(location,s)<=radius),location,radius);
  eligible.forEach((c,i)=> {
    const match=stores.findIndex(s=> c.store.osmId ? s.osmId===c.store.osmId : s.name.toLowerCase()===c.store.name.toLowerCase() && haversine(s,c.store)<.08);
    const old=match>=0 ? stores[match] : {};
    const store={...old,...c.store,id:`feed:${c.id}`,initial:c.store.name.slice(0,1).toUpperCase(),color:'#48745e',demo:false,offers:{},catalogStatus:'error'};
    const outcome=outcomes[i];
    if (outcome.status==='fulfilled') {
      store.catalogStatus='connected';
      for (const p of outcome.value.products) {
        const existing=products.get(p.id);
        if (existing && ['name','brand','size','gtin'].some(k=>(existing[k] ?? '')!==(p[k] ?? ''))) {warnings.push(`Un prodotto con identificativo discordante è stato escluso da ${store.name}.`);continue;}
        products.set(p.id,p);store.offers[p.id]=outcome.value.offers[p.id];
      }
    } else warnings.push(`Catalogo di ${store.name} non disponibile. I prezzi non sono stati stimati.`);
    if (match>=0) stores[match]=store;else stores.push(store);
  });
  if (!configs.length) warnings.push('Nessun catalogo prezzi collegato. Puoi comporre il carrello con prodotti di riferimento e prezzi simulati, uguali per tutti i negozi. Disponibilità non verificata.');
  const catalog=[...products.values()];
  const linkedStores=stores.map(enrichStore);
  const localStoreCount=linkedStores.filter(s=>s.discoverySource==='verified_directory').length;
  if(!mapAvailable)warnings.unshift(localStoreCount?'La ricerca sulla mappa non risponde. Mostriamo un elenco locale parziale, verificato il 17/10/2026, filtrato per distanza.':'La ricerca sulla mappa non risponde. Non possiamo stabilire quanti negozi siano presenti: riprova tra poco.');
  return {mode:'live',...shoppingCatalog(catalog,linkedStores),stores:linkedStores,storeDiscovery:{status:mapAvailable?'online':localStoreCount?'local_directory':'unavailable',mapAvailable,localStoreCount,verifiedOn:'2026-10-17'},retailerSources:sourceCoverage(linkedStores),coverage:{foundStores:linkedStores.length,priceConnectedStores:linkedStores.filter(s=>s.catalogStatus==='connected').length,exhaustive:false,mapAvailable},warnings:[...new Set(warnings)],generatedAt:new Date().toISOString(),attribution:'© OpenStreetMap contributors · ODbL. Elenco locale integrativo da schede ufficiali, verifica 17/10/2026. Copertura parziale. Prezzi simulati: riferimenti pubblici datati o stime indicative del catalogo; disponibilità locale non verificata. Prezzi online e in negozio possono differire.'};
}
