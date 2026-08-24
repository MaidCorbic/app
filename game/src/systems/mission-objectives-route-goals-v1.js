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

function missionId(scene) { return scene?.mission?.id || scene?.sys?.settings?.data?.missionId || scene?.registry?.get?.('missionId') || scene?.registry?.get?.('activeMission')?.id || null; }
function worldWidth(scene) { return scene?.physics?.world?.bounds?.width || scene?.scale?.width || 1; }
function clamp(v, min = 0, max = 1) { return Math.max(min, Math.min(max, v || 0)); }
function viewport(scene) {
  const w = scene?.scale?.gameSize?.width || scene?.scale?.width || window.innerWidth || 1280;
  const h = scene?.scale?.gameSize?.height || scene?.scale?.height || window.innerHeight || 720;
  return { w, h, mobile: w <= 760, landscape: w > h };
}
function tutorialBounds(scene) {
  const list = scene?.children?.list || [];
  const matches = list.filter(child => child?.active && child.visible !== false && child.type === 'Text' && TUTORIAL_TEXT.test(String(child.text || '')));
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  matches.forEach(child => { const b = child.getBounds?.(); if (!b) return; minX = Math.min(minX, b.x); minY = Math.min(minY, b.y); maxX = Math.max(maxX, b.right); maxY = Math.max(maxY, b.bottom); });
  const explicit = scene?.firstTimeTutorial === true || (scene?.routeTutorials?.size || 0) > 0 || !!scene?.intelCard?.visible;
  if (!matches.length && !explicit) return null;
  if (!Number.isFinite(minY)) return { x: 40, y: 340, right: 500, bottom: 540 };
  return { x: Math.max(0, minX - 24), y: Math.max(0, minY - 24), right: maxX + 24, bottom: maxY + 86 };
}

function buildPanel(scene, objective) {
  const c = scene.add.container(0, 0).setScrollFactor(0).setDepth(9200).setAlpha(0);
  const bg = scene.add.rectangle(0, 0, 438, 176, 0x020914, .965).setOrigin(0).setStrokeStyle(1.5, 0x19c8f5, .82);
  const inner = scene.add.rectangle(7, 7, 424, 162, 0x071425, .74).setOrigin(0).setStrokeStyle(1, 0x8df4ff, .18);
  const topRail = scene.add.rectangle(0, 0, 438, 4, 0x8df4ff, .9).setOrigin(0);
  const leftRail = scene.add.rectangle(0, 0, 4, 176, 0x19c8f5, .92).setOrigin(0);
  const rightRail = scene.add.rectangle(434, 0, 4, 176, 0xb993ff, .62).setOrigin(0);
  const kicker = scene.add.text(20, 17, 'MISSION // ACTIVE ROUTE', { fontFamily:'monospace', fontSize:'9px', color:'#8df4ff', letterSpacing:1.5 });
  const title = scene.add.text(20, 41, objective.title, { fontFamily:'monospace', fontSize:'15px', fontStyle:'bold', color:'#f2fbff', wordWrap:{width:394}, lineSpacing:2 });
  const label = scene.add.text(20, 92, objective.label, { fontFamily:'monospace', fontSize:'8px', color:'#91a9c0', letterSpacing:1.4 });
  const progress = scene.add.text(20, 112, 'ROUTE PROGRESS  0%', { fontFamily:'monospace', fontSize:'10px', color:'#dffaff', letterSpacing:.5 });
  const track = scene.add.rectangle(20, 140, 398, 7, 0x0c2035, 1).setOrigin(0,.5);
  const fill = scene.add.rectangle(20, 140, 0, 7, 0x19c8f5, 1).setOrigin(0,.5);
  const fillGlow = scene.add.rectangle(20, 140, 0, 2, 0xe2fbff, .9).setOrigin(0,.5);
  const status = scene.add.text(20, 153, 'OBJECTIVE IN PROGRESS', { fontFamily:'monospace', fontSize:'7px', color:'#6ec7e8', letterSpacing:1.2 });
  const corner = scene.add.text(412, 17, '01', { fontFamily:'monospace', fontSize:'8px', color:'#b993ff' }).setOrigin(1,0);
  c.add([bg,inner,topRail,leftRail,rightRail,kicker,title,label,progress,track,fill,fillGlow,status,corner]);
  return { c, bg, inner, topRail, leftRail, rightRail, kicker, title, label, progress, track, fill, fillGlow, status, corner };
}

