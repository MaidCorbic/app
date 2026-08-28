import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/systems/gameplay-expansion-v3-safe.js', import.meta.url), 'utf8');
const loader = await readFile(new URL('../gameplay-expansion-loader-v1.js', import.meta.url), 'utf8');

for (const feature of ['bodySwap', 'clonePosition', 'massTransfer', 'phaseSplit', 'objectFusion', 'scaleShift', 'ruleInjection']) {
  assert.match(source, new RegExp(feature), `Missing V3 feature: ${feature}`);
}
for (const retired of ['momentumGate', 'companion', 'lightTraversal', 'courierHandoff']) {
  assert.doesNotMatch(source, new RegExp(retired), `V3 must not reintroduce retired overlapping feature: ${retired}`);
}
assert.match(loader, /installGameplayExpansion\(RunnerScene\)/);
assert.match(loader, /installGameplayExpansionV2Safe\(RunnerScene\)/);
assert.match(loader, /installGameplayExpansionV3Safe\(RunnerScene\)/);
assert.match(source, /__gameplayExpansionV3SafeInstalled/);
assert.match(source, /function installBodySwap/);
assert.match(source, /function installClonePosition/);
assert.match(source, /function installMassTransfer/);
assert.match(source, /function installPhaseSplit/);
assert.match(source, /function installObjectFusion/);
assert.match(source, /function installScaleShift/);
assert.match(source, /function installRuleInjection/);
assert.match(source, /function makeTextures/);
assert.match(source, /shutdown/);
console.log('Gameplay Expansion V3 contract passed.');
