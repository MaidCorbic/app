// UPDATE 12 — Mission Flow & Performance System V1
// Additive observer layer. It reads existing mission HUD/results state only.
// It does not own gameplay, progression, save state, controls, physics, or scene lifecycle.

import { missions } from './src/missions.js';

(() => {
  if (window.__missionFlowPerformanceV1) return;
  window.__missionFlowPerformanceV1 = true;

  const CONFIG = Object.freeze({
    weights: Object.freeze({ completion: 30, speed: 25, signals: 20, route: 15, survival: 10 }),
    recoveryPenalty: 15,
    damagePenalty: 8,
    minimumTimeMs: 1000,
  });

  const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));
  const parseNumber = value => {
    const number = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
    return Number.isFinite(number) ? number : 0;
  };
  const parseTime = value => {
    const match = String(value ?? '').trim().match(/^(\d+):(\d{2})\.(\d)$/);
    if (!match) return 0;
    return (Number(match[1]) * 60 + Number(match[2])) * 1000 + Number(match[3]) * 100;
  };
  const missionIndexFromDom = () => {
    const text = document.getElementById('missionNumber')?.textContent || '';
    const match = text.match(/MISSION\s+(\d+)/i);
    const index = match ? Number(match[1]) - 1 : -1;
    return index >= 0 && index < missions.length ? index : -1;
  };
  const readSignals = () => parseNumber(document.getElementById('signalCount')?.textContent);
  const readTotalSignals = () => parseNumber(document.getElementById('signalTotal')?.textContent);
  const readProgress = () => clamp(parseNumber(document.getElementById('progressValue')?.textContent));
  const readElapsed = () => parseTime(document.getElementById('runTime')?.textContent);
  const readHealth = () => {
    const match = String(document.getElementById('healthValue')?.textContent || '').match(/(\d+)\s*\/\s*(\d+)/);
    return match ? Number(match[1]) : null;
  };
  const readCheckpoint = () => {
    const text = document.getElementById('routeIntel')?.textContent || '';
    const match = text.match(/(\d+)\s*\/\s*(\d+)\s*CHECKPOINTS/i);
    return match ? { current: Number(match[1]), total: Number(match[2]) } : null;
  };

  const state = {
    active: false,
    settled: false,
    missionIndex: -1,
    runSequence: 0,
    startedAt: 0,
    lastElapsed: 0,
    lastHealth: null,
    damageTaken: 0,
    recoveries: 0,
    maxCheckpoint: 0,
    checkpointTotal: 0,
    observer: null,
    finishObserver: null,
  };

  function reset() {
    state.active = false;
    state.settled = false;
    state.missionIndex = -1;
    state.startedAt = 0;
    state.lastElapsed = 0;
    state.lastHealth = null;
    state.damageTaken = 0;
    state.recoveries = 0;
    state.maxCheckpoint = 0;
    state.checkpointTotal = 0;
  }

  function snapshot() {
    return {
      missionIndex: state.missionIndex,
      missionId: missions[state.missionIndex]?.id || null,
      runSequence: state.runSequence,
      elapsedMs: Math.max(0, state.lastElapsed),
      signals: readSignals(),
      totalSignals: readTotalSignals(),
      progress: readProgress(),
      runScore: parseNumber(document.getElementById('runScore')?.textContent),
      damageTaken: state.damageTaken,
      recoveries: state.recoveries,
      checkpoint: state.maxCheckpoint,
      checkpointTotal: state.checkpointTotal,
    };
  }

  function scoreRun({ completed, elapsedMs, signals, totalSignals, progress, damageTaken, recoveries, checkpoint, checkpointTotal }) {
    const mission = missions[state.missionIndex];
    if (!mission) return null;

    const completion = completed ? 100 : 0;
    const parTime = Math.max(CONFIG.minimumTimeMs, Number(mission.parTime) || 90000);
    const speed = completed ? clamp((parTime / Math.max(CONFIG.minimumTimeMs, elapsedMs)) * 100) : 0;
    const signalScore = totalSignals > 0 ? clamp((signals / totalSignals) * 100) : 100;
    const routeScore = checkpointTotal > 0
      ? clamp((checkpoint / checkpointTotal) * 100)
      : clamp(progress);
    const survival = clamp(100 - recoveries * CONFIG.recoveryPenalty - damageTaken * CONFIG.damagePenalty);

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
        progress,
        damageTaken,
        recoveries,
        checkpoint,
        checkpointTotal,
      },
    };
  }

  function publish(result) {
    if (!result || state.settled) return;
    state.settled = true;
    window.__missionFlowPerformanceV1.latest = result;
    window.dispatchEvent(new CustomEvent('relay:mission-performance-complete', { detail: result }));

    // Reuse the existing Results element. No new DOM structure is created.
    const scoreElement = document.getElementById('finishScore');
    if (scoreElement && result.completed) {
      const base = scoreElement.textContent.replace(/\s*·\s*PERFORMANCE\s+[A-Z+]+\s+\(\d+\)$/i, '');
      scoreElement.textContent = `${base} · PERFORMANCE ${result.rating} (${result.score})`;
    }
  }

  function updateLiveMetrics() {
    if (!state.active || state.settled) return;

    const elapsed = readElapsed();
    if (elapsed > 0) state.lastElapsed = elapsed;

    const health = readHealth();
    if (health !== null) {
      if (state.lastHealth !== null && health < state.lastHealth) {
        state.damageTaken += state.lastHealth - health;
      } else if (state.lastHealth !== null && health > state.lastHealth && state.lastHealth < 3) {
        state.recoveries += 1;
      }
      state.lastHealth = health;
    }

    const checkpoint = readCheckpoint();
    if (checkpoint) {
      state.maxCheckpoint = Math.max(state.maxCheckpoint, checkpoint.current);
      state.checkpointTotal = Math.max(state.checkpointTotal, checkpoint.total);
    }
  }

  function beginRun() {
    const missionIndex = missionIndexFromDom();
    if (missionIndex < 0) return;

    reset();
    state.active = true;
    state.missionIndex = missionIndex;
    state.runSequence += 1;
    state.startedAt = performance.now();
    state.lastElapsed = readElapsed();
    state.lastHealth = readHealth();
    const checkpoint = readCheckpoint();
    if (checkpoint) {
      state.maxCheckpoint = checkpoint.current;
      state.checkpointTotal = checkpoint.total;
    }

    window.__missionFlowPerformanceV1.current = snapshot;
  }

  function settle(completed) {
    if (!state.active || state.settled) return;
    updateLiveMetrics();
    const data = snapshot();
    const result = scoreRun({ completed, ...data });
    if (result) publish(result);
    if (!completed) {
      window.__missionFlowPerformanceV1.lastFailedRun = result;
    }
  }

  function inspectLifecycle() {
    const intro = document.getElementById('intro');
    const finish = document.getElementById('finish');
    const gameOver = document.getElementById('gameOver');
    const play = document.getElementById('play');

    const introHidden = Boolean(intro && intro.classList.contains('hidden'));
    const playVisible = Boolean(play && !play.classList.contains('hidden'));
    const runTime = readElapsed();

    if (!state.active && introHidden && playVisible && runTime <= 1000) beginRun();

    updateLiveMetrics();

    if (state.active && finish && !finish.classList.contains('hidden')) settle(true);
    else if (state.active && gameOver && !gameOver.classList.contains('hidden')) settle(false);
  }

  function install() {
    if (state.observer) return;
    const root = document.getElementById('game') || document.body;
    if (!root) return;

    state.observer = new MutationObserver(() => inspectLifecycle());
    state.observer.observe(root, { subtree: true, childList: false, attributes: true, attributeFilter: ['class'], characterData: true });

    // The existing game already updates runTime/progress/signal/health text from its event bus.
    // A lightweight observer reads those values without adding a second gameplay loop.
    const textTargets = ['runTime', 'signalCount', 'progressValue', 'healthValue', 'routeIntel', 'finish', 'gameOver', 'intro', 'play'];
    textTargets.forEach(id => {
      const element = document.getElementById(id);
      if (!element || element === root) return;
      const observer = new MutationObserver(inspectLifecycle);
      observer.observe(element, { subtree: true, childList: true, attributes: true, characterData: true });
    });

    inspectLifecycle();
  }

  window.__missionFlowPerformanceV1 = {
    version: '1.0',
    current: null,
    latest: null,
    lastFailedRun: null,
    reset,
    snapshot,
    scoreRun,
    inspect: inspectLifecycle,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
