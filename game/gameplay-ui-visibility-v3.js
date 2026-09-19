/* Gameplay UI Visibility V5
   Production presentation cleanup.
   Visibility + responsive behavior only.
   HUD visual styling is owned by hud-v2.css.
   Gameplay systems remain active in-world.
   No mutation observer, no frame polling, no control ownership changes. */
(() => {
  'use strict';

  const STYLE_ID = 'relay-gameplay-ui-visibility-v5';

  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;

  style.textContent = `
    /* =====================================================
       HIDE LEGACY / DUPLICATE GAMEPLAY UI
       ===================================================== */

    #gameplay-v11-panel,
    #gameplay-v12-panel,
    #gameplay-v13-panel,
    #relay-gameplay-new-layer,
    #relayP1Momentum,
    #relayP1DashStatus,
    #relayDashHud,
    .relay-p1-momentum,
    .relay-p1-dash-status{
      display:none!important;
      visibility:hidden!important;
      opacity:0!important;
      pointer-events:none!important;
    }


    /* =====================================================
       HIDE LEGACY ENERGY / INPUT HUD
       ===================================================== */

    #play .input-guide,
    #play .energy-bar,
    #play .energy-meter,
    #play .energy-hud,
    #play [data-hud-energy],
    #play [data-energy-hud],
    #play [id*="energy-bar" i],
    #play [class*="energy-bar" i],
    #play [class*="energy-meter" i]{
      display:none!important;
      visibility:hidden!important;
      opacity:0!important;
      pointer-events:none!important;
    }


    /* =====================================================
       HIDE VITAL HUD
       ===================================================== */

    #play .hud-vital{
      display:none!important;
      visibility:hidden!important;
      opacity:0!important;
      pointer-events:none!important;
    }


    /* =====================================================
       MOBILE CONTROLS
       Gameplay controls remain functional.
       ===================================================== */

    @media(hover:none) and (pointer:coarse){

      #play .mobile-controls{
        z-index:31!important;
      }

      #play .mobile-actions button[data-mobile-action="dash"]{
        border-color:rgba(174,227,127,.70)!important;
        color:#e9ffd7!important;

        box-shadow:
          0 0 20px rgba(174,227,127,.14),
          inset 0 0 12px rgba(174,227,127,.05)!important;
      }
    }


    /* =====================================================
       TABLET / PORTRAIT
       Layout only.
       HUD visual styling remains in hud-v2.css.
       ===================================================== */

    @media(max-width:880px) and (orientation:portrait){

      #play .hud{
        grid-template-columns:minmax(0,1fr) auto!important;
        gap:8px!important;
        padding:8px 9px!important;
      }

      #play .hud-route{
        grid-column:1!important;
      }

      #play .hud-progress{
        grid-column:1!important;
      }

      #play .hud-actions{
        grid-column:2!important;
        grid-row:1 / span 2!important;
      }
    }


    /* =====================================================
       TABLET / LANDSCAPE
       Layout only.
       ===================================================== */

    @media(max-width:880px) and (orientation:landscape){

      #play .hud{
        grid-template-columns:
          minmax(0,1fr)
          minmax(106px,124px)
          auto!important;

        grid-template-rows:auto!important;

        gap:6px!important;
        padding:7px 10px!important;
      }

      #play .hud-route{
        grid-column:1!important;
        grid-row:1!important;
      }

      #play .hud-progress{
        display:grid!important;
        grid-column:2!important;
        grid-row:1!important;
      }

      #play .hud-actions{
        grid-column:3!important;
        grid-row:1!important;
      }

      #play .hud-xp{
        display:flex!important;
      }
    }


    /* =====================================================
       SMALL PHONES
       Layout only.
       ===================================================== */

    @media(max-width:430px){

      #play .hud{
        padding:7px 8px!important;
        gap:6px!important;
      }

      #play .hud-route{
        min-width:0!important;
      }

      #play .hud-route b{
        max-width:46vw!important;
      }

      #play .hud-progress{
        width:100%!important;
      }

      #play .hud-xp{
        min-width:46px!important;
      }

      #play .hud-actions{
        gap:7px!important;
      }
    }


    /* =====================================================
       REDUCED MOTION
       Do not disable gameplay behavior.
       Only visual transitions are reduced.
       ===================================================== */

    @media(prefers-reduced-motion:reduce){

      #play .hud,
      #play .hud *,
      #play .mobile-controls,
      #play .mobile-controls *{
        scroll-behavior:auto!important;
      }

      #play .hud-route .route-dot,
      #play .hud-route .route-dot::after{
        animation:none!important;
      }

      #play .hud-actions>button{
        transition:none!important;
      }
    }
  `;

  document.head.appendChild(style);
})();