import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const read = path => readFile(fileURLToPath(new URL(path, root)), 'utf8');

const main = await read('src/main.js');
const index = await read('index.html');
const ui = await read('relay-ui-init.js');
const runtime = await read('runtime-authority-v1.js');
const recovery = await read('src/systems/mission-finish-recovery.js');
const mobile = await read('src/systems/mobile-input-single-owner-v1.js');

// No duplicate mobile action declaration in static markup.
assert.equal((index.match(/data-mobile-action=/g) || []).length, 6);
assert.equal((ui.match(/mobile-input-single-owner-v1\.js/g) || []).length, 1);
assert.equal((index.match(/src\/systems\/mobile-input-single-owner-v1\.js/g) || []).length, 1);

// main.js must not inject another action node or own mobile action dispatch.
assert.doesNotMatch(main, /insertAdjacentHTML\([^\n]*data-mobile-action/);
assert.doesNotMatch(main, /game\.events\.emit\('mobile-action'/);
assert.doesNotMatch(main, /querySelectorAll\('\[data-mobile-action\]'\)/);

// Joystick remains available but has a single pointer owner and lifecycle release.
assert.match(main, /const joystick = document\.querySelector\('\[data-mobile-joystick\]'\)/);
assert.match(main, /if \(activePointerId !== null\) return/);
assert.match(main, /window\.addEventListener\('pagehide'/);
assert.match(mobile, /window\.__relayMobileInputSingleOwnerV9/);
assert.match(mobile, /seen\.has\(action\)/);

// Runtime authority rejects stale run completion and cleans scene state.
assert.match(runtime, /gameState\.delete\(game\)/);
assert.match(runtime, /sceneState\.delete\(scene\)/);
assert.match(runtime, /String\(activeRunId\) !== String\(emittedRunId\)/);
assert.match(recovery, /handledRunKey/);
assert.match(recovery, /alreadyPersisted/);

console.log('Runtime lifecycle / DOM audit: PASS');
