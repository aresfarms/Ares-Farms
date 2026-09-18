"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  DocumentEvidenceReconciliationInput,
  DocumentEvidenceReconciliationResult,
  DocumentReconciliationCrossSourceConflict,
  DocumentReconciliationFinding,
  DocumentReconciliationSignal,
  composeDocumentEvidenceReconciliation,
} from "@/lib/platform/authorities/evidence";

type ApiResponse = {
  ok: boolean;
  error?: string;
  result?: DocumentEvidenceReconciliationResult;
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

function resolutionToTone(
  status: DocumentReconciliationFinding["resolutionStatus"]
): "pass" | "fail" | "review" | "neutral" {
  switch (status) {
    case "CONSISTENT":
      return "pass";
    case "MATERIAL_CONFLICT":
    case "HUMAN_REVIEW_REQUIRED":
    case "BLOCKED_BY_CONFLICT":
      return "fail";
    case "INCOMPLETE":
    case "UNRESOLVED_VARIANCE":
    case "CLARIFICATION_REQUESTED":
    case "THIRD_PARTY_VERIFICATION_RECOMMENDED":
      return "review";
    default:
      return "neutral";
  }
}

function signalToTone(
  status: DocumentReconciliationSignal["status"]
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

function FindingCard(props: { finding: DocumentReconciliationFinding }) {
  const { finding } = props;
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
            {finding.category} · {finding.findingId}
          </div>
          <div style={{ ...mutedText, fontSize: 12 }}>
            reviewer {finding.reviewerRole} · classification{" "}
            {finding.classificationLevel} · human-review-flag:{" "}
            {finding.humanReviewFlag ? "YES" : "no"}
          </div>
        </div>
        <StatusBadge
          tone={resolutionToTone(finding.resolutionStatus)}
          label={finding.resolutionStatus}
        />
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
        <strong>Explanation:</strong> {finding.plainEnglishExplanation}
      </div>
      {finding.conflictingOrMissingItems.length > 0 && (
        <div style={{ ...mutedText, fontSize: 12, marginTop: 6 }}>
          Items:{" "}
          {finding.conflictingOrMissingItems.join(" · ")}
        </div>
      )}
      <div style={{ ...mutedText, fontSize: 12, marginTop: 6 }}>
        Why it matters: {finding.whyItMatters}
      </div>
      <div style={{ ...mutedText, fontSize: 12, marginTop: 4 }}>
        What may resolve it: {finding.whatAdditionalInformationMayResolveIt}
      </div>
      <div style={{ ...mutedText, fontSize: 12, marginTop: 4 }}>
        Next: {finding.nextRecommendedAction}
      </div>
      <div style={{ ...mutedText, fontSize: 11, marginTop: 6 }}>
        Evidence: {finding.evidenceRefs.join(", ") || "(none)"} · Source:{" "}
        {finding.sourceRefs.join(", ") || "(none)"}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 11,
          fontStyle: "italic",
          color: "#5d687a",
        }}
      >
        {finding.advisoryDisclaimer}
      </div>
    </div>
  );
}

