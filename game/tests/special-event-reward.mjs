import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const state = await readFile(fileURLToPath(new URL('src/state.js', root)), 'utf8');
const vite = await readFile(fileURLToPath(new URL('vite.config.mjs', root)), 'utf8');

assert.match(state, /const modifierXp = runStats\.modifier\?\.xpBonus \|\| 0;/);
assert.match(state, /const modifierCredits = runStats\.modifier\?\.credits \|\| 0;/);
assert.match(state, /campaignCredits \+ rivalCredits \+ modifierCredits/);
assert.match(state, /modifier: modifierXp, modifierCredits, daily: 0, contract: contractXp,/);
assert.doesNotMatch(vite, /patchSpecialEventCreditReward|relay-special-event-credit-reward-fix/);

console.log('Special event rewards: PASS');
