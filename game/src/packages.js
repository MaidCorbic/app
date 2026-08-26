export const packages = {
  'first-delivery': { type: 'STANDARD', objective: 'Deliver the starter relay intact.', duration: '01:10', condition: false },
  'dead-drop': { type: 'URGENT', objective: 'Beat the dock dispatch window.', duration: '01:18', condition: false },
  blackout: { type: 'FRAGILE', objective: 'Protect the blackout relay capsule.', duration: '01:25', condition: true },
  pursuit: { type: 'HIGH VALUE', objective: 'Carry a corporate-grade signal through security.', duration: '01:22', condition: true },
  'signal-storm': { type: 'SECRET', objective: 'Route the Crown Array storm signal.', duration: '01:30', condition: true },
  'corporate-lockdown': { type: 'OVERSIZED', objective: 'Carry the Helix relay core through the corporate lockdown.', duration: '01:38', condition: true, speedMultiplier: .88 },
  'final-relay': { type: 'PRIME RELAY', objective: 'Deliver the city core to Apex Spine before the network closes.', duration: '01:45', condition: true, speedMultiplier: .92 },
};
