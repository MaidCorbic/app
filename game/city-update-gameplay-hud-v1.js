/* FINAL GAMEPLAY HUD HOTFIX V2
   - Signals telemetry stays beside the Momentum/Flow HUD instead of covering the playfield.
   - Signals card uses the same compact telemetry footprint as the top HUD cards.
   - CITY UPDATE / CITY LIGHT gameplay banner is intentionally disabled; mission modifiers such as LOW GRAVITY remain untouched.
*/
(() => {
  if (typeof window === 'undefined' || window.__relayGameplayHudHotfixV2) return;
  window.__relayGameplayHudHotfixV2 = true;

  const STYLE_ID = 'relay-gameplay-hud-hotfix-v2-style';

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
/* Never render the old CITY UPDATE gameplay toast. */
#relayCityUpdateV1{display:none!important;visibility:hidden!important;pointer-events:none!important}

/* SIGNALS: compact telemetry card aligned beside MOMENTUM CHAIN / FLOW. */
#play > .hud > .hud-progress{
  position:absolute!important;
  left:calc(50% - 166px)!important;
  top:clamp(74px,10vh,98px)!important;
  width:116px!important;
  min-width:116px!important;
  max-width:116px!important;
  height:46px!important;
  min-height:46px!important;
  margin:0!important;
  padding:5px 8px!important;
  box-sizing:border-box!important;
  display:grid!important;
  grid-template-columns:1fr!important;
  grid-template-rows:9px 18px 3px!important;
  grid-template-areas:'label' 'value' 'meter'!important;
  align-content:center!important;
  justify-items:center!important;
  gap:1px!important;
  text-align:center!important;
  overflow:hidden!important;
  z-index:60!important;
}
#play > .hud > .hud-progress > small{
  grid-area:label!important;
  align-self:end!important;
  justify-self:center!important;
  margin:0!important;
  font-size:6px!important;
  line-height:1!important;
  letter-spacing:.18em!important;
  white-space:nowrap!important;
}
#play > .hud > .hud-progress > span:first-child{
  grid-area:value!important;
  align-self:center!important;
  justify-self:center!important;
  margin:0!important;
  font-size:18px!important;
  line-height:1!important;
  font-variant-numeric:tabular-nums!important;
  letter-spacing:0!important;
}
#play > .hud > .hud-progress > div{
  grid-area:meter!important;
  width:72px!important;
  height:3px!important;
  min-width:72px!important;
  margin:0!important;
  align-self:center!important;
  justify-self:center!important;
}

/* The top telemetry row remains compact; SIGNALS owns only its reserved slot. */
#play > .hud > .hud-actions{position:relative!important;z-index:70!important}

@media (max-width:768px) and (orientation:landscape){
  #play > .hud > .hud-progress{
    left:calc(50% - 166px)!important;
    top:clamp(66px,11vh,88px)!important;
    width:110px!important;
    min-width:110px!important;
    max-width:110px!important;
    height:44px!important;
    min-height:44px!important;
  }
  #play > .hud > .hud-progress > span:first-child{font-size:17px!important}
  #play > .hud > .hud-progress > div{width:68px!important;min-width:68px!important}
}

@media (max-width:520px) and (orientation:landscape){
  #play > .hud > .hud-progress{
    left:calc(50% - 142px)!important;
    top:64px!important;
    width:98px!important;
    min-width:98px!important;
    max-width:98px!important;
    height:40px!important;
    min-height:40px!important;
    padding:4px 6px!important;
    grid-template-rows:8px 16px 3px!important;
  }
  #play > .hud > .hud-progress > span:first-child{font-size:15px!important}
  #play > .hud > .hud-progress > small{font-size:5.5px!important}
  #play > .hud > .hud-progress > div{width:58px!important;min-width:58px!important}
}

@media (orientation:portrait){
  #play > .hud > .hud-progress{
    left:50%!important;
    top:clamp(72px,11vh,96px)!important;
    transform:translateX(-50%)!important;
    width:104px!important;
    min-width:104px!important;
    max-width:104px!important;
    height:42px!important;
    min-height:42px!important;
  }
}

@media (prefers-reduced-motion:reduce){
  #relayCityUpdateV1{transition:none!important;animation:none!important}
}
`;
    document.head.appendChild(style);
  }

  function removeLegacyBanner() {
    document.getElementById('relayCityUpdateV1')?.remove();
  }

  function boot() {
    installStyle();
    removeLegacyBanner();
    const observer = new MutationObserver(() => removeLegacyBanner());
    observer.observe(document.body, { childList:true, subtree:true });
    window.addEventListener('resize', installStyle, { passive:true });
    window.addEventListener('orientationchange', installStyle, { passive:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
