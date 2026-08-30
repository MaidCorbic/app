/* Mobile in-game HUD: PAUSE + SETTINGS only during active gameplay. */
(() => {
  const install = () => {
    const pause = document.querySelector('#pause');
    const pauseMenu = document.querySelector('#pauseMenu');
    const panel = pauseMenu?.querySelector('#panelContent');
    if (!pause || !pauseMenu || !panel || document.getElementById('mobileBottomHud')) return;

    panel.addEventListener('pointerdown', event => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.matches('input[type="range"], select, button, a')) event.stopPropagation();
    });

    const hud = document.createElement('div');
    hud.id = 'mobileBottomHud';
    hud.className = 'mobile-bottom-hud';
    hud.innerHTML = `
      <button id="mobilePauseButton" class="mobile-menu-button mobile-menu-pause" type="button" aria-label="Pause">
        <span aria-hidden="true">Ⅱ</span><small>PAUSE</small>
      </button>
      <button id="mobileSettingsButton" class="mobile-menu-button mobile-menu-settings" type="button" aria-label="Settings">
        <span aria-hidden="true">⚙</span><small>SETTINGS</small>
      </button>`;
    document.body.append(hud);

    const openPause = () => {
      if (pauseMenu.classList.contains('hidden')) pause.click();
    };

    hud.querySelector('#mobilePauseButton')?.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      openPause();
    });

    hud.querySelector('#mobileSettingsButton')?.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      openPause();
      window.setTimeout(() => {
        const tab = pauseMenu.querySelector('[data-tab="settings"]');
        if (tab && !pauseMenu.classList.contains('hidden')) tab.click();
      }, 0);
    });

    const visible = id => {
      const el = document.getElementById(id);
      return !!el && !el.classList.contains('hidden');
    };

    const sync = () => {
      const active = document.body.classList.contains('is-touch') &&
        visible('play') && !visible('intro') && !visible('finish') &&
        !visible('gameOver') && pauseMenu.classList.contains('hidden');
      hud.classList.toggle('is-active', active);
    };

    const observer = new MutationObserver(sync);
    [document.body, ...['intro','play','finish','gameOver'].map(id => document.getElementById(id)), pauseMenu]
      .filter(Boolean)
      .forEach(el => observer.observe(el, { attributes: true, attributeFilter: ['class'] }));

    const style = document.createElement('style');
    style.textContent = `
      body.is-touch #play .hud-actions>#pause{display:none!important}
      .mobile-bottom-hud{position:fixed;inset:auto 12px calc(env(safe-area-inset-bottom,0px) + 18px);z-index:900;display:none;align-items:flex-end;justify-content:space-between;pointer-events:none}
      .mobile-bottom-hud.is-active{display:flex}
      .mobile-menu-button{width:62px;height:62px;padding:0;display:grid;place-items:center;align-content:center;gap:4px;border:1px solid rgba(141,244,255,.7);border-radius:16px;background:linear-gradient(145deg,rgba(9,28,48,.98),rgba(2,9,17,.99));color:#eafcff;box-shadow:0 10px 28px rgba(0,0,0,.5),0 0 24px rgba(80,220,255,.2),inset 0 1px 0 rgba(255,255,255,.09);font:900 19px/1 "DM Mono",monospace;pointer-events:auto;touch-action:manipulation;-webkit-tap-highlight-color:transparent;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease,border-color .12s ease}
      .mobile-menu-button small{font:900 7px/1 "DM Mono",monospace;letter-spacing:1.2px;color:#91a9bd}
      .mobile-menu-button:active{transform:scale(.92)}
      .mobile-menu-button:focus-visible{outline:none;transform:translateY(-2px);border-color:#fff}
      .mobile-menu-settings{border-color:rgba(255,208,110,.7);color:#fff0b5;box-shadow:0 10px 28px rgba(0,0,0,.5),0 0 24px rgba(255,208,110,.16),inset 0 1px 0 rgba(255,255,255,.09)}
      .mobile-menu-settings small{color:#d4bf70}
      @media(max-width:380px){.mobile-bottom-hud{inset:auto 8px calc(env(safe-area-inset-bottom,0px) + 14px)}.mobile-menu-button{width:54px;height:54px;border-radius:14px;font-size:17px}.mobile-menu-button small{font-size:6px}}
      @media(orientation:landscape) and (max-height:560px){.mobile-bottom-hud{bottom:12px}.mobile-menu-button{width:50px;height:50px;border-radius:12px}}
      @media(prefers-reduced-motion:reduce){.mobile-menu-button{transition:none}}
    `;
    document.head.appendChild(style);
    sync();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
