import { cookies } from "next/headers";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { resolveNextAuthSecret } from "@/lib/auth/nextAuthSecurity";
import {
  SYNTHETIC_FIXTURE_COOKIE,
  verifySyntheticFixtureSessionToken,
} from "@/lib/testing/syntheticFixtureLineage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StripeSyntheticSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
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
  if (!fixture) redirect("/internal/synthetic-fixtures");
  const params = await searchParams;
  const sessionId = params.session_id?.trim().slice(0, 180) || "not-returned";
  return (
    <main
      style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px 80px" }}
    >
      <h1>Stripe returned the synthetic test run</h1>
      <p>
        This page confirms only the browser return. The run closes after the
        signed Stripe webhook, billing-event lineage, wallet type, fraud result,
        and test-mode transaction are reconciled.
      </p>
      <div
        style={{ border: "2px solid #7c3aed", borderRadius: 12, padding: 16 }}
      >
        <strong>{fixture.humanVisibleName}</strong>
        <p>{fixture.testRunId}</p>
        <code style={{ overflowWrap: "anywhere" }}>{sessionId}</code>
      </div>
      <p>
        <Link href="/internal/synthetic-fixtures">
          Return to fixture control
        </Link>
      </p>
    </main>
  );
}
