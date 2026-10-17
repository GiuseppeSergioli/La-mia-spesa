import test from 'node:test';
import assert from 'node:assert/strict';
import { verifiedLocalStores,localStoresNear,supplementStores } from '../server/local-stores.mjs';
import { DEFAULT_LOCATION,haversine,validCoordinates } from '../public/core.mjs';
import { enrichStore } from '../server/retailers.mjs';

test('local directory contains eight dated real locations and no price data',()=>{
  assert.equal(verifiedLocalStores.length,8);assert.equal(new Set(verifiedLocalStores.map(s=>s.id)).size,8);
  for(const store of verifiedLocalStores){assert.ok(validCoordinates(store.lat,store.lon));assert.equal(store.demo,false);assert.deepEqual(store.offers,{});assert.equal(store.catalogStatus,'not_connected');assert.equal(store.verifiedOn,'2026-10-17');assert.ok(new URL(store.officialUrl).protocol==='https:');}
});
test('local directory always respects the chosen radius, including 500 metres',()=>{
  for(const radius of [.5,1,3,6])for(const store of localStoresNear(DEFAULT_LOCATION,radius))assert.ok(haversine(DEFAULT_LOCATION,store)<=radius);
  assert.ok(localStoresNear(DEFAULT_LOCATION,3).length>0);
  assert.equal(localStoresNear({lat:45,lon:9},6).length,0);
});
test('a map entry and the same local store are merged without duplicates',()=>{
  const local=verifiedLocalStores[0],osm={...local,id:'osm:node/99',discoverySource:'osm',name:'Eurospin'};
  const stores=supplementStores([osm],local,.5);assert.equal(stores.filter(s=>haversine(s,local)<.1 && s.chain==='Eurospin').length,1);assert.ok(stores.some(s=>s.id===osm.id));
});
test('enriching a local store preserves its exact official page',()=>{
  const store=verifiedLocalStores[0],enriched=enrichStore(store);assert.equal(enriched.officialUrl,store.officialUrl);assert.equal(enriched.linkScope,'store');
});
