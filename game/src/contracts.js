export const contracts = [

  {
    id: 'old-quarter-delivery',
    type: 'DELIVERY',
    missionId: 'first-delivery',

    tier: 'TIER I',
    rarity: 'STANDARD',
    category: 'RELAY',

    codename: 'OPEN LINE',
    label: 'Complete First Delivery',

    description:
      'Move the starter relay through Old Quarter and complete the first clean handoff.',

    objective:
      'Reach the first relay point with the package intact.',

    risk: 'LOW',
    status: 'AVAILABLE',

    xp: 40,
    credits: 20,

    bonus: {
      perfectRun: 15,
      noDamage: 10,
    },
  },


  {
    id: 'dock-timed',
    type: 'TIMED',
    missionId: 'dead-drop',

    tier: 'TIER II',
    rarity: 'RARE',
    category: 'SPEED',

    codename: 'DOCK RUN',
    label: 'Finish Dead Drop under 70 seconds',

    description:
      'Cut through Salt Docks before the dispatch window closes.',

    objective:
      'Complete the Dead Drop mission before the timer reaches zero.',

    risk: 'MEDIUM',
    status: 'AVAILABLE',

    time: 70000,

    xp: 70,
    credits: 35,

    bonus: {
      under60Seconds: 25,
      perfectRun: 20,
    },
  },


  {
    id: 'grid-collection',
    type: 'COLLECTION',
    missionId: 'blackout',

    tier: 'TIER II',
    rarity: 'RARE',
    category: 'SIGNAL',

    codename: 'GRID SWEEP',
    label: 'Capture 12 Signals in Blackout',

    description:
      'Recover enough signal fragments to stabilize the blackout sector.',

    objective:
      'Capture 12 Signals before completing the mission.',

    risk: 'MEDIUM',
    status: 'AVAILABLE',

    signals: 12,

    xp: 65,
    credits: 30,

    bonus: {
      allSignals: 30,
      perfectRun: 15,
    },
  },


  {
    id: 'spine-no-hit',
    type: 'NO-HIT',
    missionId: 'pursuit',

    tier: 'TIER III',
    rarity: 'EPIC',
    category: 'COMBAT',

    codename: 'GHOST SPINE',
    label: 'Complete Pursuit without a hit',

    description:
      'Stay ahead of the interceptor without taking a single confirmed hit.',

    objective:
      'Finish Pursuit with zero damage received.',

    risk: 'HIGH',
    status: 'AVAILABLE',

    xp: 90,
    credits: 45,

    bonus: {
      zeroDamage: 50,
      perfectRun: 25,
    },
  },


  {
    id: 'grid-stealth',
    type: 'STEALTH',
    missionId: 'blackout',

    tier: 'TIER III',
    rarity: 'EPIC',
    category: 'STEALTH',

    codename: 'GHOST SIGNAL',
    label: 'Complete Blackout without an alarm',

    description:
      'Cross the blackout sector without triggering the hostile network.',

    objective:
      'Complete the mission without activating an alarm state.',

    risk: 'HIGH',
    status: 'AVAILABLE',

    xp: 85,
    credits: 45,

    bonus: {
      zeroAlarm: 45,
      perfectRun: 20,
    },
  },


  {
    id: 'storm-chase',
    type: 'CHASE',
    missionId: 'signal-storm',

    tier: 'TIER IV',
    rarity: 'LEGENDARY',
    category: 'SURVIVAL',

    codename: 'STORMBREAKER',
    label: 'Escape every Storm chase sector',

    description:
      'Outrun the storm and survive every interceptor sector before the relay collapses.',

    objective:
      'Escape every active Storm chase sector.',

    risk: 'CRITICAL',
    status: 'AVAILABLE',

    xp: 110,
    credits: 60,

    bonus: {
      noHit: 60,
      perfectRun: 40,
      fullSignals: 50,
    },
  },


  /*
   * ============================================================
   * FINAL RELAY
   * ============================================================
   */

  {
    id: 'apex-spine-delivery',
    type: 'DELIVERY',
    missionId: 'final-relay',

    tier: 'TIER V',
    rarity: 'LEGENDARY',
    category: 'FINAL RELAY',

    codename: 'APEX SPINE',
    label: 'Complete the Final Relay',

    description:
      'Carry the city core through Apex Spine and complete the final relay handoff.',

    objective:
      'Reach Apex Spine and deliver the city core before the network closes.',

    risk: 'CRITICAL',
    status: 'LOCKED',

    xp: 150,
    credits: 80,

    bonus: {
      perfectRun: 75,
      noHit: 60,
      fullSignals: 50,
    },
  },


  {
    id: 'apex-spine-no-hit',
    type: 'NO-HIT',
    missionId: 'final-relay',

    tier: 'TIER V',
    rarity: 'LEGENDARY',
    category: 'COMBAT',

    codename: 'ZERO TRACE',
    label: 'Complete Final Relay without taking damage',

    description:
      'Break through the Apex Spine route without a single confirmed hit.',

    objective:
      'Finish the Final Relay with zero damage received.',

    risk: 'CRITICAL',
    status: 'LOCKED',

    xp: 200,
    credits: 110,

    bonus: {
      zeroDamage: 100,
      perfectRun: 75,
    },
  },


  {
    id: 'apex-spine-speedrun',
    type: 'TIMED',
    missionId: 'final-relay',

    tier: 'TIER V',
    rarity: 'LEGENDARY',
    category: 'SPEED',

    codename: 'LAST WINDOW',
    label: 'Complete Final Relay under 90 seconds',

    description:
      'The network is collapsing. There is no second route and no recovery window.',

    objective:
      'Complete the Final Relay in under 90 seconds.',

    risk: 'CRITICAL',
    status: 'LOCKED',

    time: 90000,

    xp: 225,
    credits: 125,

    bonus: {
      under75Seconds: 100,
      perfectRun: 75,
    },
  },


  {
    id: 'apex-spine-full-signal',
    type: 'COLLECTION',
    missionId: 'final-relay',

    tier: 'TIER V',
    rarity: 'LEGENDARY',
    category: 'SIGNAL',

    codename: 'TOTAL UPLINK',
    label: 'Recover every Signal in Apex Spine',

    description:
      'Recover the complete signal chain hidden along the final relay route.',

    objective:
      'Collect every available Signal before completing the mission.',

    risk: 'CRITICAL',
    status: 'LOCKED',

    signals: 12,

    xp: 250,
    credits: 150,

    bonus: {
      allSignals: 125,
      perfectRun: 75,
    },
  },


  /*
   * ============================================================
   * MASTER CONTRACT
   * ============================================================
   */

  {
    id: 'apex-spine-master-contract',
    type: 'MASTER',
    missionId: 'final-relay',

    tier: 'TIER V',
    rarity: 'MYTHIC',
    category: 'APEX PROTOCOL',

    codename: 'APEX PROTOCOL',
    label: 'Complete the Apex Protocol',

    description:
      'Execute the final relay at maximum performance. No damage. No missed Signals. No wasted time.',

    objective:
      'Complete Final Relay with zero damage, full Signals and a sub-90-second clear.',

    risk: 'EXTREME',
    status: 'LOCKED',

    time: 90000,
    signals: 12,

    xp: 500,
    credits: 300,

    bonus: {
      zeroDamage: 150,
      allSignals: 150,
      under90Seconds: 150,
      perfectRun: 200,
    },
  },

];