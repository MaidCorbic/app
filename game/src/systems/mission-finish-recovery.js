import { missions } from '../missions.js';
import { completeMission, loadState, saveState } from '../state.js';

const RECOVERY_DELAY = 360;
let timer;

function formatTime(ms) {
  const value = Math.max(0, Number(ms) || 0);
  return `${String(Math.floor(value / 60000)).padStart(2, '0')}:${String(Math.floor(value / 1000) % 60).padStart(2, '0')}.${Math.floor(value % 1000 / 100)}`;
}

function showRecoveredFinish(scene) {
  const finish = document.getElementById('finish');
  const play = document.getElementById('play');
  const mission = scene?.mission;
  if (!finish || !mission?.id || !scene?.finished || !finish.classList.contains('hidden')) return false;

  let state = loadState();
  const missionIndex = missions.findIndex(item => item.id === mission.id);
  if (missionIndex < 0) return false;

  const alreadyPersisted = state.missionStats?.[mission.id]?.completed && state.lastXpBreakdown?.elapsedMs === scene.elapsedMs && state.lastXpBreakdown?.total !== undefined;
  if (!alreadyPersisted) {
    const runStats = {
      jumps: scene.jumps || 0,
      collisions: scene.collisions || 0,
      falls: scene.falls || 0,
      secrets: scene.secretsCollected || 0,
      alarms: scene.alarms || 0,
      chaseEscapes: scene.chaseEscapes || 0,
      enemyDefeats: scene.enemyDefeats || 0,
      bossDefeated: Boolean(scene.boss && !scene.boss.active),
      package: scene.package,
      packageCondition: scene.packageCondition,
      contract: mission.activeContract,
      modifier: scene.loadout?.modifier,
      signalBonusExtra: (scene.boostedSignals || 0) * 5 + (scene.loadout?.upgrades?.includes('signalXp') ? scene.collected : 0),
      score: (scene.collected || 0) * 100 + (scene.secretsCollected || 0) * 250 + (scene.boostedSignals || 0) * 100,
    };
    state = completeMission(state, mission, scene.collected || 0, scene.elapsedMs || 0, runStats);
    state = { ...state, unlockedMissions: missions.filter(item => !item.unlockRequirement || state.completed.includes(item.unlockRequirement)).map(item => item.id) };
    saveState(state);
  }

  const stat = state.missionStats?.[mission.id] || { bestRating: 1, bestScore: scene.collected * 100, bestTime: scene.elapsedMs };
  const breakdown = state.lastXpBreakdown || {};
  document.getElementById('finishRating').textContent = '★'.repeat(Math.max(1, stat.bestRating || 1));
  document.getElementById('finishSignals').textContent = `${scene.collected || 0} / ${mission.signals.length} SIGNALS`;
  document.getElementById('finishXp').textContent = `+${breakdown.total || 0} XP`;
  document.getElementById('finishScore').textContent = `RUN SCORE ${(scene.collected || 0) * 100 + (scene.secretsCollected || 0) * 250} · BEST ${stat.bestScore || 0}`;
  document.getElementById('finishTime').textContent = `TIME ${formatTime(scene.elapsedMs)} · BEST ${formatTime(stat.bestTime)}`;
  document.getElementById('finishLine').textContent = mission.unlocks ? `${mission.unlocks} is now available in the mission terminal.` : 'The final relay hums awake across the city.';
  const next = document.getElementById('nextMission');
  const hasNext = missionIndex + 1 < missions.length && (!missions[missionIndex + 1].unlockRequirement || state.completed.includes(missions[missionIndex + 1].unlockRequirement));
  next.classList.toggle('hidden', !hasNext);
  play.classList.add('hidden');
  finish.classList.remove('hidden');
  console.warn('[Relay Runner] Mission finish UI recovered after completion handoff.', mission.id);
  return true;
}

function tick() {
  const scene = window.__relayRunnerScene;
  const finish = document.getElementById('finish');
  if (scene?.finished && finish?.classList.contains('hidden')) showRecoveredFinish(scene);
  timer = window.setTimeout(tick, 350);
}

if (!window.__relayMissionFinishRecovery) {
  window.__relayMissionFinishRecovery = true;
  timer = window.setTimeout(tick, RECOVERY_DELAY);
}
