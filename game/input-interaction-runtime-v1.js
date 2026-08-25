// Contextual player interaction bridge. Reuses existing world systems.
(() => {
  const KEY = 'relayInteractionRuntimeV1';
  if (window[KEY]) return;
  window[KEY] = true;
  const RANGE = 150;
  let active = true;
  let lastAction = 0;
  const getScene = () => window.game?.scene?.getScene?.('runner') || window.__relayRunnerScene;
  const nearest = scene => {
    const player = scene?.player;
    if (!player) return null;
    const candidates = [...(scene.interactionNodes || []), ...(scene.pressureNodes || []), ...(scene.secretNodes || []), ...(scene.pickups || [])].filter(Boolean);
    let best = null, bestDistance = RANGE;
    for (const node of candidates) {
      if (!node.active || node.disabled || node.used) continue;
      const d = Phaser.Math.Distance.Between(player.x, player.y, node.x, node.y);
      if (d < bestDistance) { best = node; bestDistance = d; }
    }
    return best;
  };
  const resolve = (scene, node) => {
    if (!node) return false;
    const now = performance.now();
    if (now - lastAction < 180) return false;
    lastAction = now;
    if (typeof node.activate === 'function') { node.activate(scene.player, scene); return true; }
    if (typeof node.interact === 'function') { node.interact(scene.player, scene); return true; }
    if (typeof node.open === 'function') { node.open(); return true; }
    if (typeof scene.activateWorldInteraction === 'function') return !!scene.activateWorldInteraction(node);
    if (typeof scene.activatePressureNode === 'function') return !!scene.activatePressureNode(node);
    return false;
  };
  const onKey = event => {
    if (!active || event.repeat || (event.code !== 'KeyE' && event.code !== 'KeyF')) return;
    const scene = getScene();
    if (!scene || !scene.scene?.isActive?.()) return;
    if (resolve(scene, nearest(scene))) event.preventDefault();
  };
  window.addEventListener('keydown', onKey, { passive: false });
  const cleanup = () => { active = false; window.removeEventListener('keydown', onKey); window[KEY] = false; };
  window.addEventListener('beforeunload', cleanup, { once: true });
})();
