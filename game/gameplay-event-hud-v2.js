/* UPDATE 10 — Gameplay Event HUD V4
   Presentation-only telemetry. Reads the existing Phaser event bus and DOM state.
   Does not own Signal, score, combo, progression or save state.
*/
(() => {
  const state = { root: null, hideTimer: 0, lastKey: '', lastAt: 0, bound: false, observed: new WeakSet(), games: new WeakMap() };
  const reduced = () => document.body.classList.contains('reduced-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const text = selector => document.querySelector(selector)?.textContent?.trim() || '';

  function ensure() {
    if (state.root?.isConnected) return state.root;
    const hud = document.querySelector('.hud');
    if (!hud) return null;
    const root = document.createElement('section');
    root.id = 'gameplayEventHud'; root.className = 'gameplay-event-hud';
    root.setAttribute('aria-live', 'polite'); root.setAttribute('aria-atomic', 'true');
    root.innerHTML = '<div class="gameplay-event-bracket gameplay-event-bracket-left" aria-hidden="true"></div><div class="gameplay-event-bracket gameplay-event-bracket-right" aria-hidden="true"></div><div class="gameplay-event-card"><span class="gameplay-event-scan" aria-hidden="true"></span><span class="gameplay-event-grid" aria-hidden="true"></span><div class="gameplay-event-icon" aria-hidden="true"><i></i></div><div class="gameplay-event-copy"><div class="gameplay-event-head"><small id="gameplayEventType">EVENT</small><b id="gameplayEventValue">LIVE</b></div><strong id="gameplayEventTitle">SYSTEM READY</strong><span id="gameplayEventDetail">GAMEPLAY TELEMETRY</span></div><div class="gameplay-event-meter" aria-hidden="true"><i></i></div><span class="gameplay-event-line" aria-hidden="true"></span></div>';
    const progress = hud.querySelector('.hud-progress');
    if (progress?.nextSibling) hud.insertBefore(root, progress.nextSibling); else hud.appendChild(root);
    state.root = root; return root;
  }

  function show(event) {
    const root = ensure(); if (!root || !event) return;
    const now = performance.now(); const key = `${event[0]}|${event[1]}|${event[2]}`;
    if (key === state.lastKey && now - state.lastAt < 280) return;
    state.lastKey = key; state.lastAt = now;
    const [type, title, detail, kind = 'event', duration = kind === 'danger' ? 1500 : 1100] = event;
    root.dataset.type = kind;
    root.style.setProperty('--event-duration', `${duration}ms`);
    root.querySelector('#gameplayEventType').textContent = type;
    root.querySelector('#gameplayEventTitle').textContent = title;
    root.querySelector('#gameplayEventDetail').textContent = detail;
    root.querySelector('#gameplayEventValue').textContent = kind === 'danger' ? 'WARNING' : kind === 'complete' ? 'SECURED' : kind === 'combat' ? 'COMBAT' : 'LIVE';
    root.classList.remove('is-visible', 'is-pop'); if (!reduced()) void root.offsetWidth; root.classList.add('is-visible'); if (!reduced()) root.classList.add('is-pop');
    clearTimeout(state.hideTimer); state.hideTimer = setTimeout(() => root.classList.remove('is-visible'), duration);
  }

 function feedback(kind) {
  const map = {
    warning: [
      'THREAT',
      'ENVIRONMENT WARNING',
      'HOSTILE ACTIVITY DETECTED',
      'danger',
      1450
    ],

    chase: [
      'THREAT',
      'PURSUIT ACTIVE',
      'INTERCEPTOR PRESSURE DETECTED',
      'danger',
      1650
    ],

    hit: [
      'DAMAGE',
      'IMPACT DETECTED',
      'RECOVERY SEQUENCE INITIATED',
      'danger',
      1450
    ],

    jump: [
      'MOVEMENT',
      'JUMP',
      'TRAVERSAL ACTION CONFIRMED',
      'movement',
      700
    ],

    wallJump: [
      'MOVEMENT',
      'WALL JUMP',
      'TRAVERSAL ACTION CONFIRMED',
      'movement',
      750
    ],

    vault: [
      'MOVEMENT',
      'VAULT',
      'OBSTACLE CLEARED',
      'movement',
      750
    ],

    slide: [
      'MOVEMENT',
      'SLIDE',
      'LOW-PROFILE TRAVERSAL',
      'movement',
      700
    ],

    dash: [
      'MOVEMENT',
      'DASH',
      'BURST MOVEMENT EXECUTED',
      'combat',
      900
    ],

    gadget: [
      'EQUIPMENT',
      'GEAR DEPLOYED',
      'EQUIPMENT ACTION CONFIRMED',
      'gear',
      950
    ],

    complete: [
      'MISSION',
      'DELIVERY COMPLETE',
      'RELAY LINKED · RESULTS READY',
      'complete',
      1900
    ]
  };

  if (map[kind]) {
    show(map[kind]);
  }
}

  function bindGame(game) {
    if (!game?.events?.on || state.games.has(game)) return;

    const handlers = [
      ['feedback', feedback],
    ['checkpoint', (signals, secrets, lost) =>
  show([
    'CHECKPOINT',
    'CHECKPOINT SECURED',
    `${signals} SIGNALS · ${secrets} SECRETS${lost ? ` · ${lost} LOST` : ''}`,
    'checkpoint',
    1500
  ])
],
      ['sector', data =>
  show([
    'WORLD',
    `SECTOR ${data?.number || '?'}`,
    'NEW AREA REACHED · THREAT LEVEL ESCALATING',
    'world',
    1450
  ])
],
      ['deaths', (count, limit) => show(['DAMAGE', 'RECOVERY USED', `${count} / ${limit} RECOVERIES`, 'danger', 1350])],
      ['game-over', message => show(['MISSION', 'RUN INTERRUPTED', message || 'Recovery limit reached', 'danger', 1900])],
     ['energy', value => {
  if (Number(value) <= 20)
    show([
      'SYSTEM',
      'ENERGY CRITICAL',
      `${Math.max(0, Math.round(Number(value)))}% REMAINING`,
      'danger',
      1350
    ]);
}],
     ['health', value => {
  const hp = Number(value);

  if (hp <= 1) {
    show([
      'DAMAGE',
      'CRITICAL HEALTH',
      `${Math.max(0, hp)} HP REMAINING`,
      'danger',
      1450
    ]);
  }
}],
      ['combo', (value, best) => {
  const combo = Number(value);

  if (combo >= 2) {
    show([
      'COMBAT',
      `COMBO ×${combo}`,
      best
        ? `BEST FLOW ×${best}`
        : 'COMBAT CHAIN ACTIVE',
      'combat',
      combo >= 5 ? 1150 : 900
    ]);
  }
}],
      ['tutorial', message => show(['INTEL', 'NEW FIELD INSTRUCTION', message, 'world', 1700])],
      ['narration', message => { if (message) show(['RADIO', 'INCOMING TRANSMISSION', message, 'world', 1800]); }],
    ];

    for (const [name, handler] of handlers) game.events.on(name, handler);
    const binding = { handlers };
    state.games.set(game, binding);

    const scene = game.scene?.getScene?.('runner');
    scene?.events?.once?.('shutdown', () => {
      for (const [name, handler] of binding.handlers) game.events.off(name, handler);
      state.games.delete(game);
      state.lastKey = '';
      state.lastAt = 0;
    });
  }

  function observeNode(node, source) {
    if (!node || state.observed.has(node)) return;
    state.observed.add(node); let previous = node.textContent.trim();
    const observer = new MutationObserver(() => { const next = node.textContent.trim(); if (!next || next === previous) return; previous = next;
      const value = next.toUpperCase();
      if (source === 'toast') {
        if (value.startsWith('SIGNAL CAPTURED')) return;
        if (value.includes('CHECKPOINT')) show(['CHECKPOINT', 'ROUTE SAVED', next, 'checkpoint', 1250]);
        else if (value.includes('SECRET FOUND')) show(['DISCOVERY', 'SECRET FOUND', next, 'discovery', 1250]);
       else if (value.includes('CHASE'))
  show([
    'THREAT',
    'PURSUIT ACTIVE',
    next,
    'danger',
    1650
  ]);
       else if (
  value.includes('SECURITY') ||
  value.includes('HOSTILE') ||
  value.includes('ALERT')
)
  show([
    'THREAT',
    'HOSTILE CONTACT',
    next,
    'danger',
    1550
  ]);
        else if (value.includes('READY')) show(['SYSTEM', 'ABILITY READY', next, 'ready', 950]);
        else if (value.includes('ENERGY')) show(['SYSTEM', 'ENERGY EVENT', next, 'energy', 950]);
        else if (value.includes('GADGET') || value.includes('TURRET') || value.includes('SHIELD') || value.includes('KINETIC')) show(['EQUIPMENT', 'GEAR DEPLOYED', next, 'gear', 1050]);
        else if (value.includes('SECTOR')) show(['WORLD', 'SECTOR REACHED', next, 'world', 1400]);
        else if (
  value.includes('COMPLETE') ||
  value.includes('LINKED')
)
  show([
    'MISSION',
    'MISSION COMPLETE',
    next,
    'complete',
    1900
  ]);
        else if (
  value.includes('LOST') ||
  value.includes('FAILED')
)
  show([
    'MISSION',
    'RUN INTERRUPTED',
    next,
    'danger',
    1600
  ]);
      }
    });
    observer.observe(node, { childList: true, characterData: true, subtree: true });
  }

  function bindAvailable() {
    observeNode(document.querySelector('#toast'), 'toast');
    observeNode(document.querySelector('#detectionStatus'), 'detection');
    observeNode(document.querySelector('#comboValue'), 'combo');
    observeNode(document.querySelector('#routeIntel'), 'route');
  }

  function bind() {
    if (state.bound) return; state.bound = true; ensure(); bindAvailable(); bindGame(window.relayRunnerGame || window.__relayRunnerScene?.game);
    window.addEventListener('relay:runner-scene-ready', event => bindGame(event.detail?.scene?.game), { passive: true });
    const domObserver = new MutationObserver(() => { bindAvailable(); bindGame(window.relayRunnerGame || window.__relayRunnerScene?.game); ensure(); });
    domObserver.observe(document.body, { childList: true, subtree: true });
    const terminalObserver = new MutationObserver(() => {
      const finish = document.querySelector('#finish'); const over = document.querySelector('#gameOver');
      if (finish && !finish.classList.contains('hidden')) show(['MISSION', 'DELIVERY COMPLETE', 'RELAY LINKED · RESULTS READY', 'complete', 1900]);
      else if (over && !over.classList.contains('hidden')) show(['MISSION', 'RUN INTERRUPTED', text('#failLine') || 'Checkpoint recovery required', 'danger', 1900]);
    });
    terminalObserver.observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true });
    window.addEventListener('resize', ensure, { passive: true }); window.addEventListener('orientationchange', ensure, { passive: true });
  }

  window.relayGameplayEventHud = { show, bind };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true }); else bind();
})();
