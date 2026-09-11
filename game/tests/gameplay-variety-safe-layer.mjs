import fs from 'node:fs';
import assert from 'node:assert/strict';

const root = new URL('..', import.meta.url);
const read = file => fs.readFileSync(new URL(file, root), 'utf8');

const runtime = read('src/systems/gameplay-variety-safe-layer-v1.js');
const bootstrap = read('relay-ui-init.js');

assert.match(runtime, /GAMEPLAY_VARIETY_FLAGS/);
assert.match(runtime, /routeChoice: true/);
assert.match(runtime, /optionalObjectives: true/);
assert.match(runtime, /momentum: true/);
assert.match(runtime, /liveEvents: true/);
assert.match(runtime, /relayGameplayVariety/);
assert.match(runtime, /SAFE ROUTE/);
assert.match(runtime, /HOT ROUTE/);
assert.match(runtime, /relay:variety-route/);
assert.match(runtime, /relay:variety-flow/);
assert.match(runtime, /relay:variety-event/);

// Safety contract: the new layer may patch create/shutdown, but must not own the
// core RunnerScene update loop, physics configuration, or persistent progression.
assert.doesNotMatch(runtime, /RunnerScene\.prototype\.update\s*=|originalUpdate/);
assert.doesNotMatch(runtime, /setGravityY|setMaxVelocity|missionTuning\s*=|state\.js/);
assert.match(runtime, /RunnerScene\.prototype\.create/);
assert.match(runtime, /RunnerScene\.prototype\.shutdown/);
assert.match(runtime, /catch \(error\)/);

assert.match(bootstrap, /src\/systems\/gameplay-variety-safe-layer-v1\.js/);
assert.equal((bootstrap.match(/src\/systems\/gameplay-variety-safe-layer-v1\.js/g) || []).length, 1);

console.log('gameplay-variety-safe-layer: PASS');
