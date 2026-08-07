import { and, desc, eq } from "drizzle-orm";

import { professionalByEmail, stagingTestProfessionalByEmail, type ProfessionalGrant } from "@/lib/auth/professionalRegistry";
import { serviceRequests } from "@/db/schema";
import { db } from "@/lib/db";

export type ProfessionalAccessRole = ProfessionalGrant["role"];

export type ProfessionalAccessDecision = Readonly<{
  allowed: boolean; role: ProfessionalAccessRole | null; principalId: string | null;
  principalEmail: string | null; organization: string | null; credentialVerificationId: string | null;
  reasonCode: "PROFESSIONAL_NOT_REGISTERED" | "PROFESSIONAL_ROLE_MISMATCH" |
    "PROFESSIONAL_CREDENTIAL_NOT_VERIFIED" | "PROFESSIONAL_ACCESS_VERIFIED";
}>;

export async function evaluateProfessionalAccess(input: {
  principalId: string | null; principalEmail: string | null; requestedRole: ProfessionalAccessRole; at?: string;
}): Promise<ProfessionalAccessDecision> {
  const grant = stagingTestProfessionalByEmail(input.principalEmail, input.requestedRole) ?? professionalByEmail(input.principalEmail);
  if (!grant) return { allowed: false, role: null, principalId: input.principalId, principalEmail: input.principalEmail, organization: null, credentialVerificationId: null, reasonCode: "PROFESSIONAL_NOT_REGISTERED" };
  if (grant.role !== input.requestedRole) return { allowed: false, role: grant.role, principalId: input.principalId, principalEmail: input.principalEmail, organization: grant.organization, credentialVerificationId: null, reasonCode: "PROFESSIONAL_ROLE_MISMATCH" };
  const principalEmail = input.principalEmail?.trim().toLowerCase() ?? null;
  if (!principalEmail) return { allowed: false, role: grant.role, principalId: null, principalEmail: null, organization: grant.organization, credentialVerificationId: null, reasonCode: "PROFESSIONAL_CREDENTIAL_NOT_VERIFIED" };
  const rows = await db.select().from(serviceRequests).where(and(
    eq(serviceRequests.requestType, "professional_credential_verification_request"),
    eq(serviceRequests.contactEmail, principalEmail),
    eq(serviceRequests.status, "VERIFIED"),
  )).orderBy(desc(serviceRequests.reviewedAt), desc(serviceRequests.updatedAt)).limit(10);
  const now = Date.parse(input.at ?? new Date().toISOString());
  const verified = rows.find((row) => {
    const m = (row.metadata ?? {}) as Record<string, unknown>;
    return m.professionalRole === input.requestedRole && typeof m.credentialExpiresAt === "string" &&
      Date.parse(m.credentialExpiresAt) >= now && typeof m.credentialVerificationId === "string";
  });
  if (!verified) return { allowed: false, role: grant.role, principalId: principalEmail, principalEmail, organization: grant.organization, credentialVerificationId: null, reasonCode: "PROFESSIONAL_CREDENTIAL_NOT_VERIFIED" };
  const metadata = (verified.metadata ?? {}) as Record<string, unknown>;
  return { allowed: true, role: grant.role, principalId: principalEmail, principalEmail, organization: grant.organization, credentialVerificationId: String(metadata.credentialVerificationId), reasonCode: "PROFESSIONAL_ACCESS_VERIFIED" };
}
