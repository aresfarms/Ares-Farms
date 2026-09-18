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
  formatDateTime,
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
 * Module 32 - Production Release Board Evidence Packet
 *
 * Master Volume Governance:
 * - Vol 0: gives operators one release-board evidence surface across the
 *   platform without launching production.
 * - Vol I: keeps release-board authority subordinate to constitutional
 *   governance, release ownership, and qualified approval.
 * - Vol II: blocks approvals, public exposure, official reports, notice sends,
 *   payment capture, public verification, legal advice, partner commitments,
 *   agency commitments, and underwriting reliance.
 * - Vol III: consumes production cutover hold, release freeze, deployment,
 *   secrets, migrations, DNS, TLS, CDN, WAF, monitoring, backup, rollback,
 *   incident, support, and launch-hold evidence.
 * - Vol III-B: exposes classification, observability, version, and runtime
 *   posture for release-board evidence review.
 * - Vol IV: supports board review, quorum review, incident bridge, rollback,
 *   support routing, and communications freeze.
 * - Vol V: preserves content claims, data rights, controlled disclosure,
 *   replayability, explainability, and advisory-only boundaries.
 * - Vol VI: keeps source intelligence, public DTO, and portable surface
 *   governance blocked from live production exposure until approved.
 */

const actorId = "module-32-production-release-board";

