export const RELAY_FAQ = [
  ['How do I play?', 'Use A/D or the left/right side of the joystick to move, SPACE or JUMP to jump. On mobile, use the touch controls.'],
  ['How do I complete a mission?', 'Follow the objective, collect Signals and optional Relay Caches, then reach the Relay Tower and climb it to secure the relay. The tower hands completion to the existing mission runtime.'],
  ['What are Relay Caches?', 'Optional high-value caches placed on the route. Collecting one restores a little energy/health and gives a short Flow speed burst. Two caches can appear in each mission.'],
  ['What is Flow Chain?', 'Collecting Signals in a clean rhythm can trigger a short speed charge. It rewards momentum without changing the core movement physics permanently.'],
  ['What happens near the Relay Tower?', 'The final approach can trigger a brief Overdrive burst. Reach the tower, climb the ladder and secure the relay to finish the mission.'],
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
  version: 'UPDATE 25 // GAMEPLAY MAX+',
  title: 'GAMEPLAY MAX+',
  items: [
    'NEW · Relay Caches: two optional route caches per mission can restore energy/health and trigger a short Flow speed burst.',
    'NEW · Signal Flow Chain: clean Signal collection can build a short momentum charge without replacing the core movement system.',
    'NEW · Checkpoint Recovery: securing a checkpoint restores a small energy reserve so long routes have a controlled recovery rhythm.',
    'NEW · Tower Approach Overdrive: the final approach to the Relay Tower gets a brief speed window that makes the finale feel earned.',
    'NEW · Gameplay Max score bonuses are carried into the existing mission result/save pipeline; no parallel progression system was introduced.',
    'REMOVED · Cargo Integrity, Cargo visibility and Cargo progress remain completely outside the gameplay bootstrap.',
    'SAFE DESIGN · All additions are event-driven or attached to the existing Phaser scene update lifecycle; no new requestAnimationFrame loop is introduced.',
    'SAFE DESIGN · Runner movement, combat, mission completion, save state and tower completion remain owned by their existing authoritative systems.'
  ]
};
