/* V12 — deep gameplay integration as a state/event layer.
   No HUD and no per-frame persistence. Reacts to actual gameplay events. */
const KEY='relay.gameplay.deep.v12';
const fresh=()=>({version:3,noise:0,heat:0,footprints:[],obstacles:{},route:'safe',branch:0,cover:0,momentum:0,recovery:0,decoys:0,contactTrust:50,method:'clean',cargoRisk:0,emergency:0,opportunities:0,chain:0,falseCargo:0,loadout:'light',timeDebt:0,markers:[],last:'SYSTEM ONLINE',actions:0});
const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,Number(n)||0));
function load(){try{const s=JSON.parse(window.localStorage?.getItem(KEY)||'null');return s?{...fresh(),...s}:fresh();}catch{return fresh();}}
function save(s){try{window.localStorage?.setItem(KEY,JSON.stringify(s));}catch{}}
function apply(state,type,detail){const t=(String(type||'')+' '+JSON.stringify(detail||{})).toLowerCase();let changed=false;const add=(key,n=1)=>{state[key]=Number(state[key]||0)+n;changed=true;};
 if(t.includes('noise')||t.includes('sound')){state.noise=clamp(state.noise+12);state.heat=clamp(state.heat+3);changed=true;}
 if(t.includes('footprint')||t.includes('tracking')){state.footprints=[...state.footprints,Date.now()].slice(-16);changed=true;}
 if(t.includes('alarm')||t.includes('heat')){state.heat=clamp(state.heat+6);changed=true;}
 if(t.includes('obstacle')||t.includes('breakable')){const id=`o${Object.keys(state.obstacles).length+1}`;state.obstacles[id]=(state.obstacles[id]||0)+1;changed=true;}
 if(t.includes('mission')||t.includes('complete')){state.branch=(state.branch+1)%6;state.chain=clamp(state.chain+1,0,8);changed=true;}
 if(t.includes('cover')){state.cover=1;changed=true;}
 if(t.includes('momentum')||t.includes('dash')||t.includes('slide')){state.momentum=clamp(state.momentum+1,0,6);changed=true;}
 if(t.includes('recovery')){state.recovery=1;changed=true;}
 if(t.includes('decoy')){add('decoys');if(t.includes('cargo'))add('falseCargo');}
 if(t.includes('contact')){state.contactTrust=clamp(state.contactTrust+(state.method==='clean'?2:-1));changed=true;}
 if(t.includes('reputation')||t.includes('method')){state.method=t.includes('stealth')?'stealth':t.includes('force')?'force':t.includes('fast')?'fast':'clean';changed=true;}
 if(t.includes('cargo')){state.cargoRisk=clamp(state.cargoRisk+3);changed=true;}
 if(t.includes('emergency')){state.emergency=(state.emergency+1)%3;changed=true;}
 if(t.includes('opportunity')||t.includes('signal-network')){add('opportunities');}
 if(t.includes('loadout')){state.loadout=state.loadout||'light';changed=true;}
 if(t.includes('time')||t.includes('delay'))add('timeDebt');
 state.noise=clamp(state.noise-.15);state.heat=clamp(state.heat-.08);
 if(changed){state.actions++;state.last=String(type||'EVENT').toUpperCase();}
 return changed;
}
export function installGameplayDeepIntegrationV12(RunnerScene){
 if(!RunnerScene?.prototype||RunnerScene.prototype.__deepV12Installed)return;
 RunnerScene.prototype.__deepV12Installed=true;
 const originalCreate=RunnerScene.prototype.create;
 RunnerScene.prototype.create=function(...args){
  const result=originalCreate.apply(this,args),scene=this,state=load(),listeners=[];
  const on=(event,fn)=>{scene.game?.events?.on?.(event,fn);listeners.push(()=>scene.game?.events?.off?.(event,fn));};
  const relay=(type,detail)=>{if(apply(state,type,detail)){save(state);scene.events?.emit?.('relay:gameplay:v12',{type,detail,state});window.dispatchEvent(new CustomEvent('gameplay:v12:event',{detail:{type,detail,state}}));}};
  ['feedback','dash-start','dash-end','slide-jump','breakable-destroyed','game-over','complete','energy','ammo','signal-network','signal-network-node','signal-network-complete'].forEach(event=>on(event,detail=>relay(event,detail)));
  on('relay:gameplay:v11',p=>relay(p?.type,p));
  scene.events?.once?.('shutdown',()=>{listeners.forEach(off=>off());scene.__deepV12=null;});
  scene.__deepV12={state,relay};
  save(state);
  return result;
 };
}
