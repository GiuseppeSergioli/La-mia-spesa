import { readFile, writeFile, mkdir } from 'node:fs/promises';
const read = path => readFile(new URL(`../${path}`,import.meta.url),'utf8');
const modules=[
  ['Version','public/version.mjs','APP_VERSION'],
  ['Core','public/core.mjs','MAX_QUANTITY, MAX_PRICE_CENTS, MIN_RADIUS_KM, MAX_RADIUS_KM, RADIUS_STEP_KM, DEFAULT_RADIUS_KM, DEFAULT_LOCATION, validRadius, normalizeRadius, haversine, validCoordinates, nearbyStores, normalizeList, offerStatus, referencePrice, priceForProduct, compareBasket, comparisonSummary, savingsBetweenComplete, money, distance, lowestPrice'],
  ['Catalog','public/catalog.mjs','REFERENCE_CHECKED_ON, CATALOG_CATEGORY_COUNT, CATALOG_PRODUCTS_PER_CATEGORY, CATALOG_PRODUCT_COUNT, catalogCategories, catalogProducts, catalogCounts'],
  ['CatalogEnglish','public/catalog-en.mjs','EN_CATALOG, EN_CATEGORIES'],
  ['MessagesEnglish','public/messages-en.mjs','EN_MESSAGES'],
  ['I18n','public/i18n.mjs','LANGUAGE_KEY, normalizeLanguage, localeFor, translateText, localizeMarkup, formatMoney, formatDistance, formatDate, localizedProductName, productMatches'],
  ['History','public/history.mjs','HISTORY_KEY, HISTORY_LIMIT, HISTORY_MAX_CHARS, validHistoryEntry, createHistoryEntry, appendHistory, readHistory, writeHistory'],
  ['Demo','public/demo.mjs','categories, products, demoLocation, sampleList, sampleLists, createDemoData, migrateDemoList, legacyDemoAliases'],
  ['Art','public/art.mjs','icon, productArt, heroArt'],
  ['Location','public/location.mjs','CAGLIARI_STARTS, DEFAULT_START, knownStart, GPS_OPTIONS, accuracyLabel, gpsLocation, gpsWarning, geolocationError']
];
const moduleNames=Object.fromEntries(modules.map(([name,file])=>[`./${file.split('/').at(-1)}`,name]));
const bindImports=source=>source.replace(/^import\s*\{([^}]+)\}\s*from\s*'([^']+)';/gm,(_all,bindings,path)=>{if(!moduleNames[path])throw new Error(`Unknown bundled module ${path}`);return `const {${bindings.replace(/\s+as\s+/g,':')}}=${moduleNames[path]};`;});
let script='window.SPESINA_STATIC=true;\n';
for(const [name,file,exports] of modules) {
  const source=bindImports((await read(file)).replace(/\bexport\s+(?=(?:async\s+)?(?:const|function|class))/g,''));
  script+=`const ${name}=(()=>{\n${source}\nreturn {${exports}};\n})();\n`;
}
let app=await read('public/app.mjs');
app=bindImports(app);
script+=`(()=>{\n${app}\n})();`;
const css=await read('public/styles.css'),favicon=await read('public/icon.svg');
let html=await read('public/index.html');
html=html.replace(/<link rel="stylesheet" href="\.\/styles\.css(?:\?[^"]*)?">/,`<style>${css}</style>`).replace(/<script type="module" src="\.\/app\.mjs(?:\?[^"]*)?"><\/script>/,'').replace('href="./icon.svg"',`href="data:image/svg+xml,${encodeURIComponent(favicon)}"`).replace('</body>',`<script>${script.replace(/<\/script/gi,'<\\/script')}</script></body>`);
await mkdir(new URL('../dist/',import.meta.url),{recursive:true});
await writeFile(new URL('../dist/index.html',import.meta.url),html);
console.log('Demo autonoma generata in dist/index.html');
