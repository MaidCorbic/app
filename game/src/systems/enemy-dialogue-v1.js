import { enemyIntel } from '../enemy-intel.js';
import {
  getFactionForEnemyType,
  getFactionIdForEnemyType,
} from '../factions.js';


/* =========================================================
   RELAY RUNNER — FACTION DIALOGUE SYSTEM
   PREMIUM CYBERPUNK ENCOUNTER UI
   ========================================================= */

const DIALOGUE_TRIGGER_DISTANCE = 360;
const DIALOGUE_COOLDOWN = 1200;
const MAX_NEARBY_SPEAKERS = 2;
const TYPE_SPEED_MS = 24;

const ROOT_CLASS = 'relay-faction-dialogue';


/* =========================================================
   BOSS TYPES
   ========================================================= */

const BOSS_TYPES = new Set([
  'dino-boss',
  'sentinel-boss',
  'storm-boss',
  'apex-boss',
]);


/* =========================================================
   FACTION EMBLEMS
   ========================================================= */

const FACTION_EMBLEMS = Object.freeze({
  HELIX_SECURITY: '⬡',
  FERAL_THREATS: '◆',
  SKY_RAIDERS: '✦',
  GRID_GHOSTS: '◈',
});


/* =========================================================
   FACTION ACCENTS
   ========================================================= */

const FACTION_ACCENTS = Object.freeze({
  HELIX_SECURITY: '#38d9ff',
  FERAL_THREATS: '#ff3b81',
  SKY_RAIDERS: '#ffd23c',
  GRID_GHOSTS: '#a78bfa',
});


/* =========================================================
   FACTION SIGNALS
   ========================================================= */

const FACTION_SIGNALS = Object.freeze({
  HELIX_SECURITY: 82,
  FERAL_THREATS: 54,
  SKY_RAIDERS: 91,
  GRID_GHOSTS: 43,
});


/* =========================================================
   THREAT CLASSES
   ========================================================= */

const THREAT_CLASSES = Object.freeze({
  'enemy-runner': {
    name: 'INTERCEPTOR',
    color: '#38d9ff',
  },

  chicken: {
    name: 'ANOMALY',
    color: '#ffd23c',
  },

  dino: {
    name: 'HEAVY',
    color: '#ff9f43',
  },

  invader: {
    name: 'AERIAL',
    color: '#ffd23c',
  },

  'alien-ground': {
    name: 'GROUND',
    color: '#a78bfa',
  },

  'dino-boss': {
    name: 'COMMAND',
    color: '#ff3b81',
  },

  'sentinel-boss': {
    name: 'COMMAND',
    color: '#ff3b81',
  },

  'storm-boss': {
    name: 'CRITICAL',
    color: '#ff3b81',
  },

  'apex-boss': {
    name: 'APEX',
    color: '#ff3b81',
  },
});


/* =========================================================
   SIGNAL BAR
   ========================================================= */

function buildSignalBar(value) {
  const safeValue = Math.max(
    0,
    Math.min(
      100,
      Number(value) || 0,
    ),
  );

  const filled =
    Math.round(safeValue / 10);

  return (
    '█'.repeat(filled) +
    '░'.repeat(10 - filled)
  );
}


/* =========================================================
   MISSION DIALOGUE
   ========================================================= */

const MISSION_DIALOGUE = Object.freeze({
  'first-delivery': {
    HELIX_SECURITY: [
      ['enemy-runner', 'Movement on the east line.'],
      ['security', 'Courier confirmed.'],
      ['enemy-runner', 'Hold the route. Do not lose the package.'],
    ],

    FERAL_THREATS: [
      ['chicken', 'Cluck. Something is coming.'],
      ['chicken', 'That route is mine.'],
    ],
  },

  'dead-drop': {
    HELIX_SECURITY: [
      ['enemy-runner', 'Movement at the docks.'],
      ['guard', 'That is the courier from Old Quarter.'],
      ['enemy-runner', 'Then close the drop lane.'],
    ],

    GRID_GHOSTS: [
      ['alien-ground', 'Signal carrier approaching.'],
      ['alien-ground', 'Keep the relay dark.'],
      ['alien-ground', 'Do not let it reach the next gate.'],
    ],
  },

  blackout: {
    HELIX_SECURITY: [
      ['guard', 'Grid Nine just lit up.'],
      ['security', 'Then the courier made it through.'],
      ['sentinel-boss', 'Lock the relay corridor.'],
    ],
  },

  pursuit: {
    HELIX_SECURITY: [
      ['enemy-runner', 'Target has entered Rail Spine.'],
      ['security', 'Deploy the interceptor line.'],
      ['dino-boss', 'I will stop the courier myself.'],
    ],

    FERAL_THREATS: [
      ['dino', 'Something is running through my lane.'],
      ['dino', 'Make it stop.'],
      ['dino-boss', 'I am done watching it pass.'],
    ],
  },

  'signal-storm': {
    SKY_RAIDERS: [
      ['invader', 'Movement below.'],
      ['invader', 'The storm corridor is ours.'],
      ['invader', 'Force the courier back to the ground.'],
    ],

    GRID_GHOSTS: [
      ['alien-ground', 'The relay signal is awake.'],
      ['storm-boss', 'Then let the storm answer it.'],
    ],
  },

  'corporate-lockdown': {
    HELIX_SECURITY: [
      ['security', 'Tower lockdown is active.'],
      ['guard', 'Courier is inside the perimeter.'],
      ['sentinel-boss', 'Seal every route to Cityspine.'],
    ],
  },

  'final-relay': {
    HELIX_SECURITY: [
      ['security', 'Apex breach confirmed.'],
      ['enemy-runner', 'The courier reached the final relay.'],
      ['apex-boss', 'Then there is nowhere left to run.'],
    ],

    GRID_GHOSTS: [
      ['alien-ground', 'The final relay is waking.'],
      ['storm-boss', 'Everything converges here.'],
      ['apex-boss', 'Let the network break with them.'],
    ],
  },
});


/* =========================================================
   FALLBACK DIALOGUE
   ========================================================= */

const FALLBACK_DIALOGUE = Object.freeze({
  HELIX_SECURITY: [
    ['enemy-runner', 'Contact ahead.'],
    ['security', 'Visual confirmed.'],
    ['guard', 'Stop the courier.'],
  ],

  FERAL_THREATS: [
    ['dino', 'Something is entering the lane.'],
    ['chicken', 'It should not be here.'],
  ],

  SKY_RAIDERS: [
    ['invader', 'Target acquired.'],
    ['invader', 'Keep the courier inside the kill zone.'],
  ],

  GRID_GHOSTS: [
    ['alien-ground', 'Relay signal detected.'],
    ['storm-boss', 'The network is listening.'],
  ],
});


/* =========================================================
   ENEMY LOOKUP
   ========================================================= */

