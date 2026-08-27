import { RunnerScene } from './src/scenes/RunnerScene.js';

// Crouch gameplay V1 — additive and isolated.
// PC: hold C. Mobile: hold the injected CROUCH button.
// Crouch + running speed automatically triggers a short tactical slide.
// Does not modify progression/save state.

const MOBILE_BUTTON_ID = 'mobileCrouchButton';
const sceneState = new WeakMap();

function installMobileButton() {
  let button = document.getElementById(MOBILE_BUTTON_ID);
  if (button) return button;
  const actions = document.querySelector('.mobile-actions');
  if (!actions) return null;

  button = document.createElement('button');
  button.id = MOBILE_BUTTON_ID;
  button.type = 'button';
  button.innerHTML = 'CROUCH<small>C · SLIDE</small>';
  button.setAttribute('aria-label', 'Hold to crouch and slide while running');
  actions.appendChild(button);

  const style = document.createElement('style');
  style.id = 'crouch-gameplay-v1-style';
  style.textContent = `#${MOBILE_BUTTON_ID}{border:1px solid rgba(141,244,255,.34);border-radius:10px;background:linear-gradient(145deg,rgba(8,24,42,.96),rgba(3,10,20,.97));color:#eafcff;min-height:52px;padding:9px 11px;font:inherit;text-align:center;cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none;position:relative;overflow:hidden;transition:transform .12s ease,border-color .12s ease,box-shadow .12s ease}#${MOBILE_BUTTON_ID}:before{content:"";position:absolute;inset:-35%;background:radial-gradient(circle,rgba(141,244,255,.18),transparent 62%);opacity:0;transition:opacity .12s ease}#${MOBILE_BUTTON_ID} small{display:block;margin-top:4px;font-size:8px;opacity:.58;letter-spacing:.08em;position:relative}#${MOBILE_BUTTON_ID}.is-held{border-color:#aee37f;color:#efffdc;box-shadow:0 0 18px rgba(174,227,127,.35),0 0 42px rgba(141,244,255,.12),inset 0 0 16px rgba(174,227,127,.08);transform:scale(.97)}#${MOBILE_BUTTON_ID}.is-held:before{opacity:1}@media(min-width:769px){#${MOBILE_BUTTON_ID}{display:none}}`;
  document.head.appendChild(style);

  const press = event => { event.preventDefault(); button.classList.add('is-held'); window.dispatchEvent(new CustomEvent('relay:crouch-start')); button.setPointerCapture?.(event.pointerId); };
  const release = event => { event.preventDefault(); button.classList.remove('is-held'); window.dispatchEvent(new CustomEvent('relay:crouch-end')); };
  button.addEventListener('pointerdown', press, { passive:false });
  button.addEventListener('pointerup', release, { passive:false });
  button.addEventListener('pointercancel', release, { passive:false });
  button.addEventListener('lostpointercapture', release, { passive:false });
  return button;
}

function canStand(scene, state) {
  const player = scene?.player;
  if (!player?.body || !scene?.platforms?.getChildren) return true;
  const body = player.body;
  const extraHeight = state.standingHeight - body.height;
  if (extraHeight <= 0) return true;
  const left = body.x, right = body.x + body.width;
  const top = body.y - extraHeight, bottom = body.y + body.height;
  return !scene.platforms.getChildren().some(platform => {
    if (!platform?.active || !platform.body) return false;
    const p = platform.body;
    return right > p.x && left < p.x + p.width && bottom > p.y && top < p.y + p.height;
  });
}

