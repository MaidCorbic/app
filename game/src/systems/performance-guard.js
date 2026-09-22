// Safe visual-performance hint for web/itch builds.
// Gameplay systems may read window.relayPerformance without changing mechanics.
const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const coarse = window.matchMedia?.('(pointer: coarse)').matches || Number(navigator.maxTouchPoints || 0) > 0;
const lowPower = Number(navigator.hardwareConcurrency || 8) <= 4;

const tier = lowPower ? 'low' : coarse ? 'touch' : 'standard';

window.relayPerformance = {
  reduceMotion,
  coarse,
  lowPower,
  tier,
  maxParticles: lowPower ? 24 : coarse ? 36 : 60,
  effectScale: lowPower ? 0.65 : coarse ? 0.82 : 1,
};
