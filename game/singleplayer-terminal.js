import { loadState } from './src/state.js';

(() => {
  const ROOT_ID = 'singleplayerTerminal';
  const HISTORY_KEY = 'relay-runner-singleplayer-history-v1';
  const PREFS_KEY = 'relay-runner-singleplayer-prefs-v1';

  const readJson = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value ?? fallback;
    } catch {
      return fallback;
    }
  };

  const writeJson = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* Local persistence is optional. */
    }
  };

  const state = () => loadState();

  const prefs = () => ({
    difficulty: 'NORMAL',
    style: 'BALANCED',
    skin: 'DEFAULT',
    ...readJson(PREFS_KEY, {}),
  });

  const history = () => readJson(HISTORY_KEY, []);

  const formatTime = ms => {
    const value = Math.max(0, Number(ms) || 0);
    const seconds = Math.floor(value / 1000);
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  };

  const escapeHtml = value =>
    String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');

  const renderHistory = () => {
    const items = history();

    if (!items.length) {
      return '<li><span>NO COMPLETED RUNS RECORDED</span><span>—</span></li>';
    }

    return items.slice(0, 12).map((item, index) => `
      <li>
        <span>#${index + 1} ${escapeHtml(item.missionId || 'RUN')}</span>
        <span>${Number(item.score) || 0} · ${escapeHtml(item.rating || '—')} · ${formatTime(item.elapsedMs)}</span>
      </li>
    `).join('');
  };

  const render = () => {
    const root = document.getElementById(ROOT_ID);
    if (!root) return;

    const current = state();
    const selected = prefs();
    const completed = Array.isArray(current.completed) ? current.completed.length : 0;
    const achievements = Array.isArray(current.achievements) ? current.achievements.length : 0;
    const secrets = Number(current.discoveredSecrets) || 0;
    const runs = Number(current.totalRuns) || 0;
    const best = Number(current.bestRun) || 0;

    root.innerHTML = `
      <div class="singleplayer-card" role="dialog" aria-modal="true" aria-labelledby="singleplayerTitle">
        <header class="singleplayer-head">
          <div>
            <p class="singleplayer-kicker">LOCAL // SINGLEPLAYER TERMINAL</p>
            <h2 id="singleplayerTitle" class="singleplayer-title">RUN AGAIN.</h2>
            <p class="singleplayer-sub">Everything here is local. No online profile, leaderboard or multiplayer service is required.</p>
          </div>
          <button class="singleplayer-close" type="button" data-sp-close aria-label="Close singleplayer terminal">×</button>
        </header>

        <div class="singleplayer-grid">
          <article class="singleplayer-module">
            <h3>PERSONAL RECORDS</h3>
            <p>Your permanent local performance data.</p>
            <strong class="singleplayer-value">${best}</strong>
            <span class="singleplayer-status">BEST SCORE</span>
            <ul class="singleplayer-list">
              <li><span>RUNS</span><b>${runs}</b></li>
              <li><span>MISSIONS</span><b>${completed}</b></li>
              <li><span>ACHIEVEMENTS</span><b>${achievements}</b></li>
              <li><span>SECRETS</span><b>${secrets}</b></li>
            </ul>
          </article>

          <article class="singleplayer-module">
            <h3>DIFFICULTY</h3>
            <p>Local preference for the next playable run.</p>
            <strong class="singleplayer-value">${escapeHtml(selected.difficulty)}</strong>
            <div class="singleplayer-actions">
              ${['NORMAL', 'HARD', 'BRUTAL'].map(value => `<button type="button" data-sp-pref="difficulty" data-sp-value="${value}" class="${selected.difficulty === value ? 'is-active' : ''}">${value}</button>`).join('')}
            </div>
          </article>

          <article class="singleplayer-module">
            <h3>LOADOUT</h3>
            <p>Current canonical progression loadout.</p>
            <ul class="singleplayer-list">
              <li><span>WEAPON</span><b>${escapeHtml(current.equippedWeapon || 'SIDEARM')}</b></li>
              <li><span>EQUIPMENT</span><b>${Array.isArray(current.equipment) ? current.equipment.length : 0}</b></li>
              <li><span>ABILITIES</span><b>${Array.isArray(current.abilities) ? current.abilities.length : 0}</b></li>
              <li><span>BUILD SLOTS</span><b>${Array.isArray(current.buildLoadout) ? current.buildLoadout.filter(Boolean).length : 0}/2</b></li>
            </ul>
            <span class="singleplayer-status">PROGRESSION-LINKED</span>
          </article>

          <article class="singleplayer-module">
            <h3>CUSTOMIZATION</h3>
            <p>Local cosmetic preference. Gameplay identity stays unchanged.</p>
            <strong class="singleplayer-value">${escapeHtml(selected.skin)}</strong>
            <div class="singleplayer-actions">
              ${['DEFAULT', 'NIGHT', 'RELAY'].map(value => `<button type="button" data-sp-pref="skin" data-sp-value="${value}" class="${selected.skin === value ? 'is-active' : ''}">${value}</button>`).join('')}
            </div>
          </article>

          <article class="singleplayer-module">
            <h3>RUN STYLE</h3>
            <p>Local target profile for replay sessions.</p>
            <strong class="singleplayer-value">${escapeHtml(selected.style)}</strong>
            <div class="singleplayer-actions">
              ${['SPEED', 'STEALTH', 'BALANCED'].map(value => `<button type="button" data-sp-pref="style" data-sp-value="${value}" class="${selected.style === value ? 'is-active' : ''}">${value}</button>`).join('')}
            </div>
          </article>

          <article class="singleplayer-module">
            <h3>GHOST RUN</h3>
            <p>Best performance is retained locally as replay data source.</p>
            <strong class="singleplayer-value">${history().length ? escapeHtml(history()[0].rating || '—') : 'READY'}</strong>
            <span class="singleplayer-status">${history().length ? 'LATEST RUN SAVED' : 'NO GHOST YET'}</span>
          </article>

          <article class="singleplayer-module">
            <h3>MODIFIERS</h3>
            <p>Existing mission modifier system remains owned by gameplay.</p>
            <span class="singleplayer-status">${current.activeModifier ? 'ACTIVE MODIFIER' : 'NO MODIFIER'}</span>
            <ul class="singleplayer-list">
              <li><span>SEASON</span><b>${escapeHtml(current.seasonal?.period || '—')}</b></li>
              <li><span>RANK</span><b>${escapeHtml(current.rank || 'ROOKIE')}</b></li>
            </ul>
          </article>

          <article class="singleplayer-module">
            <h3>SECRETS / COLLECTIBLES</h3>
            <p>Existing secret counter is surfaced here for replay goals.</p>
            <strong class="singleplayer-value">${secrets}</strong>
            <span class="singleplayer-status">LOCAL COUNTER</span>
          </article>

          <article class="singleplayer-module">
            <h3>ENDGAME</h3>
            <p>Campaign completion and mastery remain the core long-term loop.</p>
            <ul class="singleplayer-list">
              <li><span>XP</span><b>${Number(current.xp) || 0}</b></li>
              <li><span>LEVEL</span><b>${Number(current.level) || 1}</b></li>
              <li><span>MASTERY</span><b>${Object.values(current.mastery || {}).flat().length}</b></li>
            </ul>
            <span class="singleplayer-status">LOCAL PROGRESSION</span>
          </article>

          <article class="singleplayer-module singleplayer-history">
            <h3>RUN HISTORY</h3>
            <p>Latest completed performance snapshots stored on this device.</p>
            <ol class="singleplayer-list">${renderHistory()}</ol>
          </article>
        </div>
      </div>
    `;
  };

  const open = () => {
    const root = document.getElementById(ROOT_ID);
    if (!root) return;
    render();
    root.classList.add('is-open');
    root.setAttribute('aria-hidden', 'false');
  };

  const close = () => {
    const root = document.getElementById(ROOT_ID);
    if (!root) return;
    root.classList.remove('is-open');
    root.setAttribute('aria-hidden', 'true');
  };

  const install = () => {
    if (document.getElementById(ROOT_ID)) return;

    const root = document.createElement('section');
    root.id = ROOT_ID;
    root.setAttribute('aria-hidden', 'true');
    document.body.append(root);

    document.addEventListener('click', event => {
      const button = event.target.closest?.('[data-sp-open]');
      if (button) open();

      const closeButton = event.target.closest?.('[data-sp-close]');
      if (closeButton) close();

      const prefButton = event.target.closest?.('[data-sp-pref]');
      if (prefButton) {
        const next = prefs();
        next[prefButton.dataset.spPref] = prefButton.dataset.spValue;
        writeJson(PREFS_KEY, next);
        render();
      }
    });

    root.addEventListener('click', event => {
      if (event.target === root) close();
    });

    window.addEventListener('keydown', event => {
      if (event.key === 'Escape') close();
    });

    window.addEventListener('relay:mission-performance-complete', event => {
      const result = event.detail;
      if (!result) return;

      const next = history().filter(item => item.runKey !== result.runSequence);
      next.unshift({
        runKey: result.runSequence,
        missionId: result.missionId,
        score: result.score,
        rating: result.rating,
        elapsedMs: result.raw?.elapsedMs || 0,
        signals: result.raw?.signals || 0,
        timestamp: Date.now(),
      });

      writeJson(HISTORY_KEY, next.slice(0, 20));
      if (document.getElementById(ROOT_ID)?.classList.contains('is-open')) render();
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();
