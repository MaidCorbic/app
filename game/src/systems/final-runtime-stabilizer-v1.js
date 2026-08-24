/* FINAL RUNTIME STABILIZER V2
   Presentation/lifecycle only. Does not reset gameplay input or physics during scene startup. */
(() => {
  'use strict';
  if (window.__relayFinalRuntimeStabilizerV2) return;
  window.__relayFinalRuntimeStabilizerV2 = true;

  const TUTORIAL_COMPLETE = 'relay.runner.tutorial.onboarding-v3.complete';
  const TUTORIAL_STEP = 'relay.runner.tutorial.onboarding-v3.step';
  const scene = () => window.__relayRunnerScene || window.game?.scene?.getScene?.('runner') || null;
  const hud = () => document.querySelector('#play > .hud');
  const tutorialActive = () => document.body.classList.contains('relay-training-active');
  const cinematicActive = () => document.body.classList.contains('relay-cinematic-active');
  const pauseActive = () => !!document.querySelector('#pauseMenu:not(.hidden)');
  const firstMission = s => s?.mission?.id === 'first-delivery';

  const restoreHud = () => {
    const h = hud();
    if (!h || tutorialActive() || cinematicActive() || pauseActive()) return;
    h.hidden = false;
    h.removeAttribute('aria-hidden');
    h.style.removeProperty('visibility');
    h.style.removeProperty('opacity');
    h.style.removeProperty('display');
    h.classList.remove('hidden');
  };

  const installMomentumHudMirror = () => {
    const h = hud();
    if (!h || tutorialActive() || cinematicActive() || pauseActive()) return;
    if (!h.querySelector('.hud-momentum')) {
      const el = document.createElement('div');
      el.className = 'hud-momentum';
      el.setAttribute('aria-label','Momentum flow');
      el.innerHTML = '<small>MOMENTUM CHAIN</small><strong data-flow-value>0</strong><em>x FLOW</em>';
      h.appendChild(el);
    }
    const momentum = h.querySelector('.hud-momentum');
    const source = document.querySelector('#relay-gameplay-new-layer .ng-value');
    if (!momentum || !source || source.__relayMomentumObservedV2) return;
    source.__relayMomentumObservedV2 = true;
    const sync = () => {
      const raw = source.textContent?.trim() || '0';
      const match = raw.match(/-?\d+(?:\.\d+)?/);
      const value = match ? match[0] : '0';
      momentum.dataset.flow = value;
      const out = momentum.querySelector('[data-flow-value]');
      if (out) out.textContent = value;
      momentum.classList.toggle('is-active', value !== '0');
    };
    sync();
    new MutationObserver(sync).observe(source,{childList:true,characterData:true,subtree:true});
  };

  const stabilizePresentation = () => {
    if (!scene()) return;
    restoreHud();
    installMomentumHudMirror();
  };

  const retryTutorialEvent = s => {
    if (!firstMission(s) || tutorialActive() || cinematicActive()) return;
    if (sessionStorage.getItem(TUTORIAL_COMPLETE) === '1') return;
    window.dispatchEvent(new CustomEvent('relay:runner-scene-ready',{detail:{scene:s,source:'final-stabilizer-v2'}}));
  };

  window.addEventListener('relay:runner-scene-ready', event => {
    const s = event.detail?.scene || scene();
    stabilizePresentation();
    if (firstMission(s) && sessionStorage.getItem(TUTORIAL_COMPLETE) !== '1') {
      [180,700,1400].forEach(delay => window.setTimeout(() => retryTutorialEvent(s),delay));
    }
  },{passive:true});

  window.addEventListener('pageshow', event => {
    if (!(event.persisted || performance.getEntriesByType?.('navigation')?.[0]?.type === 'reload')) return;
    [250,700].forEach(delay => window.setTimeout(stabilizePresentation,delay));
  },{passive:true});

  window.addEventListener('resize',stabilizePresentation,{passive:true});
  window.addEventListener('orientationchange',()=>window.setTimeout(stabilizePresentation,80),{passive:true});
})();