import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const patch = await readFile(fileURLToPath(new URL('checkpoint-collectible-patch.mjs', root)), 'utf8');
const vite = await readFile(fileURLToPath(new URL('vite.config.js', root)), 'utf8');

assert.match(patch, /setData\('spawnX', x\)/);
assert.match(patch, /setData\('spawnY', y\)/);
assert.match(patch, /signal\.getData\('spawnX'\)/);
assert.match(patch, /signal\.getData\('spawnY'\)/);
assert.match(patch, /secret\.getData\('spawnX'\)/);
assert.match(patch, /secret\.getData\('spawnY'\)/);
assert.match(vite, /patchCheckpointCollectibles/);
assert.match(vite, /relay-checkpoint-collectibles-fix/);

console.log('Checkpoint collectible recovery: PASS');
