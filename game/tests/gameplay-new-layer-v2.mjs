import fs from 'node:fs';
import assert from 'node:assert/strict';

const file = fs.readFileSync(new URL('../gameplay-new-layer-v2.js', import.meta.url), 'utf8');
assert.match(file, /MOMENTUM CHAIN/);
assert.match(file, /NEAR MISS/);
assert.match(file, /CLUTCH/);
assert.match(file, /OVERDRIVE/);
assert.match(file, /RECOVERY LINE/);
assert.match(file, /RUN RECAP/);
assert.doesNotMatch(file, /RunnerScene|from ['"]phaser['"]/);
console.log('gameplay-new-layer-v2: OK');
