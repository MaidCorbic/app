import { RunnerScene } from './src/scenes/RunnerScene.js';

// FINAL AUDIO FIX
// Home: completely silent. No menu music, no noise, no procedural loop.
// Game: one AudioContext, unlocked by the real Play/game gesture, with direct
// gameplay feedback + projectile polling. Keep this module self-contained.
(() => {
  if (window.__relayAudioFeedbackV7) return;
  window.__relayAudioFeedbackV7 = true;

  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;

  let ctx = null;
  let master = null;
  let unlocked = false;
  let activeScene = null;
  let pollTimer = null;
  const played = new WeakSet();
  const cooldown = new Map();

  const getContext = () => {
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.78;
      master.connect(ctx.destination);
    }
    return ctx;
  };

  const unlock = async () => {
    try {
      const audio = getContext();
      if (audio.state !== 'running') await audio.resume();
      unlocked = audio.state === 'running';
      return unlocked;
    } catch {
      unlocked = false;
      return false;
    }
  };

  const beep = (frequency, duration, volume, type = 'triangle', endFrequency = frequency) => {
    if (!unlocked || !ctx || !master) return;
    const now = ctx.currentTime + 0.003;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(35, frequency), now);
    if (endFrequency !== frequency) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(35, endFrequency), now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(master);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.025);
  };

  const play = kind => {
    if (!unlocked) return;
    switch (kind) {
      case 'ui': beep(620, .07, .09, 'triangle', 760); break;
      case 'jump': beep(420, .10, .10, 'triangle', 700); break;
      case 'dash': beep(180, .13, .12, 'triangle', 70); break;
      case 'signal': beep(520, .09, .10, 'triangle', 700); setTimeout(() => beep(820, .11, .08, 'triangle', 1020), 55); break;
      case 'checkpoint': beep(360, .10, .10, 'triangle', 470); setTimeout(() => beep(620, .14, .09, 'triangle', 820), 80); break;
      case 'warning': beep(180, .14, .11, 'triangle', 105); break;
      case 'hit': beep(105, .12, .14, 'sawtooth', 55); break;
      case 'death': beep(190, .20, .12, 'triangle', 70); setTimeout(() => beep(90, .25, .10, 'triangle', 40), 80); break;
      case 'complete': beep(420, .10, .10, 'triangle', 520); setTimeout(() => beep(620, .12, .10, 'triangle', 760), 80); setTimeout(() => beep(820, .18, .09, 'triangle', 1040), 170); break;
      case 'gun': beep(115, .075, .18, 'sawtooth', 48); beep(620, .025, .07, 'triangle', 180); break;
      case 'egg': beep(430, .045, .11, 'triangle', 250); setTimeout(() => beep(190, .08, .09, 'triangle', 95), 28); break;
      case 'dino': beep(100, .24, .13, 'sawtooth', 48); break;
      case 'invader': beep(230, .14, .10, 'triangle', 110); break;
      case 'alien': beep(175, .16, .10, 'triangle', 70); break;
      case 'boss': beep(65, .28, .16, 'sawtooth', 34); break;
    }
  };

  const playCooldown = (kind, ms = 120) => {
    const now = performance.now();
    if (now - (cooldown.get(kind) || 0) < ms) return;
    cooldown.set(kind, now);
    play(kind);
  };

  const typeOf = object => String(
    object?.getData?.('route')?.type || object?.texture?.key || object?.name || ''
  ).toLowerCase();

  const classifyEnemy = object => {
    const type = typeOf(object);
    if (/chicken|egg/.test(type)) return 'egg';
    if (/dino/.test(type)) return 'dino';
    if (/invader|sentinel/.test(type)) return 'invader';
    if (/alien/.test(type)) return 'alien';
    if (/boss|titan|apex|storm/.test(type)) return 'boss';
    return 'gun';
  };

  const pollProjectiles = () => {
    const scene = activeScene;
    if (!scene || !scene.sys?.isActive?.() || !unlocked) return;

    const enemies = scene.enemies?.getChildren?.() || [];
    const groups = [
      [scene.eggs, 'egg'],
      [scene.comets, 'gun'],
      [scene.plasma, 'gun'],
      [scene.kineticBalls, 'gun']
    ];

    for (const [group, defaultType] of groups) {
      for (const projectile of group?.getChildren?.() || []) {
        if (!projectile?.active || played.has(projectile)) continue;
        played.add(projectile);

        let sound = defaultType;
        if (defaultType === 'gun' && enemies.length) {
          let nearest = null;
          let distance = Infinity;
          for (const enemy of enemies) {
            if (!enemy?.active) continue;
            const d = Math.hypot((enemy.x || 0) - (projectile.x || 0), (enemy.y || 0) - (projectile.y || 0));
            if (d < distance) { distance = d; nearest = enemy; }
          }
          if (nearest && distance < 330) sound = classifyEnemy(nearest);
        }
        playCooldown(sound, 90);
      }
    }
  };

  const attachScene = scene => {
    if (!scene?.game || scene.__relayAudioV7Attached) return;
    scene.__relayAudioV7Attached = true;
    activeScene = scene;

    const onFeedback = feedback => {
      unlock().then(() => {
        if (feedback === 'warning') playCooldown('warning', 250);
        if (feedback === 'hit') playCooldown('hit', 180);
        if (feedback === 'signal') playCooldown('signal', 180);
        if (feedback === 'complete') playCooldown('complete', 500);
      });
    };
    scene.game.events.on('feedback', onFeedback);

    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(pollProjectiles, 45);

    scene.events.once('shutdown', () => {
      if (activeScene === scene) activeScene = null;
      scene.game.events.off('feedback', onFeedback);
    });
  };

  // Wrap Phaser scene creation so audio attaches to the actual live RunnerScene.
  const originalCreate = RunnerScene.prototype.create;
  if (typeof originalCreate === 'function' && !RunnerScene.prototype.__relayAudioV7CreateWrapped) {
    RunnerScene.prototype.create = function audioReadyCreate(...args) {
      const result = originalCreate.apply(this, args);
      attachScene(this);
      return result;
    };
    RunnerScene.prototype.__relayAudioV7CreateWrapped = true;
  }

  // IMPORTANT: Home stays silent. A Play click only unlocks audio; it never starts Home music.
  const unlockOnGesture = event => {
    const target = event.target?.closest?.('#play,[data-mobile-action],[data-action],[data-control],#pauseBtn,#settingsBtn,#resumeBtn,#restartBtn');
    if (target) unlock();
  };
  document.addEventListener('pointerdown', unlockOnGesture, { capture: true, passive: true });
  document.addEventListener('touchstart', unlockOnGesture, { capture: true, passive: true });
  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.code === 'Space' || event.key === 'Shift') unlock();
  }, { capture: true, passive: true });

  // Direct game controls. These are independent of Phaser projectile detection,
  // so mobile/keyboard controls always have audible feedback after unlock.
  document.addEventListener('pointerdown', event => {
    const button = event.target?.closest?.('[data-mobile-action]');
    if (!button) return;
    unlock().then(() => {
      const action = button.dataset.mobileAction;
      if (action === 'jump') play('jump');
      else if (action === 'dash') play('dash');
      else if (action === 'fire' || action === 'sword') play('gun');
    });
  }, { capture: true, passive: true });

  document.addEventListener('keydown', event => {
    if (event.repeat) return;
    unlock().then(() => {
      if (event.code === 'Space' || /^ArrowUp$/i.test(event.key) || /^w$/i.test(event.key)) play('jump');
      else if (event.key === 'Shift') play('dash');
      else if (/^e$/i.test(event.key) || /^q$/i.test(event.key)) play('gun');
    });
  }, { capture: true, passive: true });

  // Explicit public API for the game and future systems.
  window.relayAudioV2 = {
    ensure: unlock,
    unlock,
    play,
    startMusic: () => {},
    stopMusic: () => {}
  };

  // Defensive: if any older menu-audio API exists, make it silent.
  window.relayMenuMusic = { start: () => {}, stop: () => {} };
})();
