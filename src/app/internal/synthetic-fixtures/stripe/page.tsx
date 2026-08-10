import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { resolveNextAuthSecret } from "@/lib/auth/nextAuthSecurity";
import {
  SYNTHETIC_FIXTURE_COOKIE,
  verifySyntheticFixtureSessionToken,
} from "@/lib/testing/syntheticFixtureLineage";

import StripeSyntheticE2EClient from "./StripeSyntheticE2EClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SCENARIOS = new Set([
  "stripe-card",
  "stripe-apple-pay",
  "stripe-google-pay",
  "stripe-connect-allocation",
  "negative-payment-risk",
]);

export default async function StripeSyntheticE2EPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase() ?? "";
  if (email !== "chudson@aresfarmsinc.com") redirect("/sign-in");
  const secret = resolveNextAuthSecret();
  const store = await cookies();
  const fixture = secret
    ? verifySyntheticFixtureSessionToken(
        store.get(SYNTHETIC_FIXTURE_COOKIE)?.value,
        secret,
        email,
      )
    : null;
  if (!fixture || !SCENARIOS.has(fixture.scenarioId)) {
    redirect("/internal/synthetic-fixtures");
  }
  return <StripeSyntheticE2EClient fixture={fixture} />;
}
