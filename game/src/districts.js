export const districts = [
  { id: 'old-city', name: 'OLD CITY', identity: 'Lantern roofs and narrow relay alleys.', hazards: 'Low gaps · live barriers', enemies: 'None', unlockMission: null, missions: ['first-delivery'] },
  { id: 'industrial', name: 'INDUSTRIAL', identity: 'Dock cranes, boost lanes and freight stacks.', hazards: 'Boost pads · elevated gaps', enemies: 'None', unlockMission: 'first-delivery', missions: ['dead-drop'] },
  { id: 'downtown', name: 'DOWNTOWN', identity: 'Dead grids and emergency-lit towers.', hazards: 'Blackout routes · vertical walls', enemies: 'None', unlockMission: 'dead-drop', missions: ['blackout'] },
  { id: 'corporate', name: 'CORPORATE', identity: 'Rail spines under active surveillance.', hazards: 'Chase sectors · security gates', enemies: 'Security drones · guards', unlockMission: 'blackout', missions: ['pursuit'] },
  { id: 'residential', name: 'RESIDENTIAL', identity: 'Storm-facing rooftops above the sleeping blocks.', hazards: 'Power failures · final relay stack', enemies: 'Drones · guards · interceptor', unlockMission: 'pursuit', missions: ['signal-storm'] },
  { id: 'apex', name: 'APEX SPINE', identity: 'Corporate towers and the final city relay core.', hazards: 'Moving gates · oversized core · final chase', enemies: 'Security drones · guards · interceptor', unlockMission: 'signal-storm', missions: ['corporate-lockdown', 'final-relay'] },
];
