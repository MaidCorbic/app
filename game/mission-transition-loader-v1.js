/*
 * Runner Relay — mission-to-mission deployment bridge.
 *
 * One owner:
 * - play-deployment-loader-v1.js renders the loader.
 * - This file only selects the mission artwork and preserves the existing
 *   #nextMission click handler that actually launches the next mission.
 */
(() => {
  'use strict';

  if (window.__relayMissionTransitionV1) return;
  window.__relayMissionTransitionV1 = true;

  const WAIT = ms => new Promise(resolve => setTimeout(resolve, ms));

  const ASSETS = Object.freeze({
    1: Object.freeze({ desktop: '/game/assets/loadplay.jpg', mobile: '/game/assets/loadplaymobile.jpg' }),
    2: Object.freeze({ desktop: '/game/assets/loadplay2.jpg', mobile: '/game/assets/loadplay2mobile.jpg' }),
    3: Object.freeze({ desktop: '/game/assets/loadplay3.jpg', mobile: '/game/assets/loadplay3mobile.jpg' }),
    4: Object.freeze({ desktop: '/game/assets/loadplay4.jpg', mobile: '/game/assets/loadplay4mobile.jpg' }),
    5: Object.freeze({ desktop: '/game/assets/loadmobile5.jpg', mobile: '/game/assets/loadplay5mobile.jpg' }),
  });

  const FALLBACK = ASSETS[5];

  const getMissionNumber = () => {
    const text = document.getElementById('missionNumber')?.textContent || '';
    const match = text.match(/(\d+)/);
    return Number(match?.[1] || 1);
  };

  const getAssets = missionNumber => ASSETS[missionNumber] || FALLBACK;

  const isUsableButton = button => {
    if (!button || button.disabled) return false;
    return !button.classList.contains('hidden') && button.getAttribute('aria-hidden') !== 'true';
  };

  const launchThroughExistingHandler = button => {
    const originalClick = button.onclick;
    if (typeof originalClick !== 'function') {
      console.error('[RelayRunner] #nextMission has no existing launch handler');
      return false;
    }
    originalClick.call(button);
    return true;
  };

  document.addEventListener('click', event => {
    const button = event.target.closest('#nextMission');
    if (!isUsableButton(button)) return;

    const loader = window.relayPlayDeploymentV1;
    if (!loader || typeof loader.show !== 'function' || loader.isActive?.()) return;

    const currentMission = getMissionNumber();
    const nextMission = currentMission + 1;
    const assets = getAssets(nextMission);

    // Capture-phase ownership is deliberate: it prevents the generic Mission
    // Route listener from opening a second flow before the deployment loader.
    event.preventDefault();
    event.stopImmediatePropagation();

    void loader.show({
      missionNumber: nextMission,
      desktop: assets.desktop,
      mobile: assets.mobile,
      beforeRoute: async () => {
        launchThroughExistingHandler(button);
        await WAIT(120);
      },
    });
  }, true);
})();
