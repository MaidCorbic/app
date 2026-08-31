import { RunnerScene } from './src/scenes/RunnerScene.js';

/* Final presentation-only layout pass.
 * Does not own gameplay, mission state, progression, input, or audio.
 * It only normalizes Home/HUD presentation and hides diagnostic overlays.
 */
(() => {
  'use strict';
  if (window.__relayFinalLayoutV2) return;
  window.__relayFinalLayoutV2 = true;

  const nativeClick = selector => {
    const node = document.querySelector(selector);
    if (!node) return false;
    try { HTMLElement.prototype.click.call(node); return true; } catch { return false; }
  };

  const installStyles = () => {
    if (document.getElementById('relay-final-layout-v2-style')) return;
    const style = document.createElement('style');
    style.id = 'relay-final-layout-v2-style';
    style.textContent = `
      /* HOME: no duplicate top-right FAQ/INFO launcher. */
      #intro.home-v3 .info-launcher{display:none!important;visibility:hidden!important;pointer-events:none!important}

      /* HOME actions stay clickable and visually stable. */
      #intro.home-v3 .home-v3-play{pointer-events:auto!important;z-index:60!important}
      #intro.home-v3 .home-v3-play.is-locked{pointer-events:none!important}

      /* GAMEPLAY HUD: mission left, signals centered, XP then pause right. */
      #game #play .hud{
        position:absolute!important;top:12px!important;left:50%!important;right:auto!important;transform:translateX(-50%)!important;
        width:min(1160px,calc(100vw - 28px))!important;max-width:none!important;
        display:grid!important;grid-template-columns:minmax(180px,260px) minmax(230px,360px) minmax(174px,220px)!important;
        align-items:start!important;gap:10px!important;padding:0!important;margin:0!important;z-index:120!important;pointer-events:none!important;
      }
      #game #play .hud>*{min-width:0!important;pointer-events:auto!important}
      #game #play .hud-route,
      #game #play .hud-run,
      #game #play .hud-xp,
      #game #play #pause{
        box-sizing:border-box!important;border:1px solid rgba(255,208,110,.25)!important;
        background:linear-gradient(145deg,rgba(7,10,15,.96),rgba(2,3,5,.985))!important;
        box-shadow:inset 0 1px rgba(255,255,255,.05),0 16px 34px rgba(0,0,0,.28),0 0 28px rgba(255,208,110,.04)!important;
        backdrop-filter:blur(8px)!important;
      }
      #game #play .hud-route{min-height:50px!important;padding:9px 12px!important;border-radius:12px!important;display:flex!important;align-items:center!important;gap:10px!important}
      #game #play .hud-route .route-dot{flex:0 0 8px!important;width:8px!important;height:8px!important;background:#ffd06e!important;box-shadow:0 0 14px rgba(255,208,110,.75)!important}
      #game #play .hud-route small{display:block!important;color:#ffd06e!important;font:900 7px/1 'DM Mono',monospace!important;letter-spacing:1.35px!important}
      #game #play .hud-route b{display:block!important;margin-top:5px!important;color:#f4f7fa!important;font:950 11px/1.12 'DM Mono',monospace!important;letter-spacing:.45px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}

      #game #play .hud-run{min-height:50px!important;padding:9px 12px!important;border-radius:12px!important;display:grid!important;grid-template-columns:1fr auto!important;grid-template-rows:auto 6px!important;grid-template-areas:'label count' 'bar bar'!important;align-items:center!important;column-gap:10px!important}
      #game #play .hud-run>small{grid-area:label!important;color:#ffd06e!important;font:900 7px/1 'DM Mono',monospace!important;letter-spacing:1.2px!important;text-transform:uppercase!important}
      #game #play .hud-run>small::before{content:''!important}
      #game #play .hud-run>span{grid-area:count!important;justify-self:end!important;color:#fff3bf!important;font:950 14px/1 'DM Mono',monospace!important;letter-spacing:1px!important}
      #game #play .hud-run>div{grid-area:bar!important;width:100%!important;height:5px!important;min-width:0!important;overflow:hidden!important;border:1px solid rgba(255,208,110,.16)!important;border-radius:99px!important;background:rgba(255,255,255,.045)!important}
      #game #play .hud-run>div>i{display:block!important;height:100%!important;border-radius:99px!important;background:linear-gradient(90deg,#b47a1e,#ffd06e,#fff0b5)!important;box-shadow:0 0 12px rgba(255,208,110,.32)!important}

      #game #play .hud-actions{display:flex!important;align-items:stretch!important;justify-content:flex-end!important;gap:8px!important}
      #game #play .hud-xp{min-width:86px!important;min-height:50px!important;padding:7px 10px!important;border-radius:12px!important;display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:center!important;text-align:center!important}
      #game #play .hud-xp small{display:block!important;color:#8d98a3!important;font:900 7px/1 'DM Mono',monospace!important;letter-spacing:1px!important;text-align:center!important}
      #game #play .hud-xp b{display:block!important;margin-top:5px!important;color:#ffe7a6!important;font:950 14px/1 'DM Mono',monospace!important;letter-spacing:.5px!important;text-align:center!important}
      #game #play #pause{width:50px!important;min-width:50px!important;height:50px!important;padding:0!important;border-radius:12px!important;color:#ffe7a6!important;border-color:rgba(255,208,110,.45)!important;font:900 20px/1 'DM Mono',monospace!important;display:grid!important;place-items:center!important}

      /* The mobile HUD uses the same upper arrangement; the bottom duplicate controller is hidden. */
      body.is-touch #play .hud-actions>#pause{display:grid!important}
      body.is-touch .mobile-bottom-hud{display:none!important}
      @media(max-width:900px){
        #game #play .hud{width:calc(100vw - 16px)!important;grid-template-columns:minmax(150px,1fr) minmax(168px,1.1fr) minmax(154px,190px)!important;gap:7px!important}
      }
      @media(max-width:760px){
        #game #play .hud{top:8px!important;width:calc(100vw - 10px)!important;grid-template-columns:minmax(0,1fr) minmax(108px,124px) auto!important;gap:5px!important}
        #game #play .hud-route{min-height:44px!important;padding:7px 8px!important}
        #game #play .hud-route small{font-size:6px!important;letter-spacing:1px!important}
        #game #play .hud-route b{font-size:8px!important;margin-top:4px!important}
        #game #play .hud-run{min-height:44px!important;padding:6px 7px!important}
        #game #play .hud-run>small{font-size:6px!important;letter-spacing:.8px!important}
        #game #play .hud-run>span{font-size:11px!important}
        #game #play .hud-xp{min-width:64px!important;min-height:44px!important;padding:6px 7px!important}
        #game #play .hud-xp small{font-size:6px!important}
        #game #play .hud-xp b{font-size:11px!important;margin-top:4px!important}
        #game #play #pause{width:44px!important;min-width:44px!important;height:44px!important;border-radius:11px!important;font-size:18px!important}
      }
      @media(max-width:520px){
        #game #play .hud{grid-template-columns:minmax(0,1fr) 108px auto!important;top:6px!important}
        #game #play .hud-xp{min-width:56px!important;width:56px!important}
      }
      @media(orientation:landscape) and (max-height:560px){#game #play .hud{top:6px!important}}

      /* Compact mission objective: shared Map Menu visual language. */
      #game .world-marker{left:50%!important;right:auto!important;bottom:auto!important;top:82px!important;transform:translateX(-50%)!important;width:min(280px,calc(100vw - 40px))!important;max-width:280px!important;padding:7px 12px!important;border:1px solid rgba(255,208,110,.24)!important;border-left:2px solid #ffd06e!important;border-radius:10px!important;background:linear-gradient(145deg,rgba(7,10,15,.95),rgba(2,3,5,.94))!important;box-shadow:0 14px 32px rgba(0,0,0,.25),0 0 26px rgba(255,208,110,.035)!important;text-align:center!important}
      #game .world-marker span{display:block!important;color:#ffd06e!important;font:900 6px/1 'DM Mono',monospace!important;letter-spacing:1.5px!important}
      #game .world-marker b{display:block!important;margin-top:4px!important;color:#f4f7fa!important;font:900 9px/1.15 'DM Mono',monospace!important;letter-spacing:.55px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      @media(max-width:760px){#game .world-marker{top:62px!important;width:min(230px,calc(100vw - 40px))!important;padding:6px 9px!important}}

      /* Hide the secondary diagnostic/telemetry layers without touching gameplay objects. */
      #game .relay-debug-hud,[data-relay-debug-hud],[data-debug-hud],[class*='dynamic-crowd'],[id*='dynamic-crowd']{display:none!important;visibility:hidden!important;pointer-events:none!important}
      @media(prefers-reduced-motion:reduce){#game #play .hud-run>div>i{transition:none!important}}
    `;
    document.head.appendChild(style);
  };

  const installHome = () => {
    const intro = document.getElementById('intro');
    if (!intro) return;
    intro.querySelector('.info-launcher')?.remove();
    const play = intro.querySelector('[data-v3-play]');
    if (play && play.dataset.relayDirectPlay !== '1') {
      play.dataset.relayDirectPlay = '1';
      play.addEventListener('click', event => {
        if (play.classList.contains('is-locked')) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        nativeClick('#start');
      }, { capture:true });
    }
  };

  const hidePhaserDiagnosticUi = scene => {
    const list=scene?.children?.list||[];
    for(const child of list){
      if(typeof child?.text!=='string')continue;
      const text=child.text.trim().toUpperCase();
      if(/DYNAMIC\s+CROWD/.test(text)||/^V10\s*\/\//.test(text)||/^V10\b/.test(text)){
        const parent=child.parentContainer;
        if(parent?.setVisible) parent.setVisible(false); else child.setVisible(false);
        child.setAlpha?.(0); child.disableInteractive?.();
      }
    }
    for(const child of list){
      if(child?.type==='Container'&&child.depth===900&&child.list?.some?.(node=>typeof node?.text==='string'&&/V10\s*\/\//i.test(node.text))) child.setVisible(false);
    }
  };

  const recenterV9 = scene => {
    const list=scene?.children?.list||[];
    const panel=list.find(c=>c?.type==='Rectangle'&&c.depth===700&&c.width>=300&&c.height>=180&&c.height<=230);
    if(!panel)return;
    const size=scene.scale?.gameSize||scene.scale||{};
    const w=Number(size.width||1280),h=Number(size.height||720);
    const targetX=w/2, targetY=Math.max(150,Math.min(h*.36,h/2-40));
    const dx=targetX-panel.x,dy=targetY-panel.y;
    if(Math.abs(dx)<1&&Math.abs(dy)<1)return;
    for(const child of list){if(child?.depth===700||child?.depth===701||child?.depth===702){child.x+=dx;child.y+=dy;}}
    const title=list.find(c=>typeof c?.text==='string'&&/V9\s*\/\s*MISSION INTELLIGENCE/i.test(c.text));
    title?.setText?.('MISSION INTELLIGENCE');
  };

  const originalCreate=RunnerScene.prototype.create;
  if(typeof originalCreate==='function'&&!RunnerScene.prototype.__relayFinalLayoutV2Create){
    RunnerScene.prototype.create=function(...args){
      const result=originalCreate.apply(this,args);
      const run=()=>{hidePhaserDiagnosticUi(this);recenterV9(this);};
      run(); this.time?.delayedCall?.(250,run); this.time?.delayedCall?.(900,run);
      return result;
    };
    RunnerScene.prototype.__relayFinalLayoutV2Create=true;
  }

  const boot=()=>{installStyles();installHome();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
