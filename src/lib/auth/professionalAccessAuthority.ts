import { and, desc, eq } from "drizzle-orm";

import {
  professionalByEmail,
  stagingTestProfessionalByEmail,
  type ProfessionalGrant,
} from "@/lib/auth/professionalRegistry";
import { capitalNetworkProviders, serviceRequests } from "@/db/schema";
import { db } from "@/lib/db";

export type ProfessionalAccessRole = ProfessionalGrant["role"];

export type ProfessionalAccessDecision = Readonly<{
  allowed: boolean;
  role: ProfessionalAccessRole | null;
  principalId: string | null;
  principalEmail: string | null;
  organization: string | null;
  providerId: string | null;
  credentialVerificationId: string | null;
  reasonCode:
    | "PROFESSIONAL_NOT_REGISTERED"
    | "PROFESSIONAL_ROLE_MISMATCH"
    | "PROFESSIONAL_CREDENTIAL_NOT_VERIFIED"
    | "PROFESSIONAL_ACCESS_VERIFIED";
}>;

async function dynamicCapitalGrant(
  email: string | null,
  requestedRole: ProfessionalAccessRole,
): Promise<ProfessionalGrant | null> {
  if (!email || (requestedRole !== "broker" && requestedRole !== "lender")) return null;
  const rows = await db
    .select()
    .from(capitalNetworkProviders)
    .where(eq(capitalNetworkProviders.primaryContactEmail, email))
    .orderBy(desc(capitalNetworkProviders.updatedAt))
    .limit(10);
  const expectedRole = requestedRole.toUpperCase();
  const row = rows.find(
    (candidate) =>
      candidate.status === "CERTIFIED_ACTIVE" &&
      candidate.providerRole === expectedRole &&
      candidate.credentialStatus === "VERIFIED",
  );
  if (!row) return null;
  return {
    email,
    name: row.organizationName,
    role: requestedRole,
    organization: row.organizationName,
    basis: "Certified Capital Network provider profile bound to this authenticated principal.",
    providerId: row.providerId,
  };
}

export async function evaluateProfessionalAccess(input: {
  principalId: string | null;
  principalEmail: string | null;
  requestedRole: ProfessionalAccessRole;
  at?: string;
}): Promise<ProfessionalAccessDecision> {
  const principalEmail = input.principalEmail?.trim().toLowerCase() ?? null;
  const testGrant = stagingTestProfessionalByEmail(principalEmail, input.requestedRole);
  const staticGrant = testGrant ?? professionalByEmail(principalEmail);
  const grant = staticGrant ?? (await dynamicCapitalGrant(principalEmail, input.requestedRole));
  if (!grant)
    return {
      allowed: false,
      role: null,
      principalId: input.principalId,
      principalEmail,
      organization: null,
      providerId: null,
      credentialVerificationId: null,
      reasonCode: "PROFESSIONAL_NOT_REGISTERED",
    };
  if (grant.role !== input.requestedRole)
    return {
      allowed: false,
      role: grant.role,
      principalId: input.principalId,
      principalEmail,
      organization: grant.organization,
      providerId: grant.providerId ?? null,
      credentialVerificationId: null,
      reasonCode: "PROFESSIONAL_ROLE_MISMATCH",
    };
  if (!principalEmail)
    return {
      allowed: false,
      role: grant.role,
      principalId: null,
      principalEmail: null,
      organization: grant.organization,
      providerId: grant.providerId ?? null,
      credentialVerificationId: null,
      reasonCode: "PROFESSIONAL_CREDENTIAL_NOT_VERIFIED",
    };
  const rows = await db
    .select()
    .from(serviceRequests)
    .where(
      and(
        eq(serviceRequests.requestType, "professional_credential_verification_request"),
        eq(serviceRequests.contactEmail, principalEmail),
        eq(serviceRequests.status, "VERIFIED"),
      ),
    )
    .orderBy(desc(serviceRequests.reviewedAt), desc(serviceRequests.updatedAt))
    .limit(10);
  const now = Date.parse(input.at ?? new Date().toISOString());
  const verified = rows.find((row) => {
    const m = (row.metadata ?? {}) as Record<string, unknown>;
    const synthetic = m.syntheticFixture as Record<string, unknown> | undefined;
    const testLineageValid =
      !testGrant ||
      (synthetic?.testOnly === true &&
        synthetic.syntheticPersonaId === "syn-pocohantus-smith-001" &&
        synthetic.scenarioId === `professional-${input.requestedRole}` &&
        synthetic.operatorIdentity === "user:chudson@aresfarmsinc.com" &&
        synthetic.environment !== "production" &&
        typeof synthetic.lineageSha256 === "string");
    return (
      m.professionalRole === input.requestedRole &&
      typeof m.credentialExpiresAt === "string" &&
      Date.parse(m.credentialExpiresAt) >= now &&
      typeof m.credentialVerificationId === "string" &&
      testLineageValid
    );
  });
  if (!verified)
    return {
      allowed: false,
      role: grant.role,
      principalId: principalEmail,
      principalEmail,
      organization: grant.organization,
      providerId: grant.providerId ?? null,
      credentialVerificationId: null,
      reasonCode: "PROFESSIONAL_CREDENTIAL_NOT_VERIFIED",
    };
  const metadata = (verified.metadata ?? {}) as Record<string, unknown>;
  return {
    allowed: true,
    role: grant.role,
    principalId: principalEmail,
    principalEmail,
    organization: grant.organization,
    providerId: grant.providerId ?? null,
    credentialVerificationId: String(metadata.credentialVerificationId),
    reasonCode: "PROFESSIONAL_ACCESS_VERIFIED",
  };
}
