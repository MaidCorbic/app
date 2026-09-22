
/* =========================================================
   RELAY RUNNER — CINEMATIC SPLASH V6
   First-load splash controller.
   ONE controller.
   0% -> 8% -> 26% -> 48% -> 68% -> 86% -> 100%
   Then cinematic exit -> HOME.
   ========================================================= */

(() => {
  if (window.__relaySplashV6) return;
  window.__relaySplashV6 = true;

  console.log('[RelaySplash V6] LOADED');

  const isCoarseDevice = () =>
    window.matchMedia?.('(pointer: coarse)').matches === true ||
    Number(navigator.maxTouchPoints || 0) > 0;

  const sleep = ms => new Promise(resolve => setTimeout(
    resolve,
    isCoarseDevice() ? Math.max(40, ms * .3) : ms
  ));

  const homeIsReady = () => {
    const home = document.getElementById('intro');
    const start = home?.querySelector(
      '#start, [data-v3-play], [data-home-v3-action="start"]'
    );

    return Boolean(
      home &&
      (
        home.dataset.homeV3Built === '1' ||
        home.dataset.homeV4Built === '1' ||
        document.documentElement.dataset.relayHomeReady === '1'
      ) &&
      start
    );
  };

  const revealHomeForRecovery = () => {
    const home = document.getElementById('intro');
    if (!home) return;

    home.classList.remove('hidden');
    home.removeAttribute('hidden');
    home.style.setProperty('visibility', 'visible', 'important');
    home.style.setProperty('opacity', '1', 'important');
    home.style.setProperty('pointer-events', 'auto', 'important');
    document.getElementById('game')?.classList.add('relay-boot-ready');
  };

  const waitForHomeReady = ({ timeoutMs = 1600 } = {}) => new Promise(resolve => {
    if (homeIsReady()) {
      resolve(true);
      return;
    }

    let settled = false;
    let timer = 0;

    const finish = ready => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      window.removeEventListener(
        'relay:home-ready',
        onReady
      );
      resolve(ready);
    };

    const onReady = () => {
      if (homeIsReady()) {
        finish(true);
      }
    };

    window.addEventListener(
      'relay:home-ready',
      onReady
    );

    const startedAt = performance.now();

    const check = () => {
      if (homeIsReady()) {
        finish(true);
        return;
      }

      if (performance.now() - startedAt >= timeoutMs) {
        revealHomeForRecovery();
        console.warn(
          '[RelaySplash V6] Home readiness timeout; opening app'
        );
        finish(false);
        return;
      }

      window.setTimeout(check, 20);
    };

    timer = window.setTimeout(
      () => check(),
      20
    );
  });

  /* ---------------------------------------------------------
     FIND SPLASH
     --------------------------------------------------------- */

  const getSplash = () =>
    document.querySelector('.relay-splash') ||
    document.getElementById('relaySplash');

  /* ---------------------------------------------------------
     FIRST PAINT
     --------------------------------------------------------- */

  const hardenSplash = splash => {
    if (!splash) return;

    const image =
      splash.querySelector('.relay-splash-art, #relaySplashArt');

    splash.style.position = 'fixed';
    splash.style.inset = '0';
    splash.style.width = '100vw';
    splash.style.height = '100vh';
    splash.style.width = '100dvw';
    splash.style.height = '100dvh';
    splash.style.zIndex = '2147483647';
    splash.style.display = 'grid';
    splash.style.opacity = '1';
    splash.style.visibility = 'visible';
    splash.style.pointerEvents = 'auto';
    splash.style.transform = 'scale(1)';
    splash.style.filter = 'none';

    splash.classList.remove('is-hidden');

    if (image) {
      const portrait =
        window.matchMedia(
          '(max-width:700px) and (orientation:portrait)'
        ).matches;

      image.style.display = 'block';
      image.style.position = 'absolute';
      image.style.inset = '0';
      image.style.width = '100vw';
      image.style.height = '100vh';
      image.style.width = '100dvw';
      image.style.height = '100dvh';
      image.style.minWidth = '100%';
      image.style.minHeight = '100%';
      image.style.maxWidth = 'none';
      image.style.maxHeight = 'none';
      image.style.objectFit = portrait ? 'contain' : 'cover';
      image.style.objectPosition = 'center';
      image.style.opacity = '1';
      image.style.transform = 'none';
      image.style.animation = 'none';
    }
  };

  /* ---------------------------------------------------------
     PREMIUM HUD
     --------------------------------------------------------- */

  const installHud = () => {
    if (document.getElementById('relay-v6-style')) return;

    const style = document.createElement('style');

    style.id = 'relay-v6-style';

    style.textContent = `
      .relay-splash{
        isolation:isolate !important;
        background:#000 !important;
      }

      .relay-splash .relay-v6-network{
        position:absolute;
        z-index:20;
        top:max(20px,env(safe-area-inset-top));
        right:max(20px,env(safe-area-inset-right));
        display:flex;
        align-items:center;
        gap:8px;
        padding:8px 12px;
        border:1px solid rgba(0,234,255,.35);
        border-left:2px solid #00eaff;
        background:rgba(0,8,15,.72);
        color:#b8fbff;
        font:900 8px/1 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
        letter-spacing:.16em;
        text-transform:uppercase;
        box-shadow:
          0 0 18px rgba(0,234,255,.10),
          inset 0 0 18px rgba(0,234,255,.04);
      }

      .relay-splash .relay-v6-network i{
        width:6px;
        height:6px;
        flex:0 0 6px;
        border-radius:50%;
        background:#00eaff;
        box-shadow:
          0 0 7px #00eaff,
          0 0 18px #00eaff;
        animation:relayV6Pulse 1s ease-in-out infinite;
      }

      .relay-splash .relay-splash-ui{
        z-index:20;
      }

      .relay-splash .relay-v6-grid{
        display:grid;
        grid-template-columns:repeat(3,minmax(0,1fr));
        gap:1px;
        margin-top:7px;
        border:1px solid rgba(117,247,255,.16);
        background:rgba(117,247,255,.10);
      }

      .relay-splash .relay-v6-cell{
        min-width:0;
        padding:8px;
        display:flex;
        justify-content:space-between;
        gap:8px;
        background:rgba(0,9,16,.76);
      }

      .relay-splash .relay-v6-cell span{
        color:rgba(190,215,221,.45);
        font:700 7px/1 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
        letter-spacing:.12em;
      }

      .relay-splash .relay-v6-cell b{
        color:#b8fbff;
        font:900 7px/1 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
        letter-spacing:.08em;
        white-space:nowrap;
      }

      .relay-splash .relay-v6-log{
        display:grid;
        gap:4px;
        margin-top:7px;
        padding:7px 9px 3px;
        border-top:1px solid rgba(117,247,255,.12);
        color:rgba(141,250,255,.48);
        font:700 7px/1.3 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
        letter-spacing:.10em;
        text-transform:uppercase;
      }

      .relay-splash .relay-v6-log .live{
        color:#b8fbff;
        text-shadow:0 0 10px rgba(0,234,255,.35);
      }

      .relay-splash .relay-v6-complete{
        display:none;
        align-items:center;
        gap:9px;
        margin-top:7px;
        padding-top:6px;
        border-top:1px solid rgba(255,210,60,.18);
      }

      .relay-splash .relay-v6-complete.show{
        display:flex;
      }

      .relay-splash .relay-v6-complete i{
        width:8px;
        height:8px;
        flex:0 0 8px;
        border-radius:50%;
        background:#ffd23c;
        box-shadow:
          0 0 8px #ffd23c,
          0 0 20px #ffd23c;
      }

      .relay-splash .relay-v6-complete strong{
        display:block;
        color:#f5fdff;
        font:900 9px/1.1 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
        letter-spacing:.14em;
      }

      .relay-splash .relay-v6-complete small{
        display:block;
        margin-top:3px;
        color:rgba(141,250,255,.50);
        font:700 7px/1 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
        letter-spacing:.12em;
      }

      @keyframes relayV6Pulse{
        0%,100%{
          opacity:.35;
          transform:scale(.75);
        }
        50%{
          opacity:1;
          transform:scale(1.2);
        }
      }

      @media(max-width:700px){
        .relay-splash .relay-v6-network{
          top:12px;
          right:12px;
          padding:6px 8px;
          font-size:6px;
        }

        .relay-splash .relay-v6-grid{
          grid-template-columns:1fr 1fr;
        }

        .relay-splash .relay-v6-cell:last-child{
          grid-column:1 / -1;
        }

        .relay-splash .relay-v6-cell{
          padding:7px;
        }

        .relay-splash .relay-v6-cell span,
        .relay-splash .relay-v6-cell b{
          font-size:6px;
        }

        .relay-splash .relay-v6-log{
          font-size:6px;
        }
      }

      @media(max-width:700px) and (orientation:portrait){
        .relay-splash .relay-v6-network{
          display:none;
        }
      }

      @media(prefers-reduced-motion:reduce){
        .relay-splash .relay-v6-network i{
          animation:none;
        }
      }
    `;

    document.head.appendChild(style);
  };

  /* ---------------------------------------------------------
     HUD
     --------------------------------------------------------- */

  const mountHud = splash => {
    const ui = splash.querySelector('.relay-splash-ui');

    if (!ui) return null;

    if (ui.querySelector('.relay-v6-grid')) {
      return {
        network: splash.querySelector('.relay-v6-network'),
        grid: ui.querySelector('.relay-v6-grid'),
        log: ui.querySelector('.relay-v6-log'),
        complete: ui.querySelector('.relay-v6-complete')
      };
    }

    const network = document.createElement('div');

    network.className = 'relay-v6-network';

    network.innerHTML =
      '<i></i><span>RELAY NETWORK // ONLINE</span>';

    splash.appendChild(network);

    const grid = document.createElement('div');

    grid.className = 'relay-v6-grid';

    grid.innerHTML = `
      <div class="relay-v6-cell">
        <span>NODE</span>
        <b>04 // ONLINE</b>
      </div>

      <div class="relay-v6-cell">
        <span>SIGNAL</span>
        <b>STABLE // LOCKED</b>
      </div>

      <div class="relay-v6-cell">
        <span>RELAY</span>
        <b>SYNCED // READY</b>
      </div>
    `;

    const log = document.createElement('div');

    log.className = 'relay-v6-log';

    log.innerHTML = `
      <span class="live">→ RELAY CORE INITIALIZING</span>
      <span>→ WORLD NODE STANDBY</span>
    `;

    const complete = document.createElement('div');

    complete.className = 'relay-v6-complete';

    complete.innerHTML = `
      <i></i>
      <div>
        <strong>RELAY NETWORK ONLINE</strong>
        <small>BOOT COMPLETE // HOME READY</small>
      </div>
    `;

    ui.appendChild(grid);
    ui.appendChild(log);
    ui.appendChild(complete);

    return {
      network,
      grid,
      log,
      complete
    };
  };

  /* ---------------------------------------------------------
     PROGRESS
     --------------------------------------------------------- */

  const run = async () => {
    const splash = getSplash();

    if (!splash) {
      console.error('[RelaySplash V6] SPLASH NOT FOUND');
      return;
    }

    /*
     * Last-resort mobile recovery. This is deliberately longer than the
     * normal boot sequence, but guarantees that a browser lifecycle pause or
     * optional module failure cannot leave the first screen blocking Home.
     */
    const failOpenTimer = window.setTimeout(() => {
      if (!document.body.contains(splash)) return;

      console.warn('[RelaySplash V6] watchdog recovery; opening Home');
      revealHomeForRecovery();
      splash.setAttribute('aria-busy', 'false');
      splash.remove();
    }, 3500);

    const clearFailOpenTimer = () =>
      window.clearTimeout(failOpenTimer);

    hardenSplash(splash);
    installHud();

    const image =
      splash.querySelector('.relay-splash-art, #relaySplashArt');

    const bar =
      splash.querySelector('.relay-splash-progress');

    const pct =
      splash.querySelector('.relay-splash-percent');

    const label =
      splash.querySelector('.relay-splash-status');

    if (!image || !bar || !pct || !label) {
      console.error('[RelaySplash V6] REQUIRED ELEMENT MISSING');
      clearFailOpenTimer();
      revealHomeForRecovery();
      splash.remove();
      return;
    }

    const hud = mountHud(splash);

    let progress = 0;

    const setProgress = (value, text) => {
      progress = Math.max(
        progress,
        Math.min(100, Math.round(value))
      );

      bar.style.width = `${progress}%`;
      bar.style.transform = 'translateZ(0)';

      pct.textContent = `${progress}%`;

      if (text) {
        label.textContent = text;
      }

      if (hud?.network) {
        const textNode =
          hud.network.querySelector('span');

        if (textNode) {
          textNode.textContent =
            progress >= 100
              ? 'RELAY NETWORK // ONLINE // READY'
              : 'RELAY NETWORK // ONLINE';
        }
      }

      if (hud?.log) {
        const lines = hud.log.querySelectorAll('span');

        if (lines[0]) {
          lines[0].textContent =
            progress >= 86
              ? '→ HOME SYSTEMS VERIFIED'
              : progress >= 68
                ? '→ ROUTE DATA VERIFIED'
                : progress >= 48
                  ? '→ GAME SYSTEMS LOADING'
                  : progress >= 26
                    ? '→ INTERFACE CORE ONLINE'
                    : '→ RELAY CORE INITIALIZING';

          lines[0].className = 'live';
        }

        if (lines[1]) {
          lines[1].textContent =
            progress >= 86
              ? '→ RELAY NETWORK READY'
              : progress >= 68
                ? '→ WORLD NODE ONLINE'
                : progress >= 48
                  ? '→ WORLD NODE SYNCING'
                  : progress >= 26
                    ? '→ ROUTE DATA AWAITING'
                    : '→ WORLD NODE STANDBY';

          lines[1].className =
            progress >= 68 ? 'live' : '';
        }
      }

      console.log(
        '[RelaySplash V6] PROGRESS',
        progress,
        text || ''
      );
    };

    const animateTo = (target, text, duration) => {
      return new Promise(resolve => {
        const from = progress;
        const to = Math.max(from, Math.min(100, target));

        const start = performance.now();
        const effectiveDuration = isCoarseDevice()
          ? Math.max(120, duration * .3)
          : duration;

        const frame = now => {
          const t = Math.min(
            1,
            (now - start) / effectiveDuration
          );

          const eased =
            1 - Math.pow(1 - t, 3);

          setProgress(
            from + (to - from) * eased,
            text
          );

          if (t < 1) {
            window.setTimeout(
              () => frame(performance.now()),
              16
            );
          } else {
            setProgress(to, text);
            resolve();
          }
        };

        window.setTimeout(
          () => frame(performance.now()),
          16
        );
      });
    };

    /* NEVER ALLOW ANOTHER CSS STATE TO HIDE THE SPLASH */

    splash.classList.remove('is-hidden');

    splash.style.opacity = '1';
    splash.style.visibility = 'visible';
    splash.style.pointerEvents = 'auto';
    splash.style.transform = 'scale(1)';
    splash.style.filter = 'none';
    splash.setAttribute('aria-busy', 'true');

    /* =====================================================
       HOME-FIRST REVEAL
       ===================================================== */

    setProgress(
      100,
      'RELAY ONLINE'
    );

    await waitForHomeReady({
      timeoutMs: 1600
    });

    /* =====================================================
       100% HOLD
       ===================================================== */

    if (hud?.complete) {
      hud.complete.classList.add('show');
    }

    const isMobileBoot =
      window.matchMedia?.('(pointer: coarse)').matches === true;

    await sleep(100);

    /* =====================================================
       CINEMATIC EXIT
       ===================================================== */

    splash.setAttribute('aria-busy', 'false');

    const exitDuration = isMobileBoot ? '0.10s' : '0.14s';

    splash.style.transition =
      `opacity ${exitDuration} cubic-bezier(.16,1,.3,1),` +
      `transform ${exitDuration} cubic-bezier(.16,1,.3,1),` +
      `filter ${exitDuration} ease`;

    void splash.offsetWidth;

    splash.style.opacity = '0';
    splash.style.transform = 'scale(1.035)';
    splash.style.filter =
      'brightness(1.2) saturate(1.08)';

    await sleep(150);

    splash.remove();
    document.getElementById('game')?.classList.add('relay-boot-ready');
    clearFailOpenTimer();

    console.log(
      '[RelaySplash V6] EXIT COMPLETE — HOME ACTIVE'
    );
  };

  /* ---------------------------------------------------------
     START IMMEDIATELY
     --------------------------------------------------------- */

  run().catch(error => {
    console.error(
      '[RelaySplash V6] FATAL ERROR',
      error
    );

    /*
      Emergency recovery:
      If something unexpected breaks the cinematic sequence,
      never leave the user stuck on the splash.
    */

    const splash = getSplash();

    if (splash) {
      document.getElementById('game')?.classList.add('relay-boot-ready');
      splash.remove();
    }
  });
})();

