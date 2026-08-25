import Phaser from 'phaser';
import './phaser-title-screen-v1.css';
import { TitleSceneV2 } from './scenes/title-scene-v2.js';

(() => {
  if (window.__relayPhaserTitleScreen) return;
  window.__relayPhaserTitleScreen = true;

  const boot = () => {
    if (document.getElementById('phaserTitleRoot')) return;
    const root = document.createElement('div');
    root.id = 'phaserTitleRoot';
    document.body.appendChild(root);
    try {
      window.__relayTitleGame = new Phaser.Game({
        type: Phaser.AUTO,
        parent: root,
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: '#02060d',
        scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
        scene: [TitleSceneV2],
        render: { antialias: true, roundPixels: true },
      });
    } catch (error) {
      console.error('Relay title V2 failed to start; retaining the HTML home fallback.', error);
      root.remove();
      window.__relayPhaserTitleScreen = false;
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
