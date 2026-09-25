import assert from 'node:assert/strict';
import fs from 'node:fs';

const relay = fs.readFileSync(new URL('../relay-ui-init.js', import.meta.url), 'utf8');
const eventHud = fs.readFileSync(new URL('../gameplay-event-hud-v2.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../gameplay-entry-modern-v1.css', import.meta.url), 'utf8');

assert.match(relay, /gameplay-entry-modern-v1\.css/);
assert.doesNotMatch(relay, /gameplay-intro-final-v1\.js/);
assert.doesNotMatch(relay, /mission-route-v6-layout-v1\.js/);
assert.doesNotMatch(relay, /mission-route-v6-layout-v1\.css/);

assert.doesNotMatch(eventHud, /NEW FIELD INSTRUCTION/);
assert.match(eventHud, /\['narration'/);

assert.match(css, /#play \.world-marker/);
assert.match(css, /#play \.input-guide/);
assert.match(css, /@media \(pointer: coarse\) and \(orientation: landscape\)/);

console.log('Gameplay entry modern surface contract OK.');
