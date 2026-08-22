(() => {
  'use strict';
  if (window.__relayTutorialOnboardingV2) return;
  window.__relayTutorialOnboardingV2 = true;

  const KEY = 'relay.runner.tutorial.onboarding-v2.complete';
  const state = { active:false, step:0, scene:null, completed:false, timers:[] };
  const steps = [
    { id:'move', title:'MOVE THE LINE', text:'Use A / D or the movement stick. Follow the cyan route to the first marker.', key:'A  D' },
    { id:'jump', title:'CLEAR THE GAP', text:'Jump once with SPACE or JUMP to clear the rooftop break.', key:'SPACE' },
    { id:'dash', title:'BREAK THROUGH', text:'Dash with SHIFT or DASH. Use momentum near a breakable barrier.', key:'SHIFT' },
    { id:'action', title:'DEFEND THE RELAY', text:'Use your equipped action once: SWORD or FIRE.', key:'Q / E' },
    { id:'route', title:'FOLLOW THE BEACON', text:'The training route is complete. Reach the beacon to begin the live delivery.', key:'→ BEACON' }
  ];

  const root = document.createElement('section');
  root.id = 'relayTutorialOnboardingV2';
  root.hidden = true;
  root.innerHTML = `<div class="tutorial-map" aria-hidden="true"><div class="tutorial-map-head"><span>TRAINING ROUTE</span><b>01 / 05</b></div><div class="tutorial-route"><i></i><span data-step="0"></span><span data-step="1"></span><span data-step="2"></span><span data-step="3"></span><span data-step="4"></span></div></div><div class="tutorial-card"><p class="tutorial-kicker">FIRST DELIVERY · OLD QUARTER</p><h2></h2><p class="tutorial-copy"></p><div class="tutorial-key"></div><div class="tutorial-progress"></div></div><div class="tutorial-cinema" hidden><p>TRAINING LINK STABLE</p><h2>THE CITY IS LIVE.</h2><span>Delivery control transferred. Follow the beacon.</span></div>`;
  document.body.appendChild(root);

  const style = document.createElement('style');
  style.textContent = `
#relayTutorialOnboardingV2{position:fixed;inset:0;z-index:880;pointer-events:none;color:#eafcff;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
#relayTutorialOnboardingV2[hidden]{display:none!important}
#relayTutorialOnboardingV2 .tutorial-map{position:absolute;left:max(18px,env(safe-area-inset-left));top:max(18px,env(safe-area-inset-top));width:min(330px,calc(100vw - 36px));padding:14px 16px;border:1px solid rgba(96,238,255,.28);border-radius:16px;background:linear-gradient(145deg,rgba(5,18,32,.94),rgba(2,7,15,.94));box-shadow:0 16px 50px rgba(0,0,0,.32),0 0 36px rgba(55,220,255,.08)}
.tutorial-map-head{display:flex;justify-content:space-between;gap:12px;color:#8feeff;font-size:9px;font-weight:900;letter-spacing:.18em}.tutorial-route{position:relative;height:34px;margin-top:13px}.tutorial-route i{position:absolute;left:8%;right:8%;top:15px;height:2px;background:linear-gradient(90deg,rgba(79,241,255,.2),#67efff 40%,rgba(153,107,255,.35));box-shadow:0 0 12px rgba(83,233,255,.55)}.tutorial-route span{position:absolute;top:8px;width:14px;height:14px;border-radius:50%;border:2px solid rgba(126,244,255,.55);background:#071522;box-shadow:0 0 0 4px rgba(95,232,255,.05)}.tutorial-route span:nth-of-type(1){left:7%}.tutorial-route span:nth-of-type(2){left:27%}.tutorial-route span:nth-of-type(3){left:47%}.tutorial-route span:nth-of-type(4){left:67%}.tutorial-route span:nth-of-type(5){left:87%}.tutorial-route span.done{background:#78f7ff;box-shadow:0 0 16px rgba(112,241,255,.8)}.tutorial-route span.active{transform:scale(1.28);border-color:#fff;background:#9b7bff;box-shadow:0 0 22px rgba(155,123,255,.9)}
#relayTutorialOnboardingV2 .tutorial-card{position:absolute;left:50%;bottom:max(8%,calc(env(safe-area-inset-bottom) + 28px));transform:translateX(-50%);width:min(640px,calc(100vw - 32px));padding:20px 24px;border:1px solid rgba(113,241,255,.32);border-radius:20px;background:linear-gradient(145deg,rgba(8,23,40,.96),rgba(2,7,15,.98));box-shadow:0 28px 80px rgba(0,0,0,.48),0 0 48px rgba(73,222,255,.1);text-align:center}.tutorial-kicker{margin:0 0 8px;color:#79edff;font-size:9px;font-weight:900;letter-spacing:.24em}.tutorial-card h2{margin:0;color:#f4fbff;font-size:clamp(22px,4vw,42px);letter-spacing:.04em}.tutorial-copy{max-width:500px;margin:12px auto;color:#c7d9e7;font-size:13px;line-height:1.5}.tutorial-key{display:inline-flex;margin-top:4px;padding:7px 11px;border:1px solid rgba(144,237,255,.26);border-radius:8px;background:#071321;color:#9af5ff;font-size:10px;font-weight:900;letter-spacing:.16em}.tutorial-progress{display:flex;justify-content:center;gap:5px;margin-top:16px}.tutorial-progress i{width:28px;height:3px;background:rgba(134,183,205,.18)}.tutorial-progress i.done{background:#71efff;box-shadow:0 0 10px rgba(113,239,255,.7)}.tutorial-progress i.active{background:#a77cff}
#relayTutorialOnboardingV2 .tutorial-cinema{position:absolute;inset:0;display:grid;place-content:center;padding:30px;background:radial-gradient(circle at center,rgba(24,99,125,.28),rgba(2,5,12,.94) 70%);text-align:center;animation:tutorialCinema .8s ease both}.tutorial-cinema p{margin:0 0 14px;color:#75efff;font-size:10px;font-weight:900;letter-spacing:.28em}.tutorial-cinema h2{margin:0;color:#fff;font-size:clamp(38px,8vw,90px);line-height:.95;letter-spacing:-.04em}.tutorial-cinema span{margin-top:18px;color:#c4d6e5;font-size:13px}@keyframes tutorialCinema{from{opacity:0;filter:blur(8px)}to{opacity:1;filter:none}}
@media(max-width:700px){#relayTutorialOnboardingV2 .tutorial-map{top:max(10px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);width:min(92vw,390px)}#relayTutorialOnboardingV2 .tutorial-card{bottom:max(18px,env(safe-area-inset-bottom));padding:16px 14px;width:min(92vw,640px)}.tutorial-copy{font-size:12px}}
@media(prefers-reduced-motion:reduce){#relayTutorialOnboardingV2 *{animation:none!important;transition:none!important}}
`;
  document.head.appendChild(style);

  const el = sel => root.querySelector(sel);
  const sceneReady = () => window.__relayRunnerScene;
  const missionIsFirst = scene => {
    const id = scene?.missionId || scene?.mission?.id || window.__relayMissionId || '';
    return !id || id === 'first-delivery';
  };
  const showStep = () => {
    const current = steps[state.step]; if (!current) return;
    root.hidden = false; root.classList.add('active');
    el('.tutorial-card h2').textContent = current.title;
    el('.tutorial-copy').textContent = current.text;
    el('.tutorial-key').textContent = current.key;
    el('.tutorial-map-head b').textContent = `${String(state.step + 1).padStart(2,'0')} / ${String(steps.length).padStart(2,'0')}`;
    root.querySelectorAll('.tutorial-route span').forEach((node,index)=>node.className=index<state.step?'done':index===state.step?'active':'');
    const progress = el('.tutorial-progress'); progress.innerHTML = steps.map((_,index)=>`<i class="${index<state.step?'done':index===state.step?'active':''}"></i>`).join('');
    window.dispatchEvent(new CustomEvent('relay:tutorial-step',{detail:{index:state.step,id:current.id,scene:state.scene}}));
  };
  const next = () => {
    if (!state.active) return;
    state.step += 1;
    if (state.step >= steps.length) { cinematic(); return; }
    showStep();
  };
  const complete = id => { if (state.active && steps[state.step]?.id === id) next(); };
  const cinematic = () => {
    state.active = false;
    root.querySelector('.tutorial-card').hidden = true; root.querySelector('.tutorial-map').hidden = true;
    const cinema = el('.tutorial-cinema'); cinema.hidden = false;
    window.dispatchEvent(new Event('relay:cinematic-lock'));
    state.timers.push(setTimeout(()=>{
      window.dispatchEvent(new Event('relay:cinematic-unlock'));
      cinema.hidden = true; root.hidden = true; state.completed = true; sessionStorage.setItem(KEY,'1');
      window.dispatchEvent(new CustomEvent('relay:tutorial-complete',{detail:{scene:state.scene}}));
    },2600));
  };
  const begin = scene => {
    if (state.active || state.completed || sessionStorage.getItem(KEY)==='1' || !missionIsFirst(scene)) return;
    state.scene = scene || sceneReady(); state.step=0; state.active=true; showStep();
  };
  window.addEventListener('relay:runner-scene-ready',event=>begin(event.detail?.scene));
  window.addEventListener('keydown',event=>{
    if (!state.active) return;
    const key=event.key.toLowerCase();
    if ((key==='a'||key==='d'||key==='arrowleft'||key==='arrowright') && state.step===0) complete('move');
    else if ((key===' '||key==='spacebar') && state.step===1) complete('jump');
    else if (key==='shift' && state.step===2) complete('dash');
    else if ((key==='q'||key==='e') && state.step===3) complete('action');
  },true);
  document.addEventListener('click',event=>{
    const action=event.target.closest('[data-mobile-action]')?.dataset.mobileAction;
    if (!action) return;
    if (state.step===0 && action==='move') complete('move');
    if (state.step===1 && action==='jump') complete('jump');
    if (state.step===2 && action==='dash') complete('dash');
    if (state.step===3 && (action==='sword'||action==='fire')) complete('action');
  },true);
  window.addEventListener('relay:mission-complete',()=>{ if(state.active && steps[state.step]?.id==='route') next(); });
  if (sceneReady()) begin(sceneReady());
})();
