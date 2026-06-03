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
 * Module 05 - Human Review and Transition Console
 *
 * Master Volume Governance:
 * - Vol I: requires accountable human review before regulated reliance.
 * - Vol II: preserves adverse-action, explanation, appeal, and notice boundaries.
 * - Vol III: consumes replay-safe review and transition control runtimes.
 * - Vol III-B: surfaces version, classification, observability, and evidence posture.
 * - Vol IV: supports escalation, recovery, review resolution, and audit prep.
 * - Vol V: enforces non-final output, controlled disclosure, and replay doctrine.
 */

const actorId = "module-05-human-review-console";

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

function reviewIdFromRow(row: unknown): string | null {
  const review = primaryRecord(row, ["humanReview"]);

  return stringValue(review.id);
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

function transitionCount(row: unknown): number {
  if (!isRecord(row) || !Array.isArray(row.transitions)) {
    return 0;
  }

  return row.transitions.length;
}

function reviewSummary(row: unknown): string {
  const review = primaryRecord(row, ["humanReview"]);

  return [
    normalizeStatus(review.status),
    `Priority ${normalizeStatus(review.priority)}`,
    `Candidate ${normalizeStatus(review.candidateOutcome)}`,
  ].join(" / ");
}

export default function HumanReviewConsolePage() {
  const [data, setData] = useState<ModuleData>({
    applications: emptyLoad,
    reviews: emptyLoad,
    scope: emptyScope,
  });
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewPriority, setReviewPriority] = useState("HIGH");
  const [candidateOutcome, setCandidateOutcome] = useState("REVIEW_REQUIRED");
  const [transitionOutcome, setTransitionOutcome] = useState("APPROVE");
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);

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
        "Module 05 Human Review Console",
        "Internal transition-control surface",
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

  const queueHumanReview = useCallback(async () => {
    if (!data.scope.applicationId || !data.scope.tenantId) {
      setActionMessage("A governed application scope is required.");
      return;
    }

    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch("/api/reviews/human", {
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
          reviewType: "regulated_decision_review",
          sourceType: "module_05_review_console",
          sourceId: data.scope.applicationId,
          sourceTraceId: data.applications.traceId,
          priority: reviewPriority,
          requiredReviewerRole: "authorized-underwriter",
          candidateOutcome,
          adverseActionCandidate:
            candidateOutcome === "DENIAL_REVIEW" ||
            candidateOutcome === "ADVERSE_ACTION_REVIEW",
          reasonCodes:
            candidateOutcome === "DENIAL_REVIEW"
              ? ["DENIAL_REVIEW_REQUIRED"]
              : ["HUMAN_REVIEW_REQUIRED"],
          explanationSummary:
            "Internal human review workflow queued from Module 05.",
          metadata: {
            module: "Module 05 - Human Review Console",
            finalDecision: false,
            borrowerNoticeDelivery: false,
          },
        }),
      });
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ?? "Human review workflow returned review."
        );
      } else {
        const review = isRecord(json.humanReview) ? json.humanReview : {};
        setSelectedReviewId(stringValue(review.id));
        setActionMessage(`Human review queued: ${shortId(review.id)}`);
        await loadAll();
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error ? error.message : "Unknown human review action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [candidateOutcome, data.applications.traceId, data.scope, loadAll, reviewPriority]);

  const runTransitionGate = useCallback(async () => {
    const review = selectedReview ? primaryRecord(selectedReview, ["humanReview"]) : {};
    const humanReviewWorkflowId = stringValue(review.id);

    if (!humanReviewWorkflowId || !data.scope.applicationId || !data.scope.tenantId) {
      setActionMessage("A selected human-review workflow is required.");
      return;
    }

    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch("/api/reviews/transition", {
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
          transitionType: "APPROVE_FOR_FINAL_ACTION",
          requestedStatus: "APPROVED_FOR_FINAL_ACTION",
          reviewOutcome: transitionOutcome,
          reviewerRole: "underwriter",
          reviewerAttestationRef: `module-05-attestation-${Date.now()}`,
          approvalAuthorityRef: "module-05-governance-authority",
          reasonCodes:
            transitionOutcome === "DENY"
              ? ["DENIAL_REVIEW_REQUIRED"]
              : ["HUMAN_REVIEW_COMPLETED"],
          explanationSummary:
            "Internal review transition gate evaluated from Module 05.",
          disclosureReviewCompleted: true,
          appealRightsPrepared: true,
          metadata: {
            module: "Module 05 - Human Review Console",
            finalDecision: false,
            borrowerNoticeDelivery: false,
          },
        }),
      });
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ?? "Review transition returned review."
        );
      } else {
        const result = isRecord(json.result) ? json.result : {};
        setActionMessage(
          `Transition gate recorded: ${
            result.finalActionAllowed === true ? "eligible" : "held"
          }`
        );
        await loadAll();
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown review transition action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [data.scope, loadAll, selectedReview, transitionOutcome]);

  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    `Scope ${data.scope.applicationId ?? data.scope.tenantId ?? "Unscoped"}`,
    "Not A Notice",
    "No Provider Send",
  ];

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="05"
          title="Human Review"
          subtitle="Internal human-review workflow and transition-control console for regulated review posture."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Review Records",
              value: data.reviews.count,
              color: "#7c3aed",
            },
            {
              label: "Applications",
              value: data.applications.count,
              color: "#2563eb",
            },
            {
              label: "Selected Transitions",
              value: selectedReview ? transitionCount(selectedReview) : 0,
              color: "#b45309",
            },
            {
              label: "Last Refresh",
              value: lastLoadedAt ?? "Loading",
              color: "#334155",
            },
          ]}
        />

        <section
          aria-label="Human review actions"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 12,
          }}
        >
          <article style={{ ...panelStyle, padding: 16, display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Queue Review</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
              }}
            >
              <FieldLabel label="Priority">
                <select
                  value={reviewPriority}
                  onChange={(event) => setReviewPriority(event.target.value)}
                  style={inputStyle}
                >
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </FieldLabel>

              <FieldLabel label="Candidate Outcome">
                <select
                  value={candidateOutcome}
                  onChange={(event) => setCandidateOutcome(event.target.value)}
                  style={inputStyle}
                >
                  <option value="REVIEW_REQUIRED">Review Required</option>
                  <option value="CONDITIONAL_REVIEW">Conditional Review</option>
                  <option value="DENIAL_REVIEW">Denial Review</option>
                  <option value="ADVERSE_ACTION_REVIEW">
                    Adverse Action Review
                  </option>
                </select>
              </FieldLabel>
            </div>
            <ActionButton
              disabled={actionBusy || !data.scope.applicationId}
              onClick={() => void queueHumanReview()}
            >
              {actionBusy ? "Recording" : "Queue Human Review"}
            </ActionButton>
          </article>

          <article style={{ ...panelStyle, padding: 16, display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Transition Gate</h2>
            <FieldLabel label="Review Outcome">
              <select
                value={transitionOutcome}
                onChange={(event) => setTransitionOutcome(event.target.value)}
                style={inputStyle}
              >
                <option value="APPROVE">Approve</option>
                <option value="CONDITIONAL_APPROVAL">Conditional Approval</option>
                <option value="RETURN_FOR_REVISION">Return For Revision</option>
                <option value="DENY">Deny</option>
              </select>
            </FieldLabel>
            <ActionButton
              disabled={actionBusy || !selectedReview}
              onClick={() => void runTransitionGate()}
            >
              {actionBusy ? "Evaluating" : "Evaluate Transition Gate"}
            </ActionButton>
          </article>
        </section>

        {actionMessage ? (
          <section
            aria-label="Action result"
            style={{ ...panelStyle, padding: 14, color: "#334155", fontWeight: 800 }}
          >
            {actionMessage}
          </section>
        ) : null}

        <section
          aria-label="Human review records"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(280px, 0.8fr) minmax(0, 1.4fr)",
            gap: 12,
          }}
        >
          <aside style={{ display: "grid", gap: 12, alignContent: "start" }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Review Queue</h2>
            {data.reviews.rows.length > 0 ? (
              data.reviews.rows.map((row, index) => {
                const review = primaryRecord(row, ["humanReview"]);
                const id = stringValue(review.id);
                const active = id === selectedReviewId;

                return (
                  <button
                    key={`${id ?? "review"}-${index}`}
                    type="button"
                    onClick={() => setSelectedReviewId(id)}
                    style={{
                      ...panelStyle,
                      padding: 14,
                      textAlign: "left",
                      display: "grid",
                      gap: 8,
                      borderColor: active ? "#7c3aed" : "#d5dce8",
                      cursor: "pointer",
                    }}
                  >
                    <strong style={{ overflowWrap: "anywhere" }}>
                      {shortId(id)}
                    </strong>
                    <span style={{ color: "#334155", fontSize: 13 }}>
                      {reviewSummary(row)}
                    </span>
                    <span style={{ color: "#64748b", fontSize: 12 }}>
                      Transitions {transitionCount(row)}
                    </span>
                  </button>
                );
              })
            ) : (
              <EmptyState>No human-review records in current scope.</EmptyState>
            )}
          </aside>

          <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Selected Review</h2>
            {selectedReview ? (
              <article style={{ ...panelStyle, padding: 16, display: "grid", gap: 14 }}>
                {(() => {
                  const review = primaryRecord(selectedReview, ["humanReview"]);

                  return (
                    <>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          alignItems: "flex-start",
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ display: "grid", gap: 4 }}>
                          <h3 style={{ margin: 0, fontSize: 20 }}>
                            {shortId(review.id)}
                          </h3>
                          <span style={{ color: "#596579" }}>
                            {reviewSummary(selectedReview)}
                          </span>
                        </div>
                        <StatusPill ok={data.reviews.ok}>
                          {normalizeStatus(review.status)}
                        </StatusPill>
                      </div>

                      <dl
                        style={{
                          display: "grid",
                          gridTemplateColumns: "190px 1fr",
                          gap: 8,
                          margin: 0,
                          fontSize: 14,
                        }}
                      >
                        <dt style={{ color: "#596579", fontWeight: 800 }}>
                          Application
                        </dt>
                        <dd style={{ margin: 0, overflowWrap: "anywhere" }}>
                          {shortId(review.applicationId)}
                        </dd>

                        <dt style={{ color: "#596579", fontWeight: 800 }}>
                          Required Role
                        </dt>
                        <dd style={{ margin: 0 }}>
                          {normalizeStatus(review.requiredReviewerRole)}
                        </dd>

                        <dt style={{ color: "#596579", fontWeight: 800 }}>
                          Final Action Allowed
                        </dt>
                        <dd style={{ margin: 0 }}>
                          {review.finalActionAllowed === true ? "Yes" : "No"}
                        </dd>

                        <dt style={{ color: "#596579", fontWeight: 800 }}>
                          Created
                        </dt>
                        <dd style={{ margin: 0 }}>
                          {formatDateTime(review.createdAt)}
                        </dd>
                      </dl>
                    </>
                  );
                })()}
              </article>
            ) : (
              <EmptyState>Select or queue a human-review workflow.</EmptyState>
            )}

            <section
              aria-label="Transition records"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 12,
              }}
            >
              {selectedReview &&
              isRecord(selectedReview) &&
              Array.isArray(selectedReview.transitions) &&
              selectedReview.transitions.length > 0 ? (
                selectedReview.transitions.slice(0, 6).map((transition, index) => {
                  const record = isRecord(transition) ? transition : {};

                  return (
                    <article
                      key={`${stringValue(record.id) ?? "transition"}-${index}`}
                      style={{
                        ...panelStyle,
                        padding: 14,
                        display: "grid",
                        gap: 8,
                      }}
                    >
                      <strong style={{ overflowWrap: "anywhere" }}>
                        {shortId(record.id)}
                      </strong>
                      <span style={{ color: "#334155", fontSize: 13 }}>
                        {normalizeStatus(record.transitionStatus)} /{" "}
                        {normalizeStatus(record.reviewOutcome)}
                      </span>
                      <span style={{ color: "#64748b", fontSize: 12 }}>
                        Final action:{" "}
                        {record.finalActionAllowed === true ? "Allowed" : "Held"}
                      </span>
                    </article>
                  );
                })
              ) : (
                <EmptyState>No transition records for selected review.</EmptyState>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

