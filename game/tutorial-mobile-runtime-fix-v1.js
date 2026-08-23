import { loadState } from './src/state.js';

(() => {
  'use strict';
  if (window.__relayTutorialMobileRuntimeFixV1) return;
  window.__relayTutorialMobileRuntimeFixV1 = true;

  const MOBILE = () => window.matchMedia?.('(max-width: 768px)').matches === true;
  const POST_TUTORIAL_DELAY = 12000;
  let gameplayHudUnlockAt = Infinity;

  const tutorialActive = () => {
    const state = loadState();
    return state.tutorialEnabled !== false && !window.__relayCinematicLock;
  };

  const style = document.createElement('style');
  style.id = 'relay-tutorial-mobile-runtime-fix-v2-style';
  style.textContent = `
    @media(max-width:768px){
      #tutorialCard,.tutorial-card,.tutorial-panel,#relayTutorialMobileCard,#titlePanel[data-panel="tutorial"]{
        position:fixed!important;top:calc(72px + env(safe-area-inset-top))!important;bottom:auto!important;
        left:50%!important;right:auto!important;transform:translateX(-50%)!important;
        width:min(86vw,350px)!important;max-height:min(34vh,240px)!important;overflow:auto!important;
        z-index:980!important;pointer-events:auto!important;
      }
      [data-mobile-joystick]{
        position:fixed!important;left:18px!important;right:auto!important;
        bottom:calc(18px + env(safe-area-inset-bottom))!important;width:108px!important;height:108px!important;
        z-index:1200!important;border-radius:50%!important;touch-action:none!important;
      }
      [data-mobile-joystick] .mobile-joystick-thumb{
        width:48px!important;height:48px!important;border-radius:50%!important;
        will-change:transform!important;
      }
      #mobileActions,.mobile-actions,.action-buttons{
        position:fixed!important;right:14px!important;
        bottom:calc(18px + env(safe-area-inset-bottom))!important;z-index:1200!important;
      }
      #relay-gameplay-new-layer .ng-chain,#relay-gameplay-new-layer .ng-choice{
        transition:opacity .22s ease,transform .22s ease!important;
      }
      body.relay-tutorial-hud-locked #relay-gameplay-new-layer .ng-chain,
      body.relay-tutorial-hud-locked #relay-gameplay-new-layer .ng-choice{
        opacity:0!important;pointer-events:none!important;visibility:hidden!important;
      }
    }
  `;
  document.head.appendChild(style);

  function tutorialCardFix() {
    if (!MOBILE()) return;
    document.querySelectorAll('#tutorialCard,.tutorial-card,.tutorial-panel,#relayTutorialMobileCard').forEach(card => {
      card.style.position = 'fixed';
      card.style.top = 'calc(72px + env(safe-area-inset-top))';
      card.style.bottom = 'auto';
      card.style.left = '50%';
      card.style.right = 'auto';
      card.style.transform = 'translateX(-50%)';
      card.style.maxHeight = 'min(34vh,240px)';
      card.style.overflow = 'auto';
      card.style.zIndex = '980';
    });
  }

  function lockGameplayHud() {
    document.body.classList.add('relay-tutorial-hud-locked');
    const layer = document.getElementById('relay-gameplay-new-layer');
    if (!layer) return;
    layer.querySelector('.ng-chain')?.classList.remove('show');
    layer.querySelector('.ng-choice')?.classList.remove('show');
  }

  function unlockGameplayHud() {
    gameplayHudUnlockAt = performance.now() + POST_TUTORIAL_DELAY;
    document.body.classList.add('relay-tutorial-hud-locked');
  }

  function gameplayLayerGate() {
    const layer = document.getElementById('relay-gameplay-new-layer');
    if (!layer) return;
    const tutorialFinished = document.body.dataset.relayTutorialFinished === '1';
    const unlocked = tutorialFinished && performance.now() >= gameplayHudUnlockAt && !tutorialActive();
    if (!unlocked) {
      layer.querySelector('.ng-chain')?.classList.remove('show');
      layer.querySelector('.ng-choice')?.classList.remove('show');
      document.body.classList.add('relay-tutorial-hud-locked');
    } else {
      document.body.classList.remove('relay-tutorial-hud-locked');
    }
  }

  function markTutorialFinished() {
    document.body.dataset.relayTutorialFinished = '1';
    unlockGameplayHud();
    window.dispatchEvent(new CustomEvent('relay:tutorial-finished'));
    gameplayLayerGate();
  }

  function installEvents() {
    lockGameplayHud();
    window.addEventListener('relay:tutorial-complete', markTutorialFinished);
    window.addEventListener('relay:tutorial-finished', gameplayLayerGate);
    window.addEventListener('relay:runner-scene-ready', () => {
      tutorialCardFix();
      if (document.body.dataset.relayTutorialFinished !== '1') lockGameplayHud();
    });
    window.addEventListener('resize', tutorialCardFix, { passive: true });

    document.addEventListener('click', event => {
      const button = event.target.closest?.('[data-title-panel="tutorial"]');
      if (!button) return;
      window.setTimeout(tutorialCardFix, 30);
    }, true);
  }

  function tick() {
    tutorialCardFix();
    gameplayLayerGate();
    requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installEvents, { once: true });
  else installEvents();
  requestAnimationFrame(tick);
})();
