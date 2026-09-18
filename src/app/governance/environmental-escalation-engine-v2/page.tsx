"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  EnvironmentalEscalationEngineV2Input,
  EnvironmentalEscalationEngineV2Result,
  EnvironmentalEscalationQueueEntry,
  composeEnvironmentalEscalationEngineV2,
} from "@/lib/environmental/escalationEngineV2Runtime";
import { readJsonResponse } from "@/lib/http/readJsonResponse";

type ApiResponse = {
  ok: boolean;
  error?: string;
  v2Result?: EnvironmentalEscalationEngineV2Result;
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
  tone: "pass" | "fail" | "neutral" | "review" | "urgent";
  label: string;
}) {
  const palette = {
    pass: { bg: "#dbf0e2", fg: "#1f5a32", border: "#a8d8b3" },
    fail: { bg: "#fde4e4", fg: "#80222d", border: "#f4b1b7" },
    review: { bg: "#fff4d6", fg: "#7a4d00", border: "#f0d27a" },
    neutral: { bg: "#e3e8ef", fg: "#3b475a", border: "#bcc7d6" },
    urgent: { bg: "#fde4e4", fg: "#80222d", border: "#c14757" },
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

function tierToTone(
  tier: EnvironmentalEscalationQueueEntry["tier"]
): "pass" | "fail" | "neutral" | "review" | "urgent" {
  switch (tier) {
    case "ROUTINE":
      return "neutral";
    case "ACCELERATED":
      return "review";
    case "URGENT":
      return "urgent";
    case "SOVEREIGN_REVIEW":
      return "fail";
    case "NO_ESCALATION":
      return "pass";
  }
}

function EscalationCard(props: { entry: EnvironmentalEscalationQueueEntry }) {
  const { entry } = props;
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
          <div style={{ fontWeight: 600, fontSize: 14 }}>{entry.topic}</div>
          <div style={{ ...mutedText, fontSize: 12 }}>
            source {entry.sourceModule} · identifier {entry.sourceIdentifier}{" "}
            · reviewer {entry.reviewerRole} · window{" "}
            {entry.expectedResolutionWindowDays}d · evidence{" "}
            {entry.evidenceReplayRef}
          </div>
        </div>
        <StatusBadge tone={tierToTone(entry.tier)} label={entry.tier} />
      </div>
      <div style={{ ...mutedText, fontSize: 12 }}>{entry.description}</div>
    </div>
  );
}

export default function EnvironmentalEscalationEngineV2Page() {
  const [pathwayType, setPathwayType] = useState("REAL_ESTATE");
  const [spokeIsolation, setSpokeIsolation] = useState(true);
  const [tribalLand, setTribalLand] = useState("NONE");
  const [floodplain, setFloodplain] = useState("NONE");
  const [sovereignAllowed, setSovereignAllowed] = useState(false);
  const [serverResult, setServerResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const localInput = useMemo<EnvironmentalEscalationEngineV2Input>(
    () => ({
      reviewerRole: "Qualified Governance Reviewer",
      scope: { sovereignFederationAllowed: sovereignAllowed },
      complianceGate: {
        pathwayType,
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

      riskOverlay: {
        siteContaminationHistory: "NONE",
        waterWetlandProximity: "NONE",
        floodplainStatus: floodplain as any,
        tribalLandStatus: tribalLand as any,
        historicDistrictStatus: "NONE",
        endangeredSpeciesHabitatStatus: "NONE",
        brownfieldStatus: "NONE",
      },
    }),
    [pathwayType, spokeIsolation, tribalLand, floodplain, sovereignAllowed]
  );

  const previewResult = useMemo(
    () => composeEnvironmentalEscalationEngineV2(localInput),
    [localInput]
  );

  const result = serverResult?.v2Result ?? previewResult;

  async function runComposition() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "/api/governance/environmental-escalation-engine-v2",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(localInput),
        }
      );
      const data = await readJsonResponse<ApiResponse>(response);
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
                Environmental Escalation Engine v2
              </div>
              <div style={{ ...mutedText, marginTop: 4 }}>
                Advisory escalation routing composed over Environmental Risk
                Assessment v2 (which composes Environmental Compliance v2 +
                the full canonical v2 stack). Maps gate failures, risk
                findings, and cross-source conflicts to a canonical escalation
                queue with reviewer routing, evidence pack reference, and
                expected resolution timeline. No external escalation
                notification, ticket creation, queue submission, paging, or
                autonomous resolution. Environmental Engineering Spoke
                isolation preserved.
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <StatusBadge tone="fail" label="Production blocked" />
              <StatusBadge tone="review" label="Human review required" />
              <StatusBadge tone="neutral" label="Spoke isolation" />
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
                Pathway type
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
                value={pathwayType}
                onChange={(e) => setPathwayType(e.target.value)}
              />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                Floodplain status
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
                value={floodplain}
                onChange={(e) => setFloodplain(e.target.value)}
              >
                {["NONE", "500_YEAR", "100_YEAR", "UNKNOWN"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                Tribal land
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
              ["Queue size", result.summary.queueSize],
              ["Routine", result.summary.routineCount],
              ["Accelerated", result.summary.acceleratedCount],
              ["Urgent", result.summary.urgentCount],
              ["Sovereign review", result.summary.sovereignReviewCount],
              ["v2 ready", result.summary.v2ReadyCount],
              ["v2 blocked", result.summary.v2BlockedCount],
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
            Escalation queue ({result.escalationQueue.length})
          </div>
          {result.escalationQueue.length === 0 ? (
            <div style={{ ...mutedText, fontSize: 13 }}>
              No escalation entries for the current posture.
            </div>
          ) : (
            result.escalationQueue.map((entry) => (
              <EscalationCard key={entry.escalationId} entry={entry} />
            ))
          )}
        </section>

        {result.crossSourceConflicts.length > 0 && (
          <section style={{ ...panelStyle, padding: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
              Cross-source conflicts ({result.crossSourceConflicts.length})
            </div>
            {result.crossSourceConflicts.map((conflict) => (
              <div
                key={conflict.conflictId}
                style={{
                  ...panelStyle,
                  padding: 12,
                  marginBottom: 8,
                  borderLeft: "4px solid #c14757",
                  background: "#fde4e4",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  {conflict.topic}
                </div>
                <div style={{ ...mutedText, fontSize: 12 }}>
                  {conflict.description}
                </div>
              </div>
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
