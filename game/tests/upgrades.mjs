import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const upgradesSource = await readFile(new URL('../src/upgrades.js', import.meta.url), 'utf8');
const runnerSource = await readFile(new URL('../src/scenes/RunnerScene.js', import.meta.url), 'utf8');
const ids = [...upgradesSource.matchAll(/id: '([^']+)'/g)].map(([, id]) => id);

for (const id of ids) assert.ok(runnerSource.includes(`'${id}'`), `${id} must have a RunnerScene runtime effect`);

console.log('Upgrade runtime coverage checks passed.');
