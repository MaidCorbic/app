// P2 UX CONTROLS V1
// Presentation-only preferences. Gameplay logic remains active when cards are hidden.
(() => {
  'use strict';
  if (window.__relayP2UxControlsV1) return;
  window.__relayP2UxControlsV1 = true;

  const KEY = 'relay.runner.ui.preferences.v1';
  const defaults = Object.freeze({ intelCards:true, allyIntel:true, eventPopups:true, tutorialHints:true });
  const load = () => {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { ...defaults }; }
  };
  const save = prefs => { try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch {} };
  const state = load();

  const injectStyle = () => {
    if (document.getElementById('relay-p2-ux-style')) return;
    const style = document.createElement('style');
    style.id = 'relay-p2-ux-style';
    style.textContent = `
      #relayP2Settings{display:grid;gap:8px;padding:10px;border:1px solid rgba(141,244,255,.14);border-radius:12px;background:rgba(3,10,20,.62)}
      #relayP2Settings .p2-setting{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:8px 9px;border:1px solid rgba(255,255,255,.06);border-radius:9px;background:rgba(255,255,255,.025)}
      #relayP2Settings .p2-copy{display:grid;gap:2px}.p2-copy b{font:900 8px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em}.p2-copy small{font-size:7px;opacity:.48;letter-spacing:.04em}
      #relayP2Settings .p2-toggle{min-width:64px;border:1px solid rgba(141,244,255,.26);border-radius:999px;padding:3px;background:#071220;color:#8da4b7;font:900 7px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;cursor:pointer}
      #relayP2Settings .p2-toggle.on{border-color:rgba(174,227,127,.55);color:#dfffc9;box-shadow:0 0 14px rgba(174,227,127,.12)}
      body.relay-hide-intel .enemy-discovery-card,body.relay-hide-intel [data-enemy-discovery],body.relay-hide-intel .enemy-intel-card{display:none!important}
      body.relay-hide-ally [data-ally-intel],body.relay-hide-ally .ally-intel-card{display:none!important}
      body.relay-hide-events .gameplay-event-card,body.relay-hide-events [data-gameplay-event]{display:none!important}
      body.relay-hide-tutorials .tutorial-card,body.relay-hide-tutorials [data-tutorial]{display:none!important}
      @media(max-width:520px){#relayP2Settings{max-height:50dvh;overflow:auto;-webkit-overflow-scrolling:touch}}
    `;
    document.head.appendChild(style);
  };

  const syncClasses = () => {
    document.body.classList.toggle('relay-hide-intel', !state.intelCards);
    document.body.classList.toggle('relay-hide-ally', !state.allyIntel);
    document.body.classList.toggle('relay-hide-events', !state.eventPopups);
    document.body.classList.toggle('relay-hide-tutorials', !state.tutorialHints);
  };

  const buildSettings = root => {
    if (!root || root.querySelector('#relayP2Settings')) return;
    const wrap = document.createElement('div');
    wrap.id = 'relayP2Settings';
    wrap.setAttribute('aria-label', 'Gameplay presentation settings');
    const items = [
      ['intelCards', 'INTEL CARDS', 'Enemy discovery cards'],
      ['allyIntel', 'ALLY INTEL', 'Side intel panels'],
      ['eventPopups', 'EVENT POPUPS', 'Transient gameplay notices'],
      ['tutorialHints', 'TUTORIAL HINTS', 'Contextual onboarding'],
    ];
    wrap.innerHTML = items.map(([key,label,description]) => `<div class="p2-setting"><div class="p2-copy"><b>${label}</b><small>${description}</small></div><button type="button" class="p2-toggle ${state[key]?'on':''}" data-p2-toggle="${key}" aria-pressed="${state[key]}">${state[key]?'ON':'OFF'}</button></div>`).join('');
    root.appendChild(wrap);
    wrap.addEventListener('click', event => {
      const button = event.target.closest('[data-p2-toggle]');
      if (!button) return;
      const key = button.dataset.p2Toggle;
      state[key] = !state[key];
      save(state); syncClasses();
      button.classList.toggle('on', state[key]);
      button.textContent = state[key] ? 'ON' : 'OFF';
      button.setAttribute('aria-pressed', String(state[key]));
    });
  };

  const mount = () => {
    injectStyle(); syncClasses();
    const pauseMenu = document.getElementById('pauseMenu');
    const panel = pauseMenu?.querySelector('#panelContent');
    if (!panel) return false;
    buildSettings(panel);
    return true;
  };

  const boot = () => {
    if (!mount()) window.setTimeout(boot, 250);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true }); else boot();
})();
