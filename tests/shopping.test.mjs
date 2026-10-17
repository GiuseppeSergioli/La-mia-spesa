import test from 'node:test';
import assert from 'node:assert/strict';
import {compareBasket,comparisonSummary,priceForProduct,referencePrice,savingsBetweenComplete} from '../public/core.mjs';
import {referenceProducts,referenceCategories} from '../server/reference-catalog.mjs';
import {shoppingCatalog} from '../server/shopping.mjs';
const now=Date.parse('2026-10-17T17:00:00Z'),pasta=referenceProducts[0],latte=referenceProducts.find(p=>p.id==='reference:latte-ps-1000');
const store=(id,offers={},distanceKm=1)=>({id,name:id,offers,distanceKm});
const offer=(priceCents,extra={})=>({priceCents,availability:'in_stock',observedAt:'2026-10-17T16:00:00Z',sourceUrl:'https://example.com/product',sourceLabel:'Fonte del punto vendita',...extra});
const compare=(list,products,stores)=>compareBasket(list,products,stores,now,{allowEstimates:true});

test('reference products have dated public sources, integer estimates and distinct formats',()=>{
  assert.equal(referenceProducts.length,30);assert.equal(referenceCategories.length-1,8);assert.equal(new Set(referenceProducts.map(p=>p.id)).size,30);
  for(const p of referenceProducts){assert.ok(p.generic);assert.ok(referenceCategories.some(c=>c.id===p.category));assert.ok(referencePrice(p));assert.equal(new URL(p.reference.sourceUrl).hostname,'spesaonline.conad.it');assert.equal(p.reference.checkedOn,'2026-10-17');}
  assert.equal(latte.reference.priceCents,130);assert.match(latte.reference.method,/proporzionale/);
});
test('empty price feeds still provide a shopping catalog without creating store offers',()=>{
  const stores=[store('Real supermarket')],original=structuredClone(stores),data=shoppingCatalog([],stores,now);
  assert.equal(data.products.length,30);assert.equal(data.referenceCatalog.enabled,true);assert.deepEqual(stores,original);assert.deepEqual(stores[0].offers,{});
});
test('estimated rows count in the sum but never become verified stock or complete availability',()=>{
  const [r]=compare([{productId:pasta.id,quantity:3},{productId:latte.id,quantity:2}],[pasta,latte],[store('A')]);
  assert.equal(r.totalCents,437);assert.equal(r.simulatedTotalCents,437);assert.equal(r.verifiedTotalCents,0);assert.equal(r.priceComplete,true);assert.equal(r.complete,false);assert.equal(r.simulatedCount,2);assert.equal(r.availableCount,0);assert.equal(r.rows[0].availabilityStatus,'unknown');assert.equal(r.rows[0].offer,null);
});
test('identical estimates produce a tie and no invented savings or verified winner',()=>{
  const results=compare([{productId:pasta.id,quantity:2}],[pasta],[store('B',{},2),store('A',{},1)]),summary=comparisonSummary(results);
  assert.equal(summary.ties.length,2);assert.equal(summary.hasEstimates,true);assert.equal(summary.verifiedWinner,false);assert.equal(savingsBetweenComplete(results),null);assert.ok(results.every(r=>r.totalCents===118));
});
test('mixed comparisons use real available prices first and disclose the estimated portion',()=>{
  const [r]=compare([{productId:pasta.id,quantity:2},{productId:latte.id,quantity:1}],[pasta,latte],[store('A',{[pasta.id]:offer(75)})]);
  assert.equal(r.totalCents,280);assert.equal(r.verifiedTotalCents,150);assert.equal(r.simulatedTotalCents,130);assert.equal(r.rows[0].simulated,false);assert.equal(r.rows[1].simulated,true);assert.equal(r.complete,false);assert.equal(r.priceComplete,true);
});
test('an explicitly exhausted or insufficient line is never filled by a simulated price',()=>{
  for(const raw of [offer(70,{availability:'out_of_stock'}),offer(70,{quantityAvailable:1}),offer(70,{availability:'unknown',quantityAvailable:0}),offer(70,{availability:'out_of_stock',observedAt:'2026-10-10T10:00:00Z'})]){
    const [r]=compare([{productId:pasta.id,quantity:2}],[pasta],[store('A',{[pasta.id]:raw})]);assert.equal(r.totalCents,0);assert.equal(r.priceComplete,false);assert.equal(r.rows[0].simulated,false);assert.equal(r.rows[0].lineTotalCents,null);
  }
});
test('a stale offer can use a separately dated reference without refreshing the old price',()=>{
  const old=offer(1,{observedAt:'2026-10-10T10:00:00Z'}),[r]=compare([{productId:pasta.id,quantity:1}],[pasta],[store('A',{[pasta.id]:old})]);
  assert.equal(r.rows[0].status,'estimated');assert.equal(r.rows[0].availabilityStatus,'stale');assert.equal(r.totalCents,59);assert.equal(r.rows[0].offer.observedAt,old.observedAt);assert.equal(r.rows[0].reference.checkedOn,'2026-10-17');
});
test('absent or invalid references never turn missing prices into zero-cost products',()=>{
  for(const ref of [undefined,{...pasta.reference,priceCents:0},{...pasta.reference,priceCents:1.5},{...pasta.reference,sourceUrl:'javascript:alert(1)'},{...pasta.reference,checkedOn:'invalid'}]){
    const p={...pasta,reference:ref},[r]=compare([{productId:p.id,quantity:1}],[p],[store('A')]);assert.equal(r.priceComplete,false);assert.equal(r.rows[0].lineTotalCents,null);assert.equal(r.pricedCount,0);
  }
});
test('a feed product can reuse the central verified price as a clearly separate reference elsewhere',()=>{
  const p={id:'sku:exact',name:'Spaghetti',brand:'Marca',size:'500 g',category:'pasta'},stores=[store('A',{[p.id]:offer(100)}),store('B',{[p.id]:offer(200)}),store('C',{[p.id]:offer(300)}),store('Missing')],data=shoppingCatalog([p],stores,now);
  assert.equal(data.products[0].reference.priceCents,200);assert.equal(data.products[0].reference.checkedOn,'2026-10-17');assert.deepEqual(stores[3].offers,{});
  const results=compare([{productId:p.id,quantity:1}],data.products,stores);assert.equal(results.find(r=>r.store.id==='Missing').rows[0].simulated,true);assert.ok(results.filter(r=>r.store.id!=='Missing').every(r=>r.complete));
});
test('reference products do not replace exact feed products or assume a price for unrelated items',()=>{
  const p={id:'sku:unique',name:'Prodotto specifico',brand:'Marca',size:'1 confezione',category:'Unica'},data=shoppingCatalog([p],[store('A')],now);
  assert.ok(data.products.some(product=>product.id===p.id));assert.equal(data.products.find(product=>product.id===p.id).reference,undefined);assert.ok(data.products.some(product=>product.generic));
});
test('product cards and cart calculations use the same reference without any stores',()=>{
  const info=priceForProduct(latte,[],3,now,true);assert.equal(info.priceCents,130);assert.equal(info.simulated,true);assert.equal(info.availableCount,0);
  const known=priceForProduct(latte,[store('A',{[latte.id]:offer(150)})],1,now,true);assert.equal(known.priceCents,150);assert.equal(known.simulated,false);
});
test('simulated totals sort by full basket value and keep incomplete subtotals separate',()=>{
  const results=compare([{productId:pasta.id,quantity:2}],[pasta],[store('Unknown'),store('Verified',{[pasta.id]:offer(40)}),store('Out of stock',{[pasta.id]:offer(1,{availability:'out_of_stock'})})]);
  assert.deepEqual(results.map(r=>r.store.id),['Verified','Unknown','Out of stock']);assert.equal(comparisonSummary(results).verifiedWinner,false);
});
