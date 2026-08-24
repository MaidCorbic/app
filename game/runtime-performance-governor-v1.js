// Runtime performance governor.
// Keeps gameplay behavior authoritative in RunnerScene while reducing the cost of
// non-critical AI/presentation scans. No physics, input, mission state, or scoring changes.
import { RunnerScene } from './src/scenes/RunnerScene.js';

(() => {
  if (window.__relayRuntimePerformanceGovernorV1) return;
  window.__relayRuntimePerformanceGovernorV1 = true;

  const throttle = (key, intervalMs, methodName) => {
    const original = RunnerScene.prototype[methodName];
    if (typeof original !== 'function' || original.__relayPerfWrappedV1) return;

    const wrapped = function perfThrottled(delta, ...rest) {
      const state = this.__relayPerfGovernorV1 ||= Object.create(null);
      const now = Number(this.elapsedMs) || 0;
      const previous = Number(state[key]) || now;
      state[`${key}Delta`] = (Number(state[`${key}Delta`]) || 0) + (Number(delta) || 0);
      if (now - previous < intervalMs) return;
      state[key] = now;
      const accumulatedDelta = state[`${key}Delta`];
      state[`${key}Delta`] = 0;
      return original.call(this, accumulatedDelta, ...rest);
    };

    Object.defineProperty(wrapped, '__relayPerfWrappedV1', { value: true });
    RunnerScene.prototype[methodName] = wrapped;
  };

  // Threat decisions involve several full enemy-group scans per frame.
  // 30 Hz reduces repeated scans while the accumulated delta preserves timing.
  throttle('threatsAt', 33, 'updateSciFiThreats');

  // Turret target acquisition performs filter+sort work; firing cadence remains governed by
  // the existing 700ms cooldown, while accumulated delta keeps time-based behavior unchanged.
  throttle('buildsAt', 50, 'updateBuilds');

  // Chaser section lookup is non-physics guidance. Keep it responsive at 30 Hz and preserve distance timing.
  throttle('chaserAt', 33, 'updateChaser');
})();
