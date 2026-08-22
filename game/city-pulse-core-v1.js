export const CITY_PULSE_CONFIG = Object.freeze({
  version: '1.0.1',
  periodMs: 3600,
  warningMs: 650,
  openMs: 1050,
  flowWindowMs: 420,
  gateHalfWidth: 30,
  gatesPerMission: 3,
});

export const CITY_PULSE_MISSION_TARGET_X = Object.freeze({
  'first-delivery': 3570,
  'dead-drop': 3740,
  blackout: 3830,
  pursuit: 3790,
  'signal-storm': 3900,
  'corporate-lockdown': 3820,
  'final-relay': 3900,
});

export function phaseAt(elapsed, config = CITY_PULSE_CONFIG) {
  const t = ((elapsed % config.periodMs) + config.periodMs) % config.periodMs;
  if (t < config.warningMs) return 'WARNING';
  if (t < config.warningMs + config.openMs) return 'OPEN';
  return 'CLOSED';
}

export function openStartAt(elapsed, config = CITY_PULSE_CONFIG) {
  const t = ((elapsed % config.periodMs) + config.periodMs) % config.periodMs;
  return elapsed - t + config.warningMs;
}

export function isPerfectWindow(elapsed, config = CITY_PULSE_CONFIG) {
  const t = ((elapsed % config.periodMs) + config.periodMs) % config.periodMs;
  const openStart = config.warningMs;
  const perfectEnd = config.warningMs + config.flowWindowMs;
  return t >= openStart && t < perfectEnd;
}
