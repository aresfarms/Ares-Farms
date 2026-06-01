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
 * Module 27 - Production Portal Readiness Preflight Gate
 *
 * Master Volume Governance:
 * - Vol 0: reviews internal, borrower, lender, sponsor, and public surfaces as
 *   one governed platform orientation.
 * - Vol I: keeps production portal launch subordinate to constitutional
 *   authority and accountable controlled promotion.
 * - Vol II: blocks approvals, official reports, notice sends, payment capture,
 *   public verification, legal advice, lender commitments, sponsor commitments,
 *   agency commitments, and underwriting reliance.
 * - Vol III: consumes portable surface, backend dependency, replay, audit,
 *   auth, security, monitoring, incident, rollback, and launch hold posture
 *   without production publication.
 * - Vol III-B: exposes classification, observability, version, and runtime
 *   posture for portal launch review evidence.
 * - Vol IV: supports launch hold, operator support routing, incident bridge,
 *   rollback review, and controlled handoff.
 * - Vol V: preserves content claims, data rights, portability, controlled
 *   disclosure, replayability, and advisory-only boundaries.
 * - Vol VI: binds portable vertical surface and public DTO governance into
 *   launch preflight while live source fetches remain blocked.
 */

const actorId = "module-27-production-portal-readiness-gate";

type ModuleData = {
  readiness: LoadResult;
};

const emptyLoad: LoadResult = {
  ok: true,
  count: 0,
  rows: [],
  traceId: null,
  error: null,
  json: null,
};

function surfaceIdFromReview(row: unknown): string | null {
  return stringValue(isRecord(row) ? row.surfaceId : null);
}

