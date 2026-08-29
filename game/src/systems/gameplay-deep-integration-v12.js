import Phaser from 'phaser';

const KEY = 'relay.gameplay.deep.v12';
const FEATURES = ['NOISE','TRACKING','HEAT','OBSTACLE','ROUTES','MUTATION','COVER','MOMENTUM','RECOVERY','TACTICAL NOISE','CONTACT','METHOD','CARGO','EMERGENCY','OPPORTUNITY','CHAIN','DECOY CARGO','LOADOUT','TIME DEBT','MARKER'];
const fresh = () => ({ version: 2, noise: 0, heat: 0, footprints: [], obstacles: {}, route: 'safe', branch: 0, cover: 0, momentum: 0, recovery: 0, decoys: 0, contactTrust: 50, method: 'clean', cargoRisk: 0, emergency: 0, opportunities: 0, chain: 0, falseCargo: 0, loadout: 'light', timeDebt: 0, markers: [], last: 'SYSTEM ONLINE', actions: 0 });
function load(){try{const s=JSON.parse(window.localStorage?.getItem(KEY)||'null');return s?{...fresh(),...s}:fresh();}catch{return fresh();}}
function save(s){try{window.localStorage?.setItem(KEY,JSON.stringify(s));}catch{}}
function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
function playerOf(scene){return scene.player||scene.runner||scene.character||scene.hero||null;}
function label(scene,x,y,value,size='7px',color='#dffcff',width=250){return scene.add.text(x,y,value,{fontFamily:'monospace',fontStyle:'bold',fontSize:size,color,align:'center',wordWrap:{width}}).setOrigin(.5);}

