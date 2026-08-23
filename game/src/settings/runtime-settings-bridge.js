import { getSettings } from './settings-store.js';

(() => {
  if (window.__relayRuntimeSettingsBridgeV1) return;
  window.__relayRuntimeSettingsBridgeV1 = true;

  const apply = settings => {
    const scene = window.__relayRunnerScene || window.game?.scene?.getScene?.('runner');
    if (!scene) return;

    scene.screenShake = settings.screenShake;
    scene.motionReduced = settings.reducedMotion;

    if (scene.rain?.setVisible) {
      scene.rain.setVisible(settings.rain);
    }

    if (settings.aiVoice === false) {
      try { window.speechSynthesis?.cancel?.(); } catch {}
    }
  };

  apply(getSettings());
  window.addEventListener('relay-settings-change', event => {
    apply({ ...getSettings(), ...(event.detail || {}) });
  }, { passive: true });

  window.addEventListener('relay:runner-scene-ready', event => {
    apply(getSettings());
    const scene = event.detail?.scene;
    if (scene?.events?.once) {
      scene.events.once('shutdown', () => apply(getSettings()));
    }
  }, { passive: true });
})();
