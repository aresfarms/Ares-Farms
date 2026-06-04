"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type {
  CustomerJourneyInput,
  CustomerJourneyResult,
} from "@/lib/public-alpha-journey/publicAlphaCustomerJourneyRuntime";

type ApiResponse = {
  ok: boolean;
  error?: string;
  result?: CustomerJourneyResult;
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
    case "PENDING_SIGNOFF":
      return "warn";
    case "BLOCKED_BY_DESIGN":
      return "blocked";
    default:
      return "na";
  }
}

export default function PublicAlphaCustomerJourneyPage() {
  const [reviewerRole, setReviewerRole] = useState(
    "Chief Governance Authority"
  );
  const [serverResult, setServerResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const localInput = useMemo<CustomerJourneyInput>(
    () => ({ reviewerRole }),
    [reviewerRole]
  );

  const emptyResult = useMemo<CustomerJourneyResult>(() => {
    return {
      runtimeVersion: "public-alpha-customer-journey-runtime-v0.1.0",
      specVersion: "public-alpha-profile-v1",
      docRef: "docs/DOCTRINE_PUBLIC_ALPHA_CUSTOMER_JOURNEY_V1.md",
      generatedAt: new Date(0).toISOString(),
      reviewerRole,
      applicationId: null,
      taglineCanonical: "Compass to Capital",
      promiseNegations: [],
      promiseAffirmations: [],
      financingRealityClassifications: [],
      sections: [],
      sectionResults: [],
      customerPromise: {
        taglinePresent: false,
        negationsPresentCount: 0,
        negationsTotal: 0,
        negationsMissing: [],
        affirmationsPresentCount: 0,
        affirmationsTotal: 0,
        affirmationsMissing: [],
        status: "WARN",
        reason: "POST to /api/governance/public-alpha-customer-journey to run the audit.",
      },
      financingReality: {
        classificationsPresentCount: 0,
        classificationsTotal: 0,
        classificationsMissing: [],
        resolvedRoute: null,
        status: "FAIL",
        reason: "POST to /api/governance/public-alpha-customer-journey to run the audit.",
      },
      customerSuccessQuestions: [],
      customerSuccessResults: [],
      findings: [],
      v1Signals: [],
      crossSourceConflicts: [],
      summary: {
        sectionCount: 0,
        sectionsPass: 0,
        sectionsFail: 0,
        sectionsWarn: 0,
        customerSuccessQuestionCount: 0,
        customerSuccessQuestionsPass: 0,
        customerSuccessQuestionsWarn: 0,
        customerSuccessQuestionsFail: 0,
        customerPromiseStatus: "WARN",
        financingRealityStatus: "FAIL",
        classificationsPresentCount: 0,
        classificationsTotal: 0,
        findingCount: 0,
        crossSourceConflictCount: 0,
        v1SignalCount: 0,
        v1ReadyCount: 0,
        v1BlockedCount: 0,
        v1NotStartedCount: 0,
        v1OverallReadinessPercent: 0,
      },
      alphaJourneyReady: "FAIL",
      exitCode: 1,
      recommendedReviewRoutes: [
        "/governance/public-alpha-customer-journey",
        "/governance/public-alpha-profile",
        "/governance/disclosure-audit-gate",
        "/governance/human-authority-registry",
        "/governance/build-self-report",
      ],
      disclosures: [
        "POST to /api/governance/public-alpha-customer-journey to run the audit.",
      ],
      productionRestrictions: [],
      blockedClaims: [],
      productionBlocked: true,
      humanReviewRequired: true,
      advisoryOnly: true,
      publicAlphaCustomerJourneyInternalOnly: true,
      noCustomerFacingPublication: true,
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
    } as CustomerJourneyResult;
  }, [reviewerRole]);

  const result = serverResult?.result ?? emptyResult;

  async function runComposition() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "/api/governance/public-alpha-customer-journey",
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
                Public Alpha Profile v1 — Customer Journey
              </div>
              <div style={{ ...mutedText, marginTop: 4 }}>
                Codifies the Public Alpha Profile v1 doctrine
                ({result.docRef}). Audits the 7 entry-surface sections
                (founder intro, intake, pathway discovery, readiness review,
                financing reality classification, human escalation, data
                transparency), 6 customer success questions, customer
                promise (tagline + 5 negations + 6 affirmations), 6 financing
                reality classifications, Module 44 disclosure coverage, and
                Module 45 human-authority binding. Doctrine status PROPOSED —
                Public Alpha entry remains gated on named governance
                authority sign-off; this runtime audits the surface state.
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <StatusBadge tone="fail" label="Production blocked" />
              <StatusBadge tone="warn" label="Human review required" />
              <StatusBadge
                tone={statusToTone(result.alphaJourneyReady)}
                label={`alpha_journey_ready: ${result.alphaJourneyReady}`}
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
              ["alpha_journey_ready", result.alphaJourneyReady],
              ["exit_code", result.exitCode],
              [
                "sections (PASS / FAIL / WARN)",
                `${result.summary.sectionsPass} / ${result.summary.sectionsFail} / ${result.summary.sectionsWarn}`,
              ],
              [
                "success questions (PASS / WARN / FAIL)",
                `${result.summary.customerSuccessQuestionsPass} / ${result.summary.customerSuccessQuestionsWarn} / ${result.summary.customerSuccessQuestionsFail}`,
              ],
              ["customer promise", result.summary.customerPromiseStatus],
              [
                "financing reality classifications",
                `${result.summary.classificationsPresentCount}/${result.summary.classificationsTotal}`,
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

        {result.sectionResults.length > 0 && (
          <section style={{ ...panelStyle, padding: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
              7 entry-surface sections
            </div>
            {result.sectionResults.map((s) => (
              <div
                key={s.sectionId}
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
                      {s.ordinal}. {s.doctrineLabel}
                    </div>
                    <div style={{ ...mutedText, fontSize: 12 }}>
                      {s.reason}
                    </div>
                  </div>
                  <StatusBadge tone={statusToTone(s.status)} label={s.status} />
                </div>
                <div style={{ ...mutedText, fontSize: 11, marginTop: 6 }}>
                  route: {s.resolvedRoute ?? "(none)"} · tokens{" "}
                  {s.requiredTokensPresent}/{s.requiredTokensTotal} ·
                  disclosures {s.disclosuresPresent}/
                  {s.requiredDisclosureIds.length} ·{" "}
                  {s.humanAuthorityBindingPresent
                    ? "authority bound"
                    : "no authority binding"}
                </div>
              </div>
            ))}
          </section>
        )}

        {result.customerSuccessResults.length > 0 && (
          <section style={{ ...panelStyle, padding: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
              6 customer success criteria
            </div>
            {result.customerSuccessResults.map((q) => (
              <div
                key={q.questionId}
                style={{ ...panelStyle, padding: 12, marginBottom: 8 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ fontSize: 13 }}>{q.questionCanonical}</div>
                  <StatusBadge tone={statusToTone(q.status)} label={q.status} />
                </div>
                <div style={{ ...mutedText, fontSize: 11, marginTop: 4 }}>
                  {q.reason}
                </div>
              </div>
            ))}
          </section>
        )}

        <section style={{ ...panelStyle, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
            Customer promise
          </div>
          <div style={{ ...mutedText, fontSize: 12 }}>
            tagline = <code>{result.taglineCanonical}</code> ·{" "}
            {result.customerPromise.taglinePresent ? "present" : "missing"} ·
            negations {result.customerPromise.negationsPresentCount}/
            {result.customerPromise.negationsTotal} · affirmations{" "}
            {result.customerPromise.affirmationsPresentCount}/
            {result.customerPromise.affirmationsTotal}
          </div>
          {result.customerPromise.negationsMissing.length > 0 && (
            <div style={{ ...mutedText, fontSize: 11, marginTop: 4 }}>
              negations missing:{" "}
              {result.customerPromise.negationsMissing.join(", ")}
            </div>
          )}
          {result.customerPromise.affirmationsMissing.length > 0 && (
            <div style={{ ...mutedText, fontSize: 11, marginTop: 4 }}>
              affirmations missing:{" "}
              {result.customerPromise.affirmationsMissing.join(", ")}
            </div>
          )}
        </section>

        <section style={{ ...panelStyle, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
            6 financing reality classifications
          </div>
          <div style={{ ...mutedText, fontSize: 12 }}>
            {result.summary.classificationsPresentCount} of{" "}
            {result.summary.classificationsTotal} present
          </div>
          {result.financingReality.classificationsMissing.length > 0 && (
            <div style={{ ...mutedText, fontSize: 11, marginTop: 4 }}>
              missing: {result.financingReality.classificationsMissing.join(", ")}
            </div>
          )}
        </section>

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
      </div>
    </div>
  );
}
