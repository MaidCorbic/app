import { RELAY_FAQ, LATEST_UPDATE } from './faq.js';
import './gameplay-event-hud-v2.css';

// Title-screen info panel: keep this UI self-contained so the Updates button
// cannot be hidden by the generic .hidden overlay rules.
const relayInfoStyle = document.createElement('style');
relayInfoStyle.textContent = `
  #relayInfoPanel.relay-info-panel:not(.hidden){
    position:fixed!important;
    inset:0!important;
    z-index:2147483000!important;
    display:grid!important;
    place-items:center!important;
    padding:clamp(12px,3vw,28px)!important;
    box-sizing:border-box!important;
    overflow:hidden!important;
    background:rgba(2,5,13,.82)!important;
    backdrop-filter:blur(12px)!important;
    -webkit-backdrop-filter:blur(12px)!important;
  }
  #relayInfoPanel .relay-info-card{
    position:relative!important;
    width:min(760px,94vw)!important;
    max-height:min(82dvh,760px)!important;
    max-height:min(82svh,760px)!important;
    overflow:hidden!important;
    box-sizing:border-box!important;
    padding:clamp(22px,4vw,38px)!important;
    border:1px solid rgba(255,208,110,.28)!important;
    border-radius:12px!important;
    color:#edf3f8!important;
    background:linear-gradient(160deg,rgba(10,22,37,.98),rgba(3,8,17,.98))!important;
    box-shadow:0 30px 100px rgba(0,0,0,.75),0 0 70px rgba(255,208,110,.08),inset 0 1px rgba(255,255,255,.06)!important;
  }
  #relayInfoPanel .relay-info-card:before{
    content:'';position:absolute;inset:0;pointer-events:none;
    background:linear-gradient(115deg,transparent 0%,rgba(255,255,255,.025) 45%,rgba(255,208,110,.04) 50%,transparent 58%);
  }
  #relayInfoPanel .relay-info-close{
    position:absolute!important;top:12px!important;right:12px!important;
    z-index:2!important;width:34px!important;height:34px!important;
    border:1px solid rgba(180,200,220,.28)!important;border-radius:6px!important;
    color:#cbd7e3!important;background:#07111de8!important;
    font:700 22px/1 Manrope,sans-serif!important;cursor:pointer!important;
  }
  #relayInfoPanel .relay-info-close:hover,#relayInfoPanel .relay-info-close:focus-visible{
    border-color:#ffd06e!important;color:#ffd06e!important;outline:2px solid rgba(223,252,255,.7)!important;outline-offset:2px!important;
  }
  #relayInfoPanel .relay-info-eyebrow{
    position:relative!important;margin:0 44px 8px 0!important;color:#7ed8ff!important;
    font:800 8px/1 'DM Mono',monospace!important;letter-spacing:2px!important;
  }
  #relayInfoPanel h2{
    position:relative!important;margin:0!important;color:#f5f0e7!important;
    font:900 clamp(30px,6vw,54px)/.92 Manrope,sans-serif!important;letter-spacing:-.055em!important;
  }
  #relayInfoPanel #relayInfoContent{
    position:relative!important;min-height:0!important;max-height:calc(82dvh - 125px)!important;max-height:calc(82svh - 125px)!important;
    overflow-y:auto!important;overflow-x:hidden!important;margin-top:22px!important;padding-right:5px!important;
    scrollbar-width:none!important;-webkit-overflow-scrolling:touch!important;
  }
  #relayInfoPanel #relayInfoContent::-webkit-scrollbar{display:none!important}
  #relayInfoPanel .relay-changelog{display:grid;gap:12px}
  #relayInfoPanel .relay-changelog-entry{
    padding:16px 17px!important;border:1px solid rgba(190,210,230,.13)!important;border-left:2px solid #ffd06e!important;
    border-radius:8px!important;background:linear-gradient(145deg,rgba(12,25,43,.9),rgba(5,12,23,.96))!important;
  }
  #relayInfoPanel .relay-changelog-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:7px}
  #relayInfoPanel .relay-changelog-date{color:#ffd06e!important;font:800 8px 'DM Mono',monospace!important;letter-spacing:1.1px!important;white-space:nowrap}
  #relayInfoPanel .relay-changelog-version{color:#6f8196!important;font:700 7px 'DM Mono',monospace!important;letter-spacing:1px!important;text-align:right}
  #relayInfoPanel .relay-changelog-title{margin:0;color:#eef4f8!important;font:800 15px/1.2 Manrope,sans-serif!important;letter-spacing:.1px}
  #relayInfoPanel .relay-changelog-list{display:grid;gap:7px;margin:10px 0 0;padding:0;list-style:none}
  #relayInfoPanel .relay-changelog-list li{position:relative;padding-left:13px;color:#aebdcc!important;font:500 10px/1.55 Manrope,sans-serif!important}
  #relayInfoPanel .relay-changelog-list li:before{content:'›';position:absolute;left:0;color:#7ed8ff;font-weight:800}
  #relayInfoPanel .relay-update-meta{margin:0 0 10px;color:#6f8196;font:700 8px 'DM Mono',monospace;letter-spacing:1px}
  #relayInfoPanel .relay-faq-list{display:grid;gap:8px}
  #relayInfoPanel .relay-faq-item{border:1px solid rgba(190,210,230,.13);border-radius:8px;background:#07111de8;overflow:hidden}
  #relayInfoPanel .relay-faq-question{width:100%;padding:13px 14px;border:0;background:transparent;color:#e9f2f8;text-align:left;font:800 10px 'DM Mono',monospace;cursor:pointer}
  #relayInfoPanel .relay-faq-answer{display:none;padding:0 14px 14px;color:#9fafbf;font:500 10px/1.55 Manrope,sans-serif}
  #relayInfoPanel .relay-faq-item.open .relay-faq-answer{display:block}
  @media(max-width:600px){
    #relayInfoPanel .relay-info-card{width:96vw;max-height:88dvh;max-height:88svh;padding:19px 16px 16px;border-radius:10px}
    #relayInfoPanel #relayInfoContent{max-height:calc(88dvh - 112px);max-height:calc(88svh - 112px);margin-top:17px}
    #relayInfoPanel .relay-changelog-entry{padding:13px 13px}
    #relayInfoPanel .relay-changelog-head{align-items:flex-start;flex-direction:column;gap:4px}
    #relayInfoPanel .relay-changelog-version{order:-1;text-align:left}
    #relayInfoPanel .relay-changelog-title{font-size:13px}
    #relayInfoPanel .relay-changelog-list li{font-size:9px}
  }
`;
document.head.appendChild(relayInfoStyle);

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

