"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  ConnectorCertificationV2CrossSourceConflict,
  ConnectorCertificationV2Dimension,
  ConnectorCertificationV2Input,
  ConnectorCertificationV2Result,
  composeConnectorCertificationV2,
} from "@/lib/connectors/certificationV2Runtime";

type ApiResponse = {
  ok: boolean;
  error?: string;
  v2Result?: ConnectorCertificationV2Result;
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

function statusToTone(
  status: ConnectorCertificationV2Dimension["status"]
): "ready" | "review" | "blocked" | "neutral" {
  switch (status) {
    case "CERTIFIED_INTERNAL_REVIEW_BOUND":
      return "ready";
    case "REVIEW_PENDING":
      return "review";
    case "BLOCKED_BY_GATE":
      return "blocked";
    default:
      return "neutral";
  }
}

function DimensionCard(props: {
  dimension: ConnectorCertificationV2Dimension;
}) {
  const { dimension } = props;
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
          <div style={{ fontWeight: 600, fontSize: 14 }}>{dimension.label}</div>
          <div style={{ ...mutedText, fontSize: 12 }}>
            coverage {dimension.coverageCount} · readiness{" "}
            {dimension.readinessPercent}% · review route:{" "}
            {dimension.reviewRoute}
          </div>
        </div>
        <StatusBadge
          tone={statusToTone(dimension.status)}
          label={dimension.status}
        />
      </div>
      {dimension.blockingGates.length > 0 && (
        <div style={{ ...mutedText, fontSize: 12, marginBottom: 4 }}>
          Blocking gates: {dimension.blockingGates.join(" · ")}
        </div>
      )}
      {dimension.reviewSignals.length > 0 && (
        <div style={{ ...mutedText, fontSize: 12 }}>
          Review signals: {dimension.reviewSignals.join(" · ")}
        </div>
      )}
    </div>
  );
}

function ConflictCard(props: {
  conflict: ConnectorCertificationV2CrossSourceConflict;
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

const defaultConnectorsJson = JSON.stringify(
  [
    {
      connectorId: "conn-001",
      connectorName: "Sample governance connector",
      sourceAuthorityTier: "authority-tier-1",
      liveExecutionRequested: false,
      dimensions: {
        review: {
          status: "REVIEW_PENDING",
          readinessPercent: 75,
          checkpointsComplete: 3,
          totalCheckpoints: 4,
        },
        certification_evidence: {
          status: "CERTIFIED_INTERNAL_REVIEW_BOUND",
          readinessPercent: 90,
          checkpointsComplete: 9,
          totalCheckpoints: 10,
        },
      },
    },
  ],
  null,
  2
);

export default function ConnectorCertificationV2Page() {
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
  const [connectorsText, setConnectorsText] = useState(defaultConnectorsJson);
  const [parseError, setParseError] = useState<string | null>(null);
  const [serverResult, setServerResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const localInput = useMemo<ConnectorCertificationV2Input>(() => {
    let legacy: ConnectorCertificationV2Input["legacy"] = [];
    try {
      legacy = JSON.parse(connectorsText);
      setParseError(null);
    } catch (e) {
      setParseError(
        e instanceof Error ? e.message : "Unable to parse connectors JSON."
      );
    }
    return {
      reviewerRole,
      borrowerContext: {
        declaredCustomerTypes: declaredCustomerTypes
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        intendedUses: intendedUses
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        jurisdiction: stateValue ? { federal: true, state: stateValue } : null,
      },
      scope: { sovereignFederationAllowed: sovereignAllowed },
      legacy,
    };
  }, [
    reviewerRole,
    declaredCustomerTypes,
    intendedUses,
    stateValue,
    sovereignAllowed,
    connectorsText,
  ]);

  const previewResult = useMemo(
    () => composeConnectorCertificationV2(localInput),
    [localInput]
  );

  const result = serverResult?.v2Result ?? previewResult;

  async function runComposition() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "/api/governance/connector-certification-v2",
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
                Connector Certification v2
              </div>
              <div style={{ ...mutedText, marginTop: 4 }}>
                Internal connector-certification composition over Registry
                Framework v2 (and the full canonical v2 stack) plus the
                legacy v1 connector certification engine. Internal evidence
                only — live external connector execution remains blocked
                until qualified approval through the Source Promotion
                Authority, Controlled Promotion Board, and Live Scraper
                Activation Gate.
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <StatusBadge tone="blocked" label="Production blocked" />
              <StatusBadge tone="review" label="Human review required" />
              <StatusBadge tone="blocked" label="Live execution blocked" />
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
          <div style={{ marginTop: 12 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                display: "block",
                marginBottom: 4,
              }}
            >
              Connectors JSON
            </span>
            <textarea
              style={{
                ...inputStyle,
                fontFamily:
                  'ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace',
                fontSize: 12,
                minHeight: 200,
              }}
              value={connectorsText}
              onChange={(e) => setConnectorsText(e.target.value)}
            />
            {parseError && (
              <div style={{ color: "#80222d", fontSize: 12, marginTop: 4 }}>
                Parse error: {parseError}
              </div>
            )}
          </div>
          <div style={{ marginTop: 14 }}>
            <button
              onClick={runComposition}
              disabled={loading || !!parseError}
              style={{
                padding: "10px 16px",
                background: "#1f4dd8",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: loading || parseError ? "default" : "pointer",
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
              ["v2 dimensions", result.summary.v2DimensionCount],
              ["v2 certified", result.summary.v2CertifiedCount],
              ["v2 blocked", result.summary.v2BlockedCount],
              [
                "v2 readiness %",
                `${result.summary.v2OverallReadinessPercent}%`,
              ],
              ["v1 connectors", result.summary.v1ConnectorCount],
              ["v1 certified", result.summary.v1CertifiedConnectorCount],
              [
                "v1 live exec blocked",
                result.summary.v1LiveExecutionBlockedCount,
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
            v2 governed alignment dimensions
          </div>
          {result.v2Dimensions.map((dimension) => (
            <DimensionCard key={dimension.id} dimension={dimension} />
          ))}
        </section>

        <section style={{ ...panelStyle, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
            Legacy v1 connector postures ({result.legacyConnectors.length})
          </div>
          {result.legacyConnectors.length === 0 ? (
            <div style={mutedText}>No connectors provided.</div>
          ) : (
            result.legacyConnectors.map((connector) => (
              <div
                key={connector.connectorId}
                style={{
                  ...panelStyle,
                  padding: 12,
                  marginBottom: 8,
                  background: "#f6f8fb",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  {connector.connectorName}
                </div>
                <div style={{ ...mutedText, fontSize: 11 }}>
                  id {connector.connectorId} · tier{" "}
                  {connector.sourceAuthorityTier} · overall{" "}
                  {connector.overallStatus} · readiness{" "}
                  {connector.overallReadinessPercent}% · live exec{" "}
                  {connector.liveExecutionPosture}
                </div>
              </div>
            ))
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
