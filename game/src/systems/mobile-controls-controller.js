const ACTION_LABELS = Object.freeze({
  jump: 'JUMP — SPACE',
  fire: 'FIRE — E',
  sword: 'SWORD — Q',
  dash: 'DASH — SHIFT',
  build1: 'BUILD — 1',
  build2: 'BUILD — 2',
  gadget1: 'GEAR — 3',
  gadget2: 'GEAR — 4',
});

const OWNER = 'controller-v3';
const isTouchDevice = () => navigator.maxTouchPoints > 0
  || 'ontouchstart' in window
  || matchMedia('(pointer: coarse)').matches
  || matchMedia('(hover: none)').matches
  || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');

const getScene = () => window.__relayRunnerScene
  || window.game?.scene?.getScene?.('runner')
  || window.game?.scene?.getScenes?.(true)?.find?.(scene => scene?.scene?.key === 'runner');

const getActiveScene = () => {
  const scene = getScene();
  return scene?.scene?.isActive?.() === false ? null : scene;
};

const emitGameplay = (name, detail = {}) => {
  try {
    const scene = getActiveScene();
    const payload = { ...detail, source: detail.source || 'mobile-controller-v3' };
    scene?.game?.events?.emit?.(name, payload);
    scene?.events?.emit?.(name, payload);
  } catch {}
};

const directAction = action => {
  const scene = getActiveScene();
  if (!scene || scene.cinematicActive || scene.finished || scene.respawning) return false;

  let handled = false;
  try {
    if (typeof scene.mobileActionHandler === 'function') {
      scene.mobileActionHandler(action);
      handled = true;
    }
  } catch {}

  try {
    if (!scene.mobileActions) scene.mobileActions = {};
    scene.mobileActions[action] = true;
    handled = true;
  } catch {}

  emitGameplay('mobile-action', { action });
  return handled;
};

const directMove = direction => {
  const scene = getActiveScene();
  if (!scene || scene.cinematicActive || scene.finished || scene.respawning) return false;

  try {
    if (typeof scene.mobileMoveHandler === 'function') {
      scene.mobileMoveHandler(direction);
      return true;
    }
  } catch {}

  try {
    scene.mobileDirection = direction || null;
    emitGameplay('mobile-move', { direction });
    return true;
  } catch {
    return false;
  }
};

