import { RunnerScene } from '../scenes/RunnerScene.js';

// UPDATE 15 — Adaptive Mission Modifiers V1
// Additive only: never replaces or mutates player creation/physics configuration.
export const MISSION_MODIFIERS = Object.freeze({
  'first-delivery': { id: 'low-gravity', title: 'LOW GRAVITY', subtitle: 'VERTICAL ASSIST ACTIVE', tuning: { jumpVelocity: -775, fallGravity: 500, maxFallSpeed: 860 } },
  'dead-drop': { id: 'security-alert', title: 'SECURITY ALERT', subtitle: 'THREAT RESPONSE ELEVATED', enemySpeedMultiplier: 1.16 },
  blackout: { id: 'dark-sector', title: 'DARK SECTOR', subtitle: 'VISIBILITY REDUCED', darkness: 0.34 },
  pursuit: { id: 'overclock', title: 'OVERCLOCK', subtitle: 'MOBILITY SYSTEM BOOSTED', tuning: { maxRunSpeed: 520, groundAcceleration: 4700, airAcceleration: 2700, dashSpeed: 745 } },
  'signal-storm': { id: 'signal-interference', title: 'SIGNAL INTERFERENCE', subtitle: 'NETWORK INSTABILITY DETECTED', signalPulse: true },
  'corporate-lockdown': { id: 'security-alert-plus', title: 'SECURITY ALERT+', subtitle: 'MAXIMUM SECURITY RESPONSE', enemySpeedMultiplier: 1.28 },
  'final-relay': { id: 'kinetic-instability', title: 'KINETIC INSTABILITY', subtitle: 'BOOST SYSTEM VOLATILE', kineticMultiplier: 1.18 },
});

const BASE_TUNING = Object.freeze({ maxRunSpeed: 460, groundAcceleration: 4200, airAcceleration: 2350, turnAcceleration: 5600, groundDeceleration: 3300, jumpVelocity: -705, jumpCutMultiplier: .48, coyoteMs: 115, jumpBufferMs: 120, fallGravity: 720, maxFallSpeed: 1120, dashSpeed: 670, dashDurationMs: 145, dashCooldownMs: 620 });
const states = new WeakMap();

export function getMissionModifier(id) { return MISSION_MODIFIERS[id] || null; }

function resolveMissionId(scene) {
  const sources = [scene?.sys?.settings?.data?.missionId, scene?.sys?.settings?.data?.mission, scene?.registry?.get?.('missionId'), scene?.mission?.id, document.documentElement?.dataset?.missionId, document.body?.dataset?.missionId];
  return sources.find(value => typeof value === 'string') || null;
}

export function applyMissionModifier(scene, id = resolveMissionId(scene)) {
  clearMissionModifier(scene);
  const modifier = getMissionModifier(id);
  scene.missionTuning = { ...BASE_TUNING, ...(modifier?.tuning || {}) };
  if (!modifier) return null;

  const state = { modifier, overlay: null, darkness: null, signalTweens: [], boostedAt: 0, lowGravityLifted: false };
  states.set(scene, state);
  scene.__missionModifier = modifier;
  scene.__missionModifierState = state;

  if (modifier.darkness && scene.add && scene.scale) {
    state.darkness = scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, 0x050914, modifier.darkness)
      .setOrigin(0).setScrollFactor(0).setDepth(9000);
  }

  showModifierBanner(scene, modifier, state);
  return modifier;
}

export function clearMissionModifier(scene) {
  const state = states.get(scene) || scene.__missionModifierState;
  state?.signalTweens?.forEach(tween => tween?.stop?.());
  state?.darkness?.destroy?.();
  state?.overlay?.destroy?.();
  scene.missionTuning = { ...BASE_TUNING };
  scene.__missionModifier = null;
  scene.__missionModifierState = null;
  states.delete(scene);
}

