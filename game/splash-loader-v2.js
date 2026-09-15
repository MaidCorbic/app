/* Runner Relay — production first-load splash.
 *
 * IMPORTANT:
 * This controller is presentation-only. It must NEVER wait for Phaser,
 * mission routing, network state, or another boot controller before hiding
 * the splash. The Home UI owns the actual runtime readiness.
 */
(() => {
  'use strict';

  if (window.__relaySplashV4) return;
  window.__relaySplashV4 = true;

  const MAX_SPLASH_MS = 4200;
  const MIN_SPLASH_MS = 1500;
  const WAIT = ms => new Promise(resolve => window.setTimeout(resolve, ms));

  const getSplash = () => document.querySelector('#relaySplash, .relay-splash');

  const hardenViewport = () => {
    const splash = getSplash();
    const image = splash?.querySelector('#relaySplashArt, .relay-splash-art');
    if (!splash || !image) return;

    const portrait = window.matchMedia?.('(max-width:700px) and (orientation:portrait)').matches;
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
    image.style.objectFit = portrait ? 'contain' : 'cover';
    image.style.objectPosition = 'center';
    image.style.transform = 'none';
    image.style.animation = 'none';
    image.style.opacity = '1';
  };

  const installStyle = () => {
    if (document.getElementById('relay-premium-boot-style')) return;
    const style = document.createElement('style');
    style.id = 'relay-premium-boot-style';
    style.textContent = `
      .relay-splash .relay-splash-network-status{
        position:absolute;z-index:8;top:max(24px,env(safe-area-inset-top));right:max(24px,env(safe-area-inset-right));
        display:flex;align-items:center;gap:8px;padding:7px 10px;
        border:1px solid rgba(0,234,255,.20);background:rgba(0,12,20,.38);color:rgba(141,250,255,.70);
        font:800 8px/1 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;letter-spacing:.16em;text-transform:uppercase;
        text-shadow:0 2px 10px #000,0 0 12px rgba(0,234,255,.22);box-shadow:inset 0 0 18px rgba(0,234,255,.03)
      }
      .relay-splash .relay-splash-network-status i{width:6px;height:6px;flex:0 0 6px;border-radius:50%;background:#00eaff;box-shadow:0 0 7px #00eaff,0 0 16px rgba(0,234,255,.62);animation:relayPremiumPulse .95s ease-in-out infinite}
      .relay-splash .relay-splash-ui{width:min(900px,calc(100vw - 48px));padding:12px 12px 11px;gap:9px;border:1px solid rgba(117,247,255,.19);border-top-color:rgba(255,210,60,.18);background:linear-gradient(180deg,rgba(1,9,16,.82),rgba(1,6,11,.64));box-shadow:0 20px 50px rgba(0,0,0,.38),inset 0 0 28px rgba(0,234,255,.025);backdrop-filter:blur(5px)}
      .relay-splash .relay-splash-ui::before{content:"SYSTEM LINK  //  SECURE CHANNEL";margin-bottom:-1px;padding:5px 8px;border-left:2px solid #00eaff;background:linear-gradient(90deg,rgba(0,234,255,.09),transparent);color:rgba(141,250,255,.62);font-size:7px;letter-spacing:.18em}
      .relay-splash .relay-splash-meta{padding:11px 12px 10px;border-color:rgba(117,247,255,.14);border-bottom-color:rgba(117,247,255,.30);background:rgba(0,7,12,.36)}
      .relay-splash .relay-splash-status{font-size:10px;letter-spacing:.17em}
      .relay-splash .relay-splash-percent{font-size:19px;min-width:62px}
      .relay-splash .relay-splash-track{height:9px;border-color:rgba(117,247,255,.40);background:repeating-linear-gradient(90deg,rgba(141,250,255,.05) 0 1px,transparent 1px 24px),linear-gradient(180deg,rgba(0,18,29,.98),rgba(0,5,10,.99))}
      .relay-splash .relay-splash-progress{background:linear-gradient(90deg,#006d8a 0%,#168cff 25%,#00eaff 63%,#8dfaff 88%,#fff 100%);transition:width .16s cubic-bezier(.16,1,.3,1)}
      .relay-splash .relay-boot-status-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;border:1px solid rgba(117,247,255,.10);background:rgba(117,247,255,.08)}
      .relay-splash .relay-boot-status-cell{min-width:0;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:7px 8px;background:rgba(0,8,13,.68)}
      .relay-splash .relay-boot-status-cell span{color:rgba(190,215,221,.46);font:700 7px/1 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;letter-spacing:.14em;text-transform:uppercase}
      .relay-splash .relay-boot-status-cell b{color:rgba(141,250,255,.80);font:900 7px/1 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;letter-spacing:.10em;text-transform:uppercase;white-space:nowrap}
      .relay-splash .relay-boot-log{display:grid;gap:3px;min-height:24px;padding:6px 8px 2px;border-top:1px solid rgba(117,247,255,.07);color:rgba(141,250,255,.43);font:700 7px/1.25 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;letter-spacing:.12em;text-transform:uppercase}
      .relay-splash .relay-boot-log .is-live{color:rgba(141,250,255,.78);text-shadow:0 0 12px rgba(0,234,255,.22)}
      .relay-splash .relay-boot-log .is-muted{color:rgba(175,188,184,.28)}
      .relay-splash .relay-boot-complete{display:none;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:9px;padding-top:3px}
      .relay-splash .relay-boot-complete.is-visible{display:grid}
      .relay-splash .relay-boot-complete b{width:7px;height:7px;border-radius:50%;background:#ffd23c;box-shadow:0 0 9px #ffd23c,0 0 18px rgba(255,210,60,.35)}
      .relay-splash .relay-boot-complete strong{display:block;color:rgba(245,253,255,.94);font:900 9px/1.1 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;letter-spacing:.18em;text-transform:uppercase}
      .relay-splash .relay-boot-complete small{display:block;margin-top:3px;color:rgba(141,250,255,.48);font:700 7px/1.1 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;letter-spacing:.14em;text-transform:uppercase}
      @keyframes relayPremiumPulse{0%,100%{opacity:.35;transform:scale(.72)}50%{opacity:1;transform:scale(1.18)}}
      @media(max-width:700px){
        .relay-splash .relay-splash-network-status{top:max(14px,env(safe-area-inset-top));right:max(14px,env(safe-area-inset-right));padding:6px 8px;font-size:6px;letter-spacing:.10em}
        .relay-splash .relay-splash-ui{width:calc(100vw - 20px);padding:9px 9px 8px;gap:7px}
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
      @media(max-width:700px) and (orientation:portrait){.relay-splash .relay-splash-network-status{display:none}}
      @media(prefers-reduced-motion:reduce){.relay-splash .relay-splash-network-status i{animation:none}}
    `;
    document.head.appendChild(style);
  };

  const mountHud = splash => {
    const ui = splash?.querySelector('.relay-splash-ui');
    if (!ui || ui.querySelector('.relay-boot-status-grid')) return;

    const network = document.createElement('div');
    network.className = 'relay-splash-network-status';
    network.innerHTML = '<i></i><span>NETWORK // ONLINE</span>';
    splash.appendChild(network);

    const telemetry = document.createElement('div');
    telemetry.className = 'relay-boot-status-grid';
    telemetry.innerHTML = '<div class="relay-boot-status-cell"><span>NODE</span><b>04 // ONLINE</b></div><div class="relay-boot-status-cell"><span>SIGNAL</span><b>STABLE</b></div><div class="relay-boot-status-cell"><span>RELAY</span><b>SYNCED</b></div>';

    const log = document.createElement('div');
    log.className = 'relay-boot-log';
    log.setAttribute('aria-live', 'polite');
    log.innerHTML = '<span class="is-live">→ RELAY CORE INITIALIZING</span><span class="is-muted">→ WORLD NODE OFFLINE</span>';

    const complete = document.createElement('div');
    complete.className = 'relay-boot-complete';
    complete.innerHTML = '<b aria-hidden="true"></b><div><strong>RELAY NETWORK ONLINE</strong><small>BOOT COMPLETE // HOME READY</small></div>';

    ui.append(telemetry, log, complete);
    return { network, telemetry, log, complete };
  };

  const revealHomeIfNeeded = () => {
    const intro = document.getElementById('intro');
    const canvas = document.querySelector('#phaser-game canvas');
    if (!intro || canvas) return;
    intro.classList.remove('hidden');
    intro.setAttribute('aria-hidden', 'false');
  };

  const boot = () => {
    hardenViewport();
    installStyle();
    document.getElementById('bootLoader')?.remove();

    const splash = getSplash();
    if (!splash) return;
    splash.classList.add('relay-splash');
    splash.setAttribute('aria-busy', 'true');

    const image = splash.querySelector('#relaySplashArt, .relay-splash-art');
    const bar = splash.querySelector('.relay-splash-progress');
    const percent = splash.querySelector('.relay-splash-percent');
    const status = splash.querySelector('.relay-splash-status');
    if (!image || !bar || !percent || !status) return;

    hardenViewport();
    mountHud(splash);
    const hud = {
      log: splash.querySelector('.relay-boot-log'),
      complete: splash.querySelector('.relay-boot-complete'),
      network: splash.querySelector('.relay-splash-network-status')
    };

    let progress = 0;
    let released = false;
    const started = performance.now();

    const setProgress = (value, text) => {
      if (released) return;
      progress = Math.max(progress, Math.min(100, Math.round(value)));
      bar.style.width = `${progress}%`;
      percent.textContent = `${progress}%`;
      if (text) status.textContent = text;

      if (hud.log) {
        const [first, second] = hud.log.querySelectorAll('span');
        if (progress >= 75) {
          if (first) { first.textContent = '→ ROUTE DATA RECEIVED'; first.className = 'is-live'; }
          if (second) { second.textContent = '→ WORLD NODE ONLINE'; second.className = 'is-live'; }
        } else if (progress >= 48) {
          if (first) { first.textContent = '→ ROUTE DATA RECEIVED'; first.className = 'is-live'; }
          if (second) { second.textContent = '→ WORLD NODE SYNCING'; second.className = 'is-muted'; }
        } else if (progress >= 26) {
          if (first) { first.textContent = '→ INTERFACE CORE ONLINE'; first.className = 'is-live'; }
          if (second) { second.textContent = '→ ROUTE DATA AWAITING'; second.className = 'is-muted'; }
        }
      }
    };

    const animateTo = (target, text) => new Promise(resolve => {
      const from = progress;
      if (target <= from) { setProgress(target, text); resolve(); return; }
      const startedAt = performance.now();
      const duration = Math.min(520, Math.max(140, (target - from) * 9));
      const frame = () => {
        if (released) { resolve(); return; }
        const t = Math.min(1, (performance.now() - startedAt) / duration);
        setProgress(from + (target - from) * (t * (2 - t)), text);
        if (t < 1) window.setTimeout(frame, 24);
        else resolve();
      };
      frame();
    });

    const release = async reason => {
      if (released) return;
      released = true;
      setProgress(100, 'READY');
      bar.style.width = '100%';
      percent.textContent = '100%';
      status.textContent = 'READY';
      hud.complete?.classList.add('is-visible');
      hud.log?.querySelectorAll('span').forEach(node => node.classList.add('is-live'));
      if (hud.network) hud.network.querySelector('span').textContent = 'RELAY NETWORK // ONLINE';
      splash.setAttribute('aria-busy', 'false');
      splash.dataset.releaseReason = reason;
      window.dispatchEvent(new CustomEvent('relay:splash-released', { detail: { reason } }));

      await WAIT(160);
      splash.classList.add('is-hidden');
      revealHomeIfNeeded();
      window.setTimeout(() => splash.remove(), 520);
    };

    const elapsed = () => performance.now() - started;

    const stages = [
      [8, 'INITIALIZING RELAY', 120],
      [26, 'LOADING INTERFACE', 420],
      [48, 'LOADING GAME SYSTEMS', 760],
      [68, 'CONNECTING WORLD', 1120],
      [82, 'PREPARING HOME', 1480],
      [94, 'STARTING HOME', 1900]
    ];
    stages.forEach(([value, text, delay]) => window.setTimeout(() => setProgress(value, text), delay));

    const finishTimer = window.setTimeout(() => release('hard-timeout'), MAX_SPLASH_MS);

    const maybeFinish = () => {
      if (released) return;
      if (elapsed() >= MIN_SPLASH_MS) release('presentation-complete');
      else window.setTimeout(maybeFinish, MIN_SPLASH_MS - elapsed());
    };

    if (image.complete && image.naturalWidth > 0) {
      setProgress(26, 'LOADING INTERFACE');
    } else {
      image.addEventListener('load', () => setProgress(26, 'LOADING INTERFACE'), { once: true });
      image.addEventListener('error', () => setProgress(22, 'SAFE MODE'), { once: true });
    }

    window.setTimeout(maybeFinish, MIN_SPLASH_MS);
    window.addEventListener('resize', hardenViewport, { passive: true });
    window.addEventListener('orientationchange', hardenViewport, { passive: true });
    window.setTimeout(() => window.clearTimeout(finishTimer), MAX_SPLASH_MS + 50);
  };

  // Module scripts execute after the document has been parsed, but DOMContentLoaded
  // waits for module execution. Waiting for DOMContentLoaded here therefore delayed
  // the splash controller until after the rest of the runtime boot. Start immediately.
  boot();
})();
