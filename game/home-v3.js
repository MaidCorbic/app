/*
 * Runner Relay — Home V4 presentation owner.
 *
 * Contract:
 * - Home owns presentation only.
 * - #start / #continue remain the authoritative gameplay entry points.
 * - Options / FAQ / Update remain owned by existing systems.
 * - The intro surface is rebuilt once, without duplicating gameplay UI.
 */
(() => {
  'use strict';


  if (window.__relayHomeV4) return;
  window.__relayHomeV4 = true;

   const $ = id => document.getElementById(id);
  let homeProfileStateAPI = null;

  const syncHomeProfile = async () => {
    try {
       const {
        loadState,
        getCourierRank,
        getLevelProgress
      } = homeProfileStateAPI || await import('./src/state.js');

      homeProfileStateAPI = {
        loadState,
        getCourierRank,
        getLevelProgress
      };

      const state = loadState();

   const xp = Number(state.xp) || 0;
const signals = Number(state.signals) || 0;
const totalRuns = Number(state.totalRuns) || 0;
const bestRun = Number(state.bestRun) || 0;

const lastRunTime =
        state.lastRun?.time ??
        state.lastRunTime ??
        state.lastMissionTime ??
        null;

      const lastRunSignals =
        state.lastRun?.signals ??
        state.lastMissionProgress?.signals ??
        null;

      const lastRunScore =
        state.lastRun?.score ??
        state.lastScore ??
        null;

      const lastRunRating =
        state.lastRun?.rating ??
        state.lastRating ??
        null;

      const level = getLevelProgress(xp);
      const rank = getCourierRank(xp);

      const xpIntoLevel = Math.max(
        0,
        xp - Number(level.current || 0)
      );

      const xpNeeded = Math.max(
        1,
        Number(level.next || 100) -
        Number(level.current || 0)
      );

      const xpProgress = Math.max(
        0,
        Math.min(
          100,
          Math.round(
            (Number(level.progress) || 0) * 100
          )
        )
      );

      const rankEl = $('homeV4Rank');
      const levelEl = $('homeV4Level');
      const xpTextEl = $('homeV4XpText');
      const xpFillEl = $('homeV4XpFill');
      const bestRunEl = $('homeV4BestRun');
      const runsEl = $('homeV4Runs');
      const signalsEl = $('homeV4Signals');
      const missionXpEl = $('homeV4MissionXp');
      const bestRatingEl = $('homeV4BestRating');
      const signalValueEl = $('homeV4SignalValue');
      const signalFillEl = $('homeV4SignalFill');
            const lastRunFeedEl = $('homeV5LastRunFeed');
      const runTimeEl = $('homeV5RunTime');
      const runSignalsEl = $('homeV5RunSignals');
      const runScoreEl = $('homeV5RunScore');
      const runRatingEl = $('homeV5RunRating');

    if (lastRunFeedEl) {
  lastRunFeedEl.textContent =
    totalRuns > 0
      ? 'LAST RUN // RECORDED'
      : 'LAST RUN // READY';
}

      if (runTimeEl) {
        runTimeEl.textContent =
          lastRunTime != null
            ? String(lastRunTime)
            : '—';
      }

      if (runSignalsEl) {
        runSignalsEl.textContent =
          lastRunSignals != null
            ? String(lastRunSignals)
            : '—';
      }

      if (runScoreEl) {
        runScoreEl.textContent =
          lastRunScore != null
            ? Number(lastRunScore).toLocaleString()
            : '—';
      }

      if (runRatingEl) {
        runRatingEl.textContent =
          lastRunRating != null && Number(lastRunRating) > 0
            ? '★'.repeat(Math.min(3, Number(lastRunRating)))
            : '—';
      }

      if (rankEl) {
        rankEl.textContent =
          rank?.name || state.rank || 'ROOKIE';
      }

      if (levelEl) {
        levelEl.textContent =
          String(level.level || state.level || 1)
            .padStart(2, '0');
      }

      if (xpTextEl) {
        xpTextEl.textContent =
          `${xpIntoLevel.toLocaleString()} / ${xpNeeded.toLocaleString()}`;
      }

      if (xpFillEl) {
        xpFillEl.style.width =
          `${xpProgress}%`;
      }

      if (bestRunEl) {
        bestRunEl.textContent =
          bestRun.toLocaleString();
      }

      if (runsEl) {
        runsEl.textContent =
          totalRuns.toLocaleString();
      }

      if (signalsEl) {
        signalsEl.textContent =
          signals.toLocaleString();
      }

        if (missionXpEl) {
        const missionXp =
          Number(state.lastXpBreakdown?.total) || 0;

        missionXpEl.textContent =
          missionXp > 0
            ? `+${missionXp.toLocaleString()}`
            : '—';
      }

             if (bestRatingEl) {
        const firstMissionStats =
          state.missionStats?.['first-delivery'];

        const bestRating =
          Number(firstMissionStats?.bestRating) || 0;

        bestRatingEl.textContent =
          bestRating > 0
            ? '★'.repeat(Math.min(3, bestRating))
            : '—';
      }

               /*
       * Live signal progress for the active/last runner scene.
       * The gameplay scene is the authoritative source for
       * collected Signals during a run.
       */
    const activeScene =
  window.__relayRunnerScene || null;

const lastProgress =
  window.__relayLastMissionProgress || null;

const missionSignals =
  activeScene
    ? Math.max(
        0,
        Math.min(
          Array.isArray(activeScene?.mission?.signals)
            ? activeScene.mission.signals.length
            : 10,
          Number(activeScene?.collected) || 0
        )
      )
    : Math.max(
        0,
        Number(lastProgress?.signals) || 0
      );

const missionSignalTarget =
  activeScene && Array.isArray(activeScene?.mission?.signals)
    ? activeScene.mission.signals.length
    : Math.max(
        1,
        Number(lastProgress?.totalSignals) || 10
      );

      if (signalValueEl) {
        signalValueEl.textContent =
          `${String(missionSignals).padStart(2, '0')} / ${String(missionSignalTarget).padStart(2, '0')}`;
      }

      if (signalFillEl) {
        const signalProgress =
          missionSignalTarget > 0
            ? Math.round(
                (missionSignals / missionSignalTarget) * 100
              )
            : 0;

        signalFillEl.style.width =
          `${signalProgress}%`;
      }

    } catch (error) {
      console.error(
        '[RelayRunner] Home profile sync failed:',
        error
      );
    }
  };

  window.addEventListener(
    'storage',
    event => {
      if (
        event.key === 'relay-runner-state'
      ) {
        syncHomeProfile();
      }
    }
  );

  window.addEventListener(
    'relay:mission-complete',
    () => {
      syncHomeProfile();
    }
  );

  const introVisible = () => {
    const intro = $('intro');
    return !!intro && !intro.classList.contains('hidden');
  };

  document.addEventListener(
    'visibilitychange',
    () => {
      if (
        document.visibilityState === 'visible' &&
        introVisible()
      ) {
        syncHomeProfile();
      }
    }
  );

  const forceStartVisible = start => {
    if (!(start instanceof HTMLElement)) return;

    start.hidden = false;
    start.removeAttribute('hidden');
    start.classList.remove('hidden');

    start.style.setProperty(
      'display',
      'flex',
      'important'
    );

    start.style.setProperty(
      'visibility',
      'visible',
      'important'
    );

    start.style.setProperty(
      'opacity',
      '1',
      'important'
    );

    start.style.setProperty(
      'pointer-events',
      'auto',
      'important'
    );
  };

  const clickExisting = selector => {
    const target = document.querySelector(selector);

    if (
      !(target instanceof HTMLElement) ||
      target.disabled
    ) {
      return false;
    }

    try {
      HTMLElement.prototype.click.call(target);
      return true;
    } catch {
      return false;
    }
  };

  const openOptions = () => {
    try {
      if (
        typeof window.relayUnifiedCinematicUI?.openOptions ===
        'function'
      ) {
        window.relayUnifiedCinematicUI.openOptions();
        return true;
      }
    } catch {}

    return clickExisting(
      '[data-title-panel="controls"]'
    );
  };

  const openFaq = () => {
    try {
      if (
        typeof window.relayUnifiedCinematicUI?.openFAQ ===
        'function'
      ) {
        window.relayUnifiedCinematicUI.openFAQ();
        return true;
      }
    } catch {}

    return clickExisting(
      '[data-relay-info="faq"]'
    );
  };

  const openUpdate = () => {
    console.log('[RelayRunner] UPDATE CLICKED');

    const panel =
      document.getElementById('relayInfoPanel');

    const eyebrow =
      document.getElementById('relayInfoEyebrow');

    const heading =
      document.getElementById('relayInfoHeading');

    const content =
      document.getElementById('relayInfoContent');

    try {
      if (typeof window.relayOpenInfo === 'function') {
        window.relayOpenInfo('update');
      }
    } catch (error) {
      console.error(
        '[RelayRunner] UPDATE open failed:',
        error
      );
    }

    if (!(panel instanceof HTMLElement)) {
      console.error(
        '[RelayRunner] relayInfoPanel NOT FOUND'
      );
      return false;
    }

    panel.classList.remove('hidden');
    panel.classList.add('relay-update-mode');

    if (eyebrow instanceof HTMLElement) {
      eyebrow.textContent = 'LATEST UPDATE';
    }

    if (heading instanceof HTMLElement) {
      heading.textContent = 'UPDATE';
    }

    if (content instanceof HTMLElement) {
      content.innerHTML = `
        <p class="relay-update-meta">
          CHAPTER 01 / NIGHT SHIFT · PATCH 01.08 · DEPLOYMENT READY
        </p>

        <div class="relay-update-list">
          <div class="relay-update-item">
            SYSTEM STATUS // ONLINE
          </div>

          <div class="relay-update-item">
            GAMEPLAY CORE // SYNCHRONIZED
          </div>

          <div class="relay-update-item">
            NEW // IMPROVED ROOFTOP MOVEMENT
          </div>

          <div class="relay-update-item">
            NEW // REFINED MOBILE CONTROLS
          </div>

          <div class="relay-update-item">
            PATCH // HUD STABILITY IMPROVEMENTS
          </div>
        </div>
      `;
    }

    return true;
  };

  

  const setHomeState = () => {
    const intro = $('intro');
    const visible = introVisible();

    document.body.classList.toggle(
      'home-v3-active',
      visible
    );

    intro?.classList.toggle(
      'home-v3',
      visible
    );

    if (!visible) return;

    const start = intro?.querySelector('#start');

    forceStartVisible(start);
    syncHomeProfile();
  };

  const bindOnce = (node, event, handler) => {
    if (!(node instanceof HTMLElement)) return;

    const key = `homeV4Bound${event}`;

    if (node.dataset[key] === '1') return;

    node.dataset[key] = '1';
    node.addEventListener(event, handler);
  };

  const buildHome = () => {
    const intro = $('intro');

    if (
      !intro ||
      intro.dataset.homeV4Built === '1'
    ) {
      return;
    }

    const sourceStart = $('start');
    const sourceContinue = $('continue');

    intro.dataset.homeV4Built = '1';
    intro.classList.add('home-v3');
    intro.replaceChildren();

    const scene = document.createElement('div');

    scene.className = 'home-v4-scene';
    scene.setAttribute(
      'aria-hidden',
      'true'
    );

    scene.innerHTML = `
      <div class="home-v4-art"></div>
      <div class="home-v4-sky"></div>
      <div class="home-v4-vignette"></div>
          <div class="home-v4-grid"></div>
      <div class="home-v4-scan"></div>
      <div class="home-v4-signal"></div>
      <div class="home-v4-float-line"></div>

      <div class="home-v5-network" aria-hidden="true">
        <span class="home-v5-node home-v5-node-a"></span>
        <span class="home-v5-node home-v5-node-b"></span>
        <span class="home-v5-node home-v5-node-c"></span>
        <span class="home-v5-node home-v5-node-d"></span>

        <span class="home-v5-link home-v5-link-a"></span>
        <span class="home-v5-link home-v5-link-b"></span>
        <span class="home-v5-link home-v5-link-c"></span>
      </div>
    `;

    const shell = document.createElement('div');

    shell.className = 'home-v4-shell';

    shell.innerHTML = `
      <header class="home-v4-topbar">
        <div
          class="home-v4-brand"
          aria-label="Relay Runner"
        >
          <span class="home-v4-brand-mark">R/</span>
          <span>RELAY RUNNER</span>
        </div>

        <div
          class="home-v4-status"
          aria-label="System status"
        >
          <span class="home-v4-status-dot"></span>
          <b>SYSTEM ONLINE</b>
          <span>NIGHT SHIFT</span>
        </div>
      </header>

      <main class="home-v4-main">
        <section
          class="home-v4-copy"
          aria-labelledby="homeV4Title"
        >
          <p class="home-v4-kicker">
            CHAPTER 01 / OLD QUARTER
          </p>

          <h1
            id="homeV4Title"
            class="home-v4-title"
          >
            RELAY<span>RUNNER</span>
          </h1>

          <p class="home-v4-subline">
            ROOFTOP RELAY // LIVE NETWORK
          </p>

          <p class="home-v4-description">
            Run the sleeping city. Carry the signal farther
            than anyone else can. Keep the line open.
          </p>

          <div
            class="home-v4-actions"
            aria-label="Main menu"
          >
             <button
              id="start"
              class="home-v4-primary home-v5-start"
              type="button"
              aria-label="Start Run"
            >
              <span
                class="home-v5-start-scan"
                aria-hidden="true"
              ></span>

              <span class="home-v4-primary-content">
                <span class="home-v5-start-label">
                  START RUN
                </span>

                <span
                  class="home-v4-arrow-key"
                  aria-hidden="true"
                >
                  ENTER
                </span>

                <span
                  class="home-v4-primary-arrow"
                  aria-hidden="true"
                >
                  →
                </span>
              </span>

              <span
                class="home-v5-start-ready"
                aria-hidden="true"
              >
                READY
              </span>
            </button>
            
            <button
              id="continue"
              class="home-v4-secondary hidden"
              type="button"
            >
              <span>CONTINUE</span>
              <small>RESUME LAST RUN</small>
            </button>
          </div>

       <p class="home-v4-micro">
  <b>DEPLOYMENT READY</b>
  · PRESS ENTER TO BEGIN
</p>

<div class="home-v5-relay-status" aria-label="Relay deployment status">
  <div class="home-v5-relay-status-head">
    <span class="home-v5-relay-status-title">
      &gt; RELAY STATUS
    </span>

    <span class="home-v5-relay-status-live">
      <i aria-hidden="true"></i>
      ONLINE
    </span>
  </div>

  <div class="home-v5-relay-status-track" aria-hidden="true">
    <span></span>
  </div>

  <div class="home-v5-relay-status-meta">
    <span>
      <small>CHANNEL</small>
      <b>01</b>
    </span>

    <span>
      <small>LINK</small>
      <b>SECURE</b>
    </span>

    <span>
      <small>STATUS</small>
      <b>READY</b>
    </span>
  </div>
</div>
        </section>

             <section
          class="home-v4-mission-wrap"
          aria-label="Current mission"
        >

          <aside class="home-v5-live-feed" aria-label="Relay network status">
            <div class="home-v5-panel-head">
              <span>RELAY NETWORK</span>
              <b><i></i> LIVE</b>
            </div>

            <div class="home-v5-feed-line">
              <span>&gt;</span>
              <strong>SIGNAL STABLE</strong>
            </div>

            <div class="home-v5-feed-line">
              <span>&gt;</span>
              <strong>03 NODES ONLINE</strong>
            </div>

            <div class="home-v5-feed-line">
              <span>&gt;</span>
              <strong id="homeV5LastRunFeed">LAST RUN // READY</strong>
            </div>
          </aside>
          <article class="home-v4-mission">
            <div class="home-v4-mission-head">
              <span class="home-v4-mission-label">
                ACTIVE MISSION
              </span>

              <span class="home-v4-mission-code">
                RR-01 / NIGHT
              </span>
            </div>

            <h2 class="home-v4-mission-title">
              FOLLOW<br>THE RELAY
            </h2>

            <p class="home-v4-mission-sub">
              RECONNECT THE SIGNAL CHAIN ACROSS OLD QUARTER.
            </p>

            <div class="home-v4-mission-progress">
              <div class="home-v4-progress-meta">
                <span>SIGNAL RECOVERY</span>
                <strong id="homeV4SignalValue">
  00 / 10
</strong>
              </div>

              <div
                class="home-v4-progress-bar"
                aria-hidden="true"
              >
                <div
                  id="homeV4SignalFill"
                  class="home-v4-progress-fill"
                ></div>
              </div>
            </div>

                    <div class="home-v5-last-run">
              <div class="home-v5-last-run-head">
                <span>LAST RUN</span>
                <b>TELEMETRY</b>
              </div>

              <div class="home-v5-telemetry-grid">
                <div>
                  <small>TIME</small>
                  <strong id="homeV5RunTime">—</strong>
                </div>

                <div>
                  <small>SIGNALS</small>
                  <strong id="homeV5RunSignals">—</strong>
                </div>

                <div>
                  <small>SCORE</small>
                  <strong id="homeV5RunScore">—</strong>
                </div>

                <div>
                  <small>RATING</small>
                  <strong id="homeV5RunRating">—</strong>
                </div>
              </div>
            </div>

            <div class="home-v4-stat-grid">
          <div class="home-v4-stat">
  <small>MISSION XP</small>
  <b id="homeV4MissionXp">+0</b>
</div>

            <div class="home-v4-stat">
  <small>BEST RATING</small>
  <b id="homeV4BestRating">—</b>
</div>
            </div>
          </article>

        <div class="home-v4-badge">
  LIVE RELAY CHANNEL // 01
</div>

<aside class="home-v4-profile" aria-label="Runner profile">
  <div class="home-v4-profile-head">
    <div>
      <span class="home-v4-profile-kicker">
        RUNNER INTEL
      </span>
      <strong>COURIER PROFILE</strong>
    </div>

    <span class="home-v4-profile-live">
      LIVE
    </span>
  </div>

  <div class="home-v4-profile-rank">
    <div>
      <small>RANK</small>
      <b id="homeV4Rank">ROOKIE</b>
    </div>

    <div>
      <small>LEVEL</small>
      <b id="homeV4Level">01</b>
    </div>
  </div>

  <div class="home-v4-profile-xp">
    <div class="home-v4-profile-xp-meta">
      <span>XP PROGRESS</span>
      <strong id="homeV4XpText">0 / 100</strong>
    </div>

    <div class="home-v4-profile-xp-track">
      <i
        id="homeV4XpFill"
        style="width:0%"
      ></i>
    </div>
  </div>

  <div class="home-v4-profile-stats">
    <div>
      <small>BEST RUN</small>
      <b id="homeV4BestRun">0</b>
    </div>

    <div>
      <small>RUNS</small>
      <b id="homeV4Runs">0</b>
    </div>

    <div>
      <small>SIGNALS</small>
      <b id="homeV4Signals">0</b>
    </div>
  </div>

  <div class="home-v4-profile-footer">
    <span>PROFILE STATUS</span>
    <b>ONLINE</b>
  </div>
</aside>
        </section>
      </main>

      <footer class="home-v4-bottom">
        <div class="home-v4-bottom-left">
          <button
            class="home-v4-utility"
            type="button"
            data-home-v4-action="faq"
          >
            ? &nbsp;FAQ
          </button>

          <button
            class="home-v4-utility"
            type="button"
            data-home-v4-action="update"
          >
            ↗ &nbsp;UPDATE
          </button>

          <button
            class="home-v4-utility"
            type="button"
            data-home-v4-action="options"
          >
            ⚙ &nbsp;OPTIONS
          </button>
        </div>

        <div class="home-v4-bottom-meta">
          RELAY NETWORK <b>ONLINE</b> · V1.1.0
        </div>
      </footer>

      <button
        id="exitTitle"
        type="button"
        aria-hidden="true"
        tabindex="-1"
        class="home-v4-compat-anchor"
      >
        EXIT
      </button>
    `;

    intro.append(scene, shell);

    syncHomeProfile();

    bindOnce(
      shell.querySelector(
        '[data-home-v4-action="faq"]'
      ),
      'click',
      event => {
        event.preventDefault();
        openFaq();
      }
    );

    bindOnce(
      shell.querySelector(
        '[data-home-v4-action="update"]'
      ),
      'click',
      event => {
        event.preventDefault();
        openUpdate();
      }
    );

    bindOnce(
      shell.querySelector(
        '[data-home-v4-action="options"]'
      ),
      'click',
      event => {
        event.preventDefault();
        openOptions();
      }
    );

    const start =
      shell.querySelector('#start');

    forceStartVisible(start);

    bindOnce(
      start,
      'click',
      event => {
        event.preventDefault();

        if (
          !(sourceStart instanceof HTMLElement)
        ) {
          return;
        }

        try {
          HTMLElement.prototype.click.call(
            sourceStart
          );
        } catch {}
      }
    );

    const continueButton =
      shell.querySelector('#continue');

    const syncContinue = () => {
      if (
        !(continueButton instanceof HTMLElement) ||
        !(sourceContinue instanceof HTMLElement)
      ) {
        return;
      }

      const hidden =
        sourceContinue.classList.contains('hidden') ||
        getComputedStyle(sourceContinue).display === 'none' ||
        sourceContinue.hasAttribute('hidden');

      continueButton.classList.toggle(
        'hidden',
        hidden
      );
    };

    syncContinue();

    if (
      sourceContinue instanceof HTMLElement &&
      sourceContinue !== continueButton &&
      !sourceContinue.dataset.homeV4Observed
    ) {
      sourceContinue.dataset.homeV4Observed = '1';

      new MutationObserver(
        syncContinue
      ).observe(
        sourceContinue,
        {
          attributes: true,
          attributeFilter: [
            'class',
            'style',
            'hidden'
          ]
        }
      );
    }

    bindOnce(
      continueButton,
      'click',
      event => {
        event.preventDefault();

        if (
          !(sourceContinue instanceof HTMLElement)
        ) {
          return;
        }

        try {
          HTMLElement.prototype.click.call(
            sourceContinue
          );
        } catch {}
      }
    );
  };

  const installKeyboard = () => {
    if (
      document.documentElement.dataset.homeV4Keys === '1'
    ) {
      return;
    }

    document.documentElement.dataset.homeV4Keys = '1';

    document.addEventListener(
      'keydown',
      event => {
        if (!introVisible() || event.repeat) {
          return;
        }

        if (event.key === 'Enter') {
          const active =
            document.activeElement;

          const tag =
            active?.tagName;

          if (
            tag !== 'BUTTON' &&
            tag !== 'INPUT' &&
            tag !== 'TEXTAREA'
          ) {
            event.preventDefault();
            clickExisting('#start');
          }
        }

        if (event.key === 'Escape') {
          const title =
            $('titlePanel');

          const info =
            $('relayInfoPanel');

          if (
            !title?.classList.contains('hidden')
          ) {
            title.classList.add('hidden');
          }

          if (
            !info?.classList.contains('hidden')
          ) {
            info.classList.add('hidden');
          }
        }
      }
    );
  };

  const boot = () => {
    buildHome();
    setHomeState();
    installKeyboard();

    const intro = $('intro');

    if (
      intro &&
      intro.dataset.homeV4Observed !== '1'
    ) {
      intro.dataset.homeV4Observed = '1';

      new MutationObserver(
        setHomeState
      ).observe(
        intro,
        {
          attributes: true,
          attributeFilter: [
            'class',
            'style',
            'hidden'
          ]
        }
      );
    }
  };

  if (
    document.readyState === 'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      boot,
      { once: true }
    );
  } else {
    boot();
  }
})();
