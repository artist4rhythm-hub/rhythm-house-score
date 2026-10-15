// 리듬 하우스 악보 앱 서비스 워커
// 앱 껍데기(화면 · 글씨체 · 로고)만 캐시하고, 악보 데이터(Firebase)는 항상 네트워크에서 가져옵니다.
// 파일을 고쳐 올릴 때는 아래 버전 숫자를 하나 올려 주세요.

const CACHE = 'rh-score-v3';
const SHELL = ['./', './index.html', './manifest.json', './logo.png', './icon-192.png', './icon-512.png',
               './fonts/Cafe24Danjunghae-v2.0.woff2', './fonts/Cafe24Simplehae-v2.0.woff2', './fonts/Cafe24Lovingu.ttf'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;   // Firebase · 구글 요청은 건드리지 않는다
  if (e.request.method !== 'GET') return;

  // 글씨체는 캐시 우선 (크고 바뀌지 않음)
  if (url.pathname.includes('/fonts/')) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
    return;
  }
  // 나머지는 네트워크 우선, 실패하면 캐시
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {}); }
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
