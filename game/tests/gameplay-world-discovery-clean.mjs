import assert from 'node:assert/strict';
import fs from 'node:fs';

const v7 = fs.readFileSync('game/src/systems/gameplay-expansion-v7-world-simulation.js', 'utf8');
const v8 = fs.readFileSync('game/src/systems/gameplay-expansion-v8-systems.js', 'utf8');

for (const source of [v7, v8]) {
  assert.doesNotMatch(source, /V[78] \/\/ WORLD/);
  assert.doesNotMatch(source, /ALT\+1\.\.9/);
  assert.doesNotMatch(source, /input\.keyboard/);
  assert.doesNotMatch(source, /setScrollFactor\(0\)/);
}

assert.doesNotMatch(v7, /RunnerScene\.prototype\.update/);
assert.doesNotMatch(v8, /RunnerScene\.prototype\.update/);
assert.match(v7, /relay:world-discovery/);
assert.match(v8, /relay:world-system/);
assert.match(v7, /scene\.player/);
assert.match(v8, /scene\.player/);

console.log('World-first V7/V8 contract OK: no permanent system dashboards or keyboard-owned controls; systems surface through world proximity/events.');
