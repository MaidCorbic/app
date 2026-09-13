/*
 * Runner Relay — mission-to-mission deployment transition.
 *
 * Reuses the same deployment/progress-bar visual language as PLAY NOW.
 * It intercepts NEXT MISSION, shows the target mission artwork, then hands
 * the original click handler back to the existing gameplay flow.
 */
(() => {
  'use strict';

  if (window.__relayMissionTransitionV1) return;
  window.__relayMissionTransitionV1 = true;

  const WAIT = ms => new Promise(resolve => setTimeout(resolve, ms));

  const ASSETS = Object.freeze({
    2: {
      desktop: '/game/assets/loadplay2.jpg',
      mobile: '/game/assets/loadplay2mobile.jpg',
    },
    3: {
      desktop: '/game/assets/loadplay3.jpg',
      mobile: '/game/assets/loadplay3mobile.jpg',
    },
    4: {
      desktop: '/game/assets/loadplay4.jpg',
      mobile: '/game/assets/loadplay4mobile.jpg',
    },
    5: {
      desktop: '/game/assets/loadmobile5.jpg',
      mobile: '/game/assets/loadplay5mobile.jpg',
    },
  });

  // The repository currently has seven campaign missions but dedicated
  // transition artwork through mission 5. Reuse the final supplied pair for
  // mission 6 so the transition still exists without creating new assets.
  const FALLBACK = ASSETS[5];

  let active = false;
  let sequence = 0;

  const getCurrentMissionNumber = () => {
    const value = document.getElementById('missionNumber')?.textContent || '';
    const match = value.match(/MISSION\s+(\d+)/i);
    return match ? Number(match[1]) : 1;
  };

  const makeOverlay = missionNumber => {
    const assets = ASSETS[missionNumber] || FALLBACK;
    const overlay = document.createElement('section');
    overlay.id = 'relayMissionTransition';
    overlay.className = 'relay-splash relay-play-deployment';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    overlay.setAttribute('aria-busy', 'true');

    overlay.innerHTML = `
      <picture class="relay-splash-picture">
        <source
          media="(max-width:700px)"
          srcset="${assets.mobile}"
        >
        <img
          class="relay-splash-art"
          src="${assets.desktop}"
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
            <small>MISSION RR-${String(missionNumber).padStart(2, '0')}</small>
          </div>
        </div>
      </div>
    `;

    return overlay;
  };

  const installFallbackStyle = () => {
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
        width:100%;
        height:100%;
        display:block;
        object-position:center !important;
      }
      .relay-play-deployment .relay-splash-ui{
        width:min(900px,calc(100vw - 48px));
      }
      .relay-play-deployment .relay-splash-progress{
        transition:width .18s cubic-bezier(.16,1,.3,1);
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
    if (first) first.textContent = firstLog;
    if (second) second.textContent = secondLog;
  };

  const runTransition = async (missionNumber, continueOriginalClick) => {
    if (active) return;
    active = true;
    const token = ++sequence;
    installFallbackStyle();

    const finish = document.getElementById('finish');
    finish?.classList.add('hidden');

    const overlay = makeOverlay(missionNumber);
    document.body.appendChild(overlay);

    await new Promise(resolve => requestAnimationFrame(resolve));
    if (!active || token !== sequence) return;

    const started = performance.now();
    const minimumMs = 1550;

    setStage(overlay, 8, 'INITIALIZING MISSION', '→ RELAY CORE READY', '→ WORLD NODE CONNECTING');
    await WAIT(220);
    if (!active || token !== sequence) return;

    setStage(overlay, 27, 'LOADING ROUTE DATA', '→ ROUTE DATA RECEIVED', '→ CHECKPOINT MATRIX ONLINE');
    await WAIT(230);
    if (!active || token !== sequence) return;

    setStage(overlay, 49, 'SYNCING WORLD', '→ WORLD NODE SYNCING', '→ SIGNAL CHANNEL STABLE');
    await WAIT(250);
    if (!active || token !== sequence) return;

    setStage(overlay, 72, 'INITIALIZING PHASER', '→ PHASER CORE ONLINE', '→ MISSION SCENE PREPARING');
    await WAIT(250);
    if (!active || token !== sequence) return;

    setStage(overlay, 91, 'FINALIZING DEPLOYMENT', '→ ROUTE LOCK CONFIRMED', '→ WORLD NODE ONLINE');

    while (performance.now() - started < minimumMs) {
      await WAIT(50);
      if (!active || token !== sequence) return;
    }

    setStage(overlay, 100, 'DEPLOYMENT READY', '→ MISSION DATA LOADED', '→ RELAY CHANNEL STABLE');
    overlay.querySelector('.relay-boot-complete')?.classList.add('is-visible');
    overlay.setAttribute('aria-busy', 'false');

    await WAIT(240);
    if (!active || token !== sequence) return;

    if (typeof continueOriginalClick === 'function') {
      continueOriginalClick();
    }

    await WAIT(180);
    window.relayGameplayIntroV5?.show?.();

    overlay.classList.add('is-closing');
    await WAIT(320);
    overlay.remove();
    active = false;
  };

  document.addEventListener('click', event => {
    if (active) return;

    const button = event.target.closest('#nextMission');
    if (!button || button.disabled || button.classList.contains('hidden')) return;

    const currentMission = getCurrentMissionNumber();
    const nextMission = currentMission + 1;
    if (!Number.isFinite(nextMission)) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const originalClick = typeof button.onclick === 'function'
      ? () => button.onclick()
      : null;

    runTransition(nextMission, originalClick);
  }, true);
})();
