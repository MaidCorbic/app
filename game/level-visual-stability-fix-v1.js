// LEVEL VISUAL / WORLD STABILITY FIX
// Existing presentation/world-stability owner. No new input owner.
// Keeps authored barriers visible, validates static platform bodies, nudges the
// initial spawn safely forward, and extends authored routes so the finish cannot
// be reached immediately after the existing final platform.

(() => {
  if (window.__relayLevelVisualStabilityFixV1) return;
  window.__relayLevelVisualStabilityFixV1 = true;

  const style = document.createElement('style');
  style.id = 'relay-level-visual-stability-fix-v1';
  style.textContent = `
    .home-tutorial-button .tutorial-menu-icon,
    .home-tutorial-button svg,
    .home-tutorial-button i { display:none !important; }

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

    .hud-route #district {
      display:block !important;
      margin-bottom:5px !important;
      line-height:1.2 !important;
    }

    #pauseMenu .campaign-v2-head {
      padding-top:10px !important;
    }
  `;
  document.head.appendChild(style);

  const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || min));

  const tuneBarrierBody = barrier => {
    if (!barrier?.active || barrier.__relayStableBarrierBody) return;
    const body = barrier.body;
    if (!body || typeof body.setSize !== 'function') return;
    barrier.__relayStableBarrierBody = true;
    const width = clamp(body.width, 34, 46);
    const height = clamp(body.height, 38, 48);
    body.setSize(width, height, true);
    body.setAllowGravity?.(false);
    body.setImmovable?.(true);
  };

  const stabiliseStaticPlatforms = scene => {
    const group = scene?.platforms;
    group?.getChildren?.().forEach(platform => {
      if (!platform?.active || !platform.body) return;
      try {
        platform.body.enable = true;
        platform.body.allowGravity = false;
        platform.body.immovable = true;
        platform.body.moves = false;
      } catch {}
    });
  };

  const hidePlayerShieldVisual = scene => {
    const player = scene?.player;
    if (!player?.active || !scene?.children?.list) return;
    scene.children.list.filter(child => {
      if (!child?.active || child === player) return false;
      if (child.texture?.key !== 'shield') return false;
      return Math.hypot((child.x || 0) - player.x, (child.y || 0) - player.y) <= 90;
    }).forEach(object => object.setVisible(false));
  };

  const restoreGameplayBarrierVisuals = scene => {
    if (!scene) return;
    scene.barriers?.getChildren?.().forEach(barrier => {
      if (!barrier?.active) return;
      if (barrier.texture?.key === 'barrier') {
        barrier.setVisible(true);
        tuneBarrierBody(barrier);
      }
    });
    scene.movingGates?.getChildren?.().forEach(gate => {
      if (!gate?.active) return;
      if (gate.texture?.key === 'barrier') {
        gate.setVisible(true);
        gate.body?.setAllowGravity?.(false);
        gate.body?.setImmovable?.(true);
      }
    });
  };

  const maxAuthoredPlatformEnd = scene => {
    const platforms = scene?.mission?.platforms;
    if (!Array.isArray(platforms)) return 0;
    return platforms.reduce((max, entry) => {
      const x = Number(entry?.[0]);
      const width = Number(entry?.[2]);
      if (!Number.isFinite(x) || !Number.isFinite(width)) return max;
      return Math.max(max, x + Math.max(1, width));
    }, 0);
  };

  const extendRoute = scene => {
    if (!scene?.mission || scene.__relayRouteExtensionV1) return;
    if (!scene.platforms?.create) return;

    const goal = Number(scene.mission.goal?.x);
    if (!Number.isFinite(goal) || goal < 5000) return;

    const currentEnd = Math.max(maxAuthoredPlatformEnd(scene), Number(scene.player?.x) || 0);
    const extensionStart = Math.max(6200, currentEnd + 80);
    const extendedGoal = Math.max(goal + 900, extensionStart + 900);
    const groundY = 610;
    const segments = [
      [extensionStart, groundY, 300, 110],
      [extensionStart + 420, 565, 300, 155],
      [extensionStart + 840, groundY, 360, 110],
    ];

    scene.__relayRouteExtensionV1 = true;
    scene.mission.goal.x = extendedGoal;

    segments.forEach(([x, y, width, height]) => {
      try {
        const platform = scene.platforms.create(x + width / 2, y + height / 2, 'platform');
        platform.setDisplaySize?.(width, height);
        platform.refreshBody?.();
        platform.body?.setAllowGravity?.(false);
        platform.body?.setImmovable?.(true);
        platform.body?.setSize?.(width, height, true);
        platform.setData?.('relayExtended', true);
      } catch {}
    });

    try {
      scene.physics?.world?.setBoundsWidth?.(extendedGoal + 360);
      scene.cameras?.main?.setBounds?.(0, 0, extendedGoal + 360, scene.scale?.height || 720);
    } catch {}
  };

  const nudgeInitialSpawn = scene => {
    if (!scene?.player || scene.__relayInitialSpawnNudgedV1) return;
    if (scene.finished || scene.respawning || scene.cinematicActive || window.__relayCinematicLock) return;

    const player = scene.player;
    const body = player.body;
    const authored = scene.mission?.spawn;
    const authoredX = Number(authored?.x);
    const authoredY = Number(authored?.y);
    const currentX = Number(player.x);
    const currentY = Number(player.y);

    if (!Number.isFinite(currentX) || !Number.isFinite(currentY)) return;
    if (Number.isFinite(authoredX) && Math.abs(currentX - authoredX) > 180) return;
    if (Number.isFinite(authoredY) && Math.abs(currentY - authoredY) > 140) return;

    const forward = Math.max(28, Math.min(56, Number(body?.width) || 36));
    const safeX = Number.isFinite(authoredX) ? authoredX + forward : currentX + forward;
    const safeY = Number.isFinite(authoredY) ? authoredY : currentY;

    if (!Number.isFinite(safeX) || !Number.isFinite(safeY)) return;

    scene.__relayInitialSpawnNudgedV1 = true;
    player.setPosition?.(safeX, safeY);
    body?.setVelocity?.(0, 0);
    body?.setAcceleration?.(0, 0);
    body?.setAllowGravity?.(true);
  };

  const fixScene = scene => {
    if (!scene?.children?.list) return;
    extendRoute(scene);
    stabiliseStaticPlatforms(scene);
    restoreGameplayBarrierVisuals(scene);
    hidePlayerShieldVisual(scene);
    nudgeInitialSpawn(scene);

    scene.children.list.forEach(child => {
      if (!child?.active || child.type !== 'Text') return;
      if (String(child.text || '').trim().toUpperCase() !== 'OLD QUARTER') return;
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
