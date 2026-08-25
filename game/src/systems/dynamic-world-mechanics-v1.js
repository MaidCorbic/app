import { RunnerScene } from '../scenes/RunnerScene.js';

// UPDATE 11 — DYNAMIC WORLD MECHANICS V1
// New, isolated world mechanics. No changes to existing platforms, barriers,
// movement, weapons, upgrades, checkpoints, or mobile controls.
//
// Mechanics:
// 1) Power Switch -> opens a linked dynamic gate.
// 2) Cargo Lift -> deterministic vertical platform movement.
// 3) Destructible Prop -> lightweight reactive prop, no physics body required.
//
// The system is deliberately data-driven and uses Phaser display objects only.
// Touch and keyboard both use the same interaction path.

const INTERACT_DISTANCE = 125;
const INTERACT_COOLDOWN_MS = 260;
const DEFAULT_GATE_OPEN_MS = 900;
const LIFT_TRAVEL_MS = 1500;
const PROP_RESPAWN_MS = 0;
const sceneState = new WeakMap();

const dist = (a, b) => Math.hypot((a?.x || 0) - (b?.x || 0), (a?.y || 0) - (b?.y || 0));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function ensureUi() {
  let button = document.getElementById('dynamicWorldInteractButton');
  if (!button) {
    if (!document.getElementById('dynamic-world-mechanics-style')) {
      const style = document.createElement('style');
      style.id = 'dynamic-world-mechanics-style';
      style.textContent = `
        #dynamicWorldInteractButton{position:fixed;left:50%;bottom:calc(112px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:100001;display:none;min-width:176px;padding:11px 18px;border:1px solid rgba(141,244,255,.92);border-radius:12px;background:rgba(4,15,28,.97);box-shadow:0 0 12px rgba(141,244,255,.34),inset 0 0 14px rgba(141,244,255,.06);color:#e9fdff;font:900 12px/1.15 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.11em;text-align:center;text-transform:uppercase;pointer-events:auto;touch-action:manipulation;user-select:none;-webkit-user-select:none}
        #dynamicWorldInteractButton.is-visible{display:block}
        #dynamicWorldInteractButton.is-active{border-color:#aee37f;color:#efffdc;box-shadow:0 0 16px rgba(174,227,127,.42),inset 0 0 14px rgba(174,227,127,.08)}
        #dynamicWorldInteractButton small{display:block;margin-top:5px;color:#8df4ff;font-size:8px;letter-spacing:.08em}
        @media(min-width:769px){#dynamicWorldInteractButton{bottom:28px;min-width:156px}}
        @media(prefers-reduced-motion:reduce){#dynamicWorldInteractButton{transition:none}}
      `;
      document.head.appendChild(style);
    }
    button = document.createElement('button');
    button.id = 'dynamicWorldInteractButton';
    button.type = 'button';
    button.innerHTML = 'INTERACT<small>E / TAP</small>';
    document.body.appendChild(button);
  }
  if (!button.dataset.bound) {
    button.dataset.bound = '1';
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      event.stopPropagation();
      const scene = window.__dynamicWorldScene;
      const target = scene?.dynamicWorldTarget;
      if (scene && target) interact(scene, target);
    }, { passive:false });
  }
  return button;
}

function cue(scene, text, color = '#8df4ff') {
  scene?.playerCue?.(text, color);
}

function makeSwitch(scene, x, y, id) {
  const container = scene.add.container(x, y).setDepth(11).setSize(42, 58);
  const shadow = scene.add.ellipse(0, 26, 38, 8, 0x000000, .26);
  const body = scene.add.rectangle(0, 0, 30, 42, 0x0d1a2b, 1).setStrokeStyle(2, 0x8df4ff, .95);
  const core = scene.add.circle(0, -5, 7, 0xffd06e, 1).setStrokeStyle(1, 0xfff2bd, .9);
  const lever = scene.add.rectangle(0, 9, 3, 12, 0xd9faff, 1);
  const label = scene.add.text(0, 37, 'POWER', {fontFamily:'monospace',fontSize:'8px',fontStyle:'bold',color:'#dffcff',stroke:'#02050d',strokeThickness:3}).setOrigin(.5);
  container.add([shadow, body, core, lever, label]);
  container.setDataEnabled();
  container.setData('mechanicType','power-switch');
  container.setData('id',id);
  container.setData('activeState',false);
  container.setData('children',{body,core,lever,label});
  return container;
}

