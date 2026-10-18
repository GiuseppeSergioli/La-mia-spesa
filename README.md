# La mia spesa

Un’app in italiano e inglese per comporre una lista per categorie e confrontare quanto costa acquistare **gli stessi prodotti, nelle stesse quantità e nello stesso formato**, presso i supermercati vicini.

**Versione 1.8.0 — passaggio alla spesa online:** nel confronto trovi **Acquista online** per negozi con shop preciso, come IPERPAN Cagliari La Plaia, oppure **Verifica spesa online** per i collegamenti generici delle catene. La finestra permette di aprire lo shop e scaricare una lista promemoria con quantità, nomi e formati. Il carrello deve essere composto sul sito del supermercato: non viene trasferito automaticamente. La demo mostra il percorso senza aprire shop reali. Le nuove funzioni sono in italiano e inglese.

**L’importazione automatica dei prezzi CosìComodo non è attiva.** È stato verificato il servizio Pan e lo shop La Plaia per il ritiro, ma non un accesso aggiornabile affidabile al listino. Nessun prezzo datato trovato nei risultati del motore di ricerca è stato inserito come prezzo corrente. Per dettagli, fonti ufficiali e requisiti dell’accesso al catalogo vedi [docs/COSICOMODO.md](docs/COSICOMODO.md).

**Storico e lingue:** sotto il carrello trovi **Storico delle spese**. Ogni confronto concluso salva una copia con data, prodotti, quantità, costi e market; aprendo una voce puoi consultare il totale e le righe di ciascun supermercato. In alto a destra, su tutte le pagine, trovi **🇮🇹 IT / 🇬🇧 EN**. La prima apertura è in italiano; la lingua scelta viene ricordata. Interfaccia, 384 prodotti, 24 categorie, schede dei prezzi, storico, aiuto, messaggi e demo sono disponibili anche in inglese. Cambiare lingua mantiene identici prodotti selezionati e importi.

Il pulsante principale **Componi la tua spesa** continua ad aprire subito i prodotti, con ricerca negozi in sottofondo. **Cerca supermercati** resta un piccolo comando facoltativo. Quattro zone rapide, Via Roma predefinita, raggio massimo 6 km e griglia 12/24 categorie rimangono disponibili.

I prezzi senza listino locale sono indicati come **Prezzo simulato**. Le 30 voci fondate sui riferimenti pubblici precedenti mantengono fonte e data di consultazione; le altre 354 hanno una **stima indicativa definita nel catalogo**, con data e metodo, senza attribuire a un sito prezzi che non sono stati rilevati. Le stime non sono una media di mercato e non confermano assortimento o disponibilità. Il simulatore usa gli stessi prodotti e categorie, con 8 negozi, prezzi e scorte fittizi per esercitare il confronto.

**Nessun feed prezzi locale è collegato.** La ricerca dei negozi e l’elenco parziale di 9 punti reali Eurospin/Lidl/Carrefour restano disponibili. Dove tutti i prezzi sono simulati si usa lo stesso riferimento per lo stesso prodotto nei diversi negozi e il risultato è una parità. Raggio 0,5–6 km, GPS con conferma e ritorno alla home restano presenti. Vedi `docs/CATALOGO.md` e `docs/PREZZI-SIMULATI.md`.

Il sito esistente deve ancora essere aggiornato con questi file su GitHub e Render; questa chat non ha distribuito la versione 1.8.0.

## Avvio

Richiede Node.js 24 o successivo. Nessuna dipendenza npm di esecuzione.

```bash
npm ci --ignore-scripts
npm start
```

Apri `http://localhost:3000`. Premi **Prova la demo**, poi **Prova una lista pronta** per esplorare subito il confronto. La demo funziona anche senza Internet. La ricerca indirizzi usa Photon; la ricerca cartografica usa Overpass di Private.coffee. L’elenco locale non richiede questi servizi, ma copre soltanto alcuni negozi del Cagliaritano.

```bash
npm run check
npm test
node scripts/build-demo.mjs
```

L’ultimo comando genera `dist/index.html`: una demo autonoma, apribile anche come file locale. Questa pagina non ha il backend: usa solo i dati fittizi.

## Cosa è implementato

