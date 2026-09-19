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
  .relay-enemy-discovery{
    position:fixed;
    inset:0;
    z-index:1200;

    display:grid;
    place-items:center;

    padding:24px;
    box-sizing:border-box;

    background:
      radial-gradient(
        circle at 50% 45%,
        rgba(15,55,78,.20),
        rgba(1,5,10,.82) 58%,
        rgba(0,2,6,.94) 100%
      );

    backdrop-filter:
      blur(9px)
      saturate(125%);

    -webkit-backdrop-filter:
      blur(9px)
      saturate(125%);

    pointer-events:auto;
  }

  .relay-enemy-discovery[hidden]{
    display:none;
  }


  .relay-enemy-card{
    position:relative;

    width:min(470px,calc(100vw - 40px));

    box-sizing:border-box;

    padding:26px 28px 24px;

    overflow:hidden;

    border:
      1px solid
      rgba(96,214,255,.34);

    border-left:
      3px solid
      #38d9ff;

    border-radius:4px;

    background:
      linear-gradient(
        145deg,
        rgba(5,13,22,.985),
        rgba(7,18,30,.985) 48%,
        rgba(2,7,14,.995)
      );

    box-shadow:
      inset 0 1px 0
        rgba(255,255,255,.07),

      inset 0 0 45px
        rgba(56,189,248,.025),

      0 30px 80px
        rgba(0,0,0,.72),

      0 0 35px
        rgba(56,189,248,.10);

    color:#eaf8ff;

    font:
      500 14px/1.45
      "DM Mono",
      monospace;

    clip-path:
      polygon(
        0 0,
        calc(100% - 18px) 0,
        100% 18px,
        100% 100%,
        18px 100%,
        0 calc(100% - 18px)
      );

    isolation:isolate;
  }


  /* TOP SCAN LINE */

  .relay-enemy-card::before{
    content:"";

    position:absolute;

    top:0;
    left:0;
    right:0;

    height:2px;

    background:
      linear-gradient(
        90deg,
        transparent,
        rgba(56,189,248,.55),
        #8eeaff,
        rgba(56,189,248,.55),
        transparent
      );

    box-shadow:
      0 0 10px
        rgba(56,189,248,.45);

    pointer-events:none;
  }


  /* TECH GRID */

  .relay-enemy-card::after{
    content:"";

    position:absolute;
    inset:0;

    background:
      linear-gradient(
        90deg,
        rgba(56,189,248,.035) 1px,
        transparent 1px
      ),
      linear-gradient(
        rgba(56,189,248,.035) 1px,
        transparent 1px
      );

    background-size:22px 22px;

    opacity:.38;

    pointer-events:none;
    z-index:0;
  }


  .relay-enemy-card > *{
    position:relative;
    z-index:2;
  }


  /* HEADER */

  .relay-enemy-card .eyebrow{
    margin:0 0 10px;

    color:
      rgba(125,211,252,.78);

    font:
      700 9px/1
      "Orbitron",
      sans-serif;

    letter-spacing:.24em;

    text-transform:uppercase;

    text-shadow:
      0 0 12px
        rgba(56,189,248,.22);
  }


  /* ENEMY NAME */

  .relay-enemy-card h2{
    margin:0 0 16px;

    color:#f4fbff;

    font:
      800 28px/1.08
      "Orbitron",
      sans-serif;

    letter-spacing:.055em;

    text-transform:uppercase;

    text-shadow:
      0 0 16px
        rgba(56,189,248,.12);
  }


  /* THREAT LEVEL */

  .relay-enemy-card .enemy-level{
    display:inline-flex;
    align-items:center;

    min-height:24px;

    box-sizing:border-box;

    padding:5px 9px;

    margin-bottom:20px;

    border:
      1px solid
      rgba(56,189,248,.32);

    border-radius:2px;

    background:
      rgba(56,189,248,.045);

    color:#7dd3fc;

    font:
      700 8px/1
      "Orbitron",
      sans-serif;

    letter-spacing:.14em;

    text-transform:uppercase;

    box-shadow:
      inset 0 0 12px
        rgba(56,189,248,.035);
  }


  /* STATS */

  .relay-enemy-card dl{
    display:grid;

    grid-template-columns:
      1fr 1fr;

    gap:1px;

    margin:0 0 22px;

    padding:1px;

    background:
      rgba(56,189,248,.10);
  }


  .relay-enemy-card dt,
  .relay-enemy-card dd{
    margin:0;

    padding:9px 11px;

    box-sizing:border-box;

    background:
      rgba(3,9,16,.94);
  }


 .relay-enemy-card dt{
  color:
    rgba(160,184,198,.78);

  font:
    700 10px/1
    "Orbitron",
    sans-serif;

  letter-spacing:.14em;
  text-transform:uppercase;
}

  .relay-enemy-card dd{
  color:#eaf8ff;

  font:
    700 11px/1.2
    "Orbitron",
    sans-serif;

  letter-spacing:.08em;

  text-transform:uppercase;
text-align:center;
  text-shadow:
    0 0 8px
    rgba(56,189,248,.10);
}

/* ABILITIES */

.relay-enemy-card .enemy-abilities{
  margin:0 0 22px;
  padding:0;
}

