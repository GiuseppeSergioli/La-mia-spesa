import {offerStatus,referencePrice} from '../public/core.mjs';
import {referenceProducts,referenceCategories,REFERENCE_CHECKED_ON} from './reference-catalog.mjs';

export function shoppingCatalog(products,stores,now=Date.now()) {
  const catalog=products.map(product=>{
    if(referencePrice(product))return structuredClone(product);
    const offers=stores.flatMap(store=>{
      const offer=store.offers?.[product.id];
      return offerStatus(offer,1,now)==='available'?[{offer,store}]:[];
    }).sort((a,b)=>a.offer.priceCents-b.offer.priceCents);
    if(!offers.length)return structuredClone(product);
    const middle=offers[Math.floor(offers.length/2)],ref=middle.offer;
    return {...structuredClone(product),reference:{origin:'feed',priceCents:ref.priceCents,sourceUrl:ref.sourceUrl,sourceLabel:`Riferimento da ${middle.store.name}; non prezzo degli altri negozi`,sourceProduct:`${product.brand} ${product.name} ${product.size}`,checkedOn:ref.observedAt.slice(0,10),method:'Valore centrale dei prezzi verificati disponibili per lo stesso prodotto. Disponibilità negli altri negozi non verificata.'}};
  });
  const ids=new Set(catalog.map(p=>p.id));
  for(const product of referenceProducts)if(!ids.has(product.id))catalog.push(structuredClone(product));
  const categories=[...referenceCategories];
  for(const category of new Set(catalog.map(p=>p.category)))if(!categories.some(c=>c.id===category))categories.push({id:category,name:category,icon:'grid'});
  return {products:catalog,categories,referenceCatalog:{enabled:true,productCount:referenceProducts.length,checkedOn:REFERENCE_CHECKED_ON,categoryCount:referenceCategories.length-1,publicReferenceCount:referenceProducts.filter(p=>p.reference.origin==='public').length,editorialEstimateCount:referenceProducts.filter(p=>p.reference.origin==='editorial').length,description:'Catalogo condiviso con la demo. Riferimenti pubblici e stime indicative distinti per origine. Non sono una media di mercato né prezzi dei punti vendita locali.'}};
}
