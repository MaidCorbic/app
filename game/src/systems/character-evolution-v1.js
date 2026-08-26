const FLIGHT_KEY = 'F';
const FLIGHT_SPEED_Y = 260;
const FLIGHT_ASCEND_BOOST = 310;
const FLIGHT_DESCEND_BOOST = 230;
const WING_COLOR = 0x8df4ff;
const WING_GLOW = 0xb9f5ff;

function isWebInput(scene) {
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const fine = window.matchMedia?.('(pointer: fine)').matches ?? false;
  return !(coarse && !fine && Number(navigator.maxTouchPoints || 0) > 0) && Boolean(scene?.input?.keyboard);
}

function keyIsDown(scene, key) {
  const source = scene?.keys?.[key] || scene?.input?.keyboard?.addKey?.(key);
  return Boolean(source?.isDown);
}

function ensureWingVisual(scene) {
  if (!scene?.player || scene.__characterWingsV1) return;
  const root = scene.playerVisualV2?.root;
  if (!root) return;

  const wings = scene.add.container(-1, 4).setDepth(-1).setName('character-wings-v1');
  const leftGlow = scene.add.triangle(-14, 0, 0, 14, -28, 2, -2, -16, WING_GLOW, .32);
  const rightGlow = scene.add.triangle(14, 0, 0, 14, 28, 2, 2, -16, WING_GLOW, .32);
  const left = scene.add.polygon(-13, 1, [0, -11, -30, 3, -21, 12, -8, 7], WING_COLOR, .78);
  const right = scene.add.polygon(13, 1, [0, -11, 30, 3, 21, 12, 8, 7], WING_COLOR, .78);
  wings.add([leftGlow, rightGlow, left, right]);
  root.add(wings);
  scene.__characterWingsV1 = { wings, left, right, leftGlow, rightGlow };

  if (!scene.motionReduced) {
    scene.tweens.add({
      targets: [left, right],
      scaleY: { from: .9, to: 1.06 },
      angle: { from: -3, to: 3 },
      duration: 360,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
  }
}

function destroyWingVisual(scene) {
  const wings = scene?.__characterWingsV1;
  if (!wings) return;
  wings.wings?.destroy(true);
  scene.__characterWingsV1 = null;
}

function setFlight(scene, active) {
  if (!scene?.player?.body || scene.finished || scene.respawning) return;
  if (!scene.__characterFlightUnlocked) return;
  if (Boolean(scene.__characterFlightActive) === Boolean(active)) return;

  const body = scene.player.body;
  if (active) {
    scene.__characterPreviousAllowGravity = body.allowGravity !== false;
    body.allowGravity = false;
    body.setVelocityY(0);
    scene.__characterFlightActive = true;
    scene.playerCue?.('WINGS ONLINE · FLIGHT', '#b9f5ff');
  } else {
    body.allowGravity = scene.__characterPreviousAllowGravity !== false;
    body.setVelocityY(Math.min(Number(body.velocity?.y || 0), 80));
    scene.__characterFlightActive = false;
    scene.playerCue?.('WINGS OFFLINE', '#dffcff');
  }
}

function updateFlight(scene, delta) {
  if (!scene?.player?.body || !scene.__characterFlightUnlocked || !scene.__characterFlightActive) return;
  const body = scene.player.body;
  body.allowGravity = false;
  const ascend = keyIsDown(scene, 'SPACE') || keyIsDown(scene, 'W');
  const descend = keyIsDown(scene, 'S');
  let targetY = 0;
  if (ascend) targetY -= FLIGHT_ASCEND_BOOST;
  else if (descend) targetY += FLIGHT_DESCEND_BOOST;
  else targetY = 0;
  const step = Math.max(.016, Math.min(.05, Number(delta || 16) / 1000));
  const nextY = Phaser.Math.Linear(body.velocity?.y || 0, targetY, Math.min(1, step * 9));
  body.setVelocityY(Math.max(-FLIGHT_SPEED_Y, Math.min(FLIGHT_SPEED_Y, nextY)));
  scene.__characterWingsV1?.leftGlow?.setAlpha(ascend ? .58 : .28);
  scene.__characterWingsV1?.rightGlow?.setAlpha(ascend ? .58 : .28);
}

function installCharacterEvolution(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__characterEvolutionV1) return;
  RunnerScene.prototype.__characterEvolutionV1 = true;

  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;
  const originalShutdown = RunnerScene.prototype.shutdown;

  RunnerScene.prototype.create = function characterEvolutionCreate(...args) {
    const result = originalCreate.apply(this, args);
    this.__characterFlightUnlocked = true;
    this.__characterFlightActive = false;
    this.__characterPreviousAllowGravity = true;
    ensureWingVisual(this);
    if (isWebInput(this)) {
      this.__characterFlightToggle = event => {
        if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
        if (String(event.key).toUpperCase() !== FLIGHT_KEY) return;
        event.preventDefault();
        setFlight(this, !this.__characterFlightActive);
      };
      window.addEventListener('keydown', this.__characterFlightToggle);
    }
    return result;
  };

  RunnerScene.prototype.update = function characterEvolutionUpdate(time, delta) {
    const result = originalUpdate.call(this, time, delta);
    if (this.__characterFlightUnlocked) {
      if (this.__characterFlightActive && (this.finished || this.respawning)) setFlight(this, false);
      updateFlight(this, delta);
      this.__characterWingsV1?.wings?.setVisible(true);
    }
    return result;
  };

  RunnerScene.prototype.shutdown = function characterEvolutionShutdown(...args) {
    if (this.__characterFlightToggle) window.removeEventListener('keydown', this.__characterFlightToggle);
    destroyWingVisual(this);
    return originalShutdown?.apply(this, args);
  };
}

export { installCharacterEvolution };
