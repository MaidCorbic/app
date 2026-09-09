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
  const key = object?.getData?.('route')?.type || object?.texture?.key;
  return Object.prototype.hasOwnProperty.call(enemyIntel, key)
    ? key
    : null;
}

function speakerName(enemyType) {
  return enemyIntel[enemyType]?.name || String(enemyType).toUpperCase();
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

    if (BOSS_TYPES.has(enemyType) && object.getData?.('defeated')) {
      continue;
    }

    if (!Number.isFinite(object.x) || !Number.isFinite(object.y)) {
      continue;
    }

    const distance = Phaser.Math.Distance.Between(
      player.x,
      player.y,
      object.x,
      object.y,
    );

    if (distance > DIALOGUE_TRIGGER_DISTANCE) continue;

    const id = object.getData?.('factionDialogueId');
    const stableId = id || `${enemyType}:${Math.round(object.x)}:${Math.round(object.y)}`;

    if (seen.has(stableId)) continue;
    seen.add(stableId);

    nearby.push({
      object,
      enemyType,
      factionId: getFactionIdForEnemyType(enemyType),
      distance,
    });
  }

  nearby.sort((a, b) => a.distance - b.distance);

  return nearby;
}

function getDialogueLines(scene, primary, nearby) {
  const missionId = scene?.mission?.id;
  const factionId =
    primary?.factionId ||
    getFactionIdForEnemyType(primary?.enemyType);

  const missionLines =
    MISSION_DIALOGUE[missionId]?.[factionId];

  if (missionLines?.length) {
    return missionLines.map(([enemyType, text]) => ({
      speakerType: enemyType,
      speaker: speakerName(enemyType),
      text,
    }));
  }

  const fallback = FALLBACK_DIALOGUE[factionId];

  if (fallback?.length) {
    const availableTypes = [
      ...new Set(
        [
          primary?.enemyType,
          ...nearby.map((entry) => entry.enemyType),
        ].filter(Boolean),
      ),
    ];

    return fallback.map(([enemyType, text], index) => ({
      speakerType:
        availableTypes[index % Math.max(1, availableTypes.length)] ||
        enemyType,
      speaker:
        speakerName(
          availableTypes[index % Math.max(1, availableTypes.length)] ||
            enemyType,
        ),
      text,
    }));
  }

  const faction = getFactionForEnemyType(primary?.enemyType);

  return [
    {
      speakerType: primary?.enemyType,
      speaker: speakerName(primary?.enemyType),
      text: `${faction?.name || 'HOSTILE'} contact detected.`,
    },
  ];
}

function installStyles() {
  if (document.getElementById('relay-faction-dialogue-styles')) return;

  const style = document.createElement('style');
  style.id = 'relay-faction-dialogue-styles';

  style.textContent = `
    .relay-faction-dialogue{
      position:fixed;
      left:50%;
      bottom:max(24px,env(safe-area-inset-bottom) + 14px);
      transform:translateX(-50%);
      z-index:1190;
      width:min(620px,calc(100vw - 28px));
      box-sizing:border-box;
      padding:16px 18px 14px;
      border:1px solid rgba(141,244,255,.48);
      border-radius:12px;
      background:linear-gradient(145deg,rgba(4,10,20,.985),rgba(10,24,39,.985));
      box-shadow:
        inset 0 1px rgba(255,255,255,.06),
        0 18px 50px rgba(0,0,0,.48),
        0 0 28px rgba(25,200,245,.12);
      color:#edf7ff;
      font:500 14px/1.45 system-ui,sans-serif;
      pointer-events:auto;
    }

    .relay-faction-dialogue[hidden]{
      display:none;
    }

    .relay-faction-dialogue .relay-faction-kicker{
      margin:0 0 5px;
      color:#8df4ff;
      font:800 10px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;
      letter-spacing:.16em;
      text-transform:uppercase;
    }

    .relay-faction-dialogue .relay-faction-name{
      margin:0 0 9px;
      color:#ffd06e;
      font:800 11px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;
      letter-spacing:.12em;
      text-transform:uppercase;
    }

    .relay-faction-dialogue .relay-faction-text{
      min-height:44px;
      margin:0;
      color:#ffffff;
      font-size:16px;
      line-height:1.48;
    }

    .relay-faction-dialogue .relay-faction-footer{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      margin-top:12px;
    }

    .relay-faction-dialogue .relay-faction-hint{
      margin:0;
      color:rgba(224,238,248,.68);
      font:700 10px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;
      letter-spacing:.1em;
      text-transform:uppercase;
    }

    .relay-faction-dialogue button{
      min-width:112px;
      min-height:40px;
      padding:8px 13px;
      border:1px solid rgba(141,244,255,.52);
      border-radius:8px;
      background:linear-gradient(145deg,#0d2940,#081521);
      color:#e9fcff;
      font:800 11px/1.1 ui-monospace,SFMono-Regular,Menlo,monospace;
      letter-spacing:.1em;
      cursor:pointer;
    }

    .relay-faction-dialogue button:hover,
    .relay-faction-dialogue button:focus-visible{
      border-color:rgba(141,244,255,.85);
      box-shadow:0 0 18px rgba(141,244,255,.16);
      outline:none;
    }

    @media(max-width:700px){
      .relay-faction-dialogue{
        bottom:max(14px,env(safe-area-inset-bottom) + 8px);
        padding:14px;
      }

      .relay-faction-dialogue .relay-faction-text{
        font-size:15px;
        min-height:50px;
      }

      .relay-faction-dialogue .relay-faction-footer{
        align-items:stretch;
        flex-direction:column;
        gap:8px;
      }

      .relay-faction-dialogue button{
        width:100%;
      }
    }

    @media(prefers-reduced-motion:reduce){
      .relay-faction-dialogue{
        scroll-behavior:auto;
      }
    }
  `;

  document.head.appendChild(style);
}

