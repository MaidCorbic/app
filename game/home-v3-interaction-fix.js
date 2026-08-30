/* Final Home owner: one menu stack, direct actions, no legacy relay click chains. */
(() => {
  'use strict';
  if (window.__relayHomeFinalV3) return;
  window.__relayHomeFinalV3 = true;

  const getIntro = () => document.getElementById('intro');
  const getSide = () => getIntro()?.querySelector('.home-v3-side');

  const openOptions = () => {
    try { window.relayUnifiedCinematicUI?.openOptions?.(); } catch (error) { console.warn('[Relay Home] Options open failed', error); }
  };
  const openFaq = () => {
    try { window.relayUnifiedCinematicUI?.openFAQ?.(); } catch (error) { console.warn('[Relay Home] FAQ open failed', error); }
  };
  const openUpdate = () => {
    try { window.relayUpdateCenter?.open?.(); } catch (error) { console.warn('[Relay Home] Update open failed', error); }
  };
  const exit = () => document.getElementById('exitTitle')?.click();

  const createButton = (id, label, detail, handler) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'home-v3-card relay-home-nav-card';
    button.dataset.finalHome = id;
    button.innerHTML = `<span>${label}</span><small>${detail}</small>`;
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      handler();
    });
    return button;
  };

  const install = () => {
    const intro = getIntro();
    const side = getSide();
    if (!intro || !side) return;

    /* Remove every legacy/duplicate Home launcher, then create exactly one stack. */
    intro.querySelectorAll('.info-launcher').forEach(node => node.remove());
    side.replaceChildren(
      createButton('options', 'OPTIONS', 'SETTINGS · AUDIO · DISPLAY', openOptions),
      createButton('faq', 'FAQ', 'HELP · GAME SYSTEMS', openFaq),
      createButton('update', 'UPDATE', 'VERSION HISTORY · LIVE', openUpdate),
      createButton('exit', 'EXIT', 'CLOSE SESSION', exit),
    );
    intro.dataset.homeFinalV3Installed = '1';
  };

  const reconcile = () => {
    const intro = getIntro();
    const side = getSide();
    if (!intro || !side || intro.classList.contains('hidden')) return;
    const cards = [...side.querySelectorAll('.relay-home-nav-card')];
    const expected = ['options', 'faq', 'update', 'exit'];
    const ids = cards.map(node => node.dataset.finalHome);
    const valid = cards.length === expected.length && expected.every((id, index) => ids[index] === id);
    const stray = [...side.children].some(node => !node.classList.contains('relay-home-nav-card'));
    const launcherLeft = !!intro.querySelector('.info-launcher');
    if (!valid || stray || launcherLeft) install();
  };

  const start = () => {
    install();
    const intro = getIntro();
    if (!intro || intro.dataset.homeFinalV3Observer === '1') return;
    intro.dataset.homeFinalV3Observer = '1';
    new MutationObserver(reconcile).observe(intro, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else window.setTimeout(start, 0);
})();
