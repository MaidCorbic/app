
import { enemyIntel } from '../enemy-intel.js';
import {
  getFactionForEnemyType,
  getFactionIdForEnemyType,
} from '../factions.js';

const DIALOGUE_TRIGGER_DISTANCE = 360;
const DIALOGUE_COOLDOWN = 1200;
const MAX_NEARBY_SPEAKERS = 2;
const TYPE_SPEED_MS = 11;

const BOSS_TYPES = new Set([
  'dino-boss',
  'sentinel-boss',
  'storm-boss',
  'apex-boss',
]);

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

function speakerName(enemyType) {
  return enemyIntel[enemyType]?.name ||
    String(enemyType || 'UNKNOWN').toUpperCase();
}

function getNearbyEnemies(scene) {
  const player = scene?.player;

  if (!player?.active) return [];

  const objects = scene.children?.list || [];
  const seen = new Set();
  const nearby = [];

  for (const object of objects) {
    if (!object?.active) continue;

    const enemyType = enemyKeyFromObject(object);
    if (!enemyType) continue;

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

    const distance = Phaser.Math.Distance.Between(
      player.x,
      player.y,
      object.x,
      object.y,
    );

    if (
      !Number.isFinite(distance) ||
      distance > DIALOGUE_TRIGGER_DISTANCE
    ) {
      continue;
    }

    const explicitId =
      object.getData?.('factionDialogueId');

    const stableId =
      explicitId ||
      `${enemyType}:${Math.round(object.x)}:${Math.round(object.y)}`;

    if (seen.has(stableId)) continue;

    seen.add(stableId);

    nearby.push({
      object,
      enemyType,
      factionId:
        getFactionIdForEnemyType(enemyType),
      distance,
    });
  }

  nearby.sort(
    (a, b) => a.distance - b.distance,
  );

  return nearby;
}

