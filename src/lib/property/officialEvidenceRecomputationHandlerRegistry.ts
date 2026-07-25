import { createHash } from "node:crypto";
import type { DownstreamArtifactKind, DownstreamArtifactRecord, EvidenceDependency } from "./officialEvidenceDownstreamInvalidation";

export interface RecomputationResult {
  artifactHash: string;
  dependencies: EvidenceDependency[];
  generatedAt: string;
  productionEvidence: true;
}
export type GovernedRecomputationHandler = (artifact: DownstreamArtifactRecord) => Promise<RecomputationResult> | RecomputationResult;
export interface RecomputationHandlerRegistration {
  handlerId: string;
  kind: DownstreamArtifactKind;
  implementationHash: string;
  sourcePath: string;
  status: "pending" | "approved" | "suspended";
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewReason?: string | null;
  placeholder: false;
}
interface Entry { registration: RecomputationHandlerRegistration; handler: GovernedRecomputationHandler; }
const entries = new Map<DownstreamArtifactKind, Entry>();
const hash = (handler: GovernedRecomputationHandler) => createHash("sha256").update(handler.toString()).digest("hex");

export function registerGovernedRecomputationHandler(input: Omit<RecomputationHandlerRegistration, "implementationHash" | "placeholder">, handler: GovernedRecomputationHandler): void {
  if (!input.handlerId.trim() || !input.sourcePath.trim()) throw new Error("Recomputation handler identity and source path are required.");
  if (/placeholder|mock|fixture|fake/i.test(input.handlerId + " " + input.sourcePath)) throw new Error("Placeholder or fabricated recomputation handlers are prohibited.");
  const registration: RecomputationHandlerRegistration = { ...input, implementationHash: hash(handler), placeholder: false };
  if (registration.status === "approved" && (!registration.reviewedBy?.trim() || !registration.reviewedAt?.trim() || !registration.reviewReason?.trim())) throw new Error("Approved recomputation handlers require a reviewer, timestamp, and reason.");
  entries.set(input.kind, { registration, handler });
}

export function approvedRecomputationHandlers(): Partial<Record<DownstreamArtifactKind, GovernedRecomputationHandler>> {
  const result: Partial<Record<DownstreamArtifactKind, GovernedRecomputationHandler>> = {};
  for (const [kind, entry] of entries) {
    if (entry.registration.status !== "approved") continue;
    if (hash(entry.handler) !== entry.registration.implementationHash) continue;
    result[kind] = entry.handler;
  }
  return result;
}
export function clearGovernedRecomputationHandlers(): void { entries.clear(); }
export function listGovernedRecomputationHandlers(): RecomputationHandlerRegistration[] { return [...entries.values()].map(x => x.registration); }
