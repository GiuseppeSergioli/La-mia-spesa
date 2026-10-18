// Optional real-browser checks. Requires Playwright + Chromium and a running server.
// These exercise a browser, not installation on a physical iPhone or Android phone.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {mkdir} from 'node:fs/promises';
const require=createRequire(import.meta.url);
let chromium;
try {({chromium}=require('playwright'));}
catch {({chromium}=require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright')));}
const base=process.env.APP_URL || 'http://127.0.0.1:3000';
const output=resolve('test-results');await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
try {
  const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base);
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller,{},{timeout:20_000});
  assert.equal(await page.locator('.welcome-brand img').evaluate(image=>image.complete && image.naturalWidth>0),true);
  const manifest=await page.evaluate(async()=>fetch(document.querySelector('link[rel="manifest"]').href).then(r=>r.json()));
  assert.equal(manifest.name,'La mia spesa');assert.equal(manifest.display,'standalone');
  for(const width of [320,360,390,430,768,1024,1440]){
    await page.setViewportSize({width,height:900});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`home overflow at ${width}`);
    const button=await page.locator('[data-action="install-app"]').boundingBox();assert.ok(button && button.x>=0 && button.x+button.width<=width+1,`install button at ${width}`);
  }
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:resolve(output,'brand-install-mobile.png'),fullPage:true});
  await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#connection-status:not([hidden])').waitFor();
  assert.equal(await page.locator('.welcome-brand img').evaluate(image=>image.complete && image.naturalWidth>0),true);
  await page.getByRole('button',{name:'Componi la tua spesa',exact:true}).click();
  await page.locator('.product-card').first().waitFor();assert.equal(await page.locator('.product-card').count(),24);
  await page.getByRole('button',{name:'Aggiungi Spaghetti 500 g alla lista',exact:true}).click();
  await page.getByRole('button',{name:'Torna alla home',exact:true}).click();
  await page.getByRole('button',{name:'Prova la demo',exact:true}).click();
  await page.setViewportSize({width:1440,height:1000});
  await page.getByRole('button',{name:'Aggiungi Spaghetti 500 g alla lista',exact:true}).click();
  await page.getByRole('button',{name:'Confronta la spesa',exact:false}).click();
  await page.locator('.compare-actions [data-action="history"]').click();
  assert.equal(await page.locator('.history-card').count(),1);
  await page.locator('.history-card').click();assert.equal(await page.locator('.history-detail tbody tr').count(),1);
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:resolve(output,'offline-history-mobile.png'),fullPage:true});
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('Browser PWA checks passed: logo, manifest, responsive home, cached restart, offline list and history.');
} finally {await browser.close();}
