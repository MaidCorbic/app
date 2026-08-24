(() => {
  if (window.__relayMobileHudNavV1) return;
  window.__relayMobileHudNavV1 = true;
  const mount = () => {
    if (!document.getElementById('play') || document.querySelector('.mobile-hud-nav')) return;
    const nav = document.createElement('div'); nav.className = 'mobile-hud-nav'; nav.setAttribute('aria-label','Game navigation');
    nav.innerHTML = '<button class="pause" type="button" data-mobile-nav="pause" aria-label="Pause game">PAUSE</button><button class="settings" type="button" data-mobile-nav="settings" aria-label="Open settings">SETTINGS</button>';
    document.body.appendChild(nav);
    const pause = nav.querySelector('[data-mobile-nav="pause"]');
    const settings = nav.querySelector('[data-mobile-nav="settings"]');
    const pauseButton = document.getElementById('pause');
    pause?.addEventListener('click', () => pauseButton?.click());
    settings?.addEventListener('click', () => {
      pauseButton?.click();
      window.setTimeout(() => document.querySelector('#pauseMenu [data-tab="settings"]')?.click(), 0);
    });
    const sync = () => { const hidden = !document.getElementById('play') || document.getElementById('play')?.classList.contains('hidden'); nav.hidden = hidden; };
    window.addEventListener('relay:runner-scene-ready', sync); window.addEventListener('relay:pause-state-change', sync); sync();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once:true }); else mount();
})();