/* GAMEPLAY HUD LAYOUT MANAGER V2
   One presentation owner for gameplay overlays. Gameplay state/input is untouched.
   Landscape is primary. Portrait is intentionally compact.
*/
(() => {
  if (typeof window === 'undefined' || window.__relayGameplayHudLayoutV2) return;
  window.__relayGameplayHudLayoutV2 = true;

  const STYLE_ID = 'relay-gameplay-hud-layout-v2-style';
  const isTouch = () => window.matchMedia?.('(hover:none) and (pointer:coarse)').matches === true;
  const landscape = () => innerWidth >= innerHeight;
  const getScene = () => window.__relayRunnerScene || window.game?.scene?.getScene?.('RunnerScene') || null;

  function install() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
#play{--relay-safe-x:max(14px,env(safe-area-inset-left,0px));--relay-safe-r:max(14px,env(safe-area-inset-right,0px));--relay-safe-b:max(14px,env(safe-area-inset-bottom,0px));--relay-top-h:64px}
#play .hud,#play .hud *,#relay-gameplay-new-layer,#relay-gameplay-new-layer *{font-stretch:normal;font-kerning:normal;text-rendering:optimizeLegibility}
#play .hud{letter-spacing:normal!important}
#play .hud small,#play .hud .label,#play .hud .eyebrow{letter-spacing:.055em!important}
#play .hud b,#play .hud strong,#play .hud .value{letter-spacing:0!important}
#relay-gameplay-new-layer .ng-kicker,#relay-gameplay-new-layer .ng-choice-title,#relay-gameplay-new-layer .ng-title{letter-spacing:.07em!important}
#relay-gameplay-new-layer .ng-value{letter-spacing:0!important}
#relay-gameplay-new-layer .ng-event{letter-spacing:.055em!important}
#relay-gameplay-new-layer button b{letter-spacing:.035em!important}
#relay-gameplay-new-layer button small{letter-spacing:.015em!important}

/* Mission + cargo form the left utility stack. */
#cargoIntegrityV2{box-sizing:border-box!important}

/* Signals sit in the top telemetry row, immediately beside Momentum/Flow. */
#play > .hud .hud-progress{position:fixed!important;top:max(8px,env(safe-area-inset-top,0px) + 4px)!important;left:calc(50% - 150px)!important;width:126px!important;min-width:0!important;height:48px!important;box-sizing:border-box!important;z-index:1200!important}
#relay-gameplay-new-layer .ng-chain{top:8px!important;left:50%!important;z-index:1201!important}

/* Settings/menu belongs to the far right corner, never inside the central HUD cluster. */
#play > .hud .hud-actions{position:fixed!important;top:max(8px,env(safe-area-inset-top,0px) + 4px)!important;right:var(--relay-safe-r)!important;z-index:1202!important;display:flex!important;gap:6px!important}
#play > .hud .hud-actions .hud-xp{width:48px!important;min-width:48px!important;height:48px!important;box-sizing:border-box!important}
#play > .hud .hud-actions .pause-button{width:48px!important;min-width:48px!important;height:48px!important}

/* Landscape: mission starts under Old Quarter, cargo directly below it. */
@media (hover:none) and (pointer:coarse) and (orientation:landscape){
  #play .hud{pointer-events:none!important}
  #play > .hud .hud-progress,#play > .hud .hud-actions{pointer-events:auto!important}
  #play > .hud .hud-route{position:fixed!important;top:max(8px,env(safe-area-inset-top,0px) + 4px)!important;left:var(--relay-safe-x)!important;width:220px!important;min-width:0!important;height:48px!important;box-sizing:border-box!important;z-index:1200!important}
  #play > .hud .hud-route b{max-width:180px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;letter-spacing:0!important}
  #play > .hud .hud-progress{left:calc(50% - 156px)!important;width:126px!important}
  #play > .hud .hud-xp{display:flex!important}

  #cargoIntegrityV2{left:var(--relay-safe-x)!important;right:auto!important;top:calc(var(--relay-mission-bottom,210px) + 10px)!important;bottom:auto!important;transform:none!important;width:min(285px,25vw)!important;max-width:285px!important;z-index:1150!important}
  #cargoIntegrityV2.is-visible{transform:none!important}

  /* Choice overlay is below the mission/cargo stack, never through the controls. */
  #relay-gameplay-new-layer .ng-choice{left:50%!important;top:auto!important;bottom:calc(var(--relay-safe-b) + 74px)!important;width:min(460px,42vw)!important}
  #relay-gameplay-new-layer .ng-choice.show{transform:translate(-50%,0)!important}
  #relay-gameplay-new-layer .ng-event{top:46%!important}
}

/* Short landscape phones: tighten dimensions without shrinking readable type. */
@media (hover:none) and (pointer:coarse) and (orientation:landscape) and (max-height:520px){
  #play > .hud .hud-route{width:205px!important;height:44px!important;padding:5px 9px!important}
  #play > .hud .hud-progress{width:112px!important;height:44px!important;left:calc(50% - 138px)!important;padding:5px 8px!important}
  #play > .hud .hud-actions{top:max(6px,env(safe-area-inset-top,0px) + 3px)!important}
  #play > .hud .hud-actions .hud-xp,#play > .hud .hud-actions .pause-button{width:44px!important;min-width:44px!important;height:44px!important}
  #cargoIntegrityV2{width:240px!important;top:calc(var(--relay-mission-bottom,188px) + 8px)!important}
}

/* Portrait: compact top telemetry, centred mission, cargo beneath mission, controls stay clear. */
@media (hover:none) and (pointer:coarse) and (orientation:portrait){
  #play > .hud .hud-route{position:fixed!important;top:max(6px,env(safe-area-inset-top,0px) + 3px)!important;left:var(--relay-safe-x)!important;width:min(190px,45vw)!important;height:42px!important;z-index:1200!important}
  #play > .hud .hud-progress{top:max(6px,env(safe-area-inset-top,0px) + 3px)!important;left:calc(50% - 66px)!important;width:96px!important;height:42px!important}
  #play > .hud .hud-actions{top:max(6px,env(safe-area-inset-top,0px) + 3px)!important;right:var(--relay-safe-r)!important}
  #play > .hud .hud-actions .hud-xp{width:42px!important;min-width:42px!important;height:42px!important}
  #play > .hud .hud-actions .pause-button{width:42px!important;min-width:42px!important;height:42px!important}
  #cargoIntegrityV2{left:50%!important;right:auto!important;top:calc(var(--relay-mission-bottom,230px) + 8px)!important;bottom:auto!important;transform:translateX(-50%)!important;width:min(250px,calc(100vw - 54px))!important;max-width:250px!important}
  #cargoIntegrityV2.is-visible{transform:translateX(-50%)!important}
  #relay-gameplay-new-layer .ng-chain{top:58px!important}
  #relay-gameplay-new-layer .ng-choice{bottom:calc(var(--relay-safe-b) + 112px)!important;width:min(320px,calc(100vw - 30px))!important}
}

/* Desktop: same hierarchy, larger breathing room, still left mission/cargo. */
@media(min-width:769px){
  #play > .hud .hud-route{position:fixed!important;top:max(10px,env(safe-area-inset-top,0px) + 4px)!important;left:clamp(18px,2vw,32px)!important;width:250px!important;height:52px!important;z-index:1200!important}
  #play > .hud .hud-progress{top:max(10px,env(safe-area-inset-top,0px) + 4px)!important;left:calc(50% - 160px)!important;width:140px!important;height:52px!important}
  #play > .hud .hud-actions{top:max(10px,env(safe-area-inset-top,0px) + 4px)!important;right:clamp(18px,2vw,32px)!important}
  #play > .hud .hud-actions .hud-xp,#play > .hud .hud-actions .pause-button{width:52px!important;min-width:52px!important;height:52px!important}
  #cargoIntegrityV2{left:clamp(18px,2vw,32px)!important;top:calc(var(--relay-mission-bottom,230px) + 12px)!important;bottom:auto!important;width:300px!important;max-width:300px!important;transform:none!important}
}

/* Avoid accidental overlap with the touch control deck. */
#play,#relay-gameplay-new-layer{max-width:100vw;overflow-x:clip}
@media(prefers-reduced-motion:reduce){#relay-gameplay-new-layer .ng-chain,#relay-gameplay-new-layer .ng-event,#relay-gameplay-new-layer .ng-choice{transition:none!important}}
`;
    document.head.appendChild(s);
  }

  function missionBottom() {
    const c = getScene()?.__missionObjectiveState?.c;
    if (!c?.active) return null;
    const y = Number(c.y) || 0;
    const h = Number(c.height) || 166;
    const scale = Number(c.scaleY) || Number(c.scaleX) || 1;
    return y + h * scale;
  }

  function apply() {
    install();
    const play = document.getElementById('play');
    if (!play) return;
    const touch = isTouch();
    const land = landscape();
    play.dataset.hudMode = touch ? (land ? 'touch-landscape' : 'touch-portrait') : (land ? 'desktop-landscape' : 'desktop-portrait');
    const bottom = missionBottom();
    if (bottom != null) play.style.setProperty('--relay-mission-bottom', `${Math.round(bottom)}px`);
    const choice = document.querySelector('#relay-gameplay-new-layer .ng-choice');
    play.classList.toggle('relay-choice-active', !!choice?.classList.contains('show'));
  }

  let raf = 0;
  const schedule = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; apply(); }); };
  addEventListener('resize',schedule,{passive:true});
  addEventListener('orientationchange',()=>setTimeout(schedule,80),{passive:true});
  addEventListener('relay:runner-scene-ready',schedule,{passive:true});
  addEventListener('relay:gameplay-core-ready',schedule,{passive:true});
  addEventListener('relay:new-gameplay-run-start',schedule,{passive:true});
  addEventListener('relay:mission-complete',schedule,{passive:true});
  setInterval(apply,180);
  apply();
})();
