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

  // Keep the tutorial physically continuous all the way to the real mission
  // goal. The previous tutorial override stopped its platform list at x=4100
  // even though the mission goal is x=6100, leaving the spring/boost section
  // with no safe landing route beyond it.
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

    // Sector two — continuous landing route after the spring/boost section.
    [4080, 610, 460, 110],
    [4680, 540, 260, 180],
    [5100, 610, 360, 110],
    [5610, 550, 560, 170],
    [4340, 425, 160, 20, 'roof'],
    [4760, 400, 175, 20, 'roof'],
    [5310, 410, 165, 20, 'roof'],
    [5740, 390, 180, 20, 'roof'],
    [6000, 500, 180, 20, 'roof'],

    // Final landing/runway so the player never reaches the mission goal over
    // empty space, including on portrait camera framing.
    [6100, 610, 520, 110],
  ];

  mission.obstacles = [
    [1450, 546], [3520, 546],
    [4420, 546], [4950, 576], [5530, 546], [6260, 546],
  ];

  mission.boostPads = [
    [4210, 588],
    [5160, 588],
  ];

  mission.checkpoints = [
    [1820, 520], [2780, 520],
    [4290, 520], [5380, 520],
  ];

  mission.secrets = [[990, 390], [2470, 290], [4760, 340], [5740, 330]];

  mission.signals = [
    [300, 478], [455, 478],
    [850, 478], [1010, 438],
    [1320, 570], [1500, 423], [1680, 423],
    [1900, 538], [2140, 373], [2330, 373],
    [2580, 538], [2960, 458], [3180, 538], [3820, 570],
    [4180, 520], [4360, 393], [4510, 520],
    [4750, 470], [4930, 500], [5180, 570],
    [5350, 378], [5500, 520], [5760, 470], [6000, 520],
  ];

  mission.guides = [
    { x: 90, y: 520, text: 'ORIENTATION · MOVE RIGHT' },
    { x: 455, y: 455, text: 'STEP 01 · A / D' },
    { x: 650, y: 520, text: 'STEP 02 · JUMP THE GAP' },
    { x: 1430, y: 470, text: 'STEP 03 · DASH THROUGH THE BARRIER' },
    { x: 1740, y: 520, text: 'TRAINING BEACON →' },
    { x: 2050, y: 500, text: 'LIVE ROUTE · THE CITY STARTS HERE' },
    { x: 3020, y: 500, text: 'FOLLOW THE GOLD SIGNALS →' },
    { x: 4050, y: 520, text: 'SPRING PAD · KEEP MOMENTUM →' },
    { x: 4710, y: 460, text: 'VERTICAL ROUTE · LAND ON THE DOCK' },
    { x: 5580, y: 500, text: 'RELAY SPIRE · FINAL PUSH →' },
    { x: 6030, y: 520, text: 'DELIVERY BEACON →' },
  ];

  mission.enemies = [
    { type: 'security', x: 4550, y: 430, min: 4420, max: 4680 },
    { type: 'guard', x: 5250, y: 470, min: 5120, max: 5420 },
    { type: 'security', x: 5790, y: 430, min: 5630, max: 5950 },
  ];

  mission.movingGates = [
    [4820, 480, 400, 550],
    [5480, 460, 390, 550],
    [5840, 480, 390, 550],
  ];
}