function installStyle() {
  if (document.getElementById('relay-mobile-controls-controller-style')) return;
  const style = document.createElement('style');
  style.id = 'relay-mobile-controls-controller-style';
  style.textContent = `
    body.is-touch #play .mobile-controls,
    body.is-touch .mobile-controls {
      position: fixed!important;
      left: max(8px, env(safe-area-inset-left, 0px) + 7px)!important;
      right: max(8px, env(safe-area-inset-right, 0px) + 7px)!important;
      bottom: max(10px, env(safe-area-inset-bottom, 0px) + 9px)!important;
      display: flex!important;
      align-items: flex-end!important;
      justify-content: space-between!important;
      gap: 12px!important;
      width: auto!important;
      min-height: 78px!important;
      visibility: visible!important;
      opacity: 1!important;
      pointer-events: none!important;
      touch-action: none!important;
      z-index: 2147483001!important;
      user-select: none!important;
      -webkit-user-select: none!important;
    }
    body.is-touch .relay-mobile-dpad{position:relative!important;display:grid!important;grid-template-columns:repeat(3,48px)!important;grid-template-rows:repeat(3,48px)!important;width:144px!important;height:144px!important;pointer-events:auto!important;touch-action:none!important}
    body.is-touch .relay-mobile-dpad button,body.is-touch .relay-mobile-dpad .relay-dpad-center{box-sizing:border-box!important;width:48px!important;height:48px!important;margin:0!important;padding:0!important;border-radius:12px!important}
    body.is-touch .relay-mobile-dpad button{border:1px solid rgba(141,244,255,.55)!important;background:linear-gradient(145deg,rgba(5,20,35,.96),rgba(4,10,19,.98))!important;color:#dffcff!important;font:900 22px/1 ui-monospace,monospace!important;box-shadow:0 0 16px rgba(25,200,245,.12),inset 0 0 12px rgba(141,244,255,.04)!important;pointer-events:auto!important;touch-action:none!important;-webkit-tap-highlight-color:transparent!important}
    body.is-touch .relay-mobile-dpad button.is-active{transform:scale(.94)!important;border-color:#8df4ff!important;background:linear-gradient(145deg,rgba(15,65,86,.98),rgba(5,22,35,.98))!important;box-shadow:0 0 22px rgba(141,244,255,.42),inset 0 0 16px rgba(141,244,255,.12)!important}
    body.is-touch .relay-mobile-dpad [data-mobile-direction=up]{grid-column:2;grid-row:1}
    body.is-touch .relay-mobile-dpad [data-mobile-direction=left]{grid-column:1;grid-row:2}
    body.is-touch .relay-mobile-dpad [data-mobile-direction=right]{grid-column:3;grid-row:2}
    body.is-touch .relay-mobile-dpad [data-mobile-direction=down]{grid-column:2;grid-row:3}
    body.is-touch .relay-mobile-dpad .relay-dpad-center{grid-column:2;grid-row:2;background:radial-gradient(circle,rgba(141,244,255,.10),rgba(3,12,22,.98))!important;border:1px solid rgba(141,244,255,.20)!important;pointer-events:none}
    body.is-touch .mobile-actions{display:grid!important;grid-template-columns:repeat(3,52px)!important;grid-auto-rows:52px!important;gap:7px!important;align-items:end!important;justify-content:end!important;pointer-events:auto!important;touch-action:none!important}
    body.is-touch .mobile-actions [data-mobile-action]{width:52px!important;height:52px!important;border-radius:14px!important;pointer-events:auto!important;touch-action:none!important;-webkit-tap-highlight-color:transparent!important}
    body.is-touch .mobile-actions [data-mobile-action=dash]{border-color:rgba(141,244,255,.9)!important;box-shadow:0 0 18px rgba(25,200,245,.30),inset 0 0 12px rgba(141,244,255,.06)!important}
    @media(max-width:430px){body.is-touch #play .mobile-controls,body.is-touch .mobile-controls{bottom:max(8px,env(safe-area-inset-bottom,0px)+7px)!important;gap:5px!important}body.is-touch .relay-mobile-dpad{transform:scale(.84);transform-origin:bottom left}body.is-touch .mobile-actions{grid-template-columns:repeat(3,44px)!important;grid-auto-rows:44px!important;gap:5px!important}body.is-touch .mobile-actions [data-mobile-action]{width:44px!important;height:44px!important;font-size:8px!important}}
    body.is-touch.relay-cinematic-active .mobile-controls{display:none!important;visibility:hidden!important;pointer-events:none!important}
    #relayMobileSettings{position:fixed!important;right:max(10px,env(safe-area-inset-right,0px)+10px)!important;bottom:max(12px,env(safe-area-inset-bottom,0px)+12px)!important;z-index:2147483002!important;display:none!important;min-height:42px!important;padding:0 13px!important;border:1px solid rgba(141,244,255,.42)!important;border-radius:12px!important;background:linear-gradient(145deg,rgba(6,22,38,.96),rgba(3,10,18,.98))!important;color:#dffcff!important;font:900 9px/1 ui-monospace,monospace!important;letter-spacing:.08em!important;box-shadow:0 0 20px rgba(25,200,245,.12)!important}
    body.is-touch #relayMobileSettings{display:block!important}
    @media(max-width:430px){#relayMobileSettings{min-height:38px!important;padding:0 10px!important;font-size:8px!important}}
  `;
  document.head.appendChild(style);
}

function ensureDpad(root) {
  let dpad = root.querySelector('.relay-mobile-dpad');
  if (!dpad) {
    dpad = document.createElement('div');
    dpad.className = 'relay-mobile-dpad';
    dpad.setAttribute('aria-label', 'Movement controls');
    dpad.innerHTML = `<button type="button" data-mobile-direction="up" aria-label="Jump">▲</button><button type="button" data-mobile-direction="left" aria-label="Move left">◀</button><span class="relay-dpad-center" aria-hidden="true"></span><button type="button" data-mobile-direction="right" aria-label="Move right">▶</button><button type="button" data-mobile-direction="down" aria-label="Move down / slide">▼</button>`;
    const joystick = root.querySelector('[data-mobile-joystick]');
    if (joystick) joystick.replaceWith(dpad); else root.insertBefore(dpad, root.firstChild);
  }
  return dpad;
}

function ensureActions(root) {
  let actions = root.querySelector('.mobile-actions');
  if (!actions) { actions = document.createElement('div'); actions.className = 'mobile-actions'; root.appendChild(actions); }
  [['jump','▲'],['dash','DASH'],['fire','FIRE'],['sword','BLADE'],['build1','BUILD 1'],['gadget1','GEAR 3']].forEach(([action,label]) => {
    if (actions.querySelector(`[data-mobile-action="${action}"]`)) return;
    const button = document.createElement('button');
    button.type = 'button'; button.dataset.mobileAction = action; button.textContent = label;
    button.setAttribute('aria-label', ACTION_LABELS[action] || action);
    actions.appendChild(button);
  });
  return actions;
}

