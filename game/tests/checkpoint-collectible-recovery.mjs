import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const runtime = await readFile(fileURLToPath(new URL('src/systems/core-stability.js', root)), 'utf8');
const vite = await readFile(fileURLToPath(new URL('vite.config.mjs', root)), 'utf8');

assert.match(runtime, /setData\('spawnX', item\.x\)/);
assert.match(runtime, /setData\('spawnY', item\.y\)/);
assert.match(runtime, /item\.getData\('spawnX'\)/);
assert.match(runtime, /item\.getData\('spawnY'\)/);
assert.match(runtime, /item\.enableBody\?\.\(true, spawnX, spawnY, true, true\)/);
assert.match(runtime, /function rememberCheckpointCollectibles\(scene\)/);
assert.match(runtime, /function restoreCheckpointCollectibles\(scene\)/);
assert.doesNotMatch(vite, /patchCheckpointCollectibles|relay-checkpoint-collectibles-fix/);

console.log('Checkpoint collectible recovery: PASS');
