import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const config = await readFile(fileURLToPath(new URL('src/config/gameplay-timing.js', root)), 'utf8');
const patch = await readFile(fileURLToPath(new URL('initial-spawn-shield-patch.mjs', root)), 'utf8');
const vite = await readFile(fileURLToPath(new URL('vite.config.mjs', root)), 'utf8');

assert.match(config, /SPAWN_SHIELD_MS\s*=\s*10_000/);
assert.match(patch, /healthInvulnerable = SPAWN_SHIELD_MS/);
assert.match(patch, /respawnGrace = SPAWN_SHIELD_MS/);
assert.match(patch, /duration: SPAWN_SHIELD_MS/);
assert.match(patch, /return code\.includes\(marker\) \? code\.replace\(marker, replacement\) : code/);
assert.match(vite, /patchInitialSpawnShield/);
assert.match(vite, /relay-initial-spawn-shield-fix/);

console.log('Initial spawn shield consistency: PASS');
