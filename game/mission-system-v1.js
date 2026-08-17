import { missions } from './src/missions.js';
import { loadState } from './src/state.js';

(() => {
  if (window.__relayMissionSystemV1) return;
  window.__relayMissionSystemV1 = true;

  const pause = document.getElementById('pauseMenu');
  const panel = document.getElementById('panelContent');
  if (!pause || !panel) return;

  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = './mission-system-v1.css';
  document.head.appendChild(style);

  const state = () => loadState();
  const missionUnlocked = (mission, current) => !mission.unlockRequirement || current.completed.includes(mission.unlockRequirement);
  const safe = value => String(value ?? '').replace(/[&<>\"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#39;' }[char]));

  function render() {
    const tab = pause.querySelector('.tab[data-tab="missions"]');
    if (!tab?.classList.contains('active')) return;
    const current = state();
    const existing = [...panel.querySelectorAll('.mission-entry')];
    if (!existing.length) return;

    const completedCount = missions.filter(mission => current.completed.includes(mission.id)).length;
    const nextIndex = missions.findIndex(mission => !current.completed.includes(mission.id) && missionUnlocked(mission, current));
    const nextMission = nextIndex >= 0 ? missions[nextIndex] : null;

    panel.classList.add('mission-system-v1');
    let journal = panel.querySelector('.journal');
    if (!journal) return;
    journal.classList.add('mission-system-v1');

    let summary = journal.querySelector('.mission-v1-summary');
    if (!summary) {
      summary = document.createElement('header');
      summary.className = 'mission-v1-summary';
      journal.prepend(summary);
    }
    summary.innerHTML = `<div><h3>MISSION TERMINAL</h3></div><small><b>${completedCount}/${missions.length}</b> ROUTES SECURED<br>${nextMission ? `NEXT · ${safe(nextMission.title.toUpperCase())}` : 'ALL ROUTES SECURED'}</small>`;

    existing.forEach((button, index) => {
      if (!missions[index]) return;
      const mission = missions[index];
      const stat = current.missionStats?.[mission.id] || {};
      const unlocked = missionUnlocked(mission, current);
      const completed = Boolean(stat.completed || current.completed.includes(mission.id));
      const progress = completed ? 100 : stat.bestSignals ? Math.min(95, Math.round((stat.bestSignals / Math.max(1, mission.signals.length)) * 100)) : 0;
      const status = completed ? 'ROUTE SECURED' : unlocked ? 'AVAILABLE' : 'LOCKED';
      const action = completed ? 'REPLAY →' : unlocked ? 'START →' : 'LOCKED';
      const objectiveText = unlocked ? mission.objective : `Complete ${mission.unlockRequirement?.replaceAll('-', ' ') || 'previous route'} first.`;
      const tags = [mission.district, mission.difficulty, `${mission.reward} XP`, `${mission.signals.length} SIGNALS`];
      if (stat.bestRating) tags.push(`RATING ${'★'.repeat(stat.bestRating)}`);
      button.classList.add('mission-entry');
      button.classList.toggle('is-complete', completed);
      button.classList.toggle('is-locked', !unlocked);
      button.dataset.missionSystemV1 = 'true';
      button.setAttribute('aria-label', `${mission.title} · ${status}`);
      button.innerHTML = `<span>0${index + 1}<br>${safe(status)}</span><div><b>${safe(mission.title.toUpperCase())}</b><small>${safe(objectiveText)}</small><small>${safe(mission.description)}</small><div class="mission-v1-tags">${tags.map(tag => `<i>${safe(tag.toUpperCase())}</i>`).join('')}</div><div class="mission-v1-bar" aria-hidden="true"><i style="width:${progress}%"></i></div></div><span class="mission-v1-action">${action}</span>`;
      button.disabled = !unlocked;
    });
  }

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      render();
    });
  };

  document.addEventListener('click', event => {
    const tab = event.target.closest?.('#pauseMenu .tab[data-tab="missions"]');
    if (tab) window.setTimeout(schedule, 0);
  });

  const observer = new MutationObserver(schedule);
  observer.observe(panel, { childList: true, subtree: true });

  window.addEventListener('relay-mission-state-change', schedule);
})();
