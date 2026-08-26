import Phaser from 'phaser';

const FLIGHT_KEY = 'F';
const FLIGHT_ASCEND_SPEED = 320;
const FLIGHT_DESCEND_SPEED = 240;
const FLIGHT_MAX_SPEED = 300;
const WING_COLOR = 0x8df4ff;
const WING_GLOW = 0xb9f5ff;

function isPrimaryTouch() {
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const fine = window.matchMedia?.('(pointer: fine)').matches ?? false;
  return coarse && !fine && Number(navigator.maxTouchPoints || 0) > 0;
}

function ensureWingVisual(scene) {
  const root = scene?.playerVisualV2?.root;
  if (!root || scene.__characterWingsV1) return;
  const wings = scene.add.container(0, 5).setDepth(-1).setName('character-wings-v1');
  const leftGlow = scene.add.polygon(-14, 0, [0, -12, -32, 3, -22, 15, -7, 8], WING_GLOW, .22);
  const rightGlow = scene.add.polygon(14, 0, [0, -12, 32, 3, 22, 15, 7, 8], WING_GLOW, .22);
  const left = scene.add.polygon(-14, 0, [0, -9, -29, 2, -19, 13, -7, 7], WING_COLOR, .78);
  const right = scene.add.polygon(14, 0, [0, -9, 29, 2, 19, 13, 7, 7], WING_COLOR, .78);
  wings.add([leftGlow, rightGlow, left, right]);
  root.add(wings);
  scene.__characterWingsV1 = { wings, left, right, leftGlow, rightGlow };
  if (!scene.motionReduced) {
    scene.tweens.add({ targets: [left, right], angle: { from: -4, to: 4 }, scaleY: { from: .94, to: 1.05 }, duration: 360, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }
}

function setFlight(scene, active) {
  if (!scene?.player?.body || scene.finished || scene.respawning || !scene.__flightUnlocked) return;
  if (Boolean(scene.__flightActive) === Boolean(active)) return;
  const body = scene.player.body;
  if (active) {
    scene.__flightPreviousGravity = body.allowGravity !== false;
    body.allowGravity = false;
    body.setVelocityY(0);
    scene.__flightActive = true;
    scene.playerCue?.('WINGS ONLINE · FLY MODE', '#b9f5ff');
  } else {
    body.allowGravity = scene.__flightPreviousGravity !== false;
    body.setVelocityY(0);
    scene.__flightActive = false;
    scene.__flightAscendHeld = false;
    scene.playerCue?.('WINGS OFFLINE', '#dffcff');
  }
}

function updateFlight(scene, delta) {
  if (!scene?.player?.body || !scene.__flightActive || !scene.__flightUnlocked) return;
  const body = scene.player.body;
  body.allowGravity = false;
  const keys = scene.keys;
  const ascend = Boolean(keys?.SPACE?.isDown || keys?.W?.isDown || scene.__flightAscendHeld);
  const descend = Boolean(keys?.S?.isDown);
  const target = ascend ? -FLIGHT_ASCEND_SPEED : descend ? FLIGHT_DESCEND_SPEED : 0;
  const dt = Math.max(.016, Math.min(.05, Number(delta || 16) / 1000));
  const current = Number(body.velocity?.y || 0);
  const next = Phaser.Math.Linear(current, target, Math.min(1, dt * 10));
  body.setVelocityY(Phaser.Math.Clamp(next, -FLIGHT_MAX_SPEED, FLIGHT_MAX_SPEED));
  scene.__characterWingsV1?.leftGlow?.setAlpha(ascend ? .62 : .24);
  scene.__characterWingsV1?.rightGlow?.setAlpha(ascend ? .62 : .24);
}

function installMobileFlightHold(scene) {
  if (!isPrimaryTouch()) return;
  const button = document.querySelector('[data-mobile-action="jump"]');
  if (!button || button.dataset.characterFlightBound === 'true') return;
  button.dataset.characterFlightBound = 'true';
  let taps = [];
  button.addEventListener('pointerdown', event => {
    const now = performance.now();
    taps = taps.filter(time => now - time < 360);
    taps.push(now);
    if (taps.length >= 2 && scene.__flightUnlocked) {
      taps = [];
      setFlight(scene, !scene.__flightActive);
    }
    if (scene.__flightActive) scene.__flightAscendHeld = true;
  }, { passive: true });
  const release = () => {
    if (scene.__flightActive) scene.__flightAscendHeld = false;
  };
  button.addEventListener('pointerup', release, { passive: true });
  button.addEventListener('pointercancel', release, { passive: true });
}

function installCharacterEvolution(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__characterEvolutionV1) return;
  RunnerScene.prototype.__characterEvolutionV1 = true;

  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;

  RunnerScene.prototype.create = function characterEvolutionCreate(...args) {
    const result = originalCreate.apply(this, args);
    this.__flightUnlocked = true;
    this.__flightActive = false;
    this.__flightPreviousGravity = true;
    this.__flightAscendHeld = false;
    ensureWingVisual(this);
    if (isPrimaryTouch()) {
      installMobileFlightHold(this);
    } else if (!this.__characterFlightToggle) {
      this.__characterFlightToggle = event => {
        if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
        if (String(event.key).toUpperCase() !== FLIGHT_KEY) return;
        event.preventDefault();
        setFlight(this, !this.__flightActive);
      };
      window.addEventListener('keydown', this.__characterFlightToggle);
    }
    if (this.player && this.playerVisualV2?.root) this.player.setAlpha(0);
    return result;
  };

  RunnerScene.prototype.update = function characterEvolutionUpdate(time, delta) {
    const result = originalUpdate.apply(this, arguments);
    if (this.__flightActive && (this.finished || this.respawning || this.cinematicActive)) setFlight(this, false);
    updateFlight(this, delta);
    this.__characterWingsV1?.wings?.setVisible(Boolean(this.player?.active));
    return result;
  };
}

export { installCharacterEvolution };
