/* DYNAMIC ENVIRONMENT REACTIONS V1
 * Presentation-only environment response layer.
 * No ownership of player physics, missions, progression or saves.
 */
(() => {
  'use strict';
  if (window.__relayDynamicEnvironmentV1) return;
  window.__relayDynamicEnvironmentV1 = true;
  const state={scene:null,cleanup:null,raf:0,enabled:true};
  const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const host=()=>document.querySelector('#phaser-game')||document.querySelector('#game')||document.body;
  function layer(){let el=document.getElementById('dynamicEnvironmentLayer');if(!el){el=document.createElement('div');el.id='dynamicEnvironmentLayer';el.setAttribute('aria-hidden','true');host().appendChild(el);}return el;}
  function pulse(type){if(!state.enabled)return;const el=layer();el.dataset.reaction=type;clearTimeout(el._timer);el._timer=setTimeout(()=>{if(el.dataset.reaction===type)delete el.dataset.reaction;},reduced()?0:420);}
  function bind(scene){if(!scene?.game||state.scene===scene)return;s.cleanup?.();state.scene=scene;const e=scene.game.events;const handlers={feedback:k=>{if(k==='dash')pulse('dash');else if(k==='warning'||k==='chase'||k==='hit')pulse('danger');else if(k==='jump'||k==='wallJump'||k==='vault'||k==='slide')pulse('movement');else if(k==='signal')pulse('signal');else if(k==='complete')pulse('complete');},checkpoint:()=>pulse('checkpoint'),sector:()=>pulse('sector'),complete:()=>pulse('complete'),'game-over':()=>pulse('danger')};Object.entries(handlers).forEach(([k,fn])=>e.on(k,fn));state.cleanup=()=>Object.entries(handlers).forEach(([k,fn])=>e.off(k,fn));scene.events?.once?.('shutdown',()=>{state.cleanup?.();state.cleanup=null;state.scene=null;});}
  function tick(){const sc=state.scene;if(sc?.sys?.isActive?.()&&sc.player?.body){const v=Math.abs(sc.player.body.velocity?.x||0);const intensity=Math.min(1,Math.max(0,(v-180)/300));const el=layer();el.style.setProperty('--env-speed',intensity.toFixed(3));el.classList.toggle('is-speeding',!reduced()&&intensity>.72);}state.raf=requestAnimationFrame(tick);}
  function discover(){bind(window.__relayRunnerScene);if(!state.scene&&window.relayRunnerGame?.scene){try{bind(window.relayRunnerGame.scene.getScene('runner'));}catch{}}}
  window.relayDynamicEnvironment={enable(v=true){state.enabled=!!v;},pulse,bind,cleanup(){state.cleanup?.();state.cleanup=null;cancelAnimationFrame(state.raf);}};
  const boot=()=>{layer();discover();state.raf=requestAnimationFrame(tick);window.addEventListener('relay:runner-scene-ready',e=>bind(e.detail?.scene));};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();