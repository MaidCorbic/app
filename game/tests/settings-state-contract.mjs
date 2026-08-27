import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const main = await readFile(fileURLToPath(new URL('src/main.js', root)), 'utf8');
const pause = await readFile(fileURLToPath(new URL('pause-final-polish-v1.js', root)), 'utf8');

assert.match(main, /function toggleSetting\(name\)/, 'main runtime must own core settings state');
assert.match(main, /saveState\(state\)/, 'main runtime must persist settings');
assert.match(main, /applyRuntimeSettings\(\)/, 'main runtime must apply settings immediately');
assert.match(pause, /data-setting="muted"/);
assert.match(pause, /data-setting="screenShake"/);
assert.match(pause, /data-setting="reducedMotion"/);
assert.match(pause, /data-setting="rain"/);
assert.match(pause, /data-volume="musicVolume"/);
assert.match(pause, /data-volume="sfxVolume"/);
assert.doesNotMatch(pause, /data-pause-range=/, 'pause settings must use the main runtime volume handler');
assert.match(pause, /relay-settings-change/);

console.log('Settings state contract: PASS');
