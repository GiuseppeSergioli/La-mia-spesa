export const HISTORY_KEY='la-mia-spesa:history:v1';
export const HISTORY_LIMIT=50;
export const HISTORY_MAX_CHARS=750_000;
const statuses=new Set(['available','estimated','out_of_stock','unknown','stale','insufficient']);
const cents=value=>value===null || Number.isSafeInteger(value) && value>=0;
const text=(value,max=300)=>typeof value==='string' && value.length>0 && value.length<=max;

export function validHistoryEntry(entry) {
  if(!entry || entry.schemaVersion!==1 || !text(entry.id,100) || !Number.isFinite(Date.parse(entry.savedAt)) || !['live','demo'].includes(entry.mode) || !text(entry.location?.label) || !Number.isFinite(entry.radius) || entry.radius<.5 || entry.radius>6)return false;
  if(!Array.isArray(entry.products) || !entry.products.length || entry.products.length>500 || !Array.isArray(entry.stores) || !entry.stores.length || entry.stores.length>250)return false;
  const ids=new Set();
  for(const p of entry.products){if(!text(p.id,150) || ids.has(p.id) || !text(p.name) || typeof p.brand!=='string' || p.brand.length>300 || !text(p.size,100) || !Number.isInteger(p.quantity) || p.quantity<1 || p.quantity>99)return false;ids.add(p.id);}
  return entry.stores.every(s=>text(s.id,150) && text(s.name) && typeof s.address==='string' && s.address.length<=500 && cents(s.totalCents) && Number.isInteger(s.pricedCount) && s.pricedCount>=0 && Number.isInteger(s.simulatedCount) && s.simulatedCount>=0 && typeof s.priceComplete==='boolean' && Array.isArray(s.rows) && s.rows.length===entry.products.length && new Set(s.rows.map(r=>r.productId)).size===s.rows.length && s.rows.every(r=>ids.has(r.productId) && statuses.has(r.status) && Number.isInteger(r.quantity) && r.quantity>=1 && r.quantity<=99 && cents(r.unitPriceCents) && cents(r.lineTotalCents) && typeof r.simulated==='boolean' && (r.lineTotalCents===null || r.unitPriceCents!==null && r.lineTotalCents===r.unitPriceCents*r.quantity)));
}

export function createHistoryEntry({mode,location,radius,list,products,results},savedAt=new Date().toISOString()) {
  const byId=new Map(products.map(p=>[p.id,p]));
  const entry={schemaVersion:1,id:globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,savedAt,mode,location:{label:location.label,lat:location.lat,lon:location.lon},radius,
    products:list.map(item=>{const p=byId.get(item.productId);if(!p)throw new Error('Unknown product in history');return {id:p.id,name:p.name,brand:p.brand,size:p.size,quantity:item.quantity};}),
    stores:results.map(result=>({id:result.store.id,name:result.store.name,address:result.store.address || '',distanceKm:result.store.distanceKm ?? null,totalCents:result.totalCents,priceComplete:result.priceComplete ?? result.complete,complete:result.complete===true,pricedCount:result.pricedCount ?? result.availableCount,simulatedCount:result.simulatedCount || 0,verifiedTotalCents:result.verifiedTotalCents ?? result.totalCents,simulatedTotalCents:result.simulatedTotalCents || 0,
      rows:result.rows.map(row=>({productId:row.product.id,quantity:row.quantity,status:row.status,unitPriceCents:row.unitPriceCents,lineTotalCents:row.lineTotalCents,simulated:row.simulated===true}))}))};
  if(!validHistoryEntry(entry))throw new Error('Invalid history snapshot');
  return entry;
}

const fingerprint=entry=>JSON.stringify({mode:entry.mode,location:entry.location,radius:entry.radius,products:entry.products,stores:entry.stores});
export function appendHistory(entries,entry) {
  if(!validHistoryEntry(entry))throw new Error('Invalid history entry');
  const valid=entries.filter(validHistoryEntry);
  if(valid[0] && Date.parse(entry.savedAt)-Date.parse(valid[0].savedAt)>=0 && Date.parse(entry.savedAt)-Date.parse(valid[0].savedAt)<120_000 && fingerprint(valid[0])===fingerprint(entry))return valid;
  return [structuredClone(entry),...valid].slice(0,HISTORY_LIMIT);
}

export function readHistory(storage) {
  try{const raw=storage.getItem(HISTORY_KEY);if(!raw || raw.length>HISTORY_MAX_CHARS)return [];const data=JSON.parse(raw);if(!Array.isArray(data))return [];return data.filter(validHistoryEntry).sort((a,b)=>Date.parse(b.savedAt)-Date.parse(a.savedAt)).slice(0,HISTORY_LIMIT);}catch{return [];}
}

export function writeHistory(storage,entries) {
  const retained=entries.filter(validHistoryEntry).slice(0,HISTORY_LIMIT);
  while(retained.length>1 && JSON.stringify(retained).length>HISTORY_MAX_CHARS)retained.pop();
  const value=JSON.stringify(retained);if(value.length>HISTORY_MAX_CHARS)throw new Error('History exceeds storage budget');
  storage.setItem(HISTORY_KEY,value);return retained;
}
