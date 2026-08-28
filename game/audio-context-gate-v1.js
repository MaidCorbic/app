(() => {
  'use strict';
  if (window.__relayAudioContextGateV1) return;
  window.__relayAudioContextGateV1 = true;

  const Original = window.AudioContext || window.webkitAudioContext;
  if (!Original) return;

  let activated = !!window.navigator?.userActivation?.hasBeenActive;
  const contexts = new Set();

  const Gated = new Proxy(Original, {
    construct(Target, args, NewTarget) {
      const context = Reflect.construct(Target, args, NewTarget);
      contexts.add(context);
      const resume = context.resume.bind(context);
      let pending = false;
      context.resume = () => {
        if (!activated) {
          pending = true;
          return Promise.resolve();
        }
        return resume().catch(() => undefined);
      };
      context.__relayFlushAudio = () => {
        if (!pending) return;
        pending = false;
        resume().catch(() => undefined);
      };
      return context;
    },
  });

  try { window.AudioContext = Gated; } catch {}
  if (window.webkitAudioContext === Original) {
    try { window.webkitAudioContext = Gated; } catch {}
  }

  const activate = () => {
    activated = true;
    contexts.forEach(context => context.__relayFlushAudio?.());
  };
  ['pointerdown', 'touchstart', 'keydown'].forEach(type => {
    window.addEventListener(type, activate, { once: true, capture: true, passive: true });
  });
})();
