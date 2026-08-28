import { missions } from './src/missions.js';

// Legacy compatibility bridge only.
// The active splash owner is splash-loader-v2.js, loaded explicitly by index.html.
// Keeping a second splash controller here caused competing progress/finish state.
globalThis.missions = missions;
