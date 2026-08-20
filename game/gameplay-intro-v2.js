(() => {
  'use strict';

  const start = document.getElementById('start');
  if (!start || window.__relayGameplayIntroV3) return;
  window.__relayGameplayIntroV3 = true;

  const KEY = 'relay.runner.gameplayIntro.v3.played';
  const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false;
  let active = false;
  let timers = [];
  let voice = null;
  let hiddenNodes = [];
  let hiddenSceneObjects = [];
  let runner = null;
  let originalCanvas = null;
  let watchdog = 0;

  const wait = ms => new Promise(resolve => {
    const id = window.setTimeout(resolve, reduced() ? Math.min(ms, 220) : ms);
    timers.push(id);
  });

  const root = document.createElement('section');
  root.id = 'relayGameplayIntroV3';
  root.hidden = true;
  root.setAttribute('aria-live', 'polite');
  root.innerHTML = `
    <div class="vignette"></div>
    <div class="letterbox top"></div>
    <div class="letterbox bottom"></div>
    <div class="copy"></div>
    <button class="skip" type="button">SKIP INTRO · ENTER</button>
  `;
  document.body.appendChild(root);

  const style = document.createElement('style');
  style.id = 'relay-gameplay-intro-v3-style';
  style.textContent = `
    #relayGameplayIntroV3{position:fixed;inset:0;z-index:2147483647;pointer-events:none;overflow:hidden;color:#eafcff;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:rgba(0,0,0,.01)}
    #relayGameplayIntroV3[hidden]{display:none}
    #relayGameplayIntroV3 .vignette{position:absolute;inset:0;background:radial-gradient(circle at 50% 48%,transparent 36%,rgba(0,0,0,.12) 68%,rgba(0,0,0,.78) 100%);pointer-events:none}
    #relayGameplayIntroV3 .letterbox{position:absolute;left:0;right:0;height:7vh;background:#000;opacity:0;transition:opacity 1.4s ease;pointer-events:none}
    #relayGameplayIntroV3 .letterbox.top{top:0}.letterbox.bottom{bottom:0}
    #relayGameplayIntroV3 .copy{position:absolute;left:50%;bottom:11%;width:min(900px,90vw);transform:translate(-50%,16px);opacity:0;text-align:center;transition:opacity 1.6s ease,transform 1.6s cubic-bezier(.2,.72,.2,1);text-shadow:0 3px 18px rgba(0,0,0,.95)}
    #relayGameplayIntroV3 .copy.show{opacity:1;transform:translate(-50%,0)}
    #relayGameplayIntroV3 .copy small{display:block;margin-bottom:10px;color:#8df4ff;font-size:clamp(9px,1vw,12px);letter-spacing:.25em;text-transform:uppercase}
    #relayGameplayIntroV3 .copy strong{display:block;font-size:clamp(24px,4vw,62px);line-height:.95;letter-spacing:.06em;text-transform:uppercase}
    #relayGameplayIntroV3 .copy span{display:block;margin-top:13px;color:#d2e4ea;font-size:clamp(12px,1.35vw,18px);line-height:1.55}
    #relayGameplayIntroV3 .copy em{display:block;margin-top:7px;color:#fff;font-size:.84em;font-style:normal;opacity:.78}
    #relayGameplayIntroV3 .skip{position:absolute;left:16px;top:12px;pointer-events:auto;border:1px solid rgba(141,244,255,.25);background:rgba(2,7,13,.78);color:#eafcff;padding:9px 12px;font:800 9px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;opacity:0;cursor:pointer;transition:opacity .7s ease}
    #relayGameplayIntroV3.playing .letterbox{opacity:.96}#relayGameplayIntroV3.playing .skip{opacity:1}
    @media(max-width:760px){#relayGameplayIntroV3 .letterbox{height:5vh}#relayGameplayIntroV3 .copy{bottom:14%;width:92vw}}
    @media(prefers-reduced-motion:reduce){#relayGameplayIntroV3 *{transition:none!important}}
  `;
  document.head.appendChild(style);

  const caption = (eyebrow, title, line, translation = '') => {
    const node = root.querySelector('.copy');
    node.innerHTML = `<small>${eyebrow}</small><strong>${title}</strong><span>${line}${translation ? `<em>${translation}</em>` : ''}</span>`;
    node.classList.add('show');
  };
  const clearCaption = async () => { root.querySelector('.copy').classList.remove('show'); await wait(1200); };
  const speak = text => {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
    try { window.speechSynthesis.cancel(); voice = new SpeechSynthesisUtterance(text); const voices = window.speechSynthesis.getVoices?.() || []; voice.voice = voices.find(v => /Daniel|George|David|Guy|James/i.test(v.name)) || null; voice.lang = 'en-US'; voice.rate = .78; voice.pitch = .74; voice.volume = .72; window.speechSynthesis.speak(voice); } catch {}
  };
  const stopVoice = () => { try { window.speechSynthesis?.cancel(); } catch {} };

  const getCanvas = () => document.querySelector('#phaser-game canvas');
  const getRunner = () => window.__relayRunnerScene || window.game?.scene?.getScene?.('runner') || null;
  const getMissionText = () => ({ district: (document.getElementById('district')?.textContent || 'OLD QUARTER').trim(), title: (document.getElementById('objective')?.textContent || 'FIRST DELIVERY').trim(), objective: (document.getElementById('worldGoal')?.textContent || 'FOLLOW THE RELAY').trim() });

  function hideDomGameplay(){
    hiddenNodes=[];
    ['#play .hud','#play .world-marker','#play .input-guide','#play .mobile-controls','#play .rotate-prompt','#toast','#missionObjectiveHud','#missionObjective','[data-mission-objective]'].forEach(sel => document.querySelectorAll(sel).forEach(node => { hiddenNodes.push({node,visibility:node.style.visibility,opacity:node.style.opacity,pointerEvents:node.style.pointerEvents}); node.style.visibility='hidden'; node.style.opacity='0'; node.style.pointerEvents='none'; }));
  }
  const tutorialText = value => /TUTORIAL|RUNNER LESSON|PRACTICE IT NOW|BOOST PAD|DOUBLE JUMP|BLACKOUT|WALL ROUTES|CHASE|AIR DASH|STORM|COMBINE|LOCKDOWN|ELITE|FINAL RUN|CITYSPINE|CHECKPOINT/i.test(String(value || ''));

  function hideSceneUi(){
    runner = getRunner();
    if(!runner) return;
    hiddenSceneObjects=[];
    runner.firstTimeTutorial=false;
    runner.routeTutorials?.clear?.();
    runner.dismissIntelCard?.();
    runner.guides?.setVisible?.(false);
    runner.guideCompanions?.setVisible?.(false);
    runner.children?.list?.forEach(child=>{
      if(!child?.active) return;
      const name=String(child.name||'').toLowerCase();
      const text=child.type==='Text'?String(child.text||''):'';
      if((child.type==='Text' && tutorialText(text)) || /hud|objective|tutorial|guide|lesson|signal.?panel/i.test(name)){
        hiddenSceneObjects.push({child,visible:child.visible,active:child.active});
        child.setVisible?.(false); child.setActive?.(false);
      }
    });
    const objectiveState=runner.__missionObjectiveState;
    if(objectiveState?.c){hiddenSceneObjects.push({child:objectiveState.c,visible:objectiveState.c.visible,active:objectiveState.c.active}); objectiveState.c.setVisible(false); objectiveState.c.setActive?.(false);}
    runner.infoCard?.setVisible?.(false); runner.infoCard?.setActive?.(false);
  }

  function restoreSceneUi(){ hiddenSceneObjects.forEach(({child,visible,active})=>{child?.setVisible?.(visible);child?.setActive?.(active);}); hiddenSceneObjects=[]; }
  function restoreDom(){ hiddenNodes.forEach(({node,visibility,opacity,pointerEvents})=>{node.style.visibility=visibility;node.style.opacity=opacity;node.style.pointerEvents=pointerEvents;}); hiddenNodes=[]; }

  function maintainCinematicLock(){ if(!active) return; hideDomGameplay(); hideSceneUi(); }

  async function waitForWorld(){
    for(let i=0;i<80;i+=1){ const canvas=getCanvas(); if(canvas && !document.getElementById('play')?.classList.contains('hidden')) return canvas; await wait(80); }
    return getCanvas();
  }

  async function startUnderlyingGameplay(){
    window.__relayCinematicLock = true;
    start.click();
    await wait(140);
    for(let i=0;i<30;i+=1){ runner=getRunner(); if(runner) break; await wait(90); }
    return waitForWorld();
  }

  function panCanvas(canvas, x, y, scale, duration){
    if(!canvas) return wait(duration);
    const parent=canvas.parentElement||canvas;
    if(!originalCanvas) originalCanvas={transform:parent.style.transform,origin:parent.style.transformOrigin,transition:parent.style.transition,filter:parent.style.filter,parent};
    parent.style.transformOrigin='50% 50%';
    parent.style.transition=`transform ${duration}ms cubic-bezier(.22,.72,.18,1), filter 1200ms ease`;
    parent.style.transform=`translate3d(${x}px,${y}px,0) scale(${scale})`;
    return wait(duration);
  }

  function clearCanvas(){ if(!originalCanvas)return; originalCanvas.parent.style.transform=originalCanvas.transform||''; originalCanvas.parent.style.transformOrigin=originalCanvas.origin||''; originalCanvas.parent.style.transition=originalCanvas.transition||''; originalCanvas.parent.style.filter=originalCanvas.filter||''; originalCanvas=null; }

  async function play(){
    if(active)return;
    active=true; root.hidden=false; root.classList.add('playing');
    const mission=getMissionText();
    const canvas=await startUnderlyingGameplay();
    if(!canvas){finish();return;}
    hideDomGameplay(); hideSceneUi();
    const scene=runner;
    try{scene?.scene?.pause?.();}catch{}
    const parent=canvas.parentElement||canvas;
    if(!originalCanvas) originalCanvas={transform:parent.style.transform,origin:parent.style.transformOrigin,transition:parent.style.transition,filter:parent.style.filter,parent};
    parent.style.filter='brightness(.70) saturate(.88)';
    parent.style.transformOrigin='50% 50%';
    watchdog=window.setInterval(maintainCinematicLock,240);

    await wait(700);
    caption('OLD QUARTER // NIGHT SHIFT',mission.title,'NIA: First contact. Keep the route lit.','THE CITY IS LISTENING NOW.');
    speak('First contact. Keep the route lit.');
    await panCanvas(canvas,-10,2,1.015,5200); await wait(2400); await clearCaption();

    caption('THE RELAY STILL ANSWERS','CARRY THE SIGNAL','A silent relay ping reaches Old Quarter. Deliver it before the signal dies.','FOLLOW THE ROUTE. KEEP THE CITY CONNECTED.');
    speak('A silent relay ping reaches Old Quarter. Deliver it before the signal dies.');
    await panCanvas(canvas,12,-1,1.012,7200); await wait(2800); await clearCaption();

    caption('COURIER CLEARANCE','YOUR RUN BEGINS','NIA: Beacon ahead. Make the handoff.','CARRY THE SIGNAL. KEEP THE CITY CONNECTED.');
    speak('Beacon ahead. Make the handoff. Carry the signal. Keep the city connected.');
    await panCanvas(canvas,0,0,1,4000); await wait(3000); finish();
  }

  function finish(){ timers.forEach(clearTimeout);timers=[];window.clearInterval(watchdog);watchdog=0;stopVoice();clearCanvas();restoreSceneUi();restoreDom();try{runner?.scene?.resume?.();runner?.cameras?.main?.startFollow?.(runner.player,true,.08,.08);}catch{} window.__relayCinematicLock=false;root.classList.remove('playing');root.hidden=true;active=false;sessionStorage.setItem(KEY,'1'); }
  function skip(){if(!active)return;timers.forEach(clearTimeout);timers=[];window.clearInterval(watchdog);watchdog=0;stopVoice();clearCanvas();restoreSceneUi();restoreDom();try{runner?.scene?.resume?.();runner?.cameras?.main?.startFollow?.(runner.player,true,.08,.08);}catch{} window.__relayCinematicLock=false;root.classList.remove('playing');root.hidden=true;active=false;sessionStorage.setItem(KEY,'1');}

  start.addEventListener('click',event=>{ if(active || sessionStorage.getItem(KEY)==='1' || window.__relayCinematicLaunch) return; event.preventDefault(); event.stopImmediatePropagation(); window.__relayCinematicLaunch=true; window.setTimeout(()=>{window.__relayCinematicLaunch=false; play();},0); },true);
  root.querySelector('.skip').addEventListener('click',skip);
  document.addEventListener('keydown',event=>{if(active&&event.key==='Enter'){event.preventDefault();skip();}},{capture:true});
})();
