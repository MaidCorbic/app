/* Gameplay Audio Start Fix V3
 * Bridges the existing adaptive procedural music to real Play/Continue gestures
 * and late-loading RunnerScene readiness. No external audio assets are required.
 */
(() => {
  'use strict';
  if (window.__relayGameplayAudioStartV3) return;
  window.__relayGameplayAudioStartV3 = true;

  const readState = () => {
    try {
      const value = JSON.parse(localStorage.getItem('relay-runner-state') || 'null');
      return value && typeof value === 'object' ? value : {};
    } catch { return {}; }
  };

  const apply = () => {
    const music = window.relayAdaptiveMusic;
    if (!music) return false;
    try {
      const state = readState();
      if (state.muted === true) {
        music.setEnabled?.(false);
        return true;
      }
      const volume = Number.isFinite(Number(state.musicVolume)) ? Number(state.musicVolume) : 0.55;
      music.setEnabled?.(true);
      music.setVolume?.(volume);
      const unlock = music.unlock;
      if (typeof unlock === 'function') {
        Promise.resolve(unlock.call(music)).then(ok => {
          try {
            if (ok !== false && document.getElementById('intro')?.classList.contains('hidden')) music.start?.();
          } catch {}
        }).catch(() => {});
      } else if (document.getElementById('intro')?.classList.contains('hidden')) {
        music.start?.();
      }
      return true;
    } catch {
      return false;
    }
  };

  const start = () => {
    if (apply()) return;
    let tries = 0;
    const retry = () => {
      if (apply() || ++tries >= 20) return;
      window.setTimeout(retry, 150);
    };
    window.setTimeout(retry, 0);
  };

  const isPlayGesture = event => {
    const target = event.target;
    if (!(target instanceof Element)) return false;
    return !!target.closest('#start,#continue,[data-v3-play],[data-v3-continue],[data-final-home="options"],[data-action="play"],[data-action="continue"]');
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

  window.addEventListener('relay:runner-scene-ready', () => start(), { passive:true });
  window.setTimeout(() => {
    if (document.getElementById('intro')?.classList.contains('hidden')) start();
  }, 500);

  window.relayGameplayAudioStartV3 = { start };
})();
