"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  ConnectorCertificationEngineInput,
  ConnectorCertificationResult,
  ConnectorCertificationStatus,
  ConnectorPostureResult,
  evaluateConnectorCertification,
} from "@/lib/connectors/certificationRuntime";

/**
 * Connector Certification Page
 *
 * Master Volume Governance:
 * - Vol I: presents accountable connector certification posture.
 * - Vol II: blocks posture state from becoming live external action,
 *   external promotion, public verification, or regulatory reliance.
 * - Vol III: uses deterministic backend-compatible composition.
 * - Vol III-B: displays human-review and production-block posture.
 * - Vol IV: routes reviewer next steps to the Module 10 Connector
 *   Certification Console, Source Ingestion Gate, Live Scraper
 *   Activation Gate, Registry Framework, Governance Evidence Engine,
 *   Internal Certification Engine, Module 16 Evidence Packet Workspace,
 *   Audit Replay Console, Governance, and Reviews.
 * - Vol V-VII: preserves disclosures, source authority, conformance, and
 *   no-live-action boundaries on internal posture output.
 */

type ApiResponse = {
  ok: boolean;
  error?: string;
  postureResult?: ConnectorCertificationResult;
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

function statusTone(
  status: ConnectorCertificationStatus
): "ready" | "review" | "blocked" | "neutral" {
  if (status === "CERTIFIED_INTERNAL_REVIEW_BOUND") {
    return "ready";
  }

  if (status === "REVIEW_PENDING") {
    return "review";
  }

  if (status === "BLOCKED_BY_GATE") {
    return "blocked";
  }

  return "neutral";
}

function statusLabel(status: ConnectorCertificationStatus): string {
  if (status === "CERTIFIED_INTERNAL_REVIEW_BOUND") {
    return "Certified — internal review bound";
  }

  if (status === "REVIEW_PENDING") {
    return "Review pending";
  }

  if (status === "BLOCKED_BY_GATE") {
    return "Blocked by gate";
  }

  return "Not started";
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

function ConnectorCard(props: { connector: ConnectorPostureResult }) {
  const connector = props.connector;

  return (
    <article
      style={{
        ...panelStyle,
        padding: 16,
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
          <h3 style={{ margin: 0, fontSize: 16 }}>{connector.connectorName}</h3>
          <p style={{ ...mutedText, margin: "2px 0 0", fontSize: 13 }}>
            {connector.connectorId} · Tier {connector.sourceAuthorityTier} ·
            Baseline {connector.baselineCertificationStatus.replace(/_/g, " ")}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <StatusBadge
            tone={statusTone(connector.overallStatus)}
            text={statusLabel(connector.overallStatus)}
          />
          <StatusBadge
            tone="neutral"
            text={`${connector.overallReadinessPercent}%`}
          />
          <StatusBadge tone="blocked" text="Live execution blocked" />
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 8,
        }}
      >
        {connector.dimensions.map((dimension) => (
          <div
            key={dimension.id}
            style={{
              border: "1px solid #d7deea",
              borderRadius: 6,
              padding: 8,
              background: "#f8fafc",
              display: "grid",
              gap: 4,
            }}
          >
            <strong style={{ fontSize: 13 }}>{dimension.label}</strong>
            <span style={{ ...mutedText, fontSize: 12 }}>
              {statusLabel(dimension.status)} · {dimension.readinessPercent}%
            </span>
            {dimension.blockingGates.length > 0 ? (
              <span style={{ ...mutedText, fontSize: 11 }}>
                {dimension.blockingGates.length} blocking gate(s)
              </span>
            ) : null}
          </div>
        ))}
      </div>
      {connector.blockingGates.length > 0 ? (
        <div>
          <strong style={{ fontSize: 13 }}>Blocking gates:</strong>
          <ul style={{ margin: "4px 0 0", paddingLeft: 18, color: "#475569" }}>
            {connector.blockingGates.slice(0, 4).map((gate) => (
              <li key={gate}>{gate}</li>
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
        {connector.blockedClaims.slice(0, 4).map((claim) => (
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

export default function ConnectorCertificationPage() {
  const [reviewerRole, setReviewerRole] = useState(
    "Qualified Source Promotion Authority"
  );
  const [connectorIds, setConnectorIds] = useState("");
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const input = useMemo<ConnectorCertificationEngineInput>(
    () => ({
      reviewerRole: reviewerRole || null,
      scope: connectorIds
        ? {
            connectorIds: connectorIds
              .split(",")
              .map((id) => id.trim())
              .filter(Boolean),
          }
        : null,
    }),
    [connectorIds, reviewerRole]
  );

  const localResult = useMemo(
    () => evaluateConnectorCertification(input),
    [input]
  );
  const result = apiResponse?.postureResult ?? localResult;

  async function submitForReview() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        "/api/governance/connector-certification",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...input, userId: reviewerRole }),
        }
      );
      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ?? "Connector certification request failed."
        );
      }

      setApiResponse(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unknown connector certification request error."
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
                Connector Certification
              </span>
              <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.1 }}>
                Connector Posture
              </h1>
              <p style={{ ...mutedText, margin: 0 }}>
                Internal review-bound connector certification posture across
                review, certification evidence, rollback, monitoring, and
                activation checks. The runtime is internal evidence only — no
                live external connector execution, live fetch, external
                promotion, public verification, regulatory reliance, or legal
                reliance is created. Live external connector execution remains
                blocked until qualified approval through the Source Promotion
                Authority, the Controlled Promotion Board, and the Live
                Scraper Activation Gate.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <StatusBadge tone="blocked" text="Production blocked" />
              <StatusBadge tone="review" text="Human review required" />
              <StatusBadge tone="blocked" text="Internal posture only" />
              <StatusBadge tone="blocked" text="Live execution blocked" />
              <StatusBadge tone="blocked" text="No public verification" />
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
                Connector IDs (csv, optional)
              </span>
              <input
                value={connectorIds}
                onChange={(event) => setConnectorIds(event.target.value)}
                placeholder="county-gis, tax-assessor"
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
              : "Compose Connector Certification"}
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
          <h2 style={{ margin: 0, fontSize: 22 }}>Posture Summary</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
            }}
          >
            <SummaryCell
              label="Connectors in scope"
              value={result.summary.connectorCount}
            />
            <SummaryCell
              label="Certified"
              value={result.summary.certifiedConnectorCount}
            />
            <SummaryCell
              label="Pending"
              value={result.summary.pendingConnectorCount}
            />
            <SummaryCell
              label="Blocked"
              value={result.summary.blockedConnectorCount}
            />
            <SummaryCell
              label="Overall readiness"
              value={result.summary.overallReadinessPercent}
            />
            <SummaryCell
              label="Live execution blocked"
              value={result.summary.liveExecutionBlockedCount}
            />
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: 12,
          }}
        >
          {result.connectors.map((connector) => (
            <ConnectorCard
              key={connector.connectorId}
              connector={connector}
            />
          ))}
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
            <StatusBadge tone="blocked" text="Internal posture only" />
            <StatusBadge tone="blocked" text="Live execution blocked" />
            <StatusBadge tone="blocked" text="No external promotion" />
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
              Local preview is shown until the reviewer submits the connector
              posture for governed API review.
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
            {result.disclosures.slice(0, 12).map((disclosure) => (
              <li key={disclosure}>{disclosure}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