function selectedReviewFromRows(
  rows: unknown[],
  selectedSurfaceId: string | null
): Record<string, unknown> | null {
  const selected =
    rows.find((row) => surfaceIdFromReview(row) === selectedSurfaceId) ??
    rows[0];

  return isRecord(selected) ? selected : null;
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

export default function ProductionPortalReadinessPage() {
  const [data, setData] = useState<ModuleData>({ readiness: emptyLoad });
  const [selectedSurfaceId, setSelectedSurfaceId] = useState<string | null>(
    null
  );
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

      const readiness = await loadJsonSurface(
        `/api/governance/production-portal-readiness?actorId=${actorId}`,
        ["productionPortalReadinessReviews"]
      );
      const firstSurfaceId = surfaceIdFromReview(readiness.rows[0]);

      setSelectedSurfaceId((current) => current ?? firstSurfaceId);
      setData({ readiness });
      setLastLoadedAt(new Date().toLocaleTimeString());
      setRefreshing(false);
    },
    []
  );

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const selectedReview = useMemo(
    () => selectedReviewFromRows(data.readiness.rows, selectedSurfaceId),
    [data.readiness.rows, selectedSurfaceId]
  );
  const checks = arrayFromRecord(selectedReview, "checks");
  const blockingReasons = arrayFromRecord(selectedReview, "blockingReasons");
  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 27 Production Portal Readiness Preflight Gate",
        "Internal launch preflight review surface",
        "Your document was received.",
        "Human review is pending.",
        "More information may be needed.",
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
  const totalReviews = nestedNumber(data.readiness.json, "totalReviews");
  const productionBlocked = nestedNumber(
    data.readiness.json,
    "productionBlocked"
  );
  const launchReady = nestedNumber(data.readiness.json, "launchReady");
  const launchExecuted = nestedNumber(data.readiness.json, "launchExecuted");
  const liveExternalActionsAllowed = nestedNumber(
    data.readiness.json,
    "liveExternalActionsAllowed"
  );
  const selectedSurfaceLabel =
    stringValue(selectedReview?.label) ?? "No surface selected";
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    launchReady === 0 ? "Portal Launch Blocked" : "Launch Review",
    liveExternalActionsAllowed === 0
      ? "Live Actions Blocked"
      : "Live Action Review",
    `Surfaces ${totalReviews}`,
  ];

  const recordLaunchHold = useCallback(async () => {
    if (!selectedReview) {
      setActionMessage("A governed portal readiness review is required.");
      return;
    }

    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch(
        "/api/governance/production-portal-readiness",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            actorId,
            surfaceId: surfaceIdFromReview(selectedReview),
            reviewNote: "module-27-production-portal-launch-hold",
          }),
        }
      );
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ??
            "Production portal readiness returned review."
        );
      } else {
        const launchHold = isRecord(json.launchHold) ? json.launchHold : {};

        setActionMessage(
          `Production portal launch hold recorded: ${shortId(
            launchHold.launchHoldId
          )}. No production launch, live external action, payment capture, borrower notice send, official report publication, public verification, or official reliance was approved.`
        );
        await loadAll({ clearActionMessage: false });
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown production portal readiness action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [loadAll, selectedReview]);

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="27"
          title="Production Portal Readiness Preflight Gate"
          subtitle="Internal launch preflight surface. It reviews portal readiness evidence only; it does not publish production, enable public verification, capture payments, send notices, or perform live external actions."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Surface Reviews",
              value: totalReviews,
              color: "#2563eb",
            },
            {
              label: "Production Blocked",
              value: productionBlocked,
              color: "#be123c",
            },
            {
              label: "Launch Ready",
              value: launchReady,
              color: launchReady === 0 ? "#be123c" : "#0f766e",
            },
            {
              label: "Launch Executed",
              value: launchExecuted,
              color: launchExecuted === 0 ? "#0f766e" : "#be123c",
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
              "No production portal launch has been executed.",
              "No public verification authority has been granted.",
              "No live external source has been contacted.",
              "No payment capture has been enabled.",
              "No borrower notice has been sent.",
              "No official report has been published.",
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
              "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
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
                  Portal Surface Reviews
                </h2>
                <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                  {lastLoadedAt
                    ? `Loaded ${lastLoadedAt}`
                    : "Loading governed portal readiness reviews"}
                </p>
              </div>
              <ActionButton
                disabled={actionBusy || !selectedReview}
                onClick={recordLaunchHold}
              >
                {actionBusy ? "Recording Hold" : "Record Launch Hold"}
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

            {data.readiness.error ? (
              <EmptyState>{data.readiness.error}</EmptyState>
            ) : null}

            <div style={{ display: "grid", gap: 8 }}>
              {data.readiness.rows.length === 0 ? (
                <EmptyState>No production portal readiness reviews returned.</EmptyState>
              ) : (
                data.readiness.rows.map((row, index) => {
                  const review = isRecord(row) ? row : {};
                  const surfaceId = surfaceIdFromReview(review);
                  const selected = surfaceId === selectedSurfaceId;

                  return (
                    <button
                      key={`${surfaceId ?? "surface"}-${index}`}
                      type="button"
                      onClick={() => setSelectedSurfaceId(surfaceId)}
                      style={{
                        textAlign: "left",
                        border: selected
                          ? "2px solid #2563eb"
                          : "1px solid #d5dce8",
                        borderRadius: 8,
                        background: selected ? "#eff6ff" : "#ffffff",
                        padding: 12,
                        display: "grid",
                        gap: 6,
                        cursor: "pointer",
                      }}
                    >
                      <strong style={{ color: "#0f172a" }}>
                        {stringValue(review.label) ?? "Unnamed surface"}
                      </strong>
                      <span style={{ color: "#64748b", fontSize: 13 }}>
                        {stringValue(review.route) ?? "No route"}
                      </span>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <StatusPill ok={false}>
                          {normalizeStatus(review.launchReadinessStatus)}
                        </StatusPill>
                        <StatusPill ok>
                          {stringValue(review.audience) ?? "Audience"}
                        </StatusPill>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 14 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>
                {selectedSurfaceLabel}
              </h2>
              <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                {stringValue(selectedReview?.route) ??
                  "No route selected for review."}
              </p>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {[
                ["Portal Launch", selectedReview?.portalLaunchExecuted],
                ["Public Launch", selectedReview?.publicLaunchAllowed],
                [
                  "Live External Action",
                  selectedReview?.liveExternalActionPerformed,
                ],
                ["Payment Capture", selectedReview?.paymentCaptureAllowed],
                ["Notice Send", selectedReview?.borrowerNoticeSendAllowed],
                [
                  "Official Report",
                  selectedReview?.officialReportPublicationAllowed,
                ],
                ["Public Verification", selectedReview?.publicVerificationAllowed],
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
                  <StatusPill ok={value === false}>
                    {value === false ? "Blocked" : "Review"}
                  </StatusPill>
                </div>
              ))}
            </div>

            <div>
              <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>
                Preflight Controls
              </h3>
              <div style={{ display: "grid", gap: 8 }}>
                {checks.map((item, index) => {
                  const row = isRecord(item) ? item : {};

                  return (
                    <div
                      key={`${stringValue(row.id) ?? "check"}-${index}`}
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
                        <strong>{stringValue(row.label) ?? "Control"}</strong>
                        <StatusPill ok={statusOk(row.status)}>
                          {normalizeStatus(row.status)}
                        </StatusPill>
                      </div>
                      {row.blockingReason ? (
                        <span style={{ color: "#64748b", fontSize: 13 }}>
                          {stringValue(row.blockingReason)}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>
                Blocking Reasons
              </h3>
              {blockingReasons.length === 0 ? (
                <EmptyState>No blocking reasons returned.</EmptyState>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18, color: "#475569" }}>
                  {blockingReasons.slice(0, 10).map((reason, index) => (
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
