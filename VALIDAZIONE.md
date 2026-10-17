# Stato di verifica

Data: 17 ottobre 2026 · Versione 1.1 Cagliari.

- `npm run check`: superato sui sorgenti principali.
- `npm test`: 54 test superati. Calcoli in centesimi, quantità, disponibilità, prezzi scaduti, risparmi solo fra liste complete, raggio da 0,5 a 6 km, migrazione delle vecchie preferenze, feed, riconoscimento delle insegne, collegamenti ufficiali senza prezzi inventati, bias geografico su Cagliari, ricerca di alimentari indipendenti, API, accesso ai file e compilazione della demo autonoma.
- `node scripts/build-demo.mjs`: demo autonoma generata senza dipendenze.
- Verifica visuale con Chromium: **non eseguita**. Il runtime dispone di Playwright ma non del browser; il download è stato bloccato dalle restrizioni di rete. Il progetto include `scripts/ui-check.mjs`, da eseguire su una macchina con Chromium disponibile. Le schermate non sono state ispezionate visivamente.
- Geocodifica e ricerca supermercati reali: implementate con Photon e Overpass, da verificare dall’hosting finale. I test automatici delle API non inviano richieste ai servizi esterni.
- Prezzi di catene reali: **nessun feed configurato o verificato**. I test usano dati sintetici e la demo è esplicitamente fittizia.
- Pubblicazione GitHub e hosting: **non eseguita**. Questa voce si riferisce al presente aggiornamento: il sito iniziale è stato pubblicato dall’utente. GitHub resta disabilitato per la chat; è incluso il pacchetto da caricare nel repository esistente. Nessun altro servizio Render è stato modificato.

Il superamento dei test di calcolo non costituisce una verifica della copertura geografica, dell’aggiornamento dei prezzi o delle scorte di negozi reali. Questi controlli dipendono dai feed che saranno collegati.
