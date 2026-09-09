import { missions } from './missions.js';

// Build-safe progression state.
// Canonical owner for persistent progression, XP, levels, ranks,
// mission completion, mastery, district progression, challenges,
// achievements and progression event snapshots.

const key = 'relay-runner-state';

const districts = [
  {
    id: 'old-city',
    unlockMission: null,
    missions: ['first-delivery'],
  },
  {
    id: 'industrial',
    unlockMission: 'first-delivery',
    missions: ['dead-drop'],
  },
  {
    id: 'downtown',
    unlockMission: 'dead-drop',
    missions: ['blackout'],
  },
  {
    id: 'corporate',
    unlockMission: 'blackout',
    missions: ['pursuit'],
  },
  {
    id: 'residential',
    unlockMission: 'pursuit',
    missions: ['signal-storm'],
  },
  {
    id: 'apex',
    unlockMission: 'signal-storm',
    missions: ['corporate-lockdown', 'final-relay'],
  },
];

const rivalMissionIds = new Set([
  'dead-drop',
  'pursuit',
  'signal-storm',
  'corporate-lockdown',
  'final-relay',
]);

const campaignRewards = [
  {
    id: 'chapter-one',
    missions: ['first-delivery', 'dead-drop'],
    xp: 75,
    credits: 30,
  },
  {
    id: 'chapter-two',
    missions: ['blackout', 'pursuit'],
    xp: 125,
    credits: 50,
  },
  {
    id: 'chapter-three',
    missions: ['signal-storm'],
    xp: 200,
    credits: 80,
  },
  {
    id: 'chapter-four',
    missions: ['corporate-lockdown', 'final-relay'],
    xp: 350,
    credits: 150,
  },
];

export const MAX_LEVEL = 100;

export const dailyChallenges = [
  {
    id: 'signals',
    label: 'Collect 50 Signals',
    target: 50,
    xp: 80,
    credits: 35,
  },
  {
    id: 'contracts',
    label: 'Finish 3 Contracts',
    target: 3,
    xp: 100,
    credits: 50,
  },
  {
    id: 'clean',
    label: 'Complete a clean run',
    target: 1,
    xp: 65,
    credits: 30,
  },
  {
    id: 'dockTime',
    label: 'Finish Dead Drop under 90 seconds',
    target: 1,
    xp: 75,
    credits: 35,
  },
];

export const monthlyChallenges = [
  {
    id: 'runs',
    label: 'Complete 20 deliveries',
    target: 20,
    xp: 450,
    credits: 180,
  },
  {
    id: 'signals',
    label: 'Capture 400 Signals',
    target: 400,
    xp: 600,
    credits: 240,
  },
  {
    id: 'bosses',
    label: 'Defeat 8 route bosses',
    target: 8,
    xp: 750,
    credits: 300,
  },
];

export const weeklyChallenges = [
  {
    id: 'runs',
    label: 'Complete 8 deliveries',
    target: 8,
    xp: 220,
    credits: 90,
  },
  {
    id: 'signals',
    label: 'Capture 150 Signals',
    target: 150,
    xp: 280,
    credits: 110,
  },
  {
    id: 'clean',
    label: 'Complete 4 clean runs',
    target: 4,
    xp: 260,
    credits: 105,
  },
];

export const loginRewards = [25, 35, 50, 65, 85, 110, 160];

export const seasonalChallenges = [
  {
    id: 'routes',
    label: 'Secure every city route',
    target: 7,
    xp: 1200,
    credits: 500,
  },
  {
    id: 'mastery',
    label: 'Earn 12 mastery badges',
    target: 12,
    xp: 1000,
    credits: 420,
  },
  {
    id: 'bosses',
    label: 'Defeat 15 route bosses',
    target: 15,
    xp: 1400,
    credits: 600,
  },
];

export const achievementDefinitions = [
  {
    id: 'first-hostile-down',
    label: 'FIRST HOSTILE DOWN',
    detail: 'Defeat any hostile.',
  },
  {
    id: 'route-runner',
    label: 'CITY RUNNER',
    detail: 'Complete every city route.',
  },
  {
    id: 'signal-hunter',
    label: 'SIGNAL HUNTER',
    detail: 'Capture 250 Signals.',
  },
  {
    id: 'night-shift',
    label: 'NIGHT SHIFT',
    detail: 'Complete 25 deliveries.',
  },
  {
    id: 'boss-breaker',
    label: 'BOSS BREAKER',
    detail: 'Defeat five route bosses.',
  },
  {
    id: 'mastery-ace',
    label: 'MASTERY ACE',
    detail: 'Earn 12 mastery badges.',
  },
  {
    id: 'relay-legend',
    label: 'RELAY LEGEND',
    detail: 'Reach level 100.',
  },
];

export const courierRanks = [
  {
    name: 'ROOKIE',
    threshold: 0,
    unlock: 'Rooftop route access',
  },
  {
    name: 'RUNNER',
    threshold: 300,
    unlock: 'Priority route intel',
  },
  {
    name: 'GHOST',
    threshold: 750,
    unlock: 'Blackout route clearance',
  },
  {
    name: 'GHOSTLINE',
    threshold: 1400,
    unlock: 'Interceptor route clearance',
  },
  {
    name: 'RELAY MASTER',
    threshold: 2300,
    unlock: 'Crown Array clearance',
  },
];

const masteryLabels = [
  'SIGNAL SWEEP',
  'PAR TIME',
  'CLEAN RUN',
  'HUNTER',
];