function makeGate(scene, x, y, id) {
  const container = scene.add.container(x, y).setDepth(9).setSize(76, 92);
  const shadow = scene.add.rectangle(0, 39, 74, 8, 0x000000, .24);
  const frame = scene.add.rectangle(0, 0, 68, 78, 0x0a1322, 1).setStrokeStyle(3, 0x4d6a80, .95);
  const panel = scene.add.rectangle(0, 0, 54, 66, 0x122438, 1).setStrokeStyle(1, 0x8df4ff, .28);
  const bars = [];
  for (let i = -2; i <= 2; i += 1) bars.push(scene.add.rectangle(i * 10, 0, 4, 58, 0x8df4ff, .16));
  const label = scene.add.text(0, -48, 'SECURITY GATE', {fontFamily:'monospace',fontSize:'8px',fontStyle:'bold',color:'#b9f5ff',stroke:'#02050d',strokeThickness:3}).setOrigin(.5);
  container.add([shadow, frame, panel, ...bars, label]);
  container.setDataEnabled();
  container.setData('mechanicType','dynamic-gate');
  container.setData('id',id);
  container.setData('open',false);
  container.setData('children',{frame,panel,bars,label});
  return container;
}

function makeLift(scene, x, y, id) {
  const container = scene.add.container(x, y).setDepth(8).setSize(116, 26);
  const body = scene.add.rectangle(0, 0, 104, 18, 0x101e30, 1).setStrokeStyle(2, 0x8df4ff, .9);
  const edge = scene.add.rectangle(0, -8, 88, 3, 0xaee37f, .82);
  const lightA = scene.add.circle(-38, 0, 3, 0xffd06e, .9);
  const lightB = scene.add.circle(38, 0, 3, 0xffd06e, .9);
  const label = scene.add.text(0, -18, 'CARGO LIFT', {fontFamily:'monospace',fontSize:'8px',fontStyle:'bold',color:'#dffcff',stroke:'#02050d',strokeThickness:3}).setOrigin(.5);
  container.add([body,edge,lightA,lightB,label]);
  container.setDataEnabled();
  container.setData('mechanicType','cargo-lift');
  container.setData('id',id);
  container.setData('homeY',y);
  container.setData('topY',y - 150);
  container.setData('moving',false);
  return container;
}

function makeProp(scene, x, y, id) {
  const container = scene.add.container(x, y).setDepth(10).setSize(48, 48);
  const shadow = scene.add.ellipse(0, 22, 42, 9, 0x000000, .25);
  const body = scene.add.rectangle(0, 0, 34, 34, 0x17273a, 1).setStrokeStyle(2, 0xffd06e, .88);
  const core = scene.add.rectangle(0, 0, 14, 14, 0xffd06e, .35).setStrokeStyle(1, 0xfff0b0, .8);
  container.add([shadow,body,core]);
  container.setDataEnabled();
  container.setData('mechanicType','destructible-prop');
  container.setData('id',id);
  container.setData('destroyed',false);
  container.setData('children',{body,core});
  return container;
}

function getSceneMechanicData(scene) {
  let state = sceneState.get(scene);
  if (!state) {
    state = {targets:[], lastInteractAt:0, initialized:false};
    sceneState.set(scene,state);
  }
  return state;
}

