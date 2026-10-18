import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/index.mjs';
import {APP_VERSION} from '../public/version.mjs';
let server,base;
const originalFetch=globalThis.fetch;
before(async()=>{
  globalThis.fetch=(url,options)=>String(url).startsWith('https://overpass.private.coffee/') ? Promise.resolve(Response.json({elements:[]})) : originalFetch(url,options);
  server=createApp();await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}`;
});
after(async()=>{await new Promise(r=>server.close(r));globalThis.fetch=originalFetch;});
test('health and live capability are explicit',async()=>{const res=await fetch(`${base}/api/health`);assert.equal(res.status,200);assert.equal((await res.json()).ok,true);const s=await (await fetch(`${base}/api/status`)).json();assert.equal(s.live,true);assert.equal(typeof s.configuredStores,'number');assert.equal(s.version,APP_VERSION);});
test('root page serves Italian application with security headers',async()=>{const res=await fetch(base);assert.match(res.headers.get('content-type'),/text\/html/);assert.match(res.headers.get('content-security-policy'),/script-src 'self'/);assert.equal(res.headers.get('x-content-type-options'),'nosniff');assert.match(await res.text(),/<html lang="it">/);});
test('ES modules use JavaScript content type',async()=>{const res=await fetch(`${base}/core.mjs`);assert.match(res.headers.get('content-type'),/javascript/);});
test('install manifest, worker and logo icons are served with correct content types and cache policy',async()=>{
  const manifest=await fetch(`${base}/manifest.webmanifest`);assert.match(manifest.headers.get('content-type'),/application\/manifest\+json/);assert.equal((await manifest.json()).name,'La mia spesa');
  const worker=await fetch(`${base}/sw.js?v=${APP_VERSION}`);assert.match(worker.headers.get('content-type'),/javascript/);assert.equal(worker.headers.get('cache-control'),'no-cache');assert.match(await worker.text(),new RegExp(APP_VERSION.replaceAll('.','\\.')));
  const icon=await fetch(`${base}/assets/icon-192.png`);assert.equal(icon.headers.get('content-type'),'image/png');assert.equal(icon.status,200);
});
test('invalid radius and coordinates fail before external calls',async()=>{for(const path of ['/api/catalog?lat=45&lon=9&radius=999','/api/catalog?lat=nan&lon=9&radius=5','/api/catalog?lat=&lon=&radius=5','/api/catalog?lat=45&lon=9&radius=0']){const r=await fetch(base+path);assert.equal(r.status,400,path);}});
test('short geocoding input is rejected without an external request',async()=>{const r=await fetch(`${base}/api/geocode?q=a`);assert.equal(r.status,400);});
test('server sources and config cannot be read as static files',async()=>{for(const path of ['/server/index.mjs','/config/feeds.example.json','/%2e%2e%2fpackage.json'])assert.equal((await fetch(base+path)).status,404);});
test('invalid shopping lists are rejected by compare API',async()=>{for(const list of [[],[{productId:'p',quantity:0}],[{productId:'p',quantity:1.5}],[{productId:'p',quantity:1},{productId:'p',quantity:1}]]){const r=await fetch(`${base}/api/compare`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lat:45,lon:9,radius:5,list})});assert.equal(r.status,400);}});
test('cross-site compare calls are refused',async()=>{const r=await fetch(`${base}/api/compare`,{method:'POST',headers:{Origin:'https://evil.example','Content-Type':'application/json'},body:'{}'});assert.equal(r.status,403);});
test('malformed JSON produces a clean error',async()=>{const r=await fetch(`${base}/api/compare`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{'});assert.equal(r.status,400);assert.equal((await r.json()).error,'JSON non valido.');});
test('unsupported method and nonexistent API return errors',async()=>{assert.equal((await fetch(`${base}/api/status`,{method:'DELETE'})).status,405);assert.equal((await fetch(`${base}/api/nope`)).status,404);});
test('server rejects radius above 6 km or outside half-kilometre increments',async()=>{
  for(const radius of ['6.5','25','0.6','5.9']){const res=await fetch(`${base}/api/catalog?lat=39.2238&lon=9.1217&radius=${radius}`);assert.equal(res.status,400);assert.match((await res.json()).error,/6 km/);}
  const res=await fetch(`${base}/api/compare`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lat:39.2238,lon:9.1217,radius:6.5,list:[{productId:'p',quantity:1}]})});assert.equal(res.status,400);
});
test('catalog accepts fractional radius and advertises incomplete map coverage',async()=>{
  for(const radius of [.5,1.5,6]){
    const res=await fetch(`${base}/api/catalog?lat=39.2238&lon=9.1217&radius=${radius}`);assert.equal(res.status,200);const data=await res.json();assert.equal(data.coverage.exhaustive,false);assert.equal(data.coverage.priceConnectedStores,0);assert.equal(data.referenceCatalog.enabled,true);assert.equal(data.products.length,384);assert.ok(data.products.every(p=>p.reference));assert.ok(data.stores.every(s=>Object.keys(s.offers).length===0));
  }
});
test('status identifies Cagliari and the 6-km limit',async()=>{const data=await(await fetch(`${base}/api/status`)).json();assert.equal(data.region,'Cagliari');assert.deepEqual(data.radius,{min:.5,max:6,step:.5});});

test('real nearby supermarkets can be compared with estimated reference products',async()=>{
  const catalog=await(await fetch(`${base}/api/catalog?lat=39.2238&lon=9.1217&radius=3`)).json();
  assert.ok(catalog.stores.length>=2);const p=catalog.products.find(p=>p.id==='reference:spaghetti-500');assert.ok(p);
  const response=await fetch(`${base}/api/compare`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lat:39.2238,lon:9.1217,radius:3,list:[{productId:p.id,quantity:3,priceCents:1}],prices:{[p.id]:1}})});
  assert.equal(response.status,200);const data=await response.json();assert.ok(data.results.length>=2);
  for(const result of data.results){assert.equal(result.totalCents,177);assert.equal(result.complete,false);assert.equal(result.priceComplete,true);assert.equal(result.simulatedCount,1);assert.equal(result.rows[0].status,'estimated');assert.equal(result.rows[0].availabilityStatus,'unknown');assert.equal(result.rows[0].reference.sourceUrl,p.reference.sourceUrl);}
});
test('an unknown product is still rejected instead of receiving an arbitrary estimate',async()=>{
  const response=await fetch(`${base}/api/compare`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lat:39.2238,lon:9.1217,radius:3,list:[{productId:'made-up-price',quantity:1}]})});assert.equal(response.status,409);
});

test('a basket can include the full 384-product selection after the catalog expansion',async()=>{
  const catalog=await(await fetch(`${base}/api/catalog?lat=39.2238&lon=9.1217&radius=3`)).json();
  const response=await fetch(`${base}/api/compare`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lat:39.2238,lon:9.1217,radius:3,list:catalog.products.map(p=>({productId:p.id,quantity:1}))})});
  assert.equal(response.status,200);const data=await response.json();assert.ok(data.results.length>=2);assert.ok(data.results.every(result=>result.simulatedCount===384 && result.priceComplete));
});
