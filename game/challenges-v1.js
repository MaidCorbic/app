import './challenges-v1.css';
import { claimChallenge, dailyChallenges, loadState, monthlyChallenges, seasonalChallenges, weeklyChallenges } from './src/state.js';

const pause = document.getElementById('pauseMenu');
const panel = document.getElementById('panelContent');

if (pause && panel) {
  const nav = pause.querySelector('.menu-grid aside nav');
  let tab = pause.querySelector('[data-tab="challenges"]');

  if (!tab && nav) {
    tab = document.createElement('button');
    tab.className = 'tab';
    tab.type = 'button';
    tab.dataset.tab = 'challenges';
    tab.textContent = 'CHALLENGES';
    const settingsTab = nav.querySelector('[data-tab="settings"]');
    nav.insertBefore(tab, settingsTab || null);
  }

  const scopes = [
    { key: 'daily', label: 'DAILY OPERATIONS', items: dailyChallenges },
    { key: 'weekly', label: 'WEEKLY OPERATIONS', items: weeklyChallenges },
    { key: 'monthly', label: 'MONTHLY OBJECTIVES', items: monthlyChallenges },
    { key: 'seasonal', label: 'SEASONAL DIRECTIVES', items: seasonalChallenges },
  ];

  const escapeHtml = value => String(value ?? '').replace(/[&<>\"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[character]));
  const number = value => Number(value || 0).toLocaleString();
  const progressValue = (state, scope, challenge) => Number(state[scope]?.progress?.[challenge.id] || 0);
  const isClaimed = (state, scope, challenge) => Array.isArray(state[scope]?.claimed) && state[scope].claimed.includes(challenge.id);
  const isReady = (state, scope, challenge) => progressValue(state, scope, challenge) >= Number(challenge.target || 0);
  const progressPercent = (state, scope, challenge) => Math.max(0, Math.min(100, Math.round((progressValue(state, scope, challenge) / Math.max(1, Number(challenge.target || 1))) * 100)));

  function renderChallenges() {
    const state = loadState();
    panel.innerHTML = `
      <section id="challengeHub" class="ch-v1" aria-label="Challenges">
        <header class="ch-v1-head">
          <p class="ch-v1-kicker">CITY RELAY NETWORK // ACTIVE TASKS</p>
          <h2 class="ch-v1-title">CHALLENGE <em>BOARD.</em></h2>
          <p class="ch-v1-sub">Complete objectives during normal play. Rewards use the existing progression and save system.</p>
        </header>
        <div class="ch-v1-grid">
          ${scopes.map(scope => scope.items.map(challenge => {
            const progress = progressValue(state, scope.key, challenge);
            const ready = isReady(state, scope.key, challenge);
            const claimed = isClaimed(state, scope.key, challenge);
            const status = claimed ? 'CLAIMED' : ready ? 'READY' : 'IN PROGRESS';
            const statusClass = claimed ? 'claimed' : ready ? 'ready' : '';
            return `
              <article class="ch-v1-card ${ready ? 'complete' : ''} ${claimed ? 'claimed' : ''}">
                <div class="ch-v1-card-head">
                  <span class="ch-v1-scope">${escapeHtml(scope.label)}</span>
                  <span class="ch-v1-status ${statusClass}">${status}</span>
                </div>
                <h3 class="ch-v1-name">${escapeHtml(challenge.label)}</h3>
                <p class="ch-v1-description">Progress updates automatically when the existing game state records the matching activity.</p>
                <div class="ch-v1-progress">
                  <div class="ch-v1-track" aria-hidden="true"><i class="ch-v1-fill" style="width:${progressPercent(state, scope.key, challenge)}%"></i></div>
                  <span class="ch-v1-value">${number(progress)} / ${number(challenge.target)}</span>
                </div>
                <footer class="ch-v1-footer">
                  <span class="ch-v1-reward"><b>+${number(challenge.xp)} XP</b> · ${number(challenge.credits)} CREDITS</span>
                  <button class="ch-v1-claim" type="button" data-challenge-scope="${escapeHtml(scope.key)}" data-challenge-id="${escapeHtml(challenge.id)}" ${ready && !claimed ? '' : 'disabled'}>${claimed ? 'CLAIMED' : 'CLAIM REWARD'}</button>
                </footer>
              </article>`;
          }).join('')).join('')}
        </div>
        <p class="ch-v1-note">CHALLENGES V1 · READS EXISTING STATE · NO NEW SAVE DATA · NO GAMEPLAY CHANGES</p>
      </section>`;
  }

  let active = false;

  function openChallenges(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
    active = true;
    pause.querySelectorAll('.tab').forEach(button => button.classList.toggle('active', button === tab));
    renderChallenges();
  }

  document.addEventListener('click', event => {
    const challengeTab = event.target.closest('#pauseMenu [data-tab="challenges"]');
    if (challengeTab) openChallenges(event);
  }, true);

  document.addEventListener('click', event => {
    const button = event.target.closest('#pauseMenu .ch-v1-claim');
    if (!button || button.disabled) return;
    const scope = button.dataset.challengeScope;
    const id = button.dataset.challengeId;
    const state = loadState();
    const definition = scopes.find(entry => entry.key === scope)?.items.find(entry => entry.id === id);
    if (!definition) return;
    claimChallenge(state, scope, id);
    active = true;
    renderChallenges();
  });

  const observer = new MutationObserver(() => {
    if (active && !document.getElementById('challengeHub') && !pause.classList.contains('hidden')) renderChallenges();
  });
  observer.observe(panel, { childList: true });
  window.addEventListener('storage', () => { if (active) renderChallenges(); });
}
