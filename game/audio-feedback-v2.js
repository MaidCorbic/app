import { RunnerScene } from './src/scenes/RunnerScene.js';

// FINAL AUDIO FIX V3
// Main gameplay feedback remains the SFX owner for jump/dash/fire/signal/hit/
// completion events. This module owns only contextual projectile/enemy sounds.
// Adaptive music owns music separately. One module must not synthesize the same
// one-shot feedback as another module.
//
// AUDIO AUTOPLAY HARDENING:
// - AudioContext is NOT created before a trusted user gesture.
// - Context is created only after unlock().
// - Existing relayAudioAutoplayGuard is used when available.
// - All gesture listeners are passive because they do not call preventDefault().
(() => {
  'use strict';

  if (window.__relayAudioFeedbackV7) return;
  window.__relayAudioFeedbackV7 = true;

  const AC =
    window.AudioContext ||
    window.webkitAudioContext;

  if (!AC) return;

  let ctx = null;
  let master = null;
  let unlocked = false;
  let activeScene = null;
  let pollTimer = null;

  const played = new WeakSet();
  const cooldown = new Map();

  /*
   * Create the AudioContext only after the browser has received
   * a trusted user gesture.
   */
  const getContext = () => {
    if (!unlocked) {
      return null;
    }

    if (!ctx) {
      try {
        ctx = new AC();

        master = ctx.createGain();
        master.gain.value = 0.78;

        master.connect(
          ctx.destination
        );
      } catch {
        ctx = null;
        master = null;
        return null;
      }
    }

    return ctx;
  };

  /*
   * Unlock audio after a real user gesture.
   */
  const unlock = async () => {
    try {
      unlocked = true;

      /*
       * Use the existing global audio guard when available.
       * This keeps all audio systems aligned.
       */
      try {
        window.relayAudioAutoplayGuard?.unlock?.();
      } catch {}

      const audio = getContext();

      if (!audio) {
        unlocked = false;
        return false;
      }

      if (audio.state !== 'running') {
        await audio.resume();
      }

      unlocked =
        audio.state === 'running';

      return unlocked;
    } catch {
      unlocked = false;
      return false;
    }
  };

  const beep = (
    frequency,
    duration,
    volume,
    type = 'triangle',
    endFrequency = frequency
  ) => {
    if (
      !unlocked ||
      !ctx ||
      !master ||
      ctx.state !== 'running'
    ) {
      return;
    }

    try {
      const now =
        ctx.currentTime + 0.003;

      const oscillator =
        ctx.createOscillator();

      const gain =
        ctx.createGain();

      oscillator.type = type;

      oscillator.frequency.setValueAtTime(
        Math.max(35, frequency),
        now
      );

      if (
        endFrequency !== frequency
      ) {
        oscillator.frequency.exponentialRampToValueAtTime(
          Math.max(35, endFrequency),
          now + duration
        );
      }

      gain.gain.setValueAtTime(
        0.0001,
        now
      );

      gain.gain.exponentialRampToValueAtTime(
        Math.max(0.0001, volume),
        now + 0.012
      );

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + duration
      );

      oscillator
        .connect(gain)
        .connect(master);

      oscillator.start(now);

      oscillator.stop(
        now + duration + 0.025
      );
    } catch {}
  };

  const play = kind => {
    if (!unlocked) return;

    switch (kind) {
      case 'gun':
        beep(
          115,
          0.075,
          0.18,
          'sawtooth',
          48
        );

        beep(
          620,
          0.025,
          0.07,
          'triangle',
          180
        );
        break;

      case 'egg':
        beep(
          430,
          0.045,
          0.11,
          'triangle',
          250
        );

        window.setTimeout(
          () =>
            beep(
              190,
              0.08,
              0.09,
              'triangle',
              95
            ),
          28
        );
        break;

      case 'dino':
        beep(
          100,
          0.24,
          0.13,
          'sawtooth',
          48
        );
        break;

      case 'invader':
        beep(
          230,
          0.14,
          0.10,
          'triangle',
          110
        );
        break;

      case 'alien':
        beep(
          175,
          0.16,
          0.10,
          'triangle',
          70
        );
        break;

      case 'boss':
        beep(
          65,
          0.28,
          0.16,
          'sawtooth',
          34
        );
        break;
    }
  };

  const playCooldown = (
    kind,
    ms = 120
  ) => {
    const now =
      performance.now();

    const last =
      cooldown.get(kind) || 0;

    if (
      now - last < ms
    ) {
      return;
    }

    cooldown.set(
      kind,
      now
    );

    play(kind);
  };

  const typeOf = object =>
    String(
      object?.getData?.(
        'route'
      )?.type ||
        object?.texture?.key ||
        object?.name ||
        ''
    ).toLowerCase();

  const classifyEnemy = object => {
    const type =
      typeOf(object);

    if (
      /chicken|egg/.test(type)
    ) {
      return 'egg';
    }

    if (
      /dino/.test(type)
    ) {
      return 'dino';
    }

    if (
      /invader|sentinel/.test(type)
    ) {
      return 'invader';
    }

    if (
      /alien/.test(type)
    ) {
      return 'alien';
    }

    if (
      /boss|titan|apex|storm/.test(
        type
      )
    ) {
      return 'boss';
    }

    return 'gun';
  };

  const pollProjectiles = () => {
    const scene =
      activeScene;

    if (
      !scene ||
      !scene.sys?.isActive?.() ||
      !unlocked ||
      !ctx ||
      ctx.state !== 'running'
    ) {
      return;
    }

    const enemies =
      scene.enemies
        ?.getChildren?.() || [];

    const groups = [
      [scene.eggs, 'egg'],
      [scene.comets, 'gun'],
      [scene.plasma, 'gun'],
      [scene.kineticBalls, 'gun']
    ];

    for (
      const [group, defaultType]
      of groups
    ) {
      for (
        const projectile
        of group?.getChildren?.() || []
      ) {
        if (
          !projectile?.active ||
          played.has(projectile)
        ) {
          continue;
        }

        played.add(projectile);

        let sound =
          defaultType;

        if (
          defaultType === 'gun' &&
          enemies.length
        ) {
          let nearest = null;
          let distance = Infinity;

          for (
            const enemy
            of enemies
          ) {
            if (!enemy?.active) {
              continue;
            }

            const d =
              Math.hypot(
                (enemy.x || 0) -
                  (projectile.x || 0),
                (enemy.y || 0) -
                  (projectile.y || 0)
              );

            if (
              d < distance
            ) {
              distance = d;
              nearest = enemy;
            }
          }

          if (
            nearest &&
            distance < 330
          ) {
            sound =
              classifyEnemy(
                nearest
              );
          }
        }

        playCooldown(
          sound,
          90
        );
      }
    }
  };

  const attachScene = scene => {
    if (
      !scene?.game ||
      scene.__relayAudioV7Attached
    ) {
      return;
    }

    scene.__relayAudioV7Attached =
      true;

    activeScene = scene;

    /*
     * This call is now safe:
     * getContext() refuses to create AudioContext
     * until unlocked === true.
     *
     * It can therefore fail harmlessly during
     * initial scene creation.
     */
    unlock().catch(() => {});

    if (pollTimer) {
      clearInterval(
        pollTimer
      );
    }

    pollTimer =
      window.setInterval(
        pollProjectiles,
        55
      );

    scene.events.once(
      'shutdown',
      () => {
        if (
          activeScene === scene
        ) {
          activeScene = null;
        }

        if (pollTimer) {
          clearInterval(
            pollTimer
          );

          pollTimer = null;
        }
      }
    );
  };

  const originalCreate =
    RunnerScene.prototype.create;

  if (
    typeof originalCreate ===
      'function' &&
    !RunnerScene.prototype
      .__relayAudioV7CreateWrapped
  ) {
    RunnerScene.prototype.create =
      function audioReadyCreate(
        ...args
      ) {
        const result =
          originalCreate.apply(
            this,
            args
          );

        attachScene(this);

        return result;
      };

    RunnerScene.prototype
      .__relayAudioV7CreateWrapped =
      true;
  }

  /*
   * Unlock only after an actual relevant user gesture.
   */
  const unlockOnGesture =
    event => {
      const target =
        event.target?.closest?.(
          '#play,' +
            '[data-mobile-action],' +
            '[data-action],' +
            '[data-control],' +
            '#pauseBtn,' +
            '#settingsBtn,' +
            '#resumeBtn,' +
            '#restartBtn'
        );

      if (target) {
        unlock().catch(() => {});
      }
    };

  document.addEventListener(
    'pointerdown',
    unlockOnGesture,
    {
      capture: true,
      passive: true
    }
  );

  document.addEventListener(
    'touchstart',
    unlockOnGesture,
    {
      capture: true,
      passive: true
    }
  );

  document.addEventListener(
    'keydown',
    event => {
      if (
        event.key ===
          'Enter' ||
        event.code ===
          'Space' ||
        event.key ===
          'Shift'
      ) {
        unlock().catch(
          () => {}
        );
      }
    },
    {
      capture: true,
      passive: true
    }
  );

  window.relayAudioV2 = {
    ensure: unlock,
    unlock,
    play,

    startMusic: () => {},
    stopMusic: () => {}
  };

  window.relayMenuMusic = {
    start: () => {},
    stop: () => {}
  };
})();
