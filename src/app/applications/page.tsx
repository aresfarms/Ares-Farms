"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ADVISORY_ONLY_DISCLOSURE,
  BORROWER_PORTABILITY_DISCLOSURE,
  LENDER_READY_DISCLOSURE,
  evaluateContentClaims,
} from "@/lib/governance/contentClaimsPolicy";
import {
  EmptyState,
  LoadResult,
  ModuleHeader,
  ModuleScope,
  StatusPill,
  SummaryGrid,
  emptyScope,
  formatDateTime,
  isRecord,
  loadJsonSurface,
  moduleContainerStyle,
  moduleShellStyle,
  normalizeStatus,
  panelStyle,
  primaryRecord,
  scopeQuery,
  shortId,
  stringValue,
} from "@/app/internalModuleKit";

/**
 * Module 03 - Application Operations Workspace
 *
 * Master Volume Governance:
 * - Vol I: keeps application status inspection accountable and non-final.
 * - Vol II: protects borrower, application, and property data from over-disclosure.
 * - Vol III: consumes durable application/property persistence and admin reads.
 * - Vol III-B: preserves runtime, record access, observability, and evidence posture.
 * - Vol IV: supports operational triage, escalation, and recovery.
 * - Vol V: preserves classification, replay, versioning, and claim boundaries.
 */

const actorId = "module-03-application-operations";

