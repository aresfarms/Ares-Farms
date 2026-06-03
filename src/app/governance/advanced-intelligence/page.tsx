"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  AdvancedIntelligenceConflict,
  AdvancedIntelligenceDomainResult,
  AdvancedIntelligenceInput,
  AdvancedIntelligenceInsight,
  AdvancedIntelligenceResult,
  evaluateAdvancedIntelligence,
} from "@/lib/intelligence/advancedIntelligenceRuntime";

/**
 * Advanced Intelligence Page
 *
 * Master Volume Governance:
 * - Vol I: presents accountable composed intelligence posture.
 * - Vol II: blocks composed intelligence from becoming approval,
 *   eligibility, underwriting, credit decision, lender commitment,
 *   public verification, regulatory reliance, or legal reliance.
 * - Vol III: uses deterministic backend-compatible composition.
 * - Vol III-B: displays human-review and production-block posture and
 *   surfaces conflict-preserving evidence.
 * - Vol IV: routes reviewer next steps to revenue opportunities,
 *   property discovery, customer revenue review, opportunity discovery,
 *   registry framework, evidence engine, certification engine, evidence
 *   packets, audit replay, governance, and reviews.
 * - Vol V-VII: preserves disclosures, source authority, conformance, and
 *   no-live-action boundaries on internal posture output.
 */

type ApiResponse = {
  ok: boolean;
  error?: string;
  intelligenceResult?: AdvancedIntelligenceResult;
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
  text: string;
}) {
  const tones = {
    ready: { background: "#e7f5ed", color: "#047857" },
    review: { background: "#fff7ed", color: "#9a3412" },
    blocked: { background: "#fff1f0", color: "#b42318" },
    neutral: { background: "#eef2f7", color: "#475569" },
  } as const;
  const tone = tones[props.tone];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: 28,
        padding: "0 10px",
        borderRadius: 999,
        background: tone.background,
        color: tone.color,
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {props.text}
    </span>
  );
}

function SummaryCell(props: { label: string; value: number }) {
  return (
    <div
      style={{
        border: "1px solid #d7deea",
        borderRadius: 6,
        padding: 10,
        background: "#f8fafc",
      }}
    >
      <strong style={{ fontSize: 22 }}>{props.value}</strong>
      <p style={{ ...mutedText, margin: "2px 0 0" }}>{props.label}</p>
    </div>
  );
}

function ConflictRow(props: { conflict: AdvancedIntelligenceConflict }) {
  const conflict = props.conflict;

  return (
    <div
      style={{
        border: "1px solid #fbbf24",
        background: "#fffbeb",
        borderRadius: 6,
        padding: 10,
        display: "grid",
        gap: 4,
      }}
    >
      <strong style={{ fontSize: 13, color: "#92400e" }}>
        Conflict preserved · {conflict.topic}
      </strong>
      <span style={{ ...mutedText, fontSize: 12 }}>{conflict.description}</span>
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          color: "#64748b",
          fontSize: 11,
          fontWeight: 800,
        }}
      >
        {conflict.competingSignals.slice(0, 6).map((signal) => (
          <span
            key={signal.signalId}
            style={{
              border: "1px solid #d7deea",
              borderRadius: 999,
              padding: "3px 7px",
              background: "#ffffff",
            }}
          >
            {signal.label}: {signal.value}
          </span>
        ))}
      </div>
      <Link
        href={conflict.reviewRoute}
        style={{
          color: "#1d4ed8",
          fontWeight: 800,
          textDecoration: "none",
          fontSize: 12,
        }}
      >
        Review at {conflict.reviewRoute}
      </Link>
    </div>
  );
}

