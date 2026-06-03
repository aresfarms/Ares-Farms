"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  RevenueIntelligenceV2ComposedProgram,
  RevenueIntelligenceV2CrossSourceConflict,
  RevenueIntelligenceV2CustomerProfile,
  RevenueIntelligenceV2Input,
  RevenueIntelligenceV2Result,
  composeRevenueIntelligenceV2,
} from "@/lib/revenue-intelligence/revenueIntelligenceV2Runtime";

/**
 * Revenue Intelligence v2 Page
 *
 * Master Volume Governance:
 * - Vol I: presents accountable v2 composition fused from Customer Type
 *   Registry and Capital Graph.
 * - Vol II: blocks composed posture from becoming program approval,
 *   eligibility determination, or sponsor commitment.
 * - Vol III: uses deterministic backend-compatible composition.
 * - Vol III-B: displays human-review and production-block posture.
 * - Vol IV: routes reviewer next steps to Capital Graph, Customer Type
 *   Registry, financing pathway guidance, opportunity discovery,
 *   advanced intelligence, evidence engine, certification engine,
 *   registry framework, governance, and reviews.
 * - Vol V: preserves disclosures, source authority, conformance, and
 *   no-live-action boundaries.
 * - Vol VI: keeps every entry behind a public-safe DTO.
 */

