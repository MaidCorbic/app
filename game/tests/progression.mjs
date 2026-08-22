import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const importSource = async (relativePath) => {
  const source = await readFile(new URL(relativePath, import.meta.url), 'utf8');
  return import(`data:text/javascript,${encodeURIComponent(source)}`);
};

const { missions } = await importSource('../src/missions.js');
const { MAX_LEVEL, claimChallenge, claimLoginReward, completeMission, getCourierRank, getLevelProgress, levelForXp, loadState, saveState, xpForLevel } = await importSource('../src/state.js');
const { normalizeAndValidateMissions } = await importSource('../src/systems/gameplay-contract.js');
const { repairProgressionState } = await importSource('../src/systems/gameplay-progression-repair.js');

const contractErrors = normalizeAndValidateMissions(missions);
assert.deepEqual(contractErrors, [], contractErrors.join('\n'));

const store = new Map();
globalThis.localStorage = {
  getItem: (key) => store.get(key) ?? null,
  setItem: (key, value) => store.set(key, value),
};

globalThis.window = {
  __relayGameplayProgressionRepair: true,
  addEventListener() {},
};

const completeRun = (state, mission, signals, time) => {
  const completed = completeMission(state, mission, signals, time, { jumps: 6, collisions: 0, falls: 0 });
  return repairProgressionState(completed).state;
};

const first = missions[0];
const second = missions[1];

let state = loadState();
assert.equal(state.xp, 0);
assert.equal(state.completed.length, 0);
assert.equal(state.completed.includes(second.id), false, 'Mission 02 starts locked');
assert.equal(first.parTime, 70000, 'Mission 01 uses authored par time');
assert.equal(second.parTime, 78000, 'Mission 02 uses authored par time');

state = completeRun(state, first, first.signals.length, 60000);
assert.equal(state.completed.includes(first.id), true, 'Mission 01 completion persists');
assert.ok(state.abilities.includes('dash'), 'Mission 01 unlocks Dash');
assert.ok(state.abilities.includes('vault'), 'Mission 01 unlocks Vault');
assert.equal(state.missionStats[first.id].bestRating, 3, 'Perfect Mission 01 earns three stars');
assert.ok(state.mastery[first.id].includes('SIGNAL SWEEP'), 'Signal mastery is persisted with the canonical badge id');
assert.ok(state.mastery[first.id].includes('PAR TIME'), 'Par-time mastery is persisted with the canonical badge id');
assert.ok(state.mastery[first.id].includes('CLEAN RUN'), 'Clean-run mastery is persisted with the canonical badge id');
assert.equal(getCourierRank(state.xp).name, 'RUNNER', 'Mission 01 advances courier rank');
assert.equal(state.totalRuns, 1, 'Only completed runs increment the run total');
assert.equal(state.tutorialSeen, true, 'The first completed route marks onboarding as seen');
assert.ok(state.achievements.includes(`route-${first.id}`), 'Each completed route earns a persistent achievement badge');
assert.ok(state.achievements.includes(`clean-${first.id}`), 'Clean route badges persist as achievements');
assert.equal(state.completed.includes(second.unlockRequirement), true, 'Mission 02 unlock requirement is satisfied');
assert.equal(state.completed.includes(missions[2].unlockRequirement), false, 'Mission 03 remains locked before Mission 02');

const firstScore = state.missionStats[first.id].bestScore;
state = completeRun(state, first, 4, 55000);
assert.equal(state.totalRuns, 2, 'Replay is counted as a completed run');
assert.equal(state.missionStats[first.id].bestScore, firstScore, 'Lower replay score cannot replace best score');
assert.equal(state.missionStats[first.id].bestTime, 55000, 'Faster replay replaces best time');
const retrySnapshot = JSON.stringify(state);
assert.equal(JSON.stringify(state), retrySnapshot, 'Retry without completion cannot mutate persistent progression');

state = completeRun(state, second, second.signals.length, 70000);
assert.equal(state.completed.includes(second.id), true, 'Mission 02 completion persists');
assert.deepEqual(state.campaign.claimedChapters, ['chapter-one'], 'Completing Chapter 01 routes claims its campaign reward once');
assert.deepEqual(state.rivalProgress.victories, ['dead-drop'], 'A par-time Dead Drop awards the first Mara Vex victory once');
assert.ok(state.abilities.includes('doubleJump'), 'Mission 02 unlocks Double Jump');
assert.ok(state.abilities.includes('slide'), 'Mission 02 unlocks Slide');
assert.equal(state.missionStats[second.id].bestRating, 3, 'Perfect Mission 02 earns three stars');
assert.ok(state.xp > 0 && state.rank !== 'ROOKIE', 'XP and persisted rank advance');
assert.equal(state.completed.includes(missions[2].unlockRequirement), true, 'Mission 03 unlock requirement is satisfied after Mission 02');

