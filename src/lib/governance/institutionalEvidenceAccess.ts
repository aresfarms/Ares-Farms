import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { chainAppend, verifyLedgerChain } from "@/lib/security/ledgerHashChain";
import { findCredentialVerificationById } from "@/lib/governance/institutionalCredentialVerification";
import { findLegalAuthorityVerificationById } from "@/lib/governance/institutionalLegalAuthorityVerification";

export type InstitutionalReviewRole = "auditor" | "government_official" | "attorney";
export type EvidenceAccessGrant = {
  grantId: string;
  role: InstitutionalReviewRole;
  principalId: string;
  principalEmail: string;
  purpose: string;
  matterId: string | null;
  agencyOrFirm: string | null;
  tenantId: string | null;
  moduleIds: string[];
  subjectIds: string[];
  tokenId: string | null;
  windowStart: string | null;
  windowEnd: string | null;
  expiresAt: string;
  issuedBy: string;
  credentialVerificationId: string;
  authorityVerificationId: string;
  issuedAt: string;
  revokedAt: string | null;
};

export type EvidenceAccessDecision = {
  allowed: boolean;
  reason: string;
  effectiveTokenId: string | null;
  effectiveWindowStart: string | null;
  effectiveWindowEnd: string | null;
  permittedModuleIds: string[];
  permittedSubjectIds: string[];
};

const ACCESS_LEDGER = path.join(process.cwd(), "data", "governed-evidence-access-ledger.ndjson");

function parseDate(value: string | null): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}


export function readInstitutionalAccessLedger(): Array<Record<string, unknown>> {
  try {
    return fs.readFileSync(ACCESS_LEDGER, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line) as Record<string, unknown>);
  } catch {
    return [];
  }
}

export function issueEvidenceAccessGrant(input: Omit<EvidenceAccessGrant, "grantId" | "issuedAt" | "revokedAt"> & { issuedAt?: string }): EvidenceAccessGrant {
  if (!input.purpose.trim()) throw new Error("A specific evidence-review purpose is required.");
  if (!input.credentialVerificationId.trim()) throw new Error("An active institutional credential verification is required.");
  const credential = findCredentialVerificationById(input.credentialVerificationId);
  if (!credential || credential.status !== "VERIFIED" || Date.parse(credential.expiresAt) < Date.now()) {
    throw new Error("The institutional credential verification is missing, expired, or not verified.");
  }
  if (credential.principalId !== input.principalId || credential.principalEmail.toLowerCase() !== input.principalEmail.toLowerCase() || credential.tokenBoundPrincipalId !== input.principalId || credential.tokenBoundPrincipalEmail.toLowerCase() !== input.principalEmail.toLowerCase() || credential.role !== input.role) {
    throw new Error("The credential verification token is not bound to this exact principal, email, and role.");
  }
  const authority = findLegalAuthorityVerificationById(input.authorityVerificationId);
  if (!authority || authority.status !== "VERIFIED" || authority.revoked || Date.parse(authority.expiresAt) < Date.now()) {
    throw new Error("A current independently verified legal-authority receipt is required.");
  }
  if (authority.principalId !== input.principalId || authority.principalEmail.toLowerCase() !== input.principalEmail.toLowerCase() || authority.role !== input.role) {
    throw new Error("The legal-authority token is not bound to this exact principal, email, and role.");
  }
  if (input.matterId && authority.matterId !== input.matterId) {
    throw new Error("The legal-authority receipt does not match the requested matter.");
  }
  if (input.subjectIds.length > 0 && !input.subjectIds.includes(authority.clientOrAgencySubjectId)) {
    throw new Error("The legal-authority receipt does not match the requested client or agency subject.");
  }
  if (input.role === "attorney" && !input.tokenId && !input.windowStart && !input.windowEnd) {
    throw new Error("Attorney grants must be token-bound or time-window-bound.");
  }
  if (input.role === "government_official" && !input.agencyOrFirm?.trim()) {
    throw new Error("Governmental-official grants require an agency or public body.");
  }
  const grant: EvidenceAccessGrant = { ...input, grantId: randomUUID(), issuedAt: input.issuedAt ?? new Date().toISOString(), revokedAt: null };
  chainAppend(ACCESS_LEDGER, { schemaVersion: "institutional-evidence-access-v1", event: "GRANT_ISSUED", ...grant });
  return grant;
}

export function revokeEvidenceAccessGrant(input: { grantId: string; revokedBy: string; reason: string; at?: string }): void {
  const current = findEvidenceAccessGrant(input.grantId);
  if (!current) throw new Error("Unknown evidence access grant.");
  chainAppend(ACCESS_LEDGER, { schemaVersion: "institutional-evidence-access-v1", event: "GRANT_REVOKED", grantId: input.grantId, revokedBy: input.revokedBy, reason: input.reason, at: input.at ?? new Date().toISOString() });
}

