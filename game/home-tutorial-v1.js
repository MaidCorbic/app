import './player-shield-visual-cleanup-v1.js';
import './runtime-ai-tutorial-settings.js';

(() => {
  if (window.__relayHomeTutorialV2) return;
  window.__relayHomeTutorialV2 = true;

  const style = document.createElement('style');
  style.textContent = `
    #intro .title-secondary .home-tutorial-button{width:100%;min-height:50px;padding:11px 13px;display:grid;align-content:center;gap:5px;box-sizing:border-box;text-align:left;white-space:nowrap;overflow:hidden}
    #intro .title-secondary .home-tutorial-button>span{display:block;overflow:hidden;text-overflow:ellipsis;color:#f4fbff;font:900 12px/1.15 'DM Mono',monospace;letter-spacing:1.25px;text-shadow:0 0 14px rgba(141,244,255,.22)}
    #intro .title-secondary .home-tutorial-button>small{display:block;overflow:hidden;text-overflow:ellipsis;color:#86a0b3;font:800 8px/1.15 'DM Mono',monospace;letter-spacing:.75px}
    .home-tutorial-content{display:grid;gap:11px;padding:3px 1px 12px;position:relative}
    .tutorial-zipper{height:22px;display:flex;align-items:center;gap:8px;margin:0 3px 1px;pointer-events:none;user-select:none}
    .tutorial-zipper>span{height:1px;flex:1;background:linear-gradient(90deg,transparent,rgba(141,244,255,.42),rgba(255,208,110,.28));box-shadow:0 0 10px rgba(56,189,248,.15)}
    .tutorial-zip-track{position:relative;width:82px;height:11px;border:1px solid rgba(141,244,255,.30);border-radius:6px;background:rgba(5,13,24,.92);box-shadow:inset 0 0 9px rgba(0,0,0,.5),0 0 12px rgba(56,189,248,.10)}
    .tutorial-zip-track::before{content:'';position:absolute;inset:3px 4px;background:repeating-linear-gradient(90deg,rgba(141,244,255,.34) 0 2px,transparent 2px 6px)}
    .tutorial-zip-pull{position:absolute;left:50%;top:50%;width:15px;height:15px;transform:translate(-50%,-50%);border:2px solid #ffd06e;border-radius:50%;background:#081321;box-shadow:0 0 12px rgba(255,208,110,.40)}
    .tutorial-zip-pull::after{content:'';position:absolute;left:50%;top:100%;width:3px;height:6px;transform:translateX(-50%);background:#ffd06e;border-radius:0 0 2px 2px}
    .tutorial-hero{padding:17px 16px;border:1px solid rgba(141,244,255,.26);border-radius:12px;background:radial-gradient(circle at 85% 0%,rgba(25,200,245,.15),transparent 44%),linear-gradient(145deg,rgba(10,28,47,.98),rgba(3,9,18,.99));box-shadow:inset 0 1px rgba(255,255,255,.06),0 14px 34px rgba(0,0,0,.22),0 0 22px rgba(56,189,248,.06);opacity:0;transform:translateY(8px);animation:tutorialReveal .7s .08s ease both}
    .tutorial-hero b{display:block;color:#8df4ff;font:900 15px/1.2 'DM Mono',monospace;letter-spacing:1.45px;text-shadow:0 0 18px rgba(141,244,255,.22)}
    .tutorial-hero p{margin:8px 0 0;color:#c0d0dc;font:750 10px/1.65 'DM Mono',monospace;letter-spacing:.15px}
    .tutorial-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
    .tutorial-step{min-width:0;padding:12px;border:1px solid rgba(210,226,240,.13);border-radius:10px;background:linear-gradient(145deg,rgba(9,20,34,.94),rgba(4,10,19,.96));box-shadow:inset 0 1px rgba(255,255,255,.025),0 7px 18px rgba(0,0,0,.14);opacity:0;transform:translateY(8px);animation:tutorialReveal .65s ease both}
    .tutorial-step:nth-child(1){animation-delay:.18s}.tutorial-step:nth-child(2){animation-delay:.26s}.tutorial-step:nth-child(3){animation-delay:.34s}
    .tutorial-step b{display:block;color:#ffd06e;font:900 10px/1.25 'DM Mono',monospace;letter-spacing:1px;text-shadow:0 0 12px rgba(255,208,110,.14)}
    .tutorial-step p{margin:7px 0 0;color:#b7c7d4;font:750 9px/1.55 'DM Mono',monospace;letter-spacing:.1px}
    .tutorial-category{padding:12px 13px;border:1px solid rgba(210,226,240,.12);border-radius:10px;background:linear-gradient(145deg,rgba(7,16,29,.90),rgba(3,9,17,.95));box-shadow:inset 0 1px rgba(255,255,255,.025);opacity:0;transform:translateY(8px);animation:tutorialReveal .65s ease both}
    .tutorial-category summary{cursor:pointer;list-style:none;color:#eef8fb;font:900 10px/1.25 'DM Mono',monospace;letter-spacing:.85px;text-shadow:0 0 12px rgba(141,244,255,.10);touch-action:manipulation}
    .tutorial-category summary::-webkit-details-marker{display:none}.tutorial-category summary::after{content:'+';float:right;color:#7f99ac;font-size:15px;font-weight:900}
    .tutorial-category[open] summary{color:#8df4ff}.tutorial-category[open] summary::after{content:'−';color:#ffd06e}
    .tutorial-category ul{margin:10px 0 1px;padding-left:19px;color:#b9c9d6;font:750 9px/1.7 'DM Mono',monospace;letter-spacing:.08px}
    .tutorial-category li{margin:3px 0}.tutorial-category li::marker{color:#ffd06e}
    .tutorial-key{display:inline-flex;align-items:center;justify-content:center;min-width:20px;min-height:19px;padding:2px 6px;border:1px solid rgba(141,244,255,.28);border-radius:5px;color:#f3fbff;background:linear-gradient(180deg,#0d1c2d,#07111e);font:900 8px/1 'DM Mono',monospace;text-align:center;box-shadow:inset 0 1px rgba(255,255,255,.05),0 0 8px rgba(56,189,248,.08)}
    .tutorial-note{color:#91a7b8!important}.tutorial-foot{padding:12px 13px;border-left:3px solid #8df4ff;color:#a9bdca;font:750 9px/1.65 'DM Mono',monospace;letter-spacing:.1px;background:linear-gradient(90deg,rgba(141,244,255,.065),rgba(141,244,255,.015));border-radius:0 8px 8px 0;opacity:0;transform:translateY(8px);animation:tutorialReveal .7s .92s ease both}
    @keyframes tutorialReveal{to{opacity:1;transform:none}}
    @media(max-width:700px){.tutorial-steps{grid-template-columns:1fr}.tutorial-hero{padding:14px}.tutorial-hero b{font-size:13px}.tutorial-hero p{font-size:9px}.tutorial-step b{font-size:10px}.tutorial-step p,.tutorial-category ul,.tutorial-foot{font-size:8.5px}.tutorial-category summary{font-size:9.5px}.tutorial-zipper{gap:5px}.tutorial-zip-track{width:60px}}
    @media(max-width:380px){.tutorial-zip-track{width:48px}.tutorial-zipper{margin-left:0;margin-right:0}.tutorial-hero b{font-size:12px}.tutorial-category summary{font-size:9px}}
    @media(prefers-reduced-motion:reduce){.tutorial-hero,.tutorial-step,.tutorial-category,.tutorial-foot{animation:none;opacity:1;transform:none}.tutorial-zip-pull{box-shadow:none}}
    #titlePanelContent{min-width:0;overscroll-behavior:contain}
    @media(max-width:700px){#titlePanelContent{max-height:calc(100dvh - 180px);overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;touch-action:pan-y;padding-right:3px;box-sizing:border-box}#titlePanelContent .tutorial-category summary{min-height:38px;display:flex;align-items:center;justify-content:space-between;gap:10px}#titlePanelContent .tutorial-category summary::after{float:none;flex:0 0 auto}#titlePanelContent .tutorial-category ul{overflow-wrap:anywhere;word-break:normal}}
  `;
  document.head.appendChild(style);

  const tutorialMarkup = `
    <div class="home-tutorial-content">
      <div class="tutorial-zipper" aria-hidden="true"><span></span><i class="tutorial-zip-track"><b class="tutorial-zip-pull"></b></i><span></span></div>
      <div class="tutorial-hero"><b>RELAY RUNNER · QUICK START</b><p>Learn the three things you need for your first run. Open the advanced sections only when you need them.</p></div>
      <div class="tutorial-steps"><div class="tutorial-step"><b>01 · MOVE</b><p><span class="tutorial-key">A</span> <span class="tutorial-key">D</span> run · <span class="tutorial-key">SPACE</span> jump · <span class="tutorial-key">SHIFT</span> dash</p></div><div class="tutorial-step"><b>02 · FIGHT</b><p><span class="tutorial-key">E</span> fire · <span class="tutorial-key">Q</span> blade · stomp enemies from above</p></div><div class="tutorial-step"><b>03 · DELIVER</b><p>Collect Signals, use checkpoints and reach the delivery beacon.</p></div></div>
      <details class="tutorial-category" open><summary>CONTROLS & MOVEMENT</summary><ul><li><span class="tutorial-key">A</span> / <span class="tutorial-key">D</span> Move left and right.</li><li><span class="tutorial-key">SPACE</span> Jump; release early for a shorter jump.</li><li><span class="tutorial-key">SHIFT</span> Dash through gaps and danger.</li><li><span class="tutorial-key">S</span> Slide under hazards while running.</li><li>Advanced routes can unlock double jump, wall jump, wall run, air dash and ledge grab.</li></ul></details>
      <details class="tutorial-category"><summary>COMBAT</summary><ul><li><span class="tutorial-key">E</span> Fire the equipped plasma weapon.</li><li><span class="tutorial-key">Q</span> Use the blade for close combat.</li><li>Stomp enemies from above to keep momentum.</li><li>Read enemy cues and projectiles; movement is your main defense.</li></ul></details>
      <details class="tutorial-category"><summary>SIGNALS, OBJECTIVES & CHECKPOINTS</summary><ul><li>Gold Signals grant score, XP and mastery progress.</li><li>Follow route markers and beacon guidance to the main objective.</li><li>Checkpoints preserve route progress and reduce the cost of mistakes.</li><li>Optional objectives reward clean routes, fast finishes and full Signal collection.</li></ul></details>
      <details class="tutorial-category"><summary>BUILD & GEAR</summary><ul><li><span class="tutorial-key">1</span> / <span class="tutorial-key">2</span> Build tools · <span class="tutorial-key">3</span> / <span class="tutorial-key">4</span> Gear.</li><li>Tools include Relay Shield, Kinetic Ball, Arc Turret and Spring Pad.</li><li>Gadgets can scan, disrupt, decoy, boost Signal score or restore Energy.</li><li>Spend Energy deliberately and recover safely at checkpoints.</li></ul></details>
      <details class="tutorial-category"><summary>DYNAMIC WORLD & ADVANCED PLAY</summary><ul><li>Power switches, security gates, cargo lifts and reactive props can alter routes.</li><li>Low routes are often safer; high routes can be faster or richer in Signals.</li><li>Combine movement, combat and gadgets instead of relying on one mechanic.</li><li class="tutorial-note">Advanced movement lessons should appear contextually after the relevant ability is available.</li></ul></details>
      <details class="tutorial-category"><summary>MOBILE CONTROLS</summary><ul><li>Use the virtual joystick for movement.</li><li>JUMP, SWORD and DASH are your primary actions.</li><li>BUILD 1 / BUILD 2 and GEAR 3 / GEAR 4 mirror keyboard abilities.</li><li>Landscape orientation gives the clearest route view.</li></ul></details>
      <details class="tutorial-category"><summary>TUTORIAL OPTIONS</summary><ul><li>TUTORIAL controls contextual lessons and mission guidance.</li><li>Turn it OFF for a clean run; turn it ON again whenever you want help.</li><li>AI VOICE is independent and can be disabled separately.</li></ul></details>
      <div class="tutorial-foot">PRO TIP · Learn the safe route first. On the next run, take the high line, chain movement and chase the optional objectives for a faster rank.</div>
    </div>`;

  function addButton(){const nav=document.querySelector('.title-secondary');if(!nav||nav.querySelector('[data-title-panel="tutorial"]'))return;const button=document.createElement('button');button.type='button';button.className='menu-option-button home-tutorial-button';button.dataset.titlePanel='tutorial';button.innerHTML='<span>TUTORIAL</span><small>QUICK START · FIELD GUIDE</small>';nav.insertBefore(button,nav.querySelector('[data-title-panel="controls"]')||nav.firstChild)}
  function openTutorial(){const panel=document.getElementById('titlePanel');const heading=document.getElementById('titlePanelHeading');const eyebrow=document.getElementById('titlePanelEyebrow');const content=document.getElementById('titlePanelContent');if(!panel||!heading||!content)return;panel.classList.remove('hidden');if(eyebrow)eyebrow.textContent='RUNNER FIELD MANUAL · QUICK START';heading.textContent='TUTORIAL';content.innerHTML=tutorialMarkup}
  function install(){addButton();const observer=new MutationObserver(addButton);if(document.body)observer.observe(document.body,{childList:true,subtree:true});document.addEventListener('click',event=>{const button=event.target.closest?.('[data-title-panel="tutorial"]');if(!button)return;event.preventDefault();event.stopImmediatePropagation();openTutorial()},true)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();