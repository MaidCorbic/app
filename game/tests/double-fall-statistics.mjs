import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const core = await readFile(fileURLToPath(new URL('src/systems/core-stability.js', root)), 'utf8');

assert.match(core, /scene\.fail\('The courier fell into the relay void\.'\)/);
assert.doesNotMatch(core, /scene\.falls\s*=\s*Math\.max\(0, Number\(scene\.falls \|\| 0\) \+ 1/);
assert.match(core, /function inferDeathReason\(message\)/);
assert.match(core, /return 'fall';/);
assert.match(core, /applyDeathReasonCorrection\(this, reason, before\)/);

console.log('Double fall statistics: PASS');
