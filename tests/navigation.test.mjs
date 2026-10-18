import test from 'node:test';
import assert from 'node:assert/strict';
import * as Location from '../public/location.mjs';
import {harness,fixture,deferred} from './helpers/app-harness.mjs';

test('the prominent composition submit opens products before the store response',async()=>{
  const wait=deferred(),h=harness({respond:()=>wait.promise}),form=h.form();
  const html=h.run('locationFields()');
  assert.match(html,/<button class="button primary full compose-shopping"[^>]*value="catalog"/);
  assert.ok(html.indexOf('Componi la tua spesa')<html.indexOf('Cerca supermercati'));
  assert.match(html,/<div class="optional-store-search"><button class="text-button"[^>]*value="stores"/);
  h.handlers.submit({target:form,submitter:{value:'catalog'},preventDefault(){}});
  assert.equal(h.run('state.page'),'catalog');assert.equal(h.run('products().length'),384);
  assert.equal(h.run('state.busy'),false);assert.equal(h.run('state.storeSearchPending'),true);
  assert.match(h.main(),/class="product-card/);assert.equal(h.requests.length,1);
  assert.equal(new URL(h.requests[0],'https://test').searchParams.get('lat'),String(Location.DEFAULT_START.lat));
  wait.resolve(Response.json(fixture()));await new Promise(setImmediate);
  assert.equal(h.run('state.storeSearchPending'),false);assert.equal(h.run('stores().length'),1);
});

test('store discovery preserves products and quantities changed while loading',async()=>{
  const wait=deferred(),h=harness({respond:()=>wait.promise});h.form();
  const job=h.run("findLocation(form,'catalog')");
  h.run("changeQuantity('reference:spaghetti-500',1);changeQuantity('reference:spaghetti-500',1);state.category='pasta';state.search='spaghetti';state.visibleLimit=48;state.cartOpen=true");
  wait.resolve(Response.json(fixture()));await job;
  assert.equal(h.run("quantity('reference:spaghetti-500')"),2);assert.equal(h.run('state.category'),'pasta');
  assert.equal(h.run('state.search'),'spaghetti');assert.equal(h.run('state.visibleLimit'),48);assert.equal(h.run('state.cartOpen'),true);
  assert.equal(JSON.parse(h.storage.get('spesina:v1')).list[0].quantity,2);
});

test('a failed store search keeps the catalog and cart open and can be retried',async()=>{
  let failed=true;const h=harness({respond:async()=>{if(failed)throw new Error('Test network outage');return Response.json(fixture());}});h.form();
  const job=h.run("findLocation(form,'catalog')");h.run("changeQuantity('reference:spaghetti-500',1)");await job;
  assert.equal(h.run('state.page'),'catalog');assert.equal(h.run('products().length'),384);assert.equal(h.run('state.storeSearchPending'),false);
  assert.equal(h.run("quantity('reference:spaghetti-500')"),1);assert.match(h.main(),/data-action="retry-stores"/);
  assert.equal(h.run('state.data.storeDiscovery.status'),'unavailable');
  failed=false;await h.run('refreshStores()');assert.equal(h.run('stores().length'),1);assert.equal(h.run("quantity('reference:spaghetti-500')"),1);
});

test('the optional directory never interrupts a cart opened while stores load',async()=>{
  const wait=deferred(),h=harness({respond:()=>wait.promise});h.run('state.live=true');h.form();
  const job=h.run("findLocation(form,'stores')");assert.equal(h.run('state.page'),'stores');assert.match(h.main(),/data-action="compose-cart"/);
  h.run("resumeList();changeQuantity('reference:spaghetti-500',1)");wait.resolve(Response.json(fixture()));await job;
  assert.equal(h.run('state.page'),'catalog');assert.equal(h.run("quantity('reference:spaghetti-500')"),1);
});

test('a response for an old location cannot overwrite the next location',async()=>{
  const first=deferred(),second=deferred();let calls=0;
  const h=harness({respond:()=>++calls===1?first.promise:second.promise});h.form();
  const a=h.run("findLocation(form,'catalog')");
  const b=h.run("loadLocation(CAGLIARI_STARTS[2],3,null,'catalog')");
  second.resolve(Response.json(fixture(Location.CAGLIARI_STARTS[2])));await b;
  first.resolve(Response.json(fixture(Location.DEFAULT_START)));await a;
  assert.equal(h.run('state.location.id'),'piazza-garibaldi');
  assert.equal(h.run('state.data.stores[0].lat'),Location.CAGLIARI_STARTS[2].lat);
});

test('returning home while stores load does not overwrite the home form',async()=>{
  const wait=deferred(),h=harness({respond:()=>wait.promise});h.form();const job=h.run("findLocation(form,'catalog')");
  h.run('goHome()');const home=h.main();wait.resolve(Response.json(fixture()));await job;
  assert.equal(h.run('state.page'),'location');assert.equal(h.main(),home);assert.equal(h.run('stores().length'),1);
});

test('switching to demo discards a late response from real-store discovery',async()=>{
  const wait=deferred(),h=harness({respond:()=>wait.promise});h.form();const job=h.run("findLocation(form,'catalog')");
  h.run('startDemo()');wait.resolve(Response.json(fixture()));await job;
  assert.equal(h.run('state.mode'),'demo');assert.equal(h.run('state.data.stores.length'),8);assert.equal(h.run('state.storeSearchPending'),false);
});

test('saved feed rows stay pending without being lost while the shared catalog opens',async()=>{
  const wait=deferred(),h=harness({respond:()=>wait.promise});h.form();
  h.run("state.list=[{productId:'reference:spaghetti-500',quantity:2},{productId:'fixture:feed-product',quantity:3}]");
  const job=h.run("findLocation(form,'catalog')");assert.equal(h.run('state.pendingList.length'),1);
  assert.equal(JSON.parse(h.storage.get('spesina:v1')).list.length,2);
  h.run("changeQuantity('reference:spaghetti-500',1)");
  const data=fixture();data.products.push({...data.products[0],id:'fixture:feed-product'});wait.resolve(Response.json(data));await job;
  assert.equal(h.run("quantity('reference:spaghetti-500')"),3);assert.equal(h.run("quantity('fixture:feed-product')"),3);assert.equal(h.run('state.pendingList.length'),0);
});

test('the standalone demo starts at home and its composition action works offline',async()=>{
  const h=harness({staticDemo:true,respond:async()=>{throw new Error('No request expected');}});h.form();
  assert.equal(h.run('state.page'),'location');assert.match(h.main(),/Componi la tua spesa/);
  await h.run("findLocation(form,'catalog')");assert.equal(h.run('state.page'),'catalog');assert.equal(h.run('products().length'),384);assert.equal(h.requests.length,0);
});

test('custom addresses that cannot be resolved do not silently become Via Roma',async()=>{
  const h=harness({respond:async()=>Response.json({results:[]})}),form=h.form('Via non trovata 12, Cagliari');
  await h.run("findLocation(form,'catalog')");assert.equal(h.run('state.page'),'location');assert.equal(h.requests.length,1);
  assert.ok(h.requests[0].includes('/geocode?'));assert.match(form.feedback.textContent,/Nessun indirizzo/);assert.equal(h.run('state.busy'),false);
});
