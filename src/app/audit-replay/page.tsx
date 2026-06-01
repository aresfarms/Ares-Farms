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
  numberValue,
  panelStyle,
  shortId,
  stringValue,
} from "@/app/internalModuleKit";

/**
 * Module 09 - Audit Ledger and Replay Console
 *
 * Master Volume Governance:
 * - Vol I: preserves immutable evidence and accountable audit authority.
 * - Vol II: protects regulated audit evidence from uncontrolled disclosure.
 * - Vol III: consumes ledger admin and replay verification runtimes.
 * - Vol III-B: surfaces version, classification, observability, and evidence posture.
 * - Vol IV: supports incident review, repair planning, rollback review, and examination prep.
 * - Vol V: enforces replayability, provenance, export controls, and canonical ledger doctrine.
 */

const actorId = "module-09-audit-replay-console";

type ModuleData = {
  ledger: LoadResult;
};

const emptyLoad: LoadResult = {
  ok: true,
  count: 0,
  rows: [],
  traceId: null,
  error: null,
  json: null,
};

function ledgerCount(data: LoadResult, key: string): number {
  return numberValue(data.json?.[key]) ?? 0;
}

function replayMessage(json: Record<string, unknown> | null): string {
  if (!json) {
    return "Not run";
  }

  const result = isRecord(json.result) ? json.result : {};

  return stringValue(result.message) ?? normalizeStatus(json.verified);
}

export default function AuditReplayConsolePage() {
  const [data, setData] = useState<ModuleData>({
    ledger: emptyLoad,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [replayJson, setReplayJson] = useState<Record<string, unknown> | null>(
    null
  );

  const loadAll = useCallback(async () => {
    setRefreshing(true);
    setActionMessage(null);

    const ledger = await loadJsonSurface(
      `/api/ledger/admin?role=governance&userId=${actorId}&eventType=APPLICATION_SUBMITTED&includeCanonicalLedger=true&includeCanonicalMeta=true&limit=12`,
      ["auditEvents"]
    );

    setData({ ledger });
    setLastLoadedAt(new Date().toLocaleTimeString());
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 09 Audit Ledger and Replay Console",
        "Internal audit ledger and replay inspection surface",
        ADVISORY_ONLY_DISCLOSURE,
        BORROWER_PORTABILITY_DISCLOSURE,
        LENDER_READY_DISCLOSURE,
      ],
      context: {
        borrowerPortabilityAvailable: true,
        freeTierBaselineReadinessAvailable: true,
        lenderReadyDisclosurePresent: true,
      },
    });
  }, []);

  const runReplayCheck = useCallback(async () => {
    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch("/api/ledger/replay-verify", {
        method: "GET",
        cache: "no-store",
      });
      const json = (await response.json()) as Record<string, unknown>;

      setReplayJson(json);

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ?? "Replay check returned review."
        );
      } else {
        setActionMessage(`Replay check recorded: ${replayMessage(json)}`);
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error ? error.message : "Unknown replay action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, []);

  const canonicalLedgerCount = ledgerCount(data.ledger, "canonicalLedgerCount");
  const canonicalMetaCount = ledgerCount(data.ledger, "canonicalMetaCount");
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    "Bounded Ledger Scope",
    "Replay Inspection",
    "Export Controls",
  ];

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="09"
          title="Audit Ledger and Replay"
          subtitle="Internal ledger inspection and replay posture review for governed audit operations."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Audit Events",
              value: data.ledger.count,
              color: "#4338ca",
            },
            {
              label: "Canonical Rows",
              value: canonicalLedgerCount,
              color: "#0f766e",
            },
            {
              label: "Canonical Metadata",
              value: canonicalMetaCount,
              color: "#7c3aed",
            },
            {
              label: "Last Refresh",
              value: lastLoadedAt ?? "Not loaded",
              color: "#334155",
            },
          ]}
        />

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(280px, 0.85fr) minmax(0, 1.4fr)",
            gap: 16,
            alignItems: "start",
          }}
        >
          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Replay Controls</h2>
            <ActionButton
              disabled={actionBusy}
              onClick={() => void runReplayCheck()}
            >
              Run Replay Check
            </ActionButton>
            {actionMessage ? (
              <p style={{ margin: 0, color: "#334155", lineHeight: 1.5 }}>
                {actionMessage}
              </p>
            ) : null}
            <div
              style={{
                display: "grid",
                gap: 8,
                padding: 12,
                border: "1px solid #e2e8f0",
                borderRadius: 8,
              }}
            >
              <strong>Replay Result</strong>
              <StatusPill ok={replayJson?.verified === true}>
                {replayMessage(replayJson)}
              </StatusPill>
              <span style={{ color: "#64748b", lineHeight: 1.5 }}>
                Replay checks remain an internal audit control. External
                verification claims are not made from this module.
              </span>
            </div>
            <p style={{ margin: 0, color: "#64748b", lineHeight: 1.5 }}>
              Ledger reads use a bounded event scope and preserve controlled
              disclosure requirements for audit evidence.
            </p>
          </div>

          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Ledger Evidence</h2>
            {data.ledger.rows.length === 0 ? (
              <EmptyState>
                No audit events are available for the current bounded ledger
                scope.
              </EmptyState>
            ) : (
              data.ledger.rows.map((row) => {
                const record = isRecord(row) ? row : {};
                const id = stringValue(record.id) ?? JSON.stringify(row);

                return (
                  <div
                    key={id}
                    style={{
                      display: "grid",
                      gap: 8,
                      padding: 12,
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                      }}
                    >
                      <strong>{shortId(id)}</strong>
                      <StatusPill ok={Boolean(record.eventHash ?? record.hash)}>
                        {normalizeStatus(record.eventType)}
                      </StatusPill>
                    </div>
                    <span style={{ color: "#475569" }}>
                      Entity {normalizeStatus(record.entityType)} /{" "}
                      {shortId(record.entityId)}
                    </span>
                    <span style={{ color: "#64748b", fontSize: 13 }}>
                      Classification {normalizeStatus(record.classification)} /
                      Created {formatDateTime(record.createdAt)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
