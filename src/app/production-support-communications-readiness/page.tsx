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
 * Module 35 - Production Support Communications Readiness Gate
 *
 * Master Volume Governance:
 * - Vol 0: gives operators one support and communications evidence surface
 *   after incident readiness and before any public or customer communication.
 * - Vol I: keeps support escalation, public status, borrower notices, and
 *   customer communications subordinate to constitutional governance.
 * - Vol II: blocks approvals, public exposure, official reports, notice sends,
 *   payment capture, public verification, legal advice, partner commitments,
 *   agency commitments, and underwriting reliance.
 * - Vol III: consumes incident readiness, support routing, communication
 *   templates, public status, escalation, accessibility, redaction, replay,
 *   audit, and data-rights evidence.
 * - Vol III-B: exposes classification, observability, version, and runtime
 *   posture for support communications readiness evidence review.
 * - Vol IV: supports support runbook review, customer-safe language,
 *   escalation routing, communications freeze, public status review, and
 *   evidence preservation.
 * - Vol V: preserves content claims, data rights, controlled disclosure,
 *   replayability, explainability, redaction, and advisory-only boundaries.
 * - Vol VI: keeps source intelligence, public DTO, and portable surface
 *   governance blocked from live production exposure until approved.
 */

const actorId = "module-35-production-support-communications-readiness";

