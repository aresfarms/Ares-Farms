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
 * Module 28 - Production Launch Evidence Packet
 *
 * Master Volume Governance:
 * - Vol 0: gives operators one launch evidence packet across platform
 *   surfaces without publishing production.
 * - Vol I: keeps go-live release subordinate to constitutional authority,
 *   accountable approval, and final launch-hold release.
 * - Vol II: blocks approvals, official reports, notice sends, payment capture,
 *   public verification, legal advice, partner commitments, agency
 *   commitments, and underwriting reliance.
 * - Vol III: consumes readiness, backend, auth, security, audit, replay,
 *   monitoring, rollback, incident, support, and content-claims evidence.
 * - Vol III-B: exposes classification, observability, version, and runtime
 *   posture for launch evidence review.
 * - Vol IV: supports launch board review, operator support routing, incident
 *   bridge, rollback review, communication freeze, and final launch hold.
 * - Vol V: preserves content claims, data rights, portability, controlled
 *   disclosure, replayability, and advisory-only boundaries.
 * - Vol VI: keeps source intelligence, public DTO, and portable surface
 *   governance blocked from live production exposure until approved.
 */

const actorId = "module-28-production-launch-evidence-packet";

type ModuleData = {
  evidence: LoadResult;
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

export default function ProductionLaunchEvidencePage() {
  const [data, setData] = useState<ModuleData>({ evidence: emptyLoad });
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

      const evidence = await loadJsonSurface(
        `/api/governance/production-launch-evidence?actorId=${actorId}`,
        ["launchEvidencePackets"]
      );

      setData({ evidence });
      setLastLoadedAt(new Date().toLocaleTimeString());
      setRefreshing(false);
    },
    []
  );

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const packet = useMemo(
    () => firstRecord(data.evidence.rows),
    [data.evidence.rows]
  );
  const evidenceItems = arrayFromRecord(packet, "evidenceItems");
  const blockingReasons = arrayFromRecord(packet, "blockingReasons");
  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 28 Production Launch Evidence Packet",
        "Internal go-live evidence packet review surface",
        "Your document was received.",
        "Human review is pending.",
        "More information may be needed.",
        "No production portal launch has been executed.",
        "No go-live release has been approved.",
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
  const totalEvidenceItems = nestedNumber(
    data.evidence.json,
    "totalEvidenceItems"
  );
  const blocked = nestedNumber(data.evidence.json, "blocked");
  const reviewRequired = nestedNumber(data.evidence.json, "reviewRequired");
  const goLiveApproved = nestedNumber(data.evidence.json, "goLiveApproved");
  const portalLaunchExecuted = nestedNumber(
    data.evidence.json,
    "portalLaunchExecuted"
  );
  const liveExternalActionsAllowed = nestedNumber(
    data.evidence.json,
    "liveExternalActionsAllowed"
  );
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    goLiveApproved === 0 ? "Go-Live Blocked" : "Go-Live Review",
    liveExternalActionsAllowed === 0
      ? "Live Actions Blocked"
      : "Live Action Review",
    `Evidence ${totalEvidenceItems}`,
  ];

  const recordLaunchHold = useCallback(async () => {
    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch("/api/governance/production-launch-evidence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          actorId,
          packetScope: "platform",
          reviewNote: "module-28-go-live-release-hold",
        }),
      });
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ??
            "Production launch evidence packet returned review."
        );
      } else {
        const launchHold = isRecord(json.launchHold) ? json.launchHold : {};

        setActionMessage(
          `Go-live release hold recorded: ${shortId(
            launchHold.launchHoldId
          )}. No production launch, public verification, live external action, payment capture, borrower notice send, official report publication, or official reliance was approved.`
        );
        await loadAll({ clearActionMessage: false });
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown production launch evidence action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [loadAll]);

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="28"
          title="Production Launch Evidence Packet"
          subtitle="Internal go-live evidence packet. It packages launch proof and blockers only; it does not release production, enable public verification, capture payments, send notices, publish official reports, or perform live external actions."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Evidence Items",
              value: totalEvidenceItems,
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
              label: "Launch Executed",
              value: portalLaunchExecuted,
              color: portalLaunchExecuted === 0 ? "#0f766e" : "#be123c",
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
              "No go-live release has been approved.",
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
                  Launch Evidence Packet
                </h2>
                <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                  {lastLoadedAt
                    ? `Loaded ${lastLoadedAt}`
                    : "Loading governed launch evidence packet"}
                </p>
              </div>
              <ActionButton disabled={actionBusy} onClick={recordLaunchHold}>
                {actionBusy ? "Recording Hold" : "Record Go-Live Hold"}
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

            {data.evidence.error ? (
              <EmptyState>{data.evidence.error}</EmptyState>
            ) : null}

            {packet ? (
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  ["Packet Status", packet.packetStatus],
                  ["Go-Live Approved", packet.goLiveApproved],
                  ["Portal Launch", packet.portalLaunchExecuted],
                  ["Public Launch", packet.publicLaunchAllowed],
                  ["Live External Action", packet.liveExternalActionPerformed],
                  ["Payment Capture", packet.paymentCaptureAllowed],
                  ["Notice Send", packet.borrowerNoticeSendAllowed],
                  ["Official Report", packet.officialReportPublicationAllowed],
                  ["Public Verification", packet.publicVerificationAllowed],
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
                        value === "GO_LIVE_EVIDENCE_PACKET_BLOCKED"
                      }
                    >
                      {value === false ? "Blocked" : normalizeStatus(value)}
                    </StatusPill>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>No launch evidence packet returned.</EmptyState>
            )}
          </div>

          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 14 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>
                Evidence Controls
              </h2>
              <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                Pass items are attached evidence. Review and blocked items
                remain go-live blockers.
              </p>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {evidenceItems.map((item, index) => {
                const row = isRecord(item) ? item : {};

                return (
                  <div
                    key={`${stringValue(row.id) ?? "evidence"}-${index}`}
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
                      <strong>{stringValue(row.label) ?? "Evidence"}</strong>
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
                Remaining Go-Live Blockers
              </h3>
              {blockingReasons.length === 0 ? (
                <EmptyState>No blocking reasons returned.</EmptyState>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18, color: "#475569" }}>
                  {blockingReasons.slice(0, 12).map((reason, index) => (
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
