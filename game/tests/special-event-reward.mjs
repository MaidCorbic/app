import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const state = await readFile(fileURLToPath(new URL('src/state.js', root)), 'utf8');

assert.match(state, /const modifierXp = runStats\.modifier\?\.xpBonus \|\| 0;/);
assert.match(state, /const modifierCredits = runStats\.modifier\?\.credits \|\| 0;/);
assert.match(state, /credits: state\.credits \+ credits \+ campaignCredits \+ rivalCredits \+ modifierCredits/);
assert.match(state, /modifierCredits: modifierCredits/);

console.log('Special event rewards: PASS');
