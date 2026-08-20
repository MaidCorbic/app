import { RunnerScene } from '../scenes/RunnerScene.js';

export const MISSION_OBJECTIVES = Object.freeze({
  'first-delivery': { title: 'DELIVER THE SIGNAL PACKAGE', label: 'DELIVERY ROUTE', completeAt: .72 },
  'dead-drop': { title: 'SECURE THE DROP', label: 'DROP ROUTE', completeAt: .76 },
  blackout: { title: 'RESTORE THE GRID', label: 'GRID ROUTE', completeAt: .70 },
  pursuit: { title: 'ESCAPE THE INTERCEPTOR', label: 'ESCAPE ROUTE', completeAt: .78 },
  'signal-storm': { title: 'STABILIZE THE ARRAY', label: 'STORM ROUTE', completeAt: .74 },
  'corporate-lockdown': { title: 'BREACH THE LOCKDOWN', label: 'BREACH ROUTE', completeAt: .80 },
  'final-relay': { title: 'REACH THE FINAL RELAY', label: 'FINAL ROUTE', completeAt: .82 },
});

const states = new WeakMap();
const TUTORIAL_TEXT = /TUTORIAL|RUNNER LESSON|PRACTICE IT NOW|BOOST PAD|DOUBLE JUMP|HOLD S|BLACKOUT|WALL ROUTES|CHASE|AIR DASH|STORM|COMBINE|LOCKDOWN|ELITE|FINAL RUN|CITYSPINE|CHECKPOINT/i;
const FALLBACK_OBJECTIVE = { title: 'COMPLETE THE ACTIVE ROUTE', label: 'MISSION ROUTE', completeAt: .78 };

