import { RunnerScene } from '../scenes/RunnerScene.js';

/*
 * RELAY RUNNER — FULL GAMEPLAY ROADMAP INTEGRATION V1
 *
 * This file is a coordinator for the roadmap only.
 * It does NOT replace existing owners:
 * - world interaction -> world-interaction-v1 / dynamic-world-mechanics
 * - route choice -> gameplay-route-choice-v2
 * - dynamic events -> dynamic-encounter-events-v1
 * - flow/near-miss/ghost -> gameplay-new-layer-v1/v2 + ghost-run-v1
 * - stealth/progression -> existing detection/deep-integration systems
 * - environmental collapse -> existing collapse/earthquake/route-mutation systems
 *
 * New ownership in this file:
 * 1) adaptive pursuit pressure
 * 2) differentiated enemy archetype behaviour on top of existing AI
 *
 * The systems are additive and guarded so they cannot install twice.
 */

const ARCHETYPES = Object.freeze({
  tracker:    { label: 'TRACKER',    range: 300, speed: 1.08, stop: 58 },
  interceptor:{ label: 'INTERCEPTOR',range: 360, speed: 1.22, stop: 48 },
  blocker:   { label: 'BLOCKER',   range: 250, speed: .72, stop: 28 },
  disruptor: { label: 'DISRUPTOR', range: 330, speed: .94, stop: 64 },
  sniper:    { label: 'SNIPER',    range: 520, speed: .15, stop: 260 },
  drone:     { label: 'DRONE',     range: 420, speed: 1.14, stop: 90 },
});

const GROUND_ARCHETYPE_BY_TYPE = Object.freeze({
  guard: 'tracker',
  security: 'sniper',
  'enemy-runner': 'interceptor',
  dino: 'blocker',
  'alien-ground': 'disruptor',
  chicken: 'tracker',
});

const THREAT_ARCHETYPE_BY_TYPE = Object.freeze({
  invader: 'drone',
});

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getType = actor =>
  actor?.getData?.('route')?.type ||
  actor?.getData?.('enemyType') ||
  actor?.texture?.key ||
  'unknown';

const getPlayer = scene => scene?.player || scene?.runner || null;

const getEnemies = scene => {
  const groups = [
    scene?.enemies,
    scene?.hostiles,
    scene?.enemyGroup,
    scene?.security,
  ];

  for (const group of groups) {
    const children = group?.getChildren?.();
    if (children?.length) {
      return children.filter(enemy =>
        enemy?.active !== false &&
        enemy?.body?.enable !== false
      );
    }
  }

  return [];
};

const getThreats = scene => {
  const groups = [
    scene?.sciFiThreats,
    scene?.threats,
    scene?.invaders,
  ];

  for (const group of groups) {
    const children = group?.getChildren?.();
    if (children?.length) {
      return children.filter(enemy =>
        enemy?.active !== false &&
        enemy?.body?.enable !== false
      );
    }
  }

  return [];
};

function installArchetypeMetadata(scene) {
  const actors = [
    ...getEnemies(scene),
    ...getThreats(scene),
  ];

  for (const actor of actors) {
    if (actor.getData('roadmapArchetype')) continue;

    const type = getType(actor);
    const archetype =
      GROUND_ARCHETYPE_BY_TYPE[type] ||
      THREAT_ARCHETYPE_BY_TYPE[type];

    if (!archetype || !ARCHETYPES[archetype]) continue;

    actor.setData('roadmapArchetype', archetype);
    actor.setData(
      'roadmapArchetypeLabel',
      ARCHETYPES[archetype].label
    );
  }
}

function sameHeight(a, b) {
  return Math.abs((a?.y || 0) - (b?.y || 0)) < 76;
}

function updateArchetype(scene, actor, delta, pressure) {
  const archetypeId =
    actor.getData('roadmapArchetype');

  const profile =
    ARCHETYPES[archetypeId];

  if (!profile) return;

  /*
   * Movement remains owned by enemy-ai-final. We only publish a
   * per-enemy profile that that authoritative AI consumes. This
   * prevents two systems from fighting over body.velocity.
   */
  actor.setData('roadmapAI', {
    range: profile.range,
    stop: profile.stop,
    chaseMultiplier: profile.speed * (1 + pressure * .32),
    patrolMultiplier: profile.speed,
    pressure,
  });

  const player = getPlayer(scene);

  if (!profile || !player || !actor?.body) return;

  const dx = player.x - actor.x;
  const dy = player.y - actor.y;
  const distance = Math.abs(dx);
  const visible =
    distance <= profile.range &&
    Math.abs(dy) <= 105 &&
    sameHeight(actor, player);

  const disabled =
    Number(scene.empTimer || 0) > 0 ||
    Number(scene.decoyTimer || 0) > 0;

  if (disabled || !visible) return;

  if (archetypeId === 'disruptor') {
    if (
      distance < 190 &&
      Math.abs(
        player.body?.velocity?.x || 0
      ) > 180
    ) {
      actor.setData(
        'awarenessState',
        'disrupt'
      );
      actor.setData(
        'roadmapDisruptAt',
        scene.elapsedMs || performance.now()
      );
    }
  }

  if (archetypeId === 'sniper') {
    if (
      distance >= 260 &&
      distance <= 520
    ) {
      actor.setData(
        'awarenessState',
        'suppress'
      );

      const now =
        scene.elapsedMs ||
        performance.now();

      const last =
        Number(
          actor.getData(
            'roadmapWarningAt'
          )
        ) || 0;

      if (now - last > 3600) {
        actor.setData(
          'roadmapWarningAt',
          now
        );

        scene.game?.events?.emit?.(
          'feedback',
          'warning'
        );

        scene.game?.events?.emit?.(
          'relay:enemy-archetype',
          {
            type: 'sniper',
            label: 'SNIPER',
          }
        );
      }
    }
  }

  if (archetypeId === 'drone') {
    actor.setData(
      'awarenessState',
      Math.abs(dy) > 34 ? 'track-vertical' : 'track'
    );
  }
}

