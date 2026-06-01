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
 * Module 40 - Production Regulatory Examination and Evidence Archive Gate
 *
 * Master Volume Governance:
 * - Vol 0: gives operators one examination/archive readiness surface after
 *   reliance and public-verification boundary review.
 * - Vol I: keeps examination submission authority subordinate to
 *   constitutional governance, qualified legal/compliance ownership, and
 *   recorded human review.
 * - Vol II: blocks regulator submissions, official reports, notice sends,
 *   payment capture, legal advice, public verification, regulatory reliance,
 *   official reliance, and external commitments.
 * - Vol III: consumes audit, replay, retention, redaction, source authority,
 *   reports, notices, payments, communications, and live-action boundary
 *   evidence.
 * - Vol III-B: exposes classification, observability, version, and runtime
 *   posture for examination evidence review.
 * - Vol IV: supports examination preparation, archive readiness, legal hold,
 *   exception remediation, incident handoff, and evidence retention.
 * - Vol V: preserves content claims, data rights, controlled disclosure,
 *   replayability, explainability, redaction, and advisory-only boundaries.
 * - Vol VI: keeps source intelligence, public DTO, and portable surface
 *   governance blocked from official examiner disclosure until approved.
 */

const actorId = "module-40-production-regulatory-examination";

type ModuleData = {
  examination: LoadResult;
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

export default function ProductionRegulatoryExaminationPage() {
  const [data, setData] = useState<ModuleData>({ examination: emptyLoad });
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

      const examination = await loadJsonSurface(
        `/api/governance/production-regulatory-examination?actorId=${actorId}`,
        ["productionRegulatoryExaminationReviews"]
      );

      setData({ examination });
      setLastLoadedAt(new Date().toLocaleTimeString());
      setRefreshing(false);
    },
    []
  );

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const review = useMemo(
    () => firstRecord(data.examination.rows),
    [data.examination.rows]
  );
  const examinationItems = arrayFromRecord(review, "examinationItems");
  const blockingReasons = arrayFromRecord(review, "blockingReasons");
  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 40 Production Regulatory Examination and Evidence Archive Gate",
        "Internal regulatory examination and evidence archive readiness review surface",
        "Your document was received.",
        "Human review is pending.",
        "More information may be needed.",
        "No regulatory examination package has been approved.",
        "No regulatory examination package has been submitted.",
        "No regulator portal upload has been approved.",
        "No official regulator response has been issued.",
        "No evidence archive has been certified.",
        "No legal hold has been released.",
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
  const totalExaminationItems = nestedNumber(
    data.examination.json,
    "totalExaminationItems"
  );
  const blocked = nestedNumber(data.examination.json, "blocked");
  const reviewRequired = nestedNumber(
    data.examination.json,
    "reviewRequired"
  );
  const submitted = nestedNumber(
    data.examination.json,
    "regulatoryExaminationPackageSubmitted"
  );
  const archiveCertified = nestedNumber(
    data.examination.json,
    "examinationArchiveCertified"
  );
  const officialReliance = nestedNumber(
    data.examination.json,
    "officialRelianceAllowed"
  );
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    submitted === 0 ? "Regulator Submission Blocked" : "Submission Review",
    archiveCertified === 0 ? "Archive Certification Blocked" : "Archive Review",
    officialReliance === 0 ? "Official Reliance Blocked" : "Reliance Review",
    `Controls ${totalExaminationItems}`,
  ];

  const recordExaminationPacket = useCallback(async () => {
    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch(
        "/api/governance/production-regulatory-examination",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            actorId,
            examinationScope: "platform",
            reviewNote: "module-40-regulatory-examination-archive-evidence",
          }),
        }
      );
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ??
            "Production regulatory examination review returned review."
        );
      } else {
        const examinationPacket = isRecord(json.examinationPacket)
          ? json.examinationPacket
          : {};

        setActionMessage(
          `Regulatory examination packet recorded: ${shortId(
            examinationPacket.examinationPacketId
          )}. No regulatory package approval, regulator submission, portal upload, official regulator response, evidence archive certification, retention certification, legal hold release, external examiner disclosure, public verification, official reliance, legal advice, deployment, public API exposure, portal launch, payment capture, notice send, official report publication, or live external action was approved.`
        );
        await loadAll({ clearActionMessage: false });
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown regulatory examination action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [loadAll]);

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="40"
          title="Production Regulatory Examination and Evidence Archive Gate"
          subtitle="Internal examination and archive readiness review. It packages reliance boundary, audit, replay, retention, legal hold, redaction, source authority, report, notice, payment, communication, and live-action evidence only; it does not submit anything to a regulator."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Examination Controls",
              value: totalExaminationItems,
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
              label: "Submitted",
              value: submitted,
              color: submitted === 0 ? "#0f766e" : "#be123c",
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
              "No regulatory examination package has been approved.",
              "No regulatory examination package has been submitted.",
              "No regulator portal upload has been approved.",
              "No official regulator response has been issued.",
              "No evidence archive has been certified.",
              "No evidence retention certification has been granted.",
              "No legal hold has been released.",
              "No external examiner disclosure has been approved.",
              "No production reliance approval has been granted.",
              "No public verification authority has been granted.",
              "No official reliance has been created.",
              "No legal advice has been provided.",
              "No public production API exposure has been approved.",
              "No production portal launch has been executed.",
              "No borrower notice has been sent.",
              "No official report has been published.",
              "No payment capture has been enabled.",
              "This gate is regulatory examination and evidence archive readiness review only.",
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
                  Examination Readiness Review
                </h2>
                <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                  {lastLoadedAt
                    ? `Loaded ${lastLoadedAt}`
                    : "Loading governed examination review"}
                </p>
              </div>
              <ActionButton
                disabled={actionBusy}
                onClick={recordExaminationPacket}
              >
                {actionBusy
                  ? "Recording Packet"
                  : "Record Examination Packet"}
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

            {data.examination.error ? (
              <EmptyState>{data.examination.error}</EmptyState>
            ) : null}

            {review ? (
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  ["Review Status", review.reviewStatus],
                  [
                    "Package Approved",
                    review.regulatoryExaminationPackageApproved,
                  ],
                  [
                    "Package Submitted",
                    review.regulatoryExaminationPackageSubmitted,
                  ],
                  ["Portal Upload", review.regulatorPortalUploadAllowed],
                  ["Regulator Response", review.regulatoryResponseIssued],
                  ["Archive Certified", review.examinationArchiveCertified],
                  ["Retention Certified", review.evidenceRetentionCertified],
                  ["Legal Hold Released", review.legalHoldReleased],
                  [
                    "Examiner Disclosure",
                    review.externalExaminerDisclosureApproved,
                  ],
                  ["Production Reliance", review.productionRelianceApprovalGranted],
                  ["Public Verification", review.publicVerificationApprovalGranted],
                  ["Official Reliance", review.officialRelianceAllowed],
                  ["Legal Advice", review.legalAdviceProvided],
                  ["Production Health", review.productionHealthCertified],
                  [
                    "Production Activation",
                    review.productionActivationExecuted,
                  ],
                  ["Go-Live Approved", review.goLiveApproved],
                  ["Launch Authorized", review.productionLaunchAuthorized],
                  ["Deployment Executed", review.deploymentExecuted],
                  [
                    "Public API Exposure",
                    review.publicProductionApiExposureAllowed,
                  ],
                  ["Production Portal Launch", review.productionPortalLaunchExecuted],
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
                        value === "PRODUCTION_REGULATORY_EXAMINATION_BLOCKED"
                      }
                    >
                      {value === false ? "Blocked" : normalizeStatus(value)}
                    </StatusPill>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>No regulatory examination review returned.</EmptyState>
            )}
          </div>

          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 14 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>
                Examination and Archive Controls
              </h2>
              <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                Pass items are attached evidence. Review and blocked items
                remain examination, submission, archive, retention, legal,
                public verification, official reliance, report, notice,
                payment, production, and live-action blockers.
              </p>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {examinationItems.length > 0 ? (
                examinationItems.map((item, index) => {
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
                <EmptyState>No examination controls returned.</EmptyState>
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