function enemyKeyFromObject(object) {
  const key =
    object?.getData?.('route')?.type ||
    object?.texture?.key;

  return Object.prototype.hasOwnProperty.call(
    enemyIntel,
    key,
  )
    ? key
    : null;
}


/* =========================================================
   SPEAKER NAME
   ========================================================= */

function speakerName(enemyType) {
  return (
    enemyIntel[enemyType]?.name ||
    String(enemyType || 'UNKNOWN').toUpperCase()
  );
}


/* =========================================================
   NEARBY ENEMIES
   ========================================================= */

function getNearbyEnemies(scene) {
  const player = scene?.player;

  if (!player?.active) {
    return [];
  }

  const objects =
    scene.children?.list || [];

  const seen = new Set();
  const nearby = [];

  for (const object of objects) {
    if (!object?.active) {
      continue;
    }

    const enemyType =
      enemyKeyFromObject(object);

    if (!enemyType) {
      continue;
    }

    if (
      BOSS_TYPES.has(enemyType) &&
      object.getData?.('defeated')
    ) {
      continue;
    }

    if (
      !Number.isFinite(object.x) ||
      !Number.isFinite(object.y)
    ) {
      continue;
    }

    const distance =
      Phaser.Math.Distance.Between(
        player.x,
        player.y,
        object.x,
        object.y,
      );

    if (
      distance >
      DIALOGUE_TRIGGER_DISTANCE
    ) {
      continue;
    }

    const id =
      object.getData?.(
        'factionDialogueId',
      );

    const stableId =
      id ||
      `${enemyType}:${Math.round(object.x)}:${Math.round(object.y)}`;

    if (seen.has(stableId)) {
      continue;
    }

    seen.add(stableId);

    nearby.push({
      object,
      enemyType,
      factionId:
        getFactionIdForEnemyType(
          enemyType,
        ),
      distance,
    });
  }

  nearby.sort(
    (a, b) =>
      a.distance - b.distance,
  );

  return nearby;
}


/* =========================================================
   DIALOGUE RESOLUTION
   ========================================================= */

function getDialogueLines(
  scene,
  primary,
  nearby,
) {
  const missionId =
    scene?.mission?.id;

  const factionId =
    primary?.factionId ||
    getFactionIdForEnemyType(
      primary?.enemyType,
    );

  const missionLines =
    MISSION_DIALOGUE[
      missionId
    ]?.[factionId];

  if (missionLines?.length) {
    return missionLines.map(
      ([enemyType, text]) => ({
        speakerType:
          enemyType,

        speaker:
          speakerName(
            enemyType,
          ),

        text,
      }),
    );
  }

  const fallback =
    FALLBACK_DIALOGUE[
      factionId
    ];

  if (fallback?.length) {
    const availableTypes = [
      ...new Set(
        [
          primary?.enemyType,
          ...nearby.map(
            (entry) =>
              entry.enemyType,
          ),
        ].filter(Boolean),
      ),
    ];

    return fallback.map(
      ([enemyType, text], index) => {
        const selectedType =
          availableTypes[
            index %
              Math.max(
                1,
                availableTypes.length,
              )
          ] || enemyType;

        return {
          speakerType:
            selectedType,

          speaker:
            speakerName(
              selectedType,
            ),

          text,
        };
      },
    );
  }

  const faction =
    getFactionForEnemyType(
      primary?.enemyType,
    );

  return [
    {
      speakerType:
        primary?.enemyType,

      speaker:
        speakerName(
          primary?.enemyType,
        ),

      text:
        `${faction?.name || 'HOSTILE'} contact detected.`,
    },
  ];
}


/* =========================================================
   STYLE INSTALLATION
   ========================================================= */

