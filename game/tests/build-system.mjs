import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const upgrades = await readFile(new URL('../src/upgrades.js', import.meta.url), 'utf8');
const runner = await readFile(new URL('../src/scenes/RunnerScene.js', import.meta.url), 'utf8');
const main = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const styles = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
const mobileOwner = await readFile(new URL('../src/systems/mobile-input-single-owner-v1.js', import.meta.url), 'utf8');

assert.match(upgrades, /id: 'shield'/, 'Relay Shield must be purchasable');
assert.match(upgrades, /id: 'kinetic-ball'/, 'Kinetic Ball must be purchasable');
assert.match(upgrades, /id: 'turret'/, 'Arc Turret must be purchasable');
assert.match(upgrades, /id: 'spring-pad'/, 'Spring Pad must be purchasable');
assert.match(upgrades, /id: 'pulse-rifle'/, 'Pulse Rifle must be purchasable');
assert.match(upgrades, /id: 'scattergun'/, 'Scattergun must be purchasable');
assert.match(runner, /this\.keys\.ONE/, 'Key 1 must be wired');
assert.match(runner, /this\.useBuild\(0\)/, 'Key 1 must deploy build slot one');
assert.match(runner, /this\.keys\.TWO/, 'Key 2 must be wired');
assert.match(runner, /this\.useBuild\(1\)/, 'Key 2 must deploy build slot two');
assert.match(runner, /this\.keys\.THREE/, 'Key 3 must be wired');
assert.match(runner, /this\.useGadget\(0\)/, 'Key 3 must activate gadget slot one');
assert.match(runner, /this\.keys\.FOUR/, 'Key 4 must be wired');
assert.match(runner, /this\.useGadget\(1\)/, 'Key 4 must activate gadget slot two');
assert.match(runner, /this\.keys\.E[\s\S]{0,160}?this\.useBlaster\(\)/, 'E must fire the spawn blaster');
assert.match(runner, /Phaser\.Input\.Keyboard\.JustDown\(\s*this\.keys\.Q\s*\)/, 'Q must activate the always-available sword');
assert.match(index, /data-mobile-action="sword"/, 'Touch controls must include a sword button');
assert.match(index, /data-mobile-action="dash"/, 'Touch controls must include a nitro button');
assert.match(index, /data-mobile-action="build1"/, 'Touch controls must include build slot one');
assert.match(index, /data-mobile-action="gadget1"/, 'Touch controls must include gadget slot one');
assert.match(index, /data-mobile-action="jump"/, 'Touch controls must include a jump button');
assert.match(mobileOwner, /ACTION_KEYS/, 'Single mobile owner must define gameplay action bindings');
assert.match(
  mobileOwner,
  /emitKeyboard\(\s*key,\s*'keydown'\s*\)/,
  'Single mobile owner must send gameplay action keydown events'
);

assert.match(
  mobileOwner,
  /emitKeyboard\(\s*key,\s*'keyup'\s*\)/,
  'Single mobile owner must send gameplay action keyup events'
);

assert.match(
  mobileOwner,
  /window\.dispatchEvent\(event\)/,
  'Single mobile owner must dispatch synthetic gameplay keyboard events'
);
assert.match(main, /function speakNarration\(text\)/, 'English browser narration must be available for cinematic subtitles');
assert.match(main, /claimLoginReward/, 'The challenge board must provide persistent login rewards');
assert.match(main, /WEEKLY/, 'The challenge board must explain and display weekly missions');
assert.match(
  mobileOwner,
  /setJoystickAxis\(0\)/,
  'Single mobile owner must clear joystick movement on release'
);

assert.match(
  styles,
  /body\.is-touch[\s\S]{0,500}\.mobile-actions/,
  'Touch styling must define the mobile action surface'
);
assert.match(main, /const detectTouchDevice = \(\) => \{/, 'App must detect touch capability using multiple redundant signals');
assert.match(main, /hasTouchPoints \|\| hasTouchEvents \|\| coarsePointer \|\| mobileUA/, 'Touch detection must avoid showing touch controls on desktop based only on viewport size');
assert.match(main, /document\.body\.classList\.toggle\('is-touch', detectTouchDevice\(\)\)/, 'App must apply the detected state as a body class driving all touch CSS');
assert.match(
  index,
  /data-mobile-joystick/,
  'Touch controls must contain the canonical virtual joystick'
);

assert.match(
  index,
  /mobile-joystick-thumb/,
  'Virtual joystick must contain a movable thumb'
);

assert.match(
  mobileOwner,
  /touch-screen-v13 joystick-v1/,
  'Single mobile owner must install the canonical joystick movement surface'
);

assert.match(
  mobileOwner,
  /data-mobile-joystick/,
  'Single mobile owner must bind the canonical joystick'
);

assert.match(
  mobileOwner,
  /mobile-joystick-thumb/,
  'Single mobile owner must move the joystick thumb'
);

assert.match(
  mobileOwner,
  /DEAD_ZONE/,
  'Joystick movement must have a dead zone'
);

assert.match(
  mobileOwner,
  /directionFromAxis/,
  'Joystick axis must map to player direction'
);

assert.match(
  mobileOwner,
  /scene\.mobileAxis/,
  'Joystick must expose its horizontal axis to the gameplay scene'
);

assert.match(
  mobileOwner,
  /movementPointerId/,
  'Single mobile owner must track the joystick pointer'
);

assert.match(
  mobileOwner,
  /pointerdown[\s\S]{0,900}setJoystickAxis/,
  'Single mobile owner must route joystick touch into movement'
);

assert.match(
  mobileOwner,
  /pointermove[\s\S]{0,500}setJoystickAxis/,
  'Single mobile owner must update movement while the thumb moves'
);

assert.match(
  mobileOwner,
  /setDirection\(null\)/,
  'Single mobile owner must clear movement direction on joystick release'
);
