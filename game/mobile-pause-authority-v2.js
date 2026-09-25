/* ============================================================
   RELAY RUNNER — MOBILE PAUSE AUTHORITY V2
   One mobile entry point for PAUSE + SETTINGS on touch devices.
   Prevents duplicate legacy/cinematic click routes.
   ============================================================ */
(() => {
  'use strict';

  if (window.__relayMobilePauseAuthorityV2) return;
  window.__relayMobilePauseAuthorityV2 = true;

  const isMobile = () =>
    document.body.classList.contains('is-touch') &&
    matchMedia('(pointer: coarse)').matches &&
    matchMedia('(max-width: 900px)').matches;

  const getPauseButton = () => document.getElementById('pause');
  const getMobileEntry = () => document.querySelector('#mobilePauseButton, #mobileSettingsButton');
  const getPauseMenu = () => document.getElementById('pauseMenu');

  let opening = false;

  const waitForApi = async (timeout = 900) => {
    const start = performance.now();

    while (performance.now() - start < timeout) {
      const api = window.relayUnifiedCinematicUI;

      if (api && typeof api.openPause === 'function') {
        return api;
      }

      await new Promise(resolve => setTimeout(resolve, 16));
    }

    return null;
  };

  const openCanonicalPause = async tab => {
    if (opening) return;
    opening = true;

    try {
      const menu = getPauseMenu();

      if (!menu) return;

      /*
       * Mobile owns the actual pause entry. Do not route through
       * unified openPause() here: that path is also observed by the
       * cinematic bridge and can re-enter while the shell is mounting.
       */
      menu.setAttribute('data-pause-open', 'true');
      menu.setAttribute('aria-hidden', 'false');
      menu.classList.remove('hidden');

      const api = window.relayUnifiedCinematicUI;

      if (api && typeof api.renderPause === 'function') {
        api.renderPause(tab || 'resume');
      }

      /*
       * Runner pause/resume is owned by p1-gameplay-correctness-v1.js.
       * Do not call Phaser Scene.pause() here as a second authority: the
       * pauseMenu class mutation above is enough to trigger the P1 lock.
       * Keeping a single scene-state owner avoids pause-event re-entry.
       */
    } catch (error) {
      console.error('[RelayRunner] Mobile pause authority failed:', error);
    } finally {
      window.setTimeout(() => {
        opening = false;
      }, 180);
    }
  };

  const syncPauseLock = () => {
    const menu = getPauseMenu();
    const open = !!menu && !menu.classList.contains('hidden');
    document.body.classList.toggle('relay-mobile-pause-open', isMobile() && open);
  };

  const handleClick = event => {
    const button = event.target instanceof Element
      ? event.target.closest('#pause, #mobilePauseButton, #mobileSettingsButton')
      : null;

    if (!button) return;

    /*
     * The dedicated mobile HUD controls are self-identifying. Do not make
     * their click path depend on body.is-touch being synchronized in the
     * same frame; that creates a bootstrap/orientation race in mobile QA.
     * The legacy #pause button remains guarded by the mobile detector.
     */
    const isDedicatedMobileEntry =
      button.id === 'mobilePauseButton' ||
      button.id === 'mobileSettingsButton';

    if (!isDedicatedMobileEntry && !isMobile()) {
      return;
    }

    const tab = button.id === 'mobileSettingsButton'
      ? 'settings'
      : 'resume';

    /*
     * This capture-phase handler is the single mobile owner.
     * It prevents the old desktop/legacy route from firing a second time.
     */
    event.preventDefault();
    event.stopImmediatePropagation();

    // Defer the heavy pause-shell/render path out of the native click dispatch.
    // This keeps touch taps responsive and prevents automation from blocking on
    // synchronous UI construction.
    window.setTimeout(() => {
      void openCanonicalPause(tab);
    }, 0);
  };

  const install = () => {
    if (window.__relayMobilePauseAuthorityInstalledV2) {
      return true;
    }

    /*
     * Install the delegated mobile click owner independently of the HUD
     * creation order. The HUD is created dynamically during bootstrap, so
     * requiring #mobilePauseButton/#mobileSettingsButton to exist here can
     * leave the mobile controls without any click owner.
     */
    window.__relayMobilePauseAuthorityInstalledV2 = true;

    document.addEventListener('click', handleClick, true);

    const menu = getPauseMenu();

    if (menu) {
      new MutationObserver(syncPauseLock).observe(menu, {
        attributes: true,
        attributeFilter: ['class']
      });
    }

    syncPauseLock();
    return true;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }

  /*
   * The menu can be replaced during bootstrap. Keep the pause-lock observer
   * synchronized with the current pauseMenu without gating click ownership.
   */
  const observeShell = () => {
    if (!document.body) return;

    const observer = new MutationObserver(() => {
      const menu = getPauseMenu();

      if (!menu || menu.__relayMobilePauseLockObservedV2) {
        return;
      }

      menu.__relayMobilePauseLockObservedV2 = true;

      new MutationObserver(syncPauseLock).observe(menu, {
        attributes: true,
        attributeFilter: ['class']
      });

      syncPauseLock();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    const menu = getPauseMenu();

    if (menu) {
      menu.__relayMobilePauseLockObservedV2 = true;

      new MutationObserver(syncPauseLock).observe(menu, {
        attributes: true,
        attributeFilter: ['class']
      });
    }

    syncPauseLock();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeShell, { once: true });
  } else {
    observeShell();
  }

  window.relayMobilePauseV2 = Object.freeze({
    open: () => openCanonicalPause('resume'),
    openSettings: () => openCanonicalPause('settings')
  });
})();
