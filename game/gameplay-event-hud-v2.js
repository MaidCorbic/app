/* UPDATE 10 — Gameplay Event HUD V3
   Presentation-only telemetry. Reads the existing Phaser event bus and DOM state.
   Does not own Signal, score, combo, progression or save state.
*/
(() => {
  const state = { root: null, hideTimer: 0, lastKey: '', lastAt: 0, bound: false, observed: new WeakSet(), gameBound: false };
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
    root.querySelector('#gameplayEventType').textContent = type;
    root.querySelector('#gameplayEventTitle').textContent = title;
    root.querySelector('#gameplayEventDetail').textContent = detail;
    root.querySelector('#gameplayEventValue').textContent = kind === 'danger' ? 'WARNING' : kind === 'complete' ? 'SECURED' : kind === 'combat' ? 'COMBAT' : 'LIVE';
    root.classList.remove('is-visible', 'is-pop'); if (!reduced()) void root.offsetWidth; root.classList.add('is-visible'); if (!reduced()) root.classList.add('is-pop');
    clearTimeout(state.hideTimer); state.hideTimer = setTimeout(() => root.classList.remove('is-visible'), duration);
  }

  function feedback(kind) {
    const map = {
      warning: ['THREAT', 'ENVIRONMENT WARNING', 'Hostile activity detected', 'danger', 1450],
      chase: ['THREAT', 'PURSUIT ACTIVE', 'Interceptor pressure detected', 'danger', 1650],
      hit: ['DAMAGE', 'IMPACT DETECTED', 'Recovery sequence initiated', 'danger', 1450],
      jump: ['MOVEMENT', 'JUMP EXECUTED', 'Traversal action confirmed', 'movement', 800],
      wallJump: ['MOVEMENT', 'WALL JUMP', 'Traversal action confirmed', 'movement', 850],
      vault: ['MOVEMENT', 'VAULT', 'Traversal action confirmed', 'movement', 850],
      slide: ['MOVEMENT', 'SLIDE', 'Traversal action confirmed', 'movement', 800],
      dash: ['MOVEMENT', 'DASH', 'Burst movement executed', 'combat', 900],
      gadget: ['EQUIPMENT', 'GEAR DEPLOYED', 'Equipment action confirmed', 'gear', 950],
      complete: ['MISSION', 'DELIVERY COMPLETE', 'Relay linked · results ready', 'complete', 1900],
    };
    if (map[kind]) show(map[kind]);
  }

  function bindGame(game) {
    if (!game?.events?.on || state.gameBound) return;
    state.gameBound = true;
    game.events.on('feedback', feedback);
    game.events.on('checkpoint', (signals, secrets, lost) => show(['CHECKPOINT', 'ROUTE SAVED', `${signals} SIGNALS · ${secrets} SECRETS${lost ? ` · ${lost} LOST` : ''}`, 'checkpoint', 1250]));
    game.events.on('sector', data => show(['WORLD', `SECTOR ${data?.number || '?'}`, 'Relay Spire reached · route escalating', 'world', 1400]));
    game.events.on('deaths', (count, limit) => show(['DAMAGE', 'RECOVERY USED', `${count} / ${limit} RECOVERIES`, 'danger', 1350]));
    game.events.on('game-over', message => show(['MISSION', 'RUN INTERRUPTED', message || 'Recovery limit reached', 'danger', 1900]));
    game.events.on('energy', value => { if (Number(value) <= 20) show(['SYSTEM', 'LOW ENERGY', `${Math.round(Number(value))}% REMAINING`, 'danger', 1350]); });
    game.events.on('health', value => { if (Number(value) <= 1) show(['DAMAGE', 'CRITICAL HEALTH', `${Math.max(0, Number(value))} HP REMAINING`, 'danger', 1400]); });
    game.events.on('combo', (value, best) => { if (Number(value) >= 2) show(['COMBAT', `COMBO ×${value}`, best ? `BEST FLOW ×${best}` : 'Combat chain active', 'combat', 900]); });
    game.events.on('tutorial', message => show(['INTEL', 'NEW FIELD INSTRUCTION', message, 'world', 1700]));
    game.events.on('narration', message => { if (message) show(['RADIO', 'INCOMING TRANSMISSION', message, 'world', 1800]); });
  }

  function observeNode(node, source) {
    if (!node || state.observed.has(node)) return;
    state.observed.add(node); let previous = node.textContent.trim();
    const observer = new MutationObserver(() => {
      const next = node.textContent.trim(); if (!next || next === previous) return; previous = next;
      const value = next.toUpperCase();
      if (source === 'toast') {
        if (value.startsWith('SIGNAL CAPTURED')) return;
        if (value.includes('CHECKPOINT')) show(['CHECKPOINT', 'ROUTE SAVED', next, 'checkpoint', 1250]);
        else if (value.includes('SECRET FOUND')) show(['DISCOVERY', 'SECRET FOUND', next, 'discovery', 1250]);
        else if (value.includes('CHASE')) show(['THREAT', 'CHASE ACTIVE', next, 'danger', 1550]);
        else if (value.includes('SECURITY') || value.includes('HOSTILE') || value.includes('ALERT')) show(['THREAT', 'HOSTILE ALERT', next, 'danger', 1500]);
        else if (value.includes('READY')) show(['SYSTEM', 'ABILITY READY', next, 'ready', 950]);
        else if (value.includes('ENERGY')) show(['SYSTEM', 'ENERGY EVENT', next, 'energy', 950]);
        else if (value.includes('GADGET') || value.includes('TURRET') || value.includes('SHIELD') || value.includes('KINETIC')) show(['EQUIPMENT', 'GEAR DEPLOYED', next, 'gear', 1050]);
        else if (value.includes('SECTOR')) show(['WORLD', 'SECTOR REACHED', next, 'world', 1400]);
        else if (value.includes('COMPLETE') || value.includes('LINKED')) show(['MISSION', 'RELAY LINKED', next, 'complete', 1700]);
        else if (value.includes('LOST') || value.includes('FAILED')) show(['MISSION', 'ROUTE INTERRUPTED', next, 'danger', 1500]);
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
    if (state.bound) return; state.bound = true; ensure(); bindAvailable(); bindGame(window.relayRunnerGame);
    const domObserver = new MutationObserver(() => { bindAvailable(); bindGame(window.relayRunnerGame); ensure(); });
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