import fs from 'node:fs';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const index = fs.readFileSync(new URL('index.html', root), 'utf8');
const home = fs.readFileSync(new URL('home-v3.js', root), 'utf8');
const css = fs.readFileSync(new URL('home-v3.css', root), 'utf8');

assert.match(index, /home-v3\.css/);
assert.match(index, /home-v3\.js/);
assert.match(index, /home-v3-guard\.js/);
assert.doesNotMatch(index, /options-ui-polish-v2\.js/);
assert.match(home, /data-v3-play/);
assert.match(home, /data-v3-options/);
assert.match(home, /data-v3-tutorial/);
assert.match(home, /data-v3-faq/);
assert.match(home, /data-v3-exit/);
assert.match(css, /body\.home-v3-active #play\{display:none!important\}/);

console.log('HOME V3 CONTRACT: PASS');