function createPursuitState(scene) {
  return {
    heat: 0,
    lastDetection: 0,
    lastPulse: 0,
    lockdownUntil: 0,
    lastBanner: '',
  };
}

function showPursuitBanner(scene, title, detail) {
  if (!scene.add || !scene.scale) return;

  const existing =
    scene.__roadmapPursuitBanner;

  existing?.destroy?.();

  const container =
    scene.add
      .container(
        scene.scale.width / 2,
        92
      )
      .setScrollFactor(0)
      .setDepth(9200)
      .setAlpha(0);

  const panel =
    scene.add
      .rectangle(
        0,
        0,
        410,
        68,
        0x07111f,
        .95
      )
      .setStrokeStyle(
        1,
        0x38bdf8,
        .8
      );

  const titleText =
    scene.add
      .text(
        0,
        -12,
        title,
        {
          fontFamily:
            'Arial, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
          color: '#e8f8ff',
        }
      )
      .setOrigin(.5);

  const detailText =
    scene.add
      .text(
        0,
        14,
        detail,
        {
          fontFamily:
            'Arial, sans-serif',
          fontSize: '9px',
          color: '#8ecae6',
          letterSpacing: 1.2,
        }
      )
      .setOrigin(.5);

  container.add([
    panel,
    titleText,
    detailText,
  ]);

  scene.__roadmapPursuitBanner =
    container;

  scene.tweens?.add({
    targets: container,
    alpha: 1,
    y: 106,
    duration: 180,
    ease: 'Quad.easeOut',
    yoyo: true,
    hold: 1700,
    onComplete: () => {
      container.destroy();
      if (
        scene.__roadmapPursuitBanner ===
        container
      ) {
        scene.__roadmapPursuitBanner =
          null;
      }
    },
  });
}

function updatePursuit(scene, delta) {
  const state =
    scene.__roadmapPursuitState;

  if (!state) return;

  const dt =
    clamp(
      Number(delta || 16.667),
      0,
      50
    ) / 1000;

  const now =
    Number(scene.elapsedMs) ||
    performance.now();

  /*
   * Heat naturally decays. Existing detection/alarm events push
   * it upward, so this is a pressure layer rather than a second
   * stealth system.
   */
  const alertState = String(scene.enemyAlertState || 'CLEAR');
  if (alertState === 'SUSPICIOUS') state.heat = clamp(state.heat + 3.5 * dt, 0, 100);
  if (alertState === 'ALERT') state.heat = clamp(state.heat + 11 * dt, 0, 100);
  state.heat = clamp(state.heat - 5.5 * dt, 0, 100);

  const pressure =
    state.heat / 100;

  installArchetypeMetadata(scene);

  [
    ...getEnemies(scene),
    ...getThreats(scene),
  ].forEach(actor =>
    updateArchetype(
      scene,
      actor,
      delta,
      pressure
    )
  );

  if (
    state.heat >= 82 &&
    state.lockdownUntil < now
  ) {
    state.lockdownUntil =
      now + 5200;

    showPursuitBanner(
      scene,
      'LOCKDOWN',
      'INTERCEPTOR PRESSURE MAXIMUM · BREAK LINE OF SIGHT'
    );

    scene.game?.events?.emit?.(
      'relay:pursuit-lockdown',
      {
        heat: state.heat,
        duration: 5200,
      }
    );
  }

  if (
    state.heat >= 55 &&
    now - state.lastPulse > 1800
  ) {
    state.lastPulse = now;

    scene.game?.events?.emit?.(
      'relay:pursuit-pressure',
      {
        heat: state.heat,
        level: 'HIGH',
      }
    );
  }

  if (
    state.heat >= 25 &&
    state.lastBanner !== 'PURSUIT'
  ) {
    state.lastBanner = 'PURSUIT';

    showPursuitBanner(
      scene,
      'PURSUIT ACTIVE',
      'INTERCEPTORS ARE READING YOUR ROUTE'
    );
  }

  if (
    state.heat < 15 &&
    state.lastBanner !== 'CLEAR'
  ) {
    state.lastBanner = 'CLEAR';
  }
}

