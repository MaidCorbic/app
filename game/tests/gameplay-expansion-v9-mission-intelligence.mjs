import fs from 'node:fs';
import assert from 'node:assert/strict';
const system=fs.readFileSync(new URL('../src/systems/gameplay-expansion-v9-mission-intelligence.js',import.meta.url),'utf8');
assert.match(system,/installGameplayExpansionV9MissionIntelligence/);
assert.match(system,/INTEL VERIFY/); assert.match(system,/DELAYED TRIGGER/); assert.match(system,/REPLAY GHOST/);
assert.match(system,/pointerdown/); assert.match(system,/keydown/); assert.match(system,/localStorage/);
console.log('V9 mission intelligence contract: PASS');
