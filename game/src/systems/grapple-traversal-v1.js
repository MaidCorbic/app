import Phaser from 'phaser';

const RANGE = 280;
const TRAVEL_MS = 430;
const COOLDOWN_MS = 850;

function drawAnchor(scene, x, y) {
  const g = scene.add.graphics().setDepth(9);
  g.lineStyle(2, 0x8df4ff, .9).strokeCircle(0, 0, 15);
  g.lineStyle(1, 0xb9f5ff, .45).strokeCircle(0, 0, 25);
  g.fillStyle(0x8df4ff, .9).fillCircle(0, 0, 5);
  g.lineStyle(2, 0x8df4ff, .55).lineBetween(-22, 0, -30, 0).lineBetween(22, 0, 30, 0);
  g.setPosition(x, y);
  return g;
}

export function installGrappleTraversal(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__grappleTraversalInstalled) return;
  RunnerScene.prototype.__grappleTraversalInstalled = true;

  const originalCreate = RunnerScene.prototype.create;
  RunnerScene.prototype.create = function (...args) {
    const result = originalCreate.apply(this, args);
    const player = this.player;
    if (!player || !this.add) return result;

    const state = this.__grappleTraversal = {
      active: true,
      busy: false,
      cooldownUntil: 0,
      anchor: null,
      rope: null,
      nextX: player.x + 520,
    };

    const spawnAnchor = () => {
      state.anchor?.destroy();
      state.rope?.destroy();
      state.anchor = drawAnchor(this, state.nextX, player.y - 105);
      state.rope = this.add.graphics().setDepth(8);
    };
    spawnAnchor();

    const nearest = () => {
      if (!state.anchor?.active || state.busy) return null;
      const d = Phaser.Math.Distance.Between(player.x, player.y, state.anchor.x, state.anchor.y);
      return d <= RANGE ? state.anchor : null;
    };

    const grapple = () => {
      if (!state.active || state.busy || performance.now() < state.cooldownUntil) return;
      const anchor = nearest();
      if (!anchor) return;
      state.busy = true;
      state.cooldownUntil = performance.now() + COOLDOWN_MS;
      const startX = player.x;
      const startY = player.y;
      const targetX = anchor.x;
      const targetY = anchor.y + 34;
      state.rope?.clear();
      state.rope?.lineStyle(2, 0x8df4ff, .8).lineBetween(startX, startY, targetX, targetY);
      player.body?.setVelocity?.(0, 0);
      player.body?.setAllowGravity?.(false);
      this.tweens.add({
        targets: player,
        x: targetX,
        y: targetY,
        duration: TRAVEL_MS,
        ease: 'Cubic.easeOut',
        onUpdate: () => {
          state.rope?.clear();
          state.rope?.lineStyle(2, 0x8df4ff, .8).lineBetween(player.x, player.y, targetX, targetY);
          player.body?.reset?.(player.x, player.y);
        },
        onComplete: () => {
          player.body?.setAllowGravity?.(true);
          player.body?.reset?.(targetX, targetY);
          state.rope?.clear();
          state.anchor?.destroy();
          state.anchor = null;
          this.playerCue?.('GRAPPLE LINK', 'TRAVERSAL');
          this.events?.emit?.('grapple:traversed', { x: targetX, y: targetY });
          state.busy = false;
          state.nextX = targetX + 560;
          spawnAnchor();
        },
      });
    };

    const onKey = event => {
      if (event.code === 'KeyG' && !event.repeat) {
        grapple();
        if (nearest()) event.preventDefault();
      }
    };
    const onPointer = () => grapple();
    window.addEventListener('keydown', onKey, { passive: false });
    this.input?.on?.('pointerdown', onPointer);

    const onUpdate = () => {
      if (!state.active || !state.anchor?.active || state.busy) return;
      const distance = Phaser.Math.Distance.Between(player.x, player.y, state.anchor.x, state.anchor.y);
      state.anchor.setAlpha(distance <= RANGE ? 1 : .35);
      if (distance <= RANGE) {
        state.anchor.rotation += .025;
        state.rope?.clear();
        state.rope?.lineStyle(1, 0x8df4ff, .2).lineBetween(player.x, player.y, state.anchor.x, state.anchor.y);
      } else state.rope?.clear();
    };
    this.events?.on?.('update', onUpdate);
    this.events?.once?.('shutdown', () => {
      state.active = false;
      player.body?.setAllowGravity?.(true);
      window.removeEventListener('keydown', onKey);
      this.input?.off?.('pointerdown', onPointer);
      this.events?.off?.('update', onUpdate);
      state.anchor?.destroy();
      state.rope?.destroy();
      this.__grappleTraversal = null;
    });
    return result;
  };
}
