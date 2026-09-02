/* Relay Home + Gameplay Presentation Safe V1
 * Presentation-only hardening. Does not own gameplay state, progression, controls or audio.
 */
(() => {
  'use strict';
  const STYLE_ID = 'relay-home-hud-safe-v1-style';
  const POLL_MS = 450;
  let scanTimer = 0;

  const $ = (id) => document.getElementById(id);
  const q = (selector, root = document) => root.querySelector(selector);
  const qa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const nativeClick = (node) => {
    if (!(node instanceof HTMLElement)) return false;
    try { HTMLElement.prototype.click.call(node); return true; } catch { return false; }
  };

  const injectStyles = () => {
    if ($(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* HOME — exactly one navigation stack, deterministic order. */
      #intro.home-v3 .info-launcher,
      #intro.home-v3 .home-v3-side,
      #intro.home-v3 .relay-home-nav-card,
      #intro.home-v3 .relay-v4-home-btn { display:none!important; visibility:hidden!important; pointer-events:none!important; }
      /* Only the duplicate lower FAQ/UPDATE cards are retired. The existing top HOME navigation remains untouched. */
      #intro.home-v3 .title-secondary > [data-safe-home="faq"],
      #intro.home-v3 .title-secondary > [data-safe-home="update"] { display:none!important; visibility:hidden!important; pointer-events:none!important; }
      /* home-v3.js and safe-v2 both style the generated side menu. Keep it retired so the legacy title-secondary owner is the only visible stack. */
      #intro.home-v3.home-v3 .home-v3-side.home-v3-side { display:none!important; visibility:hidden!important; opacity:0!important; pointer-events:none!important; }
      #intro.home-v3 .title-secondary{
        display:flex!important; flex-direction:column!important; align-items:stretch!important; justify-content:flex-start!important;
        gap:8px!important; width:min(420px,100%)!important; position:relative!important; z-index:100!important;
        pointer-events:auto!important;
      }
      #intro.home-v3 .title-secondary > button{
        position:relative!important; display:flex!important; align-items:center!important; justify-content:space-between!important;
        width:100%!important; min-height:52px!important; padding:12px 14px!important; box-sizing:border-box!important;
        pointer-events:auto!important; cursor:pointer!important; touch-action:manipulation!important; user-select:none!important;
        border:1px solid rgba(255,208,110,.24)!important; border-left:2px solid rgba(255,208,110,.72)!important;
        border-radius:10px!important; background:linear-gradient(145deg,rgba(7,10,15,.97),rgba(2,3,5,.985))!important;
        color:#f4f7fa!important; box-shadow:inset 0 1px rgba(255,255,255,.05),0 12px 26px rgba(0,0,0,.24),0 0 22px rgba(255,208,110,.04)!important;
      }
      #intro.home-v3 .title-secondary > button:hover,
      #intro.home-v3 .title-secondary > button:focus-visible{
        border-color:rgba(255,208,110,.68)!important; transform:translateY(-1px)!important;
        box-shadow:inset 0 1px rgba(255,255,255,.08),0 16px 30px rgba(0,0,0,.30),0 0 28px rgba(255,208,110,.10)!important;
        outline:none!important;
      }
      #intro.home-v3 .title-secondary > button span{font:950 10px/1 'DM Mono',ui-monospace,monospace!important;letter-spacing:1.2px!important;}
      #intro.home-v3 .title-secondary > button small{font:750 7px/1.2 'DM Mono',ui-monospace,monospace!important;letter-spacing:.8px!important;color:#87929f!important;text-align:right!important;}
      #intro.home-v3 .title-secondary > [data-safe-home="faq"]{border-left-color:#fff0b5!important}
      #intro.home-v3 .title-secondary > [data-safe-home="update"]{border-left-color:#ffd06e!important}
      #intro.home-v3 .title-secondary > [data-title-panel="controls"]{border-left-color:#ffe7a6!important}
      #intro.home-v3 .title-secondary > #exitTitle{border-left-color:#b47a1e!important}
      #relayInfoPanel.hidden,#titlePanel.hidden{pointer-events:none!important;}
      #relayInfoPanel:not(.hidden),#titlePanel:not(.hidden){pointer-events:auto!important;}

      /* GAMEPLAY — remove secondary/diagnostic button HUDs and keep the objective fixed. */
      #game #play .input-guide,
      #game #play .mobile-bottom-hud,
      #game #play .relay-debug-hud,
      #game #play [data-relay-debug-hud],
      #game #play [data-debug-hud]{display:none!important;visibility:hidden!important;pointer-events:none!important;}
      #game .relay-gameplay-intel,
      #game #relayGameplayIntel,
      #game [data-relay-mission-intelligence],
      #game [data-mission-intelligence]{display:none!important;visibility:hidden!important;pointer-events:none!important;opacity:0!important;}
      #game .world-marker{
        position:absolute!important; left:18px!important; right:auto!important; top:76px!important; bottom:auto!important;
        transform:none!important; width:min(286px,28vw)!important; max-width:286px!important; box-sizing:border-box!important;
        min-height:44px!important; padding:8px 11px!important; z-index:285!important; pointer-events:none!important;
        border:1px solid rgba(255,208,110,.26)!important; border-left:2px solid #ffd06e!important; border-radius:10px!important;
        background:linear-gradient(145deg,rgba(7,10,15,.96),rgba(2,3,5,.94))!important;
        box-shadow:inset 0 1px rgba(255,255,255,.05),0 14px 30px rgba(0,0,0,.26),0 0 24px rgba(255,208,110,.045)!important;
        color:#f4f7fa!important; text-align:left!important; overflow:hidden!important;
      }
      #game .world-marker span{display:block!important;color:#ffd06e!important;font:900 6px/1 'DM Mono',monospace!important;letter-spacing:1.35px!important;}
      #game .world-marker b{display:block!important;margin-top:4px!important;color:#f4f7fa!important;font:900 9px/1.15 'DM Mono',monospace!important;letter-spacing:.45px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}

      /* Ensure the main HUD remains the only top HUD on desktop and mobile. */
      #game #play .hud{z-index:300!important;pointer-events:none!important;}
      #game #play .hud > *{pointer-events:auto!important;}
      #game #play .hud-route,#game #play .hud-progress,#game #play .hud-xp,#game #play #pause{
        background:linear-gradient(145deg,rgba(7,10,15,.96),rgba(2,3,5,.985))!important;
        border-color:rgba(255,208,110,.25)!important; color:#f4f7fa!important;
      }
      #game #play .hud-progress>div{background:rgba(255,255,255,.045)!important;border-color:rgba(255,208,110,.16)!important;}
      #game #play .hud-progress i{background:linear-gradient(90deg,#b47a1e,#ffd06e,#fff0b5)!important;box-shadow:0 0 12px rgba(255,208,110,.28)!important;}

      @media(max-width:900px){
        #game .world-marker{left:10px!important;top:67px!important;width:min(250px,44vw)!important;}
      }
      @media(max-width:760px){
        #game .world-marker{left:8px!important;top:58px!important;width:min(218px,49vw)!important;padding:7px 9px!important;}
        #intro.home-v3 .title-secondary > button{min-height:50px!important;padding:11px 12px!important;}
      }
      @media(max-width:520px){
        #game .world-marker{left:8px!important;top:54px!important;width:min(202px,55vw)!important;}
      }
    `;
    document.head.appendChild(style);
  };

  const hidePhaserPresentation = () => {
    const canvas = $('phaser-game')?.querySelector('canvas');
    const intro = $('intro');
    if (!canvas || !intro || !intro.classList.contains('hidden')) return;
    const scene = window.__relayRunnerScene;
    const list = scene?.children?.list;
    if (!Array.isArray(list)) return;

    for (const child of list) {
      const text = typeof child?.text === 'string' ? child.text.trim() : '';
      const normalized = text.toUpperCase();
      if (!text) continue;
      if (/DYNAMIC\s+CROWD/.test(normalized) || /^V10\b/.test(normalized) || /MISSION\s+INTELLIGENCE/.test(normalized)) {
        try {
          child.disableInteractive?.();
          child.setVisible?.(false);
          child.setAlpha?.(0);
          child.setActive?.(false);
        } catch {}
        try { child.parentContainer?.setVisible?.(false); } catch {}
      }
    }

    for (const container of list) {
      const children = container?.list;
      if (container?.type !== 'Container' || !Array.isArray(children)) continue;
      const hasHiddenLabel = children.some(node => {
        const text = typeof node?.text === 'string' ? node.text.trim().toUpperCase() : '';
        return /DYNAMIC\s+CROWD/.test(text) || /^V10\b/.test(text) || /MISSION\s+INTELLIGENCE/.test(text);
      });
      if (hasHiddenLabel) {
        try { container.setVisible(false); container.setAlpha(0); container.setActive(false); } catch {}
      }
    }
  };

  const ensureHomeOrder = () => {
    const intro = $('intro');
    const nav = intro?.querySelector('.title-secondary');
    if (!intro || !nav || intro.classList.contains('hidden')) return;

    const options = nav.querySelector('[data-title-panel="controls"]');
    const exit = nav.querySelector('#exitTitle');
    const existingFaq = nav.querySelector('[data-safe-home="faq"]');
    const existingUpdate = nav.querySelector('[data-safe-home="update"]');

    qa('[data-v3-faq],[data-v3-update],[data-v3-options],[data-v3-exit],.relay-home-nav-card,.relay-v4-home-btn', nav).forEach(node => node.remove());
    qa('[data-safe-home="faq"],[data-safe-home="update"]', nav).forEach(node => node.remove());

    const make = (kind, label, detail, action) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.safeHome = kind;
      button.innerHTML = `<span>${label}</span><small>${detail}</small>`;
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        try { action(); } catch {}
      });
      return button;
    };

    const faq = make('faq', 'FAQ', 'HELP · GAME SYSTEMS', () => window.relayOpenInfo?.('faq'));
    const update = make('update', 'UPDATE', 'LATEST PATCHES · LIVE', () => window.relayOpenInfo?.('update'));

    if (options) nav.appendChild(options);
    else nav.appendChild(make('options', 'OPTIONS', 'SETTINGS · CONTROLS', () => nativeClick(q('[data-title-panel="controls"]'))));
    nav.appendChild(faq);
    nav.appendChild(update);
    if (exit) nav.appendChild(exit);
    else nav.appendChild(make('exit', 'EXIT', 'CLOSE SESSION', () => nativeClick($('exitTitle'))));
  };

  const hardenInfoPanel = () => {
    const panel = $('relayInfoPanel');
    if (!panel || panel.dataset.safeHardened === '1') return;
    panel.dataset.safeHardened = '1';

    const close = () => {
      panel.classList.add('hidden');
      panel.classList.remove('relay-update-mode');
    };

    panel.addEventListener('click', (event) => {
      const target = event.target;
      if (target?.closest?.('[data-relay-close]') || target === panel) close();
    });

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') close();
    });
  };

  const boot = () => {
    injectStyles();
    hardenInfoPanel();
    ensureHomeOrder();
    if (!scanTimer) scanTimer = window.setInterval(() => { try { ensureHomeOrder(); hidePhaserPresentation(); } catch {} }, POLL_MS);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
