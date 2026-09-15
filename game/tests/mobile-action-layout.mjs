import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const owner = await readFile(fileURLToPath(new URL('src/systems/mobile-input-single-owner-v1.js', root)), 'utf8');
const controller = await readFile(fileURLToPath(new URL('src/systems/canonical-keyboard-controller-v1.js', root)), 'utf8');
const boot = await readFile(fileURLToPath(new URL('src/systems/canonical-keyboard-boot.js', root)), 'utf8');
const legacyController = await readFile(fileURLToPath(new URL('src/systems/mobile-controls-controller.js', root)), 'utf8');
const index = await readFile(fileURLToPath(new URL('index.html', root)), 'utf8');

assert.match(owner, /MOBILE INPUT SINGLE OWNER V9/);
assert.match(controller, /CANONICAL KEYBOARD CONTROLLER V1/);
assert.match(controller, /W: \[87, 'w', 'KeyW'\]/);
assert.match(controller, /S: \[83, 's', 'KeyS'\]/);
assert.match(controller, /A: \[65, 'a', 'KeyA'\]/);
assert.match(controller, /D: \[68, 'd', 'KeyD'\]/);
assert.match(controller, /E: \[69, 'e', 'KeyE'\]/);
assert.match(controller, /F: \[70, 'f', 'KeyF'\]/);
assert.match(controller, /build2: KEY.TWO/);
assert.match(controller, /gadget2: KEY.FOUR/);
assert.match(controller, /landscape-first/);
assert.match(controller, /orientation: portrait/);
assert.match(controller, /data-mobile-action=\\"flight\\"/);
assert.match(controller, /data-mobile-action=\\"interact\\"/);
assert.match(boot, /__relayMobileInputSingleOwnerV9 = true/);
assert.match(legacyController, /DEPRECATED COMPATIBILITY SHIM/);
assert.match(index, /canonical-keyboard-boot\.js/);
assert.match(index, /canonical-keyboard-controller-v1\.js/);
assert.match(index, /data-mobile-action=\"interact\"/);
assert.match(index, /data-mobile-action=\"flight\"/);
assert.match(index, /data-mobile-action=\"build2\"/);
assert.match(index, /data-mobile-action=\"gadget2\"/);
assert.match(index, /data-mobile-joystick/);
assert.equal((index.match(/data-mobile-action=/g) || []).length, 9);

console.log('Canonical mobile action layout contract: PASS');
