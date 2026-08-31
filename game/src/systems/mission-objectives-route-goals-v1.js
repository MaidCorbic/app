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
  return { w, h, mobile: w <= 760 };
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
  c.setData?.('mobileLayoutRole', 'mission-objective');

  /* Gold command-card language: matches the established level/rank UI. */
  const bg = scene.add.rectangle(0, 0, 426, 152, 0x070a0f, .97).setOrigin(0).setStrokeStyle(1, 0xffd06e, .72);
  const inner = scene.add.rectangle(8, 8, 410, 136, 0x020305, .30).setOrigin(0).setStrokeStyle(1, 0xffd06e, .10);
  const accent = scene.add.rectangle(0, 0, 3, 152, 0xffd06e, .94).setOrigin(0);
  const topRail = scene.add.rectangle(22, 10, 382, 1, 0xffd06e, .22).setOrigin(0);
  const kicker = scene.add.text(22, 18, 'MISSION OBJECTIVE', { fontFamily:'monospace', fontSize:'10px', color:'#ffd06e', letterSpacing:1.5 });
  const title = scene.add.text(22, 42, objective.title, { fontFamily:'monospace', fontSize:'16px', fontStyle:'bold', color:'#f4f7fa', wordWrap:{width:378} });
  const label = scene.add.text(22, 90, objective.label, { fontFamily:'monospace', fontSize:'9px', color:'#a89058', letterSpacing:1.2 });
  const progress = scene.add.text(22, 108, 'ROUTE PROGRESS  0%', { fontFamily:'monospace', fontSize:'11px', color:'#ffe7a6' });
  const track = scene.add.rectangle(22, 129, 382, 6, 0x11161b, 1).setOrigin(0,.5).setStrokeStyle(1, 0xffd06e, .12);
  const fill = scene.add.rectangle(22, 129, 0, 6, 0xffd06e, 1).setOrigin(0,.5);
  const status = scene.add.text(22, 141, 'OBJECTIVE IN PROGRESS', { fontFamily:'monospace', fontSize:'7px', color:'#89764b', letterSpacing:1.2 });
  c.add([bg,inner,accent,topRail,kicker,title,label,progress,track,fill,status]);
  return { c, bg, inner, accent, topRail, kicker, title, label, progress, track, fill, status };
}

function layout(state, scene, force = false) {
  const { w, h, mobile } = viewport(scene);
  const tutorial = tutorialBounds(scene);
  const baseW = 426, baseH = 152;
  if (mobile) {
    /* Lower-right on mobile, above touch controls and below the top HUD. */
    const pw = Math.min(270, Math.max(220, w - 24));
    const scale = pw / baseW;
    const actualH = baseH * scale;
    const x = Math.max(12, w - pw - 12);
    const y = Math.max(86, h - actualH - 106);
    if (!force && state.x === x && state.y === y && state.scale === scale && state.tutorial === false) return;
    state.x = x; state.y = y; state.scale = scale; state.tutorial = false;
    state.c.setPosition(x, y).setScale(scale);
    return;
  }
  const pw = Math.min(440, Math.max(380, w - 72));
  const scale = pw / baseW;
  const actualH = baseH * scale;
  const x = Math.max(18, w - pw - 28);
  let y = Math.max(92, h - actualH - 28);
  if (tutorial && tutorial.right > x - 8 && tutorial.bottom > y - 8) y = Math.max(92, tutorial.y - actualH - 18);
  if (!force && state.x === x && state.y === y && state.scale === scale && state.tutorial === !!tutorial) return;
  state.x = x; state.y = y; state.scale = scale; state.tutorial = !!tutorial;
  state.c.setPosition(x, y).setScale(scale);
}