function startSlide(scene, state) {
  if (!scene?.player?.body || state.slideTimer > 0 || state.slideCooldown > 0 || !state.crouching || scene.finished || scene.respawning) return false;
  const body = scene.player.body;
  const grounded = Boolean(body.blocked?.down || body.touching?.down);
  if (!grounded) return false;
  const speed = Math.abs(body.velocity.x || 0);
  if (speed < 145) return false;

  state.slideTimer = 560;
  state.slideCooldown = 760;
  state.slideElapsed = 0;
  state.slideDirection = Math.sign(body.velocity.x) || (scene.player.flipX ? -1 : 1);
  state.slideSpeed = Math.max(430, Math.min(760, speed * 1.42));
  state.slideTrailTimer = 0;
  state.slideDustTimer = 0;
  scene.sliding = true;
  scene.player.setData('sliding', true);
  scene.game?.events?.emit('crouch-slide', true);
  if (!scene.motionReduced) {
    scene.cameras.main.shake(95, .0028);
    scene.leaveAfterimage?.(0xaee37f);
  }
  scene.player.rotation = state.slideDirection * -.045;
  return true;
}

function updateSlide(scene, state, delta) {
  state.slideCooldown = Math.max(0, state.slideCooldown - delta);
  if (state.slideTimer <= 0) {
    scene.sliding = false;
    scene.player?.setData('sliding', false);
    if (scene.player) scene.player.rotation = 0;
    return;
  }
  const player = scene.player;
  const body = player.body;
  if (!player.active || !body || !state.crouching || scene.respawning || scene.finished) {
    stopSlide(scene, state);
    return;
  }

  state.slideTimer -= delta;
  state.slideElapsed += delta;
  state.slideTrailTimer -= delta;
  state.slideDustTimer -= delta;

  const progress = Math.max(0, Math.min(1, state.slideElapsed / 560));
  const ease = 1 - progress;
  const speed = Math.max(260, state.slideSpeed * (0.34 + ease * 0.66));
  body.setVelocityX(state.slideDirection * speed);
  player.setScale(player.scaleX, state.originalScaleY * (0.64 + ease * 0.08));
  player.rotation = state.slideDirection * (-0.075 + progress * 0.11);

  if (!scene.motionReduced && state.slideTrailTimer <= 0) {
    state.slideTrailTimer = 70;
    scene.leaveAfterimage?.(progress < .45 ? 0xaee37f : 0x8df4ff);
  }
  if (!scene.motionReduced && state.slideDustTimer <= 0) {
    state.slideDustTimer = 55;
    const dust = scene.add.circle(player.x - state.slideDirection * 18, player.y + 22, 3 + Math.random() * 4, 0xd6dbe2, .48).setDepth(9);
    scene.tweens.add({ targets:dust, x:dust.x - state.slideDirection * (10 + Math.random() * 18), y:dust.y - (8 + Math.random() * 14), alpha:0, scale:1.8, duration:220, onComplete:() => dust.destroy() });
  }

  if (state.slideTimer <= 0) stopSlide(scene, state);
}

function stopSlide(scene, state) {
  if (!scene || !state) return;
  const wasSliding = scene.sliding || state.slideTimer > 0;
  state.slideTimer = 0;
  scene.sliding = false;
  scene.player?.setData('sliding', false);
  if (scene.player) scene.player.rotation = 0;
  if (wasSliding) scene.game?.events?.emit('crouch-slide', false);
}

function setCrouch(scene, active) {
  if (!scene?.player?.body || scene.finished || scene.respawning || scene.cinematicActive) return false;
  const state = sceneState.get(scene);
  if (!state) return false;
  const player = scene.player;
  const body = player.body;

  if (active) {
    if (state.crouching) {
      startSlide(scene, state);
      return true;
    }
    state.crouching = true;
    state.standingHeight = body.height;
    state.standingOffsetY = body.offset.y;
    state.standingDisplayHeight = player.displayHeight || 64;
    state.originalScaleY = player.scaleY || 1;
    const crouchHeight = Math.max(22, Math.round(state.standingHeight * .58));
    body.setSize(body.width, crouchHeight, false);
    body.setOffset(body.offset.x, state.standingOffsetY + state.standingHeight - crouchHeight);
    player.y += state.standingDisplayHeight * .21;
    player.setScale(player.scaleX, state.originalScaleY * .72);
    player.setData('crouching', true);
    scene.crouching = true;
    scene.game?.events?.emit('crouch', true);
    startSlide(scene, state);
    return true;
  }

  stopSlide(scene, state);
  if (!state.crouching || !canStand(scene, state)) return !state.crouching;
  state.crouching = false;
  body.setSize(body.width, state.standingHeight, false);
  body.setOffset(body.offset.x, state.standingOffsetY);
  player.y -= state.standingDisplayHeight * .21;
  player.setScale(player.scaleX, state.originalScaleY);
  player.rotation = 0;
  player.setData('crouching', false);
  scene.crouching = false;
  scene.game?.events?.emit('crouch', false);
  return true;
}

