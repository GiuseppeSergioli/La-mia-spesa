import { compareBasket, nearbyStores, normalizeList, lowestPrice, money, distance, savingsBetweenComplete, MAX_QUANTITY, validCoordinates } from './core.mjs';
import { createDemoData, demoLocation, sampleList } from './demo.mjs';
import { icon, productArt, heroArt } from './art.mjs';

const $ = (selector,root=document) => root.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='spesina:v1';
const state={page:'location',mode:'live',radius:5,location:null,data:null,list:[],category:'all',search:'',live:false,busy:false,cartOpen:false,completeOnly:false,results:null};
let toastTimer, requestId=0;
let saved=null;
try {saved=JSON.parse(localStorage.getItem(KEY));} catch {}
const stores = () => state.data && state.location ? nearbyStores(state.data.stores,state.location,state.radius):[];
const products = () => state.data?.products || [];
const count = () => state.list.reduce((n,item)=>n+item.quantity,0);
const product = id => products().find(p=>p.id===id);
const quantity = id => state.list.find(i=>i.productId===id)?.quantity || 0;
const statusLabels={available:'Disponibile',out_of_stock:'Esaurito',unknown:'Disponibilità non verificata',stale:'Prezzo non aggiornato',insufficient:'Quantità insufficiente'};

function persist() {
  try {localStorage.setItem(KEY,JSON.stringify({version:1,mode:state.mode,location:state.location,radius:state.radius,list:state.list}));} catch {}
}
function toast(message) {
  const el=$('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3800);
}
async function api(path,options={}) {
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),35_000);
  try {
    const response=await fetch(`./api/${path}`,{...options,signal:controller.signal});
    if (!(response.headers.get('content-type') || '').includes('application/json')) throw new Error('La ricerca reale richiede l’app completa con il server attivo. Puoi esplorare la demo.');
    const data=await response.json();if (!response.ok) throw new Error(data.error || 'Servizio non disponibile.');return data;
  } catch(e) {if (e.name==='AbortError') throw new Error('La ricerca sta impiegando troppo tempo. Riprova con un raggio più piccolo.');throw e;}
  finally {clearTimeout(timer);}
}
function hydrateIcons(root=document) {root.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));}
function announcePage() {$('#main').focus({preventScroll:true});window.scrollTo({top:0,behavior:'smooth'});}

function updateHeader() {
  const order=['location','catalog','compare'],current=order.indexOf(state.page);
  document.querySelectorAll('[data-step]').forEach(button=> {
    const step=button.dataset.step,i=order.indexOf(step);
    button.classList.toggle('active',step===state.page);button.classList.toggle('done',i<current);
    button.disabled=state.busy || step!=='location' && !state.data || step==='compare' && !state.list.length;
    if (step===state.page) button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');
    $('.step-number',button).innerHTML=i<current ? icon('check'):i+1;
  });
  const banner=$('#mode-banner');banner.hidden=state.mode!=='demo';
  banner.innerHTML=`<span>${icon('info')} <strong>Modalità demo</strong><span class="demo-message">Negozi, prezzi e disponibilità sono fittizi.</span></span><button data-action="exit-demo">Passa alla ricerca reale ${icon('arrow')}</button>`;
}

function render() {
  updateHeader();
  $('#main').innerHTML=state.page==='location' ? locationPage():state.page==='compare' ? comparePage():catalogPage();
  hydrateIcons($('#main'));
  document.title=state.page==='compare' ? 'Il tuo confronto — Spesina':state.page==='catalog' ? 'La tua lista — Spesina':'Spesina — La tua spesa, al prezzo giusto.';
}

function locationFields(modal=false) {
  return `<form id="${modal?'location-modal-form':'location-form'}" class="location-form">
    <label class="field-label" for="${modal?'modal-address':'address'}">Da dove partiamo?</label>
    <div class="address-field">${icon('pin')}<input id="${modal?'modal-address':'address'}" name="address" autocomplete="street-address" maxlength="200" minlength="3" placeholder="Città, CAP o indirizzo" value="${esc(state.mode==='live' ? state.location?.label || saved?.mode==='live' && saved?.location?.label || '':'')}" required></div>
    <button class="text-button geolocation" type="button" data-action="geolocate">${icon('target')} Usa la mia posizione</button>
    <div class="radius-heading"><label class="field-label" for="${modal?'modal-radius':'radius'}">Quanto vuoi spostarti?</label><output class="radius-output" for="${modal?'modal-radius':'radius'}">${state.radius} km</output></div>
    <input class="radius-slider" id="${modal?'modal-radius':'radius'}" name="radius" type="range" min="1" max="25" value="${state.radius}" step="1"><div class="range-labels"><span>1 km</span><span>25 km</span></div>
    <p class="field-hint">Raggio in linea d’aria dalla posizione scelta.</p>
    <button class="button primary full" type="submit" ${state.busy?'disabled':''}>${state.busy?'<span class="spinner"></span> Ricerca in corso…':`Cerca supermercati ${icon('arrow')}`}</button>
    <div class="form-feedback" role="status"></div><div class="location-candidates"></div>
  </form>`;
}

