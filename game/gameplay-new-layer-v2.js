// NEW GAMEPLAY LAYER V3
// Event-driven gameplay state only. No DOM HUD, no requestAnimationFrame loop,
// and no duplicate keyboard listeners. Existing gameplay/input owners remain authoritative.
const KEY = 'relay.runner.gameplay.v3';
const CHAIN_TIMEOUT = 1450;
const state = { started:false,lastAction:'',lastActionAt:0,chain:0,chainPeak:0,nearMisses:0,clutches:0,lastNearMissAt:0,clutchUntil:0,runStartedAt:0 };
const now=()=>performance.now();
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}};
function registerAction(action){if(!action)return;const t=now();if(t-state.lastActionAt>CHAIN_TIMEOUT)state.chain=0;if(action!==state.lastAction||t-state.lastActionAt>=110)state.chain++;state.lastAction=action;state.lastActionAt=t;state.chainPeak=Math.max(state.chainPeak,state.chain);window.dispatchEvent(new CustomEvent('relay:new-gameplay-chain',{detail:{chain:state.chain,action}}));save();}
function triggerNearMiss(){const t=now();if(t-state.lastNearMissAt<520)return;state.lastNearMissAt=t;state.nearMisses++;state.clutchUntil=t+180;window.dispatchEvent(new CustomEvent('relay:new-gameplay-near-miss-registered',{detail:{count:state.nearMisses}}));save();}
function registerClutch(){const t=now();if(t>state.clutchUntil)return;state.clutches++;state.clutchUntil=0;state.chain+=2;state.chainPeak=Math.max(state.chainPeak,state.chain);window.dispatchEvent(new CustomEvent('relay:new-gameplay-clutch-registered',{detail:{count:state.clutches,chain:state.chain}}));save();}
function onRunStart(){state.started=true;state.lastAction='';state.lastActionAt=0;state.chain=0;state.chainPeak=0;state.nearMisses=0;state.clutches=0;state.lastNearMissAt=0;state.clutchUntil=0;state.runStartedAt=now();save();}
function onRunFinish(){window.dispatchEvent(new CustomEvent('relay:new-gameplay-run-result',{detail:{chainPeak:state.chainPeak,nearMisses:state.nearMisses,clutches:state.clutches}}));save();}
function onPointerAction(event){const action=event.target?.closest?.('[data-mobile-action]')?.dataset?.mobileAction;if(action)registerAction(action);}
function onFeedback(kind){if(kind)registerAction(String(kind));}
function boot(){if(state.started)return;state.started=true;state.runStartedAt=now();document.addEventListener('pointerdown',onPointerAction,{capture:true,passive:true});window.addEventListener('relay:gameplay-core-ready',onRunStart);window.addEventListener('relay:new-gameplay-run-start',onRunStart);window.addEventListener('relay:new-gameplay-run-finish',onRunFinish);window.addEventListener('relay:new-gameplay-near-miss',triggerNearMiss);window.addEventListener('relay:new-gameplay-clutch',registerClutch);const runner=window.__relayRunnerScene||window.game?.scene?.getScene?.('runner');const events=runner?.game?.events;const onDash=()=>registerAction('dash');events?.on?.('dash-start',onDash);events?.on?.('feedback',onFeedback);runner?.events?.once?.('shutdown',()=>{events?.off?.('dash-start',onDash);events?.off?.('feedback',onFeedback);document.removeEventListener('pointerdown',onPointerAction,true);});save();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
export {state,registerAction};