function skinExistingHud(scene, state) {
  if (state.hudSkinned || !scene?.add || window.__relayCinematicLock) return;
  const { w } = viewport(scene);
  const texts = (scene.children?.list || []).filter(child => child?.active && child.visible !== false && child.type === 'Text' && child.getBounds && child.scrollFactorX === 0);
  const groups = {
    mission: texts.filter(t => { const b=t.getBounds(); return b.x < w * .26 && b.y < 125; }),
    signal: texts.filter(t => { const b=t.getBounds(); const s=String(t.text||''); return b.x > w*.30 && b.x < w*.70 && b.y < 120 && (/SIGNAL|ENERGY|^\d+$|\d+\s*SIGNALS/i.test(s)); }),
  };
  state.hudSkins = [];
  for (const [kind, items] of Object.entries(groups)) {
    if (!items.length) continue;
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity,minDepth=Infinity;
    items.forEach(item => { const b=item.getBounds(); minX=Math.min(minX,b.x); minY=Math.min(minY,b.y); maxX=Math.max(maxX,b.right); maxY=Math.max(maxY,b.bottom); minDepth=Math.min(minDepth, Number.isFinite(item.depth)?item.depth:9100); });
    const padX = kind === 'mission' ? 18 : 16, padY = 14;
    const bg = scene.add.rectangle(minX-padX, minY-padY, (maxX-minX)+padX*2, (maxY-minY)+padY*2, 0x070a0f, .88).setOrigin(0).setScrollFactor(0).setStrokeStyle(1, 0xffd06e, .34).setDepth(minDepth - .01);
    const rail = scene.add.rectangle(minX-padX, minY-padY, 3, (maxY-minY)+padY*2, 0xffd06e, .82).setOrigin(0).setScrollFactor(0).setDepth(minDepth);
    state.hudSkins.push(bg, rail);
  }
  state.hudSkinned = true;
}

function reveal(state, scene) {
  if (window.__relayCinematicLock) { state.pendingReveal = true; state.visible = false; state.c.setVisible(false); return; }
  if (state.visible) return;
  state.visible = true;
  state.pendingReveal = false;
  layout(state, scene, true);
  state.c.setVisible(true);
  skinExistingHud(scene, state);
  scene.tweens?.add?.({ targets:state.c, alpha:{from:0,to:1}, duration:180, ease:'Quad.easeOut' });
}

export function applyMissionObjective(scene, id = missionId(scene)) {
  clearMissionObjective(scene);
  if (!scene?.add) return null;
  const objective = MISSION_OBJECTIVES[id] || { ...FALLBACK_OBJECTIVE, id: id || 'active-mission' };
  const ui = buildPanel(scene, objective);
  const state = { objective, ...ui, completed:false, last:-1, visible:false, pendingReveal:false, x:null, y:null, scale:null, tutorial:null, hudSkinned:false, hudSkins:[] };
  states.set(scene,state); scene.__missionObjectiveState=state; scene.__missionObjective=objective;
  reveal(state, scene);
  return objective;
}

export function updateMissionObjective(scene) {
  const s = states.get(scene); if (!s || !scene.player) return;
  if (window.__relayCinematicLock) { s.c.setVisible(false); return; }
  if (s.pendingReveal) reveal(s, scene);
  layout(s, scene);
  skinExistingHud(scene, s);
  const p = clamp(scene.player.x / worldWidth(scene));
  if (Math.abs(p - s.last) < .002) return;
  s.last = p;
  const pct = Math.round(p * 100);
  s.fill.width = 382 * p;
  s.progress.setText(`ROUTE PROGRESS  ${pct}%`);
  if (!s.completed && p >= s.objective.completeAt) {
    s.completed = true;
    s.fill.width = 382;
    s.progress.setText('OBJECTIVE COMPLETE');
    s.kicker.setText('OBJECTIVE COMPLETE');
    s.status.setText('ROUTE GOAL SECURED');
    scene.tweens?.add?.({ targets:s.c, scaleX:{from:s.scale,to:s.scale*1.025}, scaleY:{from:s.scale,to:s.scale*1.025}, yoyo:true, duration:140, repeat:1 });
    scene.events?.emit?.('mission-objective-complete',{ id:missionId(scene), objective:s.objective });
  }
}

export function clearMissionObjective(scene) {
  const s = states.get(scene) || scene.__missionObjectiveState;
  s?.c?.destroy?.();
  s?.hudSkins?.forEach(item => item?.destroy?.());
  states.delete(scene);
  scene.__missionObjectiveState = null; scene.__missionObjective = null;
}

if (!RunnerScene.prototype.__missionObjectivesV1Patched) {
  const create = RunnerScene.prototype.create, update = RunnerScene.prototype.update, shutdown = RunnerScene.prototype.shutdown;
  RunnerScene.prototype.create = function(...a) { const r=create.apply(this,a); try { applyMissionObjective(this); } catch(e) { console.error('[MissionObjectivesV1] create failed',e); } return r; };
  RunnerScene.prototype.update = function(...a) { const r=update.apply(this,a); try { updateMissionObjective(this); } catch(e) { console.error('[MissionObjectivesV1] update failed',e); } return r; };
  RunnerScene.prototype.shutdown = function(...a) { try { clearMissionObjective(this); } catch(e) { console.error('[MissionObjectivesV1] shutdown failed',e); } return typeof shutdown === 'function' ? shutdown.apply(this,a) : undefined; };
  RunnerScene.prototype.__missionObjectivesV1Patched = true;
}
