// Official source directory verified 2026-10-17. A website link is NOT a price feed.
// No store is inserted on the map using guessed coordinates or brand presence alone.
export const retailerSources = [
  {id:'pan',name:'Pan / SuperPan / IperPan',aliases:['iperpan','superpan'],exactNames:['pan'],website:'https://www.supermercatipan.it/',onlineUrl:'https://www.supermercatipan.it/servizi-utili/cosicomodo',note:'Spesa online su CosìComodo: selezionare il punto vendita. Importazione dei prezzi non attiva.'},
  {id:'conad',name:'Conad / Conad City / Spazio Conad',aliases:['conad'],website:'https://www.conad.it/',onlineUrl:'https://spesaonline.conad.it/aree-coperte-dal-servizio/cagliari',note:'Servizi online presenti nel Cagliaritano. Prezzi e disponibilità richiedono un negozio selezionato; importazione non attiva.'},
  {id:'nonna-isa',name:'Nonna Isa',aliases:['nonnaisa'],website:'https://www.nonnaisa.com/',note:'Sito ufficiale e volantini disponibili. Accesso al catalogo online non verificato: il portale shop ha restituito 403.'},
  {id:'despar',name:'Despar / Eurospar / Interspar',aliases:['despar','eurospar','interspar'],website:'https://desparsardegna.it/',note:'Fonti ufficiali per negozi e volantini. Catalogo prezzi per punto vendita non collegato.'},
  {id:'crai',name:'CRAI',aliases:['crai'],website:'https://crai.it/',note:'Schede negozio e volantini ufficiali. Catalogo prezzi per punto vendita non collegato.'},
  {id:'lidl',name:'Lidl',aliases:['lidl'],website:'https://www.lidl.it/s/it-IT/ricerca-negozio/',note:'Punti vendita e offerte ufficiali. Le promozioni non dimostrano la disponibilità dell’intero assortimento.'},
  {id:'eurospin',name:'Eurospin',aliases:['eurospin'],website:'https://www.eurospin.it/punti-vendita/',note:'Schede negozio e volantini ufficiali. Catalogo prezzi e scorte non collegato.'},
  {id:'md',name:'MD',aliases:[],exactNames:['md','mddiscount','mdspa'],website:'https://www.mdspa.it/negozi/',note:'Punti vendita e volantini ufficiali. Catalogo alimentare e scorte non collegato.'},
  {id:'carrefour',name:'Carrefour',aliases:['carrefour'],website:'https://www.carrefour.it/',onlineUrl:'https://www.carrefour.it/spesa-online.html',note:'La presenza del sito nazionale non conferma la copertura online del singolo negozio nel Cagliaritano.'},
  {id:'tuttigiorni',name:'Tuttigiorni',aliases:['tuttigiorni','tuttiigiorni'],website:'https://glovoapp.com/it/it/cagliari/stores/tuttigiorni-cag',websiteLabel:'Tuttigiorni su Glovo',note:'Canale di consegna Glovo a Cagliari: verifica indirizzo e negozio. I prezzi di consegna non sono assunti uguali a quelli sullo scaffale.'}
].map(source=>({...source,checkedOn:'2026-10-17',priceConnection:'not_connected',scope:'chain'}));

const normalize=value=>String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function retailerForStore(store) {
  const values=[store.chain,store.name].filter(Boolean).map(normalize);
  return retailerSources.find(r=>values.some(value=>(r.exactNames || []).includes(value) || r.aliases.some(alias=>value.includes(alias)))) || null;
}

export function enrichStore(store) {
  if(store.demo) return store;
  const source=retailerForStore(store);
  if(!source) return store; // Unrecognized and independent shops remain in the results.
  let officialUrl=store.officialUrl || source.website,onlineUrl=store.onlineUrl || source.onlineUrl || null,linkScope=store.linkScope || 'chain';
  const address=normalize(store.address);
  if(source.id==='pan' && address.includes('laplaia')) {
    officialUrl='https://www.supermercatipan.it/punti-vendita/sardegna/iper-plaia';
    onlineUrl='https://www.cosicomodo.it/pan/cagliari-plaia';linkScope='store';
  }
  return {...store,retailerId:source.id,officialUrl,officialLinkLabel:source.websiteLabel || 'Sito ufficiale',onlineUrl,sourceCheckedOn:source.checkedOn,linkScope};
}

export function sourceCoverage(stores) {
  const ids=new Set(stores.map(s=>s.retailerId).filter(Boolean));
  return retailerSources.filter(r=>ids.has(r.id)).map(({aliases,exactNames,...publicSource})=>publicSource);
}