export function pulseMissionSignals(scene) {
  const state = states.get(scene);
  if (!state?.modifier?.signalPulse) return;
  (scene.children?.list || []).filter(node => node?.active && node.texture?.key === 'signal').forEach(signal => {
    const tween = scene.tweens.add({ targets: signal, alpha: { from: .42, to: 1 }, scale: { from: .92, to: 1.12 }, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    state.signalTweens.push(tween);
  });
}

function getEnemies(scene) {
  for (const group of [scene.enemies, scene.hostiles, scene.enemyGroup]) {
    const children = group?.getChildren?.() || (Array.isArray(group) ? group : null);
    if (children?.length) return children.filter(enemy => enemy?.active && enemy.body?.enable !== false);
  }
  return [];
}

function updateModifier(scene) {
  const state = states.get(scene);
  const modifier = state?.modifier;
  const body = scene.player?.body;
  if (!modifier || !body) return;

  // LOW GRAVITY is additive and only touches active airborne velocity.
  // No setGravityY/setMaxVelocity calls: player physics setup remains owned by RunnerScene.
  if (modifier.id === 'low-gravity') {
    if (body.blocked?.down || body.touching?.down) state.lowGravityLifted = false;
    if (!state.lowGravityLifted && body.velocity?.y < -500) {
      body.velocity.y = Math.min(body.velocity.y, modifier.tuning.jumpVelocity);
      state.lowGravityLifted = true;
    }
  }

  if (modifier.id === 'overclock' && body.velocity) {
    const vx = body.velocity.x || 0;
    if (Math.abs(vx) > BASE_TUNING.maxRunSpeed - 1) body.velocity.x = Math.sign(vx) * Math.min(Math.abs(vx) * 1.02, modifier.tuning.maxRunSpeed);
  }

  if (modifier.enemySpeedMultiplier) {
    getEnemies(scene).forEach(enemy => {
      const velocity = enemy.body?.velocity;
      if (velocity && Math.abs(velocity.x) > .1) velocity.x = Math.sign(velocity.x) * Math.min(Math.abs(velocity.x) * modifier.enemySpeedMultiplier, 900);
    });
  }

  if (modifier.kineticMultiplier && body.velocity) {
    const now = performance.now();
    if (now - state.boostedAt > 420 && Math.abs(body.velocity.x || 0) > 610) {
      body.velocity.x = Math.sign(body.velocity.x) * Math.min(Math.abs(body.velocity.x) * modifier.kineticMultiplier, 920);
      state.boostedAt = now;
    }
  }
}

function showModifierBanner(scene, modifier, state) {
  if (!scene.add || !scene.scale) return;
  const container = scene.add.container(scene.scale.width / 2, 90).setScrollFactor(0).setDepth(9100).setAlpha(0);
  const panel = scene.add.rectangle(0, 0, 360, 72, 0x07111f, .94).setStrokeStyle(1, 0x38bdf8, .75);
  const title = scene.add.text(0, -13, modifier.title, { fontFamily: 'Arial, sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#e8f8ff' }).setOrigin(.5);
  const subtitle = scene.add.text(0, 15, modifier.subtitle, { fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#8ecae6', letterSpacing: 1.5 }).setOrigin(.5);
  container.add([panel, title, subtitle]);
  state.overlay = container;
  scene.tweens.add({ targets: container, alpha: 1, y: 105, duration: 220, ease: 'Quad.easeOut', yoyo: true, hold: 2100, onComplete: () => { container.destroy(); if (state.overlay === container) state.overlay = null; } });
}

const originalCreate = RunnerScene.prototype.create;
const originalUpdate = RunnerScene.prototype.update;
const originalShutdown = RunnerScene.prototype.shutdown;

if (!RunnerScene.prototype.__adaptiveMissionModifiersV1Patched) {
  RunnerScene.prototype.create = function adaptiveMissionModifiersCreate(...args) {
    const result = originalCreate.apply(this, args);
    try { applyMissionModifier(this); pulseMissionSignals(this); } catch (error) { console.error('[AdaptiveMissionModifiersV1] create failed', error); }
    return result;
  };

  RunnerScene.prototype.update = function adaptiveMissionModifiersUpdate(...args) {
    const result = originalUpdate.apply(this, args);
    try { updateModifier(this); } catch (error) { console.error('[AdaptiveMissionModifiersV1] update failed', error); }
    return result;
  };

  RunnerScene.prototype.shutdown = function adaptiveMissionModifiersShutdown(...args) {
    try { clearMissionModifier(this); } catch (error) { console.error('[AdaptiveMissionModifiersV1] shutdown failed', error); }
    return typeof originalShutdown === 'function' ? originalShutdown.apply(this, args) : undefined;
  };

  RunnerScene.prototype.__adaptiveMissionModifiersV1Patched = true;
}

export { BASE_TUNING };
