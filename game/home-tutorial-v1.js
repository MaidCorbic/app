import './player-shield-visual-cleanup-v1.js';
import './runtime-ai-tutorial-settings.js';

(() => {
  if (window.__relayHomeTutorialV2) return;
  window.__relayHomeTutorialV2 = true;

  const style = document.createElement('style');
  style.textContent = `
    #intro .title-secondary .home-tutorial-button{width:100%;min-height:43px;padding:10px 12px;display:grid;align-content:center;justify-items:start;gap:4px;box-sizing:border-box;overflow:hidden;text-align:left;white-space:nowrap}
    #intro .title-secondary .home-tutorial-button>span{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;color:#dbe5ed;font:800 10px/1.15 'DM Mono',monospace;letter-spacing:.8px}
    #intro .title-secondary .home-tutorial-button>small{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;color:#74879a;font:700 7px/1.1 'DM Mono',monospace;letter-spacing:.55px}
    .home-tutorial-content{display:grid;gap:10px;padding:2px 0 8px}
    .tutorial-intro{padding:14px 12px;border:1px solid rgba(141,244,255,.16);border-radius:11px;background:linear-gradient(145deg,rgba(8,28,45,.94),rgba(3,10,20,.98));box-shadow:inset 0 1px rgba(255,255,255,.04),0 0 22px rgba(25,200,245,.04);text-align:center}
    .tutorial-intro b{display:block;color:#ffd06e;font:900 12px/1.25 'DM Mono',monospace;letter-spacing:1.25px}
    .tutorial-intro p{margin:7px auto 0;max-width:520px;color:#9aabba;font:700 7.5px/1.55 'DM Mono',monospace;letter-spacing:.1px}
    .tutorial-quick{display:grid;gap:9px}
    .tutorial-quick-card{padding:12px 10px;border:1px solid rgba(210,226,240,.09);border-radius:9px;background:rgba(4,12,24,.92);text-align:center;box-shadow:inset 0 1px rgba(255,255,255,.025)}
    .tutorial-quick-card h3{margin:0;color:#ffd06e;font:900 11px/1.2 'DM Mono',monospace;letter-spacing:1px}
    .tutorial-quick-card p{margin:7px 0 0;color:#b2c0cc;font:700 7.5px/1.45 'DM Mono',monospace}
    .tutorial-key{display:inline-block;padding:1px 5px;border:1px solid rgba(210,226,240,.2);border-radius:4px;color:#e9f2f8;background:#081321;font-size:7px;line-height:1.25;vertical-align:baseline}
    .tutorial-accordion{overflow:hidden;border:1px solid rgba(210,226,240,.10);border-radius:9px;background:rgba(5,14,27,.92)}
    .tutorial-accordion>button{width:100%;min-height:42px;padding:10px 13px;border:0;background:transparent;color:#dce7ef;display:flex;align-items:center;justify-content:space-between;gap:12px;font:900 9px/1.2 'DM Mono',monospace;letter-spacing:.75px;text-transform:uppercase;cursor:pointer}
    .tutorial-accordion>button:hover{background:rgba(25,200,245,.045)}
    .tutorial-accordion>button .tutorial-plus{color:#8ca0af;font-size:15px;font-weight:500;line-height:1;flex:0 0 auto}
    .tutorial-accordion.is-open>button{color:#8df4ff;background:rgba(25,200,245,.035)}
    .tutorial-accordion.is-open>button .tutorial-plus{color:#ffd06e}
    .tutorial-panel{display:none;padding:0 14px 13px;color:#aebdcc;font:700 7.5px/1.65 'DM Mono',monospace}
    .tutorial-accordion.is-open .tutorial-panel{display:block;animation:tutorialPanelIn .25s ease both}
    .tutorial-panel ul{margin:0;padding-left:16px}.tutorial-panel li{margin:3px 0}.tutorial-panel b{color:#dfeaf1}.tutorial-note{color:#71859a!important}
    .tutorial-foot{padding:11px 12px;border-left:2px solid #8df4ff;color:#8fa5b8;font:700 7px/1.6 'DM Mono',monospace;background:rgba(141,244,255,.035)}
    @keyframes tutorialPanelIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
    @media(max-width:700px){
      #intro .title-secondary .home-tutorial-button{min-height:44px;padding:9px 10px}
      #intro .title-secondary .home-tutorial-button>span{font-size:9px;letter-spacing:.65px}
      #intro .title-secondary .home-tutorial-button>small{font-size:6.5px;letter-spacing:.4px}
      .tutorial-intro{padding:13px 10px}.tutorial-intro b{font-size:10px}.tutorial-intro p{font-size:7px}
      .tutorial-quick-card{padding:11px 8px}.tutorial-quick-card h3{font-size:10px}.tutorial-quick-card p{font-size:7px}
      .tutorial-accordion>button{min-height:43px;font-size:8px;letter-spacing:.55px}.tutorial-panel{font-size:7px;line-height:1.6}
    }
  `;
  document.head.appendChild(style);

  const tutorialMarkup = `
    <div class="home-tutorial-content">
      <div class="tutorial-intro">
        <b>RELAY RUNNER · QUICK START</b>
        <p>Learn the three things you need for your first run. Open the advanced sections only when you need them.</p>
      </div>

      <div class="tutorial-quick">
        <article class="tutorial-quick-card"><h3>01 · MOVE</h3><p><span class="tutorial-key">A</span> <span class="tutorial-key">D</span> run · <span class="tutorial-key">SPACE</span> jump · <span class="tutorial-key">SHIFT</span> dash</p></article>
        <article class="tutorial-quick-card"><h3>02 · FIGHT</h3><p><span class="tutorial-key">E</span> fire · <span class="tutorial-key">Q</span> blade · stomp enemies from above</p></article>
        <article class="tutorial-quick-card"><h3>03 · DELIVER</h3><p>Collect Signals, use checkpoints and reach the delivery beacon.</p></article>
      </div>

      <section class="tutorial-accordion is-open">
        <button type="button" aria-expanded="true"><span>CONTROLS &amp; MOVEMENT</span><span class="tutorial-plus">−</span></button>
        <div class="tutorial-panel"><ul>
          <li><span class="tutorial-key">A</span> / <span class="tutorial-key">D</span> Move left and right.</li>
          <li><span class="tutorial-key">SPACE</span> Jump; release early for a shorter jump.</li>
          <li><span class="tutorial-key">SHIFT</span> Dash through gaps and danger.</li>
          <li><span class="tutorial-key">S</span> Slide under hazards while running.</li>
          <li>Advanced routes can unlock double jump, wall jump, wall run, air dash and ledge grab.</li>
        </ul></div>
      </section>

      <section class="tutorial-accordion"><button type="button" aria-expanded="false"><span>COMBAT</span><span class="tutorial-plus">+</span></button><div class="tutorial-panel"><ul>
        <li><span class="tutorial-key">E</span> Fire the equipped weapon.</li><li><span class="tutorial-key">Q</span> Use the blade for close combat.</li><li>Jump onto enemies from above to stomp them and preserve momentum.</li><li>Watch enemy cues and projectiles; keep moving during a chase.</li>
      </ul></div></section>

      <section class="tutorial-accordion"><button type="button" aria-expanded="false"><span>SIGNALS, OBJECTIVES &amp; CHECKPOINTS</span><span class="tutorial-plus">+</span></button><div class="tutorial-panel"><ul>
        <li>Collect Signals for score, XP and mastery progress.</li><li>Follow route markers, beacon text and mission guidance.</li><li>Reach checkpoints to secure progress and recover safely after a failed section.</li><li>Optional objectives reward complete collection, fast finishes and clean movement.</li>
      </ul></div></section>

      <section class="tutorial-accordion"><button type="button" aria-expanded="false"><span>BUILD &amp; GEAR</span><span class="tutorial-plus">+</span></button><div class="tutorial-panel"><ul>
        <li><span class="tutorial-key">1</span> / <span class="tutorial-key">2</span> Build tools · <span class="tutorial-key">3</span> / <span class="tutorial-key">4</span> Gadgets.</li><li>Build tools include Relay Shield, Kinetic Ball, Arc Turret and Spring Pad.</li><li>Gadgets can scan routes, disrupt threats, create decoys, boost Signals or restore Energy.</li><li>Spend Energy deliberately and use checkpoints to recover safely.</li>
      </ul></div></section>

      <section class="tutorial-accordion"><button type="button" aria-expanded="false"><span>DYNAMIC WORLD &amp; ADVANCED PLAY</span><span class="tutorial-plus">+</span></button><div class="tutorial-panel"><ul>
        <li>Interactive world elements can include power switches, security gates, cargo lifts and reactive props.</li><li>Look for interaction prompts and environmental changes rather than treating every object as decoration.</li><li>High routes are often faster or richer in Signals; low routes can be safer.</li><li class="tutorial-note">These systems complement the existing movement, combat and barrier rules.</li>
      </ul></div></section>

      <section class="tutorial-accordion"><button type="button" aria-expanded="false"><span>MOBILE CONTROLS</span><span class="tutorial-plus">+</span></button><div class="tutorial-panel"><ul>
        <li>Use the virtual joystick for movement.</li><li>JUMP, SWORD, FIRE and DASH are the primary touch actions.</li><li>BUILD 1 / BUILD 2 and GEAR 3 / GEAR 4 access the same abilities as keyboard shortcuts.</li><li>Landscape orientation provides the clearest route view and full controls.</li>
      </ul></div></section>

      <section class="tutorial-accordion"><button type="button" aria-expanded="false"><span>TUTORIAL OPTIONS</span><span class="tutorial-plus">+</span></button><div class="tutorial-panel"><ul>
        <li>The <b>TUTORIAL</b> option controls contextual mission guidance and first-run lessons.</li><li>Turn it OFF for a clean run; turn it ON whenever you want help.</li><li>AI VOICE can be disabled separately from tutorial text and route guidance.</li>
      </ul></div></section>

      <div class="tutorial-foot">PRO TIP · Learn the safe route first. On the next run, take the high line, chain movement and chase the optional objectives for a faster rank.</div>
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
    if (eyebrow) eyebrow.textContent = 'RUNNER FIELD MANUAL · QUICK START';
    heading.textContent = 'TUTORIAL';
    content.innerHTML = tutorialMarkup;

    content.querySelectorAll('.tutorial-accordion>button').forEach(button => {
      button.addEventListener('click', () => {
        const section = button.parentElement;
        const open = section.classList.toggle('is-open');
        button.setAttribute('aria-expanded', String(open));
        const icon = button.querySelector('.tutorial-plus');
        if (icon) icon.textContent = open ? '−' : '+';
      });
    });
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
    document.getElementById('intro')?.style.setProperty('user-select', 'none');
    document.getElementById('intro')?.style.setProperty('-webkit-user-select', 'none');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
