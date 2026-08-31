import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const authority = await readFile(fileURLToPath(new URL('runtime-authority-v1.js', root)), 'utf8');
const eventHud = await readFile(fileURLToPath(new URL('gameplay-event-hud-v2.js', root)), 'utf8');
const audio = await readFile(fileURLToPath(new URL('audio-feedback-v2.js', root)), 'utf8');
const init = await readFile(fileURLToPath(new URL('relay-ui-init.js', root)), 'utf8');

assert.match(authority, /hasBlockingOverlay/);
assert.match(authority, /mobile-action/);
assert.match(authority, /< 90/);
assert.match(authority, /relay:runner-scene-ready/);
assert.match(authority, /shutdown/);
assert.match(eventHud, /games: new WeakMap/);
assert.match(eventHud, /state\.games\.has\(game\)/);
assert.match(eventHud, /state\.games\.delete\(game\)/);
assert.match(audio, /contextual projectile\/enemy sounds/);
assert.doesNotMatch(audio, /scene\.game\.events\.on\('feedback'/);
assert.doesNotMatch(audio, /data-mobile-action\]\[data-action/);
assert.match(init, /\.\/runtime-authority-v1\.js/);

console.log('Runtime authority contract: PASS');
