# Stato di verifica

Data: 17 ottobre 2026.

- `npm run check`: superato sui sorgenti principali.
- `npm test`: 39 test superati. Calcoli in centesimi, quantità, disponibilità, prezzi scaduti, risparmi solo fra liste complete, raggio, feed, fonti, indirizzi di rete, API, accesso ai file e compilazione della demo autonoma.
- `node scripts/build-demo.mjs`: demo autonoma generata senza dipendenze.
- Verifica visuale con Chromium: **non eseguita**. Il runtime dispone di Playwright ma non del browser; il download è stato bloccato dalle restrizioni di rete. Il progetto include `scripts/ui-check.mjs`, da eseguire su una macchina con Chromium disponibile. Le schermate non sono state ispezionate visivamente.
- Geocodifica e ricerca supermercati reali: implementate con Photon e Overpass, da verificare dall’hosting finale. I test automatici delle API non inviano richieste ai servizi esterni.
- Prezzi di catene reali: **nessun feed configurato o verificato**. I test usano dati sintetici e la demo è esplicitamente fittizia.
- Pubblicazione GitHub e hosting: **non eseguita**. Le relative connessioni erano disabilitate dall’amministrazione della sessione. Sono inclusi workflow GitHub e configurazione Render.

Il superamento dei test di calcolo non costituisce una verifica della copertura geografica, dell’aggiornamento dei prezzi o delle scorte di negozi reali. Questi controlli dipendono dai feed che saranno collegati.
