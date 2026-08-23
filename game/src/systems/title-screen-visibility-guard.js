(() => {
  if (window.__relayTitleVisibilityGuardV1) return;
  window.__relayTitleVisibilityGuardV1 = true;

  const intro = document.getElementById('intro');
  const start = document.getElementById('start');
  if (!intro || !start) return;

  let launchRequested = false;
  const markLaunch = () => { launchRequested = true; };
  start.addEventListener('pointerdown', markLaunch, { capture: true, passive: true });
  start.addEventListener('click', markLaunch, { capture: true });
  window.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !intro.classList.contains('hidden')) launchRequested = true;
  }, { capture: true });

  const ensureVisible = () => {
    if (launchRequested) return;
    const finish = document.getElementById('finish');
    const gameOver = document.getElementById('gameOver');
    const pause = document.getElementById('pauseMenu');
    if (finish?.classList.contains('hidden') && gameOver?.classList.contains('hidden') && pause?.classList.contains('hidden')) {
      intro.classList.remove('hidden');
    }
  };

  ensureVisible();
  requestAnimationFrame(ensureVisible);
  window.setTimeout(ensureVisible, 250);
  window.setTimeout(ensureVisible, 1000);
})();