type ModuleData = {
  applications: LoadResult;
  documents: LoadResult;
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

function applicationIdFromRow(row: unknown): string | null {
  const application = primaryRecord(row, ["application"]);

  return stringValue(application.id);
}

function scopeFromApplicationRow(row: unknown): ModuleScope {
  const application = primaryRecord(row, ["application"]);

  return {
    applicationId: stringValue(application.id),
    borrowerId: stringValue(application.borrowerId),
    tenantId: stringValue(application.tenantId),
  };
}

function propertyFromRow(row: unknown): Record<string, unknown> {
  return isRecord(row) && isRecord(row.property) ? row.property : {};
}

function applicationStatusText(row: unknown): string {
  const application = primaryRecord(row, ["application"]);

  return [
    `Application ${normalizeStatus(application.status)}`,
    `Review ${normalizeStatus(application.reviewStatus)}`,
    `Decision ${normalizeStatus(application.decisionStatus)}`,
  ].join(" / ");
}

function requestedAmount(row: unknown): string {
  const application = primaryRecord(row, ["application"]);
  const value = Number(application.requestedAmount ?? 0);

  if (!Number.isFinite(value) || value <= 0) {
    return "Not recorded";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function recordLine(row: unknown, key: string): string {
  const record = primaryRecord(row);

  return [
    shortId(record.id),
    normalizeStatus(record.status ?? record.reviewStatus ?? record.queueType),
    stringValue(record[key]),
  ]
    .filter(Boolean)
    .join(" / ");
}

export default function ApplicationOperationsPage() {
  const [data, setData] = useState<ModuleData>({
    applications: emptyLoad,
    documents: emptyLoad,
    queues: emptyLoad,
    reviews: emptyLoad,
    scope: emptyScope,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] =
    useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setRefreshing(true);

    const applications = await loadJsonSurface(
      `/api/applications/admin?role=governance&userId=${actorId}&limit=12&includeProperty=true`,
      ["applications"]
    );
    const selectedRow =
      applications.rows.find(
        (row) => applicationIdFromRow(row) === selectedApplicationId
      ) ?? applications.rows[0];
    const selectedId = selectedRow ? applicationIdFromRow(selectedRow) : null;
    const scope = selectedRow ? scopeFromApplicationRow(selectedRow) : emptyScope;
    const scoped = scope.applicationId || scope.tenantId || scope.borrowerId;
    const [documents, queues, reviews] = scoped
      ? await Promise.all([
          loadJsonSurface(
            `/api/documents/admin?role=governance&userId=${actorId}${scopeQuery(
              scope
            )}&limit=8&includeApplication=true&includeProperty=true`,
            ["documents"]
          ),
          loadJsonSurface(
            `/api/queues/admin?role=governance&userId=${actorId}${scopeQuery(
              scope
            )}&limit=8&includeApplication=true&includeProperty=true`,
            ["queueItems"]
          ),
          loadJsonSurface(
            `/api/reviews/admin?role=governance&userId=${actorId}${scopeQuery(
              scope
            )}&limit=8&includeApplication=true&includeProperty=true&includeAdverseActionReviews=true&includeTransitions=true`,
            ["reviews"]
          ),
        ])
      : [emptyLoad, emptyLoad, emptyLoad];

    setSelectedApplicationId(selectedId);
    setData({ applications, documents, queues, reviews, scope });
    setLastLoadedAt(new Date().toLocaleTimeString());
    setRefreshing(false);
  }, [selectedApplicationId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const selectedApplication = useMemo(() => {
    return (
      data.applications.rows.find(
        (row) => applicationIdFromRow(row) === data.scope.applicationId
      ) ?? null
    );
  }, [data.applications.rows, data.scope.applicationId]);

  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 03 Application Operations Workspace",
        "Internal application operations surface",
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

  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    `Scope ${data.scope.applicationId ?? data.scope.tenantId ?? "Unscoped"}`,
    "Internal Only",
    "Human Review Required",
  ];

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="03"
          title="Application Operations"
          subtitle="Application and property operations view for internal triage, review posture, and related governed records."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Applications",
              value: data.applications.count,
              color: "#2563eb",
            },
            {
              label: "Documents",
              value: data.documents.count,
              color: "#0f766e",
            },
            {
              label: "Queue Records",
              value: data.queues.count,
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
          aria-label="Application operations workspace"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(280px, 0.8fr) minmax(0, 1.4fr)",
            gap: 12,
          }}
        >
          <aside style={{ display: "grid", gap: 12, alignContent: "start" }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Applications</h2>
            {data.applications.rows.length > 0 ? (
              data.applications.rows.map((row, index) => {
                const application = primaryRecord(row, ["application"]);
                const property = propertyFromRow(row);
                const id = stringValue(application.id);
                const active = id === data.scope.applicationId;

                return (
                  <button
                    key={`${id ?? "application"}-${index}`}
                    type="button"
                    onClick={() => setSelectedApplicationId(id)}
                    style={{
                      ...panelStyle,
                      padding: 14,
                      textAlign: "left",
                      display: "grid",
                      gap: 8,
                      borderColor: active ? "#2563eb" : "#d5dce8",
                      cursor: "pointer",
                    }}
                  >
                    <strong style={{ overflowWrap: "anywhere" }}>
                      {shortId(id)}
                    </strong>
                    <span style={{ color: "#334155", fontSize: 13 }}>
                      {applicationStatusText(row)}
                    </span>
                    <span style={{ color: "#64748b", fontSize: 12 }}>
                      {stringValue(property.name) ?? "Unnamed property"}
                      {stringValue(property.state)
                        ? ` / ${stringValue(property.state)}`
                        : ""}
                    </span>
                  </button>
                );
              })
            ) : (
              <EmptyState>No application records loaded.</EmptyState>
            )}
          </aside>

          <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Selected Record</h2>
            {selectedApplication ? (
              <article style={{ ...panelStyle, padding: 16, display: "grid", gap: 14 }}>
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
                      {shortId(data.scope.applicationId)}
                    </h3>
                    <span style={{ color: "#596579" }}>
                      {applicationStatusText(selectedApplication)}
                    </span>
                  </div>
                  <StatusPill ok={data.applications.ok}>
                    {normalizeStatus(
                      primaryRecord(selectedApplication, ["application"]).status
                    )}
                  </StatusPill>
                </div>

                <dl
                  style={{
                    display: "grid",
                    gridTemplateColumns: "170px 1fr",
                    gap: 8,
                    margin: 0,
                    fontSize: 14,
                  }}
                >
                  <dt style={{ color: "#596579", fontWeight: 800 }}>
                    Requested Amount
                  </dt>
                  <dd style={{ margin: 0 }}>{requestedAmount(selectedApplication)}</dd>

                  <dt style={{ color: "#596579", fontWeight: 800 }}>Borrower</dt>
                  <dd style={{ margin: 0, overflowWrap: "anywhere" }}>
                    {shortId(data.scope.borrowerId)}
                  </dd>

                  <dt style={{ color: "#596579", fontWeight: 800 }}>Tenant</dt>
                  <dd style={{ margin: 0, overflowWrap: "anywhere" }}>
                    {shortId(data.scope.tenantId)}
                  </dd>

                  <dt style={{ color: "#596579", fontWeight: 800 }}>
                    Created
                  </dt>
                  <dd style={{ margin: 0 }}>
                    {formatDateTime(
                      primaryRecord(selectedApplication, ["application"]).createdAt
                    )}
                  </dd>
                </dl>
              </article>
            ) : (
              <EmptyState>Select an application record.</EmptyState>
            )}

            <section
              aria-label="Related application records"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: 12,
              }}
            >
              {[
                {
                  title: "Documents",
                  result: data.documents,
                  keyName: "documentType",
                },
                {
                  title: "Queue",
                  result: data.queues,
                  keyName: "priority",
                },
                {
                  title: "Reviews",
                  result: data.reviews,
                  keyName: "candidateOutcome",
                },
              ].map((group) => (
                <article
                  key={group.title}
                  style={{ ...panelStyle, padding: 14, display: "grid", gap: 10 }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <strong>{group.title}</strong>
                    <StatusPill ok={group.result.ok}>
                      {group.result.ok ? "Online" : "Review"}
                    </StatusPill>
                  </div>
                  {group.result.rows.length > 0 ? (
                    group.result.rows.slice(0, 4).map((row, index) => (
                      <div
                        key={`${group.title}-${index}`}
                        style={{
                          paddingTop: 8,
                          borderTop: "1px solid #e3e8f0",
                          color: "#334155",
                          fontSize: 13,
                          overflowWrap: "anywhere",
                        }}
                      >
                        {recordLine(row, group.keyName)}
                      </div>
                    ))
                  ) : (
                    <span style={{ color: "#64748b", fontSize: 13 }}>
                      No records in current scope.
                    </span>
                  )}
                </article>
              ))}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

