// Optional real-browser checks. Install Playwright and Chromium, then start npm start.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { createDemoData, demoLocation } from '../public/demo.mjs';
import { compareBasket, nearbyStores } from '../public/core.mjs';
import {shoppingCatalog} from '../server/shopping.mjs';
import {localStoresNear} from '../server/local-stores.mjs';
import {CAGLIARI_STARTS,DEFAULT_START} from '../public/location.mjs';
const require=createRequire(import.meta.url);
let chromium;
try {({chromium}=require('playwright'));}
catch {if(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)({chromium}=require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright')));else throw new Error('Installa Playwright: npm install --no-save playwright; npx playwright install chromium --only-shell');}
const base=process.env.APP_URL || 'http://127.0.0.1:3000';
const output=resolve('test-results');await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const errors=[];
try {
  const page=await browser.newPage({viewport:{width:1440,height:1100}});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base);await page.getByRole('button',{name:'Prova la demo'}).waitFor();
  assert.equal(await page.locator('#location-form .primary[type="submit"]').getAttribute('value'),'catalog');
  assert.deepEqual(await page.locator('#location-form [data-start] span').allTextContents(),CAGLIARI_STARTS.map(place=>place.name));
  await page.screenshot({path:resolve(output,'location-desktop.png'),fullPage:true});
  await page.getByRole('button',{name:'Prova la demo'}).click();
  assert.equal(await page.locator('.product-card').count(),24);
  assert.equal(await page.locator('#category-grid [data-category]').count(),12);
  await page.getByRole('button',{name:'Mostra tutte le 24 categorie'}).click();assert.equal(await page.locator('#category-grid [data-category]').count(),24);
  await page.getByRole('button',{name:'Mostra meno categorie'}).click();assert.equal(await page.locator('#category-grid [data-category]').count(),12);
  await page.getByRole('button',{name:'Mostra altri prodotti'}).click();assert.equal(await page.locator('.product-card').count(),48);
  await page.getByRole('button',{name:'Pasta e riso',exact:true}).click();assert.equal(await page.locator('.product-card').count(),16);
  await page.locator('#category-select').selectOption('animali');assert.equal(await page.locator('.product-card').count(),16);
  assert.equal(await page.getByRole('button',{name:'Alimenti e cura animali',exact:true}).getAttribute('aria-pressed'),'true');
  await page.getByRole('button',{name:'Tutti',exact:true}).click();
  await page.locator('#product-search').fill('Latte UHT intero');assert.equal(await page.locator('.product-card').count(),2);
  await page.locator('#product-search').fill('');
  await page.getByRole('button',{name:'Aggiungi Spaghetti 500 g alla lista',exact:true}).click();assert.equal(await page.locator('.count-badge').innerText(),'1');
  await page.getByRole('button',{name:'Aumenta quantità di Spaghetti',exact:true}).first().click();assert.equal(await page.locator('.count-badge').innerText(),'2');
  await page.getByRole('button',{name:'Torna alla home',exact:true}).click();assert.equal(await page.locator('#location-form').isVisible(),true);assert.equal(await page.locator('#modal').isVisible(),false);
  await page.reload();assert.equal(await page.locator('#location-form').isVisible(),true);
  await page.getByRole('button',{name:'Riprendi la demo'}).click();assert.equal(await page.locator('.count-badge').innerText(),'2');
  await page.locator('.brand').click();assert.equal(await page.locator('#location-form').isVisible(),true);await page.getByRole('button',{name:'Riprendi la demo'}).click();assert.equal(await page.locator('.count-badge').innerText(),'2');
  await page.locator('[data-step="location"]').click();assert.equal(await page.locator('#location-form').isVisible(),true);await page.getByRole('button',{name:'Riprendi la demo'}).click();
  await page.getByRole('button',{name:'Svuota la lista',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Svuota la lista',exact:true}).click();
  await page.getByRole('button',{name:'Prova una lista pronta'}).click();await page.getByRole('button',{name:/Spesa settimanale/}).click();assert.equal(await page.locator('.cart-item').count(),16);
  await page.getByRole('button',{name:'Prova una lista pronta'}).click();await page.getByRole('button',{name:/Lista veloce/}).click();assert.equal(await page.locator('.cart-item').count(),6);
  await page.screenshot({path:resolve(output,'catalog-desktop.png'),fullPage:true});
  await page.getByRole('button',{name:'Confronta la spesa',exact:false}).click();
  assert.equal(await page.locator('.complete-results .store-result').count(),2);
  assert.equal(await page.locator('.incomplete-section .store-result').count(),3);
  assert.match(await page.locator('.winner h2').innerText(),/Mercato Verde/);
  await page.getByRole('button',{name:'Vedi il dettaglio'}).click();assert.equal(await page.locator('.detail-table tbody tr').count(),6);await page.getByRole('button',{name:'Torna al confronto'}).click();
  await page.locator('#hide-incomplete').check();assert.equal(await page.locator('#incomplete-results').isVisible(),false);await page.locator('#hide-incomplete').uncheck();
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Esporta lista'}).click();assert.equal((await download).suggestedFilename(),'la-mia-spesa-lista.txt');
  await page.screenshot({path:resolve(output,'comparison-desktop.png'),fullPage:true});
  for(const width of [320,390,768,1440]) {
    await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`comparison overflow at ${width}`);
  }
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:resolve(output,'comparison-mobile.png'),fullPage:true});
  await page.getByRole('button',{name:'Modifica la lista'}).click();
  await page.getByRole('button',{name:'La tua lista ·'}).click();assert.equal(await page.locator('.cart').isVisible(),true);
  await page.getByRole('button',{name:'Chiudi lista',exact:true}).click();assert.equal(await page.locator('.cart').isVisible(),false);
  for(const width of [320,390,768,1440]) {
    await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`catalog overflow at ${width}`);
  }
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:resolve(output,'catalog-mobile.png'),fullPage:true});
  await page.getByRole('button',{name:'Modifica',exact:true}).click();await page.locator('#demo-radius').fill('1');await page.getByRole('button',{name:'Aggiorna la zona'}).click();
  assert.match(await page.locator('.store-count').innerText(),/1 negozi demo/);
  // Verify the live form and that server-authoritative comparison results are retained.
  await page.getByRole('button',{name:'Passa alla ricerca reale'}).click();
  const live=createDemoData();live.mode='live';live.warnings=[];
  await page.route('**/api/geocode?*',route=>route.fulfill({json:{results:[{...demoLocation,label:'Indirizzo di test'}]}}));
  await page.route('**/api/catalog?*',route=>route.fulfill({json:live}));
  await page.route('**/api/compare',async route=> {
    const body=route.request().postDataJSON();
    const results=compareBasket(body.list,live.products,nearbyStores(live.stores,demoLocation,body.radius));
    for(const r of results) if(r.complete) r.totalCents=7777;
    await route.fulfill({json:{results,warnings:[],generatedAt:new Date().toISOString()}});
  });
  await page.locator('#address').fill('Cagliari');await page.getByRole('button',{name:'Cerca supermercati',exact:false}).click();
  await page.getByRole('button',{name:'Indirizzo di test'}).click();
  await page.getByRole('button',{name:'Componi il carrello',exact:true}).click();
  await page.getByRole('button',{name:'Aggiungi Spaghetti 500 g alla lista',exact:true}).click();
  await page.getByRole('button',{name:'La tua lista ·'}).click();
  await page.getByRole('button',{name:'Confronta la spesa',exact:false}).click();
  assert.match(await page.locator('.winner-price>strong').innerText(),/77,77/);
  // Full live flow with real store identities and explicitly simulated references.
  await page.getByRole('button',{name:'Torna alla home',exact:true}).click();
  await page.setViewportSize({width:1440,height:1000});
  await page.locator('#address').fill('');
  const blankStart=page.waitForRequest('**/api/catalog?*');
  await page.getByRole('button',{name:'Riempi il tuo carrello',exact:false}).click();
  const blankUrl=new URL((await blankStart).url());assert.equal(Number(blankUrl.searchParams.get('lat')),DEFAULT_START.lat);assert.equal(Number(blankUrl.searchParams.get('lon')),DEFAULT_START.lon);
  await page.locator('.product-card').first().waitFor();assert.equal(await page.locator('.shopping-next').count(),0);
  await page.getByRole('button',{name:'Torna alla home',exact:true}).click();
  const start=CAGLIARI_STARTS.find(place=>place.id==='piazza-yenne'),realStores=localStoresNear(start,3).slice(0,2);
  const estimated={mode:'live',...shoppingCatalog([],realStores),stores:realStores,warnings:[],retailerSources:[],storeDiscovery:{status:'local_directory',mapAvailable:false,localStoreCount:realStores.length},attribution:'Test: dated public references'};
  await page.route('**/api/catalog?*',route=>route.fulfill({json:estimated}));
  await page.locator('#radius').fill('3');
  await page.route('**/api/compare',route=>{
    const body=route.request().postDataJSON();
    return route.fulfill({json:{results:compareBasket(body.list,estimated.products,nearbyStores(realStores,start,body.radius),Date.now(),{allowEstimates:true}),warnings:[],generatedAt:new Date().toISOString()}});
  });
  await page.locator('[data-start="piazza-yenne"]').click();
  await page.getByRole('button',{name:'Riempi il tuo carrello',exact:false}).click();await page.locator('.product-card').first().waitFor();
  assert.equal(await page.locator('.shopping-next').count(),0);
  if(await page.locator('.cart-item').count()){await page.getByRole('button',{name:'Svuota la lista',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Svuota la lista',exact:true}).click();}
  assert.equal(await page.locator('.product-card').count(),24);
  assert.match(await page.locator('.product-card').first().innerText(),/Prezzo simulato/);
  await page.locator('#category-select').selectOption('animali');assert.equal(await page.locator('.product-card').count(),16);
  await page.getByRole('button',{name:'Fonte della stima',exact:true}).first().click();assert.match(await page.locator('#modal-content').innerText(),/Stima definita il/);assert.equal(await page.locator('#modal-content .reference-source a').count(),0);await page.getByRole('button',{name:'Torna ai prodotti',exact:true}).click();
  await page.locator('#category-select').selectOption('all');
  await page.getByRole('button',{name:'Fonte della stima',exact:true}).first().click();
  assert.match(await page.locator('#modal-content').innerText(),/2026-10-17/);await page.getByRole('button',{name:'Torna ai prodotti',exact:true}).click();
  await page.getByRole('button',{name:'Aggiungi Spaghetti 500 g alla lista',exact:true}).click();
  await page.getByRole('button',{name:'Aumenta quantità di Spaghetti',exact:true}).first().click();
  await page.locator('#product-search').fill('Latte UHT parzialmente scremato');
  await page.getByRole('button',{name:'Aggiungi Latte UHT parzialmente scremato 1 l alla lista',exact:true}).click();
  await page.getByRole('button',{name:'Confronta la spesa',exact:false}).click();
  assert.equal(await page.locator('.complete-results .store-result').count(),2);
  assert.match(await page.locator('.winner h2').innerText(),/Stesso totale stimato/);assert.match(await page.locator('.winner-price>strong').innerText(),/2,48/);
  assert.equal((await page.locator('.winner').innerText()).includes('Risparmi'),false);
  await page.getByRole('button',{name:'Vedi il dettaglio',exact:true}).click();
  assert.equal(await page.locator('.detail-table tbody tr').count(),2);assert.match(await page.locator('.detail-price-split').innerText(),/Parte simulata/);
  await page.getByRole('button',{name:'Torna al confronto',exact:true}).click();
  await page.screenshot({path:resolve(output,'estimated-comparison-desktop.png'),fullPage:true});
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`estimated comparison overflow at ${width}`);}
  await page.getByRole('button',{name:'Torna alla home',exact:true}).click();
  // Device responses are mocked: this checks confirmation/precision UX, not hardware GPS.
  await page.addInitScript(()=>Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition(success,_error,options){window.__gpsOptions=options;success({coords:{latitude:39.2238,longitude:9.1217,accuracy:1800}});}}}));
  const ready=page.waitForResponse('**/api/status');await page.reload();await ready;await page.locator('.static-note').waitFor({state:'detached'});
  let gpsSearches=0;page.on('request',request=>{if(request.url().includes('/api/catalog?'))gpsSearches++;});
  await page.getByRole('button',{name:'Usa la mia posizione',exact:true}).click();
  assert.match(await page.locator('.gps-summary').innerText(),/1,8 km/);assert.match(await page.locator('.gps-warning').innerText(),/approssimativo/);assert.equal(gpsSearches,0);
  assert.deepEqual(await page.evaluate(()=>({accurate:window.__gpsOptions.enableHighAccuracy,age:window.__gpsOptions.maximumAge})),{accurate:true,age:0});
  await page.getByRole('button',{name:'Usa questo punto e riempi il carrello',exact:false}).click();await page.locator('.product-card').first().waitFor();assert.equal(gpsSearches,1);
  await page.getByRole('button',{name:'Torna alla home',exact:true}).click();
  await page.evaluate(()=>Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition(_success,error){error({code:1});}}}));
  await page.getByRole('button',{name:'Usa la mia posizione',exact:true}).click();assert.match(await page.locator('#location-form .form-feedback').innerText(),/negato/);
  // A map error must not turn into a claim that no supermarkets exist.
  await page.route('**/api/catalog?*',route=>route.fulfill({json:{mode:'live',...shoppingCatalog([],[]),stores:[],warnings:['La ricerca sulla mappa non risponde.'],retailerSources:[],storeDiscovery:{status:'unavailable',mapAvailable:false,localStoreCount:0},attribution:'Test fixture'}}));
  await page.locator('[data-start="via-roma"]').click();await page.getByRole('button',{name:'Cerca supermercati',exact:false}).click();
  assert.match(await page.locator('h1').innerText(),/da riprovare/);assert.equal((await page.locator('.coverage-summary').innerText()).includes('0 negozi trovati'),false);assert.equal(await page.getByRole('button',{name:'Riprova la ricerca sulla mappa'}).isVisible(),true);
  await page.getByRole('button',{name:'Componi il carrello',exact:true}).click();assert.equal(await page.locator('.product-card').count(),24);assert.equal(await page.getByRole('button',{name:'Confronta la spesa',exact:false}).isDisabled(),true);
  await page.getByRole('button',{name:'Torna alla home',exact:true}).click();assert.equal(await page.locator('#location-form').isVisible(),true);
  assert.deepEqual(errors,[]);console.log('Browser checks passed: navigation, products, estimated and verified comparisons, ties, sources, GPS confirmation/errors, export and responsive widths.');
} finally {await browser.close();}
