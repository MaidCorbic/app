import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const runtime = await readFile(fileURLToPath(new URL('src/systems/core-stability.js', root)), 'utf8');
const source = await readFile(fileURLToPath(new URL('src/scenes/RunnerScene.js', root)), 'utf8');

assert.match(runtime, /function inferDeathReason\(message\)/);
assert.match(runtime, /value\.includes\('enemy'\) \|\| value\.includes\('dinosaur'\)/);
assert.match(runtime, /scene\.enemyHits = \(Number\(scene\.enemyHits\) \|\| 0\) \+ Math\.max\(1, fell\)/);
assert.match(runtime, /this\.__relayPendingDeathReason/);
assert.match(runtime, /RunnerScene\.prototype\.takeSciFiHit = function stableHit\(message, reason\)/);
assert.match(source, /takeSciFiHit\(message\)/);
assert.doesNotMatch(runtime, /patchDeathReason/);

console.log('Death reason statistics contract: PASS');