function SignalCard(props: { signal: DocumentReconciliationSignal }) {
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
  conflict: DocumentReconciliationCrossSourceConflict;
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

export default function DocumentEvidenceReconciliationPage() {
  const [reviewerRole, setReviewerRole] = useState(
    "Qualified Governance Reviewer"
  );
  const [taxYear, setTaxYear] = useState("2024");
  const [taxRevenue, setTaxRevenue] = useState("1000000");
  const [taxNetIncome, setTaxNetIncome] = useState("100000");
  const [taxDepreciation, setTaxDepreciation] = useState("60000");
  const [plRevenue, setPlRevenue] = useState("1050000");
  const [plOCF, setPlOCF] = useState("200000");
  const [serverResult, setServerResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const localInput = useMemo<DocumentEvidenceReconciliationInput>(() => {
    const year = parseInt(taxYear, 10) || 2024;
    return {
      reviewerRole,
      taxReturns: [
        {
          documentRef: `doc://tax/${year}`,
          period: { year },
          reportedGrossRevenue: parseFloat(taxRevenue) || null,
          reportedNetIncome: parseFloat(taxNetIncome) || null,
          declaredDepreciation: parseFloat(taxDepreciation) || null,
        },
      ],
      profitAndLossStatements: [
        {
          documentRef: `doc://pl/${year}`,
          period: { year },
          reportedRevenue: parseFloat(plRevenue) || null,
          reportedOperatingCashFlow: parseFloat(plOCF) || null,
        },
      ],
    };
  }, [
    reviewerRole,
    taxYear,
    taxRevenue,
    taxNetIncome,
    taxDepreciation,
    plRevenue,
    plOCF,
  ]);

  const previewResult = useMemo(
    () => composeDocumentEvidenceReconciliation(localInput),
    [localInput]
  );

  const result = serverResult?.result ?? previewResult;

  async function runComposition() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "/api/governance/document-evidence-reconciliation",
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

  function NumberInput(props: {
    label: string;
    value: string;
    onChange: (v: string) => void;
  }) {
    return (
      <label style={{ display: "grid", gap: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>{props.label}</span>
        <input
          style={{
            minHeight: 36,
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            padding: "6px 10px",
            fontSize: 13,
            background: "#ffffff",
          }}
          type="text"
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
        />
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
                Document Evidence Reconciliation v1
              </div>
              <div style={{ ...mutedText, marginTop: 4 }}>
                Identifies missing, conflicting, incomplete, or unreconciled
                borrower-provided documents and converts each variance into a
                respectful clarification request, third-party verification
                recommendation, or human-review escalation — never rejection,
                accusation, or false conclusion. Unreconciled evidence is
                not denial. The workflow never accuses fraud, never says a
                document is fake, never says the borrower is lying, never
                makes a legal conclusion, and never makes an underwriting
                decision.
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <StatusBadge tone="fail" label="Production blocked" />
              <StatusBadge tone="review" label="Human review required" />
              <StatusBadge tone="neutral" label="Conflict lineage preserved" />
            </div>
          </div>
        </header>

        <section style={{ ...panelStyle, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
            Reviewer input — tax return + matching P&amp;L
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12,
            }}
          >
            <NumberInput
              label="Tax year"
              value={taxYear}
              onChange={setTaxYear}
            />
            <NumberInput
              label="Tax return gross revenue"
              value={taxRevenue}
              onChange={setTaxRevenue}
            />
            <NumberInput
              label="Tax return net income"
              value={taxNetIncome}
              onChange={setTaxNetIncome}
            />
            <NumberInput
              label="Tax return depreciation"
              value={taxDepreciation}
              onChange={setTaxDepreciation}
            />
            <NumberInput
              label="P&L revenue"
              value={plRevenue}
              onChange={setPlRevenue}
            />
            <NumberInput
              label="P&L operating cash flow"
              value={plOCF}
              onChange={setPlOCF}
            />
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
              ["Findings", result.summary.findingCount],
              ["Consistent", result.summary.consistentCount],
              ["Incomplete", result.summary.incompleteCount],
              ["Unresolved variance", result.summary.unresolvedVarianceCount],
              ["Material conflict", result.summary.materialConflictCount],
              [
                "Clarification requested",
                result.summary.clarificationRequestedCount,
              ],
              [
                "Third-party verification",
                result.summary.thirdPartyVerificationRecommendedCount,
              ],
              ["Human review required", result.summary.humanReviewRequiredCount],
              [
                "Fraud-accusation risk",
                result.summary.fraudAccusationRiskCount,
              ],
              [
                "Fakeness-accusation risk",
                result.summary.documentFakenessAccusationRiskCount,
              ],
              [
                "v1 readiness %",
                `${result.summary.v1OverallReadinessPercent}%`,
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
            Governed signals
          </div>
          {result.v1Signals.map((signal) => (
            <SignalCard key={signal.id} signal={signal} />
          ))}
        </section>

        <section style={{ ...panelStyle, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
            Findings ({result.findings.length})
          </div>
          {result.findings.length === 0 ? (
            <div style={{ ...mutedText, fontSize: 13 }}>
              No findings for the current posture.
            </div>
          ) : (
            result.findings.map((finding) => (
              <FindingCard key={finding.findingId} finding={finding} />
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
