import { dailyChallenges, weeklyChallenges, monthlyChallenges, claimChallenge, loadState } from './src/state.js';

const panel = document.getElementById('panelContent');
if (!panel) throw new Error('Pause panel not found');

const PERIODS = { daily: dailyChallenges, weekly: weeklyChallenges, monthly: monthlyChallenges };
let activePeriod = 'daily';
let countdownTimer = null;

const periodEnd = period => {
  const now = new Date();
  if (period === 'daily') return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (period === 'weekly') {
    const end = new Date(now); end.setHours(0, 0, 0, 0);
    const days = (8 - (end.getDay() || 7)) % 7 || 7;
    end.setDate(end.getDate() + days); return end;
  }
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
};
const countdown = period => {
  const ms = Math.max(0, periodEnd(period) - new Date());
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor(total % 86400 / 3600);
  const m = Math.floor(total % 3600 / 60);
  const s = total % 60;
  return d ? `${d}D ${String(h).padStart(2,'0')}H` : `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
};
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function renderChallenges() {
  const state = loadState();
  const list = PERIODS[activePeriod];
  const progressState = state[activePeriod] || { progress: {}, claimed: [] };
  panel.innerHTML = `<div class="pause-segment">
    <div class="challenge-tabs">${Object.keys(PERIODS).map(period => `<button type="button" class="challenge-tab ${period === activePeriod ? 'active' : ''}" data-challenge-period="${period}">${period.toUpperCase()}</button>`).join('')}</div>
    <div class="challenge-head"><h3>${activePeriod.toUpperCase()} CHALLENGES</h3><span class="challenge-countdown" data-challenge-countdown>${countdown(activePeriod)}</span></div>
    ${list.map(challenge => {
      const value = Math.min(challenge.target, Number(progressState.progress?.[challenge.id] || 0));
      const done = value >= challenge.target;
      const claimed = progressState.claimed?.includes(challenge.id);
      return `<article class="challenge-card">
        <div class="challenge-row"><div><div class="challenge-name">${esc(challenge.label)}</div><div class="challenge-progress">${value} / ${challenge.target}</div></div><button type="button" class="challenge-claim ${claimed ? 'challenge-claimed' : ''}" data-claim-challenge="${esc(challenge.id)}" ${!done || claimed ? 'disabled' : ''}>${claimed ? 'COLLECTED' : 'COLLECT'}</button></div>
        <div class="challenge-bar"><i style="width:${Math.round(value / challenge.target * 100)}%"></i></div>
        <div class="reward-row"><span class="reward-chip">+${challenge.xp} XP</span><span class="reward-chip">+${challenge.credits} COINS</span></div>
      </article>`;
    }).join('')}
  </div>`;
  clearInterval(countdownTimer);
  countdownTimer = setInterval(() => { const node = panel.querySelector('[data-challenge-countdown]'); if (node) node.textContent = countdown(activePeriod); }, 1000);
}

function findButton(label) {
  return [...panel.querySelectorAll('button')].find(button => button.textContent.trim().toLowerCase().startsWith(label.toLowerCase()));
}

function injectSegments() {
  const existing = panel.querySelector('[data-relay-v2-segments]');
  if (existing) return;
  const anchor = document.createElement('div');
  anchor.dataset.relayV2Segments = 'true';
  anchor.className = 'pause-segment';
  anchor.innerHTML = `<div class="pause-segment-title"><span>RELAY HUB</span><small>LIVE MODULES</small></div><div class="pause-action-grid"><button type="button" data-relay-hub="campaign">CAMPAIGN<small>STORY &amp; CHAPTERS</small></button><button type="button" data-relay-hub="loadout">LOADOUT<small>EQUIPMENT &amp; ABILITIES</small></button><button type="button" data-relay-hub="challenges">CHALLENGES<small>DAILY / WEEKLY / MONTHLY</small></button></div>`;
  panel.prepend(anchor);
}

const renderHub = kind => {
  if (kind === 'challenges') { activePeriod = 'daily'; renderChallenges(); return; }
  if (kind === 'campaign') {
    panel.innerHTML = `<div class="pause-segment"><div class="pause-segment-title"><span>CAMPAIGN</span><small>CHAPTER 01 / NIGHT SHIFT</small></div><h3>RELAY NETWORK</h3><p>Progress through the city relay chapters and unlock the next route.</p><div class="reward-row"><span class="reward-chip">STORY PROGRESS</span><span class="reward-chip">XP + CREDITS</span></div></div>`;
    return;
  }
  panel.innerHTML = `<div class="pause-segment"><div class="pause-segment-title"><span>LOADOUT</span><small>ACTIVE KIT</small></div><h3>COURIER KIT</h3><p>Your current equipment and abilities stay connected to the live game state.</p><div class="reward-row"><span class="reward-chip">SCANNER</span><span class="reward-chip">CELL</span></div></div>`;
};

panel.addEventListener('click', event => {
  const hub = event.target.closest('[data-relay-hub]');
  if (hub) { renderHub(hub.dataset.relayHub); return; }
  const period = event.target.closest('[data-challenge-period]');
  if (period) { activePeriod = period.dataset.challengePeriod; renderChallenges(); return; }
  const claim = event.target.closest('[data-claim-challenge]');
  if (claim && !claim.disabled) {
    const next = claimChallenge(loadState(), activePeriod, claim.dataset.claimChallenge);
    if (next) renderChallenges();
  }
});

const observer = new MutationObserver(() => { injectSegments(); });
observer.observe(panel, { childList: true, subtree: true });
window.addEventListener('beforeunload', () => clearInterval(countdownTimer));
injectSegments();
