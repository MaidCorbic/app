import Phaser from 'phaser';

const STORAGE_KEY = 'relay.gameplay.v8.systems';
const DEFAULT_STATE = { surveillance:{detected:false,heat:0}, alarm:{level:0,nodes:[false,false,false]}, power:{sectorA:true,sectorB:false,sectorC:false}, water:{level:0}, noise:{lastPulse:0,strength:0}, footprints:{count:0,active:false}, forensic:{evidence:0}, queue:{position:1,throughput:0}, transit:{route:'NORTH',transfers:0}, depletion:{charge:100}, oxygen:{value:100}, gas:{density:70,ventilated:false}, fire:{spread:25}, network:{failed:[false,false,false],integrity:100}, suppression:{uses:3}, discoveries:{} };
const clone=v=>JSON.parse(JSON.stringify(v));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const textOf=o=>[o?.getData?.('id'),o?.getData?.('feature'),o?.getData?.('type'),o?.getData?.('kind'),o?.getData?.('name'),o?.name,o?.texture?.key].filter(Boolean).join(' ').toLowerCase();
function loadState(){try{const raw=globalThis.localStorage?.getItem(STORAGE_KEY);return raw?{...clone(DEFAULT_STATE),...JSON.parse(raw)}:clone(DEFAULT_STATE);}catch{return clone(DEFAULT_STATE);}}
function saveState(s){try{globalThis.localStorage?.setItem(STORAGE_KEY,JSON.stringify(s));}catch{}}
const SYSTEMS={
 surveillance:{tokens:['security','camera','turret'],cue:'SURVEILLANCE',radius:150},
 alarm:{tokens:['alarm','siren','security','guard'],cue:'ALARM NODE',radius:140},
 power:{tokens:['power','terminal','generator','network','breaker'],cue:'POWER CONTROL',radius:135},
 water:{tokens:['water','pipe','tank','flood'],cue:'WATER CONTROL',radius:135},
 noise:{tokens:['security','camera','guard','alarm'],cue:'SOUND RISK',radius:130},
 footprints:{tokens:['mud','water','dust','ground','trail'],cue:'TRACKABLE GROUND',radius:120},
 forensic:{tokens:['evidence','body','wreck','crime','damage'],cue:'FORENSIC SCENE',radius:120},
 queue:{tokens:['checkpoint','gate','barrier'],cue:'CHECKPOINT',radius:130},
 transit:{tokens:['transit','rail','station','train'],cue:'TRANSIT',radius:145},
 depletion:{tokens:['resource','cargo','crate','depot'],cue:'RESOURCE DEPOT',radius:135},
 oxygen:{tokens:['oxygen','air','mask'],cue:'OXYGEN ZONE',radius:120},
 gas:{tokens:['gas','ventilation','vent'],cue:'VENTILATION',radius:125},
 fire:{tokens:['fire','flame','burn','smoke'],cue:'FIRE ZONE',radius:140},
 network:{tokens:['network','terminal','relay','signal'],cue:'NETWORK NODE',radius:135},
 suppression:{tokens:['sprinkler','extinguisher','suppression','fire'],cue:'SUPPRESSION',radius:125},
};
function near(o,p,r){return !!o?.active&&!!p?.active&&Math.hypot((o.x||0)-(p.x||0),(o.y||0)-(p.y||0))<=r;}
function tickState(s,dt){if(s.surveillance.detected)s.surveillance.heat=clamp(s.surveillance.heat+dt*3,0,100);if(s.gas.ventilated)s.gas.density=clamp(s.gas.density-dt*8,0,100);if(s.fire.spread>0&&s.fire.spread<100)s.fire.spread=clamp(s.fire.spread+dt*1.5,0,100);s.noise.strength=clamp(s.noise.strength-dt*22,0,100);}

