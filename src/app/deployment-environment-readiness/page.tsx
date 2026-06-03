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
 * Module 29 - Deployment Environment Readiness Gate
 *
 * Master Volume Governance:
 * - Vol 0: gives operators one deployment environment readiness surface across
 *   the platform without executing deployment.
 * - Vol I: keeps release-candidate promotion subordinate to constitutional
 *   authority, release ownership, and qualified approval.
 * - Vol II: blocks approvals, official reports, notice sends, payment capture,
 *   public verification, legal advice, partner commitments, agency
 *   commitments, and underwriting reliance.
 * - Vol III: consumes build, typecheck, smoke, launch evidence, secrets,
 *   migrations, observability, rollback, incident, DNS, TLS, CDN, WAF, and
 *   backup readiness evidence.
 * - Vol III-B: exposes classification, observability, version, and runtime
 *   posture for deployment environment review.
 * - Vol IV: supports release manager review, deployment hold, rollback,
 *   incident bridge, support routing, and production freeze controls.
 * - Vol V: preserves content claims, data rights, controlled disclosure,
 *   replayability, explainability, and advisory-only boundaries.
 * - Vol VI: keeps source intelligence, public DTO, and portable surface
 *   governance blocked from live production exposure until approved.
 */

const actorId = "module-29-deployment-environment-readiness-gate";

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

export default function DeploymentEnvironmentReadinessPage() {
  const [data, setData] = useState<ModuleData>({ readiness: emptyLoad });
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
        `/api/governance/deployment-environment-readiness?actorId=${actorId}`,
        ["deploymentEnvironmentReviews"]
      );

      setData({ readiness });
      setLastLoadedAt(new Date().toLocaleTimeString());
      setRefreshing(false);
    },
    []
  );

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const review = useMemo(
    () => firstRecord(data.readiness.rows),
    [data.readiness.rows]
  );
  const environmentItems = arrayFromRecord(review, "environmentItems");
  const blockingReasons = arrayFromRecord(review, "blockingReasons");
  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 29 Deployment Environment Readiness Gate",
        "Internal deployment readiness review surface",
        "Your document was received.",
        "Human review is pending.",
        "More information may be needed.",
        "No deployment has been executed.",
        "No release candidate has been approved.",
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
  const totalEnvironmentItems = nestedNumber(
    data.readiness.json,
    "totalEnvironmentItems"
  );
  const blocked = nestedNumber(data.readiness.json, "blocked");
  const reviewRequired = nestedNumber(
    data.readiness.json,
    "reviewRequired"
  );
  const releaseCandidateApproved = nestedNumber(
    data.readiness.json,
    "releaseCandidateApproved"
  );
  const deploymentExecuted = nestedNumber(
    data.readiness.json,
    "deploymentExecuted"
  );
  const environmentPromotionAllowed = nestedNumber(
    data.readiness.json,
    "environmentPromotionAllowed"
  );
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    releaseCandidateApproved === 0
      ? "Release Candidate Blocked"
      : "Release Candidate Review",
    deploymentExecuted === 0 ? "Deployment Blocked" : "Deployment Review",
    environmentPromotionAllowed === 0
      ? "Environment Promotion Blocked"
      : "Promotion Review",
    `Controls ${totalEnvironmentItems}`,
  ];

  const recordDeploymentHold = useCallback(async () => {
    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch(
        "/api/governance/deployment-environment-readiness",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            actorId,
            environmentScope: "platform",
            reviewNote: "module-29-deployment-environment-hold",
          }),
        }
      );
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ??
            "Deployment environment readiness returned review."
        );
      } else {
        const deploymentHold = isRecord(json.deploymentHold)
          ? json.deploymentHold
          : {};

        setActionMessage(
          `Deployment environment hold recorded: ${shortId(
            deploymentHold.deploymentHoldId
          )}. No release candidate approval, deployment, production secret activation, public DNS cutover, production database migration, payment capture, borrower notice send, official report publication, public verification, or official reliance was approved.`
        );
        await loadAll({ clearActionMessage: false });
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown deployment environment readiness action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [loadAll]);

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="29"
          title="Deployment Environment Readiness Gate"
          subtitle="Internal deployment environment review. It packages release-candidate, environment, secrets, migration, observability, rollback, incident, DNS, TLS, CDN, WAF, and support evidence only; it does not deploy production or release go-live."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Environment Controls",
              value: totalEnvironmentItems,
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
              "No deployment has been executed.",
              "No release candidate has been approved.",
              "No production secret has been activated.",
              "No public DNS cutover has been approved.",
              "No production database migration has been approved.",
              "No production portal launch has been executed.",
              "No public verification authority has been granted.",
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
                  Deployment Environment Review
                </h2>
                <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                  {lastLoadedAt
                    ? `Loaded ${lastLoadedAt}`
                    : "Loading governed deployment environment review"}
                </p>
              </div>
              <ActionButton
                disabled={actionBusy}
                onClick={recordDeploymentHold}
              >
                {actionBusy ? "Recording Hold" : "Record Deployment Hold"}
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

            {review ? (
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  ["Review Status", review.reviewStatus],
                  ["Release Candidate", review.releaseCandidateApproved],
                  ["Deployment Executed", review.deploymentExecuted],
                  ["Environment Promotion", review.environmentPromotionAllowed],
                  ["Production Secrets", review.productionSecretsActivated],
                  ["Public DNS Cutover", review.publicDnsCutoverAllowed],
                  ["CDN/WAF/TLS", review.cdnWafTlsEnabled],
                  ["Database Migration", review.databaseMigrationAllowed],
                  ["Live External Action", review.liveExternalActionPerformed],
                  ["Payment Capture", review.paymentCaptureAllowed],
                  ["Notice Send", review.borrowerNoticeSendAllowed],
                  ["Official Report", review.officialReportPublicationAllowed],
                  ["Public Verification", review.publicVerificationAllowed],
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
                        value === "DEPLOYMENT_ENVIRONMENT_READINESS_BLOCKED"
                      }
                    >
                      {value === false ? "Blocked" : normalizeStatus(value)}
                    </StatusPill>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>No deployment environment review returned.</EmptyState>
            )}
          </div>

          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 14 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>
                Environment Controls
              </h2>
              <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                Pass items are attached evidence. Review and blocked items
                remain deployment blockers.
              </p>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {environmentItems.map((environmentItem, index) => {
                const row = isRecord(environmentItem) ? environmentItem : {};

                return (
                  <div
                    key={`${stringValue(row.id) ?? "environment"}-${index}`}
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
                      <strong>{stringValue(row.label) ?? "Environment"}</strong>
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
                Remaining Deployment Blockers
              </h3>
              {blockingReasons.length === 0 ? (
                <EmptyState>No blocking reasons returned.</EmptyState>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18, color: "#475569" }}>
                  {blockingReasons.slice(0, 14).map((reason, index) => (
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
