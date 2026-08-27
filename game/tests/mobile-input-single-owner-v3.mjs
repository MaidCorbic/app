import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const main = await readFile(fileURLToPath(new URL('src/main.js', root)), 'utf8');
const index = await readFile(fileURLToPath(new URL('index.html', root)), 'utf8');
const owner = await readFile(fileURLToPath(new URL('src/systems/mobile-input-single-owner-v1.js', root)), 'utf8');

assert.equal((index.match(/src\/systems\/mobile-input-single-owner-v1\.js/g) || []).length, 1, 'single-owner module must be loaded exactly once');
assert.match(index, /src\/systems\/mobile-input-single-owner-v1\.js'><\/script>/);
assert.doesNotMatch(main, /document\.querySelectorAll\('\[data-mobile-action\]'\)/, 'main.js must not own mobile action listeners');
assert.doesNotMatch(main, /const joystick = document\.querySelector\('\[data-mobile-joystick\]'\)/, 'main.js must not own joystick listeners');
assert.match(owner, /pointerup/);
assert.match(owner, /pointercancel/);
assert.match(owner, /visibilitychange/);
assert.match(owner, /grid-template-columns: repeat\(6/);
assert.doesNotMatch(owner, /button\.__pointerId/);
console.log('Mobile input single-owner V3 contract: PASS');
