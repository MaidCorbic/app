import { RunnerScene } from './src/scenes/RunnerScene.js';

/* Final presentation-only cleanup. Gameplay state, progress and ability logic stay authoritative elsewhere. */
(() => {
  'use strict';
  if (window.__relayPresentationFinalV1) return;
  window.__relayPresentationFinalV1 = true;

  const viewport = scene => ({
    w: Number(scene?.scale?.gameSize?.width || scene?.scale?.width || window.innerWidth || 1280),
    h: Number(scene?.scale?.gameSize?.height || scene?.scale?.height || window.innerHeight || 720),
  });

  const hideLegacyBodySwapHud = scene => {
    const list = scene?.children?.list || [];
    for (const child of list) {
      if (child?.type !== 'Text' || typeof child.text !== 'string') continue;
      const text = child.text.trim().toUpperCase();
      if (/^(BODY SWAP|SWAP BODY|HOST BODY)(?:\s*[·•-]\s*B)?$/.test(text) || text.startsWith('BODY SWAP ·')) {
        child.setVisible(false);
        child.setAlpha?.(0);
        child.disableInteractive?.();
      }
    }
    const bodySwap = scene?.__relayGameplayExpansionV3Safe?.entities?.bodySwap;
    bodySwap?.badge?.setVisible?.(false);
  };

  const styleObjective = state => {
    if (!state) return;
    state.bg?.setStrokeStyle?.(1, 0xffd06e, 0.62);
    state.accent?.setFillStyle?.(0xffd06e, 0.92);
    state.track?.setFillStyle?.(0x17130b, 1);
    state.fill?.setFillStyle?.(0xffd06e, 1);
    state.kicker?.setColor?.('#ffd06e');
    state.label?.setColor?.('#a79772');
    state.progress?.setColor?.('#f4f7fa');
    state.status?.setColor?.('#c9a95f');
  };

  const layoutObjective = scene => {
    const state = scene?.__missionObjectiveState;
    if (!state?.c) return;
    const { w, h } = viewport(scene);
    const mobile = w <= 760;
    const baseW = 426;
    const targetW = mobile ? Math.min(258, Math.max(214, w - 24)) : Math.min(338, Math.max(300, w * 0.30));
    const scale = targetW / baseW;
    const actualH = 166 * scale;
    const x = Math.max(10, (w - targetW) / 2);
    const y = mobile ? Math.max(78, Math.min(94, h * 0.14)) : 96;
    const key = `${w}x${h}:${mobile}`;
    if (scene.__relayFinalObjectiveLayout === key) return;
    scene.__relayFinalObjectiveLayout = key;
    state.c.setPosition(x, y).setScale(scale);
    styleObjective(state);
  };

  const originalCreate = RunnerScene.prototype.create;
  RunnerScene.prototype.create = function finalPresentationCreate(...args) {
    const result = originalCreate.apply(this, args);
    try {
      hideLegacyBodySwapHud(this);
      layoutObjective(this);
    } catch (error) {
      console.warn('[Relay Presentation] create cleanup skipped', error);
    }
    return result;
  };

  const originalUpdate = RunnerScene.prototype.update;
  RunnerScene.prototype.update = function finalPresentationUpdate(...args) {
    const result = originalUpdate.apply(this, args);
    try {
      layoutObjective(this);
    } catch {}
    return result;
  };
})();
