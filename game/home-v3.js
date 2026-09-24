
/*
 * Runner Relay — Home V4 presentation owner.
 *
 * CONTRACT:
 * - Home owns presentation only.
 * - #start / #continue remain the authoritative gameplay entry points.
 * - Options / FAQ / Update remain owned by existing systems.
 * - Tutorial remains Home presentation.
 * - Desktop presentation uses reduced motion / reduced visual intensity.
 * - FAQ / UPDATE / TUTORIAL / OPTIONS use stable delegated click handling.
 */

import { RELAY_FAQ } from './faq.js';

const gameplayMusicUrl =
  './assets/audio/music.mp3';

(() => {
  'use strict';

  if (window.__relayHomeV4) return;
  window.__relayHomeV4 = true;

  const $ = id => document.getElementById(id);

  let homeProfileStateAPI = null;
  let homeDailyChallengesAPI = null;
  let homeContractsAPI = null;

  /* =========================================================
     PANEL HELPERS
     ========================================================= */

  const closeHomePanels = () => {
    const titlePanel = $('titlePanel');
    const infoPanel = $('relayInfoPanel');

    if (titlePanel instanceof HTMLElement) {
      titlePanel.classList.add('hidden');
      titlePanel.setAttribute('aria-hidden', 'true');
    }

    if (infoPanel instanceof HTMLElement) {
      infoPanel.classList.add('hidden');
      infoPanel.classList.remove(
        'relay-faq-mode',
        'relay-update-mode'
      );
      infoPanel.setAttribute('aria-hidden', 'true');
    }
  };

  const prepareInfoPanel = mode => {
    const panel = $('relayInfoPanel');

    if (!(panel instanceof HTMLElement)) {
      return false;
    }

    panel.classList.remove('hidden');

    panel.classList.toggle(
      'relay-faq-mode',
      mode === 'faq'
    );

    panel.classList.toggle(
      'relay-update-mode',
      mode === 'update'
    );

    panel.setAttribute('aria-hidden', 'false');

    return true;
  };

  /* =========================================================
     DAILY OPERATION
     ========================================================= */

  const syncHomeDailyOperation = async () => {
    try {
      const {
        dailyChallenges,
        loadState
      } =
        homeDailyChallengesAPI ||
        await import('./src/state.js');

      homeDailyChallengesAPI = {
        dailyChallenges,
        loadState
      };

      const state = loadState();

      const dailyState =
        state?.daily || {
          progress: {},
          claimed: []
        };

      const challenges =
        Array.isArray(dailyChallenges)
          ? dailyChallenges
          : [];

      const challenge =
        challenges.find(item => {
          const progress =
            Number(
              dailyState.progress?.[item.id]
            ) || 0;

          const target =
            Math.max(
              1,
              Number(item.target) || 1
            );

          const claimed =
            Array.isArray(dailyState.claimed) &&
            dailyState.claimed.includes(
              item.id
            );

          return !claimed && progress < target;
        }) ||
        challenges.find(item => {
          const progress =
            Number(
              dailyState.progress?.[item.id]
            ) || 0;

          const target =
            Math.max(
              1,
              Number(item.target) || 1
            );

          return progress < target;
        }) ||
        challenges[0];

      const titleEl =
        $('homeV4DailyTitle');

      const descriptionEl =
        $('homeV4DailyDescription');

      const progressEl =
        $('homeV4DailyProgress');

      const fillEl =
        $('homeV4DailyProgressFill');

      const rewardEl =
        $('homeV4DailyReward');

      const creditsEl =
        $('homeV4DailyCredits');

      const statusEl =
        $('homeV4DailyStatus');

      if (!challenge) {
        if (titleEl) {
          titleEl.textContent =
            'NO DAILY OPERATION';
        }

        if (descriptionEl) {
          descriptionEl.textContent =
            'NO ACTIVE DAILY OBJECTIVE AVAILABLE.';
        }

        if (progressEl) {
          progressEl.textContent = '—';
        }

        if (fillEl) {
          fillEl.style.width = '0%';
        }

        if (rewardEl) {
          rewardEl.textContent = '+0 XP';
        }

        if (creditsEl) {
          creditsEl.textContent = '+0 CREDITS';
        }

        if (statusEl) {
          statusEl.textContent = 'STANDBY';
        }

        return;
      }

      const progress =
        Math.max(
          0,
          Number(
            dailyState.progress?.[challenge.id]
          ) || 0
        );

      const target =
        Math.max(
          1,
          Number(challenge.target) || 1
        );

      const claimed =
        Array.isArray(dailyState.claimed) &&
        dailyState.claimed.includes(
          challenge.id
        );

      const complete =
        progress >= target;

      const percent =
        Math.max(
          0,
          Math.min(
            100,
            Math.round(
              (progress / target) * 100
            )
          )
        );

      if (titleEl) {
        titleEl.textContent =
          String(
            challenge.label ||
            'DAILY OPERATION'
          ).toUpperCase();
      }

      if (descriptionEl) {
        descriptionEl.textContent =
          'COMPLETE THIS OBJECTIVE DURING NORMAL PLAY.';
      }

      if (progressEl) {
        progressEl.textContent =
          `${progress.toLocaleString()} / ${target.toLocaleString()}`;
      }

      if (fillEl) {
        fillEl.style.width =
          `${percent}%`;
      }

      if (rewardEl) {
        rewardEl.textContent =
          `+${(
            Number(challenge.xp) || 0
          ).toLocaleString()} XP`;
      }

      if (creditsEl) {
        creditsEl.textContent =
          `+${(
            Number(challenge.credits) || 0
          ).toLocaleString()} CREDITS`;
      }

      if (statusEl) {
        statusEl.textContent =
          claimed
            ? 'CLAIMED'
            : complete
              ? 'READY TO CLAIM'
              : 'IN PROGRESS';
      }

      const dailyCard =
        document.querySelector(
          '.home-v4-daily'
        );

      if (dailyCard instanceof HTMLElement) {
        dailyCard.classList.toggle(
          'is-complete',
          complete
        );

        dailyCard.classList.toggle(
          'is-claimed',
          claimed
        );
      }

    } catch (error) {
      console.error(
        '[RelayRunner] Daily operation sync failed:',
        error
      );
    }
  };

  /* =========================================================
     HOME PROFILE
     ========================================================= */

  const syncHomeProfile = async () => {
    try {
      const {
        loadState,
        getCourierRank,
        getLevelProgress
      } =
        homeProfileStateAPI ||
        await import('./src/state.js');

      homeProfileStateAPI = {
        loadState,
        getCourierRank,
        getLevelProgress
      };

      const state = loadState();

      window.__relaySyncMissionNetwork?.(state);

      if (!homeContractsAPI) {
        homeContractsAPI =
          await import('./src/contracts.js');
      }

      const xp = Number(state.xp) || 0;
      const signals = Number(state.signals) || 0;
      const credits = Number(state.credits) || 0;
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
      const creditsEl = $('homeV4Credits');
      const missionXpEl = $('homeV4MissionXp');
      const bestRatingEl = $('homeV4BestRating');
      const signalValueEl = $('homeV4SignalValue');
      const signalFillEl = $('homeV4SignalFill');

      const unlockLevelEl = $('homeV4UnlockLevel');
      const unlockTitleEl = $('homeV4UnlockTitle');
      const unlockTextEl = $('homeV4UnlockText');
      const unlockFillEl = $('homeV4UnlockFill');

      const activityOneEl =
        $('homeV4ActivityOne');

      const activityOneMetaEl =
        $('homeV4ActivityOneMeta');

      const activityTwoEl =
        $('homeV4ActivityTwo');

      const activityTwoMetaEl =
        $('homeV4ActivityTwoMeta');

      const activityThreeEl =
        $('homeV4ActivityThree');

      const activityThreeMetaEl =
        $('homeV4ActivityThreeMeta');

      const lastRunFeedEl =
        $('homeV5LastRunFeed');

      const runTimeEl =
        $('homeV5RunTime');

      const runSignalsEl =
        $('homeV5RunSignals');

      const runScoreEl =
        $('homeV5RunScore');

      const runRatingEl =
        $('homeV5RunRating');

      if (lastRunFeedEl) {
        lastRunFeedEl.textContent =
          totalRuns > 0
            ? 'LAST RUN // RECORDED'
            : 'LAST RUN // READY';
      }

      if (activityOneEl) {
        activityOneEl.textContent =
          totalRuns > 0
            ? 'RUN RECORDED'
            : 'NETWORK READY';
      }

      if (activityOneMetaEl) {
        activityOneMetaEl.textContent =
          totalRuns > 0
            ? `RUNS // ${totalRuns.toLocaleString()}`
            : 'RELAY CHANNEL // 01';
      }

      if (activityTwoEl) {
        activityTwoEl.textContent =
          signals > 0
            ? `${signals.toLocaleString()} SIGNALS RECOVERED`
            : 'AWAITING FIRST SIGNAL';
      }

      if (activityTwoMetaEl) {
        activityTwoMetaEl.textContent =
          signals > 0
            ? 'SIGNAL NETWORK // ACTIVE'
            : 'SIGNAL NETWORK // STANDBY';
      }

      if (activityThreeEl) {
        activityThreeEl.textContent =
          xp > 0
            ? `XP BALANCE // ${xp.toLocaleString()}`
            : 'CONTRACT NETWORK READY';
      }

      if (activityThreeMetaEl) {
        activityThreeMetaEl.textContent =
          xp > 0
            ? 'PROGRESSION // ACTIVE'
            : 'CONTRACTS // ONLINE';
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
          lastRunRating != null &&
          Number(lastRunRating) > 0
            ? '★'.repeat(
                Math.min(
                  3,
                  Number(lastRunRating)
                )
              )
            : '—';
      }

      if (rankEl) {
        rankEl.textContent =
          rank?.name ||
          state.rank ||
          'ROOKIE';
      }

      if (levelEl) {
        levelEl.textContent =
          String(
            level.level ||
            state.level ||
            1
          ).padStart(2, '0');
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

      if (creditsEl) {
        creditsEl.textContent =
          credits.toLocaleString();
      }

      if (missionXpEl) {
        const missionXp =
          Number(
            state.lastXpBreakdown?.total
          ) || 0;

        missionXpEl.textContent =
          missionXp > 0
            ? `+${missionXp.toLocaleString()}`
            : '—';
      }

      if (bestRatingEl) {
        const firstMissionStats =
          state.missionStats?.[
            'first-delivery'
          ];

        const bestRating =
          Number(
            firstMissionStats?.bestRating
          ) || 0;

        bestRatingEl.textContent =
          bestRating > 0
            ? '★'.repeat(
                Math.min(
                  3,
                  bestRating
                )
              )
            : '—';
      }

      const activeScene =
        window.__relayRunnerScene ||
        null;

      const lastProgress =
        window.__relayLastMissionProgress ||
        null;

      const missionSignals =
        activeScene
          ? Math.max(
              0,
              Math.min(
                Array.isArray(
                  activeScene?.mission?.signals
                )
                  ? activeScene.mission.signals.length
                  : 10,
                Number(
                  activeScene?.collected
                ) || 0
              )
            )
          : Math.max(
              0,
              Number(
                lastProgress?.signals
              ) || 0
            );

      const missionSignalTarget =
        activeScene &&
        Array.isArray(
          activeScene?.mission?.signals
        )
          ? activeScene.mission.signals.length
          : Math.max(
              1,
              Number(
                lastProgress?.totalSignals
              ) || 10
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

      const nextLevel =
        (level.level || 1) + 1;

      const unlockProgress =
        xpProgress;

      if (unlockLevelEl) {
        unlockLevelEl.textContent =
          `LV ${String(nextLevel).padStart(2, '0')}`;
      }

      if (unlockTitleEl) {
        unlockTitleEl.textContent =
          `SECTOR ${String(nextLevel).padStart(2, '0')} // SKYLINE`;
      }

      if (unlockTextEl) {
        unlockTextEl.textContent =
          `${unlockProgress}%`;
      }

      if (unlockFillEl) {
        unlockFillEl.style.width =
          `${unlockProgress}%`;
      }

      await syncHomeContract();

    } catch (error) {
      console.error(
        '[RelayRunner] Home profile sync failed:',
        error
      );
    }

    void syncHomeDailyOperation();
  };

  window.addEventListener(
    'storage',
    event => {
      if (
        event.key === 'relay-runner-state'
      ) {
        void syncHomeProfile();
      }
    }
  );

  window.addEventListener(
    'relay:mission-complete',
    () => {
      void syncHomeProfile();
    }
  );

  const introVisible = () => {
    const intro = $('intro');

    return !!intro &&
      !intro.classList.contains('hidden');
  };

  document.addEventListener(
    'visibilitychange',
    () => {
      if (
        document.visibilityState === 'visible' &&
        introVisible()
      ) {
        void syncHomeProfile();
      }
    }
  );

  /* =========================================================
     HELPERS
     ========================================================= */

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
    const target =
      document.querySelector(selector);

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

  /* =========================================================
     OPTIONS
     ========================================================= */

  const openOptions = () => {
    try {
      if (
        typeof window
          .relayUnifiedCinematicUI
          ?.openOptions ===
        'function'
      ) {
        window
          .relayUnifiedCinematicUI
          .openOptions();

        return true;
      }
    } catch (error) {
      console.error(
        '[RelayRunner] Unified options open failed:',
        error
      );
    }

    return clickExisting(
      '[data-title-panel="controls"]'
    );
  };

  /* =========================================================
     FAQ
     ========================================================= */

  const openFaq = () => {
    const panel =
      $('relayInfoPanel');

    const eyebrow =
      $('relayInfoEyebrow');

    const heading =
      $('relayInfoHeading');

    const content =
      $('relayInfoContent');

    if (
      !(panel instanceof HTMLElement) ||
      !(eyebrow instanceof HTMLElement) ||
      !(heading instanceof HTMLElement) ||
      !(content instanceof HTMLElement)
    ) {
      console.error(
        '[RelayRunner] FAQ panel elements not found'
      );

      return false;
    }

    try {
      prepareInfoPanel('faq');

      eyebrow.textContent =
        'RELAY RUNNER // FIELD GUIDE';

      heading.textContent =
        'FAQ';

      content.innerHTML = `
        <div
          class="relay-terminal-prompt"
          aria-hidden="true"
        >
          SELECT A QUERY
        </div>

        <div
          class="relay-faq-list"
          role="list"
        >
          ${RELAY_FAQ.map(
            ([question, answer], index) => {
              const isOpen =
                index === 0;

              const number =
                String(index + 1)
                  .padStart(2, '0');

              return `
                <article
                  class="relay-faq-item${isOpen ? ' open' : ''}"
                  role="listitem"
                >
                  <button
                    class="relay-faq-question"
                    type="button"
                    data-faq-question
                    aria-expanded="${isOpen}"
                  >
                    <span
                      class="faq-index"
                      aria-hidden="true"
                    >
                      ${number}
                    </span>

                    <span class="faq-question-text">
                      ${String(question)}
                    </span>

                    <span
                      class="faq-question-state"
                      aria-hidden="true"
                    >
                      ${isOpen
                        ? 'ACTIVE'
                        : 'QUERY'}
                    </span>
                  </button>

                  <div
                    class="relay-faq-answer"
                    ${isOpen ? '' : 'hidden'}
                  >
                    ${String(answer)}
                  </div>
                </article>
              `;
            }
          ).join('')}
        </div>
      `;

      return true;

    } catch (error) {
      console.error(
        '[RelayRunner] FAQ open failed:',
        error
      );

      return false;
    }
  };

  /* =========================================================
     UPDATE
     ========================================================= */

  const openUpdate = () => {
    const panel =
      $('relayInfoPanel');

    const eyebrow =
      $('relayInfoEyebrow');

    const heading =
      $('relayInfoHeading');

    const content =
      $('relayInfoContent');

    if (
      !(panel instanceof HTMLElement) ||
      !(eyebrow instanceof HTMLElement) ||
      !(heading instanceof HTMLElement) ||
      !(content instanceof HTMLElement)
    ) {
      console.error(
        '[RelayRunner] UPDATE panel elements not found'
      );

      return false;
    }

    try {
      prepareInfoPanel('update');

      eyebrow.textContent =
        'LATEST UPDATE';

      heading.textContent =
        'UPDATE';

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

      return true;

    } catch (error) {
      console.error(
        '[RelayRunner] UPDATE open failed:',
        error
      );

      return false;
    }
  };

  /* =========================================================
     CREDITS
     ========================================================= */

  const openHomeCredits = () => {
    const panel =
      $('titlePanel');

    const eyebrow =
      $('titlePanelEyebrow');

    const heading =
      $('titlePanelHeading');

    const content =
      $('titlePanelContent');

    if (
      !(panel instanceof HTMLElement) ||
      !(eyebrow instanceof HTMLElement) ||
      !(heading instanceof HTMLElement) ||
      !(content instanceof HTMLElement)
    ) {
      return false;
    }

    closeHomePanels();

    eyebrow.textContent =
      'CREDITS';

    heading.textContent =
      'RELAY RUNNER';

    content.innerHTML = `
      <div class="home-info-panel-content">

        <div class="home-info-panel-intro">
          <span>RUNNER RELAY // NIGHT SHIFT</span>
          <p>
            A compact rooftop relay experience
            built with Phaser 3.
          </p>
        </div>

        <div class="home-info-panel-grid">

          <div>
            <small>ENGINE</small>
            <strong>PHASER 3</strong>
          </div>

          <div>
            <small>PROJECT</small>
            <strong>RELAY RUNNER</strong>
          </div>

          <div>
            <small>VERSION</small>
            <strong>V1.1.0</strong>
          </div>

        </div>

        <div class="home-info-panel-foot">
          RELAY NETWORK // ONLINE
        </div>

      </div>
    `;

    panel.classList.remove('hidden');
    panel.setAttribute('aria-hidden', 'false');

    return true;
  };

  /* =========================================================
     TUTORIAL
     ========================================================= */

  const openHomeTutorial = () => {
    const panel =
      $('titlePanel');

    const eyebrow =
      $('titlePanelEyebrow');

    const heading =
      $('titlePanelHeading');

    const content =
      $('titlePanelContent');

    if (
      !(panel instanceof HTMLElement) ||
      !(eyebrow instanceof HTMLElement) ||
      !(heading instanceof HTMLElement) ||
      !(content instanceof HTMLElement)
    ) {
      return false;
    }

    closeHomePanels();

    eyebrow.textContent =
      'FIELD MANUAL';

    heading.textContent =
      'HOW TO RUN.';

    content.innerHTML = `
      <div class="home-tutorial-content">

        <div class="tutorial-intro">
          <span>TUTORIAL // RUNNER RELAY</span>

          <p>
            Learn the core movement,
            combat and relay systems
            before entering the route.
          </p>

          <div class="tutorial-keyboard">
            <div class="tutorial-keyboard-label">
              KEYBOARD PROTOCOL
            </div>

            <span class="tutorial-key">
              A / D
              <small>RUN</small>
            </span>

            <span class="tutorial-key">
              SPACE
              <small>JUMP</small>
            </span>

            <span class="tutorial-key">
              E
              <small>FIRE</small>
            </span>

            <span class="tutorial-key">
              Q
              <small>BLADE</small>
            </span>

            <span class="tutorial-key">
              SHIFT
              <small>DASH</small>
            </span>

            <span class="tutorial-key">
              ESC
              <small>PAUSE</small>
            </span>
          </div>
        </div>

        <div class="tutorial-quick-grid">

          <article class="tutorial-quick-card">
            <small>01 // MOVE</small>
            <strong>A / D</strong>
            <span>RUN ACROSS THE ROOFTOPS</span>
          </article>

          <article class="tutorial-quick-card">
            <small>02 // JUMP</small>
            <strong>SPACE</strong>
            <span>JUMP AND USE DOUBLE JUMP</span>
          </article>

          <article class="tutorial-quick-card">
            <small>03 // DASH</small>
            <strong>SHIFT</strong>
            <span>BURST FORWARD THROUGH THE ROUTE</span>
          </article>

        </div>

        <div class="tutorial-accordion">

          <button
            type="button"
            class="tutorial-section"
            data-tutorial-section
            aria-expanded="false"
          >
            <span>
              COMBAT
              <small>E / Q</small>
            </span>

            <b>+</b>
          </button>

          <div
            class="tutorial-panel"
            hidden
          >
            <p>
              <strong>E</strong>
              FIRE YOUR WEAPON.
            </p>

            <p>
              <strong>Q</strong>
              USE YOUR BLADE.
            </p>
          </div>

        </div>

        <div class="tutorial-accordion">

          <button
            type="button"
            class="tutorial-section"
            data-tutorial-section
            aria-expanded="false"
          >
            <span>
              OBJECTIVE
              <small>RELAY SIGNAL</small>
            </span>

            <b>+</b>
          </button>

          <div
            class="tutorial-panel"
            hidden
          >
            <p>
              FOLLOW THE RELAY ROUTE,
              RECOVER SIGNALS AND REACH
              THE END OF THE NETWORK.
            </p>
          </div>

        </div>

        <div class="tutorial-accordion">

          <button
            type="button"
            class="tutorial-section"
            data-tutorial-section
            aria-expanded="false"
          >
            <span>
              MOBILE
              <small>TOUCH CONTROL</small>
            </span>

            <b>+</b>
          </button>

          <div
            class="tutorial-panel"
            hidden
          >
            <p>
              USE THE LEFT CONTROL AREA
              TO MOVE AND TAP THE ACTION
              BUTTONS FOR JUMP, FIRE,
              BLADE AND DASH.
            </p>
          </div>

        </div>

        <div class="tutorial-foot">
          <span>MISSION CONTROL</span>
          <strong>KEEP THE LINE ALIVE.</strong>
        </div>

      </div>
    `;

    panel.classList.remove('hidden');
    panel.setAttribute('aria-hidden', 'false');

    content
      .querySelectorAll(
        '[data-tutorial-section]'
      )
      .forEach(button => {

        button.addEventListener(
          'click',
          () => {

            const open =
              button.getAttribute(
                'aria-expanded'
              ) === 'true';

            button.setAttribute(
              'aria-expanded',
              String(!open)
            );

            const article =
              button.closest(
                '.tutorial-accordion'
              );

            const tutorialPanel =
              article?.querySelector(
                '.tutorial-panel'
              );

            const indicator =
              button.querySelector('b');

            if (
              tutorialPanel instanceof HTMLElement
            ) {
              tutorialPanel.hidden = open;
            }

            if (
              indicator instanceof HTMLElement
            ) {
              indicator.textContent =
                open
                  ? '+'
                  : '−';
            }

            article?.classList.toggle(
              'is-open',
              !open
            );
          }
        );

      });

    return true;
  };

  /* =========================================================
     ACTIVE CONTRACT
     ========================================================= */

  const syncHomeContract = async () => {
    try {
      const {
        contracts
      } =
        homeContractsAPI ||
        await import('./src/contracts.js');

      homeContractsAPI = {
        contracts
      };

      const list =
        Array.isArray(contracts)
          ? contracts
          : [];

      const contract =
        list[0] || null;

      const typeEl =
        $('homeV4ContractType');

      const statusEl =
        $('homeV4ContractStatus');

      const codeEl =
        $('homeV4ContractCode');

      const titleEl =
        $('homeV4ContractTitle');

      const descriptionEl =
        $('homeV4ContractDescription');

      const missionEl =
        $('homeV4ContractMission');

      const rewardEl =
        $('homeV4ContractReward');

      const creditsEl =
        $('homeV4ContractCredits');

      if (!contract) {
        if (typeEl) {
          typeEl.textContent =
            'CONTRACT // OFFLINE';
        }

        if (statusEl) {
          statusEl.textContent =
            'STANDBY';
        }

        if (codeEl) {
          codeEl.textContent =
            'CONTRACT // NONE';
        }

        if (titleEl) {
          titleEl.textContent =
            'NO CONTRACT AVAILABLE';
        }

        if (descriptionEl) {
          descriptionEl.textContent =
            'NO ACTIVE CONTRACT DATA AVAILABLE.';
        }

        if (missionEl) {
          missionEl.textContent = '—';
        }

        if (rewardEl) {
          rewardEl.textContent = '+0 XP';
        }

        if (creditsEl) {
          creditsEl.textContent = '+0 CREDITS';
        }

        return;
      }

      const type =
        String(
          contract.type ||
          'CONTRACT'
        ).toUpperCase();

      const id =
        String(
          contract.id ||
          'unknown'
        ).toUpperCase();

      const mission =
        String(
          contract.missionId ||
          '—'
        ).toUpperCase();

      const label =
        String(
          contract.label ||
          'CONTRACT OBJECTIVE'
        ).toUpperCase();

      const xp =
        Number(contract.xp) || 0;

      const credits =
        Number(contract.credits) || 0;

      if (typeEl) {
        typeEl.textContent =
          `${type} // CONTRACT`;
      }

      if (statusEl) {
        statusEl.textContent =
          'AVAILABLE';
      }

      if (codeEl) {
        codeEl.textContent =
          `CONTRACT // ${id}`;
      }

      if (titleEl) {
        titleEl.textContent =
          label;
      }

      if (descriptionEl) {
        descriptionEl.textContent =
          'COMPLETE THIS CONTRACT DURING NORMAL PLAY.';
      }

      if (missionEl) {
        missionEl.textContent =
          mission;
      }

      if (rewardEl) {
        rewardEl.textContent =
          `+${xp.toLocaleString()} XP`;
      }

      if (creditsEl) {
        creditsEl.textContent =
          `+${credits.toLocaleString()} CREDITS`;
      }

    } catch (error) {
      console.error(
        '[RelayRunner] Active contract sync failed:',
        error
      );
    }
  };

  /* =========================================================
     HOME STATE
     ========================================================= */

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

    const start =
      intro?.querySelector('#start');

    forceStartVisible(start);
    void syncHomeProfile();
  };

  /* =========================================================
     TYPEWRITER
     ========================================================= */

  const startHomeTypewriter = () => {
    const target =
      $('homeV4Typewriter');

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const text =
      'RUN THE SLEEPING CITY. CARRY THE SIGNAL. KEEP THE LINE ALIVE. EVERY ROOFTOP IS PART OF THE NETWORK.';

    let index = 0;
    let deleting = false;

    const typeSpeed = 22;
    const deleteSpeed = 10;
    const pauseAfterTyping = 1200;
    const pauseAfterDeleting = 700;

    const run = () => {
      if (!introVisible()) {
        window.setTimeout(run, 500);
        return;
      }

      if (!deleting) {
        if (index < text.length) {
          target.textContent +=
            text.charAt(index);

          index += 1;

          window.setTimeout(
            run,
            typeSpeed
          );

          return;
        }

        deleting = true;

        window.setTimeout(
          run,
          pauseAfterTyping
        );

        return;
      }

      if (index > 0) {
        index -= 1;

        target.textContent =
          text.substring(0, index);

        window.setTimeout(
          run,
          deleteSpeed
        );

        return;
      }

      deleting = false;

      window.setTimeout(
        run,
        pauseAfterDeleting
      );
    };

    target.textContent = '';
    index = 0;
    deleting = false;

    run();
  };

  /* =========================================================
     BUILD HOME
     ========================================================= */

  const buildHome = () => {
    const intro = $('intro');

    if (
      !intro ||
      intro.dataset.homeV4Built === '1'
    ) {
      return;
    }

    const sourceContinue =
      $('continue');

    intro.dataset.homeV4Built = '1';
    intro.classList.add('home-v3');
    intro.replaceChildren();

    const scene =
      document.createElement('div');

    scene.className =
      'home-v4-scene';

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

      <div
        class="home-v5-network"
        aria-hidden="true"
      >
        <span class="home-v5-node home-v5-node-a"></span>
        <span class="home-v5-node home-v5-node-b"></span>
        <span class="home-v5-node home-v5-node-c"></span>
        <span class="home-v5-node home-v5-node-d"></span>

        <span class="home-v5-link home-v5-link-a"></span>
        <span class="home-v5-link home-v5-link-b"></span>
        <span class="home-v5-link home-v5-link-c"></span>
      </div>
    `;

    const shell =
      document.createElement('div');

    shell.className =
      'home-v4-shell';

   shell.innerHTML = `
  <header class="home-v4-topbar">

    <div
      class="home-v4-brand"
      aria-label="Relay Runner"
    >
      <span class="home-v4-brand-mark">
        R/
      </span>

      <span>
        RELAY RUNNER
      </span>
    </div>

    <div class="home-v4-topbar-right">

      <div
        class="home-v4-credits"
        aria-label="Credits"
      >
        <span
          class="home-v4-credits-icon"
          aria-hidden="true"
        >
          ◈
        </span>

        <span class="home-v4-credits-data">
          <small>NETWORK CREDITS</small>
          <strong id="homeV4Credits">0</strong>
        </span>
      </div>

      <div
        class="home-v4-status"
        aria-label="System status"
      >
        <span class="home-v4-status-dot"></span>

        <b>RELAY ACTIVE</b>

        <span>NIGHT PROTOCOL</span>
      </div>

    </div>

  </header>


  <main class="home-v4-main">

    <section
      class="home-v4-copy"
      aria-labelledby="homeV4Title"
    >

      <p class="home-v4-kicker">
        SECTOR 01 / AFTER DARK
      </p>

      <h1
        id="homeV4Title"
        class="home-v4-title"
      >
        RELAY<span>RUNNER</span>
      </h1>

      <p class="home-v4-subline">
        CITY GRID // SIGNAL RECOVERY UNIT
      </p>

      <p class="home-v4-description home-v4-typewriter">
        <span id="homeV4Typewriter"></span>
        <span
          class="home-v4-cursor"
          aria-hidden="true"
        >
          ▌
        </span>
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
            class="home-v5-start-glow"
            aria-hidden="true"
          ></span>

          <span
            class="home-v5-start-scan"
            aria-hidden="true"
          ></span>

          <span
            class="home-v4-primary-content"
          >

            <span class="home-v5-start-main">

              <span
                class="home-v5-start-label"
              >
                DEPLOY RUN
              </span>

              <small
                class="home-v5-start-sub"
              >
                ENTER THE CITY GRID
              </small>

            </span>

            <span
              class="home-v5-start-key"
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
            ONLINE
          </span>

        </button>


        <button
          id="continue"
          class="home-v4-secondary hidden"
          type="button"
          aria-label="Continue last run"
        >

          <span class="home-v5-continue-icon">
            ↻
          </span>

          <span class="home-v5-continue-copy">

            <strong>RESUME RUN</strong>

            <small>
              RETURN TO LAST POSITION
            </small>

          </span>

          <span
            class="home-v5-continue-arrow"
            aria-hidden="true"
          >
            →
          </span>

        </button>

      </div>


      <p class="home-v4-micro">
        <b>ROUTE LOCKED</b>
        · ENTER TO DEPLOY
      </p>


      <div
        class="home-v5-relay-status"
        aria-label="Relay deployment status"
      >

        <div
          class="home-v5-relay-status-head"
        >

          <span
            class="home-v5-relay-status-title"
          >
            &gt; CITY GRID STATUS
          </span>

          <span
            class="home-v5-relay-status-live"
          >
            <i aria-hidden="true"></i>
            CONNECTED
          </span>

        </div>


        <div
          class="home-v5-relay-status-track"
          aria-hidden="true"
        >
          <span></span>
        </div>


        <div
          class="home-v5-relay-status-meta"
        >

          <span>
            <small>SECTOR</small>
            <b>01</b>
          </span>

          <span>
            <small>ROUTE</small>
            <b>OPEN</b>
          </span>

          <span>
            <small>LINK</small>
            <b>STABLE</b>
          </span>

        </div>

      </div>


      <article
        class="home-v4-contract"
        aria-label="Active contract"
      >

        <div
          class="home-v4-contract-head"
        >

          <div>

            <span
              class="home-v4-contract-kicker"
            >
              CURRENT ASSIGNMENT
            </span>

            <strong
              id="homeV4ContractType"
            >
              CONTRACT // ACTIVE
            </strong>

          </div>

          <span
            id="homeV4ContractStatus"
            class="home-v4-contract-status"
          >
            AVAILABLE
          </span>

        </div>


        <div
          class="home-v4-contract-main"
        >

          <span
            id="homeV4ContractCode"
            class="home-v4-contract-code"
          >
            CONTRACT // SCANNING
          </span>

          <h3
            id="homeV4ContractTitle"
            class="home-v4-contract-title"
          >
            WAITING FOR ASSIGNMENT
          </h3>

          <p
            id="homeV4ContractDescription"
            class="home-v4-contract-description"
          >
            CONTRACT DATA WILL APPEAR WHEN THE NETWORK IS READY.
          </p>

        </div>


        <div
          class="home-v4-contract-meta"
        >

          <div>
            <small>TARGET</small>

            <b
              id="homeV4ContractMission"
            >
              —
            </b>
          </div>

          <div>
            <small>XP PAYOUT</small>

            <b
              id="homeV4ContractReward"
            >
              +0 XP
            </b>
          </div>

          <div>
            <small>CREDITS</small>

            <b
              id="homeV4ContractCredits"
            >
              +0 CREDITS
            </b>
          </div>

        </div>


        <div
          class="home-v4-contract-bottom"
        >

          <span>
            CONTRACT CHANNEL // OPEN
          </span>

          <button
            type="button"
            class="home-v4-contract-button"
            data-home-v4-action="contracts"
          >
            VIEW ASSIGNMENT

            <span aria-hidden="true">
              →
            </span>
          </button>

        </div>

      </article>

    </section>


    <section
      class="home-v4-mission-wrap"
      aria-label="Current mission"
    >


      <aside
        class="home-v5-live-feed"
        aria-label="Relay network status"
      >

        <div class="home-v5-panel-head">
          <span>CITY GRID</span>

          <b>
            <i></i>
            CONNECTED
          </b>
        </div>


        <div class="home-v5-network-status">

          <div class="home-v5-network-row">
            <span>
              <i></i>
              MAIN CORE
            </span>

            <strong>STABLE</strong>
          </div>


          <div class="home-v5-network-row">
            <span>
              <i></i>
              SIGNAL GRID
            </span>

            <strong>ACTIVE</strong>
          </div>


          <div class="home-v5-network-row">
            <span>
              <i></i>
              RUNNER ROUTE
            </span>

            <strong>OPEN</strong>
          </div>


          <div class="home-v5-network-row">
            <span>
              <i></i>
              CITY LINK
            </span>

            <strong>SECURE</strong>
          </div>

        </div>


        <div class="home-v5-feed-line">

          <span>&gt;</span>

          <strong id="homeV5LastRunFeed">
            TELEMETRY // AWAITING RUN
          </strong>

        </div>

      </aside>


      <article
        class="home-v4-mission"
      >

        <div
          class="home-v4-mission-head"
        >

          <span
            class="home-v4-mission-label"
          >
            PRIMARY ROUTE
          </span>

          <span
            class="home-v4-mission-code"
          >
            GRID-01 / AFTER DARK
          </span>

        </div>


        <h2
          class="home-v4-mission-title"
        >
          BREAK<br>
          THE GRID
        </h2>


        <p
          class="home-v4-mission-sub"
        >
          CROSS THE DISTRICT, RECOVER THE SIGNALS
          AND RECONNECT THE CITY RELAY.
        </p>


        <div
          class="home-v5-last-run"
        >

          <div
            class="home-v5-last-run-head"
          >

            <span>RUN TELEMETRY</span>

            <b>LAST SESSION</b>

          </div>


          <div
            class="home-v5-telemetry-grid"
          >

            <div>
              <small>DURATION</small>
              <strong id="homeV5RunTime">—</strong>
            </div>

            <div>
              <small>RECOVERED</small>
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


        <div
          class="home-v4-stat-grid"
        >

          <div
            class="home-v4-stat"
          >

            <small>LAST PAYOUT</small>

            <b
              id="homeV4MissionXp"
            >
              +0
            </b>

          </div>


          <div
            class="home-v4-stat"
          >

            <small>BEST CLEAR</small>

            <b
              id="homeV4BestRating"
            >
              —
            </b>

          </div>

        </div>

      </article>


      <article
        class="home-v4-daily"
        aria-label="Daily operation"
      >

        <div
          class="home-v4-daily-head"
        >

          <div>

            <span
              class="home-v4-daily-kicker"
            >
              DAILY DIRECTIVE
            </span>

            <strong>
              CITYWIDE OBJECTIVE
            </strong>

          </div>

          <span
            id="homeV4DailyStatus"
            class="home-v4-daily-status"
          >
            IN PROGRESS
          </span>

        </div>


        <div
          class="home-v4-daily-main"
        >

          <span
            class="home-v4-daily-code"
          >
            DAILY // DIRECTIVE CHANNEL
          </span>

          <h3
            id="homeV4DailyTitle"
            class="home-v4-daily-title"
          >
            SCANNING DAILY DIRECTIVE
          </h3>

          <p
            id="homeV4DailyDescription"
            class="home-v4-daily-description"
          >
            SYNCHRONIZING TODAY'S NETWORK OBJECTIVE...
          </p>

        </div>


        <div
          class="home-v4-daily-progress"
        >

          <div
            class="home-v4-daily-progress-meta"
          >

            <span>COMPLETION</span>

            <strong
              id="homeV4DailyProgress"
            >
              0 / 0
            </strong>

          </div>


          <div
            class="home-v4-daily-progress-track"
            aria-hidden="true"
          >

            <i
              id="homeV4DailyProgressFill"
              style="width:0%"
            ></i>

          </div>

        </div>


        <div
          class="home-v4-daily-bottom"
        >

          <div
            class="home-v4-daily-rewards"
          >

            <div>
              <small>XP BONUS</small>

              <b
                id="homeV4DailyReward"
              >
                +0 XP
              </b>
            </div>


            <div>
              <small>CREDIT BONUS</small>

              <b
                id="homeV4DailyCredits"
              >
                +0 CREDITS
              </b>
            </div>

          </div>


          <button
            type="button"
            class="home-v4-daily-button"
            data-home-v4-action="daily"
          >
            VIEW DIRECTIVES

            <span aria-hidden="true">
              →
            </span>
          </button>

        </div>

      </article>


      <article
        class="home-v4-unlock"
        aria-label="Next unlock"
      >

        <div class="home-v4-unlock-head">

          <span>
            NEXT SECTOR
          </span>

          <b id="homeV4UnlockLevel">
            LV 08
          </b>

        </div>


        <h3 id="homeV4UnlockTitle">
          SECTOR 02 // SKYLINE
        </h3>


        <p id="homeV4UnlockDesc">
          BUILD ENOUGH EXPERIENCE TO ACCESS
          THE NEXT CITY ROUTE.
        </p>


        <div
          class="home-v4-unlock-progress"
        >

          <div
            class="home-v4-unlock-meta"
          >

            <span>
              ACCESS PROGRESS
            </span>

            <strong
              id="homeV4UnlockText"
            >
              0%
            </strong>

          </div>


          <div
            class="home-v4-unlock-bar"
          >

            <i
              id="homeV4UnlockFill"
              style="width:0%"
            ></i>

          </div>

        </div>

      </article>


      <div
        class="home-v4-activity"
        aria-label="Recent activity"
      >

        <div class="home-v4-activity-head">

          <span>
            NETWORK ACTIVITY
          </span>

          <b>
            LIVE TELEMETRY
          </b>

        </div>


        <div
          class="home-v4-activity-list"
        >

          <div class="home-v4-activity-item">

            <span
              class="home-v4-activity-dot"
            ></span>

            <div>

              <strong
                id="homeV4ActivityOne"
              >
                CITY GRID READY
              </strong>

              <small
                id="homeV4ActivityOneMeta"
              >
                CHANNEL 01 // STANDING BY
              </small>

            </div>

          </div>


          <div class="home-v4-activity-item">

            <span
              class="home-v4-activity-dot"
            ></span>

            <div>

              <strong
                id="homeV4ActivityTwo"
              >
                SIGNAL SEARCH ACTIVE
              </strong>

              <small
                id="homeV4ActivityTwoMeta"
              >
                RECOVERY NETWORK // ONLINE
              </small>

            </div>

          </div>


          <div class="home-v4-activity-item">

            <span
              class="home-v4-activity-dot"
            ></span>

            <div>

              <strong
                id="homeV4ActivityThree"
              >
                ASSIGNMENT CHANNEL OPEN
              </strong>

              <small
                id="homeV4ActivityThreeMeta"
              >
                CONTRACT SYSTEM // READY
              </small>

            </div>

          </div>

        </div>

      </div>


      <div class="home-v4-badge">
        CITY GRID // CHANNEL 01 // LIVE
      </div>


      <aside
        class="home-v4-profile"
        aria-label="Runner profile"
      >

        <div
          class="home-v4-profile-head"
        >

          <div>

            <span
              class="home-v4-profile-kicker"
            >
              RUNNER DATA
            </span>

            <strong>
              FIELD PROFILE
            </strong>

          </div>

          <span
            class="home-v4-profile-live"
          >
            ACTIVE
          </span>

        </div>


        <div
          class="home-v4-profile-rank"
        >

          <div>

            <small>
              CURRENT RANK
            </small>

            <b id="homeV4Rank">
              ROOKIE
            </b>

          </div>


          <div>

            <small>
              LEVEL
            </small>

            <b id="homeV4Level">
              01
            </b>

          </div>

        </div>


        <div
          class="home-v4-profile-xp"
        >

          <div
            class="home-v4-profile-xp-meta"
          >

            <span>
              EXPERIENCE
            </span>

            <strong id="homeV4XpText">
              0 / 100
            </strong>

          </div>


          <div
            class="home-v4-profile-xp-track"
          >

            <i
              id="homeV4XpFill"
              style="width:0%"
            ></i>

          </div>

        </div>


        <div
          class="home-v4-profile-stats"
        >

          <div>

            <small>
              HIGH SCORE
            </small>

            <b id="homeV4BestRun">
              0
            </b>

          </div>


          <div>

            <small>
              RUNS COMPLETED
            </small>

            <b id="homeV4Runs">
              0
            </b>

          </div>


          <div>

            <small>
              SIGNALS
            </small>

            <b id="homeV4Signals">
              0
            </b>

          </div>

        </div>


        <div
          class="home-v4-profile-footer"
        >

          <span>
            RUNNER STATUS
          </span>

          <b>
            FIELD READY
          </b>

        </div>

      </aside>

    </section>

  </main>


  <footer
    class="home-v4-bottom"
  >

    <div
      class="home-v4-bottom-left"
    >

      <button
        class="home-v4-utility"
        type="button"
        data-home-v4-action="faq"
        aria-label="Open FAQ"
      >
        ? &nbsp;FIELD GUIDE
      </button>


      <button
        class="home-v4-utility"
        type="button"
        data-home-v4-action="update"
        aria-label="Open latest update"
      >
        ↗ &nbsp;PATCH NOTES
      </button>


      <button
        class="home-v4-utility home-v4-tutorial"
        type="button"
        data-home-v4-action="tutorial"
        aria-label="Open tutorial"
      >
        ◉ &nbsp;TRAINING
      </button>


      <button
        class="home-v4-utility"
        type="button"
        data-home-v4-action="options"
        aria-label="Open options"
      >
        ⚙ &nbsp;SYSTEM
      </button>

    </div>


    <div
      class="home-v4-bottom-meta"
    >
      CITY GRID
      <b>CONNECTED</b>
      · BUILD 1.1.0
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

    intro.append(
      scene,
      shell
    );

    // The intro is the actual home screen. It starts hidden in index.html
    // only to prevent the empty shell from blocking interaction before
    // this module has constructed the real UI.
    intro.hidden = false;
    intro.removeAttribute('hidden');
    intro.classList.remove('hidden');
    intro.setAttribute('aria-hidden', 'false');
    intro.style.setProperty('visibility', 'visible', 'important');
    intro.style.setProperty('opacity', '1', 'important');
    intro.style.setProperty('pointer-events', 'auto', 'important');

    /* =========================================================
       HOME V5 COMMAND ROW
       ========================================================= */

    const homeCopy =
      shell.querySelector(
        '.home-v4-copy'
      );

    const homeActions =
      shell.querySelector(
        '.home-v4-actions'
      );

    const homeDaily =
      shell.querySelector(
        '.home-v4-daily'
      );

    if (
      homeCopy instanceof HTMLElement &&
      homeActions instanceof HTMLElement &&
      homeDaily instanceof HTMLElement
    ) {
      const commandRow =
        document.createElement('div');

      commandRow.className =
        'home-v5-command-row';

      homeCopy.insertBefore(
        commandRow,
        homeActions
      );

      commandRow.append(
        homeActions,
        homeDaily
      );
    }

    /* =========================================================
       HOME V6 MISSION NETWORK
       ========================================================= */

    const missionNetwork =
      document.createElement('section');

    missionNetwork.className =
      'home-v6-mission-network';

    missionNetwork.setAttribute(
      'aria-label',
      'Mission network'
    );

    missionNetwork.innerHTML = `
      <div class="home-v6-mission-head">
        <div>
          <span>MISSION NETWORK</span>
          <strong>FOUR ROUTES // ONE CITY</strong>
        </div>
        <b data-home-v6-progress>0 / 4 ONLINE</b>
      </div>

      <div class="home-v6-mission-grid">
        <article data-home-mission="0">
          <span>01</span>
          <div><strong>ROOFTOP BREACH</strong><small>EAST DISTRICT · HIGH</small></div>
          <b>READY</b>
        </article>
        <article data-home-mission="1">
          <span>02</span>
          <div><strong>NIGHT RUN</strong><small>NORTH SECTOR · CRITICAL</small></div>
          <b>LOCKED</b>
        </article>
        <article data-home-mission="2">
          <span>03</span>
          <div><strong>DEAD DROP</strong><small>WEST DISTRICT · EXTREME</small></div>
          <b>LOCKED</b>
        </article>
        <article data-home-mission="3">
          <span>04</span>
          <div><strong>BLACK OUT</strong><small>SOUTH SECTOR · HIGH</small></div>
          <b>LOCKED</b>
        </article>
      </div>
    `;

    homeCopy?.append(missionNetwork);

    /* =========================================================
       HOME V7 OPERATIONS TELEMETRY
       Uses only persisted runtime state; no placeholder values.
       ========================================================= */

    const operationsPanel =
      document.createElement('section');

    operationsPanel.className =
      'home-v7-operations';

    operationsPanel.setAttribute(
      'aria-label',
      'Operations telemetry'
    );

    operationsPanel.innerHTML = `
      <div class="home-v7-head">
        <div>
          <span>OPERATIONS TELEMETRY</span>
          <strong>LIVE RUNNER RECORD</strong>
        </div>
        <b>LOCAL SAVE</b>
      </div>

      <div class="home-v7-grid">
        <article>
          <small>TOTAL RUNS</small>
          <strong data-home-v7="runs">0</strong>
        </article>
        <article>
          <small>SIGNALS RECOVERED</small>
          <strong data-home-v7="signals">0</strong>
        </article>
        <article>
          <small>NETWORK CREDITS</small>
          <strong data-home-v7="credits">0</strong>
        </article>
        <article>
          <small>BEST SCORE</small>
          <strong data-home-v7="best">0</strong>
        </article>
      </div>

      <div class="home-v7-foot">
        <span>COMPLETED ROUTES</span>
        <strong data-home-v7="completed">0</strong>
        <span>UNLOCKED ROUTES</span>
        <strong data-home-v7="unlocked">0</strong>
      </div>
    `;

    homeCopy?.append(operationsPanel);

    const operationsStyle =
      document.createElement('style');

    operationsStyle.textContent = `
      #intro.home-v3{
        overflow-x:hidden !important;
        overflow-y:auto !important;
        -webkit-overflow-scrolling:touch;
        overscroll-behavior-y:contain;
        scrollbar-gutter:stable;
      }
      #intro.home-v3 .home-v4-scene{
        position:fixed !important;
        inset:0 !important;
        pointer-events:none !important;
        z-index:0 !important;
      }
      #intro.home-v3 .home-v4-shell{
        z-index:1 !important;
        pointer-events:auto !important;
      }
      #intro.home-v3 .home-v4-shell *,
      #intro.home-v3 .home-v4-shell button,
      #intro.home-v3 .home-v4-shell a,
      #intro.home-v3 .home-v4-shell [role="button"]{
        pointer-events:auto !important;
      }
      #intro.home-v3 .home-v4-shell{
        position:relative !important;
        min-height:100% !important;
        height:auto !important;
      }
      #intro.home-v3 .home-v4-main{
        min-height:calc(100vh - 150px);
        height:auto !important;
      }
      #intro.home-v3 .home-v4-copy{
        padding-bottom:clamp(120px,15vh,220px);
      }
      .home-v7-operations{
        width:100%;
        margin-top:12px;
        padding:14px;
        box-sizing:border-box;
        border:1px solid rgba(100,220,235,.14);
        background:rgba(2,8,13,.82);
        font-family:Orbitron,sans-serif;
      }
      .home-v7-head{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        margin-bottom:10px;
      }
      .home-v7-head div{display:grid;gap:3px;}
      .home-v7-head span{font-size:8px;letter-spacing:.18em;color:#7deaff;}
      .home-v7-head strong{font-size:11px;letter-spacing:.08em;color:#eefcff;}
      .home-v7-head>b{font-size:7px;letter-spacing:.14em;color:#39ff88;}
      .home-v7-grid{
        display:grid;
        grid-template-columns:repeat(4,minmax(0,1fr));
        gap:7px;
      }
      .home-v7-grid article{
        min-width:0;
        padding:10px;
        border:1px solid rgba(100,220,235,.08);
        background:rgba(4,14,20,.72);
        display:grid;
        gap:5px;
      }
      .home-v7-grid small,.home-v7-foot span{
        font-size:7px;
        letter-spacing:.1em;
        color:rgba(214,239,244,.56);
      }
      .home-v7-grid strong{
        font-size:14px;
        color:#eafcff;
        overflow:hidden;
        text-overflow:ellipsis;
      }
      .home-v7-foot{
        display:flex;
        align-items:center;
        gap:9px;
        margin-top:9px;
        padding-top:9px;
        border-top:1px solid rgba(100,220,235,.08);
      }
      .home-v7-foot strong{
        color:#55dff0;
        font-size:9px;
        margin-right:auto;
      }
      @media(max-width:700px){
        #intro.home-v3 .home-v4-main{min-height:0;}
        #intro.home-v3 .home-v4-copy{padding-bottom:150px;}
        .home-v7-grid{grid-template-columns:repeat(2,minmax(0,1fr));}
        .home-v7-foot{flex-wrap:wrap;}
        .home-v7-foot strong{margin-right:4px;}
      }
    `;

    document.head.append(operationsStyle);

    const syncOperationsTelemetry = state => {
      const completed =
        Array.isArray(state?.completed)
          ? state.completed.length
          : 0;

      const unlocked =
        Array.isArray(state?.unlockedMissions)
          ? state.unlockedMissions.length
          : 0;

      const values = {
        runs: Number(state?.totalRuns) || 0,
        signals: Number(state?.signals) || 0,
        credits: Number(state?.credits) || 0,
        best: Number(state?.bestRun) || 0,
        completed,
        unlocked
      };

      operationsPanel
        .querySelectorAll('[data-home-v7]')
        .forEach(el => {
          const key = el.dataset.homeV7;
          el.textContent =
            Number(values[key] || 0).toLocaleString();
        });
    };

    window.__relaySyncOperationsTelemetry =
      syncOperationsTelemetry;

    const missionNetworkStyle =
      document.createElement('style');

    missionNetworkStyle.textContent = `
      .home-v6-mission-network{
        width:100%;
        margin-top:18px;
        padding:14px;
        border:1px solid rgba(100,220,235,.16);
        background:linear-gradient(145deg,rgba(3,11,16,.88),rgba(2,6,10,.94));
        box-shadow:inset 0 0 28px rgba(0,190,255,.025),0 12px 32px rgba(0,0,0,.28);
        box-sizing:border-box;
      }
      .home-v6-mission-head{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:14px;
        margin-bottom:10px;
        font-family:Orbitron,sans-serif;
      }
      .home-v6-mission-head div{display:grid;gap:3px;}
      .home-v6-mission-head span{color:#7deaff;font-size:9px;letter-spacing:.18em;}
      .home-v6-mission-head strong{color:#eafcff;font-size:12px;letter-spacing:.08em;}
      .home-v6-mission-head>b{color:#39ff88;font-size:9px;letter-spacing:.1em;white-space:nowrap;}
      .home-v6-mission-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;}
      .home-v6-mission-grid article{
        min-width:0;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:9px;
        padding:10px;border:1px solid rgba(100,220,235,.10);background:rgba(4,14,20,.72);font-family:Orbitron,sans-serif;
      }
      .home-v6-mission-grid article>span{color:#55dff0;font-size:10px;font-weight:800;}
      .home-v6-mission-grid article div{min-width:0;display:grid;gap:3px;}
      .home-v6-mission-grid article strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#f3fbff;font-size:10px;letter-spacing:.04em;}
      .home-v6-mission-grid article small{color:rgba(214,239,244,.58);font-size:7px;letter-spacing:.08em;}
      .home-v6-mission-grid article>b{color:#ffd75c;font-size:7px;letter-spacing:.08em;}
      .home-v6-mission-grid article.is-complete{border-color:rgba(57,255,136,.28);}
      .home-v6-mission-grid article.is-complete>b{color:#39ff88;}
      @media(max-width:700px){.home-v6-mission-grid{grid-template-columns:1fr;}.home-v6-mission-head{align-items:flex-start;}.home-v6-mission-head strong{font-size:10px;}}
    `;

    document.head.append(missionNetworkStyle);

    const syncMissionNetwork = state => {
      const completed =
        Array.isArray(state?.completed)
          ? state.completed
          : [];

      missionNetwork.querySelectorAll('[data-home-mission]').forEach((card,index)=>{
        const done = completed.includes(index);
        card.classList.toggle('is-complete',done);
        const status=card.querySelector('b');
        if(status) status.textContent=done?'COMPLETE':index===0?'READY':'LOCKED';
      });

      const progress=missionNetwork.querySelector('[data-home-v6-progress]');
      if(progress) progress.textContent=`${Math.min(4,completed.length)} / 4 ONLINE`;
    };

    window.__relaySyncMissionNetwork = syncMissionNetwork;
    window.__relaySyncOperationsTelemetry?.(state);

    /* =========================================================
       TYPEWRITER / STATE
       ========================================================= */

    startHomeTypewriter();
    syncHomeProfile();

    /* =========================================================
       STABLE HOME BUTTON EVENTS
       ========================================================= */

    shell.addEventListener(
      'click',
      event => {
        const target =
          event.target instanceof Element
            ? event.target.closest(
                '[data-home-v4-action]'
              )
            : null;

        if (!(target instanceof HTMLElement)) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        const action =
          target.dataset.homeV4Action;

        switch (action) {

          case 'faq':
            openFaq();
            break;

          case 'update':
            openUpdate();
            break;

          case 'tutorial':
            openHomeTutorial();
            break;

          case 'options':
            openOptions();
            break;

          case 'daily': {
            const challengeTab =
              document.querySelector(
                '#pauseMenu [data-tab="challenges"]'
              );

            if (
              challengeTab instanceof HTMLElement
            ) {
              HTMLElement.prototype.click.call(
                challengeTab
              );

              break;
            }

            const fallback =
              document.querySelector(
                '[data-relay-info="challenges"]'
              );

            if (
              fallback instanceof HTMLElement
            ) {
              HTMLElement.prototype.click.call(
                fallback
              );
            }

            break;
          }

          case 'contracts':
            if (
              typeof window.relayOpenContracts ===
              'function'
            ) {
              window.relayOpenContracts();
            } else {
              console.error(
                '[RelayRunner] Contracts API not ready'
              );
            }
            break;

          default:
            break;
        }
      }
    );

/* =========================================================
   GAMEPLAY MUSIC
   HOME -> PLAY
   ========================================================= */

const gameplayMusicTracks = [
  new URL('./assets/audio/music.mp3', import.meta.url).href,
  new URL('./assets/audio/music2.mp3', import.meta.url).href,
  new URL('./assets/audio/music3.mp3', import.meta.url).href
];

let relayGameplayAudio = null;
let relayGameplayAudioStarted = false;
let relayGameplayTrackIndex = 0;
let relayGameplayFadeFrame = null;

const gameplayTargetVolume = 0.58;

const clampVolume = value =>
  Math.max(
    0,
    Math.min(
      1,
      Number.isFinite(value)
        ? value
        : 0
    )
  );

const startGameplayMusic = async () => {
  try {
    try {
      window.relayAdaptiveMusic?.stop?.();
      window.relayMenuMusic?.stop?.();
    } catch {}

    if (!relayGameplayAudio) {
      relayGameplayAudio =
        new Audio(
          gameplayMusicTracks[
            relayGameplayTrackIndex
          ]
        );

      relayGameplayAudio.loop = false;
      relayGameplayAudio.preload = 'auto';
      relayGameplayAudio.volume = 0;

      relayGameplayAudio.addEventListener(
        'ended',
        () => {
          void playNextGameplayTrack();
        }
      );
    }

    if (
      relayGameplayAudioStarted &&
      !relayGameplayAudio.paused
    ) {
      return;
    }

    if (!relayGameplayAudioStarted) {
      relayGameplayAudio.currentTime = 0;
      relayGameplayAudio.volume = 0;
    }

    await relayGameplayAudio.play();

    relayGameplayAudioStarted = true;

    if (relayGameplayFadeFrame) {
      cancelAnimationFrame(
        relayGameplayFadeFrame
      );
    }

    const duration = 900;
    const startTime = performance.now();

    const fadeIn = now => {
      if (!relayGameplayAudio) {
        return;
      }

      const rawProgress =
        (now - startTime) / duration;

      const progress =
        Math.max(
          0,
          Math.min(
            1,
            rawProgress
          )
        );

      relayGameplayAudio.volume =
        clampVolume(
          gameplayTargetVolume * progress
        );

      if (progress < 1) {
        relayGameplayFadeFrame =
          requestAnimationFrame(
            fadeIn
          );
      } else {
        relayGameplayFadeFrame = null;
      }
    };

    relayGameplayFadeFrame =
      requestAnimationFrame(
        fadeIn
      );

  } catch (error) {
    console.warn(
      '[RelayRunner] Gameplay MP3 could not start:',
      error
    );
  }
};

const playNextGameplayTrack = async () => {
  try {
    if (!relayGameplayAudio) {
      return;
    }

    relayGameplayTrackIndex =
      (
        relayGameplayTrackIndex + 1
      ) %
      gameplayMusicTracks.length;

    relayGameplayAudio.src =
      gameplayMusicTracks[
        relayGameplayTrackIndex
      ];

    relayGameplayAudio.currentTime = 0;
    relayGameplayAudio.volume = 0;

    await relayGameplayAudio.play();

    relayGameplayAudioStarted = true;

    const duration = 900;
    const startTime = performance.now();

    const fadeIn = now => {
      if (!relayGameplayAudio) {
        return;
      }

      const progress =
        Math.max(
          0,
          Math.min(
            1,
            (now - startTime) / duration
          )
        );

      relayGameplayAudio.volume =
        clampVolume(
          gameplayTargetVolume * progress
        );

      if (progress < 1) {
        relayGameplayFadeFrame =
          requestAnimationFrame(
            fadeIn
          );
      } else {
        relayGameplayFadeFrame = null;
      }
    };

    if (relayGameplayFadeFrame) {
      cancelAnimationFrame(
        relayGameplayFadeFrame
      );
    }

    relayGameplayFadeFrame =
      requestAnimationFrame(
        fadeIn
      );

  } catch (error) {
    console.warn(
      '[RelayRunner] Next gameplay track could not start:',
      error
    );

    setTimeout(
      () => {
        void playNextGameplayTrack();
      },
      250
    );
  }
};

window.relayGameplayAudio = {
  play: startGameplayMusic,

  pause() {
    try {
      relayGameplayAudio?.pause?.();
    } catch {}
  },

  resume() {
    try {
      if (
        relayGameplayAudio &&
        relayGameplayAudio.paused
      ) {
        void relayGameplayAudio.play();
      }
    } catch {}
  },

  stop() {
    try {
      if (relayGameplayFadeFrame) {
        cancelAnimationFrame(
          relayGameplayFadeFrame
        );

        relayGameplayFadeFrame = null;
      }

      relayGameplayAudio?.pause?.();

      if (relayGameplayAudio) {
        relayGameplayAudio.currentTime = 0;
        relayGameplayAudio.volume = 0;
      }

      relayGameplayAudioStarted = false;
      relayGameplayTrackIndex = 0;

    } catch {}
  },

  setVolume(value) {
    try {
      if (relayGameplayAudio) {
        relayGameplayAudio.volume =
          clampVolume(value);
      }
    } catch {}
  }
};

/* =========================================================
   START
   ========================================================= */

const start =
  shell.querySelector('#start');

forceStartVisible(start);

if (start instanceof HTMLElement) {
  start.addEventListener(
    'click',
    event => {
      event.preventDefault();
      event.stopImmediatePropagation();

      try {
        /*
         * Kill the old procedural game audio immediately.
         * Main exposes this after its module loads.
         */
        window.relayProceduralAudio?.stop?.();

        /*
         * Start the MP3 immediately on the trusted click.
         */
        void startGameplayMusic();

        const loader =
          window.relayPlayDeploymentV1;

        if (
          loader &&
          typeof loader.show === 'function'
        ) {
          void loader.show({
            missionNumber: 1,

            desktop:
              './assets/loadplay.jpg',

            mobile:
              './assets/loadplaymobile.jpg',

            skipRoute: true,

            beforeRoute: async () => {
              if (
                typeof window.relayLaunchGameplay ===
                'function'
              ) {
                window.relayLaunchGameplay();
              }
            }
          });

          return;
        }

        const target =
          document.querySelector(
            'body > #game > div[hidden] #start'
          );

        if (
          target instanceof HTMLElement
        ) {
          HTMLElement.prototype.click.call(
            target
          );
        }

      } catch (error) {
        console.error(
          '[RelayRunner] Deployment loader error:',
          error
        );
      }
    }
  );
}

    /* =========================================================
       CONTINUE
       ========================================================= */

    const continueButton =
      shell.querySelector('#continue');

    const syncContinue = () => {
      if (
        !(continueButton instanceof HTMLElement)
      ) {
        return;
      }

      continueButton.classList.remove(
        'hidden'
      );

      continueButton.removeAttribute(
        'hidden'
      );

      continueButton.style.setProperty(
        'display',
        'inline-flex',
        'important'
      );

      continueButton.style.setProperty(
        'visibility',
        'visible',
        'important'
      );

      continueButton.style.setProperty(
        'opacity',
        '1',
        'important'
      );

      continueButton.style.setProperty(
        'pointer-events',
        'auto',
        'important'
      );
    };

    syncContinue();

    if (
      sourceContinue instanceof HTMLElement &&
      sourceContinue !== continueButton &&
      !sourceContinue.dataset.homeV4Observed
    ) {
      sourceContinue.dataset.homeV4Observed =
        '1';

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

    if (
      continueButton instanceof HTMLElement
    ) {
      continueButton.addEventListener(
        'click',
        event => {
          event.preventDefault();
          event.stopPropagation();

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
    }
  };

  /* =========================================================
     REDUCED DESKTOP MOTION
     ========================================================= */

  const installDesktopCalmMode = () => {
    const root =
      document.documentElement;

    if (
      root.dataset.homeV4CalmMode === '1'
    ) {
      return;
    }

    root.dataset.homeV4CalmMode = '1';

    const apply = () => {
      const desktop =
        window.innerWidth >= 769;

      document.body.classList.toggle(
        'home-v4-desktop-calm',
        desktop
      );
    };

    apply();

    window.addEventListener(
      'resize',
      apply,
      {
        passive: true
      }
    );
  };

  /* =========================================================
     HOME SCROLL STATUS
     ========================================================= */

  const installHomeScrollStatus = () => {
    if (
      document.documentElement.dataset
        .homeScrollStatus === '1'
    ) {
      return;
    }

    document.documentElement.dataset
      .homeScrollStatus = '1';

    let lastScrollY =
      window.scrollY;

    window.addEventListener(
      'scroll',
      () => {
        const intro =
          $('intro');

        if (
          !(intro instanceof HTMLElement)
        ) {
          return;
        }

        const currentScrollY =
          window.scrollY;

        if (
          currentScrollY > lastScrollY &&
          currentScrollY > 10
        ) {
          intro.classList.add(
            'is-scrolling'
          );
        }

        if (
          currentScrollY < lastScrollY
        ) {
          intro.classList.remove(
            'is-scrolling'
          );
        }

        lastScrollY =
          currentScrollY;
      },
      {
        passive: true
      }
    );
  };

  /* =========================================================
     KEYBOARD
     ========================================================= */

  const installKeyboard = () => {
    if (
      document.documentElement.dataset
        .homeV4Keys === '1'
    ) {
      return;
    }

    document.documentElement.dataset
      .homeV4Keys = '1';

    document.addEventListener(
      'keydown',
      event => {
        if (
          !introVisible() ||
          event.repeat
        ) {
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

            clickExisting(
              '#start'
            );
          }
        }

        if (event.key === 'Escape') {
          closeHomePanels();
        }
      }
    );
  };

  /* =========================================================
     BOOT
     ========================================================= */

  const boot = () => {
    buildHome();
    setHomeState();
    installKeyboard();
    installDesktopCalmMode();
    installHomeScrollStatus();

    const intro =
      $('intro');

    if (
      intro &&
      intro.dataset.homeV4Observed !== '1'
    ) {
      intro.dataset.homeV4Observed =
        '1';

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
      {
        once: true
      }
    );
  } else {
    boot();
  }

})();

