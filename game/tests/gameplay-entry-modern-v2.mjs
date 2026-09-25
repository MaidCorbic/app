import fs from 'node:fs';
import assert from 'node:assert/strict';

const init = fs.readFileSync(new URL('../relay-ui-init.js', import.meta.url), 'utf8');
const eventHud = fs.readFileSync(new URL('../gameplay-event-hud-v2.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../gameplay-entry-modern-v2.css', import.meta.url), 'utf8');

assert.match(init, /gameplay-entry-modern-v2\.css/);
assert.doesNotMatch(init, /gameplay-intro-final-v1\.js/);
assert.doesNotMatch(init, /mission-route-v6-layout-v1\.(js|css)/);
assert.doesNotMatch(eventHud, /NEW FIELD INSTRUCTION/);
assert.match(eventHud, /\['narration'/);
assert.match(css, /#play \.world-marker/);
assert.match(css, /#play \.input-guide/);
assert.match(css, /#play #gameplayEventHud/);
assert.match(css, /orientation:landscape/);

console.log('gameplay entry modern v2 contract: PASS');
