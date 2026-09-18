"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  LenderWorkflowV2ApplicationBriefing,
  LenderWorkflowV2CrossSourceConflict,
  LenderWorkflowV2Input,
  LenderWorkflowV2Result,
  composeLenderWorkflowV2,
} from "@/lib/lender/workflowV2Runtime";

type ApiResponse = {
  ok: boolean;
  error?: string;
  v2Result?: LenderWorkflowV2Result;
  governance?: {
    traceId?: string;
    versionRuntime?: { ok?: boolean };
    outputClassification?: { classificationLevel?: string };
  };
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

const inputStyle = {
  width: "100%",
  minHeight: 42,
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  padding: "8px 10px",
  fontSize: 14,
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

function ConflictCard(props: {
  conflict: LenderWorkflowV2CrossSourceConflict;
}) {
  return (
    <div
      style={{
        ...panelStyle,
        padding: 10,
        marginBottom: 6,
        borderLeft: "4px solid #c14757",
        background: "#fde4e4",
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 12 }}>{props.conflict.topic}</div>
      <div style={{ ...mutedText, fontSize: 11 }}>
        {props.conflict.description}
      </div>
    </div>
  );
}

function ApplicationBriefingCard(props: {
  briefing: LenderWorkflowV2ApplicationBriefing;
}) {
  const { briefing } = props;
  return (
    <div style={{ ...panelStyle, padding: 16, marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 8,
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>
            Application {briefing.applicationId}
          </div>
          <div style={{ ...mutedText, fontSize: 12 }}>
            queue status {briefing.queueItem.status} · application status{" "}
            {briefing.queueItem.applicationStatus} · intake readiness{" "}
            {briefing.queueItem.intakeReadinessPercent}%
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <StatusBadge tone="review" label={briefing.queueItem.status} />
          {briefing.queueItem.evidencePacketReady && (
            <StatusBadge tone="ready" label="evidence packet ready" />
          )}
          {briefing.queueItem.borrowerPacketReady && (
            <StatusBadge tone="ready" label="borrower packet ready" />
          )}
        </div>
      </div>

      {briefing.customerProfiles.length === 0 ? (
        <div style={{ ...mutedText, fontSize: 13 }}>
          No matched customer types under the current application context.
        </div>
      ) : (
        briefing.customerProfiles.map((profile) => (
          <div
            key={profile.customerType.typeId}
            style={{
              ...panelStyle,
              padding: 10,
              marginBottom: 6,
              background: "#f6f8fb",
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 13 }}>
              {profile.customerType.label}
            </div>
            <div style={{ ...mutedText, fontSize: 11 }}>
              grant cards {profile.grantCardCount} · sovereign{" "}
              {profile.sovereignCardCount} · federation gated{" "}
              {profile.federationGatedCount} · review required{" "}
              {profile.reviewRequiredCount} · missing info{" "}
              {profile.missingInformationCount}
            </div>
            {profile.topGrantCards.length > 0 && (
              <ul
                style={{
                  marginLeft: 16,
                  ...mutedText,
                  fontSize: 11,
                  marginTop: 4,
                }}
              >
                {profile.topGrantCards.map((card) => (
                  <li key={card.programId}>
                    {card.programName} · fit {card.capitalFitScore.toFixed(2)}{" "}
                    · {card.pathwayStatus}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))
      )}

      {briefing.crossSourceConflicts.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
            Cross-source conflicts ({briefing.crossSourceConflicts.length})
          </div>
          {briefing.crossSourceConflicts.map((conflict) => (
            <ConflictCard key={conflict.conflictId} conflict={conflict} />
          ))}
        </div>
      )}
    </div>
  );
}

const defaultApplicationsJson = JSON.stringify(
  [
    {
      applicationId: "app-001",
      borrowerId: "borrower-001",
      status: "REVIEW_IN_PROGRESS",
      intakeReadinessPercent: 88,
      documentsRequested: 6,
      documentsReceived: 5,
      documentsPendingReview: 1,
      overlayCount: 2,
      overlayReviewedCount: 1,
      evidencePacketReady: false,
      borrowerPacketReady: true,
      declaredCustomerTypes: ["beginning farmer"],
      intendedUses: ["specialty crops", "operating capital"],
      jurisdiction: { federal: true, state: "MD" },
      location: { country: "US", state: "MD" },
      farmTypes: ["specialty crops"],
      goals: ["operating capital"],
      acreage: 40,
      requestedAmount: 250000,
    },
    {
      applicationId: "app-002",
      borrowerId: "borrower-002",
      status: "PACKET_READY_FOR_REVIEW",
      intakeReadinessPercent: 96,
      documentsRequested: 6,
      documentsReceived: 6,
      documentsPendingReview: 0,
      overlayCount: 1,
      overlayReviewedCount: 1,
      evidencePacketReady: true,
      borrowerPacketReady: true,
      declaredCustomerTypes: ["rural small business"],
      intendedUses: ["energy efficiency"],
      jurisdiction: { federal: true, state: "VA" },
      location: { country: "US", state: "VA" },
      farmTypes: [],
      goals: ["infrastructure"],
      acreage: null,
      requestedAmount: 500000,
    },
  ],
  null,
  2
);

export default function LenderWorkflowV2Page() {
  const [reviewerRole, setReviewerRole] = useState(
    "Qualified Governance Reviewer"
  );
  const [lenderId, setLenderId] = useState("lender-preview");
  const [partnerWorkflowId, setPartnerWorkflowId] = useState("");
  const [sovereignAllowed, setSovereignAllowed] = useState(false);
  const [applicationsText, setApplicationsText] = useState(
    defaultApplicationsJson
  );
  const [serverResult, setServerResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const parsedApplications = useMemo(() => {
    try {
      return { applications: JSON.parse(applicationsText), error: null };
    } catch (e) {
      return {
        applications: [],
        error: e instanceof Error ? e.message : "Unable to parse applications JSON.",
      };
    }
  }, [applicationsText]);
  const parseError = parsedApplications.error;

  const localInput = useMemo<LenderWorkflowV2Input>(() => ({
    reviewerRole,
    lenderId,
    partnerWorkflowId: partnerWorkflowId || null,
    applications: parsedApplications.applications,
    scope: { sovereignFederationAllowed: sovereignAllowed },
  }), [
    reviewerRole,
    lenderId,
    partnerWorkflowId,
    parsedApplications.applications,
    sovereignAllowed,
  ]);

  const previewResult = useMemo(
    () => composeLenderWorkflowV2(localInput),
    [localInput]
  );

  const result = serverResult?.v2Result ?? previewResult;

  async function runComposition() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/governance/lender-workflow-v2", {
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
                Lender Workflow v2
              </div>
              <div style={{ ...mutedText, marginTop: 4 }}>
                Internal governance coordination over Opportunity Discovery
                v2, Financing Pathway Engine v2, Revenue Intelligence v2,
                Customer Type Registry, Capital Graph, and the legacy v1
                lender workflow. Coordination only — no autonomous
                opportunity, pathway, eligibility, credit, lender commitment,
                underwriting, borrower notice, or payment authorization is
                produced; no live external fetch is performed; no
                source-certainty claim is made.
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <StatusBadge tone="blocked" label="Production blocked" />
              <StatusBadge tone="review" label="Human review required" />
              <StatusBadge tone="neutral" label="Replay safe" />
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
                style={inputStyle}
                value={reviewerRole}
                onChange={(e) => setReviewerRole(e.target.value)}
              />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Lender ID</span>
              <input
                style={inputStyle}
                value={lenderId}
                onChange={(e) => setLenderId(e.target.value)}
              />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                Partner workflow ID
              </span>
              <input
                style={inputStyle}
                value={partnerWorkflowId}
                onChange={(e) => setPartnerWorkflowId(e.target.value)}
              />
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
          <div style={{ marginTop: 12 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                display: "block",
                marginBottom: 4,
              }}
            >
              Applications JSON
            </span>
            <textarea
              style={{
                ...inputStyle,
                fontFamily:
                  'ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace',
                fontSize: 12,
                minHeight: 220,
              }}
              value={applicationsText}
              onChange={(e) => setApplicationsText(e.target.value)}
            />
            {parseError && (
              <div
                style={{ color: "#80222d", fontSize: 12, marginTop: 4 }}
              >
                Parse error: {parseError}
              </div>
            )}
          </div>
          <div style={{ marginTop: 14 }}>
            <button
              onClick={runComposition}
              disabled={loading || !!parseError}
              style={{
                padding: "10px 16px",
                background: "#1f4dd8",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: loading || parseError ? "default" : "pointer",
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
              ["Applications", result.summary.applicationCount],
              [
                "With customer profiles",
                result.summary.applicationsWithCustomerProfilesCount,
              ],
              ["Grant cards", result.summary.totalGrantCardCount],
              ["Conflict signals", result.summary.conflictSignalCount],
              [
                "Cross-source conflicts",
                result.summary.crossSourceConflictCount,
              ],
              ["Ready for review", result.summary.readyForReviewCount],
              ["Evidence pending", result.summary.evidencePendingCount],
              ["Overlay pending", result.summary.overlayReviewPendingCount],
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
            Application briefings ({result.applicationBriefings.length})
          </div>
          {result.applicationBriefings.length === 0 ? (
            <div style={mutedText}>No applications provided.</div>
          ) : (
            result.applicationBriefings.map((briefing) => (
              <ApplicationBriefingCard
                key={briefing.applicationId}
                briefing={briefing}
              />
            ))
          )}
        </section>

        <section style={{ ...panelStyle, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
            Legacy v1 lender sections ({result.legacySections.length})
          </div>
          {result.legacySections.map((section) => (
            <div
              key={section.id}
              style={{
                ...panelStyle,
                padding: 10,
                marginBottom: 6,
                background: "#f6f8fb",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13 }}>
                {section.label} ({section.count})
              </div>
              <div style={{ ...mutedText, fontSize: 11 }}>
                review route: {section.reviewRoute}
              </div>
            </div>
          ))}
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
