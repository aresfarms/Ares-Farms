import { createHmac, randomUUID } from "node:crypto";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { currentOfficialEvidenceDependencies } from "./officialEvidenceGenerationCapture";
import { hashReplayValue, type EvidenceReplayPacket } from "./officialEvidenceReplayPacketStore";
import type { DownstreamArtifactKind } from "./officialEvidenceDownstreamInvalidation";

const VERSION = "durable-generated-evidence-v1.0.0";
function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
}

/** Public requests append replay evidence to the existing database ledger.
 * The source snapshot bucket remains read-only to the web service. These are
 * historical captures, not cached current reports: each public page recomputes
 * its output from current sources. Control-plane invalidation jobs retain their
 * separate downstream-artifact registry and writer authority.
 */
export async function captureGeneratedEvidenceArtifactDurably(input: {
  kind: DownstreamArtifactKind;
  propertyId: string;
  artifactId?: string;
  generatedAt?: string;
  replayInput: unknown;
  replayOutput: unknown;
  authority?: "SERVER_GENERATED" | "CUSTOMER_ASSERTED";
}, persist = persistGovernanceEvidence) {
  const secret = process.env.EVIDENCE_REPLAY_SIGNING_SECRET?.trim();
  if (!secret) throw new Error("The evidence replay signing key is unavailable.");
  if (!input.propertyId.trim()) throw new Error("Property identity is required.");
  const traceId = `generated-evidence-${randomUUID()}`;
  const artifactId = `${input.kind}:${randomUUID()}`;
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  if (!Number.isFinite(Date.parse(generatedAt))) throw new Error("A valid generation time is required.");
  const dependencies = currentOfficialEvidenceDependencies();
  const unsigned: Omit<EvidenceReplayPacket, "signature"> = {
    packetId: randomUUID(), artifactId, propertyId: input.propertyId.trim(), kind: input.kind,
    capturedAt: generatedAt, dependencies, input: input.replayInput,
    inputHash: hashReplayValue(input.replayInput), outputHash: hashReplayValue(input.replayOutput),
    signatureAlgorithm: "hmac-sha256", keyId: process.env.EVIDENCE_REPLAY_SIGNING_KEY_ID?.trim() || "evidence-replay-v1",
  };
  const packet: EvidenceReplayPacket = { ...unsigned,
    signature: createHmac("sha256", secret).update(canonical(unsigned)).digest("hex") };
  const authority = input.authority ?? "SERVER_GENERATED";
  await persist({ traceId, replayRef: traceId,
    replayVerification: { traceId, replayRef: traceId, targetType: "GENERATED_PROPERTY_EVIDENCE", targetId: artifactId,
      verificationStatus: "CAPTURED_NOT_REPLAY_VERIFIED", deterministic: false, replaySafe: true,
      sourceVersion: VERSION, replayVersion: VERSION, eventCount: 1, mismatchCount: 0,
      result: { packet, replayOutput: input.replayOutput },
      metadata: { authority, dependencies, requestedArtifactRef: input.artifactId ?? null,
        historicalCapture: true, currentOutputRecomputedOnRequest: true,
        customerAssertionsAreNotVerifiedFacts: authority === "CUSTOMER_ASSERTED" } },
    metadata: { operation: "property.generated-evidence.capture", classification: "CONFIDENTIAL", version: VERSION },
  });
  return { artifactId, propertyId: input.propertyId, kind: input.kind, dependencies, generatedAt, traceId,
    status: "CAPTURED" as const, authority };
}
