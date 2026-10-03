/* CIEESC PLAY — aviso automático de atualização
   Compara a "assinatura" (ETag/Last-Modified) das páginas publicadas com a última vista neste aparelho.
   Se mudou, mostra: "CIEESC PLAY atualizado!". Não precisa editar nada a cada atualização.
   Para ver como fica: abra qualquer página com ?teste-aviso=1 no final do endereço. */
(function () {
  const CHAVE = 'ciee_assinatura';
  const ARQUIVOS = ['index.html', 'playing.html', 'admin.html', 'manifest.json'];
  let mostrando = false;

  const ler = () => { try { return localStorage.getItem(CHAVE); } catch (e) { return null; } };
  const gravar = v => { try { localStorage.setItem(CHAVE, v); } catch (e) {} };

  async function assinatura() {
    const partes = [];
    for (const a of ARQUIVOS) {
      try {
        const r = await fetch(a + '?_=' + Date.now(), { method: 'HEAD', cache: 'no-store' });
        if (!r.ok) return null;
        partes.push(r.headers.get('etag') || r.headers.get('last-modified') || r.headers.get('content-length') || '');
      } catch (e) { return null; }       // sem internet: não avisa nada
    }
    const s = partes.join('|');
    return partes.some(Boolean) ? s : null;
  }

  function aviso(novaAssinatura) {
    if (mostrando) return; mostrando = true;
    const css = getComputedStyle(document.documentElement);
    const c1 = css.getPropertyValue('--theme-primary').trim() || '#0056b3';
    const c2 = css.getPropertyValue('--theme-secondary').trim() || '#6f42c1';
    const box = document.createElement('div');
    box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite');
    box.style.cssText = 'position:fixed;left:50%;top:calc(12px + env(safe-area-inset-top,0px));transform:translate(-50%,-140%);z-index:99999;' +
      'width:min(92vw,420px);box-sizing:border-box;padding:12px 14px;border-radius:16px;color:#fff;font:700 .95rem Nunito,system-ui,sans-serif;' +
      'background:linear-gradient(135deg,' + c1 + ',' + c2 + ');box-shadow:0 10px 30px rgba(0,0,0,.35);display:flex;align-items:center;gap:10px;' +
      'transition:transform .45s cubic-bezier(.2,.9,.3,1.2)';
    box.innerHTML = '<span style="font-size:1.5rem">🎉</span>' +
      '<span style="flex:1;line-height:1.25">CIEESC PLAY atualizado!<br><small style="font-weight:600;opacity:.9">Há novidades disponíveis.</small></span>' +
      '<button type="button" id="aviso-ok" style="border:none;border-radius:12px;padding:8px 12px;background:#fff;color:' + c1 + ';font:800 .85rem Nunito,system-ui,sans-serif;cursor:pointer">Atualizar</button>' +
      '<button type="button" id="aviso-x" aria-label="Fechar" style="border:none;background:transparent;color:#fff;font-size:1.2rem;cursor:pointer;padding:4px">✕</button>';
    document.body.appendChild(box);
    requestAnimationFrame(() => { box.style.transform = 'translate(-50%,0)'; });
    try { if (navigator.vibrate) navigator.vibrate(80); } catch (e) {}
    const fechar = () => { box.style.transform = 'translate(-50%,-140%)'; setTimeout(() => box.remove(), 500); mostrando = false; };
    box.querySelector('#aviso-x').onclick = () => { if (novaAssinatura) gravar(novaAssinatura); fechar(); };
    box.querySelector('#aviso-ok').onclick = async () => {
      if (novaAssinatura) gravar(novaAssinatura);
      try { const reg = await navigator.serviceWorker.getRegistration(); if (reg) await reg.update(); } catch (e) {}
      location.reload();
    };
  }

  async function verificar() {
    const atual = await assinatura();
    if (!atual) return;
    const guardada = ler();
    if (!guardada) { gravar(atual); return; }      // primeiro acesso neste aparelho: só memoriza
    if (guardada !== atual) aviso(atual);
  }

  window.addEventListener('load', () => {
    if (/[?&]teste-aviso=1/.test(location.search)) { setTimeout(() => aviso(null), 800); return; }
    setTimeout(verificar, 3000);
    setInterval(verificar, 2 * 60 * 1000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') verificar(); });
  });
})();
