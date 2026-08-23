(() => {
  'use strict';
  if (window.__relayTutorialMobileLayoutFixV1) return;
  window.__relayTutorialMobileLayoutFixV1 = true;

  const style = document.createElement('style');
  style.id = 'relay-tutorial-mobile-layout-fix-v1';
  style.textContent = `
    /* Tutorial is presentation only. Mobile controls own the bottom safe area. */
    #relayTutorialOnboardingV2 {
      z-index: 1000 !important;
      pointer-events: none !important;
    }

    #relayTutorialOnboardingV2 .tutorial-card,
    #relayTutorialOnboardingV2 .tutorial-map {
      pointer-events: none !important;
    }

    @media (max-width: 700px) {
      #relayTutorialOnboardingV2 .tutorial-map {
        top: max(10px, env(safe-area-inset-top)) !important;
        left: 50% !important;
        right: auto !important;
        transform: translateX(-50%) !important;
        width: min(92vw, 390px) !important;
      }

      /* Never use the bottom control zone for tutorial copy. */
      #relayTutorialOnboardingV2 .tutorial-card {
        top: clamp(270px, 23vh, 360px) !important;
        bottom: auto !important;
        left: 50% !important;
        right: auto !important;
        transform: translateX(-50%) !important;
        width: min(82vw, 520px) !important;
        max-height: 168px !important;
        overflow: auto !important;
        box-sizing: border-box !important;
        padding: 14px 16px !important;
        border-radius: 16px !important;
        background: linear-gradient(145deg, rgba(5,18,32,.95), rgba(2,8,16,.97)) !important;
        box-shadow: 0 18px 50px rgba(0,0,0,.38), 0 0 28px rgba(73,222,255,.08) !important;
      }

      #relayTutorialOnboardingV2 .tutorial-kicker {
        margin-bottom: 5px !important;
        font-size: 8px !important;
      }

      #relayTutorialOnboardingV2 .tutorial-card h2 {
        font-size: clamp(20px, 5.5vw, 30px) !important;
        line-height: 1 !important;
      }

      #relayTutorialOnboardingV2 .tutorial-copy {
        margin: 8px auto !important;
        font-size: 11px !important;
        line-height: 1.35 !important;
      }

      #relayTutorialOnboardingV2 .tutorial-key {
        margin-top: 1px !important;
        padding: 6px 9px !important;
        font-size: 8px !important;
      }

      #relayTutorialOnboardingV2 .tutorial-progress {
        margin-top: 10px !important;
      }

      #relayTutorialOnboardingV2 .tutorial-progress i {
        width: 22px !important;
      }
    }

    @media (max-width: 700px) and (max-height: 720px) {
      #relayTutorialOnboardingV2 .tutorial-card {
        top: 150px !important;
        max-height: 145px !important;
      }
    }

    @media (orientation: landscape) and (max-height: 600px) {
      #relayTutorialOnboardingV2 .tutorial-card {
        top: 104px !important;
        width: min(62vw, 560px) !important;
        max-height: 116px !important;
        padding: 9px 14px !important;
      }
    }

    /* The bottom input layer always wins the stacking order. */
    body.is-touch .mobile-controls,
    body.is-touch #relayMobileControls,
    body.is-touch .relay-mobile-dpad,
    body.is-touch .mobile-actions,
    [data-mobile-joystick] {
      z-index: 2147483001 !important;
    }
  `;
  document.head.appendChild(style);
})();