function getDialogueLines(
  scene,
  primary,
  nearby,
) {
  const missionId = scene?.mission?.id;

  const factionId =
    primary?.factionId ||
    getFactionIdForEnemyType(
      primary?.enemyType,
    );

  const missionLines =
    MISSION_DIALOGUE[missionId]?.[factionId];

  if (missionLines?.length) {
    return missionLines.map(
      ([enemyType, text]) => ({
        speakerType: enemyType,
        speaker: speakerName(enemyType),
        text,
      }),
    );
  }

  const fallback =
    FALLBACK_DIALOGUE[factionId];

  if (fallback?.length) {
    const availableTypes = [
      ...new Set(
        [
          primary?.enemyType,
          ...nearby.map(
            (entry) => entry.enemyType,
          ),
        ].filter(Boolean),
      ),
    ];

    return fallback.map(
      ([enemyType, text], index) => {
        const resolvedType =
          availableTypes[
            index %
              Math.max(
                1,
                availableTypes.length,
              )
          ] || enemyType;

        return {
          speakerType: resolvedType,
          speaker: speakerName(resolvedType),
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
        primary?.enemyType || 'unknown',
      speaker:
        speakerName(
          primary?.enemyType,
        ),
      text:
        `${faction?.name || 'HOSTILE'} contact detected.`,
    },
  ];
}

function installStyles() {
  if (
    document.getElementById(
      'relay-faction-dialogue-styles',
    )
  ) {
    return;
  }

  const style =
    document.createElement('style');

  style.id =
    'relay-faction-dialogue-styles';

  style.textContent = `
    .relay-faction-dialogue{
      position:fixed;
      left:50%;
      bottom:max(
        20px,
        env(safe-area-inset-bottom) + 12px
      );
      transform:
        translate3d(-50%,12px,0)
        scale(.985);

      z-index:1190;

      width:min(
        680px,
        calc(100vw - 24px)
      );

      box-sizing:border-box;

      padding:16px 17px 15px;

      border:1px solid
        rgba(141,244,255,.34);

      border-radius:12px;

      background:
        radial-gradient(
          circle at 92% 0%,
          rgba(57,185,255,.15),
          transparent 34%
        ),
        radial-gradient(
          circle at 0% 100%,
          rgba(141,244,255,.04),
          transparent 40%
        ),
        linear-gradient(
          145deg,
          rgba(2,8,16,.985),
          rgba(7,22,36,.98)
        );

      box-shadow:
        inset 0 1px 0
          rgba(255,255,255,.065),
        inset 0 -1px 0
          rgba(57,185,255,.04),
        0 18px 55px
          rgba(0,0,0,.50),
        0 0 30px
          rgba(57,185,255,.10);

      color:#f5fbff;

      font:
        500 14px/1.45
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

      pointer-events:auto;

      opacity:0;

      transition:
        opacity 170ms ease,
        transform 190ms
          cubic-bezier(.22,.61,.36,1),
        box-shadow 170ms ease;
    }

    .relay-faction-dialogue[hidden]{
      display:none !important;
    }

    .relay-faction-dialogue:not([hidden]){
      opacity:1;
      transform:
        translate3d(-50%,0,0)
        scale(1);
    }

    .relay-faction-dialogue::before{
      content:"";
      position:absolute;
      inset:0;
      z-index:-2;

      background:
        repeating-linear-gradient(
          0deg,
          rgba(255,255,255,.012) 0,
          rgba(255,255,255,.012) 1px,
          transparent 1px,
          transparent 4px
        );

      opacity:.45;
      pointer-events:none;
    }

    .relay-faction-dialogue::after{
      content:"";
      position:absolute;

      left:14px;
      right:14px;
      top:0;

      height:1px;

      background:
        linear-gradient(
          90deg,
          transparent,
          rgba(141,244,255,.3),
          rgba(141,244,255,.9),
          rgba(57,185,255,.5),
          transparent
        );

      box-shadow:
        0 0 10px
          rgba(141,244,255,.25);

      pointer-events:none;
    }

    .relay-faction-dialogue .relay-faction-kicker{
      display:flex;
      align-items:center;
      gap:8px;

      margin:0 0 5px;

      color:#8df4ff;

      font:
        900 8px/1.2
        ui-monospace,
        SFMono-Regular,
        Menlo,
        Monaco,
        Consolas,
        monospace;

      letter-spacing:.18em;
      text-transform:uppercase;

      text-shadow:
        0 0 10px
          rgba(141,244,255,.28);
    }

    .relay-faction-dialogue
    .relay-faction-kicker::before{
      content:"◆";

      color:#8df4ff;

      font-size:7px;
      line-height:1;

      text-shadow:
        0 0 8px
          rgba(141,244,255,.65);
    }

    .relay-faction-dialogue .relay-faction-name{
      margin:0 0 8px;

      max-width:100%;

      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;

      color:#ffd06e;

      font:
        900 10px/1.25
        ui-monospace,
        SFMono-Regular,
        Menlo,
        Monaco,
        Consolas,
        monospace;

      letter-spacing:.10em;
      text-transform:uppercase;

      text-shadow:
        0 0 12px
          rgba(255,208,110,.12);
    }

    .relay-faction-dialogue .relay-faction-text{
      margin:0;

      min-height:0;

      max-width:62ch;

      color:#ffffff;

      font:
        600 clamp(
          14px,
          1.8vw,
          16px
        )/1.48
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

      letter-spacing:.002em;

      overflow-wrap:anywhere;
      text-wrap:pretty;
    }

    .relay-faction-dialogue
    .relay-faction-footer{
      display:grid;

      grid-template-columns:
        1fr auto;

      align-items:center;

      gap:12px;

      margin-top:12px;

      padding-top:0;

      border-top:0;
    }

    .relay-faction-dialogue
    .relay-faction-meta{
      display:flex;
      align-items:center;
      gap:7px;

      min-width:0;

      margin-top:7px;

      color:
        rgba(220,238,248,.55);

      font:
        800 7px/1.2
        ui-monospace,
        SFMono-Regular,
        Menlo,
        Monaco,
        Consolas,
        monospace;

      letter-spacing:.11em;
      text-transform:uppercase;
    }

    .relay-faction-dialogue
    .relay-faction-hint{
      margin:0;

      color:
        rgba(220,238,248,.66);

      font:
        800 8px/1.25
        ui-monospace,
        SFMono-Regular,
        Menlo,
        Monaco,
        Consolas,
        monospace;

      letter-spacing:.085em;

      text-transform:uppercase;
    }

    .relay-faction-dialogue
    .relay-faction-progress{
      position:relative;

      width:56px;
      height:3px;

      overflow:hidden;

      border-radius:999px;

      background:
        rgba(141,244,255,.10);
    }

    .relay-faction-dialogue
    .relay-faction-progress > i{
      display:block;

      width:0;
      height:100%;

      border-radius:inherit;

      background:
        linear-gradient(
          90deg,
          #39b9ff,
          #8df4ff
        );

      box-shadow:
        0 0 10px
          rgba(141,244,255,.35);

      transition:
        width 180ms ease;
    }

    .relay-faction-dialogue button{
      position:relative;

      display:inline-flex;

      align-items:center;
      justify-content:center;

      min-width:108px;
      min-height:38px;

      padding:9px 15px;

      overflow:hidden;

      border:
        1px solid
        rgba(141,244,255,.44);

      border-radius:8px;

      background:
        linear-gradient(
          180deg,
          rgba(19,55,77,.98),
          rgba(5,18,30,.98)
        );

      color:#efffff;

      font:
        900 9px/1
        ui-monospace,
        SFMono-Regular,
        Menlo,
        Monaco,
        Consolas,
        monospace;

      letter-spacing:.13em;
      text-transform:uppercase;

      cursor:pointer;

      box-shadow:
        inset 0 1px 0
          rgba(255,255,255,.07),
        0 5px 16px
          rgba(0,0,0,.24),
        0 0 15px
          rgba(57,185,255,.06);

      transition:
        transform 120ms ease,
        border-color 120ms ease,
        box-shadow 120ms ease,
        background 120ms ease;
    }

    .relay-faction-dialogue
    button::before{
      content:"";

      position:absolute;
      inset:0;

      background:
        linear-gradient(
          105deg,
          transparent 20%,
          rgba(255,255,255,.11) 50%,
          transparent 80%
        );

      transform:translateX(-120%);

      pointer-events:none;
    }

    .relay-faction-dialogue
    button:hover,
    .relay-faction-dialogue
    button:focus-visible{
      border-color:
        rgba(141,244,255,.86);

      background:
        linear-gradient(
          180deg,
          rgba(28,77,104,.99),
          rgba(7,27,43,.99)
        );

      box-shadow:
        inset 0 1px 0
          rgba(255,255,255,.10),
        0 7px 20px
          rgba(0,0,0,.30),
        0 0 21px
          rgba(57,185,255,.16);

      transform:
        translateY(-1px);

      outline:none;
    }

    .relay-faction-dialogue
    button:hover::before,
    .relay-faction-dialogue
    button:focus-visible::before{
      animation:
        relay-faction-button-sweep
        560ms ease-out forwards;
    }

    .relay-faction-dialogue
    button:active{
      transform:
        translateY(0)
        scale(.985);
    }

    .relay-faction-dialogue
    button:disabled{
      opacity:.55;
      cursor:default;
      transform:none;
    }

    .relay-faction-keyword{
      color:#ffd06e;
      font-weight:900;
      text-shadow:
        0 0 9px
          rgba(255,208,110,.20);
    }

    @keyframes
    relay-faction-button-sweep{
      from{
        transform:
          translateX(-120%);
      }

      to{
        transform:
          translateX(120%);
      }
    }

    @media(max-width:700px){
      .relay-faction-dialogue{
        width:
          calc(100vw - 14px);

        bottom:
          max(
            10px,
            env(safe-area-inset-bottom) + 7px
          );

        padding:
          13px 12px 12px;

        border-radius:10px;
      }

      .relay-faction-dialogue::after{
        left:10px;
        right:10px;
      }

      .relay-faction-dialogue
      .relay-faction-name{
        font-size:9px;
      }

      .relay-faction-dialogue
      .relay-faction-text{
        font-size:13px;
        line-height:1.42;
      }

      .relay-faction-dialogue
      .relay-faction-footer{
        grid-template-columns:1fr;
        gap:7px;
        margin-top:10px;
      }

      .relay-faction-dialogue
      .relay-faction-hint{
        order:2;
        text-align:center;
        font-size:7px;
      }

      .relay-faction-dialogue
      button{
        width:100%;
        min-height:40px;
      }
    }

    @media(max-width:390px){
      .relay-faction-dialogue{
        width:
          calc(100vw - 10px);

        padding:
          11px 10px 10px;
      }

      .relay-faction-dialogue
      .relay-faction-text{
        font-size:12px;
      }

      .relay-faction-dialogue
      .relay-faction-kicker{
        font-size:7px;
      }

      .relay-faction-dialogue
      .relay-faction-name{
        font-size:8px;
        letter-spacing:.07em;
      }

      .relay-faction-dialogue
      .relay-faction-hint{
        font-size:6px;
      }

      .relay-faction-dialogue
      button{
        min-height:38px;
        font-size:8px;
      }
    }

    @media(prefers-reduced-motion:reduce){
      .relay-faction-dialogue,
      .relay-faction-dialogue button{
        transition:none;
      }

      .relay-faction-dialogue
      button::before{
        animation:none !important;
      }
    }
  `;

  document.head.appendChild(style);
}

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
      if (!scene.__factionDialogueActive) {
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

function clearTypeTimer(scene) {
  if (
    scene?.__factionDialogueTypeTimer
  ) {
    window.clearInterval(
      scene.__factionDialogueTypeTimer,
    );

    scene.__factionDialogueTypeTimer =
      null;
  }
}

function cleanupDialoguePanel(scene) {
  const panel =
    scene?.__factionDialoguePanel;

  if (!panel) return;

  clearTypeTimer(scene);

  panel.remove();

  scene.__factionDialoguePanel =
    null;
}

function updateProgress(scene) {
  const panel =
    scene.__factionDialoguePanel;

  if (!panel) return;

  const progress =
    panel.querySelector(
      '[data-faction-progress]',
    );

  const counter =
    panel.querySelector(
      '[data-faction-counter]',
    );

  const total =
    scene.__factionDialogueLines?.length ||
    0;

  const index =
    scene.__factionDialogueIndex || 0;

  const percent =
    total > 0
      ? ((index + 1) / total) * 100
      : 0;

  if (progress) {
    progress.style.width =
      `${percent}%`;
  }

  if (counter) {
    counter.textContent =
      `${Math.min(index + 1, total)} / ${total}`;
  }
}

function installPanel(scene) {
  installStyles();
  cleanupDialoguePanel(scene);

  const panel =
    document.createElement('section');

  panel.className =
    'relay-faction-dialogue';

  panel.hidden = true;

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

  panel.setAttribute(
    'aria-label',
    'Faction encounter',
  );

  panel.innerHTML = `
    <p class="relay-faction-kicker">
      FACTION ENCOUNTER
    </p>

    <p
      class="relay-faction-name"
      data-faction-name
    ></p>

    <p
      class="relay-faction-text"
      data-faction-text
    ></p>

    <div
      class="relay-faction-meta"
      aria-hidden="true"
    >
      <span data-faction-counter>
        1 / 1
      </span>

      <span
        class="relay-faction-progress"
      >
        <i
          data-faction-progress
        ></i>
      </span>
    </div>

    <div class="relay-faction-footer">
      <p
        class="relay-faction-hint"
        data-faction-hint
      >
        [ ENTER ] NEXT
        &nbsp;&nbsp;
        [ ESC ] SKIP
      </p>

      <button
        type="button"
        data-faction-next
        aria-label="Next faction dialogue"
      >
        NEXT
      </button>
    </div>
  `;

  document.body.appendChild(panel);

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
        event.stopPropagation();

        scene.advanceFactionDialogue?.();
      },
    );
}

function setPanelLine(
  scene,
  line,
  factionName,
  instant = false,
) {
  const panel =
    scene.__factionDialoguePanel;

  if (!panel) return;

  const speakerElement =
    panel.querySelector(
      '[data-faction-name]',
    );

  const textElement =
    panel.querySelector(
      '[data-faction-text]',
    );

  const nextButton =
    panel.querySelector(
      '[data-faction-next]',
    );

  if (
    !speakerElement ||
    !textElement
  ) {
    return;
  }

  speakerElement.textContent =
    `${line.speaker} · ${factionName}`;

  textElement.textContent = '';

  clearTypeTimer(scene);

  if (instant) {
    textElement.textContent =
      line.text;

    scene.__factionDialogueTyping =
      false;

    updateProgress(scene);

    return;
  }

  scene.__factionDialogueTyping =
    true;

  let index = 0;

  const tick = () => {
    index += 1;

    textElement.textContent =
      line.text.slice(
        0,
        index,
      );

    if (
      index >= line.text.length
    ) {
      clearTypeTimer(scene);

      scene.__factionDialogueTyping =
        false;
    }
  };

  scene.__factionDialogueTypeTimer =
    window.setInterval(
      tick,
      TYPE_SPEED_MS,
    );

  updateProgress(scene);

  if (nextButton) {
    nextButton.textContent =
      'NEXT';
  }
}

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
    trigger || nearby[0];

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

  if (scene.physics?.world) {
    scene.__factionDialoguePhysicsPaused =
      Boolean(
        scene.physics.world.isPaused,
      );

    scene.physics.world.isPaused =
      true;
  }

  const line =
    scene.__factionDialogueLines[0];

  setPanelLine(
    scene,
    line,
    faction.name,
  );

  const panel =
    scene.__factionDialoguePanel;

  if (panel) {
    panel.hidden = false;

    panel.setAttribute(
      'aria-label',
      `Faction encounter: ${faction.name}`,
    );

    requestAnimationFrame(() => {
      panel
        .querySelector(
          '[data-faction-next]',
        )
        ?.focus({
          preventScroll: true,
        });
    });
  }

  updateProgress(scene);

  return true;
}

