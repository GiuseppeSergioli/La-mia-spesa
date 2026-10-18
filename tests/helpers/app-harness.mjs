import {readFile} from 'node:fs/promises';
import {createContext,runInContext} from 'node:vm';
import * as Core from '../../public/core.mjs';
import * as Demo from '../../public/demo.mjs';
import * as Art from '../../public/art.mjs';
import * as Location from '../../public/location.mjs';
import * as Catalog from '../../public/catalog.mjs';
import * as Version from '../../public/version.mjs';
import * as I18n from '../../public/i18n.mjs';
import * as History from '../../public/history.mjs';
import * as Install from '../../public/install.mjs';
import {shoppingCatalog} from '../../server/shopping.mjs';

// Execute the actual app and event handlers with DOM stubs. These checks verify
// navigation and asynchronous state, not browser layout or physical GPS.
const source=(await readFile(new URL('../../public/app.mjs',import.meta.url),'utf8')).replace(/^import .+ from .+;\n/gm,'');
const element=()=>({innerHTML:'',textContent:'',value:'',open:false,hidden:false,dataset:{},classList:{add(){},remove(){},toggle(){}},focus(){},querySelector(){return element();},querySelectorAll(){return [];},setAttribute(){},removeAttribute(){},addEventListener(){},close(){this.open=false;},showModal(){this.open=true;}});
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
const fixture=(location=Location.DEFAULT_START)=>{
  const stores=[{id:'fixture:market',name:'Test market',lat:location.lat,lon:location.lon,address:'Test address',offers:{},catalogStatus:'not_connected'}];
  return {mode:'live',...shoppingCatalog([],stores),stores,warnings:[],retailerSources:[],storeDiscovery:{status:'online',mapAvailable:true},attribution:'Test fixture'};
};
function harness({staticDemo=false,respond=async()=>Response.json(fixture()),savedStorage=null}={}) {
  const nodes=new Map(),handlers={},requests=[],storage=savedStorage || new Map();
  const document={documentElement:{lang:'it',setAttribute(name,value){this[name]=value;}},querySelector(selector){if(!nodes.has(selector))nodes.set(selector,element());return nodes.get(selector);},getElementById(id){return this.querySelector(`#${id}`);},querySelectorAll(){return [];},addEventListener(name,fn){handlers[name]=fn;},title:''};
  const context=createContext({...Core,...Demo,...Art,...Location,...Catalog,...Version,...I18n,...History,...Install,document,window:{SPESINA_STATIC:staticDemo,scrollTo(){},isSecureContext:true},navigator:{},localStorage:{getItem(key){return storage.get(key) || null;},setItem(key,value){storage.set(key,value);},removeItem(key){storage.delete(key);}},location:{protocol:'file:'},fetch:(url,options)=>{requests.push(String(url));return respond(url,options);},FormData:class{constructor(form){this.form=form;}get(name){return name==='address'?this.form.address.value:this.form.radius;}},URL,URLSearchParams,AbortController,setTimeout(){return 0;},clearTimeout(){},structuredClone,console});
  runInContext(source,context);
  const run=code=>runInContext(code,context);
  const form=(address='')=>{
    const feedback=element(),candidates=element(),input=element();input.value=address;
    context.form={id:'location-form',address:input,radius:3,feedback,candidates,querySelector(selector){return selector==='[name="address"]'?input:selector==='.form-feedback'?feedback:selector==='.location-candidates'?candidates:element();},querySelectorAll(){return [];}};
    return context.form;
  };
  return {run,form,context,document,requests,storage,handlers,main:()=>document.querySelector('#main').innerHTML};
}


export {harness,fixture,deferred};
