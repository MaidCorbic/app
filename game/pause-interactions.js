/* Mobile in-game HUD: PAUSE + SETTINGS only during active gameplay. */
(() => {
  const PORTRAIT_GUARD_STYLE_ID = 'mobile-portrait-hud-rotate-style';

  const isTouchDevice = () => document.body.classList.contains('is-touch');

  const installPortraitGuardStyle = () => {
    if (document.getElementById(PORTRAIT_GUARD_STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = PORTRAIT_GUARD_STYLE_ID;
    style.textContent = `
      /* Portrait phones: remove landscape-only gameplay HUD and show the rotate state. */
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
        font: 950 clamp(16px, 4.4vw, 24px)/1.05 "DM Mono", ui-monospace, monospace;
        letter-spacing: .18em;
        text-shadow:
          0 0 8px rgba(141,244,255,.55),
          0 0 24px rgba(141,244,255,.28),
          0 0 40px rgba(255,208,110,.14);
        background:
          radial-gradient(circle at center, rgba(8,28,42,.34), rgba(1,5,10,.72) 60%, rgba(0,0,0,.86));
        backdrop-filter: blur(2px);
        -webkit-backdrop-filter: blur(2px);
        opacity: 0;
        visibility: hidden;
      }

      .mobile-rotate-prompt::before {
        content: "";
        width: 42px;
        height: 28px;
        border: 2px solid rgba(141,244,255,.84);
        border-radius: 6px;
        box-shadow:
          0 0 14px rgba(141,244,255,.28),
          0 0 26px rgba(255,208,110,.10);
        transform: rotate(90deg);
        opacity: .92;
      }

      .mobile-rotate-prompt::after {
        content: "LANDSCAPE MODE";
        color: #ffd06e;
        font: 900 8px/1 "DM Mono", ui-monospace, monospace;
        letter-spacing: .22em;
        opacity: .74;
      }

      @media (prefers-reduced-motion: reduce) {
        .mobile-rotate-prompt {
          transition: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const install = () => {
    installPortraitGuardStyle();

    const pause = document.querySelector('#pause');
    const pauseMenu = document.querySelector('#pauseMenu');
    const panel = pauseMenu?.querySelector('#panelContent');

    if (
      !pause ||
      !pauseMenu ||
      !panel ||
      document.getElementById('mobileBottomHud')
    ) {
      return false;
    }

    panel.addEventListener('pointerdown', event => {
      const target = event.target instanceof Element ? event.target : null;

      if (target?.matches('input[type="range"], select, button, a')) {
        event.stopPropagation();
      }
    });

    const hud = document.createElement('div');
    hud.id = 'mobileBottomHud';
    hud.className = 'mobile-bottom-hud';

    hud.innerHTML = `
      <button
        id="mobilePauseButton"
        class="mobile-menu-button mobile-menu-pause"
        type="button"
        aria-label="Pause"
      >
        <span aria-hidden="true">Ⅱ</span>
        <small>PAUSE</small>
      </button>

      <button
        id="mobileSettingsButton"
        class="mobile-menu-button mobile-menu-settings"
        type="button"
        aria-label="Settings"
      >
        <span aria-hidden="true">⚙</span>
        <small>SETTINGS</small>
      </button>
    `;

    document.body.append(hud);

    const rotatePrompt = document.createElement('div');
    rotatePrompt.id = 'mobileRotatePrompt';
    rotatePrompt.className = 'mobile-rotate-prompt';
    rotatePrompt.setAttribute('role', 'status');
    rotatePrompt.setAttribute('aria-live', 'polite');
    rotatePrompt.textContent = 'ROTATE YOUR DEVICE';
    document.body.append(rotatePrompt);

    const openPause = (tabName = null) => {
      if (pauseMenu.classList.contains('hidden')) {
        pause.click();
      }

      if (!tabName) return;

      const deadline = performance.now() + 750;

      const selectTab = () => {
        if (pauseMenu.classList.contains('hidden')) {
          if (performance.now() < deadline) requestAnimationFrame(selectTab);
          return;
        }

        const tab = pauseMenu.querySelector(`[data-tab="${tabName}"]`);
        if (tab) {
          tab.click();
          return;
        }

        if (performance.now() < deadline) requestAnimationFrame(selectTab);
      };

      requestAnimationFrame(selectTab);
    };

    hud.querySelector('#mobilePauseButton')?.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      openPause();
    });

    hud.querySelector('#mobileSettingsButton')?.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      openPause('settings');
    });

    const visible = id => {
      const el = document.getElementById(id);
      return !!el && !el.classList.contains('hidden');
    };

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

    [
      document.body,
      ...['intro', 'play', 'finish', 'gameOver']
        .map(id => document.getElementById(id)),
      pauseMenu
    ]
      .filter(Boolean)
      .forEach(el => {
        observer.observe(el, {
          attributes: true,
          attributeFilter: ['class']
        });
      });

    window.addEventListener('resize', sync, { passive: true });
    window.addEventListener('orientationchange', sync, { passive: true });

    sync();
    return true;
  };

  const boot = () => {
    if (install()) return;

    const observer = new MutationObserver(() => {
      if (install()) observer.disconnect();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    window.setTimeout(() => observer.disconnect(), 5000);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
