"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  AdvancedIntelligenceV2CrossSourceConflict,
  AdvancedIntelligenceV2DomainResult,
  AdvancedIntelligenceV2Input,
  AdvancedIntelligenceV2Insight,
  AdvancedIntelligenceV2Result,
  composeAdvancedIntelligenceV2,
} from "@/lib/intelligence/advancedIntelligenceV2Runtime";
import { readJsonResponse } from "@/lib/http/readJsonResponse";

type ApiResponse = {
  ok: boolean;
  error?: string;
  v2Result?: AdvancedIntelligenceV2Result;
  governance?: {
    traceId?: string;
    versionRuntime?: { ok?: boolean };
    outputClassification?: { classificationLevel?: string };
  };
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

function InsightCard(props: { insight: AdvancedIntelligenceV2Insight }) {
  const { insight } = props;
  return (
    <div style={{ ...panelStyle, padding: 14, marginBottom: 10 }}>
      <div style={{ fontWeight: 600, fontSize: 14 }}>{insight.title}</div>
      <div style={{ ...mutedText, fontSize: 12, marginBottom: 8 }}>
        {insight.summary}
      </div>
      {insight.signals.length > 0 && (
        <ul
          style={{ marginLeft: 16, fontSize: 12, ...mutedText, marginBottom: 6 }}
        >
          {insight.signals.map((signal) => (
            <li key={signal.signalId}>
              <strong>{signal.label}:</strong> {signal.value}
              {signal.authorityTier && ` · authority ${signal.authorityTier}`}
            </li>
          ))}
        </ul>
      )}
      {insight.conflicts.length > 0 && (
        <div
          style={{
            fontSize: 12,
            color: "#7a4d00",
            background: "#fff4d6",
            border: "1px solid #f0d27a",
            borderRadius: 6,
            padding: 8,
          }}
        >
          {insight.conflicts.length} domain-level conflict signal(s) preserved
          as first-class evidence.
        </div>
      )}
    </div>
  );
}

function DomainSection(props: { domain: AdvancedIntelligenceV2DomainResult }) {
  const { domain } = props;
  return (
    <div style={{ ...panelStyle, padding: 14, marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 8,
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{domain.label}</div>
          <div style={{ ...mutedText, fontSize: 11 }}>
            review route: {domain.reviewRoute}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <StatusBadge
            tone="neutral"
            label={`${domain.insights.length} insights`}
          />
          {domain.conflictCount > 0 && (
            <StatusBadge
              tone="review"
              label={`${domain.conflictCount} conflicts`}
            />
          )}
        </div>
      </div>
      {domain.insights.length === 0 ? (
        <div style={mutedText}>No insights under the current scope.</div>
      ) : (
        domain.insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))
      )}
    </div>
  );
}

function ConflictCard(props: {
  conflict: AdvancedIntelligenceV2CrossSourceConflict;
}) {
  const { conflict } = props;
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
      <div style={{ fontWeight: 600, fontSize: 13 }}>{conflict.topic}</div>
      <div style={{ ...mutedText, fontSize: 12 }}>{conflict.description}</div>
      <div style={{ ...mutedText, fontSize: 11, marginTop: 4 }}>
        Resolution: {conflict.resolution} · Route: {conflict.reviewRoute}
      </div>
    </div>
  );
}

