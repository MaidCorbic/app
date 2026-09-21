/* Relay Runner // itch.io single-entry boot */
const optional = async (label, loader) => {
  try { await loader(); }
  catch (error) {
    console.error('[RelayBoot] ' + label + ' failed', error);
    window.__relayBootErrors ||= [];
    window.__relayBootErrors.push({ label, error: String(error?.stack || error) });
  }
};

const boot = async () => {
  await optional('home-options', () => import('../home-options.js'));
  await optional('home-v4', () => import('../home-v3.js'));
  await optional('home-v4-guard', () => import('../home-v3-guard.js'));
  await optional('home-v4-interaction', () => import('../home-v3-interaction-fix.js'));
  await import('./main.js');
  await optional('mobile-input', () => import('./systems/mobile-input-single-owner-v1.js'));
  await optional('mission-finish-recovery', () => import('./systems/mission-finish-recovery.js'));
  await optional('mission-results', () => import('./systems/mission-results.js'));
  await optional('mission-mastery', () => import('./systems/mission-mastery.js'));
  await optional('enemy-alert', () => import('./systems/enemy-alert.js'));
  await optional('play-intro', () => import('../play-intro-cinematic-v2.js'));
  await optional('deployment-loader', () => import('../play-deployment-loader-v1.js'));
  await optional('menu-music', () => import('../menu-music.js'));
  await optional('player-profile', () => import('../player-profile-v1.js'));
  await optional('pause-interactions', () => import('../pause-interactions.js'));
  await optional('pause-polish', () => import('../pause-final-polish-v1.js'));
  await optional('relay-ui-init', () => import('../relay-ui-init.js'));
  await optional('world-interaction', () => import('../world-interaction-v1.js'));
  await optional('gameplay-touch-lock', () => import('../gameplay-touch-lock.js'));
  await optional('cinematic-arrival', () => import('../cinematic-arrival-v2.js'));
  await optional('premium-finishing', () => import('../premium-finishing-pass-v1.js'));
  await optional('gameplay-core', () => import('../gameplay-core-v1.js'));
  document.documentElement.dataset.relayBootComplete = '1';
  window.dispatchEvent(new CustomEvent('relay:boot-complete', { detail: { errors: window.__relayBootErrors || [] } }));
};

boot().catch(error => {
  console.error('[RelayBoot] FATAL BOOT ERROR', error);
  window.__relayBootErrors ||= [];
  window.__relayBootErrors.push({ label: 'fatal', error: String(error?.stack || error) });
  window.dispatchEvent(new CustomEvent('relay:boot-failed', { detail: { error: String(error?.stack || error) } }));
});
