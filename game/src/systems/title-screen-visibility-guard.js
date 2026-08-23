(() => {
  if (window.__relayTitleVisibilityGuardV1) return;
  window.__relayTitleVisibilityGuardV1 = true;

  const intro = document.getElementById('intro');
  const start = document.getElementById('start');
  if (!intro || !start) return;

  let launchRequested = false;
  let tutorialReleased = false;
  const tutorialRoot = () => document.getElementById('relayTutorialOnboardingV3');

  const markLaunch = () => {
    launchRequested = true;
    tutorialReleased = true;
    const root = tutorialRoot();
    if (root && !root.hidden && !document.body.classList.contains('relay-training-active')) {
      document.body.classList.add('relay-training-active');
    }
  };

  start.addEventListener('pointerdown', markLaunch, { capture: true, passive: true });
  start.addEventListener('click', markLaunch, { capture: true });
  window.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !intro.classList.contains('hidden')) markLaunch();
  }, { capture: true });

  const suppressTrainingBeforeLaunch = () => {
    if (launchRequested || tutorialReleased) return;
    if (document.body.classList.contains('relay-training-active')) {
      document.body.classList.remove('relay-training-active');
    }
  };

  const bodyObserver = new MutationObserver(suppressTrainingBeforeLaunch);
  bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  window.addEventListener('relay:tutorial-complete', () => {
    tutorialReleased = true;
    document.body.classList.remove('relay-training-active');
  }, { passive: true });

  const ensureVisible = () => {
    if (launchRequested) return;
    const finish = document.getElementById('finish');
    const gameOver = document.getElementById('gameOver');
    const pause = document.getElementById('pauseMenu');
    if (finish?.classList.contains('hidden') && gameOver?.classList.contains('hidden') && pause?.classList.contains('hidden')) {
      intro.classList.remove('hidden');
      intro.classList.remove('is-leaving');
    }
    suppressTrainingBeforeLaunch();
  };

  ensureVisible();
  requestAnimationFrame(ensureVisible);
  window.setTimeout(ensureVisible, 250);
  window.setTimeout(ensureVisible, 1000);
})();
