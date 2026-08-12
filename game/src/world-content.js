export const specialEvents = [
  { id: 'blackout', name: 'BLACKOUT', district: 'downtown', modifier: 'darkCity', reward: '90 XP · 45 CREDITS', availability: 'NEXT 24H', weather: 'BLACKOUT' },
  { id: 'storm', name: 'STORM FRONT', district: 'residential', modifier: 'highSpeed', reward: '75 XP · 35 CREDITS', availability: 'NEXT 24H', weather: 'STORM' },
  { id: 'sweep', name: 'SECURITY SWEEP', district: 'corporate', modifier: 'noDash', reward: '110 XP · 55 CREDITS', availability: 'NEXT 24H', weather: 'NIGHT' },
  { id: 'surge', name: 'DRONE SURGE', district: 'industrial', modifier: 'lowEnergy', reward: '95 XP · 45 CREDITS', availability: 'NEXT 24H', weather: 'RAIN' },
  { id: 'high-value', name: 'HIGH VALUE DELIVERY', district: 'old-city', modifier: 'noCheckpoints', reward: '120 XP · 60 CREDITS', availability: 'NEXT 24H', weather: 'NIGHT' },
  { id: 'anomaly', name: 'SIGNAL ANOMALY', district: 'downtown', modifier: 'extraSignals', reward: '100 XP · 50 CREDITS', availability: 'NEXT 24H', weather: 'BLACKOUT' },
];

export function currentSpecialEvent(date = new Date()) {
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  return specialEvents[day % specialEvents.length];
}

export const npcs = [
  { id: 'mara', type: 'COURIER', district: 'old-city', name: 'MARA VEX', dialogue: 'The easy rooftops are never the ones worth remembering.', objective: 'Finish any delivery with a new best time.', reward: 'Route hint · 20 Credits', story: 'Mara is the courier everyone measures themselves against.' },
  { id: 'ivo', type: 'MECHANIC', district: 'industrial', name: 'IVO', dialogue: 'Your relay pack is drawing more power than it should.', objective: 'Collect 5 Signals in Industrial.', reward: 'Energy Cell intel · 25 Credits', story: 'Ivo has seen the same strange signal signature before.' },
  { id: 'sable', type: 'FIXER', district: 'downtown', name: 'SABLE', dialogue: 'Corporate security is asking the wrong questions about your parcels.', objective: 'Complete a stealth contract.', reward: 'Contract lead · 30 Credits', story: 'Sable connects work that should not be connected.' },
  { id: 'lumen', type: 'INFORMANT', district: 'corporate', name: 'LUMEN', dialogue: 'The network is not broken. It is hiding.', objective: 'Discover a secret in Corporate.', reward: 'Faction dossier · 35 Credits', story: 'Lumen knows why the security faction fears the relay network.' },
  { id: 'THE CLIENT', type: 'CLIENT', district: 'residential', name: 'UNKNOWN CLIENT', dialogue: 'Deliver the storm signal. Do not ask what wakes when it arrives.', objective: 'Complete Signal Storm.', reward: 'Story clearance · 50 Credits', story: 'The client may be the source of every unusual package.' },
];

export const rivalAppearances = {
  'dead-drop': { name: 'MARA VEX', cue: 'MARA TAKES THE HIGH LINE', objective: 'Beat Mara to the relay before the par time.', radio: [{ delay: 2800, text: 'MARA: DOCKS ARE SLOW IF YOU LOOK DOWN.' }], victory: 'Finish under par time.' },
  pursuit: { name: 'MARA VEX', cue: 'MARA CUTS ACROSS THE RAIL SPINE', objective: 'Stay ahead through the chase sector.', radio: [{ delay: 2600, text: 'MARA: THE RAILS ONLY LOOK SAFE.' }, { delay: 8500, text: 'MARA: KEEP UP, COURIER.' }], victory: 'Finish clean and escape both chase sectors.' },
  'signal-storm': { name: 'MARA VEX', cue: 'MARA IS ALREADY IN THE STORM', objective: 'Choose your own route to Crown Array.', radio: [{ delay: 2400, text: 'MARA: THE STORM DOES NOT CARE WHO WINS.' }, { delay: 9200, text: 'MARA: CROWN ARRAY IS YOUR CALL.' }], victory: 'Finish with all Signals or a clean run.' },
  'corporate-lockdown': { name: 'MARA VEX', cue: 'MARA ENTERS HELIX THROUGH THE SKYLINE', objective: 'Carry the oversized core cleanly through the lockdown.', radio: [{ delay: 2600, text: 'MARA: HEAVY CORE. LIGHT FOOTWORK.' }, { delay: 8800, text: 'MARA: HELIX GATES NEVER STAY OPEN.' }], victory: 'Finish with a clean run.' },
  'final-relay': { name: 'MARA VEX', cue: 'MARA MEETS YOU AT APEX SPINE', objective: 'Complete the final relay cleanly with every Signal.', radio: [{ delay: 2200, text: 'MARA: NO SECOND RUN ON THIS ONE.' }, { delay: 8200, text: 'MARA: MAKE THE CITY HEAR YOU.' }], victory: 'Finish clean with all Signals.' },
};

export const rivalOperations = {
  name: 'MARA VEX',
  title: 'NIGHT RUNNER PRIME',
  dossier: 'A courier who treats every relay as a race. Her route intel keeps appearing before the corporate interceptors do.',
  missions: ['dead-drop', 'pursuit', 'signal-storm', 'corporate-lockdown', 'final-relay'],
};
