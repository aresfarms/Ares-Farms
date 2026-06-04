"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type {
  DisclosureAuditInput,
  DisclosureAuditResult,
} from "@/lib/disclosure-audit/disclosureAuditGateRuntime";

type ApiResponse = {
  ok: boolean;
  error?: string;
  result?: DisclosureAuditResult;
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
    default:
      return "na";
  }
}

export default function DisclosureAuditGatePage() {
  const [reviewerRole, setReviewerRole] = useState(
    "Qualified Governance Reviewer"
  );
  const [redTeamSample, setRedTeamSample] = useState("");
  const [serverResult, setServerResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const localInput = useMemo<DisclosureAuditInput>(
    () => ({
      reviewerRole,
      redTeamPlantedSampleText: redTeamSample || null,
    }),
    [reviewerRole, redTeamSample]
  );

  const emptyResult = useMemo<DisclosureAuditResult>(() => {
    return {
      runtimeVersion: "disclosure-audit-gate-runtime-v0.1.0",
      specVersion: "module-44-disclosure-audit-gate-spec-v1.0",
      docRef: "docs/DOCTRINE_DISCLOSURE_AUDIT_GATE_V1.md",
      generatedAt: new Date(0).toISOString(),
      reviewerRole,
      applicationId: null,
      disclosureRegistry: [],
      prohibitedClaimsCorpus: [],
      surfaceResults: [],
      findings: [],
      v1Signals: [],
      crossSourceConflicts: [],
      summary: {
        externalSurfaceCount: 0,
        internalSurfaceCount: 0,
        gateSurfaceCount: 0,
        totalSurfaceCount: 0,
        publicSurfaceCountFromGateway: 0,
        publicSurfaceCountFromRegistry: 0,
        surfaceCountReconciled: true,
        disclosurePassCount: 0,
        disclosureFailCount: 0,
        disclosureNaCount: 0,
        claimsPassCount: 0,
        claimsFailCount: 0,
        claimsWarnCount: 0,
        claimsNaCount: 0,
        totalRequiredDisclosureChecks: 0,
        presentDisclosureChecks: 0,
        missingDisclosureChecks: 0,
        totalProhibitedClaimViolations: 0,
        exemptNegationHits: 0,
        redTeamPlantedClaims: 0,
        redTeamCaught: 0,
        findingCount: 0,
        crossSourceConflictCount: 0,
        v1SignalCount: 0,
        v1ReadyCount: 0,
        v1BlockedCount: 0,
        v1NotStartedCount: 0,
        v1OverallReadinessPercent: 0,
      },
      exitCode: 1,
      recommendedReviewRoutes: [
        "/governance/disclosure-audit-gate",
        "/governance/build-self-report",
        "/governance/public-alpha-profile",
        "/governance/human-authority-registry",
      ],
      disclosures: [
        "POST to /api/governance/disclosure-audit-gate to run the audit.",
      ],
      productionRestrictions: [],
      blockedClaims: [],
      productionBlocked: true,
      humanReviewRequired: true,
      advisoryOnly: true,
      disclosureAuditGateInternalOnly: true,
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
    } as DisclosureAuditResult;
  }, [reviewerRole]);

  const result = serverResult?.result ?? emptyResult;

  async function runComposition() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/governance/disclosure-audit-gate", {
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
                Module 44 — Disclosure Audit Gate v1
              </div>
              <div style={{ ...mutedText, marginTop: 4 }}>
                Canonical disclosure registry + prohibited-claims corpus
                ({result.docRef}). Audits every external surface for required
                advisory disclosures (advisory-only, no-reliance,
                no-public-verification, Furlong-not-lender, AI-tier1-only,
                data-rights, free-for-borrowers, user-data-sovereignty) and
                scans for prohibited-claim leakage (approval, decision, AI
                decision, reliance, commitment, verification) with
                negation-aware exemption. Reconciles public-surface count
                between registry and gateway.
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
          <label style={{ display: "grid", gap: 4, marginTop: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>
              Red-team planted sample (optional — used to verify the corpus
              catches prohibited-claim language; the gate will exit 1 when set)
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
              value={redTeamSample}
              onChange={(e) => setRedTeamSample(e.target.value)}
              placeholder="e.g. Congratulations, you are approved for $50000!"
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
              [
                "surfaces (external / internal / gate)",
                `${result.summary.externalSurfaceCount} / ${result.summary.internalSurfaceCount} / ${result.summary.gateSurfaceCount}`,
              ],
              [
                "public count (registry / gateway)",
                `${result.summary.publicSurfaceCountFromRegistry} / ${result.summary.publicSurfaceCountFromGateway}${result.summary.surfaceCountReconciled ? " ✓" : " ✗"}`,
              ],
              [
                "disclosures (PASS / FAIL / N/A)",
                `${result.summary.disclosurePassCount} / ${result.summary.disclosureFailCount} / ${result.summary.disclosureNaCount}`,
              ],
              [
                "claims (PASS / FAIL / WARN / N/A)",
                `${result.summary.claimsPassCount} / ${result.summary.claimsFailCount} / ${result.summary.claimsWarnCount} / ${result.summary.claimsNaCount}`,
              ],
              [
                "checks (present / missing)",
                `${result.summary.presentDisclosureChecks} / ${result.summary.missingDisclosureChecks}`,
              ],
              ["exempt negations recognized", result.summary.exemptNegationHits],
              [
                "red-team (planted / caught)",
                `${result.summary.redTeamPlantedClaims} / ${result.summary.redTeamCaught}`,
              ],
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

        {result.disclosureRegistry.length > 0 && (
          <section style={{ ...panelStyle, padding: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
              Disclosure registry ({result.disclosureRegistry.length})
            </div>
            {result.disclosureRegistry.map((d) => (
              <div
                key={d.disclosure_id}
                style={{ ...panelStyle, padding: 12, marginBottom: 8 }}
              >
                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  {d.disclosure_id}
                </div>
                <div style={{ ...mutedText, fontSize: 12, marginTop: 4 }}>
                  {d.required_text_canonical}
                </div>
                <div style={{ ...mutedText, fontSize: 11, marginTop: 4 }}>
                  applies_to: {d.applies_to.join(", ")} · severity_if_missing:{" "}
                  {d.severity_if_missing} · source: {d.source_doctrine}
                </div>
              </div>
            ))}
          </section>
        )}

        {result.surfaceResults.length > 0 && (
          <section style={{ ...panelStyle, padding: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
              External surface results
            </div>
            {result.surfaceResults
              .filter(
                (r) =>
                  r.surfaceClass !== "internal" && r.surfaceClass !== "gate"
              )
              .map((r) => (
                <div
                  key={r.surfaceId}
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
                        {r.surfaceId} · {r.surfaceClass}
                      </div>
                      <div style={{ ...mutedText, fontSize: 11, marginTop: 2 }}>
                        {r.route}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <StatusBadge
                        tone={statusToTone(r.disclosuresStatus)}
                        label={`disclosures: ${r.disclosuresStatus}`}
                      />
                      <StatusBadge
                        tone={statusToTone(r.claimsStatus)}
                        label={`claims: ${r.claimsStatus}`}
                      />
                    </div>
                  </div>
                  {r.missingDisclosureIds.length > 0 && (
                    <div
                      style={{ ...mutedText, fontSize: 11, marginTop: 4 }}
                    >
                      missing: {r.missingDisclosureIds.join(", ")}
                    </div>
                  )}
                  {r.prohibitedClaimViolations.length > 0 && (
                    <div
                      style={{ ...mutedText, fontSize: 11, marginTop: 4 }}
                    >
                      prohibited:{" "}
                      {r.prohibitedClaimViolations
                        .map((v) => v.claimId)
                        .join(", ")}
                    </div>
                  )}
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
