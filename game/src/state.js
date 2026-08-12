const key = 'relay-runner-state';
const districts = [
  { id: 'old-city', unlockMission: null, missions: ['first-delivery'] }, { id: 'industrial', unlockMission: 'first-delivery', missions: ['dead-drop'] }, { id: 'downtown', unlockMission: 'dead-drop', missions: ['blackout'] }, { id: 'corporate', unlockMission: 'blackout', missions: ['pursuit'] }, { id: 'residential', unlockMission: 'pursuit', missions: ['signal-storm'] }, { id: 'apex', unlockMission: 'signal-storm', missions: ['corporate-lockdown', 'final-relay'] },
];
const rivalMissionIds = new Set(['dead-drop', 'pursuit', 'signal-storm', 'corporate-lockdown', 'final-relay']);
const campaignRewards = [
  { id: 'chapter-one', missions: ['first-delivery', 'dead-drop'], xp: 75, credits: 30 },
  { id: 'chapter-two', missions: ['blackout', 'pursuit'], xp: 125, credits: 50 },
  { id: 'chapter-three', missions: ['signal-storm'], xp: 200, credits: 80 },
  { id: 'chapter-four', missions: ['corporate-lockdown', 'final-relay'], xp: 350, credits: 150 },
];
export const courierRanks = [
  { name: 'ROOKIE', threshold: 0, unlock: 'Rooftop route access' },
  { name: 'RUNNER', threshold: 300, unlock: 'Priority route intel' },
  { name: 'GHOST', threshold: 750, unlock: 'Blackout route clearance' },
  { name: 'GHOSTLINE', threshold: 1400, unlock: 'Interceptor route clearance' },
  { name: 'RELAY MASTER', threshold: 2300, unlock: 'Crown Array clearance' },
];

export function getCourierRank(xp) {
  const index = courierRanks.reduce((current, rank, rankIndex) => xp >= rank.threshold ? rankIndex : current, 0);
  const rank = courierRanks[index]; const next = courierRanks[index + 1];
  return { ...rank, index, next, progress: next ? (xp - rank.threshold) / (next.threshold - rank.threshold) : 1 };
}
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
  npcClaims: [],
  worldStory: { chapter: 1, lore: [] },
  storyProgress: { chapter: 1, lore: [] },
  rivalProgress: { encounters: [], victories: [], wins: 0 },
  campaign: { claimedChapters: [] },
  unlockedDistricts: ['old-city'],
  districtProgress: {},
  loadout: { abilities: [], equipment: ['scanner', 'cell'], passive: null },
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
};

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function daysBetween(previous, current) {
  const [previousYear, previousMonth, previousDay] = previous.split('-').map(Number);
  const [currentYear, currentMonth, currentDay] = current.split('-').map(Number);
  return Math.round((Date.UTC(currentYear, currentMonth - 1, currentDay) - Date.UTC(previousYear, previousMonth - 1, previousDay)) / 86400000);
}

export function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (!saved || typeof saved !== 'object') return { ...defaults };
    const legacyIds = { 'rooftop-relay': 'first-delivery', 'harbor-frequency': 'dead-drop' };
    const completed = Array.isArray(saved.completed) ? saved.completed.map(id => legacyIds[id] || id) : [];
    const daily = saved.daily?.date === today() ? saved.daily : { date: today(), progress: {}, claimed: [] };
    const unlockedDistricts = districts.filter(district => !district.unlockMission || completed.includes(district.unlockMission)).map(district => district.id);
    return { ...defaults, ...saved, daily, completed, storyProgress: saved.storyProgress || saved.worldStory || defaults.storyProgress, unlockedDistricts: saved.unlockedDistricts || unlockedDistricts, rank: saved.rank || getCourierRank(saved.xp || 0).name, unlockedMissions: saved.unlockedMissions || ['first-delivery'] };
  } catch {
    return { ...defaults };
  }
}

export function saveState(state) {
  localStorage.setItem(key, JSON.stringify(state));
}

