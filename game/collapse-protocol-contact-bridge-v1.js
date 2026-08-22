/* UPDATE 21 — COLLAPSE CONTACT BRIDGE V1
   Converts a real dash/structure overlap into the existing Collapse Protocol trigger.
   No ownership of movement or barrier destruction is taken here.
*/
const DASH_WATCH_MS = 175;
const POLL_MS = 16;
const CONTACT_PAD_X = 12;
const CONTACT_PAD_Y = 10;
const STATE = '__collapseContactBridgeV1';

function activeBarrier(b){
  return !!(b && b.active !== false && b.body?.enable !== false);
}

function bounds(obj){
  if (!obj) return null;
  if (obj.getBounds) return obj.getBounds();
  const body = obj.body;
  if (body) {
    const x = Number(body.x ?? obj.x ?? 0);
    const y = Number(body.y ?? obj.y ?? 0);
    const w = Number(body.width ?? 0);
    const h = Number(body.height ?? 0);
    return { left:x, right:x+w, top:y, bottom:y+h };
  }
  const x = Number(obj.x ?? 0), y = Number(obj.y ?? 0);
  return { left:x-24, right:x+24, top:y-32, bottom:y+32 };
}

function intersects(a,b,padX=0,padY=0){
  const A = bounds(a), B = bounds(b);
  if (!A || !B) return false;
  return A.left-padX < B.right && A.right+padX > B.left && A.top-padY < B.bottom && A.bottom+padY > B.top;
}

function findContact(scene){
  const player = scene?.player;
  const barriers = scene?.barriers?.getChildren?.() || [];
  if (!player) return null;
  return barriers.find(b => activeBarrier(b) && intersects(player,b,CONTACT_PAD_X,CONTACT_PAD_Y)) || null;
}

function watchDash(scene, detail){
  if (!scene || scene.firstTimeTutorial || scene.finished || scene.respawning || scene.cinematicActive) return;
  const state = scene[STATE] || (scene[STATE] = { watching:false, timer:null, token:0 });
  if (state.watching) return;
  state.watching = true;
  const token = ++state.token;
  const started = performance.now();
  let elapsed = 0;

  const poll = () => {
    if (!scene || scene.__collapseProtocolBound === false || token !== state.token) return stop();
    const target = findContact(scene);
    if (target) {
      console.log('✅ COLLAPSE CONTACT', { x:Math.round(target.x), y:Math.round(target.y), elapsedMs:Math.round(performance.now()-started) });
      window.__relayCollapseProtocolTrigger?.();
      return stop();
    }
    elapsed += POLL_MS;
    if (elapsed >= DASH_WATCH_MS) return stop();
    state.timer = scene.time?.delayedCall?.(POLL_MS, poll) || window.setTimeout(poll,POLL_MS);
  };

  const stop = () => {
    state.watching = false;
    if (state.timer?.remove) state.timer.remove(false);
    if (state.timer) window.clearTimeout(state.timer);
    state.timer = null;
  };

  poll();
}

function bind(scene){
  if (!scene || scene.__collapseContactBridgeBound) return;
  scene.__collapseContactBridgeBound = true;
  const handler = e => watchDash(e?.detail?.scene || scene, e?.detail);
  scene.__collapseContactBridgeHandler = handler;
  window.addEventListener('relay:dash-runtime-applied', handler, { passive:true });
  scene.__collapseContactBridgeDebug = () => ({
    bound:true,
    watching:!!scene[STATE]?.watching,
    lastTarget:scene.__collapseContactBridgeLastTarget || null
  });
  scene.events?.once?.('shutdown', () => {
    window.removeEventListener('relay:dash-runtime-applied', handler);
    scene.__collapseContactBridgeBound = false;
  });
  scene.events?.once?.('destroy', () => {
    window.removeEventListener('relay:dash-runtime-applied', handler);
    scene.__collapseContactBridgeBound = false;
  });
}

if (typeof window !== 'undefined' && !window.__relayCollapseContactBridgeV1) {
  window.__relayCollapseContactBridgeV1 = true;
  window.addEventListener('relay:runner-scene-ready', e => bind(e.detail?.scene), { passive:true });
  window.__relayCollapseContactDebug = () => window.__relayRunnerScene?.__collapseContactBridgeDebug?.() || null;
}
