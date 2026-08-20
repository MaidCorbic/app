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
function missionId(scene) { return scene?.mission?.id || scene?.sys?.settings?.data?.missionId || scene?.registry?.get?.('missionId') || null; }
function worldWidth(scene) { return scene?.physics?.world?.bounds?.width || scene?.scale?.width || 1; }
function clamp(v) { return Math.max(0, Math.min(1, v || 0)); }

export function applyMissionObjective(scene, id = missionId(scene)) {
  clearMissionObjective(scene);
  const objective = MISSION_OBJECTIVES[id];
  if (!objective || !scene?.add) return null;
  const x = 18, y = 18;
  const c = scene.add.container(x, y).setScrollFactor(0).setDepth(9200);
  const bg = scene.add.rectangle(0, 0, 330, 74, 0x07111f, .92).setOrigin(0).setStrokeStyle(1, 0x38bdf8, .65);
  const kicker = scene.add.text(14, 10, 'MISSION OBJECTIVE', { fontFamily:'Arial, sans-serif', fontSize:'10px', fontStyle:'bold', color:'#8ecae6', letterSpacing:1.2 });
  const title = scene.add.text(14, 27, objective.title, { fontFamily:'Arial, sans-serif', fontSize:'14px', fontStyle:'bold', color:'#e8f8ff' });
  const track = scene.add.rectangle(14, 57, 302, 5, 0x13243a, 1).setOrigin(0, .5);
  const fill = scene.add.rectangle(14, 57, 0, 5, 0x38bdf8, 1).setOrigin(0, .5);
  const progress = scene.add.text(316, 10, '0%', { fontFamily:'Arial, sans-serif', fontSize:'10px', color:'#b9e9ff' }).setOrigin(1,0);
  c.add([bg,kicker,title,track,fill,progress]);
  const state = { objective, c, fill, progress, completed:false, last:0 };
  states.set(scene,state); scene.__missionObjectiveState=state; scene.__missionObjective=objective;
  scene.tweens?.add?.({targets:c,alpha:{from:0,to:1},y:{from:0,to:18},duration:220,ease:'Quad.easeOut'});
  return objective;
}
export function updateMissionObjective(scene) {
  const s=states.get(scene); if(!s || !scene.player) return;
  const p=clamp(scene.player.x/worldWidth(scene));
  if (Math.abs(p-s.last)<.002) return;
  s.last=p; const pct=Math.round(p*100); s.fill.width=302*p; s.progress.setText(`${pct}%`);
  if(!s.completed && p>=s.objective.completeAt){ s.completed=true; s.fill.width=302; s.progress.setText('COMPLETE'); s.c.list[1]?.setText('OBJECTIVE COMPLETE'); s.c.list[2]?.setText(s.objective.title); scene.tweens?.add?.({targets:s.c,scaleX:{from:1,to:1.025},scaleY:{from:1,to:1.025},yoyo:true,duration:150,repeat:1}); scene.events?.emit?.('mission-objective-complete',{id:missionId(scene),objective:s.objective}); }
}
export function clearMissionObjective(scene){ const s=states.get(scene)||scene.__missionObjectiveState; s?.c?.destroy?.(); states.delete(scene); scene.__missionObjectiveState=null; scene.__missionObjective=null; }

if(!RunnerScene.prototype.__missionObjectivesV1Patched){
 const create=RunnerScene.prototype.create, update=RunnerScene.prototype.update, shutdown=RunnerScene.prototype.shutdown;
 RunnerScene.prototype.create=function(...a){ const r=create.apply(this,a); try{applyMissionObjective(this);}catch(e){console.error('[MissionObjectivesV1] create failed',e);} return r; };
 RunnerScene.prototype.update=function(...a){ const r=update.apply(this,a); try{updateMissionObjective(this);}catch(e){console.error('[MissionObjectivesV1] update failed',e);} return r; };
 RunnerScene.prototype.shutdown=function(...a){ try{clearMissionObjective(this);}catch(e){console.error('[MissionObjectivesV1] shutdown failed',e);} return typeof shutdown==='function'?shutdown.apply(this,a):undefined; };
 RunnerScene.prototype.__missionObjectivesV1Patched=true;
}
