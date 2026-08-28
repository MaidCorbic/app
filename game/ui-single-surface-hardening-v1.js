/* UI surface hardening V4.
 * One visible Home surface at a time, stable first-open geometry, responsive PLAY reveal.
 */
(() => {
  'use strict';
  if (window.__relayUiSurfaceHardeningV4) return;
  window.__relayUiSurfaceHardeningV4 = true;

  const style = document.createElement('style');
  style.id = 'relay-ui-surface-hardening-v4';
  style.textContent = `
    #titlePanel.relay-options-stable,
    #titlePanel.relay-options-stable .title-panel-card,
    #titlePanel.relay-surface-pending,
    #titlePanel.relay-surface-pending .title-panel-card{
      transform:none!important;rotate:none!important;scale:1!important;
    }
    #titlePanel.relay-surface-pending #titlePanelContent,
    #titlePanel.relay-surface-pending #titlePanelHeading,
    #titlePanel.relay-surface-pending #titlePanelEyebrow{visibility:hidden!important}
    #titlePanel.relay-surface-pending{background:rgba(2,7,13,.94)!important}
    #titlePanel .relay-stable-shell,#titlePanel .home-tutorial-content{visibility:visible!important}
    #titlePanel [data-final-toggle="tutorialHints"]{display:none!important}

    /* Real zipper: paired full-height shutters pull away from the center. */
    #relayPlayZip{position:fixed;inset:0;z-index:2147483000;display:block;pointer-events:none;overflow:hidden;background:#02070d}
    #relayPlayZip[hidden]{display:none}
    #relayPlayZip i{position:absolute;top:0;width:50%;height:100%;display:block;background:linear-gradient(180deg,#071525 0%,#02070d 48%,#071525 100%);transform:scaleX(1);transform-origin:center;box-shadow:inset 0 0 0 1px rgba(141,244,255,.08),0 0 24px rgba(141,244,255,.08);transition:transform .62s cubic-bezier(.77,0,.18,1)}
    #relayPlayZip i:nth-child(odd){left:0}
    #relayPlayZip i:nth-child(even){right:0}
    #relayPlayZip i:nth-child(odd)::after,#relayPlayZip i:nth-child(even)::after{content:"";position:absolute;top:0;width:2px;height:100%;background:linear-gradient(180deg,transparent,#8df4ff 18%,#fff 50%,#ffd06e 82%,transparent);box-shadow:0 0 24px rgba(141,244,255,.65)}
    #relayPlayZip i:nth-child(odd)::after{right:0}
    #relayPlayZip i:nth-child(even)::after{left:0}
    #relayPlayZip.opening i:nth-child(odd){transform:scaleX(0);transform-origin:left center}
    #relayPlayZip.opening i:nth-child(even){transform:scaleX(0);transform-origin:right center}
    #relayPlayZip .zip-line{display:none!important}
    @media(max-width:768px){#relayPlayZip i{transition-duration:.52s}}
    @media(prefers-reduced-motion:reduce){#relayPlayZip i{transition-duration:.01ms}}

    #titlePanel:has(.home-tutorial-content) .title-panel-card{width:min(940px,92vw)!important;max-width:none!important;transform:none!important;rotate:none!important;scale:1!important;display:flex!important;flex-direction:column!important;box-sizing:border-box!important}
    #titlePanel:has(.home-tutorial-content) #titlePanelContent{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior:contain!important;scrollbar-gutter:stable!important}
    #titlePanel:has(.home-tutorial-content) .title-panel-close{z-index:20!important;display:grid!important;place-items:center!important;pointer-events:auto!important}
    @media(max-width:700px){
      #titlePanel:has(.home-tutorial-content){position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;max-height:100dvh!important;padding:10px!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important;overscroll-behavior-y:contain!important;transform:none!important}
      #titlePanel:has(.home-tutorial-content) .title-panel-card{width:92vw!important;max-width:92vw!important;min-height:0!important;max-height:none!important;height:auto!important;overflow:visible!important;border-radius:16px!important;padding:34px 18px 18px!important}
      #titlePanel:has(.home-tutorial-content) .title-panel-close{top:8px!important;right:8px!important;width:40px!important;height:40px!important;font-size:26px!important;border-radius:10px!important;background:rgba(3,10,18,.94)!important;color:#eefbff!important}
      #titlePanel:has(.home-tutorial-content) #titlePanelContent{flex:none!important;height:auto!important;max-height:none!important;overflow:visible!important;touch-action:pan-y!important}
    }
  `;
  document.head.appendChild(style);

  const panel = () => document.getElementById('titlePanel');
  const content = () => document.getElementById('titlePanelContent');
  const markPending = expected => {
    const p = panel(); if (!p) return;
    p.classList.add('relay-surface-pending');
    const start = performance.now();
    const check = () => {
      const c = content();
      const ready = expected === 'options' ? !!c?.querySelector('.relay-stable-shell') : !!c?.querySelector('.home-tutorial-content');
      if (ready || performance.now() - start > 1800) p.classList.remove('relay-surface-pending');
      else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  };
  document.addEventListener('click', event => {
    const options = event.target.closest?.('[data-title-panel="controls"]');
    const tutorial = event.target.closest?.('[data-title-panel="tutorial"]');
    if (options) markPending('options');
    if (tutorial) markPending('tutorial');
  }, true);

  const play = document.getElementById('start');
  if (play) play.addEventListener('click', () => {
    if (window.__relayPlayZipActive) return;
    window.__relayPlayZipActive = true;
    zip.hidden = false;
    zip.classList.remove('opening');
    void zip.offsetWidth;
    zip.classList.add('playing');
    window.setTimeout(() => zip.classList.add('opening'), 180);
    window.setTimeout(() => { zip.hidden = true; zip.classList.remove('playing','opening'); window.__relayPlayZipActive = false; }, 950);
  }, true);
})();
