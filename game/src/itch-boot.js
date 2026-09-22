/* Relay Runner // itch.io single-entry boot
 *
 * The Phaser/game entry is the only required startup dependency.
 * Optional presentation modules load after the engine so one broken
 * enhancement can never keep the itch.io splash at 0%.
 */

const report = (label, error) => {
  console.error('[RelayBoot] ' + label + ' failed', error);
  window.__relayBootErrors ||= [];
  window.__relayBootErrors.push({
    label,
    error: String(error?.stack || error),
  });
};

const optional = async (label, loader) => {
  try {
    await loader();
    return true;
  } catch (error) {
    report(label, error);
    return false;
  }
};

const resetInitialPauseState = () => {
  const pauseMenu = document.getElementById('pauseMenu');
  if (!(pauseMenu instanceof HTMLElement)) return;

  pauseMenu.classList.add('hidden');
  pauseMenu.setAttribute('aria-hidden', 'true');
};

const boot = async () => {
  /*
   * PHASE 1 — CORE + HOME
   *
   * Only these modules are allowed to gate the first visible Home.
   * There is no artificial preload/deployment sequence.
   */
  await import('./main.js');
  resetInitialPauseState();

  await optional(
    'relay-ui-init',
    () => import('../relay-ui-init.js')
  );

  await optional(
    'home-v3',
    () => import('../home-v3.js')
  );

  await optional(
    'play-intro',
    () => import('../play-intro-cinematic-v2.js')
  );

  /*
   * Tell the first-load splash that the real Home is mounted.
   * The splash controller exits immediately instead of waiting for
   * every secondary system to finish loading.
   */
  document.documentElement.dataset.relayHomeReady = '1';

  window.dispatchEvent(
    new CustomEvent('relay:home-ready')
  );

  /*
   * PHASE 2 — SECONDARY / GAMEPLAY ENHANCEMENTS
   *
   * Preserve the existing dependency order, but do not block Home.
   */
  void (async () => {
    await optional(
      'deployment-loader',
      () => import('../play-deployment-loader-v1.js')
    );
    await optional(
      'home-options',
      () => import('../home-options.js')
    );
    await optional(
      'home-v4-guard',
      () => import('../home-v3-guard.js')
    );
    await optional(
      'home-v4-interaction',
      () => import('../home-v3-interaction-fix.js')
    );
    await optional(
      'menu-music',
      () => import('../menu-music.js')
    );
    await optional(
      'player-profile',
      () => import('../player-profile-v1.js')
    );
    await optional(
      'pause-interactions',
      () => import('../pause-interactions.js')
    );
    await optional(
      'pause-polish',
      () => import('../pause-final-polish-v1.js')
    );
    await optional(
      'world-interaction',
      () => import('../world-interaction-v1.js')
    );
    await optional(
      'gameplay-touch-lock',
      () => import('../gameplay-touch-lock.js')
    );
    await optional(
      'cinematic-arrival',
      () => import('../cinematic-arrival-v2.js')
    );
    await optional(
      'premium-finishing',
      () => import('../premium-finishing-pass-v1.js')
    );
    await optional(
      'gameplay-core',
      () => import('../gameplay-core-v1.js')
    );

    resetInitialPauseState();

    document.documentElement.dataset.relayBootComplete = '1';

    window.dispatchEvent(
      new CustomEvent('relay:boot-complete', {
        detail: {
          errors: window.__relayBootErrors || [],
        },
      })
    );
  })().catch(error => {
    report('background', error);
  });
};

boot().catch(error => {
  report('fatal', error);

  window.dispatchEvent(
    new CustomEvent('relay:boot-failed', {
      detail: {
        error: String(error?.stack || error),
      },
    })
  );
});
