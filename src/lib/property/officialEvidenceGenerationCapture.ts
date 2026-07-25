import { randomUUID } from "node:crypto";
import { registerDownstreamArtifact, type DownstreamArtifactKind, type EvidenceDependency } from "./officialEvidenceDownstreamInvalidation";
import { readOfficialEvidenceRefreshState } from "./officialEvidenceRuntimeStore";
import type { OfficialEvidenceSourceId } from "./officialEvidenceSourceGovernance";

const SOURCE_IDS: OfficialEvidenceSourceId[] = ["parcel-tax-authority", "well-permit-authority"];

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
}) {
  const propertyId = input.propertyId.trim();
  if (!propertyId) throw new Error("Generated evidence artifact requires a property identifier.");
  const artifactId = input.artifactId?.trim() || `${input.kind}:${propertyId}:${randomUUID()}`;
  return registerDownstreamArtifact({
    artifactId,
    propertyId,
    kind: input.kind,
    dependencies: currentOfficialEvidenceDependencies(),
    generatedAt: input.generatedAt,
  });
}
