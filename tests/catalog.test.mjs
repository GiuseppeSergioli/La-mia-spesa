import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogCategories,catalogProducts,catalogCounts} from '../public/catalog.mjs';
import {createDemoData,legacyDemoAliases,migrateDemoList} from '../public/demo.mjs';
import {shoppingCatalog} from '../server/shopping.mjs';
import {compareBasket,referencePrice} from '../public/core.mjs';

test('shopping and simulator expose exactly the same 384 choices and 24 categories',()=>{
  const demo=createDemoData(),shopping=shoppingCatalog([],[]);
  assert.equal(demo.products.length,384);assert.equal(demo.categories.length-1,24);
  assert.deepEqual(demo.products,shopping.products);assert.deepEqual(demo.categories,shopping.categories);
});
test('every category contains sixteen different name and format choices',()=>{
  assert.equal(Object.keys(catalogCounts).length,24);
  for(const category of catalogCategories.filter(c=>c.id!=='all')){
    const products=catalogProducts.filter(p=>p.category===category.id);assert.equal(products.length,16,category.name);assert.equal(new Set(products.map(p=>`${p.name}|${p.size}`)).size,16,category.name);
  }
  assert.equal(new Set(catalogProducts.map(p=>p.id)).size,384);
});
test('the first page covers all categories without exposing only pasta and biscuits',()=>{
  const first=catalogProducts.slice(0,24);assert.equal(new Set(first.map(p=>p.category)).size,24);
});
test('public price observations remain distinct from the additional editorial estimates',()=>{
  const publicPrices=catalogProducts.filter(p=>p.reference.origin==='public'),editorial=catalogProducts.filter(p=>p.reference.origin==='editorial');
  assert.equal(publicPrices.length,30);assert.equal(editorial.length,354);
  for(const p of editorial){assert.ok(referencePrice(p));assert.equal(p.reference.sourceUrl,null);assert.equal(p.reference.definedOn,'2026-10-17');assert.match(p.reference.method,/Valore simulato/);}
  const bad={...editorial[0],reference:{...editorial[0].reference,sourceUrl:'https://invented.example/price'}};assert.equal(referencePrice(bad),null);
});
test('all old demo IDs retain a valid migration path and saved quantities',()=>{
  assert.equal(Object.keys(legacyDemoAliases).length,96);
  for(const [old,current] of Object.entries(legacyDemoAliases)){
    assert.ok(catalogProducts.some(p=>p.id===current));assert.deepEqual(migrateDemoList([{productId:old,quantity:3}]),[{productId:current,quantity:3}]);
  }
  const id='reference:spaghetti-500';assert.deepEqual(migrateDemoList([{productId:'demo-pasta-1',quantity:98},{productId:id,quantity:2},{productId:'missing',quantity:1},{productId:id,quantity:0}]),[{productId:id,quantity:99}]);
});
test('the entire expanded basket is calculable with estimates and does not invent local availability',()=>{
  const list=catalogProducts.map(p=>({productId:p.id,quantity:1})),stores=[{id:'A',name:'A',distanceKm:1,offers:{}},{id:'B',name:'B',distanceKm:2,offers:{}}];
  const results=compareBasket(list,catalogProducts,stores,Date.now(),{allowEstimates:true});
  for(const result of results){assert.equal(result.priceComplete,true);assert.equal(result.complete,false);assert.equal(result.simulatedCount,384);assert.equal(result.availableCount,0);assert.ok(result.totalCents>0);}
  assert.equal(results[0].totalCents,results[1].totalCents);assert.deepEqual(stores[0].offers,{});
});
