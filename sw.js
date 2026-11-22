/* Offline: app shell cached on install; map tiles cached as you view them. */
const V="lr-v23";
const SHELL=["./","index.html","config.js","css/app.css","js/app.js","js/store.js","js/cloud.js","js/guides.js","js/i18n.js","data/items.json","data/locs.json","data/affine.json","data/extra.json","data/vec-lo.json","data/overview.webp","vendor/leaflet.js","vendor/leaflet.css","vendor/leaflet.markercluster.js","vendor/MarkerCluster.css","vendor/MarkerCluster.Default.css","vendor/supabase.js","manifest.webmanifest","icons/icon-192.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V&&k!=="lr-tiles").map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET"||u.origin!==location.origin)return;
  if(u.pathname.includes("/tiles/")){
    e.respondWith(caches.open("lr-tiles").then(c=>c.match(e.request).then(r=>r||fetch(e.request).then(n=>{if(n.ok)c.put(e.request,n.clone());return n}))));return;
  }
  // network first for app files so updates arrive; fall back to cache offline
  e.respondWith(fetch(e.request).then(n=>{if(n.ok){const cp=n.clone();caches.open(V).then(c=>c.put(e.request,cp))}return n}).catch(()=>caches.match(e.request).then(r=>r||caches.match("index.html"))));
});
