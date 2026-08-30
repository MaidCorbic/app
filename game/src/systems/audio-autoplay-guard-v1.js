// Browser audio hardening: Web Audio must not be constructed or resumed before a user gesture.
(() => {
  'use strict';
  if (window.__relayAudioAutoplayGuardV2) return;
  window.__relayAudioAutoplayGuardV2 = true;

  const nativeAudioContext = window.AudioContext;
  const nativeWebkitAudioContext = window.webkitAudioContext;
  const constructors = [nativeAudioContext, nativeWebkitAudioContext].filter(Boolean);
  if (!constructors.length) return;

  const contexts = new Set();
  const nativeResume = new WeakMap();
  let unlocked = false;
  let restored = false;

  constructors.forEach(Context => {
    const proto = Context.prototype;
    const originalResume = proto?.resume;
    if (typeof originalResume !== 'function') return;
    nativeResume.set(proto, originalResume);
    proto.resume = function guardedResume(...args) {
      contexts.add(this);
      if (!unlocked) return Promise.resolve(this);
      try {
        return Promise.resolve(originalResume.apply(this, args)).catch(() => this);
      } catch {
        return Promise.resolve(this);
      }
    };
  });

  const restoreConstructors = () => {
    if (restored) return;
    restored = true;
    try { window.AudioContext = nativeAudioContext; } catch {}
    try { window.webkitAudioContext = nativeWebkitAudioContext; } catch {}
  };

  const unlock = () => {
    if (!unlocked) {
      unlocked = true;
      window.__relayAudioGestureUnlocked = true;
      restoreConstructors();
    }

    for (const context of contexts) {
      try {
        const proto = Object.getPrototypeOf(context);
        const resume = nativeResume.get(proto);
        if (typeof resume === 'function' && context.state !== 'running') {
          Promise.resolve(resume.call(context)).catch(() => {});
        }
      } catch {}
    }
  };

  // Prevent application code loaded during initial page boot from calling
  // `new AudioContext()` before Chrome/Safari has a trusted gesture.
  try { window.AudioContext = undefined; } catch {}
  try { window.webkitAudioContext = undefined; } catch {}

  const gestureOptions = { capture: true, passive: true };
  document.addEventListener('pointerdown', unlock, gestureOptions);
  document.addEventListener('touchstart', unlock, gestureOptions);
  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.code === 'Space' || event.key === 'Shift') unlock();
  }, gestureOptions);

  window.relayAudioAutoplayGuard = Object.freeze({
    unlock,
    isUnlocked: () => unlocked,
  });
})();
