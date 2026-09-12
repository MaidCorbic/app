import { enemyIntel } from '../enemy-intel.js';

const DISCOVERY_DISTANCE = 150;
const DISCOVERY_COOLDOWN = 700;

const ENEMY_TEXTURES = new Set(Object.keys(enemyIntel));
const BOSS_TEXTURES = new Set(['dino-boss', 'sentinel-boss', 'storm-boss', 'apex-boss']);

function enemyKeyFromObject(object) {
  const key = object?.texture?.key;
  return ENEMY_TEXTURES.has(key) ? key : null;
}

function enemyLevel(scene, key) {
  if (BOSS_TEXTURES.has(key)) return 5;
  const missionIndex = Math.max(0, Number(scene?.mission?.level || scene?.mission?.index || 0));
  return Math.min(4, 1 + Math.floor(missionIndex / 2));
}

function installCardStyles() {
  if (document.getElementById('relay-enemy-discovery-styles')) return;
  const style = document.createElement('style');
  style.id = 'relay-enemy-discovery-styles';
  style.textContent = `
    .relay-enemy-discovery{position:fixed;inset:0;z-index:1200;display:grid;place-items:center;padding:24px;box-sizing:border-box;background:rgba(2,5,13,.34);backdrop-filter:blur(5px);pointer-events:auto}
    .relay-enemy-discovery[hidden]{display:none}
  .relay-enemy-card{
  width:min(430px,calc(100vw - 36px));
  box-sizing:border-box;
  padding:22px;
  border:1px solid rgba(255,208,110,.42);
  border-radius:12px;
  background:linear-gradient(
    145deg,
    rgba(7,10,15,.98),
    rgba(2,3,5,.985)
  );
  box-shadow:
    inset 0 1px rgba(255,255,255,.06),
    0 20px 60px rgba(0,0,0,.48),
    0 0 35px rgba(255,208,110,.12);
  color:#f4f7fb;
  font:500 14px/1.45 system-ui,sans-serif
}
    .relay-enemy-card .eyebrow{margin:0 0 7px;color:#ffd06e;font:700 11px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;text-shadow:0 0 12px rgba(255,208,110,.18);letter-spacing:.16em}
    .relay-enemy-card h2{margin:0 0 14px;font-size:28px;line-height:1.05;letter-spacing:.03em;color:#fff4cf;
text-shadow:0 0 16px rgba(255,208,110,.12)}
    .relay-enemy-card .enemy-level{display:inline-flex;padding:5px 8px;margin-bottom:16px;border:1px solid rgba(255,208,110,.5);color:#ffd06e;font:700 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em}
    .relay-enemy-card dl{display:grid;grid-template-columns:82px 1fr;gap:8px 12px;margin:0}
    .relay-enemy-card dt{color:#caa85a;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
    .relay-enemy-card dd{margin:0;color:#e8edf4}
   .relay-enemy-card button{
  margin-top:18px;
  width:100%;
  min-height:44px;
  border:1px solid rgba(255,208,110,.50);
  border-radius:10px;
  background:linear-gradient(
    145deg,
    rgba(25,19,9,.98),
    rgba(7,6,3,.99)
  );
  color:#ffe7a6;
  box-shadow:
    0 0 18px rgba(255,208,110,.08),
    inset 0 1px rgba(255,255,255,.06);
  font-weight:800;
  letter-spacing:.1em;
}
.relay-enemy-card button:hover,
.relay-enemy-card button:focus-visible{
  border-color:rgba(255,208,110,.78);
  box-shadow:
    0 0 24px rgba(255,208,110,.18),
    inset 0 1px rgba(255,255,255,.08);
  outline:none;
  transform:translateY(-1px);
}
    @media(max-width:700px){.relay-enemy-discovery{padding:14px;align-items:end;padding-bottom:max(18px,env(safe-area-inset-bottom) + 12px)}.relay-enemy-card{width:min(460px,calc(100vw - 28px));padding:18px}.relay-enemy-card h2{font-size:23px}}
  `;
  document.head.appendChild(style);
}

function installEnemyDiscovery(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__enemyDiscoveryV1) return;
  RunnerScene.prototype.__enemyDiscoveryV1 = true;

  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;

  RunnerScene.prototype.create = function (...args) {
    originalCreate.apply(this, args);
    if (!this.player) return;

    installCardStyles();
    this.__enemyDiscoveries = new Set();
    this.__enemyDiscoveryLast = 0;
    this.__enemyDiscoveryCard = null;
    this.__enemyDiscoveryActiveKey = null;

    const card = document.createElement('section');
    card.className = 'relay-enemy-discovery';
    card.hidden = true;
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.innerHTML = `<div class="relay-enemy-card"><p class="eyebrow">ENEMY DISCOVERED</p><h2 data-enemy-name></h2><span class="enemy-level" data-enemy-level></span><dl><dt>Attack</dt><dd data-enemy-attack></dd><dt>Defense</dt><dd data-enemy-defense></dd><dt>Tactic</dt><dd data-enemy-tactic></dd></dl><button type="button" data-enemy-close>CONTINUE</button></div>`;
    document.body.appendChild(card);
    this.__enemyDiscoveryCard = card;

    const close = () => this.dismissEnemyDiscovery();
    card.querySelector('[data-enemy-close]')?.addEventListener('click', close);
    card.addEventListener('click', event => { if (event.target === card) close(); });
  };

  RunnerScene.prototype.dismissEnemyDiscovery = function () {
    if (!this.__enemyDiscoveryCard) return;
    this.__enemyDiscoveryCard.hidden = true;
    this.__enemyDiscoveryActiveKey = null;
    this.infoCard = null;
  };

  // Existing RunnerScene/menu code uses this name for Escape dismissal.
  RunnerScene.prototype.dismissIntelCard = function () {
    if (this.__enemyDiscoveryActiveKey) this.dismissEnemyDiscovery();
  };

  RunnerScene.prototype.showEnemyDiscovery = function (key) {
    const intel = enemyIntel[key];
    const card = this.__enemyDiscoveryCard;
    if (!intel || !card) return;
    card.querySelector('[data-enemy-name]').textContent = intel.name;
    card.querySelector('[data-enemy-level]').textContent = `THREAT LEVEL ${enemyLevel(this, key)}`;
    card.querySelector('[data-enemy-attack]').textContent = intel.attack;
    card.querySelector('[data-enemy-defense]').textContent = intel.defense;
    card.querySelector('[data-enemy-tactic]').textContent = intel.tactic;
    card.hidden = false;
    this.__enemyDiscoveryActiveKey = key;
    this.infoCard = card;
  };

  RunnerScene.prototype.update = function (...args) {
    originalUpdate.apply(this, args);
    if (!this.player?.active || this.finished || this.respawning || this.cinematicActive) return;
    if (this.__enemyDiscoveryActiveKey) return;

    const now = this.time?.now || 0;
    if (now - (this.__enemyDiscoveryLast || 0) < DISCOVERY_COOLDOWN) return;

    const children = this.children?.list || [];
    let nearest = null;
    let nearestDistance = DISCOVERY_DISTANCE;

    for (const object of children) {
      const key = enemyKeyFromObject(object);
      if (!key || !object.active || this.__enemyDiscoveries.has(key)) continue;
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, object.x, object.y);
      if (distance < nearestDistance) {
        nearest = key;
        nearestDistance = distance;
      }
    }

    if (!nearest) return;
    this.__enemyDiscoveries.add(nearest);
    this.__enemyDiscoveryLast = now;
    this.showEnemyDiscovery(nearest);
  };
}

export { installEnemyDiscovery };
