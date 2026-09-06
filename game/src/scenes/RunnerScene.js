import Phaser from 'phaser';
import { packages } from '../packages.js';
import { rivalAppearances } from '../world-content.js';
import { enemyIntel, signatureThreats } from '../enemy-intel.js';

// Kept together so movement can be tuned without touching level or state logic.
const RUNNER_TUNING = {
maxRunSpeed: 460,
groundAcceleration: 4200,
airAcceleration: 2350,
turnAcceleration: 5600,
groundDeceleration: 3300,
jumpVelocity: -705,
jumpCutMultiplier: .48,
coyoteMs: 115,
jumpBufferMs: 120,
fallGravity: 720,
maxFallSpeed: 1120,
dashSpeed: 670,
dashDurationMs: 145,
dashCooldownMs: 620,
};

const DISTRICT_VISUALS = {
'first-delivery': { skyline: 0x1b2943, building: 0x263653, window: 0xffcd7a, accent: 0xffd06e, label: 'OLD QUARTER', props: 'lanterns' },
'dead-drop': { skyline: 0x283142, building: 0x394052, window: 0xffbd5b, accent: 0xffa85d, label: 'SALT DOCKS', props: 'docks' },
blackout: { skyline: 0x10192a, building: 0x15233a, window: 0x8df4ff, accent: 0x8df4ff, label: 'GRID NINE', props: 'emergency' },
pursuit: { skyline: 0x202945, building: 0x2c3858, window: 0xb9d9ff, accent: 0xff826e, label: 'RAIL SPINE', props: 'rail' },
'signal-storm': { skyline: 0x15213a, building: 0x26385a, window: 0xaecbff, accent: 0xb993ff, label: 'CROWN ARRAY', props: 'array' },
'corporate-lockdown': { skyline: 0x263044, building: 0x3a465f, window: 0xffd06e, accent: 0xff826e, label: 'HELIX TOWER', props: 'rail' },
'final-relay': { skyline: 0x211d3a, building: 0x334261, window: 0xffe0a8, accent: 0xffd06e, label: 'APEX SPINE', props: 'array' },
};

