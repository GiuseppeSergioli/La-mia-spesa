import test from 'node:test';
import assert from 'node:assert/strict';
import {harness,fixture} from './helpers/app-harness.mjs';
import {enrichStore} from '../server/retailers.mjs';

async function ready({chain=false,onlineUrl=null}={}) {
  const data=fixture();
  data.stores[0]=enrichStore({...data.stores[0],name:'IperPan',chain:'Pan',address:chain?'Viale Fiume, Quartu':'Viale La Plaia, Cagliari'});
  if(onlineUrl!==null)data.stores[0].onlineUrl=onlineUrl;
  const h=harness({respond:async()=>Response.json(data)});
  await h.run('loadLocation(DEFAULT_START,3,null)');
  h.run("state.list=[{productId:products()[0].id,quantity:3}];state.results=localComparison();state.page='compare';render()");
  return h;
}

test('comparison offers the exact Pan online shop without creating verified prices',async()=>{
  const h=await ready();
  assert.match(h.main(),/data-shop="fixture:market"/);
  assert.match(h.main(),/Acquista online/);
  assert.equal(h.run('state.results[0].availableCount'),0);
  assert.equal(h.run('state.results[0].simulatedCount'),1);
  h.handlers.click({target:{closest(selector){return selector==='button'?{disabled:false,dataset:{shop:'fixture:market'}}:null;}}});
  const body=h.run('modalSource.body');
  assert.match(body,/href="https:\/\/www.cosicomodo.it\/pan\/cagliari-plaia"/);
  assert.match(body,/non viene trasferita automaticamente/);
  assert.match(body,/Il totale dello shop potrebbe essere diverso/);
  assert.match(body,/Ritiro in questo punto vendita/);
  assert.match(body,/3 ×/);
  assert.equal(h.requests.some(url=>url.includes('cosicomodo')),false);
});

test('a chain link asks to check store and coverage instead of promising a local shop',async()=>{
  const h=await ready({chain:true});
  assert.match(h.main(),/Verifica spesa online/);
  assert.doesNotMatch(h.main(),/Questo punto vendita ha uno shop online/);
  h.run("showOnlineShopping('fixture:market')");
  const body=h.run('modalSource.body');
  assert.match(body,/Verifica negozio e copertura/);
  assert.doesNotMatch(body,/Ritiro in questo punto vendita/);
  assert.doesNotMatch(body,/href="https:\/\/www.cosicomodo.it\/pan\/cagliari-plaia"/);
});

test('unsafe or missing online URLs do not produce an online shopping action',async()=>{
  for(const value of ['', 'javascript:alert(1)','http://example.com','https://user:secret@example.com','https://example.com:8443']) {
    const h=await ready({onlineUrl:value});
    assert.doesNotMatch(h.main(),/data-shop=/,value);
    h.run("showOnlineShopping('fixture:market')");
    assert.equal(h.run('modalSource'),null,value);
  }
});

test('changing language rebuilds the online modal while preserving its destination and basket',async()=>{
  const h=await ready();
  h.run("showOnlineShopping('fixture:market');setLanguage('en')");
  const body=h.document.querySelector('#modal-content').innerHTML;
  assert.match(body,/Open the store’s shop/);
  assert.match(body,/not transferred automatically/);
  assert.match(body,/Download your list/);
  assert.match(body,/https:\/\/www.cosicomodo.it\/pan\/cagliari-plaia/);
  assert.equal(h.run('state.list[0].quantity'),3);
  assert.equal(h.run('state.results[0].simulatedCount'),1);
});

test('the take-away list keeps exact names, formats, quantities and GTINs and has no simulated price',async()=>{
  const h=await ready();
  h.run("state.results[0].rows[0].product.gtin='8001234567898'");
  const italian=h.run('onlineListText(state.results[0])');
  assert.match(italian,/3 ×/);
  assert.match(italian,/EAN 8001234567898/);
  assert.match(italian,/Lista promemoria: non è un ordine/);
  assert.doesNotMatch(italian,/€/);
  h.run("setLanguage('en')");
  const english=h.run('onlineListText(state.results[0])');
  assert.match(english,/ONLINE SHOPPING LIST/);
  assert.match(english,/A reminder list, not an order/);
  assert.match(english,/EAN 8001234567898/);
});

test('demo previews the handoff without linking fictional stores to real retailers',()=>{
  const h=harness({staticDemo:true});
  h.run("startDemo(false);state.list=structuredClone(sampleList);state.results=localComparison();state.page='compare';render()");
  assert.match(h.main(),/Prova anche il passaggio alla spesa online/);
  h.run('showOnlineShopping(state.results[0].store.id)');
  const body=h.run('modalSource.body');
  assert.match(body,/negozio è fittizio/);
  assert.match(body,/Scarica la lista/);
  assert.doesNotMatch(body,/href=/);
  assert.equal(h.requests.length,0);
});