function discoverAnchor(scene) {
  // Deliberately uses existing world geometry only as a placement hint.
  // No new collision bodies are created by this system.
  const barriers = scene?.barriers?.getChildren?.() || [];
  const platforms = scene?.platforms?.getChildren?.() || [];
  const source = [...barriers, ...platforms].filter(item => item?.active);
  return source.sort((a,b)=>(a?.x || 0) - (b?.x || 0));
}

function setupMechanics(scene) {
  if (!scene?.add || !scene?.player) return;
  const state = getSceneMechanicData(scene);
  if (state.initialized) return;
  state.initialized = true;

  const anchors = discoverAnchor(scene);
  if (!anchors.length) return;

  // Place mechanics conservatively in world space, away from the initial spawn.
  const spawnX = scene.player.x || 0;
  const candidates = anchors.filter(item => Math.abs((item.x || 0) - spawnX) > 320).slice(0, 4);
  if (!candidates.length) return;

  const base = candidates[0];
  const sx = base.x + 90;
  const sy = base.y - 35;
  const power = makeSwitch(scene, sx, sy, 'power-01');
  const gate = makeGate(scene, sx + 180, sy + 15, 'gate-01');
  const liftBase = candidates[1] || base;
  const lift = makeLift(scene, liftBase.x + 140, liftBase.y - 15, 'lift-01');
  const propBase = candidates[2] || liftBase;
  const prop = makeProp(scene, propBase.x + 210, propBase.y - 30, 'prop-01');

  power.setData('linkedGate',gate);
  gate.setData('linkedSwitch',power);
  state.targets.push(power, lift, prop);
  state.gate = gate;
  state.lift = lift;
  state.prop = prop;
  scene.dynamicWorldMechanics = state.targets;
}

function openGate(scene, gate) {
  if (!gate?.active || gate.getData('open')) return false;
  gate.setData('open',true);
  const children = gate.getData('children');
  children?.frame?.setStrokeStyle?.(3,0xaee37f,.95);
  children?.panel?.setFillStyle?.(0x142d2a,1);
  scene.tweens?.add({
    targets:[children?.panel,...(children?.bars || [])].filter(Boolean),
    alpha:0,
    y:-54,
    duration:DEFAULT_GATE_OPEN_MS,
    ease:'Cubic.inOut',
    onComplete:()=>{ try { gate.setVisible(false); } catch {} }
  });
  cue(scene,'ACCESS GATE OPEN','#aee37f');
  return true;
}

function activateSwitch(scene, target) {
  if (target.getData('activeState')) return false;
  target.setData('activeState',true);
  const children = target.getData('children');
  children?.core?.setFillStyle?.(0xaee37f,1);
  children?.lever?.setRotation?.(-0.65);
  children?.body?.setStrokeStyle?.(2,0xaee37f,.95);
  const gate = target.getData('linkedGate');
  openGate(scene,gate);
  cue(scene,'POWER ROUTE ONLINE','#aee37f');
  return true;
}

function moveLift(scene, target) {
  if (!target.active || target.getData('moving')) return false;
  target.setData('moving',true);
  const homeY = target.getData('homeY');
  const topY = target.getData('topY');
  const goingUp = Math.abs(target.y - homeY) < 4;
  const destination = goingUp ? topY : homeY;
  scene.tweens?.add({
    targets:target,
    y:destination,
    duration:LIFT_TRAVEL_MS,
    ease:'Sine.inOut',
    onComplete:()=>target.setData('moving',false)
  });
  cue(scene,goingUp ? 'CARGO LIFT ASCENDING' : 'CARGO LIFT RETURNING','#8df4ff');
  return true;
}

function destroyProp(scene, target) {
  if (!target.active || target.getData('destroyed')) return false;
  target.setData('destroyed',true);
  const children = target.getData('children');
  scene.tweens?.add({
    targets:target,
    scale:.25,
    alpha:0,
    angle:target.angle + 35,
    duration:260,
    ease:'Back.in',
    onComplete:()=>{
      target.setVisible(false);
      target.setActive(false);
    }
  });
  if (children?.core) {
    scene.tweens?.add({targets:children.core,scale:2.4,alpha:0,duration:220});
  }
  cue(scene,'PROP DISABLED','#ffd06e');
  return true;
}

