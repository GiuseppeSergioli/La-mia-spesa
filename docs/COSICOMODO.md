# CosìComodo e prezzi online — verifica del 18 ottobre 2026

## Cosa è verificato

Pan usa CosìComodo come canale ufficiale per la spesa online. È presente lo shop **IPERPAN — CAGLIARI VIALE LA PLAIA**, il cui header indica il **ritiro in punto vendita**. Il collegamento per la consegna a domicilio presente sul sito istituzionale passa invece da una selezione di copertura: il ritiro e la consegna non vanno considerati un unico listino o un unico servizio disponibile a ogni indirizzo.

Le condizioni CosìComodo precisano che il catalogo generale non mostra prezzi: questi sono nei siti delle insegne e possono cambiare per punto vendita, assortimento, promozione e canale online/fisico. Le condizioni Pan descrivono inoltre prezzi ordinari e prezzi riservati ai possessori di carta.

Nei risultati indicizzati sono state trovate pagine prodotto e selezioni Pan con prezzi. Le letture delle pagine attuali non hanno restituito un listino aggiornato completo; alcune non mostrano i prodotti o restituiscono “nessun risultato”. I valori indicizzati dal motore di ricerca non provano il prezzo attuale. **Nessuno di quei prezzi è stato importato come prezzo reale nell’app.**

Non è stata trovata un’API pubblica documentata per listini e trasferimento carrelli. Questo non dimostra che Pan/Selex non possieda un’integrazione riservata ai partner. Un’estrazione delle pagine può essere tecnicamente valutata se i dati sono accessibili e l’uso è consentito; in questa verifica non ne è stato validato un flusso aggiornabile affidabile. Non è stato aggiunto un connettore che indovini endpoint, prezzi, disponibilità o sessioni.

Il link promozionale proposto inizialmente riguarda un’iniziativa valida dal 4 al 17 maggio 2026: non è stato usato come sconto corrente.

## Cosa fa la versione 1.8.0

- Nel confronto, i market con collegamento online mostrano un’azione dedicata.
- Per La Plaia, se il negozio è individuato nelle fonti geografiche, **Acquista online** apre un riepilogo con lo shop preciso e l’indicazione del ritiro. Il raggio massimo resta 6 km; non vengono aggiunte coordinate ipotetiche per far comparire il negozio.
- Per collegamenti generici di catena, **Verifica spesa online** chiede di scegliere il negozio e controllare la copertura. Non promette il servizio nel negozio fisico mostrato.
- La lista promemoria è scaricabile con quantità, marca, nome, formato e, quando presente, EAN. Non riporta prezzi simulati come preventivo d’ordine.
- Il carrello deve essere composto sul sito del supermercato. Non esiste un trasferimento automatico della lista da La mia spesa a CosìComodo. Prezzi, costi di servizio, disponibilità, ordine e pagamento vengono confermati sul sito del commerciante.
- La demo mostra questo percorso con negozi fittizi, senza aprire shop reali o inviare ordini. Le nuove finestre e la lista scaricabile sono disponibili in italiano e inglese.
- Storico, catalogo di 384 prodotti e distinzione fra prezzi simulati e verificati restano disponibili. Il collegamento allo shop non aumenta il numero dei cataloghi prezzi connessi.

## Accesso necessario per collegare prezzi veri

Il percorso preferibile è ottenere dal gestore **Pan/Superemme o Selex/CosìComodo** un accesso al catalogo del punto vendita, tramite API o esportazione JSON/CSV aggiornata. Il contatto commerciale ufficiale CosìComodo rinvia al form sul sito Selex; non è stata inviata alcuna comunicazione da questa chat.

Per costruire e verificare il connettore servono:

1. Identificativo del negozio e del servizio (per esempio La Plaia, ritiro), indirizzo e coordinate verificati, associazione al punto fisico in mappa.
2. Catalogo con EAN/GTIN, marca, nome, formato esatto e categoria. I prodotti generici dell’app non possono essere associati automaticamente a una confezione di marca differente.
3. Prezzo ordinario IVA inclusa, disponibilità dichiarata, quantità acquistabili quando note, data e scadenza dell’osservazione, URL della fonte.
4. Separazione di carta fedeltà, coupon, promozioni condizionate, prodotti a peso variabile e costi/minimi del servizio. Il totale attuale dell’app riguarda i prodotti e non è un preventivo di consegna.
5. Modalità di aggiornamento e limiti di accesso. Una lettura fallita non deve rinnovare la data dell’ultimo prezzo né dichiarare esaurito un prodotto non osservato.
6. Per un futuro trasferimento del carrello: un endpoint o un collegamento ufficiale che accetti prodotti e quantità; la funzione liste presente all’interno di CosìComodo non dimostra un’API utilizzabile da app esterne.

Il backend supporta già feed per singolo negozio: `config/feeds.example.json` e `config/catalog.example.json` definiscono il contratto. L’integrazione deve trasformare il catalogo fornito in quello schema, mantenere credenziali sul server e usare gli stessi ID canonici per prodotti/formati identici nei diversi market. Quando un feed reale è disponibile, l’app dà priorità alle sue offerte valide e conserva fonte e data; negli altri negozi il riferimento resta marcato come simulato. **Nessun feed Pan/CosìComodo è configurato in questo aggiornamento.**

Per stabilire una convenienza reale tra due supermercati servono offerte valide per gli stessi prodotti presso almeno due negozi. Un solo catalogo reale confrontato con stime degli altri produce un confronto indicativo.

## Fonti ufficiali consultate

- [Pan — servizio CosìComodo](https://www.supermercatipan.it/servizi-utili/cosicomodo)
- [Pan — La Plaia, informazioni e collegamento e-commerce](https://www.supermercatipan.it/punti-vendita/sardegna/iper-plaia/informazioni)
- [CosìComodo — IPERPAN Cagliari La Plaia, ritiro](https://www.cosicomodo.it/pan/cagliari-plaia)
- [CosìComodo — condizioni d’uso, sezioni 9.1 e 9.3](https://www.cosicomodo.it/spesa-online/pagine/condizioni-generali-d-uso)
- [Pan — condizioni di vendita, sezioni 4, 9, 11 e 12](https://www.cosicomodo.it/pan/cagliari-plaia/pagine/condizioni-generali-di-vendita)
- [CosìComodo — proposte commerciali](https://www.cosicomodo.it/spesa-online/pagine/proposte-commerciali)
