import { createHash } from "node:crypto";

export const INSTITUTIONAL_ACCESS_SURVEILLANCE_RULE =
  "INSTITUTIONAL-ACCESS-SURVEILLANCE-001" as const;

export type AccessObservation = Readonly<{
  actorId: string;
  grantId: string;
  action: "VIEW" | "SEARCH" | "VERIFY_HASH" | "EXPORT" | "DENIED";
  at: string;
  recordCount: number;
  moduleId: string | null;
  subjectId: string | null;
  credentialValid: boolean;
  authorityValid: boolean;
}>;

export type SurveillanceFinding = Readonly<{
  status: "CLEAN" | "REVIEW_REQUIRED" | "ACCESS_REVOKED";
  reasonCodes: readonly string[];
  observationSha256: string;
  requiresIndependentClosure: boolean;
}>;

export function evaluateInstitutionalAccessSurveillance(input: {
  observations: readonly AccessObservation[];
  exportThreshold: number;
  deniedThreshold: number;
}): SurveillanceFinding {
  const reasons: string[] = [];
  const exports = input.observations.filter((item) => item.action === "EXPORT");
  const denied = input.observations.filter((item) => item.action === "DENIED");
  if (input.observations.some((item) => !item.credentialValid)) reasons.push("CREDENTIAL_RECHECK_FAILED");
  if (input.observations.some((item) => !item.authorityValid)) reasons.push("AUTHORITY_RECHECK_FAILED");
  if (exports.reduce((sum, item) => sum + item.recordCount, 0) > input.exportThreshold) reasons.push("EXPORT_VOLUME_ANOMALY");
  if (denied.length >= input.deniedThreshold) reasons.push("REPEATED_DENIED_ACCESS");
  const severe = reasons.includes("CREDENTIAL_RECHECK_FAILED") || reasons.includes("AUTHORITY_RECHECK_FAILED");
  return {
    status: severe ? "ACCESS_REVOKED" : reasons.length > 0 ? "REVIEW_REQUIRED" : "CLEAN",
    reasonCodes: reasons,
    observationSha256: createHash("sha256").update(JSON.stringify(input.observations)).digest("hex"),
    requiresIndependentClosure: reasons.length > 0,
  };
}

export function closeInstitutionalAccessReview(input: {
  finding: SurveillanceFinding;
  reviewerId: string;
  originalGrantIssuerId: string;
  reason: string;
}): Readonly<{ closed: true; reviewerId: string; reason: string }> {
  if (!input.finding.requiresIndependentClosure) throw new Error("A clean observation does not require review closure.");
  if (!input.reason.trim()) throw new Error("Closure reason is required.");
  if (input.reviewerId === input.originalGrantIssuerId) throw new Error("Post-access review requires independent closure authority.");
  return { closed: true, reviewerId: input.reviewerId, reason: input.reason };
}
