(() => {
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__relayWebZoomLockV1) return;
  window.__relayWebZoomLockV1 = true;

  const isEditable = target => {
    if (!target || typeof target.closest !== 'function') return false;
    return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
  };

  const isZoomShortcut = event => {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return false;
    const key = String(event.key || '').toLowerCase();
    const code = String(event.code || '').toLowerCase();
    return key === '+' || key === '-' || key === '=' || key === '0'
      || code === 'equal' || code === 'minus' || code === 'numpaddd' || code === 'numpadadd'
      || code === 'numpadsubtract' || code === 'numpad0' || code === 'digit0';
  };

  const blockKeyZoom = event => {
    if (isEditable(event.target)) return;
    if (!isZoomShortcut(event)) return;
    event.preventDefault();
    event.stopPropagation();
  };

  const blockWheelZoom = event => {
    if (!(event.ctrlKey || event.metaKey)) return;
    event.preventDefault();
    event.stopPropagation();
  };

  window.addEventListener('keydown', blockKeyZoom, true);
  window.addEventListener('wheel', blockWheelZoom, { passive: false, capture: true });
  window.addEventListener('gesturestart', blockWheelZoom, { passive: false, capture: true });
  window.addEventListener('gesturechange', blockWheelZoom, { passive: false, capture: true });
  window.addEventListener('gestureend', blockWheelZoom, { passive: false, capture: true });
})();
