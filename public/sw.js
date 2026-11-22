const CACHE_NAME = 'mushaf-libya-v3';
const APP_SHELL = ['/', '/manifest.webmanifest'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith('mushaf-libya-') && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' ||
      url.origin !== self.location.origin ||
      url.pathname.startsWith('/@') ||
      url.pathname.includes('/node_modules/')) return;

  const isNavigation = request.mode === 'navigate';
  const isOfflineCritical = url.pathname === '/assets/mushaf-qalun.pdf';
  const isStaticAsset = ['script', 'style', 'image', 'font', 'worker'].includes(request.destination);

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    // ملفات التطبيق والمصحف المحفوظة تُعرض فورًا دون انتظار الشبكة.
    if (!isNavigation && (isStaticAsset || isOfflineCritical)) {
      const cached = await cache.match(request);
      if (cached) {
        event.waitUntil((async () => {
          try {
            const fresh = await fetch(request);
            if (fresh.ok && fresh.status === 200 && fresh.type === 'basic' &&
                !fresh.headers.has('Content-Range')) {
              await cache.put(request, fresh.clone());
            }
          } catch { /* النسخة المحلية تكفي عند انقطاع الشبكة. */ }
        })());
        return cached;
      }
    }

    try {
      const response = await fetch(request);
      if (response.ok && response.status === 200 &&
          response.type === 'basic' && !response.headers.has('Content-Range')) {
        try { await cache.put(request, response.clone()); }
        catch (error) { console.warn('تعذر حفظ الملف دون إنترنت:', error); }
      }
      return response;
    } catch {
      const cached = await cache.match(request);
      if (cached) return cached;
      if (isNavigation) {
        const home = await cache.match('/');
        if (home) return home;
      }
      return new Response(
        'هذا الملف غير محفوظ على الجهاز بعد. اتصل بالإنترنت وافتحه مرة واحدة لتنزيله.',
        { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
      );
    }
  })());
});
