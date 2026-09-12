(() => {
  'use strict';

  if (window.__relayRunLaunchRecoveryV1) return;
  window.__relayRunLaunchRecoveryV1 = true;

  const getGame = () =>
    window.relayRunnerGame ||
    window.__relayRunnerScene?.game ||
    window.__relayRunnerGame ||
    null;

  const getScene = () =>
    window.__relayRunnerScene ||
    getGame()?.scene?.getScene?.('runner') ||
    null;

  const closeRunOverlays = () => {
    ['pauseMenu', 'titlePanel', 'relayInfoPanel', 'preflight', 'worldMap', 'finish', 'gameOver', 'levelUp', 'abilityUnlock']
      .forEach(id => document.getElementById(id)?.classList.add('hidden'));
  };

  const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms));

  const waitForRunner = async (timeoutMs = 12000) => {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const game = getGame();
      const scene = getScene();
      if (game?.scene && scene) return { game, scene };
      await wait(50);
    }
    return { game: getGame(), scene: getScene() };
  };

  const resume = async () => {
    if (window.__relayRunLaunchInFlight) return window.__relayRunLaunchInFlight;

    window.__relayRunLaunchInFlight = (async () => {
      const { game, scene } = await waitForRunner();
      if (!game?.scene || !scene) {
        console.error('[RelayRunner] RUN unavailable: RunnerScene was not registered');
        return false;
      }

      closeRunOverlays();

      try {
        if (scene.scene?.isPaused?.()) game.scene.resume('runner');
        else if (scene.scene?.isActive?.()) game.scene.resume('runner');
        else if (typeof window.relayLaunchRun === 'function') await window.relayLaunchRun(0);
        else {
          console.error('[RelayRunner] RUN unavailable: no canonical launch API');
          return false;
        }
      } catch (error) {
        console.error('[RelayRunner] RUN resume failed', error);
        return false;
      }

      document.getElementById('intro')?.classList.add('hidden');
      document.body.classList.add('relay-run-active');

      for (let attempt = 0; attempt < 50; attempt += 1) {
        const current = getScene();
        if (current?.scene?.isActive?.() && !current?.scene?.isPaused?.()) {
          window.dispatchEvent(new CustomEvent('relay:run-started', { detail: { scene: current, game } }));
          return true;
        }
        await wait(50);
      }

      return Boolean(getScene()?.scene?.isActive?.());
    })();

    try {
      return await window.__relayRunLaunchInFlight;
    } finally {
      window.__relayRunLaunchInFlight = null;
    }
  };

  const bind = () => {
    if (document.documentElement.dataset.relayRunLaunchRecoveryBound === '1') return;
    document.documentElement.dataset.relayRunLaunchRecoveryBound = '1';

    document.addEventListener('click', event => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const start = target.closest('#intro #start');
      if (!start) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      void resume();
    }, true);

    window.relayStartRun = resume;
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
})();
