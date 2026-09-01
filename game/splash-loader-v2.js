/* Production splash controller.
 * Single owner, deterministic progress, guaranteed release.
 */
(() => {
  'use strict';

  if (window.__relaySplashV4) return;
  window.__relaySplashV4 = true;

  const MIN_SPLASH_MS = 1800;
  const MAX_SPLASH_MS = 4200;

  const start = () => {
    const splash =
      document.getElementById('relaySplash') ||
      document.querySelector('.relay-splash');

    if (!splash) return;

    const bar = splash.querySelector('.relay-splash-progress');
    const pct = splash.querySelector('.relay-splash-percent');
    const label = splash.querySelector('.relay-splash-status');

    if (!bar || !pct || !label) {
      splash.remove();
      return;
    }

    let progress = 0;
    let finished = false;
    const startedAt = performance.now();

    const setProgress = (value, text = '') => {
      if (finished) return;

      progress = Math.max(
        progress,
        Math.min(100, Math.round(value))
      );

      bar.style.width = `${progress}%`;
      pct.textContent = `${progress}%`;

      if (text) {
        label.textContent = text;
      }
    };

    const stepTo = (target, text) => {
      if (finished) return;

      const from = progress;

      if (target <= from) {
        setProgress(target, text);
        return;
      }

      const duration = Math.max(
        180,
        Math.min(500, (target - from) * 8)
      );

      const started = performance.now();

      const tick = () => {
        if (finished) return;

        const elapsed = performance.now() - started;
        const t = Math.min(1, elapsed / duration);
        const eased = t * (2 - t);

        setProgress(
          from + (target - from) * eased,
          text
        );

        if (t < 1) {
          window.setTimeout(tick, 24);
        }
      };

      tick();
    };

    const finish = () => {
      if (finished) return;

      const elapsed = performance.now() - startedAt;

      if (elapsed < MIN_SPLASH_MS) {
        window.setTimeout(
          finish,
          MIN_SPLASH_MS - elapsed
        );
        return;
      }

      finished = true;

      bar.style.width = '100%';
      pct.textContent = '100%';
      label.textContent = 'READY';

      splash.setAttribute('aria-busy', 'false');
      splash.classList.add('is-hidden');

      window.setTimeout(() => {
        splash.remove();
      }, 450);
    };

    /* Initial state */
    setProgress(8, 'INITIALIZING RELAY');

    /* Deterministic visual progression.
     * No image readiness.
     * No window.load.
     * No Phaser readiness.
     * No DOMContentLoaded dependency.
     */
    window.setTimeout(
      () => stepTo(26, 'LOADING INTERFACE'),
      180
    );

    window.setTimeout(
      () => stepTo(48, 'LOADING GAME SYSTEMS'),
      480
    );

    window.setTimeout(
      () => stepTo(68, 'CONNECTING WORLD'),
      800
    );

    window.setTimeout(
      () => stepTo(86, 'PREPARING HOME'),
      1200
    );

    window.setTimeout(
      () => stepTo(94, 'FINALIZING RELAY'),
      1500
    );

    window.setTimeout(
      finish,
      MIN_SPLASH_MS
    );

    /* Absolute emergency exit.
     * Splash can never remain indefinitely.
     */
    window.setTimeout(() => {
      if (finished) return;

      finished = true;

      bar.style.width = '100%';
      pct.textContent = '100%';
      label.textContent = 'READY';

      splash.setAttribute('aria-busy', 'false');
      splash.classList.add('is-hidden');

      window.setTimeout(() => {
        splash.remove();
      }, 250);
    }, MAX_SPLASH_MS);
  };

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      start,
      { once: true }
    );
  } else {
    start();
  }
})();
