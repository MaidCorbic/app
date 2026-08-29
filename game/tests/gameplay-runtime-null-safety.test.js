import assert from 'node:assert/strict';
import fs from 'node:fs';

const hotfix = fs.readFileSync('game/src/systems/gameplay-runtime-null-safety-hotfix.js', 'utf8');
const loader = fs.readFileSync('game/gameplay-expansion-loader-v1.js', 'utf8');

assert.match(hotfix, /__relayGameplayExpansionV2Safe/);
assert.match(hotfix, /__relayGameplayExpansionV4Safe/);
assert.match(hotfix, /belt\?\.data\?\.values/);
assert.match(hotfix, /pulse\.geom/);
assert.match(hotfix, /ring\.geom/);
assert.match(hotfix, /state\.destroyed = true/);
assert.match(hotfix, /state\.entities = \{\}/);
assert.doesNotMatch(hotfix, /console\.(warn|error)/);
assert.match(loader, /installGameplayRuntimeNullSafety/);
assert.doesNotMatch(hotfix, /keydown-/);

console.log('Runtime null-safety contract OK: V2/V4 guards, fail-closed invalid state, no console fallback, no keyboard bindings.');
