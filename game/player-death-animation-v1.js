import { RunnerScene } from './src/scenes/RunnerScene.js';
import { SPAWN_SHIELD_MS } from './src/config/gameplay-timing.js';

// UPDATE 08 — stable deterministic player death / respawn.
(() => {
  if (window.__relayPlayerDeathAnimationV1Final) return;
  window.__relayPlayerDeathAnimationV1Final = true;

  const originalUpdate = RunnerScene.prototype.update;
  const originalFail = RunnerScene.prototype.fail;
  const originalRespawnCheckpoint = RunnerScene.prototype.respawnCheckpoint;

  const WORLD_BOTTOM_MARGIN = 24;
  const SPIKE_WIDTH = 34;

  /* =========================================================
     INPUT RESET
     ========================================================= */

  const resetInput = scene => {
    if (!scene) return;

    scene.mobileDirection = null;

    Object.keys(scene.mobileActions || {}).forEach(key => {
      scene.mobileActions[key] = false;
    });

    scene.player?.body?.setAcceleration?.(0, 0);
    scene.player?.body?.setVelocity?.(0, 0);
  };


  /* =========================================================
     VOID VISUAL
     ========================================================= */

  const makeVoidVisual = scene => {
    if (
      scene.__finalVoidVisual ||
      !scene.player?.active
    ) {
      return;
    }

    const bounds = scene.physics?.world?.bounds;

    if (!bounds) return;

    const width = Math.max(
      Number(bounds.width) || 0,
      Number(scene.worldWidth) || 2400
    );

    const y = Number(bounds.bottom) - 2;

    const graphics = scene.add
      .graphics()
      .setDepth(4);

    graphics
      .fillStyle(0x070c17, 0.96)
      .fillRect(
        bounds.left,
        y - 8,
        width,
        42
      );

    for (
      let x = bounds.left;
      x < bounds.right + SPIKE_WIDTH;
      x += SPIKE_WIDTH
    ) {
      graphics
        .fillStyle(0x172238, 1)
        .fillTriangle(
          x,
          y + 24,
          x + SPIKE_WIDTH / 2,
          y - 2,
          x + SPIKE_WIDTH,
          y + 24
        );

      graphics
        .lineStyle(2, 0xff826e, 0.95)
        .strokeTriangle(
          x,
          y + 24,
          x + SPIKE_WIDTH / 2,
          y - 2,
          x + SPIKE_WIDTH,
          y + 24
        );
    }

    scene.__finalVoidVisual = graphics;
  };


  /* =========================================================
     SINGLE VOID-DEATH ENTRY POINT
     ========================================================= */

  const startVoidDeath = scene => {
    if (
      !scene ||
      scene.finished ||
      scene.respawning ||
      !scene.player?.active ||
      scene.__finalDeathLock === true ||
      scene.__finalDeathPending === true
    ) {
      return;
    }

    scene.__finalDeathLock = true;
    scene.__finalDeathPending = true;
    scene.__forceVoidDeath = true;

    makeVoidVisual(scene);
    resetInput(scene);

    scene.player
      .setAngle(0)
      .setAlpha(1)
      .setScale(1)
      .clearTint()
      .play('runner-hit', true);

    const ring = scene.add
      .circle(
        scene.player.x,
        scene.player.y + 22,
        12,
        0xff826e,
        0.22
      )
      .setStrokeStyle(
        2,
        0xff826e,
        0.9
      )
      .setDepth(18);

    scene.tweens.add({
      targets: ring,
      scale: 3.4,
      alpha: 0,
      duration: 220,
      onComplete: () => {
        if (ring?.active) {
          ring.destroy();
        }
      }
    });

    if (!scene.motionReduced) {
      scene.shake(120, 0.006);
    }

    scene.time.delayedCall(220, () => {
      if (
        !scene ||
        scene.finished ||
        scene.respawning ||
        scene.__finalDeathPending !== true
      ) {
        return;
      }

      /*
       * Unlock ONLY at the exact moment where fail()
       * is allowed to execute.
       */
      scene.__finalDeathPending = false;
      scene.__finalDeathLock = false;

      scene.fail(
        'The courier fell into the relay void.'
      );
    });
  };


  /* =========================================================
     UPDATE
     ========================================================= */

  RunnerScene.prototype.update = function finalDeathUpdate(
    time,
    delta
  ) {
    /*
     * During the death animation absolutely nothing
     * may trigger another death.
     */
    if (this.__finalDeathLock === true) {
      resetInput(this);
      return;
    }

    if (
      !this.finished &&
      !this.respawning &&
      this.player?.active
    ) {
      makeVoidVisual(this);

      const bounds =
        this.physics?.world?.bounds;

      const bodyBottom = Number(
        this.player.body?.bottom ??
        (this.player.y + 28)
      );

      const bottomLimit = Number(
        bounds?.bottom
      );

      const fellBeyondRoute =
        Number(this.player.y) >= 760;

      const reachedWorldBottom =
        Number.isFinite(bottomLimit) &&
        bodyBottom >=
          bottomLimit - WORLD_BOTTOM_MARGIN;

      if (
        fellBeyondRoute ||
        reachedWorldBottom
      ) {
        startVoidDeath(this);
        return;
      }
    }

    return originalUpdate.call(
      this,
      time,
      delta
    );
  };


  /* =========================================================
     FAIL / DEATH
     ========================================================= */

  RunnerScene.prototype.fail = function finalDeathFail(
    message
  ) {
    const forcedVoid =
      Boolean(this.__forceVoidDeath);

    /*
     * Ignore re-entrant death calls.
     */
    if (
      this.briefingProtected ||
      this.finished ||
      this.respawning
    ) {
      return;
    }

    /*
     * Normal damage/death during spawn protection
     * remains blocked.
     *
     * Forced void death is allowed through.
     */
    if (
      !forcedVoid &&
      this.respawnGrace > 0
    ) {
      return;
    }

    /*
     * Once fail() has accepted the death,
     * prevent another death sequence.
     */
    if (this.__finalDeathLock === true) {
      return;
    }

    this.__forceVoidDeath = false;

    const isVoid =
      /void|fell|fall|bottom|rain/i.test(
        String(message)
      );

    /* =======================================================
       VOID DEATH
       ======================================================= */

    if (isVoid) {
      this.__finalDeathLock = true;

      resetInput(this);

      this.player
        ?.setAngle?.(0)
        ?.setScale?.(1)
        ?.setAlpha?.(1)
        ?.clearTint?.()
        ?.play?.(
          'runner-hit',
          true
        );

      if (!this.motionReduced) {
        this.shake(140, 0.007);
      }

      this.game?.events?.emit(
        'feedback',
        'death'
      );

      this.time.delayedCall(
        160,
        () => {
          if (
            this.finished ||
            this.respawning
          ) {
            this.__finalDeathLock = false;
            return;
          }

          const savedRespawnGrace =
            this.respawnGrace;

          const savedHealthInvulnerable =
            this.healthInvulnerable;

          this.respawnGrace = 0;
          this.healthInvulnerable = 0;

          try {
            originalFail.call(
              this,
              message
            );
          } finally {
            this.respawnGrace =
              savedRespawnGrace;

            this.healthInvulnerable =
              savedHealthInvulnerable;
          }
        }
      );

      return;
    }


    /* =======================================================
       NORMAL DEATH
       ======================================================= */

    this.__finalDeathLock = true;

    resetInput(this);

    const startX = this.player?.x ?? 0;
    const startY = this.player?.y ?? 0;

    const direction =
      this.player?.flipX
        ? -1
        : 1;

    this.player
      ?.play?.(
        'runner-hit',
        true
      )
      ?.setTint?.(
        0xff826e
      );

    const label = this.add
      .text(
        startX,
        startY - 62,
        'SIGNAL LOST',
        {
          fontFamily: 'DM Mono',
          fontSize: '13px',
          color: '#ff9b8b',
          stroke: '#08101c',
          strokeThickness: 5,
          letterSpacing: 1
        }
      )
      .setOrigin(0.5)
      .setDepth(20)
      .setScrollFactor(0);

    const pulse = this.add
      .circle(
        startX,
        startY + 8,
        16,
        0xff826e,
        0.18
      )
      .setStrokeStyle(
        2,
        0xff826e,
        0.55
      )
      .setDepth(19);

    this.tweens.add({
      targets: this.player,
      x: startX - direction * 26,
      y: startY + 30,
      angle: direction * 105,
      scaleX: 0.82,
      scaleY: 0.82,
      alpha: 0,
      duration: 420,
      ease: 'Cubic.in'
    });

    this.tweens.add({
      targets: label,
      y: label.y - 28,
      alpha: 0,
      duration: 420
    });

    this.tweens.add({
      targets: pulse,
      scale: 3.4,
      alpha: 0,
      duration: 400,
      onComplete: () => {
        if (pulse?.active) {
          pulse.destroy();
        }
      }
    });

    if (!this.motionReduced) {
      this.shake(150, 0.008);
    }

    this.game?.events?.emit(
      'feedback',
      'death'
    );

    this.time.delayedCall(
      440,
      () => {
        if (label?.active) {
          label.destroy();
        }

        if (
          this.finished ||
          this.respawning
        ) {
          this.__finalDeathLock = false;
          return;
        }

        this.__finalDeathLock = false;

        originalFail.call(
          this,
          message
        );
      }
    );
  };


  /* =========================================================
     RESPAWN
     ========================================================= */

  RunnerScene.prototype.respawnCheckpoint =
    function finalRespawn(...args) {

      /*
       * Clear death state BEFORE and AFTER
       * the authoritative respawn.
       */
      this.__finalDeathPending = false;
      this.__finalDeathLock = false;
      this.__forceVoidDeath = false;

      const result =
        originalRespawnCheckpoint.apply(
          this,
          args
        );

      this.__finalDeathPending = false;
      this.__finalDeathLock = false;
      this.__forceVoidDeath = false;

      resetInput(this);

      const checkpointX =
        Number.isFinite(
          Number(this.checkpoint?.x)
        )
          ? Number(this.checkpoint.x)
          : this.player?.x;

      const checkpointY =
        Number.isFinite(
          Number(this.checkpoint?.y)
        )
          ? Number(this.checkpoint.y)
          : this.player?.y;

      this.player?.setPosition?.(
        checkpointX,
        checkpointY
      );

      this.player?.body?.reset?.(
        checkpointX,
        checkpointY
      );

      this.player?.body
        ?.setVelocity?.(0, 0)
        ?.setAcceleration?.(0, 0)
        ?.setMaxVelocity?.(
          460,
          1120
        );

      this.player
        ?.setAngle?.(0)
        ?.setRotation?.(0)
        ?.setScale?.(1)
        ?.setAlpha?.(1)
        ?.clearTint?.()
        ?.setFlipY?.(false)
        ?.play?.(
          'runner-idle',
          true
        );

      this.healthInvulnerable =
        SPAWN_SHIELD_MS;

      this.respawnGrace =
        SPAWN_SHIELD_MS;

      /*
       * Keep the respawn feedback.
       */
      this.playerCue?.(
        'SAFE SPAWN · 10 SEC SHIELD',
        '#b9f5ff'
      );

      return result;
    };
})();