function bindPursuitEvents(scene) {
  const gameEvents =
    scene.game?.events;

  if (!gameEvents) return;

  if (scene.__roadmapPursuitHandlers) {
    return;
  }

  const onDetection = timer => {
    const value =
      Number(timer) || 0;

    const state =
      scene.__roadmapPursuitState;

    if (!state) return;

    state.lastDetection =
      performance.now();

    /*
     * Existing detection timer is the authority. We only derive
     * pursuit heat from it.
     */
    state.heat = clamp(
      state.heat +
        (value
          ? 18 + Math.min(24, value * .7)
          : 4),
      0,
      100
    );
  };

  const onAlarm = () => {
    const state =
      scene.__roadmapPursuitState;

    if (!state) return;

    state.heat = clamp(
      state.heat + 24,
      0,
      100
    );
  };

  const onEnemyAlert = stateName => {
    if (stateName === 'SUSPICIOUS') onDetection(8);
    if (stateName === 'ALERT') onDetection(26);
  };
  const onChase = active => {
    if (active) onAlarm();
  };

  const onVarietyRoute = detail => {
    if (
      detail?.route === 'hot' ||
      detail?.risk === 'HIGH PRESSURE'
    ) {
      const state = scene.__roadmapPursuitState;
      if (state) {
        state.heat = clamp(state.heat + 14, 0, 100);
      }
    }
  };

  const onTransientReset = event => {
    if (event?.detail?.scene !== scene) return;
    const state = scene.__roadmapPursuitState;
    if (!state) return;
    state.heat = 0;
    state.lastDetection = 0;
    state.lastPulse = 0;
    state.lockdownUntil = 0;
    state.lastBanner = 'CLEAR';
    scene.__roadmapPursuitBanner?.destroy?.();
    scene.__roadmapPursuitBanner = null;
    for (const actor of [...getEnemies(scene), ...getThreats(scene)]) {
      actor.removeData?.('awarenessState');
      actor.removeData?.('roadmapDisruptAt');
      actor.removeData?.('roadmapWarningAt');
    }
  };
  gameEvents.on('detection', onDetection);
  gameEvents.on('enemy-alert', onEnemyAlert);
  gameEvents.on('alarm', onAlarm);
  gameEvents.on('chase', onChase);

  gameEvents.on('relay:variety-route', onVarietyRoute);
  window.addEventListener?.('relay:runner-transient-reset', onTransientReset);

  scene.__roadmapPursuitHandlers = {
    onDetection,
    onEnemyAlert,
    onAlarm,
    onChase,
    onVarietyRoute,
    onTransientReset,
  };
}

function cleanupPursuit(scene) {
  const events =
    scene.game?.events;

  const handlers =
    scene.__roadmapPursuitHandlers;

  if (
    events &&
    handlers
  ) {
    events.off('detection', handlers.onDetection);
    events.off('enemy-alert', handlers.onEnemyAlert);
    events.off('alarm', handlers.onAlarm);
    events.off('chase', handlers.onChase);
    events.off('relay:variety-route', handlers.onVarietyRoute);
  }

  window.removeEventListener?.(
    'relay:runner-transient-reset',
    handlers?.onTransientReset
  );

  scene.__roadmapPursuitHandlers =
    null;

  scene.__roadmapPursuitState =
    null;

  scene.__roadmapPursuitBanner
    ?.destroy?.();

  scene.__roadmapPursuitBanner =
    null;
}

export function installFullGameplayRoadmapV1(
  SceneClass = RunnerScene
) {
  if (
    !SceneClass?.prototype ||
    SceneClass.prototype
      .__fullGameplayRoadmapV1
  ) {
    return;
  }

  const prototype =
    SceneClass.prototype;

  const originalCreate =
    prototype.create;

  const originalUpdate =
    prototype.update;

  const originalShutdown =
    prototype.shutdown;

  prototype.create =
    function fullGameplayRoadmapCreate(
      ...args
    ) {
      const result =
        originalCreate?.apply(
          this,
          args
        );

      try {
        this.__roadmapPursuitState =
          createPursuitState(
            this
          );

        bindPursuitEvents(this);
        installArchetypeMetadata(
          this
        );
      } catch (error) {
        console.error(
          '[FullGameplayRoadmap] create failed',
          error
        );
      }

      return result;
    };

  prototype.update =
    function fullGameplayRoadmapUpdate(
      ...args
    ) {
      const result =
        originalUpdate?.apply(
          this,
          args
        );

      try {
        updatePursuit(
          this,
          args[0]
        );
      } catch (error) {
        console.error(
          '[FullGameplayRoadmap] update failed',
          error
        );
      }

      return result;
    };

  prototype.shutdown =
    function fullGameplayRoadmapShutdown(
      ...args
    ) {
      try {
        cleanupPursuit(this);
      } catch (error) {
        console.error(
          '[FullGameplayRoadmap] shutdown failed',
          error
        );
      }

      return originalShutdown?.apply(
        this,
        args
      );
    };

  prototype.__fullGameplayRoadmapV1 =
    true;
}


if (typeof window !== 'undefined') {
  installFullGameplayRoadmapV1(RunnerScene);
}
