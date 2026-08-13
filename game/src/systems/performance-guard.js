// Keeps the game responsive on weaker phones/PCs by limiting expensive visual effects
// when the browser reports constrained hardware or a reduced-motion preference.
const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const lowPower = Number(navigator.hardwareConcurrency || 8) <= 4;
window.relayPerformance = {
  reduceMotion,
  lowPower,
  maxParticles: lowPower ? 24 : 60,
  effectScale: lowPower ? 0.65 : 1,
};
