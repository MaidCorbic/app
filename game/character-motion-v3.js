import { RunnerScene } from './src/scenes/RunnerScene.js';

/* CHARACTER V4 — full visual replacement.
   The gameplay body remains the original Phaser physics object, but its plain
   texture is hidden and a procedural cyber-courier is rendered in its place.
   No gameplay/input/state logic is changed. */

const FX = Symbol('relayCharacterMotionV4');

function addCharacter(scene) {
  const player = scene?.player;
  if (!player || player[FX]) return;

  const body = scene.add.graphics().setDepth((player.depth || 100) + 1);
  const fx = scene.add.graphics().setDepth((player.depth || 100) + 2);
  const particles = scene.add.graphics().setDepth((player.depth || 100) + 3);

  const rig = {
    body, fx, particles,
    lastGround: !!player.body?.blocked?.down,
    landAt: 0,
    dashAt: 0,
    phase: Math.random() * Math.PI * 2,
  };
  player[FX] = rig;

  // Keep the original physics body and texture state for gameplay systems,
  // but replace only its visual representation.
  player.setVisible(false);

  const draw = () => {
    if (!player.active) {
      body.setVisible(false); fx.setVisible(false); particles.setVisible(false);
      return;
    }

    body.setVisible(true); fx.setVisible(true); particles.setVisible(true);

    const now = scene.time.now;
    const vx = Number(player.body?.velocity?.x) || 0;
    const vy = Number(player.body?.velocity?.y) || 0;
    const speed = Math.abs(vx);
    const grounded = !!player.body?.blocked?.down;
    const airborne = !grounded && Math.abs(vy) > 70;
    const dashing = Math.abs(vx) > 560 || player.texture?.key === 'runner-dash';
    const facing = vx < -15 ? -1 : vx > 15 ? 1 : (rig.facing || 1);
    rig.facing = facing;
    if (dashing) rig.dashAt = now + 180;
    if (rig.lastGround && !grounded) rig.landAt = now + 140;
    const dash = now < rig.dashAt;
    const landing = now < rig.landAt;
    const pulse = .5 + .5 * Math.sin(now * .012 + rig.phase);
    const run = Math.min(speed / 460, 1);
    const bob = grounded ? Math.sin(now * (.012 + run * .018) + rig.phase) * (1.2 + run * 2.4) : 0;
    const lean = dash ? .28 : Math.max(-.16, Math.min(.16, vx / 1800));

    const x = player.x;
    const y = player.y + bob;
    const s = 1.0;
    const sx = facing;

    body.clear();
    fx.clear();
    particles.clear();

    // Deep aura / silhouette.
    fx.fillStyle(0x19c8f5, dash ? .16 : .075);
    fx.fillCircle(x, y - 3, dash ? 31 : 24 + run * 4);
    fx.lineStyle(dash ? 3 : 1.5, 0x8df4ff, dash ? .82 : .28 + run * .22);
    fx.strokeCircle(x, y - 3, dash ? 25 + pulse * 3 : 19 + pulse * 2);
    if (airborne) {
      fx.lineStyle(2, 0xb993ff, .32);
      fx.strokeEllipse(x, y + 3, 32, 50);
    }

    // Landing shockwave.
    if (landing) {
      const p = 1 - (rig.landAt - now) / 140;
      fx.lineStyle(2.5, 0x8df4ff, .72 * (1 - p));
      fx.strokeEllipse(x, y + 30, 28 + p * 62, 8 + p * 10);
      fx.fillStyle(0x8df4ff, .12 * (1 - p));
      fx.fillCircle(x, y + 29, 18 + p * 28);
    }

    // Energy blade trails behind the runner.
    if (speed > 120 || dash) {
      const count = dash ? 9 : 5;
      for (let i = 1; i <= count; i += 1) {
        const alpha = (dash ? .30 : .13) * (1 - i / (count + 2));
        const len = (dash ? 46 : 23) * (1 - i / (count + 3)) + speed * .055;
        const yy = y - 20 + i * 7 + Math.sin(now * .014 + i) * 1.5;
        fx.lineStyle(dash ? 2.2 : 1.2, i % 2 ? 0x8df4ff : 0xb993ff, alpha);
        fx.lineBetween(x - sx * 7, yy, x - sx * (7 + len), yy);
      }
    }

    // Legs — armored sprint stance.
    const stride = grounded ? Math.sin(now * (.014 + run * .024) + rig.phase) : 0;
    const leftLeg = stride * 8;
    const rightLeg = -stride * 8;
    body.lineStyle(7, 0x111b2c, 1);
    body.lineBetween(x - 5 + leftLeg, y + 13, x - 10 + leftLeg, y + 27);
    body.lineBetween(x + 5 + rightLeg, y + 13, x + 10 + rightLeg, y + 27);
    body.lineStyle(3, 0x8df4ff, .72);
    body.lineBetween(x - 5 + leftLeg, y + 14, x - 10 + leftLeg, y + 27);
    body.lineBetween(x + 5 + rightLeg, y + 14, x + 10 + rightLeg, y + 27);
    body.fillStyle(0x050b16, 1).fillRoundedRect(x - 14 + leftLeg, y + 25, 10, 4, 2).fillRoundedRect(x + 4 + rightLeg, y + 25, 10, 4, 2);

    // Long asymmetric tech-coat / torso.
    body.fillStyle(0x0a1322, 1).fillRoundedRect(x - 13, y - 7, 26, 25, 7);
    body.fillStyle(0x172a42, 1).fillRoundedRect(x - 10, y - 5, 20, 21, 5);
    body.lineStyle(1.5, 0x8df4ff, .8).strokeRoundedRect(x - 13, y - 7, 26, 25, 7);
    body.fillStyle(0x19c8f5, .8).fillRect(x - 3, y - 2, 6, 15);
    body.fillStyle(0x030914, .9).fillRect(x - 1, y - 1, 2, 13);

    // Coat tails give the character a readable silhouette at phone scale.
    const tail = 14 + run * 5 + (dash ? 7 : 0);
    body.fillStyle(0x0a1424, .96);
    body.fillTriangle(x - 8, y + 9, x - 20 - tail * .35, y + 24, x - 5, y + 18);
    body.fillTriangle(x + 8, y + 9, x + 18 + tail * .22, y + 21, x + 5, y + 18);
    body.lineStyle(1, 0xb993ff, .65).lineBetween(x - 10, y + 11, x - 18 - tail * .3, y + 22);

    // Arms with energy bracers.
    const armSwing = grounded ? stride * 7 : -4;
    body.lineStyle(6, 0x101b2d, 1);
    body.lineBetween(x - 11, y - 1, x - 20 - armSwing, y + 10);
    body.lineBetween(x + 11, y - 1, x + 20 + armSwing, y + 7);
    body.lineStyle(2, 0x8df4ff, .7);
    body.lineBetween(x - 20 - armSwing, y + 8, x - 22 - armSwing, y + 11);
    body.lineBetween(x + 20 + armSwing, y + 5, x + 22 + armSwing, y + 8);

    // Helmet, visor and animated eye-line.
    body.fillStyle(0x050b15, 1).fillCircle(x, y - 18, 11);
    body.fillStyle(0x16283f, 1).fillCircle(x, y - 18, 9);
    body.lineStyle(1.5, 0x8df4ff, .85).strokeCircle(x, y - 18, 10);
    body.fillStyle(0x8df4ff, .22 + pulse * .18).fillRoundedRect(x - 7, y - 20, 14, 4, 2);
    body.fillStyle(0xe9fdff, .85).fillRect(x + sx * 1 - 4, y - 19, 5, 1.2);
    body.fillStyle(0x19c8f5, .45 + pulse * .3).fillCircle(x + sx * 6, y - 18, 1.6);

    // Shoulder reactor and micro lights.
    body.fillStyle(0x8df4ff, .8).fillCircle(x - 11, y - 3, 2);
    body.fillStyle(0xb993ff, .8).fillCircle(x + 11, y - 3, 2);
    body.fillStyle(0xffd06e, .9).fillCircle(x, y + 8, 1.5);

    // Forward energy blade / baton.
    const bladeX = x + sx * 25;
    const bladeY = y + 5;
    body.lineStyle(3, 0x8df4ff, .88).lineBetween(x + sx * 17, y + 7, bladeX, bladeY - 8);
    body.lineStyle(1, 0xffffff, .95).lineBetween(x + sx * 18, y + 7, bladeX, bladeY - 8);
    body.fillStyle(0x8df4ff, .22 + pulse * .16).fillCircle(bladeX, bladeY - 8, 6);

    // Floating sparks: cheap, deterministic and capped for mobile performance.
    for (let i = 0; i < (dash ? 8 : 4); i += 1) {
      const t = now * .0012 + i * 1.7 + rig.phase;
      const px = x - sx * (12 + ((i * 17) % 28)) + Math.cos(t * 1.7) * 7;
      const py = y + 18 + Math.sin(t * 2.2) * 16;
      particles.fillStyle(i % 2 ? 0x8df4ff : 0xb993ff, (dash ? .6 : .3) * (1 - (i % 4) * .15));
      particles.fillCircle(px, py, dash ? 1.5 : 1);
    }

    rig.lastGround = grounded;
  };

  rig.update = draw;
  draw();
}

if (!RunnerScene.prototype.__characterMotionV4) {
  const create = RunnerScene.prototype.create;
  const update = RunnerScene.prototype.update;
  const shutdown = RunnerScene.prototype.shutdown;

  RunnerScene.prototype.create = function (...args) {
    const result = create.apply(this, args);
    try { addCharacter(this); } catch (error) { console.warn('[CharacterV4] create', error); }
    return result;
  };

  RunnerScene.prototype.update = function (...args) {
    const result = update.apply(this, args);
    try { addCharacter(this); this.player?.[FX]?.update?.(); } catch (error) { /* visual-only */ }
    return result;
  };

  RunnerScene.prototype.shutdown = function (...args) {
    try {
      const rig = this.player?.[FX];
      rig?.body?.destroy?.(); rig?.fx?.destroy?.(); rig?.particles?.destroy?.();
      if (this.player) {
        this.player.setVisible(true);
        delete this.player[FX];
      }
    } catch (error) { /* no-op */ }
    return typeof shutdown === 'function' ? shutdown.apply(this, args) : undefined;
  };

  RunnerScene.prototype.__characterMotionV4 = true;
}
