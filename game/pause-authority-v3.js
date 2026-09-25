import './unified-cinematic-ui-v1.js';

(() => {
  'use strict';

  if (window.__relayPauseAuthorityV3) return;
  window.__relayPauseAuthorityV3 = true;

  const getMenu = () => document.getElementById('pauseMenu');

  const getRunner = () =>
    window.__relayRunnerScene ||
    window.game?.scene?.getScene?.('runner') ||
    null;

  let transition = false;
  let pausedByAuthority = false;
  let pauseFrame = 0;

  const isOpen = () => {
    const menu = getMenu();
    return !!menu && menu.dataset.pauseOpen === 'true';
  };

  const setMenuVisible = visible => {
    const menu = getMenu();
    if (!menu) return false;

    if (visible) {
      menu.setAttribute('data-pause-open', 'true');
      menu.setAttribute('aria-hidden', 'false');
    } else {
      menu.setAttribute('data-pause-open', 'false');
      menu.setAttribute('aria-hidden', 'true');
    }

    return true;
  };

  const pauseRunnerAfterPaint = () => {
    if (pauseFrame) {
      cancelAnimationFrame(pauseFrame);
      pauseFrame = 0;
    }

    pauseFrame = requestAnimationFrame(() => {
      pauseFrame = 0;

      if (!isOpen()) return;

      const scene = getRunner();
      if (!scene?.scene) return;

      try {
        if (!scene.scene.isPaused?.()) {
          scene.scene.pause();
          pausedByAuthority = true;
        }
      } catch (error) {
        console.error(
          '[RelayRunner] Pause authority pause failed:',
          error
        );
      }
    });
  };

  const resumeRunner = () => {
    if (pauseFrame) {
      cancelAnimationFrame(pauseFrame);
      pauseFrame = 0;
    }

    const scene = getRunner();

    if (!scene?.scene) {
      pausedByAuthority = false;
      return;
    }

    try {
      if (pausedByAuthority && scene.scene.isPaused?.()) {
        scene.scene.resume();
      }
    } catch (error) {
      console.error(
        '[RelayRunner] Pause authority resume failed:',
        error
      );
    } finally {
      pausedByAuthority = false;
    }
  };

  const open = (tab = 'resume') => {
    if (transition) return false;
    transition = true;

    try {
      const api = window.relayUnifiedCinematicUI;

      if (api && typeof api.openPause === 'function') {
        api.openPause(tab || 'resume');
      } else {
        setMenuVisible(true);
      }

      /*
       * The DOM is painted first. Phaser's scene pause is queued for
       * the next frame, which matches Phaser's scene lifecycle semantics.
       */
      pauseRunnerAfterPaint();
      return true;
    } catch (error) {
      console.error(
        '[RelayRunner] Pause authority open failed:',
        error
      );
      return false;
    } finally {
      window.setTimeout(() => {
        transition = false;
      }, 0);
    }
  };

  const close = () => {
    if (transition) return false;
    transition = true;

    try {
      setMenuVisible(false);
      resumeRunner();
      return true;
    } catch (error) {
      console.error(
        '[RelayRunner] Pause authority close failed:',
        error
      );
      return false;
    } finally {
      window.setTimeout(() => {
        transition = false;
      }, 0);
    }
  };

  const handleClick = event => {
    const target =
      event.target instanceof Element
        ? event.target
        : null;

    if (!target) return;

    const pauseButton =
      target.closest('#pause, #mobilePauseButton');

    if (pauseButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      open('resume');
      return;
    }

    const settingsButton =
      target.closest('#mobileSettingsButton');

    if (settingsButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      open('settings');
      return;
    }

    const resumeButton =
      target.closest(
        [
          '#pauseMenu [data-pause-tab="resume"]',
          '#pauseMenu [data-tab="resume"]',
          '#pauseMenu [data-action="resume"]',
          '#pauseMenu #resume',
          '#pauseMenu #resumeGame',
          '#pauseMenu .pause-resume',
          '#pauseMenu [data-close]'
        ].join(',')
      );

    if (resumeButton && isOpen()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      close();
    }
  };

  const handleKeydown = event => {
    if (event.key !== 'Escape' || !isOpen()) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    close();
  };

  document.addEventListener('click', handleClick, true);
  document.addEventListener('keydown', handleKeydown, true);

  window.relayPauseAuthorityV3 = Object.freeze({
    open,
    openSettings: () => open('settings'),
    close,
    isOpen
  });
})();
