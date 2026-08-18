/* UPDATE 10 — Realtime Signal Event Feedback V2
   Presentation layer. It listens to the existing game event bus and does not own Signal state.
*/
(() => {
  const state = {
    combo: 0,
    hideTimer: 0,
    bound: false,
  };

  const getRoot = () => document.getElementById('signalEventFeedback');
  const getValue = () => document.getElementById('signalEventValue');
  const getCombo = () => document.getElementById('signalEventCombo');

  function showSignal(value, combo = 0) {
    const root = getRoot();
    if (!root) return;
    const valueEl = getValue();
    const comboEl = getCombo();
    if (valueEl) valueEl.textContent = `+${value} SIGNAL`;
    if (comboEl) comboEl.textContent = combo >= 4 ? `PERFECT RELAY ×${combo}` : combo > 1 ? `RELAY FLOW ×${combo}` : 'SIGNAL SECURED';
    root.classList.toggle('perfect', combo >= 4);
    root.classList.remove('pop', 'is-visible');
    void root.offsetWidth;
    root.classList.add('pop', 'is-visible');
    window.clearTimeout(state.hideTimer);
    state.hideTimer = window.setTimeout(() => root.classList.remove('is-visible'), combo >= 4 ? 1250 : 900);
  }

  function onSignalEvent(payload) {
    const value = Number(payload?.amount ?? payload?.value ?? 1) || 1;
    const combo = Number(payload?.combo ?? payload?.relayCombo ?? state.combo) || 0;
    state.combo = combo;
    showSignal(value, combo);
  }

  function bind() {
    if (state.bound) return;
    state.bound = true;
    const game = window.relayRunnerGame;
    if (game?.events?.on) {
      game.events.on('signal-collected', onSignalEvent);
      game.events.on('signalCollected', onSignalEvent);
    }
    document.addEventListener('relay:signal-collected', event => onSignalEvent(event.detail || {}));
    window.addEventListener('relay-signal-collected', event => onSignalEvent(event.detail || {}));
  }

  window.relaySignalEventFeedback = { show: showSignal, bind };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
})();
