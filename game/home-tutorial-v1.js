import './player-shield-visual-cleanup-v1.js';
import './runtime-ai-tutorial-settings.js';

(() => {
  if (window.__relayHomeTutorialV1) return;
  window.__relayHomeTutorialV1 = true;

  const style = document.createElement('style');
  style.textContent = `
    .home-tutorial-button .tutorial-menu-icon{display:none!important}
    .home-tutorial-content{display:grid;gap:12px;padding:2px 0 8px}
    .tutorial-intro{padding:12px;border:1px solid rgba(141,244,255,.15);border-radius:10px;background:linear-gradient(145deg,rgba(12,28,48,.9),rgba(4,10,20,.96));box-shadow:inset 0 1px rgba(255,255,255,.04)}
    .tutorial-intro b{display:block;color:#8df4ff;font:900 11px/1.2 'DM Mono',monospace;letter-spacing:1px}
    .tutorial-intro p{margin:6px 0 0;color:#9aabba;font:700 8px/1.6 'DM Mono',monospace}
    .tutorial-category{padding:11px 12px;border:1px solid rgba(210,226,240,.10);border-radius:8px;background:rgba(7,16,29,.82)}
    .tutorial-category h3{margin:0;color:#ffd06e;font:900 9px/1.2 'DM Mono',monospace;letter-spacing:1px}
    .tutorial-category ul{margin:7px 0 0;padding-left:17px;color:#aebdcc;font:700 7.5px/1.65 'DM Mono',monospace}
    .tutorial-category li{margin:2px 0}
    .tutorial-key{display:inline-block;padding:1px 4px;border:1px solid rgba(210,226,240,.2);border-radius:4px;color:#e9f2f8;background:#081321;font-size:7px}
    .tutorial-note{color:#71859a!important}
    .tutorial-foot{padding:10px 12px;border-left:2px solid #8df4ff;color:#8fa5b8;font:700 7px/1.6 'DM Mono',monospace;background:rgba(141,244,255,.035)}
    @media(max-width:700px){.tutorial-category ul{font-size:7px;line-height:1.6}.tutorial-intro p{font-size:7px}}
  `;
  document.head.appendChild(style);

  const tutorialMarkup = `
    <div class="home-tutorial-content">
      <div class="tutorial-intro">
        <b>HOW TO PLAY · RELAY RUNNER</b>
        <p>Run the route, carry the Signal, survive the district and deliver the relay. Learn the essentials below before your first run.</p>
      </div>

      <section class="tutorial-category"><h3>01 · MOVEMENT</h3><ul>
        <li><span class="tutorial-key">A</span> / <span class="tutorial-key">D</span> Move left and right.</li>
        <li><span class="tutorial-key">SPACE</span> Jump. Release early for a shorter jump.</li>
        <li><span class="tutorial-key">SHIFT</span> Dash through gaps and danger.</li>
        <li><span class="tutorial-key">S</span> Hold while running to slide under hazards.</li>
        <li>Advanced missions unlock double jump, wall jump, wall run, air dash, ledge grab and other movement routes.</li>
      </ul></section>

      <section class="tutorial-category"><h3>02 · COMBAT</h3><ul>
        <li><span class="tutorial-key">E</span> Fire your equipped plasma weapon.</li>
        <li><span class="tutorial-key">Q</span> Use the blade for close combat.</li>
        <li>Jump onto enemies from above to perform a stomp and keep momentum.</li>
        <li>Watch enemy cues, projectiles and boss health indicators. Do not stop moving when a chase starts.</li>
      </ul></section>

      <section class="tutorial-category"><h3>03 · SIGNALS & OBJECTIVES</h3><ul>
        <li>Collect the gold Signals along the route for score, XP and mastery progress.</li>
        <li>Follow route markers, beacon text and district guidance to find the main objective.</li>
        <li>Optional objectives reward complete Signal collection, fast finishes and movement challenges.</li>
        <li>Use the route profile mentally: low routes are safer, high routes are usually faster or richer in Signals.</li>
      </ul></section>

      <section class="tutorial-category"><h3>04 · BUILDS & GEAR</h3><ul>
        <li><span class="tutorial-key">1</span> / <span class="tutorial-key">2</span> Use equipped build tools.</li>
        <li><span class="tutorial-key">3</span> / <span class="tutorial-key">4</span> Use equipped gadgets.</li>
        <li>Build tools include Relay Shield, Kinetic Ball, Arc Turret and Spring Pad.</li>
        <li>Gadgets can scan routes, disrupt threats, create decoys, boost Signal score or restore Energy.</li>
        <li>Energy is a resource: spend it deliberately and use checkpoints to recover safely.</li>
      </ul></section>

      <section class="tutorial-category"><h3>05 · CHECKPOINTS & RECOVERY</h3><ul>
        <li>Reach checkpoints to secure your route progress.</li>
        <li>If you fail, the run can recover from the latest checkpoint instead of restarting the entire mission.</li>
        <li>After a recovery, the game gives the courier a short protection window so the route can be re-entered safely.</li>
        <li>Checkpoints also reduce the cost of mistakes by preserving collected progress in the current run.</li>
      </ul></section>

      <section class="tutorial-category"><h3>06 · DYNAMIC WORLD</h3><ul>
        <li>Some routes contain interactive world elements such as power switches, security gates, cargo lifts and reactive props.</li>
        <li>Look for interaction prompts and environmental changes instead of treating every object as decoration.</li>
        <li>World interactions can open alternate lines, create timing windows or change how you approach a section.</li>
        <li class="tutorial-note">These systems are part of the existing Dynamic World Mechanics and do not replace the core movement or barrier rules.</li>
      </ul></section>

      <section class="tutorial-category"><h3>07 · MISSION FLOW</h3><ul>
        <li>Start the mission, read the opening route cue and build momentum.</li>
        <li>Use checkpoints, Signals, movement abilities and combat tools together instead of relying on one mechanic.</li>
        <li>Reach the delivery beacon or mission goal to complete the run.</li>
        <li>Higher ranks reward speed, clean routes, combat efficiency and optional objectives.</li>
      </ul></section>

      <section class="tutorial-category"><h3>08 · MOBILE CONTROLS</h3><ul>
        <li>Use the virtual joystick for movement.</li>
        <li>Use JUMP, SWORD and DASH as your primary actions.</li>
        <li>BUILD 1 / BUILD 2 and GEAR 3 / GEAR 4 access the same abilities as keyboard shortcuts.</li>
        <li>Landscape orientation provides the clearest route view and the full control layout.</li>
      </ul></section>

      <section class="tutorial-category"><h3>09 · OPTIONS</h3><ul>
        <li>The <b>TUTORIAL</b> option in Options controls contextual mission guidance and first-run lessons.</li>
        <li>Turn it <b>OFF</b> for a clean run with no tutorial guidance. Turn it back <b>ON</b> whenever you want help.</li>
        <li>AI VOICE can be disabled separately from tutorial text and route guidance.</li>
      </ul></section>

      <div class="tutorial-foot">PRO TIP · Learn the safe route first. Then replay the mission and use the high line, movement chain and optional objectives to improve your time.</div>
    </div>`;

  function addButton() {
    const nav = document.querySelector('.title-secondary');
    if (!nav || nav.querySelector('[data-title-panel="tutorial"]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'menu-option-button home-tutorial-button';
    button.dataset.titlePanel = 'tutorial';
    button.innerHTML = '<span>TUTORIAL</span><small>HOW TO PLAY</small>';
    nav.insertBefore(button, nav.querySelector('[data-title-panel="controls"]') || nav.firstChild);
  }

  function openTutorial() {
    const panel = document.getElementById('titlePanel');
    const heading = document.getElementById('titlePanelHeading');
    const eyebrow = document.getElementById('titlePanelEyebrow');
    const content = document.getElementById('titlePanelContent');
    if (!panel || !heading || !content) return;
    panel.classList.remove('hidden');
    if (eyebrow) eyebrow.textContent = 'RUNNER FIELD MANUAL';
    heading.textContent = 'TUTORIAL';
    content.innerHTML = tutorialMarkup;
  }

  const protectHome = event => {
    const intro = document.getElementById('intro');
    if (!intro || !intro.contains(event.target)) return;
    event.preventDefault();
  };

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

    document.addEventListener('copy', protectHome, true);
    document.addEventListener('cut', protectHome, true);
    document.addEventListener('selectstart', protectHome, true);
    document.addEventListener('dragstart', protectHome, true);
    document.addEventListener('contextmenu', protectHome, true);
    document.addEventListener('keydown', event => {
      if (!document.getElementById('intro')?.contains(event.target)) return;
      if ((event.ctrlKey || event.metaKey) && ['c', 'x', 'a'].includes(event.key.toLowerCase())) event.preventDefault();
    }, true);

    document.getElementById('intro')?.style.setProperty('user-select', 'none');
    document.getElementById('intro')?.style.setProperty('-webkit-user-select', 'none');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