function InsightCard(props: { insight: AdvancedIntelligenceInsight }) {
  const insight = props.insight;

  return (
    <article
      style={{
        ...panelStyle,
        padding: 12,
        display: "grid",
        gap: 8,
      }}
    >
      <div>
        <h3 style={{ margin: 0, fontSize: 14 }}>{insight.title}</h3>
        <p style={{ ...mutedText, margin: "2px 0 0", fontSize: 12 }}>
          {insight.summary}
        </p>
      </div>
      {insight.signals.length > 0 ? (
        <ul style={{ margin: 0, paddingLeft: 16, color: "#475569", fontSize: 12 }}>
          {insight.signals.slice(0, 4).map((signal) => (
            <li key={signal.signalId}>
              {signal.label}: {signal.value}
            </li>
          ))}
        </ul>
      ) : null}
      {insight.conflicts.length > 0 ? (
        <div style={{ display: "grid", gap: 6 }}>
          {insight.conflicts.slice(0, 2).map((conflict) => (
            <ConflictRow key={conflict.conflictId} conflict={conflict} />
          ))}
        </div>
      ) : null}
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          color: "#64748b",
          fontSize: 11,
          fontWeight: 800,
        }}
      >
        {insight.blockedClaims.slice(0, 3).map((claim) => (
          <span
            key={claim}
            style={{
              border: "1px solid #d7deea",
              borderRadius: 999,
              padding: "3px 7px",
              background: "#f8fafc",
            }}
          >
            No {claim}
          </span>
        ))}
      </div>
      <Link
        href={insight.reviewRoute}
        style={{
          color: "#1d4ed8",
          fontWeight: 800,
          textDecoration: "none",
          fontSize: 12,
        }}
      >
        Review at {insight.reviewRoute}
      </Link>
    </article>
  );
}

function DomainView(props: { domain: AdvancedIntelligenceDomainResult }) {
  const domain = props.domain;

  return (
    <section style={{ display: "grid", gap: 10 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>{domain.label}</h2>
          <p style={{ ...mutedText, margin: "4px 0 0" }}>
            Review at {domain.reviewRoute}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <StatusBadge tone="neutral" text={`${domain.insights.length} insight(s)`} />
          {domain.conflictCount > 0 ? (
            <StatusBadge
              tone="review"
              text={`${domain.conflictCount} conflict(s)`}
            />
          ) : null}
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 10,
        }}
      >
        {domain.insights.length === 0 ? (
          <p style={{ ...mutedText, margin: 0 }}>
            No insights in scope for this domain.
          </p>
        ) : (
          domain.insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))
        )}
      </div>
    </section>
  );
}

