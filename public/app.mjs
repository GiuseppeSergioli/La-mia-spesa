import { compareBasket, comparisonSummary, priceForProduct, nearbyStores, normalizeList, money, distance, savingsBetweenComplete, MAX_QUANTITY, validCoordinates, MIN_RADIUS_KM, MAX_RADIUS_KM, RADIUS_STEP_KM, DEFAULT_RADIUS_KM, normalizeRadius } from './core.mjs';
import { createDemoData, demoLocation, sampleList, sampleLists, migrateDemoList } from './demo.mjs';
import { icon, productArt, heroArt } from './art.mjs';
import { CAGLIARI_STARTS, knownStart, GPS_OPTIONS, accuracyLabel, gpsLocation, gpsWarning, geolocationError } from './location.mjs';

const $ = (selector,root=document) => root.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='spesina:v1';
const state={page:'location',mode:'live',radius:DEFAULT_RADIUS_KM,location:null,data:null,list:[],category:'all',categoriesExpanded:false,search:'',live:false,busy:false,cartOpen:false,completeOnly:false,results:null,visibleLimit:24};
let toastTimer, requestId=0, pendingGps=null;
let saved=null;
try {saved=JSON.parse(localStorage.getItem(KEY));} catch {}
const stores = () => state.data && state.location ? nearbyStores(state.data.stores,state.location,state.radius):[];
const products = () => state.data?.products || [];
const count = () => state.list.reduce((n,item)=>n+item.quantity,0);
const product = id => products().find(p=>p.id===id);
const quantity = id => state.list.find(i=>i.productId===id)?.quantity || 0;
const statusLabels={available:'Disponibile',estimated:'Prezzo simulato · disponibilità non verificata',out_of_stock:'Esaurito',unknown:'Disponibilità non verificata',stale:'Prezzo non aggiornato',insufficient:'Quantità insufficiente'};
const priceInfo=(p,qty=1)=>priceForProduct(p,stores(),qty,Date.now(),state.mode==='live');
const localComparison=()=>compareBasket(state.list,products(),stores(),Date.now(),{allowEstimates:state.mode==='live'});

function persist() {
  try {localStorage.setItem(KEY,JSON.stringify({version:1,mode:state.mode,page:state.page,location:state.location,radius:state.radius,list:state.list}));} catch {}
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
  const order=['location','catalog','compare'],current=order.indexOf(state.page==='stores'?'location':state.page);
  document.querySelectorAll('[data-step]').forEach(button=> {
    const step=button.dataset.step,i=order.indexOf(step);
    button.classList.toggle('active',i===current);button.classList.toggle('done',i<current);
    button.disabled=state.busy || step!=='location' && !state.data || step==='compare' && (!state.list.length || !stores().length);
    if (i===current) button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');
    $('.step-number',button).innerHTML=i<current ? icon('check'):i+1;
  });
  const banner=$('#mode-banner');banner.hidden=state.mode!=='demo';
  banner.innerHTML=`<span>${icon('info')} <strong>Modalità demo</strong><span class="demo-message">Negozi, prezzi e disponibilità sono fittizi.</span></span><button data-action="exit-demo">Passa alla ricerca reale ${icon('arrow')}</button>`;
}

function render() {
  updateHeader();
  const content=state.page==='location' ? locationPage():state.page==='stores'?liveDirectoryPage():state.page==='compare' ? comparePage():catalogPage();
  $('#main').innerHTML=(state.page!=='location'?`<div class="page-toolbar"><button class="button secondary home-button" data-action="home">${icon('back')} Torna alla home</button><span>La tua lista resta salvata</span></div>`:'')+content;
  hydrateIcons($('#main'));
  document.title=state.page==='compare' ? 'Il tuo confronto — La mia spesa':state.page==='catalog' ? 'La tua lista — La mia spesa':'La mia spesa — La tua spesa, al prezzo giusto.';
}

function radiusControl(id) {
  return `<div class="radius-heading"><label class="field-label" for="${id}">Quanto vuoi spostarti?</label><output class="radius-output" for="${id}">${distance(state.radius)}</output></div><div class="radius-control"><button type="button" class="radius-adjust" data-radius-adjust="-0.5" aria-label="Riduci il raggio di 500 metri" ${state.radius<=MIN_RADIUS_KM?'disabled':''}>${icon('minus')}</button><input class="radius-slider" id="${id}" name="radius" type="range" min="${MIN_RADIUS_KM}" max="${MAX_RADIUS_KM}" value="${state.radius}" step="${RADIUS_STEP_KM}" aria-valuetext="${distance(state.radius)}"><button type="button" class="radius-adjust" data-radius-adjust="0.5" aria-label="Aumenta il raggio di 500 metri" ${state.radius>=MAX_RADIUS_KM?'disabled':''}>${icon('plus')}</button></div><div class="range-labels"><span>500 m</span><span>6 km massimo</span></div>`;
}
function updateRadiusControl(form,value) {
  const input=$('.radius-slider',form);
  input.value=normalizeRadius(value);input.setAttribute('aria-valuetext',distance(Number(input.value)));
  $('output',form).value=distance(Number(input.value));
  $('[data-radius-adjust="-0.5"]',form).disabled=Number(input.value)<=MIN_RADIUS_KM;
  $('[data-radius-adjust="0.5"]',form).disabled=Number(input.value)>=MAX_RADIUS_KM;
}

function locationFields(modal=false) {
  const selected=state.location || (saved?.mode==='live'?saved.location:null);
  const address=state.mode==='live' && selected?.source!=='gps'?selected?.label || '':'';
  const activeStart=knownStart(address,selected);
  return `<form id="${modal?'location-modal-form':'location-form'}" class="location-form">
    <label class="field-label" for="${modal?'modal-address':'address'}">Da dove partiamo?</label>
    <div class="address-field">${icon('pin')}<input id="${modal?'modal-address':'address'}" name="address" autocomplete="street-address" maxlength="200" minlength="3" placeholder="Via Roma, Cagliari (predefinita)" value="${esc(address)}" aria-describedby="${modal?'modal-':''}start-hint"></div>
    <p class="centre-hint" id="${modal?'modal-':''}start-hint">Se lasci vuoto, partiamo da Via Roma, Cagliari, vicino al Palazzo Civico.</p>
    <div class="quick-starts" role="group" aria-label="Zone rapide di Cagliari">${CAGLIARI_STARTS.map(place=>`<button type="button" data-start="${place.id}" aria-pressed="${place.id===activeStart?.id}">${icon('pin')}<span>${esc(place.name)}</span></button>`).join('')}</div>
    <div class="location-alternatives"><button class="text-button geolocation" type="button" data-action="geolocate">${icon('target')} Usa la mia posizione</button></div>
    ${radiusControl(modal?'modal-radius':'radius')}
    <p class="field-hint">Da 500 m a 6 km, a passi di 500 m. Distanza in linea d’aria.</p>
    <div class="location-actions"><button class="button primary full" type="submit" name="destination" value="catalog" ${state.busy?'disabled':''}>Riempi il tuo carrello ${icon('arrow')}</button><p>Scegli i prodotti, poi confronteremo i totali dei negozi nella zona.</p><button class="button secondary full" type="submit" name="destination" value="stores" ${state.busy?'disabled':''}>${icon('search')} Cerca supermercati</button><span>Facoltativo: consulta prima i negozi vicini.</span></div>
    <div class="form-feedback" role="status"></div><div class="location-candidates"></div>
  </form>`;
}

