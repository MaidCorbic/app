import fs from 'node:fs';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const root = new URL('..', import.meta.url);
const runtimePath = new URL('../route-mutation-v1.js', import.meta.url);
const runtime = fs.readFileSync(runtimePath, 'utf8');

const syntax = spawnSync(process.execPath, ['--check', runtimePath.pathname], { encoding: 'utf8' });
assert.equal(syntax.status, 0, syntax.stderr || 'route mutation failed node --check');
assert.match(runtime, /__relayRouteChoiceBranchingV1/);
assert.match(runtime, /branchApplied/);
assert.match(runtime, /state\.mutated = true/);
assert.match(runtime, /\['safe', 'hot'\]\.includes\(routeState\.route\)/);
assert.doesNotMatch(runtime, /return;\s*\n\s*const start = Number\(scene\.mission/);

console.log('route-mutation-choice-coordination-v1: PASS');