.relay-enemy-card .enemy-abilities > p{
  margin:0 0 9px;

  color:
    rgba(125,211,252,.78);

  font:
    700 9px/1
    "Orbitron",
    sans-serif;

  letter-spacing:.22em;

  text-transform:uppercase;

  text-shadow:
    0 0 10px
    rgba(56,189,248,.18);
}

.relay-enemy-card .enemy-abilities > div{
  display:grid;
  gap:4px;
}

.relay-enemy-card .enemy-ability{
  box-sizing:border-box;

  min-height:30px;

  padding:8px 11px;

  border-left:
    2px solid
    rgba(56,189,248,.42);

  background:
    linear-gradient(
      90deg,
      rgba(56,189,248,.075),
      rgba(56,189,248,.018)
    );

  color:#dff8ff;

  font:
    700 9px/1.2
    "Orbitron",
    sans-serif;

  letter-spacing:.10em;

  text-transform:uppercase;

  text-shadow:
    0 0 8px
    rgba(56,189,248,.10);

  transition:
    border-color .18s ease,
    background .18s ease,
    transform .18s ease;
}

.relay-enemy-card .enemy-ability:hover{
  border-left-color:#7dd3fc;

  background:
    linear-gradient(
      90deg,
      rgba(56,189,248,.13),
      rgba(56,189,248,.035)
    );

  transform:translateX(2px);
}

  /* CONTINUE */

  .relay-enemy-card button{
    margin-top:0;

    width:100%;
    min-height:44px;

    box-sizing:border-box;

    border:
      1px solid
      rgba(56,189,248,.42);

    border-radius:2px;

    background:
      linear-gradient(
        135deg,
        rgba(56,189,248,.11),
        rgba(56,189,248,.025)
      );

    color:#dff8ff;

    font:
      700 9px/1
      "Orbitron",
      sans-serif;

    letter-spacing:.20em;

    text-transform:uppercase;

    cursor:pointer;

    box-shadow:
      inset 0 0 16px
        rgba(56,189,248,.025),

      0 0 18px
        rgba(56,189,248,.045);

    transition:
      border-color .18s ease,
      background .18s ease,
      box-shadow .18s ease,
      transform .18s ease;
  }


  .relay-enemy-card button:hover,
  .relay-enemy-card button:focus-visible{
    border-color:
      rgba(125,211,252,.85);

    background:
      linear-gradient(
        135deg,
        rgba(56,189,248,.18),
        rgba(56,189,248,.055)
      );

    box-shadow:
      0 0 24px
        rgba(56,189,248,.12),

      inset 0 0 18px
        rgba(56,189,248,.04);

    outline:none;

    transform:translateY(-1px);
  }


  .relay-enemy-card button:active{
    transform:translateY(0);
  }


  @media(max-width:700px){

  .relay-enemy-card .enemy-abilities{
  margin-bottom:18px;
}

.relay-enemy-card .enemy-ability{
  min-height:28px;
  padding:7px 9px;
  font-size:8px;
}

    .relay-enemy-discovery{
      padding:14px;

      align-items:end;

      padding-bottom:
        max(
          18px,
          calc(
            env(safe-area-inset-bottom) + 12px
          )
        );
    }

    .relay-enemy-card{
      width:min(
        390px,
        calc(100vw - 28px)
      );

      min-height:0;

      padding:20px 18px 18px;
    }

    .relay-enemy-card h2{
      font-size:21px;
      line-height:1.1;
    }

    .relay-enemy-card .eyebrow{
      font-size:7px;
      letter-spacing:.18em;
    }

    .relay-enemy-card dl{
      grid-template-columns:1fr;
    }

    .relay-enemy-card button{
      min-height:42px;
    }
  }
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
card.innerHTML = `
  <div class="relay-enemy-card">
    <p class="eyebrow">ENEMY DISCOVERED</p>

    <h2 data-enemy-name></h2>

    <span class="enemy-level" data-enemy-level></span>

    <dl>
      <dt>Attack</dt>
      <dd data-enemy-attack></dd>

      <dt>Defense</dt>
      <dd data-enemy-defense></dd>

      <dt>Tactic</dt>
      <dd data-enemy-tactic></dd>
    </dl>

    <div class="enemy-abilities">
      <p>ABILITIES</p>
      <div data-enemy-abilities></div>
    </div>

    <button type="button" data-enemy-close>CONTINUE</button>
  </div>
`;
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
  const typeRight = (element, value, delay = 32) => {
  if (!element) return;

  const text = String(value ?? '');
  let index = 0;

  element.textContent = '';

  const timer = window.setInterval(() => {
    element.textContent = text.slice(0, index + 1);
    index += 1;

    if (index >= text.length) {
      window.clearInterval(timer);
    }
  }, delay);
};

typeRight(
  card.querySelector('[data-enemy-attack]'),
  intel.attack
);

typeRight(
  card.querySelector('[data-enemy-defense]'),
  intel.defense
);

const abilities = card.querySelector('[data-enemy-abilities]');

if (abilities) {
  abilities.innerHTML = '';

  (intel.abilities || []).forEach((ability, index) => {
    const item = document.createElement('div');
    item.className = 'enemy-ability';
    item.textContent = `${String(index + 1).padStart(2, '0')} // ${ability}`;
    abilities.appendChild(item);
  });
}

typeRight(
  card.querySelector('[data-enemy-tactic]'),
  intel.tactic
);
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
