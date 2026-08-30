/* Gameplay UI Visibility V5
   Presentation cleanup only. Legacy feature HUDs are hidden, while gameplay systems remain active.
   Active Mission/Signals HUD layout is owned by presentation-final-v1.css. */
(() => {
  'use strict';
  const STYLE_ID='relay-gameplay-ui-visibility-v5';
  if(document.getElementById(STYLE_ID)) return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
    #gameplay-v11-panel,#gameplay-v12-panel,#gameplay-v13-panel,#relay-gameplay-new-layer,#relayP1Momentum,#relayP1DashStatus,#relayDashHud,.relay-p1-momentum,.relay-p1-dash-status,#gameplayEventHud,.gameplay-event-hud,
    #play .input-guide,#play .energy-bar,#play .energy-meter,#play .energy-hud,#play [data-hud-energy],#play [data-energy-hud],#play [id*="energy-bar" i],#play [class*="energy-bar" i],#play [class*="energy-meter" i],#play .hud-vital,
    #play [data-legacy-hud="true"],#play .legacy-hud,#play .legacy-hud-panel,#play .debug-hud,#play .developer-hud,
    #play .world-marker{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}
    /* Do not style the active Mission/Signals HUD here: presentation-final-v1.css owns it. */
    body.is-touch #play .mobile-controls{z-index:31!important}
    body.is-touch #play .mobile-actions button[data-mobile-action="dash"]{border-color:rgba(174,227,127,.7)!important;color:#e9ffd7!important;box-shadow:0 0 20px rgba(174,227,127,.14),inset 0 0 12px rgba(174,227,127,.05)!important}
  `;
  document.head.appendChild(style);
})();