function locationPage() {
  return `<section class="welcome"><div class="welcome-copy"><div class="eyebrow"><span class="eyebrow-line"></span>LA TUA SPESA, PIÙ LEGGERA</div>
    <h1>Stessa spesa.<br><em>Una scelta migliore.</em></h1><p class="welcome-description">Scegli cosa mettere nel carrello.<br>Scopri dove conviene comprarlo, vicino a te.</p>
    <div class="welcome-art">${heroArt()}</div><div class="welcome-note">${icon('check')} Stessi prodotti e formati ${icon('check')} Totali trasparenti</div>
    </div><div class="location-card"><span class="little-label">COMINCIAMO DA QUI</span><h2>La convenienza è vicina.</h2><p>Troviamo i supermercati nella tua zona.</p>${locationFields()}
    <div class="demo-entry"><span>Vuoi prima dare un’occhiata?</span><button data-action="demo">Prova la demo ${icon('arrow')}</button></div>
    ${!state.live?'<p class="static-note">In questa anteprima puoi provare la demo. La ricerca reale si attiva avviando il server.</p>':''}</div></section>
    <section class="how-strip"><div><span class="how-number">01</span><div><h3>Scegli la tua zona</h3><p>Tu decidi quanto allontanarti.</p></div></div><div><span class="how-number">02</span><div><h3>Componi la tua lista</h3><p>I prodotti che ami, per categoria.</p></div></div><div><span class="how-number">03</span><div><h3>Confronta tutta la spesa</h3><p>Un totale chiaro per ogni negozio.</p></div></div></section>
    <div class="honesty-note">${icon('shield')} I prezzi reali vengono mostrati solo per i punti vendita con catalogo collegato. Nessuna stima nascosta.</div>`;
}

function locationStrip() {
  return `<div class="location-strip"><div>${icon('pin')}<div><strong>${esc(state.location?.label)}</strong><span>Entro ${state.radius} km in linea d’aria</span></div><button class="text-button" data-action="edit-location">Modifica</button></div><button class="store-count" data-action="stores">${icon('store')}<span><strong>${stores().length}</strong> supermercati ${state.mode==='demo'?'demo':'trovati'}</span>${icon('chevron')}</button></div>`;
}

function catalogPage() {
  const p=products();
  return `<section class="page-intro"><div><div class="eyebrow">PICCOLE SCELTE, UNA BELLA DIFFERENZA</div><h1>La tua lista. <em>Il prezzo giusto.</em></h1><p>Aggiungi quello che ti serve. Al resto ci pensiamo noi.</p></div><span class="section-doodle">${icon('bag')}<span>La spesa di sempre,<br>con un po’ più di cura.</span></span></section>
    ${locationStrip()}${state.mode==='live' && state.data.warnings.length?`<div class="data-notice">${icon('info')}<div>${state.data.warnings.map(w=>`<p>${esc(w)}</p>`).join('')}</div></div>`:''}
    <div class="shopping-layout"><section class="catalog" aria-label="Catalogo prodotti"><div class="catalog-heading"><h2>Cosa mettiamo in lista?</h2><span>${p.length} prodotti ${state.mode==='demo'?'di esempio':''}</span></div>
      <div class="search-field">${icon('search')}<input id="product-search" type="search" autocomplete="off" placeholder="Cerca un prodotto o una marca…" aria-label="Cerca un prodotto o una marca" value="${esc(state.search)}"><kbd aria-hidden="true">/</kbd></div>
      <div class="categories" role="group" aria-label="Categorie prodotti">${(state.data.categories || []).map(c=>`<button class="category ${state.category===c.id?'selected':''}" data-category="${esc(c.id)}" aria-pressed="${state.category===c.id}">${icon(c.icon)}${esc(c.name)}</button>`).join('')}</div>
      <div class="product-section-heading"><h3 id="category-title">${esc(state.data.categories.find(c=>c.id===state.category)?.name || 'Tutti i prodotti')}${state.category==='all'?' i prodotti':''}</h3><span class="muted">Stesso prodotto, stesso formato</span></div>
      <div id="product-grid" class="product-grid">${productGrid()}</div>
      ${p.length?'<p class="catalog-footnote">Le immagini sono illustrazioni indicative. I prezzi “da” si riferiscono ai negozi nel raggio scelto.</p>':''}
    </section><aside class="cart-area" id="cart-area" aria-label="La tua lista">${cart()}</aside></div><button class="mobile-cart" data-action="toggle-cart">${icon('bag')}<span>La tua lista · <b id="mobile-count">${count()}</b></span>${icon('chevron')}</button>
    <div class="source-note">${icon('info')}<span>${esc(state.data.attribution)}</span></div>`;
}

