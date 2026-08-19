// UPDATE 11.9 — BARRIER GAMEPLAY VISUAL CLEANUP
// Gameplay barriers remain functional collision objects, but their intrusive
// authored placeholder sprite and "BARRIER · VAULT" labels are never rendered.
// This is intentionally visual-only: no bodies are disabled or removed.
//
// The previous cleanup ran only once on the scene-ready event. RunnerScene can
// finish creating hazards after that event, which allowed the barrier sprite and
// label to reappear. This version performs a small post-create cleanup window.

const CLEANUP_PASSES = [0, 40, 120, 300, 700];

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
    const value = String(child.text || '').toUpperCase();
    if (value.includes('BARRIER · VAULT') || value.includes('BARRIER - VAULT')) child.destroy();
  });
}

function cleanupWindow(scene) {
  if (!scene) return;
  CLEANUP_PASSES.forEach(delay => {
    window.setTimeout(() => {
      if (scene?.sys?.isActive?.() !== false) hideBarrierVisuals(scene);
    }, delay);
  });
}

function install() {
  if (window.__relayBarrierGameplayVisualCleanupV119) return;
  window.__relayBarrierGameplayVisualCleanupV119 = true;

  const ready = event => {
    const scene = event?.detail?.scene || window.__relayRunnerScene;
    if (!scene) return;
    cleanupWindow(scene);
  };

  window.addEventListener('relay:runner-scene-ready', ready);
  if (window.__relayRunnerScene) ready({ detail: { scene: window.__relayRunnerScene } });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', install, { once: true });
} else {
  install();
}
