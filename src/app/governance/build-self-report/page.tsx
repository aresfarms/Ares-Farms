"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type {
  BuildSelfReportInput,
  BuildSelfReportResult,
} from "@/lib/build-self-report/buildSelfReportRuntime";

type ApiResponse = {
  ok: boolean;
  error?: string;
  result?: BuildSelfReportResult;
};

const shellStyle = {
  minHeight: "100vh",
  background: "#f6f8fb",
  color: "#162033",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as const;
const containerStyle = {
  maxWidth: 1280,
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
        padding: "2px 6px",
        borderRadius: 4,
        background: tone.bg,
        color: tone.fg,
        border: `1px solid ${tone.border}`,
        fontSize: 11,
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
    case "WARN":
      return "warn";
    case "N/A":
      return "na";
    case "BLOCKED_BY_DESIGN":
      return "blocked";
    default:
      return "na";
  }
}

export default function BuildSelfReportPage() {
  const [reviewerRole, setReviewerRole] = useState(
    "Qualified Governance Reviewer"
  );
  const [commit, setCommit] = useState("HEAD");
  const [serverResult, setServerResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const localInput = useMemo<BuildSelfReportInput>(
    () => ({
      reviewerRole,
      commit,
      requirementsTotal: 60,
      requirementsImplemented: 57,
      pendingRequirements: [
        {
          id: "REQ-58",
          name: "Module 44 Disclosure Audit Gate",
          blocked_reason: "not yet implemented",
        },
        {
          id: "REQ-59",
          name: "Module 45 Human Authority Registry",
          blocked_reason: "not yet implemented",
        },
        {
          id: "REQ-60",
          name: "Live route probe under booted Next.js instance",
          blocked_reason: "deterministic file-system probe in v0.1",
        },
      ],
    }),
    [reviewerRole, commit]
  );

  // The runtime probes the filesystem, so it must run server-side
  // only. Until the user POSTs to the governed API, render an empty
  // placeholder result.
  const emptyResult = useMemo<BuildSelfReportResult>(
    () =>
      ({
        runtimeVersion: "build-self-report-runtime-v0.1.0",
        specVersion: "module-42-build-self-report-spec-v1.0",
        generatedAt: new Date(0).toISOString(),
        reviewerRole: reviewerRole,
        applicationId: null,
        header: {
          checkpoint: "(awaiting POST)",
          commit: commit,
          branch: "main",
          tree_status: "clean",
          generated: new Date(0).toISOString(),
          verify_backend: "PASS",
          build: "PASS",
          static_pages: 0,
          volumes_conformed: ["0", "I", "II", "III", "III-B", "IV", "V", "VI", "VII"],
          live_fetch_enabled: 0,
          audit_chain_intact: "PASS",
          totals: {
            modules: 0,
            numbered: 0,
            unnumbered: 0,
            pass: 0,
            pass_with_warnings: 0,
            warn: 0,
            fail: 0,
            blocked_by_design: 0,
          },
          orphans: { no_consumer: [], no_producer: [], dangling: [] },
          dangling_event_contracts: [],
          public_surfaces_checked: 0,
          requirements: {
            total: 60,
            implemented: 57,
            pending: localInput.pendingRequirements ?? [],
          },
          exit_code: 0,
        },
        modules: [],
        summary: {
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
        v1Signals: [],
        findings: [],
        crossSourceConflicts: [],
        recommendedReviewRoutes: [
          "/governance/build-self-report",
          "/build-preservation",
          "/governance",
          "/reviews",
        ],
        disclosures: [
          "POST to /api/governance/build-self-report to run the deterministic audit.",
        ],
        productionRestrictions: [],
        blockedClaims: [],
        productionBlocked: true,
        humanReviewRequired: true,
        advisoryOnly: true,
        buildSelfReportInternalOnly: true,
        noInformationSale: true,
        noSilentSubmission: true,
        noSecretDistribution: true,
        noMarketingLead: true,
        noFraudAccusation: true,
        noDenial: true,
        noRejection: true,
        noAutonomousLending: true,
        noAutonomousEligibility: true,
        noAutonomousPathway: true,
        noAutonomousOpportunity: true,
        noAutonomousIntelligence: true,
        noAutonomousEvidence: true,
        noAutonomousCertification: true,
        noAutonomousOnboarding: true,
        noAutonomousReadiness: true,
        noPublicVerification: true,
        noRegulatoryReliance: true,
        noLenderCommitment: true,
        noLegalReliance: true,
        noLiveExternalAction: true,
        noSourceCertainty: true,
        noNoticeSend: true,
        replaySafe: true,
        auditSafe: true,
        federationScoped: true,
        conflictPreserving: true,
      }) as BuildSelfReportResult,
    [reviewerRole, commit, localInput.pendingRequirements]
  );

  const result = serverResult?.result ?? emptyResult;

  async function runComposition() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/governance/build-self-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localInput),
      });
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

  function cellLabel(cell: unknown): string {
    if (typeof cell === "string") return cell;
    if (cell && typeof cell === "object" && "status" in cell) {
      const obj = cell as { status: string; reason?: string };
      return obj.reason ? `${obj.status} · ${obj.reason}` : obj.status;
    }
    return "N/A";
  }

  function cellStatus(cell: unknown): string {
    if (typeof cell === "string") return cell;
    if (cell && typeof cell === "object" && "status" in cell) {
      return (cell as { status: string }).status;
    }
    return "N/A";
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
                Build Self-Report v1
              </div>
              <div style={{ ...mutedText, marginTop: 4 }}>
                Deterministic per-module audit against the Module 42 Build
                Self-Report Specification. Every cell is one of PASS / FAIL
                / WARN / N/A / BLOCKED_BY_DESIGN. Every finding resolves to
                REQUIRES_HUMAN_REVIEW. Internal advisory audit posture only.
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <StatusBadge tone="fail" label="Production blocked" />
              <StatusBadge tone="warn" label="Human review required" />
              <StatusBadge
                tone={result.header.exit_code === 0 ? "pass" : "fail"}
                label={
                  result.header.exit_code === 0
                    ? "Gate PASS"
                    : `Gate FAIL (exit ${result.header.exit_code})`
                }
              />
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
              <span style={{ fontSize: 12, fontWeight: 600 }}>Commit</span>
              <input
                style={{
                  minHeight: 36,
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  padding: "6px 10px",
                  fontSize: 13,
                  background: "#ffffff",
                }}
                value={commit}
                onChange={(e) => setCommit(e.target.value)}
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
            Platform roll-up
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
              ["checkpoint", result.header.checkpoint],
              ["commit", result.header.commit],
              ["branch", result.header.branch],
              ["tree", result.header.tree_status],
              ["verify_backend", result.header.verify_backend],
              ["build", result.header.build],
              ["static_pages", result.header.static_pages],
              ["live_fetch_enabled", result.header.live_fetch_enabled],
              ["audit_chain_intact", result.header.audit_chain_intact],
              ["modules", result.header.totals.modules],
              [
                "PASS / W / FAIL / BBD",
                `${result.header.totals.pass} / ${result.header.totals.pass_with_warnings} / ${result.header.totals.fail} / ${result.header.totals.blocked_by_design}`,
              ],
              ["dangling event contracts", result.header.dangling_event_contracts.length],
              [
                "orphans (NC/NP/D)",
                `${result.header.orphans.no_consumer.length} / ${result.header.orphans.no_producer.length} / ${result.header.orphans.dangling.length}`,
              ],
              ["public_surfaces", result.header.public_surfaces_checked],
              [
                "requirements",
                `${result.header.requirements.implemented} impl + ${result.header.requirements.pending.length} pending = ${result.header.requirements.total}`,
              ],
              ["exit_code", result.header.exit_code],
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

        <section style={{ ...panelStyle, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
            Modules ({result.modules.length})
          </div>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                fontSize: 11,
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ background: "#f6f8fb", textAlign: "left" }}>
                  {[
                    "#",
                    "id",
                    "class",
                    "verdict",
                    "route",
                    "replay",
                    "disc",
                    "blocks",
                    "auth",
                    "claims",
                    "pii",
                    "lineage",
                    "ep/ec",
                    "hi/ho",
                    "orphan",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "6px 6px",
                        borderBottom: "1px solid #d7deea",
                        fontWeight: 600,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.modules.map((row) => (
                  <tr
                    key={row.module_id}
                    style={{ borderBottom: "1px solid #eef1f6" }}
                  >
                    <td style={{ padding: "4px 6px" }}>
                      {row.module_number ?? "—"}
                    </td>
                    <td style={{ padding: "4px 6px", fontFamily: "monospace" }}>
                      {row.module_id}
                    </td>
                    <td style={{ padding: "4px 6px" }}>{row.surface_class}</td>
                    <td style={{ padding: "4px 6px" }}>
                      <StatusBadge
                        tone={statusToTone(row.module_verdict)}
                        label={row.module_verdict}
                      />
                    </td>
                    {[
                      row.checks.route_loads,
                      row.checks.replay_reproduces,
                      row.checks.disclosures_present,
                      row.checks.blocks_enforced,
                      row.checks.human_authority,
                      row.checks.claims_controls,
                      row.checks.pii_redaction,
                      row.checks.lineage_traceable,
                    ].map((cell, i) => (
                      <td
                        key={i}
                        style={{ padding: "4px 6px" }}
                        title={cellLabel(cell)}
                      >
                        <StatusBadge
                          tone={statusToTone(cellStatus(cell))}
                          label={cellStatus(cell)}
                        />
                      </td>
                    ))}
                    <td style={{ padding: "4px 6px" }}>
                      {row.graph.events_produced}/{row.graph.events_consumed}
                    </td>
                    <td style={{ padding: "4px 6px" }}>
                      {row.graph.handoffs_in}/{row.graph.handoffs_out}
                    </td>
                    <td style={{ padding: "4px 6px" }}>
                      {row.graph.orphan_flag}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {result.findings.length > 0 && (
          <section style={{ ...panelStyle, padding: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
              Findings ({result.findings.length})
            </div>
            <div style={{ ...mutedText, fontSize: 12, marginBottom: 8 }}>
              Showing first 50.
            </div>
            {result.findings.slice(0, 50).map((finding) => (
              <div
                key={finding.findingId}
                style={{
                  ...panelStyle,
                  padding: 10,
                  marginBottom: 6,
                  background: "#fff",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 12 }}>
                  {finding.category} · {finding.subjectModuleId ?? "—"}
                </div>
                <div style={{ ...mutedText, fontSize: 12 }}>
                  {finding.reviewerExplanation}
                </div>
              </div>
            ))}
          </section>
        )}

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
                  padding: 10,
                  marginBottom: 6,
                  borderLeft: "4px solid #c14757",
                  background: "#fde4e4",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 12 }}>
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