function layout(state, scene, force = false) {
  const { w, h, mobile, landscape } = viewport(scene);
  const tutorial = tutorialBounds(scene);
  const baseW = 438, baseH = 176;
  const mobileLandscape = mobile && landscape;
  const pw = mobileLandscape ? Math.min(330, Math.max(292, w - 330)) : mobile ? Math.min(342, w - 24) : Math.min(500, Math.max(380, w - 64));
  const scale = pw / baseW;
  const actualH = baseH * scale;

  let x;
  let y;
  if (mobileLandscape) {
    x = Math.round((w - pw) / 2);
    const top = Math.max(86, Math.round(h * .18));
    const bottom = Math.max(top, h - actualH - 150);
    y = Math.min(top, bottom);
  } else if (mobile) {
    x = Math.round((w - pw) / 2);
    y = Math.max(82, Math.round(h * .17));
  } else {
    x = Math.round((w - pw) / 2);
    y = Math.max(92, Math.round(h * .18));
    if (tutorial && tutorial.right > x - 8 && tutorial.bottom > y - 8) y = Math.max(82, tutorial.y - actualH - 18);
  }

  if (!force && state.x === x && state.y === y && state.scale === scale && state.tutorial === !!tutorial) return;
  state.x = x; state.y = y; state.scale = scale; state.tutorial = !!tutorial;
  state.c.setPosition(x, y).setScale(scale);
}

function skinExistingHud(scene, state) { state.hudSkinned = true; }

function reveal(state, scene) {
  if (window.__relayCinematicLock || document.body.classList.contains('relay-training-active')) { state.pendingReveal = true; state.visible = false; state.c.setVisible(false); return; }
  if (state.visible) return;
  state.visible = true;
  state.pendingReveal = false;
  layout(state, scene, true);
  state.c.setVisible(true);
  skinExistingHud(scene, state);
  scene.tweens?.add?.({ targets:state.c, alpha:{from:0,to:1}, y:{from:state.y-8,to:state.y}, duration:260, ease:'Cubic.easeOut' });
}

export function applyMissionObjective(scene, id = missionId(scene)) {
  clearMissionObjective(scene);
  if (!scene?.add) return null;
  const objective = MISSION_OBJECTIVES[id] || { ...FALLBACK_OBJECTIVE, id: id || 'active-mission' };
  const ui = buildPanel(scene, objective);
  const state = { objective, ...ui, completed:false, last:-1, visible:false, pendingReveal:false, x:null, y:null, scale:null, tutorial:null, hudSkinned:false };
  states.set(scene,state); scene.__missionObjectiveState=state; scene.__missionObjective=objective;
  if (document.body.classList.contains('relay-training-active') || scene.firstTimeTutorial) { state.pendingReveal = true; state.c.setVisible(false); } else reveal(state, scene);
  const revealAfterTutorial = () => { if (!state.c?.active || state.visible) return; if (document.body.classList.contains('relay-training-active')) return; reveal(state, scene); };
  window.addEventListener('relay:tutorial-complete', revealAfterTutorial, { once: true, passive: true });
  scene.events?.once?.('shutdown', () => window.removeEventListener('relay:tutorial-complete', revealAfterTutorial));
  return objective;
}

export function updateMissionObjective(scene) {
  const s = states.get(scene); if (!s || !scene.player) return;
  if (window.__relayCinematicLock || document.body.classList.contains('relay-training-active')) { s.c.setVisible(false); return; }
  if (s.pendingReveal) reveal(s, scene);
  layout(s, scene);
  const p = clamp(scene.player.x / worldWidth(scene));
  if (Math.abs(p - s.last) < .002) return;
  s.last = p;
  const pct = Math.round(p * 100);
  s.fill.width = 398 * p;
  s.fillGlow.width = 398 * p;
  s.progress.setText(`ROUTE PROGRESS  ${pct}%`);
  if (!s.completed && p >= s.objective.completeAt) {
    s.completed = true;
    s.fill.width = 398;
    s.fillGlow.width = 398;
    s.progress.setText('OBJECTIVE COMPLETE');
    s.kicker.setText('MISSION // COMPLETE');
    s.status.setText('ROUTE GOAL SECURED');
    scene.tweens?.add?.({ targets:s.c, scaleX:{from:s.scale,to:s.scale*1.035}, scaleY:{from:s.scale,to:s.scale*1.035}, yoyo:true, duration:130, repeat:1 });
    scene.events?.emit?.('mission-objective-complete',{ id:missionId(scene), objective:s.objective });
  }
}

export function clearMissionObjective(scene) {
  const s = states.get(scene) || scene.__missionObjectiveState;
  s?.c?.destroy?.();
  states.delete(scene);
  scene.__missionObjectiveState = null;
  scene.__missionObjective = null;
}

if (!RunnerScene.prototype.__missionObjectivesV1Patched) {
  const create = RunnerScene.prototype.create, update = RunnerScene.prototype.update, shutdown = RunnerScene.prototype.shutdown;
  RunnerScene.prototype.create = function(...a) { const r=create.apply(this,a); try { applyMissionObjective(this); } catch(e) { console.error('[MissionObjectivesV4] create failed',e); } return r; };
  RunnerScene.prototype.update = function(...a) { const r=update.apply(this,a); try { updateMissionObjective(this); } catch(e) { console.error('[MissionObjectivesV4] update failed',e); } return r; };
  RunnerScene.prototype.shutdown = function(...a) { try { clearMissionObjective(this); } catch(e) { console.error('[MissionObjectivesV4] shutdown failed',e); } return typeof shutdown === 'function' ? shutdown.apply(this,a) : undefined; };
  RunnerScene.prototype.__missionObjectivesV1Patched = true;
}
