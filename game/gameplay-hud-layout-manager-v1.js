/* GAMEPLAY HUD LAYOUT MANAGER V1
   One owner for the presentation geometry of gameplay overlays.
   Gameplay state/input remains untouched. The manager only coordinates layout.
*/
(() => {
  if (typeof window === 'undefined' || window.__relayGameplayHudLayoutV1) return;
  window.__relayGameplayHudLayoutV1 = true;

  const STYLE_ID = 'relay-gameplay-hud-layout-v1-style';
  const ROOT = 'play';
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const isTouch = () => window.matchMedia?.('(hover:none) and (pointer:coarse)').matches === true;
  const isLandscape = () => window.innerWidth >= window.innerHeight;

  function scene() {
    return window.__relayRunnerScene || window.game?.scene?.getScene?.('RunnerScene') || null;
  }

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
/* ---------- typography: compact, intentional tracking ---------- */
#play .hud,
#play .hud *,
#relay-gameplay-new-layer,
#relay-gameplay-new-layer * {
  font-stretch:normal;
  font-kerning:normal;
  text-rendering:optimizeLegibility;
}
#play .hud { letter-spacing:normal !important; }
#play .hud small,
#play .hud .label,
#play .hud .eyebrow { letter-spacing:.06em !important; }
#play .hud b,
#play .hud strong,
#play .hud .value { letter-spacing:.01em !important; }
#relay-gameplay-new-layer .ng-kicker,
#relay-gameplay-new-layer .ng-choice-title,
#relay-gameplay-new-layer .ng-title { letter-spacing:.08em !important; }
#relay-gameplay-new-layer .ng-value { letter-spacing:-.01em !important; }
#relay-gameplay-new-layer .ng-event { letter-spacing:.06em !important; }
#relay-gameplay-new-layer button b { letter-spacing:.04em !important; }
#relay-gameplay-new-layer button small { letter-spacing:.02em !important; }

/* ---------- unified geometry ---------- */
#play { --relay-safe-x:max(12px,env(safe-area-inset-left,0px)); --relay-safe-r:max(12px,env(safe-area-inset-right,0px)); --relay-safe-b:max(12px,env(safe-area-inset-bottom,0px)); }

/* The choice layer belongs to the center lane, not the control lane. */
#relay-gameplay-new-layer .ng-choice {
  left:50% !important;
  width:min(460px,calc(100vw - 32px)) !important;
  bottom:clamp(108px,15vh,150px) !important;
}
#relay-gameplay-new-layer .ng-grid { gap:10px !important; }
#relay-gameplay-new-layer button { min-height:54px !important; padding:10px 12px !important; }

/* Desktop: centered mission lane with utility/control corners. */
@media (min-width:769px) {
  #relay-gameplay-new-layer .ng-chain { top:92px !important; }
  #relay-gameplay-new-layer .ng-event { top:44% !important; }
  #relay-gameplay-new-layer .ng-choice { bottom:clamp(92px,12vh,132px) !important; }
  #relay-gameplay-new-layer .ng-recap { right:clamp(18px,2vw,34px) !important; }
}

/* Primary touch landscape: mission/cargo center lane, controls stay at edges. */
@media (hover:none) and (pointer:coarse) and (orientation:landscape) {
  #relay-gameplay-new-layer .ng-chain {
    top:clamp(58px,12vh,82px) !important;
    left:50% !important;
  }
  #relay-gameplay-new-layer .ng-event {
    top:calc(var(--relay-mission-bottom,46vh) + 8px) !important;
    transform:translate(-50%,-50%) scale(.9);
  }
  #relay-gameplay-new-layer .ng-event.show { transform:translate(-50%,-50%) scale(1); }
  #relay-gameplay-new-layer .ng-choice {
    top:calc(var(--relay-mission-bottom,52vh) + 10px) !important;
    bottom:auto !important;
    width:min(440px,42vw) !important;
  }
  #relay-gameplay-new-layer .ng-choice-title { margin-bottom:6px !important; }
  #relay-gameplay-new-layer .ng-grid { gap:8px !important; }
  #relay-gameplay-new-layer button { min-height:50px !important; }
  #relay-gameplay-new-layer .ng-recap { display:none !important; }

  /* Cargo follows the mission lane. It is never anchored to the joystick. */
  #cargoIntegrityV2 {
    left:50% !important;
    right:auto !important;
    top:calc(var(--relay-mission-bottom,52vh) + 10px) !important;
    bottom:auto !important;
    transform:translateX(-50%) !important;
    width:min(230px,28vw) !important;
    max-width:230px !important;
    z-index:1080 !important;
  }
  #cargoIntegrityV2.is-visible { transform:translateX(-50%) !important; }

  /* Keep the physical controls at the two bottom corners. */
  #play > .mobile-controls { z-index:1100 !important; }
  #play > .mobile-controls .mobile-joystick { z-index:1101 !important; }
  #play > .mobile-controls .mobile-actions { z-index:1102 !important; }
}

