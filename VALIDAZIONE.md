# Stato di verifica

17 ottobre 2026 · Versione 1.3.0.

- `npm run check`: superato. Comprende server, catalogo di riferimento, composizione del catalogo, GPS e app.
- `npm test`: **85 test superati**. Include i 66 controlli precedenti e 19 nuovi controlli su prezzi simulati, fonti, formati, somme, parità, API e GPS.
- Il test di integrazione API richiede i negozi del centro di Cagliari, sceglie un prodotto di riferimento e tre confezioni, confronta i supermercati reali restituiti e verifica un totale simulato di 1,77 euro per ciascuno. Prezzi falsi inviati dal client non cambiano il risultato. Le chiamate cartografiche sono simulate; l’elenco locale è quello documentato.
- Il catalogo di riferimento include 30 prodotti generici e 16 osservazioni pubbliche di prezzo, consultate il 17/10/2026. È distinto dagli oggetti di offerta dei punti vendita, che restano vuoti senza feed. Test su ID, categorie, centesimi, data e fonti; fonti e metodologia in `docs/PREZZI-SIMULATI.md`.
- Calcoli verificati con prezzi tutti simulati, tutti verificati e misti. Parità quando i riferimenti sono identici. Nessuna trasformazione della stima in disponibilità verificata. Gli esaurimenti e le quantità insufficienti non vengono nascosti dalle stime. Prezzi o riferimenti invalidi non diventano articoli gratuiti.
- GPS: test su richiesta ad alta precisione senza dati memorizzati, coordinate valide, precisione assente o grossolana, distanza da Cagliari e messaggi distinti per permesso negato, posizione non disponibile e timeout. Sono test di dati e logica, non del ricevitore fisico o dei permessi del dispositivo dell’utente.
- `node scripts/build-demo.mjs`: demo autonoma generata. Il test compila lo script incorporato, compreso il nuovo modulo di localizzazione.
- Browser e controllo visuale con Chromium: **non eseguiti qui**. Il browser non è disponibile e il precedente tentativo di download è stato bloccato dalla rete. Non sono state ispezionate schermate della nuova interfaccia.
- `scripts/ui-check.mjs`: aggiornato e controllato sintatticamente. Include demo, home con lista conservata, ricerca → negozi → Componi il carrello → prodotti → confronto simulato, fonti, parità, dettaglio, esportazione, larghezze 320/390/768/1440, errori mappa e GPS simulato con conferma prima della ricerca. Il workflow manuale GitHub **Browser checks** consente di eseguirlo con Chromium; non è stato avviato da questa chat.
- Geocodifica Photon e ricerca Overpass dal servizio Render: **non verificate sull’hosting finale**. Non sono disponibili URL pubblica o log del servizio. Le prove automatiche non confermano il ripristino di un servizio esterno.
- Feed prezzi locali: **nessun feed configurato o verificato**. Il nuovo carrello usa i riferimenti simulati senza dichiarare un’integrazione commerciale o un inventario di Eurospin/Lidl.
- Pubblicazione dell’aggiornamento: **non eseguita da questa chat**. Va caricato nel repository GitHub esistente e distribuito dal servizio Render esistente. Le altre applicazioni Render non sono state modificate.

Il confronto orientativo è utilizzabile con i prezzi simulati richiesti dall’utente. Un’indicazione di convenienza reale fra supermercati richiede prezzi aggiornati e scorte del negozio; se mancano, l’app mostra la stima o la parità e non inventa differenze di prezzo.
