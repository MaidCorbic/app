/* TUTORIAL LIFECYCLE FAILSAFE V2
   Repairs missed scene-ready races without redispatching recursively. */
(() => {
  'use strict';
  if (window.__relayTutorialLifecycleFailsafeV2) return;
  window.__relayTutorialLifecycleFailsafeV2 = true;

  const COMPLETE_KEY = 'relay.runner.tutorial.onboarding-v3.complete';
  const STEP_KEY = 'relay.runner.tutorial.onboarding-v3.step';
  const root = () => document.getElementById('relayTutorialOnboardingV3');
  const scene = () => window.__relayRunnerScene || window.game?.scene?.getScene?.('runner') || null;
  const firstMission = s => (s?.mission?.id || s?.missionId) === 'first-delivery';
  const trainingActive = () => document.body.classList.contains('relay-training-active');
  const cinematicActive = () => document.body.classList.contains('relay-cinematic-active');
  let lastScene = null;
  let retryScheduled = false;

  const clearStartState = () => {
    try {
      sessionStorage.removeItem(COMPLETE_KEY);
      sessionStorage.removeItem(STEP_KEY);
    } catch {}
    const r = root();
    if (r && !trainingActive() && !cinematicActive()) r.hidden = true;
  };

  const requestOneRetry = s => {
    if (!firstMission(s) || trainingActive() || cinematicActive()) return;
    if (sessionStorage.getItem(COMPLETE_KEY) === '1') return;
    const current = root();
    if (current && !current.hidden) return;
    if (retryScheduled && lastScene === s) return;
    retryScheduled = true;
    lastScene = s;
    window.setTimeout(() => {
      retryScheduled = false;
      if (!firstMission(s) || trainingActive() || cinematicActive()) return;
      if (sessionStorage.getItem(COMPLETE_KEY) === '1') return;
      const onboarding = root();
      if (onboarding && !onboarding.hidden) return;
      /* One synthetic retry only; never feed it back into this listener. */
      window.dispatchEvent(new CustomEvent('relay:runner-scene-ready', {
        detail: { scene:s, source:'tutorial-lifecycle-failsafe-v2', retry:true }
      }));
    }, 420);
  };

  document.addEventListener('click', event => {
    if (!event.target.closest?.('#start')) return;
    clearStartState();
    lastScene = null;
    retryScheduled = false;
  }, true);

  window.addEventListener('relay:runner-scene-ready', event => {
    if (event.detail?.retry === true) return;
    const s = event.detail?.scene || scene();
    if (!firstMission(s)) return;
    if (sessionStorage.getItem(COMPLETE_KEY) === '1') return;
    requestOneRetry(s);
  }, { passive:true });

  window.addEventListener('pageshow', event => {
    if (!(event.persisted || performance.getEntriesByType?.('navigation')?.[0]?.type === 'reload')) return;
    const s = scene();
    if (!firstMission(s) || !s?.scene?.isActive?.() || trainingActive() || cinematicActive()) return;
    requestOneRetry(s);
  }, { passive:true });
})();