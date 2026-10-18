# Logo e app installabile — versione 1.10.0

## Logo

Il simbolo rappresenta una borsa verde con una foglia e un’apertura curva che richiama un sorriso. I colori riprendono il verde bosco e i toni chiari dell’interfaccia. Nella home il simbolo è affiancato al nome dell’app; compare anche nell’intestazione, nel pulsante di installazione e nelle icone del telefono.

File nel progetto:

- `public/assets/logo-original.png`: originale ad alta risoluzione, con trasparenza.
- `public/assets/logo.png`: versione leggera per il sito, 256 × 256.
- `public/assets/favicon.png`: icona del browser, 48 × 48.
- `public/assets/apple-touch-icon.png`: icona Apple, 180 × 180.
- `public/assets/icon-192.png` e `icon-512.png`: icone dell’app.
- `public/assets/icon-maskable-512.png`: variante con margini di sicurezza per i ritagli delle icone Android.

Il logo è stato creato con la skill **imagegen**, usando il generatore integrato. Le esportazioni nei formati delle icone derivano dallo stesso originale, senza cambiare disegno. Specifica usata per il logo finale:

> Refine this same logo symbol for production. Preserve the shopping-bag silhouette, handle, smile-shaped negative space at the top, leaf placement and clean transparent background. Make a precise flat vector-like version: the entire lower bag body must be an unbroken perfectly solid opaque forest green #214f3f. Remove the unwanted irregular transparent hole in the lower bag body and all fuzzy texture, gradients, lighting, ghosting and shading. The leaf must be a single solid fresh sage-lime colour #a4c64a with one sharp intentional vein cutout only. Sharp anti-aliased clean edges. Exactly two flat opaque colours plus genuine transparency outside the logo and inside intentional handle/smile gaps. No text, no extra detail, no border or shadow. Keep the complete icon centred with safe empty margins for a mobile app icon.

## Installazione dal sito completo

Caricare questo aggiornamento su GitHub e distribuire il servizio Render esistente. Aprire **la URL HTTPS del sito completo** dal telefono. Non serve creare un’altra applicazione su Render.

La home mostra **Scarica l’app** in basso a destra. Il pulsante scompare quando l’app è già aperta in modalità installata e si nasconde mentre si compila un campo, per lasciare spazio alla tastiera.

- **Android con browser compatibile:** quando il browser rende disponibile l’installazione, il pulsante avvia la sua conferma. In alternativa mostra i passaggi per il menu del browser. Nelle versioni correnti di Chrome: menu ⋮ → **Installa e crea scorciatoia → Installa**; altre versioni possono usare **Aggiungi a schermata Home** o **Installa app**.
- **iPhone e iPad:** aprire il sito in Safari, scegliere **Condividi → Aggiungi alla schermata Home**, abilitare **Apri come app web** quando presente e confermare **Aggiungi**. L’app non può saltare la conferma richiesta dal sistema.
- **Browser interni ad altre app:** la guida suggerisce di aprire il sito nel browser del telefono.
- **Altri browser/sistemi:** l’installazione dipende dalle capacità del browser. Quando non è disponibile, il sito rimane utilizzabile. Non è possibile garantire installazione e comportamento identici su ogni dispositivo o vecchia versione di sistema.

Il risultato è una **Progressive Web App (PWA)**, aperta dalla schermata Home con il logo e le stesse pagine del sito, in una finestra autonoma dove il sistema lo supporta. La versione non include pacchetti APK/IPA o pubblicazioni su store. Le istruzioni e i messaggi sono disponibili in italiano e inglese. La demo autonoma contiene il logo e la guida, ma richiede il sito completo per l’installazione.

## Funzioni, dati e connessione

Le funzioni del sito restano disponibili: ricerca, carrello, confronto, storico con cancellazione singola, lingua ed esportazione. Sui browser privi di stampa, il comando stampa esporta la lista in testo.

Dopo una prima apertura online e la preparazione riuscita dei file dell’app, si può riaprire l’interfaccia, comporre la lista con il catalogo condiviso, usare la demo e consultare lo storico già salvato anche offline. **Ricerca dei negozi, nuovi prezzi, confronto dal server e shop dei supermercati richiedono Internet.** Un avviso segnala quando manca la connessione. Nessun vecchio prezzo viene presentato come nuovo per far funzionare il confronto offline.

Lista, lingua e storico restano nei dati locali del browser o dell’app. Gli aggiornamenti non eliminano queste chiavi. Browser diversi, dispositivi diversi e alcuni ambienti installati possono mantenere archivi separati; non è stata aggiunta una sincronizzazione o un trasferimento automatico dello storico. Eliminare i dati del sito o dell’app può eliminare lo storico.

## Cache e aggiornamenti

Il service worker `public/sw.js` memorizza esclusivamente i file statici: HTML, CSS, moduli, logo e icone. **Non memorizza API, indirizzi, risultati di geolocalizzazione, listini o risposte al confronto.** La cache ha un nome specifico dell’app e una versione. Le cache di altre applicazioni non vengono cancellate.

Un aggiornamento preparato mostra **Aggiorna**. Il comando conserva la lista nel browser, attiva la nuova versione e ricarica la pagina una sola volta. Non cancella lo storico. Il file worker va aggiornato insieme a `public/version.mjs`; i test verificano che le versioni coincidano e che tutti i file da conservare siano presenti.

## Verifiche e limiti del collaudo

**146 test Node superati** nell’aggiornamento: comprendono le funzioni precedenti e nuovi controlli per guide iPhone/iPad/Android, installazione su richiesta, annullamento/errori, impostazioni del service worker, aggiornamenti, cache offline, esclusione delle API, dimensioni reali delle icone e risposte HTTP dei file necessari. Questi controlli usano simulazioni delle API del browser.

Sono presenti anche `scripts/ui-check.mjs` e `scripts/pwa-check.mjs`, richiamati dal workflow manuale **Browser checks**. Quest’ultimo prepara controlli in Chromium per logo e pulsante a larghezze 320–1440 px, riapertura offline, catalogo e storico. **Non sono stati eseguiti in questa sessione: Chromium non è disponibile nell’ambiente.** Non sono state eseguite installazioni su telefoni fisici, prove su Safari reale o test di tutte le combinazioni dispositivo/sistema. Prima di dichiarare compatibilità certificata occorrono queste verifiche sul sito pubblicato.

## Fonti ufficiali per l’installazione

- [Apple — utilizzare un sito web come app su iPhone](https://support.apple.com/it-it/guide/iphone/iphea86e5236/ios)
- [Google Chrome — usare e installare app web su Android](https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DAndroid&hl=it)
- [MDN — avviare l’installazione da una PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt)
