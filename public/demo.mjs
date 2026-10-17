// Same product selection as shopping; store prices and stock here are entirely fictional.
import {catalogCategories,catalogProducts} from './catalog.mjs';
import {normalizeList,MAX_QUANTITY} from './core.mjs';
export const categories=catalogCategories;
export const products=catalogProducts;
export const demoLocation={label:'Cagliari, centro · zona dimostrativa',lat:39.2238,lon:9.1217};
// Only old DEMO selections are mapped to the new generic examples. Live feed IDs never change.
export const legacyDemoAliases={
  "demo-pasta-1": "reference:spaghetti-500",
  "demo-pasta-2": "reference:fusilli-500",
  "demo-biscotti-1": "reference:frollini-gocce",
  "demo-latte-1": "reference:latte-intero-1000",
  "demo-passata-1": "reference:passata-700",
  "demo-riso-1": "reference:riso-carnaroli",
  "demo-biscotti-2": "reference:frollini-panna-800",
  "demo-yogurt-1": "reference:yogurt-bianco",
  "demo-olio-1": "reference:olio-evo",
  "demo-banane-1": "reference:banane-1000",
  "demo-mele-1": "reference:mele-golden",
  "demo-insalata-1": "reference:insalata-mista",
  "demo-acqua-1": "reference:acqua-naturale-6",
  "demo-caffe-1": "reference:caffe-moka",
  "demo-mozzarella-1": "reference:mozzarella-375",
  "demo-ceci-1": "reference:ceci",
  "demo-succo-1": "reference:succo-arancia",
  "demo-detersivo-1": "reference:detersivo-lavatrice",
  "demo-carta-1": "reference:carta-casa",
  "demo-burro-1": "reference:burro",
  "demo-farina-1": "reference:farina-00",
  "demo-patate-1": "reference:patate",
  "demo-te-1": "reference:te-nero",
  "demo-tonno-1": "reference:tonno-olio",
  "demo-extra-penne": "reference:penne-500",
  "demo-extra-linguine": "reference:linguine-500",
  "demo-extra-casarecce": "reference:casarecce-500",
  "demo-extra-integrale": "reference:integrale-500",
  "demo-extra-basmati": "reference:riso-basmati",
  "demo-extra-risoni": "reference:risoni-500",
  "demo-extra-crema-nocciole": "reference:crema-nocciole",
  "demo-extra-biscotti-integrali": "reference:biscotti-integrali",
  "demo-extra-cornflakes": "reference:cornflakes",
  "demo-extra-fette-biscottate": "reference:fette-biscottate",
  "demo-extra-miele": "reference:miele",
  "demo-extra-confettura": "reference:confettura-albicocche",
  "demo-extra-latte-parziale": "reference:latte-ps-1000",
  "demo-extra-avena": "reference:bevanda-avena",
  "demo-extra-yogurt-greco": "reference:yogurt-greco",
  "demo-extra-parmigiano": "reference:parmigiano",
  "demo-extra-pecorino": "reference:pecorino",
  "demo-extra-ricotta": "reference:ricotta",
  "demo-extra-uova": "reference:uova-6",
  "demo-extra-arance": "reference:arance",
  "demo-extra-pomodori": "reference:pomodori-ciliegino",
  "demo-extra-zucchine": "reference:zucchine",
  "demo-extra-carote": "reference:carote",
  "demo-extra-limoni": "reference:limoni",
  "demo-extra-cipolle": "reference:cipolle",
  "demo-extra-spinaci-freschi": "reference:spinaci-freschi",
  "demo-extra-lenticchie": "reference:lenticchie",
  "demo-extra-fagioli": "reference:fagioli-borlotti",
  "demo-extra-mais": "reference:mais",
  "demo-extra-pesto": "reference:pesto",
  "demo-extra-sale": "reference:sale-fino",
  "demo-extra-zucchero": "reference:zucchero-bianco",
  "demo-extra-polpa": "reference:polpa-400",
  "demo-extra-crackers": "reference:crackers",
  "demo-extra-cola": "reference:cola",
  "demo-extra-te-freddo": "reference:te-pesca",
  "demo-extra-birra": "reference:birra",
  "demo-extra-vino": "reference:vino-cannonau",
  "demo-extra-acqua-frizzante": "reference:acqua-frizzante",
  "demo-extra-piatti": "reference:piatti-1000",
  "demo-extra-ammorbidente": "reference:ammorbidente",
  "demo-extra-spugne": "reference:spugne",
  "demo-extra-sacchi": "reference:sacchi-rifiuti",
  "demo-extra-carta-igienica": "reference:carta-igienica-4",
  "demo-extra-candeggina": "reference:candeggina",
  "demo-extra-pancarre": "reference:pane-toast",
  "demo-extra-panini": "reference:panini-latte",
  "demo-extra-carasau": "reference:pane-carasau",
  "demo-extra-piadine": "reference:piadine",
  "demo-extra-crostini": "reference:crostini",
  "demo-extra-grissini": "reference:grissini",
  "demo-extra-pollo": "reference:petto-pollo",
  "demo-extra-macinato": "reference:macinato-bovino",
  "demo-extra-cotto": "reference:prosciutto-cotto",
  "demo-extra-salsiccia": "reference:salsiccia-sarda",
  "demo-extra-tacchino": "reference:fesa-arrosto",
  "demo-extra-merluzzo": "reference:merluzzo",
  "demo-extra-orata": "reference:orata",
  "demo-extra-salmone": "reference:salmone-affumicato",
  "demo-extra-tonno-naturale": "reference:tonno-naturale",
  "demo-extra-piselli": "reference:piselli-surgelati",
  "demo-extra-minestrone": "reference:minestrone",
  "demo-extra-spinaci-surgelati": "reference:spinaci-surgelati",
  "demo-extra-pizza": "reference:pizza-margherita",
  "demo-extra-dentifricio": "reference:dentifricio",
  "demo-extra-shampoo": "reference:shampoo",
  "demo-extra-bagnoschiuma": "reference:bagnoschiuma",
  "demo-extra-sapone": "reference:sapone-liquido",
  "demo-extra-pannolini": "reference:pannolini-4",
  "demo-extra-omogeneizzati": "reference:omogeneizzato-mela",
  "demo-extra-gatto": "reference:crocchette-gatto",
  "demo-extra-cane": "reference:crocchette-cane"
};

