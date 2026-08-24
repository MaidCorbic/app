// Mobile rotation hardening for Phaser + DOM layout.
// The game stays on Phaser RESIZE; this module only applies final CSS dimensions
// and publishes a settled viewport signal without synthesizing another resize.

const mobile = () => {
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const touch = Number(navigator.maxTouchPoints || 0) > 0;
  return coarse || touch || /Android|iPhone|iPad|iPod|Mobile|Windows Phone|Silk|Kindle/i.test(navigator.userAgent || '');
};

if (mobile()) {
  const root = document.documentElement;
  const play = () => document.getElementById('play');
  const phaserHost = () => document.getElementById('phaser-game');
  let timer = 0;
  let frame = 0;
  let last = '';

  const measure = () => {
    const vv = window.visualViewport;
    return {
      width: Math.max(1, Math.round(vv?.width || window.innerWidth || root.clientWidth)),
      height: Math.max(1, Math.round(vv?.height || window.innerHeight || root.clientHeight)),
    };
  };

  const apply = () => {
    frame = 0;
    const { width, height } = measure();
    const key = `${width}x${height}`;
    if (key === last) return;
    last = key;

    root.style.setProperty('--relay-vw', `${width}px`);
    root.style.setProperty('--relay-vh', `${height}px`);
    root.dataset.relayOrientation = width >= height ? 'landscape' : 'portrait';

    const p = play();
    const host = phaserHost();
    if (p) {
      p.style.width = `${width}px`;
      p.style.height = `${height}px`;
    }
    if (host) {
      host.style.width = '100%';
      host.style.height = '100%';
    }

    document.dispatchEvent(new CustomEvent('relay:viewport-hardened', {
      detail: { width, height, orientation: width >= height ? 'landscape' : 'portrait' },
    }));
  };

  const schedule = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (!frame) frame = requestAnimationFrame(apply);
    }, 80);
  };

  window.addEventListener('orientationchange', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.visualViewport?.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', schedule, { passive: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, { once: true });
  } else {
    schedule();
  }
}
