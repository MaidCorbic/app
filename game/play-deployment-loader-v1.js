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

  // Home owns the visible Start button click.
  // This module exposes the cinematic API only; it must not install a
  // document-level capture listener that competes with Home's handler.
})();
