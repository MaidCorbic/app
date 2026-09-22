/* Production runtime failsafe:
   presentation/tutorial layers must never leave gameplay frozen.
*/

(() => {

  'use strict';

  if (window.__relayProductionUnfreezeV2) return;

  window.__relayProductionUnfreezeV2 = true;

  let recoveryDone = false;

  const runner = () =>
    window.__relayRunnerScene ||
    window.game?.scene?.getScene?.('runner') ||
    null;

  const hidden = element =>
    !element ||
    element.hidden ||
    element.classList?.contains('hidden');

  const isGameplayActive = scene => {
    if (!scene) return false;

    try {
      if (typeof scene.scene?.isActive === 'function') {
        return scene.scene.isActive();
      }
    } catch {}

    return false;
  };

  const isHomeVisible = () => {
    const start = document.getElementById('start');
    const play = document.getElementById('play');

    const startVisible =
      start &&
      !start.hidden &&
      !start.classList.contains('hidden');

    const playVisible =
      play &&
      !play.hidden &&
      !play.classList.contains('hidden');

    return Boolean(startVisible && !playVisible);
  };

  const recover = reason => {

    if (recoveryDone) return;

    recoveryDone = true;

    console.warn(
      '[Relay Runner] Production presentation watchdog recovered:',
      reason
    );

    const intro =
      document.getElementById('relayGameplayIntroFinalV1');

    intro
      ?.querySelector('.cinematic-skip')
      ?.click?.();

    intro?.classList.remove('playing');

    if (intro) {
      intro.hidden = true;
      intro.removeAttribute('data-started-at');
    }

    /*
     * IMPORTANT:
     *
     * titlePanel and relayInfoPanel can be intentionally opened
     * from the Home screen.
     *
     * The watchdog must NOT close them simply because they are visible.
     */

    const titlePanel =
      document.getElementById('titlePanel');

    const relayInfo =
      document.getElementById('relayInfoPanel');

    /*
     * Only close presentation panels when we are actually
     * recovering an active gameplay cinematic.
     */
    const scene = runner();

    const gameplayRunning =
      scene &&
      isGameplayActive(scene);

    if (gameplayRunning) {

      if (
        titlePanel &&
        !hidden(titlePanel)
      ) {
        titlePanel.classList.add('hidden');
        titlePanel.setAttribute(
          'aria-hidden',
          'true'
        );
      }

      if (
        relayInfo &&
        !hidden(relayInfo)
      ) {
        relayInfo.classList.add('hidden');
        relayInfo.setAttribute(
          'aria-hidden',
          'true'
        );
      }
    }

    if (scene) {

      scene.inputEnabled = true;

      scene.cinematicActive = false;

      scene.cameras?.main?.startFollow?.(
        scene.player,
        true,
        0.08,
        0.08
      );

      try {
        if (scene.scene?.isPaused?.()) {
          scene.scene.resume();
        }
      } catch {}

      try {
        scene.physics?.world?.resume?.();
      } catch {}

      const body = scene.player?.body;

      if (body) {

        body.enable = true;

        body.moves = true;

        body.allowGravity = true;

        if (body.checkCollision) {
          body.checkCollision.none = false;
        }
      }
    }

    document
      .getElementById('play')
      ?.classList
      .remove('relay-cinematic-presentation-lock');

    window.__relayCinematicLock = false;

    window.dispatchEvent(
      new Event('relay:cinematic-unlock')
    );
  };

  const check = () => {

    /*
     * NEVER run the production recovery logic while
     * the player is simply using the Home screen.
     */
    if (isHomeVisible()) {
      recoveryDone = false;
      return;
    }

    const scene = runner();

    const cinematic =
      document.getElementById(
        'relayGameplayIntroFinalV1'
      );

    const playing =
      cinematic &&
      !cinematic.hidden &&
      cinematic.classList.contains('playing');

    if (
      playing &&
      !cinematic.dataset.startedAt
    ) {
      cinematic.dataset.startedAt =
        String(Date.now());
    }

    if (
      !playing &&
      cinematic?.dataset.startedAt
    ) {
      delete cinematic.dataset.startedAt;
    }

    const age =
      playing
        ? Date.now() -
          Number(
            cinematic.dataset.startedAt ||
            Date.now()
          )
        : 0;

    const sceneStuck =
      Boolean(
        scene &&
        scene.cinematicActive &&
        playing &&
        age > 55000
      );

    /*
     * IMPORTANT:
     *
     * Do NOT treat a visible titlePanel as a stuck
     * gameplay state.
     *
     * It can be:
     * - FAQ
     * - UPDATE
     * - TUTORIAL
     * - OPTIONS
     * - another intentional Home dialog
     */

    const gameplayActive =
      scene &&
      isGameplayActive(scene);

    const panel =
      document.getElementById('titlePanel');

    const panelVisible =
      panel &&
      !hidden(panel);

    /*
     * A title panel is only considered blocking when:
     *
     * 1. gameplay is actually active
     * 2. the cinematic system says gameplay is blocked
     * 3. there is no active cinematic presentation
     *
     * This prevents the watchdog from killing Home panels.
     */
    const tutorialOverlayBlocking =
      Boolean(
        gameplayActive &&
        panelVisible &&
        scene.cinematicActive &&
        !playing
      );

    if (
      sceneStuck ||
      tutorialOverlayBlocking
    ) {

      recover(
        sceneStuck
          ? 'cinematic timeout'
          : 'blocking gameplay title panel'
      );
    }
  };

  /*
   * Splash failsafe.
   */
  window.setTimeout(() => {

    const splash =
      document.getElementById('relaySplash');

    if (
      splash &&
      !splash.classList.contains('is-leaving')
    ) {

      splash.classList.add(
        'is-leaving'
      );

      window.setTimeout(
        () => splash.remove(),
        500
      );
    }

  }, 20000);

  /*
   * Production watchdog.
   */
  window.setInterval(
    check,
    1000
  );

  window.addEventListener(
    'error',
    () => {
      window.setTimeout(
        check,
        0
      );
    }
  );

  window.addEventListener(
    'unhandledrejection',
    () => {
      window.setTimeout(
        check,
        0
      );
    }
  );

})();