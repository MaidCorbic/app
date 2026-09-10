/* Production cinematic splash V4 — single lifecycle owner. */
(() => {
  if (window.__relaySplashV4) return;
  window.__relaySplashV4 = true;

  const start = () => {
    const splash = document.getElementById('relaySplash');
    if (!splash) return;

    splash.classList.add('cinematic-arrival');
    splash.setAttribute('aria-busy', 'true');

    const ui = splash.querySelector('.relay-splash-ui');
    const label = ui?.querySelector('.relay-splash-status');
    const percent = ui?.querySelector('.relay-splash-percent');
    const bar = ui?.querySelector('.relay-splash-progress');
    if (!ui || !label || !percent || !bar) return;
    if (splash.querySelector('.arrival-copy')) return;

    const signal = document.createElement('div');
    signal.className = 'arrival-signal';
    signal.innerHTML = '<i></i><i></i><i></i><span>SYNC</span>';

    const particles = document.createElement('div');
    particles.className = 'arrival-particles';
    particles.innerHTML = '<i></i>'.repeat(10);
    splash.append(signal, particles);

    /* splash-loader-v2.js is the only owner of readiness/progress/removal. */
    const onReleased = () => {
      splash.classList.add('is-leaving');
      splash.setAttribute('aria-busy', 'false');
    };
    window.addEventListener('relay:splash-released', onReleased, { once: true });

    const syncPresentation = () => {
      if (!document.body.contains(splash)) return;
      splash.setAttribute('aria-busy', splash.dataset.cinematicReleased === 'true' ? 'false' : 'true');
    };
    const orientation = window.matchMedia('(orientation: landscape)');
    orientation.addEventListener?.('change', syncPresentation);
    window.addEventListener('resize', syncPresentation, { passive: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
