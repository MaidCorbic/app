/* UPDATE 10 — Gameplay Event HUD V2
   Presentation-only telemetry. No gameplay, Signal, combo, save or progression ownership.
*/
(() => {
  const state = { root: null, hideTimer: 0, lastKey: '', lastAt: 0, bound: false };
  const reduced = () => document.body.classList.contains('reduced-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const text = selector => document.querySelector(selector)?.textContent?.trim() || '';

  function ensure() {
    if (state.root?.isConnected) return state.root;
    const hud = document.querySelector('.hud');
    const progress = document.querySelector('.hud-progress');
    if (!hud || !progress) return null;
    const root = document.createElement('section');
    root.id = 'gameplayEventHud';
    root.className = 'gameplay-event-hud';
    root.setAttribute('aria-live', 'polite');
    root.setAttribute('aria-atomic', 'true');
    root.innerHTML = '<div class="gameplay-event-card"><span class="gameplay-event-scan" aria-hidden="true"></span><div class="gameplay-event-icon" aria-hidden="true"></div><div class="gameplay-event-copy"><div class="gameplay-event-head"><small id="gameplayEventType">EVENT</small><b id="gameplayEventValue">LIVE</b></div><strong id="gameplayEventTitle">SYSTEM READY</strong><span id="gameplayEventDetail">GAMEPLAY TELEMETRY</span></div><span class="gameplay-event-line" aria-hidden="true"></span></div>';
    hud.insertBefore(root, progress.nextSibling);
    state.root = root;
    return root;
  }

  function classify(message, source) {
    const value = String(message || '').toUpperCase();
    if (!value) return null;
    if (source === 'toast') {
      if (value.startsWith('SIGNAL CAPTURED')) return null;
      if (value.includes('CHECKPOINT')) return ['CHECKPOINT', 'ROUTE SAVED', message, 'checkpoint'];
      if (value.includes('SECRET FOUND')) return ['DISCOVERY', 'SECRET FOUND', message, 'discovery'];
      if (value.includes('CHASE')) return ['THREAT', 'CHASE ACTIVE', message, 'danger'];
      if (value.includes('SECURITY') || value.includes('HOSTILE') || value.includes('ALERT')) return ['THREAT', 'HOSTILE ALERT', message, 'danger'];
      if (value.includes('HIT') || value.includes('HEALTH') || value.includes('COLLAPSED')) return ['DAMAGE', 'IMPACT DETECTED', message, 'danger'];
      if (value.includes('READY')) return ['SYSTEM', 'ABILITY READY', message, 'ready'];
      if (value.includes('ENERGY')) return ['SYSTEM', 'ENERGY EVENT', message, 'energy'];
      if (value.includes('GADGET') || value.includes('TURRET') || value.includes('SHIELD') || value.includes('KINETIC')) return ['EQUIPMENT', 'GEAR DEPLOYED', message, 'gear'];
      if (value.includes('PLASMA') || value.includes('SWORD') || value.includes('FIRE') || value.includes('BLASTER')) return ['COMBAT', 'WEAPON EVENT', message, 'combat'];
      if (value.includes('SECTOR')) return ['WORLD', 'SECTOR REACHED', message, 'world'];
      if (value.includes('COMPLETE') || value.includes('LINKED')) return ['MISSION', 'RELAY LINKED', message, 'complete'];
      if (value.includes('LOST') || value.includes('FAILED')) return ['MISSION', 'ROUTE INTERRUPTED', message, 'danger'];
      return ['EVENT', 'GAMEPLAY EVENT', message, 'event'];
    }
    if (source === 'detection' && value !== 'STEALTH · CLEAR') return ['THREAT', value, 'Detection state changed', 'danger'];
    if (source === 'combo' && value !== 'READY' && value !== '0') return ['COMBAT', 'COMBO FLOW', value, 'combat'];
    if (source === 'route' && (value.includes('CHECKPOINT') || value.includes('CHASE'))) return ['ROUTE', value, 'Route state changed', value.includes('CHASE') ? 'danger' : 'checkpoint'];
    return null;
  }

  function show(event) {
    const root = ensure();
    if (!root || !event) return;
    const now = performance.now();
    const key = `${event[0]}|${event[1]}|${event[2]}`;
    if (key === state.lastKey && now - state.lastAt < 280) return;
    state.lastKey = key; state.lastAt = now;
    root.dataset.type = event[3] || 'event';
    root.querySelector('#gameplayEventType').textContent = event[0];
    root.querySelector('#gameplayEventTitle').textContent = event[1];
    root.querySelector('#gameplayEventDetail').textContent = event[2];
    root.querySelector('#gameplayEventValue').textContent = event[3] === 'danger' ? 'WARNING' : event[3] === 'complete' ? 'SECURED' : 'LIVE';
    root.classList.remove('is-visible', 'is-pop');
    if (!reduced()) void root.offsetWidth;
    root.classList.add('is-visible');
    if (!reduced()) root.classList.add('is-pop');
    clearTimeout(state.hideTimer);
    state.hideTimer = setTimeout(() => root.classList.remove('is-visible'), event[3] === 'danger' ? 1500 : 1050);
  }

  function observe(selector, source) {
    const node = document.querySelector(selector);
    if (!node) return;
    let previous = node.textContent.trim();
    const observer = new MutationObserver(() => {
      const next = node.textContent.trim();
      if (!next || next === previous) return;
      previous = next;
      const event = classify(next, source);
      if (event) show(event);
    });
    observer.observe(node, { childList: true, characterData: true, subtree: true });
  }

  function bind() {
    if (state.bound) return;
    state.bound = true;
    ensure();
    observe('#toast', 'toast');
    observe('#detectionStatus', 'detection');
    observe('#comboValue', 'combo');
    observe('#routeIntel', 'route');
    const terminalObserver = new MutationObserver(() => {
      const finish = document.querySelector('#finish');
      const over = document.querySelector('#gameOver');
      if (finish && !finish.classList.contains('hidden')) show(['MISSION', 'DELIVERY COMPLETE', 'RELAY LINKED · RESULTS READY', 'complete']);
      else if (over && !over.classList.contains('hidden')) show(['MISSION', 'RUN INTERRUPTED', text('#failLine') || 'Checkpoint recovery required', 'danger']);
    });
    terminalObserver.observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true });
    window.addEventListener('resize', ensure, { passive: true });
    window.addEventListener('orientationchange', ensure, { passive: true });
  }

  window.relayGameplayEventHud = { show, bind };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
})();