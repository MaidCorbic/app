export const enemyIntel = {
  'enemy-runner': { name: 'SCOUT RUNNER', attack: 'Plasma bursts while closing distance.', defense: 'Stomp from above or fire from range.', tactic: 'Keep moving and punish the approach.' },
  chicken: { name: 'EGG HAZARD', attack: 'Lobs a curved egg across the route.', defense: 'Jump the arc, shoot it, or use a shield.', tactic: 'Do not stand directly in its line.' },
  dino: { name: 'ROOFTOP DINO', attack: 'Short charge when you enter its lane.', defense: 'Dodge, then stomp or slash during recovery.', tactic: 'Create space before it commits.' },
  invader: { name: 'SKY INVADER', attack: 'Hover fire with drifting energy bolts.', defense: 'Lead the target with plasma or turret fire.', tactic: 'Watch the sky before a gap.' },
  'alien-ground': { name: 'GROUND ALIEN', attack: 'Low energy shot from the route floor.', defense: 'Sword at close range or plasma from cover.', tactic: 'Clear it before entering a choke point.' },
  'dino-boss': { name: 'ALPHA DINO', attack: 'Blocks the relay and absorbs repeated hits.', defense: 'Pulse Rifle, Scattergun, sword arcs, and kinetic balls.', tactic: 'Defeat it to unlock the final beacon.' },
};

export const signatureThreats = {
  'first-delivery': 'chicken',
  'dead-drop': 'alien-ground',
  blackout: 'invader',
  pursuit: 'dino',
  'signal-storm': 'invader',
  'corporate-lockdown': 'dino-boss',
  'final-relay': 'dino-boss',
};