function productGrid() {
  if (!products().length) return `<div class="empty-state no-catalog"><span class="empty-icon">${icon('store')}</span><h3>${stores().length?'Negozi trovati. Ora servono i cataloghi.':'Non abbiamo trovato negozi in questa zona.'}</h3><p>${stores().length?'Per scegliere prodotti e confrontare prezzi, collega i cataloghi dei singoli punti vendita. I negozi trovati sulla mappa non forniscono automaticamente prezzi e scorte.':'Prova ad ampliare il raggio o a cercare un altro indirizzo.'}</p><button class="button primary" data-action="${stores().length?'demo':'edit-location'}">${stores().length?'Esplora il confronto in demo':'Modifica la zona'} ${icon('arrow')}</button>${stores().length?'<button class="text-button" data-action="stores">Vedi i negozi trovati</button>':''}</div>`;
  const filtered=products().filter(p=>(state.category==='all' || p.category===state.category) && `${p.name} ${p.brand} ${p.size}`.toLocaleLowerCase('it').includes(state.search.toLocaleLowerCase('it')));
  if (!filtered.length) return `<div class="empty-state"><span class="empty-icon">${icon('search')}</span><h3>Qui non c’è ancora.</h3><p>Prova un’altra parola o scegli una categoria diversa.</p><button class="text-button" data-action="clear-search">Mostra tutti i prodotti</button></div>`;
  return filtered.map(p=> {
    const qty=quantity(p.id),min=lowestPrice(p.id,stores(),Math.max(qty,1));
    const available=stores().filter(s=>lowestPrice(p.id,[s],Math.max(qty,1))!==null).length;
    return `<article class="product-card ${qty?'in-list':''}"><div class="product-visual"><img src="${productArt(p)}" alt="" width="180" height="190" loading="lazy">${qty?`<span class="added-badge">${icon('check')} In lista</span>`:''}</div><div class="product-info"><span class="product-brand">${esc(p.brand)}</span><h4>${esc(p.name)}</h4><span class="product-size">${esc(p.size)}</span><div class="product-bottom"><div><span class="price-label">${min!==null?'a partire da':'Prezzo non verificato'}</span>${min!==null?`<strong class="product-price">${money(min)}</strong><span class="available-count">in ${available} ${available===1?'negozio':'negozi'}</span>`:''}</div>${qty?quantityControl(p.id,qty):`<button class="add-button" data-add="${esc(p.id)}" aria-label="Aggiungi ${esc(p.name)} alla lista">${icon('plus')}</button>`}</div></div></article>`;
  }).join('');
}

function quantityControl(id,qty,small=false) {
  const p=product(id);
  return `<div class="quantity-control ${small?'small':''}" role="group" aria-label="Quantità ${esc(p?.name)}"><button data-delta="-1" data-product="${esc(id)}" aria-label="${qty===1?'Rimuovi':'Riduci quantità di'} ${esc(p?.name)}">${icon(qty===1?'trash':'minus')}</button><span aria-label="${qty} confezioni">${qty}</span><button data-delta="1" data-product="${esc(id)}" ${qty>=MAX_QUANTITY?'disabled':''} aria-label="Aumenta quantità di ${esc(p?.name)}">${icon('plus')}</button></div>`;
}

function cart() {
  const total=state.list.reduce((sum,item)=>sum+(lowestPrice(item.productId,stores(),item.quantity) ?? 0)*item.quantity,0);
  const hasAll=state.list.every(item=>lowestPrice(item.productId,stores(),item.quantity)!==null);
  return `<div class="cart ${state.cartOpen?'cart-open':''}"><div class="cart-heading"><div>${icon('bag')}<h2>La tua lista</h2><span class="count-badge">${count()}</span></div>${state.list.length?'<button class="icon-button" data-action="clear-list" aria-label="Svuota la lista">'+icon('trash')+'</button>':''}<button class="icon-button close-cart" data-action="toggle-cart" aria-label="Chiudi lista">${icon('close')}</button></div>
    ${state.list.length?`<div class="cart-items">${state.list.map(item=> {
      const p=product(item.productId);return `<div class="cart-item"><img src="${productArt(p)}" alt="" width="42" height="48"><div><strong>${esc(p.name)}</strong><span>${esc(p.brand)} · ${esc(p.size)}</span>${quantityControl(p.id,item.quantity,true)}</div></div>`;
    }).join('')}</div><div class="cart-estimate"><span>${hasAll?'Minimo teorico':'Subtotale teorico verificato'}</span><strong>${money(total)}</strong></div><p class="cart-disclaimer">Somma dei prezzi minimi tra negozi diversi.${hasAll?'':' Alcuni prezzi non sono verificati.'} Il totale per un solo negozio è nel confronto.</p>`:`<div class="empty-cart"><span>${icon('list')}</span><h3>Le buone scelte<br>iniziano da una lista.</h3><p>Tocca <b>+</b> sui prodotti per aggiungerli qui.</p>${state.mode==='demo'?'<button class="text-button" data-action="sample-list">Usa una lista d’esempio '+icon('arrow')+'</button>':''}</div>`}
    <div class="cart-cta"><button class="button primary full" data-action="compare" ${!state.list.length || state.busy?'disabled':''}>${state.busy?'<span class="spinner"></span> Aggiornamento prezzi…':`Confronta la spesa ${icon('arrow')}`}</button><span>${icon('shield')} Stessi prodotti, confronto trasparente</span></div></div>`;
}

