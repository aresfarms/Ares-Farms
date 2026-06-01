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
 * Module 34 - Production Incident Response Readiness Gate
 *
 * Master Volume Governance:
 * - Vol 0: gives operators one incident-readiness evidence surface after
 *   operations monitoring and before any live production incident action.
 * - Vol I: keeps incident response, rollback, support, public status, and
 *   emergency-hold authority subordinate to constitutional governance.
 * - Vol II: blocks approvals, public exposure, official reports, notice sends,
 *   payment capture, public verification, legal advice, partner commitments,
 *   agency commitments, and underwriting reliance.
 * - Vol III: consumes operations monitoring, incident command, severity,
 *   escalation, rollback, replay, support, communications, and emergency-hold
 *   evidence.
 * - Vol III-B: exposes classification, observability, version, and runtime
 *   posture for incident readiness evidence review.
 * - Vol IV: supports incident command review, rollback decision trees,
 *   customer-safe communications, support escalation, and evidence retention.
 * - Vol V: preserves content claims, data rights, controlled disclosure,
 *   replayability, explainability, and advisory-only boundaries.
 * - Vol VI: keeps source intelligence, public DTO, and portable surface
 *   governance blocked from live production exposure until approved.
 */

const actorId = "module-34-production-incident-response-readiness";

