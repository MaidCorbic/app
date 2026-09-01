import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const read = path => readFile(fileURLToPath(new URL(path, root)), 'utf8');

const css = await read('../canonical-ui-v1.css');
const arrival = await read('../cinematic-arrival-v2.js');
const index = await read('../index.html');
const base = await read('../styles.css');

assert.match(css, /STACKING CONTRACT/);
assert.match(css, /TOUCH LAYOUT/);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /safe-area-inset-bottom/);
assert.match(css, /#play \.hud-actions>button/);
assert.match(css, /#pauseMenu \.menu-grid/);
assert.match(css, /#worldMap/);
assert.match(css, /#preflight/);
assert.match(arrival, /canonical-ui-v1\.css/);
assert.match(arrival, /data-relay-canonical-ui/);
assert.equal((index.match(/data-mobile-action=/g) || []).length, 6);
assert.match(base, /body\.is-touch \.mobile-controls small/);
assert.match(css, /body\.is-touch #play \.mobile-actions small\{display:none!important\}/);

console.log('Canonical CSS contract: PASS');
