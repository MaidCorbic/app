import { missions } from './missions.js';

// UPDATE 26 — stable first-delivery onboarding.
// Keep the authored first-delivery map as the source of truth. The previous
// tutorial override replaced platforms/obstacles wholesale, which could put
// the runtime on geometry different from the collision/render systems expect.
const mission = missions.find(item => item.id === 'first-delivery');
if (mission && !mission.__tutorialMapV1) {
  mission.__tutorialMapV1 = true;
  mission.tutorialHandoffX = 1840;
  mission.tutorial = true;
  mission.description = 'Learn the route, then enter the live Old Quarter delivery.';
  mission.objective = 'Complete orientation and reach the live delivery route.';

  // Preserve the authored collision geometry and its real barriers.
  mission.obstacles = Array.isArray(mission.obstacles) && mission.obstacles.length
    ? mission.obstacles.map(([x, y]) => [Number(x), Number(y)])
    : [[1210, 546], [2450, 506], [3570, 546]];

  // First Delivery does not need a boost/trampoline mechanic. Avoid entering
  // the unstable boost-pad path during onboarding.
  mission.boostPads = [];

  mission.checkpoints = [[1810, 520], [2690, 520]];
  mission.secrets = [[755, 445]];
  mission.signals = [
    [490, 478], [1090, 570], [1410, 570], [1535, 453],
    [1980, 538], [2140, 393], [2280, 538],
    [2960, 458], [3230, 378], [3820, 570],
  ];
  mission.guides = [
    { x: 95, y: 520, text: 'ORIENTATION · A / D TO MOVE' },
    { x: 430, y: 455, text: 'STEP 01 · SPACE TO JUMP' },
    { x: 820, y: 520, text: 'STEP 02 · JUMP THE GAP' },
    { x: 1120, y: 520, text: 'STEP 03 · VAULT THE BARRIER' },
    { x: 1740, y: 520, text: 'TRAINING BEACON →' },
    { x: 1880, y: 480, text: 'LIVE ROUTE · THE CITY STARTS HERE' },
    { x: 2050, y: 390, text: 'ROOFTOP LINE · FASTER' },
    { x: 3650, y: 520, text: 'DELIVERY BEACON →' },
  ];
}
