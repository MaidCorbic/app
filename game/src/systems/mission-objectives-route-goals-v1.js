import { RunnerScene } from '../scenes/RunnerScene.js';

export const MISSION_OBJECTIVES = Object.freeze({
  'first-delivery': { title: 'DELIVER THE SIGNAL PACKAGE', label: 'MISSION ROUTE', completeAt: .72 },
  'dead-drop': { title: 'SECURE THE DROP', label: 'MISSION ROUTE', completeAt: .76 },
  blackout: { title: 'RESTORE THE GRID', label: 'MISSION ROUTE', completeAt: .70 },
  pursuit: { title: 'ESCAPE THE INTERCEPTOR', label: 'MISSION ROUTE', completeAt: .78 },
  'signal-storm': { title: 'STABILIZE THE ARRAY', label: 'MISSION ROUTE', completeAt: .74 },
  'corporate-lockdown': { title: 'BREACH THE LOCKDOWN', label: 'MISSION ROUTE', completeAt: .80 },
  'final-relay': { title: 'REACH THE FINAL RELAY', label: 'MISSION ROUTE', completeAt: .82 }
});

const FALLBACK_OBJECTIVE = {
  title: 'COMPLETE THE ACTIVE ROUTE',
  label: 'MISSION ROUTE',
  completeAt: .78,
  id: 'active-mission'
};

const states = new WeakMap();

const missionId = scene =>
  scene?.mission?.id ||
  scene?.sys?.settings?.data?.missionId ||
  scene?.registry?.get?.('missionId') ||
  scene?.registry?.get?.('activeMission')?.id ||
  null;

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, Number(v) || 0));

const worldWidth = scene =>
  scene?.physics?.world?.bounds?.width || scene?.scale?.width || 1;

function viewport(scene) {
  const w = scene?.scale?.gameSize?.width || scene?.scale?.width || window.innerWidth || 1280;
  const h = scene?.scale?.gameSize?.height || scene?.scale?.height || window.innerHeight || 720;
  return { w, h, mobile: w <= 760 };
}