function installStyles() {
  if (document.getElementById('relay-faction-dialogue-styles')) return;

  const style = document.createElement('style');
  style.id = 'relay-faction-dialogue-styles';
  style.textContent = `@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;600;700;800;900&display=swap');


/* =========================================================
   PANEL
   ========================================================= */

.relay-faction-dialogue{
  --faction-accent:#38d9ff;
  --threat-color:#38d9ff;
  --signal-value:82%;

  position:fixed !important;

  left:50% !important;
  top:50% !important;

  right:auto !important;
  bottom:auto !important;

  width:min(
    920px,
    calc(100vw - 80px)
  ) !important;

  height:300px !important;

  min-height:300px !important;
  max-height:300px !important;

  box-sizing:border-box !important;

  transform:
    translate(-50%,-50%)
    scale(.985) !important;

  z-index:1190 !important;

  display:grid !important;

  grid-template-columns:
    190px
    minmax(0,1fr)
    210px;

  overflow:hidden !important;

  isolation:isolate;

  border:
    1px solid
    rgba(56,189,248,.25) !important;

  border-radius:5px !important;

  background:
    linear-gradient(
      110deg,
      rgba(2,7,14,.998),
      rgba(6,13,23,.995) 50%,
      rgba(3,7,14,.998)
    ) !important;

  color:#edfaff !important;

  font:
    500 12px/1.45
    "Orbitron",
    system-ui,
    sans-serif !important;

  opacity:0;

  pointer-events:auto;

  box-shadow:
    0 24px 80px rgba(0,0,0,.74),
    0 0 32px rgba(56,189,248,.055),
    inset 0 1px rgba(255,255,255,.055),
    inset 0 0 80px rgba(0,0,0,.40);

  transition:
    opacity 180ms ease,
    transform 220ms cubic-bezier(.16,1,.3,1) !important;

  scrollbar-width:none !important;
  -ms-overflow-style:none !important;

  user-select:none !important;
  -webkit-user-select:none !important;
  -webkit-touch-callout:none !important;
}


/* =========================================================
   HIDDEN
   ========================================================= */

.relay-faction-dialogue[hidden]{
  display:none !important;
}


/* =========================================================
   ACTIVE
   ========================================================= */

.relay-faction-dialogue:not([hidden]),
.relay-faction-dialogue.visible{
  opacity:1;

  transform:
    translate(-50%,-50%)
    scale(1) !important;
}


/* =========================================================
   TOP SCAN LINE
   ========================================================= */

.relay-faction-dialogue::after{
  content:"";

  position:absolute;

  left:0;
  right:0;
  top:0;

  height:1px;

  z-index:30;

  background:
    linear-gradient(
      90deg,
      transparent,
      rgba(255,0,170,.55) 18%,
      var(--faction-accent) 50%,
      rgba(255,0,170,.45) 82%,
      transparent
    );

 border-left:
    2px solid
    color-mix(
      in srgb,
      var(--faction-accent) 68%,
      transparent
    );

box-shadow:
    -5px 0 16px
    color-mix(
      in srgb,
      var(--faction-accent) 10%,
      transparent
    );
}


/* =========================================================
   SCANLINES
   ========================================================= */

.relay-faction-dialogue::before{
  content:"";

  position:absolute;

  inset:0;

  z-index:25;

  pointer-events:none;

  background:
    repeating-linear-gradient(
      0deg,
      rgba(255,255,255,.011) 0,
      rgba(255,255,255,.011) 1px,
      transparent 1px,
      transparent 5px
    );

  opacity:.28;
}


/* =========================================================
   LEFT FACTION ZONE
   ========================================================= */

.relay-faction-dialogue .relay-faction-header{
  position:relative;

  display:flex;

  flex-direction:column;

  align-items:flex-start;

  justify-content:center;

  padding:
    24px 20px;

  border-right:
    1px solid
    rgba(56,189,248,.09);

  background:
    linear-gradient(
      135deg,
      rgba(8,18,29,.45),
      rgba(1,5,11,.18)
    );
}


/* =========================================================
   FACTION LABEL
   ========================================================= */

.relay-faction-dialogue .relay-faction-kicker{
  display:flex;

  align-items:center;

  gap:8px;

  margin:
    0 0 17px !important;
color:
    rgba(141,244,255,.82) !important;

  font:
    800 8px/1
    "Orbitron",
    sans-serif !important;

  letter-spacing:
    .20em !important;

  text-transform:
    uppercase !important;
}


/* =========================================================
   GREEN SIGNAL DOT
   ========================================================= */

.relay-faction-dialogue .relay-faction-signal-dot{
  width:6px;
  height:6px;

  flex:0 0 6px;

  border-radius:50%;

  background:#39ff88;

  box-shadow:
    0 0 5px #39ff88,
    0 0 12px rgba(57,255,136,.65);

  animation:
    factionSignalDot
    1.5s
    ease-in-out
    infinite;
}


/* =========================================================
   FACTION EMBLEM
   ========================================================= */

.relay-faction-dialogue .relay-faction-emblem{
  position:relative;

  display:flex;

  align-items:center;
  justify-content:center;

 width:82px;
height:82px;

  margin:
    0 0 18px;

  border:
    1px solid
    color-mix(
      in srgb,
      var(--faction-accent) 60%,
      transparent
    );

  border-radius:50%;

  background:
    radial-gradient(
      circle,
      color-mix(
        in srgb,
        var(--faction-accent) 12%,
        transparent
      ),
      transparent 68%
    );

  color:
    var(--faction-accent);

  font:
    800 34px/1
    "Orbitron",
    sans-serif;

  text-shadow:
    0 0 8px
    var(--faction-accent),

    0 0 20px
    color-mix(
      in srgb,
      var(--faction-accent) 38%,
      transparent
    );

  box-shadow:
    inset 0 0 22px
    color-mix(
      in srgb,
      var(--faction-accent) 5%,
      transparent
    ),

    0 0 20px
    color-mix(
      in srgb,
      var(--faction-accent) 7%,
      transparent
    );

  animation:
    factionEmblemPulse
    3s
    ease-in-out
    infinite;
}


/* =========================================================
   EMBLEM CROSSHAIR
   ========================================================= */

.relay-faction-dialogue .relay-faction-emblem::before{
  content:"";

  position:absolute;

  left:-9px;
  right:-9px;

  top:50%;

  height:1px;

  background:
    linear-gradient(
      90deg,
      transparent,
      color-mix(
        in srgb,
        var(--faction-accent) 34%,
        transparent
      ),
      transparent
    );
}


.relay-faction-dialogue .relay-faction-emblem::after{
  content:"";

  position:absolute;

  top:-9px;
  bottom:-9px;

  left:50%;

  width:1px;

  background:
    linear-gradient(
      180deg,
      transparent,
      color-mix(
        in srgb,
        var(--faction-accent) 34%,
        transparent
      ),
      transparent
    );
}
.relay-faction-dialogue .relay-faction-identity-status{
  display:flex;

  flex-direction:column;

  gap:5px;

  margin-top:0;

  padding-left:2px;
}

.relay-faction-dialogue .relay-faction-identity-status span{
  color:
    rgba(125,211,252,.30);

  font:
    600 5px/1
    "Orbitron",
    sans-serif;

  letter-spacing:
    .16em;

  text-transform:
    uppercase;
}

.relay-faction-dialogue .relay-faction-identity-status b{
  display:flex;

  align-items:center;

  gap:6px;

  color:
    #39ff88;

  font:
    700 7px/1
    "Orbitron",
    sans-serif;

  letter-spacing:
    .10em;

  text-transform:
    uppercase;

  text-shadow:
    0 0 8px
    rgba(57,255,136,.22);
}

.relay-faction-dialogue .relay-faction-identity-status b::before{
  content:"";

  width:4px;
  height:4px;

  border-radius:50%;

  background:#39ff88;

  box-shadow:
    0 0 6px #39ff88;
}


/* =========================================================
   ENCOUNTER ID
   ========================================================= */

.relay-faction-dialogue .relay-faction-encounter-id{
  position:absolute;

  left:20px;
  bottom:18px;

  color:
    rgba(141,244,255,.28);

  font:
    600 6px/1
    "Orbitron",
    sans-serif;

  letter-spacing:
    .16em;

  text-transform:
    uppercase;
}


/* =========================================================
   CENTER CORE
   ========================================================= */

.relay-faction-dialogue .relay-faction-dialogue-core{
  position:relative;

  display:flex;

  flex-direction:column;

  justify-content:center;

  min-width:0;

  padding:
    28px 34px 24px;
}


/* =========================================================
   CORE LABEL
   ========================================================= */

.relay-faction-dialogue .relay-faction-dialogue-core::before{
 content:
    "RELAY COMMUNICATION CHANNEL  //  SECURE";

  position:absolute;

  top:17px;
  left:34px;

  color:
    rgba(125,211,252,.22);

font:
    600 7px/1
    "Orbitron",
    sans-serif;

  letter-spacing:
    .14em;
}


/* =========================================================
   SPEAKER
   ========================================================= */

.relay-faction-dialogue .relay-faction-name{
  position:relative;

 margin:
    0 0 22px !important;

  padding:
    0 0 12px !important;

  color:
    #f3fcff !important;

font:
    800 17px/1.2
    "Orbitron",
    sans-serif !important;

  letter-spacing:
    .11em !important;

  text-transform:
    uppercase !important;

  text-align:
    left !important;

  text-shadow:
    0 0 8px
    color-mix(
      in srgb,
      var(--faction-accent) 25%,
      transparent
    );
}


.relay-faction-dialogue .relay-faction-name::before{
  content:
    "INCOMING TRANSMISSION";

  display:block;

  margin-bottom:7px;

  color:
    rgba(125,211,252,.30);

  font:
    600 8px/1
    "Orbitron",
    sans-serif;

  letter-spacing:
    .19em;

  text-align:left;
}


.relay-faction-dialogue .relay-faction-name::after{
  content:"";

  position:absolute;

  left:0;
  bottom:0;

  width:100%;
  height:1px;

  background:
    linear-gradient(
      90deg,
      var(--faction-accent),
      rgba(56,189,248,.18),
      transparent
    );
}


/* =========================================================
   DIALOGUE
   ========================================================= */

.relay-faction-dialogue .relay-faction-text{
  position:relative;

  width:100%;
  max-width:62ch;

  min-height:72px;

  margin:0 !important;

  padding:
    0 0 0 15px !important;

  box-sizing:border-box;

  border-left:
    2px solid
    color-mix(
      in srgb,
      var(--faction-accent) 48%,
      transparent
    );

  color:
    #e9faff !important;

font:
    500 clamp(16px,1.6vw,19px)/1.6
    "Orbitron",
    sans-serif !important;

letter-spacing:
    .025em !important;

  text-align:left !important;

  overflow-wrap:anywhere;

  text-wrap:pretty;

  text-shadow:
    0 0 12px
    rgba(56,189,248,.05);
}


/* =========================================================
   CHANNEL LABEL
   ========================================================= */

.relay-faction-dialogue .relay-faction-text::before{
  content:
    "SECURE CHANNEL // ENCOUNTER LINKED";

  display:block;

  margin:
    0 0 13px;

  color:
    rgba(125,211,252,.30);

font:
    600 7px/1
    "Orbitron",
    sans-serif;

  letter-spacing:
    .16em;

  text-align:left;
}


/* =========================================================
   TYPEWRITER CURSOR
   ========================================================= */

.relay-faction-dialogue .relay-faction-cursor{
  display:inline-block;

  margin-left:3px;

  color:
    var(--faction-accent) !important;

  text-shadow:
    0 0 8px
    var(--faction-accent);

  animation:
    factionCursor
    .7s
    steps(1)
    infinite;
}


/* =========================================================
   RIGHT TACTICAL SCAN
   ========================================================= */

.relay-faction-dialogue .relay-faction-tactical{
  position:relative;

  display:flex;

  flex-direction:column;

  justify-content:center;

  padding:
    22px 20px;

  border-left:
    1px solid
    rgba(56,189,248,.10);

  background:
    linear-gradient(
      225deg,
      rgba(8,18,29,.48),
      rgba(1,5,11,.20)
    );

  overflow:hidden;
}


/* =========================================================
   TACTICAL TOP LINE
   ========================================================= */

.relay-faction-dialogue .relay-faction-tactical::before{
  content:
    "SCAN // 04";

  position:absolute;

  top:16px;
  right:20px;

  color:
    rgba(125,211,252,.22);

  font:
    600 5px/1
    "Orbitron",
    sans-serif;

  letter-spacing:
    .18em;
}


/* =========================================================
   TACTICAL CORNER
   ========================================================= */

.relay-faction-dialogue .relay-faction-tactical::after{
  content:"";

  position:absolute;

  right:9px;
  bottom:9px;

  width:17px;
  height:17px;

  border-right:
    1px solid
    rgba(56,189,248,.28);

  border-bottom:
    1px solid
    rgba(56,189,248,.28);

  pointer-events:none;
}


/* =========================================================
   TACTICAL LABEL
   ========================================================= */

.relay-faction-dialogue .relay-faction-tactical-label{
  display:block;

  margin:
    0 0 13px;

  color:
    rgba(125,211,252,.32);

  font:
    700 8px/1
    "Orbitron",
    sans-serif;

  letter-spacing:
    .18em;

  text-transform:
    uppercase;
}


/* =========================================================
   HOSTILE SIGNAL
   ========================================================= */

.relay-faction-dialogue .relay-faction-scan-status{
  position:relative;

  display:flex;

  align-items:center;

  gap:8px;

  margin:
    0 0 17px !important;

  padding:
    7px 8px;

  border:
    1px solid
    rgba(57,255,136,.14);

  background:
    linear-gradient(
      90deg,
      rgba(57,255,136,.045),
      rgba(57,255,136,.012)
    );

  color:
    #39ff88 !important;
font:
    700 8px/1.25
    "Orbitron",
    sans-serif !important;

  letter-spacing:
    .09em !important;

  text-transform:
    uppercase;

  text-shadow:
    0 0 8px
    rgba(57,255,136,.30);

  box-shadow:
    inset 0 0 15px
    rgba(57,255,136,.025);
}


.relay-faction-dialogue .relay-faction-scan-status::before{
  content:"";

  width:5px;
  height:5px;

  flex:0 0 5px;

  border-radius:50%;

  background:#39ff88;

  box-shadow:
    0 0 5px #39ff88,
    0 0 12px rgba(57,255,136,.70);

  animation:
    factionSignalDot
    1.2s
    ease-in-out
    infinite;
}


/* =========================================================
   CONTACT LOCK
   ========================================================= */

.relay-faction-dialogue .relay-faction-scan-status::after{
  content:
    "LOCK";

  margin-left:auto;

  color:
    rgba(57,255,136,.42);

 font:
    700 6px/1
    "Orbitron",
    sans-serif;

  letter-spacing:
    .15em;
}


/* =========================================================
   THREAT HEADER
   ========================================================= */

.relay-faction-dialogue .relay-faction-threat-class{
  position:relative;

  display:block;

  width:100%;

  margin:
    0 0 19px !important;

  padding:
    8px 9px;

  box-sizing:border-box;

  border:
    1px solid
    color-mix(
      in srgb,
      var(--threat-color) 28%,
      transparent
    );

  background:
    linear-gradient(
      90deg,
      color-mix(
        in srgb,
        var(--threat-color) 7%,
        transparent
      ),
      rgba(0,0,0,.12)
    );

  color:
    var(--threat-color) !important;

  font:
    700 8px/1.15
    "Orbitron",
    sans-serif !important;

  letter-spacing:
    .12em !important;

  text-transform:
    uppercase;

  box-shadow:
    inset 0 0 14px
    color-mix(
      in srgb,
      var(--threat-color) 4%,
      transparent
    );
}


/* =========================================================
   THREAT LABEL
   ========================================================= */

.relay-faction-dialogue .relay-faction-threat-class::before{
  content:
    "THREAT CLASS";

  display:block;

  margin-bottom:5px;

  color:
    color-mix(
      in srgb,
      var(--threat-color) 48%,
      transparent
    );

font:
    600 6px/1
    "Orbitron",
    sans-serif;

  letter-spacing:
    .17em;
}


/* =========================================================
   SIGNAL INTEGRITY
   ========================================================= */

.relay-faction-dialogue .relay-faction-footer{
  position:relative;

  display:flex !important;

  flex-direction:column;

  align-items:stretch;

  gap:10px;

  margin:0 !important;

  padding:0 !important;

  border:0 !important;
}


/* =========================================================
   SIGNAL LABEL
   ========================================================= */

.relay-faction-dialogue .relay-faction-footer::before{
  content:
    "SIGNAL INTEGRITY";

  display:block;

  margin:0;

  color:
    rgba(125,211,252,.34);

 font:
    700 6px/1
    "Orbitron",
    sans-serif;

  letter-spacing:
    .17em;

  white-space:nowrap;
}


/* =========================================================
   SIGNAL METER
   ========================================================= */

.relay-faction-dialogue .relay-faction-footer::after{
  content:
    var(--faction-signal,"82%");

  display:block;

  width:100%;

  height:7px;

  box-sizing:border-box;

  padding-left:
    calc(var(--signal-value,82%) * .01);

  color:
    rgba(141,244,255,.58);

  font:
    700 5px/7px
    "Orbitron",
    sans-serif;

  letter-spacing:
    .10em;

  text-align:right;

  background:
    repeating-linear-gradient(
      90deg,
      rgba(56,189,248,.48) 0,
      rgba(56,189,248,.48) 4px,
      rgba(56,189,248,.08) 4px,
      rgba(56,189,248,.08) 7px
    );

  border:
    1px solid
    rgba(56,189,248,.16);

  box-shadow:
    inset 0 0 10px
    rgba(56,189,248,.035);
}


/* =========================================================
   ENTER HINT
   ========================================================= */

.relay-faction-dialogue .relay-faction-hint{
  display:inline-flex !important;

  align-items:center;

  justify-content:flex-start;

  margin:
    3px 0 0 !important;

  padding:
    5px 7px !important;

  width:fit-content;

  border:
    1px solid
    rgba(56,189,248,.17);

  border-radius:
    2px;

  background:
    rgba(56,189,248,.025);

  color:
    rgba(220,245,255,.46) !important;

font:
    700 6px/1.25
    "Orbitron",
    sans-serif !important;

  letter-spacing:
    .10em !important;

  text-transform:
    uppercase;

  white-space:
    nowrap;
}


/* =========================================================
   ENTER KEY
   ========================================================= */

.relay-faction-dialogue .relay-faction-hint::before{
  content:
    "ENTER";

  display:inline-flex;

  align-items:center;

  justify-content:center;

  min-width:35px;

  height:14px;

  margin-right:6px;

  padding:
    0 4px;

  box-sizing:border-box;

  border:
    1px solid
    rgba(141,244,255,.34);

  border-radius:
    2px;

  background:
    rgba(56,189,248,.07);

  color:
    #e8fbff;

font:
    800 6px/1
    "Orbitron",
    sans-serif;

  letter-spacing:
    .08em;
}


/* =========================================================
   HIDE BUTTON
   ========================================================= */

.relay-faction-dialogue button{
  display:none !important;
}


/* =========================================================
   KEYWORD
   ========================================================= */

.relay-faction-dialogue .relay-faction-keyword{
  color:
    var(--faction-accent) !important;

  font-weight:
    800 !important;
}


/* =========================================================
   ANIMATIONS
   ========================================================= */

@keyframes factionSignalDot{
  0%,100%{
    opacity:.52;

    box-shadow:
      0 0 4px #39ff88,
      0 0 8px rgba(57,255,136,.34);
  }

  50%{
    opacity:1;

    box-shadow:
      0 0 6px #39ff88,
      0 0 14px rgba(57,255,136,.72);
  }
}


@keyframes factionEmblemPulse{
  0%,100%{
    transform:scale(.97);
    opacity:.78;
  }

  50%{
    transform:scale(1.025);
    opacity:1;
  }
}


@keyframes factionCursor{
  0%,49%{
    opacity:1;
  }

  50%,100%{
    opacity:0;
  }
}


/* =========================================================
   MOBILE
   ========================================================= */

@media(max-width:700px){

  .relay-faction-dialogue{
    width:
      calc(100vw - 18px) !important;

    height:auto !important;

    min-height:0 !important;

    max-height:
      calc(100vh - 20px) !important;

    grid-template-columns:
      86px
      minmax(0,1fr) !important;

    grid-template-rows:
      auto
      auto !important;
  }


  .relay-faction-dialogue .relay-faction-header{
    grid-row:
      1 / span 2;

    padding:
      17px 10px;
  }


 .relay-faction-dialogue .relay-faction-kicker{
  position:relative;

  width:100%;

  display:block;

  margin:
    0 0 17px !important;

  text-align:center;
}

.relay-faction-dialogue .relay-faction-kicker
.relay-faction-signal-dot{
  position:absolute;

  left:calc(50% - 58px);

  top:50%;

  transform:translateY(-50%);
}

  .relay-faction-dialogue .relay-faction-emblem{
    width:48px;
    height:48px;

    margin-bottom:
      12px;

    font-size:
      20px;
      background:
  radial-gradient(
    circle,
    color-mix(
      in srgb,
      var(--faction-accent) 14%,
      transparent
    ) 0%,
    color-mix(
      in srgb,
      var(--faction-accent) 4%,
      transparent
    ) 42%,
    transparent 70%
  );

background-image:
  radial-gradient(
    circle,
    transparent 58%,
    color-mix(
      in srgb,
      var(--faction-accent) 20%,
      transparent
    ) 59%,
    transparent 61%
  );
  }


  .relay-faction-dialogue .relay-faction-encounter-id{
    left:10px;
    bottom:11px;

    font-size:
      5px;
  }


  .relay-faction-dialogue .relay-faction-dialogue-core{
    padding:
      20px 16px 13px;
      background:
  linear-gradient(
    90deg,
    rgba(56,189,248,.025) 1px,
    transparent 1px
  ),
  linear-gradient(
    0deg,
    rgba(56,189,248,.018) 1px,
    transparent 1px
  );

background-size:
  28px 28px;

box-shadow:
  inset 0 0 45px
  rgba(56,189,248,.025);
  }


  .relay-faction-dialogue .relay-faction-dialogue-core::before{
    top:9px;
    left:16px;

    font-size:
      5px;
  }


  .relay-faction-dialogue .relay-faction-name{
    margin-bottom:
      14px !important;

    font-size:
      10px !important;

    letter-spacing:
      .07em !important;
  }


  .relay-faction-dialogue .relay-faction-text{
    min-height:
      55px;

    font-size:
      12px !important;

    line-height:
      1.55 !important;

    padding-left:
      10px !important;
  }


  .relay-faction-dialogue .relay-faction-text::before{
    font-size:
      5px;

    margin-bottom:
      9px;
  }


  .relay-faction-dialogue .relay-faction-tactical{
    grid-column:
      2;

    padding:
      12px 16px 14px;

    border-left:
      0;

    border-top:
      1px solid
      rgba(56,189,248,.10);
  }


  .relay-faction-dialogue .relay-faction-tactical-label{
    margin-bottom:
      9px;
  }


  .relay-faction-dialogue .relay-faction-scan-status{
    margin-bottom:
      11px !important;

    font-size:
      6px !important;
  }


  .relay-faction-dialogue .relay-faction-threat-class{
    margin-bottom:
      12px !important;

    font-size:
      6px !important;
  }


  .relay-faction-dialogue .relay-faction-footer{
    gap:
      8px;
  }
}


/* =========================================================
   SMALL MOBILE
   ========================================================= */

@media(max-width:420px){

  .relay-faction-dialogue{
    width:
      calc(100vw - 10px) !important;

    grid-template-columns:
      70px
      minmax(0,1fr) !important;
  }


  .relay-faction-dialogue .relay-faction-header{
    padding:
      14px 8px;
  }


  .relay-faction-dialogue .relay-faction-emblem{
    width:40px;
    height:40px;

    font-size:
      17px;
  }


  .relay-faction-dialogue .relay-faction-dialogue-core{
    padding:
      16px 12px 11px;
  }


  .relay-faction-dialogue .relay-faction-tactical{
    padding:
      10px 12px 12px;
  }


  .relay-faction-dialogue .relay-faction-text{
    font-size:
      11px !important;
  }
}


/* =========================================================
   REDUCED MOTION
   ========================================================= */

@media(prefers-reduced-motion:reduce){

  .relay-faction-dialogue,
  .relay-faction-dialogue .relay-faction-emblem,
  .relay-faction-dialogue .relay-faction-signal-dot,
  .relay-faction-dialogue .relay-faction-footer::before,
  .relay-faction-dialogue .relay-faction-cursor{
    animation:none !important;

    transition:none !important;
  }
}
`;

  /* Keep the authored faction panel, but remove a visibility/compositing trap
     that can hide it behind later mobile/desktop CSS layers. */
  style.textContent += `
    #play .relay-faction-dialogue[hidden]{display:none!important;}
    #play .relay-faction-dialogue:not([hidden]){
      display:grid!important;
      visibility:visible!important;
      opacity:1!important;
    }
    #play .relay-faction-dialogue .relay-faction-dialogue-core,
    #play .relay-faction-dialogue .relay-faction-header,
    #play .relay-faction-dialogue .relay-faction-tactical{
      min-width:0!important;
      min-height:0!important;
    }
  `;

  style.textContent += `
#play .relay-faction-dialogue[hidden]{display:none!important;}
#play .relay-faction-dialogue:not([hidden]){
  display:grid!important;
  visibility:visible!important;
  opacity:1!important;
}
#play .relay-faction-dialogue .relay-faction-dialogue-core,
#play .relay-faction-dialogue .relay-faction-header,
#play .relay-faction-dialogue .relay-faction-tactical{
  min-width:0!important;
  min-height:0!important;
}
`;

  document.head.appendChild(style);
}

