// UPDATE 09 — WORLD INTERACTION V1
// Stable integration API. RunnerScene lifecycle is owned by core-stability.js;
// this module only creates/updates the interaction layer and never overwrites it.
const INTERACT_DISTANCE = 150;
const stateByScene = new WeakMap();
let uiReady = false;

const distance = (a, b) => Math.hypot((a?.x || 0) - (b?.x || 0), (a?.y || 0) - (b?.y || 0));

function ensureUi() {
  if (uiReady && document.getElementById('worldInteractButton')) return document.getElementById('worldInteractButton');
  uiReady = true;
  if (!document.getElementById('world-interaction-style')) {
    const style = document.createElement('style');
    style.id = 'world-interaction-style';
    style.textContent = `
      #worldInteractButton{position:fixed;left:50%;bottom:calc(132px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:99999;display:none;min-width:164px;padding:13px 22px;border:2px solid #8df4ff;border-radius:14px;background:rgba(4,15,28,.97);box-shadow:0 0 14px rgba(141,244,255,.5),0 0 32px rgba(25,200,245,.25);color:#e9fdff;font:900 13px/1.1 ui-monospace,monospace;letter-spacing:.12em;text-align:center;text-transform:uppercase;pointer-events:auto;touch-action:manipulation}
      #worldInteractButton.is-visible{display:block;animation:relayInteractPulse 1s ease-in-out infinite alternate}
      #worldInteractButton.is-active{border-color:#aee37f;color:#efffdc;box-shadow:0 0 14px rgba(174,227,127,.55),0 0 34px rgba(174,227,127,.24)}
      #worldInteractButton small{display:block;margin-top:7px;color:#8df4ff;font-size:9px;letter-spacing:.1em}
      @keyframes relayInteractPulse{from{transform:translateX(-50%) scale(1)}to{transform:translateX(-50%) scale(1.035)}}
      @media(min-width:769px){#worldInteractButton{bottom:28px}}
      @media(prefers-reduced-motion:reduce){#worldInteractButton{animation:none}}
    `;
    document.head.appendChild(style);
  }
  let button = document.getElementById('worldInteractButton');
  if (!button) {
    button = document.createElement('button');
    button.id = 'worldInteractButton';
    button.type = 'button';
    button.innerHTML = 'INTERACT<small>E / TAP</small>';
    document.body.appendChild(button);
  }
  if (!button.dataset.bound) {
    button.dataset.bound = '1';
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      event.stopPropagation();
      const scene = window.__relayRunnerScene;
      const target = scene?.worldInteractionTarget;
      if (scene && target) activate(scene, target);
    }, { passive: false });
  }
  return button;
}

function pulse(scene, x, y, color = 0x8df4ff) {
  if (!scene?.add) return;
  const ring = scene.add.circle(x, y, 12, color, .3).setDepth(50);
  scene.tweens?.add({ targets:ring, scale:3.2, alpha:0, duration:420, onComplete:()=>ring.destroy() });
}

function addTerminal(scene, checkpoint, index) {
  // Keep the terminal anchored to an existing checkpoint so it is always in the
  // actual level and cannot float into an unrelated coordinate space.
  const terminal = scene.add.container(checkpoint.x + 54, checkpoint.y - 58).setDepth(40);
  terminal.setDataEnabled();
  terminal.setData('activated', false);
  terminal.setData('index', index);
  const body = scene.add.rectangle(0, 0, 38, 48, 0x0d1a2b, .98).setStrokeStyle(2, 0x8df4ff, 1);
  const screen = scene.add.rectangle(0, -10, 22, 12, 0x19c8f5, .45).setStrokeStyle(1, 0xdffcff, 1);
  const core = scene.add.circle(0, 9, 5, 0xffd06e, 1).setStrokeStyle(1, 0xfff0b0, 1);
  const label = scene.add.text(0, 37, `LINK ${String(index + 1).padStart(2, '0')}`, { fontFamily:'DM Mono', fontSize:'9px', fontStyle:'bold', color:'#e9fdff', stroke:'#02050d', strokeThickness:4 }).setOrigin(.5);
  terminal.add([body, screen, core, label]);
  scene.tweens?.add({ targets:core, alpha:{from:.35,to:1}, scale:{from:.85,to:1.18}, duration:600, yoyo:true, repeat:-1 });
  scene.tweens?.add({ targets:screen, alpha:{from:.25,to:.85}, duration:700, yoyo:true, repeat:-1 });
  return terminal;
}

export function setupWorldInteraction(scene) {
  if (!scene?.player || stateByScene.has(scene)) return;
  const checkpoints = scene.checkpoints?.getChildren?.() || [];
  const terminals = checkpoints.map((checkpoint, index) => addTerminal(scene, checkpoint, index));
  // Fallback: every mission has a goal even if a future mission has no checkpoints.
  if (!terminals.length && scene.goal) {
    const fallback = { x: scene.goal.x - 90, y: scene.goal.y - 42 };
    terminals.push(addTerminal(scene, fallback, 0));
  }
  stateByScene.set(scene, terminals);
  scene.worldInteractionTerminals = terminals;
  window.__relayRunnerScene = scene;
  ensureUi();
}

export function updateWorldInteraction(scene) {
  if (!scene?.player?.active) return;
  const terminals = stateByScene.get(scene);
  if (!terminals) return;
  window.__relayRunnerScene = scene;
  const button = ensureUi();
  const nearest = terminals
    .filter(t => t?.active && !t.getData('activated'))
    .filter(t => distance(scene.player, t) <= INTERACT_DISTANCE)
    .sort((a,b) => distance(scene.player,a) - distance(scene.player,b))[0] || null;
  scene.worldInteractionTarget = nearest;
  if (!nearest) {
    button.classList.remove('is-visible','is-active');
    return;
  }
  button.innerHTML = 'INTERACT<small>E / TAP</small>';
  button.classList.add('is-visible');
  button.classList.remove('is-active');
}

export function activate(scene, terminal) {
  if (!scene || !terminal?.active || terminal.getData('activated')) return false;
  terminal.setData('activated', true);
  terminal.setTint?.(0xaee37f);
  terminal.list?.forEach(child => child.setTint?.(0xaee37f));
  pulse(scene, terminal.x, terminal.y, 0xaee37f);
  const checkpoint = (scene.checkpoints?.getChildren?.() || [])
    .filter(item => item?.active)
    .sort((a,b) => distance(terminal,a) - distance(terminal,b))[0];
  if (checkpoint && typeof scene.activateCheckpoint === 'function') scene.activateCheckpoint(checkpoint);
  const barrier = (scene.barriers?.getChildren?.() || [])
    .filter(item => item?.active && distance(terminal,item) < 220)
    .sort((a,b) => distance(terminal,a) - distance(terminal,b))[0];
  if (barrier) {
    try { barrier.disableBody(true, true); } catch {}
    scene.playerCue?.('ACCESS GRANTED · ROUTE OPEN', '#aee37f');
  } else {
    scene.playerCue?.('CHECKPOINT LINKED', '#aee37f');
  }
  const button = ensureUi();
  button.classList.remove('is-visible');
  button.classList.add('is-active');
  scene.game?.events?.emit('world-interaction', { type:'terminal', index:terminal.getData('index'), activated:true });
  return true;
}

document.addEventListener('keydown', event => {
  if (event.repeat || event.key.toLowerCase() !== 'e') return;
  const scene = window.__relayRunnerScene;
  if (scene?.worldInteractionTarget && activate(scene, scene.worldInteractionTarget)) event.preventDefault();
}, true);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) document.getElementById('worldInteractButton')?.classList.remove('is-visible','is-active');
});

ensureUi();
