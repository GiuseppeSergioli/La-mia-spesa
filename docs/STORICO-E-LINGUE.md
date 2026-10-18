# Storico e lingue — versione 1.7.0

## Storico delle spese

Il pulsante sotto il carrello apre l’elenco dei confronti conclusi. Si può accedere allo storico anche dal collegamento nel piè di pagina. Ogni confronto registra data e ora, zona e raggio, prodotti e quantità, supermercati, prezzi unitari, costi riga e totali. Aprendo una voce puoi scegliere uno dei market per vedere il dettaglio di quella spesa.

La copia è indipendente dal catalogo corrente: riaprire la demo, cambiare quantità o ottenere nuovi prezzi non modifica il passato. Gli esaurimenti e i prezzi mancanti restano distinti dagli importi pari a zero; i subtotali rimangono segnalati. Le voci demo sono riconoscibili. I prezzi simulati mantengono l’etichetta e non diventano prezzi verificati.

Le voci sono salvate automaticamente quando un confronto termina con successo. Un tentativo fallito non crea una spesa. Due confronti identici entro due minuti vengono accorpati; un confronto uguale fatto più tardi può creare un’altra voce. Lo storico registra confronti, non acquisti confermati.

Lo storico inizia con questa versione: le vecchie versioni non avevano salvato confronti e non è possibile ricostruire date, market e prezzi passati dalla sola lista presente.

## Conservazione

I dati restano nel localStorage di questo browser, chiave la-mia-spesa:history:v1, senza account o sincronizzazione tra dispositivi. Sono conservati fino a 50 confronti recenti entro un budget di 750.000 caratteri JSON; se occorre spazio si eliminano prima le voci più vecchie. Se il browser impedisce la scrittura, il confronto funziona comunque e viene segnalato il mancato salvataggio.

Il comando Svuota storico richiede una conferma e conserva il carrello. La cancellazione di zona, lista e storico dalla finestra Privacy elimina anche i confronti. Cancellare i dati del sito dal browser elimina i dati locali. Le date vengono mostrate nel fuso orario del browser, partendo dall’istante ISO salvato.

## Italiano e inglese

Le bandiere 🇮🇹 IT e 🇬🇧 EN sono nell’angolo superiore destro della home e delle altre pagine. La prima apertura usa l’italiano. La scelta viene conservata nella chiave la-mia-spesa:language:v1 e riutilizzata alle visite successive.

Sono tradotti categorie, descrizioni dei 384 prodotti, indicazioni dei formati, etichette nelle illustrazioni, carrello, confronto, storico, spiegazioni dei prezzi, aiuto, privacy, errori dell’app ed esportazione. La ricerca riconosce sia i nomi italiani sia quelli inglesi. Gli identificativi dei prodotti, le quantità e i centesimi rimangono gli stessi.

Il nome dell’app La mia spesa e i nomi propri delle insegne restano riconoscibili. I collegamenti alle fonti e agli indirizzi originali vengono conservati. Il cambio di lingua riguarda la visualizzazione e non modifica i dati dello storico o la scelta dei prodotti.

## Verifica

122 test automatici superati nella versione 1.7.0: comprendono copertura completa delle descrizioni del catalogo, ricerca bilingue, valuta, testo delle illustrazioni, aggiornamento delle finestre interne, mantenimento delle quantità, date e importi salvati, riapertura dello storico, lingua ricordata e demo autonoma. Il controllo delle funzioni usa un DOM simulato e non sostituisce un collaudo visuale su Safari o sul dispositivo dell’utente. Il controllo Playwright facoltativo include anche lingua inglese e storico a diverse larghezze, ma non è stato eseguito qui.
