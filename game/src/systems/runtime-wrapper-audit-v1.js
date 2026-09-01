// Runtime Wrapper Audit V1
// Development/diagnostic guard only. It does not own gameplay state, input, physics or progression.
// It verifies that the final RunnerScene lifecycle exposes the expected wrapper registry and that
// repeated bootstrap imports cannot install this audit twice.

if (!window.__relayRuntimeWrapperAuditV1) {
  window.__relayRuntimeWrapperAuditV1 = true;

  const report = {
    version: 1,
    installedAt: Date.now(),
    createWrapped: typeof window.__relayRunnerScene?.create === 'function',
    updateWrapped: typeof window.__relayRunnerScene?.update === 'function',
  };

  window.__relayRuntimeWrapperAuditV1Report = report;
}
