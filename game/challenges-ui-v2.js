import { dailyChallenges, weeklyChallenges, monthlyChallenges, claimChallenge, loadState } from './src/state.js';

const challengeStyles = document.createElement('link');
challengeStyles.rel = 'stylesheet';
challengeStyles.href = './challenges-ui-v2.css';
document.head.appendChild(challengeStyles);
const progressionStyles = document.createElement('link');
progressionStyles.rel = 'stylesheet';
progressionStyles.href = './progression-ui-v3.css';
document.head.appendChild(progressionStyles);

const panel = document.getElementById('panelContent');
if (!panel) throw new Error('Pause panel not found');
const PERIODS = { daily: dailyChallenges, weekly: weeklyChallenges, monthly: monthlyChallenges };
let activePeriod = 'daily';
let countdownTimer = null;

const periodEnd = period => {
  const now = new Date();
  if (period === 'daily') return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (period === 'weekly') { const end = new Date(now); end.setHours(0,0,0,0); const days = (8 - (end.getDay() || 7)) % 7 || 7; end.setDate(end.getDate() + days); return end; }
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
};
const countdown = period => {
  const total = Math.max(0, Math.floor((periodEnd(period) - new Date()) / 1000));
  const d = Math.floor(total / 86400), h = Math.floor(total % 86400 / 3600), m = Math.floor(total % 3600 / 60), s = total % 60;
  return d ? `${d}D ${String(h).padStart(2,'0')}H` : `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
};
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function renderChallenges() {
  const state = loadState();
  const list = PERIODS[activePeriod] || [];
  const progressState = state[activePeriod] || { progress: {}, claimed: [] };
  panel.innerHTML = `<div class="progression-v3">
    <div class="v3-head"><div><p class="v3-kicker">RELAY OBJECTIVES</p><h3>${activePeriod.toUpperCase()} CHALLENGES</h3></div><span class="v3-timer" data-challenge-countdown>${countdown(activePeriod)}</span></div>
    <div class="v3-tabs">${Object.keys(PERIODS).map(period => `<button type="button" class="${period === activePeriod ? 'active' : ''}" data-challenge-period="${period}">${period.toUpperCase()}</button>`).join('')}</div>
    ${list.map(challenge => {
      const value = Math.min(challenge.target, Number(progressState.progress?.[challenge.id] || 0));
      const done = value >= challenge.target;
      const claimed = progressState.claimed?.includes(challenge.id);
      const percent = Math.round(value / challenge.target * 100);
      return `<article class="v3-card ${done && !claimed ? 'complete' : ''} challenge-card">
        <div class="v3-row"><div><div class="v3-name">${esc(challenge.label)}</div><div class="v3-meta">${value} / ${challenge.target} • ${percent}% COMPLETE</div></div><button type="button" class="v3-collect ${claimed ? 'collected' : ''}" data-claim-challenge="${esc(challenge.id)}" ${!done || claimed ? 'disabled' : ''}>${claimed ? 'COLLECTED' : 'COLLECT'}</button></div>
        <div class="v3-bar"><i style="width:${percent}%"></i></div>
        <div class="v3-rewards"><span class="v3-reward">✦ +${challenge.xp} XP</span><span class="v3-reward">◈ +${challenge.credits} COINS</span></div>
        <div class="v3-feedback" data-feedback="${esc(challenge.id)}"></div>
      </article>`;
    }).join('')}
  </div>`;
  clearInterval(countdownTimer);
  countdownTimer = setInterval(() => { const node = panel.querySelector('[data-challenge-countdown]'); if (node) node.textContent = countdown(activePeriod); }, 1000);
}

const missionCatalog = [
  ['first-delivery','Old Quarter','ROOFTOP RELAY'], ['dead-drop','Industrial','DEAD DROP'], ['blackout','Downtown','BLACKOUT'], ['pursuit','Corporate','PURSUIT'], ['signal-storm','Residential','SIGNAL STORM'], ['corporate-lockdown','Apex','CORPORATE LOCKDOWN'], ['final-relay','Apex','FINAL RELAY']
];
function renderCampaign() {
  const state = loadState();
  const completed = new Set(state.completed || []);
  const unlocked = new Set(state.unlockedMissions || ['first-delivery']);
  const doneCount = missionCatalog.filter(([id]) => completed.has(id)).length;
  const current = missionCatalog.find(([id]) => unlocked.has(id) && !completed.has(id)) || missionCatalog.find(([id]) => !completed.has(id));
  panel.innerHTML = `<div class="progression-v3"><div class="v3-head"><div><p class="v3-kicker">CITY RELAY</p><h3>CAMPAIGN</h3></div><span class="v3-timer">${doneCount} / ${missionCatalog.length} ROUTES</span></div><div class="v3-card"><div class="v3-row"><div><div class="v3-name">CHAPTER 01 / NIGHT SHIFT</div><div class="v3-meta">${Math.round(doneCount / missionCatalog.length * 100)}% CAMPAIGN PROGRESS</div></div><span class="v3-reward">+XP / CREDITS</span></div><div class="v3-bar"><i style="width:${Math.round(doneCount / missionCatalog.length * 100)}%"></i></div>${missionCatalog.map(([id,district,label]) => { const done=completed.has(id), isCurrent=current?.[0]===id, isLocked=!done && !unlocked.has(id) && !isCurrent; return `<div class="v3-campaign-node ${done?'done':''} ${isCurrent?'current':''} ${isLocked?'locked':''}"><span class="v3-node-dot"></span><div><div class="v3-name">${label}</div><div class="v3-meta">${district} • ${done?'COMPLETED':isLocked?'LOCKED':'CURRENT ROUTE'}</div></div><span class="v3-reward">${done?'✓':'○'}</span></div>`; }).join('')}</div></div>`;
}
function renderLoadout() {
  const state = loadState();
  const items = [...new Set([...(state.equipment || []), ...(state.ownedWeapons || []), ...(state.abilities || [])])];
  const cards = items.length ? items.map(item => `<div class="v3-loadout-card"><b>${esc(String(item).replace(/-/g,' ').toUpperCase())}</b><small>${state.equippedWeapon === item ? 'EQUIPPED WEAPON' : (state.abilities || []).includes(item) ? 'ABILITY' : 'AVAILABLE KIT'}</small></div>`).join('') : '<div class="v3-meta">No unlocked equipment yet.</div>';
  panel.innerHTML = `<div class="progression-v3"><div class="v3-head"><div><p class="v3-kicker">COURIER TERMINAL</p><h3>LOADOUT</h3></div><span class="v3-timer">${items.length} ITEMS</span></div><div class="v3-card"><div class="v3-row"><div><div class="v3-name">ACTIVE COURIER KIT</div><div class="v3-meta">CONNECTED TO LIVE GAME STATE</div></div></div><div class="v3-loadout-grid" style="margin-top:12px">${cards}</div></div></div>`;
}
function renderHub(kind) {
  if (kind === 'challenges') { activePeriod = 'daily'; renderChallenges(); return; }
  if (kind === 'campaign') { renderCampaign(); return; }
  renderLoadout();
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

panel.addEventListener('click', event => {
  const hub = event.target.closest('[data-relay-hub]');
  if (hub) { renderHub(hub.dataset.relayHub); return; }
  const period = event.target.closest('[data-challenge-period]');
  if (period) { activePeriod = period.dataset.challengePeriod; renderChallenges(); return; }
  const claim = event.target.closest('[data-claim-challenge]');
  if (claim && !claim.disabled) {
    const stateBefore = loadState();
    const challenge = (PERIODS[activePeriod] || []).find(item => item.id === claim.dataset.claimChallenge);
    const next = claimChallenge(stateBefore, activePeriod, claim.dataset.claimChallenge);
    if (next !== stateBefore) {
      const feedback = panel.querySelector(`[data-feedback="${CSS.escape(claim.dataset.claimChallenge)}"]`);
      if (feedback && challenge) { feedback.textContent = `+${challenge.xp} XP  •  +${challenge.credits} COINS`; feedback.classList.add('show'); }
      setTimeout(renderChallenges, 750);
    }
  }
});

const observer = new MutationObserver(() => injectSegments());
observer.observe(panel, { childList: true, subtree: true });
window.addEventListener('beforeunload', () => clearInterval(countdownTimer));
injectSegments();