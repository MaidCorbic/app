/* UPDATE 20 — CITY RESPONSE FINISH V2
   Visual-only bridge into the existing Finish overlay.
   It never changes or replaces existing Finish controls/listeners.
*/
(() => {
  if (typeof window === 'undefined' || window.__relayCityResponseFinishV2) return;
  window.__relayCityResponseFinishV2 = true;

  const PROFILE = {
    CLEAN: { label: 'CITY CALM', accent: '#8df4ff', line: 'LOCAL RELAYS REMAIN OPEN', detail: 'Clean delivery. The district remains stable.' },
    DAMAGED: { label: 'CITY ALERT', accent: '#ff9d6e', line: 'SECURITY PRESSURE DETECTED', detail: 'Your run left the district on alert.' },
    NETWORKED: { label: 'CITY LINKED', accent: '#c8b5ff', line: 'RELAY RESPONSE PROPAGATED', detail: 'The network accepted your intervention.' },
  };

  const finish = () => document.getElementById('finish');
  const panel = () => document.getElementById('cityResponseFinishV2');

  function ensurePanel() {
    const finishRoot = finish();
    if (!finishRoot) return null;
    let node = panel();
    if (node && node.parentElement === finishRoot) return node;
    node = document.createElement('section');
    node.id = 'cityResponseFinishV2';
    node.innerHTML = '<div class="city-response-finish-kicker">CITY RESPONSE // DISTRICT STATUS</div><div class="city-response-finish-title"></div><div class="city-response-finish-line"></div><div class="city-response-finish-detail"></div>';
    const anchor = finishRoot.querySelector('#finishLine') || finishRoot.querySelector('.reward');
    if (anchor?.insertAdjacentElement) anchor.insertAdjacentElement('afterend', node);
    else finishRoot.querySelector('.outcome')?.appendChild(node);
    return node;
  }

  function render(response) {
    const finishRoot = finish();
    if (!finishRoot || finishRoot.classList.contains('hidden')) return false;
    const node = ensurePanel();
    if (!node) return false;
    const profile = PROFILE[response] || PROFILE.CLEAN;
    node.style.setProperty('--city-response-finish-accent', profile.accent);
    node.querySelector('.city-response-finish-title').textContent = profile.label;
    node.querySelector('.city-response-finish-line').textContent = profile.line;
    node.querySelector('.city-response-finish-detail').textContent = profile.detail;
    node.dataset.response = response;
    node.classList.remove('is-visible', 'is-pulse');
    void node.offsetWidth;
    node.classList.add('is-visible', 'is-pulse');
    return true;
  }

  function renderAfterFinish(response, attempts = 0) {
    if (render(response)) return;
    if (attempts >= 8) return;
    window.requestAnimationFrame(() => renderAfterFinish(response, attempts + 1));
  }

  window.addEventListener('relay:city-response', event => {
    renderAfterFinish(event.detail?.response || 'CLEAN');
  });
})();
