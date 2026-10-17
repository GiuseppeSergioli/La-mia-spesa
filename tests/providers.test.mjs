import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCatalog, validateFeedConfig, publicIPv4, safeSourceUrl, cached } from '../server/providers.mjs';
const now=Date.parse('2026-10-17T12:00:00Z');
const config={id:'store',url:'https://feed.example.com/catalog.json',allowedHosts:['feed.example.com','shop.example.com'],store:{name:'Supermarket',address:'Milano',lat:45,lon:9},maxAgeMinutes:120};
const p={id:'sku:pasta-500',name:'Pasta',brand:'Marca',size:'500 g',category:'Pasta e riso',priceCents:119,availability:'in_stock',observedAt:'2026-10-17T11:00:00Z',sourceUrl:'https://shop.example.com/store/pasta',conditions:'none'};
const data=(product=p)=>({schemaVersion:1,currency:'EUR',storeId:'store',products:[product]});

test('valid per-store feed preserves source, timestamps and integer prices',()=>{
  const c=validateCatalog(data(),config,now);assert.equal(c.products.length,1);assert.equal(c.offers[p.id].priceCents,119);assert.equal(c.offers[p.id].maxAgeMinutes,120);assert.equal(c.offers[p.id].sourceUrl,p.sourceUrl);
});
test('wrong store, schema and currency are rejected',()=>{for(const change of [{storeId:'other'},{currency:'USD'},{schemaVersion:2}])assert.throws(()=>validateCatalog({...data(),...change},config,now));});
test('invalid prices, timestamps and stock values are rejected',()=>{
  for(const change of [{priceCents:1.19},{priceCents:-1},{priceCents:null},{priceCents:'119'},{observedAt:'bad'},{observedAt:'2027-01-01Z'},{observedAt:'2026-10-17T11:00:00'},{availability:'maybe'},{quantityAvailable:-1},{gtin:'123'}])assert.throws(()=>validateCatalog(data({...p,...change}),config,now));
});
test('duplicate IDs and malformed product names are rejected',()=>{
  assert.throws(()=>validateCatalog({...data(),products:[p,p]},config,now));assert.throws(()=>validateCatalog(data({...p,name:''}),config,now));
  for(const id of ['__proto__','constructor','prototype'])assert.throws(()=>validateCatalog(data({...p,id}),config,now));
});
test('conditional loyalty discounts are excluded',()=>{
  const c=validateCatalog(data({...p,conditions:'member_card'}),config,now);assert.equal(c.products.length,0);assert.deepEqual(c.offers,{});
});
test('explicitly out-of-stock product may have no price',()=>{
  const c=validateCatalog(data({...p,availability:'out_of_stock',priceCents:null}),config,now);assert.equal(c.offers[p.id].availability,'out_of_stock');assert.equal(c.offers[p.id].priceCents,null);
});
test('price sources must be HTTPS on operator-allowed domains',()=>{
  for(const url of ['javascript:alert(1)','http://shop.example.com/p','https://evil.example/p','https://user:pass@shop.example.com/p','https://shop.example.com:8443/p'])assert.equal(safeSourceUrl(url,config.allowedHosts),null);
  assert.equal(safeSourceUrl(p.sourceUrl,config.allowedHosts),p.sourceUrl);
});
test('configuration rejects arbitrary hosts, local URLs and duplicate feed IDs',()=>{
  assert.equal(validateFeedConfig([config]).length,1);
  for(const change of [{url:'http://localhost/p'},{allowedHosts:[]},{url:'https://127.0.0.1/p',allowedHosts:['127.0.0.1']},{store:{...config.store,lat:999}}])assert.throws(()=>validateFeedConfig([{...config,...change}]));
  assert.throws(()=>validateFeedConfig([config,config]));
});
test('private, loopback, link-local and reserved IPs cannot be feed destinations',()=>{
  for(const ip of ['127.0.0.1','10.0.0.1','172.16.0.1','192.168.1.1','169.254.169.254','0.0.0.0','100.64.0.1','198.18.0.1','203.0.113.2','224.0.0.1','::1','::ffff:127.0.0.1'])assert.equal(publicIPv4(ip),false,ip);
  assert.equal(publicIPv4('8.8.8.8'),true);
});
test('cache coalesces concurrent lookups and protects its stored data',async()=>{
  let calls=0;
  const work=async()=>{calls++;await new Promise(r=>setTimeout(r,5));return {items:[1]};};
  const [a,b]=await Promise.all([cached('unit:cache',1000,work),cached('unit:cache',1000,work)]);
  a.items.push(2);assert.equal(calls,1);assert.deepEqual(b.items,[1]);assert.deepEqual((await cached('unit:cache',1000,work)).items,[1]);
});
