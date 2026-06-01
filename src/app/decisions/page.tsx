"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ADVISORY_ONLY_DISCLOSURE,
  BORROWER_PORTABILITY_DISCLOSURE,
  LENDER_READY_DISCLOSURE,
  evaluateContentClaims,
} from "@/lib/governance/contentClaimsPolicy";
import {
  ActionButton,
  EmptyState,
  FieldLabel,
  LoadResult,
  ModuleHeader,
  ModuleScope,
  StatusPill,
  SummaryGrid,
  emptyScope,
  formatDateTime,
  inputStyle,
  isRecord,
  loadJsonSurface,
  moduleContainerStyle,
  moduleShellStyle,
  normalizeStatus,
  panelStyle,
  primaryRecord,
  scopeFromApplicationRows,
  scopeQuery,
  shortId,
  stringValue,
} from "@/app/internalModuleKit";

/**
 * Module 07 - Decision Finalization Controls
 *
 * Master Volume Governance:
 * - Vol I: requires accountable authority before final regulated action.
 * - Vol II: preserves adverse-action, appeal, disclosure, and reason-code gates.
 * - Vol III: records replay-safe final-action control state.
 * - Vol III-B: surfaces guard, version, classification, observability, and evidence posture.
 * - Vol IV: supports escalation, final-action review, notice prep, and audit readiness.
 * - Vol V: enforces controlled disclosure, human review, replay, and non-automation doctrine.
 */

const actorId = "module-07-decision-finalization-controls";

type ModuleData = {
  applications: LoadResult;
  reviews: LoadResult;
  scope: ModuleScope;
};

const emptyLoad: LoadResult = {
  ok: true,
  count: 0,
  rows: [],
  traceId: null,
  error: null,
  json: null,
};

function reviewRecord(row: unknown): Record<string, unknown> {
  return primaryRecord(row, ["humanReview"]);
}

function reviewIdFromRow(row: unknown): string | null {
  return stringValue(reviewRecord(row).id);
}

function selectedReviewFromRows(rows: unknown[], selectedId: string | null) {
  return rows.find((row) => reviewIdFromRow(row) === selectedId) ?? rows[0] ?? null;
}

function adverseActionId(row: unknown): string | null {
  if (!isRecord(row) || !Array.isArray(row.adverseActionReviews)) {
    return null;
  }

  const first = row.adverseActionReviews[0];

  return isRecord(first) ? stringValue(first.id) : null;
}

function outcomeRequiresAppeal(outcome: string): boolean {
  return outcome === "DENY" || outcome === "WITHDRAW" || outcome === "INCOMPLETE";
}

