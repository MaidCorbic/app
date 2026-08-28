import fs from 'node:fs';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const read = file => fs.readFileSync(new URL(file, root), 'utf8');
const stable = read('options-ui-stable-v2.js');
const safety = read('options-runtime-safety-v1.js');
const homeAdapter = read('home-options.js');
const pauseAdapter = read('pause-final-polish-v1.js');
const p2Adapter = read('p2-ux-controls-v1.js');
const index = read('index.html');

assert.match(stable, /__relayOptionsStableV2/);
assert.match(stable, /relay-stable-scroll/);
assert.match(stable, /relay-stable-controls/);
assert.match(stable, /data-final-toggle/);
assert.match(stable, /data-final-range/);
assert.match(stable, /relay-settings-change/);
assert.match(stable, /relay-hide-intel/);
assert.match(stable, /relay-hide-ally/);
assert.match(stable, /relay-hide-events/);
assert.match(stable, /relay-hide-tutorials/);
assert.match(safety, /__relayOptionsRuntimeSafetyV1/);
assert.match(safety, /userActivation/);
assert.match(homeAdapter, /options-ui-stable-v2\.js/);
assert.match(pauseAdapter, /options-ui-stable-v2\.js/);
assert.match(p2Adapter, /options-ui-stable-v2\.js/);
assert.doesNotMatch(index, /pause-mobile-polish\.css/);
assert.doesNotMatch(index, /pause-ui-v1\.css/);

console.log('unified-options-ui-contract: PASS');
