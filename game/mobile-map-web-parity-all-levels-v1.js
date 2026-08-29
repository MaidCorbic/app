/* Relay Runner — mobile map parity runtime contract.
 * The existing map renderer owns all level geometry and mission state.
 * This module intentionally owns no input and creates no alternate map.
 */
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
    // Keep the existing renderer's live SVG. Only expose the current mission
    // identity for responsive CSS/state styling; never replace map geometry.
    const id = String(s?.mission?.id || s?.sys?.settings?.data?.missionId || '').trim();
    r.dataset.mapMission = id;
  };

  document.addEventListener('DOMContentLoaded', refresh, { once: true });
  window.addEventListener('resize', refresh, { passive: true });
  window.setInterval(refresh, 500);
})();