function locationPage() {
  return `<section class="welcome"><div class="welcome-copy"><div class="eyebrow"><span class="eyebrow-line"></span>LA TUA SPESA, PIÙ LEGGERA</div>
    <h1>Stessa spesa.<br><em>Una scelta migliore.</em></h1><p class="welcome-description">Scegli cosa mettere nel carrello.<br>Scopri dove conviene comprarlo, vicino a te.</p>
    <div class="welcome-art">${heroArt()}</div><div class="welcome-note">${icon('check')} Stessi prodotti e formati ${icon('check')} Totali trasparenti</div>
    </div><div class="location-card"><span class="little-label">COMINCIAMO DA QUI</span><h2>La convenienza è vicina.</h2><p>Partiamo da Cagliari. Inserisci il tuo indirizzo per una ricerca precisa.</p>${locationFields()}
    <div class="demo-entry"><span>Vuoi prima dare un’occhiata?</span><button data-action="${state.mode==='demo' && state.data?'resume-list':'demo'}">${state.mode==='demo' && state.data?'Riprendi la demo':'Prova la demo'} ${icon('arrow')}</button></div>${state.data && state.mode==='live'?`<button class="button secondary full resume-button" data-action="resume-list">Torna alla tua lista ${icon('arrow')}</button>`:''}
    ${!state.live?'<p class="static-note">In questa anteprima puoi provare la demo. La ricerca reale si attiva avviando il server.</p>':''}</div></section>
    <section class="how-strip"><div><span class="how-number">01</span><div><h3>Scegli la tua zona</h3><p>Tu decidi quanto allontanarti.</p></div></div><div><span class="how-number">02</span><div><h3>Componi la tua lista</h3><p>I prodotti che ami, per categoria.</p></div></div><div><span class="how-number">03</span><div><h3>Confronta tutta la spesa</h3><p>Un totale chiaro per ogni negozio.</p></div></div></section>
    <div class="honesty-note">${icon('shield')} Dove manca un prezzo verificato trovi “Prezzo simulato”, con fonte e data del riferimento.</div>`;
}

function locationStrip() {
  const discovery=state.data?.storeDiscovery;
  const label=state.mode==='demo'?`${stores().length} negozi demo`:discovery?.status==='unavailable'?'Ricerca da riprovare':discovery?.status==='local_directory'?`${stores().length} negozi · elenco locale`:`${stores().length} negozi individuati`;
  return `<div class="location-strip"><div>${icon('pin')}<div><strong>${esc(state.location?.label)}</strong><span>Entro ${distance(state.radius)} in linea d’aria${state.location?.source==='gps'?` · precisione ${accuracyLabel(state.location.accuracyMeters)}`:''}</span></div><button class="text-button" data-action="edit-location">Modifica</button></div><button class="store-count" data-action="stores">${icon('store')}<span>${label}</span>${icon('chevron')}</button></div>`;
}

function catalogPage() {
  const p=products();
  return `<section class="page-intro"><div><div class="eyebrow">PICCOLE SCELTE, UNA BELLA DIFFERENZA</div><h1>La tua lista. <em>Il prezzo giusto.</em></h1><p>Aggiungi quello che ti serve. Al resto ci pensiamo noi.</p></div><span class="section-doodle">${icon('bag')}<span>La spesa di sempre,<br>con un po’ più di cura.</span></span></section>
    ${locationStrip()}${state.mode==='live' && state.data.referenceCatalog?`<div class="estimate-notice">${icon('info')}<div><strong>Componi il carrello anche con prezzi simulati</strong><p>Il catalogo è lo stesso della demo. I prezzi simulati provengono da riferimenti pubblici o da stime indicative; prezzo e presenza nei negozi non sono confermati. Tocca “Fonte della stima” per il riferimento usato.</p></div></div>`:''}${state.mode==='live' && state.data.warnings.length?`<div class="data-notice">${icon('info')}<div>${state.data.warnings.map(w=>`<p>${esc(w)}</p>`).join('')}</div></div>`:''}
    <div class="shopping-layout"><section class="catalog" aria-label="Catalogo prodotti"><div class="catalog-heading"><h2>Cosa mettiamo in lista?</h2><span>${p.length} prodotti · ${state.data.categories.length-1} categorie</span></div>
      <div class="search-field">${icon('search')}<input id="product-search" type="search" autocomplete="off" placeholder="Cerca un prodotto o una marca…" aria-label="Cerca un prodotto o una marca" value="${esc(state.search)}"><kbd aria-hidden="true">/</kbd></div>
      ${categoryNavigation()}
      <div class="product-section-heading"><h3 id="category-title">${esc(state.data.categories.find(c=>c.id===state.category)?.name || 'Tutti i prodotti')}${state.category==='all'?' i prodotti':''}</h3><span class="muted">Stesso prodotto, stesso formato</span></div>
      <div id="product-grid" class="product-grid">${productGrid()}</div>
      ${p.length?'<p class="catalog-footnote">Illustrazioni indicative. I prezzi simulati sono riferimenti di prodotto e formato; i prezzi verificati riguardano i negozi nel raggio.</p>':''}
    </section><aside class="cart-area" id="cart-area" aria-label="La tua lista">${cart()}</aside></div><button class="mobile-cart" data-action="toggle-cart">${icon('bag')}<span>La tua lista · <b id="mobile-count">${count()}</b></span>${icon('chevron')}</button>
    <div class="source-note">${icon('info')}<span>${esc(state.data.attribution)}</span></div>`;
}

function categoryNavigation() {
  const categories=state.data.categories || [];
  const choices=categories.filter(c=>c.id!=='all');
  const featured=['pasta','biscotti','latte','pane','frutta','verdura','carne','pesce','surgelati','bevande','casa','persona'];
  const preferred=choices.filter(c=>featured.includes(c.id));
  const visible=state.categoriesExpanded?choices:[...preferred,...choices.filter(c=>!featured.includes(c.id))].slice(0,12);
  if(!state.categoriesExpanded && state.category!=='all' && !visible.some(c=>c.id===state.category)) {
    const selected=choices.find(c=>c.id===state.category);if(selected)visible.splice(visible.length-1,1,selected);
  }
  const counts=Object.fromEntries(categories.map(c=>[c.id,c.id==='all'?products().length:products().filter(p=>p.category===c.id).length]));
  return `<div class="category-picker"><label for="category-select">Scegli una categoria<span>${choices.length} categorie · ${products().length} prodotti</span></label><select id="category-select" aria-label="Scegli una categoria">${categories.map(c=>`<option value="${esc(c.id)}" ${state.category===c.id?'selected':''}>${esc(c.name)} · ${counts[c.id]} prodotti</option>`).join('')}</select></div><div class="category-overview"><button class="category all-category ${state.category==='all'?'selected':''}" data-category="all" aria-label="Tutti" aria-pressed="${state.category==='all'}">${icon('grid')} Tutti i prodotti <span class="category-count">${counts.all || 0}</span></button><span>${visible.length} di ${choices.length} categorie</span></div><div id="category-grid" class="categories" role="group" aria-label="Categorie prodotti">${visible.map(c=>`<button class="category ${state.category===c.id?'selected':''}" data-category="${esc(c.id)}" aria-label="${esc(c.name)}" aria-pressed="${state.category===c.id}">${icon(c.icon)}<span class="category-copy"><span class="category-name">${esc(c.name)}</span><span class="category-count" aria-hidden="true">${counts[c.id]} prodotti</span></span></button>`).join('')}</div>${choices.length>12?`<button class="text-button category-expand" data-action="toggle-categories" aria-expanded="${state.categoriesExpanded}" aria-controls="category-grid">${state.categoriesExpanded?'Mostra meno categorie':`Mostra tutte le ${choices.length} categorie`} ${icon('chevron')}</button>`:''}`;
}

