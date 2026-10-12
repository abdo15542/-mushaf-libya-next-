
const CACHE_NAME = 'mushaf-libya-v2';

const APP_SHELL = [
  '/',
  '/manifest.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(APP_SHELL);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter(
            key =>
              key.startsWith('mushaf-libya-') &&
              key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // تجاهل الطلبات التي لا تخص ملفات التطبيق.
  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/@') ||
    url.pathname.includes('/node_modules/')
  ) {
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      try {
        // الاتصال بالإنترنت أولًا للحصول على أحدث نسخة.
        const response = await fetch(request);

        // تخزين الردود الكاملة والناجحة فقط.
        if (
          response.ok &&
          response.status === 200 &&
          response.type === 'basic' &&
          !response.headers.has('Content-Range')
        ) {
          try {
            await cache.put(request, response.clone());
          } catch (cacheError) {
            // لا نمنع عرض الملف إذا تعذر تخزينه.
            console.warn(
              'تعذر تخزين الملف للاستخدام دون إنترنت:',
              cacheError
            );
          }
        }

        return response;
      } catch (networkError) {
        // عند انقطاع الإنترنت، استخدم النسخة المخزنة.
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
          return cachedResponse;
        }

        // محاولة فتح الصفحة الرئيسية عند انقطاع الإنترنت.
        if (request.mode === 'navigate') {
          const home = await cache.match('/');

          if (home) {
            return home;
          }
        }

        // لا توجد نسخة محفوظة لهذا الملف.
        return new Response(
          'هذا الملف غير متاح دون إنترنت. اتصل بالإنترنت وافتحه أولًا.',
          {
            status: 503,
            headers: {
              'Content-Type': 'text/plain; charset=utf-8'
            }
          }
        );
      }
    })()
  );
});
