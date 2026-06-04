"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  EvidenceResolutionClarificationRequest,
  EvidenceResolutionWorkflowCrossSourceConflict,
  EvidenceResolutionWorkflowInput,
  EvidenceResolutionWorkflowResult,
  EvidenceResolutionWorkflowSignal,
  composeEvidenceResolutionWorkflow,
} from "@/lib/evidence-resolution/evidenceResolutionWorkflowRuntime";

type ApiResponse = {
  ok: boolean;
  error?: string;
  result?: EvidenceResolutionWorkflowResult;
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

function StatusBadge(props: {
  tone: "pass" | "fail" | "review" | "neutral";
  label: string;
}) {
  const palette = {
    pass: { bg: "#dbf0e2", fg: "#1f5a32", border: "#a8d8b3" },
    fail: { bg: "#fde4e4", fg: "#80222d", border: "#f4b1b7" },
    review: { bg: "#fff4d6", fg: "#7a4d00", border: "#f0d27a" },
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

function signalToTone(
  status: EvidenceResolutionWorkflowSignal["status"]
): "pass" | "fail" | "review" | "neutral" {
  switch (status) {
    case "READY_FOR_REVIEW":
      return "pass";
    case "NEEDS_INPUT":
      return "review";
    case "BLOCKED_BY_CONFLICT":
      return "fail";
    default:
      return "neutral";
  }
}

function ClarificationCard(props: {
  clarification: EvidenceResolutionClarificationRequest;
}) {
  const { clarification } = props;
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
            {clarification.topic}
          </div>
          <div style={{ ...mutedText, fontSize: 12 }}>
            id {clarification.clarificationId} · category{" "}
            {clarification.category} · source {clarification.sourceModule} ·
            reviewer {clarification.reviewerRole} · path{" "}
            {clarification.resolutionPath} · window{" "}
            {clarification.expectedResolutionWindowDays}d
          </div>
        </div>
        <StatusBadge tone="review" label={clarification.resolution} />
      </div>
      <div
        style={{
          background: "#f6f8fb",
          padding: 10,
          borderRadius: 6,
          marginTop: 8,
          fontSize: 13,
        }}
      >
        <strong>Borrower-facing:</strong>{" "}
        {clarification.borrowerFacingQuestion}
      </div>
      <div style={{ ...mutedText, fontSize: 12, marginTop: 6 }}>
        Reviewer explanation: {clarification.reviewerExplanation}
      </div>
      <div style={{ ...mutedText, fontSize: 11, marginTop: 4 }}>
        Evidence: {clarification.evidenceReplayRef} · false-rejection-risk:{" "}
        {clarification.falseRejectionRiskFlag ? "YES" : "no"} ·
        fraud-accusation-risk:{" "}
        {clarification.fraudAccusationRiskFlag ? "YES" : "no"} ·
        uncertainty-preserved: yes
      </div>
    </div>
  );
}

function SignalCard(props: { signal: EvidenceResolutionWorkflowSignal }) {
  const { signal } = props;
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
          <div style={{ fontWeight: 600, fontSize: 14 }}>{signal.label}</div>
          <div style={{ ...mutedText, fontSize: 12 }}>
            coverage {signal.coverageCount} · readiness{" "}
            {signal.readinessPercent}% · review route: {signal.reviewRoute}
          </div>
        </div>
        <StatusBadge tone={signalToTone(signal.status)} label={signal.status} />
      </div>
      {signal.reviewSignals.length > 0 && (
        <div style={{ ...mutedText, fontSize: 12 }}>
          Review signals: {signal.reviewSignals.join(" · ")}
        </div>
      )}
    </div>
  );
}

function ConflictCard(props: {
  conflict: EvidenceResolutionWorkflowCrossSourceConflict;
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

export default function EvidenceResolutionWorkflowPage() {
  const [reviewerRole, setReviewerRole] = useState(
    "Qualified Governance Reviewer"
  );
  const [spokeIsolation, setSpokeIsolation] = useState(true);
  const [tribalLand, setTribalLand] = useState("NONE");
  const [sovereignAllowed, setSovereignAllowed] = useState(false);
  const [serverResult, setServerResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const localInput = useMemo<EvidenceResolutionWorkflowInput>(
    () => ({
      reviewerRole,
      scope: { sovereignFederationAllowed: sovereignAllowed },
      complianceGate: {
        pathwayType: "REAL_ESTATE",
        realPropertyCollateral: true,
        assessmentType: "PHASE_I_ESA",
        assessmentProviderType: "ENVIRONMENTAL_ENGINEERING_SPOKE",
        providerLicenseRef: "license://review/eng-001",
        providerLicenseVerified: true,
        assessmentOutcome: "CLEARED",
        feeAmount: 2500,
        standardMarketRateAmount: 2800,
        feeDisclosureRef: "fee-disclosure://review/environmental",
        feeDisclosedBeforeInitiation: true,
        borrowerExternalFirmRightPreserved: true,
        noFeeSurchargeOrPreference: true,
        spokeIsolationConfirmed: spokeIsolation,
        bankerSpokeIsolated: spokeIsolation,
        auditAnchorRef: "audit-anchor://review/eng-001",
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      riskOverlay: {
        siteContaminationHistory: "NONE",
        waterWetlandProximity: "NONE",
        floodplainStatus: "NONE",
        tribalLandStatus: tribalLand as any,
        historicDistrictStatus: "NONE",
        endangeredSpeciesHabitatStatus: "NONE",
        brownfieldStatus: "NONE",
      },
    }),
    [reviewerRole, spokeIsolation, tribalLand, sovereignAllowed]
  );

  const previewResult = useMemo(
    () => composeEvidenceResolutionWorkflow(localInput),
    [localInput]
  );

  const result = serverResult?.result ?? previewResult;

  async function runComposition() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "/api/governance/evidence-resolution-workflow",
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
                Evidence Resolution Workflow v1
              </div>
              <div style={{ ...mutedText, marginTop: 4 }}>
                Detects unresolved variances across Readiness Assessment v2,
                Borrower Onboarding Core v2, and Environmental Escalation
                Engine v2; converts them into clarification requests with
                non-accusatory language; preserves cross-source conflicts;
                routes to human review when needed. Uncertainty is not
                denial. NEEDS_INPUT stays NEEDS_INPUT. The workflow never
                accuses fraud, denies, rejects, approves, or claims lender
                commitment, agency decision, public verification,
                regulatory reliance, or legal reliance.
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <StatusBadge tone="fail" label="Production blocked" />
              <StatusBadge tone="review" label="Human review required" />
              <StatusBadge tone="neutral" label="Uncertainty preserved" />
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
                style={{
                  minHeight: 36,
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  padding: "6px 10px",
                  fontSize: 13,
                  background: "#ffffff",
                }}
                value={reviewerRole}
                onChange={(e) => setReviewerRole(e.target.value)}
              />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                Tribal land status
              </span>
              <select
                style={{
                  minHeight: 36,
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  padding: "6px 10px",
                  fontSize: 13,
                  background: "#ffffff",
                }}
                value={tribalLand}
                onChange={(e) => setTribalLand(e.target.value)}
              >
                {["NONE", "ADJACENT", "ON_SOVEREIGN_LAND", "UNKNOWN"].map(
                  (v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  )
                )}
              </select>
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
                checked={spokeIsolation}
                onChange={(e) => setSpokeIsolation(e.target.checked)}
              />
              Spoke isolation confirmed
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
              ["Variances detected", result.summary.varianceCount],
              [
                "Clarification requests",
                result.summary.clarificationRequestCount,
              ],
              [
                "Borrower clarification",
                result.summary.borrowerClarificationCount,
              ],
              [
                "Requires human review",
                result.summary.requiresHumanReviewCount,
              ],
              ["v1 ready", result.summary.v1ReadyCount],
              ["v1 blocked", result.summary.v1BlockedCount],
              [
                "v1 readiness %",
                `${result.summary.v1OverallReadinessPercent}%`,
              ],
              [
                "False-rejection risk",
                result.summary.falseRejectionRiskCount,
              ],
              [
                "Fraud-accusation risk",
                result.summary.fraudAccusationRiskCount,
              ],
              [
                "Cross-source conflicts",
                result.summary.crossSourceConflictCount,
              ],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                style={{ ...panelStyle, padding: 12, background: "#f6f8fb" }}
              >
                <div style={{ fontSize: 12, ...mutedText }}>{label}</div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{value}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ ...panelStyle, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
            Workflow signals
          </div>
          {result.v1Signals.map((signal) => (
            <SignalCard key={signal.id} signal={signal} />
          ))}
        </section>

        <section style={{ ...panelStyle, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
            Clarification requests ({result.clarificationRequests.length})
          </div>
          {result.clarificationRequests.length === 0 ? (
            <div style={{ ...mutedText, fontSize: 13 }}>
              No clarification requests for the current posture.
            </div>
          ) : (
            result.clarificationRequests.map((clarification) => (
              <ClarificationCard
                key={clarification.clarificationId}
                clarification={clarification}
              />
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
