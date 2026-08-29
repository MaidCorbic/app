/*
 * Relay Runner — all-level mobile map contract.
 * The existing briefing renderer already reads the live runner scene.
 * This guard makes the intended behaviour explicit for every campaign
 * level without owning gameplay, keyboard input, or mobile controls.
 */
(() => {
  'use strict';
  if (window.__relayMobileMapAllLevelsContract) return;
  window.__relayMobileMapAllLevelsContract = true;

  const LEVEL_IDS = new Set([
    'first-delivery',
    'dead-drop',
    'blackout',
    'pursuit',
    'signal-storm',
    'corporate-lockdown',
    'final-relay'
  ]);

  const scene = () => window.__relayRunnerScene || window.game?.scene?.getScene?.('runner') || null;

  window.__relayMobileMapIsCampaignLevel = () => {
    const current = scene();
    const id = String(current?.mission?.id || current?.sys?.settings?.data?.missionId || '').trim().toLowerCase();
    return !id || LEVEL_IDS.has(id);
  };

  // Do not inject markers or alter controls. The map renderer remains the
  // single owner of visual level data and derives it from the live scene.
})();
