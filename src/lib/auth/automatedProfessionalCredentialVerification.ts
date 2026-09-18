import { createHash } from "node:crypto";

import type { ProfessionalAccessRole } from "./professionalAccessAuthority";

export type AutomatedCredentialResult = Readonly<{
  status: "VERIFIED" | "REJECTED" | "INCONCLUSIVE" | "PROVIDER_NOT_CONFIGURED";
  provider: string;
  officialSourceRef: string | null;
  officialSourcePayload: string | null;
  standing: string | null;
  expiresAt: string | null;
  matchedName: string | null;
  matchedCredentialIdentifier: string | null;
  evidenceSha256: string | null;
  reason: string;
}>;

export type AutomatedCredentialInput = Readonly<{
  fullLegalName: string;
  email: string;
  role: ProfessionalAccessRole;
  credentialType: string;
  credentialIdentifier: string;
  jurisdictionOrIssuer: string;
  organization?: string | null;
}>;

function normalized(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function acceptableStanding(role: ProfessionalAccessRole, standing: string): boolean {
  const value = normalized(standing);
  if (role === "lender" || role === "attorney") {
    return ["active", "eligible", "good standing", "active good standing", "active eligible"].includes(value);
  }
  if (role === "auditor") return !["inactive", "revoked", "suspended", "expired"].includes(value);
  if (role === "sponsor") return ["active", "current", "verified", "good standing"].includes(value);
  return false;
}

function evidenceHash(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export async function automateProfessionalCredentialVerification(
  input: AutomatedCredentialInput
): Promise<AutomatedCredentialResult> {
  const endpoint = process.env.PROFESSIONAL_CREDENTIAL_VERIFIER_URL?.trim();
  const apiKey = process.env.PROFESSIONAL_CREDENTIAL_VERIFIER_API_KEY?.trim();
  if (!endpoint || !apiKey) {
    return {
      status: "PROVIDER_NOT_CONFIGURED", provider: "none", officialSourceRef: null,
      officialSourcePayload: null, standing: null, expiresAt: null, matchedName: null,
      matchedCredentialIdentifier: null, evidenceSha256: null,
      reason: "Automated credential verifier is not configured.",
    };
  }
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    return {
      status: "INCONCLUSIVE", provider: "configured-provider", officialSourceRef: null,
      officialSourcePayload: null, standing: null, expiresAt: null, matchedName: null,
      matchedCredentialIdentifier: null, evidenceSha256: null,
      reason: `Credential verification provider returned HTTP ${response.status}.`,
    };
  }
  const payload = await response.json() as Record<string, unknown>;
  const standing = typeof payload.standing === "string" ? payload.standing : "";
  const sourceRef = typeof payload.officialSourceRef === "string" ? payload.officialSourceRef : null;
  const matchedName = typeof payload.fullLegalName === "string" ? payload.fullLegalName : null;
  const matchedIdentifier = typeof payload.credentialIdentifier === "string" ? payload.credentialIdentifier : null;
  const nameMatches = matchedName ? normalized(matchedName) === normalized(input.fullLegalName) : false;
  const identifierMatches = matchedIdentifier ? normalized(matchedIdentifier) === normalized(input.credentialIdentifier) : false;
  const expiresAt = typeof payload.expiresAt === "string" ? payload.expiresAt : null;
  const expiryValid = expiresAt !== null && Number.isFinite(Date.parse(expiresAt)) && Date.parse(expiresAt) > Date.now();
  const verified = payload.verified === true && Boolean(sourceRef) && nameMatches && identifierMatches && acceptableStanding(input.role, standing) && expiryValid;
  const rejected = payload.verified === false && Boolean(sourceRef);
  return {
    status: verified ? "VERIFIED" : rejected ? "REJECTED" : "INCONCLUSIVE",
    provider: typeof payload.provider === "string" ? payload.provider : "configured-provider",
    officialSourceRef: sourceRef,
    officialSourcePayload: JSON.stringify(payload),
    standing: standing || null,
    expiresAt,
    matchedName,
    matchedCredentialIdentifier: matchedIdentifier,
    evidenceSha256: evidenceHash(payload),
    reason: verified
      ? "Credential matched the authoritative source and standing requirements."
      : rejected
        ? "Authoritative source rejected the credential."
        : "Automated sources did not return a conclusive credential match.",
  };
}
