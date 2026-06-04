"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type {
  HumanAuthorityRegistryInput,
  HumanAuthorityRegistryResult,
} from "@/lib/human-authority/humanAuthorityRegistryRuntime";

type ApiResponse = {
  ok: boolean;
  error?: string;
  result?: HumanAuthorityRegistryResult;
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

function statusToTone(
  status: string
): "pass" | "fail" | "warn" | "na" | "blocked" {
  switch (status) {
    case "PASS":
      return "pass";
    case "FAIL":
      return "fail";
    case "WARN":
      return "warn";
    case "BLOCKED_BY_DESIGN":
      return "blocked";
    default:
      return "na";
  }
}

function intentToTone(
  intent: string
): "pass" | "fail" | "warn" | "na" | "blocked" {
  switch (intent) {
    case "alpha_required":
      return "warn";
    case "intentionally_held":
      return "blocked";
    case "internal_support":
      return "na";
    default:
      return "na";
  }
}

export default function HumanAuthorityRegistryPage() {
  const [reviewerRole, setReviewerRole] = useState("Chief Governance Authority");
  const [serverResult, setServerResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const localInput = useMemo<HumanAuthorityRegistryInput>(
    () => ({ reviewerRole }),
    [reviewerRole]
  );

  // Empty placeholder until POST returns. Runtime imports node:fs
  // and cannot run in the browser; we only display data from the
  // server-side route.
  const emptyResult = useMemo<HumanAuthorityRegistryResult>(() => {
    return {
      runtimeVersion: "human-authority-registry-runtime-v0.1.0",
      specVersion: "module-45-human-authority-registry-spec-v1.0",
      docRef: "docs/DOCTRINE_HUMAN_AUTHORITY_REGISTRY_V1.md",
      generatedAt: new Date(0).toISOString(),
      reviewerRole,
      applicationId: null,
      bindings: [],
      roleRegistry: [],
      moduleResolutions: [],
      filledRoles: [],
      findings: [],
      v1Signals: [],
      crossSourceConflicts: [],
      summary: {
        bindingCount: 0,
        bindingsActive: 0,
        bindingsRoleUnfilled: 0,
        bindingsDefinedOnly: 0,
        rolesDeclared: 0,
        rolesFilled: 0,
        modulesAudited: 0,
        modulesAlphaRequired: 0,
        modulesIntentionallyHeld: 0,
        modulesInternalSupport: 0,
        modulesAuthorityPass: 0,
        modulesAuthorityFail: 0,
        modulesAuthorityWarn: 0,
        modulesAuthorityNA: 0,
        coverageMissingCount: 0,
        findingCount: 0,
        crossSourceConflictCount: 0,
        v1SignalCount: 0,
        v1ReadyCount: 0,
        v1NeedsInputCount: 0,
        v1BlockedCount: 0,
        v1NotStartedCount: 0,
        v1OverallReadinessPercent: 0,
      },
      exitCode: 1,
      recommendedReviewRoutes: [
        "/governance/human-authority-registry",
        "/governance/build-self-report",
        "/governance/public-alpha-profile",
      ],
      disclosures: [
        "POST to /api/governance/human-authority-registry to run the audit.",
      ],
      productionRestrictions: [],
      blockedClaims: [],
      productionBlocked: true,
      humanReviewRequired: true,
      advisoryOnly: true,
      humanAuthorityRegistryInternalOnly: true,
      noAiClearing: true,
      noSelfClear: true,
      noAutonomousDetermination: true,
      noInformationSale: true,
      noSilentSubmission: true,
      noApproval: true,
      noDenial: true,
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
    } as HumanAuthorityRegistryResult;
  }, [reviewerRole]);

  const result = serverResult?.result ?? emptyResult;

  async function runComposition() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "/api/governance/human-authority-registry",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(localInput),
        }
      );
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
                Module 45 — Human Authority Registry v1
              </div>
              <div style={{ ...mutedText, marginTop: 4 }}>
                Canonical machine-readable binding of every clearable
                action to a named human role ({result.docRef}). The
                registry binds <em>roles</em>, not named individuals.
                It does not approve anything — it declares who is
                permitted to clear what and enforces that no one else
                (and no AI) can. Constitutional invariants:
                <code style={{ fontFamily: "ui-monospace" }}>
                  {" "}
                  ai_permitted = false
                </code>
                ,
                <code style={{ fontFamily: "ui-monospace" }}>
                  {" "}
                  no_self_clear = true
                </code>
                ,
                <code style={{ fontFamily: "ui-monospace" }}>
                  {" "}
                  separation_of_duties = true
                </code>
                , quorum bindings require ≥ 2 approvers.
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <StatusBadge tone="fail" label="Production blocked" />
              <StatusBadge tone="warn" label="Human review required" />
              <StatusBadge
                tone={result.exitCode === 0 ? "pass" : "fail"}
                label={`exit_code: ${result.exitCode}`}
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
              ["exit_code", result.exitCode],
              ["bindings", result.summary.bindingCount],
              [
                "roles (declared / filled)",
                `${result.summary.rolesDeclared} / ${result.summary.rolesFilled}`,
              ],
              [
                "modules (alpha / held / support)",
                `${result.summary.modulesAlphaRequired} / ${result.summary.modulesIntentionallyHeld} / ${result.summary.modulesInternalSupport}`,
              ],
              [
                "authority (PASS / FAIL / WARN / N/A)",
                `${result.summary.modulesAuthorityPass} / ${result.summary.modulesAuthorityFail} / ${result.summary.modulesAuthorityWarn} / ${result.summary.modulesAuthorityNA}`,
              ],
              ["coverage gaps", result.summary.coverageMissingCount],
              ["findings", result.summary.findingCount],
              [
                "cross-source conflicts",
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

        {result.roleRegistry.length > 0 && (
          <section style={{ ...panelStyle, padding: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
              Role registry ({result.roleRegistry.length})
            </div>
            {result.roleRegistry.map((r) => (
              <div
                key={r.roleId}
                style={{ ...panelStyle, padding: 12, marginBottom: 8 }}
              >
                <div style={{ fontWeight: 600, fontSize: 13 }}>{r.label}</div>
                <div style={{ ...mutedText, fontSize: 12 }}>{r.scope}</div>
                <div style={{ ...mutedText, fontSize: 11, marginTop: 4 }}>
                  {r.notes}
                </div>
              </div>
            ))}
          </section>
        )}

        {result.bindings.length > 0 && (
          <section style={{ ...panelStyle, padding: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
              Bindings ({result.bindings.length})
            </div>
            {result.bindings.map((b) => (
              <div
                key={b.binding_id}
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
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {b.clearable_action}
                    </div>
                    <div style={{ ...mutedText, fontSize: 12 }}>
                      module: {b.module_id}
                      {b.module_number ? ` (#${b.module_number})` : ""} ·
                      mode: {b.clearing_rule.mode} · min_approvers:{" "}
                      {b.clearing_rule.min_approvers}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <StatusBadge
                      tone={intentToTone(b.intent)}
                      label={b.intent}
                    />
                    <StatusBadge
                      tone={
                        b.status === "active"
                          ? "pass"
                          : b.status === "role-unfilled"
                          ? "fail"
                          : "warn"
                      }
                      label={b.status}
                    />
                  </div>
                </div>
                <div style={{ ...mutedText, fontSize: 11, marginTop: 6 }}>
                  required_roles: {b.required_roles.join(", ")}
                </div>
                <div style={{ ...mutedText, fontSize: 11 }}>
                  evidence_required: {b.evidence_required.join(", ")} ·
                  audit_event: {b.audit_event}
                </div>
              </div>
            ))}
          </section>
        )}

        {result.moduleResolutions.length > 0 && (
          <section style={{ ...panelStyle, padding: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
              Per-module authority resolution (§2)
            </div>
            {result.moduleResolutions
              .filter((r) => r.bindingCount > 0)
              .map((r) => (
                <div
                  key={r.moduleId}
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
                        {r.moduleId}
                      </div>
                      <div style={{ ...mutedText, fontSize: 12 }}>
                        {r.reason}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <StatusBadge
                        tone={intentToTone(r.intent)}
                        label={r.intent}
                      />
                      <StatusBadge tone={statusToTone(r.status)} label={r.status} />
                    </div>
                  </div>
                </div>
              ))}
          </section>
        )}

        {result.findings.length > 0 && (
          <section style={{ ...panelStyle, padding: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
              Findings ({result.findings.length})
            </div>
            {result.findings.map((f) => (
              <div
                key={f.findingId}
                style={{ ...panelStyle, padding: 12, marginBottom: 8 }}
              >
                <div style={{ fontWeight: 600, fontSize: 13 }}>{f.topic}</div>
                <div style={{ ...mutedText, fontSize: 12, marginTop: 4 }}>
                  {f.reviewerExplanation}
                </div>
                <div style={{ ...mutedText, fontSize: 11, marginTop: 4 }}>
                  category: {f.category} · resolution: {f.resolution} · route:{" "}
                  <Link href={f.reviewRoute}>{f.reviewRoute}</Link>
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