function productGrid() {
  const filtered=products().filter(p=>(state.category==='all' || p.category===state.category) && `${p.name} ${p.brand} ${p.size}`.toLocaleLowerCase('it').includes(state.search.toLocaleLowerCase('it')));
  if (!filtered.length) return `<div class="empty-state"><span class="empty-icon">${icon('search')}</span><h3>Qui non c’è ancora.</h3><p>Prova un’altra parola o scegli una categoria diversa.</p><button class="text-button" data-action="clear-search">Mostra tutti i prodotti</button></div>`;
  return filtered.slice(0,state.visibleLimit).map(p=> {
    const qty=quantity(p.id),info=priceInfo(p,Math.max(qty,1));
    return `<article class="product-card ${qty?'in-list':''}"><div class="product-visual"><img src="${productArt(p)}" alt="" width="180" height="190" loading="lazy">${qty?`<span class="added-badge">${icon('check')} In lista</span>`:''}</div><div class="product-info"><span class="product-brand">${esc(p.brand)}</span><h4>${esc(p.name)}</h4><span class="product-size">${esc(p.size)}</span><div class="product-bottom"><div><span class="price-label ${info.simulated?'simulated-price-label':''}">${info.simulated?'Prezzo simulato':info.priceCents!==null?'a partire da':'Prezzo non verificato'}</span>${info.priceCents!==null?`<strong class="product-price">${money(info.priceCents)}</strong><span class="available-count">${info.simulated?'Disponibilità da verificare':`in ${info.availableCount} ${info.availableCount===1?'negozio':'negozi'}`}</span>`:''}</div>${qty?quantityControl(p.id,qty):`<button class="add-button" data-add="${esc(p.id)}" aria-label="Aggiungi ${esc(p.name)}${p.generic?' '+esc(p.size):''} alla lista">${icon('plus')}</button>`}</div>${p.reference && state.mode==='live'?`<button class="price-source-button" data-price-source="${esc(p.id)}">Fonte della stima ${icon('info')}</button>`:''}</div></article>`;
  }).join('')+(filtered.length>state.visibleLimit?`<div class="more-products"><button class="button secondary" data-action="more-products">Mostra altri prodotti ${icon('chevron')}</button><span>${state.visibleLimit} di ${filtered.length} prodotti</span></div>`:'');
}

function quantityControl(id,qty,small=false) {
  const p=product(id);
  return `<div class="quantity-control ${small?'small':''}" role="group" aria-label="Quantità ${esc(p?.name)}"><button data-delta="-1" data-product="${esc(id)}" aria-label="${qty===1?'Rimuovi':'Riduci quantità di'} ${esc(p?.name)}">${icon(qty===1?'trash':'minus')}</button><span aria-label="${qty} confezioni">${qty}</span><button data-delta="1" data-product="${esc(id)}" ${qty>=MAX_QUANTITY?'disabled':''} aria-label="Aumenta quantità di ${esc(p?.name)}">${icon('plus')}</button></div>`;
}

function cart() {
  const prices=state.list.map(item=>({...item,info:priceInfo(product(item.productId),item.quantity)}));
  const total=prices.reduce((sum,item)=>sum+(item.info.priceCents ?? 0)*item.quantity,0);
  const hasAll=prices.every(item=>item.info.priceCents!==null),hasSome=prices.some(item=>item.info.priceCents!==null),simulated=prices.some(item=>item.info.simulated);
  return `<div class="cart ${state.cartOpen?'cart-open':''}"><div class="cart-heading"><div>${icon('bag')}<h2>Il tuo carrello</h2><span class="count-badge">${count()}</span></div>${state.list.length?'<button class="icon-button" data-action="clear-list" aria-label="Svuota la lista">'+icon('trash')+'</button>':''}<button class="icon-button close-cart" data-action="toggle-cart" aria-label="Chiudi lista">${icon('close')}</button></div>
    ${state.mode==='demo'?`<button class="demo-list-picker" data-action="sample-lists">${icon('list')} Prova una lista pronta ${icon('chevron')}</button>`:''}${state.list.length?`<div class="cart-items">${prices.map(item=> {
      const p=product(item.productId);return `<div class="cart-item"><img src="${productArt(p)}" alt="" width="42" height="48"><div><strong>${esc(p.name)}</strong><span>${esc(p.brand)} · ${esc(p.size)}</span><small class="cart-price ${item.info.simulated?'simulated-price-label':''}">${item.info.priceCents===null?'Prezzo non verificato':`${money(item.info.priceCents)} / conf. · ${item.info.simulated?'Prezzo simulato':'prezzo minimo verificato'}`}</small>${quantityControl(p.id,item.quantity,true)}</div></div>`;
    }).join('')}</div><div class="cart-estimate"><span>${simulated?(hasAll?'Totale indicativo':'Subtotale indicativo'):hasAll?'Minimo teorico':'Subtotale verificato'}</span><strong>${hasSome?money(total):'—'}</strong></div><p class="cart-disclaimer">${simulated?'Include prezzi simulati; non conferma prezzi o disponibilità nei negozi.':'Somma dei prezzi minimi tra negozi diversi.'} ${!hasAll?'Alcune righe non hanno prezzo. ':''}Il totale di ogni negozio è nel confronto.</p>`:`<div class="empty-cart"><span>${icon('list')}</span><h3>Componi il tuo<br>carrello.</h3><p>Tocca <b>+</b> sui prodotti, poi scegli le quantità.</p>${state.mode==='demo'?'<button class="text-button" data-action="sample-list">Usa una lista d’esempio '+icon('arrow')+'</button>':''}</div>`}
    ${!stores().length?'<p class="no-store-cart">Puoi preparare la lista. Per confrontarla serve almeno un negozio nel raggio: modifica la zona.</p>':''}<div class="cart-cta"><button class="button primary full" data-action="compare" ${!state.list.length || !stores().length || state.busy?'disabled':''}>${state.busy?'<span class="spinner"></span> Calcolo dei totali…':`Confronta la spesa ${icon('arrow')}`}</button><span>${icon('shield')} Prezzi verificati e simulati sempre distinti</span></div></div>`;
}

