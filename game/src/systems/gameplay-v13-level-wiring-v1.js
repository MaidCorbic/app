import { missions } from '../missions.js';
import { SYSTEMS } from './gameplay-expansion-v13-34-systems.js';

const LEVELS = Object.freeze([
  { id:'first-delivery', active:['LOS','WITNESS','OWNER','INVENTORY','CROWD','VERIFY','RELATIONS','OBJECTIVES'] },
  { id:'dead-drop', active:['LOS','DISGUISE','WITNESS','OWNER','ACCESS','SPOOF','INVENTORY','MOD','TEMP','CROWD','TERRITORY','FAVORS','VERIFY','FALSEINFO','CONTRACTS','NEGOTIATE','OBJECTIVES'] },
  { id:'blackout', active:['LOS','DISGUISE','WITNESS','OWNER','ACCESS','POWER','BLACKOUT','CAMERA','SPOOF','INVENTORY','MOD','TEMP','CROWD','PANIC','LOCKDOWN','TERRITORY','TOLL','PATROLS','NPCSKILL','FATIGUE','INJURY','RELATIONS','FAVORS','VERIFY','FALSEINFO','CONTRACTS','NEGOTIATE','MISSIONGRAPH','OWNERSHIP','OBJECTIVES'] },
  { id:'pursuit', active:['LOS','DISGUISE','WITNESS','OWNER','ACCESS','POWER','BLACKOUT','CAMERA','SPOOF','INVENTORY','MOD','TEMP','CROWD','PANIC','LOCKDOWN','TERRITORY','TOLL','PATROLS','NPCSKILL','FATIGUE','INJURY','RELATIONS','FAVORS','VERIFY','FALSEINFO','CONTRACTS','NEGOTIATE','BETRAYAL','MISSIONGRAPH','OWNERSHIP','OBJECTIVES'] },
  { id:'signal-storm', active:['LOS','DISGUISE','WITNESS','OWNER','ACCESS','POWER','BLACKOUT','CAMERA','SPOOF','INVENTORY','MOD','TEMP','CROWD','PANIC','LOCKDOWN','TERRITORY','TOLL','PATROLS','NPCSKILL','FATIGUE','INJURY','RELATIONS','FAVORS','VERIFY','FALSEINFO','MARKET','SUPPLY','PRODUCTION','CONTRACTS','NEGOTIATE','BETRAYAL','MISSIONGRAPH','OWNERSHIP','OBJECTIVES'] },
  { id:'corporate-lockdown', active:['LOS','DISGUISE','WITNESS','OWNER','ACCESS','POWER','BLACKOUT','CAMERA','SPOOF','INVENTORY','MOD','TEMP','CROWD','PANIC','LOCKDOWN','TERRITORY','TOLL','PATROLS','NPCSKILL','FATIGUE','INJURY','RELATIONS','FAVORS','VERIFY','FALSEINFO','MARKET','SUPPLY','PRODUCTION','CONTRACTS','NEGOTIATE','BETRAYAL','MISSIONGRAPH','OWNERSHIP','OBJECTIVES'] },
  { id:'final-relay', active:SYSTEMS.map(([id])=>id) },
]);

const TRIGGERS = Object.freeze({
  LOS:['feedback','dash-start','dash-end','signal'], DISGUISE:['access','witness'], WITNESS:['feedback','alarm','camera','witness'], OWNER:['damage','cargo','access'], ACCESS:['access','damage','blackout'], POWER:['energy','damage','repair'], BLACKOUT:['blackout','energy'], CAMERA:['camera','alarm','blackout'], SPOOF:['access','contract'], INVENTORY:['cargo','ammo','energy'], MOD:['craft','repair','cargo'], TEMP:['weather','energy','blackout'], CROWD:['feedback','panic','blackout'], PANIC:['alarm','panic','blackout'], LOCKDOWN:['alarm','panic','blackout','mission'], TERRITORY:['territory','route','reputation'], TOLL:['route','territory','contract'], PATROLS:['alarm','panic','territory','route'], NPCSKILL:['npc','alarm','pursuit'], FATIGUE:['npc','pursuit','dash'], INJURY:['npc','damage','game-over'], RELATIONS:['npc','witness','reputation'], FAVORS:['contract','reputation','npc'], VERIFY:['witness','rumor','mission'], FALSEINFO:['rumor','witness','mission'], MARKET:['economy','cargo','production'], SUPPLY:['cargo','economy','production'], PRODUCTION:['production','cargo','economy'], CONTRACTS:['contract','mission','reputation'], NEGOTIATE:['contract','reputation'], BETRAYAL:['contract','alarm','mission'], MISSIONGRAPH:['mission','complete','game-over'], OWNERSHIP:['mission','territory','contract'], OBJECTIVES:['mission','complete','route']
});

