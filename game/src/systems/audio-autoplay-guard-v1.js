(() => {
  'use strict';
  if (window.__relayAudioAutoplayGuardV1) return;
  window.__relayAudioAutoplayGuardV1 = true;

  const constructors = [window.AudioContext, window.webkitAudioContext].filter(Boolean);
  if (!constructors.length) return;

  const contexts = new Set();
  let unlocked = false;
  const nativeResume = new WeakMap();

  const markGesture = () => {
    unlocked = true;
    window.__relayAudioGestureUnlocked = true;
    for (const ctx of contexts) {
      try {
        const original = nativeResume.get(Object.getPrototypeOf(ctx));
        if (typeof original === 'function' && ctx.state !== 'running') original.call(ctx).catch?.(() => {});
      } catch {}
    }
  };

  constructors.forEach(Context => {
    const proto = Context.prototype;
    const originalResume = proto?.resume;
    if (typeof originalResume !== 'function') return;
    nativeResume.set(proto, originalResume);
    proto.resume = function guardedResume(...args) {
      contexts.add(this);
      if (!unlocked) return Promise.resolve(this);
      try { return originalResume.apply(this, args); } catch { return Promise.resolve(this); }
    };
  });

  const gestureOptions = { capture: true, passive: true };
  document.addEventListener('pointerdown', markGesture, gestureOptions);
  document.addEventListener('touchstart', markGesture, gestureOptions);
  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.code === 'Space' || event.key === 'Shift') markGesture();
  }, gestureOptions);

  window.relayAudioAutoplayGuard = { unlock: markGesture, isUnlocked: () => unlocked };
})();
