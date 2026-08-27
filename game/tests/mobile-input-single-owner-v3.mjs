import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const main = await readFile(fileURLToPath(new URL('src/main.js', root)), 'utf8');
const index = await readFile(fileURLToPath(new URL('index.html', root)), 'utf8');
const owner = await readFile(fileURLToPath(new URL('src/systems/mobile-input-single-owner-v1.js', root)), 'utf8');

assert.equal((index.match(/src\/systems\/mobile-input-single-owner-v1\.js/g) || []).length, 1, 'single-owner module must be loaded exactly once');
assert.ok(index.indexOf('src="/src/main.js"') < index.indexOf('src="/src/systems/mobile-input-single-owner-v1.js"'), 'single-owner must load after main boot');
assert.match(main, /data-mobile-action/);
assert.match(owner, /cloneNode\(true\)/, 'owner must replace the original controls to detach element listeners installed during boot');
assert.match(owner, /current\.replaceWith\(controls\)/);
assert.match(owner, /pointerup/);
assert.match(owner, /pointercancel/);
assert.match(owner, /visibilitychange/);
assert.match(owner, /grid-template-columns: repeat\(6/);
assert.match(owner, /data-mobile-action=\\"build2\\"/);
assert.match(owner, /data-mobile-action=\\"gadget2\\"/);
assert.doesNotMatch(owner, /button\.__pointerId/);
assert.match(owner, /activePointers\.has\(event\.pointerId\)/);
console.log('Mobile input single-owner V3 contract: PASS');
