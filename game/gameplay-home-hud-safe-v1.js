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
      #intro.home-v3 .relay-v4-home-btn { display:none!important; visibility:hidden!important; pointer-events:none!important; }
      /* The canonical Home V3 side menu is the only visible title navigation. */
      #intro.home-v3 .title-secondary { display:none!important; visibility:hidden!important; pointer-events:none!important; }
      #intro.home-v3 .home-v3-side,
      #intro.home-v3 .relay-home-nav-card { display:grid!important; visibility:visible!important; opacity:1!important; pointer-events:auto!important; }
      #intro.home-v3.home-v3 .home-v3-side.home-v3-side { display:grid!important; visibility:visible!important; opacity:1!important; pointer-events:auto!important; }
      #intro.home-v3 .home-v3-side{
        grid-template-columns:1fr!important; align-items:stretch!important; gap:10px!important;
        width:min(420px,100%)!important; position:relative!important; z-index:80!important;
      }
      #intro.home-v3 .relay-home-nav-card{
        position:relative!important; isolation:isolate!important; min-height:58px!important; height:auto!important;
        width:100%!important; box-sizing:border-box!important; padding:14px 16px!important; margin:0!important;
        align-items:center!important; justify-content:space-between!important; gap:18px!important;
        border:1px solid rgba(255,208,110,.28)!important; border-left:2px solid rgba(255,208,110,.82)!important;
        border-radius:11px!important; background:linear-gradient(145deg,rgba(7,10,15,.97),rgba(2,3,5,.985))!important;
        color:#f4f7fa!important; box-shadow:inset 0 1px rgba(255,255,255,.05),0 14px 30px rgba(0,0,0,.30),0 0 24px rgba(255,208,110,.055)!important;
        text-align:left!important; cursor:pointer!important; touch-action:manipulation!important; user-select:none!important;
        -webkit-user-select:none!important; transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease,background .16s ease!important;
      }
      #intro.home-v3 .relay-home-nav-card::after{
        content:""; position:absolute!important; inset:1px!important; border-radius:10px!important;
        background:linear-gradient(90deg,rgba(255,208,110,.045),transparent 36%,transparent 76%,rgba(255,208,110,.035))!important;
        pointer-events:none!important; z-index:-1!important;
      }
      #intro.home-v3 .relay-home-nav-card:hover,#intro.home-v3 .relay-home-nav-card:focus-visible{
        transform:translateX(3px)!important; border-color:rgba(255,208,110,.72)!important;
        background:linear-gradient(145deg,rgba(12,16,21,.98),rgba(4,7,10,.99))!important;
        box-shadow:inset 0 1px rgba(255,255,255,.08),0 18px 38px rgba(0,0,0,.36),0 0 32px rgba(255,208,110,.13)!important;
        outline:none!important;
      }
      #intro.home-v3 .relay-home-nav-card:active{transform:translateX(1px) scale(.995)!important}
      #intro.home-v3 .relay-home-nav-card span{display:block!important;color:#f6f8fa!important;font:950 11px/1 'DM Mono',ui-monospace,monospace!important;letter-spacing:1.35px!important;white-space:nowrap!important;}
      #intro.home-v3 .relay-home-nav-card small{display:block!important;margin:0!important;color:#84909d!important;font:750 7px/1.3 'DM Mono',ui-monospace,monospace!important;letter-spacing:.9px!important;text-align:right!important;white-space:nowrap!important;}
      #intro.home-v3 .relay-home-nav-card[data-final-home="options"]{border-left-color:#ffe7a6!important}
      #intro.home-v3 .relay-home-nav-card[data-final-home="faq"]{border-left-color:#fff0b5!important}
      #intro.home-v3 .relay-home-nav-card[data-final-home="update"]{border-left-color:#ffd06e!important}
      #intro.home-v3 .relay-home-nav-card[data-final-home="exit"]{border-left-color:#b47a1e!important}
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
        #intro.home-v3 .home-v3-side{gap:8px!important;}
        #intro.home-v3 .relay-home-nav-card{min-height:54px!important;padding:12px 13px!important;}
      }
      @media(max-width:520px){#game .world-marker{left:8px!important;top:54px!important;width:min(202px,55vw)!important;}}
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
        try { child.disableInteractive?.(); child.setVisible?.(false); child.setAlpha?.(0); child.setActive?.(false); } catch {}
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
      if (hasHiddenLabel) { try { container.setVisible(false); container.setAlpha(0); container.setActive(false); } catch {} }
    }
  };

  const ensureHomeOrder = () => {
    const intro = $('intro');
    const nav = intro?.querySelector('.title-secondary');
    if (!intro || !nav || intro.classList.contains('hidden')) return;
    qa('[data-v3-faq],[data-v3-update],[data-v3-options],[data-v3-exit],.relay-home-nav-card,.relay-v4-home-btn,[data-safe-home="faq"],[data-safe-home="update"]', nav).forEach(node => node.remove());
  };

  const hardenInfoPanel = () => {
    const panel = $('relayInfoPanel');
    if (!panel || panel.dataset.safeHardened === '1') return;
    panel.dataset.safeHardened = '1';
    const close = () => { panel.classList.add('hidden'); panel.classList.remove('relay-update-mode'); };
    panel.addEventListener('click', (event) => { const target = event.target; if (target?.closest?.('[data-relay-close]') || target === panel) close(); });
    window.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
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