type ModuleData = {
  releaseBoard: LoadResult;
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

export default function ProductionReleaseBoardPage() {
  const [data, setData] = useState<ModuleData>({ releaseBoard: emptyLoad });
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

      const releaseBoard = await loadJsonSurface(
        `/api/governance/production-release-board?actorId=${actorId}`,
        ["productionReleaseBoardReviews"]
      );

      setData({ releaseBoard });
      setLastLoadedAt(new Date().toLocaleTimeString());
      setRefreshing(false);
    },
    []
  );

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const review = useMemo(
    () => firstRecord(data.releaseBoard.rows),
    [data.releaseBoard.rows]
  );
  const releaseBoardItems = arrayFromRecord(review, "releaseBoardItems");
  const blockingReasons = arrayFromRecord(review, "blockingReasons");
  const releaseBoardEvidence = isRecord(data.releaseBoard.json?.releaseBoard)
    ? data.releaseBoard.json.releaseBoard
    : null;
  const cutoverEvidence = isRecord(data.releaseBoard.json?.cutoverEvidence)
    ? data.releaseBoard.json.cutoverEvidence
    : null;
  const releaseBoardHistory = Array.isArray(data.releaseBoard.json?.releaseBoardHistory)
    ? data.releaseBoard.json.releaseBoardHistory
    : [];
  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 32 Production Release Board Evidence Packet",
        "Internal production release board review surface",
        "Your document was received.",
        "Human review is pending.",
        "More information may be needed.",
        "No production release board approval has been granted.",
        "No production cutover authority has been granted.",
        "No production cutover has been approved or executed.",
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
  const totalReleaseBoardItems = nestedNumber(
    data.releaseBoard.json,
    "totalReleaseBoardItems"
  );
  const blocked = nestedNumber(data.releaseBoard.json, "blocked");
  const reviewRequired = nestedNumber(data.releaseBoard.json, "reviewRequired");
  const releaseBoardApprovalGranted = nestedNumber(
    data.releaseBoard.json,
    "releaseBoardApprovalGranted"
  );
  const cutoverAuthorityGranted = nestedNumber(
    data.releaseBoard.json,
    "cutoverAuthorityGranted"
  );
  const productionCutoverExecuted = nestedNumber(
    data.releaseBoard.json,
    "productionCutoverExecuted"
  );
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    releaseBoardApprovalGranted === 0
      ? "Board Approval Blocked"
      : "Board Review",
    cutoverAuthorityGranted === 0
      ? "Cutover Authority Blocked"
      : "Authority Review",
    productionCutoverExecuted === 0 ? "Cutover Not Executed" : "Cutover Review",
    `Controls ${totalReleaseBoardItems}`,
  ];

  const recordReleaseBoardPacket = useCallback(async () => {
    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch("/api/governance/production-release-board", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          actorId,
          boardScope: "platform",
          reviewNote: "module-32-production-release-board-evidence",
        }),
      });
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ??
            "Production release board returned review."
        );
      } else {
        const releaseBoard = isRecord(json.releaseBoard) ? json.releaseBoard : {};

        setActionMessage(
          `Production release board packet recorded: ${shortId(
            releaseBoard.evidenceId ?? releaseBoard.releaseBoardPacketId
          )}. No release board approval, production cutover authority, launch hold release, deployment, production secret activation, public DNS cutover, production database migration, public production API exposure, production portal launch, payment capture, borrower notice send, official report publication, public verification, legal advice, or official reliance was approved.`
        );
        await loadAll({ clearActionMessage: false });
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown production release board action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [loadAll]);

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="32"
          title="Production Release Board Evidence Packet"
          subtitle="Internal production release board evidence review. It packages cutover hold, launch hold, deployment hold, secrets, migrations, DNS, TLS, CDN, WAF, monitoring, backup, rollback, incident, support, public API exposure, and release-manager evidence only; it does not approve release or expose production."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Board Controls",
              value: totalReleaseBoardItems,
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
              label: "Cutover Authority",
              value: cutoverAuthorityGranted,
              color:
                cutoverAuthorityGranted === 0 ? "#0f766e" : "#be123c",
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
              "No production release board approval has been granted.",
              "No production cutover authority has been granted.",
              "No production cutover has been approved or executed.",
              "No launch hold has been released.",
              "No deployment hold has been released.",
              "No release-candidate freeze hold has been released.",
              "No deployment has been executed.",
              "No production secret has been activated.",
              "No public DNS cutover has been approved.",
              "No production database migration has been approved.",
              "No production portal launch has been executed.",
              "No public production API exposure has been approved.",
              "No public verification authority has been granted.",
              "No payment capture has been enabled.",
              "No borrower notice has been sent.",
              "No official report has been published.",
              "This packet is production release board review evidence only.",
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
                  Production Release Board Review
                </h2>
                <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                  {lastLoadedAt
                    ? `Loaded ${lastLoadedAt}`
                    : "Loading governed release board review"}
                </p>
              </div>
              <ActionButton
                disabled={actionBusy}
                onClick={recordReleaseBoardPacket}
              >
                {actionBusy ? "Recording Packet" : "Record Release Board Packet"}
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

            {data.releaseBoard.error ? (
              <EmptyState>{data.releaseBoard.error}</EmptyState>
            ) : null}

            {review ? (
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  ["Review Status", review.reviewStatus],
                  ["Release Board Approval", review.releaseBoardApprovalGranted],
                  ["Cutover Authority", review.cutoverAuthorityGranted],
                  ["Cutover Approval", review.productionCutoverApproved],
                  ["Cutover Executed", review.productionCutoverExecuted],
                  ["Launch Hold Released", review.launchHoldReleased],
                  ["Deployment Hold Released", review.deploymentHoldReleased],
                  ["Freeze Hold Released", review.freezeHoldReleased],
                  ["Deployment Executed", review.deploymentExecuted],
                  ["Production Secrets", review.productionSecretsActivated],
                  ["Public DNS Cutover", review.publicDnsCutoverAllowed],
                  ["CDN/WAF/TLS", review.cdnWafTlsEnabled],
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
                        value === "PRODUCTION_RELEASE_BOARD_BLOCKED"
                      }
                    >
                      {value === false ? "Blocked" : normalizeStatus(value)}
                    </StatusPill>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>No production release board review returned.</EmptyState>
            )}
          </div>

          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Release Evidence Chain</h2>
            <div style={{ display: "grid", gap: 8 }}>
              <div>
                <strong>Production cutover hold</strong>
                <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                  {cutoverEvidence
                    ? `${shortId(cutoverEvidence.evidenceId)} · ${formatDateTime(cutoverEvidence.recordedAtUtc)}`
                    : "No persisted cutover-hold evidence is attached for this scope."}
                </p>
              </div>
              <div>
                <strong>Release board packet</strong>
                <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                  {releaseBoardEvidence
                    ? `${shortId(releaseBoardEvidence.evidenceId)} · ${formatDateTime(releaseBoardEvidence.recordedAtUtc)}`
                    : "No persisted release-board packet has been recorded."}
                </p>
              </div>
              <div>
                <strong>Packet history</strong>
                <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                  {releaseBoardHistory.length} persisted release-board record(s). Evidence continuity does not grant approval or cutover authority.
                </p>
              </div>
            </div>
          </div>

          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 14 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>Release Board Controls</h2>
              <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                Pass items are attached evidence. Review and blocked items
                remain release-board, cutover, and launch blockers.
              </p>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {releaseBoardItems.map((releaseBoardItem, index) => {
                const row = isRecord(releaseBoardItem) ? releaseBoardItem : {};

                return (
                  <div
                    key={`${stringValue(row.id) ?? "release-board"}-${index}`}
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
                      <strong>{stringValue(row.label) ?? "Release board"}</strong>
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
                Remaining Release Board Blockers
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
