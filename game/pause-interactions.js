/* Pause/mobile interaction ownership.
 *
 * Desktop keeps the existing #pause button and pause menu. On touch devices,
 * gameplay controls get a dedicated fixed bottom HUD so the upper HUD cannot
 * move or restyle the controls accidentally.
 */
(() => {
  const install = () => {
    const pause = document.querySelector('#pause');
    const pauseMenu = document.querySelector('#pauseMenu');
    const panel = pauseMenu?.querySelector('#panelContent');
    if (!pause || !pauseMenu || !panel) return;

    // Keep range/select controls from bubbling into gameplay/pause handlers.
    panel.addEventListener('pointerdown', event => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.matches('input[type="range"], select')) event.stopPropagation();
    }, { passive: true });

    if (document.getElementById('mobileBottomHud')) return;

    const hud = document.createElement('div');
    hud.id = 'mobileBottomHud';
    hud.className = 'mobile-bottom-hud';
    hud.setAttribute('aria-label', 'In-game menu controls');
    hud.innerHTML = `
      <button id="mobilePauseButton" class="mobile-menu-button mobile-menu-pause" type="button" aria-label="Open pause menu">
        <span class="mobile-menu-icon" aria-hidden="true">Ⅱ</span>
        <small>PAUSE</small>
      </button>
      <button id="mobileSettingsButton" class="mobile-menu-button mobile-menu-settings" type="button" aria-label="Open game settings">
        <span class="mobile-menu-icon" aria-hidden="true">⚙</span>
        <small>SETTINGS</small>
      </button>`;
    document.body.append(hud);

    const mobilePause = hud.querySelector('#mobilePauseButton');
    const mobileSettings = hud.querySelector('#mobileSettingsButton');

    mobilePause?.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      pause.click();
    });

    mobileSettings?.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      if (pauseMenu.classList.contains('hidden')) pause.click();
      window.setTimeout(() => {
        const settingsTab = pauseMenu.querySelector('[data-tab="settings"]');
        if (settingsTab && !pauseMenu.classList.contains('hidden')) settingsTab.click();
      }, 0);
    });

    const syncHudVisibility = () => {
      const touch = document.body.classList.contains('is-touch');
      const introVisible = !document.getElementById('intro')?.classList.contains('hidden');
      const playVisible = !document.getElementById('play')?.classList.contains('hidden');
      const finishVisible = !document.getElementById('finish')?.classList.contains('hidden');
      const gameOverVisible = !document.getElementById('gameOver')?.classList.contains('hidden');
      const pauseVisible = !pauseMenu.classList.contains('hidden');

      hud.classList.toggle('is-active', touch && playVisible && !introVisible && !finishVisible && !gameOverVisible && !pauseVisible);
    };

    const observe = target => target && observer.observe(target, { attributes: true, attributeFilter: ['class'] });
    const observer = new MutationObserver(syncHudVisibility);
    observe(document.body);
    observe(document.getElementById('intro'));
    observe(document.getElementById('play'));
    observe(document.getElementById('finish'));
    observe(document.getElementById('gameOver'));
    observe(pauseMenu);

    const style = document.createElement('style');
    style.textContent = `
      body.is-touch #play .hud-actions>#pause{display:none!important}
      .mobile-bottom-hud{position:fixed;left:max(12px,env(safe-area-inset-left,0px) + 10px);right:max(12px,env(safe-area-inset-right,0px) + 10px);bottom:calc(max(22px,env(safe-area-inset-bottom,0px) + 16px) + 108px);z-index:850;display:none;align-items:center;justify-content:space-between;pointer-events:none}
      .mobile-bottom-hud.is-active{display:flex}
      .mobile-bottom-hud .mobile-menu-button{width:58px;height:58px;display:grid;place-items:center;align-content:center;gap:3px;padding:0;border:1px solid rgba(141,244,255,.58);border-radius:14px;background:linear-gradient(145deg,rgba(10,27,45,.98),rgba(3,10,19,.99));color:#e7fbff;box-shadow:0 12px 28px rgba(0,0,0,.45),0 0 22px rgba(141,244,255,.14),inset 0 1px 0 rgba(255,255,255,.07);font:900 18px/1 "DM Mono",monospace;letter-spacing:.2px;pointer-events:auto;touch-action:manipulation;-webkit-tap-highlight-color:transparent;cursor:pointer;transition:transform .12s ease,border-color .12s ease,box-shadow .12s ease,background .12s ease}
      .mobile-bottom-hud .mobile-menu-button small{font:900 7px/1 "DM Mono",monospace;letter-spacing:1px;color:#8ba2b7}
      .mobile-bottom-hud .mobile-menu-button:hover,.mobile-bottom-hud .mobile-menu-button:focus-visible{border-color:#ffd06e;box-shadow:0 14px 30px rgba(0,0,0,.5),0 0 24px rgba(255,208,110,.16),inset 0 1px 0 rgba(255,255,255,.08);outline:none;transform:translateY(-2px)}
      .mobile-bottom-hud .mobile-menu-button:active{transform:scale(.93)}
      .mobile-bottom-hud .mobile-menu-pause{border-color:rgba(141,244,255,.64)}
      .mobile-bottom-hud .mobile-menu-settings{border-color:rgba(255,208,110,.58);color:#fff1ba}
      .mobile-bottom-hud .mobile-menu-settings small{color:#ceb968}
      @media(max-width:380px){.mobile-bottom-hud{left:8px;right:8px;bottom:106px}.mobile-bottom-hud .mobile-menu-button{width:50px;height:50px;border-radius:12px;font-size:16px}.mobile-bottom-hud .mobile-menu-button small{font-size:6px}}
      @media(orientation:landscape) and (max-height:560px){.mobile-bottom-hud{bottom:96px}.mobile-bottom-hud .mobile-menu-button{width:50px;height:50px;border-radius:11px;font-size:16px}}
      @media(prefers-reduced-motion:reduce){.mobile-bottom-hud .mobile-menu-button{transition:none}}
    `;
    document.head.appendChild(style);
    syncHudVisibility();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
