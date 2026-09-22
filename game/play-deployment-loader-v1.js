/*
 * Runner Relay — PLAY NOW / MISSION deployment sequence.
 *
 * Purpose:
 * - Cinematic full-screen deployment loader.
 * - Uses supplied desktop/mobile artwork.
 * - Keeps actual mission launching owned by the existing UI handlers.
 * - Keeps Mission Route V5/V6 briefing ownership unchanged.
 */

(() => {
  'use strict';

  if (window.__relayPlayDeploymentV1) return;
  window.__relayPlayDeploymentV1 = true;

  /* =========================================================
     CORE HELPERS
     ========================================================= */

  const WAIT = ms =>
    new Promise(resolve =>
      window.setTimeout(resolve, ms)
    );

  const runBounded = async (
    callback,
    timeoutMs,
    label
  ) => {
    if (typeof callback !== 'function') {
      return;
    }

    let timer;

    try {
      await Promise.race([
        Promise.resolve().then(callback),

        new Promise(resolve => {
          timer = window.setTimeout(() => {
            console.warn(
              `[RelayRunner] ${label} timed out; continuing`
            );

            resolve();
          }, timeoutMs);
        })
      ]);
    } finally {
      window.clearTimeout(timer);
    }
  };

  const NEXT_FRAME = callback => {
    if (
      typeof window.requestAnimationFrame ===
      'function'
    ) {
      return window.requestAnimationFrame(callback);
    }

    return window.setTimeout(
      () => callback(performance.now()),
      16
    );
  };

  const introVisible = () => {
    const intro =
      document.getElementById('intro');

    return (
      !!intro &&
      !intro.classList.contains('hidden')
    );
  };

  /* =========================================================
     STATE
     ========================================================= */

  let active = false;
  let serial = 0;

  const DEFAULT_ASSETS = Object.freeze({
    desktop: './assets/loadplay.jpg',
    mobile: './assets/loadplaymobile.jpg'
  });

  const normalizeConfig = config => ({
    missionNumber: Math.max(
      1,
      Number(config?.missionNumber) || 1
    ),

    desktop:
      config?.desktop ||
      DEFAULT_ASSETS.desktop,

    mobile:
      config?.mobile ||
      DEFAULT_ASSETS.mobile,

    beforeRoute:
      typeof config?.beforeRoute ===
      'function'
        ? config.beforeRoute
        : null
  });

  /* =========================================================
     OVERLAY HTML
     ========================================================= */

  const makeOverlay = ({
    missionNumber,
    desktop,
    mobile
  }) => {
    const overlay =
      document.createElement('section');

    overlay.id =
      'relayPlayDeployment';

    overlay.className =
      'relay-splash relay-play-deployment';

    overlay.setAttribute(
      'role',
      'status'
    );

    overlay.setAttribute(
      'aria-live',
      'polite'
    );

    overlay.setAttribute(
      'aria-busy',
      'true'
    );

    overlay.innerHTML = `
      <picture class="relay-splash-picture">
        <source
          media="(pointer: coarse)"
          srcset="${mobile}"
        >

        <source
          media="(max-width:700px)"
          srcset="${mobile}"
        >

        <img
          class="relay-splash-art"
          src="${desktop}"
          alt=""
          decoding="async"
          fetchpriority="high"
        >
      </picture>

      <div class="relay-play-vignette"></div>
      <div class="relay-play-scanlines"></div>
      <div class="relay-play-grid"></div>

      <div class="relay-splash-brand relay-play-deployment-brand">
        <b>R/</b>
        <span>RELAY RUNNER</span>
      </div>

      <div class="relay-splash-network-status relay-play-deployment-network">
        <i></i>
        <span>
          RELAY NETWORK // ONLINE // SECURE
        </span>
      </div>

      <div class="relay-play-deployment-center">

        <div class="relay-play-mission-label">
          MISSION
          ${String(missionNumber).padStart(2, '0')}
          //
          DEPLOYMENT
        </div>

        <div class="relay-play-main-title">
          DEPLOYMENT
        </div>

        <div class="relay-play-subtitle">
          ROOFTOP RELAY // WORLD NODE INITIALIZATION
        </div>

      </div>

      <div class="relay-splash-ui relay-play-deployment-ui">

        <div class="relay-splash-meta">

          <span class="relay-splash-status">
            PREPARING MISSION
            ${String(missionNumber).padStart(2, '0')}
            // DEPLOYMENT
          </span>

          <span class="relay-splash-percent">
            00%
          </span>

        </div>

        <div
          class="relay-splash-track"
          aria-hidden="true"
        >
          <i class="relay-splash-progress"></i>
        </div>

        <div class="relay-boot-status-grid">

          <div class="relay-boot-status-cell">
            <span>NODE</span>
            <b>04 // ONLINE</b>
          </div>

          <div class="relay-boot-status-cell">
            <span>SIGNAL</span>
            <b>STABLE // LOCKED</b>
          </div>

          <div class="relay-boot-status-cell">
            <span>RELAY</span>
            <b>SYNCED // READY</b>
          </div>

        </div>

        <div
          class="relay-boot-log"
          aria-live="polite"
        >
          <span class="is-live">
            → ROUTE DATA INITIALIZING // SECURE
          </span>

          <span class="is-muted">
            → WORLD NODE AWAITING // SYNC
          </span>
        </div>

        <div class="relay-boot-complete">

          <b aria-hidden="true"></b>

          <div>
            <strong>
              DEPLOYMENT READY
            </strong>

            <small>
              MISSION
              ${String(missionNumber).padStart(2, '0')}
              // ROUTE LOCKED // VERIFIED
            </small>
          </div>

        </div>

      </div>

      <div class="relay-play-corner relay-play-corner-left">
        SYSTEM // RELAY CORE
      </div>

      <div class="relay-play-corner relay-play-corner-right">
        CHANNEL 01 // SECURE
      </div>
    `;

    return overlay;
  };

  /* =========================================================
     DEPLOYMENT CSS
     ========================================================= */

  const installStyle = () => {
    if (
      document.getElementById(
        'relay-play-deployment-style'
      )
    ) {
      return;
    }

    const style =
      document.createElement('style');

    style.id =
      'relay-play-deployment-style';

    style.textContent = `

      /* =====================================================
         ROOT OVERLAY
         ===================================================== */

      #relayPlayDeployment.relay-play-deployment {
        position: fixed !important;
        inset: 0 !important;

        width: 100vw !important;
        height: 100vh !important;

        min-width: 100vw !important;
        min-height: 100vh !important;

        overflow: hidden !important;

        display: block !important;

        z-index: 2147483647 !important;

        margin: 0 !important;
        padding: 0 !important;

        background:
          #02060b !important;

        color: #eafcff !important;

        pointer-events: none !important;

        opacity: 1 !important;
        visibility: visible !important;

        isolation: isolate !important;

        font-family:
          "Orbitron",
          "Roboto Condensed",
          Arial,
          sans-serif !important;
      }

      /* =====================================================
         IMAGE
         ===================================================== */

      #relayPlayDeployment
      .relay-splash-picture {
        position: absolute !important;

        inset: 0 !important;

        width: 100% !important;
        height: 100% !important;

        display: block !important;

        overflow: hidden !important;

        z-index: 0 !important;
      }

      #relayPlayDeployment
      .relay-splash-art {
        position: absolute !important;

        inset: 0 !important;

        width: 100% !important;
        height: 100% !important;

        display: block !important;

        object-fit: cover !important;
        object-position: center center !important;

        max-width: none !important;
        max-height: none !important;

        margin: 0 !important;
        padding: 0 !important;

        opacity: 1 !important;

        filter:
          brightness(.68)
          contrast(1.14)
          saturate(.92) !important;

        transform:
          scale(1.025) !important;

        user-select: none !important;

        -webkit-user-drag: none !important;
      }

      /* =====================================================
         CINEMATIC DARK LAYERS
         ===================================================== */

      #relayPlayDeployment
      .relay-play-vignette {
        position: absolute !important;

        inset: 0 !important;

        z-index: 1 !important;

        pointer-events: none !important;

        background:
          radial-gradient(
            ellipse at center,
            rgba(2,12,22,.08) 0%,
            rgba(1,7,14,.28) 42%,
            rgba(0,3,8,.88) 100%
          ) !important;
      }

      #relayPlayDeployment
      .relay-play-vignette::before {
        content: "" !important;

        position: absolute !important;

        inset: 0 !important;

        background:
          linear-gradient(
            180deg,
            rgba(0,0,0,.55) 0%,
            rgba(0,0,0,.08) 32%,
            rgba(0,0,0,.10) 60%,
            rgba(0,0,0,.72) 100%
          ) !important;
      }

      #relayPlayDeployment
      .relay-play-grid {
        position: absolute !important;

        inset: 0 !important;

        z-index: 2 !important;

        pointer-events: none !important;

        opacity: .14 !important;

        background-image:
          linear-gradient(
            rgba(0,234,255,.16) 1px,
            transparent 1px
          ),
          linear-gradient(
            90deg,
            rgba(0,234,255,.16) 1px,
            transparent 1px
          ) !important;

        background-size:
          80px 80px !important;

        mask-image:
          linear-gradient(
            to bottom,
            transparent,
            black 25%,
            black 75%,
            transparent
          ) !important;
      }

      #relayPlayDeployment
      .relay-play-scanlines {
        position: absolute !important;

        inset: 0 !important;

        z-index: 3 !important;

        pointer-events: none !important;

        opacity: .13 !important;

        background:
          repeating-linear-gradient(
            to bottom,
            rgba(255,255,255,.045) 0,
            rgba(255,255,255,.045) 1px,
            transparent 1px,
            transparent 4px
          ) !important;

        mix-blend-mode: screen !important;
      }

      /* =====================================================
         BRAND
         ===================================================== */

      #relayPlayDeployment
      .relay-play-deployment-brand {
        position: absolute !important;

        top: 34px !important;
        left: 42px !important;

        z-index: 20 !important;

        display: flex !important;

        align-items: center !important;

        gap: 12px !important;

        color: #eaffff !important;

        text-transform: uppercase !important;

        letter-spacing: .18em !important;

        text-shadow:
          0 0 12px rgba(0,234,255,.35) !important;
      }

      #relayPlayDeployment
      .relay-play-deployment-brand b {
        display: inline-flex !important;

        align-items: center !important;
        justify-content: center !important;

        min-width: 42px !important;
        height: 30px !important;

        padding: 0 8px !important;

        color: #001016 !important;

        background:
          linear-gradient(
            135deg,
            #75f7ff,
            #00b7ff
          ) !important;

        font-size: 16px !important;

        letter-spacing: .08em !important;

        box-shadow:
          0 0 18px rgba(0,234,255,.32) !important;
      }

      #relayPlayDeployment
      .relay-play-deployment-brand span {
        font-size: 13px !important;

        font-weight: 800 !important;
      }

      #relayPlayDeployment
      .relay-play-deployment-brand::after {
        content:
          "DEPLOYMENT SEQUENCE // MISSION LINK" !important;

        position: absolute !important;

        left: 54px !important;
        top: 25px !important;

        white-space: nowrap !important;

        color:
          rgba(117,247,255,.52) !important;

        font-size: 8px !important;

        letter-spacing: .22em !important;
      }

      /* =====================================================
         NETWORK STATUS
         ===================================================== */

      #relayPlayDeployment
      .relay-play-deployment-network {
        position: absolute !important;

        top: 34px !important;
        right: 42px !important;

        z-index: 20 !important;

        display: flex !important;

        align-items: center !important;

        gap: 9px !important;

        padding: 9px 13px !important;

        border:
          1px solid
          rgba(0,234,255,.28) !important;

        border-left:
          2px solid
          #00eaff !important;

        background:
          rgba(2,10,17,.62) !important;

        backdrop-filter:
          blur(10px) !important;

        color:
          rgba(224,253,255,.88) !important;

        font-size: 9px !important;

        font-weight: 700 !important;

        letter-spacing: .14em !important;

        box-shadow:
          0 0 20px
          rgba(0,234,255,.08),
          inset 0 0 18px
          rgba(0,234,255,.035) !important;
      }

      #relayPlayDeployment
      .relay-play-deployment-network i {
        width: 7px !important;
        height: 7px !important;

        flex: 0 0 7px !important;

        border-radius: 50% !important;

        background:
          #75f7ff !important;

        box-shadow:
          0 0 7px #00eaff,
          0 0 16px rgba(0,234,255,.7) !important;

        animation:
          relayPulse 1.2s ease-in-out infinite !important;
      }

      @keyframes relayPulse {
        0%,
        100% {
          opacity: .55;
          transform: scale(.82);
        }

        50% {
          opacity: 1;
          transform: scale(1.15);
        }
      }

      /* =====================================================
         CENTER TITLE
         ===================================================== */

      #relayPlayDeployment
      .relay-play-deployment-center {
        position: absolute !important;

        left: 50% !important;
        top: 42% !important;

        transform:
          translate(-50%, -50%) !important;

        z-index: 15 !important;

        width:
          min(900px, calc(100vw - 60px)) !important;

        text-align: center !important;

        pointer-events: none !important;
      }

      #relayPlayDeployment
      .relay-play-mission-label {
        margin-bottom: 10px !important;

        color:
          #75f7ff !important;

        font-size: 11px !important;

        font-weight: 800 !important;

        letter-spacing: .35em !important;

        text-shadow:
          0 0 14px rgba(0,234,255,.45) !important;
      }

      #relayPlayDeployment
      .relay-play-main-title {
        color: #f2ffff !important;

        font-size:
          clamp(42px, 6vw, 92px) !important;

        line-height: .9 !important;

        font-weight: 900 !important;

        letter-spacing: .08em !important;

        text-transform: uppercase !important;

        text-shadow:
          0 2px 0 rgba(0,0,0,.8),
          0 0 14px rgba(0,234,255,.28),
          0 0 45px rgba(0,140,255,.16) !important;
      }

      #relayPlayDeployment
      .relay-play-subtitle {
        margin-top: 17px !important;

        color:
          rgba(221,250,255,.70) !important;

        font-size: 10px !important;

        font-weight: 700 !important;

        letter-spacing: .26em !important;
      }

      /* =====================================================
         MAIN HUD PANEL
         ===================================================== */

      #relayPlayDeployment
      .relay-play-deployment-ui {
        position: absolute !important;

        left: 50% !important;
        bottom: 42px !important;

        transform:
          translateX(-50%) !important;

        z-index: 30 !important;

        width:
          min(920px, calc(100vw - 70px)) !important;

        box-sizing: border-box !important;

        padding:
          16px 17px 15px !important;

        display: flex !important;

        flex-direction: column !important;

        gap: 10px !important;

        border:
          1px solid
          rgba(117,247,255,.25) !important;

        border-top:
          1px solid
          rgba(255,210,60,.42) !important;

        border-left:
          2px solid
          rgba(0,234,255,.55) !important;

        background:
          linear-gradient(
            180deg,
            rgba(1,10,17,.91),
            rgba(1,5,10,.84)
          ) !important;

        backdrop-filter:
          blur(12px) !important;

        box-shadow:
          0 25px 70px rgba(0,0,0,.62),
          0 0 34px rgba(0,140,255,.13),
          inset 0 0 35px
          rgba(0,234,255,.035) !important;
      }

      /* =====================================================
         META
         ===================================================== */

      #relayPlayDeployment
      .relay-splash-meta {
        display: flex !important;

        align-items: center !important;
        justify-content: space-between !important;

        min-height: 26px !important;

        padding:
          0 2px 8px !important;

        border-bottom:
          1px solid
          rgba(117,247,255,.22) !important;
      }

      #relayPlayDeployment
      .relay-splash-status {
        color:
          rgba(225,251,255,.88) !important;

        font-size: 10px !important;

        font-weight: 800 !important;

        letter-spacing: .18em !important;

        text-shadow:
          0 0 9px
          rgba(0,234,255,.25) !important;
      }

      #relayPlayDeployment
      .relay-splash-percent {
        min-width: 52px !important;

        text-align: right !important;

        color:
          #75f7ff !important;

        font-family:
          "Roboto Mono",
          Consolas,
          monospace !important;

        font-size: 14px !important;

        font-weight: 800 !important;

        letter-spacing: .08em !important;

        text-shadow:
          0 0 10px
          rgba(0,234,255,.52) !important;
      }

      /* =====================================================
         PROGRESS BAR
         ===================================================== */

      #relayPlayDeployment
      .relay-splash-track {
        position: relative !important;

        width: 100% !important;

        height: 7px !important;

        overflow: hidden !important;

        border:
          1px solid
          rgba(117,247,255,.16) !important;

        background:
          rgba(0,15,24,.88) !important;

        box-shadow:
          inset 0 0 10px
          rgba(0,0,0,.8) !important;
      }

      #relayPlayDeployment
      .relay-splash-progress {
        display: block !important;

        width: 0% !important;

        height: 100% !important;

        margin: 0 !important;

        background:
          linear-gradient(
            90deg,
            #006dff,
            #00eaff 65%,
            #9cffff
          ) !important;

        box-shadow:
          0 0 8px
          rgba(0,234,255,.95),
          0 0 20px
          rgba(0,140,255,.55) !important;

        transition:
          width .18s
          cubic-bezier(.16,1,.3,1) !important;
      }

      /* =====================================================
         STATUS CELLS
         ===================================================== */

      #relayPlayDeployment
      .relay-boot-status-grid {
        display: grid !important;

        grid-template-columns:
          repeat(3, minmax(0, 1fr)) !important;

        gap: 7px !important;
      }

      #relayPlayDeployment
      .relay-boot-status-cell {
        min-width: 0 !important;

        padding:
          8px 9px !important;

        border:
          1px solid
          rgba(117,247,255,.13) !important;

        background:
          rgba(0,15,24,.42) !important;
      }

      #relayPlayDeployment
      .relay-boot-status-cell span {
        display: block !important;

        margin-bottom: 4px !important;

        color:
          rgba(117,247,255,.48) !important;

        font-size: 7px !important;

        font-weight: 800 !important;

        letter-spacing: .20em !important;
      }

      #relayPlayDeployment
      .relay-boot-status-cell b {
        display: block !important;

        overflow: hidden !important;

        color:
          rgba(225,251,255,.88) !important;

        font-family:
          "Roboto Mono",
          Consolas,
          monospace !important;

        font-size: 9px !important;

        font-weight: 700 !important;

        letter-spacing: .05em !important;

        white-space: nowrap !important;

        text-overflow: ellipsis !important;
      }

      /* =====================================================
         LOG
         ===================================================== */

      #relayPlayDeployment
      .relay-boot-log {
        display: flex !important;

        flex-direction: column !important;

        gap: 3px !important;

        min-height: 30px !important;

        padding:
          4px 2px 0 !important;

        font-family:
          "Roboto Mono",
          Consolas,
          monospace !important;

        font-size: 8px !important;

        line-height: 1.45 !important;

        letter-spacing: .08em !important;
      }

      #relayPlayDeployment
      .relay-boot-log span {
        display: block !important;
      }

      #relayPlayDeployment
      .relay-boot-log .is-live {
        color:
          rgba(117,247,255,.88) !important;

        text-shadow:
          0 0 8px
          rgba(0,234,255,.22) !important;
      }

      #relayPlayDeployment
      .relay-boot-log .is-muted {
        color:
          rgba(200,232,238,.38) !important;
      }

      /* =====================================================
         READY STATE
         ===================================================== */

      #relayPlayDeployment
      .relay-boot-complete {
        display: flex !important;

        align-items: center !important;

        gap: 10px !important;

        opacity: 0 !important;

        transform:
          translateY(7px)
          scale(.985) !important;

        filter:
          brightness(.9) !important;

        transition:
          opacity .28s ease,
          transform .28s
            cubic-bezier(.16,1,.3,1),
          filter .28s ease !important;
      }

      #relayPlayDeployment
      .relay-boot-complete.is-visible {
        opacity: 1 !important;

        transform:
          translateY(0)
          scale(1) !important;

        filter:
          brightness(1.08) !important;
      }

      #relayPlayDeployment
      .relay-boot-complete > b {
        width: 9px !important;
        height: 9px !important;

        flex: 0 0 9px !important;

        border-radius: 50% !important;

        background:
          #75f7ff !important;

        box-shadow:
          0 0 8px #00eaff,
          0 0 20px
          rgba(0,234,255,.75) !important;
      }

      #relayPlayDeployment
      .relay-boot-complete strong {
        display: block !important;

        color:
          #eaffff !important;

        font-size: 11px !important;

        font-weight: 900 !important;

        letter-spacing: .18em !important;
      }

      #relayPlayDeployment
      .relay-boot-complete small {
        display: block !important;

        margin-top: 3px !important;

        color:
          rgba(117,247,255,.56) !important;

        font-family:
          "Roboto Mono",
          Consolas,
          monospace !important;

        font-size: 7px !important;

        letter-spacing: .12em !important;
      }

      /* =====================================================
         CORNER TELEMETRY
         ===================================================== */

      #relayPlayDeployment
      .relay-play-corner {
        position: absolute !important;

        bottom: 18px !important;

        z-index: 25 !important;

        color:
          rgba(117,247,255,.32) !important;

        font-family:
          "Roboto Mono",
          Consolas,
          monospace !important;

        font-size: 7px !important;

        letter-spacing: .16em !important;

        pointer-events: none !important;
      }

      #relayPlayDeployment
      .relay-play-corner-left {
        left: 42px !important;
      }

      #relayPlayDeployment
      .relay-play-corner-right {
        right: 42px !important;
      }

      /* =====================================================
         CLOSING
         ===================================================== */

      #relayPlayDeployment.is-closing {
        opacity: 0 !important;

        visibility: hidden !important;

        transition:
          opacity .28s ease,
          visibility .28s ease !important;
      }

      /* =====================================================
         MOBILE
         ===================================================== */

      @media (max-width: 700px) {

        #relayPlayDeployment
        .relay-play-deployment-brand {
          top: 18px !important;
          left: 18px !important;
        }

        #relayPlayDeployment
        .relay-play-deployment-brand span {
          font-size: 10px !important;
        }

        #relayPlayDeployment
        .relay-play-deployment-brand::after {
          display: none !important;
        }

        #relayPlayDeployment
        .relay-play-deployment-network {
          top: 18px !important;
          right: 18px !important;

          padding:
            7px 9px !important;

          font-size: 7px !important;
        }

        #relayPlayDeployment
        .relay-play-deployment-center {
          top: 38% !important;

          width:
            calc(100vw - 30px) !important;
        }

        #relayPlayDeployment
        .relay-play-main-title {
          font-size:
            clamp(34px, 12vw, 62px) !important;
        }

        #relayPlayDeployment
        .relay-play-subtitle {
          font-size: 7px !important;

          letter-spacing: .16em !important;
        }

        #relayPlayDeployment
        .relay-play-deployment-ui {
          width:
            calc(100vw - 24px) !important;

          bottom: 18px !important;

          padding:
            11px !important;

          gap: 8px !important;
        }

        #relayPlayDeployment
        .relay-boot-status-grid {
          grid-template-columns:
            1fr !important;
        }

        #relayPlayDeployment
        .relay-boot-status-cell {
          padding:
            6px 8px !important;
        }

        #relayPlayDeployment
        .relay-boot-status-cell span {
          display: inline-block !important;

          margin:
            0 7px 0 0 !important;
        }

        #relayPlayDeployment
        .relay-boot-status-cell b {
          display: inline !important;
        }

        #relayPlayDeployment
        .relay-play-corner {
          display: none !important;
        }
      }

      @media (prefers-reduced-motion: reduce) {

        #relayPlayDeployment
        .relay-play-deployment-network i {
          animation: none !important;
        }

        #relayPlayDeployment
        .relay-boot-complete {
          transition: none !important;
        }
      }
    `;

    document.head.appendChild(style);
  };

  /* =========================================================
     STAGE UPDATE
     ========================================================= */

  const setStage = (
    overlay,
    percent,
    label,
    firstLog,
    secondLog
  ) => {
    if (!overlay) return;

    const pct =
      overlay.querySelector(
        '.relay-splash-percent'
      );

    const status =
      overlay.querySelector(
        '.relay-splash-status'
      );

    const bar =
      overlay.querySelector(
        '.relay-splash-progress'
      );

    const first =
      overlay.querySelector(
        '.relay-boot-log span:first-child'
      );

    const second =
      overlay.querySelector(
        '.relay-boot-log span:last-child'
      );

    if (pct) {
      pct.textContent =
        `${Math.round(percent)}%`;
    }

    if (status) {
      status.textContent = label;
    }

    if (bar) {
      bar.style.width =
        `${Math.max(
          0,
          Math.min(100, percent)
        )}%`;
    }

    if (first && firstLog) {
      first.textContent = firstLog;
    }

    if (second && secondLog) {
      second.textContent = secondLog;
    }
  };

  /* =========================================================
     MISSION READINESS
     ========================================================= */

  const getMissionReady = () => {
    const api =
      window.relayGameplayIntroV5;

    return (
      !!api &&
      typeof api.show === 'function'
    );
  };

  /* =========================================================
     WAIT FOR HOME TO ACTUALLY CLOSE
     ========================================================= */

 const waitForHomeToClose = async () => {
  const intro =
    document.getElementById('intro');

  if (!intro) {
    return true;
  }

  const deadline =
    performance.now() + 3000;

  while (performance.now() < deadline) {
    const hidden =
      intro.classList.contains('hidden');

    const computed =
      window.getComputedStyle(intro);

    const actuallyHidden =
      hidden ||
      computed.display === 'none' ||
      computed.visibility === 'hidden' ||
      Number(computed.opacity) === 0;

    if (actuallyHidden) {
      return true;
    }

    await WAIT(25);
  }

  console.error(
    '[RelayRunner] Home did not close before Mission Route handoff'
  );

  return false;
};

  /* =========================================================
     REVEAL MISSION ROUTE
     ========================================================= */

  const revealMissionRoute =
    async overlay => {

      const api =
        window.relayGameplayIntroV5;

      if (
        api &&
        typeof api.close === 'function' &&
        typeof api.show === 'function'
      ) {
        if (
          typeof api.isVisible ===
            'function' &&
          api.isVisible()
        ) {
          api.close();
        }

        api.show();

        await new Promise(resolve =>
          NEXT_FRAME(() =>
            NEXT_FRAME(resolve)
          )
        );
      }

      overlay.classList.add(
        'is-closing'
      );

      await WAIT(320);

      overlay.remove();

      active = false;
    };

  /* =========================================================
     DEPLOYMENT
     ========================================================= */

  const runDeployment =
    async rawConfig => {

      console.log(
        '[RelayRunner] DEPLOYMENT LOADER STARTED'
      );

      if (active) {
        return false;
      }

      const config =
        normalizeConfig(rawConfig);

      active = true;

      const token =
        ++serial;

      let overlay;
      let watchdog;
      let handoffStarted = false;

      try {

        installStyle();

        overlay =
          makeOverlay(config);

        document.body.appendChild(
          overlay
        );

        /* ---------------------------------------------------
           WATCHDOG
           --------------------------------------------------- */

        watchdog =
          window.setTimeout(
            async () => {

              if (
                !active ||
                handoffStarted ||
                !overlay?.isConnected
              ) {
                return;
              }

              console.warn(
                '[RelayRunner] deployment watchdog recovery; launching normally'
              );

              handoffStarted = true;

              setStage(
                overlay,
                100,
                'DEPLOYMENT READY',
                '→ MOBILE SAFE MODE',
                '→ CONTINUING TO GAME'
              );

              try {

                await runBounded(
                  config.beforeRoute,
                  1500,
                  'Deployment watchdog handoff'
                );

              } finally {

                overlay.classList.add(
                  'is-closing'
                );

                await WAIT(320);

                overlay.remove();

                active = false;
              }
            },
            15000
          );

        await new Promise(resolve =>
          NEXT_FRAME(resolve)
        );

        await new Promise(resolve =>
          NEXT_FRAME(resolve)
        );

        if (
          !active ||
          token !== serial
        ) {
          return false;
        }

        const started =
          performance.now();

        const minimumMs = 1550;

        /* ---------------------------------------------------
           STAGE 1
           --------------------------------------------------- */

        setStage(
          overlay,
          8,
          `INITIALIZING MISSION ${config.missionNumber}`,
          '→ RELAY CORE READY',
          '→ WORLD NODE CONNECTING // SECURE'
        );

        await WAIT(220);

        if (
          !active ||
          token !== serial
        ) {
          return false;
        }

        /* ---------------------------------------------------
           STAGE 2
           --------------------------------------------------- */

        setStage(
          overlay,
          27,
          'LOADING ROUTE DATA',
          '→ ROUTE DATA RECEIVED // VERIFIED',
          '→ CHECKPOINT MATRIX ONLINE'
        );

        await WAIT(230);

        if (
          !active ||
          token !== serial
        ) {
          return false;
        }

        /* ---------------------------------------------------
           STAGE 3
           --------------------------------------------------- */

        setStage(
          overlay,
          49,
          'SYNCING WORLD',
          '→ WORLD NODE SYNCING',
          '→ SIGNAL CHANNEL STABLE // LOCKED'
        );

        await WAIT(250);

        if (
          !active ||
          token !== serial
        ) {
          return false;
        }

        /* ---------------------------------------------------
           STAGE 4
           --------------------------------------------------- */

        setStage(
          overlay,
          72,
          'INITIALIZING PHASER',
          '→ PHASER CORE ONLINE',
          '→ MISSION SCENE PREPARING // READY'
        );

        await WAIT(250);

        if (
          !active ||
          token !== serial
        ) {
          return false;
        }

        /* ---------------------------------------------------
           STAGE 5
           --------------------------------------------------- */

        setStage(
          overlay,
          91,
          'FINALIZING DEPLOYMENT',
          '→ ROUTE LOCK CONFIRMED // VERIFIED',
          '→ WORLD NODE ONLINE // READY'
        );

        const readinessDeadline =
          started + 5000;

        while (
          performance.now() -
            started <
            minimumMs ||
          (
            !getMissionReady() &&
            performance.now() <
              readinessDeadline
          )
        ) {

          await WAIT(50);

          if (
            !active ||
            token !== serial
          ) {
            return false;
          }
        }

        if (!getMissionReady()) {
          console.warn(
            '[RelayRunner] Mission briefing API timed out; continuing with normal launch'
          );
        }

        /* ---------------------------------------------------
           COMPLETE
           --------------------------------------------------- */

        setStage(
          overlay,
          100,
          'DEPLOYMENT READY',
          '→ MISSION DATA LOADED // VERIFIED',
          '→ RELAY CHANNEL STABLE // LOCKED'
        );

        overlay
          .querySelector(
            '.relay-boot-complete'
          )
          ?.classList.add(
            'is-visible'
          );

        overlay.setAttribute(
          'aria-busy',
          'false'
        );

        await WAIT(240);

        if (
          !active ||
          token !== serial
        ) {
          return false;
        }

        /* ---------------------------------------------------
           GAME HANDOFF
           --------------------------------------------------- */

        handoffStarted = true;

        await runBounded(
          config.beforeRoute,
          2500,
          'Mission route handoff'
        );

        if (
          !active ||
          token !== serial
        ) {
          return false;
        }

        /*
         * Home Start uses leaveHome(), which hides
         * #intro asynchronously. Wait until that
         * actual Home state has changed before
         * revealing the mission route.
         */
       const homeClosed =
  await waitForHomeToClose();

if (!homeClosed) {
  console.error(
    '[RelayRunner] Mission Route aborted because Home is still visible'
  );

  overlay.classList.add(
    'is-closing'
  );

  await WAIT(320);

  overlay.remove();

  active = false;

  return false;
}

await revealMissionRoute(
  overlay
);

        window.clearTimeout(
          watchdog
        );

        return true;

      } catch (error) {

        console.error(
          '[RelayRunner] deployment loader failed',
          error
        );

        window.clearTimeout(
          watchdog
        );

        overlay?.remove();

        active = false;

        return false;
      }
    };

  /* =========================================================
     PUBLIC API
     ========================================================= */

  window.relayPlayDeploymentV1 =
    Object.freeze({
      show: runDeployment,

      isActive: () =>
        active,

      defaultAssets:
        DEFAULT_ASSETS
    });

})();