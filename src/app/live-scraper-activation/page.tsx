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
 * Module 22 - Live Scraper Activation Gate
 *
 * Master Volume Governance:
 * - Vol I: preserves constitutional control over live source activation.
 * - Vol II: blocks external source reliance until legal, credential,
 *   licensing, and human-review controls are complete.
 * - Vol III: consumes governed scraper, source-stack, replay, provenance,
 *   connector, and activation-readiness backend surfaces.
 * - Vol III-B: surfaces classification, observability, version, and runtime
 *   posture before any production-live source action.
 * - Vol IV: supports promotion, rollback, incident, monitoring, and degraded
 *   connector review.
 * - Vol V: enforces source authority, replayability, controlled disclosure,
 *   claims governance, and advisory-only boundaries.
 * - Vol VI: turns source intelligence into a portable governed module while
 *   keeping live fetches and public verification blocked.
 */

const actorId = "module-22-live-scraper-activation-gate";

type ModuleData = {
  activation: LoadResult;
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

function scraperIdFromReview(row: unknown): string | null {
  return stringValue(isRecord(row) ? row.scraperId : null);
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

function checksFromReview(row: Record<string, unknown> | null): unknown[] {
  return Array.isArray(row?.checks) ? row.checks : [];
}

function blockingReasonsFromReview(row: Record<string, unknown> | null): string[] {
  if (!Array.isArray(row?.blockingReasons)) {
    return [];
  }

  return row.blockingReasons
    .map((reason) => stringValue(reason))
    .filter((reason): reason is string => Boolean(reason));
}

function boolValue(value: unknown): boolean {
  return value === true;
}

function statusOk(value: unknown): boolean {
  return stringValue(value) === "PASS";
}

function nestedNumber(
  record: Record<string, unknown> | null,
  key: string
): number {
  const summary = isRecord(record?.summary) ? record.summary : {};
  const value = summary[key];

  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function textFromNestedResult(
  json: Record<string, unknown> | null,
  path: string[]
): string | null {
  let cursor: unknown = json;

  for (const segment of path) {
    if (!isRecord(cursor)) {
      return null;
    }

    cursor = cursor[segment];
  }

  return stringValue(cursor);
}

export default function LiveScraperActivationGatePage() {
  const [data, setData] = useState<ModuleData>({ activation: emptyLoad });
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadAll = useCallback(async (options?: { clearActionMessage?: boolean }) => {
    setRefreshing(true);
    if (options?.clearActionMessage !== false) {
      setActionMessage(null);
    }

    const activation = await loadJsonSurface(
      `/api/governance/live-scraper-activation?actorId=${actorId}`,
      ["sourceReviews"]
    );
    const firstSourceId = sourceIdFromReview(activation.rows[0]);

    setSelectedSourceId((current) => current ?? firstSourceId);
    setData({ activation });
    setLastLoadedAt(new Date().toLocaleTimeString());
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const selectedReview = useMemo(
    () => selectedReviewFromRows(data.activation.rows, selectedSourceId),
    [data.activation.rows, selectedSourceId]
  );
  const checks = checksFromReview(selectedReview);
  const blockingReasons = blockingReasonsFromReview(selectedReview);
  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 22 Live Scraper Activation Gate",
        "Internal source activation review surface",
        "Your document was received.",
        "Human review is pending.",
        "More information may be needed.",
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
  const summaryRecord = data.activation.json;
  const totalScrapers = nestedNumber(summaryRecord, "totalScrapers");
  const activationBlocked = nestedNumber(summaryRecord, "activationBlocked");
  const liveFetchEnabled = nestedNumber(summaryRecord, "liveFetchEnabled");
  const missingStackProfiles = nestedNumber(
    summaryRecord,
    "sourcesMissingStackProfile"
  );
  const selectedSourceName =
    stringValue(selectedReview?.sourceName) ?? "No source selected";
  const selectedScraperId = scraperIdFromReview(selectedReview);
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    liveFetchEnabled === 0 ? "Live Fetch Blocked" : "Live Fetch Review",
    `Sources ${totalScrapers}`,
    "Human Approval Required",
  ];

  const recordReviewHold = useCallback(async () => {
    if (!selectedReview) {
      setActionMessage("A governed scraper source is required.");
      return;
    }

    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch("/api/scrapers/escalate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          actorId,
          scraperId: scraperIdFromReview(selectedReview),
          sourceId: sourceIdFromReview(selectedReview),
          reason: "module-22-live-scraper-activation-review-hold",
          metadata: {
            module: "Module 22 - Live Scraper Activation Gate",
            liveFetchRequested: false,
            liveFetchPerformed: false,
            activationReviewOnly: true,
          },
        }),
      });
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ?? "Scraper review hold returned review."
        );
      } else {
        const escalationId =
          textFromNestedResult(json, ["data", "result", "escalationId"]) ??
          "recorded";

        setActionMessage(
          `Review hold recorded: ${shortId(escalationId)}. Live fetch remains blocked.`
        );
        await loadAll({ clearActionMessage: false });
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown scraper activation review error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [loadAll, selectedReview]);

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="22"
          title="Live Scraper Activation Gate"
          subtitle="Internal activation-readiness surface for governed scraper and source-stack sources. This gate records review posture only; live external fetches stay blocked."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Governed Scrapers",
              value: totalScrapers,
              color: "#2563eb",
            },
            {
              label: "Activation Blocked",
              value: activationBlocked,
              color: "#be123c",
            },
            {
              label: "Live Fetch Enabled",
              value: liveFetchEnabled,
              color: liveFetchEnabled === 0 ? "#0f766e" : "#be123c",
            },
            {
              label: "Missing Stack Profiles",
              value: missingStackProfiles,
              color: missingStackProfiles === 0 ? "#0f766e" : "#b45309",
            },
          ]}
        />

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(280px, 0.85fr) minmax(0, 1.6fr)",
            gap: 16,
            alignItems: "start",
          }}
        >
          <aside style={{ ...panelStyle, padding: 16, display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Governed Sources</h2>
            {data.activation.rows.length === 0 ? (
              <EmptyState>No governed scraper sources are registered yet.</EmptyState>
            ) : (
              data.activation.rows.map((row) => {
                const record = isRecord(row) ? row : {};
                const sourceId = sourceIdFromReview(row);
                const active = sourceId === selectedSourceId;

                return (
                  <button
                    key={sourceId ?? JSON.stringify(row)}
                    type="button"
                    onClick={() => setSelectedSourceId(sourceId)}
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
                    <strong>{stringValue(record.sourceName) ?? sourceId}</strong>
                    <span style={{ color: "#64748b", fontSize: 13 }}>
                      {shortId(record.scraperId)} /{" "}
                      {normalizeStatus(record.connectorCertificationStatus)}
                    </span>
                    <span style={{ color: "#475569", fontSize: 13 }}>
                      Stack profile{" "}
                      {boolValue(record.sourceStackProfilePresent)
                        ? "matched"
                        : "missing"}
                    </span>
                  </button>
                );
              })
            )}
          </aside>

          <section style={{ display: "grid", gap: 12 }}>
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
                <div style={{ display: "grid", gap: 6 }}>
                  <h2 style={{ margin: 0, fontSize: 20 }}>
                    {selectedSourceName}
                  </h2>
                  <p style={{ margin: 0, color: "#64748b", lineHeight: 1.5 }}>
                    Scraper {shortId(selectedScraperId)} / Source{" "}
                    {shortId(selectedReview?.sourceId)}
                  </p>
                </div>
                <StatusPill ok={!boolValue(selectedReview?.liveFetchAllowed)}>
                  {boolValue(selectedReview?.liveFetchAllowed)
                    ? "Live Fetch Review"
                    : "Live Fetch Blocked"}
                </StatusPill>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                  gap: 10,
                }}
              >
                <div style={{ display: "grid", gap: 4 }}>
                  <span style={{ color: "#64748b", fontSize: 13 }}>
                    Authority Tier
                  </span>
                  <strong>{stringValue(selectedReview?.sourceAuthorityTier)}</strong>
                </div>
                <div style={{ display: "grid", gap: 4 }}>
                  <span style={{ color: "#64748b", fontSize: 13 }}>
                    Connector
                  </span>
                  <strong>
                    {normalizeStatus(selectedReview?.connectorCertificationStatus)}
                  </strong>
                </div>
                <div style={{ display: "grid", gap: 4 }}>
                  <span style={{ color: "#64748b", fontSize: 13 }}>
                    Stack Profile
                  </span>
                  <strong>{shortId(selectedReview?.sourceStackProfileRef)}</strong>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <ActionButton
                  disabled={actionBusy || !selectedReview}
                  onClick={() => void recordReviewHold()}
                >
                  {actionBusy ? "Recording" : "Record Review Hold"}
                </ActionButton>
                <span
                  style={{
                    alignSelf: "center",
                    color: "#64748b",
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  This records governance review posture only. No source is
                  contacted and no external data is fetched.
                </span>
              </div>
              {actionMessage ? (
                <div
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    padding: 12,
                    background: "#f8fafc",
                    color: "#334155",
                  }}
                >
                  {actionMessage}
                </div>
              ) : null}
            </section>

            <section
              style={{
                ...panelStyle,
                padding: 16,
                display: "grid",
                gap: 12,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 20 }}>Activation Checks</h2>
              {checks.length === 0 ? (
                <EmptyState>No activation checks are available yet.</EmptyState>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {checks.map((checkRow) => {
                    const record = isRecord(checkRow) ? checkRow : {};
                    const status = stringValue(record.status);

                    return (
                      <div
                        key={stringValue(record.id) ?? JSON.stringify(checkRow)}
                        style={{
                          display: "grid",
                          gap: 6,
                          padding: 12,
                          border: "1px solid #e2e8f0",
                          borderRadius: 8,
                          background: "#ffffff",
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
                          <strong>{stringValue(record.label)}</strong>
                          <StatusPill ok={statusOk(status)}>
                            {normalizeStatus(status)}
                          </StatusPill>
                        </div>
                        <span style={{ color: "#64748b", fontSize: 13 }}>
                          Evidence {shortId(record.evidenceRef)}
                        </span>
                        {stringValue(record.blockingReason) ? (
                          <span
                            style={{
                              color:
                                status === "PASS" ? "#475569" : "#9f1239",
                              fontSize: 13,
                              lineHeight: 1.5,
                            }}
                          >
                            {stringValue(record.blockingReason)}
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
              <h2 style={{ margin: 0, fontSize: 20 }}>Production Boundary</h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: 12,
                }}
              >
                <div style={{ display: "grid", gap: 8 }}>
                  <strong>Required public-safe messages</strong>
                  {[
                    "Your document was received.",
                    "Human review is pending.",
                    "More information may be needed.",
                  ].map((message) => (
                    <span
                      key={message}
                      style={{ color: "#475569", fontSize: 13 }}
                    >
                      {message}
                    </span>
                  ))}
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  <strong>Current blockers</strong>
                  {blockingReasons.slice(0, 5).map((reason) => (
                    <span key={reason} style={{ color: "#9f1239", fontSize: 13 }}>
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
              <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                Trace {shortId(data.activation.traceId)} / Last refresh{" "}
                {formatDateTime(lastLoadedAt)}
              </p>
            </section>
          </section>
        </section>
      </div>
    </main>
  );
}
