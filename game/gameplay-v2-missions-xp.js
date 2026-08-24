import { getCourierRank, getLevelProgress, loadState } from './src/state.js';

const stateKey = 'relay-runner-state';
const $ = selector => document.querySelector(selector);
const intro = $('#intro');
const play = $('#play');

let lastSnapshot = '';
let visible = true;

function getState() {
  try {
    const raw = localStorage.getItem(stateKey);
    return raw ? { ...loadState(), ...JSON.parse(raw) } : loadState();
  } catch {
    return loadState();
  }
}

function formatXp(value) {
  return Math.max(0, Math.floor(Number(value) || 0)).toLocaleString('en-US');
}

function ensureHud() {
  if (!play) return null;
  if ($('#gameplayV2Hud')) return $('#gameplayV2Hud');
  const hud = document.createElement('section');
  hud.id = 'gameplayV2Hud';
  hud.className = 'gameplay-v2-hud';
  hud.setAttribute('aria-label', 'Mission and XP status');
  hud.innerHTML = `
    <div class="g2-mission">
      <span class="g2-kicker">ACTIVE MISSION</span>
      <strong id="g2MissionName">ROOFTOP RELAY</strong>
      <span id="g2MissionGoal">FOLLOW THE RELAY</span>
    </div>
    <div class="g2-progress">
      <div class="g2-progress-top"><span id="g2Rank">ROOKIE</span><span id="g2XpText">0 XP</span></div>
      <div class="g2-track"><i id="g2XpBar"></i></div>
      <div class="g2-progress-bottom"><span id="g2Level">LV 1</span><span id="g2NextRank">NEXT RANK — 300 XP</span></div>
    </div>
    <div class="g2-streak" id="g2Streak">RUN STREAK <b>0</b></div>
  `;
  play.appendChild(hud);
  return hud;
}

function currentMissionName() {
  return $('#objective')?.textContent?.trim() || $('#worldGoal')?.textContent?.trim() || 'FOLLOW THE RELAY';
}

function updateHud(force = false) {
  const hud = ensureHud();
  if (!hud) return;
  const state = getState();
  const xp = Number(state.xp) || 0;
  const rank = getCourierRank(xp);
  const level = getLevelProgress(xp);
  const missionName = currentMissionName();
  const missionNumber = $('#missionNumber')?.textContent?.trim() || $('#worldGoal')?.previousElementSibling?.textContent?.trim() || 'MISSION 01';
  const signals = $('#signalCount')?.textContent?.trim() || '00';
  const streak = Number(state.streak) || 0;
  const snapshot = [xp, rank.name, level.level, level.progress, missionName, missionNumber, signals, streak, intro?.classList.contains('hidden')].join('|');
  if (!force && snapshot === lastSnapshot) return;
  lastSnapshot = snapshot;

  $('#g2MissionName').textContent = missionName;
  $('#g2MissionGoal').textContent = `${missionNumber}  •  ${signals} SIGNALS`;
  $('#g2Rank').textContent = rank.name;
  $('#g2XpText').textContent = `${formatXp(xp)} XP`;
  $('#g2Level').textContent = `LV ${level.level}`;
  $('#g2XpBar').style.width = `${Math.max(0, Math.min(100, level.progress * 100))}%`;
  $('#g2NextRank').textContent = rank.next ? `NEXT RANK — ${formatXp(rank.next.threshold)} XP` : 'MAX RANK';
  $('#g2Streak').innerHTML = `RUN STREAK <b>${streak}</b>`;

  visible = !!intro?.classList.contains('hidden');
  hud.classList.toggle('is-active', visible);
}

function pulseXp() {
  const hud = ensureHud();
  if (!hud) return;
  hud.classList.remove('xp-pulse');
  void hud.offsetWidth;
  hud.classList.add('xp-pulse');
  window.setTimeout(() => hud.classList.remove('xp-pulse'), 700);
}

window.addEventListener('relay:xp', pulseXp);
window.addEventListener('relay-xp-earned', pulseXp);
window.addEventListener('storage', event => {
  if (event.key === stateKey) updateHud(true);
});
document.addEventListener('visibilitychange', () => updateHud(true));

ensureHud();
updateHud(true);
window.setInterval(updateHud, 500);

window.RelayGameplayV2 = Object.freeze({
  refresh: () => updateHud(true),
  pulseXp,
  getSnapshot: () => ({ ...getState() }),
});