type ModuleData = {
  incidents: LoadResult;
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

export default function ProductionIncidentResponseReadinessPage() {
  const [data, setData] = useState<ModuleData>({ incidents: emptyLoad });
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

      const incidents = await loadJsonSurface(
        `/api/governance/production-incident-response-readiness?actorId=${actorId}`,
        ["productionIncidentResponseReadinessReviews"]
      );

      setData({ incidents });
      setLastLoadedAt(new Date().toLocaleTimeString());
      setRefreshing(false);
    },
    []
  );

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const review = useMemo(
    () => firstRecord(data.incidents.rows),
    [data.incidents.rows]
  );
  const incidentItems = arrayFromRecord(review, "incidentItems");
  const blockingReasons = arrayFromRecord(review, "blockingReasons");
  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 34 Production Incident Response Readiness Gate",
        "Internal incident response readiness review surface",
        "Your document was received.",
        "Human review is pending.",
        "More information may be needed.",
        "No production incident response approval has been granted.",
        "No incident response activation has been approved.",
        "No incident bridge has been activated for production launch.",
        "No rollback authorization has been granted.",
        "No customer communication has been released.",
        "No public status page has been enabled.",
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
  const totalIncidentItems = nestedNumber(
    data.incidents.json,
    "totalIncidentItems"
  );
  const blocked = nestedNumber(data.incidents.json, "blocked");
  const reviewRequired = nestedNumber(data.incidents.json, "reviewRequired");
  const incidentApproval = nestedNumber(
    data.incidents.json,
    "incidentResponseApprovalGranted"
  );
  const incidentActivated = nestedNumber(
    data.incidents.json,
    "incidentResponseActivated"
  );
  const publicStatusPageEnabled = nestedNumber(
    data.incidents.json,
    "publicStatusPageEnabled"
  );
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    incidentApproval === 0
      ? "Incident Approval Blocked"
      : "Incident Review",
    incidentActivated === 0
      ? "Incident Activation Blocked"
      : "Incident Activation Review",
    publicStatusPageEnabled === 0 ? "Public Status Blocked" : "Status Review",
    `Controls ${totalIncidentItems}`,
  ];

  const recordIncidentPacket = useCallback(async () => {
    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch(
        "/api/governance/production-incident-response-readiness",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            actorId,
            incidentScope: "platform",
            reviewNote:
              "module-34-production-incident-response-readiness-evidence",
          }),
        }
      );
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ??
            "Production incident response readiness returned review."
        );
      } else {
        const incidentReadiness = isRecord(json.incidentReadiness)
          ? json.incidentReadiness
          : {};

        setActionMessage(
          `Production incident response readiness packet recorded: ${shortId(
            incidentReadiness.incidentReadinessPacketId
          )}. No incident response activation, incident bridge activation, rollback authorization, emergency rollback, emergency hold release, kill-switch activation, customer communication, public status page, support escalation, production cutover authority, deployment, public API exposure, portal launch, payment capture, borrower notice send, official report publication, public verification, legal advice, or official reliance was approved.`
        );
        await loadAll({ clearActionMessage: false });
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown production incident response readiness action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [loadAll]);

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="34"
          title="Production Incident Response Readiness Gate"
          subtitle="Internal incident response readiness review. It packages incident command, severity, escalation, rollback, support, communications, audit/replay, data integrity, emergency hold, and kill-switch evidence only; it does not activate incident response or expose production."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Incident Controls",
              value: totalIncidentItems,
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
              label: "Incident Activation",
              value: incidentActivated,
              color: incidentActivated === 0 ? "#0f766e" : "#be123c",
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
              "No production incident response approval has been granted.",
              "No incident response activation has been approved.",
              "No incident bridge has been activated for production launch.",
              "No on-call activation has been approved.",
              "No rollback authorization has been granted.",
              "No emergency rollback has been executed.",
              "No emergency hold has been released.",
              "No kill-switch activation has been executed.",
              "No customer communication has been released.",
              "No regulatory communication has been released.",
              "No public status page has been enabled.",
              "No support escalation has been activated.",
              "No production cutover authority has been granted.",
              "No production cutover has been approved or executed.",
              "No deployment has been executed.",
              "No public production API exposure has been approved.",
              "No production portal launch has been executed.",
              "No public verification authority has been granted.",
              "No payment capture has been enabled.",
              "No borrower notice has been sent.",
              "No official report has been published.",
              "This gate is production incident response readiness review evidence only.",
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
                  Incident Response Readiness Review
                </h2>
                <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                  {lastLoadedAt
                    ? `Loaded ${lastLoadedAt}`
                    : "Loading governed incident response readiness review"}
                </p>
              </div>
              <ActionButton
                disabled={actionBusy}
                onClick={recordIncidentPacket}
              >
                {actionBusy ? "Recording Packet" : "Record Incident Packet"}
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

            {data.incidents.error ? (
              <EmptyState>{data.incidents.error}</EmptyState>
            ) : null}

            {review ? (
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  ["Review Status", review.reviewStatus],
                  [
                    "Incident Approval",
                    review.incidentResponseApprovalGranted,
                  ],
                  ["Incident Activated", review.incidentResponseActivated],
                  ["Incident Bridge", review.incidentBridgeActivated],
                  ["On-Call Activated", review.onCallActivated],
                  ["Rollback Authorized", review.rollbackAuthorized],
                  ["Emergency Rollback", review.emergencyRollbackExecuted],
                  ["Emergency Hold Released", review.emergencyHoldReleased],
                  ["Kill Switch Activated", review.killSwitchActivated],
                  [
                    "Customer Communications",
                    review.customerCommunicationsReleased,
                  ],
                  [
                    "Regulatory Communications",
                    review.regulatoryCommunicationsReleased,
                  ],
                  ["Public Status Page", review.publicStatusPageEnabled],
                  ["Support Escalation", review.supportEscalationActivated],
                  [
                    "Operations Approval",
                    review.operationsMonitoringApprovalGranted,
                  ],
                  [
                    "Monitoring Activated",
                    review.productionMonitoringActivated,
                  ],
                  ["Cutover Authority", review.cutoverAuthorityGranted],
                  ["Cutover Executed", review.productionCutoverExecuted],
                  ["Deployment Executed", review.deploymentExecuted],
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
                        value ===
                          "PRODUCTION_INCIDENT_RESPONSE_READINESS_BLOCKED"
                      }
                    >
                      {value === false ? "Blocked" : normalizeStatus(value)}
                    </StatusPill>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>
                No production incident response readiness review returned.
              </EmptyState>
            )}
          </div>

          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 14 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>
                Incident Response Controls
              </h2>
              <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                Pass items are attached evidence. Review and blocked items
                remain incident, rollback, support, communications, cutover,
                deployment, and launch blockers.
              </p>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {incidentItems.map((incidentItem, index) => {
                const row = isRecord(incidentItem) ? incidentItem : {};

                return (
                  <div
                    key={`${stringValue(row.id) ?? "incident"}-${index}`}
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
                      <strong>{stringValue(row.label) ?? "Incident"}</strong>
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
                Remaining Incident Blockers
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
