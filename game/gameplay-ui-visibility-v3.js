/* Gameplay UI Visibility V3 — presentation-only cleanup.
   Keeps gameplay/input/save/progression owners unchanged.
   Removes redundant status overlays and exposes existing HUD features cleanly. */
(() => {
  'use strict';
  const STYLE_ID = 'relay-gameplay-ui-visibility-v3';
  const HOME = () => document.body.classList.contains('home-v3-active');

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* One authoritative DASH indication: the real gameplay action button/HUD.
         The legacy floating badges are redundant and must never leak into Home. */
      #relayDashHud,
      #relayP1DashStatus,
      .relay-p1-dash-status { display:none!important; visibility:hidden!important; opacity:0!important; pointer-events:none!important; }

      body.home-v3-active #relay-gameplay-new-layer,
      body.home-v3-active #relayP1Momentum,
      body.home-v3-active #relayDashHud,
      body.home-v3-active #relayP1DashStatus,
      body.home-v3-active .relay-p1-momentum,
      body.home-v3-active .relay-p1-dash-status { display:none!important; visibility:hidden!important; }

      /* Remove the old keyboard hint strip; the top HUD and touch controls are the
         active presentation surfaces. This does not affect input handling. */
      #play .input-guide { display:none!important; }

      /* Keep the existing gameplay HUD authoritative, but make its hierarchy tighter. */
      #play .hud {
        grid-template-columns:minmax(170px,1.15fr) minmax(150px,.88fr) auto!important;
        gap:9px!important;
        padding:11px 14px!important;
        align-items:start!important;
      }
      #play .hud-route,
      #play .hud-progress,
      #play .hud-xp,
      #play .hud-actions>button,
      #play .hud-vital {
        border:1px solid rgba(141,244,255,.26)!important;
        background:linear-gradient(145deg,rgba(4,13,25,.95),rgba(10,25,41,.82))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.065),0 10px 24px rgba(0,0,0,.28),0 0 22px rgba(25,200,245,.055)!important;
        backdrop-filter:blur(10px);
      }
      #play .hud-route { min-width:0!important; border-radius:13px!important; padding:9px 12px!important; }
      #play .hud-route small { font-size:8px!important; letter-spacing:.18em!important; }
      #play .hud-route b { font-size:12px!important; letter-spacing:.065em!important; }
      #play .hud-progress { min-width:0!important; border-radius:13px!important; padding:9px 12px!important; }
      #play .hud-progress>div { height:5px!important; margin-top:5px!important; background:rgba(220,232,241,.075)!important; }
      #play .hud-progress i { box-shadow:0 0 14px rgba(141,244,255,.86),0 0 4px rgba(255,255,255,.28)!important; }
      #play .hud-xp { min-width:62px!important; border-radius:12px!important; }
      #play .hud-actions { gap:7px!important; }
      #play .hud-actions>button { width:44px!important; height:42px!important; border-radius:12px!important; }

      /* Existing vital/ability cards are not new gameplay systems; when present,
         let them participate in the modern HUD instead of hiding them on mobile. */
      #play .hud-vital {
        display:grid!important;
        min-width:82px!important;
        padding:7px 9px!important;
        border-radius:11px!important;
        font:800 8px/1.1 ui-monospace,SFMono-Regular,Menlo,monospace!important;
      }
      #play .hud-vital span { align-items:center!important; }
      #play .hud-vital b { font-size:9px!important; }
      #play .hud-vital div { height:3px!important; margin-top:5px!important; border-radius:999px!important; overflow:hidden!important; background:rgba(220,232,241,.12)!important; }
      #play .hud-vital i { border-radius:999px!important; box-shadow:0 0 9px currentColor!important; }

      /* Keep live event feedback visible during gameplay, never over the Home. */
      #play #gameplayEventHud,
      #play .gameplay-event-hud { z-index:44!important; }
      body.home-v3-active #gameplayEventHud,
      body.home-v3-active .gameplay-event-hud { display:none!important; }

      /* Touch controls remain functional, but stay visually separated from HUD. */
      body.is-touch #play .mobile-controls { z-index:31!important; }
      body.is-touch #play .mobile-actions button[data-mobile-action="dash"] { border-color:rgba(174,227,127,.7)!important; color:#e9ffd7!important; box-shadow:0 0 20px rgba(174,227,127,.14),inset 0 0 12px rgba(174,227,127,.05)!important; }

      @media (max-width:880px),(hover:none) and (pointer:coarse) {
        #play .hud {
          grid-template-columns:minmax(0,1fr) auto!important;
          gap:7px!important;
          padding:9px 10px!important;
        }
        #play .hud-route { grid-column:1!important; }
        #play .hud-progress { grid-column:1!important; }
        #play .hud-actions { grid-column:2!important; grid-row:1 / span 2!important; }
        #play .hud-vital {
          min-width:72px!important;
          padding:6px 7px!important;
          font-size:7px!important;
        }
        #play .hud-vital b { font-size:8px!important; }
      }

      @media (max-width:430px) {
        #play .hud { padding:7px 8px!important; gap:6px!important; }
        #play .hud-route { padding:7px 8px!important; border-radius:10px!important; }
        #play .hud-route b { font-size:10px!important; max-width:46vw!important; }
        #play .hud-progress { padding:6px 8px!important; border-radius:10px!important; }
        #play .hud-xp { min-width:46px!important; padding:6px 6px!important; }
        #play .hud-actions>button { width:40px!important; height:37px!important; border-radius:10px!important; }
        #play .hud-vital { min-width:64px!important; padding:5px 6px!important; border-radius:9px!important; }
      }

      @media (max-width:360px) {
        #play .hud-vital { min-width:58px!important; font-size:6.5px!important; }
        #play .hud-vital b { font-size:7px!important; }
      }

      @media (prefers-reduced-motion:reduce) {
        #play .hud-progress i,
        #play .hud-actions>button { transition:none!important; }
      }
    `;
    document.head.appendChild(style);
  }

  function sync() {
    installStyle();
    const play = document.getElementById('play');
    if (!play) return;
    play.classList.toggle('gameplay-ui-v3', !HOME());
  }

  function boot() {
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { subtree:true, childList:true, attributes:true, attributeFilter:['class','style','hidden'] });
    window.addEventListener('resize', sync, { passive:true });
    window.addEventListener('orientationchange', sync, { passive:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
