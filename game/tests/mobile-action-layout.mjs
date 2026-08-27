import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const owner = await readFile(fileURLToPath(new URL('src/systems/mobile-input-single-owner-v1.js', root)), 'utf8');
const controller = await readFile(fileURLToPath(new URL('src/systems/mobile-controls-controller.js', root)), 'utf8');
const index = await readFile(fileURLToPath(new URL('index.html', root)), 'utf8');

assert.ok(owner.includes('data-mobile-action="build2"'));
assert.ok(owner.includes('data-mobile-action="gadget2"'));
assert.ok(owner.includes(".querySelector('[data-mobile-action=\"build2\"]')?.remove()"));
assert.ok(owner.includes(".querySelector('[data-mobile-action=\"gadget2\"]')?.remove()"));
assert.match(controller, /BUILD 2 and GEAR 4 remain fully available|Keyboard actions 2 and 4 remain/);
assert.match(index, /mobile-controls/);

console.log('Mobile action layout contract: PASS');
