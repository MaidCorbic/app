import { enemyIntel } from '../enemy-intel.js';

const DIALOGUE_DISTANCE = 115;
const DIALOGUE_COOLDOWN = 900;
const LINES = {
  'enemy-runner': [['SCOUT RUNNER', 'You should not be here.'], ['SCOUT RUNNER', 'Keep moving. I will catch you.']],
  chicken: [['EGG HAZARD', 'Cluck. This route is mine.'], ['EGG HAZARD', 'You picked the wrong shortcut.']],
  dino: [['ROOFTOP DINO', 'Back away from my lane.'], ['ROOFTOP DINO', 'I saw you coming.']],
  invader: [['SKY INVADER', 'Target acquired.'], ['SKY INVADER', 'The sky belongs to us.']],
  'alien-ground': [['GROUND ALIEN', 'Turn around while you can.'], ['GROUND ALIEN', 'This sector is restricted.']],
  'dino-boss': [['ALPHA DINO', 'You reached the relay. Now prove you belong here.']],
  'sentinel-boss': [['GRID WARDEN', 'Unauthorized access detected.']],
  'storm-boss': [['STORM TITAN', 'The storm has already begun.']],
  'apex-boss': [['APEX OVERSEER', 'This is the final relay. There is nowhere left to run.']],
};

function enemyKey(object) {
  const key = object?.texture?.key;
  return Object.prototype.hasOwnProperty.call(enemyIntel, key) ? key : null;
}

function installStyles() {
  if (document.getElementById('relay-enemy-dialogue-styles')) return;
  const style = document.createElement('style');
  style.id = 'relay-enemy-dialogue-styles';
  style.textContent = `.relay-enemy-dialogue{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:1210;width:min(520px,calc(100vw - 28px));padding:16px 18px;box-sizing:border-box;border:1px solid rgba(141,244,255,.58);background:linear-gradient(145deg,rgba(5,14,26,.98),rgba(12,29,47,.98));box-shadow:0 0 28px rgba(25,200,245,.16),0 14px 40px rgba(0,0,0,.45);color:#edf7ff;font:500 14px/1.45 system-ui,sans-serif}.relay-enemy-dialogue[hidden]{display:none}.relay-enemy-dialogue .speaker{margin:0 0 6px;color:#8df4ff;font:800 11px/1.1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em}.relay-enemy-dialogue .text{margin:0;color:#fff;font-size:16px}.relay-enemy-dialogue button{margin-top:12px;width:100%;min-height:40px;border:1px solid rgba(141,244,255,.5);background:#0b2135;color:#eafcff;font-weight:800;letter-spacing:.1em}@media(max-width:700px){.relay-enemy-dialogue{bottom:max(14px,env(safe-area-inset-bottom) + 8px);padding:14px}.relay-enemy-dialogue .text{font-size:15px}}`;
  document.head.appendChild(style);
}

function installEnemyDialogue(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__enemyDialogueV1) return;
  RunnerScene.prototype.__enemyDialogueV1 = true;
  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;

  RunnerScene.prototype.create = function (...args) {
    originalCreate.apply(this, args);
    installStyles();
    this.__enemyDialogueLast = 0;
    this.__enemyDialogueActive = false;
    this.__enemyDialogueSeen = new Set();
    const panel = document.createElement('section');
    panel.className = 'relay-enemy-dialogue';
    panel.hidden = true;
    panel.setAttribute('role', 'status');
    panel.innerHTML = '<p class="speaker" data-dialogue-speaker></p><p class="text" data-dialogue-text></p><button type="button" data-dialogue-close>CONTINUE</button>';
    document.body.appendChild(panel);
    this.__enemyDialoguePanel = panel;
    panel.querySelector('[data-dialogue-close]')?.addEventListener('click', () => this.dismissEnemyDialogue());
  };

  RunnerScene.prototype.dismissEnemyDialogue = function () {
    if (!this.__enemyDialoguePanel) return;
    this.__enemyDialoguePanel.hidden = true;
    this.__enemyDialogueActive = false;
  };

  RunnerScene.prototype.showEnemyDialogue = function (key) {
    const lines = LINES[key];
    const intel = enemyIntel[key];
    if (!lines?.length || !intel || !this.__enemyDialoguePanel) return;
    const line = lines[this.__enemyDialogueSeen.size % lines.length];
    this.__enemyDialoguePanel.querySelector('[data-dialogue-speaker]').textContent = line[0];
    this.__enemyDialoguePanel.querySelector('[data-dialogue-text]').textContent = line[1];
    this.__enemyDialoguePanel.hidden = false;
    this.__enemyDialogueActive = true;
    this.__enemyDialogueSeen.add(key);
  };

  RunnerScene.prototype.update = function (...args) {
    originalUpdate.apply(this, args);
    if (!this.player?.active || this.finished || this.respawning || this.cinematicActive || this.__enemyDialogueActive) return;
    const now = this.time?.now || 0;
    if (now - (this.__enemyDialogueLast || 0) < DIALOGUE_COOLDOWN) return;
    for (const object of this.children?.list || []) {
      const key = enemyKey(object);
      if (!key || !object.active || this.__enemyDialogueSeen.has(key)) continue;
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, object.x, object.y) <= DIALOGUE_DISTANCE) {
        this.__enemyDialogueLast = now;
        this.showEnemyDialogue(key);
        break;
      }
    }
  };
}

export { installEnemyDialogue };
