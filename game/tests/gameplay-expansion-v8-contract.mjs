import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const systemPath = path.join(root, 'src', 'systems', 'gameplay-expansion-v8-systems.js');
const loaderPath = path.join(root, 'gameplay-expansion-loader-v1.js');
const source = fs.readFileSync(systemPath, 'utf8');
const loader = fs.readFileSync(loaderPath, 'utf8');

const features = [
  'SURVEILLANCE', 'ALARM', 'POWER GRID', 'WATER', 'NOISE', 'FOOTPRINTS',
  'FORENSICS', 'CHECKPOINT', 'TRANSIT', 'DEPLETION', 'OXYGEN', 'VENTILATION',
  'FIRE', 'NETWORK', 'SUPPRESSION',
];

for (const feature of features) assert.ok(source.includes(feature), `missing V8 feature: ${feature}`);
assert.match(source, /pointerdown/);
assert.match(source, /keydown/);
assert.match(source, /localStorage/);
assert.match(source, /setInteractive/);
assert.match(source, /export function installGameplayExpansionV8Systems/);
assert.match(loader, /installGameplayExpansionV8Systems/);
assert.match(loader, /gameplay-expansion-v8-systems\.js/);

console.log('V8 gameplay contract: 15 systems, touch, keyboard, persistence, loader wiring OK');
