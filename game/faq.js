export const RELAY_FAQ = [
  ['How do I play?', 'Use A/D or the left/right side of the joystick to move, SPACE or JUMP to jump. On mobile, use the touch controls.'],
  ['How do I complete a mission?', 'Follow the mission objective, collect the required Signals, reach the Relay Tower and climb it to secure the relay. The tower hands completion to the existing mission runtime.'],
  ['How do I move to the next mission?', 'After successfully completing a mission, press NEXT MISSION. The game loads the next level.'],
  ['What do SWORD, DASH and BUILD do?', 'SWORD is for combat, DASH helps you avoid hazards quickly, and BUILD activates available construction abilities.'],
  ['What is City Pulse?', 'City Pulse adds timed environmental windows to active missions. Read the OPEN rhythm and pass through the pulse gate for FLOW SYNC; missing a window has no movement or mission penalty.'],
  ['Can I play on a phone?', 'Yes. The game has touch controls and landscape mode is recommended for the clearest view.'],
  ['Why is there no sound?', 'Mobile browsers may block autoplay audio. Tap the screen once to unlock audio, and check your device volume and mute settings.'],
  ['Is my progress saved?', 'Mission progress and game data use the existing save system. Avoid clearing browser data if you want to keep local progress.'],
  ['What is XP?', 'XP is experience earned from missions and activities that advances your courier rank.'],
  ['How do I pause the game?', 'Press the ☰ button in the upper-right HUD.'],
  ['Where can I see the latest changes?', 'Open the circular info button in the upper-right corner of the title screen.']
];

export const LATEST_UPDATE = {
  version: 'UPDATE 24 // GAMEPLAY MAX',
  title: 'GAMEPLAY MAX',
  items: [
    'Relay Tower is now the shared physical finish sequence for every mission instead of a passive delivery-beacon finish.',
    'Tower climbing uses the existing player movement, mobile jump input and RunnerScene.complete() as the single authoritative completion path.',
    'Mission-finish recovery and transition gating are active so completion, NEXT MISSION and retry cannot double-fire into overlapping scene transitions.',
    'Cargo Integrity, Cargo visibility and Cargo polish are no longer loaded into gameplay. Cargo progress is removed from the gameplay loop.',
    'The existing gameplay stack remains additive: encounters, adaptive modifiers, dynamic world reactions, City Pulse, Collapse, signal routes, movement feel, audio, death recovery and performance governors stay in their existing ownership layers.',
    'The goal is a complete game loop: run → movement/combat → route decisions → dynamic encounters → Relay Tower → climb → secure relay → results → next level.',
    'No new parallel completion, save or movement system was introduced. Existing authoritative systems remain the source of truth.'
  ]
};