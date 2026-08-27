export function patchSeasonalProgression(source) {
  const pattern = /function challengeProgress\(state, mission, signals, cleanRun, contractComplete, bossDefeated, elapsedMs\) \{[\s\S]*?\n\}\nexport function earnedAchievementIds/;
  const match = source.match(pattern);
  if (!match) return source;
  const current = match[0].slice(0, match[0].lastIndexOf('\nexport function earnedAchievementIds')) + '\n';
  if (!current.includes('mastery: 0')) return source;

  const replacement = `function challengeProgress(state, mission, signals, cleanRun, contractComplete, bossDefeated, elapsedMs) {
  const daily = state.daily?.date === today() ? state.daily : { date: today(), progress: {}, claimed: [] };
  const monthly = challengeState(state.monthly, monthKey());
  const weekly = challengeState(state.weekly, weekKey());
  const seasonal = challengeState(state.seasonal, seasonKey());
  const dockTimeComplete = mission.id === 'dead-drop' && elapsedMs <= 90000;
  const completedRoutes = [...new Set(state.completed || [])];
  const masteryCount = Object.values(state.mastery || {}).reduce((total, badges) => total + new Set(Array.isArray(badges) ? badges : []).size, 0);
  const nextCompletedRoutes = completedRoutes.includes(mission.id) ? completedRoutes : [...completedRoutes, mission.id];
  return {
    daily: { ...daily, progress: { ...daily.progress, signals: (daily.progress.signals || 0) + signals, contracts: (daily.progress.contracts || 0) + (contractComplete ? 1 : 0), clean: (daily.progress.clean || 0) + (cleanRun ? 1 : 0), dockTime: (daily.progress.dockTime || 0) + (dockTimeComplete ? 1 : 0) } },
    weekly: { ...weekly, progress: { ...weekly.progress, runs: (weekly.progress.runs || 0) + 1, signals: (weekly.progress.signals || 0) + signals, clean: (weekly.progress.clean || 0) + (cleanRun ? 1 : 0) } },
    monthly: { ...monthly, progress: { ...monthly.progress, runs: (monthly.progress.runs || 0) + 1, signals: (monthly.progress.signals || 0) + signals, bosses: (monthly.progress.bosses || 0) + (bossDefeated ? 1 : 0) } },
    seasonal: { ...seasonal, progress: { ...seasonal.progress, routes: nextCompletedRoutes.length, mastery: Math.max(seasonal.progress?.mastery || 0, masteryCount), bosses: (seasonal.progress?.bosses || 0) + (bossDefeated ? 1 : 0) } },
  };
}
`;
  return source.replace(current, replacement + 'export function earnedAchievementIds');
}
