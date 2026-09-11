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
]) assert.match(source, new RegExp(`['\"]${event}['\"]`));

assert.match(source, /relay:gameplay:v12/);
assert.match(source, /relay:gameplay:v11/);
assert.match(source, /gameplay:v12:event/);
assert.match(source, /new CustomEvent\('gameplay:v12:event'/);
assert.match(source, /localStorage/);
assert.match(source, /RunnerScene\.prototype\.create/);
assert.match(source, /__deepV12Installed/);
assert.ok(source.includes("scene.events?.once?.('shutdown'"), 'Missing V12 shutdown cleanup hook');
assert.ok(source.includes('listeners.forEach(off=>off())'), 'Missing V12 listener cleanup');
assert.ok(source.includes('scene.__deepV12={state,relay}'), 'Missing V12 runtime state bridge');
assert.doesNotMatch(source, /setInteractive|pointerdown|keydown|keyup|input\.keyboard|prototype\.update/);
assert.match(loader, /installGameplayDeepIntegrationV12/);
console.log('Deep gameplay V12 contract: PASS');
