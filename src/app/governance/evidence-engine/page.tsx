"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  EvidencePackInput,
  EvidencePackResult,
  composeGovernanceEvidencePack,
} from "@/lib/governance/evidenceEngine";

/**
 * Governance Evidence Engine Page
 *
 * Master Volume Governance:
 * - Vol I: presents accountable governance evidence composition.
 * - Vol II: blocks composition state from becoming official certification,
 *   public verification, regulatory reliance, lender commitment, credit
 *   decision, or legal reliance.
 * - Vol III: uses deterministic backend-compatible composition.
 * - Vol III-B: displays human-review and production-block posture.
 * - Vol IV: routes operator next steps to Module 16 Evidence Packet
 *   Workspace, Audit Replay Console, Reviews, Governance, and Module
 *   Readiness Control Tower.
 * - Vol V-VII: preserves disclosures, source authority, conformance, and
 *   no-live-action boundaries on internal evidence composition output.
 */

type ApiResponse = {
  ok: boolean;
  error?: string;
  packResult?: EvidencePackResult;
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

const PACK_INTENTS: NonNullable<EvidencePackInput["packIntent"]>[] = [
  "AUDIT_PREP",
  "REGULATOR_BRIEF",
  "LENDER_REVIEW",
  "BUILD_RECORD",
  "INTERNAL_REVIEW",
  "PROMOTION_REVIEW",
];

export default function GovernanceEvidenceEnginePage() {
  const [packIntent, setPackIntent] = useState<
    NonNullable<EvidencePackInput["packIntent"]>
  >("INTERNAL_REVIEW");
  const [applicationId, setApplicationId] = useState("");
  const [borrowerIdMasked, setBorrowerIdMasked] = useState("");
  const [reviewerRole, setReviewerRole] = useState(
    "Qualified Governance Reviewer"
  );
  const [moduleIds, setModuleIds] = useState("");
  const [eventTypes, setEventTypes] = useState("");
  const [traceRefs, setTraceRefs] = useState("");
  const [replayRefs, setReplayRefs] = useState("");
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const input = useMemo<EvidencePackInput>(
    () => ({
      packIntent,
      applicationId: applicationId || null,
      borrowerIdMasked: borrowerIdMasked || null,
      reviewerRole: reviewerRole || null,
      moduleIds: splitCsv(moduleIds),
      eventTypes: splitCsv(eventTypes),
      traceRefs: splitCsv(traceRefs),
      replayRefs: splitCsv(replayRefs),
    }),
    [
      applicationId,
      borrowerIdMasked,
      eventTypes,
      moduleIds,
      packIntent,
      replayRefs,
      reviewerRole,
      traceRefs,
    ]
  );

  const localResult = useMemo(
    () => composeGovernanceEvidencePack(input),
    [input]
  );
  const result = apiResponse?.packResult ?? localResult;

  async function submitForReview() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/governance/evidence-engine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...input,
          userId: reviewerRole,
        }),
      });
      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ?? "Governance evidence pack request failed."
        );
      }

      setApiResponse(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unknown governance evidence pack request error."
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
                Governance Evidence Engine
              </span>
              <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.1 }}>
                Evidence Pack Composition
              </h1>
              <p style={{ ...mutedText, margin: 0 }}>
                Compose review-bound governance evidence packs from module
                manifests, event contracts, handoff trails, audit anchors,
                replay verification refs, and human authority mapping.
                Composition is evidence-only — no approval, certification,
                public verification, regulatory reliance, lender commitment,
                or legal reliance is created.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <StatusBadge tone="blocked" text="Production blocked" />
              <StatusBadge tone="review" text="Human review required" />
              <StatusBadge tone="blocked" text="Evidence only" />
              <StatusBadge tone="blocked" text="No certification" />
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
              <FieldLabel>Pack intent</FieldLabel>
              <select
                value={packIntent}
                onChange={(event) =>
                  setPackIntent(
                    event.target
                      .value as NonNullable<EvidencePackInput["packIntent"]>
                  )
                }
                style={inputStyle}
              >
                {PACK_INTENTS.map((intent) => (
                  <option key={intent} value={intent}>
                    {intent.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
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
              <FieldLabel>Borrower ID (masked)</FieldLabel>
              <input
                value={borrowerIdMasked}
                onChange={(event) => setBorrowerIdMasked(event.target.value)}
                placeholder="borrower-abcd***-9"
                style={inputStyle}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <FieldLabel>Reviewer role</FieldLabel>
              <input
                value={reviewerRole}
                onChange={(event) => setReviewerRole(event.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <FieldLabel>Module IDs (csv, overrides intent default)</FieldLabel>
              <input
                value={moduleIds}
                onChange={(event) => setModuleIds(event.target.value)}
                placeholder="governance, evidence-packets"
                style={inputStyle}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <FieldLabel>Event types (csv)</FieldLabel>
              <input
                value={eventTypes}
                onChange={(event) => setEventTypes(event.target.value)}
                placeholder="borrower.readiness.assessed"
                style={inputStyle}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <FieldLabel>Trace refs (csv)</FieldLabel>
              <input
                value={traceRefs}
                onChange={(event) => setTraceRefs(event.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <FieldLabel>Replay refs (csv)</FieldLabel>
              <input
                value={replayRefs}
                onChange={(event) => setReplayRefs(event.target.value)}
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
            {submitting ? "Composing for review..." : "Compose Evidence Pack"}
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
          <h2 style={{ margin: 0, fontSize: 22 }}>Pack Summary</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
            }}
          >
            <SummaryCell label="Modules" value={result.summary.moduleCount} />
            <SummaryCell
              label="Event contracts"
              value={result.summary.eventContractCount}
            />
            <SummaryCell label="Handoffs" value={result.summary.handoffCount} />
            <SummaryCell
              label="Human authority items"
              value={result.summary.humanAuthorityCount}
            />
            <SummaryCell
              label="Audit anchors"
              value={result.summary.auditAnchorCount}
            />
            <SummaryCell
              label="Production-blocked modules"
              value={result.summary.productionBlockedModuleCount}
            />
            <SummaryCell
              label="Replay-required modules"
              value={result.summary.replayRequiredModuleCount}
            />
            <SummaryCell
              label="Public-surface modules"
              value={result.summary.publicSurfaceModuleCount}
            />
          </div>
        </section>

        <section style={{ ...panelStyle, padding: 18, display: "grid", gap: 14 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Modules in scope</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 10,
            }}
          >
            {result.modules.length === 0 ? (
              <p style={{ ...mutedText, margin: 0 }}>
                No modules in scope for the current pack input.
              </p>
            ) : (
              result.modules.slice(0, 24).map((module) => (
                <article
                  key={module.moduleId}
                  style={{
                    border: "1px solid #d7deea",
                    borderRadius: 6,
                    padding: 12,
                    display: "grid",
                    gap: 6,
                    background: "#f8fafc",
                  }}
                >
                  <strong style={{ fontSize: 15 }}>
                    {module.title}
                    {module.moduleNumber
                      ? ` (Module ${module.moduleNumber})`
                      : ""}
                  </strong>
                  <p style={{ ...mutedText, margin: 0, fontSize: 13 }}>
                    {module.route} · {module.claimsProfile}
                  </p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {module.productionBlocked ? (
                      <StatusBadge tone="blocked" text="Production blocked" />
                    ) : null}
                    {module.replayRequired ? (
                      <StatusBadge tone="review" text="Replay required" />
                    ) : null}
                    {module.publicSurfaceAllowed ? (
                      <StatusBadge tone="neutral" text="Public surface" />
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section style={{ ...panelStyle, padding: 18, display: "grid", gap: 14 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Human authority mapping</h2>
          <p style={{ ...mutedText, margin: 0, maxWidth: 760 }}>
            Each gate in scope names the qualified human authority required
            for promotion. The engine does not grant authority.
          </p>
          {result.humanAuthorityMapping.length === 0 ? (
            <p style={{ ...mutedText, margin: 0 }}>
              No human-authority gates in scope for the current pack input.
            </p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18, color: "#334155" }}>
              {result.humanAuthorityMapping.slice(0, 12).map((authority) => (
                <li key={authority.moduleId} style={{ marginBottom: 8 }}>
                  <strong>
                    {authority.title}
                    {authority.moduleNumber
                      ? ` (Module ${authority.moduleNumber})`
                      : ""}
                  </strong>{" "}
                  <span style={mutedText}>
                    requires {authority.requiredAuthority}. Approval boundary:{" "}
                    {authority.approvalBoundary} Current posture:{" "}
                    {authority.currentPosture}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

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
            <StatusBadge tone="blocked" text="Evidence only" />
            <StatusBadge tone="blocked" text="No public verification" />
            <StatusBadge tone="blocked" text="No regulatory reliance" />
            <StatusBadge tone="blocked" text="No legal reliance" />
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
              Local preview is shown until the operator submits the pack for
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
