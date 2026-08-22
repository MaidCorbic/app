// Runtime regression audit for the critical gameplay flows.
// This module is intentionally side-effect free until imported by the app/test harness.
export function auditGameplayRuntime({ game, missionIndex, missions, transitioning }) {
  const failures = [];
  if (!game?.scene?.getScene) failures.push('Phaser scene manager unavailable');
  if (!Number.isInteger(missionIndex) || missionIndex < 0 || missionIndex >= missions.length) failures.push('Invalid mission index');
  if (typeof transitioning !== 'boolean') failures.push('Invalid mission transition state');
  return { ok: failures.length === 0, failures };
}