type ApiResponse = {
  ok: boolean;
  error?: string;
  v2Result?: RevenueIntelligenceV2Result;
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

function ProgramRow(props: { program: RevenueIntelligenceV2ComposedProgram }) {
  const program = props.program;

  return (
    <article
      style={{
        border: "1px solid #d7deea",
        borderRadius: 6,
        padding: 10,
        display: "grid",
        gap: 6,
        background: "#f8fafc",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        <strong style={{ fontSize: 13 }}>{program.programName}</strong>
        <span style={{ ...mutedText, fontSize: 11 }}>
          {program.categoryId} · fit {program.capitalFitScore}
        </span>
      </div>
      <p style={{ ...mutedText, margin: 0, fontSize: 11 }}>
        Sponsor: {program.sponsorAuthority} · Federation: {program.federationScope} · Tier: {program.customerTypeTier}
      </p>
      {program.capitalFitReasons.length > 0 ? (
        <ul
          style={{
            margin: 0,
            paddingLeft: 16,
            color: "#475569",
            fontSize: 11,
          }}
        >
          {program.capitalFitReasons.slice(0, 2).map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function CrossSourceConflictRow(props: {
  conflict: RevenueIntelligenceV2CrossSourceConflict;
}) {
  const conflict = props.conflict;

  return (
    <div
      style={{
        border: "1px solid #fbbf24",
        background: "#fffbeb",
        borderRadius: 6,
        padding: 8,
        display: "grid",
        gap: 4,
      }}
    >
      <strong style={{ fontSize: 12, color: "#92400e" }}>
        Cross-source conflict · {conflict.topic}
      </strong>
      <span style={{ ...mutedText, fontSize: 11 }}>{conflict.description}</span>
      <Link
        href={conflict.reviewRoute}
        style={{
          color: "#1d4ed8",
          fontWeight: 800,
          textDecoration: "none",
          fontSize: 11,
        }}
      >
        Review at {conflict.reviewRoute}
      </Link>
    </div>
  );
}

function CustomerProfileCard(props: {
  profile: RevenueIntelligenceV2CustomerProfile;
}) {
  const profile = props.profile;

  return (
    <article
      style={{
        ...panelStyle,
        padding: 14,
        display: "grid",
        gap: 10,
      }}
    >
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
          <h3 style={{ margin: 0, fontSize: 16 }}>
            {profile.customerType.label}
          </h3>
          <p style={{ ...mutedText, margin: "2px 0 0", fontSize: 12 }}>
            {profile.customerType.archetype} · {profile.customerType.federationScope}
          </p>
        </div>
        <StatusBadge tone="review" text="Review-bound" />
      </div>
      <p style={{ ...mutedText, margin: 0, fontSize: 11 }}>
        <strong>Review boundary:</strong> {profile.reviewBoundary}
      </p>
      <div>
        <strong style={{ fontSize: 13 }}>
          Composed programs ({profile.composedPrograms.length}):
        </strong>
        {profile.composedPrograms.length === 0 ? (
          <p style={{ ...mutedText, margin: "4px 0 0", fontSize: 12 }}>
            No Capital Graph matches in the current borrower context.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 6,
              marginTop: 4,
            }}
          >
            {profile.composedPrograms.slice(0, 4).map((program) => (
              <ProgramRow key={program.programId} program={program} />
            ))}
          </div>
        )}
      </div>
      {profile.legacyRevenueOpportunityBridge.length > 0 ? (
        <div>
          <strong style={{ fontSize: 13 }}>
            Legacy bridge ({profile.legacyRevenueOpportunityBridge.length}):
          </strong>
          <ul
            style={{
              margin: "4px 0 0",
              paddingLeft: 16,
              color: "#475569",
              fontSize: 11,
            }}
          >
            {profile.legacyRevenueOpportunityBridge.slice(0, 3).map((entry) => (
              <li key={entry.revenueOpportunityId}>
                {entry.productCategory} — {entry.estimatedRevenueRange} (
                {entry.projectionBasis})
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {profile.crossSourceConflicts.length > 0 ? (
        <div style={{ display: "grid", gap: 4 }}>
          {profile.crossSourceConflicts.slice(0, 2).map((conflict) => (
            <CrossSourceConflictRow
              key={conflict.conflictId}
              conflict={conflict}
            />
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
        {profile.blockedClaims.slice(0, 3).map((claim) => (
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
    </article>
  );
}

export default function RevenueIntelligenceV2Page() {
  const [reviewerRole, setReviewerRole] = useState(
    "Qualified Governance Reviewer"
  );
  const [applicationId, setApplicationId] = useState("");
  const [declaredTypes, setDeclaredTypes] = useState(
    "beginning farmer, rural small business"
  );
  const [intendedUses, setIntendedUses] = useState(
    "working capital, equipment, energy efficiency"
  );
  const [stateCode, setStateCode] = useState("MD");
  const [federal, setFederal] = useState(true);
  const [sovereignFederation, setSovereignFederation] = useState(false);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const input = useMemo<RevenueIntelligenceV2Input>(
    () => ({
      reviewerRole: reviewerRole || null,
      applicationId: applicationId || null,
      borrowerContext: {
        declaredCustomerTypes: declaredTypes
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        intendedUses: intendedUses
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        jurisdiction: { federal, state: stateCode || null },
      },
      scope: {
        sovereignFederationAllowed: sovereignFederation,
      },
    }),
    [
      applicationId,
      declaredTypes,
      federal,
      intendedUses,
      reviewerRole,
      sovereignFederation,
      stateCode,
    ]
  );

  const localResult = useMemo(
    () => composeRevenueIntelligenceV2(input),
    [input]
  );
  const result = apiResponse?.v2Result ?? localResult;

  async function submitForReview() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        "/api/governance/revenue-intelligence-v2",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...input, userId: reviewerRole }),
        }
      );
      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ?? "Revenue Intelligence v2 request failed."
        );
      }

      setApiResponse(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unknown Revenue Intelligence v2 request error."
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
                Revenue Intelligence v2
              </span>
              <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.1 }}>
                Customer Type × Capital Graph Composition
              </h1>
              <p style={{ ...mutedText, margin: 0 }}>
                Fuses the Customer Type Registry (Build 14) with the Universal
                Capital Graph (Build 13). Each matched customer type yields
                composed program candidates (Capital Graph eligibility ∩
                customer-type eligible categories), legacy revenue-opportunity
                bridge entries, and preserved cross-source conflict signals
                when federation scope or eligibility boundaries disagree.
                Internal advisory evidence only — no autonomous customer
                eligibility determination, credit decision, lender commitment,
                public verification, regulatory reliance, or legal reliance is
                created.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <StatusBadge tone="blocked" text="Production blocked" />
              <StatusBadge tone="review" text="Human review required" />
              <StatusBadge tone="blocked" text="Advisory only" />
              <StatusBadge tone="blocked" text="No autonomous lending" />
              <StatusBadge tone="review" text="Conflict-preserving" />
              <StatusBadge tone="review" text="Federation scoped" />
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
                Application ID
              </span>
              <input
                value={applicationId}
                onChange={(event) => setApplicationId(event.target.value)}
                placeholder="Optional"
                style={inputStyle}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span
                style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}
              >
                Declared customer types (csv)
              </span>
              <input
                value={declaredTypes}
                onChange={(event) => setDeclaredTypes(event.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span
                style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}
              >
                Intended uses (csv)
              </span>
              <input
                value={intendedUses}
                onChange={(event) => setIntendedUses(event.target.value)}
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
                value={stateCode}
                onChange={(event) => setStateCode(event.target.value)}
                style={inputStyle}
              />
            </label>
            <label
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                marginTop: 26,
              }}
            >
              <input
                type="checkbox"
                checked={federal}
                onChange={(event) => setFederal(event.target.checked)}
              />
              Federal jurisdiction
            </label>
            <label
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                marginTop: 26,
              }}
            >
              <input
                type="checkbox"
                checked={sovereignFederation}
                onChange={(event) =>
                  setSovereignFederation(event.target.checked)
                }
              />
              Sovereign federation authorized
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
              : "Compose Revenue Intelligence v2"}
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
          <h2 style={{ margin: 0, fontSize: 22 }}>v2 Composition Summary</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
            }}
          >
            <SummaryCell
              label="Customer profiles"
              value={result.summary.customerProfileCount}
            />
            <SummaryCell
              label="Composed programs"
              value={result.summary.totalComposedProgramCount}
            />
            <SummaryCell
              label="Legacy bridge entries"
              value={result.summary.totalLegacyOpportunityCount}
            />
            <SummaryCell
              label="Conflict signals"
              value={result.summary.conflictSignalCount}
            />
            <SummaryCell
              label="Cross-source conflicts"
              value={result.summary.crossSourceConflictCount}
            />
            <SummaryCell
              label="Capital pathways"
              value={result.summary.capitalPathwayCount}
            />
            <SummaryCell
              label="Sovereign programs"
              value={result.summary.sovereignProgramCount}
            />
            <SummaryCell
              label="Participant programs"
              value={result.summary.participantProgramCount}
            />
            <SummaryCell
              label="Public programs"
              value={result.summary.publicProgramCount}
            />
          </div>
          <p style={{ ...mutedText, margin: 0, fontSize: 12 }}>
            Legacy bridge version: {result.legacyBridge.bridgeVersion} ·
            Program graph entries: {result.legacyBridge.programGraphCount} ·
            Revenue opportunity entries:{" "}
            {result.legacyBridge.revenueOpportunityCount}
          </p>
        </section>

        <section style={{ display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Customer profiles</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
              gap: 10,
            }}
          >
            {result.customerProfiles.length === 0 ? (
              <p style={{ ...mutedText, margin: 0 }}>
                No customer types matched the declared borrower context.
                Adjust declared types or sovereign federation authorization.
              </p>
            ) : (
              result.customerProfiles.map((profile) => (
                <CustomerProfileCard
                  key={profile.customerType.typeId}
                  profile={profile}
                />
              ))
            )}
          </div>
        </section>

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
            <StatusBadge tone="blocked" text="No autonomous lending" />
            <StatusBadge tone="blocked" text="No autonomous eligibility" />
            <StatusBadge tone="review" text="Conflict-preserving" />
            <StatusBadge tone="review" text="Federation scoped" />
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
              Local preview is shown until the reviewer submits the v2 pack
              for governed API review.
            </p>
          )}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {result.recommendedReviewRoutes.slice(0, 14).map((route) => (
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
