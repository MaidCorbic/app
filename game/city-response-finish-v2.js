/* UPDATE 20 — CITY RESPONSE FINISH V2
   Hard-wires City Response into the existing Finish overlay so the player can always see
   the result. Keeps existing mission completion ownership untouched.
*/
(() => {
  if (window.__relayCityResponseFinishV2) return;
  window.__relayCityResponseFinishV2 = true;

  const PROFILE = {
    CLEAN: { label: 'CITY CALM', accent: '#8df4ff', line: 'LOCAL RELAYS REMAIN OPEN', detail: 'Clean delivery. The district remains stable.' },
    DAMAGED: { label: 'CITY ALERT', accent: '#ff9d6e', line: 'SECURITY PRESSURE DETECTED', detail: 'Your run left the district on alert.' },
    NETWORKED: { label: 'CITY LINKED', accent: '#c8b5ff', line: 'RELAY RESPONSE PROPAGATED', detail: 'The network accepted your intervention.' },
  };

  const finish = () => document.getElementById('finish');
  const root = () => document.getElementById('cityResponseFinishV2');

  function ensurePanel() {
    const finishRoot = finish();
    if (!finishRoot) return null;
    let panel = root();
    if (panel && panel.parentElement === finishRoot) return panel;
    panel = document.createElement('section');
    panel.id = 'cityResponseFinishV2';
    panel.innerHTML = '<div class="city-response-finish-kicker">CITY RESPONSE // DISTRICT STATUS</div><div class="city-response-finish-title"></div><div class="city-response-finish-line"></div><div class="city-response-finish-detail"></div>';
    const anchor = finishRoot.querySelector('#finishLine') || finishRoot.querySelector('#finishTime') || finishRoot.lastElementChild;
    if (anchor?.insertAdjacentElement) anchor.insertAdjacentElement('afterend', panel);
    else finishRoot.appendChild(panel);
    return panel;
  }

  function show(response) {
    const panel = ensurePanel();
    const profile = PROFILE[response] || PROFILE.CLEAN;
    if (!panel) return;
    panel.style.setProperty('--city-response-finish-accent', profile.accent);
    panel.querySelector('.city-response-finish-title').textContent = profile.label;
    panel.querySelector('.city-response-finish-line').textContent = profile.line;
    panel.querySelector('.city-response-finish-detail').textContent = profile.detail;
    panel.dataset.response = response;
    panel.classList.remove('is-visible', 'is-pulse');
    void panel.offsetWidth;
    panel.classList.add('is-visible', 'is-pulse');
  }

  function hide() {
    root()?.classList.remove('is-visible', 'is-pulse');
  }

  function showFromEvent(event) {
    const scene = event?.detail?.scene;
    const response = event?.detail?.response || scene?.__cityResponse || 'CLEAN';
    window.setTimeout(() => show(response), 180);
  }

  window.addEventListener('relay:city-response', showFromEvent);
  window.addEventListener('relay:mission-complete', showFromEvent);

  const observer = new MutationObserver(() => {
    const finishRoot = finish();
    if (!finishRoot) return;
    const visible = !finishRoot.classList.contains('hidden');
    if (!visible) hide();
  });
  if (document.body) observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
})();
