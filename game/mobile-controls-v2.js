/* UI-only mobile action grouping. Existing data-mobile-action handlers remain untouched. */
function installMobileControlsV2() {
  const actions = document.querySelector('.mobile-actions');
  if (!actions || actions.dataset.controlsV2) return;
  actions.dataset.controlsV2 = 'ready';

  const secondaryIds = new Set(['build1', 'build2', 'gadget1', 'gadget2']);
  actions.querySelectorAll('[data-mobile-action]').forEach(button => {
    if (secondaryIds.has(button.dataset.mobileAction)) button.dataset.mobileSecondary = '1';
  });

  const more = document.createElement('button');
  more.type = 'button';
  more.className = 'mobile-action-more';
  more.setAttribute('aria-expanded', 'false');
  more.textContent = 'MORE';
  actions.appendChild(more);

  const close = () => {
    actions.classList.remove('is-expanded');
    more.classList.remove('is-active');
    more.setAttribute('aria-expanded', 'false');
    more.textContent = 'MORE';
  };

  more.addEventListener('pointerdown', event => {
    event.preventDefault();
    event.stopPropagation();
    const expanded = !actions.classList.contains('is-expanded');
    if (expanded) {
      actions.classList.add('is-expanded');
      more.classList.add('is-active');
      more.setAttribute('aria-expanded', 'true');
      more.textContent = 'LESS';
    } else close();
  }, { passive: false });

  document.addEventListener('pointerdown', event => {
    if (!actions.classList.contains('is-expanded')) return;
    if (!actions.contains(event.target)) close();
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) close();
  }, { passive: true });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installMobileControlsV2, { once: true });
else installMobileControlsV2();
