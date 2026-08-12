import type { LedgerEvent } from "@/lib/audit/appendLedger";
import { evaluateInstitutionalAbac, type DataField } from "@/lib/governance/institutionalAbacDisclosure";
import { findCredentialVerificationById } from "@/lib/governance/institutionalCredentialVerification";
import type { EvidenceAccessGrant } from "@/lib/governance/institutionalEvidenceAccess";
import { findLegalAuthorityVerificationById } from "@/lib/governance/institutionalLegalAuthorityVerification";

export const INSTITUTIONAL_ACCESS_RUNTIME_ENFORCEMENT_RULE =
  "INSTITUTIONAL-ACCESS-RUNTIME-ENFORCEMENT-001" as const;

export type RuntimePacketDecision = Readonly<{
  allowed: boolean;
  reasonCodes: readonly string[];
  events: readonly LedgerEvent[];
  capabilityToken: string | null;
  capabilityExpiresAt: string | null;
  withheldCount: number;
}>;

function eventModule(event: LedgerEvent): string {
  return String(event.domain || "audit");
}

function eventSubject(event: LedgerEvent): string {
  return String(event.subject || "unknown-subject");
}

export function enforceInstitutionalPacketAccess(input: {
  actorId: string;
  actorEmail: string;
  actorRole: string;
  grant: EvidenceAccessGrant | null;
  candidateEvents: readonly LedgerEvent[];
  requestedModuleId: string | null;
  requestedSubjectId: string | null;
  requestedWindowStart: string | null;
  requestedWindowEnd: string | null;
  action?: "VIEW" | "VERIFY" | "EXPORT";
  stepUpAuthenticated?: boolean;
  now?: string;
}): RuntimePacketDecision {
  const now = input.now ?? new Date().toISOString();
  const grant = input.grant;
  if (!grant) {
    return { allowed: false, reasonCodes: ["SCOPED_GRANT_REQUIRED"], events: [], capabilityToken: null, capabilityExpiresAt: null, withheldCount: input.candidateEvents.length };
  }
  if (grant.principalId !== input.actorId || grant.principalEmail.toLowerCase() !== input.actorEmail.toLowerCase() || grant.role !== input.actorRole) {
    return { allowed: false, reasonCodes: ["GRANT_PRINCIPAL_ROLE_MISMATCH"], events: [], capabilityToken: null, capabilityExpiresAt: null, withheldCount: input.candidateEvents.length };
  }
  if (grant.revokedAt || Date.parse(grant.expiresAt) < Date.parse(now)) {
    return { allowed: false, reasonCodes: ["GRANT_REVOKED_OR_EXPIRED"], events: [], capabilityToken: null, capabilityExpiresAt: null, withheldCount: input.candidateEvents.length };
  }
  if (!grant.matterId || grant.moduleIds.length === 0 || grant.subjectIds.length === 0) {
    return { allowed: false, reasonCodes: ["EXPLICIT_MATTER_MODULE_SUBJECT_SCOPE_REQUIRED"], events: [], capabilityToken: null, capabilityExpiresAt: null, withheldCount: input.candidateEvents.length };
  }
  const credential = findCredentialVerificationById(grant.credentialVerificationId);
  const authority = findLegalAuthorityVerificationById(grant.authorityVerificationId);
  const credentialValid = Boolean(
    credential && credential.status === "VERIFIED" &&
    credential.principalId === input.actorId &&
    credential.principalEmail.toLowerCase() === input.actorEmail.toLowerCase() &&
    credential.role === grant.role &&
    Date.parse(credential.expiresAt) >= Date.parse(now),
  );
  const authorityValid = Boolean(
    authority && authority.status === "VERIFIED" && !authority.revoked &&
    authority.principalId === input.actorId &&
    authority.principalEmail.toLowerCase() === input.actorEmail.toLowerCase() &&
    authority.role === grant.role && authority.matterId === grant.matterId &&
    grant.subjectIds.includes(authority.clientOrAgencySubjectId) &&
    Date.parse(authority.effectiveAt) <= Date.parse(now) &&
    Date.parse(authority.expiresAt) >= Date.parse(now),
  );
  const windowStart = input.requestedWindowStart ?? grant.windowStart ?? grant.issuedAt;
  const windowEnd = input.requestedWindowEnd ?? grant.windowEnd ?? grant.expiresAt;
  const fields: DataField[] = input.candidateEvents.map((event, index) => ({
    name: `event:${index}:${event.ts}`,
    value: event,
    classification: "RESTRICTED",
    subjectId: eventSubject(event),
    moduleId: eventModule(event),
    purposes: [grant.purpose],
  }));
  const decision = evaluateInstitutionalAbac({
    request: {
      principalId: input.actorId,
      principalEmail: input.actorEmail,
      role: grant.role,
      credentialVerificationId: grant.credentialVerificationId,
      authorityVerificationId: grant.authorityVerificationId,
      matterId: grant.matterId,
      tenantId: grant.tenantId,
      subjectIds: input.requestedSubjectId ? [input.requestedSubjectId] : grant.subjectIds,
      moduleIds: input.requestedModuleId ? [input.requestedModuleId] : grant.moduleIds,
      purpose: grant.purpose,
      action: input.action ?? "VIEW",
      windowStart,
      windowEnd,
      now,
      stepUpAuthenticated: input.stepUpAuthenticated ?? false,
    },
    fields,
    credentialValid,
    authorityValid,
  });
  return {
    allowed: decision.allowed,
    reasonCodes: decision.reasonCodes,
    events: decision.disclosed.map((field) => field.value as LedgerEvent),
    capabilityToken: decision.capabilityToken,
    capabilityExpiresAt: decision.expiresAt,
    withheldCount: decision.withheld.length,
  };
}
