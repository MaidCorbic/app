import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const state = await readFile(fileURLToPath(new URL('src/state.js', root)), 'utf8');
const patch = await readFile(fileURLToPath(new URL('special-event-credit-reward-patch.mjs', root)), 'utf8');
const vite = await readFile(fileURLToPath(new URL('vite.config.js', root)), 'utf8');

assert.match(state, /const modifierXp = runStats\.modifier\?\.xpBonus \|\| 0;/);
assert.match(state, /credits: state\.credits \+ credits \+ campaignCredits \+ rivalCredits,/);
assert.match(patch, /const modifierCredits = runStats\.modifier\?\.credits \|\| 0;/);
assert.match(patch, /campaignCredits \+ rivalCredits \+ modifierCredits/);
assert.match(patch, /modifier: modifierXp, modifierCredits, daily: 0, contract: contractXp,/);
assert.match(vite, /patchSpecialEventCreditReward/);
assert.match(vite, /relay-special-event-credit-reward-fix/);

console.log('Special event rewards: PASS');
