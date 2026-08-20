import { RunnerScene } from '../scenes/RunnerScene.js';
import { loadState } from '../state.js';

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
const TUTORIAL_TEXT = /TUTORIAL|RUNNER LESSON|PRACTICE IT NOW|BOOST PAD|DOUBLE JUMP|BLACKOUT|WALL ROUTES|CHASE|AIR DASH|STORM|COMBINE|LOCKDOWN|ELITE|FINAL RUN|CITYSPINE/i;
function missionId(scene) { return scene?.mission?.id || scene?.sys?.settings?.data?.missionId || scene?.registry?.get?.('missionId') || null; }
function worldWidth(scene) { return scene?.physics?.world?.bounds?.width || scene?.scale?.width || 1; }
function clamp(v) { return Math.max(0, Math.min(1, v || 0)); }
function tutorialEnabled() { try { return loadState().tutorialEnabled !== false; } catch { return true; } }
function tutorialVisible(scene) {
  if (!tutorialEnabled() || !scene?.children?.list) return false;
  return scene.children.list.some(child => child?.active && child.visible !== false && child.type === 'Text' && TUTORIAL_TEXT.test(String(child.text || '')));
}
function buildPanel(scene, objective) {
  // The objective intentionally occupies the existing left-side information zone.
  const x = 42, y = 347;
  const c = scene.add.container(x, y).setScrollFactor(0).setDepth(9200).setVisible(false).setAlpha(0);
  const bg = scene.add.rectangle(0, 0, 426, 188, 0x07111f, .94).setOrigin(0).setStrokeStyle(1, 0x38bdf8, .7);
  const kicker = scene.add.text(26, 22, 'MISSION OBJECTIVE', { fontFamily:'monospace', fontSize:'11px', color:'#8ecae6', letterSpacing:1.4 });
  const rule = scene.add.rectangle(26, 48, 58, 2, 0x38bdf8, .85).setOrigin(0);
  const title = scene.add.text(26, 64, objective.title, { fontFamily:'monospace', fontSize:'17px', fontStyle:'bold', color:'#e8f8ff', wordWrap:{width:370} });
  const label = scene.add.text(26, 110, objective.label, { fontFamily:'monospace', fontSize:'10px', color:'#8fa6bb', letterSpacing:1.1 });
  const progress = scene.add.text(26, 130, 'ROUTE PROGRESS  0%', { fontFamily:'monospace', fontSize:'12px', color:'#d6efff' });
  const track = scene.add.rectangle(26, 160, 374, 6, 0x13243a, 1).setOrigin(0,.5);
  const fill = scene.add.rectangle(26, 160, 0, 6, 0x38bdf8, 1).setOrigin(0,.5);
  c.add([bg,kicker,rule,title,label,progress,track,fill]);
  return { c, kicker, title, label, progress, fill };
}
function reveal(state, scene) {
  if (state.visible || tutorialVisible(scene)) return;
  state.visible = true;
  state.c.setVisible(true);
  scene.tweens?.add?.({ targets:state.c, alpha:{from:0,to:1}, x:{from:30,to:42}, duration:180, ease:'Quad.easeOut' });
}
export function applyMissionObjective(scene, id = missionId(scene)) {
  clearMissionObjective(scene);
  const objective = MISSION_OBJECTIVES[id];
  if (!objective || !scene?.add) return null;
  const ui = buildPanel(scene, objective);
  const state = { objective, ...ui, completed:false, last:0, visible:false };
  states.set(scene,state); scene.__missionObjectiveState=state; scene.__missionObjective=objective;
  // Tutorial owns this information area first. Objective appears as soon as it is gone.
  if (!tutorialVisible(scene)) reveal(state, scene);
  return objective;
}
export function updateMissionObjective(scene) {
  const s=states.get(scene); if(!s || !scene.player) return;
  if (!s.visible) { if (!tutorialVisible(scene)) reveal(s, scene); else return; }
  const p=clamp(scene.player.x/worldWidth(scene));
  if (Math.abs(p-s.last)<.002) return;
  s.last=p; const pct=Math.round(p*100); s.fill.width=374*p; s.progress.setText(`ROUTE PROGRESS  ${pct}%`);
  if(!s.completed && p>=s.objective.completeAt){
    s.completed=true; s.fill.width=374; s.progress.setText('OBJECTIVE COMPLETE'); s.kicker.setText('OBJECTIVE COMPLETE'); s.title.setText(s.objective.title);
    scene.tweens?.add?.({targets:s.c,scaleX:{from:1,to:1.02},scaleY:{from:1,to:1.02},yoyo:true,duration:150,repeat:1});
    scene.events?.emit?.('mission-objective-complete',{id:missionId(scene),objective:s.objective});
  }
}
export function clearMissionObjective(scene){ const s=states.get(scene)||scene.__missionObjectiveState; s?.c?.destroy?.(); states.delete(scene); scene.__missionObjectiveState=null; scene.__missionObjective=null; }

if(!RunnerScene.prototype.__missionObjectivesV1Patched){
 const create=RunnerScene.prototype.create, update=RunnerScene.prototype.update, shutdown=RunnerScene.prototype.shutdown;
 RunnerScene.prototype.create=function(...a){ const r=create.apply(this,a); try{applyMissionObjective(this);}catch(e){console.error('[MissionObjectivesV1] create failed',e);} return r; };
 RunnerScene.prototype.update=function(...a){ const r=update.apply(this,a); try{updateMissionObjective(this);}catch(e){console.error('[MissionObjectivesV1] update failed',e);} return r; };
 RunnerScene.prototype.shutdown=function(...a){ try{clearMissionObjective(this);}catch(e){console.error('[MissionObjectivesV1] shutdown failed',e);} return typeof shutdown==='function'?shutdown.apply(this,a):undefined; };
 RunnerScene.prototype.__missionObjectivesV1Patched=true;
}
