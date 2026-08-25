(() => {
  'use strict';

  const start = document.getElementById('start');
  if (!start || window.__relayGameplayIntroFinalV1) return;
  window.__relayGameplayIntroFinalV1 = true;

  const KEY = 'relay.runner.gameplayIntro.final-v1.played';
  const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false;
  let active = false;
  let timers = [];
  let voice = null;
  let runner = null;
  let hiddenPhaser = [];
  let originalCanvas = null;
  let originalInputEnabled;
  let originalFirstTimeTutorial;
  let originalGuidesVisible;
  let originalCompanionsVisible;

  const wait = ms => new Promise(resolve => {
    const id = window.setTimeout(resolve, reduced() ? Math.min(ms, 250) : ms);
    timers.push(id);
  });

  const root = document.createElement('section');
  root.id = 'relayGameplayIntroFinalV1';
  root.hidden = true;
  root.innerHTML = `
    <div class="cinematic-vignette"></div>
    <div class="cinematic-letterbox top"></div>
    <div class="cinematic-letterbox bottom"></div>
    <div class="cinematic-caption"></div>
    <button class="cinematic-skip" type="button">SKIP INTRO · ENTER</button>
  `;
  document.body.appendChild(root);

  const style = document.createElement('style');
  style.textContent = `
    #relayGameplayIntroFinalV1{position:fixed;inset:0;z-index:2147483647;overflow:hidden;pointer-events:none;color:#eafcff;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
    #relayGameplayIntroFinalV1[hidden]{display:none}
    #relayGameplayIntroFinalV1 .cinematic-vignette{position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,transparent 42%,rgba(0,0,0,.12) 72%,rgba(0,0,0,.72) 100%);pointer-events:none}
    #relayGameplayIntroFinalV1 .cinematic-letterbox{position:absolute;left:0;right:0;height:6.5vh;background:#000;opacity:0;transition:opacity 1.8s ease}
    #relayGameplayIntroFinalV1 .cinematic-letterbox.top{top:0}
    #relayGameplayIntroFinalV1 .cinematic-letterbox.bottom{bottom:0}
    #relayGameplayIntroFinalV1.playing .cinematic-letterbox{opacity:.96}
    #relayGameplayIntroFinalV1 .cinematic-caption{position:absolute;left:50%;bottom:10.5%;width:min(820px,88vw);transform:translate(-50%,18px);opacity:0;text-align:center;text-shadow:0 4px 20px rgba(0,0,0,.96);transition:opacity 2s ease,transform 2s cubic-bezier(.2,.72,.2,1)}
    #relayGameplayIntroFinalV1 .cinematic-caption.show{opacity:1;transform:translate(-50%,0)}
    #relayGameplayIntroFinalV1 .cinematic-caption small{display:block;margin-bottom:12px;color:#8df4ff;font-size:clamp(9px,1vw,12px);letter-spacing:.26em;text-transform:uppercase}
    #relayGameplayIntroFinalV1 .cinematic-caption strong{display:block;font-size:clamp(26px,3.5vw,58px);line-height:.96;letter-spacing:.055em;text-transform:uppercase;font-weight:900}
    #relayGameplayIntroFinalV1 .cinematic-caption span{display:block;margin-top:14px;color:#d6e5eb;font-size:clamp(12px,1.25vw,17px);line-height:1.65}
    #relayGameplayIntroFinalV1 .cinematic-caption em{display:block;margin-top:8px;color:#fff;font-size:.82em;font-style:normal;opacity:.78}
    #relayGameplayIntroFinalV1 .cinematic-skip{position:absolute;left:14px;top:12px;pointer-events:auto;border:1px solid rgba(141,244,255,.32);background:rgba(2,7,13,.9);color:#eafcff;padding:9px 12px;font:800 9px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;opacity:0;transition:opacity .8s ease;cursor:pointer}
    #relayGameplayIntroFinalV1.playing .cinematic-skip{opacity:1}

    /* Presentation lock: hide presentation UI only; never hide the game canvas. */
    #play.relay-cinematic-presentation-lock .hud,
    #play.relay-cinematic-presentation-lock .world-marker,
    #play.relay-cinematic-presentation-lock .input-guide,
    #play.relay-cinematic-presentation-lock .mobile-controls,
    #play.relay-cinematic-presentation-lock .rotate-prompt,
    #play.relay-cinematic-presentation-lock #toast,
    #play.relay-cinematic-presentation-lock #pause,
    #play.relay-cinematic-presentation-lock #missionObjectiveHud,
    #play.relay-cinematic-presentation-lock #missionObjective,
    #play.relay-cinematic-presentation-lock [data-mission-objective]{
      visibility:hidden !important;
      opacity:0 !important;
      pointer-events:none !important;
    }

    @media(max-width:760px){
      #relayGameplayIntroFinalV1 .cinematic-letterbox{height:5vh}
      #relayGameplayIntroFinalV1 .cinematic-caption{bottom:13%;width:92vw}
      #relayGameplayIntroFinalV1 .cinematic-caption span{font-size:12px;line-height:1.55}
    }
    @media(prefers-reduced-motion:reduce){#relayGameplayIntroFinalV1 *{transition:none!important}}
  `;
  document.head.appendChild(style);

  const getCanvas = () => document.querySelector('#phaser-game canvas');
  const getRunner = () => window.__relayRunnerScene || window.game?.scene?.getScene?.('runner') || null;
  const getMission = () => ({
    district: (document.getElementById('district')?.textContent || 'OLD QUARTER').trim(),
    title: (document.getElementById('objective')?.textContent || 'FIRST DELIVERY').trim(),
    objective: (document.getElementById('worldGoal')?.textContent || 'FOLLOW THE RELAY').trim(),
  });

  const tutorialText = value => /TUTORIAL|RUNNER LESSON|PRACTICE IT NOW|BOOST PAD|DOUBLE JUMP|BLACKOUT|WALL ROUTES|CHASE|AIR DASH|STORM|COMBINE|LOCKDOWN|ELITE|FINAL RUN|CITYSPINE|CHECKPOINT/i.test(String(value || ''));

  const rememberPhaser = child => {
    if (!child || hiddenPhaser.some(entry => entry.child === child)) return;
    hiddenPhaser.push({child, visible: child.visible});
    child.setVisible?.(false);
  };

  const hidePhaserPresentation = () => {
    runner = getRunner();
    if (!runner) return;
    hiddenPhaser = [];

    if (originalFirstTimeTutorial === undefined) originalFirstTimeTutorial = runner.firstTimeTutorial;
    if (originalGuidesVisible === undefined) originalGuidesVisible = runner.guides?.visible;
    if (originalCompanionsVisible === undefined) originalCompanionsVisible = runner.guideCompanions?.visible;

    runner.firstTimeTutorial = false;
    runner.guides?.setVisible?.(false);
    runner.guideCompanions?.setVisible?.(false);

    const visit = list => {
      list?.forEach(child => {
        if (!child?.active) return;
        if (child === runner.player) return;
        const text = child.type === 'Text' ? String(child.text || '') : '';
        const name = String(child.name || '').toLowerCase();
        const fixed = child.scrollFactorX === 0 && child.scrollFactorY === 0;
        const named = /hud|objective|tutorial|guide|lesson|signal|energy|input|mission|low.?gravity|modifier/i.test(name);
        if (fixed || named || (child.type === 'Text' && tutorialText(text))) rememberPhaser(child);
        if (child.list?.length) visit(child.list);
      });
    };

    visit(runner.children?.list || []);

    const objective = runner.__missionObjectiveState?.c;
    if (objective) rememberPhaser(objective);
    if (runner.infoCard) rememberPhaser(runner.infoCard);
  };

  const restorePhaserPresentation = () => {
    hiddenPhaser.forEach(({child, visible}) => child?.setVisible?.(visible));
    hiddenPhaser = [];
    if (!runner) return;
    if (originalFirstTimeTutorial !== undefined) runner.firstTimeTutorial = originalFirstTimeTutorial;
    if (originalGuidesVisible !== undefined && runner.guides) runner.guides.setVisible(originalGuidesVisible);
    if (originalCompanionsVisible !== undefined && runner.guideCompanions) runner.guideCompanions.setVisible(originalCompanionsVisible);
    if (runner.firstTimeTutorial) {
      if (!runner.guides || !runner.guides.active) runner.createGuides?.();
      if (!runner.guideCompanions || !runner.guideCompanions.active) runner.createGuideCompanions?.();
      runner.guides?.setVisible?.(true);
      runner.guideCompanions?.setVisible?.(true);
    }
  };

  const saveCanvas = canvas => {
    const parent = canvas?.parentElement;
    if (!parent || originalCanvas) return;
    originalCanvas = {
      parent,
      transform: parent.style.transform,
      transformOrigin: parent.style.transformOrigin,
      transition: parent.style.transition,
      filter: parent.style.filter,
    };
  };

  const pan = async (canvas, x, y, scale, duration) => {
    const parent = canvas?.parentElement;
    if (!parent) { await wait(duration); return; }
    saveCanvas(canvas);
    parent.style.transformOrigin = '50% 50%';
    parent.style.transition = `transform ${duration}ms cubic-bezier(.22,.72,.18,1)`;
    parent.style.transform = `translate3d(${x}px,${y}px,0) scale(${scale})`;
    await wait(duration);
  };

  const restoreCanvas = () => {
    if (!originalCanvas) return;
    originalCanvas.parent.style.transform = originalCanvas.transform || '';
    originalCanvas.parent.style.transformOrigin = originalCanvas.transformOrigin || '';
    originalCanvas.parent.style.transition = originalCanvas.transition || '';
    originalCanvas.parent.style.filter = originalCanvas.filter || '';
    originalCanvas = null;
  };

  const caption = (eyebrow, title, line, translation) => {
    const node = root.querySelector('.cinematic-caption');
    node.innerHTML = `<small>${eyebrow}</small><strong>${title}</strong><span>${line}<em>${translation}</em></span>`;
    node.classList.remove('show');
    requestAnimationFrame(() => node.classList.add('show'));
  };

  const clearCaption = async () => {
    root.querySelector('.cinematic-caption').classList.remove('show');
    await wait(1900);
  };

  const speak = text => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      voice = new SpeechSynthesisUtterance(text);
      voice.lang = 'en-US';
      voice.rate = .72;
      voice.pitch = .72;
      voice.volume = .72;
      const voices = window.speechSynthesis.getVoices?.() || [];
      voice.voice = voices.find(v => /Daniel|George|David|Guy|James/i.test(v.name)) || null;
      window.speechSynthesis.speak(voice);
    } catch {}
  };

  const stopVoice = () => { try { window.speechSynthesis?.cancel(); } catch {} };

  const begin = async () => {
    window.__relayCinematicLock = true;
    window.dispatchEvent(new Event('relay:cinematic-lock'));
    start.click();
    for (let i = 0; i < 90; i += 1) {
      runner = getRunner();
      if (runner && getCanvas()) break;
      await wait(100);
    }
    return getCanvas();
  };

  const handoff = () => {
    restoreCanvas();
    document.getElementById('play')?.classList.remove('relay-cinematic-presentation-lock');
    restorePhaserPresentation();

    if (runner) {
      if (originalInputEnabled !== undefined) runner.inputEnabled = originalInputEnabled;
      else runner.inputEnabled = true;
      runner.cameras?.main?.startFollow?.(runner.player, true, .08, .08);
    }

    originalInputEnabled = undefined;
    originalFirstTimeTutorial = undefined;
    originalGuidesVisible = undefined;
    originalCompanionsVisible = undefined;

    window.__relayCinematicLock = false;
    window.dispatchEvent(new Event('relay:cinematic-unlock'));
  };

  const finish = () => {
    timers.forEach(clearTimeout);
    timers = [];
    stopVoice();
    handoff();
    root.classList.remove('playing');
    root.hidden = true;
    active = false;
    sessionStorage.setItem(KEY, '1');
  };

  const skip = () => {
    if (!active) return;
    timers.forEach(clearTimeout);
    timers = [];
    stopVoice();
    handoff();
    root.classList.remove('playing');
    root.hidden = true;
    active = false;
    sessionStorage.setItem(KEY, '1');
  };

  async function play() {
    if (active) return;
    active = true;
    root.hidden = false;
    root.classList.add('playing');

    const canvas = await begin();
    if (!canvas) { finish(); return; }

    const playLayer = document.getElementById('play');
    playLayer?.classList.add('relay-cinematic-presentation-lock');

    if (originalInputEnabled === undefined) originalInputEnabled = runner?.inputEnabled;
    runner.inputEnabled = false;

    hidePhaserPresentation();
    saveCanvas(canvas);

    const data = getMission();

    await wait(1400);
    caption('OLD QUARTER // NIGHT SHIFT', 'FIRST CONTACT', 'NIA: The relay has been silent for three nights. Tonight it answered.', 'RELAY CANT · "Vara thalen. Linea open." · THE LINE IS OPEN.');
    speak('The relay has been silent for three nights. Tonight it answered.');
    await pan(canvas, -8, 1, 1.008, 8200);
    await wait(4200);
    await clearCaption();

    caption(`DISTRICT // ${data.district}`, 'THE CITY LISTENS', 'NIA: Old Quarter carries the last clean route. Do not lose the handoff.', 'THE SIGNAL MUST REACH THE BEACON.');
    speak('Old Quarter carries the last clean route. Do not lose the handoff.');
    await pan(canvas, 10, -1, 1.012, 9800);
    await wait(5200);
    await clearCaption();

    caption('COURIER // R-17', 'YOUR RUN BEGINS', 'NIA: Beacon ahead. Keep your pace. Every Signal makes the route stronger.', 'FIRST DELIVERY · DELIVER THE SIGNAL PACKAGE.');
    speak('Beacon ahead. Keep your pace. Every Signal makes the route stronger.');
    await pan(canvas, 0, 0, 1, 7200);
    await wait(4800);

    finish();
  }

  start.addEventListener('click', event => {
    if (active || sessionStorage.getItem(KEY) === '1') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    window.setTimeout(() => play(), 0);
  }, true);

  root.querySelector('.cinematic-skip').addEventListener('click', skip);
  document.addEventListener('keydown', event => {
    if (active && event.key === 'Enter') {
      event.preventDefault();
      skip();
    }
  }, {capture:true});
})();
