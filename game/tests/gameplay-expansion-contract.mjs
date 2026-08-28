import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/systems/gameplay-expansion-v1.js', import.meta.url), 'utf8');

for (const feature of ['train', 'crane', 'traffic', 'zipline', 'throwable', 'laserSweep', 'movingRelay', 'handoff', 'elevator', 'soundPressure']) {
  assert.match(source, new RegExp(`['\"]${feature}['\"]`), `Expansion feature missing: ${feature}`);
}

for (const retired of ['companion', 'lightTraversal', 'courierHandoff']) {
  assert.doesNotMatch(source.match(/const FEATURE_LAYOUT = \{[\s\S]*?\n\};/)?.[0] || '', new RegExp(retired), `Overlapping feature still assigned in layout: ${retired}`);
}

assert.match(source, /installZipline/);
assert.match(source, /installLaserSweep/);
assert.match(source, /installSoundPressure/);
assert.match(source, /__relayGameplayExpansionInstalled/);

console.log('Gameplay expansion uniqueness contract passed.');
