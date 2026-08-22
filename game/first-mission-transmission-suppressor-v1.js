(() => {
  'use strict';
  if (window.__relayFirstMissionTransmissionSuppressorV1) return;
  window.__relayFirstMissionTransmissionSuppressorV1 = true;

  const LEGACY_RE = /CHAPTER\s*01|OPEN\s*LINE|INCOMING\s*TRANSMISSION|FIRST\s*DELIVERY|OLD\s*QUARTER|RELAY\s*\/\/\s*ORIENTATION/i;

  const isFirstMissionTutorial = scene => !!(
    scene?.mission?.id === 'first-delivery' && scene?.firstTimeTutorial === true
  );

  const suppress = scene => {
    if (!scene || !isFirstMissionTutorial(scene)) return;

    // The legacy transmission is created inside RunnerScene during createPlayer().
    // Remove only its visual objects/text; keep gameplay, scene state and input untouched.
    scene.children?.list?.slice?.().forEach(child => {
      if (!child?.active) return;
      const text = typeof child.text === 'string' ? child.text : '';
      const dataTitle = typeof child.getData === 'function' ? child.getData('legacyMissionTransmission') : null;
      if (dataTitle === true || LEGACY_RE.test(text)) {
        child.setVisible?.(false);
        child.setActive?.(false);
      }
    });

    // Clear any legacy DOM transmission surface left by older runtime layers.
    document.querySelectorAll('[data-relay-legacy-transmission], #legacyMissionTransmission, .mission-transmission, .relay-mission-transmission').forEach(node => {
      node.hidden = true;
      node.setAttribute('aria-hidden', 'true');
    });
  };

  const bind = scene => {
    if (!scene || scene.__relayFirstMissionTransmissionSuppressed) return;
    scene.__relayFirstMissionTransmissionSuppressed = true;
    suppress(scene);
    const refresh = () => suppress(scene);
    window.addEventListener('relay:runner-scene-ready', refresh, { passive: true });
    window.addEventListener('relay:tutorial-step', refresh, { passive: true });
    window.addEventListener('relay:cinematic-lock', refresh, { passive: true });
    window.addEventListener('relay:cinematic-unlock', refresh, { passive: true });
    scene.events?.once?.('shutdown', () => {
      window.removeEventListener('relay:runner-scene-ready', refresh);
      window.removeEventListener('relay:tutorial-step', refresh);
      window.removeEventListener('relay:cinematic-lock', refresh);
      window.removeEventListener('relay:cinematic-unlock', refresh);
      scene.__relayFirstMissionTransmissionSuppressed = false;
    });
  };

  const ready = event => {
    const scene = event?.detail?.scene || window.__relayRunnerScene;
    if (scene) {
      bind(scene);
      window.setTimeout(() => suppress(scene), 0);
      window.setTimeout(() => suppress(scene), 180);
      window.setTimeout(() => suppress(scene), 600);
    }
  };

  window.addEventListener('relay:runner-scene-ready', ready, { passive: true });
  if (window.__relayRunnerScene) ready({ detail: { scene: window.__relayRunnerScene } });
})();