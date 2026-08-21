import { RELAY_FAQ } from './faq.js';
import './gameplay-event-hud-v2.css';

const homeStyle = document.createElement('style');
homeStyle.id = 'relay-home-final-ui';
homeStyle.textContent = `
#intro .menu-tagline{display:none!important}
#intro .menu-actions{margin-top:clamp(30px,5.5vh,58px)!important}
#intro .play-button{position:relative!important;z-index:4!important}
#intro .info-launcher{z-index:2147483000!important}
#intro .info-circle{width:92px!important;min-width:92px!important;height:38px!important;padding:0 14px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:0!important;border-color:#ffd06e!important;background:linear-gradient(135deg,#171a1d,#0a121d)!important;color:#ffd06e!important;box-shadow:0 8px 28px #0008,0 0 18px #ffd06e18!important;font:900 9px 'DM Mono',monospace!important;letter-spacing:1.8px!important}
#intro .info-circle .info-glyph{display:none!important}
#intro .info-circle::after{content:'UPDATES';display:block!important}
#intro .info-circle:hover,#intro .info-circle:focus-visible{border-color:#fff0b5!important;color:#fff0b5!important;background:linear-gradient(135deg,#22201a,#101923)!important;box-shadow:0 12px 36px #000a,0 0 24px #ffd06e32!important}
#relayInfoPanel.relay-update-mode{z-index:2147482000!important;background:rgba(1,5,11,.84)!important;backdrop-filter:blur(8px)!important;-webkit-backdrop-filter:blur(8px)!important}
#relayInfoPanel.relay-update-mode .relay-info-card{width:min(700px,calc(100vw - 28px))!important;max-height:min(78dvh,720px)!important;overflow:hidden!important;box-sizing:border-box!important;background:linear-gradient(160deg,#081522f7,#030811f8)!important;border:1px solid #ffd06e44!important;box-shadow:0 30px 100px #000d,0 0 60px #ffd06e12!important}
#relayInfoPanel.relay-update-mode #relayInfoContent{max-height:min(58dvh,560px)!important;overflow-y:auto!important;overflow-x:hidden!important;padding:4px 6px 8px 0!important;box-sizing:border-box!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;scrollbar-width:thin}
.relay-history-list{display:grid;gap:9px;text-align:left}
.relay-history-item{padding:13px 14px;border:1px solid #6b7c8f3d;border-left:2px solid #ffd06e;border-radius:7px;background:linear-gradient(145deg,#0a1725e8,#050c15e8);box-shadow:inset 0 1px #fff1,0 8px 22px #0004}
.relay-history-meta{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:7px;font:800 8px 'DM Mono',monospace;letter-spacing:1px}
.relay-history-meta b{color:#ffd06e}.relay-history-meta time{color:#8190a1;white-space:nowrap}
.relay-history-item h3{margin:0 0 6px;color:#edf3f8;font:900 11px/1.2 'DM Mono',monospace;letter-spacing:.8px}
.relay-history-item p{margin:0;color:#aebdcc;font:500 9px/1.55 'DM Mono',monospace;letter-spacing:.15px}
@media(max-width:700px){#intro .menu-actions{margin-top:clamp(28px,6vh,46px)!important}#intro .info-launcher{top:12px!important;right:12px!important}#intro .faq-launcher,#intro .info-circle{height:36px!important}.relay-history-item{padding:11px 12px}.relay-history-item h3{font-size:9px}.relay-history-item p{font-size:7.5px;line-height:1.5}#relayInfoPanel.relay-update-mode .relay-info-card{width:calc(100vw - 20px)!important;max-height:86dvh!important}#relayInfoPanel.relay-update-mode #relayInfoContent{max-height:70dvh!important}}
@media(max-width:380px){#intro .menu-actions{margin-top:28px!important}#intro .info-circle{width:82px!important;min-width:82px!important;font-size:8px!important}}
`;
document.head.appendChild(homeStyle);

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
