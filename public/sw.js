// Service worker mínimo para que la app se pueda instalar en la pantalla de inicio.
// Estrategia "primero la red": siempre se usa la versión más nueva y, si no hay
// conexión, se muestra la última guardada. Nunca guarda las llamadas a /api.
const CACHE = 'picto-app-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (evento) => {
  const url = new URL(evento.request.url);
  if (evento.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  evento.respondWith(
    fetch(evento.request)
      .then((respuesta) => {
        const copia = respuesta.clone();
        caches.open(CACHE).then((cache) => cache.put(evento.request, copia));
        return respuesta;
      })
      .catch(() => caches.match(evento.request))
  );
});
