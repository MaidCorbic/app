import assert from 'node:assert/strict';
import { missions } from '../src/missions.js';

for (const mission of missions) {
  assert.ok(mission.id, 'mission id is required');
  assert.ok(Number.isFinite(mission.parTime) && mission.parTime > 0, `${mission.id}: invalid parTime`);
  assert.ok(mission.spawn && Number.isFinite(mission.spawn.x) && Number.isFinite(mission.spawn.y), `${mission.id}: invalid spawn`);
  assert.ok(mission.goal && Number.isFinite(mission.goal.x) && Number.isFinite(mission.goal.y), `${mission.id}: invalid goal`);
  assert.ok(mission.routeProfile?.normal && mission.routeProfile?.skill && mission.routeProfile?.recovery, `${mission.id}: incomplete route profile`);

  const fast = mission.optionalObjectives?.find(objective => objective.type === 'fast');
  assert.ok(fast, `${mission.id}: fast mastery objective missing`);
  assert.equal(fast.label, `Finish under ${Math.floor(mission.parTime / 1000)} seconds`, `${mission.id}: fast objective label must match actual parTime`);

  const required = new Set(mission.requiredAbilities || []);
  if (required.size) assert.ok(mission.unlockRequirement, `${mission.id}: required abilities need a mission dependency`);
  assert.notEqual(mission.unlockRequirement, mission.id, `${mission.id}: cannot unlock itself`);
}

assert.equal(new Set(missions.map(mission => mission.id)).size, missions.length, 'mission ids must be unique');
console.log('Gameplay/mobile repair contract checks passed.');
