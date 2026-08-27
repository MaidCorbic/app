import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const owner = await readFile(fileURLToPath(new URL('src/systems/mobile-input-single-owner-v1.js', root)), 'utf8');
const controller = await readFile(fileURLToPath(new URL('src/systems/mobile-controls-controller.js', root)), 'utf8');
const index = await readFile(fileURLToPath(new URL('index.html', root)), 'utf8');

assert.match(owner, /MOBILE INPUT SINGLE OWNER V2/);
assert.ok(owner.includes("data-mobile-action=\"build2\""));
assert.ok(owner.includes("data-mobile-action=\"gadget2\""));
assert.ok(owner.includes(".querySelector('[data-mobile-action=\"build2\"]')?.remove()"));
assert.ok(owner.includes(".querySelector('[data-mobile-action=\"gadget2\"]')?.remove()"));
assert.match(controller, /DEPRECATED COMPATIBILITY SHIM/);
assert.doesNotMatch(controller, /addEventListener\(['\"]pointer(down|move|up)/);
assert.match(index, /data-mobile-action=\"fire\"/);
assert.equal((index.match(/data-mobile-action=/g) || []).length, 6);

console.log('Mobile action layout contract: PASS');