export function migrateDemoList(list) {
  if(!Array.isArray(list))return [];
  const quantities=new Map();
  for(const item of list){
    if(!item || !Number.isInteger(item.quantity) || item.quantity<1 || item.quantity>MAX_QUANTITY)continue;
    const productId=legacyDemoAliases[item.productId] || item.productId;
    quantities.set(productId,Math.min(MAX_QUANTITY,(quantities.get(productId) || 0)+item.quantity));
  }
  return normalizeList([...quantities].map(([productId,quantity])=>({productId,quantity})),products);
}
export const sampleList=[
  {productId:'reference:spaghetti-500',quantity:2},{productId:'reference:frollini-gocce',quantity:1},
  {productId:'reference:latte-intero-1000',quantity:2},{productId:'reference:passata-700',quantity:1},
  {productId:'reference:banane-1000',quantity:1},{productId:'reference:yogurt-bianco',quantity:1}
];
const list=ids=>ids.map(id=>({productId:`reference:${id}`,quantity:id==='latte-intero-1000'?3:1}));
export const sampleLists=[
  {id:'veloce',name:'Lista veloce',description:'6 prodotti per iniziare',items:sampleList},
  {id:'settimana',name:'Spesa settimanale',description:'16 prodotti per la settimana',items:list(['spaghetti-500','latte-intero-1000','passata-700','uova-6','petto-pollo','pomodori-ciliegino','carote','pane-toast','piselli-surgelati','parmigiano','frollini-gocce','banane-1000','lenticchie','yogurt-bianco','piatti-1000','ricotta'])},
  {id:'casa',name:'Casa e pulizia',description:'8 prodotti per la casa',items:list(['detersivo-lavatrice','carta-casa','piatti-1000','ammorbidente','spugne','sacchi-rifiuti','carta-igienica-4','candeggina'])},
  {id:'colazione',name:'Colazione',description:'8 prodotti per iniziare la giornata',items:list(['latte-intero-1000','frollini-gocce','caffe-moka','fette-biscottate','miele','confettura-albicocche','yogurt-greco','cornflakes'])}
];

