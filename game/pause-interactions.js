/* Mobile in-game HUD: PAUSE + SETTINGS only during active gameplay. */
(() => {
  const isTouchDevice = () => document.body.classList.contains('is-touch');

  const install = () => {
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

      if (
        target?.matches(
          'input[type="range"], select, button, a'
        )
      ) {
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

    const openPause = (tabName = null) => {
      if (pauseMenu.classList.contains('hidden')) {
        pause.click();
      }

      if (!tabName) return;

      const deadline = performance.now() + 750;

      const selectTab = () => {
        if (pauseMenu.classList.contains('hidden')) {
          if (performance.now() < deadline) {
            requestAnimationFrame(selectTab);
          }

          return;
        }

        const tab = pauseMenu.querySelector(
          `[data-tab="${tabName}"]`
        );

        if (tab) {
          tab.click();
          return;
        }

        if (performance.now() < deadline) {
          requestAnimationFrame(selectTab);
        }
      };

      requestAnimationFrame(selectTab);
    };

    hud.querySelector('#mobilePauseButton')?.addEventListener(
      'click',
      event => {
        event.preventDefault();
        event.stopPropagation();

        openPause();
      }
    );

    hud.querySelector('#mobileSettingsButton')?.addEventListener(
      'click',
      event => {
        event.preventDefault();
        event.stopPropagation();

        openPause('settings');
      }
    );

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

    const style = document.createElement('style');

    style.textContent = `
      /* Mobile in-game menu controls: keep them clear of gameplay controls. */
      .mobile-bottom-hud {
        position: fixed;
        top: max(58px, calc(env(safe-area-inset-top, 0px) + 54px));
        right: max(10px, calc(env(safe-area-inset-right, 0px) + 10px));
        bottom: auto;
        left: auto;
        z-index: 1200;
        display: none;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        pointer-events: none;
      }

      .mobile-bottom-hud.is-active { display: flex; }

      .mobile-menu-button {
        width: 54px;
        height: 54px;
        padding: 0;
        display: grid;
        place-items: center;
        align-content: center;
        gap: 4px;
        border: 1px solid rgba(255, 208, 110, .70);
        border-radius: 14px;
        background: linear-gradient(145deg, rgba(28, 22, 10, .98), rgba(7, 6, 3, .99));
        color: #fff0b5;
        box-shadow: 0 10px 28px rgba(0,0,0,.5), 0 0 24px rgba(255,208,110,.18), inset 0 1px 0 rgba(255,255,255,.09);
        font: 900 17px/1 "DM Mono", monospace;
        pointer-events: auto;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
        cursor: pointer;
        transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease;
      }

      .mobile-menu-button small {
        font: 900 6px/1 "DM Mono", monospace;
        letter-spacing: 1px;
        color: #d4bf70;
      }

      .mobile-menu-button:active { transform: scale(.92); }
      .mobile-menu-button:focus-visible { outline: none; border-color: #fff; }

      @media (orientation: landscape) {
        body.is-touch #play .hud-actions > #pause {
          display: grid !important;
          place-items: center !important;
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: auto !important;
        }

        body.is-touch #mobileBottomHud {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      }

      @media (orientation: portrait) and (max-width: 380px) {
        .mobile-bottom-hud {
          top: max(54px, calc(env(safe-area-inset-top, 0px) + 50px));
          right: max(7px, calc(env(safe-area-inset-right, 0px) + 7px));
          gap: 6px;
        }

        .mobile-menu-button {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          font-size: 15px;
        }

        .mobile-menu-button small { font-size: 5px; }
      }

      @media (prefers-reduced-motion: reduce) {
        .mobile-menu-button { transition: none; }
      }
    `;

    document.head.appendChild(style);

    sync();

    return true;
  };

  const boot = () => {
    if (install()) return;

    const observer = new MutationObserver(() => {
      if (install()) {
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    window.setTimeout(
      () => observer.disconnect(),
      5000
    );
  };

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      boot,
      { once: true }
    );
  } else {
    boot();
  }
})();
