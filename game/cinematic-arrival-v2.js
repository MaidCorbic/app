/* Cinematic Arrival V5 — visual decorator only. splash-loader-v4 owns loading/release. */
(() => {
  if (window.__relayCinematicArrivalV5) return;
  window.__relayCinematicArrivalV5 = true;

  const start = () => {
    /* Never compete with the production loader. It owns progress, timeout and release. */
    if (window.__relaySplashV4 || window.__relaySplashV3) return;
    const splash = document.getElementById('relaySplash');
    if (!splash) return;
    splash.classList.add('cinematic-arrival');
    if (!document.querySelector('link[data-cinematic-arrival-v2]')) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = './cinematic-arrival-v2.css';
      css.dataset.cinematicArrivalV2 = 'true';
      document.head.appendChild(css);
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
