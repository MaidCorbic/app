/* Mobile map parity runtime: the existing web renderer remains the single source of truth. */
(() => {
  'use strict';
  if (window.__relayMobileMapWebParityAllLevels) return;
  window.__relayMobileMapWebParityAllLevels = true;

  const root = () => document.getElementById('relayGameplayIntroFinalV3');
  const scene = () => window.__relayRunnerScene || window.game?.scene?.getScene?.('runner') || null;

  const refresh = () => {
    const r = root();
    const s = scene();
    if (!r || !s) return;
    const map = r.querySelector('.map-briefing-map');
    if (!map) return;
    const id = String(s?.mission?.id || s?.sys?.settings?.data?.missionId || '').trim();
    r.dataset.mapMission = id;
    r.dataset.mapLive = 'true';
  };

  document.addEventListener('DOMContentLoaded', refresh, { once: true });
  window.addEventListener('resize', refresh, { passive: true });
  window.setInterval(refresh, 500);
})();
