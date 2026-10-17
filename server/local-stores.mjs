import { haversine } from '../public/core.mjs';

// Coordinates copied from the directions links published by each retailer.
// This small dated directory contains NO prices, stock, or claim of completeness.
export const verifiedLocalStores = [
  {id:'local:eurospin-cagliari-marconi',name:'Eurospin · Viale Marconi',chain:'Eurospin',address:'Viale Marconi 215, Cagliari',lat:39.24098837732278,lon:9.14937777980432,officialUrl:'https://www.eurospin.com/it-it/punti-vendita/cagliari-viale-marconi/'},
  {id:'local:eurospin-cagliari-stamira',name:'Eurospin · Via Stamira',chain:'Eurospin',address:'Via Stamira, Cagliari',lat:39.24992941,lon:9.116578967,officialUrl:'https://www.eurospin.com/it-it/punti-vendita/cagliari-via-stamira/'},
  {id:'local:eurospin-elmas',name:'Eurospin · Elmas',chain:'Eurospin',address:'S.S. 130, c/o ex F.A.S., Elmas',lat:39.26015552155916,lon:9.064522337825329,officialUrl:'https://www.eurospin.com/it-it/punti-vendita/elmas-s-s-130/'},
  {id:'local:eurospin-sestu-ss131',name:'Eurospin · Sestu ex S.S. 131',chain:'Eurospin',address:'ex S.S. 131, Sestu',lat:39.2942475,lon:9.0929717,officialUrl:'https://www.eurospin.com/it-it/punti-vendita/sestu-ex-s-s-131/'},
  {id:'local:eurospin-sestu-is-coras',name:'Eurospin · Sestu Is Coras',chain:'Eurospin',address:'S.p. Sestu–Elmas, località Is Coras, Sestu',lat:39.28564618,lon:9.081409843,officialUrl:'https://www.eurospin.com/it-it/punti-vendita/sestu-loc-is-coras/'},
  {id:'local:lidl-cagliari-monastir',name:'Lidl · Viale Monastir',chain:'Lidl',address:'Viale Monastir 130, Cagliari',lat:39.24438,lon:9.09666,officialUrl:'https://www.lidl.it/s/it-IT/ricerca-negozio/cagliari-ca/viale-monastir-130/'},
  {id:'local:lidl-cagliari-marconi',name:'Lidl · Viale Marconi',chain:'Lidl',address:'Viale Marconi 163, Cagliari',lat:39.23506,lon:9.13941,officialUrl:'https://www.lidl.it/s/it-IT/ricerca-negozio/cagliari-ca/viale-marconi-163/'},
  {id:'local:lidl-cagliari-ampere',name:'Lidl · Via Ampere',chain:'Lidl',address:'Via Andrè Marie Ampere, Cagliari',lat:39.24967,lon:9.13486,officialUrl:'https://www.lidl.it/s/it-IT/ricerca-negozio/cagliari-ca/via-andre-marie-ampere-snc/'}
].map(store=>({...store,initial:store.chain[0],color:'#48745e',demo:false,catalogStatus:'not_connected',offers:{},discoverySource:'verified_directory',verifiedOn:'2026-10-17',linkScope:'store',coordinateSource:'Directions link on the official store page'}));

export function localStoresNear(location,radius) {
  return verifiedLocalStores.filter(store=>haversine(location,store)<=radius).map(store=>structuredClone(store));
}

export function supplementStores(stores,location,radius) {
  const result=stores.map(store=>structuredClone(store));
  for(const store of localStoresNear(location,radius)) {
    const duplicate=result.some(existing=>existing.id===store.id || String(existing.chain || existing.name).toLowerCase().includes(store.chain.toLowerCase()) && haversine(existing,store)<.1);
    if(!duplicate)result.push(store);
  }
  return result;
}
