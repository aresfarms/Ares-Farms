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
 * Module 19 - Borrower Data Rights and Portability Workspace
 *
 * Master Volume Governance:
 * - Vol 0: keeps borrower-facing outcomes legible through governed operations.
 * - Vol I: preserves borrower record rights within constitutional hierarchy.
 * - Vol II: protects sensitive borrower, application, document, and notice data.
 * - Vol III: consumes replay-safe application, document, ledger, report, and notice surfaces.
 * - Vol III-B: surfaces classification, observability, version, and evidence posture.
 * - Vol IV: supports export preparation, retention review, and operator handoff.
 * - Vol V: enforces borrower review, export, transport, audit, and machine-readable rights.
 */

const actorId = "module-19-borrower-data-rights-portability-workspace";

type DataRightsSource = {
  moduleNumber: string;
  label: string;
  href: string;
  path: (scope: ModuleScope) => string | null;
  collectionKeys: string[];
  portabilityRole: string;
};

type DataRightsResult = DataRightsSource & LoadResult;

type ModuleData = {
  applications: LoadResult;
  sources: DataRightsResult[];
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

const dataRightsSources: DataRightsSource[] = [
  {
    moduleNumber: "03",
    label: "Application Record",
    href: "/applications",
    path: (scope) =>
      `/api/applications/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=4&includeProperty=true`,
    collectionKeys: ["applications"],
    portabilityRole: "Application and property scope for borrower review",
  },
  {
    moduleNumber: "04",
    label: "Document Metadata",
    href: "/documents",
    path: (scope) =>
      `/api/documents/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=8&includeApplication=true&includeProperty=true`,
    collectionKeys: ["documents"],
    portabilityRole: "Document index and storage handoff posture",
  },
  {
    moduleNumber: "08",
    label: "Notice Records",
    href: "/notices",
    path: (scope) =>
      `/api/notices/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=8&includeProviderExecutions=true&includeReceipts=true&includeResolutions=true`,
    collectionKeys: ["noticeRecords"],
    portabilityRole: "Notice packet, receipt, and appeal-reference posture",
  },
  {
    moduleNumber: "09",
    label: "Audit Ledger",
    href: "/audit-replay",
    path: () =>
      `/api/ledger/admin?role=governance&userId=${actorId}&eventType=APPLICATION_SUBMITTED&includeCanonicalLedger=true&includeCanonicalMeta=true&limit=8`,
    collectionKeys: ["auditEvents", "canonicalLedgerRows", "canonicalMeta"],
    portabilityRole: "Replay and audit lineage references",
  },
  {
    moduleNumber: "10",
    label: "Source Authority",
    href: "/connectors",
    path: (scope) =>
      `/api/connectors/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=8&includeSource=true&includeAdapters=true&includeExecutions=true&includeApplication=true&includeProperty=true`,
    collectionKeys: ["connectorRecords"],
    portabilityRole: "External source provenance and authority posture",
  },
  {
    moduleNumber: "13",
    label: "Advisory Reports",
    href: "/reports",
    path: (scope) =>
      `/api/reports/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=8&includeApplication=true&includeProperty=true`,
    collectionKeys: ["reportRecords"],
    portabilityRole: "Advisory artifacts and export-governance posture",
  },
  {
    moduleNumber: "14",
    label: "Sovereign Restrictions",
    href: "/promotion",
    path: (scope) =>
      `/api/governance/sovereign-consent-gateway/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=8&includeApplication=true&includeProperty=true`,
    collectionKeys: ["gatewayRecords"],
    portabilityRole: "Restricted-use and consent boundary references",
  },
  {
    moduleNumber: "18",
    label: "Remediation Memos",
    href: "/exception-remediation",
    path: (scope) =>
      `/api/reports/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&reportType=EXCEPTION_REMEDIATION_MEMO&limit=8&includeApplication=true&includeProperty=true`,
    collectionKeys: ["reportRecords"],
    portabilityRole: "Exception and recovery notes for operator review",
  },
];

function applicationIdFromRow(row: unknown): string | null {
  const application = primaryRecord(row, ["application"]);

  return stringValue(application.id);
}

function dataRightsRecord(row: unknown): Record<string, unknown> {
  return primaryRecord(row, [
    "application",
    "document",
    "delivery",
    "auditEvent",
    "connectorRun",
    "report",
    "gatewayRecord",
  ]);
}

function dataRightsStatus(row: unknown): string {
  const record = dataRightsRecord(row);

  return normalizeStatus(
    record.status ??
      record.documentStatus ??
      record.deliveryStatus ??
      record.eventType ??
      record.executionStatus ??
      record.reportStatus ??
      record.gatewayStatus
  );
}

function dataRightsTitle(row: unknown): string {
  const record = dataRightsRecord(row);

  return shortId(
    record.id ??
      record.applicationId ??
      record.documentId ??
      record.reportId ??
      record.eventId ??
      record.gatewayRecordId
  );
}

export default function BorrowerDataRightsPortabilityWorkspacePage() {
  const [data, setData] = useState<ModuleData>({
    applications: emptyLoad,
    sources: [],
    scope: emptyScope,
  });
  const [selectedApplicationId, setSelectedApplicationId] =
    useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [packagePurpose, setPackagePurpose] = useState(
    "borrower-review-export-transport-preparation"
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
    const sources = scoped
      ? await Promise.all(
          dataRightsSources.map(async (source) => {
            const path = source.path(scope);
            const result = path
              ? await loadJsonSurface(path, source.collectionKeys)
              : emptyLoad;

            return {
              ...source,
              ...result,
            };
          })
        )
      : dataRightsSources.map((source) => ({ ...source, ...emptyLoad }));

    setSelectedApplicationId(selectedId);
    setData({ applications, sources, scope });
    setLastLoadedAt(new Date().toLocaleTimeString());
    setRefreshing(false);
  }, [selectedApplicationId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 19 Borrower Data Rights and Portability Workspace",
        "Internal borrower review, export, transport, audit, and machine-readable preparation surface",
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

  const recordPortabilitySummary = useCallback(async () => {
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
          reportType: "BORROWER_PORTABILITY_PACKAGE_SUMMARY",
          metadata: {
            role: "governance",
            module: "Module 19 - Borrower Data Rights and Portability Workspace",
            advisoryOnly: true,
            machineReadablePreparation: true,
            externalDisclosurePerformed: false,
          },
          payload: {
            packagePurpose,
            governedScope: data.scope,
            sourceCounts: data.sources.map((source) => ({
              moduleNumber: source.moduleNumber,
              label: source.label,
              count: source.count,
              ok: source.ok,
            })),
            borrowerReviewSupported: true,
            exportPreparationSupported: true,
            transportPreparationSupported: true,
            machineReadablePreparation: true,
            operatorReviewRequired: true,
          },
        }),
      });
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ?? "Portability summary returned review."
        );
      } else {
        const report = primaryRecord(json, ["reportRecord"]);

        setActionMessage(
          `Portability summary recorded: ${shortId(
            report.reportId ?? report.id
          )} / ${normalizeStatus(report.reportStatus)}`
        );
        await loadAll();
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown portability summary action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [data.scope, data.sources, loadAll, packagePurpose]);

  const totalRecords = data.sources.reduce(
    (total, source) => total + source.count,
    0
  );
  const connectedSources = data.sources.filter((source) => source.ok).length;
  const restrictedSources = data.sources.filter((source) =>
    ["Sovereign Restrictions", "Source Authority", "Notice Records"].includes(
      source.label
    )
  ).length;
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    `Scope ${data.scope.applicationId ?? data.scope.tenantId ?? "Unscoped"}`,
    "Borrower Rights",
    "Machine-Readable Prep",
  ];

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="19"
          title="Borrower Data Rights and Portability"
          subtitle="Internal preparation workspace for borrower review, export, transport, audit, and machine-readable record coordination."
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
              label: "Portability Records",
              value: totalRecords,
              color: "#0f766e",
            },
            {
              label: "Connected Sources",
              value: connectedSources,
              color: "#7c3aed",
            },
            {
              label: "Restricted Sources",
              value: restrictedSources,
              color: "#be123c",
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
            <h2 style={{ margin: 0, fontSize: 20 }}>Portability Controls</h2>
            <FieldLabel label="Package purpose">
              <input
                value={packagePurpose}
                onChange={(event) => setPackagePurpose(event.target.value)}
                style={inputStyle}
              />
            </FieldLabel>
            <ActionButton
              disabled={actionBusy || !data.scope.applicationId}
              onClick={() => void recordPortabilitySummary()}
            >
              Record Portability Summary
            </ActionButton>
            {actionMessage ? (
              <p style={{ margin: 0, color: "#334155", lineHeight: 1.5 }}>
                {actionMessage}
              </p>
            ) : null}
            <p style={{ margin: 0, color: "#64748b", lineHeight: 1.5 }}>
              Borrower records stay governed by classification, redaction,
              consent, retention, and restricted-use rules. This module prepares
              review and transport posture; it does not disclose records outside
              the platform.
            </p>

            <h3 style={{ margin: "8px 0 0", fontSize: 18 }}>Application Scope</h3>
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
                      Borrower {shortId(application.borrowerId)}
                    </span>
                  </button>
                );
              })
            )}
          </aside>

          <section style={{ display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Rights Package Sources</h2>
            {data.sources.map((source) => (
              <div
                key={`${source.moduleNumber}-${source.label}`}
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
                      Module {source.moduleNumber} / {source.label}
                    </strong>
                    <span style={{ color: "#64748b", fontSize: 13 }}>
                      {source.portabilityRole}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <StatusPill ok={source.ok}>
                      {source.ok ? "Connected" : "Review"}
                    </StatusPill>
                    <Link
                      href={source.href}
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
                {source.rows.length === 0 ? (
                  <span style={{ color: "#64748b", fontSize: 13 }}>
                    No scoped records returned for this source.
                  </span>
                ) : (
                  <div style={{ display: "grid", gap: 6 }}>
                    {source.rows.slice(0, 3).map((row) => (
                      <span
                        key={`${source.label}-${dataRightsTitle(row)}-${dataRightsStatus(row)}`}
                        style={{ color: "#475569", fontSize: 13 }}
                      >
                        {dataRightsTitle(row)} / {dataRightsStatus(row)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </section>
        </section>

        <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
          Last refresh: {lastLoadedAt ?? "Not loaded"}
        </p>
      </div>
    </main>
  );
}
