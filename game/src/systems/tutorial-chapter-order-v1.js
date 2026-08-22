(() => {
  'use strict';
  if (window.__relayTutorialChapterOrderV1) return;
  window.__relayTutorialChapterOrderV1 = true;

  const COMPLETE_KEY = 'relay.runner.tutorial.onboarding-v3.complete';
  const HIDDEN = '__relayChapterHiddenByTutorial';
  const state = { tutorialComplete:false, cinematicUnlocked:false };
  const isFirstTutorial = scene => scene?.mission?.id === 'first-delivery' && scene?.firstTimeTutorial === true;

  const textOf = node => typeof node?.text === 'string' ? node.text : (typeof node?.textContent === 'string' ? node.textContent : '');
  const isChapter = node => {
    const text = textOf(node).replace(/\s+/g, ' ').trim();
    return /CHAPTER\s*01/i.test(text) && /OPEN\s*LINE/i.test(text);
  };

  const domTargets = () => {
    const out = [];
    document.querySelectorAll('body *').forEach(node => {
      if (node.id === 'relayTutorialOnboardingV3' || node.closest('#relayTutorialOnboardingV3')) return;
      if (!isChapter(node)) return;
      let target = node;
      for (let i = 0; i < 3 && target.parentElement; i++) {
        const parent = target.parentElement;
        const position = getComputedStyle(parent).position;
        if (position === 'fixed' || position === 'absolute') target = parent;
        else break;
      }
      if (!out.includes(target)) out.push(target);
    });
    return out;
  };

  const hide = target => {
    if (!target || target.id === 'relayTutorialOnboardingV3') return;
    if (!target[HIDDEN]) target[HIDDEN] = { display:target.style.display, visibility:target.style.visibility, pointerEvents:target.style.pointerEvents };
    target.style.setProperty('display','none','important');
    target.style.setProperty('visibility','hidden','important');
    target.style.setProperty('pointer-events','none','important');
    target.setAttribute('aria-hidden','true');
  };

  const reveal = target => {
    if (!target?.[HIDDEN]) return;
    const old = target[HIDDEN];
    target.style.display = old.display;
    target.style.visibility = old.visibility;
    target.style.pointerEvents = old.pointerEvents;
    target.removeAttribute('aria-hidden');
    delete target[HIDDEN];
  };

  const apply = scene => {
    if (!isFirstTutorial(scene) || state.tutorialComplete || sessionStorage.getItem(COMPLETE_KEY) === '1') return;
    domTargets().forEach(hide);
  };

  const revealIfReady = () => {
    if (!state.tutorialComplete || !state.cinematicUnlocked) return;
    domTargets().forEach(reveal);
  };

  const onReady = event => {
    const scene = event?.detail?.scene || window.__relayRunnerScene;
    if (!isFirstTutorial(scene)) return;
    state.tutorialComplete = false;
    state.cinematicUnlocked = false;
    apply(scene);
    requestAnimationFrame(() => apply(scene));
    setTimeout(() => apply(scene), 250);
    setTimeout(() => apply(scene), 900);
  };

  window.addEventListener('relay:runner-scene-ready', onReady, { passive:true });
  window.addEventListener('relay:tutorial-step', () => apply(window.__relayRunnerScene), { passive:true });
  window.addEventListener('relay:cinematic-lock', () => { state.cinematicUnlocked = false; apply(window.__relayRunnerScene); }, { passive:true });
  window.addEventListener('relay:tutorial-complete', () => { state.tutorialComplete = true; revealIfReady(); }, { passive:true });
  window.addEventListener('relay:cinematic-unlock', () => { state.cinematicUnlocked = true; revealIfReady(); }, { passive:true });

  if (sessionStorage.getItem(COMPLETE_KEY) === '1') state.tutorialComplete = true;
  if (window.__relayRunnerScene) onReady({ detail:{ scene:window.__relayRunnerScene } });

  new MutationObserver(() => {
    const scene = window.__relayRunnerScene;
    if (isFirstTutorial(scene) && !state.tutorialComplete && sessionStorage.getItem(COMPLETE_KEY) !== '1') apply(scene);
    else if (state.tutorialComplete && state.cinematicUnlocked) revealIfReady();
  }).observe(document.body, { childList:true, subtree:true });
})();