export default function AdvancedIntelligenceV2Page() {
  const [caseId, setCaseId] = useState<string | null>(null);
  const [caseName, setCaseName] = useState<string | null>(null);
  const [caseGoal, setCaseGoal] = useState<string | null>(null);
  const [reviewerRole, setReviewerRole] = useState(
    "Qualified Governance Reviewer"
  );
  const [declaredCustomerTypes, setDeclaredCustomerTypes] = useState(
    "beginning farmer, rural small business"
  );
  const [intendedUses, setIntendedUses] = useState(
    "specialty crops, energy efficiency"
  );
  const [stateValue, setStateValue] = useState("MD");
  const [sovereignAllowed, setSovereignAllowed] = useState(false);
  const [serverResult, setServerResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const incomingCaseId = query.get("caseId")?.trim() || null;
    if (!incomingCaseId) return;
    setCaseId(incomingCaseId);
    setCaseName(query.get("name")?.trim() || null);
    setCaseGoal(query.get("goal")?.trim() || null);
    const customerTypes = query.get("customerTypes")?.trim();
    const uses = query.get("intendedUses")?.trim();
    const state = query.get("state")?.trim();
    if (customerTypes) setDeclaredCustomerTypes(customerTypes);
    if (uses) setIntendedUses(uses);
    if (state) setStateValue(state);
  }, []);

  const caseReturnHref = useMemo(() => {
    if (!caseId) return null;
    const params = new URLSearchParams({
      name: caseName || `Furlong Case ${caseId}`,
      goal: caseGoal || "Evaluate governed pathways, evidence, constraints, and next steps.",
      customerTypes: declaredCustomerTypes,
      intendedUses,
    });
    if (stateValue) params.set("state", stateValue);
    params.set("origin", "governed-review");
    return `/intelligence/cases/${encodeURIComponent(caseId)}?${params.toString()}`;
  }, [caseGoal, caseId, caseName, declaredCustomerTypes, intendedUses, stateValue]);

  const localInput = useMemo<AdvancedIntelligenceV2Input>(
    () => ({
      reviewerRole,
      applicationId: caseId,
      borrowerContext: {
        declaredCustomerTypes: declaredCustomerTypes
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        intendedUses: intendedUses
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        jurisdiction: stateValue
          ? { federal: true, state: stateValue }
          : null,
      },
      scope: {
        sovereignFederationAllowed: sovereignAllowed,
        state: stateValue || null,
      },
      metadata: caseId ? { caseId, source: "INTELLIGENCE_CASE_GOVERNED_REVIEW" } : null,
    }),
    [
      reviewerRole,
      caseId,
      declaredCustomerTypes,
      intendedUses,
      stateValue,
      sovereignAllowed,
    ]
  );

  const previewResult = useMemo(
    () => composeAdvancedIntelligenceV2(localInput),
    [localInput]
  );

  const result = serverResult?.v2Result ?? previewResult;

  async function runComposition() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "/api/governance/advanced-intelligence-v2",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(localInput),
        }
      );
      const data = await readJsonResponse<ApiResponse>(response);
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
        {caseReturnHref && (
          <section data-testid="case-review-handoff" style={{ ...panelStyle, padding: 16, borderLeft: "5px solid #0f766e" }}>
            <strong>Governed review for {caseName || caseId}</strong>
            <p style={{ ...mutedText, margin: "6px 0 10px" }}>
              This review is scoped to the same intelligence case. Only the case reference and structured posture are carried; no Navigator transcript, identity, street address, or listing URL is transferred.
            </p>
            <Link href={caseReturnHref}>Return to the same intelligence case →</Link>
          </section>
        )}

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
                Advanced Intelligence v2
              </div>
              <div style={{ ...mutedText, marginTop: 4 }}>
                Internal governance intelligence composition over Lender
                Workflow v2, Opportunity Discovery v2, Financing Pathway
                Engine v2, Revenue Intelligence v2, Customer Type Registry,
                Capital Graph, and the legacy v1 advanced intelligence.
                Advisory only — no autonomous intelligence, opportunity,
                pathway, eligibility, credit, lender, or program decision is
                produced; no live external fetch is performed; no
                source-certainty claim is made.
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
                style={inputStyle}
                value={reviewerRole}
                onChange={(e) => setReviewerRole(e.target.value)}
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
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>State</span>
              <input
                style={inputStyle}
                value={stateValue}
                onChange={(e) => setStateValue(e.target.value)}
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
              ["v2 domains", result.summary.v2DomainCount],
              ["v1 domains", result.summary.v1DomainCount],
              ["Total insights", result.summary.totalInsightCount],
              ["v2 insights", result.summary.v2InsightCount],
              ["v1 insights", result.summary.v1InsightCount],
              ["Total conflicts", result.summary.conflictCount],
              [
                "Cross-source conflicts",
                result.summary.crossSourceConflictCount,
              ],
              [
                "Customer type coverage",
                result.summary.customerTypeCoverageCount,
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
            v2 governed intelligence domains
          </div>
          {result.v2Domains.map((domain) => (
            <DomainSection key={domain.id} domain={domain} />
          ))}
        </section>

        <section style={{ ...panelStyle, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
            Legacy v1 intelligence domains ({result.legacyDomains.length})
          </div>
          {result.legacyDomains.map((domain) => (
            <div
              key={domain.id}
              style={{
                ...panelStyle,
                padding: 10,
                marginBottom: 6,
                background: "#f6f8fb",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13 }}>
                {domain.label} ({domain.insights.length})
              </div>
              <div style={{ ...mutedText, fontSize: 11 }}>
                review route: {domain.reviewRoute}
              </div>
            </div>
          ))}
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
