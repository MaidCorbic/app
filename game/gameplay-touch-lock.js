/* Gameplay touch/selection lock — portrait stays available; landscape keeps full controls. */
(() => {
  'use strict';
  if (window.__relayGameplayTouchLockV1) return;
  window.__relayGameplayTouchLockV1 = true;

  const gameplay = () => document.getElementById('play');
  const isGameplayTarget = target => {
    const root = gameplay();
    return !!root && !!target && (target === root || root.contains(target));
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
