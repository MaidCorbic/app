/* GAMEPLAY MAX PACK V1
 * Controlled additive gameplay layer.
 * Uses existing Phaser/game events only: no RAF loop, no second save system,
 * no second mission-completion path, no Cargo dependency.
 */
(() => {
  'use strict';
  if (window.__relayGameplayMaxPackV1) return;
  window.__relayGameplayMaxPackV1 = true;

  const sceneState = new WeakMap();
  const safeCue = (scene, text, accent = '#ffd06e') => { try { scene.playerCue?.(text, accent); } catch {} };
  const safeShake = (scene, duration = 90, intensity = 0.003) => { try { scene.cameras?.main?.shake?.(duration, intensity); } catch {} };
  const emit = (name, detail = {}) => window.dispatchEvent(new CustomEvent(name, { detail }));

  const challenge = (scene, key, amount = 1) => {
    const data = sceneState.get(scene); if (!data) return;
    data.challenges[key] = (data.challenges[key] || 0) + amount;
    emit('relay:mastery-progress', { missionId: scene.mission?.id, key, value: data.challenges[key] });
  };

  const attach = scene => {
    if (!scene || scene.__relayGameplayMaxPackV1 || !scene.player || !scene.mission) return;
    scene.__relayGameplayMaxPackV1 = true;
    const data = {
      signals: 0,
      checkpoints: 0,
      cleanSignals: 0,
      encounters: 0,
      towerPressure: false,
      challenges: Object.create(null),
      modifier: null,
      startedAt: performance.now()
    };
    sceneState.set(scene, data);

    const events = scene.game?.events;
    if (!events) return;

    const onSignal = () => {
      data.signals += 1;
      data.cleanSignals += 1;
      challenge(scene, 'signals', 1);
      if (data.cleanSignals >= 5) {
        data.cleanSignals = 0;
        challenge(scene, 'flow', 1);
        safeCue(scene, 'FLOW MASTERED · +MOMENTUM', '#8df4ff');
        safeShake(scene, 80, 0.0025);
        emit('relay:mastery-reward', { missionId: scene.mission?.id, type: 'flow', amount: 1 });
      }
    };

    const onCheckpoint = () => {
      data.checkpoints += 1;
      challenge(scene, 'checkpoints', 1);
      data.cleanSignals = Math.min(data.cleanSignals + 1, 4);
      emit('relay:checkpoint-mastery', { missionId: scene.mission?.id, count: data.checkpoints });
    };

    const onFeedback = type => {
      if (type === 'hit' || type === 'damage') data.cleanSignals = 0;
      if (type === 'gadget' || type === 'jump') challenge(scene, 'movement', 1);
    };

    events.on('signal', onSignal);
    events.on('checkpoint', onCheckpoint);
    events.on('feedback', onFeedback);

    const cleanup = () => {
      events.off('signal', onSignal);
      events.off('checkpoint', onCheckpoint);
      events.off('feedback', onFeedback);
      sceneState.delete(scene);
    };
    scene.events?.once?.('shutdown', cleanup);
    scene.events?.once?.('destroy', cleanup);

    emit('relay:gameplay-max-pack-ready', { missionId: scene.mission.id });
  };

  window.addEventListener('relay:gameplay-core-ready', event => attach(event.detail?.scene || window.__relayRunnerScene), { passive: true });
  window.addEventListener('relay:runner-scene-ready', event => attach(event.detail?.scene || window.__relayRunnerScene), { passive: true });

  window.addEventListener('relay:gameplay-max-tower-approach', event => {
    const scene = event.detail?.scene || window.__relayRunnerScene;
    const data = scene && sceneState.get(scene);
    if (!scene || !data || data.towerPressure) return;
    data.towerPressure = true;
    challenge(scene, 'tower', 1);
    safeCue(scene, 'FINAL APPROACH · HOLD THE LINE', '#ffd06e');
    safeShake(scene, 120, 0.003);
    emit('relay:tower-pressure', { missionId: scene.mission?.id });
  }, { passive: true });

  window.addEventListener('relay:gameplay-max-complete', event => {
    const scene = event.detail?.scene || window.__relayRunnerScene;
    const data = scene && sceneState.get(scene);
    if (!scene || !data) return;
    const elapsed = Math.max(0, Math.round((performance.now() - data.startedAt) / 1000));
    const mastery = {
      signals: data.signals,
      checkpoints: data.checkpoints,
      encounters: data.encounters,
      tower: data.towerPressure,
      elapsed,
      challenges: { ...data.challenges }
    };
    emit('relay:mission-mastery-ready', { missionId: scene.mission?.id, mastery });
  }, { passive: true });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => attach(window.__relayRunnerScene), { once: true });
  else queueMicrotask(() => attach(window.__relayRunnerScene));
})();
