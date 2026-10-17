# Cagliari: copertura e integrazioni

Verifica delle fonti: 17 ottobre 2026. Versione 1.2.0.

## Cosa è effettivamente attivo

L’app ricerca su OpenStreetMap supermercati, discount e piccoli alimentari nel raggio scelto, compresi gli indipendenti. Non applica una lista chiusa di marchi. I negozi sono filtrati per distanza dalla posizione scelta; il raggio massimo è 6 km in linea d’aria, con passi di 500 metri. Non sono 6 km dal confine di Cagliari e non è un raggio stradale: un indirizzo a Quartu, Selargius o un altro comune avrà il proprio centro di ricerca. Cagliari è precompilata ma serve scegliere il risultato geografico o inserire l’indirizzo preciso.

L’API segnala `coverage.exhaustive: false`: la mappa non garantisce un censimento di tutti i supermercati esistenti. Un negozio non riconosciuto come insegna rimane comunque nei risultati. Negozi indicati esplicitamente come dismessi o abbandonati vengono esclusi. Non abbiamo inserito punti vendita con coordinate inventate.

I link ai siti ufficiali vengono associati ai negozi trovati. L’app mostra separatamente quanti negozi sono stati trovati e quanti hanno un catalogo prezzi effettivamente collegato. **Questo aggiornamento non attiva alcun nuovo feed prezzi.** La demo è centrata su Cagliari e contiene 96 prodotti, 14 categorie, 8 negozi fittizi e 4 liste pronte, con prezzi e disponibilità inventati.

## Elenco locale di riserva

La ricerca Overpass predefinita usa Private.coffee. Un timeout o una risposta incompleta vengono segnalati come guasto. Se il servizio non risponde, l’app può mostrare gli 8 punti seguenti, filtrati per la distanza dalla posizione scelta: un raggio di 3 km dal centro non li comprende tutti. Se nessuna voce locale rientra nel raggio, il numero dei negozi viene dichiarato non verificabile, anziché zero.

Questo elenco di due catene è parziale, verificato il 17/10/2026. Non indica prezzi, scorte o apertura in tempo reale. Le coordinate sono tratte dai link di indicazioni stradali presenti nelle schede ufficiali, non da indirizzi geocodificati a intuito. I dettagli sono in `server/local-stores.mjs`; quando la mappa risponde l’elenco integra i risultati, evitando duplicati della stessa catena entro 100 metri.

