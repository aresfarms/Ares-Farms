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
 * Module 16 - Governance Evidence Packet Workspace
 *
 * Master Volume Governance:
 * - Vol I: preserves constitutional traceability between policy, action, and evidence.
 * - Vol II: protects borrower, report, notice, document, and audit-disclosure boundaries.
 * - Vol III: consumes replay-safe ledger, evidence, and admin/read surfaces.
 * - Vol III-B: surfaces classification, observability, version, and evidence posture.
 * - Vol IV: supports audit preparation, escalation packets, retention review, and recovery.
 * - Vol V: enforces controlled disclosure, redaction review, advisory-only reports, and replay.
 */

const actorId = "module-16-governance-evidence-packet-workspace";

type EvidenceSource = {
  moduleNumber: string;
  label: string;
  href: string;
  path: (scope: ModuleScope) => string | null;
  collectionKeys: string[];
  packetRole: string;
};

type EvidenceResult = EvidenceSource & LoadResult;

type ModuleData = {
  applications: LoadResult;
  evidence: EvidenceResult[];
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

const evidenceSources: EvidenceSource[] = [
  {
    moduleNumber: "04",
    label: "Document Metadata",
    href: "/documents",
    path: (scope) =>
      `/api/documents/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=8&includeApplication=true&includeProperty=true`,
    collectionKeys: ["documents"],
    packetRole: "Document and storage handoff evidence",
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
    packetRole: "Review and transition evidence",
  },
  {
    moduleNumber: "06",
    label: "Rule Overlay",
    href: "/rules",
    path: (scope) =>
      `/api/rules/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=8&includeRules=true&includeOverlays=true&includeApplication=true&includeProperty=true`,
    collectionKeys: ["ruleRecords"],
    packetRole: "Rule and overlay lineage",
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
    packetRole: "Notice packet, receipt, and exception evidence",
  },
  {
    moduleNumber: "09",
    label: "Audit Ledger",
    href: "/audit-replay",
    path: () =>
      `/api/ledger/admin?role=governance&userId=${actorId}&eventType=APPLICATION_SUBMITTED&includeCanonicalLedger=true&includeCanonicalMeta=true&limit=8`,
    collectionKeys: ["auditEvents", "canonicalLedgerRows", "canonicalMeta"],
    packetRole: "Ledger and replay evidence",
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
    packetRole: "Advisory export and report evidence",
  },
  {
    moduleNumber: "14",
    label: "Promotion Readiness",
    href: "/promotion",
    path: (scope) =>
      `/api/governance/live-action-readiness/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=8&includeApplication=true&includeProperty=true`,
    collectionKeys: ["readinessRecords"],
    packetRole: "Live-action hold and promotion evidence",
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
    packetRole: "Sovereign consent and Level 5 evidence",
  },
];

function applicationIdFromRow(row: unknown): string | null {
  const application = primaryRecord(row, ["application"]);

  return stringValue(application.id);
}

function evidenceStatus(row: unknown): string {
  const record = primaryRecord(row, [
    "document",
    "humanReview",
    "ruleEvaluation",
    "delivery",
    "auditEvent",
    "report",
    "review",
    "gatewayRecord",
  ]);

  return normalizeStatus(
    record.status ??
      record.documentStatus ??
      record.reviewStatus ??
      record.finalEffect ??
      record.deliveryStatus ??
      record.eventType ??
      record.reportStatus ??
      record.readinessStatus ??
      record.gatewayStatus
  );
}

function evidenceTitle(row: unknown): string {
  const record = primaryRecord(row, [
    "document",
    "humanReview",
    "ruleEvaluation",
    "delivery",
    "auditEvent",
    "report",
    "review",
    "gatewayRecord",
  ]);

  return shortId(
    record.id ??
      record.documentId ??
      record.reportId ??
      record.eventId ??
      record.gatewayRecordId ??
      record.targetExecutionId
  );
}

export default function GovernanceEvidencePacketWorkspacePage() {
  const [data, setData] = useState<ModuleData>({
    applications: emptyLoad,
    evidence: [],
    scope: emptyScope,
  });
  const [selectedApplicationId, setSelectedApplicationId] =
    useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [packetPurpose, setPacketPurpose] = useState(
    "internal-governance-review"
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
    const evidence = scoped
      ? await Promise.all(
          evidenceSources.map(async (source) => {
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
      : evidenceSources.map((source) => ({ ...source, ...emptyLoad }));

    setSelectedApplicationId(selectedId);
    setData({ applications, evidence, scope });
    setLastLoadedAt(new Date().toLocaleTimeString());
    setRefreshing(false);
  }, [selectedApplicationId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 16 Governance Evidence Packet Workspace",
        "Internal audit and governance evidence compilation surface",
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

  const recordEvidenceSummary = useCallback(async () => {
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
          reportType: "GOVERNANCE_EVIDENCE_SUMMARY",
          metadata: {
            role: "governance",
            module: "Module 16 - Governance Evidence Packet Workspace",
            advisoryOnly: true,
            officialUseAllowed: false,
            externalReportGenerated: false,
          },
          payload: {
            packetPurpose,
            governedScope: data.scope,
            evidenceCounts: data.evidence.map((source) => ({
              moduleNumber: source.moduleNumber,
              label: source.label,
              count: source.count,
              ok: source.ok,
            })),
            advisoryOnly: true,
            humanReviewRequired: true,
          },
        }),
      });
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ?? "Evidence summary returned review."
        );
      } else {
        const report = primaryRecord(json, ["reportRecord"]);

        setActionMessage(
          `Evidence summary recorded: ${shortId(
            report.reportId ?? report.id
          )} / ${normalizeStatus(report.reportStatus)}`
        );
        await loadAll();
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown evidence packet action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [data.evidence, data.scope, loadAll, packetPurpose]);

  const totalEvidence = data.evidence.reduce(
    (total, source) => total + source.count,
    0
  );
  const connectedSources = data.evidence.filter((source) => source.ok).length;
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    `Scope ${data.scope.applicationId ?? data.scope.tenantId ?? "Unscoped"}`,
    "Evidence Packet",
    "Advisory Export Only",
  ];

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="16"
          title="Governance Evidence Packet"
          subtitle="Cross-module evidence compilation for review, audit preparation, retention, and escalation packets."
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
              label: "Evidence Records",
              value: totalEvidence,
              color: "#0f766e",
            },
            {
              label: "Connected Sources",
              value: connectedSources,
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
            <h2 style={{ margin: 0, fontSize: 20 }}>Packet Controls</h2>
            <FieldLabel label="Packet purpose">
              <input
                value={packetPurpose}
                onChange={(event) => setPacketPurpose(event.target.value)}
                style={inputStyle}
              />
            </FieldLabel>
            <ActionButton
              disabled={actionBusy || !data.scope.applicationId}
              onClick={() => void recordEvidenceSummary()}
            >
              Record Advisory Evidence Summary
            </ActionButton>
            {actionMessage ? (
              <p style={{ margin: 0, color: "#334155", lineHeight: 1.5 }}>
                {actionMessage}
              </p>
            ) : null}
            <p style={{ margin: 0, color: "#64748b", lineHeight: 1.5 }}>
              Evidence packets are internal advisory records. External
              disclosure still requires redaction, recipient authority, and
              governed export review.
            </p>
            <h3 style={{ margin: "8px 0 0", fontSize: 18 }}>Application Scope</h3>
            {data.applications.rows.length === 0 ? (
              <EmptyState>No governed applications are available yet.</EmptyState>
            ) : (
              data.applications.rows.slice(0, 6).map((row) => {
                const application = primaryRecord(row, ["application"]);
                const id = stringValue(application.id);
                const active = id === data.scope.applicationId;

                return (
                  <button
                    key={id ?? JSON.stringify(row)}
                    type="button"
                    onClick={() => setSelectedApplicationId(id)}
                    style={{
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
                  </button>
                );
              })
            )}
          </aside>

          <section style={{ display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Packet Sources</h2>
            {data.evidence.map((source) => (
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
                      {source.packetRole}
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
                    No records in this packet source for the current scope.
                  </span>
                ) : (
                  <div style={{ display: "grid", gap: 6 }}>
                    {source.rows.slice(0, 3).map((row) => (
                      <span
                        key={`${source.label}-${evidenceTitle(row)}-${evidenceStatus(row)}`}
                        style={{ color: "#475569", fontSize: 13 }}
                      >
                        {evidenceTitle(row)} / {evidenceStatus(row)}
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
