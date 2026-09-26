import { RunnerScene } from './src/scenes/RunnerScene.js';

// FINAL AUDIO FIX V5
// Global gameplay SFX + global UI click SFX.
//
// AUDIO:
// - AudioContext is created only after a real user gesture.
// - Any real pointer/touch/keyboard gesture can unlock audio.
// - UI click sound is loaded from:
//   game/assets/sounds/ui/click.wav
// - Global UI click handling is automatic.
// - Existing gameplay SFX remain procedural.
// - No separate audio system is created.
//
// GLOBAL UI CLICK:
// Any clickable UI button automatically uses:
//   window.relayAudioV2.play('ui-click');

(() => {
  'use strict';

  if (window.__relayAudioFeedbackV9) return;
  window.__relayAudioFeedbackV9 = true;

  const AC = window.AudioContext || window.webkitAudioContext;

  if (!AC) return;

  let ctx = null;
  let master = null;

  let unlocked = false;
  let activeScene = null;
  let pollTimer = null;

  /*
   * =====================================================
   * UI CLICK AUDIO
   * =====================================================
   *
   * Put the sound here:
   *
   * game/assets/sounds/ui/click.wav
   *
   * Because this file is:
   *
   * game/audio-feedback-v2.js
   *
   * the browser path is:
   *
   * ./assets/sounds/ui/click.wav
   */

  const UI_CLICK_URL = './assets/sounds/click.wav';

  let uiClickBuffer = null;
  let uiClickLoading = false;

  /*
   * Create AudioContext only after a trusted user gesture.
   */
  const getContext = () => {
    if (!unlocked) {
      return null;
    }

    if (!ctx) {
      try {
        ctx = new AC();

        master = ctx.createGain();

        /*
         * Global FX volume.
         */
        master.gain.value = 0.78;

        master.connect(ctx.destination);
      } catch {
        ctx = null;
        master = null;
        return null;
      }
    }

    return ctx;
  };

  /*
   * =====================================================
   * LOAD UI CLICK SOUND
   * =====================================================
   */

  const loadUiClick = async () => {
    if (uiClickBuffer || uiClickLoading || !ctx) {
      return;
    }

    uiClickLoading = true;

    try {
      const response = await fetch(UI_CLICK_URL);

      if (!response.ok) {
        throw new Error(`Failed to load UI click sound: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();

      /*
       * Decode the WAV file through
       * the existing AudioContext.
       */
      uiClickBuffer = await ctx.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.warn('[relayAudioV2] UI click sound could not be loaded.', error);

      uiClickBuffer = null;
    } finally {
      uiClickLoading = false;
    }
  };

  /*
   * =====================================================
   * PLAY UI CLICK
   * =====================================================
   */

  const playUiClick = () => {
    if (!unlocked || !ctx || !master || ctx.state !== 'running' || !uiClickBuffer) {
      return;
    }

    try {
      const source = ctx.createBufferSource();

      const gain = ctx.createGain();

      /*
       * UI click volume.
       *
       * 0.55 keeps the click clearly audible
       * without overpowering gameplay.
       */
      gain.gain.value = 0.55;

      source.buffer = uiClickBuffer;

      source.connect(gain).connect(master);

      source.start(0);
    } catch {}
  };

  /*
   * GLOBAL AUDIO UNLOCK
   *
   * Any real user interaction can unlock
   * the browser audio engine.
   */
  const unlock = async () => {
    try {
      unlocked = true;

      /*
       * Keep the existing global relay audio guard
       * synchronized with this audio owner.
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

      unlocked = audio.state === 'running';

      /*
       * Start loading the UI click sound
       * after AudioContext exists.
       */
      if (unlocked) {
        loadUiClick().catch(() => {});
      }

      return unlocked;
    } catch {
      unlocked = false;
      return false;
    }
  };

  /*
   * Make sure audio is still running.
   */
  const ensureRunning = async () => {
    if (!unlocked) {
      return false;
    }

    const audio = getContext();

    if (!audio) {
      return false;
    }

    try {
      if (audio.state !== 'running') {
        await audio.resume();
      }
    } catch {}

    unlocked = audio.state === 'running';

    if (unlocked) {
      loadUiClick().catch(() => {});
    }

    return unlocked;
  };

  /*
   * =====================================================
   * BASIC PROCEDURAL FX TONE
   * =====================================================
   */

  const beep = (frequency, duration, volume, type = 'triangle', endFrequency = frequency) => {
    if (!unlocked || !ctx || !master || ctx.state !== 'running') {
      return;
    }

    try {
      const now = ctx.currentTime + 0.003;

      const oscillator = ctx.createOscillator();

      const gain = ctx.createGain();

      oscillator.type = type;

      oscillator.frequency.setValueAtTime(Math.max(35, frequency), now);

      if (endFrequency !== frequency) {
        oscillator.frequency.exponentialRampToValueAtTime(
          Math.max(35, endFrequency),
          now + duration,
        );
      }

      gain.gain.setValueAtTime(0.0001, now);

      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), now + 0.012);

      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      oscillator.connect(gain).connect(master);

      oscillator.start(now);

      oscillator.stop(now + duration + 0.025);
    } catch {}
  };

  /*
   * =====================================================
   * CONTEXTUAL GAMEPLAY FX
   * =====================================================
   */

  const play = (kind) => {
    if (!unlocked) return;

    /*
     * GLOBAL UI CLICK
     */
    if (kind === 'ui-click') {
      playUiClick();
      return;
    }

    switch (kind) {
      case 'gun':
        beep(115, 0.075, 0.18, 'sawtooth', 48);

        beep(620, 0.025, 0.07, 'triangle', 180);
        break;

      case 'egg':
        beep(430, 0.045, 0.11, 'triangle', 250);

        window.setTimeout(() => beep(190, 0.08, 0.09, 'triangle', 95), 28);
        break;

      case 'dino':
        beep(100, 0.24, 0.13, 'sawtooth', 48);
        break;

      case 'invader':
        beep(230, 0.14, 0.1, 'triangle', 110);
        break;

      case 'alien':
        beep(175, 0.16, 0.1, 'triangle', 70);
        break;

      case 'boss':
        beep(65, 0.28, 0.16, 'sawtooth', 34);
        break;
    }
  };

  /*
   * Prevent projectile spam from creating
   * hundreds of sounds per second.
   */
  const playCooldown = (kind, ms = 120) => {
    const now = performance.now();

    const last = cooldown.get(kind) || 0;

    if (now - last < ms) {
      return;
    }

    cooldown.set(kind, now);

    play(kind);
  };

  /*
   * Cooldown storage.
   */
  const cooldown = new Map();

  const typeOf = (object) =>
    String(
      object?.getData?.('route')?.type || object?.texture?.key || object?.name || '',
    ).toLowerCase();

  const classifyEnemy = (object) => {
    const type = typeOf(object);

    if (/chicken|egg/.test(type)) {
      return 'egg';
    }

    if (/dino/.test(type)) {
      return 'dino';
    }

    if (/invader|sentinel/.test(type)) {
      return 'invader';
    }

    if (/alien/.test(type)) {
      return 'alien';
    }

    if (/boss|titan|apex|storm/.test(type)) {
      return 'boss';
    }

    return 'gun';
  };

  /*
   * =====================================================
   * PROJECTILE AUDIO
   * =====================================================
   */

  const played = new WeakSet();

  const pollProjectiles = () => {
    const scene = activeScene;

    if (!scene || !scene.sys?.isActive?.() || !unlocked || !ctx || ctx.state !== 'running') {
      return;
    }

    const enemies = scene.enemies?.getChildren?.() || [];

    const groups = [
      [scene.eggs, 'egg'],
      [scene.comets, 'gun'],
      [scene.plasma, 'gun'],
      [scene.kineticBalls, 'gun'],
    ];

    for (const [group, defaultType] of groups) {
      for (const projectile of group?.getChildren?.() || []) {
        if (!projectile?.active || played.has(projectile)) {
          continue;
        }

        played.add(projectile);

        let sound = defaultType;

        if (defaultType === 'gun' && enemies.length) {
          let nearest = null;
          let distance = Infinity;

          for (const enemy of enemies) {
            if (!enemy?.active) {
              continue;
            }

            const d = Math.hypot(
              (enemy.x || 0) - (projectile.x || 0),
              (enemy.y || 0) - (projectile.y || 0),
            );

            if (d < distance) {
              distance = d;
              nearest = enemy;
            }
          }

          if (nearest && distance < 330) {
            sound = classifyEnemy(nearest);
          }
        }

        playCooldown(sound, 90);
      }
    }
  };

  /*
   * =====================================================
   * CONNECT TO RUNNER SCENE
   * =====================================================
   */

  const attachScene = (scene) => {
    if (!scene?.game || scene.__relayAudioV9Attached) {
      return;
    }

    scene.__relayAudioV9Attached = true;

    activeScene = scene;

    /*
     * Do NOT force-create audio here.
     */
    ensureRunning().catch(() => {});

    if (pollTimer) {
      clearInterval(pollTimer);
    }

    pollTimer = window.setInterval(pollProjectiles, 55);

    scene.events.once('shutdown', () => {
      if (activeScene === scene) {
        activeScene = null;
      }

      if (pollTimer) {
        clearInterval(pollTimer);

        pollTimer = null;
      }
    });
  };

  /*
   * Connect to RunnerScene.
   */
  const originalCreate = RunnerScene.prototype.create;

  if (typeof originalCreate === 'function' && !RunnerScene.prototype.__relayAudioV9CreateWrapped) {
    RunnerScene.prototype.create = function audioReadyCreate(...args) {
      const result = originalCreate.apply(this, args);

      attachScene(this);

      return result;
    };

    RunnerScene.prototype.__relayAudioV9CreateWrapped = true;
  }

  /*
   * =====================================================
   * GLOBAL USER GESTURE UNLOCK
   * =====================================================
   */

  const unlockFromPointer = () => {
    unlock().catch(() => {});
  };

  const unlockFromTouch = () => {
    unlock().catch(() => {});
  };

  const unlockFromKeyboard = (event) => {
    if (event.isTrusted === false) {
      return;
    }

    unlock().catch(() => {});
  };

  document.addEventListener('pointerdown', unlockFromPointer, {
    capture: true,
    passive: true,
  });

  document.addEventListener('touchstart', unlockFromTouch, {
    capture: true,
    passive: true,
  });

  document.addEventListener('keydown', unlockFromKeyboard, {
    capture: true,
    passive: true,
  });

  /*
   * =====================================================
   * GLOBAL UI CLICK
   * =====================================================
   *
   * This is the important part.
   *
   * We do NOT add onclick to every button.
   *
   * Every normal button automatically gets
   * the global UI click sound.
   */

  const handleGlobalUiClick = (event) => {
    /*
     * Only genuine browser clicks.
     */
    if (event.isTrusted === false) {
      return;
    }

    /*
     * Find the clicked UI element.
     */
    const target = event.target?.closest?.(
      [
        'button',
        '[role="button"]',
        'a',
        'input[type="button"]',
        'input[type="submit"]',
        '.clickable',
      ].join(','),
    );

    if (!target) {
      return;
    }

    /*
     * Do not make disabled buttons click.
     */
    if (target.disabled || target.getAttribute('aria-disabled') === 'true') {
      return;
    }

    /*
     * Play the global UI sound.
     */
    window.relayAudioV2?.play?.('ui-click');
  };

  document.addEventListener('click', handleGlobalUiClick, {
    capture: true,
    passive: true,
  });

  /*
   * =====================================================
   * VISIBILITY
   * =====================================================
   */

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && unlocked) {
      ensureRunning().catch(() => {});
    }
  });

  /*
   * =====================================================
   * AUDIO WATCHDOG
   * =====================================================
   */

  window.setInterval(() => {
    if (!unlocked || document.hidden) {
      return;
    }

    if (ctx && ctx.state !== 'running') {
      ensureRunning().catch(() => {});
    }
  }, 1000);

  /*
   * =====================================================
   * PUBLIC GLOBAL FX API
   * =====================================================
   */

  window.relayAudioV2 = {
    ensure: unlock,
    unlock,
    play,

    startMusic: () => {},
    stopMusic: () => {},

    getState: () => ({
      unlocked,
      running: !!ctx && ctx.state === 'running',
      hasContext: !!ctx,
      fxEnabled: !!master,
      uiClickLoaded: !!uiClickBuffer,
    }),
  };

  /*
   * =====================================================
   * LEGACY COMPATIBILITY
   * =====================================================
   */

  window.relayMenuMusic = {
    start: () => {},
    stop: () => {},
  };
})();
