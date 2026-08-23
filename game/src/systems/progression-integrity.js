const VALID_ABILITY_KEYS = new Set([
  'dash',
  'vault',
  'doubleJump',
  'slide',
  'wallJump',
  'wallRun',
  'airDash',
  'ledgeGrab',
]);

export function abilitiesUnlockedFromCompleted(state, missions) {
  const completed = new Set(Array.isArray(state?.completed) ? state.completed : []);
  return missions
    .filter(mission => completed.has(mission.id))
    .flatMap(mission => Array.isArray(mission.abilityUnlock) ? mission.abilityUnlock : [])
    .filter(ability => VALID_ABILITY_KEYS.has(ability));
}

export function reconcileProgressionState(state, missions) {
  const existing = Array.isArray(state?.abilities) ? state.abilities : [];
  const unlocked = abilitiesUnlockedFromCompleted(state, missions);
  const abilities = [...new Set([...existing, ...unlocked])];
  const same = abilities.length === existing.length && abilities.every((value, index) => value === existing[index]);
  if (same) return state;
  return {
    ...state,
    abilities,
    loadout: { ...(state.loadout || {}), abilities },
  };
}

export function applyMissionCompletionIntegrity(state, mission, missions, elapsedMs = 0) {
  let next = reconcileProgressionState(state, missions);

  const missionAbilities = Array.isArray(mission?.abilityUnlock) ? mission.abilityUnlock : [];
  if (missionAbilities.length) {
    const before = new Set(state.abilities || []);
    const abilities = [...new Set([...(next.abilities || []), ...missionAbilities])];
    next = {
      ...next,
      abilities,
      loadout: { ...(next.loadout || {}), abilities },
      lastAbilityUnlock: missionAbilities.find(ability => !before.has(ability)) || next.lastAbilityUnlock || null,
    };
  }

  // completeMission() currently increments dockTime for every Dead Drop run.
  // Only runs completed in <= 90 seconds should count for that daily challenge.
  if (mission?.id === 'dead-drop' && Number(elapsedMs) > 90_000) {
    const daily = next.daily || { date: null, progress: {}, claimed: [] };
    const progress = daily.progress || {};
    const dockTime = Math.max(0, Number(progress.dockTime || 0) - 1);
    next = {
      ...next,
      daily: {
        ...daily,
        progress: { ...progress, dockTime },
      },
    };
  }

  return next;
}
