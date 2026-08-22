const AUTHORITATIVE_PAR_TIMES = {
  'first-delivery': 70000,
  'dead-drop': 78000,
  blackout: 85000,
  pursuit: 82000,
  'signal-storm': 90000,
  'corporate-lockdown': 98000,
  'final-relay': 105000,
};

export function normalizeMission(mission) {
  if (!mission || typeof mission !== 'object') return mission;

  mission.primaryObjective ??= {
    type: 'reach-goal',
    label: mission.objective || 'REACH THE RELAY'
  };

  mission.routeProfile ??= {};
  mission.routeProfile.normal ??= 'Follow the marked route.';
  mission.routeProfile.skill ??= 'Take the faster high line when safe.';
  mission.routeProfile.recovery ??= 'Use checkpoints to recover the run.';

  // The route factory previously added 32s to every authored par time. Keep the
  // authored mission values authoritative without rewriting missions.js in place.
  const authoredParTime = AUTHORITATIVE_PAR_TIMES[mission.id];
  if (authoredParTime && mission.parTime === authoredParTime + 32000) {
    mission.parTime = authoredParTime;
  }

  mission.abilityUnlock = Array.isArray(mission.abilityUnlock)
    ? mission.abilityUnlock
    : mission.abilityUnlock
      ? [mission.abilityUnlock]
      : [];

  mission.deathLimit ??= mission.tutorial ? Infinity : 3;

  // First Delivery must not teach Slide: Slide is unlocked by Dead Drop.
  if (mission.id === 'first-delivery' && mission.story?.tutorial) {
    mission.story.tutorial = mission.story.tutorial.map(line =>
      String(line).includes('SLIDE UNDER DANGER')
        ? [line[0], 'LOW LINE · STAY ON THE SAFE GROUND ROUTE.']
        : line
    );
  }

  const fast = mission.optionalObjectives?.find(objective => objective?.type === 'fast');
  if (fast && Number.isFinite(mission.parTime)) {
    fast.label = `Finish under ${Math.floor(mission.parTime / 1000)} seconds`;
  }

  mission.mastery ??= {
    signals: Boolean(mission.optionalObjectives?.some(objective => objective?.type === 'allSignals')),
    speed: Boolean(fast),
    jumps: Boolean(mission.optionalObjectives?.some(objective => objective?.type === 'jumps')),
    secrets: Array.isArray(mission.secrets) && mission.secrets.length > 0
  };

  return mission;
}

export function validateMissionContracts(list) {
  const errors = [];
  const ids = new Set();

  for (const mission of list) {
    if (!mission?.id) errors.push('Mission is missing id');
    if (ids.has(mission.id)) errors.push(`${mission.id}: duplicate mission id`);
    ids.add(mission.id);

    if (!mission.spawn || !Number.isFinite(mission.spawn.x) || !Number.isFinite(mission.spawn.y)) {
      errors.push(`${mission.id}: invalid spawn`);
    }
    if (!mission.goal || !Number.isFinite(mission.goal.x) || !Number.isFinite(mission.goal.y)) {
      errors.push(`${mission.id}: invalid goal`);
    }
    if (!Number.isFinite(mission.parTime) || mission.parTime <= 0) {
      errors.push(`${mission.id}: invalid parTime`);
    }
    if (!mission.primaryObjective?.label) {
      errors.push(`${mission.id}: missing primary objective`);
    }
    if (!mission.routeProfile?.normal || !mission.routeProfile?.skill || !mission.routeProfile?.recovery) {
      errors.push(`${mission.id}: incomplete route profile`);
    }

    for (const ability of mission.abilityUnlock) {
      if (!ability) errors.push(`${mission.id}: empty ability unlock`);
    }
    if (mission.unlockRequirement === mission.id) {
      errors.push(`${mission.id}: cannot unlock itself`);
    }
    if ((mission.requiredAbilities || []).length && !mission.unlockRequirement) {
      errors.push(`${mission.id}: required abilities need an unlock dependency`);
    }
  }

  return errors;
}

export function normalizeAndValidateMissions(missions) {
  missions.forEach(normalizeMission);
  return validateMissionContracts(missions);
}
