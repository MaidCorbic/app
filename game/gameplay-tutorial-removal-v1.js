/* Gameplay tutorial removal V1.
 * The Home Tutorial remains available from the title screen.
 * Gameplay itself has no tutorial/lesson presentation or tutorial setting dependency.
 */
(() => {
  'use strict';
  if (window.__relayGameplayTutorialRemovalV1) return;
  window.__relayGameplayTutorialRemovalV1 = true;

  const hide = scene => {
    if (!scene) return;
    scene.firstTimeTutorial = false;
    scene.tutorialActive = false;
    scene.tutorialStep = null;
    scene.tutorialState = null;
    scene.guides?.setVisible?.(false);
    scene.guideCompanions?.setVisible?.(false);
    scene.tutorialUI?.setVisible?.(false);
    scene.tutorialPanel?.setVisible?.(false);
    scene.infoCard?.setVisible?.(false);
  };

  const patchRunner = () => {
    const RunnerScene = window.__relayRunnerScene?.constructor || window.game?.scene?.getScene?.('runner')?.constructor;
    const prototype = RunnerScene?.prototype;
    if (!prototype || prototype.__relayGameplayTutorialRemovalV1) return false;

    const noTutorial = function relayNoGameplayTutorial() {
      hide(this);
      return undefined;
    };

    for (const name of ['createGuides','createGuideCompanions','collectGuideCompanion','updateCombatTutorial']) {
      if (typeof prototype[name] === 'function') prototype[name] = noTutorial;
    }

    const originalInit = prototype.init;
    if (typeof originalInit === 'function') {
      prototype.init = function relayTutorialFreeInit(config = {}) {
        const next = { ...config, firstTimeTutorial: false };
        const result = originalInit.call(this, next);
        hide(this);
        return result;
      };
    }

    prototype.__relayGameplayTutorialRemovalV1 = true;
    return true;
  };

  const scrub = () => {
    patchRunner();
    const scene = window.__relayRunnerScene || window.game?.scene?.getScene?.('runner');
    hide(scene);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.setTimeout(scrub, 0), { once:true });
  } else {
    window.setTimeout(scrub, 0);
  }
  window.setInterval(scrub, 500);
})();
