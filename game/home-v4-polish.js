(() => {
  if (window.__relayHomeV4) return;
  window.__relayHomeV4 = true;

  const boot = () => {
    const intro = document.getElementById('intro');
    const lock = intro?.querySelector('.title-lockup');
    const actions = lock?.querySelector('.menu-actions');
    const utility = document.getElementById('homeV3Utility');
    const deck = document.getElementById('homeV3Deck');
    if (!intro || !lock || !actions || !utility || !deck) return false;

    const style = document.createElement('style');
    style.textContent = `
      /* HOME V4 — compact cinematic hierarchy */
      #intro .main-menu{position:relative;z-index:4}
      #intro .main-menu-body{position:relative}
      #intro .title-lockup{max-width:560px}
      #intro .menu-tagline{max-width:420px;margin-left:auto;margin-right:auto}
      #intro .menu-actions>p{opacity:.55}
      #homeV3Utility{width:min(270px,100%);grid-template-columns:repeat(3,1fr);gap:6px;margin:10px auto 0}
      #homeV3Utility .home-v3-btn{min-height:34px;font-size:7px;letter-spacing:1.4px;border-color:#41576c;background:linear-gradient(180deg,#091725,#050d16);box-shadow:inset 0 1px #ffffff0a,0 5px 16px #0006}
      #homeV3Utility .home-v3-btn:first-child,#homeV3Utility .home-v3-btn:nth-child(2){color:#cbd8e3}
      #homeV3Utility .home-v3-btn:hover,#homeV3Utility .home-v3-btn:focus-visible{border-color:#ffd06e;color:#ffd06e;transform:translateY(-1px);box-shadow:0 8px 20px #0008,0 0 14px #ffd06e1c}
      #homeV3Launch{display:block;width:min(270px,100%);min-height:34px;margin:6px auto 0;border:1px solid #4e6277;background:#07131f;color:#9fb0c0;font:800 7px 'DM Mono',monospace;letter-spacing:1.7px;cursor:pointer;box-shadow:inset 0 1px #ffffff08,0 5px 14px #0005}
      #homeV3Launch::before{content:'+';display:inline-block;margin-right:6px;color:#ffd06e;font-size:11px;transition:transform .2s ease}
      #homeV3Launch[aria-expanded='true']::before{transform:rotate(45deg)}
      #homeV3Launch:hover,#homeV3Launch:focus-visible{border-color:#ffd06e;color:#ffd06e;outline:none}
      #homeV3Deck{width:min(270px,100%);margin:5px auto 0;gap:5px;order:initial}
      #homeV3Deck .home-v3-btn{min-height:31px;font-size:6.5px}
      #homeV3Deck:not(.open){display:none}
      #homeV3Deck.open{animation:homeV4Deck .18s ease both}
      #intro .title-secondary{margin-top:12px;gap:7px}
      #intro .title-secondary .menu-option-button{min-height:46px}
      #intro .title-secondary .menu-option-button:nth-child(2){display:none}
      #intro .title-secondary .exit-button{opacity:.68}
      #continue{margin-top:7px!important;border-color:#4b647a!important;color:#b9c9d6!important;background:linear-gradient(180deg,#0a1826,#06101a)!important;box-shadow:0 0 20px #38bdf812!important}
      #continue:not(.hidden){display:flex!important;animation:homeV4Continue .35s ease both}
      #intro .play-button{position:relative;overflow:hidden;transform:translateZ(0);box-shadow:0 13px 34px #ffcf6a2d,inset 0 1px #fff9}
      #intro .play-button::before{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 20%,#fff8 45%,transparent 70%);transform:translateX(-120%);animation:homeV4Sweep 3.4s ease-in-out infinite}
      #intro .play-button span,#intro .play-button b{position:relative;z-index:1}
      #intro .play-button:active{transform:scale(.985)}
      #intro .backdrop-rain{opacity:.7;filter:drop-shadow(0 0 5px #8deaff22)}
      #intro .menu-backdrop::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 50% 38%,#38bdf80a,transparent 32%),linear-gradient(180deg,transparent 55%,#02050dcc 100%);pointer-events:none}
      #intro .menu-backdrop::after{content:'';position:absolute;inset:0;background:radial-gradient(circle at 24% 68%,#ffd06e10 0 1px,transparent 2px),radial-gradient(circle at 76% 62%,#38bdf814 0 1px,transparent 2px);background-size:130px 150px,170px 190px;mix-blend-mode:screen;animation:homeV4Particles 8s linear infinite}
      .home-v4-more-note{display:block;margin:4px auto 0;color:#56697c;font:700 6px 'DM Mono',monospace;letter-spacing:1px;text-transform:uppercase}
      @keyframes homeV4Sweep{0%,55%{transform:translateX(-120%)}75%,100%{transform:translateX(120%)}}
      @keyframes homeV4Particles{to{background-position:130px 150px,-170px -190px}}
      @keyframes homeV4Deck{from{opacity:0;transform:translateY(-5px) scale(.98)}to{opacity:1;transform:none}}
      @keyframes homeV4Continue{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
      @media(max-width:700px){
        #intro .main-menu{width:calc(100vw - 28px);max-height:calc(100dvh - 18px)}
        #intro .main-menu-body{overflow:visible}
        #intro .title-lockup{max-width:100%}
        #intro .title-lockup h1{font-size:clamp(58px,17vw,82px);line-height:.78}
        #intro .menu-tagline{font-size:9px;line-height:1.5;margin-top:14px}
        #intro .menu-actions{margin-top:16px}
        #intro .play-button{min-height:58px}
        #homeV3Utility{width:min(280px,calc(100vw - 62px));margin-top:8px}
        #homeV3Launch{width:min(280px,calc(100vw - 62px))}
        #homeV3Deck{width:min(280px,calc(100vw - 62px))}
        #intro .title-secondary{margin-top:9px}
        #intro .title-secondary .menu-option-button{min-height:43px}
        #intro .menu-actions>p{display:none}
        .home-v4-more-note{font-size:5.5px}
      }
      @media(max-height:700px){
        #intro .title-lockup h1{font-size:clamp(50px,14vw,70px)}
        #intro .menu-actions{margin-top:10px}
        #intro .title-secondary{margin-top:7px}
        #homeV3Utility .home-v3-btn,#homeV3Launch{min-height:30px}
        #intro .title-secondary .menu-option-button{min-height:38px}
      }
      @media(prefers-reduced-motion:reduce){
        #intro .play-button::before,#intro .menu-backdrop::after,#homeV3Deck.open{animation:none!important}
      }
    `;
    document.head.appendChild(style);

    const buttons = [...utility.querySelectorAll('.home-v3-btn')];
    const faq = buttons[0];
    const info = buttons[1];
    const audio = document.getElementById('homeV3Audio') || buttons[2];

    // Keep FAQ / INFO / AUDIO directly under PLAY, exactly three compact utilities.
    [faq, info, audio].forEach((b) => { if (b) b.classList.add('home-v4-utility'); });

    // Make the feature grid a secondary layer instead of seven competing Home actions.
    const launch = document.getElementById('homeV3Launch');
    if (launch) {
      launch.textContent = 'MORE';
      launch.setAttribute('aria-expanded', deck.classList.contains('open') ? 'true' : 'false');
      launch.setAttribute('aria-label', 'Open more Home features');
      const note = document.createElement('small');
      note.className = 'home-v4-more-note';
      note.textContent = 'PROFILE • MISSIONS • DAILY • REWARDS';
      launch.insertAdjacentElement('afterend', note);
      launch.addEventListener('click', () => {
        requestAnimationFrame(() => launch.setAttribute('aria-expanded', deck.classList.contains('open') ? 'true' : 'false'));
      });
    }

    // Hide the old duplicate Field Guide; FAQ is the dedicated guide entry now.
    const fieldGuide = intro.querySelector('.title-secondary [data-relay-info="faq"]');
    if (fieldGuide) fieldGuide.closest('.menu-option-button')?.setAttribute('hidden', '');

    // Add a compact Continue card when a previous run exists, without duplicating the primary CTA.
    const continueBtn = document.getElementById('continue');
    if (continueBtn && !continueBtn.classList.contains('hidden')) {
      continueBtn.setAttribute('aria-label', 'Continue previous run');
    }

    // Lightweight button feedback; never blocks existing handlers.
    const clickFx = (event) => {
      const button = event.target.closest('button');
      if (!button || !intro.contains(button)) return;
      button.classList.remove('home-v4-click');
      void button.offsetWidth;
      button.classList.add('home-v4-click');
    };
    intro.addEventListener('pointerdown', clickFx, { passive: true });

    // Stronger HOME → GAME transition on the real PLAY button.
    const start = document.getElementById('start');
    if (start && !start.dataset.homeV4Transition) {
      start.dataset.homeV4Transition = '1';
      start.addEventListener('click', () => {
        intro.classList.add('home-v4-launching');
      }, { capture: true });
    }

    return true;
  };

  const run = () => {
    if (boot()) return;
    const observer = new MutationObserver(() => { if (boot()) observer.disconnect(); });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 8000);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
})();
