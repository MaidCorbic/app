import { RunnerScene } from './src/scenes/RunnerScene.js';

// Combat V1 is deliberately an additive patch over the existing RunnerScene.
// It keeps the existing movement, mission, save, settings and mobile-input systems authoritative.
(() => {
  if (window.__relayCombatSystemV1) return;
  window.__relayCombatSystemV1 = true;

  const NORMAL_HP = {
    'enemy-runner': 2,
    chicken: 1,
    dino: 3,
    'alien-ground': 3,
    invader: 3,
    security: 2,
    guard: 2,
  };

  const getType = enemy => enemy?.getData('route')?.type || 'hostile';
  const getMaxHealth = enemy => {
    const configured = Number(enemy?.getData('health'));
    if (Number.isFinite(configured) && configured > 0) return configured;
    return NORMAL_HP[getType(enemy)] || 2;
  };

  const originalDefeatEnemy = RunnerScene.prototype.defeatEnemy;
  const originalUseSword = RunnerScene.prototype.useSword;

  RunnerScene.prototype.defeatEnemy = function combatV1DefeatEnemy(enemy, method, power = 1) {
    if (!enemy?.active) return;

    const maxHealth = Number(enemy.getData('maxHealth')) || getMaxHealth(enemy);
    let health = Number(enemy.getData('health'));
    if (!Number.isFinite(health) || health <= 0) health = maxHealth;
    enemy.setData('maxHealth', maxHealth);

    const damage = Math.max(1, Number(power) || 1);
    const remaining = Math.max(0, health - damage);
    enemy.setData('health', remaining);

    enemy.setTint(0xff826e);
    this.time.delayedCall(90, () => {
      if (!enemy?.active) return;
      enemy.setTint(enemy.getData('bossColor') || 0xffffff);
    });

    const damageLabel = this.add.text(enemy.x, enemy.y - 38, `-${damage}`, {
      fontFamily: 'DM Mono',
      fontSize: '11px',
      color: '#ffcf82',
      stroke: '#08101c',
      strokeThickness: 4,
    }).setOrigin(.5).setDepth(14);
    this.tweens.add({
      targets: damageLabel,
      y: damageLabel.y - 18,
      alpha: 0,
      duration: 420,
      onComplete: () => damageLabel.destroy(),
    });

    if (remaining > 0) {
      const type = getType(enemy).toUpperCase();
      const label = enemy.getData('label');
      if (label) label.setText(`${enemy.getData('bossName') || type} · ${remaining}/${maxHealth} HP`);
      this.playerCue(`${method} · ${remaining}/${maxHealth} HP`, '#ffcf82');
      this.game.events.emit('combat-hit', { type, method, damage, remaining, maxHealth });
      this.shake(55, .0035);
      return;
    }

    enemy.getData('label')?.destroy();
    enemy.getData('indicator')?.destroy();
    enemy.getData('tutorialLabel')?.destroy();

    const burst = this.add.circle(enemy.x, enemy.y, 12, 0x8df4ff, .65).setDepth(13);
    this.tweens.add({ targets: burst, scale: 3, alpha: 0, duration: 220, onComplete: () => burst.destroy() });

    enemy.disableBody(true, true);
    this.enemyDefeats = (this.enemyDefeats || 0) + 1;
    this.combatCombo = this.comboTimer > 0 ? this.combatCombo + 1 : 1;
    this.comboTimer = 3000;
    if (this.combatCombo >= 3) this.energy = Math.min(this.energyMax, this.energy + 4);
    this.ammo = Math.min(this.ammoMax, this.ammo + 1);
    this.game.events.emit('ammo', this.ammo / this.ammoMax * 100);
    this.game.events.emit('combo', this.combatCombo, this.comboTimer);
    this.game.events.emit('combat-defeat', { type: getType(enemy), method, combo: this.combatCombo });
    this.player.body.setVelocityY(method === 'STOMP' ? -360 : this.player.body.velocity.y);
    this.playerCue(`${method} · ${this.combatCombo > 1 ? `COMBO x${this.combatCombo}${this.combatCombo >= 3 ? ' · +4 ENERGY' : ''}` : 'THREAT CLEARED'}`, '#8df4ff');
    this.shake(75, .0045);
  };

  RunnerScene.prototype.useSword = function combatV1Sword() {
    if (this.swordCooldown > 0 || this.cinematicActive) return;

    const direction = this.player.flipX ? -1 : 1;
    const blade = this.add.sprite(this.player.x + direction * 38, this.player.y - 4, 'sword')
      .setDepth(13)
      .setFlipX(direction < 0)
      .setAngle(direction * -18);

    this.tweens.add({
      targets: blade,
      angle: direction * 48,
      alpha: 0,
      duration: 170,
      onComplete: () => blade.destroy(),
    });

    this.enemies.getChildren()
      .filter(enemy => {
        if (!enemy.active) return false;
        const relativeX = (enemy.x - this.player.x) * direction;
        return relativeX > -18 && relativeX < 105 && Math.abs(enemy.y - this.player.y) < 78;
      })
      .forEach(enemy => this.defeatEnemy(enemy, 'SWORD', 2));

    this.swordCooldown = 450;
    this.playerCue('SWORD ARC', '#ffd06e');
  };

  // Keep a reference to the original methods so future scene refactors can detect this patch.
  RunnerScene.prototype.__combatSystemV1Originals = { defeatEnemy: originalDefeatEnemy, useSword: originalUseSword };
})();
