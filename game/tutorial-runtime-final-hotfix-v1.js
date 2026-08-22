(() => {
  'use strict';
  if (window.__relayTutorialFinalHotfixV1) return;
  window.__relayTutorialFinalHotfixV1 = true;

  const LEGACY_IDS = ['relayTutorialOnboardingV2', 'relayTutorialOnboarding'];
  const cleanupLegacy = () => {
    LEGACY_IDS.forEach(id => document.getElementById(id)?.remove());
    document.querySelectorAll('[id^="relayTutorialOnboardingV2-"]').forEach(node => node.remove());
  };

  const hideGameplayUi = hidden => {
    document.body.classList.toggle('relay-training-active', hidden);
    const selectors = [
      '#play > .hud',
      '#play > .world-marker',
      '#play > .input-guide',
      '#play > .rotate-prompt',
      '#play > .vignette',
      '#relay-gameplay-new-layer',
      '#gameplay-event-hud',
      '#pauseMenu',
      '#finish',
      '#gameOver',
      '#toast',
      '#relayGameplayIntroFinalV2'
    ];
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(node => {
        if (hidden) {
          node.setAttribute('data-tutorial-hidden', '1');
          node.style.setProperty('display', 'none', 'important');
          node.style.setProperty('visibility', 'hidden', 'important');
          node.style.setProperty('pointer-events', 'none', 'important');
        } else if (node.getAttribute('data-tutorial-hidden') === '1') {
          node.removeAttribute('data-tutorial-hidden');
          node.style.removeProperty('display');
          node.style.removeProperty('visibility');
          node.style.removeProperty('pointer-events');
        }
      });
    });
  };

  const sync = () => {
    cleanupLegacy();
    const v3 = document.getElementById('relayTutorialOnboardingV3');
    const active = !!v3 && !v3.hidden && !v3.querySelector('.training-cinema:not([hidden])');
    hideGameplayUi(active);
  };

  cleanupLegacy();
  const observer = new MutationObserver(sync);
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class'] });
  window.addEventListener('relay:runner-scene-ready', () => window.setTimeout(sync, 0), { passive: true });
  window.addEventListener('relay:cinematic-lock', sync, { passive: true });
  window.addEventListener('relay:cinematic-unlock', sync, { passive: true });
  window.addEventListener('beforeunload', () => observer.disconnect(), { once: true });
  sync();
})();
