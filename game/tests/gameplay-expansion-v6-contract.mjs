import fs from 'node:fs';
import assert from 'node:assert/strict';

const file = fs.readFileSync(new URL('../src/systems/gameplay-expansion-v6-safe.js', import.meta.url), 'utf8');
const loader = fs.readFileSync(new URL('../gameplay-expansion-loader-v1.js', import.meta.url), 'utf8');

const features = [
  'disguiseIdentity','radioFrequency','signalTriangulation','witnessMemory','factionAccess',
  'identityCredentials','contrabandConcealment','negotiatedAccess','crowdInfluence','falseEvidencePlanting',
];
for (const key of features) assert.match(file, new RegExp(`['"]${key}['"]`), `${key} missing`);

assert.match(loader, /installGameplayExpansionV6Safe\(RunnerScene\)/);
assert.match(file, /setInteractive/);
assert.match(file, /interactionZone/);
assert.doesNotMatch(file, /addEventListener\(['"]keydown['"]/i);
assert.match(file, /__relayGameplayExpansionV6Safe/);
assert.match(file, /destroy\?\.(?:\(\)|call)/);

for (const marker of [
  'IDENTITY: RUNNER',
  'MEASURE-',
  'TRIANGULATE',
  'SOURCE TRIANGULATED',
  'FREQ 00.0',
  'WITNESS: CALM',
  'ACCESS: DENIED',
  'CONTRABAND: EXPOSED',
  'ACCESS: UNDECIDED',
  'FLOW: BLOCKED',
  'PLANT: READY',
]) {
  assert.doesNotMatch(file, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${marker} must not render in gameplay`);
}

assert.match(file, /scene\.events\?\.emit\('relay:v6/);
console.log('Gameplay Expansion V6 marker-free contract passed');