/* Small landscape phones: compress information, never the touch targets. */
@media (hover:none) and (pointer:coarse) and (orientation:landscape) and (max-height:520px) {
  #relay-gameplay-new-layer .ng-chain { top:54px !important; }
  #relay-gameplay-new-layer .ng-choice { width:min(390px,48vw) !important; top:calc(var(--relay-mission-bottom,48vh) + 8px) !important; }
  #relay-gameplay-new-layer button { min-height:46px !important; padding:8px 10px !important; }
  #cargoIntegrityV2 { width:200px !important; top:calc(var(--relay-mission-bottom,48vh) + 8px) !important; }
}

/* Portrait: intentionally basic; center lane stays clear and controls own the bottom. */
@media (hover:none) and (pointer:coarse) and (orientation:portrait) {
  #relay-gameplay-new-layer .ng-chain { top:84px !important; }
  #relay-gameplay-new-layer .ng-event { top:38% !important; }
  #relay-gameplay-new-layer .ng-choice {
    top:auto !important;
    bottom:calc(118px + env(safe-area-inset-bottom,0px)) !important;
    width:min(330px,calc(100vw - 28px)) !important;
  }
  #relay-gameplay-new-layer .ng-recap { display:none !important; }
  #relay-gameplay-new-layer .ng-grid { grid-template-columns:1fr !important; }
  #relay-gameplay-new-layer button { min-height:48px !important; }

  #cargoIntegrityV2 {
    left:var(--relay-safe-x) !important;
    right:auto !important;
    top:auto !important;
    bottom:calc(78px + env(safe-area-inset-bottom,0px)) !important;
    transform:none !important;
    width:min(205px,calc(100vw - 104px)) !important;
  }
}

/* Do not allow any gameplay overlay to create horizontal scroll. */
#play,
#relay-gameplay-new-layer { max-width:100vw; overflow-x:clip; }

@media (prefers-reduced-motion:reduce) {
  #relay-gameplay-new-layer .ng-chain,
  #relay-gameplay-new-layer .ng-event,
  #relay-gameplay-new-layer .ng-choice { transition:none !important; }
}
`;
    document.head.appendChild(style);
  }

  function missionBottom() {
    const s = scene();
    const c = s?.__missionObjectiveState?.c;
    if (!c?.active) return null;
    const y = Number(c.y) || 0;
    const height = (Number(c.height) || 166) * (Number(c.scaleX) || 1);
    return y + height;
  }

  function apply() {
    installStyle();
    const play = document.getElementById(ROOT);
    if (!play) return;
    const landscape = isLandscape();
    const touch = isTouch();
    play.dataset.hudMode = touch ? (landscape ? 'touch-landscape' : 'touch-portrait') : (landscape ? 'desktop-landscape' : 'desktop-portrait');
    const bottom = missionBottom();
    if (bottom != null) {
      play.style.setProperty('--relay-mission-bottom', `${Math.round(bottom)}px`);
    }
  }

  let raf = 0;
  const schedule = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; apply(); });
  };

  window.addEventListener('resize', schedule, { passive:true });
  window.addEventListener('orientationchange', () => setTimeout(schedule, 80), { passive:true });
  window.addEventListener('relay:runner-scene-ready', schedule, { passive:true });
  window.addEventListener('relay:gameplay-core-ready', schedule, { passive:true });
  window.addEventListener('relay:new-gameplay-run-start', schedule, { passive:true });
  window.addEventListener('relay:mission-complete', schedule, { passive:true });
  setInterval(apply, 220);
  apply();
})();
