// Browser install capabilities vary. A missing native prompt always has a guide.
export function installEnvironment({userAgent='',platform='',maxTouchPoints=0,standalone=false,displayMode=false,secure=true,preview=false}={}) {
  const ios=/iPhone|iPad|iPod/i.test(userAgent) || platform==='MacIntel' && maxTouchPoints>1;
  const android=/Android/i.test(userAgent);
  return {platform:ios?'ios':android?'android':'desktop',embedded:/FBAN|FBAV|Instagram|Line\/|TikTok|; wv\)|LinkedInApp/i.test(userAgent),installed:standalone || displayMode,secure,preview};
}

export function installationSteps(info) {
  if(info.preview)return ['Apri il link pubblico HTTPS di La mia spesa nel browser del telefono.','Tocca “Scarica l’app” nella home del sito.'];
  if(!info.secure)return ['Apri il sito con un indirizzo HTTPS.','Tocca di nuovo “Scarica l’app”.'];
  if(info.installed)return ['L’app è già aperta in modalità installata.'];
  const steps=[];
  if(info.embedded)steps.push('Apri questa pagina nel browser del telefono, usando il menu dell’app da cui provieni.');
  if(info.platform==='ios')return [...steps,'Apri questa pagina in Safari.','Tocca Condividi; se serve, apri prima il menu della pagina.','Scegli “Aggiungi alla schermata Home”.','Se presente, attiva “Apri come app web”, poi tocca Aggiungi.'];
  if(info.platform==='android')return [...steps,'Apri questa pagina in Chrome o nel browser che usi abitualmente.','Apri il menu ⋮, scegli “Installa e crea scorciatoia” e poi “Installa”.','Se il menu usa un altro nome, cerca “Aggiungi a schermata Home” o “Installa app”.','Conferma Installa o Aggiungi: troverai il logo nella schermata Home.'];
  return [...steps,'Apri il menu del browser e cerca “Installa La mia spesa” o “Installa questa pagina come app”.','Se questa opzione non compare, puoi continuare a usare tutte le funzioni dal sito.'];
}

export function createInstallController({window:win,navigator:nav,location:loc,version,isPreview=false,onChange=()=>{},onReload=()=>win.location.reload()}={}) {
  let promptEvent=null,registration=null,waiting=null,started=false,updating=false,reloaded=false,installedSession=false;
  let prepared=false,registrationError=false;
  const display=win.matchMedia?.('(display-mode: standalone)');
  const environment=()=>installEnvironment({userAgent:nav.userAgent,platform:nav.platform,maxTouchPoints:nav.maxTouchPoints,standalone:nav.standalone===true,displayMode:display?.matches===true,secure:win.isSecureContext!==false && loc.protocol!=='file:',preview:isPreview || loc.protocol==='file:'});
  const snapshot=()=>({...environment(),canPrompt:!!promptEvent && !environment().installed && !installedSession,installed:environment().installed || installedSession,online:nav.onLine!==false,prepared,registrationError,updateAvailable:!!waiting,updating});
  const notify=()=>onChange(snapshot());
  win.addEventListener?.('beforeinstallprompt',event=>{if(environment().preview)return;event.preventDefault();promptEvent=event;notify();});
  win.addEventListener?.('appinstalled',()=>{promptEvent=null;installedSession=true;notify();});
  win.addEventListener?.('online',()=>{notify();registration?.update().catch(()=>{});});
  win.addEventListener?.('offline',notify);
  display?.addEventListener?.('change',notify);
  nav.serviceWorker?.addEventListener?.('controllerchange',()=>{if(updating && !reloaded){reloaded=true;onReload();}});

  const watch=reg=>{
    if(reg.waiting){waiting=reg.waiting;notify();}
    if(reg.active){prepared=true;notify();}
    const track=worker=>{
      if(!worker)return;
      const changed=()=>{
        if(worker.state==='installed' && nav.serviceWorker.controller){waiting=reg.waiting || worker;notify();}
        if(worker.state==='activated'){prepared=true;notify();}
        if(worker.state==='redundant' && !reg.active){started=false;prepared=false;registrationError=true;notify();}
      };
      worker.addEventListener?.('statechange',changed);changed();
    };
    track(reg.installing);reg.addEventListener?.('updatefound',()=>track(reg.installing));
  };
  async function start() {
    const info=environment();
    if(started || info.preview || !info.secure || !nav.serviceWorker?.register)return;
    started=true;registrationError=false;
    try {
      registration=await nav.serviceWorker.register(`./sw.js?v=${encodeURIComponent(version)}`,{scope:'./',updateViaCache:'none'});
      watch(registration);
    } catch {started=false;registrationError=true;notify();}
  }
  async function prompt() {
    if(!promptEvent)return 'unavailable';
    const event=promptEvent;promptEvent=null;notify();
    try {const result=await event.prompt();const choice=event.userChoice?await event.userChoice:result;return choice?.outcome || 'dismissed';}
    catch{return 'failed';}
  }
  function activateUpdate() {
    if(!waiting || updating)return false;
    updating=true;notify();waiting.postMessage({type:'SKIP_WAITING'});return true;
  }
  return {snapshot,start,prompt,activateUpdate};
}
