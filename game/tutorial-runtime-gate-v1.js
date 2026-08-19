import { loadState } from './src/state.js';

(() => {
  if (window.__relayTutorialRuntimeGateV1) return;
  window.__relayTutorialRuntimeGateV1 = true;

  const enabled = () => loadState().tutorialEnabled !== false;
  const tutorialText = value => /TUTORIAL|RUNNER LESSON|PRACTICE IT NOW|BOOST PAD|DOUBLE JUMP|BLACKOUT|WALL ROUTES|CHASE|AIR DASH|STORM|COMBINE|LOCKDOWN|ELITE|FINAL RUN|CITYSPINE/i.test(String(value || ''));

  const hideTutorialObjects = scene => {
    if (enabled() || !scene) return;
    scene.firstTimeTutorial = false;
    scene.routeTutorials?.clear?.();
    scene.dismissIntelCard?.();
    scene.children?.list?.slice().forEach(child => {
      if (!child?.active || child.type !== 'Text') return;
      if (tutorialText(child.text)) child.destroy();
    });
    scene.guides?.getChildren?.().forEach(object => object.destroy?.());
    scene.guideCompanions?.getChildren?.().forEach(object => object.destroy?.());
  };

  const patchScene = scene => {
    if (!scene || scene.__relayTutorialRuntimeGateV1) return;
    scene.__relayTutorialRuntimeGateV1 = true;

    const originalEmit = scene.game?.events?.emit?.bind(scene.game.events);
    if (originalEmit) {
      scene.game.events.emit = function tutorialGatedEmit(eventName, ...args) {
        if (!enabled() && eventName === 'tutorial') return this;
        return originalEmit(eventName, ...args);
      };
    }

    hideTutorialObjects(scene);

    const refresh = () => hideTutorialObjects(scene);
    window.addEventListener('relay-settings-change', refresh);
    scene.events?.once?.('shutdown', () => {
      window.removeEventListener('relay-settings-change', refresh);
      if (originalEmit && scene.game?.events) scene.game.events.emit = originalEmit;
      scene.__relayTutorialRuntimeGateV1 = false;
    });
  };

  const ready = event => patchScene(event?.detail?.scene || window.__relayRunnerScene);
  window.addEventListener('relay:runner-scene-ready', ready);
  if (window.__relayRunnerScene) patchScene(window.__relayRunnerScene);
})();
