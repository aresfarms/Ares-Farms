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
  FieldLabel,
  LoadResult,
  ModuleHeader,
  ModuleScope,
  StatusPill,
  SummaryGrid,
  emptyScope,
  formatDateTime,
  inputStyle,
  isRecord,
  loadJsonSurface,
  moduleContainerStyle,
  moduleShellStyle,
  normalizeStatus,
  panelStyle,
  primaryRecord,
  scopeFromApplicationRows,
  scopeQuery,
  shortId,
  stringValue,
} from "@/app/internalModuleKit";

/**
 * Module 14 - Live Action and Sovereign Governance Gate
 *
 * Master Volume Governance:
 * - Vol I: preserves constitutional authority before live operational promotion.
 * - Vol II: protects connector, notice, payment, sovereign, borrower, and tenant boundaries.
 * - Vol III: consumes replay-safe execution authorization, readiness, and consent-gateway records.
 * - Vol III-B: surfaces classification, observability, version, and evidence posture.
 * - Vol IV: supports runbook, rollback, monitoring, incident response, escalation, and recovery.
 * - Vol V: enforces consent, isolation, sovereign defaults, replay, controlled disclosure, and no live action.
 */

const actorId = "module-14-live-action-sovereign-gate";

type ModuleData = {
  applications: LoadResult;
  readiness: LoadResult;
  gateways: LoadResult;
  connectors: LoadResult;
  notices: LoadResult;
  paymentConnectors: LoadResult;
  scope: ModuleScope;
};

const emptyLoad: LoadResult = {
  ok: true,
  count: 0,
  rows: [],
  traceId: null,
  error: null,
  json: null,
};

function readinessRecord(row: unknown): Record<string, unknown> {
  return primaryRecord(row, ["review"]);
}

function gatewayRecord(row: unknown): Record<string, unknown> {
  return primaryRecord(row, ["gatewayRecord"]);
}

function firstNestedRecordId(rows: unknown[], key: string): string | null {
  for (const row of rows) {
    if (!isRecord(row) || !Array.isArray(row[key])) {
      continue;
    }

    for (const value of row[key]) {
      if (!isRecord(value)) {
        continue;
      }

      const id = stringValue(value.id);

      if (id) {
        return id;
      }
    }
  }

  return null;
}

function suggestedTargetIdForAction(input: {
  actionType: string;
  connectors: LoadResult;
  notices: LoadResult;
  paymentConnectors: LoadResult;
}): string | null {
  if (input.actionType === "NOTICE_PROVIDER_SEND") {
    return firstNestedRecordId(input.notices.rows, "providerExecutions");
  }

  if (input.actionType === "PAYMENT_PROCESSOR_CAPTURE") {
    return firstNestedRecordId(input.paymentConnectors.rows, "executions");
  }

  return firstNestedRecordId(input.connectors.rows, "executions");
}

function actionTypeLabel(value: string): string {
  if (value === "NOTICE_PROVIDER_SEND") {
    return "Notice provider send";
  }

  if (value === "PAYMENT_PROCESSOR_CAPTURE") {
    return "Payment processor capture";
  }

  return "External connector call";
}

