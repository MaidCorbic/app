import { RELAY_FAQ, LATEST_UPDATE } from './faq.js';

const exitTitle = document.getElementById('exitTitle');
exitTitle?.addEventListener('click', () => {
  document.querySelector('#intro .title-lockup')?.replaceChildren(
    Object.assign(document.createElement('p'), { className: 'eyebrow', textContent: 'SESSION CLOSED' }),
    Object.assign(document.createElement('h1'), { innerHTML: 'SEE YOU<br><em>SOON.</em>' }),
    Object.assign(document.createElement('p'), {
      className: 'menu-tagline',
      textContent: 'The relay is offline. You can close this browser tab.'
    })
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
    eyebrow.textContent = 'RELAY RUNNER // FIELD GUIDE';
    heading.textContent = 'FAQ';
    content.innerHTML = '<div class="relay-faq-list">' + RELAY_FAQ.map(item => `<article class="relay-faq-item"><button class="relay-faq-question" type="button">${item[0]}</button><div class="relay-faq-answer">${item[1]}</div></article>`).join('');
  } else {
    eyebrow.textContent = LATEST_UPDATE.version;
    heading.textContent = LATEST_UPDATE.title;
    content.innerHTML = '<p class="relay-update-meta">CHAPTER 01 / NIGHT SHIFT</p><div class="relay-update-list">' + LATEST_UPDATE.items.map(item => `<div class="relay-update-item">${item}</div>`).join('');
  }
};

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

import './gameplay-core-v1.js';
import './combat-system-v1.js';
import './combat-enemy-integration-v1.js';
import './player-death-animation-v1.js';
