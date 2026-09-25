import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const owner = await readFile(fileURLToPath(new URL('src/systems/mobile-input-single-owner-v1.js', root)), 'utf8');
const index = await readFile(fileURLToPath(new URL('index.html', root)), 'utf8');

assert.match(owner, /MOBILE INPUT SINGLE OWNER V9/);
assert.ok(owner.includes("jump: [32, ' ', 'Space']"));
assert.ok(owner.includes("fire: [69, 'e', 'KeyE']"));
assert.ok(owner.includes("sword: [81, 'q', 'KeyQ']"));
assert.ok(owner.includes("dash: [16, 'Shift', 'ShiftLeft']"));
assert.ok(owner.includes("build1: [49, '1', 'Digit1']"));
assert.ok(owner.includes("gadget1: [51, '3', 'Digit3']"));
assert.match(owner, /normalizeActionButtons/);
assert.match(owner, /replaceWith\(clone\)/);
assert.match(owner, /seen\.has\(action\)/);
await assert.rejects(
  access(fileURLToPath(new URL('src/systems/mobile-controls-controller.js', root))),
  /ENOENT/,
  'deprecated secondary mobile controller must stay removed',
);
assert.match(index, /data-mobile-action=\"fire\"/);
assert.equal((index.match(/data-mobile-action=/g) || []).length, 6);

console.log('Mobile action layout contract: PASS');
