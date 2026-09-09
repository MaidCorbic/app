/* Gameplay Audio Start Fix V3
 * Reliable bridge between Play/Continue gestures,
 * RunnerScene readiness and adaptive procedural music.
 *
 * Compatible with existing gameplay hardening.
 * No external audio assets required.
 */
(() => {
  'use strict';

  if (window.__relayGameplayAudioStartV3) {
    return;
  }

  window.__relayGameplayAudioStartV3 = true;

  let retryTimer = 0;
  let retryCount = 0;
  let startingPromise = null;
  let lastGestureTime = 0;

  const MAX_RETRIES = 60;
  const RETRY_DELAY = 150;
  const GESTURE_DEBOUNCE = 450;

  const readState = () => {
    try {
      const value = JSON.parse(
        localStorage.getItem(
          'relay-runner-state'
        ) || 'null'
      );

      return value &&
        typeof value === 'object'
        ? value
        : {};
    } catch {
      return {};
    }
  };

  const getMusic = () => {
    return window.relayAdaptiveMusic || null;
  };

  const getScene = () => {
    return window.__relayRunnerScene || null;
  };

  const isGameplayVisible = () => {
    const play = document.getElementById('play');
    const intro = document.getElementById('intro');

    const playVisible =
      !!play &&
      !play.hidden &&
      !play.classList.contains('hidden') &&
      getComputedStyle(play).display !== 'none';

    const introVisible =
      !!intro &&
      !intro.hidden &&
      !intro.classList.contains('hidden') &&
      getComputedStyle(intro).display !== 'none';

    return playVisible && !introVisible;
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

    const rawVolume = Number(
      state.musicVolume
    );

    const volume =
      Number.isFinite(rawVolume)
        ? Math.max(
            0,
            Math.min(
              0.85,
              rawVolume
            )
          )
        : 0.55;

    music.setEnabled?.(true);
    music.setVolume?.(volume);

    return true;
  };

  const stopRetry = () => {
    if (retryTimer) {
      window.clearTimeout(
        retryTimer
      );

      retryTimer = 0;
    }

    retryCount = 0;
  };

  const unlockAndStart = async () => {
    const music = getMusic();

    if (!music) {
      return false;
    }

    if (!isGameplayVisible()) {
      return false;
    }

    const settingsApplied =
      applySettings(music);

    if (!settingsApplied) {
      return true;
    }

    /*
     * RunnerScene must be known before
     * adaptive music is started.
     */
    bindScene();

    const before =
      music.getState?.();

    if (before?.running) {
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
       * Scene may have become available
       * while AudioContext was resuming.
       */
      bindScene();

      const after =
        music.getState?.();

      if (after?.running) {
        return true;
      }

      music.start?.();

      const finalState =
        music.getState?.();

      return !!finalState?.running;
    } catch {
      return false;
    }
  };

  const scheduleRetry = () => {
    if (retryTimer) {
      return;
    }

    const retry = async () => {
      retryTimer = 0;

      const music = getMusic();

      if (!music) {
        if (
          ++retryCount >=
          MAX_RETRIES
        ) {
          retryCount = 0;
          return;
        }

        retryTimer =
          window.setTimeout(
            retry,
            RETRY_DELAY
          );

        return;
      }

      const state =
        music.getState?.();

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

      if (
        ++retryCount >=
        MAX_RETRIES
      ) {
        stopRetry();
        return;
      }

      retryTimer =
        window.setTimeout(
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

  const handleGesture = event => {
    if (
      event.type === 'keydown' &&
      event.repeat
    ) {
      return;
    }

    const now =
      performance.now();

    /*
     * Mobile browsers may emit
     * pointerdown + touchstart for
     * one physical gesture.
     */
    if (
      event.type !== 'keydown' &&
      now - lastGestureTime <
        GESTURE_DEBOUNCE
    ) {
      return;
    }

    if (
      event.type !== 'keydown'
    ) {
      lastGestureTime = now;
    }

    const target =
      event.target instanceof Element
        ? event.target
        : null;

    const relevant =
      target?.closest?.(
        '#start,' +
        '#continue,' +
        '#launchJob,' +
        '#again,' +
        '#nextMission,' +
        '#retry,' +
        '[data-v3-play],' +
        '[data-v3-continue],' +
        '[data-action="play"],' +
        '[data-action="continue"],' +
        '[data-mobile-action]'
      );

    const keyboardPlay =
      event.type === 'keydown' &&
      (
        event.key === 'Enter' ||
        event.code === 'Space'
      );

    if (
      relevant ||
      keyboardPlay
    ) {
      start();
    }
  };

  document.addEventListener(
    'pointerdown',
    handleGesture,
    {
      capture: true,
      passive: true
    }
  );

  document.addEventListener(
    'touchstart',
    handleGesture,
    {
      capture: true,
      passive: true
    }
  );

  document.addEventListener(
    'keydown',
    handleGesture,
    {
      capture: true,
      passive: true
    }
  );

  window.addEventListener(
    'relay:runner-scene-ready',
    event => {
      const scene =
        event?.detail?.scene ||
        window.__relayRunnerScene ||
        null;

      if (scene) {
        window.__relayRunnerScene =
          scene;
      }

      /*
       * Important order:
       * 1. Save scene
       * 2. Bind adaptive music
       * 3. Start
       */
      bindScene();
      start();
    },
    {
      passive: true
    }
  );

  /*
   * Late boot fallback.
   */
  window.setTimeout(() => {
    if (isGameplayVisible()) {
      start();
    }
  }, 500);

  /*
   * Public compatibility API.
   *
   * V3 is the canonical API because other
   * existing modules already call it.
   */
  window.relayGameplayAudioStartV3 = {
    start,
    bindScene
  };

  /*
   * Optional V4 alias for compatibility with
   * anything that may already reference V4.
   */
  window.relayGameplayAudioStartV4 = {
    start,
    bindScene
  };
})();
