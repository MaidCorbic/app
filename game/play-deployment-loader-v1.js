/*
 * Runner Relay — PLAY NOW / MISSION deployment sequence.
 *
 * Purpose:
 * - Reuse one cinematic deployment loader for Home and mission-to-mission flow.
 * - Select the supplied desktop/mobile artwork for the requested mission.
 * - Keep actual mission launching owned by the existing UI handlers.
 * - Keep Mission Route V5/V6 briefing ownership unchanged.
 */
(() => {
  'use strict';

  if (window.__relayPlayDeploymentV1) return;
  window.__relayPlayDeploymentV1 = true;

  const WAIT = ms => new Promise(resolve => setTimeout(resolve, ms));
  const introVisible = () => {
    const intro = document.getElementById('intro');
    return !!intro && !intro.classList.contains('hidden');
  };

  let active = false;
  let serial = 0;

const DEFAULT_ASSETS = Object.freeze({
  desktop: './assets/loadplay.jpg',
  mobile: './assets/loadplaymobile.jpg',
});
  const normalizeConfig = config => ({
    missionNumber: Math.max(1, Number(config?.missionNumber) || 1),
    desktop: config?.desktop || DEFAULT_ASSETS.desktop,
    mobile: config?.mobile || DEFAULT_ASSETS.mobile,
    beforeRoute: typeof config?.beforeRoute === 'function' ? config.beforeRoute : null,
  });

  const makeOverlay = ({ missionNumber, desktop, mobile }) => {
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

      <div class="relay-splash-brand relay-play-deployment-brand">
        <b>R/</b>
        <span>RELAY RUNNER</span>
      </div>

      <div class="relay-splash-network-status relay-play-deployment-network">
        <i></i>
        <span>RELAY NETWORK // ONLINE // SECURE</span>
      </div>

      <div class="relay-splash-ui relay-play-deployment-ui">
        <div class="relay-splash-meta">
          <span class="relay-splash-status">PREPARING MISSION ${String(missionNumber).padStart(2, '0')} // DEPLOYMENT</span>
          <span class="relay-splash-percent">00%</span>
        </div>

        <div class="relay-splash-track" aria-hidden="true">
          <i class="relay-splash-progress"></i>
        </div>

        <div class="relay-boot-status-grid">
          <div class="relay-boot-status-cell"><span>NODE</span><b>04 // ONLINE</b></div>
          <div class="relay-boot-status-cell"><span>SIGNAL</span><b>STABLE // LOCKED</b></div>
          <div class="relay-boot-status-cell"><span>RELAY</span><b>SYNCED // READY</b></div>
        </div>

        <div class="relay-boot-log" aria-live="polite">
       <span class="is-live">→ ROUTE DATA INITIALIZING // SECURE</span>
<span class="is-muted">→ WORLD NODE AWAITING // SYNC</span>
        </div>

        <div class="relay-boot-complete">
          <b aria-hidden="true"></b>
          <div>
       <strong>DEPLOYMENT READY</strong>
<small>MISSION ${String(missionNumber).padStart(2, '0')} // ROUTE LOCKED // VERIFIED</small>
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
  filter:
    saturate(.94)
    contrast(1.12)
    brightness(.78);
}

  .relay-play-deployment .relay-splash-brand::after{
  content:"DEPLOYMENT SEQUENCE  //  MISSION LINK" !important;
}

    .relay-play-deployment .relay-splash-ui{
  width:min(900px,calc(100vw - 48px));
  padding:13px 13px 12px;
  gap:9px;
  border:1px solid rgba(117,247,255,.24);
  border-top-color:rgba(255,210,60,.34);
  border-left-color:rgba(0,234,255,.38);
  background:
    linear-gradient(
      180deg,
      rgba(1,9,16,.88),
      rgba(1,6,11,.72)
    );
  box-shadow:
    0 24px 60px rgba(0,0,0,.52),
    0 0 32px rgba(0,140,255,.11),
    0 0 70px rgba(0,234,255,.05),
    inset 0 0 30px rgba(0,234,255,.045);
  backdrop-filter:blur(7px);
}

.relay-play-deployment .relay-splash-meta{
  border-color:rgba(117,247,255,.18);
  border-bottom-color:rgba(117,247,255,.34);
  background:
    linear-gradient(
      90deg,
      rgba(0,234,255,.045),
      rgba(0,7,12,.34)
    );
}

.relay-play-deployment .relay-splash-status{
  text-shadow:
    0 0 8px rgba(0,234,255,.20);
}

.relay-play-deployment .relay-splash-percent{
  text-shadow:
    0 0 10px rgba(0,234,255,.42),
    0 0 22px rgba(0,140,255,.18);
}

.relay-play-deployment .relay-splash-progress{
  transition:
    width .18s cubic-bezier(.16,1,.3,1),
    filter .18s ease,
    box-shadow .18s ease;

  filter:brightness(1.08);

  box-shadow:
    0 0 8px rgba(0,234,255,.90),
    0 0 18px rgba(0,234,255,.62),
    0 0 34px rgba(0,140,255,.28);
}

.relay-play-deployment .relay-play-deployment-network{
  display:flex !important;
  padding:8px 12px;
  border:1px solid rgba(0,234,255,.32);
  border-left:2px solid var(--rr-cyan,#00eaff);
  background:
    linear-gradient(
      90deg,
      rgba(0,234,255,.12),
      rgba(0,12,20,.48)
    );
  box-shadow:
    0 0 12px rgba(0,234,255,.10),
    0 0 26px rgba(0,140,255,.06),
    inset 0 0 18px rgba(0,234,255,.045);
  text-shadow:
    0 0 10px rgba(0,234,255,.30);
}
  .relay-play-deployment .relay-boot-complete{
  opacity:0;
  transform:translateY(6px) scale(.98);
  filter:brightness(.92);
  transition:
    opacity .28s ease,
    transform .28s cubic-bezier(.16,1,.3,1),
    filter .28s ease;
}

      .relay-play-deployment .relay-boot-complete.is-visible{
  opacity:1;
  transform:translateY(0) scale(1);
  filter:brightness(1.08);
  text-shadow:
    0 0 10px rgba(0,234,255,.28),
    0 0 22px rgba(0,234,255,.12);
}

      .relay-play-deployment.is-closing{
        opacity:0 !important;
        visibility:hidden !important;
        transition:opacity .28s ease,visibility .28s ease !important;
      }
.relay-play-deployment:not(.is-closing){
  opacity:1 !important;
  visibility:visible !important;
  pointer-events:none !important;
}
      @media(max-width:700px) and (orientation:portrait){
        .relay-play-deployment .relay-play-deployment-network{
          display:none !important;
        }

  .relay-play-deployment .relay-splash-ui{
  width:min(92vw,620px);
  max-width:calc(100vw - 20px);
  padding:9px;
  gap:7px;
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
      if (typeof api.isVisible === 'function' && api.isVisible()) api.close();
      api.show();
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }

    overlay.classList.add('is-closing');
    await WAIT(320);
    overlay.remove();
    active = false;
  };

  const runDeployment = async rawConfig => {
  console.log('[RelayRunner] DEPLOYMENT LOADER STARTED');

  if (active) return false;

    const config = normalizeConfig(rawConfig);
    active = true;
    const token = ++serial;
    let overlay;

    try {
      installStyle();
     overlay = makeOverlay(config);
document.body.appendChild(overlay);

console.log('[RelayRunner] OVERLAY ADDED:', overlay);
console.log('[RelayRunner] CLASS BEFORE FRAME:', overlay.className);

await new Promise(resolve => requestAnimationFrame(resolve));

console.log('[RelayRunner] CLASS AFTER FRAME:', overlay.className);

if (overlay.classList.contains('is-closing')) {
  console.error('[RelayRunner] BUG: is-closing was added immediately after creation!');
}
console.log('[RelayRunner] OVERLAY DISPLAY:', getComputedStyle(overlay).display);
console.log('[RelayRunner] OVERLAY VISIBILITY:', getComputedStyle(overlay).visibility);
console.log('[RelayRunner] OVERLAY OPACITY:', getComputedStyle(overlay).opacity);
console.log('[RelayRunner] OVERLAY ZINDEX:', getComputedStyle(overlay).zIndex);

      await new Promise(resolve => requestAnimationFrame(resolve));
      if (!active || token !== serial) return false;

      const started = performance.now();
      const minimumMs = 1550;

      setStage(overlay, 8, `INITIALIZING MISSION ${config.missionNumber}`, '→ RELAY CORE READY', '→ WORLD NODE CONNECTING // SECURE');
      await WAIT(220);
      if (!active || token !== serial) return false;

      setStage(overlay, 27, 'LOADING ROUTE DATA', '→ ROUTE DATA RECEIVED // VERIFIED', '→ CHECKPOINT MATRIX ONLINE');
      await WAIT(230);
      if (!active || token !== serial) return false;

      setStage(overlay, 49, 'SYNCING WORLD', '→ WORLD NODE SYNCING', '→ SIGNAL CHANNEL STABLE // LOCKED');
      await WAIT(250);
      if (!active || token !== serial) return false;

      setStage(overlay, 72, 'INITIALIZING PHASER', '→ PHASER CORE ONLINE', '→ MISSION SCENE PREPARING // READY');
      await WAIT(250);
      if (!active || token !== serial) return false;

      setStage(overlay, 91, 'FINALIZING DEPLOYMENT', '→ ROUTE LOCK CONFIRMED // VERIFIED', '→ WORLD NODE ONLINE // READY');

      while (performance.now() - started < minimumMs || !getMissionReady()) {
        await WAIT(50);
        if (!active || token !== serial) return false;
      }

      setStage(overlay, 100, 'DEPLOYMENT READY', '→ MISSION DATA LOADED // VERIFIED', '→ RELAY CHANNEL STABLE // LOCKED');
      overlay.querySelector('.relay-boot-complete')?.classList.add('is-visible');
      overlay.setAttribute('aria-busy', 'false');

      await WAIT(240);
      if (!active || token !== serial) return false;

      await config.beforeRoute?.();
      if (!active || token !== serial) return false;

      await revealMissionRoute(overlay);
      return true;
    } catch (error) {
      console.error('[RelayRunner] deployment loader failed', error);
      overlay?.remove();
      active = false;
      return false;
    }
  };

  window.relayPlayDeploymentV1 = Object.freeze({
    show: runDeployment,
    isActive: () => active,
    defaultAssets: DEFAULT_ASSETS,
  });

   document.addEventListener('click', event => {
    if (active) return;

    const button = event.target.closest('#start');
    if (!button) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    void runDeployment({
      missionNumber: 1,
      beforeRoute: async () => {
        const originalStart = document.querySelector(
          'body > #game > div[hidden] #start'
        );

        if (originalStart instanceof HTMLElement) {
          originalStart.click();
        }
      },
    });
  }, true);
})();
