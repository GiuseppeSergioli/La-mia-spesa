// Entirely fictional prices and stores. Never mix these records with live data.
export const categories = [
  { id: 'all', name: 'Tutti', icon: 'grid' },
  { id: 'pasta', name: 'Pasta e riso', icon: 'pasta' },
  { id: 'biscotti', name: 'Biscotti e colazione', icon: 'cookie' },
  { id: 'latticini', name: 'Latte e latticini', icon: 'milk' },
  { id: 'dispensa', name: 'Dispensa', icon: 'jar' },
  { id: 'ortofrutta', name: 'Frutta e verdura', icon: 'leaf' },
  { id: 'bevande', name: 'Bevande', icon: 'drop' },
  { id: 'casa', name: 'Cura della casa', icon: 'home' },
  { id: 'pane', name: 'Pane e snack', icon: 'bag' },
  { id: 'carne', name: 'Carne e salumi', icon: 'jar' },
  { id: 'pesce', name: 'Pesce', icon: 'drop' },
  { id: 'surgelati', name: 'Surgelati', icon: 'spark' },
  { id: 'persona', name: 'Cura della persona', icon: 'leaf' },
  { id: 'infanzia', name: 'Prima infanzia', icon: 'milk' },
  { id: 'animali', name: 'Amici animali', icon: 'home' }
];

