# Stato di verifica

Data: 17 ottobre 2026 · Versione 1.2.0 Cagliari.

- `npm run check`: superato sui sorgenti principali.
- `npm test`: 66 test superati. Calcoli in centesimi, quantità, disponibilità, prezzi scaduti, risparmi solo fra liste complete, raggio da 0,5 a 6 km, migrazione delle preferenze, feed, insegne, fonti, geocodifica, ricerca negozi, API, accesso ai file e compilazione della demo autonoma.
- La demo contiene 96 ID prodotto unici in 14 categorie, 8 negozi fittizi e 4 liste pronte. I test verificano che tutte le liste trovino almeno un confronto completo con il raggio demo iniziale.
- Nuovi test sulla ricerca negozi: guasto mappa con elenco locale, guasto fuori dalla copertura locale, pausa dopo un errore, fallback GET solo su 405/501. L’elenco di 8 punti reali viene verificato senza prezzi, con data e fonti, rispetto rigoroso del raggio e deduplicazione.
- `node scripts/build-demo.mjs`: demo autonoma generata senza dipendenze. Il test compila anche lo script incorporato.
- Verifica visuale con Chromium: **non eseguita**. Playwright è disponibile ma il browser manca e il download è stato bloccato dalla rete. Non sono state ispezionate schermate della nuova interfaccia.
- `scripts/ui-check.mjs`: controlla home da pulsante/logo/passo 1, lista conservata e ripresa, filtri, paginazione, liste pronte, confronto, esportazione, larghezze 320/390/768/1440 e messaggi di guasto mappa. Script controllato sintatticamente, non eseguito qui. È incluso il workflow manuale GitHub Actions **Browser checks** per eseguirlo con Chromium disponibile; il workflow non è stato avviato da questa chat.
- Fonti degli 8 negozi locali: schede ufficiali Eurospin/Lidl e rispettivi link di indicazioni, consultati il 17/10/2026. Dettagli in `docs/CAGLIARI.md`. Non è un censimento completo e non certifica l’apertura futura dei negozi.
- Geocodifica Photon e ricerca Overpass Private.coffee: da verificare dall’hosting finale. I test automatici usano risposte simulate, senza chiamate ai servizi esterni.
- Prezzi di catene reali: **nessun feed configurato o verificato**. I test dei prezzi e la demo usano dati sintetici.
- Pubblicazione dell’aggiornamento: **non eseguita da questa chat**. Il sito iniziale è già stato pubblicato dall’utente. La connessione GitHub non è disponibile; il pacchetto va caricato nel repository esistente e distribuito dal servizio Render esistente. Nessun altro servizio Render è stato modificato.

## Cosa mostra lo screenshot

La pagina segnala che la ricerca OpenStreetMap non risponde, ma riporta anche zero negozi e “Nessun negozio trovato”. Il guasto del servizio non dimostra l’assenza di supermercati. La nuova versione distingue questo caso e usa il piccolo elenco locale quando copre la posizione e il raggio selezionati. Fuori dalla copertura locale mostra “Numero dei negozi non verificabile”.

Il servizio cartografico predefinito è stato cambiato, ma la risposta effettiva dal sito Render non è stata verificata: non sono disponibili la URL pubblica e i log dell’app. I test locali non confermano che il guasto online sia risolto. Nemmeno il reperimento dei negozi abilita prezzi e disponibilità, che richiedono integrazioni distinte.
