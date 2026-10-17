import { readFile, writeFile, mkdir } from 'node:fs/promises';
const read = path => readFile(new URL(`../${path}`,import.meta.url),'utf8');
const modules=[
  ['Core','public/core.mjs','MAX_QUANTITY, MAX_PRICE_CENTS, haversine, validCoordinates, nearbyStores, normalizeList, offerStatus, compareBasket, savingsBetweenComplete, money, distance, lowestPrice'],
  ['Demo','public/demo.mjs','categories, products, demoLocation, sampleList, createDemoData'],
  ['Art','public/art.mjs','icon, productArt, heroArt']
];
let script='window.SPESINA_STATIC=true;\n';
for(const [name,file,exports] of modules) {
  const source=(await read(file)).replace(/\bexport\s+(?=(?:async\s+)?(?:const|function|class))/g,'');
  script+=`const ${name}=(()=>{\n${source}\nreturn {${exports}};\n})();\n`;
}
let app=await read('public/app.mjs');
app=app.replace(/^import \{([^}]+)\} from '\.\/core\.mjs';/m,'const {$1}=Core;').replace(/^import \{([^}]+)\} from '\.\/demo\.mjs';/m,'const {$1}=Demo;').replace(/^import \{([^}]+)\} from '\.\/art\.mjs';/m,'const {$1}=Art;');
script+=`(()=>{\n${app}\n})();`;
const css=await read('public/styles.css'),favicon=await read('public/icon.svg');
let html=await read('public/index.html');
html=html.replace('<link rel="stylesheet" href="./styles.css">',`<style>${css}</style>`).replace('<script type="module" src="./app.mjs"></script>','').replace('href="./icon.svg"',`href="data:image/svg+xml,${encodeURIComponent(favicon)}"`).replace('</body>',`<script>${script.replace(/<\/script/gi,'<\\/script')}</script></body>`);
await mkdir(new URL('../dist/',import.meta.url),{recursive:true});
await writeFile(new URL('../dist/index.html',import.meta.url),html);
console.log('Demo autonoma generata in dist/index.html');
