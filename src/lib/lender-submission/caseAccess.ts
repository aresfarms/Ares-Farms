import { eq } from "drizzle-orm";
import type { AccessRole } from "@/lib/auth/accessControl";
import { professionalByEmail } from "@/lib/auth/professionalRegistry";
import { db } from "@/lib/db";
import { customerSubmissionConsents, lenderSubmissionCases } from "@/db/schema";

const PRIVILEGED_CASE_ROLES = new Set<AccessRole>(["operator", "admin", "governance"]);

function norm(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function createdBy(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const value = (metadata as Record<string, unknown>).createdBy;
  return typeof value === "string" ? value : null;
}

export type SubmissionCaseAccessRecord = {
  customerId: string;
  metadata: unknown;
};

export type SubmissionCaseAccessConsent = {
  lenderId: string;
  packageVersionId: string;
  revokedAt: Date | null;
  expiresAt: Date;
};

/** Pure object-access decision used by both the runtime guard and the two-actor
 * BOLA conformance test. The caller supplies only already-authenticated actor
 * identity; there is no request/body role claim in this function. */
export function submissionCaseAccessAllowed(input: {
  record: SubmissionCaseAccessRecord;
  consents?: SubmissionCaseAccessConsent[];
  actorId: string;
  role: AccessRole;
  allowConsentedProvider?: boolean;
  packageVersionId?: string | null;
  providerIds?: string[];
  now?: Date;
}): boolean {
  if (PRIVILEGED_CASE_ROLES.has(input.role)) return true;

  const actor = norm(input.actorId);
  if (input.role === "borrower") {
    const ownerIds = [input.record.customerId, createdBy(input.record.metadata)]
      .map(norm)
      .filter(Boolean);
    return Boolean(actor && ownerIds.includes(actor));
  }

  if (input.role === "lender" && input.allowConsentedProvider) {
    const providerIds = new Set((input.providerIds ?? [input.actorId]).map(norm).filter(Boolean));
    const now = (input.now ?? new Date()).getTime();
    return (input.consents ?? []).some((consent) =>
      providerIds.has(norm(consent.lenderId)) &&
      !consent.revokedAt &&
      consent.expiresAt.getTime() > now &&
      (!input.packageVersionId || consent.packageVersionId === input.packageVersionId),
    );
  }

  return false;
}

/**
 * Object-level authorization for the lender-submission / Furlong Case surface.
 * Role authorization alone is never enough: borrowers may see only their own
 * case and providers may see a case only after an unexpired, unrevoked consent
 * names their provider identity. A denied object is deliberately reported as
 * not found so UUID probing does not become a case-existence oracle.
 */
export async function assertSubmissionCaseAccess(input: {
  caseId: string;
  actorId: string;
  role: AccessRole;
  allowConsentedProvider?: boolean;
  packageVersionId?: string | null;
}) {
  const [record] = await db
    .select()
    .from(lenderSubmissionCases)
    .where(eq(lenderSubmissionCases.id, input.caseId))
    .limit(1);
  if (!record) throw new Error("Lender submission case was not found.");

  let consents: SubmissionCaseAccessConsent[] = [];
  let providerIds = [input.actorId];
  if (input.role === "lender" && input.allowConsentedProvider) {
    const grant = professionalByEmail(input.actorId);
    providerIds = [input.actorId, grant?.organization ?? "", ...(grant?.providerIds ?? [])];
    consents = await db
      .select({
        lenderId: customerSubmissionConsents.lenderId,
        packageVersionId: customerSubmissionConsents.packageVersionId,
        revokedAt: customerSubmissionConsents.revokedAt,
        expiresAt: customerSubmissionConsents.expiresAt,
      })
      .from(customerSubmissionConsents)
      .where(eq(customerSubmissionConsents.caseId, input.caseId));
  }

  if (submissionCaseAccessAllowed({ ...input, record, consents, providerIds })) return record;
  throw new Error("Lender submission case was not found.");
}

export function assertBorrowerCustomerBinding(input: {
  actorId: string;
  role: AccessRole;
  requestedCustomerId: string;
}): string {
  const requested = input.requestedCustomerId.trim();
  if (input.role !== "borrower") return requested;
  if (!input.actorId.trim()) throw new Error("Authenticated borrower identity is required.");
  if (requested && norm(requested) !== norm(input.actorId)) {
    throw new Error("Borrower cases must be bound to the authenticated borrower.");
  }
  return input.actorId.trim();
}
