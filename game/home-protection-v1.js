/* HOME PROTECTION V1 — prevents accidental selection/copy/drag on the title screen.
   Game controls and text inputs outside #intro remain unaffected. */
(() => {
  if (window.__relayHomeProtectionV1) return;
  window.__relayHomeProtectionV1 = true;

  const style = document.createElement('style');
  style.id = 'relay-home-protection-v1';
  style.textContent = `
    #intro, #intro * { -webkit-user-select:none!important; user-select:none!important; -webkit-touch-callout:none!important; }
    #intro img, #intro button, #intro .menu-option-button, #intro .play-button { -webkit-user-drag:none!important; user-drag:none!important; }
  `;
  document.head.appendChild(style);

  const insideHome = event => event.target?.closest?.('#intro');
  const blocked = event => {
    if (!insideHome(event)) return;
    event.preventDefault();
  };

  ['copy','cut','dragstart','selectstart','contextmenu'].forEach(type => document.addEventListener(type, blocked, { passive:false }));
})();
