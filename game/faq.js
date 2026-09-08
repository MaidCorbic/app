/* =========================================================
   RELAY RUNNER
   FAQ + LATEST UPDATE CONTENT
   UI CONTENT ONLY
   ========================================================= */

export const RELAY_FAQ = [
  [
    'How do I play?',
    'Use A / D or the left and right side of the joystick to move. Use SPACE or JUMP to jump. On mobile, use the touch controls.'
  ],

  [
    'How do I complete a mission?',
    'Follow the active mission objective, collect the required signals and reach the delivery beacon. When the mission is complete, select NEXT MISSION.'
  ],

  [
    'How do I move to the next mission?',
    'After successfully completing the current mission, select NEXT MISSION. The game will load the next available mission.'
  ],

  [
    'What do SWORD, DASH and BUILD do?',
    'SWORD is your close-range combat ability. DASH gives you a fast movement burst for avoiding hazards and closing distance. BUILD activates available construction abilities.'
  ],

  [
    'Can I play on a phone?',
    'Yes. Relay Runner supports touch controls on mobile devices. Landscape orientation is recommended for the clearest gameplay view and full control layout.'
  ],

  [
    'Why is there no sound?',
    'Mobile browsers can block automatic audio playback. Tap the game once to unlock audio, then check your device volume, media volume and mute settings.'
  ],

  [
    'Is my progress saved?',
    'Mission progress and game data use the existing save system. Avoid clearing browser or site data if you want to keep your local progress.'
  ],

  [
    'What is XP?',
    'XP means experience points. You earn XP through missions and activities, helping advance your courier rank.'
  ],

  [
    'How do I pause the game?',
    'During gameplay, use the ☰ button in the HUD to open the Courier Terminal. From there you can resume the run, inspect missions and progress, or open settings.'
  ],

  [
    'Where can I see the latest changes?',
    'From the title screen, open the circular INFO button in the upper-right corner to view the latest gameplay update.'
  ]
];


/* =========================================================
   LATEST UPDATE
   ========================================================= */

export const LATEST_UPDATE = {
  version: 'LATEST UPDATE // GAMEPLAY',

  title: 'ENEMY AWARENESS',

  items: [
    'Enemy AI now uses a unified movement controller for smoother and more frame-rate-safe movement.',

    'Enemies now recognize platform positions and only pursue the player when the route is physically reachable.',

    'Enemy awareness and combat difficulty scale progressively across all seven missions.',

    'Platform combat, ranged attacks and enemy abilities remain active without forcing enemies through level geometry.',

    'Egg Hazard now uses a ballistic flight arc with target prediction and rotation that follows its actual flight direction.',

    'Home briefing, FAQ and the latest gameplay update remain accessible directly from the title screen.'
  ]
};
