import { RunnerScene } from './src/scenes/RunnerScene.js';

/* ADAPTIVE ARCADE MUSIC V3
 * Musical, mobile-safe procedural score. No external audio assets.
 * Presentation-only: reads the existing RunnerScene event bus/state.
 */
(() => {
  'use strict';
  if (window.__relayAdaptiveMusicV3) return;
  window.__relayAdaptiveMusicV3 = true;

  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;

  const s = {
    ctx:null, master:null, compressor:null, music:null, filter:null,
    scene:null, cleanup:null, timer:0, watchdog:0, running:false, unlocked:false,
    paused:false, enabled:true, volume:.32, intensity:0, target:0,
    step:0, next:0, tension:0
  };
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const N={
    C3:130.81,D3:146.83,E3:164.81,F3:174.61,G3:196,A3:220,B3:246.94,
    C4:261.63,D4:293.66,E4:329.63,F4:349.23,G4:392,A4:440,B4:493.88,
    C5:523.25,D5:587.33,E5:659.25,G5:783.99,A5:880
  };
  const chords=[
    [N.C4,N.E4,N.G4], [N.A3,N.C4,N.E4], [N.F3,N.A3,N.C4], [N.G3,N.B3,N.D4]
  ];
  const melody=[N.C5,N.E5,N.G5,N.E5,N.D5,N.G4,N.A4,N.C5,N.E5,N.D5,N.C5,N.A4,N.G4,N.E4,N.G4,N.C5];

  function ensureContext(){
    if(s.ctx) return s.ctx;
    s.ctx=new AC();
    s.master=s.ctx.createGain();
    s.master.gain.value=.0001;
    s.compressor=s.ctx.createDynamicsCompressor();
    s.compressor.threshold.value=-18;
    s.compressor.knee.value=16;
    s.compressor.ratio.value=3;
    s.compressor.attack.value=.008;
    s.compressor.release.value=.16;
    s.filter=s.ctx.createBiquadFilter();
    s.filter.type='lowpass';
    s.filter.frequency.value=1800;
    s.filter.Q.value=.45;
    s.music=s.ctx.createGain();
    s.music.gain.value=.75;
    s.music.connect(s.filter).connect(s.compressor).connect(s.master).connect(s.ctx.destination);
    return s.ctx;
  }

  async function unlock(){
    try{
      const c=ensureContext();
      if(c.state!=='running') await c.resume();
      s.unlocked=c.state==='running';
      if(s.unlocked&&s.scene&&!s.paused) start();
      return s.unlocked;
    }catch{ s.unlocked=false; return false; }
  }

  function master(value,fade=.25){
    if(!s.master||!s.ctx)return;
    const t=s.ctx.currentTime;
    s.master.gain.cancelScheduledValues(t);
    s.master.gain.setValueAtTime(Math.max(.0001,s.master.gain.value),t);
    s.master.gain.linearRampToValueAtTime(clamp(value,.0001,.6),t+fade);
  }

  function tone(freq,dur,gain,type,when){
    if(!s.running||s.paused||!s.enabled||!s.ctx)return;
    try{
      const o=s.ctx.createOscillator(), g=s.ctx.createGain();
      o.type=type;
      o.frequency.setValueAtTime(Math.max(40,freq),when);
      g.gain.setValueAtTime(.0001,when);
      g.gain.exponentialRampToValueAtTime(Math.max(.0001,gain),when+.012);
      g.gain.exponentialRampToValueAtTime(.0001,when+Math.max(.035,dur));
      o.connect(g).connect(s.music);
      o.start(when);
      o.stop(when+dur+.04);
    }catch{}
  }

  function kick(when,beat){
    if(!s.running||!s.ctx)return;
    try{
      const o=s.ctx.createOscillator(), g=s.ctx.createGain();
      o.type='sine';
      o.frequency.setValueAtTime(110,when);
      o.frequency.exponentialRampToValueAtTime(52,when+.11);
      g.gain.setValueAtTime(.0001,when);
      g.gain.exponentialRampToValueAtTime(.055,when+.008);
      g.gain.exponentialRampToValueAtTime(.0001,when+Math.min(.16,beat*.45));
      o.connect(g).connect(s.music); o.start(when); o.stop(when+.18);
    }catch{}
  }

  function schedule(){
    if(!s.running||s.paused||!s.enabled||!s.ctx)return;
    const bpm=96+s.intensity*8;
    const beat=60/bpm;
    const until=s.ctx.currentTime+.35;
    while(s.next<until){
      const i=s.step%16;
      const bar=Math.floor(s.step/16)%4;
      const when=s.next;
      const chord=chords[bar];
      tone(chord[0]/2,beat*.72,.075,'triangle',when);
      if(i%4===0){
        tone(chord[1],beat*.72,.038,'sine',when);
        tone(chord[2],beat*.72,.030,'sine',when);
        kick(when,beat);
      }
      if(i%2===0){
        const f=melody[(i/2+bar*3)%melody.length];
        tone(f,beat*.42,.040+s.intensity*.004,'triangle',when);
      }
      if(s.intensity>=1&&i%4===2){
        const f=melody[(i+bar)%melody.length]*.5;
        tone(f,beat*.55,.028,'triangle',when);
      }
      if(s.intensity>=2&&i%4===3){
        const f=melody[(i+5+bar)%melody.length];
        tone(f,beat*.24,.025,'triangle',when);
      }
      if(s.intensity>=3&&i%2===1){
        tone(chord[(i/2)%3]*2,beat*.18,.022,'triangle',when);
      }
      s.step++;
      s.next+=beat/2;
    }
  }

  function start(){
    if(!s.enabled||!s.unlocked||!s.scene||s.paused)return;
    ensureContext();
    if(!s.running){
      s.running=true;
      s.step=0;
      s.next=s.ctx.currentTime+.06;
      master(s.volume,.55);
    }
    clearInterval(s.timer);
    s.timer=window.setInterval(schedule,55);
    schedule();
  }

  function stop(fade=true){
    s.running=false;
    clearInterval(s.timer);
    s.timer=0;
    if(fade)master(.0001,.22);
  }

  function setIntensity(value,hold=0){
    s.target=clamp(Math.round(Number(value)||0),0,3);
    s.tension=Math.max(s.tension,hold);
    if(s.filter&&s.ctx){
      const cutoff=[1500,2100,2800,3600][s.target];
      s.filter.frequency.cancelScheduledValues(s.ctx.currentTime);
      s.filter.frequency.linearRampToValueAtTime(cutoff,s.ctx.currentTime+.28);
    }
  }

  function feedback(kind){
    const map={
      warning:[3,2800], chase:[3,6500], hit:[2,2200], death:[3,4000],
      dash:[2,900], jump:[1,700], signal:[1,900], checkpoint:[1,1200],
      complete:[1,3600], land:[1,500], wallJump:[2,800], vault:[1,700], slide:[1,600]
    };
    const x=map[kind];
    if(x)setIntensity(x[0],x[1]);
  }

  function bind(scene){
    if(!scene?.game||s.scene===scene)return;
    s.cleanup?.();
    s.scene=scene;
    const e=scene.game.events;
    const onFeedback=feedback;
    const onHealth=v=>{const hp=Number(v);if(hp<=1)setIntensity(3,4200);else if(hp<=2)setIntensity(2,2600);};
    const onEnergy=v=>{if(Number(v)<=18)setIntensity(2,2200);};
    const onCombo=v=>{if(Number(v)>=4)setIntensity(2,1500);};
    const onSector=()=>setIntensity(1,1800);
    const onComplete=()=>setIntensity(1,4000);
    const onGameOver=()=>setIntensity(3,5000);

    e.on('feedback',onFeedback);
    e.on('health',onHealth);
    e.on('energy',onEnergy);
    e.on('combo',onCombo);
    e.on('sector',onSector);
    e.on('complete',onComplete);
    e.on('game-over',onGameOver);

    s.cleanup=()=>{
      e.off('feedback',onFeedback);
      e.off('health',onHealth);
      e.off('energy',onEnergy);
      e.off('combo',onCombo);
      e.off('sector',onSector);
      e.off('complete',onComplete);
      e.off('game-over',onGameOver);
    };

    scene.events?.once?.('shutdown',()=>{
      s.cleanup?.(); s.cleanup=null; s.scene=null; s.tension=0; stop(true);
    });
    if(s.unlocked&&!s.paused)start();
  }

  const original=RunnerScene?.prototype?.create;
  if(typeof original==='function'&&!RunnerScene.prototype.__relayAdaptiveMusicV3Wrapped){
    RunnerScene.prototype.create=function adaptiveArcadeMusicCreate(...args){
      const result=original.apply(this,args);
      bind(this);
      return result;
    };
    RunnerScene.prototype.__relayAdaptiveMusicV3Wrapped=true;
  }

  const bindReadyScene=event=>{
    const scene=event?.detail?.scene||window.__relayRunnerScene;
    if(scene) bind(scene);
    if(s.unlocked&&!s.paused) start();
  };
  window.addEventListener('relay:runner-scene-ready',bindReadyScene,{passive:true});
  if(window.__relayRunnerScene) bindReadyScene({detail:{scene:window.__relayRunnerScene}});

  const gesture=()=>{ unlock(); };
  document.addEventListener('pointerdown',gesture,{capture:true,passive:true});
  document.addEventListener('touchstart',gesture,{capture:true,passive:true});
  document.addEventListener('keydown',e=>{if(e.code==='Space'||e.key==='Enter'||e.key==='Shift')unlock();},{capture:true,passive:true});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){s.paused=true;stop(true);}
    else{s.paused=false;if(s.unlocked&&s.scene)start();}
  });

  s.watchdog=window.setInterval(()=>{
    if(!s.enabled||!s.unlocked||s.paused||document.hidden)return;
    if(s.scene?.sys?.isActive?.()&&!s.running)start();
  },300);

  window.setInterval(()=>{
    const r=s.scene;
    if(!r?.sys?.isActive?.()||!r.player?.body)return;
    const speed=Math.abs(r.player.body.velocity?.x||0);
    const chase=!!(r.chaser?.visible&&r.chaser?.active);
    if(chase)setIntensity(3,1000);
    else if(s.tension<=0)setIntensity(speed>390?2:speed>240?1:0);
    s.tension=Math.max(0,s.tension-120);
    s.intensity+=((s.target-s.intensity)*.12);
    s.intensity=clamp(s.intensity,0,3);

    const p=document.querySelector('#pauseMenu');
    const paused=!!(p&&!p.classList.contains('hidden'));
    if(paused&&!s.paused){s.paused=true;stop(true);}
    else if(!paused&&s.paused&&!document.hidden){s.paused=false;if(s.unlocked)start();}
  },120);

  window.relayAdaptiveMusic={
    unlock,start,stop,setIntensity,
    setVolume(v){s.volume=clamp(Number(v)||0,.05,.8);if(s.running)master(s.volume,.2);},
    setEnabled(v){s.enabled=!!v;if(!s.enabled)stop(true);else if(s.unlocked&&s.scene&&!s.paused)start();},
    getState:()=>({running:s.running,intensity:s.intensity,unlocked:s.unlocked,enabled:s.enabled,volume:s.volume})
  };
})();
