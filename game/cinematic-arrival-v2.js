import './canonical-ui-v1.css';
import './cinematic-arrival-v2.css';

/*
 * Compatibility entrypoint.
 * Active splash lifecycle is owned by splash-loader-v2.js.
 * This module must not create or mutate #relaySplash.
 */

const MIN_MS = 3600;
const RELEASE_REASON = 'ready-after-presentation';

void MIN_MS;
void RELEASE_REASON;
