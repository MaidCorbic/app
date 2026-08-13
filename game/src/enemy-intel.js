export const enemyIntel = {
  'enemy-runner': { name: 'SCOUT RUNNER', attack: 'Plasma bursts while closing distance.', defense: 'Stomp from above or fire from range.', tactic: 'Keep moving and punish the approach.' },
  chicken: { name: 'EGG HAZARD', attack: 'Lobs a curved egg across the route.', defense: 'Jump the arc, shoot it, or use a shield.', tactic: 'Do not stand directly in its line.' },
  dino: { name: 'ROOFTOP DINO', attack: 'Short charge when you enter its lane.', defense: 'Dodge, then stomp or slash during recovery.', tactic: 'Create space before it commits.' },
  invader: { name: 'SKY INVADER', attack: 'Hover fire with drifting energy bolts.', defense: 'Lead the target with plasma or turret fire.', tactic: 'Watch the sky before a gap.' },
  'alien-ground': { name: 'GROUND ALIEN', attack: 'Low energy shot from the route floor.', defense: 'Sword at close range or plasma from cover.', tactic: 'Clear it before entering a choke point.' },
  'dino-boss': { name: 'ALPHA DINO', attack: 'Blocks the relay and absorbs repeated hits.', defense: 'Pulse Rifle, Scattergun, sword arcs, and kinetic balls.', tactic: 'Defeat it to unlock the final beacon.' },
  'sentinel-boss': { name: 'GRID WARDEN', attack: 'Fires relay bolts across the final approach.', defense: 'Keep moving, then punish the firing window.', tactic: 'Use cover and close the distance after a volley.' },
  'storm-boss': { name: 'STORM TITAN', attack: 'Calls down charged comet strikes.', defense: 'Dash through the gaps between impacts.', tactic: 'Clear it before linking the Crown Array.' },
  'apex-boss': { name: 'APEX OVERSEER', attack: 'Alternates heavy bolts and a closing sweep.', defense: 'Use every tool in the loadout.', tactic: 'Stay mobile and finish the final relay fight.' },
};

export const signatureThreats = {
  'first-delivery': 'chicken',
  'dead-drop': 'alien-ground',
  blackout: 'sentinel-boss',
  pursuit: 'dino-boss',
  'signal-storm': 'storm-boss',
  'corporate-lockdown': 'sentinel-boss',
  'final-relay': 'apex-boss',
};