function interact(scene,target) {
  const state = sceneState.get(scene);
  const now = performance.now();
  if (!state || now - state.lastInteractAt < INTERACT_COOLDOWN_MS) return false;
  if (!target?.active || dist(scene.player,target) > INTERACT_DISTANCE) return false;
  state.lastInteractAt = now;

  switch (target.getData('mechanicType')) {
    case 'power-switch': return activateSwitch(scene,target);
    case 'cargo-lift': return moveLift(scene,target);
    case 'destructible-prop': return destroyProp(scene,target);
    default: return false;
  }
}

function updateInteraction(scene) {
  const state = sceneState.get(scene);
  if (!scene?.player?.active || !state) return;
  window.__dynamicWorldScene = scene;
  const button = ensureUi();
  const candidates = state.targets
    .filter(item => item?.active && item.visible !== false)
    .filter(item => {
      if (item.getData('mechanicType') === 'destructible-prop' && item.getData('destroyed')) return false;
      return dist(scene.player,item) <= INTERACT_DISTANCE;
    })
    .sort((a,b)=>dist(scene.player,a)-dist(scene.player,b));
  const nearest = candidates[0] || null;
  scene.dynamicWorldTarget = nearest;
  if (!nearest) {
    button.classList.remove('is-visible','is-active');
    return;
  }
  const type = nearest.getData('mechanicType');
  const label = type === 'power-switch' ? 'POWER' : type === 'cargo-lift' ? 'USE LIFT' : 'DISABLE';
  button.innerHTML = `${label}<small>E / TAP</small>`;
  button.classList.add('is-visible');
  button.classList.remove('is-active');
}

function teardown(scene) {
  const state = sceneState.get(scene);
  if (!state) return;
  state.targets.forEach(target => {
    try { target.destroy(true); } catch {}
  });
  sceneState.delete(scene);
  if (window.__dynamicWorldScene === scene) window.__dynamicWorldScene = null;
  document.getElementById('dynamicWorldInteractButton')?.classList.remove('is-visible','is-active');
}

const originalCreate = RunnerScene.prototype.create;
const originalUpdate = RunnerScene.prototype.update;
const originalShutdown = RunnerScene.prototype.shutdown;

if (!RunnerScene.prototype.__dynamicWorldCreatePatched) {
  RunnerScene.prototype.create = function dynamicWorldCreate(...args) {
    const result = originalCreate.apply(this,args);
    try { setupMechanics(this); } catch (error) { console.error('[DynamicWorld] setup failed',error); }
    return result;
  };
  RunnerScene.prototype.__dynamicWorldCreatePatched = true;
}
if (!RunnerScene.prototype.__dynamicWorldUpdatePatched) {
  RunnerScene.prototype.update = function dynamicWorldUpdate(...args) {
    const result = originalUpdate.apply(this,args);
    try { updateInteraction(this); } catch (error) { console.error('[DynamicWorld] update failed',error); }
    return result;
  };
  RunnerScene.prototype.__dynamicWorldUpdatePatched = true;
}
if (!RunnerScene.prototype.__dynamicWorldShutdownPatched) {
  RunnerScene.prototype.shutdown = function dynamicWorldShutdown(...args) {
    try { teardown(this); } catch (error) { console.error('[DynamicWorld] teardown failed',error); }
    return originalShutdown.apply(this,args);
  };
  RunnerScene.prototype.__dynamicWorldShutdownPatched = true;
}

document.addEventListener('keydown', event => {
  if (event.repeat || event.key.toLowerCase() !== 'e') return;
  const scene = window.__dynamicWorldScene;
  const target = scene?.dynamicWorldTarget;
  if (scene && target && interact(scene,target)) event.preventDefault();
}, true);

ensureUi();
