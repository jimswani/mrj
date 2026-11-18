// Offline support: the app shell is cached; the page itself is fetched fresh when online so updates arrive.
const CACHE="mrj-6.7";
const SHELL=["./","index.html","manifest.webmanifest","icon-180.png","icon-192.png","icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;
  const u=new URL(r.url);
  // never cache Firebase data calls
  if(/firestore\.googleapis|identitytoolkit|securetoken|googleapis\.com\/(?!css)/.test(u.href))return;
  if(r.mode==="navigate"||u.pathname.endsWith("index.html")){
    // each page is cached under its own address (index, exam, student), never mixed up
    const key=/\/(exam|student)\.html$/.test(u.pathname)?u.origin+u.pathname:"index.html";
    e.respondWith(fetch(r,{cache:"no-cache"}).then(res=>{if(res.ok){const c=res.clone();caches.open(CACHE).then(x=>x.put(key,c))}return res}).catch(()=>caches.match(key)));
    return;
  }
  e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>{if(res.ok&&(u.origin===location.origin||/gstatic|fonts\.googleapis/.test(u.host))){const c=res.clone();caches.open(CACHE).then(x=>x.put(r,c))}return res})));
});
