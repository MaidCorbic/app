// Browser audio hardening: never attempt to resume Web Audio before a real user gesture.
(() => {
  'use strict';

  if (window.__relayAudioGestureGateV1) return;
  window.__relayAudioGestureGateV1 = true;

  const constructors = [window.AudioContext, window.webkitAudioContext].filter(Boolean);
  if (!constructors.length) return;

  const contexts = new Set();
  let unlocked = false;

  const nativeResume = new WeakMap();
  constructors.forEach(Context => {
    const originalResume = Context.prototype?.resume;
    if (typeof originalResume !== 'function') return;
    nativeResume.set(Context.prototype, originalResume);

    Context.prototype.resume = function guardedResume(...args) {
      contexts.add(this);
      if (!unlocked) return Promise.resolve(this);
      try { return originalResume.apply(this, args); }
      catch { return Promise.resolve(this); }
    };
  });

  const resumeAll = () => {
    unlocked = true;
    window.__relayAudioGestureUnlocked = true;
    for (const context of contexts) {
      try {
        const proto = Object.getPrototypeOf(context);
        const resume = nativeResume.get(proto);
        if (typeof resume === 'function' && context.state !== 'running') resume.call(context).catch?.(() => {});
      } catch { /* browser-owned audio state */ }
    }
  };

  const unlock = () => resumeAll();
  document.addEventListener('pointerdown', unlock, { capture: true, passive: true });
  document.addEventListener('touchstart', unlock, { capture: true, passive: true });
  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.code === 'Space' || event.key === 'Shift') unlock();
  }, { capture: true, passive: true });

  window.relayAudioGestureGate = { unlock, isUnlocked: () => unlocked };
})();
