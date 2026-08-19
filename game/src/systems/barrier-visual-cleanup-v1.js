// UPDATE 11.7 — BARRIER VISUAL CLEANUP
// Removes only the extra Graphics overlay created by the world-variation barrier pass.
// Gameplay barriers, physics bodies, collision rules and interaction logic remain intact.

const CLEANUP_DEPTH = 7;

function cleanupBarrierVisual(scene) {
  if (!scene?.children?.list) return;

  scene.children.list.slice().forEach(child => {
    if (!child?.active) return;
    if (child.type !== 'Graphics') return;
    if (child.depth !== CLEANUP_DEPTH) return;

    // The world-variation barrier layer is the only Graphics object currently
    // created at depth 7. Finish-tower effects at this depth are Circles, not Graphics.
    child.destroy();
  });
}

function install() {
  if (window.__relayBarrierVisualCleanupV117) return;
  window.__relayBarrierVisualCleanupV117 = true;

  const ready = event => {
    const scene = event?.detail?.scene || window.__relayRunnerScene;
    if (!scene) return;

    // World variation registers its scene-ready listener first, so its barrier
    // Graphics exist by the time this cleanup listener runs.
    cleanupBarrierVisual(scene);
    window.setTimeout(() => cleanupBarrierVisual(scene), 0);
  };

  window.addEventListener('relay:runner-scene-ready', ready);

  if (window.__relayRunnerScene) ready({ detail: { scene: window.__relayRunnerScene } });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', install, { once: true });
} else {
  install();
}
