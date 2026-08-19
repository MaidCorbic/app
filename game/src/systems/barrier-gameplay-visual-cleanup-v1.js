// UPDATE 11.8 — BARRIER GAMEPLAY VISUAL CLEANUP
// Barriers remain fully functional physics/collision objects.
// Their authored gameplay barrier is intentionally visible so the courier can
// clearly read vault obstacles instead of seeing only the red world overlay.
// Barrier warning labels are still removed. No bodies are disabled or removed.

function keepBarrierVisuals(scene) {
  if (!scene) return;

  const keepGroup = group => {
    group?.getChildren?.().forEach(object => {
      if (!object?.active) return;
      if (object.texture?.key === 'barrier') object.setVisible(true);
    });
  };

  keepGroup(scene.barriers);
  keepGroup(scene.movingGates);

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

    keepBarrierVisuals(scene);
    window.setTimeout(() => keepBarrierVisuals(scene), 0);
  };

  window.addEventListener('relay:runner-scene-ready', ready);
  if (window.__relayRunnerScene) ready({ detail: { scene: window.__relayRunnerScene } });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', install, { once: true });
} else {
  install();
}
