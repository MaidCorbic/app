import { RunnerScene } from './src/scenes/RunnerScene.js';

/* ADAPTIVE ARCADE MUSIC V2
 * Explicit RunnerScene import prevents module-order crashes.
 * Web Audio is unlocked only from a real user gesture for mobile browsers.
 */
(() => {
  'use strict';
  if (window.__relayAdaptiveMusicV2) return;
  window.__relayAdaptiveMusicV2 = true;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;

  const s = { ctx:null, master:null, bus:null, filter:null, scene:null, cleanup:null, timer:0, running:false, unlocked:false, paused:false, enabled:true, volume:.34, intensity:0, target:0, step:0, next:0, tension:0 };
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const N={C3:130.81,D3:146.83,E3:164.81,G3:196,A3:220,C4:261.63,D4:293.66,E4:329.63,G4:392,A4:440,C5:523.25,D5:587.33,E5:659.25,G5:783.99,A5:880};
  const prog=[[N.C4,N.E4,N.G4],[N.A3,N.C4,N.E4],[N.G3,N.C4,N.D4],[N.E3,N.G3,N.B4||493.88]];
  const melody=[N.C5,N.G4,N.A4,N.E5,N.D5,N.G4,N.E4,N.C5];

  function ctx(){
    if(s.ctx)return s.ctx;
    s.ctx=new AC();
    s.master=s.ctx.createGain(); s.master.gain.value=.0001;
    s.filter=s.ctx.createBiquadFilter(); s.filter.type='lowpass'; s.filter.frequency.value=1500; s.filter.Q.value=.7;
    s.bus=s.ctx.createGain(); s.bus.gain.value=.9; s.bus.connect(s.filter).connect(s.master).connect(s.ctx.destination);
    return s.ctx;
  }
  async function unlock(){ try{ const c=ctx(); if(c.state!=='running') await c.resume(); s.unlocked=c.state==='running'; if(s.unlocked&&s.scene&&!s.paused)start(); return s.unlocked; }catch{ s.unlocked=false; return false; } }
  function master(v,fade=.2){ if(!s.master||!s.ctx)return; const t=s.ctx.currentTime; s.master.gain.cancelScheduledValues(t); s.master.gain.setValueAtTime(Math.max(.0001,s.master.gain.value),t); s.master.gain.linearRampToValueAtTime(clamp(v,.0001,.8),t+fade); }
  function tone(freq,dur,gain,type,when){
    if(!s.running||s.paused||!s.enabled||!s.ctx)return;
    try{ const o=s.ctx.createOscillator(), g=s.ctx.createGain(); o.type=type; o.frequency.setValueAtTime(Math.max(35,freq),when); g.gain.setValueAtTime(.0001,when); g.gain.exponentialRampToValueAtTime(Math.max(.0001,gain),when+.012); g.gain.exponentialRampToValueAtTime(.0001,when+dur); o.connect(g).connect(s.bus); o.start(when); o.stop(when+dur+.03); }catch{}
  }
  function schedule(){
    if(!s.running||s.paused||!s.enabled||!s.ctx)return;
    const bpm=92+s.intensity*12, beat=60/bpm, tick=beat/2, until=s.ctx.currentTime+.3;
    while(s.next<until){
      const i=s.step%16, bar=Math.floor(s.step/16)%4, t=s.next, chord=prog[bar];
      tone(chord[0]/2,beat*.82,.065,'triangle',t);
      if(i%4===0){ tone(chord[1],beat*.65,.025,'sine',t); tone(chord[2],beat*.65,.018,'sine',t); tone(70,.12,.07,'sine',t); }
      if(i%2===0) tone(melody[(i/2+bar*2)%melody.length],tick*.8,.030+s.intensity*.006,'square',t);
      if(s.intensity>=1&&i%2===1) tone(5000,.025,.012,'square',t);
      if(s.intensity>=2&&i%4===2) tone(melody[(i+bar)%melody.length]*2,tick*.32,.016,'triangle',t);
      if(s.intensity>=3&&i%4===3) tone(60,.1,.055,'sine',t);
      s.step++; s.next+=tick;
    }
  }
  function start(){ if(!s.enabled||!s.unlocked||!s.scene||s.paused)return; ctx(); if(!s.running){s.running=true;s.step=0;s.next=s.ctx.currentTime+.05;master(s.volume,.45);} clearInterval(s.timer); s.timer=setInterval(schedule,55); schedule(); }
  function stop(fade=true){s.running=false;clearInterval(s.timer);s.timer=0;if(fade)master(.0001,.2);}
  function setIntensity(v,hold=0){s.target=clamp(Math.round(Number(v)||0),0,3);s.tension=Math.max(s.tension,hold);if(s.filter&&s.ctx){s.filter.frequency.cancelScheduledValues(s.ctx.currentTime);s.filter.frequency.linearRampToValueAtTime([1100,1500,2200,3200][s.target],s.ctx.currentTime+.25);}}
  function feedback(kind){const m={warning:[3,2800],chase:[3,6500],hit:[2,2200],death:[3,4000],dash:[2,900],jump:[1,700],signal:[1,900],checkpoint:[1,1200],complete:[1,3600],land:[1,500],wallJump:[2,800]};const x=m[kind];if(x)setIntensity(x[0],x[1]);}
  function bind(scene){
    if(!scene?.game||s.scene===scene)return;
    s.cleanup?.(); s.scene=scene; const e=scene.game.events;
    const hp=v=>{v=Number(v);if(v<=1)setIntensity(3,4200);else if(v<=2)setIntensity(2,2600);};
    const en=v=>{if(Number(v)<=18)setIntensity(2,2200);}; const combo=v=>{if(Number(v)>=4)setIntensity(2,1500);};
    e.on('feedback',feedback);e.on('health',hp);e.on('energy',en);e.on('combo',combo);e.on('sector',()=>setIntensity(1,1800));e.on('complete',()=>setIntensity(1,4000));e.on('game-over',()=>setIntensity(3,5000));
    s.cleanup=()=>{e.off('feedback',feedback);e.off('health',hp);e.off('energy',en);e.off('combo',combo);};
    scene.events?.once?.('shutdown',()=>{s.cleanup?.();s.cleanup=null;s.scene=null;stop(true);});
    if(s.unlocked&&!s.paused)start();
  }
  const original=RunnerScene.prototype.create;
  if(typeof original==='function'&&!RunnerScene.prototype.__relayAdaptiveMusicWrapped){RunnerScene.prototype.create=function(...args){const result=original.apply(this,args);bind(this);return result;};RunnerScene.prototype.__relayAdaptiveMusicWrapped=true;}
  const gesture=()=>{unlock();};
  document.addEventListener('pointerdown',gesture,{capture:true,passive:true}); document.addEventListener('touchstart',gesture,{capture:true,passive:true});
  document.addEventListener('keydown',e=>{if(e.code==='Space'||e.key==='Enter'||e.key==='Shift')unlock();},{capture:true,passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){s.paused=true;stop(true);}else{s.paused=false;if(s.unlocked&&s.scene)start();}});
  setInterval(()=>{const r=s.scene;if(!r?.sys?.isActive?.()||!r.player?.body)return;const speed=Math.abs(r.player.body.velocity?.x||0),chase=!!(r.chaser?.visible&&r.chaser?.active);if(chase)setIntensity(3,1000);else if(s.tension<=0)setIntensity(speed>390?2:speed>240?1:0);s.tension=Math.max(0,s.tension-120);s.intensity=Math.round(s.intensity+(s.target-s.intensity)*.12);const p=document.querySelector('#pauseMenu');const paused=!!(p&&!p.classList.contains('hidden'));if(paused&&!s.paused){s.paused=true;stop(true);}else if(!paused&&s.paused&&!document.hidden){s.paused=false;if(s.unlocked)start();}},120);
  window.relayAdaptiveMusic={unlock,start,stop,setIntensity,setVolume(v){s.volume=clamp(Number(v)||0,0,.8);if(s.running)master(s.volume,.2);},setEnabled(v){s.enabled=!!v;if(!s.enabled)stop(true);else if(s.unlocked&&s.scene&&!s.paused)start();},getState:()=>({running:s.running,intensity:s.intensity,unlocked:s.unlocked,enabled:s.enabled,volume:s.volume})};
})();