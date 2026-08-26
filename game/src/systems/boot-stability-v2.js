// Boot stability V2: one authoritative recovery path for mobile first-load / first-entry freezes.
(() => {
  'use strict';
  if (window.__relayBootStabilityV2) return;
  window.__relayBootStabilityV2 = true;

  const SESSION_KEY = 'relay.runner.gameplayIntro.final-v1.played:session';
  let recovered = false;
  let started = false;
  let bootAt = Date.now();

  const mobile = () => {
    const coarse = !!window.matchMedia?.('(pointer: coarse)')?.matches;
    const touch = Number(navigator.maxTouchPoints || 0) > 0;
    return coarse || touch || /Android|iPhone|iPad|iPod|Mobile|Silk|Kindle/i.test(navigator.userAgent || '');
  };
  const runner = () => window.__relayRunnerScene || window.game?.scene?.getScene?.('runner') || null;
  const hidden = node => !node || node.classList.contains('hidden') || node.hidden;

  const unlock = reason => {
    if (recovered) return;
    recovered = true;
    console.warn('[Relay Runner] Boot stability recovery:', reason);

    const intro = document.getElementById('relayGameplayIntroFinalV1');
    intro?.querySelector('.cinematic-skip')?.click?.();
    if (intro) { intro.classList.remove('playing'); intro.hidden = true; }

    document.getElementById('play')?.classList.remove('relay-cinematic-presentation-lock');
    document.getElementById('titlePanel')?.classList.add('hidden');
    document.getElementById('relayInfoPanel')?.classList.add('hidden');
    document.body.classList.remove('rotate-dismissed');

    const scene = runner();
    if (scene) {
      scene.inputEnabled = true;
      scene.cinematicActive = false;
      if (scene.scene?.isPaused?.()) scene.scene.resume();
      scene.cameras?.main?.startFollow?.(scene.player, true, .08, .08);
    }

    window.__relayCinematicLock = false;
    window.dispatchEvent(new Event('relay:cinematic-unlock'));
    window.__relayBootRecovered = reason;
  };

  const stabilizeMobileLayout = () => {
    if (!mobile()) return;
    const play = document.getElementById('play');
    const host = document.getElementById('phaser-game');
    if (play) {
      play.style.width = '100%';
      play.style.height = '100dvh';
      play.style.minHeight = '100svh';
    }
    if (host) { host.style.width = '100%'; host.style.height = '100%'; }
  };

  const startRun = () => {
    if (started) return;
    started = true;
    bootAt = Date.now();
    sessionStorage.setItem(SESSION_KEY, '1');
    const scene = runner();
    if (scene && !window.__relayCinematicLock) {
      scene.inputEnabled = true;
      scene.cinematicActive = false;
    }
  };

  document.addEventListener('click', event => {
    if (event.target.closest?.('#start')) startRun();
  }, true);
  window.addEventListener('relay:runner-scene-ready', () => {
    started = true;
    bootAt = Date.now();
    stabilizeMobileLayout();
  }, { passive: true });
  window.addEventListener('resize', stabilizeMobileLayout, { passive: true });
  window.addEventListener('orientationchange', () => window.setTimeout(stabilizeMobileLayout, 140), { passive: true });
  window.addEventListener('pageshow', stabilizeMobileLayout, { passive: true });

  // The cinematic is presentation-only. On mobile it must not survive an actual
  // first-entry failure or stale session state and hold the game forever.
  if (mobile()) {
    window.setTimeout(() => {
      const intro = document.getElementById('relayGameplayIntroFinalV1');
      if (started && intro && !intro.hidden && Date.now() - bootAt > 12000) unlock('mobile cinematic timeout');
    }, 13000);
  }

  window.setTimeout(() => {
    stabilizeMobileLayout();
    const splash = document.getElementById('relaySplash');
    const canvas = document.querySelector('#phaser-game canvas');
    if (splash && !started && Date.now() - bootAt > 7000) {
      splash.classList.add('is-leaving');
      window.setTimeout(() => splash.remove(), 550);
    }
    if (started && !canvas && Date.now() - bootAt > 10000) unlock('renderer not mounted');
  }, 8000);

  window.setInterval(() => {
    if (recovered) return;
    const intro = document.getElementById('relayGameplayIntroFinalV1');
    const scene = runner();
    const staleIntro = started && intro && !intro.hidden && Date.now() - bootAt > 15000;
    const stalePanel = scene && !hidden(document.getElementById('titlePanel')) && !window.__relayCinematicLock && Date.now() - bootAt > 15000;
    if (staleIntro) unlock('stale cinematic overlay');
    else if (stalePanel) unlock('stale title panel');
  }, 1500);

  stabilizeMobileLayout();
})();
