(() => {
  'use strict';

  if (window.__relayCinematicSplashV3) return;
  window.__relayCinematicSplashV3 = true;

  const start = () => {
    const legacy = document.getElementById('bootLoader');
    if (legacy) {
      // The old inline timeout can no longer target this element.
      legacy.removeAttribute('id');
      legacy.remove();
    }

    const style = document.createElement('style');
    style.id = 'relay-cinematic-splash-v3';
    style.textContent = `
      .relay-splash{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;box-sizing:border-box;width:100vw;width:100dvw;height:100vh;height:100dvh;min-height:100svh;padding:max(10px,env(safe-area-inset-top,0px)) max(12px,env(safe-area-inset-right,0px)) max(16px,env(safe-area-inset-bottom,0px)) max(12px,env(safe-area-inset-left,0px));overflow:hidden;background:#02050d;opacity:1;visibility:visible;transition:opacity .45s ease,visibility .45s ease;isolation:isolate}
      .relay-splash.is-leaving{opacity:0;visibility:hidden;pointer-events:none}
      .relay-splash-art{display:block;width:min(100%,calc(100dvh * .563));height:min(100%,calc(100dvw / .563));max-width:100%;max-height:100%;object-fit:contain;object-position:center;user-select:none;-webkit-user-drag:none}
      .relay-splash-ui{position:absolute;z-index:2;left:max(18px,env(safe-area-inset-left,0px) + 10px);right:max(18px,env(safe-area-inset-right,0px) + 10px);bottom:max(16px,env(safe-area-inset-bottom,0px) + 12px);width:min(560px,calc(100vw - 36px));margin:auto;font:700 clamp(9px,2.5vw,12px)/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;text-transform:uppercase;text-shadow:0 2px 12px #000}
      .relay-splash-meta{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:8px;color:#f5f7fb}
      .relay-splash-percent{color:#19c8f5;font-variant-numeric:tabular-nums}
      .relay-splash-track{height:5px;overflow:hidden;border:1px solid #8df4ff66;background:#030914d9;box-shadow:0 0 22px #19c8f526,inset 0 0 8px #000}
      .relay-splash-progress{display:block;width:0;height:100%;background:linear-gradient(90deg,#19c8f5,#8df4ff);box-shadow:0 0 14px #19c8f5cc;transition:width .18s ease}
      @media (orientation:landscape) and (max-height:600px){.relay-splash-art{height:calc(100dvh - 48px);width:calc((100dvh - 48px) * .563)}.relay-splash-ui{bottom:8px}.relay-splash-track{height:4px}}
      @media (max-width:700px){.relay-splash-ui{width:calc(100vw - 28px);bottom:max(14px,env(safe-area-inset-bottom,0px) + 10px)}.relay-splash-meta{font-size:9px}.relay-splash-track{height:4px}}
      @media (prefers-reduced-motion:reduce){.relay-splash,.relay-splash-progress{transition:none}}
    `;
    document.head.appendChild(style);

    const splash = document.createElement('div');
    splash.className = 'relay-splash';
    splash.setAttribute('role', 'status');
    splash.setAttribute('aria-live', 'polite');
    splash.setAttribute('aria-busy', 'true');
    splash.innerHTML = `
      <img class="relay-splash-art" src="./assets/loading.jpg" alt="Relay Runner" decoding="async" fetchpriority="high">
      <div class="relay-splash-ui">
        <div class="relay-splash-meta"><span class="relay-splash-status">INITIALIZING</span><span class="relay-splash-percent">0%</span></div>
        <div class="relay-splash-track"><i class="relay-splash-progress"></i></div>
      </div>
    `;
    document.body.prepend(splash);

    const image = splash.querySelector('.relay-splash-art');
    const bar = splash.querySelector('.relay-splash-progress');
    const percent = splash.querySelector('.relay-splash-percent');
    const status = splash.querySelector('.relay-splash-status');
    let progress = 0;
    let imageReady = false;
    let engineReady = false;
    let homeReady = false;
    let finishing = false;

    const setProgress = (value, label) => {
      progress = Math.max(progress, Math.min(100, Math.round(value)));
      bar.style.width = `${progress}%`;
      percent.textContent = `${progress}%`;
      if (label) status.textContent = label;
    };

    const animateTo = (target, label) => new Promise(resolve => {
      if (target <= progress) {
        setProgress(target, label);
        resolve();
        return;
      }
      const from = progress;
      const startTime = performance.now();
      const duration = Math.max(90, Math.min(360, (target - from) * 7));
      const frame = now => {
        const t = Math.min(1, (now - startTime) / duration);
        setProgress(from + (target - from) * (t * (2 - t)), label);
        if (t < 1) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });

    const waitFor = (predicate, timeout = 15000) => new Promise(resolve => {
      const started = performance.now();
      const check = () => {
        if (predicate()) return resolve(true);
        if (performance.now() - started >= timeout) return resolve(false);
        window.setTimeout(check, 40);
      };
      check();
    });

    const maybeFinish = async () => {
      if (finishing || !imageReady || !engineReady || !homeReady) return;
      finishing = true;
      await animateTo(100, 'READY');
      splash.setAttribute('aria-busy', 'false');
      splash.classList.add('is-leaving');
      window.setTimeout(() => { splash.remove(); style.remove(); }, 500);
    };

    const imageLoaded = async () => {
      imageReady = true;
      setProgress(20, 'LOADING INTERFACE');
      if (image.decode) {
        try { await image.decode(); } catch (_) {}
      }
      setProgress(45, 'LOADING GAME SYSTEMS');
      maybeFinish();
    };
    image.addEventListener('load', imageLoaded, { once: true });
    image.addEventListener('error', () => {
      // The app can still boot if the optional splash asset fails; keep the loader usable.
      imageReady = true;
      setProgress(20, 'LOADING INTERFACE');
      maybeFinish();
    }, { once: true });
    if (image.complete && image.naturalWidth > 0) imageLoaded();

    const domReady = document.readyState !== 'loading';
    if (domReady) setProgress(45, 'LOADING GAME SYSTEMS');
    else document.addEventListener('DOMContentLoaded', () => setProgress(45, 'LOADING GAME SYSTEMS'), { once: true });

    (async () => {
      const engine = await waitFor(() => Boolean(document.querySelector('#phaser-game canvas')));
      engineReady = engine;
      setProgress(engine ? 75 : 65, engine ? 'STARTING WORLD' : 'STARTING GAME');
      const home = await waitFor(() => {
        const intro = document.querySelector('#intro');
        const canvas = document.querySelector('#phaser-game canvas');
        return Boolean(intro && canvas && !intro.classList.contains('hidden'));
      });
      homeReady = home;
      setProgress(home ? 92 : 85, home ? 'PREPARING HOME' : 'FINALIZING');
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      maybeFinish();
    })();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
