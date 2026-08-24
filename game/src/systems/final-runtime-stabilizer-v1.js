/* FINAL RUNTIME STABILIZER V1
   Tutorial/reload/UI lifecycle only. Gameplay physics/input/state remain authoritative elsewhere. */
(() => {
  'use strict';
  if (window.__relayFinalRuntimeStabilizerV1) return;
  window.__relayFinalRuntimeStabilizerV1 = true;

  const TUTORIAL_COMPLETE = 'relay.runner.tutorial.onboarding-v3.complete';
  const TUTORIAL_STEP = 'relay.runner.tutorial.onboarding-v3.step';

  const scene = () => window.__relayRunnerScene || window.game?.scene?.getScene?.('runner') || null;
  const play = () => document.getElementById('play');
  const hud = () => document.querySelector('#play > .hud');
  const tutorialActive = () => document.body.classList.contains('relay-training-active');
  const cinematicActive = () => document.body.classList.contains('relay-cinematic-active');
  const pauseActive = () => !!document.querySelector('#pauseMenu:not(.hidden)');
  const firstMission = s => s?.mission?.id === 'first-delivery';

  function resetTouchState() {
    document.querySelectorAll('.mobile-joystick').forEach(node => {
      node.classList.remove('is-active');
      const thumb = node.querySelector('.mobile-joystick-thumb');
      if (thumb) thumb.style.transform = 'translate(0,0)';
    });
    try { window.dispatchEvent(new Event('relay:mobile-input-reset')); } catch {}
    try { window.game?.events?.emit?.('mobile-move', null); } catch {}
  }

  function restoreSceneRuntime() {
    const s = scene();
    resetTouchState();
    try { s?.scene?.resume?.(); } catch {}
    try { s?.physics?.world?.resume?.(); } catch {}
    try { if (s?.input?.keyboard) s.input.keyboard.enabled = true; } catch {}
    try { if (s?.input) s.input.enabled = true; } catch {}
    try { window.game?.canvas?.focus?.(); } catch {}
  }

  function restoreHud() {
    const h = hud();
    if (!h || tutorialActive() || cinematicActive() || pauseActive()) return;
    h.hidden = false;
    h.removeAttribute('aria-hidden');
    h.style.removeProperty('visibility');
    h.style.removeProperty('opacity');
    h.style.removeProperty('display');
    h.classList.remove('hidden');
  }

  function queueHudRestore() {
    [0, 80, 220, 500, 900].forEach(delay => window.setTimeout(restoreHud, delay));
  }

  let tutorialRetryUsed = false;
  function ensureTutorialLifecycle(s) {
    if (!firstMission(s)) return;
    try {
      if (sessionStorage.getItem(TUTORIAL_COMPLETE) === '1') return;
      if (tutorialActive() || cinematicActive()) return;
      if (tutorialRetryUsed) return;
      tutorialRetryUsed = true;
      window.setTimeout(() => {
        if (!window.__relayRunnerScene || window.__relayRunnerScene !== s) return;
        if (sessionStorage.getItem(TUTORIAL_COMPLETE) === '1') return;
        if (tutorialActive() || cinematicActive()) return;
        window.dispatchEvent(new CustomEvent('relay:runner-scene-ready', { detail: { scene: s, source: 'final-tutorial-retry' } }));
      }, 180);
    } catch {}
  }

  function clearTutorialSessionForNewRun() {
    try {
      sessionStorage.removeItem(TUTORIAL_COMPLETE);
      sessionStorage.removeItem(TUTORIAL_STEP);
    } catch {}
  }

  function installMomentumHudMirror() {
    const h = hud();
    if (!h) return;
    if (!h.querySelector('.hud-momentum')) {
      const el = document.createElement('div');
      el.className = 'hud-momentum';
      el.setAttribute('aria-label', 'Momentum flow');
      el.innerHTML = '<small>MOMENTUM CHAIN</small><strong data-flow-value>0</strong><em>x FLOW</em>';
      h.appendChild(el);
    }
    const momentum = h.querySelector('.hud-momentum');
    const source = document.querySelector('#relay-gameplay-new-layer .ng-value');
    if (!momentum || !source) return;
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
    if (!source.__relayMomentumObserved) {
      source.__relayMomentumObserved = true;
      const observer = new MutationObserver(sync);
      observer.observe(source, { childList: true, characterData: true, subtree: true });
    }
  }

  function queueHudAndMomentum() {
    [0, 80, 220, 500, 900].forEach(delay => window.setTimeout(() => {
      installMomentumHudMirror();
      restoreHud();
    }, delay));
  }

  document.addEventListener('click', event => {
    const start = event.target.closest?.('#start');
    if (start) clearTutorialSessionForNewRun();
  }, true);

  window.addEventListener('relay:runner-scene-ready', event => {
    const s = event.detail?.scene || scene();
    restoreSceneRuntime();
    ensureTutorialLifecycle(s);
    queueHudAndMomentum();
  }, { passive: true });

  window.addEventListener('pageshow', event => {
    if (event.persisted || performance.getEntriesByType?.('navigation')?.[0]?.type === 'reload') {
      resetTouchState();
      restoreSceneRuntime();
      queueHudAndMomentum();
    }
  }, { passive: true });

  window.addEventListener('resize', queueHudAndMomentum, { passive: true });
  window.addEventListener('orientationchange', () => window.setTimeout(queueHudAndMomentum, 80), { passive: true });

  const observer = new MutationObserver(() => {
    const s = scene();
    if (s) {
      installMomentumHudMirror();
      if (!tutorialActive() && !cinematicActive() && !pauseActive()) restoreHud();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] });
})();
