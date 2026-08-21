/* ADAPTIVE MUSIC V1
 * Procedural gameplay score. No external assets and no Home music.
 * Reads the existing RunnerScene event bus and player state.
 * Owns only its AudioContext nodes and cleans them up on scene shutdown.
 */
(() => {
  'use strict';
  if (window.__relayAdaptiveMusicV1) return;
  window.__relayAdaptiveMusicV1 = true;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;

  const state = { ctx:null, master:null, music:null, filter:null, scene:null, attached:null, running:false, unlocked:false, intensity:0, targetIntensity:0, scheduler:0, nextNote:0, step:0, lastEventAt:0, eventTimer:0, paused:false, enabled:true, volume:.16, cleanup:null };
  const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
  const now = () => state.ctx?.currentTime || 0;
  const scales = [[220,261.63,293.66,329.63,392,440],[220,261.63,293.66,349.23,392,440],[196,233.08,261.63,293.66,349.23,392],[174.61,207.65,246.94,293.66,349.23,415.30]];

  function ensureContext(){
    if(!state.ctx){
      state.ctx=new AC();
      state.master=state.ctx.createGain(); state.master.gain.value=.0001;
      state.filter=state.ctx.createBiquadFilter(); state.filter.type='lowpass'; state.filter.frequency.value=900; state.filter.Q.value=.65;
      state.music=state.ctx.createGain(); state.music.gain.value=.72; state.music.connect(state.filter).connect(state.master).connect(state.ctx.destination);
    }
    return state.ctx;
  }
  async function unlock(){
    try{ const ctx=ensureContext(); if(ctx.state!=='running') await ctx.resume(); state.unlocked=ctx.state==='running'; if(state.unlocked&&state.enabled&&state.scene&&!state.paused) start(); return state.unlocked; }
    catch{ state.unlocked=false; return false; }
  }
  function setMaster(target,seconds=.25){ if(!state.master||!state.ctx)return; const t=state.ctx.currentTime; state.master.gain.cancelScheduledValues(t); state.master.gain.setValueAtTime(Math.max(.0001,state.master.gain.value),t); state.master.gain.linearRampToValueAtTime(clamp(target, .0001,.8),t+seconds); }
  function note(freq,duration,gain,type='triangle',when=now()){
    if(!state.ctx||!state.music||!state.running||state.paused||!state.enabled)return;
    const osc=state.ctx.createOscillator(), env=state.ctx.createGain(); osc.type=type; osc.frequency.setValueAtTime(Math.max(35,freq),when);
    env.gain.setValueAtTime(.0001,when); env.gain.exponentialRampToValueAtTime(Math.max(.0001,gain),when+.018); env.gain.exponentialRampToValueAtTime(.0001,when+duration);
    osc.connect(env).connect(state.music); osc.start(when); osc.stop(when+duration+.03);
  }
  function schedule(){
    if(!state.running||!state.ctx||state.paused||!state.enabled)return;
    const bpm=82+state.intensity*10, beat=60/bpm;
    while(state.nextNote<state.ctx.currentTime+.22){
      const scale=scales[state.intensity], index=state.step%8, root=scale[index%scale.length], when=state.nextNote;
      const lead=[.55,.7,.82,.95][state.intensity];
      note(root*(index%3===0?1:2),beat*.78,.020*lead,'triangle',when);
      if(state.intensity>=1&&index%2===0)note(root/2,beat*.7,.028+state.intensity*.006,'sine',when);
      if(state.intensity>=2&&index%4===3)note(root*2,beat*.28,.014+state.intensity*.004,'square',when);
      if(state.intensity===3&&index%2===1)note(root*.75,beat*.42,.018,'sawtooth',when);
      state.step++; state.nextNote+=beat;
    }
  }
  function start(){
    if(!state.enabled||!state.unlocked||!state.scene||state.paused)return;
    ensureContext();
    if(!state.running){state.running=true;state.nextNote=state.ctx.currentTime+.05;state.step=0;setMaster(state.volume,.45);}
    clearInterval(state.scheduler); state.scheduler=window.setInterval(schedule,80); schedule();
  }
  function stop(fade=true){ state.running=false; clearInterval(state.scheduler); state.scheduler=0; if(fade)setMaster(.0001,.22); }
  function setIntensity(value,reason=''){
    const next=clamp(Math.round(Number(value)||0),0,3); if(next===state.targetIntensity)return; state.targetIntensity=next; state.lastEventAt=performance.now();
    if(state.filter&&state.ctx){const cutoff=[780,1050,1450,2050][next]; state.filter.frequency.cancelScheduledValues(state.ctx.currentTime); state.filter.frequency.linearRampToValueAtTime(cutoff,state.ctx.currentTime+.35);}
  }
  function eventFeedback(kind){
    const map={warning:3,chase:3,hit:2,death:3,complete:1,dash:2,jump:1,signal:1,checkpoint:1,empty:2};
    if(kind in map)setIntensity(map[kind],kind);
    if(kind==='warning'||kind==='chase'||kind==='hit'||kind==='death')state.eventTimer=kind==='chase'?6200:2600;
    else if(kind==='complete')state.eventTimer=3200; else state.eventTimer=Math.max(state.eventTimer,700);
  }
  function bindScene(scene){
    if(!scene?.game||state.attached===scene)return;
    if(state.cleanup)state.cleanup();
    state.scene=scene; state.attached=scene; state.paused=false;
    const events=scene.game.events;
    const onFeedback=kind=>eventFeedback(kind);
    const onHealth=value=>{const hp=Number(value);if(hp<=1){setIntensity(3,'critical-health');state.eventTimer=4200;}else if(hp<=2){setIntensity(2,'low-health');state.eventTimer=2600;}};
    const onEnergy=value=>{if(Number(value)<=18){setIntensity(2,'low-energy');state.eventTimer=2200;}};
    const onCombo=value=>{if(Number(value)>=4){setIntensity(2,'combo');state.eventTimer=1500;}};
    const onSector=()=>{setIntensity(1,'sector');state.eventTimer=1800;};
    const onComplete=()=>{setIntensity(1,'complete');state.eventTimer=4000;};
    const onGameOver=()=>{setIntensity(3,'game-over');state.eventTimer=5000;};
    events.on('feedback',onFeedback); events.on('health',onHealth); events.on('energy',onEnergy); events.on('combo',onCombo); events.on('sector',onSector); events.on('complete',onComplete); events.on('game-over',onGameOver);
    const shutdown=()=>{if(state.scene===scene){state.cleanup?.();state.cleanup=null;state.scene=null;state.attached=null;state.eventTimer=0;}stop(true);};
    scene.events?.once?.('shutdown',shutdown);
    state.cleanup=()=>{events.off('feedback',onFeedback);events.off('health',onHealth);events.off('energy',onEnergy);events.off('combo',onCombo);events.off('sector',onSector);events.off('complete',onComplete);events.off('game-over',onGameOver);};
    if(state.unlocked&&state.enabled&&!state.paused)start();
  }
  function inspectGameplay(){
    const scene=state.scene; if(!scene?.sys?.isActive?.()||!scene.player?.body)return;
    const speed=Math.abs(scene.player.body.velocity?.x||0), chaseActive=Boolean(scene.chaser?.visible&&scene.chaser?.active);
    if(chaseActive){setIntensity(3,'chase');state.eventTimer=Math.max(state.eventTimer,900);} else if(state.eventTimer<=0){if(speed>390)setIntensity(2,'speed');else if(speed>250)setIntensity(1,'flow');else setIntensity(0,'calm');}
    state.eventTimer=Math.max(0,state.eventTimer-120); state.intensity+= (state.targetIntensity-state.intensity)*.08; state.intensity=clamp(Math.round(state.intensity),0,3);
    if(state.filter&&state.ctx)state.filter.frequency.setTargetAtTime([780,1050,1450,2050][state.intensity],state.ctx.currentTime,.18);
    const pause=document.querySelector('#pauseMenu'), terminalPaused=pause&&!pause.classList.contains('hidden');
    if(terminalPaused||document.hidden){if(!state.paused){state.paused=true;stop(true);}}
    else if(state.paused&&state.scene){state.paused=false;if(state.unlocked&&state.enabled)start();}
  }
  const originalCreate=RunnerScene.prototype.create;
  if(typeof originalCreate==='function'&&!RunnerScene.prototype.__relayAdaptiveMusicCreateWrapped){RunnerScene.prototype.create=function adaptiveMusicCreate(...args){const result=originalCreate.apply(this,args);bindScene(this);return result;};RunnerScene.prototype.__relayAdaptiveMusicCreateWrapped=true;}
  const gesture=()=>unlock();
  document.addEventListener('pointerdown',gesture,{capture:true,passive:true}); document.addEventListener('touchstart',gesture,{capture:true,passive:true}); document.addEventListener('keydown',event=>{if(event.code==='Space'||event.key==='Enter'||event.key==='Shift')unlock();},{capture:true,passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){state.paused=true;stop(true);}else{state.paused=false;if(state.unlocked&&state.enabled&&state.scene)start();}});
  window.setInterval(inspectGameplay,120);
  window.relayAdaptiveMusic={unlock,start,stop,setIntensity,setVolume(value){state.volume=clamp(Number(value)||0,0,.5);if(state.running)setMaster(state.volume,.2);},setEnabled(value){state.enabled=Boolean(value);if(!state.enabled)stop(true);else if(state.unlocked&&state.scene&&!state.paused)start();},getState:()=>({running:state.running,intensity:state.intensity,targetIntensity:state.targetIntensity,unlocked:state.unlocked,enabled:state.enabled})};
})();