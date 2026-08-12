const key = 'relay-runner-state';
const defaults = {
  signals: 0,
  xp: 0,
  level: 1,
  completed: [],
  muted: false,
  rain: true,
  streak: 0,
  longestStreak: 0,
  lastRunDate: null,
  lastStreakBonus: 0,
};

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function daysBetween(previous, current) {
  const [previousYear, previousMonth, previousDay] = previous.split('-').map(Number);
  const [currentYear, currentMonth, currentDay] = current.split('-').map(Number);
  return Math.round((Date.UTC(currentYear, currentMonth - 1, currentDay) - Date.UTC(previousYear, previousMonth - 1, previousDay)) / 86400000);
}

export function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    return { ...defaults, ...(saved && typeof saved === 'object' ? saved : {}) };
  } catch {
    return { ...defaults };
  }
}

export function saveState(state) {
  localStorage.setItem(key, JSON.stringify(state));
}

export function completeMission(state, mission, signals) {
  const runDate = today();
  const firstRunToday = state.lastRunDate !== runDate;
  const streak = firstRunToday ? (state.lastRunDate && daysBetween(state.lastRunDate, runDate) === 1 ? state.streak + 1 : 1) : state.streak;
  const streakBonus = firstRunToday ? Math.min(100, 25 + (streak - 1) * 10) : 0;
  const next = {
    ...state,
    signals: Math.max(state.signals, signals),
    xp: state.xp + mission.reward + streakBonus,
    streak,
    longestStreak: Math.max(state.longestStreak, streak),
    lastRunDate: firstRunToday ? runDate : state.lastRunDate,
    lastStreakBonus: streakBonus,
  };
  if (!next.completed.includes(mission.id)) next.completed = [...next.completed, mission.id];
  while (next.xp >= next.level * 250) next.level++;
  saveState(next);
  return next;
}
