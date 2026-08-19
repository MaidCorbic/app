// TEST ONLY — LEVEL VISUAL / BARRIER STABILITY FIX
// Strictly isolated from Dynamic World Mechanics.
// - Removes the tutorial ? icon without removing the TUTORIAL entry.
// - Gives the top OLD QUARTER HUD line enough vertical breathing room.
// - Keeps authored barrier sprites visible.
// - Tightens only the visible barrier collision footprint so the lower edge
//   cannot catch the courier's feet and shove them into a void unexpectedly.
// No mission data, Dynamic World targets, gate logic or progression is changed.

(() => {
  if (window.__relayLevelVisualStabilityFixV1) return;
  window.__relayLevelVisualStabilityFixV1 = true;

  const style = document.createElement('style');
  style.id = 'relay-level-visual-stability-fix-v1';
  style.textContent = `
    /* Home tutorial: keep the button, remove only the decorative ? icon. */
    .home-tutorial-button .tutorial-menu-icon { display: none !important; }

    /* HUD: separate district name from the objective so OLD QUARTER never collides with it. */
    .hud-route #district {
      display: block !important;
      margin-bottom: 5px !important;
      line-height: 1.2 !important;
    }

    /* Campaign/briefing header: give the upper copy a little more breathing room. */
    #pauseMenu .campaign-v2-head {
      padding-top: 10px !important;
    }
  `;
  document.head.appendChild(style);

  const tuneBarrierBody = barrier => {
    if (!barrier?.active || barrier.__relayStableBarrierBody) return;
    const body = barrier.body;
    if (!body || typeof body.setSize !== 'function') return;

    barrier.__relayStableBarrierBody = true;
    const width = Math.max(34, Math.min(44, Number(body.width) || 44));
    // Keep the collision centered around the obstacle, but remove the lowest
    // part of the old 64px footprint that could catch the player's feet.
    const height = Math.max(34, Math.min(44, Number(body.height) || 44));
    body.setSize(width, height, true);
  };

  const fixScene = scene => {
    if (!scene?.children?.list) return;

    // Restore the authored barrier visual if any previous visual cleanup hid it.
    scene.barriers?.getChildren?.().forEach(barrier => {
      if (!barrier?.active) return;
      if (barrier.texture?.key === 'barrier') {
        barrier.setVisible(true);
        tuneBarrierBody(barrier);
      }
    });

    scene.movingGates?.getChildren?.().forEach(gate => {
      if (!gate?.active) return;
      if (gate.texture?.key === 'barrier') gate.setVisible(true);
    });

    // If the district label is a Phaser text object in addition to the DOM HUD,
    // move only that exact label down. Never alter arbitrary world text.
    scene.children.list.forEach(child => {
      if (!child?.active || child.type !== 'Text') return;
      const value = String(child.text || '').trim().toUpperCase();
      if (value !== 'OLD QUARTER') return;
      if (child.__relayOldQuarterShifted) return;
      child.__relayOldQuarterShifted = true;
      child.y += 14;
    });
  };

  const ready = event => {
    const scene = event?.detail?.scene || window.__relayRunnerScene;
    if (!scene) return;
    fixScene(scene);
    window.setTimeout(() => fixScene(scene), 0);
    window.setTimeout(() => fixScene(scene), 120);
  };

  window.addEventListener('relay:runner-scene-ready', ready);
  if (window.__relayRunnerScene) ready({ detail: { scene: window.__relayRunnerScene } });
})();