/* =========================================================
   KEYBOARD
   ========================================================= */

function installKeyboard(scene) {
  if (
    scene.__factionDialogueKeyboardInstalled
  ) {
    return;
  }

  scene.__factionDialogueKeyboardInstalled =
    true;

  scene.__factionDialogueKeyHandler =
    (event) => {

      if (
        !scene.__factionDialogueActive
      ) {
        return;
      }

      if (
        event.key === 'Enter' ||
        event.code === 'Enter'
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();

        scene.advanceFactionDialogue?.();

        return;
      }

      if (
        event.key === 'Escape' ||
        event.code === 'Escape'
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();

        scene.skipFactionDialogue?.();
      }
    };

  document.addEventListener(
    'keydown',
    scene.__factionDialogueKeyHandler,
    true,
  );
}


/* =========================================================
   REMOVE KEYBOARD
   ========================================================= */

function removeKeyboard(scene) {
  if (
    !scene.__factionDialogueKeyboardInstalled ||
    !scene.__factionDialogueKeyHandler
  ) {
    return;
  }

  document.removeEventListener(
    'keydown',
    scene.__factionDialogueKeyHandler,
    true,
  );

  scene.__factionDialogueKeyboardInstalled =
    false;

  scene.__factionDialogueKeyHandler =
    null;
}


