import fs from 'node:fs';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const root = new URL('..', import.meta.url);
const runtimePath = new URL('src/systems/route-choice-branching-v1.js', root);
const runtime = fs.readFileSync(runtimePath, 'utf8');
const bootstrap = fs.readFileSync(new URL('relay-ui-init.js', root), 'utf8');

const syntax = spawnSync(process.execPath, ['--check', runtimePath.pathname], { encoding: 'utf8' });
assert.equal(syntax.status, 0, syntax.stderr || 'route choice branching failed node --check');

assert.match(runtime, /SAFE ROUTE \/\/ STABLE LINE OPEN/);
assert.match(runtime, /HOT ROUTE \/\/ ALTERNATE LINE OPEN/);
assert.match(runtime, /relay:variety-route/);
assert.match(runtime, /relay:route-branch-applied/);
assert.match(runtime, /disableBody/);
assert.match(runtime, /enableBody/);
assert.match(runtime, /RunnerScene\.prototype\.create/);
assert.match(runtime, /RunnerScene\.prototype\.__relayRouteChoiceBranchingV1/);
assert.doesNotMatch(runtime, /RunnerScene\.prototype\.update\s*=|originalUpdate/);
assert.doesNotMatch(runtime, /setGravityY|setMaxVelocity|state\.js|mobile-input-single-owner/);

assert.match(bootstrap, /src\/systems\/route-choice-branching-v1\.js/);
assert.equal((bootstrap.match(/src\/systems\/route-choice-branching-v1\.js/g) || []).length, 1);

console.log('route-choice-branching-v1: PASS');
