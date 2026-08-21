import { RELAY_FAQ } from './faq.js';
import './gameplay-event-hud-v2.css';

const exitTitle = document.getElementById('exitTitle');
exitTitle?.addEventListener('click', () => {
  document.querySelector('#intro .title-lockup')?.replaceChildren(
    Object.assign(document.createElement('p'), { className: 'eyebrow', textContent: 'SESSION CLOSED' }),
    Object.assign(document.createElement('h1'), { innerHTML: 'SEE YOU<br><em>SOON.</em>' }),
    Object.assign(document.createElement('p'), { className: 'menu-tagline', textContent: 'The relay is offline. You can close this browser tab.' })
  );
});

const panel = document.getElementById('relayInfoPanel');
const eyebrow = document.getElementById('relayInfoEyebrow');
const heading = document.getElementById('relayInfoHeading');
const content = document.getElementById('relayInfoContent');

const UPDATE_HISTORY = [
  ['UPDATE 18','21 AUG 2026','RIVAL // ROUTE','Added the Rival / Route layer with delivery-route choices, reward tuning and the foundation for competitive run pressure.'],
  ['UPDATE 17','20 AUG 2026','CINEMATIC & TUTORIAL PACING','Refined cinematic arrival timing and tutorial pacing so the opening flow is clearer without replacing the core gameplay.'],
  ['UPDATE 16','19 AUG 2026','MISSION OBJECTIVES','Expanded mission objective and route-goal presentation for clearer run targets and completion feedback.'],
  ['UPDATE 15','19 AUG 2026','ADAPTIVE MISSIONS','Added adaptive mission modifiers that can change gravity, security, darkness, mobility and signal behaviour per mission.'],
  ['UPDATE 14','19 AUG 2026','ENCOUNTER EVENTS','Added dynamic encounter events to make the city react with more varied, contextual gameplay situations.'],
  ['UPDATE 12','18 AUG 2026','MISSION FLOW & PERFORMANCE','Improved mission flow, finish recovery and results handling to keep transitions stable and readable.'],
  ['UPDATE 11','18 AUG 2026','DYNAMIC WORLD','Expanded dynamic world mechanics and environmental responses around the player.'],
  ['UPDATE 10','17 AUG 2026','GAME FEEL & HUD','Improved moment-to-moment feedback, HUD presentation, atmosphere and gameplay readability.'],
  ['UPDATE 09','17 AUG 2026','WORLD INTERACTION','Added and refined world interaction systems for a more reactive rooftop delivery experience.']
];

const stopUIEvent = event => {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation?.();
};

const closePanel = () => {
  panel?.classList.add('hidden');
  panel?.classList.remove('relay-update-mode');
};

const open = kind => {
  if (!panel) return;
  panel.classList.remove('hidden');
  panel.classList.toggle('relay-update-mode', kind === 'update');
  if (kind === 'faq') {
    eyebrow.textContent = 'RELAY RUNNER // FIELD GUIDE';
    heading.textContent = 'FAQ';
    content.innerHTML = '<div class="relay-faq-list">' + RELAY_FAQ.map(item => `<article class="relay-faq-item"><button class="relay-faq-question" type="button">${item[0]}</button><div class="relay-faq-answer">${item[1]}</div></article>`).join('') + '</div>';
    return;
  }
  eyebrow.textContent = 'RELAY RUNNER // VERSION HISTORY';
  heading.textContent = 'GAME UPDATES';
  content.innerHTML = `<div class="relay-history-list">${UPDATE_HISTORY.map(([version,date,title,text]) => `<article class="relay-history-item"><div class="relay-history-meta"><b>${version}</b><time>${date}</time></div><h3>${title}</h3><p>${text}</p></article>`).join('')}</div>`;
};

document.querySelectorAll('[data-relay-info]').forEach(button => {
  button.addEventListener('click', event => {
    stopUIEvent(event);
    open(button.dataset.relayInfo);
  }, true);
});

['pointerdown','pointerup','mousedown','mouseup','touchstart','touchend'].forEach(type => {
  document.addEventListener(type, event => {
    const button = event.target.closest?.('[data-relay-info]');
    if (button) stopUIEvent(event);
  }, true);
});

document.addEventListener('click', event => {
  const question = event.target.closest?.('.relay-faq-question');
  if (question) question.closest('.relay-faq-item')?.classList.toggle('open');
  if (event.target.closest?.('[data-relay-close]') || event.target === panel) closePanel();
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closePanel();
});

// UPDATE 17 — one authoritative gameplay intro runtime.
import './gameplay-intro-final-v1.js';
import './gameplay-core-v1.js';
import './player-death-animation-v1.js';
import './dynamic-time-cycle-v1.js';
import './src/systems/city-atmosphere-cleanup-v1.js';
import './game-feel-v1.js';
import './audio-feedback-v2.js';
import './gameplay-event-hud-v2.js';
import './src/systems/world-variation-game-feel-v1.js';
import './src/systems/barrier-gameplay-visual-cleanup-v1.js';
import './src/systems/city-backdrop-replacement-v1.js';
import './src/systems/dynamic-world-mechanics-v2.js';
import './src/systems/viewport-sync.js';
import './world-interaction-runtime-v2.js';
import './player-shield-visual-cleanup-v1.js';
import './tutorial-runtime-gate-v1.js';
import './home-tutorial-v1.js';
import './cinematic-tutorial-pacing-v1.js';
import './level-visual-stability-fix-v1.js';
import './mission-flow-performance-v1.js';
import './mission-performance-results-bridge-v1.js';
import './src/systems/dynamic-encounter-events-v1.js';
import './src/systems/adaptive-mission-modifiers-v1.js';
import './src/systems/mission-objectives-route-goals-v1.js';
