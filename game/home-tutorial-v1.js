import './player-shield-visual-cleanup-v1.js';
import './runtime-ai-tutorial-settings.js';

(() => {
  if (window.__relayHomeTutorialV4) return;
  window.__relayHomeTutorialV4 = true;

  const style = document.createElement('style');
  style.textContent = `
    #intro .home-tutorial-button{width:100%;min-height:46px;padding:10px 12px;display:grid;gap:4px;text-align:left;box-sizing:border-box}
    #intro .home-tutorial-button span,#intro .home-info-button span{font:900 10px/1.15 'DM Mono',monospace;letter-spacing:.9px}
    #intro .home-tutorial-button small,#intro .home-info-button small{font:700 7px/1.1 'DM Mono',monospace;color:#6f8798}
    #intro .home-info-button{width:100%;min-height:46px;padding:10px 12px;display:grid;gap:4px;text-align:left;box-sizing:border-box}
    #intro .info-launcher{display:none!important;visibility:hidden!important;pointer-events:none!important}
    #titlePanel.tutorial-panel #titlePanelContent{overflow-y:auto;overscroll-behavior:contain;touch-action:pan-y;-webkit-overflow-scrolling:touch}
    .relay-tutorial{display:grid;gap:9px;padding:2px 0 8px}
    .relay-tutorial-card{padding:12px;border:1px solid rgba(141,244,255,.16);border-radius:10px;background:linear-gradient(145deg,rgba(10,28,47,.96),rgba(3,9,18,.99))}
    .relay-tutorial-card strong{display:block;color:#8df4ff;font:900 10px/1.2 'DM Mono',monospace;letter-spacing:.8px}
    .relay-tutorial-card p,.relay-tutorial-card li{color:#a8b9c8;font:700 7.5px/1.55 'DM Mono',monospace}
    .relay-tutorial-card p{margin:6px 0 0}.relay-tutorial-card ul{margin:7px 0 0;padding-left:17px}
    .relay-tutorial-key{display:inline-block;padding:2px 4px;border:1px solid rgba(141,244,255,.18);border-radius:4px;color:#e9f7fb;background:#081321;font:800 7px/1 'DM Mono',monospace}
    @media(max-width:700px){.relay-tutorial-card{padding:10px}.relay-tutorial-card p,.relay-tutorial-card li{font-size:7px}}
  `;
  document.head.appendChild(style);

  const markup = `<div class="relay-tutorial">
      <div class="relay-tutorial-card"><strong>QUICK START</strong><p>Run the city, keep the relay alive and reach the delivery beacon. Learn the essentials here before your first run.</p></div>
      <div class="relay-tutorial-card"><strong>01 · MOVE</strong><ul><li><span class="relay-tutorial-key">A</span> / <span class="relay-tutorial-key">D</span> move.</li><li><span class="relay-tutorial-key">SPACE</span> jump.</li><li><span class="relay-tutorial-key">SHIFT</span> dash.</li><li><span class="relay-tutorial-key">S</span> slide under hazards.</li></ul></div>
      <div class="relay-tutorial-card"><strong>02 · FIGHT</strong><ul><li><span class="relay-tutorial-key">E</span> fire.</li><li><span class="relay-tutorial-key">Q</span> sword.</li><li>Stomp enemies from above and read their attack cues.</li></ul></div>
      <div class="relay-tutorial-card"><strong>03 · DELIVER</strong><ul><li>Follow the primary objective and route markers.</li><li>Use checkpoints to protect route progress.</li><li>Collect Signals for XP, score and mastery.</li></ul></div>
      <div class="relay-tutorial-card"><strong>MOBILE</strong><ul><li>Use the joystick for movement.</li><li>Use JUMP, SWORD, DASH, FIRE and SETTINGS.</li><li>Landscape gives the clearest route view.</li></ul></div>
      <div class="relay-tutorial-card"><strong>ADVANCED</strong><p>Later abilities can unlock double jump, wall jump, wall run, air dash and ledge grab. Optional objectives reward faster and cleaner runs.</p></div>
    </div>`;

  const open = () => {
    const panel = document.getElementById('titlePanel');
    const heading = document.getElementById('titlePanelHeading');
    const eyebrow = document.getElementById('titlePanelEyebrow');
    const content = document.getElementById('titlePanelContent');
    if (!panel || !heading || !content) return;
    panel.classList.add('tutorial-panel');
    panel.classList.remove('hidden');
    if (eyebrow) eyebrow.textContent = 'RUNNER FIELD MANUAL · QUICK START';
    heading.textContent = 'TUTORIAL';
    content.innerHTML = markup;
    window.setTimeout(() => document.getElementById('closeTitlePanel')?.focus?.(), 0);
  };

  const install = () => {
    const nav = document.querySelector('.title-secondary');
    if (!nav) return;

    let tutorialButton = nav.querySelector('[data-title-panel="tutorial"]');
    if (!tutorialButton) {
      tutorialButton = document.createElement('button');
      tutorialButton.type = 'button';
      tutorialButton.className = 'menu-option-button home-tutorial-button';
      tutorialButton.dataset.titlePanel = 'tutorial';
      tutorialButton.innerHTML = '<span>TUTORIAL</span><small>QUICK START · FIELD GUIDE</small>';
      nav.insertBefore(tutorialButton, nav.querySelector('[data-title-panel="controls"]') || nav.firstChild);
    }
    if (tutorialButton.dataset.tutorialBound !== 'true') {
      tutorialButton.dataset.tutorialBound = 'true';
      tutorialButton.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); open(); });
    }

    let infoButton = nav.querySelector('[data-home-info-button]');
    if (!infoButton) {
      infoButton = document.createElement('button');
      infoButton.type = 'button';
      infoButton.className = 'menu-option-button home-info-button';
      infoButton.dataset.homeInfoButton = '1';
      infoButton.innerHTML = '<span>INFO</span><small>LATEST UPDATE · RELAY STATUS</small>';
      const fieldGuide = nav.querySelector('[data-relay-info="faq"]');
      if (fieldGuide?.nextSibling) nav.insertBefore(infoButton, fieldGuide.nextSibling); else nav.appendChild(infoButton);
    }
    if (infoButton.dataset.infoBound !== 'true') {
      infoButton.dataset.infoBound = 'true';
      infoButton.addEventListener('click', () => document.querySelector('#intro .info-circle')?.click());
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true }); else install();
})();