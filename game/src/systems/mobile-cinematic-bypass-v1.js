// Mobile-only first-entry guard.
// Desktop/web keeps the cinematic/tutorial exactly as-is. On touch devices,
// the cinematic capture listener can own the START click and then wait on a
// long presentation sequence. Phones should enter the actual game immediately
// so the full gameplay can be tested; the tutorial can still be used on web.
import './mobile-first-delivery-unlock-v2.js';

if (!window.__relayMobileCinematicBypassV1) {
  window.__relayMobileCinematicBypassV1 = true;

  const isTouch = () => window.matchMedia?.('(pointer: coarse)').matches
    || Number(navigator.maxTouchPoints || 0) > 0
    || /Android|iPhone|iPad|Mobile|Windows Phone|Silk|Kindle/i.test(navigator.userAgent || '');

  if (isTouch()) {
    const INTRO_KEY = 'relay.runner.gameplayIntro.final-v1.played';
    let forwarding = false;

    document.addEventListener('click', event => {
      const start = event.target.closest?.('#start');
      if (!start || forwarding) return;

      if (sessionStorage.getItem(INTRO_KEY) === '1') return;

      event.preventDefault();
      event.stopImmediatePropagation();
      sessionStorage.setItem(INTRO_KEY, '1');
      forwarding = true;
      window.setTimeout(() => {
        try { start.click(); }
        finally { forwarding = false; }
      }, 0);
    }, true);

    window.addEventListener('pageshow', () => {
      document.getElementById('relayGameplayIntroFinalV1')?.setAttribute('hidden', '');
      document.getElementById('play')?.classList.remove('relay-cinematic-presentation-lock');
      window.__relayCinematicLock = false;
    }, { passive: true });
  }
}
