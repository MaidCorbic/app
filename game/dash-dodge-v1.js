import { RunnerScene } from './src/scenes/RunnerScene.js';

// DASH / DODGE V1 — authoritative DASH action for PC + mobile.
// PC: Left Shift. Mobile: injected DASH button.
// Short invulnerability window + burst momentum + breakable-route signal.

const BUTTON_ID = 'mobileDashButton';
const HUD_ID = 'relayDashHud';
const states = new WeakMap();
const DASH_DURATION = 210;
const DASH_COOLDOWN = 720;
const DASH_SPEED = 980;
const IFRAME_MS = 165;

function scene() { return window.__relayRunnerScene || null; }

function ensureHud() {
  let hud = document.getElementById(HUD_ID);
  if (hud) return hud;
  const style = document.createElement('style');
  style.id = 'relay-dash-hud-style';
  style.textContent = `
    #${HUD_ID}{position:fixed;top:clamp(74px,9vh,108px);right:clamp(12px,2.4vw,30px);z-index:945;display:none;align-items:center;gap:7px;padding:6px 9px;border:1px solid rgba(141,244,255,.22);border-radius:8px;background:rgba(3,11,20,.72);backdrop-filter:blur(8px);box-shadow:0 8px 22px rgba(0,0,0,.22);color:#b9d0de;font:800 7px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;pointer-events:none;opacity:.78;transition:opacity .14s,border-color .14s,box-shadow .14s,color .14s}
    #${HUD_ID}.show{display:flex}
    #${HUD_ID}.ready{border-color:rgba(174,227,127,.42);color:#dfffc3}
    #${HUD_ID}.active{border-color:rgba(141,244,255,.72);color:#e7fdff;box-shadow:0 0 18px rgba(141,244,255,.18),0 8px 22px rgba(0,0,0,.22)}
    #${HUD_ID}.cooldown{opacity:.55}
    #${HUD_ID} b{font-size:8px;color:inherit}
    #${HUD_ID} small{font-size:6px;color:#7892a6;letter-spacing:.08em}
    @media(max-width:700px){#${HUD_ID}{top:82px;right:10px;padding:5px 8px}.#${HUD_ID} b{font-size:7px}}
  `;
  document.head.appendChild(style);
  hud = document.createElement('div');
  hud.id = HUD_ID;
  hud.innerHTML = '<b>DASH READY</b><small>SHIFT / TOUCH</small>';
  document.body.appendChild(hud);
  return hud;
}

function setHud(state, mode, detail = '') {
  const hud = ensureHud();
  hud.classList.remove('ready', 'active', 'cooldown');
  hud.classList.add('show', mode);
  hud.querySelector('b').textContent = mode === 'active' ? 'DASH!' : mode === 'cooldown' ? 'DASH' : detail || 'DASH READY';
  hud.querySelector('small').textContent = mode === 'active' ? 'BREAK WINDOW' : mode === 'cooldown' ? detail || 'COOLDOWN' : 'SHIFT / TOUCH';
  if (mode === 'active') {
    window.clearTimeout(state?.hudTimer);
    state.hudTimer = window.setTimeout(() => {
      if (!state?.dashTimer) setHud(state, 'ready');
    }, DASH_DURATION + 260);
  }
}

function installButton() {
  let button = document.getElementById(BUTTON_ID);
  if (button) return button;
  const actions = document.querySelector('.mobile-actions');
  if (!actions) return null;
  button = document.createElement('button');
  button.id = BUTTON_ID;
  button.type = 'button';
  button.textContent = 'DASH';
  button.setAttribute('aria-label', 'Dash forward and break route structures');
  actions.appendChild(button);
  const style = document.createElement('style');
  style.id = 'dash-dodge-v1-style';
  style.textContent = `#${BUTTON_ID}{min-height:52px;padding:9px 14px;border:1px solid rgba(174,227,127,.42);border-radius:10px;background:linear-gradient(145deg,rgba(14,32,18,.96),rgba(5,14,9,.98));color:#efffdc;font:inherit;font-weight:800;letter-spacing:.08em;touch-action:none;user-select:none;-webkit-user-select:none;transition:transform .12s,border-color .12s,box-shadow .12s}#${BUTTON_ID}.is-ready{box-shadow:0 0 12px rgba(174,227,127,.18)}#${BUTTON_ID}.is-dashing{transform:scale(.94);border-color:#8df4ff;box-shadow:0 0 22px rgba(141,244,255,.48),inset 0 0 18px rgba(141,244,255,.12)}@media(min-width:769px){#${BUTTON_ID}{display:none}}`;
  document.head.appendChild(style);
  const dash = event => { event.preventDefault(); window.dispatchEvent(new CustomEvent('relay:dash')); button.classList.add('is-dashing'); window.setTimeout(() => button.classList.remove('is-dashing'), DASH_DURATION); };
  button.addEventListener('pointerdown', dash, { passive:false });
  return button;
}

