// Este service worker permite la navegación offline en la aplicación

const CACHE_NAME = 'billexpress-cache-v1';

// Recursos que queremos cachear para navegación offline
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/dashboard',
  '/dashboard/ingresos',
  '/dashboard/gastos',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico'
];

// Instalar el service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activar el service worker y eliminar caches antiguas
self.addEventListener('activate', (event) => {
  console.log('Service Worker activado');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => {
          return name !== CACHE_NAME;
        }).map((name) => {
          return caches.delete(name);
        })
      );
    })
  );
  return self.clients.claim();
});

// Estrategia "Network First, fallback to Cache"
self.addEventListener('fetch', (event) => {
  // Solo interceptar solicitudes GET
  if (event.request.method !== 'GET') return;
  
  // Ignorar solicitudes a Firebase o API externas
  if (event.request.url.includes('firebaseapp.com') || 
      event.request.url.includes('googleapis.com')) {
    return;
  }
  
  event.respondWith(
    // Primero intentamos obtener el recurso de la red
    fetch(event.request)
      .then((networkResponse) => {
        // Si la solicitud fue exitosa, guardamos una copia en caché
        const clonedResponse = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clonedResponse);
        });
        return networkResponse;
      })
      .catch(() => {
        // Si la red falla, buscamos en caché
        return caches.match(event.request)
          .then((cachedResponse) => {
            // Devolver la respuesta cacheada o una página offline genérica
            return cachedResponse || caches.match('/offline.html');
          });
      })
  );
}); 