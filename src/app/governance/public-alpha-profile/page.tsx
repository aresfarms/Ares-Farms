"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type {
  PublicAlphaProfileInput,
  PublicAlphaProfileResult,
} from "@/lib/public-alpha/publicAlphaProfileRuntime";

type ApiResponse = {
  ok: boolean;
  error?: string;
  result?: PublicAlphaProfileResult;
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
  tone: "pass" | "fail" | "warn" | "na" | "blocked";
  label: string;
}) {
  const palette = {
    pass: { bg: "#dbf0e2", fg: "#1f5a32", border: "#a8d8b3" },
    fail: { bg: "#fde4e4", fg: "#80222d", border: "#f4b1b7" },
    warn: { bg: "#fff4d6", fg: "#7a4d00", border: "#f0d27a" },
    na: { bg: "#e3e8ef", fg: "#3b475a", border: "#bcc7d6" },
    blocked: { bg: "#dfeaf9", fg: "#1e3e6a", border: "#9cb6dd" },
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

function statusToTone(status: string): "pass" | "fail" | "warn" | "na" | "blocked" {
  switch (status) {
    case "PASS":
      return "pass";
    case "FAIL":
      return "fail";
    case "PENDING_SIGNOFF":
      return "warn";
    case "BLOCKED_BY_DESIGN":
      return "blocked";
    default:
      return "na";
  }
}

export default function PublicAlphaProfilePage() {
  const [reviewerRole, setReviewerRole] = useState(
    "Qualified Governance Reviewer"
  );
  const [serverResult, setServerResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const localInput = useMemo<PublicAlphaProfileInput>(
    () => ({ reviewerRole }),
    [reviewerRole]
  );

  // Empty placeholder until POST returns.
  const emptyResult = useMemo<PublicAlphaProfileResult>(() => {
    return {
      runtimeVersion: "public-alpha-profile-runtime-v0.1.0",
      definitionVersion: "public-alpha-definition-v1.0",
      definitionDocRef: "docs/DOCTRINE_PUBLIC_ALPHA_DEFINITION_V1.md",
      generatedAt: new Date(0).toISOString(),
      reviewerRole,
      applicationId: null,
      buildSelfReportRuntimeVersion: "build-self-report-runtime-v0.1.0",
      buildSelfReportExitCode: 0,
      buildSelfReportSummaryHandle: {
        v1SignalCount: 0,
        v1ReadyCount: 0,
        v1NeedsInputCount: 0,
        v1BlockedCount: 0,
        v1NotStartedCount: 0,
        v1OverallReadinessPercent: 0,
        modulesAudited: 0,
        modulesPass: 0,
        modulesPassWithWarnings: 0,
        modulesFail: 0,
        modulesBlockedByDesign: 0,
        orphansNoConsumer: 0,
        orphansNoProducer: 0,
        orphansDangling: 0,
        danglingEventContracts: 0,
        findingCount: 0,
        crossSourceConflictCount: 0,
      },
      onCapabilityCoverage: [],
      offCapabilityCoverage: [],
      entryCriteriaEvaluation: [],
      exitCriteriaEvaluation: [],
      openDecisionsEvaluation: [],
      alphaEntryAllowed: "PENDING_SIGNOFF",
      summary: {
        v1SignalCount: 0,
        v1ReadyCount: 0,
        v1NeedsInputCount: 0,
        v1BlockedCount: 0,
        v1NotStartedCount: 0,
        v1OverallReadinessPercent: 0,
        onCapabilityCount: 0,
        onCapabilitiesPass: 0,
        onCapabilitiesFail: 0,
        offCapabilityCount: 0,
        offCapabilitiesPassOrBlockedByDesign: 0,
        offCapabilitiesUnenforced: 0,
        entryCriterionCount: 0,
        entryCriteriaPass: 0,
        entryCriteriaFail: 0,
        entryCriteriaPendingSignoff: 0,
        exitCriterionCount: 0,
        openDecisionCount: 0,
        openDecisionsRecorded: 0,
        openDecisionsPendingSignoff: 0,
        findingCount: 0,
        crossSourceConflictCount: 0,
      },
      v1Signals: [],
      findings: [],
      crossSourceConflicts: [],
      recommendedReviewRoutes: [
        "/governance/public-alpha-profile",
        "/governance/build-self-report",
        "/governance/data-transparency-posture",
      ],
      disclosures: ["POST to /api/governance/public-alpha-profile to run the audit."],
      productionRestrictions: [],
      blockedClaims: [],
      productionBlocked: true,
      humanReviewRequired: true,
      advisoryOnly: true,
      publicAlphaProfileInternalOnly: true,
      noAlphaEntryAuthorization: true,
      noInformationSale: true,
      noSilentSubmission: true,
      noSecretDistribution: true,
      noMarketingLead: true,
      noFraudAccusation: true,
      noDenial: true,
      noRejection: true,
      noApproval: true,
      noPreapproval: true,
      noLenderCommitment: true,
      noLegalReliance: true,
      noPublicVerification: true,
      noRegulatoryReliance: true,
      noLiveExternalAction: true,
      noSourceCertainty: true,
      noNoticeSend: true,
      replaySafe: true,
      auditSafe: true,
      federationScoped: true,
      conflictPreserving: true,
    } as unknown as PublicAlphaProfileResult;
  }, [reviewerRole]);

  const result = serverResult?.result ?? emptyResult;

  async function runComposition() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/governance/public-alpha-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localInput),
      });
      const data: ApiResponse = await response.json();
      setServerResult(data);
      if (!data.ok) setError(data.error ?? "Unknown error from API");
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
                Public Alpha Profile v1
              </div>
              <div style={{ ...mutedText, marginTop: 4 }}>
                Codifies the Furlong Public Alpha Definition v1.0
                ({result.definitionDocRef}). Audits §3 ON capabilities,
                §4 OFF capability blocks, §6 entry criteria, §7 exit
                criteria, and surfaces §9 open decisions as
                PENDING_SIGNOFF. Doctrine status PROPOSED — this runtime
                does NOT authorize Alpha entry; the named governance
                authority records that decision externally.
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <StatusBadge tone="fail" label="Production blocked" />
              <StatusBadge tone="warn" label="Human review required" />
              <StatusBadge
                tone={statusToTone(result.alphaEntryAllowed)}
                label={`alpha_entry_allowed: ${result.alphaEntryAllowed}`}
              />
            </div>
          </div>
        </header>

        <section style={{ ...panelStyle, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
            Reviewer input
          </div>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Reviewer role</span>
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
              fontSize: 12,
            }}
          >
            {[
              ["alpha_entry_allowed", result.alphaEntryAllowed],
              [
                "build self-report exit_code",
                result.buildSelfReportExitCode,
              ],
              [
                "§3 ON capabilities (PASS/FAIL)",
                `${result.summary.onCapabilitiesPass} / ${result.summary.onCapabilitiesFail}`,
              ],
              [
                "§4 OFF capabilities (block-by-design / unenforced)",
                `${result.summary.offCapabilitiesPassOrBlockedByDesign} / ${result.summary.offCapabilitiesUnenforced}`,
              ],
              [
                "§6 entry criteria (PASS/FAIL/PENDING)",
                `${result.summary.entryCriteriaPass} / ${result.summary.entryCriteriaFail} / ${result.summary.entryCriteriaPendingSignoff}`,
              ],
              [
                "§9 open decisions (recorded / pending)",
                `${result.summary.openDecisionsRecorded} / ${result.summary.openDecisionsPendingSignoff}`,
              ],
              ["Findings", result.summary.findingCount],
              [
                "Cross-source conflicts",
                result.summary.crossSourceConflictCount,
              ],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                style={{ ...panelStyle, padding: 10, background: "#f6f8fb" }}
              >
                <div style={{ fontSize: 11, ...mutedText }}>{label}</div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{value}</div>
              </div>
            ))}
          </div>
        </section>

        {result.onCapabilityCoverage.length > 0 && (
          <section style={{ ...panelStyle, padding: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
              §3 ON capabilities
            </div>
            {result.onCapabilityCoverage.map((c) => (
              <div
                key={c.capabilityId}
                style={{ ...panelStyle, padding: 12, marginBottom: 8 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {c.doctrineLabel}
                    </div>
                    <div style={{ ...mutedText, fontSize: 12 }}>
                      {c.constraint}
                    </div>
                  </div>
                  <StatusBadge tone={statusToTone(c.status)} label={c.status} />
                </div>
                <div style={{ ...mutedText, fontSize: 11, marginTop: 6 }}>
                  representing: {c.representingModuleIds.join(", ") || "(none)"}
                </div>
              </div>
            ))}
          </section>
        )}

        {result.offCapabilityCoverage.length > 0 && (
          <section style={{ ...panelStyle, padding: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
              §4 OFF capabilities (must remain blocked)
            </div>
            {result.offCapabilityCoverage.map((c) => (
              <div
                key={c.capabilityId}
                style={{ ...panelStyle, padding: 12, marginBottom: 8 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {c.doctrineLabel}
                    </div>
                  </div>
                  <StatusBadge tone={statusToTone(c.status)} label={c.status} />
                </div>
                <div style={{ ...mutedText, fontSize: 11, marginTop: 6 }}>
                  guarding: {c.guardingModuleIds.join(", ") || "(none)"}
                </div>
              </div>
            ))}
          </section>
        )}

        {result.entryCriteriaEvaluation.length > 0 && (
          <section style={{ ...panelStyle, padding: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
              §6 entry criteria
            </div>
            {result.entryCriteriaEvaluation.map((e) => (
              <div
                key={e.criterionId}
                style={{ ...panelStyle, padding: 12, marginBottom: 8 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "start",
                  }}
                >
                  <div style={{ fontSize: 13 }}>{e.doctrineLabel}</div>
                  <StatusBadge tone={statusToTone(e.status)} label={e.status} />
                </div>
                <div style={{ ...mutedText, fontSize: 11, marginTop: 4 }}>
                  {e.reason}
                </div>
              </div>
            ))}
          </section>
        )}

        {result.openDecisionsEvaluation.length > 0 && (
          <section style={{ ...panelStyle, padding: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
              §9 open decisions (pending sign-off)
            </div>
            {result.openDecisionsEvaluation.map((d) => (
              <div
                key={d.decisionId}
                style={{ ...panelStyle, padding: 12, marginBottom: 8 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "start",
                  }}
                >
                  <div style={{ fontSize: 13 }}>{d.doctrineLabel}</div>
                  <StatusBadge
                    tone={
                      d.status === "RECORDED" ? "pass" : "warn"
                    }
                    label={d.status}
                  />
                </div>
                {d.recordedValue && (
                  <div style={{ ...mutedText, fontSize: 11, marginTop: 4 }}>
                    recorded value: {d.recordedValue} · by {d.recordedBy} ·{" "}
                    {d.recordedAt}
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        <section style={{ ...panelStyle, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
            Recommended review routes
          </div>
          <ul style={{ marginLeft: 16, ...mutedText, fontSize: 13 }}>
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
          <ul style={{ marginLeft: 16, ...mutedText, fontSize: 12 }}>
            {result.disclosures.map((disclosure) => (
              <li key={disclosure}>{disclosure}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
