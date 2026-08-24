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
  let unlockTimer = 0;

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
    document.getElementById('finish')?.classList.add('hidden');
    document.getElementById('gameOver')?.classList.add('hidden');
  };

  const armTransitionLock = button => {
    transitionLock = true;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    cleanForTransition();
    window.clearTimeout(unlockTimer);
    unlockTimer = window.setTimeout(() => {
      transitionLock = false;
      if (!button.isConnected) return;
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }, 1200);
  };

  const delegatedPointerDown = event => {
    const button = event.target?.closest?.('button');
    if (!button || !transitionButtons.has(button.id)) return;
    if (transitionLock || button.disabled) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };

  const delegatedClick = event => {
    const button = event.target?.closest?.('button');
    if (!button || !transitionButtons.has(button.id)) return;
    if (transitionLock || button.disabled) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    armTransitionLock(button);
  };

  const onMissionComplete = () => {
    stopTutorialRuntime();
    resetTouchState();
  };

  document.addEventListener('pointerdown', delegatedPointerDown, true);
  document.addEventListener('click', delegatedClick, true);
  window.addEventListener('relay:mission-complete', onMissionComplete, { passive: true });
  window.addEventListener('relay:tutorial-complete', () => {
    document.body.classList.remove('relay-training-active');
  }, { passive: true });
  window.addEventListener('relay:cinematic-unlock', () => {
    document.body.classList.remove('relay-cinematic-active');
    resetTouchState();
  }, { passive: true });
  window.addEventListener('blur', releaseRunnerInput, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) releaseRunnerInput(); }, { passive: true });
  window.addEventListener('pagehide', releaseRunnerInput, { passive: true });
})();