export function findEvidenceAccessGrant(grantId: string): EvidenceAccessGrant | null {
  const rows = readInstitutionalAccessLedger();
  const issued = rows.find((row) => row.event === "GRANT_ISSUED" && row.grantId === grantId) as (Record<string, unknown> | undefined);
  if (!issued) return null;
  const revoked = rows.slice().reverse().find((row) => row.event === "GRANT_REVOKED" && row.grantId === grantId);
  return {
    grantId: String(issued.grantId), role: issued.role as InstitutionalReviewRole, principalId: String(issued.principalId), principalEmail: String(issued.principalEmail),
    purpose: String(issued.purpose), matterId: issued.matterId ? String(issued.matterId) : null, agencyOrFirm: issued.agencyOrFirm ? String(issued.agencyOrFirm) : null,
    tenantId: issued.tenantId ? String(issued.tenantId) : null, moduleIds: Array.isArray(issued.moduleIds) ? issued.moduleIds.map(String) : [],
    subjectIds: Array.isArray(issued.subjectIds) ? issued.subjectIds.map(String) : [], tokenId: issued.tokenId ? String(issued.tokenId) : null,
    windowStart: issued.windowStart ? String(issued.windowStart) : null, windowEnd: issued.windowEnd ? String(issued.windowEnd) : null, expiresAt: String(issued.expiresAt),
    issuedBy: String(issued.issuedBy), credentialVerificationId: String(issued.credentialVerificationId), authorityVerificationId: String(issued.authorityVerificationId), issuedAt: String(issued.issuedAt), revokedAt: revoked ? String(revoked.at ?? "revoked") : null,
  };
}

export function evaluateInstitutionalEvidenceAccess(input: {
  role: string;
  actorId: string;
  actorEmail: string;
  grant: EvidenceAccessGrant | null;
  suppliedTokenId?: string | null;
  requestedModuleId?: string | null;
  requestedSubjectId?: string | null;
  requestedWindowStart?: string | null;
  requestedWindowEnd?: string | null;
  now?: string;
}): EvidenceAccessDecision {
  const now = Date.parse(input.now ?? new Date().toISOString());
  const role = input.role as InstitutionalReviewRole;
  if (!(["auditor", "government_official", "attorney"] as string[]).includes(role)) {
    return { allowed: false, reason: "This identity is not an institutional evidence-review role.", effectiveTokenId: null, effectiveWindowStart: null, effectiveWindowEnd: null, permittedModuleIds: [], permittedSubjectIds: [] };
  }

  const grant = input.grant;
  if (!grant) {
    return { allowed: false, reason: `${role} access requires an active, credential-backed and authority-backed scoped grant.`, effectiveTokenId: null, effectiveWindowStart: null, effectiveWindowEnd: null, permittedModuleIds: [], permittedSubjectIds: [] };
  }
  if (grant.role !== role || grant.principalId !== input.actorId || grant.principalEmail.toLowerCase() !== input.actorEmail.toLowerCase()) {
    return { allowed: false, reason: "The access grant is not bound to this authenticated identity and role.", effectiveTokenId: null, effectiveWindowStart: null, effectiveWindowEnd: null, permittedModuleIds: [], permittedSubjectIds: [] };
  }
  if (grant.revokedAt || now > Date.parse(grant.expiresAt)) {
    return { allowed: false, reason: "The access grant is revoked or expired.", effectiveTokenId: null, effectiveWindowStart: null, effectiveWindowEnd: null, permittedModuleIds: [], permittedSubjectIds: [] };
  }
  if (input.requestedModuleId && grant.moduleIds.length > 0 && !grant.moduleIds.includes(input.requestedModuleId)) {
    return { allowed: false, reason: "The requested module is outside the grant.", effectiveTokenId: null, effectiveWindowStart: null, effectiveWindowEnd: null, permittedModuleIds: grant.moduleIds, permittedSubjectIds: grant.subjectIds };
  }
  if (input.requestedSubjectId && grant.subjectIds.length > 0 && !grant.subjectIds.includes(input.requestedSubjectId)) {
    return { allowed: false, reason: "The requested subject is outside the grant.", effectiveTokenId: null, effectiveWindowStart: null, effectiveWindowEnd: null, permittedModuleIds: grant.moduleIds, permittedSubjectIds: grant.subjectIds };
  }
  const requestedStart = parseDate(input.requestedWindowStart ?? null);
  const requestedEnd = parseDate(input.requestedWindowEnd ?? null);
  const grantStart = parseDate(grant.windowStart);
  const grantEnd = parseDate(grant.windowEnd);
  if (requestedStart !== null && grantStart !== null && requestedStart < grantStart) {
    return { allowed: false, reason: "The requested start time precedes the authorized window.", effectiveTokenId: null, effectiveWindowStart: grant.windowStart, effectiveWindowEnd: grant.windowEnd, permittedModuleIds: grant.moduleIds, permittedSubjectIds: grant.subjectIds };
  }
  if (requestedEnd !== null && grantEnd !== null && requestedEnd > grantEnd) {
    return { allowed: false, reason: "The requested end time exceeds the authorized window.", effectiveTokenId: null, effectiveWindowStart: grant.windowStart, effectiveWindowEnd: grant.windowEnd, permittedModuleIds: grant.moduleIds, permittedSubjectIds: grant.subjectIds };
  }
  return { allowed: true, reason: "Authenticated identity matches an active, scoped institutional access grant.", effectiveTokenId: grant.tokenId ?? input.suppliedTokenId ?? null, effectiveWindowStart: input.requestedWindowStart ?? grant.windowStart, effectiveWindowEnd: input.requestedWindowEnd ?? grant.windowEnd, permittedModuleIds: grant.moduleIds, permittedSubjectIds: grant.subjectIds };
}

