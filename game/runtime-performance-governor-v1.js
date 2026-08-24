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
      const previous = Number(state[key]);
      if (Number.isFinite(previous) && now - previous < intervalMs) return;
      state[key] = now;
      return original.call(this, delta, ...rest);
    };

    Object.defineProperty(wrapped, '__relayPerfWrappedV1', { value: true });
    RunnerScene.prototype[methodName] = wrapped;
  };

  // Threat decisions involve several full enemy-group scans per frame.
  // 30 Hz is sufficient for attack/target decisions while movement/physics stay 60 Hz.
  throttle('threatsAt', 33, 'updateSciFiThreats');

  // Turret target acquisition performs filter+sort work; firing cadence remains governed by
  // the existing 700ms cooldown, so a 50ms acquisition cadence does not change gameplay rules.
  throttle('buildsAt', 50, 'updateBuilds');

  // Chaser section lookup is presentation/AI guidance, not physics. Keep it responsive at 30 Hz.
  throttle('chaserAt', 33, 'updateChaser');
})();
