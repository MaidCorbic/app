import { RunnerScene } from './src/scenes/RunnerScene.js';

(() => {
  'use strict';
  if (window.__relayGameplayFeatureDockV2) return;
  window.__relayGameplayFeatureDockV2 = true;

  const state = new WeakSet();
  const isTouch = () => document.body.classList.contains('is-touch') || window.matchMedia?.('(pointer: coarse)').matches === true;

  const installStyle = () => {
    if (document.getElementById('relay-feature-dock-v2-style')) return;
    const style = document.createElement('style');
    style.id = 'relay-feature-dock-v2-style';
    style.textContent = `
      #relay-feature-dock-v1{position:absolute;right:16px;top:96px;z-index:275;display:grid;grid-template-columns:repeat(2,minmax(0,150px));gap:7px;pointer-events:none}
      #relay-feature-dock-v1 .fd-card{min-width:0;padding:8px 10px;border:1px solid rgba(141,244,255,.16);border-radius:10px;background:rgba(3,10,18,.76);backdrop-filter:blur(10px);box-shadow:0 10px 28px rgba(0,0,0,.25);color:#eafcff;font:800 8px/1.1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em}
      #relay-feature-dock-v1 .fd-title{display:flex;align-items:center;justify-content:space-between;gap:8px}.fd-state{color:#aee37f;font-size:6px;letter-spacing:.14em}.fd-sub{margin-top:4px;color:#7890a4;font-size:6px;letter-spacing:.06em;line-height:1.35}
      #relay-feature-dock-v1 .fd-actions{display:flex;gap:5px;margin-top:7px;pointer-events:auto}#relay-feature-dock-v1 button{flex:1;min-height:30px;border:1px solid rgba(141,244,255,.22);border-radius:8px;background:linear-gradient(145deg,rgba(8,23,39,.96),rgba(2,8,15,.98));color:#eafcff;font:900 7px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;touch-action:manipulation;cursor:pointer}
      #relay-feature-dock-v1 button:hover,#relay-feature-dock-v1 button:focus-visible{border-color:#ffd06e;color:#ffd06e;outline:none}#relay-feature-dock-v1 button:active{transform:scale(.96)}
      @media(max-width:700px){#relay-feature-dock-v1{right:8px;top:84px;grid-template-columns:repeat(2,minmax(0,1fr));width:min(238px,calc(100vw - 16px));gap:5px}#relay-feature-dock-v1 .fd-card{padding:7px 8px}.fd-sub{font-size:5.5px}.fd-actions{margin-top:6px}.fd-actions button{min-height:29px;font-size:6.2px}}
      @media(max-width:430px){#relay-feature-dock-v1{top:78px;width:min(214px,calc(100vw - 14px))}#relay-feature-dock-v1 .fd-card{padding:6px 7px}.fd-title{font-size:6.5px}.fd-state{font-size:5px}.fd-sub{font-size:5px}}
    `;
    document.head.appendChild(style);
  };

  const synthKey = code => {
    const key = code === 'KeyG' ? 'g' : 'f';
    const event = new KeyboardEvent('keydown', {key, code, bubbles:true, cancelable:true});
    window.dispatchEvent(event);
  };

  const mount = play => {
    if (!play) return null;
    let root = document.getElementById('relay-feature-dock-v1');
    if (root) return root;
    installStyle();
    root = document.createElement('aside');
    root.id = 'relay-feature-dock-v1';
    root.hidden = true;
    root.innerHTML = `<div class="fd-card" data-feature="flight"><div class="fd-title"><span>FLIGHT</span><b class="fd-state">READY</b></div><div class="fd-sub">VERTICAL MOBILITY · F</div><div class="fd-actions"><button type="button" data-feature-action="flight">FLY</button></div></div><div class="fd-card" data-feature="grapple"><div class="fd-title"><span>GRAPPLE</span><b class="fd-state">READY</b></div><div class="fd-sub">ANCHOR TRAVERSAL · G</div><div class="fd-actions"><button type="button" data-feature-action="grapple">LINK</button></div></div>`;
    play.appendChild(root);
    root.addEventListener('pointerdown', event => {
      const button = event.target.closest?.('[data-feature-action]');
      if (!button) return;
      event.preventDefault(); event.stopPropagation();
      synthKey(button.dataset.featureAction === 'grapple' ? 'KeyG' : 'KeyF');
    }, {capture:true, passive:false});
    return root;
  };

  const update = scene => {
    const play = document.getElementById('play');
    const root = mount(play);
    if (!root) return;
    const intro = document.getElementById('intro');
    const cinematic = document.getElementById('relayGameplayIntroFinalV1');
    const active = !!scene?.scene?.isActive?.() && !scene.finished && !scene.respawning && !scene.cinematicActive && !!intro?.classList.contains('hidden') && (!cinematic || cinematic.hidden);
    root.hidden = !active;
    if (!active) return;

    const flightEnabled = !!scene.isFeatureEnabled?.('flight');
    const grappleEnabled = !!scene.isFeatureEnabled?.('grapple');
    const flight = root.querySelector('[data-feature="flight"]');
    const grapple = root.querySelector('[data-feature="grapple"]');
    if (flight) flight.hidden = !flightEnabled;
    if (grapple) grapple.hidden = !grappleEnabled;
    if (flightEnabled) {
      const fs = scene.getFlightState?.();
      const label = flight?.querySelector('.fd-state');
      if (label) label.textContent = fs?.state === 'depleted' ? 'OFFLINE' : fs?.state?.toUpperCase?.() || 'READY';
    }
  };

  const baseCreate = RunnerScene.prototype.create;
  const baseUpdate = RunnerScene.prototype.update;
  if (!RunnerScene.prototype.__relayFeatureDockV2Create) {
    RunnerScene.prototype.create = function featureDockCreate(...args) {
      const result = baseCreate.apply(this, args);
      state.add(this); update(this); return result;
    };
    RunnerScene.prototype.__relayFeatureDockV2Create = true;
  }
  if (!RunnerScene.prototype.__relayFeatureDockV2Update) {
    RunnerScene.prototype.update = function featureDockUpdate(time, delta, ...args) {
      const result = baseUpdate.apply(this, [time, delta, ...args]);
      try { update(this); } catch (error) { console.warn('[Relay Runner] feature dock skipped:', error); }
      return result;
    };
    RunnerScene.prototype.__relayFeatureDockV2Update = true;
  }
})();
