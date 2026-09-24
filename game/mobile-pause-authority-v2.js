/* ============================================================
   RELAY RUNNER — MOBILE PAUSE AUTHORITY V2
   One mobile entry point: the original ☰ #pause button.
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
       * Do not click another button and do not call Phaser pause/resume.
       * The unified cinematic UI owns presentation; the P1 pause authority
       * observes #pauseMenu and owns the actual Runner scene state.
       */
      const api = await waitForApi();

      if (api) {
        api.openPause(tab || 'resume');
      } else {
        menu.classList.remove('hidden');
        menu.setAttribute('aria-hidden', 'false');
      }

      requestAnimationFrame(() => {
        menu.classList.remove('hidden');
        menu.setAttribute('aria-hidden', 'false');
      });
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
    if (!isMobile()) return;

    const button = event.target instanceof Element
      ? event.target.closest('#pause')
      : null;

    if (!button) return;

    /*
     * This capture-phase handler is the single mobile owner.
     * It prevents the old desktop/legacy route from firing a second time.
     */
    event.preventDefault();
    event.stopImmediatePropagation();

    openCanonicalPause('resume');
  };

  const install = () => {
    if (!getPauseButton()) return false;

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
   * The game shell can be created/replaced during bootstrap.
   * Keep a short observer only until #pause exists.
   */
  if (!getPauseButton()) {
    const observer = new MutationObserver(() => {
      if (install()) observer.disconnect();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 5000);
  }

  window.relayMobilePauseV2 = Object.freeze({
    open: () => openCanonicalPause('resume'),
    openSettings: () => openCanonicalPause('settings')
  });
})();
