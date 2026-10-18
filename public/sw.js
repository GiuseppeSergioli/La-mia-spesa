/* Classic worker, supported by browsers that do not support module workers. */
const APP_VERSION='1.10.0';
const CACHE_PREFIX='la-mia-spesa-shell-';
const CACHE_NAME=CACHE_PREFIX+APP_VERSION;
const SHELL=[
  './index.html',`./styles.css?v=${APP_VERSION}`,`./app.mjs?v=${APP_VERSION}`,
  './version.mjs','./core.mjs','./catalog.mjs','./catalog-en.mjs','./messages-en.mjs',
  './i18n.mjs','./history.mjs','./demo.mjs','./art.mjs','./location.mjs','./install.mjs',
  './manifest.webmanifest','./assets/logo.png','./assets/favicon.png',
  './assets/apple-touch-icon.png','./assets/icon-192.png','./assets/icon-512.png','./assets/icon-maskable-512.png'
];
const shellUrls=new Set(SHELL.map(path=>new URL(path,self.registration.scope).href));
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(SHELL.map(path=>new Request(new URL(path,self.registration.scope),{cache:'reload'})))));
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    for(const name of await caches.keys())if(name.startsWith(CACHE_PREFIX) && name!==CACHE_NAME)await caches.delete(name);
    await self.clients.claim();
  })());
});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url),scope=new URL(self.registration.scope);
  // User data, location searches, current prices and compare responses are NEVER cached.
  if(request.method!=='GET' || url.origin!==scope.origin || url.pathname.startsWith(new URL('api/',scope).pathname))return;
  const navigation=request.mode==='navigate' && (url.pathname===scope.pathname || url.pathname===new URL('index.html',scope).pathname);
  if(!navigation && !shellUrls.has(url.href))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    const key=navigation?new URL('index.html',scope).href:request;
    const hit=await cache.match(key);if(hit)return hit;
    const response=await fetch(request);
    if(response.ok && response.type!=='opaque')await cache.put(key,response.clone());
    return response;
  })());
});
