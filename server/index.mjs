import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';
import { geocode, buildLiveCatalog, loadFeedConfig, UpstreamError } from './providers.mjs';
import { validCoordinates, validRadius, compareBasket, nearbyStores } from '../public/core.mjs';
import {APP_VERSION} from '../public/version.mjs';

const ROOT=fileURLToPath(new URL('../public/',import.meta.url));
const configPath=process.env.FEEDS_CONFIG || fileURLToPath(new URL('../config/feeds.json',import.meta.url));
const feedConfig=await loadFeedConfig(configPath);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8'};
const limits=new Map();
let active=0;

function send(res,status,data) {
  const body=JSON.stringify(data);res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(body);
}
function coordinates(q) {
  const lat=q.get('lat')?.trim(),lon=q.get('lon')?.trim(),radius=q.get('radius')?.trim();
  if (!lat || !lon || !radius || !validCoordinates(Number(lat),Number(lon)) || !validRadius(Number(radius))) throw new RangeError('Posizione o raggio non validi. Scegli da 0,5 a 6 km, a passi di 0,5 km.');
  return {location:{lat:Number(lat),lon:Number(lon)},radius:Number(radius)};
}
async function jsonBody(req) {
  let bytes=0,chunks=[];
  if (!(req.headers['content-type'] || '').startsWith('application/json')) throw new RangeError('Content-Type application/json richiesto.');
  for await (const c of req) { bytes+=c.length;if (bytes>65_536) throw new RangeError('Lista troppo grande.');chunks.push(c); }
  try {return JSON.parse(Buffer.concat(chunks).toString('utf8'));} catch {throw new RangeError('JSON non valido.');}
}
function rateLimited(req) {
  const ip=req.socket.remoteAddress || 'unknown',now=Date.now();
  if (limits.size>5000) for (const [key,val] of limits) if (val.reset<now) limits.delete(key);
  let item=limits.get(ip);
  if (!item || item.reset<now) {item={count:0,reset:now+60_000};limits.set(ip,item);}
  return ++item.count>60;
}

export function createApp() {
  return createServer(async (req,res)=> {
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('X-Frame-Options','DENY');
    res.setHeader('Permissions-Policy','geolocation=(self), camera=(), microphone=()');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; worker-src 'self'; manifest-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
    req.setTimeout(35_000);
    let acquired=false;
    try {
      const url=new URL(req.url,'http://localhost');
      const api=url.pathname.startsWith('/api/');
      if (req.method==='GET' && url.pathname==='/api/health') return send(res,200,{ok:true,service:'spesina'});
      if (api) {
        if (rateLimited(req)) {res.setHeader('Retry-After','60');return send(res,429,{error:'Troppe richieste. Attendi un minuto e riprova.'});}
        if (req.method==='GET' && url.pathname==='/api/status') return send(res,200,{live:true,configuredStores:feedConfig.length,version:APP_VERSION,estimatedShopping:true,region:'Cagliari',radius:{min:0.5,max:6,step:0.5}});
        if (!['GET','POST'].includes(req.method)) return send(res,405,{error:'Metodo non supportato.'});
        if (active>=8) return send(res,503,{error:'Il servizio è occupato. Riprova tra poco.'});
        active++;acquired=true;
        if (req.method==='GET' && url.pathname==='/api/geocode') {
          const q=(url.searchParams.get('q') || '').trim();
          if (q.length<3 || q.length>200) throw new RangeError('Inserisci un indirizzo o una città, da 3 a 200 caratteri.');
          return send(res,200,{results:await geocode(q)});
        }
        if (req.method==='GET' && url.pathname==='/api/catalog') {
          const {location,radius}=coordinates(url.searchParams);
          return send(res,200,await buildLiveCatalog(location,radius,feedConfig));
        }
        if (req.method==='POST' && url.pathname==='/api/compare') {
          const origin=req.headers.origin;
          if (origin && new URL(origin).host!==req.headers.host) return send(res,403,{error:'Origine non consentita.'});
          const body=await jsonBody(req);
          const {location,radius}=coordinates(new URLSearchParams({lat:body.lat,lon:body.lon,radius:body.radius}));
          if (!Array.isArray(body.list) || !body.list.length || body.list.length>500 || body.list.some(x=>!x || typeof x.productId!=='string' || !Number.isInteger(x.quantity) || x.quantity<1 || x.quantity>99) || new Set(body.list.map(x=>x.productId)).size!==body.list.length) throw new RangeError('Lista non valida: usa quantità intere da 1 a 99 e prodotti distinti.');
          const catalog=await buildLiveCatalog(location,radius,feedConfig);
          const ids=new Set(catalog.products.map(p=>p.id));
          if (body.list.some(x=>!ids.has(x.productId))) return send(res,409,{error:'Il catalogo è cambiato. Aggiorna i prodotti prima del confronto.'});
          return send(res,200,{results:compareBasket(body.list,catalog.products,nearbyStores(catalog.stores,location,radius),Date.now(),{allowEstimates:true}),warnings:catalog.warnings,generatedAt:catalog.generatedAt});
        }
        return send(res,404,{error:'API non trovata.'});
      }
      if (!['GET','HEAD'].includes(req.method)) return send(res,405,{error:'Metodo non supportato.'});
      const relative=decodeURIComponent(url.pathname==='/' ? '/index.html' : url.pathname);
      const path=resolve(ROOT,'.'+relative);
      if (!path.startsWith(ROOT.endsWith(sep) ? ROOT : ROOT+sep) || !mime[extname(path)]) return send(res,404,{error:'File non trovato.'});
      const info=await stat(path);
      if (!info.isFile()) return send(res,404,{error:'File non trovato.'});
      const file=await readFile(path);
      res.writeHead(200,{'Content-Type':mime[extname(path)],'Cache-Control':'no-cache','Content-Length':file.length});
      res.end(req.method==='HEAD' ? undefined : file);
    } catch(e) {
      if (res.headersSent) {res.end();return;}
      if (e instanceof RangeError || e instanceof URIError || e instanceof SyntaxError) send(res,400,{error:e.message});
      else if (e.code==='ENOENT') send(res,404,{error:'File non trovato.'});
      else if (e instanceof UpstreamError) send(res,502,{error:e.message});
      else { console.error('Request failed:',e.name);send(res,502,{error:'Non riusciamo a contattare il servizio esterno. Riprova oppure esplora la demo.'}); }
    } finally {if (acquired) active--;}
  });
}

if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const port=Number(process.env.PORT || 3000),server=createApp();
  server.requestTimeout=40_000;server.headersTimeout=10_000;server.maxHeadersCount=60;
  server.listen(port,'0.0.0.0',()=>console.log(`Spesina avviata su http://localhost:${port} · ${feedConfig.length} cataloghi configurati`));
  const stop=()=>server.close(()=>process.exit(0));process.on('SIGTERM',stop);process.on('SIGINT',stop);
}
