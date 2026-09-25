import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const character = read('p2-character-presentation-v1.js');
const relay = read('relay-ui-init.js');

assert.match(character, /singleCharacterPresentation/);
assert.match(character, /runner-run-a/);
assert.match(character, /runner-run-b/);
assert.match(character, /runner-dash/);
assert.match(character, /KeyF/);
assert.match(character, /flightActive/);
assert.match(character, /setGravityY/);
assert.match(character, /WINGS DEPLOYED/);
assert.match(relay, /p2-character-presentation-v1\.js/);

console.log('P2 character/presentation contract: PASS');