export function recordInstitutionalEvidenceAccess(input: {
  actorId: string;
  actorEmail: string;
  role: string;
  outcome: "ALLOWED" | "DENIED";
  reason: string;
  grantId?: string | null;
  moduleId?: string | null;
  subjectId?: string | null;
  tokenId?: string | null;
  windowStart?: string | null;
  windowEnd?: string | null;
  action: "LOGIN" | "VIEW_PACKET" | "SEARCH" | "VERIFY_HASH" | "EXPORT";
  at?: string;
}) {
  return chainAppend(ACCESS_LEDGER, {
    schemaVersion: "institutional-evidence-access-v1",
    eventId: randomUUID(),
    at: input.at ?? new Date().toISOString(),
    actorId: input.actorId,
    actorEmail: input.actorEmail,
    role: input.role,
    action: input.action,
    outcome: input.outcome,
    reason: input.reason,
    grantId: input.grantId ?? null,
    moduleId: input.moduleId ?? null,
    subjectId: input.subjectId ?? null,
    tokenId: input.tokenId ?? null,
    windowStart: input.windowStart ?? null,
    windowEnd: input.windowEnd ?? null,
  });
}


export type InstitutionalAccessObservation = {
  actorId: string;
  grantId: string;
  action: "VIEW" | "SEARCH" | "VERIFY_HASH" | "EXPORT" | "DENIED";
  at: string;
  recordCount: number;
  moduleId: string | null;
  subjectId: string | null;
};

export function unrevokedEvidenceAccessGrants(): EvidenceAccessGrant[] {
  const rows = readInstitutionalAccessLedger();
  const ids = [...new Set(rows.filter((r) => r.event === "GRANT_ISSUED").map((r) => String(r.grantId)))];
  return ids.map(findEvidenceAccessGrant).filter((g): g is EvidenceAccessGrant => Boolean(g && !g.revokedAt));
}

export function institutionalAccessObservationsForGrant(grantId: string, since: string, until: string): InstitutionalAccessObservation[] {
  return readInstitutionalAccessLedger().filter((r) => r.grantId === grantId && r.eventId && Date.parse(String(r.at)) >= Date.parse(since) && Date.parse(String(r.at)) <= Date.parse(until)).map((r) => ({
    actorId: String(r.actorId ?? "unknown"), grantId,
    action: r.outcome === "DENIED" ? "DENIED" : String(r.action) === "EXPORT" ? "EXPORT" : String(r.action) === "SEARCH" ? "SEARCH" : String(r.action) === "VERIFY_HASH" ? "VERIFY_HASH" : "VIEW",
    at: String(r.at), recordCount: Number(r.recordCount ?? 1),
    moduleId: r.moduleId ? String(r.moduleId) : null, subjectId: r.subjectId ? String(r.subjectId) : null,
  }));
}

export function recordInstitutionalSurveillanceRun(input: { plan: unknown; at: string; actorId: string }) {
  return chainAppend(ACCESS_LEDGER, { schemaVersion: "institutional-evidence-access-v1", event: "SURVEILLANCE_RUN", ...input });
}

export function institutionalEvidenceAccessLedgerVerification() {
  return verifyLedgerChain(ACCESS_LEDGER);
}
