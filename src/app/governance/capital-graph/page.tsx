"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  CAPITAL_CATEGORY_GOVERNANCE,
  CapitalEligibilityFinding,
  CapitalGraphInput,
  CapitalGraphResult,
  CapitalPathwayCandidate,
  composeCapitalGraph,
} from "@/lib/capital-graph/capitalGraphRuntime";

/**
 * Capital Graph Page
 *
 * Master Volume Governance:
 * - Vol I (Constitutional Backbone): presents accountable canonical
 *   capital pathway posture.
 * - Vol II (Regulatory Governance): blocks posture from becoming program
 *   approval, regulatory determination, or sponsor commitment.
 * - Vol III (Technical Infrastructure): uses deterministic backend-
 *   compatible composition.
 * - Vol III-B (Governance Runtime): displays human-review and production-
 *   block posture and surfaces conflict-preserving evidence.
 * - Vol IV (Operational Runbooks): routes reviewer next steps to
 *   financing pathway guidance, opportunity discovery, advanced
 *   intelligence, lender workflow, evidence engine, certification engine,
 *   registry framework, governance, and reviews.
 * - Vol V (Canonical Doctrines): preserves disclosures, source authority,
 *   conformance, and no-live-action boundaries.
 * - Vol VI (Source Intelligence Integration): keeps every program behind
 *   a public-safe DTO; no raw sponsor records, no live external fetch.
 */

