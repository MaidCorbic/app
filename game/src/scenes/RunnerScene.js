import Phaser from 'phaser';
import { packages } from '../packages.js';
import { rivalAppearances } from '../world-content.js';
import { enemyIntel, signatureThreats } from '../enemy-intel.js';

// Kept together so movement can be tuned without touching level or state logic.
const RUNNER_TUNING = {

  maxRunSpeed: 475,

  // GROUND
  groundAcceleration: 4500,
  groundDeceleration: 3500,

  // AIR MOVEMENT
airAcceleration: 3150,
airDeceleration: 1450,
airTurnAcceleration: 4200,
airMomentumRetention: 0.92,
turnAcceleration: 5900,

  // ADVANCED AIR STEERING
airSteeringMin: 0.72,
airSteeringMax: 1.08,
airSteeringTurnBoost: 1.12,

// MOBILE AIR STEERING
mobileAirSteerResponse: 0.22,
mobileAirSteerDeadzone: 8,

  // JUMP
  jumpVelocity: -750,
  doubleJumpVelocity: -800,
  jumpCutMultiplier: .44,

  coyoteMs: 135,
  jumpBufferMs: 145,

  // VERTICAL AIR PHYSICS
  riseGravity: 500,
  fallGravity: 735,
  fallGravityBoost: 1.16,
  maxFallSpeed: 1120,

  // APEX FLOAT
  apexVelocityThreshold: 85,
  apexGravityMultiplier: 0.58,

  // FALL RAMP
  fallRampStart: 260,
  fallRampMax: 760,
  fallRampBonus: 1.18,

  // AIR DASH
  dashSpeed: 720,
  dashDurationMs: 155,
  dashCooldownMs: 580,

  // AIR DASH RECOVERY
  airDashRecoveryVelocity: 90
};

const DISTRICT_VISUALS = {
  'first-delivery': {
    skyline: 0x08111f,
    building: 0x10243a,
    window: 0x5ee7ff,
    accent: 0x00d9ff,
    label: 'OLD QUARTER',
    props: 'lanterns'
  },

  'dead-drop': {
    skyline: 0x0a1422,
    building: 0x172a40,
    window: 0xffb454,
    accent: 0xff7a45,
    label: 'SALT DOCKS',
    props: 'docks'
  },

  blackout: {
    skyline: 0x050b15,
    building: 0x0b1829,
    window: 0x66f4ff,
    accent: 0x00eaff,
    label: 'GRID NINE',
    props: 'emergency'
  },

  pursuit: {
    skyline: 0x0b1020,
    building: 0x182542,
    window: 0x79c9ff,
    accent: 0xff5364,
    label: 'RAIL SPINE',
    props: 'rail'
  },

  'signal-storm': {
    skyline: 0x0d1022,
    building: 0x1b2040,
    window: 0xb8a0ff,
    accent: 0x9b5cff,
    label: 'CROWN ARRAY',
    props: 'array'
  },

  'corporate-lockdown': {
    skyline: 0x111522,
    building: 0x202b3d,
    window: 0xffd76a,
    accent: 0xff5a4f,
    label: 'HELIX TOWER',
    props: 'rail'
  },

  'final-relay': {
    skyline: 0x0d0b18,
    building: 0x1b2034,
    window: 0xffe6a1,
    accent: 0xffc247,
    label: 'APEX SPINE',
    props: 'array'
  }
};

export class RunnerScene extends Phaser.Scene {
constructor() {
  super('runner');

  // ============================================================
  // AI VOICE / COMMENTATOR
  // Uses existing narration events.
  // ============================================================
this.voiceEnabled = true;
this.voiceVolume = 1.0;
this.voiceVoiceName = '';

try {
  if (
    typeof window !== 'undefined' &&
    window.localStorage
  ) {
    const savedVoiceEnabled =
      window.localStorage.getItem(
        'runner_voice_enabled'
      );

    const savedVoiceVolume =
      Number(
        window.localStorage.getItem(
          'runner_voice_volume'
        )
      );

    const savedVoiceName =
      window.localStorage.getItem(
        'runner_voice_name'
      );

    if (
      savedVoiceEnabled !== null
    ) {
      this.voiceEnabled =
        savedVoiceEnabled === '1';
    }

    if (
      Number.isFinite(savedVoiceVolume)
    ) {
      this.voiceVolume =
        Phaser.Math.Clamp(
          savedVoiceVolume,
          0,
          1
        );
    }

    if (
      typeof savedVoiceName === 'string'
    ) {
      this.voiceVoiceName =
        savedVoiceName;
    }
  }
} catch (error) {
  console.warn(
    '[AI VOICE] Failed to load saved settings:',
    error
  );
}

this.voiceQueue = [];
this.voiceSpeaking = false;
this.voiceVoicesChangedHandler = null;
this.voicePreviousVoicesChangedHandler = null;

this.voiceLastText = '';
this.voiceLastTextAt = 0;
this.voiceLastAt = 0;
this.voiceCooldownMs = 1800;
this.voiceRepeatLockMs = 2600;

  // Browser TTS voices loaded by setupNarrationVoice().
  this.voiceVoices = [];

  this.voiceProfile = {
  type: 'MISSION',
  rate: 1.02,
  pitch: 0.92,
  volume: 0.82
};
}

setVoiceEnabled(enabled) {
  this.voiceEnabled =
    Boolean(enabled);

  try {
    if (
      typeof window !== 'undefined' &&
      window.localStorage
    ) {
      window.localStorage.setItem(
        'runner_voice_enabled',
        this.voiceEnabled ? '1' : '0'
      );
    }
  } catch (error) {
    console.warn(
      '[AI VOICE] Failed to save enabled state:',
      error
    );
  }

  if (!this.voiceEnabled) {
    this.voiceQueue = [];

    if (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window
    ) {
      window.speechSynthesis.cancel();
    }

    this.voiceSpeaking = false;

    this.voiceSerial =
      (this.voiceSerial || 0) + 1;
  }
}

setVoiceVolume(volume) {
  const nextVolume =
    Number(volume);

  if (
    !Number.isFinite(nextVolume)
  ) {
    return;
  }

  this.voiceVolume =
    Phaser.Math.Clamp(
      nextVolume,
      0,
      1
    );

  try {
    if (
      typeof window !== 'undefined' &&
      window.localStorage
    ) {
      window.localStorage.setItem(
        'runner_voice_volume',
        String(this.voiceVolume)
      );
    }
  } catch (error) {
    console.warn(
      '[AI VOICE] Failed to save volume:',
      error
    );
  }
}

setVoiceByName(name) {
  if (
    typeof name !== 'string'
  ) {
    return;
  }

  this.voiceVoiceName =
    name.trim();

  try {
    if (
      typeof window !== 'undefined' &&
      window.localStorage
    ) {
      window.localStorage.setItem(
        'runner_voice_name',
        this.voiceVoiceName
      );
    }
  } catch (error) {
    console.warn(
      '[AI VOICE] Failed to save voice:',
      error
    );
  }
}

setGraphicsQuality(level) {
  const quality =
    String(level || '')
      .trim()
      .toUpperCase();

  if (
    ![
      'LOW',
      'MEDIUM',
      'HIGH',
      'ULTRA'
    ].includes(quality)
  ) {
    return false;
  }

  this.graphicsQuality =
    quality;

  this.graphicsLevel = {
    LOW: 0,
    MEDIUM: 1,
    HIGH: 2,
    ULTRA: 3
  }[quality];

  this.graphicsSettings = {
    quality,
    level: this.graphicsLevel,
    effects: true,
    particles:
      this.graphicsLevel >= 1,
    lighting:
      this.graphicsLevel >= 2,
    weather:
      this.graphicsLevel >= 1
  };

  try {
    if (
      typeof window !== 'undefined' &&
      window.localStorage
    ) {
      window.localStorage.setItem(
        'runner_graphics_quality',
        quality
      );
    }
  } catch (error) {
    console.warn(
      '[GRAPHICS] Failed to save quality:',
      error
    );
  }

this.applyGraphicsSettings();

this.game.events.emit(
  'graphics-settings-changed',
  this.graphicsSettings
);

return true;
}

getGraphicsSettings() {
  return {
    ...(this.graphicsSettings || {}),
    quality:
      this.graphicsQuality || 'HIGH',
    level:
      Number.isFinite(this.graphicsLevel)
        ? this.graphicsLevel
        : 2
  };
}

applyGraphicsSettings() {
  const quality =
    this.graphicsQuality || 'HIGH';

  const level =
    Number.isFinite(this.graphicsLevel)
      ? this.graphicsLevel
      : 2;

  const previousLevel =
    Number.isFinite(
      this._appliedGraphicsLevel
    )
      ? this._appliedGraphicsLevel
      : null;

  const previousWaveLevel =
    previousLevel !== null &&
    previousLevel >= 2;

  const nextWaveLevel =
    level >= 2;

  this.graphicsSettings = {
    quality,
    level,
    effects: true,
    particles:
      level >= 1,
    lighting:
      level >= 2,
    weather:
      level >= 1
  };

  const rainVisible =
    Boolean(
      this.rainEnabled &&
      level >= 1
    );

  this.rain?.setVisible(
    rainVisible
  );

  this.dust?.setVisible(
    level >= 1
  );

  this.speedLines?.setVisible(
    level >= 1
  );

  if (
    this.weatherOverlay &&
    typeof this.weatherOverlay.setAlpha === 'function'
  ) {
    this.weatherOverlay.setAlpha(
      level >= 1
        ? 0.045
        : 0
    );
  }

   /*
   * ============================================================
   * WATER WAVES · RUNTIME GRAPHICS QUALITY
   * HIGH / ULTRA = active wave system
   * LOW / MEDIUM = remove heavy wave system
   * ============================================================
   */

  if (
    previousWaveLevel &&
    !nextWaveLevel
  ) {
    this.clearWaterWaves();
  }

  if (
    previousLevel !== null &&
    !previousWaveLevel &&
    nextWaveLevel &&
    !this.motionReduced &&
    this.waterZones &&
    this.mission?.waterZones
  ) {
    this.createWaterWaves();
  }

  /*
   * First application after scene creation.
   * Do not force-create here because create()
   * already calls createWaterWaves() in the correct order.
   */
  this._appliedGraphicsLevel =
    level;

  this.game.events.emit(
    'graphics-settings-applied',
    this.graphicsSettings
  );

  return this.graphicsSettings;
}

getVoiceSettings() {
  return {
    enabled:
      this.voiceEnabled,
    volume:
      this.voiceVolume,
    voiceName:
      this.voiceVoiceName
  };
}

testVoice() {
  if (
    !this.voiceEnabled
  ) {
    return;
  }

  if (
    typeof window === 'undefined' ||
    !('speechSynthesis' in window)
  ) {
    console.warn(
      '[AI VOICE] Speech synthesis is not available.'
    );
    return;
  }

  const testText =
    'SYSTEM ONLINE. VOICE COMMS READY.';

  window.speechSynthesis.cancel();

  this.voiceSpeaking = false;

  this.voiceSerial =
    (this.voiceSerial || 0) + 1;

  this.voiceQueue = [];

  this.voiceLastText = '';
this.voiceLastTextAt = 0;
this.voiceLastAt = 0;

this.speakNarration(
  testText
);
}

speakNarration(text) {
  if (
    !this.voiceEnabled ||
    typeof window === 'undefined' ||
    !('speechSynthesis' in window) ||
    typeof text !== 'string'
  ) {
    return;
  }

  const cleanText =
    text
      .replace(/\s+/g, ' ')
      .trim();

  if (!cleanText) {
    return;
  }

  /*
   * ============================================================
   * AI VOICE POLISH · REACTION VARIANTS
   * ============================================================
   */
  const voiceVariants = {
    'PERFECT DODGE': [
      'PERFECT DODGE',
      'PERFECT',
      'CLEAN DODGE'
    ],

    'LOW HEALTH': [
      'LOW HEALTH',
      'HEALTH CRITICAL',
      'WARNING LOW HEALTH'
    ],

    'OVERDRIVE': [
      'OVERDRIVE',
      'OVERDRIVE ACTIVE',
      'MAXIMUM OUTPUT'
    ],

    'BOSS ENGAGED': [
      'BOSS ENGAGED',
      'BOSS TARGET ACQUIRED',
      'BOSS CONTACT'
    ],

    'BOSS PHASE TWO': [
      'BOSS PHASE TWO',
      'PHASE TWO',
      'SECOND PHASE'
    ],

    'FINAL ENRAGE': [
      'FINAL ENRAGE',
      'ENRAGE PROTOCOL',
      'FINAL PHASE'
    ],

    'BOSS DEFEATED': [
      'BOSS DEFEATED',
      'TARGET ELIMINATED',
      'THREAT ELIMINATED'
    ]
  };

  const variants =
    voiceVariants[cleanText];

  const voicedText =
    Array.isArray(variants) &&
    variants.length
      ? variants[
          Phaser.Math.Between(
            0,
            variants.length - 1
          )
        ]
      : cleanText;

  // ------------------------------------------------------------
  // VOICE DIRECTOR // duplicate protection
  // ------------------------------------------------------------

const repeatNow =
  this.time?.now ??
  Date.now();

const lastTextAt =
  Number.isFinite(this.voiceLastTextAt)
    ? this.voiceLastTextAt
    : 0;

const repeatLock =
  Number.isFinite(this.voiceRepeatLockMs)
    ? this.voiceRepeatLockMs
    : 2600;

if (
 this.voiceLastText === voicedText &&
  repeatNow - lastTextAt < repeatLock
) {
  return;
}

this.voiceLastText =
  voicedText;

this.voiceLastTextAt =
  repeatNow;
  // ------------------------------------------------------------
  // VOICE PROFILE DETECTION
  // ------------------------------------------------------------

const upperText =
  voicedText.toUpperCase();

  let profile = {
    type: 'MISSION',
    rate: 1.02,
    pitch: 0.92,
    volume: 0.82
  };

  if (
    upperText.includes('BOSS') ||
    upperText.includes('TARGET ACQUIRED') ||
    upperText.includes('FINAL')
  ) {
    profile = {
      type: 'BOSS',
      rate: 0.94,
      pitch: 0.78,
      volume: 1.0
    };
  } else if (
    upperText.includes('CRITICAL') ||
    upperText.includes('DANGER') ||
    upperText.includes('LOW HEALTH') ||
    upperText.includes('DETECTED')
  ) {
    profile = {
      type: 'CRITICAL',
      rate: 1.10,
      pitch: 0.84,
      volume: 1.0
    };
 } else if (
  upperText.includes('OVERDRIVE')
) {
  profile = {
    type: 'COMBAT',
    rate: 1.04,
    pitch: 1.00,
    volume: 0.96
  };
} else if (
  upperText.includes('DODGE') ||
  upperText.includes('COMBO') ||
  upperText.includes('KILL') ||
  upperText.includes('HUNT')
) {
  profile = {
    type: 'COMBAT',
    rate: 1.08,
    pitch: 0.98,
    volume: 0.90
  };
  } else if (
    upperText.includes('TUTORIAL') ||
    upperText.includes('TAP') ||
    upperText.includes('PRESS')
  ) {
    profile = {
      type: 'TUTORIAL',
      rate: 0.98,
      pitch: 1.02,
      volume: 0.74
    };
  }

 this.voiceProfile =
  profile;

// ------------------------------------------------------------
// VOICE DIRECTOR // smart cooldown
// BOSS / CRITICAL can interrupt the normal cooldown.
// COMBAT / MISSION / TUTORIAL are rate-limited.
// ------------------------------------------------------------

const priority =
  profile.type === 'BOSS'
    ? 4
    : profile.type === 'CRITICAL'
      ? 3
      : profile.type === 'COMBAT'
        ? 2
        : profile.type === 'MISSION'
          ? 1
          : 0;

const now =
  this.time?.now ??
  Date.now();

const lastVoiceAt =
  Number.isFinite(this.voiceLastAt)
    ? this.voiceLastAt
    : 0;

const cooldown =
  Number.isFinite(this.voiceCooldownMs)
    ? this.voiceCooldownMs
    : 1800;

const bypassCooldown =
  priority >= 3;

// High-priority commentary takes control immediately.
if (
  bypassCooldown &&
  this.voiceSpeaking &&
  typeof window !== 'undefined' &&
  'speechSynthesis' in window
) {
  this.voiceSerial =
    (this.voiceSerial || 0) + 1;

  window.speechSynthesis.cancel();
  this.voiceSpeaking = false;
}

if (
  !bypassCooldown &&
  now - lastVoiceAt < cooldown
) {
  return;
}

// Prevent queue spam during fast gameplay.
if (
  this.voiceQueue.some(
    entry =>
      entry?.text === voicedText
  )
) {
  return;
}

// Start cooldown only after the line is actually accepted.
this.voiceLastAt =
  now;
// Keep only the latest 4 pending lines.
if (
  this.voiceQueue.length >= 4
) {
  this.voiceQueue.shift();
}

const entry = {
  text: voicedText,
  profile,
  priority
};

this.voiceQueue.push(entry);

this.voiceQueue.sort(
  (a, b) =>
    (b?.priority || 0) -
    (a?.priority || 0)
);

// High-priority commentary owns the queue.
// Discard stale low-priority lines when BOSS / CRITICAL arrives.
if (
  priority >= 3
) {
  this.voiceQueue =
    this.voiceQueue.filter(
      queued =>
        (queued?.priority || 0) >= priority
    );
}

  // Keep the queue bounded even during heavy combat.
  if (this.voiceQueue.length > 4) {
    this.voiceQueue =
      this.voiceQueue.slice(0, 4);
  }

  this.pumpNarrationVoice();
}

pumpNarrationVoice() {
  if (
    !this.voiceEnabled ||
    this.voiceSpeaking ||
    !this.voiceQueue.length ||
    typeof window === 'undefined' ||
    !('speechSynthesis' in window)
  ) {
    return;
  }

let entry = null;

while (
  this.voiceQueue.length
) {
  const candidate =
    this.voiceQueue.shift();

  if (
    candidate &&
    typeof candidate.text === 'string' &&
    candidate.text.trim()
  ) {
    entry =
      candidate;
    break;
  }
}

if (!entry) {
  return;
}

  const text =
    entry.text;

  const profile =
    entry.profile || {
      type: 'MISSION',
      rate: 1.02,
      pitch: 0.92,
      volume: 0.82
    };

this.voiceSpeaking = true;

const voiceSerial =
  (this.voiceSerial || 0) + 1;

this.voiceSerial =
  voiceSerial;

const utterance =
  new SpeechSynthesisUtterance(
    text
  );

  utterance.lang =
    'en-US';

  utterance.rate =
    Number.isFinite(profile.rate)
      ? profile.rate
      : 1.02;

  utterance.pitch =
    Number.isFinite(profile.pitch)
      ? profile.pitch
      : 0.92;

const profileVolume =
  Number.isFinite(profile.volume)
    ? profile.volume
    : 0.82;

const masterVolume =
  Number.isFinite(this.voiceVolume)
    ? this.voiceVolume
    : 1.0;

utterance.volume =
  Phaser.Math.Clamp(
    profileVolume * masterVolume,
    0,
    1
  );

  const voices =
    Array.isArray(this.voiceVoices) &&
    this.voiceVoices.length
      ? this.voiceVoices
      : window.speechSynthesis.getVoices();

const selectedVoice =
  this.voiceVoiceName
    ? voices.find(
        voice =>
          voice.name ===
          this.voiceVoiceName
      )
    : null;

const preferredVoice =
  selectedVoice ||
  voices.find(
    voice =>
      voice.lang === 'en-US' &&
      /Google|Microsoft|Natural|Samantha|Alex/i.test(
        voice.name || ''
      )
  ) ||
  voices.find(
    voice =>
      voice.lang === 'en-US'
  ) ||
  voices.find(
    voice =>
      voice.lang?.startsWith('en')
  );
  if (preferredVoice) {
    utterance.voice =
      preferredVoice;
  }

const currentVoiceSerial =
  this.voiceSerial || 0;

const finishVoice =
  (delay = 0) => {
    if (
      (this.voiceSerial || 0) !==
      currentVoiceSerial
    ) {
      return;
    }

    if (
      this.scene?.isActive &&
      !this.scene.isActive()
    ) {
      return;
    }

    this.voiceSpeaking =
      false;

    this.time?.delayedCall(
      delay,
      () => {
        if (
          (this.voiceSerial || 0) !==
          currentVoiceSerial
        ) {
          return;
        }

        if (
          this.scene?.isActive &&
          !this.scene.isActive()
        ) {
          return;
        }

        this.pumpNarrationVoice();
      }
    );
  };

utterance.onend =
  () => {
    finishVoice(180);
  };

utterance.onerror =
  () => {
    finishVoice(120);
  };

try {
  window.speechSynthesis.speak(
    utterance
  );
} catch (error) {
  console.warn(
    '[AI VOICE] speechSynthesis.speak failed:',
    error
  );

  this.voiceSpeaking =
    false;

  this.time?.delayedCall(
    100,
    () =>
      this.pumpNarrationVoice()
  );
}
}

setupNarrationVoice() {
  if (
    typeof window === 'undefined' ||
    !('speechSynthesis' in window)
  ) {
    return;
  }

  if (this.narrationHandler) {
    this.game.events.off(
      'narration',
      this.narrationHandler
    );
  }

  this.narrationHandler =
    text => {
      this.speakNarration(text);
    };

  this.game.events.on(
    'narration',
    this.narrationHandler
  );

  const loadVoices = () => {
    const voices =
      window.speechSynthesis.getVoices();

    this.voiceVoices =
      Array.isArray(voices)
        ? voices
        : [];
  };

  loadVoices();

  if (
    'onvoiceschanged' in
    window.speechSynthesis
  ) {
const previousHandler =
  window.speechSynthesis.onvoiceschanged;

this.voicePreviousVoicesChangedHandler =
  typeof previousHandler === 'function'
    ? previousHandler
    : null;

    this.voiceVoicesChangedHandler =
      () => {
        loadVoices();

        if (
          typeof previousHandler === 'function' &&
          previousHandler !==
            this.voiceVoicesChangedHandler
        ) {
          try {
            previousHandler.call(
              window.speechSynthesis
            );
          } catch (error) {
            console.warn(
              '[AI VOICE] Previous voiceschanged handler failed:',
              error
            );
          }
        }
      };

    window.speechSynthesis.onvoiceschanged =
      this.voiceVoicesChangedHandler;
  }
}

createTextures() {
const make = (key, width, height, draw) => {
const graphics = this.make.graphics({ add: false });
draw(graphics); graphics.generateTexture(key, width, height); graphics.destroy();
};

const runner = (key, leftLeg, rightLeg, arm) =>
  make(key, 48, 64, g => {

    // ============================================================
    // RUNNER // PREMIUM CYBER COURIER
    // Fixed 48x64 texture footprint.
    // Existing animation keys remain unchanged.
    // ============================================================

    // ------------------------------------------------------------
    // PALETTE
    // ------------------------------------------------------------
    
    const C = {
      void: 0x07111d,
      armor: 0x131f30,
      armor2: 0x1d3148,
      armor3: 0x29425e,
      metal: 0x8095a8,
      white: 0xf4fbff,
      glass: 0x06101b,
      cyan: 0x7eefff,
      cyanHot: 0xe9fdff,
      blue: 0x2aa9d6,
      gold: 0xffd06e,
      amber: 0xff9b57,
      red: 0xff5b6e,
    };

    // ------------------------------------------------------------
    // OUTER MOTION FIELD
    // ------------------------------------------------------------
    
    g.fillStyle(C.cyan, 0.035)
      .fillCircle(24, 31, 27);

    g.fillStyle(C.cyan, 0.055)
      .fillCircle(24, 29, 22);

    // ------------------------------------------------------------
    // REAR SILHOUETTE / BACKPACK / POWER UNIT
    // ------------------------------------------------------------
    
    g.fillStyle(C.void)
      .fillRoundedRect(8, 24, 10, 22, 4);

    g.fillStyle(C.armor2)
      .fillRoundedRect(9, 26, 8, 18, 3);

    g.lineStyle(1.2, C.cyan, 0.55)
      .strokeRoundedRect(9, 26, 8, 18, 3);

    g.fillStyle(C.cyan, 0.18)
      .fillRoundedRect(10, 30, 5, 9, 2);

    g.fillStyle(C.cyanHot, 0.8)
      .fillRect(11, 32, 3, 5);

    // ------------------------------------------------------------
    // NECK / REAR COLLAR
    // ------------------------------------------------------------
    
    g.fillStyle(C.void)
      .fillRoundedRect(19, 17, 10, 9, 3);

    g.fillStyle(C.armor3)
      .fillRoundedRect(20, 18, 8, 7, 2);

    g.fillStyle(C.cyan, 0.45)
      .fillRect(21, 19, 6, 1.5);

    // ------------------------------------------------------------
    // HEAD AURA
    // ------------------------------------------------------------
    
    g.fillStyle(C.cyan, 0.08)
      .fillCircle(24, 11, 13);

    g.fillStyle(C.cyan, 0.045)
      .fillCircle(24, 11, 16);

    // ------------------------------------------------------------
    // HELMET // stronger silhouette than simple circle
    // ------------------------------------------------------------
    
    g.fillStyle(C.void)
      .fillRoundedRect(14, 3, 20, 16, 6);

    g.fillStyle(C.armor)
      .fillRoundedRect(15, 4, 18, 13, 5);

    g.fillStyle(C.armor3)
      .fillRoundedRect(17, 5, 14, 7, 4);

    // Helmet top ridge
    g.fillStyle(C.metal, 0.72)
      .fillRoundedRect(19, 4, 10, 2.5, 1.2);

    g.fillStyle(C.white, 0.18)
      .fillRect(20, 5, 6, 1);

    // Side helmet modules
    g.fillStyle(C.armor2)
      .fillRoundedRect(12, 9, 5, 7, 2)
      .fillRoundedRect(31, 9, 5, 7, 2);

    g.lineStyle(1, C.cyan, 0.55)
      .strokeRoundedRect(12, 9, 5, 7, 2)
      .strokeRoundedRect(31, 9, 5, 7, 2);

    g.fillStyle(C.cyanHot, 0.82)
      .fillRect(13, 11, 2, 1)
      .fillRect(33, 11, 2, 1);

    // ------------------------------------------------------------
    // VISOR // dark glass + layered emissive strip
    // ------------------------------------------------------------
    
    g.fillStyle(C.glass)
      .fillRoundedRect(13, 11, 22, 7, 3);

    g.fillStyle(C.armor2, 0.7)
      .fillRoundedRect(14, 12, 20, 4, 2);

    g.lineStyle(1.2, C.cyan, 0.88)
      .strokeRoundedRect(13, 11, 22, 7, 3);

    g.fillStyle(C.cyan, 0.48)
      .fillRoundedRect(16, 13, 16, 2.5, 1.2);

    g.fillStyle(C.cyanHot, 0.92)
      .fillRoundedRect(18, 13.5, 11, 1.2, 0.6);

    // Visor reflection
    g.lineStyle(1, C.white, 0.22)
      .lineBetween(16, 12.3, 23, 12.3);

    // ------------------------------------------------------------
    // SHOULDER MASS
    // ------------------------------------------------------------
    
    g.fillStyle(C.void)
      .fillRoundedRect(9, 23, 11, 10, 3)
      .fillRoundedRect(28, 23, 11, 10, 3);

    g.fillStyle(C.armor2)
      .fillRoundedRect(10, 23, 10, 8, 3)
      .fillRoundedRect(28, 23, 10, 8, 3);

    g.lineStyle(1.4, C.metal, 0.5)
      .strokeRoundedRect(10, 23, 10, 8, 3)
      .strokeRoundedRect(28, 23, 10, 8, 3);

    g.fillStyle(C.cyan, 0.65)
      .fillRect(12, 25, 6, 1.5)
      .fillRect(30, 25, 6, 1.5);

    // Shoulder warning detail
    g.fillStyle(C.gold, 0.78)
      .fillRect(12, 28, 4, 1)
      .fillRect(32, 28, 4, 1);

    // ------------------------------------------------------------
    // MAIN CHEST SILHOUETTE
    // ------------------------------------------------------------
    
    g.fillStyle(C.void)
      .fillRoundedRect(12, 21, 24, 27, 6);

    g.fillStyle(C.armor)
      .fillRoundedRect(13, 22, 22, 24, 5);

    // Chest upper shell
    g.fillStyle(C.armor3)
      .fillRoundedRect(16, 24, 16, 10, 4);

    // Chest center plate
    g.fillStyle(C.armor2)
      .fillRoundedRect(17, 31, 14, 13, 3);

    g.lineStyle(1, C.metal, 0.35)
      .strokeRoundedRect(17, 31, 14, 13, 3);

    // Chest side plates
    g.fillStyle(C.armor2)
      .fillRoundedRect(14, 33, 3, 9, 1.5)
      .fillRoundedRect(31, 33, 3, 9, 1.5);

    // ------------------------------------------------------------
    // CHEST CORE // signature identity
    // ------------------------------------------------------------
    
    g.fillStyle(C.cyan, 0.12)
      .fillCircle(24, 37, 8);

    g.fillStyle(C.cyan, 0.18)
      .fillCircle(24, 37, 6);

    g.lineStyle(1.2, C.cyan, 0.82)
      .strokeCircle(24, 37, 5);

    g.lineStyle(1, C.white, 0.5)
      .strokeCircle(24, 37, 3.5);

    g.fillStyle(C.cyanHot, 0.95)
      .fillCircle(24, 37, 2.3);

    g.fillStyle(C.white, 0.9)
      .fillCircle(23.2, 36.1, 0.9);

    // Core radial emitters
    g.lineStyle(1, C.cyan, 0.45)
      .lineBetween(24, 29, 24, 32)
      .lineBetween(24, 42, 24, 45)
      .lineBetween(16, 37, 19, 37)
      .lineBetween(29, 37, 32, 37);

    // ------------------------------------------------------------
    // ABDOMINAL ARMOR
    // ------------------------------------------------------------
    
    g.fillStyle(C.void)
      .fillRoundedRect(18, 42, 12, 8, 2.5);

    g.fillStyle(C.armor3)
      .fillRoundedRect(19, 43, 10, 5, 2);

    g.fillStyle(C.cyan, 0.5)
      .fillRect(21, 44, 6, 1);

    // ------------------------------------------------------------
    // BELT / UTILITY RIG
    // ------------------------------------------------------------
    
    g.fillStyle(C.void)
      .fillRoundedRect(14, 46, 20, 5, 2);

    g.fillStyle(C.armor2)
      .fillRoundedRect(15, 46, 18, 3, 1.2);

    g.fillStyle(C.gold, 0.9)
      .fillRoundedRect(20, 46, 8, 2, 0.8);

    g.fillStyle(C.cyanHot, 0.85)
      .fillRect(23, 46.4, 3, 1);

    // Side utility cells
    g.fillStyle(C.red, 0.72)
      .fillRoundedRect(15, 45, 3, 3, 1);

    g.fillStyle(C.cyan, 0.72)
      .fillRoundedRect(30, 45, 3, 3, 1);

    // ------------------------------------------------------------
    // ARMS
    // Dynamic endpoints preserve existing per-state pose system.
    // ------------------------------------------------------------
    
    const leftShoulder = { x: 14, y: 29 };
    const leftElbow = { x: 9, y: arm };
    const rightShoulder = { x: 34, y: 29 };
    const rightElbow = { x: 39, y: 42 - arm / 5 };

    // Left upper arm
    g.lineStyle(7, C.void, 0.98)
      .lineBetween(leftShoulder.x, leftShoulder.y, leftElbow.x, leftElbow.y);

    g.lineStyle(4.6, C.armor3, 0.98)
      .lineBetween(leftShoulder.x, leftShoulder.y, leftElbow.x, leftElbow.y);

    // Right upper arm
    g.lineStyle(7, C.void, 0.98)
      .lineBetween(rightShoulder.x, rightShoulder.y, rightElbow.x, rightElbow.y);

    g.lineStyle(4.6, C.armor3, 0.98)
      .lineBetween(rightShoulder.x, rightShoulder.y, rightElbow.x, rightElbow.y);

    // Elbow caps
    g.fillStyle(C.armor2)
      .fillCircle(leftElbow.x, leftElbow.y, 3)
      .fillCircle(rightElbow.x, rightElbow.y, 3);

    g.lineStyle(1, C.metal, 0.55)
      .strokeCircle(leftElbow.x, leftElbow.y, 2.6)
      .strokeCircle(rightElbow.x, rightElbow.y, 2.6);

    // Forearm energy rails
    g.lineStyle(1.5, C.cyan, 0.75)
      .lineBetween(
        leftElbow.x + 1,
        leftElbow.y,
        leftElbow.x - 2,
        leftElbow.y + 5
      )
      .lineBetween(
        rightElbow.x - 1,
        rightElbow.y,
        rightElbow.x + 2,
        rightElbow.y + 4
      );

    // Gloves
    g.fillStyle(C.void)
      .fillRoundedRect(
        leftElbow.x - 4,
        leftElbow.y + 3,
        7,
        5,
        2
      )
      .fillRoundedRect(
        rightElbow.x - 3,
        rightElbow.y + 3,
        7,
        5,
        2
      );

    g.fillStyle(C.cyan, 0.8)
      .fillRect(leftElbow.x - 2, leftElbow.y + 4, 3, 1)
      .fillRect(rightElbow.x - 1, rightElbow.y + 4, 3, 1);

    // ------------------------------------------------------------
    // LEGS
    // Dynamic endpoints preserve existing run/jump/dash poses.
    // ------------------------------------------------------------
    
    const leftHip = { x: 19, y: 47 };
    const rightHip = { x: 29, y: 47 };

    // Keep every leg pose inside the fixed 48x64 texture footprint.
    // This preserves the existing animation parameters while preventing
    // knees, shin rails and boots from being clipped at the bottom.
    const leftKneeY =
      Phaser.Math.Clamp(
        leftLeg - 8,
        45,
        55
      );

    const rightKneeY =
      Phaser.Math.Clamp(
        rightLeg - 8,
        45,
        55
      );

    const leftKnee = {
      x: 17,
      y: leftKneeY
    };

    const rightKnee = {
      x: 33,
      y: rightKneeY
    };

    // Upper leg masses
    g.lineStyle(9, C.void, 0.98)
      .lineBetween(leftHip.x, leftHip.y, leftKnee.x, leftKnee.y)
      .lineBetween(rightHip.x, rightHip.y, rightKnee.x, rightKnee.y);

    g.lineStyle(6, C.armor3, 0.98)
      .lineBetween(leftHip.x, leftHip.y, leftKnee.x, leftKnee.y)
      .lineBetween(rightHip.x, rightHip.y, rightKnee.x, rightKnee.y);

    // Knee armor
    g.fillStyle(C.armor2)
      .fillCircle(leftKnee.x, leftKnee.y, 4)
      .fillCircle(rightKnee.x, rightKnee.y, 4);

    g.lineStyle(1, C.cyan, 0.62)
      .strokeCircle(leftKnee.x, leftKnee.y, 3.4)
      .strokeCircle(rightKnee.x, rightKnee.y, 3.4);

    // Shin rails
    g.lineStyle(2, C.cyan, 0.68)
      .lineBetween(
        leftKnee.x,
        leftKnee.y + 2,
        leftKnee.x - 1,
        leftKnee.y + 7
      )
      .lineBetween(
        rightKnee.x,
        rightKnee.y + 2,
        rightKnee.x + 1,
        rightKnee.y + 7
      );

    // ------------------------------------------------------------
    // BOOTS // stronger silhouette + energy sole
    // ------------------------------------------------------------
    
 const leftBootY =
  Phaser.Math.Clamp(
    leftKneeY + 8,
    51,
    57
  );

const rightBootY =
  Phaser.Math.Clamp(
    rightKneeY + 8,
    51,
    57
  );

    g.fillStyle(C.void)
      .fillRoundedRect(11, leftBootY - 2, 11, 6, 2)
      .fillRoundedRect(27, rightBootY - 2, 11, 6, 2);

    g.fillStyle(C.armor)
      .fillRoundedRect(12, leftBootY - 1, 9, 4, 1.5)
      .fillRoundedRect(28, rightBootY - 1, 9, 4, 1.5);

    // Boot toe armor
    g.fillStyle(C.armor3)
      .fillRoundedRect(12, leftBootY, 7, 2, 1)
      .fillRoundedRect(28, rightBootY, 7, 2, 1);

    // Energy sole
    g.fillStyle(C.cyan, 0.85)
      .fillRoundedRect(13, leftBootY + 2, 6, 1, 0.5)
      .fillRoundedRect(29, rightBootY + 2, 6, 1, 0.5);

    // ------------------------------------------------------------
    // ARMOR SEAMS / MICRO DETAILS
    // ------------------------------------------------------------
    
    g.lineStyle(1, C.metal, 0.3)
      .lineBetween(16, 26, 16, 29)
      .lineBetween(32, 26, 32, 29)
      .lineBetween(15, 39, 18, 39)
      .lineBetween(30, 39, 33, 39);

    g.fillStyle(C.gold, 0.65)
      .fillRect(18, 27, 3, 1)
      .fillRect(27, 27, 3, 1);

    // ------------------------------------------------------------
    // STATE-DEPENDENT ENERGY ACCENTS
    // Uses the existing arm/leg pose values to subtly vary energy.
    // ------------------------------------------------------------
    
    const poseIntensity =
      Math.min(
        1,
        Math.abs(leftLeg - rightLeg) / 12 +
        Math.abs(arm - 40) / 30
      );

    g.fillStyle(C.cyan, 0.16 + poseIntensity * 0.10)
      .fillCircle(24, 37, 9);

    g.fillStyle(C.cyanHot, 0.35 + poseIntensity * 0.2)
      .fillCircle(24, 37, 1.5);

    // ------------------------------------------------------------
    // TOP / CHEST HOT PIXELS
    // ------------------------------------------------------------
    
    g.fillStyle(C.white, 0.65)
      .fillRect(28, 6, 2, 1)
      .fillRect(18, 20, 2, 1)
      .fillRect(29, 41, 2, 1);

    // ------------------------------------------------------------
    // FINAL SILHOUETTE EDGE HIGHLIGHTS
    // ------------------------------------------------------------
    
    g.lineStyle(1, C.cyan, 0.28)
      .lineBetween(16, 18, 13, 23)
      .lineBetween(32, 18, 35, 23)
      .lineBetween(14, 43, 18, 47)
      .lineBetween(34, 43, 30, 47);

  });

// Generated textures are isolated here so authored sprite sheets can replace them later.
runner('runner-idle', 60, 60, 40);
runner('runner-run-a', 56, 63, 50);
runner('runner-run-b', 63, 56, 27);
runner('runner-jump', 54, 54, 30);
runner('runner-fall', 62, 62, 58);
runner('runner-land', 55, 55, 42);
runner('runner-dash', 54, 54, 22);
runner('runner-wall', 56, 62, 18);
runner('runner-hit', 62, 62, 62);
runner('runner-finish', 50, 50, 18);

make('signal', 56, 56, g => {
  g.fillStyle(0xffd06e, .08).fillCircle(28, 28, 27);
  g.fillStyle(0xffd06e, .2).fillCircle(28, 28, 20);
  g.lineStyle(2, 0xffe6a6, .85)
    .strokeCircle(28, 28, 15)
    .lineBetween(28, 6, 28, 15)
    .lineBetween(28, 41, 28, 50);
  g.fillStyle(0xffe7a6).fillCircle(28, 28, 8);
  g.fillStyle(0xff826e).fillCircle(28, 28, 3);
});

  make('shark', 96, 42, g => {
  // Shark aura
  g.fillStyle(
    0x58e7ff,
    0.08
  )
    .fillEllipse(
      48,
      22,
      92,
      34
    );

  // Body
  g.fillStyle(
    0x18374b
  )
    .fillEllipse(
      48,
      23,
      78,
      22
    );

  // Belly
  g.fillStyle(
    0x8eb8c8
  )
    .fillEllipse(
      53,
      27,
      48,
      10
    );

  // Dorsal fin
  g.fillStyle(
    0x18374b
  )
    .fillTriangle(
      42,
      14,
      51,
      2,
      58,
      15
    );

  // Tail
  g.fillStyle(
    0x18374b
  )
    .fillTriangle(
      10,
      22,
      0,
      10,
      12,
      29
    )
    .fillTriangle(
      10,
      23,
      0,
      36,
      16,
      28
    );

  // Eye
  g.fillStyle(
    0xffd06e
  )
    .fillCircle(
      78,
      20,
      3
    );

  g.fillStyle(
    0xffffff
  )
    .fillCircle(
      79,
      19,
      1
    );

  // Jaw
  g.lineStyle(
    1.5,
    0xdffcff,
    0.8
  )
    .lineBetween(
      61,
      29,
      84,
      29
    );

  // Teeth
  g.fillStyle(
    0xffffff,
    0.88
  )
    .fillTriangle(
      66,
      29,
      69,
      34,
      72,
      29
    )
    .fillTriangle(
      73,
      29,
      76,
      34,
      79,
      29
    );
});

make('barrier', 48, 64, g => {
  // OUTER WARNING FIELD
  g.fillStyle(0xff5364, 0.08)
    .fillRoundedRect(0, 0, 48, 64, 6);

  // DARK CORE
  g.fillStyle(0x0d1828)
    .fillRoundedRect(3, 3, 42, 58, 6);

  // INNER PANEL
  g.fillStyle(0x16263b)
    .fillRoundedRect(7, 7, 34, 50, 4);

  // WARNING FRAME
  g.lineStyle(2.5, 0xff5364, 0.95)
    .strokeRoundedRect(4, 4, 40, 56, 5);

  // INNER ENERGY FRAME
  g.lineStyle(1, 0xff826e, 0.55)
    .strokeRoundedRect(8, 8, 32, 48, 3);

  // CROSS-BEAM
  g.lineStyle(2, 0xff826e, 0.8)
    .lineBetween(7, 8, 41, 56)
    .lineBetween(41, 8, 7, 56);

  // CORE WARNING STRIP
  g.fillStyle(0xff5364, 0.14)
    .fillRoundedRect(14, 28, 20, 8, 3);

  g.fillStyle(0xff5364, 0.95)
    .fillRect(17, 31, 14, 2);

  // ENERGY NODES
  g.fillStyle(0xffd06e)
    .fillCircle(9, 10, 2)
    .fillCircle(39, 10, 2)
    .fillCircle(9, 54, 2)
    .fillCircle(39, 54, 2);
});

make('goal', 56, 68, g => {
  // RELAY AURA
  g.fillStyle(0xffd06e, 0.10)
    .fillCircle(28, 30, 27);

  g.fillStyle(0x8df4ff, 0.07)
    .fillCircle(28, 30, 22);

  // POLE
  g.lineStyle(4, 0xe8edf2, 0.95)
    .lineBetween(10, 66, 10, 4);

  g.lineStyle(1.5, 0xb9c7d5, 0.7)
    .lineBetween(14, 64, 14, 8);

  // FLAG SHADOW
  g.fillStyle(0x8b6a25, 0.45)
    .fillTriangle(13, 10, 49, 22, 13, 37);

  // MAIN FLAG
  g.fillStyle(0xffd06e)
    .fillTriangle(12, 8, 48, 20, 12, 35);

  // FLAG CORE
  g.fillStyle(0xfff0b5, 0.9)
    .fillTriangle(14, 11, 42, 20, 14, 29);

  // RELAY SYMBOL
  g.lineStyle(2, 0x8df4ff, 0.9)
    .lineBetween(19, 19, 31, 19)
    .lineBetween(25, 15, 25, 28);

  // TOP ENERGY NODE
  g.fillStyle(0xffffff, 0.95)
    .fillCircle(10, 4, 2);

  g.fillStyle(0x8df4ff, 0.6)
    .fillCircle(10, 4, 4);
});

make('rain', 8, 14, g => {
  // MAIN STREAK
  g.lineStyle(2, 0xd9e9ff, 0.42)
    .lineBetween(6, 0, 1, 13);

  // INNER HIGHLIGHT
  g.lineStyle(1, 0xffffff, 0.18)
    .lineBetween(7, 1, 3, 11);
});

make('dust', 10, 10, g => {
  // SOFT OUTER PARTICLE
  g.fillStyle(0xd6dbe2, 0.18)
    .fillCircle(5, 5, 5);

  // CORE
  g.fillStyle(0xe8edf2, 0.72)
    .fillCircle(5, 5, 2.5);
});

make('speed-line', 32, 3, g =>
  g.fillGradientStyle(
    0xe8fdff,
    0x8df4ff,
    0x8df4ff,
    0xe8fdff,
    0.15,
    0.9,
    0.9,
    0.15
  )
  .fillRoundedRect(0, 0, 32, 3, 1.5)
);

make('boost-pad', 58, 18, g => {
  // OUTER ENERGY FIELD
  g.fillStyle(0x8df4ff, 0.08)
    .fillRoundedRect(0, 1, 58, 17, 5);

  // DARK BODY
  g.fillStyle(0x0e1b2c)
    .fillRoundedRect(1, 2, 56, 15, 4);

  // INNER PANEL
  g.fillStyle(0x172b40)
    .fillRoundedRect(5, 5, 48, 9, 3);

  // NEON FRAME
  g.lineStyle(2, 0x8df4ff, 0.95)
    .strokeRoundedRect(2, 3, 54, 13, 4);

  // BOOST ARROWS
  g.fillStyle(0x8df4ff, 0.95)
    .fillTriangle(8, 13, 18, 5, 28, 13)
    .fillTriangle(25, 13, 35, 5, 45, 13);

  // HOT CENTERS
  g.fillStyle(0xe8fdff, 0.9)
    .fillTriangle(11, 11, 18, 6, 25, 11)
    .fillTriangle(28, 11, 35, 6, 42, 11);

  // CENTRAL CORE
  g.fillStyle(0x8df4ff, 0.18)
    .fillCircle(29, 9, 7);

  g.fillStyle(0xe8fdff)
    .fillCircle(29, 9, 2.5);
});

make('chaser', 52, 60, g => {
  // CHASER AURA
  g.fillStyle(0xff5364, 0.07)
    .fillCircle(26, 29, 26);

  g.fillStyle(0xff826e, 0.14)
    .fillCircle(26, 28, 22);

  // CORE BODY
  g.fillStyle(0x0b1726)
    .fillRoundedRect(8, 7, 36, 45, 9);

  // INNER ARMOR
  g.fillStyle(0x17283d)
    .fillRoundedRect(12, 11, 28, 36, 7);

  // NEON OUTLINE
  g.lineStyle(2.5, 0xff5364, 0.95)
    .strokeRoundedRect(9, 8, 34, 43, 8);

  // VISOR FIELD
  g.fillStyle(0xff5364, 0.14)
    .fillRoundedRect(14, 17, 24, 10, 4);

  // VISOR
  g.fillStyle(0xff826e)
    .fillRect(16, 20, 20, 4);

  // VISOR CORE
  g.fillStyle(0xffe0a8)
    .fillRect(19, 21, 14, 2);

  // LOWER ENERGY BAR
  g.fillStyle(0x8df4ff, 0.22)
    .fillRoundedRect(16, 34, 20, 5, 2);

  g.fillStyle(0x8df4ff, 0.9)
    .fillRect(19, 35, 14, 2);

  // SIDE SIGNAL NODES
  g.fillStyle(0xffd06e)
    .fillCircle(13, 44, 1.5)
    .fillCircle(39, 44, 1.5);
});

make('checkpoint', 30, 54, g => {
  // CHECKPOINT AURA
  g.fillStyle(0x8df4ff, 0.08)
    .fillCircle(14, 25, 16);

  // POST
  g.lineStyle(3, 0x8df4ff, 0.95)
    .lineBetween(6, 52, 6, 4);

  g.lineStyle(1, 0xdffcff, 0.55)
    .lineBetween(9, 50, 9, 8);

  // FLAG FIELD
  g.fillStyle(0x8df4ff, 0.18)
    .fillTriangle(8, 6, 27, 14, 8, 23);

  // FLAG CORE
  g.fillStyle(0x8df4ff, 0.75)
    .fillTriangle(9, 8, 24, 14, 9, 20);

  // FLAG OUTLINE
  g.lineStyle(1, 0xdffcff, 0.9)
    .strokeTriangle(8, 6, 27, 14, 8, 23);

  // ACTIVE NODE
  g.fillStyle(0xe8fdff)
    .fillCircle(6, 4, 2);

  g.fillStyle(0x8df4ff, 0.65)
    .fillCircle(6, 4, 4);
});

make('security', 42, 34, g => {
  // SECURITY WARNING AURA
  g.fillStyle(0xff5364, 0.07)
    .fillCircle(21, 17, 21);

  // MAIN HOUSING
  g.fillStyle(0x0c1727)
    .fillRoundedRect(4, 7, 34, 22, 9);

  // INNER PANEL
  g.fillStyle(0x18283c)
    .fillRoundedRect(8, 11, 26, 14, 6);

  // OUTLINE
  g.lineStyle(2, 0xff5364, 0.95)
    .strokeRoundedRect(5, 8, 32, 20, 8);

  // SENSOR CORE
  g.fillStyle(0xff5364, 0.20)
    .fillCircle(28, 17, 8);

  g.fillStyle(0xff826e)
    .fillCircle(28, 17, 4);

  g.fillStyle(0xfff0c7)
    .fillCircle(28, 16, 1.5);

  // SIDE LIGHT
  g.fillStyle(0xffd06e)
    .fillCircle(11, 17, 2);
});

make('guard', 32, 58, g => {
  // GUARD AURA
  g.fillStyle(0xff5364, 0.06)
    .fillCircle(16, 29, 17);

  // OUTER BODY
  g.fillStyle(0x0c1727)
    .fillRoundedRect(5, 6, 22, 46, 6);

  // ARMOR PANEL
  g.fillStyle(0x18283c)
    .fillRoundedRect(9, 10, 14, 36, 4);

  // NEON FRAME
  g.lineStyle(2, 0xff5364, 0.9)
    .strokeRoundedRect(6, 7, 20, 44, 5);

  // HEAD VISOR
  g.fillStyle(0xff5364, 0.16)
    .fillRoundedRect(9, 15, 14, 8, 3);

  g.fillStyle(0xffd06e)
    .fillRect(11, 17, 10, 3);

  // CHEST ENERGY
  g.fillStyle(0x8df4ff, 0.16)
    .fillRoundedRect(10, 29, 12, 7, 2);

  g.fillStyle(0x8df4ff)
    .fillRect(12, 31, 8, 2);

  // LOWER STATUS
  g.fillStyle(0xff5364)
    .fillRect(10, 41, 4, 2);

  g.fillStyle(0xffd06e)
    .fillRect(16, 41, 4, 2);

  // TOP SIGNAL
  g.fillStyle(0xfff0c7, 0.9)
    .fillCircle(16, 9, 1.5);

  g.fillStyle(0xff5364, 0.55)
    .fillCircle(16, 9, 3);
});

make('enemy-runner', 48, 64, g => {
  // OUTER THREAT AURA
  g.fillStyle(0xff5364, 0.08)
    .fillCircle(24, 31, 29);

  // HEAD GLOW
  g.fillStyle(0xd5f0ff, 0.12)
    .fillCircle(24, 12, 13);

  // HEAD
  g.fillStyle(0xd5f0ff)
    .fillCircle(24, 12, 10);

  // VISOR
  g.fillStyle(0x0b1220)
    .fillRoundedRect(14, 19, 20, 7, 3);

  g.fillStyle(0xff5364)
    .fillRect(17, 21, 14, 2);

  // BODY AURA
  g.fillStyle(0xff5364, 0.10)
    .fillRoundedRect(11, 21, 26, 29, 7);

  // BODY
  g.fillStyle(0x301c42)
    .fillRoundedRect(13, 23, 22, 25, 6);

  // ARMOR PANEL
  g.fillStyle(0x55306c)
    .fillRoundedRect(16, 26, 16, 17, 4);

  // CHEST ENERGY STRIP
  g.fillStyle(0xff826e, 0.18)
    .fillRoundedRect(15, 30, 18, 7, 3);

  g.fillStyle(0xff826e)
    .fillRect(17, 32, 14, 3);

  // ARMS
  g.lineStyle(5, 0xd5f0ff, 0.95)
    .lineBetween(15, 30, 7, 43)
    .lineBetween(33, 30, 41, 35);

  // ARM ENERGY
  g.lineStyle(2, 0xff5364, 0.75)
    .lineBetween(9, 40, 7, 43)
    .lineBetween(39, 34, 41, 35);

  // LEGS
  g.lineStyle(7, 0xff5364, 0.95)
    .lineBetween(19, 45, 16, 60)
    .lineBetween(29, 45, 33, 60);

  // LEG CORE
  g.lineStyle(2, 0xffd06e, 0.65)
    .lineBetween(19, 48, 17, 58)
    .lineBetween(29, 48, 32, 58);

  // FOOT ENERGY
  g.fillStyle(0x8df4ff)
    .fillRect(13, 58, 7, 2)
    .fillRect(31, 58, 7, 2);
});

make('invader', 48, 38, g => {
  // OUTER INVADER FIELD
  g.fillStyle(0xe0a7ff, 0.08)
    .fillEllipse(24, 19, 46, 34);

  // REAR ENERGY PLATES
  g.fillStyle(0x24153b)
    .fillTriangle(4, 19, 0, 12, 9, 15)
    .fillTriangle(44, 19, 48, 12, 39, 15);

  // MAIN BODY
  g.fillStyle(0x20172f)
    .fillRoundedRect(4, 8, 40, 24, 10);

  // INNER ARMOR
  g.fillStyle(0x4c2e68)
    .fillRoundedRect(8, 12, 32, 16, 7);

  // NEON OUTLINE
  g.lineStyle(2, 0xe0a7ff, 0.95)
    .strokeRoundedRect(4, 8, 40, 24, 10);

  // CENTRAL VISOR
  g.fillStyle(0x8df4ff, 0.14)
    .fillRoundedRect(11, 16, 26, 7, 3);

  g.fillStyle(0xdffcff)
    .fillRect(14, 18, 20, 3);

  // EYES
  g.fillStyle(0xe0a7ff, 0.20)
    .fillCircle(17, 20, 6)
    .fillCircle(31, 20, 6);

  g.fillStyle(0xe0a7ff)
    .fillCircle(17, 20, 3.5)
    .fillCircle(31, 20, 3.5);

  // CORE
  g.fillStyle(0x8df4ff, 0.18)
    .fillCircle(24, 28, 6);

  g.fillStyle(0x8df4ff)
    .fillCircle(24, 28, 2);

  // BOTTOM ENERGY VENTS
  g.fillStyle(0x55dfff, 0.85)
    .fillRect(13, 30, 7, 2)
    .fillRect(21, 30, 6, 2)
    .fillRect(29, 30, 7, 2);
});

make('chicken', 42, 38, g => {
  // SOFT SHADOW / AURA
  g.fillStyle(0xffd06e, 0.08)
    .fillCircle(21, 22, 17);

  // BODY SHADOW
  g.fillStyle(0xbcae91)
    .fillCircle(20, 23, 15);

  // BODY
  g.fillStyle(0xf4f0e7)
    .fillCircle(20, 21, 15);

  // WING
  g.fillStyle(0xe2ddd2)
    .fillEllipse(14, 23, 10, 14);

  // HEAD
  g.fillStyle(0xf4f0e7)
    .fillCircle(28, 10, 9);

  // HEAD HIGHLIGHT
  g.fillStyle(0xffffff, 0.75)
    .fillCircle(25, 7, 3);

  // BEAK SHADOW
  g.fillStyle(0xc28b33)
    .fillTriangle(34, 11, 42, 15, 34, 19);

  // BEAK
  g.fillStyle(0xffd06e)
    .fillTriangle(34, 10, 41, 14, 34, 17);

  // EYE
  g.fillStyle(0x172238)
    .fillCircle(31, 9, 2);

  g.fillStyle(0xffffff)
    .fillCircle(30.5, 8.5, 0.6);

  // COMB
  g.fillStyle(0xff5364)
    .fillCircle(25, 2, 3)
    .fillCircle(29, 1, 3)
    .fillCircle(33, 3, 2.5);

  // WATTLE
  g.fillStyle(0xff5364)
    .fillCircle(33, 16, 2.5);

  // LEGS
  g.lineStyle(2, 0xd9a949, 0.95)
    .lineBetween(16, 33, 14, 37)
    .lineBetween(25, 33, 27, 37);

  // FOOT TOES
  g.lineStyle(1.5, 0xd9a949, 0.9)
    .lineBetween(14, 37, 11, 37)
    .lineBetween(14, 37, 16, 36)
    .lineBetween(27, 37, 24, 37)
    .lineBetween(27, 37, 29, 36);
});

make('dino', 68, 48, g => {
  // OUTER DINOSAUR AURA
  g.fillStyle(0xaee37f, 0.08)
    .fillEllipse(34, 27, 62, 40);

  // TAIL
  g.fillStyle(0x466d48)
    .fillTriangle(0, 28, 18, 16, 20, 39);

  // MAIN BODY
  g.fillStyle(0x4d8652)
    .fillRoundedRect(8, 15, 48, 25, 10);

  // BODY ARMOR
  g.fillStyle(0x6fa66e)
    .fillRoundedRect(12, 19, 39, 17, 7);

  // BACK RIDGE
  g.fillStyle(0xaee37f, 0.8)
    .fillTriangle(15, 16, 20, 9, 23, 17)
    .fillTriangle(25, 16, 30, 8, 33, 17)
    .fillTriangle(35, 16, 40, 10, 43, 17);

  // HEAD
  g.fillStyle(0x6fa66e)
    .fillRoundedRect(44, 9, 20, 23, 8);

  // SNOUT
  g.fillStyle(0x5a8f5d)
    .fillRoundedRect(53, 18, 12, 11, 5);

  // EYE SOCKET
  g.fillStyle(0x172238)
    .fillCircle(51, 16, 6);

  // EYE
  g.fillStyle(0xffd06e)
    .fillCircle(52, 16, 3);

  g.fillStyle(0xffffff)
    .fillCircle(53, 15, 1);

  // NOSTRIL
  g.fillStyle(0x172238)
    .fillCircle(62, 23, 1.5);

  // MOUTH
  g.lineStyle(1.5, 0x2b4730, 0.9)
    .lineBetween(53, 28, 63, 28);

  // CHEST CORE
  g.fillStyle(0x8df4ff, 0.12)
    .fillCircle(31, 28, 9);

  g.fillStyle(0x8df4ff)
    .fillCircle(31, 28, 3);

  // FRONT LEG
  g.lineStyle(6, 0x4d8652, 0.95)
    .lineBetween(46, 35, 47, 46);

  // REAR LEG
  g.lineStyle(6, 0x466d48, 0.95)
    .lineBetween(21, 35, 20, 46);

  // FOOT ENERGY
  g.lineStyle(2, 0xaee37f, 0.85)
    .lineBetween(44, 46, 51, 46)
    .lineBetween(18, 46, 25, 46);
});

make('dino-boss', 112, 82, g => {
  // OUTER BOSS AURA
  g.fillStyle(0xff826e, 0.08)
    .fillCircle(56, 42, 39);

  g.fillStyle(0xffd06e, 0.08)
    .fillCircle(56, 42, 31);

  // REAR SPIKES
  g.fillStyle(0x233d32)
    .fillTriangle(16, 25, 2, 12, 22, 38)
    .fillTriangle(24, 21, 12, 4, 31, 31)
    .fillTriangle(88, 22, 104, 6, 91, 38);

  // MAIN ARMOR
  g.fillStyle(0x274936)
    .fillRoundedRect(13, 22, 82, 40, 14);

  // ARMOR INNER PANEL
  g.fillStyle(0x345f45)
    .fillRoundedRect(20, 28, 68, 27, 10);

  // NEON OUTLINE
  g.lineStyle(3, 0xaee37f, 0.95)
    .strokeRoundedRect(13, 22, 82, 40, 14);

  // HEAD / SNOUT
  g.fillStyle(0x6fa66e)
    .fillTriangle(
      0, 42,
      21, 16,
      25, 65
    );

  // EYE SOCKET
  g.fillStyle(0x172238)
    .fillEllipse(78, 30, 19, 15);

  // EYE GLOW
  g.fillStyle(0xffd06e, 0.25)
    .fillCircle(82, 29, 10);

  g.fillStyle(0xffd06e)
    .fillCircle(82, 29, 6);

  g.fillStyle(0xffffff, 0.9)
    .fillCircle(83, 28, 2);

  // CORE
  g.fillStyle(0xff826e, 0.18)
    .fillCircle(53, 43, 17);

  g.lineStyle(2, 0xffd06e, 0.8)
    .strokeCircle(53, 43, 12);

  g.fillStyle(0xffe0a8)
    .fillCircle(53, 43, 6);

  // ARMOR VENTS
  g.fillStyle(0x8df4ff, 0.8)
    .fillRect(33, 55, 7, 3)
    .fillRect(45, 57, 7, 3)
    .fillRect(57, 55, 7, 3);

  // JAW ACCENT
  g.lineStyle(2, 0xff826e, 0.9)
    .lineBetween(17, 56, 37, 66);

  // TOP ENERGY MARK
  g.fillStyle(0xdffcff, 0.9)
    .fillRect(42, 18, 22, 3);
});

make('sentinel-boss', 90, 92, g => {
  // OUTER ENERGY FIELD
  g.fillStyle(0x8df4ff, 0.08)
    .fillCircle(45, 46, 42);

  g.fillStyle(0xb9f5ff, 0.07)
    .fillCircle(45, 46, 34);

  // BACK PLATES
  g.fillStyle(0x10243a)
    .fillTriangle(18, 22, 5, 12, 20, 36)
    .fillTriangle(72, 22, 85, 12, 70, 36);

  // MAIN BODY
  g.fillStyle(0x172d48)
    .fillRoundedRect(15, 15, 60, 64, 15);

  // INNER ARMOR
  g.fillStyle(0x254866)
    .fillRoundedRect(21, 21, 48, 51, 11);

  // NEON OUTLINE
  g.lineStyle(3, 0x8df4ff, 0.95)
    .strokeRoundedRect(15, 15, 60, 64, 15);

  // CENTRAL CORE FIELD
  g.fillStyle(0x8df4ff, 0.16)
    .fillCircle(45, 42, 25);

  g.lineStyle(2, 0x55dfff, 0.9)
    .strokeCircle(45, 42, 20);

  g.lineStyle(1, 0xdffcff, 0.75)
    .strokeCircle(45, 42, 14);

  // CORE
  g.fillStyle(0xe8fdff)
    .fillCircle(45, 42, 8);

  g.fillStyle(0x8df4ff)
    .fillCircle(45, 42, 5);

  g.fillStyle(0xffffff)
    .fillCircle(43, 40, 2);

  // TOP SENSOR
  g.fillStyle(0x55dfff, 0.18)
    .fillCircle(45, 9, 9);

  g.fillStyle(0x8df4ff)
    .fillCircle(45, 9, 4);

  // LOWER WEAPON BAR
  g.fillStyle(0x0b1726)
    .fillRoundedRect(27, 67, 36, 9, 4);

  g.lineStyle(2, 0xff826e, 0.9)
    .strokeRoundedRect(27, 67, 36, 9, 4);

  // ENERGY VENTS
  g.fillStyle(0xdffcff, 0.9)
    .fillRect(29, 71, 6, 2)
    .fillRect(42, 71, 6, 2)
    .fillRect(55, 71, 6, 2);
});

make('storm-boss', 104, 86, g => {
  // OUTER STORM AURA
  g.fillStyle(0xb993ff, 0.08)
    .fillCircle(52, 43, 41);

  g.fillStyle(0xe0a7ff, 0.06)
    .fillCircle(52, 43, 34);

  // WING / STORM SHARDS
  g.fillStyle(0x241b45)
    .fillTriangle(6, 47, 34, 9, 46, 47);

  g.fillStyle(0x32235e)
    .fillTriangle(58, 47, 89, 8, 99, 49);

  // MAIN STORM BODY
  g.fillStyle(0x3d3169)
    .fillRoundedRect(25, 17, 54, 53, 16);

  // INNER ENERGY
  g.fillStyle(0x574587)
    .fillRoundedRect(31, 23, 42, 41, 12);

  // OUTLINE
  g.lineStyle(3, 0xe0a7ff, 0.95)
    .strokeRoundedRect(25, 17, 54, 53, 16);

  // ORBIT RING
  g.lineStyle(2, 0xb993ff, 0.85)
    .strokeCircle(52, 43, 24);

  g.lineStyle(1, 0xdabfff, 0.55)
    .strokeCircle(52, 43, 18);

  // CORE GLOW
  g.fillStyle(0xb993ff, 0.25)
    .fillCircle(52, 43, 17);

  // CORE
  g.fillStyle(0xffd06e)
    .fillCircle(52, 43, 8);

  g.fillStyle(0xfff0c7)
    .fillCircle(52, 43, 4);

  // LIGHTNING NODES
  g.fillStyle(0x8df4ff)
    .fillCircle(35, 29, 3)
    .fillCircle(69, 29, 3)
    .fillCircle(37, 57, 3)
    .fillCircle(67, 57, 3);

  // LIGHTNING STRIKES
  g.lineStyle(2, 0x8df4ff, 0.8)
    .lineBetween(35, 29, 44, 38)
    .lineBetween(69, 29, 60, 38)
    .lineBetween(37, 57, 45, 49)
    .lineBetween(67, 57, 59, 49);

  // TOP CROWN
  g.fillStyle(0xe0a7ff)
    .fillTriangle(39, 15, 45, 2, 51, 16)
    .fillTriangle(53, 15, 60, 2, 65, 16);
});
make('apex-boss', 108, 96, g => {
  // MASSIVE OUTER AURA
  g.fillStyle(0xff826e, 0.07)
    .fillCircle(54, 47, 45);

  g.fillStyle(0xffd06e, 0.06)
    .fillCircle(54, 47, 37);

  // SHOULDER PLATES
  g.fillStyle(0x251b30)
    .fillTriangle(17, 28, 2, 13, 25, 32);

  g.fillStyle(0x251b30)
    .fillTriangle(91, 28, 106, 13, 83, 32);

  // MAIN ARMOR
  g.fillStyle(0x2a2038)
    .fillRoundedRect(12, 17, 84, 62, 17);

  // INNER ARMOR
  g.fillStyle(0x463154)
    .fillRoundedRect(20, 24, 68, 47, 12);

  // HEAVY OUTLINE
  g.lineStyle(3, 0xffd06e, 0.95)
    .strokeRoundedRect(12, 17, 84, 62, 17);

  // TOP CROWN
  g.fillStyle(0xffd06e, 0.2)
    .fillTriangle(37, 18, 46, 2, 52, 20)
    .fillTriangle(55, 20, 64, 2, 71, 18);

  // CORE AURA
  g.fillStyle(0xff826e, 0.22)
    .fillCircle(54, 44, 29);

  // CORE RINGS
  g.lineStyle(2, 0xffd06e, 0.9)
    .strokeCircle(54, 44, 22);

  g.lineStyle(1, 0xff826e, 0.8)
    .strokeCircle(54, 44, 29);

  // CORE
  g.fillStyle(0xffe0a8)
    .fillCircle(54, 44, 10);

  g.fillStyle(0xff826e)
    .fillCircle(54, 44, 6);

  g.fillStyle(0xffffff, 0.95)
    .fillCircle(51, 41, 2.5);

  // EYE / VISOR
  g.fillStyle(0x0b1020)
    .fillRoundedRect(28, 29, 52, 9, 4);

  g.fillStyle(0xff826e)
    .fillRect(33, 32, 42, 3);

  // CHEST ENERGY BARS
  g.fillStyle(0x8df4ff, 0.8)
    .fillRect(31, 61, 11, 3)
    .fillRect(48, 61, 11, 3)
    .fillRect(65, 61, 11, 3);

  // LOWER CORE VENT
  g.fillStyle(0xdffcff)
    .fillRoundedRect(39, 69, 30, 6, 3);

  // SIDE ENERGY STRIPS
  g.fillStyle(0xffd06e, 0.8)
    .fillRect(18, 41, 4, 18)
    .fillRect(86, 41, 4, 18);
});

make('alien-ground', 54, 54, g => {
  // OUTER ALIEN AURA
  g.fillStyle(0xb993ff, 0.08)
    .fillCircle(27, 28, 25);

  g.fillStyle(0xe0a7ff, 0.10)
    .fillCircle(27, 28, 20);

  // MAIN ALIEN BODY
  g.fillStyle(0x241836)
    .fillRoundedRect(6, 10, 42, 38, 13);

  // INNER BODY PANEL
  g.fillStyle(0x402d64)
    .fillRoundedRect(10, 14, 34, 29, 10);

  // NEON OUTLINE
  g.lineStyle(2, 0xe0a7ff, 0.95)
    .strokeRoundedRect(6, 10, 42, 38, 13);

  // EYE GLOW
  g.fillStyle(0xe0a7ff, 0.18)
    .fillCircle(18, 25, 8)
    .fillCircle(36, 25, 8);

  // EYES
  g.fillStyle(0xf3d9ff)
    .fillEllipse(18, 25, 11, 9)
    .fillEllipse(36, 25, 11, 9);

  // PUPILS
  g.fillStyle(0x24152f)
    .fillCircle(18, 25, 3)
    .fillCircle(36, 25, 3);

  // EYE HIGHLIGHTS
  g.fillStyle(0xffffff)
    .fillCircle(17, 24, 1)
    .fillCircle(35, 24, 1);

  // CENTRAL SIGNAL CORE
  g.fillStyle(0x8df4ff, 0.18)
    .fillCircle(27, 36, 9);

  g.lineStyle(1.5, 0x8df4ff, 0.8)
    .strokeCircle(27, 36, 7);

  g.fillStyle(0xe8fdff)
    .fillCircle(27, 36, 3);

  // LOWER ENERGY BAND
  g.fillStyle(0x8df4ff, 0.14)
    .fillRoundedRect(15, 43, 24, 7, 3);

  g.fillStyle(0x8df4ff)
    .fillRect(18, 45, 18, 3);
});

make('egg', 24, 30, g => {
  // OUTER WARNING GLOW
  g.fillStyle(0xff826e, 0.10)
    .fillCircle(12, 15, 13);

  // SHADOW / OUTER SHELL
  g.fillStyle(0xc9a85d)
    .fillEllipse(12, 16, 17, 25);

  // MAIN SHELL
  g.fillStyle(0xfff3cf)
    .fillEllipse(12, 14, 15, 23);

  // SHELL HIGHLIGHT
  g.fillStyle(0xffffff, 0.75)
    .fillEllipse(9, 10, 5, 9);

  // ENERGY CRACKS
  g.lineStyle(1.2, 0xff826e, 0.9)
    .lineBetween(7, 12, 10, 15)
    .lineBetween(10, 15, 8, 18)
    .lineBetween(10, 15, 13, 13);

  // GOLDEN OUTLINE
  g.lineStyle(1.5, 0xffd06e, 0.95)
    .strokeEllipse(12, 14, 15, 23);

  // TOP ENERGY SPARK
  g.fillStyle(0xffd06e)
    .fillCircle(16, 4, 2);

  g.fillStyle(0xfff3cf, 0.7)
    .fillCircle(16, 4, 4);
});

make('comet', 40, 40, g => {
  // OUTER WARNING AURA
  g.fillStyle(0xff826e, 0.08)
    .fillCircle(20, 20, 19);

  // ENERGY TRAIL
  g.fillStyle(0xff826e, 0.16)
    .fillTriangle(
      4, 20,
      18, 14,
      18, 26
    );

  g.fillStyle(0xffd06e, 0.20)
    .fillTriangle(
      7, 20,
      18, 16,
      18, 24
    );

  // MAIN PLASMA CORE
  g.fillStyle(0xff826e, 0.28)
    .fillCircle(21, 20, 14);

  g.lineStyle(2, 0xff826e, 0.95)
    .strokeCircle(21, 20, 11);

  // HOT CORE
  g.fillStyle(0xffd06e)
    .fillCircle(21, 20, 8);

  // INNER CORE
  g.fillStyle(0xfff3cf)
    .fillCircle(19, 18, 4);

  // CORE HIGHLIGHT
  g.fillStyle(0xffffff, 0.95)
    .fillCircle(18, 17, 2);

  // ENERGY RINGS
  g.lineStyle(1, 0xffe0a8, 0.65)
    .strokeCircle(21, 20, 15);

  g.lineStyle(1, 0x8df4ff, 0.45)
    .strokeCircle(21, 20, 18);

  // PLASMA SPARKS
  g.fillStyle(0xffd06e, 0.9)
    .fillCircle(11, 10, 2)
    .fillCircle(31, 12, 1.5)
    .fillCircle(30, 29, 2)
    .fillCircle(12, 31, 1.5);
});

make('kinetic-ball', 34, 34, g => {
  // OUTER ENERGY FIELD
  g.fillStyle(0x8df4ff, 0.08)
    .fillCircle(17, 17, 16);

  g.fillStyle(0x55dfff, 0.12)
    .fillCircle(17, 17, 13);

  // OUTER RING
  g.lineStyle(2, 0x8df4ff, 0.9)
    .strokeCircle(17, 17, 12);

  g.lineStyle(1, 0xdffcff, 0.65)
    .strokeCircle(17, 17, 8);

  // CENTRAL CORE GLOW
  g.fillStyle(0x8df4ff, 0.28)
    .fillCircle(17, 17, 9);

  // CORE
  g.fillStyle(0xe8fdff)
    .fillCircle(17, 17, 6);

  g.fillStyle(0x8df4ff)
    .fillCircle(17, 17, 4);

  // CORE HIGHLIGHT
  g.fillStyle(0xffffff, 0.95)
    .fillCircle(15, 15, 2);

  // ENERGY CROSS
  g.lineStyle(1.5, 0xb9f5ff, 0.8)
    .lineBetween(17, 3, 17, 8)
    .lineBetween(17, 26, 17, 31)
    .lineBetween(3, 17, 8, 17)
    .lineBetween(26, 17, 31, 17);

  // SMALL ENERGY NODES
  g.fillStyle(0x55dfff)
    .fillCircle(6, 8, 1.5)
    .fillCircle(28, 8, 1.5)
    .fillCircle(8, 28, 1.5)
    .fillCircle(28, 28, 1.5);
});

make('shield', 54, 72, g => {
  // OUTER ENERGY AURA
  g.fillStyle(0x8df4ff, 0.07)
    .fillRoundedRect(4, 2, 46, 68, 13);

  g.fillStyle(0x55dfff, 0.10)
    .fillRoundedRect(7, 5, 40, 62, 11);

  // MAIN SHIELD BODY
  g.fillStyle(0x10283d, 0.86)
    .fillRoundedRect(8, 4, 38, 64, 10);

  // INNER ENERGY PANEL
  g.fillStyle(0x183b55, 0.72)
    .fillRoundedRect(12, 9, 30, 52, 8);

  // NEON OUTLINE
  g.lineStyle(2, 0x8df4ff, 0.95)
    .strokeRoundedRect(8, 4, 38, 64, 10);

  // INNER FRAME
  g.lineStyle(1, 0xb9f5ff, 0.55)
    .strokeRoundedRect(12, 9, 30, 52, 8);

  // TOP SENSOR
  g.fillStyle(0x8df4ff, 0.22)
    .fillCircle(27, 16, 8);

  g.fillStyle(0xe8fdff)
    .fillCircle(27, 16, 4);

  g.fillStyle(0xffffff, 0.9)
    .fillCircle(26, 15, 1.5);

  // CENTRAL ENERGY CORE
  g.fillStyle(0x8df4ff, 0.18)
    .fillCircle(27, 37, 14);

  g.lineStyle(1.5, 0x55dfff, 0.85)
    .strokeCircle(27, 37, 11);

  g.fillStyle(0x8df4ff)
    .fillCircle(27, 37, 6);

  g.fillStyle(0xe8fdff)
    .fillCircle(27, 37, 3);

  // ENERGY CIRCUIT LINES
  g.lineStyle(1, 0x55dfff, 0.7)
    .lineBetween(15, 24, 15, 48)
    .lineBetween(39, 24, 39, 48)
    .lineBetween(17, 50, 24, 57)
    .lineBetween(37, 50, 30, 57);

  // LOWER ENERGY BAR
  g.fillStyle(0x8df4ff, 0.16)
    .fillRoundedRect(16, 56, 22, 6, 3);

  g.fillStyle(0x8df4ff)
    .fillRect(19, 58, 16, 2);

  // SIDE ENERGY NODES
  g.fillStyle(0x55dfff)
    .fillCircle(10, 35, 2)
    .fillCircle(44, 35, 2);
});

make('blaster', 46, 22, g => {
  // OUTER WEAPON GLOW
  g.fillStyle(0x8df4ff, 0.08)
    .fillRoundedRect(1, 3, 44, 16, 5);

  // MAIN BODY
  g.fillStyle(0x18263b)
    .fillRoundedRect(4, 5, 34, 11, 4);

  // UPPER ARMOR
  g.fillStyle(0x2d4664)
    .fillRoundedRect(8, 3, 23, 5, 2);

  // NEON BODY OUTLINE
  g.lineStyle(1.5, 0x8df4ff, 0.9)
    .strokeRoundedRect(4, 5, 34, 11, 4);

  // BARREL
  g.fillStyle(0x0b1726)
    .fillRoundedRect(28, 7, 15, 7, 2);

  // PLASMA BARREL
  g.fillStyle(0x8df4ff, 0.22)
    .fillRoundedRect(29, 8, 14, 5, 2);

  g.fillStyle(0xe8fdff)
    .fillRect(34, 9, 9, 3);

  // ENERGY CORE
  g.fillStyle(0x8df4ff, 0.18)
    .fillCircle(17, 10, 7);

  g.fillStyle(0x8df4ff)
    .fillCircle(17, 10, 4);

  g.fillStyle(0xffffff, 0.9)
    .fillCircle(16, 9, 1.5);

  // GRIP
  g.fillStyle(0x101a2b)
    .fillRoundedRect(10, 15, 11, 6, 2);

  g.lineStyle(1, 0xffd06e, 0.8)
    .lineBetween(12, 17, 19, 20);

  // AMMO / ENERGY INDICATOR
  g.fillStyle(0xffd06e, 0.22)
    .fillRoundedRect(23, 16, 10, 3, 1);

  g.fillStyle(0xffd06e)
    .fillRect(24, 17, 7, 1);

  // MUZZLE SPARK
  g.fillStyle(0xffffff, 0.9)
    .fillCircle(44, 10, 2);

  g.fillStyle(0x8df4ff, 0.7)
    .fillCircle(44, 10, 4);
});

make('sword', 64, 20, g => {
  // OUTER ENERGY GLOW
  g.fillStyle(0x8df4ff, 0.08)
    .fillTriangle(8, 10, 58, 3, 58, 17);

  // BLADE CORE
  g.fillStyle(0xdffcff)
    .fillTriangle(12, 10, 56, 3, 56, 17);

  // HOT BLADE EDGE
  g.fillStyle(0xffffff, 0.95)
    .fillTriangle(18, 10, 56, 5, 56, 8);

  // CYAN ENERGY EDGE
  g.lineStyle(2, 0x8df4ff, 0.95)
    .lineBetween(12, 10, 56, 3)
    .lineBetween(12, 10, 56, 17);

  // INNER ENERGY LINE
  g.lineStyle(1, 0xb9f5ff, 0.8)
    .lineBetween(20, 10, 54, 8);

  // GUARD
  g.fillStyle(0x17263a)
    .fillRoundedRect(7, 5, 11, 11, 3);

  g.lineStyle(1.5, 0xffd06e, 0.95)
    .strokeRoundedRect(7, 5, 11, 11, 3);

  // ENERGY CELL
  g.fillStyle(0xffd06e)
    .fillRect(10, 8, 5, 5);

  g.fillStyle(0xffffff, 0.8)
    .fillRect(11, 9, 2, 2);

  // HANDLE
  g.fillStyle(0x0b1726)
    .fillRoundedRect(2, 6, 8, 8, 2);

  g.lineStyle(1, 0x8df4ff, 0.8)
    .strokeRoundedRect(2, 6, 8, 8, 2);

  // HANDLE GRIP
  g.fillStyle(0xff826e, 0.75)
    .fillRect(4, 8, 4, 2)
    .fillRect(4, 11, 4, 2);

  // BLADE TIP
  g.fillStyle(0xffffff)
    .fillCircle(56, 10, 2);

  g.fillStyle(0x8df4ff, 0.6)
    .fillCircle(56, 10, 4);
});

make('plasma', 30, 16, g => {
  // OUTER PLASMA AURA
  g.fillStyle(0x8df4ff, 0.08)
    .fillEllipse(15, 8, 29, 15);

  g.fillStyle(0x55dfff, 0.18)
    .fillEllipse(15, 8, 24, 12);

  // MAIN ENERGY SHELL
  g.fillStyle(0x8df4ff, 0.55)
    .fillEllipse(15, 8, 19, 10);

  // HOT CENTER
  g.fillStyle(0xe8fdff)
    .fillEllipse(15, 8, 12, 7);

  // CORE
  g.fillStyle(0xffffff)
    .fillEllipse(15, 8, 7, 4);

  // ENERGY CONTOUR
  g.lineStyle(1.5, 0xb9f5ff, 0.95)
    .strokeEllipse(15, 8, 21, 11);

  // TRAILING ENERGY
  g.fillStyle(0x8df4ff, 0.20)
    .fillTriangle(2, 4, 11, 8, 2, 12);

  g.fillStyle(0x55dfff, 0.18)
    .fillTriangle(0, 6, 8, 8, 0, 10);

  // HOT SPARK
  g.fillStyle(0xffffff, 0.9)
    .fillCircle(18, 6, 1.5);

  // SMALL ENERGY NODES
  g.fillStyle(0x55dfff, 0.85)
    .fillCircle(7, 3, 1)
    .fillCircle(8, 13, 1);
});

make('turret', 52, 52, g => {
  // OUTER DEFENSE AURA
  g.fillStyle(0x8df4ff, 0.07)
    .fillCircle(26, 28, 24);

  // BASE GLOW
  g.fillStyle(0x55dfff, 0.10)
    .fillRoundedRect(4, 25, 44, 20, 7);

  // MAIN BASE
  g.fillStyle(0x16263b)
    .fillRoundedRect(5, 27, 42, 17, 6);

  // BASE INNER PANEL
  g.fillStyle(0x263f5d)
    .fillRoundedRect(9, 30, 34, 11, 4);

  // BASE OUTLINE
  g.lineStyle(2, 0x8df4ff, 0.9)
    .strokeRoundedRect(5, 27, 42, 17, 6);

  // TURRET HOUSING
  g.fillStyle(0x20344e)
    .fillRoundedRect(13, 17, 26, 17, 7);

  g.lineStyle(2, 0xb9f5ff, 0.85)
    .strokeRoundedRect(13, 17, 26, 17, 7);

  // ROTATING CORE
  g.fillStyle(0x8df4ff, 0.16)
    .fillCircle(26, 25, 11);

  g.lineStyle(1.5, 0x55dfff, 0.85)
    .strokeCircle(26, 25, 8);

  // BARREL
  g.fillStyle(0x0b1726)
    .fillRoundedRect(22, 4, 8, 20, 3);

  g.lineStyle(1.5, 0x8df4ff, 0.9)
    .strokeRoundedRect(22, 4, 8, 20, 3);

  // BARREL ENERGY
  g.fillStyle(0x8df4ff)
    .fillRect(24, 7, 4, 12);

  g.fillStyle(0xe8fdff)
    .fillRect(24, 8, 4, 5);

  // MUZZLE CORE
  g.fillStyle(0xffffff)
    .fillCircle(26, 5, 3);

  g.fillStyle(0x8df4ff, 0.6)
    .fillCircle(26, 5, 5);

  // STATUS LIGHTS
  g.fillStyle(0xffd06e)
    .fillCircle(16, 37, 2);

  g.fillStyle(0xff826e)
    .fillCircle(36, 37, 2);

  // LOWER ENERGY VENTS
  g.fillStyle(0x55dfff, 0.8)
    .fillRect(16, 42, 7, 2)
    .fillRect(29, 42, 7, 2);

  // SIDE ARMOR
  g.fillStyle(0x172238)
    .fillTriangle(5, 28, 1, 34, 7, 40)
    .fillTriangle(47, 28, 51, 34, 45, 40);
});
  
make('spring-pad', 64, 24, g => {
  // OUTER ENERGY GLOW
  g.fillStyle(0xaee37f, 0.08)
    .fillRoundedRect(1, 3, 62, 18, 5);

  g.fillStyle(0x8df4ff, 0.06)
    .fillRoundedRect(4, 5, 56, 14, 4);

  // MAIN BODY
  g.fillStyle(0x17263b)
    .fillRoundedRect(2, 5, 60, 16, 5);

  // INNER PANEL
  g.fillStyle(0x263853)
    .fillRoundedRect(6, 8, 52, 10, 3);

  // NEON OUTLINE
  g.lineStyle(2, 0xaee37f, 0.95)
    .strokeRoundedRect(2, 5, 60, 16, 5);

  // INNER ENERGY FRAME
  g.lineStyle(1, 0x8df4ff, 0.65)
    .strokeRoundedRect(6, 8, 52, 10, 3);

  // LAUNCH ARROWS
  g.fillStyle(0xaee37f, 0.95)
    .fillTriangle(10, 16, 18, 10, 18, 16)
    .fillTriangle(22, 16, 30, 10, 30, 16)
    .fillTriangle(34, 16, 42, 10, 42, 16)
    .fillTriangle(46, 16, 54, 10, 54, 16);

  // ARROW HOT CENTERS
  g.fillStyle(0xe8ffd0, 0.85)
    .fillTriangle(12, 15, 18, 11, 18, 15)
    .fillTriangle(24, 15, 30, 11, 30, 15)
    .fillTriangle(36, 15, 42, 11, 42, 15)
    .fillTriangle(48, 15, 54, 11, 54, 15);

  // CENTRAL ENERGY CORE
  g.fillStyle(0x8df4ff, 0.18)
    .fillCircle(32, 12, 8);

  g.lineStyle(1, 0x8df4ff, 0.8)
    .strokeCircle(32, 12, 6);

  g.fillStyle(0xe8fdff)
    .fillCircle(32, 12, 3);

  // SIDE ENERGY NODES
  g.fillStyle(0xaee37f)
    .fillCircle(6, 13, 1.5)
    .fillCircle(58, 13, 1.5);

  // LOWER POWER VENTS
  g.fillStyle(0x55dfff, 0.75)
    .fillRect(18, 19, 7, 2)
    .fillRect(29, 19, 7, 2)
    .fillRect(40, 19, 7, 2);
});

make('guide-drone', 56, 42, g => {
  // OUTER ENERGY GLOW
  g.fillStyle(0x8df4ff, 0.10)
    .fillCircle(28, 21, 21);

  g.fillStyle(0x8df4ff, 0.16)
    .fillCircle(28, 21, 16);

  // SIDE WINGS
  g.fillStyle(0x10283d, 1)
    .fillTriangle(8, 14, 2, 21, 10, 26)
    .fillTriangle(48, 14, 54, 21, 46, 26);

  g.lineStyle(2, 0x55dfff, 0.9)
    .strokeTriangle(8, 14, 2, 21, 10, 26)
    .strokeTriangle(48, 14, 54, 21, 46, 26);

  // MAIN BODY
  g.fillStyle(0x0b1726, 1)
    .fillRoundedRect(9, 10, 38, 22, 9);

  // BODY INNER PANEL
  g.fillStyle(0x18324a, 1)
    .fillRoundedRect(13, 13, 30, 16, 7);

  // NEON OUTLINE
  g.lineStyle(2, 0x8df4ff, 1)
    .strokeRoundedRect(9, 10, 38, 22, 9);

  // CENTRAL CORE GLOW
  g.fillStyle(0x8df4ff, 0.18)
    .fillCircle(28, 21, 11);

  // CENTRAL CORE
  g.fillStyle(0xe8fdff, 1)
    .fillCircle(28, 21, 5);

  g.fillStyle(0x8df4ff, 1)
    .fillCircle(28, 21, 3);

  // CORE HIGHLIGHT
  g.fillStyle(0xffffff, 1)
    .fillCircle(27, 20, 1.5);

  // TOP SIGNAL LIGHTS
  g.fillStyle(0x55dfff, 1)
    .fillCircle(20, 8, 1.5)
    .fillCircle(28, 7, 1.8)
    .fillCircle(36, 8, 1.5);

  // BOTTOM ENERGY VENTS
  g.fillStyle(0x55dfff, 0.8)
    .fillRect(18, 32, 4, 3)
    .fillRect(26, 32, 4, 4)
    .fillRect(34, 32, 4, 3);
});

make('alien-guide', 56, 64, g => {
  // OUTER ALIEN AURA
  g.fillStyle(0xb993ff, 0.08)
    .fillCircle(28, 30, 29);

  g.fillStyle(0xe0a7ff, 0.10)
    .fillCircle(28, 30, 23);

  // HEAD
  g.fillStyle(0x3b2858)
    .fillEllipse(28, 26, 42, 40);

  // HEAD OUTLINE
  g.lineStyle(2, 0xe0a7ff, 0.95)
    .strokeEllipse(28, 26, 42, 40);

  // INNER FACE PANEL
  g.fillStyle(0x53366f)
    .fillEllipse(28, 28, 34, 31);

  // EYES GLOW
  g.fillStyle(0xe0a7ff, 0.20)
    .fillEllipse(19, 24, 14, 10)
    .fillEllipse(37, 24, 14, 10);

  // EYES
  g.fillStyle(0xf3d9ff)
    .fillEllipse(19, 24, 10, 8)
    .fillEllipse(37, 24, 10, 8);

  // PUPILS
  g.fillStyle(0x24152f)
    .fillCircle(19, 24, 3)
    .fillCircle(37, 24, 3);

  // EYE HIGHLIGHTS
  g.fillStyle(0xffffff)
    .fillCircle(18, 23, 1)
    .fillCircle(36, 23, 1);

  // SIGNAL MARK
  g.fillStyle(0x8df4ff, 0.18)
    .fillCircle(28, 35, 9);

  g.fillStyle(0x8df4ff)
    .fillRoundedRect(20, 31, 16, 8, 4);

  // SIGNAL CORE
  g.fillStyle(0xe8fdff)
    .fillCircle(28, 35, 3);

  // SIDE ENERGY FINS
  g.fillStyle(0x2a1c40)
    .fillTriangle(7, 30, 1, 38, 10, 41)
    .fillTriangle(49, 30, 55, 38, 46, 41);

  g.lineStyle(1.5, 0xb993ff, 0.9)
    .strokeTriangle(7, 30, 1, 38, 10, 41)
    .strokeTriangle(49, 30, 55, 38, 46, 41);

  // ANTENNA
  g.lineStyle(2, 0xe0a7ff, 0.9)
    .lineBetween(28, 5, 28, 12);

  // ANTENNA CORE
  g.fillStyle(0x8df4ff)
    .fillCircle(28, 4, 3);

  g.fillStyle(0xffffff, 0.8)
    .fillCircle(27, 3, 1);

  // LOWER ENERGY BAND
  g.fillStyle(0x8df4ff, 0.15)
    .fillRoundedRect(16, 43, 24, 12, 5);

  g.fillStyle(0x8df4ff)
    .fillRoundedRect(18, 45, 20, 7, 3);

  // ENERGY VENTS
  g.fillStyle(0xdffcff, 0.9)
    .fillRect(21, 48, 3, 3)
    .fillRect(27, 47, 3, 4)
    .fillRect(33, 48, 3, 3);
});

}

createAnimations() {
  if (this.anims.exists('runner-idle') &&
      this.anims.exists('runner-run') &&
      this.anims.exists('runner-jump') &&
      this.anims.exists('runner-fall') &&
      this.anims.exists('runner-land') &&
      this.anims.exists('runner-dash') &&
      this.anims.exists('runner-wall') &&
      this.anims.exists('runner-hit') &&
      this.anims.exists('runner-finish')) {
    return;
  }

  // ------------------------------------------------------------
  // IDLE
  // ------------------------------------------------------------
  this.anims.create({
    key: 'runner-idle',
    frames: [{ key: 'runner-idle' }],
    frameRate: 1,
    repeat: -1
  });

  // ------------------------------------------------------------
  // RUN
  // Base animation remains compatible with existing runtime.
  // Speed is still dynamically adjusted later in the file.
  // ------------------------------------------------------------
  this.anims.create({
    key: 'runner-run',
    frames: [
      { key: 'runner-run-a' },
      { key: 'runner-run-b' }
    ],
    frameRate: 11,
    repeat: -1
  });

  // ------------------------------------------------------------
  // JUMP
  // ------------------------------------------------------------
  this.anims.create({
    key: 'runner-jump',
    frames: [{ key: 'runner-jump' }],
    frameRate: 1,
    repeat: -1
  });

  // ------------------------------------------------------------
  // FALL
  // ------------------------------------------------------------
  this.anims.create({
    key: 'runner-fall',
    frames: [{ key: 'runner-fall' }],
    frameRate: 1,
    repeat: -1
  });

  // ------------------------------------------------------------
  // LAND
  // ------------------------------------------------------------
  this.anims.create({
    key: 'runner-land',
    frames: [{ key: 'runner-land' }],
    frameRate: 1,
    repeat: -1
  });

  // ------------------------------------------------------------
  // DASH
  // ------------------------------------------------------------
  this.anims.create({
    key: 'runner-dash',
    frames: [{ key: 'runner-dash' }],
    frameRate: 1,
    repeat: -1
  });

  // ------------------------------------------------------------
  // WALL
  // ------------------------------------------------------------
  this.anims.create({
    key: 'runner-wall',
    frames: [{ key: 'runner-wall' }],
    frameRate: 1,
    repeat: -1
  });

  // ------------------------------------------------------------
  // HIT
  // ------------------------------------------------------------
  this.anims.create({
    key: 'runner-hit',
    frames: [{ key: 'runner-hit' }],
    frameRate: 1,
    repeat: -1
  });

  // ------------------------------------------------------------
  // FINISH
  // ------------------------------------------------------------
  this.anims.create({
    key: 'runner-finish',
    frames: [{ key: 'runner-finish' }],
    frameRate: 1,
    repeat: -1
  });
}

init({
  mission,
  runId,
  abilities = [],
  rain,
  screenShake = true,
  reducedMotion = false,
  graphicsQuality = 'HIGH',
  firstTimeTutorial = false
} = {}) {
this.mission = mission || {};
this.mission.spawn ??= { x: 0, y: 0 };
this.mission.goal ??= { x: this.mission.spawn.x + 1200, y: this.mission.spawn.y };
this.runId = runId;
this.abilities = new Set(abilities || []);
this.rainEnabled = rain;
this.screenShake = screenShake;
this.motionReduced = reducedMotion;

const savedGraphicsQuality =
  typeof window !== 'undefined' &&
  window.localStorage
    ? window.localStorage.getItem(
        'runner_graphics_quality'
      )
    : null;

const normalizedGraphicsQuality =
  String(
    savedGraphicsQuality || graphicsQuality || 'HIGH'
  )
    .trim()
    .toUpperCase();

this.graphicsQuality =
  ['LOW', 'MEDIUM', 'HIGH', 'ULTRA'].includes(
    normalizedGraphicsQuality
  )
    ? normalizedGraphicsQuality
    : 'HIGH';

this.graphicsLevel = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  ULTRA: 3
}[this.graphicsQuality];

this.graphicsSettings = {
  quality: this.graphicsQuality,
  level: this.graphicsLevel,
  effects: true,
  particles:
    this.graphicsLevel >= 1,
  lighting:
    this.graphicsLevel >= 2,
  weather:
    this.graphicsLevel >= 1
};
this.firstTimeTutorial = firstTimeTutorial;

// ============================================================
// OPENING CINEMATIC · MISSION 01 FIRST ENTRY ONLY
// ============================================================
this.cinematicActive =
  this.mission.id === 'first-delivery' &&
  firstTimeTutorial;

if (
  !this.cinematicActive &&
  this.physics?.world?.isPaused
) {
  this.physics.resume();
}

this.isPlayerTransformLocked = false;

this.collected = 0;
this.secretsCollected = 0;

// ============================================================
// UNKNOWN SIGNAL CACHE · SURPRISE / REWARD SYSTEM
// ============================================================

this.surpriseCache = null;
this.surpriseCachePrompt = null;
this.surpriseCacheCollected = false;
this.surpriseCacheOpen = false;
this.surpriseCacheResolved = false;
this.surpriseCacheInteractionLocked = false;
this.surpriseCacheSession = 0;
this.surpriseCacheId = null;
this.surpriseCollectedCacheIds = new Set();

this.surpriseInventory = {
  shieldCore: 0,
  overdriveCell: 0,
  energyPack: 0,
  credits: 0
};

this.surpriseModifier = null;
this.surprisePendingModifier = null;
this.surpriseConsumedMissionRewards = {};
this.surpriseNegativeStreak = 0;
this.surpriseShieldCharges = 0;

this.playerBaseAngle = 0;
this.enemyDefeats = 0;
this.bossHitCount = 0;
this.elapsedMs = 0;
this.timeEmitTimer = 0;

// ============================================================
// AFK / CRYOSTASIS SYSTEM
// Visual-only V1.
// 0-4s  NORMAL
// 4-8s  IDLE
// 8-12s FROST
// 12s+  CRYOSTASIS
// ============================================================
this.afkTimer = 0;
this.afkStage = 0;
this.afkFreezeFx = null;

// Small persistent ice-particle pool.
// Objects are created once and reused.
this.afkIceParticles = [];

// CRYOSTASIS DEEP FREEZE FX
this.afkCryoFx = null;
this.afkCryoTriggered = false;

// CRYOSTASIS ICE SHARD FX
this.afkCryoShards = [];

// CRYOSTASIS GAMEPLAY FREEZE
this.afkCryostasisActive = false;
this.afkCryoPreviousMoves = true;
this.afkCryoPreviousAllowGravity = true;

// AFK STATUS HUD
this.afkStatusText = null;

// ============================================================
// SIGNAL INTERFERENCE SYSTEM
// 0.00 = clean signal
// 1.00 = critical interference / full override
// ============================================================
this.signalInterference = 0;
this.signalInterferenceTier = -1;
this.signalOverrideTriggered = false;
this.signalInterferencePulse = 0;
this.signalInterferenceObjects = null;
this.signalInterferenceJitter = 0;
this.signalGhostTimer = 0;
  
// ============================================================
// MISSION MEDALS / RUN RATING
// ============================================================
  
this.runRating = {
  speed: 0,
  combat: 0,
  collection: 0,
  survival: 0,
  overall: 'C'
};

this.medalResult = null;
this.boostCooldown = 0;
this.dashCooldown = 0;
this.dashTimer = 0;
this.dashFxTimer = 0;
this.runnerAnimRate = 11;
this.wallJumpCooldown = 0;
this.wallJumpTimer = 0;
this.lowEnergyCueTimer = 0;
this.detectionEmit = -1;

this.health = 3;
this.healthMax = 3;
this.healthInvulnerable = 0;
this.briefingProtected = false;

this.ammo = 6;
this.ammoMax = 6;
this.ammoRecharge = 0;

this.cometTimer = 3400;
this.blasterCooldown = 0;
this.swordCooldown = 0;
this.buildCooldowns = [0, 0];

this.combatCombo = 0;
this.bestCombatCombo = 0;
this.comboTimer = 0;
this.overdriveTimer = 0;
this.polarityComboOverdriveTriggered = false;

/*
 * ============================================================
 * POLARITY CORE · GAMEPLAY STATE
 * No HUD creation here.
 * Existing HUD can consume emitted events later.
 * ============================================================
 */
this.polarity = 0;
this.polarityMax = 100;

this.polarityState = 'STABLE';
this.polarityComboGain = 4;
this.polarityDecayTimer = 0;
this.polarityDecayDelay = 1800;

this.polarityOverdriveBonus = 1;
this.polarityLastState = 'STABLE';
this.polarityPulseTimer = 0;

this.polarityStats = {
  gained: 0,
  spent: 0,
  peak: 0,
  overdrives: 0,
  breaks: 0
};

this.polarityAbilities = {
  phase: false,
  magnet: false,
  overdrive: false,
  break: false
};

this.jumps = 0;
this.collisions = 0;
this.falls = 0;
this.deaths = 0;

this.perfectDodgeWindow = 0;
this.perfectDodgeCooldown = 0;
this.perfectDodges = 0;
this.deathLimit = this.mission.id === 'first-delivery' ? Infinity : 3;
this.jumpsUsed = 0;
this.finished = false;
this.gameOverUI = null;
this.gameOverRestarting = false;
this.missionMedalsUI = null;
this.missionMedalsClosing = false;
this.respawning = false;

// ============================================================
// PLAYER PRESENTATION FX
// ============================================================
this.divineArrivalPlayed = false;
this.divineArrivalOverlay = null;

this.dizzyStars = null;
this.dizzyStarsTimer = 0;
this.dizzyStarsIntensity = 0;
this.dizzyStarsSerial = 0;
this.celestialUpdateTimer = 0;

this.eventState = new Map();
this.mobileDirection = null;
this.mobileAirDirection = 0;
this.slideCrouchLocked = false;
this.mobileActions = {
  jump: false,
  jumpHeld: false,
  jumpReleased: false,
  fire: false,
  sword: false,
  dash: false,
  crouch: false,
  interact: false,
  build1: false,
  build2: false,
  gadget1: false,
  gadget2: false,
  polarity: false
};
this.empTimer = 0; this.decoyTimer = 0; this.boosterTimer = 0;
this.boosterAura = null; this.decoyBeacon = null; this.infoCard = null; this.landingTimer = 0;
this.lastHardLanding = false;
this.bossDefeated = false;
this.bossPhaseTwo = false;
this.bossVictorySequence = false;
this.bossVictoryLock = false;
this.bossSecondShotPending = false;
this.goalTouched = false;

this.waterZones = null;
this.waterAttackActive = false;
this.waterDeathTimer = 0;
this.waterAttackToken = 0;

// ============================================================
// WET TERRAIN / SLIPPERY SURFACE
// ============================================================
  
this.wetSurfaceActive = false;
this.wetSurfaceGrip = 1;
this.activeShark = null;

// ============================================================
// RELAY GATE / PUZZLE SYSTEM
// ============================================================
  
this.relayGates = null;
this.relayPuzzleActive = false;
this.relayPuzzleGate = null;
this.relayPuzzleType = null;
this.relayPuzzleData = null;
this.relayPuzzleAttempts = 0;
this.relayPuzzleStartedAt = 0;
this.relayPuzzleSession = 0;
this.relayPuzzleTimerBand = 0;
this.relayPuzzleUI = null;
this.relayNearbyGate = null;
this.relayInteractHint = null;
this.coyote = 0;
this.jumpBuffer = 0;
this.dustTimer = 0;
this.speedTimer = 0;
this.kineticTrailTimer = 0;
this.groundFxTimer = 0;
this.footstepFxTimer = 0;
this.lastRunFrame = -1;
this.fastFallFxTimer = 0;
this.lastProgress = -1;
this.wasGrounded = false;
this.fallSpeed = 0;

this.cameraOffsetX = -85;
this.cameraOffsetY = 65;
this.cameraZoom = 1;
this.firstPersonCamera = false;
this.lastParallaxBoost = -1;
this.cameraVelocityX = 0;
this.jumpHeld = false;
this.wallJumpFxShown = false;
this.sectorTwoAnnounced = false;
this.chaseWarnings = new Set();
this.checkpointHints = new Set();
this.routeTutorials = new Set();
this.storyBeatsSeen = new Set();
this.enemyIntelSeen = new Set();
this.goalHintShown = false;

this.weatherTimer = 0;
this.weatherPhase = 0;
this.routeHintTimer = 0;
this.eventCheckTimer = 0;

this.objectiveHUD = null;
this.objectiveProgressBar = null;
this.objectiveProgressText = null;;

this.checkpoint = {
  x: this.mission.spawn.x,
  y: this.mission.spawn.y,
  signals: new Set(),
  secrets: new Set()
};

this.checkpointArrow = null;
this.platformEmergencyTarget = null;
}

validateMission() {
  const mission = this.mission || {};
  mission.spawn ??= { x: 0, y: 0 };
  mission.goal ??= { x: mission.spawn.x + 1200, y: mission.spawn.y };
for (const key of [
  'platforms',
  'obstacles',
  'movingGates',
  'enemies',
  'signals',
  'secrets',
  'checkpoints',
  'boostPads',
  'guides',
  'safeZones',
  'events',
  'waterZones',
'relayGates'
]) {
  if (!Array.isArray(this.mission[key])) {
    this.mission[key] = [];
  }
}
  mission.enemies = mission.enemies.map(enemy => ({
    ...enemy,
    min: Number.isFinite(enemy?.min) ? enemy.min : (Number(enemy?.x) || mission.spawn.x) - 90,
    max: Number.isFinite(enemy?.max) ? enemy.max : (Number(enemy?.x) || mission.spawn.x) + 90
  }));
  this.mission = mission;
}

/*
 * ============================================================
 * REACTIVE WORLD LIGHTING
 * Purely visual. No physics / input / mission mutations.
 * ============================================================
 */
  
worldLightPulse(
  color = 0x8df4ff,
  strength = 0.16,
  duration = 220,
  radius = 90
) {
  const graphicsLevel =
    Number.isFinite(this.graphicsLevel)
      ? this.graphicsLevel
      : 2;

  if (
    this.motionReduced ||
    graphicsLevel < 2 ||
    !this.player?.active
  ) {
    return;
  }

  const pulse = this.add
    .circle(
      this.player.x,
      this.player.y,
      radius,
      color,
      strength
    )
    .setDepth(11);

  pulse.setStrokeStyle(
    2,
    color,
    Math.min(0.9, strength + 0.45)
  );

  this.tweens.add({
    targets: pulse,
    scale: 2.8,
    alpha: 0,
    duration,
    ease: 'Quad.out',
    onComplete: () => pulse.destroy()
  });
}

worldLightFlash(
  color = 0x8df4ff,
  alpha = 0.08,
  duration = 120
) {
  const graphicsLevel =
    Number.isFinite(this.graphicsLevel)
      ? this.graphicsLevel
      : 2;

  if (
    this.motionReduced ||
    graphicsLevel < 2 ||
    !this.player?.active
  ) {
    return;
  }

  const flash = this.add
    .rectangle(
      this.player.x,
      this.player.y,
      260,
      90,
      color,
      alpha
    )
    .setDepth(5);

  this.tweens.add({
    targets: flash,
    scaleX: 1.7,
    alpha: 0,
    duration,
    ease: 'Quad.out',
    onComplete: () => flash.destroy()
  });
}

shake(duration, intensity) {
  if (this.screenShake && !this.motionReduced) {
    this.cameras.main.shake(duration, intensity);
  }
}

registerPerfectDodge() {
if (
  this.perfectDodgeCooldown > 0 ||
  this.health <= 0
) {
  return;
}

this.perfectDodgeWindow = 120;
this.perfectDodgeCooldown = 320;
  this.perfectDodges =
  (this.perfectDodges || 0) + 1;

  this.game.events.emit(
  'feedback',
  'perfect_dodge'
);
  
this.combatCombo = Math.min(
  10,
  this.combatCombo + 1
);

this.comboTimer = 3000;

this.addPolarity(
  10,
  'perfect-dodge'
);

  this.bestCombatCombo = Math.max(
  this.bestCombatCombo || 0,
  this.combatCombo
);

  /*
 * ============================================================
 * PERFECT DODGE · COMBAT FEEDBACK
 * ============================================================
 */
  
if (
  !this.motionReduced &&
  this.graphicsLevel >= 2
) {
  const dodgeRing =
    this.add
      .circle(
        this.player.x,
        this.player.y,
        12,
        0x8df4ff,
        .16
      )
      .setDepth(13);

  dodgeRing.setStrokeStyle(
    2,
    0xb9f5ff,
    .9
  );

  this.tweens.add({
    targets: dodgeRing,
    scale: 4.6,
    alpha: 0,
    duration: 360,
    ease: 'Quad.out',
    onComplete: () =>
      dodgeRing.destroy()
  });

  this.cameras.main.flash(
    90,
    120,
    220,
    255
  );

this.playerCue(
  'PERFECT DODGE',
  '#8df4ff'
);

this.speakNarration(
  'PERFECT DODGE'
);

  this.gadgetPulse(
    0x8df4ff,
    14,
    360
  );
}
  
this.energy = Math.min(
  this.energyMax,
  this.energy + 8
);

this.game.events.emit(
  'energy',
  this.energy /
    this.energyMax *
    100
);

this.game.events.emit(
  'combo',
  this.combatCombo,
  1
);

if (
  !this.motionReduced &&
  (
    !Number.isFinite(this.graphicsLevel) ||
    this.graphicsLevel >= 2
  )
) {
  const dodgeBurst =
    this.add
      .circle(
        this.player.x,
        this.player.y,
        14,
        0x8df4ff,
        .34
      )
      .setDepth(13);

  this.tweens.add({
    targets: dodgeBurst,
    scale: 4.8,
    alpha: 0,
    duration: 320,
    onComplete: () =>
      dodgeBurst.destroy()
  });

  this.shake(
    70,
    0.003
  );

  const comboPulse =
    this.add
      .circle(
        this.player.x,
        this.player.y,
        14,
        0x8df4ff,
        .24
      )
      .setDepth(12);

  this.tweens.add({
    targets: comboPulse,
    scale: 3.8,
    alpha: 0,
    duration: 300,
    onComplete: () =>
      comboPulse.destroy()
  });

  this.shake(
    90,
    0.004
  );
}

}

playerCue(text, color = '#b9f5ff') {
  if (!this.player?.active) {
    return;
  }

  const activeCues =
    this.children.list.filter(
      child =>
        child?.getData?.('playerCue') === true &&
        child.active
    );

  const stackOffset =
    Math.min(
      activeCues.length,
      3
    ) * 16;

  const label =
    this.add
      .text(
        this.player.x,
        this.player.y - 46 - stackOffset,
        text,
        {
          fontFamily: 'DM Mono',
          fontSize: '10px',
          color,
          stroke: '#08101c',
          strokeThickness: 4,
          padding: {
            left: 3,
            right: 3,
            top: 2,
            bottom: 2
          }
        }
      )
      .setOrigin(.5)
      .setDepth(14)
      .setData(
        'playerCue',
        true
      );

  this.tweens.add({
    targets: label,
    y: label.y - 20,
    alpha: 0,
    duration: 520,
    ease: 'Quad.out',
    onComplete: () =>
      label.destroy()
  });
}

showIntelCard(title, lines, color = '#8df4ff') {
this.dismissIntelCard();
this.briefingProtected = true;

const card = this.add.container(32, 382)
  .setScrollFactor(0)
  .setDepth(40)
  .setSize(472, 210)
  .setInteractive({ useHandCursor: true });

const plate = this.add.rectangle(
  236,
  112,
  472,
  210,
  0x07101f,
  .94
).setStrokeStyle(
  1,
  Phaser.Display.Color.HexStringToColor(color).color,
  .8
);

const heading = this.add.text(
  28,
  20,
  title,
  {
    fontFamily: 'DM Mono',
    fontSize: '13px',
    color
  }
);

const divider = this.add.rectangle(
  28,
  47,
  74,
  2,
  Phaser.Display.Color.HexStringToColor(color).color
);

const copy = this.add.text(
  28,
  65,
  lines.join('\n'),
  {
    fontFamily: 'DM Mono',
    fontSize: '11px',
    color: '#dffcff',
    lineSpacing: 9,
    wordWrap: { width: 410 }
  }
);

const dismiss = this.add.text(
  28,
  174,
  'TAP / CLICK / ESC TO DISMISS',
  {
    fontFamily: 'DM Mono',
    fontSize: '9px',
    color: '#8ba0b8'
  }
);

card.add([
  plate,
  heading,
  divider,
  copy,
  dismiss
]);

card.on('pointerdown', () => this.dismissIntelCard());

card.setAlpha(0);

this.tweens.add({
  targets: card,
  alpha: 1,
  x: 48,
  duration: 220
});

this.infoCard = card;

this.time.delayedCall(
  4200,
  () => this.dismissIntelCard(card)
);

}

dismissIntelCard(card = this.infoCard) {
if (!card || this.infoCard !== card) return;

this.infoCard = null;
this.briefingProtected = false;

this.tweens.add({
  targets: card,
  alpha: 0,
  duration: 160,
  onComplete: () => card.destroy()
});

}

showEnemyIntel(type) {
const intel = enemyIntel[type];

if (!intel || this.enemyIntelSeen.has(type)) return;

this.enemyIntelSeen.add(type);
this.game.events.emit('enemy-discovered', type);

this.showIntelCard(
  `TACTICAL READ · ${intel.name}`,
  [
    `ATTACK · ${intel.attack}`,
    `DEFENSE · ${intel.defense}`,
    `TACTIC · ${intel.tactic}`,
    'READ THE TELL, THEN COMMIT.'
  ],
  type.includes('boss') ? '#ffcf82' : '#ff826e'
);

this.game.events.emit(
  'narration',
  `${intel.name}. ${intel.tactic}`
);

}

leaveAfterimage(color = 0x8df4ff) {
  if (
    this.motionReduced ||
    (Number.isFinite(this.graphicsLevel) &&
      this.graphicsLevel < 2)
  ) {
    return;
  }

  const image = this.add
    .sprite(
      this.player.x,
      this.player.y,
      this.player.texture.key
    )
    .setFlipX(this.player.flipX)
    .setTint(color)
    .setAlpha(.42)
    .setDepth(9);

  this.tweens.add({
    targets: image,
    x:
      image.x -
      (this.player.flipX ? -1 : 1) * 24,
    alpha: 0,
    duration: 180,
    onComplete: () =>
      image.destroy()
  });
}

gadgetPulse(color, radius = 16, duration = 360) {
if (
  this.motionReduced ||
  (Number.isFinite(this.graphicsLevel) &&
    this.graphicsLevel < 2)
) {
  return;
}

const pulse = this.add
.circle(this.player.x, this.player.y, radius, color, .3)
.setDepth(11);

this.tweens.add({
  targets: pulse,
  scale: 3.4,
  alpha: 0,
  duration,
  onComplete: () => pulse.destroy()
});

}

alarmDuration(duration) {
return duration * (
this.loadout.upgrades?.includes('escape') ? .85 : 1
);
}

create() {
  this.setupNarrationVoice();

  this.applyGraphicsSettings();

  this.validateMission();
const requiredTextures = [
  'runner-idle',
  'runner-run-a',
  'runner-run-b',
  'runner-jump',
  'runner-fall',
  'runner-land',
  'runner-dash',
  'runner-wall',
  'runner-hit',
  'runner-finish',
  'signal',
  'shark',
  'barrier',
  'goal',
  'rain',
  'dust',
  'speed-line',
  'boost-pad',
  'chaser',
  'checkpoint',
  'security',
  'guard',
  'enemy-runner',
  'invader',
  'chicken',
  'dino',
'dino-boss',
'sentinel-boss',
'storm-boss',
'blaster'
];

if (
  requiredTextures.some(
    key => !this.textures.exists(key)
  )
) {
  this.createTextures();
}

this.createAnimations();

this.package = packages[this.mission.id] || { speedMultiplier: 1, upgrades: [], equipment: [] };
this.packageCondition = 100;

this.energy = 100;
this.energyMax = 100;
this.loadout = this.mission.loadout || {
  upgrades: [],
  equipment: []
};

// ============================================================
// UNKNOWN SIGNAL CACHE · LOAD PERSISTENT PROGRESS
// ============================================================

this.loadSurpriseProgress();
this.prepareSurpriseMission();

this.gadgetCooldowns = [0, 0];
this.boostedSignals = 0;
this.energyEmit = -1;
this.tutorials = new Set();
this.slideTimer = 0;
this.vaultCooldown = 0;
this.airDashUsed = false;
this.alarmTimer = 0;
this.alarms = 0;

this.detectionHUD = null;
this.detectionProgressBar = null;
this.detectionProgressText = null;
this.chaseEscapes = 0;
this.worldWidth = Math.max(this.mission.goal?.x ?? 1200, this.mission.spawn?.x ?? 0) + 180;
this.physics.world.setBounds(
0,
0,
this.worldWidth,
860
);

this.createEnvironment();
this.createPlatforms();
this.createWorldLandmarks();
this.createBrutalMapDetails();
this.createRouteLighting();
this.createPlayer();

this.respawnGrace =
  1400;

this.healthInvulnerable =
  2000;

const spawnShield = this.add
  .circle(
    this.player.x,
    this.player.y,
    24,
    0x8df4ff,
    .22
  )
  .setDepth(11);

this.tweens.add({
  targets: spawnShield,
  scale: 2.6,
  alpha: 0,
  duration: 1600,
  onComplete: () => spawnShield.destroy()
});

this.createRival();
this.createSignals();
this.createSecrets();
this.createSurpriseCache();
this.createCheckpoints();
this.createHazards();
this.createWaterHazards();
this.createWaterWaves();
this.createMovingGates();
this.createRelayGates();
this.createEnemies();
this.createSciFiThreats();
this.createBuildSystems();
this.createBoostPads();
this.createChaser();
this.createGoal();
this.createAtmosphere();
this.createGuides();
this.createGuideCompanions();

this.events.once(
  Phaser.Scenes.Events.SHUTDOWN,
  () => {
    this.tweens.killAll();

    this.surpriseCachePrompt
      ?.destroy(true);

    this.surpriseCachePrompt = null;

    this.surpriseCache
      ?.destroy();

    this.surpriseCache = null;

   this.surpriseCacheOpen = false;
this.surpriseCacheCollected = false;
this.surpriseCacheResolved = false;
this.surpriseCacheInteractionLocked = false;
    this.time.removeAllEvents();
    this.activeShark?.destroy();
this.activeShark = null;

    this.input.keyboard.off(
  'keydown-SPACE',
  this.cinematicSkipHandler
);

this.input.keyboard.off(
  'keydown-A',
  this.cinematicSkipHandler
);

this.input.keyboard.off(
  'keydown-D',
  this.cinematicSkipHandler
);

this.input.keyboard.off(
  'keydown-LEFT',
  this.cinematicSkipHandler
);

this.input.keyboard.off(
  'keydown-RIGHT',
  this.cinematicSkipHandler
);
    
    this.eventState.clear();
  }
);

this.cameras.main
  .setBounds(0, 0, this.worldWidth, 860)
  .startFollow(
    this.player,
    true,
    .1,
    .1,
    this.cameraOffsetX,
    this.cameraOffsetY
  )
  .setDeadzone(185, 100);

if (!this._runnerReadyEmitted) {
  this._runnerReadyEmitted = true;
  this.game.events.emit('runner-ready');
}
this.game.events.emit('health', this.health);
this.game.events.emit(
  'ammo',
  this.ammo / this.ammoMax * 100
);
this.game.events.emit(
  'energy',
  this.energy / this.energyMax * 100
);

// CARGO HUD DISABLED

}

createEnvironment() {
const visual =
  DISTRICT_VISUALS[this.mission.id] ||
  DISTRICT_VISUALS['first-delivery'];
const sky = this.add.graphics().setScrollFactor(0);

const skyBottom = this.mission.blackout
  ? 0x10182a
  : visual.skyline;

sky.fillGradientStyle(
  0x07101e,
  0x07101e,
  skyBottom,
  skyBottom,
  1
).fillRect(
  0,
  0,
  1500,
  720
);

/* -------------------------------------------------
   DISTRICT ATMOSPHERE
   Visual only — no gameplay / physics mutation.
   ------------------------------------------------- */

const districtAtmosphere =
  this.add.graphics()
    .setScrollFactor(0)
    .setDepth(0.5);

const atmosphereColor =
  visual.accent;

districtAtmosphere.fillStyle(
  atmosphereColor,
  this.mission.blackout
    ? 0.045
    : 0.075
);

districtAtmosphere.fillRect(
  0,
  390,
  1500,
  180
);

districtAtmosphere.fillStyle(
  atmosphereColor,
  this.mission.blackout
    ? 0.025
    : 0.045
);

districtAtmosphere.fillRect(
  0,
  500,
  1500,
  120
);

/* Horizon energy line */
districtAtmosphere.lineStyle(
  2,
  atmosphereColor,
  this.mission.blackout
    ? 0.18
    : 0.28
);

districtAtmosphere.lineBetween(
  0,
  505,
  1500,
  505
);

/* Soft district pulse */
const atmospherePulse =
  this.add.rectangle(
    750,
    500,
    1500,
    110,
    atmosphereColor,
    0
  )
  .setScrollFactor(0)
  .setDepth(0.55);

this.tweens.add({
  targets: atmospherePulse,
  alpha: this.mission.blackout
    ? 0.035
    : 0.065,
  duration: 1700,
  yoyo: true,
  repeat: -1,
  ease: 'Sine.inOut'
});

if (this.mission.gravityMode === 'low') {
  for (let index = 0; index < 86; index++) {
    const x = (index * 137) % 1500;
    const y = (index * 71) % 500;

    sky
      .fillStyle(
        index % 4 ? 0x8df4ff : 0xffd06e,
        .45
      )
      .fillCircle(
        x,
        y,
        index % 7 ? 1 : 2
      );
  }

  sky
    .fillStyle(0x5f4e96, .25)
    .fillCircle(1200, 180, 140)
    .fillStyle(0x1d2445)
    .fillCircle(1245, 150, 120);
}

// ============================================================
// CELESTIAL SKY · SUN + MOON
// ============================================================

const celestialTime =
  (this.time.now % 180000) / 180000;

const sunAngle =
  celestialTime * Math.PI * 2;

const moonAngle =
  sunAngle + Math.PI;

const sunX =
  930 +
  Math.cos(sunAngle) * 260;

const sunY =
  150 +
  Math.sin(sunAngle) * 75;

const moonX =
  930 +
  Math.cos(moonAngle) * 260;

const moonY =
  150 +
  Math.sin(moonAngle) * 75;

  const sunAltitude =
  Phaser.Math.Clamp(
    (150 - sunY) / 75,
    -1,
    1
  );

const moonAltitude =
  Phaser.Math.Clamp(
    (150 - moonY) / 75,
    -1,
    1
  );

  // ============================================================
// CELESTIAL · DAY / NIGHT INTENSITY
// ============================================================

const daylight =
  Phaser.Math.Clamp(
    (Math.sin(sunAngle) + 1) * 0.5,
    0,
    1
  );

  const daylightSmooth =
  Phaser.Math.SmoothStep(
    daylight,
    0,
    1
  );

const nightAmount =
  1 - daylightSmooth;

const sunGlowAlpha =
  Phaser.Math.Linear(
    0.06,
    0.16,
    daylightSmooth
  );

const moonGlowAlpha =
  Phaser.Math.Linear(
    0.18,
    0.035,
    daylightSmooth
  );

  const moonShadowAlpha =
  Phaser.Math.Linear(
   0.62,
   0.88,
    nightAmount
  );

  // ============================================================
// CELESTIAL · MOVING OBJECTS
// ============================================================

this.celestialSun =
  this.add
    .circle(
      sunX,
      sunY,
      52,
      0xffe6ad,
      1
    )
    .setScrollFactor(0)
    .setDepth(2);

this.celestialSunGlow =
  this.add
    .circle(
      sunX,
      sunY,
      105,
      0xffd06e,
      sunGlowAlpha
    )
    .setScrollFactor(0)
    .setDepth(1);

this.celestialMoon =
  this.add
    .circle(
      moonX,
      moonY,
      42,
      0xdffcff,
      0.95
    )
    .setScrollFactor(0)
    .setDepth(2);

this.celestialMoonGlow =
  this.add
    .circle(
      moonX,
      moonY,
      74,
      0x8df4ff,
      moonGlowAlpha
    )
    .setScrollFactor(0)
    .setDepth(1);

  // ============================================================
// CELESTIAL · MOON CRESCENT
// ============================================================

this.celestialMoonShadow =
  this.add
    .circle(
     moonX + 24,
     moonY - 15,
      42,
     skyBottom,
      0.98
    )
    .setScrollFactor(0)
    .setDepth(3);

const environment = {
  'first-delivery': ['LANTERN ROOFS', 0xffd06e],
  'dead-drop': ['HARBOR FOG', 0xffbd5b],
  blackout: ['EMERGENCY GRID', 0x8df4ff],
  pursuit: ['RAIL STORM', 0xff826e],
  'signal-storm': ['CROWN TEMPEST', 0xb993ff],
  'corporate-lockdown': ['HELIX SIEGE', 0xff826e],
  'final-relay': ['APEX ORBIT', 0xffe0a8]
}[this.mission.id];

sky
  .fillStyle(environment[1], .08)
  .fillRect(0, 510, 1500, 210);

this.add.text(
  1120,
  58,
  environment[0],
  {
    fontFamily: 'DM Mono',
    fontSize: '10px',
    color: '#dffcff'
  }
)
  .setScrollFactor(0)
  .setAlpha(.45);

/* -------------------------------------------------
   DISTRICT REVEAL
   Short cinematic zone identifier.
   Purely visual.
   ------------------------------------------------- */

const districtIndex = {
  'first-delivery': '01',
  'dead-drop': '02',
  blackout: '03',
  pursuit: '04',
  'signal-storm': '05',
  'corporate-lockdown': '06',
  'final-relay': '07'
}[this.mission.id] || '00';

const revealGroup =
  this.add.container(
    this.scale.width / 2,
    132
  )
  .setScrollFactor(0)
  .setDepth(30)
  .setAlpha(0);

const revealLine =
  this.add.rectangle(
    0,
    -26,
    260,
    2,
    visual.accent,
    0.85
  );

const revealGlow =
  this.add.rectangle(
    0,
    -26,
    90,
    6,
    visual.accent,
    0.18
  );

const revealTitle =
  this.add.text(
    0,
    0,
    visual.label,
    {
      fontFamily: 'DM Mono',
      fontSize: '30px',
      fontStyle: 'bold',
      color: '#f4fbff',
      stroke: '#07111d',
      strokeThickness: 6,
      align: 'center'
    }
  )
  .setOrigin(0.5);

const revealSub =
  this.add.text(
    0,
    34,
    `DISTRICT // ${districtIndex}`,
    {
      fontFamily: 'DM Mono',
      fontSize: '10px',
      color: '#b9f5ff',
      letterSpacing: 3,
      align: 'center'
    }
  )
  .setOrigin(0.5);

revealGroup.add([
  revealGlow,
  revealLine,
  revealTitle,
  revealSub
]);

this.tweens.add({
  targets: revealGroup,
  alpha: 1,
  y: 148,
  duration: 260,
  ease: 'Quad.out'
});

this.tweens.add({
  targets: revealGlow,
  scaleX: 2.8,
  alpha: 0.05,
  duration: 720,
  ease: 'Sine.out'
});

this.tweens.add({
  targets: revealGroup,
  alpha: 0,
  y: 126,
  delay: 1500,
  duration: 420,
  ease: 'Quad.in',
  onComplete: () =>
    revealGroup.destroy()
});

const backdrop = {
  'first-delivery': () => {
  for (let x = 70; x < 1500; x += 230) {
    const y =
      165 +
      (x % 4) * 24;

    sky
      .fillStyle(0xffd06e, .035)
      .fillCircle(
        x,
        y,
        52
      )

      .fillStyle(0xffd06e, .045)
      .fillCircle(
        x + 42,
        y + 8,
        38
      )

      .fillStyle(0xffd06e, .035)
      .fillCircle(
        x - 34,
        y + 12,
        32
      )

      .fillStyle(0xffe0a8, .025)
      .fillEllipse(
        x + 10,
        y + 28,
        130,
        34
      );
  }
},

  'dead-drop': () => {
    for (let y = 118; y < 420; y += 64) {
      sky
        .fillStyle(0xb5d9df, .045)
        .fillRect(0, y, 1500, 28);
    }
    const fogClouds =
  this.add
    .graphics()
    .setScrollFactor(.05)
    .setDepth(0);

for (let x = -120; x < 2800; x += 300) {
  const y =
    145 +
    (x % 4) * 22;

  fogClouds
    .fillStyle(0xd8edf0, .018)
    .fillCircle(x, y, 58)
    .fillStyle(0xb5d9df, .022)
    .fillCircle(x + 48, y + 8, 42)
    .fillStyle(0xd8edf0, .016)
    .fillCircle(x - 38, y + 10, 36)
    .fillStyle(0xd8edf0, .012)
    .fillEllipse(x + 12, y + 28, 160, 38);
}

this.tweens.add({
  targets: fogClouds,
  x: -900,
  duration: 95000,
  ease: 'Linear',
  repeat: -1
});
  },

  blackout: () => {
    for (let x = 35; x < 1500; x += 92) {
      sky
        .lineStyle(1, 0x8df4ff, .09)
        .lineBetween(
          x,
          80,
          x + 230,
          520
        );
    }
    const stormClouds =
  this.add
    .graphics()
    .setScrollFactor(.045)
    .setDepth(0);

for (let x = -160; x < 2800; x += 320) {
  const y =
    120 +
    (x % 5) * 20;

  stormClouds
    .fillStyle(0x0b1728, .22)
    .fillCircle(
      x,
      y,
      62
    )

    .fillStyle(0x10243a, .20)
    .fillCircle(
      x + 48,
      y + 8,
      48
    )

    .fillStyle(0x091524, .18)
    .fillCircle(
      x - 42,
      y + 12,
      40
    )

    .fillStyle(0x8df4ff, .035)
    .fillEllipse(
      x + 10,
      y + 30,
      175,
      42
    );
}

this.tweens.add({
  targets: stormClouds,
  x: -1000,
  duration: 115000,
  ease: 'Linear',
  repeat: -1
});

this.tweens.add({
  targets: stormClouds,
  alpha: {
    from: .72,
    to: 1
  },
  duration: 5200,
  ease: 'Sine.inOut',
  yoyo: true,
  repeat: -1
});
  },

  pursuit: () => {
    for (let x = -120; x < 1500; x += 180) {
      sky
        .lineStyle(3, 0xff826e, .12)
        .lineBetween(
          x,
          100,
          x + 250,
          470
        );
    }
    const chaseClouds =
  this.add
    .graphics()
    .setScrollFactor(.07)
    .setDepth(0);

for (let x = -180; x < 3000; x += 270) {
  const y =
    185 +
    (x % 3) * 20;

  chaseClouds
    .fillStyle(0x172238, .10)
    .fillCircle(
      x,
      y,
      48
    )

    .fillStyle(0x26344d, .12)
    .fillCircle(
      x + 40,
      y + 5,
      38
    )

    .fillStyle(0x101a2b, .11)
    .fillCircle(
      x - 34,
      y + 8,
      32
    )

    .fillStyle(0xff826e, .018)
    .fillEllipse(
      x + 8,
      y + 27,
      145,
      30
    );
}

this.tweens.add({
  targets: chaseClouds,
  x: -1150,
  duration: 65000,
  ease: 'Linear',
  repeat: -1
});

this.tweens.add({
  targets: chaseClouds,
  alpha: {
    from: .76,
    to: 1
  },
  duration: 3000,
  ease: 'Sine.inOut',
  yoyo: true,
  repeat: -1
});
  },

  'signal-storm': () => {
    for (let x = 80; x < 1500; x += 170) {
      sky
        .fillStyle(0xb993ff, .08)
        .fillTriangle(
          x,
          100,
          x + 90,
          470,
          x + 170,
          100
        );
    }
    const stormClouds =
  this.add
    .graphics()
    .setScrollFactor(.045)
    .setDepth(0);

for (let x = -160; x < 3000; x += 310) {
  const y =
    135 +
    (x % 4) * 24;

  stormClouds
    .fillStyle(0x241a3d, .14)
    .fillCircle(
      x,
      y,
      60
    )

    .fillStyle(0x3b2860, .16)
    .fillCircle(
      x + 46,
      y + 8,
      46
    )

    .fillStyle(0x1c1630, .13)
    .fillCircle(
      x - 42,
      y + 12,
      38
    )

    .fillStyle(0xb993ff, .025)
    .fillEllipse(
      x + 10,
      y + 30,
      170,
      40
    );
}

this.tweens.add({
  targets: stormClouds,
  x: -1000,
  duration: 98000,
  ease: 'Linear',
  repeat: -1
});

this.tweens.add({
  targets: stormClouds,
  alpha: {
    from: .74,
    to: 1
  },
  duration: 4600,
  ease: 'Sine.inOut',
  yoyo: true,
  repeat: -1
});
  },

  'corporate-lockdown': () => {
    for (let x = 0; x < 1500; x += 130) {
      sky
        .fillStyle(0xff826e, .07)
        .fillRect(x, 110, 68, 320);
    }
    const corporateClouds =
  this.add
    .graphics()
    .setScrollFactor(.035)
    .setDepth(0);

for (let x = -180; x < 3000; x += 340) {
  const y =
    125 +
    (x % 4) * 18;

  corporateClouds
    .fillStyle(0xdffcff, .018)
    .fillCircle(
      x,
      y,
      54
    )

    .fillStyle(0xb9d9e8, .022)
    .fillCircle(
      x + 44,
      y + 6,
      40
    )

    .fillStyle(0xcfe9f2, .016)
    .fillCircle(
      x - 38,
      y + 10,
      32
    )

    .fillStyle(0xff826e, .012)
    .fillEllipse(
      x + 10,
      y + 28,
      155,
      32
    );
}

this.tweens.add({
  targets: corporateClouds,
  x: -820,
  duration: 125000,
  ease: 'Linear',
  repeat: -1
});

this.tweens.add({
  targets: corporateClouds,
  alpha: {
    from: .76,
    to: 1
  },
  duration: 7000,
  ease: 'Sine.inOut',
  yoyo: true,
  repeat: -1
});
  },

  'final-relay': () => {
    for (let x = 90; x < 1500; x += 210) {
      sky
        .lineStyle(1, 0xffe0a8, .2)
        .strokeCircle(x, 230, 72);
    }
    const relayClouds =
  this.add
    .graphics()
    .setScrollFactor(.025)
    .setDepth(0);

for (let x = -220; x < 3200; x += 390) {
  const y =
    105 +
    (x % 3) * 28;

  relayClouds
    .fillStyle(0x211d3a, .13)
    .fillCircle(
      x,
      y,
      72
    )

    .fillStyle(0x334261, .15)
    .fillCircle(
      x + 55,
      y + 8,
      54
    )

    .fillStyle(0x171528, .12)
    .fillCircle(
      x - 52,
      y + 14,
      46
    )

    .fillStyle(0xffe0a8, .028)
    .fillEllipse(
      x + 12,
      y + 34,
      205,
      46
    );
}

this.tweens.add({
  targets: relayClouds,
  x: -900,
  duration: 145000,
  ease: 'Linear',
  repeat: -1
});

this.tweens.add({
  targets: relayClouds,
  alpha: {
    from: .72,
    to: 1
  },
  duration: 8000,
  ease: 'Sine.inOut',
  yoyo: true,
  repeat: -1
});
  }
}[this.mission.id];

backdrop?.();
 
const farClouds =
  this.add
    .graphics()
    .setScrollFactor(.03)
    .setDepth(0);

for (let x = -200; x < 2800; x += 360) {
  const y =
    105 +
    (x % 4) * 20;

  farClouds
    .fillStyle(0xdffcff, .018)
    .fillCircle(
      x,
      y,
      60
    )
    .fillStyle(0x8df4ff, .014)
    .fillCircle(
      x + 48,
      y + 8,
      44
    )
    .fillStyle(0xdffcff, .012)
    .fillEllipse(
      x + 18,
      y + 30,
      170,
      40
    );
}

this.tweens.add({
  targets: farClouds,
  x: -850,
  duration: 105000,
  ease: 'Linear',
  repeat: -1
});

this.tweens.add({
  targets: farClouds,
  alpha: {
    from: .72,
    to: 1
  },
  duration: 6200,
  ease: 'Sine.inOut',
  yoyo: true,
  repeat: -1
});

const distant = this.add.graphics().setScrollFactor(.12);

const distantColor = this.mission.blackout
  ? 0x091222
  : visual.skyline;

const windowAlpha = this.mission.blackout
  ? .12
  : .25;

const distantBuildings = [
  [20, 150],
  [210, 220],
  [470, 175],
  [700, 245],
  [980, 165],
  [1190, 225],
  [1460, 190],
  [1710, 260],
  [2020, 175],
  [2260, 235],
  [2540, 185],
  [2790, 250],
  [3080, 180],
  [3330, 230],
  [3610, 190],
  [3880, 245]
];

distantBuildings.forEach(
  ([x, h]) => {
    distant
      .fillStyle(
        distantColor,
        1
      )
      .fillRect(
        x,
        570 - h,
        118,
        h
      );

    distant
      .fillStyle(
        visual.window,
        windowAlpha
      )
      .fillRect(
        x + 22,
        500 - h * .22,
        10,
        5
      )
      .fillRect(
        x + 68,
        520 - h * .18,
        10,
        5
      );
  }
);

const middle = this.add.graphics().setScrollFactor(.38);

// ART-DIRECTED CITY BLOCKS
// Fixed positions and profiles. No procedural building generation.
const buildingProfiles = [
  {
    x: -120,
    width: 170,
    height: 250,
    offsetY: 360,
    windowCols: [32, 92],
    windowGap: 34,
    accent: true
  },
  {
    x: 170,
    width: 230,
    height: 300,
    offsetY: 310,
    windowCols: [34, 100, 166],
    windowGap: 30,
    accent: false
  },
  {
    x: 520,
    width: 145,
    height: 350,
    offsetY: 260,
    windowCols: [28, 78],
    windowGap: 32,
    accent: true
  },
  {
    x: 760,
    width: 255,
    height: 270,
    offsetY: 340,
    windowCols: [36, 106, 176],
    windowGap: 32,
    accent: false
  },
  {
    x: 1110,
    width: 180,
    height: 325,
    offsetY: 285,
    windowCols: [32, 96],
    windowGap: 34,
    accent: true
  }
];

buildingProfiles.forEach(building => {
  const baseColor =
    this.mission.blackout
      ? 0x10192a
      : visual.skyline;

  const bodyColor =
    this.mission.blackout
      ? 0x15233a
      : visual.building;

  const roofY =
    building.offsetY;

  const bottomY = 610;

  // Main silhouette
  middle
    .fillStyle(baseColor, 1)
    .fillRect(
      building.x,
      roofY + 48,
      building.width,
      bottomY - (roofY + 48)
    );

  // Main building body
  middle
    .fillStyle(bodyColor, 1)
    .fillRect(
      building.x + 12,
      roofY,
      building.width - 24,
      bottomY - roofY
    );

  // Rooftop cap
  middle
    .fillStyle(
      this.mission.blackout
        ? 0x1a2940
        : 0x22374f,
      1
    )
    .fillRect(
      building.x + 8,
      roofY - 8,
      building.width - 16,
      8
    );

  // Vertical architectural frame
  middle
    .lineStyle(
      2,
      0x657b92,
      0.38
    )
    .lineBetween(
      building.x + building.width - 18,
      roofY + 12,
      building.x + building.width - 18,
      bottomY
    );

  // Windows
  for (
    let y = roofY + 28;
    y < bottomY - 22;
    y += building.windowGap
  ) {
    building.windowCols.forEach(column => {
      if (
        column + 12 >
        building.width - 24
      ) {
        return;
      }

      middle
        .fillStyle(
          visual.window,
          this.mission.blackout
            ? 0.16
            : 0.26
        )
        .fillRect(
          building.x + 14 + column,
          y,
          10,
          6
        );
    });
  }

  // Neon vertical identity strip
  if (building.accent) {
    middle
      .fillStyle(
        visual.accent,
        this.mission.blackout
          ? 0.18
          : 0.34
      )
      .fillRect(
        building.x + 18,
        roofY + 18,
        3,
        bottomY - roofY - 32
      );
  }

  // Rooftop antenna / structure
  middle
    .lineStyle(
      2,
      visual.accent,
      0.42
    )
    .lineBetween(
      building.x +
        building.width / 2,
      roofY,
      building.x +
        building.width / 2,
      roofY - 26
    )
    .fillStyle(
      visual.accent,
      0.55
    )
    .fillCircle(
      building.x +
        building.width / 2,
      roofY - 26,
      3
    );
});

const foreground = this.add.graphics().setScrollFactor(.72);

for (
  let x = -200;
  x < this.worldWidth + 300;
  x += 390
) {
  foreground
    .fillStyle(0x0a1220, .78)
    .fillRect(
      x + 20,
      475,
      24,
      245
    )
    .fillRect(
      x + 105,
      530,
      15,
      190
    )
    .fillStyle(0x131f30)
    .fillRect(x, 628, 270, 92);

  foreground
    .lineStyle(3, 0x52677d, .6)
    .lineBetween(
      x + 44,
      505,
      x + 130,
      505
    )
    .lineBetween(
      x + 44,
      505,
      x + 44,
      580
    );
}

  // ============================================================
// NEON AIR TRAFFIC / CITY LIGHT STREAMS
// Purely visual — no physics, no gameplay state.
// ============================================================

const trafficFx = this.add
  .graphics()
  .setScrollFactor(.22)
  .setDepth(2);

const trafficBursts = [
  { x: 280, y: 248, w: 150, a: .18 },
  { x: 760, y: 302, w: 210, a: .14 },
  { x: 1320, y: 220, w: 120, a: .20 },
  { x: 1880, y: 278, w: 190, a: .16 },
  { x: 2460, y: 235, w: 150, a: .18 },
  { x: 3120, y: 292, w: 230, a: .13 },
  { x: 3660, y: 214, w: 170, a: .17 }
];

trafficBursts.forEach(
  ({ x, y, w, a }, index) => {
    trafficFx
      .fillStyle(
        visual.accent,
        a * .28
      )
      .fillRoundedRect(
        x,
        y,
        w,
        8,
        4
      );

    trafficFx
      .fillStyle(
        visual.accent,
        a
      )
      .fillRoundedRect(
        x + 12,
        y + 2,
        w * .42,
        3,
        2
      );

    trafficFx
      .fillStyle(
        0xdffcff,
        a * .85
      )
      .fillRoundedRect(
        x + 20,
        y + 2,
        Math.min(44, w * .16),
        2,
        1
      );
  }
);

// Slow atmospheric scan line
const cityScan = this.add
  .rectangle(
    -180,
    335,
    220,
    2,
    visual.accent,
    0.10
  )
  .setOrigin(0, 0.5)
  .setScrollFactor(.18)
  .setDepth(2);

if (!this.motionReduced) {
  this.tweens.add({
    targets: cityScan,
    x: this.worldWidth + 300,
    duration: 18000,
    ease: 'Linear',
    repeat: -1
  });

  this.tweens.add({
    targets: trafficFx,
    alpha: {
      from: .72,
      to: 1
    },
    duration: 2600,
    ease: 'Sine.inOut',
    yoyo: true,
    repeat: -1
  });
}

  // ============================================================
// HOLOGRAM BILLBOARDS / NEON DISTRICT SIGNS
// Purely visual — no gameplay / physics changes.
// ============================================================

const billboardFx = this.add
  .graphics()
  .setScrollFactor(.30)
  .setDepth(3);

const billboardData = [
  {
    x: 420,
    y: 330,
    w: 150,
    h: 62
  },
  {
    x: 1160,
    y: 285,
    w: 190,
    h: 72
  },
  {
    x: 1980,
    y: 320,
    w: 155,
    h: 64
  },
  {
    x: 2780,
    y: 275,
    w: 210,
    h: 78
  },
  {
    x: 3520,
    y: 315,
    w: 165,
    h: 66
  }
];

billboardData.forEach(
  ({ x, y, w, h }, index) => {

    // Outer glow field
    billboardFx
      .fillStyle(
        visual.accent,
        0.045
      )
      .fillRoundedRect(
        x - 8,
        y - 8,
        w + 16,
        h + 16,
        8
      );

    // Dark hologram body
    billboardFx
      .fillStyle(
        0x07111d,
        0.88
      )
      .fillRoundedRect(
        x,
        y,
        w,
        h,
        5
      );

    // Neon frame
    billboardFx
      .lineStyle(
        2,
        visual.accent,
        0.72
      )
      .strokeRoundedRect(
        x,
        y,
        w,
        h,
        5
      );

    // Inner frame
    billboardFx
      .lineStyle(
        1,
        0xdffcff,
        0.20
      )
      .strokeRoundedRect(
        x + 7,
        y + 7,
        w - 14,
        h - 14,
        3
      );

    // Horizontal hologram scan lines
    for (
      let line = y + 14;
      line < y + h - 10;
      line += 10
    ) {
      billboardFx
        .fillStyle(
          visual.accent,
          0.10
        )
        .fillRect(
          x + 10,
          line,
          w - 20,
          2
        );
    }

    // Central signal core
    billboardFx
      .fillStyle(
        visual.accent,
        0.18
      )
      .fillCircle(
        x + w / 2,
        y + h / 2,
        16
      );

    billboardFx
      .lineStyle(
        2,
        visual.accent,
        0.68
      )
      .strokeCircle(
        x + w / 2,
        y + h / 2,
        10
      );

    billboardFx
      .fillStyle(
        0xdffcff,
        0.90
      )
      .fillCircle(
        x + w / 2,
        y + h / 2,
        3
      );

    // Side signal nodes
    billboardFx
      .fillStyle(
        visual.accent,
        0.72
      )
      .fillCircle(
        x + 12,
        y + 12,
        2
      )
      .fillCircle(
        x + w - 12,
        y + 12,
        2
      );

    // Bottom signal bar
    billboardFx
      .fillStyle(
        visual.accent,
        0.42
      )
      .fillRect(
        x + 14,
        y + h - 9,
        Math.max(
          20,
          w - 28
        ),
        2
      );
  }
);

if (!this.motionReduced) {
  this.tweens.add({
    targets: billboardFx,
    alpha: {
      from: 0.72,
      to: 1
    },
    duration: 1400,
    ease: 'Sine.inOut',
    yoyo: true,
    repeat: -1
  });
}

this.parallaxLayers = [
  {
    layer: distant,
    base: .12
  },
  {
    layer: middle,
    base: .38
  },
  {
    layer: foreground,
    base: .72
  }
];

}

findNextSafePlatform(source) {
  if (!source?.active || !this.platforms) {
    return null;
  }

  const sourceRight =
    source.x +
    source.width / 2;

const candidates =
  this.platforms
    .getChildren()
    .filter(
      platform => {
        if (
          !platform?.active ||
          platform === source ||
          platform.body?.enable === false
        ) {
          return false;
        }

        const dx =
          platform.x -
          source.x;

        const dy =
          platform.y -
          source.y;

        const maxForward =
          900;

        const maxVertical =
          260;

        /*
         * Prefer platforms that are actually
         * reachable in the forward route.
         */
        if (
          dx < 40 ||
          dx > maxForward
        ) {
          return false;
        }

        if (
          Math.abs(dy) >
          maxVertical
        ) {
          return false;
        }

        return true;
      }
    );

  if (!candidates.length) {
    return null;
  }

candidates.sort(
  (a, b) => {
    const aDx =
      Math.max(
        0,
        a.x - source.x
      );

    const bDx =
      Math.max(
        0,
        b.x - source.x
      );

    const aDy =
      Math.abs(
        a.y - source.y
      );

    const bDy =
      Math.abs(
        b.y - source.y
      );

    /*
     * Forward distance is more important
     * than raw Euclidean distance.
     */
    const aScore =
      aDx +
      aDy * 1.35;

    const bScore =
      bDx +
      bDy * 1.35;

    return aScore - bScore;
  }
);

  return candidates[0];
}

armPlatformCollapse(platform) {
  if (
    !platform?.active ||
    !platform.getData('collapsible') ||
    platform.getData('collapseState') !== 'ready'
  ) {
    return;
  }
  
platform.setData(
  'collapseState',
  'warning'
);

const warningGlow =
  platform.getData('warningGlow');

this.tweens.killTweensOf(
  [
    platform.getData('warning'),
    warningGlow
  ].filter(Boolean)
);

platform.getData('warning')
  ?.setAlpha(0);

warningGlow?.setAlpha(0);

  const token =
    (platform.getData('collapseToken') || 0) +
    1;

  platform.setData(
    'collapseToken',
    token
  );

  const width =
    platform.width;

  const height =
    platform.height;

  let warning =
  platform.getData('warning');

let cracks =
  platform.getData('cracks');

if (!warning || !warning.active) {
  warning =
    this.add
      .rectangle(
        platform.x,
        platform.y,
        Math.max(
          20,
          width - 4
        ),
        Math.max(
          8,
          height - 4
        ),
        0xff5364,
        0.14
      )
      .setDepth(7);

  warning.setStrokeStyle(
    2,
    0xff826e,
    0.72
  );

  platform.setData(
    'warning',
    warning
  );
}

if (!cracks || !cracks.active) {
  cracks =
    this.add
      .graphics()
      .setDepth(8);

  cracks.lineStyle(
    2,
    0xff5364,
    0.95
  );

  const left =
    platform.x -
    width / 2;

  const top =
    platform.y -
    height / 2;

  cracks
    .lineBetween(
      left + width * .24,
      top + 2,
      left + width * .34,
      top + height * .55
    )
    .lineBetween(
      left + width * .34,
      top + height * .55,
      left + width * .27,
      top + height - 2
    )
    .lineBetween(
      left + width * .58,
      top + 2,
      left + width * .49,
      top + height * .44
    )
    .lineBetween(
      left + width * .49,
      top + height * .44,
      left + width * .67,
      top + height - 2
    )
    .lineBetween(
      left + width * .75,
      top + 2,
      left + width * .66,
      top + height * .30
    );

  platform.setData(
    'cracks',
    cracks
  );
}

warning
  .setPosition(
    platform.x,
    platform.y
  )
  .setVisible(true)
  .setAlpha(0.10)
  .setScale(1);

cracks
  .setVisible(true)
  .setAlpha(0.55)
  .setPosition(0, 0);

  this.playerCue(
    'PLATFORM UNSTABLE · MOVE',
    '#ff826e'
  );

  this.game.events.emit(
    'feedback',
    'platform_warning'
  );

 if (!this.motionReduced) {
  this.tweens.add({
    targets: warning,
    alpha: {
      from: 0.10,
      to: 0.46
    },
    scaleX: {
      from: 0.98,
      to: 1.02
    },
    duration: 170,
    yoyo: true,
    repeat: 5,
    ease: 'Sine.inOut'
  });

  this.tweens.add({
    targets: warningGlow,
    alpha: {
      from: 0.03,
      to: 0.18
    },
    scaleX: {
      from: 0.96,
      to: 1.04
    },
    duration: 120,
    yoyo: true,
    repeat: 7,
    ease: 'Sine.inOut'
  });

  this.tweens.add({
    targets: cracks,
    alpha: {
      from: 0.55,
      to: 1
    },
    duration: 150,
    yoyo: true,
    repeat: 6,
    ease: 'Sine.inOut'
  });
}

  this.time.delayedCall(
    1250,
    () => {
      if (
        !platform?.active ||
        platform.getData('collapseToken') !== token ||
        platform.getData('collapseState') !== 'warning'
      ) {
        return;
      }

      this.collapsePlatform(
        platform
      );
    }
  );
}

collapsePlatform(platform) {
  if (
    !platform?.active ||
    platform.getData('collapseState') !== 'warning'
  ) {
    return;
  }

  platform.setData(
    'collapseState',
    'broken'
  );

  platform.setData(
    'collapseToken',
    (platform.getData('collapseToken') || 0) + 1
  );

  const warning =
    platform.getData('warning');

  const cracks =
    platform.getData('cracks');

warning?.destroy?.();
cracks?.destroy?.();

const warningGlow =
  platform.getData('warningGlow');

this.tweens.killTweensOf(
  warningGlow
);

warningGlow
  ?.setVisible(false)
  ?.setAlpha(0)
  ?.setScale(1);

platform.setData(
  'warning',
  null
);

platform.setData(
  'cracks',
  null
);

  const detail =
    platform.getData('detail');

  detail?.setVisible(false);

  if (platform.body) {
    platform.body.enable = false;
  }

  platform.setVisible(false);

  const fragmentColor =
    platform.getData(
      'originalFillColor'
    ) ?? 0x202d43;

  const fragments = [];

  const fragmentOffsets = [
    [-0.30, 0.16],
    [-0.10, 0.08],
    [ 0.14, 0.14],
    [ 0.34, 0.07]
  ];

  fragmentOffsets.forEach(
    ([offsetX, offsetY], index) => {
      const fragment =
        this.add.rectangle(
          platform.x +
            platform.width *
            offsetX,
          platform.y +
            platform.height *
            offsetY,
          Math.max(
            12,
            platform.width * .20
          ),
          Math.max(
            5,
            platform.height * .28
          ),
          fragmentColor,
          0.90
        )
        .setDepth(7)
        .setAngle(
          index % 2 === 0
            ? -8
            : 8
        );

      fragments.push(
        fragment
      );

      if (!this.motionReduced) {
        this.tweens.add({
          targets: fragment,
          y:
            fragment.y +
            70 +
            index * 12,
          angle:
            fragment.angle +
            (index % 2 === 0
              ? -26
              : 26),
          alpha: 0,
          duration:
            460 +
            index * 70,
          ease: 'Quad.in',
          onComplete: () =>
            fragment.destroy()
        });
      }
    }
  );

  platform.setData(
    'fragments',
    fragments
  );

  this.platformEmergencyTarget =
    this.findNextSafePlatform(
      platform
    );

  this.playerCue(
    this.platformEmergencyTarget
      ? 'PLATFORM LOST · FIND ANOTHER'
      : 'PLATFORM LOST · ROUTE AHEAD',
    '#ff5364'
  );

 this.game.events.emit(
  'feedback',
  'platform_collapsed'
);

this.game.events.emit(
  'tutorial',
  this.platformEmergencyTarget
    ? 'PLATFORM FAILURE · MOVE TO THE NEXT PLATFORM'
    : 'PLATFORM FAILURE · ROUTE AHEAD'
);

if (
  !this.motionReduced &&
  this.graphicsLevel >= 2
) {
  this.cameras.main.flash(
    90,
    255,
    90,
    100
  );

  this.shake(
    110,
    0.008
  );
}

  this.updateCheckpointArrow();
}

handlePlatformLanding(platform) {
if (
  this.finished ||
  this.respawning ||
  this.cinematicActive ||
  !this.player?.active ||
  !this.keys ||
  !this.cursors
) {
  return;
}

  const body =
    this.player.body;

  const grounded =
    body?.blocked?.down ||
    body?.touching?.down;

  if (!grounded) {
    return;
  }

  if (
    this.platformEmergencyTarget ===
    platform
  ) {
    this.platformEmergencyTarget =
      null;

    this.updateCheckpointArrow();
  }

  this.armPlatformCollapse(
    platform
  );
}

resetCollapsingPlatforms() {
  this.platformEmergencyTarget = null;

  this.platforms
    ?.getChildren()
    ?.forEach(
      platform => {
        if (
          !platform?.active ||
          !platform.getData('collapsible')
        ) {
          return;
        }

     platform.setData(
  'collapseToken',
  (platform.getData('collapseToken') || 0) + 1
);

platform.setData(
  'collapseState',
  'ready'
);

platform
  .getData('warning')
  ?.setVisible(false)
  ?.setAlpha(0)
  ?.setScale(1);

platform
  .getData('warningGlow')
  ?.setVisible(false)
  ?.setAlpha(0)
  ?.setScale(1);

platform
  .getData('cracks')
  ?.setVisible(false)
  ?.setAlpha(0)
  ?.setScale(1);

     const warning =
  platform.getData('warning');

const warningGlow =
  platform.getData('warningGlow');

const cracks =
  platform.getData('cracks');

const fragments =
  platform.getData('fragments');

/*
 * Cancel all active platform FX.
 */
this.tweens.killTweensOf(
  [
    warning,
    warningGlow,
    cracks
  ].filter(Boolean)
);

/*
 * Fragments are one-shot objects.
 * They must be destroyed because they are
 * no longer reused after collapse.
 */
if (Array.isArray(fragments)) {
  fragments.forEach(
    fragment =>
      fragment?.destroy?.()
  );
}

/*
 * Reuse warning / glow / cracks objects.
 */
warning
  ?.setVisible(false)
  ?.setAlpha(0)
  ?.setScale(1);

warningGlow
  ?.setVisible(false)
  ?.setAlpha(0)
  ?.setScale(1);

cracks
  ?.setVisible(false)
  ?.setAlpha(0)
  ?.setScale(1);

platform.setData(
  'fragments',
  null
);

platform.setVisible(true);
platform.setAlpha(1);

        platform.setFillStyle(
          platform.getData(
            'originalFillColor'
          ),
          1
        );

        platform.setStrokeStyle(
          platform.getData(
            'originalStrokeWidth'
          ) ?? 3,
          platform.getData(
            'originalStrokeColor'
          ) ?? 0x607b99,
          1
        );

        const detail =
          platform.getData('detail');

        detail?.setVisible(true);
        detail?.setAlpha(1);

        if (platform.body) {
          platform.body.enable = true;
          platform.refreshBody();
        }
      }
    );
}

createPlatforms() {

  const visual =
    DISTRICT_VISUALS[this.mission.id] ||
    DISTRICT_VISUALS['first-delivery'];

  const blackout =
    Boolean(this.mission.blackout);

  /*
   * ------------------------------------------------------------
   * PLATFORM SOURCE
   *
   * Uses the actual mission.platforms array.
   *
   * Supported format:
   * [x, y, width, height]
   * [x, y, width, height, isRoof]
   * [x, y, width, height, isRoof, collapsible]
   *
   * ------------------------------------------------------------
   */

  const sourcePlatforms =
    Array.isArray(this.mission.platforms)
      ? this.mission.platforms
      : [];

  this.platforms =
    this.physics.add.staticGroup();

  sourcePlatforms.forEach(
    (
      data,
      index
    ) => {

      if (
        !Array.isArray(data) ||
        data.length < 4
      ) {
        return;
      }

      const x =
        Number(data[0]) || 0;

      const y =
        Number(data[1]) || 0;

      const width =
        Math.max(
          20,
          Number(data[2]) || 20
        );

      const height =
        Math.max(
          8,
          Number(data[3]) || 8
        );

      const isRoof =
        Boolean(data[4]);

      const collapsible =
        Boolean(data[5]);

      const baseColor =
        blackout
          ? 0x0a1420
          : 0x102338;

      const strokeColor =
        visual.accent ??
        0x8df4ff;

      /*
       * ----------------------------------------------------------
       * PLATFORM = VISUAL + PHYSICS
       *
       * One object only.
       * This is important because the collapse/reset system
       * already expects platform.setFillStyle(),
       * platform.setStrokeStyle(), platform.setVisible(),
       * platform.body and refreshBody().
       * ----------------------------------------------------------
       */

      const platform =
        this.add
          .rectangle(
            x + width / 2,
            y + height / 2,
            width,
            height,
            baseColor,
            0.98
          )
          .setStrokeStyle(
            isRoof ? 2 : 1.5,
            strokeColor,
            isRoof ? 0.72 : 0.42
          )
          .setDepth(7);

      this.physics.add.existing(
        platform,
        true
      );

      this.platforms.add(
        platform
      );

      /*
       * ----------------------------------------------------------
       * CORE PLATFORM DATA
       * ----------------------------------------------------------
       */

      platform.setData(
        'index',
        index
      );

      platform.setData(
        'x',
        x
      );

      platform.setData(
        'y',
        y
      );

      platform.setData(
        'width',
        width
      );

      platform.setData(
        'height',
        height
      );

      platform.setData(
        'isRoof',
        isRoof
      );

      platform.setData(
        'collapsible',
        collapsible
      );

      platform.setData(
        'collapseState',
        'ready'
      );

      platform.setData(
        'collapseToken',
        0
      );

      /*
       * Keep original source data available.
       */
      platform.setData(
        'sourceData',
        data.slice()
      );

      /*
       * The platform itself is now the authoritative visual.
       * No second rectangle is required.
       */
      platform.setData(
        'visual',
        platform
      );

      /*
       * ----------------------------------------------------------
       * ORIGINAL STYLE
       * ----------------------------------------------------------
       */

      platform.setData(
        'originalFillColor',
        baseColor
      );

      platform.setData(
        'originalStrokeColor',
        strokeColor
      );

      platform.setData(
        'originalStrokeWidth',
        isRoof ? 2 : 1.5
      );

      /*
       * ----------------------------------------------------------
       * PLATFORM DETAIL
       * ----------------------------------------------------------
       */

      const detail =
        this.add
          .graphics()
          .setDepth(7);

      platform.setData(
        'detail',
        detail
      );

      /*
       * Platform inset
       */
      detail
        .fillStyle(
          0x0b1422,
          blackout ? 0.72 : 0.82
        )
        .fillRect(
          x + 6,
          y + 8,
          Math.max(
            0,
            width - 12
          ),
          Math.max(
            4,
            height - 14
          )
        );

      /*
       * Structural panel marks
       */
      detail
        .fillStyle(
          0x111a29,
          blackout ? 0.70 : 0.90
        );

      for (
        let mark = x + 18;
        mark < x + width - 10;
        mark += 34
      ) {

        detail.fillRect(
          mark,
          y + 18,
          Math.min(
            16,
            x + width - mark - 8
          ),
          5
        );
      }

      /*
       * Neon top edge
       */
      detail
        .fillStyle(
          isRoof
            ? 0x94f5ff
            : 0x9eb6c8,
          blackout
            ? (
                isRoof
                  ? 0.38
                  : 0.12
              )
            : (
                isRoof
                  ? 0.62
                  : 0.22
              )
        )
        .fillRect(
          x,
          y + 3,
          width,
          isRoof ? 4 : 3
        );

      /*
       * Lower energy strip
       */
      detail
        .fillStyle(
          isRoof
            ? 0x8df4ff
            : 0x536d84,
          blackout
            ? 0.18
            : 0.12
        )
        .fillRect(
          x + 10,
          y + height - 5,
          Math.max(
            0,
            width - 20
          ),
          2
        );

      /*
       * Roof frame
       */
      if (isRoof) {

        detail
          .lineStyle(
            2,
            0xaabccc,
            0.80
          )
          .lineBetween(
            x + 14,
            y,
            x + 14,
            y - 18
          )
          .lineBetween(
            x + 14,
            y - 18,
            x + width - 14,
            y - 18
          )
          .lineBetween(
            x + width - 14,
            y - 18,
            x + width - 14,
            y
          );

        /*
         * Roof signal nodes
         */
        detail
          .fillStyle(
            0x8df4ff,
            blackout
              ? 0.35
              : 0.55
          )
          .fillCircle(
            x + 14,
            y - 18,
            2
          )
          .fillCircle(
            x + width - 14,
            y - 18,
            2
          );
      }

      /*
       * ----------------------------------------------------------
       * COLLAPSIBLE PLATFORM STATE
       * ----------------------------------------------------------
       */

      platform.setData(
        'warning',
        null
      );

      platform.setData(
        'warningGlow',
        null
      );

      platform.setData(
        'cracks',
        null
      );

      platform.setData(
        'fragments',
        null
      );

      if (collapsible) {

        const warning =
          this.add
            .rectangle(
              x + width / 2,
              y + 4,
              Math.max(
                12,
                width - 8
              ),
              3,
              0xff5364,
              0
            )
            .setDepth(8);

        const warningGlow =
          this.add
            .rectangle(
              x + width / 2,
              y + 5,
              Math.max(
                10,
                width - 16
              ),
              8,
              0xff5364,
              0
            )
            .setDepth(7);

        warning.setStrokeStyle(
          1,
          0xff826e,
          0.72
        );

        platform.setData(
          'warning',
          warning
        );

        platform.setData(
          'warningGlow',
          warningGlow
        );
      }

      /*
       * ----------------------------------------------------------
       * BODY SAFETY
       * ----------------------------------------------------------
       */

      if (platform.body) {

        platform.body.allowGravity =
          false;

        platform.body.immovable =
          true;

        platform.body.enable =
          true;
      }

      /*
       * ----------------------------------------------------------
       * ALIGNMENT HELPERS
       * ----------------------------------------------------------
       */

      platform.setData(
        'left',
        x
      );

      platform.setData(
        'right',
        x + width
      );

      platform.setData(
        'top',
        y
      );

      platform.setData(
        'bottom',
        y + height
      );
    }
  );

 /*
 * ------------------------------------------------------------
 * PLATFORM COLLIDER
 *
 * IMPORTANT:
 * Player is created AFTER createPlatforms().
 * The player ↔ platform collider is therefore created
 * inside createPlayer(), exactly once.
 * ------------------------------------------------------------
 */

  /*
   * ------------------------------------------------------------
   * WORLD PROPS
   * ------------------------------------------------------------
   */

  const props =
    this.add
      .graphics()
      .setDepth(6);

  props
    .fillStyle(
      0x192238
    )
    .fillRect(
      90,
      508,
      72,
      102
    )
    .fillStyle(
      0xffbd5b
    )
    .fillRect(
      104,
      523,
      44,
      20
    );

  props
    .lineStyle(
      4,
      0x7e91a2
    )
    .lineBetween(
      1070,
      610,
      1070,
      430
    )
    .lineBetween(
      1070,
      430,
      1180,
      430
    )
    .lineBetween(
      1180,
      430,
      1180,
      610
    );

  props
    .fillStyle(
      0x34233a
    )
    .fillRect(
      1770,
      455,
      140,
      58
    )
    .fillStyle(
      0xff7580
    )
    .fillRect(
      1784,
      470,
      112,
      25
    );
}

createWorldLandmarks() {
const visual = DISTRICT_VISUALS[this.mission.id];
const world = this.add.graphics();

// Lamps, directional signs, and the distant relay tower make the route readable without UI text.
[160, 870, 1515, 2410, 3270, 3860].forEach(x => {
  world
    .lineStyle(4, 0x566d80)
    .lineBetween(x, 610, x, 510)
    .lineBetween(
      x,
      510,
      x + 26,
      510
    );

  world
    .fillStyle(
      visual.accent,
      this.mission.blackout
        ? .2
        : .14
    )
    .fillCircle(
      x + 26,
      520,
      this.mission.blackout
        ? 44
        : 34
    )
    .fillStyle(visual.accent)
    .fillCircle(
      x + 26,
      520,
      5
    );
});

world
  .fillStyle(0x29334a)
  .fillRect(535, 540, 102, 32)
  .fillStyle(0xffd06e)
  .fillTriangle(
    550,
    548,
    550,
    565,
    574,
    556
  );

world
  .fillStyle(0x29334a)
  .fillRect(880, 540, 76, 28)
  .fillStyle(0xff826e)
  .fillRect(892, 548, 52, 4);

world
  .fillStyle(0x172238)
  .fillRect(
    3830,
    370,
    82,
    240
  )
  .fillStyle(0x2e4059)
  .fillRect(
    3850,
    315,
    42,
    300
  );

world
  .lineStyle(4, 0xe2ebf0)
  .lineBetween(
    3870,
    315,
    3870,
    220
  );

world
  .lineStyle(
    3,
    visual.accent,
    .82
  )
  .lineBetween(
    3870,
    225,
    3925,
    245
  );

world
  .fillStyle(
    visual.accent,
    .14
  )
  .fillCircle(
    3870,
    225,
    72
  );

world
  .fillStyle(
    visual.accent
  )
  .fillCircle(
    3870,
    225,
    8
  );

/* -------------------------------------------------
   WORLD DISTRICT SIGN
   Purely visual landmark.
   ------------------------------------------------- */

const districtSign =
  this.add.container(
    3895,
    245
  )
  .setDepth(8);

const signBack =
  this.add.rectangle(
    0,
    0,
    170,
    46,
    0x07111d,
    0.82
  );

signBack.setStrokeStyle(
  2,
  visual.accent,
  0.78
);

const signGlow =
  this.add.rectangle(
    0,
    0,
    184,
    58,
    visual.accent,
    0.055
  );

const signTitle =
  this.add.text(
    0,
    -7,
    visual.label,
    {
      fontFamily: 'DM Mono',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#f4fbff',
      stroke: '#07111d',
      strokeThickness: 4,
      align: 'center',
      fixedWidth: 150
    }
  )
  .setOrigin(0.5);

const signCode =
  this.add.text(
    0,
    12,
    `// ${this.mission.id.toUpperCase()}`,
    {
      fontFamily: 'DM Mono',
      fontSize: '7px',
      color: '#b9d5ee',
      align: 'center',
      fixedWidth: 150
    }
  )
  .setOrigin(0.5);

const signScan =
  this.add.rectangle(
    -82,
    0,
    2,
    34,
    visual.accent,
    0.65
  );

districtSign.add([
  signGlow,
  signBack,
  signTitle,
  signCode,
  signScan
]);

if (!this.motionReduced) {
  this.tweens.add({
    targets: signScan,
    x: 82,
    duration: 1900,
    ease: 'Linear',
    repeat: -1
  });

  this.tweens.add({
    targets: signGlow,
    alpha: {
      from: 0.035,
      to: 0.10
    },
    duration: 1300,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut'
  });
}

if (visual.props === 'lanterns') {
  [720, 1650, 3000].forEach(x =>
    world
      .fillStyle(0x4d3540)
      .fillRect(
        x,
        520,
        18,
        90
      )
      .fillStyle(
        visual.accent,
        .2
      )
      .fillCircle(
        x + 9,
        510,
        26
      )
      .fillStyle(
        visual.accent
      )
      .fillCircle(
        x + 9,
        510,
        5
      )
  );
}

if (visual.props === 'docks') {
  [680, 2100, 3300].forEach(x => {
    world
      .lineStyle(5, 0x8496a3)
      .lineBetween(
        x,
        610,
        x,
        420
      )
      .lineBetween(
        x,
        420,
        x + 125,
        420
      )
      .fillStyle(0xffbd5b)
      .fillRect(
        x + 84,
        452,
        52,
        32
      );
  });
}

if (visual.props === 'emergency') {
  [760, 1800, 3000].forEach(x =>
    world
      .fillStyle(0x17334a)
      .fillRect(
        x,
        535,
        112,
        35
      )
      .fillStyle(
        visual.accent,
        .65
      )
      .fillRect(
        x + 14,
        547,
        84,
        5
      )
  );
}

if (visual.props === 'rail') {
  [710, 2300, 3400].forEach(x =>
    world
      .lineStyle(4, 0x91a9c9)
      .lineBetween(
        x,
        475,
        x + 240,
        475
      )
      .lineBetween(
        x,
        500,
        x + 240,
        500
      )
      .lineBetween(
        x + 20,
        475,
        x + 20,
        540
      )
      .lineBetween(
        x + 210,
        475,
        x + 210,
        540
      )
  );
}

if (visual.props === 'array') {
  [1450, 2550, 3450].forEach(x => {
    world
      .lineStyle(
        3,
        visual.accent,
        .75
      )
      .lineBetween(
        x,
        555,
        x + 36,
        360
      )
      .lineBetween(
        x + 72,
        555,
        x + 36,
        360
      )
      .lineBetween(
        x,
        555,
        x + 72,
        555
      )
      .fillStyle(
        visual.accent,
        .18
      )
      .fillCircle(
        x + 36,
        360,
        36
      );
  });
}

// ============================================================
// DISTRICT HOLOGRAM / MEGA LANDMARK
// Purely visual — no gameplay interaction.
// ============================================================

const hologramY = 300;
const hologramX =
  Phaser.Math.Clamp(
    this.worldWidth * 0.62,
    900,
    this.worldWidth - 500
  );

const hologram = this.add.graphics()
  .setDepth(2)
  .setScrollFactor(.20);

// Outer field
hologram
  .fillStyle(
    visual.accent,
    0.045
  )
  .fillCircle(
    hologramX,
    hologramY,
    105
  );

// Main ring
hologram
  .lineStyle(
    3,
    visual.accent,
    0.48
  )
  .strokeCircle(
    hologramX,
    hologramY,
    72
  );

// Inner ring
hologram
  .lineStyle(
    1.5,
    0xdffcff,
    0.42
  )
  .strokeCircle(
    hologramX,
    hologramY,
    48
  );

// Vertical spine
hologram
  .lineStyle(
    2,
    visual.accent,
    0.55
  )
  .lineBetween(
    hologramX,
    hologramY - 82,
    hologramX,
    hologramY + 82
  );

// Horizontal scan
hologram
  .lineStyle(
    1,
    0xdffcff,
    0.28
  )
  .lineBetween(
    hologramX - 82,
    hologramY,
    hologramX + 82,
    hologramY
  );

// District core
hologram
  .fillStyle(
    visual.accent,
    0.18
  )
  .fillCircle(
    hologramX,
    hologramY,
    18
  );

hologram
  .fillStyle(
    0xdffcff,
    0.85
  )
  .fillCircle(
    hologramX,
    hologramY,
    5
  );

// Signal ticks
for (let i = 0; i < 8; i++) {
  const angle =
    (Math.PI * 2 * i) / 8;

  const innerX =
    hologramX +
    Math.cos(angle) * 58;

  const innerY =
    hologramY +
    Math.sin(angle) * 58;

  const outerX =
    hologramX +
    Math.cos(angle) * 76;

  const outerY =
    hologramY +
    Math.sin(angle) * 76;

  hologram
    .lineStyle(
      2,
      visual.accent,
      0.42
    )
    .lineBetween(
      innerX,
      innerY,
      outerX,
      outerY
    );
}

if (!this.motionReduced) {
  this.tweens.add({
    targets: hologram,
    alpha: {
      from: .68,
      to: 1
    },
    duration: 1800,
    ease: 'Sine.inOut',
    yoyo: true,
    repeat: -1
  });

  this.tweens.add({
    targets: hologram,
    angle: 360,
    duration: 28000,
    ease: 'Linear',
    repeat: -1
  });
}
}
  createBrutalMapDetails() {
  const mapFx = this.add.graphics();

  // Ground glow
  mapFx.fillStyle(0x0b1424, 1);
  mapFx.fillRect(
    0,
    610,
    this.worldWidth,
    110
  );

  // Neon route line
  mapFx.lineStyle(
    3,
    0x8df4ff,
    0.22
  );

  mapFx.lineBetween(
    0,
    606,
    this.worldWidth,
    606
  );

  // Repeating street panels
  for (
    let x = 0;
    x < this.worldWidth;
    x += 160
  ) {
    mapFx
      .fillStyle(0x17263b, 0.7)
      .fillRect(
        x,
        615,
        132,
        6
      );

    mapFx
      .lineStyle(
        1,
        0x8df4ff,
        0.12
      )
      .lineBetween(
        x + 18,
        620,
        x + 18,
        704
      );
  }

  // Neon city pillars
  for (
    let x = 90;
    x < this.worldWidth;
    x += 300
  ) {
const height =
  70 +
  (x % 4) * 28;

mapFx
  .fillStyle(0x101c30, 0.9)
  .fillRect(
    x,
    610 - height,
    42,
    height
  );

const cyanLight =
  this.add
    .rectangle(
      x + 11,
      625 - height / 2,
      6,
      Math.max(18, height - 20),
      0x8df4ff,
      0.18
    )
    .setOrigin(0.5)
    .setDepth(2);

const amberLight =
  this.add
    .rectangle(
      x + 26,
      625 - height / 2,
      5,
      Math.max(16, height - 30),
      0xffd06e,
      0.28
    )
    .setOrigin(0.5)
    .setDepth(2);

if (!this.motionReduced) {
  this.tweens.add({
    targets: cyanLight,
    alpha: {
      from: 0.10,
      to: 0.28
    },
    duration:
      900 +
      (x % 5) * 140,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut'
  });

  this.tweens.add({
    targets: amberLight,
    alpha: {
      from: 0.16,
      to: 0.34
    },
    duration:
      1200 +
      (x % 4) * 180,
    delay: 140,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut'
  });
}
  }

  mapFx.setDepth(1);
}
createRouteLighting() {
if (!this.mission.safeZones?.length) return;

const lights = this.add.graphics();

this.mission.safeZones.forEach(
  ([x, y, width]) => {
    // Soft safe-zone field
    lights
      .fillStyle(
        0x8df4ff,
        .055
      )
      .fillRect(
        x,
        y,
        width,
        48
      );

    // Main route edge
    lights
      .fillStyle(
        0x8df4ff,
        .32
      )
      .fillRect(
        x,
        y,
        width,
        3
      );

    // Secondary inner line
    lights
      .fillStyle(
        0xdffcff,
        .12
      )
      .fillRect(
        x + 8,
        y + 9,
        Math.max(
          0,
          width - 16
        ),
        1
      );

    // End markers
    lights
      .fillStyle(
        0x8df4ff,
        .5
      )
      .fillCircle(
        x + 8,
        y + 2,
        2
      )
      .fillCircle(
        x + width - 8,
        y + 2,
        2
      );
  }
);

lights.setDepth(4);

  /*
 * SAFE ZONE NEON PULSE
 */
if (!this.motionReduced) {
  this.mission.safeZones.forEach(
    ([x, y, width]) => {
      const pulse =
        this.add
          .rectangle(
            x + width / 2,
            y + 22,
            width,
            45,
            0x8df4ff,
            0.04
          )
          .setOrigin(0.5)
          .setDepth(3);

      pulse.setScale(0.98, 0.92);

      this.tweens.add({
        targets: pulse,
        scaleX: 1.02,
        scaleY: 1.08,
        alpha: {
          from: 0.025,
          to: 0.10
        },
        duration: 1100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
    }
  );
}

}

createPlayer() {
this.player = this.physics.add
.sprite(
this.mission.spawn.x,
this.mission.spawn.y,
'runner-idle'
)
.setDepth(10);

this.player.body
// ============================================================
// PLAYER PHYSICS BODY · STANDING / CROUCH
// ============================================================
this.playerBodyConfig = {
  standing: {
    width: 28,
    height: 55,
    offsetX: 10,
    offsetY: 5
  },

  crouching: {
    width: 28,
    height: 34,
    offsetX: 10,
    offsetY: 26
  }
};

this.playerCrouched = false;

this.player.body
  .setSize(
    this.playerBodyConfig.standing.width,
    this.playerBodyConfig.standing.height
  )
  .setOffset(
    this.playerBodyConfig.standing.offsetX,
    this.playerBodyConfig.standing.offsetY
  )
  .setMaxVelocity(
    RUNNER_TUNING.maxRunSpeed,
    RUNNER_TUNING.maxFallSpeed
  )
  .setDragX(
    RUNNER_TUNING.groundDeceleration
  );

this.player
  .setCollideWorldBounds(true)
  .play('runner-idle');

  // ============================================================
// PLAYER · PREMIUM MOVEMENT ANIMATION
// ============================================================

this.playerVisualBaseScaleX =
  this.player.scaleX;

this.playerVisualBaseScaleY =
  this.player.scaleY;

if (!this.motionReduced) {
  this.playerBreathTween =
    this.tweens.add({
      targets: this.player,
      alpha: {
        from: 0.985,
        to: 1
      },
      duration: 620,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });
}

  /*
 * PLAYER ENERGY FX
 */
const playerEnergyGlow =
  this.add
    .circle(
      this.player.x,
      this.player.y,
      18,
      0x8df4ff,
      0.08
    )
    .setDepth(8);

this.playerEnergyGlow =
  playerEnergyGlow;

if (!this.motionReduced) {
  this.tweens.add({
    targets: playerEnergyGlow,
    scale: {
      from: 0.82,
      to: 1.18
    },
    alpha: {
      from: 0.05,
      to: 0.14
    },
    duration: 620,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut'
  });
}

const playerEnergyFollow =
  this.time.addEvent({
    delay: 16,
    loop: true,
    callback: () => {
      if (
        !this.player?.active ||
        !playerEnergyGlow?.active
      ) {
        playerEnergyFollow.remove();
        playerEnergyGlow?.destroy();
        return;
      }

      playerEnergyGlow.x =
        this.player.x;

      playerEnergyGlow.y =
        this.player.y + 4;

      const velocityX =
        Math.abs(
          this.player.body?.velocity?.x || 0
        );

      const speedFactor =
        Phaser.Math.Clamp(
          velocityX /
            RUNNER_TUNING.maxRunSpeed,
          0,
          1
        );

      playerEnergyGlow.alpha =
        this.motionReduced
          ? 0
          : 0.05 +
            speedFactor * 0.10;

      playerEnergyGlow.scaleX =
        0.9 +
        speedFactor * 0.18;

      playerEnergyGlow.scaleY =
        0.9 +
        speedFactor * 0.10;
    }
  });

this.playerEnergyFollow =
  playerEnergyFollow;


this.physics.add.collider(
  this.player,
  this.platforms,
  (player, platform) => {
    if (!this.scene.isActive()) return;

    try {
      this.handlePlatformLanding(
        platform
      );
    } catch (error) {
      console.error(
        '[RunnerScene] Platform landing error:',
        error
      );
    }
  }
);

this.blaster = this.add
  .sprite(
    this.player.x + 22,
    this.player.y + 4,
    'blaster'
  )
  .setDepth(11);

this.cursors =
  this.input.keyboard.createCursorKeys();

this.keys =
  this.input.keyboard.addKeys(
    'A,D,C,F,W,S,E,Q,R,X,SPACE,SHIFT,ONE,TWO,THREE,FOUR,ESC'
  );

this.flightMode = false;
this.flightSpeed = 420;

/*
 * ============================================================
 * KEYBOARD INPUT FALLBACK
 * Browser-level state is the authoritative fallback for
 * gameplay keyboard controls.
 * ============================================================
 */
this.rawKeyboardState = Object.create(null);

this.rawKeyboardDownHandler = event => {
  const code = event?.code;

  if (
    code !== 'KeyW' &&
    code !== 'KeyA' &&
    code !== 'KeyS' &&
    code !== 'KeyD' &&
    code !== 'KeyE' &&
    code !== 'KeyF' &&
    code !== 'Space' &&
    code !== 'ShiftLeft' &&
    code !== 'ShiftRight'
  ) {
    return;
  }

  this.rawKeyboardState[code] = true;

  /*
   * W/A/S/D must be able to release the opening cinematic
   * immediately instead of waiting for the timeout.
   */
  if (
    this.cinematicActive &&
    (
      code === 'KeyW' ||
      code === 'KeyA' ||
      code === 'KeyS' ||
      code === 'KeyD'
    )
  ) {
    this.cinematicSkipHandler?.();
  }

  const tag =
    event.target?.tagName?.toUpperCase();

  /*
   * Prevent browser scrolling/default behaviour while
   * the game owns the keyboard.
   */
  if (
    this.scene.isActive() &&
    !this.finished &&
    !this.respawning &&
    !this.relayPuzzleActive &&
    tag !== 'INPUT' &&
    tag !== 'TEXTAREA' &&
    tag !== 'SELECT' &&
    tag !== 'BUTTON'
  ) {
    event.preventDefault();
  }
};

this.rawKeyboardUpHandler = event => {
  const code = event?.code;

  if (
    code === 'KeyW' ||
    code === 'KeyA' ||
    code === 'KeyS' ||
    code === 'KeyD' ||
    code === 'KeyE' ||
    code === 'KeyF' ||
    code === 'Space' ||
    code === 'ShiftLeft' ||
    code === 'ShiftRight'
  ) {
    this.rawKeyboardState[code] = false;
  }
};

this.rawKeyboardBlurHandler = () => {
  Object.keys(this.rawKeyboardState).forEach(
    code => {
      this.rawKeyboardState[code] = false;
    }
  );
};

window.addEventListener(
  'keydown',
  this.rawKeyboardDownHandler,
  true
);

window.addEventListener(
  'keyup',
  this.rawKeyboardUpHandler,
  true
);

window.addEventListener(
  'blur',
  this.rawKeyboardBlurHandler
);

this.mobileActions = {
  jump: false,
  jumpHeld: false,
  jumpReleased: false,
  fire: false,
  sword: false,
  dash: false,
  crouch: false,
  interact: false,
  build1: false,
  build2: false,
  gadget1: false,
  gadget2: false,
  polarity: false
};

this.mobileDirection = null;

this.mobileActionHandler = action => {
  const isPortrait =
    this.scale.height > this.scale.width;

  if (isPortrait) {
    return;
  }

  if (
    !action ||
    !this.scene.isActive() ||
    this.relayPuzzleActive ||
    this.finished ||
    this.respawning ||
    this.cinematicActive
  ) {
    return;
  }

  // ============================================================
  // AFK ACTIVITY · MOBILE INPUT
  // Any accepted mobile action immediately wakes the player.
  // ============================================================
  this.afkTimer = 0;

  if (
    this.afkStage !== 0
  ) {
    this.clearAfkState();
  }

  if (action === 'build1') {
    return this.useBuild(0);
  }

  if (action === 'build2') {
    return this.useBuild(1);
  }

  if (action === 'gadget1') {
    return this.useGadget(0);
  }

if (action === 'gadget2') {
  return this.useGadget(1);
}

if (action === 'polarity') {
  this.breakPolarity();
  return;
}

if (action === 'crouch') {
    this.mobileActions.crouch =
      !this.mobileActions.crouch;

    return;
  }

if (
  action === 'jump'
) {
  this.mobileActions.jump = true;
  this.mobileActions.jumpHeld = true;
  return;
}

if (
  action === 'jumpRelease'
) {
  this.mobileActions.jumpReleased = true;
  this.mobileActions.jumpHeld = false;
  return;
}

if (
  Object.prototype.hasOwnProperty.call(
    this.mobileActions,
    action
  )
) {
  this.mobileActions[action] = true;
}
};

// MOBILE INPUT V9 OWNS JOYSTICK MOVEMENT.
// Legacy mobile-move listener is intentionally disabled.

this.mobileMoveHandler = null;

this.events.once(
  Phaser.Scenes.Events.SHUTDOWN,
  () => {
    this.game.events.off(
      'mobile-action',
      this.mobileActionHandler
    );

    // ============================================================
    // AFK / CRYOSTASIS · SHUTDOWN CLEANUP
    // ============================================================
    if (this.afkFreezeFx) {
      Object.values(
        this.afkFreezeFx
      ).forEach(
        object => {
          if (!object) {
            return;
          }

          this.tweens.killTweensOf(
            object
          );

          if (object.active) {
            object.destroy();
          }
        }
      );
    }

   this.afkFreezeFx = null;

if (
  Array.isArray(
    this.afkIceParticles
  )
) {
  this.afkIceParticles.forEach(
    particle => {
      if (!particle) {
        return;
      }

      this.tweens.killTweensOf(
        particle
      );

      if (particle.active) {
        particle.destroy();
      }
    }
  );

  this.afkIceParticles = [];
}

this.afkTimer = 0;
this.afkStage = 0;

// Legacy mobile-move cleanup intentionally disabled.
// MOBILE INPUT V9 owns joystick movement.

    this.mobileDirection = null;

    Object.keys(this.mobileActions).forEach(
      action => {
        this.mobileActions[action] = false;
      }
    );
  }
);

if (this.cinematicActive) {
  this.createOpeningCinematic();
} else {
 this.createMissionTransmission();
this.createObjectiveHUD();
this.createDetectionHUD();
}

}

createRival() {
const rival =
rivalAppearances[this.mission.id];

if (!rival) return;

const sprite = this.add
  .sprite(
    this.mission.spawn.x + 80,
    this.mission.spawn.y - 64,
    'runner-run-a'
  )
  .setTint(0xb9f5ff)
  .setAlpha(.8)
  .setDepth(9);

// RIVAL FLOATING LABEL DISABLED

this.tweens.add({
  targets: sprite,
  x: this.mission.spawn.x + 500,
  alpha: .2,
  duration: 1800,
  onComplete: () => sprite.destroy()
});

// RIVAL RADIO FLOATING TEXT DISABLED

if (
  this.mission.id === 'signal-storm' ||
  this.mission.id === 'final-relay'
) {
  [135, 190].forEach(
    (offset, index) => {
      const echo = this.add
        .sprite(
          this.mission.spawn.x + offset,
          this.mission.spawn.y - 64,
          'runner-run-b'
        )
        .setTint(
          this.mission.id === 'final-relay'
            ? 0xffd06e
            : 0xb993ff
        )
        .setAlpha(
          .45 - index * .12
        )
        .setDepth(8);

      this.tweens.add({
        targets: echo,
        x: echo.x + 400,
        alpha: 0,
        duration: 2100 + index * 220,
        onComplete: () => echo.destroy()
      });
    }
  );
}

}

createSignals() {
this.signals = this.physics.add.group();

this.mission.signals.forEach(
  ([x, y], index) => {
    const signal = this.signals
      .create(
        x,
        y,
        'signal'
      )
      .setImmovable(true);

    signal.setData('id', index);

    signal.body
      .setAllowGravity(false)
      .setCircle(17, 11, 11);

    signal.setScale(.9);

    if (!this.motionReduced) {
      this.tweens.add({
        targets: signal,
        y: y - 9,
        scale: {
          from: .86,
          to: 1.02
        },
        duration: 720,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
    }
  }
);

this.physics.add.overlap(
  this.player,
  this.signals,
  (_, signal) =>
    this.collectSignal(signal),
  undefined,
  this
);

}

createSecrets() {
this.secrets =
this.physics.add.group();

this.mission.secrets.forEach(
  ([x, y], index) => {
    const secret = this.secrets
      .create(
        x,
        y,
        'signal'
      )
      .setImmovable(true)
      .setTint(0x8df4ff)
      .setScale(.72)
      .setData('id', index);

    secret.body
      .setAllowGravity(false)
      .setCircle(17, 11, 11);

    if (!this.motionReduced) {
      this.tweens.add({
        targets: secret,
        angle: 360,
        duration: 1800,
        repeat: -1
      });
    }
  }
);

this.physics.add.overlap(
  this.player,
  this.secrets,
  (_, secret) =>
    this.collectSecret(secret),
  undefined,
  this
);

}

// ============================================================
// UNKNOWN SIGNAL CACHE · SURPRISE SYSTEM
// ============================================================

loadSurpriseProgress() {
  if (
    typeof window === 'undefined' ||
    !window.localStorage
  ) {
    return;
  }

  try {
    const raw =
      window.localStorage.getItem(
        'runner_surprise_progress'
      );

    if (!raw) {
      return;
    }

    const saved =
      JSON.parse(raw);

    if (
      saved &&
      typeof saved === 'object'
    ) {
      if (
        Array.isArray(
          saved.collectedCacheIds
        )
      ) {
        this.surpriseCollectedCacheIds =
          new Set(
            saved.collectedCacheIds
              .filter(
                id =>
                  typeof id === 'string'
              )
          );
      }

      if (
        saved.inventory &&
        typeof saved.inventory === 'object'
      ) {
        for (
          const key of Object.keys(
            this.surpriseInventory
          )
        ) {
          const value =
            Number(
              saved.inventory[key]
            );

          this.surpriseInventory[key] =
            Number.isFinite(value)
              ? Math.max(
                  0,
                  Math.floor(value)
                )
              : 0;
        }
      }

      if (
        saved.pendingModifier &&
        typeof saved.pendingModifier ===
          'object'
      ) {
        this.surprisePendingModifier =
          saved.pendingModifier;
      }

      if (
        saved.consumedMissionRewards &&
        typeof saved.consumedMissionRewards ===
          'object'
      ) {
        this.surpriseConsumedMissionRewards =
          saved.consumedMissionRewards;
      }

      this.surpriseNegativeStreak =
        Number.isFinite(
          saved.negativeStreak
        )
          ? Math.max(
              0,
              Math.floor(
                saved.negativeStreak
              )
            )
          : 0;
    }
  } catch (error) {
    console.warn(
      '[SURPRISE] Failed to load progress:',
      error
    );
  }
}

saveSurpriseProgress() {
  if (
    typeof window === 'undefined' ||
    !window.localStorage
  ) {
    return;
  }

  try {
    window.localStorage.setItem(
      'runner_surprise_progress',
      JSON.stringify({
        collectedCacheIds:
          Array.from(
            this.surpriseCollectedCacheIds ||
              []
          ),

        inventory:
          this.surpriseInventory,

        pendingModifier:
          this.surprisePendingModifier,

        consumedMissionRewards:
          this.surpriseConsumedMissionRewards,

        negativeStreak:
          this.surpriseNegativeStreak
      })
    );
  } catch (error) {
    console.warn(
      '[SURPRISE] Failed to save progress:',
      error
    );
  }
}

prepareSurpriseMission() {
  const missionId =
    String(
      this.mission?.id ||
        'unknown-mission'
    );

  this.surpriseModifier = null;
  this.surpriseShieldCharges = 0;

  const consumed =
    Boolean(
      this.surpriseConsumedMissionRewards
        ?.[
          missionId
        ]
    );

  if (!consumed) {
    if (
      this.surpriseInventory
        .shieldCore > 0
    ) {
      this.surpriseShieldCharges = 1;
      this.surpriseInventory.shieldCore--;
    }

    if (
      this.surpriseInventory
        .overdriveCell > 0
    ) {
      this.overdriveTimer += 2500;
      this.surpriseInventory.overdriveCell--;
    }

    if (
      this.surpriseInventory
        .energyPack > 0
    ) {
    this.energy =
  Math.min(
    this.energyMax,
    this.energy + 25
  );

      this.surpriseInventory.energyPack--;
    }

    this.surpriseConsumedMissionRewards[
      missionId
    ] = true;
  }

  const pending =
    this.surprisePendingModifier;

if (
  pending &&
  (
    pending.targetMissionId === missionId ||
    (
      !pending.targetMissionId &&
      pending.sourceMissionId !== missionId
    )
  )
) {
    this.surpriseModifier = {
      ...pending
    };

    this.surprisePendingModifier =
      null;
  }

  this.saveSurpriseProgress();
}

createSurpriseCache() {
  const missionId =
    String(
      this.mission?.id ||
        'unknown-mission'
    );

  this.surpriseCacheId =
    `${missionId}-surprise-cache-01`;

  if (
    this.surpriseCollectedCacheIds?.has(
      this.surpriseCacheId
    )
  ) {
    return;
  }

  const platforms =
    Array.isArray(
      this.mission?.platforms
    )
      ? this.mission.platforms
      : [];

  const midpoint =
    (
      Number(
        this.mission?.spawn?.x
      ) || 0
    ) +
    (
      (
        Number(
          this.mission?.goal?.x
        ) ||
        (
          Number(
            this.mission?.spawn?.x
          ) || 0
        ) + 1200
      ) -
      (
        Number(
          this.mission?.spawn?.x
        ) || 0
      )
    ) / 2;

  let bestPlatform = null;
  let bestDistance = Infinity;

  platforms.forEach(
    data => {
      if (
        !Array.isArray(data) ||
        data.length < 4
      ) {
        return;
      }

      const x =
        Number(data[0]) || 0;

      const y =
        Number(data[1]) || 0;

      const width =
        Math.max(
          20,
          Number(data[2]) || 20
        );

      const collapsible =
        Boolean(data[5]);

      if (collapsible) {
        return;
      }

      const centerX =
        x + width / 2;

      const distance =
        Math.abs(
          centerX - midpoint
        );

      if (
        distance <
        bestDistance
      ) {
        bestDistance = distance;

        bestPlatform = {
          x: centerX,
          y,
          width
        };
      }
    }
  );

  const cacheX =
    bestPlatform?.x ??
    midpoint;

  const cacheY =
    bestPlatform
      ? bestPlatform.y - 46
      : (
          Number(
            this.mission?.spawn?.y
          ) || 420
        ) - 46;

  this.surpriseCache =
    this.add
      .sprite(
        cacheX,
        cacheY,
        'signal'
      )
      .setScale(.9)
      .setTint(0xb993ff)
      .setDepth(14);

  this.physics.add.existing(
    this.surpriseCache
  );

  this.surpriseCache.body
    ?.setAllowGravity(false);

  this.surpriseCache.body
    ?.setCircle(
      18,
      10,
      10
    );

  this.surpriseCache.setData(
    'cacheId',
    this.surpriseCacheId
  );

  this.surpriseCache.setData(
    'opened',
    false
  );

  if (!this.motionReduced) {
    this.tweens.add({
      targets:
        this.surpriseCache,

      angle: 360,

      scale: {
        from: .88,
        to: 1.02
      },

      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });
  }

  this.surpriseCachePrompt =
    this.add
      .container(
        cacheX,
        cacheY - 58
      )
      .setDepth(80)
      .setVisible(false);

  const promptBg =
    this.add
      .rectangle(
        0,
        0,
        156,
        34,
        0x071625,
        .96
      )
      .setStrokeStyle(
        1.5,
        0xb993ff,
        .92
      );

  const promptText =
    this.add.text(
      0,
      0,
      'R / TAP TO OPEN',
      {
        fontFamily:
          'DM Mono',
        fontSize: '11px',
        color: '#f1e6ff',
        stroke: '#08101c',
        strokeThickness: 3
      }
    )
      .setOrigin(.5);

  this.surpriseCachePrompt.add([
    promptBg,
    promptText
  ]);
}

updateSurpriseCacheInteraction() {
  const cache =
    this.surpriseCache;

  if (
    !cache ||
    !cache.active ||
    this.finished ||
    this.respawning ||
    this.surpriseCacheCollected ||
    this.surpriseCacheOpen
  ) {
    this.surpriseCachePrompt
      ?.setVisible(false);

    return;
  }

  if (
    !this.player?.active
  ) {
    return;
  }

  const distance =
    Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      cache.x,
      cache.y
    );

  const nearby =
    distance <= 120;

  this.surpriseCachePrompt
    ?.setVisible(
      nearby
    );

  if (!nearby) {
    return;
  }

  const keyboardPressed =
    Phaser.Input.Keyboard.JustDown(
      this.keys.R
    );

  const mobilePressed =
    this.mobileActions.interact;

  if (
    keyboardPressed ||
    mobilePressed
  ) {
    this.mobileActions.interact =
      false;

    this.tryOpenSurpriseCache();
  }
}

tryOpenSurpriseCache() {
  if (
    this.surpriseCacheInteractionLocked ||
    this.surpriseCacheCollected ||
    this.surpriseCacheOpen ||
    !this.surpriseCache?.active
  ) {
    return;
  }

  this.openSurpriseCache();
}

openSurpriseCache() {
  const cache =
    this.surpriseCache;

  if (
    !cache ||
    !cache.active ||
    this.surpriseCacheOpen
  ) {
    return;
  }

  const distance =
    Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      cache.x,
      cache.y
    );

  if (distance > 120) {
    return;
  }

  this.surpriseCacheOpen = true;
  this.surpriseCacheInteractionLocked =
    true;

  this.surpriseCacheSession++;

  const session =
    this.surpriseCacheSession;

  cache.setData(
    'opened',
    true
  );

  cache.disableBody(
    true,
    true
  );

  this.surpriseCachePrompt
    ?.setVisible(false);

  this.playerCue(
    'UNKNOWN SIGNAL · DECRYPTING',
    '#b993ff'
  );

 if (!this.motionReduced) {
  const burst =
    this.add
      .circle(
        cache.x,
        cache.y,
        12,
        0xb993ff,
        .28
      )
      .setDepth(16)
      .setStrokeStyle(
        2,
        0xe0a7ff,
        .95
      );

  const burstWide =
    this.add
      .circle(
        cache.x,
        cache.y,
        24,
        0xb993ff,
        .05
      )
      .setDepth(15)
      .setStrokeStyle(
        1,
        0xe0a7ff,
        .75
      );

  const core =
    this.add
      .circle(
        cache.x,
        cache.y,
        6,
        0xffffff,
        .95
      )
      .setDepth(17);

  this.tweens.add({
    targets:
      burst,
    scale:
      5.2,
    alpha:
      0,
    duration:
      620,
    ease:
      'Quad.out',
    onComplete:
      () => {
        if (
          burst?.active
        ) {
          burst.destroy();
        }
      }
  });

  this.tweens.add({
    targets:
      burstWide,
    scale:
      4.2,
    alpha:
      0,
    duration:
      780,
    ease:
      'Cubic.out',
    onComplete:
      () => {
        if (
          burstWide?.active
        ) {
          burstWide.destroy();
        }
      }
  });

  this.tweens.add({
    targets:
      core,
    scale:
      3.8,
    alpha:
      0,
    duration:
      260,
    ease:
      'Quad.out',
    onComplete:
      () => {
        if (
          core?.active
        ) {
          core.destroy();
        }
      }
  });

  this.cameras.main.flash(
    90,
    185,
    147,
    255,
    false
  );

  this.worldLightFlash(
    0xb993ff,
    .10,
    180
  );

  this.gadgetPulse(
    0xb993ff,
    18,
    360
  );

  this.shake(
    65,
    .003
  );
}

this.time.delayedCall(
  650,
    () => {
      if (
        this.surpriseCacheSession !==
        session
      ) {
        return;
      }

      this.resolveSurpriseCache();
    }
  );
}

resolveSurpriseCache() {
  if (
    this.surpriseCacheResolved
  ) {
    return;
  }

  this.surpriseCacheResolved =
    true;

  this.surpriseCacheCollected =
    true;

  this.surpriseCollectedCacheIds.add(
    this.surpriseCacheId
  );

  let roll =
    Math.random();

  if (
    this.surpriseNegativeStreak >= 2
  ) {
    roll = .05;
  }

  let outcomeType;

  if (roll < .55) {
    outcomeType = 'positive';
  } else if (roll < .75) {
    outcomeType = 'neutral';
  } else {
    outcomeType = 'negative';
  }

  const positivePool = [
    'shieldCore',
    'overdriveCell',
    'energyPack'
  ];

  const neutralPool = [
    'credits'
  ];

  const negativePool = [
    'corruptedCore',
    'energyDrain'
  ];

  const pool =
    outcomeType === 'positive'
      ? positivePool
      : outcomeType === 'neutral'
        ? neutralPool
        : negativePool;

  const rewardId =
    pool[
      Phaser.Math.Between(
        0,
        pool.length - 1
      )
    ];

  if (
    outcomeType === 'negative'
  ) {
    this.surpriseNegativeStreak++;
  } else {
    this.surpriseNegativeStreak = 0;
  }

  if (rewardId === 'shieldCore') {
    this.surpriseInventory.shieldCore++;
  }

  if (rewardId === 'overdriveCell') {
    this.surpriseInventory.overdriveCell++;
  }

  if (rewardId === 'energyPack') {
    this.surpriseInventory.energyPack++;
  }

  if (rewardId === 'credits') {
    this.surpriseInventory.credits += 100;
  }

if (rewardId === 'corruptedCore') {
  this.surprisePendingModifier = {
    id: 'corruptedCore',

    sourceMissionId:
      String(
        this.mission?.id ||
        'unknown-mission'
      ),

    targetMissionId:
      String(
        this.mission?.nextMissionId ||
        ''
      ) || null,

    movementMultiplier: .92
  };
}

  if (rewardId === 'energyDrain') {
    this.energy =
      Math.max(
        0,
        this.energy - 30
      );
  }

/*
 * If the mission does not expose nextMissionId,
 * null means "apply to the next mission".
 */
if (
  rewardId === 'corruptedCore'
) {
  this.playerCue(
    'CORRUPTED CACHE',
    '#ff826e'
  );
}

  this.saveSurpriseProgress();

  this.showSurpriseOutcome(
    outcomeType,
    rewardId
  );
}

showSurpriseOutcome(
  outcomeType,
  rewardId
) {
  const labels = {
    shieldCore:
      'SHIELD CORE',
    overdriveCell:
      'OVERDRIVE CELL',
    energyPack:
      'ENERGY PACK',
    credits:
      '100 CREDITS',
    corruptedCore:
      'CORRUPTED CORE',
    energyDrain:
      'ENERGY DRAIN'
  };

  const descriptions = {
    shieldCore:
      'ONE FREE DAMAGE HIT',
    overdriveCell:
      '+2500 OVERDRIVE AT NEXT MISSION START',
    energyPack:
      '+25 ENERGY AT NEXT MISSION START',
    credits:
      'STORED IN PROFILE',
    corruptedCore:
      'NEXT MISSION · -8% MOVE SPEED',
    energyDrain:
      '-30 ENERGY NOW'
  };

  const title =
    outcomeType === 'positive'
      ? 'REWARD ACQUIRED'
      : outcomeType === 'neutral'
        ? 'DATA RECOVERED'
        : 'SYSTEM COMPROMISED';

  const color =
    outcomeType === 'positive'
      ? 0x8df4ff
      : outcomeType === 'neutral'
        ? 0xffd06e
        : 0xff5364;

  const colorHex =
    `#${color.toString(16).padStart(6, '0')}`;

  const camera =
    this.cameras.main;

  const centerX =
    camera.width / 2;

  const centerY =
    camera.height / 2;

  /* ============================================================
   * SURPRISE CACHE · CINEMATIC REVEAL
   * ============================================================ */

if (
  !this.motionReduced &&
  this.graphicsLevel >= 2
) {
  camera.flash(
    120,
    255,
    255,
    255,
    false
  );

  this.worldLightFlash(
    color,
    0.12,
    220
  );

  this.shake(
    outcomeType === 'negative'
      ? 150
      : 95,
    outcomeType === 'negative'
      ? 0.008
      : 0.004
  );

  this.gadgetPulse(
    color,
    outcomeType === 'positive'
      ? 20
      : 15,
    outcomeType === 'negative'
      ? 520
      : 420
  );
}

  const cinematic =
    this.add
      .container(
        centerX,
        centerY
      )
      .setScrollFactor(0)
      .setDepth(250);

  /* FULL SCREEN DIM */

  const dim =
    this.add
      .rectangle(
        0,
        0,
        camera.width + 80,
        camera.height + 80,
        0x02060b,
        .72
      );

  cinematic.add(
    dim
  );

  /* OUTER TECH FRAME */

  const frame =
    this.add
      .rectangle(
        0,
        0,
        360,
        200,
        0x06111d,
        .98
      )
      .setStrokeStyle(
        2,
        color,
        .98
      );

  cinematic.add(
    frame
  );

  /* INNER FRAME */

  const innerFrame =
    this.add
      .rectangle(
        0,
        0,
        336,
        176,
        0x000000,
        0
      )
      .setStrokeStyle(
        1,
        color,
        .42
      );

  cinematic.add(
    innerFrame
  );

  /* TOP STATUS BAR */

  const topBar =
    this.add
      .rectangle(
        0,
        -83,
        320,
        2,
        color,
        .72
      );

  cinematic.add(
    topBar
  );

  const titleText =
    this.add.text(
      0,
      -61,
      title,
      {
        fontFamily:
          'DM Mono',
        fontSize:
          '15px',
        fontStyle:
          'bold',
        color:
          '#ffffff',
        stroke:
          '#000000',
        strokeThickness:
          4,
        align:
          'center'
      }
    )
      .setOrigin(.5);

  cinematic.add(
    titleText
  );

  /* UNKNOWN SIGNAL */

  const signalText =
    this.add.text(
      0,
      -34,
      'UNKNOWN SIGNAL',
      {
        fontFamily:
          'DM Mono',
        fontSize:
          '9px',
        letterSpacing:
          2,
        color:
          colorHex,
        stroke:
          '#000000',
        strokeThickness:
          3
      }
    )
      .setOrigin(.5);

  cinematic.add(
    signalText
  );

  /* CENTRAL CORE */

  const coreOuter =
    this.add
      .circle(
        0,
        8,
        28,
        color,
        .08
      )
      .setStrokeStyle(
        2,
        color,
        .68
      );

  const coreMid =
    this.add
      .circle(
        0,
        8,
        19,
        color,
        .14
      )
      .setStrokeStyle(
        1,
        color,
        .82
      );

  const core =
    this.add
      .circle(
        0,
        8,
        9,
        color,
        .92
      )
      .setStrokeStyle(
        2,
        0xffffff,
        .9
      );

  const coreHot =
    this.add
      .circle(
        -2,
        6,
        3,
        0xffffff,
        .96
      );

  cinematic.add([
    coreOuter,
    coreMid,
    core,
    coreHot
  ]);

  /* REWARD TEXT */

  const rewardText =
    this.add.text(
      0,
      54,
      labels[rewardId] ||
        rewardId.toUpperCase(),
      {
        fontFamily:
          'DM Mono',
        fontSize:
          rewardId === 'credits'
            ? '18px'
            : '21px',
        fontStyle:
          'bold',
        color:
          colorHex,
        stroke:
          '#000000',
        strokeThickness:
          5,
        align:
          'center',
        wordWrap: {
          width:
            300
        }
      }
    )
      .setOrigin(.5);

  cinematic.add(
    rewardText
  );

  /* DESCRIPTION */

  const descriptionText =
    this.add.text(
      0,
      79,
      descriptions[rewardId] ||
        '',
      {
        fontFamily:
          'DM Mono',
        fontSize:
          '9px',
        color:
          '#dffcff',
        stroke:
          '#000000',
        strokeThickness:
          3,
        align:
          'center',
        wordWrap: {
          width:
            290
        }
      }
    )
      .setOrigin(.5);

  cinematic.add(
    descriptionText
  );

  /* SIDE BRACKETS */

  const leftBracket =
    this.add
      .rectangle(
        -173,
        0,
        3,
        90,
        color,
        .9
      );

  const rightBracket =
    this.add
      .rectangle(
        173,
        0,
        3,
        90,
        color,
        .9
      );

  cinematic.add([
    leftBracket,
    rightBracket
  ]);

  /* SCAN LINES */

  const scanLines = [];

  for (
    let index = 0;
    index < 5;
    index++
  ) {
    const line =
      this.add
        .rectangle(
          0,
          -64 + index * 32,
          300,
          1,
          color,
          .18
        );

    scanLines.push(
      line
    );

    cinematic.add(
      line
    );
  }

  /* CORNER NODES */

  const nodes = [];

  [
    [-158, -82],
    [158, -82],
    [-158, 82],
    [158, 82]
  ].forEach(
    ([x, y]) => {
      const node =
        this.add
          .circle(
            x,
            y,
            3,
            color,
            .95
          );

      nodes.push(
        node
      );

      cinematic.add(
        node
      );
    }
  );

  /* GLITCH BLOCKS */

  const glitchBlocks = [];

  for (
    let index = 0;
    index < 8;
    index++
  ) {
    const block =
      this.add
        .rectangle(
          Phaser.Math.Between(
            -145,
            145
          ),
          Phaser.Math.Between(
            -72,
            72
          ),
          Phaser.Math.Between(
            8,
            34
          ),
          Phaser.Math.Between(
            2,
            5
          ),
          color,
          .18
        );

    glitchBlocks.push(
      block
    );

    cinematic.add(
      block
    );
  }

  /* ============================================================
   * ENTRY
   * ============================================================ */

  cinematic.setScale(
    this.motionReduced
      ? 1
      : .72
  );

  cinematic.setAlpha(
    this.motionReduced
      ? 1
      : 0
  );

  if (!this.motionReduced) {
    this.tweens.add({
      targets:
        cinematic,
      alpha:
        1,
      scale:
        1,
      duration:
        260,
      ease:
        'Back.out'
    });

    this.tweens.add({
      targets:
        coreOuter,
      scale:
        1.45,
      alpha:
        .05,
      duration:
        520,
      yoyo:
        true,
      repeat:
        2,
      ease:
        'Sine.inOut'
    });

    this.tweens.add({
      targets:
        coreMid,
      scale:
        1.3,
      alpha:
        .06,
      duration:
        420,
      yoyo:
        true,
      repeat:
        3,
      ease:
        'Sine.inOut'
    });

    this.tweens.add({
      targets:
        core,
      scale:
        1.35,
      duration:
        260,
      yoyo:
        true,
      repeat:
        3,
      ease:
        'Sine.inOut'
    });

    scanLines.forEach(
      (line, index) => {
        this.tweens.add({
          targets:
            line,
          x:
            index % 2
              ? 12
              : -12,
          alpha:
            .52,
          duration:
            180 + index * 50,
          yoyo:
            true,
          repeat:
            4,
          ease:
            'Sine.inOut'
        });
      }
    );

    glitchBlocks.forEach(
      block => {
        this.tweens.add({
          targets:
            block,
          alpha:
            .55,
          x:
            block.x +
            Phaser.Math.Between(
              -8,
              8
            ),
          duration:
            Phaser.Math.Between(
              70,
              150
            ),
          yoyo:
            true,
          repeat:
            3
        });
      }
    );

    this.tweens.add({
      targets:
        rewardText,
      scale:
        1.08,
      duration:
        190,
      delay:
        120,
      yoyo:
        true,
      ease:
        'Quad.out'
    });
  }

  /* ============================================================
   * CLEANUP
   * ============================================================ */

  const lifetime =
    this.motionReduced
      ? 2200
      : 3200;

  this.time.delayedCall(
    lifetime,
    () => {
      if (!cinematic?.active) {
        return;
      }

      if (
        !this.motionReduced
      ) {
        this.tweens.add({
          targets:
            cinematic,
          alpha:
            0,
          scale:
            .94,
          duration:
            360,
          ease:
            'Quad.in',
          onComplete:
            () => {
              if (
                cinematic?.active
              ) {
                cinematic.destroy(
                  true
                );
              }
            }
        });

        return;
      }

      cinematic.destroy(
        true
      );
    }
  );
}

createCheckpoints() {
this.checkpoints =
this.physics.add.staticGroup();

this.mission.checkpoints.forEach(
  ([x, y], index) => {
    const checkpoint =
      this.checkpoints.create(
        x,
        y,
        'checkpoint'
      )
        .setOrigin(.5, 1)
        .setData('index', index);

    checkpoint.refreshBody();
  }
);

this.physics.add.overlap(
  this.player,
  this.checkpoints,
  (_, checkpoint) =>
    this.activateCheckpoint(checkpoint),
  undefined,
  this
);

}

safeCheckpointSpawn(x) {
const platforms =
this.mission.platforms.map(
([platformX, platformY, width, height]) => ({
x: platformX,
y: platformY,
width,
height
})
);

  if (!platforms.length) {
  return {
    x,
    y:
      this.mission.spawn?.y ??
      0
  };
}

const containing =
  platforms
    .filter(
      platform =>
        x >= platform.x + 26 &&
        x <=
          platform.x +
          platform.width -
          26
    )
    .sort(
      (left, right) =>
        left.y - right.y
    )[0];

const platform =
  containing ||
  platforms.reduce(
    (
      nearest,
      candidate
    ) =>
      Math.abs(
        candidate.x +
        candidate.width / 2 -
        x
      ) <
      Math.abs(
        nearest.x +
        nearest.width / 2 -
        x
      )
        ? candidate
        : nearest,
    platforms[0]
  );

const safeMargin =
  Math.min(
    30,
    Math.max(
      0,
      (platform.width - 1) / 2
    )
  );

return {
  x: Phaser.Math.Clamp(
    x,
    platform.x + safeMargin,
    platform.x +
      platform.width -
      safeMargin
  ),
  y: platform.y - 46
};

}

updateCheckpointArrow() {
  if (
    this.finished ||
    this.respawning ||
    this.cinematicActive ||
    !this.player?.active ||
    !this.checkpoints
  ) {
    this.checkpointArrow?.setVisible(false);
    return;
  }

  const currentIndex =
    this.checkpoint?.index ?? -1;

let target = null;

/*
 * EMERGENCY ROUTE
 * A collapsing platform gets priority over
 * the normal checkpoint route.
 */
if (
  this.platformEmergencyTarget?.active &&
  this.platformEmergencyTarget.body?.enable !== false
) {
  target =
    this.platformEmergencyTarget;
}

if (!target) {
  const checkpoints =
    this.checkpoints
      .getChildren()
      .filter(
        marker =>
          marker?.active &&
          (marker.getData('index') ?? -1) >
            currentIndex
      )
      .sort(
        (a, b) =>
          (a.getData('index') ?? 0) -
          (b.getData('index') ?? 0)
      );

  if (checkpoints.length) {
    target =
      checkpoints[0];
  } else if (this.goal) {
    target =
      this.goal;
  }
}

  if (!target) {
    this.checkpointArrow?.setVisible(false);
    return;
  }

  if (!this.checkpointArrow) {
    this.checkpointArrow =
      this.add
        .triangle(
          0,
          0,
          0,
          -16,
          11,
          10,
          -11,
          10,
          0x8df4ff,
          0.95
        )
        .setOrigin(0.5)
        .setDepth(50)
        .setScrollFactor(0);

     this.checkpointArrow.setStrokeStyle(
      1.5,
      0xe8fdff,
      0.95
    );

    this.checkpointArrow.setBlendMode(
      Phaser.BlendModes.ADD
    );

    this.tweens.add({
      targets: this.checkpointArrow,
      scaleX: {
        from: 0.94,
        to: 1.06
      },
      scaleY: {
        from: 0.94,
        to: 1.06
      },
      alpha: {
        from: 0.82,
        to: 1
      },
      duration: 620,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });
  }

  const camera =
    this.cameras.main;

  const dx =
    target.x -
    this.player.x;

  const dy =
    target.y -
    this.player.y;

  const distance =
    Math.hypot(dx, dy);

  if (!Number.isFinite(distance) || distance < 1) {
    this.checkpointArrow.setVisible(false);
    return;
  }

   const dirX =
    dx / distance;

  const dirY =
    dy / distance;

  const targetAngle =
    Math.atan2(
      dirY,
      dirX
    ) +
    Math.PI / 2;

  const currentAngle =
    Number.isFinite(
      this.checkpointArrow.angle
    )
      ? this.checkpointArrow.angle
      : targetAngle;

  const angleDelta =
    Phaser.Math.Angle.Wrap(
      targetAngle -
      currentAngle
    );

  const smoothAngle =
    currentAngle +
    angleDelta * 0.20;

  const playerScreenX =
    (this.player.x - camera.worldView.x) *
    camera.zoom;

  const playerScreenY =
    (this.player.y - camera.worldView.y) *
    camera.zoom;

  const nearCheckpoint =
    distance < 165;

  const offset =
    nearCheckpoint
      ? 46
      : 54;

  let arrowX =
    playerScreenX +
    dirX * offset;

  let arrowY =
    playerScreenY +
    dirY * offset;

  const margin = 30;

  arrowX =
    Phaser.Math.Clamp(
      arrowX,
      margin,
      this.scale.width - margin
    );

  arrowY =
    Phaser.Math.Clamp(
      arrowY,
      margin,
      this.scale.height - margin
    );

  this.checkpointArrow
    .setPosition(
      Phaser.Math.Linear(
        this.checkpointArrow.x,
        arrowX,
        0.24
      ),
      Phaser.Math.Linear(
        this.checkpointArrow.y,
        arrowY,
        0.24
      )
    )
    .setRotation(
      smoothAngle
    )
    .setVisible(true);
}

updateRouteHints() {
this.checkpoints?.getChildren().forEach(
marker => {
const index =
marker.getData('index');

    if (
      !this.checkpointHints.has(index) &&
      Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        marker.x,
        marker.y
      ) < 165
    ) {
      this.checkpointHints.add(index);

      const pulse = this.add
        .circle(
          marker.x,
          marker.y - 20,
          10,
          0x8df4ff,
          .35
        )
        .setDepth(6);

      /*
 * ============================================================
 * CHECKPOINT BEACON FX
 * ============================================================
 */
if (!this.motionReduced) {
  const beaconRing =
    this.add
      .circle(
        marker.x,
        marker.y - 20,
        18,
        0x8df4ff,
        .08
      )
      .setDepth(5);

  beaconRing.setStrokeStyle(
    2,
    0xb9f5ff,
    .78
  );

  this.tweens.add({
    targets: beaconRing,
    scale: 3.8,
    alpha: 0,
    duration: 620,
    ease: 'Quad.out',
    onComplete: () =>
      beaconRing.destroy()
  });

  const beaconBeam =
    this.add
      .rectangle(
        marker.x,
        marker.y - 54,
        4,
        62,
        0x8df4ff,
        .16
      )
      .setDepth(5);

  this.tweens.add({
    targets: beaconBeam,
    scaleX: 2.4,
    alpha: 0,
    duration: 480,
    ease: 'Sine.out',
    onComplete: () =>
      beaconBeam.destroy()
  });
}

      this.tweens.add({
        targets: pulse,
        scale: 3,
        alpha: 0,
        duration: 420,
        onComplete: () =>
          pulse.destroy()
      });

    this.playerCue(
  'CHECKPOINT // NEAR',
  '#b9f5ff'
);

this.game.events.emit(
  'feedback',
  'checkpoint_near'
);
    }
  }
);

if (
  !this.goalHintShown &&
  this.player.x >=
    this.goal.x - 520
) {
  this.goalHintShown = true;

  const pulse = this.add
    .circle(
      this.goal.x + 20,
      this.goal.y + 22,
      18,
      0xffd06e,
      .3
    )
    .setDepth(11);

  this.tweens.add({
    targets: pulse,
    scale: 4,
    alpha: 0,
    duration: 550,
    onComplete: () =>
      pulse.destroy()
  });

  this.playerCue(
    'DELIVERY BEACON NEAR',
    '#ffd06e'
  );
  this.gadgetPulse(
  0xffd06e,
  10,
  320
);
}

}

createHazards() {
this.barriers =
this.physics.add.staticGroup();

this.mission.obstacles.forEach(
  ([x, y]) => {
    const barrier =
      this.barriers.create(
        x + 24,
        y + 32,
        'barrier'
      );
     }
);
 
this.physics.add.overlap(
this.player,
this.barriers,
(player, barrier) => {
if (!player?.active || !barrier?.active) return;
if (this.respawning || this.finished) return;

// One barrier contact = one gameplay decision.
if (barrier.__relayBarrierContactLock) return;

barrier.__relayBarrierContactLock = true;

const vaulted = this.tryVault();

if (!vaulted) {
  this.fail(
    'A live barrier cut the delivery short.'
  );
}

// Allow future contact after the current interaction has settled.
this.time.delayedCall(
  220,
  () => {
    if (barrier?.active) {
      barrier.__relayBarrierContactLock = false;
    }
  }
);

},
undefined,
this
);
}
triggerPlayerWaterRipple(player, water, intensity = 1) {
  const graphicsLevel =
    Number.isFinite(this.graphicsLevel)
      ? this.graphicsLevel
      : 2;

  if (
    this.motionReduced ||
    graphicsLevel < 2 ||
    !player?.active ||
    !water?.active ||
    this.finished ||
    this.respawning
  ) {
    return;
  }

  if (!this.waterWaveObjects) {
    this.waterWaveObjects = [];
  }

  const surfaceY =
    water.y - water.height / 2;

  const speed =
    Math.abs(
      player.body?.velocity?.x || 0
    );

  const speedRatio =
    Phaser.Math.Clamp(
      speed /
        RUNNER_TUNING.maxRunSpeed,
      0,
      1
    );

  const strength =
    Phaser.Math.Clamp(
      intensity *
        (0.45 + speedRatio * 0.55),
      0.35,
      1.25
    );

  const halfWidth =
    water.width / 2;

  const rippleX =
    Phaser.Math.Clamp(
      player.x,
      water.x - halfWidth + 12,
      water.x + halfWidth - 12
    );

  const ring =
    this.add
      .ellipse(
        rippleX,
        surfaceY + 2,
        30 + 26 * strength,
        5 + 3 * strength,
        0xe8fdff,
        0.34
      )
      .setDepth(9)
      .setAlpha(
        0.28 + 0.16 * strength
      );

  const foam =
    this.add
      .ellipse(
        rippleX,
        surfaceY,
        18 + 24 * strength,
        4 + 2 * strength,
        0x8df4ff,
        0.24
      )
      .setDepth(9)
      .setAlpha(
        0.22 + 0.14 * strength
      );

this.waterWaveObjects.push(
  ring,
  foam
);

this.tweens.add({
  targets: ring,
  scaleX:
    2.1 + strength * 1.4,
  scaleY:
    1.5 + strength * 0.5,
  alpha: 0,
  duration:
    260 + strength * 100,
  ease: 'Quad.out'
});

this.tweens.add({
  targets: foam,
  scaleX:
    2.4 + strength * 1.2,
  alpha: 0,
  duration:
    220 + strength * 90,
  ease: 'Sine.out',
  onComplete: () => {
    if (ring.active) {
      ring.destroy();
    }

    if (foam.active) {
      foam.destroy();
    }

    if (this.waterWaveObjects) {
      this.waterWaveObjects =
        this.waterWaveObjects.filter(
          object =>
            object?.active
        );
    }
  }
});
}

createWaterHazards() {
    this.waterZones = this.physics.add.staticGroup();

    this.mission.waterZones.forEach(
      ([x, y, width, height], index) => {
        const water =
          this.add
            .rectangle(
              x + width / 2,
              y + height / 2,
              width,
              height,
              0x087ea4,
              0.72
            )
            .setStrokeStyle(
              2,
              0x58e7ff,
              0.72
            )
            .setDepth(2);

        this.physics.add.existing(water, true);

        water.setData('index', index);
        water.setData('used', false);
        this.waterZones.add(water);

        // Water surface
        const surface =
          this.add
            .rectangle(
              x + width / 2,
              y,
              width,
              4,
              0x9df7ff,
              0.82
            )
            .setDepth(6);

        if (!this.motionReduced) {
          this.tweens.add({
            targets: surface,
            scaleX: 1.03,
            alpha: 0.55,
            duration: 620,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
          });
        }

        // Surface waves
        if (!this.motionReduced) {
          for (
            let waveX = x + 18;
            waveX < x + width - 18;
            waveX += 44
          ) {
            const wave =
              this.add
                .rectangle(
                  waveX,
                  y + 8,
                  20,
                  2,
                  0xb9f5ff,
                  0.28
                )
                .setDepth(6);

            this.tweens.add({
              targets: wave,
              x: wave.x + 18,
              alpha: 0,
              duration: 700,
              delay: index * 90,
              repeat: -1,
              ease: 'Sine.out',
              onRepeat: () => {
                if (wave.active) {
                  wave.x = waveX;
                  wave.alpha = 0.28;
                }
              }
            });
          }
        }
      }
    );

    this.physics.add.overlap(
      this.player,
      this.waterZones,
      (player, water) => {
        if (
          !player?.active ||
          !water?.active
        ) {
          return;
        }

     if (
  this.finished ||
  this.respawning ||
  this.waterAttackActive ||
  water.getData('used')
) {
  return;
}

this.triggerPlayerWaterRipple(
  player,
  water,
  1
);

   water.setData('used', true);
this.waterAttackActive = true;
this.waterDeathTimer = 1120;

const attackToken =
  ++this.waterAttackToken;

const surfaceY =
          water.y - water.height / 2;

        const originX = player.x;

    const playerBody =
  player?.body;

if (!playerBody) {
  this.waterAttackActive = false;
  return;
}

playerBody.setVelocityY(
  Math.min(
    playerBody.velocity.y,
    140
  )
);

playerBody.setVelocityX(
  playerBody.velocity.x * 0.22
);

        this.playerCue(
          'SHARK INCOMING',
          '#b9f5ff'
        );

        this.game.events.emit(
          'feedback',
          'water_hazard'
        );

        // ------------------------------------------------------------
        // SHARK 2.0 · TELEGRAPH
        // ------------------------------------------------------------

        const warning =
          this.add
            .text(
              originX,
              surfaceY - 52,
              '⚠ SHARK INCOMING',
              {
                fontFamily: 'DM Mono',
                fontSize: '11px',
                color: '#b9f5ff',
                stroke: '#06131f',
                strokeThickness: 4,
                fontStyle: 'bold',
                align: 'center'
              }
            )
            .setOrigin(0.5)
            .setDepth(14);

        const fin =
          this.add
            .triangle(
              originX + 96,
              surfaceY + 8,
              0,
              24,
              18,
              0,
              36,
              24,
              0x18374b,
              0.95
            )
            .setDepth(10)
            .setAlpha(0);

        const eyeLeft =
          this.add
            .circle(
              originX + 86,
              surfaceY + 20,
              2,
              0xffd06e,
              0
            )
            .setDepth(10);

        const eyeRight =
          this.add
            .circle(
              originX + 96,
              surfaceY + 20,
              2,
              0xffd06e,
              0
            )
            .setDepth(10);

        const wake =
          this.add
            .ellipse(
              originX + 96,
              surfaceY + 5,
              74,
              12,
              0xb9f5ff,
              0.16
            )
            .setDepth(7)
            .setAlpha(0);

   const splash =
  this.add
    .circle(
      originX,
      surfaceY,
      10,
      0xb9f5ff,
      0.55
    )
    .setDepth(12);

const splashWide =
  this.add
    .ellipse(
      originX,
      surfaceY + 2,
      34,
      8,
      0x58e7ff,
      0.34
    )
    .setDepth(11)
    .setScale(0.55);

const splashTrail =
  this.add
    .ellipse(
      originX - (player.flipX ? -1 : 1) * 24,
      surfaceY + 6,
      54,
      7,
      0xb9f5ff,
      0.24
    )
    .setDepth(9)
    .setAlpha(0);

this.tweens.add({
  targets: splash,
  scale: 4.6,
  alpha: 0,
  duration: 420,
  ease: 'Cubic.out',
  onComplete: () => {
    if (splash.active) {
      splash.destroy();
    }
  }
});

this.tweens.add({
  targets: splashWide,
  scaleX: 2.8,
  scaleY: 1.45,
  alpha: 0,
  duration: 460,
  ease: 'Sine.out',
  onComplete: () => {
    if (splashWide.active) {
      splashWide.destroy();
    }
  }
});

this.tweens.add({
  targets: splashTrail,
  alpha: {
    from: 0,
    to: 0.5
  },
  scaleX: 1.8,
  scaleY: 1.15,
 x:
  splashTrail.x -
  (player.flipX ? -1 : 1) * 42,
  duration: 260,
  ease: 'Quad.out',
  onComplete: () => {
    if (splashTrail.active) {
      splashTrail.destroy();
    }
  }
});

        if (this.motionReduced) {
          warning.destroy();
          fin.destroy();
          eyeLeft.destroy();
          eyeRight.destroy();
          wake.destroy();
        } else {
          this.tweens.add({
            targets: warning,
            alpha: {
              from: 1,
              to: 0.22
            },
            yoyo: true,
            repeat: 2,
            duration: 120,
            ease: 'Sine.inOut',
            onComplete: () => {
              if (warning.active) {
                warning.destroy();
              }
            }
          });

          this.tweens.add({
            targets: fin,
            alpha: {
              from: 0,
              to: 0.95
            },
            x: originX + 72,
            y: surfaceY + 4,
            duration: 250,
            ease: 'Quad.out'
          });

          this.tweens.add({
            targets: [eyeLeft, eyeRight],
            alpha: {
              from: 0,
              to: 0.95
            },
            duration: 180,
            delay: 90
          });

      this.tweens.add({
  targets: wake,
  alpha: {
    from: 0,
    to:
      this.mission.id === 'signal-storm'
        ? 0.62
        : 0.46
  },
  scaleX:
    this.mission.id === 'signal-storm'
      ? 1.75
      : 1.45,
  scaleY:
    this.mission.id === 'signal-storm'
      ? 1.18
      : 1,
  x:
    wake.x -
    (player.flipX ? -1 : 1) *
    (
      this.mission.id === 'signal-storm'
        ? 54
        : 38
    ),
  duration:
    this.mission.id === 'signal-storm'
      ? 320
      : 270,
  ease: 'Cubic.out'
});
        }

     const beginAttack = () => {
  if (
    !this.scene.isActive() ||
    !player.active ||
    !water.active ||
    this.finished ||
    this.respawning ||
    !this.waterAttackActive ||
    this.waterAttackToken !== attackToken
  ) {
    return;
  }

          this.activeShark?.destroy();
          this.activeShark = null;

          fin.destroy();
          eyeLeft.destroy();
          eyeRight.destroy();
          wake.destroy();

const side =
  player.flipX ? -1 : 1;

const attackVariant =
  index % 2;

const approachDistance =
  attackVariant === 0 ? 82 : 118;

const revealDistance =
  attackVariant === 0 ? 126 : 164;

const approachX =
  originX + side * approachDistance;

const attackX =
  originX;

const revealX =
  originX + side * revealDistance;

const shark =
  this.add
    .image(
      revealX + side * 70,
      surfaceY + 34,
      'shark'
    )
    .setDepth(11)
    .setAlpha(0)
    .setScale(0.76);

this.activeShark = shark;

          const burst =
            this.add
              .ellipse(
                revealX,
                surfaceY,
                58,
                10,
                0xb9f5ff,
                0.18
              )
              .setDepth(8)
              .setAlpha(0);

          const biteRing =
            this.add
              .circle(
                attackX,
                surfaceY - 2,
                12,
                0x58e7ff,
                0.18
              )
              .setDepth(12)
              .setAlpha(0);

    const finishShark = () => {
  if (
    !this.scene?.isActive?.() ||
    !shark.active
  ) {
    return;
  }

  const tokenMatches =
    this.waterAttackToken ===
    attackToken;

  if (tokenMatches) {
    this.waterAttackToken++;
  }

  this.tweens.killTweensOf([
    shark,
    burst,
    biteRing,
    warning,
    fin,
    eyeLeft,
    eyeRight,
    wake,
    splash,
    splashWide,
    splashTrail
  ]);

  [
    shark,
    burst,
    biteRing,
    warning,
    fin,
    eyeLeft,
    eyeRight,
    wake,
    splash,
    splashWide,
    splashTrail
  ].forEach(object => {
    if (object?.active) {
      object.destroy();
    }
  });

  if (this.activeShark === shark) {
    this.activeShark = null;
  }

  if (!tokenMatches) {
    return;
  }

  this.waterAttackActive = false;
  this.waterDeathTimer = 0;

  this.fail(
    'A shark took you under.'
  );
};
          if (this.motionReduced) {
            shark.setAlpha(1);
            finishShark();
            return;
          }

         this.tweens.add({
  targets: shark,
  alpha: 1,
  x: revealX,
  y: surfaceY + 16,
  duration: 240,
  ease: 'Sine.out'
});

this.time.delayedCall(
  260,
  () => {
   if (
  !shark.active ||
  this.waterAttackToken !== attackToken
) {
  return;
}

    this.tweens.add({
      targets: shark,
      alpha: 0.14,
      x: approachX,
      y: surfaceY + 46,
      scale: 0.72,
      duration: 190,
      ease: 'Quad.in'
    });
  }
);

this.time.delayedCall(
  470,
  () => {
    if (
      !shark.active ||
      this.waterAttackToken !== attackToken
    ) {
      return;
    }

    this.tweens.add({
      targets: shark,
      alpha: 1,
      x: approachX,
      y: surfaceY - 2,
      scale: 0.84,
      duration: 220,
      ease: 'Cubic.out'
    });
  }
);

this.time.delayedCall(
  attackVariant === 0 ? 720 : 760,
  () => {
    if (
      !shark.active ||
      this.waterAttackToken !== attackToken
    ) {
      return;
    }

    this.tweens.add({
      targets: shark,
      x:
        attackVariant === 0
          ? attackX
          : attackX + side * 18,
      y:
        attackVariant === 0
          ? surfaceY - 8
          : surfaceY - 22,
      scale:
        attackVariant === 0
          ? 0.9
          : 1.02,
      duration:
        attackVariant === 0
          ? 210
          : 170,
      ease:
        attackVariant === 0
          ? 'Cubic.in'
          : 'Cubic.in'
    });

    this.tweens.add({
                targets: biteRing,
                alpha: {
                  from: 0,
                  to: 0.85
                },
                scale: {
                  from: 0.8,
                  to: 3.2
                },
                duration: 210,
                ease: 'Quad.out',
                onComplete: () => {
                  if (biteRing.active) {
                    biteRing.destroy();
                  }
                }
              });
            }
          );

  this.time.delayedCall(
  attackVariant === 0 ? 940 : 970,
  () => {
    if (
      !shark.active ||
      this.waterAttackToken !== attackToken
    ) {
      return;
    }

     if (
  !this.motionReduced &&
  this.graphicsLevel >= 2
) {
  this.cameras.main.flash(
    75,
    88,
    231,
    255,
    true
  );
}

this.shake(
  130,
  0.009
);

// ============================================================
// SHARK → WATER INTERACTION
// Shark physically breaks the water surface.
// ============================================================
this.triggerSharkWaterImpact(
  shark.x,
  surfaceY
);

if (attackVariant === 1) {
  this.time.delayedCall(
    90,
    () => {
      if (
        shark.active &&
        this.waterAttackToken === attackToken
      ) {
        this.triggerSharkWaterImpact(
          shark.x,
          surfaceY
        );
      }
    }
  );
}

     const playerBody =
  player?.body;

if (!playerBody) {
  return;
}

playerBody.setVelocityY(
  attackVariant === 0
    ? 420
    : 500
);

playerBody.setVelocityX(
  playerBody.velocity.x *
    (attackVariant === 0
      ? 0.15
      : 0.08)
);

if (attackVariant === 1) {
  this.tweens.add({
    targets: splashWide,
    scaleX: 4.2,
    scaleY: 1.8,
    alpha: 0,
    duration: 220,
    ease: 'Cubic.out',
    onComplete: () => {
      if (splashWide.active) {
        splashWide.destroy();
      }
    }
  });
}

          this.tweens.add({
  targets: shark,
  y: surfaceY - 46,
  duration: 260,
  ease: 'Sine.easeOut',
  onComplete: () => {
    if (
      !shark.active ||
      this.waterAttackToken !== attackToken
    ) {
      return;
    }

    // BRUTALNI SKOK IZ VODE
    this.tweens.add({
      targets: shark,
      y: surfaceY - 150,
      duration: 260,
      ease: 'Sine.easeOut',
      onComplete: () => {
        if (
          !shark.active ||
          this.waterAttackToken !== attackToken
        ) {
          return;
        }

          this.tweens.add({
          targets: shark,
          y: surfaceY - 18,
          duration: 330,
          ease: 'Sine.easeIn',
          onComplete: finishShark
        });
      }
    });

    // Blagi nagib tokom skoka
    this.tweens.add({
      targets: shark,
      angle: player.flipX ? -14 : 14,
      duration: 260,
      ease: 'Sine.easeOut'
    });
  }
});
            }
          );
        };

        if (this.motionReduced) {
          this.time.delayedCall(
            120,
            beginAttack
          );
        } else {
          this.time.delayedCall(
            520,
            beginAttack
          );
        }
      },
      undefined,
      this
    );
  }

triggerSharkWaterImpact(x, y) {
  if (
    this.motionReduced ||
    this.finished ||
    this.respawning
  ) {
    return;
  }

  const impactObjects = [];

  const ring =
    this.add
      .ellipse(
        x,
        y,
        34,
        8,
        0xe8fdff,
        0.72
      )
      .setDepth(12)
      .setAlpha(0.72);

  const splash =
    this.add
      .ellipse(
        x,
        y - 8,
        18,
        22,
        0xdffcff,
        0.62
      )
      .setDepth(12)
      .setAlpha(0.58);

  const splashWide =
    this.add
      .ellipse(
        x,
        y - 2,
        54,
        10,
        0x8df4ff,
        0.42
      )
      .setDepth(11)
      .setAlpha(0.5);

  impactObjects.push(
    ring,
    splash,
    splashWide
  );

  this.waterWaveObjects.push(
    ...impactObjects
  );

  for (let i = 0; i < 8; i++) {
    const drop =
      this.add
        .circle(
          x +
            Phaser.Math.Between(-14, 14),
          y -
            Phaser.Math.Between(2, 9),
          Phaser.Math.Between(1, 2),
          0xe8fdff,
          Phaser.Math.FloatBetween(
            0.38,
            0.72
          )
        )
        .setDepth(12)
        .setAlpha(0.8);

    impactObjects.push(drop);
    this.waterWaveObjects.push(drop);

    this.tweens.add({
      targets: drop,
      x:
        drop.x +
        Phaser.Math.Between(-42, 42),
      y:
        y -
        Phaser.Math.Between(24, 58),
      alpha: 0,
      scale:
        Phaser.Math.FloatBetween(
          0.65,
          1.4
        ),
      duration:
        Phaser.Math.Between(260, 420),
      ease: 'Cubic.out',
      onComplete: () => {
        if (drop.active) {
          drop.destroy();
        }
      }
    });
  }

  this.tweens.add({
    targets: ring,
    scaleX: 3.8,
    scaleY: 1.8,
    alpha: 0,
    duration: 360,
    ease: 'Cubic.out'
  });

  this.tweens.add({
    targets: splash,
    y: y - 38,
    scaleX: 1.8,
    scaleY: 2.5,
    alpha: 0,
    duration: 390,
    ease: 'Cubic.out'
  });

  this.tweens.add({
    targets: splashWide,
    scaleX: 3.2,
    scaleY: 1.7,
    alpha: 0,
    duration: 330,
    ease: 'Quad.out'
  });

  this.shake(
    110,
    0.007
  );

  this.time.delayedCall(
    430,
    () => {
      impactObjects.forEach(
        object => {
          if (object?.active) {
            object.destroy();
          }
        }
      );
    }
  );
}

createWaterWaves() {
  const graphicsLevel =
    Number.isFinite(this.graphicsLevel)
      ? this.graphicsLevel
      : 2;

  if (
    this.motionReduced ||
    graphicsLevel < 2
  ) {
    return;
  }

  this.waterWaveObjects = [];
  this.waterWaveTimers = [];

  const isStorm =
    this.mission.id === 'signal-storm';

const waveScale =
  isStorm
    ? 1.38
    : 1;

const waveSpeed =
  isStorm
    ? 0.72
    : 1;

const stormWaveEnergy =
  isStorm
    ? 1.18
    : 1;

  this.mission.waterZones.forEach(
    ([x, y, width, height], index) => {
      const surfaceY = y;
      const edgeX = x + width - 8;

// ============================================================
// WIND / WAVE DIRECTION
// Each water zone gets its own subtle flow direction.
// ============================================================
const windDirection =
  index % 2 === 0 ? 1 : -1;

const windStrength =
  Phaser.Math.FloatBetween(10, 24);

const windOffset =
  windDirection * windStrength;

      // ============================================================
      // MAIN SWELL
      // ============================================================
  const mainWave =
  this.add
    .ellipse(
      x + 8 + windOffset * 0.35,
      surfaceY - 1,
      92 * waveScale,
      13 * waveScale,
      0x9defff,
      0.18
    )
    .setDepth(7)
    .setAlpha(0);

// MAIN WAVE BASE PULSE
// Scale is controlled by the enhanced MAIN WAVE tween below.

      // ============================================================
      // SECONDARY SWELL
      // ============================================================
   const secondaryWave =
  this.add
    .ellipse(
      x + 22,
      surfaceY + 2,
      72 * waveScale,
      9 * waveScale,
      0x58e7ff,
      0.10
    )
    .setDepth(5)
    .setAlpha(0);

      // ============================================================
// DISTANT ROLLING SWELLS
// ============================================================

const distantSwells = [];

for (let i = 0; i < 2; i++) {
  const swell =
    this.add
      .ellipse(
        x +
        26 +
        i * 58 +
        windOffset * 0.18,

        surfaceY +
        7 +
        i * 2,

        (108 - i * 18) *
          waveScale,

        (7 - i) *
          waveScale,

        0x3bcde8,

        isStorm
          ? 0.18
          : 0.11
      )
      .setDepth(4)
      .setAlpha(0);

  distantSwells.push(swell);
  this.waterWaveObjects.push(swell);

  this.tweens.add({
    targets: swell,

    x:
      x +
      18 +
      i * 72 +
      windOffset * 0.30,

    y:
      surfaceY +
      5 +
      Phaser.Math.FloatBetween(
        -1,
        2
      ),

    scaleX:
      Phaser.Math.FloatBetween(
        1.10,
        1.32
      ),

    scaleY:
      Phaser.Math.FloatBetween(
        0.72,
        0.92
      ),

    alpha: {
      from: 0,
      to:
        isStorm
          ? 0.28
          : 0.20
    },

    duration:
      Phaser.Math.Between(
        2200,
        2900
      ) / waveSpeed,

    delay:
      index * 240 +
      i * 330,

    yoyo: true,
    repeat: -1,

    ease: 'Sine.inOut'
  });
}

// ============================================================
// FOAM
// ============================================================
const foam =
  this.add
    .ellipse(
      edgeX + windOffset * 0.25,
      surfaceY - 4,
      48 * waveScale,
      8 * waveScale,
      0xeaffff,
      0.14
    )
    .setDepth(9)
    .setAlpha(0);

// FOAM BASE MOTION
// Intentionally handled by the enhanced FOAM tween below.

// ============================================================
// BREAKER
// ============================================================
const breaker =
  this.add
    .ellipse(
      edgeX - 12 + windOffset * 0.3,
      surfaceY - 8,
      34 * waveScale,
      7 * waveScale,
      0xffffff,
      0.12
    )
    .setDepth(10)
    .setAlpha(0);

// BREAKER BASE MOTION
// Intentionally handled by the enhanced BREAKER CURL tween below.
      
      // ============================================================
      // SPLASH
      // ============================================================
      const splash =
        this.add
          .ellipse(
            edgeX,
            surfaceY - 12,
            22 * waveScale,
            20 * waveScale,
            0xe8fdff,
            0.10
          )
          .setDepth(10)
          .setAlpha(0);

      // ============================================================
      // IMPACT
      // ============================================================
      const impact =
        this.add
          .ellipse(
            edgeX,
            surfaceY + 2,
            34 * waveScale,
            5 * waveScale,
            0x58e7ff,
            0.08
          )
          .setDepth(7)
          .setAlpha(0);

      // ============================================================
      // BACKWASH
      // ============================================================
      const retreat =
        this.add
          .ellipse(
            edgeX - 4,
            surfaceY + 5,
            30 * waveScale,
            4 * waveScale,
            0x8df4ff,
            0.08
          )
          .setDepth(6)
          .setAlpha(0);

      this.waterWaveObjects.push(
        mainWave,
        secondaryWave,
        foam,
        breaker,
        splash,
        impact,
        retreat
      );

      // ============================================================
      // MICRO SPLASH PARTICLES
      // ============================================================
      const droplets = [];

      for (let i = 0; i < 5; i++) {
        const drop =
          this.add
            .circle(
              edgeX + Phaser.Math.Between(-12, 12),
              surfaceY - 4,
              Phaser.Math.Between(1, 2),
              0xe8fdff,
              Phaser.Math.FloatBetween(0.20, 0.42)
            )
            .setDepth(10)
            .setAlpha(0);

        droplets.push(drop);
        this.waterWaveObjects.push(drop);

        const startX = drop.x;

       this.tweens.add({
  targets: drop,

x:
  startX +
  Phaser.Math.Between(
    -24,
    24
  ) +
  windOffset *
    Phaser.Math.FloatBetween(
      0.45,
      0.90
    ),

y:
  surfaceY -
  Phaser.Math.Between(
    20,
    38
  ),
  alpha: {
    from: 0,
    to:
      Phaser.Math.FloatBetween(
        0.35,
        0.68
      )
  },

  scale: {
    from: 0.65,
    to:
      Phaser.Math.FloatBetween(
        0.95,
        1.15
      )
  },

  angle:
    Phaser.Math.Between(
      -18,
      18
    ),

  duration:
    Phaser.Math.Between(
      260,
      380
    ) /
    waveSpeed,

  delay:
    index * 300 +
    1120 +
    i * 24,

  yoyo: true,
  repeat: -1,

  ease: 'Cubic.out'
});

      // ============================================================
      // MAIN WAVE
      // ============================================================
this.tweens.add({
  targets: mainWave,

  x:
    edgeX -
    24 +
    windOffset,

 scaleX:
  1.5 *
  stormWaveEnergy,

scaleY:
  1.18 *
  stormWaveEnergy,

  angle:
    windOffset > 0
      ? 3.5
      : -3.5,

  alpha: {
    from: 0,
    to: isStorm ? 0.82 : 0.68
  },

  duration:
    1650 / waveSpeed,

  delay:
    index * 300,

  yoyo: true,
  repeat: -1,

  ease: 'Sine.inOut',

  onRepeat: () => {
    if (!mainWave.active) {
      return;
    }

    mainWave.scaleY =
      Phaser.Math.FloatBetween(
        1.08,
        1.22
      );

    mainWave.angle =
      windOffset > 0
        ? Phaser.Math.FloatBetween(2.5, 4.5)
        : Phaser.Math.FloatBetween(-4.5, -2.5);
  }
});

      // ============================================================
      // SECONDARY WAVE
      // ============================================================

        this.tweens.add({
  targets: secondaryWave,

  x:
    x +
    22 +
    windOffset * 0.35,

  y:
    surfaceY +
    Phaser.Math.FloatBetween(
      1,
      3
    ),

  scaleX:
    Phaser.Math.FloatBetween(
      1.35,
      1.62
    ),

  scaleY:
    Phaser.Math.FloatBetween(
      0.68,
      0.88
    ),

  angle:
    windOffset > 0
      ? Phaser.Math.FloatBetween(
          1,
          2.5
        )
      : Phaser.Math.FloatBetween(
          -2.5,
          -1
        ),

  alpha: {
    from: 0,
    to:
      isStorm
        ? 0.42
        : 0.30
  },

  duration:
    Phaser.Math.Between(
      1700,
      2200
    ) / waveSpeed,

  delay:
    index * 300 +
    260,

  yoyo: true,
  repeat: -1,

  ease: 'Sine.inOut'
});

      // ============================================================
      // FOAM
      // ============================================================
  this.tweens.add({
  targets: foam,

  x:
    edgeX +
    8 +
    windOffset * 0.30,

  y:
    surfaceY -
    (
      isStorm
        ? 9
        : 7
    ),

  scaleX:
    isStorm
      ? 2.35
      : 2.05,

  scaleY:
    isStorm
      ? 0.78
      : 0.68,

alpha: {
  from: 0,
  to:
    isStorm
      ? 0.86
      : 0.62
},

  duration:
    Phaser.Math.Between(
      300,
      390
    ) / waveSpeed,

  delay:
    index * 300 +
    1120,

  yoyo: true,
  repeat: -1,

  ease: 'Sine.out'
});

      // ============================================================
      // BREAKER CURL
      // ============================================================
   this.tweens.add({
  targets: breaker,

  y:
    surfaceY -
    (
      isStorm
        ? 38
        : 29
    ),

  x:
    edgeX -
    4 +
    windOffset * 0.65,

  scaleX:
    isStorm
      ? 2.08
      : 1.78,

  scaleY:
    isStorm
      ? 1.62
      : 1.44,

  angle:
    windOffset > 0
      ? Phaser.Math.FloatBetween(
          4,
          7
        )
      : Phaser.Math.FloatBetween(
          -7,
          -4
        ),

  alpha: {
    from: 0,
    to:
      isStorm
        ? 0.72
        : 0.56
  },

  duration:
    Phaser.Math.Between(
      380,
      470
    ) / waveSpeed,

  delay:
    index * 300 +
    1100,

  yoyo: true,
  repeat: -1,

  ease: 'Cubic.out'
});
      // ============================================================
      // SPLASH
      // ============================================================
   this.tweens.add({
  targets: splash,

  x:
    edgeX +
    windOffset * 0.7,

  y:
    surfaceY -
    (
      isStorm
        ? 48
        : 38
    ),

  scaleX:
    isStorm
      ? 2.15
      : 1.85,

  scaleY:
    isStorm
      ? 2.35
      : 2.05,

  angle:
    windOffset > 0
      ? 5
      : -5,

  alpha: {
    from: 0,
    to: isStorm ? 0.72 : 0.60
  },

  duration:
    390 / waveSpeed,

  delay:
    index * 300 +
    1140,

  yoyo: true,
  repeat: -1,

  ease: 'Cubic.out'
});

      // ============================================================
      // IMPACT RING
      // ============================================================
 this.tweens.add({
  targets: impact,

  x:
    edgeX +
    windOffset * 0.55,

scaleX:
  isStorm
    ? 4.8
    : 4.05,

scaleY:
  isStorm
    ? 1.48
    : 1.30,

  alpha: {
    from: 0,
    to: isStorm ? 0.50 : 0.40
  },

duration:
  Phaser.Math.Between(
    430,
    520
  ) / waveSpeed,

delay:
  index * 300 +
  1150 +
  Phaser.Math.Between(
    0,
    60
  ),

  yoyo: true,
  repeat: -1,

  ease: 'Sine.inOut'
});

      // ============================================================
      // BACKWASH
      // ============================================================
     this.tweens.add({
  targets: retreat,

x:
  x +
  10 +
  windOffset * 0.48,

y:
  surfaceY +
  Phaser.Math.FloatBetween(
    4,
    8
  ),

scaleX:
  isStorm
    ? 3.60
    : 3.05,

scaleY:
  isStorm
    ? 0.86
    : 0.72,

angle:
  windOffset > 0
    ? Phaser.Math.FloatBetween(
        1.5,
        3
      )
    : Phaser.Math.FloatBetween(
        -3,
        -1.5
      ),
  alpha: {
    from: 0,
    to: isStorm ? 0.40 : 0.30
  },

  duration:
    Phaser.Math.Between(
      1650,
      2050
    ) / waveSpeed,

  delay:
    index * 300 +
    650,

  yoyo: true,
  repeat: -1,

  ease: 'Sine.inOut'
});

      // ============================================================
      // SURFACE BOB
      // ============================================================
        
   this.tweens.add({
  targets: mainWave,
  y: '-=3',
  duration: 420 / waveSpeed,
  yoyo: true,
  repeat: -1,
  ease: 'Sine.inOut'
});

      // ============================================================
      // BIG BREAKER EVENT
      // Periodic stronger wave
      // ============================================================
      const bigBreaker =
        this.add
          .ellipse(
            edgeX,
            surfaceY - 4,
            isStorm ? 70 : 58,
            isStorm ? 24 : 20,
            0xdffcff,
            0.08
          )
          .setDepth(10)
          .setAlpha(0);

      this.waterWaveObjects.push(bigBreaker);

      const breakerTimer =
        this.time.addEvent({
          delay: isStorm ? 6200 : 8200,
          loop: true,
          startAt:
            index * 900 + 3400,

          callback: () => {
            if (
              !bigBreaker.active ||
              this.finished ||
              this.respawning
            ) {
              return;
            }

            bigBreaker.setPosition(
              edgeX,
              surfaceY - 5
            );

       bigBreaker.setScale(
  0.45,
  0.55
);

bigBreaker.setAlpha(
  0
);

this.tweens.add({
  targets: bigBreaker,

  x:
    edgeX +
    windOffset * 0.85,

  y:
    surfaceY -
    (
      isStorm
        ? 46
        : 34
    ),

  scaleX:
    isStorm
      ? 1.95
      : 1.55,

  scaleY:
    isStorm
      ? 1.72
      : 1.42,

  angle:
    windOffset > 0
      ? 4
      : -4,

  alpha: {
    from: 0,
    to: isStorm ? 0.78 : 0.58
  },

  duration:
    isStorm
      ? 560
      : 480,

  ease: 'Cubic.out',

  onComplete: () => {
    if (!bigBreaker.active) {
      return;
    }

    this.tweens.add({
      targets: bigBreaker,

      scaleX:
        isStorm
          ? 2.45
          : 2.10,

      scaleY:
        isStorm
          ? 0.72
          : 0.82,

      alpha: 0,

      duration: 430,

      ease: 'Sine.inOut'
    });
  }
});

            this.tweens.add({
              targets: impact,
              scaleX: isStorm ? 5 : 4,
              alpha: isStorm ? 0.6 : 0.46,
              duration: 260,
              yoyo: true,
              ease: 'Quad.out'
            });

            this.shake(
              isStorm ? 90 : 55,
              isStorm ? 0.006 : 0.003
            );
          }
        });

            this.waterWaveTimers.push(
        breakerTimer
      );
    }
  }
  );
}

clearWaterWaves() {
  if (this.waterWaveTimers) {
    this.waterWaveTimers.forEach(
      timer => {
        if (timer) {
          timer.remove(false);
        }
      }
    );

    this.waterWaveTimers = [];
  }

  if (this.waterWaveObjects) {
    this.tweens.killTweensOf(
      this.waterWaveObjects
    );

    this.waterWaveObjects.forEach(
      object => {
        if (
          object &&
          object.active
        ) {
          object.destroy();
        }
      }
    );

    this.waterWaveObjects = [];
  }
}

shutdown() {
  if (this.rawKeyboardDownHandler) {
    window.removeEventListener(
      'keydown',
      this.rawKeyboardDownHandler,
      true
    );
  }

  if (this.rawKeyboardUpHandler) {
    window.removeEventListener(
      'keyup',
      this.rawKeyboardUpHandler,
      true
    );
  }

  if (this.rawKeyboardBlurHandler) {
    window.removeEventListener(
      'blur',
      this.rawKeyboardBlurHandler
    );
  }

  this.rawKeyboardState = null;
  this.rawKeyboardDownHandler = null;
  this.rawKeyboardUpHandler = null;
  this.rawKeyboardBlurHandler = null;

  this.checkpointArrow?.destroy();
  this.checkpointArrow = null;

  this.clearWaterWaves();

  if (this.waterWaveObjects) {
    this.tweens.killTweensOf(
      this.waterWaveObjects
    );

    this.waterWaveObjects.forEach(
      object => {
        if (
          object &&
          object.active
        ) {
          object.destroy();
        }
      }
    );

    this.waterWaveObjects = [];
  }

  /*
   * ============================================================
   * RELAY PUZZLE · RESIZE LISTENER CLEANUP
   * ============================================================
   */
  if (this._relayPuzzleResizeBound) {
    this.scale.off(
      Phaser.Scale.Events.RESIZE,
      this.handleRelayPuzzleResize,
      this
    );

    this._relayPuzzleResizeBound =
      false;
  }

  // ============================================================
  // AI VOICE / COMMENTATOR · CLEANUP
  // Prevent duplicate narration listeners after scene restart.
  // Invalidate all callbacks belonging to the previous voice state.
  // ============================================================
  this.voiceSerial =
    (this.voiceSerial || 0) + 1;

  if (this.narrationHandler) {
    this.game.events.off(
      'narration',
      this.narrationHandler
    );

    this.narrationHandler =
      null;
  }

  if (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window
  ) {
    window.speechSynthesis.cancel();

if (
  window.speechSynthesis.onvoiceschanged ===
  this.voiceVoicesChangedHandler
) {
  window.speechSynthesis.onvoiceschanged =
    this.voicePreviousVoicesChangedHandler || null;
}
  }

this.voiceVoicesChangedHandler =
  null;

this.voicePreviousVoicesChangedHandler =
  null;

this.voiceVoices = [];

this.voiceQueue = [];
this.voiceSpeaking = false;

this.voiceLastText = '';
this.voiceLastTextAt = 0;
this.voiceLastAt = 0;
}



/*
 * ============================================================
 * RELAY PUZZLE · RESPONSIVE RESIZE HANDLER
 * Shared HUD only — puzzle state is NOT reset.
 * ============================================================
 */
handleRelayPuzzleResize(gameSize) {
  const ui =
    this.relayPuzzleUI;

  if (
    !ui ||
    !this.relayPuzzleActive ||
    !gameSize
  ) {
    return;
  }

  const width =
    Number(gameSize.width) ||
    this.scale.width;

  const height =
    Number(gameSize.height) ||
    this.scale.height;

  const panelWidth =
    Math.min(
      620,
      Math.max(
        300,
        width - 34
      )
    );

  const panelHeight =
    Math.min(
      440,
      Math.max(
        240,
        height - 40
      )
    );

  /*
   * ------------------------------------------------------------
   * BACKDROP
   * ------------------------------------------------------------
   */
  ui.overlay?.setPosition(
    width / 2,
    height / 2
  );

  ui.overlay?.setSize(
    width,
    height
  );

  /*
   * ------------------------------------------------------------
   * MAIN PANEL
   * ------------------------------------------------------------
   */
  ui.panel?.setPosition(
    width / 2,
    height / 2
  );

  ui.panel?.setSize(
    panelWidth,
    panelHeight
  );

  /*
   * ------------------------------------------------------------
   * INNER PANEL
   * ------------------------------------------------------------
   */
  ui.inner?.setPosition(
    width / 2,
    height / 2
  );

  ui.inner?.setSize(
    panelWidth - 18,
    panelHeight - 18
  );

  /*
   * ------------------------------------------------------------
   * HEADER
   * ------------------------------------------------------------
   */
  ui.title?.setPosition(
    width / 2,
    height / 2 -
      panelHeight / 2 +
      38
  );

  ui.subtitle?.setPosition(
    width / 2,
    height / 2 -
      panelHeight / 2 +
      68
  );

  ui.status?.setPosition(
    width / 2,
    height / 2 -
      132
  );

  /*
   * ------------------------------------------------------------
   * TIMER
   * ------------------------------------------------------------
   */
  ui.timer?.setPosition(
    width / 2,
    height / 2 -
      106
  );

  /*
   * ------------------------------------------------------------
   * CLOSE BUTTON
   * ------------------------------------------------------------
   */
  ui.close?.setPosition(
    width / 2 +
      panelWidth / 2 -
      28,
    height / 2 -
      panelHeight / 2 +
      24
  );

  /*
   * ------------------------------------------------------------
   * RETRY
   * ------------------------------------------------------------
   */
  ui.retry?.setPosition(
    width / 2 -
      panelWidth / 2 +
      56,
    height / 2 +
      panelHeight / 2 -
      25
  );

  /*
   * ------------------------------------------------------------
   * DIFFICULTY
   * ------------------------------------------------------------
   */
  ui.difficultyLabel?.setPosition(
    width / 2,
    height / 2 -
      panelHeight / 2 +
      92
  );

  /*
   * ------------------------------------------------------------
   * INSTRUCTION
   * ------------------------------------------------------------
   */
  ui.instruction?.setPosition(
    width / 2,
    height / 2 +
      panelHeight / 2 -
      48
  );

  /*
   * ------------------------------------------------------------
   * KEEP HUD STATIC TO CAMERA
   * ------------------------------------------------------------
   */
  [
    ui.overlay,
    ui.panel,
    ui.inner,
    ui.title,
    ui.subtitle,
    ui.status,
    ui.timer,
    ui.close,
    ui.retry,
    ui.difficultyLabel,
    ui.instruction
  ]
    .filter(Boolean)
    .forEach(
      object => {
        object.setScrollFactor?.(0);
      }
    );
}

  // ============================================================
// RELAY GATE · PROXIMITY / INTERACT SYSTEM
// ============================================================

updateRelayGateInteraction() {
  if (
    !this.player?.active ||
    !this.relayGates ||
    this.relayPuzzleActive
  ) {
    this.clearRelayInteractHint();
    return;
  }

  let nearestGate = null;
  let nearestDistance = Infinity;

  this.relayGates.children.iterate(
    gate => {
      if (!gate || !gate.active) {
        return;
      }

      if (gate.getData('solved')) {
        return;
      }

      const distance =
        Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          gate.x,
          gate.y
        );

      if (
        distance <= 145 &&
        distance < nearestDistance
      ) {
        nearestDistance = distance;
        nearestGate = gate;
      }
    }
  );

  if (!nearestGate) {
    this.clearRelayInteractHint();
    return;
  }

  this.relayNearbyGate =
    nearestGate;

  this.showRelayInteractHint(
    nearestGate
  );

const interactPressed =
  Phaser.Input.Keyboard.JustDown(
    this.keys.E
  ) ||
  this.mobileActions.interact;

this.mobileActions.interact = false;

if (interactPressed) {
  this.openRelayPuzzle(
    nearestGate
  );
}
}

showRelayInteractHint(gate) {
  if (!gate) {
    return;
  }

  const hintX =
    gate.x;

  const hintY =
    gate.y -
    145;

  if (!this.relayInteractHint) {
    this.relayInteractHint =
      this.add
        .container(
          hintX,
          hintY
        )
        .setDepth(60);

    const glow =
      this.add
        .rectangle(
          0,
          0,
          118,
          30,
          0x071625,
          0.94
        )
        .setStrokeStyle(
          1.5,
          0x8df4ff,
          0.92
        );

    const key =
      this.add
        .rectangle(
          -42,
          0,
          24,
          21,
          0x8df4ff,
          0.16
        )
        .setStrokeStyle(
          1,
          0x8df4ff,
          0.85
        );

    const keyText =
      this.add
        .text(
          -42,
          0,
          'F',
          {
            fontFamily: 'DM Mono',
            fontSize: '12px',
            color: '#8df4ff',
            fontStyle: 'bold'
          }
        )
        .setOrigin(0.5);

    const label =
      this.add
        .text(
          12,
          0,
          'INTERACT',
          {
            fontFamily: 'DM Mono',
            fontSize: '10px',
            color: '#e8fdff',
            fontStyle: 'bold',
            letterSpacing: 1
          }
        )
        .setOrigin(0.5);

    this.relayInteractHint.add([
      glow,
      key,
      keyText,
      label
    ]);

    if (!this.motionReduced) {
      this.tweens.add({
        targets:
          this.relayInteractHint,
        alpha: {
          from: 0.72,
          to: 1
        },
        scale: {
          from: 0.94,
          to: 1
        },
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
    }
  }

  this.relayInteractHint.setPosition(
    hintX,
    hintY
  );

  this.relayInteractHint.setVisible(
    true
  );
}

clearRelayInteractHint() {
  this.relayNearbyGate =
    null;

  if (this.relayInteractHint) {
    this.tweens.killTweensOf(
      this.relayInteractHint
    );

    this.relayInteractHint.destroy();

    this.relayInteractHint =
      null;
  }
}
  // ============================================================
// RELAY GATE · PUZZLE OPEN
// ============================================================

openRelayPuzzle(gate) {
  if (
    !gate ||
    gate.getData('solved') ||
    this.relayPuzzleActive
  ) {
    return;
  }

  this.relayPuzzleActive =
    true;

  this.relayPuzzleGate =
    gate;

this.relayPuzzleType =
  this.getMissionPuzzleType(gate);

this.relayPuzzleAttempts =
  0;

this.relayPuzzleStartedAt =
  this.time.now;

this.relayPuzzleTimerBand =
  0;

this.clearRelayInteractHint();

  this.player.body?.setVelocity(
    0,
    0
  );

  this.player.body?.setAcceleration(
    0,
    0
  );

this.player.setVelocity?.(
  0,
  0
);

this.mobileActions.jump =
  false;

this.mobileActions.fire =
  false;

this.mobileActions.sword =
  false;

this.mobileActions.dash =
  false;

this.mobileActions.crouch =
  false;

this.mobileActions.interact =
  false;

this.mobileActions.build1 =
  false;

this.mobileActions.build2 =
  false;

this.mobileActions.gadget1 =
  false;

this.mobileActions.gadget2 =
  false;

this.mobileDirection = null;
  
this.physics.pause();
this.createRelayPuzzleUI();
}
// ============================================================
// MISSION PUZZLE DIRECTOR
// Each mission gets its own puzzle identity.
// ============================================================

getMissionPuzzleType(gate = null) {

  const missionId =
    this.mission?.id;

  const gateType =
    gate?.getData?.('type');

  // Explicit gate type has priority.
  if (
    gateType &&
    gateType !== 'circuit'
  ) {
    return gateType;
  }

  const missionPuzzleMap = {
    'first-delivery': 'code',
    'dead-drop': 'circuit',
    'blackout': 'sequence',
    'pursuit': 'tiles',
    'signal-storm': 'frequency',
    'corporate-lockdown': 'grid',
    'final-relay': 'final'
  };

  return (
    missionPuzzleMap[missionId] ||
    'circuit'
  );
}

// ============================================================
// PUZZLE TITLE / SUBTITLE
// ============================================================

getRelayPuzzleMeta(type) {

  const meta = {

    code: {
      title: 'ACCESS CODE',
      subtitle: 'ENCRYPTED // SECURITY BYPASS',
      instruction: 'TAP DIGITS // MATCH THE SECURITY CODE'
    },

    circuit: {
      title: 'RELAY ACCESS',
      subtitle: 'CIRCUIT // SECURITY HANDSHAKE',
      instruction: 'TAP NODE = ROTATE 90°  //  START → END'
    },

    sequence: {
      title: 'GRID SEQUENCE',
      subtitle: 'MEMORY // SIGNAL ORDER',
      instruction: 'ACTIVATE NODES IN THE CORRECT ORDER'
    },

    tiles: {
      title: 'ROUTE MATRIX',
      subtitle: 'NAVIGATION // PATH RECONSTRUCTION',
      instruction: 'BUILD THE SAFE ROUTE  //  START → END'
    },

    frequency: {
      title: 'SIGNAL TUNER',
      subtitle: 'FREQUENCY // ENCRYPTED CHANNEL',
      instruction: 'TUNE THE SIGNAL INTO THE GREEN BAND'
    },

    grid: {
      title: 'SECURITY GRID',
      subtitle: 'CORPORATE // INTRUSION CONTROL',
      instruction: 'FIND THE SAFE PATH WITHOUT TRIGGERING SECURITY'
    },

    final: {
      title: 'APEX RELAY',
      subtitle: 'FINAL PROTOCOL // MULTI-LAYER HANDSHAKE',
      instruction: 'COMPLETE ALL SECURITY LAYERS'
    }

  };

  return (
    meta[type] ||
    meta.circuit
  );
}

// ============================================================
// RELAY GATE · HOLOGRAPHIC PUZZLE UI
// ============================================================

createRelayPuzzleUI() {
  const width =
    this.scale.width;

  const height =
    this.scale.height;

  /*
   * ============================================================
   * RELAY PUZZLE · RESPONSIVE RESIZE GUARD
   * Re-centers the shared puzzle HUD elements when the
   * Phaser canvas changes size.
   * ============================================================
   */
  if (!this._relayPuzzleResizeBound) {
    this._relayPuzzleResizeBound = true;

    this.scale.on(
      Phaser.Scale.Events.RESIZE,
      this.handleRelayPuzzleResize,
      this
    );
  }

  const overlay =
    this.add
      .rectangle(
        width / 2,
        height / 2,
        width,
        height,
        0x020812,
        0.78
      )
      .setScrollFactor(0)
      .setDepth(1000)
      .setInteractive();

  const panelWidth =
    Math.min(
      620,
      width - 34
    );

  const panelHeight =
    Math.min(
      440,
      height - 40
    );

  const panel =
    this.add
      .rectangle(
        width / 2,
        height / 2,
        panelWidth,
        panelHeight,
        0x071625,
        0.98
      )
      .setStrokeStyle(
        2,
        0x8df4ff,
        0.92
      )
      .setScrollFactor(0)
      .setDepth(1001);

  const inner =
    this.add
      .rectangle(
        width / 2,
        height / 2,
        panelWidth - 18,
        panelHeight - 18,
        0x04101d,
        0.98
      )
      .setStrokeStyle(
        1,
        0x3a8ca8,
        0.42
      )
      .setScrollFactor(0)
      .setDepth(1001);

  const title =
    this.add
      .text(
        width / 2,
        height / 2 -
          panelHeight / 2 +
          38,
        this.getRelayPuzzleMeta(
          this.relayPuzzleType
        ).title,
        {
          fontFamily: 'DM Mono',
          fontSize: '20px',
          color: '#e8fdff',
          fontStyle: 'bold',
          letterSpacing: 2
        }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1002);

  const subtitle =
    this.add
      .text(
        width / 2,
        height / 2 -
          panelHeight / 2 +
          68,
       this.getRelayPuzzleMeta(
  this.relayPuzzleType
).subtitle,
        {
          fontFamily: 'DM Mono',
          fontSize: '10px',
          color: '#8df4ff',
          letterSpacing: 1.3
        }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1002);

  const status =
    this.add
      .text(
        width / 2,
        height / 2 -
          132,
        'LOCKED · WAITING FOR INPUT',
        {
          fontFamily: 'DM Mono',
          fontSize: '11px',
          color: '#ff826e',
          fontStyle: 'bold'
        }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1002);

  const instruction =
  this.add
    .text(
      width / 2,
      height / 2 +
        panelHeight / 2 -
        48,
    this.getRelayPuzzleMeta(
  this.relayPuzzleType
).instruction,
      {
        fontFamily: 'DM Mono',
        fontSize: width < 600 ? '8px' : '9px',
        color: '#91a9b7',
        align: 'center'
      }
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(1002);

const timer =
  this.add
    .text(
      width / 2,
      height / 2 -
        106,
      'TIME 00:00',
      {
        fontFamily: 'DM Mono',
        fontSize: width < 600 ? '9px' : '10px',
        color: '#8df4ff',
        fontStyle: 'bold',
        letterSpacing: 1.2
      }
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(1002);

const close =
  this.add
    .text(
        width / 2 +
          panelWidth / 2 -
          28,
        height / 2 -
          panelHeight / 2 +
          24,
        '×',
        {
          fontFamily: 'Arial',
          fontSize: '24px',
          color: '#ff826e',
          fontStyle: 'bold'
        }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1003)
      .setInteractive({
        useHandCursor: true
      });

  close.on(
    'pointerover',
    () => {
      close.setColor('#ffffff');
    }
  );

  close.on(
    'pointerout',
    () => {
      close.setColor('#ff826e');
    }
  );

  close.on(
    'pointerdown',
    () => {
      this.closeRelayPuzzle();
    }
  );

 const difficulty =
  Number(
    this.relayPuzzleGate?.getData(
      'difficulty'
    )
  ) || 1;

const securityLevel =
  difficulty >= 3
    ? 'SECURITY LEVEL // OMEGA'
    : difficulty === 2
      ? 'SECURITY LEVEL // ALPHA'
      : 'SECURITY LEVEL // BETA';

const retry =
  this.add
    .text(
      width / 2 -
        panelWidth / 2 +
        56,
      height / 2 +
        panelHeight / 2 -
        25,
      '↻ RETRY',
      {
        fontFamily: 'DM Mono',
        fontSize: width < 600 ? '8px' : '9px',
        color: '#8df4ff',
        fontStyle: 'bold',
        letterSpacing: 1
      }
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(1003)
    .setInteractive({
      useHandCursor: true
    });

retry.on(
  'pointerover',
  () => {
    retry.setColor('#ffffff');
  }
);

retry.on(
  'pointerout',
  () => {
    retry.setColor('#8df4ff');
  }
);

retry.on(
  'pointerdown',
  () => {
    this.retryRelayPuzzle();
  }
);

const difficultyLabel =
  this.add
    .text(
      width / 2,
      height / 2 -
        panelHeight / 2 +
        92,
      securityLevel,
      {
        fontFamily: 'DM Mono',
        fontSize:
          width < 600
            ? '8px'
            : '9px',
        color:
          difficulty >= 3
            ? '#ff826e'
            : '#8df4ff',
        fontStyle: 'bold',
        letterSpacing: 1.2
      }
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(1002);

this.relayPuzzleUI = {
  overlay,
  panel,
  inner,
  title,
  subtitle,
  status,
  timer,
  instruction,
  close,
  retry,
  difficultyLabel,
  grid: null,
  links: null,
  startLabel: null,
  endLabel: null,
  startNode: null,
  endNode: null,
   tiles: [],
  codeButtons: [],
  sequenceButtons: [],
  puzzleObjects: [],
  solved: false
};

  this.createRelayPuzzleContent();

  if (!this.motionReduced) {
    this.tweens.add({
      targets: [
        panel,
        inner
      ],
      alpha: {
        from: 0,
        to: 1
      },
      scale: {
        from: 0.96,
        to: 1
      },
      duration: 220,
      ease: 'Cubic.out'
    });
  }

  this.playerCue(
    this.getRelayPuzzleMeta(
      this.relayPuzzleType
    ).title,
    '#8df4ff'
  );
  this.gadgetPulse(
    0x8df4ff,
    12,
    320
  );
}

  // ============================================================
// RELAY PUZZLE · CONTENT DIRECTOR
// ============================================================

createRelayPuzzleContent() {

  const type =
    this.relayPuzzleType ||
    'circuit';

  switch (type) {

    case 'code':
      return this.createMissionCodePuzzle();

    case 'circuit':
      return this.createRelayCircuitPreview();

    case 'sequence':
      return this.createMissionSequencePuzzle();

    case 'tiles':
      return this.createMissionTilesPuzzle();

    case 'frequency':
      return this.createMissionFrequencyPuzzle();

    case 'grid':
      return this.createMissionGridPuzzle();

    case 'final':
      return this.createMissionFinalPuzzle();

    default:
      this.relayPuzzleType = 'circuit';
      return this.createRelayCircuitPreview();
  }
}

  // ============================================================
// MISSION PUZZLES · STATE
// ============================================================

createMissionPuzzleState() {

  if (!this.relayPuzzleData) {
    this.relayPuzzleData = {};
  }

  this.relayPuzzleData.missionId =
    this.mission?.id || 'unknown';

  this.relayPuzzleData.type =
    this.relayPuzzleType || 'circuit';

  this.relayPuzzleData.difficulty =
    Number(
      this.relayPuzzleGate?.getData(
        'difficulty'
      )
    ) || 1;

  this.relayPuzzleData.puzzleObjects =
    [];

  this.relayPuzzleData.finished =
    false;

  return this.relayPuzzleData;
}

  // ============================================================
// PUZZLE 01 · ACCESS CODE
// ============================================================

createMissionCodePuzzle() {

  const data =
    this.createMissionPuzzleState();

  const ui =
    this.relayPuzzleUI;

  const difficulty =
    data.difficulty;

  const codeLength =
    difficulty >= 3
      ? 5
      : difficulty === 2
        ? 4
        : 3;

  data.code =
    Array.from(
      { length: codeLength },
      () => Phaser.Math.Between(1, 9)
    );

  data.input = [];
  data.codeLocked = false;

  const width =
    this.scale.width;

  const height =
    this.scale.height;

  const centerX =
    width / 2;

  const centerY =
    height / 2;

  const display =
    this.add
      .text(
        centerX,
        centerY - 88,
        `ACCESS CODE  //  ${data.code.join('  ')}`,
        {
          fontFamily: 'DM Mono',
          fontSize:
            width < 600
              ? '13px'
              : '18px',
          color: '#e8fdff',
          fontStyle: 'bold',
          letterSpacing: 2,
          align: 'center',
          stroke: '#07111d',
          strokeThickness: 5
        }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1004);

  data.puzzleObjects.push(
    display
  );

  ui.status?.setText(
    'MEMORIZE SECURITY CODE'
  ).setColor(
    '#8df4ff'
  );

  const revealTime =
    difficulty >= 3
      ? 900
      : difficulty === 2
        ? 1200
        : 1600;

  this.time.delayedCall(
    revealTime,
    () => {

      if (
        !this.relayPuzzleActive ||
        ui.solved
      ) {
        return;
      }

      data.codeLocked =
        true;

      display.setText(
        'ACCESS CODE  //  ' +
        Array(codeLength)
          .fill('?')
          .join('  ')
      );

      ui.status?.setText(
        'CODE HIDDEN · ENTER SEQUENCE'
      ).setColor(
        '#8df4ff'
      );
    }
  );

  // ------------------------------------------------------------
  // INPUT DISPLAY
  // ------------------------------------------------------------

  const slots = [];

  for (
    let i = 0;
    i < codeLength;
    i++
  ) {

    const slot =
      this.add
        .rectangle(
          centerX -
            ((codeLength - 1) * 42) / 2 +
            i * 42,
          centerY - 28,
          34,
          34,
          0x0a1e30,
          0.96
        )
        .setStrokeStyle(
          1.8,
          0x276f8d,
          0.9
        )
        .setScrollFactor(0)
        .setDepth(1003);

    const slotText =
      this.add
        .text(
          slot.x,
          slot.y,
          '?',
          {
            fontFamily: 'DM Mono',
            fontSize: '15px',
            color: '#8df4ff',
            fontStyle: 'bold'
          }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1004);

    data.puzzleObjects.push(
      slot,
      slotText
    );

    slots.push({
      slot,
      text: slotText
    });
  }

  // ------------------------------------------------------------
  // KEYPAD
  // ------------------------------------------------------------

  const keypadStartY =
    centerY + 42;

  for (
    let digit = 1;
    digit <= 9;
    digit++
  ) {

    const index =
      digit - 1;

    const col =
      index % 3;

    const row =
      Math.floor(index / 3);

    const x =
      centerX -
      54 +
      col * 54;

    const y =
      keypadStartY +
      row * 43;

    const button =
      this.add
        .rectangle(
          x,
          y,
          42,
          34,
          0x0a1e30,
          0.96
        )
        .setStrokeStyle(
          1.5,
          0x276f8d,
          0.9
        )
        .setScrollFactor(0)
        .setDepth(1003)
        .setInteractive({
          useHandCursor: true
        });

    const text =
      this.add
        .text(
          x,
          y,
          String(digit),
          {
            fontFamily: 'DM Mono',
            fontSize: '14px',
            color: '#8df4ff',
            fontStyle: 'bold'
          }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1004);

    data.puzzleObjects.push(
      button,
      text
    );

    button.on(
      'pointerover',
      () => {

        if (
          ui.solved ||
          !data.codeLocked
        ) {
          return;
        }

        button.setStrokeStyle(
          2.4,
          0xe8fdff,
          1
        );

        text.setColor(
          '#ffffff'
        );
      }
    );

    button.on(
      'pointerout',
      () => {

        if (
          ui.solved
        ) {
          return;
        }

        button.setStrokeStyle(
          1.5,
          0x276f8d,
          0.9
        );

        text.setColor(
          '#8df4ff'
        );
      }
    );

    button.on(
      'pointerdown',
      () => {

        if (
          ui.solved ||
          !data.codeLocked
        ) {
          return;
        }

        const position =
          data.input.length;

        if (
          position >=
          codeLength
        ) {
          return;
        }

        const expected =
          data.code[position];

        this.relayPuzzleAttempts++;

        if (
          digit !== expected
        ) {

          data.input = [];

          slots.forEach(
            entry => {
              entry.text
                .setText('?');

              entry.slot
                .setStrokeStyle(
                  1.8,
                  0x276f8d,
                  0.9
                );
            }
          );

          ui.status?.setText(
            'WRONG CODE · RESET'
          ).setColor(
            '#ff826e'
          );

    const resetSession =
  this.relayPuzzleSession;

this.time.delayedCall(
  500,
  () => {
    if (
      resetSession !==
      this.relayPuzzleSession
    ) {
      return;
    }

    if (
      this.relayPuzzleActive &&
      !ui.solved
    ) {
                ui.status?.setText(
                  'ENTER SECURITY CODE'
                ).setColor(
                  '#8df4ff'
                );
              }
            }
          );

          return;
        }

        data.input.push(
          digit
        );

        slots[position].text
          .setText(
            String(digit)
          );

        slots[position].slot
          .setStrokeStyle(
            2,
            0x8df4ff,
            1
          );

        ui.status?.setText(
          `CODE INPUT  //  ${data.input.join(' ')}`
        ).setColor(
          '#8df4ff'
        );

        if (
          data.input.length ===
          codeLength
        ) {

          ui.solved =
            true;

          data.finished =
            true;

             ui.status?.setText(
            'ACCESS GRANTED'
          ).setColor(
            '#8df4ff'
          );

          this.missionPuzzleVictoryFX(
            'code',
            this.getRelayPuzzlePerformance().grade
          );

          this.solveRelayGate();
        }
      }
    );
  }
}

  // ============================================================
// PUZZLE 03 · SIGNAL SEQUENCE
// ============================================================

createMissionSequencePuzzle() {

  const data =
    this.createMissionPuzzleState();

  const ui =
    this.relayPuzzleUI;

  const difficulty =
    data.difficulty;

  const length =
    difficulty >= 3
      ? 6
      : difficulty === 2
        ? 5
        : 4;

  data.sequence =
    Phaser.Utils.Array.NumberArray(
      1,
      length
    );

  Phaser.Utils.Array.Shuffle(
    data.sequence
  );

  data.sequenceIndex =
    0;

  data.sequenceLocked =
    false;

  const width =
    this.scale.width;

  const height =
    this.scale.height;

  const cols = 3;

  const buttons = [];

  const sequenceText =
    this.add
      .text(
        width / 2,
        height / 2 - 92,
        `ORDER  //  ${data.sequence.join(' → ')}`,
        {
          fontFamily: 'DM Mono',
          fontSize:
            width < 600
              ? '12px'
              : '16px',
          color: '#e8fdff',
          fontStyle: 'bold',
          letterSpacing: 1.8,
          align: 'center'
        }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1004);

  data.puzzleObjects.push(
    sequenceText
  );

  ui.status?.setText(
    'MEMORIZE SIGNAL ORDER'
  ).setColor(
    '#8df4ff'
  );

 const sequenceRevealSession =
  this.relayPuzzleSession;

this.time.delayedCall(
  difficulty >= 3
    ? 1200
    : difficulty === 2
      ? 1500
      : 1800,
  () => {

    if (
      sequenceRevealSession !==
      this.relayPuzzleSession
    ) {
      return;
    }

    if (
      !this.relayPuzzleActive ||
      ui.solved
    ) {
      return;
    }

    data.sequenceLocked =
      true;

      sequenceText.setText(
        'ORDER  //  ? ? ? ? ? ?'
          .slice(
            0,
            11 +
            length * 2
          )
      );

      ui.status?.setText(
        'ORDER HIDDEN · EXECUTE'
      ).setColor(
        '#8df4ff'
      );
    }
  );

  for (
    let i = 0;
    i < length;
    i++
  ) {

    const col =
      i % cols;

    const row =
      Math.floor(i / cols);

    const x =
      width / 2 -
      55 +
      col * 55;

    const y =
      height / 2 -
      15 +
      row * 55;

    const button =
      this.add
        .circle(
          x,
          y,
          21,
          0x0a1e30,
          0.96
        )
        .setStrokeStyle(
          2,
          0x276f8d,
          0.9
        )
        .setScrollFactor(0)
        .setDepth(1003)
        .setInteractive({
          useHandCursor: true
        });

    const label =
      this.add
        .text(
          x,
          y,
          String(i + 1),
          {
            fontFamily: 'DM Mono',
            fontSize: '13px',
            color: '#8df4ff',
            fontStyle: 'bold'
          }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1004);

    data.puzzleObjects.push(
      button,
      label
    );

    buttons.push(
      button
    );

    button.on(
      'pointerdown',
      () => {

          if (
          ui.solved ||
          !data.sequenceLocked
        ) {
          return;
        }

        this.relayPuzzleAttempts++;

        const expected =
          data.sequence[
            data.sequenceIndex
          ];

        if (
          i !== expected - 1
        ) {

          data.sequenceIndex =
            0;

          buttons.forEach(
            entry => {
              entry.setFillStyle(
                0x0a1e30,
                0.96
              );

              entry.setStrokeStyle(
                2,
                0x276f8d,
                0.9
              );
            }
          );

          ui.status?.setText(
            'SEQUENCE ERROR · RESET'
          ).setColor(
            '#ff826e'
          );

          return;
        }

        button
          .setFillStyle(
            0x12364a,
            1
          )
          .setStrokeStyle(
            2.6,
            0x8df4ff,
            1
          );

        data.sequenceIndex++;

        if (
          data.sequenceIndex >=
          data.sequence.length
        ) {

          ui.solved =
            true;

               ui.status?.setText(
            'SEQUENCE ACCEPTED'
          ).setColor(
            '#8df4ff'
          );

          this.missionPuzzleVictoryFX(
            'sequence',
            this.getRelayPuzzlePerformance().grade
          );

          this.solveRelayGate();
        }
      }
    );
  }
}

// ============================================================
// PUZZLE 04 · ROUTE MATRIX
// Mission: pursuit
// Memory path / tile navigation.
// ============================================================

createMissionTilesPuzzle() {

  const data =
    this.createMissionPuzzleState();

  const ui =
    this.relayPuzzleUI;

  const width =
    this.scale.width;

  const height =
    this.scale.height;

  const difficulty =
    data.difficulty;

  const cols =
    difficulty >= 3 ? 5 : 4;

  const rows = 3;

  const cellSize =
    Math.min(
      46,
      (
        Math.min(width - 100, 300) /
        cols
      )
    );

  const startX =
    width / 2 -
    (
      (cols - 1) *
      cellSize
    ) / 2;

  const startY =
    height / 2 -
    (
      (rows - 1) *
      cellSize
    ) / 2;

  const paths = [
    [0, 1, 2, 3, 7, 11],
    [0, 1, 5, 6, 7, 11],
    [0, 4, 5, 9, 10, 11],
    [0, 1, 5, 9, 10, 11]
  ];

  const path =
    paths[
      Phaser.Math.Between(
        0,
        paths.length - 1
      )
    ];

  data.path =
    path;

  data.pathIndex =
    0;

  data.routeLocked =
    false;

  const cells = [];

  for (
    let index = 0;
    index < cols * rows;
    index++
  ) {

    const col =
      index % cols;

    const row =
      Math.floor(index / cols);

    const x =
      startX +
      col * cellSize;

    const y =
      startY +
      row * cellSize;

    const cell =
      this.add
        .rectangle(
          x,
          y,
          cellSize - 6,
          cellSize - 6,
          0x0a1e30,
          0.96
        )
        .setStrokeStyle(
          1.8,
          0x276f8d,
          0.9
        )
        .setScrollFactor(0)
        .setDepth(1003)
        .setInteractive({
          useHandCursor: true
        });

    data.puzzleObjects.push(
      cell
    );

    cells.push(
      cell
    );
  }

  path.forEach(
    index => {
      cells[index]
        .setFillStyle(
          0x12364a,
          1
        )
        .setStrokeStyle(
          2.5,
          0x8df4ff,
          1
        );
    }
  );

  ui.status?.setText(
    'MEMORIZE ROUTE'
  ).setColor(
    '#8df4ff'
  );

const routeRevealSession =
  this.relayPuzzleSession;

this.time.delayedCall(
  difficulty >= 3
    ? 1000
    : 1400,
  () => {

    if (
      routeRevealSession !==
      this.relayPuzzleSession
    ) {
      return;
    }

    if (
      !this.relayPuzzleActive ||
      ui.solved
    ) {
      return;
    }

    cells.forEach(
      cell => {
        cell.setFillStyle(
          0x0a1e30,
          0.96
        );

        cell.setStrokeStyle(
          1.8,
          0x276f8d,
          0.9
        );
      }
    );

    data.routeLocked =
      true;

    ui.status?.setText(
      'ROUTE HIDDEN · NAVIGATE'
    );
  }
);

  cells.forEach(
    (cell, index) => {

      cell.on(
        'pointerdown',
        () => {

                 if (
            ui.solved ||
            !data.routeLocked
          ) {
            return;
          }

          const expected =
            path[data.pathIndex];

          if (
            index !== expected
          ) {

            data.pathIndex =
              0;

            cells.forEach(
              entry => {
                entry.setFillStyle(
                  0x0a1e30,
                  0.96
                );

                entry.setStrokeStyle(
                  1.8,
                  0x276f8d,
                  0.9
                );
              }
            );

            this.relayPuzzleAttempts++;

            ui.status?.setText(
              'ROUTE LOST · RESET'
            ).setColor(
              '#ff826e'
            );

            return;
          }

          this.relayPuzzleAttempts++;

          cell
            .setFillStyle(
              0x12364a,
              1
            )
            .setStrokeStyle(
              2.5,
              0x8df4ff,
              1
            );

          data.pathIndex++;

          if (
            data.pathIndex >=
            path.length
          ) {

            ui.solved =
              true;

                   ui.status?.setText(
              'ROUTE ESTABLISHED'
            ).setColor(
              '#8df4ff'
            );

            this.missionPuzzleVictoryFX(
              'tiles',
              this.getRelayPuzzlePerformance().grade
            );

            this.solveRelayGate();
          }
        }
      );
    }
  );
}

// ============================================================
// PUZZLE 05 · SIGNAL TUNER
// Mission: signal-storm
// ============================================================

createMissionFrequencyPuzzle() {

  const data =
    this.createMissionPuzzleState();

  const ui =
    this.relayPuzzleUI;

  const width =
    this.scale.width;

  const height =
    this.scale.height;

  const channels =
    data.difficulty >= 3
      ? 4
      : 3;

  data.targets =
    Array.from(
      { length: channels },
      () => Phaser.Math.Between(1, 5)
    );

data.values =
    Array.from(
      { length: channels },
      () => Phaser.Math.Between(1, 5)
    );

  if (
    data.values.every(
      (value, index) =>
        value === data.targets[index]
    )
  ) {
    data.values[0] =
      data.values[0] >= 5
        ? 1
        : data.values[0] + 1;
  }

  const controls = [];

  const startY =
    height / 2 -
    (
      (channels - 1) *
      58
    ) / 2;

  for (
    let i = 0;
    i < channels;
    i++
  ) {

    const y =
      startY +
      i * 58;

    const label =
      this.add
        .text(
          width / 2 - 125,
          y,
          `CH-${String(i + 1).padStart(2, '0')}`,
          {
            fontFamily: 'DM Mono',
            fontSize: '10px',
            color: '#91a9b7',
            fontStyle: 'bold'
          }
        )
        .setOrigin(1, 0.5)
        .setScrollFactor(0)
        .setDepth(1004);

    const target =
      this.add
        .text(
          width / 2 + 110,
          y - 16,
          `TARGET ${data.targets[i]}`,
          {
            fontFamily: 'DM Mono',
            fontSize: '8px',
            color: '#8df4ff'
          }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1004);

    const button =
      this.add
        .rectangle(
          width / 2,
          y,
          190,
          34,
          0x0a1e30,
          0.96
        )
        .setStrokeStyle(
          2,
          0x276f8d,
          0.9
        )
        .setScrollFactor(0)
        .setDepth(1003)
        .setInteractive({
          useHandCursor: true
        });

    const value =
      this.add
        .text(
          width / 2,
          y,
          `FREQ ${data.values[i]}`,
          {
            fontFamily: 'DM Mono',
            fontSize: '11px',
            color: '#8df4ff',
            fontStyle: 'bold'
          }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1004);

    data.puzzleObjects.push(
      label,
      target,
      button,
      value
    );

    controls.push({
      button,
      value,
      target: data.targets[i],
      index: i
    });

    button.on(
      'pointerdown',
      () => {

        if (
          ui.solved
        ) {
          return;
        }

        data.values[i] =
          data.values[i] >= 5
            ? 1
            : data.values[i] + 1;

        value.setText(
          `FREQ ${data.values[i]}`
        );

        this.relayPuzzleAttempts++;

        button.setStrokeStyle(
          2.4,
          data.values[i] ===
          data.targets[i]
            ? 0x8df4ff
            : 0x276f8d,
          1
        );

        const solved =
          data.values.every(
            (entry, index) =>
              entry ===
              data.targets[index]
          );

        if (
          solved
        ) {

          ui.solved =
            true;

                 ui.status?.setText(
            'FREQUENCY LOCKED'
          ).setColor(
            '#8df4ff'
          );

          this.missionPuzzleVictoryFX(
            'frequency',
            this.getRelayPuzzlePerformance().grade
          );

          this.solveRelayGate();

        } else {

          ui.status?.setText(
            'TUNE ALL CHANNELS'
          ).setColor(
            '#8df4ff'
          );
        }
      }
    );
  }

  ui.status?.setText(
    'TUNE SIGNAL INTO TARGET BANDS'
  ).setColor(
    '#8df4ff'
  );
}

// ============================================================
// PUZZLE 06 · SECURITY GRID
// Mission: corporate-lockdown
// ============================================================

createMissionGridPuzzle() {

  const data =
    this.createMissionPuzzleState();

  const ui =
    this.relayPuzzleUI;

  const width =
    this.scale.width;

  const height =
    this.scale.height;

  const size =
    data.difficulty >= 3
      ? 5
      : 4;

  const cellSize =
    Math.min(
      42,
      (Math.min(width - 90, 260) / size)
    );

  const originX =
    width / 2 -
    (
      (size - 1) *
      cellSize
    ) / 2;

  const originY =
    height / 2 -
    (
      (size - 1) *
      cellSize
    ) / 2;

  const route = [];

  for (
    let i = 0;
    i < size;
    i++
  ) {
    route.push(
      i * size
    );
  }

  for (
    let row = 1;
    row < size;
    row++
  ) {
    route.push(
      row * size +
      (size - 1)
    );
  }

  data.route =
    route;

  data.routeIndex =
    0;

  data.routeLocked =
    false;

  const cells = [];

  for (
    let index = 0;
    index < size * size;
    index++
  ) {

    const col =
      index % size;

    const row =
      Math.floor(index / size);

    const cell =
      this.add
        .rectangle(
          originX +
            col * cellSize,
          originY +
            row * cellSize,
          cellSize - 5,
          cellSize - 5,
          0x0a1e30,
          0.96
        )
        .setStrokeStyle(
          1.5,
          0x276f8d,
          0.9
        )
        .setScrollFactor(0)
        .setDepth(1003)
        .setInteractive({
          useHandCursor: true
        });

    data.puzzleObjects.push(
      cell
    );

    cells.push(
      cell
    );
  }

  route.forEach(
    index => {
      cells[index]
        .setFillStyle(
          0x12364a,
          1
        )
        .setStrokeStyle(
          2.4,
          0x8df4ff,
          1
        );
    }
  );

  ui.status?.setText(
    'SECURITY PATH DETECTED'
  ).setColor(
    '#8df4ff'
  );

const gridRevealSession =
  this.relayPuzzleSession;

this.time.delayedCall(
  data.difficulty >= 3
    ? 1000
    : 1350,
  () => {

    if (
      gridRevealSession !==
      this.relayPuzzleSession
    ) {
      return;
    }

    if (
      !this.relayPuzzleActive ||
      ui.solved
    ) {
      return;
    }

    cells.forEach(
      cell => {
        cell.setFillStyle(
          0x0a1e30,
          0.96
        );

        cell.setStrokeStyle(
          1.5,
          0x276f8d,
          0.9
        );
      }
    );

    data.routeLocked =
      true;

    ui.status?.setText(
      'GRID ARMED · FIND SAFE PATH'
    );
  }
);

  cells.forEach(
    (cell, index) => {

      cell.on(
        'pointerdown',
        () => {

                   if (
            ui.solved ||
            !data.routeLocked
          ) {
            return;
          }

          const expected =
            route[data.routeIndex];

          this.relayPuzzleAttempts++;

          if (
            index !== expected
          ) {

            data.routeIndex =
              0;

            cells.forEach(
              entry => {
                entry.setFillStyle(
                  0x0a1e30,
                  0.96
                );

                entry.setStrokeStyle(
                  1.5,
                  0x276f8d,
                  0.9
                );
              }
            );

            ui.status?.setText(
              'INTRUSION DETECTED · RESET'
            ).setColor(
              '#ff826e'
            );

            return;
          }

          cell
            .setFillStyle(
              0x12364a,
              1
            )
            .setStrokeStyle(
              2.6,
              0x8df4ff,
              1
            );

          data.routeIndex++;

          if (
            data.routeIndex >=
            route.length
          ) {

            ui.solved =
              true;

                     ui.status?.setText(
              'SECURITY BREACH PREVENTED'
            ).setColor(
              '#8df4ff'
            );

            this.missionPuzzleVictoryFX(
              'grid',
              this.getRelayPuzzlePerformance().grade
            );

            this.solveRelayGate();
          }
        }
      );
    }
  );
}

// ============================================================
// PUZZLE 07 · APEX RELAY
// Mission: final-relay
// Three-core synchronization.
// ============================================================

createMissionFinalPuzzle() {

  const data =
    this.createMissionPuzzleState();

  const ui =
    this.relayPuzzleUI;

  const width =
    this.scale.width;

  const height =
    this.scale.height;

  const cores =
    3;

  data.targetStates =
    [
      Phaser.Math.Between(0, 2),
      Phaser.Math.Between(0, 2),
      Phaser.Math.Between(0, 2)
    ];

data.states =
    [
      Phaser.Math.Between(0, 2),
      Phaser.Math.Between(0, 2),
      Phaser.Math.Between(0, 2)
    ];

  if (
    data.states.every(
      (state, index) =>
        state === data.targetStates[index]
    )
  ) {
    data.states[0] =
      (data.states[0] + 1) % 3;
  }

  const controls = [];

  const startX =
    width / 2 -
    105;

  for (
    let i = 0;
    i < cores;
    i++
  ) {

    const x =
      startX +
      i * 105;

    const core =
      this.add
        .circle(
          x,
          height / 2,
          34,
          0x0a1e30,
          0.96
        )
        .setStrokeStyle(
          2.5,
          0x276f8d,
          0.95
        )
        .setScrollFactor(0)
        .setDepth(1003)
        .setInteractive({
          useHandCursor: true
        });

    const value =
      this.add
        .text(
          x,
          height / 2,
          'SYNC 0',
          {
            fontFamily: 'DM Mono',
            fontSize: '9px',
            color: '#8df4ff',
            fontStyle: 'bold'
          }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1004);

    const target =
      this.add
        .text(
          x,
          height / 2 + 56,
          `TARGET ${data.targetStates[i]}`,
          {
            fontFamily: 'DM Mono',
            fontSize: '8px',
            color: '#91a9b7'
          }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1004);

    data.puzzleObjects.push(
      core,
      value,
      target
    );

    controls.push({
      core,
      value,
      target,
      index: i
    });

    core.on(
      'pointerdown',
      () => {

        if (
          ui.solved
        ) {
          return;
        }

        data.states[i] =
          (
            data.states[i] + 1
          ) % 3;

        value.setText(
          `SYNC ${data.states[i]}`
        );

        this.relayPuzzleAttempts++;

      const correct =
  data.states[i] ===
  data.targetStates[i];

core.setStrokeStyle(
  2.8,
  correct
    ? 0x8df4ff
    : 0x276f8d,
  1
);

/*
 * ----------------------------------------------------------
 * APEX CORE FEEDBACK
 * ----------------------------------------------------------
 */
if (correct) {
  ui.status?.setText(
    `CORE ${String(i + 1).padStart(2, '0')} // SYNCHRONIZED`
  ).setColor(
    '#8df4ff'
  );

  this.tweens.killTweensOf(
    core
  );

  if (!this.motionReduced) {
    this.tweens.add({
      targets: core,
      scaleX: 1.16,
      scaleY: 1.16,
      duration: 110,
      yoyo: true,
      ease: 'Quad.out'
    });
  }
} else {
  ui.status?.setText(
    `CORE ${String(i + 1).padStart(2, '0')} // RESYNC REQUIRED`
  ).setColor(
    '#ff826e'
  );
}

      core.setFillStyle(
  correct
    ? 0x18384a
    : 0x0a1e30,
  1
);

core.setStrokeStyle(
  correct
    ? 3.2
    : 2,
  correct
    ? 0xffd06e
    : 0x2b6f8f,
  1
);

if (
  correct &&
  !this.motionReduced
) {
  this.tweens.killTweensOf(
    core
  );

  this.tweens.add({
    targets: core,
    scaleX: 1.12,
    scaleY: 1.12,
    duration: 90,
    yoyo: true,
    ease: 'Quad.out'
  });
}

        const solved =
          data.states.every(
            (entry, index) =>
              entry ===
              data.targetStates[index]
          );

       if (
  solved
) {

  ui.solved =
    true;

  ui.status?.setText(
    'APEX RELAY // FULL SYNC'
  ).setColor(
    '#fff0a8'
  );

  /*
   * --------------------------------------------------------
   * FINAL CORE CONFIRMATION
   * --------------------------------------------------------
   */
  controls.forEach(
    entry => {
      if (!entry?.core) {
        return;
      }

      entry.core.setStrokeStyle(
        3.2,
        0xffd06e,
        1
      );

      entry.core.setFillStyle(
        0x18384a,
        1
      );

      if (!this.motionReduced) {
        this.tweens.killTweensOf(
          entry.core
        );

        this.tweens.add({
          targets: entry.core,
          scaleX: 1.22,
          scaleY: 1.22,
          duration: 160,
          delay:
            entry.index * 80,
          yoyo: true,
          ease: 'Cubic.out'
        });
      }
    }
  );

  this.missionPuzzleVictoryFX(
    'final',
    this.getRelayPuzzlePerformance().grade
  );

  this.solveRelayGate();

        } else {

          ui.status?.setText(
            'SYNCHRONIZE ALL CORE NODES'
          ).setColor(
            '#8df4ff'
          );
        }
      }
    );
  }

  ui.status?.setText(
    'FINAL PROTOCOL // SYNCHRONIZE CORES'
  ).setColor(
    '#8df4ff'
  );
}

  // ============================================================
// RELAY GATE · SOLVABLE CIRCUIT NETWORK
// ============================================================

rotateRelayMask(mask, turns = 1) {
  const normalized =
    ((Number(turns) % 4) + 4) % 4;

  let result = mask;

  for (let i = 0; i < normalized; i++) {
    let next = 0;

    if (result & 1) next |= 2;
    if (result & 2) next |= 4;
    if (result & 4) next |= 8;
    if (result & 8) next |= 1;

    result = next;
  }

  return result;
}

relayCircuitReachable(
  masks,
  columns,
  rows
) {
  const total =
    columns * rows;

  if (
    !Array.isArray(masks) ||
    masks.length !== total
  ) {
    return new Set();
  }

  const NORTH = 1;
  const EAST = 2;
  const SOUTH = 4;
  const WEST = 8;

  const queue = [0];
  const visited = new Set([0]);

  const opposite = {
    [NORTH]: SOUTH,
    [EAST]: WEST,
    [SOUTH]: NORTH,
    [WEST]: EAST
  };

  const deltas = [
    [NORTH, 0, -1],
    [EAST, 1, 0],
    [SOUTH, 0, 1],
    [WEST, -1, 0]
  ];

  while (queue.length) {
    const index =
      queue.shift();

    const row =
      Math.floor(index / columns);

    const col =
      index % columns;

    for (const [bit, dx, dy] of deltas) {
      if (!(masks[index] & bit)) {
        continue;
      }

      const nextCol =
        col + dx;

      const nextRow =
        row + dy;

      if (
        nextCol < 0 ||
        nextCol >= columns ||
        nextRow < 0 ||
        nextRow >= rows
      ) {
        continue;
      }

      const nextIndex =
        nextRow * columns +
        nextCol;

      if (
        !(masks[nextIndex] & opposite[bit])
      ) {
        continue;
      }

      if (!visited.has(nextIndex)) {
        visited.add(nextIndex);
        queue.push(nextIndex);
      }
    }
  }

  return visited;
}

generateRelayPuzzle() {
  const difficulty =
    Number(
      this.relayPuzzleGate?.getData('difficulty')
    ) || 1;

  const columns =
    difficulty >= 3
      ? 5
      : 4;

  const rows =
    difficulty >= 3
      ? 3
      : difficulty === 2
        ? 3
        : 2;

  const count =
    columns * rows;

  const NORTH = 1;
  const EAST = 2;
  const SOUTH = 4;
  const WEST = 8;

  const solvedMasks =
    Array(count).fill(0);

  const path = [];

  for (
    let row = 0;
    row < rows;
    row++
  ) {
    if (row % 2 === 0) {
      for (
        let col = 0;
        col < columns;
        col++
      ) {
        path.push(
          row * columns + col
        );
      }
    } else {
      for (
        let col = columns - 1;
        col >= 0;
        col--
      ) {
        path.push(
          row * columns + col
        );
      }
    }
  }

  const directionBetween =
    (a, b) => {
      const ar =
        Math.floor(a / columns);

      const ac =
        a % columns;

      const br =
        Math.floor(b / columns);

      const bc =
        b % columns;

      if (
        br === ar - 1 &&
        bc === ac
      ) {
        return NORTH;
      }

      if (
        br === ar &&
        bc === ac + 1
      ) {
        return EAST;
      }

      if (
        br === ar + 1 &&
        bc === ac
      ) {
        return SOUTH;
      }

      if (
        br === ar &&
        bc === ac - 1
      ) {
        return WEST;
      }

      return 0;
    };

  for (
    let i = 0;
    i < path.length;
    i++
  ) {
    const index =
      path[i];

    const previous =
      i > 0
        ? path[i - 1]
        : null;

    const next =
      i < path.length - 1
        ? path[i + 1]
        : null;

    if (previous !== null) {
      solvedMasks[index] |=
        directionBetween(
          index,
          previous
        );
    }

    if (next !== null) {
      solvedMasks[index] |=
        directionBetween(
          index,
          next
        );
    }
  }

let rotations = [];
let masks = [];

const difficultyProfile = {
  1: {
    minRotated: 3,
    minQuarterTurns: 4
  },
  2: {
    minRotated: 6,
    minQuarterTurns: 9
  },
  3: {
    minRotated: 9,
    minQuarterTurns: 14
  }
}[Math.min(3, Math.max(1, difficulty))];

let generated = false;

for (
  let attempt = 0;
  attempt < 80;
  attempt++
) {
  const candidateRotations =
    solvedMasks.map(() =>
      Phaser.Math.Between(0, 3)
    );

  if (
    candidateRotations.filter(
      value => value !== 0
    ).length <
    difficultyProfile.minRotated
  ) {
    continue;
  }

  const totalQuarterTurns =
    candidateRotations.reduce(
      (sum, value) =>
        sum + value,
      0
    );

  if (
    totalQuarterTurns <
    difficultyProfile.minQuarterTurns
  ) {
    continue;
  }

  const candidateMasks =
    solvedMasks.map(
      (mask, index) => {
        let rotation =
          candidateRotations[index];

        if (
          index === 0 &&
          rotation === 0
        ) {
          rotation = 1;
        }

        if (
          index === count - 1 &&
          rotation === 0
        ) {
          rotation = 1;
        }

        candidateRotations[index] =
          rotation;

        return this.rotateRelayMask(
          mask,
          rotation
        );
      }
    );

  const reachable =
    this.relayCircuitReachable(
      candidateMasks,
      columns,
      rows
    );

  if (
    reachable.has(
      count - 1
    )
  ) {
    continue;
  }

  rotations =
    candidateRotations;

  masks =
    candidateMasks;

  generated = true;
  break;
}

if (!generated) {
  rotations =
    solvedMasks.map(
      () => 1
    );

  masks =
    solvedMasks.map(
      (mask, index) =>
        this.rotateRelayMask(
          mask,
          rotations[index]
        )
    );
}

const baselineAttempts =
  rotations.reduce(
    (total, rotation) =>
      total +
      (
        (4 - rotation) % 4
      ),
    0
  );

this.relayPuzzleData = {
  columns,
  rows,
  count,
  solvedMasks,
  rotations,
  masks,
  baselineAttempts
};
}

drawRelayCircuitState() {
  const ui =
    this.relayPuzzleUI;

  const data =
    this.relayPuzzleData;

  if (!ui || !data) {
    return;
  }

  const masks =
    data.tiles?.map(
      entry => {
        const mask =
          this.rotateRelayMask(
            entry.baseMask,
            entry.rotation / 90
          );

        entry.currentMask =
          mask;

        return mask;
      }
    ) || [];

  data.masks =
    masks;

  const reachable =
    this.relayCircuitReachable(
      masks,
      data.columns,
      data.rows
    );

  const endIndex =
    data.count - 1;

  if (ui.links) {
    ui.links.clear();

    for (
      let index = 0;
      index < data.count;
      index++
    ) {
      const row =
        Math.floor(
          index / data.columns
        );

      const col =
        index % data.columns;

      const x =
        data.originX +
        col *
          (data.tileSize + data.gap);

      const y =
        data.originY +
        row *
          (data.tileSize + data.gap);

      const mask =
        masks[index];

      if (
        mask & 2 &&
        col < data.columns - 1 &&
        masks[index + 1] & 8
      ) {
        const connected =
          reachable.has(index) &&
          reachable.has(index + 1);

        ui.links.lineStyle(
          4,
          connected
            ? 0x8df4ff
            : 0x55dfff,
          connected
            ? 0.55
            : 0.16
        );

        ui.links.lineBetween(
          x + data.tileSize / 2,
          y,
          x +
            data.tileSize / 2 +
            data.gap,
          y
        );
      }

      if (
        mask & 4 &&
        row < data.rows - 1 &&
        masks[index + data.columns] & 1
      ) {
        const nextY =
          y +
          data.tileSize +
          data.gap;

        const connected =
          reachable.has(index) &&
          reachable.has(
            index + data.columns
          );

        ui.links.lineStyle(
          4,
          connected
            ? 0x8df4ff
            : 0x55dfff,
          connected
            ? 0.55
            : 0.16
        );

        ui.links.lineBetween(
          x,
          y + data.tileSize / 2,
          x,
          nextY -
            data.tileSize / 2
        );
      }
    }
  }

  ui.tiles?.forEach(
    (entry, index) => {
      const active =
        reachable.has(index);

      entry.connected =
        active;

    entry.tile
  .setFillStyle(
    active
      ? 0x12364a
      : 0x0a1e30,
    active
      ? 0.98
      : 0.96
  )
  .setStrokeStyle(
    active ? 2.2 : 1.5,
    active
      ? 0x8df4ff
      : 0x276f8d,
    active
      ? 0.95
      : 0.8
  );

entry.core.setFillStyle(
        active
          ? 0xe8fdff
          : 0x8df4ff,
        active
          ? 1
          : 0.75
      );

      entry.core.setScale(
        active ? 1.2 : 1
      );

      entry.wire.clear();

      const mask =
        entry.currentMask;

      entry.wire.lineStyle(
        active ? 4.5 : 3.5,
        active
          ? 0x8df4ff
          : 0x55dfff,
        active
          ? 0.92
          : 0.28
      );

      const half =
        data.tileSize * 0.39;

      if (mask & 1) {
        entry.wire.lineBetween(
          0,
          0,
          0,
          -half
        );
      }

      if (mask & 2) {
        entry.wire.lineBetween(
          0,
          0,
          half,
          0
        );
      }

      if (mask & 4) {
        entry.wire.lineBetween(
          0,
          0,
          0,
          half
        );
      }

      if (mask & 8) {
        entry.wire.lineBetween(
          0,
          0,
          -half,
          0
        );
      }
    }
  );

  if (
    reachable.has(
      endIndex
    )
  ) {
    ui.status?.setText(
      `PATH LINKED · ${this.relayPuzzleAttempts} INPUTS`
    ).setColor(
      '#8df4ff'
    );

if (!ui.solved) {
  ui.solved = true;

this.missionPuzzleVictoryFX(
  this.relayPuzzleType,
  this.getRelayPuzzlePerformance().grade
);

  this.solveRelayGate();
}

    return true;
  }

  ui.status?.setText(
    `SIGNAL ${reachable.size}/${data.count} · INPUTS ${this.relayPuzzleAttempts}`
  ).setColor(
    reachable.size > 1
      ? '#8df4ff'
      : '#55dfff'
  );

  return false;
}

createRelayCircuitPreview() {
  if (!this.relayPuzzleUI) {
    return;
  }

  this.generateRelayPuzzle();

  const width =
    this.scale.width;

  const height =
    this.scale.height;

  const data =
    this.relayPuzzleData;

  const gap =
    Math.min(
      10,
      Math.max(
        6,
        width * 0.014
      )
    );

  const availableWidth =
    Math.min(
      width - 86,
      460
    );

  const availableHeight =
    Math.min(
      height * 0.48,
      290
    );

  const tileSize =
    Math.min(
      68,
      (
        availableWidth -
        (data.columns - 1) * gap
      ) / data.columns,
      (
        availableHeight -
        (data.rows - 1) * gap
      ) / data.rows
    );

  data.tileSize =
    tileSize;

  data.gap =
    gap;

  const totalWidth =
    data.columns * tileSize +
    (data.columns - 1) * gap;

  const totalHeight =
    data.rows * tileSize +
    (data.rows - 1) * gap;

  data.originX =
    width / 2 -
    totalWidth / 2 +
    tileSize / 2;

  data.originY =
    height / 2 -
    totalHeight / 2 +
    tileSize / 2 +
    8;

  const grid =
    this.add
      .rectangle(
        width / 2,
        data.originY +
          totalHeight / 2,
        totalWidth + 34,
        totalHeight + 34,
        0x06121f,
        0.82
      )
      .setStrokeStyle(
        1,
        0x276f8d,
        0.32
      )
      .setScrollFactor(0)
      .setDepth(1001);

  const links =
    this.add
      .graphics()
      .setScrollFactor(0)
      .setDepth(1002);

  const startLabel =
    this.add
      .text(
        data.originX -
          tileSize / 2 -
          12,
        data.originY,
        'START',
        {
          fontFamily: 'DM Mono',
          fontSize: '9px',
          color: '#8df4ff',
          stroke: '#07111d',
          strokeThickness: 3,
          align: 'right'
        }
      )
      .setOrigin(1, 0.5)
      .setScrollFactor(0)
      .setDepth(1004);

  const endIndex =
    data.count - 1;

  const endRow =
    Math.floor(
      endIndex /
        data.columns
    );

  const endCol =
    endIndex %
    data.columns;

  const endX =
    data.originX +
    endCol *
      (tileSize + gap);

  const endY =
    data.originY +
    endRow *
      (tileSize + gap);

  const endLabel =
    this.add
      .text(
        endX +
          tileSize / 2 +
          12,
        endY,
        'END',
        {
          fontFamily: 'DM Mono',
          fontSize: '9px',
          color: '#8df4ff',
          stroke: '#07111d',
          strokeThickness: 3,
          align: 'left'
        }
      )
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(1004);

  this.relayPuzzleUI.grid =
    grid;

  this.relayPuzzleUI.links =
    links;

  this.relayPuzzleUI.startLabel =
    startLabel;

 this.relayPuzzleUI.endLabel =
  endLabel;

// ============================================================
// RELAY TERMINALS · START / END ENERGY NODES
// ============================================================

const startNode =
  this.add
    .circle(
      data.originX -
        tileSize / 2 -
        24,
      data.originY,
      7,
      0x8df4ff,
      0.16
    )
    .setStrokeStyle(
      2,
      0x8df4ff,
      0.9
    )
    .setScrollFactor(0)
    .setDepth(1005);

const endNode =
  this.add
    .circle(
      endX +
        tileSize / 2 +
        24,
      endY,
      7,
      0x8df4ff,
      0.16
    )
    .setStrokeStyle(
      2,
      0x8df4ff,
      0.9
    )
    .setScrollFactor(0)
    .setDepth(1005);

this.relayPuzzleUI.startNode =
  startNode;

this.relayPuzzleUI.endNode =
  endNode;

if (!this.motionReduced) {
  this.tweens.add({
    targets: [
      startNode,
      endNode
    ],
    scale: {
      from: 0.82,
      to: 1.28
    },
    alpha: {
      from: 0.45,
      to: 1
    },
    duration: 720,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut'
  });
}

  this.relayPuzzleUI.tiles =
    [];

  const tiles = [];

  for (
    let index = 0;
    index < data.count;
    index++
  ) {
    const row =
      Math.floor(
        index /
          data.columns
      );

    const col =
      index %
      data.columns;

    const x =
      data.originX +
      col *
        (tileSize + gap);

    const y =
      data.originY +
      row *
        (tileSize + gap);

    const tile =
      this.add
        .rectangle(
          x,
          y,
          tileSize,
          tileSize,
          0x0a1e30,
          0.96
        )
        .setStrokeStyle(
          1.5,
          0x276f8d,
          0.8
        )
        .setScrollFactor(0)
        .setDepth(1003)
        .setInteractive({
          useHandCursor: true
        });

    const wire =
      this.add
        .graphics()
        .setPosition(x, y)
        .setScrollFactor(0)
        .setDepth(1004);

    const core =
      this.add
        .circle(
          x,
          y,
          4,
          0x8df4ff,
          0.86
        )
        .setScrollFactor(0)
        .setDepth(1005);

    const entry = {
      tile,
      wire,
      core,
      baseMask:
        data.solvedMasks[index],
      rotation:
        data.rotations[index] *
        90,
      currentMask: 0,
      connected: false
    };

    tile.setData(
      'relayIndex',
      index
    );

    tile.on(
      'pointerover',
      () => {
        if (
          this.relayPuzzleUI?.solved
        ) {
          return;
        }

        tile.setStrokeStyle(
          2.4,
          0xe8fdff,
          1
        );

        core.setScale(
          1.35
        );
      }
    );

    tile.on(
      'pointerout',
      () => {
        if (
          this.relayPuzzleUI?.solved
        ) {
          return;
        }

        tile.setStrokeStyle(
          entry.connected
            ? 2.2
            : 1.5,
          entry.connected
            ? 0x8df4ff
            : 0x276f8d,
          entry.connected
            ? 0.95
            : 0.8
        );

        core.setScale(
          entry.connected
            ? 1.2
            : 1
        );
      }
    );

    tile.on(
      'pointerdown',
      () => {
        if (
          this.relayPuzzleUI?.solved
        ) {
          return;
        }

      entry.rotation =
  (
    entry.rotation +
    90
  ) % 360;

this.relayPuzzleAttempts++;

this.tweens.killTweensOf(
  tile
);

tile.angle =
  entry.rotation;

if (!this.motionReduced) {
  this.tweens.add({
    targets: tile,
    scaleX: 1.08,
    scaleY: 1.08,
    duration: 80,
    yoyo: true,
    ease: 'Quad.out'
  });
}

this.tweens.add({
  targets: core,
  scaleX: 1.65,
  scaleY: 1.65,
  alpha: 0.25,
  duration: 140,
  yoyo: true,
  ease: 'Quad.out'
});

this.drawRelayCircuitState();
      }
    );

    tile.angle =
      entry.rotation;

    tiles.push(entry);
  }

  data.tiles =
    tiles;

  this.relayPuzzleUI.tiles =
    tiles;

  this.drawRelayCircuitState();
}

validateRelayPuzzle() {
  if (
    !this.relayPuzzleUI ||
    !this.relayPuzzleData ||
    this.relayPuzzleUI.solved
  ) {
    return false;
  }

  return this.drawRelayCircuitState();
}

/*
 * ============================================================
 * RELAY PUZZLE · PERFORMANCE RATING
 * Measures efficiency without affecting gameplay.
 * ============================================================
 */

getRelayPuzzlePerformance() {
  const data =
    this.relayPuzzleData || {};

  const type =
    this.relayPuzzleType || 'circuit';

  const difficulty =
    Number(
      data.difficulty ??
      this.relayPuzzleGate?.getData?.('difficulty')
    ) || 1;

  const attempts =
    Math.max(
      0,
      Number(
        this.relayPuzzleAttempts
      ) || 0
    );

  const elapsedMs =
    Math.max(
      0,
      this.time.now -
        (
          this.relayPuzzleStartedAt ||
          this.time.now
        )
    );

  /*
   * ============================================================
   * CIRCUIT
   * Keep the original circuit performance model.
   * ============================================================
   */
  if (
    type === 'circuit' &&
    data?.rotations?.length
  ) {
    const baselineAttempts =
      Math.max(
        1,
        Number(
          data.baselineAttempts
        ) || 1
      );

    const efficiency =
      Phaser.Math.Clamp(
        baselineAttempts /
          Math.max(
            baselineAttempts,
            attempts
          ),
        0,
        1
      );

    let grade = 'C';

    if (
      attempts <= baselineAttempts &&
      elapsedMs <= 5500
    ) {
      grade = 'S';
    } else if (
      efficiency >= 0.88 &&
      elapsedMs <= 8000
    ) {
      grade = 'A';
    } else if (
      efficiency >= 0.70
    ) {
      grade = 'B';
    }

    return {
      attempts,
      elapsedMs,
      baselineAttempts,
      efficiency,
      grade
    };
  }

  /*
   * ============================================================
   * MISSION PUZZLES
   * Each puzzle receives its own fair interaction baseline.
   * ============================================================
   */

  let baselineAttempts = 1;

  switch (type) {

    /*
     * ACCESS CODE
     * One correct input per digit.
     */
    case 'code': {
      const codeLength =
        Array.isArray(data.code)
          ? data.code.length
          : difficulty >= 3
            ? 5
            : difficulty === 2
              ? 4
              : 3;

      baselineAttempts =
        Math.max(
          1,
          codeLength
        );

      break;
    }

    /*
     * GRID SEQUENCE
     * One correct node per sequence step.
     */
    case 'sequence': {
      const sequenceLength =
        Array.isArray(data.sequence)
          ? data.sequence.length
          : difficulty >= 3
            ? 6
            : difficulty === 2
              ? 5
              : 4;

      baselineAttempts =
        Math.max(
          1,
          sequenceLength
        );

      break;
    }

    /*
     * ROUTE MATRIX
     * One correct tile per route step.
     */
    case 'tiles': {
      const pathLength =
        Array.isArray(data.path)
          ? data.path.length
          : 1;

      baselineAttempts =
        Math.max(
          1,
          pathLength
        );

      break;
    }

    /*
     * SIGNAL TUNER
     * Baseline is based on the number of channels
     * plus the minimum circular tuning distance.
     */
    case 'frequency': {
      if (
        Array.isArray(data.values) &&
        Array.isArray(data.targets) &&
        data.values.length ===
          data.targets.length
      ) {
        baselineAttempts =
          data.values.reduce(
            (
              total,
              value,
              index
            ) => {
              const current =
                Number(value) || 1;

              const target =
                Number(
                  data.targets[index]
                ) || 1;

              const forward =
                (
                  target -
                  current +
                  5
                ) % 5;

              return (
                total +
                forward
              );
            },
            0
          );
      } else {
        baselineAttempts =
          difficulty >= 3
            ? 4
            : 3;
      }

      baselineAttempts =
        Math.max(
          1,
          baselineAttempts
        );

      break;
    }

    /*
     * SECURITY GRID
     * One correct cell per route step.
     */
    case 'grid': {
      const routeLength =
        Array.isArray(data.route)
          ? data.route.length
          : difficulty >= 3
            ? 9
            : 7;

      baselineAttempts =
        Math.max(
          1,
          routeLength
        );

      break;
    }

    /*
     * APEX RELAY
     * Each core is a 3-state cycle.
     * Count the minimum forward taps needed
     * from the generated starting state to target.
     */
    case 'final': {
      if (
        Array.isArray(data.states) &&
        Array.isArray(data.targetStates) &&
        data.states.length ===
          data.targetStates.length
      ) {
        baselineAttempts =
          data.states.reduce(
            (
              total,
              state,
              index
            ) => {
              const current =
                Number(state) || 0;

              const target =
                Number(
                  data.targetStates[index]
                ) || 0;

              return (
                total +
                (
                  target -
                  current +
                  3
                ) % 3
              );
            },
            0
          );
      } else {
        baselineAttempts = 3;
      }

      baselineAttempts =
        Math.max(
          1,
          baselineAttempts
        );

      break;
    }

    default:
      baselineAttempts =
        Math.max(
          1,
          difficulty + 2
        );
      break;
  }

  /*
   * ============================================================
   * FAIRNESS / EFFICIENCY
   * Extra clicks reduce efficiency.
   * Faster completion improves the grade.
   * ============================================================
   */

  const efficiency =
    Phaser.Math.Clamp(
      baselineAttempts /
        Math.max(
          baselineAttempts,
          attempts
        ),
      0,
      1
    );

  /*
   * Different puzzles have different reasonable solve times.
   */
  const timeLimitS =
    type === 'code'
      ? difficulty >= 3 ? 5.5 : 7
      : type === 'sequence'
        ? difficulty >= 3 ? 7 : 9
        : type === 'tiles'
          ? difficulty >= 3 ? 7 : 9
          : type === 'frequency'
            ? difficulty >= 3 ? 8 : 10
            : type === 'grid'
              ? difficulty >= 3 ? 8 : 10
              : type === 'final'
                ? difficulty >= 3 ? 7 : 9
                : 8;

  const timeLimitMs =
    timeLimitS * 1000;

  /*
   * S = baseline or better + fast solve
   * A = very efficient + good time
   * B = solid completion
   * C = slower / inefficient
   */
  let grade = 'C';

  if (
    attempts <= baselineAttempts &&
    elapsedMs <= timeLimitMs
  ) {
    grade = 'S';
  } else if (
    efficiency >= 0.88 &&
    elapsedMs <= timeLimitMs * 1.35
  ) {
    grade = 'A';
  } else if (
    efficiency >= 0.70 &&
    elapsedMs <= timeLimitMs * 1.9
  ) {
    grade = 'B';
  }

  return {
    attempts,
    elapsedMs,
    baselineAttempts,
    efficiency,
    grade
  };
}

/*
 * ============================================================
 * RELAY PUZZLE · COMPLETION ENERGY SURGE
 * Visual-only completion burst.
 * ============================================================
 */

missionPuzzleVictoryFX(
  type = 'circuit',
  grade = 'C'
) {

  const ui =
    this.relayPuzzleUI;

  if (
    !ui ||
    this.motionReduced
  ) {
    return;
  }

  /*
   * ============================================================
   * UNIVERSAL PUZZLE VICTORY FX
   * Every puzzle gets its own visual identity.
   * Purely visual — no gameplay/state mutation.
   * ============================================================
   */

  const width =
    this.scale.width;

  const height =
    this.scale.height;

  const centerX =
    width / 2;

  const centerY =
    height / 2;

  const gradeColor =
    grade === 'S'
      ? 0xfff0a8
      : grade === 'A'
        ? 0x8df4ff
        : grade === 'B'
          ? 0xaee37f
          : 0xff826e;

  /*
   * ------------------------------------------------------------
   * CORE BURST
   * ------------------------------------------------------------
   */

  const burst =
    this.add
      .circle(
        centerX,
        centerY,
        10,
        gradeColor,
        0.24
      )
      .setScrollFactor(0)
      .setDepth(1008);

  burst.setStrokeStyle(
    2,
    0xe8fdff,
    0.9
  );

  this.tweens.add({
    targets: burst,

    scaleX: 7,
    scaleY: 7,

    alpha: 0,

    duration: 520,

    ease: 'Cubic.out',

    onComplete: () =>
      burst.destroy()
  });

  /*
   * ------------------------------------------------------------
   * SECONDARY SHOCK RING
   * ------------------------------------------------------------
   */

  const shock =
    this.add
      .circle(
        centerX,
        centerY,
        24,
        gradeColor,
        0
      )
      .setScrollFactor(0)
      .setDepth(1007);

  shock.setStrokeStyle(
    2,
    gradeColor,
    0.72
  );

  this.tweens.add({
    targets: shock,

    scaleX: 4.8,
    scaleY: 4.8,

    alpha: 0,

    duration: 620,

    delay: 50,

    ease: 'Quad.out',

    onComplete: () =>
      shock.destroy()
  });

  /*
   * ------------------------------------------------------------
   * PUZZLE-SPECIFIC SIGNATURE FX
   * ------------------------------------------------------------
   */

  switch (type) {

    /*
     * ACCESS CODE
     * Digital unlock pulse.
     */
    case 'code': {

      for (
        let i = 0;
        i < 6;
        i++
      ) {

        const angle =
          (Math.PI * 2 * i) / 6;

        const particle =
          this.add
            .rectangle(
              centerX,
              centerY,
              4,
              16,
              0x8df4ff,
              0.9
            )
            .setOrigin(0.5)
            .setRotation(angle)
            .setScrollFactor(0)
            .setDepth(1009);

        this.tweens.add({
          targets: particle,

          x:
            centerX +
            Math.cos(angle) * 105,

          y:
            centerY +
            Math.sin(angle) * 105,

          alpha: 0,

          scaleX: 0.25,
          scaleY: 1.8,

          duration: 420,

          ease: 'Cubic.out',

          onComplete: () =>
            particle.destroy()
        });
      }

      break;
    }

    /*
     * CIRCUIT
     * Preserve the original energy-path completion.
     */
    case 'circuit': {

      const points =
        ui.tiles
          ?.filter(
            entry =>
              entry?.connected &&
              entry.tile?.active
          )
          .map(
            entry => ({
              x: entry.tile.x,
              y: entry.tile.y
            })
          ) || [];

      if (points.length) {

        const surge =
          this.add
            .graphics()
            .setScrollFactor(0)
            .setDepth(1006);

        surge.lineStyle(
          7,
          0x8df4ff,
          0.16
        );

        surge.beginPath();

        points.forEach(
          (
            point,
            index
          ) => {

            if (
              index === 0
            ) {
              surge.moveTo(
                point.x,
                point.y
              );
            } else {
              surge.lineTo(
                point.x,
                point.y
              );
            }
          }
        );

        surge.strokePath();
        surge.closePath();

        this.tweens.add({
          targets: surge,

          alpha: {
            from: 0.25,
            to: 1
          },

          duration: 120,

          yoyo: true,

          repeat: 1,

          ease: 'Quad.out',

          onComplete: () =>
            surge.destroy()
        });
      }

      break;
    }

    /*
     * SEQUENCE
     * Sequential node detonation.
     */
    case 'sequence': {

      const nodes =
        ui.sequenceButtons ||
        [];

      nodes.forEach(
        (
          node,
          index
        ) => {

          this.time.delayedCall(
            index * 60,

            () => {

              if (
                !node?.active
              ) {
                return;
              }

              const pulse =
                this.add
                  .circle(
                    node.x,
                    node.y,
                    8,
                    0x8df4ff,
                    0.24
                  )
                  .setScrollFactor(0)
                  .setDepth(1009);

              this.tweens.add({
                targets: pulse,

                scale: 3.2,

                alpha: 0,

                duration: 240,

                ease: 'Quad.out',

                onComplete: () =>
                  pulse.destroy()
              });
            }
          );
        }
      );

      break;
    }

    /*
     * ROUTE MATRIX
     * Horizontal route sweep.
     */
    case 'tiles': {

      const sweep =
        this.add
          .rectangle(
            centerX -
              width * 0.35,
            centerY,
            8,
            120,
            0x8df4ff,
            0.35
          )
          .setScrollFactor(0)
          .setDepth(1009);

      this.tweens.add({
        targets: sweep,

        x:
          centerX +
          width * 0.35,

        alpha: 0,

        scaleY: 1.4,

        duration: 540,

        ease: 'Cubic.inOut',

        onComplete: () =>
          sweep.destroy()
      });

      break;
    }

    /*
     * SIGNAL TUNER
     * Radial frequency rings.
     */
    case 'frequency': {

      [0, 90, 180].forEach(
        (
          delay,
          index
        ) => {

          const ring =
            this.add
              .circle(
                centerX,
                centerY,
                18 + index * 12,
                0x9b5cff,
                0
              )
              .setScrollFactor(0)
              .setDepth(1008);

          ring.setStrokeStyle(
            2,
            0xb993ff,
            0.7
          );

          this.tweens.add({
            targets: ring,

            scale: 3.8,

            alpha: 0,

            duration: 520,

            delay,

            ease: 'Sine.out',

            onComplete: () =>
              ring.destroy()
          });
        }
      );

      break;
    }

    /*
     * SECURITY GRID
     * Security breach scan.
     */
    case 'grid': {

      const breach =
        this.add
          .rectangle(
            centerX,
            centerY,
            width * 0.72,
            3,
            0xff826e,
            0.55
          )
          .setScrollFactor(0)
          .setDepth(1009);

      this.tweens.add({
        targets: breach,

        scaleX: 0.05,

        alpha: 0,

        duration: 360,

        ease: 'Cubic.out',

        onComplete: () =>
          breach.destroy()
      });

      break;
    }

    /*
     * APEX RELAY
     * Final multi-core victory pulse.
     */
    case 'final': {

      const apexRing =
        this.add
          .circle(
            centerX,
            centerY,
            34,
            0xffd06e,
            0.10
          )
          .setScrollFactor(0)
          .setDepth(1010);

      apexRing.setStrokeStyle(
        3,
        0xffd06e,
        0.95
      );

      this.tweens.add({
        targets: apexRing,

        scale: 4.6,

        alpha: 0,

        duration: 760,

        ease: 'Back.out',

        onComplete: () =>
          apexRing.destroy()
      });

      this.cameras.main.flash(
        150,
        255,
        215,
        120
      );

      this.shake(
        120,
        0.004
      );

      break;
    }

    default:
      break;
  }

  /*
   * ------------------------------------------------------------
   * GRADE PULSE
   * ------------------------------------------------------------
   */

  const gradeFlash =
    this.add
      .circle(
        centerX,
        centerY,
        6,
        gradeColor,
        0.72
      )
      .setScrollFactor(0)
      .setDepth(1011);

  this.tweens.add({
    targets: gradeFlash,

    scale: 2.5,

    alpha: 0,

    duration: 260,

    ease: 'Quad.out',

    onComplete: () =>
      gradeFlash.destroy()
  });

  /*
   * ------------------------------------------------------------
   * CAMERA FEEDBACK
   * ------------------------------------------------------------
   */

  this.cameras.main.flash(
    grade === 'S'
      ? 140
      : 100,
    grade === 'S'
      ? 255
      : 120,
    grade === 'S'
      ? 220
      : 210,
    180
  );

  this.shake(
    grade === 'S'
      ? 105
      : 70,
    grade === 'S'
      ? 0.0035
      : 0.0025
  );

  this.gadgetPulse(
    gradeColor,
    grade === 'S'
      ? 18
      : 14,
    grade === 'S'
      ? 520
      : 380
  );
}

/*
 * ============================================================
 * RELAY PUZZLE · RESULT / RANK PANEL
 * Compact post-puzzle performance reveal.
 * ============================================================
 */
showRelayPuzzleResult(performance = {}) {

  if (
    this.gameOverUI ||
    this.missionMedalsUI
  ) {
    return;
  }

  if (this.relayPuzzleResultUI) {
    return;
  }

  const width =
    this.scale.width;

  const height =
    this.scale.height;

  const type =
    this.relayPuzzleType ||
    'circuit';

  const meta =
    this.getRelayPuzzleMeta(type);

  const grade =
    performance.grade ||
    'C';

  const gradeColor =
    grade === 'S'
      ? '#fff0a8'
      : grade === 'A'
        ? '#8df4ff'
        : grade === 'B'
          ? '#aee37f'
          : '#ff826e';

  const efficiency =
    Math.round(
      Phaser.Math.Clamp(
        Number(
          performance.efficiency
        ) || 0,
        0,
        1
      ) * 100
    );

  const elapsed =
    Math.max(
      0,
      Number(
        performance.elapsedMs
      ) || 0
    );

  const elapsedText =
    `${(elapsed / 1000).toFixed(2)}s`;

  const attempts =
    Math.max(
      0,
      Number(
        performance.attempts
      ) || 0
    );

  const baseline =
    Math.max(
      1,
      Number(
        performance.baselineAttempts
      ) || 1
    );

  const panelWidth =
    Math.min(
      width - 34,
      360
    );

  const panelHeight =
    Math.min(
      height - 40,
      250
    );

  const centerX =
    width / 2;

  const centerY =
    height / 2;

  const panel =
    this.add
      .rectangle(
        centerX,
        centerY,
        panelWidth,
        panelHeight,
        0x050914,
        0.97
      )
      .setStrokeStyle(
        2,
        Phaser.Display.Color.HexStringToColor(
          gradeColor
        ).color,
        0.82
      )
      .setScrollFactor(0)
      .setDepth(140);

  const topLine =
    this.add
      .rectangle(
        centerX,
        centerY -
          panelHeight / 2 +
          7,
        panelWidth -
          18,
        2,
        Phaser.Display.Color.HexStringToColor(
          gradeColor
        ).color,
        0.8
      )
      .setScrollFactor(0)
      .setDepth(141);

  const header =
    this.add
      .text(
        centerX,
        centerY -
          panelHeight / 2 +
          29,
        'PUZZLE COMPLETE',
        {
          fontFamily: 'DM Mono',
          fontSize:
            width < 600
              ? '11px'
              : '13px',
          fontStyle: 'bold',
          color: '#dffcff',
          stroke: '#08101c',
          strokeThickness: 4,
          align: 'center'
        }
      )
      .setOrigin(.5)
      .setScrollFactor(0)
      .setDepth(141);

  const title =
    this.add
      .text(
        centerX,
        centerY -
          panelHeight / 2 +
          51,
        meta.title,
        {
          fontFamily: 'DM Mono',
          fontSize:
            width < 600
              ? '9px'
              : '11px',
          color: '#6f849d',
          align: 'center'
        }
      )
      .setOrigin(.5)
      .setScrollFactor(0)
      .setDepth(141);

  const rankGlow =
    this.add
      .circle(
        centerX,
        centerY - 15,
        width < 600
          ? 38
          : 43,
        Phaser.Display.Color.HexStringToColor(
          gradeColor
        ).color,
        0.10
      )
      .setScrollFactor(0)
      .setDepth(140);

  rankGlow.setStrokeStyle(
    2,
    Phaser.Display.Color.HexStringToColor(
      gradeColor
    ).color,
    0.55
  );

  const rank =
    this.add
      .text(
        centerX,
        centerY - 15,
        grade,
        {
          fontFamily: 'DM Mono',
          fontSize:
            width < 600
              ? '54px'
              : '62px',
          fontStyle: 'bold',
          color: gradeColor,
          stroke: '#08101c',
          strokeThickness: 8,
          align: 'center'
        }
      )
      .setOrigin(.5)
      .setScrollFactor(0)
      .setDepth(142);

  const stats =
    this.add
      .text(
        centerX,
        centerY + 46,
        [
          `ATTEMPTS     ${attempts}/${baseline}`,
          `TIME         ${elapsedText}`,
          `EFFICIENCY   ${efficiency}%`
        ].join('\n'),
        {
          fontFamily: 'DM Mono',
          fontSize:
            width < 600
              ? '9px'
              : '10px',
          color: '#dffcff',
          stroke: '#08101c',
          strokeThickness: 3,
          lineSpacing: 6,
          align: 'left'
        }
      )
      .setOrigin(.5)
      .setScrollFactor(0)
      .setDepth(142);

  const footer =
    this.add
      .text(
        centerX,
        centerY +
          panelHeight / 2 -
          23,
        'RELAY CHANNEL SYNCHRONIZED',
        {
          fontFamily: 'DM Mono',
          fontSize:
            width < 600
              ? '7px'
              : '8px',
          color: '#8ba0b8',
          align: 'center'
        }
      )
      .setOrigin(.5)
      .setScrollFactor(0)
      .setDepth(142);

  const objects = [
    panel,
    topLine,
    header,
    title,
    rankGlow,
    rank,
    stats,
    footer
  ];

  objects.forEach(
    object => {
      object
        .setAlpha(0)
        .setScale(.88);
    }
  );

  this.relayPuzzleResultUI =
    objects;

  this.tweens.add({
    targets: objects,
    alpha: 1,
    scaleX: 1,
    scaleY: 1,
    duration: 320,
    ease: 'Back.out'
  });

  if (!this.motionReduced) {

    this.tweens.add({
      targets: rankGlow,
      scale: 1.7,
      alpha: 0,
      duration: 760,
      ease: 'Quad.out',
      repeat: 1
    });

    this.cameras.main.flash(
      grade === 'S'
        ? 130
        : 90,
      grade === 'S'
        ? 255
        : 120,
      grade === 'B'
        ? 210
        : 235,
      150
    );
  }

const resultSession =
  this.relayPuzzleSession;

this.time.delayedCall(
  1250,
  () => {

    if (
      resultSession !==
      this.relayPuzzleSession
    ) {
      return;
    }

    if (
      !this.relayPuzzleResultUI
    ) {
      return;
    }

      this.tweens.add({
        targets:
          this.relayPuzzleResultUI,
        alpha: 0,
        scaleX: .96,
        scaleY: .96,
        duration: 240,
        ease: 'Quad.in',
        onComplete: () => {

          this.relayPuzzleResultUI
            ?.forEach(
              object =>
                object.destroy()
            );

          this.relayPuzzleResultUI =
            null;
        }
      });
    }
  );
}

solveRelayGate() {
  const gate =
    this.relayPuzzleGate;

  if (
    !gate ||
    gate.getData('solved')
  ) {
    return;
  }

  gate.setData(
    'solved',
    true
  );

  gate.setData(
    'puzzleOpen',
    false
  );

const relayPerformance =
  this.getRelayPuzzlePerformance();

this.relayPuzzlePerformanceGrade =
  relayPerformance.grade;

// ============================================================
// POLARITY · RELAY PUZZLE REWARD
// S = 20 | A = 15 | B = 10 | C = 6
// Awarded once because solveRelayGate() has a solved guard.
// ============================================================
const relayPolarityReward =
  relayPerformance.grade === 'S'
    ? 20
    : relayPerformance.grade === 'A'
      ? 15
      : relayPerformance.grade === 'B'
        ? 10
        : 6;

this.addPolarity(
  relayPolarityReward,
  `relay:${relayPerformance.grade}`
);

gate.setData(
  'relayPerformance',
  relayPerformance
);
  const core =
    gate.getData('core');

  const lock =
    gate.getData('lock');

  const status =
    gate.getData('status');

  const label =
    gate.getData('label');

  if (lock) {
    this.tweens.killTweensOf(
      lock
    );

    lock
      .setFillStyle(
        0x8df4ff,
        0.2
      )
      .setStrokeStyle(
        2,
        0x8df4ff,
        0.95
      );
  }

  if (status) {
    this.tweens.killTweensOf(
      status
    );

    status
      .setFillStyle(
        0x8df4ff,
        1
      )
      .setStrokeStyle(
        1,
        0xe8fdff,
        0.95
      );
  }

  if (label) {
    label
      .setText(
        `RELAY ONLINE // ${String(
          gate.getData('index') + 1
        ).padStart(2, '0')}`
      )
      .setColor(
        '#8df4ff'
      );
  }

 const performance =
  gate.getData(
    'relayPerformance'
  ) || {};

const performanceColor =
  performance.grade === 'S'
    ? '#fff0a8'
    : performance.grade === 'A'
      ? '#8df4ff'
      : performance.grade === 'B'
        ? '#aee37f'
        : '#ff826e';

this.relayPuzzleUI?.status
  ?.setText(
    `ACCESS GRANTED · ${performance.grade}-RANK · ${performance.attempts} INPUTS`
  )
  .setColor(
    performanceColor
  );
/*
 * ============================================================
 * RELAY VICTORY · SINGLE STACKED FEEDBACK
 * Prevents duplicate playerCue overlap.
 * ============================================================
 */
this.playerCue(
  `RELAY GATE UNLOCKED  //  ${performance.grade}-RANK`,
  performanceColor
);

const resultSession =
  this.relayPuzzleSession;

this.time.delayedCall(
  140,
  () => {

    if (
      resultSession !==
      this.relayPuzzleSession
    ) {
      return;
    }

    this.showRelayPuzzleResult(
      performance
    );
  }
);

  this.gadgetPulse(
    0x8df4ff,
    16,
    420
  );

  this.shake(
    90,
    0.003
  );

  if (
    core &&
    !this.motionReduced
  ) {
    this.tweens.add({
      targets: core,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0,
      duration: 420,
      ease: 'Cubic.out'
    });
  }

const gateHideSession =
  this.relayPuzzleSession;

this.time.delayedCall(
  650,
  () => {

    if (
      gateHideSession !==
      this.relayPuzzleSession
    ) {
      return;
    }

    if (!gate?.active) {
      return;
    }

    if (gate.body) {
      gate.body.enable =
        false;
    }

    this.tweens.add({
      targets: [
        gate,
        core,
        lock,
        status,
        label
      ].filter(Boolean),
      alpha: 0,
      duration: 360,
      ease: 'Cubic.in',
      onComplete: () => {

        if (
          gateHideSession !==
          this.relayPuzzleSession
        ) {
          return;
        }

        gate.setVisible(
          false
        );

        core?.setVisible(
          false
        );

        lock?.setVisible(
          false
        );

        status?.setVisible(
          false
        );

        label?.setVisible(
          false
        );
      }
    });
  }
);

const solvedSession =
  this.relayPuzzleSession;

this.time.delayedCall(
  900,
  () => {

    if (
      solvedSession !==
      this.relayPuzzleSession
    ) {
      return;
    }

    this.closeRelayPuzzle();
  }
);
}

  retryRelayPuzzle() {
  const ui =
    this.relayPuzzleUI;

  const gate =
    this.relayPuzzleGate;

  if (
    !ui ||
    !gate ||
    !this.relayPuzzleActive ||
    ui.solved
  ) {
    return;
  }

  this.tweens.killTweensOf(
    [
      ui.panel,
      ui.inner,
      ui.startNode,
      ui.endNode,
      ui.retry
    ].filter(Boolean)
  );

  ui.tiles?.forEach(
    entry => {
      entry.tile?.destroy();
      entry.wire?.destroy();
      entry.core?.destroy();
    }
  );

  this.relayPuzzleData?.puzzleObjects?.forEach(
    object => {
      object?.destroy?.();
    }
  );

  ui.grid?.destroy();
  ui.links?.destroy();
  ui.startLabel?.destroy();
  ui.endLabel?.destroy();
  ui.startNode?.destroy();
  ui.endNode?.destroy();

  ui.tiles = [];
  ui.grid = null;
  ui.links = null;
  ui.startLabel = null;
  ui.endLabel = null;
  ui.startNode = null;
  ui.endNode = null;
  ui.solved = false;

this.relayPuzzleSession += 1;

this.relayPuzzleAttempts = 0;

this.relayPuzzleStartedAt =
  this.time.now;

this.relayPuzzleTimerBand =
  0;

this.relayPuzzleData =
  null;

  ui.status?.setText(
    'LOCKED · NEW HANDSHAKE'
  ).setColor(
    '#ff826e'
  );

  ui.timer?.setText(
    'TIME 00:00'
  ).setColor(
    '#8df4ff'
  );

  this.createRelayPuzzleContent();
}

closeRelayPuzzle() {
  this.relayPuzzleSession += 1;

  const ui =
    this.relayPuzzleUI;

if (!ui) {
  this.relayPuzzleActive =
    false;

  this.relayPuzzleGate =
    null;

  this.relayPuzzleType =
    null;

  this.relayPuzzleData =
    null;

  this.relayNearbyGate =
    null;

  if (
    !this.finished &&
    !this.respawning
  ) {
    this.physics.resume();
  }

  return;
}

this.tweens.killTweensOf(
  [
    ui.panel,
    ui.inner,
    ui.startNode,
    ui.endNode,
    ...(this.relayPuzzleResultUI || [])
  ].filter(Boolean)
);

if (this.relayPuzzleResultUI) {
  this.relayPuzzleResultUI.forEach(
    object => {
      object?.destroy?.();
    }
  );

  this.relayPuzzleResultUI =
    null;
}

ui.tiles?.forEach(
    entry => {
      entry.tile?.destroy();
      entry.wire?.destroy();
      entry.core?.destroy();
    }
  );

  this.relayPuzzleData?.puzzleObjects?.forEach(
    object => {
      object?.destroy?.();
    }
  );

  ui.overlay?.destroy();
  ui.panel?.destroy();
  ui.inner?.destroy();
  ui.title?.destroy();
  ui.subtitle?.destroy();
  ui.status?.destroy();
  ui.instruction?.destroy();
ui.close?.destroy();
ui.retry?.destroy();
ui.timer?.destroy();
ui.difficultyLabel?.destroy();
ui.grid?.destroy();
  ui.links?.destroy();
 ui.startLabel?.destroy();
ui.endLabel?.destroy();

ui.startNode?.destroy();
ui.endNode?.destroy();

  this.relayPuzzleUI =
    null;

  this.relayPuzzleActive =
    false;

  this.relayPuzzleGate =
    null;

  this.relayPuzzleType =
    null;

  this.relayPuzzleData =
    null;

this.relayNearbyGate =
  null;

this.mobileDirection =
  null;

Object.keys(
  this.mobileActions
).forEach(
  action => {
    this.mobileActions[action] =
      false;
  }
);

if (
  !this.finished &&
  !this.respawning
) {
  this.physics.resume();
}

}

/*
 * ============================================================
 * RELAY GATES
 * Locked progression gates used by the puzzle system.
 * The gate is created here; puzzle logic comes afterwards.
 * ============================================================
 */
createRelayGates() {
  this.relayGates =
    this.physics.add.staticGroup();

  this.mission.relayGates.forEach(
    (data, index) => {
      const x =
        Number.isFinite(data?.x)
          ? data.x
          : this.mission.spawn.x + 1400;

      const y =
        Number.isFinite(data?.y)
          ? data.y
          : this.mission.spawn.y;

      const gate =
        this.add
          .rectangle(
            x,
            y,
            92,
            190,
            0x071625,
            0.96
          )
          .setStrokeStyle(
            3,
            0xff5364,
            0.95
          )
          .setDepth(8);

           this.physics.add.existing(
        gate,
        true
      );

      this.relayGates.add(
        gate
      );

      gate.body.setSize(
        92,
        190
      );

      gate.setData(
        'index',
        index
      );

      gate.setData(
        'type',
        data?.type || 'circuit'
      );

      gate.setData(
        'difficulty',
        Number.isFinite(
          data?.difficulty
        )
          ? data.difficulty
          : 1
      );

      gate.setData(
        'solved',
        false
      );

      gate.setData(
        'puzzleOpen',
        false
      );

      /*
       * Inner energy field.
       */
      const core =
        this.add
          .rectangle(
            x,
            y,
            54,
            142,
            0x10263a,
            0.92
          )
          .setStrokeStyle(
            1,
            0x8df4ff,
            0.58
          )
          .setDepth(8);

      gate.setData(
        'core',
        core
      );

      /*
       * Central lock core.
       */
      const lock =
        this.add
          .circle(
            x,
            y,
            18,
            0xff5364,
            0.16
          )
          .setStrokeStyle(
            2,
            0xff826e,
            0.9
          )
          .setDepth(9);

      gate.setData(
        'lock',
        lock
      );

      /*
       * Top status light.
       */
      const status =
        this.add
          .circle(
            x,
            y - 72,
            5,
            0xff5364,
            0.9
          )
          .setStrokeStyle(
            1,
            0xffd5c5,
            0.8
          )
          .setDepth(9);

      gate.setData(
        'status',
        status
      );

      /*
       * Gate label.
       */
      const label =
        this.add
          .text(
            x,
            y - 112,
            `RELAY GATE // ${String(index + 1).padStart(2, '0')}`,
            {
              fontFamily: 'DM Mono',
              fontSize: '10px',
              color: '#ff826e',
              stroke: '#08101c',
              strokeThickness: 3,
              align: 'center'
            }
          )
          .setOrigin(0.5)
          .setDepth(9);

      gate.setData(
        'label',
        label
      );

      /*
       * Interaction zone.
       * Not a physics blocker; it only detects proximity.
       */
      const interaction =
        this.add
          .zone(
            x,
            y,
            150,
            230
          )
          .setOrigin(0.5)
          .setDepth(7);

      interaction.setData(
        'gate',
        gate
      );

      gate.setData(
        'interaction',
        interaction
      );

      /*
       * Locked pulse.
       */
      if (!this.motionReduced) {
        this.tweens.add({
          targets: lock,
          scale: {
            from: 0.9,
            to: 1.28
          },
          alpha: {
            from: 0.8,
            to: 0.28
          },
          duration: 720,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });

        this.tweens.add({
          targets: status,
          alpha: {
            from: 0.35,
            to: 1
          },
          duration: 540,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });
      }
    }
  );
}
    
createMovingGates() {
this.movingGates =
this.physics.add.group();

this.mission.movingGates.forEach(
  ([x, y, upperY, lowerY], index) => {
    const gate =
      this.movingGates.create(
        x,
        y,
        'barrier'
      )
        .setImmovable(true)
        .setDepth(8);

    gate.body.setAllowGravity(false);
    gate.setData('homeY', y);

    this.tweens.add({
      targets: gate,
      y: index % 2
        ? lowerY
        : upperY,
      duration:
        1600 + index * 240,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });
  }
);

this.physics.add.overlap(
  this.player,
  this.movingGates,
  () =>
    this.fail(
      'A security gate sealed the relay route.'
    ),
  undefined,
  this
);

}

createEnemies() {
this.enemies =
this.physics.add.group();

this.mission.enemies.forEach(
  data => {
    const enemy =
      this.enemies
        .create(
          data.x,
          data.y,
          data.type
        )
        .setDepth(8)
        .setImmovable(true);
    enemy.setData(
      'aiState',
      'IDLE'
    );

    enemy.setData(

'patrolOriginX',
enemy.x
);

    enemy.setData(
      'aiTimer',
      0
    );

    enemy.setData(

'lastKnownX',
enemy.x
);

    enemy.setData(

'lastKnownY',
enemy.y
);
const indicator =
this.add.circle(
data.x,
data.y - 30,
5,
0xff826e,
.28
)
.setStrokeStyle(
1,
0xffd5c5,
.7
)
.setDepth(7);

    enemy.body.setAllowGravity(false);
    enemy.setData('route', data);
    enemy.setData(
      'direction',
      1
    );
    enemy.setData(
      'indicator',
      indicator
    );
  }
);

}

createSciFiThreats() {
const tier =
Number(
this.mission.difficulty?.split('/')[0]
) || 1;

this.eggs =
  this.physics.add.group();

this.comets =
  this.physics.add.group();

const addThreat =
  (type, x, y) => {
    const enemy =
      this.enemies
        .create(
          x,
          y,
          type
        )
        .setDepth(8)
        .setImmovable(true);

    enemy.setData(
  'health',
  1
);

const indicator =
  this.add.circle(
    x,
    y - 34,
    5,
    0xff826e,
    .28
  )
        .setStrokeStyle(
          1,
          0xffd5c5,
          .7
        )
        .setDepth(7);

    enemy.body.setAllowGravity(false);
    enemy.setData(
      'route',
      {
        type,
        min: x - 90,
        max: x + 90
      }
    );
    enemy.setData(
      'direction',
      1
    );

    enemy.setData(

'patrolDirection',
1
);

  enemy.setData(
  'nextShot',
  500
);

if (type === 'chicken') {
  enemy.setData(
    'fireNext',
    0
  );

  enemy.setData(
    'fireUntil',
    0
  );

enemy.setData(
  'fireNextDamage',
  0
);

enemy.setData(
  'fireHitLock',
  0
);

enemy.setData(
  'fireAngle',
  0
);

enemy.setData(
  'fireFx',
  null
);
}

enemy.setData(
  'indicator',
  indicator
);

return enemy;
  };

const startX =
  this.mission.spawn.x;

const firstRunner =
  addThreat(
    'enemy-runner',
    startX + 430,
    this.mission.spawn.y
  );

const firstChicken =
  addThreat(
    'chicken',
    startX + 700,
    this.mission.spawn.y + 10
  );

const routeLength =
  this.mission.goal.x -
  startX;

const encounterTypes =
  tier >= 5
    ? [
        'enemy-runner',
        'alien-ground',
        'dino',
        'invader',
        'chicken',
        'dino',
        'invader'
      ]
    : tier >= 3
      ? [
          'enemy-runner',
          'alien-ground',
          'dino',
          'invader',
          'enemy-runner'
        ]
      : tier === 2
        ? [
            'enemy-runner',
            'chicken',
            'dino',
            'alien-ground'
          ]
        : [
            'enemy-runner',
            'chicken',
            'dino',
            'alien-ground'
          ];

encounterTypes.forEach(
  (type, index) => {
    const x =
      startX +
      1040 +
      index *
        (
          routeLength - 1240
        ) /
        Math.max(
          1,
          encounterTypes.length -
            1
        );

    if (
      x <
      this.mission.goal.x -
        140
    ) {
      addThreat(
        type,
        x,
        type === 'invader'
          ? Math.max(
              180,
              this.mission.spawn.y -
                120
            )
          : this.mission.spawn.y
      );
    }
  }
);

if (this.mission.boss) {
  const profile =
    this.mission.boss;

  this.boss =
    addThreat(
      profile.type,
      this.mission.goal.x -
        250,
      this.mission.spawn.y -
        12
    );

  this.boss.setTint(
    profile.color
  );

  this.boss.setData(
    'health',
    profile.health
  );

   this.boss.setData(
    'boss',
    true
  );

  this.boss.setData(
    'bossName',
    profile.name
  );

  this.boss.setData(
    'bossColor',
    profile.color
  );

  // ============================================================
// BOSS · PREMIUM CORE PULSE
// ============================================================

if (!this.motionReduced) {
  this.tweens.add({
    targets: this.boss,
    alpha: {
      from: 0.92,
      to: 1
    },
    duration: 720,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut'
  });
}

  this.boss.setData(
    'attackCooldown',
    profile.attackCooldown
  );

// BOSS FLOATING LABEL DISABLED

if (
  this.mission.id ===
  'first-delivery'
) {

  // ENEMY FLOATING LABELS DISABLED

  const label = (enemy, text) =>
    this.add.zone(
      enemy.x,
      enemy.y - 62,
      1,
      1
    )
    .setAlpha(0)
    .setDepth(13);

}

this.physics.add.overlap(
  this.player,
  this.eggs,
  (_, egg) => {
    if (
      this.dashTimer > 0 &&
      this.perfectDodgeWindow > 0
    ) {
      egg.destroy();
      this.registerPerfectDodge();
      return;
    }

    egg.destroy();

   this.takeSciFiHit(
  'A chicken egg knocked the courier down.',
  egg.x,
  egg.y
);
  },
  undefined,
  this
);

this.physics.add.overlap(
  this.player,
  this.comets,
  (_, comet) => {
  if (
  this.dashTimer > 0 &&
  this.perfectDodgeWindow > 0
) {
  comet
    .getData('trail')
    ?.destroy();

  comet.destroy();

  this.registerPerfectDodge();
  return;
}

comet
  .getData('trail')
  ?.destroy();

comet.destroy();

this.takeSciFiHit(
  'A falling comet struck the relay route.',
  comet.x,
  comet.y
);
  },
  undefined,
  this
);

this.physics.add.overlap(
  this.player,
  this.enemies,
  (player, enemy) => {
    const stomp =
      player.body.velocity.y > 130 &&
      player.y <
        enemy.y - 12;

    if (stomp) {
      this.defeatEnemy(
        enemy,
        'STOMP'
      );
    } else {
    this.takeSciFiHit(
  'An enemy attack knocked the courier down.',
  enemy.x,
  enemy.y
);
    }
  },
  undefined,
  this
);

}

  }

createBuildSystems() {
  this.shields =
    this.physics.add.staticGroup();

  this.kineticBalls =
    this.physics.add.group();

this.plasma =
  this.physics.add.group();

this.turrets =
  this.physics.add.group();

this.springPads =
  this.physics.add.staticGroup();

const destroyBall =
  (_, ball) =>
    ball.destroy();

this.physics.add.overlap(
  this.kineticBalls,
  this.barriers,
  (ball, barrier) => {
    barrier.disableBody(
      true,
      true
    );

    const impact =
  this.add
    .circle(
      barrier.x,
      barrier.y,
      12,
      0x8df4ff,
      .35
    )
    .setDepth(12);

this.tweens.add({
  targets: impact,
  scale: 3.5,
  alpha: 0,
  duration: 220,
  onComplete: () =>
    impact.destroy()
});

    this.playerCue(
      'BARRIER DESTROYED',
      '#8df4ff'
    );

    this.gadgetPulse(
  0x8df4ff,
  10,
  280
);

    destroyBall(
      null,
      ball
    );
  }
);

this.physics.add.overlap(
  this.kineticBalls,
  this.movingGates,
  (ball, gate) => {
    gate.disableBody(
      true,
      true
    );

    const gateImpact =
  this.add
    .circle(
      gate.x,
      gate.y,
      12,
      0xff826e,
      .35
    )
    .setDepth(12);

this.tweens.add({
  targets: gateImpact,
  scale: 3.5,
  alpha: 0,
  duration: 220,
  onComplete: () =>
    gateImpact.destroy()
});

    this.playerCue(
      'GATE DESTROYED',
      '#8df4ff'
    );

    this.gadgetPulse(
  0x8df4ff,
  11,
  300
);

    destroyBall(
      null,
      ball
    );
  }
);

this.physics.add.overlap(
  this.kineticBalls,
  this.enemies,
  (ball, enemy) => {
    const impact =
      this.add
        .circle(
          enemy.x,
          enemy.y,
          11,
          0x8df4ff,
          .34
        )
        .setDepth(12);

    this.tweens.add({
      targets: impact,
      scale: 3.6,
      alpha: 0,
      duration: 210,
      onComplete: () =>
        impact.destroy()
    });

    this.shake(
      45,
      0.002
    );

    this.defeatEnemy(
      enemy,
      'KINETIC BALL',
      2
    );

    destroyBall(
      null,
      ball
    );
  }
);

this.physics.add.overlap(
  this.plasma,
  this.enemies,
  (plasma, enemy) => {
    const power =
      plasma.getData('power') ||
      1;

    plasma.destroy();

    this.defeatEnemy(
      enemy,
      'BLASTER',
      power
    );
  }
);

this.physics.add.overlap(
  this.plasma,
  this.eggs,
  (plasma, egg) => {
    plasma.destroy();
    egg.destroy();
    
    const deflectPulse =
  this.add
    .circle(
      egg.x,
      egg.y,
      9,
      0x8df4ff,
      .30
    )
    .setDepth(12);

this.tweens.add({
  targets: deflectPulse,
  scale: 3.2,
  alpha: 0,
  duration: 220,
  onComplete: () =>
    deflectPulse.destroy()
});

    this.playerCue(
      'SHOT DEFLECTED',
      '#8df4ff'
    );
    
    this.playerCue(
  '+1 DEFLECT',
  '#b9f5ff'
);
  }
);

this.physics.add.overlap(
  this.plasma,
  this.comets,
  (plasma, comet) => {
    plasma.destroy();

    comet
      .getData?.('trail')
      ?.destroy?.();

    comet.destroy?.();

    const cometPulse =
  this.add
    .circle(
      comet.x,
      comet.y,
      10,
      0x8df4ff,
      .30
    )
    .setDepth(12);

this.tweens.add({
  targets: cometPulse,
  scale: 3.4,
  alpha: 0,
  duration: 230,
  onComplete: () =>
    cometPulse.destroy()
});

    this.playerCue(
      'BOLT DEFLECTED',
      '#8df4ff'
    );
    
    this.playerCue(
  '+1 DEFLECT',
  '#b9f5ff'
);
  }
);

this.physics.add.overlap(
  this.eggs,
  this.shields,
  (egg, shield) => {
    egg.destroy();

    const shieldPulse =
      this.add
        .circle(
          shield.x,
          shield.y,
          10,
          0x8df4ff,
          .28
        )
        .setDepth(12);

    this.tweens.add({
      targets: shieldPulse,
      scale: 3,
      alpha: 0,
      duration: 200,
      onComplete: () =>
        shieldPulse.destroy()
    });

 this.playerCue(
  'SHIELD BLOCK',
  '#8df4ff'
);

this.gadgetPulse(
  0x8df4ff,
  9,
  260
);
  }
);

this.physics.add.overlap(
  this.comets,
  this.shields,
  (comet, shield) => {

    comet
      .getData?.('trail')
      ?.destroy?.();

    comet.destroy?.();

    const shieldPulse =
      this.add
        .circle(
          shield.x,
          shield.y,
          10,
          0x8df4ff,
          .28
        )
        .setDepth(12);

    this.tweens.add({
      targets: shieldPulse,
      scale: 3,
      alpha: 0,
      duration: 200,
      onComplete: () =>
        shieldPulse.destroy()
    });
  }
);

this.physics.add.overlap(
  this.player,
  this.springPads,
  () => {
    const body =
      this.player?.body;

    if (
      !body ||
      !this.player?.active ||
      this.boostCooldown > 0
    ) {
      return;
    }

    this.boostCooldown = 260;

    body.setVelocityY(
      -880
    );

    this.playerCue(
      'SPRING LAUNCH',
      '#aee37f'
    );

this.gadgetPulse(
  0xaee37f,
  12,
  320
);

    const springPulse =
  this.add
    .circle(
      this.player.x,
      this.player.y + 18,
      10,
      0xaee37f,
      .32
    )
    .setDepth(11);

this.tweens.add({
  targets: springPulse,
  scale: 3.4,
  alpha: 0,
  duration: 260,
  onComplete: () =>
    springPulse.destroy()
});

    this.playerCue(
      'SPRING PAD',
      '#aee37f'
    );
  }
);

}

/*
 * ============================================================
 * POLARITY CORE · LOGIC
 * Gameplay only.
 * No HUD creation.
 * ============================================================
 */

addPolarity(amount, reason = 'unknown') {
  const value = Number(amount);

  if (
    !Number.isFinite(value) ||
    value === 0
  ) {
    return;
  }

  const previous = this.polarity;

  this.polarity =
    Phaser.Math.Clamp(
      this.polarity + value,
      0,
      this.polarityMax
    );

  if (value > 0) {
    this.polarityStats.gained += value;
  } else {
    this.polarityStats.spent += Math.abs(value);
  }

  this.polarityStats.peak =
    Math.max(
      this.polarityStats.peak,
      this.polarity
    );

  this.polarityDecayTimer =
    this.polarityDecayDelay;

  this.updatePolarityState();

  this.game.events.emit(
    'polarity',
    this.polarity,
    this.polarityMax,
    reason
  );

  if (
    previous < this.polarityMax &&
    this.polarity >= this.polarityMax
  ) {
    this.game.events.emit(
      'polarity-full',
      this.polarity
    );
  }
}

consumePolarity(amount, reason = 'ability') {
  const value =
    Math.max(
      0,
      Number(amount) || 0
    );

  if (!value || this.polarity < value) {
    return false;
  }

  this.polarity -= value;
  this.polarityStats.spent += value;

  this.updatePolarityState();

  this.game.events.emit(
    'polarity',
    this.polarity,
    this.polarityMax,
    reason
  );

  return true;
}

updatePolarityState() {
  const previous =
    this.polarityState;

  let next = 'STABLE';

if (this.overdriveTimer > 0) {
  next = 'OVERDRIVE';
} else if (this.polarity >= 75) {
  next = 'CHARGED';
} else if (this.polarity <= 15) {
  next = 'LOW';
}

  this.polarityState = next;

  if (previous !== next) {
    this.polarityLastState = next;

    this.game.events.emit(
      'polarity-state',
      next,
      this.polarity
    );
  }
}

updatePolarity(delta) {
  if (
    !Number.isFinite(delta) ||
    this.finished ||
    this.respawning
  ) {
    return;
  }

  this.polarityDecayTimer =
    Math.max(
      0,
      this.polarityDecayTimer - delta
    );

if (
  this.overdriveTimer > 0
) {
  this.polarity = this.polarityMax;
  this.updatePolarityState();
} else {

/*
 * OVERDRIVE JUST ENDED
 * Re-evaluate state before normal decay.
 */
if (
  this.polarityState === 'OVERDRIVE'
) {
  this.updatePolarityState();
}

  if (
    this.polarityDecayTimer <= 0 &&
    this.polarity > 0
  ) {
    this.polarity =
      Math.max(
        0,
        this.polarity - 0.015 * delta
      );

    this.updatePolarityState();
  }
}

 this.game.events.emit(
  'polarity',
  this.polarity,
  this.polarityMax,
  'tick'
);
}

activatePolarityOverdrive() {
  if (
    this.overdriveTimer > 0 ||
    this.polarity < this.polarityMax
  ) {
    return false;
  }

this.overdriveTimer =
  Math.max(
    this.overdriveTimer,
    4200
  );

this.updatePolarityState();

this.polarityStats.overdrives++;

  this.game.events.emit(
    'polarity-overdrive',
    this.overdriveTimer
  );

  this.playerCue(
    'POLARITY OVERDRIVE',
    '#ffd06e'
  );

  this.speakNarration(
    'OVERDRIVE'
  );

  return true;
}

breakPolarity() {
  if (
    this.overdriveTimer > 0
  ) {
    return false;
  }

  if (
    !this.consumePolarity(
      100,
      'polarity-break'
    )
  ) {
    return false;
  }

  this.polarityStats.breaks++;

  this.game.events.emit(
    'polarity-break'
  );

  this.playerCue(
    'POLARITY BREAK',
    '#8df4ff'
  );

 if (
  !this.motionReduced &&
  this.graphicsLevel >= 2
) {
  this.cameras.main.flash(
    100,
    141,
    244,
    255
  );

  this.shake(
    90,
    0.004
  );
}

  return true;
}

takeSciFiHit(
  message,
  sourceX = this.player?.x ?? 0,
  sourceY = this.player?.y ?? 0
) {
if (
this.briefingProtected ||
this.respawning ||
this.finished ||
this.healthInvulnerable > 0
) {
return;
}

const polarityLoss =
  this.polarityState === 'OVERDRIVE'
    ? 18
    : this.polarityState === 'CHARGED'
      ? 12
      : 8;

this.addPolarity(
  -polarityLoss,
  'damage'
);

// ============================================================
// LOW HP · CRITICAL STATE
// ============================================================
  
if (
  this.health === 1 &&
  !this.motionReduced
) {
  this.playerCue(
    'CRITICAL',
    '#ff826e'
  );

  if (this.graphicsLevel >= 2) {
    this.cameras.main.flash(
      120,
      255,
      70,
      70
    );
  }

  this.shake(
    120,
    0.004
  );

  const criticalPulse =
    this.add
      .circle(
        this.player.x,
        this.player.y,
        20,
        0xff826e,
        .20
      )
      .setDepth(13);

  criticalPulse.setStrokeStyle(
    3,
    0xffa08f,
    .9
  );

  this.tweens.add({
    targets: criticalPulse,
    scale: 4.4,
    alpha: 0,
    duration: 520,
    ease: 'Quad.out',
    onComplete: () =>
      criticalPulse.destroy()
  });
}
if (this.health > 0) {
  this.healthInvulnerable = 1100;
}

this.game.events.emit(
  'health',
  this.health
);

/* -------------------------------------------------
   DAMAGE DIRECTION INDICATOR
   ------------------------------------------------- */

if (
  !this.motionReduced &&
  this.player?.active
) {
  const dx =
    sourceX -
    this.player.x;

  const dy =
    sourceY -
    this.player.y;

  const distance =
    Math.max(
      1,
      Math.hypot(dx, dy)
    );

  const directionX =
    dx / distance;

  const directionY =
    dy / distance;

  const angle =
    Phaser.Math.RadToDeg(
      Math.atan2(
        directionY,
        directionX
      )
    );

  const indicator =
    this.add
      .triangle(
        this.player.x,
        this.player.y - 58,
        0,
        -12,
        7,
        7,
        -7,
        7,
        0xff826e,
        0.9
      )
      .setDepth(15)
      .setAngle(
        angle + 90
      );

  indicator.setStrokeStyle(
    1,
    0xffd9d2,
    0.85
  );

  this.tweens.add({
    targets: indicator,
    y:
      indicator.y - 9,
    alpha: 0,
    scaleX: 1.25,
    scaleY: 1.25,
    duration: 360,
    ease: 'Quad.out',
    onComplete: () =>
      indicator.destroy()
  });
}

  /*
 * ============================================================
 * DAMAGE IMPACT FX
 * ============================================================
 */
if (
  !this.motionReduced &&
  this.graphicsLevel >= 2
) {
  const impact =
    this.add
      .circle(
        this.player.x,
        this.player.y,
        11,
        0xff826e,
        .28
      )
      .setDepth(13);

  impact.setStrokeStyle(
    2,
    0xffc2b8,
    .85
  );

  this.tweens.add({
    targets: impact,
    scale: 3.8,
    alpha: 0,
    duration: 260,
    ease: 'Quad.out',
    onComplete: () =>
      impact.destroy()
  });

  this.player.setTint(
    0xff6f68
  );

  this.time.delayedCall(
    90,
    () => {
      if (
        this.player?.active &&
        this.health > 0
      ) {
        this.player.clearTint();
      }
    }
  );

  this.shake(
    85,
    .0035
  );
}
  
  /* CRITICAL FX already handled above in takeSciFiHit(). */

if (this.health <= 0) {
this.fail(
  'The courier collapsed. Checkpoint health restored.',
  true
);
  return;
}

// ============================================================
// DIZZY / IMPACT RESPONSE
// Non-lethal damage only.
// ============================================================
const dizzyIntensity =
  this.health === 1
    ? 1.35
    : 1.0;

this.showDizzyStars(
  dizzyIntensity
);

/* Tint cleanup is already scheduled in the damage FX block above. */
if (
  !this.motionReduced &&
  this.graphicsLevel >= 2
) {
  this.cameras.main.flash(
    120,
    255,
    60,
    60
  );
}
  const damagePulse =
  this.add
    .circle(
      this.player.x,
      this.player.y,
      16,
      0xff826e,
      .30
    )
    .setDepth(11);

this.tweens.add({
  targets: damagePulse,
  scale: 3.2,
  alpha: 0,
  duration: 260,
  onComplete: () =>
    damagePulse.destroy()
});
  
this.playerCue(
  `HIT · ${this.health} HEALTH`,
  '#ff9c91'
);

if (
  this.health > 0 &&
  this.health <=
    Math.ceil(
      this.healthMax * 0.25
    )
) {
  this.speakNarration(
    'LOW HEALTH'
  );
}

this.shake(80, .006);

this.game.events.emit(
  'feedback',
  'hit'
);

}

useBuild(slot) {
if (
  this.finished ||
  this.respawning ||
  this.cinematicActive ||
  this.relayPuzzleActive
) {
  return;
}

const id =
  this.loadout.buildItems?.[slot];

if (
  !id ||
  this.buildCooldowns[slot] > 0
) {
  return;
}

const direction =
  this.player.flipX
    ? -1
    : 1;

if (id === 'shield') {
  const shield =
    this.shields.create(
      this.player.x +
        direction * 70,
      this.player.y + 10,
      'shield'
    );

  shield.refreshBody();

  this.time.delayedCall(
    4200,
    () => shield.destroy()
  );

  this.playerCue(
    'RELAY SHIELD BUILT',
    '#b9f5ff'
  );

  this.buildCooldowns[slot] =
    9000;
}

if (id === 'kinetic-ball') {
  const ball =
    this.kineticBalls
      .create(
        this.player.x +
          direction * 28,
        this.player.y,
        'kinetic-ball'
      )
      .setDepth(12);

  ball.body
    .setAllowGravity(false)
    .setCircle(11, 2, 2)
    .setVelocityX(
      direction * 780
    );

  this.time.delayedCall(
    1400,
    () => ball.destroy()
  );

  this.playerCue(
    'KINETIC BALL',
    '#8df4ff'
  );

  this.buildCooldowns[slot] =
    7000;
}

if (id === 'turret') {
  const turret =
    this.turrets
      .create(
        this.player.x +
          direction * 90,
        this.player.y + 14,
        'turret'
      )
      .setDepth(9)
      .setImmovable(true);

  turret.body.setAllowGravity(false);
  turret.setData(
    'expires',
    this.elapsedMs + 6500
  );
  turret.setData(
    'nextShot',
    0
  );

  this.playerCue(
    'ARC TURRET DEPLOYED',
    '#8df4ff'
  );

  this.buildCooldowns[slot] =
    12000;
}

if (id === 'spring-pad') {
  const pad =
    this.springPads.create(
      this.player.x +
        direction * 58,
      this.player.y + 32,
      'spring-pad'
    );

  pad.refreshBody();

  this.time.delayedCall(
    6000,
    () => pad.destroy()
  );

  this.playerCue(
    'SPRING PAD BUILT',
    '#aee37f'
  );

  this.gadgetPulse(
  0xaee37f,
  10,
  300
);

  this.buildCooldowns[slot] =
    8000;
}

}

defeatEnemy(
enemy,
method,
power = 1
) {
if (!enemy?.active) return;

const fireFx =
  enemy.getData(
    'fireFx'
  );

if (fireFx) {
  fireFx.destroy();

  enemy.setData(
    'fireFx',
    null
  );
}

enemy.setData(
  'fireUntil',
  0
);

enemy.setData(
  'fireChargeUntil',
  0
);

enemy.setData(
  'fireNextDamage',
  0
);

enemy.setData(
  'fireHitLock',
  0
);

enemy.setTint(0xffffff);

this.time.delayedCall(
  90,
  () => {
    if (enemy?.active) {
      enemy.clearTint();
    }
  }
);

if (!enemy.getData('boss')) {
  this.game.events.emit(
    'feedback',
    'enemy_hit'
  );
}
  const hitPulse =
  this.add
    .circle(
      enemy.x,
      enemy.y,
      10,
      0x8df4ff,
      .28
    )
    .setDepth(11);

this.tweens.add({
  targets: hitPulse,
  scale: 2.8,
  alpha: 0,
  duration: 180,
  onComplete: () => hitPulse.destroy()
});

/* -------------------------------------------------
   DIRECTIONAL HIT SPARK
   Visual only — no damage / physics mutation.
   ------------------------------------------------- */

if (
  !this.motionReduced &&
  this.graphicsLevel >= 2
) {
  const hitDirection =
    this.player.x < enemy.x
      ? -1
      : 1;

  const sparkX =
    enemy.x +
    hitDirection * 8;

  const sparkY =
    enemy.y - 2;

  const spark =
    this.add.graphics()
      .setDepth(12);

  spark.lineStyle(
    2,
    0xdffcff,
    0.9
  );

  for (let i = 0; i < 5; i++) {
    const angle =
      Phaser.Math.DegToRad(
        -150 +
        i * 15
      );

    const length =
      Phaser.Math.Between(
        14,
        24
      );

    spark.lineBetween(
      sparkX,
      sparkY,
      sparkX +
        Math.cos(angle) *
        length *
        hitDirection,
      sparkY +
        Math.sin(angle) *
        length
    );
  }

  this.tweens.add({
    targets: spark,
    alpha: 0,
    scaleX: 0.55,
    scaleY: 0.55,
    duration: 135,
    ease: 'Quad.out',
    onComplete: () =>
      spark.destroy()
  });
}

enemy.x +=
  this.player.x < enemy.x
    ? 10
    : -10;
 this.shake(
  55,
  0.0025
);
  const originalScaleX =
  enemy.scaleX;

const originalScaleY =
  enemy.scaleY;

this.tweens.add({
  targets: enemy,
  scaleX: originalScaleX * 1.12,
  scaleY: originalScaleY * 0.88,
  duration: 55,
  yoyo: true,
  ease: 'Quad.easeOut'
});
  
const health =
  enemy.getData('health');

if (health) {
  const isBoss =
  enemy.getData('boss') === true;

if (isBoss) {
  this.game.events.emit(
    'feedback',
    'boss_hit'
  );

  this.bossHitCount =
    (this.bossHitCount || 0) + 1;

  if (
    this.bossHitCount === 1 ||
    this.bossHitCount % 5 === 0
  ) {
    this.speakNarration(
      'BOSS ENGAGED'
    );
  }
  
  const bossPulse =
    this.add
      .circle(
        enemy.x,
        enemy.y,
        18,
        enemy.getData('bossColor') ||
          0xff826e,
        .32
      )
      .setDepth(12);

  this.tweens.add({
    targets: bossPulse,
    scale: 3.6,
    alpha: 0,
    duration: 240,
    onComplete: () =>
      bossPulse.destroy()
  });

  this.shake(
    75,
    0.004
  );
}
  const comboMultiplier =

this.combatCombo >= 5
? 2
: this.combatCombo >= 3
? 1.5
: 1;

const finalPower =
power * comboMultiplier;
const remaining =
  health - finalPower;

  // ============================================================
// BOSS FINAL ENRAGE · 25% HP
// ============================================================
if (
  enemy.getData('boss') === true &&
  remaining > 0 &&
  remaining <= health * 0.25 &&
  enemy.getData('finalEnrage') !== true
) {
  enemy.setData(
    'finalEnrage',
    true
  );

  enemy.setData(
    'phase',
    3
  );

  const currentCooldown =
    Number(
      enemy.getData(
        'attackCooldown'
      )
    ) || 1800;

  enemy.setData(
    'attackCooldown',
    currentCooldown * .48
  );

this.playerCue(
  'FINAL ENRAGE',
  '#ff4f5f'
);

this.speakNarration(
  'FINAL ENRAGE'
);
  this.gadgetPulse(
    0xff4f5f,
    30,
    900
  );

  if (
  !this.motionReduced &&
  this.graphicsLevel >= 2
) {
  this.cameras.main.flash(
    220,
    255,
    60,
    60
  );

  this.shake(
    260,
    0.012
  );

  const enrageBurst =
      this.add
        .circle(
          enemy.x,
          enemy.y,
          28,
          0xff4f5f,
          .26
        )
        .setDepth(13);

    enrageBurst.setStrokeStyle(
      3,
      0xffb0b0,
      .95
    );

    this.tweens.add({
      targets: enrageBurst,
      scale: 6.2,
      alpha: 0,
      duration: 760,
      ease: 'Quad.out',
      onComplete: () =>
        enrageBurst.destroy()
    });
  }

  this.game.events.emit(
    'feedback',
    'boss_final_enrage'
  );
}

  // ============================================================
// BOSS PHASE 2 · 50% HP TRANSITION
// ============================================================
if (
  isBoss &&
  !this.bossPhaseTwo &&
  remaining > 0 &&
  remaining <= health * 0.5
) {
this.bossPhaseTwo = true;

// ============================================================
// BOSS PHASE 2 · MICRO ENERGY BURST
// Immediate visual confirmation of the phase transition.
// Visual only — no physics / damage / AI mutation.
// ============================================================
if (
  !this.motionReduced &&
  this.graphicsLevel >= 2 &&
  enemy?.active
) {
  const burst =
    this.add
      .circle(
        enemy.x,
        enemy.y,
        14,
        0xffcf82,
        0.34
      )
      .setStrokeStyle(
        2,
        0xffe0a8,
        0.9
      )
      .setDepth(13);

  this.tweens.add({
    targets: burst,
    scaleX: 4.2,
    scaleY: 4.2,
    alpha: 0,
    duration: 360,
    ease: 'Quad.out',
    onComplete: () => {
      if (burst?.active) {
        burst.destroy();
      }
    }
  });

  if (
    this.graphicsLevel >= 2
  ) {
    this.cameras.main.flash(
      90,
      255,
      205,
      110,
      true
    );
  }
}

// ============================================================
// BOSS PHASE 2 · ENRAGE AURA
// ============================================================
  
this.bossPhaseAura?.destroy();
this.bossPhaseAuraFollow?.remove();

const bossAuraColor =
  enemy.getData('bossColor') ||
  0xff826e;

this.bossPhaseAura =
  this.add
    .circle(
      enemy.x,
      enemy.y,
      34,
      bossAuraColor,
      .12
    )
    .setDepth(10);

this.bossPhaseAura.setStrokeStyle(
  2,
  0xffcf82,
  .72
);

if (!this.motionReduced) {
  this.tweens.add({
    targets: this.bossPhaseAura,
    scale: {
      from: .86,
      to: 1.18
    },
    alpha: {
      from: .10,
      to: .24
    },
    duration: 520,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut'
  });
}

this.bossPhaseAuraFollow =
  this.time.addEvent({
    delay: 16,
    loop: true,
    callback: () => {
      if (
        !enemy.active ||
        !this.bossPhaseAura
      ) {
        this.bossPhaseAuraFollow?.remove();
        this.bossPhaseAuraFollow = null;
        this.bossPhaseAura?.destroy();
        this.bossPhaseAura = null;
        return;
      }

      this.bossPhaseAura.x = enemy.x;
    if (
  enemy.active &&
  !this.motionReduced
) {
  this.bossPhaseAura.y =
    enemy.y +
    Math.sin(
      this.time.now * 0.0028
    ) * 4;
}
      this.bossPhaseAura.y =
  enemy.y +
  (
    !this.motionReduced
      ? Math.sin(
          this.time.now * 0.0028
        ) * 4
      : 0
  );
      this.bossPhaseAura.y =
  enemy.y +
  (
    !this.motionReduced
      ? Math.sin(
          this.time.now * 0.0028
        ) * 4
      : 0
  );
    }
  });
  
  enemy.setData(
    'phase',
    2
  );

  this.playerCue(
    'PHASE 2 // INCOMING',
    '#ff826e'
  );

  this.gadgetPulse(
    0xff826e,
    26,
    760
  );

  if (
  !this.motionReduced &&
  this.graphicsLevel >= 2
) {
  this.cameras.main.flash(
    180,
    255,
    208,
    110
  );
}

    this.shake(
      220,
      0.009
    );

    const phaseRing =
      this.add
        .circle(
          enemy.x,
          enemy.y,
          24,
          0xff826e,
          .24
        )
        .setDepth(13);

    phaseRing.setStrokeStyle(
      3,
      0xffcf82,
      .95
    );

    this.tweens.add({
      targets: phaseRing,
      scale: 5.8,
      alpha: 0,
      duration: 680,
      ease: 'Quad.out',
      onComplete: () =>
        phaseRing.destroy()
    });
  }

this.game.events.emit(
  'feedback',
  'boss_phase_two'
);

this.speakNarration(
  'BOSS PHASE TWO'
);
}
  
  enemy.setData(
    'health',
    remaining
  );

  enemy.setTint(
    0xff826e
  );

  this.time.delayedCall(
    100,
    () =>
      enemy.active &&
      enemy.setTint(
        enemy.getData('bossColor') ||
        0xffffff
      )
  );

  if (remaining > 0) {
    
    if (
  enemy.getData('boss') === true &&
  remaining === 1
) {
  const dangerPulse =
    this.add
      .circle(
        enemy.x,
        enemy.y,
        28,
        0xff826e,
        .22
      )
      .setDepth(12);

  this.tweens.add({
    targets: dangerPulse,
    scale: 2.4,
    alpha: 0,
    duration: 320,
    onComplete: () =>
      dangerPulse.destroy()
  });
}

    this.playerCue(
      `${method} · BOSS HIT`,
      '#ffcf82'
    );

    this.gadgetPulse(
  0xffcf82,
  15,
  360
);

    return;
  }

  if (!enemy.getData('boss')) {
  this.game.events.emit(
    'feedback',
    'enemy_defeated'
  );
}

  enemy
    .getData('label')
    ?.destroy();
  if (enemy.getData('boss') === true) {

    // ============================================================
// BOSS VICTORY ONCE-ONLY GUARD
// ============================================================
    
if (this.bossVictorySequence === true) {
  return;
}

this.bossVictorySequence = true;
    
    // ============================================================
// BOSS VICTORY INPUT LOCK
// ============================================================
    
this.bossVictoryLock = true;

if (this.player?.body) {
  this.player.body.setVelocity(0, 0);
}

this.input?.keyboard?.resetKeys?.();
    // ============================================================
// BOSS UI / PHASE CLEANUP
// ============================================================
if (this.bossHealthUI) {
  this.bossHealthUI.marker50?.destroy();
  this.bossHealthUI.marker25?.destroy();

  this.bossHealthUI.container?.destroy();

  this.bossHealthUI = null;
}

if (this.boss?.active) {
  this.boss.setData(
    'finalEnrage',
    false
  );

  this.boss.setData(
    'phase',
    0
  );
}

this.bossPhaseAura?.destroy?.();
this.bossPhaseAura = null;
  const deathBurst =
    this.add
      .circle(
        enemy.x,
        enemy.y,
        24,
        enemy.getData('bossColor') ||
          0xff826e,
        .42
      )
      .setDepth(13);

  this.tweens.add({
    targets: deathBurst,
    scale: 5,
    alpha: 0,
    duration: 420,
    onComplete: () =>
      deathBurst.destroy()
  });

  this.shake(
    180,
    0.008
  );
    
    // ============================================================
// BOSS PROJECTILE PURGE
// ============================================================
if (this.comets) {
  this.comets
    .getChildren()
    .forEach(projectile => {
      if (
  projectile.active &&
  projectile.getData('bossProjectile') === true
) {
  projectile
    .getData('trail')
    ?.destroy();

  projectile.body?.setVelocity(
    0,
    0
  );

  projectile.body?.setEnable(
    false
  );

  projectile.setActive(
    false
  );

  projectile.setVisible(
    false
  );

  projectile.destroy();
}
    });
}
    
    // ============================================================
// BOSS FINAL KILL IMPACT
// ============================================================
    
this.playerCue(
  'BOSS DEFEATED',
  '#8df4ff'
);

this.speakNarration(
  'BOSS DEFEATED'
);
    // ============================================================
// BOSS VICTORY BANNER
// ============================================================
    
if (!this.motionReduced) {
  const centerX =
    this.scale.width / 2;

  const centerY =
    this.scale.height / 2;

  const banner =
    this.add
      .container(
        centerX,
        centerY
      )
      .setScrollFactor(0)
      .setDepth(150)
      .setAlpha(0)
      .setScale(.82);

  const glow =
    this.add
      .rectangle(
        0,
        0,
        Math.min(
          this.scale.width - 40,
          420
        ),
        112,
        0x06111d,
        .96
      )
      .setStrokeStyle(
        2,
        0x8df4ff,
        .9
      );

  const accent =
    this.add
      .rectangle(
        0,
        -53,
        Math.min(
          this.scale.width - 40,
          420
        ),
        4,
        0x8df4ff,
        .95
      );

  const title =
    this.add
      .text(
        0,
        -18,
        'BOSS DEFEATED',
        {
          fontFamily:
            'Arial Black, Arial, sans-serif',
          fontSize: '28px',
          fontStyle: 'bold',
          color: '#8df4ff',
          stroke: '#02070d',
          strokeThickness: 6,
          align: 'center',
          resolution: 2
        }
      )
      .setOrigin(.5);

  const subtitle =
    this.add
      .text(
        0,
        18,
        'THREAT ELIMINATED',
        {
          fontFamily:
            'Arial, sans-serif',
          fontSize: '13px',
          fontStyle: 'bold',
          color: '#dcecff',
          letterSpacing: 2,
          align: 'center',
          resolution: 2
        }
      )
      .setOrigin(.5);

  const line =
    this.add
      .rectangle(
        0,
        40,
        170,
        2,
        0x8df4ff,
        .65
      );

  banner.add([
    glow,
    accent,
    title,
    subtitle,
    line
  ]);

  this.tweens.add({
    targets: banner,
    alpha: 1,
    scale: 1,
    duration: 420,
    ease: 'Back.out'
  });

  this.tweens.add({
    targets: accent,
    scaleX: .35,
    duration: 260,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut'
  });

  this.tweens.add({
    targets: banner,
    delay: 1500,
    alpha: 0,
    scale: 1.04,
    duration: 420,
    ease: 'Quad.in',
    onComplete: () => {
      banner.destroy();
    }
  });
}

this.gadgetPulse(
  0x8df4ff,
  36,
  1000
);

this.game.events.emit(
  'feedback',
  'boss_defeated'
);

if (!this.motionReduced) {
  const killFlash =
    this.add
      .rectangle(
        this.scale.width / 2,
        this.scale.height / 2,
        this.scale.width,
        this.scale.height,
        0x8df4ff,
        .18
      )
      .setScrollFactor(0)
      .setDepth(140);

  this.tweens.add({
    targets: killFlash,
    alpha: 0,
    duration: 520,
    ease: 'Quad.out',
    onComplete: () =>
      killFlash.destroy()
  });

  const killRing =
    this.add
      .circle(
        enemy.x,
        enemy.y,
        34,
        0x8df4ff,
        0
      )
      .setStrokeStyle(
        4,
        0x8df4ff,
        .95
      )
      .setDepth(18);

  this.tweens.add({
    targets: killRing,
    scale: 7,
    alpha: 0,
    duration: 900,
    ease: 'Cubic.out',
    onComplete: () =>
      killRing.destroy()
  });
}
    if (
      !this.motionReduced &&
      this.graphicsLevel >= 2
    ) {
  this.cameras.main.flash(
    220,
    255,
    208,
    110
  ); 
    }
        }

enemy
  .getData('indicator')
  ?.destroy();

const burst =
  this.add
    .circle(
      enemy.x,
      enemy.y,
      12,
      0x8df4ff,
      .65
    )
    .setDepth(13);

this.tweens.add({
  targets: burst,
  scale: 3,
  alpha: 0,
  duration: 220,
  onComplete: () =>
    burst.destroy()
});

enemy.disableBody(
  true,
  true
);

this.enemyDefeats =
  (this.enemyDefeats || 0) +
  1;

this.combatCombo =
  this.comboTimer > 0
    ? Math.min(
        10,
        this.combatCombo + 1
      )
    : 1;

this.comboTimer = 3000;

/*
 * POLARITY REWARD
 * Stronger methods give slightly more charge.
 */
const basePolarityGain =
  method === 'STOMP'
    ? 7
    : method === 'SWORD'
      ? 6
      : method === 'BLASTER'
        ? 5
        : 4;

const comboPolarityMultiplier =
  this.combatCombo >= 8
    ? 1.75
    : this.combatCombo >= 5
      ? 1.45
      : this.combatCombo >= 3
        ? 1.20
        : 1;

const polarityGain =
  Math.round(
    basePolarityGain *
    comboPolarityMultiplier
  );

this.addPolarity(
  polarityGain,
  `kill:${method}`
);

  this.bestCombatCombo = Math.max(
  this.bestCombatCombo || 0,
  this.combatCombo
);

  /*
 * ============================================================
 * OVERDRIVE · COMBO x10
 * ============================================================
 */
if (
  this.combatCombo >= 10 &&
  this.overdriveTimer <= 0 &&
  !this.polarityComboOverdriveTriggered
) {
  this.polarity = this.polarityMax;

  this.updatePolarityState();

 this.activatePolarityOverdrive();

this.polarityComboOverdriveTriggered = true;

this.gadgetPulse(
    0xffd06e,
    22,
    700
  );

  if (
    !this.motionReduced &&
    this.graphicsLevel >= 2
  ) {
    this.cameras.main.flash(
      150,
      255,
      208,
      110
    );

    this.shake(
      110,
      .005
    );

    const overdriveRing =
      this.add
        .circle(
          this.player.x,
          this.player.y,
          18,
          0xffd06e,
          .20
        )
        .setDepth(13);

    overdriveRing.setStrokeStyle(
      3,
      0xfff0a8,
      .9
    );

    this.tweens.add({
      targets: overdriveRing,
      scale: 5.2,
      alpha: 0,
      duration: 520,
      ease: 'Quad.out',
      onComplete: () =>
        overdriveRing.destroy()
    });
  }

  this.game.events.emit(
    'feedback',
    'overdrive'
  );
}

  /*
 * ============================================================
 * COMBO VISUAL PROGRESSION
 * ============================================================
 */

if (
  !this.motionReduced &&
  this.graphicsLevel >= 2
) {
  const comboLevel =
    this.combatCombo;

  const comboColor =
    comboLevel >= 10
      ? 0xffd06e
      : comboLevel >= 5
        ? 0xb993ff
        : 0x8df4ff;

  const comboPulse =
    this.add
      .circle(
        this.player.x,
        this.player.y,
        13 + comboLevel,
        comboColor,
        .18
      )
      .setDepth(13);

  comboPulse.setStrokeStyle(
    comboLevel >= 5 ? 2 : 1,
    comboColor,
    .78
  );

  this.tweens.add({
    targets: comboPulse,
    scale: comboLevel >= 10
      ? 4.8
      : comboLevel >= 5
        ? 4.2
        : 3.4,
    alpha: 0,
    duration: comboLevel >= 10
      ? 420
      : 300,
    ease: 'Quad.out',
    onComplete: () =>
      comboPulse.destroy()
  });

  this.playerCue(
    `COMBO x${comboLevel}`,
    comboLevel >= 10
      ? '#ffd06e'
      : comboLevel >= 5
        ? '#b993ff'
        : '#8df4ff'
  );

  if (comboLevel >= 5) {
    this.shake(
      comboLevel >= 10
        ? 95
        : 55,
      comboLevel >= 10
        ? .004
        : .002
    );

    this.worldLightPulse(
      comboLevel >= 10
        ? 0xffd06e
        : 0xb993ff,
      comboLevel >= 10
        ? 0.22
        : 0.13,
      comboLevel >= 10
        ? 360
        : 240,
      comboLevel >= 10
        ? 72
        : 48
    );

    this.worldLightFlash(
      comboLevel >= 10
        ? 0xffd06e
        : 0xb993ff,
      comboLevel >= 10
        ? 0.07
        : 0.035,
      comboLevel >= 10
        ? 150
        : 100
    );
  }
}
  
if (this.combatCombo >= 3) {
  this.energy =
    Math.min(
      this.energyMax,
      this.energy + 4
    );
}

this.ammo =
  Math.min(
    this.ammoMax,
    this.ammo + 1
  );

this.game.events.emit(
  'ammo',
  this.ammo /
    this.ammoMax *
    100
);

this.game.events.emit(
  'combo',
  this.combatCombo,
  this.comboTimer
);

if (
  this.combatCombo >= 2 &&
  this.combatCombo % 2 === 0
) {
  this.speakNarration(
    `COMBO ${this.combatCombo}`
  );
}
const body =
  this.player?.body;

if (body) {
  body.setVelocityY(
    method === 'STOMP'
      ? -360
      : body.velocity.y
  );
}

this.playerCue(
  `${method} · ${
    this.combatCombo > 1
      ? `COMBO x${
          this.combatCombo
        }${
          this.combatCombo >= 3
            ? ' · +4 ENERGY'
            : ''
        }`
      : 'THREAT CLEARED'
  }`,
  '#8df4ff'
);

if (
  this.blasterCooldown > 0 ||
  this.cinematicActive ||
  this.finished ||
  this.respawning ||
  this.relayPuzzleActive ||
  !this.player?.active ||
  !this.player?.body
) {
  return;
}

if (!this.ammo) {
  const reloadPulse =
    this.add
      .circle(
        this.player.x,
        this.player.y,
        13,
        0xffcf82,
        .28
      )
      .setDepth(12);

  this.tweens.add({
    targets: reloadPulse,
    scale: 3.8,
    alpha: 0,
    duration: 300,
    onComplete: () =>
      reloadPulse.destroy()
  });

  this.playerCue(
    'PLASMA RECHARGING',
    '#ffcf82'
  );

  this.gadgetPulse(
  0xffcf82,
  9,
  300
);

  this.game.events.emit(
    'feedback',
    'empty'
  );

  return;
}

const direction =
  this.player.flipX
    ? -1
    : 1;

const weapon =
  this.loadout.weapon ||
  'sidearm';

const spread =
  weapon === 'scattergun'
    ? [-150, 0, 150]
    : [0];

spread.forEach(
  vertical => {
    const plasma =
      this.plasma
        .create(
          this.player.x +
            direction * 30,
          this.player.y - 4,
          'plasma'
        )
        .setDepth(12)
        .setFlipX(
          direction < 0
        );

    plasma.body
      .setAllowGravity(false)
      .setVelocity(
        direction *
          (
            weapon ===
            'pulse-rifle'
              ? 980
              : 840
          ),
        vertical
      );

    plasma.setData(
      'power',
      weapon ===
      'pulse-rifle'
        ? 2
        : 1
    );

    this.time.delayedCall(
      900,
      () => plasma.destroy()
    );
  }
);

this.ammo--;

this.game.events.emit(
  'ammo',
  this.ammo /
    this.ammoMax *
    100
);

this.blasterCooldown =
  weapon === 'scattergun'
    ? 420
    : 240;

this.playerCue(
  weapon === 'sidearm'
    ? 'PLASMA FIRE'
    : weapon.toUpperCase(),
  '#8df4ff'
);

  if (!this.motionReduced) {
  const muzzleFlash =
    this.add
      .circle(
        this.player.x +
          (this.player.flipX ? -30 : 30),
        this.player.y - 4,
        7,
        0x8df4ff,
        .34
      )
      .setDepth(13);

  this.tweens.add({
    targets: muzzleFlash,
    scale: 2.6,
    alpha: 0,
    duration: 110,
    ease: 'Quad.out',
    onComplete: () =>
      muzzleFlash.destroy()
  });
}
  
this.game.events.emit(
  'feedback',
  'blaster_fire'
);

}

useSword() {
if (
  this.swordCooldown > 0 ||
  this.cinematicActive ||
  this.finished ||
  this.respawning ||
  this.relayPuzzleActive
) {
  return;
}

const direction =
  this.player.flipX
    ? -1
    : 1;

const blade =
  this.add
    .sprite(
      this.player.x +
        direction * 38,
      this.player.y - 4,
      'sword'
    )
    .setDepth(13)
    .setFlipX(
      direction < 0
    )
    .setAngle(
      direction * -18
    );

this.tweens.add({
  targets: blade,
  angle: direction * 48,
  alpha: 0,
  duration: 170,
  onComplete: () =>
    blade.destroy()
});

this.enemies
  .getChildren()
  .filter(
    enemy =>
      enemy.active &&
      Math.abs(
        enemy.x -
        this.player.x
      ) < 92 &&
      Math.abs(
        enemy.y -
        this.player.y
      ) < 78
  )
  .forEach(
    enemy =>
      this.defeatEnemy(
        enemy,
        'SWORD',
        2
      )
  );

this.swordCooldown = 450;

this.playerCue(
  'SWORD ARC',
  '#ffd06e'
);

  this.game.events.emit(
  'feedback',
  'sword_swing'
);

  if (!this.motionReduced) {
  const swordFlash =
    this.add
      .circle(
        this.player.x +
          (this.player.flipX ? -22 : 22),
        this.player.y - 2,
        9,
        0xffd06e,
        .30
      )
      .setDepth(13);

  this.tweens.add({
    targets: swordFlash,
    scaleX: 2.8,
    scaleY: 1.4,
    alpha: 0,
    duration: 130,
    ease: 'Quad.out',
    onComplete: () =>
      swordFlash.destroy()
  });
}

}

showDizzyStars(intensity = 1) {
  if (
    this.motionReduced ||
    !this.player?.active ||
    this.finished ||
    this.respawning ||
    this.cinematicActive
  ) {
    return;
  }

  const power = Phaser.Math.Clamp(
    Number(intensity) || 1,
    0.5,
    1.5
  );

  this.dizzyStarsIntensity = Math.max(
    this.dizzyStarsIntensity || 0,
    power
  );

  this.dizzyStarsTimer = Math.max(
    this.dizzyStarsTimer || 0,
    650 + power * 550
  );

  // Reuse active effect.
  if (this.dizzyStars?.active) {
    return;
  }

  this.dizzyStarsSerial++;

  const container = this.add
    .container(
      this.player.x,
      this.player.y - 42
    )
    .setDepth(16);

  this.dizzyStars = container;

  const count =
    power >= 1.2
      ? 5
      : power >= 0.85
        ? 4
        : 3;

  const stars = [];

  const makeStar = (radius = 7) => {
    const graphics = this.add.graphics();
    const points = [];

    for (let i = 0; i < 10; i++) {
      const angle =
        -Math.PI / 2 +
        i * Math.PI / 5;

      const r =
        i % 2 === 0
          ? radius
          : radius * 0.42;

      points.push(
        new Phaser.Geom.Point(
          Math.cos(angle) * r,
          Math.sin(angle) * r
        )
      );
    }

    graphics
      .fillStyle(0xfff0b5, 1)
      .fillPoints(points, true);

    graphics
      .lineStyle(1, 0xffffff, 0.9)
      .strokePoints(points, true);

    graphics.setBlendMode(
      Phaser.BlendModes.ADD
    );

    return graphics;
  };

  for (
    let index = 0;
    index < count;
    index++
  ) {
    const star = makeStar(
      index % 2 === 0 ? 6 : 8
    );

    star.setData(
      'orbitIndex',
      index
    );

    star.setData(
      'orbitRadius',
      20 + power * 10
    );

    star.setData(
      'orbitAngle',
      (
        Math.PI * 2 * index
      ) / count
    );

    star.setData(
      'spin',
      index % 2 === 0 ? 1 : -1
    );

    container.add(star);
    stars.push(star);
  }

  const serial =
    this.dizzyStarsSerial;

  this.tweens.add({
    targets: stars,
    scale: {
      from: 0.45,
      to: 1
    },
    alpha: {
      from: 0,
      to: 1
    },
    duration: 150,
    ease: 'Back.out'
  });

  this.time.delayedCall(
    650 + power * 550,
    () => {
      if (
        serial !==
        this.dizzyStarsSerial
      ) {
        return;
      }

      this.tweens.add({
        targets: stars,
        scale: 0.2,
        alpha: 0,
        duration: 220,
        ease: 'Quad.in',
        onComplete: () => {
          container.destroy(true);

          if (
            this.dizzyStars ===
            container
          ) {
            this.dizzyStars = null;
          }

          this.dizzyStarsTimer = 0;
          this.dizzyStarsIntensity = 0;
        }
      });
    }
  );

  this.tweens.add({
    targets: this.player,
    angle: -4 * power,
    duration: 90,
    yoyo: true,
    repeat: 3,
    ease: 'Sine.inOut'
  });
}

createOpeningCinematic() {
  if (
    !this.cinematicActive ||
    this.divineArrivalPlayed
  ) {
    return;
  }

  this.divineArrivalPlayed = true;

  const width = this.scale.width;
  const height = this.scale.height;

  const spawnX = this.mission.spawn.x;
  const spawnY = this.mission.spawn.y;

  // ============================================================
  // DIVINE ARRIVAL · CINEMATIC LOCK
  // ============================================================
  this.physics.pause();

  if (this.player?.body) {
    this.player.body.setVelocity(0, 0);
  }

  this.cameras.main.stopFollow();

  const overlay = this.add
    .container(0, 0)
    .setScrollFactor(0)
    .setDepth(150);

  this.divineArrivalOverlay = overlay;

  // ------------------------------------------------------------
  // DARKNESS
  // ------------------------------------------------------------
  const darkness = this.add.rectangle(
    width / 2,
    height / 2,
    width,
    height,
    0x000208,
    1
  );

  // ------------------------------------------------------------
  // DIVINE LIGHT
  // ------------------------------------------------------------
  const divineGlow = this.add.circle(
    width / 2,
    height * 0.32,
    Math.min(width, height) * 0.24,
    0xfff0b5,
    0
  ).setBlendMode(
    Phaser.BlendModes.ADD
  );

  const divineCore = this.add.circle(
    width / 2,
    height * 0.32,
    Math.min(width, height) * 0.075,
    0xffffff,
    0
  ).setBlendMode(
    Phaser.BlendModes.ADD
  );

  // ------------------------------------------------------------
  // DIVINE FIGURE · SYMBOLIC SILHOUETTE
  // ------------------------------------------------------------
  const figure = this.add.container(
    width / 2,
    height * 0.30
  );

  const halo = this.add.circle(
    0,
    -46,
    26,
    0xffe7a6,
    0
  ).setBlendMode(
    Phaser.BlendModes.ADD
  );

  const head = this.add.circle(
    0,
    -46,
    10,
    0xffffff,
    0
  );

  const body = this.add.rectangle(
    0,
    -10,
    18,
    62,
    0xffffff,
    0
  );

  const arms = this.add.graphics();

  arms.lineStyle(
    7,
    0xffffff,
    1
  );

  arms.lineBetween(
    -6,
    -28,
    -48,
    -2
  );

  arms.lineBetween(
    6,
    -28,
    48,
    -2
  );

  const robe = this.add.triangle(
    0,
    28,
    -25,
    -20,
    25,
    -20,
    0,
    42,
    0xffffff,
    0
  );

  figure.add([
    halo,
    head,
    body,
    arms,
    robe
  ]);

  // ------------------------------------------------------------
  // LIGHT BEAM
  // ------------------------------------------------------------
  const beam = this.add.rectangle(
    width / 2,
    height * 0.52,
    Math.min(width, height) * 0.22,
    height * 0.82,
    0xfff5cf,
    0
  ).setBlendMode(
    Phaser.BlendModes.ADD
  );

  const beamCore = this.add.rectangle(
    width / 2,
    height * 0.52,
    Math.min(width, height) * 0.055,
    height * 0.82,
    0xffffff,
    0
  ).setBlendMode(
    Phaser.BlendModes.ADD
  );

  overlay.add([
    darkness,
    beam,
    beamCore,
    divineGlow,
    divineCore,
    figure
  ]);

 // ------------------------------------------------------------
// PLAYER STARTS DIRECTLY AT SPAWN
// ------------------------------------------------------------
this.player
  .setPosition(
    spawnX,
    spawnY
  )
  .setAlpha(1)
  .setAngle(0)
  .setScale(
    this.playerVisualBaseScaleX,
    this.playerVisualBaseScaleY
  );

this.player.play(
  'runner-idle',
  true
);

if (this.player.body) {
  this.player.body.reset(
    spawnX,
    spawnY
  );

  this.player.body.setVelocity(
    0,
    0
  );
}

  // ============================================================
  // PHASE 1 · LIGHT APPEARS
  // ============================================================
  this.tweens.add({
    targets: [
      divineGlow,
      divineCore,
      beam,
      beamCore,
      figure
    ],
    alpha: 1,
    duration: 650,
    ease: 'Cubic.out'
  });

  this.tweens.add({
    targets: divineGlow,
    scale: 1.55,
    alpha: 0.28,
    duration: 900,
    yoyo: true,
    ease: 'Sine.inOut'
  });

  this.tweens.add({
    targets: halo,
    scale: 1.35,
    alpha: 1,
    duration: 550,
    ease: 'Quad.out'
  });

  // ============================================================
  // PHASE 2 · FIGURE FADES / PLAYER DESCENDS
  // ============================================================
  this.time.delayedCall(
    1050,
    () => {
      if (!this.cinematicActive) {
        return;
      }

      this.tweens.add({
        targets: figure,
        y: height * 0.34,
        alpha: 0,
        duration: 420,
        ease: 'Quad.in'
      });

      this.tweens.add({
        targets: [
          divineGlow,
          divineCore
        ],
        scale: 0.35,
        alpha: 0,
        duration: 480,
        ease: 'Quad.in'
      });

      this.tweens.add({
        targets: beam,
        scaleX: 0.25,
        alpha: 0.12,
        duration: 520,
        ease: 'Quad.in'
      });

      this.player.setAlpha(1);
this.player
  .setPosition(
    spawnX,
    spawnY
  )
  .setAngle(0)
  .setAlpha(1)
  .setScale(
    this.playerVisualBaseScaleX,
    this.playerVisualBaseScaleY
  )
  .play(
    'runner-idle',
    true
  );

if (this.player.body) {
  this.player.body.reset(
    spawnX,
    spawnY
  );

  this.player.body.setVelocity(
    0,
    0
  );
}
    }
  );

  // ============================================================
  // PHASE 3 · IMPACT
  // ============================================================
  
  this.time.delayedCall(
    1800,
    () => {
      if (!this.cinematicActive) {
        return;
      }

      this.player.play(
        'runner-land',
        true
      );

      this.player.setScale(
        this.playerVisualBaseScaleX * 1.18,
        this.playerVisualBaseScaleY * 0.78
      );

      this.worldLightPulse(
        0xffd06e,
        0.24,
        380,
        70
      );

      this.worldLightFlash(
        0xfff0b5,
        0.10,
        160
      );

      this.shake(
        220,
        0.010
      );

     if (
  !this.motionReduced &&
  this.graphicsLevel >= 2
) {
  this.dust.emitParticleAt(
    spawnX,
    spawnY + 12,
    18
  );

  const landingShock =
          this.add
            .circle(
              spawnX,
              spawnY + 28,
              10,
              0xffd06e,
              0.34
            )
            .setDepth(12);

        landingShock.setStrokeStyle(
          2,
          0xfff0b5,
          0.9
        );

        this.tweens.add({
          targets: landingShock,
          scale: 5.4,
          alpha: 0,
          duration: 340,
          ease: 'Quad.out',
          onComplete: () =>
            landingShock.destroy()
        });
      }

      this.tweens.add({
        targets: this.player,
        scaleX:
          this.playerVisualBaseScaleX,
        scaleY:
          this.playerVisualBaseScaleY,
        duration: 150,
        ease: 'Back.out'
      });
    }
  );

  // ============================================================
  // PHASE 4 · SHAKE OFF
  // ============================================================
  this.time.delayedCall(
    2050,
    () => {
      if (!this.cinematicActive) {
        return;
      }

      this.player.play(
        'runner-land',
        true
      );

      this.tweens.add({
        targets: this.player,
        angle: -5,
        duration: 90,
        yoyo: true,
        repeat: 3,
        ease: 'Sine.inOut'
      });
    }
  );

  // ============================================================
  // PHASE 5 · GAMEPLAY
  // ============================================================
  const finish = () => {
    if (!this.cinematicActive) {
      return;
    }

    this.cinematicActive = false;

    this.tweens.killTweensOf(
      this.player
    );

    this.player
      .setAngle(0)
      .setAlpha(1)
      .setScale(
        this.playerVisualBaseScaleX,
        this.playerVisualBaseScaleY
      )
      .setPosition(
        spawnX,
        spawnY
      )
      .play(
        'runner-idle',
        true
      );

    if (this.player.body) {
      this.player.body.reset(
        spawnX,
        spawnY
      );

      this.player.body.setVelocity(
        0,
        0
      );
    }

    overlay.destroy(true);
    this.divineArrivalOverlay = null;

  this.input.keyboard.off(
  'keydown-SPACE',
  this.cinematicSkipHandler
);

this.input.keyboard.off(
  'keydown-A',
  this.cinematicSkipHandler
);

this.input.keyboard.off(
  'keydown-D',
  this.cinematicSkipHandler
);

this.input.keyboard.off(
  'keydown-LEFT',
  this.cinematicSkipHandler
);

this.input.keyboard.off(
  'keydown-RIGHT',
  this.cinematicSkipHandler
);

    this.cameras.main.startFollow(
      this.player,
      true,
      0.1,
      0.1,
      this.cameraOffsetX,
      this.cameraOffsetY
    );

    this.physics.resume();

    this.playerCue(
      'ARRIVAL COMPLETE · MOVE OUT',
      '#8df4ff'
    );

    this.createMissionTransmission();
  };

this.cinematicSkipHandler =
  finish;

this.input.keyboard.once(
  'keydown-SPACE',
  this.cinematicSkipHandler
);

this.input.keyboard.once(
  'keydown-A',
  this.cinematicSkipHandler
);

this.input.keyboard.once(
  'keydown-D',
  this.cinematicSkipHandler
);

this.input.keyboard.once(
  'keydown-LEFT',
  this.cinematicSkipHandler
);

this.input.keyboard.once(
  'keydown-RIGHT',
  this.cinematicSkipHandler
);

  this.time.delayedCall(
    2850,
    finish
  );
}
   
createMissionTransmission() {
  const story =
    this.mission.story;

const width =
  this.scale.width;

const height =
  this.scale.height;

const compact =
  width < 700;

const panelWidth =
  compact
    ? Math.min(
        width - 32,
        420
      )
    : width - 44;

const panelHeight =
  compact
    ? Math.min(
        height - 48,
        340
      )
    : height - 64;

const panelX =
  compact
    ? (width -
        panelWidth) /
      2
    : 22;

const panelTop =
  (height -
    panelHeight) /
  2;

const textWidth =
  compact
    ? panelWidth - 62
    : Math.min(
        panelWidth - 62,
        width * .5
      );

const overlay =
  this.add
    .container(0, 0)
    .setScrollFactor(0)
    .setDepth(100);

const veil =
  this.add.rectangle(
    width / 2,
    height / 2,
    width,
    height,
    0x030711,
    compact
      ? .74
      : .34
  );

const panel =
  this.add.rectangle(
    panelX +
      panelWidth / 2,
    height / 2,
    panelWidth,
    panelHeight,
    0x050914,
    compact
      ? .94
      : .66
  ).setStrokeStyle(
    1,
    0x8df4ff,
    .55
  );

const panelShade =
  this.add.rectangle(
    panelX +
      panelWidth / 2,
    height / 2,
    panelWidth - 20,
    panelHeight - 20,
    0x0a1527,
    compact
      ? .45
      : .24
  ).setStrokeStyle(
    1,
    0x8df4ff,
    .12
  );

const topRail =
  this.add.rectangle(
    panelX + 30,
    panelTop + 24,
    48,
    3,
    0x8df4ff,
    .95
  ).setOrigin(0, .5);

const scanLine =
  this.add.rectangle(
    panelX +
      panelWidth / 2,
    panelTop + 52,
    panelWidth - 56,
    1,
    0x8df4ff,
    .26
  );

const planetX =
  compact
    ? width * .78
    : width * .79;

const planetY =
  height * .58;

const planetRadius =
  Math.min(
    width,
    height
  ) *
  (
    compact
      ? .2
      : .3
  );

const planetGlow =
  this.add.circle(
    planetX,
    planetY,
    planetRadius * 1.15,
    0x167baf,
    .1
  );

const planet =
  this.add.circle(
    planetX,
    planetY,
    planetRadius,
    0x162f58,
    .9
  ).setStrokeStyle(
    2,
    0x8df4ff,
    .72
  );

const atmosphere =
  this.add.circle(
    planetX,
    planetY,
    planetRadius * 1.08,
    0x8df4ff,
    .08
  ).setStrokeStyle(
    1,
    0x8df4ff,
    .35
  );

const earth =
  this.add.circle(
    width * .18,
    height * .18,
    Math.min(width, height) * .09,
    0x1b5d91,
    .95
  ).setStrokeStyle(
    2,
    0xb9f5ff,
    .7
  );

const earthCloud =
  this.add.circle(
    width * .18 - 12,
    height * .18 - 8,
    Math.min(width, height) * .072,
    0xdffcff,
    .13
  );

const subtitle =
  this.add.text(
    width / 2,
    height -
      (
        compact
          ? 34
          : 42
      ),
    'EARTH ORBIT · RELAY DISTRESS SIGNAL RECEIVED',
    {
      fontFamily: 'DM Mono',
      fontSize:
        compact
          ? '8px'
          : '11px',
      color: '#dffcff',
      stroke: '#08101c',
      strokeThickness: 4
    }
  )
    .setOrigin(.5)
    .setScrollFactor(0)
    .setDepth(102);

const stars =
  Array.from(
    {
      length:
        compact
          ? 12
          : 22
    },
    (_, index) =>
      this.add.circle(
        width *
          (
            .56 +
            (
              index * 37 %
              42
            ) /
            100
          ),
        34 +
          (
            index * 71 %
            Math.max(
              80,
              height - 68
            )
          ),
        index % 4 === 0
          ? 1.8
          : 1,
        0xb9f5ff,
        .18 +
          (
            index % 3
          ) *
          .12
      )
  );

const ship =
  this.add.triangle(
    -80,
    height * .31,
    0,
    20,
    60,
    38,
    0,
    56,
    0x8df4ff
  ).setStrokeStyle(
    2,
    0xdffcff
  );

const shipTrail =
  this.add.rectangle(
    -126,
    height * .31 + 38,
    90,
    2,
    0x8df4ff,
    .35
  ).setOrigin(0, .5);

const eyebrow =
  this.add.text(
    panelX + 30,
    panelTop +
      (
        compact
          ? 52
          : 76
      ),
    'RELAY // ORIENTATION',
    {
      fontFamily: 'DM Mono',
      fontSize:
        compact
          ? '9px'
          : '12px',
      color: '#8df4ff',
      letterSpacing: 2
    }
  );

const title =
  this.add.text(
    panelX + 30,
    panelTop +
      (
        compact
          ? 78
          : 108
      ),
    story?.chapter ||
      'NIGHT SHIFT // ARRIVAL',
    {
      fontFamily: 'DM Mono',
      fontSize:
        compact
          ? '16px'
          : '27px',
      color: '#dffcff',
      wordWrap: {
        width:
          textWidth
      }
    }
  );

const copy =
  this.add.text(
    panelX + 30,
    panelTop +
      (
        compact
          ? 116
          : 188
      ),
    story?.arrival ||
      'The relay planet went dark.\nOne courier enters the storm zone.',
    {
      fontFamily: 'DM Mono',
      fontSize:
        compact
          ? '10px'
          : '15px',
      wordWrap: {
        width:
          textWidth
      },
      lineSpacing:
        compact
          ? 5
          : 11,
      color: '#b9d5ee'
    }
  );

const routeBrief =
  this.add.text(
    panelX + 30,
    panelTop +
      (
        compact
          ? 174
          : 302
      ),
    compact
      ? 'FOLLOW THE GOLD SIGNALS. THEY MARK THE SAFE LINE.'
      : 'The relay is weak, but the gold Signals still cut through the dark. Keep moving and let the route reveal itself one rooftop at a time.',
    {
      fontFamily: 'DM Mono',
      fontSize:
        compact
          ? '8px'
          : '12px',
      color: '#8df4ff',
      wordWrap: {
        width:
          textWidth
      },
      lineSpacing:
        compact
          ? 3
          : 7
    }
  );

const runnerBrief =
  this.add.text(
    panelX + 30,
    panelTop +
      (
        compact
          ? 210
          : 358
      ),
    compact
      ? 'CHECKPOINTS SAVE YOUR RUN. MOMENTUM IS YOUR SHIELD.'
      : 'Checkpoint beacons remember your progress, so take the risky line, learn the rhythm and make the city answer back.',
    {
      fontFamily: 'DM Mono',
      fontSize:
        compact
          ? '8px'
          : '12px',
      color: '#ffd06e',
      wordWrap: {
        width:
          textWidth
      },
      lineSpacing:
        compact
          ? 3
          : 7
    }
  );

const controlsY =
  panelTop +
  panelHeight -
  (
    compact
      ? 76
      : 88
  );

const controls =
  this.add.text(
    panelX + 30,
    controlsY,
    'A / D  MOVE     SPACE  JUMP     E  PLASMA',
    {
      fontFamily: 'DM Mono',
      fontSize:
        compact
          ? '9px'
          : '11px',
      color: '#ffd06e',
      wordWrap: {
        width:
          textWidth
      },
      lineSpacing: 6
    }
  );

const skip =
  this.add.text(
    panelX + 30,
    panelTop +
      panelHeight -
      (
        compact
          ? 30
          : 36
      ),
    compact
      ? 'AUTO-CLOSE · 3 SEC'
      : 'SPACE · SKIP LANDING',
    {
      fontFamily: 'DM Mono',
      fontSize:
        compact
          ? '8px'
          : '11px',
      color: '#8df4ff'
    }
  );

const visuals = [
  earth,
  earthCloud,
  planetGlow,
  ...stars,
  atmosphere,
  planet
];

const panelElements = [
  panel,
  panelShade,
  topRail,
  scanLine,
  shipTrail,
  ship,
  eyebrow,
  title,
  copy,
  routeBrief,
  runnerBrief,
  controls,
  skip
];

overlay.add(
  compact
    ? [
        veil,
        ...visuals,
        ...panelElements
      ]
    : [
        veil,
        ...panelElements,
        ...visuals
      ]
);

this.tweens.add({
  targets: [
    ship,
    shipTrail
  ],
  x:
    compact
      ? width * .52
      : width * .58,
  y:
    height * .43,
  duration: 2600,
  ease: 'Cubic.out'
});

const narration = [
  [
    120,
    'Earth is behind you. The relay planet is calling.'
  ],
  [
    2100,
    'Descent corridor open. Follow the gold signals to the surface.'
  ],
  [
    3900,
    'Landing complete. Keep the line open.'
  ]
];

narration.forEach(
  ([delay, text]) =>
    this.time.delayedCall(
      delay,
      () => {
        if (!overlay?.active)
          return;

        subtitle.setText(
          text
        );

        this.game.events.emit(
          'narration',
          text
        );
      }
    )
);

if (!this.motionReduced) {
  this.tweens.add({
    targets: [
      earth,
      earthCloud
    ],
    alpha: 0,
    scale: .72,
    duration: 2500,
    ease: 'Cubic.in'
  });

  this.tweens.add({
    targets: atmosphere,
    scale: 1.08,
    alpha: .3,
    yoyo: true,
    repeat: -1,
    duration: 900
  });

  this.tweens.add({
    targets: planetGlow,
    scale: 1.14,
    alpha: .03,
    yoyo: true,
    repeat: -1,
    duration: 1250
  });

  this.tweens.add({
    targets: scanLine,
    alpha: {
      from: .14,
      to: .5
    },
    yoyo: true,
    repeat: -1,
    duration: 680
  });

  this.tweens.add({
    targets: stars,
    alpha: {
      from: .12,
      to: .62
    },
    yoyo: true,
    repeat: -1,
    duration: 1100,
    delay: (_, target) =>
      target.x % 240
  });
}

const transmissionSession =
  this.runId;

const closeTransmission = () => {
  this.input.keyboard.off(
    'keydown-SPACE',
    closeTransmission
  );

  if (
    transmissionSession !== this.runId ||
    !overlay?.active
  ) {
    return;
  }

  overlay.destroy(true);
};

this.time.delayedCall(
  compact
    ? 3600
    : 5600,
  closeTransmission
);

this.input.keyboard.once(
  'keydown-SPACE',
  closeTransmission
);

this.events.once(
  Phaser.Scenes.Events.SHUTDOWN,
  () => {
    this.input.keyboard.off(
      'keydown-SPACE',
      closeTransmission
    );
  }
);

}

createObjectiveHUD() {
  const compact =
    this.scale.width < 768;

  /*
   * ============================================================
   * OBJECTIVE HUD · CYBER COMMAND
   * Premium gameplay HUD language:
   * - dark glass
   * - cyan energy edge
   * - scan line
   * - compact telemetry
   * - clean spacing
   * ============================================================
   */

  if (compact) {
    this.objectiveHUD = null;
    this.objectiveText = null;
    this.objectiveProgressBar = null;
    this.objectiveProgressText = null;
    return;
  }

  const width =
    Math.min(
      this.scale.width - 32,
      430
    );

  const x = 18;
  const y = 118;

  const container =
    this.add
      .container(x, y)
      .setScrollFactor(0)
      .setDepth(100);

  /*
   * OUTER GLOW
   */
  const aura =
    this.add.rectangle(
      width / 2,
      40,
      width + 12,
      82,
      0x07111d,
      0.20
    )
    .setStrokeStyle(
      2,
      0x8df4ff,
      0.16
    );

  /*
   * SHADOW / DEPTH
   */
  const shadow =
    this.add.rectangle(
      width / 2 + 5,
      44,
      width,
      78,
      0x000000,
      0.48
    );

  /*
   * MAIN GLASS PLATE
   */
  const plate =
    this.add.rectangle(
      width / 2,
      40,
      width,
      78,
      0x06101a,
      0.97
    )
    .setStrokeStyle(
      1.5,
      0x8df4ff,
      0.82
    );

  /*
   * INNER GLASS
   */
  const inner =
    this.add.rectangle(
      width / 2,
      40,
      width - 8,
      70,
      0x0b1b2a,
      0.78
    )
    .setStrokeStyle(
      1,
      0x35677d,
      0.42
    );

  /*
   * TOP SCAN LINE
   */
  const scanBase =
    this.add.rectangle(
      width / 2,
      5,
      width - 22,
      2,
      0x8df4ff,
      0.30
    );

  const scanHot =
    this.add.rectangle(
      width / 2 - 95,
      5,
      74,
      2,
      0xe8fdff,
      0.95
    );

  /*
   * LEFT ENERGY RAIL
   */
  const energyRail =
    this.add.rectangle(
      7,
      40,
      3,
      58,
      0x8df4ff,
      1
    );

  const energyRailGlow =
    this.add.rectangle(
      11,
      40,
      2,
      48,
      0x8df4ff,
      0.22
    );

  /*
   * HEADER
   */
  const header =
    this.add.text(
      20,
      9,
      'OBJECTIVE',
      {
        fontFamily: 'DM Mono',
        fontSize: '10px',
        color: '#8df4ff',
        fontStyle: 'bold',
        letterSpacing: 1.35,
        stroke: '#04101a',
        strokeThickness: 4,
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: '#56eaff',
          blur: 8,
          fill: true
        }
      }
    );

  const headerSub =
    this.add.text(
      20,
      23,
      'ACTIVE MISSION DIRECTIVE',
      {
        fontFamily: 'DM Mono',
        fontSize: '7px',
        color: '#58788d',
        fontStyle: 'bold',
        letterSpacing: 1.1
      }
    );

  /*
   * OBJECTIVE TEXT
   */
  const objective =
    this.add.text(
      20,
      36,
      this.mission?.story?.arrival ||
        'REACH THE RELAY',
      {
        fontFamily: 'DM Mono',
        fontSize: '11px',
        color: '#e8fdff',
        fontStyle: 'bold',
        letterSpacing: 0.45,
        lineSpacing: 2,
        stroke: '#04101a',
        strokeThickness: 4,
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: '#8df4ff',
          blur: 5,
          fill: true
        },
      wordWrap: {
          width:
            Math.max(
              165,
              width - 245
            ),
          useAdvancedWrap: true
        },
        maxLines: 2
      }
    );

  /*
   * STATUS AREA
   */
  const statusHeader =
    this.add.text(
      width - 162,
      10,
      'MISSION',
      {
        fontFamily: 'DM Mono',
        fontSize: '7px',
        color: '#637f92',
        fontStyle: 'bold',
        letterSpacing: 1.15
      }
    );

  const progressValue =
    this.add.text(
      width - 18,
      8,
      '0%',
      {
        fontFamily: 'DM Mono',
        fontSize: '14px',
        color: '#e8fdff',
        fontStyle: 'bold',
        stroke: '#04101a',
        strokeThickness: 4,
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: '#8df4ff',
          blur: 7,
          fill: true
        }
      }
    )
    .setOrigin(1, 0);

  /*
   * PROGRESS TRACK
   */
  const progressBack =
    this.add.rectangle(
      width - 83,
      27,
      136,
      6,
      0x12283a,
      1
    )
    .setStrokeStyle(
      1,
      0x3a6478,
      0.72
    );

  const progressFill =
    this.add.rectangle(
      width - 151,
      27,
      132,
      3,
      0x8df4ff,
      1
    )
    .setOrigin(
      0,
      0.5
    );

  const progressHot =
    this.add.rectangle(
      width - 151,
      25,
      132,
      1.5,
      0xe8fdff,
      0.90
    )
    .setOrigin(
      0,
      0.5
    );

  /*
   * DIVIDER
   */
  const divider =
    this.add.rectangle(
      width / 2,
      55,
      width - 42,
      1,
      0x31566a,
      0.70
    );

  /*
   * TELEMETRY FOOTER
   */
  const statusText =
    this.add.text(
      20,
      62,
      'ROUTE ACTIVE  //  LINK STABLE',
      {
        fontFamily: 'DM Mono',
        fontSize: '7px',
        color: '#71899d',
        fontStyle: 'bold',
        letterSpacing: 1.0
      }
    );

  /*
   * LIVE STATUS DOT
   */
  const signalGlow =
    this.add.circle(
      width - 24,
      65,
      7,
      0x8df4ff,
      0.10
    );

  const signal =
    this.add.circle(
      width - 24,
      65,
      3,
      0x8df4ff,
      1
    );

  /*
   * CORNER HUD MARKERS
   */
  const cornerTL =
    this.add.rectangle(
      15,
      13,
      20,
      1,
      0x8df4ff,
      0.72
    );

  const cornerTR =
    this.add.rectangle(
      width - 15,
      13,
      20,
      1,
      0x8df4ff,
      0.72
    );

  const cornerBL =
    this.add.rectangle(
      15,
      70,
      20,
      1,
      0x8df4ff,
      0.34
    );

  const cornerBR =
    this.add.rectangle(
      width - 15,
      70,
      20,
      1,
      0x8df4ff,
      0.34
    );

  /*
   * BUILD
   */
  container.add([
    aura,
    shadow,
    plate,
    inner,
    scanBase,
    scanHot,
    energyRail,
    energyRailGlow,
    header,
    headerSub,
    objective,
    statusHeader,
    progressValue,
    progressBack,
    progressFill,
    progressHot,
    divider,
    statusText,
    signalGlow,
    signal,
    cornerTL,
    cornerTR,
    cornerBL,
    cornerBR
  ]);

  /*
   * SCAN ANIMATION
   */
  this.tweens.add({
    targets: scanHot,
    x: {
      from: width / 2 - 95,
      to: width / 2 + 95
    },
    alpha: {
      from: 0.20,
      to: 1
    },
    duration: 1750,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut'
  });

  /*
   * LIVE SIGNAL PULSE
   */
  this.tweens.add({
    targets: signalGlow,
    scale: {
      from: 0.8,
      to: 1.6
    },
    alpha: {
      from: 0.06,
      to: 0.22
    },
    duration: 900,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut'
  });

  this.tweens.add({
    targets: signal,
    alpha: {
      from: 0.45,
      to: 1
    },
    duration: 650,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut'
  });

  /*
   * GAMEPLAY REFERENCES
   */
  this.objectiveHUD =
    container;

  this.objectiveText =
    objective;

  this.objectiveProgressBar =
    progressFill;

  this.objectiveProgressText =
    progressValue;
}

createDetectionHUD() {

  const compact =
    this.scale.width < 768;

  /*
   * ============================================================
   * DETECTION HUD · THREAT TELEMETRY
   * Same visual language as gameplay HUD.
   * ============================================================
   */

  const width =
    Math.min(
      this.scale.width - 32,
      compact ? 215 : 250
    );

  const x =
    this.scale.width -
    width -
    16;

const y =
    compact
      ? 150
      : 125;

  const container =
    this.add
      .container(
        x,
        y
      )
      .setScrollFactor(0)
      .setDepth(100);

  if (compact) {
    container.setVisible(false);
  }

  /*
   * OUTER AURA
   */
  const aura =
    this.add.rectangle(
      width / 2,
      34,
      width + 10,
      70,
      0x12070d,
      0.20
    )
    .setStrokeStyle(
      2,
      0xff5364,
      0.16
    );

  /*
   * SHADOW
   */
  const shadow =
    this.add.rectangle(
      width / 2 + 4,
      37,
      width,
      68,
      0x000000,
      0.48
    );

  /*
   * MAIN PLATE
   */
  const plate =
    this.add.rectangle(
      width / 2,
      34,
      width,
      68,
      0x11090f,
      0.97
    )
    .setStrokeStyle(
      1.5,
      0xff5364,
      0.82
    );

  /*
   * INNER GLASS
   */
  const inner =
    this.add.rectangle(
      width / 2,
      34,
      width - 8,
      60,
      0x1a0d15,
      0.78
    )
    .setStrokeStyle(
      1,
      0x70303d,
      0.42
    );

  /*
   * TOP SCAN
   */
  const scanBase =
    this.add.rectangle(
      width / 2,
      4,
      width - 22,
      2,
      0xff5364,
      0.28
    );

  const scanHot =
    this.add.rectangle(
      width / 2 - 60,
      4,
      48,
      2,
      0xffd9de,
      0.92
    );

  /*
   * RIGHT THREAT RAIL
   */
  const threatRail =
    this.add.rectangle(
      width - 7,
      34,
      3,
      50,
      0xff5364,
      1
    );

  const threatGlow =
    this.add.rectangle(
      width - 11,
      34,
      2,
      42,
      0xff5364,
      0.20
    );

  /*
   * HEADER
   */
  const title =
    this.add.text(
      14,
      9,
      'DETECTION',
      {
        fontFamily: 'DM Mono',
        fontSize: compact
          ? '9px'
          : '10px',
        color: '#ff7180',
        fontStyle: 'bold',
        letterSpacing: 1.6,
        stroke: '#180910',
        strokeThickness: 4,
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: '#ff5364',
          blur: 8,
          fill: true
        }
      }
    );

  const subtitle =
    this.add.text(
      14,
      22,
      'THREAT TELEMETRY',
      {
        fontFamily: 'DM Mono',
        fontSize: '7px',
        color: '#875763',
        fontStyle: 'bold',
        letterSpacing: 1.05
      }
    );

  /*
   * STATUS
   */
  const status =
    this.add.text(
      14,
      34,
      'CLEAR',
      {
        fontFamily: 'DM Mono',
        fontSize: compact
          ? '9px'
          : '11px',
        color: '#e8fdff',
        fontStyle: 'bold',
        letterSpacing: 0.6,
        stroke: '#180910',
        strokeThickness: 4
      }
    );

  /*
   * ALERT INDICATOR
   */
  const alertGlow =
    this.add.circle(
      width - 20,
      13,
      6,
      0xff5364,
      0.10
    );

  const alertDot =
    this.add.circle(
      width - 20,
      13,
      2.5,
      0xff5364,
      1
    );

  /*
   * DETECTION TRACK
   */
  const progressBack =
    this.add.rectangle(
      width - 67,
      28,
      78,
      6,
      0x31151f,
      1
    )
    .setStrokeStyle(
      1,
      0x66303b,
      0.72
    );

  const progressFill =
    this.add.rectangle(
      width - 106,
      28,
      76,
      3,
      0xff5364,
      1
    )
    .setOrigin(
      0,
      0.5
    );

  const progressHot =
    this.add.rectangle(
      width - 106,
      26,
      76,
      1.5,
      0xffd9de,
      0.88
    )
    .setOrigin(
      0,
      0.5
    );

  const progressText =
    this.add.text(
      width - 67,
      39,
      '0%',
      {
        fontFamily: 'DM Mono',
        fontSize: '8px',
        color: '#ff7180',
        fontStyle: 'bold',
        letterSpacing: 0.4,
        stroke: '#180910',
        strokeThickness: 2
      }
    )
    .setOrigin(
      0.5
    );

  /*
   * DIVIDER
   */
  const divider =
    this.add.rectangle(
      width / 2,
      52,
      width - 38,
      1,
      0x6b303c,
      0.64
    );

  /*
   * FOOTER TELEMETRY
   */
  const telemetry =
    this.add.text(
      14,
      59,
      'SCAN ACTIVE  //  THREAT LINK',
      {
        fontFamily: 'DM Mono',
        fontSize: '7px',
        color: '#845964',
        fontStyle: 'bold',
        letterSpacing: 0.8
      }
    );

  /*
   * BUILD
   */
  container.add([
    aura,
    shadow,
    plate,
    inner,
    scanBase,
    scanHot,
    threatRail,
    threatGlow,
    title,
    subtitle,
    status,
    alertGlow,
    alertDot,
    progressBack,
    progressFill,
    progressHot,
    progressText,
    divider,
    telemetry
  ]);

  /*
   * SCAN ANIMATION
   */
  this.tweens.add({
    targets: scanHot,
    x: {
      from: width / 2 - 60,
      to: width / 2 + 60
    },
    alpha: {
      from: 0.18,
      to: 0.95
    },
    duration: 1250,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut'
  });

  /*
   * ALERT PULSE
   */
  this.tweens.add({
    targets: alertGlow,
    scale: {
      from: 0.8,
      to: 1.65
    },
    alpha: {
      from: 0.05,
      to: 0.20
    },
    duration: 700,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut'
  });

  this.tweens.add({
    targets: alertDot,
    alpha: {
      from: 0.45,
      to: 1
    },
    duration: 500,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut'
  });

  /*
   * GAMEPLAY REFERENCES
   */
  this.detectionHUD =
    container;

  this.detectionStatusText =
    status;

  this.detectionProgressBar =
    progressFill;

  this.detectionProgressText =
    progressText;
}

createBoostPads() {
this.boostPads =
this.physics.add.staticGroup();

this.mission.boostPads.forEach(
  ([x, y]) => {
    const pad =
      this.boostPads.create(
        x,
        y,
        'boost-pad'
      );

    pad.refreshBody();
  }
);

this.physics.add.overlap(
  this.player,
  this.boostPads,
  () => {
    const body =
      this.player?.body;

    if (
      !body ||
      !this.player?.active ||
      this.boostCooldown > 0 ||
      body.velocity.y < -60
    ) {
      return;
    }

    this.boostCooldown = 260;

    body.setVelocityY(
      -825
    );

if (
  !this.motionReduced &&
  this.player?.active
) {
  const boostPulse =
    this.add
      .circle(
        this.player.x,
        this.player.y + 24,
        8,
        0x8df4ff,
        0.28
      )
      .setDepth(11);

  this.tweens.add({
    targets: boostPulse,
    scaleX: 3.2,
    scaleY: 0.55,
    alpha: 0,
    duration: 190,
    ease: 'Quad.out',
    onComplete: () =>
      boostPulse.destroy()
  });

  this.tweens.add({
    targets: this.player,
    scaleX:
      this.playerVisualBaseScaleX * 0.94,
    scaleY:
      this.playerVisualBaseScaleY * 1.08,
    duration: 60,
    yoyo: true,
    ease: 'Quad.out'
  });
}

    this.playerCue(
  'BOOST LAUNCH',
  '#8df4ff'
);

this.gadgetPulse(
  0x8df4ff,
  12,
  320
);

/* -------------------------------------------------
   BOOST WORLD REACTION
   Purely visual — no physics / gameplay mutation.
   ------------------------------------------------- */

this.worldLightPulse(
  0x8df4ff,
  0.18,
  240,
  58
);

// ============================================================
// BOOST · MICRO ENERGY PULSE
// Two quick rings for stronger visual feedback.
// Visual only — no gameplay mutation.
// ============================================================
if (
  !this.motionReduced &&
  this.player?.active
) {
  for (let i = 0; i < 2; i++) {
    const pulse =
      this.add
        .ellipse(
          this.player.x,
          this.player.y + 24,
          18,
          7,
          0x8df4ff,
          0.28
        )
        .setStrokeStyle(
          1.5,
          0xe8fdff,
          0.78
        )
        .setDepth(11);

    this.tweens.add({
      targets: pulse,
      scaleX: 2.8,
      scaleY: 1.6,
      alpha: 0,
      delay: i * 70,
      duration: 220,
      ease: 'Quad.out',
      onComplete: () => {
        if (pulse?.active) {
          pulse.destroy();
        }
      }
    });
  }
}

this.worldLightFlash(
  0x8df4ff,
  0.045,
  110
);

const boostPulse =
  this.add
    .circle(
      this.player.x,
      this.player.y + 20,
      10,
      0x8df4ff,
      .38
    )
    .setDepth(11);

this.tweens.add({
  targets: boostPulse,
  scale: 4.4,
  alpha: 0,
  duration: 270,
  ease: 'Quad.out',
  onComplete: () =>
    boostPulse.destroy()
});

    if (this.graphicsLevel >= 1) {
  this.dust.emitParticleAt(
    this.player.x,
    this.player.y + 24,
    7
  );
}

    this.game.events.emit(
      'feedback',
      'jump'
    );
  },
  undefined,
  this
);

}

createChaser() {
if (
!this.mission.chase &&
!this.mission.enemies.length
) {
return;
}

this.chaser =
  this.physics.add.sprite(
    this.mission.spawn.x - 220,
    this.mission.spawn.y,
    'chaser'
  )
    .setDepth(9)
    .setVisible(false);

this.chaser.body
  .setAllowGravity(false)
  .setSize(34, 52)
  .setOffset(9, 4)
  .setEnable(false);

this.chaseSection = -1;

this.physics.add.overlap(
  this.player,
  this.chaser,
 () => {
 if (
  !this.motionReduced &&
  this.graphicsLevel >= 2
) {
  this.cameras.main.flash(
    180,
    255,
    60,
    60
  );
}

  const hitPulse =
    this.add
      .circle(
        this.player.x,
        this.player.y,
        16,
        0xff826e,
        .34
      )
      .setDepth(13);

  this.tweens.add({
    targets: hitPulse,
    scale: 3.8,
    alpha: 0,
    duration: 260,
    onComplete: () =>
      hitPulse.destroy()
  });

  this.shake(
    120,
    0.006
  );

  this.fail(
    'The interceptor reclaimed the signal.'
  );
},
  undefined,
  this
);

}

updateChaser(delta) {
if (!this.chaser) return;

const sections =
  this.mission.chase?.sections ||
  [];

sections.forEach(
  (section, index) => {
    if (
      !this.chaseWarnings.has(index) &&
      this.player.x >=
        section.start - 260 &&
      this.player.x <
        section.start
    ) {
      this.chaseWarnings.add(
        index
      );

  // CHASE AHEAD FLOATING LABEL DISABLED

const cue = this.add.zone(
section.start - 235,
250,
1,
1
)
.setAlpha(0)
.setDepth(13);

      this.tweens.add({
        targets: cue,
        alpha: 0,
        delay: 1300,
        duration: 500,
        onComplete: () =>
          cue.destroy()
      });
    }
  }
);

let sectionIndex =
  sections.findIndex(
    section =>
      this.player.x >=
        section.start &&
      this.player.x <=
        section.end
  );

const alarmSection =
  sectionIndex === -1 &&
  this.alarmTimer > 0
    ? {
        start: 0,
        end: this.worldWidth,
        speed: 260
      }
    : null;

if (alarmSection) {
  sectionIndex = -2;
}

if (sectionIndex === -1) {
  if (
    this.chaseSection !==
    -1
  ) {
    this.chaseEscapes++;

    this.chaser.setVisible(
      false
    );

    this.chaser.body.setEnable(
      false
    );

    this.chaseSection = -1;

    this.game.events.emit(
      'chase',
      false
    );
  }

  return;
}

const section =
  alarmSection ||
  sections[sectionIndex];

if (
  sectionIndex !==
  this.chaseSection
) {
  this.chaseSection =
    sectionIndex;

  this.chaser
    .setPosition(
      this.player.x - 210,
      this.player.y
    )
    .setVisible(true);

  this.chaser.body
    .setEnable(true)
    .updateFromGameObject();

  // INTERCEPTOR LOCK TEXT DISABLED

// Keep the original tween timing/animation flow without rendering text.
const cue = this.add.zone(
this.player.x,
this.player.y - 78,
1,
1
)
.setAlpha(0)
.setDepth(13);

this.tweens.add({
targets: cue,
y: cue.y - 20,
alpha: 0,
duration: 620,
onComplete: () => cue.destroy()
});

  this.game.events.emit(
    'feedback',
    'chase'
  );

  this.game.events.emit(
    'chase',
    true
  );
}

const targetX =
  this.player.x - 38;

this.chaser.x =
  Math.min(
    targetX,
    this.chaser.x +
      section.speed *
        delta /
        1000
  );

this.chaser.y =
  Phaser.Math.Linear(
    this.chaser.y,
    this.player.y,
    .12
  );

this.chaser.body.updateFromGameObject();

}

createGoal() {
this.goal =
this.physics.add
.staticImage(
this.mission.goal.x,
this.mission.goal.y,
'goal'
)
.setOrigin(0, 0);

this.goal.refreshBody();

  /*
 * DELIVERY BEACON FX
 */
const beaconGlow =
  this.add
    .circle(
      this.goal.x + 28,
      this.goal.y + 34,
      28,
      0xffd06e,
      0.08
    )
    .setDepth(7);

const beaconRing =
  this.add
    .circle(
      this.goal.x + 28,
      this.goal.y + 34,
      22,
      0xffd06e,
      0
    )
    .setStrokeStyle(
      2,
      0xffe0a8,
      0.55
    )
    .setDepth(8);

if (!this.motionReduced) {
  this.tweens.add({
    targets: beaconGlow,
    scale: {
      from: 0.75,
      to: 1.45
    },
    alpha: {
      from: 0.04,
      to: 0.18
    },
    duration: 900,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut'
  });

  this.tweens.add({
    targets: beaconRing,
    scale: {
      from: 0.75,
      to: 1.9
    },
    alpha: {
      from: 0.6,
      to: 0
    },
    duration: 1100,
    repeat: -1,
    ease: 'Quad.out'
  });
}

const beaconFollow =
  this.time.addEvent({
    delay: 16,
    loop: true,
    callback: () => {
      if (
        !this.goal?.active ||
        !beaconGlow?.active ||
        !beaconRing?.active
      ) {
        beaconFollow.remove();
        beaconGlow?.destroy();
        beaconRing?.destroy();
        return;
      }

      beaconGlow.x =
        this.goal.x + 28;

      beaconGlow.y =
        this.goal.y + 34;

      beaconRing.x =
        this.goal.x + 28;

      beaconRing.y =
        this.goal.y + 34;
    }
  });

this.goalBeaconFollow =
  beaconFollow;
  
if (!this.motionReduced) {
  this.tweens.add({
    targets: this.goal,
    scaleX: 1.06,
    scaleY: 1.06,
    duration: 680,
    yoyo: true,
    repeat: -1
  });
}

this.physics.add.overlap(
  this.player,
  this.goal,
  () => {
    if (this.goalTouched) {
      return;
    }

  if (this.boss?.active) {
  this.playerCue(
    `${
      this.boss.getData(
        'bossName'
      ) ||
      'ALPHA DINO'
    } BLOCKS THE RELAY · DEFEAT IT`,
    '#ffcf82'
  );

  if (this.player?.body) {
    this.player.body.setVelocityX(
      -260
    );
  }

  return;
}

    this.goalTouched = true;
    
    const arrivalLabel =
  this.add
    .text(
      this.goal.x + 28,
      this.goal.y - 18,
      'DELIVERY LOCK',
      {
        fontFamily: 'DM Mono',
        fontSize: '10px',
        color: '#ffd06e',
        stroke: '#08101c',
        strokeThickness: 3
      }
    )
    .setOrigin(.5)
    .setDepth(14);

this.tweens.add({
  targets: arrivalLabel,
  y: arrivalLabel.y - 18,
  alpha: 0,
  duration: 650,
  ease: 'Quad.out',
  onComplete: () =>
    arrivalLabel.destroy()
});
    const goalBurst =
      this.add
        .circle(
          this.goal.x + 28,
          this.goal.y + 34,
          18,
          0xffd06e,
          .38
        )
        .setDepth(13);

    this.tweens.add({
      targets: goalBurst,
      scale: 4.5,
      alpha: 0,
      duration: 420,
      onComplete: () =>
        goalBurst.destroy()
    });

    if (
  !this.motionReduced &&
  this.graphicsLevel >= 2
) {
  this.cameras.main.flash(
    180,
    255,
    208,
    110
  );
}

    this.shake(
      120,
      0.005
    );

    this.complete();
  },
  undefined,
  this
);

}

createAtmosphere() {
  const graphicsLevel =
    Number.isFinite(this.graphicsLevel)
      ? this.graphicsLevel
      : 2;

  const particleScale = {
    0: 0.45,
    1: 0.70,
    2: 1.00,
    3: 1.25
  }[graphicsLevel] ?? 1;

  const rainFrequency = {
    0: 0,
    1: 55,
    2: 35,
    3: 24
  }[graphicsLevel] ?? 35;

  const rainQuantity =
    graphicsLevel >= 1
      ? 1
      : 0;

  this.rain =
    this.add
      .particles(
        0,
        0,
        'rain',
        {
          x: {
            min: 0,
            max: 1350
          },
          y: -10,
          speedY: {
            min: 320,
            max: 470
          },
          speedX: -55,
          lifespan: 1700,
          frequency: rainFrequency,
          quantity: rainQuantity,
          scale: {
            start: .55 * particleScale,
            end: .55 * particleScale
          },
          alpha: {
            start: .5,
            end: 0
          },
          blendMode: 'ADD'
        }
      )
      .setScrollFactor(.4)
      .setVisible(
        this.rainEnabled &&
        graphicsLevel >= 1
      );

  this.dust =
    this.add
      .particles(
        0,
        0,
        'dust',
        {
          speedX: {
            min: -45,
            max: 45
          },
          speedY: {
            min: -15,
            max: -70
          },
          lifespan: 350,
          quantity: 0,
          scale: {
            start: .7 * particleScale,
            end: 0
          },
          alpha: {
            start: .4,
            end: 0
          }
        }
      );

this.speedLines =
  this.add
    .particles(
      0,
      0,
      'speed-line',
      {
        speedX: {
          min: -220,
          max: -130
        },
        speedY: {
          min: -12,
          max: 12
        },
        lifespan: 210,
        quantity: 0,
        scale: {
          start: .7 * particleScale,
          end: .15 * particleScale
        },
        alpha: {
          start: .42,
          end: 0
        },
        blendMode: 'ADD'
      }
    );

  const weather = {
  'first-delivery': [
    'NIGHT RAIN',
    0x6d8faa
  ],
  'dead-drop': [
    'HARBOR FOG',
    0xb7d4df
  ],
  blackout: [
    'GRID FLICKER',
    0x8df4ff
  ],
  pursuit: [
    'CROSSWIND',
    0x8ba2c4
  ],
  'signal-storm': [
    'SIGNAL STORM',
    0xb993ff
  ],
  'corporate-lockdown': [
    'ASH FRONT',
    0xff826e
  ],
  'final-relay': [
    'ORBITAL STATIC',
    0xffe0a8
  ]
}[this.mission.id];

this.weatherOverlay =
  this.add
    .rectangle(
      640,
      360,
      1280,
      720,
      weather[1],
      .045
    )
    .setScrollFactor(0)
    .setDepth(18)
    .setBlendMode(
      Phaser.BlendModes.ADD
    );

}

updateWeather(delta) {
  this.weatherTimer += delta;

  if (this.weatherTimer < 6200)
    return;

  this.weatherTimer = 0;

  this.weatherPhase =
    (this.weatherPhase + 1) % 2;

  const intense =
    this.weatherPhase === 1;

  const graphicsLevel =
    Number.isFinite(this.graphicsLevel)
      ? this.graphicsLevel
      : 2;

  const weatherEnabled =
    graphicsLevel >= 1;

  this.weatherOverlay?.setAlpha(
    weatherEnabled
      ? (
          intense
            ? .14
            : .045
        )
      : 0
  );


if (
  intense &&
  this.mission.id ===
    'signal-storm'
) {
  const graphicsLevel =
    Number.isFinite(this.graphicsLevel)
      ? this.graphicsLevel
      : 2;

  if (graphicsLevel >= 2) {
    this.cameras.main.flash(
      100,
      160,
      120,
      255
    );
  }

  this.game.events.emit(
    'feedback',
    'warning'
  );
}

if (
  intense &&
  this.mission.id ===
    'pursuit'
) {
  this.playerCue(
    'CROSSWIND · HOLD YOUR LINE',
    '#b9f5ff'
  );

  this.gadgetPulse(
  0x8ba2c4,
  9,
  300
);
}

}

createGuides() {
  const guides = Array.isArray(this.mission?.guides)
    ? this.mission.guides
    : [];

  guides.forEach(({ x, y, text }) => {
    const guide = this.add?.zone?.(
      Number(x) || 0,
      Number(y) || 0,
      1,
      1
    );

    if (!guide) {
      console.warn('[Relay Runner] Guide skipped: Phaser zone was not created.', {
        x,
        y,
        text
      });
      return;
    }

    guide.setAlpha?.(0);
    guide.setDepth?.(2);

    guide.setData?.('guideText', text || '');

    const level =
      Number.isFinite(this.graphicsLevel)
        ? this.graphicsLevel
        : 2;

    if (
      !this.motionReduced &&
      level >= 2 &&
      this.tweens?.add
    ) {
      this.tweens.add({
        targets: guide,
        alpha: {
          from: 0.9,
          to: 0.25
        },
        y: (Number(y) || 0) - 5,
        duration: 900,
        yoyo: true,
        repeat: -1
      });
    }
   });
}

createGuideCompanions() {
  const placements =
    this.mission.id ===
    'first-delivery'
      ? [
          [
            360,
            470,
            'alien-guide',
            'ALIEN SCOUT · FOLLOW THE GOLD SIGNALS'
          ],
          [
            1720,
            470,
            'guide-drone',
            'GUIDE DRONE · CHECKPOINTS SAVE YOUR RUN'
          ]
        ]
      : [
          [
            this.mission.spawn.x + 540,
            470,
            'guide-drone',
            'ROUTE GUIDE · ENERGY AND HEALTH RESTORED'
          ],
          [
            this.mission.goal.x - 620,
            430,
            'alien-guide',
            'ALIEN SCOUT · THE RELAY IS CLOSE'
          ]
        ];

  this.guideCompanions =
    this.physics.add.group();

  placements.forEach(
    ([x, y, texture, lesson]) => {
           const guide =
        this.guideCompanions?.create(
          x,
          y,
          texture
        );

      if (!guide) {
        console.warn(
          '[Relay Runner] Guide companion skipped: Phaser sprite was not created.',
          {
            x,
            y,
            texture,
            lesson
          }
        );
        return;
      }

      guide.setDepth?.(9);
      guide.setData?.(
        'lesson',
        lesson
      );

      guide.body
        ?.setAllowGravity?.(false)
        ?.setCircle?.(
          14,
          6,
          5
        );

      guide.setData(
        'baseY',
        y
      );

      guide.setData(
        'proximityCooldown',
        0
      );

      guide.setData(
        'blinkCooldown',
        Phaser.Math.Between(
          1600,
          3200
        )
      );

      /*
       * BASIC FLOATING
       */
     const graphicsLevel =
  Number.isFinite(this.graphicsLevel)
    ? this.graphicsLevel
    : 2;

if (
  !this.motionReduced &&
  graphicsLevel >= 2
) {
  this.tweens.add({
    targets: guide,
    y: y - 12,
    duration: 760,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut'
  });
}

      /*
 * FLOATING SHADOW
 */
const shadow =
  this.add
    .ellipse(
      guide.x,
      y + 25,
      34,
      9,
      texture === 'alien-guide'
        ? 0x120c1d
        : 0x06131f,
      0.38
    )
    .setDepth(4);

guide.setData(
  'shadow',
  shadow
);

if (
  !this.motionReduced &&
  graphicsLevel >= 2
) {
  this.tweens.add({
    targets: shadow,
    scaleX: {
      from: 0.72,
      to: 1.08
    },
    scaleY: {
      from: 0.72,
      to: 1
    },
    alpha: {
      from: 0.2,
      to: 0.42
    },
    duration: 760,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut'
  });
}

const shadowFollow =
  this.time.addEvent({
    delay: 16,
    loop: true,
    callback: () => {
      if (
        !guide.active ||
        !shadow.active
      ) {
        shadowFollow.remove();
        shadow.destroy();
        return;
      }

      shadow.x = guide.x;
      shadow.y = guide.y + 25;
    }
  });

guide.setData(
  'shadowTimer',
  shadowFollow
);

      /*
 * MISSION-SPECIFIC SIGNAL
 */
const missionSignal =
  this.add
    .circle(
      guide.x,
      guide.y,
      7,
      this.mission.id === 'signal-storm'
        ? 0xb993ff
        : this.mission.id === 'pursuit'
          ? 0xff826e
          : this.mission.id === 'final-relay'
            ? 0xffd06e
            : 0x8df4ff,
      0.16
    )
    .setDepth(7);

guide.setData(
  'missionSignal',
  missionSignal
);

if (!this.motionReduced) {
  this.tweens.add({
    targets: missionSignal,
    scale: {
      from: 0.7,
      to:
        this.mission.id === 'final-relay'
          ? 1.8
          : 1.45
    },
    alpha: {
      from: 0.08,
      to:
        this.mission.id === 'signal-storm'
          ? 0.34
          : 0.22
    },
    duration:
      this.mission.id === 'signal-storm'
        ? 560
        : this.mission.id === 'pursuit'
          ? 420
          : 760,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut'
  });
}

const missionSignalFollow =
  this.time.addEvent({
    delay: 16,
    loop: true,
    callback: () => {
      if (
        !guide.active ||
        !missionSignal.active
      ) {
        missionSignalFollow.remove();
        missionSignal.destroy();
        return;
      }

      missionSignal.x = guide.x;
      missionSignal.y = guide.y;
    }
  });

guide.setData(
  'missionSignalTimer',
  missionSignalFollow
);

      /*
       * FX CONTAINER
       * Keeps all companion effects together
       * and makes cleanup automatic.
       */
      const fx =
        this.add
          .container(
            guide.x,
            guide.y
          )
          .setDepth(8);

      guide.setData(
        'fxContainer',
        fx
      );

      /*
       * ==========================
       * ALIEN GUIDE FX
       * ==========================
       */
      if (
        !this.motionReduced &&
        texture === 'alien-guide'
      ) {
        const alienAura =
          this.add
            .circle(
              0,
              0,
              30,
              0xb993ff,
              0.07
            );

        const alienGlow =
          this.add
            .circle(
              0,
              0,
              23,
              0xe0a7ff,
              0.08
            );

        const alienRing =
          this.add
            .circle(
              0,
              0,
              18,
              0x8df4ff,
              0
            )
            .setStrokeStyle(
              1.5,
              0xb993ff,
              0.72
            );

        const alienCore =
          this.add
            .circle(
              0,
              5,
              4,
              0xe8fdff,
              0.9
            );

        const alienSignal =
          this.add
            .circle(
              0,
              5,
              9,
              0x8df4ff,
              0
            )
            .setStrokeStyle(
              1.5,
              0x8df4ff,
              0.55
            );

        const blinkBar =
          this.add
            .rectangle(
              0,
              -7,
              30,
              3,
              0x24152f,
              0
            );

        fx.add([
          alienAura,
          alienGlow,
          alienRing,
          alienSignal,
          alienCore,
          blinkBar
        ]);

        guide.setData(
          'alienFx',
          {
            alienAura,
            alienGlow,
            alienRing,
            alienSignal,
            alienCore,
            blinkBar
          }
        );

        this.tweens.add({
          targets: alienAura,
          scale: {
            from: 0.92,
            to: 1.12
          },
          alpha: {
            from: 0.05,
            to: 0.16
          },
          duration: 1050,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });

        this.tweens.add({
          targets: alienGlow,
          scale: {
            from: 0.92,
            to: 1.08
          },
          alpha: {
            from: 0.06,
            to: 0.18
          },
          duration: 820,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });

        this.tweens.add({
          targets: alienRing,
          scale: {
            from: 0.82,
            to: 1.45
          },
          alpha: {
            from: 0.68,
            to: 0
          },
          duration: 1100,
          repeat: -1,
          ease: 'Sine.out'
        });

        this.tweens.add({
          targets: alienSignal,
          scale: {
            from: 0.75,
            to: 1.35
          },
          alpha: {
            from: 0.65,
            to: 0
          },
          duration: 760,
          repeat: -1,
          ease: 'Sine.out'
        });

        this.tweens.add({
          targets: alienCore,
          scale: {
            from: 0.85,
            to: 1.3
          },
          alpha: {
            from: 0.55,
            to: 1
          },
          duration: 620,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });

        /*
         * Follow guide
         */
        const followTimer =
          this.time.addEvent({
            delay: 16,
            loop: true,
            callback: () => {
              if (
                !guide.active ||
                !fx.active
              ) {
                followTimer.remove();
                fx.destroy();
                return;
              }

              fx.setPosition(
                guide.x,
                guide.y
              );

              const distance =
                Phaser.Math.Distance.Between(
                  this.player.x,
                  this.player.y,
                  guide.x,
                  guide.y
                );

              /*
               * PROXIMITY REACTION
               */
              if (
                distance < 130 &&
                guide.getData(
                  'proximityCooldown'
                ) <= 0
              ) {
                guide.setData(
                  'proximityCooldown',
                  900
                );

                const nearbyColor =
  texture === 'alien-guide'
    ? '#e0a7ff'
    : '#8df4ff';

const nearbyLabel =
  this.add
    .text(
      guide.x,
      guide.y - 46,
      texture === 'alien-guide'
        ? '◈ ALLY DETECTED'
        : '◈ DRONE LINK',
      {
        fontFamily: 'DM Mono',
        fontSize: '9px',
        color: nearbyColor,
        stroke: '#08101c',
        strokeThickness: 4
      }
    )
    .setOrigin(.5)
    .setDepth(15)
    .setAlpha(0);

this.tweens.add({
  targets: nearbyLabel,
  alpha: {
    from: 0,
    to: 1
  },
  y: nearbyLabel.y - 7,
  duration: 140,
  ease: 'Quad.out'
});

this.time.delayedCall(
  520,
  () => {
    if (!nearbyLabel.active)
      return;

    this.tweens.add({
      targets: nearbyLabel,
      alpha: 0,
      y: nearbyLabel.y - 5,
      duration: 220,
      onComplete: () =>
        nearbyLabel.destroy()
    });
  }
);

                this.tweens.add({
                  targets: guide,
                  scaleX: 1.12,
                  scaleY: 1.12,
                  duration: 110,
                  yoyo: true,
                  ease: 'Sine.inOut'
                });

                this.tweens.add({
                  targets: alienSignal,
                  scale: {
                    from: 1,
                    to: 2.1
                  },
                  alpha: {
                    from: 0.85,
                    to: 0
                  },
                  duration: 380,
                  ease: 'Quad.out'
                });

                this.tweens.add({
                  targets: alienCore,
                  scale: {
                    from: 1,
                    to: 1.9
                  },
                  alpha: {
                    from: 1,
                    to: 0.2
                  },
                  duration: 260,
                  yoyo: true,
                  ease: 'Sine.inOut'
                });
              }

              const nextCooldown =
                Math.max(
                  0,
                  (guide.getData(
                    'proximityCooldown'
                  ) || 0) - 16
                );

              guide.setData(
                'proximityCooldown',
                nextCooldown
              );

              /*
               * EYE BLINK
               */
              const blinkCooldown =
                guide.getData(
                  'blinkCooldown'
                ) || 0;

              if (
                blinkCooldown <= 0
              ) {
                guide.setData(
                  'blinkCooldown',
                  Phaser.Math.Between(
                    2200,
                    4300
                  )
                );

                this.tweens.add({
                  targets: blinkBar,
                  alpha: {
                    from: 0,
                    to: 0.92
                  },
                  scaleY: {
                    from: 0.2,
                    to: 1
                  },
                  duration: 70,
                  yoyo: true,
                  hold: 45,
                  ease: 'Quad.inOut'
                });
              } else {
                guide.setData(
                  'blinkCooldown',
                  Math.max(
                    0,
                    blinkCooldown - 16
                  )
                );
              }
            }
          });

        guide.setData(
          'fxTimer',
          followTimer
        );
      }

      /*
       * ==========================
       * DRONE GUIDE FX
       * ==========================
       */
      if (
        !this.motionReduced &&
        texture === 'guide-drone'
      ) {
        const droneGlow =
          this.add
            .circle(
              0,
              0,
              23,
              0x8df4ff,
              0.08
            );

        const dronePulse =
          this.add
            .circle(
              0,
              0,
              11,
              0x8df4ff,
              0.14
            );

        const corePulse =
          this.add
            .circle(
              0,
              0,
              5,
              0xe8fdff,
              0.34
            );

        const scanRing =
          this.add
            .circle(
              0,
              0,
              17,
              0x8df4ff,
              0
            )
            .setStrokeStyle(
              1.5,
              0x8df4ff,
              0.7
            );

        const scanArc =
          this.add
            .arc(
              0,
              0,
              23,
              0,
              105,
              false,
              0x8df4ff,
              0.75
            );

        const scanBeam =
          this.add
            .rectangle(
              0,
              28,
              3,
              20,
              0x8df4ff,
              0.26
            )
            .setOrigin(
              0.5,
              0
            );

        const statusLight =
          this.add
            .circle(
              0,
              -15,
              2.2,
              0x55dfff,
              0.9
            );

        fx.add([
          droneGlow,
          dronePulse,
          corePulse,
          scanRing,
          scanArc,
          scanBeam,
          statusLight
        ]);

        guide.setData(
          'droneFx',
          {
            droneGlow,
            dronePulse,
            corePulse,
            scanRing,
            scanArc,
            scanBeam,
            statusLight
          }
        );

        this.tweens.add({
          targets: droneGlow,
          scale: {
            from: 0.88,
            to: 1.16
          },
          alpha: {
            from: 0.06,
            to: 0.2
          },
          duration: 900,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });

        this.tweens.add({
          targets: dronePulse,
          scale: {
            from: 0.8,
            to: 1.65
          },
          alpha: {
            from: 0.32,
            to: 0
          },
          duration: 780,
          repeat: -1,
          ease: 'Sine.out'
        });

        this.tweens.add({
          targets: corePulse,
          scale: {
            from: 0.8,
            to: 1.75
          },
          alpha: {
            from: 0.45,
            to: 0
          },
          duration: 700,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });

        this.tweens.add({
          targets: scanRing,
          scale: {
            from: 0.82,
            to: 1.5
          },
          alpha: {
            from: 0.7,
            to: 0
          },
          duration: 950,
          repeat: -1,
          ease: 'Sine.out'
        });

        this.tweens.add({
          targets: scanArc,
          angle: 360,
          duration: 2400,
          repeat: -1,
          ease: 'Linear'
        });

        this.tweens.add({
          targets: scanBeam,
          alpha: {
            from: 0.12,
            to: 0.42
          },
          scaleY: {
            from: 0.65,
            to: 1.2
          },
          duration: 720,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });

        this.tweens.add({
          targets: statusLight,
          alpha: {
            from: 0.25,
            to: 1
          },
          scale: {
            from: 0.7,
            to: 1.35
          },
          duration: 430,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });

        const followTimer =
          this.time.addEvent({
            delay: 16,
            loop: true,
            callback: () => {
              if (
                !guide.active ||
                !fx.active
              ) {
                followTimer.remove();
                fx.destroy();
                return;
              }

              fx.setPosition(
                guide.x,
                guide.y
              );
            }
          });

        guide.setData(
          'fxTimer',
          followTimer
        );
      }
    }
  );

  /*
   * PLAYER → COMPANION
   */
  this.physics.add.overlap(
    this.player,
    this.guideCompanions,
    (_, guide) => {
      if (!guide?.active)
        return;

      /*
       * COLLECT BURST
       */
      const burstColors =
        guide.texture.key ===
        'alien-guide'
          ? [
              0xb993ff,
              0xe0a7ff,
              0x8df4ff
            ]
          : [
              0x8df4ff,
              0x55dfff,
              0xe8fdff
            ];

      burstColors.forEach(
        (color, index) => {
          const burst =
            this.add
              .circle(
                guide.x,
                guide.y,
                7 + index * 3,
                color,
                0.32
              )
              .setDepth(12);

          this.tweens.add({
            targets: burst,
            scale:
              2.4 +
              index * 0.55,
            alpha: 0,
            duration:
              260 +
              index * 90,
            ease: 'Quad.out',
            onComplete: () =>
              burst.destroy()
          });
        }
      );

      const collectFlash =
        this.add
          .circle(
            guide.x,
            guide.y,
            12,
            guide.texture.key ===
            'alien-guide'
              ? 0xe0a7ff
              : 0x8df4ff,
            0.28
          )
          .setDepth(13);

      this.tweens.add({
        targets: collectFlash,
        scale: 3.8,
        alpha: 0,
        duration: 320,
        onComplete: () =>
          collectFlash.destroy()
      });

      this.collectGuideCompanion(
        guide
      );
    },
    undefined,
    this
  );
}
collectGuideCompanion(guide) {
if (!guide?.active) return;

guide.disableBody(
  true,
  true
);

this.energy =
  Math.min(
    this.energyMax,
    this.energy + 30
  );

this.health =
  Math.min(
    3,
    this.health + 1
  );

this.game.events.emit(
  'health',
  this.health
);

this.game.events.emit(
  'tutorial',
  guide.getData('lesson')
);

this.game.events.emit(
  'narration',
  guide.getData('lesson')
);

this.game.events.emit(
  'character-response',
  'Support received. Back in the run.'
);

this.showIntelCard(
  'ALLY INTEL',
  [
    guide.getData(
      'lesson'
    ),
    'Allies restore energy and one health. Tap this card or press ESC whenever you are ready.'
  ],
  '#aee37f'
);

this.playerCue(
  'ALLY SUPPORT · +30 ENERGY',
  '#aee37f'
);

this.gadgetPulse(
  0xaee37f,
  18,
  420
);

}

collectSignal(signal) {
if (!signal.active)
return;

if (
  this.boosterTimer > 0
) {
this.boostedSignals++;

this.playerCue(
  'BOOSTED SIGNAL',
  '#8df4ff'
);

this.gadgetPulse(
  0x8df4ff,
  10,
  300
);
}

if (this.graphicsLevel >= 1) {
  this.dust.emitParticleAt(
    signal.x,
    signal.y,
    14
  );

  this.speedLines.emitParticleAt(
    signal.x,
    signal.y,
    5
  );
}

signal.disableBody(
  true,
  true
);

this.collected++;

const signalPolarityGain =
  this.boosterTimer > 0
    ? 12
    : 6;

this.addPolarity(
  signalPolarityGain,
  this.boosterTimer > 0
    ? 'boosted-signal'
    : 'signal'
);

// ============================================================
// SIGNAL INTERFERENCE · LIVE UPDATE
// ============================================================
  
this.updateSignalInterference(0);

this.playerCue(
  'SIGNAL ACQUIRED',
  '#ffd06e'
);

this.gadgetPulse(
  0xffd06e,
  10,
  300
);

if (
  this.mission.signals.length - this.collected === 1
) {
  this.playerCue(
    'ONE SIGNAL LEFT',
    '#ffd06e'
  );
  this.gadgetPulse(
  0xffd06e,
  12,
  340
);
}

this.game.events.emit(
  'signal',
  this.collected,
  this.mission.signals.length
);

this.game.events.emit(
  'feedback',
  'signal'
);

const glow =
  this.add?.circle?.(
    signal.x,
    signal.y,
    12,
    0xffd06e,
    .75
  );

if (glow) {
  glow.setBlendMode(
    Phaser.BlendModes.ADD
  );

  glow.setDepth(11);

  this.tweens.add({
    targets: glow,
    scale: 4.8,
    alpha: 0,
    duration: 360,
    ease: 'Quad.out',
    onComplete: () => {
      if (glow?.active) {
        glow.destroy();
      }
    }
  });
}

// XP FLOATING TEXT DISABLED

this.tweens.add({
  targets: this.player,
  scaleX: 1.12,
  scaleY: 1.12,
  yoyo: true,
  duration: 90
});

}

collectSecret(secret) {
if (!secret.active)
return;

secret.disableBody(
  true,
  true
);

  // ============================================================
// SECRET DISCOVERY · RARE PICKUP FX
// ============================================================
const graphicsLevel =
  Number.isFinite(this.graphicsLevel)
    ? this.graphicsLevel
    : 2;

if (
  !this.motionReduced &&
  graphicsLevel >= 2
) {
  const secretBurst =
    this.add
      .circle(
        secret.x,
        secret.y,
        12,
        0xb993ff,
        .30
      )
      .setDepth(13);

  secretBurst.setStrokeStyle(
    2,
    0xe0a7ff,
    .95
  );

  this.tweens.add({
    targets: secretBurst,
    scale: 5.4,
    alpha: 0,
    duration: 520,
    ease: 'Quad.out',
    onComplete: () =>
      secretBurst.destroy()
  });

  const secretCore =
    this.add
      .circle(
        secret.x,
        secret.y,
        5,
        0xffffff,
        .85
      )
      .setDepth(14);

  this.tweens.add({
    targets: secretCore,
    scale: 2.8,
    alpha: 0,
    duration: 300,
    ease: 'Quad.out',
    onComplete: () =>
      secretCore.destroy()
  });

  this.cameras.main.flash(
    110,
    170,
    110,
    220
  );

  this.shake(
    70,
    0.0025
  );
}
  
this.secretsCollected++;

this.addPolarity(
  15,
  'secret'
);

this.playerCue(
  'SECRET ACQUIRED',
  '#b993ff'
);

this.gadgetPulse(
  0xb993ff,
  12,
  340
);
this.game.events.emit(
  'secret',
  this.secretsCollected,
  this.mission.secrets.length
);

this.game.events.emit(
  'feedback',
   'secret_collect'
);

}

activateCheckpoint(marker) {

  if (
    this.loadout.modifier?.id ===
    'noCheckpoints'
  ) {
    return;
  }

  const index =
    marker.getData('index');

  if (
    index <=
    (this.checkpoint.index ??
      -1)
  ) {
    return;
  }

const spawn =
  this.safeCheckpointSpawn(
    marker.x
  );

this.checkpoint = {
  index,
  ...spawn,
  signals:
    new Set(
      this.signals
        .getChildren()
        .filter(
          signal =>
            !signal.active
        )
        .map(
          signal =>
            signal.getData(
              'id'
            )
        )
    ),
  secrets:
    new Set(
      this.secrets
        .getChildren()
        .filter(
          secret =>
            !secret.active
        )
        .map(
          secret =>
            secret.getData(
              'id'
            )
        )
    )
};

marker.setTint(
  0xdffcff
);

this.tweens.killTweensOf(marker);

if (!this.motionReduced) {
  this.tweens.add({
    targets: marker,
    alpha: {
      from: 1,
      to: 0.72
    },
    duration: 180,
    yoyo: true,
    repeat: 2,
    ease: 'Sine.inOut',
    onComplete: () => {
      if (marker?.active) {
        marker.setAlpha(1);
      }
    }
  });
}

const checkpointPulse =
  this.add
    .circle(
      marker.x,
      marker.y,
      12,
      0x8df4ff,
      .35
    )
    .setDepth(11);
checkpointPulse.setStrokeStyle(
  2,
  0xe8fdff,
  0.9
);

this.tweens.add({
  targets: checkpointPulse,
  scale: 3.8,
  alpha: 0,
  duration: 360,
  ease: 'Quad.out',
  onComplete: () =>
    checkpointPulse.destroy()
});

/* -------------------------------------------------
   CHECKPOINT HOLOGRAPHIC ACTIVATION
   Purely visual — checkpoint state already handled.
   ------------------------------------------------- */

if (
  !this.motionReduced
) {
  const ringA =
    this.add.circle(
      marker.x,
      marker.y - 22,
      7,
      0x8df4ff,
      0.16
    )
    .setStrokeStyle(
      1,
      0xb9f5ff,
      0.75
    )
    .setDepth(10);

  const ringB =
    this.add.circle(
      marker.x,
      marker.y - 22,
      12,
      0x8df4ff,
      0
    )
    .setStrokeStyle(
      1,
      0x8df4ff,
      0.45
    )
    .setDepth(10);

  const scanLine =
    this.add.rectangle(
      marker.x,
      marker.y - 44,
      22,
      2,
      0xe8fdff,
      0.55
    )
    .setDepth(11);

  this.tweens.add({
    targets: ringA,
    scale: 2.8,
    alpha: 0,
    duration: 420,
    ease: 'Quad.out',
    onComplete: () =>
      ringA.destroy()
  });

  this.tweens.add({
    targets: ringB,
    scale: 2.2,
    alpha: 0,
    duration: 500,
    ease: 'Quad.out',
    onComplete: () =>
      ringB.destroy()
  });

  this.tweens.add({
    targets: scanLine,
    y:
      scanLine.y + 38,
    alpha: 0,
    duration: 340,
    ease: 'Sine.inOut',
    onComplete: () =>
      scanLine.destroy()
  });

  this.worldLightPulse(
    0xb9f5ff,
    0.12,
    220,
    42
  );
}
  
this.game.events.emit(
  'checkpoint',
  this.collected,
  this.secretsCollected,
  0,
  index
);

  this.game.events.emit(
  'feedback',
  'checkpoint_activate'
);

}

useEnergy(cost, ability) {
if (!this.mission.energyEnabled)
return true;

if (
  this.loadout.upgrades?.includes(
    'efficiency'
  )
) {
  cost *= .9;
}

if (
  ability === 'wallRun' &&
  this.loadout.upgrades?.includes(
    'wallEfficiency'
  )
) {
  cost *= .8;
}

if (
  this.energy <
  cost
) {
  this.game.events.emit(
    'feedback',
    'empty'
  );

  if (
    this.lowEnergyCueTimer <=
    0
  ) {
    this.lowEnergyCueTimer =
      700;

    this.playerCue(
      'LOW ENERGY',
      '#ff9c91'
    );

    this.gadgetPulse(
  0xff826e,
  11,
  320
);

  }

  return false;
}

this.energy -= cost;

if (
  !this.tutorials.has(
    ability
  )
) {
  this.tutorials.add(
    ability
  );

  const controls = {
    vault:
      'VAULT · RUN INTO BARRIER',
    slide:
      'SLIDE · HOLD S',
    wallRun:
      'WALL RUN · HOLD INTO WALL',
    airDash:
      'AIR DASH · SHIFT IN AIR',
    ledgeGrab:
      'LEDGE GRAB · PRESS SPACE AT WALL',
    climb:
      'CLIMB · W AT WALL'
  };

  this.game.events.emit(
    'tutorial',
    controls[ability]
  );
}

return true;

}

useGadget(slot) {
if (
  this.finished ||
  this.respawning ||
  this.cinematicActive ||
  this.relayPuzzleActive
) {
  return;
}

const id =
  this.loadout.equipment?.[slot];

if (
  !id ||
  this.gadgetCooldowns[slot] >
    0
) {
  return;
}

const bonuses =
  this.loadout.upgrades ||
  [];

if (id === 'scanner') {
  const interference =
  this.getSignalInterferenceLevel();

const interferenceTier =
  this.getSignalInterferenceTier(
    interference
  );
  const range =
    bonuses.includes(
      'signalSense'
    )
      ? 680
      : 500;

  const targets =
    this.signals
      .getChildren()
      .filter(
        signal =>
          signal.active &&
          Math.abs(
            signal.x -
            this.player.x
          ) < range
      );

  targets.forEach(
    signal =>
      signal.setTint(
        0x8df4ff
      )
  );

const sortedTargets =
  targets.sort(
    (left, right) =>
      Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        left.x,
        left.y
      ) -
      Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        right.x,
        right.y
      )
  );

const nextSignal =
  sortedTargets[0];

  if (nextSignal) {
    if (
  interferenceTier >= 3 &&
  !this.signalOverrideTriggered
) {
  this.spawnSignalGhostEcho();
}
    const marker =
      this.add
        .circle(
          nextSignal.x,
          nextSignal.y,
          19,
          0x8df4ff,
          .18
        )
        .setStrokeStyle(
          2,
          0xb9f5ff,
          .85
        )
        .setDepth(10);

    this.tweens.add({
      targets: marker,
      scale: 2.2,
      alpha: 0,
      duration: 850,
      onComplete: () =>
        marker.destroy()
    });
  }

  this.gadgetPulse(
    0x8df4ff,
    14,
    420
  );

  this.game.events.emit(
    'tutorial',
    nextSignal
      ? 'SCANNER · NEXT SIGNAL MARKED'
      : 'SCANNER · NO SIGNAL IN RANGE'
  );
}

if (id === 'emp') {
  this.empTimer = 3500;

  this.gadgetPulse(
    0x8df4ff,
    20,
    620
  );

  this.enemies
    ?.getChildren()
    .forEach(
      enemy =>
        enemy.setTint(
          0x8df4ff
        )
    );

  this.game.events.emit(
    'tutorial',
    'EMP · PATROLS DISABLED'
  );
}

if (id === 'decoy') {
  this.decoyTimer = 3200;
  this.alarmTimer = 0;

  this.decoyBeacon?.destroy();

  this.decoyBeacon =
    this.add
      .circle(
        this.player.x,
        this.player.y + 18,
        10,
        0xffd06e,
        .8
      )
      .setStrokeStyle(
        2,
        0xfff0b5
      )
      .setDepth(10);

  this.tweens.add({
    targets:
      this.decoyBeacon,
    scale: {
      from: .75,
      to: 1.55
    },
    alpha: {
      from: .9,
      to: .25
    },
    duration: 420,
    yoyo: true,
    repeat: -1
  });

  this.game.events.emit(
    'tutorial',
    'DECOY · ATTENTION DIVERTED'
  );
}

if (id === 'booster') {
  this.boosterTimer = 8000;

  this.boosterAura?.destroy();

  this.boosterAura =
    this.add
      .circle(
        this.player.x,
        this.player.y,
        24,
        0xffd06e,
        .14
      )
      .setStrokeStyle(
        2,
        0xffd06e,
        .65
      )
      .setDepth(9);

  this.tweens.add({
    targets:
      this.boosterAura,
    scale: {
      from: .9,
      to: 1.35
    },
    alpha: {
      from: .5,
      to: .12
    },
    duration: 520,
    yoyo: true,
    repeat: -1
  });

  this.game.events.emit(
    'tutorial',
    'SIGNAL BOOSTER · ACTIVE'
  );
}

if (id === 'cell') {
  this.energy =
    Math.min(
      this.energyMax,
      this.energy + 35
    );

  this.gadgetPulse(
    0xaee37f,
    13,
    300
  );

  this.game.events.emit(
    'tutorial',
    'ENERGY CELL · +35 ENERGY'
  );
}

this.gadgetCooldowns[slot] =
  id === 'scanner'
    ? 5500
    : id === 'emp'
      ? 9000
      : id === 'decoy'
        ? 8000
        : id === 'booster'
          ? 12000
          : 10000;

this.playerCue(
  `${id.toUpperCase()} · READY`,
  '#ffd06e'
);

const pulse =
  this.add
    .circle(
      this.player.x,
      this.player.y,
      12,
      0xffd06e,
      .35
    )
    .setDepth(11);

this.tweens.add({
  targets: pulse,
  scale: 2.8,
  alpha: 0,
  duration: 280,
  onComplete: () =>
    pulse.destroy()
});

this.game.events.emit(
  'feedback',
  'gadget'
);

}

tryVault() {
  const body =
    this.player?.body;

  if (
    !body ||
    !this.player?.active
  ) {
    return false;
  }

  const grounded =
    body.blocked.down ||
    body.touching.down;

if (
!this.abilities.has('vault') ||
this.vaultCooldown > 0 ||
!grounded ||
Math.abs(body.velocity.x) < 130 ||
!this.useEnergy(12, 'vault')
) {
return false;
}

this.vaultCooldown = 450;

body.setVelocityY(-510);

 if (
  !this.motionReduced &&
  this.player?.active
) {
  this.tweens.add({
    targets: this.player,
    scaleX:
      this.playerVisualBaseScaleX * 1.08,
    scaleY:
      this.playerVisualBaseScaleY * 0.90,
    duration: 70,
    yoyo: true,
    ease: 'Quad.out'
  });
}

const vaultBurst =
  this.add
    .circle(
      this.player.x,
      this.player.y + 22,
      11,
      0xb9f5ff,
      .34
    )
    .setDepth(12);

this.tweens.add({
  targets: vaultBurst,
  scaleX: 4.5,
  scaleY: 0.65,
  alpha: 0,
  duration: 210,
  ease: 'Quad.out',
  onComplete: () =>
    vaultBurst.destroy()
});

this.player.setTint(0xb9f5ff);

this.time.delayedCall(
180,
() => this.player?.active && this.player.clearTint()
);

this.game.events.emit(
'feedback',
'vault'
);

return true;
}

updateEnemies(delta) {
const signalHeat =
  Phaser.Math.Clamp(
    this.signalInterference || 0,
    0,
    1
  );

const signalTier =
  this.getSignalInterferenceTier(
    signalHeat
  );

const heatRangeBonus =
  signalTier >= 3
    ? 70
    : signalTier >= 2
      ? 45
      : signalTier >= 1
        ? 20
        : 0;

const baseDetectionRange =
  this.mission.blackout &&
  this.loadout.upgrades?.includes('ghost')
    ? 190
    : this.mission.blackout
      ? 260
      : 320;

const detectionRange =
  baseDetectionRange +
  heatRangeBonus;

if (!this.enemies)
return;

if (
  this.empTimer > 0 ||
  this.decoyTimer > 0
) {
  this.enemies
    .getChildren()
    .forEach(
      enemy =>
        enemy
          .getData('indicator')
          ?.setAlpha(.1)
    );

  return;
}

this.enemies
  .getChildren()
  .forEach(
    enemy => {
      if (!enemy.active)
        return;

    const route =
  enemy.getData(
    'route'
  );

if (!route) {
  return;
}

const type =
  route.type;

      let direction =
        enemy.getData(
          'direction'
        );

      const horizontalDistance =
        Math.abs(
          enemy.x -
          this.player.x
        );

      const verticalDistance =
        Math.abs(
          enemy.y -
          this.player.y
        );

   const aiState =

enemy.getData('aiState') ||
'IDLE';

/* -------------------------------------------------
   ENEMY THREAT SIGNATURE
   Purely visual — reads existing AI/distance state.
   No AI / physics / damage mutation.
   ------------------------------------------------- */

const threatIndicator =
  enemy.getData(
    'indicator'
  );

if (
  threatIndicator?.active &&
  !this.motionReduced
) {
  const threatRatio =
    Phaser.Math.Clamp(
      1 -
        horizontalDistance /
          detectionRange,
      0,
      1
    );

  let threatAlpha =
    Phaser.Math.Linear(
      0.10,
      0.34,
      threatRatio
    );

  let threatScale =
    Phaser.Math.Linear(
      0.82,
      1.12,
      threatRatio
    );

  if (
    aiState === 'HUNT'
  ) {
    const pulse =
      0.5 +
      Math.sin(
        this.time.now / 95
      ) * 0.5;

    threatAlpha =
      Phaser.Math.Linear(
        0.24,
        0.58,
        pulse
      );

    threatScale =
      Phaser.Math.Linear(
        1.00,
        1.35,
        pulse
      );
  } else if (
    aiState === 'SEARCH'
  ) {
    const pulse =
      0.5 +
      Math.sin(
        this.time.now / 170
      ) * 0.5;

    threatAlpha =
      Phaser.Math.Linear(
        0.14,
        0.32,
        pulse
      );

    threatScale =
      Phaser.Math.Linear(
        0.92,
        1.12,
        pulse
      );
  }

  threatIndicator
    .setAlpha(
      threatAlpha
    )
    .setScale(
      threatScale
    );

  threatIndicator.setStrokeStyle(
    aiState === 'HUNT'
      ? 1.6
      : 1,
    aiState === 'HUNT'
      ? 0xff5364
      : 0xffd5c5,
    aiState === 'HUNT'
      ? 0.92
      : 0.60
  );
}

const baseSpeed =
aiState === 'HUNT'
  ? type === 'dino'
    ? 96
    : type === 'enemy-runner'
      ? 145
      : type === 'security'
        ? 78
        : type === 'invader'
          ? 42
          : 58
  : type === 'dino'
    ? 74
    : type === 'enemy-runner' &&
      horizontalDistance < 300
      ? 118
      : type === 'invader'
        ? 28
        : type === 'security'
          ? 55
          : 38;

const signalHeatMultiplier =
  aiState === 'HUNT'
    ? signalTier >= 4
      ? 1.18
      : signalTier >= 3
        ? 1.12
        : signalTier >= 2
          ? 1.07
          : signalTier >= 1
            ? 1.03
            : 1
    : signalTier >= 3
      ? 1.05
      : 1;

const speed =
  baseSpeed *
  signalHeatMultiplier;

if (
aiState === 'HUNT'
) {
enemy.setData(
'lastKnownX',
this.player.x
);
enemy.setData(
'lastKnownY',
this.player.y
);
if (
horizontalDistance > 420 ||
verticalDistance > 180
) {
enemy.setData(
'aiState',
'SEARCH'
);

enemy.setData(
  'aiTimer',
  1800
);

} else {
direction =
this.player.x <
enemy.x
? -1
: 1;

enemy.setData(
  'direction',
  direction
);

enemy.setFlipX(
  direction < 0
);

}
}

      if (

aiState === 'RETURN'
) {
let aiTimer =
Number(
enemy.getData('aiTimer')
) || 0;

aiTimer = Math.max(
0,
aiTimer - delta
);

enemy.setData(
'aiTimer',
aiTimer
);

const returnTarget =
enemy.getData('patrolOriginX') ??
(
route.min +
route.max
) / 2;

direction =
enemy.x < returnTarget
? 1
: -1;

enemy.setData(
'direction',
direction
);

enemy.setFlipX(
direction < 0
);

if (
aiTimer <= 0 ||
Math.abs(
enemy.x - returnTarget
) < 24
) {
enemy.setData(
'aiState',
'IDLE'
);

enemy.setData(
  'aiTimer',
  0
);

}
}
if (
aiState === 'SEARCH'
) {
let aiTimer =
Number(
enemy.getData('aiTimer')
) || 0;

aiTimer = Math.max(
0,
aiTimer - delta
);

enemy.setData(
'aiTimer',
aiTimer
);

  if (

horizontalDistance < detectionRange &&
verticalDistance < 150
) {
enemy.setData(
'aiState',
'HUNT'
);

enemy.setData(
'aiTimer',
0
);

direction =
this.player.x < enemy.x
? -1
: 1;

enemy.setData(
'direction',
direction
);

enemy.setFlipX(
direction < 0
);
}

const lastKnownX =
Number(
enemy.getData('lastKnownX')
);

direction =
enemy.x < lastKnownX
? 1
: -1;
  if (
  Math.abs(
    enemy.x - lastKnownX
  ) < 28
) {
  enemy.setData(
    'aiState',
    'RETURN'
  );

  enemy.setData(
    'aiTimer',
    1200
  );
}
enemy.setData(
'direction',
direction
);

enemy.setFlipX(
direction < 0
);

if (
aiTimer <= 0
) {
enemy.setData(
'aiState',
'RETURN'
);

enemy.setData(
  'aiTimer',
  1200
);

}
}

else if (
type === 'enemy-runner' &&
horizontalDistance <
300
) {
direction =
this.player.x <
enemy.x
? -1
: 1;
}

      enemy.x +=
        direction *
        speed *
        delta /
        1000;

      if (
        enemy.x >=
          route.max ||
        enemy.x <=
          route.min
      ) {
        direction *= -1;

        enemy.setData(
          'direction',
          direction
        );

        enemy.setFlipX(
          direction < 0
        );
      }

      enemy.body.updateFromGameObject();

      const patrol =
        type ===
          'security' ||
        type ===
          'guard';

      const detectionRange =
        this.mission.blackout &&
        this.player.y <
          470
          ? 105
          : type ===
              'security'
            ? 180
            : 145;

      const indicator =
        enemy.getData(
          'indicator'
        );

      const alerted =
        horizontalDistance <
          detectionRange &&
        verticalDistance <
          100;
      const currentAIState =
        enemy.getData('aiState') ||
        'IDLE';

      if (
  currentAIState === 'IDLE' &&
  horizontalDistance <
    detectionRange *
      (
        signalTier >= 4
          ? 2.15
          : signalTier >= 3
            ? 2.0
            : signalTier >= 2
              ? 1.9
              : 1.8
      ) &&
  verticalDistance <
    (
      signalTier >= 3
        ? 170
        : 150
    )
) {
  enemy.setData(
    'lastKnownX',
    this.player.x
  );

  enemy.setData(
    'lastKnownY',
    this.player.y
  );

  enemy.setData(
    'aiState',
    signalTier >= 3
      ? 'ALERT'
      : 'SUSPICIOUS'
  );

  enemy.setData(
    'aiTimer',
    signalTier >= 4
      ? 450
      : signalTier >= 3
        ? 650
        : 900
  );
}
      if (

currentAIState === 'SUSPICIOUS'
) {
let aiTimer =
Number(
enemy.getData('aiTimer')
) || 0;

aiTimer = Math.max(
0,
aiTimer - delta
);

enemy.setData(
'aiTimer',
aiTimer
);

if (
aiTimer <= 0
) {
enemy.setData(
'aiState',
'IDLE'
);

enemy.setData(
  'aiTimer',
  0
);

}
}

if (
currentAIState === 'ALERT'
) {
let aiTimer =
Number(
enemy.getData('aiTimer')
) || 0;

aiTimer = Math.max(
0,
aiTimer - delta
);

enemy.setData(
'aiTimer',
aiTimer
);

if (
aiTimer <= 0
) {
enemy.setData(
'aiState',
'HUNT'
);

enemy.setData(
  'aiTimer',
  0
);

}
}

      indicator
        ?.setPosition(
          
          enemy.x,
          enemy.y - 30
        )
        .setAlpha(
          horizontalDistance <
            Math.max(
              260,
              detectionRange *
                1.6
            ) &&
            verticalDistance <
              150
            ? .92
            : .28
        )
        .setFillStyle(
          alerted
            ? 0xffd06e
            : 0xff826e
        );

      if (
        alerted &&
        !enemy.getData(
          'alerted'
        )
      ) {
        enemy.setData(
          'alerted',
          true
        );

enemy.setData(
'aiState',
'ALERT'
);

enemy.setData(
'aiTimer',
500
);
this.playerCue(
  `${
    type === 'security'
      ? 'SECURITY'
      : 'HOSTILE'
  } HAS EYES ON YOU`,
  '#ffcf82'
);
}

      if (!alerted) {
        enemy.setData(
          'alerted',
          false
        );
      }

      if (
        patrol &&
        alerted
      ) {
        if (
          this.alarmTimer <=
          0
        ) {
          this.alarms++;

          this.game.events.emit(
            'feedback',
            'chase'
          );
        }

        this.alarmTimer =
          this.alarmDuration(
            3400
          );
      }
    }
  );

if (this.alarmTimer > 0) {
this.alarmTimer =
Math.max(
0,
this.alarmTimer -
delta
);
}

const detectionValue =
this.alarmTimer > 0
? Math.ceil(
this.alarmTimer / 100
)
: 0;

if (
detectionValue !==
this.detectionEmit
) {
this.detectionEmit =
detectionValue;

this.game.events.emit(
'detection',
detectionValue
);
}

  if (
  this.detectionProgressBar &&
  this.detectionProgressText &&
  this.detectionStatusText
) {
  const alarmDuration =
    Math.max(
      1,
      this.alarmDuration(3400)
    );

  const detectionPercent =
    Phaser.Math.Clamp(
      Math.round(
        (
          this.alarmTimer /
          alarmDuration
        ) * 100
      ),
      0,
      100
    );

  this.detectionProgressBar.scaleX =
    detectionPercent / 100;

  this.detectionProgressText.setText(
    `${detectionPercent}%`
  );

  this.detectionStatusText.setText(
    detectionPercent > 0
      ? detectionPercent >= 75
        ? 'ALERT'
        : 'DETECTED'
      : 'CLEAR'
  );
}

}

updateSciFiThreats(delta) {
const now =
  this.elapsedMs;

if (
  this.empTimer > 0
) {
  return;
}

  // ============================================================
// BOSS DEATH FREEZE
// ============================================================
  
if (this.bossVictoryLock === true) {
  if (this.boss?.active) {
    this.boss.setData(
      'nextShot',
      Number.MAX_SAFE_INTEGER
    );

    this.boss.setData(
      'attackCooldown',
      Number.MAX_SAFE_INTEGER
    );

    if (this.boss.body) {
      this.boss.body.setVelocity(0, 0);
    }
  }

  return;
}

  // ============================================================
// BOSS HEALTH BAR · COMBAT HUD
// ============================================================
if (
  this.boss?.active &&
  !this.bossHealthUI
) {
  const width =
    Math.min(
      this.scale.width - 40,
      430
    );

  const x =
    this.scale.width / 2;

  const y = 38;

  const maxHealth =
    Math.max(
      1,
      Number(
        this.boss.getData('health')
      ) || 1
    );

  this.boss.setData(
    'maxHealth',
    maxHealth
  );

  const container =
    this.add
      .container(
        0,
        0
      )
      .setScrollFactor(0)
      .setDepth(120);

  const plate =
    this.add
      .rectangle(
        x,
        y,
        width,
        58,
        0x050914,
        .94
      )
      .setStrokeStyle(
        1,
        0xff826e,
        .72
      );

  const title =
    this.add
      .text(
        x,
        y - 17,
        `BOSS // ${
          this.boss.getData(
            'bossName'
          ) || 'THREAT'
        }`,
        {
          fontFamily: 'DM Mono',
          fontSize:
            this.scale.width < 600
              ? '9px'
              : '10px',
          color: '#ffcf82',
          stroke: '#08101c',
          strokeThickness: 4,
          align: 'center'
        }
      )
      .setOrigin(.5);

  const barBack =
    this.add
      .rectangle(
        x,
        y + 5,
        width - 28,
        10,
        0x182338,
        1
      )
      .setStrokeStyle(
        1,
        0x33445f,
        .85
      );

  const barFill =
    this.add
      .rectangle(
        x -
          (width - 28) / 2 +
          2,
        y + 5,
        width - 32,
        6,
        0xff826e,
        1
      )
      .setOrigin(0, .5);

  const hpText =
    this.add
      .text(
        x,
        y + 23,
        `HP ${maxHealth} / ${maxHealth}`,
        {
          fontFamily: 'DM Mono',
          fontSize:
            this.scale.width < 600
              ? '8px'
              : '9px',
          color: '#8ba0b8',
          align: 'center'
        }
      )
      .setOrigin(.5);

  container.add([
    plate,
    title,
    barBack,
    barFill,
    hpText
  ]);

  this.bossHealthUI = {
    container,
    plate,
    title,
    barBack,
    barFill,
    hpText,
    width,
    maxHealth
  };

  // ============================================================
// BOSS HP · PHASE MARKERS
// ============================================================
const marker50 =
  this.add
    .rectangle(
      x -
        (width - 28) / 2 +
        (width - 28) * .5,
      y + 5,
      2,
      14,
      0xffcf82,
      .85
    )
    .setScrollFactor(0)
    .setDepth(122);

const marker25 =
  this.add
    .rectangle(
      x -
        (width - 28) / 2 +
        (width - 28) * .25,
      y + 5,
      2,
      14,
      0xff826e,
      .85
    )
    .setScrollFactor(0)
    .setDepth(122);

this.bossHealthUI.marker50 =
  marker50;

this.bossHealthUI.marker25 =
  marker25;
}

if (
  this.boss?.active &&
  Math.abs(
    this.boss.x -
    this.player.x
  ) < 500 &&
  now >=
    this.boss.getData(
      'nextShot'
    )
) {
  /* -------------------------------------------------
     BOSS ATTACK TELEGRAPH
     Visual warning before the projectile launches.
     ------------------------------------------------- */

  if (
    !this.motionReduced &&
    this.player?.active
  ) {
    const bossColor =
      this.boss.getData(
        'bossColor'
      ) ||
      0xff826e;

    const telegraph =
      this.add
        .rectangle(
          this.boss.x,
          this.boss.y - 18,
          10,
          4,
          bossColor,
          0.18
        )
        .setDepth(12);

    telegraph.setStrokeStyle(
      2,
      0xfff1df,
      0.85
    );

    const lockLine =
      this.add
        .rectangle(
          this.boss.x,
          this.player.y,
          Math.min(
            500,
            Math.abs(
              this.player.x -
              this.boss.x
            )
          ),
          2,
          bossColor,
          0.32
        )
        .setDepth(11);

    if (
      this.player.x <
      this.boss.x
    ) {
      lockLine.x =
        this.boss.x -
        lockLine.width / 2;
    } else {
      lockLine.x =
        this.boss.x +
        lockLine.width / 2;
    }

    this.tweens.add({
      targets: telegraph,
      scaleX: 2.8,
      scaleY: 1.8,
      alpha: 0,
      duration: 180,
      ease: 'Quad.out',
      onComplete: () =>
        telegraph.destroy()
    });

    this.tweens.add({
      targets: lockLine,
      alpha: 0,
      scaleX: 0.96,
      duration: 180,
      ease: 'Quad.out',
      onComplete: () =>
        lockLine.destroy()
    });
  }

  const bolt =
    this.comets
      .create(
        this.boss.x,
        this.boss.y - 20,
        'comet'
      )
      .setDepth(11)
      .setTint(
        this.boss.getData(
          'bossColor'
        ) ||
          0xff826e
      );

  bolt.setData(
  'bossProjectile',
  true
);

  bolt.body
    .setAllowGravity(false)
    .setVelocity(
  (
    this.player.x -
    this.boss.x
  ) * (
    this.boss.getData('phase') === 2
      ? 1.05
      : .8
  ),
  this.boss
      .getData(
        'route'
      )
      ?.type ===
    'storm-boss'
    ? (
        this.boss.getData('phase') === 2
          ? 340
          : 250
      )
    : (
        this.boss.getData('phase') === 2
          ? 145
          : 100
      )
);

  this.boss.setData(
    'nextShot',
    now +
      this.boss.getData(
        'attackCooldown'
      )
  );

  // ============================================================
// BOSS PHASE 2 · DOUBLE ATTACK
// ============================================================
if (
  this.boss.getData('phase') === 2 &&
  !this.bossSecondShotPending
) {
  const secondShotDelay = 180;

  this.bossSecondShotPending =
    true;

  this.time.delayedCall(
    secondShotDelay,
  () => {
  this.bossSecondShotPending =
    false;

if (
  !this.boss?.active ||
  this.finished ||
  this.respawning ||
  this.respawnGrace > 0 ||
  this.bossVictoryLock === true
) {
  return;
}
      if (
        Math.abs(
          this.boss.x -
          this.player.x
        ) > 620
      ) {
        return;
      }

    if (
  !this.motionReduced &&
  this.boss?.active &&
  this.player?.active
) {
  const bossColor =
    this.boss.getData(
      'bossColor'
    ) ||
    0xff826e;

  const secondTelegraph =
    this.add
      .rectangle(
        this.boss.x,
        this.boss.y + 8,
        9,
        4,
        bossColor,
        0.18
      )
      .setDepth(12);

  secondTelegraph.setStrokeStyle(
    2,
    0xfff1df,
    0.8
  );

  this.tweens.add({
    targets: secondTelegraph,
    scaleX: 2.6,
    scaleY: 1.7,
    alpha: 0,
    duration: 120,
    ease: 'Quad.out',
    onComplete: () =>
      secondTelegraph.destroy()
  });
}

const secondBolt =
  this.comets
    .create(
      this.boss.x,
      this.boss.y + 6,
      'comet'
    )
          .setDepth(11)
          .setTint(
            this.boss.getData(
              'bossColor'
            ) ||
              0xff826e
          );

      secondBolt.setData(
  'bossProjectile',
  true
);

      secondBolt.body
        .setAllowGravity(false)
        .setVelocity(
          (
            this.player.x -
            this.boss.x
          ) * 1.05,
          this.boss
            .getData('route')
            ?.type ===
          'storm-boss'
            ? 340
            : 145
        );

      this.playerCue(
        'SECONDARY VOLLEY',
        '#ff826e'
      );

      this.gadgetPulse(
        0xff826e,
        13,
        280
      );
    }
  );
}

  this.playerCue(
    `${
      this.boss.getData(
        'bossName'
      )
    } ATTACK`,
    '#ff826e'
  );

  this.game.events.emit(
    'feedback',
    'warning'
  );
}

this.enemies
  .getChildren()
  .forEach(
    enemy => {
      if (!enemy.active)
        return;

     const type =
  enemy.getData(
    'route'
  )?.type;

if (
  type === 'chicken'
) {
  this.updateChickenFireBreath(
    enemy,
    now
  );
}

if (
  type === 'chicken' ||
        type === 'invader' ||
        type === 'enemy-runner'
      ) {
       const firingRange =
  type === 'chicken'
    ? 360
    : type ===
        'invader'
      ? 320
      : 280;

      if (
  Math.abs(
    this.player.x -
    enemy.x
  ) <
    firingRange &&
  Math.abs(
    this.player.y -
    enemy.y
  ) < 190 &&
  now >=
    enemy.getData(
      'nextShot'
    )
) {

  // CHICKEN SPECIAL ATTACK
  // FIRE BREATH TAKES PRIORITY OVER EGG.
  if (
    type === 'chicken' &&
    this.startChickenFireBreath(
      enemy,
      now
    )
  ) {
    return;
  }

  const projectile =
  type ===
  'chicken'
    ? 'egg'
    : 'comet';

/* -------------------------------------------------
   ENEMY ATTACK TELEGRAPH
   Purely visual — projectile logic remains unchanged.
   ------------------------------------------------- */

if (
  !this.motionReduced &&
  enemy?.active
) {
  const charge =
    this.add.circle(
      enemy.x,
      enemy.y - 4,
      type === 'chicken'
        ? 7
        : 9,
      type === 'chicken'
        ? 0xffd06e
        : 0xff5364,
      0.20
    )
    .setDepth(10);

  charge.setStrokeStyle(
    2,
    type === 'chicken'
      ? 0xfff0c7
      : 0xff826e,
    0.82
  );

  this.tweens.add({
    targets: charge,
    scale: 1.9,
    alpha: 0,
    duration: 120,
    ease: 'Quad.out',
    onComplete: () =>
      charge.destroy()
  });

  const chargeLine =
    this.add.rectangle(
      enemy.x,
      enemy.y - 4,
      type === 'chicken'
        ? 18
        : 24,
      2,
      type === 'chicken'
        ? 0xffd06e
        : 0xff5364,
      0.38
    )
    .setDepth(10);

  this.tweens.add({
    targets: chargeLine,
    scaleX: 1.8,
    alpha: 0,
    duration: 110,
    ease: 'Quad.out',
    onComplete: () =>
      chargeLine.destroy()
  });
}

const body =
  this.player?.body;

if (
  !body ||
  !this.player?.active
) {
  return;
}

const predictedX =
  this.player.x +
  body.velocity.x *
    .22;

const egg =
  this.eggs
    .create(
      enemy.x,
      enemy.y + 12,
      projectile
    )
    .setDepth(11);

egg.setData(
  'createdAt',
  now
);

egg.body
  .setAllowGravity(false)
  .setVelocity(
    (
      predictedX -
      enemy.x
    ) * .72,
    type === 'chicken'
      ? 210
      : 90
  );

enemy.setData(
  'nextShot',
  now +
    (
      type ===
      'enemy-runner'
        ? 1500
        : type ===
            'invader'
          ? 1900
          : 2400
    )
);

this.playerCue(
  type === 'chicken'
    ? 'EGG INCOMING'
    : 'ENEMY FIRE',
  '#ff826e'
);

this.game.events.emit(
  'feedback',
  'warning'
);
        }
      }

      if (
        type ===
        'invader'
      ) {
        enemy.y +=
          Math.sin(
            (now +
              enemy.x) /
              260
          ) *
          .22;

        enemy.body.updateFromGameObject();
      }

      if (
        type === 'dino' &&
        Math.abs(
          enemy.x -
          this.player.x
        ) < 240 &&
        Math.abs(
          enemy.y -
          this.player.y
        ) < 95 &&
        now >=
          enemy.getData(
            'nextShot'
          )
      ) {
        enemy.setData(
          'nextShot',
          now + 1700
        );

       enemy.setTint(
  0xff826e
);

const playerBody =
  this.player?.body;

if (!playerBody) {
  enemy.clearTint();
  return;
}

this.tweens.add({
  targets: enemy,
  x:
    this.player.x +
    playerBody.velocity.x *
      .12,
  duration: 340,
          onComplete: () =>
            enemy.clearTint()
        });

        if (
          Math.abs(
            enemy.x -
            this.player.x
          ) < 66
        ) {
         this.takeSciFiHit(
  'A dinosaur charge knocked the courier down.',
  enemy.x,
  enemy.y
);
        }
      }
    }
  );

const signature =
  signatureThreats[
    this.mission.id
  ];

const nearbyThreat =
  this.enemies
    .getChildren()
    .find(
      enemy =>
        enemy.active &&
        Math.abs(
          enemy.x -
          this.player.x
        ) < 250 &&
        enemy.getData(
          'route'
        )?.type ===
          signature
    ) ||
  this.enemies
    .getChildren()
    .find(
      enemy =>
        enemy.active &&
        Math.abs(
          enemy.x -
          this.player.x
        ) < 180 &&
        enemyIntel[
          enemy.getData(
            'route'
          )?.type
        ]
    );

if (nearbyThreat) {
  this.showEnemyIntel(
    nearbyThreat.getData(
      'route'
    )?.type
  );
}

this.enemies
  .getChildren()
  .forEach(
    enemy => {
      if (
        !enemy.active ||
        enemy.getData(
          'route'
        )?.type !==
          'alien-ground' ||
        now <
          enemy.getData(
            'nextShot'
          ) ||
        Math.abs(
          enemy.x -
          this.player.x
        ) > 360
      ) {
        return;
      }

 const bolt =
  this.eggs.create(
    enemy.x,
    enemy.y,
    'comet'
  ).setDepth(11);

bolt.setData(
  'projectileType',
  'alien-bolt'
);

bolt.setData(
  'createdAt',
  now
);

bolt.body
  .setAllowGravity(false)
        .setVelocity(
          (
            this.player.x -
            enemy.x
          ) * .78,
          (
            this.player.y -
            enemy.y
          ) * .35 -
            45
        );

      enemy.setData(
        'nextShot',
        now + 1650
      );

      this.playerCue(
        'GROUND ALIEN FIRE',
        '#ff826e'
      );
    }
  );

this.enemies
  .getChildren()
  .forEach(
    enemy => {
      if (!enemy.active)
        return;

      const type =
        enemy.getData(
          'route'
        )?.type;

      const direction =
        enemy.getData(
          'direction'
        ) || 1;

      if (
        type ===
          'enemy-runner' ||
        type ===
          'alien-ground'
      ) {
        enemy.setAngle(
          direction * 7
        );
      } else if (
        type === 'dino' ||
        type ===
          'dino-boss'
      ) {
        enemy.setAngle(
          direction * 4
        );
      } else if (
        type === 'invader'
      ) {
        enemy.setAngle(
          Math.sin(
            (now +
              enemy.x) /
              240
          ) * 9
        );
      }
    }
  );

const tier =
  Number(
    this.mission.difficulty?.split('/')[0]
  ) || 1;

/* -------------------------------------------------
   COMET TRAIL FOLLOW
   Purely visual.
   ------------------------------------------------- */
if (
  !this.motionReduced &&
  this.comets?.active
) {
  this.comets
    .getChildren()
    .forEach(comet => {
      if (!comet?.active) {
        comet
          ?.getData('trail')
          ?.destroy();

        return;
      }

      const trail =
        comet.getData(
          'trail'
        );

      if (trail?.active) {
        trail.clear();

        trail.lineStyle(
          2,
          0x8df4ff,
          0.34
        );

        trail.lineBetween(
          comet.x,
          comet.y - 6,
          comet.x,
          comet.y - 54
        );
      }
    });
}

this.cometTimer -=
  delta;

if (
  tier >= 3 &&
  this.cometTimer <=
    0
) {
 const comet =
  this.comets
    .create(
      Math.min(
        this.worldWidth - 80,
        this.player.x + 360
      ),
      -30,
      'comet'
    )
    .setDepth(11);

/* -------------------------------------------------
   COMET TRAIL FX
   Visual only — comet physics remain unchanged.
   ------------------------------------------------- */

if (
  !this.motionReduced &&
  comet?.active
) {
  const cometTrail =
    this.add.graphics()
      .setDepth(10);

  comet.setData(
    'trail',
    cometTrail
  );

  cometTrail.lineStyle(
    2,
    0x8df4ff,
    0.34
  );

  cometTrail.lineBetween(
    comet.x,
    comet.y - 6,
    comet.x,
    comet.y - 58
  );
}

comet.body
  .setAllowGravity(false)
  .setVelocity(
    -80,
    520
  );

this.cometTimer =
  Math.max(
    2400,
    5600 -
      tier * 420
  );

  this.game.events.emit(
    'feedback',
    'warning'
  );
}

}
/**

Runtime maintenance for player-deployed build systems.

Keeps turrets firing and removes expired/stray projectiles without

changing the collision or progression systems created elsewhere.
*/
updateBuilds() {
if (!this.player) return;

const now = Number.isFinite(this.elapsedMs)

  ? this.elapsedMs
  : 0;

if (this.turrets?.active) {
  this.turrets.getChildren().forEach(turret => {
    if (!turret?.active) return;

    const expires = turret.getData('expires');

    if (
      Number.isFinite(expires) &&
      now >= expires
    ) {
      turret.destroy();
      return;
    }

    if (!this.enemies?.active) return;

  const target = this.enemies

.getChildren()
.find(enemy =>
enemy?.active &&
Math.abs(enemy.x - turret.x) < 460 &&
Math.abs(enemy.y - turret.y) < 220
);

    const nextShot =
      Number(
        turret.getData('nextShot')
      ) || 0;

    if (
      !target ||
      now < nextShot ||
      !this.plasma?.active
    ) {
      return;
    }

    const dx =
      target.x - turret.x;

    const dy =
      target.y - turret.y;

    const distance =
      Math.max(
        1,
        Math.hypot(dx, dy)
      );

    const speed = 720;

    const bolt =
      this.plasma
        .create(
          turret.x,
          turret.y - 10,
          'plasma'
        )
        .setDepth(12);

    if (!bolt?.body) {
      bolt?.destroy();
      return;
    }

    bolt.setData(
      'power',
      1
    );

    bolt.setData(
      'createdAt',
      now
    );

    bolt.body
      .setAllowGravity(false)
      .setVelocity(
        dx / distance * speed,
        dy / distance * speed
      );

    turret.setData(
      'nextShot',
      now + 620
    );

    const muzzleFlash = this.add

.circle(
turret.x,
turret.y,
7,
0x8df4ff,
.24
)
.setDepth(11);

this.tweens.add({
targets: muzzleFlash,
scale: 2.2,
alpha: 0,
duration: 110,
onComplete: () => muzzleFlash.destroy()
});
});
}

const destroyProjectile =
  projectile => {
    if (!projectile) {
      return;
    }

    projectile
      .getData?.('trail')
      ?.destroy?.();

    projectile.destroy?.();
  };

const prune = (
  group,
  maxAge,
  maxDistance
) => {
  if (!group?.active) return;

  group
    .getChildren()
    .forEach(object => {
      if (!object?.active) return;

      const createdAt =
        Number(
          object.getData?.(
            'createdAt'
          )
        );

      const tooOld =
        Number.isFinite(
          createdAt
        ) &&
        now - createdAt >
          maxAge;

      const tooFar =
        Math.abs(
          object.x -
            this.player.x
        ) >
          maxDistance ||
        Math.abs(
          object.y -
            this.player.y
        ) >
          720;

   if (
  tooOld ||
  tooFar
) {
  destroyProjectile(
    object
  );
}
    });
};

prune(
  this.plasma,
  1800,
  1100
);

prune(
  this.kineticBalls,
  1800,
  1300
);

prune(
  this.eggs,
  4200,
  1600
);

prune(
  this.comets,
  Infinity,
  1800
);

}

updateNarrative() {
const beats =
this.mission.story
?.radio ||
[];

beats.forEach(
  ([x, text], index) => {
    if (
      !this.storyBeatsSeen.has(
        index
      ) &&
      this.player.x >= x
    ) {
      this.storyBeatsSeen.add(
        index
      );

      const line =
        this.add.text(
          this.player.x,
          this.player.y - 96,
          text,
          {
            fontFamily: 'DM Mono',
            fontSize: '11px',
            color: '#dffcff',
            stroke: '#08101c',
            strokeThickness: 4,
            wordWrap: {
              width: 370
            },
            align: 'center'
          }
        )
          .setOrigin(.5)
          .setDepth(14);

      this.tweens.add({
        targets: line,
        y: line.y - 22,
        alpha: 0,
        delay: 1900,
        duration: 520,
        onComplete: () =>
          line.destroy()
      });

      this.game.events.emit(
        'narration',
        text
      );

      this.time.delayedCall(
        1150,
        () =>
          this.game.events.emit(
            'character-response',
            [
              'Copy that.',
              'Relay runner moving.',
              'I see it.',
              'On the line.'
            ][
              index % 4
            ]
          )
      );

      this.game.events.emit(
        'feedback',
        'signal'
      );
    }
  }
);

}

updateEvents() {
const events = Array.isArray(this.mission?.events) ? this.mission.events : [];
events.forEach(
(event, index) => {
const state =
this.eventState.get(
index
) || '';

    if (
      !state &&
      this.player.x >=
        event.x - 260
    ) {
      this.eventState.set(
        index,
        'warned'
      );

    const cue = this.add.zone(

event.x - 120,
250,
1,
1
)
.setAlpha(0)
.setDepth(13);

      this.tweens.add({
        targets: cue,
        alpha: 0,
        delay: 1500,
        duration: 500,
        onComplete: () =>
          cue.destroy()
      });

      this.game.events.emit(
        'feedback',
        'warning'
      );
    } else if (
      state ===
        'warned' &&
      this.player.x >=
        event.x
    ) {
      this.eventState.set(
        index,
        'active'
      );

      if (
        event.type ===
        'blackout'
      ) {
        this.cameras.main.flash(
          180,
          30,
          70,
          110
        );

        this.game.events.emit(
          'feedback',
          'warning'
        );
      } else {
        this.alarmTimer =
          this.alarmDuration(
            event.type ===
              'chase'
              ? 5000
              : 3000
          );

        this.alarms++;

        this.game.events.emit(
          'feedback',
          'chase'
        );
      }
    }
  }
);

}

startChickenFireBreath(enemy, now) {
  if (
    !enemy?.active ||
    !this.player?.active
  ) {
    return false;
  }

  const distance =
    Phaser.Math.Distance.Between(
      enemy.x,
      enemy.y,
      this.player.x,
      this.player.y
    );

  const verticalDistance =
    Math.abs(
      this.player.y -
      enemy.y
    );

  if (
    distance < 140 ||
    distance > 360 ||
    verticalDistance > 150
  ) {
    return false;
  }

  const fireNext =
    Number(
      enemy.getData('fireNext')
    ) || 0;

  if (now < fireNext) {
    return false;
  }

  // Not every chicken attack becomes fire.
  // This keeps the egg attack relevant.
  if (Math.random() > 0.38) {
    return false;
  }

const existingFireUntil =
  Number(
    enemy.getData(
      'fireUntil'
    )
  ) || 0;

if (
  existingFireUntil > now
) {
  return false;
}

const fireChargeTime =
  420;

const fireDuration =
  850;

enemy.setData(
  'fireChargeUntil',
  now + fireChargeTime
);

enemy.setData(
  'fireUntil',
  now + fireChargeTime + fireDuration
);

const fireAngle =
  Phaser.Math.Angle.Between(
    enemy.x,
    enemy.y,
    this.player.x,
    this.player.y
  );

enemy.setData(
  'fireAngle',
  fireAngle
);

enemy.setData(
  'fireNextDamage',
  now + fireChargeTime
);

enemy.setData(
  'fireHitLock',
  now + fireChargeTime
);

enemy.setData(
  'fireNext',
  now +
  fireChargeTime +
  4200
);

enemy.setData(
  'nextShot',
  now +
  fireChargeTime +
  4200
);

  const fireFx =
    this.add
      .graphics()
      .setDepth(12);

  enemy.setData(
    'fireFx',
    fireFx
  );

this.playerCue(
  'CHICKEN FIRE BREATH · GET CLEAR',
  '#ff826e'
);

this.game.events.emit(
  'feedback',
  'warning'
);

  this.game.events.emit(
    'feedback',
    'chicken-fire'
  );

  return true;
}

updateChickenFireBreath(enemy, now) {
  if (!enemy?.active) {
    return;
  }

  const fireUntil =
    Number(
      enemy.getData('fireUntil')
    ) || 0;

  const fireFx =
    enemy.getData('fireFx');

  if (
    fireFx &&
    !fireFx.active
  ) {
    enemy.setData(
      'fireFx',
      null
    );
  }

  const fireChargeUntil =
    Number(
      enemy.getData('fireChargeUntil')
    ) || 0;

  if (
    fireUntil <= 0 ||
    now >= fireUntil
  ) {
    if (fireFx) {
      fireFx.destroy();

      enemy.setData(
        'fireFx',
        null
      );
    }

    enemy.setData(
      'fireUntil',
      0
    );

    enemy.setData(
      'fireChargeUntil',
      0
    );

enemy.setData(
  'fireNextDamage',
  0
);

enemy.setData(
  'fireHitLock',
  0
);

enemy.setData(
  'fireAngle',
  0
);

return;
  }

  if (!this.player?.active) {
    return;
  }

  // ============================================================
  // FIRE CHARGE / WARNING
  // ============================================================

  if (
    fireChargeUntil > now
  ) {
    if (fireFx) {
      fireFx.clear();

      const remaining =
        Phaser.Math.Clamp(
          (
            fireChargeUntil -
            now
          ) / 420,
          0,
          1
        );

      const pulse =
        0.55 +
        Math.sin(
          now * 0.035
        ) * 0.20;

      fireFx
        .fillStyle(
          0xff5364,
          0.08 +
          (1 - remaining) * 0.16
        )
        .fillCircle(
          enemy.x + 20,
          enemy.y - 5,
          10 +
          (1 - remaining) * 8
        );

      fireFx
        .lineStyle(
          2,
          0xff826e,
          0.45 +
          (1 - remaining) * 0.45
        )
        .strokeCircle(
          enemy.x + 20,
          enemy.y - 5,
          9 +
          (1 - remaining) * 9
        );

      fireFx
        .fillStyle(
          0xffd06e,
          pulse
        )
        .fillCircle(
          enemy.x + 20,
          enemy.y - 5,
          4 +
          (1 - remaining) * 4
        );

      fireFx
        .lineStyle(
          2,
          0xffd06e,
          0.20
        )
        .lineBetween(
          enemy.x + 24,
          enemy.y - 5,
          this.player.x,
          this.player.y
        );
    }

    return;
  }

  if (!this.player?.active) {
    return;
  }

  const angle =
  Number(
    enemy.getData(
      'fireAngle'
    )
  ) || 0;

  const length =
    310;

  const halfAngle =
    Phaser.Math.DegToRad(22);

  if (fireFx) {
    fireFx.clear();

    // OUTER FIRE CONE
    fireFx
      .fillStyle(
        0xff6a2a,
        0.18
      )
      .fillTriangle(
        enemy.x + 20,
        enemy.y - 5,
        enemy.x +
          Math.cos(
            angle - halfAngle
          ) * length,
        enemy.y +
          Math.sin(
            angle - halfAngle
          ) * length,
        enemy.x +
          Math.cos(
            angle + halfAngle
          ) * length,
        enemy.y +
          Math.sin(
            angle + halfAngle
          ) * length
      );

    // INNER HOT FLAME
    fireFx
      .fillStyle(
        0xffc247,
        0.28
      )
      .fillTriangle(
        enemy.x + 24,
        enemy.y - 5,
        enemy.x +
          Math.cos(
            angle - halfAngle * 0.62
          ) * 245,
        enemy.y +
          Math.sin(
            angle - halfAngle * 0.62
          ) * 245,
        enemy.x +
          Math.cos(
            angle + halfAngle * 0.62
          ) * 245,
        enemy.y +
          Math.sin(
            angle + halfAngle * 0.62
          ) * 245
      );

    // FIRE CORE
    fireFx
      .fillStyle(
        0xfff2b0,
        0.72
      )
      .fillTriangle(
        enemy.x + 26,
        enemy.y - 5,
        enemy.x +
          Math.cos(
            angle - halfAngle * 0.28
          ) * 145,
        enemy.y +
          Math.sin(
            angle - halfAngle * 0.28
          ) * 145,
        enemy.x +
          Math.cos(
            angle + halfAngle * 0.28
          ) * 145,
        enemy.y +
          Math.sin(
            angle + halfAngle * 0.28
          ) * 145
      );

    // MUZZLE FIRE
    fireFx
      .fillStyle(
        0xffe09a,
        0.90
      )
      .fillCircle(
        enemy.x + 24,
        enemy.y - 5,
        11
      );

 // FIRE PARTICLE POINTS
const pulse =
  0.65 +
  Math.sin(now * 0.035) *
    0.20;

// ANIMATED FIRE TONGUES
const fireCos = Math.cos(angle);
const fireSin = Math.sin(angle);

for (let i = 0; i < 7; i++) {
  const t = (i + 1) / 8;
  const spread =
    Math.sin(
      now * 0.018 +
      i * 1.7
    ) * (7 + t * 10);

  const drift =
    Math.cos(
      now * 0.024 +
      i * 2.3
    ) * (4 + t * 7);

  const px =
    enemy.x +
    fireCos * (28 + t * 245) -
    fireSin * spread;

  const py =
    enemy.y +
    fireSin * (28 + t * 245) +
    fireCos * spread +
    drift;

  const radius =
    (1.5 + (1 - t) * 3.2) *
    (0.8 + pulse * 0.35);

  g.fillStyle(
    i % 2 === 0
      ? 0xfff0a8
      : 0xff8a38,
    0.82 - t * 0.08
  );

  g.fillCircle(
    px,
    py,
    radius
  );
}

// HOT EMBERS
for (let i = 0; i < 5; i++) {
  const t =
    ((now * 0.0007 + i * 0.21) % 1);

  const spread =
    Math.sin(
      now * 0.021 +
      i * 2.4
    ) * 14;

  const px =
    enemy.x +
    fireCos * (55 + t * 245) -
    fireSin * spread;

  const py =
    enemy.y +
    fireSin * (55 + t * 245) +
    fireCos * spread -
    10 * t;

  g.fillStyle(
    0xffc45c,
    0.72 * (1 - t)
  );

  g.fillCircle(
    px,
    py,
    1.2 + (1 - t) * 1.5
  );
}

    fireFx
      .fillStyle(
        0xff826e,
        pulse
      )
      .fillCircle(
        enemy.x +
          Math.cos(angle) * 105,
        enemy.y +
          Math.sin(angle) * 105,
        7
      );

    fireFx
      .fillStyle(
        0xffd06e,
        pulse
      )
      .fillCircle(
        enemy.x +
          Math.cos(angle) * 175,
        enemy.y +
          Math.sin(angle) * 175,
        5
      );
  }

  // ============================================================
  // FIRE CONE HIT TEST
  // ============================================================

  const playerDistance =
    Phaser.Math.Distance.Between(
      enemy.x,
      enemy.y,
      this.player.x,
      this.player.y
    );

  const playerAngle =
    Phaser.Math.Angle.Between(
      enemy.x,
      enemy.y,
      this.player.x,
      this.player.y
    );

  let angleDelta =
    Phaser.Math.Angle.Wrap(
      playerAngle - angle
    );

  angleDelta =
    Math.abs(angleDelta);

  const insideCone =
    playerDistance >= 35 &&
    playerDistance <= length &&
    angleDelta <= halfAngle;

  if (!insideCone) {
    return;
  }

const fireNextDamage =
  Number(
    enemy.getData(
      'fireNextDamage'
    )
  ) || 0;

const fireHitLock =
  Number(
    enemy.getData(
      'fireHitLock'
    )
  ) || 0;

if (
  now < fireNextDamage ||
  now < fireHitLock
) {
  return;
}

enemy.setData(
  'fireNextDamage',
  now + 220
);

enemy.setData(
  'fireHitLock',
  now + 220
);

// ============================================================
// FIRE IMPACT FX
// ============================================================

if (
  !this.motionReduced
) {
  this.cameras.main.shake(
    90,
    0.004
  );

  this.cameras.main.flash(
    80,
    255,
    110,
    60,
    false
  );

  const impact =
    this.add
      .circle(
        this.player.x,
        this.player.y,
        10,
        0xff6a2a,
        0.65
      )
      .setDepth(30);

  impact.setStrokeStyle(
    2,
    0xfff2b0,
    0.9
  );

  this.tweens.add({
    targets: impact,
    scale: 2.8,
    alpha: 0,
    duration: 240,
    ease: 'Cubic.out',
    onComplete: () =>
      impact.destroy()
  });
}

this.takeSciFiHit(
  'The chicken breathed fire on the courier.',
  this.player.x,
  this.player.y
);
}

complete() {
if (this.finished)
return;

if (this.boss?.active) {
  this.playerCue(
    `${
      this.boss.getData(
        'bossName'
      ) ||
      'ALPHA DINO'
    } BLOCKS THE RELAY · DEFEAT IT`,
    '#ffcf82'
  );

if (this.player?.body) {
  this.player.body.setVelocityX(
    -260
  );
}

return;
}

this.finished = true;
this.physics.pause();
this.player.play(
  'runner-finish',
  true
);
this.player.setTint(
  0xffefad
);

if (
  !this.motionReduced &&
  this.graphicsLevel >= 2
) {
  this.cameras.main.flash(
    260,
    255,
    208,
    110
  );
}

this.game.events.emit(
  'feedback',
  'complete'
);

if (
  this.mission.story
    ?.completion
) {
  const epilogue =
    this.add.text(
      this.goal.x + 20,
      this.goal.y - 88,
      this.mission.story
        .completion,
      {
        fontFamily: 'DM Mono',
        fontSize: '11px',
        color: '#dffcff',
        stroke: '#08101c',
        strokeThickness: 4,
        wordWrap: {
          width: 380
        },
        align: 'center'
      }
    )
      .setOrigin(.5)
      .setDepth(14);

  this.tweens.add({
    targets: epilogue,
    alpha: 0,
    delay: 2800,
    duration: 500,
    onComplete: () =>
      epilogue.destroy()
  });
}

if (this.graphicsLevel >= 1) {
  this.dust.emitParticleAt(
    this.goal.x + 20,
    this.goal.y + 25,
    34
  );

  this.speedLines.emitParticleAt(
    this.goal.x + 20,
    this.goal.y + 25,
    10
  );
}

this.tweens.add({
  targets: this.player,
  y: this.player.y - 12,
  duration: 130,
  yoyo: true,
  repeat: 1
});

const relayGlow =
  this.add
    .circle(
      this.goal.x + 22,
      this.goal.y + 22,
      20,
      0xffd06e,
      .75
    );

relayGlow.setBlendMode(
  Phaser.BlendModes.ADD
);

relayGlow.setDepth(12);

const completeLabel =
  this.add.text(
    this.goal.x + 22,
    this.goal.y - 34,
    'RELAY LINKED',
    {
      fontFamily: 'DM Mono',
      fontSize: '16px',
      color: '#fff0b5',
      stroke: '#08101c',
      strokeThickness: 5,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: '#8df4ff',
        blur: 10,
        stroke: true,
        fill: true
      }
    }
  )
  .setOrigin(.5)
  .setDepth(13)
  .setScale(.65);

this.tweens.add({
  targets: relayGlow,
  scale: 8,
  alpha: 0,
  duration: 700,
  ease: 'Quad.out',
  onComplete: () =>
    relayGlow.destroy()
});

this.tweens.add({
  targets: completeLabel,
  scale: 1,
  y:
    completeLabel.y -
    20,
  duration: 320,
  ease: 'Back.out'
});

  // ============================================================
// FINAL MISSION CUE
// ============================================================
this.playerCue(
  'MISSION COMPLETE',
  '#ffd06e'
);

this.gadgetPulse(
  0xffd06e,
  22,
  520
);

if (
  !this.motionReduced &&
  this.graphicsLevel >= 2
) {
  this.cameras.main.flash(
    140,
    255,
    214,
    120
  );

  this.shake(
    120,
    0.006
  );
}

const medalResult =
  this.calculateMissionMedals();

this.time.delayedCall(
  650,
  () => {
    if (!this.scene.isActive()) return;

    this.showMissionMedals();
  },
  undefined,
  this
);
  
this.time.delayedCall(
  120,
  () => {
    if (!this.scene.isActive()) {
      return;
    }

    this.game.events.emit(
      'complete',
      this.collected,
      this.elapsedMs,
      {
        jumps: this.jumps,
        collisions:
          this.collisions,
        falls: this.falls,
        secrets:
          this.secretsCollected,
        alarms: this.alarms,
        chaseEscapes:
          this.chaseEscapes,
        enemyDefeats:
          this.enemyDefeats ||
          0,
        perfectDodges:
  this.perfectDodges || 0,
        bestCombatCombo:
  this.bestCombatCombo || 0,
        bossDefeated:
          Boolean(
            this.boss &&
            !this.boss.active
          ),
        medals: medalResult,
        package:
          this.package,
        packageCondition:
          this.packageCondition,
        contract:
          this.mission
            .activeContract,
        modifier:
          this.loadout
            .modifier,
        signalBonusExtra:
          this.boostedSignals *
            5 +
          (
            this.loadout
              .upgrades
              ?.includes(
                'signalXp'
              )
              ? this.collected
              : 0
          ),
        score:
          this.collected *
            100 +
          this.secretsCollected *
            250 +
          this.boostedSignals *
            100
        }
      );
    },
    undefined,
    this
  );

}

// ============================================================
// MISSION MEDALS
// Calculates a final run rating from existing run statistics.
// ============================================================
calculateMissionMedals() {
  const totalSignals =
    Math.max(
      1,
      this.mission.signals?.length || 1
    );

  const signalRatio =
    Phaser.Math.Clamp(
      this.collected / totalSignals,
      0,
      1
    );

  const totalSecrets =
    this.mission.secrets?.length || 0;

  const secretRatio =
    totalSecrets > 0
      ? Phaser.Math.Clamp(
          this.secretsCollected / totalSecrets,
          0,
          1
        )
      : 0;

  // ----------------------------------------------------------
  // SPEED
  // ----------------------------------------------------------
  const elapsedSeconds =
    Math.max(
      1,
      this.elapsedMs / 1000
    );

  const expectedSeconds =
    Math.max(
      18,
      (
        (
          this.mission.goal?.x || 4000
        ) -
        (
          this.mission.spawn?.x || 0
        )
      ) / 240
    );

  const speedRatio =
    Phaser.Math.Clamp(
      expectedSeconds / elapsedSeconds,
      0,
      1.35
    );

  this.runRating.speed =
    speedRatio >= 1.10
      ? 3
      : speedRatio >= .86
        ? 2
        : 1;

  // ----------------------------------------------------------
  // COMBAT
  // ----------------------------------------------------------
  const defeats =
    this.enemyDefeats || 0;

  const enemyCount =
  Math.max(
    1,
    this.mission.enemies?.length || 1
  );

  const combatRatio =
    Phaser.Math.Clamp(
      defeats / enemyCount,
      0,
      1
    );

  this.runRating.combat =
    combatRatio >= .75
      ? 3
      : combatRatio >= .35
        ? 2
        : 1;

  // ----------------------------------------------------------
  // COLLECTION
  // ----------------------------------------------------------
  const collectionScore =
    signalRatio * .70 +
    secretRatio * .30;

  this.runRating.collection =
    collectionScore >= .90
      ? 3
      : collectionScore >= .60
        ? 2
        : 1;

  // ----------------------------------------------------------
  // SURVIVAL
  // ----------------------------------------------------------
  const deaths =
    this.deaths || 0;

  const collisions =
    this.collisions || 0;

  const falls =
    this.falls || 0;

  let survivalScore = 3;

  if (deaths >= 2) {
    survivalScore = 1;
  } else if (
    deaths === 1 ||
    collisions >= 3 ||
    falls >= 3
  ) {
    survivalScore = 2;
  }

  this.runRating.survival =
    survivalScore;

  // ----------------------------------------------------------
  // OVERALL
  // ----------------------------------------------------------
  const total =
    this.runRating.speed +
    this.runRating.combat +
    this.runRating.collection +
    this.runRating.survival;

  this.runRating.overall =
    total >= 11
      ? 'S'
      : total >= 9
        ? 'A'
        : total >= 7
          ? 'B'
          : 'C';

  this.medalResult = {
    speed: this.runRating.speed,
    combat: this.runRating.combat,
    collection: this.runRating.collection,
    survival: this.runRating.survival,
    overall: this.runRating.overall,

    total,
    timeMs: this.elapsedMs,
    signals: this.collected,
    secrets: this.secretsCollected,
    deaths,
    collisions,
    falls,
    enemyDefeats: defeats,

    bossDefeated: Boolean(
      this.boss &&
      !this.boss.active
    )
  };

  return this.medalResult;
}

// ============================================================
// RUN EVALUATION UI
// Displays the final mission rating without changing gameplay.
// ============================================================
showMissionMedals() {

  if (
    !this.medalResult ||
    this.gameOverUI
  ) {
    return;
  }

  if (this.missionMedalsUI) {
    return;
  }

  const result =
    this.medalResult;

  const width =
    this.scale.width;

  const height =
    this.scale.height;

  const stars = value =>
    '★'.repeat(value) +
    '☆'.repeat(3 - value);

  const overallColor =
    result.overall === 'S'
      ? '#fff0a8'
      : result.overall === 'A'
        ? '#8df4ff'
        : result.overall === 'B'
          ? '#aee37f'
          : '#ff826e';

  const panelWidth =
    Math.min(
      width - 36,
      430
    );

const panelHeight = Math.max(
  260,
  Math.min(
    height - 28,
    330
  )
);

  const panel =
    this.add
      .rectangle(
        width / 2,
        height / 2,
        panelWidth,
        panelHeight,
        0x050914,
        .96
      )
      .setStrokeStyle(
        2,
        0x8df4ff,
        .75
      )
      .setScrollFactor(0)
      .setDepth(120);

  const header =
    this.add
      .text(
        width / 2,
        height / 2 - 132,
        'MISSION COMPLETE',
        {
          fontFamily: 'DM Mono',
          fontSize: width < 600
            ? '14px'
            : '16px',
          color: '#8df4ff',
          stroke: '#08101c',
          strokeThickness: 5,
          align: 'center'
        }
      )
      .setOrigin(.5)
      .setScrollFactor(0)
      .setDepth(121);

  const subtitle =
    this.add
      .text(
        width / 2,
        height / 2 - 105,
        'DELIVERY REPORT · RUN PERFORMANCE',
        {
          fontFamily: 'DM Mono',
          fontSize: width < 600
            ? '8px'
            : '9px',
          color: '#6f849d',
          align: 'center'
        }
      )
      .setOrigin(.5)
      .setScrollFactor(0)
      .setDepth(121);

  const resultText =
    this.add
      .text(
        width / 2,
        height / 2 - 38,
        [
          `SPEED       ${stars(result.speed)}`,
          `COMBAT      ${stars(result.combat)}`,
          `COLLECTION  ${stars(result.collection)}`,
          `SURVIVAL    ${stars(result.survival)}`
        ].join('\n'),
        {
          fontFamily: 'DM Mono',
          fontSize: width < 600
            ? '10px'
            : '12px',
          color: '#dffcff',
          stroke: '#08101c',
          strokeThickness: 4,
          lineSpacing: 11,
          align: 'left'
        }
      )
      .setOrigin(.5)
      .setScrollFactor(0)
      .setDepth(121);

  // ============================================================
// FINAL RANK · HERO REVEAL
// ============================================================
const rankGlow =
  this.add
    .circle(
      width / 2,
      height / 2 + 78,
      width < 600 ? 44 : 52,
      Phaser.Display.Color.HexStringToColor(
        overallColor
      ).color,
      .16
    )
    .setScrollFactor(0)
    .setDepth(120);

rankGlow.setStrokeStyle(
  2,
  Phaser.Display.Color.HexStringToColor(
    overallColor
  ).color,
  .82
);

this.tweens.add({
  targets: rankGlow,
  scale: 2.4,
  alpha: 0,
  duration: 720,
  ease: 'Quad.out',
  onComplete: () =>
    rankGlow.destroy()
});

this.time.delayedCall(
  220,
  () => {
    this.tweens.add({
      targets: overall,
      alpha: 1,
      scale: 1,
      duration: 520,
      ease: 'Back.out'
    });

    if (!this.motionReduced) {
      this.cameras.main.flash(
        120,
        result.overall === 'S'
          ? 255
          : result.overall === 'A'
            ? 120
            : result.overall === 'B'
              ? 140
              : 255,
        result.overall === 'B'
          ? 220
          : 120,
        170
      );
    }
  }
);
  

  const overall =
    this.add
      .text(
        width / 2,
        height / 2 + 78,
        result.overall,
        {
          fontFamily: 'DM Mono',
          fontSize: width < 600
            ? '54px'
            : '64px',
          fontStyle: 'bold',
          color: overallColor,
          stroke: '#08101c',
          strokeThickness: 8,
          align: 'center'
        }
      )
      .setOrigin(.5)
      .setScrollFactor(0)
      .setDepth(121);

  const summary =
    this.add
      .text(
        width / 2,
        height / 2 + 125,
        `RATING ${result.total} / 12  ·  ${result.signals} SIGNALS  ·  ${result.secrets} SECRETS`,
        {
          fontFamily: 'DM Mono',
          fontSize: width < 600
            ? '7px'
            : '8px',
          color: '#8ba0b8',
          align: 'center'
        }
      )
      .setOrigin(.5)
      .setScrollFactor(0)
      .setDepth(121);



  const objects = [
  panel,
  header,
  subtitle,
  resultText,
  overall,
  summary
];

objects.forEach(
  object => {
    object.setAlpha(0);
    object.setScale(.94);
  }
);

// ============================================================
// FINAL RANK · HERO INITIAL STATE
// ============================================================
overall.setScale(.35);
overall.setAlpha(0);

this.missionMedalsUI = objects;

 this.tweens.add({
  targets: objects.filter(
    object => object !== overall
  ),
  alpha: 1,
  scaleX: 1,
  scaleY: 1,
  duration: 360,
  ease: 'Back.out'
});

this.tweens.add({
  targets: overall,
  alpha: 1,
  scaleX: 1,
  scaleY: 1,
  duration: 560,
  delay: 360,
  ease: 'Back.out',
  onComplete: () => {
    if (
      this.missionMedalsUI === objects
    ) {
      this.missionMedalsUI = null;
    }
  }
});
}

showGameOverScreen(message = 'RUN ENDED') {

  if (this.gameOverUI) {
    return;
  }

  const width =
    this.scale.width;

  const height =
    this.scale.height;

  const panelWidth =
    Math.min(
      width - 36,
      430
    );

  const panelHeight =
    Math.min(
      height - 70,
      390
    );

  const remainingLives =
    Math.max(
      0,
      this.deathLimit - this.deaths
    );

  const objects = [];

  /*
   * ============================================================
   * GAME OVER · BACKDROP
   * ============================================================
   */

  const backdrop =
    this.add
      .rectangle(
        width / 2,
        height / 2,
        width,
        height,
        0x03050b,
        0.78
      )
      .setScrollFactor(0)
      .setDepth(119);

  objects.push(backdrop);

  /*
   * ============================================================
   * GAME OVER · PANEL
   * ============================================================
   */

  const panel =
    this.add
      .rectangle(
        width / 2,
        height / 2,
        panelWidth,
        panelHeight,
        0x070d18,
        0.98
      )
      .setStrokeStyle(
        2,
        0xff826e,
        0.82
      )
      .setScrollFactor(0)
      .setDepth(120);

  objects.push(panel);

  /*
   * ============================================================
   * GAME OVER · TITLE
   * ============================================================
   */

  const title =
    this.add
      .text(
        width / 2,
        height / 2 - 135,
        'RUN FAILED',
        {
          fontFamily: 'DM Mono',
          fontSize:
            width < 600
              ? '24px'
              : '30px',
          fontStyle: 'bold',
          color: '#ff826e',
          stroke: '#08101c',
          strokeThickness: 6,
          align: 'center'
        }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(121);

  objects.push(title);

  /*
   * ============================================================
   * GAME OVER · SUBTITLE
   * ============================================================
   */

  const subtitle =
    this.add
      .text(
        width / 2,
        height / 2 - 98,
        'RECOVERY LIMIT REACHED',
        {
          fontFamily: 'DM Mono',
          fontSize:
            width < 600
              ? '9px'
              : '11px',
          color: '#7f93ab',
          align: 'center'
        }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(121);

  objects.push(subtitle);

  /*
   * ============================================================
   * GAME OVER · REASON
   * ============================================================
   */

  const reason =
    this.add
      .text(
        width / 2,
        height / 2 - 52,
        message,
        {
          fontFamily: 'DM Mono',
          fontSize:
            width < 600
              ? '9px'
              : '11px',
          color: '#dffcff',
          stroke: '#08101c',
          strokeThickness: 4,
          wordWrap: {
            width:
              panelWidth - 54
          },
          align: 'center'
        }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(121);

  objects.push(reason);

  /*
   * ============================================================
   * GAME OVER · RUN STATS
   * ============================================================
   */

  const stats =
    this.add
      .text(
        width / 2,
        height / 2 + 5,
        [
          `DEATHS       ${this.deaths}`,
          `COLLISIONS   ${this.collisions}`,
          `FALLS        ${this.falls}`,
          `SIGNALS      ${this.collected}`,
          `SECRETS      ${this.secretsCollected}`,
          `RECOVERIES   ${remainingLives}`
        ].join('\n'),
        {
          fontFamily: 'DM Mono',
          fontSize:
            width < 600
              ? '10px'
              : '12px',
          color: '#b9f5ff',
          stroke: '#08101c',
          strokeThickness: 4,
          lineSpacing: 7,
          align: 'left'
        }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(121);

  objects.push(stats);

  /*
   * ============================================================
   * GAME OVER · RESTART BUTTON
   * ============================================================
   */

  const restartButton =
    this.add
      .rectangle(
        width / 2,
        height / 2 + 118,
        Math.min(
          panelWidth - 70,
          250
        ),
        46,
        0x10263a,
        0.98
      )
      .setStrokeStyle(
        2,
        0x8df4ff,
        0.9
      )
      .setScrollFactor(0)
      .setDepth(121)
      .setInteractive({
        useHandCursor: true
      });

  objects.push(restartButton);

  const restartText =
    this.add
      .text(
        width / 2,
        height / 2 + 118,
        'RESTART RUN',
        {
          fontFamily: 'DM Mono',
          fontSize:
            width < 600
              ? '11px'
              : '13px',
          fontStyle: 'bold',
          color: '#dffcff',
          align: 'center'
        }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(122);

  objects.push(restartText);

    /*
 * ============================================================
 * GAME OVER · BRIEFING BUTTON
 * ============================================================
 */

const briefingButton =
  this.add
    .rectangle(
      width / 2,
      height / 2 + 174,
      Math.min(
        panelWidth - 70,
        250
      ),
      40,
      0x0b1524,
      0.96
    )
    .setStrokeStyle(
      1,
      0x52677d,
      0.9
    )
    .setScrollFactor(0)
    .setDepth(121)
    .setInteractive({
      useHandCursor: true
    });

objects.push(
  briefingButton
);

const briefingText =
  this.add
    .text(
      width / 2,
      height / 2 + 174,
      'RETURN TO BRIEFING',
      {
        fontFamily: 'DM Mono',
        fontSize:
          width < 600
            ? '9px'
            : '10px',
        fontStyle: 'bold',
        color: '#8fa5bc',
        align: 'center'
      }
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(122);

objects.push(
  briefingText
);

  /*
   * ============================================================
   * BUTTON INTERACTION
   * ============================================================
   */

  restartButton.on(
    'pointerover',
    () => {

      restartButton
        .setFillStyle(
          0x163b52,
          1
        )
        .setStrokeStyle(
          2,
          0xb9f5ff,
          1
        );

      restartText.setColor(
        '#ffffff'
      );
    }
  );

    briefingButton.on(
  'pointerover',
  () => {

    briefingButton
      .setFillStyle(
        0x142336,
        1
      )
      .setStrokeStyle(
        1,
        0x8df4ff,
        0.85
      );

    briefingText.setColor(
      '#dffcff'
    );
  }
);

briefingButton.on(
  'pointerout',
  () => {

    briefingButton
      .setFillStyle(
        0x0b1524,
        0.96
      )
      .setStrokeStyle(
        1,
        0x52677d,
        0.9
      );

    briefingText.setColor(
      '#8fa5bc'
    );
  }
);

    briefingButton.on(
  'pointerdown',
  () => {

    if (
      this.gameOverRestarting
    ) {
      return;
    }

    this.gameOverRestarting = true;

    this.gameOverUI?.forEach(
      object => object.destroy()
    );

    this.gameOverUI = null;

    this.scene.stop();

    const intro =
      document.getElementById(
        'intro'
      );

    const worldMap =
      document.getElementById(
        'worldMap'
      );

    const preflight =
      document.getElementById(
        'preflight'
      );

    worldMap?.classList.add(
      'hidden'
    );

    preflight?.classList.add(
      'hidden'
    );

    intro?.classList.remove(
      'hidden'
    );
  }
);

  restartButton.on(
    'pointerout',
    () => {

      restartButton
        .setFillStyle(
          0x10263a,
          0.98
        )
        .setStrokeStyle(
          2,
          0x8df4ff,
          0.9
        );

      restartText.setColor(
        '#dffcff'
      );
    }
  );

  restartButton.on(
    'pointerdown',
    () => {

      if (this.gameOverRestarting) {
        return;
      }

      this.gameOverRestarting = true;

      if (
  this.missionMedalsUI
) {
  this.missionMedalsUI.forEach(
    object => {
      if (
        object &&
        object.active
      ) {
        object.destroy();
      }
    }
  );

  this.missionMedalsUI = null;
}

this.missionMedalsClosing = true;

if (this.missionMedalsUI) {
  this.missionMedalsUI.forEach(
    object => {
      if (object?.active) {
        this.tweens.killTweensOf(object);
      }
    }
  );
}

this.scene.restart({
  mission: this.mission,
  runId: this.runId,
  abilities: Array.from(this.abilities || []),
  rain: this.rainEnabled,
  screenShake: this.screenShake,
  reducedMotion: this.motionReduced,
  firstTimeTutorial: false
});
    }
  );

  /*
   * ============================================================
   * GAME OVER · ANIMATION
   * ============================================================
   */

  objects.forEach(
    object => {

      object.setAlpha(0);

      if (
        object !== backdrop
      ) {
        object.setScale(
          0.94
        );
      }
    }
  );

  this.tweens.add({
    targets: objects,
    alpha: 1,
    duration: 280,
    ease: 'Quad.out'
  });

  this.tweens.add({
    targets: objects.filter(
      object =>
        object !== backdrop
    ),
    scaleX: 1,
    scaleY: 1,
    duration: 360,
    ease: 'Back.out'
  });

  this.gameOverUI =
    objects;

    /*
 * ============================================================
 * GAME OVER · VISUAL IMPACT
 * ============================================================
 */

this.time.delayedCall(
  520,
  () => {

    if (
      !this.gameOverUI ||
      this.gameOverRestarting
    ) {
      return;
    }

    /*
     * TITLE IMPACT
     */

    this.tweens.add({
      targets: title,
      scaleX: 1.07,
      scaleY: 1.07,
      duration: 120,
      ease: 'Quad.out',
      yoyo: true
    });

    /*
     * RED ALERT PULSE
     */

    this.tweens.add({
      targets: backdrop,
      alpha: 0.9,
      duration: 160,
      ease: 'Quad.out',
      yoyo: true
    });

    /*
     * RESTART BUTTON BREATHING
     */

    this.tweens.add({
      targets: [
        restartButton,
        restartText
      ],
      scaleX: 1.035,
      scaleY: 1.035,
      duration: 500,
      ease: 'Sine.inOut',
      yoyo: true,
      repeat: -1
    });

  }
);
    
}

fail(
  message,
  damageAlreadyApplied = false
) {

if (
  this.briefingProtected ||
  this.respawning ||
  this.finished ||
  this.healthInvulnerable > 0 ||
  !this.player ||
  !this.player.active
) {
  return;
}

if (
  (this.surpriseShieldCharges || 0) > 0
) {
  this.surpriseShieldCharges--;

  this.healthInvulnerable =
    900;

  this.playerCue(
    'SHIELD CORE · IMPACT ABSORBED',
    '#8df4ff'
  );

  this.game.events.emit(
    'feedback',
    'shield'
  );

  if (
  !this.motionReduced &&
  this.graphicsLevel >= 2
) {
  this.cameras.main.flash(
    100,
    141,
    244,
    255
  );

  this.shake(
    90,
    0.003
  );
}

  return;
}

if (!damageAlreadyApplied) {
  this.health--;
}

if (!damageAlreadyApplied) {
  const polarityLoss =
    this.polarityState === 'OVERDRIVE'
      ? 18
      : this.polarityState === 'CHARGED'
        ? 12
        : 8;

  this.addPolarity(
    -polarityLoss,
    'damage'
  );
}

const collision =
  message.includes('barrier') ||
  message.includes('interceptor');

const waterHazard =
  message.includes('shark');

if (collision) {
  this.collisions++;
} else if (!waterHazard) {
  this.falls++;
}

this.deaths++;

if (this.package?.condition) {
  this.packageCondition =
    Math.max(
      0,
      this.packageCondition -
        (
          collision
            ? 25
            : 35
        )
    );
}

if (
  this.deaths >=
  this.deathLimit
) {
  this.game.events.emit(
    'deaths',
    this.deaths,
    this.deathLimit
  );

  this.finished = true;
  this.physics.pause();

  this.player.play(
    'runner-hit',
    true
  );

  this.player.setTint(
    0xff826e
  );

this.shake(
  170,
  .014
);

this.showGameOverScreen(
  `RUN ENDED · ${this.deathLimit} / ${this.deathLimit} RECOVERIES USED`
);

this.game.events.emit(
    'game-over',
    `RUN ENDED · ${this.deathLimit} / ${this.deathLimit} RECOVERIES USED`,
    this.deaths,
    this.runId
  );

  return;
}

this.game.events.emit(
  'deaths',
  this.deaths,
  this.deathLimit
);

this.respawning = true;
this.physics.pause();

this.player.play(
  'runner-hit',
  true
);

this.player.setTint(
  0xff826e
);

this.shake(
  170,
  .014
);

if (
  !this.motionReduced &&
  this.graphicsLevel >= 2
) {
  this.cameras.main.flash(
    120,
    255,
    100,
    90
  );
}

this.game.events.emit(
  'feedback',
    'death'
);

if (this.graphicsLevel >= 1) {
  this.dust.emitParticleAt(
    this.player.x,
    this.player.y + 10,
    12
  );

  this.speedLines.emitParticleAt(
    this.player.x,
    this.player.y,
    8
  );
}

this.time.delayedCall(
  180,
  () =>
    this.respawnCheckpoint()
);

}

respawnCheckpoint() {
  this.dizzyStarsSerial++;

  this.dizzyStars
    ?.destroy?.(true);

  this.dizzyStars = null;
  this.dizzyStarsTimer = 0;
  this.dizzyStarsIntensity = 0;

  this.game.events.emit(
    'feedback',
    'respawn'
  );
  
if (
this.loadout.modifier
?.id ===
'noCheckpoints'
) {
this.checkpoint = {
x: this.mission.spawn.x,
y: this.mission.spawn.y,
signals: new Set(),
secrets: new Set()
};
}

this.resetCollapsingPlatforms();

let lostSignals = 0;
let lostSecrets = 0;

this.signals
  .getChildren()
  .forEach(
    signal => {
      if (
        !signal.active &&
        !this.checkpoint.signals.has(
          signal.getData(
            'id'
          )
        )
      ) {
        signal.enableBody(
          true,
          signal.x,
          signal.y,
          true,
          true
        );

        lostSignals++;
      }
    }
  );

this.secrets
  .getChildren()
  .forEach(
    secret => {
      if (
        !secret.active &&
        !this.checkpoint.secrets.has(
          secret.getData(
            'id'
          )
        )
      ) {
        secret.enableBody(
          true,
          secret.x,
          secret.y,
          true,
          true
        );

        lostSecrets++;
      }
    }
  );

this.collected =
  this.checkpoint.signals.size;

this.secretsCollected =
  this.checkpoint.secrets.size;

this.signalInterference =
  this.getSignalInterferenceLevel();

this.signalInterferenceTier =
  this.getSignalInterferenceTier(
    this.signalInterference
  );

this.signalOverrideTriggered =
  this.signalInterference >= 0.999;

this.signalGhostTimer = 0;
this.signalInterferencePulse = 0;

this.health =
  this.healthMax;

this.polarity = 0;
this.polarityState = 'STABLE';
this.polarityDecayTimer = 0;
this.polarityLastState = 'STABLE';
this.polarityPulseTimer = 0;
this.overdriveTimer = 0;
this.polarityComboOverdriveTriggered = false;

this.game.events.emit(
  'polarity',
  this.polarity,
  this.polarityMax,
  'respawn'
);

this.game.events.emit(
  'polarity-state',
  this.polarityState,
  this.polarity
);

this.waterAttackActive = false;
this.waterDeathTimer = 0;
this.waterAttackToken++;

this.empTimer =
  0;

this.decoyTimer =
  0;

this.boosterTimer =
  0;

this.alarmTimer =
  0;

this.boosterAura
  ?.destroy();

this.boosterAura =
  null;

this.decoyBeacon
  ?.destroy();

this.decoyBeacon =
  null;

// ------------------------------------------------------------
// DEPLOYABLE RESET
// Death starts a clean attempt.
// ------------------------------------------------------------
[
  this.shields,
  this.kineticBalls,
  this.turrets,
  this.springPads
].forEach(
  group => {
    group
      ?.getChildren()
      ?.forEach(
        object =>
          object?.destroy?.()
      );
  }
);

this.waterZones
  ?.getChildren()
  ?.forEach(water => {
    if (water?.active) {
      water.setData(
        'used',
        false
      );
    }
  });

this.game.events.emit(
  'health',
  this.health
);

this.playerCrouched =
  false;

this.slideTimer =
  0;

this.dashTimer =
  0;

this.dashFxTimer =
  0;

this.airDashUsed =
  false;

this.coyote =
  0;

this.jumpBuffer =
  0;

this.jumpHeld =
  false;

this.wallJumpTimer =
  0;

this.firstPersonCamera =
  false;

if (
  this.player?.active
) {
  this.player.setAlpha(1);
}

this.wallJumpCooldown =
  0;

this.combatCombo =
  0;

this.comboTimer =
  0;

this.overdriveTimer =
  0;

this.polarityComboOverdriveTriggered =
  false;

this.perfectDodgeWindow =
  0;

this.perfectDodgeCooldown =
  0;

this.dashCooldown =
  0;

this.blasterCooldown =
  0;

this.swordCooldown =
  0;

this.vaultCooldown =
  0;

this.boostCooldown =
  0;

this.gadgetCooldowns =
  this.gadgetCooldowns.map(
    () => 0
  );

this.buildCooldowns =
  this.buildCooldowns.map(
    () => 0
  );

this.mobileDirection =
  null;

this.mobileActions.jump =
  false;

this.mobileActions.fire =
  false;

this.mobileActions.sword =
  false;

this.mobileActions.dash =
  false;

this.mobileActions.crouch =
  false;

this.mobileActions.interact =
  false;

this.mobileActions.build1 =
  false;

this.mobileActions.build2 =
  false;

this.mobileActions.gadget1 =
  false;

this.mobileActions.gadget2 =
  false;

this.mobileActions.polarity =
  false;

this.player
  .clearTint()
  .setAlpha(1)
  .setScale(
    this.playerVisualBaseScaleX,
    this.playerVisualBaseScaleY
  )
  .setPosition(
    this.checkpoint.x,
    this.checkpoint.y
  )
  .play(
    'runner-idle',
    true
  );

this.player.body
  .setSize(
    this.playerBodyConfig.standing.width,
    this.playerBodyConfig.standing.height
  )
  .setOffset(
    this.playerBodyConfig.standing.offsetX,
    this.playerBodyConfig.standing.offsetY
  );

this.player.body.reset(
  this.checkpoint.x,
  this.checkpoint.y
);

this.player.body.setVelocity(
  0,
  0
);

this.fallSpeed = 0;
this.wasGrounded = true;
this.landingTimer = 0;
this.lastHardLanding = false;

this.respawnGrace =
  1100;

this.healthInvulnerable =
  2200;

// Remove attacks already covering the checkpoint and make nearby enemies give the player room to recover.
[
  this.eggs,
  this.comets
].forEach(
  group =>
    group
      ?.getChildren()
      .forEach(
        projectile => {
  if (
  projectile.active &&
  Phaser.Math.Distance.Between(
    projectile.x,
    projectile.y,
    this.checkpoint.x,
    this.checkpoint.y
  ) < 360
) {
  projectile
    .getData?.('trail')
    ?.destroy?.();

  projectile.destroy?.();
}
        }
      )
);

this.enemies
  ?.getChildren()
  .forEach(
    enemy => {
      if (
        !enemy.active ||
        Math.abs(
          enemy.x -
          this.checkpoint.x
        ) > 180
      ) {
        return;
      }

const route =
  enemy.getData(
    'route'
  );

if (!route) {
  return;
}

const direction =
  enemy.x <
  this.checkpoint.x
    ? -1
    : 1;

      enemy.x =
        Phaser.Math.Clamp(
          this.checkpoint.x +
            direction * 210,
          route.min,
          route.max
        );

    enemy.setData(
  'direction',
  direction
);

enemy.setData(
  'aiState',
  'IDLE'
);

enemy.setData(
  'aiTimer',
  0
);

enemy.setData(
  'alerted',
  false
);

enemy.setData(
  'lastKnownX',
  enemy.x
);

enemy.setData(
  'lastKnownY',
  enemy.y
);

enemy.setData(
  'nextShot',
  this.elapsedMs + 700
);

enemy.body.updateFromGameObject();
    }
  );

if (
  this.loadout.upgrades
    ?.includes(
      'recovery'
    )
) {
  this.energy =
    Math.min(
      this.energyMax,
      this.energy + 20
    );

  this.playerCue(
    'RECOVERY +20 ENERGY',
    '#aee37f'
  );
}

const shield =
  this.add
    .circle(
      this.player.x,
      this.player.y,
      22,
      0x8df4ff,
      .22
    )
    .setDepth(11);

this.tweens.add({
  targets: shield,
  scale: 3.5,
  alpha: 0,
  duration: 900,
  onComplete: () =>
    shield.destroy()
});

this.player.setAlpha(
  .45
);

this.tweens.add({
  targets: this.player,
  alpha: 1,
  duration: 260
});

this.playerCue(
 'SAFE RESET · SHIELD ACTIVE',
  '#b9f5ff'
);

this.physics.resume();

this.respawning = false;

const lost =
  lostSignals +
  lostSecrets;

const label =
  this.add.text(
    this.checkpoint.x,
    this.checkpoint.y - 55,
    lost
      ? `CHECKPOINT · LOST ${lost} PICKUP${
          lost === 1
            ? ''
            : 'S'
        }`
      : 'CHECKPOINT · ROUTE RESET',
    {
      fontFamily: 'DM Mono',
      fontSize: '11px',
      color: '#b9f5ff',
      stroke: '#08101c',
      strokeThickness: 4
    }
  )
    .setOrigin(.5)
    .setDepth(13);

this.tweens.add({
  targets: label,
  y: label.y - 24,
  alpha: 0,
  duration: 900,
  onComplete: () =>
    label.destroy()
});

this.game.events.emit(
  'checkpoint',
  this.collected,
  this.secretsCollected,
  lost
);

}

updateDynamicWaterFX(delta) {
  const graphicsLevel =
    Number.isFinite(this.graphicsLevel)
      ? this.graphicsLevel
      : 2;

  if (
  this.motionReduced ||
  !this.player?.active ||
  !this.player?.body ||
  !this.waterZones
) {
  return;
}

if (this.waterAttackActive) {
  return;
}

this.waterDynamicFxTimer =
  Math.max(
    0,
    (this.waterDynamicFxTimer || 0) -
      delta
  );

const body =
  this.player.body;
  const onGround =
    body?.blocked?.down ||
    body?.touching?.down;

  if (!onGround) {
    this.wetSurfaceActive = false;
    this.wetSurfaceGrip = 1;
    return;
  }

  const wetZone =
    this.waterZones
      .getChildren()
      .find(zone => {
        if (!zone?.active) {
          return false;
        }

        const left =
          zone.x -
          zone.width / 2;

        const right =
          zone.x +
          zone.width / 2;

        const surfaceY =
          zone.y -
          zone.height / 2;

        return (
          this.player.x >= left &&
          this.player.x <= right &&
          Math.abs(
            body.bottom -
            surfaceY
          ) <= 18
        );
      });

  this.wetSurfaceActive =
    Boolean(wetZone);

  this.wetSurfaceGrip =
    this.wetSurfaceActive
      ? 0.28
      : 1;

  // Existing water visual FX
  if (
    this.waterDynamicFxTimer > 0
  ) {
    return;
  }

  const speed =
    Math.abs(
      body.velocity.x || 0
    );

  if (
    !wetZone ||
    speed < 120
  ) {
    return;
  }

  const speedRatio =
    Phaser.Math.Clamp(
      speed /
        RUNNER_TUNING.maxRunSpeed,
      0,
      1
    );

this.triggerPlayerWaterRipple(
  this.player,
  wetZone,
  0.65 +
    speedRatio * 0.65
);

// ============================================================
// WET FOOT SPRAY · SMALL MOVEMENT FEEDBACK
// ============================================================
if (
  graphicsLevel >= 2 &&
  speed > 140 &&
  this.player?.active &&
  this.player?.body
) {
  const direction =
    this.player.body.velocity.x >= 0
      ? 1
      : -1;

  const sprayCount =
    speed > 360
      ? 3
      : 2;

  for (
    let i = 0;
    i < sprayCount;
    i++
  ) {
    const spray =
      this.add
        .circle(
          this.player.x -
            direction *
            Phaser.Math.Between(8, 18),
          this.player.y + 29,
          Phaser.Math.Between(1, 2.5),
          0xb9f5ff,
          Phaser.Math.FloatBetween(
            0.18,
            0.34
          )
        )
        .setDepth(8);

    this.tweens.add({
      targets: spray,
      x:
        spray.x -
        direction *
        Phaser.Math.Between(10, 24),
      y:
        spray.y -
        Phaser.Math.Between(3, 10),
      scale:
        Phaser.Math.FloatBetween(
          1.4,
          2.2
        ),
      alpha: 0,
      duration:
        Phaser.Math.Between(
          150,
          230
        ),
      ease: 'Quad.out',
      onComplete: () => {
        if (spray.active) {
          spray.destroy();
        }
      }
    });
  }

  this.waterDynamicFxTimer =
    Phaser.Math.Linear(
      220,
      85,
      speedRatio
    );
  }
}

  updateRelayPuzzleTimer() {
  const ui =
    this.relayPuzzleUI;

  if (
    !ui?.timer ||
    !this.relayPuzzleActive ||
    ui.solved
  ) {
    return;
  }

const elapsedMs =
  Math.max(
    0,
    this.time.now -
      (
        this.relayPuzzleStartedAt ||
        this.time.now
      )
  );

const elapsedSeconds =
  elapsedMs / 1000;

const displayElapsedSeconds =
  Math.floor(elapsedSeconds);

const minutes =
  String(
    Math.floor(
      displayElapsedSeconds / 60
    )
  ).padStart(2, '0');

const seconds =
  String(
    displayElapsedSeconds % 60
  ).padStart(2, '0');

ui.timer.setText(
  `TIME ${minutes}:${seconds}`
);

const type =
  this.relayPuzzleType ||
  'circuit';

const difficulty =
  Number(
    this.relayPuzzleData?.difficulty ??
    this.relayPuzzleGate?.getData?.('difficulty')
  ) || 1;

const timeLimitS =
  type === 'code'
    ? difficulty >= 3 ? 5.5 : 7
    : type === 'sequence'
      ? difficulty >= 3 ? 7 : 9
      : type === 'tiles'
        ? difficulty >= 3 ? 7 : 9
        : type === 'frequency'
          ? difficulty >= 3 ? 8 : 10
          : type === 'grid'
            ? difficulty >= 3 ? 8 : 10
            : type === 'final'
              ? difficulty >= 3 ? 7 : 9
              : 8;

const warningS =
  timeLimitS * 0.72;

const criticalS =
  timeLimitS;

const timerBand =
  elapsedSeconds >= criticalS
    ? 3
    : elapsedSeconds >= warningS
      ? 2
      : 1;

ui.timer.setColor(
  timerBand === 3
    ? '#ff826e'
    : timerBand === 2
      ? '#ffd06e'
      : '#8df4ff'
);

if (
  timerBand !==
  this.relayPuzzleTimerBand
) {
  this.relayPuzzleTimerBand =
    timerBand;

  if (
    timerBand >= 2
  ) {
    this.tweens.killTweensOf(
      ui.timer
    );

    ui.timer.setScale(1);

    this.tweens.add({
      targets: ui.timer,
      scaleX:
        timerBand === 3
          ? 1.08
          : 1.04,
      scaleY:
        timerBand === 3
          ? 1.08
          : 1.04,
      duration:
        timerBand === 3
          ? 110
          : 140,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  } else {
    this.tweens.killTweensOf(
      ui.timer
    );

    ui.timer.setScale(1);
  }

  if (
    elapsedSeconds >=
      timeLimitS &&
    this.relayPuzzleActive &&
    !this.relayPuzzleUI?.solved
  ) {
    const timeoutSession =
      this.relayPuzzleSession;

    this.relayPuzzleTimerBand =
      3;

    this.relayPuzzleUI?.status
      ?.setText(
        'SECURITY TIMEOUT · RESET'
      )
      .setColor(
        '#ff826e'
      );

    this.time.delayedCall(
      450,
      () => {
        if (
          timeoutSession !==
            this.relayPuzzleSession ||
          !this.relayPuzzleActive ||
          this.relayPuzzleUI?.solved
        ) {
          return;
        }

        this.retryRelayPuzzle();
      }
    );
  }
}
}

// ============================================================
// SIGNAL INTERFERENCE SYSTEM
// Progressive signal corruption.
// Visual only — never changes actual world coordinates.
// ============================================================

getSignalInterferenceLevel() {
  const totalSignals =
    Math.max(
      1,
      this.mission?.signals?.length || 1
    );

  const collected =
    Phaser.Math.Clamp(
      this.collected || 0,
      0,
      totalSignals
    );

  return Phaser.Math.Clamp(
    collected / totalSignals,
    0,
    1
  );
}

getSignalInterferenceTier(level) {
  if (level >= 0.999) return 4;
  if (level >= 0.72) return 3;
  if (level >= 0.48) return 2;
  if (level >= 0.25) return 1;
  return 0;
}

  updateSignalInterferenceHUD() {
  if (
    !this.signalHUD ||
    !this.signalHUD.active
  ) {
    return;
  }

  const level =
    Phaser.Math.Clamp(
      this.signalInterference || 0,
      0,
      1
    );

  const tier =
    this.signalInterferenceTier ?? 0;

  const percent =
    Math.round(level * 100);

  const status =
    tier >= 4
      ? 'OVERRIDE'
      : tier >= 3
        ? 'CRITICAL'
        : tier >= 2
          ? 'DESYNC'
          : tier >= 1
            ? 'NOISE'
            : 'STABLE';

  const color =
    tier >= 4
      ? '#ffe0a8'
      : tier >= 3
        ? '#e0a7ff'
        : tier >= 2
          ? '#b993ff'
          : tier >= 1
            ? '#8df4ff'
            : '#8ba0b8';

  if (this.signalHUD.percentText) {
    this.signalHUD.percentText.setText(
      `${percent}%`
    );
  }

  if (this.signalHUD.statusText) {
    this.signalHUD.statusText
      .setText(status)
      .setColor(color);
  }

  if (this.signalHUD.fill) {
    this.signalHUD.fill.setDisplaySize(
      Math.max(
        2,
        this.signalHUD.maxWidth * level
      ),
      this.signalHUD.height
    );
  }

  if (
    tier >= 3 &&
    !this.motionReduced
  ) {
    const pulse =
      0.5 +
      Math.sin(
        this.time.now / 110
      ) * 0.5;

    this.signalHUD.fill.setAlpha(
      0.65 + pulse * 0.35
    );
  } else {
    this.signalHUD.fill.setAlpha(1);
  }
}
  
ensureSignalInterferenceFX() {
  if (
    this.signalInterferenceObjects ||
    !this.add
  ) {
    return;
  }

  const width =
    this.scale.width;

  const height =
    this.scale.height;

  const overlay =
    this.add
      .rectangle(
        width / 2,
        height / 2,
        width,
        height,
        0x7b4dff,
        0
      )
      .setScrollFactor(0)
      .setDepth(950);

  const scanlines = [];

  for (
    let i = 0;
    i < 7;
    i++
  ) {
    const line =
      this.add
        .rectangle(
          0,
          0,
          width,
          i % 2 === 0 ? 2 : 1,
          0xe0a7ff,
          0
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(951);

    scanlines.push(line);
  }

  const ghostA =
    this.add
      .rectangle(
        width / 2,
        height / 2,
        width * 0.72,
        height,
        0xb993ff,
        0
      )
      .setScrollFactor(0)
      .setDepth(949);

  const ghostB =
    this.add
      .rectangle(
        width / 2,
        height / 2,
        width * 0.72,
        height,
        0x8df4ff,
        0
      )
      .setScrollFactor(0)
      .setDepth(948);

  this.signalInterferenceObjects = {
    overlay,
    scanlines,
    ghostA,
    ghostB
  };

  this.events.once(
    Phaser.Scenes.Events.SHUTDOWN,
    () => {
      this.signalInterferenceObjects = null;
    }
  );
}

triggerSignalInterferenceBurst(tier) {
  if (
    this.motionReduced ||
    !this.cameras?.main
  ) {
    return;
  }

  const camera =
    this.cameras.main;

  const burstColor =
    tier >= 4
      ? 0xffe0a8
      : tier >= 3
        ? 0xe0a7ff
        : tier >= 2
          ? 0xb993ff
          : 0x8df4ff;

  camera.flash(
    tier >= 4 ? 180 : 90,
    (burstColor >> 16) & 255,
    (burstColor >> 8) & 255,
    burstColor & 255
  );

  if (
    tier >= 3 &&
    this.screenShake
  ) {
    this.shake(
      90,
      tier >= 4
        ? 0.0028
        : 0.0016
    );
  }

  this.gadgetPulse(
    burstColor,
    tier >= 4 ? 18 : 10,
    tier >= 4 ? 520 : 300
  );
}

triggerSignalOverride() {
  if (
    this.signalOverrideTriggered
  ) {
    return;
  }

  this.signalOverrideTriggered =
    true;

  this.signalInterferencePulse =
    1100;

  this.playerCue(
    'SIGNAL OVERRIDE',
    '#e0a7ff'
  );

  this.game.events.emit(
    'feedback',
    'signal_override'
  );

  this.triggerSignalInterferenceBurst(
    4
  );

  if (
    this.motionReduced
  ) {
    return;
  }

  const width =
    this.scale.width;

  const height =
    this.scale.height;

  const shock =
    this.add
      .rectangle(
        width / 2,
        height / 2,
        width,
        height,
        0xe0a7ff,
        0.16
      )
      .setScrollFactor(0)
      .setDepth(952);

  this.tweens.add({
    targets: shock,
    alpha: 0,
    duration: 520,
    ease: 'Quad.out',
    onComplete: () => {
      if (shock?.active) {
        shock.destroy();
      }
    }
  });

  this.tweens.add({
    targets: this.player,
    scaleX:
      this.playerVisualBaseScaleX *
      1.08,
    scaleY:
      this.playerVisualBaseScaleY *
      0.94,
    duration: 100,
    yoyo: true,
    ease: 'Quad.out'
  });

  // Full sync reveal.
  this.time.delayedCall(
    620,
    () => {
      if (
        !this.scene?.isActive?.()
      ) {
        return;
      }

      this.signalInterferencePulse = 0;

      if (
        this.signalInterferenceObjects
      ) {
        const {
          overlay,
          ghostA,
          ghostB
        } =
          this.signalInterferenceObjects;

        overlay.setAlpha(0);

        ghostA.setAlpha(0);
        ghostB.setAlpha(0);
      }

      this.playerCue(
        'SIGNAL SYNC COMPLETE',
        '#8df4ff'
      );

      this.game.events.emit(
        'feedback',
        'signal_sync'
      );
    }
  );
}

applySignalInterferenceVisuals(
  level,
  tier,
  delta
) {
  this.ensureSignalInterferenceFX();

  const fx =
    this.signalInterferenceObjects;

  if (!fx) {
    return;
  }

  const width =
    this.scale.width;

  const height =
    this.scale.height;

  fx.overlay.setPosition(
    width / 2,
    height / 2
  );

  fx.overlay.setSize(
    width,
    height
  );

  fx.ghostA.setPosition(
    width / 2 +
      Math.sin(
        this.time.now * 0.0031
      ) *
        (4 + level * 12),
    height / 2
  );

  fx.ghostB.setPosition(
    width / 2 +
      Math.cos(
        this.time.now * 0.0027
      ) *
        (3 + level * 9),
    height / 2
  );

  const overlayAlpha =
    tier === 0
      ? 0
      : tier === 1
        ? 0.018
        : tier === 2
          ? 0.035
          : tier === 3
            ? 0.065
            : 0.018;

  fx.overlay
    .setFillStyle(
      tier >= 3
        ? 0xb993ff
        : 0x8df4ff,
      overlayAlpha
    );

  fx.ghostA.setAlpha(
    tier >= 3
      ? 0.018 + level * 0.03
      : 0
  );

  fx.ghostB.setAlpha(
    tier >= 2
      ? 0.012 + level * 0.02
      : 0
  );

  const lineAlpha =
    tier === 0
      ? 0
      : 0.025 +
        level * 0.075;

  fx.scanlines.forEach(
    (line, index) => {
      const y =
        (
          (
            this.time.now *
              (0.06 + level * 0.16)
          ) +
          index *
            (height / 7)
        ) %
        height;

      line.setPosition(
        width / 2,
        y
      );

      line.setSize(
        width,
        index % 2 === 0
          ? 2
          : 1
      );

      line.setAlpha(
        index % 2 === 0
          ? lineAlpha
          : lineAlpha * 0.45
      );
    }
  );

  // Never touch actual signal coordinates.
  if (this.signals) {
    this.signals
      .getChildren()
      .forEach(
        signal => {
          if (!signal.active) {
            return;
          }

          if (tier === 0) {
            signal.clearTint();
            return;
          }

          signal.setTint(
            tier >= 3
              ? 0xb993ff
              : tier >= 2
                ? 0xd1bcff
                : 0x8df4ff
          );
        }
      );
  }

  this.signalInterferenceJitter =
    Phaser.Math.Linear(
      0,
      tier >= 3 ? 3.5 : 1.5,
      level
    );

  if (
    tier >= 2 &&
    this.signalInterferenceJitter >
      0
  ) {
    const jitter =
      Phaser.Math.Between(
        -this.signalInterferenceJitter,
        this.signalInterferenceJitter
      );

    // Visual pulse only. No world movement.
    if (
      this.player?.active &&
      Math.abs(jitter) > 0
    ) {
      this.player.setAngle(
        Phaser.Math.Clamp(
          jitter,
          -2.5,
          2.5
        )
      );
    }
  } else if (
    this.player?.active
  ) {
   this.player.setAngle(
  this.playerBaseAngle || 0
);
  }

  // ============================================================
  // MICRO GLITCH / RADIO STATIC
  // ============================================================
  if (
    tier >= 2 &&
    !this.motionReduced &&
    Math.random() <
      delta *
        (0.00045 +
          level * 0.0011)
  ) {
    const glitch =
      this.add
        .rectangle(
          Phaser.Math.Between(
            0,
            this.scale.width
          ),
          Phaser.Math.Between(
            0,
            this.scale.height
          ),
          Phaser.Math.Between(
            30,
            180
          ),
          Phaser.Math.Between(
            1,
            4
          ),
          tier >= 3
            ? 0xe0a7ff
            : 0x8df4ff,
          0.18
        )
        .setScrollFactor(0)
        .setDepth(953);

    this.tweens.add({
      targets: glitch,
      alpha: 0,
      duration: Phaser.Math.Between(
        45,
        100
      ),
      onComplete: () => {
        if (glitch?.active) {
          glitch.destroy();
        }
      }
    });
  }

}

  // ============================================================
// SIGNAL INTERFERENCE · FAKE SIGNAL ECHO
// Visual decoy only — never changes real signal coordinates.
// ============================================================

spawnSignalGhostEcho() {
  if (
    this.motionReduced ||
    !this.signals ||
    !this.player?.active
  ) {
    return;
  }

  const activeSignals =
    this.signals
      .getChildren()
      .filter(
        signal =>
          signal.active
      );

  if (!activeSignals.length) {
    return;
  }

  const realSignal =
    Phaser.Utils.Array.GetRandom(
      activeSignals
    );

  const angle =
    Phaser.Math.FloatBetween(
      0,
      Math.PI * 2
    );

  const distance =
    Phaser.Math.Between(
      140,
      300
    );

  const ghostX =
    realSignal.x +
    Math.cos(angle) *
      distance;

  const ghostY =
    realSignal.y +
    Math.sin(angle) *
      distance;

  const ghost =
    this.add
      .circle(
        ghostX,
        ghostY,
        15,
        0xb993ff,
        0.16
      )
      .setScrollFactor(1)
      .setDepth(10);

  ghost.setStrokeStyle(
    2,
    0xe0a7ff,
    0.78
  );

  const inner =
    this.add
      .circle(
        ghostX,
        ghostY,
        5,
        0xe0a7ff,
        0.55
      )
      .setScrollFactor(1)
      .setDepth(11);

  this.tweens.add({
    targets: ghost,
    scale: 2.4,
    alpha: 0,
    duration: 520,
    ease: 'Quad.out',
    onComplete: () => {
      if (ghost?.active) {
        ghost.destroy();
      }
    }
  });

  this.tweens.add({
    targets: inner,
    scale: 1.8,
    alpha: 0,
    duration: 420,
    ease: 'Quad.out',
    onComplete: () => {
      if (inner?.active) {
        inner.destroy();
      }
    }
  });
}

  updateSignalInterferenceEnemyFX(delta) {
  if (
    !this.enemies ||
    this.motionReduced
  ) {
    return;
  }

  const level =
    this.getSignalInterferenceLevel();

  const tier =
    this.getSignalInterferenceTier(
      level
    );

  if (tier <= 0) {
    return;
  }

  const now =
    this.time.now;

  this.enemies
    .getChildren()
    .forEach(enemy => {
      if (!enemy?.active) {
        return;
      }

      const indicator =
        enemy.getData(
          'indicator'
        );

      if (!indicator?.active) {
        return;
      }

      const pulse =
        0.5 +
        Math.sin(
          now /
            (
              tier >= 3
                ? 85
                : tier >= 2
                  ? 120
                  : 170
            )
        ) *
        0.5;

      const baseAlpha =
        Phaser.Math.Linear(
          0.18,
          0.42,
          level
        );

      const flicker =
        tier >= 3
          ? pulse
          : 0.35 + pulse * 0.35;

      indicator.setAlpha(
        Phaser.Math.Clamp(
          baseAlpha +
            flicker * 0.22,
          0.08,
          0.72
        )
      );

      indicator.setScale(
        Phaser.Math.Linear(
          1.0,
          tier >= 4
            ? 1.5
            : tier >= 3
              ? 1.28
              : 1.12,
          pulse
        )
      );

      const color =
        tier >= 4
          ? 0xffe0a8
          : tier >= 3
            ? 0xe0a7ff
            : tier >= 2
              ? 0xb993ff
              : 0x8df4ff;

      indicator.setStrokeStyle(
        tier >= 3 ? 1.8 : 1.2,
        color,
        tier >= 3
          ? 0.95
          : 0.72
      );
    });
}

updateSignalInterference(delta) {
  if (
    this.finished ||
    this.respawning ||
    this.cinematicActive ||
    this.relayPuzzleActive
  ) {
    return;
  }

  const level =
    this.getSignalInterferenceLevel();

  const tier =
    this.getSignalInterferenceTier(
      level
    );

  const previousTier =
    this.signalInterferenceTier;

  this.signalInterference =
    level;

  this.signalInterferenceTier =
    tier;

  this.applySignalInterferenceVisuals(
    level,
    tier,
    delta
  );

  this.updateSignalInterferenceHUD();
  
  // ------------------------------------------------------------
// PERIODIC FAKE SIGNAL ECHO
// Only appears once interference is meaningful.
// ------------------------------------------------------------
if (
  tier >= 2 &&
  !this.signalOverrideTriggered
) {
  this.signalGhostTimer =
    Math.max(
      0,
      (this.signalGhostTimer || 0) -
        delta
    );

  if (
    this.signalGhostTimer <= 0
  ) {
    this.spawnSignalGhostEcho();

    this.signalGhostTimer =
      tier >= 3
        ? 900
        : 1450;
  }
} else {
  this.signalGhostTimer = 0;
}

if (
  tier > previousTier &&
  previousTier >= 0
) {
  this.triggerSignalInterferenceBurst(
    tier
  );
if (tier === 1) {
  this.playerCue(
    'SIGNAL NOISE DETECTED',
    '#8df4ff'
  );
}

if (tier === 2) {
  this.playerCue(
    'MAP DESYNC',
    '#b993ff'
  );

  this.game.events.emit(
    'tutorial',
    'NAVIGATION SIGNALS UNSTABLE'
  );
}

if (tier === 3) {
  this.playerCue(
    'CRITICAL SIGNAL',
    '#e0a7ff'
  );

  this.game.events.emit(
    'tutorial',
    'SIGNAL ECHOES DETECTED'
  );
}
  }

  if (
    tier >= 4 &&
    !this.signalOverrideTriggered
  ) {
    this.triggerSignalOverride();
  }
}

// ============================================================
// AFK / CRYOSTASIS SYSTEM
// ============================================================
updateAfkSystem(delta) {
  if (
    !this.player?.active ||
    !this.player?.body ||
    this.finished ||
    this.respawning ||
    this.cinematicActive ||
    this.relayPuzzleActive
  ) {
    return;
  }

  const body =
    this.player.body;

  const speed =
    Math.abs(body.velocity?.x || 0) +
    Math.abs(body.velocity?.y || 0);

  const rawKeyboard =
    this.rawKeyboardState ||
    {};

  const keyboardMovement =
    Boolean(
      this.cursors?.left?.isDown ||
      this.cursors?.right?.isDown ||
      this.cursors?.up?.isDown ||
      this.cursors?.down?.isDown ||
      this.keys?.A?.isDown ||
      this.keys?.D?.isDown ||
      this.keys?.W?.isDown ||
      this.keys?.S?.isDown ||
      rawKeyboard.KeyA ||
      rawKeyboard.KeyD ||
      rawKeyboard.KeyW ||
      rawKeyboard.KeyS
    );

  const keyboardAction =
    Boolean(
      this.keys?.SPACE?.isDown ||
      this.keys?.SHIFT?.isDown ||
      this.keys?.E?.isDown ||
      this.keys?.F?.isDown ||
      this.keys?.Q?.isDown ||
      this.keys?.R?.isDown ||
      this.keys?.X?.isDown ||
      rawKeyboard.Space ||
      rawKeyboard.ShiftLeft ||
      rawKeyboard.ShiftRight ||
      rawKeyboard.KeyE ||
      rawKeyboard.KeyF
    );

  const mobileMovement =
    this.mobileDirection === 'left' ||
    this.mobileDirection === 'right';

  const playerMoving =
    speed > 18;

  const active =
    keyboardMovement ||
    keyboardAction ||
    mobileMovement ||
    playerMoving;

  if (active) {
    this.afkTimer = 0;

    if (this.afkStage !== 0) {
      this.clearAfkState();
    }

    return;
  }

  this.afkTimer += delta;

  let nextStage = 0;

  if (
    this.afkTimer >= 12000
  ) {
    nextStage = 3;
  } else if (
    this.afkTimer >= 8000
  ) {
    nextStage = 2;
  } else if (
    this.afkTimer >= 4000
  ) {
    nextStage = 1;
  }

  if (
    nextStage === this.afkStage
  ) {
    if (
      this.afkStage > 0
    ) {
      this.updateAfkFx();
    }

    return;
  }

this.afkStage =
  nextStage;

// ------------------------------------------------------------
// AFK STATUS HUD
// ------------------------------------------------------------
if (
  this.afkStage > 0 &&
  !this.afkStatusText &&
  this.player?.active
) {
  this.afkStatusText =
    this.add
      .text(
        this.player.x,
        this.player.y - 58,
        '',
        {
          fontFamily: 'DM Mono',
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#b9f5ff',
          stroke: '#07111d',
          strokeThickness: 5,
          letterSpacing: 2,
          shadow: {
            offsetX: 0,
            offsetY: 0,
            color: '#8df4ff',
            blur: 12,
            fill: true
          }
        }
      )
      .setOrigin(0.5)
      .setDepth(40);
}

if (this.afkStatusText) {
  const statusMap = {
    1: 'IDLE',
    2: 'FROST',
    3: 'CRYOSTASIS'
  };

  const colorMap = {
    1: '#b9f5ff',
    2: '#dffcff',
    3: '#8df4ff'
  };

  this.afkStatusText.setText(
    statusMap[this.afkStage] || ''
  );

  this.afkStatusText.setColor(
    colorMap[this.afkStage] || '#b9f5ff'
  );
}

// ------------------------------------------------------------
// CRYOSTASIS · REAL GAMEPLAY FREEZE
// ------------------------------------------------------------
if (
  this.afkStage === 3 &&
  !this.afkCryostasisActive &&
  this.player?.body
) {
  const body = this.player.body;

  this.afkCryostasisActive = true;

  this.afkCryoPreviousMoves =
    body.moves !== false;

  this.afkCryoPreviousAllowGravity =
    body.allowGravity !== false;

  body.setVelocity(
    0,
    0
  );

  body.setAcceleration(
    0,
    0
  );

  body.setAllowGravity(
    false
  );

  body.moves = false;
}

// ------------------------------------------------------------
// NORMAL
// ------------------------------------------------------------
  if (
    this.afkStage === 0
  ) {
    this.clearAfkState();
    return;
  }

if (
  !this.afkFreezeFx
) {
  this.afkFreezeFx = {
    aura: null,
    ring: null,
    core: null
  };
}

const graphicsLevel =
  Number.isFinite(
    this.graphicsLevel
  )
    ? this.graphicsLevel
    : 2;

const afkParticlesAllowed =
  graphicsLevel >= 1;

if (
  afkParticlesAllowed &&
  this.afkStage >= 2 &&
  Array.isArray(this.afkIceParticles) &&
  this.afkIceParticles.length === 0
) {
  for (
    let i = 0;
    i < 6;
    i++
  ) {
    const particle =
      this.add
        .text(
          this.player.x,
          this.player.y,
          '✦',
          {
            fontFamily: 'Arial',
            fontSize: '10px',
            color: '#dffcff',
            stroke: '#58e7ff',
            strokeThickness: 2
          }
        )
        .setOrigin(0.5)
        .setAlpha(0)
        .setDepth(14);

    particle.setData(
      'afkIndex',
      i
    );

    this.afkIceParticles.push(
      particle
    );
  }
}

  // ------------------------------------------------------------
  // STAGE 1 · IDLE
  // ------------------------------------------------------------
  if (
    this.afkStage === 1
  ) {
    if (
      !this.afkFreezeFx.aura
    ) {
      this.afkFreezeFx.aura =
        this.add
          .circle(
            this.player.x,
            this.player.y,
            28,
            0xb9f5ff,
            0.045
          )
          .setDepth(10);
    }

    this.tweens.killTweensOf(
      this.afkFreezeFx.aura
    );

    this.tweens.add({
      targets:
        this.afkFreezeFx.aura,
      scale: 1.14,
      alpha: 0.10,
      duration: 850,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });

this.playerCue(
  'IDLE STATE DETECTED',
  '#b9f5ff'
);

this.speakNarration(
  'IDLE STATE DETECTED'
);

this.game.events.emit(
  'player-afk-warning',
  {
    stage: 1,
    elapsed: this.afkTimer
  }
);

return;
  }

  // ------------------------------------------------------------
  // STAGE 2 · FROST
  // ------------------------------------------------------------
  if (
    this.afkStage === 2
  ) {
    if (
      !this.afkFreezeFx.ring
    ) {
      this.afkFreezeFx.ring =
        this.add
          .circle(
            this.player.x,
            this.player.y + 8,
            18,
            0xb9f5ff,
            0.035
          )
          .setStrokeStyle(
            2,
            0xe8fdff,
            0.62
          )
          .setDepth(12);
    }

    this.tweens.killTweensOf(
      this.afkFreezeFx.ring
    );

    this.tweens.add({
      targets:
        this.afkFreezeFx.ring,
      scale: 1.45,
      alpha: 0.02,
      duration: 950,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });

this.playerCue(
  'FROST BUILDUP',
  '#b9f5ff'
);

this.speakNarration(
  'FROST BUILDUP'
);

this.game.events.emit(
  'player-afk',
  {
    stage: 2,
    elapsed: this.afkTimer
  }
);

return;
  }

  // ------------------------------------------------------------
  // STAGE 3 · CRYOSTASIS
  // ------------------------------------------------------------
  if (
    !this.afkFreezeFx.core
  ) {
    this.afkFreezeFx.core =
      this.add
        .circle(
          this.player.x,
          this.player.y,
          11,
          0xe8fdff,
          0.07
        )
        .setStrokeStyle(
          2,
          0xb9f5ff,
          0.82
        )
        .setDepth(13);
  }

  this.tweens.killTweensOf(
    this.afkFreezeFx.core
  );

this.tweens.add({
  targets:
    this.afkFreezeFx.core,
  scale: 1.55,
  alpha: 0.015,
  duration: 1050,
  yoyo: true,
  repeat: -1,
  ease: 'Sine.inOut'
});

// ------------------------------------------------------------
// CRYOSTASIS DEEP FREEZE FX
// ------------------------------------------------------------
if (
  !this.afkCryoFx
) {
  this.afkCryoFx = {
    outer:
      this.add
        .circle(
          this.player.x,
          this.player.y,
          34,
          0xb9f5ff,
          0.035
        )
        .setStrokeStyle(
          2,
          0xe8fdff,
          0.72
        )
        .setDepth(11),

    inner:
      this.add
        .circle(
          this.player.x,
          this.player.y,
          16,
          0xe8fdff,
          0.055
        )
        .setStrokeStyle(
          1.5,
          0xb9f5ff,
          0.90
        )
        .setDepth(13)
   };
}

// ------------------------------------------------------------
// CRYOSTASIS · ICE SHARDS
// Quality-gated visual shards around the player.
// ------------------------------------------------------------
if (
  graphicsLevel >= 2 &&
  Array.isArray(this.afkCryoShards) &&
  this.afkCryoShards.length === 0
) {
  for (let i = 0; i < 8; i++) {
    const shard =
      this.add
        .triangle(
          this.player.x,
          this.player.y,
          0,
          -8,
          6,
          5,
          -6,
          5,
          0xe8fdff,
          0.18
        )
        .setStrokeStyle(
          1,
          0x8df4ff,
          0.75
        )
        .setDepth(14);

    shard.setData(
      'afkShardIndex',
      i
    );

    this.afkCryoShards.push(
      shard
    );
  }
}

this.tweens.killTweensOf(
  this.afkCryoFx.outer
);

this.tweens.killTweensOf(
  this.afkCryoFx.inner
);

this.tweens.add({
  targets:
    this.afkCryoFx.outer,
  scale: 1.32,
  alpha: 0.01,
  duration: 1200,
  yoyo: true,
  repeat: -1,
  ease: 'Sine.inOut'
});

this.tweens.add({
  targets:
    this.afkCryoFx.inner,
  scale: 0.72,
  alpha: 0.10,
  duration: 760,
  yoyo: true,
  repeat: -1,
  ease: 'Sine.inOut'
});

// ------------------------------------------------------------
// ULTRA · CRYOSTASIS IMPACT PULSE
// One-shot visual burst when deep freeze engages.
// Gameplay is untouched.
// ------------------------------------------------------------
if (
  graphicsLevel >= 3 &&
  !this.motionReduced &&
  !this.afkCryoTriggered
) {
  this.afkCryoTriggered = true;

  this.cameras.main.flash(
    180,
    205,
    248,
    255
  );

  this.shake(
    120,
    0.004
  );

  const cryoPulse =
    this.add
      .circle(
        this.player.x,
        this.player.y,
        22,
        0xdffcff,
        0.18
      )
      .setStrokeStyle(
        3,
        0x8df4ff,
        0.95
      )
      .setDepth(15);

  this.tweens.add({
    targets:
      cryoPulse,
    scale: 4.8,
    alpha: 0,
    duration: 620,
    ease: 'Cubic.out',
    onComplete: () => {
      if (
        cryoPulse?.active
      ) {
        cryoPulse.destroy();
      }
    }
  });
}

this.playerCue(
  'CRYOSTASIS ENGAGED',
  '#b9f5ff'
);

this.speakNarration(
  'CRYOSTASIS ENGAGED'
);

this.game.events.emit(
  'player-cryostasis',
  {
    stage: 3,
    elapsed: this.afkTimer
  }
);

  this.updateAfkFx();
}

// ============================================================
// AFK FX FOLLOW PLAYER
// ============================================================
updateAfkFx() {
  if (
    !this.afkFreezeFx ||
    !this.player?.active
  ) {
    return;
  }

 const now =
  this.time.now * 0.001;

// ------------------------------------------------------------
// AFK STATUS FOLLOW
// ------------------------------------------------------------
if (
  this.afkStatusText?.active &&
  this.player?.active
) {
  this.afkStatusText.x =
    this.player.x;

  this.afkStatusText.y =
    this.player.y - 58;

  this.afkStatusText.setAlpha(
    0.72 +
    Math.sin(now * 4) * 0.16
  );

  this.afkStatusText.setScale(
    0.96 +
    Math.sin(now * 3.2) * 0.04
  );
}

const graphicsLevel =
  Number.isFinite(
    this.graphicsLevel
  )
    ? this.graphicsLevel
    : 2;

if (
  Array.isArray(
    this.afkIceParticles
  ) &&
  this.afkStage >= 2 &&
  graphicsLevel >= 1
) {
    this.afkIceParticles.forEach(
      particle => {
        if (!particle?.active) {
          return;
        }

        const index =
          Number(
            particle.getData(
              'afkIndex'
            )
          ) || 0;

        const angle =
          now * (0.7 + index * 0.05) +
          index * 1.047;

        const radius =
          24 +
          Math.sin(
            now * 1.8 + index
          ) * 5;

        particle.x =
          this.player.x +
          Math.cos(angle) * radius;

        particle.y =
          this.player.y +
          Math.sin(angle) * radius -
          8;

        particle.setAlpha(
          0.28 +
          (
            Math.sin(
              now * 3 +
              index
            ) + 1
          ) * 0.18
        );

        particle.setScale(
          0.75 +
          (
            Math.sin(
              now * 2.4 +
              index
            ) + 1
          ) * 0.15
        );
      }
    );
  }
if (
  Array.isArray(
    this.afkIceParticles
  )
) {
  const particlesEnabled =
    graphicsLevel >= 1;

  this.afkIceParticles.forEach(
    particle => {
      if (!particle?.active) {
        return;
      }

      particle.setVisible(
        particlesEnabled
      );

      if (!particlesEnabled) {
        particle.setAlpha(0);
      }
    }
  );
}
  // ------------------------------------------------------------
// CRYOSTASIS · ICE SHARD FOLLOW / ORBIT
// ------------------------------------------------------------
if (
  Array.isArray(
    this.afkCryoShards
  ) &&
  this.afkStage >= 3
) {
  this.afkCryoShards.forEach(
    shard => {
      if (!shard?.active) {
        return;
      }

      const index =
        Number(
          shard.getData(
            'afkShardIndex'
          )
        ) || 0;

      const angle =
        now * 0.32 +
        index * (Math.PI * 2 / 8);

      const radius =
        38 +
        Math.sin(
          now * 1.7 + index
        ) * 4;

      shard.x =
        this.player.x +
        Math.cos(angle) * radius;

      shard.y =
        this.player.y +
        Math.sin(angle) * radius -
        4;

      shard.rotation =
        angle + Math.PI / 2;

      shard.setAlpha(
        0.10 +
        (
          Math.sin(
            now * 2.6 + index
          ) + 1
        ) * 0.10
      );

      shard.setScale(
        0.82 +
        (
          Math.sin(
            now * 2.1 + index
          ) + 1
        ) * 0.10
      );
    }
  );
}
  
  const {
    aura,
    ring,
    core
  } = this.afkFreezeFx;

  if (
    aura?.active
  ) {
    aura.x =
      this.player.x;

    aura.y =
      this.player.y;
  }

  if (
    ring?.active
  ) {
    ring.x =
      this.player.x;

    ring.y =
      this.player.y + 8;
  }

  if (
    core?.active
  ) {
    core.x =
      this.player.x;

    core.y =
      this.player.y;
  }
  if (
  this.afkCryoFx
) {
  if (
    this.afkCryoFx.outer?.active
  ) {
    this.afkCryoFx.outer.x =
      this.player.x;

    this.afkCryoFx.outer.y =
      this.player.y;
  }

  if (
    this.afkCryoFx.inner?.active
  ) {
    this.afkCryoFx.inner.x =
      this.player.x;

    this.afkCryoFx.inner.y =
      this.player.y;
  }
}
}

// ============================================================
// AFK CLEAR
// ============================================================
clearAfkState() {
  // ------------------------------------------------------------
  // CRYOSTASIS · UNFREEZE BURST
  // ------------------------------------------------------------
  if (
    this.afkCryostasisActive &&
    this.player?.active
  ) {
    const burst =
      this.add
        .circle(
          this.player.x,
          this.player.y,
          10,
          0xe8fdff,
          0.16
        )
        .setStrokeStyle(
          2,
          0x8df4ff,
          0.95
        )
        .setDepth(16);

    this.tweens.add({
      targets: burst,
      scale: 4.6,
      alpha: 0,
      duration: 420,
      ease: 'Cubic.out',
      onComplete: () => {
        if (burst?.active) {
          burst.destroy();
        }
      }
    });

    this.cameras.main.flash(
      90,
      220,
      250,
      255
    );
  }

  // ------------------------------------------------------------
  // CRYOSTASIS · RESTORE PLAYER PHYSICS
  // ------------------------------------------------------------
  if (
    this.afkCryostasisActive &&
    this.player?.body
  ) {
    const body = this.player.body;

    body.moves =
      this.afkCryoPreviousMoves;

    body.setAllowGravity(
      this.afkCryoPreviousAllowGravity
    );

    body.setAcceleration(
      0,
      0
    );

    this.afkCryostasisActive = false;
  }

  this.afkTimer = 0;
  this.afkStage = 0;

  if (
    this.afkFreezeFx
  ) {
    Object.values(
      this.afkFreezeFx
    ).forEach(
      object => {
        if (!object) {
          return;
        }

        this.tweens.killTweensOf(
          object
        );

        if (
          object.active
        ) {
          object.destroy();
        }
      }
    );
  }

this.afkFreezeFx = null;

if (
  Array.isArray(
    this.afkIceParticles
  )
) {
  this.afkIceParticles.forEach(
    particle => {
      if (!particle) {
        return;
      }

      this.tweens.killTweensOf(
        particle
      );

      if (particle.active) {
        particle.destroy();
      }
    }
  );

  this.afkIceParticles = [];
}
  if (
  this.afkCryoFx
) {
  Object.values(
    this.afkCryoFx
  ).forEach(
    object => {
      if (!object) {
        return;
      }

      this.tweens.killTweensOf(
        object
      );

      if (
        object.active
      ) {
        object.destroy();
      }
    }
  );
}

if (
  Array.isArray(
    this.afkCryoShards
  )
) {
  this.afkCryoShards.forEach(
    shard => {
      if (!shard) {
        return;
      }

      this.tweens.killTweensOf(
        shard
      );

      if (shard.active) {
        shard.destroy();
      }
    }
  );

this.afkCryoShards = [];
}

if (
  this.afkStatusText
) {
  this.tweens.killTweensOf(
    this.afkStatusText
  );

  if (
    this.afkStatusText.active
  ) {
    this.afkStatusText.destroy();
  }

  this.afkStatusText = null;
}

this.afkCryoFx = null;
this.afkCryoTriggered = false;

this.game.events.emit(
  'player-afk-cleared'
);
  }

update(_, delta) {
  delta = Phaser.Math.Clamp(
    Number(delta) || 0,
    0,
    50
  );

  if (
    !this.scene.isActive() ||
    !this.player?.active
  ) {
    return;
  }

  if (
    this.finished ||
    this.respawning ||
    this.cinematicActive ||
    !this.player?.active
  ) {
    return;
  }

// ============================================================
// AFK / CRYOSTASIS
// ============================================================
this.updateAfkSystem(delta);

// CRYOSTASIS owns the player until input clears AFK.
if (
  this.afkCryostasisActive
) {
  if (this.player?.body) {
    this.player.body.setVelocity(
      0,
      0
    );

    this.player.body.setAcceleration(
      0,
      0
    );
  }

  return;
}

if (
  this.physics?.world?.isPaused &&
    !this.relayPuzzleActive &&
    !this.finished &&
    !this.respawning &&
    !this.cinematicActive
  ) {
    this.physics.resume();
  }

  // ============================================================
  // POLARITY CORE · CONTINUOUS UPDATE
  // ============================================================
  
  this.updatePolarity(delta);
  
// ============================================================
// DIZZY STARS · FOLLOW PLAYER HEAD
// ============================================================
  
if (
  this.dizzyStars?.active
) {
  this.dizzyStars.x =
    this.player.x;

  this.dizzyStars.y =
    this.player.y -
    42;

  const children =
    this.dizzyStars.list || [];

  const now =
    this.time.now * 0.0045;

  children.forEach(
    star => {
      const orbitRadius =
        Number(
          star.getData(
            'orbitRadius'
          )
        ) || 20;

      const orbitAngle =
        Number(
          star.getData(
            'orbitAngle'
          )
        ) || 0;

      const spin =
        Number(
          star.getData(
            'spin'
          )
        ) || 1;

      const index =
        Number(
          star.getData(
            'orbitIndex'
          )
        ) || 0;

    const angle =
  orbitAngle +
  now *
    spin;

const bobPhase =
  orbitAngle +
  index * 0.75;

const horizontalRadius =
  orbitRadius +
  index * 1.8;

const verticalRadius =
  7 +
  Math.sin(
    now * 1.35 +
    bobPhase
  ) * 2.5;

star.x =
  Math.cos(angle) *
  horizontalRadius;

star.y =
  Math.sin(angle) *
    verticalRadius +
  Math.sin(
    now * 0.9 +
    bobPhase
  ) * 1.5;

const pulsePhase =
  now * 1.8 +
  orbitAngle +
  index * 0.9;

const pulse =
  1 +
  Math.sin(pulsePhase) * 0.12;

const shimmer =
  0.82 +
  (
    Math.sin(
      now * 2.4 +
      index * 1.7
    ) + 1
  ) * 0.09;

star.scale =
  pulse;

star.alpha =
  shimmer;

star.rotation =
  now *
    spin *
    0.72;
    }
  );
}

this.dizzyStarsTimer =
  Math.max(
    0,
    (this.dizzyStarsTimer || 0) -
      delta
  );

if (
  this.dizzyStars?.active &&
  this.dizzyStarsTimer <= 0
) {
  this.dizzyStarsSerial++;

  this.dizzyStars.destroy(true);
  this.dizzyStars = null;

  this.dizzyStarsIntensity = 0;
}
this.updateDynamicWaterFX(delta);

// ============================================================
// CAMERA MODE · C = THIRD PERSON / FIRST PERSON
// ============================================================
if (
  Phaser.Input.Keyboard.JustDown(
    this.keys.C
  )
) {
  this.firstPersonCamera =
    !this.firstPersonCamera;

  if (
    this.player?.active
  ) {
    this.player.setAlpha(
      this.firstPersonCamera
        ? 0
        : 1
    );
  }

  this.game.events.emit(
    'feedback',
    this.firstPersonCamera
      ? 'first-person'
      : 'third-person'
  );
}
// ============================================================
// SIGNAL INTERFERENCE · CONTINUOUS UPDATE
// ============================================================
  
if (
  !this.motionReduced
) {
  this.updateSignalInterference(delta);
  this.updateSignalInterferenceEnemyFX(delta);
}

this.updateSurpriseCacheInteraction();
this.updateRelayGateInteraction();

if (this.relayPuzzleActive) {
  this.elapsedMs +=
    delta;

  this.timeEmitTimer +=
    delta;

 if (
    this.timeEmitTimer >=
    100
  ) {
    this.timeEmitTimer -=
      100;

    this.game.events.emit(
      'time',
      this.elapsedMs
    );
  }

  this.updateRelayPuzzleTimer();
  return;
}
  
// ============================================================
// CELESTIAL · ORBIT UPDATE
// ============================================================

this.celestialUpdateTimer =
  Math.max(
    0,
    (this.celestialUpdateTimer || 0) -
      delta
  );

if (
  this.celestialUpdateTimer <= 0
) {
  this.celestialUpdateTimer = 33;

  const celestialTime =
    (this.time.now % 180000) / 180000;

const sunAngle =
  celestialTime * Math.PI * 2;

const moonAngle =
  sunAngle + Math.PI;

const sunX =
  930 +
  Math.cos(sunAngle) * 260;

const sunY =
  150 +
  Math.sin(sunAngle) * 75;

const moonX =
  930 +
  Math.cos(moonAngle) * 260;

const moonY =
  150 +
  Math.sin(moonAngle) * 75;

  const sunAltitude =
  Phaser.Math.Clamp(
    (150 - sunY) / 75,
    -1,
    1
  );

const moonAltitude =
  Phaser.Math.Clamp(
    (150 - moonY) / 75,
    -1,
    1
  );

const daylight =
  Phaser.Math.Clamp(
    (Math.sin(sunAngle) + 1) * 0.5,
    0,
    1
  );

  const daylightSmooth =
  Phaser.Math.SmoothStep(
    daylight,
    0,
    1
  );

const nightAmount =
   1 - daylightSmooth;

  const moonShadowAlpha =
  Phaser.Math.Linear(
    0.62,
    0.88,
    nightAmount
  );

const sunGlowAlpha =
  Phaser.Math.Linear(
    0.06,
    0.16,
    daylightSmooth
  );

const moonGlowAlpha =
  Phaser.Math.Linear(
   0.18,
   0.035,
  daylightSmooth
  );

if (
  this.celestialSun &&
  this.celestialSunGlow &&
  this.celestialMoon &&
  this.celestialMoonGlow
) {
  this.celestialSun.setPosition(
    sunX,
    sunY
  );

  this.celestialMoon.setPosition(
  moonX,
  moonY
);

const moonScale =
  0.94 +
  Math.max(
    0,
    moonAltitude
  ) * 0.08;

const moonVisibility =
  Phaser.Math.Clamp(
    0.55 +
    moonAltitude * 0.45,
    0.35,
    1
  );

this.celestialMoon.setScale(
  moonScale
);

this.celestialMoon.setAlpha(
  moonVisibility
);
  

  const sunScale =
  0.92 +
  Math.max(
    0,
    sunAltitude
  ) * 0.10;

  const sunVisibility =
  Phaser.Math.Clamp(
    0.55 +
    sunAltitude * 0.45,
    0.35,
    1
  );

this.celestialSun.setScale(
  sunScale
);

  this.celestialSun.setAlpha(
  sunVisibility
);

 this.celestialSunGlow.setPosition(
  sunX,
  sunY - 2
);

  const sunGlowScale =
  0.96 +
  Math.max(
    0,
    sunAltitude
  ) * 0.06;

this.celestialSunGlow.setScale(
  sunGlowScale
);

  if (this.celestialMoonShadow) {
  this.celestialMoonShadow.setPosition(
    moonX + 24,
    moonY - 15
  );
}

 this.celestialMoonGlow.setPosition(
  moonX,
  moonY - 2
);

  const celestialPulse =
  1 +
  Math.sin(this.time.now * 0.0018) * 0.035;

this.celestialSunGlow.setAlpha(
  Phaser.Math.Clamp(
    sunGlowAlpha * celestialPulse,
    0,
    1
  )
);

this.celestialMoonGlow.setAlpha(
  Phaser.Math.Clamp(
    moonGlowAlpha * celestialPulse,
    0,
    1
  )
);
  if (this.celestialMoonShadow) {
 this.celestialMoonShadow.setAlpha(
  Phaser.Math.Clamp(
    moonShadowAlpha +
      Math.sin(this.time.now * 0.0014) * 0.015,
    0,
    1
  )
);
  }
}

this.elapsedMs += delta;
this.timeEmitTimer += delta;

if (
  this.timeEmitTimer >=
  100
) {
  this.timeEmitTimer -=
    100;

  this.game.events.emit(
    'time',
    this.elapsedMs
  );
}

if (
  Phaser.Input.Keyboard.JustDown(
    this.keys.ESC
  )
) {
  this.dismissIntelCard();
}

this.respawnGrace =
  Math.max(
    0,
    this.respawnGrace -
      delta
  );

if (
  !this.sectorTwoAnnounced &&
  this.player.x >= 4080
) {
  this.sectorTwoAnnounced =
    true;

  this.game.events.emit(
    'sector',
    {
      number: 2,
      signals:
        this.mission
          .signals
          .length,
      checkpoints:
        this.mission
          .checkpoints
          .length
    }
  );

  this.playerCue(
    'SECTOR TWO · RELAY SPIRE',
    '#ffd06e'
  );
}

this.lowEnergyCueTimer =
  Math.max(
    0,
    this.lowEnergyCueTimer -
      delta
  );

this.boostCooldown =
  Math.max(
    0,
    this.boostCooldown -
      delta
  );

this.blasterCooldown =
  Math.max(
    0,
    this.blasterCooldown -
      delta
  );

const previousDashCooldown =
  this.dashCooldown;

this.dashCooldown =
  Math.max(
    0,
    this.dashCooldown -
      delta
  );

const previousDashTimer =
  this.dashTimer;

this.dashTimer =
  Math.max(
    0,
    this.dashTimer -
      delta
  );

// DASH COOLDOWN · READY EDGE
if (
  previousDashCooldown > 0 &&
  this.dashCooldown <= 0 &&
  !this.motionReduced &&
  this.player?.active
) {
  this.game.events.emit(
    'feedback',
    'dash-ready'
  );
}

// DASH → MOVEMENT TRANSITION
if (
  previousDashTimer > 0 &&
  this.dashTimer <= 0 &&
  !this.motionReduced &&
  this.player?.active
) {
  this.tweens.add({
    targets: this.player,
    scaleX:
      this.playerVisualBaseScaleX * 1.045,
    scaleY:
      this.playerVisualBaseScaleY * 0.965,
    duration: 55,
    yoyo: true,
    ease: 'Quad.out'
  });

  const exitBurst =
    this.add
      .circle(
        this.player.x,
        this.player.y,
        6,
        0x8df4ff,
        0.24
      )
      .setDepth(10);

  /* DASH AFTER-IMAGE */

  if (
    !this.motionReduced &&
    this.player?.active
  ) {
    const ghostA =
      this.add
        .sprite(
          this.player.x -
            (this.player.flipX ? -18 : 18),
          this.player.y,
          this.player.texture.key
        )
        .setFlipX(
          this.player.flipX
        )
        .setAlpha(0.24)
        .setTint(0x8df4ff)
        .setScale(
          this.player.scaleX,
          this.player.scaleY
        )
        .setAngle(
          this.player.angle
        )
        .setDepth(7);

    const ghostB =
      this.add
        .sprite(
          this.player.x -
            (this.player.flipX ? -34 : 34),
          this.player.y,
          this.player.texture.key
        )
        .setFlipX(
          this.player.flipX
        )
        .setAlpha(0.12)
        .setTint(0xb9f5ff)
        .setScale(
          this.player.scaleX,
          this.player.scaleY
        )
        .setAngle(
          this.player.angle
        )
        .setDepth(6);

this.tweens.add({
  targets: ghostA,
  x:
    ghostA.x -
    (this.player.flipX ? -32 : 32),
  alpha: 0,
  scaleX:
    ghostA.scaleX * 0.86,
  scaleY:
    ghostA.scaleY * 0.94,
  duration: 145,
  ease: 'Cubic.out',
   onComplete: () => {
  if (ghostA?.active) {
    ghostA.destroy();
  }
}
    });

    this.tweens.add({
  targets: ghostB,
  x:
    ghostB.x -
    (this.player.flipX ? -40 : 40),
  alpha: 0,
  scaleX:
    ghostB.scaleX * 0.80,
  scaleY:
    ghostB.scaleY * 0.90,
  duration: 185,
  ease: 'Cubic.out',
     onComplete: () => {
  if (ghostB?.active) {
    ghostB.destroy();
  }
}
    });
  }

  this.tweens.add({
    targets: exitBurst,
    scaleX: 2.6,
    scaleY: 0.65,
    alpha: 0,
    duration: 130,
    ease: 'Quad.out',
    onComplete: () =>
      exitBurst.destroy()
  });

  // WORLD REACTION · DASH EXIT
  this.worldLightPulse(
    0x8df4ff,
    0.14,
    180,
    38
  );

  this.worldLightFlash(
    0x8df4ff,
    0.045,
    100
  );
}


if (
  this.wallJumpTimer <= 0
) {
  this.wallJumpFxShown = false;
}

const packageSpeed =
  this.package
    ?.speedMultiplier ||
  1;

const surpriseSpeed =
  Number.isFinite(
    this.surpriseModifier
      ?.movementMultiplier
  )
    ? this.surpriseModifier
        .movementMultiplier
    : 1;

if (
  !this.dashTimer &&
  this.player?.body
) {

  const polaritySpeed =
    this.polarityState === 'OVERDRIVE'
      ? 1.10
      : this.polarityState === 'CHARGED'
        ? 1.04
        : this.polarityState === 'LOW'
          ? 0.97
          : 1;

  this.player.body.setMaxVelocityX(
    RUNNER_TUNING.maxRunSpeed *
    packageSpeed *
    surpriseSpeed *
    polaritySpeed
  );
}

if (
  previousDashCooldown >
    0 &&
  !this.dashCooldown
) {

  const readyPulse =
  this.add
    .circle(
      this.player.x,
      this.player.y,
      9,
      0x8df4ff,
      .52
    )
    .setDepth(11);

readyPulse.setStrokeStyle(
  2,
  0xb9f5ff,
  0.9
);

this.tweens.add({
  targets: readyPulse,
  scale: 3.2,
  alpha: 0,
  duration: 240,
  ease: 'Quad.out',
  onComplete: () =>
    readyPulse.destroy()
});

  this.playerCue(
    'DASH READY'
  );
}

this.wallJumpCooldown =
  Math.max(
    0,
    this.wallJumpCooldown -
      delta
  );

this.wallJumpTimer =
  Math.max(
    0,
    this.wallJumpTimer -
      delta
  );

const upgrades =
  this.loadout.upgrades ||
  [];

const modifier = this.loadout.modifier;

this.energyMax =
  modifier?.id === 'lowEnergy'
    ? 65
    : upgrades.includes('energyCore')
      ? 115
      : 100;

this.energy =
  Math.min(
    this.energyMax,
    this.energy +
      delta *
        .018 *
        (
          upgrades.includes(
            'recharge'
          )
            ? 1.2
            : 1
        )
  );

this.vaultCooldown =
  Math.max(
    0,
    this.vaultCooldown -
      delta
  );

const previousGadgetCooldowns =
  this.gadgetCooldowns;

this.gadgetCooldowns =
  this.gadgetCooldowns.map(
    cooldown =>
      Math.max(
        0,
        cooldown -
          delta
      )
  );

this.buildCooldowns =
  this.buildCooldowns.map(
    cooldown =>
      Math.max(
        0,
        cooldown -
          delta
      )
  );

previousGadgetCooldowns.forEach(
  (cooldown, slot) => {
    if (
      cooldown > 0 &&
      this.gadgetCooldowns[
        slot
      ] === 0 &&
      this.loadout.equipment
        ?.[
          slot
        ]
    ) {
      this.playerCue(
        `${
          slot + 3
        } READY`,
        '#ffd06e'
      );

      const readyPulse =
        this.add
          .circle(
            this.player.x,
            this.player.y,
            7,
            0xffd06e,
            .4
          )
          .setDepth(11);

      this.tweens.add({
        targets: readyPulse,
        scale: 2.1,
        alpha: 0,
        duration: 180,
        onComplete: () =>
          readyPulse.destroy()
      });
    }
  }
);

this.empTimer =
  Math.max(
    0,
    (
      this.empTimer ||
      0
    ) -
      delta
  );

this.decoyTimer =
  Math.max(
    0,
    (
      this.decoyTimer ||
      0
    ) -
      delta
  );

this.boosterTimer =
  Math.max(
    0,
    (
      this.boosterTimer ||
      0
    ) -
      delta
  );

if (!this.empTimer) {
  this.enemies
    ?.getChildren()
    .forEach(
      enemy =>
        enemy.clearTint()
    );
}

if (
  !this.decoyTimer &&
  this.decoyBeacon
) {
  this.decoyBeacon.destroy();
  this.decoyBeacon = null;
}

if (this.boosterAura) {
  if (this.boosterTimer) {
    this.boosterAura.setPosition(
      this.player.x,
      this.player.y
    );
  } else {
    this.boosterAura.destroy();
    this.boosterAura = null;
  }
}

if (
  Math.round(
    this.energy
  ) !==
  this.energyEmit
) {
  this.energyEmit =
    Math.round(
      this.energy
    );

  this.game.events.emit(
    'energy',
    this.energyEmit /
      this.energyMax *
      100
  );
}

this.movingGates
  ?.getChildren()
  .forEach(
    gate =>
      gate.body.updateFromGameObject()
  );

this.updateWeather(
  delta
);

this.eventCheckTimer -= delta;

if (this.eventCheckTimer <= 0) {
this.eventCheckTimer = 100;
this.updateEvents();
}

this.updateEnemies(
  delta
);

this.updateSciFiThreats(
  delta
);

this.routeHintTimer -= delta;

if (this.routeHintTimer <= 0) {
  this.routeHintTimer = 100;
  this.updateRouteHints();
  this.updateCheckpointArrow();
}

const polarityBreakPressed =
  Phaser.Input.Keyboard.JustDown(
    this.keys.X
  );

if (
  polarityBreakPressed
) {
  this.breakPolarity();
}

if (
  Phaser.Input.Keyboard.JustDown(
    this.keys.ONE
  ) ||
  this.mobileActions.build1
) {
  this.useBuild(0);
}

if (
  Phaser.Input.Keyboard.JustDown(
    this.keys.TWO
  ) ||
  this.mobileActions.build2
) {
  this.useBuild(1);
}

if (
  Phaser.Input.Keyboard.JustDown(
    this.keys.THREE
  ) ||
  this.mobileActions.gadget1
) {
  this.useGadget(0);
}

if (
  Phaser.Input.Keyboard.JustDown(
    this.keys.FOUR
  ) ||
  this.mobileActions.gadget2
) {
  this.useGadget(1);
}

this.mobileActions.build1 =
  false;

this.mobileActions.build2 =
  false;

this.mobileActions.gadget1 =
  false;

this.mobileActions.gadget2 =
  false;

this.healthInvulnerable =
  Math.max(
    0,
    this.healthInvulnerable -
      delta
  );

this.swordCooldown =
  Math.max(
    0,
    this.swordCooldown -
      delta
  );

this.comboTimer =
  Math.max(
    0,
    this.comboTimer -
      delta
  );

 const previousOverdriveTimer =
  this.overdriveTimer;

this.overdriveTimer =
  Math.max(
    0,
    this.overdriveTimer -
      delta
  );

if (
  previousOverdriveTimer > 0 &&
  this.overdriveTimer === 0 &&
  this.player?.active
) {
  this.playerCue(
    'OVERDRIVE OFF',
    '#8ba0b8'
  );

  this.gadgetPulse(
    0x8ba0b8,
    10,
    240
  );
}

this.perfectDodgeWindow =

Math.max(
0,
this.perfectDodgeWindow -
delta
);

this.perfectDodgeCooldown =
Math.max(
0,
this.perfectDodgeCooldown -
delta
);

if (
  !this.comboTimer &&
  this.combatCombo
) {

  if (
    this.combatCombo >= 3 &&
    this.player?.active
  ) {
    this.playerCue(
      'COMBO LOST',
      '#ff826e'
    );

    this.gadgetPulse(
      0xff826e,
      11,
      260
    );
  }

  // ============================================================
// COMBO BREAK · IMPACT FX
// ============================================================
if (
  !this.motionReduced &&
  this.graphicsLevel >= 2
) {
  const comboBreak =
    this.add
      .circle(
        this.player.x,
        this.player.y,
        12,
        0xff826e,
        .22
      )
      .setDepth(13);

  comboBreak.setStrokeStyle(
    2,
    0xffb3a8,
    .9
  );

  this.tweens.add({
    targets: comboBreak,
    scale: 4.2,
    alpha: 0,
    duration: 300,
    ease: 'Quad.out',
    onComplete: () =>
      comboBreak.destroy()
  });

  this.shake(
    90,
    0.0035
  );
}
  
this.combatCombo = 0;
this.polarityComboOverdriveTriggered = false;

this.game.events.emit(
  'combo',
  0,
  0
);

if (
  this.ammo >=
  this.ammoMax
) {
  this.ammoRecharge = 0;
} else {
  this.ammoRecharge +=
    delta;

  if (
    this.ammoRecharge >=
    1050
  ) {
    this.ammo++;

    this.gadgetPulse(
      0x8df4ff,
      8,
      260
    );

    this.ammoRecharge = 0;

    this.game.events.emit(
      'ammo',
      this.ammo /
        this.ammoMax *
        100
    );
  }
}

this.updateBuilds();
this.updateNarrative();

const swordPressed =
  Phaser.Input.Keyboard.JustDown(
    this.keys.Q
  ) ||
  this.mobileActions.sword;

this.mobileActions.sword =
  false;

if (
  Phaser.Input.Keyboard.JustDown(
    this.keys.E
  )
) {
  this.useBlaster();
}

if (
  this.mobileActions.fire
) {
  this.useBlaster();
}

this.mobileActions.fire =
  false;

if (swordPressed) {
  this.useSword();
}

// energyMax is resolved before regeneration above.

// energyMax is resolved before regeneration above.

const body =
  this.player?.body;

if (!body) {
  return;
}

const rawKeyboard =
  this.rawKeyboardState ||
  {};

const left =
  this.cursors.left.isDown ||
  this.keys.A.isDown ||
  rawKeyboard.KeyA ||
  this.mobileDirection ===
    'left';

const right =
  this.cursors.right.isDown ||
  this.keys.D.isDown ||
  rawKeyboard.KeyD ||
  this.mobileDirection ===
    'right';

const forward =
  this.keys.W.isDown ||
  rawKeyboard.KeyW;

const backward =
  this.keys.S.isDown ||
  rawKeyboard.KeyS;

/*
 * If AFK/cryostasis previously disabled movement,
 * any real keyboard movement input re-enables the body.
 */
if (
  left ||
  right ||
  forward ||
  backward
) {
  body.moves = true;
}

/*
 * MOBILE AIR STEERING
 * Smooth target direction instead of hard switching.
 */
const mobileTargetDirection =
  this.mobileDirection === 'left'
    ? -1
    : this.mobileDirection === 'right'
      ? 1
      : 0;

if (
  !this.mobileAirDirection
) {
  this.mobileAirDirection = 0;
}

if (
  mobileTargetDirection !== 0
) {
  this.mobileAirDirection =
    Phaser.Math.Linear(
      this.mobileAirDirection,
      mobileTargetDirection,
      Phaser.Math.Clamp(
        RUNNER_TUNING.mobileAirSteerResponse *
        (delta / 16.667),
        0,
        1
      )
    );
} else {
  this.mobileAirDirection =
    Phaser.Math.Linear(
      this.mobileAirDirection,
      0,
      Phaser.Math.Clamp(
        RUNNER_TUNING.mobileAirSteerResponse *
        0.75 *
        (delta / 16.667),
        0,
        1
      )
    );
}

const onGround =
  body.blocked.down ||
  body.touching.down;

const justLeftGround =
  this.wasGrounded &&
  !onGround;

  /* -------------------------------------------------
   JUMP TAKEOFF FX
   Purely visual — triggered when leaving ground.
   ------------------------------------------------- */

if (
  !this.motionReduced &&
  justLeftGround &&
  body.velocity.y < -120 &&
  this.player?.active
) {
  const takeoff =
    this.add.circle(
      this.player.x,
      this.player.y + 27,
      5,
      0x8df4ff,
      0.24
    )
    .setDepth(8);

  // ============================================================
  // JUMP TAKEOFF · MICRO SPARKS
  // Small visible launch feedback.
  // Visual only — no physics/input mutation.
  // ============================================================
  for (let i = 0; i < 3; i++) {
    const spark =
      this.add.circle(
        this.player.x +
          Phaser.Math.Between(-8, 8),
        this.player.y + 27,
        Phaser.Math.Between(1, 2),
        0xe8fdff,
        0.75
      )
      .setDepth(9);

    this.tweens.add({
      targets: spark,
      x:
        spark.x +
        Phaser.Math.Between(-10, 10),
      y:
        spark.y +
        Phaser.Math.Between(4, 10),
      alpha: 0,
      scale: 0.25,
      duration: 160,
      ease: 'Quad.out',
      onComplete: () => {
        if (spark?.active) {
          spark.destroy();
        }
      }
    });
  }

  takeoff.setStrokeStyle(
    1.5,
    0xe8fdff,
    0.75
  );

  this.tweens.add({
    targets: takeoff,
    scaleX: 3.2,
    scaleY: 0.45,
    alpha: 0,
    y: takeoff.y + 5,
    duration: 145,
    ease: 'Quad.out',
    onComplete: () =>
      takeoff.destroy()
  });

  const launchSpark =
    this.add.rectangle(
      this.player.x,
      this.player.y + 28,
      10,
      2,
      0xe8fdff,
      0.32
    )
    .setDepth(9);

  this.tweens.add({
    targets: launchSpark,
    scaleX: 1.8,
    alpha: 0,
    y: launchSpark.y + 7,
    duration: 110,
    ease: 'Quad.out',
    onComplete: () =>
      launchSpark.destroy()
  });
}

const movingAgainstVelocity =
  (
    left &&
    body.velocity.x >
      20
  ) ||
  (
    right &&
    body.velocity.x <
      -20
  );
  
const airControlMultiplier =
  !onGround
    ? (
        this.mobileAirDirection !== 0 &&
        !this.cursors.left.isDown &&
        !this.cursors.right.isDown &&
        !this.keys.A.isDown &&
        !this.keys.D.isDown
      )
        ? Math.max(
            0.85,
            Math.abs(
              this.mobileAirDirection
            )
          )
        : (
            upgrades.includes(
              'airControl'
            )
              ? 1.18
              : 1
          )
    : 1;

/*
 * ADVANCED AIR STEERING
 * Viša brzina = malo teže održavati puni steering.
 * Promjena smjera = dodatni turn boost.
 */
const airSpeedRatio =
  Phaser.Math.Clamp(
    Math.abs(body.velocity.x) /
      RUNNER_TUNING.maxRunSpeed,
    0,
    1
  );

const airSteeringCurve =
  Phaser.Math.Linear(
    RUNNER_TUNING.airSteeringMax,
    RUNNER_TUNING.airSteeringMin,
    airSpeedRatio
  );

const airTurnBoost =
  movingAgainstVelocity &&
  !onGround
    ? RUNNER_TUNING.airSteeringTurnBoost
    : 1;

const acceleration =
  (
    movingAgainstVelocity
      ? onGround
        ? RUNNER_TUNING.turnAcceleration
        : RUNNER_TUNING.airTurnAcceleration
      : onGround
        ? RUNNER_TUNING.groundAcceleration
        : RUNNER_TUNING.airAcceleration
  ) *
  airControlMultiplier *
  (
    onGround
      ? 1
      : airSteeringCurve *
        airTurnBoost
  );

const wetGrip =
  onGround &&
  this.wetSurfaceActive
    ? 0.28
    : 1;

const wetAcceleration =
  onGround &&
  this.wetSurfaceActive
    ? acceleration * 0.82
    : acceleration;

const wetDeceleration =
  onGround &&
  this.wetSurfaceActive
    ? RUNNER_TUNING.groundDeceleration * 0.16
    : RUNNER_TUNING.groundDeceleration;

const moveX =
  (right ? 1 : 0) -
  (left ? 1 : 0);

const moveY =
  (forward ? -1 : 0) +
  (backward ? 1 : 0);

const hasVerticalKeyboardMove =
  forward || backward;

/*
 * ============================================================
 * KEYBOARD 4-WAY MOVEMENT
 *
 * W = forward / up
 * S = backward / down
 * A = left
 * D = right
 *
 * Mobile joystick remains independent.
 * ============================================================
 */

if (moveX !== 0) {
  body.setAccelerationX(
    moveX * wetAcceleration
  );

  body.setDragX(
    this.wetSurfaceActive
      ? wetGrip
      : 0
  );

  this.player.setFlipX(
    moveX < 0
  );
} else {
  body
    .setAccelerationX(0)
    .setDragX(
      onGround
        ? wetDeceleration
        : RUNNER_TUNING.airDeceleration
    );

  if (
    !onGround &&
    Math.abs(body.velocity.x) > 1
  ) {
    const retention =
      Math.pow(
        RUNNER_TUNING.airMomentumRetention,
        delta / 16.667
      );

    body.setVelocityX(
      body.velocity.x *
      retention
    );
  }
}

/*
 * W/S work even when FLIGHT is OFF.
 * We temporarily suppress gravity while a vertical
 * keyboard direction is actively held, so gravity
 * cannot cancel the requested movement.
 */
if (
  hasVerticalKeyboardMove &&
  !this.flightMode
) {
  body.setGravityY(0);

  body.setVelocityY(
    Phaser.Math.Clamp(
      moveY * 330,
      -330,
      330
    )
  );
}

if (
  onGround &&
  (
    upgrades.includes(
      'stride'
    ) ||
    modifier?.id ===
      'highSpeed'
  )
) {
body.setMaxVelocityX(
  RUNNER_TUNING.maxRunSpeed *
  packageSpeed *
  (
    modifier?.id ===
    'highSpeed'
      ? 1.12
      : 1.04
  ) *
  (
    Number.isFinite(
      this.surpriseModifier
        ?.movementMultiplier
    )
      ? this.surpriseModifier
          .movementMultiplier
      : 1
  )
);

const flightPressed =
  Phaser.Input.Keyboard.JustDown(
    this.keys.F
  );

if (flightPressed) {
  this.flightMode =
    !this.flightMode;

  if (this.flightMode) {
    body.setVelocityY(0);
    body.setGravityY(0);

    this.playerCue(
      'FLIGHT ACTIVE',
      '#8df4ff'
    );

    this.game.events.emit(
      'feedback',
      'flight'
    );
  } else {
    this.playerCue(
      'FLIGHT OFF',
      '#8ba0b8'
    );
  }
}

const gravityMultiplier =
  this.mission.gravityMode === 'low'
    ? 0.55
    : 1;

let verticalGravity;

const verticalSpeed =
  Math.abs(body.velocity.y);

if (
  verticalSpeed <=
  RUNNER_TUNING.apexVelocityThreshold
) {
  verticalGravity =
    RUNNER_TUNING.riseGravity *
    RUNNER_TUNING.apexGravityMultiplier;

} else if (
  body.velocity.y < 0
) {
  verticalGravity =
    RUNNER_TUNING.riseGravity;

} else {
  const fallProgress =
    Phaser.Math.Clamp(
      (
        verticalSpeed -
        RUNNER_TUNING.fallRampStart
      ) /
      (
        RUNNER_TUNING.fallRampMax -
        RUNNER_TUNING.fallRampStart
      ),
      0,
      1
    );

  const fallRamp =
    Phaser.Math.Linear(
      1,
      RUNNER_TUNING.fallRampBonus,
      fallProgress
    );

  verticalGravity =
    RUNNER_TUNING.fallGravity *
    RUNNER_TUNING.fallGravityBoost *
    fallRamp;
}

if (this.flightMode) {
  body.setGravityY(0);

  body.setMaxVelocityY(
    this.flightSpeed
  );

  if (
    !forward &&
    !backward
  ) {
    body.setVelocityY(
      Phaser.Math.Linear(
        body.velocity.y,
        0,
        0.18
      )
    );
  }
} else if (
  !hasVerticalKeyboardMove
) {
  body.setGravityY(
    verticalGravity *
    gravityMultiplier
  );

  body.setMaxVelocityY(
    RUNNER_TUNING.maxFallSpeed
  );
} else {
  /*
   * W/S trenutno upravljaju Y osom.
   * Gravity ostaje ugašen samo dok je
   * vertical keyboard input aktivan.
   */
  body.setGravityY(0);

  body.setMaxVelocityY(330);
}

if (onGround) {
  this.coyote =
    RUNNER_TUNING.coyoteMs;

  this.jumpsUsed = 0;
  this.airDashUsed = false;
} else {
  this.coyote =
    Math.max(
      0,
      this.coyote -
        delta
    );
}

const keyboardPressed =
  Phaser.Input.Keyboard.JustDown(
    this.cursors.up
  ) ||
  Phaser.Input.Keyboard.JustDown(
    this.keys.SPACE
  );

const keyboardReleased =
  Phaser.Input.Keyboard.JustUp(
    this.cursors.up
  ) ||
  Phaser.Input.Keyboard.JustUp(
    this.keys.SPACE
  );

const jumpHeld =
  this.cursors.up.isDown ||
  this.keys.SPACE.isDown ||
  this.mobileActions.jumpHeld;

this.mobileActions.jump = false;
this.mobileActions.jumpReleased = false;

if (keyboardPressed) {
  this.jumpBuffer =
    RUNNER_TUNING.jumpBufferMs;
} else {
  this.jumpBuffer =
    Math.max(
      0,
      this.jumpBuffer -
        delta
    );
}

const wallDirection =
  (
    body.blocked.left ||
    body.touching.left
  )
    ? 1
    : (
        body.blocked.right ||
        body.touching.right
      )
      ? -1
      : 0;

const wallRunning =
  this.abilities.has(
    'wallRun'
  ) &&
  wallDirection &&
  !onGround &&
  (
    (
      wallDirection === 1 &&
      left
    ) ||
    (
      wallDirection === -1 &&
      right
    )
  ) &&
  this.useEnergy(
    delta * .018,
    'wallRun'
  );

if (
  wallRunning
) {
  body.setVelocityY(
    Math.min(
      body.velocity.y,
      35
    )
  );
} else if (
  wallDirection &&
  !onGround &&
  body.velocity.y >
    120
) {
  body.setVelocityY(
    120
  );
}

let grabTriggered = false;

const grabPressed =
  Phaser.Input.Keyboard.JustDown(
    this.keys.SPACE
  ) &&
  this.abilities.has(
    'ledgeGrab'
  ) &&
  wallDirection &&
  !onGround &&
  body.velocity.y >
    0;

if (
  grabPressed &&
  this.useEnergy(
    8,
    'ledgeGrab'
  )
) {
  grabTriggered = true;

  this.jumpBuffer = 0;

  body.setVelocityY(
    -120
  );

  this.game.events.emit(
    'feedback',
    'ledgeGrab'
  );
}

if (
  this.abilities.has(
    'climb'
  ) &&
  wallDirection &&
  this.keys.W.isDown &&
  !onGround &&
  this.useEnergy(
    delta * .024,
    'climb'
  )
) {
  body.setVelocityY(
    -260
  );
}

const canWallJump =
  this.abilities.has(
    'wallJump'
  ) &&
  wallDirection &&
  !onGround &&
  this.wallJumpCooldown <= 0;

if (
  !grabTriggered &&
  this.jumpBuffer > 0 &&
  (
    this.coyote > 0 ||
    (
      this.abilities.has(
        'doubleJump'
      ) &&
      this.jumpsUsed < 2
    ) ||
    canWallJump
  )
) {
  if (canWallJump) {
    body.setVelocityX(
      445 *
        wallDirection
    );

    this.wallJumpCooldown =
      160;

    this.wallJumpTimer =
      150;

    this.jumpsUsed = 1;

    const wallX =
      this.player.x -
      wallDirection *
        16;

    if (this.graphicsLevel >= 1) {
  this.dust.emitParticleAt(
    wallX,
    this.player.y + 12,
    8
  );

  this.speedLines.emitParticleAt(
    wallX,
    this.player.y,
    4
  );
}

    // ============================================================
// WALL JUMP · ENERGY RING
// ============================================================

if (
  !this.motionReduced &&
  this.graphicsLevel >= 2
) {
  const wallJumpRing =
    this.add
      .circle(
        wallX,
        this.player.y,
        7,
        0x8df4ff,
        0.22
      )
      .setDepth(11);

  wallJumpRing.setStrokeStyle(
    1.5,
    0xb9f5ff,
    0.85
  );

  this.tweens.add({
    targets: wallJumpRing,
    scale: 3.2,
    alpha: 0,
    duration: 190,
    ease: 'Quad.out',
    onComplete: () =>
      wallJumpRing.destroy()
  });
}

if (
  !this.motionReduced &&
  this.graphicsLevel >= 2
) {
  const burst =
    this.add
      .circle(
        wallX,
        this.player.y,
        7,
        0x8df4ff,
        .5
      );

  burst.setBlendMode(
    Phaser.BlendModes.ADD
  );

  burst.setDepth(11);

  this.tweens.add({
    targets: burst,
    scale: 2.2,
    alpha: 0,
    duration: 150,
    onComplete: () =>
      burst.destroy()
  });
}

    this.leaveAfterimage();

    this.playerCue(
      'WALL JUMP'
    );

    this.shake(
      35,
      .001
    );

    this.game.events.emit(
      'feedback',
      'wallJump'
    );
  } else {
    this.jumpsUsed++;

  if (
  this.jumpsUsed ===
  2
) {
  this.leaveAfterimage(
    0xffd06e
  );

  // ============================================================
  // DOUBLE JUMP · AIR SPARKS
  // Small visible mid-air energy burst.
  // Visual only — no physics mutation.
  // ============================================================
    
if (
  !this.motionReduced &&
  this.graphicsLevel >= 2 &&
  this.player?.active
) {
    for (let i = 0; i < 4; i++) {
      const spark =
        this.add.circle(
          this.player.x +
            Phaser.Math.Between(-7, 7),
          this.player.y +
            Phaser.Math.Between(8, 20),
          Phaser.Math.Between(1, 2),
          0xffd06e,
          0.78
        )
        .setDepth(12);

      this.tweens.add({
        targets: spark,
        x:
          spark.x +
          Phaser.Math.Between(-14, 14),
        y:
          spark.y +
          Phaser.Math.Between(8, 20),
        alpha: 0,
        scale: 0.2,
        duration: 180,
        ease: 'Quad.out',
        onComplete: () => {
          if (spark?.active) {
            spark.destroy();
          }
        }
      });
    }
  }

this.playerCue(
  'DOUBLE JUMP'
);
      
      // ============================================================
      // DOUBLE JUMP · PREMIUM BOOST
// ============================================================

if (
  !this.motionReduced &&
  this.cameras?.main
) {
  this.cameras.main.shake(
    70,
    0.0014
  );

  this.tweens.add({
    targets: this.player,
   scaleX:
  this.playerVisualBaseScaleX *
  1.08,
    scaleY:
      this.playerVisualBaseScaleY *
      0.94,
    duration: 70,
    yoyo: true,
    ease: 'Quad.out'
  });
}
      

  const doubleJumpRing =
    this.add.circle(
      this.player.x,
      this.player.y,
      9,
      0xffd06e,
      0
    );

  doubleJumpRing.setStrokeStyle(
    2,
    0xffd06e,
    0.65
  );

  doubleJumpRing.setDepth(11);

  this.tweens.add({
    targets: doubleJumpRing,
    scale: 2.8,
    alpha: 0,
    duration: 240,
    ease: 'Quad.out',
    onComplete: () =>
      doubleJumpRing.destroy()
  });
}
      
    }

 const isDoubleJump =
  !onGround &&
  this.jumpsUsed >= 1;

if (isDoubleJump) {
  body.setVelocityY(
    Math.min(
      body.velocity.y,
      RUNNER_TUNING.doubleJumpVelocity
    )
  );
} else {
  body.setVelocityY(
    RUNNER_TUNING.jumpVelocity
  );
}

if (
  !this.motionReduced &&
  this.graphicsLevel >= 2
) {
const jumpBurst =
  this.add.circle(
    this.player.x,
    this.player.y + 27,
    8,
    0x8df4ff,
    0.32
  );

jumpBurst.setDepth(11);

this.tweens.add({
  targets: jumpBurst,
  scaleX: 3.4,
  scaleY: 0.48,
  alpha: 0,
  duration: 165,
  ease: 'Quad.out',
  onComplete: () =>
    jumpBurst.destroy()
});
}

  this.jumps++;

  // ============================================================
// PLAYER · JUMP TAKEOFF ENERGY
// ============================================================

if (
  !this.motionReduced &&
  this.graphicsLevel >= 2 &&
  this.jumps === 1
) {
  const takeoffRing =
    this.add
      .circle(
        this.player.x,
        this.player.y + 27,
        6,
        0x8df4ff,
        0.18
      )
      .setDepth(11);

  takeoffRing.setStrokeStyle(
    1.5,
    0xb9f5ff,
    0.75
  );

  this.tweens.add({
    targets: takeoffRing,
    scale: 2.6,
    alpha: 0,
    duration: 170,
    ease: 'Quad.out',
    onComplete: () =>
      takeoffRing.destroy()
  });
}

this.coyote = 0;
this.jumpBuffer = 0;

this.jumpHeld =
  jumpHeld;

 if (this.graphicsLevel >= 1) {
  this.dust.emitParticleAt(
    this.player.x,
    this.player.y + 27,
    5
  );

  this.speedLines.emitParticleAt(
    this.player.x,
    this.player.y + 22,
    2
  );
}

  if (!canWallJump) {
    this.game.events.emit(
      'feedback',
      'jump'
    );
  }
}

// ============================================================
// CROUCH / SLIDE INPUT
// S = CROUCH
// FAST + S + SLIDE ABILITY = SLIDE
// ============================================================

const applyPlayerCollider =
  config => {
    const footY =
      body.bottom;

    body.setSize(
      config.width,
      config.height
    );

    body.setOffset(
      config.offsetX,
      config.offsetY
    );

    // Keep the feet locked to the exact same world Y.
    body.y =
      footY -
      body.height;

    body.updateFromGameObject();
  };
  
const crouchHeld =
  this.mobileActions.crouch;

const fastEnoughForSlide =
  Math.abs(body.velocity.x) > 120;

if (!crouchHeld) {
  this.slideCrouchLocked = false;
}

const slideReady =
  crouchHeld &&
  !this.slideCrouchLocked &&
  onGround &&
  fastEnoughForSlide &&
  this.abilities.has('slide') &&
  this.slideTimer <= 0 &&
  this.energy >= 10;

// ------------------------------------------------------------
// ENTER CROUCH
// ------------------------------------------------------------

if (
  crouchHeld &&
  onGround &&
  !slideReady &&
  !this.playerCrouched
) {
  this.playerCrouched = true;

applyPlayerCollider(
  this.playerBodyConfig.crouching
);

  this.player.setScale(
    this.playerVisualBaseScaleX * 1.04,
    this.playerVisualBaseScaleY * 0.84
  );

  this.game.events.emit(
    'feedback',
    'crouch'
  );
}

// MOBILE CROUCH INPUT
// Do NOT clear here.
// The mobile button must control this state with press/release.
// ------------------------------------------------------------
// STAND UP
// ------------------------------------------------------------

if (
  !crouchHeld &&
  this.playerCrouched
) {
  const standingWidth =
    this.playerBodyConfig.standing.width;

  const standingHeight =
    this.playerBodyConfig.standing.height;

  const standingOffsetX =
    this.playerBodyConfig.standing.offsetX;

  const standingOffsetY =
    this.playerBodyConfig.standing.offsetY;

  const crouchHeight =
    this.playerBodyConfig.crouching.height;

  const extraHeight =
    standingHeight - crouchHeight;

const canStand =
  !this.physics.overlapRect(
    body.x,
    body.y - extraHeight,
    standingWidth,
    extraHeight,
    true,
    true
  );
  
  if (canStand) {
    this.playerCrouched = false;

  applyPlayerCollider({
  width: standingWidth,
  height: standingHeight,
  offsetX: standingOffsetX,
  offsetY: standingOffsetY
});

    this.player.setScale(
      this.playerVisualBaseScaleX,
      this.playerVisualBaseScaleY
    );
  }
}

// ------------------------------------------------------------
// SLIDE
// ------------------------------------------------------------

if (
  slideReady &&
  this.useEnergy(
    10,
    'slide'
  )
) {
  this.playerCrouched = true;

  applyPlayerCollider(
    this.playerBodyConfig.crouching
  );

 this.slideTimer = 360;
this.slideCrouchLocked = true;

body.setVelocityX(
  Math.sign(body.velocity.x) * 560
);

this.tweens.killTweensOf(this.player);

this.tweens.add({
  targets: this.player,
  scaleX:
    this.playerVisualBaseScaleX * 1.12,
  scaleY:
    this.playerVisualBaseScaleY * 0.82,
  duration: 90,
  ease: 'Quad.out'
});
  const slideBurst =
    this.add
      .circle(
        this.player.x,
        this.player.y + 22,
        10,
        0xffd06e,
        0.26
      )
      .setDepth(11);

  this.tweens.add({
    targets: slideBurst,
    scale: 3.6,
    alpha: 0,
    duration: 220,
    onComplete: () =>
      slideBurst.destroy()
  });

this.tweens.add({
  targets: this.player,
  scaleX:
    this.playerVisualBaseScaleX,
  scaleY:
    this.playerVisualBaseScaleY,
  duration: 220,
  ease: 'Quad.out'
});

  this.playerCue(
    'SLIDE',
    '#ffd06e'
  );

  this.game.events.emit(
    'feedback',
    'slide'
  );
}
this.slideTimer =
  Math.max(
    0,
    this.slideTimer -
      delta
  );

const dashPressed =
  Phaser.Input.Keyboard.JustDown(
    this.keys.SHIFT
  ) ||
  this.mobileActions.dash;

this.mobileActions.dash =
  false;

const canDash =
  modifier?.id !==
    'noDash' &&
  (
    onGround ||
    (
      this.abilities.has(
        'airDash'
      ) &&
      !this.airDashUsed
    )
  );

if (
  dashPressed &&
  canDash &&
  this.abilities.has(
    'dash'
  ) &&
  this.dashCooldown <=
    0 &&
  this.useEnergy(
    onGround
      ? 8
      : 25,
    onGround
      ? 'dash'
      : 'airDash'
  )
) {
  const direction =
    right
      ? 1
      : left
        ? -1
        : this.player
            .flipX
          ? -1
          : 1;

  const dashSpeed =
    RUNNER_TUNING.dashSpeed *
    (
      upgrades.includes(
        'dashDrive'
      )
        ? 1.08
        : 1
    );

  if (!onGround) {
    this.airDashUsed =
      true;

  body.setVelocityY(
  -RUNNER_TUNING.airDashRecoveryVelocity
);

    this.playerCue(
      'AIR DASH'
    );
  }

  const afterimage =
    this.add
      .sprite(
        this.player.x,
        this.player.y,
        this.player.texture.key
      )
      .setFlipX(
        this.player.flipX
      )
      .setTint(
        0x8df4ff
      )
      .setAlpha(.5)
      .setDepth(9);

  body
    .setMaxVelocityX(
      dashSpeed
    )
    .setVelocityX(
      dashSpeed *
        direction
    );

  this.dashCooldown =
    RUNNER_TUNING.dashCooldownMs;

  this.dashTimer =
    RUNNER_TUNING.dashDurationMs;

// ============================================================
// PLAYER · DASH TILT
// ============================================================
// Final angle is handled by the centralized SPEED LEAN / AIR TILT
// system below. Dash itself keeps its physics unchanged.

  // ============================================================
// DASH · CAMERA IMPACT
// ============================================================

if (
  !this.motionReduced &&
  this.cameras?.main
) {
  this.cameras.main.shake(
    90,
    0.0018
  );
}

  /*
 * DASH ENERGY TRAIL
 */
if (!this.motionReduced) {
  this.leaveAfterimage(
    direction > 0
      ? 0x8df4ff
      : 0xb9f5ff
  );

const dashTrail =
  this.add
    .circle(
      this.player.x -
        direction * 24,
      this.player.y,
      11,
      0x8df4ff,
      0.28
    )
    .setDepth(9);

this.tweens.add({
  targets: dashTrail,
  scaleX: 3.4,
  scaleY: 0.65,
  alpha: 0,
  x:
    dashTrail.x -
    direction * 52,
  duration: 155,
  ease: 'Quad.out',
  onComplete: () =>
    dashTrail.destroy()
});

  const dashCore =
    this.add
      .circle(
        this.player.x,
        this.player.y,
        6,
        0xe8fdff,
        0.7
      )
      .setDepth(12);

  this.tweens.add({
    targets: dashCore,
    scale: 2.4,
    alpha: 0,
    duration: 160,
    ease: 'Quad.out',
    onComplete: () =>
      dashCore.destroy()
  });
}

this.perfectDodgeWindow = 120;
  const dashBurst =
  this.add
    .circle(
      this.player.x,
      this.player.y,
      12,
      0x8df4ff,
      .30
    )
    .setDepth(12);

this.tweens.add({
  targets: dashBurst,
  scale: 4,
  alpha: 0,
  duration: 220,
  onComplete: () =>
    dashBurst.destroy()
});

  this.tweens.add({
    targets:
      afterimage,
    x:
      afterimage.x -
      direction * 30,
    alpha: 0,
    duration: 160,
    onComplete: () =>
      afterimage.destroy()
  });

  this.game.events.emit(
    'feedback',
    'dash'
  );
}

if (
  keyboardReleased &&
  body.velocity.y <
    -180 &&
  this.jumpHeld
) {
  body.setVelocityY(
    body.velocity.y *
      RUNNER_TUNING.jumpCutMultiplier
  );

  this.jumpHeld = false;
}

if (
  body.velocity.y >= 0
) {
  this.jumpHeld = false;
}

if (!onGround) {
  this.fallSpeed =
    Math.max(
      this.fallSpeed,
      body.velocity.y
    );
}

if (
  onGround &&
  !this.wasGrounded &&
  this.fallSpeed > 80
) {
 const hardLanding =
  this.landingTimer > 0 &&
  this.fallSpeed > 260;

 if (this.graphicsLevel >= 1) {
  this.dust.emitParticleAt(
    this.player.x,
    this.player.y + 28,
    hardLanding
      ? 12
      : 4
  );

  this.speedLines.emitParticleAt(
    this.player.x,
    this.player.y + 28,
    hardLanding
      ? 4
      : 1
  );
}

if (hardLanding) {
  if (!this.motionReduced) {
    this.shake(
      105,
      .0028
    );
  }

  this.playerCue(
    'HARD LANDING',
    '#ffcf82'
  );
}

if (
  !this.motionReduced &&
  this.graphicsLevel >= 2
) {
  const landingPulse =
    this.add
      .circle(
        this.player.x,
        this.player.y + 28,
        14,
        0xffcf82,
        .30
      )
      .setDepth(11);

  this.tweens.add({
    targets: landingPulse,
    scale: 4.4,
    alpha: 0,
    duration: 290,
    onComplete: () =>
      landingPulse.destroy()
  });
}

  if (!this.motionReduced) {
    this.tweens.add({
      targets:
        this.player,
scaleX:
  this.playerVisualBaseScaleX *
  (
    hardLanding
      ? 1.15
      : 1.04
  ),
scaleY:
  this.playerVisualBaseScaleY *
  (
    hardLanding
      ? 0.80
      : 0.94
  ),
      yoyo: true,
      duration:
        hardLanding
          ? 110
          : 80
    });
  }

  // WORLD REACTION · LANDING
  this.worldLightPulse(
    hardLanding
      ? 0xffd06e
      : 0x8df4ff,
    hardLanding
      ? 0.20
      : 0.10,
    hardLanding
      ? 280
      : 180,
    hardLanding
      ? 54
      : 34
  );

if (hardLanding) {
  this.worldLightFlash(
    0xffd06e,
    0.055,
    135
  );

  // Strong fall = stronger dizzy reaction.
  this.showDizzyStars(
    1.25
  );
}

this.landingTimer =
  hardLanding ? 135 : 105;

this.lastHardLanding =
  hardLanding;

// ============================================================
// PLAYER · LANDING SHOCKWAVE
// ============================================================

if (
  !this.motionReduced &&
  this.graphicsLevel >= 2
) {
  const landingShock =
    this.add
      .circle(
        this.player.x,
        this.player.y + 28,
        hardLanding ? 10 : 6,
        0x8df4ff,
        hardLanding ? 0.30 : 0.22
      )
      .setDepth(10);

  landingShock.setStrokeStyle(
    hardLanding ? 2 : 1,
    hardLanding
      ? 0xffcf82
      : 0x8df4ff,
    hardLanding ? 0.9 : 0.75
  );

  this.tweens.add({
    targets: landingShock,
    scale: hardLanding
      ? 4.8
      : 3.0,
    alpha: 0,
    duration: hardLanding
      ? 260
      : 175,
    ease: 'Quad.out',
    onComplete: () =>
      landingShock.destroy()
  });
}
  
 
}
  this.game.events.emit(
  'feedback',
  hardLanding
    ? 'hard_land'
    : 'land'
);

if (onGround) {
  this.fallSpeed = 0;
}

this.landingTimer =
  Math.max(
    0,
    (
      this.landingTimer ||
      0
    ) -
      delta
  );

if (this.landingTimer <= 0) {
  this.lastHardLanding = false;
}

if (
  this.dashTimer > 0
) {
  this.player.play(
    'runner-dash',
    true
  );

  // ============================================================
  // PLAYER · DASH ENERGY STREAK
  // Visual only — does not modify dash physics.
  // ============================================================
  if (
    !this.motionReduced &&
    this.player?.active
  ) {
    this.dashFxTimer =
      Math.max(
        0,
       this.dashFxTimer -
        delta
      );

    if (
      this.dashFxTimer <= 0
    ) {
        // Trail always spawns behind the runner.
    const dashDirection =
  this.player.body?.velocity?.x >= 0
    ? 1
    : -1;

      const streak =
        this.add
          .circle(
            this.player.x -
              dashDirection * 10,
            this.player.y + 4,
            4,
            0x8df4ff,
            0.26
          )
          .setDepth(9);

      streak.scaleX = 1.8;
      streak.scaleY = 0.7;

      this.tweens.add({
        targets: streak,
        x:
          streak.x +
          dashDirection * 34,
        scaleX: 0.35,
        scaleY: 1.8,
        alpha: 0,
        duration: 120,
        ease: 'Quad.out',
        onComplete: () =>
          streak.destroy()
      });

      this.dashFxTimer = 38;
      }
  }
} else if (
  this.wallJumpTimer > 0
) {
  this.player.play(
    'runner-wall',
    true
  );

  // ============================================================
  // PLAYER · WALL JUMP VISUAL KICK
  // ============================================================
  if (
    !this.motionReduced &&
    this.wallJumpTimer > 0 &&
    this.wallJumpTimer > 95
  ) {
    const wallKick =
      this.add
        .circle(
          this.player.x,
          this.player.y,
          7,
          0x8df4ff,
          0.26
        )
        .setDepth(10);

    this.tweens.add({
      targets: wallKick,
      x:
        wallKick.x +
        (
          this.player.flipX
            ? 1
            : -1
        ) * 26,
      scaleX: 2.8,
      scaleY: 0.55,
      alpha: 0,
      duration: 150,
      ease: 'Quad.out',
      onComplete: () =>
        wallKick.destroy()
    });
  }
} else if (!onGround) {
  this.player.play(
    body.velocity.y < 0
      ? 'runner-jump'
      : 'runner-fall',
    true
  );
  
// ============================================================
// PLAYER · FAST FALL TRAIL
// ============================================================

if (
  body.velocity.y > 420 &&
  !this.motionReduced
) {
  this.fastFallFxTimer -= delta;

  if (
    this.fastFallFxTimer <= 0 &&
    this.player?.active
  ) {
    const fallTrail =
      this.add
        .circle(
          this.player.x,
          this.player.y - 24,
          5,
          0x8df4ff,
          0.16
        )
        .setDepth(8);

    this.tweens.add({
      targets: fallTrail,
      y:
        fallTrail.y + 28,
      scaleY: 2.4,
      scaleX: 0.7,
      alpha: 0,
      duration: 150,
      ease: 'Quad.out',
      onComplete: () => {
        if (
          fallTrail?.active
        ) {
          fallTrail.destroy();
        }
      }
    });

    this.fastFallFxTimer = 65;
  }
} else {
  this.fastFallFxTimer = 0;
}

  // ============================================================
// PLAYER · AIRBORNE POSE
// ============================================================

if (
  !this.motionReduced &&
  Math.abs(body.velocity.y) > 100
) {
const verticalSpeed =
  Math.abs(body.velocity.y);

const airRatio =
  Phaser.Math.Clamp(
    verticalSpeed /
      RUNNER_TUNING.maxFallSpeed,
    0,
    1
  );

// PLAYER · AIRBORNE APEX
const apexRatio =
  1 -
  Phaser.Math.Clamp(
    verticalSpeed / 180,
    0,
    1
  );

const rising =
  body.velocity.y < 0;

  // Airborne state is handled by the final SPEED LEAN / AIR TILT
  // transform below. No competing scale target is created here.
}
  
} else if (
  this.landingTimer > 0
) {
  this.player.play(
    'runner-land',
    true
  );
} else if (
  Math.abs(
    body.velocity.x
  ) > 35
) {
  this.player.play(
    'runner-run',
    true
  );
  // ============================================================
// PLAYER · RUN ANIMATION BOOST
// ============================================================

if (
  !this.motionReduced &&
  Math.abs(body.velocity.x) > 120
) {
  const runSpeed =
    Math.abs(body.velocity.x);

  const runPulse =
    Phaser.Math.Clamp(
      runSpeed /
        RUNNER_TUNING.maxRunSpeed,
      0,
      1
    );

  // Run speed is represented by animation rate.
  // Final visual scaling is handled by SPEED LEAN / AIR TILT below.

  const targetRunRate =
    Phaser.Math.Linear(
      11,
      17,
      runPulse
    );

  // Smooth animation-speed response.
  // Prevents visible stepping when player speed changes rapidly.
  this.runnerAnimRate =
    Phaser.Math.Linear(
      this.runnerAnimRate,
      targetRunRate,
      Math.min(
        1,
        delta * 0.012
      )
    );

 if (
  this.player.anims?.currentAnim?.key ===
  'runner-run'
) {
  this.player.anims.msPerFrame =
    1000 /
    this.runnerAnimRate;
}

/* -------------------------------------------------
   FOOTSTEP IMPACT
   Purely visual — synced to run animation.
   ------------------------------------------------- */

if (
  !this.motionReduced &&
  onGround &&
  Math.abs(body.velocity.x) > 90 &&
  this.player?.active &&
  this.player.anims?.currentAnim?.key ===
    'runner-run'
) {
  const currentFrame =
    this.player.anims.currentFrame?.index ??
    0;

  if (
    currentFrame !==
    this.lastRunFrame
  ) {
    const frameChanged =
      this.lastRunFrame !== -1;

    this.lastRunFrame =
      currentFrame;

    if (
      frameChanged &&
      (currentFrame === 0 ||
       currentFrame === 1)
    ) {
      const direction =
        Math.sign(body.velocity.x) || 1;

      const stepRatio =
        Phaser.Math.Clamp(
          Math.abs(body.velocity.x) /
            RUNNER_TUNING.maxRunSpeed,
          0,
          1
        );

      const stepX =
        this.player.x +
        direction * 4;

      const stepY =
        this.player.y + 30;

      const stepRing =
        this.add.circle(
          stepX,
          stepY,
          Phaser.Math.Linear(
            3.5,
            5.5,
            stepRatio
          ),
          0x8df4ff,
          Phaser.Math.Linear(
            0.20,
            0.34,
            stepRatio
          )
        )
        .setDepth(8);

      stepRing.setStrokeStyle(
        1.2,
        0xb9f5ff,
        0.72
      );

      this.tweens.add({
        targets: stepRing,
        scaleX: 2.5,
        scaleY: 0.55,
        alpha: 0,
        y: stepY + 3,
        duration: Phaser.Math.Linear(
          150,
          105,
          stepRatio
        ),
        ease: 'Quad.out',
        onComplete: () =>
          stepRing.destroy()
      });

      const spark =
        this.add.rectangle(
          stepX -
            direction * 3,
          stepY,
          Phaser.Math.Between(
            5,
            9
          ),
          1.5,
          0xe8fdff,
          Phaser.Math.Linear(
            0.22,
            0.48,
            stepRatio
          )
        )
        .setDepth(9);

      this.tweens.add({
        targets: spark,
        x:
          spark.x -
          direction *
            Phaser.Math.Between(
              10,
              18
            ),
        y:
          spark.y -
          Phaser.Math.Between(
            3,
            7
          ),
        alpha: 0,
        duration: 120,
        ease: 'Quad.out',
        onComplete: () =>
          spark.destroy()
      });
    }
  }
}
  
} else {
  this.player.play(
    'runner-idle',
    true
  );

// Run → idle uses the normal animation-state transition above.
// No additional transform is required here.
  
   // ============================================================
// PLAYER · SPEED LEAN / AIR TILT
// ============================================================

if (
  !this.motionReduced &&
  !this.cinematicActive &&
  !this.respawning &&
  !this.isPlayerTransformLocked &&
  this.player?.active &&
  this.player?.body
) {
  const vx =
    this.player.body?.velocity?.x || 0;

  const vy =
    this.player.body?.velocity?.y || 0;

  const speedRatio =
    Phaser.Math.Clamp(
      Math.abs(vx) /
        RUNNER_TUNING.maxRunSpeed,
      0,
      1
    );

  const targetAngle =
    Phaser.Math.Clamp(
      vx * 0.018,
      -8,
      8
    );

  // When nearly stationary, return to a clean neutral silhouette.
  const neutralizedAngle =
    speedRatio < 0.08
      ? 0
      : targetAngle;

  const targetScaleX =
    this.playerVisualBaseScaleX *
    (
      1 +
      speedRatio * 0.035
    );

  const targetScaleY =
    this.playerVisualBaseScaleY *
    (
      1 -
      speedRatio * 0.025
    );
const airTilt =
  Math.abs(vy) > 80 &&
  speedRatio > 0.12
    ? Phaser.Math.Clamp(
        vx * 0.008,
        -5,
        5
      )
    : 0;

const finalAngle =
  neutralizedAngle + airTilt;

this.player.angle =
  Phaser.Math.Linear(
    this.player.angle,
    finalAngle,
    Math.min(
      1,
      delta * 0.012
    )
  );

this.player.scaleX =
  Phaser.Math.Linear(
    this.player.scaleX,
    targetScaleX,
    Math.min(
      1,
      delta * 0.018
    )
  );

this.player.scaleY =
  Phaser.Math.Linear(
    this.player.scaleY,
    targetScaleY,
    Math.min(
      1,
      delta * 0.018
    )
  );
}
  
this.dustTimer =
  Math.max(
    0,
    this.dustTimer -
      delta
  );

if (
  this.graphicsLevel >= 1 &&
  onGround &&
  Math.abs(
    body.velocity.x
  ) > 100 &&
  this.dustTimer <= 0
) {
  this.dust.emitParticleAt(
    this.player.x,
    this.player.y + 28,
    1
  );

  this.dustTimer = 90;
}

this.speedTimer -= delta;
if (
  !this.motionReduced &&
  this.graphicsLevel >= 1 &&
  this.player?.active &&
  Math.abs(
    body.velocity.x
  ) > 280 &&
  this.speedTimer <= 0
) {
  const direction =
    Math.sign(body.velocity.x) || 1;

  const speedRatio =
    Phaser.Math.Clamp(
      Math.abs(body.velocity.x) /
        RUNNER_TUNING.maxRunSpeed,
      0,
      1
    );

  this.speedLines.emitParticleAt(
    this.player.x -
      direction * 12,
    this.player.y - 2,
    1
  );

  const runStreakLength =
    Phaser.Math.Linear(
      22,
      38,
      speedRatio
    );

  const runStreak =
    this.add.rectangle(
      this.player.x -
        direction *
          (18 + runStreakLength * .35),
      this.player.y - 2,
      runStreakLength,
      3,
      0x8df4ff,
      Phaser.Math.Linear(
        .18,
        .36,
        speedRatio
      )
    );

  runStreak.setDepth(9);

  this.tweens.add({
    targets: runStreak,
    scaleX: Phaser.Math.Linear(
      2.2,
      3.2,
      speedRatio
    ),
    alpha: 0,
    x:
      runStreak.x -
      direction *
        Phaser.Math.Linear(
          22,
          38,
          speedRatio
        ),
    duration: Phaser.Math.Linear(
      150,
      95,
      speedRatio
    ),
    ease: 'Quad.out',
  onComplete: () => {
  if (
    runStreak?.active
  ) {
    runStreak.destroy();
  }
}
  });

  this.speedTimer =
    Phaser.Math.Linear(
      52,
      32,
      speedRatio
    );
}

/* -------------------------------------------------
   DYNAMIC CAMERA FEEL
   ------------------------------------------------- */

const speed =
  Math.abs(
    body.velocity.x
  );



const parallaxBoost =
  !this.motionReduced
    ? Math.min(
        .09,
        Math.max(
          0,
          speed - 260
        ) / 2200
      )
    : 0;

if (
parallaxBoost !==
this.lastParallaxBoost
) {
this.lastParallaxBoost =
parallaxBoost;

this.parallaxLayers.forEach(
({ layer, base }) => {
layer.setScrollFactor(
base +
parallaxBoost
);
}
);
}

const velocityX =
  body.velocity.x;

const velocityY =
  body.velocity.y;

/*
 * ============================================================
 * SPEED-REACTIVE KINETIC TRAIL
 * Visual only — no physics changes.
 * ============================================================
 */

const speedAbs =
  Math.abs(velocityX);

const speedRatio =
  Phaser.Math.Clamp(
    speedAbs /
      RUNNER_TUNING.maxRunSpeed,
    0,
    1.8
  );

  if (
  !this.motionReduced &&
  speedRatio > 0.72 &&
  this.player?.active
) {
  this.kineticTrailTimer =
    Math.max(
      0,
      this.kineticTrailTimer -
        delta
    );

  if (
    this.kineticTrailTimer <= 0
  ) {
    this.kineticTrailTimer =
      Phaser.Math.Linear(
        90,
        42,
        Phaser.Math.Clamp(
          speedRatio - .72,
          0,
          1
        )
      );

    const direction =
      velocityX >= 0
        ? 1
        : -1;

    const streak =
      this.add
        .rectangle(
          this.player.x -
            direction * 24,
          this.player.y +
            Phaser.Math.Between(
              -10,
              10
            ),
          Phaser.Math.Linear(
            18,
            42,
            Phaser.Math.Clamp(
              speedRatio - .72,
              0,
              1
            )
          ),
          Phaser.Math.Between(
            1,
            3
          ),
          0x8df4ff,
          Phaser.Math.Linear(
            .10,
            .24,
            Phaser.Math.Clamp(
              speedRatio - .72,
              0,
              1
            )
          )
        )
        .setOrigin(.5)
        .setDepth(8);

    this.tweens.add({
      targets: streak,
      x:
        streak.x -
        direction * 38,
      scaleX: .35,
      alpha: 0,
      duration: 150,
      ease: 'Quad.out',
            onComplete: () =>
        streak.destroy()
    });
  }
}

/*
 * ============================================================
 * GROUND ENERGY FLOW
 * Purely visual — follows player movement.
 * ============================================================
 */

if (
  !this.motionReduced &&
  onGround &&
  Math.abs(velocityX) > 120 &&
  this.player?.active
) {
  this.groundFxTimer =
    Math.max(
      0,
      (this.groundFxTimer || 0) -
        delta
    );

  if (
    this.groundFxTimer <= 0
  ) {
    this.groundFxTimer =
      Phaser.Math.Linear(
        120,
        55,
        Phaser.Math.Clamp(
          speedRatio,
          0,
          1
        )
      );

    const direction =
      velocityX >= 0
        ? 1
        : -1;

    const groundLine =
      this.add
        .rectangle(
          this.player.x -
            direction * 18,
          this.player.y + 31,
          Phaser.Math.Between(
            18,
            34
          ),
          2,
          0x8df4ff,
          .24
        )
        .setOrigin(.5)
        .setDepth(7);

    this.tweens.add({
      targets: groundLine,
      x:
        groundLine.x -
        direction * Phaser.Math.Between(
          24,
          42
        ),
      scaleX: .35,
      alpha: 0,
      duration: 180,
      ease: 'Quad.out',
      onComplete: () =>
        groundLine.destroy()
    });
  }
}

const dashActive =
  this.dashTimer > 0;

const hardLanding =
  this.landingTimer > 0 &&
  this.lastHardLanding === true;

const wallJumpActive =
  this.wallJumpTimer > 0;

/* Look further into the direction of travel. */
let targetOffsetX = -58;

if (
  velocityX > 70
) {
  targetOffsetX =
    dashActive
      ? -190
      : -155;
} else if (
  velocityX < -70
) {
  targetOffsetX =
    dashActive
      ? 125
      : 95;
}

/* Vertical air anticipation. */
let targetOffsetY = 65;

if (
  velocityY < -110
) {
  targetOffsetY =
    Phaser.Math.Linear(
      18,
      4,
      Phaser.Math.Clamp(
        Math.abs(velocityY) /
        RUNNER_TUNING.jumpVelocity * -1,
        0,
        1
      )
    );

} else if (
  velocityY > 180
) {
  targetOffsetY =
    Phaser.Math.Linear(
      102,
      124,
      Phaser.Math.Clamp(
        velocityY /
        RUNNER_TUNING.maxFallSpeed,
        0,
        1
      )
    );

} else if (
  Math.abs(velocityY) <=
  RUNNER_TUNING.apexVelocityThreshold
) {
  targetOffsetY = 48;
}

/* Small extra framing during special movement states. */
if (wallJumpActive) {
  targetOffsetX +=
    velocityX > 0
      ? -18
      : 18;

  targetOffsetY = 42;
}

if (dashActive) {
  targetOffsetY =
    velocityY < 0
      ? 32
      : 72;
}

if (hardLanding) {
  targetOffsetY = 112;
}

let cinematicTargetZoom = 1;

/* ============================================================
 * FIRST PERSON CAMERA
 * C = THIRD PERSON / FIRST PERSON
 * ============================================================ */
if (this.firstPersonCamera) {
  targetOffsetX =
    velocityX >= 0
      ? -12
      : 12;

  targetOffsetY = 8;
  cinematicTargetZoom = 1.16;

  if (
    this.player?.active
  ) {
    this.player.setAlpha(0);
  }
}

if (!this.motionReduced) {
  if (speed > 520) {
    cinematicTargetZoom = 1.035;
  } else if (speed > 420) {
    cinematicTargetZoom = 1.026;
  } else if (speed > 330) {
    cinematicTargetZoom = 1.014;
  }
}

/* Dash gets the strongest framing push. */
if (
  dashActive &&
  !this.motionReduced
) {
  cinematicTargetZoom = 1.045;
}

/* Smooth camera motion. */
const directionChange =
  Math.abs(
    velocityX - this.cameraVelocityX
  );

const cameraLerpX =
  Math.min(
    1,
    delta *
      (
        dashActive
          ? .009
          : directionChange > 180
            ? .008
            : .0055
      )
  );

this.cameraVelocityX =
  velocityX;

const cameraLerpY =
  Math.min(
    1,
    delta *
      (
        hardLanding
          ? .012
          : .008
      )
  );

  // ============================================================
// CAMERA · SPEED ZOOM TARGET
// ============================================================

const speedZoom =
  !this.motionReduced
    ? Phaser.Math.Clamp(
        speed /
          RUNNER_TUNING.maxRunSpeed,
        0,
        1
      ) * 0.045
    : 0;

const speedZoomTarget =
  1 + speedZoom;

  const targetZoom = Math.max(
  cinematicTargetZoom,
  speedZoomTarget
);

const cameraLerpZoom =
  Math.min(
    1,
    delta *
      (
        dashActive
          ? .012
          : .0055
      )
  );

this.cameraOffsetX =
  Phaser.Math.Linear(
    this.cameraOffsetX,
    targetOffsetX,
    cameraLerpX
  );

this.cameraOffsetY =
  Phaser.Math.Linear(
    this.cameraOffsetY,
    targetOffsetY,
    cameraLerpY
  );

this.cameraZoom =
  Phaser.Math.Linear(
    this.cameraZoom,
    targetZoom,
    cameraLerpZoom
  );

this.cameras.main
  .setFollowOffset(
    this.cameraOffsetX,
    this.cameraOffsetY
  )
  .setZoom(
    this.cameraZoom
  );

if (this.blaster?.active && this.player?.active) {
  this.blaster.setPosition(
    this.player.x +
      (this.player.flipX ? -22 : 22),
    this.player.y + 4
  ).setFlipX(this.player.flipX);
}

this.updateChaser(
  delta
);

this.wasGrounded =
  onGround;

const deathY =
  Number.isFinite(this.mission?.deathY)
    ? this.mission.deathY
    : 850;

if (
  this.player.y > deathY &&
  !this.waterAttackActive
) {
  this.fail(
    'The route vanished below.'
  );
}

const spawnX =
  Number(this.mission?.spawn?.x) || 0;

const goalX =
  Number(this.mission?.goal?.x) ||
  spawnX + 1;

const progress =
  Phaser.Math.Clamp(
    Math.round(
      (
        (this.player.x - spawnX) /
        Math.max(1, goalX - spawnX)
      ) * 100
    ),
    0,
    100
  );

if (
  progress !==
  this.lastProgress
) {
  this.lastProgress =
    progress;

 if (
  this.objectiveProgressBar &&
  this.objectiveProgressText
) {
this.objectiveProgressBar.scaleX =
  progress / 100;

this.objectiveProgressText.setText(
  `${progress}%`
);

if (
  this.objectiveText &&
  this.objectiveText.active
) {
  this.objectiveText.setText(
    this.mission?.story?.arrival ||
    'REACH THE RELAY'
  );
}

if (
  this.objectiveHUD &&
  this.objectiveHUD.active
) {
  const objectiveText =
    this.mission?.story?.arrival ||
    'REACH THE RELAY';

  const checkpointCount =
    this.checkpoints?.countActive
      ? this.checkpoints.countActive(true)
      : 0;

  const completed =
    this.checkpoint?.signals?.size || 0;

  if (
    checkpointCount > 0 &&
    completed > 0 &&
    progress < 100
  ) {
    this.objectiveHUD.list
      .find(
        item =>
          item?.type === 'Text' &&
          item.y === 25
      )
      ?.setText(
        `${objectiveText} · CHECKPOINT ${Math.min(
          completed + 1,
          checkpointCount
        )}`
      );
  }
}
  }
}

    }
  }
}

  }
}
    }
  }
