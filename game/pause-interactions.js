/* Mobile in-game HUD: PAUSE + SETTINGS only during active gameplay. */
(() => {
  'use strict';

  const PORTRAIT_GUARD_STYLE_ID = 'mobile-portrait-hud-rotate-style';
  const MOBILE_HUD_ID = 'mobileBottomHud';
  const INSTALL_FLAG = '__relayMobilePauseHudV3';

  const isTouchDevice = () =>
    document.body.classList.contains('is-touch') ||
    navigator.maxTouchPoints > 0 ||
    'ontouchstart' in window ||
    window.matchMedia?.('(pointer: coarse)').matches ||
    window.matchMedia?.('(hover: none)').matches;

  const visible = id => {
    const element = document.getElementById(id);
    return !!element && !element.classList.contains('hidden') && !element.hidden;
  };

  const installPortraitGuardStyle = () => {
    if (document.getElementById(PORTRAIT_GUARD_STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = PORTRAIT_GUARD_STYLE_ID;
    style.textContent = `
      @media (pointer: coarse) and (orientation: portrait) {
        html body.is-touch #play .hud-xp,
        html body.is-touch #play #pause,
        html body.is-touch #mobileBottomHud .mobile-menu-pause {
          display:none !important;
          visibility:hidden !important;
          opacity:0 !important;
          pointer-events:none !important;
        }

        html body.is-touch .mobile-rotate-prompt.is-active {
          display:flex !important;
          visibility:visible !important;
          opacity:1 !important;
        }
      }

      .mobile-rotate-prompt {
        position:fixed;
        inset:0;
        z-index:10000;
        display:none;
        align-items:center;
        justify-content:center;
        flex-direction:column;
        gap:10px;
        padding:24px;
        box-sizing:border-box;
        text-align:center;
        pointer-events:none;
        user-select:none;
        -webkit-user-select:none;
        color:#eaffff;
        font:950 clamp(16px,4.4vw,24px)/1.05 "DM Mono",ui-monospace,monospace;
        letter-spacing:.18em;
        text-shadow:0 0 8px rgba(141,244,255,.55),0 0 24px rgba(141,244,255,.28);
        background:radial-gradient(circle at center,rgba(8,28,42,.34),rgba(1,5,10,.72) 60%,rgba(0,0,0,.86));
        backdrop-filter:blur(2px);
        -webkit-backdrop-filter:blur(2px);
        opacity:0;
        visibility:hidden;
      }

      .mobile-rotate-prompt::before {
        content:"";
        width:42px;
        height:28px;
        border:2px solid rgba(141,244,255,.84);
        border-radius:6px;
        box-shadow:0 0 14px rgba(141,244,255,.28);
        transform:rotate(90deg);
        opacity:.92;
      }

      .mobile-rotate-prompt::after {
        content:"LANDSCAPE MODE";
        color:#ffd06e;
        font:900 8px/1 "DM Mono",ui-monospace,monospace;
        letter-spacing:.22em;
        opacity:.74;
      }

      @media (prefers-reduced-motion: reduce) {
        .mobile-rotate-prompt { transition:none !important; }
      }
    `;
    document.head.appendChild(style);
  };

  const stopPointerLeak = element => {
    if (!element || element.__relayPointerShieldV3) return;
    element.__relayPointerShieldV3 = true;

    const block = event => {
      event.stopPropagation();
    };

    for (const type of ['pointerdown', 'pointerup', 'pointercancel', 'click', 'touchstart', 'touchend']) {
      element.addEventListener(type, block, { capture: true, passive: type.startsWith('touch') });
    }
  };

  const getUnifiedApi = () => {
    const api = window.relayUnifiedCinematicUI;
    return api && typeof api.openPause === 'function' ? api : null;
  };

  const waitForUnifiedPause = tabName => {
    const started = performance.now();
    const deadline = started + 900;

    const tryOpen = () => {
      const api = getUnifiedApi();
      if (api) {
        try {
          api.openPause(tabName);
          return;
        } catch (error) {
          console.error('[RelayRunner] unified pause failed', error);
        }
      }

      const pauseMenu = document.getElementById('pauseMenu');
      if (pauseMenu) {
        pauseMenu.classList.remove('hidden');
        pauseMenu.setAttribute('aria-hidden', 'false');
        const tab = pauseMenu.querySelector(`[data-pause-tab="${tabName}"], [data-tab="${tabName}"]`);
        if (tab) {
          tab.click();
          return;
        }
      }

      if (performance.now() < deadline) {
        requestAnimationFrame(tryOpen);
      }
    };

    requestAnimationFrame(tryOpen);
  };

  const install = () => {
    installPortraitGuardStyle();

    const pauseMenu = document.getElementById('pauseMenu');
    const panel = pauseMenu?.querySelector('#panelContent');
    if (!pauseMenu || !panel || document.getElementById(MOBILE_HUD_ID)) return false;

    const hud = document.createElement('div');
    hud.id = MOBILE_HUD_ID;
    hud.className = 'mobile-bottom-hud';
    hud.innerHTML = `
      <button id="mobilePauseButton" class="mobile-menu-button mobile-menu-pause" type="button" aria-label="Pause game">
        <span aria-hidden="true">Ⅱ</span><small>PAUSE</small>
      </button>
      <button id="mobileSettingsButton" class="mobile-menu-button mobile-menu-settings" type="button" aria-label="Open settings">
        <span aria-hidden="true">⚙</span><small>SETTINGS</small>
      </button>
    `;
    document.body.appendChild(hud);

    const rotatePrompt = document.createElement('div');
    rotatePrompt.id = 'mobileRotatePrompt';
    rotatePrompt.className = 'mobile-rotate-prompt';
    rotatePrompt.setAttribute('role', 'status');
    rotatePrompt.setAttribute('aria-live', 'polite');
    rotatePrompt.textContent = 'ROTATE YOUR DEVICE';
    document.body.appendChild(rotatePrompt);

    stopPointerLeak(hud);
    stopPointerLeak(panel);

    const openPause = tabName => {
      if (!isTouchDevice()) return;
      if (!visible('play') || visible('finish') || visible('gameOver')) return;
      waitForUnifiedPause(tabName);
    };

    hud.querySelector('#mobilePauseButton')?.addEventListener('pointerup', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      openPause('resume');
    }, { passive: false });

    hud.querySelector('#mobileSettingsButton')?.addEventListener('pointerup', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      openPause('settings');
    }, { passive: false });

    hud.querySelector('#mobilePauseButton')?.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
    });

    hud.querySelector('#mobileSettingsButton')?.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
    });

    const sync = () => {
      const activeGameplay =
        isTouchDevice() &&
        visible('play') &&
        !visible('intro') &&
        !visible('finish') &&
        !visible('gameOver') &&
        pauseMenu.classList.contains('hidden');

      hud.classList.toggle('is-active', activeGameplay);
      rotatePrompt.classList.toggle('is-active', activeGameplay);
    };

    const observer = new MutationObserver(sync);
    for (const element of [document.body, document.getElementById('play'), document.getElementById('intro'), document.getElementById('finish'), document.getElementById('gameOver'), pauseMenu].filter(Boolean)) {
      observer.observe(element, { attributes:true, attributeFilter:['class','hidden'] });
    }

    window.addEventListener('resize', sync, { passive:true });
    window.addEventListener('orientationchange', sync, { passive:true });
    sync();

    window[INSTALL_FLAG] = true;
    return true;
  };

  const boot = () => {
    if (window[INSTALL_FLAG]) return;
    if (install()) return;

    const observer = new MutationObserver(() => {
      if (window[INSTALL_FLAG]) {
        observer.disconnect();
        return;
      }
      if (install()) observer.disconnect();
    });

    observer.observe(document.body, { childList:true, subtree:true });
    window.setTimeout(() => observer.disconnect(), 6000);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
