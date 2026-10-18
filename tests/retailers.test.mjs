import test from 'node:test';
import assert from 'node:assert/strict';
import { enrichStore, retailerForStore, retailerSources, sourceCoverage } from '../server/retailers.mjs';

test('recognizes local chain names and variants',()=>{
  for(const [name,id] of [['Iper Pan','pan'],['SuperPan','pan'],['Pan','pan'],['Nonna I.S.A.','nonna-isa'],['Spazio Conad','conad'],['Conad City','conad'],['Eurospar','despar'],['CRAI','crai'],['Lidl','lidl'],['Eurospin','eurospin'],['MD Discount','md'],['Carrefour Express','carrefour'],['Tutti i giorni','tuttigiorni']])assert.equal(retailerForStore({name})?.id,id,name);
});
test('independent shops are kept unchanged; substring MD and Pan are not false matches',()=>{
  for(const name of ['Panificio Rossi','Standomarket','Alimentari del quartiere']){
    const store={name,id:'independent',offers:{}};assert.equal(retailerForStore(store),null);assert.deepEqual(enrichStore(store),store);
  }
});
test('a retailer website link never creates prices or claims a connected catalog',()=>{
  const s=enrichStore({id:'osm:1',name:'SuperPan',address:'Cagliari',catalogStatus:'not_connected',offers:{}});
  assert.equal(s.retailerId,'pan');assert.equal(s.catalogStatus,'not_connected');assert.deepEqual(s.offers,{});assert.equal(s.linkScope,'chain');
});
test('only the Pan store in La Plaia gets the exact verified storefront',()=>{
  const exact=enrichStore({name:'IperPan',address:'Viale La Plaia 19 Cagliari'});
  assert.equal(exact.onlineUrl,'https://www.cosicomodo.it/pan/cagliari-plaia');assert.equal(exact.linkScope,'store');
  assert.equal(exact.onlineService,'pickup');assert.equal(exact.sourceCheckedOn,'2026-10-18');
  assert.notEqual(enrichStore({name:'SuperPan',address:'Viale Fiume Quartu'}).onlineUrl,exact.onlineUrl);
  assert.notEqual(enrichStore({name:'SuperPan',address:'Viale La Plaia, altro comune'}).onlineUrl,exact.onlineUrl);
  assert.notEqual(enrichStore({name:'SuperPan',address:'Via della Plaia, Cagliari'}).onlineUrl,exact.onlineUrl);
  assert.equal(enrichStore({name:'IperPan',address:'Viale La Plaia 19',lat:39.2238,lon:9.1217}).onlineUrl,exact.onlineUrl);
  assert.notEqual(enrichStore({name:'IperPan',address:'Viale La Plaia 19',lat:40.7,lon:8.6}).onlineUrl,exact.onlineUrl);
});
test('demo stores never inherit official source links',()=>{const store={name:'Conad',demo:true};assert.deepEqual(enrichStore(store),store);});
test('source coverage lists only recognized retailers actually found, once each',()=>{
  const source=sourceCoverage([{retailerId:'pan'},{retailerId:'pan'},{retailerId:'conad'},{name:'Indipendente'}]);assert.equal(source.length,2);assert.equal(source.some(s=>s.id==='md'),false);assert.equal('aliases' in source[0],false);
});
test('directory links use HTTPS and do not claim an active price integration',()=>{
  for(const source of retailerSources){assert.equal(new URL(source.website).protocol,'https:');assert.equal(source.priceConnection,'not_connected');if(source.onlineUrl)assert.equal(new URL(source.onlineUrl).protocol,'https:');}
});
