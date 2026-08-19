// UPDATE 12 — Mission Flow & Performance System V1
// Additive observer layer. It reads authoritative RunnerScene/event state only.
// It does not own gameplay, progression, save state, controls, physics, or scene lifecycle.

import { missions } from './src/missions.js';

(() => {
  if (window.__missionFlowPerformanceV1) return;

  const CONFIG = Object.freeze({
    weights: Object.freeze({ completion: 30, speed: 25, signals: 20, route: 15, survival: 10 }),
    deathPenalty: 25,
    fallPenalty: 10,
    collisionPenalty: 3,
    minimumTimeMs: 1000,
  });

  const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));
  const integer = value => Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;

  const state = {
    active: false,
    settled: false,
    missionId: null,
    missionIndex: -1,
    runSequence: 0,
    startedAt: 0,
    deaths: 0,
    checkpoints: 0,
    lastScene: null,
  };

  const getScene = () => window.__relayRunnerScene || state.lastScene || null;
  const getMission = () => {
    const scene = getScene();
    const missionId = state.missionId || scene?.mission?.id;
    return missions.find(item => item.id === missionId) || null;
  };

  function sceneStats(sceneOverride = null) {
    const scene = sceneOverride || getScene();
    const mission = scene?.mission || getMission();
    if (!scene || !mission?.id) return null;

    const signals = integer(scene.collected);
    const totalSignals = Array.isArray(mission.signals) ? mission.signals.length : 0;
    const elapsedMs = Math.max(0, Number(scene.elapsedMs) || 0);
    const falls = integer(scene.falls);
    const collisions = integer(scene.collisions);
    const enemyDefeats = integer(scene.enemyDefeats);
    const jumps = integer(scene.jumps);
    const secrets = integer(scene.secretsCollected);
    const checkpointTotal = Array.isArray(mission.checkpoints) ? mission.checkpoints.length : 0;

    return {
      missionId: mission.id,
      missionIndex: state.missionIndex >= 0 ? state.missionIndex : missions.findIndex(item => item.id === mission.id),
      runSequence: state.runSequence,
      elapsedMs,
      signals,
      totalSignals,
      checkpoints: Math.min(state.checkpoints, checkpointTotal || state.checkpoints),
      checkpointTotal,
      deaths: state.deaths,
      falls,
      collisions,
      enemyDefeats,
      jumps,
      secrets,
    };
  }

  function resetForScene(scene) {
    const mission = scene?.mission;
    if (!mission?.id) return false;

    state.active = true;
    state.settled = false;
    state.missionId = mission.id;
    state.missionIndex = missions.findIndex(item => item.id === mission.id);
    state.runSequence += 1;
    state.startedAt = performance.now();
    state.deaths = 0;
    state.checkpoints = 0;
    state.lastScene = scene;

    scene.events?.once?.('shutdown', () => {
      if (state.lastScene === scene && !state.settled) {
        state.active = false;
        state.lastScene = null;
      }
    });

    window.__missionFlowPerformanceV1.current = sceneStats;
    return true;
  }

  function scoreRun({ completed, elapsedMs, signals, totalSignals, checkpoints, checkpointTotal, deaths, falls, collisions }) {
    const mission = getMission();
    if (!mission) return null;

    const completion = completed ? 100 : 0;
    const parTime = Math.max(CONFIG.minimumTimeMs, Number(mission.parTime) || 90000);
    const speed = completed
      ? clamp((parTime / Math.max(CONFIG.minimumTimeMs, elapsedMs)) * 100)
      : 0;
    const signalScore = totalSignals > 0 ? clamp((signals / totalSignals) * 100) : 100;
    const routeScore = checkpointTotal > 0
      ? clamp((checkpoints / checkpointTotal) * 100)
      : completion;
    const survival = clamp(
      100 - deaths * CONFIG.deathPenalty - falls * CONFIG.fallPenalty - collisions * CONFIG.collisionPenalty
    );

    const weighted =
      completion * CONFIG.weights.completion / 100 +
      speed * CONFIG.weights.speed / 100 +
      signalScore * CONFIG.weights.signals / 100 +
      routeScore * CONFIG.weights.route / 100 +
      survival * CONFIG.weights.survival / 100;

    const score = Math.round(clamp(weighted));
    const rating = score >= 95 ? 'S+' : score >= 90 ? 'S' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'D';

    return {
      version: '1.0',
      missionId: mission.id,
      missionIndex: state.missionIndex,
      runSequence: state.runSequence,
      score,
      rating,
      completed,
      metrics: {
        completion,
        speed: Math.round(speed),
        signals: Math.round(signalScore),
        route: Math.round(routeScore),
        survival: Math.round(survival),
      },
      raw: {
        elapsedMs,
        parTime,
        signals,
        totalSignals,
        checkpoints,
        checkpointTotal,
        deaths,
        falls,
        collisions,
      },
    };
  }

  function publish(result) {
    if (!result || state.settled) return;
    state.settled = true;
    window.__missionFlowPerformanceV1.latest = result;
    window.dispatchEvent(new CustomEvent('relay:mission-performance-complete', { detail: result }));
  }

  function settle(completed, sceneOverride = null) {
    if (!state.active || state.settled) return;
    const data = sceneStats(sceneOverride);
    if (!data) return;

    const result = scoreRun({ completed, ...data });
    if (!result) return;

    publish(result);
    if (!completed) window.__missionFlowPerformanceV1.lastFailedRun = result;
  }

  function onSceneReady(event) {
    const scene = event?.detail?.scene || window.__relayRunnerScene;
    if (scene) resetForScene(scene);
  }

  function onDeath() {
    if (state.active && !state.settled) state.deaths += 1;
  }

  function onCheckpoint() {
    if (state.active && !state.settled) state.checkpoints += 1;
  }

  function onMissionComplete(event) {
    // The existing finish/recovery flow is authoritative. It supplies the exact
    // RunnerScene so Performance V1 cannot lose the state during scene handoff.
    const scene = event?.detail?.scene || window.__relayRunnerScene || state.lastScene;
    if (scene && (!state.active || state.missionId !== scene.mission?.id)) resetForScene(scene);
    settle(true, scene);
  }

  function listen(type, handler) {
    window.addEventListener(type, handler);
  }

  function install() {
    listen('relay:runner-scene-ready', onSceneReady);
    listen('relay:death', onDeath);
    listen('relay:checkpoint', onCheckpoint);
    listen('relay:mission-complete', onMissionComplete);

    if (window.__relayRunnerScene) resetForScene(window.__relayRunnerScene);
  }

  function reset() {
    state.active = false;
    state.settled = false;
    state.missionId = null;
    state.missionIndex = -1;
    state.startedAt = 0;
    state.deaths = 0;
    state.checkpoints = 0;
    state.lastScene = null;
    window.__missionFlowPerformanceV1.current = null;
  }

  window.__missionFlowPerformanceV1 = {
    version: '1.0',
    current: null,
    latest: null,
    lastFailedRun: null,
    reset,
    snapshot: sceneStats,
    scoreRun,
  };

  install();
})();