- Storico automatico dei confronti, con copia dei dati della data salvata e dettagli per market; disponibile anche al riavvio nello stesso browser.
- Selettore IT/EN globale, italiano iniziale, preferenza ricordata; catalogo e contenuti interni tradotti.
- Percorso principale: zona → Componi la tua spesa → prodotti e quantità → Confronta la spesa.
- Quattro zone rapide; indirizzo vuoto = Via Roma. Per un indirizzo diverso si conferma il risultato geografico; GPS su richiesta e con conferma.
- Griglia di 12 categorie subito visibili, espandibile a 24, identica nella demo.
- Raggio da 0,5 a 6 km, con incrementi di 0,5 km e pulsanti +/− per aggiustamenti di 500 metri, espresso in **linea d’aria**. Non è una distanza stradale e non stima il tempo di viaggio.
- Ricerca reale di supermercati, discount e piccoli alimentari presenti in OpenStreetMap, compresi i negozi indipendenti. La copertura può essere incompleta; il fatto che un negozio esista sulla mappa non implica che il suo catalogo sia accessibile.
- Catalogo condiviso fra carrello e demo: 384 prodotti, 24 categorie, 16 prodotti per categoria. Il caricamento procede a gruppi di 24, con selettore e conteggi per categoria. Gli 8 negozi demo sono fittizi e filtrati per raggio; quattro liste pronte: veloce, settimana, casa e colazione.
- Categorie cliccabili, ricerca per prodotto e marca, selezione di confezioni e quantità da 1 a 99.
- Pulsante **Torna alla home** nelle pagine di lista e confronto; anche il logo e il passo 1 portano alla home. Il ritorno conserva la lista. Dalla home si può riprendere la demo o la lista già caricata.
- Lista salvata nel browser; pulsante per eliminare lista e zona.
- Elenco locale datato 17/10/2026 di 9 punti vendita reali di tre catene, con link alla scheda ufficiale e coordinate tratte dai link di indicazioni delle catene. Copertura parziale, nessun prezzo o scorta incluso.
- Errore del servizio mappa distinto da zero risultati: elenco locale quando presente, altrimenti numero di negozi non verificabile e pulsante per riprovare.
- Accesso diretto al carrello; elenco dei negozi consultabile separatamente. Se non ci sono negozi si può preparare la lista; il confronto richiede almeno un punto nel raggio.
- 384 prodotti generici sempre selezionabili. I 30 precedenti riferimenti pubblici restano distinguibili dalle 354 nuove stime indicative. Il catalogo non è presentato come assortimento delle catene.
- Prezzi simulati distinti da prezzi verificati in schede prodotto, carrello, totali, dettaglio, esportazione e stampa. Fonte e data consultabili.
- Confronto della lista e quantità per singolo negozio; riferimenti uguali fra negozi per lo stesso prodotto senza prezzi verificati.
- Totali calcolabili, verificati o stimati, ordinati dal più basso al più alto. Parità esplicita quando i valori sono uguali; ordinamento per distanza a parità di totale. Subtotali incompleti separati per copertura e importo. Il risparmio verificato non viene calcolato sulle stime.
- Stati distinti: disponibile, esaurito, quantità insufficiente, disponibilità sconosciuta, prezzo scaduto e prezzo simulato. Una stima non conferma la disponibilità. Esaurimenti e quantità insufficienti espliciti non vengono riempiti con stime.
- Dettaglio con quantità, prezzo, totale riga, fonte e data di osservazione. Un prezzo non verificato può essere sostituito nel calcolo da un riferimento distinto e marcato come simulato; il prezzo originale scaduto non viene aggiornato fittiziamente.
- Esportazione della lista in testo e stampa del confronto.
- Interfaccia desktop e mobile, tastiera, dialoghi nativi e movimento ridotto.
- Backend Node, validazione dei feed, cache temporanea, limiti alle richieste e destinazioni feed HTTPS validate.

## Pubblicare su GitHub e ottenere una URL pubblica

La chat non dispone di una connessione GitHub utilizzabile. Il sito iniziale è stato pubblicato manualmente dall’utente; per aggiornare quel sito segui AGGIORNAMENTO-CAGLIARI.txt. I passaggi sotto servono per una nuova installazione. I seguenti passaggi devono essere eseguiti con il proprio account. Non ci sono URL inventati nel progetto.

1. Crea un nuovo repository su GitHub e carica **il contenuto di questa cartella**, inclusa `.github`, mantenendo `package.json` alla radice. Puoi anche inizializzare la cartella con Git e collegarla al tuo repository:

   ```bash
   git init -b main
   git add .
   git commit -m "Add La mia spesa grocery comparison app"
   git remote add origin URL_DEL_TUO_REPOSITORY
   git push -u origin main
   ```

