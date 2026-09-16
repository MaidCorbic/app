/*
 * Runner Relay — Home V4 presentation owner.
 *
 * FIX:
 * - Home owns presentation only.
 * - #start / #continue remain the authoritative gameplay entry points.
 * - No detached legacy #start / #continue elements.
 * - No duplicate-button forwarding.
 * - Options / FAQ / Update remain owned by existing systems.
 * - The intro surface is rebuilt once.
 */

(() => {
  'use strict';

  if (window.__relayHomeV4) return;
  window.__relayHomeV4 = true;

  const $ = id => document.getElementById(id);

  let homeProfileStateAPI = null;

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

      const xp =
        Number(state.xp) || 0;

      const signals =
        Number(state.signals) || 0;

      const totalRuns =
        Number(state.totalRuns) || 0;

      const bestRun =
        Number(state.bestRun) || 0;

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

      const level =
        getLevelProgress(xp);

      const rank =
        getCourierRank(xp);

      const xpIntoLevel =
        Math.max(
          0,
          xp - Number(level.current || 0)
        );

      const xpNeeded =
        Math.max(
          1,
          Number(level.next || 100) -
          Number(level.current || 0)
        );

      const xpProgress =
        Math.max(
          0,
          Math.min(
            100,
            Math.round(
              (Number(level.progress) || 0) * 100
            )
          )
        );

      const rankEl =
        $('homeV4Rank');

      const levelEl =
        $('homeV4Level');

      const xpTextEl =
        $('homeV4XpText');

      const xpFillEl =
        $('homeV4XpFill');

      const bestRunEl =
        $('homeV4BestRun');

      const runsEl =
        $('homeV4Runs');

      const signalsEl =
        $('homeV4Signals');

      const missionXpEl =
        $('homeV4MissionXp');

      const bestRatingEl =
        $('homeV4BestRating');

      const signalValueEl =
        $('homeV4SignalValue');

      const signalFillEl =
        $('homeV4SignalFill');

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

      /*
       * Live signal progress.
       *
       * Gameplay scene is authoritative for
       * collected Signals during a run.
       */

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
                (
                  missionSignals /
                  missionSignalTarget
                ) * 100
              )
            : 0;

        signalFillEl.style.width =
          `${signalProgress}%`;
      }

    } catch (
