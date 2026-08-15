import { campaignChapters } from './src/campaign.js';
import { missions } from './src/missions.js';
import { loadState } from './src/state.js';

const pause = document.getElementById('pauseMenu');
const panel = document.getElementById('panelContent');
if (!pause || !panel) return;

const missionById = new Map(missions.map((mission, index) => [mission.id, { mission, index }]));

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>\"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[character]));
}

function renderCampaign() {
  const state = loadState();
  const completed = new Set(Array.isArray(state.completed) ? state.completed : []);
  const unlocked = new Set(Array.isArray(state.unlockedMissions) ? state.unlockedMissions : ['first-delivery']);
  const claimed = new Set(state.campaign?.claimedChapters || []);
  const completedChapters = campaignChapters.filter(chapter => chapter.missionIds.every(id => completed.has(id))).length;
  const currentIndex = campaignChapters.findIndex(chapter => chapter.missionIds.some(id => unlocked.has(id) && !completed.has(id)));

  const chapterMarkup = campaignChapters.map((chapter, index) => {
    const missionEntries = chapter.missionIds.map(id => missionById.get(id)).filter(Boolean);
    const chapterComplete = chapter.missionIds.every(id => completed.has(id));
    const chapterUnlocked = index === 0 || chapter.missionIds.some(id => unlocked.has(id)) || chapter.missionIds.some(id => completed.has(id));
    const current = !chapterComplete && (index === currentIndex || (currentIndex === -1 && chapterUnlocked && index === campaignChapters.length - 1));
    const status = chapterComplete ? 'COMPLETE' : !chapterUnlocked ? 'LOCKED' : current ? 'CURRENT' : 'AVAILABLE';
    const missionsHtml = chapterUnlocked
      ? missionEntries.map(({ mission, index: missionIndex }) => {
          const done = completed.has(mission.id);
          const available = unlocked.has(mission.id) || done;
          return `<button class="campaign-v2-mission" type="button" data-campaign-mission="${missionIndex}" ${available ? '' : 'disabled'} aria-label="${escapeHtml(available ? `Open ${mission.title}` : `Locked ${mission.title}`)}"><span><b>${escapeHtml(mission.title)}</b><small>${done ? 'COMPLETED' : available ? escapeHtml(mission.difficulty) : 'LOCKED'}</small></span><span class="campaign-v2-arrow">${done ? '✓' : available ? '→' : '—'}</span></button>`;
        }).join('')
      : `<div class="campaign-v2-lock">${escapeHtml(chapter.briefing)} · COMPLETE THE PREVIOUS CHAPTER TO UNLOCK</div>`;
    return `<article class="campaign-v2-card ${chapterComplete ? 'complete' : ''} ${current ? 'current' : ''} ${!chapterUnlocked ? 'locked' : ''}"><div class="campaign-v2-card-head"><div><span class="campaign-v2-number">${escapeHtml(chapter.number)}</span><h3 class="campaign-v2-name">${escapeHtml(chapter.title)}</h3></div><span class="campaign-v2-status">${status}</span></div><p class="campaign-v2-brief">${escapeHtml(chapter.briefing)}</p><div class="campaign-v2-meta"><span class="campaign-v2-chip">${chapter.missionIds.length} MISSIONS</span>${chapter.rival ? `<span class="campaign-v2-chip">RIVAL · ${escapeHtml(chapter.rival)}</span>` : '<span class="campaign-v2-chip">RELAY RUN</span>'}</div><div class="campaign-v2-missions">${missionsHtml}</div><div class="campaign-v2-reward"><span>REWARD · +${Number(chapter.reward?.xp) || 0} XP</span><span>+${Number(chapter.reward?.credits) || 0} COINS</span><span>${claimed.has(chapter.id) ? 'CLAIMED' : chapterComplete ? 'READY' : 'LOCKED'}</span></div></article>`;
  }).join('');

  panel.innerHTML = `<section class="campaign-v2" aria-label="Campaign progression"><header class="campaign-v2-head"><p class="campaign-v2-kicker">RELAY RUNNER // CAMPAIGN</p><h2 class="campaign-v2-title">CITY <em>CAMPAIGN.</em></h2><p class="campaign-v2-sub">Follow the route from Old Quarter to Cityspine. Missions and completion status are read from your existing game save.</p></header><section class="campaign-v2-summary" aria-label="Campaign summary"><div class="campaign-v2-stat"><small>CHAPTERS</small><strong>${completedChapters}/${campaignChapters.length}</strong></div><div class="campaign-v2-stat"><small>MISSIONS</small><strong>${completed.size}/${missions.length}</strong></div><div class="campaign-v2-stat"><small>COINS</small><strong>${Number(state.credits || 0).toLocaleString()}</strong></div></section><section class="campaign-v2-chapters">${chapterMarkup}</section><p class="campaign-v2-note">Campaign data is read-only in this screen. Selecting an available mission opens the existing mission flow; no duplicate gameplay or save system is created.</p></section>`;

  panel.querySelectorAll('[data-campaign-mission]').forEach(button => button.addEventListener('click', () => {
    const missionIndex = Number(button.dataset.campaignMission);
    const missionsTab = pause.querySelector('[data-tab="missions"]');
    missionsTab?.click();
    window.setTimeout(() => panel.querySelector(`[data-mission="${missionIndex}"]:not([disabled])`)?.click(), 0);
  }));
}

let campaignActive = false;
document.addEventListener('click', event => {
  const tab = event.target.closest('#pauseMenu [data-tab="campaign"]');
  if (!tab) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  campaignActive = true;
  pause.querySelectorAll('.tab').forEach(item => item.classList.toggle('active', item === tab));
  renderCampaign();
}, true);

const observer = new MutationObserver(() => {
  if (campaignActive && pause.classList.contains('hidden')) campaignActive = false;
});
observer.observe(pause, { attributes: true, attributeFilter: ['class'] });