function missionId(scene) {
  return scene?.mission?.id || scene?.sys?.settings?.data?.missionId || scene?.registry?.get?.('missionId') || scene?.registry?.get?.('activeMission')?.id || null;
}
function worldWidth(scene) { return scene?.physics?.world?.bounds?.width || scene?.scale?.width || 1; }
function clamp(v, min = 0, max = 1) { return Math.max(min, Math.min(max, v || 0)); }
function viewport(scene) {
  const w = scene?.scale?.gameSize?.width || scene?.scale?.width || window.innerWidth || 1280;
  const h = scene?.scale?.gameSize?.height || scene?.scale?.height || window.innerHeight || 720;
  return { w, h, mobile: w <= 760 };
}
function tutorialBounds(scene) {
  const list = scene?.children?.list || [];
  const matches = list.filter(child => child?.active && child.visible !== false && child.type === 'Text' && TUTORIAL_TEXT.test(String(child.text || '')));
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  matches.forEach(child => {
    const b = child.getBounds?.();
    if (!b) return;
    minX = Math.min(minX, b.x); minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.right); maxY = Math.max(maxY, b.bottom);
  });
  const explicit = scene?.firstTimeTutorial === true || (scene?.routeTutorials?.size || 0) > 0 || !!scene?.intelCard?.visible;
  if (!matches.length && !explicit) return null;
  if (!Number.isFinite(minY)) return { x: 40, y: 340, right: 500, bottom: 540 };
  return { x: Math.max(0, minX - 24), y: Math.max(0, minY - 24), right: maxX + 24, bottom: maxY + 86 };
}
function buildPanel(scene, objective) {
  const c = scene.add.container(0, 0).setScrollFactor(0).setDepth(9200).setAlpha(0);
  // Compact objective card: same dark/cyan visual language as the existing mission and signal HUD.
  const bg = scene.add.rectangle(0, 0, 372, 148, 0x07111f, .94).setOrigin(0).setStrokeStyle(1, 0x38bdf8, .72);
  const accent = scene.add.rectangle(0, 0, 4, 148, 0x38bdf8, .9).setOrigin(0);
  const kicker = scene.add.text(22, 16, 'MISSION OBJECTIVE', { fontFamily:'monospace', fontSize:'9px', color:'#8ecae6', letterSpacing:1.5 });
  const title = scene.add.text(22, 36, objective.title, { fontFamily:'monospace', fontSize:'15px', fontStyle:'bold', color:'#e8f8ff', wordWrap:{width:326} });
  const label = scene.add.text(22, 78, objective.label, { fontFamily:'monospace', fontSize:'8px', color:'#8fa6bb', letterSpacing:1.2 });
  const progress = scene.add.text(22, 96, 'ROUTE PROGRESS  0%', { fontFamily:'monospace', fontSize:'10px', color:'#d6efff' });
  const track = scene.add.rectangle(22, 126, 328, 5, 0x13243a, 1).setOrigin(0,.5);
  const fill = scene.add.rectangle(22, 126, 0, 5, 0x38bdf8, 1).setOrigin(0,.5);
  const status = scene.add.text(22, 136, 'OBJECTIVE IN PROGRESS', { fontFamily:'monospace', fontSize:'7px', color:'#6ebfe8', letterSpacing:1.2 });
  c.add([bg,accent,kicker,title,label,progress,track,fill,status]);
  return { c, bg, accent, kicker, title, label, progress, track, fill, status };
}
function layout(state, scene, force = false) {
  const { w, h, mobile } = viewport(scene);
  const tutorial = tutorialBounds(scene);
  const baseW = 372, baseH = 148;
  const pw = mobile ? Math.min(300, w - 24) : Math.min(372, Math.max(286, w - 56));
  const scale = pw / baseW;
  const actualH = baseH * scale;
  // Bottom-right docking keeps the top status/atmosphere lane completely clear.
  let x = Math.max(12, w - pw - (mobile ? 12 : 28));
  let y = Math.max(88, h - actualH - (mobile ? 18 : 28));
  // If a tutorial reaches unusually far into the bottom lane, keep a visible gap instead of overlap.
  if (tutorial && tutorial.right > x - 8 && tutorial.bottom > y - 8) {
    y = Math.max(88, tutorial.y - actualH - 16);
  }
  if (!force && state.x === x && state.y === y && state.scale === scale && state.tutorial === !!tutorial) return;
  state.x = x; state.y = y; state.scale = scale; state.tutorial = !!tutorial;
  state.c.setPosition(x, y).setScale(scale);
}
function reveal(state, scene) {
  if (state.visible) return;
  state.visible = true;
  layout(state, scene, true);
  state.c.setVisible(true);
  scene.tweens?.add?.({ targets:state.c, alpha:{from:0,to:1}, duration:160, ease:'Quad.easeOut' });
}
export function applyMissionObjective(scene, id = missionId(scene)) {
  clearMissionObjective(scene);
  if (!scene?.add) return null;
  const objective = MISSION_OBJECTIVES[id] || { ...FALLBACK_OBJECTIVE, id: id || 'active-mission' };
  const ui = buildPanel(scene, objective);
  const state = { objective, ...ui, completed:false, last:-1, visible:false, x:null, y:null, scale:null, tutorial:null };
  states.set(scene,state); scene.__missionObjectiveState=state; scene.__missionObjective=objective;
  reveal(state, scene);
  return objective;
}
export function updateMissionObjective(scene) {
  const s = states.get(scene); if (!s || !scene.player) return;
  layout(s, scene);
  const p = clamp(scene.player.x / worldWidth(scene));
  if (Math.abs(p - s.last) < .002) return;
  s.last = p;
  const pct = Math.round(p * 100);
  s.fill.width = 328 * p;
  s.progress.setText(`ROUTE PROGRESS  ${pct}%`);
  if (!s.completed && p >= s.objective.completeAt) {
    s.completed = true;
    s.fill.width = 328;
    s.progress.setText('OBJECTIVE COMPLETE');
    s.kicker.setText('OBJECTIVE COMPLETE');
    s.status.setText('ROUTE GOAL SECURED');
    scene.tweens?.add?.({ targets:s.c, scaleX:{from:s.scale,to:s.scale*1.025}, scaleY:{from:s.scale,to:s.scale*1.025}, yoyo:true, duration:140, repeat:1 });
    scene.events?.emit?.('mission-objective-complete',{ id:missionId(scene), objective:s.objective });
  }
}
export function clearMissionObjective(scene) {
  const s = states.get(scene) || scene.__missionObjectiveState;
  s?.c?.destroy?.(); states.delete(scene);
  scene.__missionObjectiveState = null; scene.__missionObjective = null;
}

if (!RunnerScene.prototype.__missionObjectivesV1Patched) {
  const create = RunnerScene.prototype.create, update = RunnerScene.prototype.update, shutdown = RunnerScene.prototype.shutdown;
  RunnerScene.prototype.create = function(...a) { const r=create.apply(this,a); try { applyMissionObjective(this); } catch(e) { console.error('[MissionObjectivesV1] create failed',e); } return r; };
  RunnerScene.prototype.update = function(...a) { const r=update.apply(this,a); try { updateMissionObjective(this); } catch(e) { console.error('[MissionObjectivesV1] update failed',e); } return r; };
  RunnerScene.prototype.shutdown = function(...a) { try { clearMissionObjective(this); } catch(e) { console.error('[MissionObjectivesV1] shutdown failed',e); } return typeof shutdown === 'function' ? shutdown.apply(this,a) : undefined; };
  RunnerScene.prototype.__missionObjectivesV1Patched = true;
}
