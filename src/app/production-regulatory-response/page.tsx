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
 * Module 41 - Production Regulatory Response and Corrective Action Gate
 *
 * Master Volume Governance:
 * - Vol 0: gives operators one response/corrective-action evidence surface
 *   after regulatory examination and archive review.
 * - Vol I: keeps regulator response and corrective-action authority
 *   subordinate to constitutional governance, qualified legal/compliance
 *   ownership, and recorded human review.
 * - Vol II: blocks official regulator responses, corrective-action
 *   commitments, remediation execution, notice sends, official reports,
 *   payment capture, legal advice, public verification, regulatory reliance,
 *   official reliance, and external commitments.
 * - Vol III: consumes examiner finding, audit, replay, retention, redaction,
 *   source authority, report, notice, payment, communication, and live-action
 *   boundary evidence.
 * - Vol III-B: exposes classification, observability, version, and runtime
 *   posture for response and corrective-action evidence review.
 * - Vol IV: supports examiner finding intake, corrective-action tracking,
 *   remediation review, legal hold, exception remediation, incident handoff,
 *   and evidence retention.
 * - Vol V: preserves content claims, data rights, controlled disclosure,
 *   replayability, explainability, redaction, and advisory-only boundaries.
 * - Vol VI: keeps source intelligence, public DTO, and portable surface
 *   governance blocked from official examiner disclosure until approved.
 */

const actorId = "module-41-production-regulatory-response";

