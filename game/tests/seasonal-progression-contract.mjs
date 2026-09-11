import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const source = await readFile(fileURLToPath(new URL('src/state.js', root)), 'utf8');

assert.match(source, /const completedRoutes = \[\.\.\.new Set\(state\.completed \|\| \[\]\)\]/);
assert.match(source, /const masteryCount = Object\.values\(state\.mastery \|\| \{\}\)/);
assert.match(source, /routes: nextCompletedRoutes\.length/);
assert.match(source, /mastery: Math\.max\(seasonal\.progress\?\.mastery \|\| 0, masteryCount\)/);
assert.doesNotMatch(source, /mastery: 0/);

console.log('Seasonal progression contract: PASS');
