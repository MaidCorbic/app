/* Gameplay Audio Start Fix V2
 * Bridges the existing adaptive procedural music to the actual Play/Continue gesture.
 * Respects the persisted mute/music-volume preferences.
 */
(() => {
  'use strict';
  if (window.__relayGameplayAudioStartV2) return;
  window.__relayGameplayAudioStartV2 = true;

  const readState = () => {
    try {
      const value = JSON.parse(localStorage.getItem('relay-runner-state') || 'null');
      return value && typeof value === 'object' ? value : {};
    } catch { return {}; }
  };

  const start = () => {
    try {
      const state = readState();
      if (state.muted === true) {
        window.relayAdaptiveMusic?.setEnabled?.(false);
        return;
      }
      const musicVolume = Number.isFinite(Number(state.musicVolume)) ? Number(state.musicVolume) : 0.55;
      window.relayAdaptiveMusic?.setEnabled?.(true);
      window.relayAdaptiveMusic?.setVolume?.(musicVolume);
      const unlock = window.relayAdaptiveMusic?.unlock || window.relayAdaptiveMusic?.start;
      if (typeof unlock === 'function') {
        Promise.resolve(unlock.call(window.relayAdaptiveMusic)).then(() => {
          try { window.relayAdaptiveMusic?.start?.(); } catch {}
        });
      }
    } catch {}
  };

  const isPlayGesture = event => {
    const target = event.target;
    if (!(target instanceof Element)) return false;
    return !!target.closest('#start,#continue,[data-play],[data-action="play"],[data-action="continue"]');
  };

  document.addEventListener('pointerdown', event => {
    if (isPlayGesture(event)) start();
  }, { capture:true, passive:true });

  document.addEventListener('click', event => {
    if (isPlayGesture(event)) start();
  }, { capture:true, passive:true });

  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.code === 'Space') start();
  }, { capture:true, passive:true });

  window.relayGameplayAudioStartV2 = { start };
})();
