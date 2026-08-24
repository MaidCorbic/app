import { RunnerScene } from './src/scenes/RunnerScene.js';

/* CHARACTER MOTION V3 — tactical silhouette + motion FX.
   Presentation-only: the existing player sprite, physics and input remain intact. */
const FX = Symbol('relayCharacterMotionV3');

function addMotionRig(scene) {
  const player = scene?.player;
  if (!player || player[FX]) return;

  const rig = {
    armor: scene.add.graphics().setDepth(Math.max(0, (player.depth || 100) + 1)),
    glow: scene.add.graphics().setDepth(Math.max(0, (player.depth || 100) - 2)),
    trail: scene.add.graphics().setDepth(Math.max(0, (player.depth || 100) - 1)),
    pulse: 0,
    lastGround: !!player.body?.blocked?.down,
    dashUntil: 0,
  };
  player[FX] = rig;

  const draw = () => {
    if (!player.active || !player.visible) {
      rig.armor.setVisible(false); rig.glow.setVisible(false); rig.trail.setVisible(false); return;
    }
    rig.armor.setVisible(true); rig.glow.setVisible(true); rig.trail.setVisible(true);

    const vx = Number(player.body?.velocity?.x) || 0;
    const vy = Number(player.body?.velocity?.y) || 0;
    const speed = Math.abs(vx);
    const now = scene.time.now;
    const airborne = Math.abs(vy) > 80;
    const dashing = player.texture?.key === 'runner-dash' || Math.abs(vx) > 560;
    if (dashing) rig.dashUntil = now + 130;
    const hot = now < rig.dashUntil;
    const pulse = .5 + .5 * Math.sin(now * .012);
    const dir = vx >= 0 ? 1 : -1;

    /* HERO SILHOUETTE — compact exosuit/visor drawn over the simple base sprite. */
    rig.armor.clear();
    rig.armor.fillStyle(0x07111f, .78);
    rig.armor.fillRoundedRect(player.x - 14, player.y - 13, 28, 28, 6);
    rig.armor.lineStyle(hot ? 2.4 : 1.5, 0x8df4ff, hot ? .9 : .55);
    rig.armor.strokeRoundedRect(player.x - 14, player.y - 13, 28, 28, 6);
    rig.armor.fillStyle(0x19c8f5, hot ? .55 : .28);
    rig.armor.fillTriangle(player.x - 8, player.y - 2, player.x, player.y - 8, player.x + 8, player.y - 2);
    rig.armor.fillStyle(0x02060d, .9);
    rig.armor.fillRoundedRect(player.x - 9, player.y - 22, 18, 10, 4);
    rig.armor.lineStyle(1.5, 0xe2fbff, .8);
    rig.armor.strokeRoundedRect(player.x - 9, player.y - 22, 18, 10, 4);
    rig.armor.fillStyle(0x8df4ff, .85);
    rig.armor.fillRect(player.x - 5, player.y - 18, 10, 2);
    rig.armor.lineStyle(2, 0xff826e, hot ? .8 : .34);
    rig.armor.lineBetween(player.x - 14, player.y - 5, player.x - 20, player.y + 4);
    rig.armor.lineBetween(player.x + 14, player.y - 5, player.x + 20, player.y + 4);
    rig.armor.lineStyle(2, 0xb993ff, .45 + pulse * .2);
    rig.armor.lineBetween(player.x - 10, player.y + 14, player.x - 14 - (hot ? 4 : 0), player.y + 23);
    rig.armor.lineBetween(player.x + 10, player.y + 14, player.x + 14 + (hot ? 4 : 0), player.y + 23);
    if (hot) {
      rig.armor.lineStyle(2, 0x8df4ff, .75);
      rig.armor.lineBetween(player.x + dir * 14, player.y - 2, player.x + dir * 26, player.y - 8);
    }

    const glowAlpha = hot ? .28 + pulse * .12 : .08 + Math.min(speed / 460, 1) * .08;
    rig.glow.clear();
    rig.glow.fillStyle(0x19c8f5, glowAlpha);
    rig.glow.fillCircle(player.x, player.y + 3, hot ? 30 : 22);
    rig.glow.lineStyle(hot ? 3 : 1.5, 0x8df4ff, hot ? .65 : .24);
    rig.glow.strokeCircle(player.x, player.y + 3, hot ? 23 + pulse * 2 : 19);
    if (airborne) { rig.glow.lineStyle(2, 0xb993ff, .24); rig.glow.strokeEllipse(player.x, player.y + 4, 32, 48); }

    rig.trail.clear();
    if (speed > 120 || hot) {
      const count = hot ? 8 : 4;
      for (let i = 1; i <= count; i += 1) {
        const y = player.y - 22 + i * 8 + Math.sin(now * .01 + i) * 2;
        const len = (hot ? 40 : 20) * (1 - i / (count + 2)) + speed * .045;
        rig.trail.lineStyle(hot ? 2 : 1, 0x8df4ff, (hot ? .4 : .16) * (1 - i / (count + 2)));
        rig.trail.lineBetween(player.x - dir * 7, y, player.x - dir * (7 + len), y);
      }
    }

    if (rig.lastGround && !player.body?.blocked?.down && Math.abs(vy) < 160) rig.pulse = now + 170;
    if (rig.pulse > now) {
      const p = 1 - (rig.pulse - now) / 170;
      rig.glow.lineStyle(2, 0x8df4ff, .55 * (1 - p));
      rig.glow.strokeEllipse(player.x, player.y + 30, 34 + p * 52, 10 + p * 8);
    }
    rig.lastGround = !!player.body?.blocked?.down;
  };

  rig.update = draw;
  draw();
}

if (!RunnerScene.prototype.__characterMotionV3) {
  const create = RunnerScene.prototype.create;
  const update = RunnerScene.prototype.update;
  const shutdown = RunnerScene.prototype.shutdown;

  RunnerScene.prototype.create = function (...args) {
    const result = create.apply(this, args);
    try { addMotionRig(this); } catch (error) { console.warn('[CharacterMotionV3] create', error); }
    return result;
  };
  RunnerScene.prototype.update = function (...args) {
    const result = update.apply(this, args);
    try { addMotionRig(this); this.player?.[FX]?.update?.(); } catch (error) { /* visual layer only */ }
    return result;
  };
  RunnerScene.prototype.shutdown = function (...args) {
    try { const rig = this.player?.[FX]; rig?.armor?.destroy?.(); rig?.glow?.destroy?.(); rig?.trail?.destroy?.(); if (this.player) delete this.player[FX]; } catch (error) { /* no-op */ }
    return typeof shutdown === 'function' ? shutdown.apply(this, args) : undefined;
  };
  RunnerScene.prototype.__characterMotionV3 = true;
}
