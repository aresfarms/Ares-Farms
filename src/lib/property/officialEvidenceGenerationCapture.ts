import { randomUUID } from "node:crypto";
import { registerDownstreamArtifact, type DownstreamArtifactKind, type EvidenceDependency } from "./officialEvidenceDownstreamInvalidation";
import { readOfficialEvidenceRefreshState } from "./officialEvidenceRuntimeStore";
import type { OfficialEvidenceSourceId } from "./officialEvidenceSourceGovernance";
import { preserveSignedReplayPacket } from "./officialEvidenceReplayPacketStore";

const SOURCE_IDS: OfficialEvidenceSourceId[] = ["parcel-tax-authority", "well-permit-authority", "county-recorder-deed"];

export function currentOfficialEvidenceDependencies(): EvidenceDependency[] {
  return SOURCE_IDS.flatMap((sourceId) => {
    const state = readOfficialEvidenceRefreshState<unknown>(sourceId);
    return state?.publishedVersion ? [{ sourceId, sourceVersion: state.publishedVersion }] : [];
  });
}

export function captureGeneratedEvidenceArtifact(input: {
  kind: DownstreamArtifactKind;
  propertyId: string;
  artifactId?: string;
  generatedAt?: string;
  replayInput?: unknown;
  replayOutput?: unknown;
}) {
  const propertyId = input.propertyId.trim();
  if (!propertyId) throw new Error("Generated evidence artifact requires a property identifier.");
  const artifactId = input.artifactId?.trim() || `${input.kind}:${propertyId}:${randomUUID()}`;
  const dependencies = currentOfficialEvidenceDependencies();
  const artifact = registerDownstreamArtifact({
    artifactId,
    propertyId,
    kind: input.kind,
    dependencies,
    generatedAt: input.generatedAt,
  });
  if (input.replayInput !== undefined && input.replayOutput !== undefined) {
    preserveSignedReplayPacket({ artifactId, propertyId, kind: input.kind, dependencies, replayInput: input.replayInput, replayOutput: input.replayOutput, capturedAt: input.generatedAt });
  }
  return artifact;
}
