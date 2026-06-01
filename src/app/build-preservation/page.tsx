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
 * Module 42 - Build Preservation and Evidence Archive Gate
 *
 * Master Volume Governance:
 * - Vol 0: preserves the current build checkpoint as one operator-readable
 *   platform record without implying public launch.
 * - Vol I: keeps canonical build status subordinate to constitutional
 *   governance and human review.
 * - Vol II: preserves regulatory, public, notice, report, payment, reliance,
 *   and legal-advice blocks while evidence is archived.
 * - Vol III: attaches module, route, event, handoff, replay, build, and tree
 *   drift evidence.
 * - Vol III-B: exposes runtime, classification, version, and observability
 *   posture for checkpoint review.
 * - Vol IV: supports restoration, audit, build preservation, recovery, and
 *   operator handoff.
 * - Vol V: preserves content claims, redaction, data rights, controlled
 *   disclosure, replayability, and evidence lineage.
 * - Vol VI: freezes source intelligence, scraper, revenue intelligence,
 *   runtime governance, integration, conformance, and build-reference evidence
 *   into a review-bound archive.
 */

const actorId = "module-42-build-preservation";

type ModuleData = {
  preservation: LoadResult;
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

export default function BuildPreservationPage() {
  const [data, setData] = useState<ModuleData>({ preservation: emptyLoad });
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

      const preservation = await loadJsonSurface(
        `/api/governance/build-preservation?actorId=${actorId}`,
        ["buildPreservationReviews"]
      );

      setData({ preservation });
      setLastLoadedAt(new Date().toLocaleTimeString());
      setRefreshing(false);
    },
    []
  );

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const review = useMemo(
    () => firstRecord(data.preservation.rows),
    [data.preservation.rows]
  );
  const preservationItems = arrayFromRecord(review, "preservationItems");
  const blockingReasons = arrayFromRecord(review, "blockingReasons");
  const verificationEvidence = arrayFromRecord(review, "verificationEvidence");
  const ignoredSensitiveFiles = arrayFromRecord(review, "ignoredSensitiveFiles");
  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 42 Build Preservation and Evidence Archive Gate",
        "Internal build checkpoint and evidence archive surface",
        "Your document was received.",
        "Human review is pending.",
        "More information may be needed.",
        "Build preservation is evidence-only and does not authorize production launch.",
        "Tree drift must be resolved before a new canonical checkpoint is declared.",
        "Sensitive files must remain ignored and outside build history.",
        "No deployment has been executed.",
        "No public production API exposure has been approved.",
        "No production portal launch has been executed.",
        "No payment capture has been enabled.",
        "No borrower notice has been sent.",
        "No official report has been published.",
        "No public verification authority has been granted.",
        "No official reliance has been created.",
        "No legal advice has been provided.",
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
  const totalPreservationItems = nestedNumber(
    data.preservation.json,
    "totalPreservationItems"
  );
  const blocked = nestedNumber(data.preservation.json, "blocked");
  const reviewRequired = nestedNumber(data.preservation.json, "reviewRequired");
  const treeDriftDetected = nestedNumber(
    data.preservation.json,
    "treeDriftDetected"
  );
  const ignoredVerified = nestedNumber(
    data.preservation.json,
    "ignoredSensitiveFilesVerified"
  );
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    "Checkpoint BR-2026-06-01-M41",
    treeDriftDetected === 0 ? "Tree Clean" : "Tree Drift Review",
    ignoredVerified === 1 ? "Sensitive Files Ignored" : "Ignore Review",
    `Controls ${totalPreservationItems}`,
  ];

  const recordArchive = useCallback(async () => {
    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch("/api/governance/build-preservation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          actorId,
          reviewNote: "module-42-build-preservation-evidence-archive",
        }),
      });
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ??
            "Build preservation archive returned review."
        );
      } else {
        const archiveRecord = isRecord(json.archiveRecord)
          ? json.archiveRecord
          : {};

        setActionMessage(
          `Build archive recorded: ${shortId(
            archiveRecord.archiveRecordId
          )}. No production launch, deployment, public API exposure, portal launch, payment capture, notice send, official report publication, public verification, official reliance, legal advice, or live external action was approved.`
        );
        await loadAll({ clearActionMessage: false });
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown build preservation action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [loadAll]);

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="42"
          title="Build Preservation and Evidence Archive Gate"
          subtitle="Internal checkpoint archive for the verified Module 41 backend governance foundation. It freezes the evidence pack, checks tree drift, confirms sensitive files remain ignored, and keeps all production authority blocked."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Archive Controls",
              value: totalPreservationItems,
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
              label: "Tree Drift",
              value: treeDriftDetected,
              color: treeDriftDetected === 0 ? "#0f766e" : "#be123c",
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
              "BR-2026-06-01-M41 has been recorded as a review-bound build checkpoint.",
              "Module 41 conforms to current Master Volumes 0-VI as of the checkpoint evidence.",
              "Build preservation is evidence-only and does not authorize production launch.",
              "Tree drift must be resolved before a new canonical checkpoint is declared.",
              "Sensitive files must remain ignored and outside build history.",
              "No deployment has been executed.",
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
                  Checkpoint Archive Review
                </h2>
                <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                  {lastLoadedAt
                    ? `Loaded ${lastLoadedAt}`
                    : "Loading build preservation review"}
                </p>
              </div>
              <ActionButton disabled={actionBusy} onClick={recordArchive}>
                {actionBusy ? "Recording Archive" : "Record Build Archive"}
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

            {data.preservation.error ? (
              <EmptyState>{data.preservation.error}</EmptyState>
            ) : null}

            {review ? (
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  ["Review Status", review.reviewStatus],
                  ["Checkpoint", review.canonicalCheckpointId],
                  ["Checkpoint Commit", review.checkpointCommitHash],
                  ["Current Commit", review.currentCommitHash],
                  ["Tree Status", review.treeStatus],
                  ["Archive Generated", review.buildArchiveGenerated],
                  ["Sensitive Ignores", review.ignoredSensitiveFilesVerified],
                  ["Modules", review.moduleCount],
                  ["Highest Module", review.highestModuleNumber],
                  ["Event Contracts", review.eventContractCount],
                  ["Handoffs", review.handoffCount],
                  ["Public Surfaces", review.publicSurfaceCount],
                  ["Portable Surfaces", review.portableSurfaceCount],
                  ["App Page Routes", review.appPageRouteCount],
                  ["API Routes", review.apiRouteCount],
                  ["Static Pages", review.staticPagesGenerated],
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
                        value === "CLEAN" ||
                        value === "BUILD_PRESERVATION_REVIEW_BOUND" ||
                        String(label).includes("Commit") ||
                        typeof value === "number"
                      }
                    >
                      {value === true ? "Recorded" : normalizeStatus(value)}
                    </StatusPill>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>No build preservation review returned.</EmptyState>
            )}
          </div>

          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 14 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>
                Preservation Controls
              </h2>
              <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                Pass items are attached evidence. Review and blocked items
                remain checkpoint, tree drift, sensitive-file, and production
                authority blockers.
              </p>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {preservationItems.length > 0 ? (
                preservationItems.map((item, index) => {
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
                <EmptyState>No preservation controls returned.</EmptyState>
              )}
            </div>
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
            <h2 style={{ margin: 0, fontSize: 18 }}>Verification Evidence</h2>
            {verificationEvidence.length > 0 ? (
              <div style={{ display: "grid", gap: 8 }}>
                {verificationEvidence.map((evidence, index) => {
                  const record = isRecord(evidence) ? evidence : {};

                  return (
                    <div
                      key={`${stringValue(record.command)}-${index}`}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        padding: 12,
                        display: "grid",
                        gap: 6,
                      }}
                    >
                      <strong>{stringValue(record.command)}</strong>
                      <StatusPill ok={stringValue(record.status) === "PASS"}>
                        {normalizeStatus(record.status)}
                      </StatusPill>
                      <span style={{ color: "#475569" }}>
                        {stringValue(record.evidenceRef)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState>No verification evidence returned.</EmptyState>
            )}
          </div>

          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>
              Ignored Sensitive Files
            </h2>
            {ignoredSensitiveFiles.length > 0 ? (
              <div style={{ display: "grid", gap: 8 }}>
                {ignoredSensitiveFiles.map((evidence, index) => {
                  const record = isRecord(evidence) ? evidence : {};

                  return (
                    <div
                      key={`${stringValue(record.path)}-${index}`}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        padding: 12,
                        display: "grid",
                        gap: 6,
                      }}
                    >
                      <strong>{stringValue(record.path)}</strong>
                      <StatusPill ok={record.ignored === true}>
                        {record.ignored === true ? "Ignored" : "Review"}
                      </StatusPill>
                      <span style={{ color: "#475569" }}>
                        {stringValue(record.ignoreRule) ?? "No ignore rule"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState>No ignored sensitive file evidence returned.</EmptyState>
            )}
          </div>
        </section>

        <section style={{ ...panelStyle, padding: 16, display: "grid", gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Blocking Reasons</h2>
          {blockingReasons.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 18, color: "#475569" }}>
              {blockingReasons.map((reason, index) => (
                <li key={`${String(reason)}-${index}`}>{stringValue(reason)}</li>
              ))}
            </ul>
          ) : (
            <EmptyState>No blocking reasons returned.</EmptyState>
          )}
        </section>
      </div>
    </main>
  );
}
