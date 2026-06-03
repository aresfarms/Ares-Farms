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
  scopeFromApplicationRows,
  scopeQuery,
  shortId,
  stringValue,
} from "@/app/internalModuleKit";

/**
 * Module 15 - Unified Case Command Center
 *
 * Master Volume Governance:
 * - Vol I: preserves constitutional hierarchy across operational modules.
 * - Vol II: keeps borrower, lender, sponsor, notice, payment, and sovereign boundaries visible.
 * - Vol III: consumes replay-safe admin/read APIs from Modules 01-14.
 * - Vol III-B: surfaces classification, observability, version, and evidence posture.
 * - Vol IV: supports cross-module triage, escalation, recovery, and handoff review.
 * - Vol V: enforces controlled disclosure, advisory-only coordination, replay, and human review.
 */

const actorId = "module-15-unified-case-command-center";

type ModuleData = {
  applications: LoadResult;
  surfaces: SurfaceResult[];
  scope: ModuleScope;
};

type SurfaceConfig = {
  moduleNumber: string;
  label: string;
  href: string;
  collectionKeys: string[];
  path: (scope: ModuleScope) => string | null;
  accent: string;
  boundary: string;
};

type SurfaceResult = SurfaceConfig & LoadResult;

const emptyLoad: LoadResult = {
  ok: true,
  count: 0,
  rows: [],
  traceId: null,
  error: null,
  json: null,
};

const integratedSurfaces: SurfaceConfig[] = [
  {
    moduleNumber: "02",
    label: "Operator Queue",
    href: "/operator-queue",
    collectionKeys: ["queueItems"],
    path: (scope) =>
      `/api/queues/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=6&includeApplication=true&includeProperty=true`,
    accent: "#0f766e",
    boundary: "assignment and escalation posture",
  },
  {
    moduleNumber: "04",
    label: "Documents",
    href: "/documents",
    collectionKeys: ["documents"],
    path: (scope) =>
      `/api/documents/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=6&includeApplication=true&includeProperty=true`,
    accent: "#2563eb",
    boundary: "metadata only; raw content blocked",
  },
  {
    moduleNumber: "05",
    label: "Human Reviews",
    href: "/reviews",
    collectionKeys: ["reviews"],
    path: (scope) =>
      `/api/reviews/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=6&includeApplication=true&includeProperty=true&includeTransitions=true`,
    accent: "#7c3aed",
    boundary: "human review required",
  },
  {
    moduleNumber: "06",
    label: "Rule Evaluations",
    href: "/rules",
    collectionKeys: ["ruleRecords"],
    path: (scope) =>
      `/api/rules/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=6&includeRules=true&includeOverlays=true&includeApplication=true&includeProperty=true`,
    accent: "#4d7c0f",
    boundary: "advisory rule posture",
  },
  {
    moduleNumber: "08",
    label: "Notices",
    href: "/notices",
    collectionKeys: ["noticeRecords"],
    path: (scope) =>
      `/api/notices/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=6&includeProviderExecutions=true&includeReceipts=true&includeResolutions=true`,
    accent: "#be123c",
    boundary: "provider actions gated",
  },
  {
    moduleNumber: "10",
    label: "Connectors",
    href: "/connectors",
    collectionKeys: ["connectorRecords"],
    path: (scope) =>
      `/api/connectors/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=6&includeSource=true&includeAdapters=true&includeExecutions=true&includeApplication=true&includeProperty=true`,
    accent: "#0891b2",
    boundary: "no live external calls",
  },
  {
    moduleNumber: "11",
    label: "Partners",
    href: "/partners",
    collectionKeys: ["partnerWorkflows"],
    path: (scope) =>
      `/api/partners/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=6&includeApplication=true&includeProperty=true`,
    accent: "#b45309",
    boundary: "no final commitment",
  },
  {
    moduleNumber: "12",
    label: "Billing",
    href: "/billing",
    collectionKeys: ["billingEvents"],
    path: (scope) =>
      scope.tenantId
        ? `/api/billing/admin?role=governance&userId=${actorId}${scopeQuery(
            scope,
            ["tenantId"]
          )}&limit=6&includeEntitlement=true`
        : null,
    accent: "#854d0e",
    boundary: "no live payment capture",
  },
  {
    moduleNumber: "13",
    label: "Reports",
    href: "/reports",
    collectionKeys: ["reportRecords"],
    path: (scope) =>
      `/api/reports/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=6&includeApplication=true&includeProperty=true`,
    accent: "#4338ca",
    boundary: "advisory artifacts only",
  },
  {
    moduleNumber: "14",
    label: "Promotion Gates",
    href: "/promotion",
    collectionKeys: ["readinessRecords"],
    path: (scope) =>
      `/api/governance/live-action-readiness/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=6&includeApplication=true&includeProperty=true`,
    accent: "#be185d",
    boundary: "readiness only; no live action",
  },
];

