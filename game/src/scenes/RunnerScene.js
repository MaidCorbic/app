import Phaser from 'phaser';
import { packages } from '../packages.js';
import { rivalAppearances } from '../world-content.js';
import { enemyIntel, signatureThreats } from '../enemy-intel.js';
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
    jumpVelocity: -820,
    doubleJumpVelocity: -880,
    jumpCutMultiplier: 0.58,
    coyoteMs: 135,
    jumpBufferMs: 145,
    riseGravity: 520,
    fallGravity: 760,
    fallGravityBoost: 1.12,
    maxFallSpeed: 1120,
    apexVelocityThreshold: 70,
    apexGravityMultiplier: 0.72,
    fallRampStart: 260,
    fallRampMax: 760,
    fallRampBonus: 1.18,
    dashSpeed: 780,
    dashDurationMs: 165,
    dashCooldownMs: 520,
    airDashRecoveryVelocity: 90,
  },
  DISTRICT_VISUALS = {
    'first-delivery': {
      skyline: 528671,
      building: 1057850,
      window: 6219775,
      accent: 55807,
      label: 'OLD QUARTER',
      props: 'lanterns',
    },
    'dead-drop': {
      skyline: 660514,
      building: 1518144,
      window: 16757844,
      accent: 16742981,
      label: 'SALT DOCKS',
      props: 'docks',
    },
    blackout: {
      skyline: 330517,
      building: 727081,
      window: 6747391,
      accent: 60159,
      label: 'GRID NINE',
      props: 'emergency',
    },
    pursuit: {
      skyline: 725024,
      building: 1582402,
      window: 7981567,
      accent: 16733028,
      label: 'RAIL SPINE',
      props: 'rail',
    },
    'signal-storm': {
      skyline: 856098,
      building: 1777728,
      window: 12099839,
      accent: 10181887,
      label: 'CROWN ARRAY',
      props: 'array',
    },
    'corporate-lockdown': {
      skyline: 1119522,
      building: 2108221,
      window: 16766826,
      accent: 16734799,
      label: 'HELIX TOWER',
      props: 'rail',
    },
    'final-relay': {
      skyline: 854808,
      building: 1777716,
      window: 16770721,
      accent: 16761415,
      label: 'APEX SPINE',
      props: 'array',
    },
  };
export class RunnerScene extends Phaser.Scene {
  canRenderDecoration(e = 1) {
    const t = Number.isFinite(this.graphicsLevel) ? this.graphicsLevel : 2;
    return !this.motionReduced && t >= e && !1 !== this.scene?.isActive?.();
  }
  getDecorationLimit(e = 100) {
    const t = Number.isFinite(this.graphicsLevel) ? this.graphicsLevel : 2;
    return t <= 0 ? 0 : 1 === t ? Math.min(e, 24) : 2 === t ? Math.min(e, 60) : Math.min(e, 100);
  }
  constructor() {
    (super('runner'), (this.voiceEnabled = !0), (this.voiceVolume = 1), (this.voiceVoiceName = ''));
    try {
      if ('undefined' != typeof window && window.localStorage) {
        const e = window.localStorage.getItem('runner_voice_enabled'),
          t = Number(window.localStorage.getItem('runner_voice_volume')),
          i = window.localStorage.getItem('runner_voice_name');
        (null !== e && (this.voiceEnabled = '1' === e),
          Number.isFinite(t) && (this.voiceVolume = Phaser.Math.Clamp(t, 0, 1)),
          'string' == typeof i && (this.voiceVoiceName = i));
      }
    } catch (e) {
      console.warn('[AI VOICE] Failed to load saved settings:', e);
    }
    ((this.voiceQueue = []),
      (this.voiceSpeaking = !1),
      (this.voiceVoicesChangedHandler = null),
      (this.voicePreviousVoicesChangedHandler = null),
      (this.voiceLastText = ''),
      (this.voiceLastTextAt = 0),
      (this.voiceLastAt = 0),
      (this.voiceCooldownMs = 1800),
      (this.voiceRepeatLockMs = 2600),
      (this.voiceVoices = []),
      (this.voiceProfile = { type: 'MISSION', rate: 1.02, pitch: 0.92, volume: 0.82 }));
  }
  setVoiceEnabled(e) {
    this.voiceEnabled = Boolean(e);
    try {
      'undefined' != typeof window &&
        window.localStorage &&
        window.localStorage.setItem('runner_voice_enabled', this.voiceEnabled ? '1' : '0');
    } catch (e) {
      console.warn('[AI VOICE] Failed to save enabled state:', e);
    }
    this.voiceEnabled ||
      ((this.voiceQueue = []),
      'undefined' != typeof window &&
        'speechSynthesis' in window &&
        window.speechSynthesis.cancel(),
      (this.voiceSpeaking = !1),
      (this.voiceSerial = (this.voiceSerial || 0) + 1));
  }
  setVoiceVolume(e) {
    const t = Number(e);
    if (Number.isFinite(t)) {
      this.voiceVolume = Phaser.Math.Clamp(t, 0, 1);
      try {
        'undefined' != typeof window &&
          window.localStorage &&
          window.localStorage.setItem('runner_voice_volume', String(this.voiceVolume));
      } catch (e) {
        console.warn('[AI VOICE] Failed to save volume:', e);
      }
    }
  }
  setVoiceByName(e) {
    if ('string' == typeof e) {
      this.voiceVoiceName = e.trim();
      try {
        'undefined' != typeof window &&
          window.localStorage &&
          window.localStorage.setItem('runner_voice_name', this.voiceVoiceName);
      } catch (e) {
        console.warn('[AI VOICE] Failed to save voice:', e);
      }
    }
  }
  setGraphicsQuality(e) {
    const t = String(e || '')
      .trim()
      .toUpperCase();
    if (!['LOW', 'MEDIUM', 'HIGH', 'ULTRA'].includes(t)) return !1;
    ((this.graphicsQuality = t),
      (this.graphicsLevel = { LOW: 0, MEDIUM: 1, HIGH: 2, ULTRA: 3 }[t]),
      (this.motionReduced = this.motionReduced || 0 === this.graphicsLevel),
      (this.graphicsSettings = {
        quality: t,
        level: this.graphicsLevel,
        effects: !0,
        particles: this.graphicsLevel >= 1,
        lighting: this.graphicsLevel >= 2,
        weather: this.graphicsLevel >= 1,
      }));
    try {
      'undefined' != typeof window &&
        window.localStorage &&
        window.localStorage.setItem('runner_graphics_quality', t);
    } catch (e) {
      console.warn('[GRAPHICS] Failed to save quality:', e);
    }
    return (
      this.applyGraphicsSettings(),
      this.game.events.emit('graphics-settings-changed', this.graphicsSettings),
      !0
    );
  }
  getGraphicsSettings() {
    return {
      ...(this.graphicsSettings || {}),
      quality: this.graphicsQuality || 'HIGH',
      level: Number.isFinite(this.graphicsLevel) ? this.graphicsLevel : 2,
    };
  }
  applyGraphicsSettings() {
    const e = this.graphicsQuality || 'HIGH',
      t = Number.isFinite(this.graphicsLevel) ? this.graphicsLevel : 2,
      i = Number.isFinite(this._appliedGraphicsLevel) ? this._appliedGraphicsLevel : null,
      s = null !== i && i >= 2,
      a = t >= 2;
    this.graphicsSettings = {
      quality: e,
      level: t,
      effects: !0,
      particles: t >= 1,
      lighting: t >= 2,
      weather: t >= 1,
    };
    const l = Boolean(this.rainEnabled && t >= 1);
    return (
      this.rain?.setVisible(l),
      this.dust?.setVisible(t >= 1),
      this.speedLines?.setVisible(t >= 1),
      this.weatherOverlay &&
        'function' == typeof this.weatherOverlay.setAlpha &&
        this.weatherOverlay.setAlpha(t >= 1 ? 0.045 : 0),
      s && !a && this.clearWaterWaves(),
      null !== i &&
        !s &&
        a &&
        !this.motionReduced &&
        this.waterZones &&
        this.mission?.waterZones &&
        this.createWaterWaves(),
      (this._appliedGraphicsLevel = t),
      this.game.events.emit('graphics-settings-applied', this.graphicsSettings),
      this.graphicsSettings
    );
  }
  getVoiceSettings() {
    return { enabled: this.voiceEnabled, volume: this.voiceVolume, voiceName: this.voiceVoiceName };
  }
  testVoice() {
    if (!this.voiceEnabled) return;
    if ('undefined' == typeof window || !('speechSynthesis' in window))
      return void console.warn('[AI VOICE] Speech synthesis is not available.');
    (window.speechSynthesis.cancel(),
      (this.voiceSpeaking = !1),
      (this.voiceSerial = (this.voiceSerial || 0) + 1),
      (this.voiceQueue = []),
      (this.voiceLastText = ''),
      (this.voiceLastTextAt = 0),
      (this.voiceLastAt = 0),
      this.speakNarration('SYSTEM ONLINE. VOICE COMMS READY.'));
  }
  speakNarration(e) {
    if (
      !this.voiceEnabled ||
      'undefined' == typeof window ||
      !('speechSynthesis' in window) ||
      'string' != typeof e
    )
      return;
    const t = e.replace(/\s+/g, ' ').trim();
    if (!t) return;
    const i = {
        'PERFECT DODGE': ['PERFECT DODGE', 'PERFECT', 'CLEAN DODGE'],
        'LOW HEALTH': ['LOW HEALTH', 'HEALTH CRITICAL', 'WARNING LOW HEALTH'],
        OVERDRIVE: ['OVERDRIVE', 'OVERDRIVE ACTIVE', 'MAXIMUM OUTPUT'],
        'BOSS ENGAGED': ['BOSS ENGAGED', 'BOSS TARGET ACQUIRED', 'BOSS CONTACT'],
        'BOSS PHASE TWO': ['BOSS PHASE TWO', 'PHASE TWO', 'SECOND PHASE'],
        'FINAL ENRAGE': ['FINAL ENRAGE', 'ENRAGE PROTOCOL', 'FINAL PHASE'],
        'BOSS DEFEATED': ['BOSS DEFEATED', 'TARGET ELIMINATED', 'THREAT ELIMINATED'],
      }[t],
      s = Array.isArray(i) && i.length ? i[Phaser.Math.Between(0, i.length - 1)] : t,
      a = this.time?.now ?? Date.now(),
      l = Number.isFinite(this.voiceLastTextAt) ? this.voiceLastTextAt : 0,
      r = Number.isFinite(this.voiceRepeatLockMs) ? this.voiceRepeatLockMs : 2600;
    if (this.voiceLastText === s && a - l < r) return;
    ((this.voiceLastText = s), (this.voiceLastTextAt = a));
    const o = s.toUpperCase();
    let n = { type: 'MISSION', rate: 1.02, pitch: 0.92, volume: 0.82 };
    (o.includes('BOSS') || o.includes('TARGET ACQUIRED') || o.includes('FINAL')
      ? (n = { type: 'BOSS', rate: 0.94, pitch: 0.78, volume: 1 })
      : o.includes('CRITICAL') ||
          o.includes('DANGER') ||
          o.includes('LOW HEALTH') ||
          o.includes('DETECTED')
        ? (n = { type: 'CRITICAL', rate: 1.1, pitch: 0.84, volume: 1 })
        : o.includes('OVERDRIVE')
          ? (n = { type: 'COMBAT', rate: 1.04, pitch: 1, volume: 0.96 })
          : o.includes('DODGE') || o.includes('COMBO') || o.includes('KILL') || o.includes('HUNT')
            ? (n = { type: 'COMBAT', rate: 1.08, pitch: 0.98, volume: 0.9 })
            : (o.includes('TUTORIAL') || o.includes('TAP') || o.includes('PRESS')) &&
              (n = { type: 'TUTORIAL', rate: 0.98, pitch: 1.02, volume: 0.74 }),
      (this.voiceProfile = n));
    const h =
        'BOSS' === n.type
          ? 4
          : 'CRITICAL' === n.type
            ? 3
            : 'COMBAT' === n.type
              ? 2
              : 'MISSION' === n.type
                ? 1
                : 0,
      d = this.time?.now ?? Date.now(),
      c = Number.isFinite(this.voiceLastAt) ? this.voiceLastAt : 0,
      y = Number.isFinite(this.voiceCooldownMs) ? this.voiceCooldownMs : 1800,
      p = h >= 3;
    if (
      (p &&
        this.voiceSpeaking &&
        'undefined' != typeof window &&
        'speechSynthesis' in window &&
        ((this.voiceSerial = (this.voiceSerial || 0) + 1),
        window.speechSynthesis.cancel(),
        (this.voiceSpeaking = !1)),
      !p && d - c < y)
    )
      return;
    if (this.voiceQueue.some((e) => e?.text === s)) return;
    ((this.voiceLastAt = d), this.voiceQueue.length >= 4 && this.voiceQueue.shift());
    const f = { text: s, profile: n, priority: h };
    (this.voiceQueue.push(f),
      this.voiceQueue.sort((e, t) => (t?.priority || 0) - (e?.priority || 0)),
      h >= 3 && (this.voiceQueue = this.voiceQueue.filter((e) => (e?.priority || 0) >= h)),
      this.voiceQueue.length > 4 && (this.voiceQueue = this.voiceQueue.slice(0, 4)),
      this.pumpNarrationVoice());
  }
  pumpNarrationVoice() {
    if (
      !this.voiceEnabled ||
      this.voiceSpeaking ||
      !this.voiceQueue.length ||
      'undefined' == typeof window ||
      !('speechSynthesis' in window)
    )
      return;
    let e = null;
    for (; this.voiceQueue.length;) {
      const t = this.voiceQueue.shift();
      if (t && 'string' == typeof t.text && t.text.trim()) {
        e = t;
        break;
      }
    }
    if (!e) return;
    const t = e.text,
      i = e.profile || { type: 'MISSION', rate: 1.02, pitch: 0.92, volume: 0.82 };
    this.voiceSpeaking = !0;
    const s = (this.voiceSerial || 0) + 1;
    this.voiceSerial = s;
    const a = window.SpeechSynthesisUtterance || globalThis.SpeechSynthesisUtterance;
    if ('function' != typeof a) return void (this.voiceSpeaking = !1);
    const l = new a(t);
    ((l.lang = 'en-US'),
      (l.rate = Number.isFinite(i.rate) ? i.rate : 1.02),
      (l.pitch = Number.isFinite(i.pitch) ? i.pitch : 0.92));
    const r = Number.isFinite(i.volume) ? i.volume : 0.82,
      o = Number.isFinite(this.voiceVolume) ? this.voiceVolume : 1;
    l.volume = Phaser.Math.Clamp(r * o, 0, 1);
    const n =
        Array.isArray(this.voiceVoices) && this.voiceVoices.length
          ? this.voiceVoices
          : window.speechSynthesis.getVoices(),
      h =
        (this.voiceVoiceName ? n.find((e) => e.name === this.voiceVoiceName) : null) ||
        n.find(
          (e) => 'en-US' === e.lang && /Google|Microsoft|Natural|Samantha|Alex/i.test(e.name || ''),
        ) ||
        n.find((e) => 'en-US' === e.lang) ||
        n.find((e) => e.lang?.startsWith('en'));
    h && (l.voice = h);
    const d = this.voiceSerial || 0,
      c = (e = 0) => {
        (this.voiceSerial || 0) === d &&
          ((this.scene?.isActive && !this.scene.isActive()) ||
            ((this.voiceSpeaking = !1),
            this.time?.delayedCall(e, () => {
              (this.voiceSerial || 0) === d &&
                ((this.scene?.isActive && !this.scene.isActive()) || this.pumpNarrationVoice());
            })));
      };
    ((l.onend = () => {
      c(180);
    }),
      (l.onerror = () => {
        c(120);
      }));
    try {
      window.speechSynthesis.speak(l);
    } catch (e) {
      (console.warn('[AI VOICE] speechSynthesis.speak failed:', e),
        (this.voiceSpeaking = !1),
        this.time?.delayedCall(100, () => this.pumpNarrationVoice()));
    }
  }
  setupNarrationVoice() {
    if ('undefined' == typeof window || !window.speechSynthesis) return;
    (this.narrationHandler && this.game.events.off('narration', this.narrationHandler),
      (this.narrationHandler = (e) => {
        this.speakNarration(e);
      }),
      this.game.events.on('narration', this.narrationHandler));
    const e = () => {
      const e = window.speechSynthesis.getVoices();
      this.voiceVoices = Array.isArray(e) ? e : [];
    };
    (e(),
      'function' == typeof window.speechSynthesis.addEventListener &&
        ((this.voiceVoicesChangedHandler = e),
        window.speechSynthesis.addEventListener('voiceschanged', this.voiceVoicesChangedHandler)));
  }
  createTextures() {
    const e = (e, t, i, s) => {
        if (
          'string' != typeof e ||
          !Number.isFinite(t) ||
          !Number.isFinite(i) ||
          'function' != typeof s
        )
          return;
        if (this.textures.exists(e)) return;
        const a = this.make.graphics({ add: !1 });
        try {
          (s(a), a.generateTexture(e, Math.max(1, Math.floor(t)), Math.max(1, Math.floor(i))));
        } finally {
          a.destroy();
        }
      },
      t = (t, i, s, a) =>
        e(t, 48, 64, (e) => {
          const t = 463133,
            l = 1253168,
            r = 1913160,
            o = 2703966,
            n = 8426920,
            h = 16055295,
            d = 397339,
            c = 8318975,
            y = 15334911,
            p = 16765038,
            f = 16735086;
          (e.fillStyle(c, 0.035).fillCircle(24, 31, 27),
            e.fillStyle(c, 0.055).fillCircle(24, 29, 22),
            e.fillStyle(t).fillRoundedRect(8, 24, 10, 22, 4),
            e.fillStyle(r).fillRoundedRect(9, 26, 8, 18, 3),
            e.lineStyle(1.2, c, 0.55).strokeRoundedRect(9, 26, 8, 18, 3),
            e.fillStyle(c, 0.18).fillRoundedRect(10, 30, 5, 9, 2),
            e.fillStyle(y, 0.8).fillRect(11, 32, 3, 5),
            e.fillStyle(t).fillRoundedRect(19, 17, 10, 9, 3),
            e.fillStyle(o).fillRoundedRect(20, 18, 8, 7, 2),
            e.fillStyle(c, 0.45).fillRect(21, 19, 6, 1.5),
            e.fillStyle(c, 0.08).fillCircle(24, 11, 13),
            e.fillStyle(c, 0.045).fillCircle(24, 11, 16),
            e.fillStyle(t).fillRoundedRect(14, 3, 20, 16, 6),
            e.fillStyle(l).fillRoundedRect(15, 4, 18, 13, 5),
            e.fillStyle(o).fillRoundedRect(17, 5, 14, 7, 4),
            e.fillStyle(n, 0.72).fillRoundedRect(19, 4, 10, 2.5, 1.2),
            e.fillStyle(h, 0.18).fillRect(20, 5, 6, 1),
            e.fillStyle(r).fillRoundedRect(12, 9, 5, 7, 2).fillRoundedRect(31, 9, 5, 7, 2),
            e
              .lineStyle(1, c, 0.55)
              .strokeRoundedRect(12, 9, 5, 7, 2)
              .strokeRoundedRect(31, 9, 5, 7, 2),
            e.fillStyle(y, 0.82).fillRect(13, 11, 2, 1).fillRect(33, 11, 2, 1),
            e.fillStyle(d).fillRoundedRect(13, 11, 22, 7, 3),
            e.fillStyle(r, 0.7).fillRoundedRect(14, 12, 20, 4, 2),
            e.lineStyle(1.2, c, 0.88).strokeRoundedRect(13, 11, 22, 7, 3),
            e.fillStyle(c, 0.48).fillRoundedRect(16, 13, 16, 2.5, 1.2),
            e.fillStyle(y, 0.92).fillRoundedRect(18, 13.5, 11, 1.2, 0.6),
            e.lineStyle(1, h, 0.22).lineBetween(16, 12.3, 23, 12.3),
            e.fillStyle(t).fillRoundedRect(9, 23, 11, 10, 3).fillRoundedRect(28, 23, 11, 10, 3),
            e.fillStyle(r).fillRoundedRect(10, 23, 10, 8, 3).fillRoundedRect(28, 23, 10, 8, 3),
            e
              .lineStyle(1.4, n, 0.5)
              .strokeRoundedRect(10, 23, 10, 8, 3)
              .strokeRoundedRect(28, 23, 10, 8, 3),
            e.fillStyle(c, 0.65).fillRect(12, 25, 6, 1.5).fillRect(30, 25, 6, 1.5),
            e.fillStyle(p, 0.78).fillRect(12, 28, 4, 1).fillRect(32, 28, 4, 1),
            e.fillStyle(t).fillRoundedRect(12, 21, 24, 27, 6),
            e.fillStyle(l).fillRoundedRect(13, 22, 22, 24, 5),
            e.fillStyle(o).fillRoundedRect(16, 24, 16, 10, 4),
            e.fillStyle(r).fillRoundedRect(17, 31, 14, 13, 3),
            e.lineStyle(1, n, 0.35).strokeRoundedRect(17, 31, 14, 13, 3),
            e.fillStyle(r).fillRoundedRect(14, 33, 3, 9, 1.5).fillRoundedRect(31, 33, 3, 9, 1.5),
            e.fillStyle(c, 0.12).fillCircle(24, 37, 8),
            e.fillStyle(c, 0.18).fillCircle(24, 37, 6),
            e.lineStyle(1.2, c, 0.82).strokeCircle(24, 37, 5),
            e.lineStyle(1, h, 0.5).strokeCircle(24, 37, 3.5),
            e.fillStyle(y, 0.95).fillCircle(24, 37, 2.3),
            e.fillStyle(h, 0.9).fillCircle(23.2, 36.1, 0.9),
            e
              .lineStyle(1, c, 0.45)
              .lineBetween(24, 29, 24, 32)
              .lineBetween(24, 42, 24, 45)
              .lineBetween(16, 37, 19, 37)
              .lineBetween(29, 37, 32, 37),
            e.fillStyle(t).fillRoundedRect(18, 42, 12, 8, 2.5),
            e.fillStyle(o).fillRoundedRect(19, 43, 10, 5, 2),
            e.fillStyle(c, 0.5).fillRect(21, 44, 6, 1),
            e.fillStyle(t).fillRoundedRect(14, 46, 20, 5, 2),
            e.fillStyle(r).fillRoundedRect(15, 46, 18, 3, 1.2),
            e.fillStyle(p, 0.9).fillRoundedRect(20, 46, 8, 2, 0.8),
            e.fillStyle(y, 0.85).fillRect(23, 46.4, 3, 1),
            e.fillStyle(f, 0.72).fillRoundedRect(15, 45, 3, 3, 1),
            e.fillStyle(c, 0.72).fillRoundedRect(30, 45, 3, 3, 1));
          const u = 14,
            m = 29,
            g = { x: 9, y: a },
            S = 34,
            w = 29,
            x = { x: 39, y: 42 - a / 5 };
          (e.lineStyle(7, t, 0.98).lineBetween(u, m, g.x, g.y),
            e.lineStyle(4.6, o, 0.98).lineBetween(u, m, g.x, g.y),
            e.lineStyle(7, t, 0.98).lineBetween(S, w, x.x, x.y),
            e.lineStyle(4.6, o, 0.98).lineBetween(S, w, x.x, x.y),
            e.fillStyle(r).fillCircle(g.x, g.y, 3).fillCircle(x.x, x.y, 3),
            e.lineStyle(1, n, 0.55).strokeCircle(g.x, g.y, 2.6).strokeCircle(x.x, x.y, 2.6),
            e
              .lineStyle(1.5, c, 0.75)
              .lineBetween(g.x + 1, g.y, g.x - 2, g.y + 5)
              .lineBetween(x.x - 1, x.y, x.x + 2, x.y + 4),
            e
              .fillStyle(t)
              .fillRoundedRect(g.x - 4, g.y + 3, 7, 5, 2)
              .fillRoundedRect(x.x - 3, x.y + 3, 7, 5, 2),
            e
              .fillStyle(c, 0.8)
              .fillRect(g.x - 2, g.y + 4, 3, 1)
              .fillRect(x.x - 1, x.y + 4, 3, 1));
          const b = 19,
            C = 47,
            R = 29,
            k = 47,
            D = Phaser.Math.Clamp(i - 8, 45, 55),
            v = Phaser.Math.Clamp(s - 8, 45, 55),
            T = { x: 17, y: D },
            E = { x: 33, y: v };
          (e.lineStyle(9, t, 0.98).lineBetween(b, C, T.x, T.y).lineBetween(R, k, E.x, E.y),
            e.lineStyle(6, o, 0.98).lineBetween(b, C, T.x, T.y).lineBetween(R, k, E.x, E.y),
            e.fillStyle(r).fillCircle(T.x, T.y, 4).fillCircle(E.x, E.y, 4),
            e.lineStyle(1, c, 0.62).strokeCircle(T.x, T.y, 3.4).strokeCircle(E.x, E.y, 3.4),
            e
              .lineStyle(2, c, 0.68)
              .lineBetween(T.x, T.y + 2, T.x - 1, T.y + 7)
              .lineBetween(E.x, E.y + 2, E.x + 1, E.y + 7));
          const O = Phaser.Math.Clamp(D + 8, 51, 57),
            A = Phaser.Math.Clamp(v + 8, 51, 57);
          (e
            .fillStyle(t)
            .fillRoundedRect(11, O - 2, 11, 6, 2)
            .fillRoundedRect(27, A - 2, 11, 6, 2),
            e
              .fillStyle(l)
              .fillRoundedRect(12, O - 1, 9, 4, 1.5)
              .fillRoundedRect(28, A - 1, 9, 4, 1.5),
            e.fillStyle(o).fillRoundedRect(12, O, 7, 2, 1).fillRoundedRect(28, A, 7, 2, 1),
            e
              .fillStyle(c, 0.85)
              .fillRoundedRect(13, O + 2, 6, 1, 0.5)
              .fillRoundedRect(29, A + 2, 6, 1, 0.5),
            e
              .lineStyle(1, n, 0.3)
              .lineBetween(16, 26, 16, 29)
              .lineBetween(32, 26, 32, 29)
              .lineBetween(15, 39, 18, 39)
              .lineBetween(30, 39, 33, 39),
            e.fillStyle(p, 0.65).fillRect(18, 27, 3, 1).fillRect(27, 27, 3, 1));
          const M = Math.min(1, Math.abs(i - s) / 12 + Math.abs(a - 40) / 30);
          (e.fillStyle(c, 0.16 + 0.1 * M).fillCircle(24, 37, 9),
            e.fillStyle(y, 0.35 + 0.2 * M).fillCircle(24, 37, 1.5),
            e
              .fillStyle(h, 0.65)
              .fillRect(28, 6, 2, 1)
              .fillRect(18, 20, 2, 1)
              .fillRect(29, 41, 2, 1),
            e
              .lineStyle(1, c, 0.28)
              .lineBetween(16, 18, 13, 23)
              .lineBetween(32, 18, 35, 23)
              .lineBetween(14, 43, 18, 47)
              .lineBetween(34, 43, 30, 47));
        });
    (t('runner-idle', 60, 60, 40),
      t('runner-run-a', 56, 63, 50),
      t('runner-run-b', 63, 56, 27),
      t('runner-jump', 54, 54, 30),
      t('runner-fall', 62, 62, 58),
      t('runner-land', 55, 55, 42),
      t('runner-dash', 54, 54, 22),
      t('runner-wall', 56, 62, 18),
      t('runner-hit', 62, 62, 62),
      t('runner-finish', 50, 50, 18),
      e('signal', 56, 56, (e) => {
        (e.fillStyle(16765038, 0.08).fillCircle(28, 28, 27),
          e.fillStyle(16765038, 0.2).fillCircle(28, 28, 20),
          e
            .lineStyle(2, 16770726, 0.85)
            .strokeCircle(28, 28, 15)
            .lineBetween(28, 6, 28, 15)
            .lineBetween(28, 41, 28, 50),
          e.fillStyle(16770982).fillCircle(28, 28, 8),
          e.fillStyle(16745070).fillCircle(28, 28, 3));
      }),
      e('shark', 96, 42, (e) => {
        (e.fillStyle(5826559, 0.08).fillEllipse(48, 22, 92, 34),
          e.fillStyle(1587019).fillEllipse(48, 23, 78, 22),
          e.fillStyle(9353416).fillEllipse(53, 27, 48, 10),
          e.fillStyle(1587019).fillTriangle(42, 14, 51, 2, 58, 15),
          e
            .fillStyle(1587019)
            .fillTriangle(10, 22, 0, 10, 12, 29)
            .fillTriangle(10, 23, 0, 36, 16, 28),
          e.fillStyle(16765038).fillCircle(78, 20, 3),
          e.fillStyle(16777215).fillCircle(79, 19, 1),
          e.lineStyle(1.5, 14679295, 0.8).lineBetween(61, 29, 84, 29),
          e
            .fillStyle(16777215, 0.88)
            .fillTriangle(66, 29, 69, 34, 72, 29)
            .fillTriangle(73, 29, 76, 34, 79, 29));
      }),
      e('barrier', 48, 64, (e) => {
        (e.fillStyle(16733028, 0.08).fillRoundedRect(0, 0, 48, 64, 6),
          e.fillStyle(858152).fillRoundedRect(3, 3, 42, 58, 6),
          e.fillStyle(1451579).fillRoundedRect(7, 7, 34, 50, 4),
          e.lineStyle(2.5, 16733028, 0.95).strokeRoundedRect(4, 4, 40, 56, 5),
          e.lineStyle(1, 16745070, 0.55).strokeRoundedRect(8, 8, 32, 48, 3),
          e.lineStyle(2, 16745070, 0.8).lineBetween(7, 8, 41, 56).lineBetween(41, 8, 7, 56),
          e.fillStyle(16733028, 0.14).fillRoundedRect(14, 28, 20, 8, 3),
          e.fillStyle(16733028, 0.95).fillRect(17, 31, 14, 2),
          e
            .fillStyle(16765038)
            .fillCircle(9, 10, 2)
            .fillCircle(39, 10, 2)
            .fillCircle(9, 54, 2)
            .fillCircle(39, 54, 2));
      }),
      e('goal', 56, 68, (e) => {
        (e.fillStyle(16765038, 0.1).fillCircle(28, 30, 27),
          e.fillStyle(9303295, 0.07).fillCircle(28, 30, 22),
          e.lineStyle(4, 15265266, 0.95).lineBetween(10, 66, 10, 4),
          e.lineStyle(1.5, 12175317, 0.7).lineBetween(14, 64, 14, 8),
          e.fillStyle(9136677, 0.45).fillTriangle(13, 10, 49, 22, 13, 37),
          e.fillStyle(16765038).fillTriangle(12, 8, 48, 20, 12, 35),
          e.fillStyle(16773301, 0.9).fillTriangle(14, 11, 42, 20, 14, 29),
          e.lineStyle(2, 9303295, 0.9).lineBetween(19, 19, 31, 19).lineBetween(25, 15, 25, 28),
          e.fillStyle(16777215, 0.95).fillCircle(10, 4, 2),
          e.fillStyle(9303295, 0.6).fillCircle(10, 4, 4));
      }),
      e('rain', 8, 14, (e) => {
        (e.lineStyle(2, 14281215, 0.42).lineBetween(6, 0, 1, 13),
          e.lineStyle(1, 16777215, 0.18).lineBetween(7, 1, 3, 11));
      }),
      e('dust', 10, 10, (e) => {
        (e.fillStyle(14080994, 0.18).fillCircle(5, 5, 5),
          e.fillStyle(15265266, 0.72).fillCircle(5, 5, 2.5));
      }),
      e('speed-line', 32, 3, (e) =>
        e
          .fillGradientStyle(15269375, 9303295, 9303295, 15269375, 0.15, 0.9, 0.9, 0.15)
          .fillRoundedRect(0, 0, 32, 3, 1.5),
      ),
      e('boost-pad', 58, 18, (e) => {
        (e.fillStyle(9303295, 0.08).fillRoundedRect(0, 1, 58, 17, 5),
          e.fillStyle(924460).fillRoundedRect(1, 2, 56, 15, 4),
          e.fillStyle(1518400).fillRoundedRect(5, 5, 48, 9, 3),
          e.lineStyle(2, 9303295, 0.95).strokeRoundedRect(2, 3, 54, 13, 4),
          e
            .fillStyle(9303295, 0.95)
            .fillTriangle(8, 13, 18, 5, 28, 13)
            .fillTriangle(25, 13, 35, 5, 45, 13),
          e
            .fillStyle(15269375, 0.9)
            .fillTriangle(11, 11, 18, 6, 25, 11)
            .fillTriangle(28, 11, 35, 6, 42, 11),
          e.fillStyle(9303295, 0.18).fillCircle(29, 9, 7),
          e.fillStyle(15269375).fillCircle(29, 9, 2.5));
      }),
      e('chaser', 52, 60, (e) => {
        (e.fillStyle(16733028, 0.07).fillCircle(26, 29, 26),
          e.fillStyle(16745070, 0.14).fillCircle(26, 28, 22),
          e.fillStyle(726822).fillRoundedRect(8, 7, 36, 45, 9),
          e.fillStyle(1517629).fillRoundedRect(12, 11, 28, 36, 7),
          e.lineStyle(2.5, 16733028, 0.95).strokeRoundedRect(9, 8, 34, 43, 8),
          e.fillStyle(16733028, 0.14).fillRoundedRect(14, 17, 24, 10, 4),
          e.fillStyle(16745070).fillRect(16, 20, 20, 4),
          e.fillStyle(16769192).fillRect(19, 21, 14, 2),
          e.fillStyle(9303295, 0.22).fillRoundedRect(16, 34, 20, 5, 2),
          e.fillStyle(9303295, 0.9).fillRect(19, 35, 14, 2),
          e.fillStyle(16765038).fillCircle(13, 44, 1.5).fillCircle(39, 44, 1.5));
      }),
      e('checkpoint', 30, 54, (e) => {
        (e.fillStyle(9303295, 0.08).fillCircle(14, 25, 16),
          e.lineStyle(3, 9303295, 0.95).lineBetween(6, 52, 6, 4),
          e.lineStyle(1, 14679295, 0.55).lineBetween(9, 50, 9, 8),
          e.fillStyle(9303295, 0.18).fillTriangle(8, 6, 27, 14, 8, 23),
          e.fillStyle(9303295, 0.75).fillTriangle(9, 8, 24, 14, 9, 20),
          e.lineStyle(1, 14679295, 0.9).strokeTriangle(8, 6, 27, 14, 8, 23),
          e.fillStyle(15269375).fillCircle(6, 4, 2),
          e.fillStyle(9303295, 0.65).fillCircle(6, 4, 4));
      }),
      e('security', 42, 34, (e) => {
        (e.fillStyle(16733028, 0.07).fillCircle(21, 17, 21),
          e.fillStyle(792359).fillRoundedRect(4, 7, 34, 22, 9),
          e.fillStyle(1583164).fillRoundedRect(8, 11, 26, 14, 6),
          e.lineStyle(2, 16733028, 0.95).strokeRoundedRect(5, 8, 32, 20, 8),
          e.fillStyle(16733028, 0.2).fillCircle(28, 17, 8),
          e.fillStyle(16745070).fillCircle(28, 17, 4),
          e.fillStyle(16773319).fillCircle(28, 16, 1.5),
          e.fillStyle(16765038).fillCircle(11, 17, 2));
      }),
      e('guard', 32, 58, (e) => {
        (e.fillStyle(16733028, 0.06).fillCircle(16, 29, 17),
          e.fillStyle(792359).fillRoundedRect(5, 6, 22, 46, 6),
          e.fillStyle(1583164).fillRoundedRect(9, 10, 14, 36, 4),
          e.lineStyle(2, 16733028, 0.9).strokeRoundedRect(6, 7, 20, 44, 5),
          e.fillStyle(16733028, 0.16).fillRoundedRect(9, 15, 14, 8, 3),
          e.fillStyle(16765038).fillRect(11, 17, 10, 3),
          e.fillStyle(9303295, 0.16).fillRoundedRect(10, 29, 12, 7, 2),
          e.fillStyle(9303295).fillRect(12, 31, 8, 2),
          e.fillStyle(16733028).fillRect(10, 41, 4, 2),
          e.fillStyle(16765038).fillRect(16, 41, 4, 2),
          e.fillStyle(16773319, 0.9).fillCircle(16, 9, 1.5),
          e.fillStyle(16733028, 0.55).fillCircle(16, 9, 3));
      }),
      e('enemy-runner', 48, 64, (e) => {
        (e.fillStyle(16733028, 0.08).fillCircle(24, 31, 29),
          e.fillStyle(14020863, 0.12).fillCircle(24, 12, 13),
          e.fillStyle(14020863).fillCircle(24, 12, 10),
          e.fillStyle(725536).fillRoundedRect(14, 19, 20, 7, 3),
          e.fillStyle(16733028).fillRect(17, 21, 14, 2),
          e.fillStyle(16733028, 0.1).fillRoundedRect(11, 21, 26, 29, 7),
          e.fillStyle(3152962).fillRoundedRect(13, 23, 22, 25, 6),
          e.fillStyle(5582956).fillRoundedRect(16, 26, 16, 17, 4),
          e.fillStyle(16745070, 0.18).fillRoundedRect(15, 30, 18, 7, 3),
          e.fillStyle(16745070).fillRect(17, 32, 14, 3),
          e.lineStyle(5, 14020863, 0.95).lineBetween(15, 30, 7, 43).lineBetween(33, 30, 41, 35),
          e.lineStyle(2, 16733028, 0.75).lineBetween(9, 40, 7, 43).lineBetween(39, 34, 41, 35),
          e.lineStyle(7, 16733028, 0.95).lineBetween(19, 45, 16, 60).lineBetween(29, 45, 33, 60),
          e.lineStyle(2, 16765038, 0.65).lineBetween(19, 48, 17, 58).lineBetween(29, 48, 32, 58),
          e.fillStyle(9303295).fillRect(13, 58, 7, 2).fillRect(31, 58, 7, 2));
      }),
      e('invader', 48, 38, (e) => {
        (e.fillStyle(14723071, 0.08).fillEllipse(24, 19, 46, 34),
          e
            .fillStyle(2364731)
            .fillTriangle(4, 19, 0, 12, 9, 15)
            .fillTriangle(44, 19, 48, 12, 39, 15),
          e.fillStyle(2103087).fillRoundedRect(4, 8, 40, 24, 10),
          e.fillStyle(4992616).fillRoundedRect(8, 12, 32, 16, 7),
          e.lineStyle(2, 14723071, 0.95).strokeRoundedRect(4, 8, 40, 24, 10),
          e.fillStyle(9303295, 0.14).fillRoundedRect(11, 16, 26, 7, 3),
          e.fillStyle(14679295).fillRect(14, 18, 20, 3),
          e.fillStyle(14723071, 0.2).fillCircle(17, 20, 6).fillCircle(31, 20, 6),
          e.fillStyle(14723071).fillCircle(17, 20, 3.5).fillCircle(31, 20, 3.5),
          e.fillStyle(9303295, 0.18).fillCircle(24, 28, 6),
          e.fillStyle(9303295).fillCircle(24, 28, 2),
          e
            .fillStyle(5627903, 0.85)
            .fillRect(13, 30, 7, 2)
            .fillRect(21, 30, 6, 2)
            .fillRect(29, 30, 7, 2));
      }),
      e('chicken', 42, 38, (e) => {
        (e.fillStyle(16765038, 0.08).fillCircle(21, 22, 17),
          e.fillStyle(12365457).fillCircle(20, 23, 15),
          e.fillStyle(16052455).fillCircle(20, 21, 15),
          e.fillStyle(14867922).fillEllipse(14, 23, 10, 14),
          e.fillStyle(16052455).fillCircle(28, 10, 9),
          e.fillStyle(16777215, 0.75).fillCircle(25, 7, 3),
          e.fillStyle(12749619).fillTriangle(34, 11, 42, 15, 34, 19),
          e.fillStyle(16765038).fillTriangle(34, 10, 41, 14, 34, 17),
          e.fillStyle(1516088).fillCircle(31, 9, 2),
          e.fillStyle(16777215).fillCircle(30.5, 8.5, 0.6),
          e.fillStyle(16733028).fillCircle(25, 2, 3).fillCircle(29, 1, 3).fillCircle(33, 3, 2.5),
          e.fillStyle(16733028).fillCircle(33, 16, 2.5),
          e.lineStyle(2, 14264649, 0.95).lineBetween(16, 33, 14, 37).lineBetween(25, 33, 27, 37),
          e
            .lineStyle(1.5, 14264649, 0.9)
            .lineBetween(14, 37, 11, 37)
            .lineBetween(14, 37, 16, 36)
            .lineBetween(27, 37, 24, 37)
            .lineBetween(27, 37, 29, 36));
      }),
      e('dino', 68, 48, (e) => {
        (e.fillStyle(11461503, 0.08).fillEllipse(34, 27, 62, 40),
          e.fillStyle(4615496).fillTriangle(0, 28, 18, 16, 20, 39),
          e.fillStyle(5080658).fillRoundedRect(8, 15, 48, 25, 10),
          e.fillStyle(7317102).fillRoundedRect(12, 19, 39, 17, 7),
          e
            .fillStyle(11461503, 0.8)
            .fillTriangle(15, 16, 20, 9, 23, 17)
            .fillTriangle(25, 16, 30, 8, 33, 17)
            .fillTriangle(35, 16, 40, 10, 43, 17),
          e.fillStyle(7317102).fillRoundedRect(44, 9, 20, 23, 8),
          e.fillStyle(5934941).fillRoundedRect(53, 18, 12, 11, 5),
          e.fillStyle(1516088).fillCircle(51, 16, 6),
          e.fillStyle(16765038).fillCircle(52, 16, 3),
          e.fillStyle(16777215).fillCircle(53, 15, 1),
          e.fillStyle(1516088).fillCircle(62, 23, 1.5),
          e.lineStyle(1.5, 2836272, 0.9).lineBetween(53, 28, 63, 28),
          e.fillStyle(9303295, 0.12).fillCircle(31, 28, 9),
          e.fillStyle(9303295).fillCircle(31, 28, 3),
          e.lineStyle(6, 5080658, 0.95).lineBetween(46, 35, 47, 46),
          e.lineStyle(6, 4615496, 0.95).lineBetween(21, 35, 20, 46),
          e.lineStyle(2, 11461503, 0.85).lineBetween(44, 46, 51, 46).lineBetween(18, 46, 25, 46));
      }),
      e('dino-boss', 112, 82, (e) => {
        (e.fillStyle(16745070, 0.08).fillCircle(56, 42, 39),
          e.fillStyle(16765038, 0.08).fillCircle(56, 42, 31),
          e
            .fillStyle(2309426)
            .fillTriangle(16, 25, 2, 12, 22, 38)
            .fillTriangle(24, 21, 12, 4, 31, 31)
            .fillTriangle(88, 22, 104, 6, 91, 38),
          e.fillStyle(2574646).fillRoundedRect(13, 22, 82, 40, 14),
          e.fillStyle(3432261).fillRoundedRect(20, 28, 68, 27, 10),
          e.lineStyle(3, 11461503, 0.95).strokeRoundedRect(13, 22, 82, 40, 14),
          e.fillStyle(7317102).fillTriangle(0, 42, 21, 16, 25, 65),
          e.fillStyle(1516088).fillEllipse(78, 30, 19, 15),
          e.fillStyle(16765038, 0.25).fillCircle(82, 29, 10),
          e.fillStyle(16765038).fillCircle(82, 29, 6),
          e.fillStyle(16777215, 0.9).fillCircle(83, 28, 2),
          e.fillStyle(16745070, 0.18).fillCircle(53, 43, 17),
          e.lineStyle(2, 16765038, 0.8).strokeCircle(53, 43, 12),
          e.fillStyle(16769192).fillCircle(53, 43, 6),
          e
            .fillStyle(9303295, 0.8)
            .fillRect(33, 55, 7, 3)
            .fillRect(45, 57, 7, 3)
            .fillRect(57, 55, 7, 3),
          e.lineStyle(2, 16745070, 0.9).lineBetween(17, 56, 37, 66),
          e.fillStyle(14679295, 0.9).fillRect(42, 18, 22, 3));
      }),
      e('sentinel-boss', 90, 92, (e) => {
        (e.fillStyle(9303295, 0.08).fillCircle(45, 46, 42),
          e.fillStyle(12187135, 0.07).fillCircle(45, 46, 34),
          e
            .fillStyle(1057850)
            .fillTriangle(18, 22, 5, 12, 20, 36)
            .fillTriangle(72, 22, 85, 12, 70, 36),
          e.fillStyle(1518920).fillRoundedRect(15, 15, 60, 64, 15),
          e.fillStyle(2443366).fillRoundedRect(21, 21, 48, 51, 11),
          e.lineStyle(3, 9303295, 0.95).strokeRoundedRect(15, 15, 60, 64, 15),
          e.fillStyle(9303295, 0.16).fillCircle(45, 42, 25),
          e.lineStyle(2, 5627903, 0.9).strokeCircle(45, 42, 20),
          e.lineStyle(1, 14679295, 0.75).strokeCircle(45, 42, 14),
          e.fillStyle(15269375).fillCircle(45, 42, 8),
          e.fillStyle(9303295).fillCircle(45, 42, 5),
          e.fillStyle(16777215).fillCircle(43, 40, 2),
          e.fillStyle(5627903, 0.18).fillCircle(45, 9, 9),
          e.fillStyle(9303295).fillCircle(45, 9, 4),
          e.fillStyle(726822).fillRoundedRect(27, 67, 36, 9, 4),
          e.lineStyle(2, 16745070, 0.9).strokeRoundedRect(27, 67, 36, 9, 4),
          e
            .fillStyle(14679295, 0.9)
            .fillRect(29, 71, 6, 2)
            .fillRect(42, 71, 6, 2)
            .fillRect(55, 71, 6, 2));
      }),
      e('storm-boss', 104, 86, (e) => {
        (e.fillStyle(12162047, 0.08).fillCircle(52, 43, 41),
          e.fillStyle(14723071, 0.06).fillCircle(52, 43, 34),
          e.fillStyle(2366277).fillTriangle(6, 47, 34, 9, 46, 47),
          e.fillStyle(3285854).fillTriangle(58, 47, 89, 8, 99, 49),
          e.fillStyle(4010345).fillRoundedRect(25, 17, 54, 53, 16),
          e.fillStyle(5719431).fillRoundedRect(31, 23, 42, 41, 12),
          e.lineStyle(3, 14723071, 0.95).strokeRoundedRect(25, 17, 54, 53, 16),
          e.lineStyle(2, 12162047, 0.85).strokeCircle(52, 43, 24),
          e.lineStyle(1, 14335999, 0.55).strokeCircle(52, 43, 18),
          e.fillStyle(12162047, 0.25).fillCircle(52, 43, 17),
          e.fillStyle(16765038).fillCircle(52, 43, 8),
          e.fillStyle(16773319).fillCircle(52, 43, 4),
          e
            .fillStyle(9303295)
            .fillCircle(35, 29, 3)
            .fillCircle(69, 29, 3)
            .fillCircle(37, 57, 3)
            .fillCircle(67, 57, 3),
          e
            .lineStyle(2, 9303295, 0.8)
            .lineBetween(35, 29, 44, 38)
            .lineBetween(69, 29, 60, 38)
            .lineBetween(37, 57, 45, 49)
            .lineBetween(67, 57, 59, 49),
          e
            .fillStyle(14723071)
            .fillTriangle(39, 15, 45, 2, 51, 16)
            .fillTriangle(53, 15, 60, 2, 65, 16));
      }),
      e('apex-boss', 108, 96, (e) => {
        (e.fillStyle(16745070, 0.07).fillCircle(54, 47, 45),
          e.fillStyle(16765038, 0.06).fillCircle(54, 47, 37),
          e.fillStyle(2431792).fillTriangle(17, 28, 2, 13, 25, 32),
          e.fillStyle(2431792).fillTriangle(91, 28, 106, 13, 83, 32),
          e.fillStyle(2760760).fillRoundedRect(12, 17, 84, 62, 17),
          e.fillStyle(4600148).fillRoundedRect(20, 24, 68, 47, 12),
          e.lineStyle(3, 16765038, 0.95).strokeRoundedRect(12, 17, 84, 62, 17),
          e
            .fillStyle(16765038, 0.2)
            .fillTriangle(37, 18, 46, 2, 52, 20)
            .fillTriangle(55, 20, 64, 2, 71, 18),
          e.fillStyle(16745070, 0.22).fillCircle(54, 44, 29),
          e.lineStyle(2, 16765038, 0.9).strokeCircle(54, 44, 22),
          e.lineStyle(1, 16745070, 0.8).strokeCircle(54, 44, 29),
          e.fillStyle(16769192).fillCircle(54, 44, 10),
          e.fillStyle(16745070).fillCircle(54, 44, 6),
          e.fillStyle(16777215, 0.95).fillCircle(51, 41, 2.5),
          e.fillStyle(725024).fillRoundedRect(28, 29, 52, 9, 4),
          e.fillStyle(16745070).fillRect(33, 32, 42, 3),
          e
            .fillStyle(9303295, 0.8)
            .fillRect(31, 61, 11, 3)
            .fillRect(48, 61, 11, 3)
            .fillRect(65, 61, 11, 3),
          e.fillStyle(14679295).fillRoundedRect(39, 69, 30, 6, 3),
          e.fillStyle(16765038, 0.8).fillRect(18, 41, 4, 18).fillRect(86, 41, 4, 18));
      }),
      e('alien-ground', 54, 54, (e) => {
        (e.fillStyle(12162047, 0.08).fillCircle(27, 28, 25),
          e.fillStyle(14723071, 0.1).fillCircle(27, 28, 20),
          e.fillStyle(2365494).fillRoundedRect(6, 10, 42, 38, 13),
          e.fillStyle(4205924).fillRoundedRect(10, 14, 34, 29, 10),
          e.lineStyle(2, 14723071, 0.95).strokeRoundedRect(6, 10, 42, 38, 13),
          e.fillStyle(14723071, 0.18).fillCircle(18, 25, 8).fillCircle(36, 25, 8),
          e.fillStyle(15981055).fillEllipse(18, 25, 11, 9).fillEllipse(36, 25, 11, 9),
          e.fillStyle(2364719).fillCircle(18, 25, 3).fillCircle(36, 25, 3),
          e.fillStyle(16777215).fillCircle(17, 24, 1).fillCircle(35, 24, 1),
          e.fillStyle(9303295, 0.18).fillCircle(27, 36, 9),
          e.lineStyle(1.5, 9303295, 0.8).strokeCircle(27, 36, 7),
          e.fillStyle(15269375).fillCircle(27, 36, 3),
          e.fillStyle(9303295, 0.14).fillRoundedRect(15, 43, 24, 7, 3),
          e.fillStyle(9303295).fillRect(18, 45, 18, 3));
      }),
      e('egg', 24, 30, (e) => {
        (e.fillStyle(16745070, 0.1).fillCircle(12, 15, 13),
          e.fillStyle(13215837).fillEllipse(12, 16, 17, 25),
          e.fillStyle(16774095).fillEllipse(12, 14, 15, 23),
          e.fillStyle(16777215, 0.75).fillEllipse(9, 10, 5, 9),
          e
            .lineStyle(1.2, 16745070, 0.9)
            .lineBetween(7, 12, 10, 15)
            .lineBetween(10, 15, 8, 18)
            .lineBetween(10, 15, 13, 13),
          e.lineStyle(1.5, 16765038, 0.95).strokeEllipse(12, 14, 15, 23),
          e.fillStyle(16765038).fillCircle(16, 4, 2),
          e.fillStyle(16774095, 0.7).fillCircle(16, 4, 4));
      }),
      e('comet', 40, 40, (e) => {
        (e.fillStyle(16745070, 0.08).fillCircle(20, 20, 19),
          e.fillStyle(16745070, 0.16).fillTriangle(4, 20, 18, 14, 18, 26),
          e.fillStyle(16765038, 0.2).fillTriangle(7, 20, 18, 16, 18, 24),
          e.fillStyle(16745070, 0.28).fillCircle(21, 20, 14),
          e.lineStyle(2, 16745070, 0.95).strokeCircle(21, 20, 11),
          e.fillStyle(16765038).fillCircle(21, 20, 8),
          e.fillStyle(16774095).fillCircle(19, 18, 4),
          e.fillStyle(16777215, 0.95).fillCircle(18, 17, 2),
          e.lineStyle(1, 16769192, 0.65).strokeCircle(21, 20, 15),
          e.lineStyle(1, 9303295, 0.45).strokeCircle(21, 20, 18),
          e
            .fillStyle(16765038, 0.9)
            .fillCircle(11, 10, 2)
            .fillCircle(31, 12, 1.5)
            .fillCircle(30, 29, 2)
            .fillCircle(12, 31, 1.5));
      }),
      e('kinetic-ball', 34, 34, (e) => {
        (e.fillStyle(9303295, 0.08).fillCircle(17, 17, 16),
          e.fillStyle(5627903, 0.12).fillCircle(17, 17, 13),
          e.lineStyle(2, 9303295, 0.9).strokeCircle(17, 17, 12),
          e.lineStyle(1, 14679295, 0.65).strokeCircle(17, 17, 8),
          e.fillStyle(9303295, 0.28).fillCircle(17, 17, 9),
          e.fillStyle(15269375).fillCircle(17, 17, 6),
          e.fillStyle(9303295).fillCircle(17, 17, 4),
          e.fillStyle(16777215, 0.95).fillCircle(15, 15, 2),
          e
            .lineStyle(1.5, 12187135, 0.8)
            .lineBetween(17, 3, 17, 8)
            .lineBetween(17, 26, 17, 31)
            .lineBetween(3, 17, 8, 17)
            .lineBetween(26, 17, 31, 17),
          e
            .fillStyle(5627903)
            .fillCircle(6, 8, 1.5)
            .fillCircle(28, 8, 1.5)
            .fillCircle(8, 28, 1.5)
            .fillCircle(28, 28, 1.5));
      }),
      e('shield', 54, 72, (e) => {
        (e.fillStyle(9303295, 0.07).fillRoundedRect(4, 2, 46, 68, 13),
          e.fillStyle(5627903, 0.1).fillRoundedRect(7, 5, 40, 62, 11),
          e.fillStyle(1058877, 0.86).fillRoundedRect(8, 4, 38, 64, 10),
          e.fillStyle(1588053, 0.72).fillRoundedRect(12, 9, 30, 52, 8),
          e.lineStyle(2, 9303295, 0.95).strokeRoundedRect(8, 4, 38, 64, 10),
          e.lineStyle(1, 12187135, 0.55).strokeRoundedRect(12, 9, 30, 52, 8),
          e.fillStyle(9303295, 0.22).fillCircle(27, 16, 8),
          e.fillStyle(15269375).fillCircle(27, 16, 4),
          e.fillStyle(16777215, 0.9).fillCircle(26, 15, 1.5),
          e.fillStyle(9303295, 0.18).fillCircle(27, 37, 14),
          e.lineStyle(1.5, 5627903, 0.85).strokeCircle(27, 37, 11),
          e.fillStyle(9303295).fillCircle(27, 37, 6),
          e.fillStyle(15269375).fillCircle(27, 37, 3),
          e
            .lineStyle(1, 5627903, 0.7)
            .lineBetween(15, 24, 15, 48)
            .lineBetween(39, 24, 39, 48)
            .lineBetween(17, 50, 24, 57)
            .lineBetween(37, 50, 30, 57),
          e.fillStyle(9303295, 0.16).fillRoundedRect(16, 56, 22, 6, 3),
          e.fillStyle(9303295).fillRect(19, 58, 16, 2),
          e.fillStyle(5627903).fillCircle(10, 35, 2).fillCircle(44, 35, 2));
      }),
      e('blaster', 46, 22, (e) => {
        (e.fillStyle(9303295, 0.08).fillRoundedRect(1, 3, 44, 16, 5),
          e.fillStyle(1582651).fillRoundedRect(4, 5, 34, 11, 4),
          e.fillStyle(2967140).fillRoundedRect(8, 3, 23, 5, 2),
          e.lineStyle(1.5, 9303295, 0.9).strokeRoundedRect(4, 5, 34, 11, 4),
          e.fillStyle(726822).fillRoundedRect(28, 7, 15, 7, 2),
          e.fillStyle(9303295, 0.22).fillRoundedRect(29, 8, 14, 5, 2),
          e.fillStyle(15269375).fillRect(34, 9, 9, 3),
          e.fillStyle(9303295, 0.18).fillCircle(17, 10, 7),
          e.fillStyle(9303295).fillCircle(17, 10, 4),
          e.fillStyle(16777215, 0.9).fillCircle(16, 9, 1.5),
          e.fillStyle(1055275).fillRoundedRect(10, 15, 11, 6, 2),
          e.lineStyle(1, 16765038, 0.8).lineBetween(12, 17, 19, 20),
          e.fillStyle(16765038, 0.22).fillRoundedRect(23, 16, 10, 3, 1),
          e.fillStyle(16765038).fillRect(24, 17, 7, 1),
          e.fillStyle(16777215, 0.9).fillCircle(44, 10, 2),
          e.fillStyle(9303295, 0.7).fillCircle(44, 10, 4));
      }),
      e('sword', 64, 20, (e) => {
        (e.fillStyle(9303295, 0.08).fillTriangle(8, 10, 58, 3, 58, 17),
          e.fillStyle(14679295).fillTriangle(12, 10, 56, 3, 56, 17),
          e.fillStyle(16777215, 0.95).fillTriangle(18, 10, 56, 5, 56, 8),
          e.lineStyle(2, 9303295, 0.95).lineBetween(12, 10, 56, 3).lineBetween(12, 10, 56, 17),
          e.lineStyle(1, 12187135, 0.8).lineBetween(20, 10, 54, 8),
          e.fillStyle(1517114).fillRoundedRect(7, 5, 11, 11, 3),
          e.lineStyle(1.5, 16765038, 0.95).strokeRoundedRect(7, 5, 11, 11, 3),
          e.fillStyle(16765038).fillRect(10, 8, 5, 5),
          e.fillStyle(16777215, 0.8).fillRect(11, 9, 2, 2),
          e.fillStyle(726822).fillRoundedRect(2, 6, 8, 8, 2),
          e.lineStyle(1, 9303295, 0.8).strokeRoundedRect(2, 6, 8, 8, 2),
          e.fillStyle(16745070, 0.75).fillRect(4, 8, 4, 2).fillRect(4, 11, 4, 2),
          e.fillStyle(16777215).fillCircle(56, 10, 2),
          e.fillStyle(9303295, 0.6).fillCircle(56, 10, 4));
      }),
      e('plasma', 30, 16, (e) => {
        (e.fillStyle(9303295, 0.08).fillEllipse(15, 8, 29, 15),
          e.fillStyle(5627903, 0.18).fillEllipse(15, 8, 24, 12),
          e.fillStyle(9303295, 0.55).fillEllipse(15, 8, 19, 10),
          e.fillStyle(15269375).fillEllipse(15, 8, 12, 7),
          e.fillStyle(16777215).fillEllipse(15, 8, 7, 4),
          e.lineStyle(1.5, 12187135, 0.95).strokeEllipse(15, 8, 21, 11),
          e.fillStyle(9303295, 0.2).fillTriangle(2, 4, 11, 8, 2, 12),
          e.fillStyle(5627903, 0.18).fillTriangle(0, 6, 8, 8, 0, 10),
          e.fillStyle(16777215, 0.9).fillCircle(18, 6, 1.5),
          e.fillStyle(5627903, 0.85).fillCircle(7, 3, 1).fillCircle(8, 13, 1));
      }),
      e('turret', 52, 52, (e) => {
        (e.fillStyle(9303295, 0.07).fillCircle(26, 28, 24),
          e.fillStyle(5627903, 0.1).fillRoundedRect(4, 25, 44, 20, 7),
          e.fillStyle(1451579).fillRoundedRect(5, 27, 42, 17, 6),
          e.fillStyle(2506589).fillRoundedRect(9, 30, 34, 11, 4),
          e.lineStyle(2, 9303295, 0.9).strokeRoundedRect(5, 27, 42, 17, 6),
          e.fillStyle(2110542).fillRoundedRect(13, 17, 26, 17, 7),
          e.lineStyle(2, 12187135, 0.85).strokeRoundedRect(13, 17, 26, 17, 7),
          e.fillStyle(9303295, 0.16).fillCircle(26, 25, 11),
          e.lineStyle(1.5, 5627903, 0.85).strokeCircle(26, 25, 8),
          e.fillStyle(726822).fillRoundedRect(22, 4, 8, 20, 3),
          e.lineStyle(1.5, 9303295, 0.9).strokeRoundedRect(22, 4, 8, 20, 3),
          e.fillStyle(9303295).fillRect(24, 7, 4, 12),
          e.fillStyle(15269375).fillRect(24, 8, 4, 5),
          e.fillStyle(16777215).fillCircle(26, 5, 3),
          e.fillStyle(9303295, 0.6).fillCircle(26, 5, 5),
          e.fillStyle(16765038).fillCircle(16, 37, 2),
          e.fillStyle(16745070).fillCircle(36, 37, 2),
          e.fillStyle(5627903, 0.8).fillRect(16, 42, 7, 2).fillRect(29, 42, 7, 2),
          e
            .fillStyle(1516088)
            .fillTriangle(5, 28, 1, 34, 7, 40)
            .fillTriangle(47, 28, 51, 34, 45, 40));
      }),
      e('spring-pad', 64, 24, (e) => {
        (e.fillStyle(11461503, 0.08).fillRoundedRect(1, 3, 62, 18, 5),
          e.fillStyle(9303295, 0.06).fillRoundedRect(4, 5, 56, 14, 4),
          e.fillStyle(1517115).fillRoundedRect(2, 5, 60, 16, 5),
          e.fillStyle(2504787).fillRoundedRect(6, 8, 52, 10, 3),
          e.lineStyle(2, 11461503, 0.95).strokeRoundedRect(2, 5, 60, 16, 5),
          e.lineStyle(1, 9303295, 0.65).strokeRoundedRect(6, 8, 52, 10, 3),
          e
            .fillStyle(11461503, 0.95)
            .fillTriangle(10, 16, 18, 10, 18, 16)
            .fillTriangle(22, 16, 30, 10, 30, 16)
            .fillTriangle(34, 16, 42, 10, 42, 16)
            .fillTriangle(46, 16, 54, 10, 54, 16),
          e
            .fillStyle(15269840, 0.85)
            .fillTriangle(12, 15, 18, 11, 18, 15)
            .fillTriangle(24, 15, 30, 11, 30, 15)
            .fillTriangle(36, 15, 42, 11, 42, 15)
            .fillTriangle(48, 15, 54, 11, 54, 15),
          e.fillStyle(9303295, 0.18).fillCircle(32, 12, 8),
          e.lineStyle(1, 9303295, 0.8).strokeCircle(32, 12, 6),
          e.fillStyle(15269375).fillCircle(32, 12, 3),
          e.fillStyle(11461503).fillCircle(6, 13, 1.5).fillCircle(58, 13, 1.5),
          e
            .fillStyle(5627903, 0.75)
            .fillRect(18, 19, 7, 2)
            .fillRect(29, 19, 7, 2)
            .fillRect(40, 19, 7, 2));
      }),
      e('guide-drone', 72, 48, (e) => {
        (e.fillStyle(9303295, 0.045).fillEllipse(36, 38, 46, 14),
          e
            .fillStyle(595234, 1)
            .fillTriangle(16, 17, 3, 24, 16, 31)
            .fillTriangle(56, 17, 69, 24, 56, 31),
          e
            .lineStyle(1.5, 5627903, 0.65)
            .strokeTriangle(16, 17, 3, 24, 16, 31)
            .strokeTriangle(56, 17, 69, 24, 56, 31),
          e.fillStyle(331030, 1).fillRoundedRect(13, 12, 46, 27, 9),
          e.fillStyle(1452090, 1).fillRoundedRect(17, 15, 38, 20, 6),
          e.fillStyle(2177872, 0.9).fillRoundedRect(21, 17, 30, 7, 3),
          e.lineStyle(1.5, 7309210, 0.72).strokeRoundedRect(13, 12, 46, 27, 9),
          e.fillStyle(9303295, 0.08).fillCircle(36, 25, 12),
          e.fillStyle(463390, 1).fillCircle(36, 25, 7),
          e.lineStyle(1.5, 9303295, 0.85).strokeCircle(36, 25, 6),
          e.fillStyle(14679295, 0.95).fillCircle(36, 25, 2.5),
          e.fillStyle(16777215, 0.85).fillCircle(35, 24, 0.9),
          e.lineStyle(1.5, 5627903, 0.8).lineBetween(36, 12, 36, 6),
          e.fillStyle(9303295, 0.95).fillCircle(36, 5, 2.2),
          e.fillStyle(16777215, 0.8).fillCircle(35.4, 4.4, 0.7),
          e.fillStyle(5627903, 0.85).fillRect(19, 28, 7, 2).fillRect(46, 28, 7, 2),
          e.fillStyle(463133, 1).fillRoundedRect(20, 35, 9, 5, 2).fillRoundedRect(43, 35, 9, 5, 2),
          e.fillStyle(5627903, 0.72).fillRect(22, 39, 5, 2).fillRect(45, 39, 5, 2),
          e.fillStyle(9303295, 0.38).fillRect(18, 19, 6, 1).fillRect(48, 19, 6, 1),
          e.fillStyle(16765038, 0.65).fillRect(18, 23, 3, 1).fillRect(51, 23, 3, 1));
      }),
      e('alien-guide', 56, 64, (e) => {
        (e.fillStyle(12162047, 0.08).fillCircle(28, 30, 29),
          e.fillStyle(14723071, 0.1).fillCircle(28, 30, 23),
          e.fillStyle(3876952).fillEllipse(28, 26, 42, 40),
          e.lineStyle(2, 14723071, 0.95).strokeEllipse(28, 26, 42, 40),
          e.fillStyle(5453423).fillEllipse(28, 28, 34, 31),
          e.fillStyle(14723071, 0.2).fillEllipse(19, 24, 14, 10).fillEllipse(37, 24, 14, 10),
          e.fillStyle(15981055).fillEllipse(19, 24, 10, 8).fillEllipse(37, 24, 10, 8),
          e.fillStyle(2364719).fillCircle(19, 24, 3).fillCircle(37, 24, 3),
          e.fillStyle(16777215).fillCircle(18, 23, 1).fillCircle(36, 23, 1),
          e.fillStyle(9303295, 0.18).fillCircle(28, 35, 9),
          e.fillStyle(9303295).fillRoundedRect(20, 31, 16, 8, 4),
          e.fillStyle(15269375).fillCircle(28, 35, 3),
          e
            .fillStyle(2759744)
            .fillTriangle(7, 30, 1, 38, 10, 41)
            .fillTriangle(49, 30, 55, 38, 46, 41),
          e
            .lineStyle(1.5, 12162047, 0.9)
            .strokeTriangle(7, 30, 1, 38, 10, 41)
            .strokeTriangle(49, 30, 55, 38, 46, 41),
          e.lineStyle(2, 14723071, 0.9).lineBetween(28, 5, 28, 12),
          e.fillStyle(9303295).fillCircle(28, 4, 3),
          e.fillStyle(16777215, 0.8).fillCircle(27, 3, 1),
          e.fillStyle(9303295, 0.15).fillRoundedRect(16, 43, 24, 12, 5),
          e.fillStyle(9303295).fillRoundedRect(18, 45, 20, 7, 3),
          e
            .fillStyle(14679295, 0.9)
            .fillRect(21, 48, 3, 3)
            .fillRect(27, 47, 3, 4)
            .fillRect(33, 48, 3, 3));
      }));
  }
  createAnimations() {
    this.anims.exists('runner-idle') ||
      (this.anims.create({
        key: 'runner-idle',
        frames: [{ key: 'runner-idle' }],
        frameRate: 1,
        repeat: -1,
      }),
      this.anims.create({
        key: 'runner-run',
        frames: [{ key: 'runner-run-a' }, { key: 'runner-run-b' }],
        frameRate: 11,
        repeat: -1,
      }),
      this.anims.create({
        key: 'runner-jump',
        frames: [{ key: 'runner-jump' }],
        frameRate: 1,
        repeat: -1,
      }),
      this.anims.create({
        key: 'runner-fall',
        frames: [{ key: 'runner-fall' }],
        frameRate: 1,
        repeat: -1,
      }),
      this.anims.create({
        key: 'runner-land',
        frames: [{ key: 'runner-land' }],
        frameRate: 1,
        repeat: -1,
      }),
      this.anims.create({
        key: 'runner-dash',
        frames: [{ key: 'runner-dash' }],
        frameRate: 1,
        repeat: -1,
      }),
      this.anims.create({
        key: 'runner-wall',
        frames: [{ key: 'runner-wall' }],
        frameRate: 1,
        repeat: -1,
      }),
      this.anims.create({
        key: 'runner-hit',
        frames: [{ key: 'runner-hit' }],
        frameRate: 1,
        repeat: -1,
      }),
      this.anims.create({
        key: 'runner-finish',
        frames: [{ key: 'runner-finish' }],
        frameRate: 1,
        repeat: -1,
      }));
  }
  init({
    mission: e,
    runId: t,
    abilities: i = [],
    rain: s,
    screenShake: a = !0,
    reducedMotion: l = !1,
    graphicsQuality: r = 'HIGH',
    firstTimeTutorial: o = !1,
  } = {}) {
    ((this.mission = e || {}),
      (this.mission.spawn = {
        x: Number(this.mission.spawn?.x) || 0,
        y: Number(this.mission.spawn?.y) || 0,
      }),
      (this.mission.goal = {
        x: Number(this.mission.goal?.x) || this.mission.spawn.x + 1200,
        y: Number(this.mission.goal?.y) || this.mission.spawn.y,
      }),
      (this.runId = t),
      (this.abilities = new Set(i || [])),
      (this.rainEnabled = s),
      (this.screenShake = a),
      (this.motionReduced = Boolean(l || 'LOW' === String(r).toUpperCase())),
      (this.reducedMotionRequested = Boolean(l)));
    const n =
        'undefined' != typeof window && window.localStorage
          ? window.localStorage.getItem('runner_graphics_quality')
          : null,
      h = String(n || r || 'HIGH')
        .trim()
        .toUpperCase();
    ((this.graphicsQuality = ['LOW', 'MEDIUM', 'HIGH', 'ULTRA'].includes(h) ? h : 'HIGH'),
      (this.graphicsLevel = { LOW: 0, MEDIUM: 1, HIGH: 2, ULTRA: 3 }[this.graphicsQuality]),
      (this.reducedMotionRequested = Boolean(l)),
      (this.motionReduced = this.reducedMotionRequested || 0 === this.graphicsLevel),
      (this.graphicsSettings = {
        quality: this.graphicsQuality,
        level: this.graphicsLevel,
        effects: !0,
        particles: this.graphicsLevel >= 1,
        lighting: this.graphicsLevel >= 2,
        weather: this.graphicsLevel >= 1,
      }),
      (this.firstTimeTutorial = !1),
      (this.cinematicActive = !1),
      !this.cinematicActive && this.physics?.world?.isPaused && this.physics.resume(),
      (this.isPlayerTransformLocked = !1),
      (this.collected = 0),
      (this.secretsCollected = 0),
      (this.surpriseCache = null),
      (this.surpriseCachePrompt = null),
      (this.surpriseCacheCollected = !1),
      (this.surpriseCacheOpen = !1),
      (this.surpriseCacheResolved = !1),
      (this.surpriseCacheInteractionLocked = !1),
      (this.surpriseCacheSession = 0),
      (this.surpriseCacheId = null),
      (this.surpriseCollectedCacheIds = new Set()),
      (this.surpriseInventory = { shieldCore: 0, overdriveCell: 0, energyPack: 0, credits: 0 }),
      (this.surpriseModifier = null),
      (this.surprisePendingModifier = null),
      (this.surpriseConsumedMissionRewards = {}),
      (this.surpriseNegativeStreak = 0),
      (this.surpriseShieldCharges = 0),
      (this.playerBaseAngle = 0),
      (this.enemyDefeats = 0),
      (this.bossHitCount = 0),
      (this.elapsedMs = 0),
      (this.timeEmitTimer = 0),
      (this.afkTimer = 0),
      (this.afkStage = 0),
      (this.afkFreezeFx = null),
      (this.afkIceParticles = []),
      (this.afkCryoFx = null),
      (this.afkCryoTriggered = !1),
      (this.afkCryoShards = []),
      (this.afkCryostasisActive = !1),
      (this.afkCryoPreviousMoves = !0),
      (this.afkCryoPreviousAllowGravity = !0),
      (this.afkStatusText = null),
      (this.signalInterference = 0),
      (this.signalInterferenceTier = -1),
      (this.signalOverrideTriggered = !1),
      (this.signalInterferencePulse = 0),
      (this.signalInterferenceObjects = null),
      (this.signalInterferenceJitter = 0),
      (this.signalGhostTimer = 0),
      (this.runRating = { speed: 0, combat: 0, collection: 0, survival: 0, overall: 'C' }),
      (this.medalResult = null),
      (this.boostCooldown = 0),
      (this.dashCooldown = 0),
      (this.dashTimer = 0),
      (this.dashFxTimer = 0),
      (this.runnerAnimRate = 11),
      (this.wallJumpCooldown = 0),
      (this.wallJumpTimer = 0),
      (this.lowEnergyCueTimer = 0),
      (this.detectionEmit = -1),
      (this.health = 3),
      (this.healthMax = 3),
      (this.healthInvulnerable = 0),
      (this.energy = 100),
      (this.energyMax = 100),
      (this.briefingProtected = !1),
      (this.ammo = 6),
      (this.ammoMax = 6),
      (this.ammoRecharge = 0),
      (this.cometTimer = 3400),
      (this.blasterCooldown = 0),
      (this.swordCooldown = 0),
      (this.buildCooldowns = [0, 0]),
      (this.combatCombo = 0),
      (this.bestCombatCombo = 0),
      (this.comboTimer = 0),
      (this.overdriveTimer = 0),
      (this.polarityComboOverdriveTriggered = !1),
      (this.polarity = 0),
      (this.polarityMax = 100),
      (this.polarityState = 'STABLE'),
      (this.polarityComboGain = 4),
      (this.polarityDecayTimer = 0),
      (this.polarityDecayDelay = 1800),
      (this.polarityOverdriveBonus = 1),
      (this.polarityLastState = 'STABLE'),
      (this.polarityPulseTimer = 0),
      (this.polarityStats = { gained: 0, spent: 0, peak: 0, overdrives: 0, breaks: 0 }),
      (this.polarityAbilities = { phase: !1, magnet: !1, overdrive: !1, break: !1 }),
      (this.jumps = 0),
      (this.collisions = 0),
      (this.falls = 0),
      (this.deaths = 0),
      (this.perfectDodgeWindow = 0),
      (this.perfectDodgeCooldown = 0),
      (this.perfectDodges = 0),
      (this.deathLimit = 'first-delivery' === this.mission.id ? 1 / 0 : 3),
      (this.jumpsUsed = 0),
      (this.finished = !1),
      (this.gameOverUI = null),
      (this.gameOverRestarting = !1),
      (this.missionMedalsUI = null),
      (this.missionMedalsClosing = !1),
      (this.respawning = !1),
      (this.lastWaterDeath = !1),
      (this.divineArrivalPlayed = !1),
      (this.divineArrivalOverlay = null),
      (this.dizzyStars = null),
      (this.dizzyStarsTimer = 0),
      (this.dizzyStarsIntensity = 0),
      (this.dizzyStarsSerial = 0),
      (this.celestialUpdateTimer = 0),
      (this.eventState = new Map()),
      (this.mobileDirection = null),
      (this.mobileAirDirection = 0),
      (this.slideCrouchLocked = !1),
      (this.mobileActions = {
        jump: !1,
        jumpHeld: !1,
        jumpReleased: !1,
        fire: !1,
        sword: !1,
        dash: !1,
        crouch: !1,
        interact: !1,
        build1: !1,
        build2: !1,
        gadget1: !1,
        gadget2: !1,
        polarity: !1,
      }),
      (this.empTimer = 0),
      (this.decoyTimer = 0),
      (this.boosterTimer = 0),
      (this.boosterAura = null),
      (this.decoyBeacon = null),
      (this.infoCard = null),
      (this.landingTimer = 0),
      (this.lastHardLanding = !1),
      (this.bossDefeated = !1),
      (this.bossPhaseTwo = !1),
      (this.bossVictorySequence = !1),
      (this.bossVictoryLock = !1),
      (this.bossSecondShotPending = !1),
      (this.goalTouched = !1),
      (this.waterZones = null),
      (this.waterAttackActive = !1),
      (this.waterDeathTimer = 0),
      (this.waterAttackToken = 0),
      (this.wetSurfaceActive = !1),
      (this.wetSurfaceGrip = 1),
      (this.activeShark = null),
      (this.relayGates = null),
      (this.relayPuzzleActive = !1),
      (this.relayPuzzleGate = null),
      (this.relayPuzzleType = null),
      (this.relayPuzzleData = null),
      (this.relayPuzzleAttempts = 0),
      (this.relayPuzzleStartedAt = 0),
      (this.relayPuzzleSession = 0),
      (this.relayPuzzleTimerBand = 0),
      (this.relayPuzzleUI = null),
      (this.relayNearbyGate = null),
      (this.relayInteractHint = null),
      (this.coyote = 0),
      (this.jumpBuffer = 0),
      (this.dustTimer = 0),
      (this.speedTimer = 0),
      (this.kineticTrailTimer = 0),
      (this.groundFxTimer = 0),
      (this.footstepFxTimer = 0),
      (this.lastRunFrame = -1),
      (this.fastFallFxTimer = 0),
      (this.lastProgress = -1),
      (this.wasGrounded = !1),
      (this.fallSpeed = 0),
      (this.cameraOffsetX = -85),
      (this.cameraOffsetY = 65),
      (this.cameraZoom = 1),
      (this.firstPersonCamera = !1),
      (this.lastParallaxBoost = -1),
      (this.cameraVelocityX = 0),
      (this.jumpHeld = !1),
      (this.wallJumpFxShown = !1),
      (this.sectorTwoAnnounced = !1),
      (this.chaseWarnings = new Set()),
      (this.checkpointHints = new Set()),
      (this.routeTutorials = new Set()),
      (this.storyBeatsSeen = new Set()),
      (this.enemyIntelSeen = new Set()),
      (this.goalHintShown = !1),
      (this.weatherTimer = 0),
      (this.weatherPhase = 0),
      (this.routeHintTimer = 0),
      (this.eventCheckTimer = 0),
      (this.objectiveHUD = null),
      (this.objectiveProgressBar = null),
      (this.objectiveProgressText = null),
      (this.checkpoint = {
        x: this.mission.spawn.x,
        y: this.mission.spawn.y,
        signals: new Set(),
        secrets: new Set(),
      }),
      (this.safeStartZone = {
        x: this.mission.spawn.x,
        y: this.mission.spawn.y,
        width: 560,
        height: 140,
      }),
      (this.safeStartZoneActive = !0),
      (this.safeStartZoneWarned = !1),
      (this.checkpointArrow = null),
      (this.platformEmergencyTarget = null));
  }
  validateMission() {
    const e = this.mission || {};
    ((e.spawn = { x: Number(e.spawn?.x) || 0, y: Number(e.spawn?.y) || 0 }),
      (e.goal = { x: Number(e.goal?.x) || e.spawn.x + 1200, y: Number(e.goal?.y) || e.spawn.y }));
    ([
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
      'relayGates',
    ].forEach((t) => {
      Array.isArray(e[t]) || (e[t] = []);
    }),
      (e.enemies = e.enemies.map((t) => {
        const i = Number(t?.x) || e.spawn.x;
        return {
          ...t,
          x: i,
          y: Number(t?.y) || e.spawn.y,
          min: Number.isFinite(t?.min) ? Number(t.min) : i - 90,
          max: Number.isFinite(t?.max) ? Number(t.max) : i + 90,
        };
      })),
      (this.mission = e));
  }
  worldLightPulse(e = 9303295, t = 0.16, i = 220, s = 90) {
    const a = Number.isFinite(this.graphicsLevel) ? this.graphicsLevel : 2;
    if (this.motionReduced || a < 2 || !this.player?.active) return;
    const l = this.add.circle(this.player.x, this.player.y, s, e, t).setDepth(11);
    (l.setStrokeStyle(2, e, Math.min(0.9, t + 0.45)),
      this.tweens.add({
        targets: l,
        scale: 2.8,
        alpha: 0,
        duration: i,
        ease: 'Quad.out',
        onComplete: () => l.destroy(),
      }));
  }
  worldLightFlash(e = 9303295, t = 0.08, i = 120) {
    const s = Number.isFinite(this.graphicsLevel) ? this.graphicsLevel : 2;
    if (this.motionReduced || s < 2 || !this.player?.active) return;
    const a = this.add.rectangle(this.player.x, this.player.y, 260, 90, e, t).setDepth(5);
    this.tweens.add({
      targets: a,
      scaleX: 1.7,
      alpha: 0,
      duration: i,
      ease: 'Quad.out',
      onComplete: () => a.destroy(),
    });
  }
  shake(e, t) {
    this.screenShake && !this.motionReduced && this.cameras.main.shake(e, t);
  }
  registerPerfectDodge() {
    if (!(this.perfectDodgeCooldown > 0 || this.health <= 0)) {
      if (
        ((this.perfectDodgeWindow = 120),
        (this.perfectDodgeCooldown = 320),
        (this.perfectDodges = (this.perfectDodges || 0) + 1),
        this.game.events.emit('feedback', 'perfect_dodge'),
        (this.combatCombo = Math.min(10, this.combatCombo + 1)),
        (this.comboTimer = 3e3),
        this.addPolarity(10, 'perfect-dodge'),
        (this.bestCombatCombo = Math.max(this.bestCombatCombo || 0, this.combatCombo)),
        !this.motionReduced && this.graphicsLevel >= 2)
      ) {
        const e = this.add.circle(this.player.x, this.player.y, 12, 9303295, 0.16).setDepth(13);
        (e.setStrokeStyle(2, 12187135, 0.9),
          this.tweens.add({
            targets: e,
            scale: 4.6,
            alpha: 0,
            duration: 360,
            ease: 'Quad.out',
            onComplete: () => e.destroy(),
          }),
          this.cameras.main.flash(90, 120, 220, 255),
          this.playerCue('PERFECT DODGE', '#8df4ff'),
          this.speakNarration('PERFECT DODGE'),
          this.gadgetPulse(9303295, 14, 360));
      }
      if (
        ((this.energy = Math.min(this.energyMax, this.energy + 8)),
        this.game.events.emit('energy', (this.energy / this.energyMax) * 100),
        this.game.events.emit('combo', this.combatCombo, 1),
        !this.motionReduced && (!Number.isFinite(this.graphicsLevel) || this.graphicsLevel >= 2))
      ) {
        const e = this.add.circle(this.player.x, this.player.y, 14, 9303295, 0.34).setDepth(13);
        (this.tweens.add({
          targets: e,
          scale: 4.8,
          alpha: 0,
          duration: 320,
          onComplete: () => e.destroy(),
        }),
          this.shake(70, 0.003));
        const t = this.add.circle(this.player.x, this.player.y, 14, 9303295, 0.24).setDepth(12);
        (this.tweens.add({
          targets: t,
          scale: 3.8,
          alpha: 0,
          duration: 300,
          onComplete: () => t.destroy(),
        }),
          this.shake(90, 0.004));
      }
    }
  }
  playerCue(e, t = '#b9f5ff') {
    if (!this.player?.active) return;
    const i = this.children.list.filter((e) => !0 === e?.getData?.('playerCue') && e.active),
      s = 16 * Math.min(i.length, 3),
      a = this.add
        .text(this.player.x, this.player.y - 46 - s, e, {
          fontFamily: 'Orbitron',
          fontSize: '10px',
          color: t,
          stroke: '#08101c',
          strokeThickness: 4,
          padding: { left: 3, right: 3, top: 2, bottom: 2 },
        })
        .setOrigin(0.5)
        .setDepth(14)
        .setData('playerCue', !0);
    this.tweens.add({
      targets: a,
      y: a.y - 20,
      alpha: 0,
      duration: 520,
      ease: 'Quad.out',
      onComplete: () => a.destroy(),
    });
  }
  showIntelCard(e, t, i = '#8df4ff') {
    (this.dismissIntelCard(), (this.briefingProtected = !0));
    const s = this.add
        .container(32, 382)
        .setScrollFactor(0)
        .setDepth(40)
        .setSize(472, 210)
        .setInteractive({ useHandCursor: !0 }),
      a = this.add
        .rectangle(236, 112, 472, 210, 462879, 0.94)
        .setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(i).color, 0.8),
      l = this.add.text(28, 20, e, { fontFamily: 'Orbitron', fontSize: '13px', color: i }),
      r = this.add.rectangle(28, 47, 74, 2, Phaser.Display.Color.HexStringToColor(i).color),
      o = this.add.text(28, 65, t.join('\n'), {
        fontFamily: 'Orbitron',
        fontSize: '11px',
        color: '#dffcff',
        lineSpacing: 9,
        wordWrap: { width: 410 },
      }),
      n = this.add.text(28, 174, 'TAP / CLICK / ESC TO DISMISS', {
        fontFamily: 'Orbitron',
        fontSize: '9px',
        color: '#8ba0b8',
      });
    (s.add([a, l, r, o, n]),
      s.on('pointerdown', () => this.dismissIntelCard()),
      s.setAlpha(0),
      this.tweens.add({ targets: s, alpha: 1, x: 48, duration: 220 }),
      (this.infoCard = s),
      this.time.delayedCall(4200, () => this.dismissIntelCard(s)));
  }
  dismissIntelCard(e = this.infoCard) {
    e &&
      this.infoCard === e &&
      ((this.infoCard = null),
      (this.briefingProtected = !1),
      this.tweens.add({ targets: e, alpha: 0, duration: 160, onComplete: () => e.destroy() }));
  }
  showEnemyIntel(e) {
    const t = enemyIntel[e];
    t &&
      !this.enemyIntelSeen.has(e) &&
      (this.enemyIntelSeen.add(e),
      this.game.events.emit('enemy-discovered', e),
      this.showIntelCard(
        `TACTICAL READ · ${t.name}`,
        [
          `ATTACK · ${t.attack}`,
          `DEFENSE · ${t.defense}`,
          `TACTIC · ${t.tactic}`,
          'READ THE TELL, THEN COMMIT.',
        ],
        e.includes('boss') ? '#ffcf82' : '#ff826e',
      ),
      this.game.events.emit('narration', `${t.name}. ${t.tactic}`));
  }
  leaveAfterimage(e = 9303295) {
    if (this.motionReduced || (Number.isFinite(this.graphicsLevel) && this.graphicsLevel < 2))
      return;
    const t = this.add
      .sprite(this.player.x, this.player.y, this.player.texture.key)
      .setFlipX(this.player.flipX)
      .setTint(e)
      .setAlpha(0.42)
      .setDepth(9);
    this.tweens.add({
      targets: t,
      x: t.x - 24 * (this.player.flipX ? -1 : 1),
      alpha: 0,
      duration: 180,
      onComplete: () => t.destroy(),
    });
  }
  gadgetPulse(e, t = 16, i = 360) {
    if (this.motionReduced || (Number.isFinite(this.graphicsLevel) && this.graphicsLevel < 2))
      return;
    const s = this.add.circle(this.player.x, this.player.y, t, e, 0.3).setDepth(11);
    this.tweens.add({
      targets: s,
      scale: 3.4,
      alpha: 0,
      duration: i,
      onComplete: () => s.destroy(),
    });
  }
  alarmDuration(e) {
    return e * (this.loadout.upgrades?.includes('escape') ? 0.85 : 1);
  }
  create() {
    (this.setupNarrationVoice(), this.applyGraphicsSettings(), this.validateMission());
    ([
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
      'spring-pad',
      'checkpoint',
      'shield',
      'kinetic-ball',
      'blaster',
      'sword',
      'plasma',
      'turret',
      'chaser',
      'security',
      'guard',
      'enemy-runner',
      'invader',
      'chicken',
      'dino',
      'alien-ground',
      'egg',
      'comet',
      'dino-boss',
      'sentinel-boss',
      'storm-boss',
      'apex-boss',
      'guide-drone',
      'alien-guide',
    ].some((e) => !this.textures.exists(e)) && this.createTextures(),
      this.createAnimations(),
      (this.package = packages[this.mission.id] || {
        speedMultiplier: 1,
        upgrades: [],
        equipment: [],
      }),
      (this.packageCondition = 100),
      (this.energy = 100),
      (this.energyMax = 100),
      (this.loadout = this.mission.loadout || { upgrades: [], equipment: [] }),
      this.loadSurpriseProgress(),
      this.prepareSurpriseMission(),
      (this.gadgetCooldowns = [0, 0]),
      (this.boostedSignals = 0),
      (this.energyEmit = -1),
      (this.tutorials = new Set()),
      (this.slideTimer = 0),
      (this.vaultCooldown = 0),
      (this.airDashUsed = !1),
      (this.alarmTimer = 0),
      (this.alarms = 0),
      (this.detectionHUD = null),
      (this.detectionProgressBar = null),
      (this.detectionProgressText = null),
      (this.chaseEscapes = 0),
      (this.playerStatusHUD = null),
      (this.playerStatusHealthBar = null),
      (this.playerStatusEnergyBar = null),
      (this.playerStatusPolarityBar = null),
      (this.playerStatusHealthText = null),
      (this.playerStatusEnergyText = null),
      (this.playerStatusPolarityText = null),
      (this.playerStatusStateText = null),
      (this.combatHUD = null),
      (this.combatAmmoText = null),
      (this.combatAmmoBar = null),
      (this.combatComboText = null),
      (this.combatComboTimerText = null),
      (this.combatBestComboText = null),
      (this.combatWeaponText = null),
      (this.mobilityHUD = null),
      (this.mobilityDashText = null),
      (this.mobilityBoostText = null),
      (this.mobilityDashState = null),
      (this.mobilityBoostState = null));
    const e = Number(this.mission.goal?.x) || (Number(this.mission.spawn?.x) || 0) + 1200,
      t = Number(this.mission.spawn?.x) || 0;
    ((this.worldWidth = Math.max(e + 520, t + 5200)),
      this.physics.world.setBounds(0, 0, this.worldWidth, 860),
      this.createEnvironment(),
      this.createPlatforms(),
      this.createWorldLandmarks(),
      this.createBrutalMapDetails(),
      this.createRouteLighting(),
      this.createPlayer(),
      (this.respawnGrace = 1400),
      (this.healthInvulnerable = 2e3),
      this.createRival(),
      this.createSignals(),
      this.createSecrets(),
      this.createSurpriseCache(),
      this.createCheckpoints(),
      this.createHazards(),
      this.createWaterHazards(),
      this.createWaterWaves(),
      this.createMovingGates(),
      this.createRelayGates(),
      this.createEnemies(),
      this.createSciFiThreats(),
      this.createBuildSystems(),
      this.createBoostPads(),
      this.createChaser(),
      this.createGoal(),
      this.createAtmosphere(),
      this.createGuides(),
      this.createGuideCompanions(),
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        (this.tweens.killAll(),
          this.surpriseCachePrompt?.destroy(!0),
          (this.surpriseCachePrompt = null),
          this.surpriseCache?.destroy(),
          (this.surpriseCache = null),
          (this.surpriseCacheOpen = !1),
          (this.surpriseCacheCollected = !1),
          (this.surpriseCacheResolved = !1),
          (this.surpriseCacheInteractionLocked = !1),
          this.time.removeAllEvents(),
          this.activeShark?.destroy(),
          (this.activeShark = null),
          this.input.keyboard.off('keydown-SPACE', this.cinematicSkipHandler),
          this.input.keyboard.off('keydown-A', this.cinematicSkipHandler),
          this.input.keyboard.off('keydown-D', this.cinematicSkipHandler),
          this.input.keyboard.off('keydown-LEFT', this.cinematicSkipHandler),
          this.input.keyboard.off('keydown-RIGHT', this.cinematicSkipHandler),
          this.eventState.clear());
      }),
      this.cameras.main
        .setBounds(0, 0, this.worldWidth, 860)
        .startFollow(this.player, !0, 0.1, 0.1, this.cameraOffsetX, this.cameraOffsetY)
        .setDeadzone(185, 100),
      this._runnerReadyEmitted ||
        ((this._runnerReadyEmitted = !0), this.game.events.emit('runner-ready')),
      this.game.events.emit('health', this.health),
      this.game.events.emit('ammo', (this.ammo / this.ammoMax) * 100),
      this.game.events.emit('energy', (this.energy / this.energyMax) * 100));
  }

  createEnvironment() {
    // Warped City owns the visual environment. Keep this hook for gameplay compatibility.
  }
  findNextSafePlatform(e) {
    if (!e?.active || !this.platforms) return null;
    (e.x, e.width);
    const t = this.platforms.getChildren().filter((t) => {
      if (!t?.active || t === e || !1 === t.body?.enable) return !1;
      const i = t.x - e.x,
        s = t.y - e.y;
      return !(i < 40 || i > 900) && !(Math.abs(s) > 260);
    });
    return t.length
      ? (t.sort((t, i) => {
          const s = Math.max(0, t.x - e.x),
            a = Math.max(0, i.x - e.x);
          return s + 1.35 * Math.abs(t.y - e.y) - (a + 1.35 * Math.abs(i.y - e.y));
        }),
        t[0])
      : null;
  }
  armPlatformCollapse(e) {
    if (!e?.active || !e.getData('collapsible') || 'ready' !== e.getData('collapseState')) return;
    e.setData('collapseState', 'warning');
    const t = e.getData('warningGlow');
    (this.tweens.killTweensOf([e.getData('warning'), t].filter(Boolean)),
      e.getData('warning')?.setAlpha(0),
      t?.setAlpha(0));
    const i = (e.getData('collapseToken') || 0) + 1;
    e.setData('collapseToken', i);
    const s = e.width,
      a = e.height;
    let l = e.getData('warning'),
      r = e.getData('cracks');
    if (
      ((l && l.active) ||
        ((l = this.add
          .rectangle(e.x, e.y, Math.max(20, s - 4), Math.max(8, a - 4), 16733028, 0.14)
          .setDepth(7)),
        l.setStrokeStyle(2, 16745070, 0.72),
        e.setData('warning', l)),
      !r || !r.active)
    ) {
      ((r = this.add.graphics().setDepth(8)), r.lineStyle(2, 16733028, 0.95));
      const t = e.x - s / 2,
        i = e.y - a / 2;
      (r
        .lineBetween(t + 0.24 * s, i + 2, t + 0.34 * s, i + 0.55 * a)
        .lineBetween(t + 0.34 * s, i + 0.55 * a, t + 0.27 * s, i + a - 2)
        .lineBetween(t + 0.58 * s, i + 2, t + 0.49 * s, i + 0.44 * a)
        .lineBetween(t + 0.49 * s, i + 0.44 * a, t + 0.67 * s, i + a - 2)
        .lineBetween(t + 0.75 * s, i + 2, t + 0.66 * s, i + 0.3 * a),
        e.setData('cracks', r));
    }
    (l.setPosition(e.x, e.y).setVisible(!0).setAlpha(0.1).setScale(1),
      r.setVisible(!0).setAlpha(0.55).setPosition(0, 0),
      this.playerCue('PLATFORM UNSTABLE · MOVE', '#ff826e'),
      this.game.events.emit('feedback', 'platform_warning'),
      this.motionReduced ||
        (this.tweens.add({
          targets: l,
          alpha: { from: 0.1, to: 0.46 },
          scaleX: { from: 0.98, to: 1.02 },
          duration: 170,
          yoyo: !0,
          repeat: 5,
          ease: 'Sine.inOut',
        }),
        this.tweens.add({
          targets: t,
          alpha: { from: 0.03, to: 0.18 },
          scaleX: { from: 0.96, to: 1.04 },
          duration: 120,
          yoyo: !0,
          repeat: 7,
          ease: 'Sine.inOut',
        }),
        this.tweens.add({
          targets: r,
          alpha: { from: 0.55, to: 1 },
          duration: 150,
          yoyo: !0,
          repeat: 6,
          ease: 'Sine.inOut',
        })),
      this.time.delayedCall(1250, () => {
        e?.active &&
          e.getData('collapseToken') === i &&
          'warning' === e.getData('collapseState') &&
          this.collapsePlatform(e);
      }));
  }
  collapsePlatform(e) {
    if (!e?.active || 'warning' !== e.getData('collapseState')) return;
    (e.setData('collapseState', 'broken'),
      e.setData('collapseToken', (e.getData('collapseToken') || 0) + 1));
    const t = e.getData('warning'),
      i = e.getData('cracks');
    (t?.destroy?.(), i?.destroy?.());
    const s = e.getData('warningGlow');
    (this.tweens.killTweensOf(s),
      s?.setVisible(!1)?.setAlpha(0)?.setScale(1),
      e.setData('warning', null),
      e.setData('cracks', null));
    const a = e.getData('detail');
    (a?.setVisible(!1), e.body && (e.body.enable = !1), e.setVisible(!1));
    const l = e.getData('originalFillColor') ?? 2108739,
      r = [];
    ([
      [-0.3, 0.16],
      [-0.1, 0.08],
      [0.14, 0.14],
      [0.34, 0.07],
    ].forEach(([t, i], s) => {
      const a = this.add
        .rectangle(
          e.x + e.width * t,
          e.y + e.height * i,
          Math.max(12, 0.2 * e.width),
          Math.max(5, 0.28 * e.height),
          l,
          0.9,
        )
        .setDepth(7)
        .setAngle(s % 2 == 0 ? -8 : 8);
      (r.push(a),
        this.motionReduced ||
          this.tweens.add({
            targets: a,
            y: a.y + 70 + 12 * s,
            angle: a.angle + (s % 2 == 0 ? -26 : 26),
            alpha: 0,
            duration: 460 + 70 * s,
            ease: 'Quad.in',
            onComplete: () => a.destroy(),
          }));
    }),
      e.setData('fragments', r),
      (this.platformEmergencyTarget = this.findNextSafePlatform(e)),
      this.playerCue(
        this.platformEmergencyTarget
          ? 'PLATFORM LOST · FIND ANOTHER'
          : 'PLATFORM LOST · ROUTE AHEAD',
        '#ff5364',
      ),
      this.game.events.emit('feedback', 'platform_collapsed'),
      this.game.events.emit(
        'tutorial',
        this.platformEmergencyTarget
          ? 'PLATFORM FAILURE · MOVE TO THE NEXT PLATFORM'
          : 'PLATFORM FAILURE · ROUTE AHEAD',
      ),
      !this.motionReduced &&
        this.graphicsLevel >= 2 &&
        (this.cameras.main.flash(90, 255, 90, 100), this.shake(110, 0.008)),
      this.updateCheckpointArrow());
  }
  handlePlatformLanding(e) {
    if (
      this.finished ||
      this.respawning ||
      this.cinematicActive ||
      !this.player?.active ||
      !this.keys ||
      !this.cursors
    )
      return;
    const t = this.player.body;
    (t?.blocked?.down || t?.touching?.down) &&
      (this.platformEmergencyTarget === e &&
        ((this.platformEmergencyTarget = null), this.updateCheckpointArrow()),
      this.armPlatformCollapse(e));
  }
  resetCollapsingPlatforms() {
    const e = DISTRICT_VISUALS[this.mission.id] || DISTRICT_VISUALS['first-delivery'];
    ((this.platformEmergencyTarget = null),
      this.platforms?.getChildren()?.forEach((e) => {
        if (!e?.active || !e.getData('collapsible')) return;
        (e.setData('collapseToken', (e.getData('collapseToken') || 0) + 1),
          e.setData('collapseState', 'ready'),
          e.getData('warning')?.setVisible(!1)?.setAlpha(0)?.setScale(1),
          e.getData('warningGlow')?.setVisible(!1)?.setAlpha(0)?.setScale(1),
          e.getData('cracks')?.setVisible(!1)?.setAlpha(0)?.setScale(1));
        const t = e.getData('warning'),
          i = e.getData('warningGlow'),
          s = e.getData('cracks'),
          a = e.getData('fragments');
        (this.tweens.killTweensOf([t, i, s].filter(Boolean)),
          Array.isArray(a) && a.forEach((e) => e?.destroy?.()),
          t?.setVisible(!1)?.setAlpha(0)?.setScale(1),
          i?.setVisible(!1)?.setAlpha(0)?.setScale(1),
          s?.setVisible(!1)?.setAlpha(0)?.setScale(1),
          e.setData('fragments', null),
          e.setVisible(!0),
          e.setAlpha(1),
          e.setFillStyle(e.getData('originalFillColor'), 1),
          e.setStrokeStyle(
            e.getData('originalStrokeWidth') ?? 3,
            e.getData('originalStrokeColor') ?? 6323097,
            1,
          ));
        const l = e.getData('detail');
        (l?.setVisible(!0), l?.setAlpha(1), e.body && ((e.body.enable = !0), e.refreshBody()));
      }));
    const t = this.add.container(-700, 365).setDepth(3.2).setScrollFactor(0.16),
      i = this.add.rectangle(0, 0, this.worldWidth + 900, 10, 2504777, 0.88).setOrigin(0, 0.5),
      s = this.add.rectangle(0, -7, this.worldWidth + 900, 2, 9303295, 0.52).setOrigin(0, 0.5),
      a = this.add.rectangle(0, -9, this.worldWidth + 900, 2, 9303295, 0.1).setOrigin(0, 0.5);
    t.add([i, s, a]);
    for (let i = 180; i < this.worldWidth + 600; i += 520) {
      const s = this.add.rectangle(i, 58, 7, 116, 3426652, 0.84),
        a = this.add.rectangle(i, 4, 34, 2, e.accent, 0.34);
      t.add([s, a]);
    }
    const l = this.add.container(-420, -34),
      r = this.add
        .rectangle(0, 0, 330, 46, 660512, 0.96)
        .setOrigin(0, 0.5)
        .setStrokeStyle(2, e.accent, 0.66),
      o = this.add.rectangle(14, -25, 298, 5, 2571085, 0.92).setOrigin(0, 0.5),
      n = this.add.rectangle(14, 23, 298, 3, e.accent, 0.3).setOrigin(0, 0.5);
    l.add([r, o, n]);
    for (let t = 0; t < 6; t++) {
      const i = 34 + 48 * t,
        s = this.add.rectangle(i, -2, 36, 22, 397338, 0.96).setStrokeStyle(1, 6256008, 0.46),
        a = this.add.rectangle(i, -2, 28, 13, t % 3 == 0 ? e.accent : 16765038, 0.18),
        r = this.add.rectangle(i, 2, 20, 2, 15400959, 0.16);
      (l.add([s, a, r]),
        this.motionReduced ||
          (this.tweens.add({
            targets: a,
            alpha: { from: 0.06, to: 0.34 },
            duration: 700 + 100 * t,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 160 * t,
          }),
          this.tweens.add({
            targets: r,
            alpha: { from: 0.04, to: 0.28 },
            duration: 900 + 90 * t,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 250 + 110 * t,
          })));
    }
    const h = this.add
        .triangle(330, 0, 0, -23, 0, 23, 42, 0, 726820, 0.98)
        .setStrokeStyle(2, e.accent, 0.62),
      d = this.add.circle(346, 0, 5, 15400959, 0.92),
      c = this.add.ellipse(382, 0, 70, 34, e.accent, 0.025);
    (l.add([h, d, c]),
      t.add(l),
      this.motionReduced ||
        (this.tweens.add({
          targets: l,
          x: this.worldWidth + 500,
          duration: 18e3,
          repeat: -1,
          delay: 3500,
          ease: 'Linear',
        }),
        this.tweens.add({
          targets: c,
          alpha: { from: 0.012, to: 0.07 },
          scaleX: { from: 0.75, to: 1.25 },
          duration: 900,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
        }),
        this.tweens.add({
          targets: a,
          alpha: { from: 0.05, to: 0.17 },
          duration: 1400,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
        })));
    [
      { x: 520, y: 330, w: 210 },
      { x: 1260, y: 285, w: 250 },
      { x: 2020, y: 350, w: 190 },
      { x: 2720, y: 300, w: 270 },
      { x: 3460, y: 340, w: 220 },
    ].forEach((t, i) => {
      const s = this.add.container(t.x, t.y).setDepth(3.7).setScrollFactor(0.22),
        a = this.add.rectangle(0, 0, t.w, 30, 1056045, 0.94).setStrokeStyle(1.5, e.accent, 0.48),
        l = this.add.rectangle(0, -3, t.w - 20, 15, 7526655, 0.045),
        r = this.add.rectangle(0, -17, t.w - 12, 3, e.accent, 0.48),
        o = this.add.rectangle(0, 16, t.w - 12, 2, e.accent, 0.22);
      s.add([a, l, r, o]);
      for (let e = -t.w / 2 + 24; e < t.w / 2 - 10; e += 30) {
        const t = this.add.rectangle(e, -2, 2, 20, 7374490, 0.35);
        s.add(t);
      }
      const n = [];
      for (let i = 0; i < 5; i++) {
        const a = this.add.circle(
          -t.w / 2 + 34 + 38 * i,
          -3,
          2,
          i % 2 == 0 ? e.accent : 16765038,
          0.28,
        );
        (n.push(a), s.add(a));
      }
      this.motionReduced ||
        (this.tweens.add({
          targets: l,
          alpha: { from: 0.025, to: 0.09 },
          duration: 1400 + 180 * i,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
          delay: 220 * i,
        }),
        this.tweens.add({
          targets: r,
          alpha: { from: 0.22, to: 0.72 },
          duration: 1e3 + 140 * i,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
          delay: 190 * i,
        }),
        n.forEach((e, t) => {
          this.tweens.add({
            targets: e,
            alpha: { from: 0.05, to: 0.72 },
            duration: 600 + 90 * t,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 180 * i + 130 * t,
          });
        }));
    });
    [0.18 * this.worldWidth, 0.52 * this.worldWidth, 0.82 * this.worldWidth].forEach((t, i) => {
      const s = this.add.container(t, 0).setDepth(4.15).setScrollFactor(0.26),
        a = 180 + (i % 2) * 35,
        l = 205 + (i % 3) * 22,
        r = this.add
          .rectangle(-88, 500 - a / 2, 14, a, 1517112, 0.94)
          .setStrokeStyle(1, 6979732, 0.56),
        o = this.add
          .rectangle(88, 500 - l / 2, 14, l, 1517112, 0.94)
          .setStrokeStyle(1, 6979732, 0.56);
      s.add([r, o]);
      const n = this.add
        .rectangle(0, 500 - Math.max(a, l), 190, 12, 1121838, 0.96)
        .setStrokeStyle(2, e.accent, 0.56);
      s.add(n);
      const h = this.mission.id;
      if ('first-delivery' === h) {
        const e = this.add.rectangle(0, n.y + 18, 144, 3, 16765038, 0.56);
        s.add(e);
        for (let e = -54; e <= 54; e += 27) s.add(this.add.circle(e, n.y + 31, 4, 16765038, 0.68));
      } else if ('dead-drop' === h) {
        const e = this.add.rectangle(0, n.y + 22, 150, 5, 16742981, 0.48);
        (s.add(e),
          s.add(this.add.rectangle(0, n.y - 17, 84, 4, 16760155, 0.42)),
          s.add(this.add.rectangle(0, n.y - 3, 3, 30, 7373719, 0.72)),
          s.add(this.add.rectangle(0, n.y + 14, 24, 8, 2504519, 0.92)));
      } else if ('blackout' === h) {
        const e = this.add.rectangle(0, n.y + 20, 158, 4, 16733028, 0.3);
        s.add(e);
        for (let e = -58; e <= 58; e += 29) s.add(this.add.circle(e, n.y + 34, 3, 6747391, 0.18));
      } else if ('pursuit' === h) {
        const e = this.add.rectangle(0, n.y + 16, 156, 3, 16733028, 0.52),
          t = this.add.rectangle(0, n.y + 25, 132, 2, 7981567, 0.3);
        s.add([e, t]);
        for (let e = -52; e <= 52; e += 26) s.add(this.add.circle(e, n.y + 34, 3, 16733028, 0.48));
      } else if ('signal-storm' === h) {
        const t = this.add.circle(0, n.y + 17, 26, e.accent, 0).setStrokeStyle(2, e.accent, 0.5),
          a = this.add.circle(0, n.y + 17, 5, 15400959, 0.82);
        (s.add([t, a]),
          this.motionReduced ||
            this.tweens.add({
              targets: t,
              angle: { from: 0, to: 360 },
              duration: 3600,
              repeat: -1,
              ease: 'Linear',
              delay: 250 * i,
            }));
      } else if ('corporate-lockdown' === h) {
        const t = this.add
            .rectangle(0, n.y + 20, 148, 38, 659482, 0.66)
            .setStrokeStyle(1, 16734799, 0.58),
          a = this.add.rectangle(-65, n.y + 20, 2, 30, e.accent, 0.56);
        (s.add([t, a]),
          this.motionReduced ||
            this.tweens.add({
              targets: a,
              x: 65,
              duration: 1200,
              repeat: -1,
              yoyo: !0,
              ease: 'Sine.inOut',
              delay: 200 * i,
            }));
      } else if ('final-relay' === h) {
        const e = this.add.circle(0, n.y + 20, 30, 16761415, 0.018),
          t = this.add.circle(0, n.y + 20, 16, 16761415, 0).setStrokeStyle(2, 16761415, 0.62),
          a = this.add.circle(0, n.y + 20, 5, 16773301, 0.9);
        (s.add([e, t, a]),
          this.motionReduced ||
            (this.tweens.add({
              targets: t,
              scale: { from: 0.78, to: 1.4 },
              alpha: { from: 0.58, to: 0 },
              duration: 1200,
              repeat: -1,
              ease: 'Sine.out',
              delay: 220 * i,
            }),
            this.tweens.add({
              targets: e,
              scale: { from: 0.74, to: 1.28 },
              alpha: { from: 0.008, to: 0.06 },
              duration: 1500,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 180 * i,
            })));
      }
      const d = this.add.circle(-88, 500 - a + 16, 4, e.accent, 0.48),
        c = this.add.circle(88, 500 - l + 16, 4, e.accent, 0.48);
      (s.add([d, c]),
        s.add(this.add.rectangle(0, 611, 176, 3, e.accent, 0.22)),
        this.motionReduced ||
          (this.tweens.add({
            targets: [d, c],
            alpha: { from: 0.08, to: 0.8 },
            scale: { from: 0.72, to: 1.28 },
            duration: 780 + 130 * i,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 180 * i,
          }),
          this.tweens.add({
            targets: n,
            alpha: { from: 0.72, to: 1 },
            duration: 1500 + 160 * i,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 230 * i,
          })));
    });
    [
      { x: 520, y: 330, width: 210, count: 3 },
      { x: 1260, y: 285, width: 250, count: 4 },
      { x: 2020, y: 350, width: 190, count: 3 },
      { x: 2720, y: 300, width: 270, count: 4 },
      { x: 3460, y: 340, width: 220, count: 3 },
    ].forEach((t, i) => {
      for (let s = 0; s < t.count; s++) {
        const a = -t.width / 2 + 28 + s * ((t.width - 56) / Math.max(1, t.count - 1)),
          l = this.add
            .container(t.x + a, t.y - 17)
            .setDepth(3.92)
            .setScrollFactor(0.24),
          r = this.add.circle(0, -7, 3.2, 659739, 0.92),
          o = this.add.rectangle(0, 1, 7, 12, 1055787, 0.94).setOrigin(0.5),
          n = this.add.rectangle(
            s % 2 == 0 ? -3 : 3,
            0,
            2,
            2,
            s % 3 == 0 ? e.accent : 16765038,
            0.52,
          ),
          h = this.add.rectangle(-2, 9, 2, 8, 1121065, 0.92),
          d = this.add.rectangle(2, 9, 2, 8, 1121065, 0.92),
          c = this.add.rectangle(-5, 2, 3, 7, 1714747, 0.82);
        if (
          (l.add([r, o, n, h, d, c]),
          l.setScale(s % 3 == 0 ? 0.9 : s % 3 == 1 ? 1 : 0.82),
          !this.motionReduced)
        ) {
          const e = (i + s) % 2 == 0 ? 1 : -1,
            a = Math.max(20, 0.28 * t.width);
          (this.tweens.add({
            targets: l,
            x: l.x + e * a,
            duration: 4200 + 420 * i + 260 * s,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 300 * i + 240 * s,
          }),
            this.tweens.add({
              targets: l,
              y: l.y - 2,
              duration: 520 + 70 * s,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 90 * s,
            }),
            this.tweens.add({
              targets: n,
              alpha: { from: 0.08, to: 0.68 },
              duration: 850 + 90 * i,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 180 * i + 130 * s,
            }));
        }
      }
    });
    [
      [375, 465],
      [1080, 450],
      [1595, 474],
      [2265, 454],
      [2875, 468],
      [3500, 447],
    ].forEach(([t, i], s) => {
      const a = this.add.container(t, i - 17).setDepth(6.34),
        l = this.add.circle(0, -7, 2.5, 330773, 0.94),
        r = this.add.rectangle(0, 1, 6, 12, 726048, 0.95),
        o = this.add.rectangle(0, 1, 3, 7, s % 2 == 0 ? e.accent : 16765038, 0.32),
        n = this.add.rectangle(6, 4, 5, 2, 7571354, 0.42);
      (a.add([l, r, o, n]),
        this.motionReduced ||
          (this.tweens.add({
            targets: a,
            x: t + (s % 2 == 0 ? 14 : -14),
            duration: 2600 + 170 * s,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 220 * s,
          }),
          this.tweens.add({
            targets: o,
            alpha: { from: 0.08, to: 0.46 },
            duration: 900 + 100 * s,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 130 * s,
          })));
    });
    [
      { x: 420, y: 235, width: 300, height: 220 },
      { x: 1120, y: 205, width: 360, height: 250 },
      { x: 1840, y: 245, width: 280, height: 210 },
      { x: 2580, y: 210, width: 390, height: 250 },
      { x: 3330, y: 235, width: 320, height: 225 },
    ].forEach((t, i) => {
      const s = this.add.container(t.x, t.y).setDepth(8.15).setScrollFactor(0.78),
        a = this.add.rectangle(0, 0, t.width, 16, 1056043, 0.95).setStrokeStyle(2, 6650766, 0.54),
        l = this.add
          .rectangle(-t.width / 2 + 8, t.height / 2, 16, t.height, 1056043, 0.94)
          .setStrokeStyle(1, 6650766, 0.46),
        r = this.add
          .rectangle(t.width / 2 - 8, t.height / 2, 16, t.height, 1056043, 0.94)
          .setStrokeStyle(1, 6650766, 0.46);
      s.add([a, l, r]);
      const o = this.add.rectangle(0, 12, t.width - 30, 3, e.accent, 0.3);
      s.add(o);
      const n = Math.max(4, Math.floor(t.width / 72));
      for (let a = 0; a < n; a++) {
        const l = -t.width / 2 + 42 + a * ((t.width - 84) / Math.max(1, n - 1)),
          r = this.add.rectangle(l, 24, 3, t.height - 52, 5400957, 0.44),
          o = this.add.circle(l, 22, 3, a % 2 == 0 ? e.accent : 16765038, 0.38);
        (s.add([r, o]),
          this.motionReduced ||
            this.tweens.add({
              targets: o,
              alpha: { from: 0.06, to: 0.82 },
              duration: 620 + 90 * a + 80 * i,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 180 * i + 120 * a,
            }));
      }
      const h = this.add.rectangle(0.23 * -t.width, 66, 2, 100, 6716559, 0.48),
        d = this.add.rectangle(0.22 * t.width, 82, 2, 118, 6716559, 0.42),
        c = this.add.circle(0.23 * -t.width, 118, 4, e.accent, 0.34),
        y = this.add.circle(0.22 * t.width, 142, 4, 16733028, 0.28);
      s.add([h, d, c, y]);
      const p = this.add.rectangle(
        0,
        t.height - 5,
        t.width - 28,
        4,
        i % 2 == 0 ? e.accent : 16733028,
        0.2,
      );
      s.add(p);
      const f = this.add.rectangle(0, 44, 58, 16, 594719, 0.94).setStrokeStyle(1, e.accent, 0.46),
        u = this.add.circle(0, 44, 5, e.accent, 0.48),
        m = this.add.circle(0, 44, 18, e.accent, 0.018);
      (s.add([f, u, m]),
        this.motionReduced ||
          (this.tweens.add({
            targets: o,
            alpha: { from: 0.12, to: 0.6 },
            duration: 1100 + 150 * i,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 230 * i,
          }),
          this.tweens.add({
            targets: u,
            scale: { from: 0.72, to: 1.25 },
            alpha: { from: 0.12, to: 0.94 },
            duration: 760 + 100 * i,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 160 * i,
          }),
          this.tweens.add({
            targets: m,
            scale: { from: 0.72, to: 1.35 },
            alpha: { from: 0.005, to: 0.075 },
            duration: 1350 + 130 * i,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 190 * i,
          }),
          this.tweens.add({
            targets: [c, y],
            alpha: { from: 0.04, to: 0.72 },
            scale: { from: 0.7, to: 1.28 },
            duration: 900 + 100 * i,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 300 + 170 * i,
          })));
    });
    [
      { x: 140, y: 260, width: 180, angle: -7 },
      { x: 980, y: 190, width: 210, angle: 5 },
      { x: 1980, y: 215, width: 170, angle: -5 },
      { x: 3020, y: 180, width: 230, angle: 6 },
      { x: 3780, y: 250, width: 190, angle: -6 },
    ].forEach((t, i) => {
      (this.add
        .rectangle(t.x, t.y, t.width, 7, 660512, 0.78)
        .setAngle(t.angle)
        .setDepth(8.45)
        .setScrollFactor(0.88),
        this.add
          .rectangle(t.x, t.y - 5, t.width - 14, 2, e.accent, 0.26)
          .setAngle(t.angle)
          .setDepth(8.46)
          .setScrollFactor(0.88));
      const s = this.add
        .circle(
          t.x + (i % 2 == 0 ? t.width / 2 - 18 : -t.width / 2 + 18),
          t.y - 8,
          3,
          e.accent,
          0.4,
        )
        .setDepth(8.47)
        .setScrollFactor(0.88);
      this.motionReduced ||
        this.tweens.add({
          targets: s,
          alpha: { from: 0.06, to: 0.88 },
          duration: 700 + 90 * i,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
          delay: 160 * i,
        });
    });
    const y = [];
    [260, 720, 1180, 1660, 2140, 2620, 3100, 3580].forEach((t, i) => {
      const s = this.add
        .rectangle(t, 475, 250, 115, e.accent, 0)
        .setOrigin(0.5)
        .setDepth(1.75)
        .setScrollFactor(0.15);
      (y.push(s),
        this.motionReduced ||
          this.tweens.add({
            targets: s,
            alpha: { from: 0.002, to: 0.009 },
            duration: 2200 + 180 * i,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 260 * i,
          }));
    });
    const p = this.add
        .rectangle(750, 475, 1500, 190, e.accent, 0)
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1.85),
      f = this.add
        .rectangle(750, 505, 1500, 3, e.accent, 0)
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(2.05),
      u = () => {
        if (this.motionReduced) return;
        (Phaser.Utils.Array.Shuffle(y.slice())
          .slice(0, Phaser.Math.Between(2, 4))
          .forEach((e, t) => {
            this.tweens.add({
              targets: e,
              alpha: { from: 0.008, to: 0.05 },
              duration: 90 + 35 * t,
              yoyo: !0,
              ease: 'Stepped',
              delay: 70 * t,
            });
          }),
          this.tweens.add({
            targets: p,
            alpha: { from: 0, to: 0.03 },
            duration: 80,
            yoyo: !0,
            ease: 'Stepped',
          }),
          this.tweens.add({
            targets: f,
            alpha: { from: 0, to: 0.24 },
            scaleX: { from: 0.3, to: 1 },
            duration: 140,
            yoyo: !0,
            ease: 'Quad.out',
          }));
      };
    this.motionReduced ||
      ((this.cityPowerEventTimer = this.time.addEvent({ delay: 6200, loop: !0, callback: u })),
      this.time.delayedCall(2100, u));
    const m = [];
    ([240, 540, 860, 1190, 1510, 1840, 2190, 2520, 2860, 3180, 3490, 3810].forEach((t, i) => {
      const s = this.add
          .rectangle(t, 594, 28, 4, i % 3 == 0 ? 16765038 : e.accent, 0.18)
          .setOrigin(0.5)
          .setDepth(4.65),
        a = this.add
          .ellipse(t, 608, 76, 18, i % 3 == 0 ? 16765038 : e.accent, 0.01)
          .setOrigin(0.5)
          .setDepth(4.55),
        l = this.add.circle(t, 592, 3, i % 3 == 0 ? 16765038 : e.accent, 0.22).setDepth(4.7);
      m.push({ x: t, fixture: s, glow: a, node: l, active: !1 });
    }),
      (this.cityReactiveTick = this.time.addEvent({
        delay: 140,
        loop: !0,
        callback: () => {
          const e = this.player;
          if (!e || !e.active) return;
          const t = Number(e.x);
          Number.isFinite(t) &&
            m.forEach((e) => {
              const i = Math.abs(t - e.x) < 150;
              i && !e.active
                ? ((e.active = !0),
                  this.tweens.killTweensOf([e.fixture, e.glow, e.node]),
                  this.tweens.add({
                    targets: e.fixture,
                    alpha: { from: 0.12, to: 0.92 },
                    duration: 110,
                    yoyo: !0,
                    ease: 'Quad.out',
                  }),
                  this.tweens.add({
                    targets: e.glow,
                    alpha: { from: 0.008, to: 0.085 },
                    scaleX: { from: 0.78, to: 1.28 },
                    duration: 180,
                    yoyo: !0,
                    ease: 'Quad.out',
                  }),
                  this.tweens.add({
                    targets: e.node,
                    scale: { from: 0.7, to: 1.45 },
                    alpha: { from: 0.12, to: 0.88 },
                    duration: 150,
                    yoyo: !0,
                    ease: 'Quad.out',
                  }))
                : !i &&
                  e.active &&
                  ((e.active = !1),
                  this.tweens.add({
                    targets: e.fixture,
                    alpha: 0.18,
                    duration: 260,
                    ease: 'Sine.out',
                  }),
                  this.tweens.add({
                    targets: e.glow,
                    alpha: 0.01,
                    duration: 300,
                    ease: 'Sine.out',
                  }),
                  this.tweens.add({
                    targets: e.node,
                    alpha: 0.22,
                    scale: 1,
                    duration: 240,
                    ease: 'Sine.out',
                  }));
            });
        },
      })),
      this.events.once('shutdown', () => {
        (this.cityPowerEventTimer?.remove?.(), this.cityReactiveTick?.remove?.());
      }));
    const g = [];
    ([
      { x: 560, y: 574, width: 132 },
      { x: 1280, y: 568, width: 146 },
      { x: 1980, y: 575, width: 126 },
      { x: 2680, y: 570, width: 150 },
      { x: 3420, y: 574, width: 136 },
      { x: 4140, y: 568, width: 148 },
    ].forEach((t, i) => {
      const s = this.add.container(t.x, t.y).setDepth(4.96).setScrollFactor(0.46),
        a = this.add.ellipse(0, 15, t.width + 20, 10, 132619, 0.34),
        l = this.add.rectangle(0, 8, t.width, 9, 1122092, 0.98).setStrokeStyle(1, 6322056, 0.6),
        r = this.add.graphics();
      r.lineStyle(2, e.accent, 0.38);
      for (let e = 0; e < 5; e++) {
        const i = -t.width / 2 + 18 + e * ((t.width - 36) / 4);
        r.lineBetween(i - 7, 1, i + 7, 1);
      }
      const o = this.add.rectangle(0, -30, 18, 46, 726820, 0.98).setStrokeStyle(1.5, 6388106, 0.68),
        n = this.add.ellipse(0, -55, 28, 12, 1452602, 0.98).setStrokeStyle(1, e.accent, 0.55),
        h = this.add.circle(0, -55, 4, e.accent, 0.82),
        d = this.add.graphics();
      (d
        .lineStyle(1.5, 15400959, 0.64)
        .lineBetween(-8, -39, -4, -43)
        .lineBetween(-4, -43, 5, -43)
        .lineBetween(5, -43, 9, -39)
        .lineBetween(-9, -39, 9, -39),
        d.fillStyle(e.accent, 0.52).fillCircle(-5, -37, 2).fillCircle(5, -37, 2));
      const c = this.add
          .rectangle(0, -30, 32, 24, e.accent, 0.025)
          .setStrokeStyle(1, e.accent, 0.16),
        y = this.add.rectangle(-25, -22, 6, 16, e.accent, 0.2),
        p = this.add.rectangle(25, -22, 6, 16, e.accent, 0.2),
        f = [];
      for (let t = 0; t < 4; t++) {
        const i = 12 * t - 18,
          s = this.add.circle(i, 13, 2, 0 === t || 3 === t ? 16765038 : e.accent, 0.62);
        f.push(s);
      }
      const u = this.add.rectangle(0, 18, 72, 2, 14679295, 0.08),
        m = this.add.rectangle(-35, 18, 24, 2, e.accent, 0.38).setOrigin(0, 0.5),
        S = this.add
          .text(0, 29, i % 2 == 0 ? 'TAXI // READY' : 'RIDESHARE // ONLINE', {
            fontFamily: 'Orbitron',
            fontSize: '5px',
            fontStyle: 'bold',
            color: '#92a9b6',
            stroke: '#07111d',
            strokeThickness: 2,
            letterSpacing: 0.55,
            align: 'center',
          })
          .setOrigin(0.5),
        w = this.add.rectangle(0, 3, t.width - 12, 2, e.accent, 0.24);
      (s.add([a, l, r, o, n, h, d, c, y, p, ...f, u, m, S, w]),
        g.push({
          group: s,
          beaconCore: h,
          taxiIcon: d,
          holoField: c,
          statusLeft: y,
          statusRight: p,
          statusNodes: f,
          waitFill: m,
          curbGlow: w,
          index: i,
        }));
    }),
      this.motionReduced ||
        g.forEach((e) => {
          (this.tweens.add({
            targets: e.beaconCore,
            alpha: { from: 0.16, to: 1 },
            scale: { from: 0.72, to: 1.36 },
            duration: 620 + 90 * e.index,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 150 * e.index,
          }),
            this.tweens.add({
              targets: e.taxiIcon,
              alpha: { from: 0.22, to: 0.92 },
              scaleX: { from: 0.9, to: 1.06 },
              duration: 900 + 80 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 170 * e.index,
            }),
            this.tweens.add({
              targets: e.holoField,
              alpha: { from: 0.012, to: 0.075 },
              scaleX: { from: 0.84, to: 1.12 },
              duration: 1300 + 100 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 120 * e.index,
            }),
            this.tweens.add({
              targets: [e.statusLeft, e.statusRight],
              alpha: { from: 0.05, to: 0.52 },
              scaleY: { from: 0.55, to: 1.12 },
              duration: 800 + 80 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 140 * e.index,
            }),
            e.statusNodes.forEach((t, i) => {
              this.tweens.add({
                targets: t,
                alpha: { from: 0.08, to: 0.92 },
                scale: { from: 0.7, to: 1.3 },
                duration: 420 + 80 * i,
                yoyo: !0,
                repeat: -1,
                ease: 'Sine.inOut',
                delay: 120 * e.index + 180 * i,
              });
            }),
            this.tweens.add({
              targets: e.waitFill,
              scaleX: { from: 0.35, to: 1.04 },
              alpha: { from: 0.08, to: 0.52 },
              duration: 1650 + 120 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 210 * e.index,
            }),
            this.tweens.add({
              targets: e.curbGlow,
              alpha: { from: 0.07, to: 0.34 },
              scaleX: { from: 0.82, to: 1.04 },
              duration: 1100 + 90 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 160 * e.index,
            }));
        }));
    const S = [];
    ([
      { x: 340, y: 510, height: 96, direction: 1 },
      { x: 940, y: 502, height: 104, direction: -1 },
      { x: 1540, y: 512, height: 92, direction: 1 },
      { x: 2230, y: 500, height: 108, direction: -1 },
      { x: 2910, y: 510, height: 98, direction: 1 },
      { x: 3610, y: 503, height: 104, direction: -1 },
    ].forEach((t, i) => {
      const s = this.add.container(t.x, t.y).setDepth(5.14).setScrollFactor(0.58),
        a = this.add.ellipse(0, 4, 26, 8, 132877, 0.62).setStrokeStyle(1, 5467003, 0.42),
        l = this.add
          .rectangle(0, -t.height / 2, 6, t.height, 1056041, 0.96)
          .setStrokeStyle(1, 6322570, 0.46),
        r = this.add.rectangle(2 * t.direction, -t.height / 2, 1.5, t.height - 18, e.accent, 0.24),
        o = this.add
          .rectangle(5 * t.direction, -t.height - 5, 25, 17, 661026, 0.98)
          .setStrokeStyle(1.5, 7045520, 0.72),
        n = this.add
          .circle(15 * t.direction, -t.height - 5, 5, 463130, 1)
          .setStrokeStyle(1, e.accent, 0.62),
        h = this.add.circle(15 * t.direction, -t.height - 5, 2.2, e.accent, 0.82),
        d = this.add.circle(3 * t.direction, -t.height - 18, 2.3, e.accent, 0.58),
        c = this.add
          .rectangle(54 * t.direction, 10 - t.height, 82, 2, e.accent, 0.065)
          .setOrigin(0, 0.5)
          .setAngle(t.direction > 0 ? 8 : -8),
        y = this.add
          .rectangle(45 * t.direction, 17 - t.height, 62, 1, 14679295, 0.11)
          .setOrigin(0, 0.5),
        p = this.add
          .rectangle(5 * t.direction, 16 - t.height, 28, 7, 529182, 0.92)
          .setStrokeStyle(1, e.accent, 0.24),
        f = this.add
          .text(5 * t.direction, 16 - t.height, i % 2 == 0 ? 'CAM // LIVE' : 'SEC // ACTIVE', {
            fontFamily: 'Orbitron',
            fontSize: '4px',
            fontStyle: 'bold',
            color: '#8fa7b5',
            stroke: '#06101a',
            strokeThickness: 2,
            letterSpacing: 0.45,
          })
          .setOrigin(0.5),
        u = [];
      for (let t = 0; t < 3; t++) {
        const i = this.add.circle(8 * t - 8, 1, 1.7, e.accent, 0.42);
        u.push(i);
      }
      (s.add([a, l, r, c, y, o, n, h, d, p, f, ...u]),
        S.push({
          group: s,
          lensCore: h,
          statusNode: d,
          scanBeam: c,
          scanLine: y,
          statusPlate: p,
          statusText: f,
          baseNodes: u,
          direction: t.direction,
          index: i,
        }));
    }),
      this.motionReduced ||
        S.forEach((e) => {
          (this.tweens.add({
            targets: e.lensCore,
            alpha: { from: 0.08, to: 0.96 },
            scale: { from: 0.74, to: 1.34 },
            duration: 680 + 90 * e.index,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 140 * e.index,
          }),
            this.tweens.add({
              targets: e.scanBeam,
              angle: { from: e.direction > 0 ? 2 : -2, to: e.direction > 0 ? 16 : -16 },
              alpha: { from: 0.025, to: 0.12 },
              duration: 1900 + 110 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 180 * e.index,
            }),
            this.tweens.add({
              targets: e.scanLine,
              angle: { from: e.direction > 0 ? -3 : 3, to: e.direction > 0 ? 12 : -12 },
              alpha: { from: 0.035, to: 0.24 },
              duration: 1900 + 110 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 120 + 180 * e.index,
            }),
            this.tweens.add({
              targets: [e.statusPlate, e.statusText],
              alpha: { from: 0.44, to: 1 },
              duration: 1e3 + 80 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 120 * e.index,
            }),
            e.baseNodes.forEach((t, i) => {
              this.tweens.add({
                targets: t,
                alpha: { from: 0.05, to: 0.82 },
                scale: { from: 0.7, to: 1.28 },
                duration: 420 + 80 * i,
                yoyo: !0,
                repeat: -1,
                ease: 'Sine.inOut',
                delay: 150 * e.index + 180 * i,
              });
            }),
            this.tweens.add({
              targets: e.statusNode,
              alpha: { from: 0.08, to: 0.96 },
              scale: { from: 0.7, to: 1.4 },
              duration: 760 + 70 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 130 * e.index,
            }));
        }));
    const w = [];
    ([
      { x: 760, y: 548, scale: 0.84, phase: 0 },
      { x: 1730, y: 532, scale: 1, phase: 1 },
      { x: 2440, y: 550, scale: 0.9, phase: 2 },
      { x: 3180, y: 536, scale: 1.08, phase: 3 },
      { x: 3980, y: 550, scale: 0.92, phase: 4 },
      { x: 4720, y: 534, scale: 1.04, phase: 5 },
    ].forEach((t, i) => {
      const s = this.add.container(t.x, t.y).setDepth(4.88).setScrollFactor(0.54).setScale(t.scale),
        a = this.add.ellipse(0, 8, 72, 14, 132877, 0.62).setStrokeStyle(1, 5992833, 0.42),
        l = this.add.rectangle(0, 4, 48, 8, 1056041, 0.96).setStrokeStyle(1, 6650763, 0.62),
        r = this.add.rectangle(0, -34, 7, 70, 1055527, 0.96).setStrokeStyle(1, 6716299, 0.55),
        o = this.add.rectangle(0, -34, 2, 60, e.accent, 0.3),
        n = this.add.graphics();
      n.lineStyle(2, 5466747, 0.56)
        .lineBetween(-24, -63, 24, -63)
        .lineBetween(-24, -63, -11, -48)
        .lineBetween(24, -63, 11, -48);
      const h = this.add.ellipse(0, -38, 58, 24, e.accent, 0.015).setStrokeStyle(2, e.accent, 0.48),
        d = this.add.ellipse(0, -38, 42, 18, 14679295, 0.012).setStrokeStyle(1.5, 14679295, 0.4),
        c = this.add.ellipse(0, -38, 27, 12, e.accent, 0.018).setStrokeStyle(1, e.accent, 0.56),
        y = this.add.circle(0, -38, 9, e.accent, 0.085).setStrokeStyle(1, e.accent, 0.48),
        p = this.add.circle(0, -38, 3.2, e.accent, 0.88),
        f = this.add.circle(0, 0, 3, e.accent, 0.62),
        u = [
          this.add.circle(-21, -7, 2, e.accent, 0.42),
          this.add.circle(21, -7, 2, e.accent, 0.42),
          this.add.circle(-16, 5, 1.6, 14679295, 0.35),
          this.add.circle(16, 5, 1.6, 14679295, 0.35),
        ],
        m = this.add
          .text(0, 22, i % 2 == 0 ? 'KINETIC // ACTIVE' : 'PUBLIC ART // SYNC', {
            fontFamily: 'Orbitron',
            fontSize: '4.5px',
            fontStyle: 'bold',
            color: '#8fa7b5',
            stroke: '#06101a',
            strokeThickness: 2,
            letterSpacing: 0.45,
            align: 'center',
          })
          .setOrigin(0.5),
        g = this.add.rectangle(0, 12, 34, 2, e.accent, 0.25);
      (s.add([a, l, r, o, n, h, d, c, y, p, f, ...u, m, g]),
        w.push({
          group: s,
          outerRing: h,
          midRing: d,
          innerRing: c,
          coreOuter: y,
          core: p,
          lowerNode: f,
          sideNodes: u,
          bottomBar: g,
          index: i,
          phase: t.phase,
        }));
    }),
      this.motionReduced ||
        w.forEach((e) => {
          (this.tweens.add({
            targets: e.outerRing,
            angle: 360,
            duration: 4200 + 240 * e.index,
            repeat: -1,
            ease: 'Linear',
            delay: 140 * e.phase,
          }),
            this.tweens.add({
              targets: e.midRing,
              angle: -360,
              duration: 3e3 + 190 * e.index,
              repeat: -1,
              ease: 'Linear',
              delay: 120 + 160 * e.phase,
            }),
            this.tweens.add({
              targets: e.innerRing,
              angle: 360,
              duration: 2200 + 150 * e.index,
              repeat: -1,
              ease: 'Linear',
              delay: 260 + 130 * e.phase,
            }),
            this.tweens.add({
              targets: [e.coreOuter, e.core],
              scale: { from: 0.72, to: 1.38 },
              alpha: { from: 0.1, to: 0.92 },
              duration: 760 + 90 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 170 * e.phase,
            }),
            this.tweens.add({
              targets: e.lowerNode,
              scale: { from: 0.65, to: 1.35 },
              alpha: { from: 0.08, to: 0.88 },
              duration: 620 + 80 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 180 + 120 * e.phase,
            }),
            e.sideNodes.forEach((t, i) => {
              this.tweens.add({
                targets: t,
                alpha: { from: 0.04, to: 0.72 },
                scale: { from: 0.7, to: 1.24 },
                duration: 420 + 90 * i,
                yoyo: !0,
                repeat: -1,
                ease: 'Sine.inOut',
                delay: 130 * e.phase + 170 * i,
              });
            }),
            this.tweens.add({
              targets: e.bottomBar,
              scaleX: { from: 0.45, to: 1.08 },
              alpha: { from: 0.06, to: 0.38 },
              duration: 1200 + 100 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 150 * e.phase,
            }));
        }));
    const x = [];
    ([
      { x: 900, y: 558, width: 128, height: 58, route: 'LINE // 03' },
      { x: 1600, y: 552, width: 142, height: 64, route: 'LINE // 07' },
      { x: 2350, y: 560, width: 126, height: 56, route: 'NIGHT // 11' },
      { x: 3050, y: 553, width: 148, height: 63, route: 'EXPRESS // 4' },
      { x: 3800, y: 558, width: 132, height: 58, route: 'GRID // 09' },
      { x: 4550, y: 552, width: 146, height: 64, route: 'APEX // 2' },
    ].forEach((t, i) => {
      const s = this.add.container(t.x, t.y).setDepth(5.02).setScrollFactor(0.62),
        a = this.add.rectangle(0, 25, t.width, 7, 726561, 0.98).setStrokeStyle(1, 6650250, 0.54),
        l = this.add.rectangle(0, 20, t.width - 14, 2, e.accent, 0.26),
        r = this.add
          .rectangle(-t.width / 2 + 9, -8, 5, t.height, 1516849, 0.96)
          .setStrokeStyle(1, 6387592, 0.42),
        o = this.add
          .rectangle(t.width / 2 - 9, -8, 5, t.height, 1516849, 0.96)
          .setStrokeStyle(1, 6387592, 0.42),
        n = this.add
          .rectangle(0, -t.height / 2 + 3, t.width, 7, 1055784, 0.98)
          .setStrokeStyle(1.5, e.accent, 0.42),
        h = this.add.rectangle(0, -t.height / 2 + 7, t.width - 18, 2, e.accent, 0.34),
        d = this.add
          .rectangle(0, -7, t.width - 28, t.height - 24, 529182, 0.28)
          .setStrokeStyle(1, 5861508, 0.24),
        c = this.add.graphics();
      c.lineStyle(1, 6321544, 0.28)
        .lineBetween(-t.width / 4, -34, -t.width / 4, 14)
        .lineBetween(t.width / 4, -34, t.width / 4, 14);
      const y = this.add.rectangle(0, -23, 62, 16, 397596, 0.94).setStrokeStyle(1, e.accent, 0.42),
        p = this.add
          .text(0, -23, t.route, {
            fontFamily: 'Orbitron',
            fontSize: '5px',
            fontStyle: 'bold',
            color: '#b9f5ff',
            letterSpacing: 0.55,
            align: 'center',
          })
          .setOrigin(0.5),
        f = this.add.rectangle(0, -7, 74, 2, e.accent, 0.18),
        u = this.add.rectangle(0, 8, 68, 10, 463130, 0.86).setStrokeStyle(1, 5467003, 0.3),
        m = this.add
          .text(0, 8, i % 2 == 0 ? 'ARRIVAL // 02:14' : 'NEXT // 04:32', {
            fontFamily: 'Orbitron',
            fontSize: '4px',
            color: '#8198a6',
            letterSpacing: 0.35,
            align: 'center',
          })
          .setOrigin(0.5),
        g = this.add.rectangle(0, 15, 52, 4, 1714486, 0.9).setStrokeStyle(1, 6453643, 0.32),
        S = this.add.rectangle(-18, 19, 3, 6, 5071989, 0.45),
        w = this.add.rectangle(18, 19, 3, 6, 5071989, 0.45),
        b = this.add
          .circle(t.width / 2 - 18, -15, 7, e.accent, 0.055)
          .setStrokeStyle(1, e.accent, 0.54),
        C = this.add.circle(t.width / 2 - 18, -15, 2.4, e.accent, 0.86),
        R = [
          this.add.circle(-t.width / 2 + 16, -t.height / 2 + 8, 2, e.accent, 0.62),
          this.add.circle(t.width / 2 - 16, -t.height / 2 + 8, 2, e.accent, 0.62),
        ],
        k = this.add
          .text(0, 34, i % 2 == 0 ? 'TRANSIT HUB' : 'CITY SHUTTLE', {
            fontFamily: 'Orbitron',
            fontSize: '4.5px',
            fontStyle: 'bold',
            color: '#738b9b',
            stroke: '#06101a',
            strokeThickness: 2,
            letterSpacing: 0.55,
            align: 'center',
          })
          .setOrigin(0.5);
      (s.add([a, l, r, o, n, h, d, c, y, p, f, u, m, g, S, w, b, C, ...R, k]),
        x.push({
          group: s,
          roofLight: h,
          routeDisplay: y,
          routeText: p,
          routeLine: f,
          arrivalPanel: u,
          arrivalText: m,
          marker: b,
          markerCore: C,
          topNodes: R,
          floorStrip: l,
          index: i,
        }));
    }),
      this.motionReduced ||
        x.forEach((e) => {
          (this.tweens.add({
            targets: e.roofLight,
            alpha: { from: 0.08, to: 0.62 },
            scaleX: { from: 0.88, to: 1.04 },
            duration: 1200 + 100 * e.index,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 160 * e.index,
          }),
            this.tweens.add({
              targets: [e.routeDisplay, e.routeText],
              alpha: { from: 0.48, to: 1 },
              duration: 900 + 90 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 120 * e.index,
            }),
            this.tweens.add({
              targets: e.routeLine,
              scaleX: { from: 0.28, to: 1.08 },
              alpha: { from: 0.05, to: 0.34 },
              duration: 1500 + 110 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 240 + 130 * e.index,
            }),
            this.tweens.add({
              targets: [e.arrivalPanel, e.arrivalText],
              alpha: { from: 0.38, to: 0.88 },
              duration: 1350 + 100 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 190 * e.index,
            }),
            this.tweens.add({
              targets: e.markerCore,
              scale: { from: 0.65, to: 1.42 },
              alpha: { from: 0.12, to: 1 },
              duration: 620 + 75 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 150 * e.index,
            }),
            this.tweens.add({
              targets: e.marker,
              scale: { from: 0.72, to: 1.34 },
              alpha: { from: 0.02, to: 0.16 },
              duration: 1100 + 80 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 90 + 140 * e.index,
            }),
            e.topNodes.forEach((t, i) => {
              this.tweens.add({
                targets: t,
                alpha: { from: 0.08, to: 0.86 },
                scale: { from: 0.72, to: 1.3 },
                duration: 500 + 110 * i,
                yoyo: !0,
                repeat: -1,
                ease: 'Sine.inOut',
                delay: 120 * e.index + 220 * i,
              });
            }),
            this.tweens.add({
              targets: e.floorStrip,
              alpha: { from: 0.08, to: 0.34 },
              scaleX: { from: 0.92, to: 1.02 },
              duration: 1e3 + 95 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 170 * e.index,
            }));
        }));
    const b = [];
    ([
      { x: 250, y: 506, columns: 4, rows: 3 },
      { x: 820, y: 500, columns: 5, rows: 3 },
      { x: 1380, y: 508, columns: 4, rows: 3 },
      { x: 2080, y: 498, columns: 5, rows: 3 },
      { x: 2780, y: 506, columns: 4, rows: 3 },
      { x: 3510, y: 500, columns: 5, rows: 3 },
      { x: 4250, y: 508, columns: 4, rows: 3 },
    ].forEach((t, i) => {
      const s = 18 * t.columns + 14,
        a = 17 * t.rows + 20,
        l = this.add.container(t.x, t.y).setDepth(5.06).setScrollFactor(0.58),
        r = this.add
          .rectangle(0, a / 2 + 3, s + 8, 7, 528924, 0.98)
          .setStrokeStyle(1, 6255749, 0.48),
        o = this.add.rectangle(0, 0, s, a, 1055784, 0.98).setStrokeStyle(1.5, 6650505, 0.58),
        n = this.add.rectangle(0, 0, s - 8, a - 8, 463131, 0.56).setStrokeStyle(1, e.accent, 0.16),
        h = this.add
          .rectangle(0, -a / 2 + 8, s - 12, 10, 463646, 0.96)
          .setStrokeStyle(1, e.accent, 0.26),
        d = this.add
          .text(0, -a / 2 + 8, i % 2 == 0 ? 'LOCKER // ONLINE' : 'PARCEL // NODE', {
            fontFamily: 'Orbitron',
            fontSize: '4px',
            fontStyle: 'bold',
            color: '#91a9b6',
            letterSpacing: 0.45,
            align: 'center',
          })
          .setOrigin(0.5),
        c = [],
        y = -s / 2 + 10,
        p = -a / 2 + 17;
      for (let i = 0; i < t.rows; i++)
        for (let s = 0; s < t.columns; s++) {
          const t = y + 18 * s,
            a = p + 17 * i,
            l = this.add.rectangle(t, a, 15, 14, 1319986, 0.96).setStrokeStyle(1, 5466747, 0.34),
            r = this.add.circle(t + 4, a, 1.35, e.accent, 0.42),
            o = this.add.rectangle(t - 3, a, 4, 1, 14679295, 0.13);
          c.push({ door: l, doorNode: r, doorSlot: o });
        }
      const f = this.add
          .rectangle(0, a / 2 - 11, 42, 6, 463645, 0.92)
          .setStrokeStyle(1, e.accent, 0.32),
        u = this.add.circle(0, a / 2 - 11, 2.1, e.accent, 0.82),
        m = this.add.rectangle(-15, a / 2 - 11, 10, 1.5, 15400959, 0.34).setOrigin(0, 0.5),
        g = this.add.rectangle(-s / 2 + 4, 0, 2, a - 18, e.accent, 0.16),
        S = this.add.rectangle(s / 2 - 4, 0, 2, a - 18, e.accent, 0.16),
        w = this.add.circle(s / 2 - 8, -a / 2 + 8, 2, e.accent, 0.72),
        x = this.add.rectangle(0, a / 2 + 9, s - 16, 2, e.accent, 0.16),
        C = this.add
          .text(
            0,
            a / 2 + 18,
            i % 3 == 0 ? 'CITY DROP' : i % 3 == 1 ? 'AUTO PICKUP' : 'SECURE BOX',
            {
              fontFamily: 'Orbitron',
              fontSize: '4px',
              fontStyle: 'bold',
              color: '#728b9a',
              stroke: '#06101a',
              strokeThickness: 2,
              letterSpacing: 0.45,
              align: 'center',
            },
          )
          .setOrigin(0.5);
      (l.add([r, o, n, h, d, f, u, m, g, S, w, x, C]),
        c.forEach((e) => {
          l.add([e.door, e.doorNode, e.doorSlot]);
        }),
        b.push({
          group: l,
          doors: c,
          scannerCore: u,
          scannerLine: m,
          sideLightLeft: g,
          sideLightRight: S,
          topNode: w,
          statusBar: x,
          header: h,
          headerText: d,
          index: i,
        }));
    }),
      this.motionReduced ||
        b.forEach((e) => {
          (this.tweens.add({
            targets: [e.header, e.headerText],
            alpha: { from: 0.44, to: 1 },
            duration: 1050 + 90 * e.index,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 130 * e.index,
          }),
            this.tweens.add({
              targets: e.scannerCore,
              scale: { from: 0.65, to: 1.45 },
              alpha: { from: 0.08, to: 1 },
              duration: 620 + 80 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 160 * e.index,
            }),
            this.tweens.add({
              targets: e.scannerLine,
              x: 15,
              alpha: { from: 0.08, to: 0.72 },
              duration: 1150 + 90 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 190 * e.index,
            }),
            this.tweens.add({
              targets: [e.sideLightLeft, e.sideLightRight],
              alpha: { from: 0.045, to: 0.38 },
              duration: 1250 + 110 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 150 * e.index,
            }),
            this.tweens.add({
              targets: e.topNode,
              alpha: { from: 0.08, to: 0.94 },
              scale: { from: 0.7, to: 1.3 },
              duration: 720 + 70 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 120 * e.index,
            }),
            e.doors.forEach((t, i) => {
              (this.tweens.add({
                targets: t.doorNode,
                alpha: { from: 0.05, to: 0.72 },
                scale: { from: 0.72, to: 1.2 },
                duration: 360 + (i % 4) * 80,
                yoyo: !0,
                repeat: -1,
                ease: 'Sine.inOut',
                delay: 120 * e.index + 95 * i,
              }),
                this.tweens.add({
                  targets: t.doorSlot,
                  alpha: { from: 0.025, to: 0.2 },
                  duration: 620 + (i % 3) * 100,
                  yoyo: !0,
                  repeat: -1,
                  ease: 'Sine.inOut',
                  delay: 180 + 100 * e.index + 70 * i,
                }));
            }),
            this.tweens.add({
              targets: e.statusBar,
              scaleX: { from: 0.35, to: 1.04 },
              alpha: { from: 0.05, to: 0.34 },
              duration: 1450 + 100 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 180 * e.index,
            }));
        }));
    const C = [];
    ([
      { x: 470, y: 548, height: 72, side: 1 },
      { x: 1120, y: 538, height: 82, side: -1 },
      { x: 1810, y: 550, height: 74, side: 1 },
      { x: 2490, y: 540, height: 84, side: -1 },
      { x: 3210, y: 548, height: 76, side: 1 },
      { x: 3900, y: 540, height: 82, side: -1 },
      { x: 4610, y: 550, height: 74, side: 1 },
    ].forEach((t, i) => {
      const s = this.add.container(t.x, t.y).setDepth(5.12).setScrollFactor(0.62),
        a = this.add.ellipse(0, 5, 32, 9, 132877, 0.62).setStrokeStyle(1, 5861247, 0.4),
        l = this.add
          .rectangle(0, -t.height / 2, 22, t.height, 792611, 0.98)
          .setStrokeStyle(1.5, 6519178, 0.62),
        r = this.add
          .rectangle(0, -t.height / 2 + 28, 14, t.height - 38, 1320242, 0.94)
          .setStrokeStyle(1, 4019044, 0.32),
        o = this.add
          .rectangle(0, 8 - t.height, 28, 18, 1056556, 0.98)
          .setStrokeStyle(1.5, 16745070, 0.56),
        n = this.add
          .text(0, 8 - t.height, 'SOS', {
            fontFamily: 'Orbitron',
            fontSize: '6px',
            fontStyle: 'bold',
            color: '#ffb7aa',
            stroke: '#08101a',
            strokeThickness: 2,
            letterSpacing: 0.9,
            align: 'center',
          })
          .setOrigin(0.5),
        h = this.add.circle(0, 21 - t.height, 10, 16733028, 0.055),
        d = this.add.circle(0, 21 - t.height, 3.4, 16745070, 0.9).setStrokeStyle(1, 16765128, 0.58),
        c = this.add
          .rectangle(12 * t.side, -t.height / 2 + 28, 8, 30, 463388, 0.96)
          .setStrokeStyle(1, e.accent, 0.28),
        y = this.add
          .circle(12 * t.side, -t.height / 2 + 22, 3.8, 16733028, 0.68)
          .setStrokeStyle(1, 16762040, 0.54),
        p = [];
      for (let i = 0; i < 3; i++) {
        const s = this.add.circle(
          12 * t.side,
          -t.height / 2 + 31 + 8 * i,
          1.8,
          0 === i ? e.accent : 6650761,
          0 === i ? 0.76 : 0.36,
        );
        p.push(s);
      }
      const f = this.add.rectangle(0, -t.height / 2 + 44, 12, 2, e.accent, 0.26),
        u = this.add.rectangle(-4, -t.height / 2 + 44, 4, 1.5, 14679295, 0.42).setOrigin(0, 0.5),
        m = this.add.graphics();
      m.lineStyle(1, 6584969, 0.38);
      for (let e = 0; e < 4; e++)
        m.lineBetween(3 * e - 5, -t.height / 2 + 53, 3 * e - 5, -t.height / 2 + 57);
      const g = this.add.rectangle(9 * t.side, -t.height / 2 + 42, 1.5, 46, e.accent, 0.22),
        S = this.add.rectangle(0, 9, 18, 2, e.accent, 0.2),
        w = this.add
          .text(0, 16, `SOS // ${String(i + 1).padStart(2, '0')}`, {
            fontFamily: 'Orbitron',
            fontSize: '4px',
            fontStyle: 'bold',
            color: '#778e9d',
            stroke: '#06101a',
            strokeThickness: 2,
            letterSpacing: 0.4,
            align: 'center',
          })
          .setOrigin(0.5);
      (s.add([a, l, r, o, n, h, d, c, y, ...p, f, u, m, g, S, w]),
        C.push({
          group: s,
          lampGlow: h,
          lamp: d,
          emergencyButton: y,
          statusLeds: p,
          dataStrip: f,
          dataScan: u,
          sideChannel: g,
          groundStatus: S,
          sosIcon: n,
          index: i,
        }));
    }),
      this.motionReduced ||
        C.forEach((e) => {
          (this.tweens.add({
            targets: e.lamp,
            alpha: { from: 0.12, to: 1 },
            scale: { from: 0.72, to: 1.28 },
            duration: 620 + 75 * e.index,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 170 * e.index,
          }),
            this.tweens.add({
              targets: e.lampGlow,
              alpha: { from: 0.012, to: 0.11 },
              scale: { from: 0.8, to: 1.45 },
              duration: 900 + 90 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 100 + 150 * e.index,
            }),
            this.tweens.add({
              targets: e.sosIcon,
              alpha: { from: 0.48, to: 1 },
              duration: 1100 + 80 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 120 * e.index,
            }),
            this.tweens.add({
              targets: e.emergencyButton,
              scale: { from: 0.72, to: 1.22 },
              alpha: { from: 0.18, to: 0.78 },
              duration: 840 + 70 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 130 * e.index,
            }),
            e.statusLeds.forEach((t, i) => {
              this.tweens.add({
                targets: t,
                alpha: { from: 0.06, to: 0 === i ? 0.92 : 0.58 },
                scale: { from: 0.7, to: 1.26 },
                duration: 420 + 90 * i,
                yoyo: !0,
                repeat: -1,
                ease: 'Sine.inOut',
                delay: 110 * e.index + 220 * i,
              });
            }),
            this.tweens.add({
              targets: e.dataScan,
              x: 5,
              alpha: { from: 0.06, to: 0.78 },
              duration: 1e3 + 90 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 160 * e.index,
            }),
            this.tweens.add({
              targets: e.sideChannel,
              alpha: { from: 0.035, to: 0.44 },
              scaleY: { from: 0.78, to: 1.06 },
              duration: 1300 + 100 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 140 * e.index,
            }),
            this.tweens.add({
              targets: e.groundStatus,
              scaleX: { from: 0.5, to: 1.08 },
              alpha: { from: 0.05, to: 0.36 },
              duration: 1200 + 90 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 150 * e.index,
            }),
            this.tweens.add({
              targets: e.lampGlow,
              scaleX: { from: 0.78, to: 1.75 },
              scaleY: { from: 0.78, to: 1.4 },
              alpha: { from: 0.06, to: 0 },
              duration: 1500 + 120 * e.index,
              repeat: -1,
              ease: 'Sine.out',
              delay: 210 * e.index,
            }));
        }));
    const R = [
        { x: 610, y: 420, width: 34, height: 142, label: 'NOVA', phase: 0 },
        { x: 1200, y: 395, width: 38, height: 168, label: 'HELIX', phase: 1 },
        { x: 1850, y: 414, width: 32, height: 150, label: 'VOID', phase: 2 },
        { x: 2510, y: 388, width: 40, height: 176, label: 'SYNC', phase: 3 },
        { x: 3250, y: 405, width: 34, height: 158, label: 'GRID', phase: 4 },
        { x: 3990, y: 390, width: 40, height: 174, label: 'APEX', phase: 5 },
        { x: 4740, y: 412, width: 34, height: 152, label: 'CROWN', phase: 6 },
      ],
      k = [];
    (R.forEach((t, i) => {
      const s = this.add.container(t.x, t.y).setDepth(3.56).setScrollFactor(0.3),
        a = this.add.rectangle(3, 0, t.width + 8, t.height + 8, 132619, 0.38),
        l = this.add
          .rectangle(0, 0, t.width, t.height, 463131, 0.96)
          .setStrokeStyle(1.5, 6321799, 0.54),
        r = this.add
          .rectangle(0, 0, t.width - 7, t.height - 7, 529439, 0.9)
          .setStrokeStyle(1, e.accent, 0.24),
        o = this.add.rectangle(-t.width / 2 + 3, 0, 2, t.height - 14, e.accent, 0.32),
        n = this.add.rectangle(t.width / 2 - 3, 0, 2, t.height - 14, e.accent, 0.18),
        h = this.add
          .rectangle(0, -t.height / 2 + 8, t.width - 10, 7, 1056556, 0.96)
          .setStrokeStyle(1, e.accent, 0.42),
        d = this.add
          .text(0, -t.height / 2 + 8, t.label, {
            fontFamily: 'Orbitron',
            fontSize: '5px',
            fontStyle: 'bold',
            color: '#dffcff',
            stroke: '#06101a',
            strokeThickness: 2,
            letterSpacing: 0.8,
            align: 'center',
          })
          .setOrigin(0.5),
        c = [],
        y = Math.max(7, Math.floor(t.height / 20));
      for (let i = 0; i < y; i++) {
        const s = -t.height / 2 + 23 + 18 * i,
          a = this.add.rectangle(
            0,
            s,
            t.width - 14,
            3,
            i % 4 == 0 ? 14679295 : e.accent,
            i % 4 == 0 ? 0.11 : 0.17,
          );
        c.push(a);
      }
      const p = this.add
          .rectangle(0, 8, t.width - 12, 18, e.accent, 0.035)
          .setStrokeStyle(1, e.accent, 0.18),
        f = this.add.rectangle(0, 8, t.width - 18, 4, e.accent, 0.12),
        u = this.add.rectangle(0, -t.height / 2 + 26, t.width - 10, 9, e.accent, 0.035),
        m = this.add.rectangle(0, -t.height / 2 + 26, t.width - 12, 2, 15400959, 0.58),
        g = [];
      for (let i = 0; i < 5; i++) {
        const s = this.add.circle(
          -t.width / 2 + 7,
          -t.height / 2 + 34 + 22 * i,
          1.8,
          e.accent,
          0.46,
        );
        g.push(s);
      }
      const S = this.add
          .rectangle(0, t.height / 2 - 18, t.width - 12, 9, 397594, 0.92)
          .setStrokeStyle(1, 6124678, 0.32),
        w = this.add
          .rectangle(-t.width / 2 + 8, t.height / 2 - 18, 8, 2, e.accent, 0.42)
          .setOrigin(0, 0.5),
        x = this.add
          .text(0, t.height / 2 - 18, i % 2 == 0 ? 'MEDIA // LIVE' : 'CITY // FEED', {
            fontFamily: 'Orbitron',
            fontSize: '3.5px',
            color: '#718996',
            letterSpacing: 0.35,
            align: 'center',
          })
          .setOrigin(0.5),
        b = this.add.graphics();
      (b
        .lineStyle(2, 5269368, 0.55)
        .lineBetween(-t.width / 2, -t.height / 2 + 16, -t.width / 2 - 12, -t.height / 2 + 16)
        .lineBetween(-t.width / 2, t.height / 2 - 16, -t.width / 2 - 12, t.height / 2 - 16),
        s.add([a, l, r, o, n, h, d, ...c, p, f, u, m, ...g, S, w, x, b]),
        k.push({
          group: s,
          edgeLeft: o,
          edgeRight: n,
          cap: h,
          label: d,
          bands: c,
          dataCore: p,
          dataCoreInner: f,
          scanGlow: u,
          scanHead: m,
          sideNodes: g,
          lowerWindow: S,
          lowerSignal: w,
          index: i,
          phase: t.phase,
        }));
    }),
      this.motionReduced ||
        k.forEach((e) => {
          (this.tweens.add({
            targets: [e.edgeLeft, e.edgeRight],
            alpha: { from: 0.05, to: 0.42 },
            duration: 1100 + 95 * e.index,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 140 * e.phase,
          }),
            this.tweens.add({
              targets: [e.cap, e.label],
              alpha: { from: 0.42, to: 1 },
              duration: 900 + 75 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 120 * e.phase,
            }),
            this.tweens.add({
              targets: [e.scanHead, e.scanGlow],
              y: 60,
              alpha: { from: 0.05, to: 0.7 },
              duration: 1700 + 120 * e.index,
              repeat: -1,
              ease: 'Linear',
              delay: 190 * e.phase,
              onRepeat: () => {
                (e.scanHead?.active && (e.scanHead.y = -R[e.index].height / 2 + 26),
                  e.scanGlow?.active && (e.scanGlow.y = -R[e.index].height / 2 + 26));
              },
            }),
            e.bands.forEach((t, i) => {
              this.tweens.add({
                targets: t,
                alpha: { from: i % 4 == 0 ? 0.03 : 0.05, to: i % 4 == 0 ? 0.28 : 0.4 },
                scaleX: { from: 0.6, to: 1.04 },
                duration: 420 + (i % 5) * 100,
                yoyo: !0,
                repeat: -1,
                ease: 'Sine.inOut',
                delay: 100 * e.phase + 90 * i,
              });
            }),
            this.tweens.add({
              targets: [e.dataCore, e.dataCoreInner],
              alpha: { from: 0.02, to: 0.14 },
              scaleX: { from: 0.86, to: 1.06 },
              duration: 1350 + 90 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 180 + 130 * e.phase,
            }),
            e.sideNodes.forEach((t, i) => {
              this.tweens.add({
                targets: t,
                alpha: { from: 0.04, to: 0.86 },
                scale: { from: 0.7, to: 1.25 },
                duration: 380 + 95 * i,
                yoyo: !0,
                repeat: -1,
                ease: 'Sine.inOut',
                delay: 130 * e.phase + 180 * i,
              });
            }),
            this.tweens.add({
              targets: e.lowerSignal,
              x: R[e.index].width / 2 - 10,
              alpha: { from: 0.08, to: 0.74 },
              duration: 1200 + 95 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 150 * e.phase,
            }),
            this.tweens.add({
              targets: e.group,
              alpha: { from: 0.82, to: 1 },
              duration: 1900 + 130 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 170 * e.phase,
            }));
        }));
    const D = [];
    ([
      { x: 690, y: 522, height: 74, phase: 0 },
      { x: 1290, y: 514, height: 82, phase: 1 },
      { x: 2010, y: 520, height: 76, phase: 2 },
      { x: 2720, y: 512, height: 84, phase: 3 },
      { x: 3440, y: 520, height: 76, phase: 4 },
      { x: 4160, y: 514, height: 82, phase: 5 },
      { x: 4860, y: 520, height: 76, phase: 6 },
    ].forEach((t, i) => {
      const s = this.add.container(t.x, t.y).setDepth(5.08).setScrollFactor(0.6),
        a = this.add.ellipse(0, 5, 34, 9, 132877, 0.62).setStrokeStyle(1, 6124677, 0.42),
        l = this.add
          .rectangle(0, -t.height / 2, 15, t.height, 792354, 0.98)
          .setStrokeStyle(1.5, 6519177, 0.56),
        r = this.add.rectangle(0, -t.height / 2 + 28, 3, t.height - 42, e.accent, 0.22),
        o = this.add
          .rectangle(0, 8 - t.height, 30, 20, 1056555, 0.98)
          .setStrokeStyle(1.5, 6979727, 0.62),
        n = this.add
          .ellipse(0, 1 - t.height, 20, 8, 463645, 0.96)
          .setStrokeStyle(1, e.accent, 0.44),
        h = this.add.circle(0, 1 - t.height, 3, e.accent, 0.76),
        d = this.add.graphics();
      d.lineStyle(1, 7505300, 0.42);
      for (let e = 0; e < 4; e++) {
        const i = 10 - t.height + 5 * e;
        d.lineBetween(-9, i, 9, i);
      }
      const c = this.add
          .rectangle(0, -t.height / 2 + 7, 9, 18, 397594, 0.96)
          .setStrokeStyle(1, e.accent, 0.28),
        y = this.add.rectangle(0, -t.height / 2 + 7, 4, 10, e.accent, 0.16),
        p = this.add
          .circle(0, -t.height / 2 + 34, 8, e.accent, 0.035)
          .setStrokeStyle(1, e.accent, 0.25),
        f = this.add.circle(0, -t.height / 2 + 34, 2.4, e.accent, 0.7),
        u = [
          this.add.circle(-10, -t.height / 2 + 42, 1.8, e.accent, 0.42),
          this.add.circle(10, -t.height / 2 + 42, 1.8, e.accent, 0.42),
          this.add.circle(-10, -t.height / 2 + 51, 1.8, 14679295, 0.28),
          this.add.circle(10, -t.height / 2 + 51, 1.8, 14679295, 0.28),
        ],
        m = this.add
          .rectangle(0, -t.height / 2 + 60, 26, 4, 463131, 0.88)
          .setStrokeStyle(1, 5861248, 0.32),
        g = this.add.rectangle(-11, -t.height / 2 + 60, 15, 2, e.accent, 0.36).setOrigin(0, 0.5),
        S = this.add.rectangle(0, 2, 22, 2, e.accent, 0.2),
        w = this.add
          .text(
            0,
            17,
            i % 3 == 0 ? 'AQ // NOMINAL' : i % 3 == 1 ? 'ATM // SCANNING' : 'AIR // TELEMETRY',
            {
              fontFamily: 'Orbitron',
              fontSize: '4px',
              fontStyle: 'bold',
              color: '#748c9a',
              stroke: '#06101a',
              strokeThickness: 2,
              letterSpacing: 0.35,
              align: 'center',
            },
          )
          .setOrigin(0.5),
        x = this.add
          .text(0, 27, `AQN // ${String(i + 1).padStart(2, '0')}`, {
            fontFamily: 'Orbitron',
            fontSize: '3.5px',
            color: '#526a79',
            letterSpacing: 0.28,
            align: 'center',
          })
          .setOrigin(0.5);
      (s.add([a, l, r, o, n, h, d, c, y, p, f, ...u, m, g, S, w, x]),
        D.push({
          group: s,
          samplerCore: h,
          displayCore: y,
          intakeOuter: p,
          intakeCore: f,
          sideNodes: u,
          qualityFill: g,
          baseSignal: S,
          channel: r,
          index: i,
          phase: t.phase,
        }));
    }),
      this.motionReduced ||
        D.forEach((e) => {
          (this.tweens.add({
            targets: e.samplerCore,
            scale: { from: 0.72, to: 1.42 },
            alpha: { from: 0.08, to: 0.94 },
            duration: 720 + 80 * e.index,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 150 * e.phase,
          }),
            this.tweens.add({
              targets: e.displayCore,
              alpha: { from: 0.025, to: 0.3 },
              scaleY: { from: 0.62, to: 1.12 },
              duration: 900 + 100 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 120 * e.phase,
            }),
            this.tweens.add({
              targets: e.intakeOuter,
              scale: { from: 0.72, to: 1.45 },
              alpha: { from: 0.015, to: 0.11 },
              duration: 1300 + 110 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.out',
              delay: 180 + 140 * e.phase,
            }),
            this.tweens.add({
              targets: e.intakeCore,
              scale: { from: 0.68, to: 1.3 },
              alpha: { from: 0.08, to: 0.88 },
              duration: 650 + 75 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 130 * e.phase,
            }),
            e.sideNodes.forEach((t, i) => {
              this.tweens.add({
                targets: t,
                alpha: { from: 0.04, to: 0.82 },
                scale: { from: 0.68, to: 1.26 },
                duration: 420 + 90 * i,
                yoyo: !0,
                repeat: -1,
                ease: 'Sine.inOut',
                delay: 140 * e.phase + 190 * i,
              });
            }),
            this.tweens.add({
              targets: e.qualityFill,
              scaleX: { from: 0.42, to: 1.05 },
              alpha: { from: 0.06, to: 0.46 },
              duration: 1500 + 120 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 180 * e.phase,
            }),
            this.tweens.add({
              targets: e.baseSignal,
              scaleX: { from: 0.45, to: 1.1 },
              alpha: { from: 0.05, to: 0.4 },
              duration: 1150 + 100 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 150 * e.phase,
            }),
            this.tweens.add({
              targets: e.channel,
              alpha: { from: 0.025, to: 0.34 },
              scaleY: { from: 0.82, to: 1.04 },
              duration: 1700 + 130 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 160 * e.phase,
            }));
        }));
    [
      { x: 290, y: 392, scale: 1, label: 'PA-07' },
      { x: 1010, y: 348, scale: 0.82, label: 'PA-12' },
      { x: 1710, y: 408, scale: 0.92, label: 'PA-19' },
      { x: 2460, y: 362, scale: 1.08, label: 'PA-24' },
      { x: 3290, y: 420, scale: 0.88, label: 'PA-31' },
    ].forEach(({ x: t, y: i, scale: s, label: a }, l) => {
      const r = this.add.container(t, i).setScale(s).setDepth(7).setScrollFactor(0.44),
        o = this.add.graphics();
      o.lineStyle(2, 5400957, 0.72).lineBetween(-19, 4, 0, 4).lineBetween(-16, 4, -16, 18);
      const n = this.add.rectangle(8, 4, 34, 24, 528925, 0.96).setStrokeStyle(1.4, e.accent, 0.55),
        h = this.add.circle(19, 4, 8, 858921, 1).setStrokeStyle(1.2, 11065832, 0.42),
        d = this.add.circle(19, 4, 4, e.accent, 0.34),
        c = this.add.circle(19, 4, 1.8, 15400959, 0.82),
        y = this.add.circle(-4, 4, 6, e.accent, 0.035),
        p = this.add.circle(-4, 4, 2, e.accent, 0.82),
        f = this.add
          .arc(31, 4, 25, 25, 285, 75, !1, e.accent, 0.46)
          .setStrokeStyle(1.4, e.accent, 0.3),
        u = this.add
          .arc(33, 4, 36, 36, 285, 75, !1, e.accent, 0.28)
          .setStrokeStyle(1.1, e.accent, 0.22),
        m = this.add
          .text(8, 22, a, {
            fontFamily: 'Orbitron',
            fontSize: '5px',
            fontStyle: 'bold',
            color: '#9fc7d6',
            letterSpacing: 0.7,
            stroke: '#050b12',
            strokeThickness: 2,
            align: 'center',
          })
          .setOrigin(0.5);
      (r.add([o, y, p, n, h, d, c, f, u, m]),
        this.motionReduced ||
          (this.tweens.add({
            targets: [d, c, p],
            scale: { from: 0.88, to: 1.18 },
            alpha: { from: 0.42, to: 0.92 },
            duration: 520 + 70 * l,
            yoyo: !0,
            repeat: -1,
            delay: 260 * l,
            ease: 'Sine.inOut',
          }),
          this.tweens.add({
            targets: [f, u],
            scale: { from: 0.78, to: 1.18 },
            alpha: { from: 0.06, to: 0.34 },
            duration: 780 + 90 * l,
            yoyo: !0,
            repeat: -1,
            delay: 320 * l,
            ease: 'Sine.inOut',
          }),
          this.tweens.add({
            targets: y,
            scale: 1.55,
            alpha: { from: 0.025, to: 0.09 },
            duration: 1100 + 80 * l,
            yoyo: !0,
            repeat: -1,
            delay: 210 * l,
            ease: 'Sine.inOut',
          })));
    });
    const v = [];
    [
      { y: 566, width: 92, height: 24, speed: 15e3, variant: 0 },
      { y: 548, width: 118, height: 28, speed: 19e3, variant: 1 },
      { y: 578, width: 76, height: 22, speed: 12500, variant: 2 },
      { y: 556, width: 104, height: 26, speed: 17e3, variant: 3 },
      { y: 542, width: 84, height: 23, speed: 14500, variant: 4 },
    ].forEach((t, i) => {
      const s = i % 2 == 0 ? 1 : -1,
        a = s > 0 ? -260 - 180 * i : this.worldWidth + 260 + 180 * i,
        l = this.add.container(a, t.y).setDepth(4.15).setScrollFactor(0.46),
        r =
          0 === t.variant
            ? 1517625
            : 1 === t.variant
              ? 2108217
              : 2 === t.variant
                ? 1386042
                : 3 === t.variant
                  ? 2434616
                  : 1583669,
        o = this.add.rectangle(0, 0, t.width, t.height, r, 0.94).setStrokeStyle(1.4, 6650509, 0.46),
        n = this.add
          .rectangle(s > 0 ? -8 : 8, -12, 0.46 * t.width, 13, 660512, 0.96)
          .setStrokeStyle(1, 6321545, 0.38),
        h = this.add.rectangle(s > 0 ? 5 : -5, -12, 15, 7, e.accent, 0.11),
        d = this.add.rectangle(s > 0 ? -15 : 15, -12, 12, 7, 9348535, 0.07),
        c = this.add.rectangle(0, 10, t.width - 16, 4, 463133, 0.94),
        y = this.add.rectangle(0, 6, t.width - 18, 2, 3 === t.variant ? 16733028 : e.accent, 0.24),
        p = this.add.circle(s > 0 ? t.width / 2 - 8 : -t.width / 2 + 8, 3, 3, 15400959, 0.72),
        f = this.add.circle(s > 0 ? -t.width / 2 + 8 : t.width / 2 - 8, 3, 3, 16733028, 0.56),
        u = this.add.circle(0.29 * -t.width, 12, 5, 330257, 0.96),
        m = this.add.circle(0.29 * t.width, 12, 5, 330257, 0.96),
        g = this.add.circle(0.29 * -t.width, 12, 2, 7374490, 0.34),
        S = this.add.circle(0.29 * t.width, 12, 2, 7374490, 0.34);
      if ((l.add([o, n, h, d, c, y, p, f, u, m, g, S]), 1 === t.variant)) {
        const e = this.add.rectangle(0.17 * -t.width, -7, 0.42 * t.width, 19, 2504519, 0.96),
          i = this.add.rectangle(0.17 * -t.width, -7, 0.34 * t.width, 3, 16760155, 0.36);
        l.add([e, i]);
      } else if (2 === t.variant) {
        const e = this.add.rectangle(0, -18, 14, 3, 16765038, 0.42);
        l.add(e);
      } else if (3 === t.variant) {
        const e = this.add.rectangle(0, -18, 24, 3, 16733028, 0.44);
        (l.add(e),
          this.motionReduced ||
            this.tweens.add({
              targets: e,
              alpha: { from: 0.08, to: 0.82 },
              duration: 420,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
            }));
      } else if (4 === t.variant) {
        const e = this.add.rectangle(s > 0 ? -22 : 22, -2, 18, 16, 2767434, 0.68);
        l.add(e);
      }
      if ((v.push({ vehicle: l, direction: s, startX: a }), !this.motionReduced)) {
        const e = s > 0 ? this.worldWidth + 420 : -420;
        (this.tweens.add({
          targets: l,
          x: e,
          duration: t.speed + 900 * i,
          repeat: -1,
          ease: 'Linear',
          delay: 900 * i,
        }),
          this.tweens.add({
            targets: [p, f],
            alpha: { from: 0.2, to: 0.88 },
            duration: 900 + 100 * i,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 180 * i,
          }),
          this.tweens.add({
            targets: [u, m],
            angle: { from: 0, to: 360 },
            duration: 500 + 80 * i,
            repeat: -1,
            ease: 'Linear',
          }),
          this.tweens.add({
            targets: [h, y],
            alpha: { from: 0.05, to: 0.24 },
            duration: 1100 + 120 * i,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 160 * i,
          }));
      }
    });
    const T = this.add.graphics().setDepth(4.02).setScrollFactor(0.44);
    for (let t = 40; t < this.worldWidth; t += 170)
      (T.fillStyle(e.accent, 0.08).fillRect(t, 590, 72, 2),
        T.fillStyle(14679295, 0.035).fillRect(t + 18, 596, 38, 1));
    const E = this.add
      .rectangle(-100, 590, 100, 2, e.accent, 0.26)
      .setOrigin(0, 0.5)
      .setDepth(4.04)
      .setScrollFactor(0.44);
    this.motionReduced ||
      (this.tweens.add({
        targets: E,
        x: this.worldWidth + 180,
        duration: 8200,
        repeat: -1,
        ease: 'Linear',
      }),
      this.tweens.add({
        targets: T,
        alpha: { from: 0.72, to: 1 },
        duration: 1500,
        yoyo: !0,
        repeat: -1,
        ease: 'Sine.inOut',
      }));
    const O = [];
    [
      { startX: 180, y: 432, length: 310, speed: 5200, type: 0 },
      { startX: 760, y: 386, length: 360, speed: 6100, type: 1 },
      { startX: 1380, y: 448, length: 280, speed: 4700, type: 2 },
      { startX: 1960, y: 402, length: 420, speed: 6900, type: 0 },
      { startX: 2680, y: 455, length: 330, speed: 5600, type: 1 },
      { startX: 3260, y: 392, length: 390, speed: 6400, type: 2 },
    ].forEach((t, i) => {
      const s = this.add
          .rectangle(t.startX, t.y, t.length, 2, 6323087, 0.2)
          .setOrigin(0, 0.5)
          .setDepth(3.35)
          .setScrollFactor(0.22),
        a = this.add
          .rectangle(t.startX, t.y, t.length, 5, e.accent, 0.035)
          .setOrigin(0, 0.5)
          .setDepth(3.3)
          .setScrollFactor(0.22),
        l = this.add.container(t.startX, t.y).setDepth(3.6).setScrollFactor(0.22),
        r = this.add
          .rectangle(0, 0, 34, 18, 1 === t.type ? 2504518 : 1517367, 0.96)
          .setOrigin(0.5)
          .setStrokeStyle(1.5, e.accent, 0.62),
        o = this.add.circle(0, 0, 4, e.accent, 0.82),
        n = this.add.rectangle(0, -12, 10, 3, e.accent, 0.38),
        h = this.add.rectangle(-22, 3, 10, 3, 6650510, 0.65),
        d = this.add.rectangle(22, 3, 10, 3, 6650510, 0.65),
        c = this.add.rectangle(0, 10, 22, 2, 7919850, 0.28),
        y = this.add.circle(-10, -1, 2, 16765038, 0.42);
      if ((l.add([r, o, n, h, d, c, y]), 1 === t.type)) {
        const t = this.add.rectangle(0, 16, 3, 22, e.accent, 0.05).setOrigin(0.5, 0);
        (l.add(t),
          this.motionReduced ||
            this.tweens.add({
              targets: t,
              alpha: { from: 0.02, to: 0.32 },
              scaleY: { from: 0.35, to: 1 },
              duration: 700,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
            }));
      } else if (2 === t.type) {
        const t = this.add.circle(0, 0, 16, e.accent, 0).setStrokeStyle(1, e.accent, 0.34);
        (l.add(t),
          this.motionReduced ||
            this.tweens.add({
              targets: t,
              scale: 1.45,
              alpha: { from: 0.32, to: 0.02 },
              duration: 1100,
              repeat: -1,
              ease: 'Sine.out',
            }));
      }
      (O.push({ bot: l, routeLine: s, routeGlow: a, route: t }),
        this.motionReduced ||
          (this.tweens.add({
            targets: l,
            x: t.startX + t.length,
            duration: t.speed,
            ease: 'Sine.inOut',
            repeat: -1,
            yoyo: !0,
            delay: 380 * i,
          }),
          this.tweens.add({
            targets: o,
            alpha: { from: 0.2, to: 0.95 },
            scale: { from: 0.72, to: 1.22 },
            duration: 900 + 90 * i,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 170 * i,
          }),
          this.tweens.add({
            targets: n,
            alpha: { from: 0.1, to: 0.72 },
            duration: 620 + 70 * i,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 120 * i,
          }),
          this.tweens.add({
            targets: c,
            scaleX: { from: 0.65, to: 1.25 },
            alpha: { from: 0.06, to: 0.34 },
            duration: 1050,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 200 * i,
          })));
    });
    [
      { x: 330, y: 445 },
      { x: 930, y: 398 },
      { x: 1510, y: 460 },
      { x: 2080, y: 414 },
      { x: 2830, y: 470 },
      { x: 3410, y: 404 },
    ].forEach((t, i) => {
      (this.add.rectangle(t.x, t.y, 38, 10, 1122092, 0.92).setDepth(3.44).setScrollFactor(0.22),
        this.add
          .rectangle(t.x, t.y - 10, 28, 14, 1912896, 0.86)
          .setDepth(3.45)
          .setStrokeStyle(1, 7374490, 0.42)
          .setScrollFactor(0.22));
      const s = this.add
          .circle(t.x, t.y - 10, 4, i % 2 == 0 ? e.accent : 16765038, 0.58)
          .setDepth(3.48)
          .setScrollFactor(0.22),
        a = this.add
          .rectangle(t.x - 12, t.y - 1, 24, 2, e.accent, 0.16)
          .setDepth(3.47)
          .setScrollFactor(0.22);
      this.motionReduced ||
        (this.tweens.add({
          targets: s,
          alpha: { from: 0.12, to: 0.78 },
          duration: 750 + 100 * i,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
          delay: 210 * i,
        }),
        this.tweens.add({
          targets: a,
          scaleX: { from: 0.4, to: 1 },
          alpha: { from: 0.06, to: 0.28 },
          duration: 1300,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
          delay: 160 * i,
        }));
    });
    const A = this.add
      .rectangle(-80, 448, 70, 2, e.accent, 0.22)
      .setOrigin(0, 0.5)
      .setDepth(3.52)
      .setScrollFactor(0.22);
    this.motionReduced ||
      this.tweens.add({
        targets: A,
        x: this.worldWidth + 160,
        duration: 9800,
        repeat: -1,
        ease: 'Linear',
      });
    [
      { x: 410, y: 452, w: 72, h: 42 },
      { x: 1040, y: 428, w: 84, h: 48 },
      { x: 1760, y: 456, w: 68, h: 40 },
      { x: 2460, y: 438, w: 92, h: 50 },
      { x: 3220, y: 452, w: 76, h: 44 },
    ].forEach((t, i) => {
      const s = this.add.container(t.x, t.y).setDepth(4.18).setScrollFactor(0.24),
        a = this.add
          .rectangle(0, 0, t.w, t.h, 1517365, 0.94)
          .setOrigin(0.5)
          .setStrokeStyle(1.5, 6124680, 0.52),
        l = this.add.ellipse(0, -t.h / 2, t.w, 14, 2768976, 0.96).setStrokeStyle(1, e.accent, 0.38),
        r = this.add.ellipse(0, t.h / 2, t.w, 12, 858147, 0.92),
        o = this.add.rectangle(0, 0, t.w - 14, 5, e.accent, 0.12),
        n = this.add.ellipse(0, 0, t.w - 14, 18, e.accent, 0).setStrokeStyle(1, e.accent, 0.24),
        h = this.add.circle(0.28 * t.w, 0.14 * -t.h, 4, 16765038, 0.52),
        d = this.add.rectangle(0.3 * -t.w, t.h / 2 + 12, 7, 28, 5401212, 0.82),
        c = this.add.rectangle(0.3 * -t.w, t.h / 2 + 4, 12, 2, e.accent, 0.2);
      s.add([a, r, l, o, n, h, d, c]);
      const y = this.add.rectangle(0.27 * -t.w, t.h / 2 + 18, 5, 22, 5203063, 0.72),
        p = this.add.rectangle(0.27 * t.w, t.h / 2 + 18, 5, 22, 5203063, 0.72);
      s.add([y, p]);
      const f = this.add.rectangle(0, 7, t.w - 18, 7, 6016490, 0.055);
      (s.add(f),
        this.motionReduced ||
          (this.tweens.add({
            targets: o,
            alpha: { from: 0.06, to: 0.28 },
            duration: 1500 + 130 * i,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 180 * i,
          }),
          this.tweens.add({
            targets: n,
            scaleX: { from: 0.92, to: 1.08 },
            alpha: { from: 0.06, to: 0.2 },
            duration: 2100 + 120 * i,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 270 * i,
          }),
          this.tweens.add({
            targets: f,
            scaleX: { from: 0.84, to: 1.04 },
            alpha: { from: 0.025, to: 0.11 },
            duration: 1900 + 150 * i,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 230 * i,
          }),
          this.tweens.add({
            targets: h,
            alpha: { from: 0.1, to: 0.78 },
            duration: 700 + 100 * i,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 140 * i,
          })));
    });
    [
      { x: 640, y: 498, count: 4 },
      { x: 1260, y: 476, count: 5 },
      { x: 1900, y: 500, count: 4 },
      { x: 2740, y: 482, count: 5 },
      { x: 3510, y: 500, count: 4 },
    ].forEach((t, i) => {
      for (let s = 0; s < t.count; s++) {
        const a = t.x + 22 * (s - (t.count - 1) / 2),
          l =
            (this.add.rectangle(a, t.y, 14, 30, 1714744, 0.92).setDepth(4.1).setScrollFactor(0.24),
            this.add
              .ellipse(a, t.y - 15, 14, 6, 3361115, 0.96)
              .setDepth(4.12)
              .setScrollFactor(0.24),
            this.add
              .ellipse(a, t.y - 15, 7, 3, e.accent, 0.2)
              .setDepth(4.13)
              .setScrollFactor(0.24)),
          r = this.add
            .ellipse(a, t.y - 25, 18, 8, 13168372, 0.018)
            .setDepth(4.08)
            .setScrollFactor(0.24);
        this.motionReduced ||
          (this.tweens.add({
            targets: l,
            alpha: { from: 0.04, to: 0.48 },
            duration: 680 + 100 * i + 70 * s,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 120 * s,
          }),
          this.tweens.add({
            targets: r,
            y: t.y - 37,
            scaleX: { from: 0.7, to: 1.6 },
            scaleY: { from: 0.65, to: 1.35 },
            alpha: { from: 0.01, to: 0.07 },
            duration: 1800 + 130 * s,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.out',
            delay: 260 * i + 170 * s,
          }));
      }
    });
    const M = [];
    ([
      { x: 286, top: 316, bottom: 548, height: 232 },
      { x: 735, top: 284, bottom: 532, height: 248 },
      { x: 1320, top: 328, bottom: 552, height: 224 },
      { x: 2015, top: 276, bottom: 528, height: 252 },
      { x: 2710, top: 310, bottom: 556, height: 246 },
      { x: 3395, top: 292, bottom: 536, height: 244 },
      { x: 4235, top: 320, bottom: 554, height: 234 },
      { x: 4860, top: 286, bottom: 528, height: 242 },
    ].forEach((t, i) => {
      const s = this.add.container(t.x, t.top).setDepth(3.72).setScrollFactor(0.24),
        a = this.add
          .rectangle(0, t.height / 2, 6, t.height, 3427166, 0.9)
          .setStrokeStyle(1, 7440279, 0.5),
        l = this.add.rectangle(0, t.height / 2, 2, t.height - 12, e.accent, 0.15),
        r = this.add.rectangle(0, -3, 20, 6, 1780280, 0.94).setStrokeStyle(1, 6453642, 0.52),
        o = this.add.ellipse(0, 4, 18, 7, 1649466, 0.96).setStrokeStyle(1, e.accent, 0.3),
        n = this.add.graphics();
      for (let i = 24; i < t.height - 10; i += 48)
        (n.fillStyle(5993091, 0.72).fillRect(-5, i, 10, 4),
          n.fillStyle(e.accent, 0.16).fillRect(-7, i + 1, 14, 1));
      const h = this.add.circle(0, 0.38 * t.height, 3, e.accent, 0.62),
        d = this.add
          .rectangle(0, t.height - 6, 22, 16, 1121834, 0.96)
          .setStrokeStyle(1, 6190214, 0.6),
        c = this.add.rectangle(0, t.height - 7, 12, 2, e.accent, 0.28),
        y = this.add.rectangle(10, t.height + 1, 12, 4, 5269369, 0.78),
        p = this.add.circle(-8, t.height - 6, 2.2, i % 3 == 0 ? 16765038 : e.accent, 0.62),
        f = this.add
          .text(13, 28, `DRAIN // ${String(i + 1).padStart(2, '0')}`, {
            fontFamily: 'Orbitron',
            fontSize: '5px',
            fontStyle: 'bold',
            color: '#91aab8',
            stroke: '#07111d',
            strokeThickness: 2,
            letterSpacing: 0.8,
          })
          .setOrigin(0),
        u = [];
      for (let e = 0; e < 4; e++) {
        const t = this.add.rectangle(0, 28 + 36 * e, 1.5, 7, 14679295, 0);
        u.push(t);
      }
      const m = this.add
        .ellipse(0, t.height + 11, 28, 6, e.accent, 0.035)
        .setStrokeStyle(1, e.accent, 0.18);
      (s.add([a, l, r, o, n, h, d, c, y, p, f, ...u, m]),
        M.push({
          group: s,
          waterChannel: l,
          flowNode: h,
          lowerGlow: c,
          status: p,
          droplets: u,
          reflection: m,
          height: t.height,
          index: i,
        }));
    }),
      this.motionReduced ||
        M.forEach((e) => {
          (this.tweens.add({
            targets: e.waterChannel,
            scaleY: { from: 0.2, to: 1.02 },
            alpha: { from: 0.05, to: 0.3 },
            duration: 1500 + 110 * e.index,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 160 * e.index,
          }),
            this.tweens.add({
              targets: e.flowNode,
              y: { from: 0.26 * e.height, to: 0.76 * e.height },
              alpha: { from: 0.1, to: 0.9 },
              duration: 1200 + 90 * e.index,
              repeat: -1,
              ease: 'Quad.in',
              delay: 180 * e.index,
            }),
            this.tweens.add({
              targets: e.lowerGlow,
              scaleX: { from: 0.3, to: 1.12 },
              alpha: { from: 0.04, to: 0.42 },
              duration: 700 + 80 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 300 + 130 * e.index,
            }),
            this.tweens.add({
              targets: e.status,
              alpha: { from: 0.1, to: 0.92 },
              scale: { from: 0.7, to: 1.22 },
              duration: 560 + 70 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 120 * e.index,
            }),
            e.droplets.forEach((t, i) => {
              const s = 28 + 36 * i;
              this.tweens.add({
                targets: t,
                y: e.height - 6,
                alpha: { from: 0, to: 0.58 },
                duration: 900 + 120 * i + 80 * e.index,
                delay: 180 * e.index + 230 * i,
                repeat: -1,
                ease: 'Linear',
                onRepeat: () => {
                  t?.active && ((t.y = s), (t.alpha = 0));
                },
              });
            }),
            this.tweens.add({
              targets: e.reflection,
              scaleX: { from: 0.65, to: 1.35 },
              scaleY: { from: 0.72, to: 1.05 },
              alpha: { from: 0.02, to: 0.1 },
              duration: 1200 + 100 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 170 * e.index,
            }));
        }));
    [520, 1120, 1680, 2240, 2980, 3720].forEach((t, i) => {
      (this.add.rectangle(t, 500, 5, 62, 5138040, 0.82).setDepth(4.02).setScrollFactor(0.24),
        this.add.rectangle(t, 469, 16, 5, 6913678, 0.82).setDepth(4.03).setScrollFactor(0.24));
      const s = this.add
        .circle(t, 464, 4, i % 2 == 0 ? e.accent : 16765038, 0.2)
        .setDepth(4.05)
        .setScrollFactor(0.24);
      this.motionReduced ||
        this.tweens.add({
          targets: s,
          alpha: { from: 0.04, to: 0.72 },
          scale: { from: 0.65, to: 1.45 },
          duration: 1200 + 150 * i,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
          delay: 240 * i,
        });
    });
    const P = this.add
      .rectangle(-120, 534, 24, 2, e.accent, 0.28)
      .setOrigin(0, 0.5)
      .setDepth(4.06)
      .setScrollFactor(0.24);
    this.motionReduced ||
      this.tweens.add({
        targets: P,
        x: this.worldWidth + 180,
        duration: 10500,
        repeat: -1,
        ease: 'Linear',
      });
    const I = Number.isFinite(this.graphicsLevel) ? this.graphicsLevel : 2;
    if (I >= 1) {
      [
        { y: 420, height: 110, alpha: 0.01, scroll: 0.1 },
        { y: 500, height: 82, alpha: 0.008, scroll: 0.22 },
        { y: 558, height: 54, alpha: 0.006, scroll: 0.38 },
      ].forEach((t, i) => {
        const s = this.add
          .rectangle(0.5 * this.worldWidth, t.y, this.worldWidth + 500, t.height, e.accent, t.alpha)
          .setOrigin(0.5)
          .setScrollFactor(t.scroll)
          .setDepth(0.68 + 0.035 * i);
        !this.motionReduced &&
          I >= 2 &&
          this.tweens.add({
            targets: s,
            alpha: { from: 0.55 * t.alpha, to: 1.55 * t.alpha },
            duration: 4200 + 700 * i,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 480 * i,
          });
      });
      const t = this.add
          .rectangle(0.5 * this.worldWidth, 488, this.worldWidth + 400, 2, e.accent, 0.018)
          .setOrigin(0.5)
          .setScrollFactor(0.16)
          .setDepth(2.12),
        i = this.add
          .rectangle(0.5 * this.worldWidth, 506, this.worldWidth + 400, 1, 14679295, 0.012)
          .setOrigin(0.5)
          .setScrollFactor(0.22)
          .setDepth(2.13);
      if (
        (!this.motionReduced &&
          I >= 2 &&
          (this.tweens.add({
            targets: t,
            alpha: { from: 0.008, to: 0.06 },
            scaleX: { from: 0.92, to: 1.04 },
            duration: 4800,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
          }),
          this.tweens.add({
            targets: i,
            alpha: { from: 0.006, to: 0.028 },
            duration: 6200,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 900,
          })),
        !this.motionReduced && I >= 2)
      ) {
        const t = this.add
          .rectangle(-260, 470, 190, 2, e.accent, 0.025)
          .setOrigin(0, 0.5)
          .setScrollFactor(0.14)
          .setDepth(2.18);
        this.tweens.add({
          targets: t,
          x: this.worldWidth + 260,
          duration: 15e3,
          repeat: -1,
          ease: 'Linear',
          delay: 2500,
        });
      }
      const s = this.add
        .rectangle(0.5 * this.worldWidth, 604, this.worldWidth + 300, 1, 14679295, 0.028)
        .setOrigin(0.5)
        .setScrollFactor(0.48)
        .setDepth(5.02);
      !this.motionReduced &&
        I >= 2 &&
        this.tweens.add({
          targets: s,
          alpha: { from: 0.012, to: 0.055 },
          duration: 2600,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
        });
    }
    const N = (e) => {
        if (!this.motionReduced && e) {
          if ('CLEAN' === e)
            return (
              m.forEach((e, t) => {
                const i = 45 * t;
                (this.tweens.killTweensOf([e.fixture, e.glow, e.node]),
                  this.tweens.add({
                    targets: e.fixture,
                    alpha: { from: 0.18, to: 0.92 },
                    duration: 120,
                    delay: i,
                    yoyo: !0,
                    ease: 'Quad.out',
                  }),
                  this.tweens.add({
                    targets: e.glow,
                    alpha: { from: 0.01, to: 0.075 },
                    scaleX: { from: 0.8, to: 1.22 },
                    duration: 180,
                    delay: i,
                    yoyo: !0,
                    ease: 'Quad.out',
                  }),
                  this.tweens.add({
                    targets: e.node,
                    alpha: { from: 0.22, to: 0.82 },
                    scale: { from: 0.8, to: 1.35 },
                    duration: 150,
                    delay: i,
                    yoyo: !0,
                    ease: 'Quad.out',
                  }));
              }),
              O.forEach((e, t) => {
                e?.bot &&
                  this.tweens.add({
                    targets: e.bot,
                    scaleX: { from: 1, to: 1.08 },
                    scaleY: { from: 1, to: 1.08 },
                    duration: 180,
                    delay: 70 * t,
                    yoyo: !0,
                    ease: 'Sine.out',
                  });
              }),
              void this.tweens.add({
                targets: A,
                alpha: { from: 0.22, to: 0.62 },
                scaleX: { from: 0.85, to: 1.15 },
                duration: 260,
                yoyo: !0,
                ease: 'Sine.out',
              })
            );
          if ('DAMAGED' === e) {
            return (
              Phaser.Utils.Array.Shuffle(y.slice())
                .slice(0, 4)
                .forEach((e, t) => {
                  (this.tweens.killTweensOf(e),
                    this.tweens.add({
                      targets: e,
                      alpha: { from: 0.008, to: 0.065 },
                      duration: 80 + 35 * t,
                      yoyo: !0,
                      ease: 'Stepped',
                      delay: 65 * t,
                    }));
                }),
              v.forEach((e, t) => {
                const i = e?.vehicle;
                if (!i || !i.list) return;
                const s = i.list.filter((e) => 'Arc' === e?.type);
                s.length &&
                  this.tweens.add({
                    targets: s,
                    alpha: { from: 0.45, to: 1 },
                    duration: 90,
                    delay: 55 * t,
                    yoyo: !0,
                    ease: 'Stepped',
                  });
              }),
              void O.forEach((e, t) => {
                e?.routeGlow &&
                  (this.tweens.killTweensOf(e.routeGlow),
                  this.tweens.add({
                    targets: e.routeGlow,
                    alpha: { from: 0.035, to: 0.16 },
                    duration: 100,
                    delay: 70 * t,
                    yoyo: !0,
                    ease: 'Stepped',
                  }));
              })
            );
          }
          'NETWORKED' === e &&
            (y.forEach((e, t) => {
              this.tweens.add({
                targets: e,
                alpha: { from: 0.008, to: 0.045 },
                duration: 130,
                delay: 75 * t,
                yoyo: !0,
                ease: 'Sine.inOut',
              });
            }),
            m.forEach((e, t) => {
              (this.tweens.add({
                targets: e.fixture,
                alpha: { from: 0.18, to: 0.75 },
                duration: 150,
                delay: 65 * t,
                yoyo: !0,
                ease: 'Sine.inOut',
              }),
                this.tweens.add({
                  targets: e.node,
                  alpha: { from: 0.22, to: 0.9 },
                  scale: { from: 0.75, to: 1.45 },
                  duration: 180,
                  delay: 65 * t,
                  yoyo: !0,
                  ease: 'Sine.inOut',
                }));
            }),
            this.tweens.add({
              targets: A,
              alpha: { from: 0.22, to: 0.65 },
              scaleX: { from: 0.75, to: 1.25 },
              duration: 320,
              yoyo: !0,
              ease: 'Sine.inOut',
            }),
            this.tweens.add({
              targets: P,
              alpha: { from: 0.28, to: 0.72 },
              scaleX: { from: 0.85, to: 1.3 },
              duration: 360,
              yoyo: !0,
              ease: 'Sine.inOut',
            }));
        }
      },
      B = (e) => {
        if (this.motionReduced || !e) return;
        const t = this.cityResponseLandmark,
          i = this.cityResponseLandmarkRingA,
          s = this.cityResponseLandmarkRingB,
          a = this.cityResponseLandmarkSignalCore;
        return t && i && s && a
          ? 'CLEAN' === e
            ? (this.tweens.killTweensOf([t, i, s, a]),
              this.tweens.add({
                targets: t,
                alpha: { from: 0.72, to: 1 },
                duration: 180,
                yoyo: !0,
                ease: 'Quad.out',
              }),
              this.tweens.add({
                targets: i,
                scaleX: { from: 0.72, to: 1.55 },
                scaleY: { from: 0.72, to: 1.28 },
                alpha: { from: 0.55, to: 0 },
                duration: 650,
                ease: 'Quad.out',
              }),
              void this.tweens.add({
                targets: a,
                scale: { from: 1, to: 2 },
                alpha: { from: 0.75, to: 0 },
                duration: 420,
                ease: 'Quad.out',
              }))
            : 'DAMAGED' === e
              ? (this.tweens.killTweensOf([t, i, s, a]),
                this.tweens.add({
                  targets: t,
                  alpha: { from: 1, to: 0.38 },
                  duration: 90,
                  yoyo: !0,
                  repeat: 2,
                  ease: 'Stepped',
                }),
                this.tweens.add({
                  targets: s,
                  scaleX: { from: 0.6, to: 1.45 },
                  scaleY: { from: 0.6, to: 1.2 },
                  alpha: { from: 0.72, to: 0 },
                  duration: 520,
                  ease: 'Quad.out',
                }),
                void this.tweens.add({
                  targets: a,
                  scale: { from: 1, to: 1.65 },
                  alpha: { from: 0.85, to: 0.05 },
                  duration: 180,
                  yoyo: !0,
                  repeat: 2,
                  ease: 'Stepped',
                }))
              : void (
                  'NETWORKED' === e &&
                  (this.tweens.killTweensOf([t, i, s, a]),
                  this.tweens.add({
                    targets: [i, s],
                    scaleX: { from: 0.55, to: 1.65 },
                    scaleY: { from: 0.55, to: 1.35 },
                    alpha: { from: 0.72, to: 0 },
                    duration: 720,
                    ease: 'Cubic.out',
                  }),
                  this.tweens.add({
                    targets: a,
                    scale: { from: 0.8, to: 2.4 },
                    alpha: { from: 0.95, to: 0 },
                    duration: 560,
                    ease: 'Cubic.out',
                  }),
                  this.tweens.add({
                    targets: t,
                    alpha: { from: 0.72, to: 1 },
                    duration: 150,
                    yoyo: !0,
                    repeat: 2,
                    ease: 'Sine.inOut',
                  }))
                )
          : void 0;
      },
      F = (e) => {
        if (this.motionReduced || !e || !this.cityResponseStreetSigns?.length) return;
        const t = 'DAMAGED' === e ? 16738894 : 'NETWORKED' === e ? 13153791 : 9303295;
        this.cityResponseStreetSigns.forEach((i, s) => {
          const a = i?.glow,
            l = i?.back,
            r = i?.label;
          a &&
            l &&
            r &&
            (this.tweens.killTweensOf([a, r]),
            l.setStrokeStyle(1.5, t, 0.92),
            'CLEAN' !== e
              ? 'DAMAGED' !== e
                ? 'NETWORKED' === e &&
                  this.tweens.add({
                    targets: [a, r],
                    alpha: { from: 0.3, to: 1 },
                    scaleX: { from: 1, to: 1.08 },
                    scaleY: { from: 1, to: 1.08 },
                    duration: 180,
                    delay: 80 * s,
                    yoyo: !0,
                    ease: 'Sine.inOut',
                  })
                : this.tweens.add({
                    targets: [a, r],
                    alpha: { from: 0.18, to: 1 },
                    duration: 90,
                    delay: 45 * s,
                    yoyo: !0,
                    repeat: 2,
                    ease: 'Stepped',
                  })
              : this.tweens.add({
                  targets: [a, r],
                  alpha: { from: 0.35, to: 1 },
                  duration: 160,
                  delay: 55 * s,
                  yoyo: !0,
                  ease: 'Quad.out',
                }));
        });
      };
    ((this.cityResponseEnvironmentHandler = (e) => {
      const t = e?.type;
      t && (N(t), F(t), B(t));
    }),
      this.game.events.on('city-response-event', this.cityResponseEnvironmentHandler),
      this.events.once('shutdown', () => {
        this.cityResponseEnvironmentHandler &&
          (this.game.events.off('city-response-event', this.cityResponseEnvironmentHandler),
          (this.cityResponseEnvironmentHandler = null));
      }),
      this.events.once('shutdown', () => {
        this.cityResponseLandmarkHandler &&
          (this.game.events.off('city-response-event', this.cityResponseLandmarkHandler),
          (this.cityResponseLandmarkHandler = null));
      }));
  }
  createPlatforms() {
    const e = DISTRICT_VISUALS[this.mission.id] || DISTRICT_VISUALS['first-delivery'],
      t = Boolean(this.mission.blackout),
      i = Array.isArray(this.mission.platforms) ? this.mission.platforms : [],
      s = [];
    (i.forEach((e) => {
      if (!Array.isArray(e) || e.length < 4) return;
      const t = Number(e[0]) || 0,
        i = Number(e[1]) || 0,
        a = Math.max(20, Number(e[2]) || 20),
        l = Math.max(8, Number(e[3]) || 8),
        r = t + a;
      s.some((e) => {
        const s = e.x,
          a = e.y,
          o = s + e.width,
          n = t < o && r > s,
          h = Math.abs(i - a) <= Math.max(12, 0.5 * Math.min(l, e.height));
        return n && h;
      }) || s.push({ data: e, x: t, y: i, width: a, height: l });
    }),
      (this.platforms = this.physics.add.staticGroup()),
      s.forEach((i, s) => {
        const a = i.data,
          l = i.x,
          r = i.y,
          o = i.width,
          n = i.height,
          h = Boolean(a[4]),
          d = Boolean(a[5]),
          c = t ? 660512 : 1057592,
          y = e.accent ?? 9303295,
          p = this.add
            .rectangle(l + o / 2, r + n / 2, o, n, c, 0.98)
            .setStrokeStyle(h ? 2 : 1.5, y, h ? 0.72 : 0.42)
            .setDepth(7);
        (this.physics.add.existing(p, !0),
          this.platforms.add(p),
          p.setData('index', s),
          p.setData('x', l),
          p.setData('y', r),
          p.setData('width', o),
          p.setData('height', n),
          p.setData('isRoof', h),
          p.setData('collapsible', d),
          p.setData('collapseState', 'ready'),
          p.setData('collapseToken', 0),
          p.setData('sourceData', a.slice()),
          p.setData('visual', p),
          p.setData('originalFillColor', c),
          p.setData('originalStrokeColor', y),
          p.setData('originalStrokeWidth', h ? 2 : 1.5));
        const f = this.add.graphics().setDepth(7);
        (p.setData('detail', f),
          f
            .fillStyle(726050, t ? 0.72 : 0.82)
            .fillRect(l + 6, r + 8, Math.max(0, o - 12), Math.max(4, n - 14)),
          f.fillStyle(1120809, t ? 0.7 : 0.9));
        for (let e = l + 18; e < l + o - 10; e += 34)
          f.fillRect(e, r + 18, Math.min(16, l + o - e - 8), 5);
        if (
          (f
            .fillStyle(h ? 9762303 : 10401480, t ? (h ? 0.38 : 0.12) : h ? 0.62 : 0.22)
            .fillRect(l, r + 3, o, h ? 4 : 3),
          f
            .fillStyle(h ? 9303295 : 5467524, t ? 0.18 : 0.12)
            .fillRect(l + 10, r + n - 5, Math.max(0, o - 20), 2),
          h &&
            (f
              .lineStyle(2, 11189452, 0.8)
              .lineBetween(l + 14, r, l + 14, r - 18)
              .lineBetween(l + 14, r - 18, l + o - 14, r - 18)
              .lineBetween(l + o - 14, r - 18, l + o - 14, r),
            f
              .fillStyle(9303295, t ? 0.35 : 0.55)
              .fillCircle(l + 14, r - 18, 2)
              .fillCircle(l + o - 14, r - 18, 2)),
          p.setData('warning', null),
          p.setData('warningGlow', null),
          p.setData('cracks', null),
          p.setData('fragments', null),
          d)
        ) {
          const e = this.add
              .rectangle(l + o / 2, r + 4, Math.max(12, o - 8), 3, 16733028, 0)
              .setDepth(8),
            t = this.add
              .rectangle(l + o / 2, r + 5, Math.max(10, o - 16), 8, 16733028, 0)
              .setDepth(7);
          (e.setStrokeStyle(1, 16745070, 0.72),
            p.setData('warning', e),
            p.setData('warningGlow', t));
        }
        (p.body && ((p.body.allowGravity = !1), (p.body.immovable = !0), (p.body.enable = !0)),
          p.setData('left', l),
          p.setData('right', l + o),
          p.setData('top', r),
          p.setData('bottom', r + n));
      }));
    const a = this.add.graphics().setDepth(6);
    (a.fillStyle(1647160).fillRect(90, 508, 72, 102).fillStyle(16760155).fillRect(104, 523, 44, 20),
      a
        .lineStyle(4, 8294818)
        .lineBetween(1070, 610, 1070, 430)
        .lineBetween(1070, 430, 1180, 430)
        .lineBetween(1180, 430, 1180, 610),
      a
        .fillStyle(3416890)
        .fillRect(1770, 455, 140, 58)
        .fillStyle(16741760)
        .fillRect(1784, 470, 112, 25));
    const l = [];
    ([
      { x: 520, y: 382, w: 92, h: 118, label: 'NOVA' },
      { x: 1420, y: 355, w: 104, h: 132, label: 'VOID' },
      { x: 2480, y: 392, w: 96, h: 124, label: 'SYNC' },
      { x: 3610, y: 362, w: 110, h: 136, label: 'GRID' },
      { x: 4550, y: 388, w: 98, h: 122, label: 'APEX' },
    ].forEach((t, i) => {
      const s = this.add.container(t.x, t.y).setDepth(3.38).setScrollFactor(0.24),
        a = this.add.rectangle(0, 0, t.w, t.h, 264722, 0.74).setStrokeStyle(1, 5400954, 0.32),
        r = this.add.graphics();
      r.lineStyle(2, e.accent, 0.38).strokeRect(-t.w / 2 + 6, -t.h / 2 + 6, t.w - 12, t.h - 12);
      const o = this.add.graphics();
      (o
        .lineStyle(3, e.accent, 0.54)
        .lineBetween(-28, 24, 0, -28)
        .lineBetween(0, -28, 28, 24)
        .lineBetween(28, 24, -28, 24),
        o.lineStyle(1.5, 15400959, 0.34).lineBetween(-18, 10, 0, -15).lineBetween(0, -15, 18, 10));
      const n = this.add.circle(0, 3, 8, e.accent, 0.1).setStrokeStyle(1.5, e.accent, 0.66),
        h = this.add.circle(0, 3, 3, 15400959, 0.78),
        d = [];
      [-1, 1].forEach((i) => {
        for (let s = 0; s < 4; s++) {
          const a = this.add.rectangle(
            i * (t.w / 2 - 13),
            22 * s - 38,
            4,
            12,
            e.accent,
            0.2 + 0.018 * s,
          );
          d.push(a);
        }
      });
      const c = this.add.rectangle(0, -t.h / 2 + 13, t.w - 28, 2, e.accent, 0.42),
        y = this.add
          .text(0, t.h / 2 - 16, `// ${t.label}`, {
            fontFamily: 'Orbitron',
            fontSize: '6px',
            fontStyle: 'bold',
            color: '#dffcff',
            letterSpacing: 1.5,
            stroke: '#050a12',
            strokeThickness: 3,
            align: 'center',
          })
          .setOrigin(0.5);
      (s.add([a, r, o, n, h, ...d, c, y]),
        l.push({ muralGroup: s, core: n, coreNode: h, idStrip: c, sideBars: d, index: i }));
    }),
      this.motionReduced ||
        l.forEach((e) => {
          (this.tweens.add({
            targets: e.core,
            scale: 1.45,
            alpha: { from: 0.06, to: 0.3 },
            duration: 1100 + 120 * e.index,
            yoyo: !0,
            repeat: -1,
            delay: 180 * e.index,
            ease: 'Sine.inOut',
          }),
            this.tweens.add({
              targets: e.coreNode,
              alpha: { from: 0.2, to: 1 },
              scale: { from: 0.72, to: 1.28 },
              duration: 650 + 70 * e.index,
              yoyo: !0,
              repeat: -1,
              delay: 120 * e.index,
              ease: 'Sine.inOut',
            }),
            this.tweens.add({
              targets: e.idStrip,
              alpha: { from: 0.1, to: 0.72 },
              scaleX: { from: 0.72, to: 1.02 },
              duration: 900 + 80 * e.index,
              yoyo: !0,
              repeat: -1,
              delay: 160 * e.index,
              ease: 'Sine.inOut',
            }),
            e.sideBars.forEach((t, i) => {
              this.tweens.add({
                targets: t,
                alpha: { from: 0.05, to: 0.52 },
                duration: 420 + 60 * i,
                delay: 90 * e.index + 75 * i,
                yoyo: !0,
                repeat: -1,
                repeatDelay: 1e3,
                ease: 'Sine.inOut',
              });
            }));
        }));
    const r = [];
    ([
      { x: 820, y: 372, height: 138, width: 74 },
      { x: 1760, y: 348, height: 164, width: 82 },
      { x: 2920, y: 366, height: 146, width: 76 },
      { x: 4070, y: 345, height: 170, width: 86 },
    ].forEach((t, i) => {
      const s = this.add.container(t.x, t.y).setDepth(3.46).setScrollFactor(0.24),
        a = this.add
          .rectangle(0, t.height / 2, 8, t.height, 660253, 0.92)
          .setStrokeStyle(1, 5071990, 0.34),
        l = this.add.graphics();
      l.lineStyle(3, 6584714, 0.82)
        .lineBetween(-t.width / 2, 0, -t.width / 2, t.height)
        .lineBetween(t.width / 2, 0, t.width / 2, t.height);
      const o = [],
        n = Math.max(3, Math.floor(t.height / 42));
      for (let e = 0; e < n; e++) {
        const i = 22 + 38 * e,
          s = this.add
            .rectangle(0, i, t.width - 8, 5, 2438726, 0.94)
            .setStrokeStyle(1, 7045522, 0.44);
        o.push(s);
      }
      const h = this.add.graphics(),
        d = Math.max(2, Math.floor(t.height / 46));
      for (let e = 0; e < d; e++) {
        const i = 38 * e + 18,
          s = i + 38,
          a = e % 2 == 0 ? -1 : 1;
        h.lineStyle(2.5, 5795713, 0.78).lineBetween(
          a * (t.width / 2 - 5),
          i,
          -a * (t.width / 2 - 5),
          s,
        );
      }
      const c = this.add.graphics();
      for (let i = 0; i < 5 * d; i++) {
        const s = Math.floor(i / 5),
          a = 38 * s + 18,
          l = (i % 5) / 5,
          r = s % 2 == 0 ? -1 : 1,
          o = r * (t.width / 2 - 6),
          n = -r * (t.width / 2 - 6),
          h = Phaser.Math.Linear(o, n, l);
        c.lineStyle(1, e.accent, 0.22).lineBetween(h - 7, a + 5, h + 7, a + 5);
      }
      const y = this.add.graphics();
      y.lineStyle(2, 7440022, 0.62)
        .lineBetween(-t.width / 2, 0, -t.width / 2, -12)
        .lineBetween(t.width / 2, 0, t.width / 2, -12)
        .lineBetween(-t.width / 2, -12, t.width / 2, -12);
      const p = this.add.rectangle(0, -9, t.width - 14, 2, e.accent, 0.34),
        f = [];
      o.forEach((i, s) => {
        const a = this.add.circle(
          -t.width / 2 + 8,
          i.y - 3,
          2.2,
          s % 2 == 0 ? e.accent : 15400959,
          0.54,
        );
        f.push(a);
        const l = this.add.circle(
          t.width / 2 - 8,
          i.y - 3,
          2.2,
          s % 2 == 0 ? e.accent : 15400959,
          0.4,
        );
        f.push(l);
      });
      const u = this.add.rectangle(0, -22, 34, 16, 1056299, 0.96).setStrokeStyle(1, 6453386, 0.52),
        m = this.add.circle(0, -22, 3, e.accent, 0.7),
        g = this.add.graphics();
      (g
        .lineStyle(3, 4939890, 0.7)
        .lineBetween(-t.width / 2, t.height, -t.width / 2 + 12, t.height + 20)
        .lineBetween(t.width / 2, t.height, t.width / 2 - 12, t.height + 20),
        s.add([a, l, ...o, h, c, y, p, ...f, u, m, g]),
        r.push({ group: s, warningStrip: p, statusLights: f, accessNode: m, index: i }));
    }),
      this.motionReduced ||
        r.forEach((e) => {
          (this.tweens.add({
            targets: e.warningStrip,
            alpha: { from: 0.08, to: 0.62 },
            duration: 900 + 110 * e.index,
            yoyo: !0,
            repeat: -1,
            delay: 170 * e.index,
            ease: 'Sine.inOut',
          }),
            e.statusLights.forEach((t, i) => {
              this.tweens.add({
                targets: t,
                alpha: { from: 0.08, to: 0.82 },
                scale: { from: 0.72, to: 1.18 },
                duration: 460,
                delay: 120 * e.index + 85 * i,
                yoyo: !0,
                repeat: -1,
                repeatDelay: 1500,
                ease: 'Sine.inOut',
              });
            }),
            this.tweens.add({
              targets: e.accessNode,
              alpha: { from: 0.18, to: 1 },
              scale: { from: 0.7, to: 1.3 },
              duration: 720 + 80 * e.index,
              yoyo: !0,
              repeat: -1,
              delay: 160 * e.index,
              ease: 'Sine.inOut',
            }));
        }));
    [
      { x: 700, y: 430, scale: 0.82 },
      { x: 1320, y: 410, scale: 0.72 },
      { x: 1920, y: 438, scale: 0.9 },
      { x: 2580, y: 420, scale: 0.76 },
      { x: 3180, y: 435, scale: 0.86 },
      { x: 3830, y: 412, scale: 0.72 },
      { x: 4450, y: 430, scale: 0.82 },
    ].forEach((t, i) => {
      const s = this.add.container(t.x, t.y).setDepth(6.05).setScrollFactor(0.26).setScale(t.scale),
        a = this.add.rectangle(0, 18, 8, 20, 3229273, 0.88),
        l = this.add.rectangle(0, 28, 34, 5, 5269370, 0.72),
        r = this.add.ellipse(0, -2, 46, 25, 1386040, 0.96).setStrokeStyle(1.5, e.accent, 0.62),
        o = this.add.ellipse(0, -2, 32, 17, e.accent, 0.065),
        n = this.add.circle(0, -2, 5, 661026, 0.98).setStrokeStyle(1, e.accent, 0.58),
        h = this.add.circle(0, -2, 2, 15400959, 0.82),
        d = this.add.rectangle(0, -10, 3, 20, e.accent, 0.46),
        c = this.add.circle(0, -21, 2.5, 15400959, 0.82),
        y = this.add.ellipse(0, -2, 58, 30, e.accent, 0).setStrokeStyle(1, e.accent, 0.15);
      (s.add([a, l, r, o, n, h, d, c, y]),
        this.motionReduced ||
          (this.tweens.add({
            targets: s,
            angle: i % 2 == 0 ? 360 : -360,
            duration: 7e3 + 650 * i,
            repeat: -1,
            ease: 'Linear',
            delay: 420 * i,
          }),
          this.tweens.add({
            targets: y,
            scaleX: { from: 0.72, to: 1.28 },
            scaleY: { from: 0.72, to: 1.28 },
            alpha: { from: 0.1, to: 0 },
            duration: 1450 + 120 * i,
            repeat: -1,
            ease: 'Sine.out',
            delay: 240 * i,
          }),
          this.tweens.add({
            targets: h,
            scale: { from: 0.7, to: 1.45 },
            alpha: { from: 0.24, to: 0.95 },
            duration: 620 + 80 * i,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 180 * i,
          }),
          this.tweens.add({
            targets: c,
            alpha: { from: 0.2, to: 0.92 },
            scale: { from: 0.72, to: 1.3 },
            duration: 780 + 90 * i,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 130 * i,
          })));
    });
    const o = [];
    [
      { x: 250, y: 438, w: 96, h: 34, tilt: -8 },
      { x: 880, y: 414, w: 112, h: 38, tilt: 6 },
      { x: 1480, y: 446, w: 86, h: 30, tilt: -5 },
      { x: 2050, y: 420, w: 124, h: 42, tilt: 7 },
      { x: 2760, y: 442, w: 104, h: 34, tilt: -6 },
      { x: 3380, y: 416, w: 118, h: 40, tilt: 5 },
      { x: 4010, y: 440, w: 92, h: 32, tilt: -7 },
      { x: 4560, y: 410, w: 128, h: 42, tilt: 6 },
    ].forEach((t, i) => {
      const s = this.add.container(t.x, t.y).setAngle(t.tilt).setDepth(3.1).setScrollFactor(0.19),
        a = this.add.graphics();
      a.lineStyle(2, 5466491, 0.52)
        .lineBetween(-t.w / 2 + 12, t.h / 2, -t.w / 2 + 4, t.h / 2 + 14)
        .lineBetween(t.w / 2 - 12, t.h / 2, t.w / 2 - 4, t.h / 2 + 14);
      const l = this.add.rectangle(0, 0, t.w, t.h, 661284, 0.96).setStrokeStyle(1.5, 6322315, 0.62),
        r = this.add.graphics();
      r.lineStyle(1, e.accent, 0.24);
      const n = Math.max(4, Math.floor(t.w / 18));
      for (let e = 1; e < n; e++) {
        const i = -t.w / 2 + (t.w / n) * e;
        r.lineBetween(i, -t.h / 2, i, t.h / 2);
      }
      for (let e = 1; e < 3; e++) {
        const i = -t.h / 2 + (t.h / 3) * e;
        r.lineBetween(-t.w / 2, i, t.w / 2, i);
      }
      const h = this.add.rectangle(0, t.h / 2 + 1, t.w - 22, 2, e.accent, 0.28),
        d = this.add.circle(t.w / 2 - 7, -t.h / 2 + 7, 2.5, e.accent, 0.78),
        c = this.add.rectangle(-t.w / 2 + 4, 0, 16, t.h - 6, 15400959, 0.045).setOrigin(0, 0.5);
      (s.add([a, l, r, h, d, c]),
        o.push({ group: s, panel: l, panelCore: h, statusNode: d, scan: c }),
        !this.motionReduced &&
          this.graphicsLevel >= 1 &&
          (this.tweens.add({
            targets: c,
            x: t.w / 2 - 18,
            duration: 2100 + 170 * i,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 260 * i,
          }),
          this.tweens.add({
            targets: h,
            alpha: { from: 0.06, to: 0.42 },
            duration: 1500 + 120 * i,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 180 * i,
          }),
          this.tweens.add({
            targets: d,
            alpha: { from: 0.2, to: 0.92 },
            scale: { from: 0.78, to: 1.25 },
            duration: 760 + 80 * i,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 110 * i,
          })));
    });
    const n = [];
    ([
      { x: 760, top: 318, height: 148, width: 112, accent: 9303295 },
      { x: 1980, top: 292, height: 176, width: 124, accent: 16763243 },
      { x: 3890, top: 324, height: 142, width: 118, accent: 12162047 },
    ].forEach((e, t) => {
      const i = this.add.container(e.x, e.top).setDepth(3.34).setScrollFactor(0.2),
        s = this.add.rectangle(0, e.height / 2, e.width + 16, e.height, 330258, 0.3),
        a = this.add.graphics();
      a.lineStyle(3, 5400955, 0.82)
        .lineBetween(-e.width / 2, 0, -e.width / 2, e.height)
        .lineBetween(e.width / 2, 0, e.width / 2, e.height);
      for (let t = 0; t <= 5; t++) {
        const i = t * (e.height / 5);
        a.lineStyle(t % 2 == 0 ? 2 : 1, 7374746, t % 2 == 0 ? 0.72 : 0.42).lineBetween(
          -e.width / 2,
          i,
          e.width / 2,
          i,
        );
      }
      for (let t = 0; t < 4; t++) {
        const i = t * (e.height / 5),
          s = (t + 1) * (e.height / 5);
        a.lineStyle(1.5, e.accent, 0.28)
          .lineBetween(-e.width / 2, i, e.width / 2, s)
          .lineBetween(e.width / 2, i, -e.width / 2, s);
      }
      const l = [];
      [34, 70, 106, 142].forEach((i, s) => {
        if (i >= e.height) return;
        const a = this.add
          .rectangle(0, i, e.width - 10, 4, 2438982, 0.92)
          .setStrokeStyle(1, 6979986, 0.42);
        l.push(a);
        const r = this.add.rectangle(0, i - 3, e.width - 28, 1.5, e.accent, 0.26);
        (l.push(r),
          this.motionReduced ||
            this.tweens.add({
              targets: r,
              alpha: { from: 0.06, to: 0.44 },
              duration: 800 + 130 * s,
              delay: 180 * t + 90 * s,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
            }));
      });
      const r = this.add
          .rectangle(0, e.height - 18, e.width - 28, 8, 1056041, 0.96)
          .setStrokeStyle(1, e.accent, 0.44),
        o = this.add.graphics();
      o.lineStyle(1.5, 8689831, 0.54)
        .lineBetween(-e.width / 2 + 16, 0, -e.width / 2 + 16, -18)
        .lineBetween(e.width / 2 - 16, 0, e.width / 2 - 16, -18);
      const h = this.add.circle(-e.width / 2, 0, 4, e.accent, 0.62),
        d = this.add.circle(e.width / 2, 0, 4, e.accent, 0.62),
        c = this.add.rectangle(0, e.height / 2, 2, e.height, e.accent, 0.18),
        y = this.add.rectangle(0, 22, 18, 14, 661282, 0.98).setStrokeStyle(1, e.accent, 0.58),
        p = this.add.rectangle(0, 22, 8, 2, e.accent, 0.62),
        f = this.add
          .rectangle(0, -4, e.width + 12, 6, 1517880, 0.92)
          .setStrokeStyle(1, e.accent, 0.36);
      (i.add([s, a, ...l, r, o, h, d, c, y, p, f]),
        n.push({
          scaffold: i,
          liftCar: y,
          liftLight: p,
          warningLeft: h,
          warningRight: d,
          index: t,
        }));
    }),
      this.motionReduced ||
        n.forEach((e) => {
          (this.tweens.add({
            targets: e.liftCar,
            y: 136,
            duration: 4300 + 500 * e.index,
            yoyo: !0,
            repeat: -1,
            delay: 620 * e.index,
            ease: 'Sine.inOut',
          }),
            this.tweens.add({
              targets: e.liftLight,
              y: 136,
              duration: 4300 + 500 * e.index,
              yoyo: !0,
              repeat: -1,
              delay: 620 * e.index,
              ease: 'Sine.inOut',
            }),
            this.tweens.add({
              targets: e.liftLight,
              alpha: { from: 0.2, to: 0.96 },
              duration: 520,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
            }),
            this.tweens.add({
              targets: e.warningLeft,
              alpha: { from: 0.1, to: 1 },
              duration: 760,
              yoyo: !0,
              repeat: -1,
              delay: 180 * e.index,
              ease: 'Stepped',
            }),
            this.tweens.add({
              targets: e.warningRight,
              alpha: { from: 0.76, to: 0.12 },
              duration: 760,
              yoyo: !0,
              repeat: -1,
              delay: 380 + 180 * e.index,
              ease: 'Stepped',
            }));
        }));
    const h = [];
    ([
      { x: 650, y: 474, w: 108, h: 44, label: 'BIO // 01' },
      { x: 1285, y: 460, w: 122, h: 50, label: 'BIO // 02' },
      { x: 1885, y: 478, w: 104, h: 42, label: 'BIO // 03' },
      { x: 2515, y: 462, w: 128, h: 48, label: 'BIO // 04' },
      { x: 3135, y: 474, w: 110, h: 44, label: 'BIO // 05' },
      { x: 3805, y: 458, w: 124, h: 50, label: 'BIO // 06' },
    ].forEach((t, i) => {
      const s = this.add.container(t.x, t.y).setDepth(3.28).setScrollFactor(0.2),
        a = this.add
          .rectangle(0, 0, t.w + 14, t.h + 12, e.accent, 0.035)
          .setStrokeStyle(1, e.accent, 0.14),
        l = this.add.rectangle(0, 0, t.w, t.h, 463131, 0.92).setStrokeStyle(2, 5401469, 0.78),
        r = this.add.graphics(),
        o = -t.w / 2 + 8,
        n = -t.h / 2 + 7,
        d = (t.w - 16) / 4;
      for (let i = 0; i < 4; i++)
        (r.fillStyle(e.accent, i % 2 == 0 ? 0.045 : 0.022).fillRect(o + i * d, n, d - 2, t.h - 14),
          r.lineStyle(1, e.accent, 0.22).lineBetween(o + i * d, n, o + i * d, t.h / 2 - 4));
      const c = this.add.graphics();
      (c
        .lineStyle(2, 7571866, 0.82)
        .lineBetween(-t.w / 2, -t.h / 2, 0, -t.h / 2 - 15)
        .lineBetween(0, -t.h / 2 - 15, t.w / 2, -t.h / 2),
        c.lineStyle(1, e.accent, 0.42).lineBetween(0, -t.h / 2 - 14, 0, t.h / 2 - 6));
      const y = this.add.graphics();
      y.fillStyle(1516574, 0.9)
        .fillRect(-t.w / 2 + 16, 10, t.w - 32, 7)
        .fillRect(-t.w / 2 + 20, 21, t.w - 40, 5);
      const p = this.add.graphics();
      [-t.w / 2 + 24, -t.w / 2 + 45, 4, t.w / 2 - 28].forEach((e, t) => {
        const i = 7 + (t % 3) * 3,
          s = t % 2 == 0 ? 6674570 : 9236648;
        (p.lineStyle(1.5, s, 0.7).lineBetween(e, 9, e, 9 - i),
          p
            .fillStyle(s, 0.72)
            .fillEllipse(e - 4, 8 - i / 2, 7, 3)
            .fillEllipse(e + 4, 6 - i / 3, 7, 3));
      });
      const f = [];
      for (let i = 0; i < 4; i++) {
        const s = this.add.rectangle(
          -t.w / 2 + 24 + i * ((t.w - 48) / 3),
          -2,
          16,
          2,
          i % 2 == 0 ? e.accent : 16765038,
          0.26,
        );
        f.push(s);
      }
      const u = this.add
          .rectangle(t.w / 2 - 11, 3, 8, 14, 858920, 0.96)
          .setStrokeStyle(1, e.accent, 0.48),
        m = this.add.circle(t.w / 2 - 11, 1, 2, e.accent, 0.78),
        g = this.add.graphics();
      (g
        .lineStyle(1, 7704738, 0.54)
        .strokeCircle(-t.w / 2 + 14, -t.h / 2 + 10, 5)
        .strokeCircle(t.w / 2 - 14, -t.h / 2 + 10, 5),
        g
          .lineStyle(1, e.accent, 0.26)
          .lineBetween(-t.w / 2 + 10, -t.h / 2 + 10, -t.w / 2 + 18, -t.h / 2 + 10)
          .lineBetween(t.w / 2 - 18, -t.h / 2 + 10, t.w / 2 - 10, -t.h / 2 + 10));
      const S = this.add
          .rectangle(0, t.h / 2 + 3, t.w + 10, 6, 1319988, 0.96)
          .setStrokeStyle(1, 5400698, 0.48),
        w = this.add.rectangle(0, t.h / 2 + 3, t.w - 28, 2, e.accent, 0.32),
        x = this.add
          .text(0, -t.h / 2 - 25, t.label, {
            fontFamily: 'Orbitron',
            fontSize: '5px',
            fontStyle: 'bold',
            color: '#b9dce7',
            stroke: '#07111d',
            strokeThickness: 2,
            letterSpacing: 1.2,
            align: 'center',
          })
          .setOrigin(0.5);
      (s.add([a, l, r, c, y, p, ...f, u, m, g, S, w, x]),
        h.push({ group: s, glow: a, growLights: f, controlNode: m, neonBase: w, index: i }));
    }),
      this.motionReduced ||
        h.forEach((e) => {
          (this.tweens.add({
            targets: e.glow,
            alpha: { from: 0.02, to: 0.09 },
            scaleX: { from: 0.96, to: 1.04 },
            scaleY: { from: 0.96, to: 1.02 },
            duration: 1500 + 130 * e.index,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 170 * e.index,
          }),
            e.growLights.forEach((t, i) => {
              this.tweens.add({
                targets: t,
                alpha: { from: 0.07, to: 0.62 },
                scaleX: { from: 0.7, to: 1.08 },
                duration: 620,
                delay: 150 * e.index + 130 * i,
                yoyo: !0,
                repeat: -1,
                repeatDelay: 1e3,
                ease: 'Sine.inOut',
              });
            }),
            this.tweens.add({
              targets: e.controlNode,
              alpha: { from: 0.1, to: 1 },
              scale: { from: 0.72, to: 1.24 },
              duration: 540 + 80 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 260 + 120 * e.index,
            }),
            this.tweens.add({
              targets: e.neonBase,
              scaleX: { from: 0.35, to: 1.08 },
              alpha: { from: 0.04, to: 0.38 },
              duration: 980 + 100 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 190 * e.index,
            }));
        }));
    [
      { x: 330, y: 475, w: 54, h: 34 },
      { x: 1040, y: 458, w: 66, h: 38 },
      { x: 1560, y: 482, w: 48, h: 30 },
      { x: 2230, y: 462, w: 72, h: 40 },
      { x: 2840, y: 476, w: 56, h: 34 },
      { x: 3460, y: 455, w: 70, h: 42 },
      { x: 4100, y: 470, w: 62, h: 36 },
      { x: 4720, y: 448, w: 74, h: 40 },
    ].forEach((t, i) => {
      this.add
        .rectangle(t.x, t.y, t.w, t.h, 660512, 0.94)
        .setOrigin(0.5)
        .setDepth(6.2)
        .setStrokeStyle(1.5, 5664128, 0.55);
      const s = this.add
          .rectangle(t.x, t.y - t.h / 2 + 4, t.w - 10, 3, e.accent, 0.18)
          .setOrigin(0.5)
          .setDepth(6.3),
        a = this.add
          .rectangle(t.x + t.w / 2 - 10, t.y - 6, 12, 3, i % 3 == 0 ? 16733028 : e.accent, 0.48)
          .setOrigin(0.5)
          .setDepth(6.4),
        l = this.add
          .rectangle(t.x - t.w / 2 + 13, t.y + 4, 16, 8, 1516854, 0.95)
          .setOrigin(0.5)
          .setDepth(6.3),
        r = this.add.rectangle(l.x, l.y, 10, 1.5, 14679295, 0.3).setOrigin(0.5).setDepth(6.4);
      this.motionReduced ||
        (this.tweens.add({
          targets: s,
          alpha: { from: 0.08, to: 0.48 },
          duration: 1e3 + 120 * i,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
          delay: 160 * i,
        }),
        this.tweens.add({
          targets: a,
          alpha: { from: 0.08, to: 0.92 },
          duration: 420 + 90 * i,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
          delay: 210 * i,
        }),
        this.tweens.add({
          targets: r,
          scaleX: { from: 0.45, to: 1.25 },
          alpha: { from: 0.08, to: 0.42 },
          duration: 720 + 80 * i,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
        }));
    });
    [
      { x: 250, y: 315, w: 150, h: 190 },
      { x: 720, y: 280, w: 180, h: 225 },
      { x: 1190, y: 335, w: 140, h: 170 },
      { x: 1680, y: 285, w: 190, h: 220 },
      { x: 2250, y: 320, w: 165, h: 185 },
      { x: 2810, y: 275, w: 205, h: 230 },
      { x: 3370, y: 315, w: 165, h: 190 },
    ].forEach((t, i) => {
      for (let s = 0; s < 4; s++) {
        const a = t.y + 12 + 38 * s,
          l = Math.max(3, Math.floor(t.w / 38));
        for (let r = 0; r < l; r++) {
          const l = t.x - t.w / 2 + 18 + 38 * r,
            o = i + s + r,
            n = o % 4 != 0,
            h = o % 5 == 0 ? 16765038 : e.accent,
            d =
              (this.add
                .rectangle(l, a, 25, 18, h, n ? 0.075 : 0.018)
                .setOrigin(0.5)
                .setDepth(3.05)
                .setScrollFactor(0.24),
              this.add
                .rectangle(l, a, 14, 2, h, n ? 0.22 : 0.035)
                .setOrigin(0.5)
                .setDepth(3.08)
                .setScrollFactor(0.24));
          (o % 3 == 0 &&
            this.add
              .rectangle(l - 5, a, 2, 11, 8031647, 0.16)
              .setOrigin(0.5)
              .setDepth(3.09)
              .setScrollFactor(0.24),
            !this.motionReduced &&
              n &&
              this.tweens.add({
                targets: d,
                alpha: { from: 0.05, to: o % 5 == 0 ? 0.44 : 0.3 },
                duration: 900 + (o % 6) * 150,
                yoyo: !0,
                repeat: -1,
                ease: 'Sine.inOut',
                delay: 90 * o,
              }));
        }
      }
    });
    [
      { x: 345, top: 280, bottom: 470 },
      { x: 800, top: 245, bottom: 470 },
      { x: 1255, top: 295, bottom: 450 },
      { x: 1770, top: 250, bottom: 475 },
      { x: 2340, top: 285, bottom: 462 },
      { x: 2910, top: 235, bottom: 478 },
    ].forEach((t, i) => {
      this.add
        .rectangle(t.x, (t.top + t.bottom) / 2, 13, t.bottom - t.top, 330773, 0.78)
        .setDepth(3.12)
        .setScrollFactor(0.25)
        .setStrokeStyle(1, e.accent, 0.16);
      const s = this.add
        .rectangle(t.x, t.top, 7, 18, e.accent, 0.4)
        .setDepth(3.16)
        .setScrollFactor(0.25);
      this.motionReduced ||
        this.tweens.add({
          targets: s,
          y: t.bottom,
          duration: 3600 + 380 * i,
          delay: 420 * i,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
        });
    });
    const d = [];
    ([
      { x: 620, y: 585, width: 150 },
      { x: 1430, y: 585, width: 170 },
      { x: 2380, y: 585, width: 150 },
      { x: 3340, y: 585, width: 180 },
      { x: 4280, y: 585, width: 160 },
    ].forEach((t, i) => {
      const s = this.add.container(t.x, t.y).setDepth(6.4).setScrollFactor(0.92),
        a = this.add
          .rectangle(0, 0, t.width + 18, 30, 330515, 0.86)
          .setStrokeStyle(1, 5007226, 0.34),
        l = [],
        r = Math.max(6, Math.floor(t.width / 24));
      for (let i = 0; i < r; i++) {
        const s = -t.width / 2 + 12 + 24 * i,
          a = this.add.rectangle(s, 0, 12, 18, e.accent, 0.2);
        l.push(a);
      }
      const o = this.add.rectangle(-t.width / 2 - 4, 0, 3, 22, e.accent, 0.52),
        n = this.add.rectangle(t.width / 2 + 4, 0, 3, 22, e.accent, 0.52),
        h = this.add
          .rectangle(-t.width / 2 - 18, -17, 10, 18, 463131, 0.96)
          .setStrokeStyle(1, 6124935, 0.48),
        c = this.add.circle(-t.width / 2 - 18, -19, 2.5, e.accent, 0.82),
        y = this.add.circle(-t.width / 2 - 18, -14, 2.5, 16733028, 0.3),
        p = this.add.rectangle(-t.width / 2, 0, 18, 2, 15400959, 0.6);
      (s.add([a, ...l, o, n, h, c, y, p]),
        d.push({ group: s, stripes: l, scanBar: p, signalNode: c, signalLower: y, index: i }));
    }),
      this.motionReduced ||
        d.forEach((e) => {
          (e.stripes.forEach((t, i) => {
            this.tweens.add({
              targets: t,
              alpha: { from: 0.08, to: 0.62 },
              delay: 180 * e.index + 70 * i,
              duration: 420,
              yoyo: !0,
              repeat: -1,
              repeatDelay: 1500,
              ease: 'Sine.inOut',
            });
          }),
            this.tweens.add({
              targets: e.scanBar,
              x: 160,
              duration: 1800,
              repeat: -1,
              delay: 260 * e.index,
              ease: 'Linear',
              onRepeat: () => {
                e.scanBar?.active && (e.scanBar.x = -160);
              },
            }),
            this.tweens.add({
              targets: e.signalNode,
              alpha: { from: 0.2, to: 1 },
              scale: { from: 0.72, to: 1.3 },
              duration: 720,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
            }),
            this.tweens.add({
              targets: e.signalLower,
              alpha: { from: 0.08, to: 0.42 },
              duration: 980,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
            }));
        }));
    const c = [];
    ([
      { x: 500, y: 530, side: 1 },
      { x: 1080, y: 522, side: -1 },
      { x: 1515, y: 535, side: 1 },
      { x: 2050, y: 525, side: -1 },
      { x: 2670, y: 532, side: 1 },
      { x: 3260, y: 524, side: -1 },
      { x: 3900, y: 534, side: 1 },
    ].forEach((t, i) => {
      const s = this.add.container(t.x, t.y).setDepth(5.05).setScrollFactor(0.78),
        a = this.add.rectangle(0, 28, 72, 6, 528666, 0.94).setStrokeStyle(1, 5071990, 0.42),
        l = this.add.rectangle(0, 0, 18, 54, 661284, 0.97).setStrokeStyle(1.5, 6387593, 0.62),
        r = this.add.rectangle(0, 2, 8, 30, e.accent, 0.12),
        o = this.add.rectangle(0, 2, 3, 24, e.accent, 0.62),
        n = this.add.rectangle(0, -17, 12, 8, 397338, 0.98).setStrokeStyle(1, e.accent, 0.55),
        h = this.add.circle(0, -17, 2.2, e.accent, 0.82),
        d = this.add
          .rectangle(23 * t.side, 8, 30, 4, 1517624, 0.92)
          .setStrokeStyle(1, 5795714, 0.46),
        y = this.add.graphics();
      y.lineStyle(2, e.accent, 0.42)
        .lineBetween(36 * t.side, 10, 52 * t.side, 22)
        .lineBetween(52 * t.side, 22, 52 * t.side, 31);
      const p = this.add.circle(52 * t.side, 32, 3, e.accent, 0.72),
        f = this.add
          .ellipse(34 * t.side, 30, 38, 10, e.accent, 0.035)
          .setStrokeStyle(1, e.accent, 0.24),
        u = this.add
          .ellipse(34 * t.side, 30, 20, 6, e.accent, 0.025)
          .setStrokeStyle(1, 15400959, 0.22),
        m = this.add
          .text(0, -31, i % 2 == 0 ? 'CHARGE' : 'POWER', {
            fontFamily: 'Orbitron',
            fontSize: '5px',
            fontStyle: 'bold',
            color: '#dffcff',
            letterSpacing: 1,
            stroke: '#06101a',
            strokeThickness: 2,
          })
          .setOrigin(0.5);
      (s.add([a, l, r, o, n, h, d, y, p, f, u, m]),
        c.push({
          bay: s,
          core: r,
          coreLine: o,
          displayNode: h,
          connector: p,
          ringOuter: f,
          ringInner: u,
          index: i,
        }));
    }),
      this.motionReduced ||
        c.forEach((e) => {
          (this.tweens.add({
            targets: e.core,
            alpha: { from: 0.05, to: 0.34 },
            scaleY: { from: 0.72, to: 1.08 },
            duration: 900 + 90 * e.index,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 140 * e.index,
          }),
            this.tweens.add({
              targets: e.coreLine,
              y: -10,
              duration: 1250,
              repeat: -1,
              delay: 190 * e.index,
              ease: 'Linear',
              onRepeat: () => {
                e.coreLine?.active && (e.coreLine.y = 14);
              },
            }),
            this.tweens.add({
              targets: e.displayNode,
              alpha: { from: 0.18, to: 1 },
              scale: { from: 0.74, to: 1.3 },
              duration: 640 + 50 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
            }),
            this.tweens.add({
              targets: e.connector,
              alpha: { from: 0.18, to: 0.92 },
              scale: { from: 0.76, to: 1.28 },
              duration: 820,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 110 * e.index,
            }),
            this.tweens.add({
              targets: e.ringOuter,
              scaleX: { from: 0.78, to: 1.32 },
              scaleY: { from: 0.78, to: 1.32 },
              alpha: { from: 0.04, to: 0 },
              duration: 1500,
              repeat: -1,
              delay: 160 * e.index,
              ease: 'Sine.out',
            }),
            this.tweens.add({
              targets: e.ringInner,
              scaleX: { from: 0.84, to: 1.18 },
              alpha: { from: 0.1, to: 0 },
              duration: 1050,
              repeat: -1,
              delay: 320 + 120 * e.index,
              ease: 'Sine.out',
            }));
        }));
    const y = this.add.container(930, 425).setDepth(3.72).setScrollFactor(0.28),
      p = this.add.rectangle(0, 0, 350, 46, e.accent, 0.028),
      f = this.add.rectangle(0, 0, 330, 34, 595234, 0.96).setStrokeStyle(2, 6322314, 0.62),
      u = this.add.rectangle(0, -2, 304, 22, 795440, 0.48).setStrokeStyle(1, e.accent, 0.34),
      m = this.add.rectangle(0, 17, 314, 4, 1387067, 0.94),
      g = this.add.rectangle(0, -20, 318, 3, e.accent, 0.46),
      S = [];
    for (let t = -6; t <= 6; t++) {
      const i = this.add.rectangle(23 * t, -1, 12, 2, t % 2 == 0 ? e.accent : 15400959, 0.26);
      S.push(i);
    }
    const w = this.add.graphics();
    w.lineStyle(2, 5138040, 0.54);
    for (let e = -142; e <= 142; e += 28) w.lineBetween(e, -16, e, 16);
    const x = this.add.rectangle(-161, 0, 12, 38, 661284, 0.98).setStrokeStyle(1.5, e.accent, 0.52),
      b = this.add.rectangle(161, 0, 12, 38, 661284, 0.98).setStrokeStyle(1.5, e.accent, 0.52),
      C = this.add.rectangle(-158, 42, 10, 62, 1583675, 0.94).setStrokeStyle(1, 5992834, 0.44),
      R = this.add.rectangle(158, 42, 10, 62, 1583675, 0.94).setStrokeStyle(1, 5992834, 0.44),
      k = this.add.circle(-158, 9, 4, e.accent, 0.66),
      D = this.add.circle(158, 9, 4, e.accent, 0.66),
      v = this.add.graphics();
    v.lineStyle(1.5, 7835808, 0.36)
      .lineBetween(-158, -20, -112, -42)
      .lineBetween(-112, -42, 112, -42)
      .lineBetween(112, -42, 158, -20);
    const T = this.add.rectangle(-146, 0, 28, 2, 15400959, 0.72).setOrigin(0, 0.5);
    (y.add([p, f, u, m, g, ...S, w, x, b, C, R, k, D, v, T]),
      this.motionReduced ||
        (this.tweens.add({
          targets: p,
          alpha: { from: 0.012, to: 0.055 },
          scaleX: { from: 0.96, to: 1.05 },
          duration: 1500,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
        }),
        this.tweens.add({
          targets: g,
          alpha: { from: 0.14, to: 0.72 },
          duration: 900,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
        }),
        S.forEach((e, t) => {
          this.tweens.add({
            targets: e,
            alpha: { from: 0.05, to: t % 2 == 0 ? 0.76 : 0.48 },
            duration: 520,
            delay: 75 * t,
            yoyo: !0,
            repeat: -1,
            repeatDelay: 1100,
            ease: 'Sine.inOut',
          });
        }),
        this.tweens.add({
          targets: T,
          x: 146,
          duration: 2300,
          repeat: -1,
          delay: 700,
          ease: 'Linear',
          onRepeat: () => {
            T?.active && (T.x = -146);
          },
        }),
        this.tweens.add({
          targets: [k, D],
          alpha: { from: 0.18, to: 1 },
          scale: { from: 0.72, to: 1.28 },
          duration: 760,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
        })));
    const E = [];
    ([
      { x: 190, y: 526, w: 108 },
      { x: 640, y: 512, w: 124 },
      { x: 1160, y: 524, w: 104 },
      { x: 1720, y: 509, w: 132 },
      { x: 2270, y: 522, w: 116 },
      { x: 2860, y: 512, w: 136 },
      { x: 3470, y: 522, w: 112 },
    ].forEach((t, i) => {
      const s = this.add.container(t.x, t.y).setDepth(5.3).setScrollFactor(0.78),
        a = this.add.rectangle(0, -7, t.w - 12, 4, 1583416, 0.94).setStrokeStyle(1, 6124163, 0.48),
        l = this.add.rectangle(0, 0, t.w, 16, 661283, 0.96).setStrokeStyle(1, e.accent, 0.48),
        r = this.add.rectangle(0, 8, t.w - 8, 2, e.accent, 0.52),
        o = [],
        n = Math.max(5, Math.floor(t.w / 24));
      for (let i = 0; i < n; i++) {
        const s = -t.w / 2 + 10 + 22 * i,
          a = this.add.rectangle(
            s,
            2,
            10,
            9,
            i % 2 == 0 ? e.accent : 2572370,
            i % 2 == 0 ? 0.14 : 0.54,
          );
        o.push(a);
      }
      const h = this.add.graphics();
      h.lineStyle(1.5, 6848144, 0.58)
        .lineBetween(-t.w / 2 + 15, -5, -t.w / 2 + 15, 15)
        .lineBetween(t.w / 2 - 15, -5, t.w / 2 - 15, 15);
      const d = this.add.circle(-t.w / 2 + 5, 8, 2.4, e.accent, 0.62),
        c = this.add.circle(t.w / 2 - 5, 8, 2.4, e.accent, 0.62),
        y = this.add.graphics();
      (y
        .lineStyle(1, e.accent, 0.16)
        .lineBetween(-t.w / 2 + 28, 10, -t.w / 2 + 23, 20)
        .lineBetween(0, 10, -5, 21)
        .lineBetween(t.w / 2 - 28, 10, t.w / 2 - 23, 20),
        s.add([a, l, r, ...o, h, d, c, y]),
        E.push({ group: s, canopy: l, edge: r, segments: o, nodeLeft: d, nodeRight: c, index: i }));
    }),
      this.motionReduced ||
        E.forEach((e) => {
          (this.tweens.add({
            targets: e.edge,
            alpha: { from: 0.16, to: 0.76 },
            scaleX: { from: 0.94, to: 1.03 },
            duration: 1e3 + 90 * e.index,
            yoyo: !0,
            repeat: -1,
            delay: 140 * e.index,
            ease: 'Sine.inOut',
          }),
            e.segments.forEach((t, i) => {
              i % 2 == 0 &&
                this.tweens.add({
                  targets: t,
                  alpha: { from: 0.06, to: 0.38 },
                  duration: 560,
                  delay: 100 * e.index + 65 * i,
                  yoyo: !0,
                  repeat: -1,
                  repeatDelay: 1200,
                  ease: 'Sine.inOut',
                });
            }),
            this.tweens.add({
              targets: [e.nodeLeft, e.nodeRight],
              alpha: { from: 0.14, to: 0.92 },
              scale: { from: 0.76, to: 1.22 },
              duration: 720,
              yoyo: !0,
              repeat: -1,
              delay: 120 * e.index,
              ease: 'Sine.inOut',
            }),
            this.tweens.add({
              targets: e.group,
              y: '-=2',
              duration: 1800 + 110 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 140 * e.index,
            }));
        }));
    [
      { x: 190, y: 562, w: 92, label: 'NOVA' },
      { x: 640, y: 548, w: 108, label: 'BYTE' },
      { x: 1160, y: 560, w: 88, label: 'SYNC' },
      { x: 1720, y: 545, w: 116, label: 'VOID' },
      { x: 2270, y: 558, w: 102, label: 'GRID' },
      { x: 2860, y: 548, w: 120, label: 'ARC' },
      { x: 3470, y: 558, w: 98, label: 'CORE' },
    ].forEach((t, i) => {
      (this.add
        .rectangle(t.x, t.y, t.w, 48, 726564, 0.95)
        .setDepth(5.15)
        .setStrokeStyle(1.5, 5269114, 0.55),
        this.add.rectangle(t.x, t.y - 22, t.w - 12, 3, e.accent, 0.58).setDepth(5.22),
        this.add
          .rectangle(t.x, t.y + 7, t.w - 22, 20, 528668, 0.94)
          .setDepth(5.2)
          .setStrokeStyle(1, e.accent, 0.28));
      const s = this.add
          .text(t.x, t.y - 10, t.label, {
            fontFamily: 'Orbitron',
            fontSize: '8px',
            color: '#dffcff',
            stroke: '#07111d',
            strokeThickness: 3,
            letterSpacing: 2,
          })
          .setOrigin(0.5)
          .setDepth(5.25),
        a =
          (this.add
            .rectangle(t.x + 0.28 * t.w, t.y + 7, 14, 28, 462874, 0.98)
            .setDepth(5.24)
            .setStrokeStyle(1, 7505818, 0.35),
          this.add.rectangle(t.x + 0.28 * t.w, t.y - 7, 8, 2, e.accent, 0.46).setDepth(5.27)),
        l = this.add
          .rectangle(t.x - 0.12 * t.w, t.y + 7, 34, 3, i % 2 == 0 ? e.accent : 16765038, 0.3)
          .setDepth(5.26);
      this.motionReduced ||
        (this.tweens.add({
          targets: s,
          alpha: { from: 0.56, to: 1 },
          duration: 1e3 + 130 * i,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
          delay: 160 * i,
        }),
        this.tweens.add({
          targets: a,
          alpha: { from: 0.08, to: 0.82 },
          duration: 700 + 100 * i,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
          delay: 260 + 140 * i,
        }),
        this.tweens.add({
          targets: l,
          scaleX: { from: 0.72, to: 1.08 },
          alpha: { from: 0.08, to: 0.38 },
          duration: 1100 + 120 * i,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
          delay: 110 * i,
        }));
    });
    const O = [];
    ([
      { x: 470, y: 555, h: 54, label: 'COMM // 01' },
      { x: 1250, y: 548, h: 62, label: 'COMM // 02' },
      { x: 2390, y: 556, h: 58, label: 'COMM // 03' },
      { x: 3360, y: 548, h: 64, label: 'COMM // 04' },
    ].forEach((t, i) => {
      const s = this.add.container(t.x, t.y).setDepth(5.3).setScrollFactor(0.44),
        a = this.add.rectangle(0, 0, 44, t.h, 594719, 0.97).setStrokeStyle(1.6, 5400956, 0.82),
        l = this.add
          .rectangle(0, -2, 34, t.h - 10, 1058874, 0.56)
          .setStrokeStyle(1, e.accent, 0.34),
        r = this.add.rectangle(0, -t.h / 2 + 7, 34, 5, e.accent, 0.22),
        o = this.add.circle(12, -t.h / 2 + 7, 2, e.accent, 0.85),
        n = this.add.rectangle(0, -7, 25, 12, 330515, 0.94).setStrokeStyle(1, e.accent, 0.55),
        h = this.add.rectangle(0, -7, 15, 2, e.accent, 0.34),
        d = this.add.rectangle(-8, -2, 16, 1.5, 15400959, 0.18),
        c = this.add.circle(0, 12, 5, 529182, 0.98).setStrokeStyle(1.5, e.accent, 0.72),
        y = this.add.circle(0, 12, 2, e.accent, 0.8),
        p = [];
      for (let t = 0; t < 4; t++) {
        const i = this.add.rectangle(
          8 * t - 12,
          24,
          5,
          2 + 2 * t,
          3 === t ? e.accent : 6717588,
          3 === t ? 0.62 : 0.42,
        );
        p.push(i);
      }
      const f = this.add.rectangle(0, t.h / 2 - 6, 26, 2, e.accent, 0.3),
        u = this.add
          .text(0, -t.h / 2 - 8, t.label, {
            fontFamily: 'Orbitron',
            fontSize: '6px',
            fontStyle: 'bold',
            color: '#cceef8',
            stroke: '#07111d',
            strokeThickness: 2,
            letterSpacing: 1.2,
            align: 'center',
          })
          .setOrigin(0.5),
        m = this.add
          .rectangle(0, t.h / 2 + 3, 54, 5, 1385782, 0.96)
          .setStrokeStyle(1, 5400699, 0.48),
        g = this.add.rectangle(0, t.h / 2 + 3, 28, 2, e.accent, 0.28),
        S = this.add.graphics();
      S.lineStyle(1.5, 6650765, 0.72)
        .lineBetween(0, -t.h / 2, 0, -t.h / 2 - 14)
        .lineBetween(0, -t.h / 2 - 14, 7, -t.h / 2 - 18);
      const w = this.add.circle(7, -t.h / 2 - 18, 2.5, e.accent, 0.72);
      (s.add([a, l, r, o, n, h, d, c, y, ...p, f, u, m, g, S, w]),
        O.push({
          group: s,
          display: n,
          displayCore: h,
          displayScan: d,
          commCore: c,
          commDot: y,
          signalBars: p,
          dataLine: f,
          headerNode: o,
          antennaNode: w,
          index: i,
        }));
    }),
      this.motionReduced ||
        O.forEach((e) => {
          (this.tweens.add({
            targets: e.displayCore,
            scaleX: { from: 0.55, to: 1.08 },
            alpha: { from: 0.1, to: 0.72 },
            duration: 760 + 120 * e.index,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 140 * e.index,
          }),
            this.tweens.add({
              targets: e.displayScan,
              x: 10,
              alpha: { from: 0.04, to: 0.34 },
              duration: 900 + 80 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 420 + 170 * e.index,
            }),
            this.tweens.add({
              targets: e.commCore,
              scale: { from: 0.84, to: 1.2 },
              alpha: { from: 0.34, to: 0.84 },
              duration: 680 + 90 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 180 * e.index,
            }),
            this.tweens.add({
              targets: e.commDot,
              alpha: { from: 0.18, to: 1 },
              scale: { from: 0.62, to: 1.28 },
              duration: 420 + 70 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 150 + 130 * e.index,
            }),
            e.signalBars.forEach((t, i) => {
              this.tweens.add({
                targets: t,
                alpha: { from: 0.1, to: 3 === i ? 0.86 : 0.58 },
                scaleY: { from: 0.72, to: 1.08 },
                duration: 500,
                delay: 130 * e.index + 120 * i,
                yoyo: !0,
                repeat: -1,
                repeatDelay: 1100,
                ease: 'Sine.inOut',
              });
            }),
            this.tweens.add({
              targets: e.headerNode,
              alpha: { from: 0.12, to: 0.92 },
              scale: { from: 0.72, to: 1.16 },
              duration: 560 + 90 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 210 * e.index,
            }),
            this.tweens.add({
              targets: e.dataLine,
              scaleX: { from: 0.3, to: 1.1 },
              alpha: { from: 0.06, to: 0.42 },
              duration: 880 + 100 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 160 * e.index,
            }),
            this.tweens.add({
              targets: e.antennaNode,
              alpha: { from: 0.1, to: 0.88 },
              scale: { from: 0.7, to: 1.25 },
              duration: 620 + 100 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 300 + 160 * e.index,
            }));
        }));
    const A = [];
    ([
      { x: 170, y: 602, width: 78 },
      { x: 820, y: 606, width: 92 },
      { x: 1510, y: 600, width: 84 },
      { x: 2190, y: 606, width: 96 },
      { x: 2875, y: 602, width: 82 },
      { x: 3540, y: 606, width: 94 },
      { x: 4200, y: 600, width: 86 },
      { x: 4810, y: 606, width: 100 },
    ].forEach((t, i) => {
      const s = this.add.container(t.x, t.y).setDepth(5.1).setScrollFactor(0.44),
        a = this.add.ellipse(0, 9, t.width + 18, 8, 132619, 0.34),
        l = this.add.graphics();
      l.lineStyle(3, 5071733, 0.76)
        .lineBetween(-t.width / 2 + 10, -3, -t.width / 2 + 10, 15)
        .lineBetween(t.width / 2 - 10, -3, t.width / 2 - 10, 15);
      const r = this.add
          .rectangle(0, 0, t.width, 12, 1056042, 0.97)
          .setStrokeStyle(1.5, 6322057, 0.66),
        o = this.add
          .rectangle(0, -4, t.width - 12, 5, 1781053, 0.96)
          .setStrokeStyle(1, e.accent, 0.34),
        n = this.add
          .rectangle(0, -19, t.width - 18, 7, 726820, 0.96)
          .setStrokeStyle(1.5, 5467005, 0.62),
        h = this.add.rectangle(0, -23, t.width - 24, 2, e.accent, 0.56),
        d = this.add.graphics();
      for (let i = 0; i < 5; i++) {
        const s = -t.width / 2 + 18 + i * ((t.width - 36) / 4);
        d.fillStyle(i % 2 == 0 ? e.accent : 5466747, i % 2 == 0 ? 0.22 : 0.34).fillRect(
          s,
          -21,
          8,
          3,
        );
      }
      const c = this.add.circle(-t.width / 2 + 6, -22, 2.2, e.accent, 0.7),
        y = this.add.circle(t.width / 2 - 6, -22, 2.2, i % 2 == 0 ? e.accent : 16765038, 0.7),
        p = this.add.rectangle(0, 7, t.width - 18, 2, e.accent, 0.18),
        f = this.add
          .rectangle(t.width / 2 - 8, 7, 10, 8, 1320502, 0.96)
          .setStrokeStyle(1, 6124679, 0.58),
        u = this.add.circle(t.width / 2 - 8, 7, 1.8, e.accent, 0.74),
        m = this.add.ellipse(0, 16, t.width - 26, 5, e.accent, 0.025),
        g = this.add
          .text(0, 19, i % 2 == 0 ? 'REST NODE' : 'PUBLIC SEAT', {
            fontFamily: 'Orbitron',
            fontSize: '5px',
            fontStyle: 'bold',
            color: '#8ea8b7',
            stroke: '#07111d',
            strokeThickness: 2,
            letterSpacing: 0.8,
            align: 'center',
          })
          .setOrigin(0.5);
      (s.add([a, l, r, o, n, h, d, c, y, p, f, u, m, g]),
        A.push({
          group: s,
          neonStrip: h,
          leftNode: c,
          rightNode: y,
          underGlow: p,
          techLight: u,
          contactGlow: m,
          index: i,
        }));
    }),
      this.motionReduced ||
        A.forEach((e) => {
          (this.tweens.add({
            targets: e.neonStrip,
            alpha: { from: 0.2, to: 0.82 },
            scaleX: { from: 0.86, to: 1.04 },
            duration: 1200 + 120 * e.index,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 170 * e.index,
          }),
            this.tweens.add({
              targets: [e.leftNode, e.rightNode],
              alpha: { from: 0.16, to: 0.96 },
              scale: { from: 0.72, to: 1.3 },
              duration: 700 + 80 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 130 * e.index,
            }),
            this.tweens.add({
              targets: e.underGlow,
              scaleX: { from: 0.45, to: 1.08 },
              alpha: { from: 0.04, to: 0.38 },
              duration: 980 + 90 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 240 + 140 * e.index,
            }),
            this.tweens.add({
              targets: e.techLight,
              alpha: { from: 0.18, to: 1 },
              scale: { from: 0.7, to: 1.32 },
              duration: 620 + 75 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 110 * e.index,
            }),
            this.tweens.add({
              targets: e.contactGlow,
              scaleX: { from: 0.72, to: 1.24 },
              alpha: { from: 0.015, to: 0.075 },
              duration: 1500 + 100 * e.index,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
              delay: 160 * e.index,
            }));
        }));
    [
      [390, 570],
      [980, 565],
      [1510, 572],
      [2070, 563],
      [2630, 570],
      [3220, 565],
      [3730, 570],
    ].forEach(([t, i], s) => {
      this.add
        .rectangle(t, i, 18, 34, 1056043, 0.97)
        .setDepth(5.35)
        .setStrokeStyle(1, e.accent, 0.42);
      const a = this.add.rectangle(t, i - 7, 10, 8, e.accent, 0.16).setDepth(5.38),
        l = this.add.circle(t, i + 9, 2, s % 3 == 0 ? 16733028 : 9303295, 0.72).setDepth(5.39);
      this.motionReduced ||
        (this.tweens.add({
          targets: a,
          alpha: { from: 0.05, to: 0.44 },
          duration: 800 + 90 * s,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
        }),
        this.tweens.add({
          targets: l,
          alpha: { from: 0.08, to: 0.92 },
          duration: 500 + 70 * s,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
          delay: 100 * s,
        }));
    });
    [
      { x: 300, y: 455, w: 54 },
      { x: 920, y: 442, w: 68 },
      { x: 1450, y: 462, w: 50 },
      { x: 1910, y: 438, w: 72 },
      { x: 2530, y: 456, w: 62 },
      { x: 3070, y: 442, w: 70 },
      { x: 3610, y: 456, w: 56 },
    ].forEach((t, i) => {
      (this.add
        .rectangle(t.x, t.y, t.w, 28, 1582647, 0.96)
        .setDepth(6.1)
        .setStrokeStyle(1, 6716817, 0.54),
        this.add.rectangle(t.x, t.y - 9, t.w - 12, 3, 726048, 0.96).setDepth(6.14));
      const s = this.add
          .rectangle(t.x - t.w / 2 + 8, t.y - 9, 5, 3, i % 2 == 0 ? e.accent : 16765038, 0.62)
          .setDepth(6.16),
        a =
          (this.add.rectangle(t.x + t.w / 2 - 7, t.y - 20, 5, 22, 5466492, 0.78).setDepth(6.12),
          this.add.circle(t.x + t.w / 2 - 7, t.y - 37, 7, 14678015, 0.018).setDepth(6));
      !this.motionReduced &&
        (this.graphicsLevel ?? 2) >= 1 &&
        (this.tweens.add({
          targets: a,
          y: a.y - 15,
          x: a.x + 7,
          scale: { from: 0.6, to: 1.45 },
          alpha: { from: 0.006, to: 0 },
          duration: 1800 + 130 * i,
          repeat: -1,
          ease: 'Sine.out',
          delay: 220 * i,
        }),
        this.tweens.add({
          targets: s,
          alpha: { from: 0.12, to: 0.86 },
          duration: 750 + 100 * i,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
          delay: 120 * i,
        }));
    });
    [
      { x: 455, top: 320, bottom: 520 },
      { x: 1030, top: 290, bottom: 525 },
      { x: 1490, top: 335, bottom: 525 },
      { x: 2110, top: 300, bottom: 520 },
      { x: 2660, top: 285, bottom: 525 },
      { x: 3280, top: 320, bottom: 525 },
    ].forEach((t, i) => {
      this.add
        .rectangle(t.x, (t.top + t.bottom) / 2, 5, t.bottom - t.top, 4348013, 0.72)
        .setDepth(3.55)
        .setScrollFactor(0.28);
      const s = this.add
        .rectangle(
          t.x + 4,
          (t.top + t.bottom) / 2,
          2,
          t.bottom - t.top - 18,
          i % 2 == 0 ? e.accent : 16765038,
          0.16,
        )
        .setDepth(3.56)
        .setScrollFactor(0.28);
      for (let e = t.top + 15; e < t.bottom - 10; e += 38)
        this.add.rectangle(t.x, e, 14, 3, 7439255, 0.38).setDepth(3.57).setScrollFactor(0.28);
      this.motionReduced ||
        this.tweens.add({
          targets: s,
          alpha: { from: 0.06, to: 0.28 },
          duration: 1200 + 130 * i,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
          delay: 170 * i,
        });
    });
    [
      [570, 398],
      [1085, 380],
      [1515, 410],
      [1980, 390],
      [2490, 405],
      [3100, 385],
      [3630, 405],
    ].forEach(([t, i], s) => {
      const a = this.add
        .rectangle(t, i, 24, 3, s % 2 == 0 ? e.accent : 16765038, 0.18)
        .setDepth(3.58)
        .setScrollFactor(0.27);
      this.motionReduced ||
        this.tweens.add({
          targets: a,
          x: t + 24,
          alpha: { from: 0.05, to: 0.34 },
          duration: 2600 + 220 * s,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
          delay: 300 * s,
        });
    });
  }

  createWorldLandmarks() {
    // Warped City owns the visual environment. Keep this hook for gameplay compatibility.
  }

  createBrutalMapDetails() {
    // Warped City owns the visual environment. Keep this hook for gameplay compatibility.
  }

  createRouteLighting() {
    // Warped City owns the visual environment. Keep this hook for gameplay compatibility.
  }
  createPlayer() {
    ((this.player = this.physics.add
      .sprite(this.mission.spawn.x, this.mission.spawn.y, 'runner-idle')
      .setDepth(10)),
      (this.playerBodyConfig = {
        standing: { width: 28, height: 55, offsetX: 10, offsetY: 5 },
        crouching: { width: 28, height: 34, offsetX: 10, offsetY: 26 },
      }),
      (this.playerCrouched = !1),
      this.player.body
        .setSize(this.playerBodyConfig.standing.width, this.playerBodyConfig.standing.height)
        .setOffset(this.playerBodyConfig.standing.offsetX, this.playerBodyConfig.standing.offsetY)
        .setMaxVelocity(RUNNER_TUNING.maxRunSpeed, RUNNER_TUNING.maxFallSpeed)
        .setDragX(RUNNER_TUNING.groundDeceleration),
      this.player.setCollideWorldBounds(!0).play('runner-idle'),
      (this.playerVisualBaseScaleX = this.player.scaleX),
      (this.playerVisualBaseScaleY = this.player.scaleY),
      this.motionReduced ||
        (this.playerBreathTween = this.tweens.add({
          targets: this.player,
          alpha: { from: 0.985, to: 1 },
          duration: 620,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
        })));
    const e = this.add.circle(this.player.x, this.player.y, 18, 9303295, 0.08).setDepth(8);
    ((this.playerEnergyGlow = e),
      this.motionReduced ||
        this.tweens.add({
          targets: e,
          scale: { from: 0.82, to: 1.18 },
          alpha: { from: 0.05, to: 0.14 },
          duration: 620,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
        }));
    const t = this.time.addEvent({
      delay: 16,
      loop: !0,
      callback: () => {
        if (!this.player?.active || !e?.active) return (t.remove(), void e?.destroy());
        ((e.x = this.player.x), (e.y = this.player.y + 4));
        const i = Math.abs(this.player.body?.velocity?.x || 0),
          s = Phaser.Math.Clamp(i / RUNNER_TUNING.maxRunSpeed, 0, 1);
        ((e.alpha = this.motionReduced ? 0 : 0.05 + 0.1 * s),
          (e.scaleX = 0.9 + 0.18 * s),
          (e.scaleY = 0.9 + 0.1 * s));
      },
    });
    ((this.playerEnergyFollow = t),
      this.physics.add.collider(this.player, this.platforms, (e, t) => {
        if (this.scene.isActive())
          try {
            this.handlePlatformLanding(t);
          } catch (e) {
            console.error('[RunnerScene] Platform landing error:', e);
          }
      }),
      (this.blaster = this.add
        .sprite(this.player.x + 22, this.player.y + 4, 'blaster')
        .setDepth(11)));
    const i = this.input?.keyboard;
    (i
      ? ((i.enabled = !0),
        (this.cursors = i.createCursorKeys()),
        (this.keys = i.addKeys('A,D,C,F,W,S,E,Q,R,X,SPACE,SHIFT,ONE,TWO,THREE,FOUR,ESC')),
        (this.input.keyboard.enabled = !0))
      : console.error('[RELAY INPUT] Phaser keyboard plugin unavailable.'),
      (this.keys && this.cursors) ||
        (console.error('[RunnerScene] Keyboard input is unavailable; gameplay update disabled.'),
        (this.keys = {
          A: { isDown: !1 },
          D: { isDown: !1 },
          C: { isDown: !1 },
          F: { isDown: !1 },
          W: { isDown: !1 },
          S: { isDown: !1 },
          E: { isDown: !1 },
          Q: { isDown: !1 },
          R: { isDown: !1 },
          X: { isDown: !1 },
          SPACE: { isDown: !1 },
          SHIFT: { isDown: !1 },
          ONE: { isDown: !1 },
          TWO: { isDown: !1 },
          THREE: { isDown: !1 },
          FOUR: { isDown: !1 },
          ESC: { isDown: !1 },
        }),
        (this.cursors = {
          left: { isDown: !1 },
          right: { isDown: !1 },
          up: { isDown: !1 },
          down: { isDown: !1 },
        })),
      this.keys &&
        ((this.keys.A.enabled = !0),
        (this.keys.D.enabled = !0),
        (this.keys.W.enabled = !0),
        (this.keys.S.enabled = !0),
        (this.keys.SPACE.enabled = !0),
        (this.keys.SHIFT.enabled = !0),
        (this.keys.E.enabled = !0),
        (this.keys.Q.enabled = !0),
        (this.keys.R.enabled = !0),
        (this.keys.X.enabled = !0)),
      (this.flightMode = !1),
      (this.flightSpeed = 420),
      this.input?.keyboard && (this.input.keyboard.enabled = !0),
      (this.rawKeyboardState = Object.create(null)),
      (this.rawKeyboardPressed = Object.create(null)),
      (this.rawKeyboardReleased = Object.create(null)),
      (this.rawKeyboardDownHandler = (e) => {
        const t = e?.code;
        if (
          'KeyW' !== t &&
          'KeyA' !== t &&
          'KeyS' !== t &&
          'KeyD' !== t &&
          'KeyE' !== t &&
          'KeyF' !== t &&
          'KeyQ' !== t &&
          'KeyR' !== t &&
          'KeyX' !== t &&
          'Space' !== t &&
          'ShiftLeft' !== t &&
          'ShiftRight' !== t
        )
          return;
        ((this.rawKeyboardState[t] = !0),
          e.repeat || (this.rawKeyboardPressed[t] = !0),
          !this.cinematicActive ||
            ('KeyW' !== t && 'KeyA' !== t && 'KeyS' !== t && 'KeyD' !== t) ||
            this.cinematicSkipHandler?.());
        const i = e.target?.tagName?.toUpperCase();
        !this.scene.isActive() ||
          this.finished ||
          this.respawning ||
          this.relayPuzzleActive ||
          'INPUT' === i ||
          'TEXTAREA' === i ||
          'SELECT' === i ||
          'BUTTON' === i ||
          e.preventDefault();
      }),
      (this.rawKeyboardUpHandler = (e) => {
        const t = e?.code;
        ('KeyW' !== t &&
          'KeyA' !== t &&
          'KeyS' !== t &&
          'KeyD' !== t &&
          'KeyE' !== t &&
          'KeyF' !== t &&
          'KeyQ' !== t &&
          'KeyR' !== t &&
          'KeyX' !== t &&
          'Space' !== t &&
          'ShiftLeft' !== t &&
          'ShiftRight' !== t) ||
          ((this.rawKeyboardState[t] = !1), (this.rawKeyboardReleased[t] = !0));
      }),
      (this.rawKeyboardBlurHandler = () => {
        (Object.keys(this.rawKeyboardState).forEach((e) => {
          this.rawKeyboardState[e] = !1;
        }),
          Object.keys(this.rawKeyboardPressed).forEach((e) => {
            this.rawKeyboardPressed[e] = !1;
          }),
          Object.keys(this.rawKeyboardReleased).forEach((e) => {
            this.rawKeyboardReleased[e] = !1;
          }));
      }),
      'undefined' != typeof window &&
        (window.addEventListener('keydown', this.rawKeyboardDownHandler, !0),
        window.addEventListener('keyup', this.rawKeyboardUpHandler, !0),
        window.addEventListener('blur', this.rawKeyboardBlurHandler)),
      (this.mobileActions = {
        jump: !1,
        jumpHeld: !1,
        jumpReleased: !1,
        fire: !1,
        sword: !1,
        dash: !1,
        crouch: !1,
        interact: !1,
        build1: !1,
        build2: !1,
        gadget1: !1,
        gadget2: !1,
        polarity: !1,
      }),
      (this.mobileDirection = null),
      (this.mobileActionHandler = (e) => {
        if (
          !(this.scale.height > this.scale.width) &&
          e &&
          this.scene.isActive() &&
          !this.relayPuzzleActive &&
          !this.finished &&
          !this.respawning &&
          !this.cinematicActive
        ) {
          if (((this.afkTimer = 0), 0 !== this.afkStage && this.clearAfkState(), 'build1' === e))
            return this.useBuild(0);
          if ('build2' === e) return this.useBuild(1);
          if ('gadget1' === e) return this.useGadget(0);
          if ('gadget2' === e) return this.useGadget(1);
          if ('polarity' !== e) {
            if ('crouch' !== e)
              return 'jump' === e
                ? ((this.mobileActions.jump = !0), void (this.mobileActions.jumpHeld = !0))
                : 'jumpRelease' === e
                  ? ((this.mobileActions.jumpReleased = !0),
                    void (this.mobileActions.jumpHeld = !1))
                  : void (
                      Object.prototype.hasOwnProperty.call(this.mobileActions, e) &&
                      (this.mobileActions[e] = !0)
                    );
            this.mobileActions.crouch = !this.mobileActions.crouch;
          } else this.breakPolarity();
        }
      }),
      (this.mobileMoveHandler = null),
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        (this.game.events.off('mobile-action', this.mobileActionHandler),
          this.afkFreezeFx &&
            Object.values(this.afkFreezeFx).forEach((e) => {
              e && (this.tweens.killTweensOf(e), e.active && e.destroy());
            }),
          (this.afkFreezeFx = null),
          Array.isArray(this.afkIceParticles) &&
            (this.afkIceParticles.forEach((e) => {
              e && (this.tweens.killTweensOf(e), e.active && e.destroy());
            }),
            (this.afkIceParticles = [])),
          (this.afkTimer = 0),
          (this.afkStage = 0),
          (this.mobileDirection = null),
          Object.keys(this.mobileActions).forEach((e) => {
            this.mobileActions[e] = !1;
          }));
      }),
      (this.cinematicActive = !1),
      this.createObjectiveHUD(),
      this.createDetectionHUD(),
      this.createPlayerStatusHUD(),
      this.createCombatHUD(),
      this.createMobilityHUD());
  }
  createRival() {
    if (!rivalAppearances[this.mission.id]) return;
    const e = this.add
      .sprite(this.mission.spawn.x + 80, this.mission.spawn.y - 64, 'runner-run-a')
      .setTint(12187135)
      .setAlpha(0.8)
      .setDepth(9);
    (this.tweens.add({
      targets: e,
      x: this.mission.spawn.x + 500,
      alpha: 0.2,
      duration: 1800,
      onComplete: () => e.destroy(),
    }),
      ('signal-storm' !== this.mission.id && 'final-relay' !== this.mission.id) ||
        [135, 190].forEach((e, t) => {
          const i = this.add
            .sprite(this.mission.spawn.x + e, this.mission.spawn.y - 64, 'runner-run-b')
            .setTint('final-relay' === this.mission.id ? 16765038 : 12162047)
            .setAlpha(0.45 - 0.12 * t)
            .setDepth(8);
          this.tweens.add({
            targets: i,
            x: i.x + 400,
            alpha: 0,
            duration: 2100 + 220 * t,
            onComplete: () => i.destroy(),
          });
        }));
  }
  createSignals() {
    ((this.signals = this.physics.add.group()),
      this.mission.signals.forEach(([e, t], i) => {
        const s = this.signals.create(e, t, 'signal').setImmovable(!0);
        (s.setData('id', i),
          s.body.setAllowGravity(!1).setCircle(17, 11, 11),
          s.setScale(0.9),
          this.motionReduced ||
            this.tweens.add({
              targets: s,
              y: t - 9,
              scale: { from: 0.86, to: 1.02 },
              duration: 720,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
            }));
      }),
      this.physics.add.overlap(
        this.player,
        this.signals,
        (e, t) => this.collectSignal(t),
        void 0,
        this,
      ));
  }
  createSecrets() {
    ((this.secrets = this.physics.add.group()),
      this.mission.secrets.forEach(([e, t], i) => {
        const s = this.secrets
          .create(e, t, 'signal')
          .setImmovable(!0)
          .setTint(9303295)
          .setScale(0.72)
          .setData('id', i);
        (s.body.setAllowGravity(!1).setCircle(17, 11, 11),
          this.motionReduced ||
            this.tweens.add({ targets: s, angle: 360, duration: 1800, repeat: -1 }));
      }),
      this.physics.add.overlap(
        this.player,
        this.secrets,
        (e, t) => this.collectSecret(t),
        void 0,
        this,
      ));
  }
  loadSurpriseProgress() {
    if ('undefined' != typeof window && window.localStorage)
      try {
        const e = window.localStorage.getItem('runner_surprise_progress');
        if (!e) return;
        const t = JSON.parse(e);
        if (t && 'object' == typeof t) {
          if (
            (Array.isArray(t.collectedCacheIds) &&
              (this.surpriseCollectedCacheIds = new Set(
                t.collectedCacheIds.filter((e) => 'string' == typeof e),
              )),
            t.inventory && 'object' == typeof t.inventory)
          )
            for (const e of Object.keys(this.surpriseInventory)) {
              const i = Number(t.inventory[e]);
              this.surpriseInventory[e] = Number.isFinite(i) ? Math.max(0, Math.floor(i)) : 0;
            }
          (t.pendingModifier &&
            'object' == typeof t.pendingModifier &&
            (this.surprisePendingModifier = t.pendingModifier),
            t.consumedMissionRewards &&
              'object' == typeof t.consumedMissionRewards &&
              (this.surpriseConsumedMissionRewards = t.consumedMissionRewards),
            (this.surpriseNegativeStreak = Number.isFinite(t.negativeStreak)
              ? Math.max(0, Math.floor(t.negativeStreak))
              : 0));
        }
      } catch (e) {
        console.warn('[SURPRISE] Failed to load progress:', e);
      }
  }
  saveSurpriseProgress() {
    if ('undefined' != typeof window && window.localStorage)
      try {
        window.localStorage.setItem(
          'runner_surprise_progress',
          JSON.stringify({
            collectedCacheIds: Array.from(this.surpriseCollectedCacheIds || []),
            inventory: this.surpriseInventory,
            pendingModifier: this.surprisePendingModifier,
            consumedMissionRewards: this.surpriseConsumedMissionRewards,
            negativeStreak: this.surpriseNegativeStreak,
          }),
        );
      } catch (e) {
        console.warn('[SURPRISE] Failed to save progress:', e);
      }
  }
  prepareSurpriseMission() {
    const e = String(this.mission?.id || 'unknown-mission');
    ((this.surpriseModifier = null), (this.surpriseShieldCharges = 0));
    Boolean(this.surpriseConsumedMissionRewards?.[e]) ||
      (this.surpriseInventory.shieldCore > 0 &&
        ((this.surpriseShieldCharges = 1), this.surpriseInventory.shieldCore--),
      this.surpriseInventory.overdriveCell > 0 &&
        ((this.overdriveTimer += 2500), this.surpriseInventory.overdriveCell--),
      this.surpriseInventory.energyPack > 0 &&
        ((this.energy = Math.min(this.energyMax, this.energy + 25)),
        this.surpriseInventory.energyPack--),
      (this.surpriseConsumedMissionRewards[e] = !0));
    const t = this.surprisePendingModifier;
    (t &&
      (t.targetMissionId === e || (!t.targetMissionId && t.sourceMissionId !== e)) &&
      ((this.surpriseModifier = { ...t }), (this.surprisePendingModifier = null)),
      this.saveSurpriseProgress());
  }
  createSurpriseCache() {
    const e = String(this.mission?.id || 'unknown-mission');
    if (
      ((this.surpriseCacheId = `${e}-surprise-cache-01`),
      this.surpriseCollectedCacheIds?.has(this.surpriseCacheId))
    )
      return;
    const t = Array.isArray(this.mission?.platforms) ? this.mission.platforms : [],
      i =
        (Number(this.mission?.spawn?.x) || 0) +
        ((Number(this.mission?.goal?.x) || (Number(this.mission?.spawn?.x) || 0) + 1200) -
          (Number(this.mission?.spawn?.x) || 0)) /
          2;
    let s = null,
      a = 1 / 0;
    t.forEach((e) => {
      if (!Array.isArray(e) || e.length < 4) return;
      const t = Number(e[0]) || 0,
        l = Number(e[1]) || 0,
        r = Math.max(20, Number(e[2]) || 20);
      if (Boolean(e[5])) return;
      const o = t + r / 2,
        n = Math.abs(o - i);
      n < a && ((a = n), (s = { x: o, y: l, width: r }));
    });
    const l = s?.x ?? i,
      r = s ? s.y - 46 : (Number(this.mission?.spawn?.y) || 420) - 46;
    ((this.surpriseCache = this.add
      .sprite(l, r, 'signal')
      .setScale(0.9)
      .setTint(12162047)
      .setDepth(14)),
      this.physics.add.existing(this.surpriseCache),
      this.surpriseCache.body?.setAllowGravity(!1),
      this.surpriseCache.body?.setCircle(18, 10, 10),
      this.surpriseCache.setData('cacheId', this.surpriseCacheId),
      this.surpriseCache.setData('opened', !1),
      this.motionReduced ||
        this.tweens.add({
          targets: this.surpriseCache,
          angle: 360,
          scale: { from: 0.88, to: 1.02 },
          duration: 1500,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
        }),
      (this.surpriseCachePrompt = this.add
        .container(l, r - 58)
        .setDepth(80)
        .setVisible(!1)));
    const o = this.add.rectangle(0, 0, 156, 34, 464421, 0.96).setStrokeStyle(1.5, 12162047, 0.92),
      n = this.add
        .text(0, 0, 'R / TAP TO OPEN', {
          fontFamily: 'Orbitron',
          fontSize: '11px',
          color: '#f1e6ff',
          stroke: '#08101c',
          strokeThickness: 3,
        })
        .setOrigin(0.5);
    this.surpriseCachePrompt.add([o, n]);
  }
  updateSurpriseCacheInteraction() {
    const e = this.surpriseCache;
    if (
      !e ||
      !e.active ||
      this.finished ||
      this.respawning ||
      this.surpriseCacheCollected ||
      this.surpriseCacheOpen
    )
      return void this.surpriseCachePrompt?.setVisible(!1);
    if (!this.player?.active) return;
    const t = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y) <= 120;
    if ((this.surpriseCachePrompt?.setVisible(t), !t)) return;
    const i = Phaser.Input.Keyboard.JustDown(this.keys.R),
      s = this.mobileActions.interact;
    if (i || s) {
      if (
        ((this.mobileActions.interact = !1),
        this.surpriseCacheInteractionLocked ||
          this.surpriseCacheCollected ||
          this.surpriseCacheOpen ||
          this.relayPuzzleActive ||
          this.cinematicActive ||
          this.afkCryostasisActive ||
          this.finished ||
          this.respawning)
      )
        return;
      this.tryOpenSurpriseCache();
    }
  }
  tryOpenSurpriseCache() {
    this.surpriseCacheInteractionLocked ||
      this.surpriseCacheCollected ||
      this.surpriseCacheOpen ||
      this.relayPuzzleActive ||
      this.cinematicActive ||
      this.afkCryostasisActive ||
      this.finished ||
      this.respawning ||
      this.physics?.world?.isPaused ||
      !this.surpriseCache?.active ||
      !this.player?.active ||
      this.openSurpriseCache();
  }
  openSurpriseCache() {
    const e = this.surpriseCache;
    if (
      !e ||
      !e.active ||
      !this.player?.active ||
      this.surpriseCacheOpen ||
      this.surpriseCacheInteractionLocked ||
      this.surpriseCacheCollected ||
      this.relayPuzzleActive ||
      this.cinematicActive ||
      this.afkCryostasisActive ||
      this.respawning ||
      this.finished
    )
      return;
    if (Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y) > 120) return;
    ((this.surpriseCacheOpen = !0),
      (this.surpriseCacheInteractionLocked = !0),
      this.surpriseCacheSession++);
    const t = this.surpriseCacheSession;
    if (
      (e.setData('opened', !0),
      e.disableBody(!0, !0),
      this.surpriseCachePrompt?.setVisible(!1),
      this.playerCue('UNKNOWN SIGNAL · DECRYPTING', '#b993ff'),
      !this.motionReduced)
    ) {
      const t = this.add
          .circle(e.x, e.y, 12, 12162047, 0.28)
          .setDepth(16)
          .setStrokeStyle(2, 14723071, 0.95),
        i = this.add
          .circle(e.x, e.y, 24, 12162047, 0.05)
          .setDepth(15)
          .setStrokeStyle(1, 14723071, 0.75),
        s = this.add.circle(e.x, e.y, 6, 16777215, 0.95).setDepth(17);
      (this.tweens.add({
        targets: t,
        scale: 5.2,
        alpha: 0,
        duration: 620,
        ease: 'Quad.out',
        onComplete: () => {
          t?.active && t.destroy();
        },
      }),
        this.tweens.add({
          targets: i,
          scale: 4.2,
          alpha: 0,
          duration: 780,
          ease: 'Cubic.out',
          onComplete: () => {
            i?.active && i.destroy();
          },
        }),
        this.tweens.add({
          targets: s,
          scale: 3.8,
          alpha: 0,
          duration: 260,
          ease: 'Quad.out',
          onComplete: () => {
            s?.active && s.destroy();
          },
        }),
        this.cameras.main.flash(90, 185, 147, 255, !1),
        this.worldLightFlash(12162047, 0.1, 180),
        this.gadgetPulse(12162047, 18, 360),
        this.shake(65, 0.003));
    }
    this.time.delayedCall(650, () => {
      this.surpriseCacheSession === t && this.resolveSurpriseCache();
    });
  }
  resolveSurpriseCache() {
    if (this.surpriseCacheResolved) return;
    ((this.surpriseCacheResolved = !0),
      (this.surpriseCacheCollected = !0),
      this.surpriseCollectedCacheIds.add(this.surpriseCacheId));
    let e,
      t = Math.random();
    (this.surpriseNegativeStreak >= 2 && (t = 0.05),
      (e = t < 0.55 ? 'positive' : t < 0.75 ? 'neutral' : 'negative'));
    const i =
        'positive' === e
          ? ['shieldCore', 'overdriveCell', 'energyPack']
          : 'neutral' === e
            ? ['credits']
            : ['corruptedCore', 'energyDrain'],
      s = i[Phaser.Math.Between(0, i.length - 1)];
    ('negative' === e ? this.surpriseNegativeStreak++ : (this.surpriseNegativeStreak = 0),
      'shieldCore' === s && this.surpriseInventory.shieldCore++,
      'overdriveCell' === s && this.surpriseInventory.overdriveCell++,
      'energyPack' === s && this.surpriseInventory.energyPack++,
      'credits' === s && (this.surpriseInventory.credits += 100),
      'corruptedCore' === s &&
        (this.surprisePendingModifier = {
          id: 'corruptedCore',
          sourceMissionId: String(this.mission?.id || 'unknown-mission'),
          targetMissionId: String(this.mission?.nextMissionId || '') || null,
          movementMultiplier: 0.92,
        }),
      'energyDrain' === s && (this.energy = Math.max(0, this.energy - 30)),
      'corruptedCore' === s && this.playerCue('CORRUPTED CACHE', '#ff826e'),
      this.saveSurpriseProgress(),
      this.showSurpriseOutcome(e, s));
  }
  showSurpriseOutcome(e, t) {
    const i =
        'positive' === e
          ? 'REWARD ACQUIRED'
          : 'neutral' === e
            ? 'DATA RECOVERED'
            : 'SYSTEM COMPROMISED',
      s = 'positive' === e ? 9303295 : 'neutral' === e ? 16765038 : 16733028,
      a = `#${s.toString(16).padStart(6, '0')}`,
      l = this.cameras.main,
      r = l.width / 2,
      o = l.height / 2;
    !this.motionReduced &&
      this.graphicsLevel >= 2 &&
      (l.flash(120, 255, 255, 255, !1),
      this.worldLightFlash(s, 0.12, 220),
      this.shake('negative' === e ? 150 : 95, 'negative' === e ? 0.008 : 0.004),
      this.gadgetPulse(s, 'positive' === e ? 20 : 15, 'negative' === e ? 520 : 420));
    const n = this.add.container(r, o).setScrollFactor(0).setDepth(250),
      h = this.add.rectangle(0, 0, l.width + 80, l.height + 80, 132619, 0.72);
    n.add(h);
    const d = this.add.rectangle(0, 0, 360, 200, 397597, 0.98).setStrokeStyle(2, s, 0.98);
    n.add(d);
    const c = this.add.rectangle(0, 0, 336, 176, 0, 0).setStrokeStyle(1, s, 0.42);
    n.add(c);
    const y = this.add.rectangle(0, -83, 320, 2, s, 0.72);
    n.add(y);
    const p = this.add
      .text(0, -61, i, {
        fontFamily: 'Orbitron',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center',
      })
      .setOrigin(0.5);
    n.add(p);
    const f = this.add
      .text(0, -34, 'UNKNOWN SIGNAL', {
        fontFamily: 'Orbitron',
        fontSize: '9px',
        letterSpacing: 2,
        color: a,
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    n.add(f);
    const u = this.add.circle(0, 8, 28, s, 0.08).setStrokeStyle(2, s, 0.68),
      m = this.add.circle(0, 8, 19, s, 0.14).setStrokeStyle(1, s, 0.82),
      g = this.add.circle(0, 8, 9, s, 0.92).setStrokeStyle(2, 16777215, 0.9),
      S = this.add.circle(-2, 6, 3, 16777215, 0.96);
    n.add([u, m, g, S]);
    const w = this.add
      .text(
        0,
        54,
        {
          shieldCore: 'SHIELD CORE',
          overdriveCell: 'OVERDRIVE CELL',
          energyPack: 'ENERGY PACK',
          credits: '100 CREDITS',
          corruptedCore: 'CORRUPTED CORE',
          energyDrain: 'ENERGY DRAIN',
        }[t] || t.toUpperCase(),
        {
          fontFamily: 'Orbitron',
          fontSize: 'credits' === t ? '18px' : '21px',
          fontStyle: 'bold',
          color: a,
          stroke: '#000000',
          strokeThickness: 5,
          align: 'center',
          wordWrap: { width: 300 },
        },
      )
      .setOrigin(0.5);
    n.add(w);
    const x = this.add
      .text(
        0,
        79,
        {
          shieldCore: 'ONE FREE DAMAGE HIT',
          overdriveCell: '+2500 OVERDRIVE AT NEXT MISSION START',
          energyPack: '+25 ENERGY AT NEXT MISSION START',
          credits: 'STORED IN PROFILE',
          corruptedCore: 'NEXT MISSION · -8% MOVE SPEED',
          energyDrain: '-30 ENERGY NOW',
        }[t] || '',
        {
          fontFamily: 'Orbitron',
          fontSize: '9px',
          color: '#dffcff',
          stroke: '#000000',
          strokeThickness: 3,
          align: 'center',
          wordWrap: { width: 290 },
        },
      )
      .setOrigin(0.5);
    n.add(x);
    const b = this.add.rectangle(-173, 0, 3, 90, s, 0.9),
      C = this.add.rectangle(173, 0, 3, 90, s, 0.9);
    n.add([b, C]);
    const R = [];
    for (let e = 0; e < 5; e++) {
      const t = this.add.rectangle(0, 32 * e - 64, 300, 1, s, 0.18);
      (R.push(t), n.add(t));
    }
    const k = [];
    [
      [-158, -82],
      [158, -82],
      [-158, 82],
      [158, 82],
    ].forEach(([e, t]) => {
      const i = this.add.circle(e, t, 3, s, 0.95);
      (k.push(i), n.add(i));
    });
    const D = [];
    for (let e = 0; e < 8; e++) {
      const e = this.add.rectangle(
        Phaser.Math.Between(-145, 145),
        Phaser.Math.Between(-72, 72),
        Phaser.Math.Between(8, 34),
        Phaser.Math.Between(2, 5),
        s,
        0.18,
      );
      (D.push(e), n.add(e));
    }
    (n.setScale(this.motionReduced ? 1 : 0.72),
      n.setAlpha(this.motionReduced ? 1 : 0),
      this.motionReduced ||
        (this.tweens.add({ targets: n, alpha: 1, scale: 1, duration: 260, ease: 'Back.out' }),
        this.tweens.add({
          targets: u,
          scale: 1.45,
          alpha: 0.05,
          duration: 520,
          yoyo: !0,
          repeat: 2,
          ease: 'Sine.inOut',
        }),
        this.tweens.add({
          targets: m,
          scale: 1.3,
          alpha: 0.06,
          duration: 420,
          yoyo: !0,
          repeat: 3,
          ease: 'Sine.inOut',
        }),
        this.tweens.add({
          targets: g,
          scale: 1.35,
          duration: 260,
          yoyo: !0,
          repeat: 3,
          ease: 'Sine.inOut',
        }),
        R.forEach((e, t) => {
          this.tweens.add({
            targets: e,
            x: t % 2 ? 12 : -12,
            alpha: 0.52,
            duration: 180 + 50 * t,
            yoyo: !0,
            repeat: 4,
            ease: 'Sine.inOut',
          });
        }),
        D.forEach((e) => {
          this.tweens.add({
            targets: e,
            alpha: 0.55,
            x: e.x + Phaser.Math.Between(-8, 8),
            duration: Phaser.Math.Between(70, 150),
            yoyo: !0,
            repeat: 3,
          });
        }),
        this.tweens.add({
          targets: w,
          scale: 1.08,
          duration: 190,
          delay: 120,
          yoyo: !0,
          ease: 'Quad.out',
        })));
    const v = this.motionReduced ? 2200 : 3200;
    this.time.delayedCall(v, () => {
      n?.active &&
        (this.motionReduced
          ? n.destroy(!0)
          : this.tweens.add({
              targets: n,
              alpha: 0,
              scale: 0.94,
              duration: 360,
              ease: 'Quad.in',
              onComplete: () => {
                n?.active && n.destroy(!0);
              },
            }));
    });
  }
  createCheckpoints() {
    ((this.checkpoints = this.physics.add.staticGroup()),
      this.mission.checkpoints.forEach(([e, t], i) => {
        this.checkpoints
          .create(e, t, 'checkpoint')
          .setOrigin(0.5, 1)
          .setData('index', i)
          .refreshBody();
      }),
      this.physics.add.overlap(
        this.player,
        this.checkpoints,
        (e, t) => this.activateCheckpoint(t),
        void 0,
        this,
      ));
  }
  safeCheckpointSpawn(e) {
    const t = this.mission.platforms.map(([e, t, i, s]) => ({ x: e, y: t, width: i, height: s }));
    if (!t.length) return { x: e, y: this.mission.spawn?.y ?? 0 };
    const i = t
        .filter((t) => e >= t.x + 26 && e <= t.x + t.width - 26)
        .sort((e, t) => e.y - t.y)[0],
      s =
        i ||
        t.reduce(
          (t, i) => (Math.abs(i.x + i.width / 2 - e) < Math.abs(t.x + t.width / 2 - e) ? i : t),
          t[0],
        ),
      a = Math.min(30, Math.max(0, (s.width - 1) / 2));
    return { x: Phaser.Math.Clamp(e, s.x + a, s.x + s.width - a), y: s.y - 46 };
  }
  updateCheckpointArrow() {
    if (
      this.finished ||
      this.respawning ||
      this.cinematicActive ||
      !this.player?.active ||
      !this.checkpoints
    )
      return void this.checkpointArrow?.setVisible(!1);
    const e = this.checkpoint?.index ?? -1;
    let t = null;
    if (
      (this.platformEmergencyTarget?.active &&
        !1 !== this.platformEmergencyTarget.body?.enable &&
        (t = this.platformEmergencyTarget),
      !t)
    ) {
      const i = this.checkpoints
        .getChildren()
        .filter((t) => t?.active && (t.getData('index') ?? -1) > e)
        .sort((e, t) => (e.getData('index') ?? 0) - (t.getData('index') ?? 0));
      i.length ? (t = i[0]) : this.goal && (t = this.goal);
    }
    if (!t) return void this.checkpointArrow?.setVisible(!1);
    this.checkpointArrow ||
      ((this.checkpointArrow = this.add
        .triangle(0, 0, 0, -16, 11, 10, -11, 10, 9303295, 0.95)
        .setOrigin(0.5)
        .setDepth(50)
        .setScrollFactor(0)),
      this.checkpointArrow.setStrokeStyle(1.5, 15269375, 0.95),
      this.checkpointArrow.setBlendMode(Phaser.BlendModes.ADD),
      this.tweens.add({
        targets: this.checkpointArrow,
        scaleX: { from: 0.94, to: 1.06 },
        scaleY: { from: 0.94, to: 1.06 },
        alpha: { from: 0.82, to: 1 },
        duration: 620,
        yoyo: !0,
        repeat: -1,
        ease: 'Sine.inOut',
      }));
    const i = this.cameras.main,
      s = t.x - this.player.x,
      a = t.y - this.player.y,
      l = Math.hypot(s, a);
    if (!Number.isFinite(l) || l < 1) return void this.checkpointArrow.setVisible(!1);
    const r = s / l,
      o = a / l,
      n = Math.atan2(o, r) + Math.PI / 2,
      h = Number.isFinite(this.checkpointArrow.angle) ? this.checkpointArrow.angle : n,
      d = h + 0.2 * Phaser.Math.Angle.Wrap(n - h),
      c = l < 165 ? 46 : 54;
    let y = (this.player.x - i.worldView.x) * i.zoom + r * c,
      p = (this.player.y - i.worldView.y) * i.zoom + o * c;
    ((y = Phaser.Math.Clamp(y, 30, this.scale.width - 30)),
      (p = Phaser.Math.Clamp(p, 30, this.scale.height - 30)),
      this.checkpointArrow
        .setPosition(
          Phaser.Math.Linear(this.checkpointArrow.x, y, 0.24),
          Phaser.Math.Linear(this.checkpointArrow.y, p, 0.24),
        )
        .setRotation(d)
        .setVisible(!0));
  }
  updateRouteHints() {
    if (
      (this.checkpoints?.getChildren().forEach((e) => {
        const t = e.getData('index');
        if (
          !this.checkpointHints.has(t) &&
          Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y) < 165
        ) {
          this.checkpointHints.add(t);
          const i = this.add.circle(e.x, e.y - 20, 10, 9303295, 0.35).setDepth(6);
          if (!this.motionReduced) {
            const t = this.add.circle(e.x, e.y - 20, 18, 9303295, 0.08).setDepth(5);
            (t.setStrokeStyle(2, 12187135, 0.78),
              this.tweens.add({
                targets: t,
                scale: 3.8,
                alpha: 0,
                duration: 620,
                ease: 'Quad.out',
                onComplete: () => t.destroy(),
              }));
            const i = this.add.rectangle(e.x, e.y - 54, 4, 62, 9303295, 0.16).setDepth(5);
            this.tweens.add({
              targets: i,
              scaleX: 2.4,
              alpha: 0,
              duration: 480,
              ease: 'Sine.out',
              onComplete: () => i.destroy(),
            });
          }
          (this.tweens.add({
            targets: i,
            scale: 3,
            alpha: 0,
            duration: 420,
            onComplete: () => i.destroy(),
          }),
            this.playerCue('CHECKPOINT // NEAR', '#b9f5ff'),
            this.game.events.emit('feedback', 'checkpoint_near'));
        }
      }),
      !this.goalHintShown && this.player.x >= this.goal.x - 520)
    ) {
      this.goalHintShown = !0;
      const e = this.add.circle(this.goal.x + 20, this.goal.y + 22, 18, 16765038, 0.3).setDepth(11);
      (this.tweens.add({
        targets: e,
        scale: 4,
        alpha: 0,
        duration: 550,
        onComplete: () => e.destroy(),
      }),
        this.playerCue('DELIVERY BEACON NEAR', '#ffd06e'),
        this.gadgetPulse(16765038, 10, 320));
    }
  }
  createHazards() {
    ((this.barriers = this.physics.add.staticGroup()),
      this.mission.obstacles.forEach(([e, t]) => {
        this.barriers.create(e + 24, t + 32, 'barrier');
      }),
      this.physics.add.overlap(
        this.player,
        this.barriers,
        (e, t) => {
          if (!e?.active || !t?.active) return;
          if (this.respawning || this.finished) return;
          if (t.__relayBarrierContactLock) return;
          t.__relayBarrierContactLock = !0;
          (this.tryVault() || this.fail('A live barrier cut the delivery short.'),
            this.time.delayedCall(220, () => {
              t?.active && (t.__relayBarrierContactLock = !1);
            }));
        },
        void 0,
        this,
      ));
  }
  triggerPlayerWaterRipple(e, t, i = 1) {
    const s = Number.isFinite(this.graphicsLevel) ? this.graphicsLevel : 2;
    if (this.motionReduced || s < 2 || !e?.active || !t?.active || this.finished || this.respawning)
      return;
    this.waterWaveObjects || (this.waterWaveObjects = []);
    const a = t.y - t.height / 2,
      l = Math.abs(e.body?.velocity?.x || 0),
      r = Phaser.Math.Clamp(l / RUNNER_TUNING.maxRunSpeed, 0, 1),
      o = Phaser.Math.Clamp(i * (0.45 + 0.55 * r), 0.35, 1.25),
      n = t.width / 2,
      h = Phaser.Math.Clamp(e.x, t.x - n + 12, t.x + n - 12),
      d = this.add
        .ellipse(h, a + 2, 30 + 26 * o, 5 + 3 * o, 15269375, 0.34)
        .setDepth(9)
        .setAlpha(0.28 + 0.16 * o),
      c = this.add
        .ellipse(h, a, 18 + 24 * o, 4 + 2 * o, 9303295, 0.24)
        .setDepth(9)
        .setAlpha(0.22 + 0.14 * o);
    (this.waterWaveObjects.push(d, c),
      this.tweens.add({
        targets: d,
        scaleX: 2.1 + 1.4 * o,
        scaleY: 1.5 + 0.5 * o,
        alpha: 0,
        duration: 260 + 100 * o,
        ease: 'Quad.out',
      }),
      this.tweens.add({
        targets: c,
        scaleX: 2.4 + 1.2 * o,
        alpha: 0,
        duration: 220 + 90 * o,
        ease: 'Sine.out',
        onComplete: () => {
          (d?.destroy?.(),
            c?.destroy?.(),
            Array.isArray(this.waterWaveObjects) &&
              (this.waterWaveObjects = this.waterWaveObjects.filter((e) => e && e.active)));
        },
      }));
  }
  createWaterHazards() {
    this.waterZones = this.physics.add.staticGroup();
    const e = 720,
      t = 140,
      i = Math.max(Number(this.worldWidth) || 6400, Number(this.mission?.goal?.x) || 6400) + 400,
      s =
        (this.add.rectangle(i / 2, 790, i, t, 408422, 0.96).setDepth(1),
        this.add.rectangle(i / 2, 762, i, 70, 556708, 0.32).setDepth(2)),
      a = this.add.rectangle(i / 2, e, i, 12, 5826559, 0.92).setDepth(8),
      l = this.add.rectangle(i / 2, 717, i, 4, 14679295, 0.72).setDepth(10),
      r = this.add
        .rectangle(i / 2, 790, i, t, 0, 0)
        .setAlpha(0)
        .setDepth(0);
    (this.physics.add.existing(r, !0),
      r.setData('index', -1),
      r.setData('used', !1),
      this.waterZones.add(r),
      (this.oceanAmbientShark = null),
      (this.oceanAmbientSharkTween = null));
    const o = Math.max(420, Number(this.player?.x) || 520) + 260,
      n = this.add.image(o, 762, 'shark').setDepth(30).setScale(1.35).setAlpha(0.96).setVisible(!0);
    this.oceanAmbientShark = n;
    const h = { t: 0 },
      d = o + 170;
    ((this.startAmbientSharkSwim = () => {
      n?.active &&
        (this.oceanAmbientSharkTween &&
          (this.oceanAmbientSharkTween.stop(), (this.oceanAmbientSharkTween = null)),
        (h.t = 0),
        n.setVisible(!0).setActive(!0).setAlpha(0.96).setScale(1.35).setAngle(0),
        (this.oceanAmbientSharkTween = this.tweens.add({
          targets: h,
          t: 1,
          duration: 6200,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
          onUpdate: () => {
            if (!n.active) return;
            const e = h.t * Math.PI * 2,
              t = d + 340 * Math.sin(e),
              i = 762 + 18 * Math.sin(2 * e),
              s = Math.cos(e) >= 0;
            n.setFlipX(!s);
            const a = 6 * Math.sin(2 * e);
            n.setAngle(s ? a : -a);
            const l = 1.35 + 0.025 * Math.sin(4 * e);
            n.setPosition(t, i).setScale(l);
          },
        })));
    }),
      this.startAmbientSharkSwim(),
      this.motionReduced ||
        (this.tweens.add({
          targets: a,
          alpha: { from: 0.65, to: 1 },
          scaleX: 1.01,
          duration: 900,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
        }),
        this.tweens.add({
          targets: l,
          alpha: { from: 0.28, to: 0.88 },
          duration: 720,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
        }),
        this.tweens.add({
          targets: s,
          alpha: { from: 0.18, to: 0.42 },
          duration: 1200,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
        })),
      this.mission.waterZones.forEach(([e, t, i, s], a) => {
        const l = this.add
          .rectangle(e + i / 2, t + s / 2, i, s, 556708, 0.82)
          .setStrokeStyle(3, 5826559, 0.95)
          .setDepth(4);
        (this.physics.add.existing(l, !0),
          l.setData('index', a),
          l.setData('used', !1),
          this.waterZones.add(l));
        const r = this.add
            .rectangle(e + i / 2, t + 5, i, 14, 5826559, 0.95)
            .setStrokeStyle(2, 12187135, 0.9)
            .setDepth(12),
          o = this.add.rectangle(e + i / 2, t + 20, i - 6, 18, 556708, 0.48).setDepth(11);
        if (
          (this.tweens.add({
            targets: o,
            alpha: { from: 0.28, to: 0.58 },
            duration: 720,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
          }),
          this.motionReduced ||
            this.tweens.add({
              targets: r,
              scaleX: 1.03,
              alpha: 0.55,
              duration: 620,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
            }),
          !this.motionReduced)
        )
          for (let s = e + 18; s < e + i - 18; s += 44) {
            const e = this.add.rectangle(s, t + 8, 20, 2, 12187135, 0.28).setDepth(6);
            this.tweens.add({
              targets: e,
              x: e.x + 18,
              alpha: 0,
              duration: 700,
              delay: 90 * a,
              repeat: -1,
              ease: 'Sine.out',
              onRepeat: () => {
                e.active && ((e.x = s), (e.alpha = 0.28));
              },
            });
          }
      }),
      this.physics.add.overlap(
        this.player,
        this.waterZones,
        (e, t) => {
          if (!e?.active || !t?.active) return;
          if (this.afkCryostasisActive) return;
          if (this.finished || this.respawning || this.waterAttackActive || t.getData('used'))
            return;
          (this.triggerPlayerWaterRipple(e, t, 1),
            t.setData('used', !0),
            (this.waterAttackActive = !0),
            (this.waterDeathTimer = 1120));
          const i = ++this.waterAttackToken,
            s = t.y - t.height / 2,
            a = e.x,
            l = e?.body;
          if (!l) return void (this.waterAttackActive = !1);
          (l.setVelocityY(Math.min(l.velocity.y, 140)),
            l.setVelocityX(0.22 * l.velocity.x),
            this.playerCue('SHARK INCOMING', '#b9f5ff'),
            this.game.events.emit('feedback', 'water_hazard'));
          const r = this.add
              .text(a, s - 52, '⚠ SHARK INCOMING', {
                fontFamily: 'Orbitron',
                fontSize: '11px',
                color: '#b9f5ff',
                stroke: '#06131f',
                strokeThickness: 4,
                fontStyle: 'bold',
                align: 'center',
              })
              .setOrigin(0.5)
              .setDepth(14),
            o = this.add
              .triangle(a + 96, s + 8, 0, 24, 18, 0, 36, 24, 1587019, 0.95)
              .setDepth(10)
              .setAlpha(0),
            n = this.add.circle(a + 86, s + 20, 2, 16765038, 0).setDepth(10),
            h = this.add.circle(a + 96, s + 20, 2, 16765038, 0).setDepth(10),
            d = this.add
              .ellipse(a + 96, s + 5, 74, 12, 12187135, 0.16)
              .setDepth(7)
              .setAlpha(0),
            c = this.add.circle(a, s, 10, 12187135, 0.55).setDepth(12),
            y = this.add
              .ellipse(a, s + 2, 34, 8, 5826559, 0.34)
              .setDepth(11)
              .setScale(0.55),
            p = this.add
              .ellipse(a - 24 * (e.flipX ? -1 : 1), s + 6, 54, 7, 12187135, 0.24)
              .setDepth(9)
              .setAlpha(0);
          (this.tweens.add({
            targets: c,
            scale: 4.6,
            alpha: 0,
            duration: 420,
            ease: 'Cubic.out',
            onComplete: () => {
              c.active && c.destroy();
            },
          }),
            this.tweens.add({
              targets: y,
              scaleX: 2.8,
              scaleY: 1.45,
              alpha: 0,
              duration: 460,
              ease: 'Sine.out',
              onComplete: () => {
                y.active && y.destroy();
              },
            }),
            this.tweens.add({
              targets: p,
              alpha: { from: 0, to: 0.5 },
              scaleX: 1.8,
              scaleY: 1.15,
              x: p.x - 42 * (e.flipX ? -1 : 1),
              duration: 260,
              ease: 'Quad.out',
              onComplete: () => {
                p.active && p.destroy();
              },
            }),
            this.motionReduced
              ? (r.destroy(), o.destroy(), n.destroy(), h.destroy(), d.destroy())
              : (this.tweens.add({
                  targets: r,
                  alpha: { from: 1, to: 0.22 },
                  yoyo: !0,
                  repeat: 2,
                  duration: 120,
                  ease: 'Sine.inOut',
                  onComplete: () => {
                    r.active && r.destroy();
                  },
                }),
                this.tweens.add({
                  targets: o,
                  alpha: { from: 0, to: 0.95 },
                  x: a + 72,
                  y: s + 4,
                  duration: 250,
                  ease: 'Quad.out',
                }),
                this.tweens.add({
                  targets: [n, h],
                  alpha: { from: 0, to: 0.95 },
                  duration: 180,
                  delay: 90,
                }),
                this.tweens.add({
                  targets: d,
                  alpha: { from: 0, to: 'signal-storm' === this.mission.id ? 0.62 : 0.46 },
                  scaleX: 'signal-storm' === this.mission.id ? 1.75 : 1.45,
                  scaleY: 'signal-storm' === this.mission.id ? 1.18 : 1,
                  x: d.x - (e.flipX ? -1 : 1) * ('signal-storm' === this.mission.id ? 54 : 38),
                  duration: 'signal-storm' === this.mission.id ? 320 : 270,
                  ease: 'Cubic.out',
                })));
          const f = () => {
            if (
              !this.scene.isActive() ||
              !e.active ||
              !t.active ||
              this.finished ||
              this.respawning ||
              !this.waterAttackActive ||
              this.waterAttackToken !== i
            )
              return;
            (this.activeShark?.destroy(),
              (this.activeShark = null),
              o.destroy(),
              n.destroy(),
              h.destroy(),
              d.destroy());
            const l = e.flipX ? -1 : 1,
              f = Number(t.getData('index')),
              u = Number.isFinite(f) ? ((f % 2) + 2) % 2 : 0,
              m = a + l * (0 === u ? 82 : 118),
              g = a,
              S = a + l * (0 === u ? 126 : 164);
            this.oceanAmbientSharkTween &&
              (this.oceanAmbientSharkTween.stop(), (this.oceanAmbientSharkTween = null));
            const w =
              this.oceanAmbientShark || this.add.image(S + 70 * l, s + 34, 'shark').setDepth(30);
            (w
              .setVisible(!0)
              .setActive(!0)
              .setAlpha(1)
              .setScale(1.35)
              .setFlipX(l > 0)
              .setPosition(S + 70 * l, s + 34),
              (this.activeShark = w));
            const x = this.add.ellipse(S, s, 58, 10, 12187135, 0.18).setDepth(8).setAlpha(0),
              b = this.add
                .circle(g, s - 2, 12, 5826559, 0.18)
                .setDepth(12)
                .setAlpha(0),
              C = () => {
                if (!this.scene?.isActive?.() || !w.active) return;
                const e = this.waterAttackToken === i;
                (e && this.waterAttackToken++,
                  this.tweens.killTweensOf([w, x, b, r, o, n, h, d, c, y, p]));
                const t = w === this.oceanAmbientShark;
                ([x, b, r, o, n, h, d, c, y, p].forEach((e) => {
                  e?.active && e.destroy();
                }),
                  t
                    ? (w.setVisible(!0).setActive(!0).setAlpha(0.96).setScale(1.35).setAngle(0),
                      this.startAmbientSharkSwim?.())
                    : w?.active && w.destroy(),
                  this.activeShark === w && (this.activeShark = null),
                  e &&
                    ((this.waterAttackActive = !1),
                    (this.waterDeathTimer = 0),
                    (this.lastWaterDeath = !0),
                    this.playerCue('WATER HAZARD · GET OUT OF WATER', '#58e7ff'),
                    this.fail('A shark took you under.')));
              };
            w.setAlpha(1);
            const R = this.tweens.add({
              targets: w,
              x: { from: S - 105 * l, to: S + 105 * l },
              y: { from: s + 42, to: s + 22 },
              angle: { from: -7 * l, to: 7 * l },
              alpha: 1,
              duration: 520,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
            });
            (this.time.delayedCall(1500, () => {
              w.active &&
                this.waterAttackToken === i &&
                (R.stop(),
                this.tweens.add({
                  targets: w,
                  alpha: 0.14,
                  x: m,
                  y: s + 46,
                  scale: 0.72,
                  duration: 190,
                  ease: 'Quad.in',
                }));
            }),
              this.time.delayedCall(1700, () => {
                w.active &&
                  this.waterAttackToken === i &&
                  this.tweens.add({
                    targets: w,
                    alpha: 1,
                    x: m,
                    y: s - 2,
                    scale: 0.84,
                    duration: 220,
                    ease: 'Cubic.out',
                  });
              }),
              this.time.delayedCall(0 === u ? 1900 : 1940, () => {
                w.active &&
                  this.waterAttackToken === i &&
                  (this.tweens.add({
                    targets: w,
                    x: 0 === u ? g : g + 18 * l,
                    y: 0 === u ? s - 8 : s - 22,
                    scale: 0 === u ? 0.9 : 1.02,
                    duration: 0 === u ? 210 : 170,
                    ease: 'Cubic.in',
                  }),
                  this.tweens.add({
                    targets: b,
                    alpha: { from: 0, to: 0.85 },
                    scale: { from: 0.8, to: 3.2 },
                    duration: 210,
                    ease: 'Quad.out',
                    onComplete: () => {
                      b.active && b.destroy();
                    },
                  }));
              }),
              this.time.delayedCall(0 === u ? 2100 : 2140, () => {
                if (!w.active || this.waterAttackToken !== i) return;
                (!this.motionReduced &&
                  this.graphicsLevel >= 2 &&
                  this.cameras.main.flash(75, 88, 231, 255, !0),
                  this.shake(130, 0.009),
                  this.triggerSharkWaterImpact(w.x, s),
                  1 === u &&
                    this.time.delayedCall(90, () => {
                      w.active &&
                        this.waterAttackToken === i &&
                        this.triggerSharkWaterImpact(w.x, s);
                    }));
                const t = e?.body;
                t &&
                  (t.setVelocityY(0 === u ? 420 : 500),
                  t.setVelocityX(t.velocity.x * (0 === u ? 0.15 : 0.08)),
                  1 === u &&
                    this.tweens.add({
                      targets: y,
                      scaleX: 4.2,
                      scaleY: 1.8,
                      alpha: 0,
                      duration: 220,
                      ease: 'Cubic.out',
                      onComplete: () => {
                        y.active && y.destroy();
                      },
                    }),
                  this.tweens.add({
                    targets: w,
                    y: s - 46,
                    duration: 260,
                    ease: 'Sine.easeOut',
                    onComplete: () => {
                      w.active &&
                        this.waterAttackToken === i &&
                        (this.tweens.add({
                          targets: w,
                          y: s - 260,
                          duration: 420,
                          ease: 'Sine.easeOut',
                          onComplete: () => {
                            w.active &&
                              this.waterAttackToken === i &&
                              this.tweens.add({
                                targets: w,
                                y: s - 18,
                                duration: 330,
                                ease: 'Sine.easeIn',
                                onComplete: C,
                              });
                          },
                        }),
                        this.tweens.add({
                          targets: w,
                          angle: e.flipX ? -14 : 14,
                          duration: 260,
                          ease: 'Sine.easeOut',
                        }));
                    },
                  }));
              }));
          };
          this.motionReduced ? this.time.delayedCall(120, f) : this.time.delayedCall(520, f);
        },
        void 0,
        this,
      ));
  }
  triggerSharkWaterImpact(e, t) {
    if (this.motionReduced || this.finished || this.respawning) return;
    const i = [],
      s = this.add.ellipse(e, t, 34, 8, 15269375, 0.72).setDepth(12).setAlpha(0.72),
      a = this.add
        .ellipse(e, t - 8, 18, 22, 14679295, 0.62)
        .setDepth(12)
        .setAlpha(0.58),
      l = this.add
        .ellipse(e, t - 2, 54, 10, 9303295, 0.42)
        .setDepth(11)
        .setAlpha(0.5);
    (i.push(s, a, l), this.waterWaveObjects.push(...i));
    for (let s = 0; s < 8; s++) {
      const s = this.add
        .circle(
          e + Phaser.Math.Between(-14, 14),
          t - Phaser.Math.Between(2, 9),
          Phaser.Math.Between(1, 2),
          15269375,
          Phaser.Math.FloatBetween(0.38, 0.72),
        )
        .setDepth(12)
        .setAlpha(0.8);
      (i.push(s),
        this.waterWaveObjects.push(s),
        this.tweens.add({
          targets: s,
          x: s.x + Phaser.Math.Between(-42, 42),
          y: t - Phaser.Math.Between(24, 58),
          alpha: 0,
          scale: Phaser.Math.FloatBetween(0.65, 1.4),
          duration: Phaser.Math.Between(260, 420),
          ease: 'Cubic.out',
          onComplete: () => {
            s.active && s.destroy();
          },
        }));
    }
    (this.tweens.add({
      targets: s,
      scaleX: 3.8,
      scaleY: 1.8,
      alpha: 0,
      duration: 360,
      ease: 'Cubic.out',
    }),
      this.tweens.add({
        targets: a,
        y: t - 38,
        scaleX: 1.8,
        scaleY: 2.5,
        alpha: 0,
        duration: 390,
        ease: 'Cubic.out',
      }),
      this.tweens.add({
        targets: l,
        scaleX: 3.2,
        scaleY: 1.7,
        alpha: 0,
        duration: 330,
        ease: 'Quad.out',
      }),
      this.shake(110, 0.007),
      this.time.delayedCall(430, () => {
        i.forEach((e) => {
          e?.active && e.destroy();
        });
      }));
  }
  createWaterWaves() {
    const e = Number.isFinite(this.graphicsLevel) ? this.graphicsLevel : 2;
    if (
      this.motionReduced ||
      e < 2 ||
      !Array.isArray(this.mission?.waterZones) ||
      this.waterWavesCreated
    )
      return;
    ((this.waterWavesCreated = !0), (this.waterWaveObjects = []), (this.waterWaveTimers = []));
    const t = 'signal-storm' === this.mission.id,
      i = t ? 1.38 : 1,
      s = t ? 0.72 : 1,
      a = t ? 1.18 : 1;
    this.mission.waterZones.forEach(([e, l, r, o], n) => {
      const h = l,
        d = e + r - 8,
        c = (n % 2 == 0 ? 1 : -1) * Phaser.Math.FloatBetween(10, 24),
        y = this.add
          .ellipse(e + 8 + 0.35 * c, h - 1, 92 * i, 13 * i, 10350591, 0.18)
          .setDepth(7)
          .setAlpha(0),
        p = this.add
          .ellipse(e + 22, h + 2, 72 * i, 9 * i, 5826559, 0.1)
          .setDepth(5)
          .setAlpha(0),
        f = [];
      for (let a = 0; a < 2; a++) {
        const l = this.add
          .ellipse(
            e + 26 + 58 * a + 0.18 * c,
            h + 7 + 2 * a,
            (108 - 18 * a) * i,
            (7 - a) * i,
            3919336,
            t ? 0.18 : 0.11,
          )
          .setDepth(4)
          .setAlpha(0);
        (f.push(l),
          this.waterWaveObjects.push(l),
          this.tweens.add({
            targets: l,
            x: e + 18 + 72 * a + 0.3 * c,
            y: h + 5 + Phaser.Math.FloatBetween(-1, 2),
            scaleX: Phaser.Math.FloatBetween(1.1, 1.32),
            scaleY: Phaser.Math.FloatBetween(0.72, 0.92),
            alpha: { from: 0, to: t ? 0.28 : 0.2 },
            duration: Phaser.Math.Between(2200, 2900) / s,
            delay: 240 * n + 330 * a,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
          }));
      }
      const u = this.add
          .ellipse(d + 0.25 * c, h - 4, 48 * i, 8 * i, 15400959, 0.14)
          .setDepth(9)
          .setAlpha(0),
        m = this.add
          .ellipse(d - 12 + 0.3 * c, h - 8, 34 * i, 7 * i, 16777215, 0.12)
          .setDepth(10)
          .setAlpha(0),
        g = this.add
          .ellipse(d, h - 12, 22 * i, 20 * i, 15269375, 0.1)
          .setDepth(10)
          .setAlpha(0),
        S = this.add
          .ellipse(d, h + 2, 34 * i, 5 * i, 5826559, 0.08)
          .setDepth(7)
          .setAlpha(0),
        w = this.add
          .ellipse(d - 4, h + 5, 30 * i, 4 * i, 9303295, 0.08)
          .setDepth(6)
          .setAlpha(0);
      this.waterWaveObjects.push(y, p, u, m, g, S, w);
      const x = [];
      for (let i = 0; i < 5; i++) {
        const l = this.add
          .circle(
            d + Phaser.Math.Between(-12, 12),
            h - 4,
            Phaser.Math.Between(1, 2),
            15269375,
            Phaser.Math.FloatBetween(0.2, 0.42),
          )
          .setDepth(10)
          .setAlpha(0);
        (x.push(l), this.waterWaveObjects.push(l));
        const r = l.x;
        (this.tweens.add({
          targets: l,
          x: r + Phaser.Math.Between(-24, 24) + c * Phaser.Math.FloatBetween(0.45, 0.9),
          y: h - Phaser.Math.Between(20, 38),
          alpha: { from: 0, to: Phaser.Math.FloatBetween(0.35, 0.68) },
          scale: { from: 0.65, to: Phaser.Math.FloatBetween(0.95, 1.15) },
          angle: Phaser.Math.Between(-18, 18),
          duration: Phaser.Math.Between(260, 380) / s,
          delay: 300 * n + 1120 + 24 * i,
          yoyo: !0,
          repeat: -1,
          ease: 'Cubic.out',
        }),
          this.tweens.add({
            targets: y,
            x: d - 24 + c,
            scaleX: 1.5 * a,
            scaleY: 1.18 * a,
            angle: c > 0 ? 3.5 : -3.5,
            alpha: { from: 0, to: t ? 0.82 : 0.68 },
            duration: 1650 / s,
            delay: 300 * n,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
            onRepeat: () => {
              y.active &&
                ((y.scaleY = Phaser.Math.FloatBetween(1.08, 1.22)),
                (y.angle =
                  c > 0
                    ? Phaser.Math.FloatBetween(2.5, 4.5)
                    : Phaser.Math.FloatBetween(-4.5, -2.5)));
            },
          }),
          this.tweens.add({
            targets: p,
            x: e + 22 + 0.35 * c,
            y: h + Phaser.Math.FloatBetween(1, 3),
            scaleX: Phaser.Math.FloatBetween(1.35, 1.62),
            scaleY: Phaser.Math.FloatBetween(0.68, 0.88),
            angle: c > 0 ? Phaser.Math.FloatBetween(1, 2.5) : Phaser.Math.FloatBetween(-2.5, -1),
            alpha: { from: 0, to: t ? 0.42 : 0.3 },
            duration: Phaser.Math.Between(1700, 2200) / s,
            delay: 300 * n + 260,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
          }),
          this.tweens.add({
            targets: u,
            x: d + 8 + 0.3 * c,
            y: h - (t ? 9 : 7),
            scaleX: t ? 2.35 : 2.05,
            scaleY: t ? 0.78 : 0.68,
            alpha: { from: 0, to: t ? 0.86 : 0.62 },
            duration: Phaser.Math.Between(300, 390) / s,
            delay: 300 * n + 1120,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.out',
          }),
          this.tweens.add({
            targets: m,
            y: h - (t ? 38 : 29),
            x: d - 4 + 0.65 * c,
            scaleX: t ? 2.08 : 1.78,
            scaleY: t ? 1.62 : 1.44,
            angle: c > 0 ? Phaser.Math.FloatBetween(4, 7) : Phaser.Math.FloatBetween(-7, -4),
            alpha: { from: 0, to: t ? 0.72 : 0.56 },
            duration: Phaser.Math.Between(380, 470) / s,
            delay: 300 * n + 1100,
            yoyo: !0,
            repeat: -1,
            ease: 'Cubic.out',
          }),
          this.tweens.add({
            targets: g,
            x: d + 0.7 * c,
            y: h - (t ? 48 : 38),
            scaleX: t ? 2.15 : 1.85,
            scaleY: t ? 2.35 : 2.05,
            angle: c > 0 ? 5 : -5,
            alpha: { from: 0, to: t ? 0.72 : 0.6 },
            duration: 390 / s,
            delay: 300 * n + 1140,
            yoyo: !0,
            repeat: -1,
            ease: 'Cubic.out',
          }),
          this.tweens.add({
            targets: S,
            x: d + 0.55 * c,
            scaleX: t ? 4.8 : 4.05,
            scaleY: t ? 1.48 : 1.3,
            alpha: { from: 0, to: t ? 0.5 : 0.4 },
            duration: Phaser.Math.Between(430, 520) / s,
            delay: 300 * n + 1150 + Phaser.Math.Between(0, 60),
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
          }),
          this.tweens.add({
            targets: w,
            x: e + 10 + 0.48 * c,
            y: h + Phaser.Math.FloatBetween(4, 8),
            scaleX: t ? 3.6 : 3.05,
            scaleY: t ? 0.86 : 0.72,
            angle: c > 0 ? Phaser.Math.FloatBetween(1.5, 3) : Phaser.Math.FloatBetween(-3, -1.5),
            alpha: { from: 0, to: t ? 0.4 : 0.3 },
            duration: Phaser.Math.Between(1650, 2050) / s,
            delay: 300 * n + 650,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
          }),
          this.tweens.add({
            targets: y,
            y: '-=3',
            duration: 420 / s,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
          }));
        const o = this.add
          .ellipse(d, h - 4, t ? 70 : 58, t ? 24 : 20, 14679295, 0.08)
          .setDepth(10)
          .setAlpha(0);
        this.waterWaveObjects.push(o);
        const f = this.time.addEvent({
          delay: t ? 6200 : 8200,
          loop: !0,
          startAt: 900 * n + 3400,
          callback: () => {
            !o.active ||
              this.finished ||
              this.respawning ||
              (o.setPosition(d, h - 5),
              o.setScale(0.45, 0.55),
              o.setAlpha(0),
              this.tweens.add({
                targets: o,
                x: d + 0.85 * c,
                y: h - (t ? 46 : 34),
                scaleX: t ? 1.95 : 1.55,
                scaleY: t ? 1.72 : 1.42,
                angle: c > 0 ? 4 : -4,
                alpha: { from: 0, to: t ? 0.78 : 0.58 },
                duration: t ? 560 : 480,
                ease: 'Cubic.out',
                onComplete: () => {
                  o.active &&
                    this.tweens.add({
                      targets: o,
                      scaleX: t ? 2.45 : 2.1,
                      scaleY: t ? 0.72 : 0.82,
                      alpha: 0,
                      duration: 430,
                      ease: 'Sine.inOut',
                    });
                },
              }),
              this.tweens.add({
                targets: S,
                scaleX: t ? 5 : 4,
                alpha: t ? 0.6 : 0.46,
                duration: 260,
                yoyo: !0,
                ease: 'Quad.out',
              }),
              this.shake(t ? 90 : 55, t ? 0.006 : 0.003));
          },
        });
        this.waterWaveTimers.push(f);
      }
    });
  }
  clearWaterWaves() {
    (this.waterWaveTimers &&
      (this.waterWaveTimers.forEach((e) => {
        e && e.remove(!1);
      }),
      (this.waterWaveTimers = [])),
      this.waterWaveObjects &&
        (this.tweens.killTweensOf(this.waterWaveObjects),
        this.waterWaveObjects.forEach((e) => {
          e && e.active && e.destroy();
        }),
        (this.waterWaveObjects = [])),
      (this.waterWavesCreated = !1));
  }
  shutdown() {
    ('undefined' != typeof window &&
      (this.rawKeyboardDownHandler &&
        window.removeEventListener('keydown', this.rawKeyboardDownHandler, !0),
      this.rawKeyboardUpHandler &&
        window.removeEventListener('keyup', this.rawKeyboardUpHandler, !0),
      this.rawKeyboardBlurHandler &&
        window.removeEventListener('blur', this.rawKeyboardBlurHandler)),
      (this.rawKeyboardState = null),
      (this.rawKeyboardDownHandler = null),
      (this.rawKeyboardUpHandler = null),
      (this.rawKeyboardBlurHandler = null),
      this.checkpointArrow?.destroy(),
      (this.checkpointArrow = null),
      this.clearWaterWaves(),
      this._relayPuzzleResizeBound &&
        (this.scale.off(Phaser.Scale.Events.RESIZE, this.handleRelayPuzzleResize, this),
        (this._relayPuzzleResizeBound = !1)),
      (this.voiceSerial = (this.voiceSerial || 0) + 1),
      this.narrationHandler &&
        (this.game.events.off('narration', this.narrationHandler), (this.narrationHandler = null)),
      'undefined' != typeof window &&
        'speechSynthesis' in window &&
        (window.speechSynthesis.cancel(),
        this.voiceVoicesChangedHandler &&
          'function' == typeof window.speechSynthesis.removeEventListener &&
          window.speechSynthesis.removeEventListener(
            'voiceschanged',
            this.voiceVoicesChangedHandler,
          )),
      (this.voiceVoicesChangedHandler = null),
      (this.voicePreviousVoicesChangedHandler = null),
      (this.voiceVoices = []),
      (this.voiceQueue = []),
      (this.voiceSpeaking = !1),
      (this.voiceLastText = ''),
      (this.voiceLastTextAt = 0),
      (this.voiceLastAt = 0));
  }
  handleRelayPuzzleResize(e) {
    const t = this.relayPuzzleUI;
    if (!t || !this.relayPuzzleActive || !e) return;
    const i = Number(e.width) || this.scale.width,
      s = Number(e.height) || this.scale.height,
      a = Math.min(620, Math.max(300, i - 34)),
      l = Math.min(440, Math.max(240, s - 40));
    (t.overlay?.setPosition(i / 2, s / 2),
      t.overlay?.setSize(i, s),
      t.panel?.setPosition(i / 2, s / 2),
      t.panel?.setSize(a, l),
      t.inner?.setPosition(i / 2, s / 2),
      t.inner?.setSize(a - 18, l - 18),
      t.title?.setPosition(i / 2, s / 2 - l / 2 + 38),
      t.subtitle?.setPosition(i / 2, s / 2 - l / 2 + 68),
      t.status?.setPosition(i / 2, s / 2 - 132),
      t.timer?.setPosition(i / 2, s / 2 - 106),
      t.close?.setPosition(i / 2 + a / 2 - 28, s / 2 - l / 2 + 24),
      t.retry?.setPosition(i / 2 - a / 2 + 56, s / 2 + l / 2 - 25),
      t.difficultyLabel?.setPosition(i / 2, s / 2 - l / 2 + 92),
      t.instruction?.setPosition(i / 2, s / 2 + l / 2 - 48),
      [
        t.overlay,
        t.panel,
        t.inner,
        t.title,
        t.subtitle,
        t.status,
        t.timer,
        t.close,
        t.retry,
        t.difficultyLabel,
        t.instruction,
      ]
        .filter(Boolean)
        .forEach((e) => {
          e.setScrollFactor?.(0);
        }));
  }
  updateRelayGateInteraction() {
    if (
      !this.player?.active ||
      !this.relayGates ||
      this.relayPuzzleActive ||
      this.finished ||
      this.respawning ||
      this.cinematicActive ||
      this.afkCryostasisActive ||
      this.physics?.world?.isPaused
    )
      return void this.clearRelayInteractHint();
    let e = null,
      t = 1 / 0;
    if (
      (this.relayGates.children.iterate((i) => {
        if (!i || !i.active) return;
        if (i.getData('solved')) return;
        const s = Phaser.Math.Distance.Between(this.player.x, this.player.y, i.x, i.y);
        s <= 145 && s < t && ((t = s), (e = i));
      }),
      !e)
    )
      return void this.clearRelayInteractHint();
    ((this.relayNearbyGate = e), this.showRelayInteractHint(e));
    const i = this.mobileActions.interact;
    ((this.mobileActions.interact = !1), i && this.openRelayPuzzle(e));
  }
  showRelayInteractHint(e) {
    if (!e) return;
    const t = e.x,
      i = e.y - 145;
    if (!this.relayInteractHint) {
      this.relayInteractHint = this.add.container(t, i).setDepth(60);
      const e = this.add.rectangle(0, 0, 118, 30, 464421, 0.94).setStrokeStyle(1.5, 9303295, 0.92),
        s = this.add.rectangle(-42, 0, 24, 21, 9303295, 0.16).setStrokeStyle(1, 9303295, 0.85),
        a = this.add
          .text(-42, 0, 'E', {
            fontFamily: 'Orbitron',
            fontSize: '12px',
            color: '#8df4ff',
            fontStyle: 'bold',
          })
          .setOrigin(0.5),
        l = this.add
          .text(12, 0, 'INTERACT', {
            fontFamily: 'Orbitron',
            fontSize: '10px',
            color: '#e8fdff',
            fontStyle: 'bold',
            letterSpacing: 1,
          })
          .setOrigin(0.5);
      (this.relayInteractHint.add([e, s, a, l]),
        this.motionReduced ||
          this.tweens.add({
            targets: this.relayInteractHint,
            alpha: { from: 0.72, to: 1 },
            scale: { from: 0.94, to: 1 },
            duration: 500,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
          }));
    }
    (this.relayInteractHint.setPosition(t, i), this.relayInteractHint.setVisible(!0));
  }
  clearRelayInteractHint() {
    ((this.relayNearbyGate = null),
      this.relayInteractHint &&
        (this.tweens.killTweensOf(this.relayInteractHint),
        this.relayInteractHint.destroy(),
        (this.relayInteractHint = null)));
  }
  openRelayPuzzle(e) {
    !e ||
      !e.active ||
      e.getData('solved') ||
      this.relayPuzzleActive ||
      this.finished ||
      this.respawning ||
      this.cinematicActive ||
      this.afkCryostasisActive ||
      !this.player?.active ||
      this.physics?.world?.isPaused ||
      ((this.relayPuzzleActive = !0),
      (this.relayPuzzleGate = e),
      (this.relayPuzzleType = this.getMissionPuzzleType(e)),
      (this.relayPuzzleAttempts = 0),
      (this.relayPuzzleStartedAt = this.time.now),
      (this.relayPuzzleTimerBand = 0),
      this.clearRelayInteractHint(),
      this.player.body?.setVelocity(0, 0),
      this.player.body?.setAcceleration(0, 0),
      this.player.setVelocity?.(0, 0),
      (this.mobileActions.jump = !1),
      (this.mobileActions.fire = !1),
      (this.mobileActions.sword = !1),
      (this.mobileActions.dash = !1),
      (this.mobileActions.crouch = !1),
      (this.mobileActions.interact = !1),
      (this.mobileActions.build1 = !1),
      (this.mobileActions.build2 = !1),
      (this.mobileActions.gadget1 = !1),
      (this.mobileActions.gadget2 = !1),
      (this.mobileDirection = null),
      this.physics.pause(),
      this.createRelayPuzzleUI());
  }
  getMissionPuzzleType(e = null) {
    const t = this.mission?.id,
      i = e?.getData?.('type');
    if (i && 'circuit' !== i) return i;
    return (
      {
        'first-delivery': 'code',
        'dead-drop': 'circuit',
        blackout: 'sequence',
        pursuit: 'tiles',
        'signal-storm': 'frequency',
        'corporate-lockdown': 'grid',
        'final-relay': 'final',
      }[t] || 'circuit'
    );
  }
  getRelayPuzzleMeta(e) {
    const t = {
      code: {
        title: 'ACCESS CODE',
        subtitle: 'ENCRYPTED // SECURITY BYPASS',
        instruction: 'TAP DIGITS // MATCH THE SECURITY CODE',
      },
      circuit: {
        title: 'RELAY ACCESS',
        subtitle: 'CIRCUIT // SECURITY HANDSHAKE',
        instruction: 'TAP NODE = ROTATE 90°  //  START → END',
      },
      sequence: {
        title: 'GRID SEQUENCE',
        subtitle: 'MEMORY // SIGNAL ORDER',
        instruction: 'ACTIVATE NODES IN THE CORRECT ORDER',
      },
      tiles: {
        title: 'ROUTE MATRIX',
        subtitle: 'NAVIGATION // PATH RECONSTRUCTION',
        instruction: 'BUILD THE SAFE ROUTE  //  START → END',
      },
      frequency: {
        title: 'SIGNAL TUNER',
        subtitle: 'FREQUENCY // ENCRYPTED CHANNEL',
        instruction: 'TUNE THE SIGNAL INTO THE GREEN BAND',
      },
      grid: {
        title: 'SECURITY GRID',
        subtitle: 'CORPORATE // INTRUSION CONTROL',
        instruction: 'FIND THE SAFE PATH WITHOUT TRIGGERING SECURITY',
      },
      final: {
        title: 'APEX RELAY',
        subtitle: 'FINAL PROTOCOL // MULTI-LAYER HANDSHAKE',
        instruction: 'COMPLETE ALL SECURITY LAYERS',
      },
    };
    return t[e] || t.circuit;
  }
  createRelayPuzzleUI() {
    const e = this.scale.width,
      t = this.scale.height;
    this._relayPuzzleResizeBound ||
      ((this._relayPuzzleResizeBound = !0),
      this.scale.on(Phaser.Scale.Events.RESIZE, this.handleRelayPuzzleResize, this));
    const i = this.add
        .rectangle(e / 2, t / 2, e, t, 133138, 0.78)
        .setScrollFactor(0)
        .setDepth(1e3)
        .setInteractive(),
      s = Math.min(620, Math.max(300, e - 34)),
      a = Math.min(440, Math.max(240, t - 40)),
      l = this.add
        .rectangle(e / 2, t / 2, s, a, 464421, 0.98)
        .setStrokeStyle(2, 9303295, 0.92)
        .setScrollFactor(0)
        .setDepth(1001),
      r = this.add
        .rectangle(e / 2, t / 2, s - 18, a - 18, 266269, 0.98)
        .setStrokeStyle(1, 3837096, 0.42)
        .setScrollFactor(0)
        .setDepth(1001),
      o = this.add
        .text(e / 2, t / 2 - a / 2 + 38, this.getRelayPuzzleMeta(this.relayPuzzleType).title, {
          fontFamily: 'Orbitron',
          fontSize: '20px',
          color: '#e8fdff',
          fontStyle: 'bold',
          letterSpacing: 2,
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1002),
      n = this.add
        .text(e / 2, t / 2 - a / 2 + 68, this.getRelayPuzzleMeta(this.relayPuzzleType).subtitle, {
          fontFamily: 'Orbitron',
          fontSize: '10px',
          color: '#8df4ff',
          letterSpacing: 1.3,
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1002),
      h = this.add
        .text(e / 2, t / 2 - 132, 'LOCKED · WAITING FOR INPUT', {
          fontFamily: 'Orbitron',
          fontSize: '11px',
          color: '#ff826e',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1002),
      d = this.add
        .text(
          e / 2,
          t / 2 + a / 2 - 48,
          this.getRelayPuzzleMeta(this.relayPuzzleType).instruction,
          {
            fontFamily: 'Orbitron',
            fontSize: e < 600 ? '8px' : '9px',
            color: '#91a9b7',
            align: 'center',
          },
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1002),
      c = this.add
        .text(e / 2, t / 2 - 106, 'TIME 00:00', {
          fontFamily: 'Orbitron',
          fontSize: e < 600 ? '9px' : '10px',
          color: '#8df4ff',
          fontStyle: 'bold',
          letterSpacing: 1.2,
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1002),
      y = this.add
        .text(e / 2 + s / 2 - 28, t / 2 - a / 2 + 24, '×', {
          fontFamily: 'Arial',
          fontSize: '24px',
          color: '#ff826e',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1003)
        .setInteractive({ useHandCursor: !0 });
    (y.on('pointerover', () => {
      y.setColor('#ffffff');
    }),
      y.on('pointerout', () => {
        y.setColor('#ff826e');
      }),
      y.on('pointerdown', () => {
        this.closeRelayPuzzle();
      }));
    const p = Number(this.relayPuzzleGate?.getData('difficulty')) || 1,
      f =
        p >= 3
          ? 'SECURITY LEVEL // OMEGA'
          : 2 === p
            ? 'SECURITY LEVEL // ALPHA'
            : 'SECURITY LEVEL // BETA',
      u = this.add
        .text(e / 2 - s / 2 + 56, t / 2 + a / 2 - 25, '↻ RETRY', {
          fontFamily: 'Orbitron',
          fontSize: e < 600 ? '8px' : '9px',
          color: '#8df4ff',
          fontStyle: 'bold',
          letterSpacing: 1,
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1003)
        .setInteractive({ useHandCursor: !0 });
    (u.on('pointerover', () => {
      u.setColor('#ffffff');
    }),
      u.on('pointerout', () => {
        u.setColor('#8df4ff');
      }),
      u.on('pointerdown', () => {
        this.retryRelayPuzzle();
      }));
    const m = this.add
      .text(e / 2, t / 2 - a / 2 + 92, f, {
        fontFamily: 'Orbitron',
        fontSize: e < 600 ? '8px' : '9px',
        color: p >= 3 ? '#ff826e' : '#8df4ff',
        fontStyle: 'bold',
        letterSpacing: 1.2,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1002);
    ((this.relayPuzzleUI = {
      overlay: i,
      panel: l,
      inner: r,
      title: o,
      subtitle: n,
      status: h,
      timer: c,
      instruction: d,
      close: y,
      retry: u,
      difficultyLabel: m,
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
      solved: !1,
    }),
      this.createRelayPuzzleContent(),
      this.motionReduced ||
        this.tweens.add({
          targets: [l, r],
          alpha: { from: 0, to: 1 },
          scale: { from: 0.96, to: 1 },
          duration: 220,
          ease: 'Cubic.out',
        }),
      this.playerCue(this.getRelayPuzzleMeta(this.relayPuzzleType).title, '#8df4ff'),
      this.gadgetPulse(9303295, 12, 320));
  }
  createRelayPuzzleContent() {
    switch (this.relayPuzzleType || 'circuit') {
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
        return ((this.relayPuzzleType = 'circuit'), this.createRelayCircuitPreview());
    }
  }
  createMissionPuzzleState() {
    return (
      this.relayPuzzleData || (this.relayPuzzleData = {}),
      (this.relayPuzzleData.missionId = this.mission?.id || 'unknown'),
      (this.relayPuzzleData.type = this.relayPuzzleType || 'circuit'),
      (this.relayPuzzleData.difficulty = Number(this.relayPuzzleGate?.getData('difficulty')) || 1),
      (this.relayPuzzleData.puzzleObjects = []),
      (this.relayPuzzleData.finished = !1),
      this.relayPuzzleData
    );
  }
  createMissionCodePuzzle() {
    const e = this.createMissionPuzzleState(),
      t = this.relayPuzzleUI,
      i = e.difficulty,
      s = i >= 3 ? 5 : 2 === i ? 4 : 3;
    ((e.code = Array.from({ length: s }, () => Phaser.Math.Between(1, 9))),
      (e.input = []),
      (e.codeLocked = !1));
    const a = this.scale.width,
      l = a / 2,
      r = this.scale.height / 2,
      o = this.add
        .text(l, r - 88, `ACCESS CODE  //  ${e.code.join('  ')}`, {
          fontFamily: 'Orbitron',
          fontSize: a < 600 ? '13px' : '18px',
          color: '#e8fdff',
          fontStyle: 'bold',
          letterSpacing: 2,
          align: 'center',
          stroke: '#07111d',
          strokeThickness: 5,
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1004);
    (e.puzzleObjects.push(o), t.status?.setText('MEMORIZE SECURITY CODE').setColor('#8df4ff'));
    const n = i >= 3 ? 900 : 2 === i ? 1200 : 1600;
    this.time.delayedCall(n, () => {
      this.relayPuzzleActive &&
        !t.solved &&
        ((e.codeLocked = !0),
        o.setText('ACCESS CODE  //  ' + Array(s).fill('?').join('  ')),
        t.status?.setText('CODE HIDDEN · ENTER SEQUENCE').setColor('#8df4ff'));
    });
    const h = [];
    for (let t = 0; t < s; t++) {
      const i = this.add
          .rectangle(l - (42 * (s - 1)) / 2 + 42 * t, r - 28, 34, 34, 663088, 0.96)
          .setStrokeStyle(1.8, 2584461, 0.9)
          .setScrollFactor(0)
          .setDepth(1003),
        a = this.add
          .text(i.x, i.y, '?', {
            fontFamily: 'Orbitron',
            fontSize: '15px',
            color: '#8df4ff',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(1004);
      (e.puzzleObjects.push(i, a), h.push({ slot: i, text: a }));
    }
    const d = r + 42;
    for (let i = 1; i <= 9; i++) {
      const a = i - 1,
        r = l - 54 + 54 * (a % 3),
        o = d + 43 * Math.floor(a / 3),
        n = this.add
          .rectangle(r, o, 42, 34, 663088, 0.96)
          .setStrokeStyle(1.5, 2584461, 0.9)
          .setScrollFactor(0)
          .setDepth(1003)
          .setInteractive({ useHandCursor: !0 }),
        c = this.add
          .text(r, o, String(i), {
            fontFamily: 'Orbitron',
            fontSize: '14px',
            color: '#8df4ff',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(1004);
      (e.puzzleObjects.push(n, c),
        n.on('pointerover', () => {
          !t.solved && e.codeLocked && (n.setStrokeStyle(2.4, 15269375, 1), c.setColor('#ffffff'));
        }),
        n.on('pointerout', () => {
          t.solved || (n.setStrokeStyle(1.5, 2584461, 0.9), c.setColor('#8df4ff'));
        }),
        n.on('pointerdown', () => {
          if (t.solved || !e.codeLocked) return;
          const a = e.input.length;
          if (a >= s) return;
          const l = e.code[a];
          if ((this.relayPuzzleAttempts++, i !== l)) {
            ((e.input = []),
              h.forEach((e) => {
                (e.text.setText('?'), e.slot.setStrokeStyle(1.8, 2584461, 0.9));
              }),
              t.status?.setText('WRONG CODE · RESET').setColor('#ff826e'));
            const i = this.relayPuzzleSession;
            return void this.time.delayedCall(500, () => {
              i === this.relayPuzzleSession &&
                this.relayPuzzleActive &&
                !t.solved &&
                t.status?.setText('ENTER SECURITY CODE').setColor('#8df4ff');
            });
          }
          (e.input.push(i),
            h[a].text.setText(String(i)),
            h[a].slot.setStrokeStyle(2, 9303295, 1),
            t.status?.setText(`CODE INPUT  //  ${e.input.join(' ')}`).setColor('#8df4ff'),
            e.input.length === s &&
              ((t.solved = !0),
              (e.finished = !0),
              t.status?.setText('ACCESS GRANTED').setColor('#8df4ff'),
              this.missionPuzzleVictoryFX('code', this.getRelayPuzzlePerformance().grade),
              this.solveRelayGate()));
        }));
    }
  }
  createMissionSequencePuzzle() {
    const e = this.createMissionPuzzleState(),
      t = this.relayPuzzleUI,
      i = e.difficulty,
      s = i >= 3 ? 6 : 2 === i ? 5 : 4;
    ((e.sequence = Phaser.Utils.Array.NumberArray(1, s)),
      Phaser.Utils.Array.Shuffle(e.sequence),
      (e.sequenceIndex = 0),
      (e.sequenceLocked = !1));
    const a = this.scale.width,
      l = this.scale.height,
      r = [],
      o = this.add
        .text(a / 2, l / 2 - 92, `ORDER  //  ${e.sequence.join(' → ')}`, {
          fontFamily: 'Orbitron',
          fontSize: a < 600 ? '12px' : '16px',
          color: '#e8fdff',
          fontStyle: 'bold',
          letterSpacing: 1.8,
          align: 'center',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1004);
    (e.puzzleObjects.push(o), t.status?.setText('MEMORIZE SIGNAL ORDER').setColor('#8df4ff'));
    const n = this.relayPuzzleSession;
    this.time.delayedCall(i >= 3 ? 1200 : 2 === i ? 1500 : 1800, () => {
      n === this.relayPuzzleSession &&
        this.relayPuzzleActive &&
        !t.solved &&
        ((e.sequenceLocked = !0),
        o.setText('ORDER  //  ? ? ? ? ? ?'.slice(0, 11 + 2 * s)),
        t.status?.setText('ORDER HIDDEN · EXECUTE').setColor('#8df4ff'));
    });
    for (let i = 0; i < s; i++) {
      const s = a / 2 - 55 + 55 * (i % 3),
        o = l / 2 - 15 + 55 * Math.floor(i / 3),
        n = this.add
          .circle(s, o, 21, 663088, 0.96)
          .setStrokeStyle(2, 2584461, 0.9)
          .setScrollFactor(0)
          .setDepth(1003)
          .setInteractive({ useHandCursor: !0 }),
        h = this.add
          .text(s, o, String(i + 1), {
            fontFamily: 'Orbitron',
            fontSize: '13px',
            color: '#8df4ff',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(1004);
      (e.puzzleObjects.push(n, h),
        r.push(n),
        n.on('pointerdown', () => {
          if (t.solved || !e.sequenceLocked) return;
          this.relayPuzzleAttempts++;
          const s = e.sequence[e.sequenceIndex];
          if (i !== s - 1)
            return (
              (e.sequenceIndex = 0),
              r.forEach((e) => {
                (e.setFillStyle(663088, 0.96), e.setStrokeStyle(2, 2584461, 0.9));
              }),
              void t.status?.setText('SEQUENCE ERROR · RESET').setColor('#ff826e')
            );
          (n.setFillStyle(1193546, 1).setStrokeStyle(2.6, 9303295, 1),
            e.sequenceIndex++,
            e.sequenceIndex >= e.sequence.length &&
              ((t.solved = !0),
              t.status?.setText('SEQUENCE ACCEPTED').setColor('#8df4ff'),
              this.missionPuzzleVictoryFX('sequence', this.getRelayPuzzlePerformance().grade),
              this.solveRelayGate()));
        }));
    }
  }
  createMissionTilesPuzzle() {
    const e = this.createMissionPuzzleState(),
      t = this.relayPuzzleUI,
      i = this.scale.width,
      s = this.scale.height,
      a = e.difficulty,
      l = a >= 3 ? 5 : 4,
      r = Math.min(46, Math.min(i - 100, 300) / l),
      o = i / 2 - ((l - 1) * r) / 2,
      n = s / 2 - (2 * r) / 2,
      h = [
        [0, 1, 2, 3, 7, 11],
        [0, 1, 5, 6, 7, 11],
        [0, 4, 5, 9, 10, 11],
        [0, 1, 5, 9, 10, 11],
      ],
      d = h[Phaser.Math.Between(0, h.length - 1)];
    ((e.path = d), (e.pathIndex = 0), (e.routeLocked = !1));
    const c = [];
    for (let t = 0; t < 3 * l; t++) {
      const i = o + (t % l) * r,
        s = n + Math.floor(t / l) * r,
        a = this.add
          .rectangle(i, s, r - 6, r - 6, 663088, 0.96)
          .setStrokeStyle(1.8, 2584461, 0.9)
          .setScrollFactor(0)
          .setDepth(1003)
          .setInteractive({ useHandCursor: !0 });
      (e.puzzleObjects.push(a), c.push(a));
    }
    (d.forEach((e) => {
      c[e].setFillStyle(1193546, 1).setStrokeStyle(2.5, 9303295, 1);
    }),
      t.status?.setText('MEMORIZE ROUTE').setColor('#8df4ff'));
    const y = this.relayPuzzleSession;
    (this.time.delayedCall(a >= 3 ? 1e3 : 1400, () => {
      y === this.relayPuzzleSession &&
        this.relayPuzzleActive &&
        !t.solved &&
        (c.forEach((e) => {
          (e.setFillStyle(663088, 0.96), e.setStrokeStyle(1.8, 2584461, 0.9));
        }),
        (e.routeLocked = !0),
        t.status?.setText('ROUTE HIDDEN · NAVIGATE'));
    }),
      c.forEach((i, s) => {
        i.on('pointerdown', () => {
          if (t.solved || !e.routeLocked) return;
          const a = d[e.pathIndex];
          if (s !== a)
            return (
              (e.pathIndex = 0),
              c.forEach((e) => {
                (e.setFillStyle(663088, 0.96), e.setStrokeStyle(1.8, 2584461, 0.9));
              }),
              this.relayPuzzleAttempts++,
              void t.status?.setText('ROUTE LOST · RESET').setColor('#ff826e')
            );
          (this.relayPuzzleAttempts++,
            i.setFillStyle(1193546, 1).setStrokeStyle(2.5, 9303295, 1),
            e.pathIndex++,
            e.pathIndex >= d.length &&
              ((t.solved = !0),
              t.status?.setText('ROUTE ESTABLISHED').setColor('#8df4ff'),
              this.missionPuzzleVictoryFX('tiles', this.getRelayPuzzlePerformance().grade),
              this.solveRelayGate()));
        });
      }));
  }
  createMissionFrequencyPuzzle() {
    const e = this.createMissionPuzzleState(),
      t = this.relayPuzzleUI,
      i = this.scale.width,
      s = this.scale.height,
      a = e.difficulty >= 3 ? 4 : 3;
    ((e.targets = Array.from({ length: a }, () => Phaser.Math.Between(1, 5))),
      (e.values = Array.from({ length: a }, () => Phaser.Math.Between(1, 5))),
      e.values.every((t, i) => t === e.targets[i]) &&
        (e.values[0] = e.values[0] >= 5 ? 1 : e.values[0] + 1));
    const l = [],
      r = s / 2 - (58 * (a - 1)) / 2;
    for (let s = 0; s < a; s++) {
      const a = r + 58 * s,
        o = this.add
          .text(i / 2 - 125, a, `CH-${String(s + 1).padStart(2, '0')}`, {
            fontFamily: 'Orbitron',
            fontSize: '10px',
            color: '#91a9b7',
            fontStyle: 'bold',
          })
          .setOrigin(1, 0.5)
          .setScrollFactor(0)
          .setDepth(1004),
        n = this.add
          .text(i / 2 + 110, a - 16, `TARGET ${e.targets[s]}`, {
            fontFamily: 'Orbitron',
            fontSize: '8px',
            color: '#8df4ff',
          })
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(1004),
        h = this.add
          .rectangle(i / 2, a, 190, 34, 663088, 0.96)
          .setStrokeStyle(2, 2584461, 0.9)
          .setScrollFactor(0)
          .setDepth(1003)
          .setInteractive({ useHandCursor: !0 }),
        d = this.add
          .text(i / 2, a, `FREQ ${e.values[s]}`, {
            fontFamily: 'Orbitron',
            fontSize: '11px',
            color: '#8df4ff',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(1004);
      (e.puzzleObjects.push(o, n, h, d),
        l.push({ button: h, value: d, target: e.targets[s], index: s }),
        h.on('pointerdown', () => {
          if (t.solved) return;
          ((e.values[s] = e.values[s] >= 5 ? 1 : e.values[s] + 1),
            d.setText(`FREQ ${e.values[s]}`),
            this.relayPuzzleAttempts++,
            h.setStrokeStyle(2.4, e.values[s] === e.targets[s] ? 9303295 : 2584461, 1));
          e.values.every((t, i) => t === e.targets[i])
            ? ((t.solved = !0),
              t.status?.setText('FREQUENCY LOCKED').setColor('#8df4ff'),
              this.missionPuzzleVictoryFX('frequency', this.getRelayPuzzlePerformance().grade),
              this.solveRelayGate())
            : t.status?.setText('TUNE ALL CHANNELS').setColor('#8df4ff');
        }));
    }
    t.status?.setText('TUNE SIGNAL INTO TARGET BANDS').setColor('#8df4ff');
  }
  createMissionGridPuzzle() {
    const e = this.createMissionPuzzleState(),
      t = this.relayPuzzleUI,
      i = this.scale.width,
      s = this.scale.height,
      a = e.difficulty >= 3 ? 5 : 4,
      l = Math.min(42, Math.min(i - 90, 260) / a),
      r = i / 2 - ((a - 1) * l) / 2,
      o = s / 2 - ((a - 1) * l) / 2,
      n = [];
    for (let e = 0; e < a; e++) n.push(e * a);
    for (let e = 1; e < a; e++) n.push(e * a + (a - 1));
    ((e.route = n), (e.routeIndex = 0), (e.routeLocked = !1));
    const h = [];
    for (let t = 0; t < a * a; t++) {
      const i = t % a,
        s = Math.floor(t / a),
        n = this.add
          .rectangle(r + i * l, o + s * l, l - 5, l - 5, 663088, 0.96)
          .setStrokeStyle(1.5, 2584461, 0.9)
          .setScrollFactor(0)
          .setDepth(1003)
          .setInteractive({ useHandCursor: !0 });
      (e.puzzleObjects.push(n), h.push(n));
    }
    (n.forEach((e) => {
      h[e].setFillStyle(1193546, 1).setStrokeStyle(2.4, 9303295, 1);
    }),
      t.status?.setText('SECURITY PATH DETECTED').setColor('#8df4ff'));
    const d = this.relayPuzzleSession;
    (this.time.delayedCall(e.difficulty >= 3 ? 1e3 : 1350, () => {
      d === this.relayPuzzleSession &&
        this.relayPuzzleActive &&
        !t.solved &&
        (h.forEach((e) => {
          (e.setFillStyle(663088, 0.96), e.setStrokeStyle(1.5, 2584461, 0.9));
        }),
        (e.routeLocked = !0),
        t.status?.setText('GRID ARMED · FIND SAFE PATH'));
    }),
      h.forEach((i, s) => {
        i.on('pointerdown', () => {
          if (t.solved || !e.routeLocked) return;
          const a = n[e.routeIndex];
          if ((this.relayPuzzleAttempts++, s !== a))
            return (
              (e.routeIndex = 0),
              h.forEach((e) => {
                (e.setFillStyle(663088, 0.96), e.setStrokeStyle(1.5, 2584461, 0.9));
              }),
              void t.status?.setText('INTRUSION DETECTED · RESET').setColor('#ff826e')
            );
          (i.setFillStyle(1193546, 1).setStrokeStyle(2.6, 9303295, 1),
            e.routeIndex++,
            e.routeIndex >= n.length &&
              ((t.solved = !0),
              t.status?.setText('SECURITY BREACH PREVENTED').setColor('#8df4ff'),
              this.missionPuzzleVictoryFX('grid', this.getRelayPuzzlePerformance().grade),
              this.solveRelayGate()));
        });
      }));
  }
  createMissionFinalPuzzle() {
    const e = this.createMissionPuzzleState(),
      t = this.relayPuzzleUI,
      i = this.scale.width,
      s = this.scale.height;
    ((e.targetStates = [
      Phaser.Math.Between(0, 2),
      Phaser.Math.Between(0, 2),
      Phaser.Math.Between(0, 2),
    ]),
      (e.states = [
        Phaser.Math.Between(0, 2),
        Phaser.Math.Between(0, 2),
        Phaser.Math.Between(0, 2),
      ]),
      e.states.every((t, i) => t === e.targetStates[i]) && (e.states[0] = (e.states[0] + 1) % 3));
    const a = [],
      l = i / 2 - 105;
    for (let i = 0; i < 3; i++) {
      const r = l + 105 * i,
        o = this.add
          .circle(r, s / 2, 34, 663088, 0.96)
          .setStrokeStyle(2.5, 2584461, 0.95)
          .setScrollFactor(0)
          .setDepth(1003)
          .setInteractive({ useHandCursor: !0 }),
        n = this.add
          .text(r, s / 2, 'SYNC 0', {
            fontFamily: 'Orbitron',
            fontSize: '9px',
            color: '#8df4ff',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(1004),
        h = this.add
          .text(r, s / 2 + 56, `TARGET ${e.targetStates[i]}`, {
            fontFamily: 'Orbitron',
            fontSize: '8px',
            color: '#91a9b7',
          })
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(1004);
      (e.puzzleObjects.push(o, n, h),
        a.push({ core: o, value: n, target: h, index: i }),
        o.on('pointerdown', () => {
          if (t.solved) return;
          ((e.states[i] = (e.states[i] + 1) % 3),
            n.setText(`SYNC ${e.states[i]}`),
            this.relayPuzzleAttempts++);
          const s = e.states[i] === e.targetStates[i];
          (o.setStrokeStyle(2.8, s ? 9303295 : 2584461, 1),
            s
              ? (t.status
                  ?.setText(`CORE ${String(i + 1).padStart(2, '0')} // SYNCHRONIZED`)
                  .setColor('#8df4ff'),
                this.tweens.killTweensOf(o),
                this.motionReduced ||
                  this.tweens.add({
                    targets: core,
                    scaleX: 1.16,
                    scaleY: 1.16,
                    duration: 110,
                    yoyo: !0,
                    ease: 'Quad.out',
                  }))
              : t.status
                  ?.setText(`CORE ${String(i + 1).padStart(2, '0')} // RESYNC REQUIRED`)
                  .setColor('#ff826e'),
            core.setFillStyle(s ? 1587274 : 663088, 1),
            core.setStrokeStyle(s ? 3.2 : 2, s ? 16765038 : 2846607, 1),
            s &&
              !this.motionReduced &&
              (this.tweens.killTweensOf(core),
              this.tweens.add({
                targets: core,
                scaleX: 1.12,
                scaleY: 1.12,
                duration: 90,
                yoyo: !0,
                ease: 'Quad.out',
              })));
          e.states.every((t, i) => t === e.targetStates[i])
            ? ((t.solved = !0),
              t.status?.setText('APEX RELAY // FULL SYNC').setColor('#fff0a8'),
              a.forEach((e) => {
                e?.core &&
                  (e.core.setStrokeStyle(3.2, 16765038, 1),
                  e.core.setFillStyle(1587274, 1),
                  this.motionReduced ||
                    (this.tweens.killTweensOf(e.core),
                    this.tweens.add({
                      targets: e.core,
                      scaleX: 1.22,
                      scaleY: 1.22,
                      duration: 160,
                      delay: 80 * e.index,
                      yoyo: !0,
                      ease: 'Cubic.out',
                    })));
              }),
              this.missionPuzzleVictoryFX('final', this.getRelayPuzzlePerformance().grade),
              this.solveRelayGate())
            : t.status?.setText('SYNCHRONIZE ALL CORE NODES').setColor('#8df4ff');
        }));
    }
    t.status?.setText('FINAL PROTOCOL // SYNCHRONIZE CORES').setColor('#8df4ff');
  }
  rotateRelayMask(e, t = 1) {
    const i = ((Number(t) % 4) + 4) % 4;
    let s = e;
    for (let e = 0; e < i; e++) {
      let e = 0;
      (1 & s && (e |= 2), 2 & s && (e |= 4), 4 & s && (e |= 8), 8 & s && (e |= 1), (s = e));
    }
    return s;
  }
  relayCircuitReachable(e, t, i) {
    const s = t * i;
    if (!Array.isArray(e) || e.length !== s) return new Set();
    const a = 1,
      l = 2,
      r = 4,
      o = 8,
      n = [0],
      h = new Set([0]),
      d = { [a]: 4, [l]: 8, [r]: 1, [o]: 2 },
      c = [
        [1, 0, -1],
        [2, 1, 0],
        [4, 0, 1],
        [8, -1, 0],
      ];
    for (; n.length;) {
      const s = n.shift(),
        a = Math.floor(s / t),
        l = s % t;
      for (const [r, o, y] of c) {
        if (!(e[s] & r)) continue;
        const c = l + o,
          p = a + y;
        if (c < 0 || c >= t || p < 0 || p >= i) continue;
        const f = p * t + c;
        e[f] & d[r] && (h.has(f) || (h.add(f), n.push(f)));
      }
    }
    return h;
  }
  generateRelayPuzzle() {
    const e = Number(this.relayPuzzleGate?.getData('difficulty')) || 1,
      t = e >= 3 ? 5 : 4,
      i = e >= 3 || 2 === e ? 3 : 2,
      s = t * i,
      a = Array(s).fill(0),
      l = [];
    for (let e = 0; e < i; e++)
      if (e % 2 == 0) for (let i = 0; i < t; i++) l.push(e * t + i);
      else for (let i = t - 1; i >= 0; i--) l.push(e * t + i);
    const r = (e, i) => {
      const s = Math.floor(e / t),
        a = e % t,
        l = Math.floor(i / t),
        r = i % t;
      return l === s - 1 && r === a
        ? 1
        : l === s && r === a + 1
          ? 2
          : l === s + 1 && r === a
            ? 4
            : l === s && r === a - 1
              ? 8
              : 0;
    };
    for (let e = 0; e < l.length; e++) {
      const t = l[e],
        i = e > 0 ? l[e - 1] : null,
        s = e < l.length - 1 ? l[e + 1] : null;
      (null !== i && (a[t] |= r(t, i)), null !== s && (a[t] |= r(t, s)));
    }
    let o = [],
      n = [];
    const h = {
      1: { minRotated: 3, minQuarterTurns: 4 },
      2: { minRotated: 6, minQuarterTurns: 9 },
      3: { minRotated: 9, minQuarterTurns: 14 },
    }[Math.min(3, Math.max(1, e))];
    let d = !1;
    for (let e = 0; e < 80; e++) {
      const e = a.map(() => Phaser.Math.Between(0, 3));
      if (e.filter((e) => 0 !== e).length < h.minRotated) continue;
      if (e.reduce((e, t) => e + t, 0) < h.minQuarterTurns) continue;
      const l = a.map((t, i) => {
        let a = e[i];
        return (
          0 === i && 0 === a && (a = 1),
          i === s - 1 && 0 === a && (a = 1),
          (e[i] = a),
          this.rotateRelayMask(t, a)
        );
      });
      if (!this.relayCircuitReachable(l, t, i).has(s - 1)) {
        ((o = e), (n = l), (d = !0));
        break;
      }
    }
    if (!d) {
      const e = [
          a.map(() => 1),
          a.map((e, t) => (t % 2 == 0 ? 1 : 3)),
          a.map((e, t) => (t % 3 == 0 ? 2 : 1)),
          a.map((e, t) => (0 === t || t === s - 1 ? 1 : 2)),
        ],
        l =
          e.find((e) => {
            const l = a.map((t, i) => this.rotateRelayMask(t, e[i]));
            return !this.relayCircuitReachable(l, t, i).has(s - 1);
          }) || e[0];
      ((o = l), (n = a.map((e, t) => this.rotateRelayMask(e, o[t]))));
    }
    const c = o.reduce((e, t) => e + ((4 - t) % 4), 0);
    this.relayPuzzleData = {
      columns: t,
      rows: i,
      count: s,
      solvedMasks: a,
      rotations: o,
      masks: n,
      baselineAttempts: c,
    };
  }
  drawRelayCircuitState() {
    const e = this.relayPuzzleUI,
      t = this.relayPuzzleData;
    if (!e || !t) return;
    const i =
      t.tiles?.map((e) => {
        const t = this.rotateRelayMask(e.baseMask, e.rotation / 90);
        return ((e.currentMask = t), t);
      }) || [];
    t.masks = i;
    const s = this.relayCircuitReachable(i, t.columns, t.rows),
      a = t.count - 1;
    if (e.links) {
      e.links.clear();
      for (let a = 0; a < t.count; a++) {
        const l = Math.floor(a / t.columns),
          r = a % t.columns,
          o = t.originX + r * (t.tileSize + t.gap),
          n = t.originY + l * (t.tileSize + t.gap),
          h = i[a];
        if (2 & h && r < t.columns - 1 && 8 & i[a + 1]) {
          const i = s.has(a) && s.has(a + 1);
          (e.links.lineStyle(4, i ? 9303295 : 5627903, i ? 0.55 : 0.16),
            e.links.lineBetween(o + t.tileSize / 2, n, o + t.tileSize / 2 + t.gap, n));
        }
        if (4 & h && l < t.rows - 1 && 1 & i[a + t.columns]) {
          const i = n + t.tileSize + t.gap,
            l = s.has(a) && s.has(a + t.columns);
          (e.links.lineStyle(4, l ? 9303295 : 5627903, l ? 0.55 : 0.16),
            e.links.lineBetween(o, n + t.tileSize / 2, o, i - t.tileSize / 2));
        }
      }
    }
    return (
      e.tiles?.forEach((e, i) => {
        const a = s.has(i);
        ((e.connected = a),
          e.tile
            .setFillStyle(a ? 1193546 : 663088, a ? 0.98 : 0.96)
            .setStrokeStyle(a ? 2.2 : 1.5, a ? 9303295 : 2584461, a ? 0.95 : 0.8),
          e.core.setFillStyle(a ? 15269375 : 9303295, a ? 1 : 0.75),
          e.core.setScale(a ? 1.2 : 1),
          e.wire.clear());
        const l = e.currentMask;
        e.wire.lineStyle(a ? 4.5 : 3.5, a ? 9303295 : 5627903, a ? 0.92 : 0.28);
        const r = 0.39 * t.tileSize;
        (1 & l && e.wire.lineBetween(0, 0, 0, -r),
          2 & l && e.wire.lineBetween(0, 0, r, 0),
          4 & l && e.wire.lineBetween(0, 0, 0, r),
          8 & l && e.wire.lineBetween(0, 0, -r, 0));
      }),
      s.has(a)
        ? (e.status
            ?.setText(`PATH LINKED · ${this.relayPuzzleAttempts} INPUTS`)
            .setColor('#8df4ff'),
          e.solved ||
            ((e.solved = !0),
            this.missionPuzzleVictoryFX(
              this.relayPuzzleType,
              this.getRelayPuzzlePerformance().grade,
            ),
            this.solveRelayGate()),
          !0)
        : (e.status
            ?.setText(`SIGNAL ${s.size}/${t.count} · INPUTS ${this.relayPuzzleAttempts}`)
            .setColor(s.size > 1 ? '#8df4ff' : '#55dfff'),
          !1)
    );
  }
  createRelayCircuitPreview() {
    if (!this.relayPuzzleUI) return;
    this.generateRelayPuzzle();
    const e = this.scale.width,
      t = this.scale.height,
      i = this.relayPuzzleData,
      s = Math.min(10, Math.max(6, 0.014 * e)),
      a = Math.min(e - 86, 460),
      l = Math.min(0.48 * t, 290),
      r = Math.min(68, (a - (i.columns - 1) * s) / i.columns, (l - (i.rows - 1) * s) / i.rows);
    ((i.tileSize = r), (i.gap = s));
    const o = i.columns * r + (i.columns - 1) * s,
      n = i.rows * r + (i.rows - 1) * s;
    ((i.originX = e / 2 - o / 2 + r / 2), (i.originY = t / 2 - n / 2 + r / 2 + 8));
    const h = this.add
        .rectangle(e / 2, i.originY + n / 2, o + 34, n + 34, 397855, 0.82)
        .setStrokeStyle(1, 2584461, 0.32)
        .setScrollFactor(0)
        .setDepth(1001),
      d = this.add.graphics().setScrollFactor(0).setDepth(1002),
      c = this.add
        .text(i.originX - r / 2 - 12, i.originY, 'START', {
          fontFamily: 'Orbitron',
          fontSize: '9px',
          color: '#8df4ff',
          stroke: '#07111d',
          strokeThickness: 3,
          align: 'right',
        })
        .setOrigin(1, 0.5)
        .setScrollFactor(0)
        .setDepth(1004),
      y = i.count - 1,
      p = Math.floor(y / i.columns),
      f = y % i.columns,
      u = i.originX + f * (r + s),
      m = i.originY + p * (r + s),
      g = this.add
        .text(u + r / 2 + 12, m, 'END', {
          fontFamily: 'Orbitron',
          fontSize: '9px',
          color: '#8df4ff',
          stroke: '#07111d',
          strokeThickness: 3,
          align: 'left',
        })
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(1004);
    ((this.relayPuzzleUI.grid = h),
      (this.relayPuzzleUI.links = d),
      (this.relayPuzzleUI.startLabel = c),
      (this.relayPuzzleUI.endLabel = g));
    const S = this.add
        .circle(i.originX - r / 2 - 24, i.originY, 7, 9303295, 0.16)
        .setStrokeStyle(2, 9303295, 0.9)
        .setScrollFactor(0)
        .setDepth(1005),
      w = this.add
        .circle(u + r / 2 + 24, m, 7, 9303295, 0.16)
        .setStrokeStyle(2, 9303295, 0.9)
        .setScrollFactor(0)
        .setDepth(1005);
    ((this.relayPuzzleUI.startNode = S),
      (this.relayPuzzleUI.endNode = w),
      this.motionReduced ||
        this.tweens.add({
          targets: [S, w],
          scale: { from: 0.82, to: 1.28 },
          alpha: { from: 0.45, to: 1 },
          duration: 720,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
        }),
      (this.relayPuzzleUI.tiles = []));
    const x = [];
    for (let e = 0; e < i.count; e++) {
      const t = Math.floor(e / i.columns),
        a = e % i.columns,
        l = i.originX + a * (r + s),
        o = i.originY + t * (r + s),
        n = this.add
          .rectangle(l, o, r, r, 663088, 0.96)
          .setStrokeStyle(1.5, 2584461, 0.8)
          .setScrollFactor(0)
          .setDepth(1003)
          .setInteractive({ useHandCursor: !0 }),
        h = this.add.graphics().setPosition(l, o).setScrollFactor(0).setDepth(1004),
        d = this.add.circle(l, o, 4, 9303295, 0.86).setScrollFactor(0).setDepth(1005),
        c = {
          tile: n,
          wire: h,
          core: d,
          baseMask: i.solvedMasks[e],
          rotation: 90 * i.rotations[e],
          currentMask: 0,
          connected: !1,
        };
      (n.setData('relayIndex', e),
        n.on('pointerover', () => {
          this.relayPuzzleUI?.solved || (n.setStrokeStyle(2.4, 15269375, 1), d.setScale(1.35));
        }),
        n.on('pointerout', () => {
          this.relayPuzzleUI?.solved ||
            (n.setStrokeStyle(
              c.connected ? 2.2 : 1.5,
              c.connected ? 9303295 : 2584461,
              c.connected ? 0.95 : 0.8,
            ),
            d.setScale(c.connected ? 1.2 : 1));
        }),
        n.on('pointerdown', () => {
          this.relayPuzzleUI?.solved ||
            ((c.rotation = (c.rotation + 90) % 360),
            this.relayPuzzleAttempts++,
            this.tweens.killTweensOf(n),
            (n.angle = c.rotation),
            this.motionReduced ||
              this.tweens.add({
                targets: n,
                scaleX: 1.08,
                scaleY: 1.08,
                duration: 80,
                yoyo: !0,
                ease: 'Quad.out',
              }),
            this.tweens.add({
              targets: d,
              scaleX: 1.65,
              scaleY: 1.65,
              alpha: 0.25,
              duration: 140,
              yoyo: !0,
              ease: 'Quad.out',
            }),
            this.drawRelayCircuitState());
        }),
        (n.angle = c.rotation),
        x.push(c));
    }
    ((i.tiles = x), (this.relayPuzzleUI.tiles = x), this.drawRelayCircuitState());
  }
  validateRelayPuzzle() {
    return (
      !(!this.relayPuzzleUI || !this.relayPuzzleData || this.relayPuzzleUI.solved) &&
      this.drawRelayCircuitState()
    );
  }
  getRelayPuzzlePerformance() {
    const e = this.relayPuzzleData || {},
      t = this.relayPuzzleType || 'circuit',
      i = Number(e.difficulty ?? this.relayPuzzleGate?.getData?.('difficulty')) || 1,
      s = Math.max(0, Number(this.relayPuzzleAttempts) || 0),
      a = Math.max(0, this.time.now - (this.relayPuzzleStartedAt || this.time.now));
    if ('circuit' === t && e?.rotations?.length) {
      const t = Math.max(1, Number(e.baselineAttempts) || 1),
        i = Phaser.Math.Clamp(t / Math.max(t, s), 0, 1);
      let l = 'C';
      return (
        s <= t && a <= 5500 ? (l = 'S') : i >= 0.88 && a <= 8e3 ? (l = 'A') : i >= 0.7 && (l = 'B'),
        { attempts: s, elapsedMs: a, baselineAttempts: t, efficiency: i, grade: l }
      );
    }
    let l = 1;
    switch (t) {
      case 'code': {
        const t = Array.isArray(e.code) ? e.code.length : i >= 3 ? 5 : 2 === i ? 4 : 3;
        l = Math.max(1, t);
        break;
      }
      case 'sequence': {
        const t = Array.isArray(e.sequence) ? e.sequence.length : i >= 3 ? 6 : 2 === i ? 5 : 4;
        l = Math.max(1, t);
        break;
      }
      case 'tiles': {
        const t = Array.isArray(e.path) ? e.path.length : 1;
        l = Math.max(1, t);
        break;
      }
      case 'frequency':
        ((l =
          Array.isArray(e.values) &&
          Array.isArray(e.targets) &&
          e.values.length === e.targets.length
            ? e.values.reduce((t, i, s) => {
                const a = Number(i) || 1;
                return t + (((Number(e.targets[s]) || 1) - a + 5) % 5);
              }, 0)
            : i >= 3
              ? 4
              : 3),
          (l = Math.max(1, l)));
        break;
      case 'grid': {
        const t = Array.isArray(e.route) ? e.route.length : i >= 3 ? 9 : 7;
        l = Math.max(1, t);
        break;
      }
      case 'final':
        ((l =
          Array.isArray(e.states) &&
          Array.isArray(e.targetStates) &&
          e.states.length === e.targetStates.length
            ? e.states.reduce((t, i, s) => {
                const a = Number(i) || 0;
                return t + (((Number(e.targetStates[s]) || 0) - a + 3) % 3);
              }, 0)
            : 3),
          (l = Math.max(1, l)));
        break;
      default:
        l = Math.max(1, i + 2);
    }
    const r = Phaser.Math.Clamp(l / Math.max(l, s), 0, 1),
      o =
        1e3 *
        ('code' === t
          ? i >= 3
            ? 5.5
            : 7
          : 'sequence' === t || 'tiles' === t
            ? i >= 3
              ? 7
              : 9
            : 'frequency' === t || 'grid' === t
              ? i >= 3
                ? 8
                : 10
              : 'final' === t
                ? i >= 3
                  ? 7
                  : 9
                : 8);
    let n = 'C';
    return (
      s <= l && a <= o
        ? (n = 'S')
        : r >= 0.88 && a <= 1.35 * o
          ? (n = 'A')
          : r >= 0.7 && a <= 1.9 * o && (n = 'B'),
      { attempts: s, elapsedMs: a, baselineAttempts: l, efficiency: r, grade: n }
    );
  }
  missionPuzzleVictoryFX(e = 'circuit', t = 'C') {
    const i = this.relayPuzzleUI;
    if (!i || this.motionReduced) return;
    const s = this.scale.width,
      a = this.scale.height,
      l = s / 2,
      r = a / 2,
      o = 'S' === t ? 16773288 : 'A' === t ? 9303295 : 'B' === t ? 11461503 : 16745070,
      n = this.add.circle(l, r, 10, o, 0.24).setScrollFactor(0).setDepth(1008);
    (n.setStrokeStyle(2, 15269375, 0.9),
      this.tweens.add({
        targets: n,
        scaleX: 7,
        scaleY: 7,
        alpha: 0,
        duration: 520,
        ease: 'Cubic.out',
        onComplete: () => n.destroy(),
      }));
    const h = this.add.circle(l, r, 24, o, 0).setScrollFactor(0).setDepth(1007);
    switch (
      (h.setStrokeStyle(2, o, 0.72),
      this.tweens.add({
        targets: h,
        scaleX: 4.8,
        scaleY: 4.8,
        alpha: 0,
        duration: 620,
        delay: 50,
        ease: 'Quad.out',
        onComplete: () => h.destroy(),
      }),
      e)
    ) {
      case 'code':
        for (let e = 0; e < 6; e++) {
          const t = (2 * Math.PI * e) / 6,
            i = this.add
              .rectangle(l, r, 4, 16, 9303295, 0.9)
              .setOrigin(0.5)
              .setRotation(t)
              .setScrollFactor(0)
              .setDepth(1009);
          this.tweens.add({
            targets: i,
            x: l + 105 * Math.cos(t),
            y: r + 105 * Math.sin(t),
            alpha: 0,
            scaleX: 0.25,
            scaleY: 1.8,
            duration: 420,
            ease: 'Cubic.out',
            onComplete: () => i.destroy(),
          });
        }
        break;
      case 'circuit': {
        const e =
          i.tiles
            ?.filter((e) => e?.connected && e.tile?.active)
            .map((e) => ({ x: e.tile.x, y: e.tile.y })) || [];
        if (e.length) {
          const t = this.add.graphics().setScrollFactor(0).setDepth(1006);
          (t.lineStyle(7, 9303295, 0.16),
            t.beginPath(),
            e.forEach((e, i) => {
              0 === i ? t.moveTo(e.x, e.y) : t.lineTo(e.x, e.y);
            }),
            t.strokePath(),
            t.closePath(),
            this.tweens.add({
              targets: t,
              alpha: { from: 0.25, to: 1 },
              duration: 120,
              yoyo: !0,
              repeat: 1,
              ease: 'Quad.out',
              onComplete: () => t.destroy(),
            }));
        }
        break;
      }
      case 'sequence':
        (i.sequenceButtons || []).forEach((e, t) => {
          this.time.delayedCall(60 * t, () => {
            if (!e?.active) return;
            const t = this.add.circle(e.x, e.y, 8, 9303295, 0.24).setScrollFactor(0).setDepth(1009);
            this.tweens.add({
              targets: t,
              scale: 3.2,
              alpha: 0,
              duration: 240,
              ease: 'Quad.out',
              onComplete: () => t.destroy(),
            });
          });
        });
        break;
      case 'tiles': {
        const e = this.add
          .rectangle(l - 0.35 * s, r, 8, 120, 9303295, 0.35)
          .setScrollFactor(0)
          .setDepth(1009);
        this.tweens.add({
          targets: e,
          x: l + 0.35 * s,
          alpha: 0,
          scaleY: 1.4,
          duration: 540,
          ease: 'Cubic.inOut',
          onComplete: () => e.destroy(),
        });
        break;
      }
      case 'frequency':
        [0, 90, 180].forEach((e, t) => {
          const i = this.add
            .circle(l, r, 18 + 12 * t, 10181887, 0)
            .setScrollFactor(0)
            .setDepth(1008);
          (i.setStrokeStyle(2, 12162047, 0.7),
            this.tweens.add({
              targets: i,
              scale: 3.8,
              alpha: 0,
              duration: 520,
              delay: e,
              ease: 'Sine.out',
              onComplete: () => i.destroy(),
            }));
        });
        break;
      case 'grid': {
        const e = this.add
          .rectangle(l, r, 0.72 * s, 3, 16745070, 0.55)
          .setScrollFactor(0)
          .setDepth(1009);
        this.tweens.add({
          targets: e,
          scaleX: 0.05,
          alpha: 0,
          duration: 360,
          ease: 'Cubic.out',
          onComplete: () => e.destroy(),
        });
        break;
      }
      case 'final': {
        const e = this.add.circle(l, r, 34, 16765038, 0.1).setScrollFactor(0).setDepth(1010);
        (e.setStrokeStyle(3, 16765038, 0.95),
          this.tweens.add({
            targets: e,
            scale: 4.6,
            alpha: 0,
            duration: 760,
            ease: 'Back.out',
            onComplete: () => e.destroy(),
          }),
          this.cameras.main.flash(150, 255, 215, 120),
          this.shake(120, 0.004));
        break;
      }
    }
    const d = this.add.circle(l, r, 6, o, 0.72).setScrollFactor(0).setDepth(1011);
    (this.tweens.add({
      targets: d,
      scale: 2.5,
      alpha: 0,
      duration: 260,
      ease: 'Quad.out',
      onComplete: () => d.destroy(),
    }),
      this.cameras.main.flash(
        'S' === t ? 140 : 100,
        'S' === t ? 255 : 120,
        'S' === t ? 220 : 210,
        180,
      ),
      this.shake('S' === t ? 105 : 70, 'S' === t ? 0.0035 : 0.0025),
      this.gadgetPulse(o, 'S' === t ? 18 : 14, 'S' === t ? 520 : 380));
  }
  showRelayPuzzleResult(e = {}) {
    if (this.gameOverUI || this.missionMedalsUI) return;
    if (this.relayPuzzleResultUI) return;
    const t = this.scale.width,
      i = this.scale.height,
      s = this.relayPuzzleType || 'circuit',
      a = this.getRelayPuzzleMeta(s),
      l = e.grade || 'C',
      r = 'S' === l ? '#fff0a8' : 'A' === l ? '#8df4ff' : 'B' === l ? '#aee37f' : '#ff826e',
      o = Math.round(100 * Phaser.Math.Clamp(Number(e.efficiency) || 0, 0, 1)),
      n = `${(Math.max(0, Number(e.elapsedMs) || 0) / 1e3).toFixed(2)}s`,
      h = Math.max(0, Number(e.attempts) || 0),
      d = Math.max(1, Number(e.baselineAttempts) || 1),
      c = Math.min(t - 34, 360),
      y = Math.min(i - 40, 250),
      p = t / 2,
      f = i / 2,
      u = this.add
        .rectangle(p, f, c, y, 330004, 0.97)
        .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(r).color, 0.82)
        .setScrollFactor(0)
        .setDepth(140),
      m = this.add
        .rectangle(p, f - y / 2 + 7, c - 18, 2, Phaser.Display.Color.HexStringToColor(r).color, 0.8)
        .setScrollFactor(0)
        .setDepth(141),
      g = this.add
        .text(p, f - y / 2 + 29, 'PUZZLE COMPLETE', {
          fontFamily: 'Orbitron',
          fontSize: t < 600 ? '11px' : '13px',
          fontStyle: 'bold',
          color: '#dffcff',
          stroke: '#08101c',
          strokeThickness: 4,
          align: 'center',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(141),
      S = this.add
        .text(p, f - y / 2 + 51, a.title, {
          fontFamily: 'Orbitron',
          fontSize: t < 600 ? '9px' : '11px',
          color: '#6f849d',
          align: 'center',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(141),
      w = this.add
        .circle(p, f - 15, t < 600 ? 38 : 43, Phaser.Display.Color.HexStringToColor(r).color, 0.1)
        .setScrollFactor(0)
        .setDepth(140);
    w.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(r).color, 0.55);
    const x = [
      u,
      m,
      g,
      S,
      w,
      this.add
        .text(p, f - 15, l, {
          fontFamily: 'Orbitron',
          fontSize: t < 600 ? '54px' : '62px',
          fontStyle: 'bold',
          color: r,
          stroke: '#08101c',
          strokeThickness: 8,
          align: 'center',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(142),
      this.add
        .text(
          p,
          f + 46,
          [`ATTEMPTS     ${h}/${d}`, `TIME         ${n}`, `EFFICIENCY   ${o}%`].join('\n'),
          {
            fontFamily: 'Orbitron',
            fontSize: t < 600 ? '9px' : '10px',
            color: '#dffcff',
            stroke: '#08101c',
            strokeThickness: 3,
            lineSpacing: 6,
            align: 'left',
          },
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(142),
      this.add
        .text(p, f + y / 2 - 23, 'RELAY CHANNEL SYNCHRONIZED', {
          fontFamily: 'Orbitron',
          fontSize: t < 600 ? '7px' : '8px',
          color: '#8ba0b8',
          align: 'center',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(142),
    ];
    (x.forEach((e) => {
      e.setAlpha(0).setScale(0.88);
    }),
      (this.relayPuzzleResultUI = x),
      this.tweens.add({
        targets: x,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 320,
        ease: 'Back.out',
      }),
      this.motionReduced ||
        (this.tweens.add({
          targets: w,
          scale: 1.7,
          alpha: 0,
          duration: 760,
          ease: 'Quad.out',
          repeat: 1,
        }),
        this.cameras.main.flash(
          'S' === l ? 130 : 90,
          'S' === l ? 255 : 120,
          'B' === l ? 210 : 235,
          150,
        )));
    const b = this.relayPuzzleSession;
    this.time.delayedCall(1250, () => {
      b === this.relayPuzzleSession &&
        this.relayPuzzleResultUI &&
        this.tweens.add({
          targets: this.relayPuzzleResultUI,
          alpha: 0,
          scaleX: 0.96,
          scaleY: 0.96,
          duration: 240,
          ease: 'Quad.in',
          onComplete: () => {
            (this.relayPuzzleResultUI?.forEach((e) => e.destroy()),
              (this.relayPuzzleResultUI = null));
          },
        });
    });
  }
  solveRelayGate() {
    const e = this.relayPuzzleGate;
    if (!e || e.getData('solved')) return;
    (e.setData('solved', !0), e.setData('puzzleOpen', !1));
    const t = this.getRelayPuzzlePerformance();
    this.relayPuzzlePerformanceGrade = t.grade;
    const i = 'S' === t.grade ? 20 : 'A' === t.grade ? 15 : 'B' === t.grade ? 10 : 6;
    (this.addPolarity(i, `relay:${t.grade}`), e.setData('relayPerformance', t));
    const s = e.getData('core'),
      a = e.getData('lock'),
      l = e.getData('status'),
      r = e.getData('label');
    (a &&
      (this.tweens.killTweensOf(a), a.setFillStyle(9303295, 0.2).setStrokeStyle(2, 9303295, 0.95)),
      l &&
        (this.tweens.killTweensOf(l), l.setFillStyle(9303295, 1).setStrokeStyle(1, 15269375, 0.95)),
      r &&
        r
          .setText(`RELAY ONLINE // ${String(e.getData('index') + 1).padStart(2, '0')}`)
          .setColor('#8df4ff'));
    const o = e.getData('relayPerformance') || {},
      n =
        'S' === o.grade
          ? '#fff0a8'
          : 'A' === o.grade
            ? '#8df4ff'
            : 'B' === o.grade
              ? '#aee37f'
              : '#ff826e';
    (this.relayPuzzleUI?.status
      ?.setText(`ACCESS GRANTED · ${o.grade}-RANK · ${o.attempts} INPUTS`)
      .setColor(n),
      this.playerCue(`RELAY GATE UNLOCKED  //  ${o.grade}-RANK`, n));
    const h = this.relayPuzzleSession;
    (this.time.delayedCall(140, () => {
      h === this.relayPuzzleSession && this.showRelayPuzzleResult(o);
    }),
      this.gadgetPulse(9303295, 16, 420),
      this.shake(90, 0.003),
      s &&
        !this.motionReduced &&
        this.tweens.add({
          targets: s,
          scaleX: 1.3,
          scaleY: 1.3,
          alpha: 0,
          duration: 420,
          ease: 'Cubic.out',
        }));
    const d = this.relayPuzzleSession;
    this.time.delayedCall(650, () => {
      d === this.relayPuzzleSession &&
        e?.active &&
        (e.body && (e.body.enable = !1),
        this.tweens.add({
          targets: [e, s, a, l, r].filter(Boolean),
          alpha: 0,
          duration: 360,
          ease: 'Cubic.in',
          onComplete: () => {
            d === this.relayPuzzleSession &&
              (e.setVisible(!1),
              s?.setVisible(!1),
              a?.setVisible(!1),
              l?.setVisible(!1),
              r?.setVisible(!1));
          },
        }));
    });
    const c = this.relayPuzzleSession;
    this.time.delayedCall(900, () => {
      c === this.relayPuzzleSession && this.closeRelayPuzzle();
    });
  }
  retryRelayPuzzle() {
    const e = this.relayPuzzleUI,
      t = this.relayPuzzleGate;
    e &&
      t &&
      this.relayPuzzleActive &&
      !e.solved &&
      (this.tweens.killTweensOf(
        [e.panel, e.inner, e.startNode, e.endNode, e.retry].filter(Boolean),
      ),
      e.tiles?.forEach((e) => {
        (e.tile?.destroy(), e.wire?.destroy(), e.core?.destroy());
      }),
      this.relayPuzzleData?.puzzleObjects?.forEach((e) => {
        e?.destroy?.();
      }),
      e.grid?.destroy(),
      e.links?.destroy(),
      e.startLabel?.destroy(),
      e.endLabel?.destroy(),
      e.startNode?.destroy(),
      e.endNode?.destroy(),
      (e.tiles = []),
      (e.grid = null),
      (e.links = null),
      (e.startLabel = null),
      (e.endLabel = null),
      (e.startNode = null),
      (e.endNode = null),
      (e.solved = !1),
      (this.relayPuzzleSession += 1),
      (this.relayPuzzleAttempts = 0),
      (this.relayPuzzleStartedAt = this.time.now),
      (this.relayPuzzleTimerBand = 0),
      (this.relayPuzzleData = null),
      e.status?.setText('LOCKED · NEW HANDSHAKE').setColor('#ff826e'),
      e.timer?.setText('TIME 00:00').setColor('#8df4ff'),
      this.createRelayPuzzleContent());
  }
  closeRelayPuzzle() {
    this.relayPuzzleSession += 1;
    const e = this.relayPuzzleUI;
    if (!e)
      return (
        (this.relayPuzzleActive = !1),
        (this.relayPuzzleGate = null),
        (this.relayPuzzleType = null),
        (this.relayPuzzleData = null),
        (this.relayNearbyGate = null),
        void (
          this.finished ||
          this.respawning ||
          this.cinematicActive ||
          this.afkCryostasisActive ||
          this.physics.resume()
        )
      );
    (this.tweens.killTweensOf(
      [e.panel, e.inner, e.startNode, e.endNode, ...(this.relayPuzzleResultUI || [])].filter(
        Boolean,
      ),
    ),
      this.relayPuzzleResultUI &&
        (this.relayPuzzleResultUI.forEach((e) => {
          e?.destroy?.();
        }),
        (this.relayPuzzleResultUI = null)),
      e.tiles?.forEach((e) => {
        (e.tile?.destroy(), e.wire?.destroy(), e.core?.destroy());
      }),
      this.relayPuzzleData?.puzzleObjects?.forEach((e) => {
        e?.destroy?.();
      }),
      e.overlay?.destroy(),
      e.panel?.destroy(),
      e.inner?.destroy(),
      e.title?.destroy(),
      e.subtitle?.destroy(),
      e.status?.destroy(),
      e.instruction?.destroy(),
      e.close?.destroy(),
      e.retry?.destroy(),
      e.timer?.destroy(),
      e.difficultyLabel?.destroy(),
      e.grid?.destroy(),
      e.links?.destroy(),
      e.startLabel?.destroy(),
      e.endLabel?.destroy(),
      e.startNode?.destroy(),
      e.endNode?.destroy(),
      (this.relayPuzzleUI = null),
      (this.relayPuzzleActive = !1),
      (this.relayPuzzleGate = null),
      (this.relayPuzzleType = null),
      (this.relayPuzzleData = null),
      (this.relayNearbyGate = null),
      (this.mobileDirection = null),
      Object.keys(this.mobileActions).forEach((e) => {
        this.mobileActions[e] = !1;
      }),
      this.finished ||
        this.respawning ||
        this.cinematicActive ||
        this.afkCryostasisActive ||
        this.physics.resume());
  }
  createRelayGates() {
    ((this.relayGates = this.physics.add.staticGroup()),
      this.mission.relayGates.forEach((e, t) => {
        const i = Number.isFinite(e?.x) ? e.x : this.mission.spawn.x + 1400,
          s = Number.isFinite(e?.y) ? e.y : this.mission.spawn.y,
          a = this.add
            .rectangle(i, s, 92, 190, 464421, 0.96)
            .setStrokeStyle(3, 16733028, 0.95)
            .setDepth(8);
        (this.physics.add.existing(a, !0),
          this.relayGates.add(a),
          a.body.setSize(92, 190),
          a.setData('index', t),
          a.setData('type', e?.type || 'circuit'),
          a.setData('difficulty', Number.isFinite(e?.difficulty) ? e.difficulty : 1),
          a.setData('solved', !1),
          a.setData('puzzleOpen', !1));
        const l = this.add
          .rectangle(i, s, 54, 142, 1058362, 0.92)
          .setStrokeStyle(1, 9303295, 0.58)
          .setDepth(8);
        a.setData('core', l);
        const r = this.add
          .circle(i, s, 18, 16733028, 0.16)
          .setStrokeStyle(2, 16745070, 0.9)
          .setDepth(9);
        a.setData('lock', r);
        const o = this.add
          .circle(i, s - 72, 5, 16733028, 0.9)
          .setStrokeStyle(1, 16766405, 0.8)
          .setDepth(9);
        a.setData('status', o);
        const n = this.add
          .text(i, s - 112, `RELAY GATE // ${String(t + 1).padStart(2, '0')}`, {
            fontFamily: 'Orbitron',
            fontSize: '10px',
            color: '#ff826e',
            stroke: '#08101c',
            strokeThickness: 3,
            align: 'center',
          })
          .setOrigin(0.5)
          .setDepth(9);
        a.setData('label', n);
        const h = this.add.zone(i, s, 150, 230).setOrigin(0.5).setDepth(7);
        (h.setData('gate', a),
          a.setData('interaction', h),
          this.motionReduced ||
            (this.tweens.add({
              targets: r,
              scale: { from: 0.9, to: 1.28 },
              alpha: { from: 0.8, to: 0.28 },
              duration: 720,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
            }),
            this.tweens.add({
              targets: o,
              alpha: { from: 0.35, to: 1 },
              duration: 540,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
            })));
      }));
  }
  createMovingGates() {
    ((this.movingGates = this.physics.add.group()),
      this.mission.movingGates.forEach(([e, t, i, s], a) => {
        const l = this.movingGates.create(e, t, 'barrier').setImmovable(!0).setDepth(8);
        (l.body.setAllowGravity(!1),
          l.setData('homeY', t),
          this.tweens.add({
            targets: l,
            y: a % 2 ? s : i,
            duration: 1600 + 240 * a,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
          }));
      }),
      this.physics.add.overlap(
        this.player,
        this.movingGates,
        () => this.fail('A security gate sealed the relay route.'),
        void 0,
        this,
      ));
  }
  createEnemies() {
    ((this.enemies = this.physics.add.group()),
      this.mission.enemies.forEach((e) => {
        const t = Math.max(Number(e.x) || this.mission.spawn.x, this.mission.spawn.x + 560),
          i = new Set([
            'enemy-runner',
            'chicken',
            'dino',
            'alien-ground',
            'invader',
            'security',
            'guard',
            'dino-boss',
            'sentinel-boss',
            'storm-boss',
            'apex-boss',
          ]).has(e?.type)
            ? e.type
            : 'enemy-runner',
          s = this.enemies
            .create(t, Number(e?.y) || this.mission.spawn.y, i)
            .setDepth(8)
            .setImmovable(!0);
        (s.setData('health', 1),
          s.setData('boss', !1),
          s.setData('combatDefeated', !1),
          s.setData('aiState', 'IDLE'),
          s.setData('patrolOriginX', s.x),
          s.setData('aiTimer', 0),
          s.setData('lastKnownX', s.x),
          s.setData('lastKnownY', s.y));
        const a = this.add
          .circle(s.x, s.y - 30, 5, 16745070, 0.28)
          .setStrokeStyle(1, 16766405, 0.7)
          .setDepth(7);
        s.body.setAllowGravity(!1);
        const l = Number(e.x) || this.mission.spawn.x,
          r = t - l,
          o = Number.isFinite(e.min) ? e.min : l - 90,
          n = Number.isFinite(e.max) ? e.max : l + 90,
          h = Math.max(this.mission.spawn.x + 560, o + r),
          d = Math.max(h + 40, n + r);
        (s.setData('route', { ...e, type: i, min: h, max: d }),
          s.setData('direction', 1),
          s.setData('indicator', a));
      }));
  }
  createSciFiThreats() {
    const e = Number(String(this.mission?.difficulty ?? '1').split('/')[0]) || 1;
    ((this.eggs = this.physics.add.group()), (this.comets = this.physics.add.group()));
    const t = (e, t, i) => {
        const s = this.enemies.create(t, i, e).setDepth(8).setImmovable(!0);
        s.setData('health', 1);
        const a = this.add
          .circle(t, i - 34, 5, 16745070, 0.28)
          .setStrokeStyle(1, 16766405, 0.7)
          .setDepth(7);
        return (
          s.body.setAllowGravity(!1),
          s.setData('route', { type: e, min: t - 90, max: t + 90 }),
          s.setData('direction', 1),
          s.setData('patrolDirection', 1),
          s.setData('nextShot', 500),
          'chicken' === e &&
            (s.setData('fireNext', 0),
            s.setData('fireUntil', 0),
            s.setData('fireNextDamage', 0),
            s.setData('fireHitLock', 0),
            s.setData('fireAngle', 0),
            s.setData('fireFx', null)),
          s.setData('indicator', a),
          s
        );
      },
      i = this.mission.spawn.x,
      s =
        (t('enemy-runner', i + 620, this.mission.spawn.y),
        t('chicken', i + 700, this.mission.spawn.y + 10),
        this.mission.goal.x - i),
      a =
        e >= 5
          ? ['enemy-runner', 'alien-ground', 'dino', 'invader', 'chicken', 'dino', 'invader']
          : e >= 3
            ? ['enemy-runner', 'alien-ground', 'dino', 'invader', 'enemy-runner']
            : ['enemy-runner', 'chicken', 'dino', 'alien-ground'];
    if (
      (a.forEach((e, l) => {
        const r = i + 1040 + (l * (s - 1240)) / Math.max(1, a.length - 1);
        r < this.mission.goal.x - 140 &&
          t(
            e,
            r,
            'invader' === e ? Math.max(180, this.mission.spawn.y - 120) : this.mission.spawn.y,
          );
      }),
      this.mission.boss)
    ) {
      const e = this.mission.boss;
      if (
        ((this.boss = t(e.type, this.mission.goal.x - 250, this.mission.spawn.y - 12)),
        this.boss.setTint(Number.isFinite(e.color) ? e.color : 16745070),
        this.boss.setData('health', Math.max(1, Number(e.health) || 1)),
        this.boss.setData('boss', !0),
        this.boss.setData('bossName', e.name),
        this.boss.setData('bossColor', e.color),
        this.motionReduced ||
          this.tweens.add({
            targets: this.boss,
            alpha: { from: 0.92, to: 1 },
            duration: 720,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
          }),
        this.boss.setData('attackCooldown', e.attackCooldown),
        'first-delivery' === this.mission.id)
      ) {
      }
      (this.physics.add.overlap(
        this.player,
        this.eggs,
        (e, t) => {
          if (this.dashTimer > 0 && this.perfectDodgeWindow > 0)
            return (t.destroy(), void this.registerPerfectDodge());
          (t.destroy(), this.takeSciFiHit('A chicken egg knocked the courier down.', t.x, t.y));
        },
        void 0,
        this,
      ),
        this.physics.add.overlap(
          this.player,
          this.comets,
          (e, t) => {
            if (this.dashTimer > 0 && this.perfectDodgeWindow > 0)
              return (t.getData('trail')?.destroy(), t.destroy(), void this.registerPerfectDodge());
            (t.getData('trail')?.destroy(),
              t.destroy(),
              this.takeSciFiHit('A falling comet struck the relay route.', t.x, t.y));
          },
          void 0,
          this,
        ),
        this.physics.add.overlap(
          this.player,
          this.enemies,
          (e, t) => {
            if (!(e?.active && t?.active && e.body && t.body)) return;
            if (this.afkCryostasisActive) return;
            if (this.safeStartZoneActive) {
              const t = this.safeStartZone;
              if (e.x >= t.x && e.x <= t.x + t.width && Math.abs(e.y - t.y) <= t.height) return;
              ((this.safeStartZoneActive = !1),
                this.safeStartZoneWarned ||
                  ((this.safeStartZoneWarned = !0),
                  this.playerCue('SAFE ZONE EXITED · HOSTILE TERRITORY', '#ff826e')));
            }
            const i = e.body.bottom <= t.body.top + 22,
              s = e.y < t.y - 10,
              a = Number(e.body.velocity?.y || 0) >= 0,
              l = Math.abs(e.x - t.x) <= 58;
            i && s && a && l
              ? this.defeatEnemy(t, 'STOMP', 999)
              : this.takeSciFiHit('An enemy attack knocked the courier down.', t.x, t.y);
          },
          void 0,
          this,
        ));
    }
  }
  createBuildSystems() {
    ((this.shields = this.physics.add.staticGroup()),
      (this.kineticBalls = this.physics.add.group()),
      (this.plasma = this.physics.add.group()),
      (this.turrets = this.physics.add.group()),
      (this.springPads = this.physics.add.staticGroup()));
    const e = (e, t) => t.destroy();
    (this.physics.add.overlap(this.kineticBalls, this.barriers, (t, i) => {
      i.disableBody(!0, !0);
      const s = this.add.circle(i.x, i.y, 12, 9303295, 0.35).setDepth(12);
      (this.tweens.add({
        targets: s,
        scale: 3.5,
        alpha: 0,
        duration: 220,
        onComplete: () => s.destroy(),
      }),
        this.playerCue('BARRIER DESTROYED', '#8df4ff'),
        this.gadgetPulse(9303295, 10, 280),
        e(0, t));
    }),
      this.physics.add.overlap(this.kineticBalls, this.movingGates, (t, i) => {
        i.disableBody(!0, !0);
        const s = this.add.circle(i.x, i.y, 12, 16745070, 0.35).setDepth(12);
        (this.tweens.add({
          targets: s,
          scale: 3.5,
          alpha: 0,
          duration: 220,
          onComplete: () => s.destroy(),
        }),
          this.playerCue('GATE DESTROYED', '#8df4ff'),
          this.gadgetPulse(9303295, 11, 300),
          e(0, t));
      }),
      this.physics.add.overlap(this.kineticBalls, this.enemies, (t, i) => {
        const s = this.add.circle(i.x, i.y, 11, 9303295, 0.34).setDepth(12);
        (this.tweens.add({
          targets: s,
          scale: 3.6,
          alpha: 0,
          duration: 210,
          onComplete: () => s.destroy(),
        }),
          this.shake(45, 0.002),
          this.defeatEnemy(i, 'KINETIC BALL', 2),
          e(0, t));
      }),
      this.physics.add.overlap(this.plasma, this.enemies, (e, t) => {
        if (!e?.active || !t?.active) return;
        const i = Number(e.getData('power')) || 1;
        (e.destroy(), this.defeatEnemy(t, 'BLASTER', Math.max(999, i)));
      }),
      this.physics.add.overlap(this.plasma, this.eggs, (e, t) => {
        (e.destroy(), t.destroy());
        const i = this.add.circle(t.x, t.y, 9, 9303295, 0.3).setDepth(12);
        (this.tweens.add({
          targets: i,
          scale: 3.2,
          alpha: 0,
          duration: 220,
          onComplete: () => i.destroy(),
        }),
          this.playerCue('SHOT DEFLECTED', '#8df4ff'),
          this.playerCue('+1 DEFLECT', '#b9f5ff'));
      }),
      this.physics.add.overlap(this.plasma, this.comets, (e, t) => {
        (e.destroy(), t.getData?.('trail')?.destroy?.(), t.destroy?.());
        const i = this.add.circle(t.x, t.y, 10, 9303295, 0.3).setDepth(12);
        (this.tweens.add({
          targets: i,
          scale: 3.4,
          alpha: 0,
          duration: 230,
          onComplete: () => i.destroy(),
        }),
          this.playerCue('BOLT DEFLECTED', '#8df4ff'),
          this.playerCue('+1 DEFLECT', '#b9f5ff'));
      }),
      this.physics.add.overlap(this.eggs, this.shields, (e, t) => {
        e.destroy();
        const i = this.add.circle(t.x, t.y, 10, 9303295, 0.28).setDepth(12);
        (this.tweens.add({
          targets: i,
          scale: 3,
          alpha: 0,
          duration: 200,
          onComplete: () => i.destroy(),
        }),
          this.playerCue('SHIELD BLOCK', '#8df4ff'),
          this.gadgetPulse(9303295, 9, 260));
      }),
      this.physics.add.overlap(this.comets, this.shields, (e, t) => {
        (e.getData?.('trail')?.destroy?.(), e.destroy?.());
        const i = this.add.circle(t.x, t.y, 10, 9303295, 0.28).setDepth(12);
        this.tweens.add({
          targets: i,
          scale: 3,
          alpha: 0,
          duration: 200,
          onComplete: () => i.destroy(),
        });
      }),
      this.physics.add.overlap(this.player, this.springPads, () => {
        const e = this.player?.body;
        if (!e || !this.player?.active || this.afkCryostasisActive || this.boostCooldown > 0)
          return;
        ((this.boostCooldown = 260),
          e.setVelocityY(-880),
          this.playerCue('SPRING LAUNCH', '#aee37f'),
          this.gadgetPulse(11461503, 12, 320));
        const t = this.add
          .circle(this.player.x, this.player.y + 18, 10, 11461503, 0.32)
          .setDepth(11);
        (this.tweens.add({
          targets: t,
          scale: 3.4,
          alpha: 0,
          duration: 260,
          onComplete: () => t.destroy(),
        }),
          this.playerCue('SPRING PAD', '#aee37f'));
      }));
  }
  addPolarity(e, t = 'unknown') {
    const i = Number(e);
    if (!Number.isFinite(i) || 0 === i) return;
    const s = this.polarity;
    ((this.polarity = Phaser.Math.Clamp(this.polarity + i, 0, this.polarityMax)),
      i > 0 ? (this.polarityStats.gained += i) : (this.polarityStats.spent += Math.abs(i)),
      (this.polarityStats.peak = Math.max(this.polarityStats.peak, this.polarity)),
      (this.polarityDecayTimer = this.polarityDecayDelay),
      this.updatePolarityState(),
      this.game.events.emit('polarity', this.polarity, this.polarityMax, t),
      s < this.polarityMax &&
        this.polarity >= this.polarityMax &&
        this.game.events.emit('polarity-full', this.polarity));
  }
  consumePolarity(e, t = 'ability') {
    const i = Math.max(0, Number(e) || 0);
    return (
      !(!i || this.polarity < i) &&
      ((this.polarity -= i),
      (this.polarityStats.spent += i),
      this.updatePolarityState(),
      this.game.events.emit('polarity', this.polarity, this.polarityMax, t),
      !0)
    );
  }
  updatePolarityState() {
    const e = this.polarityState;
    let t = 'STABLE';
    (this.overdriveTimer > 0
      ? (t = 'OVERDRIVE')
      : this.polarity >= 75
        ? (t = 'CHARGED')
        : this.polarity <= 15 && (t = 'LOW'),
      (this.polarityState = t),
      e !== t &&
        ((this.polarityLastState = t), this.game.events.emit('polarity-state', t, this.polarity)));
  }
  updatePolarity(e) {
    !Number.isFinite(e) ||
      this.finished ||
      this.respawning ||
      ((this.polarityDecayTimer = Math.max(0, this.polarityDecayTimer - e)),
      this.overdriveTimer > 0
        ? ((this.polarity = this.polarityMax), this.updatePolarityState())
        : ('OVERDRIVE' === this.polarityState && this.updatePolarityState(),
          this.polarityDecayTimer <= 0 &&
            this.polarity > 0 &&
            ((this.polarity = Math.max(0, this.polarity - 0.015 * e)), this.updatePolarityState())),
      this._lastEmittedPolarity !== this.polarity &&
        ((this._lastEmittedPolarity = this.polarity),
        this.game.events.emit('polarity', this.polarity, this.polarityMax, 'tick')));
  }
  activatePolarityOverdrive() {
    return (
      !(this.overdriveTimer > 0 || this.polarity < this.polarityMax) &&
      ((this.overdriveTimer = Math.max(this.overdriveTimer, 4200)),
      this.updatePolarityState(),
      this.polarityStats.overdrives++,
      this.game.events.emit('polarity-overdrive', this.overdriveTimer),
      this.playerCue('POLARITY OVERDRIVE', '#ffd06e'),
      this.speakNarration('OVERDRIVE'),
      !0)
    );
  }
  breakPolarity() {
    return (
      !(this.overdriveTimer > 0) &&
      !!this.consumePolarity(100, 'polarity-break') &&
      (this.polarityStats.breaks++,
      this.game.events.emit('polarity-break'),
      this.playerCue('POLARITY BREAK', '#8df4ff'),
      !this.motionReduced &&
        this.graphicsLevel >= 2 &&
        (this.cameras.main.flash(100, 141, 244, 255), this.shake(90, 0.004)),
      !0)
    );
  }
  takeSciFiHit(e, t = this.player?.x ?? 0, i = this.player?.y ?? 0) {
    if (
      this.briefingProtected ||
      this.respawning ||
      this.finished ||
      this.healthInvulnerable > 0 ||
      this.afkCryostasisActive
    )
      return;
    const s = 'OVERDRIVE' === this.polarityState ? 18 : 'CHARGED' === this.polarityState ? 12 : 8;
    if (
      (this.addPolarity(-s, 'damage'),
      (this.health = Math.max(0, this.health - 1)),
      this.game.events.emit('health', this.health),
      1 === this.health && !this.motionReduced)
    ) {
      (this.playerCue('CRITICAL', '#ff826e'),
        this.graphicsLevel >= 2 && this.cameras.main.flash(120, 255, 70, 70),
        this.shake(120, 0.004));
      const e = this.add.circle(this.player.x, this.player.y, 20, 16745070, 0.2).setDepth(13);
      (e.setStrokeStyle(3, 16752783, 0.9),
        this.tweens.add({
          targets: e,
          scale: 4.4,
          alpha: 0,
          duration: 520,
          ease: 'Quad.out',
          onComplete: () => e.destroy(),
        }));
    }
    if (
      (this.health > 0 && (this.healthInvulnerable = 1100),
      !this.motionReduced && this.player?.active)
    ) {
      const e = t - this.player.x,
        s = i - this.player.y,
        a = Math.max(1, Math.hypot(e, s)),
        l = e / a,
        r = s / a,
        o = Phaser.Math.RadToDeg(Math.atan2(r, l)),
        n = this.add
          .triangle(this.player.x, this.player.y - 58, 0, -12, 7, 7, -7, 7, 16745070, 0.9)
          .setDepth(15)
          .setAngle(o + 90);
      (n.setStrokeStyle(1, 16767442, 0.85),
        this.tweens.add({
          targets: n,
          y: n.y - 9,
          alpha: 0,
          scaleX: 1.25,
          scaleY: 1.25,
          duration: 360,
          ease: 'Quad.out',
          onComplete: () => n.destroy(),
        }));
    }
    if (!this.motionReduced && this.graphicsLevel >= 2) {
      const e = this.add.circle(this.player.x, this.player.y, 11, 16745070, 0.28).setDepth(13);
      (e.setStrokeStyle(2, 16761528, 0.85),
        this.tweens.add({
          targets: e,
          scale: 3.8,
          alpha: 0,
          duration: 260,
          ease: 'Quad.out',
          onComplete: () => e.destroy(),
        }),
        this.player.setTint(16740200),
        this.time.delayedCall(90, () => {
          this.player?.active && this.health > 0 && this.player.clearTint();
        }),
        this.shake(85, 0.0035));
    }
    if (this.health <= 0)
      return void this.fail('The courier collapsed. Checkpoint health restored.', !0);
    const a = 1 === this.health ? 1.35 : 1;
    (this.showDizzyStars(a),
      !this.motionReduced && this.graphicsLevel >= 2 && this.cameras.main.flash(120, 255, 60, 60));
    const l = this.add.circle(this.player.x, this.player.y, 16, 16745070, 0.3).setDepth(11);
    (this.tweens.add({
      targets: l,
      scale: 3.2,
      alpha: 0,
      duration: 260,
      onComplete: () => l.destroy(),
    }),
      this.playerCue(`HIT · ${this.health} HEALTH`, '#ff9c91'),
      this.health > 0 &&
        this.health <= Math.ceil(0.25 * this.healthMax) &&
        this.speakNarration('LOW HEALTH'),
      this.shake(80, 0.006),
      this.game.events.emit('feedback', 'hit'));
  }
  useBuild(e) {
    if (this.finished || this.respawning || this.cinematicActive || this.relayPuzzleActive) return;
    const t = this.loadout.buildItems?.[e];
    if (!t || this.buildCooldowns[e] > 0) return;
    const i = this.player.flipX ? -1 : 1;
    if ('shield' === t) {
      const t = this.shields.create(this.player.x + 70 * i, this.player.y + 10, 'shield');
      (t.refreshBody(),
        this.time.delayedCall(4200, () => t.destroy()),
        this.playerCue('RELAY SHIELD BUILT', '#b9f5ff'),
        (this.buildCooldowns[e] = 9e3));
    }
    if ('kinetic-ball' === t) {
      const t = this.kineticBalls
        .create(this.player.x + 28 * i, this.player.y, 'kinetic-ball')
        .setDepth(12);
      (t.body
        .setAllowGravity(!1)
        .setCircle(11, 2, 2)
        .setVelocityX(780 * i),
        this.time.delayedCall(1400, () => t.destroy()),
        this.playerCue('KINETIC BALL', '#8df4ff'),
        (this.buildCooldowns[e] = 7e3));
    }
    if ('turret' === t) {
      const t = this.turrets
        .create(this.player.x + 90 * i, this.player.y + 14, 'turret')
        .setDepth(9)
        .setImmovable(!0);
      (t.body.setAllowGravity(!1),
        t.setData('expires', this.elapsedMs + 6500),
        t.setData('nextShot', 0),
        t.setData('target', null),
        t.setData('nextTargetCheck', 0),
        this.playerCue('ARC TURRET DEPLOYED', '#8df4ff'),
        (this.buildCooldowns[e] = 12e3));
    }
    if ('spring-pad' === t) {
      const t = this.springPads.create(this.player.x + 58 * i, this.player.y + 32, 'spring-pad');
      (t.refreshBody(),
        this.time.delayedCall(6e3, () => t.destroy()),
        this.playerCue('SPRING PAD BUILT', '#aee37f'),
        this.gadgetPulse(11461503, 10, 300),
        (this.buildCooldowns[e] = 8e3));
    }
  }
  defeatEnemy(e, t, i = 1) {
    if (!e || !e.active || !this.scene?.isActive?.()) return;
    if (!this.player || !this.player.active) return;
    if (!0 === e.getData('combatDefeated')) return;
    const s = e.getData('fireFx');
    (s && (s.destroy(), e.setData('fireFx', null)),
      e.setData('fireUntil', 0),
      e.setData('fireChargeUntil', 0),
      e.setData('fireNextDamage', 0),
      e.setData('fireHitLock', 0),
      e.setTint(16777215),
      this.time.delayedCall(90, () => {
        e?.active && e.clearTint();
      }),
      e.getData('boss') || this.game.events.emit('feedback', 'enemy_hit'));
    const a = this.add.circle(e.x, e.y, 10, 9303295, 0.28).setDepth(11);
    if (
      (this.tweens.add({
        targets: a,
        scale: 2.8,
        alpha: 0,
        duration: 180,
        onComplete: () => a.destroy(),
      }),
      !this.motionReduced && this.graphicsLevel >= 2)
    ) {
      const t = this.player.x < e.x ? -1 : 1,
        i = e.x + 8 * t,
        s = e.y - 2,
        a = this.add.graphics().setDepth(12);
      a.lineStyle(2, 14679295, 0.9);
      for (let e = 0; e < 5; e++) {
        const l = Phaser.Math.DegToRad(15 * e - 150),
          r = Phaser.Math.Between(14, 24);
        a.lineBetween(i, s, i + Math.cos(l) * r * t, s + Math.sin(l) * r);
      }
      this.tweens.add({
        targets: a,
        alpha: 0,
        scaleX: 0.55,
        scaleY: 0.55,
        duration: 135,
        ease: 'Quad.out',
        onComplete: () => a.destroy(),
      });
    }
    ((e.x += this.player.x < e.x ? 10 : -10), this.shake(55, 0.0025));
    const l = e.scaleX,
      r = e.scaleY;
    this.tweens.add({
      targets: e,
      scaleX: 1.12 * l,
      scaleY: 0.88 * r,
      duration: 55,
      yoyo: !0,
      ease: 'Quad.easeOut',
    });
    const o = Number(e.getData('health')) || 1,
      n = !0 === e.getData('boss');
    if (n) {
      (this.game.events.emit('feedback', 'boss_hit'),
        (this.bossHitCount = (this.bossHitCount || 0) + 1),
        (1 !== this.bossHitCount && this.bossHitCount % 5 != 0) ||
          this.speakNarration('BOSS ENGAGED'));
      const t = this.add
        .circle(e.x, e.y, 18, e.getData('bossColor') || 16745070, 0.32)
        .setDepth(12);
      (this.tweens.add({
        targets: t,
        scale: 3.6,
        alpha: 0,
        duration: 240,
        onComplete: () => t.destroy(),
      }),
        this.shake(75, 0.004));
    }
    const h = o - i * (this.combatCombo >= 5 ? 2 : this.combatCombo >= 3 ? 1.5 : 1);
    if (!0 === e.getData('boss') && h > 0 && h <= 0.25 * o && !0 !== e.getData('finalEnrage')) {
      (e.setData('finalEnrage', !0), e.setData('phase', 3));
      const t = Number(e.getData('attackCooldown')) || 1800;
      if (
        (e.setData('attackCooldown', 0.48 * t),
        this.playerCue('FINAL ENRAGE', '#ff4f5f'),
        this.speakNarration('FINAL ENRAGE'),
        this.gadgetPulse(16731999, 30, 900),
        !this.motionReduced && this.graphicsLevel >= 2)
      ) {
        (this.cameras.main.flash(220, 255, 60, 60), this.shake(260, 0.012));
        const t = this.add.circle(e.x, e.y, 28, 16731999, 0.26).setDepth(13);
        (t.setStrokeStyle(3, 16756912, 0.95),
          this.tweens.add({
            targets: t,
            scale: 6.2,
            alpha: 0,
            duration: 760,
            ease: 'Quad.out',
            onComplete: () => t.destroy(),
          }));
      }
      this.game.events.emit('feedback', 'boss_final_enrage');
    }
    if (n && !this.bossPhaseTwo && h > 0 && h <= 0.5 * o) {
      if (((this.bossPhaseTwo = !0), !this.motionReduced && this.graphicsLevel >= 2 && e?.active)) {
        const t = this.add
          .circle(e.x, e.y, 14, 16764802, 0.34)
          .setStrokeStyle(2, 16769192, 0.9)
          .setDepth(13);
        (this.tweens.add({
          targets: t,
          scaleX: 4.2,
          scaleY: 4.2,
          alpha: 0,
          duration: 360,
          ease: 'Quad.out',
          onComplete: () => {
            t?.active && t.destroy();
          },
        }),
          this.graphicsLevel >= 2 && this.cameras.main.flash(90, 255, 205, 110, !0));
      }
      (this.bossPhaseAura?.destroy(), this.bossPhaseAuraFollow?.remove());
      const t = e.getData('bossColor') || 16745070;
      ((this.bossPhaseAura = this.add.circle(e.x, e.y, 34, t, 0.12).setDepth(10)),
        this.bossPhaseAura.setStrokeStyle(2, 16764802, 0.72),
        this.motionReduced ||
          this.tweens.add({
            targets: this.bossPhaseAura,
            scale: { from: 0.86, to: 1.18 },
            alpha: { from: 0.1, to: 0.24 },
            duration: 520,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
          }),
        (this.bossPhaseAuraFollow = this.time.addEvent({
          delay: 16,
          loop: !0,
          callback: () => {
            if (!e.active || !this.bossPhaseAura)
              return (
                this.bossPhaseAuraFollow?.remove(),
                (this.bossPhaseAuraFollow = null),
                this.bossPhaseAura?.destroy(),
                void (this.bossPhaseAura = null)
              );
            ((this.bossPhaseAura.x = e.x),
              e.active &&
                !this.motionReduced &&
                (this.bossPhaseAura.y = e.y + 4 * Math.sin(0.0028 * this.time.now)),
              (this.bossPhaseAura.y =
                e.y + (this.motionReduced ? 0 : 4 * Math.sin(0.0028 * this.time.now))),
              (this.bossPhaseAura.y =
                e.y + (this.motionReduced ? 0 : 4 * Math.sin(0.0028 * this.time.now))));
          },
        })),
        e.setData('phase', 2),
        this.playerCue('PHASE 2 // INCOMING', '#ff826e'),
        this.gadgetPulse(16745070, 26, 760),
        !this.motionReduced &&
          this.graphicsLevel >= 2 &&
          this.cameras.main.flash(180, 255, 208, 110),
        this.shake(220, 0.009));
      const i = this.add.circle(e.x, e.y, 24, 16745070, 0.24).setDepth(13);
      (i.setStrokeStyle(3, 16764802, 0.95),
        this.tweens.add({
          targets: i,
          scale: 5.8,
          alpha: 0,
          duration: 680,
          ease: 'Quad.out',
          onComplete: () => i.destroy(),
        }));
    }
    if (
      (this.game.events.emit('feedback', 'boss_phase_two'),
      this.speakNarration('BOSS PHASE TWO'),
      e.setData('health', h),
      e.setTint(16745070),
      this.time.delayedCall(100, () => e.active && e.setTint(e.getData('bossColor') || 16777215)),
      h > 0)
    ) {
      if (!0 === e.getData('boss') && 1 === h) {
        const t = this.add.circle(e.x, e.y, 28, 16745070, 0.22).setDepth(12);
        this.tweens.add({
          targets: t,
          scale: 2.4,
          alpha: 0,
          duration: 320,
          onComplete: () => t.destroy(),
        });
      }
      return (
        this.playerCue(`${t} · BOSS HIT`, '#ffcf82'),
        void this.gadgetPulse(16764802, 15, 360)
      );
    }
    if (
      (e.getData('boss') || this.game.events.emit('feedback', 'enemy_defeated'),
      e.getData('label')?.destroy(),
      !0 === e.getData('boss'))
    ) {
      if (!0 === this.bossVictorySequence) return;
      ((this.bossVictorySequence = !0),
        (this.bossVictoryLock = !0),
        this.player?.body && this.player.body.setVelocity(0, 0),
        this.input?.keyboard?.resetKeys?.(),
        this.bossHealthUI &&
          (this.bossHealthUI.marker50?.destroy(),
          this.bossHealthUI.marker25?.destroy(),
          this.bossHealthUI.container?.destroy(),
          (this.bossHealthUI = null)),
        this.boss?.active && (this.boss.setData('finalEnrage', !1), this.boss.setData('phase', 0)),
        this.bossPhaseAura?.destroy?.(),
        (this.bossPhaseAura = null));
      const t = this.add
        .circle(e.x, e.y, 24, e.getData('bossColor') || 16745070, 0.42)
        .setDepth(13);
      if (
        (this.tweens.add({
          targets: t,
          scale: 5,
          alpha: 0,
          duration: 420,
          onComplete: () => t.destroy(),
        }),
        this.shake(180, 0.008),
        this.comets &&
          this.comets.getChildren().forEach((e) => {
            e.active &&
              !0 === e.getData('bossProjectile') &&
              (e.getData('trail')?.destroy(),
              e.body?.setVelocity(0, 0),
              e.body?.setEnable(!1),
              e.setActive(!1),
              e.setVisible(!1),
              e.destroy());
          }),
        this.playerCue('BOSS DEFEATED', '#8df4ff'),
        this.speakNarration('BOSS DEFEATED'),
        !this.motionReduced)
      ) {
        const e = this.scale.width / 2,
          t = this.scale.height / 2,
          i = this.add.container(e, t).setScrollFactor(0).setDepth(150).setAlpha(0).setScale(0.82),
          s = this.add
            .rectangle(0, 0, Math.min(this.scale.width - 40, 420), 112, 397597, 0.96)
            .setStrokeStyle(2, 9303295, 0.9),
          a = this.add.rectangle(0, -53, Math.min(this.scale.width - 40, 420), 4, 9303295, 0.95),
          l = this.add
            .text(0, -18, 'BOSS DEFEATED', {
              fontFamily: 'Arial Black, Arial, sans-serif',
              fontSize: '28px',
              fontStyle: 'bold',
              color: '#8df4ff',
              stroke: '#02070d',
              strokeThickness: 6,
              align: 'center',
              resolution: 2,
            })
            .setOrigin(0.5),
          r = this.add
            .text(0, 18, 'THREAT ELIMINATED', {
              fontFamily: 'Arial, sans-serif',
              fontSize: '13px',
              fontStyle: 'bold',
              color: '#dcecff',
              letterSpacing: 2,
              align: 'center',
              resolution: 2,
            })
            .setOrigin(0.5),
          o = this.add.rectangle(0, 40, 170, 2, 9303295, 0.65);
        (i.add([s, a, l, r, o]),
          this.tweens.add({ targets: i, alpha: 1, scale: 1, duration: 420, ease: 'Back.out' }),
          this.tweens.add({
            targets: a,
            scaleX: 0.35,
            duration: 260,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
          }),
          this.tweens.add({
            targets: i,
            delay: 1500,
            alpha: 0,
            scale: 1.04,
            duration: 420,
            ease: 'Quad.in',
            onComplete: () => {
              i.destroy();
            },
          }));
      }
      if (
        (this.gadgetPulse(9303295, 36, 1e3),
        this.game.events.emit('feedback', 'boss_defeated'),
        !this.motionReduced)
      ) {
        const t = this.add
          .rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            this.scale.width,
            this.scale.height,
            9303295,
            0.18,
          )
          .setScrollFactor(0)
          .setDepth(140);
        this.tweens.add({
          targets: t,
          alpha: 0,
          duration: 520,
          ease: 'Quad.out',
          onComplete: () => t.destroy(),
        });
        const i = this.add
          .circle(e.x, e.y, 34, 9303295, 0)
          .setStrokeStyle(4, 9303295, 0.95)
          .setDepth(18);
        this.tweens.add({
          targets: i,
          scale: 7,
          alpha: 0,
          duration: 900,
          ease: 'Cubic.out',
          onComplete: () => i.destroy(),
        });
      }
      !this.motionReduced && this.graphicsLevel >= 2 && this.cameras.main.flash(220, 255, 208, 110);
    }
    e.getData('indicator')?.destroy();
    const d = this.add.circle(e.x, e.y, 12, 9303295, 0.65).setDepth(13);
    (this.tweens.add({
      targets: d,
      scale: 3,
      alpha: 0,
      duration: 220,
      onComplete: () => d.destroy(),
    }),
      e.setData('combatDefeated', !0),
      e.disableBody(!0, !0),
      (this.enemyDefeats = (this.enemyDefeats || 0) + 1),
      (this.combatCombo = this.comboTimer > 0 ? Math.min(10, this.combatCombo + 1) : 1),
      (this.comboTimer = 3e3));
    const c = 'STOMP' === t ? 7 : 'SWORD' === t ? 6 : 'BLASTER' === t ? 5 : 4,
      y =
        this.combatCombo >= 8
          ? 1.75
          : this.combatCombo >= 5
            ? 1.45
            : this.combatCombo >= 3
              ? 1.2
              : 1,
      p = Math.round(c * y);
    if (
      (this.addPolarity(p, `kill:${t}`),
      (this.bestCombatCombo = Math.max(this.bestCombatCombo || 0, this.combatCombo)),
      this.combatCombo >= 10 && this.overdriveTimer <= 0 && !this.polarityComboOverdriveTriggered)
    ) {
      if (
        ((this.polarity = this.polarityMax),
        this.updatePolarityState(),
        this.activatePolarityOverdrive(),
        (this.polarityComboOverdriveTriggered = !0),
        this.gadgetPulse(16765038, 22, 700),
        !this.motionReduced && this.graphicsLevel >= 2)
      ) {
        (this.cameras.main.flash(150, 255, 208, 110), this.shake(110, 0.005));
        const e = this.add.circle(this.player.x, this.player.y, 18, 16765038, 0.2).setDepth(13);
        (e.setStrokeStyle(3, 16773288, 0.9),
          this.tweens.add({
            targets: e,
            scale: 5.2,
            alpha: 0,
            duration: 520,
            ease: 'Quad.out',
            onComplete: () => e.destroy(),
          }));
      }
      this.game.events.emit('feedback', 'overdrive');
    }
    if (!this.motionReduced && this.graphicsLevel >= 2) {
      const e = this.combatCombo,
        t = e >= 10 ? 16765038 : e >= 5 ? 12162047 : 9303295,
        i = this.add.circle(this.player.x, this.player.y, 13 + e, t, 0.18).setDepth(13);
      (i.setStrokeStyle(e >= 5 ? 2 : 1, t, 0.78),
        this.tweens.add({
          targets: i,
          scale: e >= 10 ? 4.8 : e >= 5 ? 4.2 : 3.4,
          alpha: 0,
          duration: e >= 10 ? 420 : 300,
          ease: 'Quad.out',
          onComplete: () => i.destroy(),
        }),
        this.playerCue(`COMBO x${e}`, e >= 10 ? '#ffd06e' : e >= 5 ? '#b993ff' : '#8df4ff'),
        e >= 5 &&
          (this.shake(e >= 10 ? 95 : 55, e >= 10 ? 0.004 : 0.002),
          this.worldLightPulse(
            e >= 10 ? 16765038 : 12162047,
            e >= 10 ? 0.22 : 0.13,
            e >= 10 ? 360 : 240,
            e >= 10 ? 72 : 48,
          ),
          this.worldLightFlash(
            e >= 10 ? 16765038 : 12162047,
            e >= 10 ? 0.07 : 0.035,
            e >= 10 ? 150 : 100,
          )));
    }
    (this.combatCombo >= 3 && (this.energy = Math.min(this.energyMax, this.energy + 4)),
      (this.ammo = Math.min(this.ammoMax, this.ammo + 1)),
      this.game.events.emit('ammo', (this.ammo / this.ammoMax) * 100),
      this.game.events.emit('combo', this.combatCombo, this.comboTimer),
      this.combatCombo >= 2 &&
        this.combatCombo % 2 == 0 &&
        this.speakNarration(`COMBO ${this.combatCombo}`));
    const f = this.player?.body;
    if (
      (f && f.setVelocityY('STOMP' === t ? -360 : f.velocity.y),
      this.playerCue(
        `${t} · ${this.combatCombo > 1 ? `COMBO x${this.combatCombo}${this.combatCombo >= 3 ? ' · +4 ENERGY' : ''}` : 'THREAT CLEARED'}`,
        '#8df4ff',
      ),
      this.blasterCooldown > 0 ||
        this.cinematicActive ||
        this.finished ||
        this.respawning ||
        this.relayPuzzleActive ||
        !this.player?.active ||
        !this.player?.body)
    )
      return;
    if (!this.ammo) {
      const e = this.add.circle(this.player.x, this.player.y, 13, 16764802, 0.28).setDepth(12);
      return (
        this.tweens.add({
          targets: e,
          scale: 3.8,
          alpha: 0,
          duration: 300,
          onComplete: () => e.destroy(),
        }),
        this.playerCue('PLASMA RECHARGING', '#ffcf82'),
        this.gadgetPulse(16764802, 9, 300),
        void this.game.events.emit('feedback', 'empty')
      );
    }
    const u = this.player.flipX ? -1 : 1,
      m = this.loadout.weapon || 'sidearm';
    if (
      (('scattergun' === m ? [-150, 0, 150] : [0]).forEach((e) => {
        const t = this.plasma
          .create(this.player.x + 30 * u, this.player.y - 4, 'plasma')
          .setDepth(12)
          .setFlipX(u < 0);
        (t.body.setAllowGravity(!1).setVelocity(u * ('pulse-rifle' === m ? 980 : 840), e),
          t.setData('power', 'pulse-rifle' === m ? 2 : 1),
          this.time.delayedCall(900, () => t.destroy()));
      }),
      this.ammo--,
      this.game.events.emit('ammo', (this.ammo / this.ammoMax) * 100),
      (this.blasterCooldown = 'scattergun' === m ? 420 : 240),
      this.playerCue('sidearm' === m ? 'PLASMA FIRE' : m.toUpperCase(), '#8df4ff'),
      !this.motionReduced)
    ) {
      const e = this.add
        .circle(this.player.x + (this.player.flipX ? -30 : 30), this.player.y - 4, 7, 9303295, 0.34)
        .setDepth(13);
      this.tweens.add({
        targets: e,
        scale: 2.6,
        alpha: 0,
        duration: 110,
        ease: 'Quad.out',
        onComplete: () => e.destroy(),
      });
    }
    this.game.events.emit('feedback', 'blaster_fire');
  }
  useSword() {
    if (
      this.swordCooldown > 0 ||
      this.cinematicActive ||
      this.finished ||
      this.respawning ||
      this.relayPuzzleActive
    )
      return;
    const e = this.player.flipX ? -1 : 1,
      t = this.add
        .sprite(this.player.x + 38 * e, this.player.y - 4, 'sword')
        .setDepth(13)
        .setFlipX(e < 0)
        .setAngle(-18 * e);
    if (
      (this.tweens.add({
        targets: t,
        angle: 48 * e,
        alpha: 0,
        duration: 170,
        onComplete: () => t.destroy(),
      }),
      this.enemies
        .getChildren()
        .filter(
          (e) =>
            e?.active &&
            e.body &&
            Math.abs(e.x - this.player.x) < 105 &&
            Math.abs(e.y - this.player.y) < 90,
        )
        .forEach((e) => {
          e?.active && this.defeatEnemy(e, 'SWORD', 999);
        }),
      (this.swordCooldown = 450),
      this.playerCue('SWORD ARC', '#ffd06e'),
      this.game.events.emit('feedback', 'sword_swing'),
      !this.motionReduced)
    ) {
      const e = this.add
        .circle(this.player.x + (this.player.flipX ? -22 : 22), this.player.y - 2, 9, 16765038, 0.3)
        .setDepth(13);
      this.tweens.add({
        targets: e,
        scaleX: 2.8,
        scaleY: 1.4,
        alpha: 0,
        duration: 130,
        ease: 'Quad.out',
        onComplete: () => e.destroy(),
      });
    }
  }
  showDizzyStars(e = 1) {
    if (
      this.motionReduced ||
      !this.player?.active ||
      this.finished ||
      this.respawning ||
      this.cinematicActive
    )
      return;
    const t = Phaser.Math.Clamp(Number(e) || 1, 0.5, 1.5);
    if (
      ((this.dizzyStarsIntensity = Math.max(this.dizzyStarsIntensity || 0, t)),
      (this.dizzyStarsTimer = Math.max(this.dizzyStarsTimer || 0, 650 + 550 * t)),
      this.dizzyStars?.active)
    )
      return;
    this.dizzyStarsSerial++;
    const i = this.add.container(this.player.x, this.player.y - 42).setDepth(16);
    this.dizzyStars = i;
    const s = t >= 1.2 ? 5 : t >= 0.85 ? 4 : 3,
      a = [],
      l = (e = 7) => {
        const t = this.add.graphics(),
          i = [];
        for (let t = 0; t < 10; t++) {
          const s = -Math.PI / 2 + (t * Math.PI) / 5,
            a = t % 2 == 0 ? e : 0.42 * e;
          i.push(new Phaser.Geom.Point(Math.cos(s) * a, Math.sin(s) * a));
        }
        return (
          t.fillStyle(16773301, 1).fillPoints(i, !0),
          t.lineStyle(1, 16777215, 0.9).strokePoints(i, !0),
          t.setBlendMode(Phaser.BlendModes.ADD),
          t
        );
      };
    for (let e = 0; e < s; e++) {
      const r = l(e % 2 == 0 ? 6 : 8);
      (r.setData('orbitIndex', e),
        r.setData('orbitRadius', 20 + 10 * t),
        r.setData('orbitAngle', (2 * Math.PI * e) / s),
        r.setData('spin', e % 2 == 0 ? 1 : -1),
        i.add(r),
        a.push(r));
    }
    const r = this.dizzyStarsSerial;
    (this.tweens.add({
      targets: a,
      scale: { from: 0.45, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 150,
      ease: 'Back.out',
    }),
      this.time.delayedCall(650 + 550 * t, () => {
        r === this.dizzyStarsSerial &&
          this.tweens.add({
            targets: a,
            scale: 0.2,
            alpha: 0,
            duration: 220,
            ease: 'Quad.in',
            onComplete: () => {
              (i.destroy(!0),
                this.dizzyStars === i && (this.dizzyStars = null),
                (this.dizzyStarsTimer = 0),
                (this.dizzyStarsIntensity = 0));
            },
          });
      }),
      this.tweens.add({
        targets: this.player,
        angle: -4 * t,
        duration: 90,
        yoyo: !0,
        repeat: 3,
        ease: 'Sine.inOut',
      }));
  }
  createOpeningCinematic() {
    if (!this.cinematicActive || this.divineArrivalPlayed) return;
    this.divineArrivalPlayed = !0;
    const e = this.scale.width,
      t = this.scale.height,
      i = this.mission.spawn.x,
      s = this.mission.spawn.y;
    (this.physics.pause(),
      this.player?.body && this.player.body.setVelocity(0, 0),
      this.cameras.main.stopFollow());
    const a = this.add.container(0, 0).setScrollFactor(0).setDepth(150);
    this.divineArrivalOverlay = a;
    const l = this.add.rectangle(e / 2, t / 2, e, t, 520, 1),
      r = this.add
        .circle(e / 2, 0.32 * t, 0.24 * Math.min(e, t), 16773301, 0)
        .setBlendMode(Phaser.BlendModes.ADD),
      o = this.add
        .circle(e / 2, 0.32 * t, 0.075 * Math.min(e, t), 16777215, 0)
        .setBlendMode(Phaser.BlendModes.ADD),
      n = this.add.container(e / 2, 0.3 * t),
      h = this.add.circle(0, -46, 26, 16770982, 0).setBlendMode(Phaser.BlendModes.ADD),
      d = this.add.circle(0, -46, 10, 16777215, 0),
      c = this.add.rectangle(0, -10, 18, 62, 16777215, 0),
      y = this.add.graphics();
    (y.lineStyle(7, 16777215, 1), y.lineBetween(-6, -28, -48, -2), y.lineBetween(6, -28, 48, -2));
    const p = this.add.triangle(0, 28, -25, -20, 25, -20, 0, 42, 16777215, 0);
    n.add([h, d, c, y, p]);
    const f = this.add
        .rectangle(e / 2, 0.52 * t, 0.22 * Math.min(e, t), 0.82 * t, 16774607, 0)
        .setBlendMode(Phaser.BlendModes.ADD),
      u = this.add
        .rectangle(e / 2, 0.52 * t, 0.055 * Math.min(e, t), 0.82 * t, 16777215, 0)
        .setBlendMode(Phaser.BlendModes.ADD);
    (a.add([l, f, u, r, o, n]),
      this.player
        .setPosition(i, s)
        .setAlpha(1)
        .setAngle(0)
        .setScale(this.playerVisualBaseScaleX, this.playerVisualBaseScaleY),
      this.player.play('runner-idle', !0),
      this.player.body && (this.player.body.reset(i, s), this.player.body.setVelocity(0, 0)),
      this.tweens.add({ targets: [r, o, f, u, n], alpha: 1, duration: 650, ease: 'Cubic.out' }),
      this.tweens.add({
        targets: r,
        scale: 1.55,
        alpha: 0.28,
        duration: 900,
        yoyo: !0,
        ease: 'Sine.inOut',
      }),
      this.tweens.add({ targets: h, scale: 1.35, alpha: 1, duration: 550, ease: 'Quad.out' }),
      this.time.delayedCall(1050, () => {
        this.cinematicActive &&
          (this.tweens.add({ targets: n, y: 0.34 * t, alpha: 0, duration: 420, ease: 'Quad.in' }),
          this.tweens.add({
            targets: [r, o],
            scale: 0.35,
            alpha: 0,
            duration: 480,
            ease: 'Quad.in',
          }),
          this.tweens.add({
            targets: f,
            scaleX: 0.25,
            alpha: 0.12,
            duration: 520,
            ease: 'Quad.in',
          }),
          this.player.setAlpha(1),
          this.player
            .setPosition(i, s)
            .setAngle(0)
            .setAlpha(1)
            .setScale(this.playerVisualBaseScaleX, this.playerVisualBaseScaleY)
            .play('runner-idle', !0),
          this.player.body && (this.player.body.reset(i, s), this.player.body.setVelocity(0, 0)));
      }),
      this.time.delayedCall(1800, () => {
        if (this.cinematicActive) {
          if (
            (this.player.play('runner-land', !0),
            this.player.setScale(
              1.18 * this.playerVisualBaseScaleX,
              0.78 * this.playerVisualBaseScaleY,
            ),
            this.worldLightPulse(16765038, 0.24, 380, 70),
            this.worldLightFlash(16773301, 0.1, 160),
            this.shake(220, 0.01),
            !this.motionReduced && this.graphicsLevel >= 2)
          ) {
            this.dust.emitParticleAt(i, s + 12, 18);
            const e = this.add.circle(i, s + 28, 10, 16765038, 0.34).setDepth(12);
            (e.setStrokeStyle(2, 16773301, 0.9),
              this.tweens.add({
                targets: e,
                scale: 5.4,
                alpha: 0,
                duration: 340,
                ease: 'Quad.out',
                onComplete: () => e.destroy(),
              }));
          }
          this.tweens.add({
            targets: this.player,
            scaleX: this.playerVisualBaseScaleX,
            scaleY: this.playerVisualBaseScaleY,
            duration: 150,
            ease: 'Back.out',
          });
        }
      }),
      this.time.delayedCall(2050, () => {
        this.cinematicActive &&
          (this.player.play('runner-land', !0),
          this.tweens.add({
            targets: this.player,
            angle: -5,
            duration: 90,
            yoyo: !0,
            repeat: 3,
            ease: 'Sine.inOut',
          }));
      }));
    const m = () => {
      this.cinematicActive &&
        ((this.cinematicActive = !1),
        this.tweens.killTweensOf(this.player),
        this.player
          .setAngle(0)
          .setAlpha(1)
          .setScale(this.playerVisualBaseScaleX, this.playerVisualBaseScaleY)
          .setPosition(i, s)
          .play('runner-idle', !0),
        this.player.body && (this.player.body.reset(i, s), this.player.body.setVelocity(0, 0)),
        a.destroy(!0),
        (this.divineArrivalOverlay = null),
        this.input.keyboard.off('keydown-SPACE', this.cinematicSkipHandler),
        this.input.keyboard.off('keydown-A', this.cinematicSkipHandler),
        this.input.keyboard.off('keydown-D', this.cinematicSkipHandler),
        this.input.keyboard.off('keydown-LEFT', this.cinematicSkipHandler),
        this.input.keyboard.off('keydown-RIGHT', this.cinematicSkipHandler),
        this.cameras.main.startFollow(
          this.player,
          !0,
          0.1,
          0.1,
          this.cameraOffsetX,
          this.cameraOffsetY,
        ),
        this.physics.resume(),
        this.playerCue('ARRIVAL COMPLETE · MOVE OUT', '#8df4ff'),
        this.createMissionTransmission());
    };
    ((this.cinematicSkipHandler = m),
      this.input.keyboard.once('keydown-SPACE', this.cinematicSkipHandler),
      this.input.keyboard.once('keydown-A', this.cinematicSkipHandler),
      this.input.keyboard.once('keydown-D', this.cinematicSkipHandler),
      this.input.keyboard.once('keydown-LEFT', this.cinematicSkipHandler),
      this.input.keyboard.once('keydown-RIGHT', this.cinematicSkipHandler),
      this.time.delayedCall(2850, m));
  }
  createMissionTransmission() {
    const e = this.mission.story,
      t = this.scale.width,
      i = this.scale.height,
      s = t < 700,
      a = s ? Math.min(t - 32, 420) : t - 44,
      l = s ? Math.min(i - 48, 340) : i - 64,
      r = s ? (t - a) / 2 : 22,
      o = (i - l) / 2,
      n = s ? a - 62 : Math.min(a - 62, 0.5 * t),
      h = this.add.container(0, 0).setScrollFactor(0).setDepth(100),
      d = this.add.rectangle(t / 2, i / 2, t, i, 198417, s ? 0.74 : 0.34),
      c = this.add
        .rectangle(r + a / 2, i / 2, a, l, 330004, s ? 0.94 : 0.66)
        .setStrokeStyle(1, 9303295, 0.55),
      y = this.add
        .rectangle(r + a / 2, i / 2, a - 20, l - 20, 660775, s ? 0.45 : 0.24)
        .setStrokeStyle(1, 9303295, 0.12),
      p = this.add.rectangle(r + 30, o + 24, 48, 3, 9303295, 0.95).setOrigin(0, 0.5),
      f = this.add.rectangle(r + a / 2, o + 52, a - 56, 1, 9303295, 0.26),
      u = s ? 0.78 * t : 0.79 * t,
      m = 0.58 * i,
      g = Math.min(t, i) * (s ? 0.2 : 0.3),
      S = this.add.circle(u, m, 1.15 * g, 1473455, 0.1),
      w =
        (this.add.circle(u, m, g, 1453912, 0.9).setStrokeStyle(2, 9303295, 0.72),
        this.add.circle(u, m, 1.08 * g, 9303295, 0.08).setStrokeStyle(1, 9303295, 0.35)),
      x = this.add
        .circle(0.18 * t, 0.18 * i, 0.09 * Math.min(t, i), 1793425, 0.95)
        .setStrokeStyle(2, 12187135, 0.7),
      b = this.add.circle(0.18 * t - 12, 0.18 * i - 8, 0.072 * Math.min(t, i), 14679295, 0.13),
      C = this.add
        .text(t / 2, i - (s ? 34 : 42), 'EARTH ORBIT · RELAY DISTRESS SIGNAL RECEIVED', {
          fontFamily: 'Orbitron',
          fontSize: s ? '8px' : '11px',
          color: '#dffcff',
          stroke: '#08101c',
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(102),
      R = Array.from({ length: s ? 12 : 22 }, (e, s) =>
        this.add.circle(
          t * (0.56 + ((37 * s) % 42) / 100),
          34 + ((71 * s) % Math.max(80, i - 68)),
          s % 4 == 0 ? 1.8 : 1,
          12187135,
          0.18 + (s % 3) * 0.12,
        ),
      ),
      k = this.add
        .triangle(-80, 0.31 * i, 0, 20, 60, 38, 0, 56, 9303295)
        .setStrokeStyle(2, 14679295),
      D = this.add.rectangle(-126, 0.31 * i + 38, 90, 2, 9303295, 0.35).setOrigin(0, 0.5),
      v = this.add.text(r + 30, o + (s ? 52 : 76), 'RELAY // ORIENTATION', {
        fontFamily: 'Orbitron',
        fontSize: s ? '9px' : '12px',
        color: '#8df4ff',
        letterSpacing: 2,
      }),
      T = this.add.text(r + 30, o + (s ? 78 : 108), e?.chapter || 'NIGHT SHIFT // ARRIVAL', {
        fontFamily: 'Orbitron',
        fontSize: s ? '16px' : '27px',
        color: '#dffcff',
        wordWrap: { width: n },
      }),
      E = this.add.text(
        r + 30,
        o + (s ? 116 : 188),
        e?.arrival || 'The relay planet went dark.\nOne courier enters the storm zone.',
        {
          fontFamily: 'Orbitron',
          fontSize: s ? '10px' : '15px',
          wordWrap: { width: n },
          lineSpacing: s ? 5 : 11,
          color: '#b9d5ee',
        },
      ),
      O = this.add.text(
        r + 30,
        o + (s ? 174 : 302),
        s
          ? 'FOLLOW THE GOLD SIGNALS. THEY MARK THE SAFE LINE.'
          : 'The relay is weak, but the gold Signals still cut through the dark. Keep moving and let the route reveal itself one rooftop at a time.',
        {
          fontFamily: 'Orbitron',
          fontSize: s ? '8px' : '12px',
          color: '#8df4ff',
          wordWrap: { width: n },
          lineSpacing: s ? 3 : 7,
        },
      ),
      A = this.add.text(
        r + 30,
        o + (s ? 210 : 358),
        s
          ? 'CHECKPOINTS SAVE YOUR RUN. MOMENTUM IS YOUR SHIELD.'
          : 'Checkpoint beacons remember your progress, so take the risky line, learn the rhythm and make the city answer back.',
        {
          fontFamily: 'Orbitron',
          fontSize: s ? '8px' : '12px',
          color: '#ffd06e',
          wordWrap: { width: n },
          lineSpacing: s ? 3 : 7,
        },
      ),
      M = o + l - (s ? 76 : 88),
      P = this.add.text(r + 30, M, 'A / D  MOVE     SPACE  JUMP     E  PLASMA', {
        fontFamily: 'Orbitron',
        fontSize: s ? '9px' : '11px',
        color: '#ffd06e',
        wordWrap: { width: n },
        lineSpacing: 6,
      }),
      I = this.add.text(
        r + 30,
        o + l - (s ? 30 : 36),
        s ? 'AUTO-CLOSE · 3 SEC' : 'SPACE · SKIP LANDING',
        { fontFamily: 'Orbitron', fontSize: s ? '8px' : '11px', color: '#8df4ff' },
      ),
      N = [x, b, ...R],
      B = [c, y, p, f, D, k, v, T, E, O, A, P, I];
    (h.add(s ? [d, ...N, ...B] : [d, ...B, ...N]),
      this.tweens.add({
        targets: [k, D],
        x: s ? 0.52 * t : 0.58 * t,
        y: 0.43 * i,
        duration: 2600,
        ease: 'Cubic.out',
      }));
    ([
      [120, 'Earth is behind you. The relay planet is calling.'],
      [2100, 'Descent corridor open. Follow the gold signals to the surface.'],
      [3900, 'Landing complete. Keep the line open.'],
    ].forEach(([e, t]) =>
      this.time.delayedCall(e, () => {
        h?.active && (C.setText(t), this.game.events.emit('narration', t));
      }),
    ),
      this.motionReduced ||
        (this.tweens.add({
          targets: [x, b],
          alpha: 0,
          scale: 0.72,
          duration: 2500,
          ease: 'Cubic.in',
        }),
        this.tweens.add({
          targets: w,
          scale: 1.08,
          alpha: 0.3,
          yoyo: !0,
          repeat: -1,
          duration: 900,
        }),
        this.tweens.add({
          targets: S,
          scale: 1.14,
          alpha: 0.03,
          yoyo: !0,
          repeat: -1,
          duration: 1250,
        }),
        this.tweens.add({
          targets: f,
          alpha: { from: 0.14, to: 0.5 },
          yoyo: !0,
          repeat: -1,
          duration: 680,
        }),
        this.tweens.add({
          targets: R,
          alpha: { from: 0.12, to: 0.62 },
          yoyo: !0,
          repeat: -1,
          duration: 1100,
          delay: (e, t) => t.x % 240,
        })));
    const F = this.runId,
      z = () => {
        (this.input.keyboard.off('keydown-SPACE', z),
          F === this.runId && h?.active && h.destroy(!0));
      };
    (this.time.delayedCall(s ? 3600 : 5600, z),
      this.input.keyboard.once('keydown-SPACE', z),
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.input.keyboard.off('keydown-SPACE', z);
      }));
  }
  createObjectiveHUD() {
    const e = this.scale.width < 768,
      t = Math.min(Math.max(this.scale.width - 24, 0), e ? 340 : 430),
      i = e ? 12 : 18,
      s = e ? 92 : 118,
      a = e ? 68 : 78,
      l = this.add.container(i, s).setScrollFactor(0).setDepth(100),
      r = this.add.rectangle(t / 2, 40, t + 12, 82, 463133, 0.2).setStrokeStyle(2, 9303295, 0.16),
      o = this.add.rectangle(t / 2 + 5, 44, t, a, 0, 0.48),
      n = this.add.rectangle(t / 2, 40, t, a, 397338, 0.97).setStrokeStyle(1.5, 9303295, 0.82),
      h = this.add.rectangle(t / 2, 40, t - 8, 70, 727850, 0.78).setStrokeStyle(1, 3499901, 0.42),
      d = this.add.rectangle(t / 2, 5, t - 22, 2, 9303295, 0.3),
      c = this.add.rectangle(t / 2 - 95, 5, 74, 2, 15269375, 0.95),
      y = this.add.rectangle(7, 40, 3, 58, 9303295, 1),
      p = this.add.rectangle(11, 40, 2, 48, 9303295, 0.22),
      f = this.add.text(20, 9, 'OBJECTIVE', {
        fontFamily: 'Orbitron',
        fontSize: '10px',
        color: '#8df4ff',
        fontStyle: 'bold',
        letterSpacing: 1.35,
        stroke: '#04101a',
        strokeThickness: 4,
        shadow: { offsetX: 0, offsetY: 0, color: '#56eaff', blur: 8, fill: !0 },
      }),
      u = this.add.text(20, 23, 'ACTIVE MISSION DIRECTIVE', {
        fontFamily: 'Orbitron',
        fontSize: '7px',
        color: '#58788d',
        fontStyle: 'bold',
        letterSpacing: 1.1,
      }),
      m = this.add.text(20, 36, this.mission?.story?.arrival || 'REACH THE RELAY', {
        fontFamily: 'Orbitron',
        fontSize: e ? '10px' : '11px',
        color: '#e8fdff',
        fontStyle: 'bold',
        letterSpacing: 0.45,
        lineSpacing: 2,
        stroke: '#04101a',
        strokeThickness: 4,
        shadow: { offsetX: 0, offsetY: 0, color: '#8df4ff', blur: 5, fill: !0 },
        wordWrap: {
          width: e ? Math.max(145, t - 145) : Math.max(165, t - 245),
          useAdvancedWrap: !0,
        },
        maxLines: 2,
      }),
      g = this.add.text(t - 162, 10, 'MISSION', {
        fontFamily: 'Orbitron',
        fontSize: '7px',
        color: '#637f92',
        fontStyle: 'bold',
        letterSpacing: 1.15,
      }),
      S = this.add
        .text(t - 18, 8, '0%', {
          fontFamily: 'Orbitron',
          fontSize: '14px',
          color: '#e8fdff',
          fontStyle: 'bold',
          stroke: '#04101a',
          strokeThickness: 4,
          shadow: { offsetX: 0, offsetY: 0, color: '#8df4ff', blur: 7, fill: !0 },
        })
        .setOrigin(1, 0),
      w = e ? Math.min(105, 0.38 * t) : 136,
      x = this.add.rectangle(t - w / 2 - 14, 27, w, 6, 1189946, 1).setStrokeStyle(1, 3826808, 0.72),
      b = this.add.rectangle(t - w - 14, 27, Math.max(0, w - 4), 3, 9303295, 1).setOrigin(0, 0.5),
      C = this.add
        .rectangle(t - w - 14, 25, Math.max(0, w - 4), 1.5, 15269375, 0.9)
        .setOrigin(0, 0.5),
      R = this.add.rectangle(t / 2, 55, t - 42, 1, 3233386, 0.7),
      k = this.add.text(20, 62, 'ROUTE ACTIVE  //  LINK STABLE', {
        fontFamily: 'Orbitron',
        fontSize: '7px',
        color: '#71899d',
        fontStyle: 'bold',
        letterSpacing: 1,
      }),
      D = this.add.circle(t - 24, 65, 7, 9303295, 0.1),
      v = this.add.circle(t - 24, 65, 3, 9303295, 1),
      T = this.add.rectangle(15, 13, 20, 1, 9303295, 0.72),
      E = this.add.rectangle(t - 15, 13, 20, 1, 9303295, 0.72),
      O = this.add.rectangle(15, 70, 20, 1, 9303295, 0.34),
      A = this.add.rectangle(t - 15, 70, 20, 1, 9303295, 0.34);
    (l.add([r, o, n, h, d, c, y, p, f, u, m, g, S, x, b, C, R, k, D, v, T, E, O, A]),
      this.tweens.add({
        targets: c,
        x: { from: t / 2 - 95, to: t / 2 + 95 },
        alpha: { from: 0.2, to: 1 },
        duration: 1750,
        yoyo: !0,
        repeat: -1,
        ease: 'Sine.inOut',
      }),
      this.tweens.add({
        targets: D,
        scale: { from: 0.8, to: 1.6 },
        alpha: { from: 0.06, to: 0.22 },
        duration: 900,
        yoyo: !0,
        repeat: -1,
        ease: 'Sine.inOut',
      }),
      this.tweens.add({
        targets: v,
        alpha: { from: 0.45, to: 1 },
        duration: 650,
        yoyo: !0,
        repeat: -1,
        ease: 'Sine.inOut',
      }),
      (this.objectiveHUD = l),
      (this.objectiveText = m),
      (this.objectiveProgressBar = b),
      (this.objectiveProgressText = S));
  }
  createPlayerStatusHUD() {
    const e = this.scale.width < 768,
      t = e ? Math.min(190, this.scale.width - 24) : 250,
      i = e ? 172 : this.scale.height - 214,
      s = e ? 86 : 92,
      a = this.add.container(12, i).setScrollFactor(0).setDepth(500).setAlpha(1).setVisible(!0),
      l = this.add.rectangle(t / 2 + 4, s / 2 + 4, t, s, 0, 0.34),
      r = this.add.rectangle(t / 2, s / 2, t, s, 464161, 0.94).setStrokeStyle(1, 3039864, 0.88),
      o = this.add
        .rectangle(t / 2, s / 2, t - 6, s - 6, 728363, 0.48)
        .setStrokeStyle(1, 9303295, 0.16),
      n = this.add.text(12, 7, 'PLAYER // STATUS', {
        fontFamily: 'Orbitron',
        fontSize: e ? '9px' : '10px',
        fontStyle: 'bold',
        color: '#e8fdff',
        letterSpacing: 1.1,
      }),
      h = this.add
        .text(t - 12, 7, 'STABLE', {
          fontFamily: 'Orbitron',
          fontSize: e ? '8px' : '9px',
          fontStyle: 'bold',
          color: '#8df4ff',
          align: 'right',
        })
        .setOrigin(1, 0),
      d = [],
      c = (i, s, a, l, r) => {
        const o = this.add.text(12, i - 7, s, {
            fontFamily: 'Orbitron',
            fontSize: e ? '8px' : '9px',
            fontStyle: 'bold',
            color: r,
          }),
          n = e ? 60 : 68,
          h = t - n - 48,
          c = this.add
            .rectangle(n, i, h, 6, 1058874, 1)
            .setOrigin(0, 0.5)
            .setStrokeStyle(1, 3233387, 0.65),
          y = this.add.rectangle(n, i, Math.max(2, h * a), 3, l, 1).setOrigin(0, 0.5),
          p = this.add
            .text(t - 12, i - 8, '0%', {
              fontFamily: 'Orbitron',
              fontSize: e ? '8px' : '9px',
              fontStyle: 'bold',
              color: '#e8fdff',
              align: 'right',
            })
            .setOrigin(1, 0);
        return (d.push(o, c, y, p), { fill: y, valueText: p, barWidth: h });
      },
      y = c(
        e ? 28 : 31,
        'HP',
        Phaser.Math.Clamp((this.health || 0) / 3, 0, 1),
        16745070,
        '#ffb1a8',
      ),
      p = c(
        e ? 46 : 50,
        'ENG',
        Phaser.Math.Clamp((this.energy || 0) / Math.max(1, this.energyMax || 100), 0, 1),
        9303295,
        '#b9f5ff',
      ),
      f = c(
        e ? 64 : 69,
        'POL',
        Phaser.Math.Clamp((this.polarity || 0) / Math.max(1, this.polarityMax || 100), 0, 1),
        12162047,
        '#d7c5ff',
      ),
      u = this.add.text(12, s - 17, 'CORE // STABLE', {
        fontFamily: 'Orbitron',
        fontSize: e ? '7px' : '8px',
        color: '#7095a8',
        letterSpacing: 0.7,
      });
    (a.add([l, r, o, n, h, u, ...d]),
      (this.playerStatusHUD = a),
      (this.playerStatusHealthBar = y),
      (this.playerStatusEnergyBar = p),
      (this.playerStatusPolarityBar = f),
      (this.playerStatusHealthText = y.valueText),
      (this.playerStatusEnergyText = p.valueText),
      (this.playerStatusPolarityText = f.valueText),
      (this.playerStatusStateText = h),
      (this.playerStatusStateLine = u),
      this.updatePlayerStatusHUD());
  }
  updatePlayerStatusHUD() {
    if (!(
      this.playerStatusHUD &&
      this.playerStatusHealthBar &&
      this.playerStatusEnergyBar &&
      this.playerStatusPolarityBar
    ))
      return;
    const e = Phaser.Math.Clamp(Number(this.health) || 0, 0, Number(this.healthMax) || 3),
      t = Math.max(1, Number(this.healthMax) || 3),
      i = Phaser.Math.Clamp(Number(this.energy) || 0, 0, Number(this.energyMax) || 100),
      s = Math.max(1, Number(this.energyMax) || 100),
      a = Phaser.Math.Clamp(Number(this.polarity) || 0, 0, Number(this.polarityMax) || 100),
      l = Math.max(1, Number(this.polarityMax) || 100),
      r = e / t,
      o = i / s,
      n = a / l,
      h = e <= 0 ? 0 : Math.max(2, this.playerStatusHealthBar.barWidth * r),
      d = Math.max(2, this.playerStatusEnergyBar.barWidth * o),
      c = Math.max(2, this.playerStatusPolarityBar.barWidth * n);
    ((this.playerStatusHealthBar.fill.width =
      e <= 0 ? 0 : Phaser.Math.Linear(this.playerStatusHealthBar.fill.width, h, 0.22)),
      (this.playerStatusEnergyBar.fill.width = Phaser.Math.Clamp(
        Phaser.Math.Linear(this.playerStatusEnergyBar.fill.width, d, 0.22),
        0,
        this.playerStatusEnergyBar.barWidth,
      )),
      (this.playerStatusPolarityBar.fill.width = Phaser.Math.Clamp(
        Phaser.Math.Linear(this.playerStatusPolarityBar.fill.width, c, 0.22),
        0,
        this.playerStatusPolarityBar.barWidth,
      )),
      this.playerStatusHealthText?.setText(`${Math.round(e)}/${Math.round(t)}`),
      this.playerStatusEnergyText?.setText(`${Math.round(i)}%`),
      this.playerStatusPolarityText?.setText(`${Math.round(a)}%`),
      this.playerStatusStateText &&
        (e <= 0
          ? this.playerStatusStateText.setText('SYSTEM DOWN').setColor('#ff5364')
          : e <= 1
            ? this.playerStatusStateText.setText('CRITICAL').setColor('#ff5364')
            : a >= l
              ? this.playerStatusStateText.setText('OVERDRIVE').setColor('#ffd06e')
              : a >= 70
                ? this.playerStatusStateText.setText('CHARGED').setColor('#b993ff')
                : this.playerStatusStateText.setText('STABLE').setColor('#8df4ff')),
      this.playerStatusStateLine &&
        (e <= 0
          ? this.playerStatusStateLine.setText('CORE // OFFLINE').setColor('#ff5364')
          : e <= 1
            ? this.playerStatusStateLine.setText('CORE // CRITICAL').setColor('#ff826e')
            : a >= l
              ? this.playerStatusStateLine.setText('CORE // OVERDRIVE').setColor('#ffd06e')
              : a >= 70
                ? this.playerStatusStateLine.setText('CORE // CHARGED').setColor('#b993ff')
                : this.playerStatusStateLine.setText('CORE // STABLE').setColor('#7095a8')));
  }
  updateCombatHUD() {
    if (!this.combatHUD || !this.combatHUD.active) return;
    const e = Math.max(1, this.ammoMax || 1),
      t = Phaser.Math.Clamp(this.ammo || 0, 0, e),
      i = t / e;
    (this.combatAmmoText &&
      (this.combatAmmoText.setText(`${t}/${e}`),
      this.combatAmmoText.setColor(t <= 0 ? '#ffcf82' : t <= 2 ? '#ffb3a8' : '#e8fdff')),
      this.combatAmmoBar &&
        (this.combatAmmoBar.fill.width = Math.max(2, this.combatAmmoBar.barWidth * i)));
    const s = (this.loadout?.weapon || 'sidearm').toUpperCase();
    this.combatWeaponText?.setText(s);
    const a = Math.max(0, this.combatCombo || 0);
    this.combatComboText?.setText(`COMBO x${a}`);
    let l = '#b993ff';
    (a >= 10 ? (l = '#ffcf70') : a >= 5 ? (l = '#8df4ff') : a >= 3 && (l = '#b993ff'),
      this.combatComboText?.setColor(l));
    const r = Math.max(0, this.comboTimer || 0);
    (a > 0 && r > 0
      ? (this.combatComboTimerText?.setText(Math.ceil(r / 100) / 10 + 's'),
        this.combatComboTimerText?.setColor(r < 700 ? '#ffcf82' : '#8df4ff'))
      : (this.combatComboTimerText?.setText('READY'),
        this.combatComboTimerText?.setColor('#6f8798')),
      this.combatBestComboText?.setText(`BEST // x${this.bestCombatCombo || 0}`));
  }
  createCombatHUD() {
    const e = this.scale.width < 768,
      t = e ? Math.min(190, this.scale.width - 24) : 250,
      i = e ? 76 : 84,
      s = e ? this.scale.height - i - 182 : this.scale.height - i - 24,
      a = this.add.container(12, s).setScrollFactor(0).setDepth(101),
      l = this.add.rectangle(t / 2 + 4, i / 2 + 4, t, i, 0, 0.36),
      r = this.add.rectangle(t / 2, i / 2, t, i, 464161, 0.95).setStrokeStyle(1, 3235702, 0.9),
      o = this.add
        .rectangle(t / 2, i / 2, t - 6, i - 6, 728363, 0.5)
        .setStrokeStyle(1, 9303295, 0.14),
      n = this.add.text(11, 7, 'COMBAT // SYSTEM', {
        fontFamily: 'Orbitron',
        fontSize: e ? '8px' : '9px',
        fontStyle: 'bold',
        color: '#e8fdff',
        letterSpacing: 0.9,
      }),
      h = this.add
        .text(t - 11, 7, (this.loadout?.weapon || 'SIDEARM').toUpperCase(), {
          fontFamily: 'Orbitron',
          fontSize: e ? '8px' : '9px',
          fontStyle: 'bold',
          color: '#8df4ff',
          align: 'right',
        })
        .setOrigin(1, 0),
      d = this.add.text(11, e ? 27 : 29, 'AMMO', {
        fontFamily: 'Orbitron',
        fontSize: e ? '8px' : '9px',
        fontStyle: 'bold',
        color: '#91aabd',
      }),
      c = e ? t - 86 : t - 82,
      y = this.add
        .rectangle(52, e ? 31 : 33, c, 6, 1058874, 1)
        .setOrigin(0, 0.5)
        .setStrokeStyle(1, 3233387, 0.7),
      p = this.add.rectangle(52, e ? 31 : 33, c, 3, 9303295, 1).setOrigin(0, 0.5),
      f = this.add
        .text(t - 11, e ? 24 : 26, `${this.ammo || 0}/${this.ammoMax || 0}`, {
          fontFamily: 'Orbitron',
          fontSize: e ? '10px' : '11px',
          fontStyle: 'bold',
          color: '#e8fdff',
          align: 'right',
        })
        .setOrigin(1, 0),
      u = this.add.text(11, e ? 43 : 46, 'COMBO x0', {
        fontFamily: 'Orbitron',
        fontSize: e ? '12px' : '14px',
        fontStyle: 'bold',
        color: '#b993ff',
        letterSpacing: 0.7,
      }),
      m = this.add
        .text(t - 11, e ? 45 : 48, 'READY', {
          fontFamily: 'Orbitron',
          fontSize: e ? '8px' : '9px',
          fontStyle: 'bold',
          color: '#6f8798',
          align: 'right',
        })
        .setOrigin(1, 0),
      g = this.add.text(11, i - 16, `BEST // x${this.bestCombatCombo || 0}`, {
        fontFamily: 'Orbitron',
        fontSize: e ? '7px' : '8px',
        color: '#708fa2',
        letterSpacing: 0.7,
      });
    (a.add([l, r, o, n, h, d, y, p, f, u, m, g]),
      (this.combatHUD = a),
      (this.combatAmmoText = f),
      (this.combatAmmoBar = { fill: p, barWidth: c }),
      (this.combatComboText = u),
      (this.combatComboTimerText = m),
      (this.combatBestComboText = g),
      (this.combatWeaponText = h),
      this.updateCombatHUD());
  }
  createMobilityHUD() {
    const e = this.scale.width < 768,
      t = e ? Math.min(190, this.scale.width - 24) : 210,
      i = e ? 58 : 64,
      s = e ? 12 : this.scale.width - t - 274,
      a = e ? this.scale.height - i - 118 : this.scale.height - i - 24,
      l = this.add.container(s, a).setScrollFactor(0).setDepth(101),
      r = this.add.rectangle(t / 2 + 4, i / 2 + 4, t, i, 0, 0.34),
      o = this.add.rectangle(t / 2, i / 2, t, i, 464161, 0.95).setStrokeStyle(1, 3235702, 0.88),
      n = this.add
        .rectangle(t / 2, i / 2, t - 6, i - 6, 728363, 0.48)
        .setStrokeStyle(1, 9303295, 0.14),
      h = this.add.text(10, 6, 'MOBILITY // CORE', {
        fontFamily: 'Orbitron',
        fontSize: e ? '7px' : '8px',
        fontStyle: 'bold',
        color: '#e8fdff',
        letterSpacing: 0.8,
      }),
      d = this.add.text(10, e ? 22 : 24, 'DASH', {
        fontFamily: 'Orbitron',
        fontSize: e ? '8px' : '9px',
        fontStyle: 'bold',
        color: '#91aabd',
      }),
      c = this.add
        .text(t - 10, e ? 21 : 23, 'READY', {
          fontFamily: 'Orbitron',
          fontSize: e ? '8px' : '9px',
          fontStyle: 'bold',
          color: '#8df4ff',
          align: 'right',
        })
        .setOrigin(1, 0),
      y = this.add.text(e ? 82 : 90, e ? 22 : 24, 'BOOST', {
        fontFamily: 'Orbitron',
        fontSize: e ? '8px' : '9px',
        fontStyle: 'bold',
        color: '#91aabd',
      }),
      p = this.add
        .text(t - 10, e ? 39 : 41, 'READY', {
          fontFamily: 'Orbitron',
          fontSize: e ? '8px' : '9px',
          fontStyle: 'bold',
          color: '#8df4ff',
          align: 'right',
        })
        .setOrigin(1, 0);
    (l.add([r, o, n, h, d, c, y, p]),
      (this.mobilityHUD = l),
      (this.mobilityDashText = d),
      (this.mobilityBoostText = y),
      (this.mobilityDashState = c),
      (this.mobilityBoostState = p),
      this.updateMobilityHUD());
  }
  updateMobilityHUD() {
    if (!this.mobilityHUD || !this.mobilityHUD.active) return;
    const e = Math.max(0, Number(this.dashCooldown || 0));
    e > 0
      ? (this.mobilityDashState?.setText(Math.ceil(e / 100) / 10 + 's'),
        this.mobilityDashState?.setColor(e < 500 ? '#ffcf82' : '#ff826e'))
      : (this.mobilityDashState?.setText('READY'), this.mobilityDashState?.setColor('#8df4ff'));
    const t = Math.max(0, Number(this.boostCooldown || 0));
    t > 0
      ? (this.mobilityBoostState?.setText(Math.ceil(t / 100) / 10 + 's'),
        this.mobilityBoostState?.setColor(t < 500 ? '#ffcf82' : '#ff826e'))
      : (this.mobilityBoostState?.setText('READY'), this.mobilityBoostState?.setColor('#8df4ff'));
  }
  createDetectionHUD() {
    const e = this.scale.width < 768,
      t = Math.min(this.scale.width - 32, e ? 215 : 250),
      i = this.scale.width - t - 16,
      s = e ? 8 : 125,
      a = this.add.container(i, s).setScrollFactor(0).setDepth(100);
    e && a.setVisible(!0);
    const l = this.add
        .rectangle(t / 2, 34, t + 10, 70, 1181453, 0.2)
        .setStrokeStyle(2, 16733028, 0.16),
      r = this.add.rectangle(t / 2 + 4, 37, t, 68, 0, 0.48),
      o = this.add.rectangle(t / 2, 34, t, 68, 1116431, 0.97).setStrokeStyle(1.5, 16733028, 0.82),
      n = this.add.rectangle(t / 2, 34, t - 8, 60, 1707285, 0.78).setStrokeStyle(1, 7352381, 0.42),
      h = this.add.rectangle(t / 2, 4, t - 22, 2, 16733028, 0.28),
      d = this.add.rectangle(t / 2 - 60, 4, 48, 2, 16767454, 0.92),
      c = this.add.rectangle(t - 7, 34, 3, 50, 16733028, 1),
      y = this.add.rectangle(t - 11, 34, 2, 42, 16733028, 0.2),
      p = this.add.text(14, 9, 'DETECTION', {
        fontFamily: 'Orbitron',
        fontSize: e ? '9px' : '10px',
        color: '#ff7180',
        fontStyle: 'bold',
        letterSpacing: 1.6,
        stroke: '#180910',
        strokeThickness: 4,
        shadow: { offsetX: 0, offsetY: 0, color: '#ff5364', blur: 8, fill: !0 },
      }),
      f = this.add.text(14, 22, 'THREAT TELEMETRY', {
        fontFamily: 'Orbitron',
        fontSize: '7px',
        color: '#875763',
        fontStyle: 'bold',
        letterSpacing: 1.05,
      }),
      u = this.add.text(14, 34, 'CLEAR', {
        fontFamily: 'Orbitron',
        fontSize: e ? '9px' : '11px',
        color: '#e8fdff',
        fontStyle: 'bold',
        letterSpacing: 0.6,
        stroke: '#180910',
        strokeThickness: 4,
      }),
      m = this.add.circle(t - 20, 13, 6, 16733028, 0.1),
      g = this.add.circle(t - 20, 13, 2.5, 16733028, 1),
      S = this.add.rectangle(t - 67, 28, 78, 6, 3216671, 1).setStrokeStyle(1, 6697019, 0.72),
      w = this.add.rectangle(t - 106, 28, 76, 3, 16733028, 1).setOrigin(0, 0.5),
      x = this.add.rectangle(t - 106, 26, 76, 1.5, 16767454, 0.88).setOrigin(0, 0.5),
      b = this.add
        .text(t - 67, 39, '0%', {
          fontFamily: 'Orbitron',
          fontSize: '8px',
          color: '#ff7180',
          fontStyle: 'bold',
          letterSpacing: 0.4,
          stroke: '#180910',
          strokeThickness: 2,
        })
        .setOrigin(0.5),
      C = this.add.rectangle(t / 2, 52, t - 38, 1, 7024700, 0.64),
      R = this.add.text(14, 59, 'SCAN ACTIVE  //  THREAT LINK', {
        fontFamily: 'Orbitron',
        fontSize: '7px',
        color: '#845964',
        fontStyle: 'bold',
        letterSpacing: 0.8,
      });
    (a.add([l, r, o, n, h, d, c, y, p, f, u, m, g, S, w, x, b, C, R]),
      this.tweens.add({
        targets: d,
        x: { from: t / 2 - 60, to: t / 2 + 60 },
        alpha: { from: 0.18, to: 0.95 },
        duration: 1250,
        yoyo: !0,
        repeat: -1,
        ease: 'Sine.inOut',
      }),
      this.tweens.add({
        targets: m,
        scale: { from: 0.8, to: 1.65 },
        alpha: { from: 0.05, to: 0.2 },
        duration: 700,
        yoyo: !0,
        repeat: -1,
        ease: 'Sine.inOut',
      }),
      this.tweens.add({
        targets: g,
        alpha: { from: 0.45, to: 1 },
        duration: 500,
        yoyo: !0,
        repeat: -1,
        ease: 'Sine.inOut',
      }),
      (this.detectionHUD = a),
      (this.detectionStatusText = u),
      (this.detectionProgressBar = w),
      (this.detectionProgressText = b),
      (this.detectionHUDCompact = e));
  }
  createBoostPads() {
    ((this.boostPads = this.physics.add.staticGroup()),
      this.mission.boostPads.forEach(([e, t]) => {
        this.boostPads.create(e, t, 'boost-pad').refreshBody();
      }),
      this.physics.add.overlap(
        this.player,
        this.boostPads,
        () => {
          const e = this.player?.body;
          if (
            !e ||
            !this.player?.active ||
            this.afkCryostasisActive ||
            this.boostCooldown > 0 ||
            e.velocity.y < -60
          )
            return;
          if (
            ((this.boostCooldown = 260),
            e.setVelocityY(-825),
            !this.motionReduced && this.player?.active)
          ) {
            const e = this.add
              .circle(this.player.x, this.player.y + 24, 8, 9303295, 0.28)
              .setDepth(11);
            (this.tweens.add({
              targets: e,
              scaleX: 3.2,
              scaleY: 0.55,
              alpha: 0,
              duration: 190,
              ease: 'Quad.out',
              onComplete: () => e.destroy(),
            }),
              this.tweens.add({
                targets: this.player,
                scaleX: 0.94 * this.playerVisualBaseScaleX,
                scaleY: 1.08 * this.playerVisualBaseScaleY,
                duration: 60,
                yoyo: !0,
                ease: 'Quad.out',
              }));
          }
          if (
            (this.playerCue('BOOST LAUNCH', '#8df4ff'),
            this.gadgetPulse(9303295, 12, 320),
            this.worldLightPulse(9303295, 0.18, 240, 58),
            !this.motionReduced && this.player?.active)
          )
            for (let e = 0; e < 2; e++) {
              const t = this.add
                .ellipse(this.player.x, this.player.y + 24, 18, 7, 9303295, 0.28)
                .setStrokeStyle(1.5, 15269375, 0.78)
                .setDepth(11);
              this.tweens.add({
                targets: t,
                scaleX: 2.8,
                scaleY: 1.6,
                alpha: 0,
                delay: 70 * e,
                duration: 220,
                ease: 'Quad.out',
                onComplete: () => {
                  t?.active && t.destroy();
                },
              });
            }
          this.worldLightFlash(9303295, 0.045, 110);
          const t = this.add
            .circle(this.player.x, this.player.y + 20, 10, 9303295, 0.38)
            .setDepth(11);
          (this.tweens.add({
            targets: t,
            scale: 4.4,
            alpha: 0,
            duration: 270,
            ease: 'Quad.out',
            onComplete: () => t.destroy(),
          }),
            this.graphicsLevel >= 1 &&
              this.dust.emitParticleAt(this.player.x, this.player.y + 24, 7),
            this.game.events.emit('feedback', 'jump'));
        },
        void 0,
        this,
      ));
  }
  createChaser() {
    (this.mission.chase || this.mission.enemies.length) &&
      ((this.chaser = this.physics.add
        .sprite(this.mission.spawn.x - 220, this.mission.spawn.y, 'chaser')
        .setDepth(9)
        .setVisible(!1)),
      this.chaser.body.setAllowGravity(!1).setSize(34, 52).setOffset(9, 4).setEnable(!1),
      (this.chaseSection = -1),
      this.physics.add.overlap(
        this.player,
        this.chaser,
        () => {
          if (this.afkCryostasisActive) return;
          !this.motionReduced &&
            this.graphicsLevel >= 2 &&
            this.cameras.main.flash(180, 255, 60, 60);
          const e = this.add.circle(this.player.x, this.player.y, 16, 16745070, 0.34).setDepth(13);
          (this.tweens.add({
            targets: e,
            scale: 3.8,
            alpha: 0,
            duration: 260,
            onComplete: () => e.destroy(),
          }),
            this.shake(120, 0.006),
            this.fail('The interceptor reclaimed the signal.'));
        },
        void 0,
        this,
      ));
  }
  updateChaser(e) {
    if (!this.chaser) return;
    const t = this.mission.chase?.sections || [];
    t.forEach((e, t) => {
      if (!this.chaseWarnings.has(t) && this.player.x >= e.start - 260 && this.player.x < e.start) {
        this.chaseWarnings.add(t);
        const i = this.add
          .zone(e.start - 235, 250, 1, 1)
          .setAlpha(0)
          .setDepth(13);
        this.tweens.add({
          targets: i,
          alpha: 0,
          delay: 1300,
          duration: 500,
          onComplete: () => i.destroy(),
        });
      }
    });
    let i = t.findIndex((e) => this.player.x >= e.start && this.player.x <= e.end);
    const s =
      -1 === i && this.alarmTimer > 0 ? { start: 0, end: this.worldWidth, speed: 260 } : null;
    if ((s && (i = -2), -1 === i))
      return void (
        -1 !== this.chaseSection &&
        (this.chaseEscapes++,
        this.chaser.setVisible(!1),
        this.chaser.body.setEnable(!1),
        (this.chaseSection = -1),
        this.game.events.emit('chase', !1))
      );
    const a = s || t[i];
    if (i !== this.chaseSection) {
      ((this.chaseSection = i),
        this.chaser.setPosition(this.player.x - 210, this.player.y).setVisible(!0),
        this.chaser.body.setEnable(!0).updateFromGameObject());
      const e = this.add
        .zone(this.player.x, this.player.y - 78, 1, 1)
        .setAlpha(0)
        .setDepth(13);
      (this.tweens.add({
        targets: e,
        y: e.y - 20,
        alpha: 0,
        duration: 620,
        onComplete: () => e.destroy(),
      }),
        this.game.events.emit('feedback', 'chase'),
        this.game.events.emit('chase', !0));
    }
    const l = this.player.x - 38;
    ((this.chaser.x = Math.min(l, this.chaser.x + (a.speed * e) / 1e3)),
      (this.chaser.y = Phaser.Math.Linear(this.chaser.y, this.player.y, 0.12)),
      this.chaser.body.updateFromGameObject());
  }
  createGoal() {
    ((this.goal = this.physics.add
      .staticImage(this.mission.goal.x, this.mission.goal.y, 'goal')
      .setOrigin(0, 0)),
      this.goal.refreshBody());
    const e = this.add.circle(this.goal.x + 28, this.goal.y + 34, 28, 16765038, 0.08).setDepth(7),
      t = this.add
        .circle(this.goal.x + 28, this.goal.y + 34, 22, 16765038, 0)
        .setStrokeStyle(2, 16769192, 0.55)
        .setDepth(8);
    this.motionReduced ||
      (this.tweens.add({
        targets: e,
        scale: { from: 0.75, to: 1.45 },
        alpha: { from: 0.04, to: 0.18 },
        duration: 900,
        yoyo: !0,
        repeat: -1,
        ease: 'Sine.inOut',
      }),
      this.tweens.add({
        targets: t,
        scale: { from: 0.75, to: 1.9 },
        alpha: { from: 0.6, to: 0 },
        duration: 1100,
        repeat: -1,
        ease: 'Quad.out',
      }));
    const i = this.time.addEvent({
      delay: 16,
      loop: !0,
      callback: () => {
        if (!this.goal?.active || !e?.active || !t?.active)
          return (i.remove(), e?.destroy(), void t?.destroy());
        ((e.x = this.goal.x + 28),
          (e.y = this.goal.y + 34),
          (t.x = this.goal.x + 28),
          (t.y = this.goal.y + 34));
      },
    });
    ((this.goalBeaconFollow = i),
      this.motionReduced ||
        this.tweens.add({
          targets: this.goal,
          scaleX: 1.06,
          scaleY: 1.06,
          duration: 680,
          yoyo: !0,
          repeat: -1,
        }),
      this.physics.add.overlap(
        this.player,
        this.goal,
        () => {
          if (this.afkCryostasisActive) return;
          if (this.goalTouched) return;
          if (this.boss?.active)
            return (
              this.playerCue(
                `${this.boss.getData('bossName') || 'ALPHA DINO'} BLOCKS THE RELAY · DEFEAT IT`,
                '#ffcf82',
              ),
              void (this.player?.body && this.player.body.setVelocityX(-260))
            );
          this.goalTouched = !0;
          const e = this.add
            .text(this.goal.x + 28, this.goal.y - 18, 'DELIVERY LOCK', {
              fontFamily: 'Orbitron',
              fontSize: '10px',
              color: '#ffd06e',
              stroke: '#08101c',
              strokeThickness: 3,
            })
            .setOrigin(0.5)
            .setDepth(14);
          this.tweens.add({
            targets: e,
            y: e.y - 18,
            alpha: 0,
            duration: 650,
            ease: 'Quad.out',
            onComplete: () => e.destroy(),
          });
          const t = this.add
            .circle(this.goal.x + 28, this.goal.y + 34, 18, 16765038, 0.38)
            .setDepth(13);
          (this.tweens.add({
            targets: t,
            scale: 4.5,
            alpha: 0,
            duration: 420,
            onComplete: () => t.destroy(),
          }),
            !this.motionReduced &&
              this.graphicsLevel >= 2 &&
              this.cameras.main.flash(180, 255, 208, 110),
            this.shake(120, 0.005),
            this.complete());
        },
        void 0,
        this,
      ));
  }
  createAtmosphere() {
    const e = Number.isFinite(this.graphicsLevel) ? this.graphicsLevel : 2,
      t = { 0: 0.45, 1: 0.7, 2: 1, 3: 1.25 }[e] ?? 1,
      i = { 0: 0, 1: 55, 2: 35, 3: 24 }[e] ?? 35,
      s = e >= 1 ? 1 : 0;
    ((this.rain = this.add
      .particles(0, 0, 'rain', {
        x: { min: 0, max: 1350 },
        y: -10,
        speedY: { min: 320, max: 470 },
        speedX: -55,
        lifespan: 1700,
        frequency: i,
        quantity: s,
        scale: { start: 0.55 * t, end: 0.55 * t },
        alpha: { start: 0.5, end: 0 },
        blendMode: 'ADD',
      })
      .setScrollFactor(0.4)
      .setVisible(this.rainEnabled && e >= 1)),
      (this.dust = this.add.particles(0, 0, 'dust', {
        speedX: { min: -45, max: 45 },
        speedY: { min: -15, max: -70 },
        lifespan: 350,
        quantity: 0,
        scale: { start: 0.7 * t, end: 0 },
        alpha: { start: 0.4, end: 0 },
      })),
      (this.speedLines = this.add.particles(0, 0, 'speed-line', {
        speedX: { min: -220, max: -130 },
        speedY: { min: -12, max: 12 },
        lifespan: 210,
        quantity: 0,
        scale: { start: 0.7 * t, end: 0.15 * t },
        alpha: { start: 0.42, end: 0 },
        blendMode: 'ADD',
      })));
    const a = {
      'first-delivery': ['NIGHT RAIN', 7180202],
      'dead-drop': ['HARBOR FOG', 12047583],
      blackout: ['GRID FLICKER', 9303295],
      pursuit: ['CROSSWIND', 9151172],
      'signal-storm': ['SIGNAL STORM', 12162047],
      'corporate-lockdown': ['ASH FRONT', 16745070],
      'final-relay': ['ORBITAL STATIC', 16769192],
    }[this.mission?.id] || ['NIGHT SKY', 9303295];
    this.weatherOverlay = this.add
      .rectangle(640, 360, 1280, 720, a[1], 0.045)
      .setScrollFactor(0)
      .setDepth(18)
      .setBlendMode(Phaser.BlendModes.ADD);
  }
  updateWeather(e) {
    if (((this.weatherTimer += e), this.weatherTimer < 6200)) return;
    ((this.weatherTimer = 0), (this.weatherPhase = (this.weatherPhase + 1) % 2));
    const t = 1 === this.weatherPhase,
      i = (Number.isFinite(this.graphicsLevel) ? this.graphicsLevel : 2) >= 1;
    if (
      (this.weatherOverlay?.setAlpha(i ? (t ? 0.14 : 0.045) : 0),
      t && 'signal-storm' === this.mission.id)
    ) {
      ((Number.isFinite(this.graphicsLevel) ? this.graphicsLevel : 2) >= 2 &&
        this.cameras.main.flash(100, 160, 120, 255),
        this.game.events.emit('feedback', 'warning'));
    }
    t &&
      'pursuit' === this.mission.id &&
      (this.playerCue('CROSSWIND · HOLD YOUR LINE', '#b9f5ff'), this.gadgetPulse(9151172, 9, 300));
  }
  createGuides() {
    (Array.isArray(this.mission?.guides) ? this.mission.guides : []).forEach(
      ({ x: e, y: t, text: i }) => {
        const s = this.add?.zone?.(Number(e) || 0, Number(t) || 0, 1, 1);
        if (!s)
          return void console.warn('[Relay Runner] Guide skipped: Phaser zone was not created.', {
            x: e,
            y: t,
            text: i,
          });
        (s.setAlpha?.(0), s.setDepth?.(2), s.setData?.('guideText', i || ''));
        const a = Number.isFinite(this.graphicsLevel) ? this.graphicsLevel : 2;
        !this.motionReduced &&
          a >= 2 &&
          this.tweens?.add &&
          this.tweens.add({
            targets: s,
            alpha: { from: 0.9, to: 0.25 },
            y: (Number(t) || 0) - 5,
            duration: 900,
            yoyo: !0,
            repeat: -1,
          });
      },
    );
  }
  createGuideCompanions() {
    const e =
      'first-delivery' === this.mission.id
        ? [
            [360, 470, 'alien-guide', 'ALIEN SCOUT · FOLLOW THE GOLD SIGNALS'],
            [1720, 470, 'guide-drone', 'GUIDE DRONE · CHECKPOINTS SAVE YOUR RUN'],
          ]
        : [
            [
              this.mission.spawn.x + 540,
              470,
              'guide-drone',
              'ROUTE GUIDE · ENERGY AND HEALTH RESTORED',
            ],
            [this.mission.goal.x - 620, 430, 'alien-guide', 'ALIEN SCOUT · THE RELAY IS CLOSE'],
          ];
    ((this.guideCompanions = this.physics.add.group()),
      e.forEach(([e, t, i, s]) => {
        const a = this.guideCompanions?.create(e, t, i);
        if (!a)
          return void console.warn(
            '[Relay Runner] Guide companion skipped: Phaser sprite was not created.',
            { x: e, y: t, texture: i, lesson: s },
          );
        (a.setDepth?.(9),
          a.setData?.('lesson', s),
          a.body?.setAllowGravity?.(!1)?.setCircle?.(14, 6, 5),
          a.setData('baseY', t),
          a.setData('proximityCooldown', 0),
          a.setData('blinkCooldown', Phaser.Math.Between(1600, 3200)));
        const l = Number.isFinite(this.graphicsLevel) ? this.graphicsLevel : 2;
        !this.motionReduced &&
          l >= 2 &&
          this.tweens.add({
            targets: a,
            y: t - 12,
            duration: 760,
            yoyo: !0,
            repeat: -1,
            ease: 'Sine.inOut',
          });
        const r = this.add
          .ellipse(a.x, t + 25, 34, 9, 'alien-guide' === i ? 1182749 : 398111, 0.38)
          .setDepth(4);
        (a.setData('shadow', r),
          !this.motionReduced &&
            l >= 2 &&
            this.tweens.add({
              targets: r,
              scaleX: { from: 0.72, to: 1.08 },
              scaleY: { from: 0.72, to: 1 },
              alpha: { from: 0.2, to: 0.42 },
              duration: 760,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
            }));
        const o = this.time.addEvent({
          delay: 16,
          loop: !0,
          callback: () => {
            if (!a.active || !r.active) return (o.remove(), void r.destroy());
            ((r.x = a.x), (r.y = a.y + 25));
          },
        });
        a.setData('shadowTimer', o);
        const n = this.add
          .circle(
            a.x,
            a.y,
            7,
            'signal-storm' === this.mission.id
              ? 12162047
              : 'pursuit' === this.mission.id
                ? 16745070
                : 'final-relay' === this.mission.id
                  ? 16765038
                  : 9303295,
            0.16,
          )
          .setDepth(7);
        (a.setData('missionSignal', n),
          this.motionReduced ||
            this.tweens.add({
              targets: n,
              scale: { from: 0.7, to: 'final-relay' === this.mission.id ? 1.8 : 1.45 },
              alpha: { from: 0.08, to: 'signal-storm' === this.mission.id ? 0.34 : 0.22 },
              duration:
                'signal-storm' === this.mission.id
                  ? 560
                  : 'pursuit' === this.mission.id
                    ? 420
                    : 760,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
            }));
        const h = this.time.addEvent({
          delay: 16,
          loop: !0,
          callback: () => {
            if (!a.active || !n.active) return (h.remove(), void n.destroy());
            ((n.x = a.x), (n.y = a.y));
          },
        });
        a.setData('missionSignalTimer', h);
        const d = this.add.container(a.x, a.y).setDepth(8);
        if ((a.setData('fxContainer', d), !this.motionReduced && 'alien-guide' === i)) {
          const e = this.add.circle(0, 0, 30, 12162047, 0.07),
            t = this.add.circle(0, 0, 23, 14723071, 0.08),
            s = this.add.circle(0, 0, 18, 9303295, 0).setStrokeStyle(1.5, 12162047, 0.72),
            l = this.add.circle(0, 5, 4, 15269375, 0.9),
            r = this.add.circle(0, 5, 9, 9303295, 0).setStrokeStyle(1.5, 9303295, 0.55),
            o = this.add.rectangle(0, -7, 30, 3, 2364719, 0);
          (d.add([e, t, s, r, l, o]),
            a.setData('alienFx', {
              alienAura: e,
              alienGlow: t,
              alienRing: s,
              alienSignal: r,
              alienCore: l,
              blinkBar: o,
            }),
            this.tweens.add({
              targets: e,
              scale: { from: 0.92, to: 1.12 },
              alpha: { from: 0.05, to: 0.16 },
              duration: 1050,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
            }),
            this.tweens.add({
              targets: t,
              scale: { from: 0.92, to: 1.08 },
              alpha: { from: 0.06, to: 0.18 },
              duration: 820,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
            }),
            this.tweens.add({
              targets: s,
              scale: { from: 0.82, to: 1.45 },
              alpha: { from: 0.68, to: 0 },
              duration: 1100,
              repeat: -1,
              ease: 'Sine.out',
            }),
            this.tweens.add({
              targets: r,
              scale: { from: 0.75, to: 1.35 },
              alpha: { from: 0.65, to: 0 },
              duration: 760,
              repeat: -1,
              ease: 'Sine.out',
            }),
            this.tweens.add({
              targets: l,
              scale: { from: 0.85, to: 1.3 },
              alpha: { from: 0.55, to: 1 },
              duration: 620,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
            }));
          const n = this.time.addEvent({
            delay: 16,
            loop: !0,
            callback: () => {
              if (!a.active || !d.active) return (n.remove(), void d.destroy());
              d.setPosition(a.x, a.y);
              if (
                Phaser.Math.Distance.Between(this.player.x, this.player.y, a.x, a.y) < 130 &&
                a.getData('proximityCooldown') <= 0
              ) {
                a.setData('proximityCooldown', 900);
                const e = 'alien-guide' === i ? '#e0a7ff' : '#8df4ff',
                  t = this.add
                    .text(a.x, a.y - 46, 'alien-guide' === i ? '◈ ALLY DETECTED' : '◈ DRONE LINK', {
                      fontFamily: 'Orbitron',
                      fontSize: '9px',
                      color: e,
                      stroke: '#08101c',
                      strokeThickness: 4,
                    })
                    .setOrigin(0.5)
                    .setDepth(15)
                    .setAlpha(0);
                (this.tweens.add({
                  targets: t,
                  alpha: { from: 0, to: 1 },
                  y: t.y - 7,
                  duration: 140,
                  ease: 'Quad.out',
                }),
                  this.time.delayedCall(520, () => {
                    t.active &&
                      this.tweens.add({
                        targets: t,
                        alpha: 0,
                        y: t.y - 5,
                        duration: 220,
                        onComplete: () => t.destroy(),
                      });
                  }),
                  this.tweens.add({
                    targets: a,
                    scaleX: 1.12,
                    scaleY: 1.12,
                    duration: 110,
                    yoyo: !0,
                    ease: 'Sine.inOut',
                  }),
                  this.tweens.add({
                    targets: r,
                    scale: { from: 1, to: 2.1 },
                    alpha: { from: 0.85, to: 0 },
                    duration: 380,
                    ease: 'Quad.out',
                  }),
                  this.tweens.add({
                    targets: l,
                    scale: { from: 1, to: 1.9 },
                    alpha: { from: 1, to: 0.2 },
                    duration: 260,
                    yoyo: !0,
                    ease: 'Sine.inOut',
                  }));
              }
              const e = Math.max(0, (a.getData('proximityCooldown') || 0) - 16);
              a.setData('proximityCooldown', e);
              const t = a.getData('blinkCooldown') || 0;
              t <= 0
                ? (a.setData('blinkCooldown', Phaser.Math.Between(2200, 4300)),
                  this.tweens.add({
                    targets: o,
                    alpha: { from: 0, to: 0.92 },
                    scaleY: { from: 0.2, to: 1 },
                    duration: 70,
                    yoyo: !0,
                    hold: 45,
                    ease: 'Quad.inOut',
                  }))
                : a.setData('blinkCooldown', Math.max(0, t - 16));
            },
          });
          a.setData('fxTimer', n);
        }
        if (!this.motionReduced && 'guide-drone' === i) {
          const e = this.add.circle(0, 0, 14, 9303295, 0.035),
            t = this.add.circle(0, 0, 7, 9303295, 0.06),
            i = this.add.circle(0, 0, 5, 15269375, 0.34),
            s = this.add.circle(0, 0, 11, 9303295, 0).setStrokeStyle(1.5, 9303295, 0.7),
            l = this.add.arc(0, 0, 14, 0, 105, !1, 9303295, 0.75),
            r = null,
            o = this.add.circle(0, -15, 2.2, 5627903, 0.9);
          (d.add([e, t, i, s, l, o]),
            a.setData('droneFx', {
              droneGlow: e,
              dronePulse: t,
              corePulse: i,
              scanRing: s,
              scanArc: l,
              scanBeam: r,
              statusLight: o,
            }),
            this.tweens.add({
              targets: e,
              scale: { from: 0.88, to: 1.16 },
              alpha: { from: 0.06, to: 0.2 },
              duration: 900,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
            }),
            this.tweens.add({
              targets: t,
              scale: { from: 0.8, to: 1.65 },
              alpha: { from: 0.32, to: 0 },
              duration: 780,
              repeat: -1,
              ease: 'Sine.out',
            }),
            this.tweens.add({
              targets: i,
              scale: { from: 0.8, to: 1.75 },
              alpha: { from: 0.45, to: 0 },
              duration: 700,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
            }),
            this.tweens.add({
              targets: s,
              scale: { from: 0.82, to: 1.5 },
              alpha: { from: 0.7, to: 0 },
              duration: 950,
              repeat: -1,
              ease: 'Sine.out',
            }),
            this.tweens.add({ targets: l, angle: 360, duration: 2400, repeat: -1, ease: 'Linear' }),
            this.tweens.add({
              targets: o,
              alpha: { from: 0.25, to: 1 },
              scale: { from: 0.7, to: 1.35 },
              duration: 430,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.inOut',
            }));
          const n = this.time.addEvent({
            delay: 16,
            loop: !0,
            callback: () => {
              if (!a.active || !d.active) return (n.remove(), void d.destroy());
              d.setPosition(a.x, a.y);
            },
          });
          a.setData('fxTimer', n);
        }
      }),
      this.physics.add.overlap(
        this.player,
        this.guideCompanions,
        (e, t) => {
          if (!t?.active) return;
          ('alien-guide' === t.texture.key
            ? [12162047, 14723071, 9303295]
            : [9303295, 5627903, 15269375]
          ).forEach((e, i) => {
            const s = this.add.circle(t.x, t.y, 7 + 3 * i, e, 0.32).setDepth(12);
            this.tweens.add({
              targets: s,
              scale: 2.4 + 0.55 * i,
              alpha: 0,
              duration: 260 + 90 * i,
              ease: 'Quad.out',
              onComplete: () => s.destroy(),
            });
          });
          const i = this.add
            .circle(t.x, t.y, 12, 'alien-guide' === t.texture.key ? 14723071 : 9303295, 0.28)
            .setDepth(13);
          (this.tweens.add({
            targets: i,
            scale: 3.8,
            alpha: 0,
            duration: 320,
            onComplete: () => i.destroy(),
          }),
            this.collectGuideCompanion(t));
        },
        void 0,
        this,
      ));
  }
  collectGuideCompanion(e) {
    e?.active &&
      (e.disableBody(!0, !0),
      (this.energy = Math.min(this.energyMax, this.energy + 30)),
      (this.health = Math.min(3, this.health + 1)),
      this.game.events.emit('health', this.health),
      this.updatePlayerStatusHUD(),
      this.game.events.emit('tutorial', e.getData('lesson')),
      this.game.events.emit('narration', e.getData('lesson')),
      this.game.events.emit('character-response', 'Support received. Back in the run.'),
      this.showIntelCard(
        'ALLY INTEL',
        [
          e.getData('lesson'),
          'Allies restore energy and one health. Tap this card or press ESC whenever you are ready.',
        ],
        '#aee37f',
      ),
      this.playerCue('ALLY SUPPORT · +30 ENERGY', '#aee37f'),
      this.gadgetPulse(11461503, 18, 420));
  }
  collectSignal(e) {
    if (!e.active) return;
    (this.boosterTimer > 0 &&
      (this.boostedSignals++,
      this.playerCue('BOOSTED SIGNAL', '#8df4ff'),
      this.gadgetPulse(9303295, 10, 300)),
      this.graphicsLevel >= 1 &&
        (this.dust.emitParticleAt(e.x, e.y, 14), this.speedLines.emitParticleAt(e.x, e.y, 5)),
      e.disableBody(!0, !0),
      this.collected++);
    const t = this.boosterTimer > 0 ? 12 : 6;
    (this.addPolarity(t, this.boosterTimer > 0 ? 'boosted-signal' : 'signal'),
      this.updateSignalInterference(0),
      this.playerCue('SIGNAL ACQUIRED', '#ffd06e'),
      this.gadgetPulse(16765038, 10, 300),
      this.mission.signals.length - this.collected === 1 &&
        (this.playerCue('ONE SIGNAL LEFT', '#ffd06e'), this.gadgetPulse(16765038, 12, 340)),
      this.game.events.emit('signal', this.collected, this.mission.signals.length),
      this.game.events.emit('feedback', 'signal'));
    const i = this.add?.circle?.(e.x, e.y, 12, 16765038, 0.75);
    (i &&
      (i.setBlendMode(Phaser.BlendModes.ADD),
      i.setDepth(11),
      this.tweens.add({
        targets: i,
        scale: 4.8,
        alpha: 0,
        duration: 360,
        ease: 'Quad.out',
        onComplete: () => {
          i?.active && i.destroy();
        },
      })),
      this.tweens.add({
        targets: this.player,
        scaleX: 1.12,
        scaleY: 1.12,
        yoyo: !0,
        duration: 90,
      }));
  }
  collectSecret(e) {
    if (!e.active) return;
    e.disableBody(!0, !0);
    const t = Number.isFinite(this.graphicsLevel) ? this.graphicsLevel : 2;
    if (!this.motionReduced && t >= 2) {
      const t = this.add.circle(e.x, e.y, 12, 12162047, 0.3).setDepth(13);
      (t.setStrokeStyle(2, 14723071, 0.95),
        this.tweens.add({
          targets: t,
          scale: 5.4,
          alpha: 0,
          duration: 520,
          ease: 'Quad.out',
          onComplete: () => t.destroy(),
        }));
      const i = this.add.circle(e.x, e.y, 5, 16777215, 0.85).setDepth(14);
      (this.tweens.add({
        targets: i,
        scale: 2.8,
        alpha: 0,
        duration: 300,
        ease: 'Quad.out',
        onComplete: () => i.destroy(),
      }),
        this.cameras.main.flash(110, 170, 110, 220),
        this.shake(70, 0.0025));
    }
    (this.secretsCollected++,
      this.addPolarity(15, 'secret'),
      this.playerCue('SECRET ACQUIRED', '#b993ff'),
      this.gadgetPulse(12162047, 12, 340),
      this.game.events.emit('secret', this.secretsCollected, this.mission.secrets.length),
      this.game.events.emit('feedback', 'secret_collect'));
  }
  activateCheckpoint(e) {
    if ('noCheckpoints' === this.loadout.modifier?.id) return;
    const t = e.getData('index');
    if (t <= (this.checkpoint.index ?? -1)) return;
    const i = this.safeCheckpointSpawn(e.x);
    ((this.checkpoint = {
      index: t,
      ...i,
      signals: new Set(
        this.signals
          .getChildren()
          .filter((e) => !e.active)
          .map((e) => e.getData('id')),
      ),
      secrets: new Set(
        this.secrets
          .getChildren()
          .filter((e) => !e.active)
          .map((e) => e.getData('id')),
      ),
    }),
      e.setTint(14679295),
      this.tweens.killTweensOf(e),
      this.motionReduced ||
        this.tweens.add({
          targets: e,
          alpha: { from: 1, to: 0.72 },
          duration: 180,
          yoyo: !0,
          repeat: 2,
          ease: 'Sine.inOut',
          onComplete: () => {
            e?.active && e.setAlpha(1);
          },
        }));
    const s = this.add.circle(e.x, e.y, 12, 9303295, 0.35).setDepth(11);
    if (
      (s.setStrokeStyle(2, 15269375, 0.9),
      this.tweens.add({
        targets: s,
        scale: 3.8,
        alpha: 0,
        duration: 360,
        ease: 'Quad.out',
        onComplete: () => s.destroy(),
      }),
      !this.motionReduced)
    ) {
      const t = this.add
          .circle(e.x, e.y - 22, 7, 9303295, 0.16)
          .setStrokeStyle(1, 12187135, 0.75)
          .setDepth(10),
        i = this.add
          .circle(e.x, e.y - 22, 12, 9303295, 0)
          .setStrokeStyle(1, 9303295, 0.45)
          .setDepth(10),
        s = this.add.rectangle(e.x, e.y - 44, 22, 2, 15269375, 0.55).setDepth(11);
      (this.tweens.add({
        targets: t,
        scale: 2.8,
        alpha: 0,
        duration: 420,
        ease: 'Quad.out',
        onComplete: () => t.destroy(),
      }),
        this.tweens.add({
          targets: i,
          scale: 2.2,
          alpha: 0,
          duration: 500,
          ease: 'Quad.out',
          onComplete: () => i.destroy(),
        }),
        this.tweens.add({
          targets: s,
          y: s.y + 38,
          alpha: 0,
          duration: 340,
          ease: 'Sine.inOut',
          onComplete: () => s.destroy(),
        }),
        this.worldLightPulse(12187135, 0.12, 220, 42));
    }
    (this.game.events.emit('checkpoint', this.collected, this.secretsCollected, 0, t),
      this.game.events.emit('feedback', 'checkpoint_activate'));
  }
  useEnergy(e, t) {
    if (!this.mission.energyEnabled) return !0;
    if (
      (this.loadout.upgrades?.includes('efficiency') && (e *= 0.9),
      'wallRun' === t && this.loadout.upgrades?.includes('wallEfficiency') && (e *= 0.8),
      this.energy < e)
    )
      return (
        this.game.events.emit('feedback', 'empty'),
        this.lowEnergyCueTimer <= 0 &&
          ((this.lowEnergyCueTimer = 700),
          this.playerCue('LOW ENERGY', '#ff9c91'),
          this.gadgetPulse(16745070, 11, 320)),
        !1
      );
    if (((this.energy -= e), !this.tutorials.has(t))) {
      this.tutorials.add(t);
      const e = {
        vault: 'VAULT · RUN INTO BARRIER',
        slide: 'SLIDE · HOLD S',
        wallRun: 'WALL RUN · HOLD INTO WALL',
        airDash: 'AIR DASH · SHIFT IN AIR',
        ledgeGrab: 'LEDGE GRAB · PRESS SPACE AT WALL',
        climb: 'CLIMB · W AT WALL',
      };
      this.game.events.emit('tutorial', e[t]);
    }
    return !0;
  }
  useGadget(e) {
    if (this.finished || this.respawning || this.cinematicActive || this.relayPuzzleActive) return;
    const t = this.loadout.equipment?.[e];
    if (!t || this.gadgetCooldowns[e] > 0) return;
    const i = this.loadout.upgrades || [];
    if ('scanner' === t) {
      const e = this.getSignalInterferenceLevel(),
        t = this.getSignalInterferenceTier(e),
        s = i.includes('signalSense') ? 680 : 500,
        a = this.signals.getChildren().filter((e) => e.active && Math.abs(e.x - this.player.x) < s);
      a.forEach((e) => e.setTint(9303295));
      const l = a.sort(
        (e, t) =>
          Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y) -
          Phaser.Math.Distance.Between(this.player.x, this.player.y, t.x, t.y),
      )[0];
      if (l) {
        t >= 3 && !this.signalOverrideTriggered && this.spawnSignalGhostEcho();
        const e = this.add
          .circle(l.x, l.y, 19, 9303295, 0.18)
          .setStrokeStyle(2, 12187135, 0.85)
          .setDepth(10);
        this.tweens.add({
          targets: e,
          scale: 2.2,
          alpha: 0,
          duration: 850,
          onComplete: () => e.destroy(),
        });
      }
      (this.gadgetPulse(9303295, 14, 420),
        this.game.events.emit(
          'tutorial',
          l ? 'SCANNER · NEXT SIGNAL MARKED' : 'SCANNER · NO SIGNAL IN RANGE',
        ));
    }
    ('emp' === t &&
      ((this.empTimer = 3500),
      this.gadgetPulse(9303295, 20, 620),
      this.enemies?.getChildren().forEach((e) => e.setTint(9303295)),
      this.game.events.emit('tutorial', 'EMP · PATROLS DISABLED')),
      'decoy' === t &&
        ((this.decoyTimer = 3200),
        (this.alarmTimer = 0),
        this.decoyBeacon?.destroy(),
        (this.decoyBeacon = this.add
          .circle(this.player.x, this.player.y + 18, 10, 16765038, 0.8)
          .setStrokeStyle(2, 16773301)
          .setDepth(10)),
        this.tweens.add({
          targets: this.decoyBeacon,
          scale: { from: 0.75, to: 1.55 },
          alpha: { from: 0.9, to: 0.25 },
          duration: 420,
          yoyo: !0,
          repeat: -1,
        }),
        this.game.events.emit('tutorial', 'DECOY · ATTENTION DIVERTED')),
      'booster' === t &&
        ((this.boosterTimer = 8e3),
        this.boosterAura?.destroy(),
        (this.boosterAura = this.add
          .circle(this.player.x, this.player.y, 24, 16765038, 0.14)
          .setStrokeStyle(2, 16765038, 0.65)
          .setDepth(9)),
        this.tweens.add({
          targets: this.boosterAura,
          scale: { from: 0.9, to: 1.35 },
          alpha: { from: 0.5, to: 0.12 },
          duration: 520,
          yoyo: !0,
          repeat: -1,
        }),
        this.game.events.emit('tutorial', 'SIGNAL BOOSTER · ACTIVE')),
      'cell' === t &&
        ((this.energy = Math.min(this.energyMax, this.energy + 35)),
        this.gadgetPulse(11461503, 13, 300),
        this.game.events.emit('tutorial', 'ENERGY CELL · +35 ENERGY')),
      (this.gadgetCooldowns[e] =
        'scanner' === t
          ? 5500
          : 'emp' === t
            ? 9e3
            : 'decoy' === t
              ? 8e3
              : 'booster' === t
                ? 12e3
                : 1e4),
      this.playerCue(`${t.toUpperCase()} · READY`, '#ffd06e'));
    const s = this.add.circle(this.player.x, this.player.y, 12, 16765038, 0.35).setDepth(11);
    (this.tweens.add({
      targets: s,
      scale: 2.8,
      alpha: 0,
      duration: 280,
      onComplete: () => s.destroy(),
    }),
      this.game.events.emit('feedback', 'gadget'));
  }
  tryVault() {
    const e = this.player?.body;
    if (!e || !this.player?.active) return !1;
    const t = e.blocked.down || e.touching.down;
    if (
      !this.abilities.has('vault') ||
      this.vaultCooldown > 0 ||
      !t ||
      Math.abs(e.velocity.x) < 130 ||
      !this.useEnergy(12, 'vault')
    )
      return !1;
    ((this.vaultCooldown = 450),
      e.setVelocityY(-510),
      !this.motionReduced &&
        this.player?.active &&
        this.tweens.add({
          targets: this.player,
          scaleX: 1.08 * this.playerVisualBaseScaleX,
          scaleY: 0.9 * this.playerVisualBaseScaleY,
          duration: 70,
          yoyo: !0,
          ease: 'Quad.out',
        }));
    const i = this.add.circle(this.player.x, this.player.y + 22, 11, 12187135, 0.34).setDepth(12);
    return (
      this.tweens.add({
        targets: i,
        scaleX: 4.5,
        scaleY: 0.65,
        alpha: 0,
        duration: 210,
        ease: 'Quad.out',
        onComplete: () => i.destroy(),
      }),
      this.player.setTint(12187135),
      this.time.delayedCall(180, () => this.player?.active && this.player.clearTint()),
      this.game.events.emit('feedback', 'vault'),
      !0
    );
  }
  updateEnemies(e) {
    if (((this.enemyAiTimer = Math.max(0, (this.enemyAiTimer || 0) - e)), this.enemyAiTimer > 0))
      return;
    if (((this.enemyAiTimer = 33), this.safeStartZoneActive)) {
      const e = this.safeStartZone;
      if (
        this.player &&
        this.player.x >= e.x &&
        this.player.x <= e.x + e.width &&
        Math.abs(this.player.y - e.y) <= e.height
      )
        return void this.enemies?.getChildren().forEach((e) => {
          if (!e?.active) return;
          (e.setData('aiState', 'SAFE_PATROL'),
            e.setData('lastKnownX', e.x),
            e.setData('lastKnownY', e.y));
          const t = e.getData('route');
          if (!t || !e.body) return void e.getData('indicator')?.setAlpha(0.1);
          const i = Number(e.getData('patrolDirection')) || 1,
            s = 'enemy-runner' === e.texture?.key ? 55 : 'chicken' === e.texture?.key ? 35 : 42;
          (e.body.setVelocityX(s * i),
            e.x >= t.max && (e.setData('patrolDirection', -1), e.body.setVelocityX(-s)),
            e.x <= t.min && (e.setData('patrolDirection', 1), e.body.setVelocityX(s)),
            e.getData('indicator')?.setAlpha(0.12));
        });
      ((this.safeStartZoneActive = !1),
        this.safeStartZoneWarned ||
          ((this.safeStartZoneWarned = !0),
          this.playerCue('SAFE ZONE EXITED · HOSTILE TERRITORY', '#ff826e'),
          this.game.events.emit('feedback', 'hostile_territory')));
    }
    const t = Phaser.Math.Clamp(this.signalInterference || 0, 0, 1),
      i = this.getSignalInterferenceTier(t),
      s = i >= 3 ? 70 : i >= 2 ? 45 : i >= 1 ? 20 : 0,
      a =
        (this.mission.blackout && this.loadout.upgrades?.includes('ghost')
          ? 190
          : this.mission.blackout
            ? 260
            : 320) + s;
    if (this.afkCryostasisActive)
      return void this.enemies?.getChildren()?.forEach((e) => {
        e?.active && e.body && e.body.setVelocity(0, 0);
      });
    if (!this.enemies) return;
    if (this.empTimer > 0 || this.decoyTimer > 0)
      return void this.enemies.getChildren().forEach((e) => e.getData('indicator')?.setAlpha(0.1));
    (this.enemies.getChildren().forEach((t) => {
      if (!t.active) return;
      const s = t.getData('route');
      if (!s) return;
      const l = s.type;
      let r = t.getData('direction');
      const o = Math.abs(t.x - this.player.x),
        n = Math.abs(t.y - this.player.y),
        h = t.getData('aiState') || 'IDLE',
        d = t.getData('indicator');
      if (d?.active && !this.motionReduced) {
        const e = Phaser.Math.Clamp(1 - o / a, 0, 1);
        let t = Phaser.Math.Linear(0.1, 0.34, e),
          i = Phaser.Math.Linear(0.82, 1.12, e);
        if ('HUNT' === h) {
          const e = 0.5 + 0.5 * Math.sin(this.time.now / 95);
          ((t = Phaser.Math.Linear(0.24, 0.58, e)), (i = Phaser.Math.Linear(1, 1.35, e)));
        } else if ('SEARCH' === h) {
          const e = 0.5 + 0.5 * Math.sin(this.time.now / 170);
          ((t = Phaser.Math.Linear(0.14, 0.32, e)), (i = Phaser.Math.Linear(0.92, 1.12, e)));
        }
        (d.setAlpha(t).setScale(i),
          d.setStrokeStyle(
            'HUNT' === h ? 1.6 : 1,
            'HUNT' === h ? 16733028 : 16766405,
            'HUNT' === h ? 0.92 : 0.6,
          ));
      }
      const c =
        ('HUNT' === h
          ? 'dino' === l
            ? 96
            : 'enemy-runner' === l
              ? 145
              : 'security' === l
                ? 78
                : 'invader' === l
                  ? 42
                  : 58
          : 'dino' === l
            ? 74
            : 'enemy-runner' === l && o < 300
              ? 118
              : 'invader' === l
                ? 28
                : 'security' === l
                  ? 55
                  : 38) *
        ('HUNT' === h
          ? i >= 4
            ? 1.18
            : i >= 3
              ? 1.12
              : i >= 2
                ? 1.07
                : i >= 1
                  ? 1.03
                  : 1
          : i >= 3
            ? 1.05
            : 1);
      if (
        ('HUNT' === h &&
          (t.setData('lastKnownX', this.player.x),
          t.setData('lastKnownY', this.player.y),
          o > 420 || n > 180
            ? (t.setData('aiState', 'SEARCH'), t.setData('aiTimer', 1800))
            : ((r = this.player.x < t.x ? -1 : 1), t.setData('direction', r), t.setFlipX(r < 0))),
        'RETURN' === h)
      ) {
        let i = Number(t.getData('aiTimer')) || 0;
        ((i = Math.max(0, i - e)), t.setData('aiTimer', i));
        const a = t.getData('patrolOriginX') ?? (s.min + s.max) / 2;
        ((r = t.x < a ? 1 : -1),
          t.setData('direction', r),
          t.setFlipX(r < 0),
          (i <= 0 || Math.abs(t.x - a) < 24) &&
            (t.setData('aiState', 'IDLE'), t.setData('aiTimer', 0)));
      }
      if ('SEARCH' === h) {
        let i = Number(t.getData('aiTimer')) || 0;
        ((i = Math.max(0, i - e)),
          t.setData('aiTimer', i),
          o < a &&
            n < 150 &&
            (t.setData('aiState', 'HUNT'),
            t.setData('aiTimer', 0),
            (r = this.player.x < t.x ? -1 : 1),
            t.setData('direction', r),
            t.setFlipX(r < 0)));
        const s = Number(t.getData('lastKnownX'));
        ((r = t.x < s ? 1 : -1),
          Math.abs(t.x - s) < 28 && (t.setData('aiState', 'RETURN'), t.setData('aiTimer', 1200)),
          t.setData('direction', r),
          t.setFlipX(r < 0),
          i <= 0 && (t.setData('aiState', 'RETURN'), t.setData('aiTimer', 1200)));
      } else 'enemy-runner' === l && o < 300 && (r = this.player.x < t.x ? -1 : 1);
      ((t.x += (r * c * e) / 1e3),
        (t.x >= s.max || t.x <= s.min) && ((r *= -1), t.setData('direction', r), t.setFlipX(r < 0)),
        t.body.updateFromGameObject());
      const y = 'security' === l || 'guard' === l,
        p = (this.mission.blackout && this.player.y, t.getData('indicator')),
        f = o < a && n < 100,
        u = t.getData('aiState') || 'IDLE';
      if (
        ('IDLE' === u &&
          o < a * (i >= 4 ? 2.15 : i >= 3 ? 2 : i >= 2 ? 1.9 : 1.8) &&
          n < (i >= 3 ? 170 : 150) &&
          (t.setData('lastKnownX', this.player.x),
          t.setData('lastKnownY', this.player.y),
          t.setData('aiState', i >= 3 ? 'ALERT' : 'SUSPICIOUS'),
          t.setData('aiTimer', i >= 4 ? 450 : i >= 3 ? 650 : 900)),
        'SUSPICIOUS' === u)
      ) {
        let i = Number(t.getData('aiTimer')) || 0;
        ((i = Math.max(0, i - e)),
          t.setData('aiTimer', i),
          i <= 0 && (t.setData('aiState', 'IDLE'), t.setData('aiTimer', 0)));
      }
      if ('ALERT' === u) {
        let i = Number(t.getData('aiTimer')) || 0;
        ((i = Math.max(0, i - e)),
          t.setData('aiTimer', i),
          i <= 0 && (t.setData('aiState', 'HUNT'), t.setData('aiTimer', 0)));
      }
      (p
        ?.setPosition(t.x, t.y - 30)
        .setAlpha(o < Math.max(260, 1.6 * a) && n < 150 ? 0.92 : 0.28)
        .setFillStyle(f ? 16765038 : 16745070),
        f &&
          !t.getData('alerted') &&
          (t.setData('alerted', !0),
          t.setData('aiState', 'ALERT'),
          t.setData('aiTimer', 500),
          this.playerCue(
            ('security' === l ? 'SECURITY' : 'HOSTILE') + ' HAS EYES ON YOU',
            '#ffcf82',
          )),
        f || t.setData('alerted', !1),
        y &&
          f &&
          (this.alarmTimer <= 0 && (this.alarms++, this.game.events.emit('feedback', 'chase')),
          (this.alarmTimer = this.alarmDuration(3400))));
    }),
      this.alarmTimer > 0 && (this.alarmTimer = Math.max(0, this.alarmTimer - e)));
    const l = this.alarmTimer > 0 ? Math.ceil(this.alarmTimer / 100) : 0;
    if (
      (l !== this.detectionEmit &&
        ((this.detectionEmit = l), this.game.events.emit('detection', l)),
      this.detectionProgressBar && this.detectionProgressText && this.detectionStatusText)
    ) {
      const e = Math.max(1, this.alarmDuration(3400)),
        t = Phaser.Math.Clamp(Math.round((this.alarmTimer / e) * 100), 0, 100);
      this.detectionProgressBar.scaleX = t / 100;
      const i = `${t}%`,
        s = t > 0 ? (t >= 75 ? 'ALERT' : 'DETECTED') : 'CLEAR';
      (this.detectionHUD && this.detectionHUDCompact && this.detectionHUD.setVisible(t > 0),
        this.detectionProgressText.text !== i && this.detectionProgressText.setText(i),
        this.detectionStatusText.text !== s && this.detectionStatusText.setText(s),
        this.detectionStatusText.setColor(
          'ALERT' === s ? '#ff5364' : 'DETECTED' === s ? '#ffb36e' : '#e8fdff',
        ),
        this.detectionHUD &&
          this.detectionHUDCompact &&
          (t >= 75 ? this.detectionHUD.setScale(1.02) : this.detectionHUD.setScale(1)),
        this.detectionHUD &&
          this.detectionHUDCompact &&
          t <= 0 &&
          (this.detectionHUD.setVisible(!1), this.detectionHUD.setScale(1)));
    }
  }
  updateSciFiThreats(e) {
    if (
      ((this.scifiThreatTimer = Math.max(0, (this.scifiThreatTimer || 0) - e)),
      this.scifiThreatTimer > 0)
    )
      return;
    this.scifiThreatTimer = 33;
    const t = this.elapsedMs;
    if (this.empTimer > 0) return;
    if (!0 === this.bossVictoryLock)
      return void (
        this.boss?.active &&
        (this.boss.setData('nextShot', Number.MAX_SAFE_INTEGER),
        this.boss.setData('attackCooldown', Number.MAX_SAFE_INTEGER),
        this.boss.body && this.boss.body.setVelocity(0, 0))
      );
    if (this.boss?.active && !this.bossHealthUI) {
      const e = Math.min(this.scale.width - 40, 430),
        t = this.scale.width / 2,
        i = 38,
        s = Math.max(1, Number(this.boss.getData('health')) || 1);
      this.boss.setData('maxHealth', s);
      const a = this.add.container(0, 0).setScrollFactor(0).setDepth(120),
        l = this.add.rectangle(t, i, e, 58, 330004, 0.94).setStrokeStyle(1, 16745070, 0.72),
        r = this.add
          .text(t, i - 17, `BOSS // ${this.boss.getData('bossName') || 'THREAT'}`, {
            fontFamily: 'Orbitron',
            fontSize: this.scale.width < 600 ? '9px' : '10px',
            color: '#ffcf82',
            stroke: '#08101c',
            strokeThickness: 4,
            align: 'center',
          })
          .setOrigin(0.5),
        o = this.add.rectangle(t, i + 5, e - 28, 10, 1581880, 1).setStrokeStyle(1, 3359839, 0.85),
        n = this.add
          .rectangle(t - (e - 28) / 2 + 2, i + 5, e - 32, 6, 16745070, 1)
          .setOrigin(0, 0.5),
        h = this.add
          .text(t, i + 23, `HP ${s} / ${s}`, {
            fontFamily: 'Orbitron',
            fontSize: this.scale.width < 600 ? '8px' : '9px',
            color: '#8ba0b8',
            align: 'center',
          })
          .setOrigin(0.5);
      (a.add([l, r, o, n, h]),
        (this.bossHealthUI = {
          container: a,
          plate: l,
          title: r,
          barBack: o,
          barFill: n,
          hpText: h,
          width: e,
          maxHealth: s,
        }));
      const d = this.add
          .rectangle(t - (e - 28) / 2 + 0.5 * (e - 28), i + 5, 2, 14, 16764802, 0.85)
          .setScrollFactor(0)
          .setDepth(122),
        c = this.add
          .rectangle(t - (e - 28) / 2 + 0.25 * (e - 28), i + 5, 2, 14, 16745070, 0.85)
          .setScrollFactor(0)
          .setDepth(122);
      ((this.bossHealthUI.marker50 = d), (this.bossHealthUI.marker25 = c));
    }
    if (
      this.boss?.active &&
      Math.abs(this.boss.x - this.player.x) < 500 &&
      t >= this.boss.getData('nextShot')
    ) {
      if (!this.motionReduced && this.player?.active) {
        const e = this.boss.getData('bossColor') || 16745070,
          t = this.add.rectangle(this.boss.x, this.boss.y - 18, 10, 4, e, 0.18).setDepth(12);
        t.setStrokeStyle(2, 16773599, 0.85);
        const i = this.add
          .rectangle(
            this.boss.x,
            this.player.y,
            Math.min(500, Math.abs(this.player.x - this.boss.x)),
            2,
            e,
            0.32,
          )
          .setDepth(11);
        (this.player.x < this.boss.x
          ? (i.x = this.boss.x - i.width / 2)
          : (i.x = this.boss.x + i.width / 2),
          this.tweens.add({
            targets: t,
            scaleX: 2.8,
            scaleY: 1.8,
            alpha: 0,
            duration: 180,
            ease: 'Quad.out',
            onComplete: () => t.destroy(),
          }),
          this.tweens.add({
            targets: i,
            alpha: 0,
            scaleX: 0.96,
            duration: 180,
            ease: 'Quad.out',
            onComplete: () => i.destroy(),
          }));
      }
      const e = this.comets
        .create(this.boss.x, this.boss.y - 20, 'comet')
        .setDepth(11)
        .setTint(this.boss.getData('bossColor') || 16745070);
      if (
        (e.setData('bossProjectile', !0),
        e.body
          .setAllowGravity(!1)
          .setVelocity(
            (this.player.x - this.boss.x) * (2 === this.boss.getData('phase') ? 1.05 : 0.8),
            'storm-boss' === this.boss.getData('route')?.type
              ? 2 === this.boss.getData('phase')
                ? 340
                : 250
              : 2 === this.boss.getData('phase')
                ? 145
                : 100,
          ),
        this.boss.setData('nextShot', t + this.boss.getData('attackCooldown')),
        2 === this.boss.getData('phase') && !this.bossSecondShotPending)
      ) {
        const e = 180;
        ((this.bossSecondShotPending = !0),
          this.time.delayedCall(e, () => {
            if (
              ((this.bossSecondShotPending = !1),
              !this.boss?.active ||
                this.finished ||
                this.respawning ||
                this.respawnGrace > 0 ||
                !0 === this.bossVictoryLock)
            )
              return;
            if (Math.abs(this.boss.x - this.player.x) > 620) return;
            if (!this.motionReduced && this.boss?.active && this.player?.active) {
              const e = this.boss.getData('bossColor') || 16745070,
                t = this.add.rectangle(this.boss.x, this.boss.y + 8, 9, 4, e, 0.18).setDepth(12);
              (t.setStrokeStyle(2, 16773599, 0.8),
                this.tweens.add({
                  targets: t,
                  scaleX: 2.6,
                  scaleY: 1.7,
                  alpha: 0,
                  duration: 120,
                  ease: 'Quad.out',
                  onComplete: () => t.destroy(),
                }));
            }
            const e = this.comets
              .create(this.boss.x, this.boss.y + 6, 'comet')
              .setDepth(11)
              .setTint(this.boss.getData('bossColor') || 16745070);
            (e.setData('bossProjectile', !0),
              e.body
                .setAllowGravity(!1)
                .setVelocity(
                  1.05 * (this.player.x - this.boss.x),
                  'storm-boss' === this.boss.getData('route')?.type ? 340 : 145,
                ),
              this.playerCue('SECONDARY VOLLEY', '#ff826e'),
              this.gadgetPulse(16745070, 13, 280));
          }));
      }
      (this.playerCue(`${this.boss.getData('bossName')} ATTACK`, '#ff826e'),
        this.game.events.emit('feedback', 'warning'));
    }
    this.enemies.getChildren().forEach((e) => {
      if (!e.active) return;
      const i = e.getData('route')?.type;
      if (
        ('chicken' === i && this.updateChickenFireBreath(e, t),
        'chicken' === i || 'invader' === i || 'enemy-runner' === i)
      ) {
        const s = 'chicken' === i ? 360 : 'invader' === i ? 320 : 280;
        if (
          Math.abs(this.player.x - e.x) < s &&
          Math.abs(this.player.y - e.y) < 190 &&
          t >= e.getData('nextShot')
        ) {
          if ('chicken' === i && this.startChickenFireBreath(e, t)) return;
          const s = 'chicken' === i ? 'egg' : 'comet';
          if (!this.motionReduced && e?.active) {
            const t = this.add
              .circle(
                e.x,
                e.y - 4,
                'chicken' === i ? 7 : 9,
                'chicken' === i ? 16765038 : 16733028,
                0.2,
              )
              .setDepth(10);
            (t.setStrokeStyle(2, 'chicken' === i ? 16773319 : 16745070, 0.82),
              this.tweens.add({
                targets: t,
                scale: 1.9,
                alpha: 0,
                duration: 120,
                ease: 'Quad.out',
                onComplete: () => t.destroy(),
              }));
            const s = this.add
              .rectangle(
                e.x,
                e.y - 4,
                'chicken' === i ? 18 : 24,
                2,
                'chicken' === i ? 16765038 : 16733028,
                0.38,
              )
              .setDepth(10);
            this.tweens.add({
              targets: s,
              scaleX: 1.8,
              alpha: 0,
              duration: 110,
              ease: 'Quad.out',
              onComplete: () => s.destroy(),
            });
          }
          const a = this.player?.body;
          if (!a || !this.player?.active) return;
          const l = this.player.x + 0.22 * a.velocity.x,
            r = this.eggs.create(e.x, e.y + 12, s).setDepth(11);
          (r.setData('createdAt', t),
            r.body.setAllowGravity(!1).setVelocity(0.72 * (l - e.x), 'chicken' === i ? 210 : 90),
            e.setData(
              'nextShot',
              t + ('enemy-runner' === i ? 1500 : 'invader' === i ? 1900 : 2400),
            ),
            this.playerCue('chicken' === i ? 'EGG INCOMING' : 'ENEMY FIRE', '#ff826e'),
            this.game.events.emit('feedback', 'warning'));
        }
      }
      if (
        ('invader' === i &&
          ((e.y += 0.22 * Math.sin((t + e.x) / 260)), e.body.updateFromGameObject()),
        'dino' === i &&
          Math.abs(e.x - this.player.x) < 240 &&
          Math.abs(e.y - this.player.y) < 95 &&
          t >= e.getData('nextShot'))
      ) {
        (e.setData('nextShot', t + 1700), e.setTint(16745070));
        const i = this.player?.body;
        if (!i) return void e.clearTint();
        (this.tweens.add({
          targets: e,
          x: this.player.x + 0.12 * i.velocity.x,
          duration: 340,
          onComplete: () => e.clearTint(),
        }),
          Math.abs(e.x - this.player.x) < 66 &&
            this.takeSciFiHit('A dinosaur charge knocked the courier down.', e.x, e.y));
      }
    });
    const i = signatureThreats[this.mission.id],
      s =
        this.enemies
          .getChildren()
          .find(
            (e) =>
              e.active && Math.abs(e.x - this.player.x) < 250 && e.getData('route')?.type === i,
          ) ||
        this.enemies
          .getChildren()
          .find(
            (e) =>
              e.active &&
              Math.abs(e.x - this.player.x) < 180 &&
              enemyIntel[e.getData('route')?.type],
          );
    (s && this.showEnemyIntel(s.getData('route')?.type),
      this.enemies.getChildren().forEach((e) => {
        if (
          !e.active ||
          'alien-ground' !== e.getData('route')?.type ||
          t < e.getData('nextShot') ||
          Math.abs(e.x - this.player.x) > 360
        )
          return;
        const i = this.eggs.create(e.x, e.y, 'comet').setDepth(11);
        (i.setData('projectileType', 'alien-bolt'),
          i.setData('createdAt', t),
          i.body
            .setAllowGravity(!1)
            .setVelocity(0.78 * (this.player.x - e.x), 0.35 * (this.player.y - e.y) - 45),
          e.setData('nextShot', t + 1650),
          this.playerCue('GROUND ALIEN FIRE', '#ff826e'));
      }),
      this.enemies.getChildren().forEach((e) => {
        if (!e.active) return;
        const i = e.getData('route')?.type,
          s = e.getData('direction') || 1;
        'enemy-runner' === i || 'alien-ground' === i
          ? e.setAngle(7 * s)
          : 'dino' === i || 'dino-boss' === i
            ? e.setAngle(4 * s)
            : 'invader' === i && e.setAngle(9 * Math.sin((t + e.x) / 240));
      }));
    const a = Number(this.mission.difficulty?.split('/')[0]) || 1;
    if (
      (!this.motionReduced &&
        this.comets?.active &&
        this.comets.getChildren().forEach((e) => {
          if (!e?.active) return void e?.getData('trail')?.destroy();
          const t = e.getData('trail');
          t?.active &&
            (t.clear(), t.lineStyle(2, 9303295, 0.34), t.lineBetween(e.x, e.y - 6, e.x, e.y - 54));
        }),
      (this.cometTimer -= e),
      a >= 3 && this.cometTimer <= 0)
    ) {
      const e = this.comets
        .create(Math.min(this.worldWidth - 80, this.player.x + 360), -30, 'comet')
        .setDepth(11);
      if (!this.motionReduced && e?.active) {
        const t = this.add.graphics().setDepth(10);
        (e.setData('trail', t),
          t.lineStyle(2, 9303295, 0.34),
          t.lineBetween(e.x, e.y - 6, e.x, e.y - 58));
      }
      (e.body.setAllowGravity(!1).setVelocity(-80, 520),
        (this.cometTimer = Math.max(2400, 5600 - 420 * a)),
        this.game.events.emit('feedback', 'warning'));
    }
  }
  updateBuilds() {
    if (!this.player) return;
    const e = Number.isFinite(this.elapsedMs) ? this.elapsedMs : 0;
    this.turrets?.active &&
      this.turrets.getChildren().forEach((t) => {
        if (!t?.active) return;
        const i = t.getData('expires');
        if (Number.isFinite(i) && e >= i) return void t.destroy();
        if (!this.enemies?.active) return;
        const s = Number(t.getData('nextTargetCheck')) || 0;
        let a = t.getData('target') || null;
        (e >= s || !a?.active) &&
          ((a =
            this.enemies
              .getChildren()
              .find((e) => e?.active && Math.abs(e.x - t.x) < 460 && Math.abs(e.y - t.y) < 220) ||
            null),
          t.setData('target', a),
          t.setData('nextTargetCheck', e + 100));
        const l = Number(t.getData('nextShot')) || 0;
        if (!a || e < l || !this.plasma?.active) return;
        const r = a.x - t.x,
          o = a.y - t.y,
          n = Math.max(1, Math.hypot(r, o)),
          h = this.plasma.create(t.x, t.y - 10, 'plasma').setDepth(12);
        if (!h?.body) return void h?.destroy();
        (h.setData('power', 1),
          h.setData('createdAt', e),
          h.body.setAllowGravity(!1).setVelocity((r / n) * 720, (o / n) * 720),
          t.setData('nextShot', e + 620));
        const d = this.add.circle(t.x, t.y, 7, 9303295, 0.24).setDepth(11);
        this.tweens.add({
          targets: d,
          scale: 2.2,
          alpha: 0,
          duration: 110,
          onComplete: () => d.destroy(),
        });
      });
    const t = (t, i, s) => {
      t?.active &&
        t.getChildren().forEach((t) => {
          if (!t?.active) return;
          const a = Number(t.getData?.('createdAt')),
            l = Number.isFinite(a) && e - a > i,
            r = Math.abs(t.x - this.player.x) > s || Math.abs(t.y - this.player.y) > 720;
          var o;
          (l || r) && (o = t) && (o.getData?.('trail')?.destroy?.(), o.destroy?.());
        });
    };
    (t(this.plasma, 1800, 1100),
      t(this.kineticBalls, 1800, 1300),
      t(this.eggs, 4200, 1600),
      t(this.comets, 1 / 0, 1800));
  }
  updateNarrative() {
    (this.mission.story?.radio || []).forEach(([e, t], i) => {
      if (!this.storyBeatsSeen.has(i) && this.player.x >= e) {
        this.storyBeatsSeen.add(i);
        const e = this.add
          .text(this.player.x, this.player.y - 96, t, {
            fontFamily: 'Orbitron',
            fontSize: '11px',
            color: '#dffcff',
            stroke: '#08101c',
            strokeThickness: 4,
            wordWrap: { width: 370 },
            align: 'center',
          })
          .setOrigin(0.5)
          .setDepth(14);
        (this.tweens.add({
          targets: e,
          y: e.y - 22,
          alpha: 0,
          delay: 1900,
          duration: 520,
          onComplete: () => e.destroy(),
        }),
          this.game.events.emit('narration', t),
          this.time.delayedCall(1150, () =>
            this.game.events.emit(
              'character-response',
              ['Copy that.', 'Relay runner moving.', 'I see it.', 'On the line.'][i % 4],
            ),
          ),
          this.game.events.emit('feedback', 'signal'));
      }
    });
  }
  updateEvents() {
    (Array.isArray(this.mission?.events) ? this.mission.events : []).forEach((e, t) => {
      const i = this.eventState.get(t) || '';
      if (!i && this.player.x >= e.x - 260) {
        this.eventState.set(t, 'warned');
        const i = this.add?.zone?.(e.x - 120, 250, 1, 1) || null;
        (i?.setAlpha?.(0),
          i?.setDepth?.(13),
          i &&
            this.tweens.add({
              targets: i,
              alpha: 0,
              delay: 1500,
              duration: 500,
              onComplete: () => {
                i?.active && i.destroy();
              },
            }),
          this.game.events.emit('feedback', 'warning'));
      } else
        'warned' === i &&
          this.player.x >= e.x &&
          (this.eventState.set(t, 'active'),
          'blackout' === e.type
            ? (this.cameras.main.flash(180, 30, 70, 110),
              this.game.events.emit('feedback', 'warning'))
            : ((this.alarmTimer = this.alarmDuration('chase' === e.type ? 5e3 : 3e3)),
              this.alarms++,
              this.game.events.emit('feedback', 'chase')));
    });
  }
  startChickenFireBreath(e, t) {
    if (!e?.active || !this.player?.active) return !1;
    const i = Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y),
      s = Math.abs(this.player.y - e.y);
    if (i < 140 || i > 360 || s > 150) return !1;
    if (t < (Number(e.getData('fireNext')) || 0)) return !1;
    if (Math.random() > 0.38) return !1;
    if ((Number(e.getData('fireUntil')) || 0) > t) return !1;
    const a = 420;
    (e.setData('fireChargeUntil', t + a), e.setData('fireUntil', t + a + 850));
    const l = Phaser.Math.Angle.Between(e.x, e.y, this.player.x, this.player.y);
    (e.setData('fireAngle', l),
      e.setData('fireNextDamage', t + a),
      e.setData('fireHitLock', t + a),
      e.setData('fireNext', t + a + 4200),
      e.setData('nextShot', t + a + 4200));
    const r = this.add.graphics().setDepth(12);
    return (
      e.setData('fireFx', r),
      this.playerCue('CHICKEN FIRE BREATH · GET CLEAR', '#ff826e'),
      this.game.events.emit('feedback', 'warning'),
      this.game.events.emit('feedback', 'chicken-fire'),
      !0
    );
  }
  updateChickenFireBreath(e, t) {
    if (!e?.active) return;
    const i = Number(e.getData('fireUntil')) || 0,
      s = e.getData('fireFx');
    s && !s.active && e.setData('fireFx', null);
    const a = Number(e.getData('fireChargeUntil')) || 0;
    if (i <= 0 || t >= i)
      return (
        s && (s.destroy(), e.setData('fireFx', null)),
        e.setData('fireUntil', 0),
        e.setData('fireChargeUntil', 0),
        e.setData('fireNextDamage', 0),
        e.setData('fireHitLock', 0),
        void e.setData('fireAngle', 0)
      );
    if (!this.player?.active) return;
    if (a > t) {
      if (s) {
        s.clear();
        const i = Phaser.Math.Clamp((a - t) / 420, 0, 1),
          l = 0.55 + 0.2 * Math.sin(0.035 * t);
        (s
          .fillStyle(16733028, 0.08 + 0.16 * (1 - i))
          .fillCircle(e.x + 20, e.y - 5, 10 + 8 * (1 - i)),
          s
            .lineStyle(2, 16745070, 0.45 + 0.45 * (1 - i))
            .strokeCircle(e.x + 20, e.y - 5, 9 + 9 * (1 - i)),
          s.fillStyle(16765038, l).fillCircle(e.x + 20, e.y - 5, 4 + 4 * (1 - i)),
          s
            .lineStyle(2, 16765038, 0.2)
            .lineBetween(e.x + 24, e.y - 5, this.player.x, this.player.y));
      }
      return;
    }
    if (!this.player?.active) return;
    const l = Number(e.getData('fireAngle')) || 0,
      r = 310,
      o = Phaser.Math.DegToRad(22);
    if (s) {
      (s.clear(),
        s
          .fillStyle(16738858, 0.18)
          .fillTriangle(
            e.x + 20,
            e.y - 5,
            e.x + Math.cos(l - o) * r,
            e.y + Math.sin(l - o) * r,
            e.x + Math.cos(l + o) * r,
            e.y + Math.sin(l + o) * r,
          ),
        s
          .fillStyle(16761415, 0.28)
          .fillTriangle(
            e.x + 24,
            e.y - 5,
            e.x + 245 * Math.cos(l - 0.62 * o),
            e.y + 245 * Math.sin(l - 0.62 * o),
            e.x + 245 * Math.cos(l + 0.62 * o),
            e.y + 245 * Math.sin(l + 0.62 * o),
          ),
        s
          .fillStyle(16773808, 0.72)
          .fillTriangle(
            e.x + 26,
            e.y - 5,
            e.x + 145 * Math.cos(l - 0.28 * o),
            e.y + 145 * Math.sin(l - 0.28 * o),
            e.x + 145 * Math.cos(l + 0.28 * o),
            e.y + 145 * Math.sin(l + 0.28 * o),
          ),
        s.fillStyle(16769178, 0.9).fillCircle(e.x + 24, e.y - 5, 11));
      const i = 0.65 + 0.2 * Math.sin(0.035 * t),
        a = Math.cos(l),
        n = Math.sin(l);
      for (let l = 0; l < 7; l++) {
        const r = (l + 1) / 8,
          o = Math.sin(0.018 * t + 1.7 * l) * (7 + 10 * r),
          h = Math.cos(0.024 * t + 2.3 * l) * (4 + 7 * r),
          d = e.x + a * (28 + 245 * r) - n * o,
          c = e.y + n * (28 + 245 * r) + a * o + h,
          y = (1.5 + 3.2 * (1 - r)) * (0.8 + 0.35 * i);
        (s.fillStyle(l % 2 == 0 ? 16773288 : 16747064, 0.82 - 0.08 * r), s.fillCircle(d, c, y));
      }
      for (let i = 0; i < 5; i++) {
        const l = (7e-4 * t + 0.21 * i) % 1,
          r = 14 * Math.sin(0.021 * t + 2.4 * i),
          o = e.x + a * (55 + 245 * l) - n * r,
          h = e.y + n * (55 + 245 * l) + a * r - 10 * l;
        (s.fillStyle(16761948, 0.72 * (1 - l)), s.fillCircle(o, h, 1.2 + 1.5 * (1 - l)));
      }
      (s.fillStyle(16745070, i).fillCircle(e.x + 105 * Math.cos(l), e.y + 105 * Math.sin(l), 7),
        s.fillStyle(16765038, i).fillCircle(e.x + 175 * Math.cos(l), e.y + 175 * Math.sin(l), 5));
    }
    const n = Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y),
      h = Phaser.Math.Angle.Between(e.x, e.y, this.player.x, this.player.y);
    let d = Phaser.Math.Angle.Wrap(h - l);
    d = Math.abs(d);
    if (!(n >= 35 && n <= r && d <= o)) return;
    const c = Number(e.getData('fireNextDamage')) || 0,
      y = Number(e.getData('fireHitLock')) || 0;
    if (!(t < c || t < y)) {
      if (
        (e.setData('fireNextDamage', t + 220),
        e.setData('fireHitLock', t + 220),
        !this.motionReduced)
      ) {
        (this.cameras.main.shake(90, 0.004), this.cameras.main.flash(80, 255, 110, 60, !1));
        const e = this.add.circle(this.player.x, this.player.y, 10, 16738858, 0.65).setDepth(30);
        (e.setStrokeStyle(2, 16773808, 0.9),
          this.tweens.add({
            targets: e,
            scale: 2.8,
            alpha: 0,
            duration: 240,
            ease: 'Cubic.out',
            onComplete: () => e.destroy(),
          }));
      }
      this.takeSciFiHit('The chicken breathed fire on the courier.', this.player.x, this.player.y);
    }
  }
  complete() {
    if (this.finished) return;
    if (this.boss?.active)
      return (
        this.playerCue(
          `${this.boss.getData('bossName') || 'ALPHA DINO'} BLOCKS THE RELAY · DEFEAT IT`,
          '#ffcf82',
        ),
        void (this.player?.body && this.player.body.setVelocityX(-260))
      );
    if (
      ((this.finished = !0),
      this.physics.pause(),
      this.player.play('runner-finish', !0),
      this.player.setTint(16773037),
      !this.motionReduced && this.graphicsLevel >= 2 && this.cameras.main.flash(260, 255, 208, 110),
      this.game.events.emit('feedback', 'complete'),
      this.mission.story?.completion)
    ) {
      const e = this.add
        .text(this.goal.x + 20, this.goal.y - 88, this.mission.story.completion, {
          fontFamily: 'Orbitron',
          fontSize: '11px',
          color: '#dffcff',
          stroke: '#08101c',
          strokeThickness: 4,
          wordWrap: { width: 380 },
          align: 'center',
        })
        .setOrigin(0.5)
        .setDepth(14);
      this.tweens.add({
        targets: e,
        alpha: 0,
        delay: 2800,
        duration: 500,
        onComplete: () => e.destroy(),
      });
    }
    (this.graphicsLevel >= 1 &&
      (this.dust.emitParticleAt(this.goal.x + 20, this.goal.y + 25, 34),
      this.speedLines.emitParticleAt(this.goal.x + 20, this.goal.y + 25, 10)),
      this.tweens.add({
        targets: this.player,
        y: this.player.y - 12,
        duration: 130,
        yoyo: !0,
        repeat: 1,
      }));
    const e = this.add.circle(this.goal.x + 22, this.goal.y + 22, 20, 16765038, 0.75);
    (e.setBlendMode(Phaser.BlendModes.ADD), e.setDepth(12));
    const t = this.add
      .text(this.goal.x + 22, this.goal.y - 34, 'RELAY LINKED', {
        fontFamily: 'Orbitron',
        fontSize: '16px',
        color: '#fff0b5',
        stroke: '#08101c',
        strokeThickness: 5,
        shadow: { offsetX: 0, offsetY: 0, color: '#8df4ff', blur: 10, stroke: !0, fill: !0 },
      })
      .setOrigin(0.5)
      .setDepth(13)
      .setScale(0.65);
    (this.tweens.add({
      targets: e,
      scale: 8,
      alpha: 0,
      duration: 700,
      ease: 'Quad.out',
      onComplete: () => e.destroy(),
    }),
      this.tweens.add({ targets: t, scale: 1, y: t.y - 20, duration: 320, ease: 'Back.out' }),
      this.playerCue('MISSION COMPLETE', '#ffd06e'),
      this.gadgetPulse(16765038, 22, 520),
      !this.motionReduced &&
        this.graphicsLevel >= 2 &&
        (this.cameras.main.flash(140, 255, 214, 120), this.shake(120, 0.006)));
    const i = this.calculateMissionMedals();
    (this.time.delayedCall(
      650,
      () => {
        this.scene.isActive() && this.showMissionMedals();
      },
      void 0,
      this,
    ),
      this.time.delayedCall(
        120,
        () => {
          this.scene.isActive() &&
            this.game.events.emit('complete', this.collected, this.elapsedMs, {
              jumps: this.jumps,
              collisions: this.collisions,
              falls: this.falls,
              secrets: this.secretsCollected,
              alarms: this.alarms,
              chaseEscapes: this.chaseEscapes,
              enemyDefeats: this.enemyDefeats || 0,
              perfectDodges: this.perfectDodges || 0,
              bestCombatCombo: this.bestCombatCombo || 0,
              bossDefeated: Boolean(this.boss && !this.boss.active),
              medals: i,
              package: this.package,
              packageCondition: this.packageCondition,
              contract: this.mission.activeContract,
              modifier: this.loadout.modifier,
              signalBonusExtra:
                5 * this.boostedSignals +
                (this.loadout.upgrades?.includes('signalXp') ? this.collected : 0),
              score: 100 * this.collected + 250 * this.secretsCollected + 100 * this.boostedSignals,
            });
        },
        void 0,
        this,
      ));
  }
  calculateMissionMedals() {
    const e = Math.max(1, this.mission.signals?.length || 1),
      t = Phaser.Math.Clamp(this.collected / e, 0, 1),
      i = this.mission.secrets?.length || 0,
      s = i > 0 ? Phaser.Math.Clamp(this.secretsCollected / i, 0, 1) : 0,
      a = Math.max(1, this.elapsedMs / 1e3),
      l = Math.max(18, ((this.mission.goal?.x || 4e3) - (this.mission.spawn?.x || 0)) / 240),
      r = Phaser.Math.Clamp(l / a, 0, 1.35);
    this.runRating.speed = r >= 1.1 ? 3 : r >= 0.86 ? 2 : 1;
    const o = this.enemyDefeats || 0,
      n = Math.max(1, this.mission.enemies?.length || 1),
      h = Phaser.Math.Clamp(o / n, 0, 1);
    this.runRating.combat = h >= 0.75 ? 3 : h >= 0.35 ? 2 : 1;
    const d = 0.7 * t + 0.3 * s;
    this.runRating.collection = d >= 0.9 ? 3 : d >= 0.6 ? 2 : 1;
    const c = this.deaths || 0,
      y = this.collisions || 0,
      p = this.falls || 0;
    let f = 3;
    (c >= 2 ? (f = 1) : (1 === c || y >= 3 || p >= 3) && (f = 2), (this.runRating.survival = f));
    const u =
      this.runRating.speed +
      this.runRating.combat +
      this.runRating.collection +
      this.runRating.survival;
    return (
      (this.runRating.overall = u >= 11 ? 'S' : u >= 9 ? 'A' : u >= 7 ? 'B' : 'C'),
      (this.medalResult = {
        speed: this.runRating.speed,
        combat: this.runRating.combat,
        collection: this.runRating.collection,
        survival: this.runRating.survival,
        overall: this.runRating.overall,
        total: u,
        timeMs: this.elapsedMs,
        signals: this.collected,
        secrets: this.secretsCollected,
        deaths: c,
        collisions: y,
        falls: p,
        enemyDefeats: o,
        bossDefeated: Boolean(this.boss && !this.boss.active),
      }),
      this.medalResult
    );
  }
  showMissionMedals() {
    if (!this.medalResult || this.gameOverUI) return;
    if (this.missionMedalsUI) return;
    const e = this.medalResult,
      t = this.scale.width,
      i = this.scale.height,
      s = (e) => '★'.repeat(e) + '☆'.repeat(3 - e),
      a =
        'S' === e.overall
          ? '#fff0a8'
          : 'A' === e.overall
            ? '#8df4ff'
            : 'B' === e.overall
              ? '#aee37f'
              : '#ff826e',
      l = Math.min(t - 36, 430),
      r = Math.max(260, Math.min(i - 28, 330)),
      o = this.add
        .rectangle(t / 2, i / 2, l, r, 330004, 0.96)
        .setStrokeStyle(2, 9303295, 0.75)
        .setScrollFactor(0)
        .setDepth(120),
      n = this.add
        .text(t / 2, i / 2 - 132, 'MISSION COMPLETE', {
          fontFamily: 'Orbitron',
          fontSize: t < 600 ? '14px' : '16px',
          color: '#8df4ff',
          stroke: '#08101c',
          strokeThickness: 5,
          align: 'center',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(121),
      h = this.add
        .text(t / 2, i / 2 - 105, 'DELIVERY REPORT · RUN PERFORMANCE', {
          fontFamily: 'Orbitron',
          fontSize: t < 600 ? '8px' : '9px',
          color: '#6f849d',
          align: 'center',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(121),
      d = this.add
        .text(
          t / 2,
          i / 2 - 38,
          [
            `SPEED       ${s(e.speed)}`,
            `COMBAT      ${s(e.combat)}`,
            `COLLECTION  ${s(e.collection)}`,
            `SURVIVAL    ${s(e.survival)}`,
          ].join('\n'),
          {
            fontFamily: 'Orbitron',
            fontSize: t < 600 ? '10px' : '12px',
            color: '#dffcff',
            stroke: '#08101c',
            strokeThickness: 4,
            lineSpacing: 11,
            align: 'left',
          },
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(121),
      c = this.add
        .circle(
          t / 2,
          i / 2 + 78,
          t < 600 ? 44 : 52,
          Phaser.Display.Color.HexStringToColor(a).color,
          0.16,
        )
        .setScrollFactor(0)
        .setDepth(120);
    (c.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(a).color, 0.82),
      this.tweens.add({
        targets: c,
        scale: 2.4,
        alpha: 0,
        duration: 720,
        ease: 'Quad.out',
        onComplete: () => c.destroy(),
      }),
      this.time.delayedCall(220, () => {
        (this.tweens.add({ targets: y, alpha: 1, scale: 1, duration: 520, ease: 'Back.out' }),
          this.motionReduced ||
            this.cameras.main.flash(
              120,
              'S' === e.overall ? 255 : 'A' === e.overall ? 120 : 'B' === e.overall ? 140 : 255,
              'B' === e.overall ? 220 : 120,
              170,
            ));
      }));
    const y = this.add
        .text(t / 2, i / 2 + 78, e.overall, {
          fontFamily: 'Orbitron',
          fontSize: t < 600 ? '54px' : '64px',
          fontStyle: 'bold',
          color: a,
          stroke: '#08101c',
          strokeThickness: 8,
          align: 'center',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(121),
      p = this.add
        .text(
          t / 2,
          i / 2 + 125,
          `RATING ${e.total} / 12  ·  ${e.signals} SIGNALS  ·  ${e.secrets} SECRETS`,
          {
            fontFamily: 'Orbitron',
            fontSize: t < 600 ? '7px' : '8px',
            color: '#8ba0b8',
            align: 'center',
          },
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(121),
      f = [o, n, h, d, y, p];
    (f.forEach((e) => {
      (e.setAlpha(0), e.setScale(0.94));
    }),
      y.setScale(0.35),
      y.setAlpha(0),
      (this.missionMedalsUI = f),
      this.tweens.add({
        targets: f.filter((e) => e !== y),
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 360,
        ease: 'Back.out',
      }),
      this.tweens.add({
        targets: y,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 560,
        delay: 360,
        ease: 'Back.out',
        onComplete: () => {
          this.missionMedalsUI === f && (this.missionMedalsUI = null);
        },
      }));
  }
  showGameOverScreen(e = 'RUN ENDED') {
    if (this.gameOverUI) return;
    const t = this.scale.width,
      i = this.scale.height,
      s = Math.min(t - 36, 430),
      a = Math.min(i - 70, 390),
      l = Math.max(0, this.deathLimit - this.deaths),
      r = [],
      o = this.add
        .rectangle(t / 2, i / 2, t, i, 197899, 0.78)
        .setScrollFactor(0)
        .setDepth(119);
    r.push(o);
    const n = this.add
      .rectangle(t / 2, i / 2, s, a, 462104, 0.98)
      .setStrokeStyle(2, 16745070, 0.82)
      .setScrollFactor(0)
      .setDepth(120);
    r.push(n);
    const h = this.add
      .text(t / 2, i / 2 - 135, 'RUN FAILED', {
        fontFamily: 'Orbitron',
        fontSize: t < 600 ? '24px' : '30px',
        fontStyle: 'bold',
        color: '#ff826e',
        stroke: '#08101c',
        strokeThickness: 6,
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(121);
    r.push(h);
    const d = this.add
      .text(t / 2, i / 2 - 98, 'RECOVERY LIMIT REACHED', {
        fontFamily: 'Orbitron',
        fontSize: t < 600 ? '9px' : '11px',
        color: '#7f93ab',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(121);
    r.push(d);
    const c = this.add
      .text(t / 2, i / 2 - 52, e, {
        fontFamily: 'Orbitron',
        fontSize: t < 600 ? '9px' : '11px',
        color: '#dffcff',
        stroke: '#08101c',
        strokeThickness: 4,
        wordWrap: { width: s - 54 },
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(121);
    r.push(c);
    const y = this.add
      .text(
        t / 2,
        i / 2 + 5,
        [
          `DEATHS       ${this.deaths}`,
          `COLLISIONS   ${this.collisions}`,
          `FALLS        ${this.falls}`,
          `SIGNALS      ${this.collected}`,
          `SECRETS      ${this.secretsCollected}`,
          `RECOVERIES   ${l}`,
        ].join('\n'),
        {
          fontFamily: 'Orbitron',
          fontSize: t < 600 ? '10px' : '12px',
          color: '#b9f5ff',
          stroke: '#08101c',
          strokeThickness: 4,
          lineSpacing: 7,
          align: 'left',
        },
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(121);
    r.push(y);
    const p = this.add
      .rectangle(t / 2, i / 2 + 118, Math.min(s - 70, 250), 46, 1058362, 0.98)
      .setStrokeStyle(2, 9303295, 0.9)
      .setScrollFactor(0)
      .setDepth(121)
      .setInteractive({ useHandCursor: !0 });
    r.push(p);
    const f = this.add
      .text(t / 2, i / 2 + 118, 'RESTART RUN', {
        fontFamily: 'Orbitron',
        fontSize: t < 600 ? '11px' : '13px',
        fontStyle: 'bold',
        color: '#dffcff',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(122);
    r.push(f);
    const u = this.add
      .rectangle(t / 2, i / 2 + 174, Math.min(s - 70, 250), 40, 726308, 0.96)
      .setStrokeStyle(1, 5400445, 0.9)
      .setScrollFactor(0)
      .setDepth(121)
      .setInteractive({ useHandCursor: !0 });
    r.push(u);
    const m = this.add
      .text(t / 2, i / 2 + 174, 'RETURN TO BRIEFING', {
        fontFamily: 'Orbitron',
        fontSize: t < 600 ? '9px' : '10px',
        fontStyle: 'bold',
        color: '#8fa5bc',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(122);
    (r.push(m),
      p.on('pointerover', () => {
        (p.setFillStyle(1456978, 1).setStrokeStyle(2, 12187135, 1), f.setColor('#ffffff'));
      }),
      u.on('pointerover', () => {
        (u.setFillStyle(1319734, 1).setStrokeStyle(1, 9303295, 0.85), m.setColor('#dffcff'));
      }),
      u.on('pointerout', () => {
        (u.setFillStyle(726308, 0.96).setStrokeStyle(1, 5400445, 0.9), m.setColor('#8fa5bc'));
      }),
      u.on('pointerdown', () => {
        if (this.gameOverRestarting) return;
        ((this.gameOverRestarting = !0),
          this.gameOverUI?.forEach((e) => e.destroy()),
          (this.gameOverUI = null),
          this.scene.stop());
        const e = document.getElementById('intro'),
          t = document.getElementById('worldMap'),
          i = document.getElementById('preflight');
        (t?.classList.add('hidden'), i?.classList.add('hidden'), e?.classList.remove('hidden'));
      }),
      p.on('pointerout', () => {
        (p.setFillStyle(1058362, 0.98).setStrokeStyle(2, 9303295, 0.9), f.setColor('#dffcff'));
      }),
      p.on('pointerdown', () => {
        this.gameOverRestarting ||
          ((this.gameOverRestarting = !0),
          this.missionMedalsUI &&
            (this.missionMedalsUI.forEach((e) => {
              e && e.active && e.destroy();
            }),
            (this.missionMedalsUI = null)),
          (this.missionMedalsClosing = !0),
          this.missionMedalsUI &&
            this.missionMedalsUI.forEach((e) => {
              e?.active && this.tweens.killTweensOf(e);
            }),
          this.scene.restart({
            mission: this.mission,
            runId: this.runId,
            abilities: Array.from(this.abilities || []),
            rain: this.rainEnabled,
            screenShake: this.screenShake,
            reducedMotion: this.motionReduced,
            firstTimeTutorial: !1,
          }));
      }),
      r.forEach((e) => {
        (e.setAlpha(0), e !== o && e.setScale(0.94));
      }),
      this.tweens.add({ targets: r, alpha: 1, duration: 280, ease: 'Quad.out' }),
      this.tweens.add({
        targets: r.filter((e) => e !== o),
        scaleX: 1,
        scaleY: 1,
        duration: 360,
        ease: 'Back.out',
      }),
      (this.gameOverUI = r),
      this.time.delayedCall(520, () => {
        this.gameOverUI &&
          !this.gameOverRestarting &&
          (this.tweens.add({
            targets: h,
            scaleX: 1.07,
            scaleY: 1.07,
            duration: 120,
            ease: 'Quad.out',
            yoyo: !0,
          }),
          this.tweens.add({ targets: o, alpha: 0.9, duration: 160, ease: 'Quad.out', yoyo: !0 }),
          this.tweens.add({
            targets: [p, f],
            scaleX: 1.035,
            scaleY: 1.035,
            duration: 500,
            ease: 'Sine.inOut',
            yoyo: !0,
            repeat: -1,
          }));
      }));
  }
  fail(e, t = !1) {
    if (
      this.briefingProtected ||
      this.respawning ||
      this.finished ||
      this.healthInvulnerable > 0 ||
      this.afkCryostasisActive ||
      !this.player ||
      !this.player.active
    )
      return;
    if ((this.surpriseShieldCharges || 0) > 0)
      return (
        this.surpriseShieldCharges--,
        (this.healthInvulnerable = 900),
        this.playerCue('SHIELD CORE · IMPACT ABSORBED', '#8df4ff'),
        this.game.events.emit('feedback', 'shield'),
        void (
          !this.motionReduced &&
          this.graphicsLevel >= 2 &&
          (this.cameras.main.flash(100, 141, 244, 255), this.shake(90, 0.003))
        )
      );
    if ((t || this.health--, !t)) {
      const e = 'OVERDRIVE' === this.polarityState ? 18 : 'CHARGED' === this.polarityState ? 12 : 8;
      this.addPolarity(-e, 'damage');
    }
    const i = e.includes('barrier') || e.includes('interceptor'),
      s = e.includes('shark');
    if (
      (i ? this.collisions++ : s || this.falls++,
      this.deaths++,
      this.package?.condition &&
        (this.packageCondition = Math.max(0, this.packageCondition - (i ? 25 : 35))),
      this.deaths >= this.deathLimit)
    )
      return (
        this.game.events.emit('deaths', this.deaths, this.deathLimit),
        (this.finished = !0),
        this.physics.pause(),
        this.player.play('runner-hit', !0),
        this.player.setTint(16745070),
        this.shake(170, 0.014),
        this.showGameOverScreen(
          `RUN ENDED · ${this.deathLimit} / ${this.deathLimit} RECOVERIES USED`,
        ),
        void this.game.events.emit(
          'game-over',
          `RUN ENDED · ${this.deathLimit} / ${this.deathLimit} RECOVERIES USED`,
          this.deaths,
          this.runId,
        )
      );
    (this.game.events.emit('deaths', this.deaths, this.deathLimit),
      (this.respawning = !0),
      this.physics.pause(),
      this.player.play('runner-hit', !0),
      this.player.setTint(16745070),
      this.shake(170, 0.014),
      !this.motionReduced && this.graphicsLevel >= 2 && this.cameras.main.flash(120, 255, 100, 90),
      this.game.events.emit('feedback', 'death'),
      this.graphicsLevel >= 1 &&
        (this.dust.emitParticleAt(this.player.x, this.player.y + 10, 12),
        this.speedLines.emitParticleAt(this.player.x, this.player.y, 8)),
      this.time.delayedCall(700, () => this.respawnCheckpoint()));
  }
  respawnCheckpoint() {
    (this.dizzyStarsSerial++,
      this.dizzyStars?.destroy?.(!0),
      (this.dizzyStars = null),
      (this.dizzyStarsTimer = 0),
      (this.dizzyStarsIntensity = 0),
      this.game.events.emit('feedback', 'respawn'),
      'noCheckpoints' === this.loadout.modifier?.id &&
        (this.checkpoint = {
          x: this.mission.spawn.x,
          y: this.mission.spawn.y,
          signals: new Set(),
          secrets: new Set(),
        }),
      this.resetCollapsingPlatforms());
    let e = 0,
      t = 0;
    (this.signals.getChildren().forEach((t) => {
      t.active ||
        this.checkpoint.signals.has(t.getData('id')) ||
        (t.enableBody(!0, t.x, t.y, !0, !0), e++);
    }),
      this.secrets.getChildren().forEach((e) => {
        e.active ||
          this.checkpoint.secrets.has(e.getData('id')) ||
          (e.enableBody(!0, e.x, e.y, !0, !0), t++);
      }),
      (this.collected = this.checkpoint.signals.size),
      (this.secretsCollected = this.checkpoint.secrets.size),
      (this.signalInterference = this.getSignalInterferenceLevel()),
      (this.signalInterferenceTier = this.getSignalInterferenceTier(this.signalInterference)),
      (this.signalOverrideTriggered = this.signalInterference >= 0.999),
      (this.signalGhostTimer = 0),
      (this.signalInterferencePulse = 0),
      (this.health = this.healthMax),
      (this.polarity = 0),
      (this.polarityState = 'STABLE'),
      (this.polarityDecayTimer = 0),
      (this.polarityLastState = 'STABLE'),
      (this.polarityPulseTimer = 0),
      (this.overdriveTimer = 0),
      (this.polarityComboOverdriveTriggered = !1),
      this.game.events.emit('polarity', this.polarity, this.polarityMax, 'respawn'),
      this.game.events.emit('polarity-state', this.polarityState, this.polarity),
      (this.waterAttackActive = !1),
      (this.waterDeathTimer = 0),
      this.waterAttackToken++,
      (this.empTimer = 0),
      (this.decoyTimer = 0),
      (this.boosterTimer = 0),
      (this.alarmTimer = 0),
      this.boosterAura?.destroy(),
      (this.boosterAura = null),
      this.decoyBeacon?.destroy(),
      (this.decoyBeacon = null),
      [this.shields, this.kineticBalls, this.turrets, this.springPads].forEach((e) => {
        e?.getChildren()?.forEach((e) => e?.destroy?.());
      }),
      this.waterZones?.getChildren()?.forEach((e) => {
        e?.active && e.setData('used', !1);
      }),
      this.game.events.emit('health', this.health),
      (this.playerCrouched = !1),
      (this.slideTimer = 0),
      (this.dashTimer = 0),
      (this.dashFxTimer = 0),
      (this.airDashUsed = !1),
      (this.coyote = 0),
      (this.jumpBuffer = 0),
      (this.jumpHeld = !1),
      (this.wallJumpTimer = 0),
      (this.firstPersonCamera = !1),
      this.player?.active && this.player.setAlpha(1),
      (this.wallJumpCooldown = 0),
      (this.combatCombo = 0),
      (this.comboTimer = 0),
      (this.overdriveTimer = 0),
      (this.polarityComboOverdriveTriggered = !1),
      (this.perfectDodgeWindow = 0),
      (this.perfectDodgeCooldown = 0),
      (this.dashCooldown = 0),
      (this.blasterCooldown = 0),
      (this.swordCooldown = 0),
      (this.vaultCooldown = 0),
      (this.boostCooldown = 0),
      (this.gadgetCooldowns = this.gadgetCooldowns.map(() => 0)),
      (this.buildCooldowns = this.buildCooldowns.map(() => 0)),
      (this.mobileDirection = null),
      (this.mobileActions.jump = !1),
      (this.mobileActions.fire = !1),
      (this.mobileActions.sword = !1),
      (this.mobileActions.dash = !1),
      (this.mobileActions.crouch = !1),
      (this.mobileActions.interact = !1),
      (this.mobileActions.build1 = !1),
      (this.mobileActions.build2 = !1),
      (this.mobileActions.gadget1 = !1),
      (this.mobileActions.gadget2 = !1),
      (this.mobileActions.polarity = !1));
    const i = this.lastWaterDeath
        ? this.safeCheckpointSpawn(this.checkpoint.x - 150)
        : { x: this.checkpoint.x, y: this.checkpoint.y },
      s = i.x,
      a = i.y;
    (this.player
      .clearTint()
      .setAlpha(1)
      .setScale(this.playerVisualBaseScaleX, this.playerVisualBaseScaleY)
      .setPosition(s, a)
      .play('runner-idle', !0),
      this.player.body
        .setSize(this.playerBodyConfig.standing.width, this.playerBodyConfig.standing.height)
        .setOffset(this.playerBodyConfig.standing.offsetX, this.playerBodyConfig.standing.offsetY),
      this.player.body.reset(s, a),
      this.player.body.setVelocity(0, 0),
      (this.fallSpeed = 0),
      (this.wasGrounded = !0),
      (this.landingTimer = 0),
      (this.lastHardLanding = !1),
      (this.respawnGrace = 1100),
      (this.healthInvulnerable = 2200),
      [this.eggs, this.comets].forEach((e) =>
        e?.getChildren().forEach((e) => {
          e.active &&
            Phaser.Math.Distance.Between(e.x, e.y, this.checkpoint.x, this.checkpoint.y) < 360 &&
            (e.getData?.('trail')?.destroy?.(), e.destroy?.());
        }),
      ),
      this.enemies?.getChildren().forEach((e) => {
        if (!e.active || Math.abs(e.x - this.checkpoint.x) > 180) return;
        const t = e.getData('route');
        if (!t) return;
        const i = e.x < this.checkpoint.x ? -1 : 1;
        ((e.x = Phaser.Math.Clamp(this.checkpoint.x + 210 * i, t.min, t.max)),
          e.setData('direction', i),
          e.setData('aiState', 'IDLE'),
          e.setData('aiTimer', 0),
          e.setData('alerted', !1),
          e.setData('lastKnownX', e.x),
          e.setData('lastKnownY', e.y),
          e.setData('nextShot', this.elapsedMs + 700),
          e.body.setVelocity(0, 0),
          e.body.setAcceleration(0, 0),
          e.body.updateFromGameObject());
      }),
      this.loadout.upgrades?.includes('recovery') &&
        ((this.energy = Math.min(this.energyMax, this.energy + 20)),
        this.playerCue('RECOVERY +20 ENERGY', '#aee37f')));
    const l = this.add.circle(this.player.x, this.player.y, 22, 9303295, 0.22).setDepth(11);
    (this.tweens.add({
      targets: l,
      scale: 3.5,
      alpha: 0,
      duration: 900,
      onComplete: () => l.destroy(),
    }),
      this.player.setAlpha(0.45),
      this.tweens.add({ targets: this.player, alpha: 1, duration: 260 }),
      this.playerCue('SAFE RESET · SHIELD ACTIVE', '#b9f5ff'));
    const r = !0 === this.lastWaterDeath;
    ((this.respawning = !1),
      (this.lastWaterDeath = !1),
      r && this.playerCue('WATER HAZARD · STAY ON ROUTE', '#116978'));
    const o = e + t,
      n = this.add
        .text(
          this.checkpoint.x,
          this.checkpoint.y - 55,
          o ? `CHECKPOINT · LOST ${o} PICKUP${1 === o ? '' : 'S'}` : 'CHECKPOINT · ROUTE RESET',
          {
            fontFamily: 'Orbitron',
            fontSize: '11px',
            color: '#b9f5ff',
            stroke: '#08101c',
            strokeThickness: 4,
          },
        )
        .setOrigin(0.5)
        .setDepth(13);
    (this.tweens.add({
      targets: n,
      y: n.y - 24,
      alpha: 0,
      duration: 900,
      onComplete: () => n.destroy(),
    }),
      this.game.events.emit('checkpoint', this.collected, this.secretsCollected, o));
  }
  updateDynamicWaterFX(e) {
    const t = Number.isFinite(this.graphicsLevel) ? this.graphicsLevel : 2;
    if (this.motionReduced || !this.player?.active || !this.player?.body || !this.waterZones)
      return;
    if (this.waterAttackActive) return;
    this.waterDynamicFxTimer = Math.max(0, (this.waterDynamicFxTimer || 0) - e);
    const i = this.player.body;
    if (!(i?.blocked?.down || i?.touching?.down))
      return ((this.wetSurfaceActive = !1), void (this.wetSurfaceGrip = 1));
    if (this.waterDynamicZoneTimer > 0) return void (this.waterDynamicZoneTimer -= e);
    this.waterDynamicZoneTimer = 50;
    const s = this.waterZones.getChildren().find((e) => {
      if (!e?.active) return !1;
      const t = e.x - e.width / 2,
        s = e.x + e.width / 2,
        a = e.y - e.height / 2;
      return this.player.x >= t && this.player.x <= s && Math.abs(i.bottom - a) <= 18;
    });
    if (
      ((this.wetSurfaceActive = Boolean(s)),
      (this.wetSurfaceGrip = this.wetSurfaceActive ? 0.28 : 1),
      this.waterDynamicFxTimer > 0)
    )
      return;
    const a = Math.abs(i.velocity.x || 0);
    if (!s || a < 120) return;
    const l = Phaser.Math.Clamp(a / RUNNER_TUNING.maxRunSpeed, 0, 1);
    if (
      (this.triggerPlayerWaterRipple(this.player, s, 0.65 + 0.65 * l),
      t >= 2 && a > 140 && this.player?.active && this.player?.body)
    ) {
      const e = this.player.body.velocity.x >= 0 ? 1 : -1,
        t = a > 360 ? 3 : 2;
      for (let i = 0; i < t; i++) {
        const t = this.add
          .circle(
            this.player.x - e * Phaser.Math.Between(8, 18),
            this.player.y + 29,
            Phaser.Math.Between(1, 2.5),
            12187135,
            Phaser.Math.FloatBetween(0.18, 0.34),
          )
          .setDepth(8);
        this.tweens.add({
          targets: t,
          x: t.x - e * Phaser.Math.Between(10, 24),
          y: t.y - Phaser.Math.Between(3, 10),
          scale: Phaser.Math.FloatBetween(1.4, 2.2),
          alpha: 0,
          duration: Phaser.Math.Between(150, 230),
          ease: 'Quad.out',
          onComplete: () => {
            t.active && t.destroy();
          },
        });
      }
      this.waterDynamicFxTimer = Phaser.Math.Linear(220, 85, l);
    }
  }
  updateRelayPuzzleTimer() {
    const e = this.relayPuzzleUI;
    if (!e?.timer || !this.relayPuzzleActive || e.solved) return;
    const t = Math.max(0, this.time.now - (this.relayPuzzleStartedAt || this.time.now)) / 1e3,
      i = Math.floor(t),
      s = String(Math.floor(i / 60)).padStart(2, '0'),
      a = String(i % 60).padStart(2, '0');
    e.timer.setText(`TIME ${s}:${a}`);
    const l = this.relayPuzzleType || 'circuit',
      r =
        Number(this.relayPuzzleData?.difficulty ?? this.relayPuzzleGate?.getData?.('difficulty')) ||
        1,
      o =
        'code' === l
          ? r >= 3
            ? 5.5
            : 7
          : 'sequence' === l || 'tiles' === l
            ? r >= 3
              ? 7
              : 9
            : 'frequency' === l || 'grid' === l
              ? r >= 3
                ? 8
                : 10
              : 'final' === l
                ? r >= 3
                  ? 7
                  : 9
                : 8,
      n = t >= o ? 3 : t >= 0.72 * o ? 2 : 1;
    if (
      (e.timer.setColor(3 === n ? '#ff826e' : 2 === n ? '#ffd06e' : '#8df4ff'),
      n !== this.relayPuzzleTimerBand &&
        ((this.relayPuzzleTimerBand = n),
        n >= 2
          ? (this.tweens.killTweensOf(e.timer),
            e.timer.setScale(1),
            this.tweens.add({
              targets: e.timer,
              scaleX: 3 === n ? 1.08 : 1.04,
              scaleY: 3 === n ? 1.08 : 1.04,
              duration: 3 === n ? 110 : 140,
              yoyo: !0,
              repeat: -1,
              ease: 'Sine.easeInOut',
            }))
          : (this.tweens.killTweensOf(e.timer), e.timer.setScale(1)),
        t >= o && this.relayPuzzleActive && !this.relayPuzzleUI?.solved))
    ) {
      const e = this.relayPuzzleSession;
      ((this.relayPuzzleTimerBand = 3),
        this.relayPuzzleUI?.status?.setText('SECURITY TIMEOUT · RESET').setColor('#ff826e'),
        this.time.delayedCall(450, () => {
          e === this.relayPuzzleSession &&
            this.relayPuzzleActive &&
            !this.relayPuzzleUI?.solved &&
            this.retryRelayPuzzle();
        }));
    }
  }
  getSignalInterferenceLevel() {
    const e = Math.max(1, this.mission?.signals?.length || 1),
      t = Phaser.Math.Clamp(this.collected || 0, 0, e);
    return Phaser.Math.Clamp(t / e, 0, 1);
  }
  getSignalInterferenceTier(e) {
    return e >= 0.999 ? 4 : e >= 0.72 ? 3 : e >= 0.48 ? 2 : e >= 0.25 ? 1 : 0;
  }
  updateSignalInterferenceHUD() {
    if (!this.signalHUD || !this.signalHUD.active) return;
    const e = Phaser.Math.Clamp(this.signalInterference || 0, 0, 1),
      t = this.signalInterferenceTier ?? 0,
      i = Math.round(100 * e),
      s =
        t >= 4 ? 'OVERRIDE' : t >= 3 ? 'CRITICAL' : t >= 2 ? 'DESYNC' : t >= 1 ? 'NOISE' : 'STABLE',
      a =
        t >= 4
          ? '#ffe0a8'
          : t >= 3
            ? '#e0a7ff'
            : t >= 2
              ? '#b993ff'
              : t >= 1
                ? '#8df4ff'
                : '#8ba0b8';
    if (
      (this.signalHUD.percentText && this.signalHUD.percentText.setText(`${i}%`),
      this.signalHUD.statusText && this.signalHUD.statusText.setText(s).setColor(a),
      this.signalHUD.fill &&
        this.signalHUD.fill.setDisplaySize(
          Math.max(2, this.signalHUD.maxWidth * e),
          this.signalHUD.height,
        ),
      t >= 3 && !this.motionReduced)
    ) {
      const e = 0.5 + 0.5 * Math.sin(this.time.now / 110);
      this.signalHUD.fill.setAlpha(0.65 + 0.35 * e);
    } else this.signalHUD.fill.setAlpha(1);
  }
  ensureSignalInterferenceFX() {
    if (this.signalInterferenceObjects || !this.add) return;
    const e = this.scale.width,
      t = this.scale.height,
      i = this.add
        .rectangle(e / 2, t / 2, e, t, 8080895, 0)
        .setScrollFactor(0)
        .setDepth(950),
      s = [];
    for (let t = 0; t < 7; t++) {
      const i = this.add
        .rectangle(0, 0, e, t % 2 == 0 ? 2 : 1, 14723071, 0)
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(951);
      s.push(i);
    }
    const a = this.add
        .rectangle(e / 2, t / 2, 0.72 * e, t, 12162047, 0)
        .setScrollFactor(0)
        .setDepth(949),
      l = this.add
        .rectangle(e / 2, t / 2, 0.72 * e, t, 9303295, 0)
        .setScrollFactor(0)
        .setDepth(948);
    ((this.signalInterferenceObjects = { overlay: i, scanlines: s, ghostA: a, ghostB: l }),
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.signalInterferenceObjects = null;
      }));
  }
  triggerSignalInterferenceBurst(e) {
    if (this.motionReduced || !this.cameras?.main) return;
    const t = e >= 4 ? 16769192 : e >= 3 ? 14723071 : e >= 2 ? 12162047 : 9303295;
    (this.cameras.main.flash(e >= 4 ? 180 : 90, (t >> 16) & 255, (t >> 8) & 255, 255 & t),
      e >= 3 && this.screenShake && this.shake(90, e >= 4 ? 0.0028 : 0.0016),
      this.gadgetPulse(t, e >= 4 ? 18 : 10, e >= 4 ? 520 : 300));
  }
  triggerSignalOverride() {
    if (this.signalOverrideTriggered) return;
    if (
      ((this.signalOverrideTriggered = !0),
      (this.signalInterferencePulse = 1100),
      this.playerCue('SIGNAL OVERRIDE', '#e0a7ff'),
      this.game.events.emit('feedback', 'signal_override'),
      this.triggerSignalInterferenceBurst(4),
      this.motionReduced)
    )
      return;
    const e = this.scale.width,
      t = this.scale.height,
      i = this.add
        .rectangle(e / 2, t / 2, e, t, 14723071, 0.16)
        .setScrollFactor(0)
        .setDepth(952);
    (this.tweens.add({
      targets: i,
      alpha: 0,
      duration: 520,
      ease: 'Quad.out',
      onComplete: () => {
        i?.active && i.destroy();
      },
    }),
      this.tweens.add({
        targets: this.player,
        scaleX: 1.08 * this.playerVisualBaseScaleX,
        scaleY: 0.94 * this.playerVisualBaseScaleY,
        duration: 100,
        yoyo: !0,
        ease: 'Quad.out',
      }),
      this.time.delayedCall(620, () => {
        if (this.scene?.isActive?.()) {
          if (((this.signalInterferencePulse = 0), this.signalInterferenceObjects)) {
            const { overlay: e, ghostA: t, ghostB: i } = this.signalInterferenceObjects;
            (e.setAlpha(0), t.setAlpha(0), i.setAlpha(0));
          }
          (this.playerCue('SIGNAL SYNC COMPLETE', '#8df4ff'),
            this.game.events.emit('feedback', 'signal_sync'));
        }
      }));
  }
  applySignalInterferenceVisuals(e, t, i) {
    this.ensureSignalInterferenceFX();
    const s = this.signalInterferenceObjects;
    if (!s) return;
    const a = this.scale.width,
      l = this.scale.height;
    (s.overlay.setPosition(a / 2, l / 2),
      s.overlay.setSize(a, l),
      s.ghostA.setPosition(a / 2 + Math.sin(0.0031 * this.time.now) * (4 + 12 * e), l / 2),
      s.ghostB.setPosition(a / 2 + Math.cos(0.0027 * this.time.now) * (3 + 9 * e), l / 2));
    const r = 0 === t ? 0 : 1 === t ? 0.018 : 2 === t ? 0.035 : 3 === t ? 0.065 : 0.018;
    (s.overlay.setFillStyle(t >= 3 ? 12162047 : 9303295, r),
      s.ghostA.setAlpha(t >= 3 ? 0.018 + 0.03 * e : 0),
      s.ghostB.setAlpha(t >= 2 ? 0.012 + 0.02 * e : 0));
    const o = 0 === t ? 0 : 0.025 + 0.075 * e;
    if (
      (s.scanlines.forEach((t, i) => {
        const s = (this.time.now * (0.06 + 0.16 * e) + i * (l / 7)) % l;
        (t.setPosition(a / 2, s),
          t.setSize(a, i % 2 == 0 ? 2 : 1),
          t.setAlpha(i % 2 == 0 ? o : 0.45 * o));
      }),
      this.signals &&
        this.signals.getChildren().forEach((e) => {
          e.active &&
            (0 !== t ? e.setTint(t >= 3 ? 12162047 : t >= 2 ? 13745407 : 9303295) : e.clearTint());
        }),
      (this.signalInterferenceJitter = Phaser.Math.Linear(0, t >= 3 ? 3.5 : 1.5, e)),
      t >= 2 && this.signalInterferenceJitter > 0)
    ) {
      const e = Phaser.Math.Between(-this.signalInterferenceJitter, this.signalInterferenceJitter);
      this.player?.active &&
        Math.abs(e) > 0 &&
        this.player.setAngle(Phaser.Math.Clamp(e, -2.5, 2.5));
    } else this.player?.active && this.player.setAngle(this.playerBaseAngle || 0);
    if (t >= 2 && !this.motionReduced && Math.random() < i * (45e-5 + 0.0011 * e)) {
      const e = this.add
        .rectangle(
          Phaser.Math.Between(0, this.scale.width),
          Phaser.Math.Between(0, this.scale.height),
          Phaser.Math.Between(30, 180),
          Phaser.Math.Between(1, 4),
          t >= 3 ? 14723071 : 9303295,
          0.18,
        )
        .setScrollFactor(0)
        .setDepth(953);
      this.tweens.add({
        targets: e,
        alpha: 0,
        duration: Phaser.Math.Between(45, 100),
        onComplete: () => {
          e?.active && e.destroy();
        },
      });
    }
  }
  spawnSignalGhostEcho() {
    if (this.motionReduced || !this.signals || !this.player?.active) return;
    const e = this.signals.getChildren().filter((e) => e.active);
    if (!e.length) return;
    const t = Phaser.Utils.Array.GetRandom(e),
      i = Phaser.Math.FloatBetween(0, 2 * Math.PI),
      s = Phaser.Math.Between(140, 300),
      a = t.x + Math.cos(i) * s,
      l = t.y + Math.sin(i) * s,
      r = this.add.circle(a, l, 15, 12162047, 0.16).setScrollFactor(1).setDepth(10);
    r.setStrokeStyle(2, 14723071, 0.78);
    const o = this.add.circle(a, l, 5, 14723071, 0.55).setScrollFactor(1).setDepth(11);
    (this.tweens.add({
      targets: r,
      scale: 2.4,
      alpha: 0,
      duration: 520,
      ease: 'Quad.out',
      onComplete: () => {
        r?.active && r.destroy();
      },
    }),
      this.tweens.add({
        targets: o,
        scale: 1.8,
        alpha: 0,
        duration: 420,
        ease: 'Quad.out',
        onComplete: () => {
          o?.active && o.destroy();
        },
      }));
  }
  updateSignalInterferenceEnemyFX(e) {
    if (!this.enemies || this.motionReduced) return;
    if (
      ((this.signalEnemyFxTimer = Math.max(0, (this.signalEnemyFxTimer || 0) - e)),
      this.signalEnemyFxTimer > 0)
    )
      return;
    this.signalEnemyFxTimer = 33;
    const t = this.getSignalInterferenceLevel(),
      i = this.getSignalInterferenceTier(t);
    if (i <= 0) return;
    const s = this.time.now;
    this.enemies.getChildren().forEach((e) => {
      if (!e?.active) return;
      const a = e.getData('indicator');
      if (!a?.active) return;
      const l = 0.5 + 0.5 * Math.sin(s / (i >= 3 ? 85 : i >= 2 ? 120 : 170)),
        r = Phaser.Math.Linear(0.18, 0.42, t),
        o = i >= 3 ? l : 0.35 + 0.35 * l;
      (a.setAlpha(Phaser.Math.Clamp(r + 0.22 * o, 0.08, 0.72)),
        a.setScale(Phaser.Math.Linear(1, i >= 4 ? 1.5 : i >= 3 ? 1.28 : 1.12, l)));
      const n = i >= 4 ? 16769192 : i >= 3 ? 14723071 : i >= 2 ? 12162047 : 9303295;
      a.setStrokeStyle(i >= 3 ? 1.8 : 1.2, n, i >= 3 ? 0.95 : 0.72);
    });
  }
  updateSignalInterference(e) {
    if (this.finished || this.respawning || this.cinematicActive || this.relayPuzzleActive) return;
    const t = this.getSignalInterferenceLevel(),
      i = this.getSignalInterferenceTier(t),
      s = this.signalInterferenceTier;
    ((this.signalInterference = t),
      (this.signalInterferenceTier = i),
      this.applySignalInterferenceVisuals(t, i, e),
      this.updateSignalInterferenceHUD(),
      i >= 2 && !this.signalOverrideTriggered
        ? ((this.signalGhostTimer = Math.max(0, (this.signalGhostTimer || 0) - e)),
          this.signalGhostTimer <= 0 &&
            (this.spawnSignalGhostEcho(), (this.signalGhostTimer = i >= 3 ? 900 : 1450)))
        : (this.signalGhostTimer = 0),
      i > s &&
        s >= 0 &&
        (this.triggerSignalInterferenceBurst(i),
        1 === i && this.playerCue('SIGNAL NOISE DETECTED', '#8df4ff'),
        2 === i &&
          (this.playerCue('MAP DESYNC', '#b993ff'),
          this.game.events.emit('tutorial', 'NAVIGATION SIGNALS UNSTABLE')),
        3 === i &&
          (this.playerCue('CRITICAL SIGNAL', '#e0a7ff'),
          this.game.events.emit('tutorial', 'SIGNAL ECHOES DETECTED'))),
      i >= 4 && !this.signalOverrideTriggered && this.triggerSignalOverride());
  }
  updateAfkSystem(e) {
    if (
      !this.player?.active ||
      !this.player?.body ||
      this.finished ||
      this.respawning ||
      this.cinematicActive ||
      this.relayPuzzleActive
    )
      return;
    const t = this.player.body,
      i = Math.abs(t.velocity?.x || 0) + Math.abs(t.velocity?.y || 0),
      s = this.rawKeyboardState || {},
      a = Boolean(
        this.cursors?.left?.isDown ||
        this.cursors?.right?.isDown ||
        this.cursors?.up?.isDown ||
        this.cursors?.down?.isDown ||
        this.keys?.A?.isDown ||
        this.keys?.D?.isDown ||
        this.keys?.W?.isDown ||
        this.keys?.S?.isDown ||
        s.KeyA ||
        s.KeyD ||
        s.KeyW ||
        s.KeyS,
      ),
      l = Boolean(
        this.keys?.SPACE?.isDown ||
        this.keys?.SHIFT?.isDown ||
        this.keys?.E?.isDown ||
        this.keys?.F?.isDown ||
        this.keys?.Q?.isDown ||
        this.keys?.R?.isDown ||
        this.keys?.X?.isDown ||
        s.Space ||
        s.ShiftLeft ||
        s.ShiftRight ||
        s.KeyE ||
        s.KeyF ||
        s.KeyQ,
      ),
      r = 'left' === this.mobileDirection || 'right' === this.mobileDirection;
    if (a || l || r || i > 18)
      return ((this.afkTimer = 0), void (0 !== this.afkStage && this.clearAfkState()));
    this.afkTimer += e;
    let o = 0;
    if (
      (this.afkTimer >= 12e3
        ? (o = 3)
        : this.afkTimer >= 8e3
          ? (o = 2)
          : this.afkTimer >= 4e3 && (o = 1),
      o === this.afkStage)
    )
      return void (this.afkStage > 0 && this.updateAfkFx());
    if (
      ((this.afkStage = o),
      this.afkStage > 0 &&
        !this.afkStatusText &&
        this.player?.active &&
        (this.afkStatusText = this.add
          .text(this.player.x, this.player.y - 58, '', {
            fontFamily: 'Orbitron',
            fontSize: '11px',
            fontStyle: 'bold',
            color: '#b9f5ff',
            stroke: '#07111d',
            strokeThickness: 5,
            letterSpacing: 2,
            shadow: { offsetX: 0, offsetY: 0, color: '#8df4ff', blur: 12, fill: !0 },
          })
          .setOrigin(0.5)
          .setDepth(40)),
      this.afkStatusText)
    ) {
      const e = { 1: 'IDLE', 2: 'FROST', 3: 'CRYOSTASIS' },
        t = { 1: '#b9f5ff', 2: '#dffcff', 3: '#8df4ff' };
      (this.afkStatusText.setText(e[this.afkStage] || ''),
        this.afkStatusText.setColor(t[this.afkStage] || '#b9f5ff'));
    }
    if (3 === this.afkStage && !this.afkCryostasisActive && this.player?.body) {
      const e = this.player.body;
      ((this.afkCryostasisActive = !0),
        (this.afkCryoPreviousMoves = !1 !== e.moves),
        (this.afkCryoPreviousAllowGravity = !1 !== e.allowGravity),
        e.setVelocity(0, 0),
        e.setAcceleration(0, 0),
        e.setAllowGravity(!1),
        (e.moves = !1),
        (this.afkFrozenBodies = []));
      const t = (e) => {
        e?.getChildren?.().forEach((e) => {
          e?.active &&
            e.body &&
            (this.afkFrozenBodies.push({
              body: e.body,
              velocityX: e.body.velocity.x,
              velocityY: e.body.velocity.y,
              accelerationX: e.body.acceleration.x,
              accelerationY: e.body.acceleration.y,
            }),
            e.body.setVelocity(0, 0),
            e.body.setAcceleration(0, 0));
        });
      };
      (t(this.enemies),
        t(this.eggs),
        t(this.comets),
        t(this.kineticBalls),
        t(this.plasma),
        t(this.turrets),
        this.chaser?.active &&
          this.chaser.body &&
          (this.afkFrozenBodies.push({
            body: this.chaser.body,
            velocityX: this.chaser.body.velocity.x,
            velocityY: this.chaser.body.velocity.y,
            accelerationX: this.chaser.body.acceleration.x,
            accelerationY: this.chaser.body.acceleration.y,
          }),
          this.chaser.body.setVelocity(0, 0),
          this.chaser.body.setAcceleration(0, 0)));
    }
    if (0 === this.afkStage) return void this.clearAfkState();
    this.afkFreezeFx || (this.afkFreezeFx = { aura: null, ring: null, core: null });
    const n = Number.isFinite(this.graphicsLevel) ? this.graphicsLevel : 2;
    if (
      n >= 1 &&
      this.afkStage >= 2 &&
      Array.isArray(this.afkIceParticles) &&
      0 === this.afkIceParticles.length
    )
      for (let e = 0; e < 6; e++) {
        const t = this.add
          .text(this.player.x, this.player.y, '✦', {
            fontFamily: 'Arial',
            fontSize: '10px',
            color: '#dffcff',
            stroke: '#58e7ff',
            strokeThickness: 2,
          })
          .setOrigin(0.5)
          .setAlpha(0)
          .setDepth(14);
        (t.setData('afkIndex', e), this.afkIceParticles.push(t));
      }
    if (1 === this.afkStage)
      return (
        this.afkFreezeFx.aura ||
          (this.afkFreezeFx.aura = this.add
            .circle(this.player.x, this.player.y, 28, 12187135, 0.045)
            .setDepth(10)),
        this.tweens.killTweensOf(this.afkFreezeFx.aura),
        this.tweens.add({
          targets: this.afkFreezeFx.aura,
          scale: 1.14,
          alpha: 0.1,
          duration: 850,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
        }),
        this.playerCue('IDLE STATE DETECTED', '#b9f5ff'),
        this.speakNarration('IDLE STATE DETECTED'),
        void this.game.events.emit('player-afk-warning', { stage: 1, elapsed: this.afkTimer })
      );
    if (2 === this.afkStage)
      return (
        this.afkFreezeFx.ring ||
          (this.afkFreezeFx.ring = this.add
            .circle(this.player.x, this.player.y + 8, 18, 12187135, 0.035)
            .setStrokeStyle(2, 15269375, 0.62)
            .setDepth(12)),
        this.tweens.killTweensOf(this.afkFreezeFx.ring),
        this.tweens.add({
          targets: this.afkFreezeFx.ring,
          scale: 1.45,
          alpha: 0.02,
          duration: 950,
          yoyo: !0,
          repeat: -1,
          ease: 'Sine.inOut',
        }),
        this.playerCue('FROST BUILDUP', '#b9f5ff'),
        this.speakNarration('FROST BUILDUP'),
        void this.game.events.emit('player-afk', { stage: 2, elapsed: this.afkTimer })
      );
    if (
      (this.afkFreezeFx.core ||
        (this.afkFreezeFx.core = this.add
          .circle(this.player.x, this.player.y, 11, 15269375, 0.07)
          .setStrokeStyle(2, 12187135, 0.82)
          .setDepth(13)),
      this.tweens.killTweensOf(this.afkFreezeFx.core),
      this.tweens.add({
        targets: this.afkFreezeFx.core,
        scale: 1.55,
        alpha: 0.015,
        duration: 1050,
        yoyo: !0,
        repeat: -1,
        ease: 'Sine.inOut',
      }),
      this.afkCryoFx ||
        (this.afkCryoFx = {
          outer: this.add
            .circle(this.player.x, this.player.y, 34, 12187135, 0.035)
            .setStrokeStyle(2, 15269375, 0.72)
            .setDepth(11),
          inner: this.add
            .circle(this.player.x, this.player.y, 16, 15269375, 0.055)
            .setStrokeStyle(1.5, 12187135, 0.9)
            .setDepth(13),
        }),
      n >= 2 && Array.isArray(this.afkCryoShards) && 0 === this.afkCryoShards.length)
    )
      for (let e = 0; e < 8; e++) {
        const t = this.add
          .triangle(this.player.x, this.player.y, 0, -8, 6, 5, -6, 5, 15269375, 0.18)
          .setStrokeStyle(1, 9303295, 0.75)
          .setDepth(14);
        (t.setData('afkShardIndex', e), this.afkCryoShards.push(t));
      }
    if (
      (this.tweens.killTweensOf(this.afkCryoFx.outer),
      this.tweens.killTweensOf(this.afkCryoFx.inner),
      this.tweens.add({
        targets: this.afkCryoFx.outer,
        scale: 1.32,
        alpha: 0.01,
        duration: 1200,
        yoyo: !0,
        repeat: -1,
        ease: 'Sine.inOut',
      }),
      this.tweens.add({
        targets: this.afkCryoFx.inner,
        scale: 0.72,
        alpha: 0.1,
        duration: 760,
        yoyo: !0,
        repeat: -1,
        ease: 'Sine.inOut',
      }),
      n >= 3 && !this.motionReduced && !this.afkCryoTriggered)
    ) {
      ((this.afkCryoTriggered = !0),
        this.cameras.main.flash(180, 205, 248, 255),
        this.shake(120, 0.004));
      const e = this.add
        .circle(this.player.x, this.player.y, 22, 14679295, 0.18)
        .setStrokeStyle(3, 9303295, 0.95)
        .setDepth(15);
      this.tweens.add({
        targets: e,
        scale: 4.8,
        alpha: 0,
        duration: 620,
        ease: 'Cubic.out',
        onComplete: () => {
          e?.active && e.destroy();
        },
      });
    }
    (this.playerCue('CRYOSTASIS ENGAGED', '#b9f5ff'),
      this.speakNarration('CRYOSTASIS ENGAGED'),
      this.game.events.emit('player-cryostasis', { stage: 3, elapsed: this.afkTimer }),
      this.updateAfkFx());
  }
  updateAfkFx() {
    if (!this.afkFreezeFx || !this.player?.active) return;
    const e = 0.001 * this.time.now;
    this.afkStatusText?.active &&
      this.player?.active &&
      ((this.afkStatusText.x = this.player.x),
      (this.afkStatusText.y = this.player.y - 58),
      this.afkStatusText.setAlpha(0.72 + 0.16 * Math.sin(4 * e)),
      this.afkStatusText.setScale(0.96 + 0.04 * Math.sin(3.2 * e)));
    const t = Number.isFinite(this.graphicsLevel) ? this.graphicsLevel : 2;
    if (
      (Array.isArray(this.afkIceParticles) &&
        this.afkStage >= 2 &&
        t >= 1 &&
        this.afkIceParticles.forEach((t) => {
          if (!t?.active) return;
          const i = Number(t.getData('afkIndex')) || 0,
            s = e * (0.7 + 0.05 * i) + 1.047 * i,
            a = 24 + 5 * Math.sin(1.8 * e + i);
          ((t.x = this.player.x + Math.cos(s) * a),
            (t.y = this.player.y + Math.sin(s) * a - 8),
            t.setAlpha(0.28 + 0.18 * (Math.sin(3 * e + i) + 1)),
            t.setScale(0.75 + 0.15 * (Math.sin(2.4 * e + i) + 1)));
        }),
      Array.isArray(this.afkIceParticles))
    ) {
      const e = t >= 1;
      this.afkIceParticles.forEach((t) => {
        t?.active && (t.setVisible(e), e || t.setAlpha(0));
      });
    }
    Array.isArray(this.afkCryoShards) &&
      this.afkStage >= 3 &&
      this.afkCryoShards.forEach((t) => {
        if (!t?.active) return;
        const i = Number(t.getData('afkShardIndex')) || 0,
          s = 0.32 * e + i * ((2 * Math.PI) / 8),
          a = 38 + 4 * Math.sin(1.7 * e + i);
        ((t.x = this.player.x + Math.cos(s) * a),
          (t.y = this.player.y + Math.sin(s) * a - 4),
          (t.rotation = s + Math.PI / 2),
          t.setAlpha(0.1 + 0.1 * (Math.sin(2.6 * e + i) + 1)),
          t.setScale(0.82 + 0.1 * (Math.sin(2.1 * e + i) + 1)));
      });
    const { aura: i, ring: s, core: a } = this.afkFreezeFx;
    (i?.active && ((i.x = this.player.x), (i.y = this.player.y)),
      s?.active && ((s.x = this.player.x), (s.y = this.player.y + 8)),
      a?.active && ((a.x = this.player.x), (a.y = this.player.y)),
      this.afkCryoFx &&
        (this.afkCryoFx.outer?.active &&
          ((this.afkCryoFx.outer.x = this.player.x), (this.afkCryoFx.outer.y = this.player.y)),
        this.afkCryoFx.inner?.active &&
          ((this.afkCryoFx.inner.x = this.player.x), (this.afkCryoFx.inner.y = this.player.y))));
  }
  clearAfkState() {
    if (this.afkCryostasisActive && this.player?.active) {
      const e = this.add
        .circle(this.player.x, this.player.y, 10, 15269375, 0.16)
        .setStrokeStyle(2, 9303295, 0.95)
        .setDepth(16);
      (this.tweens.add({
        targets: e,
        scale: 4.6,
        alpha: 0,
        duration: 420,
        ease: 'Cubic.out',
        onComplete: () => {
          e?.active && e.destroy();
        },
      }),
        this.cameras.main.flash(90, 220, 250, 255));
    }
    if (this.afkCryostasisActive && this.player?.body) {
      const e = this.player.body;
      ((e.moves = this.afkCryoPreviousMoves),
        e.setAllowGravity(this.afkCryoPreviousAllowGravity),
        e.setAcceleration(0, 0),
        (this.afkCryostasisActive = !1),
        Array.isArray(this.afkFrozenBodies) &&
          (this.afkFrozenBodies.forEach((e) => {
            const t = e?.body;
            t &&
              (t.setVelocity(Number(e.velocityX) || 0, Number(e.velocityY) || 0),
              t.setAcceleration(Number(e.accelerationX) || 0, Number(e.accelerationY) || 0));
          }),
          (this.afkFrozenBodies = [])));
    }
    ((this.afkTimer = 0),
      (this.afkStage = 0),
      this.afkFreezeFx &&
        Object.values(this.afkFreezeFx).forEach((e) => {
          e && (this.tweens.killTweensOf(e), e.active && e.destroy());
        }),
      (this.afkFreezeFx = null),
      Array.isArray(this.afkIceParticles) &&
        (this.afkIceParticles.forEach((e) => {
          e && (this.tweens.killTweensOf(e), e.active && e.destroy());
        }),
        (this.afkIceParticles = [])),
      this.afkCryoFx &&
        Object.values(this.afkCryoFx).forEach((e) => {
          e && (this.tweens.killTweensOf(e), e.active && e.destroy());
        }),
      Array.isArray(this.afkCryoShards) &&
        (this.afkCryoShards.forEach((e) => {
          e && (this.tweens.killTweensOf(e), e.active && e.destroy());
        }),
        (this.afkCryoShards = [])),
      this.afkStatusText &&
        (this.tweens.killTweensOf(this.afkStatusText),
        this.afkStatusText.active && this.afkStatusText.destroy(),
        (this.afkStatusText = null)),
      (this.afkCryoFx = null),
      (this.afkCryoTriggered = !1),
      this.game.events.emit('player-afk-cleared'));
  }
  canRunVisualEffects(e = 1) {
    const t = Number.isFinite(this.graphicsLevel) ? this.graphicsLevel : 2;
    return !this.motionReduced && t >= e && !1 !== this.scene?.isActive?.();
  }
  shouldUpdateVisualTimer(e, t, i = 33) {
    return (
      this._visualTimers || (this._visualTimers = Object.create(null)),
      (this._visualTimers[e] = Math.max(0, (this._visualTimers[e] || 0) - t)),
      !(this._visualTimers[e] > 0) && ((this._visualTimers[e] = i), !0)
    );
  }
  destroySafely(e) {
    if (e)
      try {
        (this.tweens?.killTweensOf?.(e), e.active && e.destroy());
      } catch (e) {
        console.warn('[RunnerScene] Greška pri uništavanju objekta:', e);
      }
  }
  destroyManySafely(e) {
    Array.isArray(e) &&
      e.forEach((e) => {
        this.destroySafely(e);
      });
  }
  update(e, t) {
    if (
      ((t = Phaser.Math.Clamp(Number(t) || 0, 0, 50)),
      this.scene?.isActive?.() &&
        this.player?.active &&
        this.keys &&
        this.cursors &&
        (this.updatePlayerStatusHUD(),
        this.updateCombatHUD(),
        this.updateMobilityHUD(),
        this.scene.isActive() &&
          this.player?.active &&
          !(this.finished || this.respawning || this.cinematicActive) &&
          this.player?.active))
    )
      if ((this.updateAfkSystem(t), this.afkCryostasisActive))
        this.player?.body &&
          (this.player.body.setVelocity(0, 0), this.player.body.setAcceleration(0, 0));
      else {
        if (
          (!this.physics?.world?.isPaused ||
            this.relayPuzzleActive ||
            this.finished ||
            this.respawning ||
            this.cinematicActive ||
            this.physics.resume(),
          this.updatePolarity(t),
          this.dizzyStars?.active)
        ) {
          ((this.dizzyStars.x = this.player.x), (this.dizzyStars.y = this.player.y - 42));
          const e = this.dizzyStars.list || [],
            t = 0.0045 * this.time.now;
          e.forEach((e) => {
            const i = Number(e.getData('orbitRadius')) || 20,
              s = Number(e.getData('orbitAngle')) || 0,
              a = Number(e.getData('spin')) || 1,
              l = Number(e.getData('orbitIndex')) || 0,
              r = s + t * a,
              o = s + 0.75 * l,
              n = i + 1.8 * l,
              h = 7 + 2.5 * Math.sin(1.35 * t + o);
            ((e.x = Math.cos(r) * n), (e.y = Math.sin(r) * h + 1.5 * Math.sin(0.9 * t + o)));
            const d = 1.8 * t + s + 0.9 * l,
              c = 1 + 0.12 * Math.sin(d),
              y = 0.82 + 0.09 * (Math.sin(2.4 * t + 1.7 * l) + 1);
            ((e.scale = c), (e.alpha = y), (e.rotation = t * a * 0.72));
          });
        }
        if (
          ((this.dizzyStarsTimer = Math.max(0, (this.dizzyStarsTimer || 0) - t)),
          this.dizzyStars?.active &&
            this.dizzyStarsTimer <= 0 &&
            (this.dizzyStarsSerial++,
            this.dizzyStars.destroy(!0),
            (this.dizzyStars = null),
            (this.dizzyStarsIntensity = 0)),
          this.updateDynamicWaterFX(t),
          this.keys.C &&
            Phaser.Input.Keyboard.JustDown(this.keys.C) &&
            ((this.firstPersonCamera = !this.firstPersonCamera),
            this.player?.active && this.player.setAlpha(this.firstPersonCamera ? 0 : 1),
            this.game.events.emit(
              'feedback',
              this.firstPersonCamera ? 'first-person' : 'third-person',
            )),
          this.motionReduced ||
            (this.updateSignalInterference(t), this.updateSignalInterferenceEnemyFX(t)),
          this.relayPuzzleActive)
        )
          return (
            (this.elapsedMs += t),
            (this.timeEmitTimer += t),
            this.timeEmitTimer >= 100 &&
              ((this.timeEmitTimer -= 100), this.game.events.emit('time', this.elapsedMs)),
            void this.updateRelayPuzzleTimer()
          );
        if (
          (this.updateSurpriseCacheInteraction(),
          this.updateRelayGateInteraction(),
          (this.celestialUpdateTimer = Math.max(0, (this.celestialUpdateTimer || 0) - t)),
          this.celestialUpdateTimer <= 0)
        ) {
          this.celestialUpdateTimer = 33;
          const e = ((this.time.now % 18e4) / 18e4) * Math.PI * 2,
            i = e + Math.PI,
            s = 930 + 260 * Math.cos(e),
            a = 150 + 75 * Math.sin(e),
            l = 930 + 260 * Math.cos(i),
            r = 150 + 75 * Math.sin(i),
            o = Phaser.Math.Clamp((150 - a) / 75, -1, 1),
            n = Phaser.Math.Clamp((150 - r) / 75, -1, 1),
            h = Phaser.Math.Clamp(0.5 * (Math.sin(e) + 1), 0, 1),
            d = Phaser.Math.SmoothStep(h, 0, 1),
            c = 1 - d,
            y = Phaser.Math.Linear(0.62, 0.88, c),
            p = Phaser.Math.Linear(0.06, 0.16, d),
            f = Phaser.Math.Linear(0.18, 0.035, d);
          if (
            this.celestialSun &&
            this.celestialSunGlow &&
            this.celestialMoon &&
            this.celestialMoonGlow
          ) {
            (this.celestialSun.setPosition(s, a), this.celestialMoon.setPosition(l, r));
            const e = 0.94 + 0.08 * Math.max(0, n),
              t = Phaser.Math.Clamp(0.55 + 0.45 * n, 0.35, 1);
            (this.celestialMoon.setScale(e), this.celestialMoon.setAlpha(t));
            const i = 0.92 + 0.1 * Math.max(0, o),
              h = Phaser.Math.Clamp(0.55 + 0.45 * o, 0.35, 1);
            (this.celestialSun.setScale(i),
              this.celestialSun.setAlpha(h),
              this.celestialSunGlow.setPosition(s, a - 2));
            const d = 0.96 + 0.06 * Math.max(0, o);
            (this.celestialSunGlow.setScale(d),
              this.celestialMoonShadow && this.celestialMoonShadow.setPosition(l + 24, r - 15),
              this.celestialMoonGlow.setPosition(l, r - 2));
            const c = 1 + 0.035 * Math.sin(0.0018 * this.time.now);
            (this.celestialSunGlow.setAlpha(Phaser.Math.Clamp(p * c, 0, 1)),
              this.celestialMoonGlow.setAlpha(Phaser.Math.Clamp(f * c, 0, 1)),
              this.celestialMoonShadow &&
                this.celestialMoonShadow.setAlpha(
                  Phaser.Math.Clamp(y + 0.015 * Math.sin(0.0014 * this.time.now), 0, 1),
                ));
          }
          ((this.elapsedMs += t),
            (this.timeEmitTimer += t),
            this.timeEmitTimer >= 100 &&
              ((this.timeEmitTimer -= 100), this.game.events.emit('time', this.elapsedMs)),
            Phaser.Input.Keyboard.JustDown(this.keys.ESC) && this.dismissIntelCard(),
            (this.respawnGrace = Math.max(0, this.respawnGrace - t)),
            !this.sectorTwoAnnounced &&
              this.player.x >= 4080 &&
              ((this.sectorTwoAnnounced = !0),
              this.game.events.emit('sector', {
                number: 2,
                signals: this.mission.signals.length,
                checkpoints: this.mission.checkpoints.length,
              }),
              this.playerCue('SECTOR TWO · RELAY SPIRE', '#ffd06e')),
            (this.lowEnergyCueTimer = Math.max(0, this.lowEnergyCueTimer - t)),
            (this.boostCooldown = Math.max(0, this.boostCooldown - t)),
            (this.blasterCooldown = Math.max(0, this.blasterCooldown - t)));
          const u = this.dashCooldown;
          this.dashCooldown = Math.max(0, this.dashCooldown - t);
          const m = this.dashTimer;
          if (
            ((this.dashTimer = Math.max(0, this.dashTimer - t)),
            u > 0 &&
              this.dashCooldown <= 0 &&
              !this.motionReduced &&
              this.player?.active &&
              this.game.events.emit('feedback', 'dash-ready'),
            m > 0 && this.dashTimer <= 0 && !this.motionReduced && this.player?.active)
          ) {
            this.tweens.add({
              targets: this.player,
              scaleX: 1.045 * this.playerVisualBaseScaleX,
              scaleY: 0.965 * this.playerVisualBaseScaleY,
              duration: 55,
              yoyo: !0,
              ease: 'Quad.out',
            });
            const e = this.add.circle(this.player.x, this.player.y, 6, 9303295, 0.24).setDepth(10);
            if (!this.motionReduced && this.player?.active) {
              const e = this.add
                  .sprite(
                    this.player.x - (this.player.flipX ? -18 : 18),
                    this.player.y,
                    this.player.texture.key,
                  )
                  .setFlipX(this.player.flipX)
                  .setAlpha(0.24)
                  .setTint(9303295)
                  .setScale(this.player.scaleX, this.player.scaleY)
                  .setAngle(this.player.angle)
                  .setDepth(7),
                t = this.add
                  .sprite(
                    this.player.x - (this.player.flipX ? -34 : 34),
                    this.player.y,
                    this.player.texture.key,
                  )
                  .setFlipX(this.player.flipX)
                  .setAlpha(0.12)
                  .setTint(12187135)
                  .setScale(this.player.scaleX, this.player.scaleY)
                  .setAngle(this.player.angle)
                  .setDepth(6);
              (this.tweens.add({
                targets: e,
                x: e.x - (this.player.flipX ? -32 : 32),
                alpha: 0,
                scaleX: 0.86 * e.scaleX,
                scaleY: 0.94 * e.scaleY,
                duration: 145,
                ease: 'Cubic.out',
                onComplete: () => {
                  e?.active && e.destroy();
                },
              }),
                this.tweens.add({
                  targets: t,
                  x: t.x - (this.player.flipX ? -40 : 40),
                  alpha: 0,
                  scaleX: 0.8 * t.scaleX,
                  scaleY: 0.9 * t.scaleY,
                  duration: 185,
                  ease: 'Cubic.out',
                  onComplete: () => {
                    t?.active && t.destroy();
                  },
                }));
            }
            (this.tweens.add({
              targets: e,
              scaleX: 2.6,
              scaleY: 0.65,
              alpha: 0,
              duration: 130,
              ease: 'Quad.out',
              onComplete: () => e.destroy(),
            }),
              this.worldLightPulse(9303295, 0.14, 180, 38),
              this.worldLightFlash(9303295, 0.045, 100));
          }
          this.wallJumpTimer <= 0 && (this.wallJumpFxShown = !1);
          const g = this.package?.speedMultiplier || 1,
            S = Number.isFinite(this.surpriseModifier?.movementMultiplier)
              ? this.surpriseModifier.movementMultiplier
              : 1;
          if (!this.dashTimer && this.player?.body) {
            const e =
              'OVERDRIVE' === this.polarityState
                ? 1.1
                : 'CHARGED' === this.polarityState
                  ? 1.04
                  : 'LOW' === this.polarityState
                    ? 0.97
                    : 1;
            this.player.body.setMaxVelocityX(RUNNER_TUNING.maxRunSpeed * g * S * e);
          }
          if (u > 0 && !this.dashCooldown) {
            const e = this.add.circle(this.player.x, this.player.y, 9, 9303295, 0.52).setDepth(11);
            (e.setStrokeStyle(2, 12187135, 0.9),
              this.tweens.add({
                targets: e,
                scale: 3.2,
                alpha: 0,
                duration: 240,
                ease: 'Quad.out',
                onComplete: () => e.destroy(),
              }),
              this.playerCue('DASH READY'));
          }
          ((this.wallJumpCooldown = Math.max(0, this.wallJumpCooldown - t)),
            (this.wallJumpTimer = Math.max(0, this.wallJumpTimer - t)));
          const w = this.loadout.upgrades || [],
            x = this.loadout.modifier;
          ((this.energyMax = 'lowEnergy' === x?.id ? 65 : w.includes('energyCore') ? 115 : 100),
            (this.energy = Math.min(
              this.energyMax,
              this.energy + 0.018 * t * (w.includes('recharge') ? 1.2 : 1),
            )),
            (this.vaultCooldown = Math.max(0, this.vaultCooldown - t)));
          const b = this.gadgetCooldowns;
          ((this.gadgetCooldowns = this.gadgetCooldowns.map((e) => Math.max(0, e - t))),
            (this.buildCooldowns = this.buildCooldowns.map((e) => Math.max(0, e - t))),
            b.forEach((e, t) => {
              if (e > 0 && 0 === this.gadgetCooldowns[t] && this.loadout.equipment?.[t]) {
                this.playerCue(`${t + 3} READY`, '#ffd06e');
                const e = this.add
                  .circle(this.player.x, this.player.y, 7, 16765038, 0.4)
                  .setDepth(11);
                this.tweens.add({
                  targets: e,
                  scale: 2.1,
                  alpha: 0,
                  duration: 180,
                  onComplete: () => e.destroy(),
                });
              }
            }),
            (this.empTimer = Math.max(0, (this.empTimer || 0) - t)),
            (this.decoyTimer = Math.max(0, (this.decoyTimer || 0) - t)),
            (this.boosterTimer = Math.max(0, (this.boosterTimer || 0) - t)),
            this.empTimer || this.enemies?.getChildren().forEach((e) => e.clearTint()),
            !this.decoyTimer &&
              this.decoyBeacon &&
              (this.decoyBeacon.destroy(), (this.decoyBeacon = null)),
            this.boosterAura &&
              (this.boosterTimer
                ? this.boosterAura.setPosition(this.player.x, this.player.y)
                : (this.boosterAura.destroy(), (this.boosterAura = null))),
            Math.round(this.energy) !== this.energyEmit &&
              ((this.energyEmit = Math.round(this.energy)),
              this.game.events.emit('energy', (this.energyEmit / this.energyMax) * 100)),
            this.movingGates?.getChildren().forEach((e) => e.body.updateFromGameObject()),
            this.updateWeather(t),
            (this.eventCheckTimer -= t),
            this.eventCheckTimer <= 0 && ((this.eventCheckTimer = 100), this.updateEvents()),
            this.updateEnemies(t),
            this.updateSciFiThreats(t),
            (this.routeHintTimer -= t),
            this.routeHintTimer <= 0 &&
              ((this.routeHintTimer = 100), this.updateRouteHints(), this.updateCheckpointArrow()));
          (Phaser.Input.Keyboard.JustDown(this.keys.X) && this.breakPolarity(),
            (Phaser.Input.Keyboard.JustDown(this.keys.ONE) || this.mobileActions.build1) &&
              this.useBuild(0),
            (Phaser.Input.Keyboard.JustDown(this.keys.TWO) || this.mobileActions.build2) &&
              this.useBuild(1),
            (Phaser.Input.Keyboard.JustDown(this.keys.THREE) || this.mobileActions.gadget1) &&
              this.useGadget(0),
            (Phaser.Input.Keyboard.JustDown(this.keys.FOUR) || this.mobileActions.gadget2) &&
              this.useGadget(1),
            (this.mobileActions.build1 = !1),
            (this.mobileActions.build2 = !1),
            (this.mobileActions.gadget1 = !1),
            (this.mobileActions.gadget2 = !1),
            (this.healthInvulnerable = Math.max(0, this.healthInvulnerable - t)),
            (this.swordCooldown = Math.max(0, this.swordCooldown - t)),
            (this.comboTimer = Math.max(0, this.comboTimer - t)));
          const C = this.overdriveTimer;
          if (
            ((this.overdriveTimer = Math.max(0, this.overdriveTimer - t)),
            C > 0 &&
              0 === this.overdriveTimer &&
              this.player?.active &&
              (this.playerCue('OVERDRIVE OFF', '#8ba0b8'), this.gadgetPulse(9150648, 10, 240)),
            (this.perfectDodgeWindow = Math.max(0, this.perfectDodgeWindow - t)),
            (this.perfectDodgeCooldown = Math.max(0, this.perfectDodgeCooldown - t)),
            !this.comboTimer && this.combatCombo)
          ) {
            if (
              (this.combatCombo >= 3 &&
                this.player?.active &&
                (this.playerCue('COMBO LOST', '#ff826e'), this.gadgetPulse(16745070, 11, 260)),
              !this.motionReduced && this.graphicsLevel >= 2)
            ) {
              const e = this.add
                .circle(this.player.x, this.player.y, 12, 16745070, 0.22)
                .setDepth(13);
              (e.setStrokeStyle(2, 16757672, 0.9),
                this.tweens.add({
                  targets: e,
                  scale: 4.2,
                  alpha: 0,
                  duration: 300,
                  ease: 'Quad.out',
                  onComplete: () => e.destroy(),
                }),
                this.shake(90, 0.0035));
            }
            ((this.combatCombo = 0),
              (this.polarityComboOverdriveTriggered = !1),
              this.game.events.emit('combo', 0, 0),
              this.ammo >= this.ammoMax
                ? (this.ammoRecharge = 0)
                : ((this.ammoRecharge += t),
                  this.ammoRecharge >= 1050 &&
                    (this.ammo++,
                    this.gadgetPulse(9303295, 8, 260),
                    (this.ammoRecharge = 0),
                    this.game.events.emit('ammo', (this.ammo / this.ammoMax) * 100))),
              this.updateBuilds(),
              this.updateNarrative());
            const e = Phaser.Input.Keyboard.JustDown(this.keys.Q) || this.mobileActions.sword;
            ((this.mobileActions.sword = !1),
              Phaser.Input.Keyboard.JustDown(this.keys.E) && this.useBlaster(),
              this.mobileActions.fire && this.useBlaster(),
              (this.mobileActions.fire = !1),
              e && this.useSword());
            const i = this.player?.body;
            if (!i) return;
            const s = this.rawKeyboardState || {},
              a =
                Boolean(this.cursors?.left?.isDown) ||
                Boolean(this.keys?.A?.isDown) ||
                Boolean(s?.KeyA) ||
                'left' === this.mobileDirection,
              l =
                Boolean(this.cursors?.right?.isDown) ||
                Boolean(this.keys?.D?.isDown) ||
                Boolean(s?.KeyD) ||
                'right' === this.mobileDirection,
              r = Boolean(this.keys?.W?.isDown) || Boolean(s?.KeyW),
              o = Boolean(this.keys?.S?.isDown) || Boolean(s?.KeyS);
            (a || l || r || o) && (i.moves = !0);
            const n =
              'left' === this.mobileDirection ? -1 : 'right' === this.mobileDirection ? 1 : 0;
            (this.mobileAirDirection || (this.mobileAirDirection = 0),
              (this.mobileAirDirection =
                0 !== n
                  ? Phaser.Math.Linear(
                      this.mobileAirDirection,
                      n,
                      Phaser.Math.Clamp(RUNNER_TUNING.mobileAirSteerResponse * (t / 16.667), 0, 1),
                    )
                  : Phaser.Math.Linear(
                      this.mobileAirDirection,
                      0,
                      Phaser.Math.Clamp(
                        0.75 * RUNNER_TUNING.mobileAirSteerResponse * (t / 16.667),
                        0,
                        1,
                      ),
                    )));
            const h = i.blocked.down || i.touching.down,
              d = this.wasGrounded && !h;
            if (!this.motionReduced && d && i.velocity.y < -120 && this.player?.active) {
              const e = this.add
                .circle(this.player.x, this.player.y + 27, 5, 9303295, 0.24)
                .setDepth(8);
              for (let e = 0; e < 3; e++) {
                const e = this.add
                  .circle(
                    this.player.x + Phaser.Math.Between(-8, 8),
                    this.player.y + 27,
                    Phaser.Math.Between(1, 2),
                    15269375,
                    0.75,
                  )
                  .setDepth(9);
                this.tweens.add({
                  targets: e,
                  x: e.x + Phaser.Math.Between(-10, 10),
                  y: e.y + Phaser.Math.Between(4, 10),
                  alpha: 0,
                  scale: 0.25,
                  duration: 160,
                  ease: 'Quad.out',
                  onComplete: () => {
                    e?.active && e.destroy();
                  },
                });
              }
              (e.setStrokeStyle(1.5, 15269375, 0.75),
                this.tweens.add({
                  targets: e,
                  scaleX: 3.2,
                  scaleY: 0.45,
                  alpha: 0,
                  y: e.y + 5,
                  duration: 145,
                  ease: 'Quad.out',
                  onComplete: () => e.destroy(),
                }));
              const t = this.add
                .rectangle(this.player.x, this.player.y + 28, 10, 2, 15269375, 0.32)
                .setDepth(9);
              this.tweens.add({
                targets: t,
                scaleX: 1.8,
                alpha: 0,
                y: t.y + 7,
                duration: 110,
                ease: 'Quad.out',
                onComplete: () => t.destroy(),
              });
            }
            const c = (a && i.velocity.x > 20) || (l && i.velocity.x < -20),
              y = h
                ? 1
                : 0 === this.mobileAirDirection ||
                    this.cursors.left.isDown ||
                    this.cursors.right.isDown ||
                    this.keys.A.isDown ||
                    this.keys.D.isDown
                  ? w.includes('airControl')
                    ? 1.18
                    : 1
                  : Math.max(0.85, Math.abs(this.mobileAirDirection)),
              p = Phaser.Math.Clamp(Math.abs(i.velocity.x) / RUNNER_TUNING.maxRunSpeed, 0, 1),
              f = Phaser.Math.Linear(RUNNER_TUNING.airSteeringMax, RUNNER_TUNING.airSteeringMin, p),
              u =
                (c
                  ? h
                    ? RUNNER_TUNING.turnAcceleration
                    : RUNNER_TUNING.airTurnAcceleration
                  : h
                    ? RUNNER_TUNING.groundAcceleration
                    : RUNNER_TUNING.airAcceleration) *
                y *
                (h ? 1 : f * (c && !h ? RUNNER_TUNING.airSteeringTurnBoost : 1)),
              m = h && this.wetSurfaceActive ? 0.28 : 1,
              S = h && this.wetSurfaceActive ? 0.82 * u : u,
              b =
                h && this.wetSurfaceActive
                  ? 0.16 * RUNNER_TUNING.groundDeceleration
                  : RUNNER_TUNING.groundDeceleration,
              C = (l ? 1 : 0) - (a ? 1 : 0),
              R = (r ? -1 : 0) + (o ? 1 : 0),
              k = r || o;
            if (0 !== C)
              (i.setAccelerationX(C * S),
                i.setDragX(this.wetSurfaceActive ? m : 0),
                this.player.setFlipX(C < 0));
            else if (
              (i.setAccelerationX(0).setDragX(h ? b : RUNNER_TUNING.airDeceleration),
              !h && Math.abs(i.velocity.x) > 1)
            ) {
              const e = Math.pow(RUNNER_TUNING.airMomentumRetention, t / 16.667);
              i.setVelocityX(i.velocity.x * e);
            }
            if (
              (k &&
                this.flightMode &&
                (i.setGravityY(0),
                i.setVelocityY(
                  Phaser.Math.Clamp(R * this.flightSpeed, -this.flightSpeed, this.flightSpeed),
                )),
              h && (w.includes('stride') || 'highSpeed' === x?.id))
            ) {
              i.setMaxVelocityX(
                RUNNER_TUNING.maxRunSpeed *
                  g *
                  ('highSpeed' === x?.id ? 1.12 : 1.04) *
                  (Number.isFinite(this.surpriseModifier?.movementMultiplier)
                    ? this.surpriseModifier.movementMultiplier
                    : 1),
              );
              Phaser.Input.Keyboard.JustDown(this.keys.F) &&
                ((this.flightMode = !this.flightMode),
                this.flightMode
                  ? (i.setVelocityY(0),
                    i.setGravityY(0),
                    this.playerCue('FLIGHT ACTIVE', '#8df4ff'),
                    this.game.events.emit('feedback', 'flight'))
                  : this.playerCue('FLIGHT OFF', '#8ba0b8'));
              const e = 'low' === this.mission.gravityMode ? 0.55 : 1;
              let s;
              const n = Math.abs(i.velocity.y);
              if (n <= RUNNER_TUNING.apexVelocityThreshold)
                s = RUNNER_TUNING.riseGravity * RUNNER_TUNING.apexGravityMultiplier;
              else if (i.velocity.y < 0) s = RUNNER_TUNING.riseGravity;
              else {
                const e = Phaser.Math.Clamp(
                    (n - RUNNER_TUNING.fallRampStart) /
                      (RUNNER_TUNING.fallRampMax - RUNNER_TUNING.fallRampStart),
                    0,
                    1,
                  ),
                  t = Phaser.Math.Linear(1, RUNNER_TUNING.fallRampBonus, e);
                s = RUNNER_TUNING.fallGravity * RUNNER_TUNING.fallGravityBoost * t;
              }
              (this.flightMode
                ? (i.setGravityY(0),
                  i.setMaxVelocityY(this.flightSpeed),
                  r || o || i.setVelocityY(Phaser.Math.Linear(i.velocity.y, 0, 0.18)))
                : (i.setGravityY(s * e), i.setMaxVelocityY(RUNNER_TUNING.maxFallSpeed)),
                h
                  ? ((this.coyote = RUNNER_TUNING.coyoteMs),
                    (this.jumpsUsed = 0),
                    (this.airDashUsed = !1))
                  : (this.coyote = Math.max(0, this.coyote - t)));
              const d =
                  Boolean(this.rawKeyboardPressed?.Space) ||
                  Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                  Phaser.Input.Keyboard.JustDown(this.keys.SPACE),
                c = d,
                y =
                  Boolean(this.rawKeyboardReleased?.Space) ||
                  Phaser.Input.Keyboard.JustUp(this.cursors.up) ||
                  Phaser.Input.Keyboard.JustUp(this.keys.SPACE),
                p =
                  Boolean(this.rawKeyboardState?.Space) ||
                  this.cursors.up.isDown ||
                  this.keys.SPACE.isDown ||
                  this.mobileActions.jumpHeld;
              ((this.mobileActions.jump = !1),
                (this.mobileActions.jumpReleased = !1),
                (this.jumpBuffer = c
                  ? RUNNER_TUNING.jumpBufferMs
                  : Math.max(0, this.jumpBuffer - t)));
              const f =
                i.blocked.left || i.touching.left
                  ? 1
                  : i.blocked.right || i.touching.right
                    ? -1
                    : 0;
              this.abilities.has('wallRun') &&
              f &&
              !h &&
              ((1 === f && a) || (-1 === f && l)) &&
              this.useEnergy(0.018 * t, 'wallRun')
                ? i.setVelocityY(Math.min(i.velocity.y, 35))
                : f && !h && i.velocity.y > 120 && i.setVelocityY(120);
              let u = !1;
              (d &&
                this.abilities.has('ledgeGrab') &&
                f &&
                !h &&
                i.velocity.y > 0 &&
                this.useEnergy(8, 'ledgeGrab') &&
                ((u = !0),
                (this.jumpBuffer = 0),
                i.setVelocityY(-120),
                this.game.events.emit('feedback', 'ledgeGrab')),
                this.abilities.has('climb') &&
                  f &&
                  this.keys.W.isDown &&
                  !h &&
                  this.useEnergy(0.024 * t, 'climb') &&
                  i.setVelocityY(-260),
                (this.rawKeyboardPressed.Space = !1),
                (this.rawKeyboardReleased.Space = !1));
              const m = this.abilities.has('wallJump') && f && !h && this.wallJumpCooldown <= 0;
              if (
                !u &&
                this.jumpBuffer > 0 &&
                (this.coyote > 0 || (this.abilities.has('doubleJump') && this.jumpsUsed < 2) || m)
              ) {
                if (m) {
                  (i.setVelocityX(445 * f),
                    (this.wallJumpCooldown = 160),
                    (this.wallJumpTimer = 150),
                    (this.jumpsUsed = 1));
                  const e = this.player.x - 16 * f;
                  if (
                    (this.graphicsLevel >= 1 &&
                      (this.dust.emitParticleAt(e, this.player.y + 12, 8),
                      this.speedLines.emitParticleAt(e, this.player.y, 4)),
                    !this.motionReduced && this.graphicsLevel >= 2)
                  ) {
                    const t = this.add.circle(e, this.player.y, 7, 9303295, 0.22).setDepth(11);
                    (t.setStrokeStyle(1.5, 12187135, 0.85),
                      this.tweens.add({
                        targets: t,
                        scale: 3.2,
                        alpha: 0,
                        duration: 190,
                        ease: 'Quad.out',
                        onComplete: () => t.destroy(),
                      }));
                  }
                  if (!this.motionReduced && this.graphicsLevel >= 2) {
                    const t = this.add.circle(e, this.player.y, 7, 9303295, 0.5);
                    (t.setBlendMode(Phaser.BlendModes.ADD),
                      t.setDepth(11),
                      this.tweens.add({
                        targets: t,
                        scale: 2.2,
                        alpha: 0,
                        duration: 150,
                        onComplete: () => t.destroy(),
                      }));
                  }
                  (this.leaveAfterimage(),
                    this.playerCue('WALL JUMP'),
                    this.shake(35, 0.001),
                    this.game.events.emit('feedback', 'wallJump'));
                } else if ((this.jumpsUsed++, 2 === this.jumpsUsed)) {
                  if (
                    (this.leaveAfterimage(16765038),
                    !this.motionReduced && this.graphicsLevel >= 2 && this.player?.active)
                  )
                    for (let e = 0; e < 4; e++) {
                      const e = this.add
                        .circle(
                          this.player.x + Phaser.Math.Between(-7, 7),
                          this.player.y + Phaser.Math.Between(8, 20),
                          Phaser.Math.Between(1, 2),
                          16765038,
                          0.78,
                        )
                        .setDepth(12);
                      this.tweens.add({
                        targets: e,
                        x: e.x + Phaser.Math.Between(-14, 14),
                        y: e.y + Phaser.Math.Between(8, 20),
                        alpha: 0,
                        scale: 0.2,
                        duration: 180,
                        ease: 'Quad.out',
                        onComplete: () => {
                          e?.active && e.destroy();
                        },
                      });
                    }
                  (this.playerCue('DOUBLE JUMP'),
                    !this.motionReduced &&
                      this.cameras?.main &&
                      (this.cameras.main.shake(70, 0.0014),
                      this.tweens.add({
                        targets: this.player,
                        scaleX: 1.08 * this.playerVisualBaseScaleX,
                        scaleY: 0.94 * this.playerVisualBaseScaleY,
                        duration: 70,
                        yoyo: !0,
                        ease: 'Quad.out',
                      })));
                  const e = this.add.circle(this.player.x, this.player.y, 9, 16765038, 0);
                  (e.setStrokeStyle(2, 16765038, 0.65),
                    e.setDepth(11),
                    this.tweens.add({
                      targets: e,
                      scale: 2.8,
                      alpha: 0,
                      duration: 240,
                      ease: 'Quad.out',
                      onComplete: () => e.destroy(),
                    }));
                }
                if (
                  (!h && this.jumpsUsed >= 1
                    ? i.setVelocityY(Math.min(i.velocity.y, RUNNER_TUNING.doubleJumpVelocity))
                    : i.setVelocityY(RUNNER_TUNING.jumpVelocity),
                  !this.motionReduced && this.graphicsLevel >= 2)
                ) {
                  const e = this.add.circle(this.player.x, this.player.y + 27, 8, 9303295, 0.32);
                  (e.setDepth(11),
                    this.tweens.add({
                      targets: e,
                      scaleX: 3.4,
                      scaleY: 0.48,
                      alpha: 0,
                      duration: 165,
                      ease: 'Quad.out',
                      onComplete: () => e.destroy(),
                    }));
                }
                if (
                  (this.jumps++, !this.motionReduced && this.graphicsLevel >= 2 && 1 === this.jumps)
                ) {
                  const e = this.add
                    .circle(this.player.x, this.player.y + 27, 6, 9303295, 0.18)
                    .setDepth(11);
                  (e.setStrokeStyle(1.5, 12187135, 0.75),
                    this.tweens.add({
                      targets: e,
                      scale: 2.6,
                      alpha: 0,
                      duration: 170,
                      ease: 'Quad.out',
                      onComplete: () => e.destroy(),
                    }));
                }
                ((this.coyote = 0),
                  (this.jumpBuffer = 0),
                  (this.jumpHeld = p),
                  this.graphicsLevel >= 1 &&
                    (this.dust.emitParticleAt(this.player.x, this.player.y + 27, 5),
                    this.speedLines.emitParticleAt(this.player.x, this.player.y + 22, 2)),
                  m || this.game.events.emit('feedback', 'jump'));
              }
              const S = (e) => {
                  const t = i.bottom;
                  (i.setSize(e.width, e.height),
                    i.setOffset(e.offsetX, e.offsetY),
                    (i.y = t - i.height),
                    i.updateFromGameObject());
                },
                b = this.mobileActions.crouch,
                C = Math.abs(i.velocity.x) > 120;
              b || (this.slideCrouchLocked = !1);
              const R =
                b &&
                !this.slideCrouchLocked &&
                h &&
                C &&
                this.abilities.has('slide') &&
                this.slideTimer <= 0 &&
                this.energy >= 10;
              if (
                (b &&
                  h &&
                  !R &&
                  !this.playerCrouched &&
                  ((this.playerCrouched = !0),
                  S(this.playerBodyConfig.crouching),
                  this.player.setScale(
                    1.04 * this.playerVisualBaseScaleX,
                    0.84 * this.playerVisualBaseScaleY,
                  ),
                  this.game.events.emit('feedback', 'crouch')),
                !b && this.playerCrouched)
              ) {
                const e = this.playerBodyConfig.standing.width,
                  t = this.playerBodyConfig.standing.height,
                  s = this.playerBodyConfig.standing.offsetX,
                  a = this.playerBodyConfig.standing.offsetY,
                  l = t - this.playerBodyConfig.crouching.height;
                !this.physics.overlapRect(i.x, i.y - l, e, l, !0, !0) &&
                  ((this.playerCrouched = !1),
                  S({ width: e, height: t, offsetX: s, offsetY: a }),
                  this.player.setScale(this.playerVisualBaseScaleX, this.playerVisualBaseScaleY));
              }
              if (R && this.useEnergy(10, 'slide')) {
                ((this.playerCrouched = !0),
                  S(this.playerBodyConfig.crouching),
                  (this.slideTimer = 360),
                  (this.slideCrouchLocked = !0),
                  i.setVelocityX(560 * Math.sign(i.velocity.x)),
                  this.tweens.killTweensOf(this.player),
                  this.tweens.add({
                    targets: this.player,
                    scaleX: 1.12 * this.playerVisualBaseScaleX,
                    scaleY: 0.82 * this.playerVisualBaseScaleY,
                    duration: 90,
                    ease: 'Quad.out',
                  }));
                const e = this.add
                  .circle(this.player.x, this.player.y + 22, 10, 16765038, 0.26)
                  .setDepth(11);
                (this.tweens.add({
                  targets: e,
                  scale: 3.6,
                  alpha: 0,
                  duration: 220,
                  onComplete: () => e.destroy(),
                }),
                  this.tweens.add({
                    targets: this.player,
                    scaleX: this.playerVisualBaseScaleX,
                    scaleY: this.playerVisualBaseScaleY,
                    duration: 220,
                    ease: 'Quad.out',
                  }),
                  this.playerCue('SLIDE', '#ffd06e'),
                  this.game.events.emit('feedback', 'slide'));
              }
              this.slideTimer = Math.max(0, this.slideTimer - t);
              const k =
                Boolean(this.rawKeyboardPressed?.ShiftLeft) ||
                Boolean(this.rawKeyboardPressed?.ShiftRight) ||
                Phaser.Input.Keyboard.JustDown(this.keys.SHIFT) ||
                this.mobileActions.dash;
              ((this.rawKeyboardPressed.ShiftLeft = !1),
                (this.rawKeyboardPressed.ShiftRight = !1),
                (this.mobileActions.dash = !1));
              const D =
                'noDash' !== x?.id && (h || (this.abilities.has('airDash') && !this.airDashUsed));
              if (
                k &&
                D &&
                this.abilities.has('dash') &&
                this.dashCooldown <= 0 &&
                this.useEnergy(h ? 8 : 25, h ? 'dash' : 'airDash')
              ) {
                const e = l ? 1 : a || this.player.flipX ? -1 : 1,
                  t = RUNNER_TUNING.dashSpeed * (w.includes('dashDrive') ? 1.08 : 1);
                h ||
                  ((this.airDashUsed = !0),
                  i.setVelocityY(-RUNNER_TUNING.airDashRecoveryVelocity),
                  this.playerCue('AIR DASH'));
                const s = this.add
                  .sprite(this.player.x, this.player.y, this.player.texture.key)
                  .setFlipX(this.player.flipX)
                  .setTint(9303295)
                  .setAlpha(0.5)
                  .setDepth(9);
                if (
                  (i.setMaxVelocityX(t).setVelocityX(t * e),
                  (this.dashCooldown = RUNNER_TUNING.dashCooldownMs),
                  (this.dashTimer = RUNNER_TUNING.dashDurationMs),
                  !this.motionReduced && this.cameras?.main && this.cameras.main.shake(90, 0.0018),
                  !this.motionReduced)
                ) {
                  this.leaveAfterimage(e > 0 ? 9303295 : 12187135);
                  const t = this.add
                    .circle(this.player.x - 24 * e, this.player.y, 11, 9303295, 0.28)
                    .setDepth(9);
                  this.tweens.add({
                    targets: t,
                    scaleX: 3.4,
                    scaleY: 0.65,
                    alpha: 0,
                    x: t.x - 52 * e,
                    duration: 155,
                    ease: 'Quad.out',
                    onComplete: () => t.destroy(),
                  });
                  const i = this.add
                    .circle(this.player.x, this.player.y, 6, 15269375, 0.7)
                    .setDepth(12);
                  this.tweens.add({
                    targets: i,
                    scale: 2.4,
                    alpha: 0,
                    duration: 160,
                    ease: 'Quad.out',
                    onComplete: () => i.destroy(),
                  });
                }
                this.perfectDodgeWindow = 120;
                const r = this.add
                  .circle(this.player.x, this.player.y, 12, 9303295, 0.3)
                  .setDepth(12);
                (this.tweens.add({
                  targets: r,
                  scale: 4,
                  alpha: 0,
                  duration: 220,
                  onComplete: () => r.destroy(),
                }),
                  this.tweens.add({
                    targets: s,
                    x: s.x - 30 * e,
                    alpha: 0,
                    duration: 160,
                    onComplete: () => s.destroy(),
                  }),
                  this.game.events.emit('feedback', 'dash'));
              }
              (y &&
                i.velocity.y < -180 &&
                this.jumpHeld &&
                (i.setVelocityY(i.velocity.y * RUNNER_TUNING.jumpCutMultiplier),
                (this.jumpHeld = !1)),
                i.velocity.y >= 0 && (this.jumpHeld = !1),
                h || (this.fallSpeed = Math.max(this.fallSpeed, i.velocity.y)));
              let v = !1;
              if (h && !this.wasGrounded && this.fallSpeed > 80) {
                if (
                  ((v = this.landingTimer > 0 && this.fallSpeed > 260),
                  this.graphicsLevel >= 1 &&
                    (this.dust.emitParticleAt(this.player.x, this.player.y + 28, v ? 12 : 4),
                    this.speedLines.emitParticleAt(this.player.x, this.player.y + 28, v ? 4 : 1)),
                  v &&
                    (this.motionReduced || this.shake(105, 0.0028),
                    this.playerCue('HARD LANDING', '#ffcf82')),
                  !this.motionReduced && this.graphicsLevel >= 2)
                ) {
                  const e = this.add
                    .circle(this.player.x, this.player.y + 28, 14, 16764802, 0.3)
                    .setDepth(11);
                  this.tweens.add({
                    targets: e,
                    scale: 4.4,
                    alpha: 0,
                    duration: 290,
                    onComplete: () => e.destroy(),
                  });
                }
                if (
                  (this.motionReduced ||
                    this.tweens.add({
                      targets: this.player,
                      scaleX: this.playerVisualBaseScaleX * (v ? 1.15 : 1.04),
                      scaleY: this.playerVisualBaseScaleY * (v ? 0.8 : 0.94),
                      yoyo: !0,
                      duration: v ? 110 : 80,
                    }),
                  this.worldLightPulse(
                    v ? 16765038 : 9303295,
                    v ? 0.2 : 0.1,
                    v ? 280 : 180,
                    v ? 54 : 34,
                  ),
                  v && (this.worldLightFlash(16765038, 0.055, 135), this.showDizzyStars(1.25)),
                  (this.landingTimer = v ? 135 : 105),
                  (this.lastHardLanding = v),
                  !this.motionReduced && this.graphicsLevel >= 2)
                ) {
                  const e = this.add
                    .circle(this.player.x, this.player.y + 28, v ? 10 : 6, 9303295, v ? 0.3 : 0.22)
                    .setDepth(10);
                  (e.setStrokeStyle(v ? 2 : 1, v ? 16764802 : 9303295, v ? 0.9 : 0.75),
                    this.tweens.add({
                      targets: e,
                      scale: v ? 4.8 : 3,
                      alpha: 0,
                      duration: v ? 260 : 175,
                      ease: 'Quad.out',
                      onComplete: () => e.destroy(),
                    }));
                }
              }
              if (
                (this.game.events.emit('feedback', v ? 'hard_land' : 'land'),
                h && (this.fallSpeed = 0),
                (this.landingTimer = Math.max(0, (this.landingTimer || 0) - t)),
                this.landingTimer <= 0 && (this.lastHardLanding = !1),
                this.dashTimer > 0)
              ) {
                if (
                  (this.player.play('runner-dash', !0),
                  !this.motionReduced &&
                    this.player?.active &&
                    ((this.dashFxTimer = Math.max(0, this.dashFxTimer - t)), this.dashFxTimer <= 0))
                ) {
                  const e = this.player.body?.velocity?.x >= 0 ? 1 : -1,
                    t = this.add
                      .circle(this.player.x - 10 * e, this.player.y + 4, 4, 9303295, 0.26)
                      .setDepth(9);
                  ((t.scaleX = 1.8),
                    (t.scaleY = 0.7),
                    this.tweens.add({
                      targets: t,
                      x: t.x + 34 * e,
                      scaleX: 0.35,
                      scaleY: 1.8,
                      alpha: 0,
                      duration: 120,
                      ease: 'Quad.out',
                      onComplete: () => t.destroy(),
                    }),
                    (this.dashFxTimer = 38));
                }
              } else if (this.wallJumpTimer > 0) {
                if (
                  (this.player.play('runner-wall', !0),
                  !this.motionReduced && this.wallJumpTimer > 0 && this.wallJumpTimer > 95)
                ) {
                  const e = this.add
                    .circle(this.player.x, this.player.y, 7, 9303295, 0.26)
                    .setDepth(10);
                  this.tweens.add({
                    targets: e,
                    x: e.x + 26 * (this.player.flipX ? 1 : -1),
                    scaleX: 2.8,
                    scaleY: 0.55,
                    alpha: 0,
                    duration: 150,
                    ease: 'Quad.out',
                    onComplete: () => e.destroy(),
                  });
                }
              } else if (h) {
                if (this.landingTimer > 0) this.player.play('runner-land', !0);
                else if (Math.abs(i.velocity.x) > 35)
                  if (
                    (this.player.play('runner-run', !0),
                    !this.motionReduced && Math.abs(i.velocity.x) > 120)
                  ) {
                    const e = Math.abs(i.velocity.x),
                      s = Phaser.Math.Clamp(e / RUNNER_TUNING.maxRunSpeed, 0, 1),
                      a = Phaser.Math.Linear(11, 17, s);
                    if (
                      ((this.runnerAnimRate = Phaser.Math.Linear(
                        this.runnerAnimRate,
                        a,
                        Math.min(1, 0.012 * t),
                      )),
                      'runner-run' === this.player.anims?.currentAnim?.key &&
                        (this.player.anims.msPerFrame = 1e3 / this.runnerAnimRate),
                      !this.motionReduced &&
                        h &&
                        Math.abs(i.velocity.x) > 90 &&
                        this.player?.active &&
                        'runner-run' === this.player.anims?.currentAnim?.key)
                    ) {
                      const e = this.player.anims.currentFrame?.index ?? 0;
                      if (e !== this.lastRunFrame) {
                        const t = -1 !== this.lastRunFrame;
                        if (((this.lastRunFrame = e), t && (0 === e || 1 === e))) {
                          const e = Math.sign(i.velocity.x) || 1,
                            t = Phaser.Math.Clamp(
                              Math.abs(i.velocity.x) / RUNNER_TUNING.maxRunSpeed,
                              0,
                              1,
                            ),
                            s = this.player.x + 4 * e,
                            a = this.player.y + 30,
                            l = this.add
                              .circle(
                                s,
                                a,
                                Phaser.Math.Linear(3.5, 5.5, t),
                                9303295,
                                Phaser.Math.Linear(0.2, 0.34, t),
                              )
                              .setDepth(8);
                          (l.setStrokeStyle(1.2, 12187135, 0.72),
                            this.tweens.add({
                              targets: l,
                              scaleX: 2.5,
                              scaleY: 0.55,
                              alpha: 0,
                              y: a + 3,
                              duration: Phaser.Math.Linear(150, 105, t),
                              ease: 'Quad.out',
                              onComplete: () => l.destroy(),
                            }));
                          const r = this.add
                            .rectangle(
                              s - 3 * e,
                              a,
                              Phaser.Math.Between(5, 9),
                              1.5,
                              15269375,
                              Phaser.Math.Linear(0.22, 0.48, t),
                            )
                            .setDepth(9);
                          this.tweens.add({
                            targets: r,
                            x: r.x - e * Phaser.Math.Between(10, 18),
                            y: r.y - Phaser.Math.Between(3, 7),
                            alpha: 0,
                            duration: 120,
                            ease: 'Quad.out',
                            onComplete: () => r.destroy(),
                          });
                        }
                      }
                    }
                  } else {
                    if (
                      (this.player.play('runner-idle', !0),
                      !this.motionReduced &&
                        !this.cinematicActive &&
                        !this.respawning &&
                        !this.isPlayerTransformLocked &&
                        this.player?.active &&
                        this.player?.body)
                    ) {
                      const e = this.player.body?.velocity?.x || 0,
                        i = this.player.body?.velocity?.y || 0,
                        s = Phaser.Math.Clamp(Math.abs(e) / RUNNER_TUNING.maxRunSpeed, 0, 1),
                        a = Phaser.Math.Clamp(0.018 * e, -8, 8),
                        l = s < 0.08 ? 0 : a,
                        r = this.playerVisualBaseScaleX * (1 + 0.035 * s),
                        o = this.playerVisualBaseScaleY * (1 - 0.025 * s),
                        n =
                          l +
                          (Math.abs(i) > 80 && s > 0.12 ? Phaser.Math.Clamp(0.008 * e, -5, 5) : 0);
                      ((this.player.angle = Phaser.Math.Linear(
                        this.player.angle,
                        n,
                        Math.min(1, 0.012 * t),
                      )),
                        (this.player.scaleX = Phaser.Math.Linear(
                          this.player.scaleX,
                          r,
                          Math.min(1, 0.018 * t),
                        )),
                        (this.player.scaleY = Phaser.Math.Linear(
                          this.player.scaleY,
                          o,
                          Math.min(1, 0.018 * t),
                        )));
                    }
                    if (
                      ((this.dustTimer = Math.max(0, this.dustTimer - t)),
                      this.graphicsLevel >= 1 &&
                        h &&
                        Math.abs(i.velocity.x) > 100 &&
                        this.dustTimer <= 0 &&
                        (this.dust.emitParticleAt(this.player.x, this.player.y + 28, 1),
                        (this.dustTimer = 90)),
                      (this.speedTimer -= t),
                      !this.motionReduced &&
                        this.graphicsLevel >= 1 &&
                        this.player?.active &&
                        Math.abs(i.velocity.x) > 280 &&
                        this.speedTimer <= 0)
                    ) {
                      const e = Math.sign(i.velocity.x) || 1,
                        t = Phaser.Math.Clamp(
                          Math.abs(i.velocity.x) / RUNNER_TUNING.maxRunSpeed,
                          0,
                          1,
                        );
                      this.speedLines.emitParticleAt(this.player.x - 12 * e, this.player.y - 2, 1);
                      const s = Phaser.Math.Linear(22, 38, t),
                        a = this.add.rectangle(
                          this.player.x - e * (18 + 0.35 * s),
                          this.player.y - 2,
                          s,
                          3,
                          9303295,
                          Phaser.Math.Linear(0.18, 0.36, t),
                        );
                      (a.setDepth(9),
                        this.tweens.add({
                          targets: a,
                          scaleX: Phaser.Math.Linear(2.2, 3.2, t),
                          alpha: 0,
                          x: a.x - e * Phaser.Math.Linear(22, 38, t),
                          duration: Phaser.Math.Linear(150, 95, t),
                          ease: 'Quad.out',
                          onComplete: () => {
                            a?.active && a.destroy();
                          },
                        }),
                        (this.speedTimer = Phaser.Math.Linear(85, 58, t)));
                    }
                    const e = Math.abs(i.velocity.x),
                      s = this.motionReduced ? 0 : Math.min(0.09, Math.max(0, e - 260) / 2200);
                    s !== this.lastParallaxBoost &&
                      ((this.lastParallaxBoost = s),
                      this.parallaxLayers.forEach(({ layer: e, base: t }) => {
                        e.setScrollFactor(t + s);
                      }));
                    const a = i.velocity.x,
                      l = i.velocity.y,
                      r = Math.abs(a),
                      o = Phaser.Math.Clamp(r / RUNNER_TUNING.maxRunSpeed, 0, 1.8);
                    if (
                      !this.motionReduced &&
                      o > 0.72 &&
                      this.player?.active &&
                      ((this.kineticTrailTimer = Math.max(0, this.kineticTrailTimer - t)),
                      this.kineticTrailTimer <= 0)
                    ) {
                      this.kineticTrailTimer = Phaser.Math.Linear(
                        120,
                        72,
                        Phaser.Math.Clamp(o - 0.72, 0, 1),
                      );
                      const e = a >= 0 ? 1 : -1,
                        t = this.add
                          .rectangle(
                            this.player.x - 24 * e,
                            this.player.y + Phaser.Math.Between(-10, 10),
                            Phaser.Math.Linear(18, 42, Phaser.Math.Clamp(o - 0.72, 0, 1)),
                            Phaser.Math.Between(1, 3),
                            9303295,
                            Phaser.Math.Linear(0.1, 0.24, Phaser.Math.Clamp(o - 0.72, 0, 1)),
                          )
                          .setOrigin(0.5)
                          .setDepth(8);
                      this.tweens.add({
                        targets: t,
                        x: t.x - 38 * e,
                        scaleX: 0.35,
                        alpha: 0,
                        duration: 150,
                        ease: 'Quad.out',
                        onComplete: () => t.destroy(),
                      });
                    }
                    if (
                      !this.motionReduced &&
                      h &&
                      Math.abs(a) > 120 &&
                      this.player?.active &&
                      ((this.groundFxTimer = Math.max(0, (this.groundFxTimer || 0) - t)),
                      this.groundFxTimer <= 0)
                    ) {
                      this.groundFxTimer = Phaser.Math.Linear(120, 55, Phaser.Math.Clamp(o, 0, 1));
                      const e = a >= 0 ? 1 : -1,
                        t = this.add
                          .rectangle(
                            this.player.x - 18 * e,
                            this.player.y + 31,
                            Phaser.Math.Between(18, 34),
                            2,
                            9303295,
                            0.24,
                          )
                          .setOrigin(0.5)
                          .setDepth(7);
                      this.tweens.add({
                        targets: t,
                        x: t.x - e * Phaser.Math.Between(24, 42),
                        scaleX: 0.35,
                        alpha: 0,
                        duration: 180,
                        ease: 'Quad.out',
                        onComplete: () => t.destroy(),
                      });
                    }
                    const n = this.dashTimer > 0,
                      d = this.landingTimer > 0 && !0 === this.lastHardLanding,
                      c = this.wallJumpTimer > 0;
                    let y = -58;
                    a > 70 ? (y = n ? -190 : -155) : a < -70 && (y = n ? 125 : 95);
                    let p = 65;
                    (l < -110
                      ? (p = Phaser.Math.Linear(
                          18,
                          4,
                          Phaser.Math.Clamp((Math.abs(l) / RUNNER_TUNING.jumpVelocity) * -1, 0, 1),
                        ))
                      : l > 180
                        ? (p = Phaser.Math.Linear(
                            102,
                            124,
                            Phaser.Math.Clamp(l / RUNNER_TUNING.maxFallSpeed, 0, 1),
                          ))
                        : Math.abs(l) <= RUNNER_TUNING.apexVelocityThreshold && (p = 48),
                      c && ((y += a > 0 ? -18 : 18), (p = 42)),
                      n && (p = l < 0 ? 32 : 72),
                      d && (p = 112));
                    let f = 1;
                    (this.firstPersonCamera &&
                      ((y = a >= 0 ? -12 : 12),
                      (p = 8),
                      (f = 1.16),
                      this.player?.active && this.player.setAlpha(0)),
                      this.motionReduced ||
                        (e > 520 ? (f = 1.035) : e > 420 ? (f = 1.026) : e > 330 && (f = 1.014)),
                      n && !this.motionReduced && (f = 1.045));
                    const u = Math.abs(a - this.cameraVelocityX),
                      m = Math.min(1, t * (n ? 0.009 : u > 180 ? 0.008 : 0.0055));
                    this.cameraVelocityX = a;
                    const g = Math.min(1, t * (d ? 0.012 : 0.008)),
                      S =
                        1 +
                        (this.motionReduced
                          ? 0
                          : 0.045 * Phaser.Math.Clamp(e / RUNNER_TUNING.maxRunSpeed, 0, 1)),
                      w = Math.max(f, S),
                      x = Math.min(1, t * (n ? 0.012 : 0.0055));
                    ((this.cameraOffsetX = Phaser.Math.Linear(this.cameraOffsetX, y, m)),
                      (this.cameraOffsetY = Phaser.Math.Linear(this.cameraOffsetY, p, g)),
                      (this.cameraZoom = Phaser.Math.Linear(this.cameraZoom, w, x)),
                      this.cameras.main
                        .setFollowOffset(this.cameraOffsetX, this.cameraOffsetY)
                        .setZoom(this.cameraZoom),
                      this.blaster?.active &&
                        this.player?.active &&
                        this.blaster
                          .setPosition(
                            this.player.x + (this.player.flipX ? -22 : 22),
                            this.player.y + 4,
                          )
                          .setFlipX(this.player.flipX),
                      this.updateChaser(t),
                      (this.wasGrounded = h));
                    const b = Number.isFinite(this.mission?.deathY) ? this.mission.deathY : 850;
                    this.player.y > b &&
                      !this.waterAttackActive &&
                      this.fail('The route vanished below.');
                    const C = Number(this.mission?.spawn?.x) || 0,
                      R = Number(this.mission?.goal?.x) || C + 1,
                      k = Phaser.Math.Clamp(
                        Math.round(((this.player.x - C) / Math.max(1, R - C)) * 100),
                        0,
                        100,
                      );
                    if (
                      k !== this.lastProgress &&
                      ((this.lastProgress = k),
                      this.objectiveProgressBar &&
                        this.objectiveProgressText &&
                        ((this.objectiveProgressBar.scaleX = k / 100),
                        this.objectiveProgressText.setText(`${k}%`),
                        this.objectiveText &&
                          this.objectiveText.active &&
                          this.objectiveText.setText(
                            this.mission?.story?.arrival || 'REACH THE RELAY',
                          ),
                        this.objectiveHUD && this.objectiveHUD.active))
                    ) {
                      const e = this.mission?.story?.arrival || 'REACH THE RELAY',
                        t = this.checkpoints?.countActive ? this.checkpoints.countActive(!0) : 0,
                        i = this.checkpoint?.signals?.size || 0;
                      t > 0 &&
                        i > 0 &&
                        k < 100 &&
                        this.objectiveHUD.list
                          .find((e) => 'Text' === e?.type && 25 === e.y)
                          ?.setText(`${e} · CHECKPOINT ${Math.min(i + 1, t)}`);
                    }
                  }
              } else {
                if (
                  (this.player.play(i.velocity.y < 0 ? 'runner-jump' : 'runner-fall', !0),
                  i.velocity.y > 420 && !this.motionReduced)
                ) {
                  if (
                    ((this.fastFallFxTimer -= t), this.fastFallFxTimer <= 0 && this.player?.active)
                  ) {
                    const e = this.add
                      .circle(this.player.x, this.player.y - 24, 5, 9303295, 0.16)
                      .setDepth(8);
                    (this.tweens.add({
                      targets: e,
                      y: e.y + 28,
                      scaleY: 2.4,
                      scaleX: 0.7,
                      alpha: 0,
                      duration: 150,
                      ease: 'Quad.out',
                      onComplete: () => {
                        e?.active && e.destroy();
                      },
                    }),
                      (this.fastFallFxTimer = 65));
                  }
                } else this.fastFallFxTimer = 0;
                if (!this.motionReduced && Math.abs(i.velocity.y) > 100) {
                  const e = Math.abs(i.velocity.y);
                  (Phaser.Math.Clamp(e / RUNNER_TUNING.maxFallSpeed, 0, 1),
                    Phaser.Math.Clamp(e / 180, 0, 1),
                    i.velocity.y);
                }
              }
            }
          }
        }
      }
  }
}
