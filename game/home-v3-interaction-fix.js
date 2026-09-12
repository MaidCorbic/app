import './unified-cinematic-ui-v1.js';
import './unified-cinematic-ui-bridge-v1.js';
import './unified-options-ui-v1.js';
import './unified-gameplay-ui-v1.js';
import './presentation-final-v1.js';

(() => {
  'use strict';
  if (window.__relayHomeFinalV2) return;
  window.__relayHomeFinalV2 = true;

  const getRunner = () => window.__relayRunnerScene || window.relayRunnerGame?.scene?.getScene?.('runner') || null;

  const closeOverlaysForRun = () => {
    ['pauseMenu','titlePanel','relayInfoPanel','preflight','worldMap','finish','gameOver','levelUp','abilityUnlock']
      .forEach(id => document.getElementById(id)?.classList.add('hidden'));
  };

  const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms));

  const startRunnerDirect = async () => {
    if (window.__relayRunStartInFlight) return Boolean(await window.__relayRunStartInFlight.promise);

    const run = async () => {
      const intro = document.getElementById('intro');
      const game = window.relayRunnerGame || getRunner()?.game;
      if (!game?.scene) return false;

      closeOverlaysForRun();

      const scene = getRunner();
      try {
        if (scene?.scene?.isPaused?.()) {
          game.scene.resume('runner');
        } else if (scene?.scene?.isActive?.()) {
          game.scene.resume('runner');
        } else if (typeof window.relayLaunchRun === 'function') {
          await window.relayLaunchRun(0);
        } else {
          return false;
        }
      } catch (error) {
        console.error('[RelayRunner] direct run launch failed', error);
        return false;
      }

      intro?.classList.add('hidden');
      document.body.classList.add('relay-run-active');

      for (let attempt = 0; attempt < 40; attempt += 1) {
        const active = getRunner();
        if (active?.scene?.isActive?.() && !active?.scene?.isPaused?.()) {
          window.dispatchEvent(new CustomEvent('relay:run-started', { detail: { scene: active } }));
          return true;
        }
        await wait(50);
      }

      return Boolean(getRunner()?.scene?.isActive?.());
    };

    window.__relayRunStartInFlight = { promise: run() };
    try {
      return await window.__relayRunStartInFlight.promise;
    } finally {
      window.__relayRunStartInFlight = null;
    }
  };

  const startContinueDirect = async () => {
    closeOverlaysForRun();
    if (typeof window.relayContinueRun === 'function') {
      try { return await window.relayContinueRun(); } catch (error) { console.error('[RelayRunner] direct continue failed', error); }
    }
    return startRunnerDirect();
  };

  const openCanonicalOptions = () => {
    const panel = document.getElementById('titlePanel');
    const heading = document.getElementById('titlePanelHeading');
    const content = document.getElementById('titlePanelContent');
    if (!(panel instanceof HTMLElement) || !(heading instanceof HTMLElement) || !(content instanceof HTMLElement)) return false;

    try {
      panel.classList.remove('hidden');
      panel.removeAttribute('hidden');
      panel.setAttribute('aria-hidden', 'false');
      heading.textContent = 'OPTIONS';
      heading.className = 'relay-options-title';
      document.dispatchEvent(new CustomEvent('relay-open-home-options', {
        detail: { panel, content, source: 'canonical-home-router' },
      }));
      return true;
    } catch {
      return false;
    }
  };

  const installHomeRouter = () => {
    if (document.documentElement.dataset.canonicalHomeRouterV2 === '1') return;
    document.documentElement.dataset.canonicalHomeRouterV2 = '1';

    document.addEventListener('click', event => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const start = target.closest('#intro #start');
      if (start) {
        event.preventDefault();
        event.stopImmediatePropagation();
        void startRunnerDirect();
        return;
      }

      const cont = target.closest('#intro #continue');
      if (cont && !cont.disabled && !cont.classList.contains('hidden')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        void startContinueDirect();
        return;
      }

      const optionsButton = target.closest('[data-final-home="options"],[data-final-home-button="options"],[data-home-v4-action="options"]');
      if (optionsButton) {
        event.preventDefault();
        event.stopImmediatePropagation();
        openCanonicalOptions();
      }
    }, true);

    window.relayStartRun = startRunnerDirect;
    window.relayContinueRun = startContinueDirect;
  };

  const installLegacyOptionsGuard = () => {
    if (document.getElementById('relay-canonical-options-guard-v3')) return;
    const style = document.createElement('style');
    style.id = 'relay-canonical-options-guard-v3';
    style.textContent = `
      #titlePanel > .relay-cinematic-panel,
      #titlePanel.relay-options-unified > .relay-cinematic-panel { display:none !important; visibility:hidden !important; pointer-events:none !important; }
    `;
    document.head.appendChild(style);
  };

  const boot = () => {
    installHomeRouter();
    installLegacyOptionsGuard();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
