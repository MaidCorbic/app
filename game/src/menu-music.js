const MENU_MUSIC_KEY = '__relayMenuMusic';

const getAudioContext = () => {
  if (!window.AudioContext && !window.webkitAudioContext) return null;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  window[MENU_MUSIC_KEY] ||= new AudioContext();
  const context = window[MENU_MUSIC_KEY];
  if (context.state === 'suspended') context.resume().catch(() => {});
  return context;
};

const stopMenuMusic = () => {
  const music = window.__relayMenuMusicState;
  if (!music) return;
  music.timer && window.clearTimeout(music.timer);
  music.nodes.forEach(node => { try { node.stop(); } catch {} });
  window.__relayMenuMusicState = undefined;
};

const note = (context, frequency, start, duration, volume, type = 'triangle') => {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
};

export function startMenuMusic({ muted = false, volume = 1 } = {}) {
  if (muted || window.__relayMenuMusicState) return;
  const context = getAudioContext();
  if (!context) return;

  stopMenuMusic();
  const master = context.createGain();
  master.gain.value = Math.min(Math.max(Number(volume) || 1, 0), 1) * 0.045;
  master.connect(context.destination);

  const state = { nodes: [], timer: undefined };
  window.__relayMenuMusicState = state;

  const melody = [
    261.63, 329.63, 392.00, 523.25,
    493.88, 392.00, 329.63, 293.66,
    261.63, 329.63, 440.00, 523.25,
    587.33, 523.25, 440.00, 392.00
  ];
  const bass = [130.81, 164.81, 196.00, 220.00];
  const stepMs = 240;
  const loop = () => {
    const current = window.__relayMenuMusicState;
    if (!current) return;
    const now = context.currentTime + 0.03;
    const beat = stepMs / 1000;
    melody.forEach((frequency, index) => note(context, frequency, now + index * beat, beat * 0.82, 0.22, 'triangle'));
    bass.forEach((frequency, index) => note(context, frequency, now + index * beat * 4, beat * 2.9, 0.16, 'sine'));
    [0, 4, 8, 12].forEach(index => note(context, melody[index] * 2, now + index * beat, beat * 0.16, 0.07, 'square'));
    current.timer = window.setTimeout(loop, melody.length * stepMs - 15);
  };
  loop();
}

export function stopMenuMusic() {
  stopMenuMusic();
}
