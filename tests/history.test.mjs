import test from 'node:test';
import assert from 'node:assert/strict';
import {createDemoData,demoLocation,sampleList} from '../public/demo.mjs';
import {compareBasket,nearbyStores} from '../public/core.mjs';
import {HISTORY_KEY,HISTORY_LIMIT,createHistoryEntry,validHistoryEntry,appendHistory,readHistory,writeHistory} from '../public/history.mjs';
import {harness} from './helpers/app-harness.mjs';
const payload=()=>{const data=createDemoData();return {mode:'demo',location:demoLocation,radius:3,list:structuredClone(sampleList),products:data.products,results:compareBasket(sampleList,data.products,nearbyStores(data.stores,demoLocation,3))};};
const storage=()=>{const map=new Map();return {map,getItem:key=>map.get(key) || null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)};};

test('history stores an independent dated snapshot with products, quantities, prices and markets',()=>{
  const input=payload(),entry=createHistoryEntry(input,'2026-10-18T04:30:00Z');
  assert.ok(validHistoryEntry(entry));assert.equal(entry.savedAt,'2026-10-18T04:30:00Z');assert.equal(entry.products.length,sampleList.length);assert.equal(entry.stores.length,input.results.length);
  const before=JSON.stringify(entry);input.products[0].name='Changed';input.results[0].totalCents=1;input.results[0].rows[0].lineTotalCents=1;input.list[0].quantity=99;
  assert.equal(JSON.stringify(entry),before);
});
test('history preserves unavailable rows and partial totals without treating missing prices as zero',()=>{
  const entry=createHistoryEntry(payload()),partial=entry.stores.find(s=>!s.priceComplete);
  assert.ok(partial);assert.ok(partial.rows.some(row=>row.lineTotalCents===null));assert.equal(partial.totalCents,partial.rows.reduce((sum,r)=>sum+(r.lineTotalCents ?? 0),0));
});
test('history reloads from browser storage and ignores malformed or incompatible data',()=>{
  const store=storage(),entry=createHistoryEntry(payload());writeHistory(store,[entry]);assert.deepEqual(readHistory(store),[entry]);
  for(const value of ['not JSON','{}','[null]',JSON.stringify([{...entry,schemaVersion:999}])]){store.setItem(HISTORY_KEY,value);assert.deepEqual(readHistory(store),[]);}
  const bad=structuredClone(entry);bad.stores[0].rows[0].lineTotalCents=-1;assert.equal(validHistoryEntry(bad),false);
});
test('only immediate duplicate comparisons are coalesced and a later identical shop is retained',()=>{
  const p=payload(),a=createHistoryEntry(p,'2026-10-18T04:30:00Z'),b=createHistoryEntry(p,'2026-10-18T04:30:30Z'),c=createHistoryEntry(p,'2026-10-19T04:30:00Z');
  assert.equal(appendHistory([a],b).length,1);assert.equal(appendHistory([a],c).length,2);
});
test('history has a bounded retention limit and storage failures remain explicit',()=>{
  const base=createHistoryEntry(payload()),entries=Array.from({length:80},(_,i)=>({...structuredClone(base),id:`history-${i}`}));
  assert.equal(writeHistory(storage(),entries).length,HISTORY_LIMIT);
  const blocked={getItem(){throw new Error('blocked');},setItem(){throw new Error('quota');}};
  assert.deepEqual(readHistory(blocked),[]);assert.throws(()=>writeHistory(blocked,[base]),/quota/);
});
test('a completed comparison is saved automatically and its history survives reopening the app',async()=>{
  const h=harness();h.run('startDemo(true)');await h.run('showComparison()');
  assert.equal(h.run('state.history.length'),1);assert.equal(h.run('state.page'),'compare');
  h.run('openHistory()');assert.match(h.main(),/data-history-entry=/);
  h.run('state.historyEntryId=state.history[0].id;render()');assert.match(h.main(),/Prezzo unitario/);assert.match(h.main(),/data-history-store=/);
  const reloaded=harness({savedStorage:h.storage});assert.equal(reloaded.run('state.history.length'),1);
});
test('history appears below the comparison action and language changes do not alter saved data',async()=>{
  const h=harness();h.run('startDemo(true)');await h.run('showComparison()');const saved=h.storage.get(HISTORY_KEY);
  h.run("state.page='catalog';render()");assert.ok(h.main().indexOf('cart-history')>h.main().indexOf('data-action="compare"'));
  h.run("openHistory();state.historyEntryId=state.history[0].id;render();setLanguage('en')");assert.match(h.main(),/Unit price/);assert.match(h.main(),/Saved comparison|Demo/);
  assert.equal(h.storage.get(HISTORY_KEY),saved);h.run("setLanguage('it')");assert.equal(h.storage.get(HISTORY_KEY),saved);
});

