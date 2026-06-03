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
 * Module 39 - Production Reliance and Public Verification Boundary Gate
 *
 * Master Volume Governance:
 * - Vol 0: gives operators one reliance boundary surface after
 *   post-activation verification and before public or official reliance.
 * - Vol I: keeps reliance authority subordinate to constitutional governance,
 *   qualified ownership, separation of duties, and recorded human review.
 * - Vol II: blocks public verification, official reports, notice sends,
 *   payment capture, legal advice, commitments, regulatory reliance, production
 *   reliance, and official reliance.
 * - Vol III: consumes post-activation verification, public claims, public DTO,
 *   audit, replay, source authority, report, notice, payment, and live-action
 *   boundary evidence.
 * - Vol III-B: exposes classification, observability, version, and runtime
 *   posture for reliance boundary evidence review.
 * - Vol IV: supports release-board handoff, exception remediation, incident
 *   recovery, operator escalation, and evidence retention.
 * - Vol V: preserves content claims, data rights, controlled disclosure,
 *   replayability, explainability, redaction, and advisory-only boundaries.
 * - Vol VI: keeps source intelligence, public DTO, and portable surface
 *   governance blocked from public reliance until approved.
 */

const actorId = "module-39-production-reliance-verification";

type ModuleData = {
  reliance: LoadResult;
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

export default function ProductionRelianceVerificationPage() {
  const [data, setData] = useState<ModuleData>({ reliance: emptyLoad });
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

      const reliance = await loadJsonSurface(
        `/api/governance/production-reliance-verification?actorId=${actorId}`,
        ["productionRelianceVerificationReviews"]
      );

      setData({ reliance });
      setLastLoadedAt(new Date().toLocaleTimeString());
      setRefreshing(false);
    },
    []
  );

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const review = useMemo(
    () => firstRecord(data.reliance.rows),
    [data.reliance.rows]
  );
  const relianceItems = arrayFromRecord(review, "relianceItems");
  const blockingReasons = arrayFromRecord(review, "blockingReasons");
  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 39 Production Reliance and Public Verification Boundary Gate",
        "Internal production reliance and public verification boundary review surface",
        "Your document was received.",
        "Human review is pending.",
        "More information may be needed.",
        "No production reliance approval has been granted.",
        "No public verification authority has been granted.",
        "No public verification gateway has been made operational.",
        "No public verification artifact has been published.",
        "No external reliance disclosure has been approved.",
        "No regulatory reliance has been authorized.",
        "No official reliance has been created.",
        "No legal advice has been provided.",
        "No official report has been published.",
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
  const totalRelianceItems = nestedNumber(
    data.reliance.json,
    "totalRelianceItems"
  );
  const blocked = nestedNumber(data.reliance.json, "blocked");
  const reviewRequired = nestedNumber(data.reliance.json, "reviewRequired");
  const publicVerification = nestedNumber(
    data.reliance.json,
    "publicVerificationApprovalGranted"
  );
  const officialReliance = nestedNumber(
    data.reliance.json,
    "officialRelianceAllowed"
  );
  const productionReliance = nestedNumber(
    data.reliance.json,
    "productionRelianceApprovalGranted"
  );
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    productionReliance === 0
      ? "Production Reliance Blocked"
      : "Production Reliance Review",
    publicVerification === 0
      ? "Public Verification Blocked"
      : "Public Verification Review",
    officialReliance === 0
      ? "Official Reliance Blocked"
      : "Official Reliance Review",
    `Controls ${totalRelianceItems}`,
  ];

  const recordReliancePacket = useCallback(async () => {
    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch(
        "/api/governance/production-reliance-verification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            actorId,
            relianceScope: "platform",
            reviewNote: "module-39-production-reliance-boundary-evidence",
          }),
        }
      );
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ??
            "Production reliance and public verification review returned review."
        );
      } else {
        const reliancePacket = isRecord(json.reliancePacket)
          ? json.reliancePacket
          : {};

        setActionMessage(
          `Production reliance boundary packet recorded: ${shortId(
            reliancePacket.reliancePacketId
          )}. No production reliance approval, public verification authority, public verification gateway, public verification artifact publication, external reliance disclosure, regulatory reliance, official reliance, legal advice, post-activation verification approval, production health certification, go-live approval, deployment, public API exposure, portal launch, payment capture, notice send, official report publication, or live external action was approved.`
        );
        await loadAll({ clearActionMessage: false });
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown production reliance verification action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [loadAll]);

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="39"
          title="Production Reliance and Public Verification Boundary Gate"
          subtitle="Internal reliance boundary review. It packages post-activation verification, public claims, public DTO, audit, replay, source authority, report, notice, payment, legal, and live-action evidence only; it does not grant public verification or official reliance."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Reliance Controls",
              value: totalRelianceItems,
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
              label: "Public Verification",
              value: publicVerification,
              color: publicVerification === 0 ? "#0f766e" : "#be123c",
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
              "No production reliance approval has been granted.",
              "No public verification authority has been granted.",
              "No public verification gateway has been made operational.",
              "No public verification artifact has been published.",
              "No external reliance disclosure has been approved.",
              "No regulatory reliance has been authorized.",
              "No official reliance has been created.",
              "No legal advice has been provided.",
              "No post-activation verification approval has been granted.",
              "No post-activation verification has been started.",
              "No post-activation verification has been completed.",
              "No production health has been certified.",
              "No go-live approval has been granted.",
              "No deployment has been executed.",
              "No public production API exposure has been approved.",
              "No production portal launch has been executed.",
              "No borrower notice has been sent.",
              "No official report has been published.",
              "No payment capture has been enabled.",
              "This gate is production reliance and public verification boundary review evidence only.",
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
                  Reliance Boundary Review
                </h2>
                <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                  {lastLoadedAt
                    ? `Loaded ${lastLoadedAt}`
                    : "Loading governed reliance boundary review"}
                </p>
              </div>
              <ActionButton
                disabled={actionBusy}
                onClick={recordReliancePacket}
              >
                {actionBusy ? "Recording Packet" : "Record Reliance Packet"}
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

            {data.reliance.error ? (
              <EmptyState>{data.reliance.error}</EmptyState>
            ) : null}

            {review ? (
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  ["Review Status", review.reviewStatus],
                  ["Production Reliance", review.productionRelianceApprovalGranted],
                  ["Public Verification", review.publicVerificationApprovalGranted],
                  [
                    "Verification Gateway",
                    review.publicVerificationGatewayOperational,
                  ],
                  [
                    "Verification Artifact",
                    review.publicVerificationArtifactPublished,
                  ],
                  [
                    "External Reliance Disclosure",
                    review.externalRelianceDisclosureApproved,
                  ],
                  ["Regulatory Reliance", review.regulatoryRelianceAllowed],
                  ["Official Reliance", review.officialRelianceAllowed],
                  ["Legal Advice", review.legalAdviceProvided],
                  [
                    "Post-Activation Verification",
                    review.postActivationVerificationApprovalGranted,
                  ],
                  ["Production Health", review.productionHealthCertified],
                  [
                    "Production Activation",
                    review.productionActivationExecuted,
                  ],
                  ["Final Authority", review.finalAuthorityApprovalGranted],
                  ["Go-Live Approved", review.goLiveApproved],
                  ["Launch Authorized", review.productionLaunchAuthorized],
                  ["Deployment Executed", review.deploymentExecuted],
                  ["Public DNS", review.publicDnsCutoverAllowed],
                  [
                    "Public API Exposure",
                    review.publicProductionApiExposureAllowed,
                  ],
                  ["Production Portal Launch", review.productionPortalLaunchExecuted],
                  ["Customer Communications", review.customerCommunicationsReleased],
                  ["Public Status Page", review.publicStatusPageEnabled],
                  ["Borrower Notice Send", review.borrowerNoticeSendAllowed],
                  ["Official Report", review.officialReportPublicationAllowed],
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
                        value === "PRODUCTION_RELIANCE_VERIFICATION_BLOCKED"
                      }
                    >
                      {value === false ? "Blocked" : normalizeStatus(value)}
                    </StatusPill>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>No production reliance review returned.</EmptyState>
            )}
          </div>

          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 14 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>
                Reliance Boundary Controls
              </h2>
              <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                Pass items are attached evidence. Review and blocked items
                remain reliance, public verification, official report, notice,
                payment, legal, production, and live-action blockers.
              </p>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {relianceItems.length > 0 ? (
                relianceItems.map((item, index) => {
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
                <EmptyState>No reliance controls returned.</EmptyState>
              )}
            </div>
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
