import fs from 'node:fs';
import assert from 'node:assert/strict';

const options = fs.readFileSync(new URL('../unified-options-ui-v1.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../options-polish-v2.css', import.meta.url), 'utf8');

assert.match(options, /unifiedOptionsBound/);
assert.match(options, /data-unified-fullscreen/);
assert.match(options, /data-unified-reset/);
assert.match(options, /data-unified-controls/);
assert.match(options, /relay-settings-change/);
assert.match(css, /transform:none!important/);
assert.match(css, /\.relay-option-copy strong\{font-size:11px!important/);
assert.match(css, /\.relay-action\{min-height:48px!important/);
console.log('options regression: PASS');