/* =========================================================
   CLEAR TYPEWRITER
   ========================================================= */

function clearDialogueTimer(scene) {
  if (
    scene.__factionDialogueTypeTimer
  ) {
    window.clearInterval(
      scene.__factionDialogueTypeTimer,
    );

    scene.__factionDialogueTypeTimer =
      null;
  }
}


/* =========================================================
   CLEAN PANEL
   ========================================================= */

function cleanupDialoguePanel(scene) {
  const panel =
    scene?.__factionDialoguePanel;

  if (!panel) {
    return;
  }

  panel.remove();

  scene.__factionDialoguePanel =
    null;
}


/* =========================================================
   INSTALL PANEL
   ========================================================= */

function installPanel(scene) {
  installStyles();

  cleanupDialoguePanel(scene);

  const backdrop = document.createElement('div');
  backdrop.className = 'relay-faction-backdrop';
  backdrop.hidden = true;

  document.body.appendChild(backdrop);

  scene.__factionDialogueBackdrop = backdrop;

  const panel =
    document.createElement('section');

  panel.className =
    ROOT_CLASS;

  panel.hidden =
    true;

  panel.setAttribute(
    'role',
    'dialog',
  );

  panel.setAttribute(
    'aria-modal',
    'true',
  );

  panel.setAttribute(
    'aria-live',
    'polite',
  );

  panel.innerHTML = `
    <div class="relay-faction-header">

      <p class="relay-faction-kicker">
        <span
          class="relay-faction-signal-dot"
          aria-hidden="true"
        ></span>

        FACTION LINK
      </p>

      <div
        class="relay-faction-emblem"
        data-faction-emblem
        aria-hidden="true"
      >
        ◆
      </div>

      <div class="relay-faction-identity-status">
  <span>LINK STATUS</span>
  <b>CONNECTED</b>
</div>


      <span
        class="relay-faction-encounter-id"
        data-faction-encounter-id
      >
        ENCOUNTER // 01
      </span>

    </div>


    <div class="relay-faction-dialogue-core">

      <p
        class="relay-faction-name"
        data-faction-name
      ></p>

      <p
        class="relay-faction-text"
        data-faction-text
      ></p>

    </div>


    <aside class="relay-faction-tactical">

      <span class="relay-faction-tactical-label">
        TACTICAL SCAN
      </span>

      <p
        class="relay-faction-scan-status"
        data-faction-scan-status
      >
        HOSTILE SIGNAL // IDENTIFIED
      </p>

      <p
        class="relay-faction-threat-class"
        data-faction-threat-class
      >
        INTERCEPTOR
      </p>

      <div class="relay-faction-footer">

        <p
          class="relay-faction-hint"
          data-faction-hint
        >
          ENTER · NEXT&nbsp;&nbsp; ESC · SKIP
        </p>

        <button
          type="button"
          data-faction-next
          tabindex="-1"
        >
          NEXT
        </button>

      </div>

    </aside>
  `;

  document.body.appendChild(
    panel,
  );

  scene.__factionDialoguePanel =
    panel;

  panel
    .querySelector(
      '[data-faction-next]',
    )
    ?.addEventListener(
      'click',
      (event) => {
        event.preventDefault();

        scene.advanceFactionDialogue?.();
      },
    );
}


