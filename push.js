/* CIEESC PLAY — notificações push (OneSignal)
   1) Cole abaixo o App ID do OneSignal (Settings > Keys & IDs). O App ID não é secreto. */
const PUSH_APP_ID = 'f5587a67-7481-4538-bfd2-7746b9e1038a';

(function () {
  if (!PUSH_APP_ID || PUSH_APP_ID.startsWith('f5587a67-7481-4538-bfd2-7746b9e1038a')) return;      // ainda não configurado

  const base = location.pathname.replace(/[^/]*$/, '');                  // ex.: /CIEESC_PLAY/
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  const s = document.createElement('script');
  s.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'; s.defer = true;
  document.head.appendChild(s);

  OneSignalDeferred.push(async function (OneSignal) {
    await OneSignal.init({
      appId: PUSH_APP_ID,
      serviceWorkerPath: 'sw.js',                       // usa o mesmo service worker do app
      serviceWorkerParam: { scope: base },
      allowLocalhostAsSecureOrigin: true,
      notifyButton: { enable: false }
    });
    try {                                               // etiquetas para segmentar (opcional)
      const ss = JSON.parse(localStorage.getItem('ciee_session') || 'null');
      if (ss) { OneSignal.User.addTag('nivel', String(ss.nivel || 1)); if (ss.cidade) OneSignal.User.addTag('cidade', String(ss.cidade)); }
    } catch (e) {}
  });

  const suportado = 'Notification' in window && 'serviceWorker' in navigator;
  const estado = () => (suportado ? Notification.permission : 'indisponivel');

  window.cieescPush = {
    estado,
    ativar() {
      if (!suportado) return alert('Para receber notificações no iPhone, adicione o app à Tela de Início (Compartilhar › Adicionar à Tela de Início) e abra por lá. Requer iOS 16.4 ou mais novo.');
      OneSignalDeferred.push(async function (OneSignal) {
        await OneSignal.Notifications.requestPermission();
        document.dispatchEvent(new Event('ciee-push-mudou'));
      });
    }
  };

  // ---- Cartão em Configurações + convite único após alguns segundos ----
  function cartaoConfig() {
    const sec = document.getElementById('tab-configuracoes'); if (!sec || document.getElementById('push-card')) return;
    const c = document.createElement('div'); c.id = 'push-card';
    c.style.cssText = 'margin:16px;padding:14px 16px;border:2px solid var(--border-color,#e2e8f0);border-radius:18px;background:var(--bg-card,#fff);color:var(--text-dark,#2d3748);font-weight:700';
    sec.appendChild(c);
    const pinta = () => {
      const e = estado();
      c.innerHTML = '<div style="font-family:Fredoka,sans-serif;font-size:1.05rem;margin-bottom:6px">🔔 Notificações</div>' +
        (e === 'granted' ? '<div>Ativadas ✅ Você receberá o aviso "CIEESC PLAY atualizado!".</div>' :
         e === 'denied' ? '<div>Bloqueadas neste aparelho. Libere nas configurações do navegador/app para receber avisos.</div>' :
         '<div style="margin-bottom:10px;font-weight:600">Receba um aviso quando o CIEESC PLAY for atualizado.</div><button type="button" class="btn-action" id="push-btn">🔔 Ativar notificações</button>');
      const b = c.querySelector('#push-btn'); if (b) b.onclick = () => window.cieescPush.ativar();
    };
    pinta(); document.addEventListener('ciee-push-mudou', () => setTimeout(pinta, 600));
  }
  function convite() {
    if (estado() !== 'default' || localStorage.getItem('ciee_push_dispensado')) return;
    const t = document.createElement('div');
    t.style.cssText = 'position:fixed;left:50%;bottom:calc(86px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:99998;width:min(92vw,420px);box-sizing:border-box;padding:12px 14px;border-radius:16px;color:#fff;font:700 .9rem Nunito,system-ui,sans-serif;background:linear-gradient(135deg,var(--theme-primary,#0056b3),var(--theme-secondary,#6f42c1));box-shadow:0 10px 30px rgba(0,0,0,.35);display:flex;align-items:center;gap:10px';
    t.innerHTML = '<span style="font-size:1.4rem">🔔</span><span style="flex:1">Quer receber avisos quando o CIEESC PLAY for atualizado?</span>' +
      '<button type="button" id="p-ok" style="border:none;border-radius:12px;padding:8px 12px;background:#fff;color:#0056b3;font:800 .85rem Nunito,sans-serif;cursor:pointer">Ativar</button>' +
      '<button type="button" id="p-x" aria-label="Agora não" style="border:none;background:transparent;color:#fff;font-size:1.2rem;cursor:pointer">✕</button>';
    document.body.appendChild(t);
    t.querySelector('#p-ok').onclick = () => { t.remove(); window.cieescPush.ativar(); };
    t.querySelector('#p-x').onclick = () => { t.remove(); try { localStorage.setItem('ciee_push_dispensado', '1'); } catch (e) {} };
  }
  window.addEventListener('load', () => {
    if (/playing\.html$/.test(location.pathname)) { cartaoConfig(); setTimeout(convite, 10000); }
  });
})();
