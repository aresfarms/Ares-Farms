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
 * Module 24 - Source Promotion Packet Gate
 *
 * Master Volume Governance:
 * - Vol I: keeps source promotion subordinate to constitutional authority.
 * - Vol II: blocks source certainty, legal advice, official reliance,
 *   underwriting use, and borrower disclosure authority.
 * - Vol III: consumes source-stack, legal review, activation, replay,
 *   provenance, credential, adapter, monitoring, rollback, and incident
 *   evidence without live external calls.
 * - Vol III-B: exposes classification, observability, version, and runtime
 *   posture for source promotion evidence.
 * - Vol IV: supports promotion hold, degraded connector handling, incident
 *   containment, rollback review, and operator handoff.
 * - Vol V: preserves source authority, claims governance, public DTO safety,
 *   controlled disclosure, replayability, and advisory-only boundaries.
 * - Vol VI: binds source promotion packets into the governed source
 *   intelligence architecture while live fetches remain blocked.
 */

const actorId = "module-24-source-promotion-packet-gate";

type ModuleData = {
  packets: LoadResult;
};

const emptyLoad: LoadResult = {
  ok: true,
  count: 0,
  rows: [],
  traceId: null,
  error: null,
  json: null,
};

function sourceIdFromPacket(row: unknown): string | null {
  return stringValue(isRecord(row) ? row.sourceId : null);
}

function selectedPacketFromRows(
  rows: unknown[],
  selectedSourceId: string | null
): Record<string, unknown> | null {
  const selected =
    rows.find((row) => sourceIdFromPacket(row) === selectedSourceId) ??
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

export default function SourcePromotionPacketGatePage() {
  const [data, setData] = useState<ModuleData>({ packets: emptyLoad });
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

    const packets = await loadJsonSurface(
      `/api/governance/source-promotion-packets?actorId=${actorId}`,
      ["sourcePromotionPackets"]
    );
    const firstSourceId = sourceIdFromPacket(packets.rows[0]);

    setSelectedSourceId((current) => current ?? firstSourceId);
    setData({ packets });
    setLastLoadedAt(new Date().toLocaleTimeString());
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const selectedPacket = useMemo(
    () => selectedPacketFromRows(data.packets.rows, selectedSourceId),
    [data.packets.rows, selectedSourceId]
  );
  const checks = arrayFromRecord(selectedPacket, "checks");
  const blockingReasons = arrayFromRecord(selectedPacket, "blockingReasons");
  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 24 Source Promotion Packet Gate",
        "Internal source promotion evidence packet surface",
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
  const totalPackets = nestedNumber(data.packets.json, "totalPackets");
  const productionBlocked = nestedNumber(data.packets.json, "productionBlocked");
  const promotionReady = nestedNumber(data.packets.json, "promotionReady");
  const liveFetchEnabled = nestedNumber(data.packets.json, "liveFetchEnabled");
  const selectedSourceName =
    stringValue(selectedPacket?.sourceName) ?? "No source selected";
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    promotionReady === 0 ? "Promotion Blocked" : "Promotion Review",
    liveFetchEnabled === 0 ? "Live Fetch Blocked" : "Live Fetch Review",
    `Packets ${totalPackets}`,
  ];

  const recordPromotionHold = useCallback(async () => {
    if (!selectedPacket) {
      setActionMessage("A governed source promotion packet is required.");
      return;
    }

    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch("/api/governance/source-promotion-packets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          actorId,
          sourceId: sourceIdFromPacket(selectedPacket),
          reviewNote: "module-24-source-promotion-packet-hold",
        }),
      });
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ?? "Source promotion packet returned review."
        );
      } else {
        const promotionHold = isRecord(json.promotionHold)
          ? json.promotionHold
          : {};

        setActionMessage(
          `Promotion packet hold recorded: ${shortId(
            promotionHold.promotionHoldId
          )}. No live fetch, legal advice, public verification, or production promotion was approved.`
        );
        await loadAll({ clearActionMessage: false });
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown source promotion packet action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [loadAll, selectedPacket]);

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="24"
          title="Source Promotion Packet Gate"
          subtitle="Internal source promotion evidence packet surface. It packages readiness proof only; it does not approve legal use, live fetch, public verification, or production source activation."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Source Packets",
              value: totalPackets,
              color: "#2563eb",
            },
            {
              label: "Production Blocked",
              value: productionBlocked,
              color: "#be123c",
            },
            {
              label: "Promotion Ready",
              value: promotionReady,
              color: promotionReady === 0 ? "#be123c" : "#0f766e",
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
            <h2 style={{ margin: 0, fontSize: 20 }}>Source Packets</h2>
            {data.packets.rows.length === 0 ? (
              <EmptyState>No source promotion packets are available yet.</EmptyState>
            ) : (
              data.packets.rows.map((row) => {
                const record = isRecord(row) ? row : {};
                const sourceId = sourceIdFromPacket(row);
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
                      {normalizeStatus(record.promotionPacketStatus)}
                    </span>
                    <span style={{ color: "#475569", fontSize: 13 }}>
                      Activation reviews{" "}
                      {stringValue(record.liveActivationReviewCount) ?? "0"}
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
                    Packet {shortId(selectedPacket?.packetId)} / Source{" "}
                    {shortId(selectedPacket?.sourceId)}
                  </p>
                </div>
                <StatusPill ok={false}>
                  {normalizeStatus(selectedPacket?.promotionPacketStatus)}
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
                  <strong>{stringValue(selectedPacket?.sourceAuthorityTier)}</strong>
                </div>
                <div style={{ display: "grid", gap: 4 }}>
                  <span style={{ color: "#64748b", fontSize: 13 }}>
                    Legal Review
                  </span>
                  <strong>
                    {normalizeStatus(selectedPacket?.sourceLegalReviewStatus)}
                  </strong>
                </div>
                <div style={{ display: "grid", gap: 4 }}>
                  <span style={{ color: "#64748b", fontSize: 13 }}>
                    Human Promotion
                  </span>
                  <strong>
                    {selectedPacket?.humanPromotionRequired
                      ? "Required"
                      : "Not recorded"}
                  </strong>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <ActionButton
                  disabled={actionBusy || !selectedPacket}
                  onClick={() => void recordPromotionHold()}
                >
                  {actionBusy ? "Recording" : "Record Promotion Packet Hold"}
                </ActionButton>
                <span
                  style={{
                    alignSelf: "center",
                    color: "#64748b",
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  This records packet posture only. It does not approve source
                  use, legal reliance, live fetch, or production promotion.
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
              <h2 style={{ margin: 0, fontSize: 20 }}>Packet Controls</h2>
              {checks.length === 0 ? (
                <EmptyState>No packet controls are available yet.</EmptyState>
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
              <h2 style={{ margin: 0, fontSize: 20 }}>Promotion Boundary</h2>
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
                    "No legal advice has been provided.",
                    "No live external source has been contacted.",
                    "No public verification authority has been granted.",
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
                    <span
                      key={String(reason)}
                      style={{ color: "#9f1239", fontSize: 13 }}
                    >
                      {stringValue(reason)}
                    </span>
                  ))}
                </div>
              </div>
              <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                Trace {shortId(data.packets.traceId)} / Last refresh{" "}
                {formatDateTime(lastLoadedAt)}
              </p>
            </section>
          </section>
        </section>
      </div>
    </main>
  );
}