/* =========================================================
   FACTION VISUALS
   ========================================================= */

function setFactionVisuals(
  scene,
  factionId,
) {
  const panel =
    scene.__factionDialoguePanel;

  if (!panel) {
    return;
  }

  const faction =
    getFactionForEnemyType(
      scene.__factionDialogueTriggerType,
    );

  const resolvedFactionId =
    factionId ||
    faction?.id ||
    'HELIX_SECURITY';

  const emblem =
    panel.querySelector(
      '[data-faction-emblem]',
    );

  const symbol =
    FACTION_EMBLEMS[
      resolvedFactionId
    ] || '◆';

  const accent =
    FACTION_ACCENTS[
      resolvedFactionId
    ] || '#38d9ff';

  const signal =
    FACTION_SIGNALS[
      resolvedFactionId
    ] ?? 82;

  if (emblem) {
    emblem.textContent =
      symbol;

    emblem.style.setProperty(
      '--faction-accent',
      accent,
    );
  }

  panel.style.setProperty(
    '--faction-accent',
    accent,
  );

  panel.style.setProperty(
    '--signal-value',
    `${signal}`,
  );

  panel.style.setProperty(
    '--faction-signal',
    `"${buildSignalBar(signal)} // ${signal}%"`,
  );

  panel.dataset.faction =
    resolvedFactionId;
}


