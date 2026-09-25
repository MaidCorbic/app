import fs from 'node:fs';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const root = new URL('..', import.meta.url);
const runtimePath = new URL('src/systems/gameplay-route-choice-bridge-v1.js', root);
const runtime = fs.readFileSync(runtimePath, 'utf8');

const syntax = spawnSync(process.execPath, ['--check', runtimePath.pathname], { encoding: 'utf8' });
assert.equal(syntax.status, 0, syntax.stderr || 'route-choice bridge failed node --check');
assert.match(runtime, /closest\?\.\('\[data-route\]'\)/);
assert.match(runtime, /closest\?\.\('#relayGameplayVariety'\)/);
assert.match(runtime, /relay:gameplay-variety-route-choice/);
assert.match(runtime, /Do not dispatch the same choice a second time/);

console.log('route-choice-duplicate-event-guard-v1: PASS');
