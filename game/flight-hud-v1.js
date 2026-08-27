(() => {
  'use strict';
  if (window.__relayFlightHudV1) return;
  window.__relayFlightHudV1 = true;

  const STYLE_ID = 'relay-flight-hud-v1-style';
  const ROOT_ID = 'relay-flight-hud-v1';
  const mobile = () => window.matchMedia?.('(pointer: coarse)').matches || Number(navigator.maxTouchPoints || 0) > 0;
  let lastPayload = { state: 'off', energyRatio: 1 };

  const installStyle = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${ROOT_ID}{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:260;display:flex;align-items:center;gap:9px;padding:7px 9px;border:1px solid rgba(141,244,255,.34);border-radius:12px;background:linear-gradient(145deg,rgba(4,14,25,.96),rgba(3,8,15,.94));box-shadow:0 10px 30px rgba(0,0,0,.36),0 0 22px rgba(141,244,255,.08);color:#e9fbff;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;pointer-events:none;backdrop-filter:blur(8px)}
      #${ROOT_ID}[data-state="off"]{opacity:.82}#${ROOT_ID}[data-state="flying"],#${ROOT_ID}[data-state="hover"]{border-color:rgba(141,244,255,.68);box-shadow:0 0 30px rgba(141,244,255,.16),0 10px 30px rgba(0,0,0,.36)}#${ROOT_ID}[data-state="gliding"]{border-color:rgba(174,227,127,.58)}#${ROOT_ID}[data-state="depleted"]{border-color:rgba(255,207,130,.62)}
      #${ROOT_ID} .fh-key{min-width:34px;height:30px;display:grid;place-items:center;border:1px solid rgba(141,244,255,.42);border-radius:7px;background:#081522;font-size:13px;font-weight:900;box-shadow:inset 0 1px rgba(255,255,255,.05)}
      #${ROOT_ID} .fh-copy{display:grid;gap:2px}.fh-title{font-size:9px;letter-spacing:.16em;font-weight:900}.fh-sub{font-size:7px;letter-spacing:.08em;opacity:.58}.fh-energy{min-width:70px}.fh-track{height:4px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden;margin-bottom:3px}.fh-fill{display:block;width:100%;height:100%;background:#8df4ff;transform:scaleX(1);transform-origin:left center;will-change:transform}.fh-value{font-size:7px;letter-spacing:.08em;opacity:.7}
      #${ROOT_ID} .fh-mobile{display:none;pointer-events:auto;width:48px;height:42px;border:1px solid rgba(141,244,255,.38);border-radius:10px;background:#071521;color:#e9fbff;font:900 18px/1 ui-monospace,SFMono-Regular,Menlo,monospace;touch-action:manipulation;user-select:none;-webkit-user-select:none}.fh-mobile:active{transform:scale(.97)}
      @media(max-width:700px){#${ROOT_ID}{left:auto;right:12px;bottom:12px;transform:none;padding:6px 7px;gap:7px}#${ROOT_ID} .fh-mobile{display:grid;place-items:center}#${ROOT_ID} .fh-energy{min-width:56px}#${ROOT_ID} .fh-copy .fh-sub{font-size:6.5px}}
      @media(prefers-reduced-motion:reduce){#${ROOT_ID} *{transition:none!important}}
    `;
    document.head.appendChild(style);
  };

  const apply = payload => {
    const next = {
      state: payload?.state || 'off',
      energyRatio: Math.max(0, Math.min(1, Number(payload?.energyRatio ?? lastPayload.energyRatio ?? 1))),
    };
    lastPayload = next;
    const root = mount();
    if (!root) return;
    root.dataset.state = next.state;
    root.querySelector('.fh-key').textContent = mobile() ? '✦' : 'F';
    root.querySelector('.fh-title').textContent = next.state === 'hover' ? 'HOVER' : next.state === 'gliding' ? 'GLIDE' : next.state === 'depleted' ? 'FLIGHT OFFLINE' : 'FLIGHT';
    root.querySelector('.fh-sub').textContent = mobile() ? 'TAP ✦ TO TOGGLE · W/S ALTITUDE · HOLD SPACE HOVER' : 'F TO TOGGLE · W/S ALTITUDE · SPACE HOVER';
    root.querySelector('.fh-fill').style.transform = `scaleX(${next.energyRatio})`;
    root.querySelector('.fh-value').textContent = `ENERGY ${Math.round(next.energyRatio * 100)}%`;
  };

  const mount = () => {
    let root = document.getElementById(ROOT_ID);
    if (root) return root;
    const play = document.getElementById('play');
    if (!play) return null;
    installStyle();
    root = document.createElement('div');
    root.id = ROOT_ID;
    root.dataset.state = 'off';
    root.innerHTML = '<div class="fh-key">F</div><div class="fh-copy"><div class="fh-title">FLIGHT</div><div class="fh-sub">F TO TOGGLE · W/S ALTITUDE · SPACE HOVER</div></div><div class="fh-energy"><div class="fh-track"><i class="fh-fill"></i></div><div class="fh-value">ENERGY 100%</div></div><button class="fh-mobile" type="button" aria-label="Toggle flight">✦</button>';
    play.appendChild(root);
    root.querySelector('.fh-mobile')?.addEventListener('pointerdown', event => {
      event.preventDefault();
      event.stopPropagation();
      window.dispatchEvent(new CustomEvent('relay:toggle-flight', { detail: { source: 'mobile' } }));
    }, { passive: false });
    return root;
  };

  window.addEventListener('relay:flight-state', event => apply(event.detail || {}));
  window.addEventListener('relay:runner-scene-ready', event => {
    const scene = event.detail?.scene;
    const state = scene?.getFlightState?.();
    if (state) apply({ state: state.state, energyRatio: Number(state.energyMax) > 0 ? state.energy / state.energyMax : 0 });
  });
  window.addEventListener('resize', () => apply(lastPayload), { passive: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true }); else mount();
})();
