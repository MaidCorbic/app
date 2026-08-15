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
export const MAX_LEVEL = 100;
export const dailyChallenges = [
  { id: 'signals', label: 'Collect 50 Signals', target: 50, xp: 80, credits: 35 },
  { id: 'contracts', label: 'Finish 3 Contracts', target: 3, xp: 100, credits: 50 },
  { id: 'clean', label: 'Complete a clean run', target: 1, xp: 65, credits: 30 },
  { id: 'dockTime', label: 'Finish Dead Drop under 90 seconds', target: 1, xp: 75, credits: 35 },
];
export const monthlyChallenges = [
  { id: 'runs', label: 'Complete 20 deliveries', target: 20, xp: 450, credits: 180 },
  { id: 'signals', label: 'Capture 400 Signals', target: 400, xp: 600, credits: 240 },
  { id: 'bosses', label: 'Defeat 8 route bosses', target: 8, xp: 750, credits: 300 },
];
export const weeklyChallenges = [
  { id: 'runs', label: 'Complete 8 deliveries', target: 8, xp: 220, credits: 90 },
  { id: 'signals', label: 'Capture 150 Signals', target: 150, xp: 280, credits: 110 },
  { id: 'clean', label: 'Complete 4 clean runs', target: 4, xp: 260, credits: 105 },
];
export const loginRewards = [25, 35, 50, 65, 85, 110, 160];
export const seasonalChallenges = [
  { id: 'routes', label: 'Secure every city route', target: 7, xp: 1200, credits: 500 },
  { id: 'mastery', label: 'Earn 12 mastery badges', target: 12, xp: 1000, credits: 420 },
  { id: 'bosses', label: 'Defeat 15 route bosses', target: 15, xp: 1400, credits: 600 },
];
export const achievementDefinitions = [
  { id: 'first-hostile-down', label: 'FIRST HOSTILE DOWN', detail: 'Defeat any hostile.' },
  { id: 'route-runner', label: 'CITY RUNNER', detail: 'Complete every city route.' },
  { id: 'signal-hunter', label: 'SIGNAL HUNTER', detail: 'Capture 250 Signals.' },
  { id: 'night-shift', label: 'NIGHT SHIFT', detail: 'Complete 25 deliveries.' },
  { id: 'boss-breaker', label: 'BOSS BREAKER', detail: 'Defeat five route bosses.' },
  { id: 'mastery-ace', label: 'MASTERY ACE', detail: 'Earn 12 mastery badges.' },
  { id: 'relay-legend', label: 'RELAY LEGEND', detail: 'Reach level 100.' },
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
export function xpForLevel(level) {
  const normalizedLevel = Math.max(1, Math.min(MAX_LEVEL, Math.floor(level)));
  const previousLevels = normalizedLevel - 1;
  return 220 * previousLevels + 18 * previousLevels * previousLevels;
}
export function levelForXp(xp) {
  let level = 1;
  while (level < MAX_LEVEL && xp >= xpForLevel(level + 1)) level++;
  return level;
}
export function getLevelProgress(xp) {
  const level = levelForXp(xp);
  const current = xpForLevel(level);
  const next = level === MAX_LEVEL ? current : xpForLevel(level + 1);
  return { level, current, next, progress: level === MAX_LEVEL ? 1 : (xp - current) / (next - current) };
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
  weekly: null,
  monthly: null,
  seasonal: null,
  login: { date: null, streak: 0, claimed: false },
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
function monthKey(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; }
function weekKey(date = new Date()) { const start = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())); start.setUTCDate(start.getUTCDate() + 4 - (start.getUTCDay() || 7)); const yearStart = new Date(Date.UTC(start.getUTCFullYear(), 0, 1)); return `${start.getUTCFullYear()}-W${String(Math.ceil(((start - yearStart) / 86400000 + 1) / 7)).padStart(2, '0')}`; }
function seasonKey(date = new Date()) { return `${date.getFullYear()}-S${Math.floor(date.getMonth() / 3) + 1}`; }
function challengeState(current, period) { return current?.period === period ? current : { period, progress: {}, claimed: [] }; }
function challengeProgress(state, mission, signals, cleanRun, contractComplete, bossDefeated) {
  const daily = state.daily?.date === today() ? state.daily : { date: today(), progress: {}, claimed: [] };
  const monthly = challengeState(state.monthly, monthKey());
  const weekly = challengeState(state.weekly, weekKey());
  const seasonal = challengeState(state.seasonal, seasonKey());
  return {
    daily: { ...daily, progress: { ...daily.progress, signals: (daily.progress.signals || 0) + signals, contracts: (daily.progress.contracts || 0) + (contractComplete ? 1 : 0), clean: (daily.progress.clean || 0) + (cleanRun ? 1 : 0), dockTime: (daily.progress.dockTime || 0) + (mission.id === 'dead-drop' && signals >= 0 ? 1 : 0) } },
    weekly: { ...weekly, progress: { ...weekly.progress, runs: (weekly.progress.runs || 0) + 1, signals: (weekly.progress.signals || 0) + signals, clean: (weekly.progress.clean || 0) + (cleanRun ? 1 : 0) } },
    monthly: { ...monthly, progress: { ...monthly.progress, runs: (monthly.progress.runs || 0) + 1, signals: (monthly.progress.signals || 0) + signals, bosses: (monthly.progress.bosses || 0) + (bossDefeated ? 1 : 0) } },
    seasonal: { ...seasonal, progress: { ...seasonal.progress, routes: state.completed.includes(mission.id) ? state.completed.length : state.completed.length + 1, mastery: 0, bosses: (seasonal.progress.bosses || 0) + (bossDefeated ? 1 : 0) } },
  };
}
export function earnedAchievementIds(state) {
  const masteryCount = Object.values(state.mastery || {}).reduce((total, badges) => total + badges.length, 0);
  const bossWins = Object.keys(state.missionStats || {}).filter(id => state.achievements?.includes(`boss-${id}`)).length;
  return [
    state.achievements?.includes('first-hostile-down') && 'first-hostile-down',
    state.completed?.length >= 7 && 'route-runner',
    state.signals >= 250 && 'signal-hunter',
    state.totalRuns >= 25 && 'night-shift',
    bossWins >= 5 && 'boss-breaker',
    masteryCount >= 12 && 'mastery-ace',
    state.level >= MAX_LEVEL && 'relay-legend',
  ].filter(Boolean);
}
export function claimChallenge(state, scope, id) {
  const definitions = { daily: dailyChallenges, weekly: weeklyChallenges, monthly: monthlyChallenges, seasonal: seasonalChallenges }[scope];
  const progress = state[scope];
  const challenge = definitions?.find(entry => entry.id === id);
  if (!challenge || !progress || progress.claimed?.includes(id) || (progress.progress?.[id] || 0) < challenge.target) return state;
  const xp = state.xp + challenge.xp;
  state.xp = xp;
  state.credits = state.credits + challenge.credits;
  state.level = levelForXp(xp);
  state[scope] = { ...progress, claimed: [...progress.claimed, id] };
  state.achievements = [...new Set([...(state.achievements || []), ...earnedAchievementIds(state)])];
  saveState(state);
  return state;
}
export function claimLoginReward(state) {
  const date = today(); const login = state.login || defaults.login;
  if (login.date === date && login.claimed) return state;
  const previous = login.date ? daysBetween(login.date, date) : 0;
  const streak = previous === 1 ? Math.min(7, login.streak + 1) : 1;
  const credits = loginRewards[streak - 1]; const xp = state.xp + credits * 2;
  const next = { ...state, xp, credits: state.credits + credits, level: levelForXp(xp), login: { date, streak, claimed: true } };
  next.achievements = [...new Set([...(next.achievements || []), ...earnedAchievementIds(next)])]; saveState(next); return next;
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
    return { ...defaults, ...saved, daily, weekly: challengeState(saved.weekly, weekKey()), monthly: challengeState(saved.monthly, monthKey()), seasonal: challengeState(saved.seasonal, seasonKey()), completed, level: levelForXp(saved.xp || 0), storyProgress: saved.storyProgress || saved.worldStory || defaults.storyProgress, unlockedDistricts: saved.unlockedDistricts || unlockedDistricts, rank: saved.rank || getCourierRank(saved.xp || 0).name, unlockedMissions: saved.unlockedMissions || ['first-delivery'] };
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
  const cleanRun = !(runStats.deaths > 0);
  const mastery = state.mastery?.[mission.id] || [];
  const missionMastery = [...mastery];
  if (signals === mission.signals.length && !missionMastery.includes('signal-hunter')) missionMastery.push('signal-hunter');
  if (elapsedMs <= mission.parTime && !missionMastery.includes('speed-run')) missionMastery.push('speed-run');
  if (cleanRun && !missionMastery.includes('clean-run')) missionMastery.push('clean-run');
  if (runStats.enemyDefeats >= 3 && !missionMastery.includes('hunter')) missionMastery.push('hunter');
  const contract = runStats.contract;
  const contractComplete = Boolean(contract && runStats.contractCompleted);
  const contractXp = contractComplete ? contract.xp : 0;
  const credits = Math.floor(earned / 10) + (contractComplete ? contract.credits : 0);
  const campaignClaimed = new Set(state.campaign?.claimedChapters || []);
  const newCampaignRewards = campaignRewards.filter(reward => !campaignClaimed.has(reward.id) && reward.missions.every(id => [...state.completed, mission.id].includes(id)));
  const campaignXp = newCampaignRewards.reduce((total, reward) => total + reward.xp, 0);
  const campaignCredits = newCampaignRewards.reduce((total, reward) => total + reward.credits, 0);
  const rivalVictory = Boolean(runStats.rivalVictory && rivalMissionIds.has(mission.id));
  const previousRivalVictories = state.rivalProgress?.victories || [];
  const newRivalVictory = rivalVictory && !previousRivalVictories.includes(mission.id);
  const rivalXp = newRivalVictory ? 100 : 0;
  const rivalCredits = newRivalVictory ? 40 : 0;
  const totalXp = earned + contractXp + campaignXp + rivalXp;
  const nextXp = state.xp + totalXp;
  const newAbilities = [];
  if (state.completed.length >= 0 && !state.abilities.includes('dash')) newAbilities.push('dash');
  if (state.completed.length >= 2 && !state.abilities.includes('doubleJump')) newAbilities.push('doubleJump');
  if (state.completed.length >= 4 && !state.abilities.includes('wallJump')) newAbilities.push('wallJump');
  const missionStat = { ...previousMission, completed: true, bestScore: Math.max(previousMission.bestScore, score), bestTime: !previousMission.bestTime || elapsedMs < previousMission.bestTime ? elapsedMs : previousMission.bestTime, bestRating: Math.max(previousMission.bestRating || 0, 1), bestSecrets: Math.max(previousMission.bestSecrets || 0, runStats.secrets || 0), bestSignals: Math.max(previousMission.bestSignals || 0, signals), mastery: missionMastery };
  const district = districts.find(item => item.missions.includes(mission.id));
  const previousDistrict = state.districtProgress?.[district?.id] || { missions: 0, signals: 0, secrets: 0, bestScore: 0 };
  const newCompleted = state.completed.includes(mission.id) ? state.completed : [...state.completed, mission.id];
  const challengeUpdates = challengeProgress({ ...state, completed: newCompleted }, mission, signals, cleanRun, contractComplete, Boolean(runStats.bossDefeated));
  const next = {
    ...state,
    xp: nextXp,
    credits: state.credits + credits + campaignCredits + rivalCredits,
    level: levelForXp(nextXp),
    missionStats: { ...state.missionStats, [mission.id]: missionStat },
    completed: newCompleted,
    unlockedMissions: missions.filter((_, index) => !missions[index].unlockRequirement || newCompleted.includes(missions[index].unlockRequirement)).map(route => route.id),
    campaign: { claimedChapters: [...campaignClaimed, ...newCampaignRewards.map(chapter => chapter.id)] },
    ...challengeUpdates,
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
    lastXpBreakdown: { completion: mission.reward, signals: signalBonus, secrets: secretBonus, optional: optionalBonus, streak: streakBonus, package: packageBonus, modifier: modifierXp, daily: 0, contract: contractXp, campaign: campaignXp, campaignChapters: newCampaignRewards.map(chapter => chapter.id), rival: rivalXp, credits: credits + campaignCredits + rivalCredits, total: totalXp, objectives: completedObjectives.map(objective => objective.label) },
    tutorialSeen: true,
    achievements: [...new Set([...(state.achievements || []), `route-${mission.id}`, cleanRun && `clean-${mission.id}`, signals === mission.signals.length && `signals-${mission.id}`, runStats.enemyDefeats > 0 && 'first-hostile-down', runStats.bossDefeated && `boss-${mission.id}`].filter(Boolean))],
    abilities: newAbilities.length ? [...state.abilities, ...newAbilities] : state.abilities,
    lastAbilityUnlock: ['dash', 'doubleJump', 'wallJump'].includes(newAbilities[0]) ? newAbilities[0] : null,
  };
  if (contractComplete) next.contractStats = { ...(state.contractStats || {}), [contract.id]: { completed: true, bestTime: elapsedMs } };
  if (!next.completed.includes(mission.id)) next.completed = [...next.completed, mission.id];
  next.unlockedDistricts = districts.filter(district => !district.unlockMission || next.completed.includes(district.unlockMission)).map(district => district.id);
  next.seasonal.progress.mastery = Object.values(next.mastery).reduce((total, badges) => total + badges.length, 0);
  next.level = levelForXp(next.xp);
  next.achievements = [...new Set([...next.achievements, ...earnedAchievementIds(next)])];
  const newRank = getCourierRank(next.xp); next.rank = newRank.name; next.lastRankUp = newRank.index > oldRank.index ? newRank : null;
  saveState(next);
  return next;
}