/* Production cinematic splash. It owns the first-load screen and never exposes the legacy loader. */
(() => {
  if (window.__relaySplashV2) return;
  window.__relaySplashV2 = true;
  document.getElementById('bootLoader')?.remove();

  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = './cinematic-splash.css';
  document.head.appendChild(css);

  const splash = document.createElement('div');
  splash.className = 'relay-splash';
  splash.setAttribute('role', 'status');
  splash.setAttribute('aria-live', 'polite');
  splash.setAttribute('aria-busy', 'true');
  splash.innerHTML = '<img class="relay-splash-art" src="./assets/relay-runner-splash.jpg" alt="Relay Runner" decoding="async" fetchpriority="high"><div class="relay-splash-ui"><div class="relay-splash-meta"><span class="relay-splash-status">INITIALIZING RELAY</span><span class="relay-splash-percent">0%</span></div><div class="relay-splash-track"><i class="relay-splash-progress"></i></div></div>';
  document.body.prepend(splash);

  const bar = splash.querySelector('.relay-splash-progress');
  const pct = splash.querySelector('.relay-splash-percent');
  const label = splash.querySelector('.relay-splash-status');
  const image = splash.querySelector('.relay-splash-art');
  let current = 0;
  let imageReady = false;
  let appReady = false;
  let pageReady = false;
  let finishing = false;

  const set = (n, text) => {
    current = Math.max(current, Math.min(100, Math.round(n)));
    bar.style.width = `${current}%`;
    pct.textContent = `${current}%`;
    if (text) label.textContent = text;
  };

  const tween = (target, text) => new Promise(resolve => {
    const from = current;
    if (target <= from) { set(target, text); resolve(); return; }
    const start = performance.now();
    const duration = Math.max(160, Math.min(500, (target - from) * 12));
    const frame = now => {
      const t = Math.min(1, (now - start) / duration);
      set(from + (target - from) * (t * (2 - t)), text);
      if (t < 1) requestAnimationFrame(frame); else resolve();
    };
    requestAnimationFrame(frame);
  });

  const finish = async () => {
    if (finishing || !imageReady || !appReady || !pageReady) return;
    finishing = true;
    await tween(100, 'READY');
    splash.setAttribute('aria-busy', 'false');
    splash.classList.add('is-hidden');
    window.setTimeout(() => splash.remove(), 700);
  };

  image.addEventListener('load', () => { imageReady = true; set(20, 'LOADING INTERFACE'); finish(); }, { once: true });
  image.addEventListener('error', () => { imageReady = true; set(20, 'LOADING INTERFACE'); finish(); }, { once: true });
  if (image.complete && image.naturalWidth) { imageReady = true; set(20, 'LOADING INTERFACE'); }

  window.addEventListener('relay:app-ready', () => { appReady = true; set(82, 'PREPARING HOME'); finish(); }, { once: true });
  window.addEventListener('load', () => { pageReady = true; set(94, 'FINALIZING'); finish(); }, { once: true });

  tween(8, 'INITIALIZING RELAY')
    .then(() => tween(28, 'LOADING INTERFACE'))
    .then(() => tween(48, 'LOADING GAME SYSTEMS'))
    .then(() => tween(65, 'CONNECTING WORLD'));
})();
