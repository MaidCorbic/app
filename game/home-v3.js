/*
 * Runner Relay — Home V4 presentation owner.
 *
 * Contract:
 * - Home owns presentation only.
 * - #start / #continue remain the authoritative gameplay entry points.
 * - Options / FAQ / Update remain owned by existing systems.
 * - The intro surface is rebuilt once, without duplicating gameplay UI.
 */

import { RELAY_FAQ } from './faq.js';

// Load the complete desktop Home presentation before buildHome() runs.
// These layers are also imported by the optional finishing module, but Home
// must not depend on that later module to receive its desktop composition.
import './home-v5-refinement-v1.css';
import './home-v5-composition-v1.css';
import './home-v5-final-layout-v1.css';

(() => {
  'use strict';

  if (window.__relayHomeV4) return;
  window.__relayHomeV4 = true;

  const $ = id => document.getElementById(id);

  let homeProfileStateAPI = null;
  let homeDailyChallengesAPI = null;
  let homeContractsAPI = null;

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

      /*
       * Home is presentation-only.
       *
       * The authoritative daily challenge
       * definitions and progress remain in
       * src/state.js.
       */
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

      /*
       * Home only reads contract definitions.
       * It does not create or own contract progression state.
       */
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

/* RECENT ACTIVITY */

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

  signalFillEl.style.width = `${signalProgress}%`;
}

/* NEXT UNLOCK */
const nextLevel = (level.level || 1) + 1;
const unlockProgress = xpProgress;

if (unlockLevelEl) {
  unlockLevelEl.textContent = `LV ${String(nextLevel).padStart(2, '0')}`;
}

if (unlockTitleEl) {
  unlockTitleEl.textContent = `SECTOR ${String(nextLevel).padStart(2, '0')} // SKYLINE`;
}

if (unlockTextEl) {
  unlockTextEl.textContent = `${unlockProgress}%`;
}

if (unlockFillEl) {
  unlockFillEl.style.width = `${unlockProgress}%`;
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
        syncHomeProfile();
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
        syncHomeProfile();
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
    } catch {}

    return clickExisting(
      '[data-title-panel="controls"]'
    );
  };

  const openFaq = () => {
  const panel =
    document.getElementById(
      'relayInfoPanel'
    );

  const eyebrow =
    document.getElementById(
      'relayInfoEyebrow'
    );

  const heading =
    document.getElementById(
      'relayInfoHeading'
    );

  const content =
    document.getElementById(
      'relayInfoContent'
    );

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
    panel.classList.remove('hidden');

    panel.classList.remove(
      'relay-update-mode'
    );

    panel.classList.add(
      'relay-faq-mode'
    );

    panel.setAttribute(
      'aria-hidden',
      'false'
    );

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
  
  const openUpdate = () => {
    console.log(
      '[RelayRunner] UPDATE CLICKED'
    );

    const panel =
      document.getElementById(
        'relayInfoPanel'
      );

    const eyebrow =
      document.getElementById(
        'relayInfoEyebrow'
      );

    const heading =
      document.getElementById(
        'relayInfoHeading'
      );

    const content =
      document.getElementById(
        'relayInfoContent'
      );

    try {
      if (
        typeof window.relayOpenInfo ===
        'function'
      ) {
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
    panel.classList.add(
      'relay-update-mode'
    );

    if (eyebrow instanceof HTMLElement) {
      eyebrow.textContent =
        'LATEST UPDATE';
    }

    if (heading instanceof HTMLElement) {
      heading.textContent =
        'UPDATE';
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

  /* =========================================================
     HOME PANEL // CREDITS
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

    return true;
  };

  /* =========================================================
     HOME PANEL // TUTORIAL
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

            const panel =
              article?.querySelector(
                '.tutorial-panel'
              );

            const indicator =
              button.querySelector('b');

            if (
              panel instanceof HTMLElement
            ) {
              panel.hidden = open;
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
    syncHomeProfile();
  };

    /* =========================================================
     HOME TYPEWRITER
     ========================================================= */

  
     /* =========================================================
     HOME TYPEWRITER LOOP
     ========================================================= */

  const startHomeTypewriter = () => {
    const target = $('homeV4Typewriter');

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
      if (!deleting) {
        if (index < text.length) {
          target.textContent += text.charAt(index);
          index += 1;

          window.setTimeout(run, typeSpeed);
          return;
        }

        deleting = true;

        window.setTimeout(run, pauseAfterTyping);
        return;
      }

      if (index > 0) {
        index -= 1;
        target.textContent = text.substring(0, index);

        window.setTimeout(run, deleteSpeed);
        return;
      }

      deleting = false;

      window.setTimeout(run, pauseAfterDeleting);
    };

    target.textContent = '';
    index = 0;
    deleting = false;

    run();
  };


  const bindOnce = (
    node,
    event,
    handler
  ) => {
    if (!(node instanceof HTMLElement)) {
      return;
    }

    const key =
      `homeV4Bound${event}`;

    if (
      node.dataset[key] === '1'
    ) {
      return;
    }

    node.dataset[key] = '1';

    node.addEventListener(
      event,
      handler
    );
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

    /*
     * Preserve references to the original
     * gameplay entry buttons.
     *
     * The existing game runtime owns their
     * actual gameplay behaviour.
     */
const sourceStart = $('start');
const sourceContinue = $('continue');

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

    <!-- CREDITS MOVED TO HOME FOOTER -->

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
      <small>CREDITS</small>
      <strong id="homeV4Credits">0</strong>
    </span>
  </div>

  <div
    class="home-v4-status"
    aria-label="System status"
  >
      <span class="home-v4-status-dot"></span>

      <b>SYSTEM ONLINE</b>

      <span>NIGHT SHIFT</span>
    </div>

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

         <p class="home-v4-description home-v4-typewriter">
  <span id="homeV4Typewriter"></span>
  <span class="home-v4-cursor" aria-hidden="true">▌</span>
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
          START RUN
        </span>

        <small
          class="home-v5-start-sub"
        >
          DEPLOY TO OLD QUARTER
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
      READY
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
      <strong>CONTINUE</strong>

      <small>
        RESUME LAST RUN
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
            <b>DEPLOYMENT READY</b>
            · PRESS ENTER TO BEGIN
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
                &gt; RELAY STATUS
              </span>

              <span
                class="home-v5-relay-status-live"
              >
                <i aria-hidden="true"></i>
                ONLINE
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
            <!-- =================================================
               ACTIVE CONTRACT
               ================================================= -->

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
                  ACTIVE CONTRACT
                </span>

                <strong
                  id="homeV4ContractType"
                >
                  CONTRACT // ONLINE
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
                CONTRACT // LOADING
              </span>

              <h3
                id="homeV4ContractTitle"
                class="home-v4-contract-title"
              >
                SCANNING CONTRACT NETWORK
              </h3>

              <p
                id="homeV4ContractDescription"
                class="home-v4-contract-description"
              >
                READING AVAILABLE CONTRACT DATA...
              </p>
            </div>

            <div
              class="home-v4-contract-meta"
            >
              <div>
                <small>
                  MISSION
                </small>

                <b
                  id="homeV4ContractMission"
                >
                  —
                </b>
              </div>

              <div>
                <small>
                  REWARD
                </small>

                <b
                  id="homeV4ContractReward"
                >
                  +0 XP
                </b>
              </div>

              <div>
                <small>
                  PAYLOAD
                </small>

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
                CONTRACT NETWORK // READY
              </span>

              <button
                type="button"
                class="home-v4-contract-button"
                data-home-v4-action="contracts"
              >
                OPEN CONTRACTS

                <span
                  aria-hidden="true"
                >
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
    <span>RELAY NETWORK</span>
    <b><i></i> LIVE</b>
  </div>

  <div class="home-v5-network-status">

    <div class="home-v5-network-row">
      <span>
        <i></i>
        CORE
      </span>

      <strong>ONLINE</strong>
    </div>

    <div class="home-v5-network-row">
      <span>
        <i></i>
        SIGNAL
      </span>

      <strong>STABLE</strong>
    </div>

    <div class="home-v5-network-row">
      <span>
        <i></i>
        CONTRACTS
      </span>

      <strong>READY</strong>
    </div>

    <div class="home-v5-network-row">
      <span>
        <i></i>
        CHANNEL
      </span>

      <strong>SECURE</strong>
    </div>

  </div>

  <div class="home-v5-feed-line">
    <span>&gt;</span>
    <strong id="homeV5LastRunFeed">
      LAST RUN // READY
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
                ACTIVE MISSION
              </span>

              <span
                class="home-v4-mission-code"
              >
                RR-01 / NIGHT
              </span>
            </div>

            <h2
              class="home-v4-mission-title"
            >
              FOLLOW<br>
              THE RELAY
            </h2>

            <p
              class="home-v4-mission-sub"
            >
              RECONNECT THE SIGNAL CHAIN
              ACROSS OLD QUARTER.
            </p>

            <div
              class="home-v5-last-run"
            >
              <div
                class="home-v5-last-run-head"
              >
                <span>
                  LAST RUN
                </span>

                <b>
                  TELEMETRY
                </b>
              </div>

              <div
                class="home-v5-telemetry-grid"
              >
                <div>
                  <small>TIME</small>
                  <strong
                    id="homeV5RunTime"
                  >
                    —
                  </strong>
                </div>

                <div>
                  <small>SIGNALS</small>
                  <strong
                    id="homeV5RunSignals"
                  >
                    —
                  </strong>
                </div>

                <div>
                  <small>SCORE</small>
                  <strong
                    id="homeV5RunScore"
                  >
                    —
                  </strong>
                </div>

                <div>
                  <small>RATING</small>
                  <strong
                    id="homeV5RunRating"
                  >
                    —
                  </strong>
                </div>
              </div>
            </div>

            <div
              class="home-v4-stat-grid"
            >
              <div
                class="home-v4-stat"
              >
                <small>
                  MISSION XP
                </small>

                <b
                  id="homeV4MissionXp"
                >
                  +0
                </b>
              </div>

              <div
                class="home-v4-stat"
              >
                <small>
                  BEST RATING
                </small>

                <b
                  id="homeV4BestRating"
                >
                  —
                </b>
              </div>
            </div>
                 </article>

                   <!-- =================================================
               DAILY OPERATION
               ================================================= -->

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
                  DAILY OPERATION
                </span>

                <strong>
                  CITY RELAY NETWORK
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
                DAILY // ACTIVE OBJECTIVE
              </span>

              <h3
                id="homeV4DailyTitle"
                class="home-v4-daily-title"
              >
                LOADING OPERATION
              </h3>

              <p
                id="homeV4DailyDescription"
                class="home-v4-daily-description"
              >
                READING RELAY NETWORK OBJECTIVE...
              </p>
            </div>

            <div
              class="home-v4-daily-progress"
            >
              <div
                class="home-v4-daily-progress-meta"
              >
                <span>
                  PROGRESS
                </span>

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
                  <small>
                    REWARD
                  </small>

                  <b
                    id="homeV4DailyReward"
                  >
                    +0 XP
                  </b>
                </div>

                <div>
                  <small>
                    PAYLOAD
                  </small>

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
                CHALLENGES

                <span
                  aria-hidden="true"
                >
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
    <span>NEXT UNLOCK</span>
    <b id="homeV4UnlockLevel">LV 08</b>
  </div>

  <h3 id="homeV4UnlockTitle">
    SECTOR 02 // SKYLINE
  </h3>

  <p id="homeV4UnlockDesc">
    Reach the required level to unlock the next district.
  </p>

  <div class="home-v4-unlock-progress">
    <div class="home-v4-unlock-meta">
      <span>PROGRESS</span>
      <strong id="homeV4UnlockText">0%</strong>
    </div>

    <div class="home-v4-unlock-bar">
      <i id="homeV4UnlockFill" style="width:0%"></i>
    </div>
  </div>
</article>

<div
  class="home-v4-activity"
  aria-label="Recent activity"
>
  <div class="home-v4-activity-head">
    <span>RECENT ACTIVITY</span>
    <b>LIVE FEED</b>
  </div>

  <div class="home-v4-activity-list">

    <div class="home-v4-activity-item">
      <span class="home-v4-activity-dot"></span>
      <div>
        <strong id="homeV4ActivityOne">
          NETWORK READY
        </strong>
        <small id="homeV4ActivityOneMeta">
          RELAY CHANNEL // 01
        </small>
      </div>
    </div>

    <div class="home-v4-activity-item">
      <span class="home-v4-activity-dot"></span>
      <div>
        <strong id="homeV4ActivityTwo">
          AWAITING FIRST RUN
        </strong>
        <small id="homeV4ActivityTwoMeta">
          TELEMETRY // STANDBY
        </small>
      </div>
    </div>

    <div class="home-v4-activity-item">
      <span class="home-v4-activity-dot"></span>
      <div>
        <strong id="homeV4ActivityThree">
          CONTRACT NETWORK READY
        </strong>
        <small id="homeV4ActivityThreeMeta">
          CONTRACTS // ONLINE
        </small>
      </div>
    </div>

  </div>
</div>

<div
  class="home-v4-badge"
>
  LIVE RELAY CHANNEL // 01
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
                  RUNNER INTEL
                </span>

                <strong>
                  COURIER PROFILE
                </strong>
              </div>

              <span
                class="home-v4-profile-live"
              >
                LIVE
              </span>
            </div>

            <div
              class="home-v4-profile-rank"
            >
              <div>
                <small>RANK</small>

                <b id="homeV4Rank">
                  ROOKIE
                </b>
              </div>

              <div>
                <small>LEVEL</small>

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
                  XP PROGRESS
                </span>

                <strong
                  id="homeV4XpText"
                >
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
                  BEST RUN
                </small>

                <b id="homeV4BestRun">
                  0
                </b>
              </div>

              <div>
                <small>
                  RUNS
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
                PROFILE STATUS
              </span>

              <b>
                ONLINE
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
      ? &nbsp;FAQ
    </button>

    <button
      class="home-v4-utility"
      type="button"
      data-home-v4-action="update"
      aria-label="Open latest update"
    >
      ↗ &nbsp;UPDATE
    </button>

  <!-- CREDITS REMAIN IN TOPBAR -->

    <button
      class="home-v4-utility home-v4-tutorial"
      type="button"
      data-home-v4-action="tutorial"
      aria-label="Open tutorial"
    >
      ◉ &nbsp;TUTORIAL
    </button>

    <button
      class="home-v4-utility"
      type="button"
      data-home-v4-action="options"
      aria-label="Open options"
    >
      ⚙ &nbsp;OPTIONS
    </button>

  </div>

  <div
    class="home-v4-bottom-meta"
  >
    RELAY NETWORK
    <b>ONLINE</b>
    · V1.1.0
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

    /* =========================================================
       HOME V5 // FINAL COMMAND LAYOUT
       Move existing presentation-only elements into their
       final visual zones without duplicating state or handlers.
       ========================================================= */

    const homeCopy =
      shell.querySelector('.home-v4-copy');

    const homeActions =
      shell.querySelector('.home-v4-actions');

    const homeDaily =
      shell.querySelector('.home-v4-daily');

    /*
     * START + DAILY OPERATION
     *
     * Daily Operation is already the canonical Home presentation
     * of the existing daily challenge system. We only move its
     * existing DOM node; no new state or handlers are created.
     */
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

  startHomeTypewriter();
installHomeScrollStatus();
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
        '[data-home-v4-action="daily"]'
      ),
      'click',
      event => {
        event.preventDefault();

        /*
         * Open the existing Challenges system.
         * Home does not create a duplicate challenge UI.
         */
        const target =
          document.querySelector(
            '#pauseMenu [data-tab="challenges"]'
          );

        if (
          target instanceof HTMLElement
        ) {
          HTMLElement.prototype.click.call(
            target
          );

          return;
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
      }
    );

 bindOnce(
  shell.querySelector(
    '[data-home-v4-action="contracts"]'
  ),
  'click',
  event => {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (
      typeof window.relayOpenContracts !==
      'function'
    ) {
      console.error(
        '[RelayRunner] Contracts API not ready'
      );
      return;
    }

    window.relayOpenContracts();
  }
);
       /* CREDITS IS DISPLAYED IN THE TOPBAR */

    bindOnce(
      shell.querySelector(
        '[data-home-v4-action="tutorial"]'
      ),
      'click',
      event => {
        event.preventDefault();
        openHomeTutorial();
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
    /*
     * START
     *
     * The Home button forwards to the
     * original gameplay-owned button.
     */
    const start =
      shell.querySelector('#start');

    forceStartVisible(start);

bindOnce(
  start,
  'click',
  event => {
    event.preventDefault();
    event.stopImmediatePropagation();

    try {
      const loader = window.relayPlayDeploymentV1;

      if (loader && typeof loader.show === 'function') {
        void loader.show({
          missionNumber: 1,
          desktop: './assets/loadplay.jpg',
          mobile: './assets/loadplaymobile.jpg',

          beforeRoute: async () => {
            const target = document.querySelector(
              'body > #game > div[hidden] #start'
            );

            if (target instanceof HTMLElement) {
              HTMLElement.prototype.click.call(target);
            }
          }
        });

        return;
      }

      const target = document.querySelector(
        'body > #game > div[hidden] #start'
      );

      if (target instanceof HTMLElement) {
        HTMLElement.prototype.click.call(target);
      }
    } catch (error) {
      console.error(
        '[RelayRunner] Deployment loader error:',
        error
      );
    }
  }
);

    /*
     * CONTINUE
     */

    const continueButton =
      shell.querySelector('#continue');

  const syncContinue = () => {
  if (!(continueButton instanceof HTMLElement)) {
    return;
  }

  continueButton.classList.remove('hidden');
  continueButton.removeAttribute('hidden');

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

    /* =========================================================
     HOME SCROLL STATUS
     ========================================================= */

  const installHomeScrollStatus = () => {
    if (document.documentElement.dataset.homeScrollStatus === '1') {
      return;
    }

    document.documentElement.dataset.homeScrollStatus = '1';

    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
      const intro = $('intro');

      if (!(intro instanceof HTMLElement)) {
        return;
      }

      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 10) {
        intro.classList.add('is-scrolling');
      }

      if (currentScrollY < lastScrollY) {
        intro.classList.remove('is-scrolling');
      }

      lastScrollY = currentScrollY;
    }, { passive:true });
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
            clickExisting('#start');
          }
        }

        if (event.key === 'Escape') {
          const title =
            $('titlePanel');

          const info =
            $('relayInfoPanel');

          if (
            !title?.classList.contains(
              'hidden'
            )
          ) {
            title.classList.add(
              'hidden'
            );
          }

          if (
            !info?.classList.contains(
              'hidden'
            )
          ) {
            info.classList.add(
              'hidden'
            );
          }
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

    const intro = $('intro');

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
      { once: true }
    );
  } else {
    boot();
  }
})();

