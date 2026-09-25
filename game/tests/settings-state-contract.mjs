import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const main = await readFile(fileURLToPath(new URL('src/main.js', root)), 'utf8');
const options = await readFile(
  fileURLToPath(new URL('unified-options-ui-v1.js', root)),
  'utf8'
);

assert.match(main, /function toggleSetting\(name\)/, 'main runtime must own core settings state');
assert.match(main, /saveState\(state\)/, 'main runtime must persist settings');
assert.match(main, /applyRuntimeSettings\(\)/, 'main runtime must apply settings immediately');
assert.match(options, /data-unified-toggle="[^"]*"/);
assert.match(options, /data-unified-range="[^"]*"/);

assert.match(options, /muted: false/);
assert.match(options, /musicVolume: 0\.55/);
assert.match(options, /sfxVolume: 0\.70/);
assert.match(options, /screenShake: true/);
assert.match(options, /reducedMotion: false/);
assert.match(options, /rain: true/);

assert.match(options, /'screenShake'/);
assert.match(options, /'reducedMotion'/);
assert.match(options, /'rain'/);
assert.match(options, /'muted'/);
assert.match(options, /'musicVolume'/);
assert.match(options, /'sfxVolume'/);

assert.match(options, /relay-settings-change/);

console.log('Settings state contract: PASS');
