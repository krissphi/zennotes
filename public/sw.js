// ZenNotes Service Worker for Offline PWA Support
const CACHE_NAME = 'zennotes-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)

  // Handle HTML navigation: Network-first with offline cache fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone))
          }
          return networkRes
        })
        .catch(() => {
          return caches.match('/index.html').then((cached) => {
            return cached || caches.match('/')
          })
        })
    )
    return
  }

  // Handle static assets (scripts, styles, fonts, images)
  // Stale-while-revalidate strategy
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req)
          .then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              const clone = networkRes.clone()
              caches.open(CACHE_NAME).then((cache) => cache.put(req, clone))
            }
            return networkRes
          })
          .catch(() => cached)

        return cached || fetchPromise
      })
    )
  }
})
