import Phaser from 'phaser';

const TYPES={
 scout:{color:0x8df4ff,detectRadius:720,speed:.055,orbitRadius:280,lockMs:1450,strikeCooldownMs:5200,strikeRadius:78,role:'TRACK'},
 hunter:{color:0xffd06e,detectRadius:620,speed:.075,orbitRadius:210,lockMs:900,strikeCooldownMs:3800,strikeRadius:88,role:'PRESSURE'},
 bomber:{color:0xff5872,detectRadius:560,speed:.042,orbitRadius:240,lockMs:1050,strikeCooldownMs:4600,strikeRadius:104,role:'STRIKE'}
};
const MISSION_UNLOCKS=['dead-drop','blackout','pursuit','signal-storm','corporate-lockdown','final-relay'];
const emit=(s,e,d={})=>{try{s.events?.emit(e,{...d,source:'drone-strike-recovery-v2'})}catch{}};
const enabledFor=s=>MISSION_UNLOCKS.includes(s?.mission?.id);
function addDroneVisual(s,t,x,y){
 const c=TYPES[t],r=s.add.container(x,y).setDepth(46);
 const g=s.add.circle(0,0,t==='bomber'?30:24,c.color,.11).setBlendMode(Phaser.BlendModes.ADD);
 const b=s.add.rectangle(0,0,t==='bomber'?46:36,t==='scout'?14:18,0x111a2a,.98).setStrokeStyle(2,c.color,.9);
 const l=s.add.triangle(-24,0,-4,-8,-22,0,-4,8,0x283b57,1), rr=s.add.triangle(24,0,4,-8,22,0,4,8,0x283b57,1);
 const k=s.add.circle(0,0,t==='bomber'?6:4,c.color,1).setBlendMode(Phaser.BlendModes.ADD);
 const n=s.add.circle(0,8,3,c.color,1).setBlendMode(Phaser.BlendModes.ADD);
 const tx=s.add.text(0,-28,t.toUpperCase(),{fontFamily:'monospace',fontSize:'9px',color:t==='bomber'?'#ffd4db':t==='hunter'?'#fff0bd':'#d4fbff',stroke:'#07101e',strokeThickness:3}).setOrigin(.5);
 r.add([g,l,rr,b,k,n,tx]); s.tweens.add({targets:[g,k],alpha:{from:.35,to:1},duration:500,yoyo:true,repeat:-1});
 return {type:t,cfg:c,root:r,phase:Math.random()*Math.PI*2,lockedAt:0,nextActionAt:0};
}
function createZone(s,x,y,r,t){
 const c=TYPES[t].color,root=s.add.container(x,y).setDepth(19);
 const d=s.add.circle(0,0,r,0xff213f,.1),ring=s.add.circle(0,0,r,c,.46).setStrokeStyle(3,c,.95),inner=s.add.circle(0,0,Math.max(20,r*.46),0x180a12,.14);
 const label=s.add.text(0,-r-18,`${t.toUpperCase()} ZONE`,{fontFamily:'monospace',fontSize:'11px',color:'#ffe3e8',stroke:'#080d16',strokeThickness:4}).setOrigin(.5);
 root.add([d,ring,inner,label]);
 const tw=s.tweens.add({targets:[ring,inner],scale:{from:.72,to:1.13},alpha:{from:.28,to:.96},duration:330,yoyo:true,repeat:-1});
 const life={root,x,y,radius:r,type:t,bornAt:s.time.now,lifeMs:t==='bomber'?2500:2100,tween:tw,detonated:false};
 s.__droneV2Zones.push(life); emit(s,'drone:strike-warning',{type:t,x,y,radius:r}); return life;
}
function detonate(s,z){
 if(!z||z.detonated)return; z.detonated=true;
 const p=s.player,hit=p&&Phaser.Math.Distance.Between(p.x,p.y,z.x,z.y)<=z.radius;
 const blast=s.add.circle(z.x,z.y,22,0xffd9df,.72).setDepth(62).setBlendMode(Phaser.BlendModes.ADD);
 s.tweens.add({targets:blast,scale:z.radius/22*1.35,alpha:0,duration:420,onComplete:()=>blast.destroy()});
 s.cameras?.main?.shake?.(420,z.type==='bomber'?.018:.012); emit(s,'drone:strike-detonate',{type:z.type,x:z.x,y:z.y,hit});
 if(hit&&!s.__droneV2DeathLock){s.__droneV2DeathLock=true;if(Number.isFinite(s.health))s.health=0;s.healthInvulnerable=0;s.respawnGrace=0;s.fail?.(`${z.type.toUpperCase()} STRIKE`);window.setTimeout(()=>{s.__droneV2DeathLock=false},900)}
 z.root.destroy(true); s.__droneV2Zones=s.__droneV2Zones.filter(v=>v!==z);
}
function cleanup(s){for(const d of s.__droneV2Units||[])d.root?.destroy(true);for(const z of s.__droneV2Zones||[])z.root?.destroy(true);s.__droneV2Units=[];s.__droneV2Zones=[];}
export function installDroneStrikeRecoveryV2(RunnerScene){
 if(!RunnerScene?.prototype||RunnerScene.prototype.__droneStrikeRecoveryV2Installed)return;
 RunnerScene.prototype.__droneStrikeRecoveryV2Installed=true;
 const oc=RunnerScene.prototype.create,ou=RunnerScene.prototype.update;
 RunnerScene.prototype.create=function(...a){
   oc.apply(this,a); if(!enabledFor(this)||!this.player)return;
   this.__droneV2Units=[addDroneVisual(this,'scout',this.player.x-260,this.player.y-230),addDroneVisual(this,'hunter',this.player.x+220,this.player.y-200),addDroneVisual(this,'bomber',this.player.x+80,this.player.y-260)];
   this.__droneV2Zones=[]; this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>cleanup(this)); this.events.once(Phaser.Scenes.Events.DESTROY,()=>cleanup(this));
 };
 RunnerScene.prototype.update=function(...a){
   ou.apply(this,a); const p=this.player,u=this.__droneV2Units; if(!p||!u?.length||this.finished)return;
   const now=this.time.now,w=Number(this.physics?.world?.bounds?.width||6280);
   for(const d of u){
     const dist=Phaser.Math.Distance.Between(d.root.x,d.root.y,p.x,p.y),ang=now/(d.type==='scout'?1700:d.type==='hunter'?1250:2100)+d.phase;
     let x=p.x+Math.cos(ang)*d.cfg.orbitRadius,y=p.y-210+Math.sin(ang*1.16)*(d.type==='scout'?70:45);
     if(d.type==='hunter'&&dist<d.cfg.detectRadius){x=p.x+Math.sign(p.x-d.root.x||1)*150;y=p.y-150}
     if(d.type==='bomber'&&dist<d.cfg.detectRadius){x=p.x+Math.sin(now/800+d.phase)*260;y=p.y-290}
     d.root.x=Phaser.Math.Linear(d.root.x,Phaser.Math.Clamp(x,80,w-80),d.cfg.speed); d.root.y=Phaser.Math.Linear(d.root.y,Math.max(150,y),d.cfg.speed*.8); d.root.rotation=Math.sin(now/520+d.phase)*.055;
     if(dist<=d.cfg.detectRadius){
       if(!d.lockedAt){d.lockedAt=now;emit(this,'drone:lock',{type:d.type,role:d.cfg.role})}
       if(now-d.lockedAt>=d.cfg.lockMs&&now>=d.nextActionAt){
         const spread=d.type==='scout'?170:d.type==='hunter'?115:75,tx=Phaser.Math.Clamp(p.x+Phaser.Math.Between(-spread,spread),90,w-90),ty=Phaser.Math.Clamp(p.y+Phaser.Math.Between(-14,14),420,690);
         createZone(this,tx,ty,d.cfg.strikeRadius,d.type); d.nextActionAt=now+d.cfg.strikeCooldownMs; d.lockedAt=0;
       }
     } else if(d.lockedAt&&now-d.lockedAt>900) d.lockedAt=0;
   }
   for(const z of [...(this.__droneV2Zones||[])]) if(now-z.bornAt>=z.lifeMs) detonate(this,z);
 };
}
