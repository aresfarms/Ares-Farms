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
 * Module 25 - Source Production Promotion Readiness Gate
 *
 * Master Volume Governance:
 * - Vol I: keeps production source promotion subordinate to constitutional
 *   authority and controlled promotion.
 * - Vol II: blocks source certainty, legal advice, official reliance,
 *   underwriting use, borrower disclosure authority, and public verification.
 * - Vol III: consumes source-promotion packet evidence, credentials, adapter,
 *   schema, replay, provenance, monitoring, failover, rollback, incident,
 *   audit, claims, and human-approval controls without live external calls.
 * - Vol III-B: exposes classification, observability, version, and runtime
 *   posture for production-readiness evidence.
 * - Vol IV: supports readiness hold, activation ceremony review, rollback,
 *   incident response, degraded-source handling, and operator handoff.
 * - Vol V: preserves source authority, claims governance, public DTO safety,
 *   controlled disclosure, replayability, and advisory-only boundaries.
 * - Vol VI: binds canonical source intelligence into final production
 *   readiness review while live fetches and source promotion remain blocked.
 */

const actorId = "module-25-source-production-readiness-gate";

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

function sourceIdFromReview(row: unknown): string | null {
  return stringValue(isRecord(row) ? row.sourceId : null);
}

function selectedReviewFromRows(
  rows: unknown[],
  selectedSourceId: string | null
): Record<string, unknown> | null {
  const selected =
    rows.find((row) => sourceIdFromReview(row) === selectedSourceId) ??
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

export default function SourceProductionReadinessGatePage() {
  const [data, setData] = useState<ModuleData>({ readiness: emptyLoad });
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
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
        `/api/governance/source-production-readiness?actorId=${actorId}`,
        ["sourceProductionReadinessReviews"]
      );
      const firstSourceId = sourceIdFromReview(readiness.rows[0]);

      setSelectedSourceId((current) => current ?? firstSourceId);
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
    () => selectedReviewFromRows(data.readiness.rows, selectedSourceId),
    [data.readiness.rows, selectedSourceId]
  );
  const checks = arrayFromRecord(selectedReview, "checks");
  const blockingReasons = arrayFromRecord(selectedReview, "blockingReasons");
  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 25 Source Production Promotion Readiness Gate",
        "Internal production-readiness review surface",
        "Your document was received.",
        "Human review is pending.",
        "More information may be needed.",
        "No source has been promoted to production.",
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
  const productionReady = nestedNumber(data.readiness.json, "productionReady");
  const liveFetchEnabled = nestedNumber(data.readiness.json, "liveFetchEnabled");
  const externalActionsPerformed = nestedNumber(
    data.readiness.json,
    "externalActionsPerformed"
  );
  const selectedSourceName =
    stringValue(selectedReview?.sourceName) ?? "No source selected";
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    productionReady === 0 ? "Production Promotion Blocked" : "Promotion Review",
    liveFetchEnabled === 0 ? "Live Fetch Blocked" : "Live Fetch Review",
    `Reviews ${totalReviews}`,
  ];

  const recordReadinessHold = useCallback(async () => {
    if (!selectedReview) {
      setActionMessage("A governed production readiness review is required.");
      return;
    }

    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch(
        "/api/governance/source-production-readiness",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            actorId,
            sourceId: sourceIdFromReview(selectedReview),
            reviewNote: "module-25-source-production-readiness-hold",
          }),
        }
      );
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ?? "Source production readiness returned review."
        );
      } else {
        const readinessHold = isRecord(json.readinessHold)
          ? json.readinessHold
          : {};

        setActionMessage(
          `Production readiness hold recorded: ${shortId(
            readinessHold.readinessHoldId
          )}. No source promotion, live fetch, legal advice, public verification, or official reliance was approved.`
        );
        await loadAll({ clearActionMessage: false });
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown source production readiness action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [loadAll, selectedReview]);

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="25"
          title="Source Production Promotion Readiness Gate"
          subtitle="Internal controlled-promotion readiness surface. It assembles final production evidence only; it does not approve source activation, live fetch, legal use, public verification, or official reliance."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Readiness Reviews",
              value: totalReviews,
              color: "#2563eb",
            },
            {
              label: "Production Blocked",
              value: productionBlocked,
              color: "#be123c",
            },
            {
              label: "Production Ready",
              value: productionReady,
              color: productionReady === 0 ? "#be123c" : "#0f766e",
            },
            {
              label: "External Actions",
              value: externalActionsPerformed,
              color: externalActionsPerformed === 0 ? "#0f766e" : "#be123c",
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
              "No legal advice has been provided.",
              "No live external source has been contacted.",
              "No public verification authority has been granted.",
              "No source has been promoted to production.",
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
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
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
                <h2 style={{ margin: 0, fontSize: 18 }}>Source Reviews</h2>
                <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                  {lastLoadedAt
                    ? `Loaded ${lastLoadedAt}`
                    : "Loading governed readiness reviews"}
                </p>
              </div>
              <ActionButton
                disabled={actionBusy || !selectedReview}
                onClick={recordReadinessHold}
              >
                {actionBusy
                  ? "Recording Hold"
                  : "Record Production Readiness Hold"}
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
                <EmptyState>No source production readiness reviews loaded.</EmptyState>
              ) : (
                data.readiness.rows.map((row) => {
                  const record = isRecord(row) ? row : {};
                  const sourceId = sourceIdFromReview(record);
                  const selected = sourceId === selectedSourceId;

                  return (
                    <button
                      key={sourceId ?? shortId(record.readinessId)}
                      type="button"
                      onClick={() => setSelectedSourceId(sourceId)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        border: selected
                          ? "1px solid #1f4f7a"
                          : "1px solid #d5dce8",
                        borderRadius: 8,
                        padding: 12,
                        background: selected ? "#eef6ff" : "#ffffff",
                        color: "#172033",
                        cursor: "pointer",
                      }}
                    >
                      <strong style={{ display: "block" }}>
                        {stringValue(record.sourceName) ?? "Unknown source"}
                      </strong>
                      <span style={{ color: "#64748b", fontSize: 13 }}>
                        {normalizeStatus(record.readinessStatus)} /{" "}
                        {shortId(record.readinessId)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ display: "grid", gap: 16 }}>
            <section
              style={{
                ...panelStyle,
                padding: 16,
                display: "grid",
                gap: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontSize: 20 }}>
                    {selectedSourceName}
                  </h2>
                  <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                    {stringValue(selectedReview?.sourceAuthorityTier) ??
                      "Authority tier not recorded"}
                  </p>
                </div>
                <StatusPill ok={false}>
                  {normalizeStatus(selectedReview?.readinessStatus)}
                </StatusPill>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 10,
                }}
              >
                {[
                  {
                    label: "Promotion Allowed",
                    value: selectedReview?.promotionAllowed,
                  },
                  {
                    label: "Live Fetch Allowed",
                    value: selectedReview?.liveFetchAllowed,
                  },
                  {
                    label: "External Action",
                    value: selectedReview?.externalActionPerformed,
                  },
                  {
                    label: "Human Approval",
                    value: selectedReview?.humanApprovalRequired,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{ ...panelStyle, padding: 12, minHeight: 74 }}
                  >
                    <span
                      style={{
                        color: "#64748b",
                        fontSize: 13,
                        fontWeight: 800,
                      }}
                    >
                      {item.label}
                    </span>
                    <strong
                      style={{
                        display: "block",
                        marginTop: 8,
                        color:
                          item.value === false ? "#0f766e" : "#be123c",
                      }}
                    >
                      {String(item.value ?? "Pending")}
                    </strong>
                  </div>
                ))}
              </div>
            </section>

            <section
              style={{
                ...panelStyle,
                padding: 16,
                display: "grid",
                gap: 12,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 18 }}>
                Production Readiness Controls
              </h2>
              {checks.length === 0 ? (
                <EmptyState>No readiness controls available.</EmptyState>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {checks.map((candidate) => {
                    const gate = isRecord(candidate) ? candidate : {};
                    const id = stringValue(gate.id) ?? shortId(gate.label);
                    const ok = statusOk(gate.status);

                    return (
                      <div
                        key={id}
                        style={{
                          border: "1px solid #d5dce8",
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
                            flexWrap: "wrap",
                          }}
                        >
                          <strong>
                            {stringValue(gate.label) ?? "Readiness control"}
                          </strong>
                          <StatusPill ok={ok}>
                            {normalizeStatus(gate.status)}
                          </StatusPill>
                        </div>
                        <span style={{ color: "#64748b", fontSize: 13 }}>
                          Evidence: {shortId(gate.evidenceRef)}
                        </span>
                        {gate.blockingReason ? (
                          <span style={{ color: "#7f1d1d", fontSize: 13 }}>
                            {stringValue(gate.blockingReason)}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section
              style={{
                ...panelStyle,
                padding: 16,
                display: "grid",
                gap: 12,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 18 }}>Blocking Reasons</h2>
              {blockingReasons.length === 0 ? (
                <EmptyState>No blocking reasons recorded.</EmptyState>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18, color: "#334155" }}>
                  {blockingReasons.slice(0, 10).map((reason, index) => (
                    <li key={`${index}-${String(reason).slice(0, 24)}`}>
                      {stringValue(reason)}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