function bindControls(root) {
  if (!root || root.dataset.mobileControlsOwner === OWNER) return;
  root.dataset.mobileControlsOwner = OWNER;
  root.dataset.mobileControlsBound = '1';
  ensureDpad(root);
  ensureActions(root);

  const releaseAction = (button, event) => {
    event?.preventDefault?.(); event?.stopImmediatePropagation?.(); button.classList.remove('is-active');
  };
  const releaseDirection = (button, event) => {
    event?.preventDefault?.(); event?.stopImmediatePropagation?.();
    const direction = button.dataset.mobileDirection;
    button.classList.remove('is-active');
    if (direction === 'left' || direction === 'right') directMove(null);
  };

  document.addEventListener('pointerdown', event => {
    const actionButton = event.target?.closest?.('[data-mobile-action]');
    const directionButton = event.target?.closest?.('[data-mobile-direction]');
    const target = actionButton || directionButton;
    if (!target || !root.contains(target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (document.body.classList.contains('relay-cinematic-active')) return;
    if (actionButton) {
      directAction(actionButton.dataset.mobileAction);
      actionButton.classList.add('is-active');
    } else {
      directionButton.classList.add('is-active');
      const direction = directionButton.dataset.mobileDirection;
      if (direction === 'left') directMove('left');
      else if (direction === 'right') directMove('right');
      else if (direction === 'up') directAction('jump');
      else if (direction === 'down') directAction('slide');
    }
  }, { capture: true, passive: false });

  const release = event => {
    const actionButton = event.target?.closest?.('[data-mobile-action]');
    const directionButton = event.target?.closest?.('[data-mobile-direction]');
    const target = actionButton || directionButton;
    if (!target || !root.contains(target)) return;
    if (actionButton) releaseAction(actionButton, event); else releaseDirection(directionButton, event);
  };
  document.addEventListener('pointerup', release, { capture: true, passive: false });
  document.addEventListener('pointercancel', release, { capture: true, passive: false });
}

function ensureControls() {
  if (!isTouchDevice()) return;
  document.body.classList.add('is-touch');
  let root = document.querySelector('#play .mobile-controls, .mobile-controls');
  if (!root) {
    const parent = document.getElementById('play') || document.getElementById('game') || document.body;
    root = document.createElement('div'); root.className = 'mobile-controls'; root.id = 'relayMobileControls'; parent.appendChild(root);
  }
  bindControls(root);
}

function findPauseButton() { return document.getElementById('pauseBtn') || document.getElementById('pause') || document.querySelector('[data-action="pause"],[data-pause-button]'); }
function findSettingsTab() { return document.querySelector('#pauseMenu [data-tab="settings"],#pauseMenu [data-section="settings"],#pauseMenu [data-settings-tab]'); }
function openMobileSettings() {
  const pause = document.getElementById('pauseMenu'); const pauseButton = findPauseButton();
  if (!pause || document.body.classList.contains('relay-cinematic-active')) return false;
  const open = () => { const tab = findSettingsTab(); if (tab && !tab.disabled) { tab.click(); return true; } return false; };
  const isOpen = !pause.classList.contains('hidden') && !pause.hidden && pause.getAttribute('aria-hidden') !== 'true';
  if (!isOpen && pauseButton) pauseButton.click();
  if (open()) return true;
  requestAnimationFrame(() => { if (!open()) setTimeout(open, 80); });
  return true;
}
function ensureSettingsButton() {
  if (!isTouchDevice() || document.getElementById('relayMobileSettings')) return;
  const game = document.getElementById('game'); if (!game) return;
  const button = document.createElement('button'); button.id = 'relayMobileSettings'; button.type = 'button'; button.setAttribute('aria-label', 'Open mobile settings'); button.textContent = 'SETTINGS';
  button.addEventListener('pointerdown', event => { event.preventDefault(); event.stopPropagation(); openMobileSettings(); }, { passive: false });
  game.appendChild(button);
}
function install() { if (!isTouchDevice()) return; installStyle(); ensureControls(); ensureSettingsButton(); }
function observe() {
  install();
  if (window.__relayMobileControlsObserverV3) return;
  window.__relayMobileControlsObserverV3 = new MutationObserver(() => install());
  window.__relayMobileControlsObserverV3.observe(document.body, { childList: true, subtree: true });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observe, { once: true }); else observe();
