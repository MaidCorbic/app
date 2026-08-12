import assert from 'node:assert/strict';
import { enemyIntel, signatureThreats } from '../src/enemy-intel.js';
import { missions } from '../src/missions.js';

for (const mission of missions) {
  const type = signatureThreats[mission.id];
  assert.ok(type, `${mission.id} needs a signature threat`);
  const intel = enemyIntel[type];
  assert.ok(intel?.name && intel.attack && intel.defense && intel.tactic, `${type} needs a complete intel card`);
}

assert.ok(enemyIntel['dino-boss'], 'Boss dinosaurs need an intel profile');
console.log('Enemy intel coverage checks passed.');
