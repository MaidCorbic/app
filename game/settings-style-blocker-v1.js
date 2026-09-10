/* Block the retired inline Options stylesheet before it can enter <head>. */
(() => {
  const LEGACY_ID = 'relay-unified-options-style';
  const nativeAppendChild = Node.prototype.appendChild;
  const nativeInsertBefore = Node.prototype.insertBefore;
  const isLegacyStyle = node => node?.nodeType === 1 && node.tagName === 'STYLE' && node.id === LEGACY_ID;
  Node.prototype.appendChild = function(node) {
    if (isLegacyStyle(node)) return node;
    return nativeAppendChild.call(this, node);
  };
  Node.prototype.insertBefore = function(node, referenceNode) {
    if (isLegacyStyle(node)) return node;
    return nativeInsertBefore.call(this, node, referenceNode);
  };
  queueMicrotask(() => {
    Node.prototype.appendChild = nativeAppendChild;
    Node.prototype.insertBefore = nativeInsertBefore;
  });
})();
