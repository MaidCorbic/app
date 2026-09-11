import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const commands = [
  'test:runtime-wrapper-order',
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

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
for (const command of commands) {
  console.log(`\n=== ${command} ===`);
  const result = spawnSync(npm, ['run', command], {
    cwd: new URL('..', import.meta.url),
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Final stability check failed: ${command} (exit ${result.status})`);
  }
}

console.log(`\nFinal stability suite passed: ${commands.length} checks`);
