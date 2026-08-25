// Runtime media policy: prevent autoplay AudioContext warnings until a real user gesture.
(() => {
  if (window.__relayRuntimeMediaPolicyV1) return;
  window.__relayRuntimeMediaPolicyV1 = true;
  const contexts = new Set();
  let unlocked = false;
  const NativeAudioContext = window.AudioContext || window.webkitAudioContext;
  if (NativeAudioContext?.prototype) {
    const nativeResume = NativeAudioContext.prototype.resume;
    NativeAudioContext.prototype.resume = function guardedResume(...args) {
      contexts.add(this);
      if (!unlocked) return Promise.resolve();
      return nativeResume.apply(this, args);
    };
    const NativeCtor = NativeAudioContext;
    const remember = new MutationObserver(() => {}); // keep policy allocation inert; contexts are remembered on resume.
    remember.disconnect();
    window.__relayAudioUnlock = () => {
      if (unlocked) return;
      unlocked = true;
      contexts.forEach(context => { try { nativeResume.call(context); } catch {} });
      window.dispatchEvent(new Event('relay:audio-unlocked'));
    };
  }
  const unlock = () => window.__relayAudioUnlock?.();
  ['pointerdown','touchstart','keydown','click'].forEach(type => window.addEventListener(type, unlock, { once:true, passive:type!=='keydown' }));

  // Avoid browser favicon 404s when a deployment does not provide /favicon.ico.
  if (!document.querySelector('link[rel="icon"]')) {
    const icon = document.createElement('link'); icon.rel='icon'; icon.type='image/svg+xml';
    icon.href='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22%3E%3Crect width=%2264%22 height=%2264%22 rx=%2214%22 fill=%22%23020a14%22/%3E%3Cpath d=%22M16 13h17c10 0 17 6 17 15s-7 15-17 15H24v8h-8V13zm8 8v14h8c5 0 10-3 10-7s-5-7-10-7h-8z%22 fill=%22%2319c8f5%22/%3E%3C/svg%3E';
    document.head.appendChild(icon);
  }
})();
