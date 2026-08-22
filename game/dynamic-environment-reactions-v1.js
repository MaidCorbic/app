// Dynamic Environment Reactions V1 — additive, fail-safe presentation layer.
(() => {
  'use strict';
  if (window.__relayDynamicEnvironmentV1) return;
  window.__relayDynamicEnvironmentV1 = true;
  const state = { game:null, scene:null, raf:0, timer:0, bound:false, enabled:true };
  const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  const getGame = () => window.relayRunnerGame || window.__relayRunnerGame || window.__RUNNER_GAME__ || window.__relayRunnerScene?.game || null;
  const getScene = game => { try { return window.__relayRunnerScene || game?.scene?.getScene?.('runner') || null; } catch { return window.__relayRunnerScene || null; } };
  const getHost = () => document.querySelector('#play') || document.querySelector('#phaser-game') || document.querySelector('#game') || document.body;
  function ensureLayer(){ let el=document.getElementById('dynamicEnvironmentLayer'); if(el?.isConnected)return el; el=document.createElement('div'); el.id='dynamicEnvironmentLayer'; el.setAttribute('aria-hidden','true'); getHost().appendChild(el); return el; }
  function pulse(type,duration=420){ if(!state.enabled)return; const el=ensureLayer(); clearTimeout(state.timer); el.dataset.reaction=type; state.timer=setTimeout(()=>{if(el.dataset.reaction===type)delete el.dataset.reaction;},reduced()?80:duration); }
  function onFeedback(kind){ const map={dash:['dash',360],jump:['movement',260],wallJump:['movement',300],vault:['movement',300],slide:['movement',260],warning:['danger',520],chase:['danger',650],hit:['danger',420],signal:['signal',520],complete:['complete',800]}; const next=map[kind]; if(next)pulse(next[0],next[1]); }
  function unbind(){ if(!state.bound||!state.game?.events?.off)return; state.game.events.off('feedback',onFeedback); state.game.events.off('checkpoint',state.onCheckpoint); state.game.events.off('sector',state.onSector); state.game.events.off('complete',state.onComplete); state.game.events.off('game-over',state.onGameOver); state.bound=false; }
  function bind(){ const game=getGame(),scene=getScene(game); if(!game?.events?.on||!scene)return false; if(state.game===game&&state.scene===scene&&state.bound)return true; unbind(); state.game=game; state.scene=scene; state.onCheckpoint=()=>pulse('checkpoint',560); state.onSector=()=>pulse('sector',480); state.onComplete=()=>pulse('complete',800); state.onGameOver=()=>pulse('danger',500); game.events.on('feedback',onFeedback); game.events.on('checkpoint',state.onCheckpoint); game.events.on('sector',state.onSector); game.events.on('complete',state.onComplete); game.events.on('game-over',state.onGameOver); scene.events?.once?.('shutdown',()=>{unbind();state.scene=null;}); state.bound=true; return true; }
  function tick(){ bind(); const el=ensureLayer(),body=state.scene?.player?.body; if(body?.velocity){ const speed=Math.abs(Number(body.velocity.x)||0),intensity=Math.max(0,Math.min(1,(speed-120)/520)); el.style.setProperty('--env-speed',intensity.toFixed(3)); el.classList.toggle('is-speeding',!reduced()&&intensity>.7); } state.raf=requestAnimationFrame(tick); }
  function init(){ ensureLayer(); window.addEventListener('relay:runner-scene-ready',()=>{state.game=null;state.scene=null;bind();},{passive:true}); window.addEventListener('blur',()=>{clearTimeout(state.timer);const el=document.getElementById('dynamicEnvironmentLayer');if(el)delete el.dataset.reaction;},{passive:true}); if(!state.raf)state.raf=requestAnimationFrame(tick); }
  window.relayDynamicEnvironment={enable(v=true){state.enabled=Boolean(v);},pulse,bind,cleanup(){unbind();clearTimeout(state.timer);cancelAnimationFrame(state.raf);state.raf=0;}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