function comparePage() {
  const results=state.results || compareBasket(state.list,products(),stores());
  const complete=results.filter(r=>r.complete),incomplete=results.filter(r=>!r.complete),best=complete[0],saving=savingsBetweenComplete(results);
  let rank=0;
  return `<section class="page-intro compare-intro"><div><button class="text-button back-button" data-action="catalog">${icon('back')} Modifica la lista</button><div class="eyebrow">LA CONVENIENZA, NERO SU BIANCO</div><h1>La stessa spesa.<br class="mobile-only"> <em>Tutti i totali.</em></h1><p>${count()} confezioni, ${state.list.length} prodotti distinti. Ecco dove puoi acquistarli.</p></div><div class="compare-actions"><button class="button secondary" data-action="export">${icon('download')} Esporta lista</button><button class="icon-button bordered" data-action="print" aria-label="Stampa confronto">${icon('print')}</button></div></section>${locationStrip()}
    ${best?`<div class="winner"><div class="winner-info"><span class="winner-label">${icon('spark')} ${complete.length>1?'IL TOTALE COMPLETO PIÙ BASSO':'SPESA COMPLETA DISPONIBILE'}</span><h2>${esc(best.store.name)}</h2><p>${icon('check')} Tutti i ${state.list.length} prodotti della tua lista · ${distance(best.store.distanceKm)}</p><div class="winner-note">${saving!==null && saving>0?`<strong>Risparmi ${money(saving)}</strong> rispetto al più caro tra i ${complete.length} negozi con lista completa.`:'Il totale include tutte le quantità selezionate.'}</div></div><div class="winner-price"><span>Totale della tua spesa</span><strong>${money(best.totalCents)}</strong><button class="button winner-button" data-detail="${esc(best.store.id)}">Vedi il dettaglio ${icon('arrow')}</button></div><span class="winner-decoration" aria-hidden="true">${icon('bag')}</span></div>`:`<div class="no-winner">${icon('info')}<div><h2>Nessun negozio copre tutta la lista.</h2><p>Trovi qui i subtotali dei prodotti verificati e cosa manca. Non sono confrontabili con una spesa completa.</p></div></div>`}
    <div class="results-heading"><h2>Il confronto, negozio per negozio</h2><span>${complete.length} ${complete.length===1?'lista completa':'liste complete'} su ${results.length} negozi</span></div>
    <div class="comparison-legend">${icon('info')} I totali completi sono ordinati dal meno al più costoso. I subtotali con prodotti mancanti sono separati.</div>
    <div class="comparison-results">${complete.length?`<div class="complete-results">${complete.map(r=>storeResult(r,++rank,best)).join('')}</div>`:''}
    ${incomplete.length?`<section class="incomplete-section"><div class="incomplete-heading"><h3>Liste incomplete <span>${incomplete.length}</span></h3><label class="filter-switch"><input id="hide-incomplete" type="checkbox" ${state.completeOnly?'checked':''}><span>Nascondi</span></label></div><p class="incomplete-explainer">Ordinate per numero di prodotti coperti. Il subtotale esclude quelli non verificati o mancanti.</p><div id="incomplete-results" ${state.completeOnly?'hidden':''}>${incomplete.map(r=>storeResult(r,null,best)).join('')}</div></section>`:''}</div>
    <p class="comparison-footnote">${icon('clock')} ${state.mode==='demo'?'Simulazione con prezzi fittizi.':'Prezzi rilevati alle date indicate nel dettaglio. Disponibilità soggetta a variazioni.'} Totali dei prodotti, senza viaggio né consegna. Le offerte vincolate a tessere non sono incluse.</p><div class="source-note">${icon('info')}<span>${esc(state.data.attribution)}</span></div>`;
}

function storeResult(r,rank,best) {
  const isBest=best?.store.id===r.store.id,delta=r.complete && best ? r.totalCents-best.totalCents:null;
  const hasSome=r.availableCount>0;
  return `<article class="store-result ${isBest?'is-best':''} ${r.complete?'':'is-incomplete'}"><div class="store-result-main"><span class="store-rank">${rank ?? '—'}</span><span class="store-logo" style="--store-color:${/^#[\da-f]{6}$/i.test(r.store.color || '')?r.store.color:'#48745e'}">${esc(r.store.initial || r.store.name[0])}</span><div class="store-identification"><h3>${esc(r.store.name)} ${isBest?'<span class="best-badge">'+icon('check')+' Completa</span>':''}</h3><p>${icon('pin')}${distance(r.store.distanceKm)} · ${esc(r.store.address)}</p></div><div class="store-coverage ${r.complete?'good':'partial'}">${icon(r.complete?'check':'info')}<span>${r.availableCount}/${r.rows.length} prodotti<span>${r.complete?'Tutta la tua lista':`${r.missingCount} ${r.missingCount===1?'da verificare o mancante':'da verificare o mancanti'}`}</span></span></div><div class="store-total"><span>${r.complete?'Totale completo':hasSome?'Subtotale parziale':'Totale non calcolabile'}</span><strong>${r.complete || hasSome?money(r.totalCents):'—'}</strong>${delta>0?`<small>+ ${money(delta)} dal più basso</small>`:''}</div><button class="detail-button" data-detail="${esc(r.store.id)}" aria-label="Dettaglio spesa ${esc(r.store.name)}">${icon('arrow')}</button></div>${!r.complete?`<div class="missing-preview">${r.rows.filter(row=>row.status!=='available').map(row=>`<span>${esc(row.product.name)}: ${statusLabels[row.status].toLocaleLowerCase('it')}</span>`).join('')}</div>`:''}</article>`;
}

