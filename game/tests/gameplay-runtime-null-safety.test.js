import assert from 'node:assert/strict';
import fs from 'node:fs';

const hotfix = fs.readFileSync('game/src/systems/gameplay-runtime-null-safety-hotfix.js', 'utf8');
const loader = fs.readFileSync('game/gameplay-expansion-loader-v1.js', 'utf8');

assert.match(hotfix, /__relayGameplayExpansionV2Safe/);
assert.match(hotfix, /__relayGameplayExpansionV4Safe/);
assert.match(hotfix, /belt\.data\?\.values/);
assert.match(hotfix, /pulse\.geom/);
assert.match(hotfix, /ring\.geom/);
assert.match(loader, /installGameplayRuntimeNullSafety/);
assert.doesNotMatch(hotfix, /keydown-/);

console.log('Runtime null-safety contract OK: V2 data guards, V4 geometry guards, no keyboard bindings.');
