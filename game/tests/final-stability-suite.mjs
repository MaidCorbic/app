import assert from 'node:assert/strict';

const commands = [
  'test:runtime-wrapper-order',
  'test:p0-gameplay-safety',
  'test:runtime-authority',
  'test:mobile-input-single-owner',
  'test:mobile-action-layout',
  'test:mission-finish-recovery-lifecycle',
  'test:death-retry-state-reset',
  'test:respawn-shield-single-owner',
  'test:initial-spawn-shield-consistency',
  'test:checkpoint-collectible-recovery',
  'test:respawn-transient-state',
  'test:double-fall-statistics',
  'test:death-reason-statistics',
  'test:dash-physics-single-owner',
  'test:deep-gameplay',
  'test:v13-level-wiring',
  'test:gameplay-smoke',
];

assert.equal(commands.length, new Set(commands).size, 'Final stability suite contains duplicate commands');
console.log(`Final stability suite defined: ${commands.length} checks`);
