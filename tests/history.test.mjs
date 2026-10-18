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