const CHANGELOG = [
  {
    date: 'AUG 21, 2026',
    version: 'LATEST',
    title: 'Cinematic Splash & Home UI',
    items: [
      'Added the cinematic loading splash screen with responsive portrait and landscape layouts.',
      'Improved the title screen with a cleaner game-style composition and stronger visual hierarchy.',
      'Kept the FAQ and Updates entry points accessible directly from the title screen.'
    ]
  },
  {
    date: 'AUG 20, 2026',
    version: 'UPDATE 17',
    title: 'Cinematic & Tutorial Pacing',
    items: [
      'Polished cinematic arrival timing and tutorial pacing across the opening sequence.',
      'Improved gameplay introduction flow without changing the core mission progression.',
      'Added stability and recovery improvements around the mission start and finish flow.'
    ]
  },
  {
    date: 'AUG 20, 2026',
    version: 'GAMEPLAY',
    title: 'Enemy Awareness & Combat AI',
    items: LATEST_UPDATE.items
  }
];

const renderChangelog = () => {
  content.innerHTML = `<div class="relay-changelog">${CHANGELOG.map(entry => `
    <article class="relay-changelog-entry">
      <div class="relay-changelog-head">
        <span class="relay-changelog-date">${entry.date}</span>
        <span class="relay-changelog-version">${entry.version}</span>
      </div>
      <h3 class="relay-changelog-title">${entry.title}</h3>
      <ul class="relay-changelog-list">${entry.items.map(item => `<li>${item}</li>`).join('')}</ul>
    </article>`).join('')}</div>`;
};

const open = kind => {
  if (!panel || !eyebrow || !heading || !content) return;
  panel.classList.remove('hidden');
  panel.classList.toggle('relay-update-mode', kind === 'update');
  if (kind === 'faq') {
    eyebrow.textContent = 'RELAY RUNNER // FIELD GUIDE';
    heading.textContent = 'FAQ';
    content.innerHTML = '<div class="relay-faq-list">' + RELAY_FAQ.map(item => `<article class="relay-faq-item"><button class="relay-faq-question" type="button">${item[0]}</button><div class="relay-faq-answer">${item[1]}</div></article>`).join('') + '</div>';
  } else {
    eyebrow.textContent = 'RELAY RUNNER // UPDATE HISTORY';
    heading.textContent = 'CHANGELOG';
    renderChangelog();
  }
};

document.querySelectorAll('[data-relay-info]').forEach(button => {
  button.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    open(button.dataset.relayInfo);
  });
});

document.addEventListener('click', event => {
  const question = event.target.closest('.relay-faq-question');
  if (question) question.closest('.relay-faq-item')?.classList.toggle('open');
  if (event.target.closest('[data-relay-close]') || event.target === panel) {
    panel?.classList.add('hidden');
    panel?.classList.remove('relay-update-mode');
  }
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    panel?.classList.add('hidden');
    panel?.classList.remove('relay-update-mode');
  }
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