/* =========================================================
   SET LINE
   ========================================================= */

function setPanelLine(
  scene,
  line,
  factionName,
  instant = false,
) {
  const panel =
    scene.__factionDialoguePanel;

  if (!panel) {
    return;
  }

  const speakerElement =
    panel.querySelector(
      '[data-faction-name]',
    );

  const textElement =
    panel.querySelector(
      '[data-faction-text]',
    );

  if (
    !speakerElement ||
    !textElement
  ) {
    return;
  }

  clearDialogueTimer(scene);

  speakerElement.textContent =
    `${line.speaker} · ${factionName}`;

  textElement.classList.toggle(
    'relay-faction-typing',
    !instant,
  );

  scene.__factionDialogueTyping =
    !instant;

  if (instant) {
    textElement.textContent =
      line.text;

    scene.__factionDialogueTyping =
      false;

    return;
  }

  textElement.textContent =
    '';

  let index = 0;

  scene.__factionDialogueTypeTimer =
    window.setInterval(
      () => {

        index += 1;

        textElement.textContent =
          line.text.slice(
            0,
            index,
          );

        if (
          index >=
          line.text.length
        ) {
          clearDialogueTimer(scene);

          scene.__factionDialogueTyping =
            false;

          textElement.classList.remove(
            'relay-faction-typing',
          );
        }
      },
      TYPE_SPEED_MS,
    );
}


/* =========================================================
   SHOW DIALOGUE
   ========================================================= */

function showDialogue(
  scene,
  trigger,
) {
  if (
    scene.__factionDialogueActive
  ) {
    return false;
  }

  const nearby =
    getNearbyEnemies(scene);

  if (!nearby.length) {
    return false;
  }

  const primary =
    trigger ||
    nearby[0];

  const faction =
    getFactionForEnemyType(
      primary.enemyType,
    );

  if (!faction) {
    return false;
  }

  const lines =
    getDialogueLines(
      scene,
      primary,
      nearby.slice(
        0,
        MAX_NEARBY_SPEAKERS,
      ),
    );

  if (!lines.length) {
    return false;
  }

  scene.__factionDialogueActive =
    true;

  scene.__factionDialogueLines =
    lines;

  scene.__factionDialogueIndex =
    0;

  scene.__factionDialogueTriggerType =
    primary.enemyType;

  scene.__factionDialogueFactionId =
    faction.id;

  scene.__factionDialogueLast =
    scene.time?.now || 0;

  const seen =
    scene.__factionDialogueSeen ||
    new Set();

  scene.__factionDialogueSeen =
    seen;

  seen.add(
    `${scene.mission?.id || 'unknown'}:${faction.id}`,
  );


  /* =======================================================
     PAUSE PHYSICS
     ======================================================= */

  if (scene.physics?.world) {
    scene.__factionDialoguePhysicsPaused =
      Boolean(
        scene.physics.world.isPaused,
      );

    scene.physics.world.isPaused =
      true;
  }


  /* =======================================================
     FACTION VISUALS
     ======================================================= */

  setFactionVisuals(
    scene,
    faction.id,
  );


  /* =======================================================
     ENCOUNTER ID
     ======================================================= */

  const encounterId =
    scene.__factionDialoguePanel
      ?.querySelector(
        '[data-faction-encounter-id]',
      );

  if (encounterId) {
    const count =
      Number(
        scene.__factionDialogueEncounterCount ||
          0,
      ) + 1;

    scene.__factionDialogueEncounterCount =
      count;

    encounterId.textContent =
      `ENCOUNTER // ${String(
        count,
      ).padStart(2, '0')}`;
  }


  /* =======================================================
     SCAN STATUS
     ======================================================= */

  const scanStatus =
    scene.__factionDialoguePanel
      ?.querySelector(
        '[data-faction-scan-status]',
      );

  if (scanStatus) {
    scanStatus.textContent =
      'HOSTILE SIGNAL // IDENTIFIED';
  }


  /* =======================================================
     THREAT
     ======================================================= */

  const threatClass =
    scene.__factionDialoguePanel
      ?.querySelector(
        '[data-faction-threat-class]',
      );

  const threat =
    THREAT_CLASSES[
      primary.enemyType
    ] || {
      name: 'UNKNOWN',
      color: '#8df4ff',
    };

  if (threatClass) {

    threatClass.textContent =
      threat.name;

    threatClass.style.setProperty(
      '--threat-color',
      threat.color,
    );

    threatClass.dataset.threatLevel =
      threat.name;
  }


  /* =======================================================
     FIRST LINE
     ======================================================= */

  const line =
    scene.__factionDialogueLines[0];

  setPanelLine(
    scene,
    line,
    faction.name,
  );


  /* =======================================================
     SHOW PANEL
     ======================================================= */

 if (
    scene.__factionDialogueBackdrop
  ) {
    scene.__factionDialogueBackdrop.hidden =
      false;
  }

  if (
    scene.__factionDialoguePanel
  ) {
    scene.__factionDialoguePanel.hidden =
      false;
  }

  return true;
}


