// LEVEL VISUAL / WORLD STABILITY FIX
// Existing presentation/world-stability owner. No new input owner.
// Keeps authored barriers visible, validates static platform bodies, nudges the
// initial spawn safely forward, extends authored routes, and improves route-map
// readability without replacing the existing mission route system.

(() => {
  if (window.__relayLevelVisualStabilityFixV1) return;
  window.__relayLevelVisualStabilityFixV1 = true;

  const style = document.createElement('style');
  style.id = 'relay-level-visual-stability-fix-v1';
  style.textContent = `
    .home-tutorial-button .tutorial-menu-icon,
    .home-tutorial-button svg,
    .home-tutorial-button i { display:none !important; }
    #intro .title-lockup { width:min(610px,100%) !important; display:grid !important; justify-items:center !important; align-content:center !important; row-gap:0 !important; }
    #intro .title-lockup h1 { display:block !important; width:100% !important; margin:0 !important; line-height:.82 !important; letter-spacing:-.105em !important; }
    #intro .title-lockup .menu-tagline { position:relative !important; z-index:4 !important; max-width:390px !important; margin:28px auto 28px !important; line-height:1.55 !important; }
    #intro .title-lockup .menu-actions { position:relative !important; z-index:5 !important; margin-top:0 !important; }
    #intro .title-lockup .title-secondary { position:relative !important; z-index:5 !important; }
    .hud-route #district { display:block !important; margin-bottom:5px !important; line-height:1.2 !important; }
    #pauseMenu .campaign-v2-head { padding-top:10px !important; }
    #relayGameplayIntroFinalV3 .map-briefing-map,
    #relayGameplayIntroFinalV5 .map-briefing-map { width:100% !important; height:100% !important; max-width:100% !important; max-height:100% !important; object-fit:contain !important; object-position:center !important; overflow:visible !important; }
    #relayGameplayIntroFinalV3 .map-briefing-map text,
    #relayGameplayIntroFinalV5 .map-briefing-map text { paint-order:stroke fill !important; }
  `;
  document.head.appendChild(style);

  const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || min));

  const tuneBarrierBody = barrier => {
    if (!barrier?.active || barrier.__relayStableBarrierBody) return;
    const body = barrier.body;
    if (!body || typeof body.setSize !== 'function') return;
    barrier.__relayStableBarrierBody = true;
    body.setSize(clamp(body.width, 34, 46), clamp(body.height, 38, 48), true);
    body.setAllowGravity?.(false);
    body.setImmovable?.(true);
  };

  const stabiliseStaticPlatforms = scene => {
    scene?.platforms?.getChildren?.().forEach(platform => {
      if (!platform?.active || !platform.body) return;
      try {
        platform.body.enable = true;
        platform.body.allowGravity = false;
        platform.body.immovable = true;
        platform.body.moves = false;
      } catch {}
    });
    scene?.children?.list?.forEach(object => {
      if (!object?.active || !object.body) return;
      const key = String(object.texture?.key || '').toLowerCase();
      if (!['platform','boost-pad','goal','signal'].includes(key)) return;
      try {
        object.body.allowGravity = false;
        object.body.immovable = true;
        object.body.moves = false;
      } catch {}
    });
  };

  const hidePlayerShieldVisual = scene => {
    const player = scene?.player;
    if (!player?.active || !scene?.children?.list) return;
    scene.children.list.filter(child => child?.active && child !== player && child.texture?.key === 'shield' && Math.hypot((child.x || 0) - player.x, (child.y || 0) - player.y) <= 90).forEach(object => object.setVisible(false));
  };

  const hideLegacyWeaponVisual = scene => {
    const player = scene?.player;
    if (!player?.active || !scene?.children?.list) return;
    scene.children.list.forEach(child => {
      if (!child?.active || child === player) return;
      const key = String(child.texture?.key || '').toLowerCase();
      const name = String(child.name || '').toLowerCase();
      const tagged = child.getData?.('weaponVisual') === true || child.getData?.('weapon') === true;
      if ((!tagged && !/weapon|gun|rifle|blaster|pistol|sidearm|scatter/.test(`${key} ${name}`))) return;
      if (Math.hypot((child.x || 0) - player.x, (child.y || 0) - player.y) > 90) return;
      child.setVisible?.(false);
    });
  };

  const restoreGameplayBarrierVisuals = scene => {
    scene?.barriers?.getChildren?.().forEach(barrier => {
      if (!barrier?.active) return;
      if (barrier.texture?.key === 'barrier') { barrier.setVisible(true); tuneBarrierBody(barrier); }
    });
    scene?.movingGates?.getChildren?.().forEach(gate => {
      if (!gate?.active) return;
      if (gate.texture?.key === 'barrier') { gate.setVisible(true); gate.body?.setAllowGravity?.(false); gate.body?.setImmovable?.(true); }
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
    if (!scene.platforms?.add || !scene.physics?.add?.existing || !scene.add?.rectangle) return;
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
        const platform = scene.add.rectangle(x + width / 2, y + height / 2, width, height, 0x0b1726, .96)
          .setStrokeStyle(2, 0x8df4ff, .72);
        scene.physics.add.existing(platform, true);
        platform.body?.setSize?.(width, height, true);
        platform.body?.setAllowGravity?.(false);
        platform.body?.setImmovable?.(true);
        scene.platforms.add(platform);
        platform.setData?.('relayExtended', true);
      } catch (error) {
        console.warn('[LevelStabilityV1] route extension segment skipped', error);
      }
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
    const authored = scene.mission?.spawn;
    const authoredX = Number(authored?.x);
    const authoredY = Number(authored?.y);
    const currentX = Number(player.x);
    const currentY = Number(player.y);
    if (!Number.isFinite(currentX) || !Number.isFinite(currentY)) return;
    if (Number.isFinite(authoredX) && Math.abs(currentX - authoredX) > 180) return;
    if (Number.isFinite(authoredY) && Math.abs(currentY - authoredY) > 140) return;

    const forward = Math.max(28, Math.min(56, Number(player.body?.width) || 36));
    const safeX = Number.isFinite(authoredX) ? authoredX + forward : currentX + forward;
    const safeY = Number.isFinite(authoredY) ? authoredY : currentY;
    if (!Number.isFinite(safeX) || !Number.isFinite(safeY)) return;

    scene.__relayInitialSpawnNudgedV1 = true;
    player.setPosition?.(safeX, safeY);
    player.body?.setVelocity?.(0, 0);
    player.body?.setAcceleration?.(0, 0);
    player.body?.setAllowGravity?.(true);
  };

  const enhanceMissionRoute = scene => {
    const state = scene?.__missionObjectiveState;
    if (!state?.c || state.__relayRouteTraceV1) return;
    const markers = Array.isArray(state.checkpointMarkers) ? state.checkpointMarkers : [];
    const linePoints = [33, ...markers.map(marker => Number(marker?.outer?.x) || 0).filter(x => x > 33 && x < 387), 387];
    if (linePoints.length < 2) return;

    const halo = scene.add.graphics().setScrollFactor(0).setDepth(9199);
    const trace = scene.add.graphics().setScrollFactor(0).setDepth(9201);
    const junctions = scene.add.graphics().setScrollFactor(0).setDepth(9202);
    halo.lineStyle(8, 0x55e9ff, .08);
    trace.lineStyle(2, 0x8df4ff, .42);
    trace.beginPath();
    trace.moveTo(linePoints[0], 94);
    for (let i = 1; i < linePoints.length; i += 1) trace.lineTo(linePoints[i], 94);
    trace.strokePath();
    for (const x of linePoints.slice(1, -1)) {
      junctions.fillStyle(0x8b65ff, .18);
      junctions.fillCircle(x, 94, 8);
      junctions.fillStyle(0xb9f8ff, .92);
      junctions.fillCircle(x, 94, 2.4);
    }
    state.c.add([halo, trace, junctions]);
    state.__relayRouteTraceV1 = true;
    state.__relayRouteTraceGraphicsV1 = [halo, trace, junctions];
  };

  const polishBriefingSvg = () => {
    ['relayGameplayIntroFinalV3','relayGameplayIntroFinalV5'].forEach(id => {
      const svg = document.getElementById(id)?.querySelector('.map-briefing-map');
      if (!svg) return;
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svg.style.overflow = 'visible';
    });
  };

  const fixScene = scene => {
    if (!scene?.children?.list) return;
    extendRoute(scene);
    stabiliseStaticPlatforms(scene);
    restoreGameplayBarrierVisuals(scene);
    hidePlayerShieldVisual(scene);
    hideLegacyWeaponVisual(scene);
    nudgeInitialSpawn(scene);
    enhanceMissionRoute(scene);
    polishBriefingSvg();
  };

  const ready = event => {
    const scene = event?.detail?.scene || window.__relayRunnerScene;
    if (!scene) return;
    fixScene(scene);
    window.setTimeout(() => fixScene(scene), 0);
    window.setTimeout(() => fixScene(scene), 120);
    window.setTimeout(() => fixScene(scene), 300);
    window.setTimeout(() => fixScene(scene), 650);
  };

  window.addEventListener('relay:runner-scene-ready', ready);
  if (window.__relayRunnerScene) ready({ detail: { scene: window.__relayRunnerScene } });
})();
