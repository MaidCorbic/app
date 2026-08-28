import fs from 'node:fs';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const index = fs.readFileSync(new URL('index.html', root), 'utf8');
const css = fs.readFileSync(new URL('home-v3-isolation.css', root), 'utf8');

assert.match(index, /home-v3\.css/);
assert.match(index, /home-v3-isolation\.css/);
assert.doesNotMatch(index, /options-ui-polish-v2\.js/);
assert.match(css, /body\.home-v3-active #play/);
assert.match(css, /body\.home-v3-active #intro \.main-menu/);
assert.match(css, /body\.home-v3-active #intro \.menu-backdrop/);

console.log('HOME V3 ISOLATION CONTRACT: PASS');
