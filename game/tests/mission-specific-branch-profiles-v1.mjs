import fs from 'node:fs';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const root = new URL('..', import.meta.url);
const runtimePath = new URL('src/systems/route-choice-branching-v1.js', root);
const runtime = fs.readFileSync(runtimePath, 'utf8');

const syntax = spawnSync(process.execPath, ['--check', runtimePath.pathname], { encoding: 'utf8' });
assert.equal(syntax.status, 0, syntax.stderr || 'route profile runtime failed node --check');

const missions = [
  'first-delivery',
  'dead-drop',
  'blackout',
  'pursuit',
  'signal-storm',
  'corporate-lockdown',
  'final-relay'
];

for (const mission of missions) {
  assert.ok(runtime.includes(`'${mission}':`), `missing explicit branch profile: ${mission}`);
}

assert.match(runtime, /safeIndex/);
assert.match(runtime, /hotIndex/);
assert.match(runtime, /activationProgress/);
assert.match(runtime, /source: 'mission-profile'/);
assert.match(runtime, /relay:route-branch-applied/);
assert.match(runtime, /relayRouteGate/);
assert.match(runtime, /RunnerScene\.prototype\.create/);
assert.doesNotMatch(runtime, /RunnerScene\.prototype\.update\s*=|originalUpdate/);
assert.doesNotMatch(runtime, /setGravityY|setMaxVelocity|state\.js|mobile-input-single-owner/);

console.log('mission-specific-branch-profiles-v1: PASS');
