import test from 'node:test';
import assert from 'node:assert/strict';
import {installEnvironment,installationSteps,createInstallController} from '../public/install.mjs';
import {translateText} from '../public/i18n.mjs';
import {harness} from './helpers/app-harness.mjs';

function browser({userAgent='Android Chrome',secure=true,preview=false,standalone=false,register}={}) {
  const handlers={},workerHandlers={},mediaHandlers={},registrations=[],changes=[];let reloads=0;
  const win={isSecureContext:secure,matchMedia:()=>({matches:standalone,addEventListener:(name,fn)=>mediaHandlers[name]=fn}),addEventListener:(name,fn)=>handlers[name]=fn};
  const nav={userAgent,onLine:true,serviceWorker:{controller:null,addEventListener:(name,fn)=>workerHandlers[name]=fn,register:async(...args)=>{registrations.push(args);return register?register(...args):{active:{},waiting:null,installing:null,addEventListener(){},update:async()=>{}};}}};
  const controller=createInstallController({window:win,navigator:nav,location:{protocol:'https:'},version:'test-version',isPreview:preview,onChange:info=>changes.push(info),onReload:()=>reloads++});
  return {controller,handlers,workerHandlers,nav,registrations,changes,reloads:()=>reloads};
}

test('install guides cover iPhone, iPad desktop mode, Android, embedded browsers and desktop',()=>{
  assert.equal(installEnvironment({userAgent:'iPhone Safari'}).platform,'ios');
  assert.equal(installEnvironment({userAgent:'Macintosh',platform:'MacIntel',maxTouchPoints:5}).platform,'ios');
  assert.equal(installEnvironment({userAgent:'Android Chrome'}).platform,'android');
  assert.equal(installEnvironment({userAgent:'Windows Chrome'}).platform,'desktop');
  const embedded=installEnvironment({userAgent:'Android; wv) Instagram'});assert.equal(embedded.embedded,true);
  assert.match(installationSteps(embedded)[0],/browser del telefono/);
  for(const info of [installEnvironment({userAgent:'iPhone'}),installEnvironment({userAgent:'Android'}),installEnvironment(),installEnvironment({preview:true}),installEnvironment({secure:false}),installEnvironment({standalone:true})]){
    for(const step of installationSteps(info))assert.notEqual(translateText(step,'en'),step,step);
  }
});
test('native installation is user-triggered and a prompt is consumed only once',async()=>{
  const b=browser();let prompts=0,prevented=0;
  b.handlers.beforeinstallprompt({preventDefault(){prevented++;},async prompt(){prompts++;return {outcome:'accepted'};},userChoice:Promise.resolve({outcome:'accepted'})});
  assert.equal(prevented,1);assert.equal(prompts,0);assert.equal(b.controller.snapshot().canPrompt,true);
  assert.equal(await b.controller.prompt(),'accepted');assert.equal(await b.controller.prompt(),'unavailable');assert.equal(prompts,1);
  assert.equal(b.controller.snapshot().installed,false);
  b.handlers.appinstalled();assert.equal(b.controller.snapshot().installed,true);assert.equal(b.controller.snapshot().canPrompt,false);
});
test('cancelled and rejected install prompts remain recoverable through the guide',async()=>{
  for(const fail of [false,true]){
    const b=browser();b.handlers.beforeinstallprompt({preventDefault(){},async prompt(){if(fail)throw new Error('not allowed');return {outcome:'dismissed'};}});
    assert.equal(await b.controller.prompt(),fail?'failed':'dismissed');assert.equal(b.controller.snapshot().canPrompt,false);assert.equal(b.controller.snapshot().installed,false);
    assert.ok(installationSteps(b.controller.snapshot()).length>0);
  }
});
test('service worker setup uses the correct scope and does not run in a demo or insecure context',async()=>{
  const normal=browser();await normal.controller.start();assert.equal(normal.registrations.length,1);assert.equal(normal.registrations[0][0],'./sw.js?v=test-version');assert.deepEqual(normal.registrations[0][1],{scope:'./',updateViaCache:'none'});assert.equal(normal.controller.snapshot().prepared,true);
  for(const options of [{secure:false},{preview:true}]){const b=browser(options);await b.controller.start();assert.equal(b.registrations.length,0);}
});
test('failed worker registration can be retried without claiming offline readiness',async()=>{
  let calls=0;const b=browser({register:async()=>{if(++calls===1)throw new Error('offline');return {active:{},addEventListener(){}};}});
  await b.controller.start();assert.equal(b.controller.snapshot().registrationError,true);assert.equal(b.controller.snapshot().prepared,false);
  await b.controller.start();assert.equal(calls,2);assert.equal(b.controller.snapshot().prepared,true);assert.equal(b.controller.snapshot().registrationError,false);
  const events={};let attempts=0;const worker={state:'installing',addEventListener:(name,fn)=>events[name]=fn};
  const partial=browser({register:async()=>++attempts===1?{installing:worker,active:null,addEventListener(){}}:{active:{},addEventListener(){}}});
  await partial.controller.start();worker.state='redundant';events.statechange();assert.equal(partial.controller.snapshot().registrationError,true);
  await partial.controller.start();assert.equal(attempts,2);assert.equal(partial.controller.snapshot().prepared,true);
});
test('waiting updates activate only on request and reload once after activation',async()=>{
  const messages=[];const b=browser({register:async()=>({active:{},waiting:{postMessage:message=>messages.push(message)},addEventListener(){}})});
  await b.controller.start();assert.equal(b.controller.snapshot().updateAvailable,true);assert.equal(messages.length,0);
  b.workerHandlers.controllerchange();assert.equal(b.reloads(),0);
  assert.equal(b.controller.activateUpdate(),true);assert.equal(b.controller.activateUpdate(),false);assert.deepEqual(messages,[{type:'SKIP_WAITING'}]);
  b.workerHandlers.controllerchange();b.workerHandlers.controllerchange();assert.equal(b.reloads(),1);
});
test('offline and online events expose actual connectivity without implying current prices',()=>{
  const b=browser();b.nav.onLine=false;b.handlers.offline();assert.equal(b.controller.snapshot().online,false);
  b.nav.onLine=true;b.handlers.online();assert.equal(b.controller.snapshot().online,true);assert.equal(b.changes.length,2);
});
test('home includes the logo and install control; standalone demo offers a translated guide without installing',()=>{
  const h=harness({staticDemo:true});assert.match(h.main(),/welcome-brand/);assert.match(h.main(),/data-action="install-app"/);
  h.document.activeElement={tagName:'INPUT'};h.run('syncInstallUi()');assert.equal(h.document.querySelector('#home-install').hidden,true);
  h.document.activeElement=null;h.run('syncInstallUi()');assert.equal(h.document.querySelector('#home-install').hidden,false);
  h.run('showInstallGuide()');assert.match(h.document.querySelector('#modal-content').innerHTML,/demo/);
  h.run("setLanguage('en')");const body=h.document.querySelector('#modal-content').innerHTML;
  assert.match(body,/Install from the published website/);assert.doesNotMatch(body,/Tocca|Apri il|Scarica l’app/);
  h.run('closeModal();startDemo(false)');assert.doesNotMatch(h.main(),/data-action="install-app"/);assert.equal(h.requests.length,0);
});
