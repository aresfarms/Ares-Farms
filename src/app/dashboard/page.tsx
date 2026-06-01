"use client";

import { useEffect, useMemo, useState } from "react";

type DecisionResponse = {
  success: boolean;
  error?: string;
  data?: {
    decision?: {
      status?: string;
      requiresReview?: boolean;
      rationale?: string[];
      decision?: string;
      compositeScore?: number;
      breakdown?: Record<string, number>;
      metadata?: {
        traceId?: string;
        pipelineVersion?: string;
        mode?: string;
        replayable?: boolean;
        explainable?: boolean;
        observable?: boolean;
        classificationRequired?: boolean;
      };
    };
    compliance?: {
      status?: string;
      classificationRequired?: boolean;
      regulatoryReviewRequired?: boolean;
    };
    explanation?: string[];
  };
  governance?: {
    traceId?: string;
    runtimeGuard?: {
      allowed?: boolean;
      findings?: Array<{
        domain?: string;
        severity?: string;
        code?: string;
        message?: string;
      }>;
    };
    versionRuntime?: {
      ok?: boolean;
      replaySafe?: boolean;
      missingDomains?: string[];
    };
    classification?: {
      classificationLevel?: string;
      sensitivityScope?: string;
    };
    explainability?: {
      humanReviewRequired?: boolean;
      confidenceScore?: number;
    };
    observability?: {
      eventType?: string;
      severity?: string;
      anomalyCandidate?: boolean;
    };
  };
};

const demoDecisionRequest = {
  userId: "demo-user-001",
  name: "Demo Farm",
  location: {
    state: "MD",
    county: "Carroll",
    region: null,
    country: "US",
  },
  financials: {
    revenue: 250000,
    expenses: 120000,
  },
  metadata: {
    type: "row-crop",
    acres: 60,
  },
};

function formatStatus(value: string | undefined): string {
  if (!value) return "Pending";

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatBoolean(value: boolean | undefined): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "Pending";
}

export default function DashboardPage() {
  const [response, setResponse] = useState<DecisionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDecision() {
      try {
        const res = await fetch("/api/decision", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(demoDecisionRequest),
        });

        const json = (await res.json()) as DecisionResponse;
        setResponse(json);

        if (!res.ok || !json.success) {
          setError(json.error ?? "Decision runtime returned an error.");
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unknown dashboard runtime error."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDecision();
  }, []);

  const decision = response?.data?.decision;
  const compliance = response?.data?.compliance;
  const governance = response?.governance;
  const metadata = decision?.metadata;

  const rationale = useMemo(() => {
    return decision?.rationale ?? response?.data?.explanation ?? [];
  }, [decision?.rationale, response?.data?.explanation]);

  if (loading) {
    return (
      <main style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
        <h1>Farm Loan Decision Dashboard</h1>
        <p>Loading governed decision runtime...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
        <h1>Farm Loan Decision Dashboard</h1>
        <h2>Runtime Status: Error</h2>
        <p>{error}</p>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: 24,
        fontFamily: "Arial, sans-serif",
        display: "grid",
        gap: 20,
        maxWidth: 960,
      }}
    >
      <header>
        <h1>Farm Loan Decision Dashboard</h1>
        <p>Tenant ID: {demoDecisionRequest.userId}</p>
      </header>

      <section>
        <h2>Decision Runtime</h2>
        <dl
          style={{
            display: "grid",
            gridTemplateColumns: "220px 1fr",
            gap: 8,
            margin: 0,
          }}
        >
          <dt>Status</dt>
          <dd>{formatStatus(decision?.status)}</dd>

          <dt>Decision</dt>
          <dd>{formatStatus(decision?.decision)}</dd>

          <dt>Human Review Required</dt>
          <dd>{formatBoolean(decision?.requiresReview)}</dd>

          <dt>Pipeline Mode</dt>
          <dd>{metadata?.mode ?? "Pending"}</dd>

          <dt>Pipeline Version</dt>
          <dd>{metadata?.pipelineVersion ?? "Pending"}</dd>

          <dt>Composite Score</dt>
          <dd>
            {metadata?.mode === "migration-stabilization"
              ? "Pending canonical scoring activation"
              : decision?.compositeScore ?? "Pending"}
          </dd>
        </dl>
      </section>

      <section>
        <h2>Governance Checks</h2>
        <dl
          style={{
            display: "grid",
            gridTemplateColumns: "220px 1fr",
            gap: 8,
            margin: 0,
          }}
        >
          <dt>Runtime Guard</dt>
          <dd>{governance?.runtimeGuard?.allowed ? "Allowed" : "Pending"}</dd>

          <dt>Version Runtime</dt>
          <dd>{governance?.versionRuntime?.ok ? "Valid" : "Pending"}</dd>

          <dt>Replay Safe</dt>
          <dd>{formatBoolean(governance?.versionRuntime?.replaySafe)}</dd>

          <dt>Classification</dt>
          <dd>
            {governance?.classification?.classificationLevel ?? "Pending"} /{" "}
            {governance?.classification?.sensitivityScope ?? "Pending"}
          </dd>

          <dt>Observability</dt>
          <dd>
            {governance?.observability?.eventType ?? "Pending"} /{" "}
            {governance?.observability?.severity ?? "Pending"}
          </dd>
        </dl>
      </section>

      <section>
        <h2>Compliance State</h2>
        <dl
          style={{
            display: "grid",
            gridTemplateColumns: "220px 1fr",
            gap: 8,
            margin: 0,
          }}
        >
          <dt>Status</dt>
          <dd>{formatStatus(compliance?.status)}</dd>

          <dt>Classification Required</dt>
          <dd>{formatBoolean(compliance?.classificationRequired)}</dd>

          <dt>Regulatory Review Required</dt>
          <dd>{formatBoolean(compliance?.regulatoryReviewRequired)}</dd>
        </dl>
      </section>

      <section>
        <h2>Decision Rationale</h2>
        <ul>
          {rationale.length > 0 ? (
            rationale.map((item) => <li key={item}>{item}</li>)
          ) : (
            <li>Pending governed decision rationale.</li>
          )}
        </ul>
      </section>

      <section>
        <h2>Compliance Notice</h2>
        <p>
          AI-GENERATED INFORMATION ONLY — NOT AN OFFICIAL REPORT — NOT VALID
          FOR PERMITTING, FINANCING, LEGAL, OR REGULATORY USE.
        </p>
      </section>
    </main>
  );
}
