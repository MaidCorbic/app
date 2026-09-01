/* Production cinematic splash V3. Owns first-load presentation and fails open safely. */
(() => {
  if (window.__relaySplashV3) return;
  window.__relaySplashV3 = true;

  const applyFirstPaintHardening = () => {
    const splash = document.querySelector('.relay-splash') || document.getElementById('relaySplash');
    const image = splash?.querySelector('.relay-splash-art, #relaySplashArt');
    if (!splash || !image) return;
    const mobilePortrait = window.matchMedia('(max-width:700px) and (orientation:portrait)').matches;
    splash.style.width = '100dvw';
    splash.style.height = '100dvh';
    image.style.display = 'block';
    image.style.position = 'absolute';
    image.style.inset = '0';
    image.style.width = '100dvw';
    image.style.height = '100dvh';
    image.style.minWidth = '100%';
    image.style.minHeight = '100%';
    image.style.maxWidth = 'none';
    image.style.maxHeight = 'none';
    image.style.objectFit = mobilePortrait ? 'contain' : 'cover';
    image.style.objectPosition = 'center';
    image.style.transform = 'none';
    image.style.animation = 'none';
    image.style.opacity = '1';
  };

  applyFirstPaintHardening();

  const boot = () => {
    applyFirstPaintHardening();
    document.getElementById('bootLoader')?.remove();
    const splash = document.querySelector('.relay-splash') || document.getElementById('relaySplash');
    if (!splash) return;
    if (!splash.classList.contains('relay-splash')) splash.classList.add('relay-splash');

    const image = splash.querySelector('.relay-splash-art, #relaySplashArt');
    const bar = splash.querySelector('.relay-splash-progress');
    const pct = splash.querySelector('.relay-splash-percent');
    const label = splash.querySelector('.relay-splash-status');
    if (!image || !bar || !pct || !label) return;
    applyFirstPaintHardening();

    if (!splash.querySelector('.relay-splash-brand')) {
      const brand = document.createElement('div');
      brand.className = 'relay-splash-brand';
      brand.innerHTML = '<b>R/</b><span>RELAY RUNNER</span>';
      splash.appendChild(brand);
    }

    const stages = [[8, 'INITIALIZING RELAY'], [26, 'LOADING INTERFACE'], [48, 'LOADING GAME SYSTEMS'], [68, 'CONNECTING WORLD'], [86, 'PREPARING HOME']];
    let progress = 0;
    let imageReady = image.complete && image.naturalWidth > 0;
    let pageReady = true;
    let engineReady = false;
    let finishing = false;
    let timedOut = false;
    const startedAt = performance.now();
    const MIN_SPLASH_MS = 2200;
    const MAX_SPLASH_MS = 7000;

    const setProgress = (value, text) => {
      progress = Math.max(progress, Math.min(100, Math.round(value)));
      bar.style.width = `${progress}%`;
      pct.textContent = `${progress}%`;
      if (text) label.textContent = text;
    };

    const animateTo = (target, text) => new Promise(resolve => {
      if (target <= progress) { setProgress(target, text); resolve(); return; }
      const from = progress;
      const started = performance.now();
      const duration = Math.max(180, Math.min(650, (target - from) * 10));
      const step = () => {
        const t = Math.min(1, (performance.now() - started) / duration);
        const eased = t * (2 - t);
        setProgress(from + (target - from) * eased, text);
        if (t < 1) window.setTimeout(step, 32);
        else resolve();
      };
      window.setTimeout(step, 0);
    });

    const finish = async (forced = false) => {
  if (finishing) return;

  const elapsed = performance.now() - startedAt;

  // Splash must not depend on Phaser canvas creation.
  // Image + document readiness are sufficient; forced timeout is the final failsafe.
  if (!forced && (!imageReady || !pageReady)) return;

  if (!forced && elapsed < MIN_SPLASH_MS) {
    window.setTimeout(
      () => finish(false),
      MIN_SPLASH_MS - elapsed
    );
    return;
  }

  finishing = true;

  await animateTo(100, 'READY');

  splash.setAttribute('aria-busy', 'false');
  splash.classList.add('is-hidden');

  window.setTimeout(() => splash.remove(), 700);
};

    const markImageReady = () => {
      if (imageReady) return;
      imageReady = true;
      animateTo(26, 'LOADING INTERFACE').then(() => finish());
    };

    if (imageReady) setProgress(26, 'LOADING INTERFACE');
    else {
      image.addEventListener('load', markImageReady, { once: true });
      image.addEventListener('error', () => { imageReady = true; setProgress(22, 'USING SAFE MODE'); finish(); }, { once: true });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => animateTo(48, 'LOADING GAME SYSTEMS'), { once: true });
    else animateTo(48, 'LOADING GAME SYSTEMS');

  setProgress(68, 'CONNECTING WORLD');

  const checkReadiness = () => {
  if (finishing) return;

  if (imageReady && pageReady) {
    animateTo(86, 'PREPARING HOME').then(() => finish(false));
    return;
  }

  window.setTimeout(checkReadiness, 60);
};

checkReadiness();

    const orientation = window.matchMedia('(orientation: landscape)');
    const onOrientation = () => { if (finishing) return; imageReady = image.complete && image.naturalWidth > 0; applyFirstPaintHardening(); };
    orientation.addEventListener?.('change', onOrientation);
    window.addEventListener('resize', onOrientation, { passive: true });

    window.setTimeout(() => { if (finishing || timedOut) return; timedOut = true; label.textContent = 'STARTING HOME'; finish(true); }, MAX_SPLASH_MS);
    stages.forEach(([value, text], index) => window.setTimeout(() => { if (!finishing && !timedOut) setProgress(value, text); }, 220 + index * 360));
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
