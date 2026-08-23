/* UPDATE 27 — CITY UPDATE GAMEPLAY HUD
   Presentation-only. It must never leak onto the title screen or into tutorial presentation.
*/
(() => {
  if (typeof window === 'undefined' || window.__relayCityUpdateHudV1) return;
  window.__relayCityUpdateHudV1 = true;
  import('./relay-gameplay-stability-v2.js').catch(error => console.error('[Relay] Stability module failed:', error));

  const STYLE_ID = 'relay-city-update-hud-v2-style';
  const ROOT_ID = 'relayCityUpdateV1';
  let hideTimer = 0;

  const style = () => {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = `
#${ROOT_ID}{position:fixed;left:50%;top:calc(124px + env(safe-area-inset-top,0px));z-index:100004;width:min(86vw,360px);box-sizing:border-box;padding:9px 13px;border:1px solid rgba(141,244,255,.42);border-radius:10px;background:linear-gradient(135deg,rgba(3,12,24,.96),rgba(6,23,38,.92));box-shadow:0 0 26px rgba(25,200,245,.16),inset 0 0 18px rgba(141,244,255,.04);color:#eafcff;font:800 10px/1.25 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;text-align:center;text-transform:uppercase;opacity:0;transform:translate(-50%,-8px) scale(.98);pointer-events:none;transition:opacity .2s ease,transform .2s ease}
#${ROOT_ID}.show{opacity:1;transform:translate(-50%,0) scale(1)}
#${ROOT_ID} b,#${ROOT_ID} span{display:block}#${ROOT_ID} span{margin-top:4px;font-size:7px;letter-spacing:.1em;color:#8df4ff;opacity:.8}
body.relay-training-active #${ROOT_ID},body.relay-training-active #relayTimeIndicator{display:none!important;visibility:hidden!important;pointer-events:none!important}
@media(max-width:520px){#${ROOT_ID}{top:calc(112px + env(safe-area-inset-top,0px));width:min(82vw,320px);padding:8px 10px;font-size:9px}#${ROOT_ID} span{font-size:6px}}
@media(max-height:520px) and (orientation:landscape){#${ROOT_ID}{top:calc(64px + env(safe-area-inset-top,0px));width:min(54vw,300px);padding:6px 9px}}
@media(prefers-reduced-motion:reduce){#${ROOT_ID}{transition:none}}
`;
    document.head.appendChild(el);
  };

  const sceneActive = () => {
    const scene = window.__relayRunnerScene;
    const play = document.getElementById('play');
    const intro = document.getElementById('intro');
    return Boolean(scene?.player?.active && !scene.firstTimeTutorial && !scene.cinematicActive && !scene.finished && play && !play.classList.contains('hidden') && (!intro || intro.classList.contains('hidden')));
  };

  const show = (title, detail, ms = 1800) => {
    if (!sceneActive() || document.body.classList.contains('relay-training-active')) return;
    style();
    let el = document.getElementById(ROOT_ID);
    if (!el) { el = document.createElement('div'); el.id = ROOT_ID; document.body.appendChild(el); }
    el.innerHTML = `<b>${title}</b><span>${detail}</span>`;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    clearTimeout(hideTimer); hideTimer = window.setTimeout(() => el.classList.remove('show'), ms);
  };

  const city = () => document.getElementById('district')?.textContent?.trim() || 'CITY NETWORK';
  const objective = () => document.getElementById('objective')?.textContent?.trim() || 'RELAY ROUTE';

  window.addEventListener('relay:runner-scene-ready', () => {
    window.setTimeout(() => show('CITY UPDATE', `${city()} // ${objective()}`), 650);
  }, { passive: true });

  window.addEventListener('relay:gameplay-core-ready', () => {
    window.setTimeout(() => show('CITY UPDATE', `${city()} // NETWORK ONLINE`), 450);
  }, { passive: true });

  window.addEventListener('relay:city-pulse-ready', () => {
    window.setTimeout(() => show('CITY PULSE ONLINE', `${city()} // RHYTHM WINDOWS ACTIVE`), 120);
  }, { passive: true });

  window.addEventListener('relay:mission-complete', () => show('CITY UPDATE', `${city()} // DELIVERY REGISTERED`, 1500), { passive: true });
})();
