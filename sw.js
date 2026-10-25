// Журнал тренировок — офлайн-кэш. Меняйте VERSION при каждом обновлении файлов.
const VERSION = 'trenirovki-202610250938';
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192-v2.png", "./icons/icon-512-v2.png", "./icons/apple-touch-icon-v2.png", "./icons/favicon-32-v2.png"];

self.addEventListener('install', (e) => {
  // cache:'reload' — мимо HTTP-кэша браузера, иначе GitHub Pages может отдать прошлую версию
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys() // только свои кэши: на домене живёт и тестовая версия
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('trenirovki-') && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // база продуктов по штрихкоду — всегда напрямую в сеть, без кэша
  if (new URL(req.url).hostname.endsWith('openfoodfacts.org')) return;
  // база знаний обновляется раз в месяц — сначала сеть
  if (new URL(req.url).pathname.endsWith('/kb.json')) {
    e.respondWith(fetch(req, { cache: 'no-cache' }).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res; }).catch(() => caches.match(req)));
    return;
  }
  if (req.mode === 'navigate') {
    // Сначала сеть, чтобы обновления доходили; без сети — сохранённая копия.
    e.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  // Иконки и шрифты — из кэша, при первом обращении — из сети.
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
      return res;
    }))
  );
});
