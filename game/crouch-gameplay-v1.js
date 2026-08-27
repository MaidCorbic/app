import { RunnerScene } from './src/scenes/RunnerScene.js';

// Crouch gameplay V1 — additive and isolated.
// PC: hold C. Mobile: hold the injected CROUCH button.
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
  button.innerHTML = 'CROUCH<small>C</small>';
  button.setAttribute('aria-label', 'Hold to crouch');
  actions.appendChild(button);

  const style = document.createElement('style');
  style.id = 'crouch-gameplay-v1-style';
  style.textContent = `#${MOBILE_BUTTON_ID}{border:1px solid rgba(141,244,255,.34);border-radius:10px;background:linear-gradient(145deg,rgba(8,24,42,.96),rgba(3,10,20,.97));color:#eafcff;min-height:52px;padding:9px 11px;font:inherit;text-align:center;cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none}#${MOBILE_BUTTON_ID} small{display:block;margin-top:4px;font-size:8px;opacity:.58;letter-spacing:.08em}#${MOBILE_BUTTON_ID}.is-held{border-color:#aee37f;color:#efffdc;box-shadow:0 0 18px rgba(174,227,127,.35),inset 0 0 16px rgba(174,227,127,.08);transform:scale(.97)}@media(min-width:769px){#${MOBILE_BUTTON_ID}{display:none}}`;
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

function setCrouch(scene, active) {
  if (!scene?.player?.body || scene.finished || scene.respawning || scene.cinematicActive) return false;
  const state = sceneState.get(scene);
  if (!state) return false;
  const player = scene.player;
  const body = player.body;

  if (active) {
    if (state.crouching) return true;
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
    return true;
  }

  if (!state.crouching || !canStand(scene, state)) return !state.crouching;
  state.crouching = false;
  body.setSize(body.width, state.standingHeight, false);
  body.setOffset(body.offset.x, state.standingOffsetY);
  player.y -= state.standingDisplayHeight * .21;
  player.setScale(player.scaleX, state.originalScaleY);
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
    standingHeight:body?.height || 48,
    standingOffsetY:body?.offset?.y || 0,
    standingDisplayHeight:scene.player.displayHeight || 64,
    originalScaleY:scene.player.scaleY || 1,
  });
  scene.crouching = false;
}

function updateScene(scene) {
  const state = sceneState.get(scene);
  if (!state || !scene.player?.active) return;
  const wants = state.keyDown || state.mobileHeld;
  if (wants) setCrouch(scene, true);
  else if (state.crouching) setCrouch(scene, false);
  scene.crouching = state.crouching;
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
  RunnerScene.prototype.update = function crouchGameplayUpdate(...args) {
    const result = originalUpdate.apply(this,args);
    try { updateScene(this); } catch(error) { console.error('[Crouch] update failed',error); }
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
window.addEventListener('blur', () => { const state = sceneState.get(activeScene()); if (state) { state.keyDown=false; state.mobileHeld=false; } document.getElementById(MOBILE_BUTTON_ID)?.classList.remove('is-held'); });

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',installMobileButton,{once:true}); else installMobileButton();
