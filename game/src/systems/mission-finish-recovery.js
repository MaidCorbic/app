import { missions } from '../missions.js';
import { completeMission, loadState, saveState } from '../state.js';

const RECOVERY_DELAY = 360;
let timer;
function formatTime(ms) { const value = Math.max(0, Number(ms) || 0); return `${String(Math.floor(value / 60000)).padStart(2, '0')}:${String(Math.floor(value / 1000) % 60).padStart(2, '0')}.${Math.floor(value % 1000 / 100)}`; }

function showRecoveredFinish(scene) {
  const finish = document.getElementById('finish'); const play = document.getElementById('play'); const mission = scene?.mission;
  if (!finish || !mission?.id || !scene?.finished || !finish.classList.contains('hidden')) return false;
  let state = loadState(); const missionIndex = missions.findIndex(item => item.id === mission.id); if (missionIndex < 0) return false;
  const maxBonus = Math.max(0, Number(scene.maxGameplayBonus) || 0); const maxCaches = Math.max(0, Number(scene.maxGameplay?.caches) || 0);
  const alreadyPersisted = Boolean(state.missionStats?.[mission.id]?.completed);
  if (!alreadyPersisted) {
    const baseScore = (scene.collected || 0) * 100 + (scene.secretsCollected || 0) * 250 + (scene.boostedSignals || 0) * 100;
    const runStats = { jumps: scene.jumps || 0, collisions: scene.collisions || 0, falls: scene.falls || 0, secrets: scene.secretsCollected || 0, alarms: scene.alarms || 0, chaseEscapes: scene.chaseEscapes || 0, enemyDefeats: scene.enemyDefeats || 0, bossDefeated: Boolean(scene.boss && !scene.boss.active), package: scene.package, packageCondition: scene.packageCondition, contract: mission.activeContract, modifier: scene.loadout?.modifier, signalBonusExtra: (scene.boostedSignals || 0) * 5 + (scene.loadout?.upgrades?.includes('signalXp') ? scene.collected : 0), gameplayMaxBonus: maxBonus, gameplayMaxCaches: maxCaches, score: baseScore + maxBonus };
    state = completeMission(state, mission, scene.collected || 0, scene.elapsedMs || 0, runStats);
    state = { ...state, unlockedMissions: missions.filter(item => !item.unlockRequirement || state.completed.includes(item.unlockRequirement)).map(item => item.id) }; saveState(state);
  }
  window.dispatchEvent(new CustomEvent('relay:mission-complete', { detail: { scene, missionId: mission.id } }));
  const performanceResult = window.__missionFlowPerformanceV1?.finalize?.(scene) || window.__missionFlowPerformanceV1?.latest || null; if (!performanceResult) console.warn('[Relay Runner] Performance V1 did not produce a completion result.', mission.id);
  const stat = state.missionStats?.[mission.id] || { bestRating: 1, bestScore: (scene.collected || 0) * 100, bestTime: scene.elapsedMs }; const breakdown = state.lastXpBreakdown || {};
  const runScore = (scene.collected || 0) * 100 + (scene.secretsCollected || 0) * 250 + (scene.boostedSignals || 0) * 100 + maxBonus;
  document.getElementById('finishRating').textContent = '★'.repeat(Math.max(1, stat.bestRating || 1)); document.getElementById('finishSignals').textContent = `${scene.collected || 0} / ${mission.signals.length} SIGNALS`; document.getElementById('finishXp').textContent = `+${breakdown.total || 0} XP`; document.getElementById('finishScore').textContent = `RUN SCORE ${runScore} · BEST ${stat.bestScore || 0}`; document.getElementById('finishTime').textContent = `TIME ${formatTime(scene.elapsedMs)} · BEST ${formatTime(stat.bestTime)}`;
  document.getElementById('finishLine').textContent = maxCaches > 0 ? `${mission.unlocks ? `${mission.unlocks} is now available.` : 'The final relay hums awake across the city.'} · RELAY CACHE BONUS +${maxBonus}` : mission.unlocks ? `${mission.unlocks} is now available in the mission terminal.` : 'The final relay hums awake across the city.';
  const next = document.getElementById('nextMission'); const hasNext = missionIndex + 1 < missions.length && (!missions[missionIndex + 1].unlockRequirement || state.completed.includes(missions[missionIndex + 1].unlockRequirement)); next.classList.toggle('hidden', !hasNext); play.classList.add('hidden'); finish.classList.remove('hidden');
  console.warn('[Relay Runner] Mission finish recovery completed.', mission.id); return true;
}

const transitionLocks = new WeakSet();
function installTransitionGate() { ['again', 'nextMission', 'retry'].forEach(id => { const button = document.getElementById(id); if (!button || button.dataset.relayTransitionGate === '1') return; button.dataset.relayTransitionGate = '1'; button.addEventListener('click', event => { if (transitionLocks.has(button)) { event.preventDefault(); event.stopImmediatePropagation(); return; } transitionLocks.add(button); button.disabled = true; requestAnimationFrame(() => requestAnimationFrame(() => { transitionLocks.delete(button); if (button.isConnected) button.disabled = false; })); }, true); }); }
function tick() { installTransitionGate(); const scene = window.__relayRunnerScene; const finish = document.getElementById('finish'); if (scene?.finished && finish?.classList.contains('hidden')) { try { showRecoveredFinish(scene); } catch (error) { console.error('[Relay Runner] Mission finish recovery failed.', error); } } timer = window.setTimeout(tick, 350); }
if (!window.__relayMissionFinishRecovery) { window.__relayMissionFinishRecovery = true; installTransitionGate(); timer = window.setTimeout(tick, RECOVERY_DELAY); }
