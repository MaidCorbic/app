import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const file = await readFile(fileURLToPath(new URL('home-world-ui-polish-v1.js', root)), 'utf8');
const menu = await readFile(fileURLToPath(new URL('menu-music.js', root)), 'utf8');

assert.match(file, /relay-home-clock/);
assert.match(file, /relay-clouds/);
assert.match(file, /world-marker\.is-typing/);
assert.match(file, /relayGameplayAudioStartV3/);
assert.match(file, /relayAdaptiveMusic/);
assert.match(file, /orientation:landscape/);
assert.match(file, /relayGameplayIntroFinalV3/);
assert.match(file, /#relayP1Momentum/);
assert.match(menu, /home-world-ui-polish-v1\.js/);

console.log('Home/world UI polish V1 contract: PASS');
