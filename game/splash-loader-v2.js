/* Relay Runner — deterministic splash loader. It owns only the splash UI and never waits for app modules. */
(() => {
  'use strict';
  if (window.__relaySplashLoaderInstalled) return;
  window.__relaySplashLoaderInstalled = true;
  const start = () => {
    const splash = document.getElementById('relaySplash');
    if (!splash) return;
    const bar = splash.querySelector('.relay-splash-progress');
    const pct = splash.querySelector('.relay-splash-percent');
    const label = splash.querySelector('.relay-splash-status');
    if (!bar || !pct || !label) { splash.classList.add('is-hidden'); return; }
    let value = 0, done = false;
    const started = performance.now(), MIN_TIME = 1200, MAX_TIME = 3500;
    splash.classList.remove('is-hidden', 'is-leaving');
    splash.setAttribute('aria-busy', 'true');
    const render = () => {
      bar.style.width = `${value}%`;
      pct.textContent = `${Math.round(value)}%`;
      label.textContent = value < 35 ? 'INITIALIZING RELAY' : value < 70 ? 'LOADING GAME SYSTEMS' : value < 100 ? 'CONNECTING WORLD' : 'READY';
    };
    const finish = reason => {
      if (done) return;
      done = true; value = 100; render();
      splash.setAttribute('aria-busy', 'false');
      splash.dataset.relaySplashReleaseReason = reason;
      splash.classList.add('is-hidden');
      window.setTimeout(() => splash.remove(), 500);
      window.dispatchEvent(new CustomEvent('relay:splash-released', { detail: { reason } }));
    };
    const tick = () => {
      if (done) return;
      const elapsed = performance.now() - started;
      if (elapsed < 500) value = Math.min(32, value + 3.2);
      else if (elapsed < 1000) value = Math.min(68, value + 2.8);
      else if (elapsed < MIN_TIME) value = Math.min(94, value + 2.1);
      else value = Math.min(99, value + 1.2);
      render();
      if (elapsed >= MIN_TIME) return finish('ready');
      if (elapsed >= MAX_TIME) return finish('failsafe');
      window.setTimeout(tick, 50);
    };
    render(); tick();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