function comparePage() {
  const results=state.results || localComparison();
  const {priced:complete,partial:incomplete,best,ties,hasEstimates}=comparisonSummary(results),saving=hasEstimates?null:savingsBetweenComplete(results);
  const tie=ties.length>1;
  const note=hasEstimates?(tie?'I totali più bassi sono uguali e includono prezzi simulati. Non emerge un supermercato più conveniente sulla base di prezzi locali verificati.':'Il totale più basso è una stima e può cambiare quando si conoscono i prezzi del negozio.'):saving>0?`Risparmi ${money(saving)} rispetto al più caro fra i negozi con lista completa.`:'Il totale include tutte le quantità selezionate.';
  return `<section class="page-intro compare-intro"><div><button class="text-button back-button" data-action="catalog">${icon('back')} Modifica la lista</button><div class="eyebrow">IL CONTO DEL TUO CARRELLO</div><h1>La stessa spesa.<br class="mobile-only"> <em>Tutti i totali.</em></h1><p>${count()} confezioni, ${state.list.length} prodotti distinti. Prezzi e disponibilità sono indicati nel dettaglio.</p></div><div class="compare-actions"><button class="button secondary" data-action="export">${icon('download')} Esporta lista</button><button class="icon-button bordered" data-action="print" aria-label="Stampa confronto">${icon('print')}</button></div></section>${locationStrip()}
    ${hasEstimates?`<div class="estimate-notice">${icon('info')}<div><strong>Il confronto include prezzi simulati</strong><p>Dove manca un prezzo verificato si usa lo stesso riferimento per lo stesso prodotto. Non confermano l’assortimento o la disponibilità. Fonte e data sono nel dettaglio di ogni riga.</p></div></div>`:''}
    ${best?`<div class="winner ${hasEstimates?'estimated-winner':''}"><div class="winner-info"><span class="winner-label">${icon(tie?'info':'spark')} ${tie?'PARITÀ DI TOTALE':hasEstimates?'TOTALE STIMATO PIÙ BASSO':complete.length>1?'IL TOTALE COMPLETO PIÙ BASSO':'SPESA COMPLETA DISPONIBILE'}</span><h2>${tie?hasEstimates?'Stesso totale stimato':'Stesso totale':esc(best.store.name)}</h2><p>${icon(hasEstimates?'info':'check')} ${tie?`${ties.length} negozi a pari totale`:`${best.pricedCount ?? best.availableCount} prodotti con prezzo · ${distance(best.store.distanceKm)}`}</p><div class="winner-note">${esc(note)}</div></div><div class="winner-price"><span>${hasEstimates?'Totale indicativo del carrello':'Totale della tua spesa'}</span><strong>${money(best.totalCents)}</strong><button class="button winner-button" data-detail="${esc(best.store.id)}">Vedi il dettaglio ${icon('arrow')}</button></div><span class="winner-decoration" aria-hidden="true">${icon('bag')}</span></div>`:`<div class="no-winner">${icon('info')}<div><h2>Nessun totale copre tutto il carrello.</h2><p>Trovi qui i subtotali e i prodotti mancanti. Un subtotale non è il costo della lista completa.</p></div></div>`}
    <div class="results-heading"><h2>Il confronto, negozio per negozio</h2><span>${complete.length} totali calcolabili su ${results.length} negozi</span></div>
    <div class="comparison-legend">${icon('info')} Totali dal meno al più costoso; a parità di totale, ordine per distanza. I subtotali incompleti sono separati.</div>
    <div class="comparison-results">${complete.length?`<div class="complete-results">${complete.map(r=>storeResult(r,1+complete.filter(x=>x.totalCents<r.totalCents).length,best,tie)).join('')}</div>`:''}
    ${incomplete.length?`<section class="incomplete-section"><div class="incomplete-heading"><h3>Liste incomplete <span>${incomplete.length}</span></h3><label class="filter-switch"><input id="hide-incomplete" type="checkbox" ${state.completeOnly?'checked':''}><span>Nascondi</span></label></div><p class="incomplete-explainer">Ordinate per numero di righe con prezzo. Prodotti esauriti, quantità insufficienti e righe senza prezzo sono esclusi dal subtotale.</p><div id="incomplete-results" ${state.completeOnly?'hidden':''}>${incomplete.map(r=>storeResult(r,null,best,tie)).join('')}</div></section>`:''}</div>
    <p class="comparison-footnote">${icon('clock')} ${state.mode==='demo'?'Demo con negozi, prezzi e scorte fittizi.':hasEstimates?'Prezzi simulati da riferimenti datati; non sono una media di mercato. Disponibilità locale da verificare.':'Prezzi rilevati alle date indicate nel dettaglio. Disponibilità soggetta a variazioni.'} Viaggio e consegna esclusi.</p><div class="source-note">${icon('info')}<span>${esc(state.data.attribution)}</span></div>`;
}

