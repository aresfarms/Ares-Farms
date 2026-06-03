"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  OpportunityDiscoveryV2CrossSourceConflict,
  OpportunityDiscoveryV2CustomerProfile,
  OpportunityDiscoveryV2GrantCard,
  OpportunityDiscoveryV2Input,
  OpportunityDiscoveryV2Result,
  composeOpportunityDiscoveryV2,
} from "@/lib/opportunity/discoveryV2Runtime";

type ApiResponse = {
  ok: boolean;
  error?: string;
  v2Result?: OpportunityDiscoveryV2Result;
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

function GrantCardCard(props: { card: OpportunityDiscoveryV2GrantCard }) {
  const { card } = props;
  const tone: "review" | "blocked" =
    card.pathwayStatus === "FEDERATION_GATED" ? "blocked" : "review";

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
            {card.programName}
          </div>
          <div style={{ ...mutedText, fontSize: 12 }}>
            {card.categoryId} · sponsor {card.sponsorAuthority} · federation{" "}
            {card.federationScope}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <StatusBadge tone={tone} label={card.pathwayStatus} />
          <StatusBadge tone="neutral" label={`tier ${card.customerTypeTier}`} />
          <StatusBadge
            tone="neutral"
            label={`fit ${card.capitalFitScore.toFixed(2)}`}
          />
        </div>
      </div>
      {card.fitReasons.length > 0 && (
        <div style={{ fontSize: 12, ...mutedText, marginBottom: 4 }}>
          Fit reasons: {card.fitReasons.join(" · ")}
        </div>
      )}
      {card.conflictSignals.length > 0 && (
        <div
          style={{
            fontSize: 12,
            color: "#7a4d00",
            background: "#fff4d6",
            border: "1px solid #f0d27a",
            borderRadius: 6,
            padding: 8,
            marginTop: 6,
          }}
        >
          Conflict signals: {card.conflictSignals.join(" · ")}
        </div>
      )}
    </div>
  );
}

function ConflictCard(props: {
  conflict: OpportunityDiscoveryV2CrossSourceConflict;
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

function CustomerProfileBlock(props: {
  profile: OpportunityDiscoveryV2CustomerProfile;
}) {
  const { profile } = props;
  return (
    <div style={{ ...panelStyle, padding: 16, marginBottom: 14 }}>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>
          {profile.customerType.label}
        </div>
        <div style={{ ...mutedText, fontSize: 12 }}>
          archetype {profile.customerType.archetype} · federation{" "}
          {profile.customerType.federationScope} · review boundary:{" "}
          {profile.reviewBoundary}
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
          Grants and programs ({profile.grantCards.length})
        </div>
        {profile.grantCards.length === 0 ? (
          <div style={{ ...mutedText, fontSize: 13 }}>
            No composed Capital Graph-backed grant cards under the current
            borrower context.
          </div>
        ) : (
          profile.grantCards.map((card) => (
            <GrantCardCard key={card.cardId} card={card} />
          ))
        )}
      </div>

      {profile.legacyCardCount > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
            Legacy v1 sections (cards: {profile.legacyCardCount})
          </div>
          {profile.legacySections
            .filter((section) => section.cards.length > 0)
            .map((section) => (
              <div
                key={section.id}
                style={{
                  ...panelStyle,
                  padding: 10,
                  marginBottom: 6,
                  background: "#f6f8fb",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  {section.label} ({section.cards.length})
                </div>
                <div style={{ ...mutedText, fontSize: 11 }}>
                  review route: {section.reviewRoute}
                </div>
              </div>
            ))}
        </div>
      )}

      {profile.crossSourceConflicts.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
            Cross-source conflicts ({profile.crossSourceConflicts.length})
          </div>
          {profile.crossSourceConflicts.map((conflict) => (
            <ConflictCard key={conflict.conflictId} conflict={conflict} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OpportunityDiscoveryV2Page() {
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
  const [farmTypes, setFarmTypes] = useState("specialty crops");
  const [goals, setGoals] = useState("operating capital");
  const [acreage, setAcreage] = useState("40");
  const [requestedAmount, setRequestedAmount] = useState("250000");
  const [sovereignAllowed, setSovereignAllowed] = useState(false);
  const [serverResult, setServerResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const localInput = useMemo<OpportunityDiscoveryV2Input>(
    () => ({
      reviewerRole,
      borrowerContext: {
        borrowerId: "borrower-preview",
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
        location: stateValue ? { country: "US", state: stateValue } : null,
        farmTypes: farmTypes
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        goals: goals
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        acreage: acreage ? Number(acreage) : null,
        requestedAmount: requestedAmount ? Number(requestedAmount) : null,
        interests: {
          grants: true,
          properties: true,
          equipment: true,
          marketContext: true,
          revenueOpportunities: true,
          soilAnalysis: true,
          commodityIntelligence: true,
        },
      },
      scope: { sovereignFederationAllowed: sovereignAllowed },
    }),
    [
      reviewerRole,
      declaredCustomerTypes,
      intendedUses,
      stateValue,
      farmTypes,
      goals,
      acreage,
      requestedAmount,
      sovereignAllowed,
    ]
  );

  const previewResult = useMemo(
    () => composeOpportunityDiscoveryV2(localInput),
    [localInput]
  );

  const result = serverResult?.v2Result ?? previewResult;

  async function runComposition() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "/api/governance/opportunity-discovery-v2",
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
                Opportunity Discovery v2
              </div>
              <div style={{ ...mutedText, marginTop: 4 }}>
                Internal governance composition over Financing Pathway Engine
                v2, Revenue Intelligence v2, Customer Type Registry, Capital
                Graph, and the legacy v1 opportunity discovery sections.
                Advisory only — no autonomous opportunity, pathway,
                eligibility, credit, lender, or program decision is produced;
                no live external fetch is performed; no source-certainty
                claim is made.
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
                Requested amount
              </span>
              <input
                style={inputStyle}
                value={requestedAmount}
                onChange={(e) => setRequestedAmount(e.target.value)}
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
              ["Customer profiles", result.summary.customerProfileCount],
              ["Grant cards", result.summary.totalGrantCardCount],
              ["Legacy cards", result.summary.totalLegacyCardCount],
              ["Conflict signals", result.summary.conflictSignalCount],
              [
                "Cross-source conflicts",
                result.summary.crossSourceConflictCount,
              ],
              ["Federation gated", result.summary.federationGatedCount],
              [
                "Missing information",
                result.summary.missingInformationCount,
              ],
              ["Review required", result.summary.reviewRequiredCount],
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
            Customer-type opportunity packs
          </div>
          {result.customerProfiles.length === 0 ? (
            <div style={mutedText}>
              No matched customer types under the current borrower context.
            </div>
          ) : (
            result.customerProfiles.map((profile) => (
              <CustomerProfileBlock
                key={profile.customerType.typeId}
                profile={profile}
              />
            ))
          )}
        </section>

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
