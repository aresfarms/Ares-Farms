"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  CertificationEngineInput,
  CertificationEngineResult,
  CertificationDomainResult,
  CertificationStatus,
  evaluateInternalCertification,
} from "@/lib/certification/engineRuntime";

/**
 * Internal Certification Engine Page
 *
 * Master Volume Governance:
 * - Vol I: presents accountable internal certification posture.
 * - Vol II: blocks posture state from becoming external certification,
 *   public verification, regulatory reliance, lender commitment, credit
 *   decision, environmental clearance, or legal reliance.
 * - Vol III: uses deterministic backend-compatible composition.
 * - Vol III-B: displays human-review and production-block posture.
 * - Vol IV: routes reviewer next steps to evidence engine, evidence
 *   packets, module readiness, audit replay, governance, and reviews.
 * - Vol V-VII: preserves disclosures, source authority, conformance, and
 *   no-live-action boundaries on internal posture output.
 */

type ApiResponse = {
  ok: boolean;
  error?: string;
  postureResult?: CertificationEngineResult;
  governance?: {
    traceId?: string;
    versionRuntime?: { ok?: boolean; replaySafe?: boolean };
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

const mutedText = { color: "#5d687a", lineHeight: 1.5 } as const;

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

function domainStatusTone(
  status: CertificationStatus
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

function statusLabel(status: CertificationStatus): string {
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

function DomainView(props: { domain: CertificationDomainResult }) {
  const domain = props.domain;

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
          <h3 style={{ margin: 0, fontSize: 18 }}>{domain.label}</h3>
          <p style={{ ...mutedText, margin: "2px 0 0" }}>
            Review at {domain.reviewRoute}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <StatusBadge
            tone={domainStatusTone(domain.status)}
            text={statusLabel(domain.status)}
          />
          <StatusBadge tone="neutral" text={`${domain.readinessPercent}%`} />
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 8,
          fontSize: 13,
          color: "#475569",
        }}
      >
        <span>Verified: {domain.verifiedCount}/{domain.totalCount}</span>
        <span>Blocked gates: {domain.blockedGateCount}</span>
        <span>
          Pending authority: {domain.pendingHumanAuthorityCount}
        </span>
        <span>Evidence refs: {domain.evidenceRefs.length}</span>
      </div>
      {domain.reviewSignals.length > 0 ? (
        <ul style={{ margin: 0, paddingLeft: 18, color: "#475569" }}>
          {domain.reviewSignals.slice(0, 4).map((signal) => (
            <li key={signal}>{signal}</li>
          ))}
        </ul>
      ) : null}
      {domain.blockingGates.length > 0 ? (
        <div>
          <strong style={{ fontSize: 13 }}>Blocking gates:</strong>
          <ul style={{ margin: "4px 0 0", paddingLeft: 18, color: "#475569" }}>
            {domain.blockingGates.slice(0, 6).map((gate) => (
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
        {domain.blockedClaims.slice(0, 4).map((claim) => (
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

export default function CertificationEnginePage() {
  const [reviewerRole, setReviewerRole] = useState(
    "Qualified Governance Reviewer"
  );
  const [applicationId, setApplicationId] = useState("");
  const [moduleReadinessPercent, setModuleReadinessPercent] = useState("50");
  const [sourcePosturePercent, setSourcePosturePercent] = useState("30");
  const [connectorPosturePercent, setConnectorPosturePercent] = useState("40");
  const [moduleConformancePercent, setModuleConformancePercent] = useState("100");
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const input = useMemo<CertificationEngineInput>(
    () => ({
      reviewerRole: reviewerRole || null,
      applicationId: applicationId || null,
      domains: {
        module_readiness: {
          readinessPercent: Number(moduleReadinessPercent) || 0,
        },
        source_posture: {
          readinessPercent: Number(sourcePosturePercent) || 0,
        },
        connector_posture: {
          readinessPercent: Number(connectorPosturePercent) || 0,
        },
        module_conformance: {
          readinessPercent: Number(moduleConformancePercent) || 0,
        },
      },
    }),
    [
      applicationId,
      connectorPosturePercent,
      moduleConformancePercent,
      moduleReadinessPercent,
      reviewerRole,
      sourcePosturePercent,
    ]
  );

  const localResult = useMemo(
    () => evaluateInternalCertification(input),
    [input]
  );
  const result = apiResponse?.postureResult ?? localResult;

  async function submitForReview() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/governance/certification-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, userId: reviewerRole }),
      });
      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Certification engine request failed.");
      }

      setApiResponse(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unknown certification engine request error."
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
                Internal Certification Engine
              </span>
              <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.1 }}>
                Certification Posture
              </h1>
              <p style={{ ...mutedText, margin: 0 }}>
                Internal review-bound certification posture across module
                readiness, source posture, connector posture, and module
                conformance. The engine produces internal evidence only — no
                external certification, public verification, regulatory
                reliance, lender commitment, or legal reliance is created.
                External certification claims remain blocked until the public
                verification and reliance gates are approved.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <StatusBadge tone="blocked" text="Production blocked" />
              <StatusBadge tone="review" text="Human review required" />
              <StatusBadge tone="blocked" text="Internal certification only" />
              <StatusBadge tone="blocked" text="No external certification" />
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
              <FieldLabel>Reviewer role</FieldLabel>
              <input
                value={reviewerRole}
                onChange={(event) => setReviewerRole(event.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <FieldLabel>Application ID</FieldLabel>
              <input
                value={applicationId}
                onChange={(event) => setApplicationId(event.target.value)}
                placeholder="Optional"
                style={inputStyle}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <FieldLabel>Module readiness %</FieldLabel>
              <input
                type="number"
                min="0"
                max="100"
                value={moduleReadinessPercent}
                onChange={(event) =>
                  setModuleReadinessPercent(event.target.value)
                }
                style={inputStyle}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <FieldLabel>Source posture %</FieldLabel>
              <input
                type="number"
                min="0"
                max="100"
                value={sourcePosturePercent}
                onChange={(event) => setSourcePosturePercent(event.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <FieldLabel>Connector posture %</FieldLabel>
              <input
                type="number"
                min="0"
                max="100"
                value={connectorPosturePercent}
                onChange={(event) =>
                  setConnectorPosturePercent(event.target.value)
                }
                style={inputStyle}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <FieldLabel>Module conformance %</FieldLabel>
              <input
                type="number"
                min="0"
                max="100"
                value={moduleConformancePercent}
                onChange={(event) =>
                  setModuleConformancePercent(event.target.value)
                }
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
              : "Compose Certification Posture"}
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
              label="Overall readiness"
              value={result.summary.overallReadinessPercent}
            />
            <SummaryCell
              label="Certified domains"
              value={result.summary.certifiedDomainCount}
            />
            <SummaryCell
              label="Pending domains"
              value={result.summary.pendingDomainCount}
            />
            <SummaryCell
              label="Blocked domains"
              value={result.summary.blockedDomainCount}
            />
            <SummaryCell
              label="Pending authority"
              value={result.summary.pendingHumanAuthorityCount}
            />
            <SummaryCell
              label="Blocking gates"
              value={result.summary.blockingGateCount}
            />
          </div>
        </section>

        <section style={{ display: "grid", gap: 12 }}>
          {result.domains.map((domain) => (
            <DomainView key={domain.id} domain={domain} />
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
            <StatusBadge
              tone={result.productionBlocked ? "blocked" : "ready"}
              text="Production blocked"
            />
            <StatusBadge
              tone={result.humanReviewRequired ? "review" : "ready"}
              text="Human review required"
            />
            <StatusBadge tone="blocked" text="Internal certification only" />
            <StatusBadge tone="blocked" text="No external certification" />
            <StatusBadge tone="blocked" text="No public verification" />
            <StatusBadge tone="blocked" text="No regulatory reliance" />
          </div>
          {apiResponse?.governance ? (
            <p style={{ ...mutedText, margin: 0 }}>
              Trace {apiResponse.governance.traceId ?? "pending"} · version
              runtime{" "}
              {apiResponse.governance.versionRuntime?.ok
                ? "passed"
                : "pending"}{" "}
              · classification{" "}
              {apiResponse.governance.outputClassification?.classificationLevel ??
                "pending"}
            </p>
          ) : (
            <p style={{ ...mutedText, margin: 0 }}>
              Local preview is shown until the reviewer submits the posture for
              governed API review.
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
