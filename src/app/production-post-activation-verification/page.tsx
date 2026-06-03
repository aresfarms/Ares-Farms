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
 * Module 38 - Production Post-Activation Verification Gate
 *
 * Master Volume Governance:
 * - Vol 0: gives operators one post-activation verification readiness surface
 *   after activation ceremony evidence and before production reliance.
 * - Vol I: keeps verification authority subordinate to constitutional
 *   governance, dual control, qualified human ownership, and recorded review.
 * - Vol II: blocks approvals, production health certification, public
 *   exposure, official reports, notice sends, payment capture, public
 *   verification, legal advice, partner commitments, agency commitments, and
 *   official reliance.
 * - Vol III: consumes activation ceremony, health checks, public surface,
 *   audit, replay, monitoring, rollback, incident, support, communications,
 *   privacy, redaction, claims, and data-rights evidence.
 * - Vol III-B: exposes classification, observability, version, and runtime
 *   posture for post-activation verification evidence review.
 * - Vol IV: supports verification runbook review, watch-window ownership,
 *   rollback readiness, incident readiness, support readiness, and evidence
 *   retention.
 * - Vol V: preserves content claims, data rights, controlled disclosure,
 *   replayability, explainability, redaction, and advisory-only boundaries.
 * - Vol VI: keeps source intelligence, public DTO, and portable surface
 *   governance blocked from live production exposure until approved.
 */

const actorId = "module-38-production-post-activation-verification";