test('home and comparison expose a history shortcut with the updated saved-entry count',async()=>{
  const h=harness();
  assert.match(h.main(),/home-history[^]*data-action="history"[^]*history-count">0</);
  h.run('startDemo(true)');await h.run('showComparison()');
  assert.match(h.main(),/compare-actions[^]*data-action="history"[^]*history-count">1</);
  h.run("goHome();setLanguage('en')");
  assert.match(h.main(),/home-history[^]*Shopping history[^]*history-count">1</);
  h.handlers.click({target:{closest(selector){return selector==='button'?{disabled:false,dataset:{action:'history'}}:null;}}});
  assert.equal(h.run('state.page'),'history');
});

test('deleting one saved shop preserves other entries and the current basket after reload',async()=>{
  const h=harness();h.run('startDemo(true)');await h.run('showComparison()');
  h.run("state.history.push({...structuredClone(state.history[0]),id:'older-shop',savedAt:'2026-10-17T04:30:00Z'});writeHistory(localStorage,state.history);openHistory()");
  const currentId=h.run('state.history[0].id'),other=h.run('JSON.stringify(state.history[1])'),basket=h.run('JSON.stringify(state.list)');
  assert.match(h.main(),/data-delete-history="older-shop"/);
  h.run('state.historyEntryId=state.history[0].id;state.historyStoreId=state.history[0].stores[0].id;render()');
  assert.match(h.main(),/Elimina questa spesa/);
  h.handlers.click({target:{closest(selector){return selector==='button'?{disabled:false,dataset:{deleteHistory:currentId}}:null;}}});
  assert.equal(h.run('state.history.length'),2);
  h.handlers.click({target:{closest(selector){return selector==='button'?{disabled:false,dataset:{confirmDeleteHistory:currentId}}:null;}}});
  assert.equal(h.run('state.history.length'),1);assert.equal(h.run('JSON.stringify(state.history[0])'),other);
  assert.equal(h.run('state.historyEntryId'),null);assert.equal(h.run('state.historyStoreId'),null);
  assert.equal(h.run('JSON.stringify(state.list)'),basket);
  const reloaded=harness({savedStorage:h.storage});assert.equal(reloaded.run('state.history.length'),1);assert.equal(reloaded.run('state.history[0].id'),'older-shop');
});

test('single-delete confirmation can be cancelled and translated; deleting the last entry shows an empty history',async()=>{
  const h=harness();h.run('startDemo(true)');await h.run('showComparison()');
  const saved=h.storage.get(HISTORY_KEY);
  h.run('openHistory();showDeleteHistory(state.history[0].id);closeModal()');assert.equal(h.storage.get(HISTORY_KEY),saved);
  h.run("showDeleteHistory(state.history[0].id);setLanguage('en')");
  const body=h.document.querySelector('#modal-content').innerHTML;
  assert.match(body,/Delete this saved shop/);assert.match(body,/Cancel/);assert.doesNotMatch(body,/Elimina|Verrà|Annulla/);
  h.run('deleteHistoryEntry(state.history[0].id)');
  assert.equal(h.run('state.history.length'),0);assert.match(h.main(),/Your previous shopping will appear here/);
  assert.doesNotMatch(h.main(),/data-history-entry=/);
  assert.deepEqual(JSON.parse(h.storage.get(HISTORY_KEY)),[]);
});

test('failed or stale single-delete requests never discard the saved history',async()=>{
  const h=harness();h.run('startDemo(true)');await h.run('showComparison()');
  const saved=h.storage.get(HISTORY_KEY),state=h.run('JSON.stringify(state.history)');
  h.run("deleteHistoryEntry('missing-entry')");assert.equal(h.storage.get(HISTORY_KEY),saved);
  h.run("localStorage.setItem=()=>{throw new Error('blocked')};showDeleteHistory(state.history[0].id);deleteHistoryEntry(state.history[0].id)");
  assert.equal(h.run('JSON.stringify(state.history)'),state);assert.equal(h.storage.get(HISTORY_KEY),saved);assert.equal(h.run("$('#modal').open"),true);
});
