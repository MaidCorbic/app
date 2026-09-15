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
    'How do I move?',
    'On keyboard, use A and D to move left and right. On mobile, use the left and right sides of the joystick or touch movement controls.'
  ],

  [
    'How do I jump?',
    'Press SPACE on keyboard or use the JUMP control on mobile. Make sure the game has focus before using the keyboard.'
  ],

  [
    'How do I use my abilities?',
    'Use the available HUD ability controls during gameplay. Each ability has a different purpose and should be used according to the current situation.'
  ],

  [
    'What does SWORD do?',
    'SWORD is your close-range combat ability. Use it when an enemy is within attack range.'
  ],

  [
    'What does DASH do?',
    'DASH gives you a fast movement burst. Use it to avoid hazards, reposition quickly or close distance during combat.'
  ],

  [
    'What does BUILD do?',
    'BUILD activates available construction abilities used during supported gameplay situations and mission objectives.'
  ],

  [
    'How do I complete a mission?',
    'Follow the active mission objective, collect the required signals and reach the delivery beacon. When the mission is complete, select NEXT MISSION.'
  ],

  [
    'How do I know what my objective is?',
    'The active mission objective is shown through the current mission interface and objective indicators. Follow the highlighted target or instruction to continue the mission.'
  ],

  [
    'How do I start a mission?',
    'Select the available mission from the mission interface and begin the run. The active objective will then guide your progress.'
  ],

  [
    'How do I move to the next mission?',
    'After successfully completing the current mission, select NEXT MISSION. The game will load the next available mission.'
  ],

  [
    'What happens if I fail a mission?',
    'A failed mission can be retried. Review the active objective, avoid the hazard or combat mistake that caused the failure, and attempt the mission again.'
  ],

  [
    'Can I retry a mission?',
    'Yes. When a mission is failed, use the available retry option to restart the mission.'
  ],

  [
    'Can I replay a completed mission?',
    'Mission replay depends on the available mission and progression state. Use the mission interface to inspect currently available content.'
  ],

  [
    'How many missions are there?',
    'Relay Runner currently contains seven missions with progressively increasing enemy awareness and combat difficulty.'
  ],

  [
    'What is XP?',
    'XP means experience points. You earn XP through missions and activities, helping advance your courier rank.'
  ],

  [
    'How do I earn XP?',
    'Complete missions and gameplay activities to earn XP and progress your courier rank.'
  ],

  [
    'What happens when I complete a mission?',
    'The mission completion state is recorded and the game presents the available progression options, including NEXT MISSION when another mission is available.'
  ],

  [
    'What happens when I complete all missions?',
    'Once all available missions are completed, your progression remains available through the existing game save system and mission interface.'
  ],

  [
    'Is my progress saved?',
    'Mission progress and game data use the existing save system. Avoid clearing browser or site data if you want to keep your local progress.'
  ],

  [
    'What data is saved?',
    'The existing save system stores the game data required for mission progression and related gameplay state.'
  ],

  [
    'Can I play on a phone?',
    'Yes. Relay Runner supports touch controls on mobile devices. Landscape orientation is recommended for the clearest gameplay view and full control layout.'
  ],

  [
    'Should I use landscape mode on mobile?',
    'Yes. Landscape orientation is recommended because it provides a clearer gameplay view and gives the touch controls more usable space.'
  ],

  [
    'Why are my touch controls not responding?',
    'Tap the game area once to give the page focus, then try the controls again. Also make sure no browser overlay or system gesture is covering the control area.'
  ],

  [
    'Can I play with a keyboard?',
    'Yes. Keyboard controls are supported for the main movement and jump actions, including A / D for movement and SPACE for jump.'
  ],

  [
    'Why is there no sound?',
    'Mobile browsers can block automatic audio playback. Tap the game once to unlock audio, then check your device volume, media volume and mute settings.'
  ],

  [
    'How do I pause the game?',
    'During gameplay, use the ☰ button in the HUD to open the Courier Terminal. From there you can resume the run, inspect missions and progress, or open settings.'
  ],

  [
    'How do I resume the game?',
    'Open the Courier Terminal with the ☰ HUD button and select the resume option to return to gameplay.'
  ],

  [
    'Where can I see the latest changes?',
    'From the title screen, open the circular INFO button in the upper-right corner to view the latest gameplay update.'
  ],

  [
    'What should I do if the game gets stuck?',
    'First wait briefly for the current screen or transition to finish. If the game remains unresponsive, try refreshing the page and then continue from the saved game state.'
  ],

  [
    'What should I do if the game does not load?',
    'Refresh the page and allow the game assets to load again. Make sure your browser connection is active and that JavaScript is enabled.'
  ],

  [
    'What happens if I refresh the page?',
    'The current page reloads and the game initializes again. Saved mission progression can be restored through the existing save system.'
  ],

  [
    'Which browsers are supported?',
    'Use a modern browser with JavaScript enabled and support for current web standards. Updated versions of major desktop and mobile browsers are recommended.'
  ],

  [
    'Does the game require an internet connection?',
    'The game is delivered through the web application, so an active connection may be required to load the application and its resources.'
  ],

  [
    'Can I change settings during gameplay?',
    'Yes. Open the Courier Terminal from the in-game HUD and use the available settings controls.'
  ],

  [
    'Where can I see my mission progress?',
    'Open the relevant mission or progress interface from the game HUD or Courier Terminal to inspect the current progression state.'
  ],

  [
    'How do enemy encounters work?',
    'Enemies use movement, platform awareness and combat behaviours that scale across the seven missions. Their pursuit depends on whether the player can be physically reached through the level layout.'
  ],

  [
    'Why do some enemies not follow me?',
    'Enemy pursuit is constrained by the physical level layout. When a route is not reachable through the available platforms, the enemy will not force movement through level geometry.'
  ],

  [
    'How does enemy difficulty change?',
    'Enemy awareness and combat difficulty scale progressively across the seven missions, increasing the challenge as progression advances.'
  ],

  [
    'What is Egg Hazard?',
    'Egg Hazard is a projectile-based enemy ability that uses a ballistic flight arc with target prediction and rotation that follows its actual flight direction.'
  ],

  [
    'Why should I use DASH during combat?',
    'DASH is useful for creating distance, avoiding attacks, repositioning and moving quickly between combat situations.'
  ],

  [
    'What should I do before starting a mission?',
    'Check the active objective, confirm your available controls and abilities, and make sure the gameplay area is fully visible before beginning the run.'
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
