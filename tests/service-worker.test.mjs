import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {createContext,runInContext} from 'node:vm';
import {APP_VERSION} from '../public/version.mjs';
const root=new URL('../public/',import.meta.url),scope='https://example.test/';
const source=await readFile(new URL('sw.js',root),'utf8');
function worker() {
  const handlers={},stores=new Map(),requests=[];let claimed=0,skipped=0;
  const key=value=>typeof value==='string'?value:value.url;
  const caches={async keys(){return [...stores.keys()];},async delete(name){return stores.delete(name);},async open(name){
    if(!stores.has(name))stores.set(name,new Map());const map=stores.get(name);
    return {async match(value){return map.get(key(value))?.clone();},async put(value,response){map.set(key(value),response);},async addAll(values){for(const value of values){requests.push(value.url);const url=new URL(value.url);const file=new URL('.'+url.pathname,root);await stat(file);map.set(value.url,new Response(await readFile(file)));}}};
  }};
  const self={registration:{scope},clients:{async claim(){claimed++;}},skipWaiting(){skipped++;},addEventListener:(name,fn)=>handlers[name]=fn};
  runInContext(source,createContext({self,caches,URL,Request,fetch:async()=>{throw new Error('offline');}}));
  const wait=async name=>{let work;handlers[name]({waitUntil(promise){work=promise;}});await work;};
  const request=async value=>{let work;handlers.fetch({request:value,respondWith(promise){work=promise;}});return work?await work:null;};
  return {handlers,stores,requests,wait,request,claimed:()=>claimed,skipped:()=>skipped};
}
test('worker version matches the app and all precached files are present in the distributable',async()=>{
  const w=worker();await w.wait('install');assert.ok(w.stores.has(`la-mia-spesa-shell-${APP_VERSION}`));
  assert.ok(w.requests.includes(`https://example.test/app.mjs?v=${APP_VERSION}`));assert.ok(w.requests.includes('https://example.test/assets/logo.png'));
  assert.ok(w.requests.every(url=>!url.includes('/api/')));assert.equal(w.skipped(),0);
});
test('API requests, non-GET requests, external shops and unknown assets always bypass the cache',async()=>{
  const w=worker();for(const value of [
    {method:'GET',url:scope+'api/catalog?lat=39&lon=9',mode:'cors'},
    {method:'GET',url:scope+'api/geocode?q=private-address',mode:'cors'},
    {method:'GET',url:scope+'api/status',mode:'cors'},
    {method:'POST',url:scope+'api/compare',mode:'cors'},
    {method:'GET',url:'https://www.cosicomodo.it/pan/cagliari-plaia',mode:'navigate'},
    {method:'GET',url:scope+'unknown.mjs',mode:'cors'}
  ])assert.equal(await w.request(value),null,value.url);
  assert.equal(w.stores.size,0);
});
test('the cached shell and its matching modules work offline, without an HTML fallback for missing scripts',async()=>{
  const w=worker();await w.wait('install');
  const home=await w.request({method:'GET',url:scope+'?source=pwa',mode:'navigate'});assert.match(await home.text(),/manifest.webmanifest/);
  const script=await w.request({method:'GET',url:scope+`app.mjs?v=${APP_VERSION}`,mode:'cors'});assert.match(await script.text(),/createInstallController/);
  assert.equal(await w.request({method:'GET',url:scope+'not-a-script.mjs',mode:'cors'}),null);
});
test('activation removes only old app shells and never deletes caches belonging to other apps',async()=>{
  const w=worker();w.stores.set('another-app-cache',new Map());w.stores.set('la-mia-spesa-shell-old',new Map());await w.wait('install');await w.wait('activate');
  assert.ok(w.stores.has('another-app-cache'));assert.ok(w.stores.has(`la-mia-spesa-shell-${APP_VERSION}`));assert.equal(w.stores.has('la-mia-spesa-shell-old'),false);assert.equal(w.claimed(),1);
  w.handlers.message({data:{type:'OTHER'}});assert.equal(w.skipped(),0);w.handlers.message({data:{type:'SKIP_WAITING'}});assert.equal(w.skipped(),1);
});
test('manifest and Apple icon use the generated brand with actual correct PNG dimensions',async()=>{
  const manifest=JSON.parse(await readFile(new URL('manifest.webmanifest',root),'utf8'));
  assert.equal(manifest.name,'La mia spesa');assert.equal(manifest.display,'standalone');assert.equal(manifest.scope,'./');assert.equal(manifest.start_url,'./');
  assert.equal('orientation' in manifest,false);
  assert.ok(manifest.icons.some(icon=>icon.purpose==='maskable'));
  for(const icon of [...manifest.icons,{src:'./assets/apple-touch-icon.png',sizes:'180x180'}]){
    const png=await readFile(new URL(icon.src,root));assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`,icon.sizes);
  }
});
