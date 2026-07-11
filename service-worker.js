const CACHE_NAME = "speed-factory-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./cover%20no%20backround.png",
  "./logo%20git%20hub.png",
  "./icon-192.png",
  "./icon-512.png"
];

/*
  Αποθήκευση των βασικών αρχείων της σελίδας
  ώστε να μπορεί να ανοίγει και από το εικονίδιο
  του κινητού.
*/
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

/*
  Διαγραφή παλαιότερων εκδόσεων της cache.
*/
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

/*
  Για τις σελίδες χρησιμοποιούμε πρώτα το δίκτυο,
  ώστε να εμφανίζονται γρήγορα οι νέες αλλαγές.

  Αν δεν υπάρχει σύνδεση, ανοίγει η αποθηκευμένη έκδοση.
*/
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);

  /*
    Δεν αποθηκεύουμε εξωτερικά links,
    όπως Google, Instagram και Facebook.
  */
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseCopy = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseCopy);
          });

          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || caches.match("./index.html");
          });
        })
    );

    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        if (
          !response ||
          response.status !== 200 ||
          response.type !== "basic"
        ) {
          return response;
        }

        const responseCopy = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseCopy);
        });

        return response;
      });
    })
  );
});
