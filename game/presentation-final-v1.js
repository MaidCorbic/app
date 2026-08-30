import { RunnerScene } from './src/scenes/RunnerScene.js';

/* Final presentation-only cleanup. Gameplay state, progression and ability logic stay authoritative elsewhere. */
(() => {
  'use strict';
  if (window.__relayPresentationFinalV2) return;
  window.__relayPresentationFinalV2 = true;

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
      || /^MIDDAY CLEAR$/i.test(value);
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
      const fixedTop = fixed && bounds && bounds.y < Math.max(170, (scene.scale?.height || window.innerHeight || 720) * .26);
      if (!fixedTop || !isLegacyHudText(child.text)) continue;
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
    /* Compact objective: below the top HUD, centered, with equal web/mobile hierarchy. */
    const targetW = mobile ? Math.min(270, Math.max(214, w - 22)) : Math.min(286, Math.max(260, w * 0.26));
    const scale = targetW / baseW;
    const actualH = 166 * scale;
    const x = Math.max(8, (w - targetW) / 2);
    const y = mobile ? Math.max(76, Math.min(98, h * .13)) : 92;
    const key = `${w}x${h}:${mobile}:${targetW}`;
    if (scene.__relayFinalObjectiveLayout === key) return;
    scene.__relayFinalObjectiveLayout = key;
    state.c.setPosition(x, y).setScale(scale);
    styleObjective(state);
  };

  const originalCreate = RunnerScene.prototype.create;
  RunnerScene.prototype.create = function finalPresentationCreate(...args) {
    const result = originalCreate.apply(this, args);
    try { hideLegacyGameplayHud(this); layoutObjective(this); } catch (error) { console.warn('[Relay Presentation] create cleanup skipped', error); }
    return result;
  };

  const originalUpdate = RunnerScene.prototype.update;
  RunnerScene.prototype.update = function finalPresentationUpdate(...args) {
    const result = originalUpdate.apply(this, args);
    try { hideLegacyGameplayHud(this); layoutObjective(this); } catch {}
    return result;
  };
})();
