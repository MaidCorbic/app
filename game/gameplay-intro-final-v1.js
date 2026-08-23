(() => {
  'use strict';

  const start = document.getElementById('start');
  if (!start || window.__relayGameplayIntroFinalV2) return;
  window.__relayGameplayIntroFinalV2 = true;

  const KEY = 'relay.runner.gameplayIntro.final-v2.played';
  const root = document.createElement('section');
  root.id = 'relayGameplayIntroFinalV2';
  root.hidden = true;
  root.innerHTML = `
    <div class="relay-intro-vignette"></div>
    <div class="relay-intro-caption" aria-live="polite"></div>
    <button class="relay-intro-skip" type="button">SKIP · ENTER</button>
  `;
  document.body.appendChild(root);

  const style = document.createElement('style');
  style.textContent = `
    #relayGameplayIntroFinalV2{position:fixed;inset:0;z-index:2147483647;pointer-events:none;color:#eafcff;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
    #relayGameplayIntroFinalV2[hidden]{display:none}
    #relayGameplayIntroFinalV2 .relay-intro-vignette{position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,transparent 38%,rgba(0,0,0,.14) 72%,rgba(0,0,0,.68) 100%);pointer-events:none}
    #relayGameplayIntroFinalV2 .relay-intro-caption{position:absolute;left:50%;bottom:11%;width:min(820px,88vw);transform:translate(-50%,12px);opacity:0;text-align:center;text-shadow:0 4px 20px rgba(0,0,0,.96);transition:opacity .55s ease,transform .55s ease;pointer-events:none}
    #relayGameplayIntroFinalV2.show .relay-intro-caption{opacity:1;transform:translate(-50%,0)}
    #relayGameplayIntroFinalV2 .relay-intro-caption small{display:block;margin-bottom:10px;color:#8df4ff;font-size:clamp(9px,1vw,12px);letter-spacing:.22em}
    #relayGameplayIntroFinalV2 .relay-intro-caption strong{display:block;font-size:clamp(22px,3vw,46px);line-height:1;font-weight:900;letter-spacing:.05em}
    #relayGameplayIntroFinalV2 .relay-intro-caption span{display:block;margin-top:12px;color:#d6e5eb;font-size:clamp(11px,1.2vw,16px);line-height:1.5}
    #relayGameplayIntroFinalV2 .relay-intro-skip{position:absolute;left:14px;top:12px;pointer-events:auto;border:1px solid rgba(141,244,255,.32);background:rgba(2,7,13,.9);color:#eafcff;padding:9px 12px;font:800 9px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;cursor:pointer}
    /* During the opening presentation the gameplay HUD must not compete with the intro. */
    body.relay-gameplay-intro-active #progress,
    body.relay-gameplay-intro-active #missionProgress,
    body.relay-gameplay-intro-active #mission-progress,
    body.relay-gameplay-intro-active [data-progress],
    body.relay-gameplay-intro-active [data-mission-progress],
    body.relay-gameplay-intro-active [data-dawn],
    body.relay-gameplay-intro-active .dawn,
    body.relay-gameplay-intro-active .dawn-indicator,
    body.relay-gameplay-intro-active .game-progress,
    body.relay-gameplay-intro-active .mission-progress,
    body.relay-gameplay-intro-active .game-hud,
    body.relay-gameplay-intro-active .hud{visibility:hidden!important;opacity:0!important;pointer-events:none!important}
    @media(max-width:760px){#relayGameplayIntroFinalV2 .relay-intro-caption{bottom:14%;width:92vw}}
    @media(prefers-reduced-motion:reduce){#relayGameplayIntroFinalV2 .relay-intro-caption{transition:none}}
  `;
  document.head.appendChild(style);

  let active = false;
  let timer = null;
  let started = false;
  const caption = root.querySelector('.relay-intro-caption');
  const finish = () => {
    if (timer) { clearTimeout(timer); timer = null; }
    root.classList.remove('show');
    root.hidden = true;
    active = false;
    document.body.classList.remove('relay-gameplay-intro-active');
    sessionStorage.setItem(KEY, '1');
    window.__relayCinematicLock = false;
    window.dispatchEvent(new Event('relay:cinematic-unlock'));
    const runner = window.__relayRunnerScene || window.game?.scene?.getScene?.('runner');
    if (runner) {
      runner.inputEnabled = true;
      runner.cameras?.main?.startFollow?.(runner.player, true, .08, .08);
    }
    document.getElementById('play')?.classList.remove('relay-cinematic-presentation-lock');
  };

  const show = () => {
    if (active || sessionStorage.getItem(KEY) === '1') return;
    active = true;
    document.body.classList.add('relay-gameplay-intro-active');
    root.hidden = false;
    caption.innerHTML = '<small>OLD QUARTER · NIGHT SHIFT</small><strong>YOUR RUN BEGINS</strong><span>Beacon ahead. Keep your pace and deliver the relay.</span>';
    requestAnimationFrame(() => root.classList.add('show'));
    timer = window.setTimeout(finish, 4200);
  };

  start.addEventListener('click', event => {
    if (started) return;
    started = true;
    window.setTimeout(show, 250);
  }, { capture:false });

  root.querySelector('.relay-intro-skip').addEventListener('click', finish);
  document.addEventListener('keydown', event => {
    if (!active || event.key !== 'Enter') return;
    event.preventDefault();
    finish();
  }, { capture:true });
})();