export function installGameplayDeepIntegrationV12(RunnerScene){
 if(!RunnerScene?.prototype||RunnerScene.prototype.__deepV12Installed)return;
 RunnerScene.prototype.__deepV12Installed=true;
 const originalCreate=RunnerScene.prototype.create;
 const originalUpdate=RunnerScene.prototype.update;
 RunnerScene.prototype.create=function(...args){
  const result=originalCreate?.apply(this,args),scene=this,state=load(),w=scene.scale.width||1280,h=scene.scale.height||720;
  const mobile=w<600,root=scene.add.container(0,0).setScrollFactor(0).setDepth(980),panelW=Math.min(w-18,mobile?470:610),panelH=mobile?104:118,px=w/2,py=h-panelH/2-8;
  root.add(scene.add.rectangle(px,py,panelW,panelH,0x030a12,.94).setStrokeStyle(1,0x65d9ff,.45));
  root.add(label(scene,px,py-panelH/2+13,'DEEP GAMEPLAY // V1–V11 INTEGRATION',mobile?'8px':'10px','#7ee7ff'));
  const status=label(scene,px,py-panelH/2+30,state.last,'7px','#b5d8e4',panelW-30);root.add(status);
  const cols=mobile?4:5,gap=mobile?4:6,bw=(panelW-22-gap*(cols-1))/cols,bh=mobile?22:27,buttons=[],cleanup=[];
  const emit=(name,detail)=>scene.events.emit('relay:gameplay:deep',{name,detail,state});
  const setLast=m=>{state.last=m;state.actions++;status.setText(m);save(state);};
  const actions=[
   ()=>{state.noise=clamp(state.noise+18,0,100);state.heat=clamp(state.heat+4,0,100);return`NOISE ${Math.round(state.noise)}% → HEAT ${Math.round(state.heat)}%`;},
   ()=>{state.footprints.push(Date.now());state.footprints=state.footprints.slice(-12);return`TRACKING: ${state.footprints.length} TRAILS`;},
   ()=>{state.heat=clamp(state.heat-12,0,100);return`HEAT COOLED TO ${Math.round(state.heat)}%`;},
   ()=>{const id=`o${Object.keys(state.obstacles).length+1}`;state.obstacles[id]=(state.obstacles[id]||0)+1;return`WORLD MEMORY: ${id} CHANGED`;},
   ()=>{const r=['safe','fast','profit','escape'],i=(r.indexOf(state.route)+1)%4;state.route=r[i];return`ROUTE: ${state.route.toUpperCase()}`;},
   ()=>{state.branch=(state.branch+1)%6;state.heat=clamp(state.heat+3,0,100);return`MISSION MUTATED → BRANCH ${state.branch+1}`;},
   ()=>{state.cover=state.cover?0:1;return`COVER ${state.cover?'DEPLOYED':'RELEASED'}`;},
   ()=>{state.momentum=clamp(state.momentum+1,0,6);return`MOMENTUM CHAIN ${state.momentum}/6`;},
   ()=>{state.recovery=state.recovery?0:1;return`RECOVERY WINDOW ${state.recovery?'OPEN':'CLOSED'}`;},
   ()=>{state.decoys++;state.noise=clamp(state.noise+8,0,100);return`TACTICAL NOISE DECOY #${state.decoys}`;},
   ()=>{state.contactTrust=clamp(state.contactTrust+(state.method==='clean'?6:-3),0,100);return`CONTACT TRUST ${state.contactTrust}%`;},
   ()=>{const m=['clean','stealth','force','fast'];state.method=m[(m.indexOf(state.method)+1)%4];return`METHOD: ${state.method.toUpperCase()}`;},
   ()=>{state.cargoRisk=clamp(state.cargoRisk+(state.route==='fast'?12:5),0,100);return`CARGO RISK ${state.cargoRisk}%`;},
   ()=>{state.emergency=(state.emergency+1)%3;const c=['SAFE','RISK','ABORT'][state.emergency];if(c==='RISK')state.heat=clamp(state.heat+10,0,100);return`EMERGENCY: ${c}`;},
   ()=>{state.opportunities++;return`OPPORTUNITY WINDOW #${state.opportunities} OPEN`;},
   ()=>{state.chain=clamp(state.chain+1,0,8);state.heat=clamp(state.heat+state.chain,0,100);return`CHAIN REACTION DEPTH ${state.chain}`;},
   ()=>{state.falseCargo++;state.decoys++;return`DECOY CARGO DEPLOYED #${state.falseCargo}`;},
   ()=>{const k=['light','tactical','cargo','escape'];state.loadout=k[(k.indexOf(state.loadout)+1)%4];return`SAFEHOUSE KIT: ${state.loadout.toUpperCase()}`;},
   ()=>{state.timeDebt+=state.route==='fast'?0:1;return`MISSION TIME DEBT ${state.timeDebt} MIN`;},
   ()=>{const p=playerOf(scene);state.markers.push({id:state.markers.length+1,x:p?.x??0,y:p?.y??0,t:Date.now()});state.markers=state.markers.slice(-10);return`ROUTE MARKER #${state.markers.length} PLACED`;}
  ];
  for(let i=0;i<20;i++){
   const row=Math.floor(i/cols),col=i%cols,x=px-panelW/2+11+bw/2+col*(bw+gap),y=py-panelH/2+49+bh/2+row*(bh+gap);
   const b=scene.add.rectangle(x,y,bw,bh,0x0a1825,.98).setStrokeStyle(1,0x4e7485,.7).setInteractive({useHandCursor:true});
   const c=label(scene,x,y,FEATURES[i],mobile?'5px':'6px','#b8dce7',bw-4);
   b.on('pointerdown',()=>{const msg=actions[i]();setLast(msg);b.setStrokeStyle(2,0x7ee7ff,1);scene.tweens.add({targets:b,alpha:{from:.55,to:1},duration:90,yoyo:true});emit(FEATURES[i],msg);});
   root.add(b);root.add(c);buttons.push(b,c);
  }
  const onEvent=p=>{if(!p)return;const t=String(p.type||p.name||'').toLowerCase();if(t.includes('damage')||t.includes('hit')||t.includes('alarm'))state.heat=clamp(state.heat+5,0,100);if(t.includes('mission')||t.includes('finish'))state.chain=clamp(state.chain+1,0,8);if(t.includes('cargo'))state.cargoRisk=clamp(state.cargoRisk+3,0,100);save(state);};
  scene.events.on('relay:gameplay:v11',onEvent);scene.__deepV12={state,root,buttons};cleanup.push(()=>scene.events.off('relay:gameplay:v11',onEvent));
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{cleanup.forEach(fn=>fn());buttons.forEach(o=>o?.destroy?.());root.destroy();scene.__deepV12=null;});
  return result;
 };
 RunnerScene.prototype.update=function(time,delta){const result=originalUpdate?.apply(this,arguments),d=this.__deepV12;if(!d)return result;const p=playerOf(this),dt=Math.min(delta||16,100)/1000;if(p?.body?.velocity){const speed=Math.hypot(p.body.velocity.x||0,p.body.velocity.y||0);if(speed>420)d.state.noise=clamp(d.state.noise+dt*3,0,100);if(speed>520)d.state.momentum=clamp(d.state.momentum+dt*.15,0,6);}d.state.noise=clamp(d.state.noise-dt*.6,0,100);d.state.heat=clamp(d.state.heat-dt*.18,0,100);if(time%500<delta)save(d.state);return result;};
}
