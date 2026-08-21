// V3 runtime bridge: expose the single authoritative Phaser instance.
// main.js creates the game before relay-ui-init.js is evaluated.
import Phaser from 'phaser';

const findRunnerGame = () => {
  const games = Array.isArray(Phaser.GAMES) ? Phaser.GAMES : [];
  return games.find(candidate => {
    try { return !!candidate?.scene?.getScene?.('runner'); } catch { return false; }
  }) || games.find(Boolean) || null;
};

const expose = () => {
  const game = findRunnerGame();
  if (!game) return false;
  window.__RUNNER_GAME__ = game;
  window.__RUNNER_GAME_READY__ = true;
  return true;
};

if (!expose()) {
  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    if (expose() || attempts >= 120) window.clearInterval(timer);
  }, 50);
}

window.addEventListener('load', expose, { once: true });
