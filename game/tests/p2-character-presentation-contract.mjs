import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const character = read('p2-character-presentation-v4.js');
const relay = read('relay-ui-init.js');

assert.match(character, /P2 CHARACTER \/ PRESENTATION V4/);
assert.match(character, /singleCharacterPresentation/);
assert.match(character, /runner-run-a/);
assert.match(character, /runner-run-b/);
assert.match(character, /runner-jump/);
assert.match(character, /runner-fall/);
assert.match(character, /runner-dash/);
assert.match(character, /runner-hit/);
assert.match(character, /FLIGHT_STATES/);
assert.match(character, /toggleFlightMode\('mobile-p2'\)/);
assert.match(character, /relayP2CharacterHud/);
assert.match(character, /relayP2FlightButton/);
assert.match(character, /RunnerScene\.prototype\.create = function p2V4Create/);
assert.match(character, /RunnerScene\.prototype\.update = function p2V4Update/);
assert.match(character, /RunnerScene\.prototype\.shutdown = function p2V4Shutdown/);
assert.match(relay, /p2-character-presentation-v4\.js/);

console.log('P2 character/presentation contract: PASS');
