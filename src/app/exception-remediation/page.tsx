"use client";

import Link from "next/link";
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
 * Module 18 - Exception Remediation and Recovery Console
 *
 * Master Volume Governance:
 * - Vol I: preserves accountable authority for operational remediation.
 * - Vol II: protects borrower, notice, payment, connector, and sovereign boundaries.
 * - Vol III: consumes replay-safe exception, readiness, and admin/read surfaces.
 * - Vol III-B: surfaces classification, observability, version, and evidence posture.
 * - Vol IV: supports escalation, remediation, recovery, incident review, and runbooks.
 * - Vol V: enforces advisory-only remediation, controlled disclosure, replay, and no live action.
 */

const actorId = "module-18-exception-remediation-recovery-console";

type ExceptionSurface = {
  moduleNumber: string;
  label: string;
  href: string;
  path: (scope: ModuleScope) => string | null;
  collectionKeys: string[];
  remediationRole: string;
};

type ExceptionResult = ExceptionSurface & LoadResult;

type ModuleData = {
  applications: LoadResult;
  surfaces: ExceptionResult[];
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

const exceptionSurfaces: ExceptionSurface[] = [
  {
    moduleNumber: "02",
    label: "Operator Queue",
    href: "/operator-queue",
    path: (scope) =>
      `/api/queues/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=8&includeApplication=true&includeProperty=true`,
    collectionKeys: ["queueItems"],
    remediationRole: "Assignment, escalation, and stalled-work review",
  },
  {
    moduleNumber: "04",
    label: "Document Intake",
    href: "/documents",
    path: (scope) =>
      `/api/documents/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=8&includeApplication=true&includeProperty=true`,
    collectionKeys: ["documents"],
    remediationRole: "Missing metadata, storage handoff, and retention review",
  },
  {
    moduleNumber: "05",
    label: "Human Review",
    href: "/reviews",
    path: (scope) =>
      `/api/reviews/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=8&includeApplication=true&includeProperty=true&includeTransitions=true`,
    collectionKeys: ["reviews"],
    remediationRole: "Human-review transition and escalation review",
  },
  {
    moduleNumber: "08",
    label: "Notice Lifecycle",
    href: "/notices",
    path: (scope) =>
      `/api/notices/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=8&includeProviderExecutions=true&includeReceipts=true&includeResolutions=true`,
    collectionKeys: ["noticeRecords"],
    remediationRole: "Notice exception, receipt, and provider-control review",
  },
  {
    moduleNumber: "10",
    label: "Connectors",
    href: "/connectors",
    path: (scope) =>
      `/api/connectors/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=8&includeSource=true&includeAdapters=true&includeExecutions=true&includeApplication=true&includeProperty=true`,
    collectionKeys: ["connectorRecords"],
    remediationRole: "Source authority, adapter, and execution-control review",
  },
  {
    moduleNumber: "12",
    label: "Payment Controls",
    href: "/billing",
    path: (scope) =>
      scope.tenantId
        ? `/api/billing/connectors/admin?role=governance&userId=${actorId}${scopeQuery(
            scope,
            ["tenantId"]
          )}&limit=8&includeExecutions=true&includeBillingEvents=true`
        : null,
    collectionKeys: ["paymentConnectors"],
    remediationRole: "Payment connector and capture-authorization review",
  },
  {
    moduleNumber: "14",
    label: "Live-Action Readiness",
    href: "/promotion",
    path: (scope) =>
      `/api/governance/live-action-readiness/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=8&includeApplication=true&includeProperty=true`,
    collectionKeys: ["readinessRecords"],
    remediationRole: "Promotion hold, rollback, and monitoring readiness",
  },
  {
    moduleNumber: "14",
    label: "Sovereign Gateway",
    href: "/promotion",
    path: (scope) =>
      `/api/governance/sovereign-consent-gateway/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=8&includeApplication=true&includeProperty=true`,
    collectionKeys: ["gatewayRecords"],
    remediationRole: "Sovereign consent, waiver, and restricted-use review",
  },
  {
    moduleNumber: "17",
    label: "Credentialed Ingestion",
    href: "/source-ingestion",
    path: (scope) =>
      `/api/connectors/credentialed-ingestion/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=8&includeCredential=true&includeApplication=true&includeProperty=true`,
    collectionKeys: ["credentialedIngestionRecords"],
    remediationRole: "Credential, ToS, provenance, and circuit-breaker review",
  },
];

function applicationIdFromRow(row: unknown): string | null {
  const application = primaryRecord(row, ["application"]);

  return stringValue(application.id);
}

function remediationRecord(row: unknown): Record<string, unknown> {
  return primaryRecord(row, [
    "queueItem",
    "document",
    "humanReview",
    "delivery",
    "connectorRun",
    "paymentConnector",
    "review",
    "gatewayRecord",
    "ingestionEvent",
  ]);
}

function rowStatus(row: unknown): string {
  const record = remediationRecord(row);

  return normalizeStatus(
    record.status ??
      record.queueStatus ??
      record.documentStatus ??
      record.reviewStatus ??
      record.deliveryStatus ??
      record.executionStatus ??
      record.readinessStatus ??
      record.gatewayStatus ??
      record.sessionOutcome
  );
}

function rowTitle(row: unknown): string {
  const record = remediationRecord(row);

  return shortId(
    record.id ??
      record.documentId ??
      record.applicationId ??
      record.gatewayRecordId ??
      record.scrapingEventId ??
      record.adapterId ??
      record.targetExecutionId
  );
}

function rowUpdated(row: unknown): string {
  const record = remediationRecord(row);

  return formatDateTime(
    record.updatedAt ??
      record.createdAt ??
      record.reviewedAt ??
      record.occurredAt ??
      record.resolvedAt
  );
}

function isRemediationStatus(status: string): boolean {
  const normalized = status.toLowerCase();

  return [
    "review",
    "pending",
    "hold",
    "blocked",
    "exception",
    "failed",
    "required",
    "incomplete",
    "circuit",
    "not recorded",
  ].some((token) => normalized.includes(token));
}

export default function ExceptionRemediationRecoveryConsolePage() {
  const [data, setData] = useState<ModuleData>({
    applications: emptyLoad,
    surfaces: [],
    scope: emptyScope,
  });
  const [selectedApplicationId, setSelectedApplicationId] =
    useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [remediationFocus, setRemediationFocus] = useState(
    "internal-remediation-review"
  );
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setRefreshing(true);
    setActionMessage(null);

    const applications = await loadJsonSurface(
      `/api/applications/admin?role=governance&userId=${actorId}&limit=14&includeProperty=true`,
      ["applications"]
    );
    const selectedRow =
      applications.rows.find(
        (row) => applicationIdFromRow(row) === selectedApplicationId
      ) ?? applications.rows[0];
    const scope = selectedRow
      ? scopeFromApplicationRows([selectedRow])
      : emptyScope;
    const selectedId = selectedRow ? applicationIdFromRow(selectedRow) : null;
    const scoped = scope.applicationId || scope.tenantId || scope.borrowerId;
    const surfaces = scoped
      ? await Promise.all(
          exceptionSurfaces.map(async (surface) => {
            const path = surface.path(scope);
            const result = path
              ? await loadJsonSurface(path, surface.collectionKeys)
              : emptyLoad;

            return {
              ...surface,
              ...result,
            };
          })
        )
      : exceptionSurfaces.map((surface) => ({ ...surface, ...emptyLoad }));

    setSelectedApplicationId(selectedId);
    setData({ applications, surfaces, scope });
    setLastLoadedAt(new Date().toLocaleTimeString());
    setRefreshing(false);
  }, [selectedApplicationId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 18 Exception Remediation and Recovery Console",
        "Internal cross-module remediation and recovery review surface",
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

  const recordRemediationMemo = useCallback(async () => {
    if (!data.scope.applicationId || !data.scope.tenantId) {
      setActionMessage("A governed application scope is required.");
      return;
    }

    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch("/api/reports/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "governance",
          userId: actorId,
          borrowerId: data.scope.borrowerId,
          tenantId: data.scope.tenantId,
          applicationId: data.scope.applicationId,
          reportType: "EXCEPTION_REMEDIATION_MEMO",
          metadata: {
            role: "governance",
            module: "Module 18 - Exception Remediation and Recovery Console",
            advisoryOnly: true,
            externalActionPerformed: false,
            liveRemediationPerformed: false,
          },
          payload: {
            focus: remediationFocus,
            governedScope: data.scope,
            surfaceCounts: data.surfaces.map((surface) => ({
              moduleNumber: surface.moduleNumber,
              label: surface.label,
              count: surface.count,
              ok: surface.ok,
              remediationItems: surface.rows.filter((row) =>
                isRemediationStatus(rowStatus(row))
              ).length,
            })),
            advisoryOnly: true,
            humanReviewRequired: true,
          },
        }),
      });
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ?? "Remediation memo returned review."
        );
      } else {
        const report = primaryRecord(json, ["reportRecord"]);

        setActionMessage(
          `Remediation memo recorded: ${shortId(
            report.reportId ?? report.id
          )} / ${normalizeStatus(report.reportStatus)}`
        );
        await loadAll();
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown remediation memo action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [data.scope, data.surfaces, loadAll, remediationFocus]);

  const totalRecords = data.surfaces.reduce(
    (total, surface) => total + surface.count,
    0
  );
  const remediationItems = data.surfaces.reduce(
    (total, surface) =>
      total +
      surface.rows.filter((row) => isRemediationStatus(rowStatus(row))).length,
    0
  );
  const reviewSurfaces = data.surfaces.filter(
    (surface) => !surface.ok || surface.rows.some((row) => isRemediationStatus(rowStatus(row)))
  ).length;
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    `Scope ${data.scope.applicationId ?? data.scope.tenantId ?? "Unscoped"}`,
    "Vol IV Recovery",
    "No Live Remediation",
  ];

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="18"
          title="Exception Remediation and Recovery"
          subtitle="Cross-module remediation board for stalled work, exception posture, recovery evidence, and runbook follow-through."
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
              label: "Linked Records",
              value: totalRecords,
              color: "#0f766e",
            },
            {
              label: "Remediation Items",
              value: remediationItems,
              color: "#be123c",
            },
            {
              label: "Review Surfaces",
              value: reviewSurfaces,
              color: "#7c3aed",
            },
          ]}
        />

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(280px, 0.85fr) minmax(0, 1.45fr)",
            gap: 16,
            alignItems: "start",
          }}
        >
          <aside style={{ ...panelStyle, padding: 16, display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Remediation Controls</h2>
            <FieldLabel label="Remediation focus">
              <input
                value={remediationFocus}
                onChange={(event) => setRemediationFocus(event.target.value)}
                style={inputStyle}
              />
            </FieldLabel>
            <ActionButton
              disabled={actionBusy || !data.scope.applicationId}
              onClick={() => void recordRemediationMemo()}
            >
              Record Advisory Remediation Memo
            </ActionButton>
            {actionMessage ? (
              <p style={{ margin: 0, color: "#334155", lineHeight: 1.5 }}>
                {actionMessage}
              </p>
            ) : null}
            <p style={{ margin: 0, color: "#64748b", lineHeight: 1.5 }}>
              This console records internal remediation posture only. Live
              connector calls, notice sends, payment capture, and sovereign data
              use remain blocked until their promotion gates pass.
            </p>

            <h3 style={{ margin: "8px 0 0", fontSize: 18 }}>Case Scope</h3>
            {data.applications.rows.length === 0 ? (
              <EmptyState>No governed applications are available yet.</EmptyState>
            ) : (
              data.applications.rows.slice(0, 7).map((row) => {
                const application = primaryRecord(row, ["application"]);
                const id = stringValue(application.id);
                const active = id === data.scope.applicationId;

                return (
                  <button
                    key={id ?? JSON.stringify(row)}
                    type="button"
                    onClick={() => setSelectedApplicationId(id)}
                    style={{
                      display: "grid",
                      gap: 6,
                      padding: 12,
                      border: active
                        ? "2px solid #1f4f7a"
                        : "1px solid #e2e8f0",
                      borderRadius: 8,
                      background: "#ffffff",
                      color: "#172033",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <strong>{shortId(id)}</strong>
                    <span style={{ color: "#64748b", fontSize: 13 }}>
                      Tenant {shortId(application.tenantId)}
                    </span>
                  </button>
                );
              })
            )}
          </aside>

          <section style={{ display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Recovery Surfaces</h2>
            {data.surfaces.map((surface) => {
              const surfaceItems = surface.rows.filter((row) =>
                isRemediationStatus(rowStatus(row))
              );

              return (
                <div
                  key={`${surface.moduleNumber}-${surface.label}`}
                  style={{ ...panelStyle, padding: 14, display: "grid", gap: 10 }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "grid", gap: 4 }}>
                      <strong>
                        Module {surface.moduleNumber} / {surface.label}
                      </strong>
                      <span style={{ color: "#64748b", fontSize: 13 }}>
                        {surface.remediationRole}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <StatusPill ok={surface.ok && surfaceItems.length === 0}>
                        {surfaceItems.length > 0
                          ? `${surfaceItems.length} Review`
                          : surface.ok
                            ? "Connected"
                            : "Review"}
                      </StatusPill>
                      <Link
                        href={surface.href}
                        style={{
                          color: "#1f4f7a",
                          fontWeight: 800,
                          textDecoration: "none",
                        }}
                      >
                        Open Module
                      </Link>
                    </div>
                  </div>
                  {surface.rows.length === 0 ? (
                    <span style={{ color: "#64748b", fontSize: 13 }}>
                      No scoped records returned. The module link remains
                      available for direct review.
                    </span>
                  ) : (
                    <div style={{ display: "grid", gap: 6 }}>
                      {surface.rows.slice(0, 4).map((row) => (
                        <span
                          key={`${surface.label}-${rowTitle(row)}-${rowUpdated(row)}`}
                          style={{ color: "#475569", fontSize: 13 }}
                        >
                          {rowTitle(row)} / {rowStatus(row)} / {rowUpdated(row)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        </section>

        <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
          Last refresh: {lastLoadedAt ?? "Not loaded"}
        </p>
      </div>
    </main>
  );
}