function refreshListUI() {
  persist();state.results=null;
  if (state.page!=='catalog') return render();
  const active=document.activeElement;
  const focusId=active?.dataset.product || active?.dataset.add,focusDelta=active?.dataset.delta;
  $('#product-grid').innerHTML=productGrid();$('#cart-area').innerHTML=cart();$('#mobile-count').textContent=count();updateHeader();
  if (focusId) {
    const candidates=[...document.querySelectorAll('[data-product],[data-add]')];
    candidates.find(el=>(el.dataset.product || el.dataset.add)===focusId && (!focusDelta || el.dataset.delta===focusDelta))?.focus({preventScroll:true});
  }
}

function changeQuantity(id,delta) {
  if (!product(id)) return;
  const item=state.list.find(i=>i.productId===id);
  if (!item && delta>0) state.list.push({productId:id,quantity:1});
  else if (item) {item.quantity=Math.min(MAX_QUANTITY,item.quantity+delta);if (item.quantity<=0) state.list=state.list.filter(i=>i.productId!==id);}
  refreshListUI();
  if (delta>0) toast(`${product(id).name} · ${quantity(id)} in lista`);
}

function startDemo(withSample=false) {
  requestId++;state.busy=false;state.mode='demo';state.location={...demoLocation};state.data=createDemoData();state.radius=5;state.list=withSample?structuredClone(sampleList):[];state.page='catalog';state.category='all';state.search='';state.results=null;state.cartOpen=false;
  closeModal();persist();render();announcePage();
}
function exitDemo() {
  requestId++;state.busy=false;state.mode='live';state.data=null;state.list=[];state.location=null;state.results=null;state.page='location';state.cartOpen=false;saved=null;persist();closeModal();render();announcePage();
}

async function findLocation(form) {
  if (state.busy) return;
  const feedback=$('.form-feedback',form),candidates=$('.location-candidates',form),submit=$('[type=submit]',form);
  if (!state.live) {feedback.textContent='La ricerca reale richiede il server. Per esplorare l’app scegli “Prova la demo”.';return;}
  const id=++requestId;state.busy=true;submit.disabled=true;submit.innerHTML='<span class="spinner"></span> Cerco il tuo indirizzo…';feedback.textContent='';candidates.innerHTML='';
  try {
    const q=new FormData(form).get('address').trim();
    const data=await api(`geocode?q=${encodeURIComponent(q)}`);if (id!==requestId) return;
    if (!data.results.length) {feedback.textContent='Nessun indirizzo trovato in Italia. Prova “via, numero, città” o il nome del comune.';return;}
    candidates.innerHTML='<span class="field-label">Scegli la posizione corretta</span>'+data.results.map((loc,i)=>`<button type="button" data-location-index="${i}">${icon('pin')}<span>${esc(loc.label)}</span>${icon('arrow')}</button>`).join('');
    form._locations=data.results;
    $('[data-location-index]',candidates)?.focus();
  } catch(e) {if(id===requestId) feedback.textContent=e.message;}
  finally {if(id===requestId) {state.busy=false;submit.disabled=false;submit.innerHTML=`Cerca supermercati ${icon('arrow')}`;updateHeader();}}
}

async function loadLocation(loc,radius,feedback) {
  if(state.busy) return;const id=++requestId;state.busy=true;
  if(feedback) feedback.innerHTML='<span class="spinner dark"></span> Cerco i supermercati e i cataloghi nella tua zona…';
  document.querySelectorAll('[data-location-index],#location-form [type=submit],#location-modal-form [type=submit]').forEach(el=>el.disabled=true);
  try {
    const data=await api(`catalog?${new URLSearchParams({lat:loc.lat,lon:loc.lon,radius})}`);if(id!==requestId) return;
    const oldCount=state.list.length;
    state.mode='live';state.location=loc;state.radius=radius;state.data=data;state.list=normalizeList(state.list,data.products);state.page='catalog';state.category='all';state.search='';state.results=null;
    if(state.list.length<oldCount) toast('Alcuni prodotti non sono presenti nel nuovo catalogo e sono stati rimossi dalla lista.');
    closeModal();persist();render();announcePage();
  } catch(e) {if(id===requestId && feedback) feedback.textContent=e.message;}
  finally {if(id===requestId){state.busy=false;document.querySelectorAll('[data-location-index],#location-form [type=submit],#location-modal-form [type=submit]').forEach(el=>el.disabled=false);if(state.page==='catalog') render();else updateHeader();}}
}

