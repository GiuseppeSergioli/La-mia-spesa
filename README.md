# Spesina

Un’app in italiano per comporre una lista per categorie e confrontare quanto costa acquistare **gli stessi prodotti, nelle stesse quantità e nello stesso formato**, presso i supermercati vicini.

**Stato della consegna:** codice eseguibile e demo pronti. Nessun repository remoto e nessun sito pubblico sono stati creati da questa sessione. Nessuna catena è attualmente collegata a un feed di prezzi. La demo usa cinque negozi fittizi, 24 prodotti illustrati e prezzi interamente inventati. Il backend implementa la ricerca geografica e l’importazione di feed per punto vendita, ma le integrazioni con cataloghi di catene reali vanno configurate e verificate con i rispettivi fornitori.

## Avvio

Richiede Node.js 24 o successivo. Nessuna dipendenza npm di esecuzione.

```bash
npm ci --ignore-scripts
npm start
```

Apri `http://localhost:3000`. Premi **Prova la demo**, poi **Usa una lista d’esempio** per esplorare subito il confronto. La demo funziona anche senza Internet. La ricerca geografica reale richiede una connessione dal server a Photon e Overpass.

```bash
npm run check
npm test
node scripts/build-demo.mjs
```

L’ultimo comando genera `dist/index.html`: una demo autonoma, apribile anche come file locale. Questa pagina non ha il backend: usa solo i dati fittizi.

## Cosa è implementato

- Indirizzo con scelta esplicita del risultato geografico, oppure geolocalizzazione su consenso.
- Raggio da 1 a 25 km, espresso in **linea d’aria**. Non è una distanza stradale e non stima il tempo di viaggio.
- Ricerca reale dei supermercati presenti in OpenStreetMap. La copertura può essere incompleta; il fatto che un negozio esista sulla mappa non implica che il suo catalogo sia accessibile.
- Categorie cliccabili, ricerca per prodotto e marca, selezione di confezioni e quantità da 1 a 99.
- Lista salvata nel browser; pulsante per eliminare lista e zona.
- Prezzo minimo indicativo nel catalogo e confronto della lista completa per singolo negozio.
- Totali completi ordinati dal più basso al più alto; liste incomplete in una sezione separata, per copertura e poi subtotale. Nessun risparmio calcolato confrontando un subtotale con una lista completa.
- Stati distinti: disponibile, esaurito, quantità insufficiente, disponibilità sconosciuta e prezzo scaduto.
- Dettaglio con quantità, prezzo, totale riga, fonte e data di osservazione. Un prezzo vecchio o non verificato non entra nel totale.
- Esportazione della lista in testo e stampa del confronto.
- Interfaccia desktop e mobile, tastiera, dialoghi nativi e movimento ridotto.
- Backend Node, validazione dei feed, cache temporanea, limiti alle richieste e destinazioni feed HTTPS validate.

## Pubblicare su GitHub e ottenere una URL pubblica

Le connessioni GitHub e hosting non erano utilizzabili nella sessione di creazione. I seguenti passaggi devono essere eseguiti con il proprio account. Non ci sono URL inventati nel progetto.

1. Crea un nuovo repository su GitHub e carica **il contenuto di questa cartella**, inclusa `.github`, mantenendo `package.json` alla radice. Puoi anche inizializzare la cartella con Git e collegarla al tuo repository:

   ```bash
   git init -b main
   git add .
   git commit -m "Add Spesina grocery comparison app"
   git remote add origin URL_DEL_TUO_REPOSITORY
   git push -u origin main
   ```

2. Per **l’app completa**, collega il repository a Render e crea un Blueprint usando `render.yaml`. In alternativa crea un Web Service Node: build `npm ci --ignore-scripts`, start `npm start`, health check `/api/health`. Il server ascolta su `0.0.0.0` e sulla porta `PORT`. Render assegna una URL HTTPS pubblica dopo il deploy. Verifica piano e costi nel tuo account prima di confermarli.
3. Per pubblicare **solo la demo**, su GitHub vai in Settings → Pages → Source: GitHub Actions, poi Actions → Publish demo on GitHub Pages → Run workflow. Il workflow mostra la URL risultante. GitHub Pages ospita la demo statica; per ricerca e feed server usa il deploy completo.
4. Verifica `/api/health`, la ricerca del tuo indirizzo e la disponibilità dei servizi esterni dall’ambiente di hosting. Aggiungi i feed descritti sotto per abilitare prezzi reali.

In alternativa è incluso un `Dockerfile`. Non inserire credenziali nel repository. Configura i feed come file privato o secret file dell’hosting e imposta `FEEDS_CONFIG` sul suo percorso; se la piattaforma non offre file riservati, usa un gestore di segreti o aggiungi un caricamento configurazione lato server adeguato.

## Collegare prezzi reali

**L’app non effettua scraping generico delle catene e non inventa prezzi quando il catalogo manca.** I siti possono richiedere selezione del punto vendita, sessione, indirizzo e accordi di accesso. Il solo HTML di un volantino non dimostra l’assortimento completo o le scorte attuali. Un feed è un catalogo JSON esposto da un fornitore; un’integrazione con un sito o un’API specifica deve trasformare quei dati nello schema descritto qui.

Per ogni catena da attivare occorrono un’API o un flusso dati utilizzabile, il negozio preciso, l’identificazione coerente dei prodotti, prezzi base accessibili a tutti e disponibilità effettiva. Collegare semplicemente il sito web del supermercato non soddisfa questi requisiti.

