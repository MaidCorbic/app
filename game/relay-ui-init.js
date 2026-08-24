import { RELAY_FAQ, LATEST_UPDATE } from './faq.js';
import './src/tutorial-map-v1.js';
import './tutorial-onboarding-v3.js';
import './tutorial-mobile-layout-fix-v1.js';
import './tutorial-mobile-layout-v2.css';
import './first-mission-transmission-suppressor-v1.js';
import './src/systems/tutorial-chapter-order-v1.js';
import './gameplay-event-hud-v2.css';
import './dynamic-environment-reactions-v1.css';
import './cargo-integrity-v2-polish.css';
import './signal-network-v1.css';
import './city-response-v1.css';
import './collapse-protocol-v1.css';
import './city-pulse-v1.css';
import './relay-runtime-kernel-v1.js';

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
const open = kind => {
  if (!panel) return;
  panel.classList.remove('hidden');
  panel.classList.toggle('relay-update-mode', kind === 'update');
  if (kind === 'faq') {
    eyebrow.textContent = 'RELAY RUNNER // FIELD GUIDE'; heading.textContent = 'FAQ';
    content.innerHTML = '<div class="relay-faq-list">' + RELAY_FAQ.map(item => `<article class="relay-faq-item"><button class="relay-faq-question" type="button">${item[0]}</button><div class="relay-faq-answer">${item[1]}</div></article>`).join('') + '</div>';
  } else {
    eyebrow.textContent = LATEST_UPDATE.version; heading.textContent = LATEST_UPDATE.title;
    content.innerHTML = '<p class="relay-update-meta">CHAPTER 01 / NIGHT SHIFT</p><div class="relay-update-list">' + LATEST_UPDATE.items.map(item => `<div class="relay-update-item">${item}</div>`).join('') + '</div>';
  }
};
document.querySelectorAll('[data-relay-info]').forEach(button => button.addEventListener('click', () => open(button.dataset.relayInfo)));
document.addEventListener('click', event => { const question = event.target.closest('.relay-faq-question'); if (question) question.closest('.relay-faq-item')?.classList.toggle('open'); if (event.target.closest('[data-relay-close]') || event.target === panel) { panel?.classList.add('hidden'); panel?.classList.remove('relay-update-mode'); } });
document.addEventListener('keydown', event => { if (event.key === 'Escape') { panel?.classList.add('hidden'); panel?.classList.remove('relay-update-mode'); } });

import './cargo-integrity-v2.js';
import './cargo-integrity-v2-visibility-v1.js';
import './gameplay-intro-final-v1.js';
import './gameplay-core-v1.js';
import './dash-runtime-bridge-v1.js';
import './player-death-animation-v1.js';
import './dynamic-time-cycle-v1.js';
import './src/systems/city-atmosphere-cleanup-v1.js';
import './game-feel-v1.js';
import './audio-feedback-v2.js';
import './adaptive-music-v1.js';
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
import './dynamic-camera-language-v1.js';
import './gameplay-new-layer-v2.js';
import './city-update-gameplay-hud-v1.js';
import './dynamic-environment-reactions-v1.js';
import './collapse-protocol-v1.js';
import './collapse-protocol-contact-bridge-v1.js';
import './src/systems/mobile-controls-controller.js';
import './src/systems/mission-runtime-hardening-v1.js';
import './home-v3-features.js';
import './home-v4-polish.js';
import './home-final-fix-v1.js';
