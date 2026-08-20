(() => {
  'use strict';

  const start = document.getElementById('start');
  if (!start || window.__relayGameplayIntroV4) return;
  window.__relayGameplayIntroV4 = true;

  const KEY = 'relay.runner.gameplayIntro.v4.played';
  const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false;
  let active = false;
  let replaying = false;
  let timers = [];
  let voice = null;
  let hiddenDom = [];
  let hiddenPhaser = [];
  let runner = null;
  let originalCanvas = null;
  let watchdog = 0;

  const wait = ms => new Promise(resolve => {
    const id = window.setTimeout(resolve, reduced() ? Math.min(ms, 220) : ms);
    timers.push(id);
  });

  const root = document.createElement('section');
  root.id = 'relayGameplayIntroV4';
  root.hidden = true;
  root.innerHTML = `
    <div class="vignette"></div>
    <div class="letterbox top"></div>
    <div class="letterbox bottom"></div>
    <div class="caption"></div>
    <button class="skip" type="button">SKIP INTRO · ENTER</button>
  `;
  document.body.appendChild(root);

  const style = document.createElement('style');
  style.textContent = `
    #relayGameplayIntroV4{position:fixed;inset:0;z-index:2147483647;overflow:hidden;pointer-events:none;color:#eafcff;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
    #relayGameplayIntroV4[hidden]{display:none}
    #relayGameplayIntroV4 .vignette{position:absolute;inset:0;background:radial-gradient(circle at 50% 48%,transparent 39%,rgba(0,0,0,.14) 70%,rgba(0,0,0,.72) 100%)}
    #relayGameplayIntroV4 .letterbox{position:absolute;left:0;right:0;height:7vh;background:#000;opacity:0;transition:opacity 1.4s ease}
    #relayGameplayIntroV4 .letterbox.top{top:0}.letterbox.bottom{bottom:0}
    #relayGameplayIntroV4.playing .letterbox{opacity:.96}
    #relayGameplayIntroV4 .caption{position:absolute;left:50%;bottom:10%;width:min(760px,88vw);transform:translate(-50%,18px);opacity:0;text-align:center;text-shadow:0 3px 18px rgba(0,0,0,.95);transition:opacity 1.7s ease,transform 1.7s cubic-bezier(.2,.72,.2,1)}
    #relayGameplayIntroV4 .caption.show{opacity:1;transform:translate(-50%,0)}
    #relayGameplayIntroV4 .caption small{display:block;margin-bottom:10px;color:#8df4ff;font-size:clamp(9px,1vw,12px);letter-spacing:.24em;text-transform:uppercase}
    #relayGameplayIntroV4 .caption strong{display:block;font-size:clamp(26px,3.6vw,56px);line-height:.96;letter-spacing:.05em;text-transform:uppercase}
    #relayGameplayIntroV4 .caption span{display:block;margin-top:12px;color:#d2e4ea;font-size:clamp(12px,1.25vw,17px);line-height:1.55}
    #relayGameplayIntroV4 .caption em{display:block;margin-top:7px;color:#fff;font-style:normal;font-size:.84em;opacity:.78}
    #relayGameplayIntroV4 .skip{position:absolute;left:14px;top:12px;pointer-events:auto;border:1px solid rgba(141,244,255,.3);background:rgba(2,7,13,.88);color:#eafcff;padding:9px 12px;font:800 9px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;opacity:0;transition:opacity .7s ease;cursor:pointer}
    #relayGameplayIntroV4.playing .skip{opacity:1}
    @media(max-width:760px){#relayGameplayIntroV4 .letterbox{height:5vh}#relayGameplayIntroV4 .caption{bottom:13%;width:92vw}}
    @media(prefers-reduced-motion:reduce){#relayGameplayIntroV4 *{transition:none!important}}
  `;
  document.head.appendChild(style);

  const getCanvas = () => document.querySelector('#phaser-game canvas');
  const getRunner = () => window.__relayRunnerScene || window.game?.scene?.getScene?.('runner') || null;
  const missionText = () => ({
    district: (document.getElementById('district')?.textContent || 'OLD QUARTER').trim(),
    title: (document.getElementById('objective')?.textContent || 'FIRST DELIVERY').trim(),
    objective: (document.getElementById('worldGoal')?.textContent || 'FOLLOW THE RELAY').trim(),
  });

  const tutorialText = value => /TUTORIAL|RUNNER LESSON|PRACTICE IT NOW|BOOST PAD|DOUBLE JUMP|BLACKOUT|WALL ROUTES|CHASE|AIR DASH|STORM|COMBINE|LOCKDOWN|ELITE|FINAL RUN|CITYSPINE|CHECKPOINT/i.test(String(value || ''));

  const hideDom = () => {
    hiddenDom = [];
    const selectors = ['#play .hud','#play .world-marker','#play .input-guide','#play .mobile-controls','#play .rotate-prompt','#toast','#missionObjectiveHud','#missionObjective','[data-mission-objective]','#pause'];
    selectors.forEach(selector => document.querySelectorAll(selector).forEach(node => {
      hiddenDom.push({node,visibility:node.style.visibility,opacity:node.style.opacity,pointerEvents:node.style.pointerEvents});
      node.style.visibility = 'hidden';
      node.style.opacity = '0';
      node.style.pointerEvents = 'none';
    }));
  };

  function rememberPhaser(child){
    if(!child || hiddenPhaser.some(entry => entry.child === child)) return;
    hiddenPhaser.push({child,visible:child.visible,active:child.active});
    child.setVisible?.(false);
    child.setActive?.(false);
  }

  function walkPhaser(list){
    list?.forEach(child => {
      if(!child?.active) return;
      const text = child.type === 'Text' ? String(child.text || '') : '';
      const name = String(child.name || '').toLowerCase();
      const fixed = child.scrollFactorX === 0 && child.scrollFactorY === 0;
      const uiNamed = /hud|objective|tutorial|guide|lesson|signal|energy|input|mission/i.test(name);
      const uiText = child.type === 'Text' && tutorialText(text);
      if(child === runner?.player) return;
      if(fixed || uiNamed || uiText) rememberPhaser(child);
      if(child.list?.length) walkPhaser(child.list);
    });
  }

  const hidePhaser = () => {
    runner = getRunner();
    if(!runner) return;
    hiddenPhaser = [];
    runner.firstTimeTutorial = false;
    runner.routeTutorials?.clear?.();
    runner.dismissIntelCard?.();
    runner.guides?.setVisible?.(false);
    runner.guideCompanions?.setVisible?.(false);
    walkPhaser(runner.children?.list || []);
    const objective = runner.__missionObjectiveState?.c;
    if(objective) rememberPhaser(objective);
    if(runner.infoCard) rememberPhaser(runner.infoCard);
  };

  const restorePhaser = () => {
    hiddenPhaser.forEach(({child,visible,active}) => {
      child?.setVisible?.(visible);
      child?.setActive?.(active);
    });
    hiddenPhaser = [];
  };

  const maintainLock = () => {
    if(!active) return;
    hideDom();
    hidePhaser();
  };

  const caption = (eyebrow,title,line,translation) => {
    const node = root.querySelector('.caption');
    node.innerHTML = `<small>${eyebrow}</small><strong>${title}</strong><span>${line}<em>${translation}</em></span>`;
    node.classList.add('show');
  };
  const clearCaption = async () => { root.querySelector('.caption').classList.remove('show'); await wait(1300); };

  const speak = text => {
    if(!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      voice = new SpeechSynthesisUtterance(text);
      voice.lang = 'en-US';
      voice.rate = .76;
      voice.pitch = .72;
      voice.volume = .72;
      const voices = window.speechSynthesis.getVoices?.() || [];
      voice.voice = voices.find(v => /Daniel|George|David|Guy|James/i.test(v.name)) || null;
      window.speechSynthesis.speak(voice);
    } catch {}
  };
  const stopVoice = () => { try { window.speechSynthesis?.cancel(); } catch {} };

  async function waitForRunner(){
    for(let i=0;i<70;i+=1){
      runner = getRunner();
      if(runner && getCanvas()) return getCanvas();
      await wait(90);
    }
    return getCanvas();
  }

  function saveCanvasStyle(canvas){
    const parent = canvas?.parentElement;
    if(!parent || originalCanvas) return;
    originalCanvas = {parent,transform:parent.style.transform,origin:parent.style.transformOrigin,transition:parent.style.transition,filter:parent.style.filter};
  }

  const transformCanvas = async (canvas,x,y,scale,duration) => {
    const parent = canvas?.parentElement;
    if(!parent) { await wait(duration); return; }
    saveCanvasStyle(canvas);
    parent.style.transformOrigin = '50% 50%';
    parent.style.transition = `transform ${duration}ms cubic-bezier(.22,.72,.18,1)`;
    parent.style.transform = `translate3d(${x}px,${y}px,0) scale(${scale})`;
    await wait(duration);
  };

  const restoreCanvas = () => {
    if(!originalCanvas) return;
    originalCanvas.parent.style.transform = originalCanvas.transform || '';
    originalCanvas.parent.style.transformOrigin = originalCanvas.origin || '';
    originalCanvas.parent.style.transition = originalCanvas.transition || '';
    originalCanvas.parent.style.filter = originalCanvas.filter || '';
    originalCanvas = null;
  };

  const release = () => {
    window.clearInterval(watchdog);
    watchdog = 0;
    restoreCanvas();
    restorePhaser();
    hiddenDom.forEach(({node,visibility,opacity,pointerEvents}) => { node.style.visibility = visibility; node.style.opacity = opacity; node.style.pointerEvents = pointerEvents; });
    hiddenDom = [];
    try { runner?.scene?.resume?.(); } catch {}
    try { runner?.cameras?.main?.startFollow?.(runner.player,true,.08,.08); } catch {}
    window.__relayCinematicLock = false;
    window.dispatchEvent(new Event('relay:cinematic-unlock'));
  };

  async function play(){
    if(active) return;
    active = true;
    root.hidden = false;
    root.classList.add('playing');
    window.__relayCinematicLock = true;
    window.dispatchEvent(new Event('relay:cinematic-lock'));

    // Start the existing mission path once, then immediately freeze presentation.
    replaying = true;
    start.click();
    await waitForRunner();
    replaying = false;
    hideDom();
    hidePhaser();
    try { runner?.scene?.pause?.(); } catch {}
    const canvas = getCanvas();
    saveCanvasStyle(canvas);
    if(originalCanvas?.parent) originalCanvas.parent.style.filter = 'brightness(.72) saturate(.88)';
    watchdog = window.setInterval(maintainLock,220);

    const mission = missionText();
    await wait(800);
    caption('OLD QUARTER // NIGHT SHIFT','FIRST DELIVERY','NIA: First contact. Keep the route lit.','THE CITY IS LISTENING NOW.');
    speak('First contact. Keep the route lit.');
    await transformCanvas(canvas,-10,1,1.015,5400);
    await wait(2400);
    await clearCaption();

    caption(`DISTRICT // ${mission.district}`,'CARRY THE SIGNAL','A silent relay ping reaches Old Quarter. Deliver it before the signal dies.','FOLLOW THE ROUTE. KEEP THE CITY CONNECTED.');
    speak('A silent relay ping reaches Old Quarter. Deliver it before the signal dies.');
    await transformCanvas(canvas,12,-1,1.012,7600);
    await wait(2900);
    await clearCaption();

    caption('COURIER CLEARANCE','YOUR RUN BEGINS','NIA: Beacon ahead. Make the handoff.','CARRY THE SIGNAL. KEEP THE CITY CONNECTED.');
    speak('Beacon ahead. Make the handoff. Carry the signal. Keep the city connected.');
    await transformCanvas(canvas,0,0,1,4000);
    await wait(3000);

    release();
    root.classList.remove('playing');
    root.hidden = true;
    active = false;
    sessionStorage.setItem(KEY,'1');
  }

  const skip = () => {
    if(!active) return;
    timers.forEach(clearTimeout);
    timers = [];
    stopVoice();
    release();
    root.classList.remove('playing');
    root.hidden = true;
    active = false;
    sessionStorage.setItem(KEY,'1');
  };

  start.addEventListener('click',event => {
    if(active || replaying || sessionStorage.getItem(KEY) === '1') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    window.setTimeout(play,0);
  },true);

  root.querySelector('.skip').addEventListener('click',skip);
  document.addEventListener('keydown',event => { if(active && event.key === 'Enter'){ event.preventDefault(); skip(); } },{capture:true});
})();
