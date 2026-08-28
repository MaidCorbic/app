import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const character = read('p2-character-presentation-v1.js');
const ux = read('p2-ux-controls-v1.js');
const relay = read('relay-ui-init.js');

assert.match(character, /singleCharacterPresentation/);
assert.match(character, /runner-run-a/);
assert.match(character, /runner-run-b/);
assert.match(character, /runner-dash/);
assert.match(character, /KeyF/);
assert.match(character, /flightActive/);
assert.match(character, /setGravityY/);
assert.match(character, /WINGS DEPLOYED/);
assert.match(ux, /relay\.runner\.ui\.preferences\.v1/);
assert.match(ux, /intelCards/);
assert.match(ux, /allyIntel/);
assert.match(ux, /eventPopups/);
assert.match(ux, /tutorialHints/);
assert.match(ux, /relay-hide-intel/);
assert.doesNotMatch(ux, /scene\.pause\(/);
assert.match(relay, /p2-character-presentation-v1\.js/);
assert.match(relay, /p2-ux-controls-v1\.js/);

console.log('P2 character/presentation contract: PASS');
