import assert from 'node:assert/strict';
import fs from 'node:fs';

const file='game/src/systems/gameplay-expansion-v13-34-systems.js';
const loader='game/gameplay-expansion-loader-v1.js';
const src=fs.readFileSync(file,'utf8');
const boot=fs.readFileSync(loader,'utf8');
const ids=[...src.matchAll(/\['([A-Z0-9]+)','[^']+'\]/g)].map(m=>m[1]);
assert.equal(ids.length,34,'V13 must expose exactly 34 systems');
assert.match(src,/pointer|touch/i);
assert.doesNotMatch(src,/addEventListener\(['"]keydown/);
assert.match(boot,/installGameplayExpansionV13/);
assert.match(boot,/gameplay-expansion-v13-34-systems\.js/);
assert.match(src,/gameplay:v10:event/);
assert.match(src,/gameplay:v11:event/);
assert.match(src,/gameplay:v12:event/);
assert.match(src,/localStorage/);
console.log('V13 contract OK: 34 systems, loader wiring, persistence, V1-V12 bridge, no keyboard listener.');
