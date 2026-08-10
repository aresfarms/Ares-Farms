import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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

export default async function FinancialConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ dealRef?: string }>;
}) {
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
  const params = await searchParams;
  const dealRef = params.dealRef?.trim().slice(0, 120) || null;
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
