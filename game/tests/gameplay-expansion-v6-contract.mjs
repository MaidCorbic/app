import fs from 'node:fs';
import assert from 'node:assert/strict';

const file = fs.readFileSync(new URL('../src/systems/gameplay-expansion-v6-safe.js', import.meta.url), 'utf8');
const loader = fs.readFileSync(new URL('../gameplay-expansion-loader-v1.js', import.meta.url), 'utf8');

const features = [
  'disguiseIdentity','radioFrequency','signalTriangulation','witnessMemory','factionAccess',
  'identityCredentials','contrabandConcealment','negotiatedAccess','crowdInfluence','falseEvidencePlanting',
];
for (const key of features) assert.match(file, new RegExp(`['"]${key}['"]`), `${key} missing`);
for (const token of ['DISGUISE','RADIO','MEASURE-','WITNESS','FACTION','ID','CONTRABAND','OFFER','CROWD','EVIDENCE']) {
  assert.match(file, new RegExp(token), `visible gameplay marker ${token} missing`);
}
assert.match(loader, /installGameplayExpansionV6Safe\(RunnerScene\)/);
assert.match(file, /setInteractive/);
assert.doesNotMatch(file, /addEventListener\(['"]keydown['"]/i);
assert.match(file, /__relayGameplayExpansionV6Safe/);
assert.match(file, /destroy\?\.(?:\(\)|call)/);
console.log('Gameplay Expansion V6 contract passed');
