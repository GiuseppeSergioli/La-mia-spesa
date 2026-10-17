import test from 'node:test';
import assert from 'node:assert/strict';
import {CAGLIARI_STARTS,DEFAULT_START,knownStart,GPS_OPTIONS,gpsLocation,gpsWarning,accuracyLabel,geolocationError} from '../public/location.mjs';
import {haversine,validCoordinates} from '../public/core.mjs';
test('blank and whitespace-only starts use Via Roma without geocoding',()=>{
  for(const input of ['', '   ',null,undefined])assert.deepEqual(knownStart(input),{...DEFAULT_START});
  assert.equal(DEFAULT_START.name,'Via Roma');assert.equal(DEFAULT_START.source,'preset');
});
test('four Cagliari shortcuts are distinct central points and match their explicit labels',()=>{
  assert.deepEqual(CAGLIARI_STARTS.map(p=>p.name),['Via Roma','Piazza Yenne','Piazza Garibaldi','Piazza Repubblica']);
  for(const place of CAGLIARI_STARTS){
    assert.ok(validCoordinates(place.lat,place.lon));assert.ok(haversine(place,DEFAULT_START)<2);
    assert.deepEqual(knownStart(place.label),{...place});assert.deepEqual(knownStart(`  ${place.name.toUpperCase()}  `),{...place});
    assert.deepEqual(knownStart(`${place.name}, Cagliari`),{...place});
  }
  for(let i=0;i<CAGLIARI_STARTS.length;i++)for(let j=i+1;j<CAGLIARI_STARTS.length;j++)assert.ok(haversine(CAGLIARI_STARTS[i],CAGLIARI_STARTS[j])>.1);
});
test('custom and invalid addresses never silently fall back to a quick zone',()=>{
  for(const address of ['Via Roma 167, Cagliari','Via Roma, Sassari','Via sconosciuta','Cagliari','Via Roma 10'])assert.equal(knownStart(address),null);
  const selected={label:'Via scelta 12, Cagliari',lat:39.22,lon:9.13};
  assert.deepEqual(knownStart(selected.label,selected),selected);assert.equal(knownStart('Via nuova 14, Cagliari',selected),null);
  const resolved=knownStart('');resolved.lat=0;assert.notEqual(knownStart('').lat,0);
});
test('GPS requests high accuracy with no cached location',()=>{assert.equal(GPS_OPTIONS.enableHighAccuracy,true);assert.equal(GPS_OPTIONS.maximumAge,0);assert.equal(GPS_OPTIONS.timeout,20000);});
test('GPS coordinates and uncertainty remain distinct, without invented reverse addresses',()=>{
  const loc=gpsLocation({coords:{latitude:39.2238,longitude:9.1217,accuracy:1200}});assert.equal(loc.lat,39.2238);assert.equal(loc.lon,9.1217);assert.equal(loc.accuracyMeters,1200);assert.equal(loc.source,'gps');assert.match(gpsWarning(loc,3),/approssimativo/);assert.match(accuracyLabel(1200),/1,2 km/);
});
test('invalid GPS coordinates are rejected and missing precision is disclosed',()=>{
  for(const coords of [{latitude:NaN,longitude:9},{latitude:91,longitude:9},{}])assert.throws(()=>gpsLocation({coords}));
  const loc=gpsLocation({coords:{latitude:39.2238,longitude:9.1217,accuracy:0}});assert.equal(loc.accuracyMeters,null);assert.match(gpsWarning(loc,3),/non comunica/);
});
test('coarse points are assessed against the selected radius and distant points need verification',()=>{
  const loc=gpsLocation({coords:{latitude:39.2238,longitude:9.1217,accuracy:350}});assert.match(gpsWarning(loc,.5),/approssimativo/);assert.match(gpsWarning(loc,6),/conferma/);
  const remote=gpsLocation({coords:{latitude:45,longitude:9,accuracy:30}});assert.match(gpsWarning(remote,3),/lontano da Cagliari/);
});
test('denied, unavailable and timed-out GPS errors explain the manual alternative',()=>{
  assert.match(geolocationError({code:1}),/negato/);assert.match(geolocationError({code:2}),/servizi di localizzazione/);assert.match(geolocationError({code:3}),/20 secondi/);for(const code of [1,2,3,99])assert.match(geolocationError({code}),/indirizzo|via, numero/);
});
