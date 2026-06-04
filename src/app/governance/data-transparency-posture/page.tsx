"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  DataTransparencyCrossSourceConflict,
  DataTransparencyFinding,
  DataTransparencyPostureInput,
  DataTransparencyPostureResult,
  DataTransparencyPostureSignal,
  composeDataTransparencyPosture,
} from "@/lib/transparency/dataTransparencyPostureRuntime";

type ApiResponse = {
  ok: boolean;
  error?: string;
  result?: DataTransparencyPostureResult;
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
  status: DataTransparencyPostureSignal["status"]
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

function SignalCard(props: { signal: DataTransparencyPostureSignal }) {
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

function FindingRow(props: { finding: DataTransparencyFinding }) {
  const { finding } = props;
  return (
    <div style={{ ...panelStyle, padding: 12, marginBottom: 6 }}>
      <div style={{ fontWeight: 600, fontSize: 13 }}>{finding.topic}</div>
      <div style={{ ...mutedText, fontSize: 11 }}>
        category {finding.category} · doctrine section{" "}
        {finding.doctrineSectionRef} · evidence {finding.evidenceReplayRef}
      </div>
    </div>
  );
}

function ConflictCard(props: {
  conflict: DataTransparencyCrossSourceConflict;
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

export default function DataTransparencyPosturePage() {
  const [reviewerRole, setReviewerRole] = useState(
    "Qualified Governance Reviewer"
  );
  const [scopeModuleIds, setScopeModuleIds] = useState("");
  const [serverResult, setServerResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const localInput = useMemo<DataTransparencyPostureInput>(
    () => ({
      reviewerRole,
      scopeModuleIds: scopeModuleIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    }),
    [reviewerRole, scopeModuleIds]
  );

  const previewResult = useMemo(
    () => composeDataTransparencyPosture(localInput),
    [localInput]
  );

  const result = serverResult?.result ?? previewResult;

  async function runComposition() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "/api/governance/data-transparency-posture",
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
                Data Transparency Posture v1
              </div>
              <div style={{ ...mutedText, marginTop: 4 }}>
                Audits the shipped v2 backbone against the Furlong Data
                Transparency & User Sovereignty Doctrine v1.0
                ({result.doctrineDocRef}). Your information belongs to you.
                Furlong processes information to provide advisory guidance —
                readiness, recommendations, opportunity discovery, document
                organization, environmental review — but ownership remains
                with you.
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <StatusBadge tone="fail" label="Production blocked" />
              <StatusBadge tone="review" label="Human review required" />
              <StatusBadge tone="neutral" label="User sovereignty preserved" />
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
              gridTemplateColumns: "1fr 2fr",
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
                Scope module ids (comma-separated, blank = all)
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
                value={scopeModuleIds}
                onChange={(e) => setScopeModuleIds(e.target.value)}
                placeholder="(blank to audit all modules)"
              />
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
              {loading ? "Auditing…" : "POST to governed API"}
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
              ["Modules audited", result.summary.modulesAudited],
              [
                "Borrower-touching",
                result.summary.borrowerTouchingModulesAudited,
              ],
              [
                "With missing topics",
                result.summary.modulesWithMissingTopics,
              ],
              [
                "Failing readability",
                result.summary.modulesFailingReadability,
              ],
              [
                "Event contracts audited",
                result.summary.eventContractsAudited,
              ],
              [
                "Silent submission risk (events)",
                result.summary.eventContractsWithSilentSubmissionRisk,
              ],
              ["Handoffs audited", result.summary.handoffsAudited],
              [
                "Silent submission risk (handoffs)",
                result.summary.handoffsWithSilentSubmissionRisk,
              ],
              [
                "Escalation stages",
                `${result.summary.escalationStagesAudited - result.summary.escalationStagesMissing}/${result.summary.escalationStagesAudited}`,
              ],
              ["Findings", result.summary.findingCount],
              [
                "Cross-source conflicts",
                result.summary.crossSourceConflictCount,
              ],
              [
                "v1 readiness %",
                `${result.summary.v1OverallReadinessPercent}%`,
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
            Governed signals
          </div>
          {result.v1Signals.map((signal) => (
            <SignalCard key={signal.id} signal={signal} />
          ))}
        </section>

        <section style={{ ...panelStyle, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
            User packet — your sovereignty over your information
          </div>
          <div style={{ ...mutedText, fontSize: 13, marginBottom: 12 }}>
            {result.userPacket.userVisibleSummary}
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                Furlong will
              </div>
              <ul style={{ marginLeft: 16, ...mutedText, fontSize: 12 }}>
                {result.userPacket.whatWillFurlongDo.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                Furlong will NOT
              </div>
              <ul style={{ marginLeft: 16, ...mutedText, fontSize: 12 }}>
                {result.userPacket.whatWillFurlongNotDo.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 13,
              marginTop: 14,
              marginBottom: 6,
            }}
          >
            Escalation stages (each requires explicit user action)
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
            }}
          >
            {result.userPacket.escalationStages.map((stage) => (
              <div
                key={stage.stageId}
                style={{ ...panelStyle, padding: 10, background: "#f6f8fb" }}
              >
                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  {stage.label}
                </div>
                <div style={{ ...mutedText, fontSize: 11 }}>
                  representing modules:{" "}
                  {stage.representingModuleIds.join(", ") || "(none)"}
                </div>
                <div style={{ fontSize: 11, marginTop: 4 }}>
                  user action required: yes
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 13,
              marginTop: 14,
              marginBottom: 6,
            }}
          >
            Your rights
          </div>
          <ul style={{ marginLeft: 16, ...mutedText, fontSize: 12 }}>
            {result.userPacket.userRights.map((right) => (
              <li key={right}>{right.replace(/_/g, " ").toLowerCase()}</li>
            ))}
          </ul>
          <div
            style={{
              marginTop: 10,
              fontSize: 11,
              fontStyle: "italic",
              ...mutedText,
            }}
          >
            {result.userPacket.advisoryDisclaimer}
          </div>
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
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
            Findings ({result.findings.length})
          </div>
          {result.findings.length === 0 ? (
            <div style={{ ...mutedText, fontSize: 13 }}>
              No findings — every audited module meets the doctrine.
            </div>
          ) : (
            <>
              <div style={{ ...mutedText, fontSize: 12, marginBottom: 8 }}>
                Showing first 50 of {result.findings.length} findings. Use the
                governed API to retrieve the full list.
              </div>
              {result.findings.slice(0, 50).map((finding) => (
                <FindingRow key={finding.findingId} finding={finding} />
              ))}
            </>
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
