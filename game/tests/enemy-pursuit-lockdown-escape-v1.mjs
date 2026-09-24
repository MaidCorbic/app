import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(
  new URL('../src/systems/full-gameplay-roadmap-v1.js', import.meta.url),
  'utf8'
);

const required = [
  'SUSPICIOUS',
  'ALERT',
  'chase',
  'PURSUIT ACTIVE',
  'LOCKDOWN',
  'relay:pursuit-lockdown',
  'relay:pursuit-pressure',
  'heat - 5.5 * dt',
  'break line of sight',
  'cleanupPursuit',
  'interceptor',
  'tracker',
  'sniper',
  'drone'
];

for (const token of required) {
  assert.ok(
    source.toLowerCase().includes(token.toLowerCase()),
    'Missing pursuit scenario stage: ' + token
  );
}

assert.match(
  source,
  /const visible =\s*\n?\s*distance <= profile\.range/,
  'Pursuit must use a visibility/range gate'
);

assert.match(
  source,
  /if \(disabled \|\| !visible\) return;/,
  'Disabled or non-visible enemies must not apply archetype reactions'
);

assert.match(
  source,
  /state\.heat = clamp\(state\.heat - 5\.5 \* dt, 0, 100\)/,
  'Pursuit heat must decay so line-of-sight breaks can lead to escape'
);

assert.match(
  source,
  /state\.heat >= 82/,
  'Lockdown threshold must be explicit'
);

assert.match(
  source,
  /events\.off\('relay:variety-route', handlers\.onVarietyRoute\)/,
  'Pursuit route listener must be cleaned up'
);

console.log('Enemy -> chase -> lockdown -> escape contract: OK');
