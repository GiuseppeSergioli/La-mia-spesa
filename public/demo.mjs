// Entirely fictional prices and stores. Never mix these records with live data.
export const categories = [
  { id: 'all', name: 'Tutti', icon: 'grid' },
  { id: 'pasta', name: 'Pasta e riso', icon: 'pasta' },
  { id: 'biscotti', name: 'Biscotti e colazione', icon: 'cookie' },
  { id: 'latticini', name: 'Latte e latticini', icon: 'milk' },
  { id: 'dispensa', name: 'Dispensa', icon: 'jar' },
  { id: 'ortofrutta', name: 'Frutta e verdura', icon: 'leaf' },
  { id: 'bevande', name: 'Bevande', icon: 'drop' },
  { id: 'casa', name: 'Cura della casa', icon: 'home' }
];

export const products = [
  { id:'demo-pasta-1', name:'Spaghetti n. 5', brand:'Barilla', size:'500 g', category:'pasta', art:'pasta', color:'#23499b', label:'SPAGHETTI', base:119 },
  { id:'demo-pasta-2', name:'Fusilli', brand:'De Cecco', size:'500 g', category:'pasta', art:'pasta', color:'#315783', label:'FUSILLI', base:179 },
  { id:'demo-biscotti-1', name:'Gocciole al cioccolato', brand:'Pavesi', size:'500 g', category:'biscotti', art:'cookie', color:'#c39761', label:'GOCCIOLE', base:279 },
  { id:'demo-latte-1', name:'Latte intero UHT', brand:'Granarolo', size:'1 l', category:'latticini', art:'milk', color:'#82b9dc', label:'LATTE', base:149 },
  { id:'demo-passata-1', name:'Passata di pomodoro', brand:'Mutti', size:'700 g', category:'dispensa', art:'bottle', color:'#c75042', label:'PASSATA', base:169 },
  { id:'demo-riso-1', name:'Riso Carnaroli', brand:'Riso Scotti', size:'1 kg', category:'pasta', art:'pasta', color:'#86a4b7', label:'CARNAROLI', base:349 },
  { id:'demo-biscotti-2', name:'Macine', brand:'Mulino Bianco', size:'800 g', category:'biscotti', art:'cookie', color:'#e2be76', label:'MACINE', base:289 },
  { id:'demo-yogurt-1', name:'Yogurt bianco intero', brand:'Müller', size:'2 × 125 g', category:'latticini', art:'yogurt', color:'#8ca76e', label:'BIANCO', base:129 },
  { id:'demo-olio-1', name:'Olio extravergine di oliva', brand:'Monini', size:'1 l', category:'dispensa', art:'bottle', color:'#648454', label:'EXTRAVERGINE', base:849 },
  { id:'demo-banane-1', name:'Banane', brand:'Chiquita', size:'Confezione 1 kg', category:'ortofrutta', art:'banana', color:'#e4bd43', label:'BANANE', base:189 },
  { id:'demo-mele-1', name:'Mele Golden', brand:'Melinda', size:'Confezione 1 kg', category:'ortofrutta', art:'apple', color:'#b0bb54', label:'GOLDEN', base:229 },
  { id:'demo-insalata-1', name:'Insalata mista', brand:'Bonduelle', size:'200 g', category:'ortofrutta', art:'greens', color:'#76a264', label:'INSALATA', base:169 },
  { id:'demo-acqua-1', name:'Acqua naturale', brand:'Sant’Anna', size:'6 × 1,5 l', category:'bevande', art:'water', color:'#84b6cd', label:'NATURALE', base:249 },
  { id:'demo-caffe-1', name:'Caffè Qualità Rossa', brand:'Lavazza', size:'250 g', category:'biscotti', art:'coffee', color:'#b04c44', label:'CAFFÈ', base:399 },
  { id:'demo-mozzarella-1', name:'Mozzarella', brand:'Santa Lucia', size:'3 × 125 g', category:'latticini', art:'yogurt', color:'#80a4bd', label:'MOZZARELLA', base:329 },
  { id:'demo-ceci-1', name:'Ceci cotti al vapore', brand:'Valfrutta', size:'360 g', category:'dispensa', art:'jar', color:'#aaba79', label:'CECI', base:109 },
  { id:'demo-succo-1', name:'Succo di arancia', brand:'Yoga', size:'1 l', category:'bevande', art:'milk', color:'#dd9c4b', label:'ARANCIA', base:199 },
  { id:'demo-detersivo-1', name:'Detersivo per lavatrice', brand:'Dixan', size:'19 lavaggi', category:'casa', art:'detergent', color:'#798ac3', label:'LAVATRICE', base:499 },
  { id:'demo-carta-1', name:'Carta casa', brand:'Scottex', size:'2 rotoli', category:'casa', art:'paper', color:'#c9b19a', label:'CARTA CASA', base:219 },
  { id:'demo-burro-1', name:'Burro classico', brand:'Parmareggio', size:'250 g', category:'latticini', art:'butter', color:'#d1ba78', label:'BURRO', base:259 },
  { id:'demo-farina-1', name:'Farina tipo 00', brand:'Barilla', size:'1 kg', category:'dispensa', art:'pasta', color:'#bed1d6', label:'FARINA 00', base:109 },
  { id:'demo-patate-1', name:'Patate a pasta gialla', brand:'Orto di casa', size:'Confezione 1,5 kg', category:'ortofrutta', art:'potato', color:'#b39872', label:'PATATE', base:239 },
  { id:'demo-te-1', name:'Tè classico', brand:'Star', size:'25 filtri', category:'biscotti', art:'coffee', color:'#d3ac55', label:'TÈ CLASSICO', base:159 },
  { id:'demo-tonno-1', name:'Tonno all’olio di oliva', brand:'Rio Mare', size:'3 × 80 g', category:'dispensa', art:'tuna', color:'#cd9b92', label:'TONNO', base:399 }
];

