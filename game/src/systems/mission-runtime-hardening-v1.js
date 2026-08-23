import { GAME_FLOW, gameFlow } from '../runtime/game-flow.js';

(() => {
  'use strict';
  if (window.__relayMissionRuntimeHardeningV1) return;
  window.__relayMissionRuntimeHardeningV1 = true;

  const TRANSIENT_SELECTORS = [
    '#relayTutorialOnboardingV3',
    '#relayTutorialOnboardingV2',
    '#relayGameplayIntroFinalV2',
    '#relayMobileSettings',
    '.world-marker',
    '.input-guide',
    '#toast',
    '#levelUp',
    '#abilityUnlock'
  ];
  const transitionButtons = new Set(['retry', 'again', 'nextMission', 'finishTitle', 'failTitle']);
  const TRANSITION_TARGETS = Object.freeze({
    retry: GAME_FLOW.LOADING,
    again: GAME_FLOW.LOADING,
    nextMission: GAME_FLOW.LOADING,
    finishTitle: GAME_FLOW.HOME,
    failTitle: GAME_FLOW.HOME,
  });
  let transitionLock = false;

  const runner = () => window.__relayRunnerScene || window.game?.scene?.getScene?.('runner');
  const hide = node => {
    if (!node) return;
    node.classList.add('hidden');
    node.setAttribute('aria-hidden', 'true');
  };
  const stopTutorialRuntime = () => {
    try { window.dispatchEvent(new Event('relay:tutorial-runtime-stop')); } catch {}
    document.body.classList.remove('relay-training-active', 'relay-cinematic-active');
    const root = document.getElementById('relayTutorialOnboardingV3');
    if (root) root.hidden = true;
  };
  const clearTransientUi = () => {
    stopTutorialRuntime();
    TRANSIENT_SELECTORS.forEach(selector => {
      document.querySelectorAll(selector).forEach(node => {
        if (selector === '#relayMobileSettings') node.remove();
        else if (selector === '#relayTutorialOnboardingV3') node.hidden = true;
        else hide(node);
      });
    });
  };
  const resetTouchState = () => {
    document.querySelectorAll('.mobile-joystick').forEach(node => {
      node.classList.remove('is-active');
      const thumb = node.querySelector('.mobile-joystick-thumb');
      if (thumb) thumb.style.transform = 'translate(0,0)';
    });
    try { window.dispatchEvent(new Event('relay:mobile-input-reset')); } catch {}
  };
  const releaseRunnerInput = () => {
    resetTouchState();
    try { document.dispatchEvent(new KeyboardEvent('keyup', { key:'a', code:'KeyA', bubbles:true })); } catch {}
    try { document.dispatchEvent(new KeyboardEvent('keyup', { key:'d', code:'KeyD', bubbles:true })); } catch {}
    try { document.dispatchEvent(new KeyboardEvent('keyup', { key:'Shift', code:'ShiftLeft', bubbles:true })); } catch {}
    try { document.dispatchEvent(new KeyboardEvent('keyup', { key:' ', code:'Space', bubbles:true })); } catch {}
  };

  const cleanForTransition = () => {
    releaseRunnerInput();
    clearTransientUi();
    document.body.classList.remove('rotate-dismissed');
    const finish = document.getElementById('finish');
    const gameOver = document.getElementById('gameOver');
    if (finish) finish.classList.add('hidden');
    if (gameOver) gameOver.classList.add('hidden');
  };

  const flowTransition = (target, meta = {}) => {
    const current = gameFlow.getState();
    if (current === target) return true;
    if (gameFlow.canTransition(target)) return gameFlow.transition(target, meta);
    if (target === GAME_FLOW.HOME) {
      gameFlow.reset({ ...meta, reason: 'legacy-home-transition' });
      return true;
    }
    if (target === GAME_FLOW.LOADING && [GAME_FLOW.COMPLETE, GAME_FLOW.RESULTS, GAME_FLOW.GAME_OVER].includes(current)) {
      return gameFlow.transition(GAME_FLOW.LOADING, meta);
    }
    return false;
  };

  const handleTransition = event => {
    const button = event.currentTarget;
    if (!button || transitionLock || button.disabled) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    const target = TRANSITION_TARGETS[button.id];
    if (target) flowTransition(target, { source: 'mission-runtime-hardening', control: button.id });
    transitionLock = true;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    cleanForTransition();
    window.setTimeout(() => {
      transitionLock = false;
      if (!button.isConnected) return;
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }, 1200);
  };

  const bind = () => {
    transitionButtons.forEach(id => {
      const button = document.getElementById(id);
      if (!button || button.dataset.relayLifecycleGate === '1') return;
      button.dataset.relayLifecycleGate = '1';
      button.addEventListener('click', handleTransition, true);
      button.addEventListener('pointerdown', event => {
        if (transitionLock) { event.preventDefault(); event.stopImmediatePropagation(); }
      }, true);
    });
  };

  const onMissionComplete = () => {
    stopTutorialRuntime();
    resetTouchState();
    if (gameFlow.canTransition(GAME_FLOW.COMPLETE)) gameFlow.transition(GAME_FLOW.COMPLETE, { source: 'mission-runtime-hardening' });
    if (gameFlow.canTransition(GAME_FLOW.RESULTS)) gameFlow.transition(GAME_FLOW.RESULTS, { source: 'mission-runtime-hardening' });
    bind();
  };

  const onPause = event => {
    const action = event.target?.closest?.('[data-action="pause"],[data-pause-button],#pauseBtn,#pause');
    if (!action) return;
    if (gameFlow.canTransition(GAME_FLOW.PAUSED)) gameFlow.transition(GAME_FLOW.PAUSED, { source: 'mission-runtime-hardening' });
  };

  const onResume = event => {
    const action = event.target?.closest?.('[data-action="resume"],[data-resume-button],#resumeBtn,#resume');
    if (!action) return;
    if (gameFlow.canTransition(GAME_FLOW.RUNNING)) gameFlow.transition(GAME_FLOW.RUNNING, { source: 'mission-runtime-hardening' });
  };

  window.addEventListener('relay:mission-complete', onMissionComplete, { passive: true });
  window.addEventListener('relay:tutorial-complete', () => {
    document.body.classList.remove('relay-training-active');
    bind();
  }, { passive: true });
  window.addEventListener('relay:cinematic-unlock', () => {
    document.body.classList.remove('relay-cinematic-active');
    resetTouchState();
  }, { passive: true });
  window.addEventListener('blur', releaseRunnerInput, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) releaseRunnerInput(); }, { passive: true });
  window.addEventListener('pagehide', releaseRunnerInput, { passive: true });
  document.addEventListener('click', onPause, true);
  document.addEventListener('click', onResume, true);

  gameFlow.subscribe(({ to }) => {
    document.documentElement.dataset.relayGameFlow = to;
  });

  bind();
  new MutationObserver(bind).observe(document.body, { childList: true, subtree: true });
})();
