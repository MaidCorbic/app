(() => {
  'use strict';
  if (window.__relayTutorialOnboardingV3) return;
  window.__relayTutorialOnboardingV3 = true;

  const COMPLETE_KEY = 'relay.runner.tutorial.onboarding-v3.complete';
  const STEP_KEY = 'relay.runner.tutorial.onboarding-v3.step';
  const hasCompleted = () => {
    try { return localStorage.getItem(COMPLETE_KEY) === '1'; } catch { return false; }
  };
  const markCompleted = () => {
    try { localStorage.setItem(COMPLETE_KEY, '1'); localStorage.removeItem(STEP_KEY); } catch {}
  };

  const state = { active:false, step:0, scene:null, completed:hasCompleted(), startX:0, actionBaseline:0, watcher:0, marker:null, timers:new Set() };
  const steps = [
    { id:'move', title:'MOVE THE LINE', copy:'Run through the first route marker. This step advances from real player movement.', key:'A / D  MOVE' },
    { id:'jump', title:'CLEAR THE GAP', copy:'Reach the rooftop break and make a real jump. The step completes only while airborne.', key:'SPACE  JUMP' },
    { id:'dash', title:'BREAK THROUGH', copy:'Approach the highlighted barrier and dash through it. The barrier will physically collapse.', key:'SHIFT  DASH' },
    { id:'action', title:'DEFEND THE RELAY', copy:'Perform the real route action and clear the nearby threat. A button press alone is not enough.', key:'Q / E  ACTION' },
    { id:'route', title:'REACH THE TRAINING BEACON', copy:'Follow the cyan route marker to the handoff point. Then the live game begins.', key:'FOLLOW THE BEACON' }
  ];

  const root = document.createElement('section');
  root.id = 'relayTutorialOnboardingV3';
  root.hidden = true;
  root.innerHTML = `
    <div class="training-map"><div><span>TRAINING ROUTE</span><b>01 / 05</b></div><div class="training-track"><i></i><span></span><span></span><span></span><span></span><span></span></div></div>
    <div class="training-card"><small>FIRST DELIVERY · OLD QUARTER</small><h2></h2><p></p><kbd></kbd><div class="training-progress"></div></div>
    <div class="training-cinema" hidden><div class="training-cinema-card"><small>TRAINING COMPLETE</small><div class="line"></div><h2>THE CITY<br><em>IS LIVE.</em></h2><p>Your first real delivery is now active.</p><span>FOLLOW THE GOLD SIGNALS · DELIVERY CONTROL TRANSFERRED</span></div></div>`;
  document.body.appendChild(root);

  const style = document.createElement('style');
  style.textContent = `
    #relayTutorialOnboardingV3{position:fixed;inset:0;z-index:2147483000;pointer-events:none;color:#eafcff;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
    #relayTutorialOnboardingV3[hidden],#relayTutorialOnboardingV3 [hidden]{display:none!important}
    #relayTutorialOnboardingV3 .training-map{position:absolute;top:max(16px,env(safe-area-inset-top));left:max(18px,env(safe-area-inset-left));width:min(360px,calc(100vw - 36px));padding:12px 14px;border:1px solid rgba(103,239,255,.28);border-radius:14px;background:rgba(3,13,25,.88);box-shadow:0 0 32px rgba(81,221,255,.08);backdrop-filter:blur(10px)}
    #relayTutorialOnboardingV3 .training-map>div:first-child{display:flex;justify-content:space-between;gap:10px;color:#86efff;font-size:9px;font-weight:900;letter-spacing:.2em}.training-track{position:relative;height:28px;margin-top:10px}.training-track i{position:absolute;left:7%;right:7%;top:13px;height:2px;background:linear-gradient(90deg,#66efff,#a77cff);box-shadow:0 0 14px rgba(89,227,255,.45)}.training-track span{position:absolute;top:7px;width:13px;height:13px;border:2px solid rgba(123,242,255,.52);border-radius:50%;background:#05121f}.training-track span:nth-of-type(1){left:6%}.training-track span:nth-of-type(2){left:26%}.training-track span:nth-of-type(3){left:46%}.training-track span:nth-of-type(4){left:66%}.training-track span:nth-of-type(5){left:86%}.training-track span.done{background:#73f0ff;box-shadow:0 0 18px rgba(115,240,255,.8)}.training-track span.active{background:#a67cff;border-color:#fff;transform:scale(1.25);box-shadow:0 0 20px rgba(166,124,255,.95)}
    #relayTutorialOnboardingV3 .training-card{position:absolute;left:50%;top:clamp(108px,16vh,180px);transform:translateX(-50%);width:min(500px,calc(100vw - 32px));max-height:min(210px,calc(100vh - 300px));padding:14px 18px;border:1px solid rgba(113,241,255,.28);border-radius:18px;background:linear-gradient(145deg,rgba(5,20,35,.94),rgba(2,8,16,.97));box-shadow:0 24px 70px rgba(0,0,0,.55),0 0 44px rgba(83,230,255,.09);text-align:center;backdrop-filter:blur(12px);overflow:hidden}
    .training-card small{display:block;color:#77ecff;font-size:8px;font-weight:900;letter-spacing:.24em}.training-card h2{margin:6px 0;color:#f4fbff;font-size:clamp(20px,3.2vw,31px);line-height:1;letter-spacing:.04em}.training-card p{max-width:440px;margin:0 auto;color:#c6d6e3;font-size:11px;line-height:1.35}.training-card kbd{display:inline-flex;margin-top:8px;padding:6px 9px;border:1px solid rgba(137,239,255,.24);border-radius:8px;background:#061321;color:#9af5ff;font:800 9px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.15em}.training-progress{display:flex;justify-content:center;gap:5px;margin-top:9px}.training-progress i{width:27px;height:3px;background:rgba(133,180,201,.18)}.training-progress i.done{background:#72efff;box-shadow:0 0 10px rgba(114,239,255,.7)}.training-progress i.active{background:#a87cff}
    #relayTutorialOnboardingV3 .training-cinema{position:absolute;inset:0;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at center,rgba(20,120,150,.18),rgba(1,5,12,.98) 66%);backdrop-filter:blur(14px);pointer-events:auto}.training-cinema-card{width:min(760px,92vw);padding:clamp(28px,5vw,56px);text-align:center;border:1px solid rgba(96,239,255,.28);border-radius:24px;background:linear-gradient(155deg,rgba(6,24,41,.91),rgba(2,7,15,.98));box-shadow:0 35px 120px rgba(0,0,0,.7),0 0 70px rgba(80,221,255,.12)}.training-cinema-card small{color:#73efff;font-size:10px;font-weight:900;letter-spacing:.3em}.training-cinema-card .line{width:110px;height:2px;margin:17px auto 22px;background:linear-gradient(90deg,transparent,#73efff,transparent);box-shadow:0 0 16px rgba(115,239,255,.7)}.training-cinema-card h2{margin:0;color:#f4fbff;font-size:clamp(44px,7vw,82px);line-height:.9;letter-spacing:-.05em}.training-cinema-card h2 em{font-style:normal;color:#ffd36f;text-shadow:0 0 28px rgba(255,211,111,.18)}.training-cinema-card p{margin:22px 0 0;color:#d1dfeb;font-size:14px}.training-cinema-card span{display:block;margin-top:16px;color:#7cefff;font-size:9px;font-weight:900;letter-spacing:.16em}
    body.relay-training-active #intro,body.relay-training-active #relayGameplayIntroFinalV2,body.relay-training-active .hud,body.relay-training-active .world-marker,body.relay-training-active .input-guide,body.relay-training-active .mobile-controls,body.relay-training-active #relay-gameplay-new-layer,body.relay-training-active #pauseMenu,body.relay-training-active #finish,body.relay-training-active #gameOver,body.relay-training-active #toast,body.relay-training-active #relayCityUpdateV1,body.relay-training-active #gameplayEventHud,body.relay-training-active #relayTimeIndicator,body.relay-training-active #signalNetworkV1,body.relay-training-active #cityResponseV1,body.relay-training-active #cityPulseCueV1,body.relay-training-active .mission-objective,body.relay-training-active [data-mission-objective]{display:none!important;visibility:hidden!important;pointer-events:none!important}
    body.relay-cinematic-active .hud,body.relay-cinematic-active .world-marker,body.relay-cinematic-active .input-guide,body.relay-cinematic-active .mobile-controls,body.relay-cinematic-active #pauseMenu,body.relay-cinematic-active #finish,body.relay-cinematic-active #gameOver,body.relay-cinematic-active #toast,body.relay-cinematic-active #relayCityUpdateV1,body.relay-cinematic-active #gameplayEventHud{display:none!important;visibility:hidden!important;pointer-events:none!important}
    @media(max-width:700px){#relayTutorialOnboardingV3 .training-map{left:50%;transform:translateX(-50%);top:max(10px,env(safe-area-inset-top));width:min(92vw,390px)}#relayTutorialOnboardingV3 .training-card{width:min(88vw,500px);top:clamp(106px,15vh,170px);max-height:min(200px,calc(100vh - 280px));padding:12px 14px}.training-card p{font-size:10.5px}.training-cinema-card{padding:28px 18px}.training-cinema-card h2{font-size:clamp(42px,12vw,64px)}.training-cinema-card p{font-size:12px}.training-cinema-card span{font-size:8px;line-height:1.5}}
    @media(max-height:560px){#relayTutorialOnboardingV3 .training-card{top:96px!important;max-height:170px!important}.training-card h2{font-size:20px!important}}
  `;
  document.head.appendChild(style);

  const q = selector => root.querySelector(selector);
  const firstMission = scene => (scene?.mission?.id || scene?.missionId || '') === 'first-delivery';
  const setTrainingMode = enabled => document.body.classList.toggle('relay-training-active', enabled);
  const setCinematicMode = enabled => document.body.classList.toggle('relay-cinematic-active', enabled);
  const persistStep = () => { if (state.active) { try { sessionStorage.setItem(STEP_KEY,String(state.step)); } catch {} } };
  const clearMarker = () => { state.marker?.destroy?.(); state.marker = null; };
  const nearestTargetBarrier = (scene, direction=1) => {
    const px=scene?.player?.x ?? 0, py=scene?.player?.y ?? 0;
    return (scene?.barriers?.getChildren?.()||[]).filter(b=>b?.active).map(b=>({b,dx:(b.x-px)*direction,dy:Math.abs(b.y-py)})).filter(x=>x.dx>=0&&x.dx<=520&&x.dy<=190).sort((a,b)=>a.dx-b.dx)[0]?.b || null;
  };
  const armMarker = scene => {
    clearMarker();
    const p=scene?.player; if(!p) return;
    const dir=Math.sign(p.body?.velocity?.x||0)||(p.flipX?-1:1); const barrier=nearestTargetBarrier(scene,dir); if(!barrier) return;
    state.marker=scene.add?.circle?.(barrier.x,barrier.y,34,0x8df4ff,.08)?.setStrokeStyle?.(3,0x8df4ff,.9).setDepth?.(13);
    if(state.marker){ state.marker.setData?.('tutorialMarker',true); scene.tweens?.add?.({targets:state.marker,scale:{from:.8,to:1.2},alpha:{from:.85,to:.25},duration:500,yoyo:true,repeat:-1}); }
  };
  const showStep = () => {
    const step=steps[state.step]; if(!step) return;
    root.hidden=false; q('.training-card').hidden=false; q('.training-map').hidden=false; q('.training-cinema').hidden=true;
    q('.training-map b').textContent=`${String(state.step+1).padStart(2,'0')} / 05`; q('.training-card h2').textContent=step.title; q('.training-card p').textContent=step.copy; q('.training-card kbd').textContent=step.key;
    root.querySelectorAll('.training-track span').forEach((node,i)=>node.className=i<state.step?'done':i===state.step?'active':''); q('.training-progress').innerHTML=steps.map((_,i)=>`<i class="${i<state.step?'done':i===state.step?'active':''}"></i>`).join('');
    if(state.step===2) armMarker(state.scene); else clearMarker(); persistStep();
  };
  const next = () => { if(!state.active) return; state.step += 1; if(state.step>=steps.length) finishTutorial(); else showStep(); };
  const complete = id => { if(state.active && steps[state.step]?.id===id) next(); };
  const breakOnDash = (scene, detail={}) => {
    if(!state.active||state.step!==2||scene!==state.scene) return false;
    const direction=Number(detail.direction)||Math.sign(scene.player?.body?.velocity?.x||0)||(scene.player?.flipX?-1:1);
    const barrier=nearestTargetBarrier(scene,direction); if(!barrier) return false;
    barrier.disableBody(true,true); clearMarker();
    const burst=scene.add?.circle?.(barrier.x,barrier.y,18,0x8df4ff,.9)?.setDepth?.(14);
    scene.tweens?.add?.({targets:burst,scale:4.5,alpha:0,duration:300,onComplete:()=>burst?.destroy?.()});
    try{scene.playerCue?.('BARRIER DESTROYED · ROUTE OPEN','#8df4ff')}catch{}
    try{scene.game?.events?.emit?.('tutorial-break',{barrier,source:'dash'})}catch{}
    complete('dash'); return true;
  };
  const tick = () => {
    const scene=state.scene,p=scene?.player,b=p?.body;
    if(!state.active||!scene||!p||!b){if(state.active)state.watcher=requestAnimationFrame(tick);return;}
    if(state.step===0&&Math.abs(p.x-state.startX)>=110)complete('move');
    else if(state.step===1&&!b.blocked.down&&b.velocity.y<-140&&p.x>=state.startX+70)complete('jump');
    else if(state.step===3&&Number(scene.enemyDefeats||0)>state.actionBaseline)complete('action');
    else if(state.step===4&&p.x>=Number(scene.mission?.tutorialHandoffX||state.startX+1500))complete('route');
    if(state.step===2&&!state.marker)armMarker(scene);
    if(state.active)state.watcher=requestAnimationFrame(tick);
  };
  const finishTutorial = () => {
    if(state.completed) return;
    state.active=false; cancelAnimationFrame(state.watcher); clearMarker();
    try{sessionStorage.removeItem(STEP_KEY)}catch{}
    setTrainingMode(false); setCinematicMode(true);
    q('.training-card').hidden=true; q('.training-map').hidden=true; q('.training-cinema').hidden=false; root.hidden=false;
    let done=false;
    const unlock=()=>{
      if(done)return; done=true; markCompleted(); state.completed=true;
      const scene=state.scene;
      if(scene) scene.firstTimeTutorial=false;
      q('.training-cinema').hidden=true; root.hidden=true; setCinematicMode(false);
      window.dispatchEvent(new Event('relay:cinematic-unlock'));
      window.dispatchEvent(new CustomEvent('relay:tutorial-complete',{detail:{scene}}));
    };
    window.dispatchEvent(new Event('relay:cinematic-lock'));
    state.timers.add(setTimeout(unlock,2600));
    state.timers.add(setTimeout(unlock,4200));
  };
  const begin = scene => {
    if(state.active||state.completed||hasCompleted()||!firstMission(scene)) return;
    state.scene=scene; state.startX=scene.player?.x||scene.mission?.spawn?.x||0; state.actionBaseline=Number(scene.enemyDefeats||0);
    let saved=0; try { saved=Number.parseInt(sessionStorage.getItem(STEP_KEY)||'0',10); } catch {}
    state.step=Number.isInteger(saved)&&saved>=0&&saved<steps.length?saved:0;
    scene.firstTimeTutorial=true; state.active=true; setTrainingMode(true); showStep(); state.watcher=requestAnimationFrame(tick);
  };

  const ready = event => {
    const scene=event.detail?.scene||window.__relayRunnerScene;
    if(!firstMission(scene)) return;
    if(hasCompleted()) { state.completed=true; state.active=false; scene.firstTimeTutorial=false; setTrainingMode(false); setCinematicMode(false); root.hidden=true; return; }
    window.setTimeout(()=>begin(scene),120);
  };

  window.addEventListener('relay:runner-scene-ready',ready,{passive:true});
  window.addEventListener('relay:dash-runtime-applied',event=>breakOnDash(event.detail?.scene||state.scene,event.detail||{}),{passive:true});
  window.addEventListener('relay:dash-start',event=>breakOnDash(event.detail?.scene||state.scene,event.detail||{}),{passive:true});
  window.addEventListener('relay:cinematic-unlock',()=>setCinematicMode(false),{passive:true});
  window.addEventListener('beforeunload',()=>{if(state.active)persistStep();clearMarker();});
})();