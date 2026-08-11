const key = 'relay-runner-state';
const defaults = { signals: 0, xp: 0, level: 1, completed: [], muted: false, rain: true };

export function loadState() {
  return { ...defaults, ...JSON.parse(localStorage.getItem(key) || 'null') };
}

export function saveState(state) {
  localStorage.setItem(key, JSON.stringify(state));
}

export function completeMission(state, mission, signals) {
  const next = { ...state, signals: Math.max(state.signals, signals), xp: state.xp + mission.reward };
  if (!next.completed.includes(mission.id)) next.completed = [...next.completed, mission.id];
  while (next.xp >= next.level * 250) next.level++;
  saveState(next);
  return next;
}
