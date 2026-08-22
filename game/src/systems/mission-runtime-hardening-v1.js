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

  const handleTransition = event => {
    const button = event.currentTarget;
    if (!button || transitionLock || button.disabled) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
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
    // Mission completion must never leave tutorial/cinematic ownership active.
    stopTutorialRuntime();
    resetTouchState();
    bind();
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

  bind();
  new MutationObserver(bind).observe(document.body, { childList: true, subtree: true });
})();
