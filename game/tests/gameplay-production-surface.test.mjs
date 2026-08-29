import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');
const v11 = read('game/src/systems/gameplay-expansion-v11-twenty.js');
const v12 = read('game/src/systems/gameplay-deep-integration-v12.js');
const v13 = read('game/src/systems/gameplay-expansion-v13-34-systems.js');
const newLayer = read('game/gameplay-new-layer-v2.js');
const p1 = read('game/p1-gameplay-correctness-v1.js');
const visibility = read('game/gameplay-ui-visibility-v3.js');

for (const source of [v11, v12, v13]) {
  assert.doesNotMatch(source, /gameplay-v1[123]-panel/);
  assert.doesNotMatch(source, /V1[123] \/\/ /);
}

assert.doesNotMatch(newLayer, /requestAnimationFrame/);
assert.doesNotMatch(p1, /requestAnimationFrame/);
assert.doesNotMatch(visibility, /new MutationObserver/);
assert.doesNotMatch(visibility, /attributeFilter:\s*\['class','style','hidden'\]/);
assert.match(visibility, /gameplayEventHud/);
assert.match(visibility, /energy-bar/);

console.log('Gameplay production surface contract OK: no V11/V12/V13 developer HUDs, no frame HUD loops, bounded UI observer removed.');