function installForScene(scene) {
  if (!scene?.player || sceneState.has(scene)) return;
  const body = scene.player.body;
  sceneState.set(scene, {
    crouching:false,
    keyDown:false,
    mobileHeld:false,
    slideTimer:0,
    slideCooldown:0,
    slideElapsed:0,
    slideDirection:1,
    slideSpeed:0,
    slideTrailTimer:0,
    slideDustTimer:0,
    standingHeight:body?.height || 48,
    standingOffsetY:body?.offset?.y || 0,
    standingDisplayHeight:scene.player.displayHeight || 64,
    originalScaleY:scene.player.scaleY || 1,
  });
  scene.crouching = false;
  scene.sliding = false;
}

function updateScene(scene, delta) {
  const state = sceneState.get(scene);
  if (!state || !scene.player?.active) return;
  const wants = state.keyDown || state.mobileHeld;
  if (wants) setCrouch(scene, true);
  else if (state.crouching) setCrouch(scene, false);
  scene.crouching = state.crouching;
  updateSlide(scene, state, delta || 16.67);
}

const originalCreate = RunnerScene.prototype.create;
const originalUpdate = RunnerScene.prototype.update;
if (!RunnerScene.prototype.__crouchGameplayV1CreatePatched) {
  RunnerScene.prototype.create = function crouchGameplayCreate(...args) {
    const result = originalCreate.apply(this,args);
    try { installForScene(this); window.__relayRunnerScene = this; } catch(error) { console.error('[Crouch] create failed',error); }
    return result;
  };
  RunnerScene.prototype.__crouchGameplayV1CreatePatched = true;
}
if (!RunnerScene.prototype.__crouchGameplayV1UpdatePatched) {
  RunnerScene.prototype.update = function crouchGameplayUpdate(time, delta, ...args) {
    const result = originalUpdate.apply(this, [time, delta, ...args]);
    try { updateScene(this, delta); } catch(error) { console.error('[Crouch] update failed',error); }
    return result;
  };
  RunnerScene.prototype.__crouchGameplayV1UpdatePatched = true;
}

document.addEventListener('keydown', event => {
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.code !== 'KeyC') return;
  const state = sceneState.get(activeScene());
  if (state) { state.keyDown = true; event.preventDefault(); }
}, true);
document.addEventListener('keyup', event => {
  if (event.code !== 'KeyC') return;
  const state = sceneState.get(activeScene());
  if (state) { state.keyDown = false; event.preventDefault(); }
}, true);
function activeScene() { return window.__relayRunnerScene || null; }
window.addEventListener('relay:crouch-start', () => { const state = sceneState.get(activeScene()); if (state) state.mobileHeld = true; });
window.addEventListener('relay:crouch-end', () => { const state = sceneState.get(activeScene()); if (state) state.mobileHeld = false; });
window.addEventListener('blur', () => { const scene = activeScene(); const state = sceneState.get(scene); if (state) { state.keyDown=false; state.mobileHeld=false; stopSlide(scene, state); } document.getElementById(MOBILE_BUTTON_ID)?.classList.remove('is-held'); });

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',installMobileButton,{once:true}); else installMobileButton();
