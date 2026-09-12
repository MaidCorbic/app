import { RELAY_FAQ, LATEST_UPDATE } from './faq.js';

// CSS bootstrap ownership: feature styles are loaded here so runtime UI has one
// predictable entry point. Shared presentation loads first, canonical UI last.
import './splash-progress-visibility.css';
import './cinematic-splash.css';
import './mobile-final-polish.css';
import './styles.css';
import './main-menu.css';
import './menu-overrides.css';
import './home-v3.css';
import './hud-v2.css';
import './streak.css';
import './faq.css';
import './player-profile-v1.css';
import './campaign-v2.css';
import './relay-update-tutorial.css';
import './update-ui.css';
import './gameplay-event-hud-v2.css';
import './dynamic-environment-reactions-v1.css';
import './cargo-integrity-v2-polish.css';
import './signal-network-v1.css';
import './city-response-v1.css';
import './gameplay-ui-v8-settings-polish.css';
import './gameplay-hud-polish-v1.css';
import './mobile-map-all-levels-contract-v1.css';
import './mobile-map-web-parity-all-levels-v1.css';
import './mobile-top-card-map-legend-fix-v1.css';
import './mobile-ui-cleanup-v1.css';
import './release-ux-gameplay-polish-v1.css';

// Gameplay presentation CSS is bootstrapped here rather than from the Home
// interaction module so stylesheet ownership is centralized and deterministic.
import './unified-cinematic-ui-v1.css';
import './unified-gameplay-ui-v1.css';
import './unified-gameplay-ui-v1-polish.css';
import './unified-gameplay-ui-v1-mobile.css';
import './presentation-final-v1.css';

// Specialised release visuals load before the canonical owner so canonical
// geometry can win every shared layout conflict.
import './release-final-ui-v1.css';

// Canonical UI is the final shared authority for Home, gameplay HUD,
// pause-menu, overlays and touch geometry.
import './canonical-ui-v1.css';

import './gameplay-ui-visibility-v3.js';
import './map-aaa-tactical-redesign-v1.js';

const exitTitle = document.getElementById('exitTitle');
exitTitle?.addEventListener('click', () => {
  document.querySelector('#intro .title-lockup')?.replaceChildren(
    Object.assign(document.createElement('p'), { className: 'eyebrow', textContent: 'SESSION CLOSED' }),
    Object.assign(document.createElement('h1'), { innerHTML: 'SEE YOU<br><em>SOON</em>' }),
    Object.assign(document.createElement('p'), { className: 'menu-tagline', textContent: 'The relay is offline. You can close this browser tab.' })
  );
});

const panel = document.getElementById('relayInfoPanel');
const eyebrow = document.getElementById('relayInfoEyebrow');
const heading = document.getElementById('relayInfoHeading');
const content = document.getElementById('relayInfoContent');

const open = kind => {
  if (!panel || !eyebrow || !heading || !content) return;
  panel.classList.remove('hidden');
  panel.classList.toggle('relay-update-mode', kind === 'update');
  if (kind === 'faq') {
    eyebrow.textContent = 'RELAY RUNNER // FIELD GUIDE';
    heading.textContent = 'FAQ';
    content.innerHTML = '<div class="relay-faq-list">' + RELAY_FAQ.map(item => `<article class="relay-faq-item"><button class="relay-faq-question" type="button">${item[0]}</button><div class="relay-faq-answer">${item[1]}</div></article>`).join('') + '</div>';
  } else {
    eyebrow.textContent = LATEST_UPDATE.version;
    heading.textContent = LATEST_UPDATE.title;
    content.innerHTML = '<p class="relay-update-meta">CHAPTER 01 / NIGHT SHIFT</p><div class="relay-update-list">' + LATEST_UPDATE.items.map(item => `<div class="relay-update-item">${item}</div>`).join('') + '</div>';
  }
};

window.relayOpenInfo = open;

document.querySelectorAll('[data-relay-info]').forEach(button => {
  button.addEventListener('click', () => open(button.dataset.relayInfo));
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

import './cargo-integrity-v2.js';
import './cargo-integrity-v2-visibility-v1.js';
import './signal-network-v1.js';
import './city-response-v1.js';
import './gameplay-intro-final-v1.js';
import './mobile-map-web-parity-all-levels-v1.js';
import './gameplay-core-v1.js';
import './player-death-animation-v1.js';
import './src/systems/death-retry-state-reset-v1.js';
import './src/systems/death-respawn-retry-guard-v1.js';
import './dynamic-time-cycle-v1.js';
import './src/systems/city-atmosphere-cleanup-v1.js';
import './game-feel-v1.js';
import './audio-feedback-v2.js';
import './adaptive-music-v1.js';
import './src/systems/world-variation-game-feel-v1.js';
import './src/systems/barrier-gameplay-visual-cleanup-v1.js';
import './src/systems/city-backdrop-replacement-v1.js';
import './src/systems/dynamic-world-mechanics-v2.js';
import './world-interaction-runtime-v2.js';
import './environmental-force-zone-v1.js';
import './timed-energy-trap-v1.js';
import './pressure-route-node-v1.js';
import './route-mutation-v1.js';
import './temporary-world-distortion-v1.js';
import './player-shield-visual-cleanup-v1.js';
import './tutorial-runtime-gate-v1.js';
import './home-tutorial-v1.js';
import './cinematic-tutorial-pacing-v1.js';
import './level-visual-stability-fix-v1.js';
import './mission-flow-performance-v1.js';
import './mission-performance-results-bridge-v1.js';
import './src/systems/dynamic-encounter-events-v1.js';
import './src/systems/adaptive-mission-modifiers-v1.js';
import './presentation-final-v1.js';
import './dynamic-camera-language-v1.js';
import './gameplay-new-layer-v2.js';
import './crouch-gameplay-v1.js';
import './slide-jump-momentum-v1.js';
import './dash-dodge-v1.js';
import './wall-slide-v1.js';
import './dynamic-environment-reactions-v1.js';
import './production-unfreeze-v1.js';
import './src/systems/mobile-input-single-owner-v1.js';
import './src/systems/mobile-gameplay-stability-v1.js';
import './p1-gameplay-correctness-v1.js';
import './p2-character-presentation-v4.js';
import './p2-ux-controls-v1.js';
import './gameplay-home-hud-safe-v2.js';
import './gameplay-audio-start-v2.js';
import './runtime-authority-v1.js';
import './gameplay-runtime-stability-v3.js';
import './src/systems/gameplay-ui-v7-legacy-feedback-hide.js';
import './src/systems/signals-hud-run-persistence-v1.js';
import './release-ux-gameplay-polish-v1.js';
import './src/systems/gameplay-variety-safe-layer-v1.js';
import './src/systems/gameplay-route-choice-v2.js';
import './src/systems/gameplay-route-choice-bridge-v1.js';
import './src/systems/route-choice-branching-v1.js';

window.addEventListener('DOMContentLoaded', () => {
  import('./src/systems/mission-objectives-route-goals-v1.js').catch(error => {
    console.error('[RelayRunner] mission runtime patch failed to load', error);
  });
  import('./chaser-runtime-stability-v1.js').catch(error => {
    console.error('[RelayRunner] chaser runtime patch failed to load', error);
  });
}, { once: true });
