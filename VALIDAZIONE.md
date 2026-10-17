# Stato di verifica

17 ottobre 2026 · Versione 1.4.0.

- `npm run check`: superato sui moduli principali, compreso il catalogo condiviso.
- `npm test`: **92 test superati**. Comprende calcoli, disponibilità, API, feed, mappa, GPS e catalogo.
- **Uniformità verificata:** prodotti e categorie del carrello senza feed coincidono esattamente con quelli della demo. 384 ID unici, 24 categorie, 16 combinazioni nome/formato diverse per categoria. La prima pagina copre tutte le categorie.
- **Compatibilità verificata:** tutti i 96 vecchi ID demo hanno una migrazione valida; le quantità rimangono e gli eventuali duplicati convergenti si sommano fino al limite di 99. I vecchi 30 ID di riferimento restano selezionabili. Le migrazioni demo non toccano gli ID dei feed reali.
- **Provenienza distinta:** 30 voci mantengono i precedenti riferimenti pubblici Conad; 354 nuove voci sono stime indicative definite nel catalogo, con origine editorial, data di definizione e nessuna URL di prezzo rilevato. I test non scambiano queste stime per osservazioni pubbliche.
- **Confronto ampliato verificato:** l’API accetta il carrello di tutti i 384 articoli e restituisce totali simulati, senza inventare scorte. Le stesse stime producono parità fra negozi. Somme in centesimi, quantità, offerte verificate prioritarie ed esaurimenti/insufficienze mantenuti.
- **Demo autonoma compilata:** lo script incorporato include catalogo condiviso, migrazione, app e GPS, senza dipendenze o risorse esterne. Test di compilazione superato.
- **Browser e controllo visuale: non eseguiti qui.** Playwright è presente ma Chromium non è disponibile; il precedente download è stato bloccato dalla rete. Il controllo `scripts/ui-check.mjs` è stato aggiornato e controllato sintatticamente per selezione categorie, 16 opzioni nella demo e nel carrello, provenienza delle stime, confronto, home, GPS simulato e formati mobile. Il workflow GitHub manuale Browser checks non è stato avviato da questa chat.
- **GPS fisico e servizi esterni dall’hosting:** non verificati sul dispositivo dell’utente o dal suo Render. I test usano risposte simulate per i servizi cartografici; resta il precedente elenco locale documentato di 8 negozi reali.
- **Feed prezzi locali:** nessuno nuovo configurato o verificato. I prezzi indicativi non certificano una convenienza reale o l’assortimento dei negozi.
- **Deploy dell’aggiornamento:** non eseguito da questa chat. Il pacchetto va caricato nel repository e distribuito dal servizio Render esistente. Le altre applicazioni non sono state modificate.
