import {validCoordinates,haversine,DEFAULT_LOCATION} from './core.mjs';
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
  return 'Posizione non disponibile. Puoi inserire il tuo indirizzo o partire esplicitamente dal centro di Cagliari.';
}
