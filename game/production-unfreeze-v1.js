/* Production runtime failsafe: presentation/tutorial layers must never leave gameplay frozen. */
(() => {
  'use strict';
  if (window.__relayProductionUnfreezeV1) return;
  window.__relayProductionUnfreezeV1 = true;
  const startedAt = Date.now();
  let recoveryDone = false;
  const runner = () => window.__relayRunnerScene || window.game?.scene?.getScene?.('runner') || null;
  const hidden = element => element?.classList?.contains('hidden');
  const recover = reason => {
    if (recoveryDone) return;
    recoveryDone = true;
    console.warn('[Relay Runner] Production presentation watchdog recovered:', reason);
    const intro = document.getElementById('relayGameplayIntroFinalV1');
    intro?.querySelector('.cinematic-skip')?.click?.();
    intro?.classList.remove('playing');
    if (intro) intro.hidden = true;
    const titlePanel = document.getElementById('titlePanel');
    if (titlePanel && !hidden(titlePanel)) titlePanel.classList.add('hidden');
    const relayInfo = document.getElementById('relayInfoPanel');
    if (relayInfo && !hidden(relayInfo)) relayInfo.classList.add('hidden');
    const scene = runner();
    if (scene) {
      scene.inputEnabled = true;
      scene.cinematicActive = false;
      scene.cameras?.main?.startFollow?.(scene.player, true, .08, .08);
      if (scene.scene?.isPaused?.()) scene.scene.resume();
    }
    document.getElementById('play')?.classList.remove('relay-cinematic-presentation-lock');
    window.__relayCinematicLock = false;
    window.dispatchEvent(new Event('relay:cinematic-unlock'));
  };
  const check = () => {
    const scene = runner();
    const cinematic = document.getElementById('relayGameplayIntroFinalV1');
    const cinematicStuck = cinematic && !cinematic.hidden && Date.now() - startedAt > 9000;
    const sceneStuck = scene && scene.cinematicActive && Date.now() - startedAt > 9000;
    const panel = document.getElementById('titlePanel');
    const tutorialOverlayBlocking = scene && panel && !hidden(panel) && scene.scene?.isActive?.();
    if (cinematicStuck || sceneStuck || tutorialOverlayBlocking) recover(cinematicStuck ? 'cinematic timeout' : sceneStuck ? 'scene cinematic timeout' : 'blocking title panel');
  };
  window.setTimeout(() => {
    const splash = document.getElementById('relaySplash');
    if (splash && !splash.classList.contains('is-leaving')) {
      splash.classList.add('is-leaving');
      window.setTimeout(() => splash.remove(), 500);
    }
  }, 20000);
  window.setInterval(check, 1000);
  window.addEventListener('error', () => window.setTimeout(check, 0));
  window.addEventListener('unhandledrejection', () => window.setTimeout(check, 0));
})();
