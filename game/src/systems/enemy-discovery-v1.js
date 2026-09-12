
import { enemyIntel } from '../enemy-intel.js';

const DISCOVERY_DISTANCE = 150;
const DISCOVERY_COOLDOWN = 700;

const ENEMY_TEXTURES = new Set(
  Object.keys(enemyIntel),
);

const BOSS_TEXTURES = new Set([
  'dino-boss',
  'sentinel-boss',
  'storm-boss',
  'apex-boss',
]);

function enemyKeyFromObject(object) {
  const key = object?.texture?.key;

  return ENEMY_TEXTURES.has(key)
    ? key
    : null;
}

function enemyLevel(scene, key) {
  if (BOSS_TEXTURES.has(key)) {
    return 5;
  }

  const missionIndex = Math.max(
    0,
    Number(
      scene?.mission?.level ||
      scene?.mission?.index ||
      0,
    ),
  );

  return Math.min(
    4,
    1 + Math.floor(missionIndex / 2),
  );
}

function installCardStyles() {
  if (
    document.getElementById(
      'relay-enemy-discovery-styles',
    )
  ) {
    return;
  }

  const style =
    document.createElement('style');

  style.id =
    'relay-enemy-discovery-styles';

  style.textContent = `
    /* =========================================================
       ENEMY DISCOVERY OVERLAY
       ========================================================= */

    .relay-enemy-discovery {
      position: fixed;
      inset: 0;

      z-index: 1200;

      display: grid;
      place-items: center;

      padding: 24px;

      box-sizing: border-box;

      background:
        radial-gradient(
          circle at center,
          rgba(20, 75, 110, .10),
          transparent 42%
        ),
        rgba(2, 5, 13, .48);

      backdrop-filter: blur(6px);

      pointer-events: auto;

      animation:
        relay-enemy-overlay-in
        160ms ease-out both;
    }

    .relay-enemy-discovery[hidden] {
      display: none !important;
    }

    /* =========================================================
       MAIN CARD
       ========================================================= */

    .relay-enemy-card {
      position: relative;

      width:
        min(
          460px,
          calc(100vw - 32px)
        );

      box-sizing: border-box;

      padding: 24px 24px 22px;

      overflow: hidden;

      border:
        1px solid
        rgba(255, 208, 110, .38);

      border-radius: 14px;

      background:
        radial-gradient(
          circle at 92% 0%,
          rgba(255, 208, 110, .11),
          transparent 34%
        ),
        radial-gradient(
          circle at 0% 100%,
          rgba(57, 185, 255, .07),
          transparent 38%
        ),
        linear-gradient(
          145deg,
          rgba(7, 11, 18, .985),
          rgba(2, 5, 10, .99)
        );

      color: #f4f7fb;

      font:
        500 14px/1.45
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

      box-shadow:
        inset 0 1px 0
          rgba(255,255,255,.065),
        inset 0 -1px 0
          rgba(255,208,110,.04),
        0 24px 70px
          rgba(0,0,0,.58),
        0 0 0 1px
          rgba(255,208,110,.025),
        0 0 38px
          rgba(255,208,110,.10);

      animation:
        relay-enemy-card-in
        220ms cubic-bezier(.22,.61,.36,1)
        both;
    }

    /* Top energy strip */
    .relay-enemy-card::before {
      content: "";

      position: absolute;

      left: 16px;
      right: 16px;
      top: 0;

      height: 1px;

      background:
        linear-gradient(
          90deg,
          transparent,
          rgba(255,208,110,.28),
          rgba(255,208,110,.94),
          rgba(255,208,110,.26),
          transparent
        );

      box-shadow:
        0 0 12px
          rgba(255,208,110,.26);

      pointer-events: none;
    }

    /* Subtle scan texture */
    .relay-enemy-card::after {
      content: "";

      position: absolute;
      inset: 0;

      background:
        repeating-linear-gradient(
          0deg,
          rgba(255,255,255,.011) 0,
          rgba(255,255,255,.011) 1px,
          transparent 1px,
          transparent 4px
        );

      opacity: .35;

      pointer-events: none;
    }

    /* =========================================================
       EYEBROW
       ========================================================= */

    .relay-enemy-card .eyebrow {
      position: relative;
      z-index: 1;

      display: flex;
      align-items: center;

      gap: 8px;

      margin: 0 0 8px;

      color: #ffd06e;

      font:
        900 9px/1.2
        ui-monospace,
        SFMono-Regular,
        Menlo,
        Monaco,
        Consolas,
        monospace;

      letter-spacing: .18em;

      text-transform: uppercase;

      text-shadow:
        0 0 12px
          rgba(255,208,110,.20);
    }

    .relay-enemy-card .eyebrow::before {
      content: "◆";

      color: #ffd06e;

      font-size: 7px;

      text-shadow:
        0 0 9px
          rgba(255,208,110,.55);
    }

    /* =========================================================
       ENEMY NAME
       ========================================================= */

    .relay-enemy-card h2 {
      position: relative;
      z-index: 1;

      margin: 0 0 13px;

      max-width: 100%;

      color: #fff7da;

      font:
        950 clamp(
          25px,
          6vw,
          31px
        )/1.02
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

      letter-spacing: .025em;

      text-transform: uppercase;

      text-wrap: balance;

      text-shadow:
        0 0 16px
          rgba(255,208,110,.10);
    }

    /* =========================================================
       THREAT LEVEL
       ========================================================= */

    .relay-enemy-card .enemy-level {
      position: relative;
      z-index: 1;

      display: inline-flex;

      align-items: center;
      justify-content: center;

      min-height: 25px;

      box-sizing: border-box;

      margin: 0 0 18px;

      padding: 5px 9px;

      border:
        1px solid
        rgba(255,208,110,.44);

      border-radius: 6px;

      background:
        linear-gradient(
          180deg,
          rgba(255,208,110,.09),
          rgba(255,208,110,.025)
        );

      color: #ffd06e;

      font:
        900 8px/1
        ui-monospace,
        SFMono-Regular,
        Menlo,
        Monaco,
        Consolas,
        monospace;

      letter-spacing: .14em;

      text-transform: uppercase;

      box-shadow:
        inset 0 1px 0
          rgba(255,255,255,.045),
        0 0 16px
          rgba(255,208,110,.06);
    }

    /* =========================================================
       INTEL DATA
       ========================================================= */

    .relay-enemy-card dl {
      position: relative;
      z-index: 1;

      display: grid;

      grid-template-columns:
        78px minmax(0, 1fr);

      gap: 11px 14px;

      margin: 0;

      padding: 0;
    }

    .relay-enemy-card dt {
      align-self: start;

      margin: 0;
      padding-top: 1px;

      color:
        rgba(255,208,110,.74);

      font:
        900 8px/1.3
        ui-monospace,
        SFMono-Regular,
        Menlo,
        Monaco,
        Consolas,
        monospace;

      letter-spacing: .11em;

      text-transform: uppercase;
    }

    .relay-enemy-card dd {
      min-width: 0;

      margin: 0;

      color:
        rgba(236,242,248,.90);

      font:
        550 13px/1.48
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

      overflow-wrap: anywhere;
    }

    /* Individual intel rows feel like tactical modules */
    .relay-enemy-card dl dt,
    .relay-enemy-card dl dd {
      border-top:
        1px solid
        rgba(255,255,255,.045);

      padding-top: 10px;
    }

    .relay-enemy-card dl dt:first-of-type,
    .relay-enemy-card dl dd:first-of-type {
      border-top: 0;
      padding-top: 0;
    }

    /* =========================================================
       CONTINUE BUTTON
       ========================================================= */

    .relay-enemy-card button {
      position: relative;
      z-index: 1;

      display: inline-flex;

      align-items: center;
      justify-content: center;

      width: 100%;

      min-height: 46px;

      margin-top: 21px;

      padding: 10px 15px;

      overflow: hidden;

      border:
        1px solid
        rgba(255,208,110,.48);

      border-radius: 9px;

      background:
        linear-gradient(
          180deg,
          rgba(42,31,10,.97),
          rgba(13,9,3,.99)
        );

      color: #ffeab0;

      font:
        900 9px/1
        ui-monospace,
        SFMono-Regular,
        Menlo,
        Monaco,
        Consolas,
        monospace;

      letter-spacing: .15em;

      text-transform: uppercase;

      cursor: pointer;

      box-shadow:
        inset 0 1px 0
          rgba(255,255,255,.065),
        0 6px 18px
          rgba(0,0,0,.28),
        0 0 18px
          rgba(255,208,110,.07);

      transition:
        transform 120ms ease,
        border-color 120ms ease,
        background 120ms ease,
        box-shadow 120ms ease;
    }

    .relay-enemy-card button::before {
      content: "";

      position: absolute;
      inset: 0;

      background:
        linear-gradient(
          105deg,
          transparent 20%,
          rgba(255,255,255,.11) 50%,
          transparent 80%
        );

      transform:
        translateX(-120%);

      pointer-events: none;
    }

    .relay-enemy-card button:hover,
    .relay-enemy-card button:focus-visible {
      border-color:
        rgba(255,208,110,.86);

      background:
        linear-gradient(
          180deg,
          rgba(58,43,14,.99),
          rgba(18,12,4,.99)
        );

      box-shadow:
        inset 0 1px 0
          rgba(255,255,255,.085),
        0 8px 22px
          rgba(0,0,0,.34),
        0 0 25px
          rgba(255,208,110,.16);

      transform:
        translateY(-1px);

      outline: none;
    }

    .relay-enemy-card button:hover::before,
    .relay-enemy-card button:focus-visible::before {
      animation:
        relay-enemy-button-sweep
        600ms ease-out forwards;
    }

    .relay-enemy-card button:active {
      transform:
        translateY(0)
        scale(.985);
    }

    /* =========================================================
       MOBILE
       ========================================================= */

    @media (max-width: 700px) {
      .relay-enemy-discovery {
        align-items: end;

        padding:
          14px;

        padding-bottom:
          max(
            16px,
            env(safe-area-inset-bottom) + 10px
          );
      }

      .relay-enemy-card {
        width:
          calc(100vw - 20px);

        padding:
          18px 17px 17px;

        border-radius: 11px;
      }

      .relay-enemy-card h2 {
        font-size:
          clamp(
            21px,
            8vw,
            27px
          );

        margin-bottom: 11px;
      }

      .relay-enemy-card .enemy-level {
        margin-bottom: 15px;
      }

      .relay-enemy-card dl {
        grid-template-columns:
          68px minmax(0, 1fr);

        gap: 9px 11px;
      }

      .relay-enemy-card dt {
        font-size: 7px;
      }

      .relay-enemy-card dd {
        font-size: 12px;
        line-height: 1.42;
      }

      .relay-enemy-card button {
        min-height: 44px;
        margin-top: 18px;
      }
    }

    @media (max-width: 390px) {
      .relay-enemy-discovery {
        padding-left: 7px;
        padding-right: 7px;
      }

      .relay-enemy-card {
        width:
          calc(100vw - 14px);

        padding:
          15px 14px 14px;
      }

      .relay-enemy-card .eyebrow {
        font-size: 8px;
        letter-spacing: .15em;
      }

      .relay-enemy-card h2 {
        font-size: 20px;
      }

      .relay-enemy-card .enemy-level {
        font-size: 7px;
      }

      .relay-enemy-card dl {
        grid-template-columns:
          62px minmax(0, 1fr);

        gap: 8px 9px;
      }

      .relay-enemy-card dt {
        font-size: 6px;
      }

      .relay-enemy-card dd {
        font-size: 11px;
      }

      .relay-enemy-card button {
        min-height: 42px;
        font-size: 8px;
      }
    }

    /* =========================================================
       ANIMATION
       ========================================================= */

    @keyframes relay-enemy-overlay-in {
      from {
        opacity: 0;
      }

      to {
        opacity: 1;
      }
    }

    @keyframes relay-enemy-card-in {
      from {
        opacity: 0;
        transform:
          translateY(10px)
          scale(.985);
      }

      to {
        opacity: 1;
        transform:
          translateY(0)
          scale(1);
      }
    }

    @keyframes relay-enemy-button-sweep {
      from {
        transform:
          translateX(-120%);
      }

      to {
        transform:
          translateX(120%);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .relay-enemy-discovery,
      .relay-enemy-card {
        animation: none !important;
      }

      .relay-enemy-card button::before {
        animation: none !important;
      }

      .relay-enemy-card button {
        transition: none !important;
      }
    }
  `;

  document.head.appendChild(style);
}