export default function LiveActionSovereignGatePage() {
  const [data, setData] = useState<ModuleData>({
    applications: emptyLoad,
    readiness: emptyLoad,
    gateways: emptyLoad,
    connectors: emptyLoad,
    notices: emptyLoad,
    paymentConnectors: emptyLoad,
    scope: emptyScope,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [actionType, setActionType] = useState("EXTERNAL_CONNECTOR_CALL");
  const [targetExecutionId, setTargetExecutionId] = useState("");
  const [tribalNation, setTribalNation] = useState(
    "Pending sovereign authority review"
  );

  const loadAll = useCallback(async () => {
    setRefreshing(true);
    setActionMessage(null);

    const applications = await loadJsonSurface(
      `/api/applications/admin?role=governance&userId=${actorId}&limit=10&includeProperty=true`,
      ["applications"]
    );
    const scope = scopeFromApplicationRows(applications.rows);
    const [
      readiness,
      gateways,
      connectors,
      notices,
      paymentConnectors,
    ] = scope.applicationId || scope.tenantId || scope.borrowerId
      ? await Promise.all([
          loadJsonSurface(
            `/api/governance/live-action-readiness/admin?role=governance&userId=${actorId}${scopeQuery(
              scope
            )}&limit=12&includeApplication=true&includeProperty=true`,
            ["readinessRecords"]
          ),
          loadJsonSurface(
            `/api/governance/sovereign-consent-gateway/admin?role=governance&userId=${actorId}${scopeQuery(
              scope
            )}&limit=12&includeApplication=true&includeProperty=true`,
            ["gatewayRecords"]
          ),
          loadJsonSurface(
            `/api/connectors/admin?role=governance&userId=${actorId}${scopeQuery(
              scope
            )}&limit=12&includeSource=true&includeAdapters=true&includeExecutions=true&includeApplication=true&includeProperty=true`,
            ["connectorRecords"]
          ),
          loadJsonSurface(
            `/api/notices/admin?role=governance&userId=${actorId}${scopeQuery(
              scope
            )}&limit=12&includeProviderExecutions=true&includeReceipts=true&includeResolutions=true`,
            ["noticeRecords"]
          ),
          scope.tenantId
            ? loadJsonSurface(
                `/api/billing/connectors/admin?role=governance&userId=${actorId}${scopeQuery(
                  scope,
                  ["tenantId"]
                )}&limit=12&includeExecutions=true&includeBillingEvents=true`,
                ["paymentConnectors"]
              )
            : emptyLoad,
        ])
      : [emptyLoad, emptyLoad, emptyLoad, emptyLoad, emptyLoad];

    setData({
      applications,
      readiness,
      gateways,
      connectors,
      notices,
      paymentConnectors,
      scope,
    });
    setLastLoadedAt(new Date().toLocaleTimeString());
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const suggestedTargetId = useMemo(() => {
    return suggestedTargetIdForAction({
      actionType,
      connectors: data.connectors,
      notices: data.notices,
      paymentConnectors: data.paymentConnectors,
    });
  }, [actionType, data.connectors, data.notices, data.paymentConnectors]);

  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 14 Live Action and Sovereign Governance Gate",
        "Internal live-action readiness and Sovereign Consent Gateway review surface",
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

  const recordReadinessReview = useCallback(async () => {
    if (!data.scope.tenantId || !targetExecutionId) {
      setActionMessage(
        "A governed tenant scope and target execution record are required."
      );
      return;
    }

    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch("/api/governance/live-action-readiness", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "governance",
          userId: actorId,
          actorId,
          tenantId: data.scope.tenantId,
          actionType,
          targetExecutionId,
          productionCredentialVaultRef:
            "module-14-production-credential-vault-review-required",
          liveAdapterImplementationRef:
            "module-14-live-adapter-implementation-review-required",
          productionRunbookApprovalRef:
            "module-14-production-runbook-approval-required",
          dryRunEvidenceRef: "module-14-dry-run-evidence-required",
          rollbackPlanRef: "module-14-rollback-plan-required",
          incidentResponsePlanRef:
            "module-14-incident-response-plan-required",
          monitoringPlanRef: "module-14-monitoring-plan-required",
          auditEvidenceExportRef:
            "module-14-audit-evidence-export-required",
          humanApprovalRef: "module-14-human-approval-required",
          metadata: {
            module: "Module 14 - Live Action and Sovereign Governance Gate",
            readinessReviewOnly: true,
            externalActionPerformed: false,
            liveActionPerformed: false,
          },
        }),
      });
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ?? "Live-action readiness returned review."
        );
      } else {
        const review = isRecord(json.review)
          ? primaryRecord(json.review, ["record"])
          : {};
        const result = isRecord(json.result) ? json.result : {};

        setActionMessage(
          `Readiness review recorded: ${shortId(
            review.id
          )} / ${normalizeStatus(result.readinessStatus)}`
        );
        await loadAll();
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown live-action readiness action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [actionType, data.scope.tenantId, loadAll, targetExecutionId]);

  const recordSovereignGatewayReview = useCallback(async () => {
    if (!data.scope.applicationId || !data.scope.tenantId) {
      setActionMessage("A governed application scope is required.");
      return;
    }

    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch(
        "/api/governance/sovereign-consent-gateway",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: "governance",
            userId: actorId,
            actorId,
            borrowerId: data.scope.borrowerId,
            tenantId: data.scope.tenantId,
            applicationId: data.scope.applicationId,
            gatewayId: `module-14-sovereign-gateway-${Date.now()}`,
            initiatingAuthorityId: actorId,
            initiatingAuthorityType: "NATIVE_OPERATOR",
            initiatingAuthorityRole: "AUTHORIZED_NATIVE_OPERATOR",
            verifiedIdentityEventRef:
              "module-14-identity-review-evidence-required",
            affirmativeInitiationRef:
              "module-14-affirmative-initiation-evidence-required",
            tribalNation,
            authorizedDataElements: [
              "public-registry-reference",
              "application-scoped-operational-metadata",
            ],
            authorizedWorkflowPhases: [
              "application-review",
              "governance-readiness-review",
            ],
            underwritingWindowClosesAt: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            nonProprietaryOnlyConfirmed: true,
            publiclyAccessibleRegistryOnly: true,
            applicationScopeConfirmed: true,
            workflowScopeConfirmed: true,
            bulkDataAcquisitionRequested: false,
            crossTransactionSharingRequested: false,
            competitiveIntelligenceRequested: false,
            aiTrainingRequested: false,
            proprietarySovereignRecordsRequested: false,
            platformInitiated: false,
            externalLegalFrameworkReviewed: true,
            complianceOfficerId: actorId,
            complianceReviewRef:
              "module-14-sovereign-compliance-review-required",
            complianceOfficerVerified: true,
            dataAccessEvents: [],
            metadata: {
              module: "Module 14 - Live Action and Sovereign Governance Gate",
              reviewOnly: true,
              dataAccessPerformed: false,
              scoringUseAllowed: false,
              underwritingUseAllowed: false,
            },
          }),
        }
      );
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ?? "Sovereign gateway returned review."
        );
      } else {
        const result = isRecord(json.result) ? json.result : {};
        const gateway =
          isRecord(json.gatewayRecord) && isRecord(json.gatewayRecord.gatewayRecord)
            ? json.gatewayRecord.gatewayRecord
            : isRecord(json.gatewayRecord)
              ? json.gatewayRecord
              : {};

        setActionMessage(
          `Sovereign gateway review recorded: ${shortId(
            gateway.id
          )} / ${normalizeStatus(result.gatewayStatus)}`
        );
        await loadAll();
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown sovereign gateway action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [data.scope, loadAll, tribalNation]);

  const readyCount = data.readiness.rows.filter(
    (row) => readinessRecord(row).readyForLiveAction === true
  ).length;
  const activeGatewayCount = data.gateways.rows.filter(
    (row) => gatewayRecord(row).gatewayActive === true
  ).length;
  const executionTargetCount =
    data.connectors.rows.length +
    data.notices.rows.length +
    data.paymentConnectors.rows.length;
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    `Scope ${data.scope.applicationId ?? data.scope.tenantId ?? "Unscoped"}`,
    "Readiness Review",
    "No Live Action",
  ];

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="14"
          title="Live Action and Sovereign Governance Gate"
          subtitle="Internal production-promotion readiness, live-action holds, and Sovereign Consent Gateway posture."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Readiness Reviews",
              value: data.readiness.count,
              color: "#2563eb",
            },
            {
              label: "Ready Records",
              value: readyCount,
              color: "#0f766e",
            },
            {
              label: "Gateway Records",
              value: data.gateways.count,
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
            gridTemplateColumns: "minmax(280px, 0.95fr) minmax(0, 1.35fr)",
            gap: 16,
            alignItems: "start",
          }}
        >
          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Gate Controls</h2>
            <FieldLabel label="Live-action review type">
              <select
                value={actionType}
                onChange={(event) => {
                  setActionType(event.target.value);
                  setTargetExecutionId("");
                }}
                style={inputStyle}
              >
                <option value="EXTERNAL_CONNECTOR_CALL">
                  External connector call
                </option>
                <option value="NOTICE_PROVIDER_SEND">Notice provider send</option>
                <option value="PAYMENT_PROCESSOR_CAPTURE">
                  Payment processor capture
                </option>
              </select>
            </FieldLabel>
            <FieldLabel label="Target execution record">
              <input
                value={targetExecutionId}
                onChange={(event) => setTargetExecutionId(event.target.value)}
                placeholder={suggestedTargetId ?? "No target execution available"}
                style={inputStyle}
              />
            </FieldLabel>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <ActionButton
                disabled={actionBusy || !suggestedTargetId}
                onClick={() => setTargetExecutionId(suggestedTargetId ?? "")}
              >
                Use Suggested Target
              </ActionButton>
              <ActionButton
                disabled={
                  actionBusy || !data.scope.tenantId || !targetExecutionId
                }
                onClick={() => void recordReadinessReview()}
              >
                Record Readiness Review
              </ActionButton>
            </div>
            <FieldLabel label="Sovereign authority context">
              <input
                value={tribalNation}
                onChange={(event) => setTribalNation(event.target.value)}
                style={inputStyle}
              />
            </FieldLabel>
            <ActionButton
              disabled={actionBusy || !data.scope.applicationId}
              onClick={() => void recordSovereignGatewayReview()}
            >
              Record Sovereign Gateway Review
            </ActionButton>
            {actionMessage ? (
              <p style={{ margin: 0, color: "#334155", lineHeight: 1.5 }}>
                {actionMessage}
              </p>
            ) : null}
            <p style={{ margin: 0, color: "#64748b", lineHeight: 1.5 }}>
              This gate records readiness and sovereign-consent posture only. It
              does not perform live external calls, notice sends, payment
              capture, data access, scoring use, or underwriting use.
            </p>
          </div>

          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Promotion Evidence</h2>
            <div
              style={{
                display: "grid",
                gap: 8,
                padding: 12,
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                background: "#f8fafc",
              }}
            >
              <strong>Suggested Target</strong>
              <span style={{ color: "#475569" }}>
                {actionTypeLabel(actionType)} /{" "}
                {suggestedTargetId ? shortId(suggestedTargetId) : "Not available"}
              </span>
              <span style={{ color: "#64748b", fontSize: 13 }}>
                Target source groups available: {executionTargetCount}
              </span>
            </div>

            <h3 style={{ margin: "8px 0 0", fontSize: 18 }}>
              Readiness Reviews
            </h3>
            {data.readiness.rows.length === 0 ? (
              <EmptyState>
                No live-action readiness records are available for the current
                governed scope.
              </EmptyState>
            ) : (
              data.readiness.rows.slice(0, 6).map((row) => {
                const review = readinessRecord(row);
                const id = stringValue(review.id);

                return (
                  <div
                    key={id ?? JSON.stringify(row)}
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
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <strong>{normalizeStatus(review.actionType)}</strong>
                      <StatusPill ok={review.liveActionPerformed !== true}>
                        {normalizeStatus(review.readinessStatus)}
                      </StatusPill>
                    </div>
                    <span style={{ color: "#475569" }}>
                      Target {shortId(review.targetExecutionId)}
                    </span>
                    <span style={{ color: "#64748b", fontSize: 13 }}>
                      Ready {normalizeStatus(review.readyForLiveAction)} / Live
                      action {normalizeStatus(review.liveActionPerformed)} /
                      Reviewed {formatDateTime(review.reviewedAt)}
                    </span>
                  </div>
                );
              })
            )}

            <h3 style={{ margin: "8px 0 0", fontSize: 18 }}>
              Sovereign Gateways
            </h3>
            {data.gateways.rows.length === 0 ? (
              <EmptyState>
                No Sovereign Consent Gateway records are available for the
                current governed scope.
              </EmptyState>
            ) : (
              data.gateways.rows.slice(0, 6).map((row) => {
                const gateway = gatewayRecord(row);
                const id =
                  stringValue(gateway.gatewayRecordId) ??
                  stringValue(gateway.id);

                return (
                  <div
                    key={id ?? JSON.stringify(row)}
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
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <strong>{shortId(gateway.gatewayId)}</strong>
                      <StatusPill ok={gateway.dataAccessPerformed !== true}>
                        {normalizeStatus(gateway.gatewayStatus)}
                      </StatusPill>
                    </div>
                    <span style={{ color: "#475569" }}>
                      {stringValue(gateway.tribalNation) ?? "Sovereign context pending"}
                    </span>
                    <span style={{ color: "#64748b", fontSize: 13 }}>
                      Active {normalizeStatus(gateway.gatewayActive)} / Data
                      access {normalizeStatus(gateway.dataAccessPerformed)} /
                      Scoring {normalizeStatus(gateway.scoringUseAllowed)}
                    </span>
                  </div>
                );
              })
            )}
            <span style={{ color: "#64748b", fontSize: 13 }}>
              Active sovereign gateway records: {activeGatewayCount}
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}
