export const contracts = [
  { id: 'old-quarter-delivery', type: 'DELIVERY', missionId: 'first-delivery', label: 'Complete First Delivery', xp: 40, credits: 20 },
  { id: 'dock-timed', type: 'TIMED', missionId: 'dead-drop', label: 'Finish Dead Drop under 70 seconds', time: 70000, xp: 70, credits: 35 },
  { id: 'grid-collection', type: 'COLLECTION', missionId: 'blackout', label: 'Capture 12 Signals in Blackout', signals: 12, xp: 65, credits: 30 },
  { id: 'spine-no-hit', type: 'NO-HIT', missionId: 'pursuit', label: 'Complete Pursuit without a hit', xp: 90, credits: 45 },
  { id: 'grid-stealth', type: 'STEALTH', missionId: 'blackout', label: 'Complete Blackout without an alarm', xp: 85, credits: 45 },
  { id: 'storm-chase', type: 'CHASE', missionId: 'signal-storm', label: 'Escape every Storm chase sector', xp: 110, credits: 60 },
];
