export const modifiers = [
  { id: 'noDash', label: 'NO DASH', detail: 'Dash and Air Dash disabled', xp: 35, credits: 18 },
  { id: 'lowEnergy', label: 'LOW ENERGY', detail: 'Energy pool capped at 65', xp: 30, credits: 15 },
  { id: 'highSpeed', label: 'HIGH SPEED', detail: 'Base movement +12%', xp: 25, credits: 12 },
  { id: 'darkCity', label: 'DARK CITY', detail: 'Reduced route lighting', xp: 35, credits: 18 },
  { id: 'extraSignals', label: 'EXTRA SIGNALS', detail: 'More Signal score opportunities', xp: 25, credits: 12 },
  { id: 'noCheckpoints', label: 'NO CHECKPOINTS', detail: 'Respawn starts at route entry', xp: 50, credits: 25 },
];

export const dailyChallenges = [
  { id: 'signals', label: 'Collect 50 Signals', target: 50, xp: 80, credits: 35 },
  { id: 'contracts', label: 'Finish 3 Contracts', target: 3, xp: 100, credits: 50 },
  { id: 'clean', label: 'Complete a run without collision', target: 1, xp: 65, credits: 30 },
  { id: 'dockTime', label: 'Finish Mission 02 under 90 seconds', target: 1, xp: 75, credits: 35 },
];
