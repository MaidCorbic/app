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