1. Copia `config/feeds.example.json` in `config/feeds.json`, oppure imposta `FEEDS_CONFIG` sul percorso del file privato. Sostituisci tutti i valori di esempio con dati reali. Il file di configurazione è escluso da Git.
2. Ogni configurazione individua **un singolo punto vendita fisico** con nome, indirizzo, coordinate ed eventualmente `osmId`, ad esempio `node/12345`. L’ID OSM permette di unire esattamente il feed al negozio sulla mappa. Senza ID il merge richiede stesso nome e distanza inferiore a 80 metri.
3. `url` deve essere HTTPS e il dominio deve comparire in `allowedHosts`. Aggiungi a questa lista anche il dominio delle pagine prodotto usate come fonte. Sono vietati destinazioni IP, credenziali nella URL, reti private e redirect.
4. Per autenticazione, `headersEnv` indica una variabile d’ambiente contenente un oggetto JSON di header, ad esempio `{"Authorization":"Bearer ..."}`. Le credenziali restano sul server. Non inserirle nel browser, nei sorgenti pubblici o nei file di esempio.
5. Esponi il catalogo secondo `config/catalog.example.json`. Il prezzo è un **intero in centesimi EUR**. `availability` è `in_stock`, `out_of_stock` o `unknown`. `observedAt` è una data ISO con fuso orario. `quantityAvailable` è facoltativo: ometterlo significa che il feed conferma la disponibilità, ma non fornisce la quantità massima. I feed che non confermano le scorte devono usare `unknown`.
6. Usa **lo stesso ID canonico per lo stesso identico prodotto/formato in tutti i feed**. Un identificativo EAN/GTIN validato e normalizzato dal tuo connettore è preferibile; è disponibile il campo `gtin`. La marca, il nome, il formato e l’eventuale GTIN devono coincidere per un ID. Un conflitto viene segnalato e l’offerta discordante esclusa. Non esiste un abbinamento fuzzy o una sostituzione automatica con sottomarche.
7. `sourceUrl` deve puntare alla fonte reale del prezzo nel punto vendita specificato. Ogni prezzo ha la propria data; il timeout di validità `maxAgeMinutes` è al massimo 1440 minuti. La cache di download dura 5 minuti e non rinnova la data del prezzo.
8. Le offerte con `conditions` diverso da `none` vengono escluse: tessere, coupon, multiacquisto e sconti personali devono essere normalizzati a un prezzo base non condizionato dal connettore. Il sistema non simula promozioni complesse.

Riavvia il server dopo le modifiche alla configurazione. Un catalogo invalido o irraggiungibile non viene sostituito con dati di esempio. Se un fornitore fallisce, gli altri possono continuare a essere confrontati, mostrando il problema al cliente.

## API

| Endpoint | Funzione |
| --- | --- |
| `GET /api/health` | Health check |
| `GET /api/status` | Capacità server e numero di negozi configurati |
| `GET /api/geocode?q=Milano` | Risultati geografici Photon filtrati per Italia |
| `GET /api/catalog?lat=45.4642&lon=9.19&radius=5` | Negozi, prodotti e offerte dei feed in zona |
| `POST /api/compare` | Confronto con prezzi ricaricati dalla cache server o dal fornitore |

Il POST accetta `{ "lat": 45.4642, "lon": 9.19, "radius": 5, "list": [{ "productId": "id-canonico", "quantity": 2 }] }`. Non accetta prezzi dal client. Risponde 409 se un prodotto non è più nel catalogo. Il catalogo in memoria non contiene dati di listini non collegati.

## Limiti pratici e messa in produzione

Questa è una prima versione funzionante, con predisposizione alle integrazioni. Nessun collegamento a prezzi di supermercati reali è stato attivato o verificato. Le API geografiche pubbliche non offrono una garanzia di disponibilità. Per traffico pubblico significativo, configura servizi geografici dedicati nel provider, monitoraggio, cache condivisa e limiti distribuiti. Il limite locale di 60 richieste API al minuto usa l’IP di connessione; con un reverse proxy può essere condiviso fra utenti. L’app non si fida automaticamente di header IP provenienti dal client.

Il server non salva gli indirizzi su disco e non stampa le URL di ricerca. La cache contiene temporaneamente coordinate e risultati. L’hosting o il reverse proxy possono invece conservare query e IP nei log: configura durata, accessi e informativa adeguati all’uso effettivo prima del lancio.

I totali coprono i soli articoli, escludono costi di viaggio e consegna e si riferiscono ai prezzi online forniti. Non garantiscono che il prezzo sullo scaffale sia uguale. Il raggio geografico non garantisce che il negozio sia raggiungibile su strada entro lo stesso numero di chilometri.

## Verifica dell’interfaccia

I test Node non richiedono Internet e verificano prezzi, scorte, validazione, fonti e API. È incluso anche `scripts/ui-check.mjs` per test reali nel browser, eseguibile dopo l’installazione facoltativa di Playwright e Chromium, con il server già avviato:

```bash
npm install --no-save playwright
npx playwright install chromium --only-shell
node scripts/ui-check.mjs
```

## Fonti e documentazione

- [Conad — catalogo e verifica zona per costi e disponibilità](https://spesaonline.conad.it/tutti-i-prodotti)
- [Photon — server pubblico e limiti d’uso](https://github.com/komoot/photon)
- [OpenStreetMap / Overpass — API e istanze pubbliche](https://wiki.openstreetmap.org/wiki/Overpass_API)
- [Attribuzione OpenStreetMap](https://www.openstreetmap.org/copyright)
- [GitHub — pubblicazione con Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Render — Web Services](https://render.com/docs/web-services)
- [Render — Blueprint YAML](https://render.com/docs/blueprint-spec)

I nomi dei prodotti dimostrativi identificano esempi di selezione, non partnership. Le immagini sono illustrazioni SVG indicative create per questa app; non riproducono fotografie delle confezioni. I negozi della demo sono immaginari.
