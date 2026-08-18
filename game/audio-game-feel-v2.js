// UPDATE 08 FINAL — gameplay feedback only.
// Home/menu music is intentionally disabled here. Enemy SFX are handled by audio-feedback-v2.js.
(() => {
  if (window.__relayAudioV2) return;
  window.__relayAudioV2 = true;

  let ctx = null;
  let master = null;
  const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const ensure = async () => {
    if (!ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = reduced() ? .20 : .28;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
    return ctx.state === 'running' ? ctx : null;
  };

  const tone = (freq, duration, volume = .035, type = 'triangle', when = null, endFreq = null) => {
    if (!ctx || !master) return;
    const now = when ?? ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + Math.min(.015, duration * .2));
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    osc.connect(gain).connect(master);
    osc.start(now);
    osc.stop(now + duration + .02);
  };

  const noise = (duration = .05, volume = .02, cutoff = 2600) => {
    if (!ctx || !master) return;
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    gain.gain.value = volume;
    source.buffer = buffer;
    source.connect(filter).connect(gain).connect(master);
    source.start();
  };

  const stopMusic = () => {};
  const startMusic = () => {};

  const play = async kind => {
    const audio = await ensure();
    if (!audio) return;
    const now = ctx.currentTime;
    switch (kind) {
      case 'button': tone(520, .045, .05, 'triangle', now, 610); break;
      case 'collect': tone(660, .08, .035, 'triangle', now, 990); tone(990, .10, .022, 'triangle', now + .055, 1320); break;
      case 'checkpoint': tone(392, .10, .03, 'triangle', now); tone(523.25, .16, .025, 'triangle', now + .08); break;
      case 'combo': tone(523.25, .07, .03, 'triangle', now, 784); tone(659.25, .10, .025, 'triangle', now + .06, 988); break;
      case 'dash': noise(.055, .018, 2600); tone(180, .09, .026, 'triangle', now, 95); break;
      case 'hit': noise(.045, .025, 3200); tone(120, .08, .03, 'triangle', now, 75); break;
      case 'death': tone(220, .28, .035, 'triangle', now, 55); break;
      case 'mission': tone(392, .10, .025, 'triangle', now); tone(523.25, .10, .025, 'triangle', now + .08); tone(659.25, .18, .028, 'triangle', now + .16); break;
      case 'enemy-shot': noise(.035, .018, 4200); tone(180, .08, .026, 'triangle', now, 90); break;
      default: break;
    }
  };

  const bind = (type, sound) => window.addEventListener(type, () => play(sound));
  bind('relay:signal', 'collect');
  bind('relay:checkpoint', 'checkpoint');
  bind('relay:combo', 'combo');
  bind('relay:dash', 'dash');
  bind('relay:hit', 'hit');
  bind('relay:death', 'death');
  bind('relay:mission-complete', 'mission');
  bind('relay:enemy-shot', 'enemy-shot');

  document.addEventListener('pointerdown', event => {
    const button = event.target.closest?.('button, [role="button"], [data-action], [data-control]');
    if (button) play('button');
  }, { passive: true, capture: true });

  window.relayAudioV2 = { startMusic, stopMusic, play };
})();