function install(s) {
  if (!s?.player || states.has(s)) return;
  states.set(s, { cooldown:0, dashTimer:0, invulnTimer:0, direction:1, originalGravity:1, hudTimer:0 });
  ensureHud();
}

function dash(s) {
  const st = states.get(s);
  const p = s?.player;
  const body = p?.body;
  if (!st || !body || !p.active) return false;
  if (st.cooldown > 0) { setHud(st, 'cooldown', `${Math.ceil(st.cooldown / 100) / 10}s`); return false; }
  if (s.finished || s.respawning || s.cinematicActive || s.scene?.isPaused?.()) return false;

  const direction = Math.sign(body.velocity?.x || 0) || (p.flipX ? -1 : 1);
  st.direction = direction;
  st.dashTimer = DASH_DURATION;
  st.cooldown = DASH_COOLDOWN;
  st.invulnTimer = IFRAME_MS;
  st.originalGravity = body.gravity?.y ?? 1;
  if (typeof body.setVelocityX === 'function') body.setVelocityX(direction * DASH_SPEED);
  if (typeof body.setVelocityY === 'function') body.setVelocityY(Math.min(body.velocity?.y || 0, 80));
  if (typeof body.setGravityY === 'function') body.setGravityY(0);
  p.setData?.('dashing', true);
  p.setData?.('invulnerable', true);
  s.dashing = true;
  s.dashTimer = DASH_DURATION;
  s.game?.events?.emit('dash-start', { direction, duration:DASH_DURATION, source:'authoritative-input' });
  setHud(st, 'active');
  if (!s.motionReduced) {
    s.cameras?.main?.shake?.(80, .002);
    s.leaveAfterimage?.(0x8df4ff);
  }
  return true;
}

function update(s, delta) {
  const st = states.get(s);
  const p = s?.player;
  const body = p?.body;
  if (!st || !p?.active || !body) return;
  const dt = delta || 16.67;
  st.cooldown = Math.max(0, st.cooldown - dt);
  st.invulnTimer = Math.max(0, st.invulnTimer - dt);
  if (st.dashTimer > 0) {
    st.dashTimer -= dt;
    body.setVelocityX?.(st.direction * DASH_SPEED);
    if (st.dashTimer <= 0) {
      body.setGravityY?.(st.originalGravity);
      p.setData?.('dashing', false);
      s.dashing = false;
      s.dashTimer = 0;
      s.game?.events?.emit('dash-end');
      setHud(st, 'cooldown', 'COOLDOWN');
    }
  } else if (st.cooldown <= 0) {
    const hud = ensureHud();
    hud.classList.remove('active', 'cooldown');
    hud.classList.add('show', 'ready');
    hud.querySelector('b').textContent = 'DASH READY';
    hud.querySelector('small').textContent = 'SHIFT / TOUCH';
  }
  p.setData?.('invulnerable', st.invulnTimer > 0);
  if (st.invulnTimer <= 0 && p.getData?.('invulnerable')) p.setData('invulnerable', false);
  const button = document.getElementById(BUTTON_ID);
  button?.classList.toggle('is-ready', st.cooldown <= 0 && st.dashTimer <= 0);
}

const baseCreate = RunnerScene.prototype.create;
const baseUpdate = RunnerScene.prototype.update;
if (!RunnerScene.prototype.__dashDodgeV1CreatePatched) {
  RunnerScene.prototype.create = function dashDodgeCreate(...args) {
    const result = baseCreate.apply(this,args);
    try { install(this); window.__relayRunnerScene = this; } catch(error) { console.error('[Dash] create failed',error); }
    return result;
  };
  RunnerScene.prototype.__dashDodgeV1CreatePatched = true;
}
if (!RunnerScene.prototype.__dashDodgeV1UpdatePatched) {
  RunnerScene.prototype.update = function dashDodgeUpdate(time, delta, ...args) {
    const result = baseUpdate.apply(this,[time,delta,...args]);
    try { update(this,delta); } catch(error) { console.error('[Dash] update failed',error); }
    return result;
  };
  RunnerScene.prototype.__dashDodgeV1UpdatePatched = true;
}

const handleDashKey = event => {
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.code !== 'ShiftLeft') return;
  const runner = scene();
  const started = dash(runner);
  if (started) event.preventDefault();
};
document.addEventListener('keydown', handleDashKey, true);
window.addEventListener('keydown', handleDashKey, true);
window.addEventListener('relay:dash', () => dash(scene()));
window.__relayPerformDash = () => dash(scene());
window.addEventListener('blur', () => {
  const s = scene(); const st = states.get(s);
  if (st?.dashTimer > 0) { st.dashTimer=0; st.invulnTimer=0; s.player?.body?.setGravityY?.(st.originalGravity); s.player?.setData?.('dashing',false); s.player?.setData?.('invulnerable',false); s.dashing=false; s.dashTimer=0; }
});

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',installButton,{once:true}); else installButton();