type ModuleData = {
  support: LoadResult;
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

export default function ProductionSupportCommunicationsReadinessPage() {
  const [data, setData] = useState<ModuleData>({ support: emptyLoad });
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

      const support = await loadJsonSurface(
        `/api/governance/production-support-communications-readiness?actorId=${actorId}`,
        ["productionSupportCommunicationsReadinessReviews"]
      );

      setData({ support });
      setLastLoadedAt(new Date().toLocaleTimeString());
      setRefreshing(false);
    },
    []
  );

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const review = useMemo(
    () => firstRecord(data.support.rows),
    [data.support.rows]
  );
  const supportItems = arrayFromRecord(review, "supportItems");
  const blockingReasons = arrayFromRecord(review, "blockingReasons");
  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 35 Production Support Communications Readiness Gate",
        "Internal support communications readiness review surface",
        "Your document was received.",
        "Human review is pending.",
        "More information may be needed.",
        "No production support communications approval has been granted.",
        "No support operations activation has been approved.",
        "No customer communication has been released.",
        "No public status page has been enabled.",
        "No borrower notice has been sent.",
        "No official report has been published.",
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
  const totalSupportItems = nestedNumber(data.support.json, "totalSupportItems");
  const blocked = nestedNumber(data.support.json, "blocked");
  const reviewRequired = nestedNumber(data.support.json, "reviewRequired");
  const supportApproval = nestedNumber(
    data.support.json,
    "supportCommunicationsApprovalGranted"
  );
  const supportActivated = nestedNumber(
    data.support.json,
    "supportOperationsActivated"
  );
  const customerCommunicationsReleased = nestedNumber(
    data.support.json,
    "customerCommunicationsReleased"
  );
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    supportApproval === 0 ? "Support Approval Blocked" : "Support Review",
    supportActivated === 0
      ? "Support Activation Blocked"
      : "Support Activation Review",
    customerCommunicationsReleased === 0
      ? "Communications Blocked"
      : "Communications Review",
    `Controls ${totalSupportItems}`,
  ];

  const recordSupportPacket = useCallback(async () => {
    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch(
        "/api/governance/production-support-communications-readiness",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            actorId,
            supportScope: "platform",
            reviewNote:
              "module-35-production-support-communications-readiness-evidence",
          }),
        }
      );
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ??
            "Production support communications readiness returned review."
        );
      } else {
        const supportReadiness = isRecord(json.supportReadiness)
          ? json.supportReadiness
          : {};

        setActionMessage(
          `Production support communications readiness packet recorded: ${shortId(
            supportReadiness.supportReadinessPacketId
          )}. No support activation, support escalation, customer communication, regulatory communication, public status page, borrower notice send, official report publication, public verification, legal advice, official reliance, production cutover authority, deployment, public API exposure, portal launch, payment capture, or live external action was approved.`
        );
        await loadAll({ clearActionMessage: false });
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown production support communications readiness action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [loadAll]);

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="35"
          title="Production Support Communications Readiness Gate"
          subtitle="Internal support communications readiness review. It packages support routing, customer-safe templates, public status posture, escalation, accessibility, redaction, data-rights, audit, and replay evidence only; it does not release communications or activate support operations."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Support Controls",
              value: totalSupportItems,
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
              label: "Communication Release",
              value: customerCommunicationsReleased,
              color:
                customerCommunicationsReleased === 0 ? "#0f766e" : "#be123c",
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
              "No production support communications approval has been granted.",
              "No support operations activation has been approved.",
              "No support escalation has been activated.",
              "No customer communication has been released.",
              "No regulatory communication has been released.",
              "No public status page has been enabled.",
              "No borrower notice has been sent.",
              "No official report has been published.",
              "No public verification authority has been granted.",
              "No legal advice has been provided.",
              "No official reliance has been created.",
              "No incident response activation has been approved.",
              "No incident bridge has been activated for production launch.",
              "No rollback authorization has been granted.",
              "No production cutover authority has been granted.",
              "No production cutover has been approved or executed.",
              "No deployment has been executed.",
              "No public production API exposure has been approved.",
              "No production portal launch has been executed.",
              "No payment capture has been enabled.",
              "This gate is production support communications readiness review evidence only.",
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
                  Support Communications Readiness Review
                </h2>
                <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                  {lastLoadedAt
                    ? `Loaded ${lastLoadedAt}`
                    : "Loading governed support communications readiness review"}
                </p>
              </div>
              <ActionButton
                disabled={actionBusy}
                onClick={recordSupportPacket}
              >
                {actionBusy ? "Recording Packet" : "Record Support Packet"}
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

            {data.support.error ? (
              <EmptyState>{data.support.error}</EmptyState>
            ) : null}

            {review ? (
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  ["Review Status", review.reviewStatus],
                  [
                    "Support Approval",
                    review.supportCommunicationsApprovalGranted,
                  ],
                  ["Support Activated", review.supportOperationsActivated],
                  ["Support Escalation", review.supportEscalationActivated],
                  [
                    "Customer Communications",
                    review.customerCommunicationsReleased,
                  ],
                  [
                    "Regulatory Communications",
                    review.regulatoryCommunicationsReleased,
                  ],
                  ["Public Status Page", review.publicStatusPageEnabled],
                  ["Borrower Notice Send", review.borrowerNoticeSendAllowed],
                  ["Official Report", review.officialReportPublicationAllowed],
                  ["Public Verification", review.publicVerificationAllowed],
                  ["Legal Advice", review.legalAdviceProvided],
                  ["Official Reliance", review.officialRelianceAllowed],
                  ["Incident Activated", review.incidentResponseActivated],
                  ["Incident Bridge", review.incidentBridgeActivated],
                  ["Rollback Authorized", review.rollbackAuthorized],
                  ["Emergency Hold Released", review.emergencyHoldReleased],
                  ["Kill Switch Activated", review.killSwitchActivated],
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
                          "PRODUCTION_SUPPORT_COMMUNICATIONS_READINESS_BLOCKED"
                      }
                    >
                      {value === false ? "Blocked" : normalizeStatus(value)}
                    </StatusPill>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>
                No production support communications readiness review returned.
              </EmptyState>
            )}
          </div>

          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 14 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>
                Support Communications Controls
              </h2>
              <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                Pass items are attached evidence. Review and blocked items
                remain support, communications, public status, cutover,
                deployment, and launch blockers.
              </p>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {supportItems.map((supportItem, index) => {
                const row = isRecord(supportItem) ? supportItem : {};

                return (
                  <div
                    key={`${stringValue(row.id) ?? "support"}-${index}`}
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
                      <strong>{stringValue(row.label) ?? "Support"}</strong>
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
                Remaining Support Blockers
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
