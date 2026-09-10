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

if (!RunnerScene.prototype.__missionObjectivesV1Patched) {
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
