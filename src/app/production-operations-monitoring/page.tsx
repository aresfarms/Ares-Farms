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
  StatusPill,
  SummaryGrid,
  isRecord,
  loadJsonSurface,
  moduleContainerStyle,
  moduleShellStyle,
  normalizeStatus,
  panelStyle,
  shortId,
  stringValue,
} from "@/app/internalModuleKit";

/**
 * Module 33 - Production Operations Monitoring Gate
 *
 * Master Volume Governance:
 * - Vol 0: gives operators one operations-monitoring evidence surface after
 *   release-board review and before any live production action.
 * - Vol I: keeps monitoring, on-call, incident, rollback, support, and
 *   emergency-hold authority subordinate to constitutional governance.
 * - Vol II: blocks approvals, public exposure, official reports, notice sends,
 *   payment capture, public verification, legal advice, partner commitments,
 *   agency commitments, and underwriting reliance.
 * - Vol III: consumes release-board, cutover, deployment, launch, replay,
 *   monitoring, backup, rollback, incident, support, and emergency-hold
 *   evidence.
 * - Vol III-B: exposes classification, observability, version, and runtime
 *   posture for operations monitoring evidence review.
 * - Vol IV: supports on-call review, incident bridge, rollback, backup/restore,
 *   support routing, communications freeze, and emergency hold review.
 * - Vol V: preserves content claims, data rights, controlled disclosure,
 *   replayability, explainability, and advisory-only boundaries.
 * - Vol VI: keeps source intelligence, public DTO, and portable surface
 *   governance blocked from live production exposure until approved.
 */

const actorId = "module-33-production-operations-monitoring";

type ModuleData = {
  operations: LoadResult;
};

const emptyLoad: LoadResult = {
  ok: true,
  count: 0,
  rows: [],
  traceId: null,
  error: null,
  json: null,
};

function firstRecord(rows: unknown[]): Record<string, unknown> | null {
  const first = rows[0];

  return isRecord(first) ? first : null;
}

function arrayFromRecord(
  row: Record<string, unknown> | null,
  key: string
): unknown[] {
  const value = row?.[key];

  return Array.isArray(value) ? value : [];
}

