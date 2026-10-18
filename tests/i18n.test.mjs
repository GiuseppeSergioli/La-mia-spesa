import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {catalogProducts,catalogCategories} from '../public/catalog.mjs';
import {EN_CATALOG,EN_CATEGORIES} from '../public/catalog-en.mjs';
import {LANGUAGE_KEY,translateText,localizeMarkup,formatMoney,formatDistance,productMatches,localizedProductName} from '../public/i18n.mjs';
import {productArt} from '../public/art.mjs';
import {harness} from './helpers/app-harness.mjs';
const text=markup=>markup.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');

test('every one of the 384 products and all 24 categories have explicit English descriptions',()=>{
  for(const p of catalogProducts){assert.ok(Object.hasOwn(EN_CATALOG,p.name),p.name);assert.equal(localizedProductName(p,'en'),EN_CATALOG[p.name]);}
  for(const c of catalogCategories)assert.ok(Object.hasOwn(EN_CATEGORIES,c.name),c.name);
});
test('localization keeps product IDs, URLs and input values intact and escapes translated text safely',()=>{
  const source='<button data-add="reference:latte" aria-label="Aggiungi Latte UHT intero alla lista">Latte UHT intero</button><a href="https://example.test/maionese?q=carne">Fonte della stima</a><input value="Pane fresco" placeholder="Cerca un prodotto o una marca…">';
  const out=localizeMarkup(source,'en');assert.match(out,/data-add="reference:latte"/);assert.match(out,/aria-label="Add Whole UHT milk to your list"/);assert.match(out,/href="https:\/\/example.test\/maionese\?q=carne"/);assert.match(out,/value="Pane fresco"/);assert.match(out,/placeholder="Search for a product or brand…"/);
  assert.equal(translateText('Fonte https://example.test/maionese?q=carne','en'),'Fonte https://example.test/maionese?q=carne');
  assert.equal(localizeMarkup('<span data-no-translate>Pane fresco</span>','en'),'<span data-no-translate>Pane fresco</span>');
  assert.equal(localizeMarkup('<span>&lt;script&gt;Prezzo simulato&lt;/script&gt;</span>','en'),'<span>&lt;script&gt;Simulated price&lt;/script&gt;</span>');
  assert.equal(localizeMarkup('<span> Prezzo simulato </span>','en'),'<span> Simulated price </span>');
});
test('English searches find translated products while Italian searches keep working',()=>{
  const milk=catalogProducts.find(p=>p.name==='Latte UHT intero');assert.ok(productMatches(milk,'whole milk','en') || productMatches(milk,'UHT milk','en'));
  assert.ok(productMatches(milk,'latte','en'));assert.ok(productMatches(catalogProducts.find(p=>p.name==='Filetti di salmone'),'salmon','en'));
});
test('English prices, quantities and image labels use the selected locale without changing values',()=>{
  assert.equal(formatMoney(139,'en'),'€1.39');assert.match(formatMoney(139,'it'),/1,39/);assert.equal(formatDistance(1.5,'en'),'1.5 km');
  const product=catalogProducts.find(p=>p.name==='Filetti di salmone'),svg=decodeURIComponent(productArt(product,'en').split(',').slice(1).join(','));
  assert.match(svg,/Salmon fillets/);assert.match(svg,/Reference product/);assert.equal(svg.includes('Filetti di salmone'),false);
});
test('Italian is the initial language and the header has accessible IT and EN flag buttons',async()=>{
  const h=harness();assert.equal(h.run('state.language'),'it');assert.match(h.main(),/Componi la tua spesa/);
  const index=await readFile(new URL('../public/index.html',import.meta.url),'utf8');assert.match(index,/data-language="it"[^>]*aria-label="Italiano"/);assert.match(index,/data-language="en"[^>]*aria-label="English"/);assert.ok(index.includes('🇮🇹') && index.includes('🇬🇧'));
});
test('switching language translates home, catalogue, comparison and modal contents without losing the basket',async()=>{
  const h=harness();h.run("setLanguage('en')");assert.match(h.main(),/Build your shopping list/);assert.equal(h.document.documentElement.lang,'en');
  h.run('startDemo(true)');assert.match(h.main(),/Your basket/);assert.match(h.main(),/Milk and plant-based drinks/);assert.match(h.main(),/Cream biscuits/);
  const list=h.run('JSON.stringify(state.list)');await h.run('showComparison()');assert.match(h.main(),/Your comparison, store by store/);
  h.run('showHelp()');assert.match(h.document.querySelector('#modal-content').innerHTML,/Choose your products/);h.run('privacy()');assert.match(h.document.querySelector('#modal-content').innerHTML,/comparison history/);
  h.run("showPriceSource('reference:spaghetti-500')");assert.match(h.document.querySelector('#modal-content').innerHTML,/How this price is estimated/);
  h.run("setLanguage('it')");assert.match(h.document.querySelector('#modal-content').innerHTML,/Come viene stimato questo prezzo/);assert.match(h.document.querySelector('#modal-content').innerHTML,/0,59/);
  assert.equal(h.run('JSON.stringify(state.list)'),list);
});
test('the selected language persists and the standalone demo includes translated history',async()=>{
  const h=harness({staticDemo:true});h.run("setLanguage('en');startDemo(true)");await h.run('showComparison()');h.run('openHistory()');assert.match(h.main(),/Your shopping/);assert.match(h.main(),/history/);
  assert.equal(h.storage.get(LANGUAGE_KEY),'en');const reloaded=harness({savedStorage:h.storage,staticDemo:true});assert.equal(reloaded.run('state.language'),'en');assert.equal(reloaded.run('state.history.length'),1);
});
test('main English screens do not leak Italian interface messages',async()=>{
  const h=harness();h.run("setLanguage('en');startDemo(true)");await h.run('showComparison()');
  for(const expr of ['render()','openHistory()','state.historyEntryId=state.history[0].id;render()']){h.run(expr);assert.doesNotMatch(text(h.main()),/\b(?:Prezzo|prodotti|negozi|confezioni|disponibilità|Risparmi|calcolabili|Torna|salvata|Svuota)\b/);}
});
