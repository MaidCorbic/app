// NEW GAMEPLAY LAYER V2
// Browser-safe, additive gameplay feel layer. No Phaser/scene imports.
// The layer stays dormant until real gameplay starts; tutorial completion alone never activates it.

const ROOT_ID = 'relay-gameplay-new-layer';
const STYLE_ID = 'relay-gameplay-new-layer-v2-style';
const GHOST_KEY = 'relay.runner.ghost.v2';
const CHAIN_TIMEOUT = 1450;
const CHOICE_COOLDOWN = 12000;
const CLUTCH_WINDOW = 180;
const TUTORIAL_COMPLETE_KEY = 'relay.runner.tutorial.onboarding-v3.complete';

const state = {
  started: false,
  listenersInstalled: false,
  lastAction: '',
  lastActionAt: 0,
  chain: 0,
  chainPeak: 0,
  nearMisses: 0,
  clutches: 0,
  peakSpeed: 0,
  lastNearMissAt: 0,
  clutchUntil: 0,
  choiceVisible: false,
  choiceCooldownUntil: 0,
  runStartedAt: 0,
  path: [],
  ghost: null,
  ghostIndex: 0,
  timers: new Set(),
};

const now = () => performance.now();

function addTimer(fn, ms) {
  const id = window.setTimeout(() => { state.timers.delete(id); fn(); }, ms);
  state.timers.add(id);
  return id;
}

function tutorialActive() {
  const scene = window.__relayRunnerScene;
  if (document.body.classList.contains('relay-training-active')) return true;
  const onboarding = document.getElementById('relayTutorialOnboardingV3');
  if (onboarding && !onboarding.hidden) return true;
  return scene?.mission?.id === 'first-delivery' && scene?.firstTimeTutorial === true;
}

function tutorialComplete() {
  try { return sessionStorage.getItem(TUTORIAL_COMPLETE_KEY) === '1'; }
  catch { return false; }
}

function realGameplayActive() {
  if (tutorialActive()) return false;
  return Boolean(document.getElementById('play')?.classList.contains('gameplay-moving'));
}

function installStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
#${ROOT_ID}{position:fixed;inset:0;z-index:235;pointer-events:none;color:#eafcff;font-family:inherit}
#${ROOT_ID} .ng-chain{position:absolute;top:clamp(82px,10vh,116px);left:50%;transform:translate(-50%,-8px) scale(.96);opacity:0;text-align:center;transition:opacity .16s ease,transform .18s ease;text-shadow:0 0 18px rgba(80,220,255,.35)}
#${ROOT_ID} .ng-chain.show{opacity:1;transform:translate(-50%,0) scale(1)}
#${ROOT_ID} .ng-kicker{font-size:8px;letter-spacing:.28em;opacity:.65}.ng-value{font-size:32px;font-weight:900;line-height:1.05;margin-top:4px}.ng-value em{font-style:normal;font-size:11px;letter-spacing:.14em;margin-left:5px}
#${ROOT_ID} .ng-event{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%) scale(.9);opacity:0;font-size:15px;font-weight:900;letter-spacing:.16em;text-shadow:0 0 18px rgba(141,244,255,.75);transition:opacity .1s ease,transform .16s ease;white-space:nowrap}
#${ROOT_ID} .ng-event.show{opacity:1;transform:translate(-50%,-50%) scale(1)}
#${ROOT_ID} .ng-choice{position:absolute;left:50%;bottom:clamp(88px,12vh,126px);width:min(500px,calc(100vw - 28px));transform:translate(-50%,10px);opacity:0;pointer-events:none;transition:opacity .18s ease,transform .18s ease}
#${ROOT_ID} .ng-choice.show{opacity:1;transform:translate(-50%,0);pointer-events:auto}.ng-choice-title{text-align:center;font-size:8px;letter-spacing:.2em;opacity:.65;margin-bottom:7px}.ng-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
#${ROOT_ID} button{border:1px solid rgba(141,244,255,.3);border-radius:10px;background:linear-gradient(145deg,rgba(8,24,42,.96),rgba(3,10,20,.97));color:#eafcff;min-height:52px;padding:9px 11px;font:inherit;text-align:left;cursor:pointer;pointer-events:auto;box-shadow:0 8px 28px rgba(0,0,0,.28)}
#${ROOT_ID} button b{display:block;font-size:10px;letter-spacing:.12em}#${ROOT_ID} button small{display:block;margin-top:4px;font-size:8px;opacity:.55}
#${ROOT_ID} button:active{transform:scale(.98)}#${ROOT_ID} button:focus-visible{outline:2px solid rgba(141,244,255,.75);outline-offset:2px}
#${ROOT_ID} .ng-recap{position:absolute;right:12px;top:50%;transform:translateY(-50%) translateX(12px);width:min(180px,calc(100vw - 24px));padding:11px;border:1px solid rgba(141,244,255,.18);border-radius:10px;background:rgba(3,10,20,.9);opacity:0;transition:opacity .2s ease,transform .2s ease}
#${ROOT_ID} .ng-recap.show{opacity:1;transform:translateY(-50%) translateX(0)}.ng-title{font-size:9px;letter-spacing:.2em;margin-bottom:8px}.ng-row{display:flex;justify-content:space-between;font-size:8px;letter-spacing:.08em;margin:5px 0;opacity:.7}.ng-row b{opacity:1}
@media(max-width:520px){#${ROOT_ID} .ng-chain{top:92px}#${ROOT_ID} .ng-event{top:38%}#${ROOT_ID} .ng-choice{bottom:108px}#${ROOT_ID} .ng-recap{right:8px;width:165px}}
@media(prefers-reduced-motion:reduce){#${ROOT_ID} *{transition:none!important}}
`;
  document.head.appendChild(style);
}

function mount() {
  if (document.getElementById(ROOT_ID)) return document.getElementById(ROOT_ID);
  installStyle();
  const root = document.createElement('div');
  root.id = ROOT_ID;
  root.hidden = true;
  root.innerHTML = `
    <div class="ng-chain"><div class="ng-kicker">MOMENTUM CHAIN</div><div class="ng-value">0<em>x FLOW</em></div></div>
    <div class="ng-event" aria-live="polite"></div>
    <div class="ng-choice"><div class="ng-choice-title">MICRO DECISION // CHOOSE YOUR LINE</div><div class="ng-grid"><button type="button" data-ng-choice="overdrive"><b>OVERDRIVE</b><small>HIGH SPEED · HIGH RISK</small></button><button type="button" data-ng-choice="recovery"><b>RECOVERY</b><small>SAFE FLOW · CLUTCH BUFFER</small></button></div></div>
    <div class="ng-recap"><div class="ng-title">RUN RECAP</div><div class="ng-row"><span>CHAIN PEAK</span><b data-ng="chain">0x</b></div><div class="ng-row"><span>NEAR MISS</span><b data-ng="near">0</b></div><div class="ng-row"><span>CLUTCH</span><b data-ng="clutch">0</b></div><div class="ng-row"><span>PEAK SPEED</span><b data-ng="speed">0</b></div></div>`;
  document.body.appendChild(root);
  root.querySelectorAll('[data-ng-choice]').forEach(button => button.addEventListener('click', () => choose(button.dataset.ngChoice)));
  return root;
}

function root(){ return document.getElementById(ROOT_ID); }
function hideLayer(){ const r=root(); if(!r)return; r.hidden=true; r.querySelector('.ng-chain')?.classList.remove('show'); r.querySelector('.ng-event')?.classList.remove('show'); r.querySelector('.ng-choice')?.classList.remove('show'); r.querySelector('.ng-recap')?.classList.remove('show'); }
function showLayer(){ mount().hidden=false; }
function clearTimers(){ state.timers.forEach(id=>window.clearTimeout(id)); state.timers.clear(); }

function eventText(text){
  if(!state.started || tutorialActive())return;
  const el=root()?.querySelector('.ng-event'); if(!el)return;
  el.textContent=text; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  addTimer(()=>el.classList.remove('show'),620);
}

function updateChain(){
  const el=root()?.querySelector('.ng-chain'); if(!el)return;
  el.querySelector('.ng-value').innerHTML=`${state.chain}<em>x FLOW</em>`;
  el.classList.toggle('show',state.started && !tutorialActive() && state.chain>0);
}

function updateRecap(){
  const r=root(); if(!r)return;
  r.querySelector('[data-ng="chain"]').textContent=`${state.chainPeak}x`;
  r.querySelector('[data-ng="near"]').textContent=state.nearMisses;
  r.querySelector('[data-ng="clutch"]').textContent=state.clutches;
  r.querySelector('[data-ng="speed"]').textContent=Math.round(state.peakSpeed);
}

function resetRun(){
  if(tutorialActive() || !tutorialComplete()){ suspendRun(); return; }
  state.started=true; state.lastAction=''; state.lastActionAt=0; state.chain=0; state.chainPeak=0; state.nearMisses=0; state.clutches=0; state.peakSpeed=0; state.lastNearMissAt=0; state.clutchUntil=0; state.choiceVisible=false; state.choiceCooldownUntil=now()+6500; state.runStartedAt=now(); state.path=[]; state.ghost=loadGhost(); state.ghostIndex=0;
  showLayer(); updateChain(); updateRecap(); root()?.querySelector('.ng-choice')?.classList.remove('show'); root()?.querySelector('.ng-recap')?.classList.remove('show');
}

function suspendRun(){
  clearTimers(); state.started=false; state.choiceVisible=false; state.lastAction=''; state.lastActionAt=0; state.chain=0; state.chainPeak=0; state.nearMisses=0; state.clutches=0; state.peakSpeed=0; state.clutchUntil=0; state.choiceCooldownUntil=0; hideLayer();
}

function registerAction(action){
  if(!state.started || tutorialActive())return;
  const t=now(); if(t-state.lastActionAt>CHAIN_TIMEOUT)state.chain=0; if(action!==state.lastAction)state.chain+=1;
  state.lastAction=action; state.lastActionAt=t; state.chainPeak=Math.max(state.chainPeak,state.chain); updateChain();
  if(state.chain>=3 && state.chain%3===0)eventText(`${state.chain}x FLOW`);
}

function triggerNearMiss(){
  if(!state.started || tutorialActive())return;
  const t=now(); if(t-state.lastNearMissAt<520)return;
  state.lastNearMissAt=t; state.nearMisses+=1; state.clutchUntil=t+CLUTCH_WINDOW; eventText('NEAR MISS'); updateRecap();
  const play=document.getElementById('play'); play?.classList.add('gameplay-near-miss'); addTimer(()=>play?.classList.remove('gameplay-near-miss'),180);
}

function registerClutch(){
  if(!state.started || tutorialActive())return;
  const t=now(); if(t>state.clutchUntil)return;
  state.clutches+=1; state.clutchUntil=0; state.chain+=2; state.chainPeak=Math.max(state.chainPeak,state.chain); eventText('CLUTCH'); updateChain(); updateRecap();
}

function choose(kind){
  if(!state.choiceVisible || tutorialActive())return;
  state.choiceVisible=false; state.choiceCooldownUntil=now()+CHOICE_COOLDOWN; root()?.querySelector('.ng-choice')?.classList.remove('show'); eventText(kind==='overdrive'?'OVERDRIVE':'RECOVERY LINE'); window.dispatchEvent(new CustomEvent('relay:new-gameplay-choice',{detail:{choice:kind}}));
}

function maybeChoice(){
  if(!state.started || tutorialActive() || !realGameplayActive())return;
  const t=now(); if(state.choiceVisible || t<state.choiceCooldownUntil || t-state.runStartedAt<8000)return;
  if(Math.random()>0.0015)return;
  state.choiceVisible=true; root()?.querySelector('.ng-choice')?.classList.add('show');
}

function recordGhost(){if(state.path.length<12)return;try{localStorage.setItem(`${GHOST_KEY}.${location.pathname}`,JSON.stringify(state.path.slice(-520)));}catch{}}
function loadGhost(){try{const raw=localStorage.getItem(`${GHOST_KEY}.${location.pathname}`);return raw?JSON.parse(raw):null;}catch{return null;}}

function actionFromKey(event){
  if(event.repeat||event.altKey||event.ctrlKey||event.metaKey)return null;
  if(event.code==='Space'||/^ArrowUp$/i.test(event.key)||/^w$/i.test(event.key))return 'jump';
  if(event.key==='Shift')return 'dash';
  if(/^ArrowLeft$/i.test(event.key)||/^a$/i.test(event.key))return 'left';
  if(/^ArrowRight$/i.test(event.key)||/^d$/i.test(event.key))return 'right';
  return null;
}

function start(){
  if(state.listenersInstalled)return;
  state.listenersInstalled=true; mount(); hideLayer();

  document.addEventListener('keydown',e=>{
    const action=actionFromKey(e); if(!action || tutorialActive())return;
    if(!state.started && realGameplayActive())resetRun();
    if(state.started){registerAction(action); if(action==='dash')window.dispatchEvent(new CustomEvent('relay:new-gameplay-dash')); if(action==='jump')window.dispatchEvent(new CustomEvent('relay:new-gameplay-jump'));}
  },true);

  document.addEventListener('pointerdown',e=>{
    const button=e.target.closest?.('[data-mobile-action]'); if(!button || tutorialActive())return;
    if(!state.started && realGameplayActive())resetRun();
    if(state.started)registerAction(button.dataset.mobileAction||'action');
  },true);

  window.addEventListener('relay:gameplay-core-ready',()=>{if(tutorialActive())suspendRun();});
  window.addEventListener('relay:new-gameplay-near-miss',triggerNearMiss);
  window.addEventListener('relay:new-gameplay-clutch',registerClutch);
  window.addEventListener('relay:new-gameplay-run-start',()=>{if(!tutorialActive())resetRun();});
  window.addEventListener('relay:new-gameplay-run-finish',()=>{if(!state.started)return;recordGhost();updateRecap();root()?.querySelector('.ng-recap')?.classList.add('show');});

  const suspendForTutorial=()=>suspendRun();
  window.addEventListener('relay:runner-scene-ready',suspendForTutorial,{passive:true});
  window.addEventListener('relay:tutorial-step',suspendForTutorial,{passive:true});
  window.addEventListener('relay:cinematic-lock',suspendForTutorial,{passive:true});
  window.addEventListener('relay:tutorial-complete',suspendForTutorial,{passive:true});

  const tick=()=>{
    if(tutorialActive()){suspendRun();}
    else if(!state.started && tutorialComplete() && realGameplayActive()){resetRun();}
    if(state.started){maybeChoice(); const play=document.getElementById('play'); if(play?.classList.contains('gameplay-moving'))state.peakSpeed=Math.max(state.peakSpeed,1); updateRecap();}
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
