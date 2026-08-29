import Phaser from 'phaser';

const STORAGE_KEY = 'relay.gameplay.v7.worldSimulation';
const DEFAULT_STATE = Object.freeze({ economy:{marketIndex:100,trades:0}, reputation:{dock:0,civic:0}, damage:{}, rumors:0, safehouse:{visits:0,supplies:3}, contacts:{}, discoveries:{} });
const clone=v=>JSON.parse(JSON.stringify(v));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function readState(){try{const raw=window.localStorage?.getItem(STORAGE_KEY);return raw?{...clone(DEFAULT_STATE),...JSON.parse(raw)}:clone(DEFAULT_STATE);}catch{return clone(DEFAULT_STATE);}}
function writeState(s){try{window.localStorage?.setItem(STORAGE_KEY,JSON.stringify(s));}catch{}}
const objectText=o=>[o?.getData?.('id'),o?.getData?.('feature'),o?.getData?.('type'),o?.getData?.('kind'),o?.getData?.('name'),o?.name,o?.texture?.key].filter(Boolean).join(' ').toLowerCase();
const DEFINITIONS=[
{id:'economy',tokens:['market','shop','store','trade','depot','cargo','coin'],cue:'TRADE ZONE'},
{id:'reputation',tokens:['guard','npc','contact','faction','civic','dock'],cue:'FACTION PRESENCE'},
{id:'damage',tokens:['barrier','building','breakable','damage','wreck'],cue:'STRUCTURE STATE'},
{id:'schedule',tokens:['guard','npc','enemy','chaser','patrol'],cue:'ACTIVE ROUTE'},
{id:'rumors',tokens:['contact','sign','poster','terminal','radio'],cue:'RUMOR SOURCE'},
{id:'weather',tokens:['rain','dust','weather','route','gate'],cue:'ROUTE CONDITIONS'},
{id:'safehouse',tokens:['safehouse','safe-house','home','hideout'],cue:'SAFEHOUSE'},
{id:'contacts',tokens:['contact','phone','radio','terminal'],cue:'CONTACT'},
];
function hourFromScene(scene){const progress=Number(scene.__relayTimeMs||0)/90000;return ((6+progress*24)%24+24)%24;}
function weatherForHour(hour){if(hour>=20||hour<5)return{name:'NIGHT RAIN',routeOpen:false,friction:'LOW'};if(hour<8)return{name:'DAWN MIST',routeOpen:true,friction:'MEDIUM'};if(hour<17)return{name:'CLEAR',routeOpen:true,friction:'HIGH'};return{name:'SUNSET WIND',routeOpen:true,friction:'MEDIUM'};}
function near(object,player,radius=128){return !!object?.active&&!!player?.active&&Math.hypot((object.x||0)-(player.x||0),(object.y||0)-(player.y||0))<=radius;}

