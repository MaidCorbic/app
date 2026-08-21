/* PLAYER FEEDBACK V1
 * Presentation-only feedback layer. Uses the existing Phaser event bus and DOM.
 * No player physics, mission state, progression or save-state ownership.
 */
(() => {
  'use strict';
  const state = { root: null, game: null, bound: false, timers: new Set(), last: new Map() };
  const reduced = () => document.body.classList.contains('reduced-motion') || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const root = () => {
    if (state.root?.isConnected) return state.root;
    const host = document.querySelector('#phaser-game') || document.querySelector('#game') || document.body;
    const el = document.createElement('div');
    el.id = 'playerFeedbackLayer';
    el.className = 'player-feedback-layer';
    el.setAttribute('aria-hidden', 'true');
    host.appendChild(el); state.root = el; return el;
  };
  const pulse = (kind, text, ttl = 650) => {
    const now = performance.now(); const previous = state.last.get(kind) || 0;
    if (now - previous < 180) return; state.last.set(kind, now);
    const host = root(); if (!host) return;
    const node = document.createElement('div'); node.className = `player-feedback player-feedback-${kind}`;
    node.innerHTML = `<span class="player-feedback-mark"></span><b>${text}</b>`;
    host.appendChild(node);
    requestAnimationFrame(() => node.classList.add('is-active'));
    const timer = window.setTimeout(() => { node.classList.remove('is-active'); window.setTimeout(() => node.remove(), reduced() ? 0 : 220); state.timers.delete(timer); }, ttl);
    state.timers.add(timer);
  };
  const screen = (kind) => {
    if (reduced()) return;
    document.documentElement.dataset.playerFeedback = kind;
    const timer = window.setTimeout(() => { if (document.documentElement.dataset.playerFeedback === kind) delete document.documentElement.dataset.playerFeedback; state.timers.delete(timer); }, kind === 'impact' ? 180 : 240);
    state.timers.add(timer);
  };
  function feedback(kind) {
    const map = {
      jump: ['movement','JUMP',650], wallJump:['movement','WALL JUMP',700], vault:['movement','VAULT',700], slide:['movement','SLIDE',600], ledgeGrab:['movement','LEDGE GRAB',700], dash:['dash','DASH',800], gadget:['gear','GEAR DEPLOYED',850],
      warning:['warning','WARNING',950], chase:['warning','PURSUIT',1050], hit:['impact','IMPACT',800], land:['land','LAND',500], signal:['signal','SIGNAL LINKED',900], complete:['complete','RELAY COMPLETE',1250], empty:['warning','NO CHARGE',700]
    };
    const item = map[kind]; if (!item) return; pulse(item[0], item[1], item[2]);
    if (kind === 'dash') screen('dash'); else if (kind === 'hit') screen('impact'); else if (kind === 'warning' || kind === 'chase') screen('warning'); else if (kind === 'complete') screen('complete');
  }
  function bindGame(game) {
    if (!game?.events?.on || state.game === game) return;
    state.game = game;
    game.events.on('feedback', feedback);
    game.events.on('combo', value => { if (Number(value) >= 2) pulse('combo', `COMBO ×${value}`, 700); });
    game.events.on('checkpoint', () => pulse('checkpoint','CHECKPOINT',850));
    game.events.on('energy', value => { if (Number(value) <= 20) pulse('warning',`ENERGY ${Math.max(0,Math.round(Number(value)))}%`,900); });
    game.events.on('health', value => { if (Number(value) <= 1) { pulse('impact','CRITICAL HP',950); screen('impact'); } });
    game.events.on('game-over', () => pulse('warning','RUN INTERRUPTED',1200));
    game.events.on('complete', () => pulse('complete','RELAY COMPLETE',1250));
  }
  function discover() {
    bindGame(window.relayRunnerGame);
    bindGame(window.__relayRunnerScene?.game);
    const runner = document.querySelector('#phaser-game canvas') ? window.__relayRunnerScene : null;
    bindGame(runner?.game);
  }
  function cleanup() {
    state.timers.forEach(clearTimeout); state.timers.clear(); delete document.documentElement.dataset.playerFeedback;
  }
  function init() {
    if (state.bound) return; state.bound = true; root(); discover();
    window.addEventListener('relay:runner-scene-ready', e => bindGame(e.detail?.scene?.game));
    const observer = new MutationObserver(discover); observer.observe(document.body,{childList:true,subtree:true});
    window.addEventListener('blur',cleanup); document.addEventListener('visibilitychange',()=>{if(document.hidden)cleanup();});
  }
  window.relayPlayerFeedback = { bindGame, feedback, cleanup };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();