function geolocate() {
  const form=$('#location-modal-form') || $('#location-form'),feedback=$('.form-feedback',form);
  if(!state.live){feedback.textContent='La posizione reale è disponibile avviando il server dell’app.';return;}
  if(!navigator.geolocation){feedback.textContent='Questo browser non supporta la geolocalizzazione. Inserisci un indirizzo.';return;}
  if(state.busy) return;
  const id=++requestId;state.busy=true;feedback.textContent='In attesa della tua posizione…';
  navigator.geolocation.getCurrentPosition(pos=> {
    if(id!==requestId)return;state.busy=false;
    loadLocation({lat:pos.coords.latitude,lon:pos.coords.longitude,label:'La tua posizione'},Number(new FormData(form).get('radius')),feedback);
  },()=>{if(id!==requestId)return;state.busy=false;feedback.textContent='Posizione non disponibile o permesso negato. Puoi inserire un indirizzo.';},{enableHighAccuracy:false,timeout:12_000,maximumAge:300_000});
}

async function showComparison() {
  if(!state.list.length || state.busy)return;
  if(state.mode==='live') {
    state.busy=true;refreshListUI();
    try {
      const response=await api('compare',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lat:state.location.lat,lon:state.location.lon,radius:state.radius,list:state.list})});
      state.results=response.results;
      if(response.warnings.length) toast(response.warnings[0]);
    } catch(e){toast(e.message);return;}
    finally {state.busy=false;if(state.page==='catalog') {$('#cart-area').innerHTML=cart();updateHeader();}}
  } else {state.data=createDemoData();state.results=compareBasket(state.list,products(),stores());}
  state.page='compare';state.cartOpen=false;render();announcePage();
}

function showModal(title,body,wide=false) {
  const modal=$('#modal');
  $('#modal-content').innerHTML=`<div class="modal-header"><h2 id="modal-title">${title}</h2><button class="icon-button" data-action="close-modal" aria-label="Chiudi finestra">${icon('close')}</button></div>${body}`;
  modal.classList.toggle('wide',wide);if(!modal.open)modal.showModal();
}
function closeModal() {$('#modal').close();}

function showHelp() {
  showModal('La spesa, in tre piccoli passi.',`<div class="help-steps"><div><span>1</span><div><h3>Dicci dove cercare</h3><p>Inserisci la tua zona e un raggio massimo. Le distanze sono in linea d’aria.</p></div></div><div><span>2</span><div><h3>Scegli i tuoi prodotti</h3><p>Sfoglia le categorie, cerca una marca e aggiungi le quantità. Confrontiamo sempre lo stesso prodotto e formato.</p></div></div><div><span>3</span><div><h3>Trova il totale più basso</h3><p>Prima trovi le liste complete, in ordine di prezzo. Poi i subtotali, con ogni prodotto mancante o non verificato segnalato.</p></div></div></div><div class="modal-note">${icon('info')}<p>La demo usa negozi e prezzi fittizi. Nella ricerca reale servono feed dei singoli negozi: la presenza sulla mappa non garantisce l’accesso ai prezzi. I totali non includono viaggio o consegna.</p></div><button class="button primary full" data-action="close-modal">Tutto chiaro ${icon('check')}</button>`);
}
function showStores() {
  showModal(`I supermercati nella tua zona <span class="muted">(${stores().length})</span>`,`<p class="modal-description">Entro ${state.radius} km in linea d’aria. ${state.mode==='demo'?'Questi negozi sono fittizi.':'Dati cartografici OpenStreetMap; la copertura può essere incompleta.'}</p><div class="nearby-list">${stores().length?stores().map(s=>`<div class="nearby-store"><span class="store-logo">${esc(s.initial || s.name[0])}</span><div><strong>${esc(s.name)}</strong><span>${esc(s.address)}</span><small>${s.catalogStatus==='connected'?'Catalogo collegato':s.catalogStatus==='error'?'Catalogo non disponibile':'Prezzi non collegati'}</small></div><b>${distance(s.distanceKm)}</b>${state.mode==='live'?`<a class="icon-button" aria-label="Apri ${esc(s.name)} su OpenStreetMap" href="https://www.openstreetmap.org/?mlat=${s.lat}&mlon=${s.lon}#map=17/${s.lat}/${s.lon}" target="_blank" rel="noopener noreferrer">${icon('external')}</a>`:''}</div>`).join(''):'<p>Nessun supermercato trovato. Prova un raggio più ampio.</p>'}</div>`,true);
}