export function installGameplayExpansionV7WorldSimulation(RunnerScene){
 if(!RunnerScene?.prototype||RunnerScene.prototype.__gameplayExpansionV7Installed)return;
 RunnerScene.prototype.__gameplayExpansionV7Installed=true;
 const originalCreate=RunnerScene.prototype.create;
 RunnerScene.prototype.create=function gameplayV7WorldCreate(...args){
  const result=originalCreate.apply(this,args),scene=this,state=readState(),missionKey=scene.mission?.id||'default';
  const targets=[],seen=new WeakSet();let nextProbe=0,lastRefresh=0;
  scene.__relayV7State=state;scene.__relayV7MissionKey=missionKey;scene.__relayV7WorldMode=true;
  const cue=scene.add?.text?.(0,0,'',{fontFamily:'monospace',fontStyle:'bold',fontSize:'9px',color:'#eaffff',backgroundColor:'#06121ddd',padding:{left:7,right:7,top:5,bottom:5}})?.setOrigin?.(.5,1)?.setDepth?.(1200)?.setVisible?.(false);
  let cueTween=null;
  const showCue=(object,text)=>{if(!cue||!object?.active)return;cue.setPosition(object.x||0,(object.y||0)-24).setText(text).setVisible(true).setAlpha(1);if(cueTween)scene.tweens?.killTweensOf?.(cue);cueTween=scene.tweens?.add?.({targets:cue,alpha:0,delay:650,duration:300,onComplete:()=>cue.setVisible(false)});};
  const collect=()=>{const visit=list=>{for(const object of list||[]){if(object?.list?.length)visit(object.list);if(!object?.active||seen.has(object))continue;const text=objectText(object);const def=DEFINITIONS.find(d=>d.tokens.some(t=>text.includes(t)));if(def&&Number.isFinite(object.x)&&Number.isFinite(object.y)){seen.add(object);targets.push({object,def,key:`${def.id}:${targets.length}`});}}};visit(scene.children?.list);};
  const discover=t=>{const {object,def,key}=t;if(!object?.active||state.discoveries[key])return;state.discoveries[key]=Date.now();switch(def.id){case'economy':state.economy.marketIndex=clamp(state.economy.marketIndex+(state.economy.trades%2?-2:3),60,160);state.economy.trades+=1;break;case'reputation':{const f=state.economy.trades%2?'civic':'dock';state.reputation[f]=(state.reputation[f]||0)+1;break;}case'damage':state.damage[missionKey]=Boolean(state.damage[missionKey]);break;case'rumors':state.rumors+=1;break;case'safehouse':state.safehouse.visits+=1;state.safehouse.supplies=Math.max(0,state.safehouse.supplies-1);break;case'contacts':state.contacts.primary=(state.contacts.primary||0)+1;break;default:break;}writeState(state);scene.game?.events?.emit?.('relay:world-discovery',{system:def.id,cue:def.cue,object,state});showCue(object,def.cue);const glow=scene.add?.circle?.(object.x||0,object.y||0,18,0x8df4ff,.09)?.setDepth?.((object.depth||10)+1);if(glow)scene.tweens?.add?.({targets:glow,scale:1.9,alpha:0,duration:380,onComplete:()=>glow.destroy()});};
  collect();
  scene.__relayV7Probe=()=>{const now=performance.now();if(now<nextProbe)return;nextProbe=now+240;if(now-lastRefresh>2000){lastRefresh=now;collect();}const player=scene.player||scene.runner||scene.character||scene.hero;if(!player?.active)return;for(const t of targets)if(near(t.object,player))discover(t);};
  const onEvent=payload=>{const text=(String(payload?.type||payload?.name||'')+' '+JSON.stringify(payload||{})).toLowerCase();if(text.includes('trade')||text.includes('economy'))state.economy.trades+=1;if(text.includes('reputation'))state.reputation.dock=(state.reputation.dock||0)+1;if(text.includes('damage'))state.damage[missionKey]=true;if(text.includes('rumor'))state.rumors+=1;if(text.includes('contact'))state.contacts.primary=(state.contacts.primary||0)+1;writeState(state);};
  const events=['gameplay:event','gameplay:v10:event','gameplay:v11:event','gameplay:v12:event'];events.forEach(name=>scene.game?.events?.on?.(name,onEvent));
  const cleanup=()=>{events.forEach(name=>scene.game?.events?.off?.(name,onEvent));if(cueTween)scene.tweens?.killTweensOf?.(cue);cue?.destroy?.();scene.__relayV7State=null;scene.__relayV7WorldMode=false;};
  scene.events?.once?.(Phaser.Scenes.Events.SHUTDOWN,cleanup);scene.events?.once?.(Phaser.Scenes.Events.DESTROY,cleanup);
  const timer=window.setInterval(()=>scene.__relayV7Probe?.(),120);scene.events?.once?.(Phaser.Scenes.Events.SHUTDOWN,()=>window.clearInterval(timer));scene.events?.once?.(Phaser.Scenes.Events.DESTROY,()=>window.clearInterval(timer));
  return result;
 };
}
export {DEFINITIONS as V7_WORLD_DISCOVERY_DEFINITIONS};
