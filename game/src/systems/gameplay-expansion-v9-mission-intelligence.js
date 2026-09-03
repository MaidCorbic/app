import Phaser from 'phaser';

const STORAGE_KEY = 'relay.gameplay.v9.missionIntelligence';
const DEFAULT_STATE = { intel:{source:0,confidence:0,verified:false}, delayed:{armed:false,fired:false,count:0}, ghost:{samples:[],plays:0} };
const clone=v=>JSON.parse(JSON.stringify(v));
const load=()=>{try{const r=globalThis.localStorage?.getItem(STORAGE_KEY);return r?{...clone(DEFAULT_STATE),...JSON.parse(r)}:clone(DEFAULT_STATE);}catch{return clone(DEFAULT_STATE);}};
const save=s=>{try{globalThis.localStorage?.setItem(STORAGE_KEY,JSON.stringify(s));}catch{}};
const label=(scene,x,y,v,style={})=>scene.add.text(x,y,v,{fontFamily:'monospace',fontSize:'9px',fontStyle:'bold',color:'#e9fbff',...style}).setOrigin(.5);

export function installGameplayExpansionV9MissionIntelligence(RunnerScene){
 if(!RunnerScene?.prototype||RunnerScene.prototype.__gameplayExpansionV9Installed)return;
 RunnerScene.prototype.__gameplayExpansionV9Installed=true;
 const originalCreate=RunnerScene.prototype.create, originalUpdate=RunnerScene.prototype.update;
 RunnerScene.prototype.create=function(...args){
  const result=originalCreate.apply(this,args), scene=this, state=load();
  scene.__v9={state,samples:[],ghost:null,ghostIndex:0,ghostPlaying:false,timer:null,destroyed:false};
  const w=scene.scale?.width||scene.cameras?.main?.width||1280,h=scene.scale?.height||scene.cameras?.main?.height||720,mobile=w<=760;
  const pw=mobile?Math.min(w-20,330):365, ph=208, px=mobile?(w-pw)/2:w-pw-16, py=mobile?70:Math.max(80,h-ph-22);
  const panel=scene.add.rectangle(px+pw/2,py+ph/2,pw,ph,0x06111e,.94).setStrokeStyle(1,0x7ee7ff,.72).setScrollFactor(0).setDepth(700);
  const title=label(scene,px+14,py+14,'V9 // MISSION INTELLIGENCE',{fontSize:'11px',color:'#7ee7ff'}).setOrigin(0).setScrollFactor(0).setDepth(701);
  const help=label(scene,px+pw-14,py+14,'ALT+Q / W / E',{fontSize:'7px',color:'#7896a4'}).setOrigin(1,.5).setScrollFactor(0).setDepth(701);
  const status=label(scene,px+14,py+ph-14,'READY',{fontSize:'8px',color:'#a7dbe8'}).setOrigin(0).setScrollFactor(0).setDepth(701);
  const buttons=[];
  const defs=[['Q','INTEL VERIFY','Compare sources',0x8ee7ff],['W','DELAYED TRIGGER','Arm 3s action',0xffd27a],['E','REPLAY GHOST','Replay last path',0xc4a0ff]];
  const bw=(pw-42)/3;
  const flash=b=>{b.bg.setStrokeStyle(2,b.color,1);scene.tweens?.add?.({targets:b.bg,alpha:{from:.45,to:1},duration:110,yoyo:true,repeat:2});};
  defs.forEach((d,i)=>{const x=px+14+bw/2+i*(bw+7),y=py+58,bg=scene.add.rectangle(x,y,bw,54,0x0b1b2a,.98).setStrokeStyle(1,d[3],.8).setInteractive({useHandCursor:true}).setScrollFactor(0).setDepth(701);const key=label(scene,x,y-17,d[0],{fontSize:'12px'}).setScrollFactor(0).setDepth(702);const t=label(scene,x,y-1,d[1],{fontSize:'7px'}).setScrollFactor(0).setDepth(702);const sub=label(scene,x,y+13,d[2],{fontSize:'6px',color:'#86a9b8'}).setScrollFactor(0).setDepth(702);buttons.push({bg,key,t,sub,color:d[3]});});
  buttons.forEach(({ bg, key, t, sub }) => {
  bg.setVisible(false);
  key.setVisible(false);
  t.setVisible(false);
  sub.setVisible(false);

  bg.disableInteractive?.();
});
  const worldY=Math.max(185,Math.min(h-120,h*.38)), colors=[0x65d9ff,0xffc65d,0xbda0ff];
  const sources=[0,1,2].map(i=>{const x=w*(.18+i*.14),c=scene.add.circle(x,worldY,16,0x0a1724,.96).setStrokeStyle(2,colors[i],.9).setInteractive({useHandCursor:true}).setDepth(610);const l=label(scene,x,worldY+31,`SOURCE ${i+1}`,{fontSize:'7px',color:'#b8d8e3'}).setDepth(611);c.on('pointerdown',()=>verify(i));return{c,l};});
  scene.add.rectangle(w*.32,worldY,w*.28,2,0x477086,.55).setDepth(609);
  const beacon=scene.add.circle(w*.62,worldY,18,0x1b1520,.96).setStrokeStyle(2,0xffd27a,.9).setInteractive({useHandCursor:true}).setDepth(610);
  const bl=label(scene,w*.62,worldY+31,'DELAY BEACON',{fontSize:'7px',color:'#e9d5a7'}).setDepth(611), bs=label(scene,w*.62,worldY+48,'SAFE',{fontSize:'7px',color:'#a8b8c2'}).setDepth(611);
  const ghostTrail=scene.add.graphics().setDepth(604), ghostDot=scene.add.circle(0,0,9,0xc4a0ff,.36).setStrokeStyle(2,0xe9ddff,.8).setVisible(false).setDepth(606);
  const setStatus=m=>status.setText(m);
  const verify=i=>{const s=scene.__v9.state;s.intel.source=i;s.intel.confidence=i===1?100:i===0?55:35;s.intel.verified=i===1;save(s);sources.forEach((a,n)=>a.c.setStrokeStyle(2,colors[n],n===i?1:.55));setStatus(`INTEL SOURCE ${i+1} · CONFIDENCE ${s.intel.confidence}%${s.intel.verified?' · VERIFIED':''}`);flash(buttons[0]);};
  const arm=()=>{const s=scene.__v9.state;if(scene.__v9.timer)return setStatus('DELAY ALREADY ARMED');s.delayed.armed=true;s.delayed.fired=false;save(s);bs.setText('ARMED 3.0s');beacon.setFillStyle(0x3b2c16,1);setStatus('DELAYED ACTION ARMED · 3 SECONDS');flash(buttons[1]);scene.__v9.timer=scene.time?.delayedCall?.(3000,()=>{const n=scene.__v9.state;n.delayed.armed=false;n.delayed.fired=true;n.delayed.count++;save(n);bs.setText('FIRED');beacon.setFillStyle(0x5a2b1d,1);setStatus(`DELAYED ACTION FIRED · COUNT ${n.delayed.count}`);scene.__v9.timer=null;});};
  const replay=()=>{const samples=scene.__v9.state.ghost.samples?.length?scene.__v9.state.ghost.samples:scene.__v9.samples;if(samples.length<4)return setStatus('REPLAY NEEDS A RECORDED PATH');scene.__v9.ghost=samples.map(p=>({...p}));scene.__v9.ghostIndex=0;scene.__v9.ghostPlaying=true;scene.__v9.state.ghost.plays++;save(scene.__v9.state);ghostDot.setVisible(true);setStatus(`REPLAY GHOST ACTIVE · ${samples.length} SAMPLES`);flash(buttons[2]);};
  buttons[0].bg.on('pointerdown',()=>verify((scene.__v9.state.intel.source+1)%3));buttons[1].bg.on('pointerdown',arm);buttons[2].bg.on('pointerdown',replay);beacon.on('pointerdown',arm);
  const key=e=>{if(!e?.altKey)return;if(e.code==='KeyQ')verify((scene.__v9.state.intel.source+1)%3);else if(e.code==='KeyW')arm();else if(e.code==='KeyE')replay();};scene.__v9Key=key;scene.input.keyboard?.on('keydown',key);
  scene.__v9.render=()=>{const g=scene.__v9.ghost;if(!scene.__v9.ghostPlaying||!g?.length)return;const i=Math.min(scene.__v9.ghostIndex,g.length-1),p=g[i];ghostDot.setPosition(p.x,p.y);scene.__v9.ghostIndex++;if(scene.__v9.ghostIndex>=g.length){scene.__v9.ghostPlaying=false;ghostDot.setVisible(false);setStatus('REPLAY GHOST COMPLETE');}};
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{scene.__v9.destroyed=true;scene.__v9.timer?.remove?.(false);scene.input.keyboard?.off('keydown',scene.__v9Key);[panel,title,help,status,beacon,bl,bs,ghostDot,ghostTrail,...buttons.flatMap(b=>[b.bg,b.key,b.t,b.sub]),...sources.flatMap(s=>[s.c,s.l])].forEach(o=>o?.destroy?.());});
  return result;
 };
 RunnerScene.prototype.update=function(...args){const result=originalUpdate.apply(this,args);const v=this.__v9;if(!v||v.destroyed)return result;if(this.player){const p={x:Number(this.player.x)||0,y:Number(this.player.y)||0},last=v.samples[v.samples.length-1];if(!last||Math.abs(p.x-last.x)+Math.abs(p.y-last.y)>4){v.samples.push(p);if(v.samples.length>180)v.samples.shift();if(v.samples.length>=12)v.state.ghost.samples=v.samples.slice(-180);}}v.render?.();return result;};
}
