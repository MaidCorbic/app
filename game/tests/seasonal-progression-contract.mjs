import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { patchSeasonalProgression } from '../seasonal-progression-patch.mjs';

const root = new URL('../', import.meta.url);
const source = await readFile(fileURLToPath(new URL('src/state.js', root)), 'utf8');
const transformed = patchSeasonalProgression(source);

assert.notEqual(transformed, source, 'seasonal progression source must be transformed');
assert.match(transformed, /const completedRoutes = \[\.\.\.new Set\(state\.completed \|\| \[\]\)\]/);
assert.match(transformed, /const masteryCount = Object\.values\(state\.mastery \|\| \{\}\)/);
assert.match(transformed, /routes: nextCompletedRoutes\.length/);
assert.match(transformed, /mastery: Math\.max\(seasonal\.progress\?\.mastery \|\| 0, masteryCount\)/);
assert.doesNotMatch(transformed, /mastery: 0/);

console.log('Seasonal progression contract: PASS');
