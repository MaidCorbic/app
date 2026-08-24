/* GAMEPLAY MAX V2 — controlled additive mechanics
 * No RAF loop. Hooks into Phaser scene/game events only.
 * Adds optional Relay Caches, Signal Flow bursts, checkpoint recovery,
 * and a short Tower Approach overdrive. Existing movement/completion remain authoritative.
 */
(() => {
  'use strict';
  if (window.__relayGameplayMaxV2) return;
  window.__relayGameplayMaxV2 = true;

  const BASE_SPEED = 460;
  const FLOW_SPEED = 535;
  const FLOW_MS = 820;
  const TOWER_SPEED = 555;
  const TOWER_MS = 760;
  const CACHE_OFFSETS = [0.26, 0.66];
  const state = new WeakMap();
  const cue = (scene, text, color = '#ffd06e') => { try { scene.playerCue?.(text, color); } catch {} };

  const setSpeedBurst = (scene, speed, duration, reason) => {
    if (!scene?.player?.body) return;
    const data = state.get(scene); if (!data) return;
    const now = scene.time?.now || performance.now();
    data.speedUntil = Math.max(data.speedUntil || 0, now + duration);
    data.speedValue = Math.max(data.speedValue || BASE_SPEED, speed);
    data.speedReason = reason;
    scene.player.body.setMaxVelocity(data.speedValue, scene.player.body.maxVelocity?.y || 1120);
    scene.player.body.setVelocityX(Math.max(scene.player.body.velocity.x || 0, Math.min(data.speedValue, speed)));
    scene.boosterTimer = Math.max(scene.boosterTimer || 0, duration);
  };

  const restoreSpeed = scene => {
    const data = state.get(scene); if (!data || !scene?.player?.body) return;
    scene.player.body.setMaxVelocity(data.baseSpeed, scene.player.body.maxVelocity?.y || 1120);
    data.speedUntil = 0; data.speedValue = data.baseSpeed;
  };

  const createCache = (scene, x, y, index) => {
    if (!scene.physics?.add?.staticImage || !scene.player) return null;
    const cache = scene.physics.add.staticImage(x, y, 'signal').setScale(.66).setTint(0x8df4ff).setDepth(9);
    cache.setData('gameplayMaxCache', true).setData('cacheIndex', index);
    cache.body.setCircle(17, 11, 11);
    if (!scene.motionReduced) scene.tweens.add({ targets: cache, y: y - 8, angle: 360, alpha: { from: .72, to: 1 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    scene.physics.add.overlap(scene.player, cache, () => {
      if (!cache.active) return;
      cache.disableBody(true, true);
      const data = state.get(scene); if (!data) return;
      data.caches += 1; data.bonusScore += 125;
      scene.energy = Math.min(scene.energyMax ?? scene.energy, (scene.energy || 0) + 12);
      scene.health = Math.min(3, (scene.health || 0) + 1);
      setSpeedBurst(scene, FLOW_SPEED, FLOW_MS, 'cache');
      cue(scene, `RELAY CACHE ${data.caches}/2 · FLOW CHARGE`, '#8df4ff');
      scene.game?.events?.emit('feedback', 'gadget');
      scene.game?.events?.emit('relay:gameplay-max-cache', { missionId: scene.mission?.id, index, count: data.caches });
    }, undefined, scene);
    return cache;
  };

  const attach = scene => {
    if (!scene || scene.__gameplayMaxV2Attached || !scene.player || !scene.mission) return;
    scene.__gameplayMaxV2Attached = true;
    const data = { baseSpeed: scene.player.body?.maxVelocity?.x || BASE_SPEED, speedUntil: 0, speedValue: BASE_SPEED, speedReason: '', signalCount: 0, signalWindow: 0, caches: 0, bonusScore: 0, towerTriggered: false, checkpointCount: 0 };
    state.set(scene, data); scene.maxGameplay = data;

    const signals = Array.isArray(scene.mission.signals) ? scene.mission.signals : [];
    CACHE_OFFSETS.forEach((ratio, index) => {
      if (signals.length < 4) return;
      const signal = signals[Math.min(signals.length - 1, Math.max(1, Math.floor(signals.length * ratio)))];
      if (signal) createCache(scene, signal[0], signal[1] - 46, index);
    });

    const gameEvents = scene.game?.events;
    if (gameEvents) {
      const onSignal = () => {
        const now = scene.time?.now || performance.now();
        if (now - data.signalWindow > 1850) data.signalCount = 0;
        data.signalWindow = now; data.signalCount += 1;
        if (data.signalCount >= 3) { data.signalCount = 0; data.bonusScore += 50; setSpeedBurst(scene, FLOW_SPEED, FLOW_MS, 'signal-flow'); cue(scene, 'FLOW CHAIN · SPEED CHARGE', '#ffd06e'); }
      };
      const onCheckpoint = () => { data.checkpointCount += 1; scene.energy = Math.min(scene.energyMax ?? scene.energy, (scene.energy || 0) + 8); cue(scene, 'CHECKPOINT SECURED · +8 ENERGY', '#aee37f'); };
      gameEvents.on('signal', onSignal); gameEvents.on('checkpoint', onCheckpoint);
      scene.events.once('shutdown', () => { gameEvents.off('signal', onSignal); gameEvents.off('checkpoint', onCheckpoint); });
    }

    const onUpdate = () => {
      if (!scene.player?.active || scene.finished) return;
      const now = scene.time?.now || performance.now();
      if (data.speedUntil && now >= data.speedUntil) restoreSpeed(scene);
      else if (data.speedUntil) scene.player.body.setMaxVelocity(data.speedValue, scene.player.body.maxVelocity?.y || 1120);
      if (!data.towerTriggered && scene.goal && scene.goal.active !== false) {
        const distance = scene.goal.x - scene.player.x;
        const routeLength = Math.max(1, scene.goal.x - (scene.mission.spawn?.x || 0));
        if (distance > 0 && distance / routeLength < .12) {
          data.towerTriggered = true; data.bonusScore += 75;
          setSpeedBurst(scene, TOWER_SPEED, TOWER_MS, 'tower-approach');
          cue(scene, 'RELAY TOWER APPROACH · OVERDRIVE', '#ffd06e');
          scene.game?.events?.emit('relay:gameplay-max-tower-approach', { missionId: scene.mission.id });
        }
      }
    };
    scene.events.on('update', onUpdate);
    scene.events.once('shutdown', () => scene.events.off('update', onUpdate));
  };

  const findScene = () => { const scene = window.__relayRunnerScene; if (scene?.player && scene?.mission) attach(scene); };
  window.addEventListener('relay:gameplay-core-ready', findScene, { passive: true });
  window.addEventListener('relay:mission-complete', event => {
    const scene = event.detail?.scene || window.__relayRunnerScene; const data = scene && state.get(scene); if (!data) return;
    scene.maxGameplayBonus = data.bonusScore;
    window.dispatchEvent(new CustomEvent('relay:gameplay-max-complete', { detail: { missionId: scene.mission?.id, bonusScore: data.bonusScore, caches: data.caches, checkpoints: data.checkpointCount } }));
  }, { passive: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', findScene, { once: true }); else queueMicrotask(findScene);
})();