function storeResult(r,rank,best,tie=false) {
  const priced=r.priceComplete ?? r.complete,isBest=priced && best && r.totalCents===best.totalCents,delta=priced && best?r.totalCents-best.totalCents:null;
  const simulated=r.simulatedCount || 0,covered=r.pricedCount ?? r.availableCount,hasSome=covered>0;
  return `<article class="store-result ${isBest?'is-best':''} ${priced?'':'is-incomplete'}"><div class="store-result-main"><span class="store-rank">${rank ?? '—'}</span><span class="store-logo" style="--store-color:${/^#[\da-f]{6}$/i.test(r.store.color || '')?r.store.color:'#48745e'}">${esc(r.store.initial || r.store.name[0])}</span><div class="store-identification"><h3>${esc(r.store.name)} ${isBest?`<span class="best-badge ${simulated?'estimate-badge':''}">${icon(simulated?'info':'check')} ${tie?'Parità':simulated?'Stima':'Completa'}</span>`:''}</h3><p>${icon('pin')}${distance(r.store.distanceKm)} · ${esc(r.store.address)}</p></div><div class="store-coverage ${priced && !simulated?'good':'partial'}">${icon(simulated || !priced?'info':'check')}<span>${covered}/${r.rows.length} prodotti con prezzo<span>${simulated?`${r.availableCount} verificati · ${simulated} simulati`:r.complete?'Tutta la tua lista verificata':`${r.unpricedCount ?? r.missingCount} senza totale`}</span></span></div><div class="store-total"><span>${priced?simulated?'Totale stimato':'Totale completo':hasSome?'Subtotale parziale':'Totale non calcolabile'}</span><strong>${priced || hasSome?money(r.totalCents):'—'}</strong>${delta>0?`<small>+ ${money(delta)} dal più basso${simulated?' stimato':''}</small>`:''}</div><button class="detail-button" data-detail="${esc(r.store.id)}" aria-label="Dettaglio spesa ${esc(r.store.name)}">${icon('arrow')}</button></div>${!priced?`<div class="missing-preview">${r.rows.filter(row=>row.lineTotalCents===null).map(row=>`<span>${esc(row.product.name)}: ${statusLabels[row.status].toLocaleLowerCase('it')}</span>`).join('')}</div>`:''}${simulated?`<div class="simulation-preview">${simulated} ${simulated===1?'prezzo simulato':'prezzi simulati'} · disponibilità da verificare. Importo simulato: ${money(r.simulatedTotalCents)}.</div>`:''}</article>`;
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

function goHome() {
  requestId++;state.busy=false;pendingGps=null;state.page='location';state.cartOpen=false;state.results=null;
  closeModal();persist();render();announcePage();
}
function resumeList() {
  if(!state.data)return;
  requestId++;state.page='catalog';state.cartOpen=false;state.busy=false;persist();render();announcePage();
}
function chooseSampleList() {
  showModal('Una lista pronta da esplorare',`<p class="modal-description">Scegli una lista dimostrativa. Se hai già articoli in lista, questa scelta li sostituirà.</p><div class="sample-list-options">${sampleLists.map(list=>`<button data-sample-list="${list.id}"><span>${icon('bag')}<strong>${esc(list.name)}</strong><small>${esc(list.description)}</small></span>${icon('arrow')}</button>`).join('')}</div>`);
}

function startDemo(withSample=false) {
  requestId++;state.busy=false;state.mode='demo';state.location={...demoLocation};state.data=createDemoData();state.radius=DEFAULT_RADIUS_KM;state.list=withSample?structuredClone(sampleList):[];state.page='catalog';state.category='all';state.search='';state.results=null;state.cartOpen=false;state.visibleLimit=24;
  closeModal();persist();render();announcePage();
}
function exitDemo() {
  requestId++;state.busy=false;state.mode='live';state.data=null;state.list=[];state.location=null;state.results=null;state.page='location';state.cartOpen=false;saved=null;persist();closeModal();render();announcePage();
}

async function findLocation(form,destination='catalog') {
  if (state.busy) return;
  const feedback=$('.form-feedback',form),candidates=$('.location-candidates',form);
  if (!state.live) {feedback.textContent='La ricerca reale richiede il server. Per esplorare l’app scegli “Prova la demo”.';return;}
  const q=String(new FormData(form).get('address') || '').trim();
  const selected=knownStart(q,state.mode==='live'?state.location:null);
  form._destination=destination;
  if(selected)return loadLocation(selected,Number(new FormData(form).get('radius')),feedback,destination);
  const id=++requestId;state.busy=true;setLocationButtons(true);feedback.innerHTML='<span class="spinner dark"></span> Cerco il tuo indirizzo…';candidates.innerHTML='';updateHeader();
  try {
    const data=await api(`geocode?q=${encodeURIComponent(q)}`);if (id!==requestId) return;
    if (!data.results.length) {feedback.textContent='Nessun indirizzo trovato in Italia. Prova “via, numero, città” o il nome del comune.';return;}
    feedback.textContent=destination==='stores'?'Scegli il punto da cui cercare i supermercati.':'Conferma l’indirizzo per passare direttamente ai prodotti.';
    candidates.innerHTML='<span class="field-label">Scegli la posizione corretta</span>'+data.results.map((loc,i)=>`<button type="button" data-location-index="${i}">${icon('pin')}<span>${esc(loc.label)}</span>${icon('arrow')}</button>`).join('');
    form._locations=data.results;
    $('[data-location-index]',candidates)?.focus();
  } catch(e) {if(id===requestId) feedback.textContent=e.message;}
  finally {if(id===requestId) {state.busy=false;setLocationButtons(false);updateHeader();}}
}

function setLocationButtons(disabled) {
  document.querySelectorAll('[data-location-index],.location-form [type=submit],.location-form [data-start],.location-form [data-action="geolocate"]').forEach(el=>el.disabled=disabled);
}

function chooseStart(id,form) {
  const place=CAGLIARI_STARTS.find(place=>place.id===id);if(!place || !form || state.busy)return;
  $('[name="address"]',form).value=place.label;
  form.querySelectorAll('[data-start]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.start===id)));
  $('.location-candidates',form).innerHTML='';
  $('.form-feedback',form).textContent=`Partenza: ${place.name}. Premi “Riempi il tuo carrello” per scegliere i prodotti.`;
}

async function loadLocation(loc,radius,feedback,destination='catalog') {
  if(state.busy) return;const id=++requestId;state.busy=true;updateHeader();
  if(feedback) feedback.innerHTML=`<span class="spinner dark"></span> ${destination==='stores'?'Cerco i supermercati nella tua zona…':'Preparo i prodotti e cerco i negozi per il confronto…'}`;
  setLocationButtons(true);
  try {
    const data=await api(`catalog?${new URLSearchParams({lat:loc.lat,lon:loc.lon,radius})}`);if(id!==requestId) return;
    const oldCount=state.list.length;
    state.mode='live';state.location=loc;state.radius=radius;state.data=data;state.list=normalizeList(state.list,data.products);state.page=destination==='stores'?'stores':'catalog';state.category='all';state.search='';state.results=null;state.visibleLimit=24;state.cartOpen=false;
    if(state.list.length<oldCount) toast('Alcuni prodotti non sono presenti nel nuovo catalogo e sono stati rimossi dalla lista.');
    pendingGps=null;closeModal();persist();render();announcePage();
  } catch(e) {if(id===requestId){if(feedback)feedback.textContent=e.message;if(['catalog','stores'].includes(state.page))toast(e.message);}}
  finally {if(id===requestId){state.busy=false;setLocationButtons(false);if(['catalog','stores'].includes(state.page)) render();else updateHeader();}}
}

function geolocate(radiusOverride=null) {
  const form=$('#location-modal-form') || $('#location-form'),feedback=$('#gps-feedback') || (form?$('.form-feedback',form):null);
  if(!state.live){if(feedback)feedback.textContent='La posizione reale è disponibile avviando il server dell’app.';return;}
  if(window.isSecureContext===false){if(feedback)feedback.textContent='Apri direttamente il link HTTPS della tua app per usare la posizione, oppure inserisci il tuo indirizzo.';return;}
  if(!navigator.geolocation){if(feedback)feedback.textContent='Questo browser non supporta la localizzazione. Inserisci il tuo indirizzo.';return;}
  if(state.busy)return;
  const radius=typeof radiusOverride==='number'?radiusOverride:form?Number(new FormData(form).get('radius')):state.radius;
  const id=++requestId;state.busy=true;if(feedback)feedback.textContent='Cerco una posizione aggiornata e precisa…';updateHeader();
  const buttons=()=>document.querySelectorAll('[data-action="geolocate"],[data-action="retry-gps"],[data-action="confirm-gps"]');
  buttons().forEach(button=>button.disabled=true);
  const finish=()=>{state.busy=false;buttons().forEach(button=>button.disabled=false);updateHeader();};
  navigator.geolocation.getCurrentPosition(pos=> {
    if(id!==requestId)return;finish();
    try {
      const location=gpsLocation(pos);pendingGps={location,radius};
      showModal('Questo è il tuo punto di partenza?',`<p class="modal-description">Il dispositivo ha rilevato questo punto. Verificalo prima di passare ai prodotti.</p><div class="gps-summary"><strong>Precisione: ${accuracyLabel(location.accuracyMeters)}</strong><span>Latitudine ${location.lat.toFixed(5)} · Longitudine ${location.lon.toFixed(5)}</span><a href="https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lon}#map=17/${location.lat}/${location.lon}" target="_blank" rel="noopener noreferrer">${icon('map')} Controlla il punto sulla mappa ${icon('external')}</a></div><p class="gps-warning">${esc(gpsWarning(location,radius))}</p><div id="gps-feedback" class="form-feedback" role="status"></div><button class="button primary full" data-action="confirm-gps">Usa questo punto e riempi il carrello ${icon('arrow')}</button><div class="gps-alternatives"><button class="text-button" data-action="retry-gps">${icon('refresh')} Rileva di nuovo</button><button class="text-button" data-action="gps-address">Inserisci l’indirizzo</button></div>`);
    } catch(error){if(feedback)feedback.textContent=error.message;}
  },error=>{if(id!==requestId)return;finish();if(feedback)feedback.textContent=geolocationError(error);},GPS_OPTIONS);
}
function correctGpsWithAddress() {
  requestId++;state.busy=false;pendingGps=null;closeModal();
  if(state.page==='location'){render();$('#address').focus();}else editLocation();
}

async function showComparison() {
  if(!state.list.length || !stores().length || state.busy)return;
  const id=++requestId;
  if(state.mode==='live') {
    state.busy=true;refreshListUI();
    try {
      const response=await api('compare',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lat:state.location.lat,lon:state.location.lon,radius:state.radius,list:state.list})});
      if(id!==requestId)return;
      state.results=response.results;
      if(response.warnings.length) toast(response.warnings[0]);
    } catch(e){if(id===requestId)toast(e.message);return;}
    finally {if(id===requestId)state.busy=false;if(id===requestId && state.page==='catalog' && $('#cart-area')) {$('#cart-area').innerHTML=cart();updateHeader();}}
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
  showModal('La spesa, in tre piccoli passi.',`<div class="help-steps"><div><span>1</span><div><h3>Dicci dove cercare</h3><p>Inserisci la tua zona e un raggio massimo. Le distanze sono in linea d’aria.</p></div></div><div><span>2</span><div><h3>Scegli i tuoi prodotti</h3><p>Sfoglia le categorie, cerca una marca e aggiungi le quantità. Confrontiamo sempre lo stesso prodotto e formato.</p></div></div><div><span>3</span><div><h3>Trova il totale più basso</h3><p>Prima trovi le liste complete, in ordine di prezzo. Poi i subtotali, con ogni prodotto mancante o non verificato segnalato.</p></div></div></div><div class="modal-note">${icon('info')}<p>La demo usa negozi e prezzi fittizi. Nella ricerca reale puoi comporre il carrello con prodotti di riferimento. Dove manca il prezzo verificato usiamo un prezzo simulato, uguale per tutti i negozi. Le stime non confermano la disponibilità. I totali non includono viaggio o consegna.</p></div><button class="button primary full" data-action="close-modal">Tutto chiaro ${icon('check')}</button>`);
}
function storeDirectoryRows() {
  return stores().map(s=>`<div class="nearby-store"><span class="store-logo">${esc(s.initial || s.name[0])}</span><div><strong>${esc(s.name)}</strong><span>${esc(s.address)}</span>${s.discoverySource==='verified_directory'?'<small class="local-store-tag">Elenco locale · verifica 17/10/2026</small>':''}<small>${s.catalogStatus==='connected'?'Prezzi collegati al confronto':s.catalogStatus==='error'?'Catalogo temporaneamente non disponibile':'Prezzi non verificati · useremo prezzi simulati'}</small>${state.mode==='live'?`<div class="store-link-actions">${s.officialUrl?`<a href="${esc(safeLink(s.officialUrl))}" target="_blank" rel="noopener noreferrer">${esc(s.officialLinkLabel || 'Sito ufficiale')} ${icon('external')}</a>`:''}${s.onlineUrl?`<a href="${esc(safeLink(s.onlineUrl))}" target="_blank" rel="noopener noreferrer">Spesa online ${icon('external')}</a>`:''}<a href="https://www.openstreetmap.org/?mlat=${s.lat}&mlon=${s.lon}#map=17/${s.lat}/${s.lon}" target="_blank" rel="noopener noreferrer">Mappa ${icon('external')}</a></div>${s.linkScope==='chain'?'<span class="source-scope-note">Il link è dell’insegna: sul sito seleziona il negozio corretto.</span>':''}`:''}</div><b>${distance(s.distanceKm)}</b></div>`).join('');
}
function retailerSourceNotes() {
  const sources=state.data?.retailerSources || [];
  return sources.length?`<section class="retailer-source-list"><h3>Fonti delle insegne trovate</h3><p class="modal-description">Un collegamento al sito non equivale a un catalogo prezzi importato.</p>${sources.map(source=>`<details><summary>${esc(source.name)}</summary><p>${esc(source.note)}</p><p>Fonte verificata il ${esc(source.checkedOn)}. Prezzi per il confronto: non collegati automaticamente.</p></details>`).join('')}</section>`:'';
}
function liveDirectoryPage() {
  const discovery=state.data.storeDiscovery || {status:'online',mapAvailable:true};
  const unavailable=discovery.status==='unavailable',localOnly=discovery.status==='local_directory',connected=stores().filter(s=>s.catalogStatus==='connected').length;
  const summary=unavailable?'Numero dei negozi non verificabile':localOnly?`${stores().length} negozi nell’elenco locale · copertura parziale`:`${stores().length} negozi individuati`;
  return `<section class="page-intro"><div><div class="eyebrow">LA SPESA NEL TUO QUARTIERE</div><h1>${unavailable?'Ricerca negozi <em>da riprovare.</em>':'I supermercati <em>vicino a te.</em>'}</h1><p>Questi sono i negozi della zona. Ora puoi scegliere i prodotti per il tuo carrello.</p></div></section>${locationStrip()}<div class="coverage-summary ${unavailable?'coverage-error':''}"><strong>${summary}</strong><br>${connected} cataloghi con prezzi verificati. ${localOnly?'Elenco locale datato 17/10/2026, disponibile anche quando la mappa non risponde.':'La copertura può essere incompleta.'}</div><section class="shopping-next"><div><h2>Passiamo al tuo carrello</h2><p>${products().length} prodotti tra cui scegliere. Quando manca un prezzo verificato useremo un prezzo simulato, con riferimento e data.${!stores().length?' Puoi preparare la lista; per confrontare i totali servirà trovare almeno un negozio.':''}</p></div><button class="button primary" data-action="compose-cart" ${state.busy?'disabled':''}>Componi il carrello ${icon('arrow')}</button></section>${state.data.warnings.filter(w=>!w.startsWith('Nessun catalogo prezzi collegato')).map(w=>`<div class="data-notice">${icon('info')}<p>${esc(w)}</p></div>`).join('')}${!discovery.mapAvailable?`<div class="retry-search"><button class="button secondary" data-action="retry-stores" ${state.busy?'disabled':''}>${icon('refresh')} Riprova la ricerca sulla mappa</button><div id="directory-feedback" class="form-feedback" role="status"></div></div>`:''}<section class="live-directory"><h2>${localOnly?'Punti vendita dell’elenco locale':'Negozi e collegamenti disponibili'}</h2><div class="nearby-list">${stores().length?storeDirectoryRows():`<p class="modal-description">${unavailable?'Il servizio cartografico non ha risposto. Il numero di negozi non è verificabile in questo momento.':'Nessun negozio nelle fonti disponibili per questo raggio. Puoi modificare la zona, fino a un massimo di 6 km.'}</p>`}</div></section><div class="directory-continue"><button class="button primary" data-action="compose-cart" ${state.busy?'disabled':''}>Vai alla scelta dei prodotti ${icon('arrow')}</button></div>${retailerSourceNotes()}<div class="source-note">${icon('info')}<span>${esc(state.data.attribution)}</span></div>`;
}

