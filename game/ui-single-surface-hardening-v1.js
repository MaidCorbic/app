/* UI surface hardening V2.
 * Home Options/Tutorial get one visible surface at a time.
 * PLAY gets a responsive zipper reveal without taking ownership of gameplay start.
 */
(() => {
  'use strict';
  if (window.__relayUiSurfaceHardeningV2) return;
  window.__relayUiSurfaceHardeningV2 = true;

  const style = document.createElement('style');
  style.id = 'relay-ui-surface-hardening-v2';
  style.textContent = `
    #titlePanel.relay-surface-pending #titlePanelContent,
    #titlePanel.relay-surface-pending #titlePanelHeading,
    #titlePanel.relay-surface-pending #titlePanelEyebrow{visibility:hidden!important}
    #titlePanel.relay-surface-pending{background:rgba(2,7,13,.94)!important}
    #titlePanel .relay-stable-shell,
    #titlePanel .home-tutorial-content{visibility:visible!important}
    #titlePanel [data-final-toggle="tutorialHints"]{display:none!important}

    #relayPlayZip{position:fixed;inset:0;z-index:2147483000;display:grid;grid-template-columns:repeat(12,1fr);pointer-events:none;overflow:hidden;background:#02070d}
    #relayPlayZip[hidden]{display:none}
    #relayPlayZip i{display:block;height:100%;background:linear-gradient(180deg,#071525,#02070d 48%,#071525);transform:scaleY(1);transform-origin:center;box-shadow:inset 0 0 0 1px rgba(141,244,255,.08),0 0 18px rgba(141,244,255,.04);transition:transform .62s cubic-bezier(.77,0,.18,1)}
    #relayPlayZip .zip-line{position:absolute;left:50%;top:0;width:2px;height:100%;transform:translateX(-50%) scaleY(.15);transform-origin:center;background:linear-gradient(180deg,transparent,#8df4ff 20%,#fff 50%,#ffd06e 80%,transparent);box-shadow:0 0 28px rgba(141,244,255,.55);opacity:0;transition:opacity .18s ease,transform .7s cubic-bezier(.2,.8,.2,1)}
    #relayPlayZip.playing .zip-line{opacity:1;transform:translateX(-50%) scaleY(1)}
    #relayPlayZip.opening i{transform:scaleY(0)}
    #relayPlayZip.opening .zip-line{opacity:1;transform:translateX(-50%) scaleY(1)}
    @media(max-width:768px){#relayPlayZip{grid-template-columns:repeat(8,1fr)}}
    @media(max-width:420px){#relayPlayZip{grid-template-columns:repeat(6,1fr)}}
    @media(prefers-reduced-motion:reduce){#relayPlayZip i{transition-duration:.01ms}#relayPlayZip .zip-line{transition-duration:.01ms}}
  `;
  document.head.appendChild(style);

  const zip = document.createElement('div');
  zip.id = 'relayPlayZip';
  zip.hidden = true;
  zip.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 12; i += 1) {
    const slat = document.createElement('i');
    slat.style.transitionDelay = `${i * 22}ms`;
    zip.appendChild(slat);
  }
  const line = document.createElement('span');
  line.className = 'zip-line';
  zip.appendChild(line);
  document.body.appendChild(zip);

  const panel = () => document.getElementById('titlePanel');
  const content = () => document.getElementById('titlePanelContent');

  const markPending = expected => {
    const p = panel();
    if (!p) return;
    p.classList.add('relay-surface-pending');
    const start = performance.now();
    const check = () => {
      const c = content();
      const ready = expected === 'options'
        ? !!c?.querySelector('.relay-stable-shell')
        : !!c?.querySelector('.home-tutorial-content');
      if (ready || performance.now() - start > 1800) {
        p.classList.remove('relay-surface-pending');
        return;
      }
      requestAnimationFrame(check);
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
  if (play) {
    // Deliberately do NOT preventDefault/stopImmediatePropagation here. The
    // gameplay intro owns the PLAY action; this listener is visual only.
    play.addEventListener('click', () => {
      if (window.__relayPlayZipActive) return;
      window.__relayPlayZipActive = true;
      zip.hidden = false;
      zip.classList.remove('opening');
      void zip.offsetWidth;
      zip.classList.add('playing');
      window.setTimeout(() => zip.classList.add('opening'), 180);
      window.setTimeout(() => {
        zip.hidden = true;
        zip.classList.remove('playing', 'opening');
        window.__relayPlayZipActive = false;
      }, 950);
    }, false);
  }
})();
