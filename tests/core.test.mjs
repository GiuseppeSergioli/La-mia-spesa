import test from 'node:test';
import assert from 'node:assert/strict';
import { compareBasket, offerStatus, normalizeList, nearbyStores, haversine, validCoordinates, savingsBetweenComplete, lowestPrice, money } from '../public/core.mjs';
import { createDemoData, demoLocation, sampleList } from '../public/demo.mjs';
import { MIN_RADIUS_KM, MAX_RADIUS_KM, DEFAULT_RADIUS_KM, validRadius, normalizeRadius } from '../public/core.mjs';

const now=Date.parse('2026-10-17T12:00:00Z');
const products=[{id:'p',name:'Pasta',brand:'A',size:'500 g'},{id:'b',name:'Biscotti',brand:'B',size:'800 g'}];
const offer=(priceCents,availability='in_stock',extra={})=>({priceCents,availability,observedAt:'2026-10-17T11:00:00Z',...extra});
const store=(id,offers,distanceKm=1)=>({id,name:id,distanceKm,offers});
const list=[{productId:'p',quantity:3},{productId:'b',quantity:2}];

test('prices are multiplied and added as exact integer cents',()=>{
  const [r]=compareBasket(list,products,[store('A',{p:offer(119),b:offer(279)})],now);
  assert.equal(r.totalCents,915);assert.equal(r.complete,true);assert.equal(r.rows[0].lineTotalCents,357);
});
test('complete baskets sort by total; a cheap partial cannot win',()=>{
  const results=compareBasket(list,products,[store('Expensive',{p:offer(150),b:offer(300)}),store('Cheap partial',{p:offer(1)}),store('Best',{p:offer(100),b:offer(200)})],now);
  assert.deepEqual(results.map(r=>r.store.id),['Best','Expensive','Cheap partial']);assert.equal(results[2].complete,false);
});
test('out-of-stock lines are excluded from subtotal and retained in detail',()=>{
  const [r]=compareBasket(list,products,[store('A',{p:offer(119),b:offer(200,'out_of_stock')})],now);
  assert.equal(r.totalCents,357);assert.equal(r.missingCount,1);assert.equal(r.rows[1].status,'out_of_stock');assert.equal(r.rows[1].lineTotalCents,null);
});
test('missing offers are unknown, not reported as out of stock',()=>{
  assert.equal(offerStatus(undefined,1,now),'unknown');
});
test('stale prices never contribute to a total',()=>{
  const old=offer(1,'in_stock',{observedAt:'2026-10-15T12:00:00Z'});
  assert.equal(offerStatus(old,1,now),'stale');assert.equal(lowestPrice('p',[store('A',{p:old})],1,now),null);
});
test('custom freshness limit is applied',()=>{
  assert.equal(offerStatus(offer(100,'in_stock',{maxAgeMinutes:30}),1,now),'stale');
});
test('future and malformed observation dates are not trusted',()=>{
  assert.equal(offerStatus(offer(100,'in_stock',{observedAt:'2027-01-01Z'}),1,now),'stale');
  assert.equal(offerStatus(offer(100,'in_stock',{observedAt:'invalid'}),1,now),'stale');
});
test('insufficient stock does not count a requested line as complete',()=>{
  const [r]=compareBasket(list,products,[store('A',{p:offer(119,'in_stock',{quantityAvailable:2}),b:offer(100)})],now);
  assert.equal(r.rows[0].status,'insufficient');assert.equal(r.totalCents,200);assert.equal(r.complete,false);
});
test('null, negative, floating, unsafe and nonnumeric prices are never silently zero',()=>{
  for(const price of [null,-1,1.2,NaN,'119',Number.MAX_SAFE_INTEGER]) assert.equal(offerStatus(offer(price),1,now),'unknown');
  assert.equal(offerStatus(offer(0),1,now),'available');
});
test('empty lists never produce a winner',()=>{
  assert.deepEqual(compareBasket([],products,[store('A',{})],now),[]);
});
test('savings compare complete baskets only',()=>{
  const results=compareBasket(list,products,[store('A',{p:offer(100),b:offer(100)}),store('B',{p:offer(200),b:offer(100)}),store('Partial',{p:offer(9999)})],now);
  assert.equal(savingsBetweenComplete(results),300);assert.equal(savingsBetweenComplete([results[0],results[2]]),null);
});
test('normalization rejects duplicates, unknown products and invalid quantities',()=>{
  const result=normalizeList([{productId:'p',quantity:2},{productId:'p',quantity:1},{productId:'b',quantity:0},{productId:'none',quantity:1},null,{productId:'b',quantity:1.5}],products);
  assert.deepEqual(result,[{productId:'p',quantity:2}]);assert.deepEqual(normalizeList({},products),[]);
});
test('two package sizes remain distinct products without automatic substitutions',()=>{
  const p=[{id:'p:500g'},{id:'p:1000g'}];
  const [r]=compareBasket([{productId:'p:500g',quantity:1}],p,[store('A',{'p:1000g':offer(100)})],now);
  assert.equal(r.complete,false);assert.equal(r.rows[0].status,'unknown');
});
test('radius excludes even a cheaper store outside the area',()=>{
  const stores=[{id:'near',lat:demoLocation.lat,lon:demoLocation.lon},{id:'far',lat:demoLocation.lat+0.1,lon:demoLocation.lon}];
  assert.deepEqual(nearbyStores(stores,demoLocation,5).map(s=>s.id),['near']);assert.ok(haversine(stores[0],stores[1])>11);
});
test('coordinates reject missing, nonnumeric and infinite values',()=>{
  assert.equal(validCoordinates(45,9),true);for(const [a,b] of [[null,null],[Infinity,1],['45',9],[91,9],[0,181]])assert.equal(validCoordinates(a,b),false);
});
test('partial results prioritize coverage and never show made-up savings',()=>{
  const r=compareBasket(list,products,[store('No data',{}),store('One known',{p:offer(999)})],now);
  assert.equal(r[0].store.id,'One known');assert.equal(savingsBetweenComplete(r),null);
});
test('demo yields a real exercise of complete, out of stock and insufficient rows',()=>{
  const data=createDemoData(),r=compareBasket(sampleList,data.products,nearbyStores(data.stores,demoLocation,5));
  assert.equal(r.length,5);assert.equal(r.filter(x=>x.complete).length,2);assert.equal(r[0].store.name,'Mercato Verde');assert.ok(r.some(x=>x.rows.some(y=>y.status==='insufficient')));assert.ok(r.some(x=>x.rows.some(y=>y.status==='out_of_stock')));
});
test('Italian currency is formatted correctly',()=>{assert.match(money(119),/1,19/);});

