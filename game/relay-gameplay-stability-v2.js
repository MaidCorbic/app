import Phaser from 'phaser';

(() => {
  if (typeof window === 'undefined' || window.__relayGameplayStabilityV2) return;
  window.__relayGameplayStabilityV2 = true;

  const STYLE_ID = 'relay-gameplay-stability-v2-style';
  const installStyle = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* Keep the mission objective anchored to the HUD, never animated through the page. */
      #play .hud-route{position:relative!important;transform:none!important;min-height:48px!important;align-self:flex-start!important;}
      #play #objective{display:block!important;min-height:15px!important;opacity:1!important;transform:none!important;transition:none!important;animation:none!important;}
      #play .hud-route *{transform:none!important;animation:none!important;}
      #relayCityUpdateV1,#gameplayEventHud{will-change:auto!important;}
      #intro .info-launcher{pointer-events:auto!important;}
      #intro .info-launcher .faq-launcher{display:inline-flex!important;}
      #intro .info-launcher .info-circle{display:inline-flex!important;}
      /* Remove only the duplicate/legacy title copy; the actual FAQ button remains. */
      #intro .title-secondary [data-relay-info="faq"]{display:none!important;}
      #intro .info-launcher{position:absolute!important;right:18px!important;top:18px!important;display:flex!important;flex-direction:column!important;align-items:flex-end!important;gap:7px!important;}
      #intro .info-launcher .info-circle{order:2!important;}
      #intro .info-launcher .faq-launcher{order:1!important;}
      @media(max-width:700px){#intro .info-launcher{right:12px!important;top:12px!important;gap:6px!important;}}
    `;
    document.head.appendChild(style);
  };

  installStyle();

  const missionIdOf = scene => String(scene?.mission?.id || '').trim();
  const gameplayReady = scene => Boolean(scene?.player?.active && !scene?.firstTimeTutorial && !scene?.cinematicActive && !scene?.finished);
  const missionObjectiveVisible = () => {
    const play = document.getElementById('play');
    if (!play || play.classList.contains('hidden')) return false;
    const intro = document.getElementById('intro');
    if (intro && !intro.classList.contains('hidden')) return false;
    return true;
  };

  const ensureObjectiveStable = () => {
    const objective = document.getElementById('objective');
    if (!objective) return;
    objective.style.transform = 'none';
    objective.style.transition = 'none';
    objective.style.animation = 'none';
    objective.style.opacity = '1';
    if (missionObjectiveVisible()) objective.style.visibility = 'visible';
  };

  const createTrampolineTexture = scene => {
    const key = 'relay-trampoline-v2';
    if (scene.textures.exists(key)) return key;
    const g = scene.make.graphics({ add: false });
    g.fillStyle(0x06111d, 1).fillRoundedRect(2, 5, 72, 16, 6);
    g.lineStyle(2, 0x8df4ff, .95).strokeRoundedRect(2, 5, 72, 16, 6);
    g.fillStyle(0x8df4ff, .10).fillRoundedRect(7, 8, 62, 10, 4);
    g.lineStyle(2.6, 0xffd06e, .96);
    g.lineBetween(10, 17, 18, 9); g.lineBetween(18, 9, 26, 17);
    g.lineBetween(31, 17, 39, 9); g.lineBetween(39, 9, 47, 17);
    g.lineBetween(52, 17, 60, 9); g.lineBetween(60, 9, 68, 17);
    g.fillStyle(0x68e7be, .85).fillCircle(6, 13, 2.3).fillCircle(70, 13, 2.3);
    g.generateTexture(key, 76, 26); g.destroy();
    return key;
  };

  const disposeTrampolines = scene => {
    if (!scene?.__relayGameplayStabilityTrampolines) return;
    scene.__relayGameplayStabilityTrampolines.forEach(item => {
      try { item.body?.destroy?.(); } catch {}
      try { item.visual?.destroy?.(); } catch {}
      try { item.ring?.destroy?.(); } catch {}
    });
    scene.__relayGameplayStabilityTrampolines = [];
  };

  const exactFirstDeliveryPoints = scene => {
    const authored = Array.isArray(scene?.mission?.boostPads) ? scene.mission.boostPads : [];
    if (authored.length) return authored.map(([x, y]) => [Number(x), Number(y)]).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
    return [];
  };

  const installTrampolines = scene => {
    if (!scene || missionIdOf(scene) !== 'first-delivery' || !gameplayReady(scene)) return;
    const points = exactFirstDeliveryPoints(scene);
    if (!points.length || !scene.physics?.add?.staticImage || !scene.physics?.add?.existing) return;
    if (scene.__relayGameplayStabilityTrampolines?.length === points.length) return;

    disposeTrampolines(scene);
    const texture = createTrampolineTexture(scene);
    scene.__relayGameplayStabilityTrampolines = [];

    points.forEach(([x, y], index) => {
      const visual = scene.add.image(x, y - 2, texture).setDepth(8).setAlpha(.98);
      const ring = scene.add.circle(x, y - 2, 24, 0x8df4ff, .03).setStrokeStyle(1.5, 0x8df4ff, .38).setDepth(7);
      scene.tweens?.add?.({ targets: ring, scale: 1.18, alpha: .06, duration: 820 + index * 110, repeat: -1, yoyo: true, ease: 'Sine.inOut' });

      const body = scene.add.rectangle(x, y, 74, 22, 0x000000, 0);
      scene.physics.add.existing(body, true);
      body.setVisible(false);
      body.__relayBounceAt = 0;

      scene.physics.add.overlap(scene.player, body, () => {
        if (!gameplayReady(scene)) return;
        const now = performance.now();
        if (now - body.__relayBounceAt < 280) return;
        body.__relayBounceAt = now;
        const vx = Number(scene.player?.body?.velocity?.x || 0);
        scene.player.body.setVelocityY?.(-900);
        scene.player.body.setVelocityX?.(Math.max(vx, 390));
        visual.setScale(1.10, .78);
        ring.setScale(1.05); ring.setAlpha(.32);
        scene.tweens?.add?.({ targets: visual, scaleX: 1, scaleY: 1, duration: 170, ease: 'Back.easeOut' });
        scene.tweens?.add?.({ targets: ring, scale: 1.55, alpha: 0, duration: 260, ease: 'Cubic.out' });
        scene.game?.events?.emit?.('feedback', ['MOVEMENT', 'TRAMPOLINE', 'Vertical boost locked', 'movement', 850]);
        window.dispatchEvent(new CustomEvent('relay:trampoline-bounce', { detail: { scene, x, y, index } }));
      });

      scene.__relayGameplayStabilityTrampolines.push({ visual, ring, body });
    });
  };

  const cleanupLegacyLevelText = () => {
    const selectors = [
      '#intro .menu-version', '#intro .city-pulse-status', '#intro .main-menu-footer',
      '#play .legacy-system-status', '#play .legacy-night-run-status'
    ];
    document.querySelectorAll(selectors.join(',')).forEach(el => { el.hidden = true; el.style.display = 'none'; });

    const legacy = /^(?:SYSTEM ONLINE|RELAY RUNNER\s*(?:\/\/|—|-)?\s*(?:NETWORK|STANDBY)|NIGHT RUN\s*(?:\/\/|·|-)?\s*CHAPTER\s*0?1|CHAPTER\s*0?1\s*(?:\/\/|·|-)?\s*NIGHT SHIFT)$/i;
    document.querySelectorAll('#intro *,#play *').forEach(el => {
      if (el.children.length) return;
      const text = String(el.textContent || '').trim().replace(/\s+/g, ' ');
      if (legacy.test(text)) { el.hidden = true; el.style.display = 'none'; }
    });
  };

  const cleanupSceneText = scene => {
    const legacy = /^(?:SYSTEM ONLINE|RELAY RUNNER\s*(?:\/\/|—|-)?\s*(?:NETWORK|STANDBY)|NIGHT RUN\s*(?:\/\/|·|-)?\s*CHAPTER\s*0?1|CHAPTER\s*0?1\s*(?:\/\/|·|-)?\s*NIGHT SHIFT)$/i;
    const walk = list => list?.forEach(obj => {
      if (typeof obj?.text === 'string' && legacy.test(obj.text.trim())) obj.setVisible?.(false);
      if (Array.isArray(obj?.list)) walk(obj.list);
    });
    walk(scene?.children?.list);
  };

  const scheduleSceneFix = scene => {
    window.setTimeout(() => {
      installTrampolines(scene);
      cleanupLegacyLevelText();
      cleanupSceneText(scene);
      ensureObjectiveStable();
    }, 0);
  };

  window.addEventListener('relay:runner-scene-ready', event => scheduleSceneFix(event.detail?.scene || window.__relayRunnerScene), { passive: true });
  window.addEventListener('relay:gameplay-core-ready', () => scheduleSceneFix(window.__relayRunnerScene), { passive: true });
  window.addEventListener('relay:tutorial-complete', () => scheduleSceneFix(window.__relayRunnerScene), { passive: true });
  window.addEventListener('relay:cinematic-unlock', () => scheduleSceneFix(window.__relayRunnerScene), { passive: true });
  window.addEventListener('resize', ensureObjectiveStable, { passive: true });
  window.addEventListener('orientationchange', ensureObjectiveStable, { passive: true });

  if (document.body) {
    new MutationObserver(mutations => {
      if (mutations.some(m => m.addedNodes.length || m.type === 'attributes')) {
        cleanupLegacyLevelText();
        ensureObjectiveStable();
      }
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
  }

  cleanupLegacyLevelText();
  ensureObjectiveStable();
})();
