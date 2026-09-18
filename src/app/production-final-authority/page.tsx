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
 * Module 36 - Production Final Authority Gate
 *
 * Master Volume Governance:
 * - Vol 0: gives operators one final go/no-go evidence surface before any
 *   production launch, public exposure, or live action.
 * - Vol I: keeps launch authority subordinate to constitutional governance,
 *   qualified human ownership, and documented supremacy.
 * - Vol II: blocks approvals, public exposure, official reports, notice sends,
 *   payment capture, public verification, legal advice, partner commitments,
 *   agency commitments, and official reliance.
 * - Vol III: consumes launch, deployment, cutover, release board, operations,
 *   incident, support, communications, audit, privacy, redaction, data-rights,
 *   and claims evidence.
 * - Vol III-B: exposes classification, observability, version, and runtime
 *   posture for final authority evidence review.
 * - Vol IV: supports final go/no-go review, release ownership, executive
 *   escalation, rollback readiness, support readiness, and evidence retention.
 * - Vol V: preserves content claims, data rights, controlled disclosure,
 *   replayability, explainability, redaction, and advisory-only boundaries.
 * - Vol VI: keeps source intelligence, public DTO, and portable surface
 *   governance blocked from live production exposure until approved.
 */

const actorId = "module-36-production-final-authority";

