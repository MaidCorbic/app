/*
 * Runner Relay — PLAY NOW deployment sequence.
 *
 * Purpose:
 * - Reuse the existing cinematic splash visual language.
 * - Show a second loading/deployment screen after PLAY NOW.
 * - Use loadplay.jpg on web/desktop and loadplaymobile.jpg on mobile.
 * - Keep gameplay and Mission Route V6 ownership unchanged.
 *
 * This layer is presentation-only. The existing START handler still owns
 * actual gameplay launch; this overlay simply bridges Home -> Mission Route.
 */
(() => {
  'use strict';

  if (window.__relayPlayDeploymentV1) return;
  window.__relayPlayDeploymentV1 = true;

  const WAIT = ms => new Promise(resolve => setTimeout(resolve, ms));
  const $ = selector => document.querySelector(selector);
  const introVisible = () => {
    const intro = document.getElementById('intro');
    return !!intro && !intro.classList.contains('hidden');
  };

  let active = false;
  let serial = 0;

  const makeOverlay = () => {
    const overlay = document.createElement('section');
    overlay.id = 'relayPlayDeployment';
    overlay.className = 'relay-splash relay-play-deployment';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    overlay.setAttribute('aria-busy', 'true');

    overlay.innerHTML = `
      <picture class="relay-splash-picture">
        <source
          media="(max-width:700px)"
          srcset="/game/assets/loadplaymobile.jpg"
        >
        <img
          class="relay-splash-art"
          src="/game/assets/loadplay.jpg"
          alt=""
          decoding="async"
          fetchpriority="high"
        >
      </picture>

      <div class="relay-splash-brand relay-play-deployment-brand">
        <b>R/</b>
        <span>RELAY RUNNER</span>
      </div>

      <div class="relay-splash-network-status relay-play-deployment-network">
        <i></i>
        <span>NETWORK // ONLINE</span>
      </div>

      <div class="relay-splash-ui relay-play-deployment-ui">
        <div class="relay-splash-meta">
          <span class="relay-splash-status">PREPARING DEPLOYMENT</span>
          <span class="relay-splash-percent">0%</span>
        </div>

        <div class="relay-splash-track" aria-hidden="true">
          <i class="relay-splash-progress"></i>
        </div>

        <div class="relay-boot-status-grid">
          <div class="relay-boot-status-cell"><span>NODE</span><b>04 // ONLINE</b></div>
          <div class="relay-boot-status-cell"><span>SIGNAL</span><b>STABLE</b></div>
          <div class="relay-boot-status-cell"><span>RELAY</span><b>SYNCED</b></div>
        </div>

        <div class="relay-boot-log" aria-live="polite">
          <span class="is-live">→ ROUTE DATA INITIALIZING</span>
          <span class="is-muted">→ WORLD NODE AWAITING</span>
        </div>

        <div class="relay-boot-complete">
          <b aria-hidden="true"></b>
          <div>
            <strong>DEPLOYMENT READY</strong>
            <small>MISSION RR-01 // OLD QUARTER</small>
          </div>
        </div>
      </div>
    `;

    return overlay;
  };

  const installStyle = () => {
    if (document.getElementById('relay-play-deployment-style')) return;

    const style = document.createElement('style');
    style.id = 'relay-play-deployment-style';
    style.textContent = `
      .relay-play-deployment{
        z-index:2147483647 !important;
        pointer-events:none !important;
      }

      .relay-play-deployment .relay-splash-picture{
        position:absolute;
        inset:0;
        display:block;
      }

      .relay-play-deployment .relay-splash-art{
        object-position:center !important;
      }

      .relay-play-deployment .relay-splash-brand::after{
        content:"DEPLOYMENT SEQUENCE" !important;
      }

      .relay-play-deployment .relay-splash-ui{
        width:min(900px,calc(100vw - 48px));
      }

      .relay-play-deployment .relay-splash-progress{
        transition:width .18s cubic-bezier(.16,1,.3,1);
      }

      .relay-play-deployment .relay-play-deployment-network{
        display:flex !important;
      }

      .relay-play-deployment .relay-boot-complete{
        opacity:0;
        transform:translateY(4px);
        transition:opacity .22s ease,transform .22s ease;
      }

      .relay-play-deployment .relay-boot-complete.is-visible{
        opacity:1;
        transform:none;
      }

      .relay-play-deployment.is-closing{
        opacity:0 !important;
        visibility:hidden !important;
        transition:opacity .28s ease,visibility .28s ease !important;
      }

      @media(max-width:700px) and (orientation:portrait){
        .relay-play-deployment .relay-play-deployment-network{
          display:none !important;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const setStage = (overlay, percent, label, firstLog, secondLog) => {
    const pct = overlay.querySelector('.relay-splash-percent');
    const status = overlay.querySelector('.relay-splash-status');
    const bar = overlay.querySelector('.relay-splash-progress');
    const first = overlay.querySelector('.relay-boot-log span:first-child');
    const second = overlay.querySelector('.relay-boot-log span:last-child');

    if (pct) pct.textContent = `${Math.round(percent)}%`;
    if (status) status.textContent = label;
    if (bar) bar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
    if (first && firstLog) first.textContent = firstLog;
    if (second && secondLog) second.textContent = secondLog;
  };

  const getMissionReady = () => {
    const api = window.relayGameplayIntroV5;
    return !!api && typeof api.show === 'function';
  };

  const revealMissionRoute = async overlay => {
    const api = window.relayGameplayIntroV5;

    if (api && typeof api.close === 'function' && typeof api.show === 'function') {
      if (typeof api.isVisible === 'function' && api.isVisible()) {
        api.close();
      }

      // The existing gameplay-intro show() already owns Mission Route V6.
      // Re-open it so its full 10-second route briefing starts after deployment.
      api.show();

      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }

    overlay.classList.add('is-closing');
    await WAIT(320);
    overlay.remove();
    active = false;
  };

  const runDeployment = async () => {
    if (active) return;
    active = true;
    const token = ++serial;

    installStyle();

    const overlay = makeOverlay();
    document.body.appendChild(overlay);

    // Give the browser one paint so the dedicated background appears before telemetry advances.
    await new Promise(resolve => requestAnimationFrame(resolve));
    if (!active || token !== serial) return;

    const started = performance.now();
    const minimumMs = 1550;

    setStage(
      overlay,
      8,
      'INITIALIZING MISSION',
      '→ RELAY CORE READY',
      '→ WORLD NODE CONNECTING'
    );

    await WAIT(220);
    if (!active || token !== serial) return;

    setStage(
      overlay,
      27,
      'LOADING ROUTE DATA',
      '→ ROUTE DATA RECEIVED',
      '→ CHECKPOINT MATRIX ONLINE'
    );

    await WAIT(230);
    if (!active || token !== serial) return;

    setStage(
      overlay,
      49,
      'SYNCING WORLD',
      '→ WORLD NODE SYNCING',
      '→ SIGNAL CHANNEL STABLE'
    );

    await WAIT(250);
    if (!active || token !== serial) return;

    setStage(
      overlay,
      72,
      'INITIALIZING PHASER',
      '→ PHASER CORE ONLINE',
      '→ MISSION SCENE PREPARING'
    );

    await WAIT(250);
    if (!active || token !== serial) return;

    setStage(
      overlay,
      91,
      'FINALIZING DEPLOYMENT',
      '→ ROUTE LOCK CONFIRMED',
      '→ WORLD NODE ONLINE'
    );

    while (performance.now() - started < minimumMs || !getMissionReady()) {
      await WAIT(50);
      if (!active || token !== serial) return;
    }

    setStage(
      overlay,
      100,
      'DEPLOYMENT READY',
      '→ MISSION DATA LOADED',
      '→ RELAY CHANNEL STABLE'
    );

    const complete = overlay.querySelector('.relay-boot-complete');
    complete?.classList.add('is-visible');
    overlay.setAttribute('aria-busy', 'false');

    await WAIT(240);
    if (!active || token !== serial) return;

    await revealMissionRoute(overlay);
  };

  document.addEventListener('click', event => {
    if (!introVisible() || active) return;
    const button = event.target.closest('#start');
    if (!button) return;
    runDeployment();
  }, true);
})();
