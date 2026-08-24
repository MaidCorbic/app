/* GAMEPLAY HUD LAYOUT MANAGER V1
   One presentation owner for gameplay overlays. Gameplay state/input is untouched.
*/
(() => {
  if (typeof window === 'undefined' || window.__relayGameplayHudLayoutV1) return;
  window.__relayGameplayHudLayoutV1 = true;

  const STYLE_ID = 'relay-gameplay-hud-layout-v1-style';
  const isTouch = () => window.matchMedia?.('(hover:none) and (pointer:coarse)').matches === true;
  const landscape = () => innerWidth >= innerHeight;
  const getScene = () => window.__relayRunnerScene || window.game?.scene?.getScene?.('RunnerScene') || null;

  function install() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
#play .hud,#play .hud *,#relay-gameplay-new-layer,#relay-gameplay-new-layer *{font-stretch:normal;font-kerning:normal;text-rendering:optimizeLegibility}
#play .hud{letter-spacing:normal!important}
#play .hud small,#play .hud .label,#play .hud .eyebrow{letter-spacing:.06em!important}
#play .hud b,#play .hud strong,#play .hud .value{letter-spacing:.01em!important}
#relay-gameplay-new-layer .ng-kicker,#relay-gameplay-new-layer .ng-choice-title,#relay-gameplay-new-layer .ng-title{letter-spacing:.08em!important}
#relay-gameplay-new-layer .ng-value{letter-spacing:-.01em!important}
#relay-gameplay-new-layer .ng-event{letter-spacing:.06em!important}
#relay-gameplay-new-layer button b{letter-spacing:.04em!important}
#relay-gameplay-new-layer button small{letter-spacing:.02em!important}
#play{--relay-safe-x:max(12px,env(safe-area-inset-left,0px));--relay-safe-r:max(12px,env(safe-area-inset-right,0px));--relay-safe-b:max(12px,env(safe-area-inset-bottom,0px))}
#play>.hud .hud-route,#play>.hud .hud-progress,#play>.hud .hud-xp,#play>.hud .pause-button{border-color:rgba(141,244,255,.24)!important;background:linear-gradient(145deg,rgba(4,14,27,.93),rgba(4,10,19,.82))!important;box-shadow:0 10px 26px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.035)!important;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
#relay-gameplay-new-layer .ng-choice{left:50%!important;width:min(460px,calc(100vw - 32px))!important;box-sizing:border-box!important}
#relay-gameplay-new-layer .ng-grid{gap:10px!important}
#relay-gameplay-new-layer button{min-height:54px!important;padding:10px 12px!important;border-radius:9px!important;border-color:rgba(141,244,255,.28)!important}
@media(min-width:769px){#relay-gameplay-new-layer .ng-chain{top:92px!important}#relay-gameplay-new-layer .ng-event{top:44%!important}#relay-gameplay-new-layer .ng-choice{bottom:clamp(92px,12vh,132px)!important}#relay-gameplay-new-layer .ng-recap{right:clamp(18px,2vw,34px)!important}}
@media(hover:none) and (pointer:coarse) and (orientation:landscape){
 #relay-gameplay-new-layer .ng-chain{top:clamp(58px,12vh,82px)!important}
 #relay-gameplay-new-layer .ng-event{top:calc(var(--relay-mission-bottom,46vh) + 8px)!important}
 #relay-gameplay-new-layer .ng-choice{top:calc(var(--relay-mission-bottom,52vh) + 12px)!important;bottom:auto!important;width:min(440px,42vw)!important}
 #relay-gameplay-new-layer .ng-choice-title{margin-bottom:6px!important}
 #relay-gameplay-new-layer .ng-grid{gap:8px!important}
 #relay-gameplay-new-layer button{min-height:50px!important}
 #relay-gameplay-new-layer .ng-recap{display:none!important}
 #cargoIntegrityV2{left:50%!important;right:auto!important;top:calc(var(--relay-mission-bottom,52vh) + 10px)!important;bottom:auto!important;transform:translateX(-50%)!important;width:min(230px,28vw)!important;max-width:230px!important;z-index:1080!important}
 #cargoIntegrityV2.is-visible{transform:translateX(-50%)!important}
 #play.relay-choice-active #cargoIntegrityV2{left:var(--relay-safe-x)!important;top:auto!important;bottom:calc(var(--relay-safe-b) + clamp(72px,15vh,100px))!important;transform:none!important;width:min(220px,27vw)!important}
 #play>.mobile-controls{z-index:1100!important}#play>.mobile-controls .mobile-joystick{z-index:1101!important}#play>.mobile-controls .mobile-actions{z-index:1102!important}
}
@media(hover:none) and (pointer:coarse) and (orientation:landscape) and (max-height:520px){#relay-gameplay-new-layer .ng-chain{top:54px!important}#relay-gameplay-new-layer .ng-choice{width:min(390px,48vw)!important;top:calc(var(--relay-mission-bottom,48vh) + 8px)!important}#relay-gameplay-new-layer button{min-height:46px!important;padding:8px 10px!important}#cargoIntegrityV2{width:200px!important;top:calc(var(--relay-mission-bottom,48vh) + 8px)!important}#play.relay-choice-active #cargoIntegrityV2{width:190px!important;bottom:calc(var(--relay-safe-b) + 70px)!important;top:auto!important}}
@media(hover:none) and (pointer:coarse) and (orientation:portrait){
 #relay-gameplay-new-layer .ng-chain{top:84px!important}#relay-gameplay-new-layer .ng-event{top:38%!important}
 #relay-gameplay-new-layer .ng-choice{top:auto!important;bottom:calc(118px + env(safe-area-inset-bottom,0px))!important;width:min(330px,calc(100vw - 28px))!important}
 #relay-gameplay-new-layer .ng-recap{display:none!important}#relay-gameplay-new-layer .ng-grid{grid-template-columns:1fr!important}#relay-gameplay-new-layer button{min-height:48px!important}
 #cargoIntegrityV2{left:var(--relay-safe-x)!important;right:auto!important;top:auto!important;bottom:calc(78px + env(safe-area-inset-bottom,0px))!important;transform:none!important;width:min(205px,calc(100vw - 104px))!important}
}
#play,#relay-gameplay-new-layer{max-width:100vw;overflow-x:clip}
@media(prefers-reduced-motion:reduce){#relay-gameplay-new-layer .ng-chain,#relay-gameplay-new-layer .ng-event,#relay-gameplay-new-layer .ng-choice{transition:none!important}}
`;
    document.head.appendChild(s);
  }

  function missionBottom() {
    const c = getScene()?.__missionObjectiveState?.c;
    if (!c?.active) return null;
    return (Number(c.y)||0) + (Number(c.height)||166) * (Number(c.scaleY)||Number(c.scaleX)||1);
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
