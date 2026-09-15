import Phaser from 'phaser';
import { packages } from '../packages.js';
import { rivalAppearances } from '../world-content.js';
import { enemyIntel, signatureThreats } from '../enemy-intel.js';

// Kept together so movement can be tuned without touching level or state logic.
const RUNNER_TUNING = {
  maxRunSpeed: 475,
  groundAcceleration: 4500,
  groundDeceleration: 3500,
  airAcceleration: 3150,
  airDeceleration: 1450,
  airTurnAcceleration: 4200,
  airMomentumRetention: 0.92,
  turnAcceleration: 5900,
  airSteeringMin: 0.72,
  airSteeringMax: 1.08,
  airSteeringTurnBoost: 1.12,
  mobileAirSteerResponse: 0.22,
  mobileAirSteerDeadzone: 8,
  jumpVelocity: -750,
  doubleJumpVelocity: -800,
  jumpCutMultiplier: .44,
  coyoteMs: 135,
  jumpBufferMs: 145,
  riseGravity: 500,
  fallGravity: 735,
  fallGravityBoost: 1.16,
  maxFallSpeed: 1120,
  apexVelocityThreshold: 85,
  apexGravityMultiplier: 0.58,
  fallRampStart: 260,
  fallRampMax: 760,
  fallRampBonus: 1.18,
  dashSpeed: 720,
  dashDurationMs: 155,
  dashCooldownMs: 580,
  airDashRecoveryVelocity: 90
};
const DISTRICT_VISUALS = {
  'first-delivery': { skyline: 0x08111f, building: 0x10243a, window: 0x5ee7ff, accent: 0x00d9ff, label: 'OLD QUARTER', props: 'lanterns' },
  'dead-drop': { skyline: 0x0a1422, building: 0x172a40, window: 0xffb454, accent: 0xff7a45, label: 'SALT DOCKS', props: 'docks' },
  blackout: { skyline: 0x050b15, building: 0x0b1829, window: 0x66f4ff, accent: 0x00eaff, label: 'GRID NINE', props: 'emergency' },
  pursuit: { skyline: 0x0b1020, building: 0x182542, window: 0x79c9ff, accent: 0xff5364, label: 'RAIL SPINE', props: 'rail' },
  'signal-storm': { skyline: 0x0d1022, building: 0x1b2040, window: 0xb8a0ff, accent: 0x9b5cff, label: 'CROWN ARRAY', props: 'array' },
  'corporate-lockdown': { skyline: 0x111522, building: 0x202b3d, window: 0xffd76a, accent: 0xff5a4f, label: 'HELIX TOWER', props: 'rail' },
  'final-relay': { skyline: 0x0d0b18, building: 0x1b2034, window: 0xffe6a1, accent: 0xffc247, label: 'APEX SPINE', props: 'array' }
};

export class RunnerScene extends Phaser.Scene {
constructor() {
  super('runner');
this.voiceEnabled = true;
this.voiceVolume = 1.0;
this.voiceVoiceName = '';
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const savedVoiceEnabled = window.localStorage.getItem('runner_voice_enabled');
    const savedVoiceVolume = Number(window.localStorage.getItem('runner_voice_volume'));
    const savedVoiceName = window.localStorage.getItem('runner_voice_name');
    if (savedVoiceEnabled !== null) this.voiceEnabled = savedVoiceEnabled === '1';
    if (Number.isFinite(savedVoiceVolume)) this.voiceVolume = Phaser.Math.Clamp(savedVoiceVolume, 0, 1);
    if (typeof savedVoiceName === 'string') this.voiceVoiceName = savedVoiceName;
  }
} catch {}
this.voiceQueue = [];
this.voiceSpeaking = false;
this.voiceVoicesChangedHandler = null;
this.voicePreviousVoicesChangedHandler = null;
this.voiceLastText = '';
this.voiceLastTextAt = 0;
this.voiceLastAt = 0;
this.voiceCooldownMs = 1800;
this.voiceRepeatLockMs = 2600;
this.voiceVoices = [];
this.voiceProfile = { type: 'MISSION', rate: 1.02, pitch: 0.92, volume: 0.82 };
}
}
