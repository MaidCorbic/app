import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const main = await readFile(fileURLToPath(new URL('src/main.js', root)), 'utf8');
const index = await readFile(fileURLToPath(new URL('index.html', root)), 'utf8');
const owner = await readFile(fileURLToPath(new URL('src/systems/mobile-input-single-owner-v1.js', root)), 'utf8');
const bridge = await readFile(fileURLToPath(new URL('src/systems/mobile-controls-bridge-v2.js', root)), 'utf8');

assert.equal((index.match(/src\/systems\/mobile-input-single-owner-v1\.js/g) || []).length, 1, 'single-owner module must be loaded exactly once');
assert.ok(index.indexOf('src="/src/main.js"') < index.indexOf('src="/src/systems/mobile-input-single-owner-v1.js"'), 'single-owner must load after main boot');
assert.match(main, /data-mobile-action/);
assert.match(owner, /MOBILE INPUT SINGLE OWNER V8/);
assert.match(owner, /cloneNode\(true\)/);
assert.match(owner, /replaceWith\(clone\)/);
assert.match(owner, /seen\.has\(action\)/, 'owner must deduplicate actions added by legacy boot code');
assert.match(owner, /pointerup/);
assert.match(owner, /pointercancel/);
assert.match(owner, /lostpointercapture/);
assert.match(owner, /visibilitychange/);
assert.match(owner, /pagehide/);
assert.match(owner, /ACTION_KEYS = Object\.freeze/);
assert.match(owner, /activePointers\.has\(event\.pointerId\)/);
assert.match(owner, /mobileControlsOwner/);
assert.match(owner, /buttons-v8/);
assert.doesNotMatch(owner, /data-mobile-joystick.*replaceNode/s, 'action owner must never replace the movement joystick');
assert.doesNotMatch(owner, /const maxDrag/);
assert.doesNotMatch(owner, /mobileDirection/);

assert.match(bridge, /Mobile controls bridge V3/);
assert.match(bridge, /data-mobile-joystick/);
assert.match(bridge, /relayMovementOwner = 'v3'/);
assert.match(bridge, /scene\.mobileDirection = normalized/);
assert.match(bridge, /scene\.physics\?\.world\?\.resume/);
assert.match(bridge, /body\.moves = true/);

console.log('Mobile input single-owner V8 contract: PASS');
