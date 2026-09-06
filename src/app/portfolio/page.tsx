"use client";

import { useEffect, useMemo, useState } from "react";

type RankedApplication = {
  id: string;
  propertyReadinessScore?: number;
  programFitScore?: number;
  evidenceCompletenessScore?: number;
  executionReadinessScore?: number;
  environmentalReadinessScore?: number;
  propertyRiskScore?: number;
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
  ranked?: RankedApplication[];
  output?: {
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
      propertyReadinessScore: 78,
      programFitScore: 84,
      evidenceCompletenessScore: 72,
      executionReadinessScore: 68,
      environmentalReadinessScore: 80,
      propertyRiskScore: 25,
      metadata: {
        farmName: "Demo Farm North",
        state: "MD",
        county: "Carroll",
        type: "row-crop",
      },
    },
    {
      id: "FARM_002",
      propertyReadinessScore: 64,
      programFitScore: 70,
      evidenceCompletenessScore: 58,
      executionReadinessScore: 62,
      environmentalReadinessScore: 66,
      propertyRiskScore: 40,
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

function formatScore(value: number | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Pending";
  return `${value.toFixed(1)}/100`;
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
    const ranked = response?.ranked;
    return Array.isArray(ranked) ? ranked : [];
  }, [response?.ranked]);

  const governance = response?.governance;
  const classification =
    response?.output?.classification ?? governance?.outputClassification;

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
        <h2>Ranked Property / Project Cases</h2>
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
                  <dt>Property / Case ID</dt>
                  <dd>{application.id}</dd>

                  <dt>Computed Rank Score</dt>
                  <dd>{formatNumber(application.computedRankScore)}</dd>

                  <dt>Property Readiness</dt>
                  <dd>{formatScore(application.propertyReadinessScore)}</dd>

                  <dt>Program / Property Fit</dt>
                  <dd>{formatScore(application.programFitScore)}</dd>

                  <dt>Evidence Completeness</dt>
                  <dd>{formatScore(application.evidenceCompletenessScore)}</dd>

                  <dt>Execution Readiness</dt>
                  <dd>{formatScore(application.executionReadinessScore)}</dd>

                  <dt>Environmental Readiness</dt>
                  <dd>{formatScore(application.environmentalReadinessScore)}</dd>

                  <dt>Property Risk Penalty</dt>
                  <dd>{formatScore(application.propertyRiskScore)}</dd>

                  <dt>Location</dt>
                  <dd>
                    {application.metadata?.county ?? "Unknown"},{" "}
                    {application.metadata?.state ?? "Unknown"}
                  </dd>
                </dl>
              </article>
            ))
          ) : (
            <p>No ranked property/project cases returned by the governed runtime.</p>
          )}
        </div>
      </section>

      <section>
        <h2>Governance Notice</h2>
        <p>
          Portfolio ranking is a governed property/project recommendation surface. Personal financial-profile data does not affect this nonresidential ranking.
          It is not a final credit decision and requires authorized human
          review before regulated reliance.
        </p>
      </section>
    </main>
  );
}
