// TEST PATCH — PLAYER SHIELD VISUAL CLEANUP
// Visual-only. Removes the checkpoint respawn circle that appears beside the
// courier. The underlying respawn protection/invulnerability is untouched.
// No barrier, world-mechanics, movement, combat or progression logic is changed.

(() => {
  if (window.__relayPlayerShieldVisualCleanupV1) return;
  window.__relayPlayerShieldVisualCleanupV1 = true;

  const isCheckpointShield = (radius, color, alpha) =>
    radius === 22 && color === 0x8df4ff && Math.abs(Number(alpha) - 0.22) < 0.001;

  const patchScene = scene => {
    if (!scene?.add?.circle || scene.__relayCheckpointShieldVisualPatched) return;
    scene.__relayCheckpointShieldVisualPatched = true;

    const originalCircle = scene.add.circle.bind(scene.add);
    scene.add.circle = function relayCheckpointShieldFiltered(x, y, radius, color, alpha, ...rest) {
      const circle = originalCircle(x, y, radius, color, alpha, ...rest);
      if (isCheckpointShield(radius, color, alpha)) {
        circle.setVisible(false);
        circle.setActive(false);
        circle.destroy();
      }
      return circle;
    };

    scene.events?.once?.('shutdown', () => {
      scene.__relayCheckpointShieldVisualPatched = false;
    });
  };

  const ready = event => patchScene(event?.detail?.scene || window.__relayRunnerScene);
  window.addEventListener('relay:runner-scene-ready', ready);
  if (window.__relayRunnerScene) patchScene(window.__relayRunnerScene);
})();
