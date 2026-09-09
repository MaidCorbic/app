// Canonical faction registry for live enemy encounters.
// Only current enemy types from enemy-intel.js are mapped here.
// Story-only factions can be expanded later without changing combat.

export const factions = Object.freeze({
  HELIX_SECURITY: Object.freeze({
    id: 'HELIX_SECURITY',
    name: 'HELIX SECURITY',
    role: 'Corporate security and relay enforcement.',
    enemyTypes: Object.freeze([
      'enemy-runner',
      'security',
      'guard',
      'sentinel-boss',
      'apex-boss',
    ]),
    radioStyle: 'controlled',
  }),

  FERAL_THREATS: Object.freeze({
    id: 'FERAL_THREATS',
    name: 'FERAL THREATS',
    role: 'Uncontrolled hostile fauna occupying live routes.',
    enemyTypes: Object.freeze([
      'chicken',
      'dino',
      'dino-boss',
    ]),
    radioStyle: 'instinctive',
  }),

  SKY_RAIDERS: Object.freeze({
    id: 'SKY_RAIDERS',
    name: 'SKY RAIDERS',
    role: 'Aerial hostile units controlling exposed air lanes.',
    enemyTypes: Object.freeze([
      'invader',
    ]),
    radioStyle: 'tactical',
  }),

  GRID_GHOSTS: Object.freeze({
    id: 'GRID_GHOSTS',
    name: 'GRID GHOSTS',
    role: 'Unknown relay-born entities operating through the network.',
    enemyTypes: Object.freeze([
      'alien-ground',
      'storm-boss',
    ]),
    radioStyle: 'distorted',
  }),

  MARA_RUNNERS: Object.freeze({
    id: 'MARA_RUNNERS',
    name: "MARA'S RUNNERS",
    role: 'Rival courier network linked to Mara Vex.',
    enemyTypes: Object.freeze([]),
    radioStyle: 'provocative',
    storyOnly: true,
  }),
});

const enemyFactionPairs = Object.entries(factions)
  .flatMap(([factionId, faction]) =>
    faction.enemyTypes.map((enemyType) => [enemyType, factionId]),
  );

export const enemyFactionByType = Object.freeze(
  Object.fromEntries(enemyFactionPairs),
);

export function getFactionForEnemyType(enemyType) {
  return factions[enemyFactionByType[enemyType]] || null;
}

export function getFactionIdForEnemyType(enemyType) {
  return enemyFactionByType[enemyType] || null;
}