type ModuleData = {
  response: LoadResult;
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

export default function ProductionRegulatoryResponsePage() {
  const [data, setData] = useState<ModuleData>({ response: emptyLoad });
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

      const response = await loadJsonSurface(
        `/api/governance/production-regulatory-response?actorId=${actorId}`,
        ["productionRegulatoryResponseReviews"]
      );

      setData({ response });
      setLastLoadedAt(new Date().toLocaleTimeString());
      setRefreshing(false);
    },
    []
  );

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const review = useMemo(
    () => firstRecord(data.response.rows),
    [data.response.rows]
  );
  const responseItems = arrayFromRecord(review, "responseItems");
  const blockingReasons = arrayFromRecord(review, "blockingReasons");
  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 41 Production Regulatory Response and Corrective Action Gate",
        "Internal regulatory response and corrective-action evidence review surface",
        "Your document was received.",
        "Human review is pending.",
        "More information may be needed.",
        "No regulatory response package has been approved.",
        "No official regulator response has been issued.",
        "No corrective action plan has been approved.",
        "No corrective action has been committed.",
        "No corrective action has been executed.",
        "No remediation plan has been approved.",
        "No remediation has been executed.",
        "No examiner finding has been closed.",
        "No public verification authority has been granted.",
        "No official reliance has been created.",
        "No legal advice has been provided.",
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
  const totalResponseItems = nestedNumber(
    data.response.json,
    "totalResponseItems"
  );
  const blocked = nestedNumber(data.response.json, "blocked");
  const reviewRequired = nestedNumber(data.response.json, "reviewRequired");
  const officialResponse = nestedNumber(
    data.response.json,
    "officialRegulatorResponseIssued"
  );
  const correctiveCommitted = nestedNumber(
    data.response.json,
    "correctiveActionCommitted"
  );
  const remediationExecuted = nestedNumber(
    data.response.json,
    "remediationExecuted"
  );
  const officialReliance = nestedNumber(
    data.response.json,
    "officialRelianceAllowed"
  );
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    officialResponse === 0 ? "Official Response Blocked" : "Response Review",
    correctiveCommitted === 0
      ? "Corrective Commitment Blocked"
      : "Corrective Review",
    remediationExecuted === 0
      ? "Remediation Execution Blocked"
      : "Remediation Review",
    officialReliance === 0 ? "Official Reliance Blocked" : "Reliance Review",
    `Controls ${totalResponseItems}`,
  ];

  const recordResponsePacket = useCallback(async () => {
    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch(
        "/api/governance/production-regulatory-response",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            actorId,
            responseScope: "platform",
            reviewNote: "module-41-regulatory-response-corrective-action-evidence",
          }),
        }
      );
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ??
            "Production regulatory response review returned review."
        );
      } else {
        const responsePacket = isRecord(json.responsePacket)
          ? json.responsePacket
          : {};

        setActionMessage(
          `Regulatory response packet recorded: ${shortId(
            responsePacket.responsePacketId
          )}. No regulatory response package approval, official regulator response, corrective-action plan approval, corrective-action commitment, corrective-action execution, remediation approval, remediation execution, examiner finding closure, legal hold release, external examiner disclosure, public verification, official reliance, legal advice, deployment, public API exposure, portal launch, payment capture, notice send, official report publication, or live external action was approved.`
        );
        await loadAll({ clearActionMessage: false });
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown regulatory response action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [loadAll]);

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="41"
          title="Production Regulatory Response and Corrective Action Gate"
          subtitle="Internal response and corrective-action evidence review. It packages examination, finding, corrective-action, remediation, audit, replay, retention, legal hold, redaction, source authority, report, notice, payment, communication, and live-action evidence only; it does not issue anything to a regulator or commit remediation."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Response Controls",
              value: totalResponseItems,
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
              label: "Official Responses",
              value: officialResponse,
              color: officialResponse === 0 ? "#0f766e" : "#be123c",
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
              "No regulatory response package has been approved.",
              "No official regulator response has been issued.",
              "No corrective action plan has been approved.",
              "No corrective action has been committed.",
              "No corrective action has been executed.",
              "No remediation plan has been approved.",
              "No remediation has been executed.",
              "No examiner finding has been closed.",
              "No external examiner disclosure has been approved.",
              "No legal hold has been released.",
              "No production reliance approval has been granted.",
              "No public verification authority has been granted.",
              "No official reliance has been created.",
              "No legal advice has been provided.",
              "No public production API exposure has been approved.",
              "No production portal launch has been executed.",
              "No borrower notice has been sent.",
              "No official report has been published.",
              "No payment capture has been enabled.",
              "This gate is regulatory response and corrective-action review evidence only.",
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
                  Response Readiness Review
                </h2>
                <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                  {lastLoadedAt
                    ? `Loaded ${lastLoadedAt}`
                    : "Loading governed response review"}
                </p>
              </div>
              <ActionButton disabled={actionBusy} onClick={recordResponsePacket}>
                {actionBusy ? "Recording Packet" : "Record Response Packet"}
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

            {data.response.error ? (
              <EmptyState>{data.response.error}</EmptyState>
            ) : null}

            {review ? (
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  ["Review Status", review.reviewStatus],
                  [
                    "Response Package",
                    review.regulatoryResponsePackageApproved,
                  ],
                  [
                    "Official Regulator Response",
                    review.officialRegulatorResponseIssued,
                  ],
                  [
                    "Corrective Plan",
                    review.correctiveActionPlanApproved,
                  ],
                  [
                    "Corrective Commitment",
                    review.correctiveActionCommitted,
                  ],
                  [
                    "Corrective Execution",
                    review.correctiveActionExecuted,
                  ],
                  ["Remediation Plan", review.remediationPlanApproved],
                  ["Remediation Executed", review.remediationExecuted],
                  ["Finding Closed", review.examinerFindingClosed],
                  [
                    "Examiner Disclosure",
                    review.externalExaminerDisclosureApproved,
                  ],
                  ["Legal Hold Released", review.legalHoldReleased],
                  ["Production Reliance", review.productionRelianceApprovalGranted],
                  ["Public Verification", review.publicVerificationApprovalGranted],
                  ["Official Reliance", review.officialRelianceAllowed],
                  ["Legal Advice", review.legalAdviceProvided],
                  [
                    "Examination Submitted",
                    review.regulatoryExaminationPackageSubmitted,
                  ],
                  ["Archive Certified", review.examinationArchiveCertified],
                  ["Production Health", review.productionHealthCertified],
                  [
                    "Production Activation",
                    review.productionActivationExecuted,
                  ],
                  ["Go-Live Approved", review.goLiveApproved],
                  ["Launch Authorized", review.productionLaunchAuthorized],
                  ["Deployment Executed", review.deploymentExecuted],
                  [
                    "Public API Exposure",
                    review.publicProductionApiExposureAllowed,
                  ],
                  ["Production Portal Launch", review.productionPortalLaunchExecuted],
                  ["Borrower Notice Send", review.borrowerNoticeSendAllowed],
                  ["Official Report", review.officialReportPublicationAllowed],
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
                        value === "PRODUCTION_REGULATORY_RESPONSE_BLOCKED"
                      }
                    >
                      {value === false ? "Blocked" : normalizeStatus(value)}
                    </StatusPill>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>No regulatory response review returned.</EmptyState>
            )}
          </div>

          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 14 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>
                Response and Corrective-Action Controls
              </h2>
              <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                Pass items are attached evidence. Review and blocked items
                remain response, corrective-action, remediation, finding
                closure, legal, public verification, official reliance, report,
                notice, payment, production, and live-action blockers.
              </p>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {responseItems.length > 0 ? (
                responseItems.map((item, index) => {
                  const record = isRecord(item) ? item : {};

                  return (
                    <div
                      key={stringValue(record.id) ?? index}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        padding: 12,
                        display: "grid",
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          alignItems: "center",
                        }}
                      >
                        <strong>{stringValue(record.label)}</strong>
                        <StatusPill ok={statusOk(record.status)}>
                          {normalizeStatus(record.status)}
                        </StatusPill>
                      </div>
                      <span style={{ color: "#475569" }}>
                        {stringValue(record.evidenceRef)}
                      </span>
                      {record.blockingReason ? (
                        <span style={{ color: "#9f1239" }}>
                          {stringValue(record.blockingReason)}
                        </span>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <EmptyState>No response controls returned.</EmptyState>
              )}
            </div>
          </div>
        </section>

        <section style={{ ...panelStyle, padding: 16, display: "grid", gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Blocking Reasons</h2>
          {blockingReasons.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 18, color: "#475569" }}>
              {blockingReasons.map((reason, index) => (
                <li key={`${String(reason)}-${index}`}>{stringValue(reason)}</li>
              ))}
            </ul>
          ) : (
            <EmptyState>No blocking reasons returned.</EmptyState>
          )}
        </section>
      </div>
    </main>
  );
}
