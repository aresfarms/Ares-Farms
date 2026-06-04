"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  BorrowerOnboardingCoreV2CrossSourceConflict,
  BorrowerOnboardingCoreV2CustomerSummary,
  BorrowerOnboardingCoreV2Input,
  BorrowerOnboardingCoreV2Result,
  composeBorrowerOnboardingCoreV2,
} from "@/lib/borrower/onboardingCoreV2Runtime";

type ApiResponse = {
  ok: boolean;
  error?: string;
  v2Result?: BorrowerOnboardingCoreV2Result;
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

const inputStyle = {
  width: "100%",
  minHeight: 42,
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  padding: "8px 10px",
  fontSize: 14,
  background: "#ffffff",
} as const;

function StatusBadge(props: {
  tone: "ready" | "review" | "blocked" | "neutral";
  label: string;
}) {
  const palette = {
    ready: { bg: "#dbf0e2", fg: "#1f5a32", border: "#a8d8b3" },
    review: { bg: "#fff4d6", fg: "#7a4d00", border: "#f0d27a" },
    blocked: { bg: "#fde4e4", fg: "#80222d", border: "#f4b1b7" },
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

function CustomerSummaryCard(props: {
  summary: BorrowerOnboardingCoreV2CustomerSummary;
}) {
  const { summary } = props;
  return (
    <div style={{ ...panelStyle, padding: 14, marginBottom: 10 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 8,
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            {summary.customerType.label}
          </div>
          <div style={{ ...mutedText, fontSize: 12 }}>
            archetype {summary.customerType.archetype} · federation{" "}
            {summary.customerType.federationScope} · review boundary:{" "}
            {summary.reviewBoundary}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <StatusBadge
            tone="neutral"
            label={`${summary.grantCardCount} grants`}
          />
          <StatusBadge
            tone="neutral"
            label={`${summary.legacySectionCount} v1 sections`}
          />
          {summary.crossSourceConflictCount > 0 && (
            <StatusBadge
              tone="review"
              label={`${summary.crossSourceConflictCount} conflicts`}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ConflictCard(props: {
  conflict: BorrowerOnboardingCoreV2CrossSourceConflict;
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
      <div style={{ fontWeight: 600, fontSize: 13 }}>{props.conflict.topic}</div>
      <div style={{ ...mutedText, fontSize: 12 }}>
        {props.conflict.description}
      </div>
    </div>
  );
}

export default function BorrowerOnboardingCoreV2Page() {
  const [reviewerRole, setReviewerRole] = useState(
    "Qualified Governance Reviewer"
  );
  const [stage, setStage] = useState<
    "" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  >("BEGINNER");
  const [stateValue, setStateValue] = useState("MD");
  const [county, setCounty] = useState("Frederick");
  const [farmTypes, setFarmTypes] = useState("CROPS, LIVESTOCK");
  const [goals, setGoals] = useState("EXPANSION, SUSTAINABILITY");
  const [acreage, setAcreage] = useState("40");
  const [declaredCustomerTypes, setDeclaredCustomerTypes] = useState(
    "beginning farmer, rural small business"
  );
  const [intendedUses, setIntendedUses] = useState(
    "specialty crops, energy efficiency"
  );
  const [sovereignAllowed, setSovereignAllowed] = useState(false);
  const [serverResult, setServerResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const localInput = useMemo<BorrowerOnboardingCoreV2Input>(
    () => ({
      reviewerRole,
      declaredCustomerTypes: declaredCustomerTypes
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      intendedUses: intendedUses
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      scope: { sovereignFederationAllowed: sovereignAllowed },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onboardingState: {
        stage,
        location: { country: "US", state: stateValue, county },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        farmTypes: farmTypes
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean) as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        goals: goals
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean) as any,
        acreage: Number(acreage) || 0,
        interests: {
          soilAnalysis: true,
          environmentalReports: true,
          financing: true,
          vendorRecommendations: true,
          commodityIntelligence: true,
        },
      },
    }),
    [
      reviewerRole,
      declaredCustomerTypes,
      intendedUses,
      sovereignAllowed,
      stage,
      stateValue,
      county,
      farmTypes,
      goals,
      acreage,
    ]
  );

  const previewResult = useMemo(
    () => composeBorrowerOnboardingCoreV2(localInput),
    [localInput]
  );

  const result = serverResult?.v2Result ?? previewResult;

  async function runComposition() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "/api/governance/borrower-onboarding-core-v2",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(localInput),
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
                Borrower Onboarding Core v2
              </div>
              <div style={{ ...mutedText, marginTop: 4 }}>
                Internal governance composition over the legacy v1 borrower
                onboarding workflow and Opportunity Discovery v2 (which
                composes FPE v2 + RI v2 + Customer Type + Capital Graph + all
                upstream legacy bridges). Advisory borrower
                intake-and-discovery posture only — no approval, autonomous
                onboarding / eligibility / pathway / opportunity decision is
                produced; no live external fetch; no source-certainty claim;
                no borrower notice send.
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <StatusBadge tone="blocked" label="Production blocked" />
              <StatusBadge tone="review" label="Human review required" />
              <StatusBadge tone="neutral" label="Replay safe" />
            </div>
          </div>
        </header>

        <section style={{ ...panelStyle, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
            Borrower onboarding state
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
                style={inputStyle}
                value={reviewerRole}
                onChange={(e) => setReviewerRole(e.target.value)}
              />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Stage</span>
              <select
                style={inputStyle}
                value={stage}
                onChange={(e) =>
                  setStage(
                    e.target.value as
                      | ""
                      | "BEGINNER"
                      | "INTERMEDIATE"
                      | "ADVANCED"
                  )
                }
              >
                <option value="">(unspecified)</option>
                <option value="BEGINNER">BEGINNER</option>
                <option value="INTERMEDIATE">INTERMEDIATE</option>
                <option value="ADVANCED">ADVANCED</option>
              </select>
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>State</span>
              <input
                style={inputStyle}
                value={stateValue}
                onChange={(e) => setStateValue(e.target.value)}
              />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>County</span>
              <input
                style={inputStyle}
                value={county}
                onChange={(e) => setCounty(e.target.value)}
              />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Farm types</span>
              <input
                style={inputStyle}
                value={farmTypes}
                onChange={(e) => setFarmTypes(e.target.value)}
              />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Goals</span>
              <input
                style={inputStyle}
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
              />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Acreage</span>
              <input
                style={inputStyle}
                value={acreage}
                onChange={(e) => setAcreage(e.target.value)}
              />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                Declared customer types
              </span>
              <input
                style={inputStyle}
                value={declaredCustomerTypes}
                onChange={(e) => setDeclaredCustomerTypes(e.target.value)}
              />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                Intended uses
              </span>
              <input
                style={inputStyle}
                value={intendedUses}
                onChange={(e) => setIntendedUses(e.target.value)}
              />
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
              }}
            >
              <input
                type="checkbox"
                checked={sovereignAllowed}
                onChange={(e) => setSovereignAllowed(e.target.checked)}
              />
              Sovereign federation authorized
            </label>
          </div>
          <div style={{ marginTop: 14 }}>
            <button
              onClick={runComposition}
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
            {[
              ["Declared types", result.summary.declaredCustomerTypeCount],
              ["Matched profiles", result.summary.matchedCustomerProfileCount],
              ["Grant cards", result.summary.totalGrantCardCount],
              [
                "v1 readiness",
                `${result.summary.legacyReadinessPercent}%`,
              ],
              [
                "v1 missing items",
                result.summary.legacyMissingItemCount,
              ],
              [
                "v1 discovery sections",
                result.summary.totalLegacyDiscoverySectionCount,
              ],
              [
                "v1 discovery cards",
                result.summary.totalLegacyDiscoveryCardCount,
              ],
              [
                "Cross-source conflicts",
                result.summary.crossSourceConflictCount,
              ],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                style={{
                  ...panelStyle,
                  padding: 12,
                  background: "#f6f8fb",
                }}
              >
                <div style={{ fontSize: 12, ...mutedText }}>{label}</div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{value}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ ...panelStyle, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
            Per-customer-type summaries ({result.customerSummaries.length})
          </div>
          {result.customerSummaries.length === 0 ? (
            <div style={mutedText}>No matched customer types yet.</div>
          ) : (
            result.customerSummaries.map((summary) => (
              <CustomerSummaryCard
                key={summary.customerType.typeId}
                summary={summary}
              />
            ))
          )}
        </section>

        <section style={{ ...panelStyle, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
            Legacy v1 onboarding workflow
          </div>
          <div style={{ ...mutedText, fontSize: 13 }}>
            readiness {result.legacyWorkflow.readinessPercent}% · missing
            items {result.legacyWorkflow.missingItems.length} · handoffs{" "}
            {result.legacyWorkflow.handoffs.length} · next routes{" "}
            {result.legacyWorkflow.nextRoutes.length}
          </div>
          {result.legacyWorkflow.missingItems.length > 0 && (
            <div style={{ ...mutedText, fontSize: 12, marginTop: 6 }}>
              Missing: {result.legacyWorkflow.missingItems.join(" · ")}
            </div>
          )}
        </section>

        {result.crossSourceConflicts.length > 0 && (
          <section style={{ ...panelStyle, padding: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
              Cross-source conflicts ({result.crossSourceConflicts.length})
            </div>
            {result.crossSourceConflicts.map((conflict) => (
              <ConflictCard key={conflict.conflictId} conflict={conflict} />
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
      </div>
    </div>
  );
}
