/* Relay Runner — Pause AAA Tactical UI wiring. Presentation only. */
(() => {
  'use strict';
  if (window.__relayPauseAaaTacticalV1) return;
  window.__relayPauseAaaTacticalV1 = true;

  const install = () => {
    const menu = document.getElementById('pauseMenu');
    const panel = menu?.querySelector('#panelContent');
    if (!menu || !panel || menu.classList.contains('relay-pause-aaa')) return;

    menu.classList.add('relay-pause-aaa');

    const head = document.createElement('header');
    head.className = 'pause-aaa-head';
    head.innerHTML = '<div><p class="relay-pause-aaa-kicker">RELAY RUNNER // PAUSED SESSION</p><h2 class="relay-pause-aaa-title">PAUSE</h2><p class="relay-pause-aaa-sub">TACTICAL CONTROL TERMINAL // ALL SYSTEMS AVAILABLE</p></div><span class="relay-pause-aaa-status"><i></i>SESSION HOLD</span>';

    const content = document.createElement('div');
    content.className = 'pause-aaa-scroll';
    while (panel.firstChild) content.appendChild(panel.firstChild);

    const footer = document.createElement('footer');
    footer.className = 'pause-aaa-footer';
    footer.innerHTML = '<span>INPUT // TOUCH + KEYBOARD</span><strong>RELAY SYSTEM READY</strong>';

    panel.append(head, content, footer);

    const sync = () => {
      const scroller = menu.querySelector('.pause-aaa-scroll');
      if (!scroller) return;
      scroller.scrollTop = Math.max(0, Math.min(scroller.scrollTop, scroller.scrollHeight - scroller.clientHeight));
    };
    menu.addEventListener('transitionend', sync, {passive:true});
    window.addEventListener('resize', sync, {passive:true});
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
