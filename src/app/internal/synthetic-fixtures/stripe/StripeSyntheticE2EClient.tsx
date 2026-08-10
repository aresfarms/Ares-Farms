"use client";

import { useState } from "react";

export type StripeSyntheticFixtureSummary = {
  syntheticPersonaId: string;
  humanVisibleName: string;
  testRunId: string;
  fixtureVersion: string;
  environment: string;
  operatorIdentity: string;
  createdAt: string;
  scenarioId: string;
};

export default function StripeSyntheticE2EClient({
  fixture,
}: {
  fixture: StripeSyntheticFixtureSummary;
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(
    "Ready to create a Stripe test-mode Checkout Session.",
  );

  async function launch() {
    setBusy(true);
    setStatus("Creating a governed Stripe test Checkout Session...");
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: "paid",
          customerSubjectRef: fixture.syntheticPersonaId,
          dealRef: fixture.testRunId,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        url?: string | null;
        error?: string;
      };
      if (!response.ok || data.ok !== true || !data.url) {
        throw new Error(
          data.error || "Stripe test checkout could not be created.",
        );
      }
      setStatus("Checkout created. Redirecting to Stripe test mode...");
      window.location.assign(data.url);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Stripe test failed.");
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 780,
        margin: "0 auto",
        padding: "40px 24px 80px",
        display: "grid",
        gap: 20,
      }}
    >
      <header style={{ display: "grid", gap: 8 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: "0.12em",
            color: "#6d28d9",
          }}
        >
          STRIPE SYNTHETIC E2E
        </span>
        <h1 style={{ margin: 0 }}>Test {fixture.scenarioId}</h1>
        <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
          This run is test-only. The visible persona is{" "}
          {fixture.humanVisibleName}; immutable lineage is bound to every
          Furlong billing record and copied into Stripe test metadata for
          webhook reconstruction.
        </p>
      </header>

      <section
        style={{
          border: "2px solid #7c3aed",
          background: "#f5f3ff",
          borderRadius: 14,
          padding: 16,
          display: "grid",
          gap: 5,
        }}
      >
        <strong>{fixture.humanVisibleName}</strong>
        <code>{fixture.syntheticPersonaId}</code>
        <code>{fixture.testRunId}</code>
        <span>
          {fixture.fixtureVersion} · {fixture.environment} ·{" "}
          {fixture.operatorIdentity}
        </span>
        <span>Created {fixture.createdAt}</span>
      </section>

      <section
        style={{
          border: "1px solid #d7deea",
          borderRadius: 14,
          padding: 16,
          display: "grid",
          gap: 12,
        }}
      >
        <strong>Scenario boundary</strong>
        <span style={{ color: "#475569", lineHeight: 1.6 }}>
          Card, Apple Pay, and Google Pay all remain Stripe test-mode payment
          paths. The selected wallet must match this active scenario and will be
          verified from the signed webhook evidence before the run is closed.
        </span>
        <button
          type="button"
          onClick={launch}
          disabled={busy}
          style={{
            justifySelf: "start",
            border: 0,
            borderRadius: 10,
            padding: "11px 16px",
            background: "#4c1d95",
            color: "white",
            fontWeight: 800,
            cursor: busy ? "wait" : "pointer",
          }}
        >
          {busy ? "Creating test checkout..." : "Launch Stripe test checkout"}
        </button>
        <p aria-live="polite" style={{ margin: 0, color: "#475569" }}>
          {status}
        </p>
      </section>
    </main>
  );
}
