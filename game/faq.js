import './relay-senior-polish-v1.js';

export const RELAY_FAQ = [
  ['How do I play?', 'Use A/D or the left/right side of the joystick to move, SPACE or JUMP to jump. On mobile, use the touch controls.'],
  ['How do I complete a mission?', 'Follow the mission objective, collect the required signals and reach the delivery beacon. When complete, use NEXT MISSION to continue.'],
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
  version: 'UPDATE 23 // CITY PULSE',
  title: 'CITY PULSE',
  items: [
    'The city now runs on timed environmental pulse windows during active missions.',
    'Three non-physical pulse gates create readable OPEN, WARNING and CLOSED phases without changing player physics.',
    'Passing an OPEN window produces FLOW SYNC; chaining all three produces PERFECT FLOW.',
    'Missing a window resets the flow streak but never blocks the route or damages the player.',
    'Pulse gates remain hidden during the tutorial and cinematic states and are cleaned up with the gameplay scene.',
    'The system is additive and leaves movement, missions, save/progression, Cargo, Signals, City Response and Collapse ownership unchanged.'
  ]
};
