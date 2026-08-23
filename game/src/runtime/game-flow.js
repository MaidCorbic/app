export const GAME_FLOW = Object.freeze({
  HOME: 'home',
  BRIEFING: 'briefing',
  LOADING: 'loading',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETE: 'complete',
  RESULTS: 'results',
  GAME_OVER: 'game-over',
});

const TRANSITIONS = Object.freeze({
  [GAME_FLOW.HOME]: new Set([GAME_FLOW.BRIEFING]),
  [GAME_FLOW.BRIEFING]: new Set([GAME_FLOW.LOADING, GAME_FLOW.HOME]),
  [GAME_FLOW.LOADING]: new Set([GAME_FLOW.RUNNING, GAME_FLOW.HOME]),
  [GAME_FLOW.RUNNING]: new Set([GAME_FLOW.PAUSED, GAME_FLOW.COMPLETE, GAME_FLOW.GAME_OVER, GAME_FLOW.HOME]),
  [GAME_FLOW.PAUSED]: new Set([GAME_FLOW.RUNNING, GAME_FLOW.HOME]),
  [GAME_FLOW.COMPLETE]: new Set([GAME_FLOW.RESULTS, GAME_FLOW.HOME]),
  [GAME_FLOW.RESULTS]: new Set([GAME_FLOW.LOADING, GAME_FLOW.RUNNING, GAME_FLOW.HOME]),
  [GAME_FLOW.GAME_OVER]: new Set([GAME_FLOW.LOADING, GAME_FLOW.RUNNING, GAME_FLOW.HOME]),
});

export function createGameFlow(initial = GAME_FLOW.HOME) {
  let current = initial;
  let version = 0;
  const listeners = new Set();

  const emit = (from, to, meta = {}) => {
    const event = { from, to, version: ++version, meta: { ...meta } };
    listeners.forEach(listener => {
      try { listener(event); } catch (error) { console.error('[Relay] game flow listener failed', error); }
    });
    return event;
  };

  return {
    getState() { return current; },
    canTransition(next) { return next === current || Boolean(TRANSITIONS[current]?.has(next)); },
    transition(next, meta = {}) {
      if (!this.canTransition(next)) return false;
      if (next === current) return true;
      const previous = current;
      current = next;
      emit(previous, current, meta);
      return true;
    },
    subscribe(listener) {
      if (typeof listener !== 'function') return () => {};
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    reset(meta = {}) {
      const previous = current;
      current = GAME_FLOW.HOME;
      emit(previous, current, { ...meta, reset: true });
    },
  };
}

export const gameFlow = createGameFlow();

if (typeof window !== 'undefined') {
  window.__relayGameFlow = gameFlow;
}
