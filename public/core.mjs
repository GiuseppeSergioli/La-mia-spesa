// Shared by the browser, the API and the automated tests. Prices are integer cents.
export const MAX_QUANTITY = 99;
export const MAX_PRICE_CENTS = 100_000_000;
export const MIN_RADIUS_KM = 0.5;
export const MAX_RADIUS_KM = 6;
export const RADIUS_STEP_KM = 0.5;
export const DEFAULT_RADIUS_KM = 3;
export const DEFAULT_LOCATION = {label:'Cagliari · centro città',lat:39.2238,lon:9.1217};

export function validRadius(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= MIN_RADIUS_KM && value <= MAX_RADIUS_KM && Number.isInteger(value / RADIUS_STEP_KM);
}

export function normalizeRadius(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return DEFAULT_RADIUS_KM;
  return Math.max(MIN_RADIUS_KM,Math.min(MAX_RADIUS_KM,Math.round(value / RADIUS_STEP_KM) * RADIUS_STEP_KM));
}

export function haversine(a, b) {
  const rad = n => n * Math.PI / 180;
  const dlat = rad(b.lat - a.lat), dlon = rad(b.lon - a.lon);
  const h = Math.sin(dlat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dlon / 2) ** 2;
  return 6371.0088 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}

export function validCoordinates(lat, lon) {
  return typeof lat === 'number' && typeof lon === 'number' && Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

export function nearbyStores(stores, location, radius) {
  return stores.map(s => ({ ...s, distanceKm: haversine(location, s) }))
    .filter(s => s.distanceKm <= radius).sort((a, b) => a.distanceKm - b.distanceKm);
}

export function normalizeList(list, products) {
  const ids = new Set(products.map(p => p.id)), seen = new Set();
  if (!Array.isArray(list)) return [];
  return list.filter(x => x && ids.has(x.productId) && Number.isInteger(x.quantity) && x.quantity > 0 && x.quantity <= MAX_QUANTITY && !seen.has(x.productId) && seen.add(x.productId))
    .map(x => ({ productId: x.productId, quantity: x.quantity }));
}

export function offerStatus(offer, quantity = 1, now = Date.now()) {
  if (!offer) return 'unknown';
  const observed = Date.parse(offer.observedAt);
  const age = Number.isFinite(offer.maxAgeMinutes) && offer.maxAgeMinutes > 0 ? offer.maxAgeMinutes : 1440;
  if (!Number.isFinite(observed) || observed > now + 300_000 || now - observed > age * 60_000) return 'stale';
  if (offer.availability === 'out_of_stock') return 'out_of_stock';
  if (offer.availability !== 'in_stock' || !Number.isSafeInteger(offer.priceCents) || offer.priceCents < 0 || offer.priceCents > MAX_PRICE_CENTS) return 'unknown';
  if (Number.isInteger(offer.quantityAvailable) && offer.quantityAvailable < quantity) return 'insufficient';
  return 'available';
}

export function referencePrice(product) {
  const ref=product?.reference;
  if(!ref || !Number.isSafeInteger(ref.priceCents) || ref.priceCents<=0 || ref.priceCents>MAX_PRICE_CENTS || !/^\d{4}-\d{2}-\d{2}$/.test(ref.checkedOn || '') || !Number.isFinite(Date.parse(ref.checkedOn))) return null;
  try {if(new URL(ref.sourceUrl).protocol!=='https:')return null;} catch {return null;}
  return ref;
}

function basketRow(product, quantity, store, now, allowEstimates) {
  const offer=store.offers?.[product.id],availabilityStatus=offerStatus(offer,quantity,now);
  const reference=allowEstimates?referencePrice(product):null;
  const explicitlyMissing=offer?.availability==='out_of_stock' || Number.isInteger(offer?.quantityAvailable) && offer.quantityAvailable<quantity;
  const simulated=Boolean(reference && !explicitlyMissing && ['unknown','stale'].includes(availabilityStatus));
  const status=simulated?'estimated':availabilityStatus;
  const unitPriceCents=simulated?reference.priceCents:status==='available'?offer.priceCents:null;
  return {product,quantity,offer:offer ?? null,status,availabilityStatus,simulated,reference:simulated?reference:null,unitPriceCents,lineTotalCents:unitPriceCents===null?null:unitPriceCents*quantity};
}

export function priceForProduct(product, stores, quantity=1, now=Date.now(), allowEstimates=false) {
  const rows=stores.map(store=>basketRow(product,quantity,store,now,allowEstimates));
  const priced=rows.filter(row=>row.lineTotalCents!==null).sort((a,b)=>a.unitPriceCents-b.unitPriceCents || Number(a.simulated)-Number(b.simulated));
  const best=priced[0];
  if(best)return {priceCents:best.unitPriceCents,simulated:best.simulated,availableCount:rows.filter(r=>r.status==='available').length,reference:best.reference};
  const reference=!stores.length && allowEstimates?referencePrice(product):null;
  return {priceCents:reference?.priceCents ?? null,simulated:Boolean(reference),availableCount:0,reference};
}

export function compareBasket(list, products, stores, now = Date.now(), {allowEstimates=false}={}) {
  const basket = normalizeList(list, products);
  if (!basket.length) return [];
  const index = new Map(products.map(p => [p.id, p]));
  return stores.map(store => {
    const rows = basket.map(item => basketRow(index.get(item.productId),item.quantity,store,now,allowEstimates));
    const available = rows.filter(row => row.status === 'available');
    const simulated=rows.filter(row=>row.simulated),priced=rows.filter(row=>row.lineTotalCents!==null);
    return {store,rows,complete:rows.length>0 && available.length===rows.length,priceComplete:rows.length>0 && priced.length===rows.length,availableCount:available.length,verifiedCount:available.length,simulatedCount:simulated.length,pricedCount:priced.length,unpricedCount:rows.length-priced.length,missingCount:rows.length-available.length,verifiedTotalCents:available.reduce((sum,row)=>sum+row.lineTotalCents,0),simulatedTotalCents:simulated.reduce((sum,row)=>sum+row.lineTotalCents,0),totalCents:priced.reduce((sum,row)=>sum+row.lineTotalCents,0)};
  }).sort((a, b) => Number(b.priceComplete) - Number(a.priceComplete) || (a.priceComplete ? a.totalCents - b.totalCents : b.pricedCount - a.pricedCount || a.totalCents - b.totalCents) || a.store.distanceKm - b.store.distanceKm || a.store.name.localeCompare(b.store.name));
}

export function comparisonSummary(results) {
  const priced=results.filter(r=>r.priceComplete ?? r.complete),partial=results.filter(r=>!(r.priceComplete ?? r.complete));
  const best=priced[0] ?? null,ties=best?priced.filter(r=>r.totalCents===best.totalCents):[];
  return {priced,partial,best,ties,hasEstimates:results.some(r=>r.simulatedCount>0),verifiedWinner:Boolean(best && ties.length===1 && priced.every(r=>r.complete))};
}

export function savingsBetweenComplete(results) {
  const complete = results.filter(r => r.complete);
  return complete.length > 1 ? Math.max(...complete.map(r => r.totalCents)) - Math.min(...complete.map(r => r.totalCents)) : null;
}

export const money = cents => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
export const distance = km => `${new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 }).format(km)} km`;

export function lowestPrice(productId, stores, quantity = 1, now = Date.now()) {
  const offers = stores.map(s => s.offers?.[productId]).filter(o => offerStatus(o, quantity, now) === 'available');
  return offers.length ? Math.min(...offers.map(o => o.priceCents)) : null;
}
