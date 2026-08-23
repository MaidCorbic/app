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

// UPDATE 22 — shared lifecycle/event adapter. Additive only.
import './relay-runtime-kernel-v1.js';
import './city-pulse-v1.js';

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

const installHomeUtilityStyle = () => {
  if (document.getElementById('relay-home-utility-buttons-style')) return;
  const style = document.createElement('style');
  style.id = 'relay-home-utility-buttons-style';
  style.textContent = `
#intro .info-launcher{display:flex!important;align-items:center!important;gap:8px!important;pointer-events:auto!important}
#intro .info-launcher button{box-sizing:border-box!important;height:38px!important;min-height:38px!important;border:1px solid #526173!important;border-radius:3px!important;background:linear-gradient(180deg,#0a1725,#06101b)!important;color:#dbe4ec!important;box-shadow:inset 0 1px #ffffff08,0 8px 22px #0006!important;font:800 9px 'DM Mono',monospace!important;letter-spacing:1.2px!important;cursor:pointer!important;pointer-events:auto!important;touch-action:manipulation!important;transition:border-color .16s ease,background .16s ease,color .16s ease,transform .16s ease,box-shadow .16s ease!important}
#intro .faq-launcher{min-width:74px!important;padding:0 12px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:7px!important}
#intro .info-circle{width:74px!important;min-width:74px!important;padding:0 11px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:7px!important}
#intro .faq-glyph,#intro .info-glyph:before{display:grid!important;place-items:center!important;width:16px!important;height:16px!important;box-sizing:border-box!important;border:1px solid #ffd06e!important;border-radius:50%!important;color:#ffd06e!important;font:800 10px Manrope,sans-serif!important}
#intro .info-glyph{display:inline-flex!important;align-items:center!important;justify-content:center!important}
#intro .info-glyph:before{content:'i'!important;font-size:11px!important}
#intro .info-action-label{display:inline!important}
#intro .info-launcher button:hover,#intro .info-launcher button:focus-visible{transform:translateY(-2px)!important;border-color:#ffd06e!important;background:#101d2d!important;color:#fff!important;box-shadow:0 12px 30px #0008,0 0 18px #ffd06e18!important;outline:2px solid #dffcff!important;outline-offset:3px!important}
#intro .info-launcher button:active{transform:translateY(0) scale(.97)!important}
#intro .menu-option-button,#intro .menu-option-button.exit-button{border:1px solid #526173!important;cursor:pointer!important;pointer-events:auto!important}
#intro .menu-option-button.exit-button:hover,#intro .menu-option-button.exit-button:focus-visible{border-color:#ff9b8c66!important}
@media(max-width:700px){#intro .info-launcher{top:14px!important;right:14px!important;gap:6px!important}#intro .info-launcher button{height:36px!important;min-height:36px!important;font-size:8px!important}.info-circle{width:68px!important;min-width:68px!important}.faq-launcher{min-width:68px!important}}
`;
  document.head.appendChild(style);
};

const ensureHomeUtilityButtons = () => {
  const intro = document.getElementById('intro');
  if (!intro) return;
  installHomeUtilityStyle();
  const faq = intro.querySelector('.faq-launcher');
  const info = intro.querySelector('.info-circle');
  const exit = document.getElementById('exitTitle');
  [faq, info, exit].forEach(button => {
    if (!button) return;
    button.type = 'button';
    button.removeAttribute('disabled');
    button.style.pointerEvents = 'auto';
    button.style.cursor = 'pointer';
  });
  if (info) {
    info.classList.add('info-action-button');
    info.setAttribute('aria-label', 'Open latest update information');
    info.innerHTML = '<span class="info-glyph" aria-hidden="true"></span><span class="info-action-label">INFO</span>';
  }
  if (faq) {
    faq.classList.add('utility-info-button');
    faq.setAttribute('aria-label', 'Open FAQ and field guide');
  }
  if (exit) exit.classList.add('exit-action-button');
};

const open = kind => { if (!panel) return; panel.classList.remove('hidden'); panel.classList.toggle('relay-update-mode', kind === 'update'); if (kind === 'faq') { eyebrow.textContent = 'RELAY RUNNER // FIELD GUIDE'; heading.textContent = 'FAQ'; content.innerHTML = '<div class="relay-faq-list">' + RELAY_FAQ.map(item => `<article class="relay-faq-item"><button class="relay-faq-question" type="button">${item[0]}</button><div class="relay-faq-answer">${item[1]}</div></article>`).join('') + '</div>'; } else { eyebrow.textContent = LATEST_UPDATE.version; heading.textContent = LATEST_UPDATE.title; content.innerHTML = '<p class="relay-update-meta">CHAPTER 01 / NIGHT SHIFT</p><div class="relay-update-list">' + LATEST_UPDATE.items.map(item => `<div class="relay-update-item">${item}</div>`).join('') + '</div>'; } };

document.querySelectorAll('[data-relay-info]').forEach(button => button.addEventListener('click', () => open(button.dataset.relayInfo)));
document.addEventListener('click', event => { const question = event.target.closest('.relay-faq-question'); if (question) question.closest('.relay-faq-item')?.classList.toggle('open'); if (event.target.closest('[data-relay-close]') || event.target === panel) { panel?.classList.add('hidden'); panel?.classList.remove('relay-update-mode'); } });
document.addEventListener('keydown', event => { if (event.key === 'Escape') { panel?.classList.add('hidden'); panel?.classList.remove('relay-update-mode'); } });

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureHomeUtilityButtons, { once: true }); else ensureHomeUtilityButtons();

import './cargo-integrity-v2.js';
import './cargo-integrity-v2-visibility-v1.js';
import './signal-network-v1.js';
import './city-response-v1.js';
import './gameplay-intro-final-v1.js';
import './gameplay-core-v1.js';
import './dash-runtime-bridge-v1.js';
import './dash-mobile-input-v1.js';
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
import './src/systems/mobile-controls-runtime-v2.js';
import './src/systems/mission-runtime-hardening-v1.js';