// Fictional sample prices, including the branded products below. No real offer is implied.
const extraProducts = [
  ['penne','Penne rigate','Barilla','500 g','pasta','pasta',129],
  ['linguine','Linguine','De Cecco','500 g','pasta','pasta',189],
  ['casarecce','Casarecce','Garofalo','500 g','pasta','pasta',159],
  ['integrale','Pasta integrale','Rummo','500 g','pasta','pasta',169],
  ['basmati','Riso Basmati','Riso Scotti','1 kg','pasta','pasta',329],
  ['risoni','Risoni','Barilla','500 g','pasta','pasta',139],
  ['crema-nocciole','Crema alle nocciole','Nutella','450 g','biscotti','jar',369],
  ['biscotti-integrali','Biscotti integrali','Gran Cereale','500 g','biscotti','cookie',259],
  ['cornflakes','Corn flakes','Kellogg’s','375 g','biscotti','pasta',299],
  ['fette-biscottate','Fette biscottate','Mulino Bianco','315 g','biscotti','pasta',189],
  ['miele','Miele millefiori','Ambrosoli','250 g','biscotti','jar',349],
  ['confettura','Confettura di albicocche','Rigoni','250 g','biscotti','jar',269],
  ['latte-parziale','Latte parzialmente scremato','Granarolo','1 l','latticini','milk',139],
  ['avena','Bevanda di avena','Alpro','1 l','latticini','milk',239],
  ['yogurt-greco','Yogurt greco bianco','Fage','170 g','latticini','yogurt',169],
  ['parmigiano','Parmigiano Reggiano','Parmareggio','200 g','latticini','butter',449],
  ['pecorino','Pecorino sardo','Isola dei Sapori','250 g','latticini','butter',499],
  ['ricotta','Ricotta fresca','Santa Lucia','250 g','latticini','yogurt',179],
  ['uova','Uova da allevamento a terra','Le Naturelle','6 uova','latticini','butter',219],
  ['arance','Arance da tavola','Orto di casa','Confezione 1 kg','ortofrutta','apple',199],
  ['pomodori','Pomodori ciliegino','Orto di casa','500 g','ortofrutta','apple',229],
  ['zucchine','Zucchine','Orto di casa','Confezione 1 kg','ortofrutta','greens',219],
  ['carote','Carote','Orto di casa','Confezione 1 kg','ortofrutta','greens',129],
  ['limoni','Limoni','Orto di casa','500 g','ortofrutta','apple',149],
  ['cipolle','Cipolle dorate','Orto di casa','Confezione 1 kg','ortofrutta','potato',139],
  ['spinaci-freschi','Spinaci freschi','Bonduelle','250 g','ortofrutta','greens',219],
  ['lenticchie','Lenticchie cotte','Valfrutta','400 g','dispensa','jar',119],
  ['fagioli','Fagioli borlotti','Valfrutta','400 g','dispensa','jar',119],
  ['mais','Mais dolce','Bonduelle','3 × 160 g','dispensa','jar',279],
  ['pesto','Pesto alla genovese','Barilla','190 g','dispensa','jar',229],
  ['sale','Sale fino','Sosalt','1 kg','dispensa','pasta',69],
  ['zucchero','Zucchero bianco','Eridania','1 kg','dispensa','pasta',139],
  ['polpa','Polpa di pomodoro','Mutti','400 g','dispensa','jar',119],
  ['crackers','Crackers salati','Mulino Bianco','500 g','dispensa','pasta',219],
  ['cola','Cola classica','Coca-Cola','1,5 l','bevande','bottle',199],
  ['te-freddo','Tè freddo alla pesca','Estathé','1,5 l','bevande','bottle',229],
  ['birra','Birra bionda','Ichnusa','66 cl','bevande','bottle',149],
  ['vino','Cannonau di Sardegna','Cantina di casa','75 cl','bevande','bottle',599],
  ['acqua-frizzante','Acqua frizzante','Sant’Anna','1,5 l','bevande','water',39],
  ['piatti','Detersivo per piatti','Svelto','1 l','casa','detergent',189],
  ['ammorbidente','Ammorbidente concentrato','Felce Azzurra','1,5 l','casa','detergent',249],
  ['spugne','Spugne cucina','Scotch-Brite','3 pezzi','casa','butter',159],
  ['sacchi','Sacchi per rifiuti','Domopak','20 sacchi','casa','pasta',199],
  ['carta-igienica','Carta igienica','Scottex','4 rotoli','casa','paper',249],
  ['candeggina','Candeggina classica','ACE','1 l','casa','detergent',129],
  ['pancarre','Pane per toast','Mulino Bianco','400 g','pane','pasta',169],
  ['panini','Panini al latte','Pan di casa','4 panini','pane','cookie',179],
  ['carasau','Pane carasau','Forno di Sardegna','250 g','pane','pasta',239],
  ['piadine','Piadine classiche','Mulino Bianco','3 piadine','pane','pasta',219],
  ['crostini','Crostini dorati','San Carlo','150 g','pane','pasta',129],
  ['grissini','Grissini classici','Grissin Bon','125 g','pane','pasta',109],
  ['pollo','Petto di pollo','AIA','Confezione 400 g','carne','butter',469],
  ['macinato','Macinato bovino','Fattoria di casa','Confezione 400 g','carne','butter',489],
  ['cotto','Prosciutto cotto','Citterio','100 g','carne','butter',249],
  ['salsiccia','Salsiccia sarda','Sapori di Sardegna','Confezione 400 g','carne','butter',499],
  ['tacchino','Fesa di tacchino arrosto','AIA','100 g','carne','butter',219],
  ['merluzzo','Filetti di merluzzo','Findus','400 g','pesce','butter',549],
  ['orata','Orate pulite','Mare di casa','Confezione 600 g','pesce','butter',899],
  ['salmone','Salmone affumicato','Fjord','100 g','pesce','butter',399],
  ['tonno-naturale','Tonno al naturale','Rio Mare','3 × 80 g','pesce','tuna',359],
  ['piselli','Pisellini surgelati','Findus','450 g','surgelati','greens',229],
  ['minestrone','Minestrone surgelato','Orogel','600 g','surgelati','greens',249],
  ['spinaci-surgelati','Spinaci in foglia surgelati','Findus','450 g','surgelati','greens',239],
  ['pizza','Pizza margherita surgelata','Buitoni','2 × 330 g','surgelati','pasta',399],
  ['dentifricio','Dentifricio protezione completa','Mentadent','75 ml','persona','coffee',199],
  ['shampoo','Shampoo delicato','Garnier','250 ml','persona','detergent',249],
  ['bagnoschiuma','Bagnoschiuma classico','Felce Azzurra','500 ml','persona','detergent',199],
  ['sapone','Sapone liquido','Neutro Roberts','500 ml','persona','detergent',179],
  ['pannolini','Pannolini taglia 4','Pampers','20 pannolini','infanzia','pasta',649],
  ['omogeneizzati','Omogeneizzato di mela','Mellin','2 × 80 g','infanzia','jar',159],
  ['gatto','Croccantini per gatto','Purina','1 kg','animali','pasta',399],
  ['cane','Crocchette per cane','Pedigree','1,5 kg','animali','pasta',499]
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

products.push(...extraProducts.map(([id,name,brand,size,category,art,base],i)=>({id:`demo-extra-${id}`,name,brand,size,category,art,base,label:name.toUpperCase().slice(0,15),color:['#66865e','#b39567','#809eb3','#b66d60','#92946e'][i%5]})));

export const demoLocation = { label: 'Cagliari, centro · zona dimostrativa', lat:39.2238, lon:9.1217 };
export const sampleList = [
  {productId:'demo-pasta-1',quantity:2}, {productId:'demo-biscotti-1',quantity:1},
  {productId:'demo-latte-1',quantity:2}, {productId:'demo-passata-1',quantity:1},
  {productId:'demo-banane-1',quantity:1}, {productId:'demo-yogurt-1',quantity:1}
];
export const sampleLists = [
  {id:'veloce',name:'Lista veloce',description:'6 prodotti per iniziare',items:sampleList},
  {id:'settimana',name:'Spesa settimanale',description:'16 prodotti per la settimana',items:['demo-pasta-1','demo-latte-1','demo-passata-1','demo-extra-uova','demo-extra-pollo','demo-extra-pomodori','demo-extra-carote','demo-extra-pancarre','demo-extra-piselli','demo-extra-parmigiano','demo-biscotti-1','demo-banane-1','demo-extra-lenticchie','demo-yogurt-1','demo-extra-piatti','demo-extra-ricotta'].map(productId=>({productId,quantity:productId==='demo-latte-1'?3:1}))},
  {id:'casa',name:'Casa e pulizia',description:'8 prodotti per la casa',items:['demo-detersivo-1','demo-carta-1','demo-extra-piatti','demo-extra-ammorbidente','demo-extra-spugne','demo-extra-sacchi','demo-extra-carta-igienica','demo-extra-candeggina'].map(productId=>({productId,quantity:1}))},
  {id:'colazione',name:'Colazione',description:'8 prodotti per iniziare la giornata',items:['demo-latte-1','demo-biscotti-1','demo-caffe-1','demo-extra-fette-biscottate','demo-extra-miele','demo-extra-confettura','demo-extra-yogurt-greco','demo-extra-cornflakes'].map(productId=>({productId,quantity:1}))}
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
    priceCents:Math.round(p.base*s.factor) + ((pi+si)%3)*5,
    availability:si===3 && [2,7,9].includes(pi) || si===4 && [3,4,10].includes(pi) || si===6 && pi===0 || pi>=24 && si===3 && pi%17===0 ? 'out_of_stock':si===5 && pi===2?'unknown':'in_stock',
    observedAt:si===5 && pi>=24 && pi%11===0?new Date(Date.now()-172_800_000).toISOString():observedAt,maxAgeMinutes:1440,currency:'EUR',sourceLabel:'Dato dimostrativo',sourceUrl:null,
    ...(si===2 && pi===0 ? {quantityAvailable:1}: {})
  }]))}));
  return {mode:'demo',products,categories,stores,generatedAt:observedAt,warnings:[],attribution:'Dati interamente dimostrativi. Negozi, prezzi e disponibilità sono fittizi.'};
}