export default function DecisionFinalizationControlsPage() {
  const [data, setData] = useState<ModuleData>({
    applications: emptyLoad,
    reviews: emptyLoad,
    scope: emptyScope,
  });
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [requestedOutcome, setRequestedOutcome] = useState("REVIEW_REQUIRED");
  const [disclosureStatus, setDisclosureStatus] = useState(
    "DISCLOSURE_REVIEW_REQUIRED"
  );
  const [explanationSummary, setExplanationSummary] = useState(
    "Internal final-action gate review recorded from Module 07."
  );

  const loadAll = useCallback(async () => {
    setRefreshing(true);
    setActionMessage(null);

    const applications = await loadJsonSurface(
      `/api/applications/admin?role=governance&userId=${actorId}&limit=10&includeProperty=true`,
      ["applications"]
    );
    const scope = scopeFromApplicationRows(applications.rows);
    const reviews =
      scope.applicationId || scope.tenantId || scope.borrowerId
        ? await loadJsonSurface(
            `/api/reviews/admin?role=governance&userId=${actorId}${scopeQuery(
              scope
            )}&limit=12&includeApplication=true&includeProperty=true&includeAdverseActionReviews=true&includeTransitions=true`,
            ["reviews"]
          )
        : emptyLoad;
    const nextReview = selectedReviewFromRows(reviews.rows, selectedReviewId);

    setSelectedReviewId(nextReview ? reviewIdFromRow(nextReview) : null);
    setData({ applications, reviews, scope });
    setLastLoadedAt(new Date().toLocaleTimeString());
    setRefreshing(false);
  }, [selectedReviewId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const selectedReview = useMemo(() => {
    return selectedReviewFromRows(data.reviews.rows, selectedReviewId);
  }, [data.reviews.rows, selectedReviewId]);

  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 07 Decision Finalization Controls",
        "Internal final-action gate surface",
        ADVISORY_ONLY_DISCLOSURE,
        BORROWER_PORTABILITY_DISCLOSURE,
        LENDER_READY_DISCLOSURE,
      ],
      context: {
        borrowerPortabilityAvailable: true,
        freeTierBaselineReadinessAvailable: true,
        lenderReadyDisclosurePresent: true,
      },
    });
  }, []);

  const recordFinalizationGate = useCallback(async () => {
    const review = selectedReview ? reviewRecord(selectedReview) : {};
    const humanReviewWorkflowId = stringValue(review.id);

    if (!data.scope.applicationId || !data.scope.tenantId || !humanReviewWorkflowId) {
      setActionMessage("A governed application and selected human review are required.");
      return;
    }

    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch("/api/decisions/finalize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "governance",
          userId: actorId,
          applicationId: data.scope.applicationId,
          borrowerId: data.scope.borrowerId,
          tenantId: data.scope.tenantId,
          humanReviewWorkflowId,
          adverseActionReviewId: adverseActionId(selectedReview),
          decisionType: outcomeRequiresAppeal(requestedOutcome)
            ? "ADVERSE_ACTION_NOTICE"
            : "CREDIT_DECISION",
          requestedOutcome,
          finalActionRequested: true,
          disclosureStatus,
          appealRightsIncluded: outcomeRequiresAppeal(requestedOutcome),
          reasonCodes: outcomeRequiresAppeal(requestedOutcome)
            ? ["ADVERSE_ACTION_REVIEW_REQUIRED", "HUMAN_REVIEW_GATE"]
            : ["HUMAN_REVIEW_GATE"],
          explanationSummary,
          noticeSummary:
            "Notice preparation remains controlled by Module 08 and does not perform external delivery.",
          metadata: {
            module: "Module 07 - Decision Finalization Controls",
            noticeDeliveryPerformed: false,
            platformDecisionAuthority: false,
          },
        }),
      });
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ?? "Final-action gate returned review."
        );
      } else {
        const decisionNotice = isRecord(json.decisionNotice)
          ? json.decisionNotice
          : {};
        const result = isRecord(json.result) ? json.result : {};

        setActionMessage(
          `Gate recorded: ${shortId(decisionNotice.id)} / ${normalizeStatus(
            decisionNotice.finalDecisionStatus
          )} / ${stringValue(result.message) ?? "Review recorded"}`
        );
        await loadAll();
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown finalization gate action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [
    data.scope,
    disclosureStatus,
    explanationSummary,
    loadAll,
    requestedOutcome,
    selectedReview,
  ]);

  const selectedReviewRecord = selectedReview ? reviewRecord(selectedReview) : {};
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    `Scope ${data.scope.applicationId ?? data.scope.tenantId ?? "Unscoped"}`,
    "Final-Action Gate",
    "Notice Delivery Boundary",
  ];

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="07"
          title="Decision Finalization Controls"
          subtitle="Internal final-action gate records for reviewed application workflows."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Human Reviews",
              value: data.reviews.count,
              color: "#7c3aed",
            },
            {
              label: "Applications",
              value: data.applications.count,
              color: "#2563eb",
            },
            {
              label: "Selected Review",
              value: shortId(selectedReviewRecord.id),
              color: "#0f766e",
            },
            {
              label: "Last Refresh",
              value: lastLoadedAt ?? "Not loaded",
              color: "#334155",
            },
          ]}
        />

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(280px, 0.9fr) minmax(0, 1.4fr)",
            gap: 16,
            alignItems: "start",
          }}
        >
          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Final-Action Gate</h2>
            <FieldLabel label="Human review workflow">
              <select
                value={selectedReviewId ?? ""}
                onChange={(event) => setSelectedReviewId(event.target.value)}
                style={inputStyle}
              >
                {data.reviews.rows.length === 0 ? (
                  <option value="">No review workflow available</option>
                ) : null}
                {data.reviews.rows.map((row) => {
                  const review = reviewRecord(row);
                  const id = stringValue(review.id) ?? "";

                  return (
                    <option key={id} value={id}>
                      {shortId(id)} / {normalizeStatus(review.status)}
                    </option>
                  );
                })}
              </select>
            </FieldLabel>
            <FieldLabel label="Requested outcome">
              <select
                value={requestedOutcome}
                onChange={(event) => setRequestedOutcome(event.target.value)}
                style={inputStyle}
              >
                <option value="REVIEW_REQUIRED">Review required</option>
                <option value="CONDITIONAL_APPROVAL">Conditional approval review</option>
                <option value="APPROVE">Approve review</option>
                <option value="DENY">Denial review</option>
                <option value="INCOMPLETE">Incomplete review</option>
                <option value="WITHDRAW">Withdraw review</option>
              </select>
            </FieldLabel>
            <FieldLabel label="Disclosure status">
              <select
                value={disclosureStatus}
                onChange={(event) => setDisclosureStatus(event.target.value)}
                style={inputStyle}
              >
                <option value="DISCLOSURE_REVIEW_REQUIRED">
                  Disclosure review required
                </option>
                <option value="APPROVED_FOR_BORROWER_DISCLOSURE">
                  Approved for borrower disclosure
                </option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </FieldLabel>
            <FieldLabel label="Explanation summary">
              <textarea
                value={explanationSummary}
                onChange={(event) => setExplanationSummary(event.target.value)}
                style={{ ...inputStyle, minHeight: 86, paddingTop: 8 }}
              />
            </FieldLabel>
            <ActionButton
              disabled={
                actionBusy || !data.scope.applicationId || !selectedReviewId
              }
              onClick={() => void recordFinalizationGate()}
            >
              Record Final-Action Gate
            </ActionButton>
            {actionMessage ? (
              <p style={{ margin: 0, color: "#334155", lineHeight: 1.5 }}>
                {actionMessage}
              </p>
            ) : null}
            <p style={{ margin: 0, color: "#64748b", lineHeight: 1.5 }}>
              This module records controlled final-action posture only. Notice
              packet preparation remains separated in Module 08.
            </p>
          </div>

          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Review Gate Inputs</h2>
            {data.reviews.rows.length === 0 ? (
              <EmptyState>
                No human review workflows are available for final-action gate
                review.
              </EmptyState>
            ) : (
              data.reviews.rows.map((row) => {
                const review = reviewRecord(row);
                const id = stringValue(review.id);

                return (
                  <button
                    key={id ?? JSON.stringify(row)}
                    type="button"
                    onClick={() => setSelectedReviewId(id)}
                    style={{
                      display: "grid",
                      gap: 8,
                      padding: 12,
                      border:
                        id === selectedReviewId
                          ? "2px solid #1f4f7a"
                          : "1px solid #e2e8f0",
                      borderRadius: 8,
                      background: "#ffffff",
                      color: "#172033",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                      }}
                    >
                      <strong>{shortId(id)}</strong>
                      <StatusPill ok={review.finalActionAllowed === true}>
                        {normalizeStatus(review.status)}
                      </StatusPill>
                    </div>
                    <span style={{ color: "#475569" }}>
                      Candidate {normalizeStatus(review.candidateOutcome)} /
                      Priority {normalizeStatus(review.priority)}
                    </span>
                    <span style={{ color: "#64748b", fontSize: 13 }}>
                      Created {formatDateTime(review.createdAt)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
