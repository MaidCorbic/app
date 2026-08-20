// UPDATE 15 — Adaptive Mission Modifiers V1
// Centralized, scene-safe modifier lifecycle. Unknown missions remain unmodified.

export const MISSION_MODIFIERS = Object.freeze({
  'first-delivery': { id: 'low-gravity', title: 'LOW GRAVITY', subtitle: 'VERTICAL ASSIST ACTIVE', tuning: { jumpVelocity: -775, fallGravity: 500, maxFallSpeed: 860 } },
  'dead-drop': { id: 'security-alert', title: 'SECURITY ALERT', subtitle: 'THREAT RESPONSE ELEVATED', enemySpeedMultiplier: 1.16 },
  blackout: { id: 'dark-sector', title: 'DARK SECTOR', subtitle: 'VISIBILITY REDUCED', darkness: 0.34 },
  pursuit: { id: 'overclock', title: 'OVERCLOCK', subtitle: 'MOBILITY SYSTEM BOOSTED', tuning: { maxRunSpeed: 520, groundAcceleration: 4700, airAcceleration: 2700, dashSpeed: 745 } },
  'signal-storm': { id: 'signal-interference', title: 'SIGNAL INTERFERENCE', subtitle: 'NETWORK INSTABILITY DETECTED', signalPulse: true },
  'corporate-lockdown': { id: 'security-alert-plus', title: 'SECURITY ALERT+', subtitle: 'MAXIMUM SECURITY RESPONSE', enemySpeedMultiplier: 1.28 },
  'final-relay': { id: 'kinetic-instability', title: 'KINETIC INSTABILITY', subtitle: 'BOOST SYSTEM VOLATILE', kineticMultiplier: 1.18 },
});

const BASE_TUNING = Object.freeze({
  maxRunSpeed: 460, groundAcceleration: 4200, airAcceleration: 2350,
  turnAcceleration: 5600, groundDeceleration: 3300, jumpVelocity: -705,
  jumpCutMultiplier: .48, coyoteMs: 115, jumpBufferMs: 120,
  fallGravity: 720, maxFallSpeed: 1120, dashSpeed: 670,
  dashDurationMs: 145, dashCooldownMs: 620,
});

export function getMissionModifier(missionId) {
  return MISSION_MODIFIERS[missionId] || null;
}

export function applyMissionModifier(scene, missionId) {
  clearMissionModifier(scene);
  const modifier = getMissionModifier(missionId);
  if (!modifier) return null;

  scene.__missionModifierBaseTuning = { ...BASE_TUNING };
  scene.__missionModifier = modifier;
  scene.__missionModifierState = { active: true, overlay: null, signalTweens: [], darkness: null };

  // Store effective tuning on the scene. RunnerScene reads these values when present.
  scene.missionTuning = { ...BASE_TUNING, ...(modifier.tuning || {}) };

  if (modifier.darkness && scene.cameras?.main) {
    const overlay = scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, 0x050914, modifier.darkness)
      .setOrigin(0).setScrollFactor(0).setDepth(9000);
    scene.__missionModifierState.darkness = overlay;
    scene.scale?.on?.('resize', gameSize => overlay.setSize(gameSize.width, gameSize.height));
  }

  showModifierBanner(scene, modifier);
  return modifier;
}

export function clearMissionModifier(scene) {
  const state = scene.__missionModifierState;
  if (state) {
    state.signalTweens?.forEach(tween => tween?.stop?.());
    state.darkness?.destroy?.();
    state.overlay?.destroy?.();
  }
  scene.missionTuning = { ...BASE_TUNING };
  scene.__missionModifier = null;
  scene.__missionModifierState = null;
  scene.__missionModifierBaseTuning = null;
}

export function pulseMissionSignals(scene) {
  if (!scene.__missionModifier?.signalPulse || !scene.signals?.getChildren) return;
  const state = scene.__missionModifierState;
  scene.signals.getChildren().forEach(signal => {
    if (!signal?.active) return;
    const tween = scene.tweens.add({ targets: signal, alpha: { from: 0.45, to: 1 }, scale: { from: 0.92, to: 1.12 }, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    state?.signalTweens?.push(tween);
  });
}

function showModifierBanner(scene, modifier) {
  if (!scene.add || !scene.scale) return;
  const width = scene.scale.width;
  const container = scene.add.container(width / 2, 90).setScrollFactor(0).setDepth(9100).setAlpha(0);
  const panel = scene.add.rectangle(0, 0, 360, 72, 0x07111f, .94).setStrokeStyle(1, 0x38bdf8, .75);
  const title = scene.add.text(0, -13, modifier.title, { fontFamily: 'Arial, sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#e8f8ff' }).setOrigin(.5);
  const subtitle = scene.add.text(0, 15, modifier.subtitle, { fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#8ecae6', letterSpacing: 1.5 }).setOrigin(.5);
  container.add([panel, title, subtitle]);
  scene.__missionModifierState.overlay = container;
  scene.tweens.add({ targets: container, alpha: 1, y: 105, duration: 220, ease: 'Quad.easeOut', yoyo: true, hold: 2100, onComplete: () => { container.destroy(); if (scene.__missionModifierState) scene.__missionModifierState.overlay = null; } });
}

export { BASE_TUNING };