type ModuleData = {
  authority: LoadResult;
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

export default function ProductionFinalAuthorityPage() {
  const [data, setData] = useState<ModuleData>({ authority: emptyLoad });
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

      const authority = await loadJsonSurface(
        `/api/governance/production-final-authority?actorId=${actorId}`,
        ["productionFinalAuthorityReviews"]
      );

      setData({ authority });
      setLastLoadedAt(new Date().toLocaleTimeString());
      setRefreshing(false);
    },
    []
  );

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const review = useMemo(
    () => firstRecord(data.authority.rows),
    [data.authority.rows]
  );
  const authorityItems = arrayFromRecord(review, "authorityItems");
  const blockingReasons = arrayFromRecord(review, "blockingReasons");
  const authorityPacket = isRecord(data.authority.json?.authorityPacket)
    ? data.authority.json.authorityPacket
    : null;
  const authorityHistory = Array.isArray(data.authority.json?.authorityHistory)
    ? data.authority.json.authorityHistory
    : [];
  const releaseBoardEvidence = isRecord(
    data.authority.json?.releaseBoardEvidence
  )
    ? data.authority.json.releaseBoardEvidence
    : null;
  const supportCommunicationsEvidence = isRecord(
    data.authority.json?.supportCommunicationsEvidence
  )
    ? data.authority.json.supportCommunicationsEvidence
    : null;
  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 36 Production Final Authority Gate",
        "Internal final authority review surface",
        "Your document was received.",
        "Human review is pending.",
        "More information may be needed.",
        "No final production authority approval has been granted.",
        "No go-live approval has been granted.",
        "No production launch authorization has been granted.",
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
  const totalAuthorityItems = nestedNumber(
    data.authority.json,
    "totalAuthorityItems"
  );
  const blocked = nestedNumber(data.authority.json, "blocked");
  const reviewRequired = nestedNumber(data.authority.json, "reviewRequired");
  const finalAuthorityApproval = nestedNumber(
    data.authority.json,
    "finalAuthorityApprovalGranted"
  );
  const goLiveApproved = nestedNumber(data.authority.json, "goLiveApproved");
  const productionLaunchAuthorized = nestedNumber(
    data.authority.json,
    "productionLaunchAuthorized"
  );
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    finalAuthorityApproval === 0
      ? "Final Authority Blocked"
      : "Final Authority Review",
    goLiveApproved === 0 ? "Go-Live Blocked" : "Go-Live Review",
    productionLaunchAuthorized === 0
      ? "Launch Authorization Blocked"
      : "Launch Authorization Review",
    `Controls ${totalAuthorityItems}`,
  ];

  const recordAuthorityPacket = useCallback(async () => {
    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch(
        "/api/governance/production-final-authority",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            actorId,
            authorityScope: "platform",
            reviewNote: "module-36-production-final-authority-evidence",
          }),
        }
      );
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ??
            "Production final authority returned review."
        );
      } else {
        const authorityPacket = isRecord(json.authorityPacket)
          ? json.authorityPacket
          : {};

        setActionMessage(
          `Production final authority packet recorded: ${shortId(
            authorityPacket.evidenceId
          )}. No final authority approval, go-live approval, production launch authorization, hold release, support activation, customer communication, regulatory communication, public status page, borrower notice send, official report publication, public verification, legal advice, official reliance, production cutover authority, deployment, public API exposure, portal launch, payment capture, or live external action was approved.`
        );
        await loadAll({ clearActionMessage: false });
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown production final authority action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [loadAll]);

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="36"
          title="Production Final Authority Gate"
          subtitle="Internal final go/no-go authority review. It packages constitutional authority, release-manager, security, launch, deployment, cutover, operations, incident, support, communications, audit, privacy, redaction, claims, and data-rights evidence only; it does not authorize launch or release production holds."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <section
          style={{ ...panelStyle, padding: 16, display: "grid", gap: 10 }}
        >
          <h2 style={{ margin: 0, fontSize: 18 }}>Evidence Chain</h2>
          <div style={{ display: "grid", gap: 6, color: "#475569" }}>
            <div>
              Release board: {shortId(releaseBoardEvidence?.evidenceId) || "not recorded"}
            </div>
            <div>
              Support communications: {shortId(supportCommunicationsEvidence?.evidenceId) || "not recorded"}
            </div>
            <div>
              Final authority: {shortId(authorityPacket?.evidenceId) || "not recorded"}
            </div>
            <div>Persisted final-authority packets: {authorityHistory.length}</div>
            <div>Evidence continuity does not grant launch authority.</div>
          </div>
        </section>

        <SummaryGrid
          items={[
            {
              label: "Authority Controls",
              value: totalAuthorityItems,
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
              label: "Go-Live Approval",
              value: goLiveApproved,
              color: goLiveApproved === 0 ? "#0f766e" : "#be123c",
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
              "No final production authority approval has been granted.",
              "No go-live approval has been granted.",
              "No production launch authorization has been granted.",
              "No constitutional officer final attestation has been received.",
              "No qualified release manager final approval has been granted.",
              "No production support communications approval has been granted.",
              "No support operations activation has been approved.",
              "No customer communication has been released.",
              "No regulatory communication has been released.",
              "No public status page has been enabled.",
              "No borrower notice has been sent.",
              "No official report has been published.",
              "No public verification authority has been granted.",
              "No legal advice has been provided.",
              "No official reliance has been created.",
              "No incident response activation has been approved.",
              "No rollback authorization has been granted.",
              "No production cutover authority has been granted.",
              "No production cutover has been approved or executed.",
              "No launch hold has been released.",
              "No deployment hold has been released.",
              "No deployment has been executed.",
              "No public production API exposure has been approved.",
              "No production portal launch has been executed.",
              "No payment capture has been enabled.",
              "This gate is final production authority review evidence only.",
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
                  Final Authority Review
                </h2>
                <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                  {lastLoadedAt
                    ? `Loaded ${lastLoadedAt}`
                    : "Loading governed final authority review"}
                </p>
              </div>
              <ActionButton
                disabled={actionBusy}
                onClick={recordAuthorityPacket}
              >
                {actionBusy ? "Recording Packet" : "Record Authority Packet"}
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

            {data.authority.error ? (
              <EmptyState>{data.authority.error}</EmptyState>
            ) : null}

            {review ? (
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  ["Review Status", review.reviewStatus],
                  ["Final Authority", review.finalAuthorityApprovalGranted],
                  ["Go-Live Approved", review.goLiveApproved],
                  ["Launch Authorized", review.productionLaunchAuthorized],
                  [
                    "Constitutional Attestation",
                    review.constitutionalOfficerAttestationReceived,
                  ],
                  [
                    "Release Manager Approval",
                    review.qualifiedReleaseManagerApprovalGranted,
                  ],
                  [
                    "Support Approval",
                    review.supportCommunicationsApprovalGranted,
                  ],
                  ["Support Activated", review.supportOperationsActivated],
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
                  ["Launch Hold Released", review.launchHoldReleased],
                  ["Deployment Hold Released", review.deploymentHoldReleased],
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
                        value === "PRODUCTION_FINAL_AUTHORITY_BLOCKED"
                      }
                    >
                      {value === false ? "Blocked" : normalizeStatus(value)}
                    </StatusPill>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>
                No production final authority review returned.
              </EmptyState>
            )}
          </div>

          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 14 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>
                Final Authority Controls
              </h2>
              <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                Pass items are attached evidence. Review and blocked items
                remain final authority, go-live, launch, hold release,
                deployment, public exposure, and live-action blockers.
              </p>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {authorityItems.length > 0 ? (
                authorityItems.map((item, index) => {
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
                <EmptyState>No final authority controls returned.</EmptyState>
              )}
            </div>
          </div>
        </section>

        <section style={{ ...panelStyle, padding: 16, display: "grid", gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Blocking Reasons</h2>
          {blockingReasons.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {blockingReasons.map((reason, index) => (
                <li key={`${index}-${String(reason)}`}>{String(reason)}</li>
              ))}
            </ul>
          ) : (
            <EmptyState>No final authority blockers returned.</EmptyState>
          )}
        </section>
      </div>
    </main>
  );
}