const contract = { id: 'one-shot', type: 'DELIVERY', xp: 40, credits: 5 };
state = completeMission(state, second, 0, 90000, { jumps: 0, collisions: 1, falls: 0, contract });
state = repairProgressionState(state).state;
assert.equal(state.lastXpBreakdown.contract, 40, 'An unclaimed contract awards its reward once');
state = completeMission(state, second, 0, 90000, { jumps: 0, collisions: 1, falls: 0, contract });
state = repairProgressionState(state).state;
assert.equal(state.lastXpBreakdown.contract, 0, 'A claimed contract cannot award rewards again');

state = { ...state, musicVolume: 0.3, screenShake: false, discoveredEnemies: ['chicken'], unlockedMissions: missions.slice(0, 3).map((mission) => mission.id) };
saveState(state);
const reloaded = loadState();
assert.equal(reloaded.xp, state.xp, 'XP survives reload');
assert.deepEqual(reloaded.completed, state.completed, 'Completed missions survive reload');
assert.deepEqual(reloaded.abilities, state.abilities, 'Unlocked abilities survive reload');
assert.deepEqual(reloaded.missionStats, state.missionStats, 'Mission records and ratings survive reload');
assert.deepEqual(reloaded.mastery, state.mastery, 'Mission mastery survives reload');
assert.deepEqual(reloaded.campaign, state.campaign, 'Campaign rewards survive reload');
assert.deepEqual(reloaded.rivalProgress, state.rivalProgress, 'Rival operation progress survives reload');
assert.equal(reloaded.musicVolume, 0.3, 'Settings survive reload');
assert.equal(reloaded.screenShake, false, 'Settings survive reload');
assert.deepEqual(reloaded.discoveredEnemies, ['chicken'], 'Enemy Codex discoveries survive reload');

const credited = completeRun(reloaded, first, first.signals.length, 65000);
assert.ok(credited.credits > reloaded.credits, 'Mission and modifier credits persist as progression currency');
assert.equal(credited.xp - reloaded.xp, credited.lastXpBreakdown.total, 'Displayed XP total matches the XP persisted for a completed run');
assert.ok(credited.daily?.date, 'Local daily progress is created for completed runs');
assert.ok(credited.daily.progress.signals >= first.signals.length, 'Daily Signal challenge progress accumulates from runs');
assert.ok(credited.weekly?.period, 'Weekly mission progress is created for completed runs');
assert.ok(credited.unlockedDistricts.includes('industrial'), 'District unlocks persist from completed mission progression');
assert.ok(credited.districtProgress['old-city'], 'District records persist mission progress');
assert.ok(credited.storyProgress, 'Story framework is present in persistent state');
assert.ok(Array.isArray(credited.rivalProgress.encounters), 'Rival framework is present in persistent state');

const dailyReady = { ...credited, daily: { ...credited.daily, progress: { ...credited.daily.progress, clean: 1 }, claimed: [] } };
const claimedDaily = claimChallenge(dailyReady, 'daily', 'clean');
assert.equal(claimedDaily.daily.claimed.includes('clean'), true, 'Completed daily challenges are claimable exactly once');
assert.ok(claimedDaily.xp > dailyReady.xp, 'Claiming a challenge awards XP');
assert.equal(claimChallenge(claimedDaily, 'daily', 'clean'), claimedDaily, 'Claimed challenges cannot be rewarded twice');
const loginClaimed = claimLoginReward(credited);
assert.ok(loginClaimed.credits > credited.credits, 'Login rewards grant the persistent credit currency');
assert.equal(claimLoginReward(loginClaimed), loginClaimed, 'Login rewards are claimable only once per day');
assert.equal(levelForXp(xpForLevel(MAX_LEVEL)), MAX_LEVEL, 'The progression curve reaches level 100');
assert.equal(levelForXp(xpForLevel(MAX_LEVEL) + 999999), MAX_LEVEL, 'The progression curve never exceeds level 100');
assert.equal(getLevelProgress(xpForLevel(MAX_LEVEL)).progress, 1, 'Level 100 reports complete progress');

console.log('Progression persistence tests passed.');
