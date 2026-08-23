import { loadState } from './src/state.js';

(() => {
  'use strict';
  if (window.__relayTutorialMobileRuntimeFixV1) return;
  window.__relayTutorialMobileRuntimeFixV1 = true;

  const MOBILE = () => window.matchMedia?.('(max-width: 768px)').matches === true;
  const tutorialActive = () => {
    const state = loadState();
    return state.tutorialEnabled !== false && !window.__relayCinematicLock;
  };

  const style = document.createElement('style');
  style.id = 'relay-tutorial-mobile-runtime-fix-v1-style';
  style.textContent = `
    @media(max-width:768px){
      #tutorialCard,
      .tutorial-card,
      .tutorial-panel,
      #relayTutorialMobileCard,
      #titlePanel[data-panel="tutorial"]{
        position:fixed!important;
        top:calc(78px + env(safe-area-inset-top))!important;
        bottom:auto!important;
        left:50%!important;
        right:auto!important;
        transform:translateX(-50%)!important;
        width:min(88vw,360px)!important;
        max-height:min(38vh,280px)!important;
        overflow:auto!important;
        z-index:980!important;
        pointer-events:auto!important;
      }

      #joystick,
      #mobileJoystick,
      .joystick,
      .virtual-joystick,
      [data-mobile-control="joystick"]{
        position:fixed!important;
        left:18px!important;
        right:auto!important;
        bottom:calc(20px + env(safe-area-inset-bottom))!important;
        width:108px!important;
        height:108px!important;
        z-index:1200!important;
        touch-action:none!important;
        user-select:none!important;
        -webkit-user-select:none!important;
        border-radius:50%!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
      }

      #joystickKnob,
      #mobileJoystickKnob,
      .joystick-knob,
      .virtual-joystick .knob{
        position:absolute!important;
        left:50%!important;
        top:50%!important;
        width:48px!important;
        height:48px!important;
        margin:-24px 0 0 -24px!important;
        border-radius:50%!important;
        transform:translate3d(0,0,0)!important;
        will-change:transform!important;
      }

      #mobileActions,
      .mobile-actions,
      .action-buttons{
        position:fixed!important;
        right:14px!important;
        bottom:calc(18px + env(safe-area-inset-bottom))!important;
        z-index:1200!important;
      }

      #relay-gameplay-new-layer .ng-choice{
        display:none!important;
        pointer-events:none!important;
      }
    }
  `;
  document.head.appendChild(style);

  function tutorialCardFix() {
    if (!MOBILE()) return;
    document.querySelectorAll('#tutorialCard,.tutorial-card,.tutorial-panel,#relayTutorialMobileCard').forEach(card => {
      card.style.position = 'fixed';
      card.style.top = 'calc(78px + env(safe-area-inset-top))';
      card.style.bottom = 'auto';
      card.style.left = '50%';
      card.style.right = 'auto';
      card.style.transform = 'translateX(-50%)';
      card.style.maxHeight = 'min(38vh,280px)';
      card.style.overflow = 'auto';
      card.style.zIndex = '980';
    });
  }

  function gameplayLayerGate() {
    const layer = document.getElementById('relay-gameplay-new-layer');
    if (!layer) return;
    const tutorialFinished = document.body.dataset.relayTutorialFinished === '1';
    if (!tutorialFinished || !tutorialActive()) {
      layer.querySelector('.ng-chain')?.classList.remove('show');
      layer.querySelector('.ng-choice')?.classList.remove('show');
    }
  }

  function markTutorialFinished() {
    document.body.dataset.relayTutorialFinished = '1';
    window.dispatchEvent(new CustomEvent('relay:tutorial-finished'));
    gameplayLayerGate();
  }

  function safeJumpGuard() {
    const scene = window.__relayRunnerScene;
    const body = scene?.player?.body;
    if (!body || !scene) return;

    if (!scene.__relayJumpSafetyV1) {
      scene.__relayJumpSafetyV1 = {
        lastGroundedAt: -Infinity,
        lastJumpAt: -Infinity,
        canJump: false,
      };
    }

    const guard = scene.__relayJumpSafetyV1;
    const now = performance.now();
    const grounded = !!(body.blocked?.down || body.touching?.down);
    if (grounded) guard.lastGroundedAt = now;
    guard.canJump = grounded || now - guard.lastGroundedAt <= 160;
  }

  function installEvents() {
    window.addEventListener('relay:tutorial-complete', markTutorialFinished);
    window.addEventListener('relay:tutorial-finished', gameplayLayerGate);
    window.addEventListener('relay:runner-scene-ready', () => {
      safeJumpGuard();
      tutorialCardFix();
    });
    window.addEventListener('resize', tutorialCardFix, { passive: true });

    document.addEventListener('click', event => {
      const button = event.target.closest?.('[data-title-panel="tutorial"]');
      if (!button) return;
      window.setTimeout(tutorialCardFix, 30);
    }, true);

    document.addEventListener('pointerdown', event => {
      const button = event.target.closest?.('[data-mobile-action="jump"],[data-action="jump"]');
      if (!button) return;
      const scene = window.__relayRunnerScene;
      const body = scene?.player?.body;
      if (!body) return;
      const grounded = !!(body.blocked?.down || body.touching?.down);
      const safeWindow = scene.__relayJumpSafetyV1 && performance.now() - scene.__relayJumpSafetyV1.lastGroundedAt <= 160;
      if (!grounded && !safeWindow) event.stopImmediatePropagation();
    }, true);
  }

  function tick() {
    tutorialCardFix();
    gameplayLayerGate();
    safeJumpGuard();
    requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installEvents, { once: true });
  else installEvents();
  requestAnimationFrame(tick);
})();