function showDetail(id) {
  const result=(state.results || compareBasket(state.list,products(),stores())).find(r=>r.store.id===id);
  if(!result)return;
  showModal(esc(result.store.name),`<p class="modal-description">${distance(result.store.distanceKm)} · ${esc(result.store.address)}</p><div class="detail-summary ${result.complete?'':'partial-summary'}"><span>${result.complete?'Totale completo':'Subtotale dei soli prodotti verificati'}</span><strong>${result.availableCount?money(result.totalCents):'—'}</strong><small>${result.availableCount} su ${result.rows.length} prodotti distinti · ${count()} confezioni richieste</small></div>
    <div class="detail-table-wrap"><table class="detail-table"><thead><tr><th>Prodotto</th><th>Qtà</th><th>Prezzo</th><th>Totale</th></tr></thead><tbody>${result.rows.map(row=>`<tr class="${row.status==='available'?'':'unavailable-row'}"><td><strong>${esc(row.product.name)}</strong><span>${esc(row.product.brand)} · ${esc(row.product.size)}</span><small class="row-status ${row.status==='available'?'good':'partial'}">${icon(row.status==='available'?'check':'info')} ${statusLabels[row.status]}${row.status==='insufficient'?` (max ${row.offer.quantityAvailable})`:''}</small>${row.offer?`<small class="offer-source">${row.offer.sourceUrl?`<a href="${esc(safeLink(row.offer.sourceUrl))}" target="_blank" rel="noopener noreferrer">${esc(row.offer.sourceLabel)} ${icon('external')}</a>`:esc(row.offer.sourceLabel)} · ${new Date(row.offer.observedAt).toLocaleString('it-IT',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}</small>`:''}</td><td>${row.quantity}</td><td>${row.status==='available'?money(row.offer.priceCents):'—'}</td><td><b>${row.lineTotalCents!==null?money(row.lineTotalCents):'—'}</b></td></tr>`).join('')}</tbody></table></div><div class="modal-note">${icon('info')}<p>${state.mode==='demo'?'Prezzi, disponibilità e negozi fittizi. ':''}${!result.complete?'I prodotti non disponibili, insufficienti o non verificati sono esclusi dal subtotale. ':''}Nessuna sostituzione automatica. Viaggio e consegna esclusi.</p></div><button class="button primary full" data-action="close-modal">Torna al confronto</button>`,true);
}
function safeLink(value) {try {const u=new URL(value);return u.protocol==='https:'?u.href:'#';}catch{return '#';}}
function editLocation() {
  if(state.mode==='demo') return showModal('La tua zona di esempio',`<p class="modal-description">Nella demo usiamo il centro di Milano e negozi fittizi. Puoi cambiare il raggio per vedere come cambia il confronto.</p><form id="demo-radius-form"><div class="radius-heading"><label class="field-label" for="demo-radius">Raggio massimo</label><output class="radius-output" for="demo-radius">${state.radius} km</output></div><input id="demo-radius" class="radius-slider" name="radius" type="range" min="1" max="25" step="1" value="${state.radius}"><div class="range-labels"><span>1 km</span><span>25 km</span></div><button class="button primary full" type="submit">Aggiorna la zona ${icon('check')}</button></form><button class="text-button modal-real-search" data-action="exit-demo">Cerca un indirizzo reale ${icon('arrow')}</button>`);
  showModal('Cambiamo zona?',`<p class="modal-description">Aggiorneremo negozi e cataloghi. I prodotti assenti nel nuovo catalogo verranno rimossi dalla lista.</p>${locationFields(true)}`);
}
function privacy() {
  showModal('La tua lista resta tua.',`<div class="privacy-copy"><p>Spesina salva zona, raggio e lista nella memoria di questo browser. Non serve un account. Non usiamo strumenti di analisi o cookie di tracciamento.</p><p>La posizione GPS è richiesta solo quando premi “Usa la mia posizione”. Nella ricerca reale, il testo dell’indirizzo viene inviato al geocodificatore Photon e le coordinate a OpenStreetMap / Overpass per cercare i negozi. Il server conserva temporaneamente queste risposte in cache.</p><p>Il servizio che ospita l’app può conservare log tecnici delle richieste secondo la propria configurazione. In caso di dispositivo condiviso, puoi eliminare i dati salvati qui sotto.</p></div><button class="button secondary full" data-action="delete-data">${icon('trash')} Elimina zona e lista salvate</button>`);
}
function exportList() {
  const results=state.results || compareBasket(state.list,products(),stores());
  const lines=['SPESINA — LA TUA LISTA',state.mode==='demo'?'DEMO — negozi, prezzi e disponibilità fittizi':'Prezzi dei cataloghi online collegati',`${state.location.label} · raggio ${state.radius} km in linea d’aria`,'',...state.list.map(i=>{const p=product(i.productId);return `${i.quantity} × ${p.brand} ${p.name} — ${p.size}`;}),'','CONFRONTO',...results.map(r=>`${r.store.name}: ${r.availableCount?money(r.totalCents):'non calcolabile'} — ${r.complete?'totale completo':`subtotale parziale (${r.availableCount}/${r.rows.length} prodotti)`}${r.complete?'':'; '+r.rows.filter(row=>row.status!=='available').map(row=>`${row.product.name}: ${statusLabels[row.status]}`).join(', ')}`),'','Totali dei prodotti. Viaggio e consegna esclusi. Disponibilità soggetta a variazioni.'];
  const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='spesina-lista.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Lista esportata. Buona spesa!');
}

