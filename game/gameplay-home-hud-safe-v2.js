/* Relay Home + Gameplay Presentation Fix V2
 * UI-only hardening. Gameplay state, mission logic and input mapping remain authoritative elsewhere.
 */
(() => {
  'use strict';
  const STYLE_ID = 'relay-home-hud-safe-v2-style';
  const POLL_MS = 300;
  let timer = 0;

  const byId = id => document.getElementById(id);
  const query = (selector, root = document) => root.querySelector(selector);
  const all = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const clickNative = node => {
    if (!(node instanceof HTMLElement)) return false;
    try { HTMLElement.prototype.click.call(node); return true; } catch { return false; }
  };

  const installStyles = () => {
    if (byId(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #intro .info-launcher,
      #intro .home-v3-side,
      #intro .relay-home-nav-card,
      #intro .relay-v4-home-btn,
      #intro .relay-safe-home-duplicate{
        display:none!important;visibility:hidden!important;pointer-events:none!important;
      }
      #intro .title-secondary{
        display:flex!important;flex-direction:column!important;align-items:stretch!important;justify-content:flex-start!important;
        gap:9px!important;width:min(420px,100%)!important;min-height:0!important;opacity:1!important;visibility:visible!important;
        position:relative!important;z-index:1000!important;pointer-events:auto!important;overflow:visible!important;
      }
      #intro .title-secondary > button{
        display:flex!important;align-items:center!important;justify-content:space-between!important;visibility:visible!important;opacity:1!important;
        position:relative!important;z-index:1001!important;width:100%!important;min-height:54px!important;height:auto!important;
        margin:0!important;padding:12px 14px!important;box-sizing:border-box!important;pointer-events:auto!important;cursor:pointer!important;
        touch-action:manipulation!important;user-select:none!important;border:1px solid rgba(255,208,110,.28)!important;
        border-left:2px solid rgba(255,208,110,.72)!important;border-radius:10px!important;
        background:linear-gradient(145deg,rgba(7,10,15,.98),rgba(2,3,5,.995))!important;color:#f4f7fa!important;
        box-shadow:inset 0 1px rgba(255,255,255,.05),0 12px 28px rgba(0,0,0,.28),0 0 24px rgba(255,208,110,.055)!important;transform:none!important;
      }
      #intro .title-secondary > button:hover,#intro .title-secondary > button:focus-visible{
        border-color:rgba(255,208,110,.7)!important;box-shadow:inset 0 1px rgba(255,255,255,.08),0 16px 32px rgba(0,0,0,.33),0 0 30px rgba(255,208,110,.12)!important;
        transform:translateY(-1px)!important;outline:none!important;
      }
      #intro .title-secondary > button:active{transform:translateY(0) scale(.99)!important}
      #intro .title-secondary > button span{display:block!important;color:#f4f7fa!important;font:950 10px/1 'DM Mono',ui-monospace,monospace!important;letter-spacing:1.3px!important;white-space:nowrap!important}
      #intro .title-secondary > button small{display:block!important;margin:0!important;color:#8b96a2!important;font:750 7px/1.25 'DM Mono',ui-monospace,monospace!important;letter-spacing:.85px!important;text-align:right!important;white-space:nowrap!important}
      #intro .title-secondary > [data-title-panel="controls"]{border-left-color:#ffe7a6!important}
      #intro .title-secondary > [data-safe-home="faq"]{border-left-color:#fff0b5!important}
      #intro .title-secondary > [data-safe-home="update"]{border-left-color:#ffd06e!important}
      #intro .title-secondary > #exitTitle{border-left-color:#b47a1e!important}

      #game #play .hud{
        background:transparent!important;border:0!important;outline:0!important;box-shadow:none!important;filter:none!important;
        backdrop-filter:none!important;-webkit-backdrop-filter:none!important;padding:0!important;margin:0!important;
      }
      #game #play .hud::before,#game #play .hud::after{display:none!important;content:none!important}
      #game #play .hud > *{filter:none!important}
      #game #play .hud-route,#game #play .hud-progress,#game #play .hud-xp,#game #play #pause{
        background:linear-gradient(145deg,rgba(7,10,15,.96),rgba(2,3,5,.985))!important;
        border-color:rgba(255,208,110,.26)!important;
        box-shadow:inset 0 1px rgba(255,255,255,.05),0 12px 28px rgba(0,0,0,.25),0 0 24px rgba(255,208,110,.045)!important;
      }
      #game #play .hud-route small,#game #play .hud-progress > small{color:#ffd06e!important}
      #game #play .hud-progress > div{background:rgba(255,255,255,.045)!important;border-color:rgba(255,208,110,.16)!important}
      #game #play .hud-progress i{background:linear-gradient(90deg,#b47a1e,#ffd06e,#fff0b5)!important;box-shadow:0 0 12px rgba(255,208,110,.3)!important}

      #game .world-marker{
        position:absolute!important;left:18px!important;top:76px!important;right:auto!important;bottom:auto!important;transform:none!important;
        width:min(286px,28vw)!important;max-width:286px!important;min-height:44px!important;padding:8px 11px!important;box-sizing:border-box!important;
        z-index:285!important;pointer-events:none!important;border:1px solid rgba(255,208,110,.26)!important;border-left:2px solid #ffd06e!important;
        border-radius:10px!important;background:linear-gradient(145deg,rgba(7,10,15,.96),rgba(2,3,5,.94))!important;
        box-shadow:inset 0 1px rgba(255,255,255,.05),0 14px 30px rgba(0,0,0,.26),0 0 24px rgba(255,208,110,.045)!important;
      }
      #game .relay-gameplay-intel,#game #relayGameplayIntel,#game [data-relay-mission-intelligence],#game [data-mission-intelligence],
      #game .relay-debug-hud,#game [data-relay-debug-hud],#game [data-debug-hud],#game [class*="dynamic-crowd" i],#game [id*="dynamic-crowd" i]{
        display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;
      }
      @media(max-width:900px){#intro .title-secondary{gap:8px!important}#game .world-marker{left:10px!important;top:67px!important;width:min(250px,44vw)!important}}
      @media(max-width:760px){#intro .title-secondary > button{min-height:50px!important;padding:11px 12px!important}#game .world-marker{left:8px!important;top:58px!important;width:min(218px,49vw)!important}}
      @media(max-width:520px){#game .world-marker{left:8px!important;top:54px!important;width:min(202px,55vw)!important}}
    `;
    document.head.appendChild(style);
  };

  const ensureHomeOrder = () => {
    const intro = byId('intro');
    const nav = intro?.querySelector('.title-secondary');
    if (!intro || !nav || intro.classList.contains('hidden')) return;

    all('[data-safe-home="faq"],[data-safe-home="update"]', nav).forEach(node => node.remove());
    all('[data-v3-faq],[data-v3-update],[data-v3-options],[data-v3-exit],.relay-home-nav-card,.relay-v4-home-btn,.relay-safe-home-duplicate', nav).forEach(node => node.remove());

    const options = nav.querySelector('[data-title-panel="controls"]');
    const exit = nav.querySelector('#exitTitle');

    const make = (kind, label, detail, action) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.safeHome = kind;
      button.innerHTML = `<span>${label}</span><small>${detail}</small>`;
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        try { action(); } catch {}
      });
      return button;
    };

    const faq = make('faq','FAQ','HELP · GAME SYSTEMS',() => window.relayOpenInfo?.('faq'));
    const update = make('update','UPDATE','LATEST PATCHES · LIVE',() => window.relayOpenInfo?.('update'));

    nav.replaceChildren();
    if (options) nav.appendChild(options);
    nav.appendChild(faq);
    nav.appendChild(update);
    if (exit) nav.appendChild(exit);
    else nav.appendChild(make('exit','EXIT','CLOSE SESSION',() => clickNative(byId('exitTitle'))));

    all('button',nav).forEach(button => { button.disabled=false; button.removeAttribute('aria-hidden'); });
  };

  const hidePhaserPresentation = () => {
    const intro = byId('intro');
    if (!intro?.classList.contains('hidden')) return;
    const scene = window.__relayRunnerScene;
    const list = scene?.children?.list;
    if (!Array.isArray(list)) return;
    for (const child of list) {
      const text = typeof child?.text === 'string' ? child.text.trim().toUpperCase() : '';
      if (!text) continue;
      if (/DYNAMIC\s+CROWD/.test(text) || /MISSION\s+INTELLIGENCE/.test(text) || /^V10\b/.test(text)) {
        try { child.disableInteractive?.(); child.setVisible?.(false); child.setAlpha?.(0); child.setActive?.(false); } catch {}
        try { child.parentContainer?.setVisible?.(false); child.parentContainer?.setAlpha?.(0); child.parentContainer?.setActive?.(false); } catch {}
      }
    }
  };

  const boot = () => {
    installStyles();
    ensureHomeOrder();
    if (!timer) timer = window.setInterval(() => { try { ensureHomeOrder(); hidePhaserPresentation(); } catch {} }, POLL_MS);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