function showStores() {
  const discovery=state.data?.storeDiscovery,unavailable=state.mode==='live' && discovery?.status==='unavailable',localOnly=discovery?.status==='local_directory';
  const title=unavailable?'Ricerca negozi da riprovare':`I negozi nella tua zona <span class="muted">(${stores().length})</span>`;
  const description=state.mode==='demo'?'Questi negozi sono fittizi.':localOnly?'Elenco locale parziale di punti vendita, verificato il 17/10/2026. La mappa non risponde.':'Risultati OpenStreetMap integrati con un elenco locale parziale. La copertura non è garantita come esaustiva.';
  const coverage=unavailable?'Numero dei negozi non verificabile.':`${stores().length} negozi ${localOnly?'nell’elenco locale':'individuati'}.`;
  const empty=unavailable?'Il servizio cartografico non ha risposto: il numero dei negozi non è verificabile. Riprova dalla pagina della ricerca.':'Nessun negozio nelle fonti disponibili per questo raggio. Puoi modificare la zona, fino a 6 km.';
  showModal(title,`<p class="modal-description">Entro ${distance(state.radius)} in linea d’aria. ${description}</p>${state.mode==='live'?`<div class="coverage-summary ${unavailable?'coverage-error':''}">${coverage} ${stores().filter(s=>s.catalogStatus==='connected').length} cataloghi prezzi collegati.</div>`:''}<div class="nearby-list">${stores().length?storeDirectoryRows():`<p>${empty}</p>`}</div>${state.mode==='live'?retailerSourceNotes():''}`,true);
}

