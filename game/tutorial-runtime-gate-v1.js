import { loadState } from './src/state.js';

(() => {
  if (window.__relayTutorialRuntimeGateV2) return;
  window.__relayTutorialRuntimeGateV2 = true;

  const enabled = () => loadState().tutorialEnabled !== false && !window.__relayCinematicLock;
  const tutorialText = value => /TUTORIAL|RUNNER LESSON|PRACTICE IT NOW|BOOST PAD|DOUBLE JUMP|BLACKOUT|WALL ROUTES|CHASE|AIR DASH|STORM|COMBINE|LOCKDOWN|ELITE|FINAL RUN|CITYSPINE|CHECKPOINT/i.test(String(value || ''));

  const hideTutorialObjects = scene => {
    if (!scene) return;
    scene.firstTimeTutorial = window.__relayCinematicLock ? false : scene.firstTimeTutorial;
    if (enabled()) return;
    scene.routeTutorials?.clear?.();
    scene.dismissIntelCard?.();
    scene.children?.list?.slice().forEach(child => {
      if (!child?.active || child.type !== 'Text') return;
      if (tutorialText(child.text)) child.setVisible?.(false);
    });
    scene.guides?.setVisible?.(false);
    scene.guideCompanions?.setVisible?.(false);
  };

  const patchScene = scene => {
    if (!scene || scene.__relayTutorialRuntimeGateV2Patched) return;
    scene.__relayTutorialRuntimeGateV2Patched = true;
    const originalEmit = scene.game?.events?.emit?.bind(scene.game.events);
    if (originalEmit) {
      scene.game.events.emit = function tutorialGatedEmit(eventName, ...args) {
        if ((!enabled() && eventName === 'tutorial') || (window.__relayCinematicLock && /tutorial/i.test(String(eventName))) ) return this;
        return originalEmit(eventName, ...args);
      };
    }
    hideTutorialObjects(scene);
    const refresh = () => hideTutorialObjects(scene);
    window.addEventListener('relay:cinematic-lock', refresh);
    window.addEventListener('relay:cinematic-unlock', refresh);
    window.addEventListener('relay-settings-change', refresh);
    scene.events?.once?.('shutdown', () => {
      window.removeEventListener('relay:cinematic-lock', refresh);
      window.removeEventListener('relay:cinematic-unlock', refresh);
      window.removeEventListener('relay-settings-change', refresh);
      if (originalEmit && scene.game?.events) scene.game.events.emit = originalEmit;
      scene.__relayTutorialRuntimeGateV2Patched = false;
    });
  };

  const ready = event => patchScene(event?.detail?.scene || window.__relayRunnerScene);
  window.addEventListener('relay:runner-scene-ready', ready);
  window.addEventListener('relay:cinematic-lock', () => window.__relayRunnerScene && hideTutorialObjects(window.__relayRunnerScene));
  if (window.__relayRunnerScene) patchScene(window.__relayRunnerScene);
})();
