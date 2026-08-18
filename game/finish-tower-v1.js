/* UPDATE 11.5 — Finish Relay Tower single completion path */
import Phaser from 'phaser';
import { RunnerScene } from './src/scenes/RunnerScene.js';

const TOWER = { height: 250, baseHeight: 28, ladderWidth: 58, climbSpeed: 170, engageRadius: 72 };

if (!window.__relayFinishTowerV11) {
  window.__relayFinishTowerV11 = true;
  const originalUpdate = RunnerScene.prototype.update;

  RunnerScene.prototype.createGoal = function createFinishRelayTower() {
    const x = this.mission.goal.x;
    const topY = this.mission.goal.y;
    const baseY = Math.min(620, topY + TOWER.height);
    this.finishTower = { x, topY, baseY, climbing: false, completed: false, request: false };

    this.goal = this.physics.add.staticImage(x, topY, 'goal').setVisible(false);
    this.goal.body.enable = false;

    const g = this.add.graphics().setDepth(5);
    g.fillStyle(0x111d2d, .98).fillRoundedRect(x - 58, baseY - 4, 116, TOWER.baseHeight, 7);
    g.lineStyle(2, 0x667f98, .75).strokeRoundedRect(x - 58, baseY - 4, 116, TOWER.baseHeight, 7);
    g.fillStyle(0xffd06e, .14).fillRect(x - 58, baseY - 4, 116, 4);
    g.lineStyle(5, 0x41566f, .95).lineBetween(x - 52, baseY, x - 28, topY + 22).lineBetween(x + 52, baseY, x + 28, topY + 22);
    g.lineStyle(2, 0x8ba2b7, .65);
    for (let y = baseY - 34; y > topY + 35; y -= 44) {
      const t = (baseY - y) / TOWER.height;
      const half = Phaser.Math.Linear(49, 27, t);
      g.lineBetween(x - half, y, x + half, y);
    }
    g.lineStyle(4, 0xb8c7d5, .9).lineBetween(x - 22, baseY - 5, x - 22, topY + 28).lineBetween(x + 22, baseY - 5, x + 22, topY + 28);
    g.lineStyle(2, 0xffd06e, .75);
    for (let y = baseY - 14; y > topY + 30; y -= 22) g.lineBetween(x - 21, y, x + 21, y);
    g.fillStyle(0x17263a, .98).fillRoundedRect(x - 34, topY - 5, 68, 30, 7);
    g.lineStyle(2, 0xffd06e, .95).strokeRoundedRect(x - 34, topY - 5, 68, 30, 7);
    g.lineStyle(3, 0xffe0a8, .95).lineBetween(x, topY - 5, x, topY - 38);
    g.lineStyle(2, 0xffd06e, .8).lineBetween(x, topY - 34, x + 35, topY - 22);
    g.fillStyle(0xffd06e, .14).fillCircle(x, topY + 10, 31);

    const core = this.add.circle(x, topY + 10, 8, 0xffe0a8).setDepth(7);
    const ring = this.add.circle(x, topY + 10, 23, 0).setStrokeStyle(2, 0xffd06e, .72).setDepth(7);
    const beacon = this.add.circle(x, topY - 36, 5, 0xffd06e).setDepth(7);
    if (!this.motionReduced) {
      this.tweens.add({ targets: core, scale: 1.35, alpha: .55, duration: 650, yoyo: true, repeat: -1 });
      this.tweens.add({ targets: ring, scale: 1.35, alpha: .05, duration: 900, repeat: -1 });
      this.tweens.add({ targets: beacon, alpha: .3, duration: 520, yoyo: true, repeat: -1 });
    }
    this.add.text(x, topY - 68, 'RELAY TOWER', { fontFamily: 'DM Mono', fontSize: '11px', color: '#ffe0a8', stroke: '#08101c', strokeThickness: 4 }).setOrigin(.5).setDepth(8);
    this.add.text(x, baseY + 34, 'CLIMB TO SECURE RELAY', { fontFamily: 'DM Mono', fontSize: '9px', color: '#9bb0c2', stroke: '#08101c', strokeThickness: 3 }).setOrigin(.5).setDepth(8).setAlpha(.8);
    this.add.text(x, baseY - 52, '↑ / JUMP', { fontFamily: 'DM Mono', fontSize: '8px', color: '#ffd06e', stroke: '#08101c', strokeThickness: 3 }).setOrigin(.5).setDepth(8).setAlpha(.72);

    const base = this.add.rectangle(x, baseY + 10, 116, TOWER.baseHeight, 0x000000, 0).setVisible(false);
    this.physics.add.existing(base, true);
    this.finishTowerBase = base;
    this.physics.add.collider(this.player, base);

    this.finishTowerZone = this.add.zone(x, (topY + baseY) / 2, TOWER.ladderWidth, baseY - topY);
    this.physics.add.existing(this.finishTowerZone);
    this.finishTowerZone.body.setAllowGravity(false).setImmovable(true);
    this.physics.add.overlap(this.player, this.finishTowerZone, () => {
      if (!this.finishTower.completed && !this.cinematicActive) this.finishTower.request = true;
    });

    this.finishTowerTopZone = this.add.zone(x, topY + 8, 72, 42);
    this.physics.add.existing(this.finishTowerTopZone);
    this.finishTowerTopZone.body.setAllowGravity(false).setImmovable(true);
    this.physics.add.overlap(this.player, this.finishTowerTopZone, () => {
      if (this.finishTower.completed || !this.finishTower.climbing) return;
      if (this.boss?.active) {
        this.complete();
        return;
      }

      this.finishTower.completed = true;
      this.finishTower.climbing = false;
      this.player.body.setAllowGravity(true);
      this.dismissIntelCard?.();
      this.briefingProtected = false;
      this.cinematicActive = false;

      // RunnerScene.complete() is the single authoritative finish path.
      // It sets the finish state, pauses gameplay, then emits `complete` with this.runId
      // after the finish animation delay. main.js owns scoring, persistence and Results.
      this.game.events.emit('finish-tower', { missionId: this.mission.id });
      this.complete();
    });

    this.finishTowerKeys = this.keys;
  };

  RunnerScene.prototype.update = function finishTowerUpdate(time, delta) {
    const mobileJumpBeforeUpdate = Boolean(this.mobileActions?.jump);
    const jumpBeforeUpdate = Boolean(this.keys?.W?.isDown || this.keys?.SPACE?.isDown || this.cursors?.up?.isDown);
    const result = originalUpdate.apply(this, arguments);
    const tower = this.finishTower;
    if (!tower || tower.completed || !this.player?.body) return result;

    if (this.cinematicActive) {
      if (mobileJumpBeforeUpdate) {
        this.mobileActions.jump = false;
        this.cinematicSkipHandler?.();
      }
      return result;
    }

    const keys = this.finishTowerKeys || {};
    const down = keys.S?.isDown || this.cursors?.down?.isDown;
    const near = Math.abs(this.player.x - tower.x) <= TOWER.engageRadius && this.player.y >= tower.topY - 35 && this.player.y <= tower.baseY + 30;

    if (!tower.climbing && near && (tower.request || mobileJumpBeforeUpdate || jumpBeforeUpdate || this.player.body.velocity.y < -120)) {
      tower.climbing = true;
      tower.request = false;
      this.player.body.setAllowGravity(false).setVelocity(0, 0);
      this.player.setTexture('runner-wall');
      this.game.events.emit('finish-tower-climb', { active: true });
    }
    if (!tower.climbing) return result;

    this.player.body.setAllowGravity(false).setVelocity(0, 0);
    this.player.x = Phaser.Math.Linear(this.player.x, tower.x, .28);
    const direction = down ? -1 : 1;
    this.player.y -= TOWER.climbSpeed * direction * delta / 1000;
    this.player.y = Phaser.Math.Clamp(this.player.y, tower.topY + 12, tower.baseY - 28);

    if (this.player.y <= tower.topY + 18) this.player.y = tower.topY + 16;
    if (this.player.y >= tower.baseY - 28 && down) {
      tower.climbing = false;
      this.player.body.setAllowGravity(true);
      this.player.setTexture('runner-idle');
      this.game.events.emit('finish-tower-climb', { active: false });
    }
    return result;
  };
}
