// UPDATE 11.8 — BARRIER GAMEPLAY VISUAL CLEANUP
// Barriers remain fully functional physics/collision objects, but their authored
// red placeholder texture and barrier warning labels are hidden in every level.
// This is intentionally visual-only: no bodies are disabled or removed.

function hideBarrierVisuals(scene) {
  if (!scene) return;

  const hideGroup = group => {
    group?.getChildren?.().forEach(object => {
      if (!object?.active) return;
      if (object.texture?.key === 'barrier') object.setVisible(false);
    });
  };

  hideGroup(scene.barriers);
  hideGroup(scene.movingGates);

  scene.children?.list?.slice().forEach(child => {
    if (!child?.active || child.type !== 'Text') return;
    if (String(child.text || '').includes('BARRIER · VAULT')) child.destroy();
  });
}

function install() {
  if (window.__relayBarrierGameplayVisualCleanupV118) return;
  window.__relayBarrierGameplayVisualCleanupV118 = true;

  const ready = event => {
    const scene = event?.detail?.scene || window.__relayRunnerScene;
    if (!scene) return;

    hideBarrierVisuals(scene);
    window.setTimeout(() => hideBarrierVisuals(scene), 0);
  };

  window.addEventListener('relay:runner-scene-ready', ready);
  if (window.__relayRunnerScene) ready({ detail: { scene: window.__relayRunnerScene } });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', install, { once: true });
} else {
  install();
}