2. Per **l’app completa**, collega il repository a Render e crea un Blueprint usando `render.yaml`. In alternativa crea un Web Service Node: build `npm ci --ignore-scripts`, start `npm start`, health check `/api/health`. Il server ascolta su `0.0.0.0` e sulla porta `PORT`. Render assegna una URL HTTPS pubblica dopo il deploy. Verifica piano e costi nel tuo account prima di confermarli.
3. Per pubblicare **solo la demo**, su GitHub vai in Settings → Pages → Source: GitHub Actions, poi Actions → Publish demo on GitHub Pages → Run workflow. Il workflow mostra la URL risultante. GitHub Pages ospita la demo statica; per ricerca e feed server usa il deploy completo.
4. Verifica `/api/health`, la ricerca del tuo indirizzo e la disponibilità dei servizi esterni dall’ambiente di hosting. Aggiungi i feed descritti sotto per abilitare prezzi reali.

In alternativa è incluso un `Dockerfile`. Non inserire credenziali nel repository. Configura i feed come file privato o secret file dell’hosting e imposta `FEEDS_CONFIG` sul suo percorso; se la piattaforma non offre file riservati, usa un gestore di segreti o aggiungi un caricamento configurazione lato server adeguato.

## Collegare prezzi reali

**L’app non effettua scraping generico delle catene. Dove manca un prezzo locale verificato può usare un riferimento separato, indicato come simulato.** I siti possono richiedere selezione del punto vendita, sessione, indirizzo e accordi di accesso. Il solo HTML di un volantino non dimostra l’assortimento completo o le scorte attuali. Un feed è un catalogo JSON esposto da un fornitore; un’integrazione con un sito o un’API specifica deve trasformare quei dati nello schema descritto qui.

Per ogni catena da attivare occorrono un’API o un flusso dati utilizzabile, il negozio preciso, l’identificazione coerente dei prodotti, prezzi base accessibili a tutti e disponibilità effettiva. Collegare semplicemente il sito web del supermercato non soddisfa questi requisiti.

1. Copia `config/feeds.example.json` in `config/feeds.json`, oppure imposta `FEEDS_CONFIG` sul percorso del file privato. Sostituisci tutti i valori di esempio con dati reali. Il file di configurazione è escluso da Git.
2. Ogni configurazione individua **un singolo punto vendita fisico** con nome, indirizzo, coordinate ed eventualmente `osmId`, ad esempio `node/12345`. L’ID OSM permette di unire esattamente il feed al negozio sulla mappa. Senza ID il merge richiede stesso nome e distanza inferiore a 80 metri.
3. `url` deve essere HTTPS e il dominio deve comparire in `allowedHosts`. Aggiungi a questa lista anche il dominio delle pagine prodotto usate come fonte. Sono vietati destinazioni IP, credenziali nella URL, reti private e redirect.
4. Per autenticazione, `headersEnv` indica una variabile d’ambiente contenente un oggetto JSON di header, ad esempio `{"Authorization":"Bearer ..."}`. Le credenziali restano sul server. Non inserirle nel browser, nei sorgenti pubblici o nei file di esempio.
5. Esponi il catalogo secondo `config/catalog.example.json`. Il prezzo è un **intero in centesimi EUR**. `availability` è `in_stock`, `out_of_stock` o `unknown`. `observedAt` è una data ISO con fuso orario. `quantityAvailable` è facoltativo: ometterlo significa che il feed conferma la disponibilità, ma non fornisce la quantità massima. I feed che non confermano le scorte devono usare `unknown`.
6. Usa **lo stesso ID canonico per lo stesso identico prodotto/formato in tutti i feed**. Un identificativo EAN/GTIN validato e normalizzato dal tuo connettore è preferibile; è disponibile il campo `gtin`. La marca, il nome, il formato e l’eventuale GTIN devono coincidere per un ID. Un conflitto viene segnalato e l’offerta discordante esclusa. Non esiste un abbinamento fuzzy o una sostituzione automatica con sottomarche.
7. `sourceUrl` deve puntare alla fonte reale del prezzo nel punto vendita specificato. Ogni prezzo ha la propria data; il timeout di validità `maxAgeMinutes` è al massimo 1440 minuti. La cache di download dura 5 minuti e non rinnova la data del prezzo.
8. Le offerte con `conditions` diverso da `none` vengono escluse: tessere, coupon, multiacquisto e sconti personali devono essere normalizzati a un prezzo base non condizionato dal connettore. Il sistema non simula promozioni complesse.