function installKeyboard(scene) {
  if (scene.__factionDialogueKeyboardInstalled) return;

  scene.__factionDialogueKeyboardInstalled = true;

  scene.__factionDialogueKeyHandler = (event) => {
    if (!scene.__factionDialogueActive) return;

    if (event.key === 'Enter' || event.code === 'Enter') {
      event.preventDefault();
      event.stopImmediatePropagation();
      scene.advanceFactionDialogue?.();
      return;
    }

    if (event.key === 'Escape' || event.code === 'Escape') {
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

  scene.__factionDialogueKeyboardInstalled = false;
  scene.__factionDialogueKeyHandler = null;
}

function cleanupDialoguePanel(scene) {
  const panel = scene?.__factionDialoguePanel;

  if (!panel) return;

  panel.remove();
  scene.__factionDialoguePanel = null;
}

function installPanel(scene) {
  installStyles();

  cleanupDialoguePanel(scene);

  const panel = document.createElement('section');

  panel.className = 'relay-faction-dialogue';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-live', 'polite');

  panel.innerHTML = `
    <p class="relay-faction-kicker">FACTION ENCOUNTER</p>
    <p class="relay-faction-name" data-faction-name></p>
    <p class="relay-faction-text" data-faction-text></p>

    <div class="relay-faction-footer">
      <p class="relay-faction-hint" data-faction-hint>
        ENTER · NEXT &nbsp;&nbsp; ESC · SKIP
      </p>

      <button type="button" data-faction-next>
        NEXT
      </button>
    </div>
  `;

  document.body.appendChild(panel);

  scene.__factionDialoguePanel = panel;

  panel
    .querySelector('[data-faction-next]')
    ?.addEventListener(
      'click',
      (event) => {
        event.preventDefault();
        scene.advanceFactionDialogue?.();
      },
    );
}

function setPanelLine(scene, line, factionName, instant = false) {
  const panel = scene.__factionDialoguePanel;
  if (!panel) return;

  const speakerElement =
    panel.querySelector('[data-faction-name]');

  const textElement =
    panel.querySelector('[data-faction-text]');

  const nextButton =
    panel.querySelector('[data-faction-next]');

  if (!speakerElement || !textElement) return;

  speakerElement.textContent =
    `${line.speaker} · ${factionName}`;

  if (scene.__factionDialogueTypeTimer) {
    window.clearInterval(
      scene.__factionDialogueTypeTimer,
    );
    scene.__factionDialogueTypeTimer = null;
  }

  scene.__factionDialogueTyping = !instant;

  if (instant) {
    textElement.textContent = line.text;
    scene.__factionDialogueTyping = false;
  } else {
    textElement.textContent = '';

    let index = 0;

    scene.__factionDialogueTypeTimer =
      window.setInterval(() => {
        index += 1;
        textElement.textContent =
          line.text.slice(0, index);

        if (index >= line.text.length) {
          window.clearInterval(
            scene.__factionDialogueTypeTimer,
          );

          scene.__factionDialogueTypeTimer = null;
          scene.__factionDialogueTyping = false;
        }
      }, TYPE_SPEED_MS);
  }

  if (nextButton) {
    nextButton.textContent = 'NEXT';
  }
}

function showDialogue(scene, trigger) {
  if (scene.__factionDialogueActive) return false;

  const nearby =
    getNearbyEnemies(scene);

  if (!nearby.length) return false;

  const primary =
    trigger ||
    nearby[0];

  const faction =
    getFactionForEnemyType(
      primary.enemyType,
    );

  if (!faction) return false;

  const lines =
    getDialogueLines(
      scene,
      primary,
      nearby.slice(
        0,
        MAX_NEARBY_SPEAKERS,
      ),
    );

  if (!lines.length) return false;

  scene.__factionDialogueActive = true;
  scene.__factionDialogueLines = lines;
  scene.__factionDialogueIndex = 0;
  scene.__factionDialogueTriggerType =
    primary.enemyType;
  scene.__factionDialogueFactionId =
    faction.id;
  scene.__factionDialogueLast =
    scene.time?.now || 0;

  const seen =
    scene.__factionDialogueSeen ||
    new Set();

  scene.__factionDialogueSeen = seen;
  seen.add(
    `${scene.mission?.id || 'unknown'}:${faction.id}`,
  );

  // Freeze the Arcade physics world while the dialogue is shown.
  // RunnerScene.update itself also stops below, so gameplay resumes
  // exactly from the same position when the encounter ends.
  if (scene.physics?.world) {
    scene.__factionDialoguePhysicsPaused =
      Boolean(scene.physics.world.isPaused);
    scene.physics.world.isPaused = true;
  }

  const line =
    scene.__factionDialogueLines[0];

  setPanelLine(
    scene,
    line,
    faction.name,
  );

  if (scene.__factionDialoguePanel) {
    scene.__factionDialoguePanel.hidden = false;
  }

  return true;
}

function dismissDialogue(scene, skipAll = false) {
  if (!scene.__factionDialogueActive) return;

  if (scene.__factionDialogueTypeTimer) {
    window.clearInterval(
      scene.__factionDialogueTypeTimer,
    );

    scene.__factionDialogueTypeTimer = null;
  }

  scene.__factionDialogueTyping = false;

  if (scene.__factionDialoguePanel) {
    scene.__factionDialoguePanel.hidden =
      true;
  }

  scene.__factionDialogueActive = false;
  scene.__factionDialogueLines = [];
  scene.__factionDialogueIndex = 0;

  if (skipAll) {
    scene.__factionDialogueSkipped = true;
  }

  if (scene.physics?.world) {
    scene.physics.world.isPaused =
      Boolean(
        scene.__factionDialoguePhysicsPaused,
      );
  }

  scene.__factionDialoguePhysicsPaused = false;
}

export function installEnemyDialogue(RunnerScene) {
  if (
    !RunnerScene?.prototype ||
    RunnerScene.prototype.__factionEnemyDialogueV2
  ) {
    return;
  }

  RunnerScene.prototype.__factionEnemyDialogueV2 = true;

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

      this.__factionDialogueLast = 0;
      this.__factionDialogueActive = false;
      this.__factionDialogueLines = [];
      this.__factionDialogueIndex = 0;
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

      installPanel(this);
      installKeyboard(this);
    };

  RunnerScene.prototype.advanceFactionDialogue =
    function () {
      if (
        !this.__factionDialogueActive ||
        !this.__factionDialogueLines?.length
      ) {
        return;
      }

      if (this.__factionDialogueTyping) {
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
    };

  RunnerScene.prototype.skipFactionDialogue =
    function () {
      dismissDialogue(
        this,
        true,
      );
    };

  RunnerScene.prototype.update =
    function (...args) {
      // While the faction conversation is open, keep RunnerScene frozen.
      if (this.__factionDialogueActive) {
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

// Backward-compatible alias for any future system using the faction-specific name.
export const installFactionDialogue =
  installEnemyDialogue;