function applicationIdFromRow(row: unknown): string | null {
  const application = primaryRecord(row, ["application"]);

  return stringValue(application.id);
}

function recordStatus(row: unknown): string {
  const record = primaryRecord(row, [
    "application",
    "queueItem",
    "document",
    "humanReview",
    "ruleEvaluation",
    "delivery",
    "connectorRun",
    "workflow",
    "billingEvent",
    "report",
    "review",
  ]);

  return normalizeStatus(
    record.status ??
      record.reviewStatus ??
      record.documentStatus ??
      record.finalEffect ??
      record.deliveryStatus ??
      record.executionStatus ??
      record.eventStatus ??
      record.reportStatus ??
      record.readinessStatus
  );
}

function recordTitle(row: unknown): string {
  const record = primaryRecord(row, [
    "application",
    "queueItem",
    "document",
    "humanReview",
    "ruleEvaluation",
    "delivery",
    "connectorRun",
    "workflow",
    "billingEvent",
    "report",
    "review",
  ]);

  return shortId(
    record.id ??
      record.applicationId ??
      record.documentId ??
      record.reportId ??
      record.billingEventId ??
      record.targetExecutionId ??
      record.partnerName
  );
}

function latestDate(row: unknown): string {
  const record = primaryRecord(row, [
    "application",
    "queueItem",
    "document",
    "humanReview",
    "ruleEvaluation",
    "delivery",
    "connectorRun",
    "workflow",
    "billingEvent",
    "report",
    "review",
  ]);

  return formatDateTime(
    record.updatedAt ??
      record.createdAt ??
      record.generatedAt ??
      record.occurredAt ??
      record.reviewedAt
  );
}

export default function UnifiedCaseCommandCenterPage() {
  const [data, setData] = useState<ModuleData>({
    applications: emptyLoad,
    surfaces: [],
    scope: emptyScope,
  });
  const [selectedApplicationId, setSelectedApplicationId] =
    useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setRefreshing(true);

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
          integratedSurfaces.map(async (surface) => {
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
      : integratedSurfaces.map((surface) => ({ ...surface, ...emptyLoad }));

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
        "Module 15 Unified Case Command Center",
        "Internal cross-module operational coordination surface",
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

  const totalRecords = data.surfaces.reduce(
    (total, surface) => total + surface.count,
    0
  );
  const reviewSurfaces = data.surfaces.filter(
    (surface) => !surface.ok || surface.count > 0
  ).length;
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    `Scope ${data.scope.applicationId ?? data.scope.tenantId ?? "Unscoped"}`,
    "Modules 02-14 Linked",
    "No Runtime Bypass",
  ];

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="15"
          title="Unified Case Command Center"
          subtitle="Cross-module case view linking application, review, evidence, partner, billing, report, and promotion posture."
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
              label: "Active Surfaces",
              value: reviewSurfaces,
              color: "#7c3aed",
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
            gridTemplateColumns: "minmax(280px, 0.8fr) minmax(0, 1.5fr)",
            gap: 16,
            alignItems: "start",
          }}
        >
          <aside style={{ ...panelStyle, padding: 16, display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Case Scope</h2>
            {data.applications.rows.length === 0 ? (
              <EmptyState>No governed applications are available yet.</EmptyState>
            ) : (
              data.applications.rows.map((row) => {
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
                      gap: 8,
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
                    <span style={{ color: "#475569" }}>
                      Review {normalizeStatus(application.reviewStatus)} /
                      Decision {normalizeStatus(application.decisionStatus)}
                    </span>
                    <span style={{ color: "#64748b", fontSize: 13 }}>
                      Tenant {shortId(application.tenantId)}
                    </span>
                  </button>
                );
              })
            )}
          </aside>

          <section style={{ display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Interoperability Map</h2>
            {data.surfaces.map((surface) => (
              <div
                key={surface.label}
                style={{
                  ...panelStyle,
                  padding: 14,
                  display: "grid",
                  gap: 10,
                  borderLeft: `5px solid ${surface.accent}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
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
                      {surface.boundary}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <StatusPill ok={surface.ok}>
                      {surface.ok ? "Connected" : "Review"}
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
                    No scoped records returned. API link is still available.
                  </span>
                ) : (
                  <div style={{ display: "grid", gap: 6 }}>
                    {surface.rows.slice(0, 3).map((row) => (
                      <span
                        key={`${surface.label}-${recordTitle(row)}-${latestDate(row)}`}
                        style={{ color: "#475569", fontSize: 13 }}
                      >
                        {recordTitle(row)} / {recordStatus(row)} /{" "}
                        {latestDate(row)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </section>
        </section>
      </div>
    </main>
  );
}
