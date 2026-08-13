import assert from 'node:assert/strict';
import { missions } from '../src/missions.js';
import { packages } from '../src/packages.js';

for (const mission of missions) {
  assert.ok(mission.goal.x >= 6100, `${mission.id} needs an extended second sector`);
  assert.ok(mission.signals.length >= 20, `${mission.id} needs enough Signals for a long route`);
  assert.ok(mission.checkpoints.some(([x]) => x >= 4200), `${mission.id} needs recovery coverage in sector two`);
  assert.ok(mission.platforms.some(([x]) => x >= 4600), `${mission.id} needs elevated sector two traversal`);
  assert.ok(mission.checkpoints.length >= (mission.id === 'first-delivery' ? 2 : 2), `${mission.id} needs checkpoint coverage`);
  assert.ok(packages[mission.id], `${mission.id} needs a package profile`);
  assert.ok(mission.secrets.length >= 1 && mission.secrets.length <= 3, `${mission.id} needs 1-3 optional secrets`);
  assert.ok(mission.routeProfile?.normal && mission.routeProfile?.skill && mission.routeProfile?.recovery, `${mission.id} needs normal, skill, and recovery route coverage`);
  assert.ok(mission.story?.chapter && mission.story?.arrival && mission.story?.completion, `${mission.id} needs a complete story beat`);
  assert.ok(mission.story.radio?.length >= 3, `${mission.id} needs three in-run narrative beats`);
  assert.ok(mission.story.tutorial?.length >= 2, `${mission.id} needs contextual tutorial guidance`);
  assert.ok(mission.guides.length >= 5, `${mission.id} needs readable route guidance`);
  for (const [x, y, upperY, lowerY] of mission.movingGates) assert.ok(x > 600 && y > upperY && lowerY >= y, `${mission.id} moving gates need a readable vertical cycle`);
  for (let index = 1; index < mission.obstacles.length; index++) assert.ok(mission.obstacles[index][0] - mission.obstacles[index - 1][0] >= 400, `${mission.id} hazards need reaction space`);
  if (mission.chase) for (const section of mission.chase.sections) {
    assert.ok(section.start >= 800 && section.end - section.start >= 700, `${mission.id} chase section must be readable`);
    assert.ok(mission.checkpoints.some(([x]) => x >= section.start - 120 && x < section.start) || mission.checkpoints.some(([x]) => x > section.end && x <= section.end + 260), `${mission.id} chase needs a nearby recovery checkpoint`);
  }
  if (mission.id !== 'first-delivery' && mission.id !== 'dead-drop') assert.ok(mission.boss?.type && mission.boss.health > 0 && mission.boss.name, `${mission.id} needs a distinct route boss`);
}

assert.equal(missions.map(mission => mission.difficulty.split(' ')[0]).join(','), '1/5,2/5,3/5,4/5,5/5,6/5,7/5');
console.log('Mission flow and fairness checks passed.');
