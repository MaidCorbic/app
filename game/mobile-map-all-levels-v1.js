/* Relay Runner — all-level mobile map state bridge. */
(() => {
  'use strict';
  if (window.__relayMobileMapAllLevels) return;
  window.__relayMobileMapAllLevels = true;
  const root = () => document.getElementById('relayGameplayIntroFinalV3');
  const scene = () => window.__relayRunnerScene || window.game?.scene?.getScene?.('runner') || null;
  const sync = () => {
    const r = root(), s = scene();
    if (!r || !s) return;
    r.dataset.mapMission = String(s?.mission?.id || s?.sys?.settings?.data?.missionId || '').trim();
    r.dataset.mapLive = 'true';
  };
  document.addEventListener('DOMContentLoaded', sync, { once: true });
  window.addEventListener('resize', sync, { passive: true });
  window.setInterval(sync, 500);
})();