export class RunnerScene extends Phaser.Scene {
constructor() { super('runner'); }

createTextures() {
const make = (key, width, height, draw) => {
const graphics = this.make.graphics({ add: false });
draw(graphics); graphics.generateTexture(key, width, height); graphics.destroy();
};

const runner = (key, leftLeg, rightLeg, arm) => make(key, 48, 64, g => {
  g.fillStyle(0xf3eee4).fillCircle(24, 12, 10).fillStyle(0x202a3d).fillRect(14, 21, 20, 5);
  g.fillStyle(0xff756d).fillRoundedRect(14, 23, 20, 24, 5).fillStyle(0xffd06e).fillRect(14, 29, 20, 5);
  g.lineStyle(5, 0xf3eee4).lineBetween(15, 30, 8, arm).lineBetween(33, 30, 40, 42 - arm / 5);
  g.lineStyle(7, 0xaee37f).lineBetween(19, 45, 16, leftLeg).lineBetween(29, 45, 33, rightLeg);
});

// Generated textures are isolated here so authored sprite sheets can replace them later.
runner('runner-idle', 60, 60, 40);
runner('runner-run-a', 56, 63, 50);
runner('runner-run-b', 63, 56, 27);
runner('runner-jump', 54, 54, 30);
runner('runner-fall', 62, 62, 58);
runner('runner-land', 55, 55, 42);
runner('runner-dash', 54, 54, 22);
runner('runner-wall', 56, 62, 18);
runner('runner-hit', 62, 62, 62);
runner('runner-finish', 50, 50, 18);

make('signal', 56, 56, g => {
  g.fillStyle(0xffd06e, .08).fillCircle(28, 28, 27);
  g.fillStyle(0xffd06e, .2).fillCircle(28, 28, 20);
  g.lineStyle(2, 0xffe6a6, .85)
    .strokeCircle(28, 28, 15)
    .lineBetween(28, 6, 28, 15)
    .lineBetween(28, 41, 28, 50);
  g.fillStyle(0xffe7a6).fillCircle(28, 28, 8);
  g.fillStyle(0xff826e).fillCircle(28, 28, 3);
});

make('barrier', 48, 64, g =>
  g.fillStyle(0x202b39)
    .fillRect(3, 3, 42, 58)
    .lineStyle(3, 0xff826e)
    .strokeRect(4, 4, 40, 56)
    .lineBetween(7, 8, 41, 56)
    .lineBetween(41, 8, 7, 56)
);

make('goal', 56, 68, g =>
  g.lineStyle(4, 0xe5ecf1)
    .lineBetween(10, 66, 10, 4)
    .fillStyle(0xffd06e)
    .fillTriangle(12, 9, 48, 21, 12, 36)
);

make('rain', 8, 14, g =>
  g.lineStyle(2, 0xd9e9ff, .45)
    .lineBetween(6, 0, 1, 13)
);

make('dust', 10, 10, g =>
  g.fillStyle(0xd6dbe2, .65).fillCircle(5, 5, 4)
);

make('speed-line', 32, 3, g =>
  g.fillGradientStyle(
    0xb9e9ff,
    0xb9e9ff,
    0xb9e9ff,
    0xb9e9ff,
    0,
    .65,
    .65,
    0
  ).fillRect(0, 0, 32, 3)
);

make('boost-pad', 58, 18, g =>
  g.fillStyle(0x17263b)
    .fillRoundedRect(0, 2, 58, 14, 4)
    .fillStyle(0x8df4ff)
    .fillTriangle(10, 13, 20, 5, 30, 13)
    .fillTriangle(27, 13, 37, 5, 47, 13)
);

make('chaser', 52, 60, g =>
  g.fillStyle(0xff826e, .14)
    .fillCircle(26, 28, 25)
    .fillStyle(0x172238)
    .fillRoundedRect(10, 8, 32, 42, 7)
    .lineStyle(2, 0xff826e)
    .strokeRoundedRect(10, 8, 32, 42, 7)
    .fillStyle(0xff826e)
    .fillRect(16, 20, 20, 5)
);

make('checkpoint', 30, 54, g =>
  g.lineStyle(3, 0x8df4ff)
    .lineBetween(6, 52, 6, 4)
    .fillStyle(0x8df4ff, .2)
    .fillTriangle(8, 6, 27, 14, 8, 23)
    .lineStyle(1, 0xdffcff)
    .strokeTriangle(8, 6, 27, 14, 8, 23)
);

make('security', 42, 34, g =>
  g.fillStyle(0xff826e, .14)
    .fillCircle(21, 17, 20)
    .fillStyle(0x172238)
    .fillRoundedRect(5, 8, 32, 20, 8)
    .lineStyle(2, 0xff826e)
    .strokeRoundedRect(5, 8, 32, 20, 8)
    .fillStyle(0xff826e)
    .fillCircle(28, 17, 4)
);

make('guard', 32, 58, g =>
  g.fillStyle(0x172238)
    .fillRoundedRect(6, 7, 20, 44, 5)
    .lineStyle(2, 0xff826e)
    .strokeRoundedRect(6, 7, 20, 44, 5)
    .fillStyle(0xffd06e)
    .fillRect(10, 16, 12, 4)
);

make('enemy-runner', 48, 64, g => {
  g.fillStyle(0xd5f0ff).fillCircle(24, 12, 10);
  g.fillStyle(0x241b35).fillRect(14, 21, 20, 5);
  g.fillStyle(0x6b3f83).fillRoundedRect(14, 23, 20, 24, 5);
  g.fillStyle(0xff826e).fillRect(14, 29, 20, 5);
  g.lineStyle(5, 0xd5f0ff)
    .lineBetween(15, 30, 8, 42)
    .lineBetween(33, 30, 40, 35);
  g.lineStyle(7, 0xff826e)
    .lineBetween(19, 45, 16, 60)
    .lineBetween(29, 45, 33, 60);
});

make('invader', 48, 38, g =>
  g.fillStyle(0x5b3d82)
    .fillRoundedRect(4, 9, 40, 23, 10)
    .lineStyle(2, 0xe0a7ff)
    .strokeRoundedRect(4, 9, 40, 23, 10)
    .fillStyle(0xe0a7ff)
    .fillCircle(17, 20, 4)
    .fillCircle(31, 20, 4)
);

make('chicken', 42, 38, g =>
  g.fillStyle(0xf4f0e7)
    .fillCircle(20, 22, 15)
    .fillCircle(28, 10, 9)
    .fillStyle(0xffd06e)
    .fillTriangle(35, 11, 43, 15, 35, 19)
    .fillStyle(0xff826e)
    .fillCircle(26, 2, 4)
);

make('dino', 68, 48, g =>
  g.fillStyle(0x72a66a)
    .fillRoundedRect(7, 16, 48, 24, 9)
    .fillTriangle(0, 25, 14, 10, 14, 40)
    .fillStyle(0xdff0b0)
    .fillCircle(50, 17, 5)
    .fillStyle(0x172238)
    .fillCircle(51, 16, 2)
);

make('dino-boss', 112, 82, g => {
  // OUTER BOSS AURA
  g.fillStyle(0xff826e, 0.08)
    .fillCircle(56, 42, 39);

  g.fillStyle(0xffd06e, 0.08)
    .fillCircle(56, 42, 31);

  // REAR SPIKES
  g.fillStyle(0x233d32)
    .fillTriangle(16, 25, 2, 12, 22, 38)
    .fillTriangle(24, 21, 12, 4, 31, 31)
    .fillTriangle(88, 22, 104, 6, 91, 38);

  // MAIN ARMOR
  g.fillStyle(0x274936)
    .fillRoundedRect(13, 22, 82, 40, 14);

  // ARMOR INNER PANEL
  g.fillStyle(0x345f45)
    .fillRoundedRect(20, 28, 68, 27, 10);

  // NEON OUTLINE
  g.lineStyle(3, 0xaee37f, 0.95)
    .strokeRoundedRect(13, 22, 82, 40, 14);

  // HEAD / SNOUT
  g.fillStyle(0x6fa66e)
    .fillTriangle(
      0, 42,
      21, 16,
      25, 65
    );

  // EYE SOCKET
  g.fillStyle(0x172238)
    .fillEllipse(78, 30, 19, 15);

  // EYE GLOW
  g.fillStyle(0xffd06e, 0.25)
    .fillCircle(82, 29, 10);

  g.fillStyle(0xffd06e)
    .fillCircle(82, 29, 6);

  g.fillStyle(0xffffff, 0.9)
    .fillCircle(83, 28, 2);

  // CORE
  g.fillStyle(0xff826e, 0.18)
    .fillCircle(53, 43, 17);

  g.lineStyle(2, 0xffd06e, 0.8)
    .strokeCircle(53, 43, 12);

  g.fillStyle(0xffe0a8)
    .fillCircle(53, 43, 6);

  // ARMOR VENTS
  g.fillStyle(0x8df4ff, 0.8)
    .fillRect(33, 55, 7, 3)
    .fillRect(45, 57, 7, 3)
    .fillRect(57, 55, 7, 3);

  // JAW ACCENT
  g.lineStyle(2, 0xff826e, 0.9)
    .lineBetween(17, 56, 37, 66);

  // TOP ENERGY MARK
  g.fillStyle(0xdffcff, 0.9)
    .fillRect(42, 18, 22, 3);
});

make('sentinel-boss', 90, 92, g => {
  // OUTER ENERGY FIELD
  g.fillStyle(0x8df4ff, 0.08)
    .fillCircle(45, 46, 42);

  g.fillStyle(0xb9f5ff, 0.07)
    .fillCircle(45, 46, 34);

  // BACK PLATES
  g.fillStyle(0x10243a)
    .fillTriangle(18, 22, 5, 12, 20, 36)
    .fillTriangle(72, 22, 85, 12, 70, 36);

  // MAIN BODY
  g.fillStyle(0x172d48)
    .fillRoundedRect(15, 15, 60, 64, 15);

  // INNER ARMOR
  g.fillStyle(0x254866)
    .fillRoundedRect(21, 21, 48, 51, 11);

  // NEON OUTLINE
  g.lineStyle(3, 0x8df4ff, 0.95)
    .strokeRoundedRect(15, 15, 60, 64, 15);

  // CENTRAL CORE FIELD
  g.fillStyle(0x8df4ff, 0.16)
    .fillCircle(45, 42, 25);

  g.lineStyle(2, 0x55dfff, 0.9)
    .strokeCircle(45, 42, 20);

  g.lineStyle(1, 0xdffcff, 0.75)
    .strokeCircle(45, 42, 14);

  // CORE
  g.fillStyle(0xe8fdff)
    .fillCircle(45, 42, 8);

  g.fillStyle(0x8df4ff)
    .fillCircle(45, 42, 5);

  g.fillStyle(0xffffff)
    .fillCircle(43, 40, 2);

  // TOP SENSOR
  g.fillStyle(0x55dfff, 0.18)
    .fillCircle(45, 9, 9);

  g.fillStyle(0x8df4ff)
    .fillCircle(45, 9, 4);

  // LOWER WEAPON BAR
  g.fillStyle(0x0b1726)
    .fillRoundedRect(27, 67, 36, 9, 4);

  g.lineStyle(2, 0xff826e, 0.9)
    .strokeRoundedRect(27, 67, 36, 9, 4);

  // ENERGY VENTS
  g.fillStyle(0xdffcff, 0.9)
    .fillRect(29, 71, 6, 2)
    .fillRect(42, 71, 6, 2)
    .fillRect(55, 71, 6, 2);
});

make('storm-boss', 104, 86, g => {
  // OUTER STORM AURA
  g.fillStyle(0xb993ff, 0.08)
    .fillCircle(52, 43, 41);

  g.fillStyle(0xe0a7ff, 0.06)
    .fillCircle(52, 43, 34);

  // WING / STORM SHARDS
  g.fillStyle(0x241b45)
    .fillTriangle(6, 47, 34, 9, 46, 47);

  g.fillStyle(0x32235e)
    .fillTriangle(58, 47, 89, 8, 99, 49);

  // MAIN STORM BODY
  g.fillStyle(0x3d3169)
    .fillRoundedRect(25, 17, 54, 53, 16);

  // INNER ENERGY
  g.fillStyle(0x574587)
    .fillRoundedRect(31, 23, 42, 41, 12);

  // OUTLINE
  g.lineStyle(3, 0xe0a7ff, 0.95)
    .strokeRoundedRect(25, 17, 54, 53, 16);

  // ORBIT RING
  g.lineStyle(2, 0xb993ff, 0.85)
    .strokeCircle(52, 43, 24);

  g.lineStyle(1, 0xdabfff, 0.55)
    .strokeCircle(52, 43, 18);

  // CORE GLOW
  g.fillStyle(0xb993ff, 0.25)
    .fillCircle(52, 43, 17);

  // CORE
  g.fillStyle(0xffd06e)
    .fillCircle(52, 43, 8);

  g.fillStyle(0xfff0c7)
    .fillCircle(52, 43, 4);

  // LIGHTNING NODES
  g.fillStyle(0x8df4ff)
    .fillCircle(35, 29, 3)
    .fillCircle(69, 29, 3)
    .fillCircle(37, 57, 3)
    .fillCircle(67, 57, 3);

  // LIGHTNING STRIKES
  g.lineStyle(2, 0x8df4ff, 0.8)
    .lineBetween(35, 29, 44, 38)
    .lineBetween(69, 29, 60, 38)
    .lineBetween(37, 57, 45, 49)
    .lineBetween(67, 57, 59, 49);

  // TOP CROWN
  g.fillStyle(0xe0a7ff)
    .fillTriangle(39, 15, 45, 2, 51, 16)
    .fillTriangle(53, 15, 60, 2, 65, 16);
});
make('apex-boss', 108, 96, g => {
  // MASSIVE OUTER AURA
  g.fillStyle(0xff826e, 0.07)
    .fillCircle(54, 47, 45);

  g.fillStyle(0xffd06e, 0.06)
    .fillCircle(54, 47, 37);

  // SHOULDER PLATES
  g.fillStyle(0x251b30)
    .fillTriangle(17, 28, 2, 13, 25, 32);

  g.fillStyle(0x251b30)
    .fillTriangle(91, 28, 106, 13, 83, 32);

  // MAIN ARMOR
  g.fillStyle(0x2a2038)
    .fillRoundedRect(12, 17, 84, 62, 17);

  // INNER ARMOR
  g.fillStyle(0x463154)
    .fillRoundedRect(20, 24, 68, 47, 12);

  // HEAVY OUTLINE
  g.lineStyle(3, 0xffd06e, 0.95)
    .strokeRoundedRect(12, 17, 84, 62, 17);

  // TOP CROWN
  g.fillStyle(0xffd06e, 0.2)
    .fillTriangle(37, 18, 46, 2, 52, 20)
    .fillTriangle(55, 20, 64, 2, 71, 18);

  // CORE AURA
  g.fillStyle(0xff826e, 0.22)
    .fillCircle(54, 44, 29);

  // CORE RINGS
  g.lineStyle(2, 0xffd06e, 0.9)
    .strokeCircle(54, 44, 22);

  g.lineStyle(1, 0xff826e, 0.8)
    .strokeCircle(54, 44, 29);

  // CORE
  g.fillStyle(0xffe0a8)
    .fillCircle(54, 44, 10);

  g.fillStyle(0xff826e)
    .fillCircle(54, 44, 6);

  g.fillStyle(0xffffff, 0.95)
    .fillCircle(51, 41, 2.5);

  // EYE / VISOR
  g.fillStyle(0x0b1020)
    .fillRoundedRect(28, 29, 52, 9, 4);

  g.fillStyle(0xff826e)
    .fillRect(33, 32, 42, 3);

  // CHEST ENERGY BARS
  g.fillStyle(0x8df4ff, 0.8)
    .fillRect(31, 61, 11, 3)
    .fillRect(48, 61, 11, 3)
    .fillRect(65, 61, 11, 3);

  // LOWER CORE VENT
  g.fillStyle(0xdffcff)
    .fillRoundedRect(39, 69, 30, 6, 3);

  // SIDE ENERGY STRIPS
  g.fillStyle(0xffd06e, 0.8)
    .fillRect(18, 41, 4, 18)
    .fillRect(86, 41, 4, 18);
});

make('alien-ground', 54, 54, g => {
  // OUTER ALIEN AURA
  g.fillStyle(0xb993ff, 0.08)
    .fillCircle(27, 28, 25);

  g.fillStyle(0xe0a7ff, 0.10)
    .fillCircle(27, 28, 20);

  // MAIN ALIEN BODY
  g.fillStyle(0x241836)
    .fillRoundedRect(6, 10, 42, 38, 13);

  // INNER BODY PANEL
  g.fillStyle(0x402d64)
    .fillRoundedRect(10, 14, 34, 29, 10);

  // NEON OUTLINE
  g.lineStyle(2, 0xe0a7ff, 0.95)
    .strokeRoundedRect(6, 10, 42, 38, 13);

  // EYE GLOW
  g.fillStyle(0xe0a7ff, 0.18)
    .fillCircle(18, 25, 8)
    .fillCircle(36, 25, 8);

  // EYES
  g.fillStyle(0xf3d9ff)
    .fillEllipse(18, 25, 11, 9)
    .fillEllipse(36, 25, 11, 9);

  // PUPILS
  g.fillStyle(0x24152f)
    .fillCircle(18, 25, 3)
    .fillCircle(36, 25, 3);

  // EYE HIGHLIGHTS
  g.fillStyle(0xffffff)
    .fillCircle(17, 24, 1)
    .fillCircle(35, 24, 1);

  // CENTRAL SIGNAL CORE
  g.fillStyle(0x8df4ff, 0.18)
    .fillCircle(27, 36, 9);

  g.lineStyle(1.5, 0x8df4ff, 0.8)
    .strokeCircle(27, 36, 7);

  g.fillStyle(0xe8fdff)
    .fillCircle(27, 36, 3);

  // LOWER ENERGY BAND
  g.fillStyle(0x8df4ff, 0.14)
    .fillRoundedRect(15, 43, 24, 7, 3);

  g.fillStyle(0x8df4ff)
    .fillRect(18, 45, 18, 3);
});

make('egg', 24, 30, g => {
  // OUTER WARNING GLOW
  g.fillStyle(0xff826e, 0.10)
    .fillCircle(12, 15, 13);

  // SHADOW / OUTER SHELL
  g.fillStyle(0xc9a85d)
    .fillEllipse(12, 16, 17, 25);

  // MAIN SHELL
  g.fillStyle(0xfff3cf)
    .fillEllipse(12, 14, 15, 23);

  // SHELL HIGHLIGHT
  g.fillStyle(0xffffff, 0.75)
    .fillEllipse(9, 10, 5, 9);

  // ENERGY CRACKS
  g.lineStyle(1.2, 0xff826e, 0.9)
    .lineBetween(7, 12, 10, 15)
    .lineBetween(10, 15, 8, 18)
    .lineBetween(10, 15, 13, 13);

  // GOLDEN OUTLINE
  g.lineStyle(1.5, 0xffd06e, 0.95)
    .strokeEllipse(12, 14, 15, 23);

  // TOP ENERGY SPARK
  g.fillStyle(0xffd06e)
    .fillCircle(16, 4, 2);

  g.fillStyle(0xfff3cf, 0.7)
    .fillCircle(16, 4, 4);
});

make('comet', 40, 40, g => {
  // OUTER WARNING AURA
  g.fillStyle(0xff826e, 0.08)
    .fillCircle(20, 20, 19);

  // ENERGY TRAIL
  g.fillStyle(0xff826e, 0.16)
    .fillTriangle(
      4, 20,
      18, 14,
      18, 26
    );

  g.fillStyle(0xffd06e, 0.20)
    .fillTriangle(
      7, 20,
      18, 16,
      18, 24
    );

  // MAIN PLASMA CORE
  g.fillStyle(0xff826e, 0.28)
    .fillCircle(21, 20, 14);

  g.lineStyle(2, 0xff826e, 0.95)
    .strokeCircle(21, 20, 11);

  // HOT CORE
  g.fillStyle(0xffd06e)
    .fillCircle(21, 20, 8);

  // INNER CORE
  g.fillStyle(0xfff3cf)
    .fillCircle(19, 18, 4);

  // CORE HIGHLIGHT
  g.fillStyle(0xffffff, 0.95)
    .fillCircle(18, 17, 2);

  // ENERGY RINGS
  g.lineStyle(1, 0xffe0a8, 0.65)
    .strokeCircle(21, 20, 15);

  g.lineStyle(1, 0x8df4ff, 0.45)
    .strokeCircle(21, 20, 18);

  // PLASMA SPARKS
  g.fillStyle(0xffd06e, 0.9)
    .fillCircle(11, 10, 2)
    .fillCircle(31, 12, 1.5)
    .fillCircle(30, 29, 2)
    .fillCircle(12, 31, 1.5);
});

make('kinetic-ball', 34, 34, g => {
  // OUTER ENERGY FIELD
  g.fillStyle(0x8df4ff, 0.08)
    .fillCircle(17, 17, 16);

  g.fillStyle(0x55dfff, 0.12)
    .fillCircle(17, 17, 13);

  // OUTER RING
  g.lineStyle(2, 0x8df4ff, 0.9)
    .strokeCircle(17, 17, 12);

  g.lineStyle(1, 0xdffcff, 0.65)
    .strokeCircle(17, 17, 8);

  // CENTRAL CORE GLOW
  g.fillStyle(0x8df4ff, 0.28)
    .fillCircle(17, 17, 9);

  // CORE
  g.fillStyle(0xe8fdff)
    .fillCircle(17, 17, 6);

  g.fillStyle(0x8df4ff)
    .fillCircle(17, 17, 4);

  // CORE HIGHLIGHT
  g.fillStyle(0xffffff, 0.95)
    .fillCircle(15, 15, 2);

  // ENERGY CROSS
  g.lineStyle(1.5, 0xb9f5ff, 0.8)
    .lineBetween(17, 3, 17, 8)
    .lineBetween(17, 26, 17, 31)
    .lineBetween(3, 17, 8, 17)
    .lineBetween(26, 17, 31, 17);

  // SMALL ENERGY NODES
  g.fillStyle(0x55dfff)
    .fillCircle(6, 8, 1.5)
    .fillCircle(28, 8, 1.5)
    .fillCircle(8, 28, 1.5)
    .fillCircle(28, 28, 1.5);
});

make('shield', 54, 72, g => {
  // OUTER ENERGY AURA
  g.fillStyle(0x8df4ff, 0.07)
    .fillRoundedRect(4, 2, 46, 68, 13);

  g.fillStyle(0x55dfff, 0.10)
    .fillRoundedRect(7, 5, 40, 62, 11);

  // MAIN SHIELD BODY
  g.fillStyle(0x10283d, 0.86)
    .fillRoundedRect(8, 4, 38, 64, 10);

  // INNER ENERGY PANEL
  g.fillStyle(0x183b55, 0.72)
    .fillRoundedRect(12, 9, 30, 52, 8);

  // NEON OUTLINE
  g.lineStyle(2, 0x8df4ff, 0.95)
    .strokeRoundedRect(8, 4, 38, 64, 10);

  // INNER FRAME
  g.lineStyle(1, 0xb9f5ff, 0.55)
    .strokeRoundedRect(12, 9, 30, 52, 8);

  // TOP SENSOR
  g.fillStyle(0x8df4ff, 0.22)
    .fillCircle(27, 16, 8);

  g.fillStyle(0xe8fdff)
    .fillCircle(27, 16, 4);

  g.fillStyle(0xffffff, 0.9)
    .fillCircle(26, 15, 1.5);

  // CENTRAL ENERGY CORE
  g.fillStyle(0x8df4ff, 0.18)
    .fillCircle(27, 37, 14);

  g.lineStyle(1.5, 0x55dfff, 0.85)
    .strokeCircle(27, 37, 11);

  g.fillStyle(0x8df4ff)
    .fillCircle(27, 37, 6);

  g.fillStyle(0xe8fdff)
    .fillCircle(27, 37, 3);

  // ENERGY CIRCUIT LINES
  g.lineStyle(1, 0x55dfff, 0.7)
    .lineBetween(15, 24, 15, 48)
    .lineBetween(39, 24, 39, 48)
    .lineBetween(17, 50, 24, 57)
    .lineBetween(37, 50, 30, 57);

  // LOWER ENERGY BAR
  g.fillStyle(0x8df4ff, 0.16)
    .fillRoundedRect(16, 56, 22, 6, 3);

  g.fillStyle(0x8df4ff)
    .fillRect(19, 58, 16, 2);

  // SIDE ENERGY NODES
  g.fillStyle(0x55dfff)
    .fillCircle(10, 35, 2)
    .fillCircle(44, 35, 2);
});

make('blaster', 46, 22, g => {
  // OUTER WEAPON GLOW
  g.fillStyle(0x8df4ff, 0.08)
    .fillRoundedRect(1, 3, 44, 16, 5);

  // MAIN BODY
  g.fillStyle(0x18263b)
    .fillRoundedRect(4, 5, 34, 11, 4);

  // UPPER ARMOR
  g.fillStyle(0x2d4664)
    .fillRoundedRect(8, 3, 23, 5, 2);

  // NEON BODY OUTLINE
  g.lineStyle(1.5, 0x8df4ff, 0.9)
    .strokeRoundedRect(4, 5, 34, 11, 4);

  // BARREL
  g.fillStyle(0x0b1726)
    .fillRoundedRect(28, 7, 15, 7, 2);

  // PLASMA BARREL
  g.fillStyle(0x8df4ff, 0.22)
    .fillRoundedRect(29, 8, 14, 5, 2);

  g.fillStyle(0xe8fdff)
    .fillRect(34, 9, 9, 3);

  // ENERGY CORE
  g.fillStyle(0x8df4ff, 0.18)
    .fillCircle(17, 10, 7);

  g.fillStyle(0x8df4ff)
    .fillCircle(17, 10, 4);

  g.fillStyle(0xffffff, 0.9)
    .fillCircle(16, 9, 1.5);

  // GRIP
  g.fillStyle(0x101a2b)
    .fillRoundedRect(10, 15, 11, 6, 2);

  g.lineStyle(1, 0xffd06e, 0.8)
    .lineBetween(12, 17, 19, 20);

  // AMMO / ENERGY INDICATOR
  g.fillStyle(0xffd06e, 0.22)
    .fillRoundedRect(23, 16, 10, 3, 1);

  g.fillStyle(0xffd06e)
    .fillRect(24, 17, 7, 1);

  // MUZZLE SPARK
  g.fillStyle(0xffffff, 0.9)
    .fillCircle(44, 10, 2);

  g.fillStyle(0x8df4ff, 0.7)
    .fillCircle(44, 10, 4);
});

make('sword', 64, 20, g => {
  // OUTER ENERGY GLOW
  g.fillStyle(0x8df4ff, 0.08)
    .fillTriangle(8, 10, 58, 3, 58, 17);

  // BLADE CORE
  g.fillStyle(0xdffcff)
    .fillTriangle(12, 10, 56, 3, 56, 17);

  // HOT BLADE EDGE
  g.fillStyle(0xffffff, 0.95)
    .fillTriangle(18, 10, 56, 5, 56, 8);

  // CYAN ENERGY EDGE
  g.lineStyle(2, 0x8df4ff, 0.95)
    .lineBetween(12, 10, 56, 3)
    .lineBetween(12, 10, 56, 17);

  // INNER ENERGY LINE
  g.lineStyle(1, 0xb9f5ff, 0.8)
    .lineBetween(20, 10, 54, 8);

  // GUARD
  g.fillStyle(0x17263a)
    .fillRoundedRect(7, 5, 11, 11, 3);

  g.lineStyle(1.5, 0xffd06e, 0.95)
    .strokeRoundedRect(7, 5, 11, 11, 3);

  // ENERGY CELL
  g.fillStyle(0xffd06e)
    .fillRect(10, 8, 5, 5);

  g.fillStyle(0xffffff, 0.8)
    .fillRect(11, 9, 2, 2);

  // HANDLE
  g.fillStyle(0x0b1726)
    .fillRoundedRect(2, 6, 8, 8, 2);

  g.lineStyle(1, 0x8df4ff, 0.8)
    .strokeRoundedRect(2, 6, 8, 8, 2);

  // HANDLE GRIP
  g.fillStyle(0xff826e, 0.75)
    .fillRect(4, 8, 4, 2)
    .fillRect(4, 11, 4, 2);

  // BLADE TIP
  g.fillStyle(0xffffff)
    .fillCircle(56, 10, 2);

  g.fillStyle(0x8df4ff, 0.6)
    .fillCircle(56, 10, 4);
});

make('plasma', 30, 16, g => {
  // OUTER PLASMA AURA
  g.fillStyle(0x8df4ff, 0.08)
    .fillEllipse(15, 8, 29, 15);

  g.fillStyle(0x55dfff, 0.18)
    .fillEllipse(15, 8, 24, 12);

  // MAIN ENERGY SHELL
  g.fillStyle(0x8df4ff, 0.55)
    .fillEllipse(15, 8, 19, 10);

  // HOT CENTER
  g.fillStyle(0xe8fdff)
    .fillEllipse(15, 8, 12, 7);

  // CORE
  g.fillStyle(0xffffff)
    .fillEllipse(15, 8, 7, 4);

  // ENERGY CONTOUR
  g.lineStyle(1.5, 0xb9f5ff, 0.95)
    .strokeEllipse(15, 8, 21, 11);

  // TRAILING ENERGY
  g.fillStyle(0x8df4ff, 0.20)
    .fillTriangle(2, 4, 11, 8, 2, 12);

  g.fillStyle(0x55dfff, 0.18)
    .fillTriangle(0, 6, 8, 8, 0, 10);

  // HOT SPARK
  g.fillStyle(0xffffff, 0.9)
    .fillCircle(18, 6, 1.5);

  // SMALL ENERGY NODES
  g.fillStyle(0x55dfff, 0.85)
    .fillCircle(7, 3, 1)
    .fillCircle(8, 13, 1);
});

make('turret', 52, 52, g => {
  // OUTER DEFENSE AURA
  g.fillStyle(0x8df4ff, 0.07)
    .fillCircle(26, 28, 24);

  // BASE GLOW
  g.fillStyle(0x55dfff, 0.10)
    .fillRoundedRect(4, 25, 44, 20, 7);

  // MAIN BASE
  g.fillStyle(0x16263b)
    .fillRoundedRect(5, 27, 42, 17, 6);

  // BASE INNER PANEL
  g.fillStyle(0x263f5d)
    .fillRoundedRect(9, 30, 34, 11, 4);

  // BASE OUTLINE
  g.lineStyle(2, 0x8df4ff, 0.9)
    .strokeRoundedRect(5, 27, 42, 17, 6);

  // TURRET HOUSING
  g.fillStyle(0x20344e)
    .fillRoundedRect(13, 17, 26, 17, 7);

  g.lineStyle(2, 0xb9f5ff, 0.85)
    .strokeRoundedRect(13, 17, 26, 17, 7);

  // ROTATING CORE
  g.fillStyle(0x8df4ff, 0.16)
    .fillCircle(26, 25, 11);

  g.lineStyle(1.5, 0x55dfff, 0.85)
    .strokeCircle(26, 25, 8);

  // BARREL
  g.fillStyle(0x0b1726)
    .fillRoundedRect(22, 4, 8, 20, 3);

  g.lineStyle(1.5, 0x8df4ff, 0.9)
    .strokeRoundedRect(22, 4, 8, 20, 3);

  // BARREL ENERGY
  g.fillStyle(0x8df4ff)
    .fillRect(24, 7, 4, 12);

  g.fillStyle(0xe8fdff)
    .fillRect(24, 8, 4, 5);

  // MUZZLE CORE
  g.fillStyle(0xffffff)
    .fillCircle(26, 5, 3);

  g.fillStyle(0x8df4ff, 0.6)
    .fillCircle(26, 5, 5);

  // STATUS LIGHTS
  g.fillStyle(0xffd06e)
    .fillCircle(16, 37, 2);

  g.fillStyle(0xff826e)
    .fillCircle(36, 37, 2);

  // LOWER ENERGY VENTS
  g.fillStyle(0x55dfff, 0.8)
    .fillRect(16, 42, 7, 2)
    .fillRect(29, 42, 7, 2);

  // SIDE ARMOR
  g.fillStyle(0x172238)
    .fillTriangle(5, 28, 1, 34, 7, 40)
    .fillTriangle(47, 28, 51, 34, 45, 40);
});
  
make('spring-pad', 64, 24, g => {
  // OUTER ENERGY GLOW
  g.fillStyle(0xaee37f, 0.08)
    .fillRoundedRect(1, 3, 62, 18, 5);

  g.fillStyle(0x8df4ff, 0.06)
    .fillRoundedRect(4, 5, 56, 14, 4);

  // MAIN BODY
  g.fillStyle(0x17263b)
    .fillRoundedRect(2, 5, 60, 16, 5);

  // INNER PANEL
  g.fillStyle(0x263853)
    .fillRoundedRect(6, 8, 52, 10, 3);

  // NEON OUTLINE
  g.lineStyle(2, 0xaee37f, 0.95)
    .strokeRoundedRect(2, 5, 60, 16, 5);

  // INNER ENERGY FRAME
  g.lineStyle(1, 0x8df4ff, 0.65)
    .strokeRoundedRect(6, 8, 52, 10, 3);

  // LAUNCH ARROWS
  g.fillStyle(0xaee37f, 0.95)
    .fillTriangle(10, 16, 18, 10, 18, 16)
    .fillTriangle(22, 16, 30, 10, 30, 16)
    .fillTriangle(34, 16, 42, 10, 42, 16)
    .fillTriangle(46, 16, 54, 10, 54, 16);

  // ARROW HOT CENTERS
  g.fillStyle(0xe8ffd0, 0.85)
    .fillTriangle(12, 15, 18, 11, 18, 15)
    .fillTriangle(24, 15, 30, 11, 30, 15)
    .fillTriangle(36, 15, 42, 11, 42, 15)
    .fillTriangle(48, 15, 54, 11, 54, 15);

  // CENTRAL ENERGY CORE
  g.fillStyle(0x8df4ff, 0.18)
    .fillCircle(32, 12, 8);

  g.lineStyle(1, 0x8df4ff, 0.8)
    .strokeCircle(32, 12, 6);

  g.fillStyle(0xe8fdff)
    .fillCircle(32, 12, 3);

  // SIDE ENERGY NODES
  g.fillStyle(0xaee37f)
    .fillCircle(6, 13, 1.5)
    .fillCircle(58, 13, 1.5);

  // LOWER POWER VENTS
  g.fillStyle(0x55dfff, 0.75)
    .fillRect(18, 19, 7, 2)
    .fillRect(29, 19, 7, 2)
    .fillRect(40, 19, 7, 2);
});

make('guide-drone', 56, 42, g => {
  // OUTER ENERGY GLOW
  g.fillStyle(0x8df4ff, 0.10)
    .fillCircle(28, 21, 21);

  g.fillStyle(0x8df4ff, 0.16)
    .fillCircle(28, 21, 16);

  // SIDE WINGS
  g.fillStyle(0x10283d, 1)
    .fillTriangle(8, 14, 2, 21, 10, 26)
    .fillTriangle(48, 14, 54, 21, 46, 26);

  g.lineStyle(2, 0x55dfff, 0.9)
    .strokeTriangle(8, 14, 2, 21, 10, 26)
    .strokeTriangle(48, 14, 54, 21, 46, 26);

  // MAIN BODY
  g.fillStyle(0x0b1726, 1)
    .fillRoundedRect(9, 10, 38, 22, 9);

  // BODY INNER PANEL
  g.fillStyle(0x18324a, 1)
    .fillRoundedRect(13, 13, 30, 16, 7);

  // NEON OUTLINE
  g.lineStyle(2, 0x8df4ff, 1)
    .strokeRoundedRect(9, 10, 38, 22, 9);

  // CENTRAL CORE GLOW
  g.fillStyle(0x8df4ff, 0.18)
    .fillCircle(28, 21, 11);

  // CENTRAL CORE
  g.fillStyle(0xe8fdff, 1)
    .fillCircle(28, 21, 5);

  g.fillStyle(0x8df4ff, 1)
    .fillCircle(28, 21, 3);

  // CORE HIGHLIGHT
  g.fillStyle(0xffffff, 1)
    .fillCircle(27, 20, 1.5);

  // TOP SIGNAL LIGHTS
  g.fillStyle(0x55dfff, 1)
    .fillCircle(20, 8, 1.5)
    .fillCircle(28, 7, 1.8)
    .fillCircle(36, 8, 1.5);

  // BOTTOM ENERGY VENTS
  g.fillStyle(0x55dfff, 0.8)
    .fillRect(18, 32, 4, 3)
    .fillRect(26, 32, 4, 4)
    .fillRect(34, 32, 4, 3);
});

make('alien-guide', 56, 64, g => {
  // OUTER ALIEN AURA
  g.fillStyle(0xb993ff, 0.08)
    .fillCircle(28, 30, 29);

  g.fillStyle(0xe0a7ff, 0.10)
    .fillCircle(28, 30, 23);

  // HEAD
  g.fillStyle(0x3b2858)
    .fillEllipse(28, 26, 42, 40);

  // HEAD OUTLINE
  g.lineStyle(2, 0xe0a7ff, 0.95)
    .strokeEllipse(28, 26, 42, 40);

  // INNER FACE PANEL
  g.fillStyle(0x53366f)
    .fillEllipse(28, 28, 34, 31);

  // EYES GLOW
  g.fillStyle(0xe0a7ff, 0.20)
    .fillEllipse(19, 24, 14, 10)
    .fillEllipse(37, 24, 14, 10);

  // EYES
  g.fillStyle(0xf3d9ff)
    .fillEllipse(19, 24, 10, 8)
    .fillEllipse(37, 24, 10, 8);

  // PUPILS
  g.fillStyle(0x24152f)
    .fillCircle(19, 24, 3)
    .fillCircle(37, 24, 3);

  // EYE HIGHLIGHTS
  g.fillStyle(0xffffff)
    .fillCircle(18, 23, 1)
    .fillCircle(36, 23, 1);

  // SIGNAL MARK
  g.fillStyle(0x8df4ff, 0.18)
    .fillCircle(28, 35, 9);

  g.fillStyle(0x8df4ff)
    .fillRoundedRect(20, 31, 16, 8, 4);

  // SIGNAL CORE
  g.fillStyle(0xe8fdff)
    .fillCircle(28, 35, 3);

  // SIDE ENERGY FINS
  g.fillStyle(0x2a1c40)
    .fillTriangle(7, 30, 1, 38, 10, 41)
    .fillTriangle(49, 30, 55, 38, 46, 41);

  g.lineStyle(1.5, 0xb993ff, 0.9)
    .strokeTriangle(7, 30, 1, 38, 10, 41)
    .strokeTriangle(49, 30, 55, 38, 46, 41);

  // ANTENNA
  g.lineStyle(2, 0xe0a7ff, 0.9)
    .lineBetween(28, 5, 28, 12);

  // ANTENNA CORE
  g.fillStyle(0x8df4ff)
    .fillCircle(28, 4, 3);

  g.fillStyle(0xffffff, 0.8)
    .fillCircle(27, 3, 1);

  // LOWER ENERGY BAND
  g.fillStyle(0x8df4ff, 0.15)
    .fillRoundedRect(16, 43, 24, 12, 5);

  g.fillStyle(0x8df4ff)
    .fillRoundedRect(18, 45, 20, 7, 3);

  // ENERGY VENTS
  g.fillStyle(0xdffcff, 0.9)
    .fillRect(21, 48, 3, 3)
    .fillRect(27, 47, 3, 4)
    .fillRect(33, 48, 3, 3);
});

}

createAnimations() {
if (this.anims.exists('runner-run')) return;

this.anims.create({
  key: 'runner-idle',
  frames: [{ key: 'runner-idle' }],
  frameRate: 1
});

this.anims.create({
  key: 'runner-run',
  frames: [{ key: 'runner-run-a' }, { key: 'runner-run-b' }],
  frameRate: 11,
  repeat: -1
});

this.anims.create({
  key: 'runner-jump',
  frames: [{ key: 'runner-jump' }],
  frameRate: 1
});

this.anims.create({
  key: 'runner-fall',
  frames: [{ key: 'runner-fall' }],
  frameRate: 1
});

this.anims.create({
  key: 'runner-land',
  frames: [{ key: 'runner-land' }],
  frameRate: 1
});

this.anims.create({
  key: 'runner-dash',
  frames: [{ key: 'runner-dash' }],
  frameRate: 1
});

this.anims.create({
  key: 'runner-wall',
  frames: [{ key: 'runner-wall' }],
  frameRate: 1
});

this.anims.create({
  key: 'runner-hit',
  frames: [{ key: 'runner-hit' }],
  frameRate: 1
});

this.anims.create({
  key: 'runner-finish',
  frames: [{ key: 'runner-finish' }],
  frameRate: 1
});

}

init({
mission,
runId,
abilities = [],
rain,
screenShake = true,
reducedMotion = false,
firstTimeTutorial = false
}) {
this.mission = mission || {};
this.mission.spawn ??= { x: 0, y: 0 };
this.mission.goal ??= { x: this.mission.spawn.x + 1200, y: this.mission.spawn.y };
for (const key of ['platforms','obstacles','movingGates','enemies','signals','secrets','checkpoints','boostPads','guides','safeZones','events']) if (!Array.isArray(this.mission[key])) this.mission[key] = [];
this.runId = runId;
this.abilities = new Set(abilities);
this.rainEnabled = rain;
this.screenShake = screenShake;
this.motionReduced = reducedMotion;
this.firstTimeTutorial = firstTimeTutorial;

this.collected = 0;
this.secretsCollected = 0;
this.elapsedMs = 0;
this.timeEmitTimer = 0;
// ============================================================
// MISSION MEDALS / RUN RATING
// ============================================================
this.runRating = {
  speed: 0,
  combat: 0,
  collection: 0,
  survival: 0,
  overall: 'C'
};

this.medalResult = null;
this.boostCooldown = 0;
this.dashCooldown = 0;
this.dashTimer = 0;
this.wallJumpCooldown = 0;
this.wallJumpTimer = 0;
this.lowEnergyCueTimer = 0;
this.detectionEmit = -1;

this.health = 3;
this.healthInvulnerable = 0;
this.briefingProtected = false;

this.ammo = 6;
this.ammoMax = 6;
this.ammoRecharge = 0;

this.cometTimer = 3400;
this.blasterCooldown = 0;
this.swordCooldown = 0;
this.buildCooldowns = [0, 0];

this.combatCombo = 0;
this.comboTimer = 0;
this.overdriveTimer = 0;
this.jumps = 0;
this.collisions = 0;
this.falls = 0;
this.deaths = 0;

this.perfectDodgeWindow = 0;
this.perfectDodgeCooldown = 0;
this.deathLimit = mission.id === 'first-delivery' ? Infinity : 3;
this.jumpsUsed = 0;
this.finished = false;
this.gameOverUI = null;
this.gameOverRestarting = false;
this.missionMedalsUI = null;
this.missionMedalsClosing = false;
this.respawning = false;
this.respawnGrace = 0;

this.cinematicActive = this.mission.id === 'first-delivery' && firstTimeTutorial;
this.eventState = new Map();
this.mobileDirection = null;
this.mobileActions = { jump:false, dash:false, fire:false, sword:false, build1:false, build2:false, gadget1:false, gadget2:false };
this.empTimer = 0; this.decoyTimer = 0; this.boosterTimer = 0;
this.boosterAura = null; this.decoyBeacon = null; this.infoCard = null; this.landingTimer = 0;
this.bossDefeated = false;
this.bossPhaseTwo = false;
this.bossVictorySequence = false;
this.bossVictoryLock = false;
this.goalTouched = false;

this.coyote = 0;
this.jumpBuffer = 0;
this.dustTimer = 0;
this.speedTimer = 0;
this.fastFallFxTimer = 0;
this.lastProgress = -1;
this.wasGrounded = false;
this.fallSpeed = 0;

this.cameraOffsetX = -85;
this.cameraOffsetY = 65;
this.cameraZoom = 1;
this.lastParallaxBoost = -1;

this.jumpHeld = false;
this.sectorTwoAnnounced = false;
this.chaseWarnings = new Set();
this.checkpointHints = new Set();
this.routeTutorials = new Set();
this.storyBeatsSeen = new Set();
this.enemyIntelSeen = new Set();
this.goalHintShown = false;

this.weatherTimer = 0;
this.weatherPhase = 0;
this.routeHintTimer = 0;
this.eventCheckTimer = 0;

this.checkpoint = {
  x: this.mission.spawn.x,
  y: this.mission.spawn.y,
  signals: new Set(),
  secrets: new Set()
};

}

validateMission() {
  const mission = this.mission || {};
  mission.spawn ??= { x: 0, y: 0 };
  mission.goal ??= { x: mission.spawn.x + 1200, y: mission.spawn.y };
  for (const key of ['platforms','obstacles','movingGates','enemies','signals','secrets','checkpoints','boostPads','guides','safeZones','events']) if (!Array.isArray(mission[key])) mission[key] = [];
  mission.enemies = mission.enemies.map(enemy => ({
    ...enemy,
    min: Number.isFinite(enemy?.min) ? enemy.min : (Number(enemy?.x) || mission.spawn.x) - 90,
    max: Number.isFinite(enemy?.max) ? enemy.max : (Number(enemy?.x) || mission.spawn.x) + 90
  }));
  this.mission = mission;
}

shake(duration, intensity) {
if (this.screenShake && !this.motionReduced) {
this.cameras.main.shake(duration, intensity);
}
}

registerPerfectDodge() {
if (
  this.perfectDodgeCooldown > 0 ||
  this.health <= 0
) {
  return;
}

this.perfectDodgeWindow = 120;
this.perfectDodgeCooldown = 320;

  this.game.events.emit(
  'feedback',
  'perfect_dodge'
);
  
this.combatCombo = Math.min(
  10,
  this.combatCombo + 1
);

this.comboTimer = 3000;

  /*
 * ============================================================
 * PERFECT DODGE · COMBAT FEEDBACK
 * ============================================================
 */
if (!this.motionReduced) {
  const dodgeRing =
    this.add
      .circle(
        this.player.x,
        this.player.y,
        12,
        0x8df4ff,
        .16
      )
      .setDepth(13);

  dodgeRing.setStrokeStyle(
    2,
    0xb9f5ff,
    .9
  );

  this.tweens.add({
    targets: dodgeRing,
    scale: 4.6,
    alpha: 0,
    duration: 360,
    ease: 'Quad.out',
    onComplete: () =>
      dodgeRing.destroy()
  });

  this.cameras.main.flash(
    90,
    120,
    220,
    255
  );

  this.playerCue(
    'PERFECT DODGE',
    '#8df4ff'
  );

  this.gadgetPulse(
    0x8df4ff,
    14,
    360
  );
}
  
this.energy = Math.min(
  this.energyMax,
  this.energy + 8
);

this.game.events.emit(
  'energy',
  this.energy /
    this.energyMax *
    100
);

this.game.events.emit(
  'combo',
  this.combatCombo,
  1
);

  const dodgeBurst =
  this.add
    .circle(
      this.player.x,
      this.player.y,
      14,
      0x8df4ff,
      .34
    )
    .setDepth(13);

this.tweens.add({
  targets: dodgeBurst,
  scale: 4.8,
  alpha: 0,
  duration: 320,
  onComplete: () =>
    dodgeBurst.destroy()
});

this.shake(
  70,
  0.003
);
  
const comboPulse =
  this.add
    .circle(
      this.player.x,
      this.player.y,
      14,
      0x8df4ff,
      .24
    )
    .setDepth(12);

this.tweens.add({
  targets: comboPulse,
  scale: 3.8,
  alpha: 0,
  duration: 300,
  onComplete: () =>
    comboPulse.destroy()
});
this.shake(90, .004);

}

playerCue(text, color = '#b9f5ff') {
  if (!this.player?.active) {
    return;
  }

  const activeCues =
    this.children.list.filter(
      child =>
        child?.getData?.('playerCue') === true &&
        child.active
    );

  const stackOffset =
    Math.min(
      activeCues.length,
      3
    ) * 16;

  const label =
    this.add
      .text(
        this.player.x,
        this.player.y - 46 - stackOffset,
        text,
        {
          fontFamily: 'DM Mono',
          fontSize: '10px',
          color,
          stroke: '#08101c',
          strokeThickness: 4,
          padding: {
            left: 3,
            right: 3,
            top: 2,
            bottom: 2
          }
        }
      )
      .setOrigin(.5)
      .setDepth(14)
      .setData(
        'playerCue',
        true
      );

  this.tweens.add({
    targets: label,
    y: label.y - 20,
    alpha: 0,
    duration: 520,
    ease: 'Quad.out',
    onComplete: () =>
      label.destroy()
  });
}

showIntelCard(title, lines, color = '#8df4ff') {
this.dismissIntelCard();
this.briefingProtected = true;

const card = this.add.container(32, 382)
  .setScrollFactor(0)
  .setDepth(40)
  .setSize(472, 210)
  .setInteractive({ useHandCursor: true });

const plate = this.add.rectangle(
  236,
  112,
  472,
  210,
  0x07101f,
  .94
).setStrokeStyle(
  1,
  Phaser.Display.Color.HexStringToColor(color).color,
  .8
);

const heading = this.add.text(
  28,
  20,
  title,
  {
    fontFamily: 'DM Mono',
    fontSize: '13px',
    color
  }
);

const divider = this.add.rectangle(
  28,
  47,
  74,
  2,
  Phaser.Display.Color.HexStringToColor(color).color
);

const copy = this.add.text(
  28,
  65,
  lines.join('\n'),
  {
    fontFamily: 'DM Mono',
    fontSize: '11px',
    color: '#dffcff',
    lineSpacing: 9,
    wordWrap: { width: 410 }
  }
);

const dismiss = this.add.text(
  28,
  174,
  'TAP / CLICK / ESC TO DISMISS',
  {
    fontFamily: 'DM Mono',
    fontSize: '9px',
    color: '#8ba0b8'
  }
);

card.add([
  plate,
  heading,
  divider,
  copy,
  dismiss
]);

card.on('pointerdown', () => this.dismissIntelCard());

card.setAlpha(0);

this.tweens.add({
  targets: card,
  alpha: 1,
  x: 48,
  duration: 220
});

this.infoCard = card;

this.time.delayedCall(
  4200,
  () => this.dismissIntelCard(card)
);

}

dismissIntelCard(card = this.infoCard) {
if (!card || this.infoCard !== card) return;

this.infoCard = null;
this.briefingProtected = false;

this.tweens.add({
  targets: card,
  alpha: 0,
  duration: 160,
  onComplete: () => card.destroy()
});

}

showEnemyIntel(type) {
const intel = enemyIntel[type];

if (!intel || this.enemyIntelSeen.has(type)) return;

this.enemyIntelSeen.add(type);
this.game.events.emit('enemy-discovered', type);

this.showIntelCard(
  `TACTICAL READ · ${intel.name}`,
  [
    `ATTACK · ${intel.attack}`,
    `DEFENSE · ${intel.defense}`,
    `TACTIC · ${intel.tactic}`,
    'READ THE TELL, THEN COMMIT.'
  ],
  type.includes('boss') ? '#ffcf82' : '#ff826e'
);

this.game.events.emit(
  'narration',
  `${intel.name}. ${intel.tactic}`
);

}

leaveAfterimage(color = 0x8df4ff) {
if (this.motionReduced) return;

const image = this.add
  .sprite(this.player.x, this.player.y, this.player.texture.key)
  .setFlipX(this.player.flipX)
  .setTint(color)
  .setAlpha(.42)
  .setDepth(9);

this.tweens.add({
  targets: image,
  x: image.x - (this.player.flipX ? -1 : 1) * 24,
  alpha: 0,
  duration: 180,
  onComplete: () => image.destroy()
});

}

gadgetPulse(color, radius = 16, duration = 360) {
if (this.motionReduced) {
  return;
}

const pulse = this.add
.circle(this.player.x, this.player.y, radius, color, .3)
.setDepth(11);

this.tweens.add({
  targets: pulse,
  scale: 3.4,
  alpha: 0,
  duration,
  onComplete: () => pulse.destroy()
});

}

alarmDuration(duration) {
return duration * (
this.loadout.upgrades?.includes('escape') ? .85 : 1
);
}

create() {
this.validateMission();
if (!this.textures.exists('runner-idle')) {
this.createTextures();
}

this.createAnimations();

this.package = packages[this.mission.id] || { speedMultiplier: 1, upgrades: [], equipment: [] };
this.packageCondition = 100;

this.energy = 100;
this.energyMax = 100;
this.loadout = this.mission.loadout || {
  upgrades: [],
  equipment: []
};

this.gadgetCooldowns = [0, 0];
this.boostedSignals = 0;
this.energyEmit = -1;
this.tutorials = new Set();
this.slideTimer = 0;
this.vaultCooldown = 0;
this.airDashUsed = false;
this.alarmTimer = 0;
this.alarms = 0;
this.chaseEscapes = 0;
this.worldWidth = Math.max(this.mission.goal?.x ?? 1200, this.mission.spawn?.x ?? 0) + 180;
this.physics.world.setBounds(
0,
0,
this.worldWidth,
860
);

this.createEnvironment();
this.createPlatforms();
this.createWorldLandmarks();
this.createBrutalMapDetails();
this.createRouteLighting();
this.createPlayer();

this.healthInvulnerable = 1600;

const spawnShield = this.add
  .circle(
    this.player.x,
    this.player.y,
    24,
    0x8df4ff,
    .22
  )
  .setDepth(11);

this.tweens.add({
  targets: spawnShield,
  scale: 2.6,
  alpha: 0,
  duration: 1600,
  onComplete: () => spawnShield.destroy()
});

this.createRival();
this.createSignals();
this.createSecrets();
this.createCheckpoints();
this.createHazards();
this.createMovingGates();
this.createEnemies();
this.createSciFiThreats();
this.createBuildSystems();
this.createBoostPads();
this.createChaser();
this.createGoal();
this.createAtmosphere();
this.createGuides();
this.createGuideCompanions();

this.events.once(
  Phaser.Scenes.Events.SHUTDOWN,
  () => {
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.input.keyboard.off(
      'keydown-SPACE',
      this.cinematicSkipHandler
    );
    this.eventState.clear();
  }
);

this.cameras.main
  .setBounds(0, 0, this.worldWidth, 720)
  .startFollow(
    this.player,
    true,
    .1,
    .1,
    this.cameraOffsetX,
    this.cameraOffsetY
  )
  .setDeadzone(185, 100);

this.game.events.emit('runner-ready');
this.game.events.emit('health', this.health);
this.game.events.emit(
  'ammo',
  this.ammo / this.ammoMax * 100
);
this.game.events.emit(
  'energy',
  this.energy / this.energyMax * 100
);

if (this.package?.condition) {
  this.game.events.emit(
    'package',
    this.packageCondition
  );
}

}

createEnvironment() {
const visual = DISTRICT_VISUALS[this.mission.id];
const sky = this.add.graphics().setScrollFactor(0);

const skyBottom = this.mission.blackout
  ? 0x10182a
  : visual.skyline;

sky.fillGradientStyle(
  0x07101e,
  0x07101e,
  skyBottom,
  skyBottom,
  1
).fillRect(
  0,
  0,
  1500,
  720
);

if (this.mission.gravityMode === 'low') {
  for (let index = 0; index < 86; index++) {
    const x = (index * 137) % 1500;
    const y = (index * 71) % 500;

    sky
      .fillStyle(
        index % 4 ? 0x8df4ff : 0xffd06e,
        .45
      )
      .fillCircle(
        x,
        y,
        index % 7 ? 1 : 2
      );
  }

  sky
    .fillStyle(0x5f4e96, .25)
    .fillCircle(1200, 180, 140)
    .fillStyle(0x1d2445)
    .fillCircle(1245, 150, 120);
}

// ============================================================
// CELESTIAL SKY · SUN + MOON
// ============================================================

const celestialTime =
  (this.time.now % 180000) / 180000;

const sunAngle =
  celestialTime * Math.PI * 2;

const moonAngle =
  sunAngle + Math.PI;

const sunX =
  930 +
  Math.cos(sunAngle) * 260;

const sunY =
  150 +
  Math.sin(sunAngle) * 75;

const moonX =
  930 +
  Math.cos(moonAngle) * 260;

const moonY =
  150 +
  Math.sin(moonAngle) * 75;

  const sunAltitude =
  Phaser.Math.Clamp(
    (150 - sunY) / 75,
    -1,
    1
  );

const moonAltitude =
  Phaser.Math.Clamp(
    (150 - moonY) / 75,
    -1,
    1
  );

  // ============================================================
// CELESTIAL · DAY / NIGHT INTENSITY
// ============================================================

const daylight =
  Phaser.Math.Clamp(
    (Math.sin(sunAngle) + 1) * 0.5,
    0,
    1
  );

  const daylightSmooth =
  Phaser.Math.SmoothStep(
    daylight,
    0,
    1
  );

const nightAmount =
  1 - daylightSmooth;

const sunGlowAlpha =
  Phaser.Math.Linear(
    0.06,
    0.16,
    daylightSmooth
  );

const moonGlowAlpha =
  Phaser.Math.Linear(
    0.18,
    0.035,
    daylightSmooth
  );

  const moonShadowAlpha =
  Phaser.Math.Linear(
   0.62,
   0.88,
    nightAmount
  );

  // ============================================================
// CELESTIAL · MOVING OBJECTS
// ============================================================

this.celestialSun =
  this.add
    .circle(
      sunX,
      sunY,
      52,
      0xffe6ad,
      1
    )
    .setScrollFactor(0)
    .setDepth(2);

this.celestialSunGlow =
  this.add
    .circle(
      sunX,
      sunY,
      105,
      0xffd06e,
      sunGlowAlpha
    )
    .setScrollFactor(0)
    .setDepth(1);

this.celestialMoon =
  this.add
    .circle(
      moonX,
      moonY,
      42,
      0xdffcff,
      0.95
    )
    .setScrollFactor(0)
    .setDepth(2);

this.celestialMoonGlow =
  this.add
    .circle(
      moonX,
      moonY,
      74,
      0x8df4ff,
      moonGlowAlpha
    )
    .setScrollFactor(0)
    .setDepth(1);

  // ============================================================
// CELESTIAL · MOON CRESCENT
// ============================================================

this.celestialMoonShadow =
  this.add
    .circle(
     moonX + 24,
     moonY - 15,
      42,
     skyBottom,
      0.98
    )
    .setScrollFactor(0)
    .setDepth(3);

const environment = {
  'first-delivery': ['LANTERN ROOFS', 0xffd06e],
  'dead-drop': ['HARBOR FOG', 0xffbd5b],
  blackout: ['EMERGENCY GRID', 0x8df4ff],
  pursuit: ['RAIL STORM', 0xff826e],
  'signal-storm': ['CROWN TEMPEST', 0xb993ff],
  'corporate-lockdown': ['HELIX SIEGE', 0xff826e],
  'final-relay': ['APEX ORBIT', 0xffe0a8]
}[this.mission.id];

sky
  .fillStyle(environment[1], .08)
  .fillRect(0, 510, 1500, 210);

this.add.text(
  1120,
  58,
  environment[0],
  {
    fontFamily: 'DM Mono',
    fontSize: '10px',
    color: '#dffcff'
  }
)
  .setScrollFactor(0)
  .setAlpha(.45);

const backdrop = {
  'first-delivery': () => {
  for (let x = 70; x < 1500; x += 230) {
    const y =
      165 +
      (x % 4) * 24;

    sky
      .fillStyle(0xffd06e, .035)
      .fillCircle(
        x,
        y,
        52
      )

      .fillStyle(0xffd06e, .045)
      .fillCircle(
        x + 42,
        y + 8,
        38
      )

      .fillStyle(0xffd06e, .035)
      .fillCircle(
        x - 34,
        y + 12,
        32
      )

      .fillStyle(0xffe0a8, .025)
      .fillEllipse(
        x + 10,
        y + 28,
        130,
        34
      );
  }
},

  'dead-drop': () => {
    for (let y = 118; y < 420; y += 64) {
      sky
        .fillStyle(0xb5d9df, .045)
        .fillRect(0, y, 1500, 28);
    }
    const fogClouds =
  this.add
    .graphics()
    .setScrollFactor(.05)
    .setDepth(0);

for (let x = -120; x < 2800; x += 300) {
  const y =
    145 +
    (x % 4) * 22;

  fogClouds
    .fillStyle(0xd8edf0, .018)
    .fillCircle(x, y, 58)
    .fillStyle(0xb5d9df, .022)
    .fillCircle(x + 48, y + 8, 42)
    .fillStyle(0xd8edf0, .016)
    .fillCircle(x - 38, y + 10, 36)
    .fillStyle(0xd8edf0, .012)
    .fillEllipse(x + 12, y + 28, 160, 38);
}

this.tweens.add({
  targets: fogClouds,
  x: -900,
  duration: 95000,
  ease: 'Linear',
  repeat: -1
});
  },

  blackout: () => {
    for (let x = 35; x < 1500; x += 92) {
      sky
        .lineStyle(1, 0x8df4ff, .09)
        .lineBetween(
          x,
          80,
          x + 230,
          520
        );
    }
    const stormClouds =
  this.add
    .graphics()
    .setScrollFactor(.045)
    .setDepth(0);

for (let x = -160; x < 2800; x += 320) {
  const y =
    120 +
    (x % 5) * 20;

  stormClouds
    .fillStyle(0x0b1728, .22)
    .fillCircle(
      x,
      y,
      62
    )

    .fillStyle(0x10243a, .20)
    .fillCircle(
      x + 48,
      y + 8,
      48
    )

    .fillStyle(0x091524, .18)
    .fillCircle(
      x - 42,
      y + 12,
      40
    )

    .fillStyle(0x8df4ff, .035)
    .fillEllipse(
      x + 10,
      y + 30,
      175,
      42
    );
}

this.tweens.add({
  targets: stormClouds,
  x: -1000,
  duration: 115000,
  ease: 'Linear',
  repeat: -1
});

this.tweens.add({
  targets: stormClouds,
  alpha: {
    from: .72,
    to: 1
  },
  duration: 5200,
  ease: 'Sine.inOut',
  yoyo: true,
  repeat: -1
});
  },

  pursuit: () => {
    for (let x = -120; x < 1500; x += 180) {
      sky
        .lineStyle(3, 0xff826e, .12)
        .lineBetween(
          x,
          100,
          x + 250,
          470
        );
    }
    const chaseClouds =
  this.add
    .graphics()
    .setScrollFactor(.07)
    .setDepth(0);

for (let x = -180; x < 3000; x += 270) {
  const y =
    185 +
    (x % 3) * 20;

  chaseClouds
    .fillStyle(0x172238, .10)
    .fillCircle(
      x,
      y,
      48
    )

    .fillStyle(0x26344d, .12)
    .fillCircle(
      x + 40,
      y + 5,
      38
    )

    .fillStyle(0x101a2b, .11)
    .fillCircle(
      x - 34,
      y + 8,
      32
    )

    .fillStyle(0xff826e, .018)
    .fillEllipse(
      x + 8,
      y + 27,
      145,
      30
    );
}

this.tweens.add({
  targets: chaseClouds,
  x: -1150,
  duration: 65000,
  ease: 'Linear',
  repeat: -1
});

this.tweens.add({
  targets: chaseClouds,
  alpha: {
    from: .76,
    to: 1
  },
  duration: 3000,
  ease: 'Sine.inOut',
  yoyo: true,
  repeat: -1
});
  },

  'signal-storm': () => {
    for (let x = 80; x < 1500; x += 170) {
      sky
        .fillStyle(0xb993ff, .08)
        .fillTriangle(
          x,
          100,
          x + 90,
          470,
          x + 170,
          100
        );
    }
    const stormClouds =
  this.add
    .graphics()
    .setScrollFactor(.045)
    .setDepth(0);

for (let x = -160; x < 3000; x += 310) {
  const y =
    135 +
    (x % 4) * 24;

  stormClouds
    .fillStyle(0x241a3d, .14)
    .fillCircle(
      x,
      y,
      60
    )

    .fillStyle(0x3b2860, .16)
    .fillCircle(
      x + 46,
      y + 8,
      46
    )

    .fillStyle(0x1c1630, .13)
    .fillCircle(
      x - 42,
      y + 12,
      38
    )

    .fillStyle(0xb993ff, .025)
    .fillEllipse(
      x + 10,
      y + 30,
      170,
      40
    );
}

this.tweens.add({
  targets: stormClouds,
  x: -1000,
  duration: 98000,
  ease: 'Linear',
  repeat: -1
});

this.tweens.add({
  targets: stormClouds,
  alpha: {
    from: .74,
    to: 1
  },
  duration: 4600,
  ease: 'Sine.inOut',
  yoyo: true,
  repeat: -1
});
  },

  'corporate-lockdown': () => {
    for (let x = 0; x < 1500; x += 130) {
      sky
        .fillStyle(0xff826e, .07)
        .fillRect(x, 110, 68, 320);
    }
    const corporateClouds =
  this.add
    .graphics()
    .setScrollFactor(.035)
    .setDepth(0);

for (let x = -180; x < 3000; x += 340) {
  const y =
    125 +
    (x % 4) * 18;

  corporateClouds
    .fillStyle(0xdffcff, .018)
    .fillCircle(
      x,
      y,
      54
    )

    .fillStyle(0xb9d9e8, .022)
    .fillCircle(
      x + 44,
      y + 6,
      40
    )

    .fillStyle(0xcfe9f2, .016)
    .fillCircle(
      x - 38,
      y + 10,
      32
    )

    .fillStyle(0xff826e, .012)
    .fillEllipse(
      x + 10,
      y + 28,
      155,
      32
    );
}

this.tweens.add({
  targets: corporateClouds,
  x: -820,
  duration: 125000,
  ease: 'Linear',
  repeat: -1
});

this.tweens.add({
  targets: corporateClouds,
  alpha: {
    from: .76,
    to: 1
  },
  duration: 7000,
  ease: 'Sine.inOut',
  yoyo: true,
  repeat: -1
});
  },

  'final-relay': () => {
    for (let x = 90; x < 1500; x += 210) {
      sky
        .lineStyle(1, 0xffe0a8, .2)
        .strokeCircle(x, 230, 72);
    }
    const relayClouds =
  this.add
    .graphics()
    .setScrollFactor(.025)
    .setDepth(0);

for (let x = -220; x < 3200; x += 390) {
  const y =
    105 +
    (x % 3) * 28;

  relayClouds
    .fillStyle(0x211d3a, .13)
    .fillCircle(
      x,
      y,
      72
    )

    .fillStyle(0x334261, .15)
    .fillCircle(
      x + 55,
      y + 8,
      54
    )

    .fillStyle(0x171528, .12)
    .fillCircle(
      x - 52,
      y + 14,
      46
    )

    .fillStyle(0xffe0a8, .028)
    .fillEllipse(
      x + 12,
      y + 34,
      205,
      46
    );
}

this.tweens.add({
  targets: relayClouds,
  x: -900,
  duration: 145000,
  ease: 'Linear',
  repeat: -1
});

this.tweens.add({
  targets: relayClouds,
  alpha: {
    from: .72,
    to: 1
  },
  duration: 8000,
  ease: 'Sine.inOut',
  yoyo: true,
  repeat: -1
});
  }
}[this.mission.id];

backdrop?.();
 
const farClouds =
  this.add
    .graphics()
    .setScrollFactor(.03)
    .setDepth(0);

for (let x = -200; x < 2800; x += 360) {
  const y =
    105 +
    (x % 4) * 20;

  farClouds
    .fillStyle(0xdffcff, .018)
    .fillCircle(
      x,
      y,
      60
    )
    .fillStyle(0x8df4ff, .014)
    .fillCircle(
      x + 48,
      y + 8,
      44
    )
    .fillStyle(0xdffcff, .012)
    .fillEllipse(
      x + 18,
      y + 30,
      170,
      40
    );
}

this.tweens.add({
  targets: farClouds,
  x: -850,
  duration: 105000,
  ease: 'Linear',
  repeat: -1
});

this.tweens.add({
  targets: farClouds,
  alpha: {
    from: .72,
    to: 1
  },
  duration: 6200,
  ease: 'Sine.inOut',
  yoyo: true,
  repeat: -1
});

const distant = this.add.graphics().setScrollFactor(.12);

const distantColor = this.mission.blackout
  ? 0x091222
  : visual.skyline;

const windowAlpha = this.mission.blackout
  ? .12
  : .25;

for (
  let x = -200;
  x < this.worldWidth + 300;
  x += 120
) {
  const h =
    105 +
    ((x / 120 + 7) % 5) * 27;

  distant
    .fillStyle(distantColor)
    .fillRect(x, 570 - h, 88, h)
    .fillStyle(visual.window, windowAlpha)
    .fillRect(
      x + 17,
      490 - h / 4,
      7,
      5
    );
}

const middle = this.add.graphics().setScrollFactor(.38);

for (
  let x = -120;
  x < this.worldWidth + 300;
  x += 280
) {
  middle
    .fillStyle(
      this.mission.blackout
        ? 0x10192a
        : visual.skyline
    )
    .fillRect(
      x,
      395,
      210,
      215
    )
    .fillStyle(
      this.mission.blackout
        ? 0x15233a
        : visual.building
    )
    .fillRect(
      x + 24,
      320,
      132,
      290
    );

  for (let y = 348; y < 570; y += 28) {
    middle
      .fillStyle(visual.window, .28)
      .fillRect(x + 48, y, 12, 7)
      .fillRect(x + 104, y, 12, 7);
  }

  middle
    .lineStyle(2, 0x657b92, .45)
    .lineBetween(
      x + 167,
      390,
      x + 167,
      590
    )
    .lineBetween(
      x + 167,
      430,
      x + 205,
      430
    );
}

const foreground = this.add.graphics().setScrollFactor(.72);

for (
  let x = -200;
  x < this.worldWidth + 300;
  x += 390
) {
  foreground
    .fillStyle(0x0a1220, .78)
    .fillRect(
      x + 20,
      475,
      24,
      245
    )
    .fillRect(
      x + 105,
      530,
      15,
      190
    )
    .fillStyle(0x131f30)
    .fillRect(x, 628, 270, 92);

  foreground
    .lineStyle(3, 0x52677d, .6)
    .lineBetween(
      x + 44,
      505,
      x + 130,
      505
    )
    .lineBetween(
      x + 44,
      505,
      x + 44,
      580
    );
}

this.parallaxLayers = [
  {
    layer: distant,
    base: .12
  },
  {
    layer: middle,
    base: .38
  },
  {
    layer: foreground,
    base: .72
  }
];

}

createPlatforms() {
this.platforms = this.physics.add.staticGroup();

this.mission.platforms.forEach(
  ([x, y, width, height, type]) => {
    const isRoof = type === 'roof';
    const blackout = this.mission.blackout;

    const platform = this.add
      .rectangle(
        x + width / 2,
        y + height / 2,
        width,
        height,
        isRoof
          ? blackout
            ? 0x17253a
            : 0x293950
          : blackout
            ? 0x131d2f
            : 0x202d43
      )
      .setStrokeStyle(
        3,
        isRoof
          ? blackout
            ? 0x537a94
            : 0x93c6d4
          : blackout
            ? 0x3e5870
            : 0x607b99
      );

    this.physics.add.existing(platform, true);
    this.platforms.add(platform);

    const detail = this.add.graphics();

    detail.fillStyle(0x111a29);

    for (
      let mark = x + 18;
      mark < x + width;
      mark += 34
    ) {
      detail.fillRect(mark, y + 18, 16, 6);
    }

    detail
      .fillStyle(
        isRoof
          ? 0x94f5ff
          : 0x9eb6c8,
        blackout
          ? isRoof
            ? .32
            : .1
          : isRoof
            ? .55
            : .18
      )
      .fillRect(
        x,
        y + 4,
        width,
        isRoof ? 4 : 3
      );

    if (isRoof) {
      detail
        .lineStyle(2, 0xaabccc, .8)
        .lineBetween(
          x + 14,
          y,
          x + 14,
          y - 18
        )
        .lineBetween(
          x + 14,
          y - 18,
          x + width - 14,
          y - 18
        )
        .lineBetween(
          x + width - 14,
          y - 18,
          x + width - 14,
          y
        );
    }
  }
);

const props = this.add.graphics();

props
  .fillStyle(0x192238)
  .fillRect(90, 508, 72, 102)
  .fillStyle(0xffbd5b)
  .fillRect(104, 523, 44, 20);

props
  .lineStyle(4, 0x7e91a2)
  .lineBetween(
    1070,
    610,
    1070,
    430
  )
  .lineBetween(
    1070,
    430,
    1180,
    430
  )
  .lineBetween(
    1180,
    430,
    1180,
    610
  );

props
  .fillStyle(0x34233a)
  .fillRect(
    1770,
    455,
    140,
    58
  )
  .fillStyle(0xff7580)
  .fillRect(
    1784,
    470,
    112,
    25
  );

}

createWorldLandmarks() {
const visual = DISTRICT_VISUALS[this.mission.id];
const world = this.add.graphics();

// Lamps, directional signs, and the distant relay tower make the route readable without UI text.
[160, 870, 1515, 2410, 3270, 3860].forEach(x => {
  world
    .lineStyle(4, 0x566d80)
    .lineBetween(x, 610, x, 510)
    .lineBetween(
      x,
      510,
      x + 26,
      510
    );

  world
    .fillStyle(
      visual.accent,
      this.mission.blackout
        ? .2
        : .14
    )
    .fillCircle(
      x + 26,
      520,
      this.mission.blackout
        ? 44
        : 34
    )
    .fillStyle(visual.accent)
    .fillCircle(
      x + 26,
      520,
      5
    );
});

world
  .fillStyle(0x29334a)
  .fillRect(535, 540, 102, 32)
  .fillStyle(0xffd06e)
  .fillTriangle(
    550,
    548,
    550,
    565,
    574,
    556
  );

world
  .fillStyle(0x29334a)
  .fillRect(880, 540, 76, 28)
  .fillStyle(0xff826e)
  .fillRect(892, 548, 52, 4);

world
  .fillStyle(0x172238)
  .fillRect(
    3830,
    370,
    82,
    240
  )
  .fillStyle(0x2e4059)
  .fillRect(
    3850,
    315,
    42,
    300
  );

world
  .lineStyle(4, 0xe2ebf0)
  .lineBetween(
    3870,
    315,
    3870,
    220
  )
  .lineStyle(3, 0xffd06e, .8)
  .lineBetween(
    3870,
    225,
    3925,
    245
  );

world
  .fillStyle(0xffd06e, .15)
  .fillCircle(
    3870,
    225,
    65
  )
  .fillStyle(0xffd06e)
  .fillCircle(
    3870,
    225,
    9
  );

if (visual.props === 'lanterns') {
  [720, 1650, 3000].forEach(x =>
    world
      .fillStyle(0x4d3540)
      .fillRect(
        x,
        520,
        18,
        90
      )
      .fillStyle(
        visual.accent,
        .2
      )
      .fillCircle(
        x + 9,
        510,
        26
      )
      .fillStyle(
        visual.accent
      )
      .fillCircle(
        x + 9,
        510,
        5
      )
  );
}

if (visual.props === 'docks') {
  [680, 2100, 3300].forEach(x => {
    world
      .lineStyle(5, 0x8496a3)
      .lineBetween(
        x,
        610,
        x,
        420
      )
      .lineBetween(
        x,
        420,
        x + 125,
        420
      )
      .fillStyle(0xffbd5b)
      .fillRect(
        x + 84,
        452,
        52,
        32
      );
  });
}

if (visual.props === 'emergency') {
  [760, 1800, 3000].forEach(x =>
    world
      .fillStyle(0x17334a)
      .fillRect(
        x,
        535,
        112,
        35
      )
      .fillStyle(
        visual.accent,
        .65
      )
      .fillRect(
        x + 14,
        547,
        84,
        5
      )
  );
}

if (visual.props === 'rail') {
  [710, 2300, 3400].forEach(x =>
    world
      .lineStyle(4, 0x91a9c9)
      .lineBetween(
        x,
        475,
        x + 240,
        475
      )
      .lineBetween(
        x,
        500,
        x + 240,
        500
      )
      .lineBetween(
        x + 20,
        475,
        x + 20,
        540
      )
      .lineBetween(
        x + 210,
        475,
        x + 210,
        540
      )
  );
}

if (visual.props === 'array') {
  [1450, 2550, 3450].forEach(x => {
    world
      .lineStyle(
        3,
        visual.accent,
        .75
      )
      .lineBetween(
        x,
        555,
        x + 36,
        360
      )
      .lineBetween(
        x + 72,
        555,
        x + 36,
        360
      )
      .lineBetween(
        x,
        555,
        x + 72,
        555
      )
      .fillStyle(
        visual.accent,
        .18
      )
      .fillCircle(
        x + 36,
        360,
        36
      );
  });
}

// NIGHT RELAY WORLD LABEL DISABLED
}
  createBrutalMapDetails() {
  const mapFx = this.add.graphics();

  // Ground glow
  mapFx.fillStyle(0x0b1424, 1);
  mapFx.fillRect(
    0,
    610,
    this.worldWidth,
    110
  );

  // Neon route line
  mapFx.lineStyle(
    3,
    0x8df4ff,
    0.22
  );

  mapFx.lineBetween(
    0,
    606,
    this.worldWidth,
    606
  );

  // Repeating street panels
  for (
    let x = 0;
    x < this.worldWidth;
    x += 160
  ) {
    mapFx
      .fillStyle(0x17263b, 0.7)
      .fillRect(
        x,
        615,
        132,
        6
      );

    mapFx
      .lineStyle(
        1,
        0x8df4ff,
        0.12
      )
      .lineBetween(
        x + 18,
        620,
        x + 18,
        704
      );
  }

  // Neon city pillars
  for (
    let x = 90;
    x < this.worldWidth;
    x += 300
  ) {
    const height =
      70 +
      (x % 4) * 28;

    mapFx
      .fillStyle(0x101c30, 0.9)
      .fillRect(
        x,
        610 - height,
        42,
        height
      );

    mapFx
      .fillStyle(0x8df4ff, 0.18)
      .fillRect(
        x + 8,
        625 - height,
        6,
        height - 20
      );

    mapFx
      .fillStyle(0xffd06e, 0.28)
      .fillRect(
        x + 24,
        625 - height,
        5,
        height - 30
      );
  }

  mapFx.setDepth(1);
}
createRouteLighting() {
if (!this.mission.safeZones?.length) return;

const lights = this.add.graphics();

this.mission.safeZones.forEach(
  ([x, y, width]) => {
    lights
      .fillStyle(0x8df4ff, .07)
      .fillRect(
        x,
        y,
        width,
        45
      )
      .fillStyle(0x8df4ff, .28)
      .fillRect(
        x,
        y,
        width,
        3
      );
  }
);

  /*
 * SAFE ZONE NEON PULSE
 */
if (!this.motionReduced) {
  this.mission.safeZones.forEach(
    ([x, y, width]) => {
      const pulse =
        this.add
          .rectangle(
            x + width / 2,
            y + 22,
            width,
            45,
            0x8df4ff,
            0.04
          )
          .setOrigin(0.5)
          .setDepth(3);

      pulse.setScale(0.98, 0.92);

      this.tweens.add({
        targets: pulse,
        scaleX: 1.02,
        scaleY: 1.08,
        alpha: {
          from: 0.025,
          to: 0.10
        },
        duration: 1100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
    }
  );
}

}

createPlayer() {
this.player = this.physics.add
.sprite(
this.mission.spawn.x,
this.mission.spawn.y,
'runner-idle'
)
.setDepth(10);

this.player.body
  .setSize(28, 55)
  .setOffset(10, 5)
  .setMaxVelocity(
    RUNNER_TUNING.maxRunSpeed,
    RUNNER_TUNING.maxFallSpeed
  )
  .setDragX(
    RUNNER_TUNING.groundDeceleration
  );

this.player
  .setCollideWorldBounds(true)
  .play('runner-idle');

  // ============================================================
// PLAYER · PREMIUM MOVEMENT ANIMATION
// ============================================================

this.playerVisualBaseScaleX =
  this.player.scaleX;

this.playerVisualBaseScaleY =
  this.player.scaleY;

if (!this.motionReduced) {
  this.tweens.add({
    targets: this.player,
    scaleX: 1.025,
    scaleY: 0.985,
    duration: 620,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut'
  });
}

  /*
 * PLAYER ENERGY FX
 */
const playerEnergyGlow =
  this.add
    .circle(
      this.player.x,
      this.player.y,
      18,
      0x8df4ff,
      0.08
    )
    .setDepth(8);

this.playerEnergyGlow =
  playerEnergyGlow;

if (!this.motionReduced) {
  this.tweens.add({
    targets: playerEnergyGlow,
    scale: {
      from: 0.82,
      to: 1.18
    },
    alpha: {
      from: 0.05,
      to: 0.14
    },
    duration: 620,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut'
  });
}

const playerEnergyFollow =
  this.time.addEvent({
    delay: 16,
    loop: true,
    callback: () => {
      if (
        !this.player?.active ||
        !playerEnergyGlow?.active
      ) {
        playerEnergyFollow.remove();
        playerEnergyGlow?.destroy();
        return;
      }

      playerEnergyGlow.x =
        this.player.x;

      playerEnergyGlow.y =
        this.player.y + 4;

      const velocityX =
        Math.abs(
          this.player.body?.velocity?.x || 0
        );

      const speedFactor =
        Phaser.Math.Clamp(
          velocityX /
            RUNNER_TUNING.maxRunSpeed,
          0,
          1
        );

      playerEnergyGlow.alpha =
        this.motionReduced
          ? 0
          : 0.05 +
            speedFactor * 0.10;

      playerEnergyGlow.scaleX =
        0.9 +
        speedFactor * 0.18;

      playerEnergyGlow.scaleY =
        0.9 +
        speedFactor * 0.10;
    }
  });

this.playerEnergyFollow =
  playerEnergyFollow;


this.physics.add.collider(
  this.player,
  this.platforms
);

this.blaster = this.add
  .sprite(
    this.player.x + 22,
    this.player.y + 4,
    'blaster'
  )
  .setDepth(11);

this.cursors =
  this.input.keyboard.createCursorKeys();

this.keys =
  this.input.keyboard.addKeys(
    'A,D,W,S,E,Q,SPACE,SHIFT,ONE,TWO,THREE,FOUR,ESC'
  );

this.mobileActions = {
  jump: false,
  fire: false,
  sword: false,
  dash: false,
  build1: false,
  build2: false,
  gadget1: false,
  gadget2: false
};

this.mobileDirection = null;

this.mobileActionHandler = action => {
  if (action === 'build1') {
    return this.useBuild(0);
  }

  if (action === 'build2') {
    return this.useBuild(1);
  }

  if (action === 'gadget1') {
    return this.useGadget(0);
  }

  if (action === 'gadget2') {
    return this.useGadget(1);
  }

  if (action in this.mobileActions) {
    this.mobileActions[action] = true;
  }
};

this.mobileMoveHandler =
  direction => {
    this.mobileDirection = direction;
  };

this.game.events.on(
  'mobile-action',
  this.mobileActionHandler
);

this.game.events.on(
  'mobile-move',
  this.mobileMoveHandler
);

this.events.once(
  Phaser.Scenes.Events.SHUTDOWN,
  () => {
    this.game.events.off(
      'mobile-action',
      this.mobileActionHandler
    );

    this.game.events.off(
      'mobile-move',
      this.mobileMoveHandler
    );
  }
);

if (this.cinematicActive) {
  this.createOpeningCinematic();
} else {
  this.createMissionTransmission();
}

}

createRival() {
const rival =
rivalAppearances[this.mission.id];

if (!rival) return;

const sprite = this.add
  .sprite(
    this.mission.spawn.x + 80,
    this.mission.spawn.y - 64,
    'runner-run-a'
  )
  .setTint(0xb9f5ff)
  .setAlpha(.8)
  .setDepth(9);

// RIVAL FLOATING LABEL DISABLED

this.tweens.add({
  targets: sprite,
  x: this.mission.spawn.x + 500,
  alpha: .2,
  duration: 1800,
  onComplete: () => sprite.destroy()
});

// RIVAL RADIO FLOATING TEXT DISABLED

if (
  this.mission.id === 'signal-storm' ||
  this.mission.id === 'final-relay'
) {
  [135, 190].forEach(
    (offset, index) => {
      const echo = this.add
        .sprite(
          this.mission.spawn.x + offset,
          this.mission.spawn.y - 64,
          'runner-run-b'
        )
        .setTint(
          this.mission.id === 'final-relay'
            ? 0xffd06e
            : 0xb993ff
        )
        .setAlpha(
          .45 - index * .12
        )
        .setDepth(8);

      this.tweens.add({
        targets: echo,
        x: echo.x + 400,
        alpha: 0,
        duration: 2100 + index * 220,
        onComplete: () => echo.destroy()
      });
    }
  );
}

}

createSignals() {
this.signals = this.physics.add.group();

this.mission.signals.forEach(
  ([x, y], index) => {
    const signal = this.signals
      .create(
        x,
        y,
        'signal'
      )
      .setImmovable(true);

    signal.setData('id', index);

    signal.body
      .setAllowGravity(false)
      .setCircle(17, 11, 11);

    signal.setScale(.9);

    if (!this.motionReduced) {
      this.tweens.add({
        targets: signal,
        y: y - 9,
        scale: {
          from: .86,
          to: 1.02
        },
        duration: 720,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
    }
  }
);

this.physics.add.overlap(
  this.player,
  this.signals,
  (_, signal) =>
    this.collectSignal(signal),
  undefined,
  this
);

}

createSecrets() {
this.secrets =
this.physics.add.group();

this.mission.secrets.forEach(
  ([x, y], index) => {
    const secret = this.secrets
      .create(
        x,
        y,
        'signal'
      )
      .setImmovable(true)
      .setTint(0x8df4ff)
      .setScale(.72)
      .setData('id', index);

    secret.body
      .setAllowGravity(false)
      .setCircle(17, 11, 11);

    if (!this.motionReduced) {
      this.tweens.add({
        targets: secret,
        angle: 360,
        duration: 1800,
        repeat: -1
      });
    }
  }
);

this.physics.add.overlap(
  this.player,
  this.secrets,
  (_, secret) =>
    this.collectSecret(secret),
  undefined,
  this
);

}

createCheckpoints() {
this.checkpoints =
this.physics.add.staticGroup();

this.mission.checkpoints.forEach(
  ([x, y], index) => {
    const checkpoint =
      this.checkpoints.create(
        x,
        y,
        'checkpoint'
      )
        .setOrigin(.5, 1)
        .setData('index', index);

    checkpoint.refreshBody();
  }
);

this.physics.add.overlap(
  this.player,
  this.checkpoints,
  (_, checkpoint) =>
    this.activateCheckpoint(checkpoint),
  undefined,
  this
);

}

safeCheckpointSpawn(x) {
const platforms =
this.mission.platforms.map(
([platformX, platformY, width, height]) => ({
x: platformX,
y: platformY,
width,
height
})
);

const containing =
  platforms
    .filter(
      platform =>
        x >= platform.x + 26 &&
        x <=
          platform.x +
          platform.width -
          26
    )
    .sort(
      (left, right) =>
        left.y - right.y
    )[0];

const platform =
  containing ||
  platforms.reduce(
    (
      nearest,
      candidate
    ) =>
      Math.abs(
        candidate.x +
        candidate.width / 2 -
        x
      ) <
      Math.abs(
        nearest.x +
        nearest.width / 2 -
        x
      )
        ? candidate
        : nearest,
    platforms[0]
  );

return {
  x: Phaser.Math.Clamp(
    x,
    platform.x + 30,
    platform.x +
      platform.width -
      30
  ),
  y: platform.y - 46
};

}

updateRouteHints() {
this.checkpoints?.getChildren().forEach(
marker => {
const index =
marker.getData('index');

    if (
      !this.checkpointHints.has(index) &&
      Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        marker.x,
        marker.y
      ) < 165
    ) {
      this.checkpointHints.add(index);

      const pulse = this.add
        .circle(
          marker.x,
          marker.y - 20,
          10,
          0x8df4ff,
          .35
        )
        .setDepth(6);

      /*
 * ============================================================
 * CHECKPOINT BEACON FX
 * ============================================================
 */
if (!this.motionReduced) {
  const beaconRing =
    this.add
      .circle(
        marker.x,
        marker.y - 20,
        18,
        0x8df4ff,
        .08
      )
      .setDepth(5);

  beaconRing.setStrokeStyle(
    2,
    0xb9f5ff,
    .78
  );

  this.tweens.add({
    targets: beaconRing,
    scale: 3.8,
    alpha: 0,
    duration: 620,
    ease: 'Quad.out',
    onComplete: () =>
      beaconRing.destroy()
  });

  const beaconBeam =
    this.add
      .rectangle(
        marker.x,
        marker.y - 54,
        4,
        62,
        0x8df4ff,
        .16
      )
      .setDepth(5);

  this.tweens.add({
    targets: beaconBeam,
    scaleX: 2.4,
    alpha: 0,
    duration: 480,
    ease: 'Sine.out',
    onComplete: () =>
      beaconBeam.destroy()
  });
}

      this.tweens.add({
        targets: pulse,
        scale: 3,
        alpha: 0,
        duration: 420,
        onComplete: () =>
          pulse.destroy()
      });

    this.playerCue(
  'CHECKPOINT // NEAR',
  '#b9f5ff'
);

this.game.events.emit(
  'feedback',
  'checkpoint_near'
);
    }
  }
);

if (
  !this.goalHintShown &&
  this.player.x >=
    this.goal.x - 520
) {
  this.goalHintShown = true;

  const pulse = this.add
    .circle(
      this.goal.x + 20,
      this.goal.y + 22,
      18,
      0xffd06e,
      .3
    )
    .setDepth(11);

  this.tweens.add({
    targets: pulse,
    scale: 4,
    alpha: 0,
    duration: 550,
    onComplete: () =>
      pulse.destroy()
  });

  this.playerCue(
    'DELIVERY BEACON NEAR',
    '#ffd06e'
  );
  this.gadgetPulse(
  0xffd06e,
  10,
  320
);
}

}

createHazards() {
this.barriers =
this.physics.add.staticGroup();

this.mission.obstacles.forEach(
  ([x, y]) => {
    const barrier =
      this.barriers.create(
        x + 24,
        y + 32,
        'barrier'
      );
     }
);
 
this.physics.add.overlap(
this.player,
this.barriers,
(player, barrier) => {
if (!player?.active || !barrier?.active) return;
if (this.respawning || this.finished) return;

// One barrier contact = one gameplay decision.
if (barrier.__relayBarrierContactLock) return;

barrier.__relayBarrierContactLock = true;

const vaulted = this.tryVault();

if (!vaulted) {
  this.fail(
    'A live barrier cut the delivery short.'
  );
}

// Allow future contact after the current interaction has settled.
this.time.delayedCall(
  220,
  () => {
    if (barrier?.active) {
      barrier.__relayBarrierContactLock = false;
    }
  }
);

},
undefined,
this
);
}
createMovingGates() {
this.movingGates =
this.physics.add.group();

this.mission.movingGates.forEach(
  ([x, y, upperY, lowerY], index) => {
    const gate =
      this.movingGates.create(
        x,
        y,
        'barrier'
      )
        .setImmovable(true)
        .setDepth(8);

    gate.body.setAllowGravity(false);
    gate.setData('homeY', y);

    this.tweens.add({
      targets: gate,
      y: index % 2
        ? lowerY
        : upperY,
      duration:
        1600 + index * 240,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });
  }
);

this.physics.add.overlap(
  this.player,
  this.movingGates,
  () =>
    this.fail(
      'A security gate sealed the relay route.'
    ),
  undefined,
  this
);

}

createEnemies() {
this.enemies =
this.physics.add.group();

this.mission.enemies.forEach(
  data => {
    const enemy =
      this.enemies
        .create(
          data.x,
          data.y,
          data.type
        )
        .setDepth(8)
        .setImmovable(true);
    enemy.setData(
      'aiState',
      'IDLE'
    );

    enemy.setData(

'patrolOriginX',
enemy.x
);

    enemy.setData(
      'aiTimer',
      0
    );

    enemy.setData(

'lastKnownX',
enemy.x
);

    enemy.setData(

'lastKnownY',
enemy.y
);
const indicator =
this.add.circle(
data.x,
data.y - 30,
5,
0xff826e,
.28
)
.setStrokeStyle(
1,
0xffd5c5,
.7
)
.setDepth(7);

    enemy.body.setAllowGravity(false);
    enemy.setData('route', data);
    enemy.setData(
      'direction',
      1
    );
    enemy.setData(
      'indicator',
      indicator
    );
  }
);

}

createSciFiThreats() {
const tier =
Number(
this.mission.difficulty?.split('/')[0]
) || 1;

this.eggs =
  this.physics.add.group();

this.comets =
  this.physics.add.group();

const addThreat =
  (type, x, y) => {
    const enemy =
      this.enemies
        .create(
          x,
          y,
          type
        )
        .setDepth(8)
        .setImmovable(true);

    const indicator =
      this.add.circle(
        x,
        y - 34,
        5,
        0xff826e,
        .28
      )
        .setStrokeStyle(
          1,
          0xffd5c5,
          .7
        )
        .setDepth(7);

    enemy.body.setAllowGravity(false);
    enemy.setData(
      'route',
      {
        type,
        min: x - 90,
        max: x + 90
      }
    );
    enemy.setData(
      'direction',
      1
    );

    enemy.setData(

'patrolDirection',
1
);

    enemy.setData(
      'nextShot',
      500
    );
    enemy.setData(
      'indicator',
      indicator
    );

    return enemy;
  };

const startX =
  this.mission.spawn.x;

const firstRunner =
  addThreat(
    'enemy-runner',
    startX + 430,
    this.mission.spawn.y
  );

const firstChicken =
  addThreat(
    'chicken',
    startX + 700,
    this.mission.spawn.y + 10
  );

const routeLength =
  this.mission.goal.x -
  startX;

const encounterTypes =
  tier >= 5
    ? [
        'enemy-runner',
        'alien-ground',
        'dino',
        'invader',
        'chicken',
        'dino',
        'invader'
      ]
    : tier >= 3
      ? [
          'enemy-runner',
          'alien-ground',
          'dino',
          'invader',
          'enemy-runner'
        ]
      : tier === 2
        ? [
            'enemy-runner',
            'chicken',
            'dino',
            'alien-ground'
          ]
        : [
            'enemy-runner',
            'chicken',
            'dino',
            'alien-ground'
          ];

encounterTypes.forEach(
  (type, index) => {
    const x =
      startX +
      1040 +
      index *
        (
          routeLength - 1240
        ) /
        Math.max(
          1,
          encounterTypes.length -
            1
        );

    if (
      x <
      this.mission.goal.x -
        140
    ) {
      addThreat(
        type,
        x,
        type === 'invader'
          ? Math.max(
              180,
              this.mission.spawn.y -
                120
            )
          : this.mission.spawn.y
      );
    }
  }
);

if (this.mission.boss) {
  const profile =
    this.mission.boss;

  this.boss =
    addThreat(
      profile.type,
      this.mission.goal.x -
        250,
      this.mission.spawn.y -
        12
    );

  this.boss.setTint(
    profile.color
  );

  this.boss.setData(
    'health',
    profile.health
  );

   this.boss.setData(
    'boss',
    true
  );

  this.boss.setData(
    'bossName',
    profile.name
  );

  this.boss.setData(
    'bossColor',
    profile.color
  );

  // ============================================================
// BOSS · PREMIUM CORE PULSE
// ============================================================

if (!this.motionReduced) {
  this.tweens.add({
    targets: this.boss,
    alpha: {
      from: 0.92,
      to: 1
    },
    duration: 720,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut'
  });
}

  this.boss.setData(
    'attackCooldown',
    profile.attackCooldown
  );

// BOSS FLOATING LABEL DISABLED

if (
  this.mission.id ===
  'first-delivery'
) {

  // ENEMY FLOATING LABELS DISABLED

  const label = (enemy, text) =>
    this.add.zone(
      enemy.x,
      enemy.y - 62,
      1,
      1
    )
    .setAlpha(0)
    .setDepth(13);

}

this.physics.add.overlap(
  this.player,
  this.eggs,
  (_, egg) => {
    if (
      this.dashTimer > 0 &&
      this.perfectDodgeWindow > 0
    ) {
      egg.destroy();
      this.registerPerfectDodge();
      return;
    }

    egg.destroy();

    this.takeSciFiHit(
      'A chicken egg knocked the courier down.'
    );
  },
  undefined,
  this
);

this.physics.add.overlap(
  this.player,
  this.comets,
  (_, comet) => {
    if (
      this.dashTimer > 0 &&
      this.perfectDodgeWindow > 0
    ) {
      comet.destroy();
      this.registerPerfectDodge();
      return;
    }

    comet.destroy();

    this.takeSciFiHit(
      'A falling comet struck the relay route.'
    );
  },
  undefined,
  this
);

this.physics.add.overlap(
  this.player,
  this.enemies,
  (player, enemy) => {
    const stomp =
      player.body.velocity.y > 130 &&
      player.y <
        enemy.y - 12;

    if (stomp) {
      this.defeatEnemy(
        enemy,
        'STOMP'
      );
    } else {
      this.takeSciFiHit(
        'An enemy attack knocked the courier down.'
      );
    }
  },
  undefined,
  this
);

}

  }

createBuildSystems() {
  this.shields =
    this.physics.add.staticGroup();

  this.kineticBalls =
    this.physics.add.group();

this.plasma =
  this.physics.add.group();

this.turrets =
  this.physics.add.group();

this.springPads =
  this.physics.add.staticGroup();

const destroyBall =
  (_, ball) =>
    ball.destroy();

this.physics.add.overlap(
  this.kineticBalls,
  this.barriers,
  (ball, barrier) => {
    barrier.disableBody(
      true,
      true
    );

    const impact =
  this.add
    .circle(
      barrier.x,
      barrier.y,
      12,
      0x8df4ff,
      .35
    )
    .setDepth(12);

this.tweens.add({
  targets: impact,
  scale: 3.5,
  alpha: 0,
  duration: 220,
  onComplete: () =>
    impact.destroy()
});

    this.playerCue(
      'BARRIER DESTROYED',
      '#8df4ff'
    );

    this.gadgetPulse(
  0x8df4ff,
  10,
  280
);

    destroyBall(
      null,
      ball
    );
  }
);

this.physics.add.overlap(
  this.kineticBalls,
  this.movingGates,
  (ball, gate) => {
    gate.disableBody(
      true,
      true
    );

    const gateImpact =
  this.add
    .circle(
      gate.x,
      gate.y,
      12,
      0xff826e,
      .35
    )
    .setDepth(12);

this.tweens.add({
  targets: gateImpact,
  scale: 3.5,
  alpha: 0,
  duration: 220,
  onComplete: () =>
    gateImpact.destroy()
});

    this.playerCue(
      'GATE DESTROYED',
      '#8df4ff'
    );

    this.gadgetPulse(
  0x8df4ff,
  11,
  300
);

    destroyBall(
      null,
      ball
    );
  }
);

this.physics.add.overlap(
  this.kineticBalls,
  this.enemies,
  (ball, enemy) => {
    const impact =
      this.add
        .circle(
          enemy.x,
          enemy.y,
          11,
          0x8df4ff,
          .34
        )
        .setDepth(12);

    this.tweens.add({
      targets: impact,
      scale: 3.6,
      alpha: 0,
      duration: 210,
      onComplete: () =>
        impact.destroy()
    });

    this.shake(
      45,
      0.002
    );

    this.defeatEnemy(
      enemy,
      'KINETIC BALL',
      2
    );

    destroyBall(
      null,
      ball
    );
  }
);

this.physics.add.overlap(
  this.plasma,
  this.enemies,
  (plasma, enemy) => {
    const power =
      plasma.getData('power') ||
      1;

    plasma.destroy();

    this.defeatEnemy(
      enemy,
      'BLASTER',
      power
    );
  }
);

this.physics.add.overlap(
  this.plasma,
  this.eggs,
  (plasma, egg) => {
    plasma.destroy();
    egg.destroy();
    
    const deflectPulse =
  this.add
    .circle(
      egg.x,
      egg.y,
      9,
      0x8df4ff,
      .30
    )
    .setDepth(12);

this.tweens.add({
  targets: deflectPulse,
  scale: 3.2,
  alpha: 0,
  duration: 220,
  onComplete: () =>
    deflectPulse.destroy()
});

    this.playerCue(
      'SHOT DEFLECTED',
      '#8df4ff'
    );
    
    this.playerCue(
  '+1 DEFLECT',
  '#b9f5ff'
);
  }
);

this.physics.add.overlap(
  this.plasma,
  this.comets,
  (plasma, comet) => {
    plasma.destroy();
    comet.destroy();

    const cometPulse =
  this.add
    .circle(
      comet.x,
      comet.y,
      10,
      0x8df4ff,
      .30
    )
    .setDepth(12);

this.tweens.add({
  targets: cometPulse,
  scale: 3.4,
  alpha: 0,
  duration: 230,
  onComplete: () =>
    cometPulse.destroy()
});

    this.playerCue(
      'BOLT DEFLECTED',
      '#8df4ff'
    );
    
    this.playerCue(
  '+1 DEFLECT',
  '#b9f5ff'
);
  }
);

this.physics.add.overlap(
  this.eggs,
  this.shields,
  (egg, shield) => {
    egg.destroy();

    const shieldPulse =
      this.add
        .circle(
          shield.x,
          shield.y,
          10,
          0x8df4ff,
          .28
        )
        .setDepth(12);

    this.tweens.add({
      targets: shieldPulse,
      scale: 3,
      alpha: 0,
      duration: 200,
      onComplete: () =>
        shieldPulse.destroy()
    });

    this.playerCue(
  'SHIELD BLOCK',
  '#8df4ff'
);

this.gadgetPulse(
  0x8df4ff,
  9,
  260
);

    this.playerCue(
  'SHIELD BLOCK',
  '#8df4ff'
);

this.gadgetPulse(
  0x8df4ff,
  9,
  260
);
  }
);

this.physics.add.overlap(
  this.comets,
  this.shields,
  (comet, shield) => {
    comet.destroy();

    const shieldPulse =
      this.add
        .circle(
          shield.x,
          shield.y,
          10,
          0x8df4ff,
          .28
        )
        .setDepth(12);

    this.tweens.add({
      targets: shieldPulse,
      scale: 3,
      alpha: 0,
      duration: 200,
      onComplete: () =>
        shieldPulse.destroy()
    });
  }
);

this.physics.add.overlap(
  this.player,
  this.springPads,
  () => {
    if (this.boostCooldown > 0)
      return;

    this.boostCooldown = 260;

    this.player.body.setVelocityY(
      -880
    );

    this.playerCue(
  'SPRING LAUNCH',
  '#aee37f'
);

this.gadgetPulse(
  0xaee37f,
  12,
  320
);

    const springPulse =
  this.add
    .circle(
      this.player.x,
      this.player.y + 18,
      10,
      0xaee37f,
      .32
    )
    .setDepth(11);

this.tweens.add({
  targets: springPulse,
  scale: 3.4,
  alpha: 0,
  duration: 260,
  onComplete: () =>
    springPulse.destroy()
});

    this.playerCue(
      'SPRING PAD',
      '#aee37f'
    );
  }
);

}

takeSciFiHit(message) {
if (
this.briefingProtected ||
this.respawning ||
this.finished ||
this.healthInvulnerable > 0
) {
return;
}

this.health--;
  // ============================================================
// LOW HP · CRITICAL STATE
// ============================================================
if (
  this.health === 1 &&
  !this.motionReduced
) {
  this.playerCue(
    'CRITICAL',
    '#ff826e'
  );

  this.cameras.main.flash(
    120,
    255,
    70,
    70
  );

  this.shake(
    120,
    0.004
  );

  const criticalPulse =
    this.add
      .circle(
        this.player.x,
        this.player.y,
        20,
        0xff826e,
        .20
      )
      .setDepth(13);

  criticalPulse.setStrokeStyle(
    3,
    0xffa08f,
    .9
  );

  this.tweens.add({
    targets: criticalPulse,
    scale: 4.4,
    alpha: 0,
    duration: 520,
    ease: 'Quad.out',
    onComplete: () =>
      criticalPulse.destroy()
  });
}
this.healthInvulnerable = 1100;

this.game.events.emit(
  'health',
  this.health
);

  /*
 * ============================================================
 * DAMAGE IMPACT FX
 * ============================================================
 */
if (!this.motionReduced) {
  const impact =
    this.add
      .circle(
        this.player.x,
        this.player.y,
        11,
        0xff826e,
        .28
      )
      .setDepth(13);

  impact.setStrokeStyle(
    2,
    0xffc2b8,
    .85
  );

  this.tweens.add({
    targets: impact,
    scale: 3.8,
    alpha: 0,
    duration: 260,
    ease: 'Quad.out',
    onComplete: () =>
      impact.destroy()
  });

  this.player.setTint(
    0xff6f68
  );

  this.time.delayedCall(
    90,
    () => {
      if (
        this.player?.active &&
        this.health > 0
      ) {
        this.player.clearTint();
      }
    }
  );

  this.shake(
    85,
    .0035
  );
}
  
  if (
  this.health === 1 &&
  !this.motionReduced
) {
  this.cameras.main.flash(
    120,
    255,
    70,
    70
  );

  const dangerPulse =
    this.add
      .circle(
        this.player.x,
        this.player.y,
        18,
        0xff826e,
        .22
      )
      .setDepth(12);

  this.tweens.add({
    targets: dangerPulse,
    scale: 2.8,
    alpha: 0,
    duration: 360,
    onComplete: () =>
      dangerPulse.destroy()
  });
}

if (this.health <= 0) {
  this.fail(
    'The courier collapsed. Checkpoint health restored.'
  );
  return;
}

this.player.setTint(
  0xff826e
);

this.time.delayedCall(
  180,
  () =>
    this.player?.active &&
    this.player.clearTint()
);
if (!this.motionReduced) {
  this.cameras.main.flash(
    120,
    255,
    60,
    60
  );
}
  const damagePulse =
  this.add
    .circle(
      this.player.x,
      this.player.y,
      16,
      0xff826e,
      .30
    )
    .setDepth(11);

this.tweens.add({
  targets: damagePulse,
  scale: 3.2,
  alpha: 0,
  duration: 260,
  onComplete: () =>
    damagePulse.destroy()
});
this.playerCue(
  `HIT · ${this.health} HEALTH`,
  '#ff9c91'
);

this.shake(80, .006);

this.game.events.emit(
  'feedback',
  'hit'
);

}

useBuild(slot) {
const id =
this.loadout.buildItems?.[slot];

if (
  !id ||
  this.buildCooldowns[slot] > 0
) {
  return;
}

const direction =
  this.player.flipX
    ? -1
    : 1;

if (id === 'shield') {
  const shield =
    this.shields.create(
      this.player.x +
        direction * 70,
      this.player.y + 10,
      'shield'
    );

  shield.refreshBody();

  this.time.delayedCall(
    4200,
    () => shield.destroy()
  );

  this.playerCue(
    'RELAY SHIELD BUILT',
    '#b9f5ff'
  );

  this.buildCooldowns[slot] =
    9000;
}

if (id === 'kinetic-ball') {
  const ball =
    this.kineticBalls
      .create(
        this.player.x +
          direction * 28,
        this.player.y,
        'kinetic-ball'
      )
      .setDepth(12);

  ball.body
    .setAllowGravity(false)
    .setCircle(11, 2, 2)
    .setVelocityX(
      direction * 780
    );

  this.time.delayedCall(
    1400,
    () => ball.destroy()
  );

  this.playerCue(
    'KINETIC BALL',
    '#8df4ff'
  );

  this.buildCooldowns[slot] =
    7000;
}

if (id === 'turret') {
  const turret =
    this.turrets
      .create(
        this.player.x +
          direction * 90,
        this.player.y + 14,
        'turret'
      )
      .setDepth(9)
      .setImmovable(true);

  turret.body.setAllowGravity(false);
  turret.setData(
    'expires',
    this.elapsedMs + 6500
  );
  turret.setData(
    'nextShot',
    0
  );

  this.playerCue(
    'ARC TURRET DEPLOYED',
    '#8df4ff'
  );

  this.buildCooldowns[slot] =
    12000;
}

if (id === 'spring-pad') {
  const pad =
    this.springPads.create(
      this.player.x +
        direction * 58,
      this.player.y + 32,
      'spring-pad'
    );

  pad.refreshBody();

  this.time.delayedCall(
    6000,
    () => pad.destroy()
  );

  this.playerCue(
    'SPRING PAD BUILT',
    '#aee37f'
  );

  this.gadgetPulse(
  0xaee37f,
  10,
  300
);

  this.buildCooldowns[slot] =
    8000;
}

}

defeatEnemy(
enemy,
method,
power = 1
) {
if (!enemy?.active) return;
enemy.setTint(0xffffff);

this.time.delayedCall(
  90,
  () => {
    if (enemy?.active) {
      enemy.clearTint();
    }
  }
);

if (!enemy.getData('boss')) {
  this.game.events.emit(
    'feedback',
    'enemy_hit'
  );
}
  const hitPulse =
  this.add
    .circle(
      enemy.x,
      enemy.y,
      10,
      0x8df4ff,
      .28
    )
    .setDepth(11);

this.tweens.add({
  targets: hitPulse,
  scale: 2.8,
  alpha: 0,
  duration: 180,
  onComplete: () => hitPulse.destroy()
});

enemy.x +=
  this.player.x < enemy.x
    ? 10
    : -10;
 this.shake(
  55,
  0.0025
);
  const originalScaleX =
  enemy.scaleX;

const originalScaleY =
  enemy.scaleY;

this.tweens.add({
  targets: enemy,
  scaleX: originalScaleX * 1.12,
  scaleY: originalScaleY * 0.88,
  duration: 55,
  yoyo: true,
  ease: 'Quad.easeOut'
});
  
const health =
  enemy.getData('health');

if (health) {
  const isBoss =
  enemy.getData('boss') === true;

if (isBoss) {
  this.game.events.emit(
  'feedback',
  'boss_hit'
);
  const bossPulse =
    this.add
      .circle(
        enemy.x,
        enemy.y,
        18,
        enemy.getData('bossColor') ||
          0xff826e,
        .32
      )
      .setDepth(12);

  this.tweens.add({
    targets: bossPulse,
    scale: 3.6,
    alpha: 0,
    duration: 240,
    onComplete: () =>
      bossPulse.destroy()
  });

  this.shake(
    75,
    0.004
  );
}
  const comboMultiplier =

this.combatCombo >= 5
? 2
: this.combatCombo >= 3
? 1.5
: 1;

const finalPower =
power * comboMultiplier;
const remaining =
  health - finalPower;

  // ============================================================
// BOSS FINAL ENRAGE · 25% HP
// ============================================================
if (
  enemy.getData('boss') === true &&
  remaining > 0 &&
  remaining <= health * 0.25 &&
  enemy.getData('finalEnrage') !== true
) {
  enemy.setData(
    'finalEnrage',
    true
  );

  enemy.setData(
    'phase',
    3
  );

  const currentCooldown =
    Number(
      enemy.getData(
        'attackCooldown'
      )
    ) || 1800;

  enemy.setData(
    'attackCooldown',
    currentCooldown * .48
  );

  this.playerCue(
    'FINAL ENRAGE',
    '#ff4f5f'
  );

  this.gadgetPulse(
    0xff4f5f,
    30,
    900
  );

  if (!this.motionReduced) {
    this.cameras.main.flash(
      220,
      255,
      60,
      60
    );

    this.shake(
      260,
      0.012
    );

    const enrageBurst =
      this.add
        .circle(
          enemy.x,
          enemy.y,
          28,
          0xff4f5f,
          .26
        )
        .setDepth(13);

    enrageBurst.setStrokeStyle(
      3,
      0xffb0b0,
      .95
    );

    this.tweens.add({
      targets: enrageBurst,
      scale: 6.2,
      alpha: 0,
      duration: 760,
      ease: 'Quad.out',
      onComplete: () =>
        enrageBurst.destroy()
    });
  }

  this.game.events.emit(
    'feedback',
    'boss_final_enrage'
  );
}

  // ============================================================
// BOSS PHASE 2 · 50% HP TRANSITION
// ============================================================
if (
  isBoss &&
  !this.bossPhaseTwo &&
  remaining > 0 &&
  remaining <= health * 0.5
) {
  this.bossPhaseTwo = true;

  // ============================================================
// BOSS PHASE 2 · ENRAGE AURA
// ============================================================
this.bossPhaseAura?.destroy();
this.bossPhaseAuraFollow?.remove();

const bossAuraColor =
  enemy.getData('bossColor') ||
  0xff826e;

this.bossPhaseAura =
  this.add
    .circle(
      enemy.x,
      enemy.y,
      34,
      bossAuraColor,
      .12
    )
    .setDepth(10);

this.bossPhaseAura.setStrokeStyle(
  2,
  0xffcf82,
  .72
);

if (!this.motionReduced) {
  this.tweens.add({
    targets: this.bossPhaseAura,
    scale: {
      from: .86,
      to: 1.18
    },
    alpha: {
      from: .10,
      to: .24
    },
    duration: 520,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut'
  });
}

this.bossPhaseAuraFollow =
  this.time.addEvent({
    delay: 16,
    loop: true,
    callback: () => {
      if (
        !enemy.active ||
        !this.bossPhaseAura
      ) {
        this.bossPhaseAuraFollow?.remove();
        this.bossPhaseAuraFollow = null;
        this.bossPhaseAura?.destroy();
        this.bossPhaseAura = null;
        return;
      }

      this.bossPhaseAura.x = enemy.x;
      if (
  enemy.active &&
  !this.motionReduced
) {
  const baseY =
    enemy.getData('premiumBaseY');

  if (
    typeof baseY !== 'number'
  ) {
    enemy.setData(
      'premiumBaseY',
      enemy.y
    );
  } else {
    enemy.y =
      baseY +
      Math.sin(
        this.time.now * 0.0028
      ) * 4;
  }
}
      this.bossPhaseAura.y = enemy.y;
    }
  });
  
  enemy.setData(
    'phase',
    2
  );

  this.playerCue(
    'PHASE 2 // INCOMING',
    '#ff826e'
  );

  this.gadgetPulse(
    0xff826e,
    26,
    760
  );

  if (!this.motionReduced) {
    this.cameras.main.flash(
      180,
      255,
      130,
      110
    );

    this.shake(
      220,
      0.009
    );

    const phaseRing =
      this.add
        .circle(
          enemy.x,
          enemy.y,
          24,
          0xff826e,
          .24
        )
        .setDepth(13);

    phaseRing.setStrokeStyle(
      3,
      0xffcf82,
      .95
    );

    this.tweens.add({
      targets: phaseRing,
      scale: 5.8,
      alpha: 0,
      duration: 680,
      ease: 'Quad.out',
      onComplete: () =>
        phaseRing.destroy()
    });
  }

  this.game.events.emit(
    'feedback',
    'boss_phase_two'
  );
}
  
  enemy.setData(
    'health',
    remaining
  );

  enemy.setTint(
    0xff826e
  );

  this.time.delayedCall(
    100,
    () =>
      enemy.active &&
      enemy.setTint(
        enemy.getData('bossColor') ||
        0xffffff
      )
  );

  if (remaining > 0) {
    
    if (
  enemy.getData('boss') === true &&
  remaining === 1
) {
  const dangerPulse =
    this.add
      .circle(
        enemy.x,
        enemy.y,
        28,
        0xff826e,
        .22
      )
      .setDepth(12);

  this.tweens.add({
    targets: dangerPulse,
    scale: 2.4,
    alpha: 0,
    duration: 320,
    onComplete: () =>
      dangerPulse.destroy()
  });
}

    this.playerCue(
      `${method} · BOSS HIT`,
      '#ffcf82'
    );

    this.gadgetPulse(
  0xffcf82,
  15,
  360
);

    return;
  }

  if (!enemy.getData('boss')) {
  this.game.events.emit(
    'feedback',
    'enemy_defeated'
  );
}

  enemy
    .getData('label')
    ?.destroy();
  if (enemy.getData('boss') === true) {

    // ============================================================
// BOSS VICTORY ONCE-ONLY GUARD
// ============================================================
    
if (this.bossVictorySequence === true) {
  return;
}

this.bossVictorySequence = true;
    
    // ============================================================
// BOSS VICTORY INPUT LOCK
// ============================================================
    
this.bossVictoryLock = true;

if (this.player?.body) {
  this.player.body.setVelocity(0, 0);
}

this.input?.keyboard?.resetKeys?.();
    // ============================================================
// BOSS UI / PHASE CLEANUP
// ============================================================
if (this.bossHealthUI) {
  this.bossHealthUI.marker50?.destroy();
  this.bossHealthUI.marker25?.destroy();

  this.bossHealthUI.container?.destroy();

  this.bossHealthUI = null;
}

if (this.boss?.active) {
  this.boss.setData(
    'finalEnrage',
    false
  );

  this.boss.setData(
    'phase',
    0
  );
}

this.bossPhaseAura?.destroy?.();
this.bossPhaseAura = null;
  const deathBurst =
    this.add
      .circle(
        enemy.x,
        enemy.y,
        24,
        enemy.getData('bossColor') ||
          0xff826e,
        .42
      )
      .setDepth(13);

  this.tweens.add({
    targets: deathBurst,
    scale: 5,
    alpha: 0,
    duration: 420,
    onComplete: () =>
      deathBurst.destroy()
  });

  this.shake(
    180,
    0.008
  );
    
    // ============================================================
// BOSS PROJECTILE PURGE
// ============================================================
if (this.comets) {
  this.comets
    .getChildren()
    .forEach(projectile => {
      if (
        projectile.active &&
        projectile.getData('bossProjectile') === true
      ) {
        projectile.body?.setVelocity(0, 0);
        projectile.body?.setEnable(false);
        projectile.setActive(false);
        projectile.setVisible(false);
        projectile.destroy();
      }
    });
}
    
    // ============================================================
// BOSS FINAL KILL IMPACT
// ============================================================
    
this.playerCue(
  'BOSS DEFEATED',
  '#8df4ff'
);
    
    // ============================================================
// BOSS VICTORY BANNER
// ============================================================
    
if (!this.motionReduced) {
  const centerX =
    this.scale.width / 2;

  const centerY =
    this.scale.height / 2;

  const banner =
    this.add
      .container(
        centerX,
        centerY
      )
      .setScrollFactor(0)
      .setDepth(150)
      .setAlpha(0)
      .setScale(.82);

  const glow =
    this.add
      .rectangle(
        0,
        0,
        Math.min(
          this.scale.width - 40,
          420
        ),
        112,
        0x06111d,
        .96
      )
      .setStrokeStyle(
        2,
        0x8df4ff,
        .9
      );

  const accent =
    this.add
      .rectangle(
        0,
        -53,
        Math.min(
          this.scale.width - 40,
          420
        ),
        4,
        0x8df4ff,
        .95
      );

  const title =
    this.add
      .text(
        0,
        -18,
        'BOSS DEFEATED',
        {
          fontFamily:
            'Arial Black, Arial, sans-serif',
          fontSize: '28px',
          fontStyle: 'bold',
          color: '#8df4ff',
          stroke: '#02070d',
          strokeThickness: 6,
          align: 'center',
          resolution: 2
        }
      )
      .setOrigin(.5);

  const subtitle =
    this.add
      .text(
        0,
        18,
        'THREAT ELIMINATED',
        {
          fontFamily:
            'Arial, sans-serif',
          fontSize: '13px',
          fontStyle: 'bold',
          color: '#dcecff',
          letterSpacing: 2,
          align: 'center',
          resolution: 2
        }
      )
      .setOrigin(.5);

  const line =
    this.add
      .rectangle(
        0,
        40,
        170,
        2,
        0x8df4ff,
        .65
      );

  banner.add([
    glow,
    accent,
    title,
    subtitle,
    line
  ]);

  this.tweens.add({
    targets: banner,
    alpha: 1,
    scale: 1,
    duration: 420,
    ease: 'Back.out'
  });

  this.tweens.add({
    targets: accent,
    scaleX: .35,
    duration: 260,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut'
  });

  this.tweens.add({
    targets: banner,
    delay: 1500,
    alpha: 0,
    scale: 1.04,
    duration: 420,
    ease: 'Quad.in',
    onComplete: () => {
      banner.destroy();
    }
  });
}

this.gadgetPulse(
  0x8df4ff,
  36,
  1000
);

this.game.events.emit(
  'feedback',
  'boss_defeated'
);

if (!this.motionReduced) {
  const killFlash =
    this.add
      .rectangle(
        this.scale.width / 2,
        this.scale.height / 2,
        this.scale.width,
        this.scale.height,
        0x8df4ff,
        .18
      )
      .setScrollFactor(0)
      .setDepth(140);

  this.tweens.add({
    targets: killFlash,
    alpha: 0,
    duration: 520,
    ease: 'Quad.out',
    onComplete: () =>
      killFlash.destroy()
  });

  const killRing =
    this.add
      .circle(
        enemy.x,
        enemy.y,
        34,
        0x8df4ff,
        0
      )
      .setStrokeStyle(
        4,
        0x8df4ff,
        .95
      )
      .setDepth(18);

  this.tweens.add({
    targets: killRing,
    scale: 7,
    alpha: 0,
    duration: 900,
    ease: 'Cubic.out',
    onComplete: () =>
      killRing.destroy()
  });
}
    if (!this.motionReduced) {
  this.cameras.main.flash(
    220,
    255,
    208,
    110
  );
}
}
}

enemy
  .getData('indicator')
  ?.destroy();

const burst =
  this.add
    .circle(
      enemy.x,
      enemy.y,
      12,
      0x8df4ff,
      .65
    )
    .setDepth(13);

this.tweens.add({
  targets: burst,
  scale: 3,
  alpha: 0,
  duration: 220,
  onComplete: () =>
    burst.destroy()
});

enemy.disableBody(
  true,
  true
);

this.enemyDefeats =
  (this.enemyDefeats || 0) +
  1;

this.combatCombo =
  this.comboTimer > 0
    ? this.combatCombo + 1
    : 1;

this.comboTimer = 3000;

  /*
 * ============================================================
 * OVERDRIVE · COMBO x10
 * ============================================================
 */
if (
  this.combatCombo >= 10 &&
  this.overdriveTimer <= 0
) {
  this.overdriveTimer = 4200;

  this.playerCue(
    'OVERDRIVE',
    '#ffd06e'
  );

  this.gadgetPulse(
    0xffd06e,
    22,
    700
  );

  if (!this.motionReduced) {
    this.cameras.main.flash(
      150,
      255,
      208,
      110
    );

    this.shake(
      110,
      .005
    );

    const overdriveRing =
      this.add
        .circle(
          this.player.x,
          this.player.y,
          18,
          0xffd06e,
          .20
        )
        .setDepth(13);

    overdriveRing.setStrokeStyle(
      3,
      0xfff0a8,
      .9
    );

    this.tweens.add({
      targets: overdriveRing,
      scale: 5.2,
      alpha: 0,
      duration: 520,
      ease: 'Quad.out',
      onComplete: () =>
        overdriveRing.destroy()
    });
  }

  this.game.events.emit(
    'feedback',
    'overdrive'
  );
}

  /*
 * ============================================================
 * COMBO VISUAL PROGRESSION
 * ============================================================
 */
if (!this.motionReduced) {
  const comboLevel =
    this.combatCombo;

  const comboColor =
    comboLevel >= 10
      ? 0xffd06e
      : comboLevel >= 5
        ? 0xb993ff
        : 0x8df4ff;

  const comboPulse =
    this.add
      .circle(
        this.player.x,
        this.player.y,
        13 + comboLevel,
        comboColor,
        .18
      )
      .setDepth(13);

  comboPulse.setStrokeStyle(
    comboLevel >= 5 ? 2 : 1,
    comboColor,
    .78
  );

  this.tweens.add({
    targets: comboPulse,
    scale: comboLevel >= 10
      ? 4.8
      : comboLevel >= 5
        ? 4.2
        : 3.4,
    alpha: 0,
    duration: comboLevel >= 10
      ? 420
      : 300,
    ease: 'Quad.out',
    onComplete: () =>
      comboPulse.destroy()
  });

  this.playerCue(
    `COMBO x${comboLevel}`,
    comboLevel >= 10
      ? '#ffd06e'
      : comboLevel >= 5
        ? '#b993ff'
        : '#8df4ff'
  );

  if (comboLevel >= 5) {
    this.shake(
      comboLevel >= 10
        ? 95
        : 55,
      comboLevel >= 10
        ? .004
        : .002
    );
  }
}
  
if (this.combatCombo >= 3) {
  this.energy =
    Math.min(
      this.energyMax,
      this.energy + 4
    );
}

this.ammo =
  Math.min(
    this.ammoMax,
    this.ammo + 1
  );

this.game.events.emit(
  'ammo',
  this.ammo /
    this.ammoMax *
    100
);

this.game.events.emit(
  'combo',
  this.combatCombo,
  this.comboTimer
);

this.player.body.setVelocityY(
  method === 'STOMP'
    ? -360
    : this.player.body.velocity.y
);

this.playerCue(
  `${method} · ${
    this.combatCombo > 1
      ? `COMBO x${
          this.combatCombo
        }${
          this.combatCombo >= 3
            ? ' · +4 ENERGY'
            : ''
        }`
      : 'THREAT CLEARED'
  }`,
  '#8df4ff'
);

}

useBlaster() {
if (
this.blasterCooldown > 0 ||
this.cinematicActive
) {
return;
}

if (!this.ammo) {
  const reloadPulse =
    this.add
      .circle(
        this.player.x,
        this.player.y,
        13,
        0xffcf82,
        .28
      )
      .setDepth(12);

  this.tweens.add({
    targets: reloadPulse,
    scale: 3.8,
    alpha: 0,
    duration: 300,
    onComplete: () =>
      reloadPulse.destroy()
  });

  this.playerCue(
    'PLASMA RECHARGING',
    '#ffcf82'
  );

  this.gadgetPulse(
  0xffcf82,
  9,
  300
);

  this.game.events.emit(
    'feedback',
    'empty'
  );

  return;
}

const direction =
  this.player.flipX
    ? -1
    : 1;

const weapon =
  this.loadout.weapon ||
  'sidearm';

const spread =
  weapon === 'scattergun'
    ? [-150, 0, 150]
    : [0];

spread.forEach(
  vertical => {
    const plasma =
      this.plasma
        .create(
          this.player.x +
            direction * 30,
          this.player.y - 4,
          'plasma'
        )
        .setDepth(12)
        .setFlipX(
          direction < 0
        );

    plasma.body
      .setAllowGravity(false)
      .setVelocity(
        direction *
          (
            weapon ===
            'pulse-rifle'
              ? 980
              : 840
          ),
        vertical
      );

    plasma.setData(
      'power',
      weapon ===
      'pulse-rifle'
        ? 2
        : 1
    );

    this.time.delayedCall(
      900,
      () => plasma.destroy()
    );
  }
);

this.ammo--;

this.game.events.emit(
  'ammo',
  this.ammo /
    this.ammoMax *
    100
);

this.blasterCooldown =
  weapon === 'scattergun'
    ? 420
    : 240;

this.playerCue(
  weapon === 'sidearm'
    ? 'PLASMA FIRE'
    : weapon.toUpperCase(),
  '#8df4ff'
);

  if (!this.motionReduced) {
  const muzzleFlash =
    this.add
      .circle(
        this.player.x +
          (this.player.flipX ? -30 : 30),
        this.player.y - 4,
        7,
        0x8df4ff,
        .34
      )
      .setDepth(13);

  this.tweens.add({
    targets: muzzleFlash,
    scale: 2.6,
    alpha: 0,
    duration: 110,
    ease: 'Quad.out',
    onComplete: () =>
      muzzleFlash.destroy()
  });
}
  
this.game.events.emit(
  'feedback',
  'blaster_fire'
);

}

useSword() {
if (
this.swordCooldown > 0 ||
this.cinematicActive
) {
return;
}

const direction =
  this.player.flipX
    ? -1
    : 1;

const blade =
  this.add
    .sprite(
      this.player.x +
        direction * 38,
      this.player.y - 4,
      'sword'
    )
    .setDepth(13)
    .setFlipX(
      direction < 0
    )
    .setAngle(
      direction * -18
    );

this.tweens.add({
  targets: blade,
  angle: direction * 48,
  alpha: 0,
  duration: 170,
  onComplete: () =>
    blade.destroy()
});

this.enemies
  .getChildren()
  .filter(
    enemy =>
      enemy.active &&
      Math.abs(
        enemy.x -
        this.player.x
      ) < 92 &&
      Math.abs(
        enemy.y -
        this.player.y
      ) < 78
  )
  .forEach(
    enemy =>
      this.defeatEnemy(
        enemy,
        'SWORD',
        2
      )
  );

this.swordCooldown = 450;

this.playerCue(
  'SWORD ARC',
  '#ffd06e'
);

  this.game.events.emit(
  'feedback',
  'sword_swing'
);

  if (!this.motionReduced) {
  const swordFlash =
    this.add
      .circle(
        this.player.x +
          (this.player.flipX ? -22 : 22),
        this.player.y - 2,
        9,
        0xffd06e,
        .30
      )
      .setDepth(13);

  this.tweens.add({
    targets: swordFlash,
    scaleX: 2.8,
    scaleY: 1.4,
    alpha: 0,
    duration: 130,
    ease: 'Quad.out',
    onComplete: () =>
      swordFlash.destroy()
  });
}

}

createOpeningCinematic() {
const finish = () => {
if (!this.cinematicActive) {
return;
}

  this.cinematicActive = false;

  this.input.keyboard.off(
    'keydown-SPACE',
    this.cinematicSkipHandler
  );

  overlay.destroy(true);

  this.playerCue(
    'LANDING COMPLETE · E TO FIRE · STOMP FROM ABOVE',
    '#8df4ff'
  );
  this.createMissionTransmission();
};

const story =
  this.mission.story;

const width =
  this.scale.width;

const height =
  this.scale.height;

const compact =
  width < 700;

const panelWidth =
  compact
    ? Math.min(
        width - 32,
        420
      )
    : width - 44;

const panelHeight =
  compact
    ? Math.min(
        height - 48,
        340
      )
    : height - 64;

const panelX =
  compact
    ? (width -
        panelWidth) /
      2
    : 22;

const panelTop =
  (height -
    panelHeight) /
  2;

const textWidth =
  compact
    ? panelWidth - 62
    : Math.min(
        panelWidth - 62,
        width * .5
      );

const overlay =
  this.add
    .container(0, 0)
    .setScrollFactor(0)
    .setDepth(100);

const veil =
  this.add.rectangle(
    width / 2,
    height / 2,
    width,
    height,
    0x030711,
    compact
      ? .74
      : .34
  );

const panel =
  this.add.rectangle(
    panelX +
      panelWidth / 2,
    height / 2,
    panelWidth,
    panelHeight,
    0x050914,
    compact
      ? .94
      : .66
  ).setStrokeStyle(
    1,
    0x8df4ff,
    .55
  );

const panelShade =
  this.add.rectangle(
    panelX +
      panelWidth / 2,
    height / 2,
    panelWidth - 20,
    panelHeight - 20,
    0x0a1527,
    compact
      ? .45
      : .24
  ).setStrokeStyle(
    1,
    0x8df4ff,
    .12
  );

const topRail =
  this.add.rectangle(
    panelX + 30,
    panelTop + 24,
    48,
    3,
    0x8df4ff,
    .95
  ).setOrigin(0, .5);

const scanLine =
  this.add.rectangle(
    panelX +
      panelWidth / 2,
    panelTop + 52,
    panelWidth - 56,
    1,
    0x8df4ff,
    .26
  );

const planetX =
  compact
    ? width * .78
    : width * .79;

const planetY =
  height * .58;

const planetRadius =
  Math.min(
    width,
    height
  ) *
  (
    compact
      ? .2
      : .3
  );

const planetGlow =
  this.add.circle(
    planetX,
    planetY,
    planetRadius * 1.15,
    0x167baf,
    .1
  );

const planet =
  this.add.circle(
    planetX,
    planetY,
    planetRadius,
    0x162f58,
    .9
  ).setStrokeStyle(
    2,
    0x8df4ff,
    .72
  );

const atmosphere =
  this.add.circle(
    planetX,
    planetY,
    planetRadius * 1.08,
    0x8df4ff,
    .08
  ).setStrokeStyle(
    1,
    0x8df4ff,
    .35
  );

const earth =
  this.add.circle(
    width * .18,
    height * .18,
    Math.min(width, height) * .09,
    0x1b5d91,
    .95
  ).setStrokeStyle(
    2,
    0xb9f5ff,
    .7
  );

const earthCloud =
  this.add.circle(
    width * .18 - 12,
    height * .18 - 8,
    Math.min(width, height) * .072,
    0xdffcff,
    .13
  );

const subtitle =
  this.add.text(
    width / 2,
    height -
      (
        compact
          ? 34
          : 42
      ),
    'EARTH ORBIT · RELAY DISTRESS SIGNAL RECEIVED',
    {
      fontFamily: 'DM Mono',
      fontSize:
        compact
          ? '8px'
          : '11px',
      color: '#dffcff',
      stroke: '#08101c',
      strokeThickness: 4
    }
  )
    .setOrigin(.5)
    .setScrollFactor(0)
    .setDepth(102);

const stars =
  Array.from(
    {
      length:
        compact
          ? 12
          : 22
    },
    (_, index) =>
      this.add.circle(
        width *
          (
            .56 +
            (
              index * 37 %
              42
            ) /
            100
          ),
        34 +
          (
            index * 71 %
            Math.max(
              80,
              height - 68
            )
          ),
        index % 4 === 0
          ? 1.8
          : 1,
        0xb9f5ff,
        .18 +
          (
            index % 3
          ) *
          .12
      )
  );

const ship =
  this.add.triangle(
    -80,
    height * .31,
    0,
    20,
    60,
    38,
    0,
    56,
    0x8df4ff
  ).setStrokeStyle(
    2,
    0xdffcff
  );

const shipTrail =
  this.add.rectangle(
    -126,
    height * .31 + 38,
    90,
    2,
    0x8df4ff,
    .35
  ).setOrigin(0, .5);

const eyebrow =
  this.add.text(
    panelX + 30,
    panelTop +
      (
        compact
          ? 52
          : 76
      ),
    'RELAY // ORIENTATION',
    {
      fontFamily: 'DM Mono',
      fontSize:
        compact
          ? '9px'
          : '12px',
      color: '#8df4ff',
      letterSpacing: 2
    }
  );

const title =
  this.add.text(
    panelX + 30,
    panelTop +
      (
        compact
          ? 78
          : 108
      ),
    story?.chapter ||
      'NIGHT SHIFT // ARRIVAL',
    {
      fontFamily: 'DM Mono',
      fontSize:
        compact
          ? '16px'
          : '27px',
      color: '#dffcff',
      wordWrap: {
        width:
          textWidth
      }
    }
  );

const copy =
  this.add.text(
    panelX + 30,
    panelTop +
      (
        compact
          ? 116
          : 188
      ),
    story?.arrival ||
      'The relay planet went dark.\nOne courier enters the storm zone.',
    {
      fontFamily: 'DM Mono',
      fontSize:
        compact
          ? '10px'
          : '15px',
      wordWrap: {
        width:
          textWidth
      },
      lineSpacing:
        compact
          ? 5
          : 11,
      color: '#b9d5ee'
    }
  );

const routeBrief =
  this.add.text(
    panelX + 30,
    panelTop +
      (
        compact
          ? 174
          : 302
      ),
    compact
      ? 'FOLLOW THE GOLD SIGNALS. THEY MARK THE SAFE LINE.'
      : 'The relay is weak, but the gold Signals still cut through the dark. Keep moving and let the route reveal itself one rooftop at a time.',
    {
      fontFamily: 'DM Mono',
      fontSize:
        compact
          ? '8px'
          : '12px',
      color: '#8df4ff',
      wordWrap: {
        width:
          textWidth
      },
      lineSpacing:
        compact
          ? 3
          : 7
    }
  );

const runnerBrief =
  this.add.text(
    panelX + 30,
    panelTop +
      (
        compact
          ? 210
          : 358
      ),
    compact
      ? 'CHECKPOINTS SAVE YOUR RUN. MOMENTUM IS YOUR SHIELD.'
      : 'Checkpoint beacons remember your progress, so take the risky line, learn the rhythm and make the city answer back.',
    {
      fontFamily: 'DM Mono',
      fontSize:
        compact
          ? '8px'
          : '12px',
      color: '#ffd06e',
      wordWrap: {
        width:
          textWidth
      },
      lineSpacing:
        compact
          ? 3
          : 7
    }
  );

const controlsY =
  panelTop +
  panelHeight -
  (
    compact
      ? 76
      : 88
  );

const controls =
  this.add.text(
    panelX + 30,
    controlsY,
    'A / D  MOVE     SPACE  JUMP     E  PLASMA',
    {
      fontFamily: 'DM Mono',
      fontSize:
        compact
          ? '9px'
          : '11px',
      color: '#ffd06e',
      wordWrap: {
        width:
          textWidth
      },
      lineSpacing: 6
    }
  );

const skip =
  this.add.text(
    panelX + 30,
    panelTop +
      panelHeight -
      (
        compact
          ? 30
          : 36
      ),
    compact
      ? 'AUTO-CLOSE · 3 SEC'
      : 'SPACE · SKIP LANDING',
    {
      fontFamily: 'DM Mono',
      fontSize:
        compact
          ? '8px'
          : '11px',
      color: '#8df4ff'
    }
  );

const visuals = [
  earth,
  earthCloud,
  planetGlow,
  ...stars,
  atmosphere,
  planet
];

const panelElements = [
  panel,
  panelShade,
  topRail,
  scanLine,
  shipTrail,
  ship,
  eyebrow,
  title,
  copy,
  routeBrief,
  runnerBrief,
  controls,
  skip
];

overlay.add(
  compact
    ? [
        veil,
        ...visuals,
        ...panelElements
      ]
    : [
        veil,
        ...panelElements,
        ...visuals
      ]
);

this.tweens.add({
  targets: [
    ship,
    shipTrail
  ],
  x:
    compact
      ? width * .52
      : width * .58,
  y:
    height * .43,
  duration: 2600,
  ease: 'Cubic.out'
});

const narration = [
  [
    120,
    'Earth is behind you. The relay planet is calling.'
  ],
  [
    2100,
    'Descent corridor open. Follow the gold signals to the surface.'
  ],
  [
    3900,
    'Landing complete. Keep the line open.'
  ]
];

narration.forEach(
  ([delay, text]) =>
    this.time.delayedCall(
      delay,
      () => {
        if (!this.cinematicActive)
          return;

        subtitle.setText(
          text
        );

        this.game.events.emit(
          'narration',
          text
        );
      }
    )
);

if (!this.motionReduced) {
  this.tweens.add({
    targets: [
      earth,
      earthCloud
    ],
    alpha: 0,
    scale: .72,
    duration: 2500,
    ease: 'Cubic.in'
  });

  this.tweens.add({
    targets: atmosphere,
    scale: 1.08,
    alpha: .3,
    yoyo: true,
    repeat: -1,
    duration: 900
  });

  this.tweens.add({
    targets: planetGlow,
    scale: 1.14,
    alpha: .03,
    yoyo: true,
    repeat: -1,
    duration: 1250
  });

  this.tweens.add({
    targets: scanLine,
    alpha: {
      from: .14,
      to: .5
    },
    yoyo: true,
    repeat: -1,
    duration: 680
  });

  this.tweens.add({
    targets: stars,
    alpha: {
      from: .12,
      to: .62
    },
    yoyo: true,
    repeat: -1,
    duration: 1100,
    delay: (_, target) =>
      target.x % 240
  });
}

this.time.delayedCall(
  compact
    ? 3600
    : 5600,
  finish
);

this.cinematicSkipHandler =
  finish;

this.input.keyboard.once(
  'keydown-SPACE',
  this.cinematicSkipHandler
);

}

createMissionTransmission() {
  const story =
    this.mission.story;

  const chapter =
    story?.chapter ||
    'RUNNER TRANSMISSION';

  const objective =
    story?.arrival ||
    'Keep moving, read the route and protect the relay.';

  const panel =
    this.add
      .container(36, 520)
      .setScrollFactor(0)
      .setDepth(30);

  const plate =
    this.add.rectangle(
      280,
      68,
      520,
      112,
      0x07101f,
      .88
    ).setStrokeStyle(
      1,
      0x8df4ff,
      .45
    );

  const label =
    this.add.text(
      40,
      28,
      '',
      {
        fontFamily: 'DM Mono',
        fontSize: '12px',
        color: '#8df4ff'
      }
    );

  const copy =
    this.add.text(
      40,
      54,
      '',
      {
        fontFamily: 'DM Mono',
        fontSize: '12px',
        color: '#dffcff',
        wordWrap: {
          width: 440
        },
        lineSpacing: 5
      }
    );

  panel.add([
    plate,
    label,
    copy
  ]);

  panel.setAlpha(0);

  this.tweens.add({
    targets: panel,
    alpha: 1,
    x: 58,
    duration: 340,
    ease: 'Cubic.out'
  });

  // TYPEWRITER — MISSION CHAPTER
this.tweens.addCounter({
  from: 0,
  to: chapter.length,
  duration: Math.max(
    500,
    chapter.length * 38
  ),
  onUpdate: tween => {
    if (!panel.active) return;

    const count =
      Math.floor(tween.getValue());

    label.setText(
      chapter.slice(0, count)
    );
  }
});
    this.time.delayedCall(
    Math.max(
      550,
      chapter.length * 38
    ),
    () => {
      if (!panel.active) return;

      this.tweens.addCounter({
        from: 0,
        to: objective.length,
        duration: Math.max(
          900,
          objective.length * 28
        ),
        onUpdate: tween => {
          if (!panel.active) return;

          const count =
            Math.floor(tween.getValue());

          copy.setText(
            objective.slice(0, count)
          );
        }
      });
    }
  );

  this.tweens.add({
    targets: panel,
    alpha: 0,
   delay: Math.max(
  3900,
  Math.max(550, chapter.length * 38) +
  Math.max(900, objective.length * 28) +
  300
),
    duration: 500,
    onComplete: () =>
      panel.destroy()
  });
}

createBoostPads() {
this.boostPads =
this.physics.add.staticGroup();

this.mission.boostPads.forEach(
  ([x, y]) => {
    const pad =
      this.boostPads.create(
        x,
        y,
        'boost-pad'
      );

    pad.refreshBody();
  }
);

this.physics.add.overlap(
  this.player,
  this.boostPads,
  () => {
    if (
      this.boostCooldown > 0 ||
      this.player.body.velocity.y <
        -60
    ) {
      return;
    }

    this.boostCooldown = 260;

    this.player.body.setVelocityY(
      -825
    );

    this.playerCue(
  'BOOST LAUNCH',
  '#8df4ff'
);

this.gadgetPulse(
  0x8df4ff,
  12,
  320
);

    const boostPulse =
  this.add
    .circle(
      this.player.x,
      this.player.y + 20,
      10,
      0x8df4ff,
      .32
    )
    .setDepth(11);

this.tweens.add({
  targets: boostPulse,
  scale: 3.6,
  alpha: 0,
  duration: 240,
  onComplete: () =>
    boostPulse.destroy()
});

    this.dust.emitParticleAt(
      this.player.x,
      this.player.y + 24,
      7
    );

    this.game.events.emit(
      'feedback',
      'jump'
    );
  },
  undefined,
  this
);

}

createChaser() {
if (
!this.mission.chase &&
!this.mission.enemies.length
) {
return;
}

this.chaser =
  this.physics.add.sprite(
    this.mission.spawn.x - 220,
    this.mission.spawn.y,
    'chaser'
  )
    .setDepth(9)
    .setVisible(false);

this.chaser.body
  .setAllowGravity(false)
  .setSize(34, 52)
  .setOffset(9, 4)
  .setEnable(false);

this.chaseSection = -1;

this.physics.add.overlap(
  this.player,
  this.chaser,
 () => {
  if (!this.motionReduced) {
    this.cameras.main.flash(
      180,
      255,
      60,
      60
    );
  }

  const hitPulse =
    this.add
      .circle(
        this.player.x,
        this.player.y,
        16,
        0xff826e,
        .34
      )
      .setDepth(13);

  this.tweens.add({
    targets: hitPulse,
    scale: 3.8,
    alpha: 0,
    duration: 260,
    onComplete: () =>
      hitPulse.destroy()
  });

  this.shake(
    120,
    0.006
  );

  this.fail(
    'The interceptor reclaimed the signal.'
  );
},
  undefined,
  this
);

}

updateChaser(delta) {
if (!this.chaser) return;

const sections =
  this.mission.chase?.sections ||
  [];

sections.forEach(
  (section, index) => {
    if (
      !this.chaseWarnings.has(index) &&
      this.player.x >=
        section.start - 260 &&
      this.player.x <
        section.start
    ) {
      this.chaseWarnings.add(
        index
      );

  // CHASE AHEAD FLOATING LABEL DISABLED

const cue = this.add.zone(
section.start - 235,
250,
1,
1
)
.setAlpha(0)
.setDepth(13);

      this.tweens.add({
        targets: cue,
        alpha: 0,
        delay: 1300,
        duration: 500,
        onComplete: () =>
          cue.destroy()
      });
    }
  }
);

let sectionIndex =
  sections.findIndex(
    section =>
      this.player.x >=
        section.start &&
      this.player.x <=
        section.end
  );

const alarmSection =
  sectionIndex === -1 &&
  this.alarmTimer > 0
    ? {
        start: 0,
        end: this.worldWidth,
        speed: 260
      }
    : null;

if (alarmSection) {
  sectionIndex = -2;
}

if (sectionIndex === -1) {
  if (
    this.chaseSection !==
    -1
  ) {
    this.chaseEscapes++;

    this.chaser.setVisible(
      false
    );

    this.chaser.body.setEnable(
      false
    );

    this.chaseSection = -1;

    this.game.events.emit(
      'chase',
      false
    );
  }

  return;
}

const section =
  alarmSection ||
  sections[sectionIndex];

if (
  sectionIndex !==
  this.chaseSection
) {
  this.chaseSection =
    sectionIndex;

  this.chaser
    .setPosition(
      this.player.x - 210,
      this.player.y
    )
    .setVisible(true);

  this.chaser.body
    .setEnable(true)
    .updateFromGameObject();

  // INTERCEPTOR LOCK TEXT DISABLED

// Keep the original tween timing/animation flow without rendering text.
const cue = this.add.zone(
this.player.x,
this.player.y - 78,
1,
1
)
.setAlpha(0)
.setDepth(13);

this.tweens.add({
targets: cue,
y: cue.y - 20,
alpha: 0,
duration: 620,
onComplete: () => cue.destroy()
});

  this.game.events.emit(
    'feedback',
    'chase'
  );

  this.game.events.emit(
    'chase',
    true
  );
}

const targetX =
  this.player.x - 38;

this.chaser.x =
  Math.min(
    targetX,
    this.chaser.x +
      section.speed *
        delta /
        1000
  );

this.chaser.y =
  Phaser.Math.Linear(
    this.chaser.y,
    this.player.y,
    .12
  );

this.chaser.body.updateFromGameObject();

}

createGoal() {
this.goal =
this.physics.add
.staticImage(
this.mission.goal.x,
this.mission.goal.y,
'goal'
)
.setOrigin(0, 0);

this.goal.refreshBody();

  /*
 * DELIVERY BEACON FX
 */
const beaconGlow =
  this.add
    .circle(
      this.goal.x + 28,
      this.goal.y + 34,
      28,
      0xffd06e,
      0.08
    )
    .setDepth(7);

const beaconRing =
  this.add
    .circle(
      this.goal.x + 28,
      this.goal.y + 34,
      22,
      0xffd06e,
      0
    )
    .setStrokeStyle(
      2,
      0xffe0a8,
      0.55
    )
    .setDepth(8);

if (!this.motionReduced) {
  this.tweens.add({
    targets: beaconGlow,
    scale: {
      from: 0.75,
      to: 1.45
    },
    alpha: {
      from: 0.04,
      to: 0.18
    },
    duration: 900,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut'
  });

  this.tweens.add({
    targets: beaconRing,
    scale: {
      from: 0.75,
      to: 1.9
    },
    alpha: {
      from: 0.6,
      to: 0
    },
    duration: 1100,
    repeat: -1,
    ease: 'Quad.out'
  });
}

const beaconFollow =
  this.time.addEvent({
    delay: 16,
    loop: true,
    callback: () => {
      if (
        !this.goal?.active ||
        !beaconGlow?.active ||
        !beaconRing?.active
      ) {
        beaconFollow.remove();
        beaconGlow?.destroy();
        beaconRing?.destroy();
        return;
      }

      beaconGlow.x =
        this.goal.x + 28;

      beaconGlow.y =
        this.goal.y + 34;

      beaconRing.x =
        this.goal.x + 28;

      beaconRing.y =
        this.goal.y + 34;
    }
  });

this.goalBeaconFollow =
  beaconFollow;
  
if (!this.motionReduced) {
  this.tweens.add({
    targets: this.goal,
    scaleX: 1.06,
    scaleY: 1.06,
    duration: 680,
    yoyo: true,
    repeat: -1
  });
}

this.physics.add.overlap(
  this.player,
  this.goal,
  () => {
  if (this.goalTouched) {
  return;
}

this.goalTouched = true;
    const arrivalLabel =
  this.add
    .text(
      this.goal.x + 28,
      this.goal.y - 18,
      'DELIVERY LOCK',
      {
        fontFamily: 'DM Mono',
        fontSize: '10px',
        color: '#ffd06e',
        stroke: '#08101c',
        strokeThickness: 3
      }
    )
    .setOrigin(.5)
    .setDepth(14);

this.tweens.add({
  targets: arrivalLabel,
  y: arrivalLabel.y - 18,
  alpha: 0,
  duration: 650,
  ease: 'Quad.out',
  onComplete: () =>
    arrivalLabel.destroy()
});
    const goalBurst =
      this.add
        .circle(
          this.goal.x + 28,
          this.goal.y + 34,
          18,
          0xffd06e,
          .38
        )
        .setDepth(13);

    this.tweens.add({
      targets: goalBurst,
      scale: 4.5,
      alpha: 0,
      duration: 420,
      onComplete: () =>
        goalBurst.destroy()
    });

    if (!this.motionReduced) {
      this.cameras.main.flash(
        180,
        255,
        208,
        110
      );
    }

    this.shake(
      120,
      0.005
    );

    this.complete();
  },
  undefined,
  this
);

}

createAtmosphere() {
this.rain =
this.add
.particles(
0,
0,
'rain',
{
x: {
min: 0,
max: 1350
},
y: -10,
speedY: {
min: 320,
max: 470
},
speedX: -55,
lifespan: 1700,
frequency: 35,
quantity: 1,
scale: {
start: .55,
end: .55
},
alpha: {
start: .5,
end: 0
},
blendMode: 'ADD'
}
)
.setScrollFactor(.4)
.setVisible(
this.rainEnabled
);

this.dust =
  this.add.particles(
    0,
    0,
    'dust',
    {
      speedX: {
        min: -45,
        max: 45
      },
      speedY: {
        min: -15,
        max: -70
      },
      lifespan: 350,
      quantity: 0,
      scale: {
        start: .7,
        end: 0
      },
      alpha: {
        start: .4,
        end: 0
      }
    }
  );

this.speedLines =
  this.add.particles(
    0,
    0,
    'speed-line',
    {
      speedX: {
        min: -220,
        max: -130
      },
      speedY: {
        min: -12,
        max: 12
      },
      lifespan: 210,
      quantity: 0,
      scale: {
        start: .7,
        end: .15
      },
      alpha: {
        start: .42,
        end: 0
      },
      blendMode: 'ADD'
    }
  );

const weather = {
  'first-delivery': [
    'NIGHT RAIN',
    0x6d8faa
  ],
  'dead-drop': [
    'HARBOR FOG',
    0xb7d4df
  ],
  blackout: [
    'GRID FLICKER',
    0x8df4ff
  ],
  pursuit: [
    'CROSSWIND',
    0x8ba2c4
  ],
  'signal-storm': [
    'SIGNAL STORM',
    0xb993ff
  ],
  'corporate-lockdown': [
    'ASH FRONT',
    0xff826e
  ],
  'final-relay': [
    'ORBITAL STATIC',
    0xffe0a8
  ]
}[this.mission.id];

this.weatherOverlay =
  this.add
    .rectangle(
      640,
      360,
      1280,
      720,
      weather[1],
      .045
    )
    .setScrollFactor(0)
    .setDepth(18)
    .setBlendMode(
      Phaser.BlendModes.ADD
    );

}

updateWeather(delta) {
  this.weatherTimer += delta;

  if (this.weatherTimer < 6200)
    return;

  this.weatherTimer = 0;

  this.weatherPhase =
    (this.weatherPhase + 1) % 2;

  const intense =
    this.weatherPhase === 1;

  this.weatherOverlay?.setAlpha(
    intense
      ? .14
      : .045
  );


if (
  intense &&
  this.mission.id ===
    'signal-storm'
) {
  this.cameras.main.flash(
    100,
    160,
    120,
    255
  );

  this.game.events.emit(
    'feedback',
    'warning'
  );
}

if (
  intense &&
  this.mission.id ===
    'pursuit'
) {
  this.playerCue(
    'CROSSWIND · HOLD YOUR LINE',
    '#b9f5ff'
  );

  this.gadgetPulse(
  0x8ba2c4,
  9,
  300
);
}

}

createGuides() {
this.mission.guides?.forEach(
({ x, y, text }) => {
const guide = this.add.zone(
x,
y,
1,
1
)
.setAlpha(0)
.setDepth(2);

    if (!this.motionReduced) {
      this.tweens.add({
        targets: guide,
        alpha: {
          from: .9,
          to: .25
        },
        y: y - 5,
        duration: 900,
        yoyo: true,
        repeat: -1
      });
    }
  }
);

}

createGuideCompanions() {
  const placements =
    this.mission.id ===
    'first-delivery'
      ? [
          [
            360,
            470,
            'alien-guide',
            'ALIEN SCOUT · FOLLOW THE GOLD SIGNALS'
          ],
          [
            1720,
            470,
            'guide-drone',
            'GUIDE DRONE · CHECKPOINTS SAVE YOUR RUN'
          ]
        ]
      : [
          [
            this.mission.spawn.x + 540,
            470,
            'guide-drone',
            'ROUTE GUIDE · ENERGY AND HEALTH RESTORED'
          ],
          [
            this.mission.goal.x - 620,
            430,
            'alien-guide',
            'ALIEN SCOUT · THE RELAY IS CLOSE'
          ]
        ];

  this.guideCompanions =
    this.physics.add.group();

  placements.forEach(
    ([x, y, texture, lesson]) => {
      const guide =
        this.guideCompanions
          .create(
            x,
            y,
            texture
          )
          .setDepth(9)
          .setData(
            'lesson',
            lesson
          );

      guide.body
        .setAllowGravity(false)
        .setCircle(
          14,
          6,
          5
        );

      guide.setData(
        'baseY',
        y
      );

      guide.setData(
        'proximityCooldown',
        0
      );

      guide.setData(
        'blinkCooldown',
        Phaser.Math.Between(
          1600,
          3200
        )
      );

      /*
       * BASIC FLOATING
       */
      if (!this.motionReduced) {
        this.tweens.add({
          targets: guide,
          y: y - 12,
          duration: 760,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });
      }

      /*
 * FLOATING SHADOW
 */
const shadow =
  this.add
    .ellipse(
      guide.x,
      y + 25,
      34,
      9,
      texture === 'alien-guide'
        ? 0x120c1d
        : 0x06131f,
      0.38
    )
    .setDepth(4);

guide.setData(
  'shadow',
  shadow
);

if (!this.motionReduced) {
  this.tweens.add({
    targets: shadow,
    scaleX: {
      from: 0.72,
      to: 1.08
    },
    scaleY: {
      from: 0.72,
      to: 1
    },
    alpha: {
      from: 0.2,
      to: 0.42
    },
    duration: 760,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut'
  });
}

const shadowFollow =
  this.time.addEvent({
    delay: 16,
    loop: true,
    callback: () => {
      if (
        !guide.active ||
        !shadow.active
      ) {
        shadowFollow.remove();
        shadow.destroy();
        return;
      }

      shadow.x = guide.x;
      shadow.y = guide.y + 25;
    }
  });

guide.setData(
  'shadowTimer',
  shadowFollow
);

      /*
 * MISSION-SPECIFIC SIGNAL
 */
const missionSignal =
  this.add
    .circle(
      guide.x,
      guide.y,
      7,
      this.mission.id === 'signal-storm'
        ? 0xb993ff
        : this.mission.id === 'pursuit'
          ? 0xff826e
          : this.mission.id === 'final-relay'
            ? 0xffd06e
            : 0x8df4ff,
      0.16
    )
    .setDepth(7);

guide.setData(
  'missionSignal',
  missionSignal
);

if (!this.motionReduced) {
  this.tweens.add({
    targets: missionSignal,
    scale: {
      from: 0.7,
      to:
        this.mission.id === 'final-relay'
          ? 1.8
          : 1.45
    },
    alpha: {
      from: 0.08,
      to:
        this.mission.id === 'signal-storm'
          ? 0.34
          : 0.22
    },
    duration:
      this.mission.id === 'signal-storm'
        ? 560
        : this.mission.id === 'pursuit'
          ? 420
          : 760,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut'
  });
}

const missionSignalFollow =
  this.time.addEvent({
    delay: 16,
    loop: true,
    callback: () => {
      if (
        !guide.active ||
        !missionSignal.active
      ) {
        missionSignalFollow.remove();
        missionSignal.destroy();
        return;
      }

      missionSignal.x = guide.x;
      missionSignal.y = guide.y;
    }
  });

guide.setData(
  'missionSignalTimer',
  missionSignalFollow
);

      /*
       * FX CONTAINER
       * Keeps all companion effects together
       * and makes cleanup automatic.
       */
      const fx =
        this.add
          .container(
            guide.x,
            guide.y
          )
          .setDepth(8);

      guide.setData(
        'fxContainer',
        fx
      );

      /*
       * ==========================
       * ALIEN GUIDE FX
       * ==========================
       */
      if (
        !this.motionReduced &&
        texture === 'alien-guide'
      ) {
        const alienAura =
          this.add
            .circle(
              0,
              0,
              30,
              0xb993ff,
              0.07
            );

        const alienGlow =
          this.add
            .circle(
              0,
              0,
              23,
              0xe0a7ff,
              0.08
            );

        const alienRing =
          this.add
            .circle(
              0,
              0,
              18,
              0x8df4ff,
              0
            )
            .setStrokeStyle(
              1.5,
              0xb993ff,
              0.72
            );

        const alienCore =
          this.add
            .circle(
              0,
              5,
              4,
              0xe8fdff,
              0.9
            );

        const alienSignal =
          this.add
            .circle(
              0,
              5,
              9,
              0x8df4ff,
              0
            )
            .setStrokeStyle(
              1.5,
              0x8df4ff,
              0.55
            );

        const blinkBar =
          this.add
            .rectangle(
              0,
              -7,
              30,
              3,
              0x24152f,
              0
            );

        fx.add([
          alienAura,
          alienGlow,
          alienRing,
          alienSignal,
          alienCore,
          blinkBar
        ]);

        guide.setData(
          'alienFx',
          {
            alienAura,
            alienGlow,
            alienRing,
            alienSignal,
            alienCore,
            blinkBar
          }
        );

        this.tweens.add({
          targets: alienAura,
          scale: {
            from: 0.92,
            to: 1.12
          },
          alpha: {
            from: 0.05,
            to: 0.16
          },
          duration: 1050,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });

        this.tweens.add({
          targets: alienGlow,
          scale: {
            from: 0.92,
            to: 1.08
          },
          alpha: {
            from: 0.06,
            to: 0.18
          },
          duration: 820,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });

        this.tweens.add({
          targets: alienRing,
          scale: {
            from: 0.82,
            to: 1.45
          },
          alpha: {
            from: 0.68,
            to: 0
          },
          duration: 1100,
          repeat: -1,
          ease: 'Sine.out'
        });

        this.tweens.add({
          targets: alienSignal,
          scale: {
            from: 0.75,
            to: 1.35
          },
          alpha: {
            from: 0.65,
            to: 0
          },
          duration: 760,
          repeat: -1,
          ease: 'Sine.out'
        });

        this.tweens.add({
          targets: alienCore,
          scale: {
            from: 0.85,
            to: 1.3
          },
          alpha: {
            from: 0.55,
            to: 1
          },
          duration: 620,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });

        /*
         * Follow guide
         */
        const followTimer =
          this.time.addEvent({
            delay: 16,
            loop: true,
            callback: () => {
              if (
                !guide.active ||
                !fx.active
              ) {
                followTimer.remove();
                fx.destroy();
                return;
              }

              fx.setPosition(
                guide.x,
                guide.y
              );

              const distance =
                Phaser.Math.Distance.Between(
                  this.player.x,
                  this.player.y,
                  guide.x,
                  guide.y
                );

              /*
               * PROXIMITY REACTION
               */
              if (
                distance < 130 &&
                guide.getData(
                  'proximityCooldown'
                ) <= 0
              ) {
                guide.setData(
                  'proximityCooldown',
                  900
                );

                const nearbyColor =
  texture === 'alien-guide'
    ? '#e0a7ff'
    : '#8df4ff';

const nearbyLabel =
  this.add
    .text(
      guide.x,
      guide.y - 46,
      texture === 'alien-guide'
        ? '◈ ALLY DETECTED'
        : '◈ DRONE LINK',
      {
        fontFamily: 'DM Mono',
        fontSize: '9px',
        color: nearbyColor,
        stroke: '#08101c',
        strokeThickness: 4
      }
    )
    .setOrigin(.5)
    .setDepth(15)
    .setAlpha(0);

this.tweens.add({
  targets: nearbyLabel,
  alpha: {
    from: 0,
    to: 1
  },
  y: nearbyLabel.y - 7,
  duration: 140,
  ease: 'Quad.out'
});

this.time.delayedCall(
  520,
  () => {
    if (!nearbyLabel.active)
      return;

    this.tweens.add({
      targets: nearbyLabel,
      alpha: 0,
      y: nearbyLabel.y - 5,
      duration: 220,
      onComplete: () =>
        nearbyLabel.destroy()
    });
  }
);

                this.tweens.add({
                  targets: guide,
                  scaleX: 1.12,
                  scaleY: 1.12,
                  duration: 110,
                  yoyo: true,
                  ease: 'Sine.inOut'
                });

                this.tweens.add({
                  targets: alienSignal,
                  scale: {
                    from: 1,
                    to: 2.1
                  },
                  alpha: {
                    from: 0.85,
                    to: 0
                  },
                  duration: 380,
                  ease: 'Quad.out'
                });

                this.tweens.add({
                  targets: alienCore,
                  scale: {
                    from: 1,
                    to: 1.9
                  },
                  alpha: {
                    from: 1,
                    to: 0.2
                  },
                  duration: 260,
                  yoyo: true,
                  ease: 'Sine.inOut'
                });
              }

              const nextCooldown =
                Math.max(
                  0,
                  (guide.getData(
                    'proximityCooldown'
                  ) || 0) - 16
                );

              guide.setData(
                'proximityCooldown',
                nextCooldown
              );

              /*
               * EYE BLINK
               */
              const blinkCooldown =
                guide.getData(
                  'blinkCooldown'
                ) || 0;

              if (
                blinkCooldown <= 0
              ) {
                guide.setData(
                  'blinkCooldown',
                  Phaser.Math.Between(
                    2200,
                    4300
                  )
                );

                this.tweens.add({
                  targets: blinkBar,
                  alpha: {
                    from: 0,
                    to: 0.92
                  },
                  scaleY: {
                    from: 0.2,
                    to: 1
                  },
                  duration: 70,
                  yoyo: true,
                  hold: 45,
                  ease: 'Quad.inOut'
                });
              } else {
                guide.setData(
                  'blinkCooldown',
                  Math.max(
                    0,
                    blinkCooldown - 16
                  )
                );
              }
            }
          });

        guide.setData(
          'fxTimer',
          followTimer
        );
      }

      /*
       * ==========================
       * DRONE GUIDE FX
       * ==========================
       */
      if (
        !this.motionReduced &&
        texture === 'guide-drone'
      ) {
        const droneGlow =
          this.add
            .circle(
              0,
              0,
              23,
              0x8df4ff,
              0.08
            );

        const dronePulse =
          this.add
            .circle(
              0,
              0,
              11,
              0x8df4ff,
              0.14
            );

        const corePulse =
          this.add
            .circle(
              0,
              0,
              5,
              0xe8fdff,
              0.34
            );

        const scanRing =
          this.add
            .circle(
              0,
              0,
              17,
              0x8df4ff,
              0
            )
            .setStrokeStyle(
              1.5,
              0x8df4ff,
              0.7
            );

        const scanArc =
          this.add
            .arc(
              0,
              0,
              23,
              0,
              105,
              false,
              0x8df4ff,
              0.75
            );

        const scanBeam =
          this.add
            .rectangle(
              0,
              28,
              3,
              20,
              0x8df4ff,
              0.26
            )
            .setOrigin(
              0.5,
              0
            );

        const statusLight =
          this.add
            .circle(
              0,
              -15,
              2.2,
              0x55dfff,
              0.9
            );

        fx.add([
          droneGlow,
          dronePulse,
          corePulse,
          scanRing,
          scanArc,
          scanBeam,
          statusLight
        ]);

        guide.setData(
          'droneFx',
          {
            droneGlow,
            dronePulse,
            corePulse,
            scanRing,
            scanArc,
            scanBeam,
            statusLight
          }
        );

        this.tweens.add({
          targets: droneGlow,
          scale: {
            from: 0.88,
            to: 1.16
          },
          alpha: {
            from: 0.06,
            to: 0.2
          },
          duration: 900,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });

        this.tweens.add({
          targets: dronePulse,
          scale: {
            from: 0.8,
            to: 1.65
          },
          alpha: {
            from: 0.32,
            to: 0
          },
          duration: 780,
          repeat: -1,
          ease: 'Sine.out'
        });

        this.tweens.add({
          targets: corePulse,
          scale: {
            from: 0.8,
            to: 1.75
          },
          alpha: {
            from: 0.45,
            to: 0
          },
          duration: 700,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });

        this.tweens.add({
          targets: scanRing,
          scale: {
            from: 0.82,
            to: 1.5
          },
          alpha: {
            from: 0.7,
            to: 0
          },
          duration: 950,
          repeat: -1,
          ease: 'Sine.out'
        });

        this.tweens.add({
          targets: scanArc,
          angle: 360,
          duration: 2400,
          repeat: -1,
          ease: 'Linear'
        });

        this.tweens.add({
          targets: scanBeam,
          alpha: {
            from: 0.12,
            to: 0.42
          },
          scaleY: {
            from: 0.65,
            to: 1.2
          },
          duration: 720,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });

        this.tweens.add({
          targets: statusLight,
          alpha: {
            from: 0.25,
            to: 1
          },
          scale: {
            from: 0.7,
            to: 1.35
          },
          duration: 430,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });

        const followTimer =
          this.time.addEvent({
            delay: 16,
            loop: true,
            callback: () => {
              if (
                !guide.active ||
                !fx.active
              ) {
                followTimer.remove();
                fx.destroy();
                return;
              }

              fx.setPosition(
                guide.x,
                guide.y
              );
            }
          });

        guide.setData(
          'fxTimer',
          followTimer
        );
      }
    }
  );

  /*
   * PLAYER → COMPANION
   */
  this.physics.add.overlap(
    this.player,
    this.guideCompanions,
    (_, guide) => {
      if (!guide?.active)
        return;

      /*
       * COLLECT BURST
       */
      const burstColors =
        guide.texture.key ===
        'alien-guide'
          ? [
              0xb993ff,
              0xe0a7ff,
              0x8df4ff
            ]
          : [
              0x8df4ff,
              0x55dfff,
              0xe8fdff
            ];

      burstColors.forEach(
        (color, index) => {
          const burst =
            this.add
              .circle(
                guide.x,
                guide.y,
                7 + index * 3,
                color,
                0.32
              )
              .setDepth(12);

          this.tweens.add({
            targets: burst,
            scale:
              2.4 +
              index * 0.55,
            alpha: 0,
            duration:
              260 +
              index * 90,
            ease: 'Quad.out',
            onComplete: () =>
              burst.destroy()
          });
        }
      );

      const collectFlash =
        this.add
          .circle(
            guide.x,
            guide.y,
            12,
            guide.texture.key ===
            'alien-guide'
              ? 0xe0a7ff
              : 0x8df4ff,
            0.28
          )
          .setDepth(13);

      this.tweens.add({
        targets: collectFlash,
        scale: 3.8,
        alpha: 0,
        duration: 320,
        onComplete: () =>
          collectFlash.destroy()
      });

      this.collectGuideCompanion(
        guide
      );
    },
    undefined,
    this
  );
}
collectGuideCompanion(guide) {
if (!guide?.active) return;

guide.disableBody(
  true,
  true
);

this.energy =
  Math.min(
    this.energyMax,
    this.energy + 30
  );

this.health =
  Math.min(
    3,
    this.health + 1
  );

this.game.events.emit(
  'health',
  this.health
);

this.game.events.emit(
  'tutorial',
  guide.getData('lesson')
);

this.game.events.emit(
  'narration',
  guide.getData('lesson')
);

this.game.events.emit(
  'character-response',
  'Support received. Back in the run.'
);

this.showIntelCard(
  'ALLY INTEL',
  [
    guide.getData(
      'lesson'
    ),
    'Allies restore energy and one health. Tap this card or press ESC whenever you are ready.'
  ],
  '#aee37f'
);

this.playerCue(
  'ALLY SUPPORT · +30 ENERGY',
  '#aee37f'
);

this.gadgetPulse(
  0xaee37f,
  18,
  420
);

}

collectSignal(signal) {
if (!signal.active)
return;

if (
  this.boosterTimer > 0
) {
  this.boostedSignals++;

  this.playerCue(
  'BOOSTED SIGNAL',
  '#8df4ff'
);

this.gadgetPulse(
  0x8df4ff,
  10,
  300
);
}

this.dust.emitParticleAt(
  signal.x,
  signal.y,
  14
);

this.speedLines.emitParticleAt(
  signal.x,
  signal.y,
  5
);

signal.disableBody(
  true,
  true
);

this.collected++;

  this.playerCue(
  'SIGNAL ACQUIRED',
  '#ffd06e'
);

this.gadgetPulse(
  0xffd06e,
  10,
  300
);

if (
  this.mission.signals.length - this.collected === 1
) {
  this.playerCue(
    'ONE SIGNAL LEFT',
    '#ffd06e'
  );
  this.gadgetPulse(
  0xffd06e,
  12,
  340
);
}

this.game.events.emit(
  'signal',
  this.collected,
  this.mission.signals.length
);

this.game.events.emit(
  'feedback',
  'signal'
);

const glow =
  this.add?.circle?.(
    signal.x,
    signal.y,
    12,
    0xffd06e,
    .75
  );

if (glow) {
  glow.setBlendMode(
    Phaser.BlendModes.ADD
  );

  glow.setDepth(11);

  this.tweens.add({
    targets: glow,
    scale: 4.8,
    alpha: 0,
    duration: 360,
    ease: 'Quad.out',
    onComplete: () =>
      glow.destroy()
  });
}

this.tweens.add({
  targets: glow,
  scale: 4.8,
  alpha: 0,
  duration: 360,
  ease: 'Quad.out',
  onComplete: () =>
    glow.destroy()
});

// XP FLOATING TEXT DISABLED

this.tweens.add({
  targets: this.player,
  scaleX: 1.12,
  scaleY: 1.12,
  yoyo: true,
  duration: 90
});

}

collectSecret(secret) {
if (!secret.active)
return;

secret.disableBody(
  true,
  true
);

  // ============================================================
// SECRET DISCOVERY · RARE PICKUP FX
// ============================================================
if (!this.motionReduced) {
  const secretBurst =
    this.add
      .circle(
        secret.x,
        secret.y,
        12,
        0xb993ff,
        .30
      )
      .setDepth(13);

  secretBurst.setStrokeStyle(
    2,
    0xe0a7ff,
    .95
  );

  this.tweens.add({
    targets: secretBurst,
    scale: 5.4,
    alpha: 0,
    duration: 520,
    ease: 'Quad.out',
    onComplete: () =>
      secretBurst.destroy()
  });

  const secretCore =
    this.add
      .circle(
        secret.x,
        secret.y,
        5,
        0xffffff,
        .85
      )
      .setDepth(14);

  this.tweens.add({
    targets: secretCore,
    scale: 2.8,
    alpha: 0,
    duration: 300,
    ease: 'Quad.out',
    onComplete: () =>
      secretCore.destroy()
  });

  this.cameras.main.flash(
    110,
    170,
    110,
    220
  );

  this.shake(
    70,
    0.0025
  );
}
this.secretsCollected++;
this.playerCue(
  'SECRET ACQUIRED',
  '#b993ff'
);

this.gadgetPulse(
  0xb993ff,
  12,
  340
);
this.game.events.emit(
  'secret',
  this.secretsCollected,
  this.mission.secrets.length
);

this.game.events.emit(
  'feedback',
   'secret_collect'
);

}

activateCheckpoint(marker) {
const index =
marker.getData('index');

if (
  index <=
  (this.checkpoint.index ??
    -1)
) {
  return;
}

const spawn =
  this.safeCheckpointSpawn(
    marker.x
  );

this.checkpoint = {
  index,
  ...spawn,
  signals:
    new Set(
      this.signals
        .getChildren()
        .filter(
          signal =>
            !signal.active
        )
        .map(
          signal =>
            signal.getData(
              'id'
            )
        )
    ),
  secrets:
    new Set(
      this.secrets
        .getChildren()
        .filter(
          secret =>
            !secret.active
        )
        .map(
          secret =>
            secret.getData(
              'id'
            )
        )
    )
};

marker.setTint(
  0xdffcff
);
  
const checkpointPulse =
  this.add
    .circle(
      marker.x,
      marker.y,
      12,
      0x8df4ff,
      .35
    )
    .setDepth(11);

this.tweens.add({
  targets: checkpointPulse,
  scale: 3.8,
  alpha: 0,
  duration: 360,
  onComplete: () =>
    checkpointPulse.destroy()
});
  
this.game.events.emit(
  'checkpoint',
  this.collected,
  this.secretsCollected,
  0,
  index
);

  this.game.events.emit(
  'feedback',
  'checkpoint_activate'
);

}

useEnergy(cost, ability) {
if (!this.mission.energyEnabled)
return true;

if (
  this.loadout.upgrades?.includes(
    'efficiency'
  )
) {
  cost *= .9;
}

if (
  ability === 'wallRun' &&
  this.loadout.upgrades?.includes(
    'wallEfficiency'
  )
) {
  cost *= .8;
}

if (
  this.energy <
  cost
) {
  this.game.events.emit(
    'feedback',
    'empty'
  );

  if (
    this.lowEnergyCueTimer <=
    0
  ) {
    this.lowEnergyCueTimer =
      700;

    this.playerCue(
      'LOW ENERGY',
      '#ff9c91'
    );

    this.gadgetPulse(
  0xff826e,
  11,
  320
);

  }

  return false;
}

this.energy -= cost;

if (
  !this.tutorials.has(
    ability
  )
) {
  this.tutorials.add(
    ability
  );

  const controls = {
    vault:
      'VAULT · RUN INTO BARRIER',
    slide:
      'SLIDE · HOLD S',
    wallRun:
      'WALL RUN · HOLD INTO WALL',
    airDash:
      'AIR DASH · SHIFT IN AIR',
    ledgeGrab:
      'LEDGE GRAB · PRESS SPACE AT WALL',
    climb:
      'CLIMB · W AT WALL'
  };

  this.game.events.emit(
    'tutorial',
    controls[ability]
  );
}

return true;

}

useGadget(slot) {
const id =
this.loadout.equipment?.[slot];

if (
  !id ||
  this.gadgetCooldowns[slot] >
    0
) {
  return;
}

const bonuses =
  this.loadout.upgrades ||
  [];

if (id === 'scanner') {
  const range =
    bonuses.includes(
      'signalSense'
    )
      ? 680
      : 500;

  const targets =
    this.signals
      .getChildren()
      .filter(
        signal =>
          signal.active &&
          Math.abs(
            signal.x -
            this.player.x
          ) < range
      );

  targets.forEach(
    signal =>
      signal.setTint(
        0x8df4ff
      )
  );

  const nextSignal =
    targets.sort(
      (left, right) =>
        Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          left.x,
          left.y
        ) -
        Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          right.x,
          right.y
        )
    )[0];

  if (nextSignal) {
    const marker =
      this.add
        .circle(
          nextSignal.x,
          nextSignal.y,
          19,
          0x8df4ff,
          .18
        )
        .setStrokeStyle(
          2,
          0xb9f5ff,
          .85
        )
        .setDepth(10);

    this.tweens.add({
      targets: marker,
      scale: 2.2,
      alpha: 0,
      duration: 850,
      onComplete: () =>
        marker.destroy()
    });
  }

  this.gadgetPulse(
    0x8df4ff,
    14,
    420
  );

  this.game.events.emit(
    'tutorial',
    nextSignal
      ? 'SCANNER · NEXT SIGNAL MARKED'
      : 'SCANNER · NO SIGNAL IN RANGE'
  );
}

if (id === 'emp') {
  this.empTimer = 3500;

  this.gadgetPulse(
    0x8df4ff,
    20,
    620
  );

  this.enemies
    ?.getChildren()
    .forEach(
      enemy =>
        enemy.setTint(
          0x8df4ff
        )
    );

  this.game.events.emit(
    'tutorial',
    'EMP · PATROLS DISABLED'
  );
}

if (id === 'decoy') {
  this.decoyTimer = 3200;
  this.alarmTimer = 0;

  this.decoyBeacon?.destroy();

  this.decoyBeacon =
    this.add
      .circle(
        this.player.x,
        this.player.y + 18,
        10,
        0xffd06e,
        .8
      )
      .setStrokeStyle(
        2,
        0xfff0b5
      )
      .setDepth(10);

  this.tweens.add({
    targets:
      this.decoyBeacon,
    scale: {
      from: .75,
      to: 1.55
    },
    alpha: {
      from: .9,
      to: .25
    },
    duration: 420,
    yoyo: true,
    repeat: -1
  });

  this.game.events.emit(
    'tutorial',
    'DECOY · ATTENTION DIVERTED'
  );
}

if (id === 'booster') {
  this.boosterTimer = 8000;

  this.boosterAura?.destroy();

  this.boosterAura =
    this.add
      .circle(
        this.player.x,
        this.player.y,
        24,
        0xffd06e,
        .14
      )
      .setStrokeStyle(
        2,
        0xffd06e,
        .65
      )
      .setDepth(9);

  this.tweens.add({
    targets:
      this.boosterAura,
    scale: {
      from: .9,
      to: 1.35
    },
    alpha: {
      from: .5,
      to: .12
    },
    duration: 520,
    yoyo: true,
    repeat: -1
  });

  this.game.events.emit(
    'tutorial',
    'SIGNAL BOOSTER · ACTIVE'
  );
}

if (id === 'cell') {
  this.energy =
    Math.min(
      this.energyMax,
      this.energy + 35
    );

  this.gadgetPulse(
    0xaee37f,
    13,
    300
  );

  this.game.events.emit(
    'tutorial',
    'ENERGY CELL · +35 ENERGY'
  );
}

this.gadgetCooldowns[slot] =
  id === 'scanner'
    ? 5500
    : id === 'emp'
      ? 9000
      : id === 'decoy'
        ? 8000
        : id === 'booster'
          ? 12000
          : 10000;

this.playerCue(
  `${id.toUpperCase()} · READY`,
  '#ffd06e'
);

const pulse =
  this.add
    .circle(
      this.player.x,
      this.player.y,
      12,
      0xffd06e,
      .35
    )
    .setDepth(11);

this.tweens.add({
  targets: pulse,
  scale: 2.8,
  alpha: 0,
  duration: 280,
  onComplete: () =>
    pulse.destroy()
});

this.game.events.emit(
  'feedback',
  'gadget'
);

}

tryVault() {
const body = this.player.body;

const grounded =
body.blocked.down ||
body.touching.down;

if (
!this.abilities.has('vault') ||
this.vaultCooldown > 0 ||
!grounded ||
Math.abs(body.velocity.x) < 130 ||
!this.useEnergy(12, 'vault')
) {
return false;
}

this.vaultCooldown = 450;

body.setVelocityY(-510);

  const vaultBurst =
  this.add
    .circle(
      this.player.x,
      this.player.y + 22,
      10,
      0xb9f5ff,
      .30
    )
    .setDepth(12);

this.tweens.add({
  targets: vaultBurst,
  scale: 3.8,
  alpha: 0,
  duration: 240,
  onComplete: () =>
    vaultBurst.destroy()
});

this.player.setTint(0xb9f5ff);

this.time.delayedCall(
180,
() => this.player?.active && this.player.clearTint()
);

this.game.events.emit(
'feedback',
'vault'
);

return true;
}

updateEnemies(delta) {
const detectionRange =
  this.mission.blackout && this.loadout.upgrades?.includes('ghost') ? 190 :
  this.mission.blackout ? 260 : 320;

if (!this.enemies)
return;

if (
  this.empTimer > 0 ||
  this.decoyTimer > 0
) {
  this.enemies
    .getChildren()
    .forEach(
      enemy =>
        enemy
          .getData('indicator')
          ?.setAlpha(.1)
    );

  return;
}

this.enemies
  .getChildren()
  .forEach(
    enemy => {
      if (!enemy.active)
        return;

      const route =
        enemy.getData(
          'route'
        );

      const type =
        route.type;

      let direction =
        enemy.getData(
          'direction'
        );

      const horizontalDistance =
        Math.abs(
          enemy.x -
          this.player.x
        );

      const verticalDistance =
        Math.abs(
          enemy.y -
          this.player.y
        );

     const aiState =

enemy.getData('aiState') ||
'IDLE';

const speed =
aiState === 'HUNT'
? type === 'dino'
? 96
: type === 'enemy-runner'
? 145
: type === 'security'
? 78
: type === 'invader'
? 42
: 58
: type === 'dino'
? 74
: type === 'enemy-runner' &&
horizontalDistance < 300
? 118
: type === 'invader'
? 28
: type === 'security'
? 55
: 38;

if (
aiState === 'HUNT'
) {
enemy.setData(
'lastKnownX',
this.player.x
);
enemy.setData(
'lastKnownY',
this.player.y
);
if (
horizontalDistance > 420 ||
verticalDistance > 180
) {
enemy.setData(
'aiState',
'SEARCH'
);

enemy.setData(
  'aiTimer',
  1800
);

} else {
direction =
this.player.x <
enemy.x
? -1
: 1;

enemy.setData(
  'direction',
  direction
);

enemy.setFlipX(
  direction < 0
);

}
}

      if (

aiState === 'RETURN'
) {
let aiTimer =
Number(
enemy.getData('aiTimer')
) || 0;

aiTimer = Math.max(
0,
aiTimer - delta
);

enemy.setData(
'aiTimer',
aiTimer
);

const returnTarget =
enemy.getData('patrolOriginX') ??
(
route.min +
route.max
) / 2;

direction =
enemy.x < returnTarget
? 1
: -1;

enemy.setData(
'direction',
direction
);

enemy.setFlipX(
direction < 0
);

if (
aiTimer <= 0 ||
Math.abs(
enemy.x - returnTarget
) < 24
) {
enemy.setData(
'aiState',
'IDLE'
);

enemy.setData(
  'aiTimer',
  0
);

}
}
if (
aiState === 'SEARCH'
) {
let aiTimer =
Number(
enemy.getData('aiTimer')
) || 0;

aiTimer = Math.max(
0,
aiTimer - delta
);

enemy.setData(
'aiTimer',
aiTimer
);

  if (

horizontalDistance < detectionRange &&
verticalDistance < 150
) {
enemy.setData(
'aiState',
'HUNT'
);

enemy.setData(
'aiTimer',
0
);

direction =
this.player.x < enemy.x
? -1
: 1;

enemy.setData(
'direction',
direction
);

enemy.setFlipX(
direction < 0
);
}

const lastKnownX =
Number(
enemy.getData('lastKnownX')
);

direction =
enemy.x < lastKnownX
? 1
: -1;
  if (
  Math.abs(
    enemy.x - lastKnownX
  ) < 28
) {
  enemy.setData(
    'aiState',
    'RETURN'
  );

  enemy.setData(
    'aiTimer',
    1200
  );
}
enemy.setData(
'direction',
direction
);

enemy.setFlipX(
direction < 0
);

if (
aiTimer <= 0
) {
enemy.setData(
'aiState',
'RETURN'
);

enemy.setData(
  'aiTimer',
  1200
);

}
}

else if (
type === 'enemy-runner' &&
horizontalDistance <
300
) {
direction =
this.player.x <
enemy.x
? -1
: 1;
}

      enemy.x +=
        direction *
        speed *
        delta /
        1000;

      if (
        enemy.x >=
          route.max ||
        enemy.x <=
          route.min
      ) {
        direction *= -1;

        enemy.setData(
          'direction',
          direction
        );

        enemy.setFlipX(
          direction < 0
        );
      }

      enemy.body.updateFromGameObject();

      const patrol =
        type ===
          'security' ||
        type ===
          'guard';

      const detectionRange =
        this.mission.blackout &&
        this.player.y <
          470
          ? 105
          : type ===
              'security'
            ? 180
            : 145;

      const indicator =
        enemy.getData(
          'indicator'
        );

      const alerted =
        horizontalDistance <
          detectionRange &&
        verticalDistance <
          100;
      const currentAIState =
        enemy.getData('aiState') ||
        'IDLE';

      if (
        currentAIState === 'IDLE' &&
        horizontalDistance <
          detectionRange * 1.8 &&
        verticalDistance <
          150
      ) {
        enemy.setData(

'lastKnownX',
this.player.x
);
enemy.setData(
'lastKnownY',
this.player.y
);
enemy.setData(
'aiState',
'SUSPICIOUS'
);

        enemy.setData(
          'aiTimer',
          900
        );
      }
      if (

currentAIState === 'SUSPICIOUS'
) {
let aiTimer =
Number(
enemy.getData('aiTimer')
) || 0;

aiTimer = Math.max(
0,
aiTimer - delta
);

enemy.setData(
'aiTimer',
aiTimer
);

if (
aiTimer <= 0
) {
enemy.setData(
'aiState',
'IDLE'
);

enemy.setData(
  'aiTimer',
  0
);

}
}

if (
currentAIState === 'ALERT'
) {
let aiTimer =
Number(
enemy.getData('aiTimer')
) || 0;

aiTimer = Math.max(
0,
aiTimer - delta
);

enemy.setData(
'aiTimer',
aiTimer
);

if (
aiTimer <= 0
) {
enemy.setData(
'aiState',
'HUNT'
);

enemy.setData(
  'aiTimer',
  0
);

}
}

      indicator
        ?.setPosition(
          
          enemy.x,
          enemy.y - 30
        )
        .setAlpha(
          horizontalDistance <
            Math.max(
              260,
              detectionRange *
                1.6
            ) &&
            verticalDistance <
              150
            ? .92
            : .28
        )
        .setFillStyle(
          alerted
            ? 0xffd06e
            : 0xff826e
        );

      if (
        alerted &&
        !enemy.getData(
          'alerted'
        )
      ) {
        enemy.setData(
          'alerted',
          true
        );

enemy.setData(
'aiState',
'ALERT'
);

enemy.setData(
'aiTimer',
500
);
this.playerCue(
  `${
    type === 'security'
      ? 'SECURITY'
      : 'HOSTILE'
  } HAS EYES ON YOU`,
  '#ffcf82'
);
}

      if (!alerted) {
        enemy.setData(
          'alerted',
          false
        );
      }

      if (
        patrol &&
        alerted
      ) {
        if (
          this.alarmTimer <=
          0
        ) {
          this.alarms++;

          this.game.events.emit(
            'feedback',
            'chase'
          );
        }

        this.alarmTimer =
          this.alarmDuration(
            3400
          );
      }
    }
  );

if (this.alarmTimer > 0) {
this.alarmTimer =
Math.max(
0,
this.alarmTimer -
delta
);
}

const detectionValue =
this.alarmTimer > 0
? Math.ceil(
this.alarmTimer / 100
)
: 0;

if (
detectionValue !==
this.detectionEmit
) {
this.detectionEmit =
detectionValue;

this.game.events.emit(
'detection',
detectionValue
);
}

}

updateSciFiThreats(delta) {
const now =
this.elapsedMs;

  // ============================================================
// BOSS DEATH FREEZE
// ============================================================
  
if (this.bossVictoryLock === true) {
  if (this.boss?.active) {
    this.boss.setData(
      'nextShot',
      Number.MAX_SAFE_INTEGER
    );

    this.boss.setData(
      'attackCooldown',
      Number.MAX_SAFE_INTEGER
    );

    if (this.boss.body) {
      this.boss.body.setVelocity(0, 0);
    }
  }

  return;
}

  // ============================================================
// BOSS HEALTH BAR · COMBAT HUD
// ============================================================
if (
  this.boss?.active &&
  !this.bossHealthUI
) {
  const width =
    Math.min(
      this.scale.width - 40,
      430
    );

  const x =
    this.scale.width / 2;

  const y = 38;

  const maxHealth =
    Math.max(
      1,
      Number(
        this.boss.getData('health')
      ) || 1
    );

  this.boss.setData(
    'maxHealth',
    maxHealth
  );

  const container =
    this.add
      .container(
        0,
        0
      )
      .setScrollFactor(0)
      .setDepth(120);

  const plate =
    this.add
      .rectangle(
        x,
        y,
        width,
        58,
        0x050914,
        .94
      )
      .setStrokeStyle(
        1,
        0xff826e,
        .72
      );

  const title =
    this.add
      .text(
        x,
        y - 17,
        `BOSS // ${
          this.boss.getData(
            'bossName'
          ) || 'THREAT'
        }`,
        {
          fontFamily: 'DM Mono',
          fontSize:
            this.scale.width < 600
              ? '9px'
              : '10px',
          color: '#ffcf82',
          stroke: '#08101c',
          strokeThickness: 4,
          align: 'center'
        }
      )
      .setOrigin(.5);

  const barBack =
    this.add
      .rectangle(
        x,
        y + 5,
        width - 28,
        10,
        0x182338,
        1
      )
      .setStrokeStyle(
        1,
        0x33445f,
        .85
      );

  const barFill =
    this.add
      .rectangle(
        x -
          (width - 28) / 2 +
          2,
        y + 5,
        width - 32,
        6,
        0xff826e,
        1
      )
      .setOrigin(0, .5);

  const hpText =
    this.add
      .text(
        x,
        y + 23,
        `HP ${maxHealth} / ${maxHealth}`,
        {
          fontFamily: 'DM Mono',
          fontSize:
            this.scale.width < 600
              ? '8px'
              : '9px',
          color: '#8ba0b8',
          align: 'center'
        }
      )
      .setOrigin(.5);

  container.add([
    plate,
    title,
    barBack,
    barFill,
    hpText
  ]);

  this.bossHealthUI = {
    container,
    plate,
    title,
    barBack,
    barFill,
    hpText,
    width,
    maxHealth
  };

  // ============================================================
// BOSS HP · PHASE MARKERS
// ============================================================
const marker50 =
  this.add
    .rectangle(
      x -
        (width - 28) / 2 +
        (width - 28) * .5,
      y + 5,
      2,
      14,
      0xffcf82,
      .85
    )
    .setScrollFactor(0)
    .setDepth(122);

const marker25 =
  this.add
    .rectangle(
      x -
        (width - 28) / 2 +
        (width - 28) * .25,
      y + 5,
      2,
      14,
      0xff826e,
      .85
    )
    .setScrollFactor(0)
    .setDepth(122);

this.bossHealthUI.marker50 =
  marker50;

this.bossHealthUI.marker25 =
  marker25;
}

if (
  this.boss?.active &&
  Math.abs(
    this.boss.x -
    this.player.x
  ) < 500 &&
  now >=
    this.boss.getData(
      'nextShot'
    )
) {
  const bolt =
    this.comets
      .create(
        this.boss.x,
        this.boss.y - 20,
        'comet'
      )
      .setDepth(11)
      .setTint(
        this.boss.getData(
          'bossColor'
        ) ||
          0xff826e
      );

  bolt.setData(
  'bossProjectile',
  true
);

  bolt.body
    .setAllowGravity(false)
    .setVelocity(
  (
    this.player.x -
    this.boss.x
  ) * (
    this.boss.getData('phase') === 2
      ? 1.05
      : .8
  ),
  this.boss
      .getData(
        'route'
      )
      ?.type ===
    'storm-boss'
    ? (
        this.boss.getData('phase') === 2
          ? 340
          : 250
      )
    : (
        this.boss.getData('phase') === 2
          ? 145
          : 100
      )
);

  this.boss.setData(
    'nextShot',
    now +
      this.boss.getData(
        'attackCooldown'
      )
  );

  // ============================================================
// BOSS PHASE 2 · DOUBLE ATTACK
// ============================================================
if (
  this.boss.getData('phase') === 2 &&
  !this.motionReduced
) {
  const secondShotDelay = 180;

  this.time.delayedCall(
    secondShotDelay,
    () => {
  if (
  !this.boss?.active ||
  this.finished ||
  this.respawning ||
  this.bossVictoryLock === true
) {
  return;
}
      if (
        Math.abs(
          this.boss.x -
          this.player.x
        ) > 620
      ) {
        return;
      }

      const secondBolt =
        this.comets
          .create(
            this.boss.x,
            this.boss.y + 6,
            'comet'
          )
          .setDepth(11)
          .setTint(
            this.boss.getData(
              'bossColor'
            ) ||
              0xff826e
          );

      secondBolt.setData(
  'bossProjectile',
  true
);

      secondBolt.body
        .setAllowGravity(false)
        .setVelocity(
          (
            this.player.x -
            this.boss.x
          ) * 1.05,
          this.boss
            .getData('route')
            ?.type ===
          'storm-boss'
            ? 340
            : 145
        );

      this.playerCue(
        'SECONDARY VOLLEY',
        '#ff826e'
      );

      this.gadgetPulse(
        0xff826e,
        13,
        280
      );
    }
  );
}

  this.playerCue(
    `${
      this.boss.getData(
        'bossName'
      )
    } ATTACK`,
    '#ff826e'
  );

  this.game.events.emit(
    'feedback',
    'warning'
  );
}

this.enemies
  .getChildren()
  .forEach(
    enemy => {
      if (!enemy.active)
        return;

      const type =
        enemy.getData(
          'route'
        )?.type;

      if (
        type === 'chicken' ||
        type === 'invader' ||
        type === 'enemy-runner'
      ) {
        const firingRange =
          type === 'chicken'
            ? 240
            : type ===
                'invader'
              ? 320
              : 280;

        if (
          Math.abs(
            this.player.x -
            enemy.x
          ) <
            firingRange &&
          Math.abs(
            this.player.y -
            enemy.y
          ) < 190 &&
          now >=
            enemy.getData(
              'nextShot'
            )
        ) {
          const projectile =
            type ===
            'chicken'
              ? 'egg'
              : 'comet';

          const egg =
            this.eggs
              .create(
                enemy.x,
                enemy.y + 12,
                projectile
              )
              .setDepth(11);

          const predictedX =
            this.player.x +
            this.player.body
              .velocity.x *
              .22;

          egg.body
            .setAllowGravity(false)
            .setVelocity(
              (
                predictedX -
                enemy.x
              ) * .72,
              type === 'chicken'
                ? 210
                : 90
            );

          enemy.setData(
            'nextShot',
            now +
              (
                type ===
                'enemy-runner'
                  ? 1500
                  : type ===
                      'invader'
                    ? 1900
                    : 2400
              )
          );

          this.playerCue(
            type === 'chicken'
              ? 'EGG INCOMING'
              : 'ENEMY FIRE',
            '#ff826e'
          );

          this.game.events.emit(
            'feedback',
            'warning'
          );
        }
      }

      if (
        type ===
        'invader'
      ) {
        enemy.y +=
          Math.sin(
            (now +
              enemy.x) /
              260
          ) *
          .22;

        enemy.body.updateFromGameObject();
      }

      if (
        type === 'dino' &&
        Math.abs(
          enemy.x -
          this.player.x
        ) < 240 &&
        Math.abs(
          enemy.y -
          this.player.y
        ) < 95 &&
        now >=
          enemy.getData(
            'nextShot'
          )
      ) {
        enemy.setData(
          'nextShot',
          now + 1700
        );

        enemy.setTint(
          0xff826e
        );

        this.tweens.add({
          targets: enemy,
          x:
            this.player.x +
            this.player.body
              .velocity.x *
              .12,
          duration: 340,
          onComplete: () =>
            enemy.clearTint()
        });

        if (
          Math.abs(
            enemy.x -
            this.player.x
          ) < 66
        ) {
          this.takeSciFiHit(
            'A dinosaur charge knocked the courier down.'
          );
        }
      }
    }
  );

const signature =
  signatureThreats[
    this.mission.id
  ];

const nearbyThreat =
  this.enemies
    .getChildren()
    .find(
      enemy =>
        enemy.active &&
        Math.abs(
          enemy.x -
          this.player.x
        ) < 250 &&
        enemy.getData(
          'route'
        )?.type ===
          signature
    ) ||
  this.enemies
    .getChildren()
    .find(
      enemy =>
        enemy.active &&
        Math.abs(
          enemy.x -
          this.player.x
        ) < 180 &&
        enemyIntel[
          enemy.getData(
            'route'
          )?.type
        ]
    );

if (nearbyThreat) {
  this.showEnemyIntel(
    nearbyThreat.getData(
      'route'
    )?.type
  );
}

this.enemies
  .getChildren()
  .forEach(
    enemy => {
      if (
        !enemy.active ||
        enemy.getData(
          'route'
        )?.type !==
          'alien-ground' ||
        now <
          enemy.getData(
            'nextShot'
          ) ||
        Math.abs(
          enemy.x -
          this.player.x
        ) > 360
      ) {
        return;
      }

      const bolt =
        this.eggs.create(
          enemy.x,
          enemy.y,
          'comet'
        ).setDepth(11);

      bolt.body
        .setAllowGravity(false)
        .setVelocity(
          (
            this.player.x -
            enemy.x
          ) * .78,
          (
            this.player.y -
            enemy.y
          ) * .35 -
            45
        );

      enemy.setData(
        'nextShot',
        now + 1650
      );

      this.playerCue(
        'GROUND ALIEN FIRE',
        '#ff826e'
      );
    }
  );

this.enemies
  .getChildren()
  .forEach(
    enemy => {
      if (!enemy.active)
        return;

      const type =
        enemy.getData(
          'route'
        )?.type;

      const direction =
        enemy.getData(
          'direction'
        ) || 1;

      if (
        type ===
          'enemy-runner' ||
        type ===
          'alien-ground'
      ) {
        enemy.setAngle(
          direction * 7
        );
      } else if (
        type === 'dino' ||
        type ===
          'dino-boss'
      ) {
        enemy.setAngle(
          direction * 4
        );
      } else if (
        type === 'invader'
      ) {
        enemy.setAngle(
          Math.sin(
            (now +
              enemy.x) /
              240
          ) * 9
        );
      }
    }
  );

const tier =
  Number(
    this.mission.difficulty?.split('/')[0]
  ) || 1;

this.cometTimer -=
  delta;

if (
  tier >= 3 &&
  this.cometTimer <=
    0
) {
  const comet =
    this.comets
      .create(
        Math.min(
          this.worldWidth - 80,
          this.player.x + 360
        ),
        -30,
        'comet'
      )
      .setDepth(11);

  comet.body
    .setAllowGravity(false)
    .setVelocity(
      -80,
      520
    );

  this.cometTimer =
    Math.max(
      2400,
      5600 -
        tier * 420
    );

  this.game.events.emit(
    'feedback',
    'warning'
  );
}

}
/**

Runtime maintenance for player-deployed build systems.

Keeps turrets firing and removes expired/stray projectiles without

changing the collision or progression systems created elsewhere.
*/
updateBuilds() {
if (!this.player) return;

const now = Number.isFinite(this.elapsedMs)

  ? this.elapsedMs
  : 0;

if (this.turrets?.active) {
  this.turrets.getChildren().forEach(turret => {
    if (!turret?.active) return;

    const expires = turret.getData('expires');

    if (
      Number.isFinite(expires) &&
      now >= expires
    ) {
      turret.destroy();
      return;
    }

    if (!this.enemies?.active) return;

  const target = this.enemies

.getChildren()
.find(enemy =>
enemy?.active &&
Math.abs(enemy.x - turret.x) < 460 &&
Math.abs(enemy.y - turret.y) < 220
);

    const nextShot =
      Number(
        turret.getData('nextShot')
      ) || 0;

    if (
      !target ||
      now < nextShot ||
      !this.plasma?.active
    ) {
      return;
    }

    const dx =
      target.x - turret.x;

    const dy =
      target.y - turret.y;

    const distance =
      Math.max(
        1,
        Math.hypot(dx, dy)
      );

    const speed = 720;

    const bolt =
      this.plasma
        .create(
          turret.x,
          turret.y - 10,
          'plasma'
        )
        .setDepth(12);

    if (!bolt?.body) {
      bolt?.destroy();
      return;
    }

    bolt.setData(
      'power',
      1
    );

    bolt.setData(
      'createdAt',
      now
    );

    bolt.body
      .setAllowGravity(false)
      .setVelocity(
        dx / distance * speed,
        dy / distance * speed
      );

    turret.setData(
      'nextShot',
      now + 620
    );

    const muzzleFlash = this.add

.circle(
turret.x,
turret.y,
7,
0x8df4ff,
.24
)
.setDepth(11);

this.tweens.add({
targets: muzzleFlash,
scale: 2.2,
alpha: 0,
duration: 110,
onComplete: () => muzzleFlash.destroy()
});
});
}

const prune = (
  group,
  maxAge,
  maxDistance
) => {
  if (!group?.active) return;

  group
    .getChildren()
    .forEach(object => {
      if (!object?.active) return;

      const createdAt =
        Number(
          object.getData?.(
            'createdAt'
          )
        );

      const tooOld =
        Number.isFinite(
          createdAt
        ) &&
        now - createdAt >
          maxAge;

      const tooFar =
        Math.abs(
          object.x -
            this.player.x
        ) >
          maxDistance ||
        Math.abs(
          object.y -
            this.player.y
        ) >
          720;

      if (
        tooOld ||
        tooFar
      ) {
        object.destroy();
      }
    });
};

prune(
  this.plasma,
  1800,
  1100
);

prune(
  this.kineticBalls,
  1800,
  1300
);

}

updateNarrative() {
const beats =
this.mission.story
?.radio ||
[];

beats.forEach(
  ([x, text], index) => {
    if (
      !this.storyBeatsSeen.has(
        index
      ) &&
      this.player.x >= x
    ) {
      this.storyBeatsSeen.add(
        index
      );

      const line =
        this.add.text(
          this.player.x,
          this.player.y - 96,
          text,
          {
            fontFamily: 'DM Mono',
            fontSize: '11px',
            color: '#dffcff',
            stroke: '#08101c',
            strokeThickness: 4,
            wordWrap: {
              width: 370
            },
            align: 'center'
          }
        )
          .setOrigin(.5)
          .setDepth(14);

      this.tweens.add({
        targets: line,
        y: line.y - 22,
        alpha: 0,
        delay: 1900,
        duration: 520,
        onComplete: () =>
          line.destroy()
      });

      this.game.events.emit(
        'narration',
        text
      );

      this.time.delayedCall(
        1150,
        () =>
          this.game.events.emit(
            'character-response',
            [
              'Copy that.',
              'Relay runner moving.',
              'I see it.',
              'On the line.'
            ][
              index % 4
            ]
          )
      );

      this.game.events.emit(
        'feedback',
        'signal'
      );
    }
  }
);

}

updateEvents() {
const events = Array.isArray(this.mission?.events) ? this.mission.events : [];
events.forEach(
(event, index) => {
const state =
this.eventState.get(
index
) || '';

    if (
      !state &&
      this.player.x >=
        event.x - 260
    ) {
      this.eventState.set(
        index,
        'warned'
      );

    const cue = this.add.zone(

event.x - 120,
250,
1,
1
)
.setAlpha(0)
.setDepth(13);

      this.tweens.add({
        targets: cue,
        alpha: 0,
        delay: 1500,
        duration: 500,
        onComplete: () =>
          cue.destroy()
      });

      this.game.events.emit(
        'feedback',
        'warning'
      );
    } else if (
      state ===
        'warned' &&
      this.player.x >=
        event.x
    ) {
      this.eventState.set(
        index,
        'active'
      );

      if (
        event.type ===
        'blackout'
      ) {
        this.cameras.main.flash(
          180,
          30,
          70,
          110
        );

        this.game.events.emit(
          'feedback',
          'warning'
        );
      } else {
        this.alarmTimer =
          this.alarmDuration(
            event.type ===
              'chase'
              ? 5000
              : 3000
          );

        this.alarms++;

        this.game.events.emit(
          'feedback',
          'chase'
        );
      }
    }
  }
);

}

complete() {
if (this.finished)
return;

if (this.boss?.active) {
  this.playerCue(
    `${
      this.boss.getData(
        'bossName'
      ) ||
      'ALPHA DINO'
    } BLOCKS THE RELAY · DEFEAT IT`,
    '#ffcf82'
  );

  this.player.body.setVelocityX(
    -260
  );

  return;
}

this.finished = true;
this.physics.pause();
this.player.play(
  'runner-finish',
  true
);
this.player.setTint(
  0xffefad
);

if (!this.motionReduced) {
  this.cameras.main.flash(
    260,
    255,
    208,
    110
  );
}

this.game.events.emit(
  'feedback',
  'complete'
);

if (
  this.mission.story
    ?.completion
) {
  const epilogue =
    this.add.text(
      this.goal.x + 20,
      this.goal.y - 88,
      this.mission.story
        .completion,
      {
        fontFamily: 'DM Mono',
        fontSize: '11px',
        color: '#dffcff',
        stroke: '#08101c',
        strokeThickness: 4,
        wordWrap: {
          width: 380
        },
        align: 'center'
      }
    )
      .setOrigin(.5)
      .setDepth(14);

  this.tweens.add({
    targets: epilogue,
    alpha: 0,
    delay: 2800,
    duration: 500,
    onComplete: () =>
      epilogue.destroy()
  });
}

this.dust.emitParticleAt(
  this.goal.x + 20,
  this.goal.y + 25,
  34
);

this.speedLines.emitParticleAt(
  this.goal.x + 20,
  this.goal.y + 25,
  10
);

this.tweens.add({
  targets: this.player,
  y: this.player.y - 12,
  duration: 130,
  yoyo: true,
  repeat: 1
});

const relayGlow =
  this.add
    .circle(
      this.goal.x + 22,
      this.goal.y + 22,
      20,
      0xffd06e,
      .75
    );

relayGlow.setBlendMode(
  Phaser.BlendModes.ADD
);

relayGlow.setDepth(12);

const completeLabel =
  this.add.text(
    this.goal.x + 22,
    this.goal.y - 34,
    'RELAY LINKED',
    {
      fontFamily: 'DM Mono',
      fontSize: '16px',
      color: '#fff0b5',
      stroke: '#08101c',
      strokeThickness: 5
    }
  )
    .setOrigin(.5)
    .setDepth(13)
    .setScale(.65);

this.tweens.add({
  targets: relayGlow,
  scale: 8,
  alpha: 0,
  duration: 700,
  ease: 'Quad.out',
  onComplete: () =>
    relayGlow.destroy()
});

this.tweens.add({
  targets: completeLabel,
  scale: 1,
  y:
    completeLabel.y -
    20,
  duration: 320,
  ease: 'Back.out'
});

  // ============================================================
// FINAL MISSION CUE
// ============================================================
this.playerCue(
  'MISSION COMPLETE',
  '#ffd06e'
);

this.gadgetPulse(
  0xffd06e,
  22,
  520
);

if (!this.motionReduced) {
  this.cameras.main.flash(
    140,
    255,
    214,
    120
  );

  this.shake(
    120,
    0.006
  );
}

const medalResult =
  this.calculateMissionMedals();

this.time.delayedCall(
  650,
  () => {
    if (!this.scene.isActive()) return;

    this.showMissionMedals();
  },
  undefined,
  this
);
  
this.time.delayedCall(
  120,
  () =>
    this.game.events.emit(
      'complete',
      this.collected,
      this.elapsedMs,
      {
        jumps: this.jumps,
        collisions:
          this.collisions,
        falls: this.falls,
        secrets:
          this.secretsCollected,
        alarms: this.alarms,
        chaseEscapes:
          this.chaseEscapes,
        enemyDefeats:
          this.enemyDefeats ||
          0,
        bossDefeated:
          Boolean(
            this.boss &&
            !this.boss.active
          ),
        medals: medalResult,
        package:
          this.package,
        packageCondition:
          this.packageCondition,
        contract:
          this.mission
            .activeContract,
        modifier:
          this.loadout
            .modifier,
        signalBonusExtra:
          this.boostedSignals *
            5 +
          (
            this.loadout
              .upgrades
              ?.includes(
                'signalXp'
              )
              ? this.collected
              : 0
          ),
        score:
          this.collected *
            100 +
          this.secretsCollected *
            250 +
          this.boostedSignals *
            100
      },
      this.runId
    )
);

}

// ============================================================
// MISSION MEDALS
// Calculates a final run rating from existing run statistics.
// ============================================================
calculateMissionMedals() {
  const totalSignals =
    Math.max(
      1,
      this.mission.signals?.length || 1
    );

  const signalRatio =
    Phaser.Math.Clamp(
      this.collected / totalSignals,
      0,
      1
    );

  const totalSecrets =
    this.mission.secrets?.length || 0;

  const secretRatio =
    totalSecrets > 0
      ? Phaser.Math.Clamp(
          this.secretsCollected / totalSecrets,
          0,
          1
        )
      : 0;

  // ----------------------------------------------------------
  // SPEED
  // ----------------------------------------------------------
  const elapsedSeconds =
    Math.max(
      1,
      this.elapsedMs / 1000
    );

  const expectedSeconds =
    Math.max(
      18,
      (
        (
          this.mission.goal?.x || 4000
        ) -
        (
          this.mission.spawn?.x || 0
        )
      ) / 240
    );

  const speedRatio =
    Phaser.Math.Clamp(
      expectedSeconds / elapsedSeconds,
      0,
      1.35
    );

  this.runRating.speed =
    speedRatio >= 1.10
      ? 3
      : speedRatio >= .86
        ? 2
        : 1;

  // ----------------------------------------------------------
  // COMBAT
  // ----------------------------------------------------------
  const defeats =
    this.enemyDefeats || 0;

  const enemyCount =
    Math.max(
      1,
      this.enemies?.getChildren?.().length || 1
    );

  const combatRatio =
    Phaser.Math.Clamp(
      defeats / enemyCount,
      0,
      1
    );

  this.runRating.combat =
    combatRatio >= .75
      ? 3
      : combatRatio >= .35
        ? 2
        : 1;

  // ----------------------------------------------------------
  // COLLECTION
  // ----------------------------------------------------------
  const collectionScore =
    signalRatio * .70 +
    secretRatio * .30;

  this.runRating.collection =
    collectionScore >= .90
      ? 3
      : collectionScore >= .60
        ? 2
        : 1;

  // ----------------------------------------------------------
  // SURVIVAL
  // ----------------------------------------------------------
  const deaths =
    this.deaths || 0;

  const collisions =
    this.collisions || 0;

  const falls =
    this.falls || 0;

  let survivalScore = 3;

  if (deaths >= 2) {
    survivalScore = 1;
  } else if (
    deaths === 1 ||
    collisions >= 3 ||
    falls >= 3
  ) {
    survivalScore = 2;
  }

  this.runRating.survival =
    survivalScore;

  // ----------------------------------------------------------
  // OVERALL
  // ----------------------------------------------------------
  const total =
    this.runRating.speed +
    this.runRating.combat +
    this.runRating.collection +
    this.runRating.survival;

  this.runRating.overall =
    total >= 11
      ? 'S'
      : total >= 9
        ? 'A'
        : total >= 7
          ? 'B'
          : 'C';

  this.medalResult = {
    speed: this.runRating.speed,
    combat: this.runRating.combat,
    collection: this.runRating.collection,
    survival: this.runRating.survival,
    overall: this.runRating.overall,

    total,
    timeMs: this.elapsedMs,
    signals: this.collected,
    secrets: this.secretsCollected,
    deaths,
    collisions,
    falls,
    enemyDefeats: defeats,

    bossDefeated: Boolean(
      this.boss &&
      !this.boss.active
    )
  };

  return this.medalResult;
}

// ============================================================
// RUN EVALUATION UI
// Displays the final mission rating without changing gameplay.
// ============================================================
showMissionMedals() {

  if (
    !this.medalResult ||
    this.gameOverUI
  ) {
    return;
  }

  if (this.missionMedalsUI) {
    return;
  }

  const result =
    this.medalResult;

  const width =
    this.scale.width;

  const height =
    this.scale.height;

  const stars = value =>
    '★'.repeat(value) +
    '☆'.repeat(3 - value);

  const overallColor =
    result.overall === 'S'
      ? '#fff0a8'
      : result.overall === 'A'
        ? '#8df4ff'
        : result.overall === 'B'
          ? '#aee37f'
          : '#ff826e';

  const panelWidth =
    Math.min(
      width - 36,
      430
    );

const panelHeight = Math.min(
  height - 28,
  330
);

  const panel =
    this.add
      .rectangle(
        width / 2,
        height / 2,
        panelWidth,
        panelHeight,
        0x050914,
        .96
      )
      .setStrokeStyle(
        2,
        0x8df4ff,
        .75
      )
      .setScrollFactor(0)
      .setDepth(120);

  const header =
    this.add
      .text(
        width / 2,
        height / 2 - 132,
        'MISSION COMPLETE',
        {
          fontFamily: 'DM Mono',
          fontSize: width < 600
            ? '14px'
            : '16px',
          color: '#8df4ff',
          stroke: '#08101c',
          strokeThickness: 5,
          align: 'center'
        }
      )
      .setOrigin(.5)
      .setScrollFactor(0)
      .setDepth(121);

  const subtitle =
    this.add
      .text(
        width / 2,
        height / 2 - 105,
        'DELIVERY REPORT · RUN PERFORMANCE',
        {
          fontFamily: 'DM Mono',
          fontSize: width < 600
            ? '8px'
            : '9px',
          color: '#6f849d',
          align: 'center'
        }
      )
      .setOrigin(.5)
      .setScrollFactor(0)
      .setDepth(121);

  const resultText =
    this.add
      .text(
        width / 2,
        height / 2 - 38,
        [
          `SPEED       ${stars(result.speed)}`,
          `COMBAT      ${stars(result.combat)}`,
          `COLLECTION  ${stars(result.collection)}`,
          `SURVIVAL    ${stars(result.survival)}`
        ].join('\n'),
        {
          fontFamily: 'DM Mono',
          fontSize: width < 600
            ? '10px'
            : '12px',
          color: '#dffcff',
          stroke: '#08101c',
          strokeThickness: 4,
          lineSpacing: 11,
          align: 'left'
        }
      )
      .setOrigin(.5)
      .setScrollFactor(0)
      .setDepth(121);

  // ============================================================
// FINAL RANK · HERO REVEAL
// ============================================================
const rankGlow =
  this.add
    .circle(
      width / 2,
      height / 2 + 78,
      width < 600 ? 44 : 52,
      Phaser.Display.Color.HexStringToColor(
        overallColor
      ).color,
      .16
    )
    .setScrollFactor(0)
    .setDepth(120);

rankGlow.setStrokeStyle(
  2,
  Phaser.Display.Color.HexStringToColor(
    overallColor
  ).color,
  .82
);

this.tweens.add({
  targets: rankGlow,
  scale: 2.4,
  alpha: 0,
  duration: 720,
  ease: 'Quad.out',
  onComplete: () =>
    rankGlow.destroy()
});

this.time.delayedCall(
  220,
  () => {
    this.tweens.add({
      targets: overall,
      alpha: 1,
      scale: 1,
      duration: 520,
      ease: 'Back.out'
    });

    if (!this.motionReduced) {
      this.cameras.main.flash(
        120,
        result.overall === 'S'
          ? 255
          : result.overall === 'A'
            ? 120
            : result.overall === 'B'
              ? 140
              : 255,
        result.overall === 'B'
          ? 220
          : 120,
        170
      );
    }
  }
);
  

  const overall =
    this.add
      .text(
        width / 2,
        height / 2 + 78,
        result.overall,
        {
          fontFamily: 'DM Mono',
          fontSize: width < 600
            ? '54px'
            : '64px',
          fontStyle: 'bold',
          color: overallColor,
          stroke: '#08101c',
          strokeThickness: 8,
          align: 'center'
        }
      )
      .setOrigin(.5)
      .setScrollFactor(0)
      .setDepth(121);

  const summary =
    this.add
      .text(
        width / 2,
        height / 2 + 125,
        `RATING ${result.total} / 12  ·  ${result.signals} SIGNALS  ·  ${result.secrets} SECRETS`,
        {
          fontFamily: 'DM Mono',
          fontSize: width < 600
            ? '7px'
            : '8px',
          color: '#8ba0b8',
          align: 'center'
        }
      )
      .setOrigin(.5)
      .setScrollFactor(0)
      .setDepth(121);



  const objects = [
  panel,
  header,
  subtitle,
  resultText,
  overall,
  summary
];

objects.forEach(
  object => {
    object.setAlpha(0);
    object.setScale(.94);
  }
);

// ============================================================
// FINAL RANK · HERO INITIAL STATE
// ============================================================
overall.setScale(.35);
overall.setAlpha(0);

this.missionMedalsUI = objects;

 this.tweens.add({
  targets: objects.filter(
    object => object !== overall
  ),
  alpha: 1,
  scaleX: 1,
  scaleY: 1,
  duration: 360,
  ease: 'Back.out'
});

this.tweens.add({
  targets: overall,
  alpha: 1,
  scaleX: 1,
  scaleY: 1,
  duration: 560,
  delay: 360,
  ease: 'Back.out',
  onComplete: () => {
    if (
      this.missionMedalsUI === objects
    ) {
      this.missionMedalsUI = null;
    }
  }
});
}

showGameOverScreen(message = 'RUN ENDED') {

  if (this.gameOverUI) {
    return;
  }

  const width =
    this.scale.width;

  const height =
    this.scale.height;

  const panelWidth =
    Math.min(
      width - 36,
      430
    );

  const panelHeight =
    Math.min(
      height - 70,
      390
    );

  const remainingLives =
    Math.max(
      0,
      this.deathLimit - this.deaths
    );

  const objects = [];

  /*
   * ============================================================
   * GAME OVER · BACKDROP
   * ============================================================
   */

  const backdrop =
    this.add
      .rectangle(
        width / 2,
        height / 2,
        width,
        height,
        0x03050b,
        0.78
      )
      .setScrollFactor(0)
      .setDepth(119);

  objects.push(backdrop);

  /*
   * ============================================================
   * GAME OVER · PANEL
   * ============================================================
   */

  const panel =
    this.add
      .rectangle(
        width / 2,
        height / 2,
        panelWidth,
        panelHeight,
        0x070d18,
        0.98
      )
      .setStrokeStyle(
        2,
        0xff826e,
        0.82
      )
      .setScrollFactor(0)
      .setDepth(120);

  objects.push(panel);

  /*
   * ============================================================
   * GAME OVER · TITLE
   * ============================================================
   */

  const title =
    this.add
      .text(
        width / 2,
        height / 2 - 135,
        'RUN FAILED',
        {
          fontFamily: 'DM Mono',
          fontSize:
            width < 600
              ? '24px'
              : '30px',
          fontStyle: 'bold',
          color: '#ff826e',
          stroke: '#08101c',
          strokeThickness: 6,
          align: 'center'
        }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(121);

  objects.push(title);

  /*
   * ============================================================
   * GAME OVER · SUBTITLE
   * ============================================================
   */

  const subtitle =
    this.add
      .text(
        width / 2,
        height / 2 - 98,
        'RECOVERY LIMIT REACHED',
        {
          fontFamily: 'DM Mono',
          fontSize:
            width < 600
              ? '9px'
              : '11px',
          color: '#7f93ab',
          align: 'center'
        }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(121);

  objects.push(subtitle);

  /*
   * ============================================================
   * GAME OVER · REASON
   * ============================================================
   */

  const reason =
    this.add
      .text(
        width / 2,
        height / 2 - 52,
        message,
        {
          fontFamily: 'DM Mono',
          fontSize:
            width < 600
              ? '9px'
              : '11px',
          color: '#dffcff',
          stroke: '#08101c',
          strokeThickness: 4,
          wordWrap: {
            width:
              panelWidth - 54
          },
          align: 'center'
        }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(121);

  objects.push(reason);

  /*
   * ============================================================
   * GAME OVER · RUN STATS
   * ============================================================
   */

  const stats =
    this.add
      .text(
        width / 2,
        height / 2 + 5,
        [
          `DEATHS       ${this.deaths}`,
          `COLLISIONS   ${this.collisions}`,
          `FALLS        ${this.falls}`,
          `SIGNALS      ${this.collected}`,
          `SECRETS      ${this.secretsCollected}`,
          `RECOVERIES   ${remainingLives}`
        ].join('\n'),
        {
          fontFamily: 'DM Mono',
          fontSize:
            width < 600
              ? '10px'
              : '12px',
          color: '#b9f5ff',
          stroke: '#08101c',
          strokeThickness: 4,
          lineSpacing: 7,
          align: 'left'
        }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(121);

  objects.push(stats);

  /*
   * ============================================================
   * GAME OVER · RESTART BUTTON
   * ============================================================
   */

  const restartButton =
    this.add
      .rectangle(
        width / 2,
        height / 2 + 118,
        Math.min(
          panelWidth - 70,
          250
        ),
        46,
        0x10263a,
        0.98
      )
      .setStrokeStyle(
        2,
        0x8df4ff,
        0.9
      )
      .setScrollFactor(0)
      .setDepth(121)
      .setInteractive({
        useHandCursor: true
      });

  objects.push(restartButton);

  const restartText =
    this.add
      .text(
        width / 2,
        height / 2 + 118,
        'RESTART RUN',
        {
          fontFamily: 'DM Mono',
          fontSize:
            width < 600
              ? '11px'
              : '13px',
          fontStyle: 'bold',
          color: '#dffcff',
          align: 'center'
        }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(122);

  objects.push(restartText);

    /*
 * ============================================================
 * GAME OVER · BRIEFING BUTTON
 * ============================================================
 */

const briefingButton =
  this.add
    .rectangle(
      width / 2,
      height / 2 + 174,
      Math.min(
        panelWidth - 70,
        250
      ),
      40,
      0x0b1524,
      0.96
    )
    .setStrokeStyle(
      1,
      0x52677d,
      0.9
    )
    .setScrollFactor(0)
    .setDepth(121)
    .setInteractive({
      useHandCursor: true
    });

objects.push(
  briefingButton
);

const briefingText =
  this.add
    .text(
      width / 2,
      height / 2 + 174,
      'RETURN TO BRIEFING',
      {
        fontFamily: 'DM Mono',
        fontSize:
          width < 600
            ? '9px'
            : '10px',
        fontStyle: 'bold',
        color: '#8fa5bc',
        align: 'center'
      }
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(122);

objects.push(
  briefingText
);

  /*
   * ============================================================
   * BUTTON INTERACTION
   * ============================================================
   */

  restartButton.on(
    'pointerover',
    () => {

      restartButton
        .setFillStyle(
          0x163b52,
          1
        )
        .setStrokeStyle(
          2,
          0xb9f5ff,
          1
        );

      restartText.setColor(
        '#ffffff'
      );
    }
  );

    briefingButton.on(
  'pointerover',
  () => {

    briefingButton
      .setFillStyle(
        0x142336,
        1
      )
      .setStrokeStyle(
        1,
        0x8df4ff,
        0.85
      );

    briefingText.setColor(
      '#dffcff'
    );
  }
);

briefingButton.on(
  'pointerout',
  () => {

    briefingButton
      .setFillStyle(
        0x0b1524,
        0.96
      )
      .setStrokeStyle(
        1,
        0x52677d,
        0.9
      );

    briefingText.setColor(
      '#8fa5bc'
    );
  }
);

    briefingButton.on(
  'pointerdown',
  () => {

    if (
      this.gameOverRestarting
    ) {
      return;
    }

    this.gameOverRestarting = true;

    this.gameOverUI?.forEach(
      object => object.destroy()
    );

    this.gameOverUI = null;

    this.scene.stop();

    const intro =
      document.getElementById(
        'intro'
      );

    const worldMap =
      document.getElementById(
        'worldMap'
      );

    const preflight =
      document.getElementById(
        'preflight'
      );

    worldMap?.classList.add(
      'hidden'
    );

    preflight?.classList.add(
      'hidden'
    );

    intro?.classList.remove(
      'hidden'
    );
  }
);

  restartButton.on(
    'pointerout',
    () => {

      restartButton
        .setFillStyle(
          0x10263a,
          0.98
        )
        .setStrokeStyle(
          2,
          0x8df4ff,
          0.9
        );

      restartText.setColor(
        '#dffcff'
      );
    }
  );

  restartButton.on(
    'pointerdown',
    () => {

      if (this.gameOverRestarting) {
        return;
      }

      this.gameOverRestarting = true;

      if (
  this.missionMedalsUI
) {
  this.missionMedalsUI.forEach(
    object => {
      if (
        object &&
        object.active
      ) {
        object.destroy();
      }
    }
  );

  this.missionMedalsUI = null;
}

this.missionMedalsClosing = true;

this.tweens.killAll();
      this.scene.restart();
    }
  );

  /*
   * ============================================================
   * GAME OVER · ANIMATION
   * ============================================================
   */

  objects.forEach(
    object => {

      object.setAlpha(0);

      if (
        object !== backdrop
      ) {
        object.setScale(
          0.94
        );
      }
    }
  );

  this.tweens.add({
    targets: objects,
    alpha: 1,
    duration: 280,
    ease: 'Quad.out'
  });

  this.tweens.add({
    targets: objects.filter(
      object =>
        object !== backdrop
    ),
    scaleX: 1,
    scaleY: 1,
    duration: 360,
    ease: 'Back.out'
  });

  this.gameOverUI =
    objects;

    /*
 * ============================================================
 * GAME OVER · VISUAL IMPACT
 * ============================================================
 */

this.time.delayedCall(
  520,
  () => {

    if (
      !this.gameOverUI ||
      this.gameOverRestarting
    ) {
      return;
    }

    /*
     * TITLE IMPACT
     */

    this.tweens.add({
      targets: title,
      scaleX: 1.07,
      scaleY: 1.07,
      duration: 120,
      ease: 'Quad.out',
      yoyo: true
    });

    /*
     * RED ALERT PULSE
     */

    this.tweens.add({
      targets: backdrop,
      alpha: 0.9,
      duration: 160,
      ease: 'Quad.out',
      yoyo: true
    });

    /*
     * RESTART BUTTON BREATHING
     */

    this.tweens.add({
      targets: [
        restartButton,
        restartText
      ],
      scaleX: 1.035,
      scaleY: 1.035,
      duration: 500,
      ease: 'Sine.inOut',
      yoyo: true,
      repeat: -1
    });

  }
);
    
}

fail(message) {

if (
this.briefingProtected ||
this.finished ||
this.respawning ||
this.respawnGrace > 0 ||
this.healthInvulnerable > 0
) {
return;
}

const collision =
  message.includes(
    'barrier'
  ) ||
  message.includes(
    'interceptor'
  );

if (collision) {
  this.collisions++;
} else {
  this.falls++;
}

this.deaths++;

if (this.package?.condition) {
  this.packageCondition =
    Math.max(
      0,
      this.packageCondition -
        (
          collision
            ? 25
            : 35
        )
    );

  this.game.events.emit(
    'package',
    this.packageCondition
  );
}

if (
  this.deaths >=
  this.deathLimit
) {
  this.finished = true;
  this.physics.pause();

  this.player.play(
    'runner-hit',
    true
  );

  this.player.setTint(
    0xff826e
  );

this.shake(
  170,
  .014
);

this.showGameOverScreen(
  `RUN ENDED · ${this.deathLimit} / ${this.deathLimit} RECOVERIES USED`
);

this.game.events.emit(
    'game-over',
    `RUN ENDED · ${this.deathLimit} / ${this.deathLimit} RECOVERIES USED`,
    this.deaths,
    this.runId
  );

  return;
}

this.game.events.emit(
  'deaths',
  this.deaths,
  this.deathLimit
);

this.respawning = true;
this.physics.pause();

this.player.play(
  'runner-hit',
  true
);

this.player.setTint(
  0xff826e
);

this.shake(
  170,
  .014
);

if (!this.motionReduced) {
  this.cameras.main.flash(
    120,
    255,
    100,
    90
  );
}

this.game.events.emit(
  'feedback',
    'death'
);

this.dust.emitParticleAt(
  this.player.x,
  this.player.y + 10,
  12
);

this.speedLines.emitParticleAt(
  this.player.x,
  this.player.y,
  8
);

this.time.delayedCall(
  180,
  () =>
    this.respawnCheckpoint()
);

}

respawnCheckpoint() {
  this.game.events.emit(
  'feedback',
  'respawn'
);
if (
this.loadout.modifier
?.id ===
'noCheckpoints'
) {
this.checkpoint = {
x: this.mission.spawn.x,
y: this.mission.spawn.y,
signals: new Set(),
secrets: new Set()
};
}

let lostSignals = 0;
let lostSecrets = 0;

this.signals
  .getChildren()
  .forEach(
    signal => {
      if (
        !signal.active &&
        !this.checkpoint.signals.has(
          signal.getData(
            'id'
          )
        )
      ) {
        signal.enableBody(
          true,
          signal.x,
          signal.y,
          true,
          true
        );

        lostSignals++;
      }
    }
  );

this.secrets
  .getChildren()
  .forEach(
    secret => {
      if (
        !secret.active &&
        !this.checkpoint.secrets.has(
          secret.getData(
            'id'
          )
        )
      ) {
        secret.enableBody(
          true,
          secret.x,
          secret.y,
          true,
          true
        );

        lostSecrets++;
      }
    }
  );

this.collected =
  this.checkpoint.signals.size;

this.secretsCollected =
  this.checkpoint.secrets.size;

this.health = 3;

this.game.events.emit(
  'health',
  this.health
);

this.player
  .clearTint()
  .setPosition(
    this.checkpoint.x,
    this.checkpoint.y
  )
  .play(
    'runner-idle',
    true
  );

this.player.body.reset(
  this.checkpoint.x,
  this.checkpoint.y
);

this.player.body.setVelocity(
  0,
  0
);

this.respawnGrace =
  1100;

this.healthInvulnerable =
  2200;

// Remove attacks already covering the checkpoint and make nearby enemies give the player room to recover.
[
  this.eggs,
  this.comets
].forEach(
  group =>
    group
      ?.getChildren()
      .forEach(
        projectile => {
          if (
            projectile.active &&
            Phaser.Math.Distance.Between(
              projectile.x,
              projectile.y,
              this.checkpoint.x,
              this.checkpoint.y
            ) < 360
          ) {
            projectile.destroy();
          }
        }
      )
);

this.enemies
  ?.getChildren()
  .forEach(
    enemy => {
      if (
        !enemy.active ||
        Math.abs(
          enemy.x -
          this.checkpoint.x
        ) > 180
      ) {
        return;
      }

      const route =
        enemy.getData(
          'route'
        );

      const direction =
        enemy.x <
        this.checkpoint.x
          ? -1
          : 1;

      enemy.x =
        Phaser.Math.Clamp(
          this.checkpoint.x +
            direction * 210,
          route.min,
          route.max
        );

      enemy.setData(
        'direction',
        direction
      );

      enemy.body.updateFromGameObject();
    }
  );

if (
  this.loadout.upgrades
    ?.includes(
      'recovery'
    )
) {
  this.energy =
    Math.min(
      this.energyMax,
      this.energy + 20
    );

  this.playerCue(
    'RECOVERY +20 ENERGY',
    '#aee37f'
  );
}

const shield =
  this.add
    .circle(
      this.player.x,
      this.player.y,
      22,
      0x8df4ff,
      .22
    )
    .setDepth(11);

this.tweens.add({
  targets: shield,
  scale: 3.5,
  alpha: 0,
  duration: 900,
  onComplete: () =>
    shield.destroy()
});

this.player.setAlpha(
  .45
);

this.tweens.add({
  targets: this.player,
  alpha: 1,
  duration: 260
});

this.playerCue(
 'SAFE RESET · SHIELD ACTIVE',
  '#b9f5ff'
);

this.physics.resume();

this.respawning = false;

const lost =
  lostSignals +
  lostSecrets;

const label =
  this.add.text(
    this.checkpoint.x,
    this.checkpoint.y - 55,
    lost
      ? `CHECKPOINT · LOST ${lost} PICKUP${
          lost === 1
            ? ''
            : 'S'
        }`
      : 'CHECKPOINT · ROUTE RESET',
    {
      fontFamily: 'DM Mono',
      fontSize: '11px',
      color: '#b9f5ff',
      stroke: '#08101c',
      strokeThickness: 4
    }
  )
    .setOrigin(.5)
    .setDepth(13);

this.tweens.add({
  targets: label,
  y: label.y - 24,
  alpha: 0,
  duration: 900,
  onComplete: () =>
    label.destroy()
});

this.game.events.emit(
  'checkpoint',
  this.collected,
  this.secretsCollected,
  lost
);

}

update(_, delta) {
if (
this.finished ||
this.respawning ||
this.cinematicActive
) {
return;
}

  // ============================================================
// CELESTIAL · ORBIT UPDATE
// ============================================================

const celestialTime =
  (this.time.now % 180000) / 180000;

const sunAngle =
  celestialTime * Math.PI * 2;

const moonAngle =
  sunAngle + Math.PI;

const sunX =
  930 +
  Math.cos(sunAngle) * 260;

const sunY =
  150 +
  Math.sin(sunAngle) * 75;

const moonX =
  930 +
  Math.cos(moonAngle) * 260;

const moonY =
  150 +
  Math.sin(moonAngle) * 75;

  const sunAltitude =
  Phaser.Math.Clamp(
    (150 - sunY) / 75,
    -1,
    1
  );

const moonAltitude =
  Phaser.Math.Clamp(
    (150 - moonY) / 75,
    -1,
    1
  );

const daylight =
  Phaser.Math.Clamp(
    (Math.sin(sunAngle) + 1) * 0.5,
    0,
    1
  );

  const daylightSmooth =
  Phaser.Math.SmoothStep(
    daylight,
    0,
    1
  );

const nightAmount =
   1 - daylightSmooth;

  const moonShadowAlpha =
  Phaser.Math.Linear(
    0.62,
    0.88,
    nightAmount
  );

const sunGlowAlpha =
  Phaser.Math.Linear(
    0.06,
    0.16,
    daylightSmooth
  );

const moonGlowAlpha =
  Phaser.Math.Linear(
   0.18,
   0.035,
  daylightSmooth
  );

if (
  this.celestialSun &&
  this.celestialSunGlow &&
  this.celestialMoon &&
  this.celestialMoonGlow
) {
  this.celestialSun.setPosition(
    sunX,
    sunY
  );

  this.celestialMoon.setPosition(
  moonX,
  moonY
);

const moonScale =
  0.94 +
  Math.max(
    0,
    moonAltitude
  ) * 0.08;

const moonVisibility =
  Phaser.Math.Clamp(
    0.55 +
    moonAltitude * 0.45,
    0.35,
    1
  );

this.celestialMoon.setScale(
  moonScale
);

this.celestialMoon.setAlpha(
  moonVisibility
);
  

  const sunScale =
  0.92 +
  Math.max(
    0,
    sunAltitude
  ) * 0.10;

  const sunVisibility =
  Phaser.Math.Clamp(
    0.55 +
    sunAltitude * 0.45,
    0.35,
    1
  );

this.celestialSun.setScale(
  sunScale
);

  this.celestialSun.setAlpha(
  sunVisibility
);

 this.celestialSunGlow.setPosition(
  sunX,
  sunY - 2
);

  const sunGlowScale =
  0.96 +
  Math.max(
    0,
    sunAltitude
  ) * 0.06;

this.celestialSunGlow.setScale(
  sunGlowScale
);

  if (this.celestialMoonShadow) {
  this.celestialMoonShadow.setPosition(
    moonX + 24,
    moonY - 15
  );
}

 this.celestialMoonGlow.setPosition(
  moonX,
  moonY - 2
);

  const celestialPulse =
  1 +
  Math.sin(this.time.now * 0.0018) * 0.035;

this.celestialSunGlow.setAlpha(
  Phaser.Math.Clamp(
    sunGlowAlpha * celestialPulse,
    0,
    1
  )
);

this.celestialMoonGlow.setAlpha(
  Phaser.Math.Clamp(
    moonGlowAlpha * celestialPulse,
    0,
    1
  )
);
  if (this.celestialMoonShadow) {
 this.celestialMoonShadow.setAlpha(
  Phaser.Math.Clamp(
    moonShadowAlpha +
      Math.sin(this.time.now * 0.0014) * 0.015,
    0,
    1
  )
);
}
}

this.elapsedMs += delta;
this.timeEmitTimer += delta;

if (
  this.timeEmitTimer >=
  100
) {
  this.timeEmitTimer = 0;

  this.game.events.emit(
    'time',
    this.elapsedMs
  );
}

if (
  Phaser.Input.Keyboard.JustDown(
    this.keys.ESC
  )
) {
  this.dismissIntelCard();
}

this.respawnGrace =
  Math.max(
    0,
    this.respawnGrace -
      delta
  );

if (
  !this.sectorTwoAnnounced &&
  this.player.x >= 4080
) {
  this.sectorTwoAnnounced =
    true;

  this.game.events.emit(
    'sector',
    {
      number: 2,
      signals:
        this.mission
          .signals
          .length,
      checkpoints:
        this.mission
          .checkpoints
          .length
    }
  );

  this.playerCue(
    'SECTOR TWO · RELAY SPIRE',
    '#ffd06e'
  );
}

this.lowEnergyCueTimer =
  Math.max(
    0,
    this.lowEnergyCueTimer -
      delta
  );

this.boostCooldown =
  Math.max(
    0,
    this.boostCooldown -
      delta
  );

this.blasterCooldown =
  Math.max(
    0,
    this.blasterCooldown -
      delta
  );

const previousDashCooldown =
  this.dashCooldown;

this.dashCooldown =
  Math.max(
    0,
    this.dashCooldown -
      delta
  );

this.dashTimer =
  Math.max(
    0,
    this.dashTimer -
      delta
  );

this.wallJumpTimer =
  Math.max(
    0,
    this.wallJumpTimer -
      delta
  );

const packageSpeed =
  this.package
    ?.speedMultiplier ||
  1;

if (!this.dashTimer) {
  this.player.body.setMaxVelocityX(
    RUNNER_TUNING.maxRunSpeed *
    packageSpeed
  );
}

if (
  previousDashCooldown >
    0 &&
  !this.dashCooldown
) {
  const readyPulse =
    this.add
      .circle(
        this.player.x,
        this.player.y,
        8,
        0x8df4ff,
        .45
      )
      .setDepth(11);

  this.tweens.add({
    targets: readyPulse,
    scale: 2.4,
    alpha: 0,
    duration: 180,
    onComplete: () =>
      readyPulse.destroy()
  });

  this.playerCue(
    'DASH READY'
  );
}

this.wallJumpCooldown =
  Math.max(
    0,
    this.wallJumpCooldown -
      delta
  );

const upgrades =
  this.loadout.upgrades ||
  [];

const modifier = this.loadout.modifier;

this.energyMax =
  modifier?.id === 'lowEnergy'
    ? 65
    : upgrades.includes('energyCore')
      ? 115
      : 100;

this.energy =
  Math.min(
    this.energyMax,
    this.energy +
      delta *
        .018 *
        (
          upgrades.includes(
            'recharge'
          )
            ? 1.2
            : 1
        )
  );

this.vaultCooldown =
  Math.max(
    0,
    this.vaultCooldown -
      delta
  );

const previousGadgetCooldowns =
  this.gadgetCooldowns;

this.gadgetCooldowns =
  this.gadgetCooldowns.map(
    cooldown =>
      Math.max(
        0,
        cooldown -
          delta
      )
  );

this.buildCooldowns =
  this.buildCooldowns.map(
    cooldown =>
      Math.max(
        0,
        cooldown -
          delta
      )
  );

previousGadgetCooldowns.forEach(
  (cooldown, slot) => {
    if (
      cooldown > 0 &&
      this.gadgetCooldowns[
        slot
      ] === 0 &&
      this.loadout.equipment
        ?.[
          slot
        ]
    ) {
      this.playerCue(
        `${
          slot + 3
        } READY`,
        '#ffd06e'
      );

      const readyPulse =
        this.add
          .circle(
            this.player.x,
            this.player.y,
            7,
            0xffd06e,
            .4
          )
          .setDepth(11);

      this.tweens.add({
        targets: readyPulse,
        scale: 2.1,
        alpha: 0,
        duration: 180,
        onComplete: () =>
          readyPulse.destroy()
      });
    }
  }
);

this.empTimer =
  Math.max(
    0,
    (
      this.empTimer ||
      0
    ) -
      delta
  );

this.decoyTimer =
  Math.max(
    0,
    (
      this.decoyTimer ||
      0
    ) -
      delta
  );

this.boosterTimer =
  Math.max(
    0,
    (
      this.boosterTimer ||
      0
    ) -
      delta
  );

if (!this.empTimer) {
  this.enemies
    ?.getChildren()
    .forEach(
      enemy =>
        enemy.clearTint()
    );
}

if (
  !this.decoyTimer &&
  this.decoyBeacon
) {
  this.decoyBeacon.destroy();
  this.decoyBeacon = null;
}

if (this.boosterAura) {
  if (this.boosterTimer) {
    this.boosterAura.setPosition(
      this.player.x,
      this.player.y
    );
  } else {
    this.boosterAura.destroy();
    this.boosterAura = null;
  }
}

if (
  Math.round(
    this.energy
  ) !==
  this.energyEmit
) {
  this.energyEmit =
    Math.round(
      this.energy
    );

  this.game.events.emit(
    'energy',
    this.energyEmit /
      this.energyMax *
      100
  );
}

this.movingGates
  ?.getChildren()
  .forEach(
    gate =>
      gate.body.updateFromGameObject()
  );

this.updateWeather(
  delta
);

this.eventCheckTimer -= delta;

if (this.eventCheckTimer <= 0) {
this.eventCheckTimer = 100;
this.updateEvents();
}

this.updateEnemies(
  delta
);

this.updateSciFiThreats(
  delta
);

this.routeHintTimer -= delta;

if (this.routeHintTimer <= 0) {
this.routeHintTimer = 100;
this.updateRouteHints();
}

if (
  Phaser.Input.Keyboard.JustDown(
    this.keys.ONE
  ) ||
  this.mobileActions.build1
) {
  this.useBuild(0);
}

if (
  Phaser.Input.Keyboard.JustDown(
    this.keys.TWO
  ) ||
  this.mobileActions.build2
) {
  this.useBuild(1);
}

if (
  Phaser.Input.Keyboard.JustDown(
    this.keys.THREE
  ) ||
  this.mobileActions.gadget1
) {
  this.useGadget(0);
}

if (
  Phaser.Input.Keyboard.JustDown(
    this.keys.FOUR
  ) ||
  this.mobileActions.gadget2
) {
  this.useGadget(1);
}

this.mobileActions.build1 =
  false;

this.mobileActions.build2 =
  false;

this.mobileActions.gadget1 =
  false;

this.mobileActions.gadget2 =
  false;

this.healthInvulnerable =
  Math.max(
    0,
    this.healthInvulnerable -
      delta
  );

this.swordCooldown =
  Math.max(
    0,
    this.swordCooldown -
      delta
  );

this.comboTimer =
  Math.max(
    0,
    this.comboTimer -
      delta
  );

 const previousOverdriveTimer =
  this.overdriveTimer;

this.overdriveTimer =
  Math.max(
    0,
    this.overdriveTimer -
      delta
  );

if (
  previousOverdriveTimer > 0 &&
  this.overdriveTimer === 0 &&
  this.player?.active
) {
  this.playerCue(
    'OVERDRIVE OFF',
    '#8ba0b8'
  );

  this.gadgetPulse(
    0x8ba0b8,
    10,
    240
  );
}

this.perfectDodgeWindow =

Math.max(
0,
this.perfectDodgeWindow -
delta
);

this.perfectDodgeCooldown =
Math.max(
0,
this.perfectDodgeCooldown -
delta
);

if (
  !this.comboTimer &&
  this.combatCombo
) {

  if (
    this.combatCombo >= 3 &&
    this.player?.active
  ) {
    this.playerCue(
      'COMBO LOST',
      '#ff826e'
    );

    this.gadgetPulse(
      0xff826e,
      11,
      260
    );
  }

  // ============================================================
// COMBO BREAK · IMPACT FX
// ============================================================
if (!this.motionReduced) {
  const comboBreak =
    this.add
      .circle(
        this.player.x,
        this.player.y,
        12,
        0xff826e,
        .22
      )
      .setDepth(13);

  comboBreak.setStrokeStyle(
    2,
    0xffb3a8,
    .9
  );

  this.tweens.add({
    targets: comboBreak,
    scale: 4.2,
    alpha: 0,
    duration: 300,
    ease: 'Quad.out',
    onComplete: () =>
      comboBreak.destroy()
  });

  this.shake(
    90,
    0.0035
  );
}
  this.combatCombo = 0;

  this.game.events.emit(
    'combo',
    0,
    0
  );
}

this.ammoRecharge +=
  delta;

if (
  this.ammo <
    this.ammoMax &&
  this.ammoRecharge >=
    1050
) {
  this.ammo++;
  this.gadgetPulse(
  0x8df4ff,
  8,
  260
);
  this.ammoRecharge = 0;

  this.game.events.emit(
    'ammo',
    this.ammo /
      this.ammoMax *
      100
  );
}

this.updateBuilds();
this.updateNarrative();

const swordPressed =
  Phaser.Input.Keyboard.JustDown(
    this.keys.Q
  ) ||
  this.mobileActions.sword;

this.mobileActions.sword =
  false;

if (
  Phaser.Input.Keyboard.JustDown(
    this.keys.E
  )
) {
  this.useBlaster();
}

if (
  this.mobileActions.fire
) {
  this.useBlaster();
}

this.mobileActions.fire =
  false;

if (swordPressed) {
  this.useSword();
}

// energyMax is resolved before regeneration above.

const body =
  this.player.body;

const left =
  this.cursors.left.isDown ||
  this.keys.A.isDown ||
  this.mobileDirection ===
    'left';

const right =
  this.cursors.right.isDown ||
  this.keys.D.isDown ||
  this.mobileDirection ===
    'right';

const onGround =
  body.blocked.down ||
  body.touching.down;

const movingAgainstVelocity =
  (
    left &&
    body.velocity.x >
      20
  ) ||
  (
    right &&
    body.velocity.x <
      -20
  );

const acceleration =
  (
    movingAgainstVelocity
      ? RUNNER_TUNING.turnAcceleration
      : onGround
        ? RUNNER_TUNING.groundAcceleration
        : RUNNER_TUNING.airAcceleration
  ) *
  (
    !onGround &&
    upgrades.includes(
      'airControl'
    )
      ? 1.12
      : 1
  );

if (left) {
  body
    .setAccelerationX(
      -acceleration
    )
    .setDragX(0);

  this.player.setFlipX(
    true
  );
} else if (right) {
  body
    .setAccelerationX(
      acceleration
    )
    .setDragX(0);

  this.player.setFlipX(
    false
  );
} else {
  body
    .setAccelerationX(0)
    .setDragX(
      onGround
        ? RUNNER_TUNING.groundDeceleration
        : 420
    );
}

if (
  onGround &&
  (
    upgrades.includes(
      'stride'
    ) ||
    modifier?.id ===
      'highSpeed'
  )
) {
  body.setMaxVelocityX(
    RUNNER_TUNING.maxRunSpeed *
    packageSpeed *
    (
      modifier?.id ===
      'highSpeed'
        ? 1.12
        : 1.04
    )
  );
}

body.setGravityY(
  (
    body.velocity.y > 0
      ? RUNNER_TUNING.fallGravity
      : 0
  ) *
  (
    this.mission.gravityMode ===
    'low'
      ? .55
      : 1
  ) -
  (
    this.mission.gravityMode ===
    'low'
      ? 700
      : 0
  )
);

body.setMaxVelocityY(RUNNER_TUNING.maxFallSpeed);

if (onGround) {
  this.coyote =
    RUNNER_TUNING.coyoteMs;

  this.jumpsUsed = 0;
  this.airDashUsed = false;
} else {
  this.coyote =
    Math.max(
      0,
      this.coyote -
        delta
    );
}

const pressed =
  Phaser.Input.Keyboard.JustDown(
    this.cursors.up
  ) ||
  Phaser.Input.Keyboard.JustDown(
    this.keys.W
  ) ||
  Phaser.Input.Keyboard.JustDown(
    this.keys.SPACE
  ) ||
  this.mobileActions.jump;

this.mobileActions.jump =
  false;

const released =
  Phaser.Input.Keyboard.JustUp(
    this.cursors.up
  ) ||
  Phaser.Input.Keyboard.JustUp(
    this.keys.W
  ) ||
  Phaser.Input.Keyboard.JustUp(
    this.keys.SPACE
  );

if (pressed) {
  this.jumpBuffer =
    RUNNER_TUNING.jumpBufferMs;
} else {
  this.jumpBuffer =
    Math.max(
      0,
      this.jumpBuffer -
        delta
    );
}

const wallDirection =
  (
    body.blocked.left ||
    body.touching.left
  )
    ? 1
    : (
        body.blocked.right ||
        body.touching.right
      )
      ? -1
      : 0;

const wallRunning =
  this.abilities.has(
    'wallRun'
  ) &&
  wallDirection &&
  !onGround &&
  (
    (
      wallDirection === 1 &&
      left
    ) ||
    (
      wallDirection === -1 &&
      right
    )
  ) &&
  this.useEnergy(
    delta * .018,
    'wallRun'
  );

if (
  wallRunning
) {
  body.setVelocityY(
    Math.min(
      body.velocity.y,
      35
    )
  );
} else if (
  wallDirection &&
  !onGround &&
  body.velocity.y >
    120
) {
  body.setVelocityY(
    120
  );
}

const grabPressed =
  Phaser.Input.Keyboard.JustDown(
    this.keys.SPACE
  ) &&
  this.abilities.has(
    'ledgeGrab'
  ) &&
  wallDirection &&
  !onGround &&
  body.velocity.y >
    0;

if (
  grabPressed &&
  this.useEnergy(
    8,
    'ledgeGrab'
  )
) {
  body.setVelocityY(
    -120
  );

  this.game.events.emit(
    'feedback',
    'ledgeGrab'
  );
}

if (
  this.abilities.has(
    'climb'
  ) &&
  wallDirection &&
  this.keys.W.isDown &&
  !onGround &&
  this.useEnergy(
    delta * .024,
    'climb'
  )
) {
  body.setVelocityY(
    -260
  );
}

const canWallJump =
  this.abilities.has(
    'wallJump'
  ) &&
  wallDirection &&
  !onGround &&
  this.wallJumpCooldown <= 0;

if (
  this.jumpBuffer > 0 &&
  (
    this.coyote > 0 ||
    (
      this.abilities.has(
        'doubleJump'
      ) &&
      this.jumpsUsed < 2
    ) ||
    canWallJump
  )
) {
  if (canWallJump) {
    body.setVelocityX(
      445 *
        wallDirection
    );

    this.wallJumpCooldown =
      160;

    this.wallJumpTimer =
      150;

    this.jumpsUsed = 1;

    const wallX =
      this.player.x -
      wallDirection *
        16;

    this.dust.emitParticleAt(
      wallX,
      this.player.y + 12,
      8
    );

    this.speedLines.emitParticleAt(
      wallX,
      this.player.y,
      4
    );

    // ============================================================
// WALL JUMP · ENERGY RING
// ============================================================

if (!this.motionReduced) {
  const wallJumpRing =
    this.add
      .circle(
        wallX,
        this.player.y,
        7,
        0x8df4ff,
        0.22
      )
      .setDepth(11);

  wallJumpRing.setStrokeStyle(
    1.5,
    0xb9f5ff,
    0.85
  );

  this.tweens.add({
    targets: wallJumpRing,
    scale: 3.2,
    alpha: 0,
    duration: 190,
    ease: 'Quad.out',
    onComplete: () =>
      wallJumpRing.destroy()
  });
}

    const burst =
  this.add
    .circle(
      wallX,
      this.player.y,
      7,
      0x8df4ff,
      .5
    );

burst.setBlendMode(
  Phaser.BlendModes.ADD
);

burst.setDepth(11);

    this.tweens.add({
      targets: burst,
      scale: 2.2,
      alpha: 0,
      duration: 150,
      onComplete: () =>
        burst.destroy()
    });

    this.leaveAfterimage();

    this.playerCue(
      'WALL JUMP'
    );

    this.shake(
      35,
      .001
    );

    this.game.events.emit(
      'feedback',
      'wallJump'
    );
  } else {
    this.jumpsUsed++;

    if (
      this.jumpsUsed ===
      2
    ) {
      this.leaveAfterimage(
        0xffd06e
      );

      this.playerCue(
        'DOUBLE JUMP',
        '#ffd06e'
      );

      // ============================================================
// DOUBLE JUMP · PREMIUM BOOST
// ============================================================

if (
  !this.motionReduced &&
  this.cameras?.main
) {
  this.cameras.main.shake(
    70,
    0.0014
  );

  this.tweens.add({
    targets: this.player,
    scaleX:
      this.playerVisualBaseScaleX *
      1.06,
    scaleY:
      this.playerVisualBaseScaleY *
      0.94,
    duration: 70,
    yoyo: true,
    ease: 'Quad.out'
  });
}
      

  const doubleJumpRing =
    this.add.circle(
      this.player.x,
      this.player.y,
      9,
      0xffd06e,
      0
    );

  doubleJumpRing.setStrokeStyle(
    2,
    0xffd06e,
    0.65
  );

  doubleJumpRing.setDepth(11);

  this.tweens.add({
    targets: doubleJumpRing,
    scale: 2.8,
    alpha: 0,
    duration: 240,
    ease: 'Quad.out',
    onComplete: () =>
      doubleJumpRing.destroy()
  });
}
      
    }

  body.setVelocityY(
    RUNNER_TUNING.jumpVelocity
  );

  if (!this.motionReduced) {
  const jumpBurst =
    this.add.circle(
      this.player.x,
      this.player.y + 27,
      7,
      0x8df4ff,
      0.28
    );

  jumpBurst.setDepth(11);

  this.tweens.add({
    targets: jumpBurst,
    scaleX: 2.8,
    scaleY: 0.55,
    alpha: 0,
    duration: 180,
    ease: 'Quad.out',
    onComplete: () =>
      jumpBurst.destroy()
  });
}

  this.jumps++;

  // ============================================================
// PLAYER · JUMP TAKEOFF ENERGY
// ============================================================

if (
  !this.motionReduced &&
  this.jumps === 1
) {
  const takeoffRing =
    this.add
      .circle(
        this.player.x,
        this.player.y + 27,
        6,
        0x8df4ff,
        0.18
      )
      .setDepth(11);

  takeoffRing.setStrokeStyle(
    1.5,
    0xb9f5ff,
    0.75
  );

  this.tweens.add({
    targets: takeoffRing,
    scale: 2.6,
    alpha: 0,
    duration: 170,
    ease: 'Quad.out',
    onComplete: () =>
      takeoffRing.destroy()
  });
}

  this.coyote = 0;
  this.jumpBuffer = 0;
  this.jumpHeld = true;

  this.dust.emitParticleAt(
    this.player.x,
    this.player.y + 27,
    5
  );

  this.speedLines.emitParticleAt(
    this.player.x,
    this.player.y + 22,
    2
  );

  if (!canWallJump) {
    this.game.events.emit(
      'feedback',
      'jump'
    );
  }
}

const slidePressed =
  this.keys.S.isDown &&
  onGround &&
  Math.abs(
    body.velocity.x
  ) > 120 &&
  this.abilities.has(
    'slide'
  ) &&
  this.slideTimer <= 0;

if (
  slidePressed &&
  this.useEnergy(
    10,
    'slide'
  )
) {
  this.slideTimer =
    360;

  body.setVelocityX(
    Math.sign(
      body.velocity.x
    ) *
    560
  );

  this.player.setScale(
    1.12,
    .82
  );

  const slideBurst =
  this.add
    .circle(
      this.player.x,
      this.player.y + 22,
      10,
      0xffd06e,
      .26
    )
    .setDepth(11);

this.tweens.add({
  targets: slideBurst,
  scale: 3.6,
  alpha: 0,
  duration: 220,
  onComplete: () =>
    slideBurst.destroy()
});

  this.tweens.add({
    targets:
      this.player,
    scaleX: 1,
    scaleY: 1,
    duration: 220
  });

  this.playerCue(
    'SLIDE',
    '#ffd06e'
  );

  this.game.events.emit(
    'feedback',
    'slide'
  );
}

this.slideTimer =
  Math.max(
    0,
    this.slideTimer -
      delta
  );

const dashPressed =
  Phaser.Input.Keyboard.JustDown(
    this.keys.SHIFT
  ) ||
  this.mobileActions.dash;

this.mobileActions.dash =
  false;

const canDash =
  modifier?.id !==
    'noDash' &&
  (
    onGround ||
    (
      this.abilities.has(
        'airDash'
      ) &&
      !this.airDashUsed
    )
  );

if (
  dashPressed &&
  canDash &&
  this.abilities.has(
    'dash'
  ) &&
  this.dashCooldown <=
    0 &&
  this.useEnergy(
    onGround
      ? 8
      : 25,
    onGround
      ? 'dash'
      : 'airDash'
  )
) {
  const direction =
    right
      ? 1
      : left
        ? -1
        : this.player
            .flipX
          ? -1
          : 1;

  const dashSpeed =
    RUNNER_TUNING.dashSpeed *
    (
      upgrades.includes(
        'dashDrive'
      )
        ? 1.08
        : 1
    );

  if (!onGround) {
    this.airDashUsed =
      true;

    body.setVelocityY(
      0
    );

    this.playerCue(
      'AIR DASH'
    );
  }

  const afterimage =
    this.add
      .sprite(
        this.player.x,
        this.player.y,
        this.player.texture.key
      )
      .setFlipX(
        this.player.flipX
      )
      .setTint(
        0x8df4ff
      )
      .setAlpha(.5)
      .setDepth(9);

  body
    .setMaxVelocityX(
      dashSpeed
    )
    .setVelocityX(
      dashSpeed *
        direction
    );

  this.dashCooldown =
    RUNNER_TUNING.dashCooldownMs;

  this.dashTimer =
    RUNNER_TUNING.dashDurationMs;

  // ============================================================
// PLAYER · DASH TILT
// ============================================================

if (
  this.player &&
  !this.motionReduced
) {
  this.player.angle =
    direction > 0
      ? 7
      : -7;
}

  // ============================================================
// DASH · CAMERA IMPACT
// ============================================================

if (
  !this.motionReduced &&
  this.cameras?.main
) {
  this.cameras.main.shake(
    90,
    0.0018
  );
}

  /*
 * DASH ENERGY TRAIL
 */
if (!this.motionReduced) {
  this.leaveAfterimage(
    direction > 0
      ? 0x8df4ff
      : 0xb9f5ff
  );

  const dashTrail =
    this.add
      .circle(
        this.player.x -
          direction * 22,
        this.player.y,
        10,
        0x8df4ff,
        0.24
      )
      .setDepth(9);

  this.tweens.add({
    targets: dashTrail,
    scaleX: 2.8,
    scaleY: 0.7,
    alpha: 0,
    x:
      dashTrail.x -
      direction * 42,
    duration: 180,
    ease: 'Quad.out',
    onComplete: () =>
      dashTrail.destroy()
  });

  const dashCore =
    this.add
      .circle(
        this.player.x,
        this.player.y,
        6,
        0xe8fdff,
        0.7
      )
      .setDepth(12);

  this.tweens.add({
    targets: dashCore,
    scale: 2.4,
    alpha: 0,
    duration: 160,
    ease: 'Quad.out',
    onComplete: () =>
      dashCore.destroy()
  });
}

this.perfectDodgeWindow = 120;
  const dashBurst =
  this.add
    .circle(
      this.player.x,
      this.player.y,
      12,
      0x8df4ff,
      .30
    )
    .setDepth(12);

this.tweens.add({
  targets: dashBurst,
  scale: 4,
  alpha: 0,
  duration: 220,
  onComplete: () =>
    dashBurst.destroy()
});

  this.tweens.add({
    targets:
      afterimage,
    x:
      afterimage.x -
      direction * 30,
    alpha: 0,
    duration: 160,
    onComplete: () =>
      afterimage.destroy()
  });

  this.game.events.emit(
    'feedback',
    'dash'
  );
}

if (
  released &&
  body.velocity.y <
    -180 &&
  this.jumpHeld
) {
  body.setVelocityY(
    body.velocity.y *
      RUNNER_TUNING.jumpCutMultiplier
  );

  this.jumpHeld = false;
}

if (
  body.velocity.y >= 0
) {
  this.jumpHeld = false;
}

if (!onGround) {
  this.fallSpeed =
    Math.max(
      this.fallSpeed,
      body.velocity.y
    );
}

if (
  onGround &&
  !this.wasGrounded &&
  this.fallSpeed > 80
) {
  const hardLanding =
    this.fallSpeed >
    260;

  this.dust.emitParticleAt(
    this.player.x,
    this.player.y + 28,
    hardLanding
      ? 12
      : 4
  );

  this.speedLines.emitParticleAt(
    this.player.x,
    this.player.y + 28,
    hardLanding
      ? 4
      : 1
  );

  if (hardLanding) {
    this.shake(
      70,
      .002
    );

    this.playerCue(
      'HARD LANDING',
      '#ffcf82'
    );
  }

  const landingPulse =
  this.add
    .circle(
      this.player.x,
      this.player.y + 28,
      14,
      0xffcf82,
      .30
    )
    .setDepth(11);

this.tweens.add({
  targets: landingPulse,
  scale: 4,
  alpha: 0,
  duration: 260,
  onComplete: () =>
    landingPulse.destroy()
});

  if (!this.motionReduced) {
    this.tweens.add({
      targets:
        this.player,
      scaleX:
        hardLanding
          ? 1.12
          : 1.04,
      scaleY:
        hardLanding
          ? .82
          : .94,
      yoyo: true,
      duration:
        hardLanding
          ? 110
          : 80
    });
  }

  this.landingTimer =
    110;

  // ============================================================
// PLAYER · LANDING SHOCKWAVE
// ============================================================

if (!this.motionReduced) {
  const landingShock =
    this.add
      .circle(
        this.player.x,
        this.player.y + 28,
        hardLanding ? 9 : 6,
        0x8df4ff,
        0.22
      )
      .setDepth(10);

  landingShock.setStrokeStyle(
    hardLanding ? 2 : 1,
    0xffcf82,
    0.75
  );

  this.tweens.add({
    targets: landingShock,
    scale: hardLanding ? 3.8 : 2.8,
    alpha: 0,
    duration: hardLanding ? 240 : 180,
    ease: 'Quad.out',
    onComplete: () =>
      landingShock.destroy()
  });
}
  
 
}
  this.game.events.emit(
  'feedback',
  hardLanding
    ? 'hard_land'
    : 'land'
);

if (onGround) {
  this.fallSpeed = 0;
}

this.landingTimer =
  Math.max(
    0,
    (
      this.landingTimer ||
      0
    ) -
      delta
  );

if (
  this.dashTimer > 0
) {
  this.player.play(
    'runner-dash',
    true
  );
} else if (
  this.wallJumpTimer > 0
) {
  this.player.play(
    'runner-wall',
    true
  );
} else if (!onGround) {
  this.player.play(
    body.velocity.y < 0
      ? 'runner-jump'
      : 'runner-fall',
    true
  );
  
// ============================================================
// PLAYER · FAST FALL TRAIL
// ============================================================

if (
  body.velocity.y > 420 &&
  !this.motionReduced
) {
  this.fastFallFxTimer -= delta;

  if (this.fastFallFxTimer <= 0) {
    const fallTrail =
      this.add
        .circle(
          this.player.x,
          this.player.y - 24,
          5,
          0x8df4ff,
          0.16
        )
        .setDepth(8);

    this.tweens.add({
      targets: fallTrail,
      y: fallTrail.y + 28,
      scaleY: 2.4,
      scaleX: 0.7,
      alpha: 0,
      duration: 150,
      ease: 'Quad.out',
      onComplete: () =>
        fallTrail.destroy()
    });

    this.fastFallFxTimer = 55;
  }
} else {
  this.fastFallFxTimer = 0;
}

  // ============================================================
// PLAYER · AIRBORNE POSE
// ============================================================

if (
  !this.motionReduced &&
  Math.abs(body.velocity.y) > 100
) {
  const airRatio =
    Phaser.Math.Clamp(
      Math.abs(body.velocity.y) /
        RUNNER_TUNING.maxFallSpeed,
      0,
      1
    );

  const targetAirScaleX =
    this.playerVisualBaseScaleX *
    (1 + airRatio * 0.035);

  const targetAirScaleY =
    this.playerVisualBaseScaleY *
    (1 - airRatio * 0.05);

  this.player.scaleX =
    Phaser.Math.Linear(
      this.player.scaleX,
      targetAirScaleX,
      Math.min(
        1,
        delta * 0.018
      )
    );

  this.player.scaleY =
    Phaser.Math.Linear(
      this.player.scaleY,
      targetAirScaleY,
      Math.min(
        1,
        delta * 0.018
      )
    );
}
  
} else if (
  this.landingTimer > 0
) {
  this.player.play(
    'runner-land',
    true
  );
} else if (
  Math.abs(
    body.velocity.x
  ) > 35
) {
  this.player.play(
    'runner-run',
    true
  );
  // ============================================================
// PLAYER · RUN ANIMATION BOOST
// ============================================================

if (
  !this.motionReduced &&
  Math.abs(body.velocity.x) > 120
) {
  const runPulse =
    Phaser.Math.Clamp(
      Math.abs(body.velocity.x) /
        RUNNER_TUNING.maxRunSpeed,
      0,
      1
    );

  this.player.scaleX =
    Phaser.Math.Linear(
      this.player.scaleX,
      this.playerVisualBaseScaleX *
        (1 + runPulse * 0.025),
      Math.min(
        1,
        delta * 0.02
      )
    );
}
} else {
  this.player.play(
    'runner-idle',
    true
  );
}

  // ============================================================
// PLAYER · SPEED LEAN / AIR TILT
// ============================================================

if (
  this.player?.active &&
  !this.motionReduced
) {
  const vx =
    this.player.body?.velocity?.x || 0;

  const vy =
    this.player.body?.velocity?.y || 0;

  const speedRatio =
    Phaser.Math.Clamp(
      Math.abs(vx) /
        RUNNER_TUNING.maxRunSpeed,
      0,
      1
    );

  const targetAngle =
    Phaser.Math.Clamp(
      vx * 0.018,
      -8,
      8
    );

  const targetScaleX =
    this.playerVisualBaseScaleX *
    (
      1 +
      speedRatio * 0.035
    );

  const targetScaleY =
    this.playerVisualBaseScaleY *
    (
      1 -
      speedRatio * 0.025
    );

  this.player.angle =
    Phaser.Math.Linear(
      this.player.angle,
      targetAngle,
      Math.min(
        1,
        delta * 0.012
      )
    );

  this.player.scaleX =
    Phaser.Math.Linear(
      this.player.scaleX,
      targetScaleX,
      Math.min(
        1,
        delta * 0.018
      )
    );

  this.player.scaleY =
    Phaser.Math.Linear(
      this.player.scaleY,
      targetScaleY,
      Math.min(
        1,
        delta * 0.018
      )
    );

  if (Math.abs(vy) > 80) {
    this.player.angle =
      Phaser.Math.Linear(
        this.player.angle,
        vx * 0.012,
        Math.min(
          1,
          delta * 0.015
        )
      );
  }
}
  
this.dustTimer -=
  delta;

if (
  onGround &&
  Math.abs(
    body.velocity.x
  ) > 100 &&
  this.dustTimer <= 0
) {
  this.dust.emitParticleAt(
    this.player.x,
    this.player.y + 28,
    1
  );

  this.dustTimer = 90;
}

this.speedTimer -=
  delta;

if (
  !this.motionReduced &&
  Math.abs(
    body.velocity.x
  ) > 280 &&
  this.speedTimer <= 0
) {
  this.speedLines.emitParticleAt(
    this.player.x -
      Math.sign(
        body.velocity.x
      ) *
        12,
    this.player.y - 2,
    1
  );
  const runStreak =
  this.add.rectangle(
    this.player.x -
      Math.sign(body.velocity.x) * 22,
    this.player.y - 2,
    22,
    3,
    0x8df4ff,
    0.22
  );

runStreak.setDepth(9);

this.tweens.add({
  targets: runStreak,
  scaleX: 2.4,
  alpha: 0,
  x:
    runStreak.x -
    Math.sign(body.velocity.x) * 26,
  duration: 140,
  ease: 'Quad.out',
  onComplete: () =>
    runStreak.destroy()
});

  this.speedTimer = 45;
}

/* -------------------------------------------------
   DYNAMIC CAMERA FEEL
   ------------------------------------------------- */

const speed =
  Math.abs(
    body.velocity.x
  );

  // ============================================================
// CAMERA · SPEED ZOOM
// ============================================================

if (
  !this.motionReduced &&
  this.cameras?.main
) {
  const speedRatio =
    Phaser.Math.Clamp(
      speed /
        RUNNER_TUNING.maxRunSpeed,
      0,
      1
    );

  const targetZoom =
    1 +
    speedRatio * 0.045;

  this.cameras.main.zoom =
    Phaser.Math.Linear(
      this.cameras.main.zoom,
      targetZoom,
      Math.min(
        1,
        delta * 0.006
      )
    );
}

const parallaxBoost =
  !this.motionReduced
    ? Math.min(
        .09,
        Math.max(
          0,
          speed - 260
        ) / 2200
      )
    : 0;

if (
parallaxBoost !==
this.lastParallaxBoost
) {
this.lastParallaxBoost =
parallaxBoost;

this.parallaxLayers.forEach(
({ layer, base }) => {
layer.setScrollFactor(
base +
parallaxBoost
);
}
);
}

const velocityX =
  body.velocity.x;

const velocityY =
  body.velocity.y;

const dashActive =
  this.dashTimer > 0;

const hardLanding =
  this.landingTimer > 0 &&
  this.fallSpeed > 260;

const wallJumpActive =
  this.wallJumpTimer > 0;

/* Look further into the direction of travel. */
let targetOffsetX = -58;

if (
  velocityX > 70
) {
  targetOffsetX =
    dashActive
      ? -190
      : -155;
} else if (
  velocityX < -70
) {
  targetOffsetX =
    dashActive
      ? 125
      : 95;
}

/* Vertical anticipation. */
let targetOffsetY = 65;

if (
  velocityY < -110
) {
  targetOffsetY = 18;
} else if (
  velocityY > 180
) {
  targetOffsetY = 102;
}

/* Small extra framing during special movement states. */
if (wallJumpActive) {
  targetOffsetX +=
    velocityX > 0
      ? -18
      : 18;

  targetOffsetY = 42;
}

if (dashActive) {
  targetOffsetY =
    velocityY < 0
      ? 32
      : 72;
}

if (hardLanding) {
  targetOffsetY = 112;
}

/* Speed-based cinematic zoom. */
  
let cinematicTargetZoom = 1;
  
if (!this.motionReduced) {
  if (speed > 520) {
    targetZoom = 1.035;
  } else if (
    speed > 420
  ) {
    targetZoom = 1.026;
  } else if (
    speed > 330
  ) {
    targetZoom = 1.014;
  }
}

/* Dash gets the strongest framing push. */
if (
  dashActive &&
  !this.motionReduced
) {
  targetZoom = 1.045;
}

/* Smooth camera motion. */
const cameraLerpX =
  Math.min(
    1,
    delta *
      (
        dashActive
          ? .009
          : .0055
      )
  );

const cameraLerpY =
  Math.min(
    1,
    delta *
      (
        hardLanding
          ? .012
          : .008
      )
  );

  // ============================================================
// CAMERA · SPEED ZOOM TARGET
// ============================================================

const speedZoom =
  !this.motionReduced
    ? Phaser.Math.Clamp(
        speed /
          RUNNER_TUNING.maxRunSpeed,
        0,
        1
      ) * 0.045
    : 0;

const speedZoomTarget =
  1 + speedZoom;

const cameraLerpZoom =
  Math.min(
    1,
    delta *
      (
        dashActive
          ? .009
          : .0045
      )
  );

this.cameraOffsetX =
  Phaser.Math.Linear(
    this.cameraOffsetX,
    targetOffsetX,
    cameraLerpX
  );

this.cameraOffsetY =
  Phaser.Math.Linear(
    this.cameraOffsetY,
    targetOffsetY,
    cameraLerpY
  );

this.cameraZoom =
  Phaser.Math.Linear(
    this.cameraZoom,
    targetZoom,
    cameraLerpZoom
  );

this.cameras.main
  .setFollowOffset(
    this.cameraOffsetX,
    this.cameraOffsetY
  )
  .setZoom(
    this.cameraZoom
  );

this.blaster.setPosition(
  this.player.x +
    (
      this.player.flipX
        ? -22
        : 22
    ),
  this.player.y + 4
).setFlipX(
  this.player.flipX
);

this.updateChaser(
  delta
);

this.wasGrounded =
  onGround;

if (
  this.player.y > 805
) {
  this.fail(
    'The rain swallowed the route below.'
  );
}

const progress =
  Math.min(
    100,
    Math.round(
      this.player.x /
        Math.max(1, this.mission.goal.x) *
        100
    )
  );

if (
  progress !==
  this.lastProgress
) {
  this.lastProgress =
    progress;

  this.game.events.emit(
    'progress',
    progress
  );
}

  }
}
