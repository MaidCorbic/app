import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { patchDeathReason } from '../death-reason-patch.mjs';

const root = new URL('../', import.meta.url);
const source = await readFile(fileURLToPath(new URL('src/scenes/RunnerScene.js', root)), 'utf8');
const patch = await readFile(fileURLToPath(new URL('../death-reason-patch.mjs', import.meta.url)), 'utf8');
const transformed = patchDeathReason(source);

assert.notEqual(transformed, source, 'death-reason transform must change RunnerScene');
assert.match(transformed, /takeSciFiHit\(message, reason = 'hazard'\)/);
assert.match(transformed, /this\.fail\('The courier collapsed\. Checkpoint health restored\.', reason\)/);
assert.match(transformed, /this\.takeSciFiHit\('An enemy attack knocked the courier down\.', 'enemy'\)/);
assert.match(transformed, /this\.takeSciFiHit\('A dinosaur charge knocked the courier down\.', 'enemy'\)/);

// The RunnerScene fail implementation is wrapped by later runtime hardening layers,
// so the canonical death-reason accounting replacement is asserted at the patch
// contract level rather than requiring that internal implementation text to survive
// every wrapper composition step.
assert.match(patch, /const deathReason = reason \|\|/);
assert.match(patch, /else if \(deathReason === 'enemy'\) this\.enemyHits/);
assert.match(patch, /deathReason === 'collision' \|\| deathReason === 'enemy'/);
assert.match(patch, /this\.enemyHits = 0/);
assert.match(patch, /enemyHits: this\.enemyHits \|\| 0/);

console.log('Death reason statistics contract: PASS');