function installEnemyDiscovery(RunnerScene) {
  if (
    !RunnerScene?.prototype ||
    RunnerScene.prototype
      .__enemyDiscoveryV1
  ) {
    return;
  }

  RunnerScene.prototype
    .__enemyDiscoveryV1 = true;

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

      if (!this.player) {
        return;
      }

      installCardStyles();

      this.__enemyDiscoveries =
        new Set();

      this.__enemyDiscoveryLast =
        0;

      this.__enemyDiscoveryCard =
        null;

      this.__enemyDiscoveryActiveKey =
        null;

      const overlay =
        document.createElement('section');

      overlay.className =
        'relay-enemy-discovery';

      overlay.hidden = true;

      overlay.setAttribute(
        'role',
        'dialog',
      );

      overlay.setAttribute(
        'aria-modal',
        'true',
      );

      overlay.setAttribute(
        'aria-label',
        'Enemy discovered',
      );

      overlay.innerHTML = `
        <div class="relay-enemy-card">

          <p class="eyebrow">
            ENEMY DISCOVERED
          </p>

          <h2
            data-enemy-name
          ></h2>

          <span
            class="enemy-level"
            data-enemy-level
          ></span>

          <dl>
            <dt>Attack</dt>
            <dd data-enemy-attack></dd>

            <dt>Defense</dt>
            <dd data-enemy-defense></dd>

            <dt>Tactic</dt>
            <dd data-enemy-tactic></dd>
          </dl>

          <button
            type="button"
            data-enemy-close
            aria-label="Continue"
          >
            CONTINUE
          </button>

        </div>
      `;

      document.body.appendChild(
        overlay,
      );

      this.__enemyDiscoveryCard =
        overlay;

      const close = () =>
        this.dismissEnemyDiscovery();

      overlay
        .querySelector(
          '[data-enemy-close]',
        )
        ?.addEventListener(
          'click',
          close,
        );

      overlay.addEventListener(
        'click',
        (event) => {
          if (
            event.target === overlay
          ) {
            close();
          }
        },
      );

      overlay.addEventListener(
        'keydown',
        (event) => {
          if (
            event.key === 'Escape' ||
            event.code === 'Escape'
          ) {
            event.preventDefault();
            close();
          }
        },
      );
    };

  RunnerScene.prototype
    .dismissEnemyDiscovery =
    function () {
      const overlay =
        this.__enemyDiscoveryCard;

      if (!overlay) {
        return;
      }

      overlay.hidden = true;

      this.__enemyDiscoveryActiveKey =
        null;

      this.infoCard = null;
    };

  /*
   * Existing RunnerScene/menu code
   * uses this name for Escape dismissal.
   */
  RunnerScene.prototype
    .dismissIntelCard =
    function () {
      if (
        this.__enemyDiscoveryActiveKey
      ) {
        this.dismissEnemyDiscovery();
      }
    };

  RunnerScene.prototype
    .showEnemyDiscovery =
    function (key) {
      const intel =
        enemyIntel[key];

      const overlay =
        this.__enemyDiscoveryCard;

      if (
        !intel ||
        !overlay
      ) {
        return;
      }

      const name =
        overlay.querySelector(
          '[data-enemy-name]',
        );

      const level =
        overlay.querySelector(
          '[data-enemy-level]',
        );

      const attack =
        overlay.querySelector(
          '[data-enemy-attack]',
        );

      const defense =
        overlay.querySelector(
          '[data-enemy-defense]',
        );

      const tactic =
        overlay.querySelector(
          '[data-enemy-tactic]',
        );

      if (
        !name ||
        !level ||
        !attack ||
        !defense ||
        !tactic
      ) {
        return;
      }

      name.textContent =
        intel.name || 'UNKNOWN';

      level.textContent =
        `THREAT LEVEL ${enemyLevel(
          this,
          key,
        )}`;

      attack.textContent =
        intel.attack ||
        'Unknown hostile attack.';

      defense.textContent =
        intel.defense ||
        'Unknown defensive profile.';

      tactic.textContent =
        intel.tactic ||
        'Avoid direct engagement.';

      overlay.hidden = false;

      this.__enemyDiscoveryActiveKey =
        key;

      this.infoCard =
        overlay;

      window.requestAnimationFrame(
        () => {
          overlay
            .querySelector(
              '[data-enemy-close]',
            )
            ?.focus({
              preventScroll: true,
            });
        },
      );
    };

  RunnerScene.prototype.update =
    function (...args) {
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
        return;
      }

      if (
        this.__enemyDiscoveryActiveKey
      ) {
        return;
      }

      const now =
        this.time?.now || 0;

      if (
        now -
          (
            this.__enemyDiscoveryLast ||
            0
          ) <
        DISCOVERY_COOLDOWN
      ) {
        return;
      }

      const children =
        this.children?.list || [];

      let nearest = null;

      let nearestDistance =
        DISCOVERY_DISTANCE;

      for (
        const object of children
      ) {
        const key =
          enemyKeyFromObject(
            object,
          );

        if (
          !key ||
          !object?.active ||
          this.__enemyDiscoveries.has(
            key,
          )
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
            this.player.x,
            this.player.y,
            object.x,
            object.y,
          );

        if (
          !Number.isFinite(distance)
        ) {
          continue;
        }

        if (
          distance <
          nearestDistance
        ) {
          nearest = key;
          nearestDistance =
            distance;
        }
      }

      if (!nearest) {
        return;
      }

      this.__enemyDiscoveries.add(
        nearest,
      );

      this.__enemyDiscoveryLast =
        now;

      this.showEnemyDiscovery(
        nearest,
      );
    };
}

export {
  installEnemyDiscovery,
};