type ModuleData = {
  verification: LoadResult;
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

export default function ProductionPostActivationVerificationPage() {
  const [data, setData] = useState<ModuleData>({ verification: emptyLoad });
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

      const verification = await loadJsonSurface(
        `/api/governance/production-post-activation-verification?actorId=${actorId}`,
        ["productionPostActivationVerificationReviews"]
      );

      setData({ verification });
      setLastLoadedAt(new Date().toLocaleTimeString());
      setRefreshing(false);
    },
    []
  );

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const review = useMemo(
    () => firstRecord(data.verification.rows),
    [data.verification.rows]
  );
  const verificationItems = arrayFromRecord(review, "verificationItems");
  const blockingReasons = arrayFromRecord(review, "blockingReasons");
  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 38 Production Post-Activation Verification Gate",
        "Internal post-activation verification readiness review surface",
        "Your document was received.",
        "Human review is pending.",
        "More information may be needed.",
        "No post-activation verification approval has been granted.",
        "No post-activation verification has been started.",
        "No post-activation verification has been completed.",
        "No post-activation verification has passed.",
        "No production health has been certified.",
        "No production activation has been executed.",
        "No public production API exposure has been approved.",
        "No production portal launch has been executed.",
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
  const totalVerificationItems = nestedNumber(
    data.verification.json,
    "totalVerificationItems"
  );
  const blocked = nestedNumber(data.verification.json, "blocked");
  const reviewRequired = nestedNumber(data.verification.json, "reviewRequired");
  const verificationStarted = nestedNumber(
    data.verification.json,
    "postActivationVerificationStarted"
  );
  const verificationCompleted = nestedNumber(
    data.verification.json,
    "postActivationVerificationCompleted"
  );
  const productionHealthCertified = nestedNumber(
    data.verification.json,
    "productionHealthCertified"
  );
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    verificationStarted === 0
      ? "Verification Start Blocked"
      : "Verification Start Review",
    verificationCompleted === 0
      ? "Verification Completion Blocked"
      : "Verification Completion Review",
    productionHealthCertified === 0
      ? "Production Health Certification Blocked"
      : "Production Health Review",
    `Controls ${totalVerificationItems}`,
  ];

  const recordVerificationPacket = useCallback(async () => {
    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch(
        "/api/governance/production-post-activation-verification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            actorId,
            verificationScope: "platform",
            reviewNote:
              "module-38-production-post-activation-verification-evidence",
          }),
        }
      );
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ??
            "Production post-activation verification returned review."
        );
      } else {
        const verificationPacket = isRecord(json.verificationPacket)
          ? json.verificationPacket
          : {};

        setActionMessage(
          `Production post-activation verification packet recorded: ${shortId(
            verificationPacket.verificationPacketId
          )}. No post-activation verification approval, verification start, verification completion, production health certification, activation ceremony approval, ceremony execution, production activation, go-live approval, hold release, deployment, public API exposure, portal launch, payment capture, notice send, official report publication, public verification, legal advice, official reliance, or live external action was approved.`
        );
        await loadAll({ clearActionMessage: false });
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown production post-activation verification action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [loadAll]);

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="38"
          title="Production Post-Activation Verification Gate"
          subtitle="Internal post-activation verification readiness review. It packages activation ceremony, health check, public surface, audit, replay, monitoring, rollback, incident, support, communications, privacy, redaction, claims, data-rights, and watch-window evidence only; it does not start verification or certify production health."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Verification Controls",
              value: totalVerificationItems,
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
              label: "Health Certified",
              value: productionHealthCertified,
              color:
                productionHealthCertified === 0 ? "#0f766e" : "#be123c",
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
              "No post-activation verification approval has been granted.",
              "No post-activation verification has been started.",
              "No post-activation verification has been completed.",
              "No post-activation verification has passed.",
              "No production health has been certified.",
              "No activation ceremony approval has been granted.",
              "No activation ceremony has been executed.",
              "No production activation has been executed.",
              "No final production authority approval has been granted.",
              "No go-live approval has been granted.",
              "No production launch authorization has been granted.",
              "No launch hold has been released.",
              "No deployment hold has been released.",
              "No deployment has been executed.",
              "No production secret has been activated.",
              "No public DNS cutover has been approved.",
              "No production database migration has been approved.",
              "No public production API exposure has been approved.",
              "No production portal launch has been executed.",
              "No customer communication has been released.",
              "No public status page has been enabled.",
              "No borrower notice has been sent.",
              "No official report has been published.",
              "No public verification authority has been granted.",
              "No legal advice has been provided.",
              "No official reliance has been created.",
              "No payment capture has been enabled.",
              "This gate is post-activation verification readiness review evidence only.",
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
                  Post-Activation Verification Review
                </h2>
                <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                  {lastLoadedAt
                    ? `Loaded ${lastLoadedAt}`
                    : "Loading governed post-activation verification review"}
                </p>
              </div>
              <ActionButton
                disabled={actionBusy}
                onClick={recordVerificationPacket}
              >
                {actionBusy ? "Recording Packet" : "Record Verification Packet"}
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

            {data.verification.error ? (
              <EmptyState>{data.verification.error}</EmptyState>
            ) : null}

            {review ? (
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  ["Review Status", review.reviewStatus],
                  [
                    "Verification Approval",
                    review.postActivationVerificationApprovalGranted,
                  ],
                  [
                    "Verification Started",
                    review.postActivationVerificationStarted,
                  ],
                  [
                    "Verification Completed",
                    review.postActivationVerificationCompleted,
                  ],
                  [
                    "Verification Passed",
                    review.postActivationVerificationPassed,
                  ],
                  ["Production Health", review.productionHealthCertified],
                  [
                    "Ceremony Approval",
                    review.activationCeremonyApprovalGranted,
                  ],
                  ["Ceremony Executed", review.activationCeremonyExecuted],
                  [
                    "Production Activation",
                    review.productionActivationExecuted,
                  ],
                  ["Final Authority", review.finalAuthorityApprovalGranted],
                  ["Go-Live Approved", review.goLiveApproved],
                  ["Launch Authorized", review.productionLaunchAuthorized],
                  ["Launch Hold Released", review.launchHoldReleased],
                  ["Deployment Hold Released", review.deploymentHoldReleased],
                  ["Deployment Executed", review.deploymentExecuted],
                  ["Production Secret", review.productionSecretsActivated],
                  ["Public DNS", review.publicDnsCutoverAllowed],
                  ["Database Migration", review.databaseMigrationAllowed],
                  [
                    "Public API Exposure",
                    review.publicProductionApiExposureAllowed,
                  ],
                  ["Production Portal Launch", review.productionPortalLaunchExecuted],
                  ["Customer Communications", review.customerCommunicationsReleased],
                  ["Public Status Page", review.publicStatusPageEnabled],
                  ["Borrower Notice Send", review.borrowerNoticeSendAllowed],
                  ["Official Report", review.officialReportPublicationAllowed],
                  ["Public Verification", review.publicVerificationAllowed],
                  ["Legal Advice", review.legalAdviceProvided],
                  ["Official Reliance", review.officialRelianceAllowed],
                  ["Live External Action", review.liveExternalActionPerformed],
                  ["Payment Capture", review.paymentCaptureAllowed],
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
                        value ===
                          "PRODUCTION_POST_ACTIVATION_VERIFICATION_BLOCKED"
                      }
                    >
                      {value === false ? "Blocked" : normalizeStatus(value)}
                    </StatusPill>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>
                No production post-activation verification review returned.
              </EmptyState>
            )}
          </div>

          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 14 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>
                Post-Activation Verification Controls
              </h2>
              <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                Pass items are attached evidence. Review and blocked items
                remain verification, production health, activation, deployment,
                public exposure, and live-action blockers.
              </p>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {verificationItems.length > 0 ? (
                verificationItems.map((item, index) => {
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
                <EmptyState>
                  No post-activation verification controls returned.
                </EmptyState>
              )}
            </div>
          </div>
        </section>

        <section style={{ ...panelStyle, padding: 16, display: "grid", gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Blocking Reasons</h2>
          {blockingReasons.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {blockingReasons.map((reason, index) => (
                <li key={`${index}-${String(reason)}`}>{String(reason)}</li>
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
