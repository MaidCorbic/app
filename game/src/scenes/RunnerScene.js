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
    // Phaser's TextureManager survives scene restarts. Avoid rebuilding the
    // same procedural textures every time RunnerScene is recreated.
    const make = (key, width, height, draw) => {
      if (this.textures.exists(key)) return;
      const graphics = this.make.graphics({ add: false });
      draw(graphics);
      graphics.generateTexture(key, width, height);
      graphics.destroy();
    };
    const runner = (key, leftLeg, rightLeg, arm) => make(key, 48, 64, g => {
      g.fillStyle(0xf3eee4).fillCircle(24, 12, 10).fillStyle(0x202a3d).fillRect(14, 21, 20, 5);
      g.fillStyle(0xff756d).fillRoundedRect(14, 23, 20, 24, 5).fillStyle(0xffd06e).fillRect(14, 29, 20, 5);
      g.lineStyle(5, 0xf3eee4).lineBetween(15, 30, 8, arm).lineBetween(33, 30, 40, 42 - arm / 5);
      g.lineStyle(7, 0xaee37f).lineBetween(19, 45, 16, leftLeg).lineBetween(29, 45, 33, rightLeg);
    });
    // Generated textures are isolated here so authored sprite sheets can replace them later.
    runner('runner-idle', 60, 60, 40); runner('runner-run-a', 56, 63, 50); runner('runner-run-b', 63, 56, 27); runner('runner-jump', 54, 54, 30); runner('runner-fall', 62, 62, 58); runner('runner-land', 55, 55, 42); runner('runner-dash', 54, 54, 22); runner('runner-wall', 56, 62, 18); runner('runner-hit', 62, 62, 62); runner('runner-finish', 50, 50, 18);
    make('signal', 56, 56, g => { g.fillStyle(0xffd06e, .08).fillCircle(28, 28, 27).fillStyle(0xffd06e, .2).fillCircle(28, 28, 20); g.lineStyle(2, 0xffe6a6, .85).strokeCircle(28, 28, 15).lineBetween(28, 6, 28, 15).lineBetween(28, 41, 28, 50); g.fillStyle(0xffe7a6).fillCircle(28, 28, 8).fillStyle(0xff826e).fillCircle(28, 28, 3); });
    make('barrier', 48, 64, g => g.fillStyle(0x202b39).fillRect(3, 3, 42, 58).lineStyle(3, 0xff826e).strokeRect(4, 4, 40, 56).lineBetween(7, 8, 41, 56).lineBetween(41, 8, 7, 56));
    make('goal', 56, 68, g => g.lineStyle(4, 0xe5ecf1).lineBetween(10, 66, 10, 4).fillStyle(0xffd06e).fillTriangle(12, 9, 48, 21, 12, 36));
    make('rain', 8, 14, g => g.lineStyle(2, 0xd9e9ff, .45).lineBetween(6, 0, 1, 13));
    make('dust', 10, 10, g => g.fillStyle(0xd6dbe2, .65).fillCircle(5, 5, 4));
    make('speed-line', 32, 3, g => g.fillGradientStyle(0xb9e9ff, 0xb9e9ff, 0xb9e9ff, 0xb9e9ff, 0, .65, .65, 0).fillRect(0, 0, 32, 3));
    make('boost-pad', 58, 18, g => g.fillStyle(0x17263b).fillRoundedRect(0, 2, 58, 14, 4).fillStyle(0x8df4ff).fillTriangle(10, 13, 20, 5, 30, 13).fillTriangle(27, 13, 37, 5, 47, 13));
    make('chaser', 52, 60, g => g.fillStyle(0xff826e, .14).fillCircle(26, 28, 25).fillStyle(0x172238).fillRoundedRect(10, 8, 32, 42, 7).lineStyle(2, 0xff826e).strokeRoundedRect(10, 8, 32, 42, 7).fillStyle(0xff826e).fillRect(16, 20, 20, 5));
    make('checkpoint', 30, 54, g => g.lineStyle(3, 0x8df4ff).lineBetween(6, 52, 6, 4).fillStyle(0x8df4ff, .2).fillTriangle(8, 6, 27, 14, 8, 23).lineStyle(1, 0xdffcff).strokeTriangle(8, 6, 27, 14, 8, 23));
    make('security', 42, 34, g => g.fillStyle(0xff826e, .14).fillCircle(21, 17, 20).fillStyle(0x172238).fillRoundedRect(5, 8, 32, 20, 8).lineStyle(2, 0xff826e).strokeRoundedRect(5, 8, 32, 20, 8).fillStyle(0xff826e).fillCircle(28, 17, 4));
    make('guard', 32, 58, g => g.fillStyle(0x172238).fillRoundedRect(6, 7, 20, 44, 5).lineStyle(2, 0xff826e).strokeRoundedRect(6, 7, 20, 44, 5).fillStyle(0xffd06e).fillRect(10, 16, 12, 4));
    make('enemy-runner', 48, 64, g => { g.fillStyle(0xd5f0ff).fillCircle(24, 12, 10).fillStyle(0x241b35).fillRect(14, 21, 20, 5); g.fillStyle(0x6b3f83).fillRoundedRect(14, 23, 20, 24, 5).fillStyle(0xff826e).fillRect(14, 29, 20, 5); g.lineStyle(5, 0xd5f0ff).lineBetween(15, 30, 8, 42).lineBetween(33, 30, 40, 35); g.lineStyle(7, 0xff826e).lineBetween(19, 45, 16, 60).lineBetween(29, 45, 33, 60); });
    make('invader', 48, 38, g => g.fillStyle(0x5b3d82).fillRoundedRect(4, 9, 40, 23, 10).lineStyle(2, 0xe0a7ff).strokeRoundedRect(4, 9, 40, 23, 10).fillStyle(0xe0a7ff).fillCircle(17, 20, 4).fillCircle(31, 20, 4));
    make('chicken', 42, 38, g => g.fillStyle(0xf4f0e7).fillCircle(20, 22, 15).fillCircle(28, 10, 9).fillStyle(0xffd06e).fillTriangle(35, 11, 43, 15, 35, 19).fillStyle(0xff826e).fillCircle(26, 2, 4));
    make('dino', 68, 48, g => g.fillStyle(0x72a66a).fillRoundedRect(7, 16, 48, 24, 9).fillTriangle(0, 25, 14, 10, 14, 40).fillStyle(0xdff0b0).fillCircle(50, 17, 5).fillStyle(0x172238).fillCircle(51, 16, 2));
    make('dino-boss', 112, 82, g => g.fillStyle(0x4f855f).fillRoundedRect(12, 25, 80, 38, 13).fillTriangle(0, 43, 20, 12, 20, 70).lineStyle(3, 0xdff0b0).strokeRoundedRect(12, 25, 80, 38, 13).fillStyle(0xffd06e).fillCircle(82, 28, 8).fillStyle(0x172238).fillCircle(83, 28, 3));
    make('sentinel-boss', 90, 92, g => g.fillStyle(0x203d5a).fillRoundedRect(18, 18, 54, 62, 12).lineStyle(3, 0x8df4ff).strokeRoundedRect(18, 18, 54, 62, 12).fillStyle(0x8df4ff, .28).fillCircle(45, 42, 23).fillStyle(0xe2fbff).fillCircle(45, 42, 8).fillStyle(0xff826e).fillRect(30, 65, 30, 7));
    make('storm-boss', 104, 86, g => g.fillStyle(0x3f356e).fillTriangle(4, 46, 40, 8, 78, 46).fillTriangle(26, 48, 64, 12, 100, 48).fillStyle(0xb993ff, .32).fillCircle(52, 44, 35).lineStyle(3, 0xe0a7ff).strokeCircle(52, 44, 22).fillStyle(0xffd06e).fillCircle(52, 44, 8));
    make('apex-boss', 108, 96, g => g.fillStyle(0x382844).fillRoundedRect(14, 18, 80, 68, 16).lineStyle(3, 0xffd06e).strokeRoundedRect(14, 18, 80, 68, 16).fillStyle(0xff826e, .22).fillCircle(54, 43, 28).fillStyle(0xffe0a8).fillCircle(54, 43, 9).fillStyle(0x8df4ff).fillRect(30, 69, 48, 7));
    make('alien-ground', 54, 54, g => g.fillStyle(0x402d64).fillRoundedRect(7, 12, 40, 36, 12).lineStyle(2, 0xe0a7ff).strokeRoundedRect(7, 12, 40, 36, 12).fillStyle(0xe0a7ff).fillCircle(19, 26, 5).fillCircle(35, 26, 5).fillStyle(0x8df4ff).fillRect(17, 43, 20, 5));
    make('egg', 18, 24, g => g.fillStyle(0xfff3cf).fillEllipse(9, 12, 14, 21).lineStyle(1, 0xffd06e).strokeEllipse(9, 12, 14, 21));
    make('comet', 32, 32, g => g.fillStyle(0xff826e, .25).fillCircle(16, 16, 15).fillStyle(0xffd06e).fillCircle(16, 16, 8).fillStyle(0xfff3cf).fillCircle(13, 13, 3));
    make('kinetic-ball', 26, 26, g => g.fillStyle(0x8df4ff, .25).fillCircle(13, 13, 13).lineStyle(2, 0xdffcff).strokeCircle(13, 13, 10).fillStyle(0x8df4ff).fillCircle(13, 13, 5));
    make('shield', 46, 64, g => g.fillStyle(0x8df4ff, .18).fillRoundedRect(4, 2, 38, 60, 9).lineStyle(2, 0xb9f5ff).strokeRoundedRect(4, 2, 38, 60, 9));
    make('blaster', 34, 14, g => g.fillStyle(0x263853).fillRoundedRect(1, 3, 28, 8, 3).fillStyle(0x8df4ff).fillRect(21, 5, 12, 4).fillStyle(0xffd06e).fillRect(7, 11, 7, 3));
    make('sword', 52, 12, g => g.fillStyle(0xdffcff).fillTriangle(10, 6, 48, 1, 48, 11).fillStyle(0xffd06e).fillRect(3, 2, 10, 8));
    make('plasma', 18, 10, g => g.fillStyle(0x8df4ff, .25).fillEllipse(9, 5, 18, 10).fillStyle(0xe2fbff).fillEllipse(9, 5, 10, 5));
    make('turret', 42, 42, g => g.fillStyle(0x202d48).fillRoundedRect(5, 20, 32, 17, 5).fillStyle(0x8df4ff).fillRect(17, 5, 8, 20).fillStyle(0xdffcff).fillCircle(21, 13, 5));
    make('spring-pad', 56, 18, g => g.fillStyle(0x263853).fillRoundedRect(1, 3, 54, 14, 4).lineStyle(2, 0xaee37f).strokeRoundedRect(1, 3, 54, 14, 4));
  }

  // The rest of RunnerScene is intentionally unchanged; texture generation is
  // now idempotent while Phaser's TextureManager owns the cached assets.