function nestedNumber(
  record: Record<string, unknown> | null,
  key: string
): number {
  const summary = isRecord(record?.summary) ? record.summary : {};
  const value = summary[key];

  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function statusOk(value: unknown): boolean {
  return stringValue(value) === "PASS";
}

export default function ProductionOperationsMonitoringPage() {
  const [data, setData] = useState<ModuleData>({ operations: emptyLoad });
  const [refreshing, setRefreshing] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);

  const loadAll = useCallback(
    async (options?: { clearActionMessage?: boolean }) => {
      setRefreshing(true);
      if (options?.clearActionMessage !== false) {
        setActionMessage(null);
      }

      const operations = await loadJsonSurface(
        `/api/governance/production-operations-monitoring?actorId=${actorId}`,
        ["productionOperationsMonitoringReviews"]
      );

      setData({ operations });
      setLastLoadedAt(new Date().toLocaleTimeString());
      setRefreshing(false);
    },
    []
  );

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const review = useMemo(
    () => firstRecord(data.operations.rows),
    [data.operations.rows]
  );
  const operationsItems = arrayFromRecord(review, "operationsItems");
  const blockingReasons = arrayFromRecord(review, "blockingReasons");
  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 33 Production Operations Monitoring Gate",
        "Internal operations monitoring review surface",
        "Your document was received.",
        "Human review is pending.",
        "More information may be needed.",
        "No production operations monitoring approval has been granted.",
        "No production monitoring, paging, or on-call activation has been approved.",
        "No incident bridge has been activated for production launch.",
        "No rollback authorization has been granted.",
        "No emergency hold has been released.",
        "No public production API exposure has been approved.",
        "No production portal launch has been executed.",
        ADVISORY_ONLY_DISCLOSURE,
        BORROWER_PORTABILITY_DISCLOSURE,
        LENDER_READY_DISCLOSURE,
      ],
      context: {
        borrowerPortabilityAvailable: true,
        freeTierBaselineReadinessAvailable: true,
        lenderReadyDisclosurePresent: true,
        officialDecisionAuthority: false,
        publicVerificationGatewayOperational: false,
      },
    });
  }, []);
  const totalOperationsItems = nestedNumber(
    data.operations.json,
    "totalOperationsItems"
  );
  const blocked = nestedNumber(data.operations.json, "blocked");
  const reviewRequired = nestedNumber(data.operations.json, "reviewRequired");
  const operationsApproval = nestedNumber(
    data.operations.json,
    "operationsMonitoringApprovalGranted"
  );
  const productionMonitoringActivated = nestedNumber(
    data.operations.json,
    "productionMonitoringActivated"
  );
  const incidentBridgeActivated = nestedNumber(
    data.operations.json,
    "incidentBridgeActivated"
  );
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    operationsApproval === 0
      ? "Operations Approval Blocked"
      : "Operations Review",
    productionMonitoringActivated === 0
      ? "Monitoring Activation Blocked"
      : "Monitoring Review",
    incidentBridgeActivated === 0
      ? "Incident Bridge Blocked"
      : "Incident Review",
    `Controls ${totalOperationsItems}`,
  ];

  const recordOperationsPacket = useCallback(async () => {
    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch(
        "/api/governance/production-operations-monitoring",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            actorId,
            operationsScope: "platform",
            reviewNote: "module-33-production-operations-monitoring-evidence",
          }),
        }
      );
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ??
            "Production operations monitoring returned review."
        );
      } else {
        const operationsMonitoring = isRecord(json.operationsMonitoring)
          ? json.operationsMonitoring
          : {};

        setActionMessage(
          `Production operations monitoring packet recorded: ${shortId(
            operationsMonitoring.operationsMonitoringPacketId
          )}. No monitoring activation, on-call activation, incident bridge activation, rollback authorization, emergency hold release, production cutover authority, deployment, public API exposure, portal launch, payment capture, borrower notice send, official report publication, public verification, legal advice, or official reliance was approved.`
        );
        await loadAll({ clearActionMessage: false });
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown production operations monitoring action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [loadAll]);

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="33"
          title="Production Operations Monitoring Gate"
          subtitle="Internal operations monitoring review. It packages monitoring, alerting, on-call, incident bridge, rollback, backup, restore, support, communications, audit export, and emergency hold evidence only; it does not activate monitoring or expose production."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Operations Controls",
              value: totalOperationsItems,
              color: "#2563eb",
            },
            {
              label: "Blocked",
              value: blocked,
              color: "#be123c",
            },
            {
              label: "Review Required",
              value: reviewRequired,
              color: "#b45309",
            },
            {
              label: "Monitoring Activation",
              value: productionMonitoringActivated,
              color:
                productionMonitoringActivated === 0 ? "#0f766e" : "#be123c",
            },
          ]}
        />

        <section
          style={{
            ...panelStyle,
            padding: 16,
            display: "grid",
            gap: 10,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18 }}>
            Public-Safe Control Language
          </h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              "Your document was received.",
              "Human review is pending.",
              "More information may be needed.",
              "No production operations monitoring approval has been granted.",
              "No production monitoring, paging, or on-call activation has been approved.",
              "No incident bridge has been activated for production launch.",
              "No rollback authorization has been granted.",
              "No emergency hold has been released.",
              "No production release board approval has been granted.",
              "No production cutover authority has been granted.",
              "No production cutover has been approved or executed.",
              "No deployment has been executed.",
              "No public production API exposure has been approved.",
              "No production portal launch has been executed.",
              "No public verification authority has been granted.",
              "No payment capture has been enabled.",
              "No borrower notice has been sent.",
              "No official report has been published.",
              "This gate is production operations monitoring review evidence only.",
            ].map((message) => (
              <StatusPill key={message} ok>
                {message}
              </StatusPill>
            ))}
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
            gap: 16,
            alignItems: "start",
          }}
        >
          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: 18 }}>
                  Operations Monitoring Review
                </h2>
                <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                  {lastLoadedAt
                    ? `Loaded ${lastLoadedAt}`
                    : "Loading governed operations monitoring review"}
                </p>
              </div>
              <ActionButton
                disabled={actionBusy}
                onClick={recordOperationsPacket}
              >
                {actionBusy
                  ? "Recording Packet"
                  : "Record Operations Packet"}
              </ActionButton>
            </div>

            {actionMessage ? (
              <div
                style={{
                  padding: 12,
                  border: "1px solid #bfdbfe",
                  borderRadius: 8,
                  background: "#eff6ff",
                  color: "#1e3a8a",
                  overflowWrap: "anywhere",
                }}
              >
                {actionMessage}
              </div>
            ) : null}

            {data.operations.error ? (
              <EmptyState>{data.operations.error}</EmptyState>
            ) : null}

            {review ? (
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  ["Review Status", review.reviewStatus],
                  [
                    "Operations Approval",
                    review.operationsMonitoringApprovalGranted,
                  ],
                  [
                    "Monitoring Activated",
                    review.productionMonitoringActivated,
                  ],
                  ["On-Call Activated", review.onCallActivated],
                  ["Incident Bridge", review.incidentBridgeActivated],
                  ["Rollback Authorized", review.rollbackAuthorized],
                  ["Emergency Hold Released", review.emergencyHoldReleased],
                  ["Release Board Approval", review.releaseBoardApprovalGranted],
                  ["Cutover Authority", review.cutoverAuthorityGranted],
                  ["Cutover Executed", review.productionCutoverExecuted],
                  ["Deployment Executed", review.deploymentExecuted],
                  ["Production Secrets", review.productionSecretsActivated],
                  ["Public DNS Cutover", review.publicDnsCutoverAllowed],
                  ["Database Migration", review.databaseMigrationAllowed],
                  [
                    "Public API Exposure",
                    review.publicProductionApiExposureAllowed,
                  ],
                  ["Production Portal Launch", review.productionPortalLaunchExecuted],
                  ["Live External Action", review.liveExternalActionPerformed],
                  ["Payment Capture", review.paymentCaptureAllowed],
                  ["Notice Send", review.borrowerNoticeSendAllowed],
                  ["Official Report", review.officialReportPublicationAllowed],
                  ["Public Verification", review.publicVerificationAllowed],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      borderBottom: "1px solid #e2e8f0",
                      paddingBottom: 8,
                    }}
                  >
                    <span>{String(label)}</span>
                    <StatusPill
                      ok={
                        value === false ||
                        value === "PRODUCTION_OPERATIONS_MONITORING_BLOCKED"
                      }
                    >
                      {value === false ? "Blocked" : normalizeStatus(value)}
                    </StatusPill>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>
                No production operations monitoring review returned.
              </EmptyState>
            )}
          </div>

          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 14 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>
                Operations Monitoring Controls
              </h2>
              <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                Pass items are attached evidence. Review and blocked items
                remain operations, cutover, deployment, and launch blockers.
              </p>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {operationsItems.map((operationsItem, index) => {
                const row = isRecord(operationsItem) ? operationsItem : {};

                return (
                  <div
                    key={`${stringValue(row.id) ?? "operations"}-${index}`}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      padding: 10,
                      display: "grid",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <strong>{stringValue(row.label) ?? "Operations"}</strong>
                      <StatusPill ok={statusOk(row.status)}>
                        {normalizeStatus(row.status)}
                      </StatusPill>
                    </div>
                    <span style={{ color: "#64748b", fontSize: 13 }}>
                      {stringValue(row.evidenceRef) ?? "No evidence reference"}
                    </span>
                    {row.blockingReason ? (
                      <span style={{ color: "#991b1b", fontSize: 13 }}>
                        {stringValue(row.blockingReason)}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div>
              <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>
                Remaining Operations Blockers
              </h3>
              {blockingReasons.length === 0 ? (
                <EmptyState>No blocking reasons returned.</EmptyState>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18, color: "#475569" }}>
                  {blockingReasons.slice(0, 18).map((reason, index) => (
                    <li key={`${String(reason)}-${index}`}>
                      {stringValue(reason) ?? "Review required"}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
