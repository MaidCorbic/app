import { loadState } from './src/state.js';

(() => {
  if (window.__relayTutorialRuntimeGateV3) return;
  window.__relayTutorialRuntimeGateV3 = true;

  const enabled = () => loadState().tutorialEnabled !== false && !window.__relayCinematicLock;
  const tutorialText = value => /TUTORIAL|RUNNER LESSON|PRACTICE IT NOW|BOOST PAD|DOUBLE JUMP|BLACKOUT|WALL ROUTES|CHASE|AIR DASH|STORM|COMBINE|LOCKDOWN|ELITE|FINAL RUN|CITYSPINE|CHECKPOINT/i.test(String(value || ''));
  const snapshots = new WeakMap();

  const hideTutorialObjects = scene => {
    if (!scene) return;

    if (window.__relayCinematicLock) {
      if (!snapshots.has(scene)) {
        snapshots.set(scene, {
          firstTimeTutorial: scene.firstTimeTutorial,
          guidesVisible: scene.guides?.visible,
          companionsVisible: scene.guideCompanions?.visible,
          infoVisible: scene.infoCard?.visible,
        });
      }
      scene.firstTimeTutorial = false;
      scene.routeTutorials?.forEach?.(item => item?.setVisible?.(false));
      scene.guides?.setVisible?.(false);
      scene.guideCompanions?.setVisible?.(false);
      scene.infoCard?.setVisible?.(false);
      scene.children?.list?.slice().forEach(child => {
        if (!child?.active || child.type !== 'Text') return;
        if (tutorialText(child.text)) child.setVisible?.(false);
      });
      return;
    }

    const snap = snapshots.get(scene);
    if (snap) {
      scene.firstTimeTutorial = snap.firstTimeTutorial;
      if (scene.guides) scene.guides.setVisible(snap.guidesVisible);
      if (scene.guideCompanions) scene.guideCompanions.setVisible(snap.companionsVisible);
      if (scene.infoCard) scene.infoCard.setVisible(snap.infoVisible);
      snapshots.delete(scene);
    }

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
    if (!scene || scene.__relayTutorialRuntimeGateV3Patched) return;
    scene.__relayTutorialRuntimeGateV3Patched = true;
    const originalEmit = scene.game?.events?.emit?.bind(scene.game.events);
    if (originalEmit) {
      scene.game.events.emit = function tutorialGatedEmit(eventName, ...args) {
        if ((!enabled() && eventName === 'tutorial') || (window.__relayCinematicLock && /tutorial/i.test(String(eventName)))) return this;
        return originalEmit(eventName, ...args);
      };
    }
    const refresh = () => hideTutorialObjects(scene);
    window.addEventListener('relay:cinematic-lock', refresh);
    window.addEventListener('relay:cinematic-unlock', refresh);
    window.addEventListener('relay-settings-change', refresh);
    hideTutorialObjects(scene);
    scene.events?.once?.('shutdown', () => {
      window.removeEventListener('relay:cinematic-lock', refresh);
      window.removeEventListener('relay:cinematic-unlock', refresh);
      window.removeEventListener('relay-settings-change', refresh);
      if (originalEmit && scene.game?.events) scene.game.events.emit = originalEmit;
      scene.__relayTutorialRuntimeGateV3Patched = false;
      snapshots.delete(scene);
    });
  };

  const ready = event => patchScene(event?.detail?.scene || window.__relayRunnerScene);
  window.addEventListener('relay:runner-scene-ready', ready);
  window.addEventListener('relay:cinematic-lock', () => window.__relayRunnerScene && hideTutorialObjects(window.__relayRunnerScene));
  window.addEventListener('relay:cinematic-unlock', () => {
    const scene = window.__relayRunnerScene;
    if (!scene) return;
    hideTutorialObjects(scene);
    if (scene.firstTimeTutorial && loadState().tutorialEnabled !== false) {
      if (!scene.guides || !scene.guides.active) scene.createGuides?.();
      if (!scene.guideCompanions || !scene.guideCompanions.active) scene.createGuideCompanions?.();
      scene.guides?.setVisible?.(true);
      scene.guideCompanions?.setVisible?.(true);
    }
  });
  if (window.__relayRunnerScene) patchScene(window.__relayRunnerScene);
})();
