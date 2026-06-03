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
 * Module 23 - Source Legal and Licensing Review Gate
 *
 * Master Volume Governance:
 * - Vol I: preserves constitutional authority over external source use.
 * - Vol II: blocks unreviewed source licensing, ToS, anti-bulk, retention,
 *   republication, borrower, marketplace, and agency-source reliance.
 * - Vol III: consumes canonical source-stack profiles before connector or
 *   scraper activation.
 * - Vol III-B: exposes classification, observability, version, and runtime
 *   posture for source legal review evidence.
 * - Vol IV: supports qualified review, exception handling, incident
 *   containment, and operator handoff.
 * - Vol V: enforces source authority, claims governance, public DTO safety,
 *   controlled disclosure, replayability, and advisory-only boundaries.
 * - Vol VI: binds licensing review into the governed source intelligence
 *   architecture without performing live source access.
 */

const actorId = "module-23-source-legal-review-gate";

type ModuleData = {
  legal: LoadResult;
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

export default function SourceLegalReviewGatePage() {
  const [data, setData] = useState<ModuleData>({ legal: emptyLoad });
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);

  const loadAll = useCallback(async (options?: { clearActionMessage?: boolean }) => {
    setRefreshing(true);
    if (options?.clearActionMessage !== false) {
      setActionMessage(null);
    }

    const legal = await loadJsonSurface(
      `/api/governance/source-legal-review?actorId=${actorId}`,
      ["sourceLegalReviews"]
    );
    const firstSourceId = sourceIdFromReview(legal.rows[0]);

    setSelectedSourceId((current) => current ?? firstSourceId);
    setData({ legal });
    setLastLoadedAt(new Date().toLocaleTimeString());
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const selectedReview = useMemo(
    () => selectedReviewFromRows(data.legal.rows, selectedSourceId),
    [data.legal.rows, selectedSourceId]
  );
  const checks = arrayFromRecord(selectedReview, "checks");
  const licensingRestrictions = arrayFromRecord(
    selectedReview,
    "licensingRestrictions"
  );
  const claimsRestrictions = arrayFromRecord(selectedReview, "claimsRestrictions");
  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 23 Source Legal and Licensing Review Gate",
        "Internal legal/licensing review evidence surface",
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
  const totalSources = nestedNumber(data.legal.json, "totalSources");
  const activationBlocked = nestedNumber(data.legal.json, "activationBlocked");
  const legalApproved = nestedNumber(data.legal.json, "legalApproved");
  const liveFetchEnabled = nestedNumber(data.legal.json, "liveFetchEnabled");
  const selectedSourceName =
    stringValue(selectedReview?.sourceName) ?? "No source selected";
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    "Qualified Review Required",
    liveFetchEnabled === 0 ? "Live Fetch Blocked" : "Live Fetch Review",
    `Sources ${totalSources}`,
  ];

  const recordReviewHold = useCallback(async () => {
    if (!selectedReview) {
      setActionMessage("A governed source profile is required.");
      return;
    }

    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch("/api/governance/source-legal-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          actorId,
          sourceId: sourceIdFromReview(selectedReview),
          reviewNote: "module-23-source-legal-review-hold",
        }),
      });
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ?? "Source legal review hold returned review."
        );
      } else {
        const reviewHold = isRecord(json.reviewHold) ? json.reviewHold : {};

        setActionMessage(
          `Legal review hold recorded: ${shortId(
            reviewHold.reviewHoldId
          )}. No legal advice was provided and live fetch remains blocked.`
        );
        await loadAll({ clearActionMessage: false });
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown source legal review action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [loadAll, selectedReview]);

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="23"
          title="Source Legal and Licensing Review Gate"
          subtitle="Internal source-specific ToS, licensing, anti-bulk, retention, republication, and permitted-use review surface. This is review evidence only and not legal advice."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Source Profiles",
              value: totalSources,
              color: "#2563eb",
            },
            {
              label: "Activation Blocked",
              value: activationBlocked,
              color: "#be123c",
            },
            {
              label: "Legal Approved",
              value: legalApproved,
              color: legalApproved === 0 ? "#be123c" : "#0f766e",
            },
            {
              label: "Live Fetch Enabled",
              value: liveFetchEnabled,
              color: liveFetchEnabled === 0 ? "#0f766e" : "#be123c",
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
            <h2 style={{ margin: 0, fontSize: 20 }}>Source Profiles</h2>
            {data.legal.rows.length === 0 ? (
              <EmptyState>No source legal review profiles are available yet.</EmptyState>
            ) : (
              data.legal.rows.map((row) => {
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
                      {stringValue(record.sourceCategory)} /{" "}
                      {normalizeStatus(record.legalReviewStatus)}
                    </span>
                    <span style={{ color: "#475569", fontSize: 13 }}>
                      {shortId(record.sourceAuthorityTier)}
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
                    Source {shortId(selectedReview?.sourceId)} / Category{" "}
                    {stringValue(selectedReview?.sourceCategory)}
                  </p>
                </div>
                <StatusPill ok={false}>
                  {normalizeStatus(selectedReview?.legalReviewStatus)}
                </StatusPill>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                  gap: 12,
                }}
              >
                <div style={{ display: "grid", gap: 8 }}>
                  <strong>Licensing Restrictions</strong>
                  {licensingRestrictions.map((restriction) => (
                    <span
                      key={String(restriction)}
                      style={{ color: "#475569", fontSize: 13 }}
                    >
                      {stringValue(restriction)}
                    </span>
                  ))}
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  <strong>Claims Restrictions</strong>
                  {claimsRestrictions.map((restriction) => (
                    <span
                      key={String(restriction)}
                      style={{ color: "#475569", fontSize: 13 }}
                    >
                      {stringValue(restriction)}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <ActionButton
                  disabled={actionBusy || !selectedReview}
                  onClick={() => void recordReviewHold()}
                >
                  {actionBusy ? "Recording" : "Record Legal Review Hold"}
                </ActionButton>
                <span
                  style={{
                    alignSelf: "center",
                    color: "#64748b",
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  This records review posture only. It does not provide legal
                  advice, approve source use, or contact external systems.
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
              <h2 style={{ margin: 0, fontSize: 20 }}>Review Controls</h2>
              {checks.length === 0 ? (
                <EmptyState>No legal review controls are available yet.</EmptyState>
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
                gap: 10,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 20 }}>Required Boundary</h2>
              {[
                "Your document was received.",
                "Human review is pending.",
                "More information may be needed.",
                "No legal advice has been provided.",
                "No live external source has been contacted.",
              ].map((message) => (
                <span key={message} style={{ color: "#475569", fontSize: 13 }}>
                  {message}
                </span>
              ))}
              <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                Trace {shortId(data.legal.traceId)} / Last refresh{" "}
                {formatDateTime(lastLoadedAt)}
              </p>
            </section>
          </section>
        </section>
      </div>
    </main>
  );
}
