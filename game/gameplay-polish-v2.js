import './gameplay-polish-v2.css';
import { RunnerScene } from './src/scenes/RunnerScene.js';

/* ============================================================
   RELAY RUNNER — GAMEPLAY POLISH V2
   Senior coordination layer.

   Owns only:
   - browser favicon wiring
   - spawn / respawn safety window
   - safe respawn relocation near map edges
   - randomized airstrike placement
   - top-world-boundary death rule
   - mission objective desktop legibility
   - small magnetic/polarity usability enhancement

   Existing gameplay systems remain authoritative.
   ============================================================ */

(() => {
  'use strict';

  const INSTALL_KEY = '__relayGameplayPolishV2Installed';
  if (window[INSTALL_KEY]) return;
  window[INSTALL_KEY] = true;

  const CFG = Object.freeze({
    spawnShieldMs: 6500,
    respawnShieldMs: 2800,
    respawnEdgeMargin: 220,
    respawnEdgeNudge: 150,
    topDeathBuffer: 42,
    airstrikePlayerTargetChance: 0.34,
    airstrikePlayerExclusion: 260,
    airstrikeSpawnExclusion: 380,
    airstrikeMarginX: 120,
    airstrikeMinY: 80,
    airstrikeMaxYFallback: 690,
    missionDesktopScale: 1.12,
    polarityPulseRange: 220,
    polarityPulseForce: 26,
    polarityPulseCooldownMs: 180,
  });

  const finite = (value, fallback = 0) =>
    Number.isFinite(Number(value)) ? Number(value) : fallback;

  const worldBounds = scene => scene?.physics?.world?.bounds || null;

  const shieldActive = scene =>
    finite(scene?.time?.now) < finite(scene?.__relaySpawnShieldUntil);

  const setSpawnShield = (scene, duration) => {
    if (!scene) return;
    const until = finite(scene.time?.now) + Math.max(0, duration);
    scene.__relaySpawnShieldUntil = until;
    // Existing damage systems already consult these values, so keep the
    // canonical scene-level grace state synchronized instead of adding a
    // second damage pipeline.
    scene.healthInvulnerable = Math.max(
      finite(scene.healthInvulnerable),
      Math.max(0, duration)
    );
    scene.respawnGrace = Math.max(
      finite(scene.respawnGrace),
      Math.min(Math.max(0, duration), CFG.respawnShieldMs)
    );
    scene.__relaySpawnProtectionUntil = Math.max(
      finite(scene.__relaySpawnProtectionUntil),
      until
    );
  };

  const safeSpawnPoint = scene => {
    const player = scene?.player;
    const bounds = worldBounds(scene);
    if (!player || !bounds) return null;

    const width = finite(bounds.width, 6280);
    const minX = finite(bounds.x) + CFG.respawnEdgeMargin;
    const maxX = finite(bounds.x) + Math.max(CFG.respawnEdgeMargin, width - CFG.respawnEdgeMargin);
    let x = finite(scene?.checkpoint?.x, finite(player.x, 360));

    if (x < minX) x = minX + CFG.respawnEdgeNudge;
    if (x > maxX) x = maxX - CFG.respawnEdgeNudge;

    x = Math.max(minX, Math.min(maxX, x));
    const y = finite(scene?.checkpoint?.y, finite(player.y, 520));

    return { x, y };
  };

  function relocatePlayerSafely(scene) {
    const player = scene?.player;
    const point = safeSpawnPoint(scene);
    if (!player || !point) return;

    const moved = Math.abs(finite(player.x) - point.x) > 2;
    player.setPosition?.(point.x, point.y);
    player.body?.reset?.(point.x, point.y);
    player.body?.setVelocity?.(0, 0);

    if (scene.checkpoint && moved) {
      scene.checkpoint = {
        ...scene.checkpoint,
        x: point.x,
        y: point.y,
      };
    }
  }

  function chooseRandomStrike(scene, latestZone) {
    const player = scene?.player;
    const bounds = worldBounds(scene);
    if (!player || !latestZone || !bounds) return;

    const width = finite(bounds.width, 6280);
    const height = finite(bounds.height, 720);
    const left = finite(bounds.x) + CFG.airstrikeMarginX;
    const right = finite(bounds.x) + Math.max(CFG.airstrikeMarginX, width - CFG.airstrikeMarginX);
    const minY = Math.max(finite(bounds.y) + CFG.airstrikeMinY, CFG.airstrikeMinY);
    const maxY = Math.max(minY + 40, Math.min(finite(bounds.y) + CFG.airstrikeMaxYFallback, height - 90));

    // Keep a minority of strikes player-directed. Even those receive a small
    // random offset so the telegraph is never a deterministic hit point.
    const targetsPlayer = Math.random() < CFG.airstrikePlayerTargetChance;

    let x;
    let y;

    if (targetsPlayer) {
      x = finite(player.x) + (Math.random() * 2 - 1) * 150;
      y = finite(player.y) + (Math.random() * 2 - 1) * 32;
    } else {
      // Remote strike: sample the whole operational area while explicitly
      // rejecting the player's immediate vicinity.
      let accepted = false;
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const candidateX = left + Math.random() * Math.max(1, right - left);
        const candidateY = minY + Math.random() * Math.max(1, maxY - minY);
        const dx = candidateX - finite(player.x);
        const dy = candidateY - finite(player.y);
        const fromPlayer = Math.hypot(dx, dy);
        const fromSpawn = Math.hypot(candidateX - finite(scene?.checkpoint?.x, player.x), candidateY - finite(scene?.checkpoint?.y, player.y));
        if (fromPlayer >= CFG.airstrikePlayerExclusion || fromSpawn >= CFG.airstrikeSpawnExclusion) {
          x = candidateX;
          y = candidateY;
          accepted = true;
          break;
        }
      }
      if (!accepted) {
        x = left + Math.random() * Math.max(1, right - left);
        y = minY + Math.random() * Math.max(1, maxY - minY);
      }
    }

    x = Math.max(left, Math.min(right, x));
    y = Math.max(minY, Math.min(maxY, y));

    latestZone.x = x;
    latestZone.y = y;
    latestZone.zone?.setPosition?.(x, y);
  }

  function installStrikeRandomizer(scene) {
    if (!scene?.events || scene.__relayStrikeRandomizerInstalled) return;
    scene.__relayStrikeRandomizerInstalled = true;

    scene.events.on('drone:strike-warning', () => {
      try {
        const zones = Array.isArray(scene.__droneZones) ? scene.__droneZones : [];
        const latest = zones[zones.length - 1];
        chooseRandomStrike(scene, latest);
      } catch {}
    });
  }

  function enhancePolarity(scene) {
    if (!scene?.player || scene.__relayPolarityAssistInstalled) return;
    scene.__relayPolarityAssistInstalled = true;
    scene.__relayPolarityLastPulse = 0;

    scene.events?.on?.('shutdown', () => {
      scene.__relayPolarityAssistInstalled = false;
    });

    // The existing V2 magnetic system exposes its live state through the
    // scene namespace. We add only a restrained proximity impulse so the
    // polarity choice has immediate, readable gameplay feedback without
    // replacing the current magnetic solver.
    const originalUpdate = scene.update;
    if (typeof originalUpdate !== 'function' || scene.__relayPolarityUpdateWrapped) return;
    // RunnerScene.update is wrapped globally below; this per-scene marker is
    // only used to make the assist idempotent.
    scene.__relayPolarityUpdateWrapped = true;
  }

  function applyPolarityAssist(scene) {
    const st = scene?.__relayGameplayExpansionV2Safe;
    const magnetic = st?.entities?.magnetic;
    const player = scene?.player;
    if (!magnetic || !player || !player.body) return;

    const now = finite(scene.time?.now);
    if (now - finite(scene.__relayPolarityLastPulse) < CFG.polarityPulseCooldownMs) return;

    const polarity = finite(st.polarity, 1) >= 0 ? 1 : -1;
    const sourceList = Array.isArray(magnetic.sources)
      ? magnetic.sources
      : Array.isArray(magnetic)
        ? magnetic
        : [];

    let nearest = null;
    let bestDistance = Infinity;

    for (const entry of sourceList) {
      const source = entry?.source || entry;
      if (!source?.active) continue;
      const dx = finite(source.x) - finite(player.x);
      const dy = finite(source.y) - finite(player.y);
      const distance = Math.hypot(dx, dy);
      if (distance > CFG.polarityPulseRange || distance >= bestDistance) continue;
      nearest = { source, dx, dy, distance };
      bestDistance = distance;
    }

    if (!nearest || bestDistance < 18) return;

    const sourcePolarity = finite(nearest.source.getData?.('polarity'), 1) >= 0 ? 1 : -1;
    const samePolarity = sourcePolarity === polarity;
    const direction = Math.sign(nearest.dx) || 1;
    const strength = Math.max(0, 1 - nearest.distance / CFG.polarityPulseRange);
    const impulse = CFG.polarityPulseForce * strength;

    // Same poles repel; opposite poles attract. The effect is deliberately
    // small so it complements manual movement instead of hijacking it.
    const signed = samePolarity ? -direction : direction;
    player.body.velocity.x += signed * impulse;
    scene.__relayPolarityLastPulse = now;
  }

  function polishMissionHud(scene) {
    if (!scene?.__missionObjectiveState?.c || scene.scale?.width <= 760) return;
    const state = scene.__missionObjectiveState;
    const w = finite(scene.scale.gameSize?.width, finite(scene.scale.width, window.innerWidth));
    const h = finite(scene.scale.gameSize?.height, finite(scene.scale.height, window.innerHeight));
    const baseScale = Math.max(1, finite(state.scale, 1));
    const scale = Math.max(baseScale, CFG.missionDesktopScale);
    const panelW = 420 * scale;
    const panelH = 178 * scale;
    const x = Math.max(18, w - panelW - 30);
    const y = Math.max(70, h - panelH - 24);
    state.c.setScale?.(scale).setPosition?.(x, y);
  }

  function installSceneHooks() {
    if (!RunnerScene?.prototype || RunnerScene.prototype.__relayGameplayPolishV2) return;
    RunnerScene.prototype.__relayGameplayPolishV2 = true;

    const originalCreate = RunnerScene.prototype.create;
    const originalUpdate = RunnerScene.prototype.update;
    const originalRespawn = RunnerScene.prototype.respawnCheckpoint;
    const originalFail = RunnerScene.prototype.fail;

    if (typeof originalCreate === 'function') {
      RunnerScene.prototype.create = function (...args) {
        const result = originalCreate.apply(this, args);

        setSpawnShield(this, CFG.spawnShieldMs);
        relocatePlayerSafely(this);
        installStrikeRandomizer(this);
        enhancePolarity(this);

        return result;
      };
    }

    if (typeof originalRespawn === 'function') {
      RunnerScene.prototype.respawnCheckpoint = function (...args) {
        const result = originalRespawn.apply(this, args);
        setSpawnShield(this, CFG.respawnShieldMs);
        relocatePlayerSafely(this);
        return result;
      };
    }

    if (typeof originalFail === 'function') {
      RunnerScene.prototype.fail = function (...args) {
        if (shieldActive(this)) return;
        return originalFail.apply(this, args);
      };
    }

    if (typeof originalUpdate === 'function') {
      RunnerScene.prototype.update = function (...args) {
        const result = originalUpdate.apply(this, args);

        const player = this.player;
        if (!player || this.finished) return result;

        polishMissionHud(this);
        applyPolarityAssist(this);

        if (!this.respawning && !this.cinematicActive && !shieldActive(this)) {
          const bounds = worldBounds(this);
          const bodyTop = finite(player.body?.top, finite(player.y) - finite(player.displayHeight, 64) * 0.5);
          const deathY = finite(bounds?.y) + CFG.topDeathBuffer;

          if (bodyTop <= deathY) {
            try {
              this.fail('UPPER BOUNDARY');
            } catch {}
          }
        }

        return result;
      };
    }
  }

  function installFavicon() {
    const head = document.head;
    if (!head) return;

    const existing = head.querySelector('link[data-relay-gameplay-favicon]');
    if (existing) return;

    const links = [
      { rel: 'icon', type: 'image/x-icon', href: './assets/favicon.ico' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: './assets/favicon-32x32.png' },
      { rel: 'apple-touch-icon', sizes: '180x180', href: './assets/apple-touch-icon.png' },
    ];

    for (const spec of links) {
      const link = document.createElement('link');
      Object.assign(link, spec);
      link.dataset.relayGameplayFavicon = '1';
      head.appendChild(link);
    }
  }

  installFavicon();
  installSceneHooks();
})();
