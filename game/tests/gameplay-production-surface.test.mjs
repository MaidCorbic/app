import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=file=>fs.readFileSync(file,'utf8');
const v11=read('game/src/systems/gameplay-expansion-v11-twenty.js');
const v12=read('game/src/systems/gameplay-deep-integration-v12.js');
const v13=read('game/src/systems/gameplay-expansion-v13-34-systems.js');
const layer=read('game/gameplay-new-layer-v2.js');
const p1=read('game/p1-gameplay-correctness-v1.js');
const visibility=read('game/gameplay-ui-visibility-v3.js');
for(const source of [v11,v12,v13]){assert.doesNotMatch(source,/gameplay-v1[123]-panel/);assert.doesNotMatch(source,/V1[123] \/\/ /);}
assert.doesNotMatch(layer,/requestAnimationFrame/);
assert.doesNotMatch(p1,/requestAnimationFrame/);
assert.doesNotMatch(visibility,/new MutationObserver/);
assert.match(visibility,/gameplayEventHud/);
assert.match(visibility,/energy-bar/);
console.log('Gameplay production surface contract OK.');
