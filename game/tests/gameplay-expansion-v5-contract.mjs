import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/systems/gameplay-expansion-v5-safe.js', import.meta.url), 'utf8');
const loader = await readFile(new URL('../gameplay-expansion-loader-v1.js', import.meta.url), 'utf8');

const required = ['stamina','fieldCrafting','vehicle','rescueCarry','lootExtraction','blackMarket','escort','fieldRepair','investigation'];
for (const feature of required) assert.match(source, new RegExp(feature), `Missing V5 feature: ${feature}`);
assert.match(source, /FUEL/);
assert.match(source, /CARGO/);
assert.match(source, /RESCUE/);
assert.match(source, /EXTRACTION/);
assert.match(source, /BLACK MARKET/);
assert.match(source, /ESCORT/);
assert.match(source, /FIELD REPAIR/);
assert.match(source, /EVIDENCE/);
assert.match(source, /INSPECT/);
assert.match(source, /pointerdown/);
assert.match(source, /shutdown/);
assert.match(source, /__relayGameplayExpansionV5SafeInstalled/);
assert.doesNotMatch(source, /keydown-/);
assert.match(loader, /installGameplayExpansionV4Safe\(RunnerScene\)/);
assert.match(loader, /installGameplayExpansionV5Safe\(RunnerScene\)/);
console.log('Gameplay Expansion V5 contract passed.');
