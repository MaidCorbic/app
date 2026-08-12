export const campaignChapters = [
  {
    id: 'chapter-one',
    number: 'CHAPTER 01',
    title: 'OPEN LINE',
    briefing: 'Prove the relay can move through Old Quarter and Salt Docks before dawn.',
    missionIds: ['first-delivery', 'dead-drop'],
    reward: { xp: 75, credits: 30 },
    rival: null,
  },
  {
    id: 'chapter-two',
    number: 'CHAPTER 02',
    title: 'DARK FREQUENCY',
    briefing: 'Restore Grid Nine, then survive Mara Vex on the Rail Spine.',
    missionIds: ['blackout', 'pursuit'],
    reward: { xp: 125, credits: 50 },
    rival: 'MARA VEX',
  },
  {
    id: 'chapter-three',
    number: 'CHAPTER 03',
    title: 'CROWN ARRAY',
    briefing: 'Carry the storm signal through the final interceptor lockdown.',
    missionIds: ['signal-storm'],
    reward: { xp: 200, credits: 80 },
    rival: 'MARA VEX · FINAL RUN',
  },
  {
    id: 'chapter-four',
    number: 'CHAPTER 04',
    title: 'CITYSPINE',
    briefing: 'Break Helix Tower, then carry the city core through Apex Spine for the final relay.',
    missionIds: ['corporate-lockdown', 'final-relay'],
    reward: { xp: 350, credits: 150 },
    rival: 'MARA VEX · CITYSPINE FINALE',
  },
];

export const campaignChapterForMission = missionId => campaignChapters.find(chapter => chapter.missionIds.includes(missionId));
