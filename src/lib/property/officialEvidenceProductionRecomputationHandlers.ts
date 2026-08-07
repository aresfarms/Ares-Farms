import type { DownstreamArtifactKind, DownstreamArtifactRecord } from "./officialEvidenceDownstreamInvalidation";
import { currentOfficialEvidenceDependencies } from "./officialEvidenceGenerationCapture";
import { executeReplayBuilder } from "./officialEvidenceReplayExecutor";
import { hashReplayValue, replayPacketForArtifact, verifySignedReplayPacket } from "./officialEvidenceReplayPacketStore";
import {
  bindGovernedRecomputationHandlerRuntime,
  latestGovernedRecomputationHandler,
  recomputationHandlerImplementationHash,
  registerGovernedRecomputationHandler,
  type GovernedRecomputationHandler,
  type RecomputationResult,
} from "./officialEvidenceRecomputationHandlerRegistry";

function replayBackedResult(artifact: DownstreamArtifactRecord, expectedKind: DownstreamArtifactKind): RecomputationResult {
  const packet = replayPacketForArtifact(artifact.artifactId);
  if (!packet) throw new Error("A signed replay packet is required for production recomputation.");
  const verification = verifySignedReplayPacket(packet);
  if (!verification.valid) throw new Error(`Signed replay packet failed verification: ${verification.reasons.join(", ")}`);
  if (packet.kind !== expectedKind || artifact.kind !== expectedKind) throw new Error("Replay packet artifact class does not match the approved handler.");
  const currentDependencies = currentOfficialEvidenceDependencies();
  if (JSON.stringify(packet.dependencies) !== JSON.stringify(currentDependencies)) {
    throw new Error("Current official evidence differs from the signed replay packet; a genuine current-evidence input reconstruction is required.");
  }
  const output = executeReplayBuilder(packet.kind, packet.input, packet.capturedAt);
  const artifactHash = hashReplayValue(output);
  if (artifactHash !== packet.outputHash) throw new Error("Genuine builder output no longer matches the signed replay output hash.");
  return { artifactHash, dependencies: currentDependencies, generatedAt: new Date().toISOString(), productionEvidence: true };
}

export const recomputeTaxScenario: GovernedRecomputationHandler = (artifact) => replayBackedResult(artifact, "tax-scenario");
export const recomputeTopThree: GovernedRecomputationHandler = (artifact) => replayBackedResult(artifact, "top-three");
export const recomputeQualificationResult: GovernedRecomputationHandler = (artifact) => replayBackedResult(artifact, "qualification-result");
export const recomputePropertyReport: GovernedRecomputationHandler = (artifact) => replayBackedResult(artifact, "property-report");

const bindings: Record<DownstreamArtifactKind, { handlerId: string; sourcePath: string; handler: GovernedRecomputationHandler }> = {
  "tax-scenario": { handlerId: "ownership-cost-tax-scenario-v2", sourcePath: "src/lib/property/officialEvidenceProductionRecomputationHandlers.ts#recomputeTaxScenario", handler: recomputeTaxScenario },
  "top-three": { handlerId: "scenario-ranking-v2", sourcePath: "src/lib/property/officialEvidenceProductionRecomputationHandlers.ts#recomputeTopThree", handler: recomputeTopThree },
  "qualification-result": { handlerId: "financing-intake-v2", sourcePath: "src/lib/property/officialEvidenceProductionRecomputationHandlers.ts#recomputeQualificationResult", handler: recomputeQualificationResult },
  "property-report": { handlerId: "property-brief-v2", sourcePath: "src/lib/property/officialEvidenceProductionRecomputationHandlers.ts#recomputePropertyReport", handler: recomputePropertyReport },
};

export function ensureProductionRecomputationBindings(at = new Date().toISOString()): void {
  for (const kind of Object.keys(bindings) as DownstreamArtifactKind[]) {
    const binding = bindings[kind];
    const current = latestGovernedRecomputationHandler(kind);
    const implementationHash = recomputationHandlerImplementationHash(binding.handler);
    if (current && current.handlerId === binding.handlerId && current.sourcePath === binding.sourcePath && current.implementationHash === implementationHash) {
      bindGovernedRecomputationHandlerRuntime(kind, binding.handler);
      continue;
    }
    registerGovernedRecomputationHandler({
      handlerId: binding.handlerId,
      kind,
      sourcePath: binding.sourcePath,
      status: "pending",
      registeredAt: at,
      reviewedBy: null,
      reviewedAt: null,
      reviewReason: "Bound to the genuine replay-backed production path. Approval requires a matching deterministic replay attestation for this exact implementation hash.",
    }, binding.handler);
  }
}

export const registerProductionRecomputationBindings = ensureProductionRecomputationBindings;
