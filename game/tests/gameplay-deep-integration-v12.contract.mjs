import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/systems/gameplay-deep-integration-v12.js', import.meta.url), 'utf8');
const loader = await readFile(new URL('../gameplay-expansion-loader-v1.js', import.meta.url), 'utf8');

assert.match(source, /const KEY='relay\.gameplay\.deep\.v12';/);
for (const token of [
  'noise', 'heat', 'footprints', 'obstacles', 'route', 'branch', 'cover', 'momentum',
  'recovery', 'decoys', 'contactTrust', 'method', 'cargoRisk', 'emergency',
  'opportunities', 'chain', 'falseCargo', 'loadout', 'timeDebt', 'markers', 'actions',
]) assert.match(source, new RegExp(token));

for (const event of [
  'feedback', 'dash-start', 'dash-end', 'slide-jump', 'breakable-destroyed', 'game-over',
  'complete', 'energy', 'ammo', 'signal-network', 'signal-network-node', 'signal-network-complete',
]) assert.match(source, new RegExp(`['"]${event}['"]`));

assert.match(source, /relay:gameplay:v12/);
assert.match(source, /relay:gameplay:v11/);
assert.match(source, /gameplay:v12:event/);
assert.match(source, /new CustomEvent\('gameplay:v12:event'/);
assert.match(source, /localStorage/);
assert.match(source, /RunnerScene\.prototype\.create/);
assert.match(source, /__deepV12Installed/);
assert.match(source, /scene\.events\?\.once\?\('shutdown'/);
assert.match(source, /listeners\.forEach\(off=>off\(\)\)/);
assert.match(source, /scene\.__deepV12=\{state,relay\}/);
assert.doesNotMatch(source, /setInteractive|pointerdown|keydown|keyup|input\.keyboard|prototype\.update/);
assert.match(loader, /installGameplayDeepIntegrationV12/);
console.log('Deep gameplay V12 contract: PASS');
