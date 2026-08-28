import { RunnerScene } from './src/scenes/RunnerScene.js';

(() => {
  'use strict';
  if (window.__relayGameplayFeatureDockV1) return;
  window.__relayGameplayFeatureDockV1 = true;

  const state = new WeakMap();
  const isTouch = () => document.body.classList.contains('is-touch') || matchMedia?.('(pointer: coarse)').matches;

  const installStyle = () => {
    if (document.getElementById('relay-feature-dock-v1-style')) return;
    const style = document.createElement('style');
    style.id = 'relay-feature-dock-v1-style';
    style.textContent = `
      #relay-feature-dock-v1{position:absolute;right:16px;top:96px;z-index:275;display:flex;flex-direction:column;gap:6px;pointer-events:none}
      #relay-feature-dock-v1 .fd-card{min-width:138px;padding:8px 10px;border:1px solid rgba(141,244,255,.16);border-radius:10px;background:rgba(3,10,18,.76);backdrop-filter:blur(10px);box-shadow:0 10px 28px rgba(0,0,0,.25);color:#eafcff;font:800 8px/1.1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em}
      #relay-feature-dock-v1 .fd-title{display:flex;align-items:center;justify-content:space-between;gap:8px}
      #relay-feature-dock-v1 .fd-state{color:#aee37f;font-size:6px;letter-spacing:.14em}
      #relay-feature-dock-v1 .fd-sub{margin-top:4px;color:#7890a4;font-size:6px;letter-spacing:.06em;line-height:1.35}
      #relay-feature-dock-v1 .fd-actions{display:flex;gap:5px;margin-top:7px;pointer-events:auto}
      #relay-feature-dock-v1 button{flex:1;min-height:32px;border:1px solid rgba(141,244,255,.22);border-radius:8px;background:linear-gradient(145deg,rgba(8,23,39,.96),rgba(2,8,15,.98));color:#eafcff;font:900 7px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;touch-action:manipulation;cursor:pointer}
      #relay-feature-dock-v1 button:active{transform:scale(.96)}
      #relay-feature-dock-v1 button:hover,#relay-feature-dock-v1 button:focus-visible{border-color:#ffd06e;color:#ffd06e;outline:none}
      @media(max-width:700px){
        #relay-feature-dock-v1{right:8px;top:92px;gap:5px}
        #relay-feature-dock-v1 .fd-card{min-width:112px;padding:7px 8px;font-size:7px}
        #relay-feature-dock-v1 .fd-sub{font-size:5.8px}
        #relay-feature-dock-v1 button{min-height:30px;font-size:6.5px}
      }
      @media(max-width:430px){#relay-feature-dock-v1{top:86px}#relay-feature-dock-v1 .fd-card{min-width:98px}}
    `;
    document.head.appendChild(style);
  };

  const keydown = code => {
    window.dispatchEvent(new KeyboardEvent('keydown', {
      key: code === 'KeyG' ? 'g' : 'f',
      code,
      bubbles: true,
      cancelable: true,
    }));
  };

  const mount = play => {
    if (!play || document.getElementById('relay-feature-dock-v1')) return document.getElementById('relay-feature-dock-v1');
    installStyle();
    const root = document.createElement('aside');
    root.id = 'relay-feature-dock-v1';
    root.hidden = true;
    root.innerHTML = `
      <div class="fd-card" data-feature="flight"><div class="fd-title"><span>FLIGHT</span><b class="fd-state">READY</b></div><div class="fd-sub">VERTICAL MOBILITY · F</div><div class="fd-actions"><button type="button" data-feature-action="flight">FLY</button></div></div>
      <div class="fd-card" data-feature="grapple"><div class="fd-title"><span>GRAPPLE</span><b class="fd-state">READY</b></div><div class="fd-sub">ANCHOR TRAVERSAL · G</div><div class="fd-actions"><button type="button" data-feature-action="grapple">LINK</button></div></div>`;
    play.appendChild(root);
    root.querySelector('[data-feature-action="flight"]')?.addEventListener('pointerdown', event => {
      event.preventDefault(); event.stopPropagation(); keydown('KeyF');
    }, { passive:false });
    root.querySelector('[data-feature-action="flight"]')?.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); keydown('KeyF'); });
    root.querySelector('[data-feature-action="grapple"]')?.addEventListener('pointerdown', event => {
      event.preventDefault(); event.stopPropagation(); keydown('KeyG');
    }, { passive:false });
    root.querySelector('[data-feature-action="grapple"]')?.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); keydown('KeyG'); });
    return root;
  };

  const update = scene => {
    const play = document.getElementById('play');
    const root = mount(play);
    if (!root) return;
    const intro = document.getElementById('intro');
    const cinematic = document.getElementById('relayGameplayIntroFinalV1');
    const active = !!scene?.scene?.isActive?.() && !scene.finished && !scene.respawning && !scene.cinematicActive && !!intro?.classList.contains('hidden') && !cinematic?.hidden;
    root.hidden = !active;
    if (!active) return;

    const flightEnabled = !!scene.isFeatureEnabled?.('flight');
    const grappleEnabled = !!scene.isFeatureEnabled?.('grapple');
    root.querySelector('[data-feature="flight"]').hidden = !flightEnabled;
    root.querySelector('[data-feature="grapple"]').hidden = !grappleEnabled;
    if (flightEnabled) {
      const fs = scene.getFlightState?.();
      const label = root.querySelector('[data-feature="flight"] .fd-state');
      if (label) label.textContent = fs?.state === 'depleted' ? 'OFFLINE' : fs?.state?.toUpperCase?.() || (isTouch() ? 'TAP' : 'READY');
    }
  };

  const attach = scene => {
    if (!scene || state.has(scene)) return;
    state.set(scene, true);
    const baseCreate = RunnerScene.prototype.create;
  };

  const baseCreate = RunnerScene.prototype.create;
  const baseUpdate = RunnerScene.prototype.update;
  if (!RunnerScene.prototype.__relayFeatureDockV1Create) {
    RunnerScene.prototype.create = function featureDockCreate(...args) {
      const result = baseCreate.apply(this, args);
      attach(this);
      update(this);
      return result;
    };
    RunnerScene.prototype.__relayFeatureDockV1Create = true;
  }
  if (!RunnerScene.prototype.__relayFeatureDockV1Update) {
    RunnerScene.prototype.update = function featureDockUpdate(time, delta, ...args) {
      const result = baseUpdate.apply(this, [time, delta, ...args]);
      try { update(this); } catch (error) { console.warn('[Relay Runner] feature dock presentation skipped:', error); }
      return result;
    };
    RunnerScene.prototype.__relayFeatureDockV1Update = true;
  }
})();
