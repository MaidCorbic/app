(() => {
  if (window.__relayMenuMusicInstalled) return;
  window.__relayMenuMusicInstalled = true;
  let context = null;
  let master = null;
  let timer = null;
  let active = false;

  const isMobile = () => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');

  const getContext = () => {
    if (!window.AudioContext && !window.webkitAudioContext) return null;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    context ||= new AudioContext();
    return context;
  };

  const tone = (frequency, start, duration, volume, type = 'triangle') => {
    if (!context || !master) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  };

  const stop = () => {
    if (timer) window.clearTimeout(timer);
    timer = null;
    active = false;
    if (master) { try { master.disconnect(); } catch {} master = null; }
  };

  const playLoop = () => {
    if (!active || !context || !master) return;
    const now = context.currentTime + 0.04;
    const beat = 0.24;
    const melody = [261.63, 329.63, 392, 523.25, 493.88, 392, 329.63, 293.66, 261.63, 329.63, 440, 523.25, 587.33, 523.25, 440, 392];
    const bass = [130.81, 164.81, 196, 220];
    melody.forEach((frequency, index) => tone(frequency, now + index * beat, beat * 0.78, 0.22));
    bass.forEach((frequency, index) => tone(frequency, now + index * beat * 4, beat * 2.8, 0.13, 'sine'));
    [0, 4, 8, 12].forEach(index => tone(melody[index] * 2, now + index * beat, 0.07, 0.055, 'square'));
    timer = window.setTimeout(playLoop, melody.length * beat * 1000 - 20);
  };

  const start = () => {
    const intro = document.getElementById('intro');
    if (!intro || intro.classList.contains('hidden') || active) return;
    const ready = getContext();
    if (!ready) return;
    if (ready.state === 'suspended') {
      ready.resume().then(() => {
        if (!document.hidden && !intro.classList.contains('hidden')) start();
      }).catch(() => {});
      return;
    }
    stop();
    master = context.createGain();
    master.gain.value = 0.045;
    master.connect(context.destination);
    active = true;
    playLoop();
  };

  const gestureStart = () => start();

  // Desktop behavior stays exactly as before: try to start immediately, then
  // keep the existing gesture fallback for browsers that block autoplay.
  const boot = () => {
    if (!isMobile()) start();
    else start();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  ['pointerdown', 'touchstart', 'keydown'].forEach(type => {
    document.addEventListener(type, gestureStart, { passive: true });
  });

  window.addEventListener('blur', stop);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (!document.getElementById('intro')?.classList.contains('hidden')) start();
  });
  window.relayMenuMusic = { start, stop };
})();