type ApiResponse = {
  ok: boolean;
  error?: string;
  capitalGraphResult?: CapitalGraphResult;
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

function PathwayCard(props: { pathway: CapitalPathwayCandidate }) {
  const pathway = props.pathway;

  return (
    <article
      style={{
        ...panelStyle,
        padding: 14,
        display: "grid",
        gap: 8,
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
          <h3 style={{ margin: 0, fontSize: 15 }}>{pathway.primaryProgramId}</h3>
          <p style={{ ...mutedText, margin: "2px 0 0", fontSize: 12 }}>
            {pathway.categoryId} · fit {pathway.fitScore}
          </p>
        </div>
        <StatusBadge tone="review" text="Review-bound" />
      </div>
      {pathway.stackingNotes.length > 0 ? (
        <div>
          <strong style={{ fontSize: 12 }}>Stacking notes:</strong>
          <ul
            style={{
              margin: "4px 0 0",
              paddingLeft: 16,
              color: "#475569",
              fontSize: 12,
            }}
          >
            {pathway.stackingNotes.slice(0, 3).map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {pathway.conflictSignals.length > 0 ? (
        <div
          style={{
            border: "1px solid #fbbf24",
            background: "#fffbeb",
            borderRadius: 6,
            padding: 8,
          }}
        >
          <strong style={{ fontSize: 12, color: "#92400e" }}>
            Conflict signals preserved
          </strong>
          <ul
            style={{
              margin: "4px 0 0",
              paddingLeft: 16,
              color: "#475569",
              fontSize: 11,
            }}
          >
            {pathway.conflictSignals.slice(0, 3).map((signal) => (
              <li key={signal}>{signal}</li>
            ))}
          </ul>
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
        {pathway.blockedClaims.slice(0, 3).map((claim) => (
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
        href={pathway.reviewRoute}
        style={{
          color: "#1d4ed8",
          fontWeight: 800,
          textDecoration: "none",
          fontSize: 12,
        }}
      >
        Review at {pathway.reviewRoute}
      </Link>
    </article>
  );
}

function FindingRow(props: { finding: CapitalEligibilityFinding }) {
  const finding = props.finding;

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
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <strong style={{ fontSize: 13 }}>{finding.programId}</strong>
        <span style={{ ...mutedText, fontSize: 11 }}>
          {finding.categoryId} · fit {finding.fitScore}
        </span>
      </div>
      {finding.fitReasons.length > 0 ? (
        <ul
          style={{
            margin: 0,
            paddingLeft: 16,
            color: "#475569",
            fontSize: 11,
          }}
        >
          {finding.fitReasons.slice(0, 2).map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}
      {finding.blockingReasons.length > 0 ? (
        <div
          style={{
            border: "1px solid #fecaca",
            background: "#fff1f0",
            color: "#991b1b",
            borderRadius: 6,
            padding: 6,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {finding.blockingReasons.slice(0, 2).join(" · ")}
        </div>
      ) : null}
    </article>
  );
}

const ALL_CATEGORY_IDS = CAPITAL_CATEGORY_GOVERNANCE.map(
  (category) => category.id
);

export default function CapitalGraphPage() {
  const [reviewerRole, setReviewerRole] = useState(
    "Qualified Capital Coordination Reviewer"
  );
  const [applicationId, setApplicationId] = useState("");
  const [customerTypes, setCustomerTypes] = useState(
    "beginning farmer, rural small business"
  );
  const [intendedUses, setIntendedUses] = useState(
    "working capital, equipment, energy efficiency"
  );
  const [stateCode, setStateCode] = useState("MD");
  const [federal, setFederal] = useState(true);
  const [utilityTerritory, setUtilityTerritory] = useState("");
  const [sovereignFederation, setSovereignFederation] = useState(false);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const input = useMemo<CapitalGraphInput>(
    () => ({
      reviewerRole: reviewerRole || null,
      applicationId: applicationId || null,
      eligibility: {
        customerTypes: customerTypes
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        intendedUses: intendedUses
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        jurisdiction: {
          federal,
          state: stateCode || null,
          utilityTerritory: utilityTerritory || null,
        },
        sovereignFederationAllowed: sovereignFederation,
      },
    }),
    [
      applicationId,
      customerTypes,
      federal,
      intendedUses,
      reviewerRole,
      sovereignFederation,
      stateCode,
      utilityTerritory,
    ]
  );

  const localResult = useMemo(() => composeCapitalGraph(input), [input]);
  const result = apiResponse?.capitalGraphResult ?? localResult;

  async function submitForReview() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/governance/capital-graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, userId: reviewerRole }),
      });
      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Capital Graph request failed.");
      }

      setApiResponse(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unknown Capital Graph request error."
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
                Universal Capital Graph
              </span>
              <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.1 }}>
                Canonical Funding Backbone
              </h1>
              <p style={{ ...mutedText, margin: 0 }}>
                Canonical capital taxonomy spanning {ALL_CATEGORY_IDS.length}{" "}
                categories with deterministic, replay-safe, audit-safe,
                conflict-preserving pathway composition. Internal advisory
                evidence only — no autonomous lending decision, program
                approval, public verification, regulatory reliance, lender
                commitment, tax-credit allocation, environmental clearance,
                carbon-credit issuance, or legal reliance is created.
                Sovereign sponsor programs are gated behind named federation
                participant review.
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
                Customer types (csv)
              </span>
              <input
                value={customerTypes}
                onChange={(event) => setCustomerTypes(event.target.value)}
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
            <label style={{ display: "grid", gap: 6 }}>
              <span
                style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}
              >
                Utility territory
              </span>
              <input
                value={utilityTerritory}
                onChange={(event) => setUtilityTerritory(event.target.value)}
                placeholder="Optional"
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
              Sovereign federation participation authorized
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
              : "Compose Capital Graph"}
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
          <h2 style={{ margin: 0, fontSize: 22 }}>Capital Graph Summary</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
            }}
          >
            <SummaryCell label="Categories" value={result.summary.categoryCount} />
            <SummaryCell label="Programs" value={result.summary.programCount} />
            <SummaryCell
              label="Matched programs"
              value={result.summary.matchedProgramCount}
            />
            <SummaryCell
              label="Pathway candidates"
              value={result.summary.pathwayCandidateCount}
            />
            <SummaryCell
              label="Conflict signals"
              value={result.summary.conflictSignalCount}
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
        </section>

        <section
          style={{ ...panelStyle, padding: 18, display: "grid", gap: 12 }}
        >
          <h2 style={{ margin: 0, fontSize: 22 }}>Capital taxonomy</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 10,
            }}
          >
            {result.categories.map((category) => (
              <article
                key={category.id}
                style={{
                  border: "1px solid #d7deea",
                  borderRadius: 6,
                  padding: 10,
                  background: "#f8fafc",
                  display: "grid",
                  gap: 4,
                }}
              >
                <strong style={{ fontSize: 14 }}>{category.label}</strong>
                <span style={{ ...mutedText, fontSize: 12 }}>
                  {category.sponsorTypes.join(", ")}
                </span>
                <span
                  style={{ ...mutedText, fontSize: 11 }}
                  title={category.doctrineRefs.join(" · ")}
                >
                  {category.doctrineRefs.length} doctrine ref(s)
                </span>
              </article>
            ))}
          </div>
        </section>

        <section style={{ display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Pathway candidates</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 10,
            }}
          >
            {result.pathways.length === 0 ? (
              <p style={{ ...mutedText, margin: 0 }}>
                No pathway candidates met the eligibility threshold for the
                current scope. Adjust borrower context or sovereign federation
                authorization.
              </p>
            ) : (
              result.pathways.map((pathway) => (
                <PathwayCard
                  key={pathway.pathwayId}
                  pathway={pathway}
                />
              ))
            )}
          </div>
        </section>

        <section
          style={{ ...panelStyle, padding: 18, display: "grid", gap: 12 }}
        >
          <h2 style={{ margin: 0, fontSize: 22 }}>
            Unreviewed eligibility findings
          </h2>
          <p style={{ ...mutedText, margin: 0, maxWidth: 760 }}>
            Findings below either fell under the eligibility-threshold or
            carry a blocking reason that requires qualified human review.
            They are preserved as first-class evidence and never collapsed.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 8,
            }}
          >
            {result.eligibility.unreviewed.slice(0, 12).map((finding) => (
              <FindingRow key={finding.programId} finding={finding} />
            ))}
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
            <StatusBadge tone="review" text="Conflict-preserving" />
            <StatusBadge tone="review" text="Federation scoped" />
            <StatusBadge tone="blocked" text="No public verification" />
            <StatusBadge tone="blocked" text="No regulatory reliance" />
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
              Local preview is shown until the reviewer submits the Capital
              Graph for governed API review.
            </p>
          )}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {result.recommendedReviewRoutes.slice(0, 12).map((route) => (
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
