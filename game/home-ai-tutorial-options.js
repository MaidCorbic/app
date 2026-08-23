import { getSettings, updateSettings } from './src/settings/settings-store.js';

(() => {
  if (window.__relayHomeAiTutorialOptionsV1) return;
  window.__relayHomeAiTutorialOptionsV1 = true;

  const style = document.createElement('style');
  style.textContent = `
    .home-opt.home-opt-ai-tutorial{position:relative}
    .home-opt-ai-tutorial .home-opt-copy b{letter-spacing:.8px}
    .home-opt-ai-tutorial .home-opt-copy small{color:#71859a}
    .home-opt-ai-tutorial button{min-width:96px}
    .home-opt-ai-tutorial button.is-on{border-color:rgba(141,244,255,.62);color:#8df4ff;box-shadow:0 0 16px rgba(56,189,248,.10)}
    @media(max-width:700px){.home-opt-ai-tutorial button{width:100%}}
  `;
  document.head.appendChild(style);

  const option = (key, title, detail, on) => {
    const row = document.createElement('div');
    row.className = 'home-opt home-opt-ai-tutorial';
    row.dataset.homeAiTutorial = key;
    row.innerHTML = `<div class="home-opt-copy"><b>${title}</b><small>${detail}</small></div><button type="button" class="${on ? 'is-on' : ''}" aria-pressed="${on}">${on ? 'ON' : 'OFF'}</button>`;
    const button = row.querySelector('button');
    button.addEventListener('click', () => {
      const settings = getSettings();
      const next = !settings[key];
      updateSettings({ [key]: next });
      if (key === 'aiVoice' && !next) window.speechSynthesis?.cancel?.();
      button.textContent = next ? 'ON' : 'OFF';
      button.classList.toggle('is-on', next);
      button.setAttribute('aria-pressed', String(next));
    });
    return row;
  };

  function inject() {
    const root = document.querySelector('#titlePanelContent .home-options-v3');
    if (!root) return;
    const sections = [...root.querySelectorAll(':scope > .home-section')];
    const gameplay = sections.find(section => section.textContent.trim() === 'GAMEPLAY');
    const audio = sections.find(section => section.textContent.trim() === 'AUDIO');
    if (!gameplay || !audio) return;

    const settings = getSettings();
    if (!root.querySelector('[data-home-ai-tutorial="tutorialEnabled"]')) {
      gameplay.insertAdjacentElement('afterend', option('tutorialEnabled', 'TUTORIAL', 'Mission guidance, first-run lessons and route tips', settings.tutorialEnabled));
    }
    if (!root.querySelector('[data-home-ai-tutorial="aiVoice"]')) {
      audio.insertAdjacentElement('afterend', option('aiVoice', 'AI VOICE', 'NIA / MARA narration and in-game spoken guidance', settings.aiVoice));
    }

    const reset = root.querySelector('[data-home-reset]');
    if (reset && !reset.dataset.homeAiTutorialReset) {
      reset.dataset.homeAiTutorialReset = '1';
      reset.addEventListener('click', () => {
        window.setTimeout(() => {
          updateSettings({ aiVoice: true, tutorialEnabled: true });
          inject();
        }, 0);
      });
    }
  }

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    window.setTimeout(() => { scheduled = false; inject(); }, 0);
  };

  const observer = new MutationObserver(schedule);
  const start = () => {
    if (!document.body) return;
    observer.observe(document.body, { childList: true, subtree: true });
    schedule();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
