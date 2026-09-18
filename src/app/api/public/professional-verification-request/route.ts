import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

import {
  professionalByEmail,
  stagingTestProfessionalByEmail,
} from "@/lib/auth/professionalRegistry";
import { automateProfessionalCredentialVerification } from "@/lib/auth/automatedProfessionalCredentialVerification";
import { persistServiceRequest } from "@/lib/serviceRequests/serviceRequestStore";
import { verifyInstitutionalCredential } from "@/lib/governance/institutionalCredentialVerification";
import { serviceRequests } from "@/db/schema";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { resolveNextAuthSecret } from "@/lib/auth/nextAuthSecurity";
import {
  SYNTHETIC_FIXTURE_COOKIE,
  verifySyntheticFixtureSessionToken,
  type SyntheticFixtureContext,
} from "@/lib/testing/syntheticFixtureLineage";

const ROLES = new Set(["broker", "lender", "attorney", "auditor", "sponsor"]);

async function professionalSyntheticContext(
  req: NextRequest,
  email: string,
  fullLegalName: string,
  role: string,
): Promise<SyntheticFixtureContext | null> {
  if (
    email !== "chudson@aresfarmsinc.com" ||
    fullLegalName.toLowerCase() !== "pocohantus smith"
  ) {
    return null;
  }
  const secret = resolveNextAuthSecret();
  if (!secret)
    throw new Error("Synthetic fixture session authority unavailable.");
  const token = await getToken({ req, secret });
  const sessionEmail =
    typeof token?.email === "string" ? token.email.trim().toLowerCase() : "";
  const context = verifySyntheticFixtureSessionToken(
    req.cookies.get(SYNTHETIC_FIXTURE_COOKIE)?.value,
    secret,
    sessionEmail,
  );
  if (
    !context ||
    context.syntheticPersonaId !== "syn-pocohantus-smith-001" ||
    context.scenarioId !== `professional-${role}`
  ) {
    throw new Error(
      "Activate the governed Pocohantus Smith fixture for this professional lane before verification.",
    );
  }
  return context;
}

