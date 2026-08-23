import assert from 'node:assert/strict';
import { applyMissionCompletionIntegrity, reconcileProgressionState } from '../src/systems/progression-integrity.js';

const missions = [
  { id: 'first-delivery', abilityUnlock: ['dash', 'vault'] },
  { id: 'dead-drop', abilityUnlock: ['doubleJump', 'slide'] },
  { id: 'blackout', abilityUnlock: ['wallJump', 'wallRun'] },
];

const base = {
  completed: ['first-delivery'],
  abilities: ['dash'],
  loadout: { abilities: ['dash'] },
  daily: { date: '2026-08-23', progress: { dockTime: 0 }, claimed: [] },
};

const reconciled = reconcileProgressionState(base, missions);
assert.deepEqual(reconciled.abilities, ['dash', 'vault']);
assert.deepEqual(reconciled.loadout.abilities, ['dash', 'vault']);

const fast = applyMissionCompletionIntegrity(
  {
    ...reconciled,
    completed: ['first-delivery', 'dead-drop'],
    daily: { date: '2026-08-23', progress: { dockTime: 1 }, claimed: [] },
  },
  missions[1],
  missions,
  89_999,
);
assert.equal(fast.daily.progress.dockTime, 1);
assert.deepEqual(fast.abilities, ['dash', 'vault', 'doubleJump', 'slide']);

const slow = applyMissionCompletionIntegrity(
  {
    ...fast,
    daily: { date: '2026-08-23', progress: { dockTime: 1 }, claimed: [] },
  },
  missions[1],
  missions,
  90_001,
);
assert.equal(slow.daily.progress.dockTime, 0);

const migrated = reconcileProgressionState(
  {
    ...base,
    completed: ['first-delivery', 'dead-drop', 'blackout'],
    abilities: ['dash'],
    loadout: { abilities: ['dash'] },
  },
  missions,
);
assert.deepEqual(migrated.abilities, ['dash', 'vault', 'doubleJump', 'slide', 'wallJump', 'wallRun']);

console.log('Progression integrity tests passed.');
