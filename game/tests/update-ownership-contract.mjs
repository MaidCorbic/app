import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const faq = await read('faq.js');
const relayUi = await read('relay-ui-init.js');
const featureRuntime = await read('src/feature-runtime.js');
const coreStability = await read('src/systems/core-stability.js');
const mobileInput = await read('src/systems/mobile-input-single-owner-v1.js');
const main = await read('src/main.js');
const release = await read('src/config/release.js');

assert.match(faq, /LATEST_UPDATE/);
assert.match(faq, /UPDATE_CHANNEL/);
assert.match(relayUi, /LATEST_UPDATE/);
assert.match(relayUi, /data-relay-info/);

assert.match(featureRuntime, /installEnemyAIAwareness\(RunnerScene\)/);
assert.match(coreStability, /import '\.\.\/feature-runtime\.js'/);
assert.match(mobileInput, /__relayMobileInputSingleOwnerV9/);

// One active mobile input owner. main.js may contain legacy boot code for
// compatibility, but it must explicitly document that the single-owner system
// replaces the original DOM nodes.
assert.match(main, /Mobile input ownership lives exclusively/);
assert.match(main, /Do not create a second action dispatcher/);

// Release metadata exists as the canonical place for future visible version changes.
assert.match(release, /GAME_VERSION\s*=\s*['"]1\.1\.0['"]/);

console.log('Update ownership + latest-update wiring: PASS');
