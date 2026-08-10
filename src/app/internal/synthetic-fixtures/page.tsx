import { cookies } from "next/headers";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { resolveNextAuthSecret } from "@/lib/auth/nextAuthSecurity";
import {
  SYNTHETIC_FIXTURE_COOKIE,
  verifySyntheticFixtureSessionToken,
} from "@/lib/testing/syntheticFixtureLineage";
import {
  SYNTHETIC_PERSONAS,
  type SyntheticScenarioId,
} from "@/lib/testing/syntheticPersonaRegistry";

const OWNER_EMAIL = "chudson@aresfarmsinc.com";

function destination(scenarioId: SyntheticScenarioId): string {
  if (scenarioId.startsWith("professional-")) return "/professional-access";
  if (scenarioId.startsWith("plaid-")) return "/financial-connect";
  if (scenarioId.startsWith("stripe-"))
    return "/internal/synthetic-fixtures/stripe";
  if (
    scenarioId === "negative-payment-risk" ||
    scenarioId === "identity-recovery"
  )
    return "/internal/synthetic-fixtures/stripe";
  return "/explore?lane=financing-capital#lender-intake";
}

export default async function SyntheticFixturesPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase() ?? "";
  if (email !== OWNER_EMAIL) notFound();
  const secret = resolveNextAuthSecret();
  const cookieStore = await cookies();
  const active = secret
    ? verifySyntheticFixtureSessionToken(
        cookieStore.get(SYNTHETIC_FIXTURE_COOKIE)?.value,
        secret,
        email,
      )
    : null;

  return (
    <main
      style={{
        maxWidth: 1120,
        margin: "0 auto",
        padding: "40px 24px 80px",
        display: "grid",
        gap: 22,
      }}
    >
      <div style={{ display: "grid", gap: 8 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: "0.12em",
            color: "#6d28d9",
          }}
        >
          INTERNAL SYNTHETIC TEST CONTROL
        </span>
        <h1 style={{ margin: 0, color: "#13233f" }}>
          Synthetic fixture registry
        </h1>
        <p
          style={{
            margin: 0,
            maxWidth: 820,
            lineHeight: 1.65,
            color: "#475569",
          }}
        >
          The unusual names are the visible clue. The signed session and
          immutable lineage record are the actual boundary. Synthetic fixtures
          are forbidden in production.
        </p>
      </div>

      <section
        style={{
          border: "1px solid #c4b5fd",
          background: "#f5f3ff",
          borderRadius: 14,
          padding: 16,
          display: "grid",
          gap: 7,
        }}
      >
        <strong style={{ color: "#4c1d95" }}>Active fixture</strong>
        {active ? (
          <>
            <span>
              {active.humanVisibleName} — {active.scenarioId}
            </span>
            <code>
              {active.syntheticPersonaId} · {active.testRunId}
            </code>
            <span style={{ fontSize: 13 }}>
              Version {active.fixtureVersion} · {active.environment} ·{" "}
              {active.operatorIdentity} · {active.createdAt}
            </span>
            <Link href="/api/internal/synthetic-fixtures?clear=1&returnTo=/internal/synthetic-fixtures">
              Clear active fixture
            </Link>
          </>
        ) : (
          <span>No synthetic fixture is active.</span>
        )}
      </section>

      <div style={{ display: "grid", gap: 16 }}>
        {SYNTHETIC_PERSONAS.filter(
          (persona) => persona.activationMode === "ACTIVE",
        ).map((persona) => (
          <section
            key={persona.syntheticPersonaId}
            style={{
              border: "1px solid #d7deea",
              borderRadius: 14,
              padding: 17,
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ display: "grid", gap: 3 }}>
              <strong style={{ fontSize: 18, color: "#13233f" }}>
                {persona.humanVisibleName}
              </strong>
              <code>
                {persona.syntheticPersonaId} · {persona.fixtureVersion}
              </code>
              <span style={{ color: "#475569" }}>{persona.purpose}</span>
            </div>
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
              {persona.scenarioIds.map((scenarioId) => {
                const returnTo = destination(scenarioId);
                const href = `/api/internal/synthetic-fixtures?persona=${encodeURIComponent(persona.syntheticPersonaId)}&scenario=${encodeURIComponent(scenarioId)}&returnTo=${encodeURIComponent(returnTo)}`;
                return (
                  <Link
                    key={scenarioId}
                    href={href}
                    style={{
                      border: "1px solid #7c3aed",
                      borderRadius: 999,
                      padding: "7px 11px",
                      textDecoration: "none",
                      fontWeight: 800,
                      fontSize: 12.5,
                    }}
                  >
                    Activate {scenarioId}
                  </Link>
                );
              })}
            </div>
            <span style={{ fontSize: 12.5, color: "#64748b" }}>
              Provider targets:{" "}
              {persona.providerTargets.length
                ? persona.providerTargets.join(" · ")
                : "none"}
            </span>
          </section>
        ))}
      </div>
    </main>
  );
}