test('all twelve half-kilometre radius choices are valid and no value exceeds 6 km',()=>{
  assert.equal(MIN_RADIUS_KM,.5);assert.equal(MAX_RADIUS_KM,6);
  for(let r=.5;r<=6;r+=.5)assert.equal(validRadius(r),true,r);
  for(const r of [0,.49,.6,1.1,6.01,6.5,25,Infinity,NaN,null,'3'])assert.equal(validRadius(r),false,String(r));
});
test('old saved distances migrate into the new limits without rejecting fractions',()=>{
  assert.equal(normalizeRadius(25),6);assert.equal(normalizeRadius(6.5),6);assert.equal(normalizeRadius(.5),.5);assert.equal(normalizeRadius(2.5),2.5);assert.equal(normalizeRadius(2.3),2.5);assert.equal(normalizeRadius(.1),.5);assert.equal(normalizeRadius(null),DEFAULT_RADIUS_KM);
});
test('Cagliari demo stores move together with the demo centre',()=>{
  assert.match(demoLocation.label,/Cagliari/);
  const data=createDemoData();assert.equal(nearbyStores(data.stores,demoLocation,6).length,5);assert.equal(nearbyStores(data.stores,demoLocation,.5).length,0);assert.equal(nearbyStores(data.stores,demoLocation,1).length,1);
});
