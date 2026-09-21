import './cinematic-arrival-v2.css';

/* Cinematic Arrival V5 — keep the mission card visible long enough to actually read. */
(() => {
  if (window.__relayCinematicArrivalV5) return;

  // splash-loader-v2.js is the single owner of #relaySplash lifecycle.
  // Do not install a second release timer or remove the splash from here.
  // V6 is the active splash owner. Do not run a second progress/removal loop.
  if (window.__relaySplashV6 || window.__relaySplashV3) return;

  window.__relayCinematicArrivalV5 = true;

  const start = () => {
    const splash = document.getElementById('relaySplash');
    if (!splash) return;

    splash.classList.add('cinematic-arrival');
    splash.setAttribute('data-arrival-mode', 'relay');
    splash.setAttribute('aria-busy', 'true');

    const ui = splash.querySelector('.relay-splash-ui');
    const label = ui?.querySelector('.relay-splash-status');
    const percent = ui?.querySelector('.relay-splash-percent');
    const bar = ui?.querySelector('.relay-splash-progress');
    if (!ui || !label || !percent || !bar) return;
    if (splash.querySelector('.arrival-copy')) return;

    const signal = document.createElement('div');
    signal.className = 'arrival-signal';
    signal.setAttribute('aria-label', 'Relay synchronization');
    signal.innerHTML = '<i></i><i></i><i></i><span>RELAY LINK</span>';

    const particles = document.createElement('div');
    particles.className = 'arrival-particles';
    particles.innerHTML = '<i></i>'.repeat(16);

    splash.append(signal, particles);

    const image = splash.querySelector('#relaySplashArt,.relay-splash-art');
    const started = performance.now();
    const MIN_MS = 3600;
    const MAX_MS = 5000;
    let released = false;
    let imageReady = Boolean(image?.complete && image.naturalWidth);
    let domReady = document.readyState !== 'loading';
    let pageReady = document.readyState === 'complete';
    let engineReady = Boolean(document.querySelector('#phaser-game canvas'));
    let progress = 0;

    const stateProgress = () => 25 * Number(imageReady) + 25 * Number(domReady) + 25 * Number(pageReady) + 25 * Number(engineReady);
    const statusFor = p => p >= 100 ? 'RELAY ONLINE' : p >= 75 ? 'HOME SYSTEMS READY' : p >= 50 ? 'WORLD NETWORK SYNCING' : p >= 25 ? 'GAME SYSTEMS LOADING' : 'RELAY CORE INITIALIZING';

    const setProgress = value => {
      progress = Math.max(progress, Math.min(100, Math.round(value)));
      bar.style.width = `${progress}%`;
      bar.setAttribute('aria-valuenow', String(progress));
      percent.textContent = `${progress}%`;
      label.textContent = statusFor(progress);
    };

    const release = reason => {
      if (released || !document.body.contains(splash)) return;
      released = true;
      setProgress(100);
      splash.dataset.cinematicReleased = 'true';
      splash.classList.add('is-leaving');
      splash.setAttribute('aria-busy', 'false');
      window.setTimeout(() => splash.remove(), 420);
      window.dispatchEvent(new CustomEvent('relay:splash-released', { detail: { reason } }));
    };

    const tick = () => {
      if (released) return;
      const target = stateProgress();
      if (target > progress) {
        const from = progress;
        const to = target;
        const t0 = performance.now();
        const frame = now => {
          const t = Math.min(1, (now - t0) / 360);
          setProgress(from + (to - from) * (t * (2 - t)));
          if (t < 1 && !released) requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      }

      const elapsed = performance.now() - started;
      if (elapsed >= MAX_MS) {
        release('five-second-cap');
        return;
      }

      if (engineReady && imageReady && domReady && pageReady && elapsed >= MIN_MS) {
        release('ready-after-presentation');
      } else {
        window.setTimeout(tick, 40);
      }
    };

    if (image) {
      if (!imageReady) image.addEventListener('load', () => { imageReady = true; tick(); }, { once: true });
      image.addEventListener('error', () => { label.textContent = 'RELAY SAFE MODE'; setProgress(25); }, { once: true });
    }

    if (!domReady) document.addEventListener('DOMContentLoaded', () => { domReady = true; tick(); }, { once: true });
    if (!pageReady) window.addEventListener('load', () => { pageReady = true; tick(); }, { once: true });

    const engineTimer = window.setInterval(() => {
      engineReady = Boolean(document.querySelector('#phaser-game canvas'));
      tick();
      if (released) window.clearInterval(engineTimer);
    }, 50);

    window.setTimeout(() => {
      if (!released) release('five-second-failsafe');
    }, MAX_MS + 80);

    const orientation = window.matchMedia('(orientation: landscape)');
    orientation.addEventListener?.('change', () => {
      if (!released) {
        imageReady = Boolean(image?.complete && image.naturalWidth);
        tick();
      }
    });

    window.addEventListener('resize', () => {
      if (!released) tick();
    }, { passive: true });

    setProgress(stateProgress());
    tick();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
