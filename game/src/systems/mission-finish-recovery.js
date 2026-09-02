import { missions } from '../missions.js';
import { completeMission, loadState, saveState } from '../state.js';

const RECOVERY_DELAY = 360;
let timer = null;
let observer = null;
let handledRunKey = null;

const getElement = id => document.getElementById(id);
const setText = (id, value) => {
  const element = getElement(id);
  if (!element) return false;
  element.textContent = String(value ?? '');
  return true;
};

function formatTime(ms) {
  const value = Math.max(0, Number(ms) || 0);
  return `${String(Math.floor(value / 60000)).padStart(2, '0')}:${String(Math.floor(value / 1000) % 60).padStart(2, '0')}.${Math.floor(value % 1000 / 100)}`;
}

function runKey(scene) {
  const runId = scene?.runId;
  if (runId !== undefined && runId !== null) return `run:${runId}`;
  const startedAt = Number(scene?.__webSceneStartedAt);
  if (Number.isFinite(startedAt) && startedAt > 0) return `started:${startedAt}`;
  return `mission:${scene?.mission?.id || 'unknown'}`;
}

function stopPolling() {
  if (timer !== null) {
    window.clearTimeout(timer);
    timer = null;
  }
}

function schedulePoll(delay = RECOVERY_DELAY) {
  stopPolling();
  timer = window.setTimeout(tick, delay);
}

function showRecoveredFinish(scene) {
  const finish = getElement('finish');
  const play = getElement('play');
  const mission = scene?.mission;
  const key = runKey(scene);
  if (!finish?.classList || !mission?.id || !scene?.finished || !finish.classList.contains('hidden')) return false;
  if (handledRunKey === key) return false;

  const missionIndex = missions.findIndex(item => item.id === mission.id);
  if (missionIndex < 0) return false;

  let state = loadState();
  const alreadyPersisted = Boolean(state.missionStats?.[mission.id]?.completed);
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

  handledRunKey = key;
  window.dispatchEvent(new CustomEvent('relay:mission-complete', { detail: { scene, missionId: mission.id, runId: scene.runId ?? null, recovered: true } }));
  const performanceResult = window.__missionFlowPerformanceV1?.finalize?.(scene) || window.__missionFlowPerformanceV1?.latest || null;
  if (!performanceResult) console.warn('[Relay Runner] Performance V1 did not produce a completion result.', mission.id);

  const stat = state.missionStats?.[mission.id] || { bestRating: 1, bestScore: (scene.collected || 0) * 100, bestTime: scene.elapsedMs };
  const breakdown = state.lastXpBreakdown || {};
  setText('finishRating', '★'.repeat(Math.max(1, stat.bestRating || 1)));
  setText('finishSignals', `${scene.collected || 0} / ${mission.signals?.length || 0} SIGNALS RECOVERED`);
  setText('finishXp', `+${breakdown.total || 0} XP`);
  setText('finishScore', `RUN SCORE ${(scene.collected || 0) * 100 + (scene.secretsCollected || 0) * 250} · BEST ${stat.bestScore || 0}`);
  setText('finishTime', `TIME ${formatTime(scene.elapsedMs)} · BEST ${formatTime(stat.bestTime)}`);
  setText('finishLine', mission.unlocks ? `NEXT ROUTE UNLOCKED · ${mission.unlocks} is now available in the mission terminal.` : 'RELAY STATUS STABLE · THE FINAL RELAY IS BACK ONLINE.');

  const next = getElement('nextMission');
  const hasNext = missionIndex + 1 < missions.length && (!missions[missionIndex + 1].unlockRequirement || state.completed.includes(missions[missionIndex + 1].unlockRequirement));
  next?.classList.toggle('hidden', !hasNext);
  play?.classList.add('hidden');
  finish.classList.remove('hidden');
  console.warn('[Relay Runner] Mission finish UI recovered after completion handoff.', mission.id);
  return true;
}

function tick() {
  timer = null;
  const scene = window.__relayRunnerScene;
  const finish = getElement('finish');
  if (!scene?.finished) {
    schedulePoll();
    return;
  }
  if (finish?.classList?.contains('hidden')) {
    try { showRecoveredFinish(scene); }
    catch (error) { console.error('[Relay Runner] Mission finish recovery failed.', error); }
  }
  if (finish && !finish.classList.contains('hidden')) stopPolling();
  else schedulePoll();
}

function installLifecycleObserver() {
  if (observer || typeof MutationObserver === 'undefined') return;
  const finish = getElement('finish');
  if (!finish) return;
  observer = new MutationObserver(() => {
    if (finish.classList.contains('hidden')) {
      handledRunKey = null;
      schedulePoll(RECOVERY_DELAY);
    } else stopPolling();
  });
  observer.observe(finish, { attributes: true, attributeFilter: ['class'] });
}

if (!window.__relayMissionFinishRecovery) {
  window.__relayMissionFinishRecovery = true;
  installLifecycleObserver();
  schedulePoll(RECOVERY_DELAY);
  window.addEventListener('beforeunload', () => {
    stopPolling();
    observer?.disconnect();
    observer = null;
  }, { once: true });
}
