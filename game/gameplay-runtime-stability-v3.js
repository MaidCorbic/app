/* Final gameplay presentation/runtime compatibility layer. */
(() => {
  'use strict';

  if (window.__relayGameplayRuntimeStabilityV3) return;
  window.__relayGameplayRuntimeStabilityV3 = true;

  const q = s => document.querySelector(s);

  const visible = n =>
    !!n &&
    !n.classList.contains('hidden') &&
    !n.hidden &&
    getComputedStyle(n).display !== 'none';

  const gameplay = () =>
    visible(q('#play')) &&
    !visible(q('#intro'));

  const style = document.createElement('style');

  style.id =
    'relay-runtime-stability-v3-style';

  style.textContent = `
    #intro .info-launcher{
      display:none!important;
      visibility:hidden!important;
      pointer-events:none!important
    }

    #intro .home-v3-side{
      display:grid!important;
      grid-template-columns:1fr!important;
      gap:10px!important;
      visibility:visible!important;
      opacity:1!important;
      pointer-events:auto!important;
      position:relative!important;
      z-index:90!important
    }

 #game .world-marker{
  position:absolute!important;
  left:50%!important;
  right:auto!important;
  top:125px!important;
  bottom:auto!important;
  transform:translateX(-50%)!important;
  width:min(290px,calc(100vw - 28px))!important;
  min-height:52px!important;
  height:auto!important;
      padding:8px 12px!important;
      box-sizing:border-box!important;
      border:1px solid rgba(255,208,110,.24)!important;
      border-left:2px solid #ffd06e!important;
      border-radius:10px!important;
      background:linear-gradient(
        145deg,
        rgba(7,10,15,.97),
        rgba(2,3,5,.98)
      )!important;
      box-shadow:
        0 14px 30px rgba(0,0,0,.26),
        0 0 25px rgba(255,208,110,.05)!important;
      z-index:125!important;
      text-align:center!important;
      pointer-events:none!important
    }

    #game .world-marker span{
      display:block!important;
      color:#ffd06e!important;
      font:900 7px/1 'DM Mono',monospace!important;
      letter-spacing:1.65px!important;
      text-transform:uppercase!important
    }

#game .world-marker b{
  display:block!important;
  margin-top:5px!important;
  color:#f4f7fa!important;
  font:950 10px/1.2 'DM Mono',monospace!important;
  letter-spacing:.5px!important;
  text-transform:uppercase!important;
  white-space:normal!important;
  overflow:visible!important;
  text-overflow:clip!important;
  overflow-wrap:anywhere!important;
  word-break:normal!important;
}
    #game .world-marker.is-runtime-typing b{
      border-right:1px solid #ffd06e!important;
      animation:
        relayRuntimeCaret .7s steps(1,end) infinite!important;
      padding-right:2px!important
    }

    @keyframes relayRuntimeCaret{
      0%,49%{
        border-color:#ffd06e
      }

      50%,100%{
        border-color:transparent
      }
    }

      #game .world-marker.is-runtime-typing{
  animation:
    relayMissionBoot .32s ease-out,
    relayMissionGlow 1.2s ease-in-out infinite!important;

  transform:translateX(-50%) scale(1)!important;

  will-change:
    transform,
    opacity,
    filter;
}

    #game .world-marker.is-runtime-typing b{
      text-shadow:
        0 0 6px rgba(255,208,110,.18),
        0 0 14px rgba(255,208,110,.08)!important;
    }

    @keyframes relayMissionBoot{
      0%{
        opacity:.35;
        filter:brightness(.75);
        transform:translateX(-50%) scale(.985);
      }

      60%{
        opacity:1;
        filter:brightness(1.22);
        transform:translateX(-50%) scale(1.012);
      }

      100%{
        opacity:1;
        filter:brightness(1);
        transform:translateX(-50%) scale(1);
      }
    }

    @keyframes relayMissionGlow{
      0%,100%{
        box-shadow:
          0 14px 30px rgba(0,0,0,.26),
          0 0 25px rgba(255,208,110,.05),
          inset 0 0 0 rgba(255,208,110,0);
      }

      50%{
        box-shadow:
          0 14px 30px rgba(0,0,0,.26),
          0 0 34px rgba(255,208,110,.12),
          inset 0 0 18px rgba(255,208,110,.025);
      }
    }

        #game .world-marker.is-runtime-typing::after{
      content:"";
      position:absolute!important;
      left:0!important;
      top:0!important;
      width:100%!important;
      height:1px!important;
      background:linear-gradient(
        90deg,
        transparent,
        rgba(255,208,110,.65),
        transparent
      )!important;
      animation:relayMissionScan .9s linear infinite!important;
      pointer-events:none!important;
    }

@keyframes relayMissionScan{
  0%{
    opacity:0;
    transform:translateX(-100%);
  }

  25%{
    opacity:1;
  }

  100%{
    opacity:0;
    transform:translateX(100%);
  }
}

#game .world-marker.is-runtime-complete{
  animation:
    relayMissionComplete .55s ease-out!important;
  border-color:rgba(255,208,110,.75)!important;
  box-shadow:
    0 0 20px rgba(255,208,110,.18),
    0 0 50px rgba(255,208,110,.10),
    0 14px 30px rgba(0,0,0,.30)!important;
}

#game .world-marker.is-runtime-complete{
  will-change:
    transform,
    opacity,
    filter;
}

#game .world-marker.is-runtime-complete b{
  color:#ffe7a6!important;
  text-shadow:
    0 0 8px rgba(255,208,110,.28),
    0 0 18px rgba(255,208,110,.12)!important;
}

@keyframes relayMissionComplete{
  0%{
    transform:translateX(-50%) scale(1);
    filter:brightness(1);
  }

  35%{
    transform:translateX(-50%) scale(1.025);
    filter:brightness(1.3);
  }

  70%{
    transform:translateX(-50%) scale(.995);
    filter:brightness(1.08);
  }

  100%{
    transform:translateX(-50%) scale(1);
    filter:brightness(1);
  }
}

    #play .relay-gameplay-intel,
    #play .gameplay-intel-v9,
    #play [data-relay-mission-intel],
    #play .live-mission-intel,
    #play .mission-intelligence-overlay,
    #play [data-dynamic-crowd],
    #play [data-debug-hud],
    #play [data-relay-debug-hud],
    #play .relay-debug-hud,
    #play .gameplay-debug-hud,
    #play [class*="dynamic-crowd"],
    #play [id*="dynamic-crowd"]{
      display:none!important;
      visibility:hidden!important;
      opacity:0!important;
      pointer-events:none!important
    }

    #play .legacy-bottom-hud,
    #play .hud-bottom,
    #play .gameplay-bottom-hud,
    #play [data-bottom-hud]{
      display:none!important;
      visibility:hidden!important
    }

#game .relay-enemy-discovery{
  position:fixed!important;
  inset:0!important;

  display:flex!important;
  align-items:center!important;
  justify-content:center!important;

  padding:24px!important;
  box-sizing:border-box!important;

  background:
    radial-gradient(
      circle at 50% 45%,
      rgba(18,42,58,.24),
      rgba(1,4,9,.82) 58%,
      rgba(0,2,6,.94) 100%
    )!important;

  backdrop-filter:blur(10px) saturate(125%)!important;
  -webkit-backdrop-filter:blur(10px) saturate(125%)!important;

  z-index:9999!important;
}


#game .relay-enemy-card{
  position:relative!important;

  width:min(470px,calc(100vw - 40px))!important;
  min-height:300px!important;

  box-sizing:border-box!important;
  padding:26px 28px 24px!important;

  overflow:hidden!important;

  border:
    1px solid
    rgba(96,214,255,.34)!important;

  border-left:
    3px solid
    #38d9ff!important;

  border-radius:4px!important;

  background:
    linear-gradient(
      145deg,
      rgba(5,13,22,.985) 0%,
      rgba(7,18,30,.985) 48%,
      rgba(2,7,14,.995) 100%
    )!important;

  box-shadow:
    inset 0 1px 0
      rgba(255,255,255,.07),

    inset 0 0 45px
      rgba(56,189,248,.025),

    0 30px 80px
      rgba(0,0,0,.72),

    0 0 35px
      rgba(56,189,248,.10)!important;

  color:#eaf8ff!important;

  clip-path:
    polygon(
      0 0,
      calc(100% - 18px) 0,
      100% 18px,
      100% 100%,
      18px 100%,
      0 calc(100% - 18px)
    )!important;

  isolation:isolate!important;
}


/* TOP SCAN LINE */

#game .relay-enemy-card::before{
  content:""!important;

  position:absolute!important;

  top:0!important;
  left:0!important;
  right:0!important;

  height:2px!important;

  background:
    linear-gradient(
      90deg,
      transparent,
      rgba(56,189,248,.55),
      #8eeaff,
      rgba(56,189,248,.55),
      transparent
    )!important;

  box-shadow:
    0 0 10px
      rgba(56,189,248,.45)!important;

  pointer-events:none!important;
}


/* TECH GRID */

#game .relay-enemy-card::after{
  content:""!important;

  position:absolute!important;
  inset:0!important;

  background:
    linear-gradient(
      90deg,
      rgba(56,189,248,.035) 1px,
      transparent 1px
    ),
    linear-gradient(
      rgba(56,189,248,.035) 1px,
      transparent 1px
    )!important;

  background-size:
    22px 22px!important;

  opacity:.38!important;

  pointer-events:none!important;
  z-index:0!important;
}


/* CONTENT ABOVE GRID */

#game .relay-enemy-card > *{
  position:relative!important;
  z-index:2!important;
}


/* HEADER */

#game .relay-enemy-card .eyebrow{
  margin:0 0 10px!important;

  color:
    rgba(125,211,252,.78)!important;

  font:
    700 9px/1
    "Orbitron",
    sans-serif!important;

  letter-spacing:
    .24em!important;

  text-transform:uppercase!important;

  text-shadow:
    0 0 12px
      rgba(56,189,248,.22)!important;
}


/* ENEMY NAME */

#game .relay-enemy-card h2{
  margin:0 0 16px!important;

  color:#f4fbff!important;

  font:
    800 28px/1.08
    "Orbitron",
    sans-serif!important;

  letter-spacing:.055em!important;

  text-transform:uppercase!important;

  text-shadow:
    0 0 16px
      rgba(56,189,248,.12)!important;
}


/* LEVEL */

#game .relay-enemy-card .enemy-level{
  display:inline-flex!important;

  align-items:center!important;

  min-height:24px!important;

  box-sizing:border-box!important;

  padding:5px 9px!important;

  margin:0 0 20px!important;

  border:
    1px solid
    rgba(56,189,248,.32)!important;

  border-radius:2px!important;

  background:
    rgba(56,189,248,.045)!important;

  color:#7dd3fc!important;

  font:
    700 8px/1
    "Orbitron",
    sans-serif!important;

  letter-spacing:.14em!important;

  text-transform:uppercase!important;

  box-shadow:
    inset 0 0 12px
      rgba(56,189,248,.035)!important;
}


/* STAT LABELS */

#game .relay-enemy-card dl{
  display:grid!important;

  grid-template-columns:
    1fr 1fr!important;

  gap:1px!important;

  margin:0 0 22px!important;

  padding:1px!important;

  background:
    rgba(56,189,248,.10)!important;
}


#game .relay-enemy-card dt,
#game .relay-enemy-card dd{
  margin:0!important;

  padding:9px 11px!important;

  box-sizing:border-box!important;

  background:
    rgba(3,9,16,.94)!important;
}


#game .relay-enemy-card dt{
  color:
    rgba(160,184,198,.68)!important;

  font:
    600 7px/1
    "Orbitron",
    sans-serif!important;

  letter-spacing:.16em!important;

  text-transform:uppercase!important;
}


#game .relay-enemy-card dd{
  color:#eaf8ff!important;

  font:
    700 9px/1.2
    "Orbitron",
    sans-serif!important;

  letter-spacing:.08em!important;

  text-transform:uppercase!important;
}


/* CONTINUE */

#game .relay-enemy-card button{
  position:relative!important;

  width:100%!important;
  min-height:44px!important;

  box-sizing:border-box!important;

  border:
    1px solid
    rgba(56,189,248,.42)!important;

  border-radius:2px!important;

  background:
    linear-gradient(
      135deg,
      rgba(56,189,248,.11),
      rgba(56,189,248,.025)
    )!important;

  color:#dff8ff!important;

  font:
    700 9px/1
    "Orbitron",
    sans-serif!important;

  letter-spacing:.20em!important;

  text-transform:uppercase!important;

  cursor:pointer!important;

  box-shadow:
    inset 0 0 16px
      rgba(56,189,248,.025),

    0 0 18px
      rgba(56,189,248,.045)!important;

  transition:
    border-color .18s ease,
    background .18s ease,
    box-shadow .18s ease,
    transform .18s ease!important;
}


#game .relay-enemy-card button:hover,
#game .relay-enemy-card button:focus-visible{
  border-color:
    rgba(125,211,252,.85)!important;

  background:
    linear-gradient(
      135deg,
      rgba(56,189,248,.18),
      rgba(56,189,248,.055)
    )!important;

  box-shadow:
    0 0 24px
      rgba(56,189,248,.12),

    inset 0 0 18px
      rgba(56,189,248,.04)!important;

  outline:none!important;

  transform:translateY(-1px)!important;
}


#game .relay-enemy-card button:active{
  transform:translateY(0)!important;
}

    @media(max-width:760px){
      #intro .home-v3-side{
        gap:8px!important
      }

  #game .world-marker{
  top:calc(
    100px + env(safe-area-inset-top)
  )!important;

  width:min(
    230px,
    calc(
      100vw -
      24px -
      env(safe-area-inset-left) -
      env(safe-area-inset-right)
    )
  )!important;

  min-height:52px!important;
  height:auto!important;

  padding:
    7px
    9px
    7px
    9px!important;

  left:50%!important;
  max-width:calc(
    100vw -
    24px -
    env(safe-area-inset-left) -
    env(safe-area-inset-right)
  )!important;
}

      #game .world-marker span{
        font-size:6px!important
      }

    #game .world-marker b{
  font-size:8px!important;
  line-height:1.25!important;
  margin-top:4px!important;
  white-space:normal!important;
  overflow:visible!important;
  text-overflow:clip!important;
  overflow-wrap:anywhere!important
}

    #game .relay-enemy-card{
  width:min(390px,calc(100vw - 28px))!important;
  min-height:0!important;
  padding:20px 18px 18px!important;
}

#game .relay-enemy-card h2{
  font-size:21px!important;
  line-height:1.1!important;
}

#game .relay-enemy-card .eyebrow{
  font-size:7px!important;
  letter-spacing:.18em!important;
}

#game .relay-enemy-card dl{
  grid-template-columns:1fr!important;
}

#game .relay-enemy-card button{
  min-height:42px!important;
}
    }
        @media(prefers-reduced-motion:reduce){
      #game .world-marker.is-runtime-typing,
      #game .world-marker.is-runtime-typing::after,
      #game .world-marker.is-runtime-complete{
        animation:none!important;
      }

      #game .world-marker.is-runtime-typing b{
        text-shadow:none!important;
      }
    }
  `;

  document.head.appendChild(style);


  /*
   * Home ownership intentionally disabled.
   * relay-final-layout-v2.js is the sole Home owner.
   */
  function installHome() {
    return;
  }

 const hiddenLegacyNodes =
  new WeakSet();

function hideLegacy(scene) {
  const list =
    scene?.children?.list || [];

  for (const child of list) {
    /*
     * Hide legacy Phaser display objects.
     */
    const text =
      typeof child?.text === 'string'
        ? child.text.trim().toUpperCase()
        : '';

    if (
      /DYNAMIC\s+CROWD/.test(text) ||
      /^V10\b/.test(text) ||
      /^ALT\+Q\s*\/\s*W\s*\/\s*E/.test(text)
    ) {
      const node =
        child.parentContainer?.setVisible
          ? child.parentContainer
          : child;

      if (
        node &&
        !hiddenLegacyNodes.has(node)
      ) {
        node.setVisible?.(false);
        node.setAlpha?.(0);
        node.disableInteractive?.();

        hiddenLegacyNodes.add(node);
      }

      continue;
    }

    /*
     * Hide legacy container-based mission intel.
     */
    if (
      child?.type !== 'Container' ||
      !Array.isArray(child.list)
    ) {
      continue;
    }

    const texts =
      child.list
        .filter(
          n =>
            typeof n?.text === 'string'
        )
        .map(
          n =>
            n.text
              .trim()
              .toUpperCase()
        );

    if (
      texts.some(
        t =>
          t.includes(
            'LIVE MISSION INTEL'
          ) ||
          t.includes(
            'MISSION INTELLIGENCE'
          )
      )
    ) {
      if (
        !hiddenLegacyNodes.has(child)
      ) {
        child.setVisible?.(false);
        child.setAlpha?.(0);
        child.disableInteractive?.();

        hiddenLegacyNodes.add(child);
      }
    }
  }
}

/*
 * Runtime mission typing effect.
 */
function typeMission() {
  const TYPE_SPEED_MS = 90;

  const badge =
    q('#game .world-marker');

  const target =
    q('#worldGoal');

  const scene =
    window.__relayRunnerScene;

  if (
    !badge ||
    !target ||
    !gameplay()
  ) {
    return;
  }

  if (
    !badge.isConnected ||
    !target.isConnected
  ) {
    return;
  }

  /*
   * Read the canonical mission objective.
   */
  const missionState =
    scene?.__missionObjectiveState || null;

  const missionId =
    scene?.mission?.id ||
    scene?.sys?.settings?.data?.missionId ||
    scene?.registry?.get?.('missionId') ||
    scene?.registry?.get?.('activeMission')?.id ||
    missionState?.id ||
    '';

  const source =
    missionState?.objective?.title ||
    missionState?.title ||
    target.dataset.missionSource ||
    target.textContent?.trim() ||
    '';

  const current =
    String(source)
      .trim()
      .toUpperCase();

  if (!current) {
    return;
  }

  const previousMissionId =
    badge.dataset.runtimeMissionId || '';

  const previousSource =
    badge.dataset.runtimeSource || '';

  const previousTyped =
    badge.dataset.runtimeTyped || '';

  /*
   * Same mission already finished.
   * Do not restart the typewriter.
   */
  if (
    previousMissionId === String(missionId) &&
    previousSource === current &&
    previousTyped === current
  ) {
    target.textContent = current;

    badge.classList.remove(
      'is-runtime-typing'
    );

    return;
  }

  /*
   * A typewriter is already running.
   * Never restart it from the 180ms runtime poll.
   */
  if (
    badge.__runtimeTypeTimer
  ) {
    return;
  }

  /*
   * Store current mission before typing starts.
   */
  badge.dataset.runtimeMissionId =
    String(missionId);

  badge.dataset.runtimeSource =
    current;

  badge.dataset.runtimeTyped =
    '';

  target.dataset.missionSource =
    current;

  badge.classList.remove(
    'is-runtime-complete'
  );

  badge.classList.add(
    'is-runtime-typing'
  );

  target.textContent = '';

  let i = 0;

  badge.__runtimeTypeTimer =
    window.setInterval(
      () => {
        if (
          !gameplay() ||
          !badge.isConnected ||
          !target.isConnected
        ) {
          clearInterval(
            badge.__runtimeTypeTimer
          );

          badge.__runtimeTypeTimer = 0;

          badge.classList.remove(
            'is-runtime-typing'
          );

          return;
        }

        i += 1;

        target.textContent =
          current.slice(0, i);

        if (
          i >= current.length
        ) {
          clearInterval(
            badge.__runtimeTypeTimer
          );

          badge.__runtimeTypeTimer = 0;

          target.textContent =
            current;

          badge.dataset.runtimeTyped =
            current;

          badge.classList.remove(
            'is-runtime-typing'
          );

          badge.classList.add(
            'is-runtime-complete'
          );

          window.setTimeout(
            () => {
              badge.classList.remove(
                'is-runtime-complete'
              );
            },
            650
          );
        }
      },
      TYPE_SPEED_MS
    );
}


  /*
   * Optimized countdown.
   *
   * Previous implementation used requestAnimationFrame continuously,
   * even though the countdown display only changes once per second.
   *
   * This version uses a lightweight interval and only updates the DOM
   * when the displayed value actually changes.
   */
  function smoothCountdown() {
    const root =
      q('#relayGameplayIntroFinalV3');

    if (
      !root ||
      root.__runtimeCountdownV3
    ) {
      return;
    }

    root.__runtimeCountdownV3 = true;

    let active = false;
    let startAt = 0;
    let intervalId = 0;
    let timerEl = null;
    let lastValue = -1;

    const getTimer = () => {
      if (
        timerEl &&
        timerEl.isConnected
      ) {
        return timerEl;
      }

      timerEl =
        root.querySelector(
          '.map-briefing-timer b'
        );

      return timerEl;
    };

    const isOpen = () =>
      !root.hidden &&
      getComputedStyle(
        root
      ).display !== 'none';

    const stop = () => {
      active = false;

      clearInterval(
        intervalId
      );

      intervalId = 0;

      timerEl = null;
      lastValue = -1;
    };

    const render = () => {
      if (!active) {
        return;
      }

      const elapsed =
        performance.now() -
        startAt;

      const remainingMs =
        Math.max(
          0,
          10000 - elapsed
        );

      const value =
        Math.ceil(
          remainingMs / 1000
        );

      /*
       * Do not touch the DOM when the visible
       * number has not changed.
       */
      if (
        value === lastValue
      ) {
        return;
      }

      lastValue = value;

      const el = getTimer();

      if (el) {
        el.textContent =
          String(value);
      }

      if (
        remainingMs <= 0
      ) {
        stop();
      }
    };

    const start = () => {
      if (active) {
        return;
      }

      active = true;
      startAt =
        performance.now();

      lastValue = -1;

      getTimer();
      render();

      clearInterval(
        intervalId
      );

      /*
       * 100ms keeps the timer visually responsive
       * while avoiding a per-frame RAF loop.
       */
      intervalId =
        window.setInterval(
          render,
          100
        );
    };

const observer =
  new MutationObserver(
    () => {
      /*
       * The countdown root was replaced or removed.
       * Stop timers and disconnect this observer.
       */
      if (!root.isConnected) {
        stop();
        observer.disconnect();
        return;
      }

      if (isOpen()) {
        start();
      } else {
        stop();
      }
    }
  );

    observer.observe(
      root,
      {
        attributes: true,
        attributeFilter: [
          'hidden',
          'style',
          'class'
        ]
      }
    );

    if (isOpen()) {
      start();
    }
  }

/*
 * Adaptive music start.
 */
function startMusic() {
  if (window.__relayRuntimeMusicStarting) {
    return;
  }

  window.__relayRuntimeMusicStarting = true;

  let settings = {};

  try {
    settings =
      JSON.parse(
        localStorage.getItem(
          'relay-runner-state'
        ) || '{}'
      ) || {};
  } catch {
    window.__relayRuntimeMusicStarting = false;
    return;
  }

  if (
    settings.muted === true
  ) {
    window.__relayRuntimeMusicStarting = false;
    return;
  }

  const volume =
    Number.isFinite(
      Number(
        settings.musicVolume
      )
    )
      ? Math.max(
          0.05,
          Math.min(
            0.85,
            Number(
              settings.musicVolume
            )
          )
        )
      : 0.55;

  const music =
    window.relayAdaptiveMusic;

  if (!music) {
    window.__relayRuntimeMusicStarting = false;
    return;
  }

  try {
    music.setEnabled?.(true);

    music.setVolume?.(
      volume
    );

    Promise.resolve(
      music.unlock?.()
    )
      .then(
        ok => {
          if (
            ok !== false &&
            gameplay()
          ) {
            music.start?.();
          }
        }
      )
      .catch(
        () => {}
      )
      .finally(
        () => {
          window.__relayRuntimeMusicStarting =
            false;
        }
      );

  } catch {
    window.__relayRuntimeMusicStarting =
      false;
  }
}

/*
 * Audio gesture binding.
 */
function bindAudio() {
  let lastAudioGesture = 0;

  const handler = e => {
    if (
      e.type === 'keydown' &&
      e.repeat
    ) {
      return;
    }

    const now =
      performance.now();

    /*
     * Prevent pointerdown + touchstart
     * from triggering audio twice
     * for the same mobile gesture.
     */
    if (
      e.type !== 'keydown' &&
      now - lastAudioGesture < 450
    ) {
      return;
    }

    if (
      e.type !== 'keydown'
    ) {
      lastAudioGesture = now;
    }

    const t =
      e.target instanceof Element
        ? e.target
        : null;

    const relevant =
      t?.closest?.(
        '#start,' +
        '#continue,' +
        '#launchJob,' +
        '#again,' +
        '#nextMission,' +
        '#retry,' +
        '[data-mobile-action]'
      );

    if (
      relevant ||
      (
        e.type === 'keydown' &&
        (
          e.key === 'Enter' ||
          e.code === 'Space'
        )
      )
    ) {
      startMusic();
    }
  };

  document.addEventListener(
    'pointerdown',
    handler,
    {
      capture: true,
      passive: true
    }
  );

  document.addEventListener(
    'touchstart',
    handler,
    {
      capture: true,
      passive: true
    }
  );

  document.addEventListener(
    'keydown',
    handler,
    {
      capture: true,
      passive: true
    }
  );

  window.addEventListener(
    'relay:runner-scene-ready',
    () => {
      if (gameplay()) {
        startMusic();
      }
    },
    {
      passive: true
    }
  );
}


 function boot() {
  installHome();
  bindAudio();
  smoothCountdown();
  typeMission();

  window.setInterval(
    () => {
    const inGameplay =
  gameplay();

if (
  !inGameplay ||
  document.hidden
) {
  return;
}

const scene =
  window.__relayRunnerScene;

      if (!scene) {
        return;
      }

      hideLegacy(scene);
      typeMission();
    },
    180
  );
}

  boot();
})();
