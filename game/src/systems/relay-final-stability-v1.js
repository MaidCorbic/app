import { RunnerScene } from '../scenes/RunnerScene.js';

(() => {
  if (window.__relayFinalStabilityV1) return;
  window.__relayFinalStabilityV1 = true;

  const LEGACY_RE = /^(?:SYSTEM\s+ONLINE|RELAY\s+RUNNER\s*(?:\/\/|—|-)?\s*(?:NETWORK|STANDBY)|RELAY\s+RUNNER\s+STANDBY|NIGHT\s+RUN\s*(?:\/\/|·|-)?\s*CHAPTER\s*0?1|CHAPTER\s*0?1\s*(?:\/\/|·|-)?\s*NIGHT\s+SHIFT)$/i;

  const scrubHome = () => {
    const intro = document.getElementById('intro');
    if (!intro) return;
    intro.querySelector('.city-pulse-status')?.remove();
    intro.querySelector('.menu-version')?.remove();
    intro.querySelector('.main-menu-footer')?.remove();
    intro.querySelector('.chapter-brief')?.remove();
    intro.querySelector('.game-version')?.remove();
  };

  const scrubDomLegacy = () => {
    const roots = [document.getElementById('intro'), document.getElementById('play')].filter(Boolean);
    roots.forEach(root => {
      root.querySelectorAll('*').forEach(node => {
        if (node.children.length) return;
        const text = String(node.textContent || '').replace(/\s+/g, ' ').trim();
        if (LEGACY_RE.test(text)) {
          node.hidden = true;
          node.setAttribute('aria-hidden', 'true');
          node.style.display = 'none';
          node.style.visibility = 'hidden';
          node.style.pointerEvents = 'none';
        }
      });
    });
  };

  const scrubSceneLegacy = scene => {
    const walk = list => list?.forEach(object => {
      if (typeof object?.text === 'string') {
        const text = String(object.text).replace(/\s+/g, ' ').trim();
        if (LEGACY_RE.test(text)) {
          object.setVisible?.(false);
          object.setActive?.(false);
          object.setAlpha?.(0);
        }
      }
      if (Array.isArray(object?.list)) walk(object.list);
    });
    walk(scene?.children?.list);
  };

  const finishButtonText = () => {
    const finish = document.getElementById('finish');
    if (!finish) return;
    const retry = document.getElementById('again');
    const next = document.getElementById('nextMission');
    [retry, next].forEach(button => {
      if (!button) return;
      if (button.type !== 'button') button.type = 'button';
      if (button.disabled) button.disabled = false;
      button.style.pointerEvents = 'auto';
      button.style.cursor = 'pointer';
      if (button.tabIndex !== 0) button.tabIndex = 0;
    });
    if (retry) {
      const label = 'RETRY MISSION <b aria-hidden="true">↻</b>';
      if (retry.innerHTML !== label) retry.innerHTML = label;
      retry.setAttribute('aria-label', 'Retry this mission');
    }
    if (next) {
      const label = 'NEXT MISSION <b aria-hidden="true">➜</b>';
      if (next.innerHTML !== label) next.innerHTML = label;
      next.setAttribute('aria-label', 'Continue to the next mission');
    }
  };

  const installFinishStyle = () => {
    if (document.getElementById('relay-final-finish-actions-style')) return;
    const style = document.createElement('style');
    style.id = 'relay-final-finish-actions-style';
    style.textContent = `
      #finish .finish-actions{pointer-events:auto!important}
      #finish #again,#finish #nextMission{pointer-events:auto!important;cursor:pointer!important;touch-action:manipulation!important}
      #finish #again:disabled,#finish #nextMission:disabled{opacity:.72;cursor:wait!important}
      @media(max-width:720px){#finish #again,#finish #nextMission{min-height:56px!important}}
    `;
    document.head.appendChild(style);
  };

  const ensureFinishActions = () => {
    installFinishStyle();
    finishButtonText();
  };

  const cleanupSeniorPads = scene => {
    if (!scene?.__relaySeniorPads?.length) return;
    scene.__relaySeniorPads.forEach(item => {
      try { item.body?.destroy?.(); } catch {}
      try { item.visual?.destroy?.(); } catch {}
      try { item.ring?.destroy?.(); } catch {}
    });
    scene.__relaySeniorPads = [];
    scene.__relaySeniorPadsInstalled = false;
  };

  const ensureBoostTexture = scene => {
    if (scene.textures?.exists?.('boost-pad')) return 'boost-pad';
    const g = scene.make.graphics({ add: false });
    g.fillStyle(0x07111c, 1).fillRoundedRect(1, 3, 56, 13, 5);
    g.lineStyle(1.6, 0x8df4ff, .95).strokeRoundedRect(1, 3, 56, 13, 5);
    g.fillStyle(0x8df4ff, .10).fillRoundedRect(5, 6, 48, 7, 3);
    g.lineStyle(2.2, 0xffd06e, .95);
    g.lineBetween(11, 11, 17, 6); g.lineBetween(17, 6, 23, 11);
    g.lineBetween(27, 11, 33, 6); g.lineBetween(33, 6, 39, 11);
    g.lineBetween(43, 11, 49, 6); g.lineBetween(49, 6, 54, 11);
    g.generateTexture('boost-pad', 58, 18);
    g.destroy();
    return 'boost-pad';
  };

  const FIRST_DELIVERY_PADS = Object.freeze([
    [700, 588],
    [1500, 588],
    [2290, 548],
    [3310, 588],
  ]);

  const installAuthoredPads = scene => {
    if (!scene || scene.mission?.id !== 'first-delivery' || scene.finished || scene.firstTimeTutorial) return;
    if (scene.__relayFinalAuthoredPadsInstalled) return;
    if (!scene.player?.body || !scene.physics?.add?.existing || !scene.physics?.add?.overlap) return;

    cleanupSeniorPads(scene);
    const texture = ensureBoostTexture(scene);
    const pads = [];

    FIRST_DELIVERY_PADS.forEach(([x, y], index) => {
      const visual = scene.add.image(x, y - 2, texture).setDepth(8).setAlpha(.98);
      const ring = scene.add.circle(x, y - 2, 24, 0x8df4ff, .03)
        .setStrokeStyle(1.5, 0x8df4ff, .38)
        .setDepth(7);
      if (!scene.motionReduced) {
        scene.tweens?.add?.({ targets: ring, scale: 1.18, alpha: .06, duration: 820 + index * 90, repeat: -1, yoyo: true, ease: 'Sine.inOut' });
      }

      const body = scene.add.rectangle(x, y, 74, 22, 0x000000, 0);
      scene.physics.add.existing(body, true);
      body.setVisible(false);
      body.__relayBounceAt = 0;

      scene.physics.add.overlap(scene.player, body, () => {
        if (scene.finished || scene.cinematicActive || scene.firstTimeTutorial) return;
        const now = performance.now();
        if (now - body.__relayBounceAt < 280) return;
        body.__relayBounceAt = now;
        const vx = Number(scene.player?.body?.velocity?.x || 0);
        scene.player.body.setVelocityY?.(-900);
        scene.player.body.setVelocityX?.(Math.max(vx, 390));
        visual.setScale(1.10, .78);
        ring.setScale(1.05);
        ring.setAlpha(.32);
        scene.tweens?.add?.({ targets: visual, scaleX: 1, scaleY: 1, duration: 170, ease: 'Back.easeOut' });
        scene.tweens?.add?.({ targets: ring, scale: 1.55, alpha: 0, duration: 260, ease: 'Cubic.out' });
        scene.game?.events?.emit?.('feedback', ['MOVEMENT', 'TRAMPOLINE', 'Vertical boost locked', 'movement', 850]);
        window.dispatchEvent(new CustomEvent('relay:trampoline-bounce', { detail: { scene, x, y, index } }));
      });

      pads.push({ visual, ring, body });
    });

    scene.__relayFinalAuthoredPads = pads;
    scene.__relayFinalAuthoredPadsInstalled = true;
  };

  const installObjectiveStability = () => {
    if (RunnerScene.prototype.__relayFinalObjectiveStability) return;
    const originalUpdate = RunnerScene.prototype.update;
    if (typeof originalUpdate !== 'function') return;
    RunnerScene.prototype.update = function relayFinalStableObjectiveUpdate(...args) {
      const result = originalUpdate.apply(this, args);
      const state = this.__missionObjectiveState;
      if (!state?.c?.active || this.finished || this.firstTimeTutorial || this.cinematicActive || document.body.classList.contains('relay-training-active')) return result;

      const w = this.scale?.gameSize?.width || this.scale?.width || window.innerWidth || 1280;
      const h = this.scale?.gameSize?.height || this.scale?.height || window.innerHeight || 720;
      const mobile = w <= 760;
      const baseW = 426;
      const baseH = 166;
      const panelW = mobile ? Math.min(338, w - 24) : Math.min(470, Math.max(360, w - 64));
      const scale = Math.max(.75, panelW / baseW);
      const actualH = baseH * scale;
      const reserve = mobile ? Math.max(112, Math.round(h * .16)) : 28;
      const x = Math.max(12, w - panelW - (mobile ? 12 : 30));
      const y = Math.max(82, h - actualH - reserve);
      state.x = x;
      state.y = y;
      state.scale = scale;
      state.tutorial = false;
      state.c.setPosition(x, y).setScale(scale);
    };
    RunnerScene.prototype.__relayFinalObjectiveStability = true;
  };

  const bindScene = scene => {
    if (!scene) return;
    requestAnimationFrame(() => {
      scrubSceneLegacy(scene);
      if (scene.mission?.id === 'first-delivery' && !scene.firstTimeTutorial) installAuthoredPads(scene);
    });
  };

  scrubHome();
  scrubDomLegacy();
  ensureFinishActions();
  installObjectiveStability();

  window.addEventListener('relay:runner-scene-ready', event => bindScene(event.detail?.scene || window.__relayRunnerScene), { passive: true });
  window.addEventListener('relay:gameplay-core-ready', () => {
    scrubHome();
    scrubDomLegacy();
    bindScene(window.__relayRunnerScene);
  }, { passive: true });
  window.addEventListener('relay:tutorial-complete', () => {
    const scene = window.__relayRunnerScene;
    if (scene?.mission?.id === 'first-delivery') requestAnimationFrame(() => installAuthoredPads(scene));
    scrubSceneLegacy(scene);
    ensureFinishActions();
  }, { passive: true });
  window.addEventListener('relay:cinematic-unlock', () => {
    const scene = window.__relayRunnerScene;
    if (scene?.mission?.id === 'first-delivery') requestAnimationFrame(() => installAuthoredPads(scene));
  }, { passive: true });
  window.addEventListener('resize', () => { scrubHome(); scrubDomLegacy(); ensureFinishActions(); }, { passive: true });
  window.addEventListener('orientationchange', () => { scrubHome(); scrubDomLegacy(); ensureFinishActions(); }, { passive: true });

  if (document.body) {
    new MutationObserver(() => { scrubHome(); scrubDomLegacy(); ensureFinishActions(); }).observe(document.body, { childList: true, subtree: true });
  }

  if (window.__relayRunnerScene) bindScene(window.__relayRunnerScene);
})();