/* Relay Runner — all-level mobile map parity runtime. */
(() => {
  'use strict';
  if (window.__relayMobileMapAllLevels) return;
  window.__relayMobileMapAllLevels = true;

  const root = () => document.getElementById('relayGameplayIntroFinalV3');
  const scene = () => window.__relayRunnerScene || window.game?.scene?.getScene?.('runner') || null;

  const sync = () => {
    const r = root();
    const s = scene();
    if (!r || !s) return;
    const id = String(s?.mission?.id || s?.sys?.settings?.data?.missionId || '').trim();
    r.dataset.mapMission = id;
    r.dataset.mapLive = 'true';
  };

  document.addEventListener('DOMContentLoaded', sync, { once: true });
  window.addEventListener('resize', sync, { passive: true });
  window.setInterval(sync, 500);
})();
