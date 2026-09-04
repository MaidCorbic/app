import { RunnerScene } from './src/scenes/RunnerScene.js';

/*
 * GAMEPLAY RUNTIME AUTHORITY V3
 *
 * This layer does not replace RunnerScene or any gameplay system.
 *
 * Runtime invariants:
 *   1) transient UI cannot accidentally resume a scene intentionally blocked
 *      by an active pause/intel overlay;
 *   2) legacy + mobile input adapters cannot emit the same one-shot action
 *      twice inside the same pointer gesture;
 *   3) adaptive music is allowed to remain the global music owner;
 *   4) completion events from an older run cannot leak into a restarted run.
 *
 * AUDIO:
 *   Adaptive music is NOT disabled here.
 *   The audio system owns its own AudioContext/unlock lifecycle.
 */

(() => {
  'use strict';

  if (window.__relayRuntimeAuthorityV3) return;
  window.__relayRuntimeAuthorityV3 = true;

  const sceneState = new WeakMap();
  const gameState = new WeakMap();

  function isElementVisible(node) {
    return !!node &&
      !node.classList.contains('hidden') &&
      !node.hidden;
  }

  function hasBlockingOverlay(scene) {
    if (!scene) return false;

    const pauseMenu =
      document.getElementById('pauseMenu');

    if (isElementVisible(pauseMenu)) {
      return true;
    }

    if (
      scene.infoCard?.active ||
      scene.__enemyDiscoveryActiveKey
    ) {
      return true;
    }

    const intel =
      document.getElementById('enemyDiscovery');

    if (isElementVisible(intel)) {
      return true;
    }

    const gameplayIntro =
      document.getElementById(
        'relayGameplayIntroFinalV1'
      );

    if (isElementVisible(gameplayIntro)) {
      return true;
    }

    return false;
  }

  /*
   * =====================================================
   * AUDIO
   * =====================================================
   *
   * IMPORTANT:
   *
   * Previous version intentionally disabled
   * relayAdaptiveMusic here.
   *
   * That behaviour has been removed.
   *
   * Adaptive music is now allowed to control music
   * normally.
   */

  function allowAdaptiveMusicOwner() {
    const music =
      window.relayAdaptiveMusic;

    if (!music) {
      return false;
    }

    /*
     * Do NOT call:
     *
     * music.stop()
     * music.setEnabled(false)
     *
     * and do NOT replace music.start().
     *
     * The adaptive music module remains authoritative.
     */

    window.__relayAdaptiveMusicOwner =
      'adaptive-music';

    return true;
  }

  function installResumeGuard(scene) {
    if (
      !scene?.scene ||
      sceneState.has(scene)
    ) {
      return;
    }

    const plugin =
      scene.scene;

    const originalResume =
      plugin.resume?.bind(plugin);

    const originalPause =
      plugin.pause?.bind(plugin);

    if (
      !originalResume ||
      !originalPause
    ) {
      return;
    }

    const state = {
      originalResume,
      originalPause,
      queuedResume: false,
      syncTimer: 0
    };

    sceneState.set(
      scene,
      state
    );

    plugin.resume =
      function guardedResume(...args) {
        if (
          hasBlockingOverlay(scene)
        ) {
          state.queuedResume = true;
          return scene;
        }

        state.queuedResume = false;

        return originalResume(
          ...args
        );
      };

    plugin.pause =
      function guardedPause(...args) {
        return originalPause(
          ...args
        );
      };

    const sync = () => {
      if (
        !scene.sys?.isActive?.() ||
        scene.sys?.isSleeping?.()
      ) {
        return;
      }

      if (
        !scene.scene?.isPaused?.() ||
        !state.queuedResume
      ) {
        return;
      }

      if (
        hasBlockingOverlay(scene)
      ) {
        return;
      }

      state.queuedResume = false;

      originalResume();
    };

    state.syncTimer =
      window.setInterval(
        sync,
        180
      );

    scene.events?.once?.(
      'shutdown',
      () => {
        window.clearInterval(
          state.syncTimer
        );

        plugin.resume =
          originalResume;

        plugin.pause =
          originalPause;

        sceneState.delete(
          scene
        );
      }
    );
  }

  function installInputDeduper(game) {
    if (
      !game?.events ||
      gameState.has(game)
    ) {
      return;
    }

    const emitter =
      game.events;

    const originalEmit =
      emitter.emit.bind(emitter);

    const lastActionAt =
      new Map();

    gameState.set(
      game,
      {
        originalEmit
      }
    );

    emitter.emit =
      function guardedEmit(
        eventName,
        ...args
      ) {
        /*
         * Prevent duplicate mobile actions.
         */
        if (
          eventName ===
          'mobile-action'
        ) {
          const action =
            String(
              args[0] || ''
            );

          const now =
            performance.now();

          const previous =
            lastActionAt.get(
              action ||
              '__empty__'
            ) || -Infinity;

          if (
            now - previous <
            90
          ) {
            return false;
          }

          lastActionAt.set(
            action ||
            '__empty__',
            now
          );
        }

        /*
         * Prevent completion events from
         * an older run leaking into a new run.
         */
        if (
          eventName ===
          'complete'
        ) {
          const activeScene =
            game.scene?.getScene?.(
              'runner'
            );

          const emittedRunId =
            args.length
              ? args[
                  args.length - 1
                ]
              : undefined;

          const activeRunId =
            activeScene?.runId;

          if (
            !activeScene ||
            (
              activeScene.finished ===
                false &&
              activeScene.respawning ===
                true
            )
          ) {
            return false;
          }

          if (
            activeRunId != null &&
            emittedRunId != null &&
            String(
              activeRunId
            ) !==
            String(
              emittedRunId
            )
          ) {
            return false;
          }

          if (
            !activeScene?.sys?.isActive?.() &&
            !activeScene?.sys?.isPaused?.()
          ) {
            return false;
          }
        }

        return originalEmit(
          eventName,
          ...args
        );
      };

    const scene =
      game.scene?.getScene?.(
        'runner'
      );

    scene?.events?.once?.(
      'shutdown',
      () => {
        emitter.emit =
          originalEmit;

        gameState.delete(
          game
        );
      }
    );
  }

  function attach(scene) {
    if (!scene?.game) {
      return;
    }

    /*
     * Allow adaptive music.
     */
    allowAdaptiveMusicOwner();

    installResumeGuard(
      scene
    );

    installInputDeduper(
      scene.game
    );
  }

  const originalCreate =
    RunnerScene
      ?.prototype
      ?.create;

  if (
    typeof originalCreate ===
      'function' &&
    !RunnerScene
      .prototype
      .__relayRuntimeAuthorityV3CreateWrapped
  ) {
    RunnerScene.prototype.create =
      function runtimeAuthorityCreate(
        ...args
      ) {
        const result =
          originalCreate.apply(
            this,
            args
          );

        try {
          attach(this);

          window.__relayRunnerScene =
            this;

          window.relayRunnerGame =
            this.game;

          window.dispatchEvent(
            new CustomEvent(
              'relay:runner-scene-ready',
              {
                detail: {
                  scene: this
                }
              }
            )
          );
        } catch (
          error
        ) {
          console.error(
            '[Relay Runtime Authority] scene attach failed',
            error
          );
        }

        return result;
      };

    RunnerScene
      .prototype
      .__relayRuntimeAuthorityV3CreateWrapped =
      true;
  }

  /*
   * Allow adaptive music after
   * the module initialization chain
   * has completed.
   */
  window.setTimeout(
    allowAdaptiveMusicOwner,
    0
  );

})();