export function completeMission(state, mission, signals, elapsedMs = 0, runStats = {}) {
  const runDate = today();
  const firstRunToday = state.lastRunDate !== runDate;
  const streak = firstRunToday ? (state.lastRunDate && daysBetween(state.lastRunDate, runDate) === 1 ? state.streak + 1 : 1) : state.streak;
  const streakBonus = firstRunToday ? Math.min(100, 25 + (streak - 1) * 10) : 0;
  const signalBonus = signals * 5 + (runStats.signalBonusExtra || 0);
  const secretBonus = (runStats.secrets || 0) * 25;
  const score = runStats.score ?? signals * 100;
  const completedObjectives = mission.optionalObjectives.filter(objective => (objective.type === 'allSignals' && signals === mission.signals.length) || (objective.type === 'fast' && elapsedMs <= mission.parTime) || (objective.type === 'jumps' && runStats.jumps >= objective.target));
  const optionalBonus = completedObjectives.reduce((total, objective) => total + objective.bonus, 0);
  const earned = mission.reward + signalBonus + secretBonus + streakBonus + optionalBonus;
  const oldRank = getCourierRank(state.xp);
  const previousMission = state.missionStats?.[mission.id] || { completed: false, bestScore: 0, bestTime: 0 };
  const cleanRun = !runStats.collisions && !runStats.falls;
  const earnedMastery = [
    signals === mission.signals.length && 'SIGNAL SWEEP',
    elapsedMs <= mission.parTime && 'PAR TIME',
    cleanRun && 'CLEAN RUN',
    mission.secrets.length && (runStats.secrets || 0) === mission.secrets.length && 'SECRET ROUTE',
    runStats.package?.condition && runStats.packageCondition === 100 && 'PERFECT PACKAGE',
  ].filter(Boolean);
  const previousMastery = state.mastery?.[mission.id] || [];
  const missionMastery = [...new Set([...previousMastery, ...earnedMastery])];
  let rating = 1;
  if (signals >= Math.ceil(mission.signals.length * .6) || completedObjectives.length >= 2) rating = 2;
  if (signals === mission.signals.length && elapsedMs <= mission.parTime && cleanRun && completedObjectives.length === mission.optionalObjectives.length) rating = 3;
  const abilityUnlocks = Array.isArray(mission.abilityUnlock) ? mission.abilityUnlock : mission.abilityUnlock ? [mission.abilityUnlock] : [];
  const newAbilities = abilityUnlocks.filter(ability => !state.abilities.includes(ability));
  const contract = runStats.contract;
  const contractComplete = contract && !state.contractStats?.[contract.id]?.completed && ((contract.type === 'DELIVERY') || (contract.type === 'TIMED' && elapsedMs <= contract.time) || (contract.type === 'COLLECTION' && signals >= contract.signals) || (contract.type === 'NO-HIT' && !runStats.collisions && !runStats.falls) || (contract.type === 'STEALTH' && !runStats.alarms) || (contract.type === 'CHASE' && runStats.chaseEscapes >= 2));
  const modifier = runStats.modifier;
  const rivalVictory = (mission.id === 'dead-drop' && elapsedMs <= mission.parTime) || (mission.id === 'pursuit' && cleanRun && runStats.chaseEscapes >= 2) || (mission.id === 'signal-storm' && (signals === mission.signals.length || cleanRun)) || (mission.id === 'corporate-lockdown' && cleanRun) || (mission.id === 'final-relay' && cleanRun && signals === mission.signals.length);
  const previousRivalVictories = state.rivalProgress?.victories || [];
  const newRivalVictory = rivalMissionIds.has(mission.id) && rivalVictory && !previousRivalVictories.includes(mission.id);
  const rivalXp = newRivalVictory ? 60 : 0;
  const rivalCredits = newRivalVictory ? 25 : 0;
  const packageBonus = runStats.package?.condition && runStats.packageCondition === 100 ? Math.floor(mission.reward * .25) : 0;
  const credits = Math.floor(mission.reward / 10) + (runStats.secrets || 0) * 3 + rating * 5 + completedObjectives.length * 3 + (contractComplete ? contract.credits : 0) + (modifier?.credits || 0) + Math.floor(packageBonus / 10);
  const daily = state.daily?.date === runDate ? state.daily : { date: runDate, progress: {}, claimed: [] };
  const dailyProgress = { ...daily.progress, signals: (daily.progress.signals || 0) + signals, contracts: (daily.progress.contracts || 0) + (contractComplete ? 1 : 0), clean: (daily.progress.clean || 0) + (!runStats.collisions && !runStats.falls ? 1 : 0), dockTime: (daily.progress.dockTime || 0) + (mission.id === 'dead-drop' && elapsedMs <= 90000 ? 1 : 0) };
  const dailyGoals = { signals: [50, 80, 35], contracts: [3, 100, 50], clean: [1, 65, 30], dockTime: [1, 75, 35] }; const newlyClaimed = Object.keys(dailyGoals).filter(id => dailyProgress[id] >= dailyGoals[id][0] && !daily.claimed.includes(id)); const dailyXp = newlyClaimed.reduce((total, id) => total + dailyGoals[id][1], 0); const dailyCredits = newlyClaimed.reduce((total, id) => total + dailyGoals[id][2], 0);
  const district = districts.find(district => district.missions.includes(mission.id));
  const previousDistrict = state.districtProgress?.[district?.id] || { missions: 0, signals: 0, secrets: 0, bestScore: 0 };
  const completedMissionIds = new Set([...state.completed, mission.id]);
  const claimedChapters = state.campaign?.claimedChapters || [];
  const newCampaignRewards = campaignRewards.filter(chapter => chapter.missions.every(id => completedMissionIds.has(id)) && !claimedChapters.includes(chapter.id));
  const campaignXp = newCampaignRewards.reduce((total, chapter) => total + chapter.xp, 0);
  const campaignCredits = newCampaignRewards.reduce((total, chapter) => total + chapter.credits, 0);
  const next = {
    ...state,
    signals: state.signals + signals,
    xp: state.xp + earned + packageBonus + (modifier?.xp || 0) + dailyXp + campaignXp + rivalXp,
    credits: state.credits + credits + dailyCredits + campaignCredits + rivalCredits,
    campaign: { claimedChapters: [...claimedChapters, ...newCampaignRewards.map(chapter => chapter.id)] },
    daily: { ...daily, progress: dailyProgress, claimed: [...daily.claimed, ...newlyClaimed] },
    discoveredSecrets: state.discoveredSecrets + Math.max(0, (runStats.secrets || 0) - (previousMission.bestSecrets || 0)),
    districtProgress: district ? { ...state.districtProgress, [district.id]: { missions: Math.max(previousDistrict.missions, previousMission.completed ? previousDistrict.missions : previousDistrict.missions + 1), signals: Math.max(previousDistrict.signals, signals), secrets: Math.max(previousDistrict.secrets, runStats.secrets || 0), bestScore: Math.max(previousDistrict.bestScore, score) } } : state.districtProgress,
    rivalProgress: rivalMissionIds.has(mission.id) ? { ...state.rivalProgress, encounters: [...new Set([...(state.rivalProgress?.encounters || []), mission.id])], victories: newRivalVictory ? [...previousRivalVictories, mission.id] : previousRivalVictories, wins: (state.rivalProgress?.wins || 0) + (newRivalVictory ? 1 : 0) } : state.rivalProgress,
    streak,
    longestStreak: Math.max(state.longestStreak, streak),
    lastRunDate: firstRunToday ? runDate : state.lastRunDate,
    lastStreakBonus: streakBonus,
    lastSignalBonus: signalBonus,
    totalRuns: state.totalRuns + 1,
    bestRun: Math.max(state.bestRun, score),
    mastery: { ...state.mastery, [mission.id]: missionMastery },
    missionStats: { ...state.missionStats, [mission.id]: { completed: true, bestScore: Math.max(previousMission.bestScore, score), bestTime: !previousMission.bestTime || elapsedMs < previousMission.bestTime ? elapsedMs : previousMission.bestTime, bestRating: Math.max(previousMission.bestRating || 0, rating), bestSecrets: Math.max(previousMission.bestSecrets || 0, runStats.secrets || 0), bestSignals: Math.max(previousMission.bestSignals || 0, signals), mastery: missionMastery } },
    lastXpBreakdown: { completion: mission.reward, signals: signalBonus, secrets: secretBonus, optional: optionalBonus, streak: streakBonus, contract: contractComplete ? contract.xp : 0, campaign: campaignXp, campaignChapters: newCampaignRewards.map(chapter => chapter.id), rival: rivalXp, credits: credits + campaignCredits + rivalCredits, total: earned + (contractComplete ? contract.xp : 0) + campaignXp + rivalXp, objectives: completedObjectives.map(objective => objective.label) },
    tutorialSeen: true,
    achievements: [...new Set([...(state.achievements || []), `route-${mission.id}`, cleanRun && `clean-${mission.id}`, signals === mission.signals.length && `signals-${mission.id}`, runStats.enemyDefeats > 0 && 'first-hostile-down', runStats.bossDefeated && `boss-${mission.id}`].filter(Boolean))],
    abilities: newAbilities.length ? [...state.abilities, ...newAbilities] : state.abilities,
    lastAbilityUnlock: ['dash', 'doubleJump', 'wallJump'].includes(newAbilities[0]) ? newAbilities[0] : null,
  };
  if (contractComplete) { next.xp += contract.xp; next.contractStats = { ...(state.contractStats || {}), [contract.id]: { completed: true, bestTime: elapsedMs } }; }
  if (!next.completed.includes(mission.id)) next.completed = [...next.completed, mission.id];
  next.unlockedDistricts = districts.filter(district => !district.unlockMission || next.completed.includes(district.unlockMission)).map(district => district.id);
  while (next.xp >= next.level * 250) next.level++;
  const newRank = getCourierRank(next.xp); next.rank = newRank.name; next.lastRankUp = newRank.index > oldRank.index ? newRank : null;
  saveState(next);
  return next;
}