export async function POST(req: NextRequest) {
  const traceId = `professional-verification-request-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const body = (await req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const fullLegalName =
    typeof body?.fullLegalName === "string"
      ? body.fullLegalName.trim().slice(0, 180)
      : "";
  const role =
    typeof body?.role === "string" ? body.role.trim().toLowerCase() : "";
  const credentialType =
    typeof body?.credentialType === "string"
      ? body.credentialType.trim().slice(0, 180)
      : "";
  const credentialIdentifier =
    typeof body?.credentialIdentifier === "string"
      ? body.credentialIdentifier.trim().slice(0, 180)
      : "";
  const issuer =
    typeof body?.jurisdictionOrIssuer === "string"
      ? body.jurisdictionOrIssuer.trim().slice(0, 240)
      : "";
  const organization =
    typeof body?.organization === "string"
      ? body.organization.trim().slice(0, 240)
      : "";
  if (
    !email ||
    !email.includes("@") ||
    !fullLegalName ||
    !ROLES.has(role) ||
    !credentialType ||
    !credentialIdentifier ||
    !issuer ||
    body?.consented !== true
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "Complete all credential fields and consent to verification.",
      },
      { status: 400 },
    );
  }
  const requestedRole = role as "lender" | "attorney" | "auditor" | "sponsor";
  let syntheticContext: SyntheticFixtureContext | null = null;
  try {
    syntheticContext = await professionalSyntheticContext(
      req,
      email,
      fullLegalName,
      role,
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Synthetic fixture authorization failed.",
      },
      { status: 403 },
    );
  }
  const invited = syntheticContext
    ? stagingTestProfessionalByEmail(email, requestedRole)
    : professionalByEmail(email);
  if (!invited || invited.role !== role) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "This email and professional lane are not registered for Furlong professional access.",
      },
      { status: 403 },
    );
  }
  const requestId = `profcred-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const request = await persistServiceRequest({
    traceId,
    serviceRequestId: requestId,
    requestType: "professional_credential_verification_request",
    serviceCode: role,
    status: "AUTOMATED_VERIFICATION_RUNNING",
    routedTo: "professional-credential-automation",
    contactName: fullLegalName,
    contactEmail: email,
    consentAcknowledged: true,
    humanReviewRequired: false,
    requestPayload: {
      credentialType,
      credentialIdentifier,
      jurisdictionOrIssuer: issuer,
      organization,
      role,
    },
    metadata: {
      professionalRole: role,
      invitationBasis: invited.basis,
      organizationOfRecord: invited.organization,
      syntheticFixtureActive: Boolean(syntheticContext),
    },
    syntheticFixtureContext: syntheticContext,
  });
  const sandboxProfessional = Boolean(syntheticContext);
  const automated = sandboxProfessional
    ? {
        status: "VERIFIED" as const,
        provider: "furlong-staging-test-persona",
        officialSourceRef: `furlong://staging/test-persona/pocohantus-smith/${role}`,
        officialSourcePayload: JSON.stringify({
          testOnly: true,
          persona: "Pocohantus Smith",
          role,
        }),
        standing: "active",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        matchedName: "Pocohantus Smith",
        matchedCredentialIdentifier: credentialIdentifier,
        evidenceSha256: null,
        reason:
          "STAGING TEST PERSONA ONLY — not a real professional credential.",
      }
    : await automateProfessionalCredentialVerification({
        fullLegalName,
        email,
        role: requestedRole,
        credentialType,
        credentialIdentifier,
        jurisdictionOrIssuer: issuer,
        organization,
      });
  const finalStatus =
    automated.status === "VERIFIED"
      ? "VERIFIED"
      : automated.status === "REJECTED"
        ? "AUTOMATED_REJECTED"
        : "AUTOMATION_EXCEPTION";
  let credentialVerificationId: string | null = null;
  if (
    automated.status === "VERIFIED" &&
    automated.officialSourceRef &&
    automated.officialSourcePayload &&
    automated.standing &&
    automated.expiresAt
  ) {
    const receipt = verifyInstitutionalCredential({
      principalId: email,
      principalEmail: email,
      fullLegalName,
      role: role as "lender" | "attorney" | "auditor" | "sponsor",
      credentialType,
      credentialIdentifier,
      jurisdictionOrIssuer: issuer,
      officialSourceRef: automated.officialSourceRef,
      officialSourcePayload: automated.officialSourcePayload,
      method: sandboxProfessional
        ? "STAGING_TEST_FIXTURE"
        : "OFFICIAL_DIRECTORY_AUTOMATED",
      standing: automated.standing,
      agencyOrFirm: organization || invited.organization,
      independenceAttested: role === "auditor" ? true : null,
      verifiedBy: `automation:${automated.provider}`,
      expiresAt: automated.expiresAt,
      reason: automated.reason,
    });
    credentialVerificationId = receipt.verificationId;
  }
  await db
    .update(serviceRequests)
    .set({
      status: finalStatus,
      humanReviewRequired: finalStatus === "AUTOMATION_EXCEPTION",
      reviewedAt:
        finalStatus === "VERIFIED" || finalStatus === "AUTOMATED_REJECTED"
          ? new Date()
          : null,
      updatedAt: new Date(),
      metadata: {
        ...((request.metadata ?? {}) as Record<string, unknown>),
        automationStatus: automated.status,
        automationProvider: automated.provider,
        testOnly: sandboxProfessional,
        testPersona: sandboxProfessional ? "Pocohantus Smith" : null,
        officialSourceRef: automated.officialSourceRef,
        automationEvidenceSha256: automated.evidenceSha256,
        credentialStanding: automated.standing,
        credentialExpiresAt: automated.expiresAt,
        credentialVerificationId,
        automationReason: automated.reason,
      },
    })
    .where(eq(serviceRequests.serviceRequestId, requestId));

  const observability = createObservabilityEvent({
    eventType: "PROFESSIONAL_CREDENTIAL_VERIFICATION_REQUESTED",
    domain: "security",
    severity: "INFO",
    message:
      finalStatus === "VERIFIED"
        ? "A registered professional credential was automatically verified against an authoritative source."
        : finalStatus === "AUTOMATED_REJECTED"
          ? "Automated authoritative-source verification rejected a professional credential."
          : "Automated professional credential verification requires exception handling.",
    traceId,
    replayRef: traceId,
    actorId: email,
    module: "api.public.professional-verification-request",
    metadata: {
      requestId,
      role,
      organization: invited.organization,
      finalStatus,
      provider: automated.provider,
      credentialVerificationId,
    },
  });
  await persistGovernanceEvidence({
    traceId,
    replayRef: traceId,
    observability,
    metadata: {
      route: "/api/public/professional-verification-request",
      requestId,
      role,
    },
  });
  return NextResponse.json({
    ok: true,
    requestId,
    status: finalStatus,
    automated: true,
    message:
      finalStatus === "VERIFIED"
        ? "Credential verified automatically. Professional portal login is now eligible."
        : finalStatus === "AUTOMATED_REJECTED"
          ? "The authoritative source did not validate this credential. Professional login remains blocked."
          : "Automated verification could not reach a conclusive result. The request is in the exception queue; login remains blocked.",
  });
}
