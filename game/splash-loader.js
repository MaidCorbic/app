(() => {
  'use strict';

  if (window.__relayCinematicSplashV4) return;
  window.__relayCinematicSplashV4 = true;

  const start = () => {
    const legacy = document.getElementById('bootLoader');
    legacy?.remove();

    const style = document.createElement('style');
    style.id = 'relay-cinematic-splash-v4';
    style.textContent = `
      .relay-splash{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;box-sizing:border-box;width:100vw;width:100dvw;height:100vh;height:100dvh;min-height:100svh;padding:max(10px,env(safe-area-inset-top,0px)) max(12px,env(safe-area-inset-right,0px)) max(18px,env(safe-area-inset-bottom,0px)) max(12px,env(safe-area-inset-left,0px));overflow:hidden;background:#02050d;opacity:1;visibility:visible;transition:opacity .45s ease,visibility .45s ease;isolation:isolate}
      .relay-splash.is-leaving{opacity:0;visibility:hidden;pointer-events:none}
      .relay-splash-art{display:block;width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain;object-position:center;user-select:none;-webkit-user-drag:none;background:#02050d}
      .relay-splash-ui{position:absolute;z-index:2;left:max(14px,env(safe-area-inset-left,0px) + 10px);right:max(14px,env(safe-area-inset-right,0px) + 10px);bottom:max(14px,env(safe-area-inset-bottom,0px) + 10px);width:min(560px,calc(100vw - 28px));margin:auto;font:700 clamp(9px,2.5vw,12px)/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;text-transform:uppercase;text-shadow:0 2px 12px #000}
      .relay-splash-meta{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:8px;color:#f5f7fb}
      .relay-splash-percent{color:#19c8f5;font-variant-numeric:tabular-nums}
      .relay-splash-track{height:5px;overflow:hidden;border:1px solid #8df4ff66;background:#030914d9;box-shadow:0 0 22px #19c8f526,inset 0 0 8px #000}
      .relay-splash-progress{display:block;width:0;height:100%;background:linear-gradient(90deg,#19c8f5,#8df4ff);box-shadow:0 0 14px #19c8f5cc;transition:width .18s ease}
      @media(max-width:700px){.relay-splash-ui{width:calc(100vw - 28px)}.relay-splash-meta{font-size:9px}.relay-splash-track{height:4px}}
      @media(prefers-reduced-motion:reduce){.relay-splash,.relay-splash-progress{transition:none}}
    `;
    document.head.appendChild(style);

    const splash = document.createElement('div');
    splash.className = 'relay-splash';
    splash.setAttribute('role', 'status');
    splash.setAttribute('aria-live', 'polite');
    splash.setAttribute('aria-busy', 'true');
    splash.innerHTML = `
      <img class="relay-splash-art" alt="Relay Runner" decoding="async" fetchpriority="high">
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

    // Resolve from this module's own location. This works on Vercel previews,
    // custom domains, /game/ deployments and local hosting without guessing
    // the current document URL.
    const imageUrl = new URL('./assets/loading.jpg', import.meta.url).href;
    image.src = imageUrl;

    let progress = 0;
    let imageReady = false;
    let engineReady = false;
    let pageReady = document.readyState === 'complete';
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
      const duration = Math.max(120, Math.min(420, (target - from) * 7));
      const frame = now => {
        const t = Math.min(1, (now - startTime) / duration);
        setProgress(from + (target - from) * (t * (2 - t)), label);
        if (t < 1) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });

    const finish = async () => {
      if (finishing || !imageReady || !engineReady || !pageReady) return;
      finishing = true;
      await animateTo(100, 'READY');
      splash.setAttribute('aria-busy', 'false');
      splash.classList.add('is-leaving');
      window.setTimeout(() => { splash.remove(); style.remove(); }, 500);
    };

    image.addEventListener('load', async () => {
      if (!image.naturalWidth || !image.naturalHeight) return;
      imageReady = true;
      await animateTo(25, 'LOADING INTERFACE');
      finish();
    }, { once: true });

    image.addEventListener('error', () => {
      imageReady = false;
      status.textContent = 'SPLASH IMAGE FAILED';
      console.error('[Relay Runner] Splash image failed to load:', imageUrl);
    }, { once: true });

    if (image.complete && image.naturalWidth > 0) {
      imageReady = true;
      setProgress(25, 'LOADING INTERFACE');
    }

    const onDomReady = () => animateTo(45, 'LOADING GAME SYSTEMS');
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onDomReady, { once: true });
    } else {
      onDomReady();
    }

    if (!pageReady) {
      window.addEventListener('load', () => {
        pageReady = true;
        animateTo(65, 'STARTING WORLD').then(finish);
      }, { once: true });
    } else {
      setProgress(65, 'STARTING WORLD');
    }

    const checkEngine = () => {
      const canvas = document.querySelector('#phaser-game canvas');
      if (canvas) {
        engineReady = true;
        animateTo(92, 'PREPARING HOME').then(finish);
        return;
      }
      window.setTimeout(checkEngine, 50);
    };
    checkEngine();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