export const demoLocation = { label: 'Milano, centro · zona dimostrativa', lat:45.4642, lon:9.1900 };
export const sampleList = [
  {productId:'demo-pasta-1',quantity:2}, {productId:'demo-biscotti-1',quantity:1},
  {productId:'demo-latte-1',quantity:2}, {productId:'demo-passata-1',quantity:1},
  {productId:'demo-banane-1',quantity:1}, {productId:'demo-yogurt-1',quantity:1}
];

export function createDemoData() {
  const observedAt = new Date().toISOString();
  const stores = [
    {id:'demo-verde',name:'Mercato Verde',chain:'Mercato Verde',initial:'V',color:'#32745a',address:'Negozio fittizio · zona centro',lat:45.4700,lon:9.1870,factor:0.97},
    {id:'demo-fresco',name:'Fresco & Co.',chain:'Fresco & Co.',initial:'F',color:'#a65d42',address:'Negozio fittizio · zona est',lat:45.4590,lon:9.2070,factor:1.08},
    {id:'demo-quartiere',name:'La Bottega',chain:'La Bottega',initial:'B',color:'#817143',address:'Negozio fittizio · zona nord',lat:45.4880,lon:9.1780,factor:1.16},
    {id:'demo-insieme',name:'Spesa Insieme',chain:'Spesa Insieme',initial:'S',color:'#617d9c',address:'Negozio fittizio · zona ovest',lat:45.4570,lon:9.1470,factor:0.93},
    {id:'demo-vicino',name:'Vicino a Te',chain:'Vicino a Te',initial:'v',color:'#94729a',address:'Negozio fittizio · zona sud',lat:45.4260,lon:9.2000,factor:1.02}
  ].map((s,si) => ({...s, demo:true, catalogStatus:'connected', offers:Object.fromEntries(products.map((p,pi)=>[p.id,{
    priceCents:Math.round(p.base*s.factor) + ((pi+si)%3)*5,
    availability:si===3 && [2,7,9].includes(pi) || si===4 && [3,4,10].includes(pi) ? 'out_of_stock':'in_stock',
    observedAt,maxAgeMinutes:1440,currency:'EUR',sourceLabel:'Dato dimostrativo',sourceUrl:null,
    ...(si===2 && pi===0 ? {quantityAvailable:1}: {})
  }]))}));
  return {mode:'demo',products,categories,stores,generatedAt:observedAt,warnings:[],attribution:'Dati interamente dimostrativi. Negozi, prezzi e disponibilità sono fittizi.'};
}