export function installGameplayExpansionV8Systems(RunnerScene){
 if(!RunnerScene?.prototype||RunnerScene.prototype.__gameplayExpansionV8Installed)return;
 RunnerScene.prototype.__gameplayExpansionV8Installed=true;
 const originalCreate=RunnerScene.prototype.create;
 const originalUpdate=RunnerScene.prototype.update;
 RunnerScene.prototype.create=function gameplayV8WorldCreate(...args){
  const result=originalCreate.apply(this,args),scene=this,state=loadState(),targets=[],seen=new WeakSet();let nextProbe=0,lastRefresh=0;
  scene.__v8={state,worldMode:true,destroyed:false,targets};
  const cue=scene.add?.text?.(0,0,'',{fontFamily:'monospace',fontStyle:'bold',fontSize:'9px',color:'#eaffff',backgroundColor:'#06121ddd',padding:{left:7,right:7,top:5,bottom:5}})?.setOrigin?.(.5,1)?.setDepth?.(1200)?.setVisible?.(false);
  let cueTween=null;
  const flash=o=>{if(!o?.active)return;const ring=scene.add?.circle?.(o.x||0,o.y||0,22,0x8df4ff,.08)?.setDepth?.((o.depth||10)+1);if(ring)scene.tweens?.add?.({targets:ring,scale:1.8,alpha:0,duration:360,onComplete:()=>ring.destroy()});};
  const showCue=(o,t)=>{if(!cue||!o?.active)return;cue.setPosition(o.x||0,(o.y||0)-24).setText(t).setVisible(true).setAlpha(1);if(cueTween)scene.tweens?.killTweensOf?.(cue);cueTween=scene.tweens?.add?.({targets:cue,alpha:0,delay:650,duration:300,onComplete:()=>cue.setVisible(false)});};
  const collect=()=>{const visit=list=>{for(const o of list||[]){if(o?.list?.length)visit(o.list);if(!o?.active||seen.has(o))continue;const s=textOf(o);for(const [id,def] of Object.entries(SYSTEMS)){if(def.tokens.some(t=>s.includes(t))&&Number.isFinite(o.x)&&Number.isFinite(o.y)){seen.add(o);targets.push({object:o,id,def,key:`${id}:${targets.length}`});break;}}}};visit(scene.children?.list);};
  const activate=(id,target)=>{const s=state;if(s.discoveries[target.key])return;s.discoveries[target.key]=Date.now();switch(id){case'surveillance':s.surveillance.detected=true;s.surveillance.heat=clamp(s.surveillance.heat+10,0,100);break;case'alarm':s.alarm.level=Math.min(3,s.alarm.level+1);s.alarm.nodes=s.alarm.nodes.map((_,i)=>i<s.alarm.level);break;case'power':{if(s.power.sectorA&&!s.power.sectorB){s.power.sectorA=false;s.power.sectorB=true;}else if(s.power.sectorB&&!s.power.sectorC){s.power.sectorB=false;s.power.sectorC=true;}else{s.power={sectorA:true,sectorB:false,sectorC:false};}break;}case'water':s.water.level=(s.water.level+1)%4;break;case'noise':s.noise.lastPulse=Date.now();s.noise.strength=clamp(s.noise.strength+35,0,100);s.alarm.level=Math.min(3,s.alarm.level+1);break;case'footprints':s.footprints.count+=1;s.footprints.active=true;break;case'forensic':s.forensic.evidence=Math.min(5,s.forensic.evidence+1);break;case'queue':s.queue.position=s.queue.position>=4?1:s.queue.position+1;s.queue.throughput+=s.queue.position===1?1:0;break;case'transit':s.transit.route=s.transit.route==='NORTH'?'EAST':s.transit.route==='EAST'?'SOUTH':'NORTH';s.transit.transfers+=1;break;case'depletion':s.depletion.charge=clamp(s.depletion.charge-20,0,100);break;case'oxygen':s.oxygen.value=clamp(s.oxygen.value-15,0,100);break;case'gas':s.gas.density=clamp(s.gas.density-25,0,100);s.gas.ventilated=s.gas.density===0;break;case'fire':s.fire.spread=clamp(s.fire.spread+12,0,100);break;case'network':{const i=s.network.failed.findIndex(v=>!v);if(i>=0)s.network.failed[i]=true;else s.network.failed=[false,false,false];s.network.integrity=clamp(100-s.network.failed.filter(Boolean).length*33,1,100);break;}case'suppression':if(s.suppression.uses>0&&s.fire.spread>0){s.suppression.uses-=1;s.fire.spread=clamp(s.fire.spread-35,0,100);}break;default:break;}saveState(s);scene.game?.events?.emit?.('relay:world-system',{system:id,object:target.object,state:s});showCue(target.object,target.def.cue);flash(target.object);};
  collect();
  scene.__v8Probe=()=>{const n=performance.now();if(n<nextProbe)return;nextProbe=n+220;if(n-lastRefresh>2200){lastRefresh=n;collect();}const player=scene.player||scene.runner||scene.character||scene.hero;if(!player?.active)return;for(const target of targets)if(near(target.object,player,target.def.radius))activate(target.id,target);};
  const onEvent=payload=>{const t=(String(payload?.type||payload?.name||'')+' '+JSON.stringify(payload||{})).toLowerCase();if(t.includes('alarm'))state.alarm.level=Math.min(3,state.alarm.level+1);if(t.includes('damage'))state.forensic.evidence=Math.min(5,state.forensic.evidence+1);if(t.includes('noise')){state.noise.lastPulse=Date.now();state.noise.strength=clamp(state.noise.strength+20,0,100);}saveState(state);};
  const events=['gameplay:event','gameplay:v10:event','gameplay:v11:event','gameplay:v12:event'];events.forEach(name=>scene.game?.events?.on?.(name,onEvent));
  const cleanup=()=>{events.forEach(name=>scene.game?.events?.off?.(name,onEvent));if(cueTween)scene.tweens?.killTweensOf?.(cue);cue?.destroy?.();scene.__v8.destroyed=true;scene.__v8.targets.length=0;};
  scene.events?.once?.(Phaser.Scenes.Events.SHUTDOWN,cleanup);scene.events?.once?.(Phaser.Scenes.Events.DESTROY,cleanup);
  const timer=window.setInterval(()=>scene.__v8Probe?.(),120);scene.events?.once?.(Phaser.Scenes.Events.SHUTDOWN,()=>window.clearInterval(timer));scene.events?.once?.(Phaser.Scenes.Events.DESTROY,()=>window.clearInterval(timer));
  return result;
 };
 RunnerScene.prototype.update=function gameplayV8Update(time,delta,...args){const result=originalUpdate.call(this,time,delta,...args),v8=this.__v8;if(!v8||v8.destroyed)return result;tickState(v8.state,Math.max(0,Math.min(100,Number(delta)||0))/1000);return result;};
}
export {SYSTEMS as V8_WORLD_SYSTEMS};
