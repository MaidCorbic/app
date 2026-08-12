import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
const startHandlers = [...source.matchAll(/\$\('start'\)\.onclick = \(\) => \{([^}]+)\};/g)];
const continueHandlers = [...source.matchAll(/\$\('continue'\)\.onclick = \(\) => \{([^}]+)\};/g)];

assert.ok(startHandlers.length, 'Start Run needs a click handler');
assert.match(startHandlers.at(-1)[1], /game\.scene\.resume\('runner'\)/, 'Start Run must resume RunnerScene directly');
assert.doesNotMatch(startHandlers.at(-1)[1], /WorldMap|openPreflight/, 'Start Run must not route through map or pre-flight UI');
assert.ok(continueHandlers.length, 'Continue needs a click handler');
assert.match(continueHandlers.at(-1)[1], /launch\(nextMissionIndex\(\)\)/, 'Continue must launch the next mission directly');

console.log('Direct start flow regression checks passed.');
