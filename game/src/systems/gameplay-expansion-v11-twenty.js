/* V11 — twenty gameplay systems as a state/event layer.
   No developer HUD. Systems react to real gameplay events and remain persistent.
   Existing keyboard/mobile controls are untouched. */
const STORAGE_KEY = 'relay.gameplay.v11.twenty';
const FEATURES = [
  'NOISE','TRACKING','HEAT','OBSTACLE','ROUTES','MUTATION','COVER','MOMENTUM','RECOVERY','TACTICAL NOISE',
  'CONTACT','METHOD','CARGO','EMERGENCY','OPPORTUNITY','CHAIN','DECOY CARGO','LOADOUT','TIME DEBT','MARKER'
];
const FRESH = () => ({version:2,values:Array.from({length:FEATURES.length},()=>0),lastEvent:'READY'});
function loadState(){try{const parsed=JSON.parse(window.localStorage?.getItem(STORAGE_KEY)||'null');const s=FRESH();if(parsed&&Array.isArray(parsed.values)&&parsed.values.length===FEATURES.length)s.values=parsed.values.map(v=>Number.isFinite(Number(v))?Number(v):0);if(typeof parsed?.lastEvent==='string')s.lastEvent=parsed.lastEvent;return s;}catch{return FRESH();}}
function saveState(s){try{window.localStorage?.setItem(STORAGE_KEY,JSON.stringify(s));}catch{}}
function indexFor(key){const k=String(key||'').toUpperCase();return FEATURES.findIndex(name=>k.includes(name)||name.includes(k));}
function bump(state,index,amount=1,source='GAMEPLAY') {if(index<0)return;state.values[index]+=amount;state.lastEvent=`${FEATURES[index]} / ${source}`;}
function bridge(state,type,detail){const text=(String(type||'')+' '+JSON.stringify(detail||{})).toLowerCase();const map=[
  ['noise',[0,2,9]],['footprint',[1]],['tracking',[1]],['heat',[2]],['obstacle',[3]],['route',[4,19]],['mission',[5,14,18]],['cover',[6]],['momentum',[7]],['recovery',[8]],['decoy',[9,16]],['contact',[10]],['reputation',[11]],['method',[11]],['cargo',[12]],['emergency',[13]],['opportunity',[14]],['chain',[15]],['loadout',[17]],['marker',[19]]
];
  for(const [needle,ids] of map) if(text.includes(needle)) ids.forEach(i=>bump(state,i,1,'WORLD EVENT'));
}
export function installGameplayExpansionV11Twenty(RunnerScene){
  if(!RunnerScene?.prototype||RunnerScene.prototype.__gameplayExpansionV11Installed)return;
  RunnerScene.prototype.__gameplayExpansionV11Installed=true;
  const originalCreate=RunnerScene.prototype.create;
  RunnerScene.prototype.create=function gameplayV11Create(...args){
    const result=originalCreate.apply(this,args),scene=this,state=loadState();
    const listeners=[];
    const on=(target,event,handler)=>{target?.on?.(event,handler);listeners.push(()=>target?.off?.(event,handler));};
    const onGame=(event,handler)=>on(scene.game?.events,event,handler);
    const emit=(index,source,detail={})=>scene.events?.emit?.('relay:gameplay:v11',{type:'react',index,detail:{...detail,source},state});
    const react=(type,detail)=>{const before=state.values.slice();bridge(state,type,detail);if(!before.every((v,i)=>v===state.values[i])){saveState(state);emit(indexFor(type), 'GAMEPLAY EVENT', {type,detail});}};
    ['feedback','dash-start','dash-end','slide-jump','breakable-destroyed','game-over','complete','energy','ammo','signal-network','signal-network-node','signal-network-complete'].forEach(event=>onGame(event,(detail)=>react(event,detail)));
    on(scene.events,'relay:gameplay:deep',payload=>react(payload?.name,payload?.detail));
    on(scene.events,'shutdown',()=>listeners.forEach(off=>off()));
    scene.__relayV11={state,emit,react};
    saveState(state);
    return result;
  };
}
export {FEATURES};
