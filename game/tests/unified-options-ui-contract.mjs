import fs from 'node:fs';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const read = file => fs.readFileSync(new URL(file, root), 'utf8');
const unified = read('unified-options-ui-v1.js');
const homeAdapter = read('home-options.js');
const pauseAdapter = read('pause-final-polish-v1.js');
const p2Adapter = read('p2-ux-controls-v1.js');
const index = read('index.html');

assert.match(unified, /__relayUnifiedOptionsUiV1/);
assert.match(unified, /data-unified-toggle/);
assert.match(unified, /data-unified-range/);
assert.match(unified, /relay-hide-intel/);
assert.match(unified, /relay-hide-ally/);
assert.match(unified, /relay-hide-events/);
assert.match(unified, /relay-hide-tutorials/);
assert.match(homeAdapter, /unified-options-ui-v1\.js/);
assert.match(pauseAdapter, /unified-options-ui-v1\.js/);
assert.match(p2Adapter, /unified-options-ui-v1\.js/);
assert.doesNotMatch(index, /pause-mobile-polish\.css/);
assert.doesNotMatch(index, /pause-ui-v1\.css/);

console.log('unified-options-ui-contract: PASS');
