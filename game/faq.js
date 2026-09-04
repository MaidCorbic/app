import { GAME_VERSION, UPDATE_CHANNEL } from './src/config/release.js';

export const RELAY_FAQ = [
  ['How do I play?', 'Use A/D or the left/right side of the joystick to move, SPACE or JUMP to jump. On mobile, use the touch controls.'],
  ['How do I complete a mission?', 'Follow the mission objective, collect the required signals and reach the delivery beacon. When complete, use NEXT MISSION to continue.'],
  ['How do I move to the next mission?', 'After successfully completing a mission, press NEXT MISSION. The game loads the next level.'],
  ['What do SWORD, DASH and BUILD do?', 'SWORD is for combat, DASH helps you avoid hazards quickly, and BUILD activates available construction abilities.'],
  ['Can I play on a phone?', 'Yes. The game has touch controls and landscape mode is recommended for the clearest view.'],
  ['Why is there no sound?', 'Mobile browsers may block autoplay audio. Tap the screen once to unlock audio, and check your device volume and mute settings.'],
  ['Is my progress saved?', 'Mission progress and game data use the existing save system. Avoid clearing browser data if you want to keep local progress.'],
  ['What is XP?', 'XP is experience earned from missions and activities that advances your courier rank.'],
  ['How do I pause the game?', 'Press the ☰ button in the upper-right HUD.'],
  ['Where can I see the latest changes?', 'Open the circular info button in the upper-right corner of the title screen.']
];

export const LATEST_UPDATE = {
  version: `${UPDATE_CHANNEL} // v${GAME_VERSION}`,
  title: 'ENEMY AWARENESS',
  items: [
    'Enemy AI now uses one movement controller for smoother, frame-rate-safe movement.',
    'Enemies recognize platform position and only chase when the route is physically reachable.',
    'Enemy awareness and combat difficulty now scale progressively across all seven missions.',
    'Platform combat, ranged attacks and enemy abilities remain active without forcing enemies through level geometry.',
    'Egg Hazard now uses a ballistic arc with target prediction and rotation that follows its real flight direction.',
    'Home briefing, FAQ and the latest update remain available directly from the title screen.'
  ]
};