document.addEventListener('click',event=> {
  if(event.target.closest('.brand,.footer-brand')){event.preventDefault();state.page=state.data?'catalog':'location';state.cartOpen=false;render();announcePage();return;}
  const button=event.target.closest('button');if(!button || button.disabled)return;
  if(button.dataset.add)return changeQuantity(button.dataset.add,1);
  if(button.dataset.delta)return changeQuantity(button.dataset.product,Number(button.dataset.delta));
  if(button.dataset.category) {state.category=button.dataset.category;render();$('#product-search').focus({preventScroll:true});return;}
  if(button.dataset.detail)return showDetail(button.dataset.detail);
  if(button.dataset.locationIndex!==undefined){const form=button.closest('form');return loadLocation(form._locations[Number(button.dataset.locationIndex)],Number(new FormData(form).get('radius')),$('.form-feedback',form));}
  if(button.dataset.step) {
    if(button.dataset.step==='compare')return showComparison();
    if(button.dataset.step==='location' && state.data)return editLocation();
    state.page=button.dataset.step;render();announcePage();return;
  }
  const actions={
    demo:()=>startDemo(false),'exit-demo':exitDemo,help:showHelp,privacy,stores:showStores,'edit-location':editLocation,geolocate,compare:showComparison,
    catalog:()=>{state.page='catalog';state.results=null;render();announcePage();},
    'sample-list':()=>{state.list=structuredClone(sampleList);refreshListUI();toast('Una lista d’esempio, pronta da modificare.');},
    'clear-search':()=>{state.search='';state.category='all';render();},
    'clear-list':()=>showModal('Svuotare la lista?',`<p class="modal-description">Rimuoveremo tutti i ${count()} articoli. Potrai aggiungerli di nuovo dal catalogo.</p><div class="modal-buttons"><button class="button secondary" data-action="close-modal">Tieni la lista</button><button class="button primary" data-action="confirm-clear">Svuota la lista</button></div>`),
    'confirm-clear':()=>{state.list=[];state.page='catalog';closeModal();refreshListUI();toast('Lista svuotata.');},
    'close-modal':closeModal,
    'toggle-cart':()=>{state.cartOpen=!state.cartOpen;$('#cart-area').innerHTML=cart();},
    'delete-data':()=>{try{localStorage.removeItem(KEY);}catch{}saved=null;state.list=[];state.location=null;state.data=null;state.mode='live';state.page='location';state.results=null;closeModal();render();toast('Zona e lista salvate eliminate.');},
    export:exportList,print:()=>window.print()
  };
  actions[button.dataset.action]?.();
});
document.addEventListener('input',event=> {
  if(event.target.id==='product-search'){state.search=event.target.value;$('#product-grid').innerHTML=productGrid();}
  if(event.target.classList.contains('radius-slider')){const form=event.target.closest('form');$('output',form).value=`${event.target.value} km`;}
});
document.addEventListener('change',event=>{if(event.target.id==='hide-incomplete'){state.completeOnly=event.target.checked;$('#incomplete-results').hidden=state.completeOnly;}});
document.addEventListener('submit',event=> {
  if(['location-form','location-modal-form'].includes(event.target.id)){event.preventDefault();findLocation(event.target);}
  if(event.target.id==='demo-radius-form'){event.preventDefault();state.radius=Number(new FormData(event.target).get('radius'));state.results=null;closeModal();persist();render();toast(`Raggio aggiornato: ${stores().length} negozi demo.`);}
});
document.addEventListener('keydown',event=>{if(event.key==='/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName) && !$('#modal').open && $('#product-search')){event.preventDefault();$('#product-search').focus();}});
$('#modal').addEventListener('click',event=> {if(event.target===$('#modal')){const r=$('#modal').getBoundingClientRect();if(event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom)closeModal();}});

async function init() {
  hydrateIcons();
  if(saved?.version===1 && saved.mode==='demo') {
    state.mode='demo';state.data=createDemoData();state.location={...demoLocation};state.radius=Number.isInteger(saved.radius) && saved.radius>=1 && saved.radius<=25?saved.radius:5;state.list=normalizeList(saved.list,products());state.page='catalog';
  } else if(saved?.version===1 && saved.mode==='live' && validCoordinates(saved.location?.lat,saved.location?.lon)) {
    state.location=saved.location;state.radius=Number.isInteger(saved.radius) && saved.radius>=1 && saved.radius<=25?saved.radius:5;state.list=Array.isArray(saved.list)?saved.list:[];
  }
  if(window.SPESINA_STATIC && state.mode!=='demo'){state.mode='demo';state.data=createDemoData();state.location={...demoLocation};state.list=[];state.page='catalog';}
  render();
  if(!window.SPESINA_STATIC && location.protocol!=='file:') {
    try {const status=await api('status');state.live=status.live===true;} catch {state.live=false;}
    if(state.page==='location')render();
  }
}
init();
