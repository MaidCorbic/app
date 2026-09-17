'use strict';

// Runner Relay mobile launch contract.
// A normal browser tab cannot silently force orientation/fullscreen on load.
// The module therefore attempts a safe lock and exposes a one-tap fallback.
// Installed PWAs additionally use manifest.json orientation: landscape.

(() => {
  const mobile = () =>
    window.matchMedia?.('(pointer: coarse)')?.matches === true ||
    Number(navigator.maxTouchPoints || 0) > 0 ||
    /Android|iPhone|iPad|iPod|Mobile|Windows Phone|Silk|Kindle/i.test(navigator.userAgent || '');

  if (!mobile()) return;

  const viewport = () => {
    const vv = window.visualViewport;
    const width = Number(vv?.width || window.innerWidth || 1);
    const height = Number(vv?.height || window.innerHeight || 1);
    return { width, height };
  };

  const portrait = () => {
    const { width, height } = viewport();
    return height > width;
  };

  const install = () => {
    if (document.getElementById('relayAutoLandscapeGate')) return;

    const style = document.createElement('style');
    style.id = 'relay-auto-landscape-style';
    style.textContent = `
      #relayAutoLandscapeGate{position:fixed;inset:0;z-index:2147483646;display:none;place-items:center;padding:24px;box-sizing:border-box;background:radial-gradient(circle at 50% 38%,rgba(8,43,62,.98),rgba(1,5,10,.995) 70%);color:#e9fcff;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;text-align:center;touch-action:manipulation}
      #relayAutoLandscapeGate.is-visible{display:grid}
      #relayAutoLandscapeCard{width:min(520px,92vw);padding:28px 24px 24px;box-sizing:border-box;border:1px solid rgba(0,234,255,.3);background:linear-gradient(160deg,rgba(5,20,31,.97),rgba(2,8,15,.99));box-shadow:0 24px 80px rgba(0,0,0,.58),0 0 38px rgba(0,234,255,.08)}
      #relayAutoLandscapeIcon{width:74px;height:48px;margin:0 auto 20px;border:2px solid #8dfaff;border-radius:8px;box-shadow:0 0 22px rgba(0,234,255,.28);position:relative}
      #relayAutoLandscapeIcon:after{content:'↔';position:absolute;inset:0;display:grid;place-items:center;color:#ffd23c;font-size:22px}
      #relayAutoLandscapeTitle{margin:0 0 10px;font-size:clamp(18px,4vw,25px);letter-spacing:.12em}
      #relayAutoLandscapeText{margin:0 auto 20px;max-width:430px;color:rgba(220,245,255,.72);font-size:11px;line-height:1.65;letter-spacing:.08em}
      #relayAutoLandscapeButton{width:100%;min-height:54px;border:1px solid rgba(0,234,255,.72);border-radius:9px;background:linear-gradient(135deg,#073a4b,#06202d);color:#d8fbff;font:900 12px/1 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;letter-spacing:.16em;cursor:pointer;box-shadow:0 0 24px rgba(0,234,255,.13),inset 0 1px 0 rgba(255,255,255,.08)}
      #relayAutoLandscapeButton:disabled{opacity:.65;cursor:wait}
      #relayAutoLandscapeFallback{min-height:34px;margin:12px 0 0;color:rgba(255,210,60,.82);font-size:9px;line-height:1.5;letter-spacing:.08em}
      @media (orientation:landscape){#relayAutoLandscapeGate{display:none!important}}
    `;
    document.head.appendChild(style);

    const gate = document.createElement('div');
    gate.id = 'relayAutoLandscapeGate';
    gate.setAttribute('role', 'dialog');
    gate.setAttribute('aria-modal', 'true');
    gate.innerHTML = `
      <div id="relayAutoLandscapeCard">
        <div id="relayAutoLandscapeIcon" aria-hidden="true"></div>
        <h1 id="relayAutoLandscapeTitle">LANDSCAPE MODE</h1>
        <p id="relayAutoLandscapeText">Runner Relay is designed for full-screen landscape gameplay.</p>
        <button id="relayAutoLandscapeButton" type="button">ENTER LANDSCAPE</button>
        <p id="relayAutoLandscapeFallback" aria-live="polite"></p>
      </div>
    `;
    document.body.appendChild(gate);

    const sync = () => gate.classList.toggle('is-visible', portrait());

    gate.querySelector('#relayAutoLandscapeButton')?.addEventListener('click', async () => {
      const button = gate.querySelector('#relayAutoLandscapeButton');
      const fallback = gate.querySelector('#relayAutoLandscapeFallback');
      button.disabled = true;
      button.textContent = 'STARTING...';
      fallback.textContent = '';

      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
        }
      } catch (error) {
        console.debug('[RelayRunner] fullscreen unavailable', error);
      }

      try {
        if (screen.orientation?.lock) await screen.orientation.lock('landscape');
      } catch (error) {
        console.debug('[RelayRunner] landscape lock unavailable', error);
      }

      sync();
      if (portrait()) fallback.textContent = 'This browser did not allow automatic rotation. No CSS rotation was applied; rotate the device or install Runner Relay as an app for automatic landscape launch.';
      button.disabled = false;
      button.textContent = portrait() ? 'TRY LANDSCAPE AGAIN' : 'LANDSCAPE ACTIVE';
    }, { passive: false });

    window.addEventListener('resize', sync, { passive: true });
    window.addEventListener('orientationchange', sync, { passive: true });
    window.visualViewport?.addEventListener('resize', sync, { passive: true });
    document.addEventListener('fullscreenchange', sync, { passive: true });
    sync();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