Riavvia il server dopo le modifiche alla configurazione. Un catalogo invalido o irraggiungibile non viene sostituito da offerte inventate del negozio. Il catalogo generico e le stime restano distinti dalle offerte reali. Riferimenti pubblici e stime indicative sono distinti anche fra loro. Se un fornitore fallisce, gli altri possono continuare a essere confrontati, mostrando il problema al cliente.

## API

| Endpoint | Funzione |
| --- | --- |
| `GET /api/health` | Health check |
| `GET /api/status` | Capacità server e numero di negozi configurati |
| `GET /api/geocode?q=Cagliari` | Risultati geografici Photon filtrati per Italia |
| `GET /api/catalog?lat=39.2238&lon=9.1217&radius=3` | Negozi, prodotti e offerte dei feed in zona |
| `POST /api/compare` | Confronto con prezzi ricaricati dalla cache server o dal fornitore |

Il POST accetta `{ "lat": 39.2238, "lon": 9.1217, "radius": 3, "list": [{ "productId": "id-canonico", "quantity": 2 }] }`. Non accetta prezzi dal client. Risponde 409 se un prodotto non è più nel catalogo. Il catalogo contiene sia prodotti verificati dei feed sia prodotti generici con riferimenti esplicitamente simulati. `estimatedShopping: true` in `/api/status` segnala questa modalità. Prezzi inviati dal client non vengono utilizzati.

## Limiti pratici e messa in produzione

Questa è una prima versione funzionante, con predisposizione alle integrazioni. Nessun feed di prezzi dei punti vendita locali è stato attivato o verificato; i riferimenti pubblici del catalogo generico restano separati. Le API geografiche pubbliche non offrono una garanzia di disponibilità. Per traffico pubblico significativo, configura servizi geografici dedicati nel provider, monitoraggio, cache condivisa e limiti distribuiti. Il limite locale di 60 richieste API al minuto usa l’IP di connessione; con un reverse proxy può essere condiviso fra utenti. L’app non si fida automaticamente di header IP provenienti dal client.

Il server non salva gli indirizzi su disco e non stampa le URL di ricerca. La cache contiene temporaneamente coordinate e risultati. L’hosting o il reverse proxy possono invece conservare query e IP nei log: configura durata, accessi e informativa adeguati all’uso effettivo prima del lancio.

I totali coprono i soli articoli, escludono costi di viaggio e consegna e possono comprendere prezzi verificati e riferimenti simulati, esplicitamente distinti. Non garantiscono che il prezzo sullo scaffale sia uguale. Il raggio geografico non garantisce che il negozio sia raggiungibile su strada entro lo stesso numero di chilometri.

## Verifica dell’interfaccia

I test Node non richiedono Internet e verificano prezzi, scorte, validazione, fonti e API. È incluso anche `scripts/ui-check.mjs` per test reali nel browser, eseguibile dopo l’installazione facoltativa di Playwright e Chromium, con il server già avviato:

```bash
npm install --no-save --package-lock=false playwright@1.62.1
npx playwright install chromium --only-shell
node scripts/ui-check.mjs
```

È incluso il workflow manuale **Browser checks** su GitHub Actions, che installa il browser, esegue lo stesso script e raccoglie le schermate in un artifact. I controlli browser non sono stati eseguiti in questa sessione; vedi `VALIDAZIONE.md`.

## Fonti e documentazione

