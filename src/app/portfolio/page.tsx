"use client";

import { useEffect, useMemo, useState } from "react";

type RankedApplication = {
  id: string;
  score?: number;
  risk?: number;
  acreage?: number;
  liquidity?: number;
  computedRankScore?: number;
  rank?: number;
  metadata?: {
    farmName?: string;
    state?: string;
    county?: string;
    type?: string;
    [key: string]: unknown;
  };
};

type RankResponse = {
  ok: boolean;
  error?: string;
  ranked?: {
    ranked?: RankedApplication[];
    classification?: {
      classificationLevel?: string;
      sensitivityScope?: string;
      disclosureAudience?: string[];
      exportRestrictions?: string[];
      consentRequirements?: string[];
    };
  };
  governance?: {
    traceId?: string;
    runtimeGuard?: {
      allowed?: boolean;
    };
    versionRuntime?: {
      ok?: boolean;
      replaySafe?: boolean;
    };
    inputClassification?: {
      classificationLevel?: string;
    };
    outputClassification?: {
      classificationLevel?: string;
      sensitivityScope?: string;
    };
    explainability?: {
      humanReviewRequired?: boolean;
      confidenceScore?: number;
      metadata?: {
        rankedCount?: number;
        notFinalCreditDecision?: boolean;
      };
    };
    observability?: {
      eventType?: string;
      severity?: string;
      anomalyCandidate?: boolean;
    };
  };
};

const demoRankRequest = {
  borrowerId: "demo-borrower-001",
  userId: "demo-user-001",
  applications: [
    {
      id: "FARM_001",
      score: 0.75,
      risk: 0.3,
      acreage: 0.6,
      liquidity: 0.6,
      metadata: {
        farmName: "Demo Farm North",
        state: "MD",
        county: "Carroll",
        type: "row-crop",
      },
    },
    {
      id: "FARM_002",
      score: 0.55,
      risk: 0.6,
      acreage: 0.4,
      liquidity: 0.4,
      metadata: {
        farmName: "Demo Farm South",
        state: "MD",
        county: "Frederick",
        type: "mixed-use",
      },
    },
  ],
};

function formatNumber(value: number | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Pending";
  }

  return value.toFixed(2);
}

function formatPercent(value: number | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Pending";
  }

  return `${(value * 100).toFixed(1)}%`;
}

function formatBoolean(value: boolean | undefined): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "Pending";
}

export default function PortfolioPage() {
  const [response, setResponse] = useState<RankResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRanking() {
      try {
        const res = await fetch("/api/rank", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(demoRankRequest),
        });

        const json = (await res.json()) as RankResponse;
        setResponse(json);

        if (!res.ok || !json.ok) {
          setError(json.error ?? "Ranking runtime returned an error.");
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unknown portfolio runtime error."
        );
      } finally {
        setLoading(false);
      }
    }

    loadRanking();
  }, []);

  const rankedApplications = useMemo(() => {
    const ranked = response?.ranked?.ranked;
    return Array.isArray(ranked) ? ranked : [];
  }, [response?.ranked?.ranked]);

  const governance = response?.governance;
  const classification =
    response?.ranked?.classification ?? governance?.outputClassification;

  if (loading) {
    return (
      <main style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
        <h1>Farm Portfolio Dashboard</h1>
        <p>Loading governed ranking runtime...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
        <h1>Farm Portfolio Dashboard</h1>
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
        maxWidth: 1040,
      }}
    >
      <header>
        <h1>Farm Portfolio Dashboard</h1>
        <p>Tenant ID: {demoRankRequest.userId}</p>
      </header>

      <section>
        <h2>Portfolio Runtime</h2>
        <dl
          style={{
            display: "grid",
            gridTemplateColumns: "240px 1fr",
            gap: 8,
            margin: 0,
          }}
        >
          <dt>Ranked Applications</dt>
          <dd>{rankedApplications.length}</dd>

          <dt>Runtime Guard</dt>
          <dd>{governance?.runtimeGuard?.allowed ? "Allowed" : "Pending"}</dd>

          <dt>Version Runtime</dt>
          <dd>{governance?.versionRuntime?.ok ? "Valid" : "Pending"}</dd>

          <dt>Replay Safe</dt>
          <dd>{formatBoolean(governance?.versionRuntime?.replaySafe)}</dd>

          <dt>Human Review Required</dt>
          <dd>
            {formatBoolean(governance?.explainability?.humanReviewRequired)}
          </dd>

          <dt>Final Credit Decision</dt>
          <dd>
            {governance?.explainability?.metadata?.notFinalCreditDecision
              ? "No"
              : "Pending"}
          </dd>

          <dt>Classification</dt>
          <dd>
            {classification?.classificationLevel ?? "Pending"} /{" "}
            {classification?.sensitivityScope ?? "Pending"}
          </dd>

          <dt>Observability</dt>
          <dd>
            {governance?.observability?.eventType ?? "Pending"} /{" "}
            {governance?.observability?.severity ?? "Pending"}
          </dd>
        </dl>
      </section>

      <section>
        <h2>Ranked Applications</h2>
        <div style={{ display: "grid", gap: 12 }}>
          {rankedApplications.length > 0 ? (
            rankedApplications.map((application) => (
              <article
                key={application.id}
                style={{
                  border: "1px solid #d0d7de",
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <h3>
                  Rank #{application.rank ?? "Pending"} -{" "}
                  {application.metadata?.farmName ?? application.id}
                </h3>

                <dl
                  style={{
                    display: "grid",
                    gridTemplateColumns: "180px 1fr",
                    gap: 8,
                    margin: 0,
                  }}
                >
                  <dt>Application ID</dt>
                  <dd>{application.id}</dd>

                  <dt>Computed Rank Score</dt>
                  <dd>{formatNumber(application.computedRankScore)}</dd>

                  <dt>Base Score</dt>
                  <dd>{formatPercent(application.score)}</dd>

                  <dt>Liquidity</dt>
                  <dd>{formatPercent(application.liquidity)}</dd>

                  <dt>Acreage Readiness</dt>
                  <dd>{formatPercent(application.acreage)}</dd>

                  <dt>Risk Penalty</dt>
                  <dd>{formatPercent(application.risk)}</dd>

                  <dt>Location</dt>
                  <dd>
                    {application.metadata?.county ?? "Unknown"},{" "}
                    {application.metadata?.state ?? "Unknown"}
                  </dd>
                </dl>
              </article>
            ))
          ) : (
            <p>No ranked applications returned by the governed runtime.</p>
          )}
        </div>
      </section>

      <section>
        <h2>Governance Notice</h2>
        <p>
          Portfolio ranking is a governed operational recommendation surface.
          It is not a final credit decision and requires authorized human
          review before regulated reliance.
        </p>
      </section>
    </main>
  );
}
