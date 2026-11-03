// Guarda la página en el celular: abre al instante y aunque la red esté cortada o cambiando.
// Solo toca la carga de la página (navegación). Los pedidos a Apps Script no pasan por acá.
const CACHE = 'rutina-v1';
const CLAVE = self.registration.scope;   // una sola página; el ?id=...&t=... lo lee la propia página

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(async c => {
    const r = await fetch(CLAVE, { cache: 'reload' });
    if (r.ok && !r.redirected) await c.put(CLAVE, r);
  }).catch(() => {}));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || r.mode !== 'navigate' || new URL(r.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const guardada = await c.match(CLAVE);
    const red = fetch(r).then(res => { if (res.ok && !res.redirected) c.put(CLAVE, res.clone()); return res; });
    if (guardada) { e.waitUntil(red.catch(() => {})); return guardada; }  // abre ya; se actualiza en segundo plano
    return red;                                                          // primera vez: necesita red
  })());
});