const stateFor = scene => scene?.__gameplayV13LevelWiring;
const missionId = scene => scene?.mission?.id || scene?.sys?.settings?.data?.missionId || scene?.registry?.get?.('missionId') || scene?.registry?.get?.('activeMission')?.id || null;
const levelFor = id => LEVELS.find(x=>x.id===id) || LEVELS[0];
const systemLabel = id => SYSTEMS.find(x=>x[0]===id)?.[1] || id;
const norm = v => String(v ?? '').toLowerCase();

function installVisibleStatus(scene, state) {
  if (state.ui || !scene?.add) return;
  const ui = scene.add.container(0,0).setScrollFactor(0).setDepth(9190).setVisible(false);
  const bg = scene.add.rectangle(0,0,260,28,0x07111f,.94).setOrigin(0).setStrokeStyle(1,0x38bdf8,.55);
  const text = scene.add.text(10,7,'SYSTEM · READY',{fontFamily:'monospace',fontSize:'9px',color:'#dff7ff',letterSpacing:1});
  ui.add([bg,text]);
  state.ui={ui,bg,text,hide:null};
}

function showStatus(scene,state,id,source) {
  if (!state.ui) installVisibleStatus(scene,state);
  const { w } = scene.scale?.gameSize || scene.scale || {w:window.innerWidth};
  const mobile = w <= 760;
  const x = mobile ? Math.max(12,(w-260)/2) : 18;
  const y = mobile ? Math.max(96,(scene.scale?.height||window.innerHeight)-112) : 18;
  state.ui.ui.setPosition(x,y).setVisible(true);
  state.ui.text.setText(`${systemLabel(id)} · ${String(source).toUpperCase()}`);
  clearTimeout(state.ui.hide);
  state.ui.hide=setTimeout(()=>state.ui?.ui?.setVisible(false),1700);
}

function activate(scene,state,id,source) {
  if (!state.active.has(id)) return;
  const v = state.v13?.state?.systems?.[id];
  if (v) { v.value=Math.max(0,Math.min(100,(Number(v.value)||0)+1)); v.events=(Number(v.events)||0)+1; }
  state.activeSystems.add(id);
  state.last={id,source};
  scene.__gameplaySystemState = { level:state.level.id, active:[...state.active], last:{id,source}, systems:[...state.activeSystems] };
  scene.events?.emit?.('gameplay:system-visible',{id,label:systemLabel(id),level:state.level.id,source});
  window.dispatchEvent(new CustomEvent(`gameplay:system:${id}`,{detail:{level:state.level.id,source}}));
  showStatus(scene,state,id,source);
}

function react(scene,state,type,detail) {
  const text = `${norm(type)} ${norm(detail && JSON.stringify(detail))}`;
  for (const id of state.active) {
    const needles=TRIGGERS[id]||[];
    const hit=needles.find(n=>text.includes(n));
    if (hit) activate(scene,state,id,type);
  }
}

export function installGameplayV13LevelWiring(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__gameplayV13LevelWiringInstalled) return;
  RunnerScene.prototype.__gameplayV13LevelWiringInstalled=true;
  const originalCreate=RunnerScene.prototype.create;
  RunnerScene.prototype.create=function gameplayV13LevelWiringCreate(...args){
    const result=originalCreate.apply(this,args);
    const scene=this;
    const id=missionId(scene);
    const level=levelFor(id);
    const state={level,active:new Set(level.active),activeSystems:new Set(),v13:scene.__gameplayV13,ui:null,last:null,listeners:[]};
    scene.__gameplayV13LevelWiring=state;
    scene.__gameplaySystemState={level:level.id,active:[...state.active],last:null,systems:[]};
    installVisibleStatus(scene,state);
    const on=(event,fn)=>{scene.game?.events?.on?.(event,fn);state.listeners.push(()=>scene.game?.events?.off?.(event,fn));};
    ['feedback','dash-start','dash-end','slide-jump','breakable-destroyed','game-over','complete','energy','ammo','signal-network','signal-network-node','signal-network-complete','relay:gameplay:v11','relay:gameplay:v12','relay:gameplay:deep'].forEach(event=>on(event,detail=>react(scene,state,event,detail)));
    scene.events?.once?.('shutdown',()=>{state.listeners.forEach(off=>off());clearTimeout(state.ui?.hide);state.ui?.ui?.destroy?.();scene.__gameplayV13LevelWiring=null;scene.__gameplaySystemState=null;});
    return result;
  };
}

export { LEVELS, TRIGGERS };
