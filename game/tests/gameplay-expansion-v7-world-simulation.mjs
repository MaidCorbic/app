import fs from 'node:fs';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const runtime = fs.readFileSync(new URL('../src/systems/gameplay-expansion-v7-world-simulation.js', root), 'utf8');
const loader = fs.readFileSync(new URL('../gameplay-expansion-loader-v1.js', root), 'utf8');

const required = [
  'ECONOMY',
  'REPUTATION',
  'WORLD DAMAGE',
  'NPC SCHEDULE',
  'RUMORS',
  'WEATHER ROUTE',
  'SAFEHOUSE',
  'CONTACTS',
];

for (const feature of required) assert.ok(runtime.includes(feature), `V7 feature missing: ${feature}`);
assert.match(runtime, /localStorage/);
assert.match(runtime, /pointerdown/);
assert.match(runtime, /__relayV7WeatherGate/);
assert.match(runtime, /__relayV7ScheduleAgents/);
assert.doesNotMatch(runtime, /addEventListener\(['"]keydown/);
assert.match(loader, /installGameplayExpansionV7WorldSimulation/);

console.log('Gameplay Expansion V7 world simulation contract: PASS');
