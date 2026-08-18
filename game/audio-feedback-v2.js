(() => {
  if (window.__relayAudioFeedbackV2) return;
  window.__relayAudioFeedbackV2 = true;

  let ctx = null;
  let master = null;
  let unlocked = false;
  let musicTimer = null;
  let musicActive = false;
  const seen = new WeakSet();
  const lastShot = new Map();

  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;

  const ensure = async () => {
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.16;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
    unlocked = ctx.state === 'running';
    return unlocked;
  };

  const tone = (f, start, duration, volume = 0.08, type = 'sine', endF = f) => {
    if (!ctx || !master || !unlocked) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, f), start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endF), start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(master);
    osc.start(start);
    osc.stop(start + duration + 0.025);
  };

  const noise = (start, duration = 0.07, volume = 0.045, high = 1800) => {
    if (!ctx || !master || !unlocked) return;
    const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * duration)), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    filter.type = 'highpass';
    filter.frequency.value = high;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.buffer = buffer;
    source.connect(filter).connect(gain).connect(master);
    source.start(start);
  };

  const play = (kind = 'ui') => {
    if (!ctx || !unlocked) return;
    const t = ctx.currentTime + 0.006;
    if (kind === 'ui') { tone(740, t, .055, .055, 'sine', 920); return; }
    if (kind === 'collect') { tone(660, t, .08, .075); tone(990, t + .055, .12, .06); return; }
    if (kind === 'checkpoint') { tone(392, t, .12, .075); tone(587, t + .08, .16, .07); tone(784, t + .17, .22, .06); return; }
    if (kind === 'combo') { tone(520, t, .07, .065); tone(780, t + .05, .08, .06); tone(1040, t + .11, .12, .055); return; }
    if (kind === 'dash') { noise(t, .08, .035, 1200); tone(180, t, .11, .055, 'sine', 85); return; }
    if (kind === 'hit') { noise(t, .055, .055, 700); tone(115, t, .12, .07, 'triangle', 65); return; }
    if (kind === 'death') { tone(220, t, .22, .07, 'sine', 90); tone(130, t + .08, .3, .05, 'triangle', 55); return; }
    if (kind === 'mission') { tone(440, t, .11, .06); tone(660, t + .09, .12, .065); tone(880, t + .19, .2, .06); return; }

    const map = {
      gun: () => { noise(t, .035, .065, 900); tone(115, t, .075, .08, 'triangle', 72); },
      egg: () => { tone(520, t, .06, .055, 'triangle', 350); noise(t + .035, .09, .065, 1400); },
      dino: () => { tone(125, t, .24, .075, 'sawtooth', 78); noise(t + .04, .12, .025, 500); },
      invader: () => { tone(980, t, .11, .065, 'sine', 430); tone(1450, t + .025, .06, .035, 'triangle', 700); },
      alien: () => { tone(260, t, .16, .065, 'triangle', 120); noise(t, .06, .025, 1000); },
      boss: () => { tone(90, t, .25, .09, 'sine', 48); noise(t, .09, .04, 500); },
    };
    map[kind]?.();
  };

  const startMusic = () => {
    if (musicActive || !unlocked) return;
    musicActive = true;
    const loop = () => {
      if (!musicActive || !ctx) return;
      const t = ctx.currentTime + .02;
      // Warm, non-sci-fi home motif: soft pad + restrained pulse.
      [261.63, 329.63, 392.00, 329.63, 293.66, 349.23, 440.00, 349.23].forEach((f, i) => {
        tone(f, t + i * .38, .58, .018, 'triangle');
      });
      [130.81, 146.83, 164.81, 146.83].forEach((f, i) => tone(f, t + i * .76, .65, .012, 'sine'));
      musicTimer = window.setTimeout(loop, 3040);
    };
    loop();
  };

  const stopMusic = () => { musicActive = false; if (musicTimer) clearTimeout(musicTimer); musicTimer = null; };

  const gesture = () => { ensure().then(() => { if (document.getElementById('intro')) startMusic(); }); };
  ['pointerdown', 'touchend', 'click', 'keydown'].forEach(type => document.addEventListener(type, gesture, { passive: true, capture: true }));
  window.addEventListener('blur', stopMusic);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopMusic(); });

  const buttonSelectors = '#pauseBtn,#settingsBtn,#resumeBtn,#restartBtn,[data-action="dash"],[data-action="jump"],[data-action="attack"],[data-control="dash"],[data-control="jump"],[data-control="attack"]';
  document.addEventListener('pointerdown', event => {
    if (event.target.closest?.(buttonSelectors)) { ensure().then(() => play('ui')); }
  }, { passive: true, capture: true });

  ['relay:signal', 'relay:checkpoint', 'relay:combo', 'relay:hit', 'relay:dash', 'relay:death', 'relay:mission-complete'].forEach(type => {
    window.addEventListener(type, () => ensure().then(() => play(type.split(':')[1])));
  });

  const classify = obj => {
    const key = String(obj?.texture?.key || obj?.name || obj?.getData?.('type') || obj?.getData?.('route')?.type || '').toLowerCase();
    if (/egg|chicken/.test(key)) return 'egg';
    if (/dino|dragon/.test(key)) return 'dino';
    if (/invader|sentinel|storm|overseer/.test(key)) return 'invader';
    if (/alien|plasma/.test(key)) return 'alien';
    if (/boss|titan|apex/.test(key)) return 'boss';
    if (/bullet|shot|projectile|bolt|laser|plasma|fire/.test(key)) return 'gun';
    return null;
  };

  const enemyType = enemy => String(enemy?.getData?.('route')?.type || enemy?.texture?.key || '').toLowerCase();
  const classifyEnemy = enemy => {
    const type = enemyType(enemy);
    if (/chicken|egg/.test(type)) return 'egg';
    if (/dino/.test(type)) return 'dino';
    if (/invader|sentinel|storm/.test(type)) return 'invader';
    if (/alien/.test(type)) return 'alien';
    if (/boss|titan|apex/.test(type)) return 'boss';
    return 'gun';
  };

  const scanProjectiles = () => {
    const canvas = document.querySelector('#game canvas,canvas');
    const scene = window.__relayRunnerScene || window.game?.scene?.getScenes?.(true)?.[0];
    if (!scene?.children?.list) { requestAnimationFrame(scanProjectiles); return; }
    const enemies = scene.enemies?.getChildren?.() || [];
    for (const obj of scene.children.list) {
      if (!obj?.active || seen.has(obj)) continue;
      const kind = classify(obj);
      if (!kind) continue;
      seen.add(obj);
      let sound = kind;
      if (kind === 'gun') {
        let nearest = null, best = Infinity;
        for (const enemy of enemies) {
          if (!enemy?.active) continue;
          const d = Math.hypot((enemy.x || 0) - (obj.x || 0), (enemy.y || 0) - (obj.y || 0));
          if (d < best) { best = d; nearest = enemy; }
        }
        if (nearest && best < 220) sound = classifyEnemy(nearest);
      }
      const now = performance.now();
      if (now - (lastShot.get(sound) || 0) > 110) { lastShot.set(sound, now); ensure().then(() => play(sound)); }
    }
    requestAnimationFrame(scanProjectiles);
  };
  scanProjectiles();

  window.relayAudioV2 = { ensure, play, startMusic, stopMusic };
})();
