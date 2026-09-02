/* Relay Runner — final visible UI contract adapter.
 * Presentation only. Never owns gameplay state, physics, progression or input.
 */
(() => {
  'use strict';
  const STYLE_ID = 'relay-final-visible-ui-v4';

  function install() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* HOME: one canonical Home V3. Keep legacy DOM available for JS compatibility,
         but never let its duplicate controls render. */
      #intro.home-v3 > .main-menu,
      #intro.home-v3 > .info-launcher { display:none!important; visibility:hidden!important; opacity:0!important; pointer-events:none!important; }

      /* GAMEPLAY: one visual contract. */
      #game #play { position:relative!important; overflow:hidden!important; }
      #game #play .hud { z-index:40!important; pointer-events:none!important; }
      #game #play .hud > * { pointer-events:auto!important; }
      #game #play .world-marker { z-index:45!important; pointer-events:none!important; }
      #game #play .mobile-controls { z-index:60!important; pointer-events:none!important; }
      #game #play .mobile-controls > * { pointer-events:auto!important; }
      #game #play #gameplayEventHud { z-index:70!important; }
      #game #play .rotate-prompt { z-index:90!important; }

      /* Do not let secondary desktop/debug presentation cover the live game. */
      #game #play .input-guide,
      #game #play .hud-vital,
      #game #play #relayP2CharacterHud,
      #game #play .relay-debug-hud,
      #game #play [data-relay-debug-hud] { display:none!important; visibility:hidden!important; opacity:0!important; pointer-events:none!important; }

      /* Mobile: full-width gameplay lanes, no bottom collision. */
      @media (max-width:900px), (hover:none) and (pointer:coarse) {
        #game #play .hud { padding:8px 10px!important; display:grid!important; grid-template-columns:minmax(0,1fr) auto!important; grid-template-rows:auto auto!important; gap:6px!important; align-items:start!important; }
        #game #play .hud-route { grid-column:1!important; grid-row:1!important; min-width:0!important; width:min(72vw,300px)!important; }
        #game #play .hud-progress { grid-column:1!important; grid-row:2!important; width:min(58vw,230px)!important; }
        #game #play .hud-actions { grid-column:2!important; grid-row:1 / span 2!important; justify-self:end!important; display:flex!important; gap:6px!important; }
        #game #play .hud-actions > .hud-xp { min-width:48px!important; }
        #game #play .hud-actions > #pause { display:none!important; }

        /* Mission card stays in the upper-left, clear of player and controls. */
        #game #play .world-marker { left:10px!important; top:72px!important; bottom:auto!important; width:min(54vw,230px)!important; max-width:230px!important; }

        /* Joystick: fixed lower-left safe area. */
        body.is-touch #game #play .mobile-controls {
          position:absolute!important;
          left:max(12px,env(safe-area-inset-left,0px) + 8px)!important;
          right:max(12px,env(safe-area-inset-right,0px) + 8px)!important;
          bottom:max(14px,env(safe-area-inset-bottom,0px) + 12px)!important;
          width:auto!important;
          height:100px!important;
          display:flex!important;
          align-items:flex-end!important;
          justify-content:space-between!important;
          gap:12px!important;
          box-sizing:border-box!important;
        }
        body.is-touch #game #play .mobile-joystick {
          flex:0 0 clamp(78px,21vw,94px)!important;
          width:clamp(78px,21vw,94px)!important;
          height:clamp(78px,21vw,94px)!important;
          margin:0!important;
        }
        body.is-touch #game #play .mobile-actions {
          flex:0 0 auto!important;
          width:auto!important;
          max-width:58vw!important;
          display:grid!important;
          grid-template-columns:repeat(3,clamp(42px,12vw,52px))!important;
          grid-auto-rows:clamp(42px,12vw,52px)!important;
          gap:6px!important;
          margin:0!important;
        }
        body.is-touch #game #play .mobile-actions button {
          width:100%!important;
          height:100%!important;
          min-width:0!important;
          min-height:0!important;
          margin:0!important;
          border-radius:13px!important;
          box-sizing:border-box!important;
          font-size:clamp(8px,2.25vw,10px)!important;
          letter-spacing:.25px!important;
          touch-action:none!important;
        }
        body.is-touch #game #play .mobile-actions small { display:none!important; }

        /* Pause + Settings: top-right utility pair, never competing with joystick/actions. */
        body.is-touch #mobileBottomHud {
          position:fixed!important;
          top:max(66px,env(safe-area-inset-top,0px) + 58px)!important;
          right:max(10px,env(safe-area-inset-right,0px) + 8px)!important;
          left:auto!important;
          bottom:auto!important;
          width:auto!important;
          height:48px!important;
          display:flex!important;
          align-items:center!important;
          justify-content:flex-end!important;
          gap:7px!important;
          pointer-events:none!important;
          z-index:75!important;
        }
        body.is-touch #mobileBottomHud:not(.is-active) { display:none!important; }
        body.is-touch #mobileBottomHud .mobile-menu-button {
          width:44px!important;
          height:44px!important;
          margin:0!important;
          border-radius:12px!important;
          pointer-events:auto!important;
          box-sizing:border-box!important;
        }
        body.is-touch #mobileBottomHud .mobile-menu-button small { font-size:6px!important; letter-spacing:.9px!important; }
        body.is-touch #mobileBottomHud .mobile-menu-pause { border-color:rgba(141,244,255,.58)!important; color:#dffcff!important; }
        body.is-touch #mobileBottomHud .mobile-menu-settings { display:grid!important; visibility:visible!important; opacity:1!important; border-color:rgba(255,208,110,.68)!important; color:#fff0b5!important; }
      }

      @media (max-width:520px) {
        #game #play .hud { padding:7px 8px!important; }
        #game #play .hud-route { width:min(64vw,220px)!important; }
        #game #play .hud-route b { max-width:42vw!important; font-size:9px!important; }
        #game #play .hud-progress { width:min(52vw,190px)!important; }
        #game #play .hud-actions > .hud-xp { min-width:44px!important; padding:5px 6px!important; }
        #game #play .world-marker { top:64px!important; width:min(52vw,196px)!important; }
        body.is-touch #game #play .mobile-controls { height:88px!important; }
        body.is-touch #game #play .mobile-joystick { flex-basis:76px!important; width:76px!important; height:76px!important; }
        body.is-touch #game #play .mobile-actions { grid-template-columns:repeat(3,43px)!important; grid-auto-rows:43px!important; gap:5px!important; max-width:calc(100vw - 102px)!important; }
        body.is-touch #game #play .mobile-actions button { border-radius:12px!important; }
        body.is-touch #mobileBottomHud .mobile-menu-button { width:42px!important; height:42px!important; }
      }

      @media (max-height:560px) and (orientation:landscape) {
        #game #play .hud { padding:6px 9px!important; }
        #game #play .world-marker { top:54px!important; width:190px!important; }
        body.is-touch #game #play .mobile-controls { bottom:max(8px,env(safe-area-inset-bottom,0px) + 6px)!important; height:76px!important; }
        body.is-touch #game #play .mobile-joystick { width:68px!important; height:68px!important; flex-basis:68px!important; }
        body.is-touch #game #play .mobile-actions { grid-template-columns:repeat(3,40px)!important; grid-auto-rows:40px!important; gap:4px!important; }
        body.is-touch #mobileBottomHud { top:max(52px,env(safe-area-inset-top,0px) + 44px)!important; height:40px!important; }
        body.is-touch #mobileBottomHud .mobile-menu-button { width:38px!important; height:38px!important; }
      }
    `;
    document.head.appendChild(style);
  }

  function reinforce() {
    const intro = document.getElementById('intro');
    if (intro?.classList.contains('home-v3')) {
      document.querySelectorAll('#intro.home-v3 > .main-menu, #intro.home-v3 > .info-launcher').forEach(el => {
        el.style.setProperty('display','none','important');
        el.style.setProperty('visibility','hidden','important');
        el.style.setProperty('pointer-events','none','important');
      });
    }
  }

  install();
  reinforce();
  [0, 250, 750, 1500, 3000].forEach(ms => setTimeout(reinforce, ms));
  new MutationObserver(reinforce).observe(document.body, {subtree:true, childList:true, attributes:true, attributeFilter:['class','style']});
})();
