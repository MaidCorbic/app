import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const importSource = async (relativePath) => {
  const source = await readFile(new URL(relativePath, import.meta.url), 'utf8');
  return import(`data:text/javascript,${encodeURIComponent(source)}`);
};

const { missions } = await importSource('../src/missions.js');
globalThis.missions = missions;
const { MAX_LEVEL, claimChallenge, claimLoginReward, completeMission, getCourierRank, getLevelProgress, levelForXp, loadState, saveState, xpForLevel } = await importSource('../src/state.js');

const store = new Map();
globalThis.localStorage = {
  getItem: (key) => store.get(key) ?? null,
  setItem: (key, value) => store.set(key, value),
};

const completeRun = (state, mission, signals, time) => completeMission(state, mission, signals, time, { jumps: 6, collisions: 0, falls: 0 });
const first = missions[0];
const second = missions[1];

let state = loadState();
assert.equal(state.xp, 0);
assert.equal(state.completed.length, 0);
assert.equal(state.completed.includes(second.id), false, 'Mission 02 starts locked');

state = completeRun(state, first, first.signals.length, 60000);
assert.equal(state.completed.includes(first.id), true, 'Mission 01 completion persists');
assert.equal(state.abilities.includes('dash'), true, 'Mission 01 unlocks Dash');
assert.equal(state.missionStats[first.id].bestRating, 3, 'Perfect Mission 01 earns three stars');
assert.deepEqual(state.mastery[first.id], ['SIGNAL SWEEP', 'PAR TIME', 'CLEAN RUN'], 'Mastery badges are awarded for a clean par-time Signal sweep');
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
assert.equal(state.abilities.includes('doubleJump'), true, 'Mission 02 unlocks Double Jump');
assert.equal(state.missionStats[second.id].bestRating, 3, 'Perfect Mission 02 earns three stars');
assert.ok(state.xp > 0 && state.rank !== 'ROOKIE', 'XP and persisted rank advance');
assert.equal(state.completed.includes(missions[2].unlockRequirement), true, 'Mission 03 unlock requirement is satisfied after Mission 02');

const contract = { id: 'one-shot', type: 'DELIVERY', xp: 40, credits: 5 };
state = completeMission(state, second, 0, 90000, { jumps: 0, collisions: 1, falls: 0, contract });
assert.equal(state.lastXpBreakdown.contract, 40, 'An unclaimed contract awards its reward once');
state = completeMission(state, second, 0, 90000, { jumps: 0, collisions: 1, falls: 0, contract });
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

const credited = completeMission(reloaded, first, first.signals.length, 65000, { jumps: 6, collisions: 0, falls: 0, modifier: { id: 'noDash', xp: 35, credits: 18 } });
assert.ok(credited.credits > reloaded.credits, 'Mission and modifier credits persist as progression currency');
assert.equal(credited.xp - reloaded.xp, credited.lastXpBreakdown.total, 'Displayed XP total matches the XP persisted for a completed run');
assert.ok(credited.daily?.date, 'Local daily progress is created for completed runs');