export default function AdvancedIntelligencePage() {
  const [reviewerRole, setReviewerRole] = useState(
    "Qualified Source Intelligence Reviewer"
  );
  const [stateInput, setStateInput] = useState("");
  const [customerType, setCustomerType] = useState("");
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const input = useMemo<AdvancedIntelligenceInput>(
    () => ({
      reviewerRole: reviewerRole || null,
      scope: {
        state: stateInput || null,
        customerType: customerType || null,
      },
    }),
    [customerType, reviewerRole, stateInput]
  );

  const localResult = useMemo(
    () => evaluateAdvancedIntelligence(input),
    [input]
  );
  const result = apiResponse?.intelligenceResult ?? localResult;

  async function submitForReview() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        "/api/governance/advanced-intelligence",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...input, userId: reviewerRole }),
        }
      );
      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ?? "Advanced intelligence request failed."
        );
      }

      setApiResponse(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unknown advanced intelligence request error."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={shellStyle}>
      <div style={containerStyle}>
        <section
          style={{ ...panelStyle, padding: 22, display: "grid", gap: 16 }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "grid", gap: 8, maxWidth: 760 }}>
              <span
                style={{
                  color: "#456077",
                  fontSize: 13,
                  fontWeight: 800,
                  textTransform: "uppercase",
                }}
              >
                Advanced Intelligence
              </span>
              <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.1 }}>
                Source · Revenue · Market · Geospatial · Pathway
              </h1>
              <p style={{ ...mutedText, margin: 0 }}>
                Composed source, revenue, market, geospatial, and pathway
                intelligence. Output is advisory, replay-safe, and
                conflict-preserving — when canonical sources disagree, both
                signals are preserved with their respective source authority
                tiers for human review. No approval, eligibility, underwriting,
                credit decision, lender commitment, public verification,
                regulatory reliance, or legal reliance is created.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <StatusBadge tone="blocked" text="Production blocked" />
              <StatusBadge tone="review" text="Human review required" />
              <StatusBadge tone="blocked" text="Advisory only" />
              <StatusBadge tone="review" text="Conflict-preserving" />
              <StatusBadge tone="blocked" text="No approval" />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            <label style={{ display: "grid", gap: 6 }}>
              <span
                style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}
              >
                Reviewer role
              </span>
              <input
                value={reviewerRole}
                onChange={(event) => setReviewerRole(event.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span
                style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}
              >
                State
              </span>
              <input
                value={stateInput}
                onChange={(event) => setStateInput(event.target.value)}
                placeholder="Optional (e.g. MD)"
                style={inputStyle}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span
                style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}
              >
                Customer type
              </span>
              <input
                value={customerType}
                onChange={(event) => setCustomerType(event.target.value)}
                placeholder="Optional (e.g. beginning farmer)"
                style={inputStyle}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={submitForReview}
            disabled={submitting}
            style={{
              justifySelf: "start",
              minHeight: 42,
              border: 0,
              borderRadius: 6,
              padding: "0 16px",
              background: submitting ? "#94a3b8" : "#1d4ed8",
              color: "#ffffff",
              fontWeight: 800,
              cursor: submitting ? "default" : "pointer",
            }}
          >
            {submitting
              ? "Composing for review..."
              : "Compose Advanced Intelligence"}
          </button>

          {error ? (
            <div
              style={{
                border: "1px solid #fecaca",
                background: "#fff1f0",
                color: "#991b1b",
                borderRadius: 8,
                padding: 12,
                fontWeight: 700,
              }}
            >
              {error}
            </div>
          ) : null}
        </section>

        <section
          style={{ ...panelStyle, padding: 18, display: "grid", gap: 12 }}
        >
          <h2 style={{ margin: 0, fontSize: 22 }}>Intelligence Summary</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
            }}
          >
            <SummaryCell label="Domains" value={result.summary.domainCount} />
            <SummaryCell label="Insights" value={result.summary.insightCount} />
            <SummaryCell
              label="Conflicts preserved"
              value={result.summary.conflictCount}
            />
            <SummaryCell
              label="Source authorities"
              value={result.summary.sourceAuthorityCount}
            />
          </div>
        </section>

        <div style={{ display: "grid", gap: 22 }}>
          {result.domains.map((domain) => (
            <DomainView key={domain.id} domain={domain} />
          ))}
        </div>

        <section
          style={{ ...panelStyle, padding: 18, display: "grid", gap: 12 }}
        >
          <h2 style={{ margin: 0, fontSize: 22 }}>Governance Evidence</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: 10,
            }}
          >
            <StatusBadge tone="blocked" text="Production blocked" />
            <StatusBadge tone="review" text="Human review required" />
            <StatusBadge tone="blocked" text="Advisory only" />
            <StatusBadge tone="review" text="Conflict-preserving" />
            <StatusBadge tone="blocked" text="No approval" />
            <StatusBadge tone="blocked" text="No public verification" />
          </div>
          {apiResponse?.governance ? (
            <p style={{ ...mutedText, margin: 0 }}>
              Trace {apiResponse.governance.traceId ?? "pending"} · version
              runtime{" "}
              {apiResponse.governance.versionRuntime?.ok ? "passed" : "pending"}{" "}
              · classification{" "}
              {apiResponse.governance.outputClassification?.classificationLevel ??
                "pending"}
            </p>
          ) : (
            <p style={{ ...mutedText, margin: 0 }}>
              Local preview is shown until the reviewer submits the
              intelligence pack for governed API review.
            </p>
          )}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {result.recommendedReviewRoutes.slice(0, 10).map((route) => (
              <Link
                key={route}
                href={route}
                style={{
                  color: "#1d4ed8",
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                {route}
              </Link>
            ))}
          </div>
        </section>

        <section style={{ ...panelStyle, padding: 18 }}>
          <h2 style={{ marginTop: 0, fontSize: 22 }}>Disclosures</h2>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#475569" }}>
            {result.disclosures.slice(0, 14).map((disclosure) => (
              <li key={disclosure}>{disclosure}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