function buildPanel(scene, objective) {
  const colors = {
    cyan: 0x55e9ff,
    cyanBright: 0xb9f8ff,
    violet: 0x8b65ff,
    amber: 0xffca70,
    green: 0x55e5a1,
    white: 0xf3fbff,
    muted: 0x7895a7,
    dark: 0x040a14,
    dark2: 0x091523,
    track: 0x102232
  };

  const c = scene.add.container(0, 0)
    .setScrollFactor(0)
    .setDepth(9200)
    .setAlpha(0);

  c.setData?.('mobileLayoutRole', 'mission-objective');

  const shadow = scene.add.rectangle(5, 6, 420, 178, 0x000000, .30).setOrigin(0);
  const bg = scene.add.rectangle(0, 0, 420, 178, colors.dark, .97).setOrigin(0)
    .setStrokeStyle(1, colors.cyan, .68);
  const inner = scene.add.rectangle(7, 7, 406, 164, colors.dark2, .85).setOrigin(0)
    .setStrokeStyle(1, 0xffffff, .05);

  const leftRail = scene.add.rectangle(0, 8, 3, 162, colors.cyan, 1).setOrigin(0);
  const topRail = scene.add.rectangle(24, 10, 372, 1, colors.cyan, .36).setOrigin(0);
  const topHot = scene.add.rectangle(24, 12, 116, 1, colors.violet, .90).setOrigin(0);

  const statusRing = scene.add.circle(28, 28, 7, colors.cyan, 0).setStrokeStyle(1, colors.cyan, .36);
  const statusDot = scene.add.circle(28, 28, 3.5, colors.cyanBright, 1);

  const header = scene.add.text(42, 18, 'MISSION ROUTE // ACTIVE', {
    fontFamily: 'monospace', fontSize: '9px', fontStyle: 'bold',
    color: '#66eaff', letterSpacing: 1.4
  });
  const statusText = scene.add.text(396, 18, 'LIVE', {
    fontFamily: 'monospace', fontSize: '7px', fontStyle: 'bold',
    color: '#b9f8ff', letterSpacing: 1.3
  }).setOrigin(1, 0);

  const title = scene.add.text(24, 40, objective.title, {
    fontFamily: 'monospace', fontSize: '14px', fontStyle: 'bold', color: '#f3fbff',
    lineSpacing: 2, wordWrap: { width: 370 }
  });

  const routeLabel = scene.add.text(24, 73, `// ${objective.label}`, {
    fontFamily: 'monospace', fontSize: '8px', color: '#7895a7', letterSpacing: 1.4
  });

  const mapBg = scene.add.rectangle(24, 94, 372, 42, colors.track, .95).setOrigin(0, .5)
    .setStrokeStyle(1, colors.cyan, .16);
  const mapLine = scene.add.rectangle(33, 94, 354, 2, colors.cyan, .19).setOrigin(0, .5);

  const mapGlow = scene.add.rectangle(33, 94, 0, 4, colors.cyan, .42).setOrigin(0, .5);
  const mapHot = scene.add.rectangle(33, 93.2, 0, 1.2, colors.cyanBright, .9).setOrigin(0, .5);
  const playerMarker = scene.add.circle(33, 94, 4.5, colors.cyanBright, 1);
  const goalMarker = scene.add.circle(387, 94, 5.5, colors.amber, 1);

  const startMarker = scene.add.circle(33, 94, 3.5, colors.green, 1);
  const checkpointMarkers = [];

  const routeData = Array.isArray(scene.mission?.checkpoints) ? scene.mission.checkpoints : [];
  const ww = worldWidth(scene);
  for (const cp of routeData.slice(0, 7)) {
    const x = 33 + clamp((cp?.x || 0) / ww) * 354;
    const outer = scene.add.circle(x, 94, 5, colors.violet, 0).setStrokeStyle(1, colors.violet, .82);
    const innerDot = scene.add.circle(x, 94, 2, colors.violet, .95);
    checkpointMarkers.push({ outer, innerDot });
  }

  const percent = scene.add.text(24, 112, '0%', {
    fontFamily: 'monospace', fontSize: '8px', fontStyle: 'bold', color: '#dffcff', letterSpacing: 1
  });
  const zoneText = scene.add.text(396, 112, 'START → RELAY', {
    fontFamily: 'monospace', fontSize: '7px', fontStyle: 'bold', color: '#8ba6b6', letterSpacing: .9
  }).setOrigin(1, 0);

  const footerLine = scene.add.rectangle(24, 146, 372, 1, 0xffffff, .06).setOrigin(0);
  const footer = scene.add.text(24, 154, '● NAVIGATION LOCKED  /  FOLLOW THE NEON TRACE', {
    fontFamily: 'monospace', fontSize: '7px', fontStyle: 'bold', color: '#628292', letterSpacing: .9
  });
  const telemetry = scene.add.text(396, 154, 'R-01', {
    fontFamily: 'monospace', fontSize: '7px', fontStyle: 'bold', color: '#5cd9ef', letterSpacing: 1
  }).setOrigin(1, 0);

  c.add([
    shadow, bg, inner, leftRail, topRail, topHot,
    statusRing, statusDot, header, statusText, title, routeLabel,
    mapBg, mapLine, mapGlow, mapHot, startMarker, playerMarker, goalMarker,
    ...checkpointMarkers.flatMap(v => [v.outer, v.innerDot]),
    percent, zoneText, footerLine, footer, telemetry
  ]);

  scene.tweens?.add?.({ targets: statusDot, alpha: { from: .35, to: 1 }, scale: { from: .9, to: 1.1 }, duration: 720, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  scene.tweens?.add?.({ targets: statusRing, alpha: { from: .08, to: .42 }, scale: { from: .9, to: 1.17 }, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  scene.tweens?.add?.({ targets: topHot, alpha: { from: .20, to: 1 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

  return {
    c, bg, leftRail, topRail, topHot, statusDot, statusRing, header, statusText,
    title, routeLabel, mapGlow, mapHot, playerMarker, goalMarker, startMarker,
    checkpointMarkers, percent, zoneText, footer, telemetry, scale: 1, x: 0, y: 0,
    objective, completed: false, lastProgress: -1
  };
}

function layout(state, scene, force = false) {
  const { w, h, mobile } = viewport(scene);
  const panelW = mobile ? Math.min(320, Math.max(250, w - 20)) : Math.min(420, Math.max(340, w - 48));
  const scale = panelW / 420;
  const actualH = 178 * scale;
  const x = mobile ? Math.max(10, w - panelW - 10) : Math.max(24, w - panelW - 28);
  const y = mobile ? Math.max(74, h - actualH - 98) : Math.max(86, h - actualH - 28);
  if (!force && state.x === x && state.y === y && state.scale === scale) return;
  state.x = x; state.y = y; state.scale = scale;
  state.c.setPosition(x, y).setScale(scale);
}

export function clearMissionObjective(scene) {
  const s = states.get(scene) || scene?.__missionObjectiveState;
  s?.c?.destroy?.();
  s?.hudSkins?.forEach(item => item?.destroy?.());
  states.delete(scene);
  if (scene) {
    scene.__missionObjectiveState = null;
    scene.__missionObjective = null;
  }
}

export function applyMissionObjective(scene, id = missionId(scene)) {
  clearMissionObjective(scene);
  if (!scene?.add) return null;
  const objective = { ...(MISSION_OBJECTIVES[id] || FALLBACK_OBJECTIVE), id: id || FALLBACK_OBJECTIVE.id };
  const ui = buildPanel(scene, objective);
  const state = { ...ui, hudSkinned: true, hudSkins: [], pendingReveal: false };
  states.set(scene, state);
  scene.__missionObjectiveState = state;
  scene.__missionObjective = objective;
  layout(state, scene, true);
  state.c.setVisible(true);
  scene.tweens?.add?.({ targets: state.c, alpha: { from: 0, to: 1 }, y: { from: state.y + 12, to: state.y }, duration: 240, ease: 'Quad.easeOut' });
  return objective;
}

export function updateMissionObjective(scene) {
  const s = states.get(scene);
  if (!s || !scene?.player) return;
  if (window.__relayCinematicLock) { s.c.setVisible(false); return; }
  s.c.setVisible(true);
  layout(s, scene);

  const p = clamp(scene.player.x / worldWidth(scene));
  if (Math.abs(p - s.lastProgress) < .002) return;
  s.lastProgress = p;

  const width = 354 * p;
  s.mapGlow.width = width;
  s.mapHot.width = width;
  s.playerMarker.x = 33 + width;
  s.percent.setText(`${Math.round(p * 100)}%`);

  const missionZone = scene.mission?.zone || scene.mission?.district || '';
  if (missionZone) s.zoneText.setText(String(missionZone).toUpperCase());
  s.telemetry.setText(`R-${String(Math.round(p * 99)).padStart(2, '0')}`);

  if (!s.completed && p >= s.objective.completeAt) {
    s.completed = true;
    s.mapGlow.width = 354;
    s.mapHot.width = 354;
    s.playerMarker.x = 387;
    s.percent.setText('100%');
    s.statusText.setText('SECURED');
    s.header.setText('MISSION ROUTE // SECURED');
    s.footer.setText('● ROUTE GOAL SECURED  /  RELAY ONLINE');
    s.footer.setColor?.('#69efb0');
    s.statusText.setColor?.('#69efb0');
    s.header.setColor?.('#69efb0');
    s.leftRail.setFillStyle?.(0x55e5a1, 1);
    s.bg.setStrokeStyle?.(1, 0x55e5a1, .72);
    s.mapGlow.setFillStyle?.(0x55e5a1, .52);
    s.mapHot.setFillStyle?.(0xc4ffe1, .95);
    scene.tweens?.add?.({ targets: s.c, scaleX: s.scale * 1.025, scaleY: s.scale * 1.025, yoyo: true, repeat: 1, duration: 130, ease: 'Quad.easeOut' });
    scene.events?.emit?.('mission-objective-complete', { id: missionId(scene), objective: s.objective });
  }
}

// ============================================================
// FUTURISTIC NEON WORLD V1
// Replaces the old environment renderer and rebuilds the route
// from the mission hook without touching RunnerScene.js directly.
// ============================================================
const WORLD_SKINS = Object.freeze({
  'first-delivery': { accent: 0x55e9ff, secondary: 0x8b65ff, sky: 0x030813, zone: 'NEON DISTRICT' },
  'dead-drop': { accent: 0xff7f66, secondary: 0xffca70, sky: 0x060b14, zone: 'DOCK SECTOR' },
  blackout: { accent: 0x55e9ff, secondary: 0x69efb0, sky: 0x02060d, zone: 'BLACK GRID' },
  pursuit: { accent: 0xff5364, secondary: 0x55e9ff, sky: 0x050813, zone: 'RAIL SPINE' },
  'signal-storm': { accent: 0x9f7bff, secondary: 0x55e9ff, sky: 0x070511, zone: 'CROWN ARRAY' },
  'corporate-lockdown': { accent: 0xff5364, secondary: 0xffca70, sky: 0x07090f, zone: 'HELIX VERTICAL' },
  'final-relay': { accent: 0xffca70, secondary: 0x55e9ff, sky: 0x06050b, zone: 'APEX SPINE' }
});

function futuristicRoute(scene) {
  const mission = scene.mission;
  const start = Number(mission.spawn?.x) || 120;
  const end = Math.max(start + 2400, Number(mission.goal?.x) || start + 6000);
  const span = end - start;
  const skin = WORLD_SKINS[mission.id] || WORLD_SKINS['first-delivery'];

  const basePlatforms = [];
  const obstacles = [];
  const boosts = [];
  const checkpoints = [];
  const signals = [];
  const guides = [];
  const movingGates = [];

  // Continuous low-line sectors with deliberate vertical breaks.
  for (let i = 0; i < 9; i++) {
    const x = start + i * (span / 9);
    const gap = i === 0 ? 0 : 72 + (i % 3) * 24;
    const width = Math.max(300, span / 9 - gap);
    const y = 610 - (i % 4 === 1 ? 28 : i % 4 === 2 ? 58 : 0);
    basePlatforms.push([x, y, width, 110]);

    if (i > 0) boosts.push([x + 42, y - 22]);
    if (i > 1 && i < 8) obstacles.push([x + width * .52, y - 32]);
  }

  // Rooftop chain: the faster high-line route.
  for (let i = 0; i < 10; i++) {
    const x = start + 230 + i * (span / 10);
    const y = 450 - (i % 3) * 42;
    basePlatforms.push([x, y, 170 + (i % 2) * 28, 20, 'roof']);
    signals.push([x + 72, y - 28]);
  }

  const checkpointX = [0.24, 0.52, 0.78];
  checkpointX.forEach((ratio, index) => {
    const x = start + span * ratio;
    checkpoints.push([x, 535 - (index % 2) * 40]);
    signals.push([x + 70, 520 - (index % 2) * 36]);
    if (index > 0) movingGates.push([x + 125, 420, 370, 560]);
  });

  // Low-line signal collection ensures the route remains readable.
  for (let i = 0; i < 10; i++) {
    const x = start + 260 + i * ((span - 520) / 9);
    const y = 548 - (i % 4 === 1 ? 62 : i % 4 === 2 ? 20 : 0);
    signals.push([x, y]);
  }

  // Mission-specific pacing beats.
  guides.push(
    { x: start + 120, y: 525, text: 'NEON GATE // FOLLOW THE TRACE' },
    { x: start + span * .30, y: 410, text: 'VERTICAL ROUTE // TAKE THE HIGH LINE' },
    { x: start + span * .58, y: 490, text: 'CHECKPOINT // MOMENTUM IS YOUR SHIELD' },
    { x: start + span * .84, y: 410, text: `${skin.zone} // FINAL APPROACH` }
  );

  mission.platforms = basePlatforms;
  mission.obstacles = obstacles;
  mission.boostPads = boosts;
  mission.checkpoints = checkpoints;
  mission.signals = signals.slice(0, 24);
  mission.guides = guides;
  mission.movingGates = movingGates;
  mission.safeZones = checkpoints.map(([x, y]) => [Math.max(start, x - 100), y + 30, 200]);

  // Keep mission abilities/boss progression intact while relocating ordinary threats.
  const enemyTypes = ['enemy-runner', 'security', 'alien-ground', 'invader', 'dino'];
  mission.enemies = enemyTypes.slice(0, 4).map((type, index) => {
    const x = start + span * (.18 + index * .18);
    return { type, x, y: 510 - (index % 2) * 85, min: x - 120, max: x + 120 };
  });

  mission.goal.x = end;
  mission.goal.y = 535;
  mission.__futuristicWorld = true;
}

function createFuturisticEnvironment() {
  const mission = this.mission || {};
  const skin = WORLD_SKINS[mission.id] || WORLD_SKINS['first-delivery'];
  const width = this.worldWidth + 600;
  const height = 860;

  const sky = this.add.graphics().setScrollFactor(0).setDepth(-20);
  sky.fillStyle(skin.sky, 1).fillRect(0, 0, 1600, height);

  const horizon = this.add.graphics().setScrollFactor(.08).setDepth(-19);
  horizon.fillGradientStyle(skin.sky, 0x071426, skin.sky, 0x02040a, 1, 1, 1, 1).fillRect(0, 0, width, height);

  // Procedural star field.
  for (let i = 0; i < 90; i++) {
    const x = (i * 173) % width;
    const y = 55 + ((i * 97) % 330);
    const r = i % 11 === 0 ? 2 : 1;
    horizon.fillStyle(i % 5 === 0 ? skin.secondary : skin.accent, .22 + (i % 4) * .08).fillCircle(x, y, r);
  }

  // Giant holographic skyline.
  const far = this.add.graphics().setScrollFactor(.18).setDepth(-15);
  for (let x = -160, i = 0; x < width + 280; x += 150, i++) {
    const h = 150 + ((i * 53) % 240);
    const w = 92 + ((i * 29) % 50);
    far.fillStyle(0x081322, .95).fillRect(x, 570 - h, w, h);
    far.lineStyle(1, skin.accent, .20).strokeRect(x, 570 - h, w, h);
    for (let y = 585 - h; y < 560; y += 26) {
      far.fillStyle(i % 3 === 0 ? skin.secondary : skin.accent, .16).fillRect(x + 14, y, 9, 4);
      far.fillRect(x + 38, y, 9, 4);
      far.fillRect(x + 62, y, 9, 4);
    }
  }

  // Animated hologram towers and route pylons.
  const mid = this.add.graphics().setScrollFactor(.45).setDepth(-10);
  for (let x = 80, i = 0; x < width + 300; x += 330, i++) {
    const h = 210 + (i % 4) * 45;
    mid.fillStyle(0x0a1829, .98).fillRoundedRect(x, 610 - h, 165, h, 8);
    mid.lineStyle(2, skin.accent, .34).strokeRoundedRect(x, 610 - h, 165, h, 8);
    mid.fillStyle(skin.secondary, .10).fillRect(x + 20, 610 - h + 20, 125, h - 45);
    mid.lineStyle(1, skin.secondary, .25).lineBetween(x + 82, 610 - h, x + 82, 610);

    for (let y = 350; y < 590; y += 46) {
      mid.fillStyle(skin.accent, .25).fillRect(x + 28, y, 14, 5);
      mid.fillRect(x + 62, y, 14, 5);
      mid.fillStyle(skin.secondary, .20).fillRect(x + 96, y, 14, 5);
      mid.fillRect(x + 130, y, 14, 5);
    }
  }

  // Giant orbital rings behind the route.
  const rings = this.add.graphics().setScrollFactor(.03).setDepth(-8);
  const ringBase = Math.max(780, Math.min(width * .68, 1180));
  rings.lineStyle(3, skin.accent, .16).strokeCircle(ringBase, 250, 150).strokeCircle(ringBase, 250, 205);
  rings.lineStyle(1, skin.secondary, .18).strokeCircle(ringBase, 250, 270);
  rings.fillStyle(skin.accent, .06).fillCircle(ringBase, 250, 130);

  // Ground grid.
  const grid = this.add.graphics().setScrollFactor(.82).setDepth(-2);
  grid.fillStyle(0x040b14, .96).fillRect(0, 610, width, 250);
  grid.lineStyle(1, skin.accent, .10);
  for (let x = 0; x < width; x += 80) grid.lineBetween(x, 610, x + 180, 860);
  for (let y = 650; y < 860; y += 42) grid.lineBetween(0, y, width, y);
  grid.lineStyle(3, skin.accent, .18).lineBetween(0, 610, width, 610);

  // Route beacons are physical map landmarks, not just UI.
  this.mission.checkpoints?.forEach(([x, y], index) => {
    const beam = this.add.rectangle(x, 535, 4, 150, skin.accent, .08).setDepth(-1);
    const core = this.add.circle(x, y - 8, 10, skin.accent, .24).setDepth(-1);
    core.setStrokeStyle(2, skin.accent, .75);
    if (!this.motionReduced) {
      this.tweens.add({ targets: core, scale: 1.5, alpha: { from: .12, to: .32 }, duration: 900 + index * 120, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.tweens.add({ targets: beam, alpha: { from: .03, to: .12 }, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
  });

  // Start/goal skyline signatures.
  const startNode = this.add.circle(mission.spawn.x + 30, mission.spawn.y - 70, 26, skin.secondary, .08).setDepth(-1);
  startNode.setStrokeStyle(2, skin.secondary, .45);
  const goalNode = this.add.circle(mission.goal.x + 30, mission.goal.y + 15, 46, skin.accent, .10).setDepth(-1);
  goalNode.setStrokeStyle(3, skin.accent, .78);

  if (!this.motionReduced) {
    this.tweens.add({ targets: goalNode, scale: 1.28, alpha: { from: .06, to: .20 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.tweens.add({ targets: startNode, scale: 1.14, alpha: { from: .04, to: .15 }, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  const badge = this.add.text(34, 34, `${skin.zone} // FUTURE GRID`, {
    fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold', color: '#8df4ff', letterSpacing: 1.5
  }).setScrollFactor(0).setDepth(10).setAlpha(.75);

  this.futuristicWorldBadge = badge;
}

function installFuturisticWorldPatch() {
  if (RunnerScene.prototype.__futuristicNeonWorldPatched) return;

  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;
  const originalShutdown = RunnerScene.prototype.shutdown;

  // Replace environment renderer: the old city/district renderer is no longer used.
  RunnerScene.prototype.createEnvironment = function futuristicCreateEnvironment() {
    createFuturisticEnvironment.call(this);
  };

  RunnerScene.prototype.create = function futuristicWorldCreate(...args) {
    futuristicRoute(this);
    const result = originalCreate.apply(this, args);
    try { this.game.events.emit('world-style', 'FUTURISTIC_NEON_WORLD'); } catch {}
    return result;
  };

  RunnerScene.prototype.update = function futuristicWorldUpdate(...args) {
    const result = originalUpdate.apply(this, args);
    if (this.futuristicWorldBadge) {
      this.futuristicWorldBadge.setText(`${(WORLD_SKINS[this.mission?.id] || WORLD_SKINS['first-delivery']).zone} // FUTURE GRID`);
    }
    return result;
  };

  RunnerScene.prototype.shutdown = function futuristicWorldShutdown(...args) {
    this.futuristicWorldBadge?.destroy?.();
    this.futuristicWorldBadge = null;
    return originalShutdown?.apply(this, args);
  };

  RunnerScene.prototype.__futuristicNeonWorldPatched = true;
}

if (!RunnerScene.prototype.__missionObjectivesV1Patched) {
  installFuturisticWorldPatch();

  const baseCreate = RunnerScene.prototype.create;
  const baseUpdate = RunnerScene.prototype.update;
  const baseShutdown = RunnerScene.prototype.shutdown;

  RunnerScene.prototype.create = function missionObjectivesCreate(...args) {
    const result = baseCreate.apply(this, args);
    try { applyMissionObjective(this); }
    catch (error) { console.error('[MissionObjectivesV1] create failed', error); }
    return result;
  };

  RunnerScene.prototype.update = function missionObjectivesUpdate(...args) {
    const result = baseUpdate.apply(this, args);
    try { updateMissionObjective(this); }
    catch (error) { console.error('[MissionObjectivesV1] update failed', error); }
    return result;
  };

  RunnerScene.prototype.shutdown = function missionObjectivesShutdown(...args) {
    try { clearMissionObjective(this); } catch (error) { console.error('[MissionObjectivesV1] shutdown failed', error); }
    return baseShutdown?.apply(this, args);
  };

  RunnerScene.prototype.__missionObjectivesV1Patched = true;
}
