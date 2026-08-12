export const upgrades = [
  { id: 'stride', category: 'MOBILITY', label: 'Stride Tuning', detail: '+4% ground speed', cost: 45 },
  { id: 'airControl', category: 'MOBILITY', label: 'Air Control', detail: '+12% air steering', cost: 60 },
  { id: 'wallEfficiency', category: 'MOBILITY', label: 'Wall Efficiency', detail: '-20% wall-run drain', cost: 75 },
  { id: 'dashDrive', category: 'MOBILITY', label: 'Dash Drive', detail: '+8% dash speed', cost: 90 },
  { id: 'energyCore', category: 'ENERGY', label: 'Energy Core', detail: '+15 max Energy', cost: 60 },
  { id: 'recharge', category: 'ENERGY', label: 'Recharge Loop', detail: '+20% Energy regeneration', cost: 70 },
  { id: 'efficiency', category: 'ENERGY', label: 'Efficient Routing', detail: '-10% ability cost', cost: 85 },
  { id: 'signalSense', category: 'SIGNAL', label: 'Signal Sense', detail: 'Scanner range +35%', cost: 50 },
  { id: 'signalXp', category: 'SIGNAL', label: 'Signal Dividend', detail: '+1 XP per Signal', cost: 70 },
  { id: 'recovery', category: 'SURVIVAL', label: 'Soft Landing', detail: '+20 Energy on checkpoint recovery', cost: 65 },
  { id: 'escape', category: 'SURVIVAL', label: 'Escape Window', detail: 'Alarm lasts 15% less', cost: 80 },
];

export const gadgets = [
  { id: 'scanner', label: 'SCANNER', detail: 'Reveal nearby Signals and route markers', cooldown: 5500 },
  { id: 'emp', label: 'EMP', detail: 'Disable drones and patrol detection briefly', cooldown: 9000 },
  { id: 'decoy', label: 'DECOY', detail: 'Break patrol attention briefly', cooldown: 8000 },
  { id: 'booster', label: 'SIGNAL BOOSTER', detail: 'Double Signal score for 8 seconds', cooldown: 12000 },
  { id: 'cell', label: 'ENERGY CELL', detail: 'Restore 35 Energy', cooldown: 10000 },
];

export const buildItems = [
  { id: 'shield', label: 'RELAY SHIELD', detail: 'Build a temporary cover wall ahead of the courier', cost: 80, cooldown: 9000 },
  { id: 'kinetic-ball', label: 'KINETIC BALL', detail: 'Launch a ball that destroys barriers, gates and sci-fi threats', cost: 110, cooldown: 7000 },
  { id: 'turret', label: 'ARC TURRET', detail: 'Build an auto-turret that clears nearby threats', cost: 145, cooldown: 12000 },
  { id: 'spring-pad', label: 'SPRING PAD', detail: 'Build a jump pad for vertical escapes', cost: 95, cooldown: 8000 },
];

export const weapons = [
  { id: 'sidearm', label: 'SIDEARM', detail: 'Reliable single plasma bolt', cost: 0 },
  { id: 'pulse-rifle', label: 'PULSE RIFLE', detail: 'Heavy plasma bolts deal double damage', cost: 160 },
  { id: 'scattergun', label: 'SCATTERGUN', detail: 'Three-shot spread for close hostile groups', cost: 220 },
];
