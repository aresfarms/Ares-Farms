async function main() {
  const [stateDirectory, writerId] = process.argv.slice(2);
  if (!stateDirectory || !writerId) {
    throw new Error("state directory and writer id are required");
  }
  process.env.FURLONG_RUNTIME_STATE_DIR = stateDirectory;
  const store = await import("@/lib/governance/releaseGovernanceEvidenceStore");
  store.recordReleaseGovernanceEvidence({
    kind: "PRODUCTION_LAUNCH_EVIDENCE_HOLD",
    scope: "concurrency-test",
    actorId: `writer-${writerId}`,
    reviewNote: "concurrent immutable write",
    replayRef: `concurrency-${writerId}`,
  });
}

void main();
export {};
