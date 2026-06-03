"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  LenderApplicationInput,
  LenderQueueItem,
  LenderWorkflowResult,
  LenderWorkflowSection,
  evaluateLenderWorkflow,
} from "@/lib/lender/workflowRuntime";

/**
 * Lender Workflow Coordination Page
 *
 * Master Volume Governance:
 * - Vol I: presents accountable lender coordination state.
 * - Vol II: blocks coordination state from becoming approval, eligibility,
 *   underwriting, credit decision, or lender commitment.
 * - Vol III: uses deterministic backend-compatible coordination aggregation.
 * - Vol III-B: displays human-review and production-block posture.
 * - Vol IV: routes lender next steps to applications, overlays, evidence,
 *   property opportunities, revenue opportunities, partner workflows, and
 *   the lender dashboard.
 * - Vol V-VII: preserves disclosures, source authority, conformance, and
 *   no-live-action boundaries on lender-readable coordination output.
 */

type ApiResponse = {
  ok: boolean;
  error?: string;
  workflowResult?: LenderWorkflowResult;
  governance?: {
    traceId?: string;
    versionRuntime?: {
      ok?: boolean;
      replaySafe?: boolean;
    };
    outputClassification?: {
      classificationLevel?: string;
      sensitivityScope?: string;
    };
    explainability?: {
      humanReviewRequired?: boolean;
      confidenceScore?: number | null;
    };
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

const mutedText = {
  color: "#5d687a",
  lineHeight: 1.5,
} as const;

function StatusBadge(props: {
  tone: "ready" | "review" | "blocked" | "neutral";
  text: string;
}) {
  const tones = {
    ready: { background: "#e7f5ed", color: "#047857" },
    review: { background: "#fff7ed", color: "#9a3412" },
    blocked: { background: "#fff1f0", color: "#b42318" },
    neutral: { background: "#eef2f7", color: "#475569" },
  } as const;
  const tone = tones[props.tone];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: 28,
        padding: "0 10px",
        borderRadius: 999,
        background: tone.background,
        color: tone.color,
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {props.text}
    </span>
  );
}

function queueStatusTone(
  status: LenderQueueItem["status"]
): "ready" | "review" | "blocked" | "neutral" {
  if (status === "READY_FOR_REVIEW") {
    return "ready";
  }

  if (status === "AWAITING_REVIEW") {
    return "review";
  }

  if (status === "NEEDS_INPUT") {
    return "blocked";
  }

  return "neutral";
}

const initialApplications: LenderApplicationInput[] = [
  {
    applicationId: "app-1001",
    borrowerId: "borrower-1001",
    intakeReadinessPercent: 100,
    documentsRequested: 4,
    documentsReceived: 4,
    documentsPendingReview: 0,
    overlayCount: 2,
    overlayReviewedCount: 2,
    evidencePacketReady: true,
    borrowerPacketReady: true,
    partnerWorkflowState: "AWAITING_LENDER_REVIEW",
  },
  {
    applicationId: "app-1002",
    borrowerId: "borrower-1002",
    intakeReadinessPercent: 75,
    documentsRequested: 4,
    documentsReceived: 2,
    documentsPendingReview: 1,
    overlayCount: 1,
    overlayReviewedCount: 0,
    evidencePacketReady: false,
    borrowerPacketReady: false,
    partnerWorkflowState: "OPENED",
  },
  {
    applicationId: "app-1003",
    borrowerId: "borrower-1003",
    intakeReadinessPercent: 90,
    documentsRequested: 3,
    documentsReceived: 3,
    documentsPendingReview: 0,
    overlayCount: 2,
    overlayReviewedCount: 1,
    evidencePacketReady: true,
    borrowerPacketReady: false,
    partnerWorkflowState: "AWAITING_LENDER_REVIEW",
  },
  {
    applicationId: "app-1004",
    borrowerId: "borrower-1004",
    intakeReadinessPercent: 38,
    documentsRequested: 4,
    documentsReceived: 0,
    documentsPendingReview: 0,
    overlayCount: 0,
    overlayReviewedCount: 0,
    evidencePacketReady: false,
    borrowerPacketReady: false,
    partnerWorkflowState: "NOT_OPENED",
  },
];

function QueueItemView(props: { item: LenderQueueItem }) {
  const item = props.item;

  return (
    <article
      style={{
        ...panelStyle,
        padding: 14,
        display: "grid",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 16 }}>{item.applicationId}</h3>
          <p style={{ ...mutedText, margin: "2px 0 0" }}>
            {item.borrowerIdMasked} · {item.applicationStatus.replace(/_/g, " ")}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <StatusBadge tone={queueStatusTone(item.status)} text={item.status.replace(/_/g, " ")} />
          <StatusBadge tone="neutral" text={`${item.intakeReadinessPercent}%`} />
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 8,
          fontSize: 13,
          color: "#475569",
        }}
      >
        <span>
          Documents: {item.documents.received}/{item.documents.requested} received
          {item.documents.pendingReview > 0
            ? ` (${item.documents.pendingReview} pending)`
            : ""}
        </span>
        <span>
          Overlays: {item.overlays.reviewed}/{item.overlays.count} reviewed
        </span>
        <span>
          Evidence packet:{" "}
          {item.evidencePacketReady ? "ready" : "not ready"}
        </span>
        <span>
          Borrower packet:{" "}
          {item.borrowerPacketReady ? "ready" : "not ready"}
        </span>
        <span>
          Partner workflow:{" "}
          {(item.partnerWorkflowState ?? "NOT_OPENED").replace(/_/g, " ")}
        </span>
      </div>
      {item.reviewSignals.length > 0 ? (
        <ul style={{ margin: 0, paddingLeft: 18, color: "#475569" }}>
          {item.reviewSignals.slice(0, 3).map((signal) => (
            <li key={signal}>{signal}</li>
          ))}
        </ul>
      ) : null}
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          color: "#64748b",
          fontSize: 11,
          fontWeight: 800,
        }}
      >
        {item.blockedClaims.slice(0, 4).map((claim) => (
          <span
            key={claim}
            style={{
              border: "1px solid #d7deea",
              borderRadius: 999,
              padding: "3px 7px",
              background: "#f8fafc",
            }}
          >
            No {claim}
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {item.recommendedNextRoutes.map((route) => (
          <Link
            key={route}
            href={route}
            style={{
              color: "#1d4ed8",
              fontWeight: 800,
              textDecoration: "none",
              fontSize: 13,
            }}
          >
            {route}
          </Link>
        ))}
      </div>
    </article>
  );
}

function SectionView(props: { section: LenderWorkflowSection }) {
  const section = props.section;

  return (
    <section style={{ display: "grid", gap: 10 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>{section.label}</h2>
          <p style={{ ...mutedText, margin: "4px 0 0" }}>
            Review at {section.reviewRoute}
          </p>
        </div>
        <StatusBadge tone="neutral" text={`${section.count}`} />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 10,
        }}
      >
        {section.items.length === 0 ? (
          <p style={{ ...mutedText, margin: 0 }}>
            No items in this section for the current coordination view.
          </p>
        ) : (
          section.items.map((item) => (
            <QueueItemView key={item.applicationId} item={item} />
          ))
        )}
      </div>
    </section>
  );
}

export default function LenderWorkflowPage() {
  const [lenderId, setLenderId] = useState("lender-demo");
  const [partnerWorkflowId, setPartnerWorkflowId] = useState("");
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localResult = useMemo(
    () =>
      evaluateLenderWorkflow({
        lenderId,
        partnerWorkflowId: partnerWorkflowId || null,
        applications: initialApplications,
      }),
    [lenderId, partnerWorkflowId]
  );
  const result = apiResponse?.workflowResult ?? localResult;

  async function submitForReview() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/lender/workflow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lenderId,
          partnerWorkflowId: partnerWorkflowId || null,
          userId: lenderId,
          applications: initialApplications,
        }),
      });
      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Lender workflow request failed.");
      }

      setApiResponse(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unknown lender workflow request error."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={shellStyle}>
      <div style={containerStyle}>
        <section
          style={{
            ...panelStyle,
            padding: 22,
            display: "grid",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "grid", gap: 8, maxWidth: 760 }}>
              <span
                style={{
                  color: "#456077",
                  fontSize: 13,
                  fontWeight: 800,
                  textTransform: "uppercase",
                }}
              >
                Lender Workflow Coordination
              </span>
              <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.1 }}>
                Lender Workflow
              </h1>
              <p style={{ ...mutedText, margin: 0 }}>
                Review-bound coordination inbox across application intake,
                overlay review, evidence preparation, borrower packet
                readiness, and partner workflow state. Coordination only —
                no approval, eligibility, underwriting, credit decision, or
                lender commitment is created.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <StatusBadge tone="blocked" text="Production blocked" />
              <StatusBadge tone="review" text="Human review required" />
              <StatusBadge tone="blocked" text="Coordination only" />
              <StatusBadge tone="blocked" text="No approval" />
              <StatusBadge tone="blocked" text="No lender commitment" />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}>
                Lender ID
              </span>
              <input
                value={lenderId}
                onChange={(event) => setLenderId(event.target.value)}
                style={{
                  minHeight: 42,
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  padding: "8px 10px",
                  fontSize: 14,
                  background: "#ffffff",
                }}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}>
                Partner Workflow ID
              </span>
              <input
                value={partnerWorkflowId}
                onChange={(event) =>
                  setPartnerWorkflowId(event.target.value)
                }
                placeholder="Optional"
                style={{
                  minHeight: 42,
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  padding: "8px 10px",
                  fontSize: 14,
                  background: "#ffffff",
                }}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={submitForReview}
            disabled={submitting}
            style={{
              justifySelf: "start",
              minHeight: 42,
              border: 0,
              borderRadius: 6,
              padding: "0 16px",
              background: submitting ? "#94a3b8" : "#1d4ed8",
              color: "#ffffff",
              fontWeight: 800,
              cursor: submitting ? "default" : "pointer",
            }}
          >
            {submitting
              ? "Submitting for review..."
              : "Refresh Workflow Coordination"}
          </button>

          {error ? (
            <div
              style={{
                border: "1px solid #fecaca",
                background: "#fff1f0",
                color: "#991b1b",
                borderRadius: 8,
                padding: 12,
                fontWeight: 700,
              }}
            >
              {error}
            </div>
          ) : null}
        </section>

        <section style={{ ...panelStyle, padding: 18, display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Coordination summary</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
            }}
          >
            <div
              style={{
                border: "1px solid #d7deea",
                borderRadius: 6,
                padding: 10,
                background: "#f8fafc",
              }}
            >
              <strong style={{ fontSize: 22 }}>
                {result.totals.applicationCount}
              </strong>
              <p style={{ ...mutedText, margin: "2px 0 0" }}>
                Applications in coordination
              </p>
            </div>
            <div
              style={{
                border: "1px solid #d7deea",
                borderRadius: 6,
                padding: 10,
                background: "#f8fafc",
              }}
            >
              <strong style={{ fontSize: 22 }}>
                {result.totals.readyForReviewCount}
              </strong>
              <p style={{ ...mutedText, margin: "2px 0 0" }}>
                Packet ready for review
              </p>
            </div>
            <div
              style={{
                border: "1px solid #d7deea",
                borderRadius: 6,
                padding: 10,
                background: "#f8fafc",
              }}
            >
              <strong style={{ fontSize: 22 }}>
                {result.totals.evidencePendingCount}
              </strong>
              <p style={{ ...mutedText, margin: "2px 0 0" }}>
                Evidence pending
              </p>
            </div>
            <div
              style={{
                border: "1px solid #d7deea",
                borderRadius: 6,
                padding: 10,
                background: "#f8fafc",
              }}
            >
              <strong style={{ fontSize: 22 }}>
                {result.totals.overlayReviewPendingCount}
              </strong>
              <p style={{ ...mutedText, margin: "2px 0 0" }}>
                Overlay review pending
              </p>
            </div>
            <div
              style={{
                border: "1px solid #d7deea",
                borderRadius: 6,
                padding: 10,
                background: "#f8fafc",
              }}
            >
              <strong style={{ fontSize: 22 }}>
                {result.totals.intakeInProgressCount}
              </strong>
              <p style={{ ...mutedText, margin: "2px 0 0" }}>
                Intake in progress
              </p>
            </div>
            <div
              style={{
                border: "1px solid #d7deea",
                borderRadius: 6,
                padding: 10,
                background: "#f8fafc",
              }}
            >
              <strong style={{ fontSize: 22 }}>
                {result.totals.onHoldCount}
              </strong>
              <p style={{ ...mutedText, margin: "2px 0 0" }}>On hold</p>
            </div>
          </div>
        </section>

        <div style={{ display: "grid", gap: 22 }}>
          {result.sections.map((section) => (
            <SectionView key={section.id} section={section} />
          ))}
        </div>

        <section style={{ ...panelStyle, padding: 18, display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Governance Evidence</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: 10,
            }}
          >
            <StatusBadge
              tone={result.productionBlocked ? "blocked" : "ready"}
              text="Production blocked"
            />
            <StatusBadge
              tone={result.humanReviewRequired ? "review" : "ready"}
              text="Human review required"
            />
            <StatusBadge tone="blocked" text="Coordination only" />
            <StatusBadge tone="blocked" text="No underwriting reliance" />
            <StatusBadge tone="blocked" text="No lender commitment" />
            <StatusBadge tone="blocked" text="No credit decision" />
          </div>
          {apiResponse?.governance ? (
            <p style={{ ...mutedText, margin: 0 }}>
              Trace {apiResponse.governance.traceId ?? "pending"} · version
              runtime{" "}
              {apiResponse.governance.versionRuntime?.ok ? "passed" : "pending"} ·
              classification{" "}
              {apiResponse.governance.outputClassification?.classificationLevel ??
                "pending"}
            </p>
          ) : (
            <p style={{ ...mutedText, margin: 0 }}>
              Local preview is shown until the lender submits the coordination
              view for governed API review.
            </p>
          )}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {result.recommendedNextRoutes.map((route) => (
              <Link
                key={route}
                href={route}
                style={{
                  color: "#1d4ed8",
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                {route}
              </Link>
            ))}
          </div>
        </section>

        <section style={{ ...panelStyle, padding: 18 }}>
          <h2 style={{ marginTop: 0, fontSize: 22 }}>Disclosures</h2>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#475569" }}>
            {result.disclosures.slice(0, 14).map((disclosure) => (
              <li key={disclosure}>{disclosure}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
