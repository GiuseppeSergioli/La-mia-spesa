// Optional real-browser checks. Install Playwright and Chromium, then start npm start.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { createDemoData, demoLocation } from '../public/demo.mjs';
import { compareBasket, nearbyStores } from '../public/core.mjs';
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
  await page.screenshot({path:resolve(output,'location-desktop.png'),fullPage:true});
  await page.getByRole('button',{name:'Prova la demo'}).click();
  assert.equal(await page.locator('.product-card').count(),24);
  await page.getByRole('button',{name:'Pasta e riso',exact:true}).click();assert.equal(await page.locator('.product-card').count(),3);
  await page.getByRole('button',{name:'Tutti',exact:true}).click();
  await page.locator('#product-search').fill('Granarolo');assert.equal(await page.locator('.product-card').count(),1);
  await page.locator('#product-search').fill('');
  await page.getByRole('button',{name:'Aggiungi Spaghetti n. 5 alla lista',exact:true}).click();assert.equal(await page.locator('.count-badge').innerText(),'1');
  await page.getByRole('button',{name:'Aumenta quantità di Spaghetti n. 5',exact:true}).first().click();assert.equal(await page.locator('.count-badge').innerText(),'2');
  await page.reload();assert.equal(await page.locator('.count-badge').innerText(),'2');
  await page.getByRole('button',{name:'Svuota la lista',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Svuota la lista',exact:true}).click();
  await page.getByRole('button',{name:'Usa una lista d’esempio'}).click();
  await page.screenshot({path:resolve(output,'catalog-desktop.png'),fullPage:true});
  await page.getByRole('button',{name:'Confronta la spesa',exact:false}).click();
  assert.equal(await page.locator('.complete-results .store-result').count(),2);
  assert.equal(await page.locator('.incomplete-section .store-result').count(),1);
  assert.match(await page.locator('.winner h2').innerText(),/Mercato Verde/);
  await page.getByRole('button',{name:'Vedi il dettaglio'}).click();assert.equal(await page.locator('.detail-table tbody tr').count(),6);await page.getByRole('button',{name:'Torna al confronto'}).click();
  await page.locator('#hide-incomplete').check();assert.equal(await page.locator('#incomplete-results').isVisible(),false);await page.locator('#hide-incomplete').uncheck();
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Esporta lista'}).click();assert.equal((await download).suggestedFilename(),'spesina-lista.txt');
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
  assert.match(await page.locator('.store-count').innerText(),/1 supermercati/);
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
  await page.getByRole('button',{name:'Aggiungi Spaghetti n. 5 alla lista',exact:true}).click();
  await page.getByRole('button',{name:'La tua lista ·'}).click();
  await page.getByRole('button',{name:'Confronta la spesa',exact:false}).click();
  assert.match(await page.locator('.winner-price>strong').innerText(),/77,77/);
  assert.deepEqual(errors,[]);console.log('Browser checks passed: navigation, filters, quantities, persistence, comparison, export, mobile widths and live API rendering.');
} finally {await browser.close();}
