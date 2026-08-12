import { createHash } from "node:crypto";

import {
  unrevokedEvidenceAccessGrants,
  institutionalAccessObservationsForGrant,
  revokeEvidenceAccessGrant,
  recordInstitutionalSurveillanceRun,
  type EvidenceAccessGrant,
  type InstitutionalAccessObservation,
} from "@/lib/governance/institutionalEvidenceAccess";
import { findCredentialVerificationById } from "@/lib/governance/institutionalCredentialVerification";
import { findLegalAuthorityVerificationById } from "@/lib/governance/institutionalLegalAuthorityVerification";
import { evaluateInstitutionalAccessSurveillance } from "@/lib/governance/institutionalAccessSurveillance";

export const INSTITUTIONAL_ACCESS_SURVEILLANCE_ORCHESTRATION_RULE =
  "INSTITUTIONAL-ACCESS-SURVEILLANCE-ORCHESTRATION-001" as const;

export type SurveillancePlan = Readonly<{
  grantId: string;
  status: "CLEAN" | "REVIEW_REQUIRED" | "ACCESS_REVOKED";
  reasonCodes: readonly string[];
  observationCount: number;
  revoke: boolean;
  snapshotSha256: string;
}>;

function sha(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function planInstitutionalGrantSurveillance(input: {
  grant: EvidenceAccessGrant;
  observations: readonly InstitutionalAccessObservation[];
  credentialValid: boolean;
  authorityValid: boolean;
  now: string;
  exportThreshold: number;
  deniedThreshold: number;
}): SurveillancePlan {
  const synthetic = input.observations.length > 0
    ? input.observations
    : [{
        actorId: input.grant.principalId,
        grantId: input.grant.grantId,
        action: "VIEW" as const,
        at: input.now,
        recordCount: 0,
        moduleId: null,
        subjectId: null,
        credentialValid: input.credentialValid,
        authorityValid: input.authorityValid,
      }];
  const normalized = synthetic.map((item) => ({
    actorId: item.actorId,
    grantId: item.grantId,
    action: item.action,
    at: item.at,
    recordCount: item.recordCount,
    moduleId: item.moduleId,
    subjectId: item.subjectId,
    credentialValid: input.credentialValid,
    authorityValid: input.authorityValid,
  }));
  const finding = evaluateInstitutionalAccessSurveillance({
    observations: normalized,
    exportThreshold: input.exportThreshold,
    deniedThreshold: input.deniedThreshold,
  });
  const expired = Date.parse(input.grant.expiresAt) < Date.parse(input.now);
  const reasonCodes = [...finding.reasonCodes];
  if (expired) reasonCodes.push("GRANT_EXPIRED");
  const revoke = finding.status === "ACCESS_REVOKED" || expired;
  return {
    grantId: input.grant.grantId,
    status: revoke ? "ACCESS_REVOKED" : finding.status,
    reasonCodes,
    observationCount: normalized.length,
    revoke,
    snapshotSha256: sha({ grantId: input.grant.grantId, normalized, reasonCodes, now: input.now }),
  };
}

export function runInstitutionalAccessSurveillance(input: {
  now?: string;
  lookbackHours?: number;
  exportThreshold?: number;
  deniedThreshold?: number;
  actorId?: string;
} = {}) {
  const now = input.now ?? new Date().toISOString();
  const lookbackHours = input.lookbackHours ?? 24;
  const since = new Date(Date.parse(now) - lookbackHours * 60 * 60 * 1000).toISOString();
  const grants = unrevokedEvidenceAccessGrants();
  const plans: SurveillancePlan[] = [];
  for (const grant of grants) {
    const credential = findCredentialVerificationById(grant.credentialVerificationId);
    const authority = findLegalAuthorityVerificationById(grant.authorityVerificationId);
    const credentialValid = Boolean(
      credential && credential.status === "VERIFIED" &&
      credential.principalId === grant.principalId &&
      credential.principalEmail.toLowerCase() === grant.principalEmail.toLowerCase() &&
      credential.role === grant.role && Date.parse(credential.expiresAt) >= Date.parse(now),
    );
    const authorityValid = Boolean(
      authority && authority.status === "VERIFIED" && !authority.revoked &&
      authority.principalId === grant.principalId &&
      authority.principalEmail.toLowerCase() === grant.principalEmail.toLowerCase() &&
      authority.role === grant.role && authority.matterId === grant.matterId &&
      grant.subjectIds.includes(authority.clientOrAgencySubjectId) &&
      Date.parse(authority.effectiveAt) <= Date.parse(now) && Date.parse(authority.expiresAt) >= Date.parse(now),
    );
    const plan = planInstitutionalGrantSurveillance({
      grant,
      observations: institutionalAccessObservationsForGrant(grant.grantId, since, now),
      credentialValid,
      authorityValid,
      now,
      exportThreshold: input.exportThreshold ?? 500,
      deniedThreshold: input.deniedThreshold ?? 5,
    });
    if (plan.revoke && !grant.revokedAt) {
      revokeEvidenceAccessGrant({
        grantId: grant.grantId,
        revokedBy: input.actorId ?? "system:institutional-access-surveillance",
        reason: plan.reasonCodes.join(", "),
        at: now,
      });
    }
    recordInstitutionalSurveillanceRun({ plan, at: now, actorId: input.actorId ?? "system:institutional-access-surveillance" });
    plans.push(plan);
  }
  return {
    rule: INSTITUTIONAL_ACCESS_SURVEILLANCE_ORCHESTRATION_RULE,
    executedAt: now,
    lookbackHours,
    grantsEvaluated: plans.length,
    clean: plans.filter((p) => p.status === "CLEAN").length,
    reviewRequired: plans.filter((p) => p.status === "REVIEW_REQUIRED").length,
    revoked: plans.filter((p) => p.status === "ACCESS_REVOKED").length,
    plans,
  };
}
