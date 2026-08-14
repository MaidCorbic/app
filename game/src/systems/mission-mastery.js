import Phaser from 'phaser';
import { loadState } from '../state.js';
import { missions } from '../missions.js';

const originalSceneStart = Phaser.Scenes.SceneManager.prototype.start;
if (!Phaser.Scenes.SceneManager.prototype.__relayRunnerStartGuard) {
  Phaser.Scenes.SceneManager.prototype.__relayRunnerStartGuard = true;
  Phaser.Scenes.SceneManager.prototype.start = function startWithRunnerGuard(key, data) {
    if (key === 'runner') {
      const runner = this.getScene(key);
      if (runner && (this.isActive(key) || this.isPaused(key))) {
        this.stop(key);
        return originalSceneStart.call(this, key, data);
      }
    }
    return originalSceneStart.call(this, key, data);
  };
}

const PANEL_CLASS = 'mission-mastery-panel';
const BADGES = [
  { id: 'SIGNAL SWEEP', label: 'SIGNAL SWEEP', detail: 'Collect every Signal' },
  { id: 'PAR TIME', label: 'PAR TIME', detail: 'Finish under the target time' },
  { id: 'CLEAN RUN', label: 'CLEAN RUN', detail: 'Finish without collisions or falls' },
  { id: 'SECRET ROUTE', label: 'SECRET ROUTE', detail: 'Discover every secret route' },
  { id: 'PERFECT PACKAGE', label: 'PERFECT PACKAGE', detail: 'Deliver the package at 100%' },
];
const style = `
.${PANEL_CLASS}{grid-column:1/-1;margin-top:4px;padding:12px 14px;border:1px solid rgba(150,190,255,.18);background:rgba(8,18,38,.52);border-radius:10px;text-align:left}
.${PANEL_CLASS} .mastery-heading{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:9px}
.${PANEL_CLASS} .mastery-heading strong{font-size:11px;letter-spacing:.16em}
.${PANEL_CLASS} .mastery-count{font-size:9px;letter-spacing:.12em;opacity:.58}
.${PANEL_CLASS} .mastery-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px}
.${PANEL_CLASS} .mastery-badge{min-width:0;padding:8px;border:1px solid rgba(150,190,255,.12);border-radius:8px;background:rgba(8,18,38,.4);opacity:.46}
.${PANEL_CLASS} .mastery-badge.is-earned{opacity:1;border-color:rgba(120,220,255,.34);background:rgba(20,70,105,.22)}
.${PANEL_CLASS} .mastery-mark{display:block;font-size:13px;font-weight:900;margin-bottom:4px}
.${PANEL_CLASS} .mastery-name{display:block;font-size:8px;font-weight:800;letter-spacing:.08em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.${PANEL_CLASS} .mastery-detail{display:block;margin-top:3px;font-size:7px;line-height:1.25;opacity:.55}
.mastery-mission-progress{display:inline-flex;align-items:center;gap:4px;margin-left:7px;font-size:8px;letter-spacing:.08em;opacity:.7}
.mastery-mission-progress b{font-size:9px}
@media(max-width:700px){.${PANEL_CLASS} .mastery-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.${PANEL_CLASS} .mastery-badge:last-child{grid-column:span 2}}
`;
function installStyle() {
  if (document.getElementById('mission-mastery-style')) return;
  const styleElement = document.createElement('style');
  styleElement.id = 'mission-mastery-style';
  styleElement.textContent = style;
  document.head.appendChild(styleElement);
}
function missionIdFromFinish() {
  const finish = document.getElementById('finish');
  const explicit = finish?.dataset?.missionId;
  if (explicit) return explicit;
  const title = finish?.querySelector('h1, h2, h3, .mission-title, .title')?.textContent?.trim().toLowerCase();
  if (!title) return null;
  const match = missions.find(mission => mission.title.toLowerCase() === title || title.includes(mission.title.toLowerCase()));
  return match?.id || null;
}
function masteryForMission(missionId, state = loadState()) { return new Set(state.mastery?.[missionId] || []); }
function buildMasteryPanel(missionId) {
  if (!missionId) return;
  const state = loadState();
  const earned = masteryForMission(missionId, state);
  const existing = document.querySelector(`#finish .${PANEL_CLASS}`);
  if (existing) existing.remove();
  const panel = document.createElement('section');
  panel.className = PANEL_CLASS;
  panel.setAttribute('aria-label', 'Mission mastery');
  panel.innerHTML = `<div class="mastery-heading"><strong>MISSION MASTERY</strong><span class="mastery-count">${Math.min(earned.size, BADGES.length)} / ${BADGES.length} EARNED</span></div><div class="mastery-grid">${BADGES.map(badge => { const isEarned = earned.has(badge.id); return `<article class="mastery-badge${isEarned ? ' is-earned' : ''}"><span class="mastery-mark">${isEarned ? '✓' : '○'}</span><span class="mastery-name">${badge.label}</span><span class="mastery-detail">${badge.detail}</span></article>`; }).join('')}</div>`;
  const resultPanel = document.querySelector('#finish .mission-results-panel');
  if (resultPanel) resultPanel.insertAdjacentElement('afterend', panel); else document.querySelector('#finish .outcome')?.appendChild(panel);
}
function decorateMissionCards() {
  const state = loadState();
  document.querySelectorAll('[data-world-mission]').forEach(button => {
    const index = Number(button.dataset.worldMission);
    const missionId = Number.isInteger(index) && missions[index] ? missions[index].id : button.dataset.missionId;
    if (!missionId) return;
    const earned = masteryForMission(missionId, state);
    let progress = button.querySelector('.mastery-mission-progress');
    if (!progress) { progress = document.createElement('span'); progress.className = 'mastery-mission-progress'; button.appendChild(progress); }
    progress.innerHTML = `★ <b>${Math.min(earned.size, BADGES.length)}</b>/${BADGES.length}`;
  });
}
if (typeof document !== 'undefined') {
  installStyle();
  const finish = document.getElementById('finish');
  const game = document.getElementById('game');
  if (finish) new MutationObserver(() => { if (!finish.classList.contains('hidden')) buildMasteryPanel(missionIdFromFinish()); }).observe(finish, { attributes: true, attributeFilter: ['class', 'data-mission-id'] });
  if (game) new MutationObserver(decorateMissionCards).observe(game, { childList: true, subtree: true });
  decorateMissionCards();
}
