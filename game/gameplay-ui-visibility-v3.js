/* Gameplay UI Visibility V4
   Production presentation cleanup. Gameplay systems remain active in-world.
   No mutation observer, no frame polling, no control ownership changes. */
(() => {
  'use strict';

  const STYLE_ID = 'relay-gameplay-ui-visibility-v4';

  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;

  style.textContent = `
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

    #play .hud-route,
    #play .hud-progress,
    #play .hud-xp,
    #play .hud-actions>button{
      min-width:0!important;
      border:1px solid rgba(141,244,255,.26)!important;
      background:
        linear-gradient(
          145deg,
          rgba(4,13,25,.95),
          rgba(10,25,41,.82)
        )!important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.065),
        0 10px 24px rgba(0,0,0,.28),
        0 0 22px rgba(25,200,245,.055)!important;
      backdrop-filter:blur(10px);
    }

    #play .hud-route{
      border-radius:13px!important;
      padding:9px 12px!important;
    }

    #play .hud-progress{
      border-radius:13px!important;
      padding:9px 12px!important;
    }

    #play .hud-progress>div{
      height:5px!important;
      margin-top:5px!important;
      background:rgba(220,232,241,.075)!important;
    }

    #play .hud-progress i{
      box-shadow:
        0 0 14px rgba(141,244,255,.86),
        0 0 4px rgba(255,255,255,.28)!important;
    }

    #play .hud-xp{
      min-width:62px!important;
      border-radius:12px!important;
    }

    #play .hud-actions{
      gap:7px!important;
    }

    #play .hud-actions>button{
      width:44px!important;
      height:42px!important;
      border-radius:12px!important;
    }

    #play .hud-vital{
      display:none!important;
    }

    @media(hover:none) and (pointer:coarse){
      #play .mobile-controls{
        z-index:31!important;
      }

      #play .mobile-actions button[data-mobile-action="dash"]{
        border-color:rgba(174,227,127,.7)!important;
        color:#e9ffd7!important;
        box-shadow:
          0 0 20px rgba(174,227,127,.14),
          inset 0 0 12px rgba(174,227,127,.05)!important;
      }
    }

    @media(max-width:880px),(hover:none) and (pointer:coarse){
      #play .hud{
        grid-template-columns:minmax(0,1fr) auto!important;
        gap:7px!important;
        padding:9px 10px!important;
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

    @media(max-width:430px){
      #play .hud{
        padding:7px 8px!important;
        gap:6px!important;
      }

      #play .hud-route{
        padding:7px 8px!important;
        border-radius:10px!important;
      }

      #play .hud-route b{
        font-size:10px!important;
        max-width:46vw!important;
      }

      #play .hud-progress{
        padding:6px 8px!important;
        border-radius:10px!important;
      }

      #play .hud-xp{
        min-width:46px!important;
        padding:6px!important;
      }

      #play .hud-actions>button{
        width:40px!important;
        height:37px!important;
        border-radius:10px!important;
      }
    }

    @media(prefers-reduced-motion:reduce){
      #play .hud-progress i,
      #play .hud-actions>button{
        transition:none!important;
      }
    }
  `;

  document.head.appendChild(style);
})();
