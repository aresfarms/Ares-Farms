"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  RecommendationPrecisionGateFinding,
  RecommendationPrecisionHarnessResult,
  RecommendationPrecisionScenarioOutcome,
  composeRecommendationPrecisionHarness,
} from "@/lib/testing/recommendationPrecisionRuntime";

type ApiResponse = {
  ok: boolean;
  error?: string;
  result?: RecommendationPrecisionHarnessResult;
};

const shellStyle = {
  minHeight: "100vh",
  background: "#f6f8fb",
  color: "#162033",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as const;
const containerStyle = {
  maxWidth: 1180,
  margin: "0 auto",
  padding: 24,
  display: "grid",
  gap: 18,
} as const;
const panelStyle = {
  background: "#ffffff",
  border: "1px solid #d7deea",
  borderRadius: 8,
} as const;
const mutedText = { color: "#5d687a", lineHeight: 1.5 } as const;

function StatusBadge(props: {
  tone: "pass" | "fail" | "neutral" | "review";
  label: string;
}) {
  const palette = {
    pass: { bg: "#dbf0e2", fg: "#1f5a32", border: "#a8d8b3" },
    fail: { bg: "#fde4e4", fg: "#80222d", border: "#f4b1b7" },
    review: { bg: "#fff4d6", fg: "#7a4d00", border: "#f0d27a" },
    neutral: { bg: "#e3e8ef", fg: "#3b475a", border: "#bcc7d6" },
  } as const;
  const tone = palette[props.tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 9px",
        borderRadius: 999,
        background: tone.bg,
        color: tone.fg,
        border: `1px solid ${tone.border}`,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {props.label}
    </span>
  );
}

function ScoreTile(props: { label: string; value: string }) {
  return (
    <div style={{ ...panelStyle, padding: 12, background: "#f6f8fb" }}>
      <div style={{ fontSize: 12, ...mutedText }}>{props.label}</div>
      <div style={{ fontWeight: 700, fontSize: 18 }}>{props.value}</div>
    </div>
  );
}

function ScenarioCard(props: {
  outcome: RecommendationPrecisionScenarioOutcome;
}) {
  const { outcome } = props;
  return (
    <div style={{ ...panelStyle, padding: 14, marginBottom: 10 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 8,
          alignItems: "start",
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{outcome.label}</div>
          <div style={{ ...mutedText, fontSize: 12 }}>
            id {outcome.scenarioId} · customer type {outcome.customerType} ·
            {" "}geography {outcome.geography.state}
            {outcome.geography.county
              ? `/${outcome.geography.county}`
              : ""}{" "}
            ({outcome.geography.country})
          </div>
        </div>
        <StatusBadge
          tone={outcome.passed ? "pass" : "fail"}
          label={outcome.passed ? "PASS" : "FAIL"}
        />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
          marginTop: 8,
        }}
      >
        <ScoreTile
          label="Precision"
          value={outcome.scores.precisionScore.toFixed(2)}
        />
        <ScoreTile
          label="Exclusion"
          value={outcome.scores.exclusionScore.toFixed(2)}
        />
        <ScoreTile
          label="Explanation"
          value={outcome.scores.explanationScore.toFixed(2)}
        />
        <ScoreTile
          label="Trust"
          value={outcome.scores.trustScore.toFixed(2)}
        />
      </div>
      <div style={{ ...mutedText, fontSize: 12, marginTop: 8 }}>
        Matched profiles {outcome.matchedCustomerProfileCount} · grant cards{" "}
        {outcome.returnedGrantCardCount} · relevant categories returned{" "}
        {outcome.returnedRelevantCategoryCount} · excluded categories returned{" "}
        {outcome.returnedExcludedCategoryCount} · conflict propagation{" "}
        {outcome.scores.conflictPropagationPreserved
          ? "preserved"
          : "LOST"}
        {outcome.expectsZeroMatchedProfiles
          ? " · expects zero matched profiles"
          : ""}
      </div>
      {outcome.returnedCategorySamples.length > 0 && (
        <div style={{ ...mutedText, fontSize: 12, marginTop: 4 }}>
          Categories returned:{" "}
          {outcome.returnedCategorySamples.join(", ")}
        </div>
      )}
      {outcome.gateFindings.length > 0 && (
        <div
          style={{
            marginTop: 8,
            background: "#fde4e4",
            border: "1px solid #f4b1b7",
            borderRadius: 6,
            padding: 8,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 12, color: "#80222d" }}>
            Gate findings:
          </div>
          <ul style={{ marginLeft: 16, ...mutedText, fontSize: 12 }}>
            {outcome.gateFindings.map((finding) => (
              <li key={finding.gate}>
                <strong>{finding.gate}</strong>: {finding.description}{" "}
                {finding.evidence.length > 0 && (
                  <em>[{finding.evidence.join(", ")}]</em>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function GateFindingCard(props: {
  finding: RecommendationPrecisionGateFinding;
}) {
  return (
    <div
      style={{
        ...panelStyle,
        padding: 12,
        marginBottom: 8,
        borderLeft: "4px solid #c14757",
        background: "#fde4e4",
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 13 }}>
        {props.finding.scenarioId} · {props.finding.gate}
      </div>
      <div style={{ ...mutedText, fontSize: 12 }}>
        {props.finding.description}
      </div>
      {props.finding.evidence.length > 0 && (
        <div style={{ ...mutedText, fontSize: 12, marginTop: 4 }}>
          Evidence: {props.finding.evidence.join(", ")}
        </div>
      )}
    </div>
  );
}

export default function RecommendationPrecisionHarnessPage() {
  const [reviewerRole, setReviewerRole] = useState(
    "Qualified Governance Reviewer"
  );
  const [applicationId, setApplicationId] = useState(
    "application-precision-review"
  );
  const [serverResult, setServerResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const previewResult = useMemo(
    () =>
      composeRecommendationPrecisionHarness({
        reviewerRole,
        applicationId,
      }),
    [reviewerRole, applicationId]
  );

  const result = serverResult?.result ?? previewResult;

  async function runHarness() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "/api/governance/recommendation-precision-harness",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviewerRole, applicationId }),
        }
      );
      const data: ApiResponse = await response.json();
      setServerResult(data);
      if (!data.ok) {
        setError(data.error ?? "Unknown error from API");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown fetch error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={shellStyle}>
      <div style={containerStyle}>
        <header style={{ ...panelStyle, padding: 18 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "start",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 20 }}>
                Recommendation Precision Test Harness
              </div>
              <div style={{ ...mutedText, marginTop: 4 }}>
                Trust-preservation gate for Furlong recommendations.
                Internal test harness only — no customer-facing approval,
                eligibility, lender commitment, agency decision, public
                verification, or regulatory reliance is created. Validates
                that the canonical v2 stack returns relevant capital
                pathways for the borrower profile, suppresses excluded
                pathways (e.g. no agricultural pathway returns for a hotel
                owner in New Jersey), carries reviewer-visible explanations,
                and preserves cross-source conflicts.
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <StatusBadge tone="fail" label="Production blocked" />
              <StatusBadge tone="review" label="Human review required" />
              <StatusBadge
                tone={result.ciGatePassed ? "pass" : "fail"}
                label={result.ciGatePassed ? "CI gate passed" : "CI gate failed"}
              />
            </div>
          </div>
        </header>

        <section style={{ ...panelStyle, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
            Reviewer input
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                Reviewer role
              </span>
              <input
                style={{
                  width: "100%",
                  minHeight: 42,
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  padding: "8px 10px",
                  fontSize: 14,
                  background: "#ffffff",
                }}
                value={reviewerRole}
                onChange={(e) => setReviewerRole(e.target.value)}
              />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                Application id
              </span>
              <input
                style={{
                  width: "100%",
                  minHeight: 42,
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  padding: "8px 10px",
                  fontSize: 14,
                  background: "#ffffff",
                }}
                value={applicationId}
                onChange={(e) => setApplicationId(e.target.value)}
              />
            </label>
          </div>
          <div style={{ marginTop: 14 }}>
            <button
              onClick={runHarness}
              disabled={loading}
              style={{
                padding: "10px 16px",
                background: "#1f4dd8",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: loading ? "default" : "pointer",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {loading ? "Composing…" : "POST to governed API"}
            </button>
            {error && (
              <span
                style={{
                  marginLeft: 12,
                  color: "#80222d",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {error}
              </span>
            )}
          </div>
        </section>

        <section style={{ ...panelStyle, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
            Summary
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 10,
            }}
          >
            <ScoreTile
              label="Scenarios"
              value={String(result.summary.scenarioCount)}
            />
            <ScoreTile
              label="Passed"
              value={String(result.summary.passedScenarioCount)}
            />
            <ScoreTile
              label="Failed"
              value={String(result.summary.failedScenarioCount)}
            />
            <ScoreTile
              label="Trust threshold"
              value={result.trustThreshold.toFixed(2)}
            />
            <ScoreTile
              label="Mean precision"
              value={result.summary.meanPrecisionScore.toFixed(2)}
            />
            <ScoreTile
              label="Mean exclusion"
              value={result.summary.meanExclusionScore.toFixed(2)}
            />
            <ScoreTile
              label="Mean explanation"
              value={result.summary.meanExplanationScore.toFixed(2)}
            />
            <ScoreTile
              label="Mean trust"
              value={result.summary.meanTrustScore.toFixed(2)}
            />
          </div>
        </section>

        <section style={{ ...panelStyle, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
            Scenarios ({result.scenarioOutcomes.length})
          </div>
          {result.scenarioOutcomes.map((outcome) => (
            <ScenarioCard key={outcome.scenarioId} outcome={outcome} />
          ))}
        </section>

        {result.gateFindings.length > 0 && (
          <section style={{ ...panelStyle, padding: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
              CI gate findings ({result.gateFindings.length})
            </div>
            {result.gateFindings.map((finding, idx) => (
              <GateFindingCard
                key={`${finding.scenarioId}-${finding.gate}-${idx}`}
                finding={finding}
              />
            ))}
          </section>
        )}

        <section style={{ ...panelStyle, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
            Recommended review routes
          </div>
          <ul style={{ marginLeft: 16, ...mutedText }}>
            {result.recommendedReviewRoutes.map((route) => (
              <li key={route}>
                <Link href={route}>{route}</Link>
              </li>
            ))}
          </ul>
        </section>

        <section style={{ ...panelStyle, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
            Disclosures
          </div>
          <ul style={{ marginLeft: 16, ...mutedText, fontSize: 13 }}>
            {result.disclosures.map((disclosure) => (
              <li key={disclosure}>{disclosure}</li>
            ))}
          </ul>
        </section>

        <section style={{ ...panelStyle, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
            Production restrictions
          </div>
          <ul style={{ marginLeft: 16, ...mutedText, fontSize: 13 }}>
            {result.productionRestrictions.map((restriction) => (
              <li key={restriction}>{restriction}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
