/* GAMEPLAY HUD LAYOUT MANAGER V4
   Presentation-only layout owner. Gameplay/state/input is untouched.
   Mobile landscape: mission left, telemetry rail at the TOP, clear gameplay center/bottom.
*/
(() => {
  if (typeof window === 'undefined' || window.__relayGameplayHudLayoutV4) return;
  window.__relayGameplayHudLayoutV4 = true;

  const STYLE_ID = 'relay-gameplay-hud-layout-v4-style';
  const isTouch = () => window.matchMedia?.('(hover:none) and (pointer:coarse)').matches === true;
  const landscape = () => innerWidth >= innerHeight;
  const getScene = () => window.__relayRunnerScene || window.game?.scene?.getScene?.('RunnerScene') || null;

  function install() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
#play{--relay-safe-x:max(14px,env(safe-area-inset-left,0px));--relay-safe-r:max(14px,env(safe-area-inset-right,0px));--relay-safe-b:max(14px,env(safe-area-inset-bottom,0px));--relay-cargo-top:220px}
#play .hud,#play .hud *,#relay-gameplay-new-layer,#relay-gameplay-new-layer *{font-stretch:normal;font-kerning:normal;text-rendering:optimizeLegibility}
#play .hud{letter-spacing:normal!important}
#play .hud small,#play .hud .label,#play .hud .eyebrow{letter-spacing:.055em!important}
#play .hud b,#play .hud strong,#play .hud .value{letter-spacing:0!important}
#relay-gameplay-new-layer .ng-kicker,#relay-gameplay-new-layer .ng-choice-title,#relay-gameplay-new-layer .ng-title{letter-spacing:.07em!important}
#relay-gameplay-new-layer .ng-value{letter-spacing:0!important}
#relay-gameplay-new-layer .ng-event{letter-spacing:.055em!important}
#relay-gameplay-new-layer button b{letter-spacing:.035em!important}
#relay-gameplay-new-layer button small{letter-spacing:.015em!important}
#cargoIntegrityV2{box-sizing:border-box!important}

/* FINAL TELEMETRY RULE: SIGNALS belongs on the TOP rail, directly beside FLOW.
   Use absolute positioning inside the already-top HUD instead of fixed positioning;
   this prevents the browser/game viewport offset from pushing SIGNALS downward. */
#play > .hud .hud-progress{
  position:absolute!important;
  z-index:1205!important;
  box-sizing:border-box!important;
}
#relay-gameplay-new-layer .ng-chain{
  position:absolute!important;
  z-index:1206!important;
}
#play > .hud .hud-actions{position:absolute!important;z-index:1207!important;display:flex!important;align-items:stretch!important;gap:6px!important}
#play > .hud .hud-actions .hud-xp,#play > .hud .hud-actions .pause-button{box-sizing:border-box!important}

/* TOUCH LANDSCAPE — everything important stays on the top edge. */
@media (hover:none) and (pointer:coarse) and (orientation:landscape){
  #play .hud{pointer-events:none!important}
  #play > .hud .hud-route,#play > .hud .hud-progress,#play > .hud .hud-actions{pointer-events:auto!important}

  #play > .hud .hud-route{
    position:absolute!important;
    top:0!important;
    left:0!important;
    width:220px!important;
    min-width:0!important;
    height:48px!important;
    z-index:1200!important;
  }

  /* SIGNALS: TOP, immediately LEFT of FLOW. */
  #play > .hud .hud-progress{
    top:0!important;
    right:clamp(360px,36vw,540px)!important;
    left:auto!important;
    width:112px!important;
    min-width:112px!important;
    height:48px!important;
    padding:6px 8px!important;
  }

  #play > .hud .hud-actions{
    top:0!important;
    right:0!important;
  }
  #play > .hud .hud-actions .hud-xp{width:48px!important;min-width:48px!important;height:48px!important}
  #play > .hud .hud-actions .pause-button{width:48px!important;min-width:48px!important;height:48px!important}

  /* FLOW: TOP CENTER, aligned vertically with SIGNALS. */
  #relay-gameplay-new-layer .ng-chain{
    top:0!important;
    left:50%!important;
    transform:translate(-50%,-2px) scale(.96)!important;
    z-index:1206!important;
  }
  #relay-gameplay-new-layer .ng-chain.show{transform:translate(-50%,0) scale(1)!important}

  #cargoIntegrityV2{
    left:var(--relay-safe-x)!important;
    right:auto!important;
    top:var(--relay-cargo-top)!important;
    bottom:auto!important;
    transform:none!important;
    width:min(280px,24vw)!important;
    max-width:280px!important;
    z-index:1150!important;
  }
  #cargoIntegrityV2.is-visible{transform:none!important}
  #relay-gameplay-new-layer .ng-choice{left:50%!important;top:auto!important;bottom:calc(var(--relay-safe-b) + 74px)!important;width:min(460px,42vw)!important}
  #relay-gameplay-new-layer .ng-choice.show{transform:translate(-50%,0)!important}
  #relay-gameplay-new-layer .ng-event{top:46%!important}
}

