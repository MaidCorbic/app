import './player-shield-visual-cleanup-v1.js';
import './runtime-ai-tutorial-settings.js';

(() => {
  if (window.__relayHomeTutorialV2) return;
  window.__relayHomeTutorialV2 = true;

  const style = document.createElement('style');
  style.textContent = `
    #intro .title-secondary .home-tutorial-button{width:100%;min-height:52px;padding:11px 13px;display:grid;align-content:center;gap:5px;box-sizing:border-box;text-align:left;white-space:nowrap;overflow:hidden}
    #intro .title-secondary .home-tutorial-button>span{display:block;overflow:hidden;text-overflow:ellipsis;color:#e8f7fb;font:900 11px/1.2 'DM Mono',monospace;letter-spacing:.95px}
    #intro .title-secondary .home-tutorial-button>small{display:block;overflow:hidden;text-overflow:ellipsis;color:#7890a2;font:700 8px/1.2 'DM Mono',monospace;letter-spacing:.55px}

    .home-tutorial-content{display:grid;gap:12px;padding:3px 2px 12px;min-width:0}
    .tutorial-hero{padding:17px;border:1px solid rgba(141,244,255,.22);border-radius:13px;background:radial-gradient(circle at 80% 0%,rgba(25,200,245,.13),transparent 42%),linear-gradient(145deg,rgba(10,28,47,.96),rgba(3,9,18,.99));box-shadow:inset 0 1px rgba(255,255,255,.05),0 12px 30px rgba(0,0,0,.18);opacity:0;transform:translateY(8px);animation:tutorialReveal .7s .08s ease both}
    .tutorial-hero b{display:block;color:#8df4ff;font:900 15px/1.2 'DM Mono',monospace;letter-spacing:1.25px}
    .tutorial-hero p{margin:8px 0 0;color:#aec0cf;font:700 10.5px/1.6 'DM Mono',monospace;max-width:72ch}

    .tutorial-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
    .tutorial-step{min-width:0;padding:12px;border:1px solid rgba(210,226,240,.1);border-radius:10px;background:rgba(6,15,27,.9);opacity:0;transform:translateY(8px);animation:tutorialReveal .65s ease both}
    .tutorial-step:nth-child(1){animation-delay:.18s}.tutorial-step:nth-child(2){animation-delay:.26s}.tutorial-step:nth-child(3){animation-delay:.34s}
    .tutorial-step b{display:block;color:#ffd06e;font:900 10px/1.2 'DM Mono',monospace;letter-spacing:.85px}
    .tutorial-step p{margin:7px 0 0;color:#a8b9c8;font:700 9.5px/1.55 'DM Mono',monospace}

    .tutorial-category{padding:12px 13px;border:1px solid rgba(210,226,240,.1);border-radius:10px;background:rgba(7,16,29,.84);opacity:0;transform:translateY(8px);animation:tutorialReveal .65s ease both}
    .tutorial-category:nth-of-type(1){animation-delay:.42s}.tutorial-category:nth-of-type(2){animation-delay:.49s}.tutorial-category:nth-of-type(3){animation-delay:.56s}.tutorial-category:nth-of-type(4){animation-delay:.63s}.tutorial-category:nth-of-type(5){animation-delay:.70s}.tutorial-category:nth-of-type(6){animation-delay:.77s}.tutorial-category:nth-of-type(7){animation-delay:.84s}
    .tutorial-category summary{cursor:pointer;list-style:none;color:#edf7fb;font:900 11px/1.3 'DM Mono',monospace;letter-spacing:.75px;touch-action:manipulation;min-height:30px;display:flex;align-items:center;justify-content:space-between;gap:12px}
    .tutorial-category summary::-webkit-details-marker{display:none}
    .tutorial-category summary::after{content:'+';flex:0 0 auto;color:#7890a2;font-size:15px;line-height:1}
    .tutorial-category[open] summary{color:#8df4ff}
    .tutorial-category[open] summary::after{content:'−';color:#ffd06e}
    .tutorial-category ul{margin:10px 0 0;padding-left:20px;color:#b5c4d0;font:700 10px/1.65 'DM Mono',monospace}
    .tutorial-category li{margin:3px 0;padding-left:2px}

    .tutorial-key{display:inline-flex;align-items:center;justify-content:center;min-width:22px;min-height:24px;padding:3px 7px;border:1px solid rgba(141,244,255,.22);border-bottom-color:rgba(141,244,255,.38);border-radius:6px;color:#eefbff;background:linear-gradient(180deg,#0b1827,#07111d);font:900 9px/1 'DM Mono',monospace;text-align:center;vertical-align:middle;box-shadow:inset 0 1px rgba(255,255,255,.04),0 2px 8px rgba(0,0,0,.2)}
    .tutorial-note{color:#8398aa!important}
    .tutorial-foot{padding:12px 13px;border-left:2px solid #8df4ff;color:#9aafbf;font:700 10px/1.6 'DM Mono',monospace;background:rgba(141,244,255,.035);opacity:0;transform:translateY(8px);animation:tutorialReveal .7s .92s ease both}

    #titlePanelContent{min-width:0;overscroll-behavior:contain}
    #titlePanelContent:has(.home-tutorial-content){min-height:0;max-height:calc(100dvh - 185px);overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;touch-action:pan-y;padding-right:5px;box-sizing:border-box;scrollbar-width:thin;scrollbar-color:rgba(141,244,255,.72) rgba(255,255,255,.055)}
    #titlePanelContent:has(.home-tutorial-content)::-webkit-scrollbar{display:block;width:10px}
    #titlePanelContent:has(.home-tutorial-content)::-webkit-scrollbar-track{background:rgba(255,255,255,.045);border-radius:999px}
    #titlePanelContent:has(.home-tutorial-content)::-webkit-scrollbar-thumb{background:linear-gradient(180deg,rgba(141,244,255,.84),rgba(255,208,110,.84));border:2px solid rgba(4,12,23,.8);border-radius:999px;min-height:42px}

    @keyframes tutorialReveal{to{opacity:1;transform:none}}

    @media(max-width:900px){
      .tutorial-steps{grid-template-columns:1fr 1fr}
      .tutorial-step:last-child{grid-column:1/-1}
    }

    @media(max-width:700px){
      #intro .title-secondary .home-tutorial-button{min-height:50px;padding:10px 12px}
      #intro .title-secondary .home-tutorial-button>span{font-size:11px}
      #intro .title-secondary .home-tutorial-button>small{font-size:8px}
      .home-tutorial-content{gap:10px;padding:2px 0 10px}
      .tutorial-hero{padding:14px}
      .tutorial-hero b{font-size:13px}
      .tutorial-hero p{font-size:9.5px;line-height:1.58}
      .tutorial-steps{grid-template-columns:1fr;gap:8px}
      .tutorial-step:last-child{grid-column:auto}
      .tutorial-step{padding:11px}
      .tutorial-step b{font-size:9.5px}
      .tutorial-step p{font-size:9px}
      .tutorial-category{padding:11px 12px}
      .tutorial-category summary{font-size:10px;min-height:34px}
      .tutorial-category summary::after{font-size:14px}
      .tutorial-category ul{padding-left:18px;font-size:9.5px;line-height:1.62}
      .tutorial-key{min-width:21px;min-height:24px;font-size:8.5px;padding:3px 6px}
      .tutorial-foot{font-size:9.5px;line-height:1.58}
      #titlePanelContent:has(.home-tutorial-content){max-height:calc(100dvh - 170px);padding-right:4px}
    }

    @media(max-width:390px){
      .tutorial-hero b{font-size:12px}
      .tutorial-hero p{font-size:9px}
      .tutorial-category summary{font-size:9.5px}
      .tutorial-category ul{font-size:9px}
      .tutorial-key{min-width:20px;min-height:23px;font-size:8px}
      #titlePanelContent:has(.home-tutorial-content){max-height:calc(100dvh - 155px)}
    }

    @media(prefers-reduced-motion:reduce){.tutorial-hero,.tutorial-step,.tutorial-category,.tutorial-foot{animation:none;opacity:1;transform:none}}
  `;
  document.head.appendChild(style);

  const tutorialMarkup = `
    <div class="home-tutorial-content">
      <div class="tutorial-hero"><b>RELAY RUNNER · QUICK START</b><p>Learn the three things you need for your first run. Open the advanced sections only when you need them.</p></div>
      <div class="tutorial-steps">
        <div class="tutorial-step"><b>01 · MOVE</b><p><span class="tutorial-key">A</span> <span class="tutorial-key">D</span> run · <span class="tutorial-key">SPACE</span> jump · <span class="tutorial-key">SHIFT</span> dash</p></div>
        <div class="tutorial-step"><b>02 · FIGHT</b><p><span class="tutorial-key">E</span> fire · <span class="tutorial-key">Q</span> blade · stomp enemies from above</p></div>
        <div class="tutorial-step"><b>03 · DELIVER</b><p>Collect Signals, use checkpoints and reach the delivery beacon.</p></div>
      </div>
      <details class="tutorial-category" open><summary>CONTROLS & MOVEMENT</summary><ul>
        <li><span class="tutorial-key">A</span> / <span class="tutorial-key">D</span> Move left and right.</li>
        <li><span class="tutorial-key">SPACE</span> Jump; release early for a shorter jump.</li>
        <li><span class="tutorial-key">SHIFT</span> Dash through gaps and danger.</li>
        <li><span class="tutorial-key">S</span> Slide under hazards while running.</li>
        <li>Advanced routes can unlock double jump, wall jump, wall run, air dash and ledge grab.</li>
      </ul></details>
      <details class="tutorial-category"><summary>COMBAT</summary><ul>
        <li><span class="tutorial-key">E</span> Fire the equipped plasma weapon.</li>
        <li><span class="tutorial-key">Q</span> Use the blade for close combat.</li>
        <li>Stomp enemies from above to keep momentum.</li>
        <li>Read enemy cues and projectiles; movement is your main defense.</li>
      </ul></details>
      <details class="tutorial-category"><summary>SIGNALS, OBJECTIVES & CHECKPOINTS</summary><ul>
        <li>Gold Signals grant score, XP and mastery progress.</li>
        <li>Follow route markers and beacon guidance to the main objective.</li>
        <li>Checkpoints preserve route progress and reduce the cost of mistakes.</li>
        <li>Optional objectives reward clean routes, fast finishes and full Signal collection.</li>
      </ul></details>
      <details class="tutorial-category"><summary>BUILD & GEAR</summary><ul>
        <li><span class="tutorial-key">1</span> / <span class="tutorial-key">2</span> Build tools · <span class="tutorial-key">3</span> / <span class="tutorial-key">4</span> Gear.</li>
        <li>Tools include Relay Shield, Kinetic Ball, Arc Turret and Spring Pad.</li>
        <li>Gadgets can scan, disrupt, decoy, boost Signal score or restore Energy.</li>
        <li>Spend Energy deliberately and recover safely at checkpoints.</li>
      </ul></details>
      <details class="tutorial-category"><summary>DYNAMIC WORLD & ADVANCED PLAY</summary><ul>
        <li>Power switches, security gates, cargo lifts and reactive props can alter routes.</li>
        <li>Low routes are often safer; high routes can be faster or richer in Signals.</li>
        <li>Combine movement, combat and gadgets instead of relying on one mechanic.</li>
        <li class="tutorial-note">Advanced movement lessons should appear contextually after the relevant ability is available.</li>
      </ul></details>
      <details class="tutorial-category"><summary>MOBILE CONTROLS</summary><ul>
        <li>Use the virtual joystick for movement.</li>
        <li>JUMP, SWORD and DASH are your primary actions.</li>
        <li>BUILD 1 / BUILD 2 and GEAR 3 / GEAR 4 mirror keyboard abilities.</li>
        <li>Landscape orientation gives the clearest route view.</li>
      </ul></details>
      <details class="tutorial-category"><summary>TUTORIAL OPTIONS</summary><ul>
        <li>TUTORIAL controls contextual lessons and mission guidance.</li>
        <li>Turn it OFF for a clean run; turn it ON again whenever you want help.</li>
        <li>AI VOICE is independent and can be disabled separately.</li>
      </ul></details>
      <div class="tutorial-foot">PRO TIP · Learn the safe route first. On the next run, take the high line, chain movement and chase the optional objectives for a faster rank.</div>
    </div>`;

  function addButton() {
    const nav = document.querySelector('.title-secondary');
    if (!nav || nav.querySelector('[data-title-panel="tutorial"]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'menu-option-button home-tutorial-button';
    button.dataset.titlePanel = 'tutorial';
    button.innerHTML = '<span>TUTORIAL</span><small>QUICK START · FIELD GUIDE</small>';
    nav.insertBefore(button, nav.querySelector('[data-title-panel="controls"]') || nav.firstChild);
  }

  function openTutorial() {
    const panel = document.getElementById('titlePanel');
    const heading = document.getElementById('titlePanelHeading');
    const eyebrow = document.getElementById('titlePanelEyebrow');
    const content = document.getElementById('titlePanelContent');
    if (!panel || !heading || !content) return;
    panel.classList.remove('hidden');
    if (eyebrow) eyebrow.textContent = 'RUNNER FIELD MANUAL · QUICK START';
    heading.textContent = 'TUTORIAL';
    content.innerHTML = tutorialMarkup;
  }

  function install() {
    addButton();
    const observer = new MutationObserver(addButton);
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('click', event => {
      const button = event.target.closest?.('[data-title-panel="tutorial"]');
      if (!button) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      openTutorial();
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();