function showDetail(id) {
  const result=(state.results || localComparison()).find(r=>r.store.id===id);
  if(!result)return;
  const priced=result.priceComplete ?? result.complete,simulated=result.simulatedCount || 0;
  showModal(esc(result.store.name),`<p class="modal-description">${distance(result.store.distanceKm)} · ${esc(result.store.address)}</p><div class="detail-summary ${result.complete?'':'partial-summary'}"><span>${priced?simulated?'Totale stimato del carrello':'Totale completo':'Subtotale delle righe con prezzo'}</span><strong>${result.pricedCount?money(result.totalCents):'—'}</strong><small>${result.availableCount} prezzi verificati · ${simulated} prezzi simulati · ${result.unpricedCount ?? result.missingCount} righe senza totale</small></div>${simulated?`<div class="detail-price-split"><span>Parte verificata <b>${money(result.verifiedTotalCents)}</b></span><span>Parte simulata <b>${money(result.simulatedTotalCents)}</b></span></div>`:''}
    <div class="detail-table-wrap"><table class="detail-table"><thead><tr><th>Prodotto e fonte</th><th>Qtà</th><th>Prezzo</th><th>Totale</th></tr></thead><tbody>${result.rows.map(row=>`<tr class="${row.status==='available'?'':'unavailable-row'}"><td><strong>${esc(row.product.name)}</strong><span>${esc(row.product.brand)} · ${esc(row.product.size)}</span><small class="row-status ${row.status==='available'?'good':'partial'}">${icon(row.status==='available'?'check':'info')} ${statusLabels[row.status]}${row.status==='insufficient'?` (max ${row.offer.quantityAvailable})`:''}</small>${row.simulated?`<small class="offer-source">${referenceAttribution(row.reference)}<br>${esc(row.reference.method || '')}</small>`:row.offer?`<small class="offer-source">${row.offer.sourceUrl?`<a href="${esc(safeLink(row.offer.sourceUrl))}" target="_blank" rel="noopener noreferrer">${esc(row.offer.sourceLabel)} ${icon('external')}</a>`:esc(row.offer.sourceLabel)} · ${new Date(row.offer.observedAt).toLocaleString('it-IT',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}</small>`:''}</td><td>${row.quantity}</td><td>${row.unitPriceCents!==null?money(row.unitPriceCents):'—'}${row.simulated?'<small class="simulated-price-label">Prezzo simulato</small>':''}</td><td><b>${row.lineTotalCents!==null?money(row.lineTotalCents):'—'}</b></td></tr>`).join('')}</tbody></table></div><div class="modal-note">${icon('info')}<p>${state.mode==='demo'?'Negozi, prezzi e disponibilità sono fittizi. ':''}${simulated?'I prezzi simulati non confermano assortimento e disponibilità del negozio. I riferimenti generici non sono sostituzioni automatiche dei prodotti di marca. ':''}${!priced?'Righe senza prezzo, esaurite e con quantità insufficiente sono escluse dal subtotale. ':''}Viaggio e consegna esclusi.</p></div><button class="button primary full" data-action="close-modal">Torna al confronto</button>`,true);
}
function referenceAttribution(ref) {
  const label=ref.sourceProduct || ref.sourceLabel;
  const source=ref.sourceUrl?`<a href="${esc(safeLink(ref.sourceUrl))}" target="_blank" rel="noopener noreferrer">${esc(label)} ${icon('external')}</a>`:esc(label);
  const dateLabel=ref.origin==='editorial'?'Stima definita il':ref.origin==='feed'?'Prezzo osservato il':'Riferimento consultato il';
  return `${source}<br>${dateLabel} ${esc(ref.checkedOn)}${Number.isInteger(ref.sourcePriceCents)?` · ${money(ref.sourcePriceCents)} per ${ref.sourceAmount} ${esc(ref.unit)}`:''}.`;
}
function showPriceSource(id) {
  const p=product(id),ref=p?.reference;if(!ref)return;
  showModal('Come viene stimato questo prezzo',`<p class="modal-description">${esc(p.name)} · ${esc(p.size)}</p><div class="reference-price"><span>Prezzo simulato</span><strong>${money(ref.priceCents)}</strong></div><p class="modal-description">${esc(ref.method)} Non è un prezzo verificato del supermercato e non conferma la disponibilità.</p><p class="reference-source">${referenceAttribution(ref)}</p><p class="modal-description">Lo stesso riferimento si applica a tutti i negozi privi di prezzo verificato. Non è una media statistica di mercato.</p><button class="button primary full" data-action="close-modal">Torna ai prodotti</button>`);
}

function safeLink(value) {try {const u=new URL(value);return u.protocol==='https:'?u.href:'#';}catch{return '#';}}
function editLocation() {
  if(state.mode==='demo') return showModal('La tua zona di esempio',`<p class="modal-description">Nella demo usiamo il centro di Cagliari e negozi fittizi. Puoi cambiare il raggio per vedere come cambia il confronto.</p><form id="demo-radius-form">${radiusControl('demo-radius')}<button class="button primary full" type="submit">Aggiorna la zona ${icon('check')}</button></form><button class="text-button modal-real-search" data-action="exit-demo">Cerca un indirizzo reale ${icon('arrow')}</button>`);
  showModal('Cambiamo zona?',`<p class="modal-description">Aggiorneremo negozi e cataloghi. I prodotti assenti nel nuovo catalogo verranno rimossi dalla lista.</p>${locationFields(true)}`);
}
function privacy() {
  showModal('La tua lista resta tua.',`<div class="privacy-copy"><p>La mia spesa salva zona, raggio e lista nella memoria di questo browser. Non serve un account. Non usiamo strumenti di analisi o cookie di tracciamento.</p><p>La posizione GPS è richiesta solo quando premi “Usa la mia posizione”. Nella ricerca reale, il testo dell’indirizzo viene inviato al geocodificatore Photon e le coordinate al servizio Overpass di Private.coffee per cercare i negozi. Puoi consultare la <a href="https://overpass.private.coffee/#terms-of-use" target="_blank" rel="noopener noreferrer">sua informativa</a>. Il server conserva temporaneamente queste risposte in cache.</p><p>Il servizio che ospita l’app può conservare log tecnici delle richieste secondo la propria configurazione. In caso di dispositivo condiviso, puoi eliminare i dati salvati qui sotto.</p></div><button class="button secondary full" data-action="delete-data">${icon('trash')} Elimina zona e lista salvate</button>`);
}
function exportList() {
  const results=state.results || localComparison();
  const lines=['LA MIA SPESA — IL TUO CARRELLO',state.mode==='demo'?'DEMO — negozi, prezzi e disponibilità fittizi':'Confronto orientativo: prezzi verificati e simulati sono distinti',`${state.location.label} · raggio ${distance(state.radius)} in linea d’aria`,'',...state.list.map(i=>{const p=product(i.productId);return `${i.quantity} × ${p.brand} ${p.name} — ${p.size}`;}),'','CONFRONTO'];
  for(const r of results){
    const priced=r.priceComplete ?? r.complete;
    lines.push('',`${r.store.name}: ${r.pricedCount?money(r.totalCents):'non calcolabile'} — ${priced?r.simulatedCount?'TOTALE STIMATO':'totale completo':'subtotale parziale'}`,`${r.availableCount} prezzi verificati · ${r.simulatedCount || 0} prezzi simulati`);
    for(const row of r.rows)lines.push(`${row.quantity} × ${row.product.name} ${row.product.size}: ${row.lineTotalCents===null?'non calcolabile':money(row.lineTotalCents)} — ${statusLabels[row.status]}${row.simulated?` — riferimento ${row.reference.checkedOn}: ${row.reference.sourceUrl || row.reference.sourceLabel} (${row.reference.origin==='editorial'?'stima indicativa':'riferimento'})`:''}`);
  }
  lines.push('','I prezzi simulati non confermano assortimento e disponibilità e non sono una media di mercato. A parità di stime non è possibile indicare un negozio più conveniente. Viaggio e consegna esclusi.');
  const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='la-mia-spesa-lista.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Lista esportata. Buona spesa!');
}

