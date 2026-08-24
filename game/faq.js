export const RELAY_FAQ = [
  ['How do I play?', 'Use A/D or the left/right side of the joystick to move, SPACE or JUMP to jump. On mobile, use the touch controls.'],
  ['How do I complete a mission?', 'Follow the objective, use the route mechanics, reach the Relay Tower and climb it to secure the relay. The existing mission runtime remains the single completion authority.'],
  ['What are Relay Caches?', 'Optional high-value route caches can restore a little energy/health and trigger a short Flow speed burst.'],
  ['What is Flow Chain?', 'Clean Signal and movement rhythms can build momentum and trigger a short speed charge. It rewards skill without replacing the core movement physics.'],
  ['What are Mission Challenges?', 'Each run can naturally build goals such as Signal Hunt, No Damage, Checkpoint Master and Speed Run. They are replay goals, not required gates.'],
  ['What happens near the Relay Tower?', 'The final approach can trigger a brief Overdrive and final-pressure sequence. Reach the tower, climb it and secure the relay to finish the mission.'],
  ['How do I move to the next mission?', 'After successfully completing a mission, press NEXT MISSION. The existing campaign flow loads the next level.'],
  ['What do SWORD, DASH and BUILD do?', 'SWORD is for combat, DASH helps you avoid hazards quickly, and BUILD activates available construction abilities.'],
  ['What is City Pulse?', 'City Pulse adds timed environmental windows to active missions. Read the OPEN rhythm and pass through the pulse gate for FLOW SYNC; missing a window has no movement or mission penalty.'],
  ['Can I play on a phone?', 'Yes. The game has touch controls and landscape mode is recommended for the clearest view.'],
  ['Why is there no sound?', 'Mobile browsers may block autoplay audio. Tap the screen once to unlock audio, and check your device volume and mute settings.'],
  ['Is my progress saved?', 'Mission progress and game data use the existing save system. No parallel gameplay save system was added.'],
  ['What is XP?', 'XP is experience earned from missions and activities that advances your courier rank.'],
  ['How do I pause the game?', 'Press the pause control in the HUD.'],
  ['Where can I see the latest changes?', 'Open the circular info button in the upper-right corner of the title screen.']
];

export const LATEST_UPDATE = {
  version: 'UPDATE 26 // GAMEPLAY MAX PACK',
  title: 'GAMEPLAY MAX PACK',
  items: [
    'NEW · Relay Tower Finale: every level now has the same clear tower-based finish architecture without replacing mission completion.',
    'NEW · Flow Mastery: clean signal and movement rhythms build mastery feedback and controlled momentum rewards.',
    'NEW · Mission Mastery: runs track meaningful replay goals such as Signal Hunt, No Damage, Checkpoint Master and Speed Run.',
    'NEW · Dynamic Encounter Director: existing encounter systems can request controlled pressure events at meaningful gameplay moments.',
    'NEW · Tower Pressure: the final approach gets stronger feedback and a short cinematic-feel impact without a second game loop.',
    'NEW · Replay Challenges: optional mastery goals reward skill without blocking the normal campaign route.',
    'NEW · Event-driven gameplay layer: new mechanics attach to existing Phaser/game events and clean themselves up on scene shutdown.',
    'REMOVED · Cargo Integrity, Cargo visibility and Cargo progress are outside the gameplay bootstrap.',
    'SAFE DESIGN · No new requestAnimationFrame loop, no parallel save model, no parallel mission completion and no replacement movement system.'
  ]
};