@media (hover:none) and (pointer:coarse) and (orientation:landscape) and (max-height:520px){
  #play > .hud .hud-route{width:205px!important;height:44px!important;padding:5px 9px!important}
  #play > .hud .hud-progress{width:104px!important;min-width:104px!important;height:44px!important;right:clamp(300px,35vw,470px)!important;padding:5px 7px!important}
  #play > .hud .hud-actions{top:0!important}
  #play > .hud .hud-actions .hud-xp,#play > .hud .hud-actions .pause-button{width:44px!important;min-width:44px!important;height:44px!important}
  #relay-gameplay-new-layer .ng-chain{top:0!important}
  #cargoIntegrityV2{width:235px!important;max-width:235px!important}
}

/* PORTRAIT — same rule: SIGNALS and FLOW are top telemetry, never mid-screen. */
@media (hover:none) and (pointer:coarse) and (orientation:portrait){
  #play > .hud .hud-route{position:absolute!important;top:0!important;left:0!important;width:min(190px,45vw)!important;height:42px!important;z-index:1200!important}
  #play > .hud .hud-progress{position:absolute!important;top:0!important;left:auto!important;right:calc(42px + 8px)!important;width:82px!important;min-width:82px!important;height:42px!important}
  #play > .hud .hud-actions{position:absolute!important;top:0!important;right:0!important}
  #play > .hud .hud-actions .hud-xp{width:42px!important;min-width:42px!important;height:42px!important}
  #play > .hud .hud-actions .pause-button{width:42px!important;min-width:42px!important;height:42px!important}
  #relay-gameplay-new-layer .ng-chain{top:0!important;left:50%!important;transform:translate(-50%,-1px) scale(.9)!important}
  #relay-gameplay-new-layer .ng-chain.show{transform:translate(-50%,0) scale(.96)!important}
  #cargoIntegrityV2{left:50%!important;right:auto!important;top:var(--relay-cargo-top)!important;bottom:auto!important;transform:translateX(-50%)!important;width:min(235px,calc(100vw - 54px))!important;max-width:235px!important;z-index:1050!important}
  #cargoIntegrityV2.is-visible{transform:translateX(-50%)!important}
  #relay-gameplay-new-layer .ng-choice{bottom:calc(var(--relay-safe-b) + 112px)!important;width:min(320px,calc(100vw - 30px))!important}
}

@media(min-width:769px){
  #play > .hud .hud-route{position:absolute!important;top:0!important;left:0!important;width:250px!important;height:52px!important;z-index:1200!important}
  #play > .hud .hud-progress{position:absolute!important;top:0!important;right:clamp(360px,31vw,560px)!important;left:auto!important;width:140px!important;height:52px!important}
  #play > .hud .hud-actions{position:absolute!important;top:0!important;right:0!important}
  #play > .hud .hud-actions .hud-xp,#play > .hud .hud-actions .pause-button{width:52px!important;min-width:52px!important;height:52px!important}
  #cargoIntegrityV2{left:clamp(18px,2vw,32px)!important;top:var(--relay-cargo-top)!important;bottom:auto!important;width:300px!important;max-width:300px!important;transform:none!important}
}

#play,#relay-gameplay-new-layer{max-width:100vw;overflow-x:clip}
@media(prefers-reduced-motion:reduce){#relay-gameplay-new-layer .ng-chain,#relay-gameplay-new-layer .ng-event,#relay-gameplay-new-layer .ng-choice{transition:none!important}}
`;
    document.head.appendChild(style);
  }

  function missionBottom() {
    const c = getScene()?.__missionObjectiveState?.c;
    if (!c?.active) return null;
    const y = Number(c.y) || 0;
    const h = Number(c.height) || 166;
    const scale = Number(c.scaleY) || Number(c.scaleX) || 1;
    return y + h * scale;
  }

  function updateCargoPosition() {
    const play = document.getElementById('play');
    const cargo = document.getElementById('cargoIntegrityV2');
    if (!play || !cargo) return;
    const mission = missionBottom();
    const joystick = play.querySelector('.mobile-joystick');
    const missionTop = mission != null ? mission + 10 : 220;
    const cargoHeight = cargo.getBoundingClientRect().height || 76;
    if (!isTouch()) { play.style.setProperty('--relay-cargo-top', `${Math.round(missionTop)}px`); return; }
    if (!landscape()) { play.style.setProperty('--relay-cargo-top', `${Math.round(Math.max(92, missionTop))}px`); return; }
    const joystickTop = joystick?.getBoundingClientRect?.().top;
    const clearTop = Number.isFinite(joystickTop) ? joystickTop - 14 - cargoHeight : innerHeight - 145 - cargoHeight;
    const finalTop = Math.max(86, Math.min(missionTop, clearTop));
    play.style.setProperty('--relay-cargo-top', `${Math.round(finalTop)}px`);
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
    updateCargoPosition();
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
