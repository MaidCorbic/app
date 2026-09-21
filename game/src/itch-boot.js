/* Relay Runner // itch.io single-entry boot
 *
 * IMPORTANT:
 * The game engine is the only required startup dependency.
 * Presentation/UX modules are loaded after main.js so a broken optional
 * module can never hold the itch.io game at the splash screen.
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
  } catch (error) {
    report(label, error);
  }
};

const boot = async () => {
  // Start the actual game first. Do not put optional Home/UI imports ahead of this.
  await import('./main.js');

  // Everything below is enhancement/presentation code. Failure is non-fatal.
  await optional('home-options', () => import('../home-options.js'));
  await optional('home-v4', () => import('../home-v3.js'));
  await optional('home-v4-guard', () => import('../home-v3-guard.js'));
  await optional('home-v4-interaction', () => import('../home-v3-interaction-fix.js'));
  await optional('play-intro', () => import('../play-intro-cinematic-v2.js'));
  await optional('deployment-loader', () => import('../play-deployment-loader-v1.js'));
  await optional('menu-music', () => import('../menu-music.js'));
  await optional('player-profile', () => import('../player-profile-v1.js'));
  await optional('pause-interactions', () => import('../pause-interactions.js'));
  await optional('pause-polish', () => import('../pause-final-polish-v1.js'));
  await optional('relay-ui-init', () => import('../relay-ui-init.js'));
  await optional('world-interaction', () => import('../world-interaction-v1.js'));
  await optional('gameplay-touch-lock', () => import('../gameplay-touch-lock-v1.js'));
  await optional('cinematic-arrival', () => import('../cinematic-arrival-v2.js'));
  await optional('premium-finishing', () => import('../premium-finishing-pass-v1.js'));
  await optional('gameplay-core', () => import('../gameplay-core-v1.js'));

  document.documentElement.dataset.relayBootComplete = '1';
  window.dispatchEvent(
    new CustomEvent('relay:boot-complete', {
      detail: { errors: window.__relayBootErrors || [] },
    }),
  );
};

boot().catch(error => {
  report('fatal', error);
  window.dispatchEvent(
    new CustomEvent('relay:boot-failed', {
      detail: { error: String(error?.stack || error) },
    }),
  );
});
