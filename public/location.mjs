import {validCoordinates,haversine,DEFAULT_LOCATION} from './core.mjs';

// Indicative public landmarks, not a claim about the device's location.
// Sources and coordinate precision are documented in docs/CAGLIARI.md.
export const CAGLIARI_STARTS=Object.freeze([
  Object.freeze({id:'via-roma',name:'Via Roma',label:'Via Roma, Cagliari · Palazzo Civico',lat:39.21533,lon:9.11056,source:'preset'}),
  Object.freeze({id:'piazza-yenne',name:'Piazza Yenne',label:'Piazza Yenne, Cagliari',lat:39.21773,lon:9.11347,source:'preset'}),
  Object.freeze({id:'piazza-garibaldi',name:'Piazza Garibaldi',label:'Piazza Garibaldi, Cagliari',lat:39.21908,lon:9.12133,source:'preset'}),
  Object.freeze({id:'piazza-repubblica',name:'Piazza Repubblica',label:'Piazza Repubblica, Cagliari · fermata metro',lat:39.21733,lon:9.12525,source:'preset'})
]);
export const DEFAULT_START=CAGLIARI_STARTS[0];
const normalizedAddress=value=>String(value ?? '').trim().toLocaleLowerCase('it').replace(/\s+/g,' ');
export function knownStart(value,selected=null) {
  const text=normalizedAddress(value);
  if(!text)return {...DEFAULT_START};
  if(selected && validCoordinates(selected.lat,selected.lon) && text===normalizedAddress(selected.label))return {...selected};
  const match=CAGLIARI_STARTS.find(place=>[place.name,`${place.name}, Cagliari`,place.label].some(label=>normalizedAddress(label)===text));
  return match?{...match}:null;
}

export const GPS_OPTIONS={enableHighAccuracy:true,timeout:20_000,maximumAge:0};
export function accuracyLabel(metres) {
  if(!Number.isFinite(metres) || metres<=0)return 'precisione non comunicata';
  return metres>=1000?`circa ${(Math.ceil(metres/100)/10).toLocaleString('it-IT')} km`:`circa ${Math.ceil(metres)} m`;
}
export function gpsLocation(position) {
  const {latitude:lat,longitude:lon,accuracy}=position?.coords || {};
  if(!validCoordinates(lat,lon))throw new Error('Il dispositivo ha restituito una posizione non valida. Inserisci il tuo indirizzo.');
  const accuracyMeters=Number.isFinite(accuracy) && accuracy>0?accuracy:null;
  return {lat,lon,label:'Posizione confermata dal dispositivo',source:'gps',accuracyMeters};
}
export function gpsWarning(location,radius) {
  if(location.accuracyMeters===null)return 'Il dispositivo non comunica la precisione. Verifica il punto prima di continuare.';
  if(location.accuracyMeters>Math.min(500,radius*1000/2))return 'Il punto è approssimativo rispetto al raggio scelto. Per una ricerca precisa, inserisci via, numero e città oppure riprova all’aperto con la posizione precisa abilitata.';
  if(haversine(DEFAULT_LOCATION,location)>100)return 'Il punto rilevato è lontano da Cagliari. Controlla che corrisponda al luogo in cui ti trovi.';
  return 'Controlla il punto rilevato e conferma: la ricerca partirà soltanto dopo la tua scelta.';
}
export function geolocationError(error) {
  if(error?.code===1)return 'Accesso alla posizione negato. Abilita la posizione precisa per questo sito nelle impostazioni del browser e del dispositivo, oppure inserisci il tuo indirizzo.';
  if(error?.code===2)return 'Il dispositivo non riesce a determinare la posizione. Attiva i servizi di localizzazione oppure inserisci via, numero e città.';
  if(error?.code===3)return 'La ricerca della posizione è scaduta dopo 20 secondi. Puoi riprovare oppure inserire il tuo indirizzo.';
  return 'Posizione non disponibile. Puoi inserire il tuo indirizzo o scegliere una delle quattro zone rapide di Cagliari.';
}
