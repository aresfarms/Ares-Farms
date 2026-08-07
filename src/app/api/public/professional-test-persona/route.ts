import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { and, desc, eq } from "drizzle-orm";

import { serviceRequests } from "@/db/schema";
import { db } from "@/lib/db";
import { resolveNextAuthSecret } from "@/lib/auth/nextAuthSecurity";
import { persistServiceRequest } from "@/lib/serviceRequests/serviceRequestStore";
import { verifyInstitutionalCredential } from "@/lib/governance/institutionalCredentialVerification";

const COOKIE = "furlong-professional-test-role";
const TEST_EMAIL = "chudson@aresfarmsinc.com";
const TEST_NAME = "Pocohantus Smith";
const ROLES = new Set(["lender", "attorney", "auditor", "sponsor"]);
type TestRole = "lender" | "attorney" | "auditor" | "sponsor";
async function currentEmail(req: NextRequest): Promise<string | null> {
  const secret = resolveNextAuthSecret();
  if (!secret) return null;
  const token = await getToken({ req, secret });
  return typeof token?.email === "string" ? token.email.trim().toLowerCase() : null;
}

function redirectWithCookie(req: NextRequest, role: TestRole) {
  const destination = role === "lender" ? "/lender-desk" : `/professional-access?testRole=${role}`;
  const response = NextResponse.redirect(new URL(destination, req.url));
  response.cookies.set(COOKIE, role, { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 3600 });
  return response;
}

async function verifiedFixture(role: TestRole) {
  const rows = await db.select().from(serviceRequests).where(and(
    eq(serviceRequests.requestType, "professional_credential_verification_request"),
    eq(serviceRequests.contactEmail, TEST_EMAIL), eq(serviceRequests.status, "VERIFIED"),
  )).orderBy(desc(serviceRequests.reviewedAt), desc(serviceRequests.updatedAt)).limit(20);
  return rows.find((row) => {
    const m = (row.metadata ?? {}) as Record<string, unknown>;
    return m.professionalRole === role && m.testOnly === true && m.testPersona === TEST_NAME &&
      typeof m.credentialExpiresAt === "string" && Date.parse(m.credentialExpiresAt) >= Date.now();
  }) ?? null;
}
async function createFixture(role: TestRole) {
  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const traceId = `professional-test-${role}-${Date.now()}`;
  const requestId = `profcred-test-${role}-${Date.now()}`;
  const credentialId = `TEST-${role.toUpperCase()}-POCOHANTUS`;
  const receipt = verifyInstitutionalCredential({
    principalId: TEST_EMAIL, principalEmail: TEST_EMAIL, fullLegalName: TEST_NAME,
    role, credentialType: `staging-${role}-test-credential`, credentialIdentifier: credentialId,
    jurisdictionOrIssuer: "Furlong staging test authority",
    officialSourceRef: `furlong://staging/test-persona/${role}`,
    officialSourcePayload: JSON.stringify({ testOnly: true, persona: TEST_NAME, role, credentialId }),
    method: "STAGING_TEST_FIXTURE", standing: "active",
    agencyOrFirm: `Furlong Staging Test ${role}`,
    independenceAttested: role === "auditor" ? true : null,
    verifiedBy: "furlong-staging-test-harness", expiresAt: expires,
    reason: "STAGING TEST PERSONA ONLY — no real-world professional authority.",
  });
  return persistServiceRequest({
    traceId, serviceRequestId: requestId, requestType: "professional_credential_verification_request",
    serviceCode: role, status: "VERIFIED", routedTo: "professional-test-harness",
    contactName: TEST_NAME, contactEmail: TEST_EMAIL, consentAcknowledged: true,
    humanReviewRequired: false, requestPayload: { testOnly: true, role, credentialId },
    metadata: { professionalRole: role, testOnly: true, testPersona: TEST_NAME,
      credentialExpiresAt: expires, credentialVerificationId: receipt.verificationId,
      verificationMethod: "STAGING_TEST_FIXTURE" },
  });
}
export async function GET(req: NextRequest) {
  const base = new URL("/professional-access", req.url);
  if (process.env.PROFESSIONAL_TEST_PERSONAS_ENABLED !== "true") return new NextResponse("Not Found", { status: 404 });
  const email = await currentEmail(req);
  if (email !== TEST_EMAIL) return new NextResponse("Not Found", { status: 404 });

  if (req.nextUrl.searchParams.get("clear") === "1") {
    const response = NextResponse.redirect(base);
    response.cookies.set(COOKIE, "", { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 0 });
    return response;
  }

  const roleValue = req.nextUrl.searchParams.get("role")?.trim().toLowerCase() ?? "";
  if (!ROLES.has(roleValue)) return NextResponse.redirect(new URL("/professional-access?testError=invalid-role", req.url));
  const role = roleValue as TestRole;
  if (!(await verifiedFixture(role))) await createFixture(role);
  return redirectWithCookie(req, role);
}
