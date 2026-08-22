import { missions } from '../missions.js';
import { loadState, saveState } from '../state.js';

const MASTERY_MIGRATIONS = {
  'signal-hunter': 'SIGNAL SWEEP',
  'speed-run': 'PAR TIME',
  'clean-run': 'CLEAN RUN',
};

function asArray(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function expectedAbilities(completed) {
  const completedSet = new Set(completed || []);
  return missions
    .filter(mission => completedSet.has(mission.id))
    .flatMap(mission => asArray(mission.abilityUnlock));
}

function migrateMastery(mastery) {
  let changed = false;
  const next = {};

  for (const [missionId, badges] of Object.entries(mastery || {})) {
    const source = Array.isArray(badges) ? badges : [];
    const migrated = [...new Set(source.map(badge => MASTERY_MIGRATIONS[badge] || badge))];
    if (JSON.stringify(migrated) !== JSON.stringify(source)) changed = true;
    next[missionId] = migrated;
  }

  return { value: next, changed };
}

export function repairProgressionState(state) {
  let changed = false;
  const mastery = migrateMastery(state.mastery);
  changed ||= mastery.changed;

  const unlocked = new Set(state.abilities || []);
  for (const ability of expectedAbilities(state.completed)) {
    if (!unlocked.has(ability)) {
      unlocked.add(ability);
      changed = true;
    }
  }

  const abilities = [...unlocked];
  const lastAbilityUnlock = abilities.length && abilities[abilities.length - 1] !== (state.abilities || [])[((state.abilities || []).length - 1)]
    ? abilities[abilities.length - 1]
    : state.lastAbilityUnlock;

  const next = {
    ...state,
    abilities,
    mastery: mastery.value,
    lastAbilityUnlock,
  };

  return { state: next, changed };
}

function repairDailyDeadDropTime(state, scene) {
  if (!scene?.mission?.id || scene.mission.id !== 'dead-drop') return { state, changed: false };
  const elapsedMs = Number(scene.elapsedMs) || 0;
  if (elapsedMs <= 90000) return { state, changed: false };

  const daily = state.daily;
  const current = Number(daily?.progress?.dockTime || 0);
  if (!daily || current <= 0) return { state, changed: false };

  return {
    state: {
      ...state,
      daily: {
        ...daily,
        progress: { ...daily.progress, dockTime: current - 1 },
      },
    },
    changed: true,
  };
}

function repairAfterMissionComplete(event) {
  const scene = event.detail?.scene;
  const missionId = event.detail?.missionId;
  if (!missionId) return;

  const mission = missions.find(entry => entry.id === missionId);
  if (!mission) return;

  let state = loadState();
  const repaired = repairProgressionState(state);
  state = repaired.state;

  const dailyRepair = repairDailyDeadDropTime(state, scene);
  state = dailyRepair.state;

  if (repaired.changed || dailyRepair.changed) saveState(state);
}

export function installGameplayProgressionRepair() {
  if (typeof window === 'undefined') return;
  if (window.__relayGameplayProgressionRepair) return;
  window.__relayGameplayProgressionRepair = true;

  const initial = repairProgressionState(loadState());
  if (initial.changed) saveState(initial.state);

  window.addEventListener('relay:mission-complete', repairAfterMissionComplete);
}

installGameplayProgressionRepair();
