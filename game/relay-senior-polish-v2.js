import Phaser from 'phaser';
import { RunnerScene } from './src/scenes/RunnerScene.js';

(() => {
  if (window.__relaySeniorPolishV2) return;
  window.__relaySeniorPolishV2 = true;

  const LEGACY_STYLE = 'relay-senior-v2-legacy-cleanup';
  const FINISH_STYLE = 'relay-senior-v2-finish-style';

  const installLegacyCleanup = () => {
    if (!document.getElementById(LEGACY_STYLE)) {
      const style = document.createElement('style');
      style.id = LEGACY_STYLE;
      style.textContent = `
        #play .main-menu-footer,
        #play .legacy-system-status,
        #play .legacy-night-run-status,
        #play .relay-legacy-hidden,
        #play .chapter-nightshift-copy,
        #play [data-legacy-status],
        #play [data-chapter-night-shift] {
          display:none!important;
          visibility:hidden!important;
          opacity:0!important;
          pointer-events:none!important;
        }
      `;
      document.head.appendChild(style);
    }
  };

  const legacyText = text => /SYSTEM\s+ONLINE|RELAY\s+RUNNER\s*\/\/\s*STANDBY|RELAY\s+RUNNER\s+STANDBY|NIGHT\s+RUN|CHAPTER\s+0?1\s*[·•\-]\s*NIGHT\s+SHIFT|CHAPTER\s+0?2\s*[·•\-]\s*NIGHT\s+SHIFT|OLD\s+QUARTER\s*[·•\-]\s*NIGHT\s+SHIFT/i.test(String(text || '').replace(/\s+/g, ' ').trim());

  const scrubDom = () => {
    const root = document.getElementById('play');
    if (!root) return;
    root.querySelectorAll('*').forEach(el => {
      if (el.children.length) return;
      const text = el.textContent || '';
      if (legacyText(text)) {
        el.classList.add('relay-legacy-hidden');
        el.setAttribute('aria-hidden', 'true');
      }
    });
  };

  const scrubScene = scene => {
    const walk = list => list?.forEach(obj => {
      if (typeof obj?.text === 'string' && legacyText(obj.text)) {
        obj.setVisible?.(false);
        obj.setAlpha?.(0);
      }
      if (Array.isArray(obj?.list)) walk(obj.list);
    });
    walk(scene?.children?.list);
  };

  installLegacyCleanup();
  scrubDom();
  window.addEventListener('relay:runner-scene-ready', event => {
    const scene = event.detail?.scene || window.__relayRunnerScene;
    requestAnimationFrame(() => { scrubDom(); scrubScene(scene); });
  }, { passive: true });
  window.addEventListener('relay:gameplay-core-ready', () => requestAnimationFrame(scrubDom), { passive: true });
  window.addEventListener('relay:cinematic-unlock', () => requestAnimationFrame(() => scrubScene(window.__relayRunnerScene)), { passive: true });
  if (document.body) new MutationObserver(mutations => {
    if (mutations.some(m => m.addedNodes.length)) scrubDom();
  }).observe(document.body, { childList: true, subtree: true });

  const installFinishStyle = () => {
    if (document.getElementById(FINISH_STYLE)) return;
    const style = document.createElement('style');
    style.id = FINISH_STYLE;
    style.textContent = `
      #finish.relay-senior-finish-v2 {
        --relay-cyan:#8df4ff;
        --relay-gold:#ffd06e;
        --relay-violet:#ba9cff;
        background:
          radial-gradient(70% 40% at 50% 0%,rgba(141,244,255,.15),transparent 70%),
          radial-gradient(44% 36% at 100% 90%,rgba(186,156,255,.10),transparent 72%),
          linear-gradient(180deg,#020710f5,#010309fd)!important;
      }
      #finish.relay-senior-finish-v2 .outcome {
        width:min(920px,100%); border-radius:26px!important;
        border:1px solid rgba(141,244,255,.22)!important;
        background:
          radial-gradient(circle at 8% 12%,rgba(141,244,255,.08),transparent 26%),
          radial-gradient(circle at 91% 13%,rgba(255,208,110,.07),transparent 25%),
          linear-gradient(145deg,rgba(8,17,31,.98),rgba(2,7,14,.995))!important;
        box-shadow:0 35px 120px rgba(0,0,0,.75),inset 0 1px rgba(255,255,255,.05),0 0 80px rgba(141,244,255,.07)!important;
      }
      #finish .relay-finish-kicker {
        position:relative; z-index:4; display:flex; align-items:center; justify-content:center; gap:10px;
        width:max-content; max-width:100%; margin:0 auto 10px; padding:7px 11px;
        border:1px solid rgba(104,231,190,.18); border-radius:999px;
        background:rgba(104,231,190,.035); color:#68e7be;
        font:800 8px/1 'DM Mono',monospace; letter-spacing:1.5px; text-transform:uppercase;
      }
      #finish .relay-finish-kicker::before { content:''; width:6px; height:6px; border-radius:50%; background:#68e7be; box-shadow:0 0 14px rgba(104,231,190,.7); }
      #finish .relay-finish-hero {
        position:relative; z-index:3; margin:0 auto 18px; padding:24px 20px 20px; max-width:760px;
        border:1px solid rgba(141,244,255,.14); border-radius:20px;
        background:linear-gradient(145deg,rgba(8,25,39,.78),rgba(4,11,20,.76));
        overflow:hidden; text-align:center;
      }
      #finish .relay-finish-hero::before {
        content:''; position:absolute; inset:0;
        background:linear-gradient(90deg,transparent,rgba(141,244,255,.04) 50%,transparent),repeating-linear-gradient(0deg,transparent 0 4px,rgba(255,255,255,.012) 5px 6px);
        pointer-events:none;
      }
      #finish .relay-finish-core {
        position:relative; margin:0 auto 14px; width:92px; height:92px; border-radius:50%;
        background:radial-gradient(circle,rgba(255,255,255,.95) 0 8%,rgba(141,244,255,.8) 10% 18%,rgba(141,244,255,.12) 36%,transparent 67%);
        box-shadow:0 0 0 1px rgba(141,244,255,.3),0 0 38px rgba(141,244,255,.22),0 0 85px rgba(141,244,255,.10);
      }
      #finish .relay-finish-core::before,#finish .relay-finish-core::after {
        content:''; position:absolute; inset:8px; border:1px solid rgba(141,244,255,.35); border-radius:50%; transform:rotate(22deg);
      }
      #finish .relay-finish-core::after { inset:18px; border-color:rgba(255,208,110,.42); transform:rotate(-22deg); }
      #finish.relay-senior-finish-v2 #finishTitle,
      #finish.relay-senior-finish-v2 .outcome h1,
      #finish.relay-senior-finish-v2 .outcome h2 { font-size:clamp(30px,6vw,56px)!important; letter-spacing:.075em!important; }
      #finish .relay-finish-subtitle { margin:8px auto 0; color:#9db7c6; font:600 10px/1.6 'DM Mono',monospace; letter-spacing:.16em; text-transform:uppercase; }
      #finish .relay-finish-divider { width:100%; height:1px; margin:18px 0; background:linear-gradient(90deg,transparent,rgba(141,244,255,.28),rgba(255,208,110,.22),transparent); }
      #finish .finish-actions { position:relative; z-index:5; }
      #finish #again,#finish #nextMission { border-radius:15px!important; }
      #finish #nextMission { position:relative; overflow:hidden; }
      #finish #nextMission::before { content:''; position:absolute; inset:-40%; background:linear-gradient(110deg,transparent 35%,rgba(255,255,255,.12) 50%,transparent 65%); transform:translateX(-50%); animation:relayFinishSweep 2.6s ease-in-out infinite; pointer-events:none; }
      @keyframes relayFinishSweep { 0%,45%{transform:translateX(-55%)} 70%,100%{transform:translateX(55%)} }
      @media(max-width:720px){#finish .relay-finish-hero{padding:20px 14px 16px}#finish .relay-finish-core{width:76px;height:76px}#finish .relay-finish-kicker{font-size:7px}}
      @media(prefers-reduced-motion:reduce){#finish #nextMission::before{animation:none}}
    `;
    document.head.appendChild(style);
  };

  const finishEnhance = () => {
    const finish = document.getElementById('finish');
    if (!finish || finish.classList.contains('hidden')) return;
    installFinishStyle();
    finish.classList.add('relay-senior-finish-v2');
    const outcome = finish.querySelector('.outcome');
    if (!outcome) return;
    if (!outcome.querySelector('.relay-finish-hero')) {
      const hero = document.createElement('section');
      hero.className = 'relay-finish-hero';
      hero.innerHTML = `
        <div class="relay-finish-kicker">RELAY CORE // DELIVERY CONFIRMED</div>
        <div class="relay-finish-core" aria-hidden="true"></div>
        <div class="relay-finish-subtitle">RUN COMPLETE · NETWORK HANDSHAKE STABLE</div>
        <div class="relay-finish-divider"></div>
      `;
      const title = outcome.querySelector('#finishTitle, h1, h2');
      if (title) title.parentElement?.insertBefore(hero, title);
      else outcome.prepend(hero);
    }
  };

  installFinishStyle();
  if (document.body) new MutationObserver(mutations => {
    if (mutations.some(m => m.type === 'attributes' || m.addedNodes.length)) requestAnimationFrame(finishEnhance);
  }).observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });
  finishEnhance();
  window.addEventListener('relay:mission-complete', () => requestAnimationFrame(finishEnhance), { passive:true });

  const PADS = {
    'first-delivery': [
      [760, 546],
      [1588, 471],
      [2140, 546],
      [2950, 546],
      [3220, 396],
      [4210, 546],
      [5160, 546],
    ]
  };

  const addPad = (scene, x, y, index) => {
    if (!scene?.add || !scene?.physics?.add || !scene?.player?.body) return;
    scene.__relaySeniorV2Pads ||= [];
    if (scene.__relaySeniorV2Pads.some(p => Math.abs(p.x - x) < 2 && Math.abs(p.y - y) < 2)) return;
    const container = scene.add.container(x, y).setDepth(11);
    const shadow = scene.add.ellipse(0, 9, 64, 9, 0x000000, .28);
    const base = scene.add.rectangle(0, 0, 58, 16, 0x07111c, 1).setStrokeStyle(2, 0x8df4ff, .82);
    const inner = scene.add.rectangle(0, -1, 46, 9, 0x8df4ff, .07).setStrokeStyle(1, 0xffd06e, .62);
    const chevron = scene.add.graphics();
    chevron.lineStyle(2, 0xffd06e, .95);
    [-18,-4,10,24].forEach(px => { chevron.lineBetween(px, 2, px+7, -4); chevron.lineBetween(px+7, -4, px+14, 2); });
    const node = scene.add.circle(25, -5, 2, 0x68e7be, .9);
    container.add([shadow, base, inner, chevron, node]);
    const ring = scene.add.circle(x, y, 22, 0x8df4ff, .04).setStrokeStyle(1, 0x8df4ff, .25).setDepth(10);
    if (!scene.motionReduced) scene.tweens.add({ targets:[ring,node], scale:1.14, alpha:.3, duration:780 + index*80, yoyo:true, repeat:-1, ease:'Sine.inOut' });

    const body = scene.add.rectangle(x, y-5, 58, 18, 0x000000, 0);
    scene.physics.add.existing(body, true);
    body.__relayBounceAt = 0;
    scene.physics.add.overlap(scene.player, body, () => {
      const now = performance.now();
      if (scene.firstTimeTutorial || scene.cinematicActive || scene.finished || now - body.__relayBounceAt < 260) return;
      body.__relayBounceAt = now;
      const velocityX = Number(scene.player.body.velocity.x) || 0;
      scene.player.body.setVelocityY(Math.min(-860, -690 - Math.max(0, Math.min(velocityX, 360)) * .28));
      if (velocityX < 380) scene.player.body.setVelocityX(390);
      container.setScale(1, .78);
      scene.tweens?.add({ targets:container, scaleY:1, duration:170, ease:'Back.easeOut' });
      scene.tweens?.add({ targets:ring, scale:1.6, alpha:0, duration:260, ease:'Cubic.out', onComplete:()=>ring.setScale(1).setAlpha(.18) });
      window.dispatchEvent(new CustomEvent('relay:trampoline-bounce', { detail:{ scene, x, y, index } }));
    });
    scene.__relaySeniorV2Pads.push({ x, y, container, ring, body });
  };

  const ensurePads = scene => {
    if (!scene?.mission?.id || scene.mission.id !== 'first-delivery' || scene.finished) return;
    if (scene.firstTimeTutorial || scene.cinematicActive) return;
    const points = PADS['first-delivery'];
    points.forEach((point,index) => addPad(scene, point[0], point[1], index));
  };

  const originalUpdate = RunnerScene.prototype.update;
  if (typeof originalUpdate === 'function' && !RunnerScene.prototype.__relaySeniorV2Update) {
    RunnerScene.prototype.update = function relaySeniorV2Update(...args) {
      const result = originalUpdate.apply(this, args);
      try {
        ensurePads(this);
        scrubScene(this);
        if (this.player?.active && this.player?.body) {
          const vx = Number(this.player.body.velocity.x) || 0;
          const vy = Number(this.player.body.velocity.y) || 0;
          if (!this.__relaySeniorMotionBase) this.__relaySeniorMotionBase = { scaleX:1, scaleY:1 };
          const targetLean = Phaser.Math.Clamp(vx / 850, -0.08, 0.16);
          const airborne = Math.abs(vy) > 80;
          const squash = airborne ? Phaser.Math.Clamp(Math.abs(vy) / 1500, 0, .055) : 0;
          this.player.setRotation?.(Phaser.Math.Linear(this.player.rotation || 0, targetLean * .72, .18));
          this.player.setScale?.(Phaser.Math.Linear(this.player.scaleX || 1, 1 + targetLean * .15 + squash, .14), Phaser.Math.Linear(this.player.scaleY || 1, 1 - squash * .65, .14));
        }
      } catch (error) {
        console.warn('[Relay Senior V2] visual enhancement skipped:', error);
      }
      return result;
    };
    RunnerScene.prototype.__relaySeniorV2Update = true;
  }

  const sceneReady = event => {
    const scene = event.detail?.scene || window.__relayRunnerScene;
    requestAnimationFrame(() => { ensurePads(scene); scrubScene(scene); });
  };
  window.addEventListener('relay:runner-scene-ready', sceneReady, { passive:true });
  window.addEventListener('relay:tutorial-complete', () => requestAnimationFrame(() => ensurePads(window.__relayRunnerScene)), { passive:true });
  window.addEventListener('relay:cinematic-unlock', () => requestAnimationFrame(() => ensurePads(window.__relayRunnerScene)), { passive:true });

  window.__relaySeniorPolishV2 = true;
  window.dispatchEvent(new CustomEvent('relay:senior-polish-v2-ready', { detail:{ version:'2.0.0' } }));
})();
