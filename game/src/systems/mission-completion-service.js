import { missions } from '../missions.js';
import { completeMission } from '../state.js';
import { applyMissionCompletionIntegrity, reconcileProgressionState } from './progression-integrity.js';

export function completeMissionCanonical(state, mission, signals, elapsedMs = 0, runStats = {}) {
  const normalizedStats = { ...runStats };
  const contractId = normalizedStats.contract?.id;

  if (contractId && state.contractStats?.[contractId]?.completed) {
    normalizedStats.contract = null;
    normalizedStats.contractCompleted = false;
  }

  let next = completeMission(
    state,
    mission,
    signals,
    elapsedMs,
    normalizedStats,
  );

  next = {
    ...next,
    unlockedMissions: missions
      .filter(missionDef => !missionDef.unlockRequirement || next.completed.includes(missionDef.unlockRequirement))
      .map(missionDef => missionDef.id),
  };

  next = applyMissionCompletionIntegrity(next, mission, missions, elapsedMs);
  return reconcileProgressionState(next, missions);
}
