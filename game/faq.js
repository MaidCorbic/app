export const RELAY_FAQ = [
  ['How do I play?', 'Use A/D or the left/right side of the joystick to move, SPACE or JUMP to jump. On mobile, use the touch controls.'],
  ['How do I complete a mission?', 'Follow the mission objective, collect the required signals and reach the delivery beacon. When complete, use NEXT MISSION to continue.'],
  ['How do I move to the next mission?', 'After successfully completing a mission, press NEXT MISSION. The game loads the next level.'],
  ['What do SWORD, DASH and BUILD do?', 'SWORD is for combat, DASH helps you avoid hazards quickly, and BUILD activates available construction abilities.'],
  ['Can I play on a phone?', 'Yes. The game has touch controls and landscape mode is recommended for the clearest view.'],
  ['Why is there no sound?', 'Mobile browsers may block autoplay audio. Tap the screen once to unlock audio, and check your device volume and mute settings.'],
  ['Is my progress saved?', 'Mission progress and game data use the existing save system. Avoid clearing browser data if you want to keep local progress.'],
  ['What is XP?', 'XP is experience earned from missions and activities that advances your courier rank.'],
  ['How do I pause the game?', 'Press the ☰ button in the upper-right HUD.'],
  ['Where can I see the latest changes?', 'Open the circular info button in the upper-right corner of the title screen.']
];

export const LATEST_UPDATE = {
  version: 'LATEST UPDATE',
  title: 'MISSION SYSTEM STABILITY',
  items: [
    'More reliable mission transitions with protection against blank or black screens.',
    'More stable WebGL resizing during mission transitions.',
    'Original arcade menu soundtrack.',
    'Improved touch controls for phones.',
    'FAQ, language selection and update information directly from the title menu.'
  ]
};

(async () => {
  const i18n = await import('./src/i18n.js');
  const actions = document.querySelector('.relay-info-actions');
  if (actions && !actions.querySelector('[data-language-open]')) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'relay-info-button relay-language-button';
    button.dataset.languageOpen = 'true'; button.setAttribute('aria-label', 'Choose language');
    button.innerHTML = '<span class="icon icon-language" aria-hidden="true">文</span>';
    actions.appendChild(button);
  }
  window.addEventListener('relay-language-change', ({ detail }) => {
    const faqHeading = document.getElementById('relayInfoHeading');
    const eyebrow = document.getElementById('relayInfoEyebrow');
    if (faqHeading?.textContent === 'FAQ' || faqHeading?.textContent === 'PREGUNTAS FRECUENTES' || faqHeading?.textContent === 'FAQ') {
      faqHeading.textContent = i18n.text('faq');
      if (eyebrow) eyebrow.textContent = detail.lang === 'en' ? 'RELAY RUNNER // FIELD GUIDE' : i18n.text('faq');
    }
    document.querySelectorAll('[data-relay-info]').forEach(el => el.title = el.dataset.relayInfo === 'faq' ? i18n.text('faq') : i18n.text('info'));
  });
})();