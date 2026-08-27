import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const core = await readFile(fileURLToPath(new URL('src/systems/core-stability.js', root)), 'utf8');
const death = await readFile(fileURLToPath(new URL('player-death-animation-v1.js', root)), 'utf8');
const timing = await readFile(fileURLToPath(new URL('src/config/gameplay-timing.js', root)), 'utf8');

assert.match(timing, /SPAWN_SHIELD_MS\s*=\s*10_000/);
assert.match(core, /SPAWN_SHIELD_MS/);
assert.doesNotMatch(core, /respawnGrace\s*=\s*Math\.max\([^\n]*1100/);
assert.doesNotMatch(core, /healthInvulnerable\s*=\s*Math\.max\([^\n]*1100/);
assert.match(death, /import \{ SPAWN_SHIELD_MS \} from '\.\/src\/config\/gameplay-timing\.js';/);
assert.match(death, /this\.healthInvulnerable\s*=\s*SPAWN_SHIELD_MS/);
assert.match(death, /this\.respawnGrace\s*=\s*SPAWN_SHIELD_MS/);
assert.doesNotMatch(death, /const SPAWN_SHIELD_MS\s*=\s*10000/);

console.log('Respawn shield single-owner contract: PASS');
