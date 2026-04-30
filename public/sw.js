// sw.js — Service Worker para Web Push (colocar en /public/sw.js)
const CACHE = "myapp-v1"
const ASSETS = ["/", "/index.html"]

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)))
  self.skipWaiting()
})

self.addEventListener("activate", e => {
  e.waitUntil(clients.claim())
})

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  )
})

// ─── PUSH NOTIFICATIONS ───────────────────────────────────────────────────────
self.addEventListener("push", e => {
  let data = { title: "My App", body: "Tienes un nuevo aviso" }
  try { data = e.data.json() } catch {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-96.png",
      vibrate: [200, 100, 200],
      tag: data.tag || "myapp",
      data: data.url || "/",
    })
  )
})

self.addEventListener("notificationclick", e => {
  e.notification.close()
  e.waitUntil(
    clients.matchAll({ type: "window" }).then(list => {
      for (const c of list) {
        if (c.url === "/" && "focus" in c) return c.focus()
      }
      if (clients.openWindow) return clients.openWindow(e.notification.data || "/")
    })
  )
})