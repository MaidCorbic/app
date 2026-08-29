import assert from 'node:assert/strict';

// Contract test for the V10 module: the four distinct gameplay verbs must be exposed.
const source = await (await fetch(new URL('../src/systems/gameplay-expansion-v10-perception.js', import.meta.url))).text();
for (const token of ['mirror', 'symbols', 'memory', 'camera', 'pointerdown', 'keydown']) {
  assert.match(source, new RegExp(token), `V10 missing ${token}`);
}
console.log('V10 perception contract: PASS');
