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

  const installPremiumBootHud = () => {
    if (document.getElementById('relay-premium-boot-style')) return;

    const style = document.createElement('style');
    style.id = 'relay-premium-boot-style';
    style.textContent = `
      .relay-splash .relay-splash-network-status{
        position:absolute;
        z-index:8;
        top:max(24px,env(safe-area-inset-top));
        right:max(24px,env(safe-area-inset-right));
        display:flex;
        align-items:center;
        gap:8px;
        padding:7px 10px;
        border:1px solid rgba(0,234,255,.20);
        background:rgba(0,12,20,.38);
        color:rgba(141,250,255,.70);
        font:800 8px/1 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
        letter-spacing:.16em;
        text-transform:uppercase;
        text-shadow:0 2px 10px #000,0 0 12px rgba(0,234,255,.22);
        box-shadow:inset 0 0 18px rgba(0,234,255,.03);
      }
      .relay-splash .relay-splash-network-status i{
        width:6px;height:6px;flex:0 0 6px;border-radius:50%;
        background:var(--rr-cyan,#00eaff);
        box-shadow:0 0 7px var(--rr-cyan,#00eaff),0 0 16px rgba(0,234,255,.62);
        animation:relayPremiumPulse .95s ease-in-out infinite;
      }

      .relay-splash .relay-splash-ui{
        width:min(900px,calc(100vw - 48px));
        padding:12px 12px 11px;
        gap:9px;
        border:1px solid rgba(117,247,255,.19);
        border-top-color:rgba(255,210,60,.18);
        background:linear-gradient(180deg,rgba(1,9,16,.82),rgba(1,6,11,.64));
        box-shadow:0 20px 50px rgba(0,0,0,.38),inset 0 0 28px rgba(0,234,255,.025);
        backdrop-filter:blur(5px);
      }
      .relay-splash .relay-splash-ui::before{
        content:"SYSTEM LINK  //  SECURE CHANNEL";
        margin-bottom:-1px;
        padding:5px 8px;
        border-left:2px solid var(--rr-cyan,#00eaff);
        background:linear-gradient(90deg,rgba(0,234,255,.09),transparent);
        color:rgba(141,250,255,.62);
        font-size:7px;
        letter-spacing:.18em;
      }
      .relay-splash .relay-splash-meta{
        padding:11px 12px 10px;
        border-color:rgba(117,247,255,.14);
        border-bottom-color:rgba(117,247,255,.30);
        background:rgba(0,7,12,.36);
      }
      .relay-splash .relay-splash-status{font-size:10px;letter-spacing:.17em}
      .relay-splash .relay-splash-percent{font-size:19px;min-width:62px}
      .relay-splash .relay-splash-track{
        height:9px;
        border-color:rgba(117,247,255,.40);
        background:
          repeating-linear-gradient(90deg,rgba(141,250,255,.05) 0 1px,transparent 1px 24px),
          linear-gradient(180deg,rgba(0,18,29,.98),rgba(0,5,10,.99));
      }
      .relay-splash .relay-splash-track::before{
        background:repeating-linear-gradient(90deg,rgba(141,250,255,.15) 0 1px,transparent 1px 24px);
      }
      .relay-splash .relay-splash-progress{
        background:linear-gradient(90deg,#006d8a 0%,var(--rr-blue,#168cff) 25%,var(--rr-cyan,#00eaff) 63%,var(--rr-cyan2,#8dfaff) 88%,#fff 100%);
      }

      .relay-splash .relay-boot-status-grid{
        display:grid;
        grid-template-columns:repeat(3,minmax(0,1fr));
        gap:1px;
        border:1px solid rgba(117,247,255,.10);
        background:rgba(117,247,255,.08);
      }
      .relay-splash .relay-boot-status-cell{
        min-width:0;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        padding:7px 8px;
        background:rgba(0,8,13,.68);
      }
      .relay-splash .relay-boot-status-cell span{
        color:rgba(190,215,221,.46);
        font:700 7px/1 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
        letter-spacing:.14em;
        text-transform:uppercase;
      }
      .relay-splash .relay-boot-status-cell b{
        color:rgba(141,250,255,.80);
        font:900 7px/1 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
        letter-spacing:.10em;
        text-transform:uppercase;
        white-space:nowrap;
      }

      .relay-splash .relay-boot-log{
        display:grid;
        gap:3px;
        min-height:24px;
        padding:6px 8px 2px;
        border-top:1px solid rgba(117,247,255,.07);
        color:rgba(141,250,255,.43);
        font:700 7px/1.25 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
        letter-spacing:.12em;
        text-transform:uppercase;
      }
      .relay-splash .relay-boot-log .is-live{color:rgba(141,250,255,.78);text-shadow:0 0 12px rgba(0,234,255,.22)}
      .relay-splash .relay-boot-log .is-muted{color:rgba(175,188,184,.28)}
      .relay-splash .relay-boot-complete{
        display:none;
        grid-template-columns:auto minmax(0,1fr);
        align-items:center;
        gap:9px;
        padding-top:3px;
      }
      .relay-splash .relay-boot-complete.is-visible{display:grid}
      .relay-splash .relay-boot-complete b{
        width:7px;height:7px;border-radius:50%;background:var(--rr-gold,#ffd23c);
        box-shadow:0 0 9px var(--rr-gold,#ffd23c),0 0 18px rgba(255,210,60,.35)
      }
      .relay-splash .relay-boot-complete strong{
        display:block;
        color:rgba(245,253,255,.94);
        font:900 9px/1.1 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
        letter-spacing:.18em;
        text-transform:uppercase;
      }
      .relay-splash .relay-boot-complete small{
        display:block;
        margin-top:3px;
        color:rgba(141,250,255,.48);
        font:700 7px/1.1 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
        letter-spacing:.14em;
        text-transform:uppercase;
      }

      @keyframes relayPremiumPulse{
        0%,100%{opacity:.35;transform:scale(.72)}
        50%{opacity:1;transform:scale(1.18)}
      }

      @media(max-width:700px){
        .relay-splash .relay-splash-network-status{
          top:max(14px,env(safe-area-inset-top));
          right:max(14px,env(safe-area-inset-right));
          padding:6px 8px;
          font-size:6px;
          letter-spacing:.10em;
        }
        .relay-splash .relay-splash-ui{
          width:calc(100vw - 20px);
          padding:9px 9px 8px;
          gap:7px;
        }
        .relay-splash .relay-splash-ui::before{font-size:6px;letter-spacing:.12em;padding:4px 6px}
        .relay-splash .relay-splash-meta{padding:8px 9px 7px}
        .relay-splash .relay-splash-status{font-size:7px;letter-spacing:.10em}
        .relay-splash .relay-splash-percent{font-size:13px;min-width:48px}
        .relay-splash .relay-splash-track{height:7px}
        .relay-splash .relay-boot-status-grid{grid-template-columns:1fr 1fr}
        .relay-splash .relay-boot-status-cell{padding:6px 7px}
        .relay-splash .relay-boot-status-cell span,.relay-splash .relay-boot-status-cell b{font-size:6px}
        .relay-splash .relay-boot-log{font-size:6px;letter-spacing:.09em}
      }
      @media(max-width:700px) and (orientation:portrait){
        .relay-splash .relay-splash-network-status{display:none}
      }
      @media(orientation:landscape) and (max-height:520px){
        .relay-splash .relay-splash-network-status{top:max(8px,calc(env(safe-area-inset-top) + 4px));right:max(8px,calc(env(safe-area-inset-right) + 4px))}
        .relay-splash .relay-splash-ui{bottom:max(8px,calc(env(safe-area-inset-bottom) + 6px));padding:7px;gap:6px}
        .relay-splash .relay-boot-status-grid,.relay-splash .relay-boot-log{display:none}
      }
      @media(prefers-reduced-motion:reduce){
        .relay-splash .relay-splash-network-status i{animation:none}
      }
    `;
    document.head.appendChild(style);
  };

  const mountPremiumBootHud = splash => {
    if (!splash || splash.querySelector('.relay-premium-boot-mounted')) return null;

    const brand = splash.querySelector('.relay-splash-brand');
    const ui = splash.querySelector('.relay-splash-ui');
    if (!brand || !ui) return null;

    const network = document.createElement('div');
    network.className = 'relay-splash-network-status relay-premium-boot-mounted';
    network.innerHTML = '<i></i><span>NETWORK // ONLINE</span>';
    splash.appendChild(network);

    const telemetry = document.createElement('div');
    telemetry.className = 'relay-boot-status-grid';
    telemetry.innerHTML = `
      <div class="relay-boot-status-cell"><span>NODE</span><b>04 // ONLINE</b></div>
      <div class="relay-boot-status-cell"><span>SIGNAL</span><b>STABLE</b></div>
      <div class="relay-boot-status-cell"><span>RELAY</span><b>SYNCED</b></div>
    `;

    const log = document.createElement('div');
    log.className = 'relay-boot-log';
    log.setAttribute('aria-live', 'polite');
    log.innerHTML = `
      <span class="is-live">→ ROUTE DATA RECEIVED</span>
      <span class="is-muted">→ WORLD NODE ONLINE</span>
    `;

    const complete = document.createElement('div');
    complete.className = 'relay-boot-complete';
    complete.innerHTML = `
      <b aria-hidden="true"></b>
      <div><strong>RELAY NETWORK ONLINE</strong><small>BOOT COMPLETE // HOME READY</small></div>
    `;

    ui.appendChild(telemetry);
    ui.appendChild(log);
    ui.appendChild(complete);

    return { network, telemetry, log, complete };
  };

  applyFirstPaintHardening();

  const boot = () => {
    applyFirstPaintHardening();
    installPremiumBootHud();
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
    installPremiumBootHud();
    const premiumHud = mountPremiumBootHud(splash);

    if (!splash.querySelector('.relay-splash-brand')) {
      const brand = document.createElement('div');
      brand.className = 'relay-splash-brand';
      brand.innerHTML = '<b>R/</b><span>RELAY RUNNER</span>';
      splash.appendChild(brand);
    }

    const stages = [[8, 'INITIALIZING RELAY'], [26, 'LOADING INTERFACE'], [48, 'LOADING GAME SYSTEMS'], [68, 'CONNECTING WORLD'], [86, 'PREPARING HOME']];
    let progress = 0;
    let imageReady = image.complete && image.naturalWidth > 0;
    let pageReady = document.readyState === 'complete';
    let engineReady = false;
    let finishing = false;
    let timedOut = false;
    const startedAt = performance.now();
    const MIN_SPLASH_MS = 2200;
    const MAX_SPLASH_MS = 7000;

    const setBootLog = (current) => {
      if (!premiumHud?.log) return;
      const first = premiumHud.log.querySelector('span:first-child');
      const second = premiumHud.log.querySelector('span:last-child');
      if (!first || !second) return;
      if (current >= 68) {
        first.textContent = '→ ROUTE DATA RECEIVED';
        first.className = 'is-live';
        second.textContent = '→ WORLD NODE ONLINE';
        second.className = 'is-live';
      } else if (current >= 48) {
        first.textContent = '→ ROUTE DATA RECEIVED';
        first.className = 'is-live';
        second.textContent = '→ WORLD NODE SYNCING';
        second.className = 'is-muted';
      } else if (current >= 26) {
        first.textContent = '→ INTERFACE CORE ONLINE';
        first.className = 'is-live';
        second.textContent = '→ ROUTE DATA AWAITING';
        second.className = 'is-muted';
      } else {
        first.textContent = '→ RELAY CORE INITIALIZING';
        first.className = 'is-live';
        second.textContent = '→ WORLD NODE OFFLINE';
        second.className = 'is-muted';
      }
    };

    const setProgress = (value, text) => {
      progress = Math.max(progress, Math.min(100, Math.round(value)));
      bar.style.width = `${progress}%`;
      pct.textContent = `${progress}%`;
      if (text) label.textContent = text;
      setBootLog(progress);
      if (premiumHud?.network) premiumHud.network.classList.toggle('is-ready', progress >= 100);
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
      if (!forced && (!imageReady || !pageReady || !engineReady)) return;
      if (!forced && elapsed < MIN_SPLASH_MS) { window.setTimeout(() => finish(false), MIN_SPLASH_MS - elapsed); return; }
      finishing = true;
      await animateTo(100, 'READY');
      premiumHud?.complete?.classList.add('is-visible');
      premiumHud?.log?.querySelectorAll('span').forEach(node => node.classList.add('is-live'));
      if (premiumHud?.network) premiumHud.network.querySelector('span').textContent = 'RELAY NETWORK // ONLINE';
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

    if (!pageReady) window.addEventListener('load', () => { pageReady = true; animateTo(68, 'CONNECTING WORLD').then(finish); }, { once: true });
    else setProgress(68, 'CONNECTING WORLD');

    const checkEngine = () => {
      const canvas = document.querySelector('#phaser-game canvas');
      if (canvas) { engineReady = true; animateTo(86, 'PREPARING HOME').then(finish); return; }
      if (!finishing) window.setTimeout(checkEngine, 60);
    };
    checkEngine();

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