document.addEventListener('click',event=> {
  if(event.target.closest('.brand,.footer-brand')){event.preventDefault();goHome();return;}
  const button=event.target.closest('button');if(!button || button.disabled)return;
  if(button.dataset.radiusAdjust){const form=button.closest('form');const input=$('.radius-slider',form);updateRadiusControl(form,Math.max(MIN_RADIUS_KM,Math.min(MAX_RADIUS_KM,Number(input.value)+Number(button.dataset.radiusAdjust))));return;}
  if(button.dataset.start)return chooseStart(button.dataset.start,button.closest('form'));
  if(button.dataset.add)return changeQuantity(button.dataset.add,1);
  if(button.dataset.delta)return changeQuantity(button.dataset.product,Number(button.dataset.delta));
  if(button.dataset.sampleList){const list=sampleLists.find(l=>l.id===button.dataset.sampleList);if(list){state.list=structuredClone(list.items);closeModal();refreshListUI();toast(`${list.name}: lista demo caricata.`);}return;}
  if(button.dataset.category) {state.visibleLimit=24;state.category=button.dataset.category;render();$('#product-search').focus({preventScroll:true});return;}
  if(button.dataset.detail)return showDetail(button.dataset.detail);
  if(button.dataset.priceSource)return showPriceSource(button.dataset.priceSource);
  if(button.dataset.locationIndex!==undefined){const form=button.closest('form');return loadLocation(form._locations[Number(button.dataset.locationIndex)],Number(new FormData(form).get('radius')),$('.form-feedback',form),form._destination);}
  if(button.dataset.step) {
    if(button.dataset.step==='compare')return showComparison();
    if(button.dataset.step==='location')return goHome();
    state.page=button.dataset.step;render();announcePage();return;
  }
  const actions={
    home:goHome,'resume-list':resumeList,'sample-lists':chooseSampleList,'compose-cart':resumeList,
    'confirm-gps':()=>{if(pendingGps)loadLocation(pendingGps.location,pendingGps.radius,$('#gps-feedback'));},
    'retry-gps':()=>geolocate(pendingGps?.radius),'gps-address':correctGpsWithAddress,
    'more-products':()=>{state.visibleLimit+=24;$('#product-grid').innerHTML=productGrid();},
    'toggle-categories':()=>{state.categoriesExpanded=!state.categoriesExpanded;render();$('[data-action="toggle-categories"]')?.focus({preventScroll:true});},
    'retry-stores':()=>loadLocation({...state.location},state.radius,$('#directory-feedback'),state.page),
    demo:()=>startDemo(false),'exit-demo':exitDemo,help:showHelp,privacy,stores:showStores,'edit-location':editLocation,geolocate:()=>geolocate(),compare:showComparison,
    catalog:()=>{state.page='catalog';state.results=null;render();announcePage();},
    'sample-list':()=>{state.list=structuredClone(sampleList);refreshListUI();toast('Una lista d’esempio, pronta da modificare.');},
    'clear-search':()=>{state.visibleLimit=24;state.search='';state.category='all';render();},
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
  if(event.target.name==='address'){const form=event.target.closest('form'),selected=knownStart(event.target.value);form.querySelectorAll('[data-start]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.start===selected?.id)));$('.location-candidates',form).innerHTML='';$('.form-feedback',form).textContent='';if(state.busy){requestId++;state.busy=false;setLocationButtons(false);updateHeader();}}
  if(event.target.id==='product-search'){state.visibleLimit=24;state.search=event.target.value;$('#product-grid').innerHTML=productGrid();}
  if(event.target.classList.contains('radius-slider')){updateRadiusControl(event.target.closest('form'),Number(event.target.value));}
});
document.addEventListener('change',event=>{if(event.target.id==='category-select'){state.category=event.target.value;state.visibleLimit=24;render();$('#category-select').focus({preventScroll:true});}if(event.target.id==='hide-incomplete'){state.completeOnly=event.target.checked;$('#incomplete-results').hidden=state.completeOnly;}});
document.addEventListener('submit',event=> {
  if(['location-form','location-modal-form'].includes(event.target.id)){event.preventDefault();findLocation(event.target,event.submitter?.value==='stores'?'stores':'catalog');}
  if(event.target.id==='demo-radius-form'){event.preventDefault();state.radius=Number(new FormData(event.target).get('radius'));state.results=null;closeModal();persist();render();toast(`Raggio aggiornato: ${stores().length} negozi demo.`);}
});
document.addEventListener('keydown',event=>{if(event.key==='/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName) && !$('#modal').open && $('#product-search')){event.preventDefault();$('#product-search').focus();}});
$('#modal').addEventListener('close',()=>{if(pendingGps){requestId++;state.busy=false;pendingGps=null;document.querySelectorAll('[data-action="geolocate"],[data-action="retry-gps"],[data-action="confirm-gps"]').forEach(button=>button.disabled=false);updateHeader();}});
$('#modal').addEventListener('click',event=> {if(event.target===$('#modal')){const r=$('#modal').getBoundingClientRect();if(event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom)closeModal();}});

async function init() {
  hydrateIcons();
  if(saved?.version===1 && saved.mode==='demo') {
    state.mode='demo';state.data=createDemoData();state.location={...demoLocation};state.radius=normalizeRadius(saved.radius);state.list=migrateDemoList(saved.list);state.page=saved.page==='location'?'location':'catalog';
  } else if(saved?.version===1 && saved.mode==='live' && validCoordinates(saved.location?.lat,saved.location?.lon)) {
    state.location=saved.location;state.radius=normalizeRadius(saved.radius);state.list=Array.isArray(saved.list)?saved.list:[];
  }
  if(window.SPESINA_STATIC && state.mode!=='demo'){state.mode='demo';state.data=createDemoData();state.location={...demoLocation};state.list=[];state.page='catalog';}
  render();
  if(saved?.mode==='demo' && saved.list?.some(item=>String(item?.productId).startsWith('demo-'))) {persist();toast('La tua lista demo è stata aggiornata al catalogo condiviso, con le quantità salvate.');}
  if(!window.SPESINA_STATIC && location.protocol!=='file:') {
    try {const status=await api('status');state.live=status.live===true;} catch {state.live=false;}
    if(state.page==='location')render();
  }
}
init();
