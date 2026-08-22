(() => {
  'use strict';
  if (window.__relayTutorialOnboardingV2) return;
  window.__relayTutorialOnboardingV2 = true;

  const COMPLETE_KEY = 'relay.runner.tutorial.onboarding-v2.complete';
  const STEP_KEY = 'relay.runner.tutorial.onboarding-v2.step';
  const state = { active:false, step:0, scene:null, completed:false, watcher:0, timers:[], startX:0, checkpointX:0, actionBaseline:0, lastBarrier:null };
  const steps = [
    { id:'move', title:'MOVE THE LINE', text:'Run forward through the first marker. The lesson advances only after real movement.', key:'MOVE' },
    { id:'jump', title:'CLEAR THE GAP', text:'Clear the rooftop break. The lesson advances only after an actual airborne jump.', key:'SPACE / JUMP' },
    { id:'dash', title:'BREAK THROUGH', text:'Build speed and dash into the marked barrier. The barrier must break before the route opens.', key:'SHIFT / DASH' },
    { id:'action', title:'DEFEND THE RELAY', text:'Use the route action and clear the nearby threat. Input alone does not complete this lesson.', key:'Q / SWORD' },
    { id:'route', title:'REACH THE TRAINING BEACON', text:'Follow the route to the cyan handoff beacon. Training ends only when you physically reach it.', key:'→ BEACON' }
  ];

  const root = document.createElement('section');
  root.id = 'relayTutorialOnboardingV2'; root.hidden = true;
  root.innerHTML = `<div class="tutorial-map" aria-hidden="true"><div class="tutorial-map-head"><span>TRAINING ROUTE</span><b>01 / 05</b></div><div class="tutorial-route"><i></i><span data-step="0"></span><span data-step="1"></span><span data-step="2"></span><span data-step="3"></span><span data-step="4"></span></div></div><div class="tutorial-card"><p class="tutorial-kicker">FIRST DELIVERY · OLD QUARTER</p><h2></h2><p class="tutorial-copy"></p><div class="tutorial-key"></div><div class="tutorial-progress"></div></div><div class="tutorial-cinema" hidden><p>TRAINING COMPLETE</p><h2>THE CITY IS LIVE.</h2><span>Orientation link closed. Follow the gold signals and complete your first real delivery.</span></div>`;
  document.body.appendChild(root);
  const style = document.createElement('style');
  style.textContent = `#relayTutorialOnboardingV2{position:fixed;inset:0;z-index:880;pointer-events:none;color:#eafcff;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}#relayTutorialOnboardingV2[hidden]{display:none!important}#relayTutorialOnboardingV2 .tutorial-map{position:absolute;left:max(18px,env(safe-area-inset-left));top:max(18px,env(safe-area-inset-top));width:min(330px,calc(100vw - 36px));padding:14px 16px;border:1px solid rgba(96,238,255,.28);border-radius:16px;background:linear-gradient(145deg,rgba(5,18,32,.94),rgba(2,7,15,.94));box-shadow:0 16px 50px rgba(0,0,0,.32),0 0 36px rgba(55,220,255,.08)}.tutorial-map-head{display:flex;justify-content:space-between;gap:12px;color:#8feeff;font-size:9px;font-weight:900;letter-spacing:.18em}.tutorial-route{position:relative;height:34px;margin-top:13px}.tutorial-route i{position:absolute;left:8%;right:8%;top:15px;height:2px;background:linear-gradient(90deg,rgba(79,241,255,.2),#67efff 40%,rgba(153,107,255,.35));box-shadow:0 0 12px rgba(83,233,255,.55)}.tutorial-route span{position:absolute;top:8px;width:14px;height:14px;border-radius:50%;border:2px solid rgba(126,244,255,.55);background:#071522}.tutorial-route span:nth-of-type(1){left:7%}.tutorial-route span:nth-of-type(2){left:27%}.tutorial-route span:nth-of-type(3){left:47%}.tutorial-route span:nth-of-type(4){left:67%}.tutorial-route span:nth-of-type(5){left:87%}.tutorial-route span.done{background:#78f7ff;box-shadow:0 0 16px rgba(112,241,255,.8)}.tutorial-route span.active{transform:scale(1.28);border-color:#fff;background:#9b7bff;box-shadow:0 0 22px rgba(155,123,255,.9)}#relayTutorialOnboardingV2 .tutorial-card{position:absolute;left:50%;bottom:max(8%,calc(env(safe-area-inset-bottom) + 28px));transform:translateX(-50%);width:min(640px,calc(100vw - 32px));padding:20px 24px;border:1px solid rgba(113,241,255,.32);border-radius:20px;background:linear-gradient(145deg,rgba(8,23,40,.96),rgba(2,7,15,.98));box-shadow:0 28px 80px rgba(0,0,0,.48),0 0 48px rgba(73,222,255,.1);text-align:center}.tutorial-kicker{margin:0 0 8px;color:#79edff;font-size:9px;font-weight:900;letter-spacing:.24em}.tutorial-card h2{margin:0;color:#f4fbff;font-size:clamp(22px,4vw,42px);letter-spacing:.04em}.tutorial-copy{max-width:500px;margin:12px auto;color:#c7d9e7;font-size:13px;line-height:1.5}.tutorial-key{display:inline-flex;margin-top:4px;padding:7px 11px;border:1px solid rgba(144,237,255,.26);border-radius:8px;background:#071321;color:#9af5ff;font-size:10px;font-weight:900;letter-spacing:.16em}.tutorial-progress{display:flex;justify-content:center;gap:5px;margin-top:16px}.tutorial-progress i{width:28px;height:3px;background:rgba(134,183,205,.18)}.tutorial-progress i.done{background:#71efff;box-shadow:0 0 10px rgba(113,239,255,.7)}.tutorial-progress i.active{background:#a77cff}#relayTutorialOnboardingV2 .tutorial-cinema{position:absolute;inset:0;display:grid;place-content:center;padding:30px;background:radial-gradient(circle at center,rgba(24,99,125,.28),rgba(2,5,12,.94) 70%);text-align:center;animation:tutorialCinema .8s ease both}.tutorial-cinema p{margin:0 0 14px;color:#75efff;font-size:10px;font-weight:900;letter-spacing:.28em}.tutorial-cinema h2{margin:0;color:#fff;font-size:clamp(38px,8vw,90px);line-height:.95;letter-spacing:-.04em}.tutorial-cinema span{margin-top:18px;color:#c4d6e5;font-size:13px}@keyframes tutorialCinema{from{opacity:0;filter:blur(8px)}to{opacity:1;filter:none}}@media(max-width:700px){#relayTutorialOnboardingV2 .tutorial-map{top:max(10px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);width:min(92vw,390px)}#relayTutorialOnboardingV2 .tutorial-card{bottom:max(18px,env(safe-area-inset-bottom));padding:16px 14px;width:min(92vw,640px)}.tutorial-copy{font-size:12px}}`;
  document.head.appendChild(style);

  const el = sel => root.querySelector(sel);
  const firstMission = scene => (scene?.mission?.id || scene?.missionId || 'first-delivery') === 'first-delivery';
  const persist = () => { if (state.active) sessionStorage.setItem(STEP_KEY, String(state.step)); };
  const showStep = () => { const current = steps[state.step]; if (!current) return; root.hidden=false; root.classList.add('active'); el('.tutorial-card h2').textContent=current.title; el('.tutorial-copy').textContent=current.text; el('.tutorial-key').textContent=current.key; el('.tutorial-map-head b').textContent=`${String(state.step+1).padStart(2,'0')} / 05`; root.querySelectorAll('.tutorial-route span').forEach((node,index)=>node.className=index<state.step?'done':index===state.step?'active':''); el('.tutorial-progress').innerHTML=steps.map((_,index)=>`<i class="${index<state.step?'done':index===state.step?'active':''}"></i>`).join(''); persist(); };
  const nearestBarrier = scene => scene?.barriers?.getChildren?.().filter(barrier => barrier?.active).sort((a,b)=>Math.abs(a.x-scene.player.x)-Math.abs(b.x-scene.player.x))[0] || null;
  const next = () => { if(!state.active) return; state.step++; if(state.step>=steps.length) cinematic(); else showStep(); };
  const complete = id => { if(state.active && steps[state.step]?.id===id) next(); };
  const cinematic = () => {
    if (state.completed) return;
    state.active=false; cancelAnimationFrame(state.watcher); sessionStorage.removeItem(STEP_KEY);
    root.querySelector('.tutorial-card').hidden=true; root.querySelector('.tutorial-map').hidden=true;
    const cinema=el('.tutorial-cinema'); cinema.hidden=false;
    let unlocked=false;
    const unlock = () => { if(unlocked) return; unlocked=true; window.dispatchEvent(new Event('relay:cinematic-unlock')); cinema.hidden=true; root.hidden=true; state.completed=true; sessionStorage.setItem(COMPLETE_KEY,'1'); window.dispatchEvent(new CustomEvent('relay:tutorial-complete',{detail:{scene:state.scene}})); };
    window.dispatchEvent(new Event('relay:cinematic-lock'));
    state.timers.push(setTimeout(unlock,2600));
    state.timers.push(setTimeout(unlock,4200));
  };
  const updateCheckpoint = scene => {
    const checkpoints = scene?.checkpoints?.getChildren?.() || [];
    const reached = checkpoints.filter(marker => marker.active && marker.x <= scene.player.x + 10).sort((a,b)=>b.x-a.x)[0];
    if (reached && reached.x > state.checkpointX) { state.checkpointX=reached.x; persist(); }
  };
  const tryBreakTutorialBarrier = scene => {
    const barrier = nearestBarrier(scene); if (!barrier || !barrier.active) return false;
    const body=scene.player?.body; if(!body) return false;
    const close=Math.abs(barrier.x-scene.player.x)<70 && Math.abs(barrier.y-scene.player.y)<90;
    const dashSpeed=Math.abs(body.velocity.x)>=560;
    if(!close||!dashSpeed) return false;
    const burst=scene.add?.circle?.(barrier.x,barrier.y,18,0x8df4ff,.85)?.setDepth(14);
    scene.tweens?.add?.({targets:burst,scale:4,alpha:0,duration:260,onComplete:()=>burst?.destroy()});
    barrier.disableBody(true,true); state.lastBarrier=barrier; scene.game?.events?.emit?.('tutorial-break',barrier); return true;
  };
  const watchGameplay = () => {
    const scene=state.scene; const player=scene?.player; const body=player?.body;
    if(!state.active || !scene || !player || !body) { if(state.active) state.watcher=requestAnimationFrame(watchGameplay); return; }
    updateCheckpoint(scene);
    if(state.step===0 && Math.abs(player.x-state.startX)>=110) complete('move');
    else if(state.step===1 && !body.blocked.down && body.velocity.y < -140 && player.x >= state.startX+70) complete('jump');
    else if(state.step===2 && tryBreakTutorialBarrier(scene)) complete('dash');
    else if(state.step===3 && Number(scene.enemyDefeats||0)>state.actionBaseline) complete('action');
    else if(state.step===4 && player.x >= (scene.mission?.tutorialHandoffX || 1840)) complete('route');
    if(state.active) state.watcher=requestAnimationFrame(watchGameplay);
  };
  const begin = scene => {
    if(state.active||state.completed||sessionStorage.getItem(COMPLETE_KEY)==='1'||!firstMission(scene)) return;
    state.scene=scene; state.startX=scene.player?.x || scene.mission?.spawn?.x || 0; state.checkpointX=state.startX; state.actionBaseline=Number(scene.enemyDefeats||0);
    const saved=Number.parseInt(sessionStorage.getItem(STEP_KEY)||'0',10); state.step=Number.isInteger(saved)&&saved>=0&&saved<steps.length?saved:0;
    state.active=true; showStep(); state.watcher=requestAnimationFrame(watchGameplay);
  };
  window.addEventListener('relay:runner-scene-ready',event=>begin(event.detail?.scene));
})();