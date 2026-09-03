/* Gameplay touch/selection lock — portrait stays available; landscape keeps full controls. */
(() => {
  'use strict';
  if (window.__relayGameplayTouchLockV1) return;
  window.__relayGameplayTouchLockV1 = true;

  const gameplay = () => document.getElementById('play');
   const isGameplayTarget = target => {
    const root = gameplay();
    if (!root || !target || !root.contains(target)) return false;

    /*
     * Mobile bottom HUD + canonical pause menu remain interactive.
     * The touch/selection lock must never interfere with their buttons,
     * tabs, or overlays.
     */
    if (
      target.closest('#mobileBottomHud') ||
      target.closest('#mobilePauseButton') ||
      target.closest('#mobileSettingsButton') ||
      target.closest('#pauseMenu') ||
      target.closest('#pause') ||
      target.closest('[data-tab]')
    ) {
      return false;
    }

    return true;
  };

  ['copy', 'cut', 'dragstart', 'selectstart', 'contextmenu'].forEach(type => {
    document.addEventListener(type, event => {
      if (isGameplayTarget(event.target)) event.preventDefault();
    }, { passive: false });
  });

  document.addEventListener('gesturestart', event => {
    if (isGameplayTarget(event.target)) event.preventDefault();
  }, { passive: false });
  document.addEventListener('gesturechange', event => {
    if (isGameplayTarget(event.target)) event.preventDefault();
  }, { passive: false });
  document.addEventListener('gestureend', event => {
    if (isGameplayTarget(event.target)) event.preventDefault();
  }, { passive: false });
})();
