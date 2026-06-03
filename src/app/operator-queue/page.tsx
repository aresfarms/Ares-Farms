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
 * Module 02 - Operator Work Queue and Review Console
 *
 * Master Volume Governance:
 * - Vol I: preserves accountable internal review authority.
 * - Vol II: protects borrower/application workflow data.
 * - Vol III: consumes replay-safe queue and review runtimes.
 * - Vol III-B: surfaces runtime, access, classification, and evidence posture.
 * - Vol IV: supports operator queue review, escalation, assignment, and recovery.
 * - Vol V: preserves non-final decision, disclosure, portability, and claims limits.
 */

const actorId = "module-02-operator-work-queue";

type ModuleData = {
  applications: LoadResult;
  queues: LoadResult;
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

function queueTitle(row: unknown): string {
  const queueItem = primaryRecord(row, ["queueItem"]);

  return normalizeStatus(queueItem.queueType ?? "Operator queue item");
}

function queueMeta(row: unknown): string {
  const queueItem = primaryRecord(row, ["queueItem"]);
  const parts = [
    `Priority ${normalizeStatus(queueItem.priority)}`,
    `Escalation ${normalizeStatus(queueItem.escalationStatus)}`,
    `Required ${normalizeStatus(queueItem.requiredRole)}`,
  ];

  return parts.join(" / ");
}

function applicationLabel(row: unknown): string {
  const application = primaryRecord(row, ["application"]);
  const property = isRecord(row) && isRecord(row.property) ? row.property : {};
  const name = stringValue(property.name);
  const state = stringValue(property.state);

  return [
    shortId(application.id),
    name ? `Property ${name}` : null,
    state ? `State ${state}` : null,
  ]
    .filter(Boolean)
    .join(" / ");
}

function reviewLabel(row: unknown): string {
  const review = primaryRecord(row, ["humanReview"]);

  return [
    shortId(review.id),
    normalizeStatus(review.status),
    normalizeStatus(review.priority),
  ].join(" / ");
}

export default function OperatorQueuePage() {
  const [data, setData] = useState<ModuleData>({
    applications: emptyLoad,
    queues: emptyLoad,
    reviews: emptyLoad,
    scope: emptyScope,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [queuePriority, setQueuePriority] = useState("HIGH");

  const loadAll = useCallback(async () => {
    setRefreshing(true);
    setActionMessage(null);

    const applications = await loadJsonSurface(
      `/api/applications/admin?role=governance&userId=${actorId}&limit=10&includeProperty=true`,
      ["applications"]
    );
    const scope = scopeFromApplicationRows(applications.rows);
    const scoped = scope.applicationId || scope.tenantId || scope.borrowerId;
    const [queues, reviews] = scoped
      ? await Promise.all([
          loadJsonSurface(
            `/api/queues/admin?role=governance&userId=${actorId}${scopeQuery(
              scope
            )}&status=OPEN&limit=12&includeApplication=true&includeProperty=true`,
            ["queueItems"]
          ),
          loadJsonSurface(
            `/api/reviews/admin?role=governance&userId=${actorId}${scopeQuery(
              scope
            )}&limit=8&includeApplication=true&includeProperty=true&includeAdverseActionReviews=true&includeTransitions=true`,
            ["reviews"]
          ),
        ])
      : [emptyLoad, emptyLoad];

    setData({ applications, queues, reviews, scope });
    setLastLoadedAt(new Date().toLocaleTimeString());
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 02 Operator Work Queue",
        "Internal operational review surface",
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

  const createQueueItem = useCallback(async () => {
    if (!data.scope.applicationId || !data.scope.tenantId) {
      setActionMessage("A governed application scope is required.");
      return;
    }

    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch("/api/queues/operator", {
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
          queueType: "application_review",
          sourceType: "module_02_operator_console",
          sourceId: data.scope.applicationId,
          sourceTraceId: data.applications.traceId,
          status: "OPEN",
          priority: queuePriority,
          escalationStatus: "NOT_ESCALATED",
          reviewReason: "Governed operator queue review requested from Module 02.",
          requiredRole: "operator",
          assignedTo: actorId,
          metadata: {
            module: "Module 02 - Operator Work Queue",
            liveExternalAction: false,
            finalDecision: false,
          },
        }),
      });
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ?? "Queue item creation returned review."
        );
      } else {
        setActionMessage("Governed queue item recorded.");
        await loadAll();
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error ? error.message : "Unknown queue action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [data.applications.traceId, data.scope, loadAll, queuePriority]);

  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    `Scope ${data.scope.applicationId ?? data.scope.tenantId ?? "Unscoped"}`,
    "Internal Only",
    "No Final Action",
  ];

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="02"
          title="Operator Work Queue"
          subtitle="Internal queue review, assignment, and escalation posture for governed application work."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Open Queue Items",
              value: data.queues.count,
              color: "#0f766e",
            },
            {
              label: "Review Records",
              value: data.reviews.count,
              color: "#7c3aed",
            },
            {
              label: "Applications In View",
              value: data.applications.count,
              color: "#2563eb",
            },
            {
              label: "Last Refresh",
              value: lastLoadedAt ?? "Loading",
              color: "#334155",
            },
          ]}
        />

        <section
          aria-label="Operator queue action"
          style={{
            ...panelStyle,
            padding: 16,
            display: "grid",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "end",
              flexWrap: "wrap",
            }}
          >
            <label style={{ display: "grid", gap: 6, minWidth: 220 }}>
              <span style={{ color: "#596579", fontSize: 13, fontWeight: 800 }}>
                Priority
              </span>
              <select
                value={queuePriority}
                onChange={(event) => setQueuePriority(event.target.value)}
                style={inputStyle}
              >
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </label>

            <ActionButton
              disabled={actionBusy || !data.scope.applicationId}
              onClick={() => void createQueueItem()}
            >
              {actionBusy ? "Recording" : "Record Queue Item"}
            </ActionButton>

            {actionMessage ? (
              <span style={{ color: "#334155", fontWeight: 700 }}>
                {actionMessage}
              </span>
            ) : null}
          </div>
        </section>

        <section
          aria-label="Queue and review records"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.4fr) minmax(300px, 0.8fr)",
            gap: 12,
          }}
        >
          <div style={{ display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Queue Records</h2>
            {data.queues.rows.length > 0 ? (
              data.queues.rows.map((row, index) => {
                const queueItem = primaryRecord(row, ["queueItem"]);

                return (
                  <article
                    key={`${stringValue(queueItem.id) ?? "queue"}-${index}`}
                    style={{
                      ...panelStyle,
                      padding: 16,
                      display: "grid",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={{ display: "grid", gap: 4 }}>
                        <h3 style={{ margin: 0, fontSize: 18 }}>
                          {queueTitle(row)}
                        </h3>
                        <span style={{ color: "#596579", fontSize: 13 }}>
                          {queueMeta(row)}
                        </span>
                      </div>
                      <StatusPill ok={data.queues.ok}>
                        {normalizeStatus(queueItem.status)}
                      </StatusPill>
                    </div>

                    <p style={{ margin: 0, color: "#334155", lineHeight: 1.45 }}>
                      {stringValue(queueItem.reviewReason) ??
                        "Review reason not recorded."}
                    </p>

                    <dl
                      style={{
                        display: "grid",
                        gridTemplateColumns: "140px 1fr",
                        gap: 8,
                        margin: 0,
                        fontSize: 13,
                      }}
                    >
                      <dt style={{ color: "#596579", fontWeight: 800 }}>
                        Application
                      </dt>
                      <dd style={{ margin: 0, overflowWrap: "anywhere" }}>
                        {shortId(queueItem.applicationId)}
                      </dd>

                      <dt style={{ color: "#596579", fontWeight: 800 }}>
                        Assigned
                      </dt>
                      <dd style={{ margin: 0 }}>
                        {stringValue(queueItem.assignedTo) ?? "Unassigned"}
                      </dd>

                      <dt style={{ color: "#596579", fontWeight: 800 }}>Due</dt>
                      <dd style={{ margin: 0 }}>
                        {formatDateTime(queueItem.dueAt)}
                      </dd>
                    </dl>
                  </article>
                );
              })
            ) : (
              <EmptyState>No open queue records in current scope.</EmptyState>
            )}
          </div>

          <aside style={{ display: "grid", gap: 12, alignContent: "start" }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Scope and Reviews</h2>
            <article style={{ ...panelStyle, padding: 16, display: "grid", gap: 8 }}>
              <strong>Current Application</strong>
              <span style={{ color: "#334155", overflowWrap: "anywhere" }}>
                {data.applications.rows[0]
                  ? applicationLabel(data.applications.rows[0])
                  : "No application scope loaded."}
              </span>
              <span style={{ color: "#64748b", fontSize: 13 }}>
                Trace {shortId(data.applications.traceId)}
              </span>
            </article>

            {data.reviews.rows.length > 0 ? (
              data.reviews.rows.slice(0, 4).map((row, index) => {
                const review = primaryRecord(row, ["humanReview"]);

                return (
                  <article
                    key={`${stringValue(review.id) ?? "review"}-${index}`}
                    style={{ ...panelStyle, padding: 14, display: "grid", gap: 6 }}
                  >
                    <strong style={{ overflowWrap: "anywhere" }}>
                      {reviewLabel(row)}
                    </strong>
                    <span style={{ color: "#334155", fontSize: 13 }}>
                      Candidate {normalizeStatus(review.candidateOutcome)}
                    </span>
                    <span style={{ color: "#64748b", fontSize: 12 }}>
                      Final action allowed:{" "}
                      {review.finalActionAllowed === true ? "Yes" : "No"}
                    </span>
                  </article>
                );
              })
            ) : (
              <EmptyState>No linked human-review records in current scope.</EmptyState>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}

