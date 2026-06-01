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
 * Module 30 - Release Candidate Freeze Plan
 *
 * Master Volume Governance:
 * - Vol 0: gives operators one release-candidate freeze review surface across
 *   the platform without executing deployment.
 * - Vol I: keeps release-candidate freeze subordinate to constitutional
 *   authority, release ownership, and qualified approval.
 * - Vol II: blocks approvals, official reports, notice sends, payment capture,
 *   public verification, legal advice, partner commitments, agency
 *   commitments, and underwriting reliance.
 * - Vol III: consumes deployment environment readiness, build, typecheck,
 *   smoke, release notes, secrets, migrations, edge, monitoring, backup,
 *   rollback, incident, support, and final signoff evidence.
 * - Vol III-B: exposes classification, observability, version, and runtime
 *   posture for release-candidate freeze review.
 * - Vol IV: supports release manager review, change freeze, deployment hold,
 *   incident bridge, rollback, support routing, and communications freeze.
 * - Vol V: preserves content claims, data rights, controlled disclosure,
 *   replayability, explainability, and advisory-only boundaries.
 * - Vol VI: keeps source intelligence, public DTO, and portable surface
 *   governance blocked from live production exposure until approved.
 */

const actorId = "module-30-release-candidate-freeze-plan";

type ModuleData = {
  freeze: LoadResult;
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

export default function ReleaseCandidateFreezePage() {
  const [data, setData] = useState<ModuleData>({ freeze: emptyLoad });
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

      const freeze = await loadJsonSurface(
        `/api/governance/release-candidate-freeze?actorId=${actorId}`,
        ["releaseCandidateFreezePlans"]
      );

      setData({ freeze });
      setLastLoadedAt(new Date().toLocaleTimeString());
      setRefreshing(false);
    },
    []
  );

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const plan = useMemo(() => firstRecord(data.freeze.rows), [data.freeze.rows]);
  const freezeItems = arrayFromRecord(plan, "freezeItems");
  const blockingReasons = arrayFromRecord(plan, "blockingReasons");
  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 30 Release Candidate Freeze Plan",
        "Internal release-candidate freeze review surface",
        "Your document was received.",
        "Human review is pending.",
        "More information may be needed.",
        "No release candidate has been frozen or approved.",
        "No deployment has been executed.",
        "No production secret has been activated.",
        "No public DNS cutover has been approved.",
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
  const totalFreezeItems = nestedNumber(data.freeze.json, "totalFreezeItems");
  const blocked = nestedNumber(data.freeze.json, "blocked");
  const reviewRequired = nestedNumber(data.freeze.json, "reviewRequired");
  const releaseCandidateFreezeApproved = nestedNumber(
    data.freeze.json,
    "releaseCandidateFreezeApproved"
  );
  const releaseCandidateFrozen = nestedNumber(
    data.freeze.json,
    "releaseCandidateFrozen"
  );
  const deploymentExecuted = nestedNumber(
    data.freeze.json,
    "deploymentExecuted"
  );
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    releaseCandidateFreezeApproved === 0
      ? "Freeze Approval Blocked"
      : "Freeze Review",
    releaseCandidateFrozen === 0 ? "Candidate Not Frozen" : "Freeze Review",
    deploymentExecuted === 0 ? "Deployment Blocked" : "Deployment Review",
    `Controls ${totalFreezeItems}`,
  ];

  const recordFreezeHold = useCallback(async () => {
    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch("/api/governance/release-candidate-freeze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          actorId,
          releaseScope: "platform",
          reviewNote: "module-30-release-candidate-freeze-hold",
        }),
      });
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ??
            "Release-candidate freeze returned review."
        );
      } else {
        const freezeHold = isRecord(json.freezeHold) ? json.freezeHold : {};

        setActionMessage(
          `Release candidate freeze hold recorded: ${shortId(
            freezeHold.freezeHoldId
          )}. No release-candidate freeze approval, candidate freeze, deployment, production secret activation, public DNS cutover, production database migration, payment capture, borrower notice send, official report publication, public verification, legal advice, or official reliance was approved.`
        );
        await loadAll({ clearActionMessage: false });
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown release-candidate freeze action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [loadAll]);

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="30"
          title="Release Candidate Freeze Plan"
          subtitle="Internal release-candidate freeze review. It packages final build, typecheck, backend smoke, integration smoke, content claims, release notes, secrets, migrations, edge, monitoring, backup, rollback, incident, support, and release-manager evidence only; it does not freeze, approve, or deploy production."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Freeze Controls",
              value: totalFreezeItems,
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
              label: "Deployment Executed",
              value: deploymentExecuted,
              color: deploymentExecuted === 0 ? "#0f766e" : "#be123c",
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
              "No release candidate has been frozen or approved.",
              "No deployment has been executed.",
              "No production secret has been activated.",
              "No public DNS cutover has been approved.",
              "No production database migration has been approved.",
              "No production portal launch has been executed.",
              "No public verification authority has been granted.",
              "No payment capture has been enabled.",
              "No borrower notice has been sent.",
              "No official report has been published.",
              "This plan is release-candidate freeze review evidence only.",
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
                  Release Candidate Freeze Review
                </h2>
                <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                  {lastLoadedAt
                    ? `Loaded ${lastLoadedAt}`
                    : "Loading governed release-candidate freeze review"}
                </p>
              </div>
              <ActionButton disabled={actionBusy} onClick={recordFreezeHold}>
                {actionBusy ? "Recording Hold" : "Record Freeze Hold"}
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

            {data.freeze.error ? <EmptyState>{data.freeze.error}</EmptyState> : null}

            {plan ? (
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  ["Plan Status", plan.planStatus],
                  ["Freeze Approval", plan.releaseCandidateFreezeApproved],
                  ["Candidate Frozen", plan.releaseCandidateFrozen],
                  ["Release Candidate Approved", plan.releaseCandidateApproved],
                  ["Deployment Executed", plan.deploymentExecuted],
                  ["Environment Promotion", plan.environmentPromotionAllowed],
                  ["Production Secrets", plan.productionSecretsActivated],
                  ["Public DNS Cutover", plan.publicDnsCutoverAllowed],
                  ["CDN/WAF/TLS", plan.cdnWafTlsEnabled],
                  ["Database Migration", plan.databaseMigrationAllowed],
                  ["Live External Action", plan.liveExternalActionPerformed],
                  ["Payment Capture", plan.paymentCaptureAllowed],
                  ["Notice Send", plan.borrowerNoticeSendAllowed],
                  ["Official Report", plan.officialReportPublicationAllowed],
                  ["Public Verification", plan.publicVerificationAllowed],
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
                        value === "RELEASE_CANDIDATE_FREEZE_BLOCKED"
                      }
                    >
                      {value === false ? "Blocked" : normalizeStatus(value)}
                    </StatusPill>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>No release candidate freeze plan returned.</EmptyState>
            )}
          </div>

          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 14 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>Freeze Controls</h2>
              <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                Pass items are attached evidence. Review and blocked items
                remain freeze and deployment blockers.
              </p>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {freezeItems.map((freezeItem, index) => {
                const row = isRecord(freezeItem) ? freezeItem : {};

                return (
                  <div
                    key={`${stringValue(row.id) ?? "freeze"}-${index}`}
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
                      <strong>{stringValue(row.label) ?? "Freeze"}</strong>
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
                Remaining Freeze Blockers
              </h3>
              {blockingReasons.length === 0 ? (
                <EmptyState>No blocking reasons returned.</EmptyState>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18, color: "#475569" }}>
                  {blockingReasons.slice(0, 16).map((reason, index) => (
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
