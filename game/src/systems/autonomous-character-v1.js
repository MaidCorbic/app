import Phaser from 'phaser';

const IDLE_DELAY_MS = 4200;
const ROUTINE_MS = 5200;
const CHECK_DISTANCE = 120;

export function installAutonomousCharacter(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__autonomousCharacterInstalled) return;
  RunnerScene.prototype.__autonomousCharacterInstalled = true;

  const originalCreate = RunnerScene.prototype.create;
  RunnerScene.prototype.create = function (...args) {
    const result = originalCreate.apply(this, args);
    const player = this.player;
    if (!player || !this.add || !this.input) return result;

    const state = this.__autonomousCharacter = {
      active: true,
      idleSince: performance.now(),
      routineUntil: 0,
      routine: null,
      lastX: player.x,
      lastY: player.y,
      marker: null,
      didRoutine: false,
    };

    const makeMarker = () => {
      if (state.marker?.active) return state.marker;
      const marker = this.add.graphics().setDepth(7);
      marker.lineStyle(2, 0x8df4ff, .55);
      marker.strokeCircle(0, 0, 14);
      marker.lineStyle(1, 0x8df4ff, .35);
      marker.lineBetween(-7, 0, 7, 0);
      marker.lineBetween(0, -7, 0, 7);
      state.marker = marker;
      return marker;
    };

    const beginRoutine = () => {
      if (state.routineUntil || !state.active) return;
      state.routine = 'scan';
      state.routineUntil = performance.now() + ROUTINE_MS;
      state.didRoutine = true;
      makeMarker().setPosition(player.x, player.y - 46).setAlpha(0);
      this.playerCue?.('IDLE ROUTINE', 'SYSTEM');
      this.events?.emit?.('character:idle-routine', { routine: state.routine });
    };

    const resetIdle = () => {
      state.idleSince = performance.now();
      state.routineUntil = 0;
      state.routine = null;
      state.didRoutine = false;
      state.marker?.setAlpha(0);
    };

    const onInput = () => resetIdle();
    this.input.keyboard?.on('keydown', onInput);
    this.input.on('pointerdown', onInput);

    const onUpdate = (_time, delta = 16) => {
      if (!state.active || !player.active) return;
      const moved = Phaser.Math.Distance.Between(state.lastX, state.lastY, player.x, player.y) > 3;
      if (moved) resetIdle();
      state.lastX = player.x;
      state.lastY = player.y;

      if (!state.routine && performance.now() - state.idleSince >= IDLE_DELAY_MS) beginRoutine();
      if (!state.routineUntil) return;

      const remaining = state.routineUntil - performance.now();
      const marker = makeMarker();
      marker.setPosition(player.x, player.y - 46);
      marker.setAlpha(Math.min(.65, Math.max(0, (ROUTINE_MS - remaining) / 900)));
      marker.rotation += delta * .0015;

      // The routine is deliberately observational: no automatic movement, attacks,
      // pickups, physics, or progression are performed while the player is idle.
      if (remaining <= 0) resetIdle();
    };

    this.events?.on?.('update', onUpdate);
    this.events?.once?.('shutdown', () => {
      state.active = false;
      this.input.keyboard?.off('keydown', onInput);
      this.input.off('pointerdown', onInput);
      this.events?.off?.('update', onUpdate);
      state.marker?.destroy();
      this.__autonomousCharacter = null;
    });
    return result;
  };
}
