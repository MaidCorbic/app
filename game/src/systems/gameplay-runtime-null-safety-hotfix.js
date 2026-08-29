// Runtime null-safety for legacy V2/V4 gameplay systems.
// Fixes scene-transition/destruction races without changing gameplay controls.
const V2 = '__relayGameplayExpansionV2Safe';
const V4 = '__relayGameplayExpansionV4Safe';
const NS = '__relayGameplayRuntimeNullSafety';

function isLive(node) {
  return !!node && node.active !== false && !node.destroyed;
}

function sanitizeV2(scene) {
  const state = scene?.[V2];
  if (!state || state.destroyed) return;

  const conveyor = state.entities?.conveyor;
  if (conveyor?.belts) {
    conveyor.belts = conveyor.belts.filter((entry) => {
      const belt = entry?.belt;
      if (!isLive(belt)) return false;
      // V2 update reads belt.data.values directly. A destroyed Phaser object can
      // lose its DataManager between frames, so never leave such an entry behind.
      if (!belt.data?.values) return false;
      return true;
    });
  }

  const magnetic = state.entities?.magnetic;
  if (magnetic?.sources) {
    magnetic.sources = magnetic.sources.filter((entry) => isLive(entry?.source));
  }
  if (magnetic?.cargo) {
    magnetic.cargo = magnetic.cargo.filter((cargo) => isLive(cargo));
  }
}

function sanitizeV4(scene) {
  const state = scene?.[V4];
  if (!state || state.destroyed) return;
  const entities = state.entities;
  if (!entities) return;

  const echo = entities.echoScan;
  if (echo && (!isLive(echo.pulse) || !echo.pulse.geom || !isLive(echo.node))) {
    delete entities.echoScan;
  }

  const sonic = entities.sonicPushPull;
  if (sonic && (!isLive(sonic.ring) || !sonic.ring.geom || !isLive(sonic.node))) {
    delete entities.sonicPushPull;
  }

  for (const key of ['surfacePhysics', 'temperatureSystem', 'objectDuplication', 'trajectoryPreview', 'remoteCamera', 'objectRotation', 'surfacePhaseMarking', 'impactBanking']) {
    const entry = entities[key];
    if (!entry) continue;
    const nodes = Object.values(entry).flatMap((value) => Array.isArray(value) ? value : [value]);
    if (nodes.some((value) => value && typeof value === 'object' && 'active' in value && !isLive(value))) {
      delete entities[key];
    }
  }
}

export function installGameplayRuntimeNullSafety(SceneClass) {
  if (!SceneClass?.prototype || SceneClass.prototype[NS]) return;
  SceneClass.prototype[NS] = true;
  const originalUpdate = SceneClass.prototype.update;
  SceneClass.prototype.update = function gameplayRuntimeNullSafetyUpdate(time, delta, ...args) {
    try {
      sanitizeV2(this);
      sanitizeV4(this);
    } catch (error) {
      console.warn('[Relay] Runtime null-safety isolated:', error);
    }
    return originalUpdate.apply(this, [time, delta, ...args]);
  };
}