| Punto vendita | Fonte ufficiale |
| --- | --- |
| Eurospin, viale Marconi 215, Cagliari | [Scheda](https://www.eurospin.com/it-it/punti-vendita/cagliari-viale-marconi/) |
| Eurospin, via Stamira, Cagliari | [Scheda](https://www.eurospin.com/it-it/punti-vendita/cagliari-via-stamira/) |
| Eurospin, S.S. 130 c/o ex F.A.S., Elmas | [Scheda](https://www.eurospin.com/it-it/punti-vendita/elmas-s-s-130/) |
| Eurospin, ex S.S. 131, Sestu | [Scheda](https://www.eurospin.com/it-it/punti-vendita/sestu-ex-s-s-131/) |
| Eurospin, località Is Coras, Sestu | [Scheda](https://www.eurospin.com/it-it/punti-vendita/sestu-loc-is-coras/) |
| Lidl, viale Monastir 130, Cagliari | [Scheda](https://www.lidl.it/s/it-IT/ricerca-negozio/cagliari-ca/viale-monastir-130/) |
| Lidl, viale Marconi 163, Cagliari | [Scheda](https://www.lidl.it/s/it-IT/ricerca-negozio/cagliari-ca/viale-marconi-163/) |
| Lidl, via André Marie Ampère, Cagliari | [Scheda](https://www.lidl.it/s/it-IT/ricerca-negozio/cagliari-ca/via-andre-marie-ampere-snc/) |

Servizio cartografico: [Private.coffee Overpass](https://overpass.private.coffee/). La risposta dal sito Render finale deve ancora essere verificata: i test locali simulano successi ed errori e non confermano il ripristino online.

## Fonti consultate e stato

| Insegna | Fonte | Esito della verifica |
| --- | --- | --- |
| Pan / SuperPan / IperPan | [Pan e CosìComodo](https://www.supermercatipan.it/servizi-utili/cosicomodo) · [IperPan La Plaia](https://www.cosicomodo.it/pan/cagliari-plaia) | Servizio online ufficiale e negozio di La Plaia identificati. Importazione prezzi e scorte non attiva. |
| Conad / Conad City / Spazio Conad | [Spesa online Cagliari](https://spesaonline.conad.it/aree-coperte-dal-servizio/cagliari) | La pagina ufficiale elenca negozi/servizi nel Cagliaritano e richiede la verifica dell’indirizzo. Nessuna sessione o API negozio è stata integrata. |
| Nonna Isa | [Sito e volantini](https://www.nonnaisa.com/) | Il sito promozionale è leggibile. La lettura strumentale di shop.nonnaisa.com restituisce 403: non è prova che il negozio sia chiuso né che il catalogo sia utilizzabile da questa app. |
| Despar / Eurospar / Interspar | [Despar Sardegna](https://desparsardegna.it/) | Sito ufficiale per negozi, prodotti a marchio e volantini. Catalogo prezzi per negozio non collegato. |
| CRAI | [Negozio di via della Pineta](https://www.crai-supermercati.it/punto-vendita/6009-crai-via-della-pineta/) · [Sito CRAI](https://crai.it/) | Schede locali e volantini. Catalogo e scorte non collegati. |
| Lidl | [Cagliari, viale Monastir](https://www.lidl.it/s/it-IT/ricerca-negozio/cagliari-ca/viale-monastir-130/) | Schede locali e offerte. Non equivalgono all’inventario completo del negozio. |
| Eurospin | [Cagliari, viale Marconi](https://www.eurospin.com/it-it/punti-vendita/cagliari-viale-marconi/) | Scheda locale con servizi, reparti e volantini. Catalogo completo e scorte non collegati. |
| MD | [Ricerca negozi](https://www.mdspa.it/negozi/) | Schede locali e volantini. Catalogo alimentare e scorte non collegati. |
| Carrefour | [Cagliari, via Manno](https://www.carrefour.it/punti-vendita/carrefour-express-cagliari-via-manno-10-4997.html) | Scheda del punto vendita. La pagina nazionale di spesa online non dimostra da sola la copertura o i prezzi di questo negozio. |
| Tuttigiorni | [Canale Glovo Cagliari](https://glovoapp.com/it/it/cagliari/stores/tuttigiorni-cag) | Canale di consegna con verifica indirizzo. È segnalato come canale Glovo e non come sito proprietario. Prezzi di consegna non assunti uguali ai prezzi in negozio; nessuna importazione attiva. |

Questa tabella riguarda le fonti verificate, non un elenco completo di tutte le insegne o di tutti i punti vendita del Cagliaritano. Il riconoscimento delle insegne è un arricchimento dei risultati cartografici, non un criterio di inclusione.

## Perché non sono ancora collegati tutti i prezzi

Non è stato individuato e verificato un accesso API/feed completo che renda disponibili per tutti i punti vendita prodotti identificabili, prezzi attuali e disponibilità. Una pagina di spesa online può dipendere da indirizzo, negozio e sessione. Il collegamento a un sito non crea quell’accesso; i volantini descrivono una parte delle promozioni e non tutto ciò che si trova sugli scaffali.

Per attivare ogni integrazione occorrono un canale dati utilizzabile, la corrispondenza con il negozio fisico, identificativi prodotti e formati coerenti, disponibilità confermata e un metodo verificato di aggiornamento. Il connettore deve poi trasformare quei dati nel contratto documentato in README.md. Un sito pubblico non documenta automaticamente un’API riutilizzabile. Non sono stati aggirati login o blocchi di accesso e non sono state contattate le catene a nome dell’utente.

Le prime fonti da approfondire per un connettore effettivo sono Pan/CosìComodo e Conad. Per ogni catena vanno verificati l’accesso al catalogo e l’uso dei dati prima di dichiarare il confronto operativo. L’aggiunta di soli link o promozioni non deve essere presentata come confronto completo dei supermercati.

## Pubblicazione dell’aggiornamento

La chat non ha accesso a GitHub: l’integrazione risulta disabilitata dall’amministrazione. I file modificati sono inclusi nel pacchetto. Caricali nel repository esistente La-mia-spesa seguendo AGGIORNAMENTO-CAGLIARI.txt; non creare un nuovo servizio e non modificare le altre applicazioni Render. L’esecuzione dei test locali non prova che questi file siano già online.
