import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const source = await readFile(fileURLToPath(new URL('src/systems/mission-finish-recovery.js', root)), 'utf8');

assert.match(source, /clearTimeout\(timer\)/);
assert.match(source, /MutationObserver/);
assert.match(source, /attributeFilter: \['class'\]/);
assert.match(source, /beforeunload/);
assert.match(source, /function showRecoveredFinish\(scene\)/);
assert.match(source, /handledRunKey/);
assert.match(source, /play\?\.classList\.add\('hidden'\)/);
assert.match(source, /finish\.classList\.remove\('hidden'\)/);
assert.match(source, /runKey\(scene\)/);

console.log('Mission finish recovery lifecycle contract: PASS');
