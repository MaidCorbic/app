/* Gameplay Audio Start Fix V4
 * Reliable bridge between Play/Continue gestures,
 * RunnerScene readiness and adaptive procedural music.
 *
 * No external audio assets required.
 */
(() => {
  'use strict';

  if (window.__relayGameplayAudioStartV4) return;
  window.__relayGameplayAudioStartV4 = true;

  let retryTimer = 0;
  let retryCount = 0;
  let startingPromise = null;

  const MAX_RETRIES = 60;
  const RETRY_DELAY = 150;

  const readState = () => {
    try {
      const value = JSON.parse(
        localStorage.getItem('relay-runner-state') || 'null'
      );

      return value && typeof value === 'object'
        ? value
        : {};
    } catch {
      return {};
    }
  };

  const getMusic = () => {
    const music = window.relayAdaptiveMusic;

    if (!music) {
      return null;
    }

    return music;
  };

  const getScene = () => {
    return window.__relayRunnerScene || null;
  };

  const bindScene = () => {
    const music = getMusic();
    const scene = getScene();

    if (
      !music ||
      !scene ||
      typeof music.bind !== 'function'
    ) {
      return false;
    }

    try {
      music.bind(scene);
      return true;
    } catch {
      return false;
    }
  };

  const applySettings = music => {
    const state = readState();

    if (state.muted === true) {
      music.setEnabled?.(false);
      return false;
    }

    const volume = Number.isFinite(
      Number(state.musicVolume)
    )
      ? Number(state.musicVolume)
      : 0.55;

    music.setEnabled?.(true);
    music.setVolume?.(volume);

    return true;
  };

  const isIntroHidden = () => {
    return !!document
      .getElementById('intro')
      ?.classList.contains('hidden');
  };

  const unlockAndStart = async () => {
    const music = getMusic();

    if (!music) {
      return false;
    }

    if (!isIntroHidden()) {
      return false;
    }

    if (!applySettings(music)) {
      return true;
    }

    /*
     * Scene must be bound before start().
     */
    bindScene();

    const stateBefore =
      music.getState?.();

    if (stateBefore?.running) {
      return true;
    }

    try {
      if (
        typeof music.unlock === 'function'
      ) {
        const unlocked =
          await music.unlock();

        if (unlocked === false) {
          return false;
        }
      }

      /*
       * The scene may have appeared while
       * unlock() was awaiting AudioContext.resume().
       * Bind once more before starting.
       */
      bindScene();

      const stateAfter =
        music.getState?.();

      if (stateAfter?.running) {
        return true;
      }

      music.start?.();

      return !!music.getState?.().running;
    } catch {
      return false;
    }
  };

  const stopRetry = () => {
    if (retryTimer) {
      window.clearTimeout(retryTimer);
      retryTimer = 0;
    }

    retryCount = 0;
  };

  const scheduleRetry = () => {
    stopRetry();

    retryCount = 0;

    const retry = async () => {
      retryTimer = 0;

      const music = getMusic();

      if (!music) {
        if (++retryCount >= MAX_RETRIES) {
          return;
        }

        retryTimer = window.setTimeout(
          retry,
          RETRY_DELAY
        );

        return;
      }

      const state = music.getState?.();

      if (
        state?.running ||
        state?.enabled === false
      ) {
        stopRetry();
        return;
      }

      const started =
        await unlockAndStart();

      if (
        started ||
        music.getState?.()?.running
      ) {
        stopRetry();
        return;
      }

      if (++retryCount >= MAX_RETRIES) {
        stopRetry();
        return;
      }

      retryTimer = window.setTimeout(
        retry,
        RETRY_DELAY
      );
    };

    retry();
  };

  const start = () => {
    if (startingPromise) {
      return startingPromise;
    }

    startingPromise =
      unlockAndStart()
        .then(started => {
          if (started) {
            stopRetry();
            return true;
          }

          scheduleRetry();
          return false;
        })
        .catch(() => {
          scheduleRetry();
          return false;
        })
        .finally(() => {
          startingPromise = null;
        });

    return startingPromise;
  };

  const isPlayGesture = event => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return false;
    }

    return !!target.closest(
      '#start,' +
      '#continue,' +
      '[data-v3-play],' +
      '[data-v3-continue],' +
      '[data-action="play"],' +
      '[data-action="continue"]'
    );
  };

  document.addEventListener(
    'pointerdown',
    event => {
      if (isPlayGesture(event)) {
        start();
      }
    },
    {
      capture: true,
      passive: true
    }
  );

  document.addEventListener(
    'keydown',
    event => {
      if (
        event.key === 'Enter' ||
        event.code === 'Space'
      ) {
        start();
      }
    },
    {
      capture: true,
      passive: true
    }
  );

  window.addEventListener(
    'relay:runner-scene-ready',
    event => {
      const scene =
        event?.detail?.scene;

      if (scene) {
        window.__relayRunnerScene =
          scene;
      }

      /*
       * Critical:
       * bind first, then start.
       * Do NOT let an old retry lock prevent this.
       */
      bindScene();

      start();
    },
    {
      passive: true
    }
  );

  /*
   * Fallback for cases where the intro becomes hidden
   * shortly after boot.
   */
  window.setTimeout(() => {
    if (isIntroHidden()) {
      start();
    }
  }, 500);

  /*
   * Public diagnostic/start API.
   */
  window.relayGameplayAudioStartV4 = {
    start,
    bindScene
  };
})();
