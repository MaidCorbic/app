(() => {
  'use strict';

  const start = document.getElementById('start');
  if (!start || window.__relayGameplayIntroV2) return;
  window.__relayGameplayIntroV2 = true;

  const KEY = 'relay.runner.gameplayIntro.v2.played';
  const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false;
  let active = false;
  let bypass = false;
  let timers = [];
  let voice = null;
  let hiddenNodes = [];
  let hiddenSceneObjects = [];
  let runner = null;

  const wait = ms => new Promise(resolve => {
    const id = window.setTimeout(resolve, reduced() ? Math.min(ms, 220) : ms);
    timers.push(id);
  });

  const root = document.createElement('section');
  root.id = 'relayGameplayIntroV2';
  root.hidden = true;
  root.setAttribute('aria-live', 'polite');
  root.innerHTML = `
    <div class="intro-vignette"></div>
    <div class="intro-letterbox top"></div>
    <div class="intro-letterbox bottom"></div>
    <div class="intro-signal"><span></span><b>RELAY LINK // R-17</b></div>
    <div class="intro-copy"></div>
    <button class="intro-skip" type="button">SKIP INTRO · ENTER</button>
  `;
  document.body.appendChild(root);

  const style = document.createElement('style');
  style.id = 'relay-gameplay-intro-v2-style';
  style.textContent = `
    #relayGameplayIntroV2{position:fixed;inset:0;z-index:2147483646;overflow:hidden;pointer-events:none;color:#eafcff;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:rgba(1,4,9,.08)}
    #relayGameplayIntroV2[hidden]{display:none}
    #relayGameplayIntroV2 .intro-vignette{position:absolute;inset:0;background:radial-gradient(circle at 50% 52%,transparent 30%,rgba(0,0,0,.12) 65%,rgba(0,0,0,.78) 100%);pointer-events:none}
    #relayGameplayIntroV2 .intro-letterbox{position:absolute;left:0;right:0;height:7vh;background:#000;opacity:0;transition:opacity 1.8s ease;pointer-events:none}
    #relayGameplayIntroV2 .intro-letterbox.top{top:0}.intro-letterbox.bottom{bottom:0}
    #relayGameplayIntroV2 .intro-signal{position:absolute;left:max(18px,4vw);top:max(18px,4vh);display:flex;gap:10px;align-items:center;opacity:0;transition:opacity 1.4s ease;font-size:clamp(9px,1vw,12px);letter-spacing:.16em;text-transform:uppercase;color:#9ddbe7;text-shadow:0 0 14px #19c8f566}
    #relayGameplayIntroV2 .intro-signal span{width:6px;height:6px;border-radius:50%;background:#19c8f5;box-shadow:0 0 14px #19c8f5}
    #relayGameplayIntroV2 .intro-copy{position:absolute;left:50%;top:76%;width:min(900px,90vw);transform:translate(-50%,14px);opacity:0;text-align:center;transition:opacity 1.8s ease,transform 1.8s cubic-bezier(.2,.7,.2,1);pointer-events:none}
    #relayGameplayIntroV2 .intro-copy.show{opacity:1;transform:translate(-50%,0)}
    #relayGameplayIntroV2 .eyebrow{margin:0 0 12px;font-size:clamp(9px,1vw,12px);letter-spacing:.28em;color:#8df4ff;text-transform:uppercase}
    #relayGameplayIntroV2 h1{margin:0;font-size:clamp(30px,5vw,74px);line-height:.94;letter-spacing:.07em;text-transform:uppercase;font-weight:900;text-shadow:0 0 32px rgba(141,244,255,.16)}
    #relayGameplayIntroV2 p{margin:16px 0 0;font-size:clamp(12px,1.35vw,18px);line-height:1.55;color:#c8dbe2}
    #relayGameplayIntroV2 p em{display:block;margin-top:8px;color:#fff;font-style:normal;opacity:.76;font-size:.82em}
    #relayGameplayIntroV2 .intro-skip{position:absolute;right:max(16px,env(safe-area-inset-right,0px)+12px);bottom:max(16px,env(safe-area-inset-bottom,0px)+12px);padding:10px 13px;border:1px solid rgba(141,244,255,.25);background:rgba(2,8,16,.82);color:#eafcff;font-size:9px;font-weight:800;letter-spacing:.12em;opacity:0;transition:opacity .6s ease;pointer-events:auto;cursor:pointer}
    #relayGameplayIntroV2.playing .intro-letterbox{opacity:.94}#relayGameplayIntroV2.playing .intro-signal{opacity:1}#relayGameplayIntroV2.playing .intro-skip{opacity:1}
    #relayGameplayIntroV2 .intro-skip:hover{background:rgba(8,27,42,.9)}
    @media(max-width:760px){#relayGameplayIntroV2 .intro-copy{top:76%;width:92vw}#relayGameplayIntroV2 .intro-letterbox{height:5vh}}
    @media(prefers-reduced-motion:reduce){#relayGameplayIntroV2 *{transition:none!important}}
  `;
  document.head.appendChild(style);

  const copy = (eyebrow, title, line, translation = '') => {
    const node = root.querySelector('.intro-copy');
    node.innerHTML = `<p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p>${line}${translation ? `<em>${translation}</em>` : ''}</p>`;
    node.classList.add('show');
  };
  const clearCopy = async () => { root.querySelector('.intro-copy').classList.remove('show'); await wait(1400); };

  const say = text => {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
    try {
      window.speechSynthesis.cancel();
      voice = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices?.() || [];
      voice.voice = voices.find(item => /Daniel|George|David|Guy|James/i.test(item.name)) || null;
      voice.lang = 'en-US'; voice.rate = .78; voice.pitch = .74; voice.volume = .72;
      window.speechSynthesis.speak(voice);
    } catch {}
  };
  const stopVoice = () => { try { window.speechSynthesis?.cancel(); } catch {} };

  const getCanvas = () => document.querySelector('#phaser-game canvas');
  const getRunner = () => window.__relayRunnerScene || window.game?.scene?.getScene?.('runner') || null;
  const getMissionText = () => ({
    district: (document.getElementById('district')?.textContent || 'OLD QUARTER').trim(),
    title: (document.getElementById('objective')?.textContent || 'FIRST DELIVERY').trim(),
    objective: (document.getElementById('worldGoal')?.textContent || 'FOLLOW THE RELAY').trim(),
  });

  function hideDomGameplay(){
    const selectors = ['.hud','.world-marker','.input-guide','.mobile-controls','.rotate-prompt','#toast','#missionObjectiveHud','#missionObjective','[data-mission-objective]'];
    hiddenNodes=[];
    selectors.forEach(sel => document.querySelectorAll(sel).forEach(node => {
      hiddenNodes.push({node,visibility:node.style.visibility,opacity:node.style.opacity,pointerEvents:node.style.pointerEvents});
      node.style.visibility='hidden'; node.style.opacity='0'; node.style.pointerEvents='none';
    }));
  }

  function tutorialText(value){
    return /TUTORIAL|RUNNER LESSON|PRACTICE IT NOW|BOOST PAD|DOUBLE JUMP|BLACKOUT|WALL ROUTES|CHASE|AIR DASH|STORM|COMBINE|LOCKDOWN|ELITE|FINAL RUN|CITYSPINE/i.test(String(value || ''));
  }

  function hideSceneTutorial(){
    runner = getRunner();
    hiddenSceneObjects=[];
    if(!runner) return;
    runner.firstTimeTutorial = false;
    runner.routeTutorials?.clear?.();
    runner.dismissIntelCard?.();
    runner.guides?.setVisible?.(false);
    runner.guideCompanions?.setVisible?.(false);
    const list = runner.children?.list || [];
    list.forEach(child => {
      if(!child?.active) return;
      if(child.type === 'Text' && tutorialText(child.text)){
        hiddenSceneObjects.push({child,visible:child.visible});
        child.setVisible(false);
      }
    });
    runner.infoCard?.setVisible?.(false);
  }

  function restoreSceneTutorial(){
    hiddenSceneObjects.forEach(({child,visible}) => child?.setVisible?.(visible));
    hiddenSceneObjects=[];
  }

  function restoreDomGameplay(){
    hiddenNodes.forEach(({node,visibility,opacity,pointerEvents}) => {node.style.visibility=visibility;node.style.opacity=opacity;node.style.pointerEvents=pointerEvents;});
    hiddenNodes=[];
  }

  async function waitForWorld(){
    for(let i=0;i<80;i+=1){
      const canvas=getCanvas();
      if(canvas && !document.getElementById('play')?.classList.contains('hidden')) return canvas;
      await wait(100);
    }
    return getCanvas();
  }

  function panCanvas(canvas, from, to, duration){
    if(!canvas) return Promise.resolve();
    const parent=canvas.parentElement || canvas;
    parent.style.transformOrigin='50% 50%';
    parent.style.transform=`translate3d(${from.x}px,${from.y}px,0) scale(${from.scale})`;
    parent.style.transition=`transform ${duration}ms cubic-bezier(.22,.72,.18,1)`;
    requestAnimationFrame(()=>{parent.style.transform=`translate3d(${to.x}px,${to.y}px,0) scale(${to.scale})`;});
    return wait(duration);
  }

  let originalCanvasStyle=null;
  function resetCanvas(){
    const canvas=getCanvas(); const parent=canvas?.parentElement;
    if(!parent) return;
    parent.style.transform=originalCanvasStyle?.transform || '';
    parent.style.transformOrigin=originalCanvasStyle?.transformOrigin || '';
    parent.style.transition=originalCanvasStyle?.transition || '';
  }

  async function beginWorld(){
    bypass=true;
    start.click();
    for(let i=0;i<30;i+=1){
      await wait(120);
      const candidate=getRunner();
      if(candidate){ runner=candidate; break; }
    }
    const canvas=await waitForWorld();
    return canvas;
  }

  function freezeScene(){
    hideDomGameplay();
    hideSceneTutorial();
    try{runner?.scene?.pause?.();}catch{}
  }

  function handoff(){
    resetCanvas();
    restoreSceneTutorial();
    restoreDomGameplay();
    try{runner?.scene?.resume?.();}catch{}
    try{runner?.cameras?.main?.startFollow?.(runner.player,true,.08,.08);}catch{}
    try{runner.inputEnabled=true;}catch{}
  }

  async function play(){
    if(active) return;
    active=true; root.hidden=false; root.classList.add('playing');
    const mission=getMissionText();
    const canvas=await beginWorld();
    bypass=false;
    if(!canvas){ finish(); return; }

    const parent=canvas.parentElement || canvas;
    originalCanvasStyle={transform:parent.style.transform,transformOrigin:parent.style.transformOrigin,transition:parent.style.transition};
    freezeScene();

    await wait(700);
    copy('RELAY RUNNER // OLD QUARTER',mission.title,'NIA: First contact. Keep the route lit.','THE CITY IS LISTENING NOW.');
    say('First contact. Keep the route lit.');
    await panCanvas(canvas,{x:0,y:0,scale:1.035},{x:-16,y:2,scale:1.045},5200);
    await wait(2600);
    await clearCopy();
    if(!active)return;

    copy('DISTRICT // '+mission.district,'THE RELAY STILL ANSWERS',`NIA: ${mission.objective}.`,'MAKE THE HANDOFF BEFORE THE SIGNAL DIES.');
    say('The relay still answers. Make the handoff before the signal dies.');
    await panCanvas(canvas,{x:-16,y:2,scale:1.045},{x:18,y:-2,scale:1.025},6800);
    await wait(2800);
    await clearCopy();
    if(!active)return;

    copy('COURIER CLEARANCE','YOUR RUN BEGINS','NIA: Beacon ahead. Make the handoff.','CARRY THE SIGNAL. KEEP THE CITY CONNECTED.');
    say('Beacon ahead. Make the handoff. Carry the signal. Keep the city connected.');
    await panCanvas(canvas,{x:18,y:-2,scale:1.025},{x:0,y:0,scale:1},3800);
    await wait(3800);
    finish();
  }

  function finish(){
    timers.forEach(clearTimeout);timers=[];stopVoice();handoff();root.classList.remove('playing');root.hidden=true;active=false;bypass=false;sessionStorage.setItem(KEY,'1');
  }

  function skip(){
    if(!active)return;
    timers.forEach(clearTimeout);timers=[];stopVoice();handoff();root.classList.remove('playing');root.hidden=true;active=false;bypass=false;sessionStorage.setItem(KEY,'1');
  }

  start.addEventListener('click',event=>{
    if(bypass || active || sessionStorage.getItem(KEY)==='1') return;
    event.preventDefault();event.stopImmediatePropagation();play();
  },true);

  root.querySelector('.intro-skip').addEventListener('click',skip);
  document.addEventListener('keydown',event=>{if(active&&event.key==='Enter'){event.preventDefault();skip();}},{capture:true});
})();
