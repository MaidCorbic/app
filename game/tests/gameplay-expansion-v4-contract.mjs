import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/systems/gameplay-expansion-v4-safe.js', import.meta.url), 'utf8');
const loader = await readFile(new URL('../gameplay-expansion-loader-v1.js', import.meta.url), 'utf8');
const compat = await readFile(new URL('../src/systems/gameplay-expansion-v3-input-compat.js', import.meta.url), 'utf8');

const required = [
  'echoScan', 'surfacePhysics', 'temperatureSystem', 'objectDuplication',
  'trajectoryPreview', 'sonicPushPull', 'remoteCamera', 'objectRotation',
  'surfacePhaseMarking', 'impactBanking',
];
for (const feature of required) assert.match(source, new RegExp(feature), `Missing V4 feature: ${feature}`);

assert.match(source, /GRIP/);
assert.match(source, /SLICK/);
assert.match(source, /THERMAL STATE/);
assert.match(source, /lastTransfer/);
assert.match(source, /TRAJECTORY PREVIEW/);
assert.match(source, /REMOTE CAMERA/);
assert.match(source, /OBJECT ROTATION/);
assert.match(source, /SURFACE PHASE/);
assert.match(source, /IMPACT BANK/);
assert.match(source, /shutdown/);
assert.match(source, /__relayGameplayExpansionV4SafeInstalled/);
assert.doesNotMatch(source, /keydown-/);

assert.match(loader, /installGameplayExpansion\(RunnerScene\)/);
assert.match(loader, /installGameplayExpansionV2Safe\(RunnerScene\)/);
assert.match(loader, /installGameplayExpansionV3Safe\(RunnerScene\)/);
assert.match(loader, /installGameplayExpansionV3InputCompat\(RunnerScene\)/);
assert.match(loader, /installGameplayExpansionV4Safe\(RunnerScene\)/);

assert.match(compat, /from '\.\.\/scenes\/RunnerScene\.js'/);
assert.doesNotMatch(compat, /from '\.\/src\/scenes\/RunnerScene\.js'/);

console.log('Gameplay Expansion V4 contract passed.');