const defaults = {
  signals: 0,
  xp: 0,
  credits: 0,

  upgrades: [],
  equipment: ['scanner', 'cell'],

  ownedBuildItems: [],
  buildLoadout: [null, null],

  ownedWeapons: ['sidearm'],
  equippedWeapon: 'sidearm',

  tutorialSeen: false,

  achievements: [],
  discoveredEnemies: [],

  activeModifier: null,

  daily: null,
  weekly: null,
  monthly: null,
  seasonal: null,

  login: {
    date: null,
    streak: 0,
    claimed: false,
  },

  npcClaims: [],

  worldStory: {
    chapter: 1,
    lore: [],
  },

  storyProgress: {
    chapter: 1,
    lore: [],
  },

  rivalProgress: {
    encounters: [],
    victories: [],
    wins: 0,
  },

  campaign: {
    claimedChapters: [],
  },

  unlockedDistricts: ['old-city'],
  districtProgress: {},

  loadout: {
    abilities: [],
    equipment: ['scanner', 'cell'],
    passive: null,
  },

  discoveredSecrets: 0,

  level: 1,

  completed: [],

  muted: false,
  musicVolume: 0.55,
  sfxVolume: 0.7,
  screenShake: true,
  reducedMotion: false,
  rain: true,

  streak: 0,
  longestStreak: 0,

  lastRunDate: null,
  lastStreakBonus: 0,
  lastSignalBonus: 0,

  totalRuns: 0,
  bestRun: 0,

  missionStats: {},
  mastery: {},
  contractStats: {},

  lastXpBreakdown: null,
  lastRankUp: null,

  abilities: [],
  lastAbilityUnlock: null,

  rank: 'ROOKIE',

  unlockedMissions: ['first-delivery'],

  // Progression presentation/data bridge.
  progressionVersion: 2,
  progressionRevision: 0,
  lastProgressEvent: null,
};

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueArray(value) {
  return [...new Set(safeArray(value))];
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function today() {
  const date = new Date();

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function weekKey(date = new Date()) {
  const start = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );

  start.setUTCDate(
    start.getUTCDate() + 4 - (start.getUTCDay() || 7),
  );

  const yearStart = new Date(
    Date.UTC(start.getUTCFullYear(), 0, 1),
  );

  return `${start.getUTCFullYear()}-W${String(
    Math.ceil(
      ((start - yearStart) / 86400000 + 1) / 7,
    ),
  ).padStart(2, '0')}`;
}

function seasonKey(date = new Date()) {
  return `${date.getFullYear()}-S${Math.floor(date.getMonth() / 3) + 1}`;
}

function challengeState(current, period) {
  if (current?.period === period) {
    return {
      period,
      progress: { ...(current.progress || {}) },
      claimed: uniqueArray(current.claimed),
    };
  }

  return {
    period,
    progress: {},
    claimed: [],
  };
}

function daysBetween(previous, current) {
  const [previousYear, previousMonth, previousDay] =
    String(previous).split('-').map(Number);

  const [currentYear, currentMonth, currentDay] =
    String(current).split('-').map(Number);

  if (
    !Number.isFinite(previousYear) ||
    !Number.isFinite(previousMonth) ||
    !Number.isFinite(previousDay) ||
    !Number.isFinite(currentYear) ||
    !Number.isFinite(currentMonth) ||
    !Number.isFinite(currentDay)
  ) {
    return 0;
  }

  return Math.round(
    (
      Date.UTC(
        currentYear,
        currentMonth - 1,
        currentDay,
      ) -
      Date.UTC(
        previousYear,
        previousMonth - 1,
        previousDay,
      )
    ) / 86400000,
  );
}

function getUniqueCompletedMissions(state) {
  return uniqueArray(
    safeArray(state?.completed),
  );
}

function getCompletedRouteCount(state) {
  return getUniqueCompletedMissions(state).length;
}

function getMasteryCount(state) {
  return Object.values(state?.mastery || {}).reduce(
    (total, badges) =>
      total + uniqueArray(badges).length,
    0,
  );
}

function getBossVictoryCount(state) {
  return uniqueArray(
    state?.rivalProgress?.victories,
  ).filter((id) => rivalMissionIds.has(id)).length;
}

function getCompletedDistrictIds(completed) {
  const completedIds = new Set(uniqueArray(completed));

  return districts
    .filter(
      (district) =>
        !district.unlockMission ||
        completedIds.has(district.unlockMission),
    )
    .map((district) => district.id);
}

function getUnlockedMissionIds(completed) {
  const completedIds = new Set(uniqueArray(completed));

  // Use the repo's canonical mission catalogue directly.
  // This keeps progression deterministic in both browser and tests
  // and avoids depending on global initialization order.
  return missions
    .filter(
      (mission) =>
        !mission?.unlockRequirement ||
        completedIds.has(mission.unlockRequirement),
    )
    .map((mission) => mission.id)
    .filter(Boolean);
}

function emitProgressUpdate(state, eventType = 'state-sync', details = {}) {
  const completed = getUniqueCompletedMissions(state);
  const masteryCount = getMasteryCount(state);
  const levelInfo = getLevelProgress(state.xp);
  const rankInfo = getCourierRank(state.xp);

  const snapshot = {
    type: eventType,
    revision: safeNumber(state.progressionRevision, 0),

    xp: state.xp,
    level: levelInfo.level,
    levelProgress: levelInfo.progress,

    rank: rankInfo.name,
    rankIndex: rankInfo.index,
    rankProgress: rankInfo.progress,

    completedRoutes: completed.length,
    totalRoutes: districts.reduce(
      (total, district) =>
        total + district.missions.length,
      0,
    ),

    unlockedDistricts: uniqueArray(
      state.unlockedDistricts,
    ),

    districtProgress: {
      ...(state.districtProgress || {}),
    },

    masteryCount,
    mastery: {
      ...(state.mastery || {}),
    },

    totalRuns: state.totalRuns,
    bestRun: state.bestRun,

    signals: state.signals,
    credits: state.credits,

    daily: state.daily
      ? {
          period: state.daily.date,
          progress: {
            ...(state.daily.progress || {}),
          },
          claimed: uniqueArray(state.daily.claimed),
        }
      : null,

    weekly: state.weekly
      ? {
          period: state.weekly.period,
          progress: {
            ...(state.weekly.progress || {}),
          },
          claimed: uniqueArray(state.weekly.claimed),
        }
      : null,

    monthly: state.monthly
      ? {
          period: state.monthly.period,
          progress: {
            ...(state.monthly.progress || {}),
          },
          claimed: uniqueArray(state.monthly.claimed),
        }
      : null,

    seasonal: state.seasonal
      ? {
          period: state.seasonal.period,
          progress: {
            ...(state.seasonal.progress || {}),
          },
          claimed: uniqueArray(state.seasonal.claimed),
        }
      : null,

    achievements: uniqueArray(state.achievements),

    lastXpBreakdown: state.lastXpBreakdown
      ? { ...state.lastXpBreakdown }
      : null,

    lastRankUp: state.lastRankUp
      ? { ...state.lastRankUp }
      : null,

    lastAbilityUnlock:
      state.lastAbilityUnlock || null,

    details: {
      ...details,
    },
  };

  state.progressionRevision =
    safeNumber(state.progressionRevision, 0) + 1;

  state.lastProgressEvent = {
    type: eventType,
    at: Date.now(),
    revision: state.progressionRevision,
    details: { ...details },
  };

  const finalSnapshot = {
    ...snapshot,
    revision: state.progressionRevision,
  };

  if (
    typeof window !== 'undefined'
  ) {
    window.__relayProgress = finalSnapshot;

    try {
      window.dispatchEvent(
        new CustomEvent(
          'relay:progress-updated',
          {
            detail: finalSnapshot,
          },
        ),
      );
    } catch {
      // Non-browser/test environment.
    }
  }

  return finalSnapshot;
}

export function getProgressSnapshot(state) {
  const safeState = state || defaults;

  return emitProgressUpdate(
    {
      ...safeState,
      progressionRevision: safeNumber(
        safeState.progressionRevision,
        0,
      ),
    },
    'snapshot',
  );
}

export function getCourierRank(xp) {
  const normalizedXp = Math.max(
    0,
    safeNumber(xp, 0),
  );

  const index = courierRanks.reduce(
    (current, rank, rankIndex) =>
      normalizedXp >= rank.threshold
        ? rankIndex
        : current,
    0,
  );

  const rank = courierRanks[index];
  const next = courierRanks[index + 1];

  const progress = next
    ? clamp(
        (
          normalizedXp - rank.threshold
        ) /
          (
            next.threshold -
            rank.threshold
          ),
        0,
        1,
      )
    : 1;

  return {
    ...rank,
    index,
    next,
    progress,
  };
}

export function xpForLevel(level) {
  const normalizedLevel = Math.max(
    1,
    Math.min(
      MAX_LEVEL,
      Math.floor(
        safeNumber(level, 1),
      ),
    ),
  );

  const previousLevels =
    normalizedLevel - 1;

  return (
    220 * previousLevels +
    18 * previousLevels * previousLevels
  );
}

export function levelForXp(xp) {
  const normalizedXp = Math.max(
    0,
    safeNumber(xp, 0),
  );

  let level = 1;

  while (
    level < MAX_LEVEL &&
    normalizedXp >=
      xpForLevel(level + 1)
  ) {
    level += 1;
  }

  return level;
}

export function getLevelProgress(xp) {
  const normalizedXp = Math.max(
    0,
    safeNumber(xp, 0),
  );

  const level = levelForXp(normalizedXp);
  const current = xpForLevel(level);

  const next =
    level === MAX_LEVEL
      ? current
      : xpForLevel(level + 1);

  return {
    level,
    current,
    next,
    progress:
      level === MAX_LEVEL
        ? 1
        : clamp(
            (
              normalizedXp - current
            ) /
              (
                next - current
              ),
            0,
            1,
          ),
  };
}

function normalizeMastery(savedMastery) {
  const masteryMigrations = {
    'signal-hunter': 'SIGNAL SWEEP',
    'speed-run': 'PAR TIME',
    'clean-run': 'CLEAN RUN',
    hunter: 'HUNTER',
  };

  return Object.fromEntries(
    Object.entries(
      savedMastery || {},
    ).map(
      ([missionId, badges]) => [
        missionId,
        uniqueArray(
          Array.isArray(badges)
            ? badges.map(
                (id) =>
                  masteryMigrations[id] ||
                  id,
              )
            : [],
        ),
      ],
    ),
  );
}

function normalizeState(raw) {
  const saved =
    raw &&
    typeof raw === 'object'
      ? raw
      : {};

  const legacyIds = {
    'rooftop-relay':
      'first-delivery',
    'harbor-frequency':
      'dead-drop',
  };

  const completed = uniqueArray(
    safeArray(saved.completed).map(
      (id) =>
        legacyIds[id] || id,
    ),
  );

  const xp = Math.max(
    0,
    safeNumber(saved.xp, 0),
  );

  const level = levelForXp(xp);
  const rank = getCourierRank(xp);

  const daily =
    saved.daily?.date === today()
      ? {
          date: today(),
          progress: {
            ...(saved.daily.progress || {}),
          },
          claimed: uniqueArray(
            saved.daily.claimed,
          ),
        }
      : {
          date: today(),
          progress: {},
          claimed: [],
        };

  const weekly = challengeState(
    saved.weekly,
    weekKey(),
  );

  const monthly = challengeState(
    saved.monthly,
    monthKey(),
  );

  const seasonal = challengeState(
    saved.seasonal,
    seasonKey(),
  );

  const mastery = normalizeMastery(
    saved.mastery,
  );

  const unlockedDistricts =
    getCompletedDistrictIds(completed);

  const unlockedMissions =
    getUnlockedMissionIds(
      completed,
    );

  const rivalProgress = {
    ...defaults.rivalProgress,
    ...(saved.rivalProgress || {}),
    encounters: uniqueArray(
      saved.rivalProgress?.encounters,
    ),
    victories: uniqueArray(
      saved.rivalProgress?.victories,
    ),
  };

  rivalProgress.wins =
    rivalProgress.victories.length;

  const abilities = uniqueArray(
    saved.abilities,
  );

  const achievements = uniqueArray(
    saved.achievements,
  );

  const progressionRevision =
    Math.max(
      0,
      safeNumber(
        saved.progressionRevision,
        0,
      ),
    );

  return {
    ...defaults,
    ...saved,

    xp,
    level,

    rank: rank.name,

    completed,

    daily,
    weekly,
    monthly,
    seasonal: {
      ...seasonal,
      progress: {
        ...(seasonal.progress || {}),
        routes: completed.length,
        mastery: getMasteryCount({
          mastery,
        }),
        bosses: safeNumber(
          seasonal.progress?.bosses,
          0,
        ),
      },
    },

    mastery,

    achievements,
    abilities,

    rivalProgress,

    unlockedDistricts,

    unlockedMissions,

    missionStats:
      saved.missionStats &&
      typeof saved.missionStats ===
        'object'
        ? saved.missionStats
        : {},

    districtProgress:
      saved.districtProgress &&
      typeof saved.districtProgress ===
        'object'
        ? saved.districtProgress
        : {},

    contractStats:
      saved.contractStats &&
      typeof saved.contractStats ===
        'object'
        ? saved.contractStats
        : {},

    campaign: {
      ...defaults.campaign,
      ...(saved.campaign || {}),
      claimedChapters:
        uniqueArray(
          saved.campaign
            ?.claimedChapters,
        ),
    },

    loadout: {
      ...defaults.loadout,
      ...(saved.loadout || {}),
      abilities: uniqueArray(
        saved.loadout?.abilities,
      ),
    },

    equipment:
      Array.isArray(saved.equipment)
        ? saved.equipment
        : defaults.equipment,

    buildLoadout:
      Array.isArray(
        saved.buildLoadout,
      )
        ? saved.buildLoadout
        : defaults.buildLoadout,

    ownedBuildItems:
      Array.isArray(
        saved.ownedBuildItems,
      )
        ? saved.ownedBuildItems
        : defaults.ownedBuildItems,

    ownedWeapons:
      Array.isArray(
        saved.ownedWeapons,
      )
        ? saved.ownedWeapons
        : defaults.ownedWeapons,

    discoveredEnemies:
      uniqueArray(
        saved.discoveredEnemies,
      ),

    storyProgress:
      saved.storyProgress ||
      saved.worldStory ||
      defaults.storyProgress,

    progressionRevision,

    progressionVersion: 2,
  };
}

function challengeProgress(
  state,
  mission,
  signals,
  cleanRun,
  contractComplete,
  bossDefeated,
  elapsedMs,
  completedRoutes,
  masteryCount,
) {
  const safeSignals = Math.max(
    0,
    safeNumber(signals, 0),
  );

  const safeElapsedMs = Math.max(
    0,
    safeNumber(elapsedMs, 0),
  );

  const daily =
    state.daily?.date === today()
      ? state.daily
      : {
          date: today(),
          progress: {},
          claimed: [],
        };

  const monthly =
    challengeState(
      state.monthly,
      monthKey(),
    );

  const weekly =
    challengeState(
      state.weekly,
      weekKey(),
    );

  const seasonal =
    challengeState(
      state.seasonal,
      seasonKey(),
    );

  const dockTimeComplete =
    mission?.id === 'dead-drop' &&
    safeElapsedMs <= 90000;

  return {
    daily: {
      ...daily,
      progress: {
        ...(daily.progress || {}),
        signals:
          safeNumber(
            daily.progress?.signals,
            0,
          ) + safeSignals,

        contracts:
          safeNumber(
            daily.progress?.contracts,
            0,
          ) +
          (contractComplete ? 1 : 0),

        clean:
          safeNumber(
            daily.progress?.clean,
            0,
          ) +
          (cleanRun ? 1 : 0),

        dockTime:
          safeNumber(
            daily.progress?.dockTime,
            0,
          ) +
          (dockTimeComplete ? 1 : 0),
      },
    },

    weekly: {
      ...weekly,
      progress: {
        ...(weekly.progress || {}),
        runs:
          safeNumber(
            weekly.progress?.runs,
            0,
          ) + 1,

        signals:
          safeNumber(
            weekly.progress?.signals,
            0,
          ) + safeSignals,

        clean:
          safeNumber(
            weekly.progress?.clean,
            0,
          ) +
          (cleanRun ? 1 : 0),
      },
    },

    monthly: {
      ...monthly,
      progress: {
        ...(monthly.progress || {}),
        runs:
          safeNumber(
            monthly.progress?.runs,
            0,
          ) + 1,

        signals:
          safeNumber(
            monthly.progress?.signals,
            0,
          ) + safeSignals,

        bosses:
          safeNumber(
            monthly.progress?.bosses,
            0,
          ) +
          (bossDefeated ? 1 : 0),
      },
    },

    seasonal: {
      ...seasonal,
      progress: {
        ...(seasonal.progress || {}),

        // Unique route completion count.
        routes: completedRoutes,

        // Real mastery count instead of hardcoded 0.
        mastery: masteryCount,

        bosses:
          safeNumber(
            seasonal.progress?.bosses,
            0,
          ) +
          (bossDefeated ? 1 : 0),
      },
    },
  };
}

export function earnedAchievementIds(state) {
  const completedRoutes =
    getCompletedRouteCount(state);

  const masteryCount =
    getMasteryCount(state);

  const bossWins =
    getBossVictoryCount(state);

  const currentLevel =
    levelForXp(
      safeNumber(state?.xp, 0),
    );

  return [
    state?.achievements?.includes(
      'first-hostile-down',
    ) &&
      'first-hostile-down',

    completedRoutes >= 7 &&
      'route-runner',

    safeNumber(
      state?.signals,
      0,
    ) >= 250 &&
      'signal-hunter',

    safeNumber(
      state?.totalRuns,
      0,
    ) >= 25 &&
      'night-shift',

    bossWins >= 5 &&
      'boss-breaker',

    masteryCount >= 12 &&
      'mastery-ace',

    currentLevel >= MAX_LEVEL &&
      'relay-legend',
  ].filter(Boolean);
}

function buildMissionMastery(
  previousMastery,
  mission,
  signals,
  elapsedMs,
  runStats,
) {
  const cleanRun =
    safeNumber(
      runStats?.deaths,
      0,
    ) <= 0;

  const totalSignals =
    Array.isArray(
      mission?.signals,
    )
      ? mission.signals.length
      : 0;

  const mastery =
    uniqueArray(previousMastery);

  if (
    totalSignals > 0 &&
    safeNumber(signals, 0) >=
      totalSignals &&
    !mastery.includes(
      'SIGNAL SWEEP',
    )
  ) {
    mastery.push(
      'SIGNAL SWEEP',
    );
  }

  if (
    safeNumber(elapsedMs, 0) <=
      safeNumber(
        mission?.parTime,
        Number.MAX_SAFE_INTEGER,
      ) &&
    !mastery.includes(
      'PAR TIME',
    )
  ) {
    mastery.push('PAR TIME');
  }

  if (
    cleanRun &&
    !mastery.includes(
      'CLEAN RUN',
    )
  ) {
    mastery.push('CLEAN RUN');
  }

  if (
    safeNumber(
      runStats?.enemyDefeats,
      0,
    ) >= 3 &&
    !mastery.includes(
      'HUNTER',
    )
  ) {
    mastery.push('HUNTER');
  }

  return mastery.filter(
    (badge) =>
      typeof badge === 'string' &&
      badge.length > 0,
  );
}

function getDistrictProgress(
  previousDistrict,
  district,
  missionId,
  signals,
  secrets,
  score,
  wasPreviouslyCompleted,
) {
  const missionCount =
    district?.missions?.length || 0;

  const completedMissions =
    Math.max(
      0,
      safeNumber(
        previousDistrict?.missions,
        0,
      ),
    ) +
    (
      wasPreviouslyCompleted
        ? 0
        : 1
    );

  const completed =
    clamp(
      missionCount > 0
        ? completedMissions /
            missionCount
        : 0,
      0,
      1,
    );

  return {
    missions: Math.min(
      missionCount,
      completedMissions,
    ),

    missionCount,

    completion:
      completed,

    completionPercent:
      Math.round(
        completed * 100,
      ),

    signals: Math.max(
      safeNumber(
        previousDistrict?.signals,
        0,
      ),
      safeNumber(
        signals,
        0,
      ),
    ),

    secrets: Math.max(
      safeNumber(
        previousDistrict?.secrets,
        0,
      ),
      safeNumber(
        secrets,
        0,
      ),
    ),

    bestScore: Math.max(
      safeNumber(
        previousDistrict?.bestScore,
        0,
      ),
      safeNumber(
        score,
        0,
      ),
    ),
  };
}

function getProgressEvents(
  previousState,
  nextState,
  details = {},
) {
  const events = [];

  const oldLevel =
    levelForXp(
      safeNumber(
        previousState?.xp,
        0,
      ),
    );

  const newLevel =
    levelForXp(
      safeNumber(
        nextState?.xp,
        0,
      ),
    );

  if (newLevel > oldLevel) {
    events.push({
      type: 'level-up',
      from: oldLevel,
      to: newLevel,
    });
  }

  const oldRank =
    getCourierRank(
      safeNumber(
        previousState?.xp,
        0,
      ),
    );

  const newRank =
    getCourierRank(
      safeNumber(
        nextState?.xp,
        0,
      ),
    );

  if (
    newRank.index >
    oldRank.index
  ) {
    events.push({
      type: 'rank-up',
      from: oldRank.name,
      to: newRank.name,
      index: newRank.index,
      unlock: newRank.unlock,
    });
  }

  const oldMastery =
    getMasteryCount(
      previousState,
    );

  const newMastery =
    getMasteryCount(
      nextState,
    );

  if (newMastery > oldMastery) {
    events.push({
      type: 'mastery-up',
      from: oldMastery,
      to: newMastery,
      gained: newMastery - oldMastery,
    });
  }

  const oldDistricts =
    new Set(
      safeArray(
        previousState?.unlockedDistricts,
      ),
    );

  const newDistricts =
    safeArray(
      nextState?.unlockedDistricts,
    );

  newDistricts.forEach(
    (districtId) => {
      if (!oldDistricts.has(districtId)) {
        events.push({
          type: 'district-unlocked',
          districtId,
        });
      }
    },
  );

  const oldAchievements =
    new Set(
      safeArray(
        previousState?.achievements,
      ),
    );

  safeArray(
    nextState?.achievements,
  ).forEach(
    (achievementId) => {
      if (
        !oldAchievements.has(
          achievementId,
        )
      ) {
        events.push({
          type: 'achievement-earned',
          achievementId,
        });
      }
    },
  );

  events.push({
    type: 'progression-sync',
    details: {
      ...details,
    },
  });

  return events;
}

export function claimChallenge(
  state,
  scope,
  id,
) {
  const definitions = {
    daily: dailyChallenges,
    weekly: weeklyChallenges,
    monthly: monthlyChallenges,
    seasonal: seasonalChallenges,
  }[scope];

  const progress =
    state?.[scope];

  const challenge =
    definitions?.find(
      (entry) =>
        entry.id === id,
    );

  if (
    !challenge ||
    !progress ||
    progress.claimed?.includes(id)
  ) {
    return state;
  }

  const rawProgress =
    safeNumber(
      progress.progress?.[id],
      0,
    );

  if (
    rawProgress < challenge.target
  ) {
    return state;
  }

  const previousState = {
    ...state,
  };

  const xp =
    safeNumber(
      state.xp,
      0,
    ) +
    challenge.xp;

  const credits =
    safeNumber(
      state.credits,
      0,
    ) +
    challenge.credits;

  const next = {
    ...state,

    xp,
    credits,

    level: levelForXp(xp),
    rank:
      getCourierRank(xp)
        .name,

    [scope]: {
      ...progress,

      claimed: [
        ...uniqueArray(
          progress.claimed,
        ),
        id,
      ],
    },
  };

  next.achievements =
    uniqueArray([
      ...safeArray(
        state.achievements,
      ),
      ...earnedAchievementIds(next),
    ]);

  const events =
    getProgressEvents(
      previousState,
      next,
      {
        scope,
        challengeId: id,
        challengeXp:
          challenge.xp,
        challengeCredits:
          challenge.credits,
      },
    );

  next.lastXpBreakdown = {
    ...(next.lastXpBreakdown || {}),
    challenge: challenge.xp,
    challengeId: id,
    challengeScope: scope,
    credits:
      challenge.credits,
    total:
      challenge.xp,
  };

  next.lastProgressEvent = {
    type: 'challenge-claimed',
    at: Date.now(),
    details: {
      scope,
      challengeId: id,
      events,
    },
  };

  next.progressionRevision =
    safeNumber(
      state.progressionRevision,
      0,
    ) + 1;

  saveState(next);

  if (
    typeof window !==
    'undefined'
  ) {
    window.__relayProgress =
      getProgressSnapshot(next);
  }

  return next;
}

export function claimLoginReward(
  state,
) {
  const date = today();
  const login =
    state.login ||
    defaults.login;

  if (
    login.date === date &&
    login.claimed
  ) {
    return state;
  }

  const previous =
    login.date
      ? daysBetween(
          login.date,
          date,
        )
      : 0;

  const streak =
    previous === 1
      ? Math.min(
          7,
          safeNumber(
            login.streak,
            0,
          ) + 1,
        )
      : 1;

  const credits =
    loginRewards[
      streak - 1
    ];

  const xp =
    safeNumber(
      state.xp,
      0,
    ) +
    credits * 2;

  const previousState = {
    ...state,
  };

  const next = {
    ...state,

    xp,

    credits:
      safeNumber(
        state.credits,
        0,
      ) + credits,

    level:
      levelForXp(xp),

    rank:
      getCourierRank(xp)
        .name,

    login: {
      date,
      streak,
      claimed: true,
    },
  };

  next.streak = streak;

  next.longestStreak =
    Math.max(
      safeNumber(
        state.longestStreak,
        0,
      ),
      streak,
    );

  next.achievements =
    uniqueArray([
      ...safeArray(
        state.achievements,
      ),
      ...earnedAchievementIds(
        next,
      ),
    ]);

  next.lastXpBreakdown = {
    completion: 0,
    signals: 0,
    secrets: 0,
    optional: 0,
    streak: 0,
    package: 0,
    modifier: 0,
    daily: 0,
    weekly: 0,
    monthly: 0,
    seasonal: 0,
    contract: 0,
    campaign: 0,
    rival: 0,
    login: credits * 2,
    credits,
    total: credits * 2,
    objectives: [],
  };

  const events =
    getProgressEvents(
      previousState,
      next,
      {
        loginReward: credits,
        loginStreak: streak,
      },
    );

  next.lastProgressEvent = {
    type: 'login-reward',
    at: Date.now(),
    details: {
      credits,
      xp: credits * 2,
      streak,
      events,
    },
  };

  next.progressionRevision =
    safeNumber(
      state.progressionRevision,
      0,
    ) + 1;

  saveState(next);

  if (
    typeof window !==
    'undefined'
  ) {
    window.__relayProgress =
      getProgressSnapshot(next);
  }

  return next;
}

export function loadState() {
  try {
    const raw =
      JSON.parse(
        localStorage.getItem(
          key,
        ) || 'null',
      );

    if (
      !raw ||
      typeof raw !== 'object'
    ) {
      const fresh = {
        ...defaults,
      };

      emitProgressUpdate(
        fresh,
        'state-created',
      );

      return fresh;
    }

    const next =
      normalizeState(raw);

    emitProgressUpdate(
      next,
      'state-loaded',
    );

    return next;
  } catch {
    const fallback = {
      ...defaults,
    };

    emitProgressUpdate(
      fallback,
      'state-recovery',
    );

    return fallback;
  }
}

export function saveState(state) {
  const safeState =
    state || {
      ...defaults,
    };

  safeState.level =
    levelForXp(
      safeNumber(
        safeState.xp,
        0,
      ),
    );

  safeState.rank =
    getCourierRank(
      safeState.xp,
    ).name;

  safeState.completed =
    uniqueArray(
      safeState.completed,
    );

  safeState.unlockedDistricts =
    getCompletedDistrictIds(
      safeState.completed,
    );

  safeState.unlockedMissions =
    getUnlockedMissionIds(
      safeState.completed,
    );

  safeState.mastery =
    normalizeMastery(
      safeState.mastery,
    );

  safeState.achievements =
    uniqueArray(
      safeState.achievements,
    );

  safeState.abilities =
    uniqueArray(
      safeState.abilities,
    );

  safeState.rivalProgress = {
    ...defaults.rivalProgress,
    ...(safeState.rivalProgress ||
      {}),
    encounters:
      uniqueArray(
        safeState.rivalProgress
          ?.encounters,
      ),
    victories:
      uniqueArray(
        safeState.rivalProgress
          ?.victories,
      ),
  };

  safeState.rivalProgress.wins =
    safeState.rivalProgress
      .victories.length;

  localStorage.setItem(
    key,
    JSON.stringify(
      safeState,
    ),
  );

  emitProgressUpdate(
    safeState,
    'state-saved',
  );

  return safeState;
}

export function completeMission(
  state,
  mission,
  signals,
  elapsedMs = 0,
  runStats = {},
) {
  if (
    !mission ||
    typeof mission !==
      'object'
  ) {
    return state;
  }

  const previousState = {
    ...state,
  };

  const safeSignals =
    Math.max(
      0,
      safeNumber(signals, 0),
    );

  const safeElapsedMs =
    Math.max(
      0,
      safeNumber(
        elapsedMs,
        0,
      ),
    );

  const runDate =
    today();

  const firstRunToday =
    state.lastRunDate !==
    runDate;

  const streak =
    firstRunToday
      ? (
          state.lastRunDate &&
          daysBetween(
            state.lastRunDate,
            runDate,
          ) === 1
            ? safeNumber(
                state.streak,
                0,
              ) + 1
            : 1
        )
      : safeNumber(
          state.streak,
          0,
        );

  const streakBonus =
    firstRunToday
      ? Math.min(
          100,
          25 +
            (streak - 1) * 10,
        )
      : 0;

  const signalBonus =
    safeSignals * 5 +
    Math.max(
      0,
      safeNumber(
        runStats.signalBonusExtra,
        0,
      ),
    );

  const secretBonus =
    Math.max(
      0,
      safeNumber(
        runStats.secrets,
        0,
      ),
    ) * 25;

  const score =
    Number.isFinite(
      Number(runStats.score),
    )
      ? Number(runStats.score)
      : safeSignals * 100;

  const optionalObjectives =
    Array.isArray(
      mission.optionalObjectives,
    )
      ? mission.optionalObjectives
      : [];

  const completedObjectives =
    optionalObjectives.filter(
      (objective) => {
        if (!objective) {
          return false;
        }

        if (
          objective.type ===
          'allSignals'
        ) {
          return (
            safeSignals ===
            safeArray(
              mission.signals,
            ).length
          );
        }

        if (
          objective.type ===
          'fast'
        ) {
          return (
            safeElapsedMs <=
            safeNumber(
              mission.parTime,
              Number.MAX_SAFE_INTEGER,
            )
          );
        }

        if (
          objective.type ===
          'jumps'
        ) {
          return (
            safeNumber(
              runStats.jumps,
              0,
            ) >=
            safeNumber(
              objective.target,
              0,
            )
          );
        }

        return false;
      },
    );

  const optionalBonus =
    completedObjectives.reduce(
      (total, objective) =>
        total +
        Math.max(
          0,
          safeNumber(
            objective?.bonus,
            0,
          ),
        ),
      0,
    );

  const cleanRun =
    safeNumber(
      runStats.deaths,
      0,
    ) <= 0;

  const previousMission =
    state.missionStats?.[
      mission.id
    ] || {
      completed: false,
      bestScore: 0,
      bestTime: 0,
      bestRating: 0,
      bestSecrets: 0,
      bestSignals: 0,
      mastery: [],
    };

  const previousMastery =
    state.mastery?.[
      mission.id
    ] || [];

  const missionMastery =
    buildMissionMastery(
      previousMastery,
      mission,
      safeSignals,
      safeElapsedMs,
      runStats,
    );

  const contract =
    runStats.contract;

  const contractComplete =
    Boolean(
      contract &&
        runStats.contractCompleted &&
        contract.id,
    );

  const contractAlreadyClaimed =
    Boolean(
      contract?.id &&
        state.contractStats?.[
          contract.id
        ]?.completed,
    );

  const contractXp =
    contractComplete &&
    !contractAlreadyClaimed
      ? Math.max(
          0,
          safeNumber(
            contract.xp,
            0,
          ),
        )
      : 0;

  const contractCredits =
    contractComplete &&
    !contractAlreadyClaimed
      ? Math.max(
          0,
          safeNumber(
            contract.credits,
            0,
          ),
        )
      : 0;

  const earned =
    Math.max(
      0,
      safeNumber(
        mission.reward,
        0,
      ),
    ) +
    signalBonus +
    secretBonus +
    streakBonus +
    optionalBonus;

  const credits =
    Math.floor(
      earned / 10,
    ) + contractCredits;

  const packageBonus =
    Math.max(
      0,
      Math.round(
        (
          100 -
          Math.max(
            0,
            Math.min(
              100,
              safeNumber(
                runStats.packageCondition,
                100,
              ),
            ),
          )
        ) / 10,
      ),
    );

  const modifierXp =
    Math.max(
      0,
      safeNumber(
        runStats.modifier?.xpBonus,
        0,
      ),
    );

  const modifierCredits =
    Math.max(
      0,
      safeNumber(
        runStats.modifier?.credits,
        0,
      ),
    );

  const rating =
    safeSignals ===
      safeArray(
        mission.signals,
      ).length &&
    cleanRun &&
    safeElapsedMs <=
      safeNumber(
        mission.parTime,
        Number.MAX_SAFE_INTEGER,
      )
      ? 3
      : safeSignals ===
          safeArray(
            mission.signals,
          ).length ||
        cleanRun
      ? 2
      : 1;

  const campaignClaimed =
    new Set(
      uniqueArray(
        state.campaign
          ?.claimedChapters,
      ),
    );

  const completedWithMission =
    new Set([
      ...getUniqueCompletedMissions(
        state,
      ),
      mission.id,
    ]);

  const newCampaignRewards =
    campaignRewards.filter(
      (reward) =>
        !campaignClaimed.has(
          reward.id,
        ) &&
        reward.missions.every(
          (id) =>
            completedWithMission.has(
              id,
            ),
        ),
    );

  const campaignXp =
    newCampaignRewards.reduce(
      (total, reward) =>
        total +
        safeNumber(
          reward.xp,
          0,
        ),
      0,
    );

  const campaignCredits =
    newCampaignRewards.reduce(
      (total, reward) =>
        total +
        safeNumber(
          reward.credits,
          0,
        ),
      0,
    );

  const rivalVictory =
    Boolean(
      runStats.rivalVictory &&
        rivalMissionIds.has(
          mission.id,
        ),
    );

  const previousRivalVictories =
    uniqueArray(
      state.rivalProgress
        ?.victories,
    );

  const newRivalVictory =
    rivalVictory &&
    !previousRivalVictories.includes(
      mission.id,
    );

  const rivalXp =
    newRivalVictory
      ? 100
      : 0;

  const rivalCredits =
    newRivalVictory
      ? 40
      : 0;

  const totalXp =
    earned +
    contractXp +
    campaignXp +
    rivalXp +
    packageBonus +
    modifierXp;

  const nextXp =
    Math.max(
      0,
      safeNumber(
        state.xp,
        0,
      ),
    ) + totalXp;

  const completedBefore =
    getUniqueCompletedMissions(
      state,
    );

  const wasPreviouslyCompleted =
    completedBefore.includes(
      mission.id,
    );

  const newCompleted =
    uniqueArray([
      ...completedBefore,
      mission.id,
    ]);

  const newAbilities = [];

  const currentAbilities =
    uniqueArray(
      state.abilities,
    );

  // Unlock abilities from the number of unique routes completed
  // after this mission has been recorded.
  if (
    newCompleted.length >= 1 &&
    !currentAbilities.includes(
      'dash',
    )
  ) {
    newAbilities.push(
      'dash',
    );
  }

  if (
    newCompleted.length >= 2 &&
    !currentAbilities.includes(
      'doubleJump',
    )
  ) {
    newAbilities.push(
      'doubleJump',
    );
  }

  if (
    newCompleted.length >= 4 &&
    !currentAbilities.includes(
      'wallJump',
    )
  ) {
    newAbilities.push(
      'wallJump',
    );
  }

  const missionStat = {
    ...previousMission,

    completed: true,

    bestScore: Math.max(
      safeNumber(
        previousMission.bestScore,
        0,
      ),
      score,
    ),

    bestTime:
      !previousMission.bestTime ||
      safeNumber(
        previousMission.bestTime,
        0,
      ) <= 0
        ? safeElapsedMs
        : Math.min(
            previousMission.bestTime,
            safeElapsedMs,
          ),

    bestRating:
      Math.max(
        safeNumber(
          previousMission.bestRating,
          0,
        ),
        rating,
      ),

    bestSecrets:
      Math.max(
        safeNumber(
          previousMission.bestSecrets,
          0,
        ),
        safeNumber(
          runStats.secrets,
          0,
        ),
      ),

    bestSignals:
      Math.max(
        safeNumber(
          previousMission.bestSignals,
          0,
        ),
        safeSignals,
      ),

    mastery:
      missionMastery,
  };

  const district =
    districts.find(
      (item) =>
        item.missions.includes(
          mission.id,
        ),
    );

  const previousDistrict =
    state.districtProgress?.[
      district?.id
    ] || {
      missions: 0,
      missionCount:
        district?.missions?.length ||
        0,
      completion: 0,
      completionPercent: 0,
      signals: 0,
      secrets: 0,
      bestScore: 0,
    };

  const completedRoutes =
    newCompleted.length;

  const masteryPreview = {
    ...(state.mastery || {}),
    [mission.id]:
      missionMastery,
  };

  const masteryCount =
    Object.values(
      masteryPreview,
    ).reduce(
      (total, badges) =>
        total +
        uniqueArray(
          badges,
        ).length,
      0,
    );

  const challengeUpdates =
    challengeProgress(
      {
        ...state,
        completed:
          newCompleted,
        mastery:
          masteryPreview,
      },
      mission,
      safeSignals,
      cleanRun,
      contractComplete &&
        !contractAlreadyClaimed,
      Boolean(
        runStats.bossDefeated,
      ),
      safeElapsedMs,
      completedRoutes,
      masteryCount,
    );

  const next = {
    ...state,

    xp: nextXp,

    credits:
      safeNumber(
        state.credits,
        0,
      ) +
      credits +
      campaignCredits +
      rivalCredits +
      modifierCredits,

    level:
      levelForXp(
        nextXp,
      ),

    rank:
      getCourierRank(
        nextXp,
      ).name,

    missionStats: {
      ...(state.missionStats ||
        {}),
      [mission.id]:
        missionStat,
    },

    completed:
      newCompleted,

    ...challengeUpdates,

    campaign: {
      claimedChapters: [
        ...campaignClaimed,
        ...newCampaignRewards.map(
          (chapter) =>
            chapter.id,
        ),
      ],
    },

    discoveredSecrets:
      safeNumber(
        state.discoveredSecrets,
        0,
      ) +
      Math.max(
        0,
        safeNumber(
          runStats.secrets,
          0,
        ) -
          safeNumber(
            previousMission.bestSecrets,
            0,
          ),
      ),

    districtProgress:
      district
        ? {
            ...(state.districtProgress ||
              {}),

            [district.id]:
              getDistrictProgress(
                previousDistrict,
                district,
                mission.id,
                safeSignals,
                safeNumber(
                  runStats.secrets,
                  0,
                ),
                score,
                wasPreviouslyCompleted,
              ),
          }
        : state.districtProgress,

    rivalProgress:
      rivalMissionIds.has(
        mission.id,
      )
        ? {
            ...(
              state.rivalProgress ||
              defaults.rivalProgress
            ),

            encounters:
              uniqueArray([
                ...safeArray(
                  state
                    .rivalProgress
                    ?.encounters,
                ),
                mission.id,
              ]),

            victories:
              newRivalVictory
                ? uniqueArray([
                    ...previousRivalVictories,
                    mission.id,
                  ])
                : previousRivalVictories,

            wins:
              newRivalVictory
                ? previousRivalVictories.length +
                  1
                : previousRivalVictories.length,
          }
        : state.rivalProgress,

    streak,

    longestStreak:
      Math.max(
        safeNumber(
          state.longestStreak,
          0,
        ),
        streak,
      ),

    lastRunDate:
      firstRunToday
        ? runDate
        : state.lastRunDate,

    lastStreakBonus:
      streakBonus,

    lastSignalBonus:
      signalBonus,

    totalRuns:
      safeNumber(
        state.totalRuns,
        0,
      ) + 1,

    bestRun:
      Math.max(
        safeNumber(
          state.bestRun,
          0,
        ),
        score,
      ),

    mastery:
      masteryPreview,

    lastXpBreakdown: {
      completion:
        safeNumber(
          mission.reward,
          0,
        ),

      signals:
        signalBonus,

      secrets:
        secretBonus,

      optional:
        optionalBonus,

      streak:
        streakBonus,

      package:
        packageBonus,

      modifier:
        modifierXp,

      daily: 0,
      weekly: 0,
      monthly: 0,
      seasonal: 0,

      contract:
        contractXp,

      campaign:
        campaignXp,

      campaignChapters:
        newCampaignRewards.map(
          (chapter) =>
            chapter.id,
        ),

      rival:
        rivalXp,

      login: 0,

      credits:
        credits +
        campaignCredits +
        rivalCredits +
        modifierCredits,

      total:
        totalXp,

      objectives:
        completedObjectives.map(
          (objective) =>
            objective.label,
        ),
    },

    tutorialSeen: true,

    achievements:
      uniqueArray([
        ...safeArray(
          state.achievements,
        ),

        `route-${mission.id}`,

        cleanRun &&
          `clean-${mission.id}`,

        safeSignals ===
          safeArray(
            mission.signals,
          ).length &&
          `signals-${mission.id}`,

        safeNumber(
          runStats.enemyDefeats,
          0,
        ) > 0 &&
          'first-hostile-down',

        runStats.bossDefeated &&
          `boss-${mission.id}`,
      ].filter(Boolean)),

    abilities:
      newAbilities.length
        ? uniqueArray([
            ...currentAbilities,
            ...newAbilities,
          ])
        : currentAbilities,

    lastAbilityUnlock:
      newAbilities.length
        ? newAbilities[
            newAbilities.length - 1
          ]
        : null,
  };

  if (
    contractComplete &&
    !contractAlreadyClaimed
  ) {
    next.contractStats = {
      ...(state.contractStats ||
        {}),

      [contract.id]: {
        completed: true,
        bestTime:
          safeElapsedMs,
      },
    };
  }

  next.unlockedDistricts =
    getCompletedDistrictIds(
      next.completed,
    );

  next.unlockedMissions =
    getUnlockedMissionIds(
      next.completed,
    );

  next.level =
    levelForXp(
      next.xp,
    );

  next.rank =
    getCourierRank(
      next.xp,
    ).name;

  next.seasonal = {
    ...next.seasonal,

    progress: {
      ...(next.seasonal?.progress ||
        {}),

      routes:
        getCompletedRouteCount(
          next,
        ),

      mastery:
        getMasteryCount(next),

      bosses:
        safeNumber(
          next.seasonal?.progress
            ?.bosses,
          0,
        ),
    },
  };

  next.achievements =
    uniqueArray([
      ...next.achievements,
      ...earnedAchievementIds(
        next,
      ),
    ]);

  const oldRank =
    getCourierRank(
      state.xp,
    );

  const newRank =
    getCourierRank(
      next.xp,
    );

  next.lastRankUp =
    newRank.index >
    oldRank.index
      ? {
          ...newRank,
          from:
            oldRank.name,
          to:
            newRank.name,
        }
      : null;

  const events =
    getProgressEvents(
      previousState,
      next,
      {
        missionId:
          mission.id,

        firstClear:
          !wasPreviouslyCompleted,

        replay:
          wasPreviouslyCompleted,

        score,

        rating,

        signals:
          safeSignals,

        masteryGained:
          missionMastery.length -
          uniqueArray(
            previousMastery,
          ).length,

        contractCompleted:
          contractComplete &&
          !contractAlreadyClaimed,

        campaignChapters:
          newCampaignRewards.map(
            (chapter) =>
              chapter.id,
          ),

        rivalVictory:
          newRivalVictory,

        totalXp,
      },
    );

  next.lastProgressEvent = {
    type: 'mission-complete',
    at: Date.now(),

    details: {
      missionId:
        mission.id,

      totalXp,

      level:
        next.level,

      rank:
        next.rank,

      mastery:
        masteryCount,

      routeCount:
        completedRoutes,

      events,
    },
  };

  next.progressionRevision =
    safeNumber(
      state.progressionRevision,
      0,
    ) + 1;

  saveState(next);

  // Explicitly publish one final post-save snapshot.
  if (
    typeof window !==
    'undefined'
  ) {
    window.__relayProgress =
      getProgressSnapshot(next);
  }

  return next;
}

// Export lightweight metadata for existing systems.
// No UI is created here.
export function getProgressionMeta() {
  return {
    maxLevel: MAX_LEVEL,

    ranks:
      courierRanks.map(
        (rank) => ({
          name: rank.name,
          threshold:
            rank.threshold,
          unlock:
            rank.unlock,
        }),
      ),

    districts:
      districts.map(
        (district) => ({
          id: district.id,
          unlockMission:
            district.unlockMission,
          missions: [
            ...district.missions,
          ],
        }),
      ),

    masteryLabels: [
      ...masteryLabels,
    ],

    dailyChallenges: [
      ...dailyChallenges,
    ],

    weeklyChallenges: [
      ...weeklyChallenges,
    ],

    monthlyChallenges: [
      ...monthlyChallenges,
    ],

    seasonalChallenges: [
      ...seasonalChallenges,
    ],

    achievements: [
      ...achievementDefinitions,
    ],
  };
}
