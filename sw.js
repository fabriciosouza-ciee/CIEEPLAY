// Troque o número da versão a cada atualização dos arquivos para o celular baixar a nova versão.
const VERSAO = 'ciee-play-v6';
const ARQUIVOS = ['./', './index.html', './playing.html', './admin.html', './manifest.json',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/maskable-512.png', './icons/favicon-48.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))));
  self.clients.claim();
});
// Páginas do app: tenta a internet primeiro (sempre atualizado) e usa o cache se estiver sem sinal.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;           // fontes, Outlook etc. seguem direto pela rede
  e.respondWith(
    fetch(req).then(res => {
      const copia = res.clone();
      caches.open(VERSAO).then(c => c.put(req, copia));
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
