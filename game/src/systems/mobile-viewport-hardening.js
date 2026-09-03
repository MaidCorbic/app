import './mobile-controls-bridge-v2.js';
import { RunnerScene } from '../scenes/RunnerScene.js';
import { installCharacterStateReactions } from './character-state-reactions-v1.js';

// Character reactions are a visual/state layer only. They observe the existing
// player physics state and never write velocity, acceleration, gravity, input,
// collision, or mobile/web movement values.
installCharacterStateReactions(RunnerScene);

// Mobile rotation hardening for Phaser + DOM layout.
// The game itself stays on Phaser RESIZE so the canvas always fills its parent.
// We only stabilize the browser measurements after rotation; we never switch
// Phaser scale modes during runtime.

const mobile = () => {
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const touch = Number(navigator.maxTouchPoints || 0) > 0;
  return coarse || touch || /Android|iPhone|iPad|iPod|Mobile|Windows Phone|Silk|Kindle/i.test(navigator.userAgent || '');
};

if (!mobile()) {
  // Desktop keeps Phaser's normal resize lifecycle untouched.
} else {
  const root = document.documentElement;
  const play = () => document.getElementById('play');
  const phaserHost = () => document.getElementById('phaser-game');
  let timer = 0;
  let syncing = false;
  let last = '';

  const measure = () => {
    const vv = window.visualViewport;

    const windowWidth = Math.max(
      1,
      Math.round(window.innerWidth || root.clientWidth)
    );

    const windowHeight = Math.max(
      1,
      Math.round(window.innerHeight || root.clientHeight)
    );

    const viewportWidth = Math.max(
      1,
      Math.round(vv?.width || windowWidth)
    );

    const viewportHeight = Math.max(
      1,
      Math.round(vv?.height || windowHeight)
    );

    /*
     * Use the browser window as the gameplay layout authority.
     * visualViewport is allowed to report a smaller temporary area
     * (browser chrome / keyboard / transition), but it must not
     * unexpectedly shrink the entire game surface.
     */
    const width = Math.max(windowWidth, viewportWidth);
    const height = Math.max(windowHeight, viewportHeight);

    return { width, height };
  };
  const apply = () => {
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

    // Phaser RESIZE consumes this final browser size. Do not dispatch while
    // syncing, otherwise visualViewport can create a resize feedback loop.
    syncing = true;
    window.dispatchEvent(new Event('resize'));
    requestAnimationFrame(() => { syncing = false; });
  };

  const schedule = () => {
    if (syncing) return;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      requestAnimationFrame(() => requestAnimationFrame(apply));
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
