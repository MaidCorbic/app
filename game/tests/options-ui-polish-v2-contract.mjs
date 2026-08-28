import fs from 'node:fs';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const polish = fs.readFileSync(new URL('../options-ui-polish-v2.js', import.meta.url), 'utf8');

assert.match(html, /options-ui-polish-v2\.js/);
assert.match(polish, /relay-options-polish-v2-style/);
assert.match(polish, /scrollbar-color/);
assert.match(polish, /relay-settings-change/);
assert.match(polish, /data-home-toggle/);
assert.match(polish, /data-pause-option/);
assert.match(polish, /data-home-volume/);
assert.match(polish, /data-volume/);
console.log('options-ui-polish-v2 contract ok');
