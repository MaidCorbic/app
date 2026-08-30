import { RunnerScene } from '../scenes/RunnerScene.js';

(() => {
  'use strict';
  const NS = '__relayBodySwapPresentationV1';
  if (RunnerScene.prototype[NS]) return;
  RunnerScene.prototype[NS] = true;

  const hideLegacyBodySwapUi = scene => {
    for (const child of scene.children?.list || []) {
      const text = String(child?.text || '').toUpperCase();
      if (!text.includes('BODY SWAP') && !text.includes('SWAP BODY')) continue;
      if (!scene.__relayBodySwapAction && typeof child.listeners === 'function') {
        const listeners = child.listeners('pointerdown');
        const action = listeners?.[0];
        if (typeof action === 'function') scene.__relayBodySwapAction = () => action.call(child);
      }
      try { child.disableInteractive?.(); } catch {}
      try { child.setVisible(false); } catch {}
      try { child.setAlpha(0); } catch {}
    }
    if (typeof scene.__relayBodySwapAction === 'function') window.__relayBodySwapAction = scene.__relayBodySwapAction;
  };

  const originalCreate = RunnerScene.prototype.create;
  const originalShutdown = RunnerScene.prototype.shutdown;

  RunnerScene.prototype.create = function bodySwapPresentationCreate(...args) {
    const result = originalCreate.apply(this, args);
    window.setTimeout(() => hideLegacyBodySwapUi(this), 0);
    return result;
  };

  RunnerScene.prototype.shutdown = function bodySwapPresentationShutdown(...args) {
    if (window.__relayBodySwapAction === this.__relayBodySwapAction) {
      try { delete window.__relayBodySwapAction; } catch {}
    }
    return typeof originalShutdown === 'function' ? originalShutdown.apply(this, args) : undefined;
  };
})();