/* =========================================================
   DISMISS
   ========================================================= */

function dismissDialogue(
  scene,
  skipAll = false,
) {
  if (
    !scene.__factionDialogueActive
  ) {
    return;
  }

  clearDialogueTimer(scene);

  scene.__factionDialogueTyping =
    false;

if (
    scene.__factionDialogueBackdrop
  ) {
    scene.__factionDialogueBackdrop.hidden =
      true;
  }

  if (
    scene.__factionDialoguePanel
  ) {
    scene.__factionDialoguePanel.hidden =
      true;
  }

  scene.__factionDialogueActive =
    false;

  scene.__factionDialogueLines =
    [];

  scene.__factionDialogueIndex =
    0;

  if (skipAll) {
    scene.__factionDialogueSkipped =
      true;
  }

  if (scene.physics?.world) {
    scene.physics.world.isPaused =
      Boolean(
        scene.__factionDialoguePhysicsPaused,
      );
  }

  scene.__factionDialoguePhysicsPaused =
    false;
}


/* =========================================================
   INSTALL
   ========================================================= */

export function installEnemyDialogue(
  RunnerScene,
) {
  if (
    !RunnerScene?.prototype ||
    RunnerScene.prototype
      .__factionEnemyDialogueV2
  ) {
    return;
  }

  RunnerScene.prototype
    .__factionEnemyDialogueV2 =
    true;


  const originalCreate =
    RunnerScene.prototype.create;

  const originalUpdate =
    RunnerScene.prototype.update;

  const originalShutdown =
    RunnerScene.prototype.shutdown;


  /* =======================================================
     CREATE
     ======================================================= */

  RunnerScene.prototype.create =
    function (...args) {

      originalCreate.apply(
        this,
        args,
      );

      this.__factionDialogueLast =
        0;

      this.__factionDialogueActive =
        false;

      this.__factionDialogueLines =
        [];

      this.__factionDialogueIndex =
        0;

      this.__factionDialogueSeen =
        new Set();

        this.__factionDialogueNearbyIds =
  new Set();
      this.__factionDialogueEncounterCount =
        0;

      this.__factionDialogueTyping =
        false;

      this.__factionDialogueSkipped =
        false;

      this.__factionDialogueTriggerType =
        null;

      this.__factionDialogueFactionId =
        null;

      this.__factionDialoguePhysicsPaused =
        false;

      this.__factionDialogueTypeTimer =
        null;

      installPanel(this);

      installKeyboard(this);
    };


  /* =======================================================
     ADVANCE
     ======================================================= */

  RunnerScene.prototype
    .advanceFactionDialogue =
    function () {

      if (
        !this.__factionDialogueActive ||
        !this.__factionDialogueLines?.length
      ) {
        return;
      }


      /* ===================================================
         COMPLETE TYPEWRITER
         =================================================== */

      if (
        this.__factionDialogueTyping
      ) {
        const line =
          this.__factionDialogueLines[
            this.__factionDialogueIndex
          ];

        setPanelLine(
          this,
          line,
          getFactionForEnemyType(
            this.__factionDialogueTriggerType,
          )?.name ||
            'FACTION',
          true,
        );

        return;
      }


      /* ===================================================
         NEXT
         =================================================== */

      const nextIndex =
        this.__factionDialogueIndex +
        1;

      if (
        nextIndex >=
        this.__factionDialogueLines.length
      ) {
        dismissDialogue(
          this,
          false,
        );

        return;
      }

      this.__factionDialogueIndex =
        nextIndex;

      const line =
        this.__factionDialogueLines[
          nextIndex
        ];

      const lineFaction =
        getFactionForEnemyType(
          line.speakerType ||
            this.__factionDialogueTriggerType,
        )?.name ||
        getFactionForEnemyType(
          this.__factionDialogueTriggerType,
        )?.name ||
        'FACTION';

      setPanelLine(
        this,
        line,
        lineFaction,
      );
    };


  /* =======================================================
     SKIP
     ======================================================= */

  RunnerScene.prototype
    .skipFactionDialogue =
    function () {

      dismissDialogue(
        this,
        true,
      );
    };


  /* =======================================================
     UPDATE
     ======================================================= */

 RunnerScene.prototype.update =
  function (...args) {

    if (
      this.__factionDialogueActive
    ) {
      return;
    }

    const result =
      originalUpdate.apply(
        this,
        args,
      );

    if (
      !this.player?.active ||
      this.finished ||
      this.respawning ||
      this.cinematicActive
    ) {
      return result;
    }

    const now =
      this.time?.now ||
      0;

    if (
      now -
        (
          this.__factionDialogueLast ||
          0
        ) <
      DIALOGUE_COOLDOWN
    ) {
      return result;
    }

    const nearby =
      getNearbyEnemies(this);

    /*
      FACTION DIALOGUE TRIGGERS ONLY
      WHEN AN ENEMY ENTERS THE
      PROXIMITY ZONE.

      This prevents the dialogue from
      opening immediately when gameplay
      starts while an enemy is already
      inside the detection radius.
    */

    const nearbyIds =
      new Set(
        nearby.map(
          enemy =>
            enemy.id ??
            enemy.enemyId ??
            enemy,
        ),
      );

    const previousNearby =
      this.__factionDialogueNearbyIds ||
      new Set();

    this.__factionDialogueNearbyIds =
      nearbyIds;

    if (!nearby.length) {
      return result;
    }

    const enteredEnemy =
      nearby.find(
        enemy => {
          const id =
            enemy.id ??
            enemy.enemyId ??
            enemy;

          return !previousNearby.has(id);
        },
      );

    if (!enteredEnemy) {
      return result;
    }

    const missionId =
      this.mission?.id ||
      'unknown';

    const factionId =
      enteredEnemy.factionId;

    if (!factionId) {
      return result;
    }

    const encounterKey =
      `${missionId}:${factionId}`;

    if (
      this.__factionDialogueSeen.has(
        encounterKey,
      )
    ) {
      return result;
    }

    this.__factionDialogueLast =
      now;

    showDialogue(
      this,
      enteredEnemy,
    );

    return result;
  };


  /* =======================================================
     SHUTDOWN
     ======================================================= */

  RunnerScene.shutdown =
    function (...args) {

      dismissDialogue(
        this,
        true,
      );

      removeKeyboard(this);

      cleanupDialoguePanel(this);

      return originalShutdown
        ? originalShutdown.apply(
            this,
            args,
          )
        : undefined;
    };
}


/* =========================================================
   ALIAS
   ========================================================= */

export const installFactionDialogue =
  installEnemyDialogue;