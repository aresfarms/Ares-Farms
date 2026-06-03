"use client";

import Link from "next/link";
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
 * Module 43 - Doctrine-to-Code Gap Ledger
 *
 * Master Volume Governance:
 * - Vol 0: gives operators a plain current-state ledger for unresolved build
 *   doctrine requirements.
 * - Vol I: keeps promotion subordinate to constitutional authority.
 * - Vol II: preserves regulated, public, notice, report, payment, reliance,
 *   and legal-advice boundaries.
 * - Vol III: maps doctrine gaps to route, evidence, tests, and replay posture.
 * - Vol III-B: exposes human authority, classification, observability, and
 *   version posture as runtime infrastructure.
 * - Vol IV: supports queueable operator review and audit handoff.
 * - Vol V: preserves claims, controlled disclosure, redaction, source
 *   authority, replayability, and evidence lineage.
 * - Vol VI: keeps source intelligence and public-safe source DTO promotion
 *   review-bound until qualified approval exists.
 */

const actorId = "module-43-doctrine-gap-ledger";

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
  const raw = stringValue(value);

  return raw === "awaiting_controlled_promotion" || raw === "true";
}

export default function DoctrineGapLedgerPage() {
  const [data, setData] = useState<ModuleData>({ ledger: emptyLoad });
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

      const ledger = await loadJsonSurface(
        `/api/governance/doctrine-gap-ledger?actorId=${actorId}`,
        ["doctrineGapLedgerReviews"]
      );

      setData({ ledger });
      setLastLoadedAt(new Date().toLocaleTimeString());
      setRefreshing(false);
    },
    []
  );

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const review = useMemo(() => firstRecord(data.ledger.rows), [data.ledger.rows]);
  const gaps = arrayFromRecord(review, "gapLedgerItems");
  const blockingReasons = arrayFromRecord(review, "blockingReasons");
  const requiredActions = arrayFromRecord(review, "requiredActions");
  const volumeVersions = arrayFromRecord(review, "currentMasterVolumeVersions");
  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 43 Doctrine-to-Code Gap Ledger",
        "Internal controlled-promotion gap ledger",
        "Your document was received.",
        "Human review is pending.",
        "More information may be needed.",
        "All current doctrine-to-code gaps are named, owned, routed, and review-bound.",
        "Awaiting controlled promotion is not production approval.",
        "No production launch has been authorized.",
        "No public production API exposure has been approved.",
        "No production portal launch has been executed.",
        "No payment capture has been enabled.",
        "No borrower notice has been sent.",
        "No official report has been published.",
        "No public verification authority has been granted.",
        "No official reliance has been created.",
        "No legal advice has been provided.",
        "No live external action has been performed.",
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
  const totalRequirements = nestedNumber(data.ledger.json, "totalRequirements");
  const implementedRequirements = nestedNumber(
    data.ledger.json,
    "implementedRequirements"
  );
  const awaitingControlledPromotion = nestedNumber(
    data.ledger.json,
    "awaitingControlledPromotion"
  );
  const unnamedGapCount = nestedNumber(data.ledger.json, "unnamedGapCount");
  const allGapsNamed = nestedNumber(data.ledger.json, "allGapsNamed");
  const allGapsOwned = nestedNumber(data.ledger.json, "allGapsOwned");
  const allGapsRouted = nestedNumber(data.ledger.json, "allGapsRouted");
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    "Checkpoint BR-2026-06-01-M43",
    allGapsNamed === 1 ? "No Unnamed Gaps" : "Unnamed Gap Review",
    allGapsOwned === 1 ? "Owners Present" : "Owner Review",
    allGapsRouted === 1 ? "Routes Present" : "Route Review",
  ];

  const recordReview = useCallback(async () => {
    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch("/api/governance/doctrine-gap-ledger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          actorId,
          reviewNote: "module-43-doctrine-to-code-gap-ledger-review",
        }),
      });
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ??
            "Doctrine-to-code gap ledger returned review."
        );
      } else {
        const reviewRecord = isRecord(json.reviewRecord)
          ? json.reviewRecord
          : {};

        setActionMessage(
          `Gap ledger review recorded: ${shortId(
            reviewRecord.reviewRecordId
          )}. All three gaps remain awaiting controlled promotion; no production launch, public API exposure, portal launch, payment capture, notice send, official report, public verification, official reliance, legal advice, or live external action was approved.`
        );
        await loadAll({ clearActionMessage: false });
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown doctrine gap ledger action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [loadAll]);

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="43"
          title="Doctrine-to-Code Gap Ledger"
          subtitle="Internal controlled-promotion ledger for the three remaining Master Volume requirements. It names each gap, owner, route, blocked reason, required evidence, and promotion condition while preserving all production authority blocks."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Requirements",
              value: totalRequirements,
              color: "#2563eb",
            },
            {
              label: "Implemented",
              value: implementedRequirements,
              color: "#0f766e",
            },
            {
              label: "Awaiting Promotion",
              value: awaitingControlledPromotion,
              color: "#b45309",
            },
            {
              label: "Unnamed Gaps",
              value: unnamedGapCount,
              color: unnamedGapCount === 0 ? "#0f766e" : "#be123c",
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
              "All current doctrine-to-code gaps are named, owned, routed, and review-bound.",
              "Awaiting controlled promotion is not production approval.",
              "No production launch has been authorized.",
              "No public production API exposure has been approved.",
              "No production portal launch has been executed.",
              "No payment capture has been enabled.",
              "No borrower notice has been sent.",
              "No official report has been published.",
              "No public verification authority has been granted.",
              "No official reliance has been created.",
              "No legal advice has been provided.",
              "No live external action has been performed.",
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
              "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
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
                  Ledger Review
                </h2>
                <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                  {lastLoadedAt
                    ? `Loaded ${lastLoadedAt}`
                    : "Loading doctrine-to-code gap ledger"}
                </p>
              </div>
              <ActionButton disabled={actionBusy} onClick={recordReview}>
                {actionBusy ? "Recording Review" : "Record Ledger Review"}
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

            {data.ledger.error ? <EmptyState>{data.ledger.error}</EmptyState> : null}

            {review ? (
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  ["Review Status", review.reviewStatus],
                  ["Checkpoint", review.checkpointId],
                  ["Requirements", review.totalRequirements],
                  ["Implemented", review.implementedRequirements],
                  ["Awaiting Controlled Promotion", review.awaitingControlledPromotion],
                  ["Named Gaps", review.namedGapCount],
                  ["Unnamed Gaps", review.unnamedGapCount],
                  ["All Gaps Owned", review.allGapsOwned],
                  ["All Gaps Routed", review.allGapsRouted],
                  [
                    "Evidence Boundaries",
                    review.allGapsHaveRequiredEvidence,
                  ],
                  [
                    "Promotion Conditions",
                    review.allGapsHavePromotionConditions,
                  ],
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
                        value === true ||
                        value === 0 ||
                        value === "DOCTRINE_GAP_LEDGER_REVIEW_BOUND" ||
                        typeof value === "number"
                      }
                    >
                      {value === true ? "Yes" : normalizeStatus(value)}
                    </StatusPill>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>No doctrine gap ledger review returned.</EmptyState>
            )}
          </div>

          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>
                Verified Against
              </h2>
              <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                Current machine-readable Master Volume registry.
              </p>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {volumeVersions.length > 0 ? (
                volumeVersions.map((version, index) => {
                  const record = isRecord(version) ? version : {};

                  return (
                    <div
                      key={`${stringValue(record.key)}-${index}`}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        padding: 12,
                        display: "grid",
                        gap: 6,
                      }}
                    >
                      <strong>{stringValue(record.label)}</strong>
                      <StatusPill ok>
                        {stringValue(record.governingVersion)}
                      </StatusPill>
                      <span style={{ color: "#475569" }}>
                        {stringValue(record.file)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <EmptyState>No Master Volume versions returned.</EmptyState>
              )}
            </div>
          </div>
        </section>

        <section style={{ display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Controlled Promotion Gaps</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 380px), 1fr))",
              gap: 16,
            }}
          >
            {gaps.length > 0 ? (
              gaps.map((gap, index) => {
                const record = isRecord(gap) ? gap : {};
                const requiredEvidence = Array.isArray(record.requiredEvidence)
                  ? record.requiredEvidence
                  : [];
                const tests = Array.isArray(record.tests) ? record.tests : [];

                return (
                  <article
                    key={stringValue(record.id) ?? index}
                    style={{
                      ...panelStyle,
                      padding: 16,
                      display: "grid",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        alignItems: "start",
                      }}
                    >
                      <div style={{ display: "grid", gap: 4 }}>
                        <strong>{stringValue(record.id)}</strong>
                        <span style={{ color: "#334155" }}>
                          {stringValue(record.title)}
                        </span>
                      </div>
                      <StatusPill ok={statusOk(record.status)}>
                        {normalizeStatus(record.status)}
                      </StatusPill>
                    </div>

                    <div style={{ display: "grid", gap: 6, color: "#475569" }}>
                      <span>
                        <strong>Owner:</strong>{" "}
                        {stringValue(record.owner)}
                      </span>
                      <span>
                        <strong>Human Authority:</strong>{" "}
                        {stringValue(record.requiredHumanAuthority)}
                      </span>
                      <span>
                        <strong>Route:</strong>{" "}
                        {stringValue(record.route)?.startsWith("/") ? (
                          <Link href={stringValue(record.route) ?? "/"}>
                            {stringValue(record.route)}
                          </Link>
                        ) : (
                          stringValue(record.route)
                        )}
                      </span>
                      <span>
                        <strong>Blocked Reason:</strong>{" "}
                        {stringValue(record.blockedReason)}
                      </span>
                      <span>
                        <strong>Promotion Condition:</strong>{" "}
                        {stringValue(record.promotionCondition)}
                      </span>
                    </div>

                    <div style={{ display: "grid", gap: 6 }}>
                      <strong>Required Evidence</strong>
                      <ul style={{ margin: 0, paddingLeft: 18, color: "#475569" }}>
                        {requiredEvidence.map((item, evidenceIndex) => (
                          <li key={`${String(item)}-${evidenceIndex}`}>
                            {stringValue(item)}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {tests.map((test, testIndex) => (
                        <StatusPill key={`${String(test)}-${testIndex}`} ok>
                          {stringValue(test)}
                        </StatusPill>
                      ))}
                    </div>
                  </article>
                );
              })
            ) : (
              <EmptyState>No controlled-promotion gaps returned.</EmptyState>
            )}
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
          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Blocking Reasons</h2>
            {blockingReasons.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 18, color: "#475569" }}>
                {blockingReasons.map((reason, index) => (
                  <li key={`${String(reason)}-${index}`}>
                    {stringValue(reason)}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState>No blocking reasons returned.</EmptyState>
            )}
          </div>

          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Required Actions</h2>
            {requiredActions.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 18, color: "#475569" }}>
                {requiredActions.map((action, index) => (
                  <li key={`${String(action)}-${index}`}>
                    {stringValue(action)}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState>No required actions returned.</EmptyState>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
