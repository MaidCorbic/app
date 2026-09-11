import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const state = await readFile(fileURLToPath(new URL('src/state.js', root)), 'utf8');
const vite = await readFile(fileURLToPath(new URL('vite.config.mjs', root)), 'utf8');

assert.match(state, /const modifierXp\s*=\s*[\s\S]*?runStats\.modifier\?\.xpBonus/);
assert.match(state, /const modifierCredits\s*=\s*[\s\S]*?runStats\.modifier\?\.credits/);
assert.match(state, /campaignCredits\s*\+\s*rivalCredits\s*\+\s*modifierCredits/);
assert.match(state, /modifier:\s*modifierXp,\s*modifierCredits,\s*daily:\s*0,\s*contract:\s*contractXp,/);
assert.doesNotMatch(vite, /patchSpecialEventCreditReward|relay-special-event-credit-reward-fix/);

console.log('Special event rewards: PASS');
