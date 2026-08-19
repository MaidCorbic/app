// TEST ONLY — LEVEL VISUAL / BARRIER STABILITY FIX
// Strictly isolated from Dynamic World Mechanics.
// - Removes the tutorial ? icon without removing the TUTORIAL entry.
// - Gives the Home title enough vertical breathing room so the tagline is clearly
//   below RELAY RUNNER and never collides with PLAY NOW.
// - Keeps authored gameplay barrier sprites visible on every level.
// - Removes only the player-adjacent checkpoint/shield visual.
// - Tightens only the visible barrier collision footprint so the lower edge
//   cannot catch the courier's feet and shove them into a void unexpectedly.
// No mission data, Dynamic World targets, gate logic or progression is changed.

(() => {
  if (window.__relayLevelVisualStabilityFixV1) return;
  window.__relayLevelVisualStabilityFixV1 = true;

  const style = document.createElement('style');
  style.id = 'relay-level-visual-stability-fix-v1';
  style.textContent = `
    /* Home tutorial: the menu entry is text-only. No icon/question mark. */
    .home-tutorial-button .tutorial-menu-icon,
    .home-tutorial-button svg,
    .home-tutorial-button i { display:none !important; }

    /* Home title: establish a real vertical stack. The tagline must sit below
       the RUNNER word, with a stable gap before PLAY NOW. */
    #intro .title-lockup {
      width:min(610px,100%) !important;
      display:grid !important;
      justify-items:center !important;
      align-content:center !important;
      row-gap:0 !important;
    }
    #intro .title-lockup h1 {
      display:block !important;
      width:100% !important;
      margin:0 !important;
      line-height:.82 !important;
      letter-spacing:-.105em !important;
    }
    #intro .title-lockup .menu-tagline {
      position:relative !important;
      z-index:4 !important;
      max-width:390px !important;
      margin:28px auto 28px !important;
      line-height:1.55 !important;
    }
    #intro .title-lockup .menu-actions {
      position:relative !important;
      z-index:5 !important;
      margin-top:0 !important;
    }
    #intro .title-lockup .title-secondary {
      position:relative !important;
      z-index:5 !important;
    }

    /* HUD: separate district name from the objective so OLD QUARTER never collides with it. */
    .hud-route #district {
      display:block !important;
      margin-bottom:5px !important;
      line-height:1.2 !important;
    }

    /* Campaign/briefing header: give the upper copy a little more breathing room. */
    #pauseMenu .campaign-v2-head {
      padding-top:10px !important;
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

  const hidePlayerShieldVisual = scene => {
    const player = scene?.player;
    if (!player?.active || !scene?.children?.list) return;
    const shieldObjects = scene.children.list.filter(child => {
      if (!child?.active || child === player) return false;
      if (child.texture?.key !== 'shield') return false;
      return Math.hypot((child.x || 0) - player.x, (child.y || 0) - player.y) <= 90;
    });
    shieldObjects.forEach(object => object.setVisible(false));
  };

  const restoreGameplayBarrierVisuals = scene => {
    if (!scene) return;

    // The authored barrier sprite is the actual gameplay readability layer.
    // Restore it after every scene-ready pass so no cleanup layer can leave the
    // player with only the red placeholder/overlay or an invisible obstacle.
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
  };

  const fixScene = scene => {
    if (!scene?.children?.list) return;

    restoreGameplayBarrierVisuals(scene);
    hidePlayerShieldVisual(scene);

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
    window.setTimeout(() => fixScene(scene), 300);
  };

  window.addEventListener('relay:runner-scene-ready', ready);
  if (window.__relayRunnerScene) ready({ detail: { scene: window.__relayRunnerScene } });
})();
