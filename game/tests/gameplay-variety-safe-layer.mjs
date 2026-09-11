import fs from 'node:fs';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const root = new URL('..', import.meta.url);
const read = file => fs.readFileSync(new URL(file, root), 'utf8');

const runtimePath = new URL('src/systems/gameplay-variety-safe-layer-v1.js', root);
const runtime = fs.readFileSync(runtimePath, 'utf8');
const bootstrap = read('relay-ui-init.js');

const syntax = spawnSync(process.execPath, ['--check', runtimePath.pathname], { encoding: 'utf8' });
assert.equal(syntax.status, 0, syntax.stderr || 'gameplay variety runtime failed node --check');

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

// Safety contract: the layer must not own the core update loop or physics/state.
assert.doesNotMatch(runtime, /RunnerScene\.prototype\.update\s*=|originalUpdate/);
assert.doesNotMatch(runtime, /setGravityY|setMaxVelocity|missionTuning\s*=|state\.js/);
assert.match(runtime, /RunnerScene\.prototype\.create/);
assert.match(runtime, /RunnerScene\.prototype\.shutdown/);
assert.match(runtime, /catch \(error\)/);

assert.match(bootstrap, /src\/systems\/gameplay-variety-safe-layer-v1\.js/);
assert.equal((bootstrap.match(/src\/systems\/gameplay-variety-safe-layer-v1\.js/g) || []).length, 1);

console.log('gameplay-variety-safe-layer: PASS');
