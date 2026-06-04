"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  EnvironmentalRiskAssessmentV2CrossSourceConflict,
  EnvironmentalRiskAssessmentV2Input,
  EnvironmentalRiskAssessmentV2Result,
  EnvironmentalRiskAssessmentV2Signal,
  composeEnvironmentalRiskAssessmentV2,
} from "@/lib/environmental/riskAssessmentV2Runtime";

type ApiResponse = {
  ok: boolean;
  error?: string;
  v2Result?: EnvironmentalRiskAssessmentV2Result;
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
const selectStyle = {
  width: "100%",
  minHeight: 36,
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  padding: "6px 10px",
  fontSize: 13,
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

function signalToTone(
  status: EnvironmentalRiskAssessmentV2Signal["status"]
): "ready" | "review" | "blocked" | "neutral" {
  switch (status) {
    case "READY_FOR_REVIEW":
      return "ready";
    case "NEEDS_INPUT":
      return "review";
    case "BLOCKED_BY_CONFLICT":
      return "blocked";
    default:
      return "neutral";
  }
}

function SignalCard(props: { signal: EnvironmentalRiskAssessmentV2Signal }) {
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
            declared {signal.declaredValue} · tier {signal.riskTier} ·
            readiness {signal.readinessPercent}% · review route:{" "}
            {signal.reviewRoute}
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
  conflict: EnvironmentalRiskAssessmentV2CrossSourceConflict;
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

export default function EnvironmentalRiskAssessmentV2Page() {
  const [siteContamination, setSiteContamination] = useState("NONE");
  const [waterWetland, setWaterWetland] = useState("NONE");
  const [floodplain, setFloodplain] = useState("NONE");
  const [tribalLand, setTribalLand] = useState("NONE");
  const [historic, setHistoric] = useState("NONE");
  const [habitat, setHabitat] = useState("NONE");
  const [brownfield, setBrownfield] = useState("NONE");
  const [sovereignAllowed, setSovereignAllowed] = useState(false);
  const [serverResult, setServerResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const localInput = useMemo<EnvironmentalRiskAssessmentV2Input>(
    () => ({
      reviewerRole: "Qualified Governance Reviewer",
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
        spokeIsolationConfirmed: true,
        bankerSpokeIsolated: true,
        auditAnchorRef: "audit-anchor://review/eng-001",
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      riskOverlay: {
        siteContaminationHistory: siteContamination as any,
        waterWetlandProximity: waterWetland as any,
        floodplainStatus: floodplain as any,
        tribalLandStatus: tribalLand as any,
        historicDistrictStatus: historic as any,
        endangeredSpeciesHabitatStatus: habitat as any,
        brownfieldStatus: brownfield as any,
      },
    }),
    [
      siteContamination,
      waterWetland,
      floodplain,
      tribalLand,
      historic,
      habitat,
      brownfield,
      sovereignAllowed,
    ]
  );

  const previewResult = useMemo(
    () => composeEnvironmentalRiskAssessmentV2(localInput),
    [localInput]
  );

  const result = serverResult?.v2Result ?? previewResult;

  async function runComposition() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "/api/governance/environmental-risk-assessment-v2",
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

  function Selector(props: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: string[];
  }) {
    return (
      <label style={{ display: "grid", gap: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>{props.label}</span>
        <select
          style={selectStyle}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
        >
          {props.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
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
                Environmental Risk Assessment v2
              </div>
              <div style={{ ...mutedText, marginTop: 4 }}>
                Advisory site-risk overlay composed over Environmental
                Compliance v2 (which composes the full canonical v2 stack).
                Risk signals are constructed from borrower-declared site
                descriptors only — no external risk data fetch (no FEMA flood,
                FWS habitat, EPA brownfield). No environmental clearance,
                NEPA, Phase I/II ESA report, or permit. Environmental
                Engineering Spoke isolation preserved.
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <StatusBadge tone="blocked" label="Production blocked" />
              <StatusBadge tone="review" label="Human review required" />
              <StatusBadge tone="neutral" label="Spoke isolation" />
            </div>
          </div>
        </header>

        <section style={{ ...panelStyle, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
            Reviewer input — site risk overlay
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12,
            }}
          >
            <Selector
              label="Site contamination history"
              value={siteContamination}
              onChange={setSiteContamination}
              options={["NONE", "RECORDED", "PENDING_INVESTIGATION", "UNKNOWN"]}
            />
            <Selector
              label="Water / wetland proximity"
              value={waterWetland}
              onChange={setWaterWetland}
              options={["NONE", "ADJACENT", "ON_SITE", "UNKNOWN"]}
            />
            <Selector
              label="Floodplain status"
              value={floodplain}
              onChange={setFloodplain}
              options={["NONE", "500_YEAR", "100_YEAR", "UNKNOWN"]}
            />
            <Selector
              label="Tribal land status"
              value={tribalLand}
              onChange={setTribalLand}
              options={["NONE", "ADJACENT", "ON_SOVEREIGN_LAND", "UNKNOWN"]}
            />
            <Selector
              label="Historic district status"
              value={historic}
              onChange={setHistoric}
              options={["NONE", "ADJACENT", "WITHIN_DISTRICT", "UNKNOWN"]}
            />
            <Selector
              label="Endangered species habitat"
              value={habitat}
              onChange={setHabitat}
              options={["NONE", "ADJACENT", "ON_SITE", "UNKNOWN"]}
            />
            <Selector
              label="Brownfield status"
              value={brownfield}
              onChange={setBrownfield}
              options={["NONE", "ADJACENT", "ON_SITE", "UNKNOWN"]}
            />
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
              ["v2 signals", result.summary.v2SignalCount],
              ["v2 ready", result.summary.v2ReadyCount],
              ["v2 needs input", result.summary.v2NeedsInputCount],
              ["v2 blocked", result.summary.v2BlockedCount],
              [
                "v2 readiness %",
                `${result.summary.v2OverallReadinessPercent}%`,
              ],
              ["High-risk signals", result.summary.v2HighRiskSignalCount],
              ["Data gap signals", result.summary.v2DataGapSignalCount],
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
            v2 governed risk signals
          </div>
          {result.v2Signals.map((signal) => (
            <SignalCard key={signal.id} signal={signal} />
          ))}
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
