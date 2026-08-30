import './update-center-v1.css';

(() => {
  'use strict';
  if (window.__relayUpdateCenterV1) return;
  window.__relayUpdateCenterV1 = true;

  const UPDATES = [
    {
      version: '1.1.0',
      date: '30 AUG 2026',
      title: 'FINAL CINEMATIC UI PASS',
      items: [
        'Unified ultra-cinematic gold visual language across Home, Map, Options, Pause and gameplay presentation.',
        'Compact responsive Mission and Signals HUD for desktop and mobile layouts.',
        'Mission Objective presentation moved into the gameplay information hierarchy without changing progression state.',
        'Persistent Body Swap HUD presentation removed while the existing B ability remains active in supported missions.',
        'Mobile landscape orientation guidance refined for clearer gameplay visibility.'
      ],
    },
    {
      version: '1.0.9',
      date: '30 AUG 2026',
      title: 'BOOT & AUDIO STABILITY',
      items: [
        'Restored the known-working non-blocking splash loader path.',
        'Removed duplicate splash ownership from the boot flow.',
        'Hardened WebAudio unlock so gameplay music starts after a user gesture.',
        'Reduced UI-owned animation work that could create unnecessary frame pressure.'
      ],
    },
    {
      version: '1.0.8',
      date: '30 AUG 2026',
      title: 'MISSION PRESENTATION',
      items: [
        'Added contextual Mission Intelligence presentation for mission-relevant systems.',
        'Expanded gameplay presentation through the campaign mission set while preserving existing mission logic.',
        'Aligned gameplay cards with the Map Menu cinematic design language.'
      ],
    },
    {
      version: '1.0.7',
      date: '30 AUG 2026',
      title: 'HOME INFORMATION LAYER',
      items: [
        'Introduced unified Home navigation for Options and FAQ.',
        'Added a dedicated update surface for current build information.',
        'Improved desktop/mobile parity for interactive menu surfaces.'
      ],
    },
  ];

  const panel = () => {
    let host = document.getElementById('relayUpdateCenter');
    if (host) return host;
    host = document.createElement('section');
    host.id = 'relayUpdateCenter';
    host.className = 'relay-update-center hidden';
    host.setAttribute('role', 'dialog');
    host.setAttribute('aria-modal', 'true');
    host.setAttribute('aria-labelledby', 'relayUpdateCenterHeading');
    host.innerHTML = `
      <div class="relay-update-center-panel">
        <button type="button" class="relay-update-center-close" data-update-close aria-label="Close updates">×</button>
        <header class="relay-update-center-head">
          <div>
            <p class="relay-update-center-kicker">RELAY RUNNER // LIVE ARCHIVE</p>
            <h2 id="relayUpdateCenterHeading">UPDATES</h2>
            <p>Build history, gameplay milestones and recent system changes.</p>
          </div>
          <span class="relay-update-center-status"><i></i>LIVE</span>
        </header>
        <div class="relay-update-center-list" data-update-list></div>
        <footer><button type="button" class="relay-update-center-refresh" data-update-refresh>REFRESH NOW</button><span data-update-refreshed>SYNC READY</span></footer>
      </div>`;
    document.body.appendChild(host);
    return host;
  };

  const render = host => {
    const list = host.querySelector('[data-update-list]');
    if (!list) return;
    list.innerHTML = UPDATES.map(update => `
      <article class="relay-update-entry">
        <div class="relay-update-entry-meta"><b>v${update.version}</b><span>${update.date}</span></div>
        <h3>${update.title}</h3>
        <ul>${update.items.map(item => `<li>${item}</li>`).join('')}</ul>
      </article>`).join('');
  };

  const open = () => {
    const host = panel();
    render(host);
    host.classList.remove('hidden');
    document.body.classList.add('relay-update-open');
    window.relayUpdateCenterV1LastOpened = Date.now();
  };

  const close = () => {
    const host = document.getElementById('relayUpdateCenter');
    host?.classList.add('hidden');
    document.body.classList.remove('relay-update-open');
  };

  const refresh = () => {
    const host = panel();
    render(host);
    const status = host.querySelector('[data-update-refreshed]');
    if (status) status.textContent = `REFRESHED ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    window.dispatchEvent(new CustomEvent('relay:update:refresh', { detail: { updates: UPDATES.length } }));
  };

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest('[data-update-open]')) { event.preventDefault(); event.stopPropagation(); open(); return; }
    if (target.closest('[data-update-close]')) { event.preventDefault(); close(); return; }
    if (target.closest('[data-update-refresh]')) { event.preventDefault(); refresh(); return; }
    if (target.id === 'relayUpdateCenter') { close(); }
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') close();
  }, true);

  window.relayUpdateCenter = { open, close, refresh, getUpdates: () => UPDATES.slice() };
})();
