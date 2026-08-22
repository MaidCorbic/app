import { missions } from '../missions.js';
import { normalizeAndValidateMissions, validateMissionContracts } from './gameplay-contract.js';
import './mobile-controls-controller.js';

const contractErrors = normalizeAndValidateMissions(missions);
if (contractErrors.length) {
  console.error('[Relay Runner] Gameplay contract errors:', contractErrors);
}

const style = document.createElement('style');
style.id = 'relay-gameplay-mobile-hud-repair';
style.textContent = `
  /* One mobile presentation layer. It does not replace Phaser input or gameplay ownership. */
  @media (max-width: 768px) {
    body.is-touch #play .hud {
      position: fixed;
      inset: 0 0 auto 0;
      z-index: 90;
      min-height: 58px;
      padding-top: max(8px, env(safe-area-inset-top, 0px));
      padding-left: max(10px, env(safe-area-inset-left, 0px));
      padding-right: max(10px, env(safe-area-inset-right, 0px));
      box-sizing: border-box;
      pointer-events: none;
    }

    body.is-touch #play .hud > * { pointer-events: none; }
    body.is-touch #play .hud-route { min-width: 0; max-width: 46vw; }
    body.is-touch #play .hud-route b,
    body.is-touch #play .hud-route small { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    body.is-touch #play .hud-progress { min-width: 86px; max-width: 25vw; }
    body.is-touch #play .hud-actions { gap: 6px; pointer-events: none; }
    body.is-touch #play .hud-xp { display: none; }

    body.is-touch #pause {
      position: fixed !important;
      left: max(10px, env(safe-area-inset-left, 0px) + 8px) !important;
      right: auto !important;
      top: auto !important;
      bottom: max(108px, env(safe-area-inset-bottom, 0px) + 104px) !important;
      width: 48px !important;
      height: 48px !important;
      min-width: 48px !important;
      min-height: 48px !important;
      margin: 0 !important;
      z-index: 140 !important;
      pointer-events: auto !important;
      display: grid !important;
      place-items: center !important;
      border-radius: 14px !important;
      border: 1px solid rgba(141,244,255,.75) !important;
      background: linear-gradient(145deg, rgba(4,12,25,.96), rgba(12,35,57,.96)) !important;
      box-shadow: 0 0 12px rgba(141,244,255,.25), 0 12px 28px rgba(0,0,0,.38), inset 0 0 18px rgba(141,244,255,.06) !important;
    }

    body.is-touch .mobile-controls {
      position: fixed !important;
      left: max(8px, env(safe-area-inset-left, 0px) + 6px) !important;
      right: max(8px, env(safe-area-inset-right, 0px) + 6px) !important;
      bottom: max(10px, env(safe-area-inset-bottom, 0px) + 8px) !important;
      z-index: 130 !important;
      display: flex !important;
      align-items: flex-end !important;
      justify-content: space-between !important;
      gap: 10px !important;
      pointer-events: none !important;
    }

    body.is-touch .mobile-joystick,
    body.is-touch .mobile-actions,
    body.is-touch .mobile-actions button,
    body.is-touch .mobile-secondary-actions { pointer-events: auto !important; }

    body.is-touch .mobile-joystick {
      flex: 0 0 clamp(76px, 21vw, 94px) !important;
      width: clamp(76px, 21vw, 94px) !important;
      height: clamp(76px, 21vw, 94px) !important;
    }

    body.is-touch .mobile-actions {
      width: auto !important;
      max-width: min(58vw, 260px) !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: flex-end !important;
      gap: 5px !important;
    }

    body.is-touch .mobile-primary-actions {
      display: grid !important;
      grid-template-columns: repeat(2, clamp(46px, 13vw, 58px)) !important;
      grid-template-rows: repeat(2, clamp(46px, 13vw, 58px)) !important;
      gap: 5px !important;
    }

    body.is-touch .mobile-secondary-actions { display: flex !important; gap: 5px !important; }

    body.is-touch .mobile-controls button {
      width: clamp(46px, 13vw, 58px) !important;
      height: clamp(46px, 13vw, 58px) !important;
      min-width: 46px !important;
      min-height: 46px !important;
      margin: 0 !important;
      padding: 0 !important;
      border-radius: 14px !important;
      line-height: 1 !important;
      font-size: clamp(8px, 2.2vw, 10px) !important;
      touch-action: none !important;
      user-select: none !important;
      -webkit-user-select: none !important;
      -webkit-tap-highlight-color: transparent !important;
    }

    body.is-touch .mobile-secondary-actions button {
      width: clamp(38px, 10vw, 46px) !important;
      height: clamp(32px, 8vw, 40px) !important;
      min-width: 38px !important;
      min-height: 32px !important;
      border-radius: 10px !important;
      opacity: .9;
    }

    body.is-touch .mobile-controls button.is-active { transform: translateY(1px) scale(.96) !important; filter: brightness(1.25) !important; }

    body.is-touch .gameplay-event-hud {
      top: calc(max(64px, env(safe-area-inset-top, 0px) + 58px)) !important;
      left: 50% !important;
      width: min(78vw, 360px) !important;
      transform: translateX(-50%) scale(.88) !important;
      transform-origin: top center !important;
      z-index: 95 !important;
      pointer-events: none !important;
    }

    body.is-touch .world-marker,
    body.is-touch .input-guide { display: none !important; }
  }

  @media (max-width: 390px) {
    body.is-touch #play .hud-route { max-width: 42vw; }
    body.is-touch #play .hud-progress { min-width: 72px; }
    body.is-touch #pause { bottom: max(94px, env(safe-area-inset-bottom, 0px) + 90px) !important; }
    body.is-touch .mobile-controls { gap: 6px !important; }
    body.is-touch .mobile-primary-actions { gap: 4px !important; }
  }

  @media (max-height: 480px) and (orientation: landscape) {
    body.is-touch #play .hud { min-height: 48px; }
    body.is-touch #pause { bottom: max(82px, env(safe-area-inset-bottom, 0px) + 76px) !important; }
    body.is-touch .mobile-joystick { flex-basis: 68px !important; width: 68px !important; height: 68px !important; }
    body.is-touch .mobile-primary-actions { grid-template-columns: repeat(4, 46px) !important; grid-template-rows: 46px !important; }
    body.is-touch .mobile-secondary-actions { display: none !important; }
  }

  @media (prefers-reduced-motion: reduce) {
    body.is-touch #pause,
    body.is-touch .mobile-controls button { transition: none !important; }
  }
`;
document.head.appendChild(style);

function arrangeMobileActions() {
  const actions = document.querySelector('.mobile-actions');
  if (!actions || actions.dataset.relayArranged === 'true') return;

  const buttons = [...actions.querySelectorAll('[data-mobile-action]')];
  if (!buttons.length) return;

  const primaryNames = new Set(['jump', 'fire', 'sword', 'dash']);
  const primary = document.createElement('div');
  primary.className = 'mobile-primary-actions';
  const secondary = document.createElement('div');
  secondary.className = 'mobile-secondary-actions';

  buttons.forEach(button => {
    if (primaryNames.has(button.dataset.mobileAction)) primary.appendChild(button);
    else secondary.appendChild(button);
  });

  actions.replaceChildren(primary, secondary);
  actions.dataset.relayArranged = 'true';
}

function exposeRepairState() {
  window.__relayGameplayRepair = {
    version: 1,
    missions,
    validate: () => validateMissionContracts(missions)
  };
}

function boot() {
  arrangeMobileActions();
  exposeRepairState();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
