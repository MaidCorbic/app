import { getCourierRank, getLevelProgress, loadState, MAX_LEVEL } from './src/state.js';
import { missions } from './src/missions.js';

const panel = document.getElementById('panelContent');
const profileTab = document.querySelector('#pauseMenu [data-tab="progress"]');

if (panel && profileTab) {
  const number = value => Number.isFinite(Number(value)) ? Number(value).toLocaleString() : '0';
  const pct = value => `${Math.max(0, Math.min(100, Math.round((Number(value) || 0) * 100)))}%`;

  function renderProfile() {
    const state = loadState();
    const xp = Number(state.xp) || 0;
    const level = getLevelProgress(xp);
    const rank = getCourierRank(xp);
    const completed = Array.isArray(state.completed) ? state.completed.length : 0;
    const achievementCount = Array.isArray(state.achievements) ? state.achievements.length : 0;
    const masteryCount = Object.values(state.mastery || {}).reduce((sum, badges) => sum + (Array.isArray(badges) ? badges.length : 0), 0);
    const campaignPercent = missions.length ? Math.round((completed / missions.length) * 100) : 0;
    const nextRank = rank.next;
    const rankProgress = nextRank ? Math.max(0, Math.min(1, rank.progress)) : 1;
    const xpIntoLevel = Math.max(0, xp - level.current);
    const xpNeeded = Math.max(1, level.next - level.current);
    const xpRemaining = Math.max(0, level.next - xp);

    panel.innerHTML = `
      <section id="playerProfile" aria-label="Player profile and progression">
        <div class="pp-shell">
          <header class="pp-head">
            <div><p class="pp-kicker">COURIER PROFILE // LIVE STATE</p><h2 class="pp-title">PLAYER <em>PROGRESSION.</em></h2><p class="pp-sub">Your profile is calculated directly from the current game save. No duplicate progression state is created.</p></div>
            <div class="pp-rank"><small>COURIER RANK</small><strong>${rank.name}</strong>${nextRank ? `<small>NEXT · ${nextRank.name}</small>` : '<small>MAX RANK</small>'}</div>
          </header>
          <section class="pp-level" aria-label="Level progress">
            <div><small>LEVEL</small><b>${level.level}</b></div>
            <div class="pp-xp-track" aria-hidden="true"><i class="pp-xp-fill" style="width:${pct(level.progress)}"></i></div>
            <div class="pp-xp-copy"><b>${number(xpIntoLevel)}</b> / ${number(xpNeeded)} XP · ${xpRemaining ? `${number(xpRemaining)} TO NEXT` : 'MAX LEVEL'}</div>
          </section>
          <section class="pp-grid" aria-label="Profile statistics">
            <article class="pp-stat"><small>TOTAL XP</small><strong>${number(xp)}</strong><span>Lifetime progression</span></article>
            <article class="pp-stat"><small>COINS</small><strong>${number(state.credits)}</strong><span>Current credits</span></article>
            <article class="pp-stat"><small>SIGNALS</small><strong>${number(state.signals)}</strong><span>Captured</span></article>
            <article class="pp-stat"><small>STREAK</small><strong>${number(state.streak)}</strong><span>Best ${number(state.longestStreak)}</span></article>
          </section>
          <section class="pp-sections">
            <article class="pp-card">
              <h3>PROGRESSION <span>// STATUS</span></h3>
              <div class="pp-row"><div><b>CAMPAIGN</b><small>${completed} of ${missions.length} missions completed</small></div><span class="pp-pill">${campaignPercent}%</span></div>
              <div class="pp-row"><div><b>ACHIEVEMENTS</b><small>Unlocked achievements</small></div><strong>${achievementCount}</strong></div>
              <div class="pp-row"><div><b>MASTERY</b><small>Badges earned</small></div><strong>${masteryCount}</strong></div>
              <div class="pp-row"><div><b>RUNS</b><small>Completed deliveries</small></div><strong>${number(state.totalRuns)}</strong></div>
              <div class="pp-row"><div><b>BEST SCORE</b><small>Personal best run</small></div><strong>${number(state.bestRun)}</strong></div>
            </article>
            <article class="pp-card">
              <h3>NEXT <span>// TARGET</span></h3>
              <div class="pp-row"><div><b>LEVEL ${level.level + (level.level < MAX_LEVEL ? 1 : 0)}</b><small>${level.level < MAX_LEVEL ? 'Keep earning XP' : 'Maximum level reached'}</small></div><span class="pp-pill">${level.level < MAX_LEVEL ? `${number(xpRemaining)} XP` : 'MAX'}</span></div>
              <div class="pp-row"><div><b>${nextRank ? nextRank.name : rank.name}</b><small>${nextRank ? nextRank.unlock : 'All rank clearance unlocked'}</small></div><span class="pp-pill">${pct(rankProgress)}</span></div>
              <div class="pp-rank-track" aria-label="Rank progress"><i style="width:${pct(rankProgress)}"></i></div>
              <div class="pp-row"><div><b>LAST XP REWARD</b><small>Most recent recorded XP breakdown</small></div><strong>+${number(state.lastXpBreakdown?.total || 0)}</strong></div>
            </article>
          </section>
          <footer class="pp-footer">PROFILE V1 · READ-ONLY UI · GAMEPLAY, PHASER AND SAVE LOGIC ARE NOT MODIFIED</footer>
        </div>
      </section>`;
  }

  let active = false;
  function openProfile(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation(); }
    active = true;
    document.querySelectorAll('#pauseMenu .tab').forEach(tab => tab.classList.toggle('active', tab === profileTab));
    renderProfile();
  }

  document.addEventListener('click', event => {
    const tab = event.target.closest('#pauseMenu [data-tab="progress"]');
    if (tab) openProfile(event);
  }, true);

  const observer = new MutationObserver(() => {
    if (active && !document.getElementById('playerProfile') && document.querySelector('#pauseMenu:not(.hidden)')) renderProfile();
  });
  observer.observe(panel, { childList: true });
  window.addEventListener('storage', () => { if (active) renderProfile(); });
}
