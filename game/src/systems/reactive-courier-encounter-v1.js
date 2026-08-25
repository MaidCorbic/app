import Phaser from 'phaser';

const INTERACTION_RANGE = 110;
const COOLDOWN_MS = 9000;

function makeCourier(scene) {
  if (!scene?.add) return null;
  const g = scene.add.graphics();
  g.fillStyle(0x18253a, 1).fillRoundedRect(-15, -27, 30, 48, 7);
  g.fillStyle(0xd8f0ff, 1).fillCircle(0, -34, 8);
  g.fillStyle(0xffd06e, 1).fillRect(-9, -14, 18, 5);
  g.lineStyle(2, 0x8df4ff, .9).strokeRoundedRect(-15, -27, 30, 48, 7);
  g.setDepth(8);
  g.setData('relayCourier', true);
  return g;
}

function pulse(scene, x, y) {
  if (!scene?.tweens) return;
  const ring = scene.add.circle(x, y, 8, 0x8df4ff, .08).setStrokeStyle(2, 0x8df4ff, .8).setDepth(9);
  scene.tweens.add({ targets: ring, radius: 34, alpha: 0, duration: 420, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
}

export function installReactiveCourierEncounter(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__reactiveCourierInstalled) return;
  RunnerScene.prototype.__reactiveCourierInstalled = true;

  const originalCreate = RunnerScene.prototype.create;
  RunnerScene.prototype.create = function (...args) {
    const result = originalCreate.apply(this, args);
    const player = this.player;
    if (!player) return result;

    const courier = makeCourier(this);
    if (!courier) return result;

    const state = this.__reactiveCourier = {
      courier,
      active: true,
      used: false,
      cooldownUntil: 0,
      baseX: player.x + 210,
      baseY: player.y - 10,
      offset: 210,
    };
    courier.setPosition(state.baseX, state.baseY);

    const interact = () => {
      if (!state.active || state.used || performance.now() < state.cooldownUntil) return;
      const d = Phaser.Math.Distance.Between(player.x, player.y, courier.x, courier.y);
      if (d > INTERACTION_RANGE) return;
      state.used = true;
      state.cooldownUntil = performance.now() + COOLDOWN_MS;
      pulse(this, courier.x, courier.y);
      courier.clear();
      courier.fillStyle(0xffd06e, 1).fillCircle(0, -22, 8);
      courier.lineStyle(2, 0xffd06e, .95).strokeCircle(0, -22, 13);
      courier.setAlpha(.9);
      this.playerCue?.('COURIER LINKED', 'WORLD');
      this.events?.emit?.('courier:linked', { courier, player });
      this.tweens?.add?.({ targets: courier, x: courier.x + 95, alpha: 0, duration: 500, ease: 'Cubic.easeIn', onComplete: () => courier.setVisible(false) });
    };

    const onInteract = (event) => {
      if (event?.code === 'KeyE' || event?.code === 'KeyF') interact();
    };
    window.addEventListener('keydown', onInteract);

    const onUpdate = () => {
      if (!state.active || !courier.active || !player.active) return;
      if (!state.used) {
        const targetX = player.x + 165;
        const targetY = player.y - 4;
        courier.x = Phaser.Math.Linear(courier.x, targetX, .055);
        courier.y = Phaser.Math.Linear(courier.y, targetY, .055);
        courier.rotation = Math.sin(performance.now() * .004) * .025;
      }
    };
    this.events?.on?.('update', onUpdate);
    this.events?.once?.('shutdown', () => {
      state.active = false;
      window.removeEventListener('keydown', onInteract);
      this.events?.off?.('update', onUpdate);
      courier.destroy();
      this.__reactiveCourier = null;
    });
    return result;
  };
}
