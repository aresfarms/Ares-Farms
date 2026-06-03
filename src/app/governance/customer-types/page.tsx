"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  CustomerArchetype,
  CustomerTypeInput,
  CustomerTypeProfile,
  CustomerTypeResult,
  composeCustomerTypeRegistry,
} from "@/lib/customer-types/customerTypeRuntime";

/**
 * Customer Type Registry Page
 *
 * Master Volume Governance:
 * - Vol I: presents accountable canonical customer-type posture.
 * - Vol II: blocks posture from becoming customer eligibility
 *   determination or sponsor commitment.
 * - Vol III: uses deterministic backend-compatible composition.
 * - Vol III-B: displays human-review and production-block posture.
 * - Vol IV: routes reviewer next steps to Capital Graph, financing
 *   pathway guidance, opportunity discovery, advanced intelligence,
 *   evidence engine, certification engine, registry framework,
 *   governance, and reviews.
 * - Vol V: preserves disclosures, source authority, conformance, and
 *   no-live-action boundaries.
 * - Vol VI: keeps every customer-type entry behind a public-safe DTO.
 */

type ApiResponse = {
  ok: boolean;
  error?: string;
  customerTypeResult?: CustomerTypeResult;
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

function ProfileCard(props: { profile: CustomerTypeProfile }) {
  const profile = props.profile;

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
          <h3 style={{ margin: 0, fontSize: 15 }}>
            {profile.customerType.label}
          </h3>
          <p style={{ ...mutedText, margin: "2px 0 0", fontSize: 12 }}>
            {profile.customerType.archetype} · {profile.customerType.federationScope}
          </p>
        </div>
        <StatusBadge tone="review" text="Review-bound" />
      </div>
      <p style={{ ...mutedText, margin: 0, fontSize: 12 }}>
        {profile.customerType.description}
      </p>
      <div>
        <strong style={{ fontSize: 12 }}>
          Eligible capital ({profile.eligibleCapitalRefs.length}):
        </strong>
        <ul
          style={{
            margin: "4px 0 0",
            paddingLeft: 16,
            color: "#475569",
            fontSize: 11,
          }}
        >
          {profile.eligibleCapitalRefs.slice(0, 5).map((ref) => (
            <li key={ref.programId}>
              {ref.programName} ({ref.categoryId})
            </li>
          ))}
          {profile.eligibleCapitalRefs.length > 5 ? (
            <li>
              …and {profile.eligibleCapitalRefs.length - 5} more
            </li>
          ) : null}
        </ul>
      </div>
      {profile.conflictSignals.length > 0 ? (
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
            {profile.conflictSignals.slice(0, 3).map((signal) => (
              <li key={signal}>{signal}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <p style={{ ...mutedText, margin: 0, fontSize: 11 }}>
        <strong>Review boundary:</strong> {profile.reviewBoundary}
      </p>
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

const ARCHETYPE_OPTIONS: CustomerArchetype[] = [
  "AGRICULTURAL_PRODUCER",
  "RURAL_SMALL_BUSINESS",
  "AGRITOURISM_OPERATOR",
  "UTILITY_CUSTOMER",
  "COMMUNITY_FACILITY_SPONSOR",
  "HISTORIC_PRESERVATION_OWNER",
  "OPPORTUNITY_ZONE_BUSINESS",
  "WORKFORCE_DEVELOPMENT_EMPLOYER",
  "FOUNDATION_RECIPIENT",
  "COOPERATIVE",
  "NONPROFIT",
  "TRIBAL_NATION",
  "VETERAN_OWNED_BUSINESS",
  "WOMEN_OWNED_BUSINESS",
  "MINORITY_OWNED_BUSINESS",
  "ENVIRONMENTAL_MARKET_PARTICIPANT",
  "CARBON_MARKET_PARTICIPANT",
  "MISSION_ALIGNED_BORROWER",
];

export default function CustomerTypesPage() {
  const [reviewerRole, setReviewerRole] = useState(
    "Qualified Governance Reviewer"
  );
  const [applicationId, setApplicationId] = useState("");
  const [declaredTypes, setDeclaredTypes] = useState(
    "beginning farmer, rural small business"
  );
  const [stateCode, setStateCode] = useState("MD");
  const [federal, setFederal] = useState(true);
  const [sovereignFederation, setSovereignFederation] = useState(false);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const input = useMemo<CustomerTypeInput>(
    () => ({
      reviewerRole: reviewerRole || null,
      applicationId: applicationId || null,
      borrowerContext: {
        declaredTypes: declaredTypes
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
      reviewerRole,
      sovereignFederation,
      stateCode,
    ]
  );

  const localResult = useMemo(
    () => composeCustomerTypeRegistry(input),
    [input]
  );
  const result = apiResponse?.customerTypeResult ?? localResult;

  async function submitForReview() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/governance/customer-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, userId: reviewerRole }),
      });
      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Customer Type request failed.");
      }

      setApiResponse(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unknown Customer Type request error."
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
                Customer Type Registry
              </span>
              <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.1 }}>
                Canonical Borrower Archetypes
              </h1>
              <p style={{ ...mutedText, margin: 0 }}>
                Canonical customer-type taxonomy spanning {ARCHETYPE_OPTIONS.length}{" "}
                archetypes. Each customer type names its review boundary and
                lists eligible Capital Graph categories. Internal advisory
                evidence only — no autonomous customer eligibility
                determination, credit decision, lender commitment, public
                verification, regulatory reliance, tax-credit allocation,
                environmental clearance, carbon-credit issuance, or legal
                reliance is created. Sovereign customer types (e.g. tribal
                nations) require named federation participation.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <StatusBadge tone="blocked" text="Production blocked" />
              <StatusBadge tone="review" text="Human review required" />
              <StatusBadge tone="blocked" text="Advisory only" />
              <StatusBadge tone="blocked" text="No autonomous eligibility" />
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
            {submitting ? "Composing for review..." : "Compose Customer Types"}
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
          <h2 style={{ margin: 0, fontSize: 22 }}>Registry Summary</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
            }}
          >
            <SummaryCell label="Archetypes" value={result.summary.archetypeCount} />
            <SummaryCell
              label="Customer types"
              value={result.summary.customerTypeCount}
            />
            <SummaryCell
              label="Matched types"
              value={result.summary.matchedTypeCount}
            />
            <SummaryCell
              label="Eligible capital refs"
              value={result.summary.totalEligibleCapitalRefCount}
            />
            <SummaryCell
              label="Conflict signals"
              value={result.summary.conflictSignalCount}
            />
            <SummaryCell
              label="Sovereign types"
              value={result.summary.sovereignTypeCount}
            />
            <SummaryCell
              label="Participant types"
              value={result.summary.participantTypeCount}
            />
            <SummaryCell
              label="Public types"
              value={result.summary.publicTypeCount}
            />
          </div>
        </section>

        <section style={{ display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Matched profiles</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 10,
            }}
          >
            {result.profiles.length === 0 ? (
              <p style={{ ...mutedText, margin: 0 }}>
                No customer types matched the declared borrower context.
                Adjust declared types or sovereign federation authorization.
              </p>
            ) : (
              result.profiles.map((profile) => (
                <ProfileCard
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
          <h2 style={{ margin: 0, fontSize: 22 }}>Unmatched canonical types</h2>
          <p style={{ ...mutedText, margin: 0, maxWidth: 760 }}>
            Other canonical customer types in scope but not matched by the
            current declared types. They remain preserved as first-class
            governance evidence.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 8,
            }}
          >
            {result.unmatchedTypes.slice(0, 18).map((customerType) => (
              <div
                key={customerType.typeId}
                style={{
                  border: "1px solid #d7deea",
                  borderRadius: 6,
                  padding: 8,
                  background: "#f8fafc",
                }}
              >
                <strong style={{ fontSize: 13 }}>{customerType.label}</strong>
                <p style={{ ...mutedText, margin: "2px 0 0", fontSize: 11 }}>
                  {customerType.archetype} · {customerType.federationScope}
                </p>
              </div>
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
            <StatusBadge tone="blocked" text="No autonomous eligibility" />
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
              Local preview is shown until the reviewer submits the Customer
              Type pack for governed API review.
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
