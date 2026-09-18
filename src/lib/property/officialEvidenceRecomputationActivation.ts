import type { DownstreamArtifactKind } from "./officialEvidenceDownstreamInvalidation";
import { latestSuccessfulReplayAttestation } from "./officialEvidenceReplayExecutor";
import { approvedRecomputationHandlers, latestGovernedRecomputationHandler } from "./officialEvidenceRecomputationHandlerRegistry";

const KINDS: DownstreamArtifactKind[] = ["tax-scenario", "top-three", "qualification-result", "property-report"];

export function evidenceRecomputationActivationStatus() {
  const executable = approvedRecomputationHandlers();
  const details = KINDS.map((kind) => {
    const registration = latestGovernedRecomputationHandler(kind);
    const attestation = registration ? latestSuccessfulReplayAttestation(kind, registration.handlerId, registration.implementationHash) : null;
    return {
      kind,
      registered: Boolean(registration),
      status: registration?.status ?? "missing",
      implementationHash: registration?.implementationHash ?? null,
      replayMatched: Boolean(attestation),
      runtimeBound: Boolean(executable[kind]),
      ready: registration?.status === "approved" && Boolean(attestation) && Boolean(executable[kind]),
    };
  });
  return { ready: details.every((item) => item.ready), details };
}
