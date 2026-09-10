import { RunnerScene } from './src/scenes/RunnerScene.js';

// CHASER RUNTIME STABILITY V1
// Keeps the chase mechanic authoritative while removing fragile presentation-only
// cue creation from the hot update path. The previous implementation could crash
// a run when a transient Phaser display object was unavailable for setDepth().

if (!RunnerScene.prototype.__relayChaserRuntimeStabilityV1) {
  RunnerScene.prototype.__relayChaserRuntimeStabilityV1 = true;

  RunnerScene.prototype.updateChaser = function stableUpdateChaser(delta) {
    if (!this.chaser?.active) return;

    const sections = Array.isArray(this.mission?.chase?.sections)
      ? this.mission.chase.sections
      : [];

    let sectionIndex = sections.findIndex(section =>
      this.player?.active &&
      this.player.x >= section.start &&
      this.player.x <= section.end
    );

    const alarmSection = sectionIndex === -1 && this.alarmTimer > 0
      ? { start: 0, end: this.worldWidth, speed: 260 }
      : null;

    if (alarmSection) sectionIndex = -2;

    if (sectionIndex === -1) {
      if (this.chaseSection !== -1) {
        this.chaseEscapes = (this.chaseEscapes || 0) + 1;
        this.chaser.setVisible?.(false);
        this.chaser.body?.setEnable?.(false);
        this.chaseSection = -1;
        this.game?.events?.emit?.('chase', false);
      }
      return;
    }

    const section = alarmSection || sections[sectionIndex];
    if (!section) return;

    if (sectionIndex !== this.chaseSection) {
      this.chaseSection = sectionIndex;

      this.chaser
        .setPosition?.(this.player.x - 210, this.player.y)
        ?.setVisible?.(true);

      this.chaser.body
        ?.setEnable?.(true)
        ?.updateFromGameObject?.();

      this.game?.events?.emit?.('feedback', 'chase');
      this.game?.events?.emit?.('chase', true);
    }

    const targetX = this.player.x - 38;
    const nextX = Math.min(
      targetX,
      this.chaser.x + Number(section.speed || 0) * Number(delta || 0) / 1000
    );

    if (Number.isFinite(nextX)) this.chaser.x = nextX;

    if (Number.isFinite(this.player.y)) {
      this.chaser.y = Phaser.Math.Linear(this.chaser.y, this.player.y, .12);
    }

    this.chaser.body?.updateFromGameObject?.();
  };
}
