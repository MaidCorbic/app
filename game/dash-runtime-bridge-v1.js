/* UPDATE 21 SUPPORT — DASH RUNTIME BRIDGE
   Restores the actual physical dash response behind the existing gameplay dash event.
   Additive only: does not replace RunnerScene movement; it supplies dash velocity when the
   existing input surface emits relay:new-gameplay-dash.
*/
const SPEED = 670;
const DURATION = 145;
const COOLDOWN = 620;
const STATE_KEY = '__relayDashRuntimeV1';

function validScene(scene) {
  return !!scene?.player && !scene.finished && !scene.respawning && !scene.cinematicActive && !window.__relayCinematicLock && !scene.firstTimeTutorial;
}

function directionFor(scene) {
  const vx = Number(scene.player?.body?.velocity?.x || 0);
  if (Math.abs(vx) > 20) return Math.sign(vx);
  if (typeof scene.player?.flipX === 'boolean') return scene.player.flipX ? -1 : 1;
  return 1;
}

function finishDash(scene, expectedRun) {
  const state = scene?.[STATE_KEY];
  if (!state || state.token !== expectedRun) return;
  state.active = false;
  if (scene.player?.body) {
    const vx = Number(scene.player.body.velocity.x || 0);
    const retained = Math.abs(vx) > SPEED * 0.2 ? Math.sign(vx) * Math.min(Math.abs(vx), 460) : 0;
    scene.player.body.setVelocityX(retained);
  }
  scene.player?.setTexture?.(scene.player.body?.velocity?.y < -40 ? 'runner-jump' : 'runner-idle');
  scene.events?.emit?.('relay:dash-complete');
}

function performDash(scene) {
  if (!validScene(scene)) return false;
  const now = performance.now();
  const state = scene[STATE_KEY] || (scene[STATE_KEY] = { active: false, lastAt: -Infinity, token: 0 });
  if (state.active || now - state.lastAt < COOLDOWN) return false;

  const direction = directionFor(scene);
  state.active = true;
  state.lastAt = now;
  state.token += 1;
  const token = state.token;

  scene.player?.setTexture?.('runner-dash');
  scene.player?.body?.setVelocityX?.(direction * SPEED);
  scene.player?.body?.setMaxVelocity?.(SPEED, scene.player.body.maxVelocity?.y || 1120);
  scene.events?.emit?.('relay:dash-start', { direction, speed: SPEED, duration: DURATION });
  window.dispatchEvent(new CustomEvent('relay:dash-runtime-applied', { detail: { scene, direction, speed: SPEED, duration: DURATION } }));

  scene.time?.delayedCall?.(DURATION, () => finishDash(scene, token));
  return true;
}

function bind(scene) {
  if (!scene || scene.__relayDashRuntimeBound) return;
  scene.__relayDashRuntimeBound = true;
  scene[STATE_KEY] = { active: false, lastAt: -Infinity, token: 0 };
  const handler = () => performDash(scene);
  scene.__relayDashRuntimeDashHandler = handler;
  window.addEventListener('relay:new-gameplay-dash', handler, { passive: true });
  scene.events?.once?.('shutdown', () => {
    window.removeEventListener('relay:new-gameplay-dash', handler);
    scene.__relayDashRuntimeBound = false;
  });
  scene.events?.once?.('destroy', () => {
    window.removeEventListener('relay:new-gameplay-dash', handler);
    scene.__relayDashRuntimeBound = false;
  });
}

if (typeof window !== 'undefined' && !window.__relayDashRuntimeBridgeV1) {
  window.__relayDashRuntimeBridgeV1 = true;
  window.addEventListener('relay:runner-scene-ready', event => bind(event.detail?.scene), { passive: true });
  window.__relayDashRuntimeDebug = () => {
    const scene = window.__relayRunnerScene;
    const state = scene?.[STATE_KEY];
    const result = {
      runtimeLoaded: true,
      sceneLoaded: !!scene,
      mission: scene?.mission?.id ?? 'NONE',
      tutorial: !!scene?.firstTimeTutorial,
      cinematic: !!scene?.cinematicActive,
      dashBound: !!scene?.__relayDashRuntimeBound,
      dashActive: !!state?.active,
      dashVelocityX: Math.round(scene?.player?.body?.velocity?.x ?? 0),
    };
    console.table(result);
    return result;
  };
}
