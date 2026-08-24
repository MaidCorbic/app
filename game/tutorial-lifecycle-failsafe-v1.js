/* TUTORIAL LIFECYCLE FAILSAFE V1
   Keeps the existing onboarding UI and gameplay state. It only repairs missed
   scene-ready races and resets the tutorial runtime for a fresh START. */
(() => {
  'use strict';
  if (window.__relayTutorialLifecycleFailsafeV1) return;
  window.__relayTutorialLifecycleFailsafeV1 = true;

  const COMPLETE_KEY = 'relay.runner.tutorial.onboarding-v3.complete';
  const STEP_KEY = 'relay.runner.tutorial.onboarding-v3.step';
  const root = () => document.getElementById('relayTutorialOnboardingV3');
  const scene = () => window.__relayRunnerScene || window.game?.scene?.getScene?.('runner') || null;
  const firstMission = s => (s?.mission?.id || s?.missionId) === 'first-delivery';
  const trainingActive = () => document.body.classList.contains('relay-training-active');
  const cinematicActive = () => document.body.classList.contains('relay-cinematic-active');

  const clearStartState = () => {
    try {
      sessionStorage.removeItem(COMPLETE_KEY);
      sessionStorage.removeItem(STEP_KEY);
    } catch {}
    const r = root();
    if (r) {
      r.hidden = true;
      r.querySelectorAll('[hidden]').forEach(node => { node.hidden = true; });
    }
    document.body.classList.remove('relay-training-active','relay-cinematic-active');
  };

  const requestTutorial = s => {
    if (!firstMission(s) || trainingActive() || cinematicActive()) return;
    if (sessionStorage.getItem(COMPLETE_KEY) === '1') return;
    const current = root();
    if (current && !current.hidden) return;
    window.dispatchEvent(new CustomEvent('relay:runner-scene-ready', {
      detail: { scene:s, source:'tutorial-lifecycle-failsafe-v1' }
    }));
  };

  document.addEventListener('click', event => {
    const start = event.target.closest?.('#start');
    if (!start) return;
    clearStartState();
    [120,500,1100,1800].forEach(delay => window.setTimeout(() => requestTutorial(scene()), delay));
  }, true);

  window.addEventListener('relay:runner-scene-ready', event => {
    const s = event.detail?.scene || scene();
    if (!firstMission(s)) return;
    if (sessionStorage.getItem(COMPLETE_KEY) === '1') return;
    [80,420,1000,1800].forEach(delay => window.setTimeout(() => requestTutorial(s), delay));
  }, { passive:true });

  window.addEventListener('pageshow', event => {
    if (!(event.persisted || performance.getEntriesByType?.('navigation')?.[0]?.type === 'reload')) return;
    [400,900,1600].forEach(delay => window.setTimeout(() => requestTutorial(scene()), delay));
  }, { passive:true });
})();