export function createDemoData() {
  const observedAt = new Date().toISOString();
  const stores = [
    {id:'demo-verde',name:'Mercato Verde',chain:'Mercato Verde',initial:'V',color:'#32745a',address:'Negozio fittizio · zona centro',lat:45.4700,lon:9.1870,factor:0.97},
    {id:'demo-fresco',name:'Fresco & Co.',chain:'Fresco & Co.',initial:'F',color:'#a65d42',address:'Negozio fittizio · zona est',lat:45.4590,lon:9.2070,factor:1.08},
    {id:'demo-quartiere',name:'La Bottega',chain:'La Bottega',initial:'B',color:'#817143',address:'Negozio fittizio · zona nord',lat:45.4880,lon:9.1780,factor:1.16},
    {id:'demo-insieme',name:'Spesa Insieme',chain:'Spesa Insieme',initial:'S',color:'#617d9c',address:'Negozio fittizio · zona ovest',lat:45.4570,lon:9.1470,factor:0.93},
    {id:'demo-vicino',name:'Vicino a Te',chain:'Vicino a Te',initial:'v',color:'#94729a',address:'Negozio fittizio · zona sud',lat:45.4260,lon:9.2000,factor:1.02},
    {id:'demo-isola',name:'Isola Market',chain:'Isola Market',initial:'I',color:'#6c859a',address:'Negozio fittizio · zona nord-est',lat:45.4762,lon:9.2100,factor:1.07},
    {id:'demo-dispensa',name:'La Dispensa',chain:'La Dispensa',initial:'D',color:'#ab8b54',address:'Negozio fittizio · zona centro-ovest',lat:45.4732,lon:9.1830,factor:0.99},
    {id:'demo-orizzonte',name:'Orizzonte',chain:'Orizzonte',initial:'O',color:'#739279',address:'Negozio fittizio · zona nord',lat:45.5092,lon:9.1950,factor:1.04}
  ].map((s,si) => ({...s, lat:demoLocation.lat+(s.lat-45.4642), lon:demoLocation.lon+(s.lon-9.19), demo:true, catalogStatus:'connected', offers:Object.fromEntries(products.map((p,pi)=>[p.id,{
    priceCents:Math.round(p.reference.priceCents*s.factor) + ((pi+si)%3)*5,
    availability:si===3 && p.id==='reference:passata-700' || si===4 && p.id==='reference:latte-intero-1000' || si===6 && p.id==='reference:spaghetti-500' || pi>=24 && si===3 && pi%17===0 ? 'out_of_stock':si===5 && p.id==='reference:frollini-gocce'?'unknown':'in_stock',
    observedAt:si===5 && pi>=24 && pi%11===0?new Date(Date.now()-172_800_000).toISOString():observedAt,maxAgeMinutes:1440,currency:'EUR',sourceLabel:'Dato dimostrativo',sourceUrl:null,
    ...(si===2 && p.id==='reference:spaghetti-500' ? {quantityAvailable:1}: {})
  }]))}));
  return {mode:'demo',products,categories,stores,generatedAt:observedAt,warnings:[],attribution:'Dati interamente dimostrativi. Negozi, prezzi e disponibilità sono fittizi.'};
}