function dismissDialogue(
  scene,
  skipAll = false,
) {
  if (
    !scene.__factionDialogueActive
  ) {
    return;
  }

  clearTypeTimer(scene);

  scene.__factionDialogueTyping =
    false;

  if (scene.__factionDialoguePanel) {
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

      this.__factionDialoguePanel =
        null;

      installPanel(this);
      installKeyboard(this);
    };

  RunnerScene.prototype
    .advanceFactionDialogue =
    function () {
      if (
        !this.__factionDialogueActive ||
        !this.__factionDialogueLines?.length
      ) {
        return;
      }

      if (
        this.__factionDialogueTyping
      ) {
        const line =
          this.__factionDialogueLines[
            this.__factionDialogueIndex
          ];

        const factionName =
          getFactionForEnemyType(
            this.__factionDialogueTriggerType,
          )?.name ||
          'FACTION';

        setPanelLine(
          this,
          line,
          factionName,
          true,
        );

        return;
      }

      const nextIndex =
        this.__factionDialogueIndex + 1;

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

      updateProgress(this);
    };

  RunnerScene.prototype
    .skipFactionDialogue =
    function () {
      dismissDialogue(
        this,
        true,
      );
    };

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
        this.time?.now || 0;

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

      if (!nearby.length) {
        return result;
      }

      const missionId =
        this.mission?.id ||
        'unknown';

      const factionId =
        nearby[0].factionId;

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
        nearby[0],
      );

      return result;
    };

  const originalShutdown =
    RunnerScene.prototype.shutdown;

  RunnerScene.prototype.shutdown =
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

/* Backward-compatible alias. */
export const installFactionDialogue =
  installEnemyDialogue;