- [Conad — catalogo e verifica zona per costi e disponibilità](https://spesaonline.conad.it/tutti-i-prodotti)
- [Photon — server pubblico e limiti d’uso](https://github.com/komoot/photon)
- [OpenStreetMap / Overpass — API e istanze pubbliche](https://wiki.openstreetmap.org/wiki/Overpass_API)
- [Private.coffee — istanza Overpass e condizioni](https://overpass.private.coffee/)
- [Attribuzione OpenStreetMap](https://www.openstreetmap.org/copyright)
- [GitHub — pubblicazione con Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Render — Web Services](https://render.com/docs/web-services)
- [Render — Blueprint YAML](https://render.com/docs/blueprint-spec)

I nomi dei prodotti dimostrativi identificano esempi di selezione, non partnership. Le immagini sono illustrazioni SVG indicative create per questa app; non riproducono fotografie delle confezioni. I negozi della demo sono immaginari.

## Ricerca indirizzi: correzione 1.1.1

Photon viene interrogato senza forzare una lingua: il nome locale può essere restituito senza quel parametro. Eventuali errori non diventano una posizione inventata e non vengono conservati in cache. Le quattro zone rapide non usano il servizio di geocodifica e indicano punti pubblici del centro. Se l’indirizzo è vuoto si sceglie Via Roma; un indirizzo personalizzato non trovato non viene sostituito da Via Roma. I suggerimenti con identica etichetta vengono deduplicati; numeri civici diversi restano distinti; “Usa la mia posizione” usa invece le coordinate consentite dal browser. Entrambi tentano la ricerca dei negozi tramite Overpass; in caso di errore vengono mostrati i punti dell’elenco locale compresi nel raggio, quando presenti.

Per usare una propria istanza Photon compatibile, imposta PHOTON_SEARCH_URL sull’endpoint HTTPS di ricerca nella configurazione del server. Non è una URL ricevuta dal browser. I log della ricerca fallita riportano solo tipo di errore e stato HTTP, senza indirizzo o URL completa.

Documentazione: https://github.com/komoot/photon/blob/master/docs/api-v1.md


## Ricerca negozi: correzione 1.2.0

Il servizio Overpass predefinito è `https://overpass.private.coffee/api/interpreter`. Timeout e risposte incomplete generano uno stato di errore, non una falsa ricerca riuscita con zero negozi. Dopo un guasto il server attende 30 secondi prima di ritentare lo stesso servizio; le ricerche riuscite sono in cache per 15 minuti. L’elenco locale viene filtrato per distanza e integrato evitando duplicati vicini della stessa catena.

Per un’istanza dedicata, configura `OVERPASS_SEARCH_URL` con un endpoint HTTPS compatibile. Il provider usa POST; passa a GET solo se il server risponde 405 o 501. I log non includono l’indirizzo o le coordinate cercate. Un servizio cartografico pubblico non garantisce disponibilità né copertura completa.


## Prezzi simulati: comportamento 1.3.0

Il catalogo condiviso è in `public/catalog.mjs`, riesportato dal server: 384 articoli. Le 30 voci iniziali si basano sulle 16 osservazioni pubbliche Conad consultate il 17/10/2026; le 354 nuove voci hanno stime indicative definite nel catalogo, con origine `editorial`, data di definizione e nessuna URL di prezzo inventata. I valori si riferiscono a prodotti comparabili online, non ai negozi Eurospin/Lidl trovati sulla mappa. Per formati diversi viene indicata la proporzione usata; non si assume che il prezzo reale di un multipacco sia la somma dei pezzi. Nessun aggiornamento automatico delle osservazioni è attivo e la data non viene rinnovata da una visita o da un riavvio.

Per prodotti esatti provenienti da feed, `server/shopping.mjs` può ricavare un riferimento dal valore centrale dei prezzi validi disponibili per lo stesso ID. Se non esiste un riferimento attendibile per un prodotto specifico, il prezzo resta non calcolabile; non si assegna un prezzo arbitrario a un articolo non riconosciuto.

In `compareBasket`, `complete` continua a significare disponibilità e prezzi tutti verificati. `priceComplete` significa che tutte le righe hanno un importo, anche se simulato. `simulatedCount`, `simulatedTotalCents`, `verifiedTotalCents` e lo stato `estimated` espongono la differenza. Gli esaurimenti espliciti e le quantità insufficienti non vengono sostituiti da stime. I dati della demo restano fittizi e separati dal catalogo di riferimento.

## Localizzazione 1.3.0

Il browser riceve `enableHighAccuracy: true`, `maximumAge: 0` e timeout di 20 secondi. Prima della ricerca dei negozi vengono mostrati coordinate, precisione dichiarata e collegamento per controllare il punto sulla mappa. La conferma non rende il punto infallibile: su alcuni dispositivi la posizione può essere molto approssimativa. L’app lo segnala rispetto al raggio scelto e permette di rilevare di nuovo o scrivere via, numero e città. Errori di permesso, disponibilità e timeout hanno messaggi distinti. Non viene attribuito un indirizzo fittizio alle coordinate GPS.


## Catalogo condiviso 1.4.0

`public/catalog.mjs` è la fonte comune di categorie, ID, descrizioni, formati e riferimenti. `public/demo.mjs` aggiunge soltanto i negozi e le loro offerte fittizie; `server/shopping.mjs` integra eventuali prodotti e offerte dei feed. Senza feed, nomi, formati, categorie e ID dei 384 prodotti coincidono esattamente nelle due modalità, mentre i prezzi del simulatore restano esempi.

La prima pagina contiene un prodotto per ciascuna delle 24 categorie e “Mostra altri prodotti” amplia la selezione. Il menu categorie permette di raggiungerle tutte anche da mobile. Le vecchie 96 selezioni demo hanno un percorso di migrazione agli esempi generici nuovi: le quantità rimangono, eventuali righe confluenti si sommano fino a 99. Questa migrazione riguarda solo dati demo; non sostituisce articoli di marca provenienti da feed reali. La lista del confronto accetta fino a 500 prodotti distinti, così comprende l’intero catalogo di 384 articoli.


## Navigazione 1.6.0

Il pulsante Componi la tua spesa è l’unico pulsante verde del form. Cerca supermercati è presentato come testo secondario. Il form distingue la destinazione tramite il pulsante premuto: catalog per il carrello, stores per l’elenco informativo. Il risultato geografico mantiene quella destinazione. La conferma GPS e il cambio zona portano ai prodotti. La ricerca facoltativa dei negozi conserva il comando per proseguire al carrello. Il carrello è compilabile anche quando le fonti non individuano negozi: il confronto si abilita solo quando ce n’è almeno uno nel raggio. Non sono stati collegati nuovi feed prezzi. Il negozio Carrefour Express di via Manno 10 è stato aggiunto all’elenco datato di riserva per coprire anche la nuova partenza Via Roma, rispettando il raggio minimo di 500 metri. Fonti dei punti rapidi in docs/CAGLIARI.md.


Il browser importa il catalogo condiviso e apre la pagina prodotti immediatamente per le zone rapide, il campo vuoto o un indirizzo già confermato. Un indirizzo nuovo richiede la scelta del risultato geografico. La ricerca negozi ha un identificativo separato dalle altre operazioni: risposte vecchie non sovrascrivono una zona nuova, la demo o i dati eliminati. Quantità e nuovi prodotti scelti durante la ricerca si conservano. Eventuali articoli di feed salvati e ancora non riconosciuti restano in attesa fino alla risposta, senza essere eliminati all’apertura del catalogo. Finché la ricerca non termina, il confronto è disabilitato. Un errore della ricerca non riporta alla home e consente un tentativo successivo.

La demo autonoma apre la home e il pulsante Componi la tua spesa funziona senza richieste di rete. In fondo alla pagina compare v1.8.0; la stessa versione è restituita da /api/status per il server. I riferimenti agli asset nella pagina includono la versione per rinnovare le risorse dopo l’aggiornamento.

Il nuovo ZIP ha package.json, public, server e dist direttamente alla radice. Dopo averlo estratto, carica quei file e cartelle nella radice del repository esistente. Non serve creare un’altra cartella spesina nel repository.


## Storico e italiano/inglese

Le spiegazioni di funzionamento, conservazione e traduzione sono in `docs/STORICO-E-LINGUE.md`. Lo storico parte dai confronti eseguiti dopo questo aggiornamento: le vecchie versioni non conservavano questi dati. Registra confronti, senza attestare un acquisto. Sono mantenuti fino a 50 confronti recenti entro il budget di spazio del browser. Lo storico e la preferenza della lingua restano nel browser del dispositivo, senza account o invii al server.

`public/catalog-en.mjs` contiene traduzioni esplicite di tutte le descrizioni e categorie. `public/messages-en.mjs` raccoglie messaggi e contenuti dell’interfaccia. `public/i18n.mjs` localizza testo, accessibilità, numeri e date, conservando gli identificativi, gli indirizzi dei link e i valori digitati. La ricerca riconosce nomi di prodotti in entrambe le lingue. Il testo delle illustrazioni prodotto segue la lingua scelta. Nomi propri di insegne e indirizzi mantengono il loro significato originale.

`public/history.mjs` crea copie indipendenti dei confronti, legge e valida i dati conservati, limita lo spazio e gestisce i duplicati immediati. Nessun nuovo prezzo locale è stato collegato da queste funzioni. Le stime mantengono l’etichetta Prezzo simulato / Simulated price.
