// Mobile first-delivery hardening V2.
// Desktop/web is deliberately untouched. On touch devices the real first-delivery
// Phaser intel/tutorial card can appear after PLAY and leave the scene input-locked.
// The mobile path must enter live gameplay deterministically so the game can be tested.
(() => {
  'use strict';
  if (window.__relayMobileFirstDeliveryUnlockV2) return;
  window.__relayMobileFirstDeliveryUnlockV2 = true;

  const isMobile = () => window.matchMedia?.('(pointer: coarse)').matches
    || window.matchMedia?.('(hover: none)').matches
    || Number(navigator.maxTouchPoints || 0) > 0
    || /Android|iPhone|iPad|iPod|Mobile|Windows Phone|Silk|Kindle/i.test(navigator.userAgent || '');

  if (!isMobile()) return;

  const scene = () => window.__relayRunnerScene || window.game?.scene?.getScene?.('runner') || null;
  const isFirstDelivery = runner => {
    const id = runner?.mission?.id || runner?.missionId || runner?.currentMission?.id;
    return !id || id === 'first-delivery';
  };

  let unlocked = false;
  let startedAt = 0;
  let lastScene = null;

  const release = runner => {
    if (!runner || !isFirstDelivery(runner)) return;

    const cardVisible = runner.infoCard?.visible === true;
    const tutorialVisible = runner.firstTimeTutorial === true
      || runner.guides?.visible === true
      || runner.guideCompanions?.visible === true;

    if (!cardVisible && !tutorialVisible && !runner.cinematicActive) return;

    try { runner.dismissIntelCard?.(); } catch {}
    try { runner.infoCard?.setVisible?.(false); } catch {}
    try { runner.routeTutorials?.clear?.(); } catch {}
    try { runner.guides?.setVisible?.(false); } catch {}
    try { runner.guideCompanions?.setVisible?.(false); } catch {}

    runner.firstTimeTutorial = false;
    runner.cinematicActive = false;
    runner.inputEnabled = true;
    try { if (runner.scene?.isPaused?.()) runner.scene.resume?.(); } catch {}
    try { runner.cameras?.main?.startFollow?.(runner.player, true, .08, .08); } catch {}

    document.getElementById('play')?.classList.remove('relay-cinematic-presentation-lock');
    document.getElementById('relayGameplayIntroFinalV1')?.setAttribute('hidden', '');
    window.__relayCinematicLock = false;
    window.dispatchEvent(new Event('relay:cinematic-unlock'));
    unlocked = true;
  };

  const tick = () => {
    const runner = scene();
    if (runner && runner !== lastScene) {
      lastScene = runner;
      startedAt = Date.now();
      unlocked = false;
    }
    if (runner && !unlocked && Date.now() - startedAt < 15000) release(runner);
    window.setTimeout(tick, runner && !unlocked ? 120 : 500);
  };

  window.addEventListener('relay:runner-scene-ready', () => {
    const runner = scene();
    if (runner) {
      lastScene = runner;
      startedAt = Date.now();
      unlocked = false;
      release(runner);
    }
  }, { passive: true });

  window.addEventListener('pageshow', () => {
    unlocked = false;
    startedAt = Date.now();
  }, { passive: true });

  tick();
})();
