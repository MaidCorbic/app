/*
 * RUNNER RELAY — CINEMATIC SPLASH V4
 *
 * Owns:
 * - first-load presentation
 * - cinematic boot progress
 * - loading telemetry
 * - mobile / desktop splash layout
 * - safe fail-open behavior
 *
 * Does not own:
 * - Home gameplay UI
 * - gameplay launch logic
 * - mission logic
 */

(() => {
  'use strict';

  if (window.__relaySplashV3) return;
  window.__relaySplashV3 = true;

  const SELECTORS = Object.freeze({
    splash: '.relay-splash',
    splashId: '#relaySplash',
    image: '.relay-splash-art, #relaySplashArt',
    bar: '.relay-splash-progress',
    percent: '.relay-splash-percent',
    status: '.relay-splash-status',
    ui: '.relay-splash-ui',
    brand: '.relay-splash-brand',
    bootLoader: '#bootLoader',
    engineCanvas: '#phaser-game canvas',
  });

  const TIMING = Object.freeze({
    minimumMs: 2200,
    maximumMs: 7000,
    finishHoldMs: 420,
    removeDelayMs: 700,
    pollMs: 60,
  });

  const BOOT_STAGES = Object.freeze([
    {
      percent: 8,
      label: 'INITIALIZING RELAY',
      live: '→ RELAY CORE INITIALIZING',
      muted: '→ WORLD NODE OFFLINE',
    },
    {
      percent: 26,
      label: 'LOADING INTERFACE',
      live: '→ INTERFACE CORE ONLINE',
      muted: '→ ROUTE DATA AWAITING',
    },
    {
      percent: 48,
      label: 'LOADING GAME SYSTEMS',
      live: '→ ROUTE DATA RECEIVED',
      muted: '→ WORLD NODE SYNCING',
    },
    {
      percent: 68,
      label: 'CONNECTING WORLD',
      live: '→ WORLD NODE ONLINE',
      muted: '→ SIGNAL CHANNEL STABLE',
    },
    {
      percent: 86,
      label: 'PREPARING HOME',
      live: '→ HOME SYSTEMS READY',
      muted: '→ RELAY CHANNEL STABLE',
    },
  ]);

  const runtime = {
    splash: null,
    image: null,
    bar: null,
    percent: null,
    label: null,
    hud: null,

    progress: 0,

    imageReady: false,
    pageReady: document.readyState === 'complete',
    engineReady: false,

    finishing: false,
    timedOut: false,

    startedAt: 0,

    timers: new Set(),
    listeners: [],
  };

  const getSplash = () =>
    document.querySelector(SELECTORS.splash) ||
    document.querySelector(SELECTORS.splashId);

  const isPortraitMobile = () =>
    window.matchMedia(
      '(max-width:700px) and (orientation:portrait)'
    ).matches;

  const wait = ms =>
    new Promise(resolve => {
      const timer = window.setTimeout(() => {
        runtime.timers.delete(timer);
        resolve();
      }, ms);

      runtime.timers.add(timer);
    });

  const addListener = (
    target,
    event,
    handler,
    options
  ) => {
    if (!target?.addEventListener) return;

    target.addEventListener(
      event,
      handler,
      options
    );

    runtime.listeners.push(() => {
      try {
        target.removeEventListener(
          event,
          handler,
          options
        );
      } catch {}
    });
  };

  const clearTimers = () => {
    runtime.timers.forEach(timer => {
      window.clearTimeout(timer);
    });

    runtime.timers.clear();
  };

  const cleanupListeners = () => {
    runtime.listeners.forEach(remove => {
      try {
        remove();
      } catch {}
    });

    runtime.listeners.length = 0;
  };

  const applyFirstPaintHardening = () => {
    const splash = getSplash();

    if (!splash) return;

    const image = splash.querySelector(
      SELECTORS.image
    );

    if (!image) return;

    const portrait = isPortraitMobile();

    splash.style.width = '100dvw';
    splash.style.height = '100dvh';
    splash.style.minWidth = '100dvw';
    splash.style.minHeight = '100dvh';
    splash.style.maxWidth = 'none';
    splash.style.maxHeight = 'none';

    image.style.display = 'block';
    image.style.position = 'absolute';
    image.style.inset = '0';

    image.style.width = '100dvw';
    image.style.height = '100dvh';

    image.style.minWidth = '100%';
    image.style.minHeight = '100%';

    image.style.maxWidth = 'none';
    image.style.maxHeight = 'none';

    image.style.objectFit =
      portrait
        ? 'contain'
        : 'cover';

    image.style.objectPosition = 'center';

    image.style.transform = 'none';
    image.style.animation = 'none';
    image.style.opacity = '1';
  };

  const installPremiumBootHud = () => {
    if (
      document.getElementById(
        'relay-premium-boot-style'
      )
    ) {
      return;
    }

    const style =
      document.createElement('style');

    style.id =
      'relay-premium-boot-style';

    style.textContent = `
      .relay-splash{
        isolation:isolate;
        overflow:hidden;
      }

      .relay-splash .relay-splash-brand{
        z-index:10;
      }

      .relay-splash .relay-splash-network-status{
        position:absolute;
        z-index:12;

        top:max(
          24px,
          env(safe-area-inset-top)
        );

        right:max(
          24px,
          env(safe-area-inset-right)
        );

        display:flex;
        align-items:center;
        gap:8px;

        min-height:28px;
        padding:7px 10px;

        border:1px solid rgba(0,234,255,.20);

        background:
          linear-gradient(
            135deg,
            rgba(0,18,28,.58),
            rgba(0,8,14,.34)
          );

        color:rgba(141,250,255,.70);

        font:
          800 8px/1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          Monaco,
          Consolas,
          monospace;

        letter-spacing:.16em;
        text-transform:uppercase;

        text-shadow:
          0 2px 10px rgba(0,0,0,.9),
          0 0 12px rgba(0,234,255,.20);

        box-shadow:
          inset 0 0 18px rgba(0,234,255,.03),
          0 0 20px rgba(0,234,255,.025);

        backdrop-filter:blur(6px);
      }

      .relay-splash .relay-splash-network-status i{
        width:6px;
        height:6px;
        flex:0 0 6px;

        border-radius:50%;

        background:
          var(--rr-cyan,#00eaff);

        box-shadow:
          0 0 7px var(--rr-cyan,#00eaff),
          0 0 16px rgba(0,234,255,.62);

        animation:
          relayPremiumPulse .95s
          ease-in-out infinite;
      }

      .relay-splash .relay-splash-network-status.is-ready{
        border-color:rgba(103,232,176,.26);
        color:rgba(134,239,172,.82);
      }

      .relay-splash .relay-splash-network-status.is-ready i{
        background:#67e8b0;
        box-shadow:
          0 0 7px rgba(103,232,176,.92),
          0 0 16px rgba(103,232,176,.40);
      }

      .relay-splash .relay-splash-ui{
        position:relative;
        z-index:10;

        width:min(
          900px,
          calc(100vw - 48px)
        );

        padding:
          12px
          12px
          11px;

        gap:9px;

        border:1px solid
          rgba(117,247,255,.19);

        border-top-color:
          rgba(255,210,60,.18);

        background:
          linear-gradient(
            180deg,
            rgba(1,9,16,.84),
            rgba(1,6,11,.68)
          );

        box-shadow:
          0 20px 50px rgba(0,0,0,.40),
          inset 0 0 28px
            rgba(0,234,255,.025),
          0 0 50px
            rgba(0,234,255,.025);

        backdrop-filter:blur(5px);
      }

      .relay-splash .relay-splash-ui::before{
        content:
          "SYSTEM LINK  //  SECURE CHANNEL";

        display:block;

        margin-bottom:-1px;
        padding:5px 8px;

        border-left:
          2px solid
          var(--rr-cyan,#00eaff);

        background:
          linear-gradient(
            90deg,
            rgba(0,234,255,.09),
            transparent
          );

        color:
          rgba(141,250,255,.62);

        font:
          800 7px/1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          Monaco,
          Consolas,
          monospace;

        letter-spacing:.18em;
        text-transform:uppercase;
      }

      .relay-splash .relay-splash-meta{
        min-width:0;

        padding:
          11px
          12px
          10px;

        border-color:
          rgba(117,247,255,.14);

        border-bottom-color:
          rgba(117,247,255,.30);

        background:
          rgba(0,7,12,.38);

        box-shadow:
          inset 0 1px
            rgba(255,255,255,.025);
      }

      .relay-splash .relay-splash-status{
        min-width:0;

        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;

        font:
          900 10px/1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          Monaco,
          Consolas,
          monospace;

        letter-spacing:.17em;
      }

      .relay-splash .relay-splash-percent{
        min-width:62px;

        font:
          950 19px/.9
          ui-monospace,
          SFMono-Regular,
          Menlo,
          Monaco,
          Consolas,
          monospace;

        letter-spacing:.04em;

        text-shadow:
          0 0 18px
            rgba(0,234,255,.24);
      }

      .relay-splash .relay-splash-track{
        position:relative;

        height:9px;

        border-color:
          rgba(117,247,255,.40);

        background:
          repeating-linear-gradient(
            90deg,
            rgba(141,250,255,.05) 0 1px,
            transparent 1px 24px
          ),
          linear-gradient(
            180deg,
            rgba(0,18,29,.98),
            rgba(0,5,10,.99)
          );

        overflow:hidden;

        box-shadow:
          inset 0 1px
            rgba(255,255,255,.03),
          inset 0 -1px
            rgba(0,0,0,.35),
          0 0 22px
            rgba(0,234,255,.035);
      }

      .relay-splash .relay-splash-track::before{
        content:"";

        position:absolute;
        inset:0;

        pointer-events:none;

        background:
          repeating-linear-gradient(
            90deg,
            rgba(141,250,255,.15) 0 1px,
            transparent 1px 24px
          );

        opacity:.65;
      }

      .relay-splash .relay-splash-progress{
        position:relative;
        z-index:2;

        min-width:0;

        background:
          linear-gradient(
            90deg,
            #006d8a 0%,
            var(--rr-blue,#168cff) 25%,
            var(--rr-cyan,#00eaff) 63%,
            var(--rr-cyan2,#8dfaff) 88%,
            #fff 100%
          );

        box-shadow:
          0 0 16px
            rgba(0,234,255,.40),
          0 0 34px
            rgba(0,234,255,.12);

        transition:
          width .20s
          cubic-bezier(.16,1,.3,1);

        overflow:hidden;
      }

      .relay-splash .relay-splash-progress::after{
        content:"";

        position:absolute;
        top:0;
        left:-25%;

        width:24%;
        height:100%;

        background:
          linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,.66),
            transparent
          );

        animation:
          relayProgressSweep 1.8s
          linear infinite;
      }

      .relay-splash .relay-boot-status-grid{
        display:grid;
        grid-template-columns:
          repeat(
            3,
            minmax(0,1fr)
          );

        gap:1px;

        border:1px solid
          rgba(117,247,255,.10);

        background:
          rgba(117,247,255,.08);
      }

      .relay-splash .relay-boot-status-cell{
        min-width:0;

        display:flex;
        align-items:center;
        justify-content:space-between;

        gap:10px;

        padding:7px 8px;

        background:
          linear-gradient(
            180deg,
            rgba(0,12,19,.74),
            rgba(0,7,12,.68)
          );
      }

      .relay-splash .relay-boot-status-cell span{
        min-width:0;

        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;

        color:
          rgba(190,215,221,.46);

        font:
          700 7px/1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          Monaco,
          Consolas,
          monospace;

        letter-spacing:.14em;
        text-transform:uppercase;
      }

      .relay-splash .relay-boot-status-cell b{
        min-width:0;

        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;

        color:
          rgba(141,250,255,.80);

        font:
          900 7px/1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          Monaco,
          Consolas,
          monospace;

        letter-spacing:.10em;
        text-transform:uppercase;
      }

      .relay-splash .relay-boot-log{
        display:grid;

        gap:3px;

        min-height:24px;

        padding:
          6px
          8px
          2px;

        border-top:
          1px solid
          rgba(117,247,255,.07);

        color:
          rgba(141,250,255,.43);

        font:
          700 7px/1.25
          ui-monospace,
          SFMono-Regular,
          Menlo,
          Monaco,
          Consolas,
          monospace;

        letter-spacing:.12em;
        text-transform:uppercase;
      }

      .relay-splash .relay-boot-log .is-live{
        color:
          rgba(141,250,255,.82);

        text-shadow:
          0 0 12px
          rgba(0,234,255,.24);
      }

      .relay-splash .relay-boot-log .is-muted{
        color:
          rgba(175,188,184,.28);
      }

      .relay-splash .relay-boot-complete{
        display:none;

        grid-template-columns:
          auto
          minmax(0,1fr);

        align-items:center;

        gap:9px;

        padding-top:4px;

        opacity:0;

        transform:
          translateY(4px)
          scale(.995);

        transition:
          opacity .24s ease,
          transform .24s ease;
      }

      .relay-splash .relay-boot-complete.is-visible{
        display:grid;
        opacity:1;
        transform:none;
      }

      .relay-splash .relay-boot-complete b{
        width:7px;
        height:7px;

        border-radius:50%;

        background:
          var(--rr-gold,#ffd23c);

        box-shadow:
          0 0 9px
            var(--rr-gold,#ffd23c),
          0 0 18px
            rgba(255,210,60,.35);
      }

      .relay-splash .relay-boot-complete strong{
        display:block;

        color:
          rgba(245,253,255,.96);

        font:
          900 9px/1.1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          Monaco,
          Consolas,
          monospace;

        letter-spacing:.18em;
        text-transform:uppercase;
      }

      .relay-splash .relay-boot-complete small{
        display:block;

        margin-top:3px;

        color:
          rgba(141,250,255,.50);

        font:
          700 7px/1.1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          Monaco,
          Consolas,
          monospace;

        letter-spacing:.14em;
        text-transform:uppercase;
      }

      .relay-splash.is-hidden{
        opacity:0 !important;
        visibility:hidden !important;
        pointer-events:none !important;

        transition:
          opacity .55s
          cubic-bezier(.16,1,.3,1),
          visibility .55s ease !important;
      }

      @keyframes relayPremiumPulse{
        0%,100%{
          opacity:.35;
          transform:scale(.72);
        }

        50%{
          opacity:1;
          transform:scale(1.18);
        }
      }

      @keyframes relayProgressSweep{
        0%{
          left:-25%;
          opacity:0;
        }

        18%{
          opacity:1;
        }

        72%{
          opacity:.90;
        }

        100%{
          left:125%;
          opacity:0;
        }
      }

      @media(max-width:700px){
        .relay-splash .relay-splash-network-status{
          top:max(
            14px,
            env(safe-area-inset-top)
          );

          right:max(
            14px,
            env(safe-area-inset-right)
          );

          min-height:25px;

          padding:6px 8px;

          font-size:6px;
          letter-spacing:.10em;
        }

        .relay-splash .relay-splash-ui{
          width:calc(100vw - 20px);

          padding:
            9px
            9px
            8px;

          gap:7px;
        }

        .relay-splash .relay-splash-ui::before{
          font-size:6px;
          letter-spacing:.12em;
          padding:4px 6px;
        }

        .relay-splash .relay-splash-meta{
          padding:
            8px
            9px
            7px;
        }

        .relay-splash .relay-splash-status{
          font-size:7px;
          letter-spacing:.10em;
        }

        .relay-splash .relay-splash-percent{
          min-width:48px;
          font-size:13px;
        }

        .relay-splash .relay-splash-track{
          height:7px;
        }

        .relay-splash .relay-boot-status-grid{
          grid-template-columns:
            repeat(
              2,
              minmax(0,1fr)
            );
        }

        .relay-splash .relay-boot-status-cell{
          padding:6px 7px;
        }

        .relay-splash .relay-boot-status-cell span,
        .relay-splash .relay-boot-status-cell b{
          font-size:6px;
        }

        .relay-splash .relay-boot-log{
          font-size:6px;
          letter-spacing:.09em;
        }

        .relay-splash .relay-boot-complete strong{
          font-size:8px;
        }

        .relay-splash .relay-boot-complete small{
          font-size:6px;
        }
      }

      @media(
        max-width:700px
      ) and (
        orientation:portrait
      ){
        .relay-splash
        .relay-splash-network-status{
          display:none;
        }
      }

      @media(
        orientation:landscape
      ) and (
        max-height:520px
      ){
        .relay-splash
        .relay-splash-network-status{
          top:max(
            8px,
            calc(
              env(safe-area-inset-top)
              + 4px
            )
          );

          right:max(
            8px,
            calc(
              env(safe-area-inset-right)
              + 4px
            )
          );
        }

        .relay-splash .relay-splash-ui{
          width:min(
            920px,
            calc(100vw - 20px)
          );

          padding:7px;
          gap:6px;

          bottom:max(
            8px,
            calc(
              env(safe-area-inset-bottom)
              + 6px
            )
          );
        }

        .relay-splash .relay-boot-status-grid,
        .relay-splash .relay-boot-log{
          display:none;
        }

        .relay-splash .relay-splash-track{
          height:7px;
        }
      }

      @media(prefers-reduced-motion:reduce){
        .relay-splash .relay-splash-network-status i,
        .relay-splash .relay-splash-progress::after{
          animation:none !important;
        }

        .relay-splash .relay-splash-progress,
        .relay-splash .relay-boot-complete,
        .relay-splash.is-hidden{
          transition:none !important;
        }
      }
    `;

    document.head.appendChild(style);
  };

  const ensureBrand = splash => {
    if (
      splash.querySelector(
        SELECTORS.brand
      )
    ) {
      return;
    }

    const brand =
      document.createElement('div');

    brand.className =
      'relay-splash-brand';

    brand.innerHTML =
      '<b>R/</b><span>RELAY RUNNER</span>';

    splash.appendChild(brand);
  };

  const mountPremiumBootHud = splash => {
    if (!splash) return null;

    const existingNetwork =
      splash.querySelector(
        '.relay-splash-network-status'
      );

    const ui =
      splash.querySelector(
        SELECTORS.ui
      );

    if (!ui) return null;

    if (
      splash.querySelector(
        '[data-relay-premium-boot="1"]'
      )
    ) {
      return {
        network: existingNetwork,
        telemetry:
          ui.querySelector(
            '.relay-boot-status-grid'
          ),
        log:
          ui.querySelector(
            '.relay-boot-log'
          ),
        complete:
          ui.querySelector(
            '.relay-boot-complete'
          ),
      };
    }

    const network =
      existingNetwork ||
      document.createElement('div');

    network.className =
      'relay-splash-network-status';

    network.dataset.relayPremiumBoot = '1';

    network.innerHTML =
      '<i aria-hidden="true"></i>' +
      '<span>NETWORK // ONLINE</span>';

    if (!network.parentNode) {
      splash.appendChild(network);
    }

    const telemetry =
      document.createElement('div');

    telemetry.className =
      'relay-boot-status-grid';

    telemetry.innerHTML = `
      <div class="relay-boot-status-cell">
        <span>NODE</span>
        <b>04 // ONLINE</b>
      </div>

      <div class="relay-boot-status-cell">
        <span>SIGNAL</span>
        <b>STABLE</b>
      </div>

      <div class="relay-boot-status-cell">
        <span>RELAY</span>
        <b>SYNCED</b>
      </div>
    `;

    const log =
      document.createElement('div');

    log.className =
      'relay-boot-log';

    log.setAttribute(
      'aria-live',
      'polite'
    );

    log.innerHTML = `
      <span class="is-live">
        → RELAY CORE INITIALIZING
      </span>

      <span class="is-muted">
        → WORLD NODE OFFLINE
      </span>
    `;

    const complete =
      document.createElement('div');

    complete.className =
      'relay-boot-complete';

    complete.innerHTML = `
      <b aria-hidden="true"></b>

      <div>
        <strong>
          RELAY NETWORK ONLINE
        </strong>

        <small>
          BOOT COMPLETE // HOME READY
        </small>
      </div>
    `;

    ui.append(
      telemetry,
      log,
      complete
    );

    splash.dataset.relayPremiumBoot = '1';

    return {
      network,
      telemetry,
      log,
      complete,
    };
  };

  const setBootLog = (
    liveText,
    mutedText
  ) => {
    const log = runtime.hud?.log;

    if (!log) return;

    const first =
      log.querySelector(
        'span:first-child'
      );

    const second =
      log.querySelector(
        'span:last-child'
      );

    if (first) {
      first.textContent = liveText;
      first.className = 'is-live';
    }

    if (second) {
      second.textContent = mutedText;
      second.className = 'is-muted';
    }
  };

  const setStageByPercent = value => {
    let current = BOOT_STAGES[0];

    for (const stage of BOOT_STAGES) {
      if (value >= stage.percent) {
        current = stage;
      }
    }

    if (runtime.label) {
      runtime.label.textContent =
        current.label;
    }

    setBootLog(
      current.live,
      current.muted
    );
  };

  const setProgress = (
    value,
    text
  ) => {
    const numeric =
      Number.isFinite(value)
        ? value
        : 0;

    runtime.progress =
      Math.max(
        runtime.progress,
        Math.min(
          100,
          Math.round(numeric)
        )
      );

    if (runtime.bar) {
      runtime.bar.style.width =
        `${runtime.progress}%`;
    }

    if (runtime.percent) {
      runtime.percent.textContent =
        `${runtime.progress}%`;
    }

    if (text && runtime.label) {
      runtime.label.textContent = text;
    } else {
      setStageByPercent(
        runtime.progress
      );
    }

    if (runtime.hud?.network) {
      runtime.hud.network.classList.toggle(
        'is-ready',
        runtime.progress >= 100
      );
    }
  };

  const animateTo = (
    target,
    text
  ) =>
    new Promise(resolve => {
      const safeTarget = Math.max(
        runtime.progress,
        Math.min(
          100,
          Number(target) || 0
        )
      );

      if (
        safeTarget <= runtime.progress
      ) {
        setProgress(
          safeTarget,
          text
        );
        resolve();
        return;
      }

      const from =
        runtime.progress;

      const started =
        performance.now();

      const delta =
        safeTarget - from;

      const duration =
        Math.max(
          180,
          Math.min(
            760,
            delta * 10
          )
        );

      const step = () => {
        if (runtime.finishing) {
          resolve();
          return;
        }

        const elapsed =
          performance.now() -
          started;

        const t = Math.min(
          1,
          elapsed / duration
        );

        const eased =
          t * (2 - t);

        setProgress(
          from +
            delta * eased,
          text
        );

        if (t < 1) {
          const timer =
            window.setTimeout(
              () => {
                runtime.timers.delete(
                  timer
                );
                step();
              },
              28
            );

          runtime.timers.add(timer);
        } else {
          resolve();
        }
      };

      step();
    });

  const markReadyIfPossible = () => {
    if (
      runtime.finishing ||
      runtime.timedOut
    ) {
      return;
    }

    if (
      runtime.imageReady &&
      runtime.pageReady &&
      runtime.engineReady
    ) {
      void finish();
    }
  };

  const markImageReady = () => {
    if (runtime.imageReady) return;

    runtime.imageReady = true;

    void animateTo(
      26,
      'LOADING INTERFACE'
    ).then(
      markReadyIfPossible
    );
  };

  const markPageReady = () => {
    if (runtime.pageReady) return;

    runtime.pageReady = true;

    void animateTo(
      68,
      'CONNECTING WORLD'
    ).then(
      markReadyIfPossible
    );
  };

  const markEngineReady = () => {
    if (runtime.engineReady) return;

    runtime.engineReady = true;

    void animateTo(
      86,
      'PREPARING HOME'
    ).then(
      markReadyIfPossible
    );
  };

  const checkEngine = () => {
    if (
      runtime.finishing ||
      runtime.timedOut
    ) {
      return;
    }

    const canvas =
      document.querySelector(
        SELECTORS.engineCanvas
      );

    if (canvas) {
      markEngineReady();
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          runtime.timers.delete(
            timer
          );

          checkEngine();
        },
        TIMING.pollMs
      );

    runtime.timers.add(timer);
  };

  const finish = async (
    forced = false
  ) => {
    if (runtime.finishing) {
      return;
    }

    const elapsed =
      performance.now() -
      runtime.startedAt;

    if (
      !forced &&
      (
        !runtime.imageReady ||
        !runtime.pageReady ||
        !runtime.engineReady
      )
    ) {
      return;
    }

    if (
      !forced &&
      elapsed <
        TIMING.minimumMs
    ) {
      const remaining =
        TIMING.minimumMs -
        elapsed;

      const timer =
        window.setTimeout(
          () => {
            runtime.timers.delete(
              timer
            );

            void finish(false);
          },
          remaining
        );

      runtime.timers.add(timer);

      return;
    }

    runtime.finishing = true;

    clearTimers();

    await animateTo(
      100,
      'READY'
    );

    if (runtime.hud?.log) {
      runtime.hud.log
        .querySelectorAll('span')
        .forEach(node => {
          node.className =
            'is-live';
        });
    }

    if (runtime.hud?.network) {
      runtime.hud.network.classList.add(
        'is-ready'
      );

      const networkLabel =
        runtime.hud.network.querySelector(
          'span'
        );

      if (networkLabel) {
        networkLabel.textContent =
          'RELAY NETWORK // ONLINE';
      }
    }

    if (runtime.hud?.complete) {
      runtime.hud.complete.classList.add(
        'is-visible'
      );
    }

    if (runtime.splash) {
      runtime.splash.setAttribute(
        'aria-busy',
        'false'
      );
    }

    await wait(
      TIMING.finishHoldMs
    );

    if (!runtime.splash) {
      cleanupListeners();
      return;
    }

    runtime.splash.classList.add(
      'is-hidden'
    );

    const removeTimer =
      window.setTimeout(
        () => {
          runtime.timers.delete(
            removeTimer
          );

          try {
            runtime.splash?.remove();
          } catch {}

          cleanupListeners();
        },
        TIMING.removeDelayMs
      );

    runtime.timers.add(
      removeTimer
    );
  };

  const boot = () => {
    const splash = getSplash();

    if (!splash) {
      return;
    }

    runtime.splash = splash;
    runtime.startedAt =
      performance.now();

    runtime.image =
      splash.querySelector(
        SELECTORS.image
      );

    runtime.bar =
      splash.querySelector(
        SELECTORS.bar
      );

    runtime.percent =
      splash.querySelector(
        SELECTORS.percent
      );

    runtime.label =
      splash.querySelector(
        SELECTORS.status
      );

    if (
      !runtime.image ||
      !runtime.bar ||
      !runtime.percent ||
      !runtime.label
    ) {
      return;
    }

    if (
      !splash.classList.contains(
        'relay-splash'
      )
    ) {
      splash.classList.add(
        'relay-splash'
      );
    }

    applyFirstPaintHardening();
    installPremiumBootHud();
    ensureBrand();

    runtime.hud =
      mountPremiumBootHud(
        splash
      );

    runtime.imageReady =
      runtime.image.complete &&
      runtime.image.naturalWidth > 0;

    runtime.pageReady =
      document.readyState ===
      'complete';

    setProgress(
      0,
      'INITIALIZING RELAY'
    );

    setBootLog(
      '→ RELAY CORE INITIALIZING',
      '→ WORLD NODE OFFLINE'
    );

    void animateTo(
      8,
      'INITIALIZING RELAY'
    );

    if (runtime.imageReady) {
      void animateTo(
        26,
        'LOADING INTERFACE'
      );
    } else {
      addListener(
        runtime.image,
        'load',
        markImageReady,
        { once: true }
      );

      addListener(
        runtime.image,
        'error',
        () => {
          runtime.imageReady = true;

          void animateTo(
            22,
            'USING SAFE MODE'
          ).then(
            markReadyIfPossible
          );
        },
        { once: true }
      );
    }

    if (
      document.readyState ===
      'loading'
    ) {
      addListener(
        document,
        'DOMContentLoaded',
        () => {
          void animateTo(
            48,
            'LOADING GAME SYSTEMS'
          );
        },
        { once: true }
      );
    } else {
      void animateTo(
        48,
        'LOADING GAME SYSTEMS'
      );
    }

    addListener(
      window,
      'load',
      () => {
        markPageReady();
      },
      { once: true }
    );

    if (runtime.pageReady) {
      void animateTo(
        68,
        'CONNECTING WORLD'
      );
    }

    checkEngine();

    const orientation =
      window.matchMedia(
        '(orientation: landscape)'
      );

    const handleViewportChange =
      () => {
        if (runtime.finishing) {
          return;
        }

        applyFirstPaintHardening();
      };

    addListener(
      orientation,
      'change',
      handleViewportChange
    );

    addListener(
      window,
      'resize',
      handleViewportChange,
      { passive: true }
    );

    const timeout =
      window.setTimeout(
        () => {
          runtime.timers.delete(
            timeout
          );

          if (
            runtime.finishing ||
            runtime.timedOut
          ) {
            return;
          }

          runtime.timedOut = true;

          if (runtime.label) {
            runtime.label.textContent =
              'STARTING HOME';
          }

          setBootLog(
            '→ SAFE BOOT COMPLETE',
            '→ HOME SYSTEMS FORCED READY'
          );

          void finish(true);
        },
        TIMING.maximumMs
      );

    runtime.timers.add(
      timeout
    );

    BOOT_STAGES.forEach(
      (stage, index) => {
        const timer =
          window.setTimeout(
            () => {
              runtime.timers.delete(
                timer
              );

              if (
                runtime.finishing ||
                runtime.timedOut
              ) {
                return;
              }

              setProgress(
                stage.percent,
                stage.label
              );

              setBootLog(
                stage.live,
                stage.muted
              );
            },
            240 +
              index * 340
          );

        runtime.timers.add(
          timer
        );
      }
    );

    markReadyIfPossible();
  };

  const firstPaint = () => {
    try {
      applyFirstPaintHardening();
    } catch (error) {
      console.warn(
        '[RelayRunner] splash first-paint hardening failed',
        error
      );
    }
  };

  firstPaint();

  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      boot,
      { once: true }
    );
  } else {
    boot();
  }

  window.addEventListener(
    'beforeunload',
    () => {
      clearTimers();
      cleanupListeners();
    },
    { once: true }
  );
})();
