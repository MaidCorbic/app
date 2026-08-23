/* UPDATE 26 — make the opening home line clearer without making it loud. */
(() => {
  const apply = () => {
    const tagline = document.querySelector('#intro .menu-tagline');
    if (!tagline || tagline.dataset.emphasisApplied) return;
    const text = tagline.textContent.trim();
    const lead = 'Run the sleeping city.';
    if (!text.startsWith(lead)) return;
    tagline.innerHTML = `<strong class="home-tagline-lead">${lead}</strong> <span class="home-tagline-rest">${text.slice(lead.length).trim()}</span>`;
    tagline.dataset.emphasisApplied = '1';
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, { once: true });
  else apply();
})();
