// Public online price observations used ONLY as estimates, never as local store offers.
// Generic products describe a comparable item/format, not a retailer's assortment.
export const REFERENCE_CHECKED_ON='2026-10-17';
const base='https://spesaonline.conad.it/p/';
const anchors={
  pasta:[59,500,'g','conad-pasta-di-semola-di-grano-duro-n-5-spaghetti-500-g--300948','Spaghetti Conad 500 g'],
  riso:[249,1000,'g','conad-originario-1-kg--203737','Riso Originario Conad 1 kg'],
  integrale:[219,1000,'g','conad-parboiled-integrale-1-kg--360282','Riso integrale Conad 1 kg'],
  panna:[209,800,'g','conad-frollini-con-panna-800-g--401440','Frollini con panna Conad 800 g'],
  zucchero:[209,800,'g','conad-frollini-con-granelli-di-zucchero-800-g--401449','Frollini con zucchero Conad 800 g'],
  uova:[209,800,'g','conad-frollini-con-uova-800-g--401438','Frollini con uova Conad 800 g'],
  risoLatte:[139,400,'g','conad-frollini-con-riso-e-latte-400-g--401442','Frollini riso e latte Conad 400 g'],
  latte:[65,500,'ml','conad-buono-dal-gusto-leggero-latte-uht-parzialmente-scremato-500-ml--401287','Latte parzialmente scremato Conad 500 ml'],
  intero:[79,500,'ml','conad-buono-e-gustoso-latte-uht-intero-500-ml--402773','Latte intero Conad 500 ml'],
  acqua:[30,1500,'ml','conad-naturale-acqua-minerale-naturale-oligominerale-15-l--279757','Acqua naturale Conad 1,5 l'],
  frizzante:[30,1500,'ml','conad-frizzante-acqua-minerale-naturale-oligominerale-levia-15-l--357294','Acqua frizzante Conad 1,5 l'],
  piatti:[119,1000,'ml','conad-piatti-limone-1-l--364798','Detersivo piatti Conad 1 l'],
  banana:[179,250,'g','conad-baby-banana-biologico-omogeneizzato-2-x-125-g--401805','Omogeneizzato banana Conad 2 × 125 g'],
  caffe:[359,250,'g','conad-qualita-espresso-bar-250-g--100117','Caffè espresso Conad 250 g'],
  caffeDoppio:[695,500,'g','conad-qualita-espresso-bar-2-x-250-g--203751','Caffè espresso Conad 2 × 250 g'],
  piselli:[295,1200,'g','conad-piselli-medi-3-x-400-g--145156','Piselli in conserva Conad 3 × 400 g']
};
export const referenceCategories=[
  {id:'all',name:'Tutti',icon:'grid'}, {id:'pasta',name:'Pasta e riso',icon:'pasta'},
  {id:'biscotti',name:'Biscotti',icon:'cookie'}, {id:'latticini',name:'Latte',icon:'milk'},
  {id:'bevande',name:'Acqua e bevande',icon:'drop'}, {id:'dispensa',name:'Conserve',icon:'jar'},
  {id:'caffe',name:'Caffè',icon:'jar'}, {id:'casa',name:'Cura della casa',icon:'home'},
  {id:'infanzia',name:'Prima infanzia',icon:'milk'}
];
const rows=[
 ['spaghetti-500','Spaghetti','500 g','pasta','pasta',500],
 ['penne-500','Penne rigate','500 g','pasta','pasta',500],
 ['rigatoni-500','Rigatoni','500 g','pasta','pasta',500],
 ['tortiglioni-500','Tortiglioni','500 g','pasta','pasta',500],
 ['spaghetti-1000','Spaghetti','1 kg','pasta','pasta',1000],
 ['penne-1000','Penne rigate','1 kg','pasta','pasta',1000],
 ['riso-originario','Riso originario','1 kg','pasta','riso',1000],
 ['riso-integrale','Riso integrale parboiled','1 kg','pasta','integrale',1000],
 ['frollini-panna-800','Frollini alla panna','800 g','biscotti','panna',800],
 ['frollini-panna-400','Frollini alla panna','400 g','biscotti','panna',400],
 ['frollini-zucchero','Frollini con zucchero','800 g','biscotti','zucchero',800],
 ['frollini-uova','Frollini con uova','800 g','biscotti','uova',800],
 ['frollini-riso-400','Frollini riso e latte','400 g','biscotti','risoLatte',400],
 ['frollini-riso-800','Frollini riso e latte','800 g','biscotti','risoLatte',800],
 ['latte-ps-500','Latte UHT parzialmente scremato','500 ml','latticini','latte',500],
 ['latte-ps-1000','Latte UHT parzialmente scremato','1 l','latticini','latte',1000],
 ['latte-intero-500','Latte UHT intero','500 ml','latticini','intero',500],
 ['latte-intero-1000','Latte UHT intero','1 l','latticini','intero',1000],
 ['acqua-naturale','Acqua naturale','1,5 l','bevande','acqua',1500],
 ['acqua-naturale-6','Acqua naturale','6 × 1,5 l','bevande','acqua',9000],
 ['acqua-frizzante','Acqua frizzante','1,5 l','bevande','frizzante',1500],
 ['acqua-frizzante-6','Acqua frizzante','6 × 1,5 l','bevande','frizzante',9000],
 ['piatti-1000','Detersivo piatti al limone','1 l','casa','piatti',1000],
 ['piatti-500','Detersivo piatti al limone','500 ml','casa','piatti',500],
 ['omogeneizzato-250','Omogeneizzato banana','2 × 125 g','infanzia','banana',250],
 ['omogeneizzato-500','Omogeneizzato banana','4 × 125 g','infanzia','banana',500],
 ['caffe-250','Caffè macinato espresso','250 g','caffe','caffe',250],
 ['caffe-500','Caffè macinato espresso','2 × 250 g','caffe','caffeDoppio',500],
 ['piselli-1200','Piselli in conserva','3 × 400 g','dispensa','piselli',1200],
 ['piselli-400','Piselli in conserva','400 g','dispensa','piselli',400]
];
const art={pasta:'pasta',biscotti:'cookie',latticini:'milk',bevande:'water',casa:'detergent',infanzia:'jar',caffe:'coffee',dispensa:'jar'};
export const referenceProducts=rows.map(([id,name,size,category,key,amount])=>{
  const [cents,baseAmount,unit,path,sourceProduct]=anchors[key];
  return {id:`reference:${id}`,name,brand:'Prodotto di riferimento',size,category,art:art[category],color:category==='biscotti'?'#d7ba7a':'#628371',generic:true,
    reference:{priceCents:Math.round(cents*amount/baseAmount),sourceUrl:base+path,sourceLabel:'Riferimento pubblico Conad, non prezzo del negozio',sourceProduct,sourcePriceCents:cents,sourceAmount:baseAmount,amount,unit,checkedOn:REFERENCE_CHECKED_ON,method:amount===baseAmount?'Prezzo indicativo di un prodotto comparabile.':'Stima proporzionale al formato; non è un prezzo di confezione rilevato.'}};
});
