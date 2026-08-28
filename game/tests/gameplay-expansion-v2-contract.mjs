import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/systems/gameplay-expansion-v2-safe.js', import.meta.url), 'utf8');
const loader = await readFile(new URL('../gameplay-expansion-loader-v1.js', import.meta.url), 'utf8');

for (const feature of ['magnetic', 'conveyor', 'rotation', 'rewind', 'phase', 'pressure', 'signalIntercept', 'weight']) {
  assert.match(source, new RegExp(`['\\\"]${feature}['\\\"]`), `Missing V2 feature: ${feature}`);
}

for (const retired of ['companion', 'lightTraversal', 'courierHandoff', 'momentumGate']) {
  assert.doesNotMatch(source, new RegExp(retired), `V2 must not reintroduce retired/overlapping feature: ${retired}`);
}

assert.match(loader, /installGameplayExpansion\(RunnerScene\)/);
assert.match(loader, /installGameplayExpansionV2Safe\(RunnerScene\)/);
assert.match(source, /__relayGameplayExpansionV2SafeInstalled/);
assert.match(source, /function installMagnetic/);
assert.match(source, /function installConveyor/);
assert.match(source, /function installRotation/);
assert.match(source, /function installRewind/);
assert.match(source, /function installPhase/);
assert.match(source, /function installPressure/);
assert.match(source, /function installSignalIntercept/);
assert.match(source, /function installWeight/);

console.log('Gameplay Expansion V2 contract passed.');
