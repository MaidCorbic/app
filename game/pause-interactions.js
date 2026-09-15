/* Mobile in-game HUD: one safe entry point for PAUSE + SETTINGS. */
(() => {
  'use strict';

  if (window.__relayMobilePauseInteractionsV2) return;
  window.__relayMobilePauseInteractionsV2 = true;

  const PORTRAIT_GUARD_STYLE_ID = 'mobile-portrait-hud-rotate-style';

  const isTouchDevice = () =>
    document.body.classList.contains('is-touch') ||
    navigator.maxTouchPoints > 0 ||
    'ontouchstart' in window ||
    window.matchMedia?.('(pointer: coarse)').matches ||
    window.matchMedia?.('(hover: none)').matches;

  const visible = id => {
    const element = document.getElementById(id);
    return !!element && !element.classList.contains('hidden');
  };

  const installPortraitGuardStyle = () => {
    if (document.getElementById(PORTRAIT_GUARD_STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = PORTRAIT_GUARD_STYLE_ID;
    style.textContent = `
      /* =========================================================
         MOBILE PORTRAIT GUARD
         ========================================================= */
      @media (pointer: coarse) and (orientation: portrait) {
        html body.is-touch #cargoIntegrityV2,
        html body.is-touch #play .hud-xp,
        html body.is-touch #play #pause,
        html body.is-touch #mobileBottomHud .mobile-menu-pause {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }

        html body.is-touch .mobile-rotate-prompt.is-active {
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
      }

      /* =========================================================
         MOBILE CARGO INTEGRITY GUARD
         ========================================================= */
      @media (pointer: coarse) and (max-width: 900px) and (max-height: 600px),
             (pointer: coarse) and (max-width: 600px) and (max-height: 900px) {
        html body.is-touch #cargoIntegrityV2 {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      }

      /* =========================================================
         ROTATE DEVICE PROMPT
         ========================================================= */
      .mobile-rotate-prompt {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: none;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 10px;
        padding: 24px;
        box-sizing: border-box;
        text-align: center;
        pointer-events: none;
        user-select: none;
        -webkit-user-select: none;
        color: #eaffff;
        font: 950 clamp(16px, 4.4vw, 24px) / 1.05 "DM Mono", ui-monospace, monospace;
        letter-spacing: .18em;
        text-shadow: 0 0 8px rgba(141, 244, 255, .55), 0 0 24px rgba(141, 244, 255, .28), 0 0 40px rgba(255, 208, 110, .14);
        background: radial-gradient(circle at center, rgba(8, 28, 42, .34), rgba(1, 5, 10, .72) 60%, rgba(0, 0, 0, .86));
        backdrop-filter: blur(2px);
        -webkit-backdrop-filter: blur(2px);
        opacity: 0;
        visibility: hidden;
      }

      .mobile-rotate-prompt::before {
        content: "";
        width: 42px;
        height: 28px;
        border: 2px solid rgba(141, 244, 255, .84);
        border-radius: 6px;
        box-shadow: 0 0 14px rgba(141, 244, 255, .28), 0 0 26px rgba(255, 208, 110, .10);
        transform: rotate(90deg);
        opacity: .92;
      }

      .mobile-rotate-prompt::after {
        content: "LANDSCAPE MODE";
        color: #ffd06e;
        font: 900 8px / 1 "DM Mono", ui-monospace, monospace;
        letter-spacing: .22em;
        opacity: .74;
      }

      /* =========================================================
         MOBILE MENU HIT TARGETS
         ========================================================= */
      #mobileBottomHud .mobile-menu-button {
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
        -webkit-user-select: none;
      }

      #mobileBottomHud .mobile-menu-button:focus-visible {
        outline: 2px solid rgba(141, 244, 255, .95);
        outline-offset: 3px;
      }

      @media (prefers-reduced-motion: reduce) {
        .mobile-rotate-prompt { transition: none !important; }
      }
    `;

    document.head.appendChild(style);
  };

  const getPauseApi = () => {
    const api = window.relayUnifiedCinematicUI;
    return api && typeof api.openPause === 'function' ? api : null;
  };

  const fallbackOpenPause = tabName => {
    const pauseMenu = document.getElementById('pauseMenu');
    if (!pauseMenu) return false;

    pauseMenu.classList.remove('hidden');
    pauseMenu.setAttribute('aria-hidden', 'false');

    const pickTab = () => {
      const tab = pauseMenu.querySelector(
        `[data-pause-tab="${tabName}"], [data-tab="${tabName}"]`
      );
      if (tab) {
        tab.dispatchEvent(new MouseEvent('click', { bubbles: false, cancelable: true, view: window }));
        return;
      }
      if (!pauseMenu.classList.contains('hidden')) window.requestAnimationFrame(pickTab);
    };

    window.requestAnimationFrame(pickTab);
    return true;
  };

  const openPauseSafely = (tabName = 'resume') => {
    const api = getPauseApi();
    if (api) {
      try {
        api.openPause(tabName);
        return true;
      } catch (error) {
        console.error('[RelayRunner] Unified pause open failed:', error);
      }
    }
    return fallbackOpenPause(tabName);
  };

  const stopGameplayPointer = event => {
    event.preventDefault();
    event.stopPropagation();
  };

  const install = () => {
    installPortraitGuardStyle();

    const pauseMenu = document.getElementById('pauseMenu');
    const panel = pauseMenu?.querySelector('#panelContent');

    if (!pauseMenu || !panel || document.getElementById('mobileBottomHud')) return false;

    /* Pause-panel controls must never leak a pointer event into Phaser. */
    panel.addEventListener('pointerdown', event => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('input[type="range"], select, button, a')) event.stopPropagation();
    });

    const hud = document.createElement('div');
    hud.id = 'mobileBottomHud';
    hud.className = 'mobile-bottom-hud';
    hud.setAttribute('aria-label', 'Mobile gameplay menu');
    hud.innerHTML = `
      <button id="mobilePauseButton" class="mobile-menu-button mobile-menu-pause" type="button" aria-label="Pause game">
        <span aria-hidden="true">Ⅱ</span>
        <small>PAUSE</small>
      </button>
      <button id="mobileSettingsButton" class="mobile-menu-button mobile-menu-settings" type="button" aria-label="Open settings">
        <span aria-hidden="true">⚙</span>
        <small>SETTINGS</small>
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

    const pauseButton = hud.querySelector('#mobilePauseButton');
    const settingsButton = hud.querySelector('#mobileSettingsButton');

    /*
     * The unified controller owns the click route. These handlers only claim
     * the touch gesture so Phaser never receives the same tap. The bubble
     * fallback is used only when the unified API is not ready yet.
     */
    [pauseButton, settingsButton].filter(Boolean).forEach(button => {
      button.addEventListener('pointerdown', stopGameplayPointer, { passive: false });
      button.addEventListener('pointerup', event => event.stopPropagation(), { passive: true });
      button.addEventListener('pointercancel', event => event.stopPropagation(), { passive: true });
    });

    pauseButton?.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      if (!getPauseApi()) openPauseSafely('resume');
    });

    settingsButton?.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      if (!getPauseApi()) openPauseSafely('settings');
    });

    /* Keep the original top hamburger safe on touch/tablet as well. */
    document.getElementById('pause')?.addEventListener('pointerdown', stopGameplayPointer, { passive: false });

    const sync = () => {
      const active =
        isTouchDevice() &&
        visible('play') &&
        !visible('intro') &&
        !visible('finish') &&
        !visible('gameOver') &&
        pauseMenu.classList.contains('hidden');

      hud.classList.toggle('is-active', active);
      rotatePrompt.classList.toggle('is-active', active);
    };

    const observer = new MutationObserver(sync);
    [document.body, ...['intro', 'play', 'finish', 'gameOver'].map(id => document.getElementById(id)), pauseMenu]
      .filter(Boolean)
      .forEach(element => observer.observe(element, { attributes: true, attributeFilter: ['class'] }));

    window.addEventListener('resize', sync, { passive: true });
    window.addEventListener('orientationchange', sync, { passive: true });
    window.addEventListener('pageshow', sync, { passive: true });
    window.addEventListener('pagehide', () => {
      hud.classList.remove('is-active');
      rotatePrompt.classList.remove('is-active');
    }, { passive: true });

    sync();
    return true;
  };

  const boot = () => {
    if (install()) return;
    const observer = new MutationObserver(() => {
      if (install()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 5000);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();