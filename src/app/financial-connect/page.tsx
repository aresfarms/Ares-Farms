import { desc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { identityVerifications } from "@/db/schema";
import { db } from "@/lib/db";
import { verifyUploadLinkToken } from "@/lib/documents/uploadLinkToken";
import { ensureAccessSecurityState } from "@/lib/auth/accessSecurityRuntime";
import {
  MFA_ASSURANCE_COOKIE,
  MFA_STEP_UP_MAX_AGE_SECONDS,
  verifyMfaAssurance,
} from "@/lib/auth/mfaAssurance";
import { resolveNextAuthSecret } from "@/lib/auth/nextAuthSecurity";
import {
  SYNTHETIC_FIXTURE_COOKIE,
  verifySyntheticFixtureSessionToken,
} from "@/lib/testing/syntheticFixtureLineage";

import FinancialConnectClient from "./FinancialConnectClient";

/**
 * Bank connection has TWO doors — see lib/plaid/connectionPrincipal.ts, which
 * both Plaid API routes resolve through. This page must gate the same way, or
 * it either shows a form that 401s or opens a page it should not.
 *
 *   STAFF / PROFESSIONAL — session + fresh passkey MFA. Stuart's synthetic
 *     Plaid fixtures run through this door and it is unchanged.
 *   CUSTOMER — the deal's signed link token + a VERIFIED IDENTITY. Customers
 *     have no accounts, so session-gating meant bank connection was reachable
 *     by the broker and not by the borrower (G-2).
 */
export default async function FinancialConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ dealRef?: string; token?: string }>;
}) {
  const early = await searchParams;
  const linkToken = early.token?.trim().slice(0, 2048) || null;
  if (linkToken) {
    const claims = verifyUploadLinkToken(linkToken);
    if (!claims) redirect("/status?bank=link-expired");
    const [identity] = await db
      .select({ verified: identityVerifications.verified })
      .from(identityVerifications)
      .where(eq(identityVerifications.subjectRef, claims.applicationId))
      .orderBy(desc(identityVerifications.createdAt))
      .limit(1);
    // Refused, not downgraded — the same rule the API enforces.
    if (identity?.verified !== true) redirect("/status?bank=identity-required");
    return (
      <FinancialConnectClient
        dealRef={claims.dealRef ?? null}
        linkToken={linkToken}
        syntheticFixture={null}
      />
    );
  }

  const session = await getServerSession(authOptions);
  const user = session?.user as
    { id?: string; email?: string; sessionVersion?: number } | undefined;
  if (!user?.id) redirect("/sign-in?callbackUrl=%2Ffinancial-connect");

  const state = await ensureAccessSecurityState(user.id);
  if (
    typeof user.sessionVersion === "number" &&
    user.sessionVersion !== state.sessionVersion
  ) {
    redirect("/sign-in?callbackUrl=%2Ffinancial-connect");
  }
  const secret = resolveNextAuthSecret();
  const cookieStore = await cookies();
  const assurance = secret
    ? await verifyMfaAssurance({
        token: cookieStore.get(MFA_ASSURANCE_COOKIE)?.value,
        userId: user.id,
        sessionVersion: state.sessionVersion,
        secret,
        maxVerifiedAgeSeconds: MFA_STEP_UP_MAX_AGE_SECONDS,
      })
    : null;
  if (!assurance) redirect("/security/mfa?callbackUrl=%2Ffinancial-connect");

  const syntheticFixture = secret
    ? verifySyntheticFixtureSessionToken(
        cookieStore.get(SYNTHETIC_FIXTURE_COOKIE)?.value,
        secret,
        user.email ?? null,
      )
    : null;
  const dealRef = early.dealRef?.trim().slice(0, 120) || null;
  return (
    <FinancialConnectClient
      dealRef={dealRef}
      syntheticFixture={
        syntheticFixture && syntheticFixture.scenarioId.startsWith("plaid-")
          ? syntheticFixture
          : null
      }
    />
  );
}
