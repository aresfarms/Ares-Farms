"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  OpportunityCard,
  OpportunityDiscoveryInput,
  OpportunityDiscoveryResult,
  OpportunityDiscoverySection,
  evaluateOpportunityDiscovery,
} from "@/lib/opportunity/discoveryRuntime";

/**
 * Borrower Opportunity Discovery Page
 *
 * Master Volume Governance:
 * - Vol I: presents accountable borrower-readable opportunity discovery.
 * - Vol II: blocks discovery from becoming program approval, revenue
 *   guarantee, property certification, legal permission, lender commitment,
 *   or regulatory or legal reliance.
 * - Vol III: uses deterministic backend-compatible composition.
 * - Vol III-B: displays human-review, no-live-fetch, and production-block
 *   posture.
 * - Vol IV: routes borrower next steps to revenue opportunities, property
 *   discovery, financing pathways, readiness, applications, and data rights.
 * - Vol V-VII: preserves public-surface disclosures, source authority,
 *   conformance, and no-live-action boundaries.
 */

type ApiResponse = {
  ok: boolean;
  error?: string;
  discoveryResult?: OpportunityDiscoveryResult;
  governance?: {
    traceId?: string;
    versionRuntime?: {
      ok?: boolean;
      replaySafe?: boolean;
    };
    outputClassification?: {
      classificationLevel?: string;
      sensitivityScope?: string;
    };
    explainability?: {
      humanReviewRequired?: boolean;
      confidenceScore?: number | null;
    };
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

const mutedText = {
  color: "#5d687a",
  lineHeight: 1.5,
} as const;

const inputStyle = {
  width: "100%",
  minHeight: 42,
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  padding: "8px 10px",
  fontSize: 14,
  color: "#162033",
  background: "#ffffff",
} as const;

function FieldLabel(props: { children: string }) {
  return (
    <span
      style={{
        display: "block",
        marginBottom: 6,
        color: "#334155",
        fontSize: 13,
        fontWeight: 800,
      }}
    >
      {props.children}
    </span>
  );
}

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

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const initialInput: OpportunityDiscoveryInput = {
  borrowerId: "borrower-demo",
  applicationId: "",
  location: {
    country: "US",
    state: "MD",
    county: "Queen Anne's",
  },
  customerTypes: ["beginning farmer"],
  farmTypes: ["CROPS"],
  goals: ["EXPANSION", "SUSTAINABILITY"],
  interests: {
    grants: true,
    properties: true,
    equipment: true,
    marketContext: true,
    revenueOpportunities: true,
    soilAnalysis: false,
    commodityIntelligence: false,
  },
};

function OpportunityCardView(props: { card: OpportunityCard }) {
  const card = props.card;

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
          <h3 style={{ margin: 0, fontSize: 16 }}>{card.title}</h3>
          {card.sponsorOrSourceType ? (
            <p style={{ ...mutedText, margin: "2px 0 0" }}>
              {card.sponsorOrSourceType}
              {card.geographyScope ? ` · ${card.geographyScope}` : null}
            </p>
          ) : card.geographyScope ? (
            <p style={{ ...mutedText, margin: "2px 0 0" }}>
              {card.geographyScope}
            </p>
          ) : null}
        </div>
        {typeof card.confidenceScore === "number" ? (
          <StatusBadge tone="neutral" text={`${card.confidenceScore}`} />
        ) : null}
      </div>
      <p style={{ margin: 0, fontSize: 14, color: "#334155" }}>{card.summary}</p>
      {card.fitReasons.length > 0 ? (
        <ul style={{ margin: 0, paddingLeft: 18, color: "#475569" }}>
          {card.fitReasons.slice(0, 3).map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
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
        {card.blockedClaims.slice(0, 4).map((claim) => (
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
        href={card.reviewRoute}
        style={{
          color: "#1d4ed8",
          fontWeight: 800,
          textDecoration: "none",
          fontSize: 13,
        }}
      >
        Review at {card.reviewRoute}
      </Link>
    </article>
  );
}

function SectionView(props: { section: OpportunityDiscoverySection }) {
  const section = props.section;

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
          <h2 style={{ margin: 0, fontSize: 22 }}>{section.label}</h2>
          <p style={{ ...mutedText, margin: "4px 0 0" }}>
            Review at {section.reviewRoute}
          </p>
        </div>
        <StatusBadge tone="neutral" text={`${section.cards.length}`} />
      </div>
      {section.reviewSignals.length > 0 ? (
        <ul style={{ margin: 0, paddingLeft: 18, color: "#475569" }}>
          {section.reviewSignals.slice(0, 3).map((signal) => (
            <li key={signal}>{signal}</li>
          ))}
        </ul>
      ) : null}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 10,
        }}
      >
        {section.cards.length === 0 ? (
          <p style={{ ...mutedText, margin: 0 }}>
            No advisory items to show for this section.
          </p>
        ) : (
          section.cards.map((card) => (
            <OpportunityCardView key={card.id} card={card} />
          ))
        )}
      </div>
    </section>
  );
}

export default function BorrowerOpportunityDiscoveryPage() {
  const [borrowerId, setBorrowerId] = useState(initialInput.borrowerId ?? "");
  const [applicationId, setApplicationId] = useState(
    initialInput.applicationId ?? ""
  );
  const [stateCode, setStateCode] = useState(initialInput.location?.state ?? "");
  const [county, setCounty] = useState(initialInput.location?.county ?? "");
  const [customerTypes, setCustomerTypes] = useState(
    (initialInput.customerTypes ?? []).join(", ")
  );
  const [farmTypes, setFarmTypes] = useState(
    (initialInput.farmTypes ?? []).join(", ")
  );
  const [goals, setGoals] = useState((initialInput.goals ?? []).join(", "));
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const input = useMemo<OpportunityDiscoveryInput>(
    () => ({
      borrowerId,
      applicationId,
      location: {
        country: "US",
        state: stateCode,
        county,
      },
      customerTypes: splitCsv(customerTypes),
      farmTypes: splitCsv(farmTypes),
      goals: splitCsv(goals),
      interests: initialInput.interests,
    }),
    [applicationId, borrowerId, county, customerTypes, farmTypes, goals, stateCode]
  );

  const localResult = useMemo(
    () => evaluateOpportunityDiscovery(input),
    [input]
  );
  const result = apiResponse?.discoveryResult ?? localResult;

  async function submitForReview() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/opportunities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...input,
          userId: borrowerId,
        }),
      });
      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ?? "Opportunity discovery request failed."
        );
      }

      setApiResponse(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unknown opportunity discovery request error."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={shellStyle}>
      <div style={containerStyle}>
        <section
          style={{
            ...panelStyle,
            padding: 22,
            display: "grid",
            gap: 16,
          }}
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
                Borrower Opportunity Discovery
              </span>
              <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.1 }}>
                Opportunity Discovery
              </h1>
              <p style={{ ...mutedText, margin: 0 }}>
                Advisory grants, programs, properties, equipment, market
                context, and revenue opportunities for borrower planning. This
                surface is discovery intelligence only and does not perform a
                live fetch, claim source certainty, guarantee revenue, approve
                a program, certify a property, or authorize legal or regulatory
                reliance.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <StatusBadge tone="blocked" text="Production blocked" />
              <StatusBadge tone="review" text="Human review required" />
              <StatusBadge tone="blocked" text="No live fetch" />
              <StatusBadge tone="blocked" text="No program approval" />
              <StatusBadge tone="blocked" text="No revenue guarantee" />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            <div>
              <FieldLabel>Borrower ID</FieldLabel>
              <input
                style={inputStyle}
                value={borrowerId}
                onChange={(event) => setBorrowerId(event.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Application ID</FieldLabel>
              <input
                style={inputStyle}
                value={applicationId}
                onChange={(event) => setApplicationId(event.target.value)}
                placeholder="Optional"
              />
            </div>
            <div>
              <FieldLabel>State</FieldLabel>
              <input
                style={inputStyle}
                value={stateCode}
                onChange={(event) => setStateCode(event.target.value)}
              />
            </div>
            <div>
              <FieldLabel>County</FieldLabel>
              <input
                style={inputStyle}
                value={county}
                onChange={(event) => setCounty(event.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Customer Types</FieldLabel>
              <input
                style={inputStyle}
                value={customerTypes}
                onChange={(event) => setCustomerTypes(event.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Farm Types</FieldLabel>
              <input
                style={inputStyle}
                value={farmTypes}
                onChange={(event) => setFarmTypes(event.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Goals</FieldLabel>
              <input
                style={inputStyle}
                value={goals}
                onChange={(event) => setGoals(event.target.value)}
              />
            </div>
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
              ? "Submitting for review..."
              : "Discover Opportunities"}
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

        <section style={{ ...panelStyle, padding: 18, display: "grid", gap: 12 }}>
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
              <h2 style={{ margin: 0, fontSize: 22 }}>Discovery Summary</h2>
              <p style={{ ...mutedText, margin: "4px 0 0" }}>
                Translation-layer summaries across {result.sections.length}{" "}
                advisory sections.
              </p>
            </div>
            <StatusBadge
              tone="neutral"
              text={`${result.totalOpportunityCount} items`}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 10,
            }}
          >
            {result.sections.map((section) => (
              <div
                key={section.id}
                style={{
                  border: "1px solid #d7deea",
                  borderRadius: 6,
                  padding: 10,
                  display: "grid",
                  gap: 4,
                  background: "#f8fafc",
                }}
              >
                <strong style={{ fontSize: 14 }}>{section.label}</strong>
                <span style={mutedText}>{section.cards.length} item(s)</span>
              </div>
            ))}
          </div>
        </section>

        <div style={{ display: "grid", gap: 22 }}>
          {result.sections.map((section) => (
            <SectionView key={section.id} section={section} />
          ))}
        </div>

        <section style={{ ...panelStyle, padding: 18, display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Governance Evidence</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: 10,
            }}
          >
            <StatusBadge
              tone={result.productionBlocked ? "blocked" : "ready"}
              text="Production blocked"
            />
            <StatusBadge
              tone={result.humanReviewRequired ? "review" : "ready"}
              text="Human review required"
            />
            <StatusBadge tone="blocked" text="Advisory only" />
            <StatusBadge tone="blocked" text="No live fetch" />
            <StatusBadge tone="blocked" text="No revenue guarantee" />
            <StatusBadge tone="blocked" text="No program approval" />
          </div>
          {apiResponse?.governance ? (
            <p style={{ ...mutedText, margin: 0 }}>
              Trace {apiResponse.governance.traceId ?? "pending"} · version
              runtime{" "}
              {apiResponse.governance.versionRuntime?.ok ? "passed" : "pending"} ·
              classification{" "}
              {apiResponse.governance.outputClassification?.classificationLevel ??
                "pending"}
            </p>
          ) : (
            <p style={{ ...mutedText, margin: 0 }}>
              Local preview is shown until the borrower submits for governed
              API review.
            </p>
          )}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {result.recommendedNextRoutes.map((route) => (
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
            {result.disclosures.slice(0, 16).map((disclosure) => (
              <li key={disclosure}>{disclosure}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
