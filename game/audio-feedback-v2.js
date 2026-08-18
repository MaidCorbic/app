import { RunnerScene } from './src/scenes/RunnerScene.js';

// UPDATE 08 FINAL AUDIO — single clean engine, no noise generator, no sci-fi menu loop.
(() => {
  if (window.__relayAudioFeedbackV6) return;
  window.__relayAudioFeedbackV6 = true;

  let ctx = null, master = null, musicGain = null, musicTimer = null;
  let unlocked = false, musicActive = false;
  const seen = new WeakSet();
  const lastShot = new Map();
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;

  const ensure = async () => {
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.46;
      master.connect(ctx.destination);
    }
    if (ctx.state !== 'running') await ctx.resume().catch(() => {});
    unlocked = ctx.state === 'running';
    return unlocked;
  };

  const tone = (f, start, duration, volume = .06, type = 'sine', endF = f, destination = master) => {
    if (!ctx || !destination || !unlocked) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(30, f), start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, endF), start + duration);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0001, volume), start + Math.min(.018, duration * .15));
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    osc.connect(gain).connect(destination);
    osc.start(start);
    osc.stop(start + duration + .02);
  };

  const stopMusic = () => {
    musicActive = false;
    if (musicTimer) clearTimeout(musicTimer);
    musicTimer = null;
    if (musicGain) {
      const now = ctx?.currentTime || 0;
      try { musicGain.gain.cancelScheduledValues(now); musicGain.gain.setTargetAtTime(.0001, now, .04); } catch {}
      try { musicGain.disconnect(); } catch {}
      musicGain = null;
    }
  };

  const musicBar = () => {
    if (!musicActive || !ctx || !musicGain || !unlocked) return;
    const start = ctx.currentTime + .04;
    const chords = [
      [261.63, 329.63, 392.00],
      [220.00, 277.18, 329.63],
      [246.94, 293.66, 369.99],
      [196.00, 246.94, 293.66]
    ];
    chords.forEach((chord, index) => {
      const t = start + index * 1.15;
      chord.forEach((f, i) => tone(f, t + i * .025, .9, .024, 'sine', f * .998, musicGain));
    });
    musicTimer = setTimeout(musicBar, 4520);
  };

  const startMusic = async () => {
    const intro = document.getElementById('intro');
    if (!intro || intro.classList.contains('hidden')) return;
    if (!(await ensure()) || musicActive) return;
    musicActive = true;
    musicGain = ctx.createGain();
    musicGain.gain.value = .82;
    musicGain.connect(master);
    musicBar();
  };

  // SFX are deliberately tone-only. No noise buffers, no laser/noise generators.
  const play = kind => {
    if (!ctx || !unlocked) return;
    const t = ctx.currentTime + .006;
    if (kind === 'ui') return tone(520, t, .045, .055, 'triangle', 610);
    if (kind === 'signal') return (tone(523, t, .08, .065, 'triangle', 659), tone(784, t + .055, .09, .055, 'triangle', 988));
    if (kind === 'checkpoint') return (tone(330, t, .1, .07, 'triangle', 392), tone(494, t + .08, .13, .06, 'triangle', 587), tone(659, t + .17, .18, .055, 'triangle', 784));
    if (kind === 'combo') return (tone(440, t, .06, .055, 'triangle', 520), tone(660, t + .05, .07, .05, 'triangle', 780), tone(880, t + .11, .1, .045, 'triangle', 1040));
    if (kind === 'dash') return tone(150, t, .11, .065, 'triangle', 72);
    if (kind === 'hit') return tone(105, t, .1, .075, 'triangle', 55);
    if (kind === 'death') return (tone(190, t, .2, .075, 'triangle', 75), tone(110, t + .07, .22, .05, 'triangle', 45));
    if (kind === 'mission-complete') return (tone(392, t, .1, .06, 'triangle', 440), tone(523, t + .08, .11, .06, 'triangle', 587), tone(659, t + .18, .17, .055, 'triangle', 784));
    if (kind === 'warning') return tone(180, t, .12, .065, 'triangle', 120);
    if (kind === 'gun') return (tone(120, t, .075, .13, 'triangle', 48), tone(640, t, .022, .05, 'triangle', 210));
    if (kind === 'egg') return (tone(430, t, .04, .075, 'triangle', 250), tone(210, t + .025, .08, .06, 'triangle', 105));
    if (kind === 'dino') return tone(105, t, .22, .085, 'triangle', 52);
    if (kind === 'invader') return tone(230, t, .12, .06, 'triangle', 115);
    if (kind === 'alien') return tone(175, t, .14, .06, 'triangle', 78);
    if (kind === 'boss') return tone(62, t, .25, .1, 'triangle', 35);
  };

  const classify = obj => {
    const key = String(obj?.texture?.key || obj?.name || obj?.getData?.('type') || obj?.getData?.('route')?.type || '').toLowerCase();
    if (/egg/.test(key)) return 'egg';
    if (/dino/.test(key)) return 'dino';
    if (/invader|sentinel|storm/.test(key)) return 'invader';
    if (/alien/.test(key)) return 'alien';
    if (/boss|titan|apex/.test(key)) return 'boss';
    if (/bullet|shot|projectile|bolt|fire|comet|kinetic/.test(key)) return 'gun';
    return null;
  };

  const enemyType = enemy => String(enemy?.getData?.('route')?.type || enemy?.texture?.key || '').toLowerCase();
  const classifyEnemy = enemy => /chicken|egg/.test(enemyType(enemy)) ? 'egg' : /dino/.test(enemyType(enemy)) ? 'dino' : /invader|sentinel|storm/.test(enemyType(enemy)) ? 'invader' : /alien/.test(enemyType(enemy)) ? 'alien' : /boss|titan|apex/.test(enemyType(enemy)) ? 'boss' : 'gun';

  const announceProjectiles = scene => {
    const groups = [scene.eggs, scene.comets, scene.plasma, scene.kineticBalls];
    const enemies = scene.enemies?.getChildren?.() || [];
    for (const group of groups) {
      for (const obj of group?.getChildren?.() || []) {
        if (!obj?.active || seen.has(obj)) continue;
        const direct = classify(obj);
        if (!direct) continue;
        seen.add(obj);
        let sound = direct;
        if (direct === 'gun' || direct === 'egg') {
          let nearest = null, best = Infinity;
          for (const enemy of enemies) {
            if (!enemy?.active) continue;
            const d = Math.hypot((enemy.x || 0) - (obj.x || 0), (enemy.y || 0) - (obj.y || 0));
            if (d < best) { best = d; nearest = enemy; }
          }
          if (nearest && best < 300) sound = classifyEnemy(nearest);
        }
        const now = performance.now();
        if (now - (lastShot.get(sound) || 0) > 110) {
          lastShot.set(sound, now);
          ensure().then(() => play(sound));
        }
      }
    }
  };

  const attachScene = scene => {
    if (!scene?.game || scene.__relayAudioAttached) return;
    scene.__relayAudioAttached = true;
    scene.game.events.on('feedback', feedback => {
      if (feedback === 'warning') ensure().then(() => play('warning'));
      else if (feedback === 'hit') ensure().then(() => play('hit'));
      else if (feedback === 'signal') ensure().then(() => play('signal'));
      else if (feedback === 'complete') ensure().then(() => play('mission-complete'));
    });
    scene.events.once('shutdown', () => { scene.game.events.off('feedback', null, scene); });
    const poll = () => {
      if (!scene.scene?.isActive?.() && !scene.sys?.isActive?.()) return;
      announceProjectiles(scene);
      scene.__relayAudioPoll = requestAnimationFrame(poll);
    };
    poll();
  };

  const wrapCreate = () => {
    const original = RunnerScene.prototype.create;
    if (typeof original !== 'function' || RunnerScene.prototype.__relayAudioCreateWrapped) return;
    RunnerScene.prototype.create = function audioCreate(...args) {
      const result = original.apply(this, args);
      attachScene(this);
      return result;
    };
    RunnerScene.prototype.__relayAudioCreateWrapped = true;
  };
  wrapCreate();

  const unlock = () => ensure();
  ['pointerdown', 'touchend', 'click', 'keydown'].forEach(type => document.addEventListener(type, unlock, { passive: true, capture: true }));

  const intro = document.getElementById('intro');
  if (intro) new MutationObserver(() => {
    if (intro.classList.contains('hidden')) stopMusic();
  }).observe(intro, { attributes: true, attributeFilter: ['class'] });

  document.addEventListener('pointerdown', event => {
    const target = event.target.closest?.('#pauseBtn,#settingsBtn,#resumeBtn,#restartBtn,[data-action="dash"],[data-action="jump"],[data-action="attack"],[data-control="dash"],[data-control="jump"],[data-control="attack"]');
    if (target) ensure().then(() => play('ui'));
    if (intro && !intro.classList.contains('hidden')) startMusic();
  }, { passive: true, capture: true });

  ['relay:signal', 'relay:checkpoint', 'relay:combo', 'relay:hit', 'relay:dash', 'relay:death', 'relay:mission-complete'].forEach(type => window.addEventListener(type, () => ensure().then(() => play(type.split(':')[1]))));

  window.relayAudioV2 = { ensure, play, startMusic, stopMusic };
})();
