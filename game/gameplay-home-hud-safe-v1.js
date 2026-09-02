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
      /* HOME — retired here. relay-final-layout-v2.js is the sole Home owner. */
      #intro.home-v3 .info-launcher,
      #intro.home-v3 .title-secondary { display:none!important; visibility:hidden!important; opacity:0!important; pointer-events:none!important; }
      #intro.home-v3 .home-v3-side { display:flex!important; visibility:visible!important; opacity:1!important; pointer-events:auto!important; }
      #intro.home-v3 .relay-home-nav-card { display:flex!important; visibility:visible!important; pointer-events:auto!important; }
      #intro.home-v3 .relay-v4-home-btn { display:none!important; visibility:hidden!important; pointer-events:none!important; }

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
    if (!scanTimer) scanTimer = window.setInterval(() => { try { hidePhaserPresentation(); } catch {} }, POLL_MS);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();