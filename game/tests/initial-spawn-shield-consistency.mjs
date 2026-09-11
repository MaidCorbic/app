import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const config = await readFile(fileURLToPath(new URL('src/config/gameplay-timing.js', root)), 'utf8');
const runtime = await readFile(fileURLToPath(new URL('src/systems/core-stability.js', root)), 'utf8');
const vite = await readFile(fileURLToPath(new URL('vite.config.mjs', root)), 'utf8');

assert.match(config, /SPAWN_SHIELD_MS\s*=\s*10_000/);
assert.match(runtime, /healthInvulnerable = Math\.max\(Number\(this\.healthInvulnerable\) \|\| 0, SPAWN_SHIELD_MS\)/);
assert.match(runtime, /respawnGrace = Math\.max\(Number\(this\.respawnGrace\) \|\| 0, SPAWN_SHIELD_MS\)/);
assert.match(runtime, /duration: SPAWN_SHIELD_MS/);
assert.doesNotMatch(runtime, /healthInvulnerable = 1600/);
assert.doesNotMatch(vite, /patchInitialSpawnShield|relay-initial-spawn-shield-fix/);

console.log('Initial spawn shield consistency: PASS');
