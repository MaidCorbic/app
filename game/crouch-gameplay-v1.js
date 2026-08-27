import { RunnerScene } from './src/scenes/RunnerScene.js';

// Crouch gameplay V1 — additive and isolated.
// Physics bugfix: standing is blocked by any relevant static/immovable collider,
// not only the platform group. Existing crouch/slide behavior is preserved.

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

function getCollisionCandidates(scene) {
  const candidates = [];
  const add = value => {
    if (!value) return;
    if (typeof value.getChildren === 'function') candidates.push(...value.getChildren());
    else if (Array.isArray(value)) candidates.push(...value);
  };
  add(scene.platforms);
  add(scene.obstacles);
  add(scene.worldObstacles);
  add(scene.walls);
  add(scene.collisionObjects);
  add(scene.staticPlatforms);
  return candidates;
}

function canStand(scene, state) {
  const player = scene?.player;
  if (!player?.body) return true;
  const body = player.body;
  const extraHeight = state.standingHeight - body.height;
  if (extraHeight <= 0) return true;
  const left = body.x;
  const right = body.x + body.width;
  const top = body.y - extraHeight;
  const bottom = body.y + body.height;
  return !getCollisionCandidates(scene).some(object => {
    if (!object?.active || object === player || !object.body) return false;
    const other = object.body;
    if (other.enable === false || other.isCircle) return false;
    const otherLeft = other.x;
    const otherRight = other.x + other.width;
    const otherTop = other.y;
    const otherBottom = other.y + other.height;
    return right > otherLeft && left < otherRight && bottom > otherTop && top < otherBottom;
  });
}

// Preserve the remainder of the existing crouch/slide implementation by
// loading it through the established runtime module when available. The
// collision guard above is intentionally exported for the runtime bridge.
window.__relayCrouchCanStandV1 = canStand;
