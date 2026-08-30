import { RunnerScene } from './src/scenes/RunnerScene.js';

/* Final presentation-only cleanup. Gameplay state, progression and ability logic stay authoritative elsewhere. */
(() => {
  'use strict';
  if (window.__relayPresentationFinalV3) return;
  window.__relayPresentationFinalV3 = true;

  const viewport = scene => ({
    w: Number(scene?.scale?.gameSize?.width || scene?.scale?.width || window.innerWidth || 1280),
    h: Number(scene?.scale?.gameSize?.height || scene?.scale?.height || window.innerHeight || 720),
  });

  const isLegacyHudText = text => {
    const value = String(text || '').trim().toUpperCase();
    return /^(BODY SWAP|SWAP BODY|HOST BODY)(?:\s*[·•-]\s*B)?$/.test(value)
      || value.startsWith('BODY SWAP ·')
      || value === 'MISSION INTELLIGENCE'
      || value === 'READY'
      || value === 'AFTERNOON'
      || /^\d{1,2}:\d{2}\s*[·•-]\s*CYCLE/i.test(value)
      || /^MIDDAY CLEAR$/i.test(value)
      || /^FLOW\s+\d{1,3}%/.test(value)
      || /^CARGO INTEGRITY$/.test(value)
      || /^STATIC CARGO$/.test(value)
      || /^DELIVERY BEACON$/.test(value);
  };

  const hideLegacyGameplayHud = scene => {
    const objectiveState = scene?.__missionObjectiveState;
    const keep = new Set(objectiveState?.c?.list || []);
    const list = scene?.children?.list || [];
    for (const child of list) {
      if (!child || typeof child.text !== 'string') continue;
      if (keep.has(child)) continue;
      const fixed = child.scrollFactorX === 0 && child.scrollFactorY === 0;
      const bounds = child.getBounds?.();
      if (!fixed || !bounds || !isLegacyHudText(child.text)) continue;
      child.setVisible(false);
      child.setAlpha?.(0);
      child.disableInteractive?.();
    }

    const bodySwap = scene?.__relayGameplayExpansionV3Safe?.entities?.bodySwap;
    bodySwap?.badge?.setVisible?.(false);
    bodySwap?.badge?.setAlpha?.(0);
    bodySwap?.badge?.disableInteractive?.();
    bodySwap?.badge?.setText?.('');
  };

  const styleObjective = state => {
    if (!state) return;
    state.bg?.setStrokeStyle?.(1, 0xffd06e, 0.68);
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
    const targetW = mobile ? Math.min(270, Math.max(214, w - 22)) : Math.min(286, Math.max(260, w * 0.26));
    const scale = targetW / baseW;
    const x = Math.max(8, (w - targetW) / 2);
    const y = mobile ? Math.max(82, Math.min(112, h * .14)) : Math.max(92, Math.min(128, h * .14));
    state.c.setPosition(x, y).setScale(scale);
    state.c.setDepth?.(90);
    styleObjective(state);
    scene.__relayFinalObjectiveLayout = `${Math.round(w)}x${Math.round(h)}:${mobile}:${Math.round(targetW)}`;
  };

  const bindScene = scene => {
    if (!scene || scene.__relayPresentationFinalV3Bound) return;
    scene.__relayPresentationFinalV3Bound = true;
    layoutObjective(scene);
    hideLegacyGameplayHud(scene);
    scene.events?.on?.('postupdate', () => {
      if (!scene.sys?.isActive?.()) return;
      layoutObjective(scene);
      hideLegacyGameplayHud(scene);
    });
    scene.events?.once?.('shutdown', () => { scene.__relayPresentationFinalV3Bound = false; });
  };

  const originalCreate = RunnerScene.prototype.create;
  RunnerScene.prototype.create = function finalPresentationCreate(...args) {
    const result = originalCreate.apply(this, args);
    try { bindScene(this); } catch (error) { console.warn('[Relay Presentation] create cleanup skipped', error); }
    return result;
  };
})();
