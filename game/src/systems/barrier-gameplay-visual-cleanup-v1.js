// BARRIER GAMEPLAY VISUAL / SAFETY CLEANUP
// Existing barrier owner. Keeps authored visuals and adds one guarded lethal
// contact path; it does not create new barrier bodies or a new input owner.
(() => {
  'use strict';
  if (window.__relayBarrierGameplayVisualCleanupV118) return;
  window.__relayBarrierGameplayVisualCleanupV118 = true;

  const DEATH_COOLDOWN_MS = 900;

  const keepBarrierVisuals = scene => {
    if (!scene) return;
    const keepGroup = group => group?.getChildren?.().forEach(object => {
      if (!object?.active) return;
      if (object.texture?.key === 'barrier') object.setVisible(true);
      if (object.body) {
        object.body.allowGravity = false;
        object.body.immovable = true;
      }
    });

    keepGroup(scene.barriers);
    keepGroup(scene.movingGates);

    scene.children?.list?.slice().forEach(child => {
      if (!child?.active || child.type !== 'Text') return;
      if (String(child.text || '').includes('BARRIER · VAULT')) child.destroy();
    });
  };

  const bindLethalGroup = (scene, group, hit) => {
    if (!group?.getChildren?.().length || !scene?.physics?.add?.overlap) return null;
    try { return scene.physics.add.overlap(scene.player, group, hit); } catch (error) {
      console.warn('[BarrierCleanupV118] overlap group skipped', error);
      return null;
    }
  };

  const killOnBarrierContact = scene => {
    if (!scene?.physics?.add?.overlap || !scene?.player?.body) return;
    if (scene.__relayBarrierLethalContactV1) return;

    const barriers = scene.barriers;
    const movingGates = scene.movingGates;
    if (!barriers?.getChildren?.().length && !movingGates?.getChildren?.().length) return;

    scene.__relayBarrierLethalContactV1 = true;
    const hit = (_player, barrier) => {
      if (!barrier?.active || scene.finished || scene.respawning) return;
      const now = performance.now();
      if (Number(scene.__relayBarrierDeathUntil || 0) > now) return;
      scene.__relayBarrierDeathUntil = now + DEATH_COOLDOWN_MS;
      try { scene.playerCue?.('BARRIER // CONTACT LETHAL', '#ff5364'); } catch {}
      try { scene.fail?.('BARRIER'); } catch (error) { console.warn('[BarrierCleanupV118] barrier fail skipped', error); }
    };

    scene.__relayBarrierOverlapV1 = [
      bindLethalGroup(scene, barriers, hit),
      bindLethalGroup(scene, movingGates, hit),
    ].filter(Boolean);
  };

  const ready = event => {
    const scene = event?.detail?.scene || window.__relayRunnerScene;
    if (!scene) return;
    keepBarrierVisuals(scene);
    killOnBarrierContact(scene);
    window.setTimeout(() => {
      keepBarrierVisuals(scene);
      killOnBarrierContact(scene);
    }, 0);
  };

  window.addEventListener('relay:runner-scene-ready', ready);
  if (window.__relayRunnerScene) ready({ detail: { scene: window.__relayRunnerScene } });
})();
