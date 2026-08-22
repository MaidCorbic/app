import { missions } from './missions.js';

// Physical onboarding route for the first mission. This mutates only the first
// mission definition before RunnerScene is started; the normal campaign route,
// scene ownership and mission completion logic remain unchanged.
const mission = missions.find(item => item.id === 'first-delivery');
if (mission && !mission.__tutorialMapV1) {
  mission.__tutorialMapV1 = true;
  mission.tutorialHandoffX = 1840;
  mission.tutorial = true;
  mission.description = 'Learn the route, then enter the live Old Quarter delivery.';
  mission.objective = 'Complete orientation and reach the live delivery route.';
  mission.platforms = [
    [0, 610, 560, 110],
    [760, 610, 430, 110],
    [1260, 610, 620, 110],
    [1980, 570, 720, 150],
    [2780, 610, 1320, 110],
    [390, 500, 150, 20, 'roof'],
    [900, 470, 150, 20, 'roof'],
    [1510, 455, 180, 20, 'roof'],
    [2140, 405, 180, 20, 'roof'],
    [2440, 350, 170, 20, 'roof'],
    [3050, 470, 180, 20, 'roof'],
  ];
  mission.obstacles = [[1450, 546], [3520, 546]];
  mission.checkpoints = [[1820, 520], [2780, 520]];
  mission.secrets = [[990, 390], [2470, 290]];
  mission.signals = [
    [300, 478], [455, 478],
    [850, 478], [1010, 438],
    [1320, 570], [1500, 423], [1680, 423],
    [1900, 538], [2140, 373], [2330, 373],
    [2580, 538], [2960, 458], [3180, 538], [3820, 570],
  ];
  mission.guides = [
    { x: 90, y: 520, text: 'ORIENTATION · MOVE RIGHT' },
    { x: 455, y: 455, text: 'STEP 01 · A / D' },
    { x: 650, y: 520, text: 'STEP 02 · JUMP THE GAP' },
    { x: 1430, y: 470, text: 'STEP 03 · DASH THROUGH THE BARRIER' },
    { x: 1740, y: 520, text: 'TRAINING BEACON →' },
    { x: 2050, y: 500, text: 'LIVE ROUTE · THE CITY STARTS HERE' },
    { x: 3020, y: 500, text: 'FOLLOW THE GOLD SIGNALS →' },
    { x: 3650, y: 520, text: 'DELIVERY BEACON →' },
  ];
}
